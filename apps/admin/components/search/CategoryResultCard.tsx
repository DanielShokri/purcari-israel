import React from 'react';
import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { Category } from '@shared/types';
import { StatusBadge, categoryStatusConfig } from '../shared';
import HighlightText from './HighlightText';

interface CategoryResultCardProps {
  category: Category;
  searchTerm: string;
}

export default function CategoryResultCard({ category, searchTerm }: CategoryResultCardProps) {
  return (
    <Link to="/categories" style={{ textDecoration: 'none' }}>
      <Flex
        bg="bg.panel"
        p="4"
        rounded="xl"
        borderWidth="1px"
        borderColor="border"
        alignItems="center"
        justifyContent="space-between"
        shadow="sm"
        transition="colors 0.15s ease-out"
        cursor="pointer"
        role="group"
        _hover={{
          borderColor: 'brand.300',
          shadow: 'md',
        }}
      >
        <HStack gap="3">
          <Flex
            w="10"
            h="10"
            rounded="lg"
            bg={category.iconColor ? `${category.iconColor}.100` : 'gray.100'}
            alignItems="center"
            justifyContent="center"
            color={category.iconColor ? `${category.iconColor}.600` : 'gray.600'}
            flexShrink={0}
            _dark={{
              bg: category.iconColor ? `${category.iconColor}.900/20` : 'gray.800',
              color: category.iconColor ? `${category.iconColor}.400` : 'gray.400',
            }}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              {category.icon || 'category'}
            </Text>
          </Flex>
          <Box>
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="fg"
              transition="colors 0.15s"
              _groupHover={{ color: 'brand.500' }}
            >
              <HighlightText text={category.name} searchTerm={searchTerm} />
            </Text>
            {category.description && (
              <Text fontSize="xs" color="fg.muted" lineClamp={1}>
                <HighlightText text={category.description} searchTerm={searchTerm} />
              </Text>
            )}
          </Box>
        </HStack>
        <HStack gap="3">
          <StatusBadge status={category.status} config={categoryStatusConfig} />
        </HStack>
      </Flex>
    </Link>
  );
}
