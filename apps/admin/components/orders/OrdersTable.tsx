import React from 'react';
import { Box, Table, Checkbox, Card } from '@chakra-ui/react';
import { Order } from '@shared/types';
import { Pagination } from '../shared';
import OrderTableRow from './OrderTableRow';

interface OrdersTableProps {
  orders: Order[];
  selectedOrders: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectOrder: (orderId: string, checked: boolean) => void;
  onView: (orderId: string) => void;
  onEdit: (orderId: string) => void;
  onDelete: (orderId: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function OrdersTable({
  orders,
  selectedOrders,
  onSelectAll,
  onSelectOrder,
  onView,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: OrdersTableProps) {
  return (
    <Box flex="1" minH="0">
      <Card.Root overflow="hidden" h="full" display="flex" flexDirection="column">
        {/* Table with horizontal scroll wrapper */}
        <Box flex="1" overflow="auto" w="full" position="relative">
          <Table.Root size="sm" minW="700px">
            <Table.Header>
              <Table.Row bg="bg.subtle" position="sticky" top="0" zIndex={2}>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" w="12">
                  <Checkbox.Root
                    size="sm"
                    checked={selectedOrders.length === orders.length && orders.length > 0}
                    onCheckedChange={(e) => onSelectAll(!!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  מזהה הזמנה
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  שם לקוח
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" display={{ base: 'none', md: 'table-cell' }}>
                  תאריך
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  סה"כ
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  סטטוס
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" textAlign="start">
                  פעולות
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7} px={{ base: '4', lg: '6' }} py="12" textAlign="center" color="fg.subtle">
                    לא נמצאו הזמנות
                  </Table.Cell>
                </Table.Row>
              ) : (
                orders.map((order) => (
                  <OrderTableRow
                    key={order._id}
                    order={order}
                    isSelected={selectedOrders.includes(order._id)}
                    onSelect={(checked) => onSelectOrder(order._id, checked)}
                    onView={() => onView(order._id)}
                    onEdit={() => onEdit(order._id)}
                    onDelete={() => onDelete(order._id)}
                  />
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          itemLabel="הזמנות"
        />
      </Card.Root>
    </Box>
  );
}
