import React, { useMemo } from 'react';
import { Box, Flex, Heading, Card, Select, Portal, createListCollection } from '@chakra-ui/react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useColorModeValue } from '../ui/color-mode';
import { AnalyticsInterval } from '@shared/types';

interface DataPoint {
  name: string;
  value: number;
  timestamp: string;
  [key: string]: any;
}

interface EnhancedAreaChartProps {
  data: DataPoint[];
  title?: string;
  interval: AnalyticsInterval;
  onIntervalChange: (interval: AnalyticsInterval) => void;
  color?: string;
  secondaryDataKey?: string;
  secondaryColor?: string;
  valueFormatter?: (value: number) => string;
  showGrid?: boolean;
}

export default function EnhancedAreaChart({ 
  data, 
  title = 'נתונים לאורך זמן',
  interval,
  onIntervalChange,
  color = '#9CA3AF',
  secondaryDataKey,
  secondaryColor = '#b13a48',
  valueFormatter = (v) => v.toLocaleString('he-IL'),
  showGrid = true,
}: EnhancedAreaChartProps) {
  const chartGridStroke = useColorModeValue('#e2e8f0', '#374151');
  const chartAxisStroke = useColorModeValue('#94a3b8', '#9CA3AF');
  const tooltipBg = useColorModeValue('#fff', '#1F2937');
  const tooltipBorder = useColorModeValue('#e5e7eb', '#374151');

  // Compact axis formatter - large numbers get clipped on the Y axis
  const formatAxisNumber = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    return value.toLocaleString('he-IL', { maximumFractionDigits: 0 });
  };

  const intervalOptions = useMemo(() => {
    return createListCollection({
      items: [
        { label: 'יומי', value: 'daily' },
        { label: 'שבועי', value: 'weekly' },
        { label: 'חודשי', value: 'monthly' },
      ],
    });
  }, []);

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
          <Heading size="md" fontWeight="medium" color="fg">
            {title}
          </Heading>
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
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                </linearGradient>
                {secondaryDataKey && (
                  <linearGradient id={`gradient-${secondaryColor.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.05}/>
                  </linearGradient>
                )}
              </defs>
              {showGrid && (
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke={chartGridStroke}
                  opacity={0.5}
                />
              )}
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
                width={64}
                tickFormatter={formatAxisNumber}
              />
              <Tooltip
                contentStyle={{ 
                  borderRadius: '8px', 
                  border: `1px solid ${tooltipBorder}`,
                  backgroundColor: tooltipBg,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                }}
                labelStyle={{ color: '#64748b' }}
                formatter={(value: number, name: string) => [
                  valueFormatter(value),
                  name === 'value' ? 'צפיות' : 'המרות',
                ]}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                fill={`url(#gradient-${color.replace('#', '')})`}
                activeDot={{ r: 6, fill: color }}
              />
              {secondaryDataKey && (
                <Area 
                  type="monotone" 
                  dataKey={secondaryDataKey} 
                  stroke={secondaryColor} 
                  strokeWidth={2}
                  fill={`url(#gradient-${secondaryColor.replace('#', '')})`}
                  activeDot={{ r: 6, fill: secondaryColor }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
