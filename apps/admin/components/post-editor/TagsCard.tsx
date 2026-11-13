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
  Badge,
  IconButton,
} from '@chakra-ui/react';

interface TagsCardProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export default function TagsCard({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag
}: TagsCardProps) {
  return (
    <Card.Root>
      <Card.Header
        px="5"
        py="4"
        borderBottomWidth="1px"
        borderColor="border"
      >
        <Flex justify="space-between" alignItems="center">
          <Heading size="md" color="fg">
            תגיות
          </Heading>
          <Text as="span" className="material-symbols-outlined" fontSize="18px" color="fg.muted">
            label
          </Text>
        </Flex>
      </Card.Header>
      <Card.Body p="5">
        <VStack gap="3" align="stretch">
          <Box position="relative">
            <Text as="span" className="material-symbols-outlined" position="absolute" left="2.5" top="2.5" color="fg.subtle" fontSize="18px">
              add
            </Text>
            <Input
              placeholder="הקלד ואז אנטר להוספה..."
              size="sm"
              pl="8"
              bg="bg.subtle"
              borderColor="border"
              value={tagInput}
              onChange={(e) => onTagInputChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddTag();
                }
              }}
              _focus={{ ringColor: 'brand.500', borderColor: 'brand.500' }}
            />
          </Box>
          <HStack gap="2" flexWrap="wrap">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="subtle"
                fontSize="xs"
                fontWeight="medium"
                px="2.5"
                py="1"
                rounded="full"
                display="flex"
                alignItems="center"
                gap="1"
                cursor="pointer"
                _hover={{ bg: 'gray.200' }}
                transition="colors"
              >
                {tag}
                <IconButton
                  variant="ghost"
                  size="xs"
                  onClick={() => onRemoveTag(tag)}
                  _hover={{ color: 'red.500' }}
                  aria-label="הסר תגית"
                >
                  <Text as="span" className="material-symbols-outlined" fontSize="18px">
                    close
                  </Text>
                </IconButton>
              </Badge>
            ))}
          </HStack>
          <Text fontSize="xs" color="fg.muted">
            הפרד תגיות באמצעות פסיק.
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
