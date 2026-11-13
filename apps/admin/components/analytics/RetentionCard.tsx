import React from 'react';
import { Card, Heading, VStack, HStack, Text, Box } from '@chakra-ui/react';

interface RetentionCardProps {
  retention: {
    week1: number;
    week7: number;
    week30: number;
  };
}

export default function RetentionCard({ retention }: RetentionCardProps) {
  return (
    <Card.Root
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
    >
      <Card.Body p="6">
        <Heading size="md" fontWeight="medium" color="fg" mb="6">
          שימור משתמשים
        </Heading>
        <VStack gap="4" align="stretch">
          <HStack justify="space-between" p="4" bg="bg.subtle" rounded="lg">
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="brand.500">
                schedule
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                אחרי יום אחד
              </Text>
            </HStack>
            <Text fontSize="lg" fontWeight="medium" color="fg">
              {retention.week1}%
            </Text>
          </HStack>
          
          <HStack justify="space-between" p="4" bg="bg.subtle" rounded="lg">
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="purple.500">
                calendar_today
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                אחרי שבוע
              </Text>
            </HStack>
            <Text fontSize="lg" fontWeight="medium" color="fg">
              {retention.week7}%
            </Text>
          </HStack>
          
          <HStack justify="space-between" p="4" bg="bg.subtle" rounded="lg">
            <HStack gap="2">
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="green.500">
                event
              </Text>
              <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                אחרי חודש
              </Text>
            </HStack>
            <Text fontSize="lg" fontWeight="medium" color="fg">
              {retention.week30}%
            </Text>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
