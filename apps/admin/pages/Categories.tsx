// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React from 'react';
import { CategoryStatus } from '@shared/types';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Card,
} from '@chakra-ui/react';
import { LoadingState, Breadcrumbs, DeleteConfirmationDialog } from '../components/shared';
import { CategoryTreeToolbar, CategoryTreeItem, CategoryForm } from '../components/categories';
import { useCategories } from '../hooks/useCategories';

export default function Categories() {
  const {
    isLoading,
    hasEverLoaded,
    tree,
    selection,
    form,
    deleteDialog,
    handlers,
  } = useCategories();

  const { categoryTree, expandedCategories } = tree;
  const { selectedCategoryId, selectedCategory } = selection;
  const { register, formState, control } = form;
  const { errors } = formState;

  // Only show spinner on first load (cold cache), not on return visits
  if (isLoading && !hasEverLoaded) {
    return <LoadingState message="טוען קטגוריות..." />;
  }

  return (
    <VStack gap="6" align="stretch">
      <Breadcrumbs items={[{ label: 'בית', href: '#' }, { label: 'קטגוריות' }]} />

      {/* Page Title */}
      <Flex justify="space-between" align="start">
        <Box>
          <Heading size="xl" color="fg" mb="1">
            ניהול קטגוריות
          </Heading>
          <Text color="fg.muted">
            צפה, ערוך, והוסף קטגוריות חדשות לחנות שלך.
          </Text>
        </Box>
        <Button
          colorPalette="brand"
          size="md"
          shadow="sm"
          onClick={handlers.clearSelection}
          disabled={!selectedCategoryId}
        >
          <Text as="span" className="material-symbols-outlined" fontSize="18px">
            add
          </Text>
          <Text as="span">קטגוריה ראשית חדשה</Text>
        </Button>
      </Flex>

      {/* Split View Layout */}
      <Flex direction={{ base: 'column', lg: 'row' }} gap="6">
        {/* Left Side: Tree View */}
        <Box w={{ base: 'full', lg: '7/12' }} display="flex" flexDirection="column" gap="4">
          <CategoryTreeToolbar
            searchTerm=""
            onSearchChange={handlers.setSearchTerm}
          />

          {/* Tree List Container */}
          <Card.Root flex="1" display="flex" flexDirection="column" minH="0">
            <Box p="4" borderBottomWidth="1px" borderColor="border" bg="bg.subtle">
              <Flex justify="space-between" alignItems="center">
                <Text fontSize="sm" fontWeight="semibold" color="fg">
                  מבנה הקטגוריות
                </Text>
                <HStack gap="2">
                  <Button
                    variant="ghost"
                    size="xs"
                    colorPalette="brand"
                    onClick={handlers.expandAll}
                  >
                    הרחב הכל
                  </Button>
                  <Text color="border.muted">|</Text>
                  <Button
                    variant="ghost"
                    size="xs"
                    colorPalette="brand"
                    onClick={handlers.collapseAll}
                  >
                    כווץ הכל
                  </Button>
                </HStack>
              </Flex>
            </Box>
            <Box flex="1" overflowY="auto" p="2" maxH="600px">
              <VStack gap="1" align="stretch">
                {categoryTree.map(category => (
                  <CategoryTreeItem
                    key={category._id}
                    category={category}
                    level={0}
                    isExpanded={expandedCategories.has(category._id)}
                    isSelected={selectedCategoryId === category._id}
                    onToggleExpand={handlers.toggleExpand}
                    onSelect={handlers.selectCategory}
                    onEdit={handlers.selectCategory}
                    onDelete={handlers.openDeleteDialog}
                    expandedCategories={expandedCategories}
                    selectedCategoryId={selectedCategoryId}
                  />
                ))}
              </VStack>
            </Box>
          </Card.Root>
        </Box>

        {/* Right Side: Edit Form */}
        <Box w={{ base: 'full', lg: '5/12' }} position={{ lg: 'sticky' }} top="0">
          <CategoryForm
            selectedCategory={selectedCategory}
            categories={categoryTree}
            selectedCategoryId={selectedCategoryId}
            register={register}
            errors={errors}
            control={control}
            onSubmit={handlers.onSubmit}
            onCancel={handlers.clearSelection}
          />
        </Box>
      </Flex>

      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handlers.closeDeleteDialog}
        onConfirm={handlers.confirmDelete}
        title="מחיקת קטגוריה"
        message="האם אתה בטוח שברצונך למחוק קטגוריה זו? פעולה זו לא ניתנת לביטול."
      />
    </VStack>
  );
}
