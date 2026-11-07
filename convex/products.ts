import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { adminMutation } from "./authHelpers";
import { Id } from "./_generated/dataModel";

/**
 * List products with optional filtering and pagination.
 */
export const list = query({
  args: {
    category: v.optional(v.string()),
    wineType: v.optional(
      v.union(
        v.literal("Red"),
        v.literal("White"),
        v.literal("Rosé"),
        v.literal("Sparkling")
      )
    ),
    onSale: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
    stockStatus: v.optional(
      v.union(
        v.literal("in_stock"),
        v.literal("out_of_stock"),
        v.literal("low_stock")
      )
    ),
    relatedProducts: v.optional(v.array(v.id("products"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    let results;
    if (args.category) {
      const category = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", args.category!))
        .unique();

      if (category) {
        results = await ctx.db
          .query("products")
          .withIndex("by_category", (idx) => idx.eq("category", category._id))
          .take(limit);
      } else {
        return [];
      }
    } else {
      results = await ctx.db.query("products").take(limit);
    }

    let filtered = results;

    if (args.wineType) {
      filtered = filtered.filter((p) => p.wineType === args.wineType);
    }
    if (args.onSale !== undefined) {
      filtered = filtered.filter((p) => p.onSale === args.onSale);
    }
    if (args.isFeatured !== undefined) {
      filtered = filtered.filter((p) => p.isFeatured === args.isFeatured);
    }
    if (args.stockStatus) {
      filtered = filtered.filter((p) => p.stockStatus === args.stockStatus);
    }

    return filtered;
  },
});

/**
 * Track an analytics event.
 */
export const trackEvent = internalMutation({
  args: {
    event: v.string(),
    properties: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("analyticsEvents", {
      event: args.event,
      properties: args.properties,
      timestamp: Date.now(),
    });
  },
});

/**
 * Get product by ID.
 */
export const getById = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.productId);
  },
});

/**
 * Search products using bilingual indexes.
 * Returns active products matching the search query in either Hebrew or English.
 */
export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const searchQuery = args.query.trim();
    if (!searchQuery) {
      return [];
    }

    // Search both Hebrew and English indexes in parallel
    const [productsHe, productsEn] = await Promise.all([
      ctx.db
        .query("products")
        .withSearchIndex("search_he", (q) => q.search("productNameHe", searchQuery))
        .collect(),
      ctx.db
        .query("products")
        .withSearchIndex("search_en", (q) => q.search("productName", searchQuery))
        .collect(),
    ]);

    // Combine and deduplicate results
    const productMap = new Map();
    [...productsHe, ...productsEn].forEach((p) => {
      if (!productMap.has(p._id)) {
        productMap.set(p._id, p);
      }
    });

    // Filter by active status
    const activeProducts = Array.from(productMap.values()).filter(
      (p) => p.status === "active"
    );

    return activeProducts;
  },
});

/**
 * Get related products.
 */
export const getRelated = query({
  args: {
    productId: v.id("products"),
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Cast string category to Id<"categories"> for index query
    const categoryId = args.category as Id<"categories">;
    const related = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", categoryId))
      .filter((q) => q.neq(q.field("_id"), args.productId))
      .take(args.limit || 4);
    return related;
  },
});

/**
 * Validate stock for checkout.
 */
export const validateStock = query({
  args: {
    items: v.array(
      v.object({
        productId: v.id("products"),
        quantity: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const results = [];
    let valid = true;

    // Fetch all products in parallel
    const products = await Promise.all(
      args.items.map((item) => ctx.db.get(item.productId))
    );

    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      const product = products[i];
      if (!product || Number(product.quantityInStock) < item.quantity) {
        valid = false;
        results.push({
          productId: item.productId,
          available: product ? Number(product.quantityInStock) : 0,
          status: product ? product.stockStatus : "missing",
        });
      }
    }

    return { valid, issues: results };
  },
});

/**
 * Admin: Create/Update/Delete - Protected by adminMutation
 */
export const create = adminMutation({
  args: {
    productName: v.string(),
    productNameHe: v.optional(v.string()),
    price: v.float64(),
    quantityInStock: v.int64(),
    sku: v.string(),
    category: v.id("categories"),
    description: v.optional(v.string()),
    descriptionHe: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    shortDescriptionHe: v.optional(v.string()),
    salePrice: v.optional(v.float64()),
    onSale: v.optional(v.boolean()),
    wineType: v.optional(
      v.union(
        v.literal("Red"),
        v.literal("White"),
        v.literal("Rosé"),
        v.literal("Sparkling")
      )
    ),
    region: v.optional(v.string()),
    vintage: v.optional(v.number()),
    alcoholContent: v.optional(v.float64()),
    volume: v.optional(v.string()),
    grapeVariety: v.optional(v.string()),
    servingTemperature: v.optional(v.string()),
    tastingNotes: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    isFeatured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    relatedProducts: v.optional(v.array(v.id("products"))),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("hidden"),
        v.literal("discontinued")
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("products", {
      ...args,
      stockStatus: Number(args.quantityInStock) > 0 ? "in_stock" : "out_of_stock",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
});

export const update = adminMutation({
  args: {
    id: v.id("products"),
    productName: v.optional(v.string()),
    productNameHe: v.optional(v.string()),
    price: v.optional(v.float64()),
    quantityInStock: v.optional(v.number()),
    sku: v.optional(v.string()),
    category: v.optional(v.id("categories")),
    description: v.optional(v.string()),
    descriptionHe: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    shortDescriptionHe: v.optional(v.string()),
    salePrice: v.optional(v.float64()),
    onSale: v.optional(v.boolean()),
    wineType: v.optional(
      v.union(
        v.literal("Red"),
        v.literal("White"),
        v.literal("Rosé"),
        v.literal("Sparkling")
      )
    ),
    region: v.optional(v.string()),
    vintage: v.optional(v.number()),
    alcoholContent: v.optional(v.float64()),
    volume: v.optional(v.string()),
    grapeVariety: v.optional(v.string()),
    servingTemperature: v.optional(v.string()),
    tastingNotes: v.optional(v.string()),
    featuredImage: v.optional(v.string()),
    images: v.optional(v.array(v.string())),
    isFeatured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    relatedProducts: v.optional(v.array(v.id("products"))),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("hidden"),
        v.literal("discontinued")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    const updates: any = { ...fields, updatedAt: new Date().toISOString() };
    
    if (fields.quantityInStock !== undefined) {
      updates.stockStatus = Number(fields.quantityInStock) > 0 ? "in_stock" : "out_of_stock";
    }

    await ctx.db.patch(id, updates);
  },
});

export const remove = adminMutation({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
