import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Input,
  InputGroup,
  Button,
} from '@chakra-ui/react';
import { ColorModeButton } from '@/components/ui/color-mode';
import { NotificationDropdown } from '@/components/notifications';
import UserProfile from './UserProfile';
import { AuthUser } from '@shared/types';

interface HeaderProps {
  currentPageLabel: string;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  onSearchKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  user: AuthUser | null;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
}

export default function Header({
  currentPageLabel,
  searchInput,
  onSearchChange,
  onSearchSubmit,
  onSearchKeyDown,
  user,
  onMenuToggle,
  isSidebarOpen,
}: HeaderProps) {
  return (
    <HStack
      as="header"
      h="16"
      flexShrink={0}
      bg="bg.panel"
      borderBottomWidth="1px"
      borderColor="border"
      justifyContent="space-between"
      px={{ base: '4', md: '8' }}
      position="sticky"
      top="0"
      zIndex={10}
    >
      {/* Left side: Mobile menu + Breadcrumbs */}
      <HStack gap="4" alignItems="center">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="sm"
          p="1"
          display={{ base: 'flex', lg: 'none' }}
          color="fg.muted"
          _hover={{ bg: 'bg.subtle' }}
          onClick={onMenuToggle}
          aria-expanded={isSidebarOpen}
          aria-label="פתח תפריט צדדי"
        >
          <Text as="span" className="material-symbols-outlined" fontSize="24px">
            {isSidebarOpen ? 'close' : 'menu'}
          </Text>
        </Button>

        {/* Breadcrumbs */}
        <HStack display={{ base: 'none', md: 'flex' }} fontSize="sm" color="fg.muted" alignItems="center">
          <Text opacity={0.7}>ניהול</Text>
          <Text mx="2">/</Text>
          <Text fontWeight="medium" color="fg">{currentPageLabel}</Text>
        </HStack>
      </HStack>

      {/* Right side: Search, Icons, Profile */}
      <HStack gap={{ base: '2', md: '6' }} flex="1" justify="flex-end" alignItems="center">
        {/* Global Search - visible on mobile via top bar, hidden on tablet+ in favor of inline */}
        <Box display={{ base: 'block', md: 'none' }} w="full">
          <InputGroup
            startElement={
              <Text
                as="span"
                className="material-symbols-outlined"
                fontSize="20px"
                color="fg.muted"
                cursor="pointer"
                _hover={{ color: 'blue.500' }}
                onClick={onSearchSubmit}
              >
                search
              </Text>
            }
          >
            <Input
              placeholder="חיפוש גלובלי..."
              size="sm"
              bg="bg.subtle"
              borderColor="transparent"
              _hover={{ borderColor: 'border' }}
              _focus={{ borderColor: 'blue.500', bg: 'bg.panel' }}
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
            />
          </InputGroup>
        </Box>

        {/* Global Search - inline on tablet and desktop */}
        <Box display={{ base: 'none', md: 'block' }} w="full" maxW="sm">
          <InputGroup
            startElement={
              <Text
                as="span"
                className="material-symbols-outlined"
                fontSize="20px"
                color="fg.muted"
                cursor="pointer"
                _hover={{ color: 'blue.500' }}
                onClick={onSearchSubmit}
              >
                search
              </Text>
            }
          >
            <Input
              placeholder="חיפוש גלובלי..."
              size="sm"
              bg="bg.subtle"
              borderColor="transparent"
              _hover={{ borderColor: 'border' }}
              _focus={{ borderColor: 'blue.500', bg: 'bg.panel' }}
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
            />
          </InputGroup>
        </Box>

        {/* Icon buttons */}
        <HStack gap="2">
          <ColorModeButton />
          <NotificationDropdown />
          <Flex
            as="button"
            w="10"
            h="10"
            alignItems="center"
            justifyContent="center"
            rounded="full"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            color="fg.muted"
            transition="all 0.15s"
            _hover={{ bg: 'bg.subtle' }}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="22px">
              settings
            </Text>
          </Flex>
        </HStack>

        {/* User Profile */}
        <UserProfile user={user} />
      </HStack>
    </HStack>
  );
}
