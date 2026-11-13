// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import { useNavigate } from 'react-router-dom';
import { VStack, HStack, Button, Text } from '@chakra-ui/react';
import { LoadingState, Breadcrumbs, DeleteConfirmationDialog } from '../components/shared';
import { OrdersFilterToolbar, OrderStatusChips, OrdersTable } from '../components/orders';
import { useOrders } from '../hooks/useOrders';

export default function Orders() {
  const navigate = useNavigate();
  const { orders, isLoading, hasEverLoaded, state, handlers } = useOrders();
  const { paginatedOrders, selectedOrders, statusCounts, deleteDialog, filters, pagination } = state;
  const { currentPage, totalPages, ordersPerPage } = pagination;
  const { setActiveChip, setSearchTerm, setStatusFilter, setDateFilter, setCurrentPage, toggleOrderSelection, selectAllOrders, openDeleteDialog, closeDeleteDialog, confirmDelete } = handlers;
  const handleView = (orderId: string) => navigate(`/orders/${orderId}`);
  const handleEdit = (orderId: string) => navigate(`/orders/${orderId}`);

  // Only show spinner on first load (cold cache), not on return visits
  if (isLoading && !hasEverLoaded) return <LoadingState message="טוען הזמנות..." />;

  return (
    <VStack gap="0" align="stretch" h="full">
      <Breadcrumbs items={[{ label: 'בית', href: '#/' }, { label: 'הזמנות' }]} />
      <VStack align="stretch" gap="4" py="8">
        <HStack justify="space-between" align="start" flexWrap="wrap" gap="4">
          <VStack align="start" gap="1">
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight="medium" color="fg">הזמנות</Text>
            <Text color="fg.muted" fontSize="sm">נהל את כל ההזמנות והסטטוסים במקום אחד</Text>
          </VStack>
          <HStack gap="3">
            <Button variant="outline" size="md" borderColor="border" _hover={{ bg: 'bg.subtle' }}>
              <Text as="span" className="material-symbols-outlined" fontSize="18px">download</Text>
              <Text as="span">ייצוא דוח</Text>
            </Button>
          </HStack>
        </HStack>
      </VStack>
      <OrdersFilterToolbar searchTerm={filters.searchTerm} onSearchChange={setSearchTerm} statusFilter={filters.statusFilter} onStatusFilterChange={setStatusFilter} dateFilter={filters.dateFilter} onDateFilterChange={setDateFilter} />
      <OrderStatusChips activeChip={filters.activeChip} onChipChange={setActiveChip} statusCounts={statusCounts} totalCount={orders?.length || 0} />
      <OrdersTable orders={paginatedOrders} selectedOrders={selectedOrders} onSelectAll={selectAllOrders} onSelectOrder={toggleOrderSelection} onView={handleView} onEdit={handleEdit} onDelete={openDeleteDialog} currentPage={currentPage} totalPages={totalPages} totalItems={state.filteredOrders.length} itemsPerPage={ordersPerPage} onPageChange={setCurrentPage} />
      <DeleteConfirmationDialog isOpen={deleteDialog.isOpen} onClose={closeDeleteDialog} onConfirm={confirmDelete} title="ביטול הזמנה" message="האם אתה בטוח שברצונך לבטל הזמנה זו?" isDeleting={deleteDialog.isCancelling} />
    </VStack>
  );
}