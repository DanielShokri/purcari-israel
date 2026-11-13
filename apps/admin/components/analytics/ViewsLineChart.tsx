import React, { useState, useMemo } from 'react';
import { Box, Flex, Heading, Card, Select, Portal, createListCollection, HStack, Button } from '@chakra-ui/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useColorModeValue } from '../ui/color-mode';
import { TimeSeriesDataPoint, AnalyticsInterval } from '@shared/types';

interface ViewsLineChartProps {
  data: TimeSeriesDataPoint[];
  title?: string;
  interval: AnalyticsInterval;
  onIntervalChange: (interval: AnalyticsInterval) => void;
}

export default function ViewsLineChart({ 
  data, 
  title = 'צפיות לאורך זמן',
  interval,
  onIntervalChange
}: ViewsLineChartProps) {
  const chartStroke = useColorModeValue('#3b82f6', '#3B82F6');
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

  return (
    <Card.Root
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
    >
       <Card.Body p="6">
         <Flex 
           justify="space-between" 
           align="center" 
           mb="6"
           gap="4"
           flexDir={{ base: "column", md: "row" }}
         >
           <Heading size="md" fontWeight="medium" color="fg">
             {title}
           </Heading>
            <Select.Root
              collection={intervalOptions}
              size="md"
              style={{ minWidth: '120px' }}
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
        <Box h="64" w="full" style={{ direction: 'ltr' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={chartStroke} 
                strokeWidth={2}
                dot={{ fill: chartStroke, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
