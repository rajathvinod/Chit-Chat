import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Authentication/Login";
import Signup from "../components/Authentication/Signup";

function Homepage() {
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo"));
    if (user) navigate("/chats");
  }, [navigate]);

  return (
    <Box w="100%" minH="100vh" bg="#f0f2f5" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="md" centerContent py={10}>
        <VStack spacing={6} w="100%">
          
          <Box display="flex" justifyContent="center" w="100%">
            <Text fontSize="5xl" fontFamily="Outfit" fontWeight="800" color="#2a5298" letterSpacing="tight" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              Chit-Chat
            </Text>
          </Box>
          
          <Box 
            bg="white" 
            w="100%" 
            p={8} 
            borderRadius="2xl" 
            boxShadow="0 10px 25px rgba(0, 0, 0, 0.05)"
          >
            <Tabs isFitted variant="soft-rounded" colorScheme="blue">
              <TabList mb="1.5em" bg="#f7fafc" p={1} borderRadius="full">
                <Tab 
                  borderRadius="full" 
                  fontWeight="600" 
                  _selected={{ color: "white", bg: "linear-gradient(to right, #2a5298, #3182ce)", boxShadow: "sm" }}
                >
                  Login
                </Tab>
                <Tab 
                  borderRadius="full" 
                  fontWeight="600" 
                  _selected={{ color: "white", bg: "linear-gradient(to right, #2a5298, #3182ce)", boxShadow: "sm" }}
                >
                  Sign Up
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <Login />
                </TabPanel>
                <TabPanel p={0}>
                  <Signup />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>

        </VStack>
      </Container>
    </Box>
  );
}

export default Homepage;
