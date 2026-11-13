import React, { useEffect } from 'react';
import {
  Dialog,
  Portal,
  Button,
  Text,
  CloseButton,
  VStack,
  HStack,
  Input,
  Textarea,
  NativeSelect,
  Checkbox,
  Box,
  Flex,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { SystemAnnouncement, SystemAnnouncementType, SystemAnnouncementStatus } from '@shared/types';

interface AnnouncementFormData {
  title: string;
  message: string;
  type: SystemAnnouncementType | string;
  status: SystemAnnouncementStatus | string;
  startDate: string;
  endDate?: string;
  targetAudience: 'all' | 'customers' | 'admins' | string;
  isDismissible: boolean;
}

interface AnnouncementEditorProps {
  isOpen: boolean;
  onClose: () => void;
  announcement?: SystemAnnouncement | null;
  onSave: (data: AnnouncementFormData) => void;
  isLoading?: boolean;
}

// Banner preview component
function BannerPreview({ type, message }: { type: string; message: string }) {
  const getBannerStyles = () => {
    switch (type) {
      case 'info':
        return { bg: 'brand.50', borderColor: 'brand.500', textColor: 'brand.800' };
      case 'warning':
        return { bg: 'amber.50', borderColor: 'amber.500', textColor: 'amber.800' };
      case 'success':
        return { bg: 'green.50', borderColor: 'green.500', textColor: 'green.800' };
      case 'error':
        return { bg: 'red.50', borderColor: 'red.500', textColor: 'red.800' };
      case 'maintenance':
        return { bg: 'orange.50', borderColor: 'orange.500', textColor: 'orange.800' };
      default:
        return { bg: 'brand.50', borderColor: 'brand.500', textColor: 'brand.800' };
    }
  };

  const styles = getBannerStyles();

  return (
    <Box
      bg={styles.bg}
      borderWidth="1px"
      borderColor={styles.borderColor}
      borderRadius="md"
      px="4"
      py="3"
      dir="rtl"
    >
      <Text fontSize="sm" color={styles.textColor} fontWeight="medium">
        {message || 'תצוגה מקדימה של ההודעה...'}
      </Text>
    </Box>
  );
}

export default function AnnouncementEditor({
  isOpen,
  onClose,
  announcement,
  onSave,
  isLoading = false,
}: AnnouncementEditorProps) {
  const isEditMode = !!announcement;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<AnnouncementFormData>({
    defaultValues: {
      title: '',
      message: '',
      type: 'info',
      status: 'draft',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      targetAudience: 'all',
      isDismissible: true,
    },
  });

  // Watch form values for live preview
  const watchedType = watch('type');
  const watchedMessage = watch('message');

  // Reset form when dialog opens with announcement data (edit mode)
  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        reset({
          title: announcement.title,
          message: announcement.message,
          type: announcement.type as string,
          status: announcement.status as string,
          startDate: announcement.startDate.split('T')[0],
          endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
          targetAudience: announcement.targetAudience,
          isDismissible: announcement.isDismissible,
        });
      } else {
        reset({
          title: '',
          message: '',
          type: 'info',
          status: 'draft',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          targetAudience: 'all',
          isDismissible: true,
        });
      }
    }
  }, [isOpen, announcement, reset]);

  const onSubmit = (data: AnnouncementFormData) => {
    onSave(data);
  };

  return (
    <Dialog.Root placement="center" lazyMount open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="2xl" maxH="90vh" overflowY="auto">
            <Dialog.Header>
              <Dialog.Title>
                {isEditMode ? 'עריכת הודעת מערכת' : 'הודעת מערכת חדשה'}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form id="announcement-form" onSubmit={handleSubmit(onSubmit)}>
                <VStack gap="5" align="stretch">
                  {/* Banner Preview */}
                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" color="fg" mb="2">
                      תצוגה מקדימה
                    </Text>
                    <BannerPreview type={watchedType} message={watchedMessage} />
                  </Box>

                  {/* Title */}
                  <VStack align="start" gap="1.5">
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      כותרת <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      {...register('title', {
                        required: 'שדה חובה',
                        maxLength: { value: 100, message: 'הכותרת לא יכולה לעבור 100 תווים' },
                      })}
                      placeholder="הזן כותרת להודעה"
                      bg="bg.subtle"
                      borderColor={errors.title ? 'red.500' : 'border'}
                      _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
                    />
                    {errors.title && (
                      <Text fontSize="xs" color="red.500">
                        {errors.title.message}
                      </Text>
                    )}
                  </VStack>

                  {/* Message */}
                  <VStack align="start" gap="1.5">
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      הודעה <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Textarea
                      {...register('message', {
                        required: 'שדה חובה',
                        maxLength: { value: 500, message: 'ההודעה לא יכולה לעבור 500 תווים' },
                      })}
                      placeholder="הזן את תוכן ההודעה"
                      bg="bg.subtle"
                      borderColor={errors.message ? 'red.500' : 'border'}
                      _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
                      rows={3}
                    />
                    {errors.message && (
                      <Text fontSize="xs" color="red.500">
                        {errors.message.message}
                      </Text>
                    )}
                  </VStack>

                  {/* Type and Status */}
                  <HStack gap="4" align="start">
                    <VStack align="start" gap="1.5" flex="1">
                      <Text fontSize="sm" fontWeight="semibold" color="fg">
                        סוג הודעה
                      </Text>
                      <NativeSelect.Root w="full">
                        <NativeSelect.Field
                          {...register('type')}
                          bg="bg.subtle"
                          borderColor="border"
                        >
                          <option value="info">מידע</option>
                          <option value="warning">אזהרה</option>
                          <option value="success">הצלחה</option>
                          <option value="error">שגיאה</option>
                          <option value="maintenance">תחזוקה</option>
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    </VStack>

                    <VStack align="start" gap="1.5" flex="1">
                      <Text fontSize="sm" fontWeight="semibold" color="fg">
                        סטטוס
                      </Text>
                      <NativeSelect.Root w="full">
                        <NativeSelect.Field
                          {...register('status')}
                          bg="bg.subtle"
                          borderColor="border"
                        >
                          <option value="active">פעיל</option>
                          <option value="scheduled">מתוזמן</option>
                          <option value="expired">פג תוקף</option>
                          <option value="draft">טיוטה</option>
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    </VStack>
                  </HStack>

                  {/* Dates */}
                  <HStack gap="4" align="start">
                    <VStack align="start" gap="1.5" flex="1">
                      <Text fontSize="sm" fontWeight="semibold" color="fg">
                        תאריך התחלה <Text as="span" color="red.500">*</Text>
                      </Text>
                      <Input
                        {...register('startDate', { required: 'שדה חובה' })}
                        type="date"
                        bg="bg.subtle"
                        borderColor={errors.startDate ? 'red.500' : 'border'}
                        _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
                        dir="ltr"
                      />
                      {errors.startDate && (
                        <Text fontSize="xs" color="red.500">
                          {errors.startDate.message}
                        </Text>
                      )}
                    </VStack>

                    <VStack align="start" gap="1.5" flex="1">
                      <Text fontSize="sm" fontWeight="semibold" color="fg">
                        תאריך סיום
                      </Text>
                      <Input
                        {...register('endDate')}
                        type="date"
                        bg="bg.subtle"
                        borderColor="border"
                        _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
                        dir="ltr"
                      />
                    </VStack>
                  </HStack>

                  {/* Target Audience */}
                  <VStack align="start" gap="1.5">
                    <Text fontSize="sm" fontWeight="semibold" color="fg">
                      קהל יעד
                    </Text>
                    <NativeSelect.Root w="full">
                      <NativeSelect.Field
                        {...register('targetAudience')}
                        bg="bg.subtle"
                        borderColor="border"
                      >
                        <option value="all">כל המשתמשים</option>
                        <option value="customers">לקוחות בלבד</option>
                        <option value="admins">מנהלים בלבד</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </VStack>

                  {/* Dismissible */}
                  <Flex align="center" gap="3">
                    <Checkbox.Root
                      checked={watch('isDismissible')}
                      onCheckedChange={(e) => {
                        const checkbox = register('isDismissible');
                        checkbox.onChange?.({ target: { name: 'isDismissible', value: e.checked, type: 'checkbox' } } as React.ChangeEvent<HTMLInputElement>);
                      }}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control />
                      <Checkbox.Label>ניתן לסגירה על ידי המשתמש</Checkbox.Label>
                    </Checkbox.Root>
                  </Flex>
                </VStack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack gap="3" w="full" justify="flex-end">
                <Dialog.ActionTrigger asChild>
                  <Button variant="outline" onClick={onClose} disabled={isLoading}>
                    ביטול
                  </Button>
                </Dialog.ActionTrigger>
                <Button
                  colorPalette="brand"
                  type="submit"
                  form="announcement-form"
                  loading={isLoading}
                  loadingText="שומר..."
                >
                  {isEditMode ? 'שמור שינויים' : 'צור הודעה'}
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
