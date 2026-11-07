import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Add items to an existing order. Internal only - called by orders.ts
 */
export const create = internalMutation({
  args: {
    orderId: v.id("orders"),
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      productImage: v.optional(v.string()),
      variant: v.optional(v.string()),
      quantity: v.int64(),
      price: v.float64(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const item of args.items) {
      const total = Math.round(item.price * Number(item.quantity) * 100) / 100;
      
      const itemId = await ctx.db.insert("orderItems", {
        orderId: args.orderId,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        variant: item.variant,
        quantity: Number(item.quantity),
        price: item.price,
        total: total,
      });
      
      results.push(itemId);
    }
    
    return results;
  },
});

/**
 * List items for a specific order.
 */
export const listByOrder = query({
  args: { orderId: v.id("orders"), accessToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return [];
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    const hasAccess = user?.role === "admin" || (user?.status === "active" && order.customerId === userId) || args.accessToken === order.accessToken;
    if (!hasAccess) throw new Error("גישה נדחתה");
    return await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
  },
});
