import React from 'react';
import { Box, Flex, Heading, Card, VStack, HStack, Text, Progress } from '@chakra-ui/react';
import { useColorModeValue } from '../ui/color-mode';

interface FunnelStep {
  name: string;
  count: number;
  dropOff: number;
}

interface ConversionFunnelChartProps {
  steps: FunnelStep[];
  totalConversion: number;
  title?: string;
}

export default function ConversionFunnelChart({ 
  steps, 
  totalConversion,
  title = 'משפך המרה'
}: ConversionFunnelChartProps) {
  const maxCount = Math.max(...steps.map(s => s.count));
  const bgMuted = useColorModeValue('gray.50', 'gray.800');

  const getStepColor = (index: number) => {
    const colors = [
      'brand.500',
      'cyan.500', 
      'teal.500',
      'green.500',
      'yellow.500',
      'orange.500',
      'red.500',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card.Root
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
    >
      <Card.Body p="6">
        <Flex justify="space-between" align="center" mb="6">
          <Heading size="md" fontWeight="medium" color="fg">
            {title}
          </Heading>
          <HStack 
            bg="brand.500/10" 
            color="brand.500" 
            px="3" 
            py="1" 
            rounded="full"
            fontSize="sm"
            fontWeight="medium"
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              trending_up
            </Text>
            <Text>שיעור המרה: {totalConversion.toFixed(1)}%</Text>
          </HStack>
        </Flex>

        <VStack gap="3" align="stretch">
          {steps.map((step, index) => {
            const percentage = maxCount > 0 ? (step.count / maxCount) * 100 : 0;
            const color = getStepColor(index);
            const isLast = index === steps.length - 1;

            return (
              <Box key={step.name}>
                <HStack gap="3" mb="1">
                  <Flex
                    w="8"
                    h="8"
                    rounded="full"
                    bg={color}
                    color="white"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="medium"
                    fontSize="sm"
                    flexShrink={0}
                  >
                    {index + 1}
                  </Flex>
                  <Box flex="1">
                    <Flex justify="space-between" align="center" mb="1">
                      <Text fontWeight="medium" color="fg" fontSize="sm">
                        {step.name}
                      </Text>
                      <HStack gap="3">
                        {!isLast && step.dropOff > 0 && (
                          <Text fontSize="xs" color="red.500">
                            -{step.dropOff.toFixed(1)}%
                          </Text>
                        )}
                        <Text fontWeight="medium" color="fg" fontSize="sm">
                          {step.count.toLocaleString('he-IL')}
                        </Text>
                      </HStack>
                    </Flex>
                    <Box position="relative" h="2" bg={bgMuted} rounded="full" overflow="hidden">
                      <Box
                        position="absolute"
                        top="0"
                        left="0"
                        h="full"
                        w={`${percentage}%`}
                        bg={color}
                        rounded="full"
                        transition="width 0.5s ease"
                      />
                    </Box>
                  </Box>
                </HStack>
                {!isLast && (
                  <Flex justify="center" my="1">
                    <Text 
                      as="span" 
                      className="material-symbols-outlined" 
                      fontSize="18px" 
                      color="fg.muted"
                    >
                      arrow_downward
                    </Text>
                  </Flex>
                )}
              </Box>
            );
          })}
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
