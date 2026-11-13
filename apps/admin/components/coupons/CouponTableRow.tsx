import React from 'react';
import { HStack, Text, Table, Checkbox, IconButton } from '@chakra-ui/react';
import { Coupon, CouponDiscountType } from '@shared/types';
import StatusBadge, { couponStatusConfig, couponDiscountTypeConfig } from '../shared/StatusBadge';

interface CouponTableRowProps {
  coupon: Coupon;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function CouponTableRow({
  coupon,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: CouponTableRowProps) {
  const formatDiscount = (coupon: Coupon): string => {
    switch (coupon.discountType) {
      case CouponDiscountType.PERCENTAGE:
        return `${coupon.discountValue}%`;
      case CouponDiscountType.FIXED_AMOUNT:
        return `₪${coupon.discountValue.toFixed(2)}`;
      case CouponDiscountType.FREE_SHIPPING:
        return 'משלוח חינם';
      case CouponDiscountType.FREE_PRODUCT:
        return 'מוצר חינם';
      case CouponDiscountType.BUY_X_GET_Y:
        return `קנה ${coupon.buyQuantity || 'X'} קבל ${coupon.getQuantity || 'Y'}`;
      default:
        return '-';
    }
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const formatUsage = (coupon: Coupon): string => {
    if (coupon.usageLimit) {
      return `${coupon.usageCount}/${coupon.usageLimit}`;
    }
    return `${coupon.usageCount}`;
  };

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
        <HStack gap="2">
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg"
            fontFamily="mono"
            _hover={{ color: 'brand.500' }}
            cursor="pointer"
            transition="colors"
            onClick={onEdit}
          >
            {coupon.code}
          </Text>
        </HStack>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <Text fontSize="sm" color="fg">
          {coupon.description || '-'}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <StatusBadge 
          status={coupon.discountType} 
          config={couponDiscountTypeConfig}
        />
      </Table.Cell>
      <Table.Cell px="6" py="4" dir="ltr">
        <Text fontSize="sm" fontWeight="medium" color="fg">
          {formatDiscount(coupon)}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4" dir="ltr">
        <Text fontSize="sm" color="fg">
          {formatUsage(coupon)}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4" dir="ltr">
        <Text fontSize="sm" color="fg">
          {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <StatusBadge 
          status={coupon.status} 
          config={couponStatusConfig}
        />
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <HStack gap="1" className="action-buttons" transition="opacity" justify="flex-end">
          <IconButton
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: 'gray.100', color: 'brand.500' }}
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
            _hover={{ bg: 'gray.100', color: 'red.500' }}
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
