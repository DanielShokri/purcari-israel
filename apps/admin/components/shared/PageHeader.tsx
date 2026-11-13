import React from 'react';
import { Box, Flex, VStack, Heading, Text, Button } from '@chakra-ui/react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
}

export default function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionIcon = 'add',
  onAction
}: PageHeaderProps) {
  return (
    <Box py="8" px="0" flexShrink={0}>
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        justify="space-between"
        align={{ base: 'start', sm: 'center' }}
        gap="4"
        flexWrap="wrap"
      >
        <VStack align="start" gap="1">
          <Heading size="2xl" color="fg">
            {title}
          </Heading>
          {subtitle && (
            <Text color="fg.muted" fontSize="sm">
              {subtitle}
            </Text>
          )}
        </VStack>
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            colorPalette="brand"
            size="md"
            shadow="sm"
            px="5"
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              {actionIcon}
            </Text>
            <Text as="span">{actionLabel}</Text>
          </Button>
        )}
      </Flex>
    </Box>
  );
}
