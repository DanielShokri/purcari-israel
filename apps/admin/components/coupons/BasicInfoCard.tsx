import React from 'react';
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
  SimpleGrid,
  Switch,
} from '@chakra-ui/react';
import { CouponStatus } from '@shared/types';

interface BasicInfoCardProps {
  register: any;
  errors: any;
  watch: any;
  setValue: any;
  isEditMode: boolean;
  validateCodeUniqueness: (value: string) => string | boolean;
  onGenerateCode: () => void;
}

export function BasicInfoCard({
  register,
  errors,
  watch,
  setValue,
  isEditMode,
  validateCodeUniqueness,
  onGenerateCode,
}: BasicInfoCardProps) {
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
              info
            </Text>
            <Heading size="md" color="fg">
              פרטים בסיסיים
            </Heading>
          </HStack>
          <Flex alignItems="center" gap="3">
            <Text fontSize="sm" fontWeight="medium" color="fg.muted">
              סטטוס פעיל
            </Text>
            <Switch.Root
              size="sm"
              checked={watch('status') === CouponStatus.ACTIVE}
              onCheckedChange={(e) => setValue('status', e.checked ? CouponStatus.ACTIVE : CouponStatus.PAUSED)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </Flex>
        </Flex>
      </Card.Header>
      <Card.Body p="6">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              קוד קופון
            </Text>
            <Flex gap="2" w="full">
              <Input
                {...register('code', { 
                  required: 'שדה חובה',
                  minLength: { value: 3, message: 'קוד קופון חייב להכיל לפחות 3 תווים' },
                  maxLength: { value: 50, message: 'קוד קופון לא יכול לעבור 50 תווים' },
                  pattern: { 
                    value: /^[A-Z0-9_-]+$/i, 
                    message: 'קוד קופון יכול להכיל אותיות, מספרים, מקף וקו תחתון בלבד' 
                  },
                  validate: validateCodeUniqueness
                })}
                flex="1"
                placeholder="לדוגמה: SALE2024"
                bg="bg.subtle"
                borderColor={errors.code ? "red.500" : "border"}
                _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onGenerateCode}
                bg="bg.subtle"
                borderColor="border"
              >
                ייצור אוטומטי
              </Button>
            </Flex>
            {errors.code && (
              <Text fontSize="xs" color="red.500">{errors.code.message}</Text>
            )}
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              תיאור פנימי
            </Text>
            <Input
              {...register('description')}
              placeholder="לשימוש מנהלים בלבד"
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
            />
          </VStack>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
