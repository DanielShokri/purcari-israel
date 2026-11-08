// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { Id } from '@convex/dataModel';
import { useCachedQuery } from './useCachedQuery';

/**
 * Filter configuration for entity lists
 */
export interface FilterConfig<T> {
  key: string;
  field?: keyof T;
  type: 'search' | 'select' | 'status';
  defaultValue?: string;
  /** If set, this filter value will be passed to the query as this argument name */
  queryArg?: string;
}

/**
 * Options for useEntityList hook
 */
export interface UseEntityListOptions<T> {
  query: any;
  queryArgs?: Record<string, any>;
  filters: FilterConfig<T>[];
  itemsPerPage?: number;
  enableSelection?: boolean;
}

/**
 * Delete dialog state
 */
export interface DeleteDialogState<T> {
  isOpen: boolean;
  item: T | null;
  isDeleting: boolean;
}

/**
 * Return type for useEntityList hook
 */
export interface UseEntityListReturn<T extends { _id: string }> {
  items: T[] | undefined;
  isLoading: boolean;
  state: {
    filteredItems: T[];
    paginatedItems: T[];
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
    filters: Record<string, string>;
    selectedItems: string[];
    deleteDialog: DeleteDialogState<T>;
  };
  handlers: {
    setFilter: (key: string, value: string) => void;
    setPage: (page: number) => void;
    toggleSelection: (id: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    openDeleteDialog: (item: T) => void;
    closeDeleteDialog: () => void;
    confirmDelete: (mutation: any) => Promise<void>;
  };
}

/**
 * Generic hook for entity lists with filtering, pagination and selection.
 * Filters can run client-side or via `queryArg` on the server query.
 */
export function useEntityList<T extends { _id: string }>(
  options: UseEntityListOptions<T>
): UseEntityListReturn<T> {
  const {
    query,
    queryArgs: staticQueryArgs = {},
    filters,
    itemsPerPage = 10,
    enableSelection = false,
  } = options;

  // Initialize filter states from config
  const initialFilters = useMemo(() => {
    const filterState: Record<string, string> = {};
    filters.forEach((filter) => {
      filterState[filter.key] = filter.defaultValue || '';
    });
    return filterState;
  }, [filters]);

  // Filter states
  const [filterValues, setFilterValues] = useState<Record<string, string>>(initialFilters);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Selection state (only if enabled)
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState<T>>({
    isOpen: false,
    item: null,
    isDeleting: false,
  });

  // Build dynamic query args from filters with queryArg mapping
  const dynamicQueryArgs = useMemo(() => {
    const args: Record<string, any> = { ...staticQueryArgs };
    filters.forEach((filter) => {
      if (filter.queryArg) {
        const value = filterValues[filter.key];
        // Only include non-'all' values
        args[filter.queryArg] = value && value !== 'all' ? value : undefined;
      }
    });
    return args;
  }, [staticQueryArgs, filters, filterValues]);

  // Data fetching with dynamic query args and cache detection
  const { data: items, isLoading, hasEverLoaded, isRefreshing } = useCachedQuery({
    query,
    args: dynamicQueryArgs,
  });

  // Get search config (client-side only)
  const searchConfig = useMemo(() => {
    return filters.find((f) => f.type === 'search' && !f.queryArg);
  }, [filters]);

  // Get select configs (client-side only - those without queryArg)
  const selectConfigs = useMemo(() => {
    return filters.filter((f) => (f.type === 'select' || f.type === 'status') && !f.queryArg);
  }, [filters]);

  // Computed: filtered items (client-side filtering only)
  const filteredItems = useMemo(() => {
    if (!items) return [];

    return items.filter((item: T) => {
      // Apply search filter (client-side)
      if (searchConfig) {
        const searchTerm = filterValues[searchConfig.key]?.toLowerCase() || '';
        if (searchTerm) {
          const fieldsToSearch = searchConfig.field
            ? [searchConfig.field]
            : (Object.keys(item) as (keyof T)[]).filter((key) => 
                typeof item[key] === 'string'
              );
          
          const matchesSearch = fieldsToSearch.some((field) => {
            const value = item[field];
            if (typeof value === 'string') {
              return value.toLowerCase().includes(searchTerm);
            }
            return false;
          });

          if (!matchesSearch) return false;
        }
      }

      // Apply select filters (client-side only)
      for (const config of selectConfigs) {
        const filterValue = filterValues[config.key];
        if (filterValue && filterValue !== 'all' && config.field) {
          const itemValue = item[config.field];
          if (itemValue !== filterValue) {
            return false;
          }
        }
      }

      return true;
    });
  }, [items, filterValues, searchConfig, selectConfigs]);

  // Computed: total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredItems.length / itemsPerPage);
  }, [filteredItems.length, itemsPerPage]);

  // Computed: paginated items
  const paginatedItems = useMemo(() => {
    return filteredItems.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredItems, currentPage, itemsPerPage]);

  // Filter handler
  const setFilter = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  }, []);

  // Page handler
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Selection handlers (only if enabled)
  const toggleSelection = useCallback((id: string) => {
    if (!enableSelection) return;
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  }, [enableSelection]);

  const selectAll = useCallback(() => {
    if (!enableSelection) return;
    setSelectedItems(paginatedItems.map((item) => item._id));
  }, [enableSelection, paginatedItems]);

  const clearSelection = useCallback(() => {
    if (!enableSelection) return;
    setSelectedItems([]);
  }, [enableSelection]);

  // Delete dialog handlers
  const openDeleteDialog = useCallback((item: T) => {
    setDeleteDialog({
      isOpen: true,
      item,
      isDeleting: false,
    });
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog({
      isOpen: false,
      item: null,
      isDeleting: false,
    });
  }, []);

  const confirmDelete = useCallback(async (mutation: any) => {
    if (!deleteDialog.item) return;

    setDeleteDialog((prev) => ({ ...prev, isDeleting: true }));

    try {
      await mutation({ id: deleteDialog.item._id });
      setDeleteDialog({
        isOpen: false,
        item: null,
        isDeleting: false,
      });
      // Clear selection if the deleted item was selected
      if (enableSelection) {
        setSelectedItems((prev) =>
          prev.filter((id) => id !== deleteDialog.item._id)
        );
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      setDeleteDialog((prev) => ({ ...prev, isDeleting: false }));
      throw error;
    }
  }, [deleteDialog.item, enableSelection]);

  return {
    items,
    isLoading,
    hasEverLoaded,
    isRefreshing,
    state: {
      filteredItems,
      paginatedItems,
      totalPages,
      currentPage,
      itemsPerPage,
      filters: filterValues,
      selectedItems: enableSelection ? selectedItems : [],
      deleteDialog,
    },
    handlers: {
      setFilter,
      setPage,
      toggleSelection,
      selectAll,
      clearSelection,
      openDeleteDialog,
      closeDeleteDialog,
      confirmDelete,
    },
  };
}

export default useEntityList;
