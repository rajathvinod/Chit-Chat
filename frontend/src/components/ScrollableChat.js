import { Avatar } from "@chakra-ui/react";
import { Tooltip } from "@chakra-ui/react";
import { Box, Text } from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";
import {
  isLastMessage,
  isSameSender,
  isSameSenderMargin,
  isSameUser,
} from "../config/ChatLogics";
import { ChatState } from "../Context/ChatProvider";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import { getSenderFull } from "../config/ChatLogics";

const ScrollableChat = ({ messages, istyping }) => {
  const { user, selectedChat } = ChatState();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  const isAudioFile = (url) => {
    return url.match(/\.(mp3|wav|webm|mp4|ogg)$/i) || url.includes("audiomessage");
  };

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex", alignItems: "flex-end" }} key={m._id}>
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                <Avatar
                  mt="7px"
                  mr={2}
                  mb={1}
                  size="sm"
                  cursor="pointer"
                  name={m.sender.name}
                  src={m.sender.pic}
                />
              </Tooltip>
            )}
            <Box
              display="flex"
              flexDir="column"
              style={{
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                maxWidth: "75%",
                background: m.sender._id === user._id 
                  ? "linear-gradient(135deg, #a0c4ff 0%, #c4e0ff 100%)" 
                  : "white",
                color: m.sender._id === user._id ? "white" : "#4a5568",
                borderRadius: m.sender._id === user._id ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                padding: "4px", // Tight padding for images
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                border: "none",
                marginBottom: "4px"
              }}
            >
              {/* Media (Images or Audio) */}
              {m.images && m.images.length > 0 && (
                <Box display="flex" flexDir="column" gap={1}>
                  {m.images.map((img, idx) => {
                    if (isAudioFile(img)) {
                      return (
                        <audio 
                          key={idx} 
                          controls 
                          src={img} 
                          style={{ 
                            width: "250px", 
                            height: "40px", 
                            marginTop: "8px",
                            marginLeft: "8px",
                            marginRight: "8px",
                            borderRadius: "20px"
                          }} 
                        />
                      );
                    }
                    return (
                      <img 
                        key={idx} 
                        src={img} 
                        alt="attachment" 
                        style={{ 
                          borderRadius: "16px", 
                          maxHeight: "300px",
                          maxWidth: "100%",
                          objectFit: "cover"
                        }} 
                      />
                    );
                  })}
                </Box>
              )}
              
              {/* Text Caption */}
              <Box px={3} py={1} display="flex" flexDir="column">
                {m.content && (
                  <Text fontSize="md" mb={1}>{m.content}</Text>
                )}
                
                {/* Timestamp */}
                <Text 
                  fontSize="10px" 
                  color={m.sender._id === user._id ? "rgba(255,255,255,0.8)" : "gray.400"}
                  alignSelf={m.sender._id === user._id ? "flex-end" : "flex-start"}
                  mt={m.content ? 0 : 1}
                >
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Box>
            </Box>
          </div>
        ))}
        
      {istyping && (
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Avatar
            mt="7px"
            mr={2}
            mb={1}
            size="sm"
            cursor="pointer"
            name={selectedChat?.isGroupChat ? selectedChat.chatName : getSenderFull(user, selectedChat?.users)?.name}
            src={selectedChat?.isGroupChat ? selectedChat.groupPic : getSenderFull(user, selectedChat?.users)?.pic}
          />
          <Box
            display="flex"
            flexDir="column"
            style={{
              marginLeft: 0,
              marginTop: 10,
              maxWidth: "75%",
              background: "white",
              borderRadius: "20px 20px 20px 5px",
              padding: "5px 15px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
              border: "none",
              marginBottom: "4px"
            }}
          >
            <Lottie
              options={defaultOptions}
              width={40}
              height={20}
              style={{ marginBottom: 0, marginLeft: 0 }}
            />
          </Box>
        </div>
      )}
    </ScrollableFeed>
  );
};

export default ScrollableChat;
