import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, VStack, Heading, Text, Button, SimpleGrid } from '@chakra-ui/react';
import { LoadingState, DeleteConfirmationDialog } from '../components/shared';
import { EditorFooter } from '../components/post-editor';
import {
  CartRuleEditorHeader,
  CartRuleBasicInfoCard,
  CartRuleConfigCard,
} from '../components/cart-rules';
import { useCartRuleEditor } from '../hooks/useCartRuleEditor';
import { typeOptions, statusOptions, getCartRuleValueLabel } from '../utils/cartRuleHelpers';

export default function CartRuleEditor() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const { form, state, handlers } = useCartRuleEditor({ id });
  const { register, formState: { errors }, watch, control } = form;
  const ruleType = watch('ruleType') as 'buy_x_get_y' | 'bulk_discount' | 'shipping' | undefined;

  // Loading state
  if (state.isEditMode && state.isLoadingCartRule) {
    return <LoadingState message="טוען..." />;
  }

  // Cart rule not found
  if (state.cartRuleNotFound) {
    return (
      <Box h="full" display="flex" alignItems="center" justifyContent="center">
        <VStack gap="4">
          <Text fontSize="18px" className="material-symbols-outlined" color="red.500">
            error
          </Text>
          <Heading size="lg" color="fg">חוק עגלה לא נמצא</Heading>
          <Text color="fg.muted">חוק העגלה המבוקש לא קיים או נמחק</Text>
          <Button onClick={() => navigate('/cart-rules')} colorScheme="brand">
            חזור לרשימת חוקים
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box h="full" display="flex" flexDirection="column">
      <Box flex="1" overflowY="auto" css={{ scrollBehavior: 'smooth' }}>
        <Box maxW="1200px" mx="auto" w="full" pb="24">
          <CartRuleEditorHeader isEditMode={state.isEditMode} />

          <form id="cart-rule-form">
            <SimpleGrid columns={{ base: 1 }} gap="6">
              <CartRuleBasicInfoCard
                register={register}
                control={control}
                errors={errors}
                typeOptions={typeOptions}
                statusOptions={statusOptions}
              />

              <CartRuleConfigCard
                register={register}
                errors={errors}
                ruleType={ruleType}
                getValueLabel={getCartRuleValueLabel}
              />
            </SimpleGrid>
          </form>
        </Box>
      </Box>

      <EditorFooter
        isEditMode={state.isEditMode}
        isCreating={state.isCreating}
        isUpdating={state.isUpdating}
        isDeleting={state.isDeleting}
        onSave={handlers.handleSave}
        onCancel={handlers.handleCancel}
        onDelete={handlers.handleDelete}
      />

      <DeleteConfirmationDialog
        isOpen={state.deleteDialogOpen}
        onClose={() => handlers.setDeleteDialogOpen(false)}
        onConfirm={handlers.handleConfirmDelete}
        title="מחיקת חוק עגלה"
        message="האם אתה בטוח שברצונך למחוק חוק זה? פעולה זו לא ניתנת לביטול."
        isDeleting={state.isDeleting}
      />
    </Box>
  );
}
