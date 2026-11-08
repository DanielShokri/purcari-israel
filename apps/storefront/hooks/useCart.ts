import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/api';
import { Id } from '@convex/dataModel';
import { CartItem, AppliedCoupon, CouponValidationResult, CartSyncResult } from '@shared/types';
import { calculateCartTotals, CartTotals } from '../utils/cartCalculation';

// Constants
const CART_STORAGE_KEY = 'cart';
const COUPON_STORAGE_KEY = 'coupon';
const FREE_SHIPPING_THRESHOLD = 300;

// localStorage adapter functions

function loadFromLocalStorage(): CartItem[] {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.items || [];
    }
  } catch (error) {
    console.error('[Cart] Failed to load cart from localStorage:', error);
    // Clear potentially corrupted data
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  }
  return [];
}

function saveToLocalStorage(items: CartItem[], coupon: AppliedCoupon | null): void {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items, appliedCoupon: coupon }));
  } catch (error) {
    console.error('[Cart] Failed to save cart to localStorage:', error);
  }
}

function loadCouponFromLocalStorage(): AppliedCoupon | null {
  try {
    const saved = localStorage.getItem(COUPON_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('[Cart] Failed to load coupon from localStorage:', error);
    localStorage.removeItem(COUPON_STORAGE_KEY);
  }
  return null;
}

function saveCouponToLocalStorage(coupon: AppliedCoupon | null): void {
  try {
    if (coupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  } catch (error) {
    console.error('[Cart] Failed to save coupon to localStorage:', error);
  }
}

// Hook return type

export interface UseCartReturn {
  // State
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncResult: CartSyncResult | null;

  // Computed
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  appliedBenefits: string[];
  freeItems: Array<{ productId: string; productName: string; quantity: number; ruleName: string }>;
  validationErrors: string[];
  freeShippingThreshold: number;
  amountUntilFreeShipping: number;

  // Actions
  addItem: (product: { _id: string; productName: string; productNameHe?: string; price: number; salePrice?: number; quantityInStock: number; featuredImage?: string }, quantity?: number) => Promise<{ success: boolean; error?: string }>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;

  // Coupon actions
  applyCoupon: (code: string) => Promise<CouponValidationResult | null>;
  removeCoupon: () => Promise<void>;

  // Sync
  dismissSyncResult: () => void;
}

// useCart hook

export function useCart(): UseCartReturn {
  // Auth state
  const user = useQuery(api.users.get);
  const isAuthenticated = user !== null && user !== undefined;
  const isLoading = user === undefined;

  // Convex cart for authenticated users
  const convexCart = useQuery(api.cart.getCart, isAuthenticated ? {} : "skip");

  // Convex mutations
  const addItemMutation = useMutation(api.cart.addItem);
  const removeItemMutation = useMutation(api.cart.removeItem);
  const updateQuantityMutation = useMutation(api.cart.updateQuantity);
  const clearCartMutation = useMutation(api.cart.clearCart);
  const mergeGuestCartMutation = useMutation(api.cart.mergeGuestCart);

  // Guest cart state
  const [guestCart, setGuestCart] = useState<CartItem[]>(() => loadFromLocalStorage());
  const [guestCoupon, setGuestCoupon] = useState<AppliedCoupon | null>(() => loadCouponFromLocalStorage());

  // Sync result state (for merge issues)
  const [syncResult, setSyncResult] = useState<CartSyncResult | null>(null);

  // Auth transition tracking
  const prevAuthRef = useRef<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get current cart items based on auth status
  const items: CartItem[] = isAuthenticated ? (convexCart?.items ?? []) : guestCart;
  const appliedCoupon: AppliedCoupon | null = isAuthenticated ? (convexCart?.appliedCoupon ?? null) : guestCoupon;

  // Cart rules for calculations
  const cartRules = useQuery(api.cartRules.getActive);

  // Calculate totals
  const totals = useMemo((): CartTotals => {
    return calculateCartTotals(items, cartRules ?? []);
  }, [items, cartRules]);

  // Auth transition effect - merge guest cart on login
  useEffect(() => {
    const wasGuest = prevAuthRef.current === false;
    const nowAuth = isAuthenticated;
    prevAuthRef.current = isAuthenticated;

    if (nowAuth && wasGuest && guestCart.length > 0) {
      // Guest just logged in with items - merge
      setIsSyncing(true);
        mergeGuestCartMutation({ guestItems: guestCart })
          .then((result) => {
            // Clear localStorage after merge
            localStorage.removeItem(CART_STORAGE_KEY);
            localStorage.removeItem(COUPON_STORAGE_KEY);
            setGuestCart([]);
            setGuestCoupon(null);

            // Surface sync issues
            if (
              result &&
              (result.skippedItems.length > 0 ||
                result.priceChanges.length > 0 ||
                result.adjustedItems.length > 0)
            ) {
              setSyncResult(result);
            }
          })
          .catch((error) => {
            console.error('[Cart] Failed to merge guest cart on login:', error);
            // Keep syncResult null - user will need to contact support if items are missing
          })
          .finally(() => {
            setIsSyncing(false);
          });
    }
  }, [isAuthenticated, guestCart, mergeGuestCartMutation]);

  // Add item action
  const addItem = useCallback(async (
    product: { _id: string; productName: string; productNameHe?: string; price: number; salePrice?: number; quantityInStock: number; featuredImage?: string },
    quantity: number = 1
  ): Promise<{ success: boolean; error?: string }> => {
    if (isAuthenticated) {
      // Use Convex mutation
      try {
        await addItemMutation({
          productId: product._id as Id<"products">,
          quantity,
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    } else {
      // Guest - use localStorage
      const existingIndex = guestCart.findIndex(item => item.productId === product._id);
      const newItems = [...guestCart];

      if (existingIndex >= 0) {
        // Increment quantity (capped at stock)
        const existing = newItems[existingIndex];
        const newQuantity = Math.min(
          existing.quantity + quantity,
          product.quantityInStock
        );
        newItems[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          maxQuantity: product.quantityInStock,
        };
      } else {
        // Add new item
        const hasSale = product.salePrice && product.salePrice < product.price;
        newItems.push({
          id: `${product._id}_${Date.now()}`,
          productId: product._id,
          title: product.productNameHe || product.productName,
          price: hasSale ? product.salePrice! : product.price,
          salePrice: product.salePrice,
          originalPrice: hasSale ? product.price : undefined,
          quantity: Math.min(quantity, product.quantityInStock),
          maxQuantity: product.quantityInStock,
          imgSrc: product.featuredImage || "",
        });
      }

      setGuestCart(newItems);
      saveToLocalStorage(newItems, guestCoupon);
      return { success: true };
    }
  }, [isAuthenticated, guestCart, guestCoupon, addItemMutation]);

  // Remove item action
  const removeItem = useCallback(async (productId: string): Promise<void> => {
    if (isAuthenticated) {
      await removeItemMutation({ productId: productId as Id<"products"> });
    } else {
      const newItems = guestCart.filter(item => item.productId !== productId);
      setGuestCart(newItems);
      saveToLocalStorage(newItems, guestCoupon);
    }
  }, [isAuthenticated, guestCart, guestCoupon, removeItemMutation]);

  // Update quantity action
  const updateQuantity = useCallback(async (productId: string, quantity: number): Promise<void> => {
    if (isAuthenticated) {
      if (quantity <= 0) {
        await removeItemMutation({ productId: productId as Id<"products"> });
      } else {
        await updateQuantityMutation({ productId: productId as Id<"products">, quantity });
      }
    } else {
      if (quantity <= 0) {
        const newItems = guestCart.filter(item => item.productId !== productId);
        setGuestCart(newItems);
        saveToLocalStorage(newItems, guestCoupon);
      } else {
        const newItems = guestCart.map(item => {
          if (item.productId === productId) {
            return { ...item, quantity: Math.min(quantity, item.maxQuantity) };
          }
          return item;
        });
        setGuestCart(newItems);
        saveToLocalStorage(newItems, guestCoupon);
      }
    }
  }, [isAuthenticated, guestCart, guestCoupon, removeItemMutation, updateQuantityMutation]);

  // Clear cart action
  const clearCartAction = useCallback(async (): Promise<void> => {
    if (isAuthenticated) {
      await clearCartMutation();
    } else {
      setGuestCart([]);
      setGuestCoupon(null);
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [isAuthenticated, clearCartMutation]);

  // Apply coupon action
  const applyCoupon = useCallback(async (code: string): Promise<CouponValidationResult | null> => {
    if (!code.trim()) {
      return null;
    }

    const subtotal = totals.subtotal;
    const itemCount = totals.itemCount;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const convexClient = (window as any).__convex_client;
      const result = await convexClient?.query(
        api.coupons.validate,
        {
          code: code.trim(),
          subtotal,
          itemCount,
        }
      ) ?? { valid: false, error: 'שגיאה באימות הקופון' };

      if (result.valid && result.coupon) {
        const couponData: AppliedCoupon = {
          code: result.coupon.code,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
          discountAmount: result.discountAmount ?? 0,
        };

        // Apply to appropriate storage
        if (isAuthenticated) {
          // For authenticated users, we'd need to add this to the mutation
          // For now, store in local and rely on Convex to persist
          saveCouponToLocalStorage(couponData);
          setGuestCoupon(couponData);
        } else {
          setGuestCoupon(couponData);
          saveCouponToLocalStorage(couponData);
        }

        return {
          valid: true,
          coupon: result.coupon,
          discountAmount: result.discountAmount,
        };
      } else {
        return { valid: false, error: result.error };
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      return { valid: false, error: 'שגיאה באימות הקופון' };
    }
  }, [totals.subtotal, totals.itemCount, isAuthenticated]);

  // Remove coupon action
  const removeCouponAction = useCallback(async (): Promise<void> => {
    if (isAuthenticated) {
      // For authenticated users, update via mutation
      // Currently Convex doesn't have a removeCoupon mutation, so we just clear local
      setGuestCoupon(null);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } else {
      setGuestCoupon(null);
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [isAuthenticated]);

  // Dismiss sync result
  const dismissSyncResult = useCallback(() => {
    setSyncResult(null);
  }, []);

  return {
    // State
    items,
    appliedCoupon,
    isLoading,
    isSyncing,
    syncResult,

    // Computed
    itemCount: totals.itemCount,
    subtotal: totals.subtotal,
    shipping: totals.shippingCost,
    discount: totals.discount,
    total: totals.total,
    appliedBenefits: totals.appliedBenefits,
    freeItems: totals.freeItems,
    validationErrors: totals.validationErrors,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    amountUntilFreeShipping: Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal),

    // Actions
    addItem,
    removeItem,
    updateQuantity,
    clearCart: clearCartAction,

    // Coupon actions
    applyCoupon,
    removeCoupon: removeCouponAction,

    // Sync
    dismissSyncResult,
  };
}
