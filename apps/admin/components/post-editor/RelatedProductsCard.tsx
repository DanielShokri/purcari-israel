import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Card,
  Button,
  IconButton,
} from '@chakra-ui/react';

interface RelatedProduct {
  id: string;
  name: string;
}

interface RelatedProductsCardProps {
  relatedProducts: RelatedProduct[];
  onAddProduct: (productId: string) => void;
  onRemoveProduct: (productId: string) => void;
  availableProducts: RelatedProduct[];
}

export default function RelatedProductsCard({
  relatedProducts,
  onAddProduct,
  onRemoveProduct,
  availableProducts,
}: RelatedProductsCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredProducts = availableProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !relatedProducts.some((rp) => rp.id === p.id)
  );

  const handleSelectProduct = (product: RelatedProduct) => {
    onAddProduct(product.id);
    setSearchTerm('');
    setShowDropdown(false);
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
            מוצרים קשורים
          </Heading>
          <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
            link
          </Text>
        </Flex>
      </Card.Header>
      <Card.Body p="5">
        <VStack gap="4" align="stretch">
          {/* Search Input */}
          <Box position="relative">
            <Input
              size="sm"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              placeholder="חפש מוצר להוספה..."
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ringColor: 'brand.500', borderColor: 'brand.500' }}
            />
            <Text
              as="span"
              className="material-symbols-outlined"
              position="absolute"
              top="50%"
              left="3"
              transform="translateY(-50%)"
              fontSize="18px"
              color="fg.muted"
              pointerEvents="none"
            >
              search
            </Text>

            {/* Dropdown */}
            {showDropdown && searchTerm && filteredProducts.length > 0 && (
              <Box
                position="absolute"
                top="100%"
                right="0"
                left="0"
                mt="1"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border"
                rounded="lg"
                shadow="lg"
                zIndex={10}
                maxH="200px"
                overflowY="auto"
              >
                {filteredProducts.map((product) => (
                  <Box
                    key={product.id}
                    px="3"
                    py="2"
                    cursor="pointer"
                    _hover={{ bg: 'bg.subtle' }}
                    onClick={() => handleSelectProduct(product)}
                  >
                    <Text fontSize="sm" color="fg">
                      {product.name}
                    </Text>
                  </Box>
                ))}
              </Box>
            )}

            {showDropdown && searchTerm && filteredProducts.length === 0 && (
              <Box
                position="absolute"
                top="100%"
                right="0"
                left="0"
                mt="1"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border"
                rounded="lg"
                shadow="lg"
                zIndex={10}
                p="3"
              >
                <Text fontSize="sm" color="fg.muted" textAlign="center">
                  לא נמצאו מוצרים
                </Text>
              </Box>
            )}
          </Box>

          {/* Selected Products */}
          {relatedProducts.length > 0 ? (
            <VStack gap="2" align="stretch">
              {relatedProducts.map((product) => (
                <HStack
                  key={product.id}
                  p="2"
                  bg="bg.subtle"
                  rounded="lg"
                  borderWidth="1px"
                  borderColor="border"
                  justify="space-between"
                >
                  <HStack gap="2">
                    <Box
                      w="8"
                      h="8"
                      rounded="md"
                      bg="brand.500/10"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text as="span" className="material-symbols-outlined" fontSize="18px" color="brand.500">
                        inventory_2
                      </Text>
                    </Box>
                    <Text fontSize="sm" fontWeight="medium" color="fg">
                      {product.name}
                    </Text>
                  </HStack>
                  <IconButton
                    aria-label="הסר מוצר"
                    variant="ghost"
                    size="xs"
                    color="fg.muted"
                    _hover={{ color: 'red.500', bg: 'red.500/10' }}
                    onClick={() => onRemoveProduct(product.id)}
                  >
                    <Text as="span" className="material-symbols-outlined" fontSize="18px">
                      close
                    </Text>
                  </IconButton>
                </HStack>
              ))}
            </VStack>
          ) : (
            <Box p="4" bg="bg.subtle" rounded="lg" textAlign="center">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted" mb="2">
                link_off
              </Text>
              <Text fontSize="sm" color="fg.muted">
                אין מוצרים קשורים
              </Text>
              <Text fontSize="xs" color="fg.subtle" mt="1">
                חפש והוסף מוצרים שיוצגו יחד עם מוצר זה
              </Text>
            </Box>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
