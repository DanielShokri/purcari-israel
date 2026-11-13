import React, { useMemo } from 'react';
import { Box, Flex, Heading, Card, Select, Portal, createListCollection } from '@chakra-ui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useColorModeValue } from '../ui/color-mode';

interface ChartDataPoint {
  name: string;
  value: number;
}

interface SalesChartProps {
  data: ChartDataPoint[];
  title?: string;
  years?: string[];
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

export default function SalesChart({ 
  data, 
  title = 'מגמת מכירות שנתית',
  years = ['2023', '2022'],
  selectedYear,
  onYearChange
}: SalesChartProps) {
  const chartStroke = useColorModeValue('#992e3c', '#b13a48');
  const chartGridStroke = useColorModeValue('#e2e8f0', '#374151');
  const chartAxisStroke = useColorModeValue('#94a3b8', '#9CA3AF');
  const tooltipBg = useColorModeValue('#fff', '#1F2937');
  const tooltipBorder = useColorModeValue('#e5e7eb', '#374151');

  // Create dynamic collection for years
  const yearOptions = useMemo(() => {
    return createListCollection({
      items: years.map(year => ({ label: year, value: year })),
    });
  }, [years]);

  return (
    <Card.Root
      gridColumn={{ lg: 'span 2' }}
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
    >
      <Card.Body p="6">
        <Flex justify="space-between" align="center" mb="6">
          <Heading size="md" fontWeight="medium" color="fg">
            {title}
          </Heading>
          <Select.Root
            collection={yearOptions}
            size="sm"
            width="80px"
            value={selectedYear ? [selectedYear] : []}
            onValueChange={(e) => onYearChange?.(e.value[0])}
          >
            <Select.HiddenSelect />
            <Select.Control>
              <Select.Trigger
                bg="bg"
                borderColor="border"
                color="fg.muted"
                fontSize="sm"
                rounded="lg"
                px="3"
                py="1"
                _focus={{ borderColor: 'brand.500' }}
              >
                <Select.ValueText placeholder="בחר שנה" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {yearOptions.items.map((item) => (
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
        <Box h="64" w="full" style={{ direction: 'ltr' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b13a48" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#b13a48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="name" 
                stroke={chartAxisStroke} 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke={chartAxisStroke} 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <CartesianGrid 
                strokeDasharray="3 3" 
                vertical={false} 
                stroke={chartGridStroke}
                opacity={0.5}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`,
                  backgroundColor: tooltipBg,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                labelStyle={{ color: '#64748b' }}
                formatter={(value: number) => [`${value.toLocaleString('he-IL')} ₪`, 'מכירות']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={chartStroke} 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
