import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Doc, Id } from "./_generated/dataModel";

interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  salePrice?: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  imgSrc: string;
}

interface Cart {
  items: CartItem[];
  appliedCoupon?: unknown;
  updatedAt: string;
}

type ProductDoc = Doc<"products">;
type CartDoc = Doc<"carts">;

/**
 * Get current user's cart from separate carts table.
 * Returns cart items or null if no cart.
 */
export const getCart = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return cart ?? null;
  },
});

/**
 * Add item to cart.
 * Validates stock availability and builds CartItem from fresh product data (not client-submitted).
 * Prevents price manipulation by fetching product from DB.
 */
export const addItem = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("יש להתחבר למערכת כדי להוסיף לעגלה");
    }

    const { productId, quantity } = args;

    // Fetch product from DB to get current price and stock
    const product = await ctx.db.get(productId) as ProductDoc | null;
    if (!product) {
      throw new Error("המוצר לא נמצא");
    }

    // Validate product is active
    if (product.status === "discontinued") {
      throw new Error("המוצר הופסק מהמכירה");
    }

    // Validate stock
    if (product.quantityInStock < quantity) {
      throw new Error("המוצר אזל מהמלאי");
    }

    // Get current user cart from carts table
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const currentItems = cart?.items ?? [];
    const items = [...currentItems];

    // Check if item already exists in cart
    const existingIndex = items.findIndex(
      (item: CartItem) => item.productId === productId
    );

    // Build CartItem from fresh product data
    // Only set originalPrice if product has a valid sale price
    const hasSale = product.salePrice && product.salePrice < product.price;
    const cartItem: CartItem = {
      id: `${productId}_${Date.now()}`,
      productId: productId,
      title: product.productNameHe || product.productName,
      price: hasSale ? product.salePrice : product.price,
      salePrice: product.salePrice,
      originalPrice: hasSale ? product.price : undefined,
      quantity: 0, // Will be set below
      maxQuantity: product.quantityInStock,
      imgSrc: product.featuredImage || "",
    };

    if (existingIndex >= 0) {
      // Increment quantity (capped at stock)
      const existing = items[existingIndex];
      const newQuantity = Math.min(
        existing.quantity + quantity,
        product.quantityInStock
      );
      items[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        maxQuantity: product.quantityInStock,
      };
    } else {
      // Add new item with quantity capped at stock
      cartItem.quantity = Math.min(quantity, product.quantityInStock);
      items.push(cartItem);
    }

    // Update cart - insert if not exists, patch if exists
    const newCart = {
      userId,
      items,
      appliedCoupon: cart?.appliedCoupon ?? null,
      updatedAt: new Date().toISOString(),
    };

    if (cart) {
      await ctx.db.patch(cart._id, newCart);
    } else {
      await ctx.db.insert("carts", newCart);
    }

    // Return the added/updated item
    const updatedItem =
      existingIndex >= 0
        ? items[existingIndex]
        : items[items.length - 1];

    return {
      success: true,
      item: updatedItem,
    };
  },
});

/**
 * Remove item from cart.
 */
