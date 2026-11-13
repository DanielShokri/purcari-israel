import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Card,
  SimpleGrid,
  Select,
  Portal,
  createListCollection,
} from '@chakra-ui/react';
import { CouponDiscountType } from '@shared/types';

const discountTypeOptions = createListCollection({
  items: [
    { label: 'אחוז הנחה (%)', value: CouponDiscountType.PERCENTAGE },
    { label: 'סכום קבוע (₪)', value: CouponDiscountType.FIXED_AMOUNT },
    { label: 'משלוח חינם', value: CouponDiscountType.FREE_SHIPPING },
    { label: 'מוצר חינם / מתנה', value: CouponDiscountType.FREE_PRODUCT },
    { label: 'קנה X קבל Y', value: CouponDiscountType.BUY_X_GET_Y },
  ],
});

interface DiscountConfigCardProps {
  register: any;
  errors: any;
  setValue: any;
  discountType: CouponDiscountType;
  getDiscountValueValidation: () => any;
  validateBuyQuantity: (value: number | undefined) => string | boolean;
  validateGetQuantity: (value: number | undefined) => string | boolean;
}

export function DiscountConfigCard({
  register,
  errors,
  setValue,
  discountType,
  getDiscountValueValidation,
  validateBuyQuantity,
  validateGetQuantity,
}: DiscountConfigCardProps) {
  return (
    <Card.Root>
      <Card.Header
        px="6"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.subtle"
      >
        <HStack gap="2">
          <Text as="span" className="material-symbols-outlined" fontSize="18px" color="brand.500">
            percent
          </Text>
          <Heading size="md" color="fg">
            הגדרות הנחה
          </Heading>
        </HStack>
      </Card.Header>
      <Card.Body p="6">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              סוג הנחה
            </Text>
            <Select.Root
              collection={discountTypeOptions}
              value={discountType ? [discountType] : []}
              onValueChange={(e) => setValue('discountType', e.value[0] as CouponDiscountType)}
            >
              <Select.HiddenSelect />
              <Select.Control
                bg="bg.subtle"
                borderColor="border"
                _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
              >
                <Select.Trigger>
                  <Select.ValueText placeholder="בחר סוג הנחה" />
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
                    {discountTypeOptions.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              ערך ההנחה
            </Text>
            <Box position="relative" w="full">
              <Input
                {...register('discountValue', getDiscountValueValidation())}
                type="number"
                placeholder="0"
                bg="bg.subtle"
                borderColor="border"
                pr={discountType === CouponDiscountType.PERCENTAGE ? '10' : '4'}
                _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
              />
              {discountType === CouponDiscountType.PERCENTAGE && (
                <Text
                  position="absolute"
                  top="50%"
                  right="3"
                  transform="translateY(-50%)"
                  color="fg.muted"
                  fontSize="sm"
                  pointerEvents="none"
                >
                  %
                </Text>
              )}
            </Box>
            {errors.discountValue && (
              <Text fontSize="xs" color="red.500">{errors.discountValue.message}</Text>
            )}
            {discountType === CouponDiscountType.BUY_X_GET_Y && (
              <SimpleGrid columns={2} gap="3" w="full" mt="2">
                <VStack align="start" gap="1">
                  <Text fontSize="xs" color="fg.muted">קנה X *</Text>
                  <Input
                    {...register('buyQuantity', { 
                      valueAsNumber: true,
                      validate: validateBuyQuantity
                    })}
                    type="number"
                    size="sm"
                    bg="bg.subtle"
                    borderColor={errors.buyQuantity ? "red.500" : "border"}
                  />
                  {errors.buyQuantity && (
                    <Text fontSize="xs" color="red.500">{errors.buyQuantity.message}</Text>
                  )}
                </VStack>
                <VStack align="start" gap="1">
                  <Text fontSize="xs" color="fg.muted">קבל Y *</Text>
                  <Input
                    {...register('getQuantity', { 
                      valueAsNumber: true,
                      validate: validateGetQuantity
                    })}
                    type="number"
                    size="sm"
                    bg="bg.subtle"
                    borderColor={errors.getQuantity ? "red.500" : "border"}
                  />
                  {errors.getQuantity && (
                    <Text fontSize="xs" color="red.500">{errors.getQuantity.message}</Text>
                  )}
                </VStack>
              </SimpleGrid>
            )}
          </VStack>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
