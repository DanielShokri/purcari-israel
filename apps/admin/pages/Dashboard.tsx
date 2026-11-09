// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '@convex/api';
import {
  Box,
  Flex,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
} from '@chakra-ui/react';
import { LoadingState } from '../components/shared';
import { StatCard, SalesChart, ActivityFeed, OrdersTable } from '../components/dashboard';
import type { ActivityItem, Order as DashboardOrder } from '../components/dashboard';

// Helper to format currency
const formatCurrency = (amount: number): string => {
  return `₪${amount.toLocaleString('he-IL')}`;
};

// Helper to format percentage change
const formatChange = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

// Helper to get initials from name
const getInitials = (name: string): string => {
  const words = name.split(' ');
  if (words.length >= 2) {
    return words[0].charAt(0) + words[1].charAt(0);
  }
  return name.substring(0, 2);
};

// Helper to get avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = ['blue', 'purple', 'orange', 'teal', 'pink', 'cyan'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

// Helper to format date in Hebrew
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Helper to format relative time in Hebrew
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'עכשיו';
  if (diffMinutes < 60) return `לפני ${diffMinutes} דקות`;
  if (diffHours < 24) return diffHours === 1 ? 'לפני שעה' : `לפני ${diffHours} שעות`;
  if (diffDays === 1) return 'אתמול';
  if (diffDays < 7) return `לפני ${diffDays} ימים`;

  return date.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [hasEverLoaded, setHasEverLoaded] = useState(false);

  const stats = useQuery(api.admin.getStats);
  const recentOrders = useQuery(api.orders.listAll, {});
  const availableYears = useQuery(api.admin.getAvailableYears);
  const monthlySales = useQuery(api.admin.getMonthlySales, { year: parseInt(selectedYear) });
  const recentActivities = useQuery(api.activities.getLatest);

  // Track when all queries have loaded for the first time
  const allLoaded = stats !== undefined && recentOrders !== undefined && availableYears !== undefined && monthlySales !== undefined && recentActivities !== undefined;
  useEffect(() => {
    if (allLoaded) setHasEverLoaded(true);
  }, [allLoaded]);

  // Only show spinner on first load (cold cache), show data instantly on return visits
  const isLoading = !hasEverLoaded && !allLoaded;

  // Map API orders to dashboard Order type
  const dashboardOrders: DashboardOrder[] = useMemo(() => {
    if (!recentOrders) return [];
    // Take only first 5 for dashboard
    return recentOrders.slice(0, 5).map((order) => ({
      id: `#${order._id.substring(0, 8)}`,
      customer: order.customerName,
      initials: getInitials(order.customerName),
      color: getAvatarColor(order.customerName),
      date: formatDate(order.createdAt),
      amount: formatCurrency(order.total),
      status: order.status,
    }));
  }, [recentOrders]);

  // Use chart data from API or fallback to empty
  const chartData = monthlySales || [];

  // Map API activities to dashboard ActivityItem type
  const dashboardActivities: ActivityItem[] = useMemo(() => {
    if (!recentActivities || recentActivities.length === 0) return [];
    return recentActivities.slice(0, 5).map((activity) => ({
      title: activity.title,
      subtitle: `${formatRelativeTime(activity.createdAt)} • ${activity.subtitle}`,
      color: activity.color,
    }));
  }, [recentActivities]);

  if (isLoading) {
    return <LoadingState message="טוען נתונים..." />;
  }

  return (
    <VStack gap="6" align="stretch">
      {/* Page Header */}
      <Flex justify="space-between" align="end" mb="2" flexWrap="wrap" gap="2">
        <Box>
          <Heading size={{ base: 'lg', md: 'xl' }} fontWeight="bold" color="fg" mb="1">
            סקירה כללית
          </Heading>
          <Text color="fg.muted" fontSize="sm">
            ברוך הבא למערכת הניהול, להלן הנתונים להיום.
          </Text>
        </Box>
      </Flex>

      {/* Stats Grid */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="6">
        <StatCard
          title="סה״כ הכנסות"
          value={formatCurrency(stats?.totalRevenue || 0)}
          icon="payments"
          iconBg="green.500/10"
          iconColor="green.500"
          trend={{
            value: formatChange(stats?.revenueChange || 0),
            isPositive: (stats?.revenueChange || 0) >= 0,
            label: 'מהחודש שעבר'
          }}
        />
        <StatCard
          title="משתמשים רשומים"
          value={(stats?.totalUsers || 0).toLocaleString('he-IL')}
          icon="group"
          iconBg="blue.500/10"
          iconColor="blue.500"
          trend={{
            value: formatChange(stats?.usersChange || 0),
            isPositive: (stats?.usersChange || 0) >= 0,
            label: 'מהשבוע האחרון'
          }}
        />
        <StatCard
          title="הזמנות החודש"
          value={(stats?.newOrders || 0).toLocaleString('he-IL')}
          icon="shopping_bag"
          iconBg="purple.500/10"
          iconColor="purple.500"
          trend={{
            value: formatChange(stats?.ordersChange || 0),
            isPositive: (stats?.ordersChange || 0) >= 0,
            label: 'מהיום אתמול'
          }}
          infoItems={[
            ...(stats?.cancelledOrders ? [{ label: 'בוטלו', value: stats.cancelledOrders, color: 'red.400', icon: 'cancel' }] : []),
            ...(stats?.pendingOrders ? [{ label: 'ממתינות', value: stats.pendingOrders, color: 'yellow.500', icon: 'schedule' }] : []),
          ]}
        />
        <StatCard
          title="אחוז המרה"
          value={`${(stats?.conversionRate || 0).toFixed(2)}%`}
          icon="bar_chart"
          iconBg="orange.500/10"
          iconColor="orange.500"
          trend={{
            value: '+1.2%',
            isPositive: true,
            label: 'יחסית לממוצע'
          }}
        />
      </SimpleGrid>

      {/* Charts Section */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} gap="6">
        <SalesChart
          data={chartData}
          years={availableYears?.map(String) || [new Date().getFullYear().toString()]}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
        <ActivityFeed activities={dashboardActivities} />
      </SimpleGrid>

      {/* Orders Table */}
      <OrdersTable orders={dashboardOrders} onViewAll={() => navigate('/orders')} />

      {/* Footer */}
      <Box textAlign="center" fontSize="xs" color="fg.muted" mt="4">
        {new Date().getFullYear()} Purcari Israel - Daniel Shokri
      </Box>
    </VStack>
  );
}
