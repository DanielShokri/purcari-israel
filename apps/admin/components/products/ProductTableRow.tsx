import React from 'react';
import { Box, HStack, VStack, Text, Table, Checkbox, IconButton, Badge } from '@chakra-ui/react';
import { Product } from '@shared/types';

interface ProductTableRowProps {
  product: Product;
  index: number;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  getCategoryLabel: (category: string) => string;
  getRandomImage: (index: number) => string;
}

export default function ProductTableRow({
  product,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  getCategoryLabel,
  getRandomImage
}: ProductTableRowProps) {
  const formatPrice = (price: number) => `₪${price.toFixed(2)}`;
  const getStockBadge = (quantity: number) => {
    if (quantity === 0) return { color: 'red', label: 'אזל מהמלאי' };
    if (quantity < 10) return { color: 'orange', label: `${quantity} יח׳` };
    return { color: 'green', label: `${quantity} יח׳` };
  };
  const stockInfo = getStockBadge(product.quantityInStock);
  return (
    <Table.Row
      _hover={{ bg: 'bg.subtle' }}
      transition="colors"
      css={{
        '& .action-buttons': { opacity: 0 },
        '&:hover .action-buttons': { opacity: 1 },
      }}
    >
      <Table.Cell px={{ base: '4', lg: '6' }} py="4">
        <Checkbox.Root
          size="sm"
          checked={isSelected}
          onCheckedChange={(e) => onSelect(!!e.checked)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      </Table.Cell>
      <Table.Cell px={{ base: '4', lg: '6' }} py="4">
        <HStack gap="3" align="center">
          <Box
            w={{ base: '8', lg: '10' }}
            h={{ base: '8', lg: '10' }}
            rounded="lg"
            backgroundSize="cover"
            backgroundPosition="center"
            bgColor="gray.200"
            flexShrink={0}
            position="relative"
            style={{ backgroundImage: `url("${product.featuredImage || getRandomImage(index)}")` }}
          >
            {product.isFeatured && (
              <Box
                position="absolute"
                top="-1"
                right="-1"
                bg="yellow.400"
                rounded="full"
                p="0.5"
              >
                <Text as="span" className="material-symbols-outlined" fontSize="18px" color="yellow.900">
                  star
                </Text>
              </Box>
            )}
          </Box>
          <VStack align="start" gap="0">
            <HStack gap="2">
              <Text
                fontSize="sm"
                fontWeight="semibold"
                color="fg"
                _hover={{ color: 'brand.500' }}
                cursor="pointer"
                transition="colors"
                onClick={onEdit}
              >
                {product.productName}
              </Text>
              {product.onSale && (
                <Badge colorPalette="red" variant="solid" fontSize="2xs">
                  מבצע
                </Badge>
              )}
            </HStack>
            <Text fontSize="xs" color="fg.muted">
              מק"ט: {product.sku}
            </Text>
          </VStack>
        </HStack>
      </Table.Cell>
      <Table.Cell px={{ base: '4', lg: '6' }} py="4">
        <Text fontSize="sm" color="fg">
          {getCategoryLabel(product.category)}
        </Text>
      </Table.Cell>
      <Table.Cell px={{ base: '4', lg: '6' }} py="4">
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
