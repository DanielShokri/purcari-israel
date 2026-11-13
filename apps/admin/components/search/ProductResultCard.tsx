import React from 'react';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { Product } from '@shared/types';
import HighlightText from './HighlightText';

interface ProductResultCardProps {
  product: Product;
  searchTerm: string;
  // Hebrew label resolved from the categories table by the parent
  categoryLabel?: string;
}

export default function ProductResultCard({ product, searchTerm, categoryLabel }: ProductResultCardProps) {
  return (
    <Link to={`/products/${product._id}/edit`} style={{ textDecoration: 'none' }}>
      <Flex
        bg="bg.panel"
        p="4"
        rounded="xl"
        borderWidth="1px"
        borderColor="border"
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems={{ base: 'stretch', md: 'center' }}
        justifyContent="space-between"
        gap="4"
        shadow="sm"
        transition="colors 0.15s ease-out"
        cursor="pointer"
        role="group"
        _hover={{
          borderColor: 'brand.300',
          shadow: 'md',
        }}
      >
        <HStack gap="4">
          <Box
            h="16"
            w="24"
            rounded="lg"
            backgroundSize="cover"
            backgroundPosition="center"
            bg="gray.100"
            flexShrink={0}
            _dark={{ bg: 'gray.700' }}
            style={{
              backgroundImage: product.featuredImage
                ? `url("${product.featuredImage}")`
                : undefined,
            }}
          />
          <Box>
            <Text
              fontSize="md"
              fontWeight="medium"
              color="fg"
              transition="colors 0.15s"
              _groupHover={{ color: 'brand.500' }}
            >
              <HighlightText text={product.productName} searchTerm={searchTerm} />
            </Text>
            {product.shortDescription && (
              <Text fontSize="sm" color="fg.muted" lineClamp={1}>
                <HighlightText text={product.shortDescription} searchTerm={searchTerm} />
              </Text>
            )}
          </Box>
        </HStack>
        <Flex
          alignItems="center"
          justifyContent={{ base: 'space-between', md: 'flex-end' }}
          gap="4"
          w={{ base: 'full', md: 'auto' }}
          mt={{ base: '2', md: '0' }}
          pr="2"
        >
          {categoryLabel && (
            <Text
              fontSize="xs"
              fontWeight="medium"
              color="fg.muted"
              bg="bg.subtle"
              px="2"
              py="1"
              rounded="md"
            >
              {categoryLabel}
            </Text>
          )}
          <Text fontSize="sm" fontWeight="semibold" color="fg" fontFeatureSettings="'tnum'">
            ₪{product.price.toLocaleString('he-IL', { minimumFractionDigits: 2 })}
          </Text>
        </Flex>
      </Flex>
    </Link>
  );
}
