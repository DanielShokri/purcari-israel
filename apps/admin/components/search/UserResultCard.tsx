import React from 'react';
import { Box, Flex, HStack, Text, Button } from '@chakra-ui/react';
import { User } from '@shared/types';
import { StatusBadge, userRoleConfig } from '../shared';
import HighlightText from './HighlightText';

interface UserResultCardProps {
  user: User;
  searchTerm: string;
}

export default function UserResultCard({ user, searchTerm }: UserResultCardProps) {
  return (
    <Flex
      bg="bg.panel"
      p="4"
      rounded="xl"
      borderWidth="1px"
      borderColor="border"
      alignItems="center"
      justifyContent="space-between"
      shadow="sm"
      transition="colors 0.15s ease-out"
      _hover={{ shadow: 'md' }}
    >
      <HStack gap="3">
        <Box
          w="12"
          h="12"
          rounded="full"
          backgroundSize="cover"
          backgroundPosition="center"
          bg="gray.200"
          flexShrink={0}
          style={{
            backgroundImage: user.avatar
              ? `url("${user.avatar}")`
              : `url("https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}")`,
          }}
        />
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="fg">
            <HighlightText text={user.name} searchTerm={searchTerm} />
          </Text>
          <Text fontSize="xs" color="fg.muted">
            <HighlightText text={user.email} searchTerm={searchTerm} />
          </Text>
          <Box mt="1">
            <StatusBadge status={user.role} config={userRoleConfig} />
          </Box>
        </Box>
      </HStack>
      <Button
        size="sm"
        variant="ghost"
        p="2"
        minW="8"
        h="8"
        color="fg.muted"
        _hover={{ bg: 'bg.subtle' }}
      >
        <Text as="span" className="material-symbols-outlined" fontSize="18px">
          visibility
        </Text>
      </Button>
    </Flex>
  );
}
