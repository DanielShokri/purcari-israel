import React from 'react';
import { Box, Flex, Heading, Card, HStack, Text, VStack } from '@chakra-ui/react';
import { useColorModeValue } from '../ui/color-mode';

interface PopularProduct {
  productId: string;
  productName: string;
  views: number;
}

interface PopularProductsChartProps {
  data: PopularProduct[];
  title?: string;
  maxItems?: number;
}

export default function PopularProductsChart({
  data,
  title = 'מוצרים פופולריים',
  maxItems = 8,
}: PopularProductsChartProps) {
  const barBg = useColorModeValue('bg.muted', 'bg.muted');
  const barColor = useColorModeValue('brand.500', 'brand.400');

  const sortedData = [...data].sort((a, b) => b.views - a.views).slice(0, maxItems);
  const maxViews = sortedData.length > 0 ? sortedData[0].views : 0;

  return (
    <Card.Root bg="bg.panel" borderWidth="1px" borderColor="border">
      <Card.Body p="6">
        <Heading size="md" fontWeight="medium" color="fg" mb="6">
          {title}
        </Heading>
        {sortedData.length === 0 ? (
          <Text color="fg.muted" textAlign="center" py="8">
            אין נתוני צפיות זמינים
          </Text>
        ) : (
          <VStack gap="3" align="stretch">
            {sortedData.map((item, index) => {
              const percentage = maxViews > 0 ? (item.views / maxViews) * 100 : 0;
              return (
                <HStack key={item.productId} gap="3" align="center">
                  {/* Rank badge */}
                  <Flex
                    w="6"
                    h="6"
                    rounded="full"
                    bg={index === 0 ? 'brand.500' : 'bg.muted'}
                    color={index === 0 ? 'white' : 'fg.muted'}
                    alignItems="center"
                    justifyContent="center"
                    fontSize="xs"
                    fontWeight="medium"
                    flexShrink={0}
                  >
                    {index + 1}
                  </Flex>

                  {/* Full product name + views */}
                  <Box flex="1" minW="0">
                    <HStack justify="space-between" mb="1" gap="2">
                      <Text
                        fontWeight="medium"
                        color="fg"
                        fontSize="sm"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minW="0"
                        title={item.productName}
                      >
                        {item.productName}
                      </Text>
                      <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                        {item.views.toLocaleString('he-IL')} צפיות
                      </Text>
                    </HStack>
                    <Box position="relative" h="2" bg={barBg} rounded="full" overflow="hidden">
                      <Box
                        position="absolute"
                        top="0"
                        insetStart="0"
                        h="full"
                        w={`${percentage}%`}
                        bg={barColor}
                        rounded="full"
                        transition="width 0.5s ease"
                      />
                    </Box>
                  </Box>
                </HStack>
              );
            })}
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}
