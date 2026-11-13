import React from 'react';
import { Flex, Box, Input, InputGroup, Text, Select, Portal, createListCollection } from '@chakra-ui/react';

interface OrdersFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateFilter: string;
  onDateFilterChange: (value: string) => void;
}

const statusOptions = createListCollection({
  items: [
    { label: 'כל הסטטוסים', value: 'all' },
    { label: 'הושלם', value: 'completed' },
    { label: 'בטיפול', value: 'processing' },
    { label: 'ממתין לתשלום', value: 'pending' },
    { label: 'בוטל', value: 'cancelled' },
  ],
});

const dateOptions = createListCollection({
  items: [
    { label: 'כל התאריכים', value: 'all' },
    { label: 'היום', value: 'today' },
    { label: 'השבוע', value: 'week' },
    { label: 'החודש', value: 'month' },
  ],
});

export default function OrdersFilterToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange,
}: OrdersFilterToolbarProps) {
  return (
    <Flex
      gap="4"
      mb="4"
      direction={{ base: 'column', md: 'row' }}
      flexWrap="wrap"
    >
      {/* Search Filter */}
      <Box flex="2" minW="200px">
        <InputGroup
          startElement={
            <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
              search
            </Text>
          }
        >
          <Input
            placeholder="חיפוש לפי מספר הזמנה או שם לקוח..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            size="md"
            bg="bg.panel"
            borderColor="border"
            _hover={{ borderColor: 'border.hover' }}
          />
        </InputGroup>
      </Box>

      {/* Status Filter */}
      <Box flex="1" minW="150px">
        <Select.Root
          collection={statusOptions}
          size="md"
          value={[statusFilter]}
          onValueChange={(e) => onStatusFilterChange(e.value[0])}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger
              bg="bg.panel"
              borderColor="border"
              _hover={{ borderColor: 'border.hover' }}
            >
              <Select.ValueText placeholder="כל הסטטוסים" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                filter_list
              </Text>
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {statusOptions.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Box>

      {/* Date Filter */}
      <Box flex="1" minW="150px">
        <Select.Root
          collection={dateOptions}
          size="md"
          value={[dateFilter]}
          onValueChange={(e) => onDateFilterChange(e.value[0])}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger
              bg="bg.panel"
              borderColor="border"
              _hover={{ borderColor: 'border.hover' }}
            >
              <Select.ValueText placeholder="כל התאריכים" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                calendar_today
              </Text>
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {dateOptions.items.map((item) => (
                  <Select.Item item={item} key={item.value}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </Box>
    </Flex>
  );
}
