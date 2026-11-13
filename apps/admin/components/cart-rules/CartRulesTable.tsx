import React from 'react';
import { Box, Table, Checkbox, Card } from '@chakra-ui/react';
import { CartRule } from '@shared/types';
import { Pagination } from '../shared';
import CartRuleTableRow from './CartRuleTableRow';

interface CartRulesTableProps {
  cartRules: CartRule[];
  selectedCartRules: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectCartRule: (cartRuleId: string, checked: boolean) => void;
  onEdit: (cartRuleId: string) => void;
  onDelete: (cartRuleId: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function CartRulesTable({
  cartRules,
  selectedCartRules,
  onSelectAll,
  onSelectCartRule,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: CartRulesTableProps) {
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
                    checked={selectedCartRules.length === cartRules.length && cartRules.length > 0}
                    onCheckedChange={(e) => onSelectAll(!!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  שם החוק
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  סוג
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  עדיפות
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  ערך
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  סטטוס
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" textAlign="start">
                  פעולות
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {cartRules.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} px="6" py="8" textAlign="center" color="fg.subtle">
                    לא נמצאו חוקי עגלה
                  </Table.Cell>
                </Table.Row>
              ) : (
                cartRules.map((cartRule) => (
                  <CartRuleTableRow
                    key={cartRule._id}
                    cartRule={cartRule}
                    isSelected={selectedCartRules.includes(cartRule._id)}
                    onSelect={(checked) => onSelectCartRule(cartRule._id, checked)}
                    onEdit={() => onEdit(cartRule._id)}
                    onDelete={() => onDelete(cartRule._id)}
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
          itemLabel="חוקים"
        />
      </Card.Root>
    </Box>
  );
}
