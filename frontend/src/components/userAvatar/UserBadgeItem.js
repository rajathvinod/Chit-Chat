import { CloseIcon } from "@chakra-ui/icons";
import { Box, Text, Avatar } from "@chakra-ui/react";

const UserBadgeItem = ({ user, handleFunction, admin }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      px={2}
      py={1}
      borderRadius="full"
      m={1}
      mb={2}
      bg="#edf2f7"
      color="#1a202c"
      fontSize={14}
      cursor="pointer"
      onClick={handleFunction}
      transition="all 0.2s"
      _hover={{
        bg: "#e2e8f0",
      }}
      boxShadow="sm"
    >
      <Avatar size="xs" src={user.pic} name={user.name} mr={2} />
      <Text fontWeight="500">{user.name}</Text>
      {admin === user._id && <Text ml={1} fontSize="xs" color="blue.500">(Admin)</Text>}
      <CloseIcon pl={2} fontSize="xl" color="gray.500" _hover={{ color: "red.500" }} />
    </Box>
  );
};

export default UserBadgeItem;
