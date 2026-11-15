// @ts-nocheck
// Type instantiation depth issues with Convex useQuery API
// This file compiles correctly at runtime but TypeScript cannot fully verify it

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/api';
import { Id } from '@convex/dataModel';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';

import { Product, ProductStatus, StockStatus, WineType } from '@shared/types';

// Category type from Convex
interface Category {
  _id: Id<'categories'>;
  name: string;
  nameHe?: string;
  slug: string;
  status: string;
  displayOrder: number;
}

// Form data interface - all product fields
export interface ProductForm {
  productName: string;
  description: string;
  status: ProductStatus;
  category: string;
  tags: string[];
  shortDescription: string;
  price: number;
  onSale: boolean;
  salePrice: number;
  sku: string;
  slug: string; // storefront URL segment, editable only for existing products
  quantityInStock: number;
  stockStatus: StockStatus;
  isFeatured: boolean;
  featuredImage: string;
  relatedProducts: string[];
  wineType: WineType;
  volume: string;
  grapeVariety: string;
  vintage: number;
  servingTemperature: string;
}

interface UseProductEditorProps {
  id?: string;
}

export interface ProductEditorState {
  isEditMode: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  deleteDialogOpen: boolean;
  saveError: string | null;
  tagInput: string;
  categories: { id: string; name: string }[];
  availableProducts: { id: string; name: string }[];
  relatedProducts: { id: string; name: string }[];
}

export interface ProductEditorHandlers {
  handleSave: () => void;
  handleCancel: () => void;
  handleDelete: () => void;
  handleConfirmDelete: () => Promise<void>;
  setDeleteDialogOpen: (open: boolean) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  setTagInput: (value: string) => void;
  handleCategoryToggle: (categoryId: string) => void;
  handleAddRelatedProduct: (productId: string) => void;
  handleRemoveRelatedProduct: (productId: string) => void;
}

