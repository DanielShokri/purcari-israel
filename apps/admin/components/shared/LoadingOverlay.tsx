import React from 'react';
import { Box, Flex, Spinner, Text } from '@chakra-ui/react';

interface LoadingOverlayProps {
  /** Whether the wrapped section's data is still loading */
  isLoading: boolean;
  children: React.ReactNode;
  /** Message shown under the spinner */
  message?: string;
  /** z-index of the overlay layer */
  zIndex?: number;
}

/**
 * Renders `children` unchanged and covers them with a soft loading layer
 * while `isLoading` is true. Use to wrap any card/section whose data may
 * refresh independently (e.g. interval switches) without showing empty
 * charts or zero stats.
 */
export default function LoadingOverlay({
  isLoading,
  children,
  message,
  zIndex = 2,
}: LoadingOverlayProps) {
  return (
    <Box position="relative" h="full">
      {children}
      {isLoading && (
        <Flex
          position="absolute"
          inset="0"
          bg="bg.panel/80"
          backdropBlur="2px"
          rounded="inherit"
          justifyContent="center"
          alignItems="center"
          zIndex={zIndex}
          overflow="hidden"
        >
          <Flex
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            rounded="lg"
            shadow="md"
            px="6"
            py="4"
            gap="3"
            alignItems="center"
          >
            <Spinner size="md" color="brand.500" borderWidth="3px" />
            {message && <Text color="fg.muted" fontSize="sm">{message}</Text>}
          </Flex>
        </Flex>
      )}
    </Box>
  );
}
