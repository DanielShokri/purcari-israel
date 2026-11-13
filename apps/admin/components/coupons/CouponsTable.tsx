import React from 'react';
import { Box, Table, Checkbox, Card } from '@chakra-ui/react';
import { Coupon } from '@shared/types';
import { Pagination } from '../shared';
import CouponTableRow from './CouponTableRow';

interface CouponsTableProps {
  coupons: Coupon[];
  selectedCoupons: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectCoupon: (couponId: string, checked: boolean) => void;
  onEdit: (couponId: string) => void;
  onDelete: (couponId: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function CouponsTable({
  coupons,
  selectedCoupons,
  onSelectAll,
  onSelectCoupon,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: CouponsTableProps) {
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
                    checked={selectedCoupons.length === coupons.length && coupons.length > 0}
                    onCheckedChange={(e) => onSelectAll(!!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  קוד קופון
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  תיאור
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  סוג הנחה
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  ערך הנחה
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  שימושים
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  תוקף
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
              {coupons.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={9} px="6" py="8" textAlign="center" color="fg.subtle">
                    לא נמצאו קופונים
                  </Table.Cell>
                </Table.Row>
              ) : (
                coupons.map((coupon) => (
                  <CouponTableRow
                    key={coupon._id}
                    coupon={coupon}
                    isSelected={selectedCoupons.includes(coupon._id)}
                    onSelect={(checked) => onSelectCoupon(coupon._id, checked)}
                    onEdit={() => onEdit(coupon._id)}
                    onDelete={() => onDelete(coupon._id)}
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
          itemLabel="קופונים"
        />
      </Card.Root>
    </Box>
  );
}
