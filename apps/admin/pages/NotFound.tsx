import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Link,
} from '@chakra-ui/react';

// Custom SVG illustration for 404 page
const SadComputerIllustration = () => (
  <svg
    width="240"
    height="180"
    viewBox="0 0 240 180"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Monitor background */}
    <path
      d="M190 140H50C38.9543 140 30 131.046 30 120V60C30 48.9543 38.9543 40 50 40H190C201.046 40 210 48.9543 210 60V120C210 131.046 201.046 140 190 140Z"
      fill="currentColor"
      fillOpacity="0.1"
    />
    {/* Left eye (X) */}
    <path
      d="M70 70L90 90M90 70L70 90"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4"
    />
    {/* Right eye (X) */}
    <path
      d="M150 70L170 90M170 70L150 90"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4"
    />
    {/* Sad mouth */}
    <path
      d="M80 120C80 120 100 100 120 100C140 100 160 120 160 120"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="4"
    />
    {/* Connection cable (broken) */}
    <path
      d="M120 140V160M110 160H130"
      stroke="#3B82F6"
      strokeLinecap="round"
      strokeWidth="3"
    />
    <path
      d="M115 170L105 175M125 170L135 175"
      stroke="#3B82F6"
      strokeLinecap="round"
      strokeWidth="2"
    />
  </svg>
);

export default function NotFound() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate('/');
  };

  return (
    <Flex
      flex="1"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p="8"
      minH="full"
    >
      <VStack
        w="full"
        maxW="2xl"
        textAlign="center"
        gap="0"
        css={{
          animation: 'fadeIn 0.5s ease-out',
          '@keyframes fadeIn': {
            from: { opacity: 0, transform: 'scale(0.95)' },
            to: { opacity: 1, transform: 'scale(1)' },
          },
        }}
      >
        {/* Illustration Section */}
        <Box position="relative" mb="8">
          {/* Main illustration card */}
          <Box
            position="relative"
            bg="bg.panel"
            p="2"
            rounded="2xl"
            shadow="sm"
            borderWidth="1px"
            borderColor="border"
          >
            <Flex
              w="full"
              maxW="420px"
              aspectRatio="video"
              rounded="xl"
              overflow="hidden"
              bg="bg"
              alignItems="center"
              justifyContent="center"
              position="relative"
              color="gray.300"
              _dark={{ color: 'gray.600' }}
            >
              {/* SVG Illustration */}
              <SadComputerIllustration />

              {/* Large 404 overlay */}
              <Text
                position="absolute"
                fontSize="120px"
                fontWeight="black"
                color="brand.500"
                opacity={0.1}
                userSelect="none"
                pointerEvents="none"
              >
                404
              </Text>
            </Flex>
          </Box>
        </Box>

        {/* Text Content */}
        <VStack gap="4" maxW="lg" zIndex={1}>
          <Heading
            size="3xl"
            color="fg"
          >
            הדף שחיפשת לא קיים
          </Heading>
          <Text
            color="fg.muted"
            fontSize="lg"
            lineHeight="relaxed"
          >
            נראה שהגעת למקום הלא נכון. ייתכן שהקישור שבור או שהדף הוסר מהמערכת.
          </Text>
        </VStack>

        {/* Action Button */}
        <Box mt="10">
          <Button
            onClick={handleGoBack}
            colorPalette="brand"
            size="lg"
            fontWeight="medium"
            py="3"
            px="8"
            rounded="lg"
            shadow="lg"
            transition="colors 0.15s ease-out"
            css={{
              boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2)',
              '&:hover': {
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            <Text
              as="span"
              className="material-symbols-outlined"
              fontSize="18px"
              transition="transform 0.2s"
              css={{ '.group:hover &': { transform: 'translateX(4px)' } }}
            >
              arrow_forward
            </Text>
            <Text as="span">חזרה ללוח הבקרה</Text>
          </Button>
        </Box>

        {/* Helpful Links */}
        <HStack
          mt="12"
          gap="6"
          fontSize="sm"
          color="fg.muted"
          borderTopWidth="1px"
          borderColor="border"
          pt="8"
          flexWrap="wrap"
          justify="center"
        >
          <Text display={{ base: 'none', sm: 'inline' }}>קישורים שימושיים:</Text>
          <Link
            asChild
            color="fg.muted"
            _hover={{ color: 'brand.500' }}
            transition="colors 0.2s"
          >
            <RouterLink to="/">
              עמוד הבית
            </RouterLink>
          </Link>
          <Box w="1" h="1" bg="gray.300" rounded="full" _dark={{ bg: 'gray.600' }} />
          <Link
            asChild
            color="fg.muted"
            _hover={{ color: 'brand.500' }}
            transition="colors 0.2s"
          >
            <RouterLink to="/settings">
              מרכז עזרה
            </RouterLink>
          </Link>
          <Box w="1" h="1" bg="gray.300" rounded="full" _dark={{ bg: 'gray.600' }} />
          <Link
            asChild
            color="fg.muted"
            _hover={{ color: 'brand.500' }}
            transition="colors 0.2s"
          >
            <RouterLink to="/settings">
              דיווח על תקלה
            </RouterLink>
          </Link>
        </HStack>
      </VStack>
    </Flex>
  );
}
