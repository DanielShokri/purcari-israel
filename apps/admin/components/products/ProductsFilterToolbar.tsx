import React from 'react';
import { Box, Flex, HStack, Text, Button, Card, Menu, Portal } from '@chakra-ui/react';
import { SearchInput } from '../shared';

export interface CategoryOption {
  value: string;
  label: string;
}

interface ProductsFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  categoryOptions: CategoryOption[];
}

export default function ProductsFilterToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryOptions,
}: ProductsFilterToolbarProps) {
  const getSelectedLabel = () => {
    const found = categoryOptions.find((opt) => opt.value === statusFilter);
    return found?.label || 'כל הקטגוריות';
  };

  return (
    <Box pb="6" flexShrink={0}>
      <Card.Root>
        <Card.Body p="4">
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align="center"
            justify="space-between"
            gap="4"
          >
            {/* Search */}
            <SearchInput
              placeholder="חיפוש לפי שם מוצר..."
              value={searchTerm}
              onChange={onSearchChange}
              width={{ base: 'full', md: '80' }}
            />

            {/* Filter Buttons */}
            <HStack gap="3" flexWrap="wrap" w={{ base: 'full', md: 'auto' }}>
              {/* Category Filter */}
              <Menu.Root>
                <Menu.Trigger asChild>
                  <Button variant="ghost" size="sm" bg="bg.subtle" px="3" py="2.5">
                    <Text as="span">
                      קטגוריה: {getSelectedLabel()}
                    </Text>
                    <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                      keyboard_arrow_down
                    </Text>
                  </Button>
                </Menu.Trigger>
                <Portal>
                  <Menu.Positioner>
                    <Menu.Content>
                      {categoryOptions.map((option) => (
                        <Menu.Item
                          key={option.value}
                          value={option.value}
                          onClick={() => onStatusFilterChange(option.value)}
                        >
                          {option.label}
                        </Menu.Item>
                      ))}
                    </Menu.Content>
                  </Menu.Positioner>
                </Portal>
              </Menu.Root>

              {/* Date Filter */}
              <Button variant="ghost" size="sm" bg="bg.subtle" px="3" py="2.5">
                <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                  calendar_today
                </Text>
                <Text as="span">תאריך</Text>
              </Button>
            </HStack>
          </Flex>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
