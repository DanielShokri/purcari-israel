import React from 'react';
import {
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
  Checkbox,
} from '@chakra-ui/react';

interface Category {
  id: string;
  name: string;
}

interface CategoriesCardProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoryToggle: (categoryId: string) => void;
}

export default function CategoriesCard({
  categories,
  selectedCategories,
  onCategoryToggle
}: CategoriesCardProps) {
  return (
    <Card.Root>
      <Card.Header
        px="5"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex justify="space-between" alignItems="center">
          <Heading size="md" color="fg">
            קטגוריות
          </Heading>
          <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
            category
          </Text>
        </Flex>
      </Card.Header>
      <Card.Body p="5">
        <VStack gap="3" align="stretch" maxH="48" overflowY="auto" pl="2">
          {categories.map((category) => (
            <Checkbox.Root
              key={category.id}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => onCategoryToggle(category.id)}
            >
              <Checkbox.HiddenInput />
              <HStack
                as="label"
                gap="3"
                cursor="pointer"
                p="1"
                rounded="md"
                _hover={{ bg: 'bg.subtle' }}
                transition="colors"
              >
                <Checkbox.Control />
                <Text fontSize="sm" color="fg" _groupHover={{ color: 'brand.500' }} transition="colors">
                  {category.name}
                </Text>
              </HStack>
            </Checkbox.Root>
          ))}
        </VStack>
        <Button variant="ghost" size="sm" mt="4" colorPalette="brand">
          <Text as="span" className="material-symbols-outlined" fontSize="18px">
            add
          </Text>
          הוסף קטגוריה חדשה
        </Button>
      </Card.Body>
    </Card.Root>
  );
}
