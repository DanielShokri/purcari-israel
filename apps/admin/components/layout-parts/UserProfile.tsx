import React from 'react';
import { Box, HStack, VStack, Text } from '@chakra-ui/react';
import { AuthUser } from '@shared/types';

interface UserProfileProps {
  user: AuthUser | null;
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <HStack
      gap="3"
      pr="2"
      borderRightWidth="1px"
      borderColor="border"
      mr="2"
    >
      <Box
        w="9"
        h="9"
        rounded="full"
        backgroundSize="cover"
        backgroundPosition="center"
        bgColor="gray.200"
        ring="2px"
        ringColor="bg.panel"
        shadow="sm"
        style={{
          backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC84pEa-1y1bE3s7A03M2qF9pYvmDqOD7lom5F-nMf9RyxCUAeOQ0rJzpBiY2GWHYQRBtOVDXO1VP9Nd7qU99UxsPO0xHG0syvrrniqVFNjew5zAD_0-U20U8Htgr-ivxula3q71m2tP7q-wHnXgA_4cUwOO-nn55PLv0qTuGceV0t_xiqOK69MhTXk8LX-1O7IbVLUEk8oKI8IuwGZ18wLZHi0MdtQQYbLBzuYxL4DKRl4rGiI0BikKmtK1BLpEtJLR5fiKoLEhA")',
        }}
      />
      <VStack gap="0" align="end" display={{ base: 'none', lg: 'flex' }}>
        <Text fontSize="sm" fontWeight="medium" color="fg" lineHeight="tight">
          {user?.name || 'דניאל כהן'}
        </Text>
        <Text fontSize="xs" color="fg.muted">
          מנהל מערכת
        </Text>
      </VStack>
    </HStack>
  );
}
