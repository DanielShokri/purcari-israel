import React from 'react';
import { Box, Input, Text } from '@chakra-ui/react';

interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  width?: { base?: string; md?: string; lg?: string } | string;
}

export default function SearchInput({ 
  placeholder = 'חיפוש...', 
  value, 
  onChange,
  width = { base: 'full', md: '80' }
}: SearchInputProps) {
  return (
    <Box position="relative" w={width}>
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
        placeholder={placeholder}
        size="md"
        pr="10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
}
