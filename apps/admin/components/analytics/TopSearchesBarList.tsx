import React from 'react';
import { Box, Flex, Heading, Card, HStack, Text, Badge } from '@chakra-ui/react';
import { useColorModeValue } from '../ui/color-mode';

interface SearchItem {
  query: string;
  count: number;
  avgResults: number;
}

interface TopSearchesBarListProps {
  data: SearchItem[];
  title?: string;
  maxItems?: number;
}

export default function TopSearchesBarList({ 
  data, 
  title = 'חיפושים פופולריים',
  maxItems = 10
}: TopSearchesBarListProps) {
  const barBg = useColorModeValue('brand.100', 'brand.900');
  const barColor = useColorModeValue('brand.500', 'brand.400');
  
  const sortedData = [...data]
    .sort((a, b) => b.count - a.count)
    .slice(0, maxItems);
  
  const maxCount = sortedData.length > 0 ? sortedData[0].count : 0;

  if (sortedData.length === 0) {
    return (
      <Card.Root bg="bg.panel" borderWidth="1px" borderColor="border">
        <Card.Body p="6">
          <Heading size="md" fontWeight="medium" color="fg" mb="4">
            {title}
          </Heading>
          <Text color="fg.muted" textAlign="center" py="8">
            אין נתוני חיפוש זמינים
          </Text>
        </Card.Body>
      </Card.Root>
    );
  }

  return (
    <Card.Root bg="bg.panel" borderWidth="1px" borderColor="border">
      <Card.Body p="6">
        <Heading size="md" fontWeight="medium" color="fg" mb="6">
          {title}
        </Heading>
        
        <Box>
          {sortedData.map((item, index) => {
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const hasNoResults = item.avgResults === 0;
            
            return (
              <HStack 
                key={item.query} 
                gap="3" 
                mb="3"
                align="center"
              >
                <Text 
                  w="6" 
                  textAlign="center" 
                  fontWeight="medium" 
                  color={index < 3 ? 'brand.500' : 'fg.muted'}
                  fontSize="sm"
                >
                  {index + 1}
                </Text>
                
                <Box flex="1">
                  <Flex justify="space-between" align="center" mb="1">
                    <HStack gap="2">
                      <Text fontSize="sm" fontWeight="medium" color="fg">
                        {item.query}
                      </Text>
                      {hasNoResults && (
                        <Badge size="sm" colorPalette="red" variant="subtle">
                          ללא תוצאות
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="sm" fontWeight="medium" color="fg">
                      {item.count.toLocaleString('he-IL')}
                    </Text>
                  </Flex>
                  
                  <Box position="relative" h="2" bg="bg.muted" rounded="full" overflow="hidden">
                    <Box
                      position="absolute"
                      top="0"
                      left="0"
                      h="full"
                      w={`${percentage}%`}
                      bg={hasNoResults ? 'red.400' : barColor}
                      rounded="full"
                      transition="width 0.3s ease"
                    />
                  </Box>
                </Box>
              </HStack>
            );
          })}
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
