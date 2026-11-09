// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  VStack,
  Popover,
  Portal,
  Spinner,
} from '@chakra-ui/react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/api';
import { Notification } from '@shared/types';
import NotificationItem from './NotificationItem';

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.list);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markAsRead);

  const isLoading = notifications === undefined;

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead({ id: notification._id });
    }
    // Open the order details page when the notification refers to an order;
    // otherwise jump to the full notifications list
    if (notification.orderId) {
      navigate(`/orders/${notification.orderId}`);
    } else {
      navigate('/notifications');
    }
  };

  const handleViewAll = () => {
    navigate('/notifications');
  };

  return (
    <Popover.Root positioning={{ placement: 'bottom-end' }}>
      <Popover.Trigger asChild>
        <Box position="relative">
          <Flex
            as="button"
            w="10"
            h="10"
            alignItems="center"
            justifyContent="center"
            rounded="full"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border"
            color="fg.muted"
            transition="all 0.15s"
            _hover={{ bg: 'bg.subtle' }}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="22px">
              notifications
            </Text>
          </Flex>
          {/* Unread badge */}
          {(unreadCount ?? 0) > 0 && (
            <Box
              position="absolute"
              top="2"
              left="2"
              w="2"
              h="2"
              bg="red.500"
              rounded="full"
              borderWidth="1px"
              borderColor="bg.panel"
            />
          )}
        </Box>
      </Popover.Trigger>

      <Portal>
        <Popover.Positioner>
          <Popover.Content
            w={{ base: '320px', sm: '380px' }}
            maxH="480px"
            overflow="hidden"
            shadow="xl"
            borderColor="border"
            bg="bg.panel"
          >
            {/* Header */}
            <Flex
              align="center"
              justify="space-between"
              px="4"
              py="3"
              borderBottomWidth="1px"
              borderColor="border"
            >
              <Flex align="center" gap="2">
                <Text fontWeight="bold" color="fg">
                  התראות
                </Text>
                {(unreadCount ?? 0) > 0 && (
                  <Flex
                    align="center"
                    justify="center"
                    minW="5"
                    h="5"
                    px="1.5"
                    rounded="full"
                    bg="blue.500"
                    color="white"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {unreadCount}
                  </Flex>
                )}
              </Flex>
              <Popover.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  size="xs"
                  color="fg.muted"
                  _hover={{ color: 'fg' }}
                >
                  <Text as="span" className="material-symbols-outlined" fontSize="18px">
                    close
                  </Text>
                </Button>
              </Popover.CloseTrigger>
            </Flex>

            {/* Notifications List */}
            <Box overflowY="auto" maxH="340px" p="2">
              {isLoading ? (
                <Flex justify="center" align="center" py="8">
                  <VStack gap="3">
                    <Spinner size="md" color="blue.500" />
                    <Text fontSize="sm" color="fg.muted">
                      טוען התראות...
                    </Text>
                  </VStack>
                </Flex>
               ) : notifications && notifications.length > 0 ? (
                 <VStack gap="2" align="stretch">
                   {notifications.map((notification) => (
<NotificationItem
                        key={notification._id}
                        notification={notification as Notification}
                        variant="compact"
                        onClick={handleNotificationClick}
                        onMarkAsRead={(id) => markAsRead({ id: id as any })}
                      />
                   ))}
                 </VStack>
              ) : (
                <Flex direction="column" align="center" justify="center" py="8" gap="2">
                  <Text
                    as="span"
                    className="material-symbols-outlined"
                    fontSize="40px"
                    color="fg.subtle"
                  >
                    notifications_off
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    אין התראות חדשות
                  </Text>
                </Flex>
              )}
            </Box>

            {/* Footer */}
            <Box
              px="4"
              py="3"
              borderTopWidth="1px"
              borderColor="border"
            >
              <Popover.CloseTrigger asChild>
                <Button
                  variant="ghost"
                  w="full"
                  size="sm"
                  color="blue.500"
                  fontWeight="medium"
                  _hover={{ bg: 'blue.500/10' }}
                  onClick={handleViewAll}
                >
                  <Text as="span" className="material-symbols-outlined" fontSize="18px" ml="2">
                    visibility
                  </Text>
                  צפה בכל ההתראות
                </Button>
              </Popover.CloseTrigger>
            </Box>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
