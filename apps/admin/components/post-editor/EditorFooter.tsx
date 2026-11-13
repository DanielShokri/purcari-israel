import React from 'react';
import { Box, HStack, Text, Button } from '@chakra-ui/react';

interface EditorFooterProps {
  isEditMode: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function EditorFooter({
  isEditMode,
  isCreating,
  isUpdating,
  isDeleting,
  onSave,
  onCancel,
  onDelete
}: EditorFooterProps) {
  return (
    <Box
      flexShrink={0}
      w="full"
      bg="bg.panel"
      borderTopWidth="1px"
      borderColor="border"
      p="4"
      shadow="lg"
    >
      <Box maxW="1200px" mx="auto" display="flex" alignItems="center" justifyContent="space-between">
        <HStack gap="3">
          <Button
            type="button"
            colorPalette="brand"
            size="md"
            loading={isCreating || isUpdating}
            loadingText="שומר..."
            onClick={onSave}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              save
            </Text>
            שמור שינויים
          </Button>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onCancel}
          >
            ביטול
          </Button>
        </HStack>
        {isEditMode && (
          <Button
            variant="ghost"
            colorPalette="red"
            size="md"
            onClick={onDelete}
            loading={isDeleting}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              delete
            </Text>
            <Text as="span" display={{ base: 'none', sm: 'inline' }}>
              מחיקה
            </Text>
          </Button>
        )}
      </Box>
    </Box>
  );
}
