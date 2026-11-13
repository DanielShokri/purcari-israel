import React from 'react';
import { Box, VStack, HStack, Heading, Text, Card, Button } from '@chakra-ui/react';

export interface ActivityItem {
  title: string;
  subtitle: string;
  color: string;
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  viewAllLabel?: string;
  onViewAll?: () => void;
}

export default function ActivityFeed({ 
  activities, 
  title = 'פעילות אחרונה',
  viewAllLabel = 'צפה בכל הפעילות',
  onViewAll
}: ActivityFeedProps) {
  return (
    <Card.Root bg="bg.panel" borderWidth="1px" borderColor="border">
      <Card.Body p="6" display="flex" flexDirection="column" h="full">
        <Heading size="md" fontWeight="medium" color="fg" mb="4">
          {title}
        </Heading>
        <VStack gap="6" align="stretch" flex="1">
          {activities.map((activity, index) => (
            <HStack key={index} gap="4" align="start">
              <VStack gap="0" align="center">
                <Box w="2" h="2" rounded="full" bg="fg.muted" mt="2" />
                {index < activities.length - 1 && (
                  <Box w="0.5" flex="1" bg="border" mt="1" minH="8" />
                )}
              </VStack>
              <Box pb="2">
                <Text fontSize="sm" fontWeight="medium" color="fg">
                  {activity.title}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt="1">
                  {activity.subtitle}
                </Text>
              </Box>
            </HStack>
          ))}
        </VStack>
        <Button
          variant="outline"
          w="full"
          mt="4"
          py="2"
          borderColor="border"
          color="fg.muted"
          fontSize="sm"
          _hover={{ color: 'fg', bg: 'bg' }}
          onClick={onViewAll}
        >
          {viewAllLabel}
        </Button>
      </Card.Body>
    </Card.Root>
  );
}
