import React from 'react';
import {
  Card,
  HStack,
  Heading,
  Text,
  Input,
  VStack,
  SimpleGrid,
} from '@chakra-ui/react';
import { FieldErrors, UseFormRegister } from 'react-hook-form';
import { CartRuleForm } from '../../hooks/useCartRuleEditor';
import { SupportedRuleType } from '../../utils/cartRuleHelpers';

interface CartRuleConfigCardProps {
  register: UseFormRegister<CartRuleForm>;
  errors: FieldErrors<CartRuleForm>;
  ruleType: SupportedRuleType | undefined;
  getValueLabel: (type: SupportedRuleType | undefined) => string;
}

export default function CartRuleConfigCard({
  register,
  errors,
  ruleType,
  getValueLabel,
}: CartRuleConfigCardProps) {
  return (
    <Card.Root>
      <Card.Header
        px="6"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.subtle"
      >
        <HStack gap="2">
          <Text as="span" className="material-symbols-outlined" fontSize="18px" color="brand.500">
            tune
          </Text>
          <Heading size="md" color="fg">
            הגדרות
          </Heading>
        </HStack>
      </Card.Header>
      <Card.Body p="6">
        <SimpleGrid columns={{ base: 1, md: 2 }} gap="5">
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              עדיפות
            </Text>
            <Input
              {...register('priority', {
                required: 'שדה חובה',
                valueAsNumber: true,
                min: { value: 1, message: 'ערך מינימלי: 1' },
                max: { value: 99, message: 'ערך מקסימלי: 99' }
              })}
              type="number"
              placeholder="10"
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
            />
            <Text fontSize="xs" color="fg.muted">
              מספר נמוך יותר = עדיפות גבוהה יותר
            </Text>
            {errors.priority && (
              <Text fontSize="xs" color="red.500">{errors.priority.message}</Text>
            )}
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              {getValueLabel(ruleType)}
            </Text>
            <Input
              {...register('value', {
                valueAsNumber: true,
                min: { value: 1, message: 'ערך מינימלי: 1' },
                validate: (value) => {
                  if (value !== undefined && value !== null && isNaN(value)) {
                    return 'ערך לא תקין';
                  }
                  return true;
                }
              })}
              type="number"
              placeholder="0"
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
            />
            {errors.value && (
              <Text fontSize="xs" color="red.500">{errors.value.message}</Text>
            )}
          </VStack>
          {ruleType === 'buy_x_get_y' && (
            <VStack align="start" gap="1.5">
              <Text fontSize="sm" fontWeight="semibold" color="fg">
                קבל (יחידות)
              </Text>
              <Input
                {...register('getQuantity', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'ערך מינימלי: 1' },
                })}
                type="number"
                placeholder="1"
                bg="bg.subtle"
                borderColor="border"
                _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
              />
              {errors.getQuantity && (
                <Text fontSize="xs" color="red.500">{errors.getQuantity.message}</Text>
              )}
            </VStack>
          )}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
