import { CloseIcon, SearchIcon } from "@chakra-ui/icons";
import {
  Box,
  Text,
  Image,
  IconButton,
  VStack,
  HStack,
  Divider,
  Button,
  Input,
  Spinner,
  useToast,
  FormControl,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import { getSender, getSenderFull } from "../../config/ChatLogics";
import UserListItem from "../userAvatar/UserListItem";

const InfoSidebar = ({ isOpen, onClose, messages, fetchMessages, fetchAgain, setFetchAgain }) => {
  const { selectedChat, setSelectedChat, user } = ChatState();

  // Group specific states
  const [groupChatName, setGroupChatName] = useState("");
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameloading, setRenameLoading] = useState(false);
  const [picLoading, setPicLoading] = useState(false);

  const toast = useToast();

  if (!isOpen || !selectedChat) return null;

  const isGroupChat = selectedChat.isGroupChat;
  const chatName = !isGroupChat ? getSender(user, selectedChat.users) : selectedChat.chatName;
  const chatAvatar = !isGroupChat ? getSenderFull(user, selectedChat.users).pic : selectedChat.groupPic;
  const chatEmail = !isGroupChat ? getSenderFull(user, selectedChat.users).email : "";
  const isAdmin = isGroupChat && selectedChat.groupAdmin._id === user._id;

  // Filter messages to find media
  const mediaMessages = messages ? messages.filter(m => m.images && m.images.length > 0) : [];
  let mediaItems = [];
  mediaMessages.forEach(m => {
    if (m.images) mediaItems.push(...m.images);
  });

  const isAudioFile = (url) => url.match(/\.(mp3|wav|webm|mp4|ogg)$/i) || url.includes("audiomessage");

  // Group functions
  const handleRename = async () => {
    if (!groupChatName) return;
    try {
      setRenameLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(
        `/api/chat/rename`,
        { chatId: selectedChat._id, chatName: groupChatName },
        config
      );
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setRenameLoading(false);
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response?.data?.message, status: "error", duration: 5000, isClosable: true, position: "bottom" });
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !isAdmin) return;
    try {
      setPicLoading(true);
      const formData = new FormData();
      formData.append("images", file);
      const uploadConfig = { headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${user.token}` } };
      const { data: uploadData } = await axios.post("/api/upload", formData, uploadConfig);
      const imageUrl = uploadData.urls[0];

      const updateConfig = { headers: { "Content-Type": "application/json", Authorization: `Bearer ${user.token}` } };
      const { data: updatedChat } = await axios.put(
        "/api/chat/group-pic",
        { chatId: selectedChat._id, pic: imageUrl },
        updateConfig
      );

      setSelectedChat(updatedChat);
      setFetchAgain(!fetchAgain);
      toast({ title: "Group Picture Updated!", status: "success", duration: 3000, isClosable: true, position: "bottom" });
      setPicLoading(false);
    } catch (error) {
      setPicLoading(false);
      toast({ title: "Error Occured!", description: "Failed to update group picture.", status: "error", duration: 5000, isClosable: true, position: "bottom" });
    }
  };

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) {
      setSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/user?search=${query}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      setLoading(false);
    }
  };

  const handleAddUser = async (user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      toast({ title: "User Already in group!", status: "error", duration: 5000, isClosable: true, position: "bottom" });
      return;
    }
    if (!isAdmin) return;

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/chat/groupadd`, { chatId: selectedChat._id, userId: user1._id }, config);
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
      setSearch("");
      setSearchResult([]);
    } catch (error) {
      toast({ title: "Error", description: error.response?.data?.message, status: "error", duration: 5000, isClosable: true, position: "bottom" });
      setLoading(false);
    }
  };

  const handleRemove = async (user1) => {
    if (!isAdmin && user1._id !== user._id) return;
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/chat/groupremove`, { chatId: selectedChat._id, userId: user1._id }, config);
      user1._id === user._id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response?.data?.message, status: "error", duration: 5000, isClosable: true, position: "bottom" });
      setLoading(false);
    }
  };

  return (
    <Box
      w={{ base: "100%", md: "350px", lg: "400px" }}
      h="100%"
      bg="#f0f2f5"
      borderLeftWidth="1px"
      borderColor="#edf2f7"
      display="flex"
      flexDir="column"
      transition="all 0.3s"
      boxShadow="-2px 0 5px rgba(0,0,0,0.05)"
    >
      {/* Header */}
      <Box h="60px" bg="white" display="flex" alignItems="center" px={4} borderBottomWidth="1px" borderColor="#edf2f7">
        <IconButton
          icon={<CloseIcon />}
          variant="ghost"
          onClick={onClose}
          mr={3}
          borderRadius="full"
        />
        <Text fontSize="md" fontWeight="600" color="#1a202c">
          {isGroupChat ? "Group info" : "Contact info"}
        </Text>
      </Box>

      <Box flex={1} overflowY="auto" overflowX="hidden">
        {/* Profile Details Section */}
        <Box bg="white" display="flex" flexDir="column" alignItems="center" py={6} px={4} mb={2} boxShadow="sm">
          <Box position="relative">
            <Image
              borderRadius="full"
              boxSize="160px"
              src={chatAvatar || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"}
              alt={chatName}
              objectFit="cover"
              boxShadow="lg"
            />
            {isGroupChat && isAdmin && (
              <>
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  w="100%"
                  h="100%"
                  borderRadius="full"
                  bg="rgba(0,0,0,0.4)"
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  opacity={0}
                  _hover={{ opacity: 1 }}
                  transition="all 0.2s"
                  cursor="pointer"
                >
                  {picLoading ? (
                    <Spinner color="white" />
                  ) : (
                    <VStack spacing={0}>
                      <i className="fas fa-camera" style={{ color: "white", fontSize: "24px" }}></i>
                      <Text color="white" fontSize="xs" fontWeight="bold" mt={1}>CHANGE</Text>
                    </VStack>
                  )}
                </Box>
                <input
                  type="file"
                  accept="image/*"
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                  onChange={handlePicChange}
                  disabled={picLoading}
                />
              </>
            )}
          </Box>
          <Text fontSize="2xl" fontWeight="bold" mt={4} color="#1a202c">
            {chatName}
          </Text>
          <Text fontSize="md" color="gray.500">
            {isGroupChat ? `Group • ${selectedChat.users.length} participants` : chatEmail}
          </Text>

          {/* Action Buttons */}
          {/* <HStack mt={6} spacing={8}>
            <VStack cursor="pointer" color="#3182ce" _hover={{ color: "#2b6cb0" }}>
              <Box bg="#ebf4ff" p={3} borderRadius="full"><i className="fas fa-phone-alt" style={{ fontSize: "20px" }}></i></Box>
              <Text fontSize="xs" fontWeight="600">Audio</Text>
            </VStack>
            <VStack cursor="pointer" color="#3182ce" _hover={{ color: "#2b6cb0" }}>
              <Box bg="#ebf4ff" p={3} borderRadius="full"><i className="fas fa-video" style={{ fontSize: "20px" }}></i></Box>
              <Text fontSize="xs" fontWeight="600">Video</Text>
            </VStack>
            <VStack cursor="pointer" color="#3182ce" _hover={{ color: "#2b6cb0" }}>
              <Box bg="#ebf4ff" p={3} borderRadius="full"><SearchIcon fontSize="20px" /></Box>
              <Text fontSize="xs" fontWeight="600">Search</Text>
            </VStack>
          </HStack> */}
        </Box>

        {/* Media Section */}
        <Box bg="white" py={4} px={5} mb={2} boxShadow="sm">
          <Text color="gray.500" fontSize="sm" fontWeight="600" mb={3}>
            Media, links and docs ({mediaItems.length})
          </Text>
          {mediaItems.length > 0 ? (
            <HStack overflowX="auto" spacing={2} pb={2} css={{ "&::-webkit-scrollbar": { height: "6px" }, "&::-webkit-scrollbar-thumb": { background: "#cbd5e0", borderRadius: "10px" } }}>
              {mediaItems.map((url, i) => (
                <Box key={i} flexShrink={0} w="80px" h="80px" bg="gray.100" borderRadius="md" overflow="hidden">
                  {isAudioFile(url) ? (
                    <Box w="100%" h="100%" display="flex" alignItems="center" justifyContent="center" bg="#ebf4ff">
                      <i className="fas fa-music" style={{ color: "#3182ce", fontSize: "24px" }}></i>
                    </Box>
                  ) : (
                    <Image src={url} w="100%" h="100%" objectFit="cover" />
                  )}
                </Box>
              ))}
            </HStack>
          ) : (
            <Text fontSize="sm" color="gray.400">No media found in this chat.</Text>
          )}
        </Box>

        {/* Group Info Section */}
        {isGroupChat && (
          <Box bg="white" py={4} px={5} mb={2} boxShadow="sm">
            <Text color="teal.500" fontSize="sm" fontWeight="600" mb={3}>
              {selectedChat.users.length} participants
            </Text>

            {isAdmin && (
              <Box mb={4}>
                <HStack mb={2}>
                  <Box w="40px" h="40px" borderRadius="full" bg="#38a169" color="white" display="flex" alignItems="center" justifyContent="center">
                    <i className="fas fa-user-plus"></i>
                  </Box>
                  <Text fontWeight="500" color="#38a169" fontSize="md">Add participant</Text>
                </HStack>
                <Input
                  placeholder="Search to add..."
                  onChange={(e) => handleSearch(e.target.value)}
                  bg="#f7fafc"
                  border="none"
                  borderRadius="full"
                  size="sm"
                  mb={2}
                />
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  searchResult?.slice(0, 3).map((u) => (
                    <UserListItem key={u._id} user={u} handleFunction={() => handleAddUser(u)} />
                  ))
                )}
                <Divider my={3} />
                <FormControl display="flex" mt={2}>
                  <Input
                    placeholder="Change Group Subject"
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                    bg="#f7fafc"
                    border="none"
                    borderRadius="full"
                    size="sm"
                  />
                  <Button size="sm" ml={2} bg="#1a202c" color="white" _hover={{ bg: "#2d3748" }} isLoading={renameloading} onClick={handleRename}>
                    Save
                  </Button>
                </FormControl>
                <Divider my={3} />
              </Box>
            )}

            <VStack align="stretch" spacing={0}>
              {selectedChat.users.map((u) => (
                <HStack key={u._id} py={3} _hover={{ bg: "#f7fafc" }} cursor="pointer" transition="background 0.2s">
                  <Image src={u.pic} borderRadius="full" boxSize="40px" />
                  <Box flex={1}>
                    <Text fontWeight="500" fontSize="md" color="#1a202c">
                      {u.name} {u._id === user._id ? "(You)" : ""}
                    </Text>
                    {u.email && <Text fontSize="xs" color="gray.500" noOfLines={1}>{u.email}</Text>}
                  </Box>
                  {selectedChat.groupAdmin._id === u._id && (
                    <Text fontSize="xs" color="#38a169" fontWeight="600" bg="#c6f6d5" px={2} py={0.5} borderRadius="md">
                      Admin
                    </Text>
                  )}
                  {isAdmin && u._id !== user._id && (
                    <IconButton size="xs" icon={<CloseIcon />} variant="ghost" colorScheme="red" onClick={() => handleRemove(u)} />
                  )}
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* Exit Group / Block User */}
        <Box bg="white" py={3} px={5} mb={4} boxShadow="sm" cursor="pointer" _hover={{ bg: "#fff5f5" }}>
          {isGroupChat ? (
            <HStack color="red.500" onClick={() => handleRemove(user)}>
              <i className="fas fa-sign-out-alt" style={{ fontSize: "20px" }}></i>
              <Text fontWeight="600">Exit group</Text>
            </HStack>
          ) : (
            <HStack color="red.500">
              <i className="fas fa-ban" style={{ fontSize: "20px" }}></i>
              <Text fontWeight="600">Block {getSender(user, selectedChat.users)}</Text>
            </HStack>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default InfoSidebar;