export function useProductEditor({ id }: UseProductEditorProps) {
  const navigate = useNavigate();
  const isEditMode = !!id;

  // API queries and mutations
  const existingProduct = useQuery(
    api.products.getById,
    isEditMode ? { productId: id as Id<'products'> } : 'skip'
  );
  const allProducts = useQuery(api.products.list, {});
  const categoriesData = useQuery(api.categories.list, { includeInactive: true });
  
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProductMutation = useMutation(api.products.remove);

  // UI-only state (not product data)
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Track when product data has loaded for the first time (cache-aware loading)
  const productDataLoaded = isEditMode ? existingProduct !== undefined : true;
  useEffect(() => {
    if (productDataLoaded) setHasLoadedData(true);
  }, [productDataLoaded]);

  // Only show loading spinner on first load (cold cache), show cached data instantly on return
  const isLoading = isEditMode && !hasLoadedData && existingProduct === undefined;

  // Transform categories for UI
  const categories = useMemo(() => {
    return (categoriesData || []).map((cat: Category) => ({
      id: cat._id,
      name: cat.nameHe || cat.name,
    }));
  }, [categoriesData]);

  // Available products for related products selector
  const availableProducts = useMemo(() => {
    return (allProducts || [])
      .filter((p) => p._id !== id)
      .map((p) => ({
        id: p._id,
        name: p.productName,
      }));
  }, [allProducts, id]);

  // Form setup - single source of truth for all product data
  const form = useForm<ProductForm>({
    defaultValues: {
      productName: '',
      description: '',
      status: ProductStatus.DRAFT,
      category: '',
      tags: [],
      shortDescription: '',
      price: 0,
      onSale: false,
      salePrice: 0,
      sku: '',
      slug: '',
      quantityInStock: 0,
      stockStatus: StockStatus.IN_STOCK,
      isFeatured: false,
      featuredImage: '',
      relatedProducts: [],
      wineType: WineType.RED,
      volume: '750 מ"ל',
      grapeVariety: '',
      vintage: new Date().getFullYear(),
      servingTemperature: '',
    },
  });

  const { handleSubmit, reset, setValue, getValues, watch } = form;

  // Get related products with names for UI display
  const relatedProducts = useMemo(() => {
    const relatedIds = watch('relatedProducts') || [];
    return relatedIds.map((rpId: string) => {
      const product = allProducts?.find((p) => p._id === rpId);
      return { id: rpId, name: product?.productName || 'מוצר לא נמצא' };
    });
  }, [watch('relatedProducts'), allProducts]);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder: 'התחל לכתוב את תיאור המוצר...',
      }),
    ],
    content: existingProduct?.descriptionHe || '',
    onUpdate: ({ editor }) => {
      setValue('description', editor.getHTML());
    },
  });

  // Update editor content when existingProduct loads
  useEffect(() => {
    if (editor && existingProduct?.descriptionHe) {
      editor.commands.setContent(existingProduct.descriptionHe);
    }
  }, [existingProduct?.descriptionHe, editor]);

  // Reset form when existingProduct data loads (only once)
  useEffect(() => {
    if (existingProduct && !hasLoadedData) {
      reset({
        productName: existingProduct.productName || '',
        description: existingProduct.descriptionHe || '',
        status: (existingProduct.status as ProductStatus) || ProductStatus.DRAFT,
        category: existingProduct.category || '',
        tags: existingProduct.tags || [],
        shortDescription: existingProduct.shortDescription || '',
        price: existingProduct.price || 0,
        onSale: existingProduct.onSale || false,
        salePrice: existingProduct.salePrice || 0,
        sku: existingProduct.sku || '',
        slug: existingProduct.slug || '',
        quantityInStock: Number(existingProduct.quantityInStock) || 0,
        stockStatus: (existingProduct.stockStatus as StockStatus) || StockStatus.IN_STOCK,
        isFeatured: existingProduct.isFeatured || false,
        featuredImage: existingProduct.featuredImage || '',
        relatedProducts: (existingProduct.relatedProducts as string[]) || [],
        wineType: (existingProduct.wineType as WineType) || WineType.RED,
        volume: existingProduct.volume || '750 מ"ל',
        grapeVariety: existingProduct.grapeVariety || '',
        vintage: Number(existingProduct.vintage) || new Date().getFullYear(),
        servingTemperature: existingProduct.servingTemperature || '',
      });
      setHasLoadedData(true);
    }
  }, [existingProduct, hasLoadedData, reset]);

  // Submit handler
  const onSubmit = async (data: ProductForm) => {
    try {
      setIsSaving(true);
      setSaveError(null);

      const description = editor?.getHTML() || '';

      // Validate category is selected
      if (!data.category) {
        setSaveError('יש לבחור קטגוריה');
        setIsSaving(false);
        return;
      }

      const commonData = {
        productName: data.productName,
        price: data.price,
        quantityInStock: Number(data.quantityInStock),
        sku: data.sku,
        category: data.category as Id<'categories'>,
        description,
        shortDescription: data.shortDescription || undefined,
        salePrice: data.onSale ? data.salePrice : undefined,
        onSale: data.onSale,
        tags: data.tags.length > 0 ? data.tags : undefined,
        relatedProducts:
          data.relatedProducts.length > 0
            ? (data.relatedProducts as Id<'products'>[])
            : undefined,
        isFeatured: data.isFeatured,
        featuredImage: data.featuredImage || undefined,
        status: data.status,
        wineType: data.wineType, // WineType enum now matches Convex directly
        volume: data.volume || undefined,
        grapeVariety: data.grapeVariety || undefined,
        vintage: data.vintage || undefined,
        servingTemperature: data.servingTemperature || undefined,
      };

      if (isEditMode && id) {
        // Send the slug only when it was edited; the server cleans it and keeps it unique.
        const slugChanged = data.slug.trim() !== '' && data.slug !== (existingProduct?.slug || '');
        await updateProduct({
          id: id as Id<'products'>,
          ...commonData,
          ...(slugChanged ? { slug: data.slug } : {}),
        });
      } else {
        await createProduct(commonData);
      }

      navigate('/products');
    } catch (error: any) {
      setSaveError(error?.message || 'שגיאה בשמירת המוצר. וודא שכל השדות תקינים.');
    } finally {
      setIsSaving(false);
    }
  };

  // Action handlers
  const handleSave = handleSubmit(async (data) => {
    await onSubmit(data);
  });

  const handleCancel = () => {
    navigate('/products');
  };

  const handleDelete = () => {
    if (!id) return;
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      await deleteProductMutation({ id: id as Id<'products'> });
      navigate('/products');
    } catch (error: any) {
      setSaveError(error?.message || 'שגיאה במחיקת המוצר');
      setDeleteDialogOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddTag = () => {
    const currentTags = getValues('tags') || [];
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      setValue('tags', [...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = getValues('tags') || [];
    setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleCategoryToggle = (categoryId: string) => {
    const currentCategory = getValues('category');
    // Single category selection - toggle or set
    if (currentCategory === categoryId) {
      setValue('category', ''); // Deselect if clicking same category
    } else {
      setValue('category', categoryId);
    }
  };

  const handleAddRelatedProduct = (productId: string) => {
    const currentRelated = getValues('relatedProducts') || [];
    if (!currentRelated.includes(productId)) {
      setValue('relatedProducts', [...currentRelated, productId]);
    }
  };

  const handleRemoveRelatedProduct = (productId: string) => {
    const currentRelated = getValues('relatedProducts') || [];
    setValue(
      'relatedProducts',
      currentRelated.filter((id) => id !== productId)
    );
  };

  return {
    form,
    editor,
    state: {
      isEditMode,
      isLoading,
      isSaving,
      isDeleting,
      deleteDialogOpen,
      saveError,
      tagInput,
      categories,
      availableProducts,
      relatedProducts,
    },
    handlers: {
      handleSave,
      handleCancel,
      handleDelete,
      handleConfirmDelete,
      setDeleteDialogOpen,
      handleAddTag,
      handleRemoveTag,
      setTagInput,
      handleCategoryToggle,
      handleAddRelatedProduct,
      handleRemoveRelatedProduct,
    },
  };
}
