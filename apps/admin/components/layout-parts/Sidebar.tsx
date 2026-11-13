import React from 'react';
import { Box, Flex, HStack, VStack, Text, Button, IconButton } from '@chakra-ui/react';
import SidebarLink from './SidebarLink';
import { navigationConfig, secondaryNavItems, isNavItemActive } from './routeConfig';

interface SidebarProps {
  currentPath: string;
  onLogout: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ currentPath, onLogout, isOpen = false, onToggle }: SidebarProps) {
  return (
    <Box
      as="aside"
      w="64"
      flexShrink={0}
      bg="bg.panel"
      borderLeftWidth="1px"
      borderColor="border"
      display="flex"
      flexDirection="column"
      h="full"
      zIndex={50}
      /* Mobile: fixed drawer anchored to the inline-start edge (right side in RTL).
         Desktop: normal in-flow relative panel, always visible. */
      position={{ base: 'fixed', lg: 'relative' }}
      top={{ base: '0', lg: 'auto' }}
      bottom={{ base: '0', lg: 'auto' }}
      insetInlineStart={{ base: '0', lg: 'auto' }}
      transform={{
        base: isOpen ? 'translateX(0)' : 'translateX(100%)',
        lg: 'none',
      }}
      transition="transform 0.3s ease-in-out"
      willChange="transform"
    >
      {/* Logo + mobile close */}
      <HStack h="16" px="6" borderBottomWidth="1px" borderColor="border" flexShrink={0}>
        <Flex
          w="8"
          h="8"
          rounded="lg"
          bg="bg.subtle"
          alignItems="center"
          justifyContent="center"
          color="fg.muted"
          ml="3"
        >
          <Text as="span" className="material-symbols-outlined" fontSize="18px">
            wine_bar
          </Text>
        </Flex>
        <Text fontSize="lg" fontWeight="medium" color="fg">
          פורקרי<Text as="span" color="fg.muted"> אדמין</Text>
        </Text>

        {/* Close button — mobile only */}
        {onToggle && (
          <IconButton
            aria-label="סגור תפריט"
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: 'bg.subtle' }}
            onClick={onToggle}
            ms="auto"
            display={{ base: 'flex', lg: 'none' }}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              close
            </Text>
          </IconButton>
        )}
      </HStack>

      {/* Navigation */}
      <Box as="nav" flex="1" px="3" py="6" overflowY="auto" minH="0">
        {navigationConfig.map((section, sectionIndex) => (
          <Box key={section.title} mt={sectionIndex > 0 ? '6' : '0'}>
            <Text
              px="3"
              fontSize="xs"
              fontWeight="medium"
              color="fg.subtle"
              mb="2"
            >
              {section.title}
            </Text>
            <VStack gap="1" align="stretch">
              {section.items.map((item) => (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  active={isNavItemActive(item, currentPath)}
                  onClose={onToggle}
                />
              ))}
            </VStack>
          </Box>
        ))}

        <Box my="4" borderTopWidth="1px" borderColor="border" />

        <VStack gap="1" align="stretch">
          {secondaryNavItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              active={isNavItemActive(item, currentPath)}
              onClose={onToggle}
            />
          ))}
        </VStack>
      </Box>

      {/* Logout Section */}
      <Box p="4" borderTopWidth="1px" borderColor="border" flexShrink={0}>
        <Button
          onClick={onLogout}
          variant="ghost"
          colorPalette="red"
          w="full"
          justifyContent="center"
          gap="2"
        >
          <Text as="span" className="material-symbols-outlined" fontSize="18px">
            logout
          </Text>
          <Text as="span" fontSize="sm" fontWeight="semibold">
            התנתק
          </Text>
        </Button>
      </Box>
    </Box>
  );
}
