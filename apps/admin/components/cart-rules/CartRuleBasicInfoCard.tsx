import React from 'react';
import {
  Card,
  Flex,
  HStack,
  Heading,
  Text,
  Input,
  Textarea,
  VStack,
  SimpleGrid,
  Switch,
  Select,
  Portal,
} from '@chakra-ui/react';
import { Control, Controller, FieldErrors, UseFormRegister } from 'react-hook-form';
import { CartRuleForm } from '../../hooks/useCartRuleEditor';

interface CartRuleBasicInfoCardProps {
  register: UseFormRegister<CartRuleForm>;
  control: Control<CartRuleForm>;
  errors: FieldErrors<CartRuleForm>;
  typeOptions: any;
  statusOptions: any;
}

export default function CartRuleBasicInfoCard({
  register,
  control,
  errors,
  typeOptions,
  statusOptions,
}: CartRuleBasicInfoCardProps) {
  return (
    <Card.Root>
      <Card.Header
        px="6"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.subtle"
      >
        <Flex justify="space-between" alignItems="center">
          <HStack gap="2">
            <Text as="span" className="material-symbols-outlined" fontSize="18px" color="brand.500">
              rule
            </Text>
            <Heading size="md" color="fg">
              פרטי החוק
            </Heading>
          </HStack>
          <Flex alignItems="center" gap="3">
            <Text fontSize="sm" fontWeight="medium" color="fg.muted">
              סטטוס פעיל
            </Text>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Switch.Root
                  size="sm"
                  checked={field.value === 'active'}
                  onCheckedChange={(e) => field.onChange(e.checked ? 'active' : 'paused')}
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              )}
            />
          </Flex>
        </Flex>
      </Card.Header>
      <Card.Body p="6">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              שם החוק
            </Text>
            <Input
              {...register('name', { required: 'שדה חובה' })}
              placeholder="לדוגמה: משלוח חינם מעל 300₪"
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
            />
            {errors.name && (
              <Text fontSize="xs" color="red.500">{errors.name.message}</Text>
            )}
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              סוג החוק
            </Text>
            <Controller
              name="ruleType"
              control={control}
              rules={{ required: 'שדה חובה' }}
              render={({ field }) => (
                <Select.Root
                  collection={typeOptions}
                  value={field.value ? [field.value] : []}
                  onValueChange={(e) => field.onChange(e.value[0])}
                >
                  <Select.HiddenSelect />
                  <Select.Control
                    bg="bg.subtle"
                    borderColor="border"
                    _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
                  >
                    <Select.Trigger>
                      <Select.ValueText placeholder="בחר סוג חוק" />
                    </Select.Trigger>
                    <Select.IndicatorGroup>
                      <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                        expand_more
                      </Text>
                    </Select.IndicatorGroup>
                  </Select.Control>
                  <Portal>
                    <Select.Positioner>
                      <Select.Content>
                        {typeOptions.items.map((item: any) => (
                          <Select.Item item={item} key={item.value}>
                            <HStack gap="2">
                              <Text as="span" className="material-symbols-outlined" fontSize="18px" color={`${item.color}.500`}>
                                {item.icon}
                              </Text>
                              <Text>{item.label}</Text>
                            </HStack>
                            <Select.ItemIndicator />
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Positioner>
                  </Portal>
                </Select.Root>
              )}
            />
            {errors.ruleType && (
              <Text fontSize="xs" color="red.500">{errors.ruleType.message}</Text>
            )}
          </VStack>
        </SimpleGrid>

        <VStack align="start" gap="1.5" mt="5">
          <Text fontSize="sm" fontWeight="semibold" color="fg">
            תיאור / הערות
          </Text>
          <Textarea
            {...register('description')}
            placeholder="תיאור פנימי לשימוש מנהלים"
            bg="bg.subtle"
            borderColor="border"
            rows={3}
            _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
          />
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
