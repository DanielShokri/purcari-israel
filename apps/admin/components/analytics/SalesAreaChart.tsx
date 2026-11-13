import React, { useMemo } from 'react';
import { Box, Flex, Heading, Card, Select, Portal, createListCollection, HStack, Text } from '@chakra-ui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar } from 'recharts';
import { useColorModeValue } from '../ui/color-mode';
import { AnalyticsInterval } from '@shared/types';

interface SalesDataPoint {
  name: string;
  value: number; // revenue
  orders: number;
  timestamp: string;
}

interface SalesAreaChartProps {
  data: SalesDataPoint[];
  title?: string;
  interval: AnalyticsInterval;
  onIntervalChange: (interval: AnalyticsInterval) => void;
}

export default function SalesAreaChart({ 
  data, 
  title = 'מכירות והכנסות',
  interval,
  onIntervalChange,
}: SalesAreaChartProps) {
  const chartGridStroke = useColorModeValue('#e2e8f0', '#374151');
  const chartAxisStroke = useColorModeValue('#94a3b8', '#9CA3AF');
  const tooltipBg = useColorModeValue('#fff', '#1F2937');
  const tooltipBorder = useColorModeValue('#e5e7eb', '#374151');

  const intervalOptions = useMemo(() => {
    return createListCollection({
      items: [
        { label: 'יומי', value: 'daily' },
        { label: 'שבועי', value: 'weekly' },
        { label: 'חודשי', value: 'monthly' },
      ],
    });
  }, []);

  // Calculate totals
  const totalRevenue = data.reduce((sum, d) => sum + d.value, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Compact axis formatter - full ₪ strings get clipped on the Y axis
  const formatAxisCurrency = (value: number) => {
    if (value >= 1_000_000) return `₪${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `₪${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return `₪${value.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`;
  };

  return (
    <Card.Root
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      h="full"
    >
      <Card.Body p="6" display="flex" flexDirection="column">
        <Flex
          justify="space-between"
          align="center"
          mb="4"
          gap="4"
          flexDir={{ base: "column", md: "row" }}
          flexShrink={0}
        >
           <Box>
             <Heading size="md" fontWeight="medium" color="fg" mb="1">
               {title}
             </Heading>
             <HStack gap="4" fontSize="sm" color="fg.muted">
               <Text>
                 <Text as="span" fontWeight="medium" color="fg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                   {formatCurrency(totalRevenue)}
                 </Text>
                 {' '}סה"כ
               </Text>
               <Text>
                 <Text as="span" fontWeight="medium" color="fg" style={{ fontVariantNumeric: 'tabular-nums' }}>
                   {totalOrders.toLocaleString('he-IL')}
                 </Text>
                 {' '}הזמנות
               </Text>
               <Text>
                 ממוצע: {formatCurrency(avgOrderValue)}
               </Text>
             </HStack>
           </Box>
            <Select.Root
              collection={intervalOptions}
              size="md"
              width="120px"
              value={[interval]}
              onValueChange={(e) => onIntervalChange(e.value[0] as AnalyticsInterval)}
            >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                bg="bg"
                borderColor="border"
                color="fg.muted"
                fontSize="md"
                rounded="lg"
                px="3"
                py="1"
                _focus={{ borderColor: 'brand.500' }}
              >
                <Select.ValueText placeholder="בחר תקופה" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {intervalOptions.items.map((item) => (
                    <Select.Item item={item} key={item.value}>
                      {item.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </Flex>
        <Box flex="1" minH="320px" w="full" style={{ direction: 'ltr' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b13a48" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#b13a48" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={chartGridStroke}
                opacity={0.5}
              />
              <XAxis 
                dataKey="name" 
                stroke={chartAxisStroke} 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                yAxisId="left"
                stroke={chartAxisStroke} 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
                width={72}
                tickFormatter={formatAxisCurrency}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke={chartAxisStroke} 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`,
                  backgroundColor: tooltipBg,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                labelStyle={{ color: '#64748b' }}
                formatter={(value: number, name: string) => {
                  if (name === 'value') return [formatCurrency(value), 'הכנסות'];
                  return [value, 'הזמנות'];
                }}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="value" 
                stroke="#b13a48" 
                strokeWidth={2}
                fill="url(#salesGradient)"
                activeDot={{ r: 6, fill: '#b13a48' }}
              />
              <Bar
                yAxisId="right"
                dataKey="orders"
                fill="fg.muted"
                opacity={0.6}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
