import { FormControl, Input, Box, Text, Avatar, IconButton, Spinner, useToast, Popover, PopoverTrigger, PopoverContent, PopoverBody, Image, CloseButton } from "@chakra-ui/react";
import "./styles.css";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { ArrowBackIcon, SearchIcon, CloseIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import EmojiPicker from "emoji-picker-react";

import io from "socket.io-client";
import InfoSidebar from "./miscellaneous/InfoSidebar";
import { ChatState } from "../Context/ChatProvider";
const ENDPOINT = "http://localhost:5000"; 
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Emoji state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState(false);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState("");

  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } = ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      setLoading(true);
      const { data } = await axios.get(`/api/message/${selectedChat._id}`, config);
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Generate previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setImagePreviews([]);
  };

  const clearAudio = () => {
    setAudioBlob(null);
    setAudioPreviewUrl("");
  };

  // Audio recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioPreviewUrl(URL.createObjectURL(blob));
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Microphone access denied or not available", status: "error", duration: 3000 });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendMessage = async (event) => {
    if (event.type === 'click' || (event.key === "Enter" && (newMessage || selectedFiles.length > 0 || audioBlob))) {
      if(!newMessage && selectedFiles.length === 0 && !audioBlob) return; // Prevent empty send on click
      
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };

        let imageUrls = [];
        if (selectedFiles.length > 0 || audioBlob) {
          setLoading(true);
          const formData = new FormData();
          
          if (selectedFiles.length > 0) {
            Array.from(selectedFiles).forEach(file => {
              formData.append("images", file);
            });
          }
          if (audioBlob) {
            // Give it a dummy filename so multer picks it up correctly
            formData.append("images", audioBlob, "audiomessage.webm");
          }
          
          const uploadConfig = {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${user.token}`,
            },
          };
          const { data: uploadData } = await axios.post("/api/upload", formData, uploadConfig);
          imageUrls = uploadData.urls;
          setLoading(false);
          clearFiles();
          clearAudio();
        }

        const msgContent = newMessage;
        setNewMessage("");
        
        const { data } = await axios.post(
          "/api/message",
          {
            content: msgContent,
            chatId: selectedChat,
            images: imageUrls,
          },
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        setLoading(false);
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();
    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;
    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  const onEmojiClick = (emojiObject) => {
    setNewMessage(prevInput => prevInput + emojiObject.emoji);
  };

  // Filter messages based on search query
  const filteredMessages = messages.filter(m => 
    m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {selectedChat ? (
        <Box display="flex" flexDir="row" w="100%" h="100%" overflow="hidden">
          {/* Main Chat Column */}
          <Box display="flex" flexDir="column" flex={1} h="100%">
            {/* Header */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            px={6}
            py={4}
            borderBottomWidth="1px"
            borderColor="#edf2f7"
          >
            <Box display="flex" alignItems="center" gap={4}>
              <IconButton
                display={{ base: "flex", md: "none" }}
                icon={<ArrowBackIcon />}
                onClick={() => setSelectedChat("")}
                variant="ghost"
              />
              <Avatar 
                size="md" 
                name={!selectedChat.isGroupChat ? getSender(user, selectedChat.users) : selectedChat.chatName} 
                src={!selectedChat.isGroupChat ? getSenderFull(user, selectedChat.users).pic : selectedChat.groupPic} 
              />
              <Box>
                <Text fontWeight="bold" color="#1a202c" fontSize="lg">
                  {!selectedChat.isGroupChat ? getSender(user, selectedChat.users) : selectedChat.chatName}
                </Text>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={4}>
              <IconButton 
                icon={<SearchIcon />} 
                variant="ghost" 
                color="gray.400" 
                borderRadius="full" 
                onClick={() => setShowSearch(!showSearch)}
              />
              <IconButton 
                icon={<i className="fas fa-ellipsis-v"></i>} 
                variant="ghost" 
                color="gray.400" 
                borderRadius="full" 
                onClick={() => setShowSidebar(!showSidebar)}
              />
            </Box>
          </Box>

          {/* Optional Search Bar */}
          {showSearch && (
            <Box px={6} py={2} bg="#f7fafc" borderBottomWidth="1px" borderColor="#edf2f7">
              <Input 
                placeholder="Search messages in this chat..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                bg="white"
                borderRadius="full"
                size="sm"
              />
            </Box>
          )}

          {/* Messages Area */}
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={6}
            bg="white"
            w="100%"
            h="100%"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
                color="blue.400"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={searchQuery ? filteredMessages : messages} istyping={istyping} />
              </div>
            )}

            {/* Preview Area (Images or Audio) */}
            {(imagePreviews.length > 0 || audioPreviewUrl) && (
              <Box display="flex" p={3} bg="#f7fafc" borderRadius="xl" mb={2} position="relative" flexWrap="wrap" gap={3}>
                <CloseButton position="absolute" top={1} right={1} size="sm" onClick={() => { clearFiles(); clearAudio(); }} />
                
                {imagePreviews.map((src, i) => (
                  <Image key={i} src={src} boxSize="80px" objectFit="cover" borderRadius="md" />
                ))}

                {audioPreviewUrl && (
                  <audio controls src={audioPreviewUrl} style={{ height: "40px", flex: 1 }} />
                )}
              </Box>
            )}

            {/* Input Area */}
            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={1}
              display="flex"
              alignItems="center"
              bg="#f7fafc"
              borderRadius="full"
              p={2}
              boxShadow="sm"
            >
              
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                id="file-upload" 
                style={{ display: "none" }} 
                onChange={handleFileChange} 
              />
              <label htmlFor="file-upload">
                <IconButton
                  icon={<i className="fas fa-plus"></i>}
                  as="span"
                  bg="#edf2f7"
                  color="#a0aec0"
                  _hover={{ color: "#2d3748", bg: "#e2e8f0" }}
                  borderRadius="full"
                  cursor="pointer"
                  size="sm"
                  ml={1}
                />
              </label>

              <Input
                variant="unstyled"
                bg="transparent"
                placeholder="Type a message..."
                value={newMessage}
                onChange={typingHandler}
                borderRadius="full"
                px={4}
                py={2}
                fontSize="md"
                color="#1a202c"
                _placeholder={{ color: "gray.400" }}
                _focus={{
                  outline: "none",
                }}
              />
              
              <Popover isOpen={showEmojiPicker} onClose={() => setShowEmojiPicker(false)} placement="top-end">
                <PopoverTrigger>
                  <IconButton
                    icon={<i className="far fa-smile"></i>}
                    variant="ghost"
                    color="#a0aec0"
                    _hover={{ color: "#2d3748" }}
                    borderRadius="full"
                    size="sm"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  />
                </PopoverTrigger>
                <PopoverContent w="auto" bg="transparent" border="none" boxShadow="none">
                  <PopoverBody p={0}>
                    <EmojiPicker onEmojiClick={onEmojiClick} />
                  </PopoverBody>
                </PopoverContent>
              </Popover>

              <IconButton
                icon={<i className="fas fa-microphone"></i>}
                variant="ghost"
                color={isRecording ? "red.500" : "#a0aec0"}
                bg={isRecording ? "red.100" : "transparent"}
                _hover={{ color: isRecording ? "red.600" : "#2d3748" }}
                borderRadius="full"
                size="sm"
                mr={1}
                onClick={toggleRecording}
                className={isRecording ? "pulse-animation" : ""}
              />
              
              {(newMessage || selectedFiles.length > 0 || audioBlob) && (
                <IconButton
                  icon={<i className="fas fa-paper-plane"></i>}
                  bg="blue.400"
                  color="white"
                  _hover={{ bg: "blue.500" }}
                  borderRadius="full"
                  size="sm"
                  onClick={(e) => sendMessage(e)}
                />
              )}
            </FormControl>
          </Box>
          </Box>

          {/* Right Info Sidebar */}
          <InfoSidebar 
            isOpen={showSidebar} 
            onClose={() => setShowSidebar(false)} 
            messages={messages}
            fetchMessages={fetchMessages}
            fetchAgain={fetchAgain}
            setFetchAgain={setFetchAgain}
          />
        </Box>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" h="100%" w="100%">
          <Text fontSize="2xl" pb={3} fontFamily="Outfit" color="gray.400" fontWeight="400">
            Click on a chat to start messaging
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
