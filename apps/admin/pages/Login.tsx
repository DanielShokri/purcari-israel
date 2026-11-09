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
} from '@chakra-ui/react';
import { ColorModeButton } from '../components/ui/color-mode';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { InputGroup, IconButton } from '@chakra-ui/react';

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
      >
        <Card.Body p="8">
          <VStack gap="8" align="stretch">
            {/* Header */}
            <VStack gap="4" textAlign="center">
              <Image 
                src={PURCARI_LOGO_URL} 
                alt="Purcari" 
                h="16" 
                objectFit="contain"
                mb="2"
              />
              <Heading size="2xl" color="fg">
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
              <VStack gap="5" align="stretch">
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
                  />
                  {errors.email && (
                    <Field.ErrorText>{errors.email.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root invalid={!!errors.password}>
                  <Field.Label fontSize="sm" fontWeight="medium" color="fg.muted">
                    סיסמה
                  </Field.Label>
                  <InputGroup endElement={
                    <IconButton
                      aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  }>
                    <Input
                      {...register('password', { required: 'שדה חובה' })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      dir="ltr"
                      size="lg"
                    />
                  </InputGroup>
                  {errors.password && (
                    <Field.ErrorText>{errors.password.message}</Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  loading={isLoading}
                  loadingText="מאמת הרשאות..."
                  colorPalette="blue"
                  size="lg"
                  w="full"
                  fontWeight="bold"
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
