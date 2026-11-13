import React from 'react';
import { Flex, VStack, Spinner, Text } from '@chakra-ui/react';

interface LoadingStateProps {
  message?: string;
  /** 'full' shows large centered spinner (default), 'subtle' shows small inline indicator */
  variant?: 'full' | 'subtle';
}

export default function LoadingState({ message = 'טוען נתונים...', variant = 'full' }: LoadingStateProps) {
  // Full variant: big centered spinner
  if (variant === 'full') {
    return (
      <Flex p="10" justifyContent="center" alignItems="center" minH="400px">
        <VStack gap="4">
          <Spinner size="lg" color="brand.500" />
          <Text color="fg.muted">{message}</Text>
        </VStack>
      </Flex>
    );
  }

  // Subtle variant: small inline spinner for background refresh
  return (
    <Flex p="4" justifyContent="center" alignItems="center" gap="2">
      <Spinner size="sm" color="brand.500" />
      <Text color="fg.muted" fontSize="sm">{message}</Text>
    </Flex>
  );
}
