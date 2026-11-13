import React from 'react';
import { Box, Flex, HStack, Text, Button } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

interface SearchResultsSectionProps {
  title: string;
  icon: string;
  count: number;
  viewAllLink?: string;
  viewAllLabel?: string;
  children: React.ReactNode;
}

export default function SearchResultsSection({
  title,
  icon,
  count,
  viewAllLink,
  viewAllLabel,
  children,
}: SearchResultsSectionProps) {
  if (count === 0) {
    return null;
  }

  return (
    <Box as="section">
      <Flex alignItems="center" justifyContent="space-between" mb="4">
        <HStack gap="2">
          <Text
            as="span"
            className="material-symbols-outlined"
            fontSize="18px"
            color="brand.500"
          >
            {icon}
          </Text>
          <Text fontSize="xl" fontWeight="medium" color="fg">
            {title}
          </Text>
        </HStack>
        {viewAllLink && count > 0 && (
          <Link to={viewAllLink}>
            <Text
              fontSize="sm"
              color="brand.500"
              fontWeight="medium"
              _hover={{ textDecoration: 'underline' }}
            >
              {viewAllLabel || `צפה בכל ${count} התוצאות`}
            </Text>
          </Link>
        )}
      </Flex>
      {children}
    </Box>
  );
}
