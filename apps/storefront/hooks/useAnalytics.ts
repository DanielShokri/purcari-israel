import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/api";
import { useLocation } from "react-router-dom";

const ANALYTICS_STORAGE_KEY = "convex_anon_id";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

/**
 * Generate a UUID v4-like anonymous ID
 * Uses crypto.randomUUID if available, falls back to manual generation
 */
function generateAnonymousId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get or create anonymous ID from localStorage
 */
export function getAnonymousId(): string {
  if (typeof localStorage === "undefined") {
    return generateAnonymousId(); // SSR fallback
  }
  let anonymousId = localStorage.getItem(ANALYTICS_STORAGE_KEY);
  if (!anonymousId) {
    anonymousId = generateAnonymousId();
    localStorage.setItem(ANALYTICS_STORAGE_KEY, anonymousId);
  }
  return anonymousId;
}

/**
 * Clear anonymous ID (call on logout)
 */
export function clearAnonymousId(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  }
}

/**
 * Tracks analytics events with anonymous-ID management and identity stitching.
 * track() logs events, identify() links anonymous events to the user after login.
 */
export function useAnalytics() {
  const trackMutation = useMutation(api.analytics.trackEvent);
  const linkIdentityMutation = useMutation(api.analytics.linkIdentity);

  /**
   * Track an analytics event
   * Automatically attaches anonymous ID for guest-to-user stitching
   */
  const track = useCallback(
    async (event: string, properties: Record<string, any> = {}) => {
      const anonymousId = getAnonymousId();
      try {
        await trackMutation({
          event,
          properties,
          anonymousId,
        });
      } catch (error) {
        // Silently fail - analytics should not break the app
        console.warn("Analytics tracking failed:", error);
      }
    },
    [trackMutation]
  );

  /**
   * Link anonymous events to authenticated user (Identity Stitching)
   * Call this AFTER successful login/registration
   */
  const identify = useCallback(async () => {
    const anonymousId = getAnonymousId();
    if (anonymousId) {
      try {
        const result = await linkIdentityMutation({ anonymousId });
        return result;
      } catch (error) {
        console.warn("Identity linking failed:", error);
        return { linked: 0 };
      }
    }
    return { linked: 0 };
  }, [linkIdentityMutation]);

  // Backwards compatible alias
  const trackEvent = track;

  return { track, identify, trackEvent };
}

/**
 * Hook for tracking page views automatically
 * Call this in your root App component or layout
 */
export function useTrackPageView() {
  const location = useLocation();
  const { track } = useAnalytics();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Don't track the same path twice (e.g., on re-renders)
    if (currentPath === lastPath.current) return;
    lastPath.current = currentPath;

    // Track page view
    track("page_viewed", {
      path: location.pathname,
      search: location.search,
      referrer: document.referrer,
    });
  }, [location.pathname, location.search, track]);
}

/**
 * Hook for tracking product views
 * Call this on product detail pages
 */
export function useTrackProductView(
  productId: string,
  productName?: string,
  price?: number,
  category?: string
) {
  const { track } = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;

    track("product_viewed", {
      productId,
      name: productName,
      price,
      category,
    });
  }, [productId, productName, price, category, track]);
}

/**
 * Hook for tracking add to cart events (cart_item_added)
 */
export function useTrackAddToCart() {
  const { track } = useAnalytics();

  const trackAddToCart = useCallback(
    (
      productId: string,
      productName: string,
      quantity: number,
      price: number,
      cartTotal?: number
    ) => {
      track("cart_item_added", {
        productId,
        name: productName,
        quantity,
        price,
        cartTotal,
      });
    },
    [track]
  );

  return { trackAddToCart };
}

/**
 * Hook for tracking purchase events (order_completed)
 */
export function useTrackPurchase() {
  const { track } = useAnalytics();

  const trackPurchase = useCallback(
    (
      orderId: string,
      total: number,
      items: Array<{ productId: string; quantity: number; price: number }>,
      paymentMethod?: string
    ) => {
      track("order_completed", {
        orderId,
        total,
        items,
        itemCount: items.length,
        paymentMethod,
      });
    },
    [track]
  );

  return { trackPurchase };
}

/**
 * Hook for tracking checkout start events
 */
