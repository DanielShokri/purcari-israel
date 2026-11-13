import React from 'react';
import { Box, Table, Checkbox, Card, HStack, Text, IconButton } from '@chakra-ui/react';
import { SystemAnnouncement } from '@shared/types';
import { Pagination, StatusBadge, announcementStatusConfig, announcementTypeConfig } from '../shared';

interface AnnouncementsTableProps {
  announcements: SystemAnnouncement[];
  selectedAnnouncements: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectAnnouncement: (announcementId: string, checked: boolean) => void;
  onEdit: (announcementId: string) => void;
  onDelete: (announcementId: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

function AnnouncementTableRow({
  announcement,
  isSelected,
  onSelect,
  onEdit,
  onDelete
}: {
  announcement: SystemAnnouncement;
  isSelected: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('he-IL');
  };

  const truncateText = (text: string, maxLength: number = 50): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <Table.Row
      _hover={{ bg: 'bg.subtle' }}
      transition="colors"
      css={{
        '& .action-buttons': { opacity: 0 },
        '&:hover .action-buttons': { opacity: 1 },
      }}
    >
      <Table.Cell px="6" py="4">
        <Checkbox.Root
          size="sm"
          checked={isSelected}
          onCheckedChange={(e) => onSelect(!!e.checked)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <StatusBadge 
          status={announcement.status} 
          config={announcementStatusConfig}
        />
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <Text
          fontSize="sm"
          fontWeight="semibold"
          color="fg"
          _hover={{ color: 'brand.500' }}
          cursor="pointer"
          transition="colors"
          onClick={onEdit}
        >
          {announcement.title}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <Text fontSize="sm" color="fg">
          {truncateText(announcement.message)}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <StatusBadge 
          status={announcement.type} 
          config={announcementTypeConfig}
        />
      </Table.Cell>
      <Table.Cell px="6" py="4" dir="ltr">
        <Text fontSize="sm" color="fg">
          {formatDate(announcement.startDate)}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4" dir="ltr">
        <Text fontSize="sm" color="fg">
          {formatDate(announcement.endDate)}
        </Text>
      </Table.Cell>
      <Table.Cell px="6" py="4">
        <HStack gap="1" className="action-buttons" transition="opacity" justify="flex-end">
          <IconButton
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: 'gray.100', color: 'brand.500' }}
            aria-label="ערוך"
            onClick={onEdit}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              edit
            </Text>
          </IconButton>
          <IconButton
            variant="ghost"
            size="sm"
            color="fg.muted"
            _hover={{ bg: 'gray.100', color: 'red.500' }}
            aria-label="מחק"
            onClick={onDelete}
          >
            <Text as="span" className="material-symbols-outlined" fontSize="18px">
              delete
            </Text>
          </IconButton>
        </HStack>
      </Table.Cell>
    </Table.Row>
  );
}

export default function AnnouncementsTable({
  announcements,
  selectedAnnouncements,
  onSelectAll,
  onSelectAnnouncement,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange
}: AnnouncementsTableProps) {
  return (
    <Box flex="1" minH="0">
      <Card.Root overflow="hidden" h="full" display="flex" flexDirection="column">
        <Table.ScrollArea flex="1">
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row bg="bg.subtle">
                <Table.ColumnHeader px="6" py="4" w="12">
                  <Checkbox.Root
                    size="sm"
                    checked={selectedAnnouncements.length === announcements.length && announcements.length > 0}
                    onCheckedChange={(e) => onSelectAll(!!e.checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  סטטוס
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  כותרת
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  הודעה
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  סוג
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  תאריך התחלה
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted">
                  תאריך סיום
                </Table.ColumnHeader>
                <Table.ColumnHeader px="6" py="4" fontSize="xs" fontWeight="semibold" color="fg.muted" textAlign="start">
                  פעולות
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {announcements.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={8} px="6" py="8" textAlign="center" color="fg.subtle">
                    לא נמצאו הודעות מערכת
                  </Table.Cell>
                </Table.Row>
              ) : (
                announcements.map((announcement) => (
                  <AnnouncementTableRow
                    key={announcement._id}
                    announcement={announcement}
                    isSelected={selectedAnnouncements.includes(announcement._id)}
                    onSelect={(checked) => onSelectAnnouncement(announcement._id, checked)}
                    onEdit={() => onEdit(announcement._id)}
                    onDelete={() => onDelete(announcement._id)}
                  />
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
          onPageChange={onPageChange}
          itemLabel="הודעות"
        />
      </Card.Root>
    </Box>
  );
}
