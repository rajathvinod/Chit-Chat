import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  FormControl,
  Input,
  useToast,
  Box,
  IconButton,
  Spinner,
  Image,
  Text,
  VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { ChatState } from "../../Context/ChatProvider";
import UserListItem from "../userAvatar/UserListItem";

const UpdateGroupChatModal = ({ fetchMessages, fetchAgain, setFetchAgain, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [groupChatName, setGroupChatName] = useState();
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [renameloading, setRenameLoading] = useState(false);
  const [picLoading, setPicLoading] = useState(false);
  const toast = useToast();

  const { selectedChat, setSelectedChat, user } = ChatState();
  const isAdmin = selectedChat.groupAdmin._id === user._id;

  const handleSearch = async (query) => {
    setSearch(query);
    if (!query) return;

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get(`/api/user?search=${search}`, config);
      setLoading(false);
      setSearchResult(data);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Search Results",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
      setLoading(false);
    }
  };

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
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setRenameLoading(false);
    }
    setGroupChatName("");
  };

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAdmin) return;

    try {
      setPicLoading(true);
      const formData = new FormData();
      formData.append("images", file);

      const uploadConfig = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data: uploadData } = await axios.post("/api/upload", formData, uploadConfig);
      const imageUrl = uploadData.urls[0];

      const updateConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data: updatedChat } = await axios.put(
        "/api/chat/group-pic",
        { chatId: selectedChat._id, pic: imageUrl },
        updateConfig
      );

      setSelectedChat(updatedChat);
      setFetchAgain(!fetchAgain);
      toast({
        title: "Group Picture Updated!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
    } catch (error) {
      setPicLoading(false);
      toast({
        title: "Error Occured!",
        description: "Failed to update group picture.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const handleAddUser = async (user1) => {
    if (selectedChat.users.find((u) => u._id === user1._id)) {
      toast({ title: "User Already in group!", status: "error", duration: 5000, isClosable: true, position: "bottom" });
      return;
    }
    if (!isAdmin) {
      toast({ title: "Only admins can add someone!", status: "error", duration: 5000, isClosable: true, position: "bottom" });
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/chat/groupadd`, { chatId: selectedChat._id, userId: user1._id }, config);
      setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      setLoading(false);
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response.data.message, status: "error", duration: 5000, isClosable: true, position: "bottom" });
      setLoading(false);
    }
  };

  const handleRemove = async (user1) => {
    if (!isAdmin && user1._id !== user._id) {
      toast({ title: "Only admins can remove someone!", status: "error", duration: 5000, isClosable: true, position: "bottom" });
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put(`/api/chat/groupremove`, { chatId: selectedChat._id, userId: user1._id }, config);

      user1._id === user._id ? setSelectedChat() : setSelectedChat(data);
      setFetchAgain(!fetchAgain);
      fetchMessages();
      setLoading(false);
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response.data.message, status: "error", duration: 5000, isClosable: true, position: "bottom" });
      setLoading(false);
    }
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton display={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}

      <Modal onClose={onClose} isOpen={isOpen} isCentered size="md">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" bg="#f0f2f5" pb={4}>
          
          {/* Header Image Area */}
          <Box position="relative" w="100%" h="250px" bg="white" display="flex" justifyContent="center" alignItems="center">
            <Image 
              src={selectedChat.groupPic || "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"} 
              w="100%" 
              h="100%" 
              objectFit="cover"
            />
            {isAdmin && (
              <>
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  w="100%"
                  h="100%"
                  bg="rgba(0,0,0,0.3)"
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
                    <VStack>
                      <i className="fas fa-camera" style={{ color: "white", fontSize: "24px" }}></i>
                      <Text color="white" fontWeight="bold">CHANGE SUBJECT ICON</Text>
                    </VStack>
                  )}
                </Box>
                <input
                  type="file"
                  accept="image/*"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer"
                  }}
                  onChange={handlePicChange}
                  disabled={picLoading}
                />
              </>
            )}
            <ModalCloseButton color="white" bg="rgba(0,0,0,0.5)" borderRadius="full" _hover={{ bg: "rgba(0,0,0,0.7)" }} m={2} />
          </Box>

          <ModalBody display="flex" flexDir="column" alignItems="center" p={0}>
            
            {/* Group Name Section */}
            <Box w="100%" bg="white" p={5} mb={3} boxShadow="sm">
              <Text fontSize="2xl" fontWeight="bold" color="#1a202c" mb={2}>
                {selectedChat.chatName}
              </Text>
              <Text color="gray.500" fontSize="sm">
                Group • {selectedChat.users.length} participants
              </Text>

              {isAdmin && (
                <FormControl display="flex" mt={4}>
                  <Input
                    placeholder="Change Group Subject"
                    value={groupChatName}
                    onChange={(e) => setGroupChatName(e.target.value)}
                    bg="#f7fafc"
                    border="none"
                    borderRadius="md"
                    _focus={{ bg: "#edf2f7" }}
                  />
                  <Button variant="solid" bg="#1a202c" color="white" _hover={{ bg: "#2d3748" }} ml={2} isLoading={renameloading} onClick={handleRename}>
                    Save
                  </Button>
                </FormControl>
              )}
            </Box>

            {/* Add Participant Section */}
            {isAdmin && (
              <Box w="100%" bg="white" p={5} mb={3} boxShadow="sm">
                <FormControl>
                  <Input
                    placeholder="Add participants..."
                    onChange={(e) => handleSearch(e.target.value)}
                    bg="#f7fafc"
                    border="none"
                    borderRadius="full"
                    _focus={{ bg: "#edf2f7" }}
                  />
                </FormControl>
                {loading ? (
                  <Spinner size="md" mt={4} />
                ) : (
                  searchResult?.slice(0, 4).map((user) => (
                    <Box mt={2} key={user._id}>
                      <UserListItem user={user} handleFunction={() => handleAddUser(user)} />
                    </Box>
                  ))
                )}
              </Box>
            )}

            {/* Participant List Section */}
            <Box w="100%" bg="white" pt={3} pb={2} boxShadow="sm">
              <Text px={5} color="teal.500" fontWeight="bold" fontSize="sm" mb={2}>
                {selectedChat.users.length} participants
              </Text>
              
              {selectedChat.users.map((u) => (
                <Box 
                  key={u._id} 
                  display="flex" 
                  alignItems="center" 
                  justifyContent="space-between" 
                  px={5} 
                  py={3}
                  _hover={{ bg: "#f7fafc" }}
                  transition="all 0.2s"
                >
                  <Box display="flex" alignItems="center">
                    <Image src={u.pic} borderRadius="full" boxSize="40px" mr={3} />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="500">{u.name} {u._id === user._id ? "(You)" : ""}</Text>
                      {selectedChat.groupAdmin._id === u._id && (
                        <Text fontSize="xs" color="gray.500">Group Admin</Text>
                      )}
                    </VStack>
                  </Box>
                  
                  {isAdmin && u._id !== user._id && (
                    <Button size="xs" colorScheme="red" variant="ghost" onClick={() => handleRemove(u)}>
                      Remove
                    </Button>
                  )}
                </Box>
              ))}
            </Box>
            
            <Box w="100%" mt={4} px={4}>
              <Button w="100%" onClick={() => handleRemove(user)} colorScheme="red" variant="outline" bg="white">
                <i className="fas fa-sign-out-alt" style={{ marginRight: "8px" }}></i> Exit Group
              </Button>
            </Box>

          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UpdateGroupChatModal;
