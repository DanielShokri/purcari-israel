import React from 'react';
import {
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Card,
  SimpleGrid,
} from '@chakra-ui/react';

interface RulesLimitsCardProps {
  register: any;
  errors: any;
}

export function RulesLimitsCard({ register, errors }: RulesLimitsCardProps) {
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
            gavel
          </Text>
          <Heading size="md" color="fg">
            חוקים ומגבלות
          </Heading>
        </HStack>
      </Card.Header>
      <Card.Body p="6">
        <SimpleGrid columns={2} gap="4">
          <VStack align="start" gap="1.5">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
              מינימום הזמנה (₪)
            </Text>
            <Input
              {...register('minimumOrder', { 
                valueAsNumber: true,
                min: { value: 0, message: 'ערך חיובי בלבד' }
              })}
              type="number"
              size="sm"
              bg="bg.subtle"
              borderColor="border"
            />
            {errors.minimumOrder && (
              <Text fontSize="xs" color="red.500">{errors.minimumOrder.message}</Text>
            )}
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
              מקסימום הנחה (₪)
            </Text>
            <Input
              {...register('maximumDiscount', { 
                valueAsNumber: true,
                min: { value: 0, message: 'ערך חיובי בלבד' }
              })}
              type="number"
              size="sm"
              placeholder="ללא"
              bg="bg.subtle"
              borderColor="border"
            />
            {errors.maximumDiscount && (
              <Text fontSize="xs" color="red.500">{errors.maximumDiscount.message}</Text>
            )}
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
              הגבלת שימושים כללית
            </Text>
            <Input
              {...register('usageLimit', { 
                valueAsNumber: true,
                min: { value: 1, message: 'מגבלה חייבת להיות לפחות 1' }
              })}
              type="number"
              size="sm"
              bg="bg.subtle"
              borderColor="border"
            />
            {errors.usageLimit && (
              <Text fontSize="xs" color="red.500">{errors.usageLimit.message}</Text>
            )}
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
              הגבלה למשתמש
            </Text>
            <Input
              {...register('usageLimitPerUser', { 
                valueAsNumber: true,
                min: { value: 1, message: 'מגבלה חייבת להיות לפחות 1' }
              })}
              type="number"
              size="sm"
              bg="bg.subtle"
              borderColor="border"
            />
            {errors.usageLimitPerUser && (
              <Text fontSize="xs" color="red.500">{errors.usageLimitPerUser.message}</Text>
            )}
          </VStack>
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
