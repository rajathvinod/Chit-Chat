import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  Text,
  Image,
  Box,
  VStack,
  useToast,
  Spinner
} from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { ChatState } from "../../Context/ChatProvider";

const ProfileModal = ({ user: profileUser, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
  const { user, setUser } = ChatState();

  // Check if we are viewing our own profile
  const isOwnProfile = user && profileUser && user._id === profileUser._id;

  const handlePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("images", file);

      const uploadConfig = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      };

      // Upload to Cloudinary
      const { data: uploadData } = await axios.post("/api/upload", formData, uploadConfig);
      const imageUrl = uploadData.urls[0];

      // Update User Profile
      const updateConfig = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data: updatedUser } = await axios.put(
        "/api/user/profile",
        { pic: imageUrl },
        updateConfig
      );

      // Update local storage and context
      localStorage.setItem("userInfo", JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast({
        title: "Profile Picture Updated!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toast({
        title: "Error Occured!",
        description: "Failed to update profile picture.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton display={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}
      <Modal size="sm" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent borderRadius="2xl" overflow="hidden" pb={6}>
          <Box bg="linear-gradient(135deg, #a0c4ff 0%, #c4e0ff 100%)" h="100px" w="100%" />
          <ModalCloseButton color="white" />
          <ModalBody display="flex" flexDir="column" alignItems="center" mt="-50px">
            <Box position="relative" cursor={isOwnProfile ? "pointer" : "default"}>
              <Image
                borderRadius="full"
                boxSize="100px"
                src={isOwnProfile ? user.pic : profileUser.pic}
                alt={profileUser.name}
                border="4px solid white"
                boxShadow="lg"
                objectFit="cover"
              />
              {isOwnProfile && (
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
                  >
                    {loading ? (
                      <Spinner color="white" />
                    ) : (
                      <i className="fas fa-camera" style={{ color: "white", fontSize: "20px" }}></i>
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
                    disabled={loading}
                  />
                </>
              )}
            </Box>
            
            <VStack spacing={1} mt={4}>
              <Text fontSize="2xl" fontFamily="Outfit" fontWeight="bold" color="#1a202c">
                {isOwnProfile ? user.name : profileUser.name}
              </Text>
              <Text fontSize="md" color="gray.500">
                {isOwnProfile ? user.email : profileUser.email}
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ProfileModal;
