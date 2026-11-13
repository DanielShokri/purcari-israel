import React from 'react';
import { HStack, Text, Table, Checkbox, IconButton, Box } from '@chakra-ui/react';
import { CartRule } from '@shared/types';
import StatusBadge, { cartRuleStatusConfig } from '../shared/StatusBadge';

interface CartRuleTableRowProps {
  cartRule: CartRule;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  'shipping': { icon: 'local_shipping', color: 'purple.500', label: 'משלוח' },
  'bulk_discount': { icon: 'percent', color: 'orange.500', label: 'הנחה כמותית' },
  'buy_x_get_y': { icon: 'local_offer', color: 'green.500', label: 'קנה X קבל Y' },
};

export default function CartRuleTableRow({
  cartRule,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: CartRuleTableRowProps) {
  const typeInfo = typeConfig[cartRule.ruleType] || { icon: 'rule', color: 'gray.500', label: 'חוק' };

  const formatPriority = (priority?: number): string => {
    return (priority ?? 0).toString().padStart(2, '0');
  };

  const formatValue = (): string => {
    const config = cartRule.config;
    if (!config) return '-';

    switch (config.type) {
      case 'shipping':
        return `מעל ₪${config.minOrderAmount.toFixed(2)}`;
      case 'bulk_discount':
        return `${config.discountPercentage}%`;
      case 'buy_x_get_y':
        return `קנה ${config.buyQuantity} קבל ${config.getQuantity}`;
      default:
        return '-';
    }
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
        <Box>
          <Text
            fontSize="sm"
            fontWeight="medium"
            color="fg"
            _hover={{ color: 'brand.500' }}
            cursor="pointer"
            transition="colors"
            onClick={onEdit}
          >
            {cartRule.name}
          </Text>
          {cartRule.description && (
            <Text fontSize="xs" color="fg.muted" mt="0.5">
              {cartRule.description}
            </Text>
          )}
        </Box>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <HStack gap="2">
          <Text as="span" className="material-symbols-outlined" fontSize="18px" color={typeInfo.color}>
            {typeInfo.icon}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {typeInfo.label}
          </Text>
        </HStack>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <Text
          fontSize="sm"
          fontFamily="mono"
          color="fg.muted"
          bg="bg.subtle"
          px="2"
          py="0.5"
          rounded="md"
          display="inline-block"
        >
          {formatPriority(cartRule.priority)}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <Text fontSize="sm" color="fg">
          {formatValue()}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <StatusBadge
          status={cartRule.status}
          config={cartRuleStatusConfig}
          variant="dot"
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
