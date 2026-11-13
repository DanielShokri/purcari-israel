import React from 'react';
import { Box, Flex, HStack, Text, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { Order } from '@shared/types';
import { StatusBadge, orderStatusConfig } from '../shared';
import HighlightText from './HighlightText';

interface OrderResultCardProps {
  order: Order;
  searchTerm: string;
}

export default function OrderResultCard({ order, searchTerm }: OrderResultCardProps) {
  return (
    <Flex
      flexDirection={{ base: 'column', sm: 'row' }}
      alignItems={{ base: 'stretch', sm: 'center' }}
      justifyContent="space-between"
      p="4"
      borderBottomWidth="1px"
      borderColor="border.muted"
      _last={{ borderBottom: 'none' }}
      _hover={{ bg: 'bg.subtle' }}
      transition="colors 0.15s"
      gap="4"
    >
      <HStack gap="4">
        <Flex
          w="10"
          h="10"
          rounded="lg"
          bg="brand.50"
          alignItems="center"
          justifyContent="center"
          color="brand.500"
          flexShrink={0}
          _dark={{ bg: 'brand.900/20' }}
        >
          <Text as="span" className="material-symbols-outlined">
            receipt_long
          </Text>
        </Flex>
        <Box>
          <Text fontSize="sm" fontWeight="medium" color="fg">
            הזמנה #{order._id.slice(-4).toUpperCase()}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            לקוח: <HighlightText text={order.customerName} searchTerm={searchTerm} />
          </Text>
        </Box>
      </HStack>
      <Flex
        alignItems="center"
        justifyContent={{ base: 'space-between', sm: 'flex-end' }}
        gap="6"
        w={{ base: 'full', sm: 'auto' }}
      >
        <StatusBadge status={order.status} config={orderStatusConfig} />
        <Text fontSize="sm" color="fg.muted" fontFeatureSettings="'tnum'">
          ₪{order.total.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
        </Text>
        <Link to={`/orders/${order._id}`}>
          <Button
            size="sm"
            variant="outline"
            colorPalette="brand"
            fontWeight="medium"
          >
            צפייה
          </Button>
        </Link>
      </Flex>
    </Flex>
  );
}
