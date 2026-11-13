import React from 'react';
import { Flex, HStack, Text, Button, IconButton } from '@chakra-ui/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'תוצאות'
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <Flex
      px="6"
      py="4"
      borderTopWidth="1px"
      borderColor="border"
      justify="space-between"
      align="center"
      flexShrink={0}
      direction={{ base: 'column', sm: 'row' }}
      gap="4"
    >
      <Text fontSize="sm" color="fg.muted">
        מציג{' '}
        <Text as="span" fontWeight="medium" color="fg">
          {startItem}
        </Text>{' '}
        עד{' '}
        <Text as="span" fontWeight="medium" color="fg">
          {endItem}
        </Text>{' '}
        מתוך{' '}
        <Text as="span" fontWeight="medium" color="fg">
          {totalItems}
        </Text>{' '}
        {itemLabel}
      </Text>

      <HStack gap="1">
        <IconButton
          variant="ghost"
          size="sm"
          color="fg.muted"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="הקודם"
        >
          <Text as="span" className="material-symbols-outlined" fontSize="18px">
            chevron_right
          </Text>
        </IconButton>

        {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(page => (
          <Button
            key={page}
            size="sm"
            variant={currentPage === page ? 'solid' : 'ghost'}
            colorPalette={currentPage === page ? 'brand' : 'gray'}
            px="3.5"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}

        {totalPages > 3 && (
          <>
            <Text px="2" color="fg.muted">...</Text>
            <Button
              size="sm"
              variant="ghost"
              px="3.5"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}

        <IconButton
          variant="ghost"
          size="sm"
          color="fg.muted"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label="הבא"
        >
          <Text as="span" className="material-symbols-outlined" fontSize="18px">
            chevron_left
          </Text>
        </IconButton>
      </HStack>
    </Flex>
  );
}
