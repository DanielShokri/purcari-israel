// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from "convex/react";
import { api } from '@convex/api';
import { Id } from "@convex/dataModel";
import { OrderStatus } from '@shared/types';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Card,
  SimpleGrid,
  Table,
  Image,
  Flex,
  Select,
  Portal,
  createListCollection,
  Separator,
  Link,
  Alert,
} from '@chakra-ui/react';
import { LoadingState, Breadcrumbs, StatusBadge, orderStatusConfig } from '../components/shared';
import { CancelPaidOrderDialog } from '../components/orders';
import { toaster } from '../components/ui/toaster';

// Paid order statuses: stock is restored on cancel, but refunds are manual in iCredit
const PAID_ORDER_STATUSES: OrderStatus[] = ['processing', 'shipped', 'completed'];

// Helper to format date in Hebrew locale
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL');
};

const formatCurrency = (amount: number) => {
  return `₪${amount.toFixed(2)}`;
};

const orderStatusOptions = createListCollection({
  items: [
    { label: 'ממתין', value: 'pending' },
    { label: 'בטיפול', value: 'processing' },
    { label: 'נשלח', value: 'shipped' },
    { label: 'הושלם', value: 'completed' },
    { label: 'בוטל', value: 'cancelled' },
  ],
});

export default function OrderDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hasEverLoaded, setHasEverLoaded] = useState(false);
  
  // Convex throws on malformed IDs, which crashes into the ErrorBoundary.
  // Validate the shape first so bad URLs land in the not-found state instead.
  const isValidId = !!id && /^[0-9a-z]{20,60}$/.test(id);
  const orderId = isValidId ? id as Id<"orders"> : null;
  const order = useQuery(api.orders.get, orderId ? { orderId } : "skip");
  
  // Track when order has loaded for the first time
  const allLoaded = order !== undefined;
  useEffect(() => {
    if (allLoaded) setHasEverLoaded(true);
  }, [allLoaded]);

  // Only show spinner on first load (cold cache), show data instantly on return visits
  const isLoading = !hasEverLoaded && !allLoaded && isValidId;
  const updateStatus = useMutation(api.orders.updateStatus);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [pendingCancel, setPendingCancel] = useState(false);
  const payment = useQuery(api.icreditHelpers.getPaymentByOrderId, orderId ? { orderId } : "skip");
  const showPaidCancelledBanner =
    order?.status === 'cancelled' && payment?.status === 'completed';

  if (isLoading) {
    return <LoadingState message="טוען פרטי הזמנה..." />;
  }

  if (!order) {
    return (
      <VStack gap="4" py="20" align="center">
        <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.subtle">
          error
        </Text>
        <Text fontSize="lg" color="fg.muted">
          הזמנה לא נמצאה
        </Text>
        <Button variant="outline" onClick={() => navigate('/orders')}>
          חזרה להזמנות
        </Button>
      </VStack>
    );
  }

  const handleStatusChange = async (newStatus: OrderStatus) => {
    setIsUpdating(true);
    try {
      if (!orderId) throw new Error("Invalid order ID");
      await updateStatus({ orderId: orderId, status: newStatus });
      toaster.create({
        title: "סטטוס עודכן",
        type: "success",
      });
    } catch (error) {
      toaster.create({
        title: "שגיאה בעדכון סטטוס",
        type: "error",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Intercept "cancelled": for paid orders confirm first; the dropdown keeps the old status until then
  const handleSelectChange = (newStatus: OrderStatus) => {
    if (newStatus === 'cancelled' && PAID_ORDER_STATUSES.includes(order.status)) {
      setPendingCancel(true);
      return;
    }
    void handleStatusChange(newStatus);
  };

  const handleConfirmCancel = async () => {
    await handleStatusChange('cancelled');
    setPendingCancel(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = () => {
    // Receipt download functionality placeholder
  };

  // Get customer initials for avatar fallback
  const getInitials = (name: string) => {
    return name.charAt(0);
  };

  return (
    <VStack gap="6" align="stretch">
      <Breadcrumbs
        items={[
          { label: 'בית', href: '#/' },
          { label: 'הזמנות', href: '#/orders' },
          { label: 'פרטי הזמנה' },
        ]}
      />

      {showPaidCancelledBanner && (
        <Alert.Root status="warning" variant="subtle" rounded="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              ההזמנה בוטלה אך התשלום התקבל - נדרש החזר ידני ב-iCredit
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* Page Header */}
      <Flex
        direction={{ base: 'column', sm: 'row' }}
        justify="space-between"
        align={{ base: 'start', sm: 'center' }}
        gap="4"
        py="6"
      >
         <Box>
             <Text fontSize="2xl" fontWeight="medium" color="fg">
               הזמנה #{order.orderNumber || order._id.slice(-6)}
             </Text>
            <HStack gap="2" fontSize="sm" color="fg.muted" mt="1">
              <Text>נוצרה ב-{formatDate(order.createdAt)}</Text>
              <Text>•</Text>
              <Text dir="ltr">{formatTime(order.createdAt)}</Text>
            </HStack>
          </Box>
        <Button
          variant="outline"
          size="md"
          onClick={handlePrint}
          borderColor="border"
          bg="bg.panel"
          _hover={{ bg: 'bg.subtle' }}
        >
          <Text as="span" className="material-symbols-outlined" fontSize="18px">
            print
          </Text>
          <Text as="span">הדפס חשבונית</Text>
        </Button>
      </Flex>

      {/* Order Summary Stats */}
      <SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
        {/* Order Date */}
        <Card.Root>
          <Card.Body p="6">
            <Text fontSize="sm" fontWeight="medium" color="fg.muted" mb="1">
              תאריך הזמנה
            </Text>
            <Text fontSize="xl" fontWeight="medium" color="fg" dir="ltr">
              {formatShortDate(order.createdAt)}
            </Text>
          </Card.Body>
        </Card.Root>

        {/* Status (Editable) */}
        <Card.Root>
          <Card.Body p="6">
            <Text fontSize="sm" fontWeight="medium" color="fg.muted" mb="2">
              סטטוס
            </Text>
            <Select.Root
              collection={orderStatusOptions}
              size="sm"
              value={[order.status]}
              onValueChange={(e) => handleSelectChange(e.value[0] as OrderStatus)}
              disabled={isUpdating}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger
                  bg="bg.subtle"
                  borderColor="border"
                  fontWeight="medium"
                >
                  <Select.ValueText placeholder="בחר סטטוס" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {orderStatusOptions.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </Card.Body>
        </Card.Root>

        {/* Total */}
        <Card.Root>
          <Card.Body p="6">
            <Text fontSize="sm" fontWeight="medium" color="fg.muted" mb="1">
              סה״כ לתשלום
            </Text>
            <Text fontSize="xl" fontWeight="medium" color="brand.500">
              {formatCurrency(order.total)}
            </Text>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      <CancelPaidOrderDialog
        isOpen={pendingCancel}
        onClose={() => setPendingCancel(false)}
        onConfirm={handleConfirmCancel}
        isSubmitting={isUpdating}
      />

      {/* Customer & Shipping Row */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="6" alignItems="stretch">
        {/* Customer Details Card */}
        <Card.Root overflow="hidden" h="full">
          <Box
            p="4"
            borderBottomWidth="1px"
            borderColor="border"
            bg="bg.subtle"
          >
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                person
              </Text>
              <Text fontWeight="semibold" color="fg">
                פרטי לקוח
              </Text>
            </HStack>
          </Box>
          <Card.Body p="5">
            <VStack gap="4" align="stretch">
              <HStack gap="4">
                {order.customerAvatar ? (
                  <Image
                    src={order.customerAvatar}
                    alt={order.customerName}
                    boxSize="12"
                    rounded="full"
                    objectFit="cover"
                  />
                ) : (
                  <Flex
                    boxSize="12"
                    rounded="full"
                    bg="bg.muted"
                    align="center"
                    justify="center"
                    fontSize="xl"
                    fontWeight="medium"
                    color="fg.muted"
                  >
                    {getInitials(order.customerName)}
                  </Flex>
                )}
                <Box>
                  <Text fontWeight="medium" color="fg">
                    {order.customerName}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    לקוח רשום
                  </Text>
                </Box>
              </HStack>

              <VStack gap="3" align="stretch" pt="2">
                <HStack gap="3" fontSize="sm">
                  <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                    mail
                  </Text>
                  <Link
                    href={`mailto:${order.customerEmail}`}
                    color="fg"
                    _hover={{ color: 'brand.500' }}
                    dir="ltr"
                    truncate
                  >
                    {order.customerEmail}
                  </Link>
                </HStack>
                {order.customerPhone && (
                  <HStack gap="3" fontSize="sm">
                    <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                      call
                    </Text>
                    <Link
                      href={`tel:${order.customerPhone}`}
                      color="fg"
                      _hover={{ color: 'brand.500' }}
                      dir="ltr"
                    >
                      {order.customerPhone}
                    </Link>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>

        {/* Shipping Address Card */}
        <Card.Root overflow="hidden" h="full">
          <Box
            p="4"
            borderBottomWidth="1px"
            borderColor="border"
            bg="bg.subtle"
          >
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                local_shipping
              </Text>
              <Text fontWeight="semibold" color="fg">
                כתובת למשלוח
              </Text>
            </HStack>
          </Box>
          <Card.Body p="5">
            <HStack gap="3" align="start">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted" mt="0.5">
                location_on
              </Text>
              <Box fontSize="sm" color="fg" lineHeight="relaxed">
                <Text>{order.shippingStreet}</Text>
                {order.shippingApartment && (
                  <Text>{order.shippingApartment}</Text>
                )}
                <Text>
                  {order.shippingCity}, {order.shippingPostalCode}
                </Text>
                <Text>{order.shippingCountry}</Text>
              </Box>
            </HStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>

      {/* Order Items Card - Full Width */}
      <Card.Root overflow="hidden">
        <Box
          p="4"
          borderBottomWidth="1px"
          borderColor="border"
          bg="bg.subtle"
        >
          <HStack justify="space-between">
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                list_alt
              </Text>
              <Text fontWeight="semibold" color="fg">
                פריטים בהזמנה
              </Text>
            </HStack>
            <Text
              bg="bg.muted"
              color="fg.muted"
              fontSize="xs"
              fontWeight="medium"
              px="2"
              py="0.5"
              rounded="full"
            >
              {order.items.length} פריטים
            </Text>
          </HStack>
        </Box>
        <Box overflowX="auto">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                <Table.ColumnHeader px="6" py="3" fontWeight="medium" color="fg.muted" w="50%">
                  מוצר
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="3" fontWeight="medium" color="fg.muted" textAlign="center">
                  כמות
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="3" fontWeight="medium" color="fg.muted" textAlign="start">
                  מחיר
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="3" fontWeight="medium" color="fg.muted" textAlign="start">
                  סה״כ
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {order.items.map((item) => (
                <Table.Row key={item._id} _hover={{ bg: 'bg.subtle' }} transition="background 0.2s">
                  <Table.Cell px="6" py="4">
                    <HStack gap="4">
                      <Box
                        boxSize="16"
                        rounded="lg"
                        borderWidth="1px"
                        borderColor="border"
                        overflow="hidden"
                        flexShrink={0}
                        bg="white"
                      >
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            w="full"
                            h="full"
                            objectFit="cover"
                          />
                        ) : (
                          <Flex w="full" h="full" align="center" justify="center" bg="bg.muted">
                            <Text as="span" className="material-symbols-outlined" color="fg.muted">
                              image
                            </Text>
                          </Flex>
                        )}
                      </Box>
                      <Box>
                        <Text fontWeight="medium" color="fg">
                          {item.productName}
                        </Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell px="6" py="4" textAlign="center" color="fg.muted">
                    {item.quantity.toString()}
                  </Table.Cell>
                  <Table.Cell px="6" py="4" textAlign="start" color="fg.muted">
                    {formatCurrency(item.price)}
                  </Table.Cell>
                  <Table.Cell px="6" py="4" textAlign="start" fontWeight="medium" color="fg">
                    {formatCurrency(item.total)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>
      </Card.Root>

      {/* Bottom Section: Payment Method & Summary */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
        {/* Payment Method */}
        <Card.Root overflow="hidden" h="full">
          <Box
            p="4"
            borderBottomWidth="1px"
            borderColor="border"
            bg="bg.subtle"
          >
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                credit_card
              </Text>
              <Text fontWeight="semibold" color="fg">
                שיטת תשלום
              </Text>
            </HStack>
          </Box>
          <Card.Body p="6" display="flex" flexDirection="column" gap="4" flex="1" justifyContent="center">
            <HStack
              gap="4"
              p="4"
              borderWidth="1px"
              borderColor="border"
              rounded="lg"
              bg="bg.subtle"
            >
              <Flex
                w="12"
                h="8"
                bg="white"
                rounded="md"
                borderWidth="1px"
                borderColor="border"
                align="center"
                justify="center"
              >
                <Text fontWeight="medium" color="brand.800" fontSize="xs">
                  {order.paymentMethod.toUpperCase()}
                </Text>
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="fg">
                  {order.paymentMethod}
                </Text>
                {order.paymentCardExpiry && (
                  <Text fontSize="xs" color="fg.muted">
                    תוקף: {order.paymentCardExpiry}
                  </Text>
                )}
              </Box>
            </HStack>
            <HStack justify="space-between" fontSize="sm" color="fg.muted">
              <Text>מזהה תשלום:</Text>
              <Text fontFamily="mono" dir="ltr">{order.paymentTransactionId}</Text>
            </HStack>
            <HStack justify="space-between" fontSize="sm" color="fg.muted">
              <Text>תאריך חיוב:</Text>
              <Text dir="ltr">{order.paymentChargeDate}</Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Payment Summary */}
        <Card.Root overflow="hidden">
          <Box
            p="4"
            borderBottomWidth="1px"
            borderColor="border"
            bg="bg.subtle"
          >
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                receipt_long
              </Text>
              <Text fontWeight="semibold" color="fg">
                סיכום תשלום
              </Text>
            </HStack>
          </Box>
          <Card.Body p="5">
            <VStack gap="3" align="stretch">
              <HStack justify="space-between" fontSize="sm" color="fg.muted">
                <Text>סכום ביניים</Text>
                <Text>{formatCurrency(order.subtotal)}</Text>
              </HStack>
              <HStack justify="space-between" fontSize="sm" color="fg.muted">
                <Text>משלוח</Text>
                <Text>{formatCurrency(order.shippingCost)}</Text>
              </HStack>
              <HStack justify="space-between" fontSize="sm" color="fg.muted">
                <Text>מס (כלול)</Text>
                <Text>{formatCurrency(order.tax)}</Text>
              </HStack>
              <Separator />
              <HStack justify="space-between" fontWeight="medium" color="fg">
                <Text>סה״כ לתשלום</Text>
                <Text fontSize="lg">{formatCurrency(order.total)}</Text>
              </HStack>
              <Button
                variant="outline"
                size="sm"
                w="full"
                mt="2"
                borderColor="border"
                _hover={{ bg: 'bg.subtle' }}
                onClick={handleDownloadReceipt}
              >
                הורד קבלה
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </VStack>
  );
}
