import React from 'react';
import { Box, Flex, HStack, Text, Button, Card } from '@chakra-ui/react';
import { SearchInput } from '../shared';

interface UsersFilterToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function UsersFilterToolbar({
  searchTerm,
  onSearchChange
}: UsersFilterToolbarProps) {
  return (
    <Box pb="6" flexShrink={0}>
      <Card.Root>
        <Card.Body p="4">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            justify="space-between"
            gap="4"
          >
            {/* Search */}
            <SearchInput
              placeholder="חפש לפי שם, אימייל או תפקיד..."
              value={searchTerm}
              onChange={onSearchChange}
              width={{ base: 'full', lg: 'md' }}
            />

            {/* Filter & Export Buttons */}
            <HStack gap="2" flexWrap="wrap" w={{ base: 'full', lg: 'auto' }}>
              <Button variant="outline" size="sm" bg="bg" px="4" h="11">
                <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                  filter_list
                </Text>
                <Text as="span">סינון</Text>
              </Button>
              <Button variant="outline" size="sm" bg="bg" px="4" h="11">
                <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
                  download
                </Text>
                <Text as="span">ייצוא</Text>
              </Button>
            </HStack>
          </Flex>
        </Card.Body>
      </Card.Root>
    </Box>
  );
}
