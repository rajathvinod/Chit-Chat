import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
  useToast,
  Box,
  Text,
} from "@chakra-ui/react";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmpassword, setConfirmpassword] = useState("");
  const [password, setPassword] = useState("");
  const [pic, setPic] = useState("");
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [picLoading, setPicLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const submitHandler = async () => {
    setLoading(true);
    if (!name || !email || !password || !confirmpassword) {
      toast({
        title: "Please Fill all the Feilds",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }
    if (password !== confirmpassword) {
      toast({
        title: "Passwords Do Not Match",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }
    try {
      const config = { headers: { "Content-type": "application/json" } };
      const { data } = await axios.post(
        "/api/user",
        { name, email, password, ...(pic && !selectedPicture ? { pic } : {}) },
        config,
      );

      if (selectedPicture) {
        const uploadData = new FormData();
        uploadData.append("images", selectedPicture);
        const uploadConfig = {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${data.token}`,
          },
        };
        const { data: uploadedPicture } = await axios.post(
          "/api/upload",
          uploadData,
          uploadConfig,
        );
        await axios.put(
          "/api/user/profile",
          { pic: uploadedPicture.urls[0] },
          { headers: { Authorization: `Bearer ${data.token}` } },
        );
        data.pic = uploadedPicture.urls[0];
      }
      toast({
        title: "Registration Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      navigate("/chats");
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response?.data?.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
    }
  };

  const postDetails = async (pics) => {
    setPicLoading(true);
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }

    setFileName(pics.name);

    if (
      pics.type === "image/jpeg" ||
      pics.type === "image/png" ||
      pics.type === "image/webp"
    ) {
      setSelectedPicture(pics);
      setPic(URL.createObjectURL(pics));
      setPicLoading(false);
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
    }
  };

  return (
    <VStack spacing={4}>
      <FormControl id="first-name" isRequired>
        <FormLabel color="gray.600" fontSize="sm" fontWeight="600">
          Name
        </FormLabel>
        <Input
          placeholder="Enter Your Name"
          onChange={(e) => setName(e.target.value)}
          bg="#f7fafc"
          border="none"
          borderRadius="full"
          px={5}
          py={5}
          _focus={{ bg: "#edf2f7" }}
        />
      </FormControl>

      <FormControl id="signup-email" isRequired>
        <FormLabel color="gray.600" fontSize="sm" fontWeight="600">
          Email Address
        </FormLabel>
        <Input
          type="email"
          placeholder="Enter Your Email Address"
          onChange={(e) => setEmail(e.target.value)}
          bg="#f7fafc"
          border="none"
          borderRadius="full"
          px={5}
          py={5}
          _focus={{ bg: "#edf2f7" }}
        />
      </FormControl>

      <FormControl id="signup-password" isRequired>
        <FormLabel color="gray.600" fontSize="sm" fontWeight="600">
          Password
        </FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter Password"
            onChange={(e) => setPassword(e.target.value)}
            bg="#f7fafc"
            border="none"
            borderRadius="full"
            px={5}
            py={5}
            _focus={{ bg: "#edf2f7" }}
          />
          <InputRightElement width="4.5rem" h="100%">
            <Button
              h="1.75rem"
              size="sm"
              borderRadius="full"
              onClick={handleClick}
              bg="transparent"
              _hover={{ bg: "gray.200" }}
              color="gray.500"
            >
              {show ? (
                <i className="fas fa-eye-slash"></i>
              ) : (
                <i className="fas fa-eye"></i>
              )}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>

      <FormControl id="confirmpassword" isRequired>
        <FormLabel color="gray.600" fontSize="sm" fontWeight="600">
          Confirm Password
        </FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmpassword(e.target.value)}
            bg="#f7fafc"
            border="none"
            borderRadius="full"
            px={5}
            py={5}
            _focus={{ bg: "#edf2f7" }}
          />
        </InputGroup>
      </FormControl>

      <FormControl id="pic">
        <FormLabel color="gray.600" fontSize="sm" fontWeight="600">
          Upload your Picture
        </FormLabel>
        <Box
          position="relative"
          w="100%"
          bg="#f7fafc"
          borderRadius="full"
          py={3}
          px={5}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          cursor="pointer"
          _hover={{ bg: "#edf2f7" }}
        >
          <Text color="gray.500" fontSize="md" noOfLines={1} pr={4}>
            {fileName || "No file chosen"}
          </Text>
          <Button
            size="sm"
            borderRadius="full"
            bg="gray.200"
            pointerEvents="none"
            isLoading={picLoading}
          >
            Browse
          </Button>
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
              cursor: "pointer",
            }}
            onChange={(e) => postDetails(e.target.files[0])}
          />
        </Box>
      </FormControl>

      <Button
        width="100%"
        mt={6}
        bg="linear-gradient(to right, #2a5298, #3182ce)"
        color="white"
        borderRadius="full"
        py={6}
        fontSize="md"
        fontWeight="bold"
        _hover={{
          bg: "linear-gradient(to right, #1e3c72, #2a5298)",
          transform: "translateY(-1px)",
          boxShadow: "lg",
        }}
        transition="all 0.2s"
        onClick={submitHandler}
        isLoading={loading}
      >
        Sign Up
      </Button>
    </VStack>
  );
};

export default Signup;
