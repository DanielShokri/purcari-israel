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
  Badge,
} from '@chakra-ui/react';

interface PricingCardProps {
  price: number;
  onPriceChange: (price: number) => void;
  onSale: boolean;
  onSaleChange: (onSale: boolean) => void;
  salePrice: number;
  onSalePriceChange: (salePrice: number) => void;
}

export default function PricingCard({
  price,
  onPriceChange,
  onSale,
  onSaleChange,
  salePrice,
  onSalePriceChange,
}: PricingCardProps) {
  // Calculate discount percentage
  const discountPercent = price > 0 && salePrice > 0 && salePrice < price
    ? Math.round(((price - salePrice) / price) * 100)
    : 0;

  return (
    <Card.Root>
      <Card.Header
        px="5"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.subtle"
      >
        <Flex justify="space-between" alignItems="center" flexWrap="wrap" gap="2">
          <Heading size="md" color="fg">
            תמחור
          </Heading>
          <Text as="span" className="material-symbols-outlined" fontSize="lg" color="fg.muted">
            payments
          </Text>
        </Flex>
      </Card.Header>
      <Card.Body p="5">
        <VStack gap="4" align="stretch">
          {/* Regular Price */}
          <VStack align="start" gap="2">
            <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
              מחיר רגיל
            </Text>
            <Box position="relative" w="full">
              <Text
                position="absolute"
                top="50%"
                right="3"
                transform="translateY(-50%)"
                color="fg.muted"
                fontSize="sm"
                fontWeight="medium"
                pointerEvents="none"
              >
                ₪
              </Text>
              <Input
                type="number"
                size="sm"
                pr="8"
                dir="ltr"
                textAlign="left"
                value={price || ''}
                onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                bg="bg.subtle"
                borderColor="border"
                _focus={{ ringColor: 'blue.500', borderColor: 'blue.500' }}
              />
            </Box>
          </VStack>

          {/* On Sale Toggle */}
          <HStack justify="space-between" align="center" py="2" flexWrap="wrap" gap="2">
            <VStack align="start" gap="0" flex="1">
              <Text fontSize="sm" fontWeight="medium" color="fg">
                במבצע
              </Text>
              <Text fontSize="xs" color="fg.muted">
                הפעל מחיר מבצע למוצר
              </Text>
            </VStack>
            <Box style={{ direction: 'ltr' }}>
              <Switch.Root
                checked={onSale}
                onCheckedChange={(e) => onSaleChange(e.checked)}
                colorPalette="blue"
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </Box>
          </HStack>

          {/* Sale Price - Only shown when on sale */}
          {onSale && (
            <VStack align="start" gap="2">
              <HStack justify="space-between" w="full" align="center">
                <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
                  מחיר מבצע
                </Text>
                {discountPercent > 0 && (
                  <Badge colorPalette="green" fontSize="xs" px="2" py="0.5" rounded="full">
                    {discountPercent}% הנחה
                  </Badge>
                )}
              </HStack>
              <Box position="relative" w="full">
                <Text
                  position="absolute"
                  top="50%"
                  right="3"
                  transform="translateY(-50%)"
                  color="fg.muted"
                  fontSize="sm"
                  fontWeight="medium"
                  pointerEvents="none"
                >
                  ₪
                </Text>
                <Input
                  type="number"
                  size="sm"
                  pr="8"
                  dir="ltr"
                  textAlign="left"
                  value={salePrice || ''}
                  onChange={(e) => onSalePriceChange(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  bg="bg.subtle"
                  borderColor="border"
                  _focus={{ ringColor: 'green.500', borderColor: 'green.500' }}
                />
              </Box>
              {salePrice >= price && price > 0 && (
                <Text fontSize="xs" color="red.500">
                  מחיר המבצע חייב להיות נמוך מהמחיר הרגיל
                </Text>
              )}
            </VStack>
          )}

          {/* Price Summary */}
          {onSale && salePrice > 0 && salePrice < price && (
            <Box p="3" bg="green.500/10" rounded="lg" borderWidth="1px" borderColor="green.500/20">
              <HStack justify="space-between">
                <Text fontSize="sm" color="fg.muted">מחיר רגיל:</Text>
                <Text fontSize="sm" color="fg.muted" textDecoration="line-through" dir="ltr">
                  ₪{price.toFixed(2)}
                </Text>
              </HStack>
              <HStack justify="space-between" mt="1">
                <Text fontSize="sm" fontWeight="bold" color="green.600" _dark={{ color: 'green.400' }}>
                  מחיר מבצע:
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="green.600" _dark={{ color: 'green.400' }} dir="ltr">
                  ₪{salePrice.toFixed(2)}
                </Text>
              </HStack>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}