// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React, { useState, useEffect } from 'react';
import { VStack, SimpleGrid, Heading, Text, Box, HStack, Card } from '@chakra-ui/react';
import { useQuery } from 'convex/react';
import { api } from '@convex/api';
import { LoadingState, LoadingOverlay } from '../components/shared';
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

  // Per-query loading (data not yet resolved for the current view/interval)
  const isSummaryLoading = summary === undefined;
  const isViewsLoading = viewsSeries === undefined || newUsersSeries === undefined;
  const isSalesLoading = salesSeries === undefined;
  const isConversionLoading = conversionMetrics === undefined;
  const isFunnelLoading = checkoutFunnel === undefined;
  const isCartLoading = cartMetrics === undefined;
  const isCouponsLoading = couponMetrics === undefined;
  const isSearchLoading = searchMetrics === undefined;

  // Track when all queries have loaded for the first time
  const allLoaded = summary !== undefined && viewsSeries !== undefined && newUsersSeries !== undefined &&
    salesSeries !== undefined && conversionMetrics !== undefined && checkoutFunnel !== undefined &&
    cartMetrics !== undefined && couponMetrics !== undefined && searchMetrics !== undefined;
  useEffect(() => {
    if (allLoaded) setHasEverLoaded(true);
  }, [allLoaded]);

  // Only show full-page spinner on first load (cold cache), show overlays after that
  const isLoading = !hasEverLoaded && !allLoaded;

  if (isLoading) {
    return <LoadingState message="טוען נתוני אנליטיקות..." />;
  }

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
      {/* Primary Stats Grid - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="4">
        <LoadingOverlay isLoading={isSalesLoading}>
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
        </LoadingOverlay>
        <LoadingOverlay isLoading={isSalesLoading}>
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
        </LoadingOverlay>
        <LoadingOverlay isLoading={isConversionLoading}>
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
        </LoadingOverlay>
        <LoadingOverlay isLoading={isCartLoading}>
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
        </LoadingOverlay>
      </SimpleGrid>

      {/* Sales & Views Charts - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        <LoadingOverlay isLoading={isSalesLoading}>
          <SalesAreaChart
            data={salesSeries || []}
            interval={salesInterval}
            onIntervalChange={setSalesInterval}
          />
        </LoadingOverlay>
        <LoadingOverlay isLoading={isViewsLoading}>
          <EnhancedAreaChart
            data={viewsSeries || []}
            title="צפיות והמרות"
            interval={viewsInterval}
            onIntervalChange={setViewsInterval}
            color="#8b5cf6"
          />
        </LoadingOverlay>
      </SimpleGrid>

      {/* Conversion Metrics */}
      <LoadingOverlay isLoading={isConversionLoading}>
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
      </LoadingOverlay>

      {/* Funnel & Cart Metrics - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        <LoadingOverlay isLoading={isFunnelLoading}>
          <ConversionFunnelChart
            steps={checkoutFunnel?.steps || []}
            totalConversion={checkoutFunnel?.totalConversion || 0}
          />
        </LoadingOverlay>
        <LoadingOverlay isLoading={isCartLoading}>
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
        </LoadingOverlay>
      </SimpleGrid>

      {/* Top Products & Searches - Stack on mobile */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
        <LoadingOverlay isLoading={isSummaryLoading}>
          <PopularProductsChart data={summary?.topProducts || []} />
        </LoadingOverlay>
        <LoadingOverlay isLoading={isSearchLoading}>
          <TopSearchesBarList
            data={searchMetrics?.topSearches || []}
            title={`חיפושים פופולריים (${searchMetrics?.totalSearchesThisMonth || 0} החודש)`}
          />
        </LoadingOverlay>
      </SimpleGrid>

      {/* Coupon & User Metrics - Full width on mobile */}
      <SimpleGrid columns={{ base: 1 }} gap="6">
        <LoadingOverlay isLoading={isCouponsLoading}>
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
        </LoadingOverlay>

        <LoadingOverlay isLoading={isSummaryLoading}>
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
        </LoadingOverlay>
      </SimpleGrid>
    </VStack>
  );
}
