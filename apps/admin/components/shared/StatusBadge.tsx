import React from 'react';
import { HStack, Box, Text, Badge } from '@chakra-ui/react';

type BadgeVariant = 'dot' | 'simple';

interface StatusConfig {
  colorPalette: string;
  label: string;
  showDot?: boolean;
}

interface StatusBadgeProps {
  status: string;
  config: Record<string, StatusConfig>;
  variant?: BadgeVariant;
}

export default function StatusBadge({ status, config, variant = 'simple' }: StatusBadgeProps) {
  const statusConfig = config[status] || { colorPalette: 'gray', label: status };
  
  if (variant === 'dot') {
    return (
      <HStack
        gap="1.5"
        px="2.5"
        py="1"
        rounded="full"
        fontSize="xs"
        fontWeight="medium"
        bg={`${statusConfig.colorPalette}.500/10`}
        color={`${statusConfig.colorPalette}.500`}
      >
        <Box w="1.5" h="1.5" rounded="full" bg={`${statusConfig.colorPalette}.500`} />
        <Text>{statusConfig.label}</Text>
      </HStack>
    );
  }

  return (
    <Badge
      colorPalette={statusConfig.colorPalette}
      variant="subtle"
      px="2.5"
      py="0.5"
      rounded="full"
      fontSize="xs"
      fontWeight="medium"
    >
      {statusConfig.showDot && (
        <HStack gap="1">
          <Box w="1.5" h="1.5" rounded="full" bg={`${statusConfig.colorPalette}.500`} />
          <Text as="span">{statusConfig.label}</Text>
        </HStack>
      )}
      {!statusConfig.showDot && statusConfig.label}
    </Badge>
  );
}

// Pre-configured status badges for common use cases.
// Hue carries meaning only: green = live/good, red = error/cancelled,
// yellow = needs attention, gray = neutral state. Categories use gray.
export const productStatusConfig: Record<string, StatusConfig> = {
  published: { colorPalette: 'green', label: 'פורסם' },
  draft: { colorPalette: 'gray', label: 'טיוטה' },
  archived: { colorPalette: 'gray', label: 'ממתין' },
};

export const categoryStatusConfig: Record<string, StatusConfig> = {
  active: { colorPalette: 'green', label: 'פעיל' },
  hidden: { colorPalette: 'gray', label: 'מוסתר' },
  draft: { colorPalette: 'gray', label: 'טיוטה' },
};

export const userStatusConfig: Record<string, StatusConfig> = {
  active: { colorPalette: 'green', label: 'פעיל', showDot: true },
  suspended: { colorPalette: 'red', label: 'מושהה' },
  inactive: { colorPalette: 'gray', label: 'לא פעיל' },
};

export const userRoleConfig: Record<string, StatusConfig> = {
  admin: { colorPalette: 'gray', label: 'מנהל' },
  editor: { colorPalette: 'gray', label: 'עורך' },
  viewer: { colorPalette: 'gray', label: 'צופה' },
};

export const orderStatusConfig: Record<string, StatusConfig> = {
  completed: { colorPalette: 'green', label: 'הושלם' },
  processing: { colorPalette: 'gray', label: 'בטיפול', showDot: true },
  pending: { colorPalette: 'yellow', label: 'ממתין' },
  cancelled: { colorPalette: 'red', label: 'בוטל' },
};

export const couponStatusConfig: Record<string, StatusConfig> = {
  active: { colorPalette: 'green', label: 'פעיל', showDot: true },
  paused: { colorPalette: 'gray', label: 'מושהה' },
  expired: { colorPalette: 'red', label: 'פג תוקף' },
  scheduled: { colorPalette: 'gray', label: 'מתוזמן' },
};

export const couponDiscountTypeConfig: Record<string, StatusConfig> = {
  percentage: { colorPalette: 'gray', label: 'אחוז הנחה' },
  fixed_amount: { colorPalette: 'gray', label: 'סכום קבוע' },
  free_shipping: { colorPalette: 'gray', label: 'משלוח חינם' },
  free_product: { colorPalette: 'gray', label: 'מוצר חינם' },
  buy_x_get_y: { colorPalette: 'gray', label: 'קנה X קבל Y' },
};

export const cartRuleStatusConfig: Record<string, StatusConfig> = {
  active: { colorPalette: 'green', label: 'פעיל', showDot: true },
  paused: { colorPalette: 'gray', label: 'מושהה', showDot: true },
};

export const cartRuleTypeConfig: Record<string, StatusConfig> = {
  shipping: { colorPalette: 'gray', label: 'משלוח' },
  discount: { colorPalette: 'gray', label: 'הנחה' },
  restriction: { colorPalette: 'gray', label: 'הגבלות' },
  benefit: { colorPalette: 'gray', label: 'הטבה' },
};

export const announcementStatusConfig: Record<string, StatusConfig> = {
  active: { colorPalette: 'green', label: 'פעיל', showDot: true },
  scheduled: { colorPalette: 'gray', label: 'מתוזמן' },
  expired: { colorPalette: 'gray', label: 'פג תוקף' },
  draft: { colorPalette: 'gray', label: 'טיוטה' },
};

export const announcementTypeConfig: Record<string, StatusConfig> = {
  info: { colorPalette: 'blue', label: 'מידע' },
  warning: { colorPalette: 'amber', label: 'אזהרה' },
  success: { colorPalette: 'green', label: 'הצלחה' },
  error: { colorPalette: 'red', label: 'שגיאה' },
  maintenance: { colorPalette: 'orange', label: 'תחזוקה' },
};
