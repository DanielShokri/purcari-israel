import React, { useRef, useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Card,
  Input,
  IconButton,
  Image,
  Spinner,
} from '@chakra-ui/react';
import { useMutation } from 'convex/react';
import { api } from '@convex/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

interface FeaturedImageCardProps {
  imageUrl?: string;
  onImageUrlChange?: (url: string) => void;
}

export default function FeaturedImageCard({ imageUrl, onImageUrlChange }: FeaturedImageCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const recordUploadedImage = useMutation(api.media.recordUploadedImage);

  const hasImage = imageUrl && imageUrl.trim() !== '';

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'סוג הקובץ אינו נתמך. נתמכים: JPG, PNG, WebP, GIF, AVIF';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'הקובץ גדול מדי. התמונה חייבת להיות קטנה מ-5MB';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      // 1. Get a one-time upload URL (admin-only)
      const postUrl = await generateUploadUrl({});

      // 2. POST the raw file directly to Convex storage
      const res = await fetch(postUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!res.ok) {
        throw new Error(`העלאה נכשלה (${res.status})`);
      }
      const { storageId } = await res.json();

      // 3. Register the file and get its permanent URL
      const { url } = await recordUploadedImage({ storageId });

      onImageUrlChange?.(url);
    } catch (e) {
      console.error('Image upload failed:', e);
      setError(e instanceof Error ? e.message : 'העלאת התמונה נכשלה, נסו שוב');
    } finally {
      setIsUploading(false);
      // Reset the value so selecting the same file again fires onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) setIsDragOver(true);
  };

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
            תמונה ראשית
          </Heading>
          <Text as="span" className="material-symbols-outlined" fontSize="lg" color="fg.muted">
            image
          </Text>
        </Flex>
      </Card.Header>
      <Card.Body p="5">
        <VStack gap="4" align="stretch">
          {/* Drop zone / Image Preview */}
          <Box
            w="full"
            aspectRatio="16/9"
            rounded="lg"
            borderWidth="2px"
            borderStyle={hasImage && !isDragOver ? 'solid' : 'dashed'}
            borderColor={
              isDragOver
                ? 'blue.500'
                : error
                  ? 'red.500'
                  : 'border'
            }
            bg={isDragOver ? 'blue.500/5' : 'bg.subtle'}
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            position="relative"
            cursor={isUploading ? 'wait' : 'pointer'}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={() => setIsDragOver(false)}
            onClick={() => {
              if (!isUploading) fileInputRef.current?.click();
            }}
            role="button"
            aria-label={hasImage ? 'החלף תמונה ראשית' : 'בחר תמונה להעלאה'}
          >
            {isUploading ? (
              <VStack gap="3" p="4">
                <Spinner size="lg" color="blue.500" borderWidth="3px" />
                <Text fontSize="sm" color="fg.muted">מעלה תמונה...</Text>
              </VStack>
            ) : hasImage ? (
              isDragOver ? (
                <VStack gap="2" p="4" textAlign="center">
                  <Text as="span" className="material-symbols-outlined" fontSize="4xl" color="blue.500">
                    download
                  </Text>
                  <Text fontSize="sm" fontWeight="medium" color="blue.500">
                    שחררו להחלפת התמונה
                  </Text>
                </VStack>
              ) : (
                <>
                  <Image
                    src={imageUrl}
                    alt="תמונת מוצר"
                    objectFit="cover"
                    w="full"
                    h="full"
                    loading="lazy"
                  />
                  <IconButton
                    aria-label="הסר תמונה"
                    size="sm"
                    variant="solid"
                    colorPalette="red"
                    position="absolute"
                    top="2"
                    left="2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageUrlChange?.('');
                    }}
                  >
                    <Text as="span" className="material-symbols-outlined" fontSize="18px">
                      close
                    </Text>
                  </IconButton>
                </>
              )
            ) : (
              <VStack gap="2" p="4" textAlign="center" transition="all 0.15s">
                <Text
                  as="span"
                  className="material-symbols-outlined"
                  fontSize="4xl"
                  color={isDragOver ? 'blue.500' : 'fg.muted'}
                  mb="2"
                >
                  upload
                </Text>
                <Text fontSize="sm" fontWeight="medium" color="fg.muted">
                  {isDragOver ? 'שחררו כאן להעלאה' : 'לחצו לבחירת תמונה או גררו לכאן'}
                </Text>
                <Text fontSize="xs" color="fg.subtle">
                  JPG, PNG, WebP, GIF, AVIF — עד 5MB
                </Text>
              </VStack>
            )}
          </Box>

          {/* Hidden file input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            display="none"
            onChange={handleFileSelect}
          />

          {/* Error message */}
          {error && (
            <HStack gap="2" color="red.500" fontSize="sm">
              <Text as="span" className="material-symbols-outlined" fontSize="18px">
                error
              </Text>
              <Text>{error}</Text>
            </HStack>
          )}

          {/* Manual URL fallback */}
          <HStack gap="2">
            <Input
              size="sm"
              dir="ltr"
              textAlign="left"
              value={imageUrl || ''}
              onChange={(e) => onImageUrlChange?.(e.target.value)}
              placeholder="או הזינו כתובת URL ידנית: https://..."
              bg="bg.subtle"
              borderColor="border"
              _focus={{ ringColor: 'blue.500', borderColor: 'blue.500' }}
            />
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
}
