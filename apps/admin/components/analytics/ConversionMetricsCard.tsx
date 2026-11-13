import React from 'react';
import { Box, Flex, Heading, Card, SimpleGrid, HStack, Text } from '@chakra-ui/react';
import { useColorModeValue } from '../ui/color-mode';

interface ConversionMetrics {
  productToCartRate: number;
  cartToCheckoutRate: number;
  checkoutToOrderRate: number;
  overallConversionRate: number;
  productToCartRateChange: number;
  overallConversionRateChange: number;
  productToCartRateYesterday?: number;
  overallConversionRateYesterday?: number;
  productViewsToday: number;
  addToCartsToday: number;
  checkoutsStartedToday: number;
  ordersCompletedToday: number;
}

interface ConversionMetricsCardProps {
  metrics: ConversionMetrics;
  title?: string;
}

/**
 * Clamp a rate to a sane 0-100 range. A funnel step can report >100%
 * when events are counted slightly differently (e.g. a visitor starts
 * checkout twice from one cart) - displaying 300% confuses end users.
 */
const clampRate = (rate: number): number => Math.max(0, Math.min(rate, 100));

const formatRate = (rate: number): string => `${clampRate(rate).toFixed(1)}%`;

export default function ConversionMetricsCard({ 
  metrics,
  title = 'שיעורי המרה'
}: ConversionMetricsCardProps) {
  const progressTrackBg = useColorModeValue('gray.100', 'gray.700');

  const conversionSteps = [
    {
      headline: 'הוספה לסל',
      subtitle: 'מתוך מי שצפה במוצר',
      rate: metrics.productToCartRate,
      color: 'brand.500',
      counts: { done: metrics.addToCartsToday, total: metrics.productViewsToday },
      totalLabel: 'צפיות',
    },
    {
      headline: 'התחלת תשלום',
      subtitle: 'מתוך מי שהוסיף לסל',
      rate: metrics.cartToCheckoutRate,
      color: 'brand.500',
      counts: { done: metrics.checkoutsStartedToday, total: metrics.addToCartsToday },
      totalLabel: 'הוספות לסל',
    },
    {
      headline: 'הזמנה מושלמת',
      subtitle: 'מתוך מי שהתחיל תשלום',
      rate: metrics.checkoutToOrderRate,
      color: 'brand.500',
      counts: { done: metrics.ordersCompletedToday, total: metrics.checkoutsStartedToday },
      totalLabel: 'התחלות תשלום',
    },
  ];

  return (
    <Card.Root bg="bg.panel" borderWidth="1px" borderColor="border">
      <Card.Body p="6">
        <Flex justify="space-between" align="center" mb="6" gap="4" flexDir={{ base: 'column', md: 'row' }}>
          <Heading size="md" fontWeight="medium" color="fg">
            {title}
          </Heading>
          <Box textAlign={{ base: 'center', md: 'end' }}>
            <Text fontSize="xs" color="fg.muted" mb="0">שיעור המרה כולל (הזמנות מתוך צפיות במוצר)</Text>
            <HStack gap="3" justify={{ base: 'center', md: 'end' }}>
              <Text fontSize="2xl" fontWeight="medium" color="fg" mb="0" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {formatRate(metrics.overallConversionRate)}
              </Text>
              {metrics.overallConversionRateYesterday !== undefined && (
                <Text fontSize="xs" color="fg.muted">
                  אתמול: {formatRate(metrics.overallConversionRateYesterday)}
                </Text>
              )}
            </HStack>
          </Box>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 3 }} gap="6">
          {conversionSteps.map((step) => (
            <Box key={step.headline}>
              {/* Headline + progress */}
              <Flex justify="space-between" align="center" mb="1">
                <Text fontSize="md" fontWeight="medium" color="fg">
                  {step.headline}
                </Text>
                <Text fontSize="lg" fontWeight="medium" color={step.color}>
                  {formatRate(step.rate)}
                </Text>
              </Flex>

              <Box 
                position="relative" 
                h="3" 
                bg={progressTrackBg} 
                rounded="full" 
                overflow="hidden" 
                mb="2"
                dir="ltr"
              >
                <Box
                  position="absolute"
                  top="0"
                  left="0"
                  h="full"
                  w={`${clampRate(step.rate)}%`}
                  bg={step.color}
                  rounded="full"
                  transition="width 0.5s ease"
                />
              </Box>

              {/* Clear "X out of Y" wording instead of bare "4 / 9" */}
              <HStack justify="space-between" align="center">
                <Text fontSize="sm" color="fg.muted">
                  {step.counts.done.toLocaleString('he-IL')} מתוך{' '}
                  {step.counts.total.toLocaleString('he-IL')} {step.totalLabel}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {step.subtitle}
                </Text>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>
      </Card.Body>
    </Card.Root>
  );
}
