import {
  Dialog,
  Portal,
  Button,
  Text,
  CloseButton,
  HStack,
} from '@chakra-ui/react';

interface CancelPaidOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isSubmitting?: boolean;
}

export default function CancelPaidOrderDialog({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: CancelPaidOrderDialogProps) {
  return (
    <Dialog.Root lazyMount open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>לבטל הזמנה ששולמה?</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text color="fg.muted">
                ההזמנה שולמה. ביטול יחזיר את המלאי אך לא מבצע החזר כספי. יש לבצע החזר ידני ב-iCredit.
              </Text>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="3" w="full" justify="flex-end">
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                    ביטול
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="red"
                  onClick={onConfirm}
                  loading={isSubmitting}
                  loadingText="מבטל..."
                >
                  בטל הזמנה
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
