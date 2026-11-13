// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Flex, VStack, HStack, Heading, Text, Input, Card, Badge, SimpleGrid, Button } from '@chakra-ui/react';
import { LoadingState, Breadcrumbs, DeleteConfirmationDialog } from '../components/shared';
import { PublishCard, CategoriesCard, TagsCard, FeaturedImageCard, EditorFooter, PricingCard, InventoryCard, RelatedProductsCard, WineDetailsCard } from '../components/post-editor';
import { RichTextEditor, Control } from '../components/ui/rich-text-editor';
import { useProductEditor } from '../hooks/useProductEditor';

export default function ProductEditor() {
  const { id } = useParams<{ id?: string }>();
  const { form, editor, state, handlers } = useProductEditor({ id });
  const { register, control, watch, setValue } = form;
  const { isEditMode, isLoading, isSaving, isDeleting, deleteDialogOpen, saveError, tagInput, categories, availableProducts, relatedProducts } = state;
  const { handleSave, handleCancel, handleDelete, handleConfirmDelete, setDeleteDialogOpen, handleAddTag, handleRemoveTag, setTagInput, handleCategoryToggle, handleAddRelatedProduct, handleRemoveRelatedProduct } = handlers;

  if (isLoading) return <LoadingState message="טוען מוצר..." />;

  return (
    <Box h="full" display="flex" flexDirection="column">
      <Box flex="1" overflowY="auto" css={{ scrollBehavior: 'smooth' }}>
        <Box maxW="full" mx="auto" w="full" pb="24">
          <Breadcrumbs items={[{ label: 'ראשי', href: '#' }, { label: 'מוצרים', href: '#/products' }, { label: isEditMode ? watch('productName') || 'עריכת מוצר' : 'יצירת מוצר' }]} />
          <Flex direction={{ base: 'column', sm: 'row' }} justify="space-between" align={{ base: 'start', sm: 'center' }} gap="4" mb="8">
            <Box>
              <Heading size={{ base: 'xl', sm: '2xl' }} color="fg" mb="1">{isEditMode ? watch('productName') || 'עריכת מוצר' : 'יצירת מוצר'}</Heading>
              <Text color="fg.muted" fontSize="sm">{isEditMode ? 'ערוך את פרטי המוצר, התיאור וההגדרות' : 'צור מוצר חדש עם תיאור והגדרות'}</Text>
            </Box>
            {saveError && (
              <Box bg="red.500/10" borderLeftWidth="4px" borderColor="red.500" p="4" my="4" rounded="md" w="full">
                <HStack><Text as="span" className="material-symbols-outlined" color="red.500">error</Text><Text color="red.600" fontWeight="medium">{saveError}</Text></HStack>
              </Box>
            )}
            <Button variant="outline" size="sm" bg="bg.panel" borderColor="border"><Text as="span" className="material-symbols-outlined" fontSize="18px">visibility</Text>תצוגה מקדימה</Button>
          </Flex>
          <form id="product-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <SimpleGrid columns={{ base: 1, sm: 2, lg: 12 }} gap={{ base: 6, sm: 8, lg: 8 }} alignItems="start">
              <VStack gap="6" gridColumn={{ lg: 'span 8' }} align="stretch">
                <Card.Root><Card.Body p="6">
                  <Text fontSize="sm" fontWeight="medium" color="fg" mb="3">שם המוצר</Text>
                  <Input {...register('productName', { required: 'שדה חובה' })} size="lg" fontSize="lg" fontWeight="medium" placeholder="הוסף שם מוצר כאן..." bg="bg.subtle" borderColor="border" _focus={{ ring: 4, ringColor: 'brand.500/10', borderColor: 'brand.500' }} />
                </Card.Body></Card.Root>
                <RichTextEditor.Root editor={editor} css={{ '--content-min-height': '400px' }}>
                  <RichTextEditor.Toolbar>
                    <RichTextEditor.ControlGroup><Control.TextStyle /></RichTextEditor.ControlGroup>
                    <RichTextEditor.ControlGroup><Control.Bold /><Control.Italic /><Control.Strikethrough /></RichTextEditor.ControlGroup>
                    <RichTextEditor.ControlGroup><Control.AlignRight /><Control.AlignCenter /><Control.AlignLeft /></RichTextEditor.ControlGroup>
                    <RichTextEditor.ControlGroup><Control.BulletList /><Control.OrderedList /><Control.Blockquote /></RichTextEditor.ControlGroup>
                    <RichTextEditor.ControlGroup><Control.Undo /><Control.Redo /></RichTextEditor.ControlGroup>
                  </RichTextEditor.Toolbar>
                  <RichTextEditor.Content />
                </RichTextEditor.Root>
                <Card.Root><Card.Body p="6">
                  <Flex justify="space-between" align="center" mb="3">
                    <Text fontSize="sm" fontWeight="medium" color="fg">תיאור קצר</Text>
                    <Badge fontSize="xs" bg="bg.subtle" px="2" py="1" rounded="md">אופציונלי</Badge>
                  </Flex>
                  <textarea {...register('shortDescription')} placeholder="כתוב תיאור קצר שיופיע ברשימת המוצרים..." style={{ width: '100%', minHeight: '80px', padding: '12px', fontSize: '14px', borderRadius: '6px', border: '1px solid var(--chakra-colors-border)', background: 'var(--chakra-colors-bg-subtle)', resize: 'vertical' }} maxLength={500} />
                  <Text fontSize="xs" color="fg.muted" mt="2" textAlign="left" dir="ltr">{(watch('shortDescription') || '').length}/500</Text>
                </Card.Body></Card.Root>
                <InventoryCard sku={watch('sku') || ''} onSkuChange={(s) => setValue('sku', s)} quantityInStock={watch('quantityInStock') || 0} onQuantityChange={(q) => setValue('quantityInStock', q)} stockStatus={watch('stockStatus') || 'in_stock'} onStockStatusChange={(s) => setValue('stockStatus', s)} isFeatured={watch('isFeatured') || false} onFeaturedChange={(f) => setValue('isFeatured', f)} />
                <WineDetailsCard wineType={watch('wineType')} onWineTypeChange={(t) => setValue('wineType', t)} volume={watch('volume') || ''} onVolumeChange={(v) => setValue('volume', v)} grapeVariety={watch('grapeVariety') || ''} onGrapeVarietyChange={(g) => setValue('grapeVariety', g)} vintage={watch('vintage') || new Date().getFullYear()} onVintageChange={(v) => setValue('vintage', v)} servingTemperature={watch('servingTemperature') || ''} onServingTemperatureChange={(t) => setValue('servingTemperature', t)} />
                <RelatedProductsCard relatedProducts={relatedProducts} availableProducts={availableProducts} onAddProduct={handleAddRelatedProduct} onRemoveProduct={handleRemoveRelatedProduct} />
              </VStack>
              <VStack gap="6" gridColumn={{ lg: 'span 4' }} align="stretch">
                <PublishCard control={control} isEditMode={isEditMode} isCreating={isSaving && !isEditMode} isUpdating={isSaving && isEditMode} isDeleting={isDeleting} onDelete={handleDelete} />
                <PricingCard price={watch('price') || 0} onPriceChange={(p) => setValue('price', p)} onSale={watch('onSale') || false} onSaleChange={(s) => setValue('onSale', s)} salePrice={watch('salePrice') || 0} onSalePriceChange={(p) => setValue('salePrice', p)} />
                <CategoriesCard categories={categories} selectedCategories={watch('category') ? [watch('category')] : []} onCategoryToggle={handleCategoryToggle} />
                <TagsCard tags={watch('tags') || []} tagInput={tagInput} onTagInputChange={setTagInput} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />
                <FeaturedImageCard imageUrl={watch('featuredImage')} onImageUrlChange={(u) => setValue('featuredImage', u)} />
              </VStack>
            </SimpleGrid>
          </form>
        </Box>
      </Box>
      <EditorFooter isEditMode={isEditMode} isCreating={isSaving && !isEditMode} isUpdating={isSaving && isEditMode} isDeleting={isDeleting} onSave={handleSave} onCancel={handleCancel} onDelete={handleDelete} />
      <DeleteConfirmationDialog isOpen={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} onConfirm={handleConfirmDelete} title="מחיקת מוצר" message="האם אתה בטוח שברצונך למחוק מוצר זה? פעולה זו לא ניתנת לביטול." isDeleting={isDeleting} />
    </Box>
  );
}