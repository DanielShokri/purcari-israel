import React from 'react';
import { Box, Table, Checkbox, Card } from '@chakra-ui/react';
import { Product } from '@shared/types';
import { Pagination } from '../shared';
import ProductTableRow from './ProductTableRow';

interface ProductsTableProps {
  products: Product[];
  selectedProducts: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectProduct: (productId: string, checked: boolean) => void;
  onEdit: (productId: string) => void;
  onDelete: (productId: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  getCategoryLabel: (category: string) => string;
  getRandomImage: (index: number) => string;
}

export default function ProductsTable({
  products,
  selectedProducts,
  onSelectAll,
  onSelectProduct,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  getCategoryLabel,
  getRandomImage
}: ProductsTableProps) {
  return (
    <Box flex="1" minH="0">
      <Card.Root overflow="hidden" h="full" display="flex" flexDirection="column">
        {/* Table with horizontal scroll wrapper */}
        <Box flex="1" overflow="auto" w="full" position="relative">
          <Table.Root size="sm" minW="600px">
            <Table.Header>
              <Table.Row bg="bg.subtle" position="sticky" top="0" zIndex={2}>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" w="12">
                  <Checkbox.Root
                    size="sm"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onCheckedChange={(e) => onSelectAll(!!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  שם מוצר
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" display={{ base: 'table-cell', md: 'table-cell' }}>
                  קטגוריה
                </Table.ColumnHeader>
                <Table.ColumnHeader px={{ base: '4', lg: '6' }} py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" textAlign="start">
                  פעולות
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {products.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4} px={{ base: '4', lg: '6' }} py="12" textAlign="center" color="fg.subtle">
                    לא נמצאו מוצרים
                  </Table.Cell>
                </Table.Row>
              ) : (
                products.map((product, index) => (
                  <ProductTableRow
                    key={product._id}
                    product={product}
                    index={index}
                    isSelected={selectedProducts.includes(product._id)}
                    onSelect={(checked) => onSelectProduct(product._id, checked)}
                    onEdit={() => onEdit(product._id)}
                    onDelete={() => onDelete(product._id)}
                    getCategoryLabel={getCategoryLabel}
                    getRandomImage={getRandomImage}
                  />
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          itemLabel="מוצרים"
        />
      </Card.Root>
    </Box>
  );
}