export const removeItem = mutation({
  args: {
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("יש להתחבר למערכת כדי להסיר מהעגלה");
    }

    const { productId } = args;

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!cart) {
      return { success: true };
    }

    const items = cart.items.filter(
      (item: CartItem) => item.productId !== productId
    );

    await ctx.db.patch(cart._id, {
      items,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

/**
 * Update item quantity in cart.
 * Validates stock availability. Removes item if quantity <= 0.
 */
export const updateQuantity = mutation({
  args: {
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("יש להתחבר למערכת כדי לעדכן כמות");
    }

    const { productId, quantity } = args;

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!cart) {
      throw new Error("העגלה ריקה");
    }

    const items = [...cart.items];

    if (quantity <= 0) {
      const filtered = items.filter(
        (item: CartItem) => item.productId !== productId
      );
      await ctx.db.patch(cart._id, {
        items: filtered,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    }

    const product = await ctx.db.get(productId) as ProductDoc | null;
    if (!product) {
      throw new Error("המוצר לא נמצא");
    }

    const index = items.findIndex(
      (item: CartItem) => item.productId === productId
    );
    if (index >= 0) {
      const actualQuantity = Math.min(quantity, product.quantityInStock);
      const wasAdjusted = actualQuantity !== quantity;

      items[index] = {
        ...items[index],
        quantity: actualQuantity,
        maxQuantity: product.quantityInStock,
      };

      await ctx.db.patch(cart._id, {
        items,
        updatedAt: new Date().toISOString(),
      });

      return {
        success: true,
        adjusted: wasAdjusted,
        availableQuantity: product.quantityInStock,
      };
    }

    throw new Error("המוצר לא נמצא בעגלה");
  },
});

/**
 * Clear all items from cart.
 */
export const clearCart = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("יש להתחבר למערכת כדי לרוקן את העגלה");
    }

    const cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (cart) {
      await ctx.db.patch(cart._id, {
        items: [],
        appliedCoupon: null,
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

/**
 * Merge guest cart on login.
 * Validates each item against current stock/price and returns sync result.
 */
export const mergeGuestCart = mutation({
  args: {
    guestItems: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("יש להתחבר למערכת");
    }

    const { guestItems } = args;

    // Get current cloud cart from carts table
    let cart = await ctx.db
      .query("carts")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    const cloudItems = cart?.items ?? [];

    // Track sync issues
    const skippedItems: { productId: string; productName: string; reason: string }[] = [];
    const priceChanges: { productId: string; productName: string; oldPrice: number; newPrice: number }[] = [];
    const adjustedItems: { productId: string; productName: string; requestedQty: number; availableQty: number }[] = [];

    // Merge items
    const merged = new Map<string, any>();

    // First add cloud items
    cloudItems.forEach((item) => {
      merged.set(item.productId, { ...item });
    });

    // Fetch all guest-item products in parallel (deduplicated)
    const uniqueProductIds = [
      ...new Set(guestItems.map((item) => item.productId as Id<"products">)),
    ];
    const productDocs = await Promise.all(
      uniqueProductIds.map((id) => ctx.db.get(id))
    );
    const productsById = new Map<string, ProductDoc | null>(
      uniqueProductIds.map((id, i) => [id, productDocs[i] as ProductDoc | null])
    );

    // Process guest items
    for (const guestItem of guestItems) {
      const productId = guestItem.productId as Id<"products">;

      // Validate against the prefetched product
      const product = productsById.get(productId) ?? null;

      if (!product) {
        // Product no longer exists
        skippedItems.push({
          productId,
          productName: guestItem.title || "מוצר לא ידוע",
          reason: "המוצר כבר אינו קיים במערכת",
        });
        continue;
      }

      if (product.status === "discontinued") {
        // Product discontinued
        skippedItems.push({
          productId,
          productName: product.productNameHe || product.productName,
          reason: "המוצר הופסק מהמכירה",
        });
        continue;
      }

      if (product.quantityInStock <= 0) {
        // Out of stock
        skippedItems.push({
          productId,
          productName: product.productNameHe || product.productName,
          reason: "המוצר אזל מהמלאי",
        });
        continue;
      }

      // Check for price changes
      const oldPrice = guestItem.price;
      const hasSale = product.salePrice && product.salePrice < product.price;
      const newPrice = hasSale ? product.salePrice! : product.price;
      if (oldPrice !== newPrice) {
        priceChanges.push({
          productId,
          productName: product.productNameHe || product.productName,
          oldPrice,
          newPrice,
        });
      }

      // Check quantity against stock
      let requestedQty = guestItem.quantity;
      let availableQty = product.quantityInStock;

      if (requestedQty > availableQty) {
        adjustedItems.push({
          productId,
          productName: product.productNameHe || product.productName,
          requestedQty,
          availableQty,
        });
        requestedQty = availableQty;
      }

      // Merge: take higher quantity between cloud and guest
      const existing = merged.get(productId);
      if (existing) {
        const newQuantity = Math.max(existing.quantity, requestedQty);
        merged.set(productId, {
          ...existing,
          quantity: newQuantity,
          maxQuantity: availableQty,
          price: newPrice,
          salePrice: product.salePrice,
        });
      } else {
        // Add new item from guest
        merged.set(productId, {
          id: `${productId}_${Date.now()}`,
          productId,
          title: product.productNameHe || product.productName,
          price: newPrice,
          salePrice: product.salePrice,
          originalPrice: hasSale ? product.price : undefined,
          quantity: requestedQty,
          maxQuantity: availableQty,
          imgSrc: product.featuredImage || "",
        });
      }
    }

    const mergedCart = Array.from(merged.values());

    const newCartData = {
      userId,
      items: mergedCart,
      appliedCoupon: cart?.appliedCoupon ?? null,
      updatedAt: new Date().toISOString(),
    };

    if (cart) {
      await ctx.db.patch(cart._id, newCartData);
    } else {
      await ctx.db.insert("carts", newCartData);
    }

    return {
      mergedCart,
      skippedItems,
      priceChanges,
      adjustedItems,
    };
  },
});
