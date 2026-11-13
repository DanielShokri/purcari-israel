import React from 'react';
import { Box, Flex, Text, Button, Card, Input } from '@chakra-ui/react';

interface CategoryTreeToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function CategoryTreeToolbar({
  searchTerm,
  onSearchChange
}: CategoryTreeToolbarProps) {
  return (
    <Card.Root>
      <Card.Body p="4">
        <Flex alignItems="center" gap="3">
          <Box position="relative" flex="1">
            <Box
              position="absolute"
              top="50%"
              right="3"
              transform="translateY(-50%)"
              color="fg.muted"
              pointerEvents="none"
            >
              <Text as="span" className="material-symbols-outlined" fontSize="18px">
                search
              </Text>
            </Box>
            <Input
              placeholder="חפש קטגוריה..."
              size="md"
              pr="10"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </Box>
          <Button variant="outline" size="md" px="4" h="10">
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              filter_list
            </Text>
            <Text as="span">סינון</Text>
          </Button>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
