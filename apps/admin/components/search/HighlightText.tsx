import React from 'react';
import { Text, Box } from '@chakra-ui/react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
  as?: React.ElementType;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
}

/**
 * Highlights matching portions of text based on a search term.
 * Supports Hebrew text and case-insensitive matching.
 */
export default function HighlightText({
  text,
  searchTerm,
  as = 'span',
  fontSize,
  fontWeight,
  color,
}: HighlightTextProps) {
  if (!searchTerm || !text) {
    return (
      <Text as={as} fontSize={fontSize} fontWeight={fontWeight} color={color}>
        {text}
      </Text>
    );
  }

  // Escape special regex characters in search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create case-insensitive regex
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi');
  
  // Split text by the search term, keeping the matched portions
  const parts = text.split(regex);

  if (parts.length === 1) {
    // No match found
    return (
      <Text as={as} fontSize={fontSize} fontWeight={fontWeight} color={color}>
        {text}
      </Text>
    );
  }

  return (
    <Text as={as} fontSize={fontSize} fontWeight={fontWeight} color={color}>
      {parts.map((part, index) => {
        // Check if this part matches the search term (case-insensitive)
        const isMatch = part.toLowerCase() === searchTerm.toLowerCase();
        
        if (isMatch) {
          return (
            <Box
              as="span"
              key={index}
              bg="brand.100"
              color="brand.700"
              px="1"
              rounded="sm"
              _dark={{
                bg: 'brand.900/30',
                color: 'brand.300',
              }}
            >
              {part}
            </Box>
          );
        }
        
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </Text>
  );
}
