import React from 'react';
import { Box, Flex, HStack, Text, IconButton, Badge } from '@chakra-ui/react';
import { Category, CategoryStatus } from '@shared/types';

interface CategoryTreeItemProps {
  category: Category & { children?: Category[] };
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpand: (categoryId: string) => void;
  onSelect: (categoryId: string) => void;
  onEdit: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
  expandedCategories: Set<string>;
  selectedCategoryId: string | null;
}

const getStatusBadge = (status: CategoryStatus) => {
  switch (status) {
    case CategoryStatus.ACTIVE:
      return (
        <Badge
          colorPalette="green"
          variant="subtle"
          px="2"
          py="0.5"
          rounded="full"
          fontSize="xs"
        >
          פעיל
        </Badge>
      );
    case CategoryStatus.HIDDEN:
      return (
        <Badge
          colorPalette="gray"
          variant="subtle"
          px="2"
          py="0.5"
          rounded="full"
          fontSize="xs"
        >
          מוסתר
        </Badge>
      );
    default:
      return (
        <Badge
          colorPalette="orange"
          variant="subtle"
          px="2"
          py="0.5"
          rounded="full"
          fontSize="xs"
        >
          טיוטה
        </Badge>
      );
  }
};

const getIconColor = (color?: string) => {
  switch (color) {
    case 'blue':
      return { bg: 'brand.100', color: 'brand.600', _dark: { bg: 'brand.900/30', color: 'brand.400' } };
    case 'purple':
      return { bg: 'purple.100', color: 'purple.600', _dark: { bg: 'purple.900/30', color: 'purple.400' } };
    case 'orange':
      return { bg: 'orange.100', color: 'orange.600', _dark: { bg: 'orange.900/30', color: 'orange.400' } };
    default:
      return { bg: 'gray.100', color: 'gray.600', _dark: { bg: 'gray.800', color: 'gray.400' } };
  }
};

export default function CategoryTreeItem({
  category,
  level,
  isExpanded,
  isSelected,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  expandedCategories,
  selectedCategoryId
}: CategoryTreeItemProps) {
  const hasChildren = category.children && category.children.length > 0;
  const iconColorProps = getIconColor(category.iconColor);

  return (
    <Box>
      <Flex
        alignItems="center"
        gap="3"
        p="2"
        rounded="lg"
        cursor="pointer"
        bg={isSelected ? 'brand.50' : 'transparent'}
        borderWidth="1px"
        borderColor={isSelected ? 'brand.200' : 'transparent'}
        _hover={{
          bg: isSelected ? 'brand.50' : 'bg.subtle',
          borderColor: isSelected ? 'brand.200' : 'border.muted',
          '& .action-buttons': {
            opacity: 1,
          },
        }}
        _dark={{
          bg: isSelected ? 'brand.950' : 'transparent',
          borderColor: isSelected ? 'brand.800' : 'transparent',
          _hover: {
            bg: isSelected ? 'brand.950' : 'gray.800',
          },
        }}
        onClick={() => onSelect(category._id)}
        position="relative"
        pr={level > 0 ? '12' : '0'}
        css={{
          '& .action-buttons': {
            opacity: 0,
          },
          '&:hover .action-buttons': {
            opacity: 1,
          },
        }}
      >
        {/* Indentation lines */}
        {level > 0 && (
          <>
            <Box
              position="absolute"
              right="27px"
              top="0"
              bottom="50%"
              w="1px"
              bg="border.muted"
            />
            <Box
              position="absolute"
              right="27px"
              top="50%"
              w="3"
              h="1px"
              bg="border.muted"
            />
          </>
        )}

        <Text
          as="span"
          className="material-symbols-outlined"
          fontSize="18px"
          color="fg.muted"
          cursor="grab"
          _hover={{ color: 'fg' }}
        >
          drag_indicator
        </Text>

        {hasChildren ? (
          <IconButton
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(category._id);
            }}
          >
            <Text
              as="span"
              className="material-symbols-outlined"
              fontSize="18px"
              transform={isExpanded ? 'none' : 'rotate(-90deg)'}
            >
              expand_more
            </Text>
          </IconButton>
        ) : (
          <Box w="6" h="6" />
        )}

        <Box
          w="8"
          h="8"
          rounded="lg"
          display="flex"
          alignItems="center"
          justifyContent="center"
          {...iconColorProps}
        >
          <Text
            as="span"
            className="material-symbols-outlined"
            fontSize="18px"
          >
            {category.icon || 'category'}
          </Text>
        </Box>

        <Text
          fontSize="sm"
          fontWeight={isSelected ? 'bold' : 'medium'}
          color={isSelected ? 'brand.600' : 'fg'}
          _dark={{ color: isSelected ? 'brand.400' : 'fg' }}
          flex="1"
        >
          {category.name}
        </Text>

        {category.status === CategoryStatus.ACTIVE && !isSelected && (
          <Box>{getStatusBadge(category.status as CategoryStatus)}</Box>
        )}

        {isSelected && (
          <HStack gap="1">
            <IconButton
              variant="ghost"
              size="xs"
              colorPalette="brand"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category._id);
              }}
            >
              <Text as="span" className="material-symbols-outlined" fontSize="18px">
                edit
              </Text>
            </IconButton>
            <IconButton
              variant="ghost"
              size="xs"
              colorPalette="red"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category._id);
              }}
            >
              <Text as="span" className="material-symbols-outlined" fontSize="18px">
                delete
              </Text>
            </IconButton>
          </HStack>
        )}

        {!isSelected && (
          <HStack
            gap="1"
            className="action-buttons"
            css={{
              opacity: 0,
              '&': {
                transition: 'opacity 0.2s',
              },
            }}
          >
            <IconButton
              variant="ghost"
              size="xs"
              color="fg.muted"
              _hover={{ bg: 'brand.50', color: 'brand.500' }}
              _dark={{ _hover: { bg: 'brand.900/20', color: 'brand.400' } }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(category._id);
              }}
            >
              <Text as="span" className="material-symbols-outlined" fontSize="18px">
                edit
              </Text>
            </IconButton>
            <IconButton
              variant="ghost"
              size="xs"
              color="fg.muted"
              _hover={{ bg: 'red.50', color: 'red.500' }}
              _dark={{ _hover: { bg: 'red.900/20', color: 'red.400' } }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(category._id);
              }}
            >
              <Text as="span" className="material-symbols-outlined" fontSize="18px">
                delete
              </Text>
            </IconButton>
          </HStack>
        )}
      </Flex>

      {hasChildren && isExpanded && (
        <Box mt="1" ml="0">
          {category.children!
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map(child => (
              <CategoryTreeItem
                key={child._id}
                category={child as Category & { children?: Category[] }}
                level={level + 1}
                isExpanded={expandedCategories.has(child._id)}
                isSelected={selectedCategoryId === child._id}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                expandedCategories={expandedCategories}
                selectedCategoryId={selectedCategoryId}
              />
            ))}
        </Box>
      )}
    </Box>
  );
}
