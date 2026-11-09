import React from 'react';
import { Box, Flex, Text, IconButton } from '@chakra-ui/react';
import { Notification, NotificationType } from '@shared/types';

// Helper to format relative time in Hebrew
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60 * 1000) return 'עכשיו';

  // Show the exact date and time for anything older than a minute
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// Get icon and colors based on notification type
function getNotificationStyle(type: NotificationType) {
  switch (type) {
    case NotificationType.SUCCESS:
      return {
        icon: 'check_circle',
        iconBg: 'green.100',
        iconBgDark: 'green.900/30',
        iconColor: 'green.600',
        iconColorDark: 'green.400',
      };
    case NotificationType.INFO:
      return {
        icon: 'info',
        iconBg: 'blue.100',
        iconBgDark: 'blue.900/30',
        iconColor: 'blue.600',
        iconColorDark: 'blue.400',
      };
    case NotificationType.WARNING:
      return {
        icon: 'warning',
        iconBg: 'amber.100',
        iconBgDark: 'amber.900/30',
        iconColor: 'amber.600',
        iconColorDark: 'amber.500',
      };
    case NotificationType.ERROR:
      return {
        icon: 'error',
        iconBg: 'red.100',
        iconBgDark: 'red.900/30',
        iconColor: 'red.600',
        iconColorDark: 'red.400',
      };
    case NotificationType.ORDER:
      return {
        icon: 'shopping_cart',
        iconBg: 'purple.100',
        iconBgDark: 'purple.900/30',
        iconColor: 'purple.600',
        iconColorDark: 'purple.400',
      };
    case NotificationType.INVENTORY:
      return {
        icon: 'warehouse',
        iconBg: 'cyan.100',
        iconBgDark: 'cyan.900/30',
        iconColor: 'cyan.600',
        iconColorDark: 'cyan.400',
      };
    case NotificationType.USER_ACTION:
      return {
        icon: 'person_add',
        iconBg: 'indigo.100',
        iconBgDark: 'indigo.900/30',
        iconColor: 'indigo.600',
        iconColorDark: 'indigo.400',
      };
    case NotificationType.PAYMENT:
      return {
        icon: 'payment',
        iconBg: 'emerald.100',
        iconBgDark: 'emerald.900/30',
        iconColor: 'emerald.600',
        iconColorDark: 'emerald.400',
      };
    case NotificationType.PROMOTION:
      return {
        icon: 'sell',
        iconBg: 'yellow.100',
        iconBgDark: 'yellow.900/30',
        iconColor: 'yellow.600',
        iconColorDark: 'yellow.500',
      };
    case NotificationType.PRICE_CHANGE:
      return {
        icon: 'trending_up',
        iconBg: 'lime.100',
        iconBgDark: 'lime.900/30',
        iconColor: 'lime.600',
        iconColorDark: 'lime.400',
      };
    case NotificationType.SYSTEM_ERROR:
      return {
        icon: 'bug_report',
        iconBg: 'rose.100',
        iconBgDark: 'rose.900/30',
        iconColor: 'rose.600',
        iconColorDark: 'rose.400',
      };
    case NotificationType.SYSTEM:
    default:
      return {
        icon: 'description',
        iconBg: 'gray.100',
        iconBgDark: 'gray.800',
        iconColor: 'gray.600',
        iconColorDark: 'gray.400',
      };
  }
}

interface NotificationItemProps {
  notification: Notification;
  variant?: 'default' | 'compact';
  onMarkAsRead?: (id: string) => void;
  onClick?: (notification: Notification) => void;
}

export default function NotificationItem({
  notification,
  variant = 'default',
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const style = getNotificationStyle(notification.type as NotificationType);
  const iconName = notification.icon || style.icon;
  const isCompact = variant === 'compact';

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
  };

  return (
    <Flex
      position="relative"
      direction={{ base: 'column', sm: 'row' }}
      align={{ base: 'stretch', sm: 'center' }}
      gap={isCompact ? '3' : '4'}
      bg="bg.panel"
      p={isCompact ? '3' : '4'}
      rounded="xl"
      shadow={notification.isRead ? 'none' : 'sm'}
      borderWidth="1px"
      borderColor={notification.isRead ? 'transparent' : 'blue.500/20'}
      transition="all 0.2s"
      cursor="pointer"
      onClick={handleClick}
      _hover={{
        borderColor: 'blue.500/30',
        shadow: 'md',
      }}
    >
      {/* Unread indicator background */}
      {!notification.isRead && (
        <Box
          position="absolute"
          inset="0"
          bg="blue.500/5"
          rounded="xl"
          pointerEvents="none"
        />
      )}

      <Flex align="start" gap={isCompact ? '3' : '4'} flex="1" position="relative" zIndex="1">
        {/* Icon */}
        <Flex
          align="center"
          justify="center"
          rounded="full"
          flexShrink={0}
          w={isCompact ? '10' : '12'}
          h={isCompact ? '10' : '12'}
          bg={style.iconBg}
          color={style.iconColor}
          _dark={{
            bg: style.iconBgDark,
            color: style.iconColorDark,
          }}
        >
          <Text as="span" className="material-symbols-outlined" fontSize={isCompact ? '20px' : '24px'}>
            {iconName}
          </Text>
        </Flex>

        {/* Content */}
        <Flex direction="column" flex="1" justify="center" gap="1">
          <Flex justify="space-between" align="start">
            <Text
              color="fg"
              fontSize={isCompact ? 'sm' : 'md'}
              fontWeight={notification.isRead ? 'medium' : 'bold'}
              lineHeight="tight"
            >
              {notification.title}
            </Text>
            {/* Mobile unread badge */}
            {!notification.isRead && (
              <Text
                display={{ base: 'block', sm: 'none' }}
                fontSize="xs"
                fontWeight="medium"
                color="blue.600"
                bg="blue.500/10"
                px="2"
                py="0.5"
                rounded="full"
                whiteSpace="nowrap"
              >
                חדש
              </Text>
            )}
          </Flex>
          <Text
            color={notification.isRead ? 'fg.muted' : 'fg.muted'}
            fontSize={isCompact ? 'xs' : 'sm'}
            fontWeight="normal"
            lineHeight="relaxed"
          >
            {notification.message}
          </Text>
          <Text color="fg.subtle" fontSize="xs" mt={isCompact ? '0' : '1'}>
            {formatRelativeTime(notification.createdAt)}
          </Text>
        </Flex>
      </Flex>

      {/* Actions / Unread Dot */}
      <Flex align="center" gap="3" flexShrink={0} position="relative" zIndex="1" pr="2">
        {/* Unread indicator dot - desktop only */}
        {!notification.isRead && (
          <Box
            display={{ base: 'none', sm: 'flex' }}
            w="3"
            h="3"
            rounded="full"
            bg="blue.500"
            shadow="sm"
            ring="4px"
            ringColor="bg.panel"
          />
        )}
        {!isCompact && (
          <IconButton
            aria-label="אפשרויות"
            variant="ghost"
            size="sm"
            color="fg.subtle"
            _hover={{ color: 'fg.muted', bg: 'bg.subtle' }}
            onClick={(e) => {
              e.stopPropagation();
              // Options menu can be added here
            }}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="20px">
              more_vert
            </Text>
          </IconButton>
        )}
      </Flex>
    </Flex>
  );
}
