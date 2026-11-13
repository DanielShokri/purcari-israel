import React from 'react';
import { Box, HStack, VStack, Text, Table, Checkbox, IconButton } from '@chakra-ui/react';
import { User } from '@shared/types';
import { StatusBadge, userRoleConfig } from '../shared';

interface UserTableRowProps {
  user: User;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function UserTableRow({
  user,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: UserTableRowProps) {
  return (
    <Table.Row
      _hover={{ bg: 'bg.subtle' }}
      transition="colors"
      css={{
        '& .action-buttons': { opacity: 0 },
        '&:hover .action-buttons': { opacity: 1 },
      }}
    >
      <Table.Cell px="6" py="4">
        <Checkbox.Root
          size="sm"
          checked={isSelected}
          onCheckedChange={(e) => onSelect(!!e.checked)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <HStack gap="3">
          <Box
            w="10"
            h="10"
            rounded="full"
            backgroundSize="cover"
            backgroundPosition="center"
            bgColor="gray.200"
            flexShrink={0}
            style={{ 
              backgroundImage: user.avatar ? `url("${user.avatar}")` : undefined 
            }}
          />
          <VStack align="start" gap="0">
            <Text fontSize="sm" fontWeight="medium" color="fg">
              {user.name}
            </Text>
          </VStack>
        </HStack>
      </Table.Cell>
      <Table.Cell px="6" py="4" color="fg.muted" display={{ base: 'none', md: 'table-cell' }}>
        <Text fontSize="sm" dir="ltr">
          {user.email}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <StatusBadge status={user.role || 'viewer'} config={userRoleConfig} />
      </Table.Cell>
      <Table.Cell px="6" py="4" color="fg.muted" display={{ base: 'none', lg: 'table-cell' }} dir="ltr">
        <Text fontSize="sm">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString('he-IL') : '-'}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <HStack gap="2" className="action-buttons" transition="opacity" justify="flex-end">
          <IconButton
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: 'brand.50', color: 'brand.500' }}
            _dark={{ _hover: { bg: 'brand.900/20', color: 'brand.400' } }}
            aria-label="ערוך"
            onClick={onEdit}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              edit
            </Text>
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: 'red.50', color: 'red.600' }}
            _dark={{ _hover: { bg: 'red.900/20', color: 'red.400' } }}
            aria-label="מחק"
            onClick={onDelete}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              delete
            </Text>
          </IconButton>
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}