export function useTrackCheckoutStart() {
  const { track } = useAnalytics();

  const trackCheckoutStart = useCallback(
    (cartId: string, itemCount: number, totalValue: number) => {
      track("checkout_started", {
        cartId,
        itemCount,
        totalValue,
      });
    },
    [track]
  );

  return { trackCheckoutStart };
}

/**
 * Hook for tracking search events
 */
export function useTrackSearch() {
  const { track } = useAnalytics();

  const trackSearch = useCallback(
    (
      query: string,
      resultsCount: number,
      filtersApplied?: Record<string, any>
    ) => {
      track("search_performed", {
        query,
        resultsCount,
        filtersApplied,
      });
    },
    [track]
  );

  return { trackSearch };
}

/**
 * Hook for tracking cart view events (cart_viewed)
 */
export function useTrackCartViewed() {
  const { track } = useAnalytics();

  const trackCartViewed = useCallback(
    (itemCount: number, cartTotal: number) => {
      track("cart_viewed", {
        itemCount,
        cartTotal,
      });
    },
    [track]
  );

  return { trackCartViewed };
}

/**
 * Hook for tracking cart item removal events (cart_item_removed)
 */
export function useTrackCartItemRemoved() {
  const { track } = useAnalytics();

  const trackCartItemRemoved = useCallback(
    (
      productId: string,
      productName: string,
      quantity: number,
      price: number,
      remainingItems: number
    ) => {
      track("cart_item_removed", {
        productId,
        name: productName,
        quantity,
        price,
        remainingItems,
      });
    },
    [track]
  );

  return { trackCartItemRemoved };
}

/**
 * Hook for tracking category view events (category_viewed)
 */
export function useTrackCategoryViewed() {
  const { track } = useAnalytics();

  const trackCategoryViewed = useCallback(
    (
      categoryId: string,
      categoryName: string,
      productCount: number,
      filters?: Record<string, any>
    ) => {
      track("category_viewed", {
        categoryId,
        name: categoryName,
        productCount,
        filters,
      });
    },
    [track]
  );

  return { trackCategoryViewed };
}

/**
 * Hook for tracking checkout step events (checkout_step_viewed)
 */
export function useTrackCheckoutStep() {
  const { track } = useAnalytics();

  const trackCheckoutStep = useCallback(
    (
      step: "shipping" | "payment" | "review" | "confirmation",
      stepNumber: number,
      totalSteps: number,
      cartValue: number,
      itemCount: number
    ) => {
      track("checkout_step_viewed", {
        step,
        stepNumber,
        totalSteps,
        cartValue,
        itemCount,
      });
    },
    [track]
  );

  return { trackCheckoutStep };
}

/**
 * Hook for tracking signup completion events (signup_completed)
 */
export function useTrackSignup() {
  const { track } = useAnalytics();

  const trackSignup = useCallback(
    (method: "email" | "google" | "phone", hasPreviousSession: boolean) => {
      track("signup_completed", {
        method,
        hasPreviousSession,
      });
    },
    [track]
  );

  return { trackSignup };
}

/**
 * Hook for tracking login completion events (login_completed)
 */
export function useTrackLogin() {
  const { track } = useAnalytics();

  const trackLogin = useCallback(
    (method: "email" | "google" | "magic_link") => {
      track("login_completed", {
        method,
      });
    },
    [track]
  );

  return { trackLogin };
}

/**
 * Hook for tracking coupon application events (coupon_applied)
 */
export function useTrackCouponApplied() {
  const { track } = useAnalytics();

  const trackCouponApplied = useCallback(
    (
      couponCode: string,
      discountAmount: number,
      discountType: string,
      orderTotal: number,
      success: boolean,
      failureReason?: string
    ) => {
      track("coupon_applied", {
        couponCode,
        discountAmount,
        discountType,
        orderTotal,
        success,
        failureReason,
      });
    },
    [track]
  );

  return { trackCouponApplied };
}

/**
 * Hook for tracking wishlist events (wishlist_item_added)
 */
export function useTrackWishlist() {
  const { track } = useAnalytics();

  const trackWishlistItemAdded = useCallback(
    (productId: string, productName: string, price: number) => {
      track("wishlist_item_added", {
        productId,
        name: productName,
        price,
      });
    },
    [track]
  );

  return { trackWishlistItemAdded };
}
