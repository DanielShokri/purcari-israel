import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text } from '@chakra-ui/react';

interface SidebarLinkProps {
  to: string;
  icon: string;
  label: string;
  active: boolean;
  onClose?: () => void;
}

export default function SidebarLink({ to, icon, label, active, onClose }: SidebarLinkProps) {
  const handleClick = () => {
    onClose?.();
  };

  return (
    <Link to={to} style={{ textDecoration: 'none' }} onClick={handleClick}>
      <Flex
        alignItems="center"
        gap="3"
        px="3"
        py="2.5"
        rounded="lg"
        position="relative"
        transition="colors 0.15s ease-out"
        bg={active ? 'brand.50' : 'transparent'}
        color={active ? 'brand.600' : 'fg.muted'}
        _hover={{
          bg: active ? 'brand.50' : 'gray.100',
          color: active ? 'brand.600' : 'fg',
        }}
        _dark={{
          bg: active ? 'brand.950' : 'transparent',
          color: active ? 'brand.400' : 'fg.muted',
          _hover: {
            bg: active ? 'brand.950' : 'gray.800',
            color: active ? 'brand.400' : 'white',
          },
        }}
      >
        {active && (
          <Box
            position="absolute"
            right="0"
            top="0"
            h="full"
            w="1"
            bg="brand.500"
            roundedStart="full"
          />
        )}
        <Text
          as="span"
          className="material-symbols-outlined"
          fontSize="18px"
          style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </Text>
        <Text as="span" fontSize="sm" fontWeight="medium">
          {label}
        </Text>
      </Flex>
    </Link>
  );
}
