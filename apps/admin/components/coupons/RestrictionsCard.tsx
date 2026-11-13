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
  Flex,
  Switch,
} from '@chakra-ui/react';

interface RestrictionsCardProps {
  register: any;
  watch: any;
  setValue: any;
  categoriesList: any;
  productsList: any;
  selectedCategoryIds: string[];
  selectedProductIds: string[];
  categoryInput: string;
  setCategoryInput: (value: string) => void;
  productInput: string;
  setProductInput: (value: string) => void;
  onAddCategory: () => void;
  onRemoveCategory: (id: string) => void;
  onAddProduct: () => void;
  onRemoveProduct: (id: string) => void;
}

export function RestrictionsCard({
  register,
  watch,
  setValue,
  categoriesList,
  productsList,
  selectedCategoryIds,
  selectedProductIds,
  categoryInput,
  setCategoryInput,
  productInput,
  setProductInput,
  onAddCategory,
  onRemoveCategory,
  onAddProduct,
  onRemoveProduct,
}: RestrictionsCardProps) {
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
            block
          </Text>
          <Heading size="md" color="fg">
            הגבלות מתקדמות
          </Heading>
        </HStack>
      </Card.Header>
      <Card.Body p="6">
        <VStack gap="5" align="stretch">
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              החל על קטגוריות / מוצרים ספציפיים
            </Text>
            <Box
              w="full"
              bg="bg.subtle"
              borderWidth="1px"
              borderColor="border"
              rounded="lg"
              minH="48px"
              p="2"
              display="flex"
              flexWrap="wrap"
              gap="2"
              alignItems="center"
            >
              {selectedCategoryIds.map((catId) => {
                const category = categoriesList?.find((c: any) => c._id === catId);
                return (
                  <Box
                    key={catId}
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="border"
                    rounded="md"
                    px="2"
                    py="1"
                    fontSize="xs"
                    fontWeight="medium"
                    display="flex"
                    alignItems="center"
                    gap="1"
                  >
                    <Text>{category?.name || catId}</Text>
                    <Text
                      as="span"
                      className="material-symbols-outlined"
                      fontSize="18px"
                      cursor="pointer"
                      _hover={{ color: 'red.500' }}
                      onClick={() => onRemoveCategory(catId)}
                    >
                      close
                    </Text>
                  </Box>
                );
              })}
              {selectedProductIds.map((prodId) => {
                const product = productsList?.find((p: any) => p._id === prodId);
                return (
                  <Box
                    key={prodId}
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="border"
                    rounded="md"
                    px="2"
                    py="1"
                    fontSize="xs"
                    fontWeight="medium"
                    display="flex"
                    alignItems="center"
                    gap="1"
                  >
                    <Text>{product?.productName || prodId}</Text>
                    <Text
                      as="span"
                      className="material-symbols-outlined"
                      fontSize="18px"
                      cursor="pointer"
                      _hover={{ color: 'red.500' }}
                      onClick={() => onRemoveProduct(prodId)}
                    >
                      close
                    </Text>
                  </Box>
                );
              })}
              <Input
                placeholder="+ הוסף קטגוריה"
                value={categoryInput}
                onChange={(e) => setCategoryInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    onAddCategory();
                  }
                }}
                bg="transparent"
                border="none"
                fontSize="sm"
                h="8"
                minW="120px"
                _focus={{ ring: 0 }}
              />
            </Box>
            <Text fontSize="xs" color="fg.muted">
              השאר ריק כדי להחיל על כל החנות
            </Text>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="8">
            <Flex alignItems="center" gap="3">
              <Switch.Root
                size="sm"
                checked={watch('firstPurchaseOnly') || false}
                onCheckedChange={(e) => setValue('firstPurchaseOnly', e.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              <Text fontSize="sm" fontWeight="medium" color="fg">
                תקף לרכישה ראשונה בלבד
              </Text>
            </Flex>
            <Flex alignItems="center" gap="3">
              <Switch.Root
                size="sm"
                checked={watch('excludeOtherCoupons') || false}
                onCheckedChange={(e) => setValue('excludeOtherCoupons', e.checked)}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
              <Text fontSize="sm" fontWeight="medium" color="fg">
                לא ניתן לשילוב עם קופונים אחרים
              </Text>
            </Flex>
          </SimpleGrid>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
