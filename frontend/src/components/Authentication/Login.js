import { Button, FormControl, FormLabel, Input, InputGroup, InputRightElement, VStack, useToast, Text } from "@chakra-ui/react";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../../Context/ChatProvider";

const Login = () => {
  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = ChatState();

  const submitHandler = async () => {
    setLoading(true);
    if (!email || !password) {
      toast({ title: "Please Fill all the Feilds", status: "warning", duration: 5000, isClosable: true, position: "bottom" });
      setLoading(false);
      return;
    }

    try {
      const config = { headers: { "Content-type": "application/json" } };
      const { data } = await axios.post("/api/user/login", { email, password }, config);
      toast({ title: "Login Successful", status: "success", duration: 5000, isClosable: true, position: "bottom" });
      setUser(data);
      localStorage.setItem("userInfo", JSON.stringify(data));
      setLoading(false);
      navigate("/chats");
    } catch (error) {
      toast({ title: "Error Occured!", description: error.response?.data?.message, status: "error", duration: 5000, isClosable: true, position: "bottom" });
      setLoading(false);
    }
  };

  return (
    <VStack spacing={5}>
      <FormControl id="email" isRequired>
        <FormLabel color="gray.600" fontSize="sm" fontWeight="600">Email Address</FormLabel>
        <Input
          value={email}
          type="email"
          placeholder="Enter Your Email Address"
          onChange={(e) => setEmail(e.target.value)}
          bg="#f7fafc"
          border="none"
          borderRadius="full"
          px={5}
          py={6}
          _focus={{ bg: "#edf2f7" }}
        />
      </FormControl>
      
      <FormControl id="password" isRequired>
        <FormLabel color="gray.600" fontSize="sm" fontWeight="600">Password</FormLabel>
        <InputGroup size="md">
          <Input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type={show ? "text" : "password"}
            placeholder="Enter password"
            bg="#f7fafc"
            border="none"
            borderRadius="full"
            px={5}
            py={6}
            _focus={{ bg: "#edf2f7" }}
          />
          <InputRightElement width="4.5rem" h="100%">
            <Button h="1.75rem" size="sm" borderRadius="full" onClick={handleClick} bg="transparent" _hover={{ bg: "gray.200" }} color="gray.500">
              {show ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>
      
      <Button
        width="100%"
        mt={4}
        bg="linear-gradient(to right, #2a5298, #3182ce)"
        color="white"
        borderRadius="full"
        py={6}
        fontSize="md"
        fontWeight="bold"
        _hover={{ bg: "linear-gradient(to right, #1e3c72, #2a5298)", transform: "translateY(-1px)", boxShadow: "lg" }}
        transition="all 0.2s"
        onClick={submitHandler}
        isLoading={loading}
      >
        Login
      </Button>
      
      <Button
        variant="outline"
        colorScheme="gray"
        width="100%"
        borderRadius="full"
        py={6}
        mt={2}
        color="gray.500"
        borderColor="gray.200"
        _hover={{ bg: "gray.50", color: "gray.700" }}
        onClick={() => {
          setEmail("guest@example.com");
          setPassword("123456");
        }}
      >
        Use Guest Credentials
      </Button>
    </VStack>
  );
};

export default Login;
