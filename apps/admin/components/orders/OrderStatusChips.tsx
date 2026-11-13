import React from 'react';
import { Box, HStack, Button, VStack } from '@chakra-ui/react';
import { OrderStatus } from '@shared/types';

interface StatusChip {
  key: string;
  label: string;
  count: number;
}

interface OrderStatusChipsProps {
  activeChip: string;
  onChipChange: (chip: string) => void;
  statusCounts: Record<string, number>;
  totalCount: number;
}

export default function OrderStatusChips({
  activeChip,
  onChipChange,
  statusCounts,
  totalCount,
}: OrderStatusChipsProps) {
  const chips: StatusChip[] = [
    { key: 'all', label: 'הכל', count: totalCount },
    { key: 'processing', label: 'בטיפול', count: statusCounts['processing'] || 0 },
    { key: 'pending', label: 'ממתין לתשלום', count: statusCounts['pending'] || 0 },
    { key: 'completed', label: 'הושלם', count: statusCounts['completed'] || 0 },
    { key: 'cancelled', label: 'בוטל', count: statusCounts['cancelled'] || 0 },
  ];

  return (
    <Box pb="2" mb="4">
      <HStack gap="2" overflowX="auto" pb="2" flexWrap="nowrap">
        {chips.map((chip) => (
          <Button
            key={chip.key}
            size="sm"
            rounded="md"
            px="3"
            fontWeight="medium"
            whiteSpace="nowrap"
            flexShrink={0}
            variant={activeChip === chip.key ? 'solid' : 'outline'}
            colorPalette={activeChip === chip.key ? 'brand' : 'gray'}
            bg={activeChip === chip.key ? 'brand.solid' : 'bg.panel'}
            color={activeChip === chip.key ? 'brand.contrast' : 'fg.muted'}
            borderColor={activeChip === chip.key ? 'brand.solid' : 'border'}
            _hover={{
              bg: activeChip === chip.key ? 'brand.solid' : 'bg.subtle',
            }}
            style={{ fontVariantNumeric: 'tabular-nums' }}
            onClick={() => onChipChange(chip.key)}
          >
            {chip.label} ({chip.count})
          </Button>
        ))}
      </HStack>
    </Box>
  );
}