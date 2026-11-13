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
  const couponMetrics = useQuery(api.analytics.getCouponMetrics);
  const searchMetrics = useQuery(api.analytics.getSearchMetrics);

  // Per-query loading (data not yet resolved for the current view/interval)
  const isSummaryLoading = summary === undefined;
  const isViewsLoading = viewsSeries === undefined || newUsersSeries === undefined;
  const isSalesLoading = salesSeries === undefined;
  const isConversionLoading = conversionMetrics === undefined;
  const isFunnelLoading = checkoutFunnel === undefined;
  const isCouponsLoading = couponMetrics === undefined;
  const isSearchLoading = searchMetrics === undefined;

  // Track when all queries have loaded for the first time
  const allLoaded = summary !== undefined && viewsSeries !== undefined && newUsersSeries !== undefined &&
    salesSeries !== undefined && conversionMetrics !== undefined && checkoutFunnel !== undefined &&
    couponMetrics !== undefined && searchMetrics !== undefined;
  useEffect(() => {
    if (allLoaded) setHasEverLoaded(true);
  }, [allLoaded]);

  // Only show full-page spinner on first load (cold cache), show overlays after that
  const isLoading = !hasEverLoaded && !allLoaded;

  if (isLoading) {
    return <LoadingState message="טוען נתוני אנליטיקות..." />;
  }

  // Average order value across the loaded series (replaces the removed cart-metrics card)
  const seriesRevenue = salesSeries?.reduce((s, d) => s + (d.value || 0), 0) || 0;
  const seriesOrders = salesSeries?.reduce((s, d) => s + (d.orders || 0), 0) || 0;
  const avgOrderValue = seriesOrders > 0 ? seriesRevenue / seriesOrders : 0;
  const avgOrderTrend = (() => {
    if (!salesSeries || salesSeries.length < 2) return { value: 0, isPositive: true };
    const last = salesSeries[salesSeries.length - 1];
    const prev = salesSeries[salesSeries.length - 2];
    const lastAvg = last.orders > 0 ? last.value / last.orders : 0;
    const prevAvg = prev.orders > 0 ? prev.value / prev.orders : 0;
    if (prevAvg === 0) return { value: 0, isPositive: true };
    const change = ((lastAvg - prevAvg) / prevAvg) * 100;
    return { value: change, isPositive: change >= 0 };
  })();

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
            value={formatCurrency(summary?.revenueToday || 0)}
            trend={{
              value: formatChange(summary?.revenueTodayChange || 0),
              isPositive: (summary?.revenueTodayChange || 0) >= 0,
              label: 'מאתמול'
            }}
          />
        </LoadingOverlay>
        <LoadingOverlay isLoading={isSalesLoading}>
          <StatCard
            title="הזמנות היום"
            value={(summary?.ordersToday || 0).toLocaleString('he-IL')}
            trend={{
              value: formatChange(summary?.ordersTodayChange || 0),
              isPositive: (summary?.ordersTodayChange || 0) >= 0,
              label: 'מאתמול'
            }}
          />
        </LoadingOverlay>
        <LoadingOverlay isLoading={isConversionLoading}>
          <StatCard
            title="שיעור המרה"
            value={`${(conversionMetrics?.overallConversionRate || 0).toFixed(2)}%`}
            trend={{
              value: formatChange(conversionMetrics?.overallConversionRateChange || 0),
              isPositive: (conversionMetrics?.overallConversionRateChange || 0) >= 0,
              label: 'מאתמול'
            }}
          />
        </LoadingOverlay>
        <LoadingOverlay isLoading={isSalesLoading}>
          <StatCard
            title="ממוצע הזמנה"
            value={formatCurrency(avgOrderValue)}
            trend={{
              value: formatChange(avgOrderTrend.value),
              isPositive: avgOrderTrend.isPositive,
              label: 'מהתקופה הקודמת'
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
            color="#9CA3AF"
            secondaryColor="#b13a48"
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

      {/* Conversion Funnel - Full width */}
      <LoadingOverlay isLoading={isFunnelLoading}>
        <ConversionFunnelChart
          steps={checkoutFunnel?.steps || []}
          totalConversion={checkoutFunnel?.totalConversion || 0}
        />
      </LoadingOverlay>

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
              <Heading size="md" fontWeight="medium" color="fg" mb="4">
                נתוני קופונים
              </Heading>
              <SimpleGrid columns={2} gap="4">
                <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                  <Text fontSize="2xl" fontWeight="medium" color="fg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {couponMetrics?.totalUsesThisMonth || 0}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">שימושים החודש</Text>
                </Box>
                <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
                  <Text fontSize="2xl" fontWeight="medium" color="fg" style={{ fontVariantNumeric: 'tabular-nums' }}>
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
              <Heading size="md" fontWeight="medium" color="fg" mb="1">
                נתוני משתמשים
              </Heading>
              <Text fontSize="sm" color="fg.muted" mb="4">
                כמות המשתמשים הרשומים שהיו פעילים בכל תקופה
              </Text>
              <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
                <UserStatTile
                  value={(summary?.dau || 0).toLocaleString('he-IL')}
                  acronym="DAU"
                  explanation="Daily Active Users - משתמשים פעילים היום"
                  change={summary?.dauChange}
                  changeLabel="מאתמול"
                />
                <UserStatTile
                  value={(summary?.wau || 0).toLocaleString('he-IL')}
                  acronym="WAU"
                  explanation="Weekly Active Users - משתמשים פעילים השבוע"
                  change={summary?.wauChange}
                  changeLabel="משבוע שעבר"
                />
                <UserStatTile
                  value={(summary?.mau || 0).toLocaleString('he-IL')}
                  acronym="MAU"
                  explanation="Monthly Active Users - משתמשים פעילים החודש"
                  change={summary?.mauChange}
                  changeLabel="מחודש שעבר"
                />
                <UserStatTile
                  value={(summary?.totalVisitors || 0).toLocaleString('he-IL')}
                  acronym={"סה\"כ מבקרים"}
                  explanation="מספר המבקרים הייחודיים מאז תחילת המדידה"
                />
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        </LoadingOverlay>
      </SimpleGrid>
    </VStack>
  );
}

function UserStatTile({
  value,
  acronym,
  explanation,
  change,
  changeLabel,
}: {
  value: string;
  acronym: string;
  explanation: string;
  change?: number;
  changeLabel?: string;
}) {
  return (
    <Box p="4" bg="bg.muted" rounded="lg" textAlign="center">
      <Text fontSize="2xl" fontWeight="medium" color="fg">
        {value}
      </Text>
      <Text fontSize="md" fontWeight="medium" color="fg" mt="1">
        {acronym}
      </Text>
      <Text fontSize="xs" color="fg.muted" mt="1">
        {explanation}
      </Text>
      {change !== undefined && changeLabel && Number.isFinite(change) && change !== 0 && (
        <Text fontSize="xs" color={change > 0 ? 'green.500' : 'red.500'} mt="1">
          {change > 0 ? '+' : ''}{change.toFixed(0)}% {changeLabel}
        </Text>
      )}
    </Box>
  );
}
