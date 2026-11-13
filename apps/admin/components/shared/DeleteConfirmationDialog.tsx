import React from 'react';
import {
  Dialog,
  Portal,
  Button,
  Text,
  CloseButton,
  HStack,
} from '@chakra-ui/react';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  message?: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'מחיקת פריט',
  message = 'האם אתה בטוח שברצונך למחוק פריט זה? פעולה זו לא ניתנת לביטול.',
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog.Root placement="center" lazyMount open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text color="fg.muted">{message}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="3" w="full" justify="flex-end">
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={onClose} disabled={isDeleting}>
                    ביטול
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  onClick={handleConfirm}
                  loading={isDeleting}
                  loadingText="מוחק..."
                >
                  מחק
                </Button>
              </HStack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
