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
            rounded="full"
            px="4"
            fontWeight="medium"
            whiteSpace="nowrap"
            flexShrink={0}
            variant={activeChip === chip.key ? 'solid' : 'outline'}
            colorPalette={activeChip === chip.key ? 'gray' : 'gray'}
            bg={activeChip === chip.key ? 'fg' : 'bg.panel'}
            color={activeChip === chip.key ? 'bg' : 'fg.muted'}
            borderColor={activeChip === chip.key ? 'fg' : 'border'}
            _hover={{
              bg: activeChip === chip.key ? 'fg' : 'bg.subtle',
            }}
            onClick={() => onChipChange(chip.key)}
          >
            {chip.label} ({chip.count})
          </Button>
        ))}
      </HStack>
    </Box>
  );
}