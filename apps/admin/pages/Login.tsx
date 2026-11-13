import React from 'react';
import { useForm } from 'react-hook-form';
import { useAdminAuth } from '../hooks/useAdminAuth';
import {
  Flex,
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  Card,
  Alert,
  Field,
  Image,
  InputGroup,
} from '@chakra-ui/react';
import { ColorModeButton } from '../components/ui/color-mode';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PURCARI_LOGO_URL = 'https://cdn.8wines.com/media/amasty/shopby/option_images/purcari-winery-logo.png';

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { signIn, isLoading, error: authError, isAuthenticated, isAdmin } = useAdminAuth();
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    await signIn(data);
    // No navigation -- App.tsx will route based on auth state
  };

  // Show access denied error if authenticated user is not admin
  const showAccessDenied = isAuthenticated && !isAdmin;

  return (
    <Flex
      minH="100vh"
      bg="bg.subtle"
      alignItems="center"
      justifyContent="center"
      p="4"
      position="relative"
    >
      {/* Dark Mode Toggle */}
      <Box position="absolute" top="4" left="4">
        <ColorModeButton />
      </Box>

      <Card.Root
        w="full"
        maxW="md"
        shadow="xl"
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="lg"
      >
        <Card.Body p="8">
          <VStack gap="8" align="stretch">
            {/* Header */}
            <VStack gap="4" textAlign="center">
              <Image
                src={PURCARI_LOGO_URL}
                alt="Purcari"
                h="20"
                objectFit="contain"
                mb="4"
              />
              <Heading size={{ base: 'xl', md: '2xl' }} color="fg">
                כניסה למערכת
              </Heading>
              <Text color="fg.muted">
                הזן את פרטי ההתחברות שלך
              </Text>
            </VStack>

            {/* Error Alerts */}
            {(authError || showAccessDenied) && (
              <Alert.Root status="error" variant="subtle" rounded="lg">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Description fontSize="sm" textAlign="center">
                    {showAccessDenied ? "גישה נדחתה - מערכת ניהול למנהלים בלבד" : authError}
                  </Alert.Description>
                </Alert.Content>
              </Alert.Root>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <VStack gap="6" align="stretch" px="2">
                <Field.Root invalid={!!errors.email}>
                  <Field.Label fontSize="sm" fontWeight="medium" color="fg.muted">
                    אימייל
                  </Field.Label>
                  <Input
                    {...register('email', { required: 'שדה חובה' })}
                    type="email"
                    placeholder="your@email.com"
                    dir="ltr"
                    size="lg"
                    px="4"
                  />
                  {errors.email && (
                    <Text fontSize="xs" color="red.400" textAlign="center">
                      {errors.email.message}
                    </Text>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Field.Label fontSize="sm" fontWeight="medium" color="fg.muted">
                    סיסמה
                  </Field.Label>
                  <InputGroup endElement={
                    <Box
                      onClick={() => setShowPassword((s) => !s)}
                      cursor="pointer"
                      userSelect="none"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </Box>
                  }>
                    <Input
                      {...register('password', { required: 'שדה חובה' })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      dir="ltr"
                      size="lg"
                      px="4"
                    />
                  </InputGroup>
                  {errors.password && (
                    <Text fontSize="xs" color="red.400" textAlign="center">
                      {errors.password.message}
                    </Text>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  loading={isLoading}
                  loadingText="מאמת הרשאות..."
                  colorPalette="brand"
                  size="lg"
                  w="full"
                  fontWeight="medium"
                  shadow="lg"
                  css={{ boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)' }}
                >
                  התחבר
                </Button>
              </VStack>
            </form>

            {/* Footer */}
            <Text fontSize="xs" color="fg.subtle" textAlign="center">
              מערכת ניהול - גישה למנהלים בלבד
            </Text>
          </VStack>
        </Card.Body>
      </Card.Root>
    </Flex>
  );
}