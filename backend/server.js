const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const path = require("path");

const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();

connectDB();

const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/upload", uploadRoutes);

// Deployment
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === "production") {
  // If using Create React App
  const frontendPath = path.join(__dirname1, "frontend", "build");

  app.use(express.static(frontendPath));

  // React Router fallback
  app.get("/{*splat}", (req, res, next) => {
    // Don't return React's index.html for unknown API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.join(frontendPath, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}...`);
});

// Socket.IO
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  let userData;

  // Setup user
  socket.on("setup", (data) => {
    userData = data;

    if (!userData?._id) {
      console.log("Invalid user data");
      return;
    }

    socket.join(userData._id);
    socket.emit("connected");
  });

  // Join chat room
  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  // Typing
  socket.on("typing", (room) => {
    socket.in(room).emit("typing");
  });

  // Stop typing
  socket.on("stop typing", (room) => {
    socket.in(room).emit("stop typing");
  });

  // New message
  socket.on("new message", (newMessageReceived) => {
    const chat = newMessageReceived.chat;

    if (!chat || !chat.users) {
      console.log("chat.users not defined");
      return;
    }

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) {
        return;
      }

      socket.in(user._id).emit("message recieved", newMessageReceived);
    });
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");

    if (userData?._id) {
      socket.leave(userData._id);
    }
  });
});
