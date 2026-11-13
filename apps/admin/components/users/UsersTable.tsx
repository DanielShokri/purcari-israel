import React from 'react';
import { Box, Table, Checkbox, Card } from '@chakra-ui/react';
import { User } from '@shared/types';
import { Pagination } from '../shared';
import UserTableRow from './UserTableRow';

interface UsersTableProps {
  users: User[];
  selectedUsers: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectUser: (userId: string, checked: boolean) => void;
  onEdit: (userId: string) => void;
  onDelete: (userId: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function UsersTable({
  users,
  selectedUsers,
  onSelectAll,
  onSelectUser,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: UsersTableProps) {
  return (
    <Box flex="1" minH="0">
      <Card.Root overflow="hidden" h="full" display="flex" flexDirection="column">
        <Table.ScrollArea flex="1">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                <Table.ColumnHeader px="6" py="4" w="12">
                  <Checkbox.Root
                    size="sm"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onCheckedChange={(e) => onSelectAll(!!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  משתמש
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" display={{ base: 'none', md: 'table-cell' }}>
                  אימייל
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  תפקיד
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" display={{ base: 'none', lg: 'table-cell' }}>
                  תאריך הצטרפות
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" textAlign="start">
                  פעולות
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={6} px="6" py="8" textAlign="center" color="fg.subtle">
                    לא נמצאו משתמשים
                  </Table.Cell>
                </Table.Row>
              ) : (
                users.map((user) => (
                  <UserTableRow
                    key={user._id}
                    user={user}
                    isSelected={selectedUsers.includes(user._id)}
                    onSelect={(checked) => onSelectUser(user._id, checked)}
                    onEdit={() => onEdit(user._id)}
                    onDelete={() => onDelete(user._id)}
                  />
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
        />
      </Card.Root>
    </Box>
  );
}
