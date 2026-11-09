// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@convex/api';
import { VStack } from '@chakra-ui/react';
import { LoadingState, PageHeader, DeleteConfirmationDialog } from '../components/shared';
import { ProductsFilterToolbar, ProductsTable } from '../components/products';
import { useEntityList } from '../hooks/useEntityList';
import { Product } from '@shared/types';

const productImages = ['https://lh3.googleusercontent.com/aida-public/AB6AXuA6yEFtBfCi6R-A-lM2s3rZAbfh-E1ZRqy3GQrA4VjjLpKFeHSdjz3rh2S_8JHe_JgMP3IbomRXYD8Ij8xqjUqhLMvaaYYFeVMuQ1hgwqFKr286N6OJ7Q6Gl6Sb3r5IBHJoZY5dVwrx6DV5E-Tn9WYsFcE14kQuJq_eW2oa_ylzbSprigxwXuGvE7OINLFn4q9QUnoLYn6Ie8Q2thNMMWU_-YtT88cF-ywCslkC8WoY1l460-fnKHhXITurvZBx5WlDi0t6Q-sWsg','https://lh3.googleusercontent.com/aida-public/AB6AXuBLQTiVirMdFO6Y3FL4kFi4w946KPqmC1Z-RfPKa-VI5ODxNqR80seXB9QHzsUwLMMniSWydWr5_d1XAxZO-yImHxBUgXhlS3TNNZ73YV0RIAfKPmwmItiQC1nYzMLs0L1_jkuW7zXOkN4i_a1ZBYpAE9qyGtQWC29mBgkjysy70Ase25CZ_T8u-fWj7EoXhXxPG5M8GSR6FIWBrlxUYQAqK5VheNhViOdKxTWb4E6Z7ZRESZKMls5u0luft54EHvqj8q3SyZkMdA','https://lh3.googleusercontent.com/aida-public/AB6AXuAzlo10Nq6-hELrI-Kiv1Fv4RRqwGI_Ov9S-2vtXpJ4IFj4Un2hUwZ3W0aLW6ZIiaSFE5w_3De3Jol3YG6XI9_S3NmrlhpgvgvySlF6dpoashzc1XTWay2pPZMRo-FEvOfcH3bi-Iae3noHitVgfsar8-PCEgXaw41gfpFOQkgGZeZUX7SDlDtFqySVGENw7yKBv48D8pOR4DsLCDqO1Wkg3MCWjuTX4b-xwHfuEHU4P95JMOEFPbwKnvv_ChqmdcaRYGsgUdSAgA','https://lh3.googleusercontent.com/aida-public/AB6AXuAXSM94jp3rYNUvmGTNi_jD4pB-FLQ1lg9f0THA4YkzA_DG-MKIBnFP8SyuhhSekru7ErOs5KvDtC3Bl_NPAwW92MiOFPW0WXyUPeQ6vwqApJNQtH5tEPAoo38x9jm_8dyeV7UyuvZbsblBdOh8mdsQVN_2h4D_SpGXMnsIIoy8QqhCLlkEaZxo_d5_cM-tDMWUuKnjpq8kysSH90qfs9YhU_nBSVDTX7riUR-m9xG24HT1DuFhmlKyggnJSGRNdwzWlZl32LBMFQ','https://lh3.googleusercontent.com/aida-public/AB6AXuClJjWbcXEQCsicgRXJpssjEfrfl6ij503ghWJb6B5e9e5GpEchfrSHslsSzIKDnwEQ52nvlYwdvQ2axU_Hjocbsps5powZLQpjbHXh0aLexU8UDnSdUcY0R0cZrzHAYd3Ly-0XifNvR-7k0tUp71N7HfXMj-tbf1M6BLRuWzS0qSKex4gbnxZS4Q8BjqYsEJo9HCJcVlZfTDi0JOe2i3tpgnX__6IZeSt21BYf4hgiBgTR5u2tcFVfY1TBxd7B4KARfD_t7FiCXw'];

export default function Products() {
  const navigate = useNavigate();
  const deleteMutation = useMutation(api.products.remove);

  // Real categories for labels (products store category as document ID)
  const categoriesData = useQuery(api.categories.list, { includeInactive: true });

  const categoryById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of categoriesData || []) {
      map[c._id] = c.nameHe || c.name;
    }
    return map;
  }, [categoriesData]);

  // Filter menu options — server filters by slug
  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'כל הקטגוריות' },
    ...(categoriesData || []).map((c) => ({ value: c.slug, label: c.nameHe || c.name })),
  ], [categoriesData]);

  const { items: products, isLoading, hasEverLoaded, state, handlers } = useEntityList<Product>({
    query: api.products.list,
    filters: [
      { key: 'search', type: 'search' },
      { key: 'category', type: 'select', defaultValue: 'all', queryArg: 'category' },
    ],
    itemsPerPage: 10,
    enableSelection: true,
  });
  const { paginatedItems, totalPages, currentPage, itemsPerPage, filters, selectedItems, deleteDialog } = state;
  const { setFilter, setPage, toggleSelection, selectAll, clearSelection, openDeleteDialog, closeDeleteDialog, confirmDelete } = handlers;
  const getCategoryLabel = (c: string) => categoryById[c] || c;
  const getRandomImage = (i: number) => productImages[i % productImages.length];

  // Only show spinner on first load (cold cache), not on return visits
  if (isLoading && !hasEverLoaded) return <LoadingState message="טוען מוצרים..." />;

  return (
    <VStack gap="0" align="stretch" h="full">
      <PageHeader title="מוצרים" subtitle="ניהול ועריכת המוצרים בחנות, מעקב אחר מלאי וסטטוסים." actionLabel="מוצר חדש" actionIcon="add" onAction={() => navigate('/products/new')} />
      <ProductsFilterToolbar searchTerm={filters.search} onSearchChange={(v) => setFilter('search', v)} statusFilter={filters.category} onStatusFilterChange={(v) => setFilter('category', v)} categoryOptions={categoryOptions} />
      <ProductsTable products={paginatedItems} selectedProducts={selectedItems} onSelectAll={(c) => c ? selectAll() : clearSelection()} onSelectProduct={(id) => toggleSelection(id)} onEdit={(id) => navigate(`/products/${id}/edit`)} onDelete={(id) => { const p = products?.find((x) => x._id === id); if (p) openDeleteDialog(p); }} currentPage={currentPage} totalPages={totalPages} totalItems={state.filteredItems.length} itemsPerPage={itemsPerPage} onPageChange={setPage} getCategoryLabel={getCategoryLabel} getRandomImage={getRandomImage} />
      <DeleteConfirmationDialog isOpen={deleteDialog.isOpen} onClose={closeDeleteDialog} onConfirm={() => confirmDelete(deleteMutation)} isLoading={deleteDialog.isDeleting} title="מחיקת מוצר" message="האם אתה בטוח שברצונך למחוק מוצר זה? פעולה זו לא ניתנת לביטול." />
    </VStack>
  );
}
