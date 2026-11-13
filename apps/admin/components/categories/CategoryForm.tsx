import React, { useMemo } from 'react';
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Card,
  Select,
  Portal,
  createListCollection,
  Textarea,
  Field,
} from '@chakra-ui/react';
import { Category, CategoryStatus } from '@shared/types';

interface CategoryFormData {
  name: string;
  parentId: string | null;
  displayOrder: number;
  status: CategoryStatus;
  description: string;
}

interface CategoryFormProps {
  selectedCategory: Category | null;
  categories: Category[] | undefined;
  selectedCategoryId: string | null;
  register: UseFormRegister<CategoryFormData>;
  errors: FieldErrors<CategoryFormData>;
  control: Control<CategoryFormData>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const statusOptions = createListCollection({
  items: [
    { label: 'פעיל', value: CategoryStatus.ACTIVE },
    { label: 'טיוטה', value: CategoryStatus.DRAFT },
    { label: 'מוסתר', value: CategoryStatus.HIDDEN },
  ],
});

export default function CategoryForm({
  selectedCategory,
  categories,
  selectedCategoryId,
  register,
  errors,
  control,
  onSubmit,
  onCancel
}: CategoryFormProps) {
  // Create dynamic collection for parent categories
  const parentCategoryOptions = useMemo(() => {
    const items = [
      { label: 'ללא (קטגוריה ראשית)', value: '' },
      ...(categories
        ?.filter(c => c._id !== selectedCategoryId)
        .map(cat => ({
          label: cat.name,
          value: cat._id,
        })) || []),
    ];
    return createListCollection({ items });
  }, [categories, selectedCategoryId]);

  return (
    <Card.Root>
      <Card.Header
        p="5"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex justify="space-between" alignItems="center">
          <Heading size="lg" color="fg">
            {selectedCategory ? 'עריכת קטגוריה' : 'יצירת קטגוריה חדשה'}
          </Heading>
          {selectedCategory && (
            <Text fontSize="xs" fontFamily="mono" color="fg.muted">
              ID: {selectedCategory._id}
            </Text>
          )}
        </Flex>
      </Card.Header>
      <Card.Body p="6">
        <form onSubmit={onSubmit}>
          <VStack gap="5" align="stretch">
            {/* Category Name */}
            <Field.Root invalid={!!errors.name}>
              <Field.Label>שם הקטגוריה</Field.Label>
              <Input
                {...register('name', { required: 'שדה חובה' })}
                size="md"
              />
              {errors.name && (
                <Field.ErrorText>{errors.name.message}</Field.ErrorText>
              )}
            </Field.Root>

            {/* Parent Category */}
            <Field.Root>
              <Field.Label>קטגוריית אב</Field.Label>
              <Controller
                control={control}
                name="parentId"
                render={({ field }) => (
                  <Select.Root
                    collection={parentCategoryOptions}
                    size="md"
                    value={field.value ? [field.value] : ['']}
                    onValueChange={(e) => field.onChange(e.value[0] || null)}
                    onInteractOutside={() => field.onBlur()}
                  >
                    <Select.HiddenSelect />
                    <Select.Control>
                      <Select.Trigger>
                        <Select.ValueText placeholder="ללא (קטגוריה ראשית)" />
                      </Select.Trigger>
                      <Select.IndicatorGroup>
                        <Select.Indicator />
                      </Select.IndicatorGroup>
                    </Select.Control>
                    <Portal>
                      <Select.Positioner>
                        <Select.Content>
                          {parentCategoryOptions.items.map((item) => (
                            <Select.Item item={item} key={item.value}>
                              {item.label}
                              <Select.ItemIndicator />
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Positioner>
                    </Portal>
                  </Select.Root>
                )}
              />
            </Field.Root>

            {/* Grid for Order and Status */}
            <Flex gap="5" direction={{ base: 'column', sm: 'row' }}>
              {/* Display Order */}
              <Box flex="1">
                <Field.Root>
                  <Field.Label>סדר תצוגה</Field.Label>
                  <Input
                    {...register('displayOrder', { valueAsNumber: true })}
                    type="number"
                    size="md"
                  />
                </Field.Root>
              </Box>

              {/* Status */}
              <Box flex="1">
                <Field.Root>
                  <Field.Label>סטטוס</Field.Label>
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select.Root
                        collection={statusOptions}
                        size="md"
                        value={[field.value]}
                        onValueChange={(e) => field.onChange(e.value[0] as CategoryStatus)}
                        onInteractOutside={() => field.onBlur()}
                      >
                        <Select.HiddenSelect />
                        <Select.Control>
                          <Select.Trigger>
                            <Select.ValueText placeholder="בחר סטטוס" />
                          </Select.Trigger>
                          <Select.IndicatorGroup>
                            <Select.Indicator />
                          </Select.IndicatorGroup>
                        </Select.Control>
                        <Portal>
                          <Select.Positioner>
                            <Select.Content>
                              {statusOptions.items.map((item) => (
                                <Select.Item item={item} key={item.value}>
                                  {item.label}
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Portal>
                      </Select.Root>
                    )}
                  />
                </Field.Root>
              </Box>
            </Flex>

            {/* Description */}
            <Field.Root>
              <Field.Label>תיאור קצר</Field.Label>
              <Textarea
                {...register('description')}
                rows={3}
                resize="vertical"
              />
            </Field.Root>

            {/* Image Upload */}
            <Field.Root>
              <Field.Label>תמונת קטגוריה</Field.Label>
              <Box
                mt="1"
                p="6"
                borderWidth="2px"
                borderStyle="dashed"
                borderColor="border.muted"
                rounded="lg"
                textAlign="center"
                cursor="pointer"
                _hover={{ borderColor: 'brand.500' }}
                transition="colors"
                bg="bg.subtle"
              >
                <VStack gap="2">
                  <Text
                    as="span"
                    className="material-symbols-outlined"
                    fontSize="18px"
                    color="fg.muted"
                  >
                    image
                  </Text>
                  <VStack gap="1">
                    <HStack gap="1" justify="center">
                      <Text fontSize="sm" color="brand.500" fontWeight="semibold" _hover={{ color: 'brand.600' }}>
                        העלה קובץ
                      </Text>
                      <Text fontSize="sm" color="fg.muted">
                        או גרור לכאן
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      PNG, JPG עד 2MB
                    </Text>
                  </VStack>
                </VStack>
              </Box>
            </Field.Root>

            {/* Action Buttons */}
            <Flex gap="3" pt="4">
              <Button
                type="submit"
                colorPalette="brand"
                flex="1"
                size="md"
                shadow="sm"
              >
                <Text as="span" className="material-symbols-outlined" fontSize="18px">
                  save
                </Text>
                <Text as="span">שמור שינויים</Text>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={onCancel}
              >
                ביטול
              </Button>
            </Flex>
          </VStack>
        </form>
      </Card.Body>
    </Card.Root>
  );
}
