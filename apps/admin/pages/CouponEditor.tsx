import React from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
} from '@chakra-ui/react';
import { useCouponEditor } from '../hooks/useCouponEditor';
import {
  BasicInfoCard,
  DiscountConfigCard,
  RulesLimitsCard,
  ValidityCard,
  RestrictionsCard,
} from '../components/coupons';
import { LoadingState, Breadcrumbs, DeleteConfirmationDialog } from '../components/shared';
import { EditorFooter } from '../components/post-editor';

export default function CouponEditor() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    existingCoupon,
    categoriesList,
    productsList,
    isEditMode,
    id,
    selectedCategoryIds,
    setSelectedCategoryIds,
    selectedProductIds,
    setSelectedProductIds,
    categoryInput,
    setCategoryInput,
    productInput,
    setProductInput,
    isCreating,
    isUpdating,
    isDeleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isLoading,
    getDiscountValueValidation,
    validateEndDate,
    validateBuyQuantity,
    validateGetQuantity,
    validateCodeUniqueness,
    onSubmit,
    handleSave,
    handleCancel,
    handleDelete,
    handleConfirmDelete,
    handleGenerateCode,
    handleAddCategory,
    handleRemoveCategory,
    handleAddProduct,
    handleRemoveProduct,
    discountType,
  } = useCouponEditor();

  if (isLoading) {
    return <LoadingState message="טוען..." />;
  }

  return (
    <Box h="full" display="flex" flexDirection="column">
      <Box flex="1" overflowY="auto" css={{ scrollBehavior: 'smooth' }}>
        <Box maxW="1200px" mx="auto" w="full" pb="24">
          <Breadcrumbs 
            items={[
              { label: 'ראשי', href: '#/' },
              { label: 'קופונים', href: '#/coupons' },
              { label: isEditMode ? 'עריכת קופון' : 'יצירת קופון' }
            ]} 
          />

          {/* Header */}
          <Flex
            direction={{ base: 'column', sm: 'row' }}
            justify="space-between"
            align={{ base: 'start', sm: 'center' }}
            gap="4"
            mb="8"
          >
            <Box>
              <Heading size="2xl" color="fg" mb="1">
                {isEditMode ? 'עריכת קופון' : 'יצירת קופון'}
              </Heading>
              <Text color="fg.muted" fontSize="sm">
                {isEditMode ? 'ערוך את פרטי הקופון והמגבלות' : 'צור קופון חדש עם הגדרות ומגבלות'}
              </Text>
            </Box>
          </Flex>

          <form id="coupon-form" onSubmit={handleSubmit(onSubmit)}>
            <SimpleGrid columns={{ base: 1 }} gap="6">
              <BasicInfoCard
                register={register}
                errors={errors}
                watch={watch}
                setValue={setValue}
                isEditMode={isEditMode}
                validateCodeUniqueness={validateCodeUniqueness}
                onGenerateCode={handleGenerateCode}
              />

              <DiscountConfigCard
                register={register}
                errors={errors}
                setValue={setValue}
                discountType={discountType}
                getDiscountValueValidation={getDiscountValueValidation}
                validateBuyQuantity={validateBuyQuantity}
                validateGetQuantity={validateGetQuantity}
              />

              <SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
                <RulesLimitsCard register={register} errors={errors} />
                <ValidityCard
                  register={register}
                  errors={errors}
                  validateEndDate={validateEndDate}
                />
              </SimpleGrid>

              <RestrictionsCard
                register={register}
                watch={watch}
                setValue={setValue}
                categoriesList={categoriesList}
                productsList={productsList}
                selectedCategoryIds={selectedCategoryIds}
                selectedProductIds={selectedProductIds}
                categoryInput={categoryInput}
                setCategoryInput={setCategoryInput}
                productInput={productInput}
                setProductInput={setProductInput}
                onAddCategory={handleAddCategory}
                onRemoveCategory={handleRemoveCategory}
                onAddProduct={handleAddProduct}
                onRemoveProduct={handleRemoveProduct}
              />
            </SimpleGrid>
          </form>
        </Box>
      </Box>

      <EditorFooter
        isEditMode={isEditMode}
        isCreating={isCreating}
        isUpdating={isUpdating}
        isDeleting={isDeleting}
        onSave={handleSave}
        onCancel={handleCancel}
        onDelete={handleDelete}
      />

      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="מחיקת קופון"
        message="האם אתה בטוח שברצונך למחוק קופון זה? פעולה זו לא ניתנת לביטול."
        isDeleting={isDeleting}
      />
    </Box>
  );
}
