import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Card,
  Switch,
  Select,
  Portal,
  createListCollection,
} from '@chakra-ui/react';
import { StockStatus } from '@shared/types';

interface InventoryCardProps {
  sku: string;
  onSkuChange: (sku: string) => void;
  quantityInStock: number;
  onQuantityChange: (quantity: number) => void;
  stockStatus: StockStatus;
  onStockStatusChange: (status: StockStatus) => void;
  isFeatured: boolean;
  onFeaturedChange: (isFeatured: boolean) => void;
}

const stockStatusOptions = createListCollection({
  items: [
    { label: 'במלאי', value: StockStatus.IN_STOCK },
    { label: 'מלאי נמוך', value: StockStatus.LOW_STOCK },
    { label: 'אזל מהמלאי', value: StockStatus.OUT_OF_STOCK },
  ],
});

export default function InventoryCard({
  sku,
  onSkuChange,
  quantityInStock,
  onQuantityChange,
  stockStatus,
  onStockStatusChange,
  isFeatured,
  onFeaturedChange,
}: InventoryCardProps) {
  const getStockStatusColor = (status: StockStatus) => {
    switch (status) {
      case StockStatus.IN_STOCK:
        return 'green';
      case StockStatus.LOW_STOCK:
        return 'yellow';
      case StockStatus.OUT_OF_STOCK:
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Card.Root>
      <Card.Header
        px="5"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.subtle"
      >
        <Flex justify="space-between" alignItems="center">
          <Heading size="md" color="fg">
            מלאי
          </Heading>
          <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
            inventory_2
          </Text>
        </Flex>
      </Card.Header>
      <Card.Body p="5">
        <VStack gap="4" align="stretch">
          {/* SKU */}
          <VStack align="start" gap="2">
            <Text fontSize="xs" fontWeight="medium" color="fg.muted">
              מק"ט (SKU)
            </Text>
            <Input
              size="sm"
              dir="ltr"
              textAlign="left"
              value={sku}
              onChange={(e) => onSkuChange(e.target.value)}
              placeholder="SKU-001"
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ringColor: 'brand.500', borderColor: 'brand.500' }}
            />
          </VStack>

          {/* Quantity in Stock */}
          <VStack align="start" gap="2">
            <Text fontSize="xs" fontWeight="medium" color="fg.muted">
              כמות במלאי
            </Text>
            <Input
              size="sm"
              type="number"
              dir="ltr"
              textAlign="left"
              value={quantityInStock}
              onChange={(e) => onQuantityChange(Number(e.target.value) || 0)}
              placeholder="0"
              min={0}
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ringColor: 'brand.500', borderColor: 'brand.500' }}
            />
          </VStack>

          {/* Stock Status */}
          <VStack align="start" gap="2">
            <Text fontSize="xs" fontWeight="medium" color="fg.muted">
              סטטוס מלאי
            </Text>
            <Select.Root
              collection={stockStatusOptions}
              size="sm"
              value={[stockStatus]}
              onValueChange={(e) => onStockStatusChange(e.value[0] as StockStatus)}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger
                  bg="bg.subtle"
                  borderColor="border"
                  _focus={{ ringColor: 'brand.500', borderColor: 'brand.500' }}
                >
                  <Select.ValueText placeholder="בחר סטטוס" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                    expand_more
                  </Text>
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {stockStatusOptions.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
            <HStack gap="1.5" mt="1">
              <Box
                w="2"
                h="2"
                rounded="full"
                bg={`${getStockStatusColor(stockStatus)}.500`}
              />
              <Text fontSize="xs" color="fg.muted">
                {stockStatus === StockStatus.IN_STOCK && 'המוצר זמין למכירה'}
                {stockStatus === StockStatus.LOW_STOCK && 'יש להזמין מלאי נוסף'}
                {stockStatus === StockStatus.OUT_OF_STOCK && 'המוצר לא זמין כרגע'}
              </Text>
            </HStack>
          </VStack>

          {/* Featured Product Toggle */}
          <Box pt="2" borderTopWidth="1px" borderColor="border">
            <HStack justify="space-between" py="2">
              <VStack align="start" gap="0">
                <HStack gap="2">
                  <Text fontSize="sm" fontWeight="medium" color="fg">
                    מוצר מומלץ
                  </Text>
                  <Text as="span" className="material-symbols-outlined" fontSize="18px" color="yellow.500">
                    star
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  הצג בעמוד הבית ובמקומות בולטים
                </Text>
              </VStack>
              <Box style={{ direction: 'ltr' }}>
                <Switch.Root
                  checked={isFeatured}
                  onCheckedChange={(e) => onFeaturedChange(e.checked)}
                  colorPalette="yellow"
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Box>
            </HStack>
          </Box>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
