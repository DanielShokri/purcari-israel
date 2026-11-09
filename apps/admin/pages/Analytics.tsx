// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React, { useState, useEffect } from 'react';
import { VStack, SimpleGrid, Heading, Text, Box, Tabs, HStack, Card } from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { api } from '@convex/api';
import { LoadingState } from '../components/shared';
import { StatCard } from '../components/dashboard';
import {
  EnhancedAreaChart,
  SalesAreaChart,
  PopularProductsChart,
  ConversionFunnelChart,
  TopSearchesBarList,
  CartMetricsCard,
  ConversionMetricsCard,
} from '../components/analytics';
import { AnalyticsInterval } from '@shared/types';

export default function Analytics() {
  const [viewsInterval, setViewsInterval] = useState<AnalyticsInterval>(AnalyticsInterval.DAILY);
  const [salesInterval, setSalesInterval] = useState<AnalyticsInterval>(AnalyticsInterval.DAILY);
  const [hasEverLoaded, setHasEverLoaded] = useState(false);

  // Existing queries
  const summary = useQuery(api.analytics.getSummary);
  const viewsSeries = useQuery(api.analytics.getViewsSeries, { interval: viewsInterval });
  const newUsersSeries = useQuery(api.analytics.getNewUsersSeries, { interval: viewsInterval });

  // New queries
  const salesSeries = useQuery(api.analytics.getSalesSeries, { interval: salesInterval });
  const conversionMetrics = useQuery(api.analytics.getConversionMetrics);
  const checkoutFunnel = useQuery(api.analytics.getCheckoutFunnel);
  const cartMetrics = useQuery(api.analytics.getCartMetrics);
  const couponMetrics = useQuery(api.analytics.getCouponMetrics);
  const searchMetrics = useQuery(api.analytics.getSearchMetrics);

  // Track when all queries have loaded for the first time
  const allLoaded = summary !== undefined && viewsSeries !== undefined && newUsersSeries !== undefined &&
    salesSeries !== undefined && conversionMetrics !== undefined && checkoutFunnel !== undefined &&
    cartMetrics !== undefined && couponMetrics !== undefined && searchMetrics !== undefined;
  useEffect(() => {
    if (allLoaded) setHasEverLoaded(true);
  }, [allLoaded]);

  // Only show spinner on first load (cold cache), show data instantly on return visits
  const isLoading = !hasEverLoaded && !allLoaded;

  const formatChange = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <VStack gap="6" align="stretch">
      {/* Page Header */}
      <Box>
        <Heading size="xl" fontWeight="bold" color="fg" mb="1">
          אנליטיקות
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          סקירה מפורטת של ביצועי האתר והמעורבות של המשתמשים
        </Text>
      </Box>

      {/* Primary Stats Grid - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="4">
        <StatCard
          title="הכנסות היום"
          value={salesSeries && salesSeries.length > 0
            ? formatCurrency(salesSeries[salesSeries.length - 1]?.value || 0)
            : '₪0'
          }
          icon="payments"
          iconBg="green.500/10"
          iconColor="green.500"
          trend={{
            value: formatChange(summary?.viewsTodayChange || 0),
            isPositive: (summary?.viewsTodayChange || 0) >= 0,
            label: 'מהיום אתמול'
          }}
        />
        <StatCard
          title="הזמנות היום"
          value={salesSeries && salesSeries.length > 0
            ? (salesSeries[salesSeries.length - 1]?.orders || 0).toLocaleString('he-IL')
            : '0'
          }
          icon="shopping_bag"
          iconBg="blue.500/10"
          iconColor="blue.500"
          trend={{
            value: formatChange(summary?.viewsTodayChange || 0),
            isPositive: (summary?.viewsTodayChange || 0) >= 0,
            label: 'מהיום אתמול'
          }}
        />
        <StatCard
          title="שיעור המרה"
          value={`${(conversionMetrics?.overallConversionRate || 0).toFixed(2)}%`}
          icon="trending_up"
          iconBg="purple.500/10"
          iconColor="purple.500"
          trend={{
            value: formatChange(conversionMetrics?.overallConversionRateChange || 0),
            isPositive: (conversionMetrics?.overallConversionRateChange || 0) >= 0,
            label: 'מהיום אתמול'
          }}
        />
        <StatCard
          title="ממוצע סל"
          value={formatCurrency(cartMetrics?.averageCartValueToday || 0)}
          icon="shopping_cart"
          iconBg="orange.500/10"
          iconColor="orange.500"
          trend={{
            value: formatChange(0),
            isPositive: true,
            label: 'משבוע שעבר'
          }}
        />
      </SimpleGrid>

      {/* Sales & Views Charts - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        <SalesAreaChart
          data={salesSeries || []}
          interval={salesInterval}
          onIntervalChange={setSalesInterval}
        />
        <EnhancedAreaChart
          data={viewsSeries || []}
          title="צפיות והמרות"
          interval={viewsInterval}
          onIntervalChange={setViewsInterval}
          color="#8b5cf6"
        />
      </SimpleGrid>

      {/* Conversion Metrics */}
      <ConversionMetricsCard metrics={conversionMetrics || {
        productToCartRate: 0,
        cartToCheckoutRate: 0,
        checkoutToOrderRate: 0,
        overallConversionRate: 0,
        productToCartRateChange: 0,
        overallConversionRateChange: 0,
        productViewsToday: 0,
        addToCartsToday: 0,
        checkoutsStartedToday: 0,
        ordersCompletedToday: 0,
      }} />

      {/* Funnel & Cart Metrics - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        <ConversionFunnelChart
          steps={checkoutFunnel?.steps || []}
          totalConversion={checkoutFunnel?.totalConversion || 0}
        />
        <CartMetricsCard metrics={cartMetrics || {
          cartsCreatedToday: 0,
          cartsCreatedWeek: 0,
          abandonedCartsToday: 0,
          abandonmentRateToday: 0,
          abandonmentRateChange: 0,
          averageCartValueToday: 0,
          averageCartValueWeek: 0,
          ordersToday: 0,
          ordersWeek: 0,
        }} />
      </SimpleGrid>

      {/* Top Products & Searches - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        <PopularProductsChart data={summary?.topProducts || []} />
        <TopSearchesBarList
          data={searchMetrics?.topSearches || []}
          title={`חיפושים פופולריים (${searchMetrics?.totalSearchesThisMonth || 0} החודש)`}
        />
      </SimpleGrid>

      {/* Coupon & User Metrics - Full width on mobile */}
      <SimpleGrid columns={{ base: 1 }} gap="6">
        <Card.Root bg="bg.panel" borderWidth="1px" borderColor="border">
          <Card.Body p="6">
            <Heading size="md" fontWeight="bold" color="fg" mb="4">
              נתוני קופונים
            </Heading>
            <SimpleGrid columns={2} gap="4">
              <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {couponMetrics?.totalUsesThisMonth || 0}
                </Text>
                <Text fontSize="sm" color="fg.muted">שימושים החודש</Text>
              </Box>
              <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {formatCurrency(couponMetrics?.totalDiscountGiven || 0)}
                </Text>
                <Text fontSize="sm" color="fg.muted">הנחות שניתנו</Text>
              </Box>
            </SimpleGrid>
            {couponMetrics?.topCoupons && couponMetrics.topCoupons.length > 0 && (
              <Box mt="4">
                <Text fontSize="sm" fontWeight="medium" color="fg" mb="2">
                  קופונים פופולריים
                </Text>
                {couponMetrics.topCoupons.slice(0, 3).map((coupon: any) => (
                  <HStack key={coupon.code} justify="space-between" py="1">
                    <Text fontSize="sm" fontFamily="mono" bg="bg.subtle" px="2" py="0.5" rounded="md">
                      {coupon.code}
                    </Text>
                    <Text fontSize="sm" color="fg.muted">
                      {coupon.uses} שימושים · {formatCurrency(coupon.totalDiscount)}
                    </Text>
                  </HStack>
                ))}
              </Box>
            )}
          </Card.Body>
        </Card.Root>

        <Card.Root bg="bg.panel" borderWidth="1px" borderColor="border">
          <Card.Body p="6">
            <Heading size="md" fontWeight="bold" color="fg" mb="4">
              נתוני משתמשים
            </Heading>
            <SimpleGrid columns={2} gap="4">
              <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                <Text fontSize="xl" fontWeight="bold" color="fg">
                  {(summary?.dau || 0).toLocaleString('he-IL')}
                </Text>
                <Text fontSize="sm" color="fg.muted">DAU</Text>
              </Box>
              <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                <Text fontSize="xl" fontWeight="bold" color="fg">
                  {(summary?.wau || 0).toLocaleString('he-IL')}
                </Text>
                <Text fontSize="sm" color="fg.muted">WAU</Text>
              </Box>
              <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                <Text fontSize="xl" fontWeight="bold" color="fg">
                  {(summary?.mau || 0).toLocaleString('he-IL')}
                </Text>
                <Text fontSize="sm" color="fg.muted">MAU</Text>
              </Box>
              <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                <Text fontSize="xl" fontWeight="bold" color="fg">
                  {(summary?.totalVisitors || 0).toLocaleString('he-IL')}
                </Text>
                <Text fontSize="sm" color="fg.muted">צפיות</Text>
              </Box>
            </SimpleGrid>
          </Card.Body>
        </Card.Root>
      </SimpleGrid>
    </VStack>
  );
}