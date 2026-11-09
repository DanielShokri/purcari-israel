import React from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Card,
  Select,
  Portal,
  createListCollection,
} from '@chakra-ui/react';
import { WineType } from '@shared/types';

interface WineDetailsCardProps {
  wineType: WineType | undefined;
  onWineTypeChange: (type: WineType) => void;
  volume: string;
  onVolumeChange: (volume: string) => void;
  grapeVariety: string;
  onGrapeVarietyChange: (variety: string) => void;
  vintage: number;
  onVintageChange: (vintage: number) => void;
  servingTemperature: string;
  onServingTemperatureChange: (temp: string) => void;
}

const wineTypeOptions = createListCollection({
  items: [
    { label: 'יין אדום', value: WineType.RED },
    { label: 'יין לבן', value: WineType.WHITE },
    { label: 'יין רוזה', value: WineType.ROSE },
    { label: 'יין מבעבע', value: WineType.SPARKLING },
  ],
});

export default function WineDetailsCard({
  wineType,
  onWineTypeChange,
  volume,
  onVolumeChange,
  grapeVariety,
  onGrapeVarietyChange,
  vintage,
  onVintageChange,
  servingTemperature,
  onServingTemperatureChange,
}: WineDetailsCardProps) {
  return (
    <Card.Root>
      <Card.Header
        px="5"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
        bg="bg.subtle"
      >
        <Flex justify="space-between" alignItems="center" flexWrap="wrap" gap="2">
          <Heading size="md" color="fg">
            פרטי יין
          </Heading>
          <Text as="span" className="material-symbols-outlined" fontSize="lg" color="fg.muted">
            wine_bar
          </Text>
        </Flex>
      </Card.Header>
      <Card.Body p="5">
        <VStack gap="4" align="stretch">
          {/* Wine Type */}
          <VStack align="start" gap="2">
            <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
              סוג יין
            </Text>
            <Select.Root
              collection={wineTypeOptions}
              size="sm"
              value={wineType ? [wineType] : []}
              onValueChange={(e) => onWineTypeChange(e.value[0] as WineType)}
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger
                  bg="bg.subtle"
                  borderColor="border"
                  _focus={{ ringColor: 'blue.500', borderColor: 'blue.500' }}
                >
                  <Select.ValueText placeholder="בחר סוג יין" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Text as="span" className="material-symbols-outlined" fontSize="xl" color="fg.muted">
                    expand_more
                  </Text>
                </Select.IndicatorGroup>
              </Select.Control>
              <Portal>
                <Select.Positioner>
                  <Select.Content>
                    {wineTypeOptions.items.map((item) => (
                      <Select.Item item={item} key={item.value}>
                        {item.label}
                        <Select.ItemIndicator />
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Positioner>
              </Portal>
            </Select.Root>
          </VStack>

          {/* Volume and Vintage - stack vertically on mobile */}
          <HStack gap="4" direction={{ base: 'column', sm: 'row' }} align="stretch">
            <VStack align="start" gap="2" flex="1">
              <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
                נפח
              </Text>
              <Input
                size="sm"
                value={volume}
                onChange={(e) => onVolumeChange(e.target.value)}
                placeholder='750 מ"ל'
                bg="bg.subtle"
                borderColor="border"
              />
            </VStack>
            <VStack align="start" gap="2" flex="1">
              <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
                שנת בציר
              </Text>
              <Input
                size="sm"
                type="number"
                value={vintage || ''}
                onChange={(e) => onVintageChange(Number(e.target.value))}
                placeholder="2022"
                bg="bg.subtle"
                borderColor="border"
              />
            </VStack>
          </HStack>

          {/* Grape Variety */}
          <VStack align="start" gap="2">
            <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
              זן ענבים
            </Text>
            <Input
              size="sm"
              value={grapeVariety}
              onChange={(e) => onGrapeVarietyChange(e.target.value)}
              placeholder="למשל: 100% שרדונה"
              bg="bg.subtle"
              borderColor="border"
            />
          </VStack>

          {/* Serving Temperature */}
          <VStack align="start" gap="2">
            <Text fontSize="xs" fontWeight="bold" color="fg.muted" textTransform="uppercase" letterSpacing="wider">
              טמפרטורת הגשה
            </Text>
            <Input
              size="sm"
              value={servingTemperature}
              onChange={(e) => onServingTemperatureChange(e.target.value)}
              placeholder="למשל: 10-12°C"
              bg="bg.subtle"
              borderColor="border"
            />
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}