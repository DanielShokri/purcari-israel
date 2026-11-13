import React from 'react';
import { Table, Checkbox, HStack, VStack, Box, Text, Flex, IconButton } from '@chakra-ui/react';
import { Order } from '@shared/types';
import { StatusBadge, orderStatusConfig } from '../shared';

interface OrderTableRowProps {
  order: Order;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Generate initials from customer name
function getInitials(name: string): string {
  const words = name.split(' ');
  if (words.length >= 2) {
    return words[0].charAt(0) + words[1].charAt(0);
  }
  return name.substring(0, 2);
}

// Generate a consistent color based on name
function getAvatarColor(name: string): string {
  const colors = ['blue', 'purple', 'orange', 'teal', 'pink', 'cyan'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function OrderTableRow({
  order,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: OrderTableRowProps) {
  const avatarColor = getAvatarColor(order.customerName);
  const initials = getInitials(order.customerName);

  return (
    <Table.Row
      _hover={{ bg: 'bg.subtle' }}
      transition="background 0.15s"
      css={{
        '& .row-actions': { opacity: 0 },
        '&:hover .row-actions': { opacity: 1 },
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
        <Text fontWeight="semibold" color="fg">
          #{order.orderNumber || order._id.slice(-6)}
        </Text>
      </Table.Cell>

      <Table.Cell px="6" py="4">
        <HStack gap="3">
          {order.customerAvatar ? (
            <Box
              w="8"
              h="8"
              rounded="full"
              backgroundSize="cover"
              backgroundPosition="center"
              bgColor="gray.200"
              style={{ backgroundImage: `url("${order.customerAvatar}")` }}
            />
          ) : (
            <Flex
              w="8"
              h="8"
              rounded="full"
              bg={`${avatarColor}.100`}
              color={`${avatarColor}.600`}
              alignItems="center"
              justifyContent="center"
              fontWeight="medium"
              fontSize="xs"
              _dark={{
                bg: `${avatarColor}.900`,
                color: `${avatarColor}.300`,
              }}
            >
              {initials}
            </Flex>
          )}
          <VStack gap="0" align="start">
            <Text fontSize="sm" fontWeight="medium" color="fg">
              {order.customerName}
            </Text>
            <Text fontSize="xs" color="fg.muted" dir="ltr">
              {order.customerEmail}
            </Text>
          </VStack>
        </HStack>
      </Table.Cell>

       <Table.Cell px="6" py="4" color="fg.muted" display={{ base: 'none', md: 'table-cell' }}>
         <Text dir="ltr" textAlign="right">
           {new Date(order._creationTime || Date.now()).toLocaleDateString('he-IL')}
         </Text>
       </Table.Cell>

      <Table.Cell px="6" py="4">
        <Text fontWeight="medium" color="fg" dir="ltr" textAlign="right">
          ₪{order.total.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
        </Text>
      </Table.Cell>

      <Table.Cell px="6" py="4">
        <StatusBadge status={order.status} config={orderStatusConfig} variant="dot" />
      </Table.Cell>

      <Table.Cell px="6" py="4">
        <HStack gap="1" justifyContent="flex-start" className="row-actions" transition="opacity 0.15s">
          <IconButton
            variant="ghost"
            size="xs"
            color="fg.muted"
            _hover={{ color: 'brand.500', bg: 'bg.panel' }}
            onClick={onView}
            aria-label="צפה בפרטים"
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              visibility
            </Text>
          </IconButton>
          <IconButton
            variant="ghost"
            size="xs"
            color="fg.muted"
            _hover={{ color: 'brand.500', bg: 'bg.panel' }}
            onClick={onEdit}
            aria-label="ערוך"
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              edit
            </Text>
          </IconButton>
          <IconButton
            variant="ghost"
            size="xs"
            color="fg.muted"
            _hover={{ color: 'red.500', bg: 'bg.panel' }}
            onClick={onDelete}
            aria-label="מחק"
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
