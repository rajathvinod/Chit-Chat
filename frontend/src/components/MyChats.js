import { AddIcon, BellIcon, SearchIcon } from "@chakra-ui/icons";
import { Box, Stack, Text, Avatar, Input, InputGroup, InputLeftElement, Menu, MenuButton, MenuList, MenuItem, MenuDivider } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import { getSender } from "../config/ChatLogics";
import ChatLoading from "./ChatLoading";
import { Button } from "@chakra-ui/react";
import { ChatState } from "../Context/ChatProvider";
import NotificationBadge from "react-notification-badge";
import { Effect } from "react-notification-badge";
import ProfileModal from "./miscellaneous/ProfileModal";
import { useNavigate } from "react-router-dom";
import SideDrawer from "./miscellaneous/SideDrawer"; // We will rename this or just use it as Search Drawer
import GroupChatModal from "./miscellaneous/GroupChatModal";

const MyChats = ({ fetchAgain }) => {
  const [loggedUser, setLoggedUser] = useState();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All"); // All, Friends, Groups

  const { selectedChat, setSelectedChat, user, chats, setChats, notification, setNotification } = ChatState();
  const toast = useToast();
  const navigate = useNavigate();

  const isAudioFile = (url) => url && (url.match(/\.(mp3|wav|webm|mp4|ogg)$/i) || url.includes("audiomessage"));

  const fetchChats = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get("/api/chat", config);
      setChats(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the chats",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  useEffect(() => {
    setLoggedUser(JSON.parse(localStorage.getItem("userInfo")));
    fetchChats();
    // eslint-disable-next-line
  }, [fetchAgain]);

  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  // Filter chats based on tab and search query
  const filteredChats = chats?.filter((chat) => {
    // Tab filtering
    if (tab === "Friends" && chat.isGroupChat) return false;
    if (tab === "Groups" && !chat.isGroupChat) return false;

    // Search filtering
    if (search) {
      const chatName = !chat.isGroupChat ? getSender(loggedUser, chat.users) : chat.chatName;
      if (!chatName.toLowerCase().includes(search.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <Box
      display={{ base: selectedChat ? "none" : "flex", md: "flex" }}
      flexDir="column"
      p={4}
      bg="white"
      w={{ base: "100%", md: "350px" }} // Fixed width to match mockup
      borderRadius="2xl"
      borderWidth="1px"
      borderColor="#edf2f7"
      h="100%"
      boxShadow="sm"
    >
      {/* Header section: Profile, Notifications, Menu */}
      <Box display="flex" w="100%" justifyContent="space-between" alignItems="center" mb={4}>
        <Avatar size="sm" cursor="pointer" name={user.name} src={user.pic} />
        <Box display="flex" alignItems="center" gap={2}>
          <Menu>
            <MenuButton p={1}>
              <NotificationBadge count={notification.length} effect={Effect.SCALE} />
              <BellIcon fontSize="xl" color="#718096" />
            </MenuButton>
            <MenuList pl={2} bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" border="none" boxShadow="xl" borderRadius="xl" p={2}>
              {!notification.length && <Text px={2}>No New Messages</Text>}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                  }}
                  borderRadius="md"
                  _hover={{ bg: "#f0f4f8" }}
                  px={3}
                  py={2}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
          <Menu>
            <MenuButton as={Button} bg="transparent" p={0} _hover={{ bg: "transparent" }}>
              <i className="fas fa-ellipsis-v" style={{ color: "#718096" }}></i>
            </MenuButton>
            <MenuList bg="rgba(255, 255, 255, 0.9)" backdropFilter="blur(10px)" border="none" boxShadow="xl" borderRadius="xl">
              <ProfileModal user={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </Box>
      </Box>

      {/* Search Input and Group Button */}
      <Box mb={4} display="flex" gap={2}>
        <InputGroup>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            placeholder="Search chats"
            bg="#f7fafc"
            border="none"
            borderRadius="full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            _focus={{ bg: "#edf2f7" }}
          />
        </InputGroup>
        <GroupChatModal>
          <Button 
            borderRadius="full" 
            bg="#f7fafc" 
            color="#1a202c" 
            _hover={{ bg: "#edf2f7" }}
            px={3}
          >
            <AddIcon />
          </Button>
        </GroupChatModal>
      </Box>

      {/* Tabs */}
      <Box display="flex" w="100%" gap={2} mb={4}>
        <Button
          size="sm"
          borderRadius="full"
          bg={tab === "All" ? "#1a202c" : "transparent"}
          color={tab === "All" ? "white" : "#718096"}
          _hover={{ bg: tab === "All" ? "#2d3748" : "#edf2f7" }}
          onClick={() => setTab("All")}
        >
          All <Box as="span" ml={1} fontSize="xs" bg={tab === "All" ? "#4a5568" : "#e2e8f0"} color={tab === "All" ? "white" : "gray.600"} px={2} py={0.5} borderRadius="full">{chats?.length || 0}</Box>
        </Button>
        <Button
          size="sm"
          borderRadius="full"
          bg={tab === "Friends" ? "#1a202c" : "transparent"}
          color={tab === "Friends" ? "white" : "#718096"}
          _hover={{ bg: tab === "Friends" ? "#2d3748" : "#edf2f7" }}
          onClick={() => setTab("Friends")}
        >
          Friends
        </Button>
        <Button
          size="sm"
          borderRadius="full"
          bg={tab === "Groups" ? "#1a202c" : "transparent"}
          color={tab === "Groups" ? "white" : "#718096"}
          _hover={{ bg: tab === "Groups" ? "#2d3748" : "#edf2f7" }}
          onClick={() => setTab("Groups")}
        >
          Groups
        </Button>
      </Box>

      {/* Chat List */}
      <Box
        display="flex"
        flexDir="column"
        bg="white"
        w="100%"
        h="100%"
        overflowY="hidden"
      >
        {chats ? (
          <Stack overflowY="scroll" spacing={0}>
            {filteredChats.map((chat) => (
              <Box
                onClick={() => setSelectedChat(chat)}
                cursor="pointer"
                bg={selectedChat === chat ? "#f7fafc" : "white"}
                color="#1a202c"
                px={3}
                py={3}
                borderRadius="xl"
                transition="all 0.2s"
                _hover={{
                  bg: "#f7fafc",
                }}
                key={chat._id}
                display="flex"
                alignItems="center"
                gap={3}
              >
                <Avatar 
                  size="md" 
                  name={!chat.isGroupChat ? getSender(loggedUser, chat.users) : chat.chatName} 
                  src={!chat.isGroupChat ? (chat.users[0]?._id === loggedUser?._id ? chat.users[1]?.pic : chat.users[0]?.pic) : chat.groupPic} 
                />
                <Box flex={1} overflow="hidden">
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Text fontWeight="bold" noOfLines={1}>
                      {!chat.isGroupChat
                        ? getSender(loggedUser, chat.users)
                        : chat.chatName}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {/* Placeholder for time, could be derived from chat.updatedAt */}
                      {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Box>
                  {chat.latestMessage && (
                    <Text fontSize="sm" color={selectedChat === chat ? "gray.600" : "gray.500"} noOfLines={1}>
                      {chat.latestMessage.content ? (
                        chat.latestMessage.content
                      ) : (
                        chat.latestMessage.images && chat.latestMessage.images.length > 0
                          ? (isAudioFile(chat.latestMessage.images[0]) ? "Shared an audio message" : `Shared ${chat.latestMessage.images.length} photo(s)`)
                          : "Attachment"
                      )}
                    </Text>
                  )}
                </Box>
              </Box>
            ))}
          </Stack>
        ) : (
          <ChatLoading />
        )}
      </Box>

      {/* Start New Chat Button triggers SideDrawer (Search) */}
      <Box w="100%" pt={4} display="flex" justifyContent="center" mt="auto">
        <SideDrawer>
            <Button
              display="flex"
              w="100%"
              borderRadius="xl"
              bg="#1a202c"
              color="white"
              leftIcon={<i className="fas fa-edit"></i>}
              _hover={{
                bg: "#2d3748",
              }}
              py={6}
            >
              Start a new chat
            </Button>
        </SideDrawer>
      </Box>
    </Box>
  );
};

export default MyChats;
