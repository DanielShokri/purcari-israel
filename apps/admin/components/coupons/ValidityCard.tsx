import React from 'react';
import {
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Card,
} from '@chakra-ui/react';

interface ValidityCardProps {
  register: any;
  errors: any;
  validateEndDate: (value: string | undefined) => string | boolean;
}

export function ValidityCard({ register, errors, validateEndDate }: ValidityCardProps) {
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
            calendar_month
          </Text>
          <Heading size="md" color="fg">
            תוקף הקופון
          </Heading>
        </HStack>
      </Card.Header>
      <Card.Body p="6">
        <VStack gap="4" align="stretch">
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              תאריך התחלה
            </Text>
            <Input
              {...register('startDate', { required: 'שדה חובה' })}
              type="date"
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
            />
            {errors.startDate && (
              <Text fontSize="xs" color="red.500">{errors.startDate.message}</Text>
            )}
          </VStack>
          <VStack align="start" gap="1.5">
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              תאריך סיום
            </Text>
            <Input
              {...register('endDate', { validate: validateEndDate })}
              type="date"
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ring: 2, ringColor: 'brand.500/20', borderColor: 'brand.500' }}
            />
            {errors.endDate && (
              <Text fontSize="xs" color="red.500">{errors.endDate.message}</Text>
            )}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
