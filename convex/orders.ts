import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { adminMutation, adminQuery, requireActiveUser } from "./authHelpers";
import { getAuthUserId } from "@convex-dev/auth/server";
import { incrementCouponUsage } from "./coupons";
import { insertOrderActivity } from "./activities";
import { insertOrderNotification } from "./notifications";

const STARTING_ORDER_NUMBER = 1000;
const COUNTER_NAME = "orders";

async function getNextOrderNumber(ctx: MutationCtx): Promise<number> {
  const counter = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", COUNTER_NAME))
    .unique();

  if (!counter) {
    await ctx.db.insert("counters", {
      name: COUNTER_NAME,
      value: STARTING_ORDER_NUMBER,
    });
    return STARTING_ORDER_NUMBER;
  }

  const nextValue = counter.value + 1;
  await ctx.db.patch(counter._id, { value: nextValue });
  return nextValue;
}

/**
 * Create a new order.
 * This is the first step of checkout, creating the primary order document.
 */
export const create = mutation({
  args: {
    customerId: v.optional(v.id("users")),
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    customerAvatar: v.optional(v.string()),
    
    // Items
    items: v.array(v.object({
      productId: v.id("products"),
      productName: v.string(),
      productImage: v.optional(v.string()),
      price: v.float64(),
      quantity: v.int64(),
    })),

    // Pre-calculated totals from the cart rules engine
    // Prices already include VAT; shipping and discounts are calculated by cart rules
    subtotal: v.float64(),
    shippingCost: v.float64(),
    discount: v.float64(),
    total: v.float64(),

    // Shipping address (to be denormalized)
    shippingAddress: v.object({
      street: v.string(),
      apartment: v.optional(v.string()),
      city: v.string(),
      postalCode: v.string(),
      country: v.string(),
    }),

    // Payment info (to be denormalized)
    payment: v.object({
      method: v.string(),
      cardExpiry: v.optional(v.string()),
      transactionId: v.string(),
      chargeDate: v.string(),
    }),

    // Optional coupon info
    appliedCouponCode: v.optional(v.string()),
    appliedCouponDiscount: v.optional(v.float64()),
  },
  handler: async (ctx, args) => {
    // Never trust a client-supplied customer ID. Guest checkout remains supported.
    const authenticatedUserId = await getAuthUserId(ctx);
    const customer = authenticatedUserId ? await ctx.db.get(authenticatedUserId) : null;
    if (customer && customer.status !== "active") throw new Error("החשבון אינו פעיל");

    // Validate inventory before creating order (product reads run in parallel)
    const products = await Promise.all(
      args.items.map((item) => ctx.db.get(item.productId))
    );
    for (let i = 0; i < args.items.length; i++) {
      const item = args.items[i];
      const product = products[i];
      if (!product) {
        throw new Error(`מוצר לא נמצא: ${item.productName}`);
      }
      if (product.status === "discontinued") {
        throw new Error(`המוצר ${item.productName} הופסק מהמכירה`);
      }
      if (product.quantityInStock < item.quantity) {
        throw new Error(`מלאי לא מספיק עבור ${item.productName}. זמין: ${product.quantityInStock}, נדרש: ${item.quantity}`);
      }
    }

    // Price lines are derived from the product catalog, never client input.
    const normalizedItems = args.items.map((item, index) => {
      const product = products[index]!;
      const price = product.onSale && product.salePrice !== undefined ? product.salePrice : product.price;
      return { ...item, productName: product.productName, productImage: product.featuredImage, price };
    });
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * Number(item.quantity), 0);
    const shippingCost = args.shippingCost;
    const discount = args.discount;
    const total = subtotal + shippingCost - discount;
    if (total < 0 || Math.abs(total - args.total) > 0.01) throw new Error("סכום ההזמנה אינו תקין");

    // Tax is already included in product prices (Israeli standard: מחיר כולל מע"מ)
    const tax = 0;

    const now = new Date().toISOString();

    // Generate the next sequential order number
    const orderNumber = await getNextOrderNumber(ctx);

    // 5. Create Order Document
    const orderId = await ctx.db.insert("orders", {
      customerId: authenticatedUserId ?? undefined,
      customerName: customer?.name || args.customerName,
      customerEmail: customer?.email || args.customerEmail,
      customerPhone: customer?.phone || args.customerPhone,
      customerAvatar: args.customerAvatar,
      accessToken: crypto.randomUUID(),
      
      orderNumber,
      
      subtotal,
      tax,
      shippingCost,
      discount,
      total,

      // Denormalized address
      shippingStreet: args.shippingAddress.street,
      shippingApartment: args.shippingAddress.apartment,
      shippingCity: args.shippingAddress.city,
      shippingPostalCode: args.shippingAddress.postalCode,
      shippingCountry: args.shippingAddress.country,

      // Denormalized payment
      paymentMethod: args.payment.method,
      paymentCardExpiry: args.payment.cardExpiry,
      paymentTransactionId: args.payment.transactionId,
      paymentChargeDate: args.payment.chargeDate,

      status: "pending",
      appliedCouponCode: args.appliedCouponCode,
      appliedCouponDiscount: args.appliedCouponDiscount,

      createdAt: now,
      updatedAt: now,
    });

    // 6. Create Order Items
    for (const item of normalizedItems) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price: item.price,
        quantity: Number(item.quantity),
        total: item.price * Number(item.quantity),
      });
    }

    // 7. Increment Coupon Usage
    // Helpers are called directly (same transaction) instead of via
    // ctx.runMutation, avoiding nested-transaction overhead.
    if (args.appliedCouponCode) {
      await incrementCouponUsage(ctx, {
        code: args.appliedCouponCode,
        userEmail: customer?.email || args.customerEmail,
        userId: authenticatedUserId ?? undefined,
      });
    }

    // 8. Create activity entry for the new order
    await insertOrderActivity(ctx, {
      orderNumber,
      customerName: customer?.name || args.customerName,
      total,
    });

    const order = await ctx.db.get(orderId);
    return { orderId, accessToken: order!.accessToken! };
  },
});

/**
 * Get a single order with its items joined.
 * Admin-only query - order details include sensitive payment and customer information.
 */
export const get = adminQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();

    return {
      ...order,
      items,
    };
  },
});

/**
 * Get order details for storefront (order confirmation page).
 * Public access - no admin required. The order ID acts as a capability.
 */
export const getPublic = query({
  args: { orderId: v.id("orders"), accessToken: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const currentUserId = await getAuthUserId(ctx);
    const currentUser = currentUserId ? await ctx.db.get(currentUserId) : null;
    const hasAccess = currentUser?.role === "admin" || (currentUser?.status === "active" && order.customerId === currentUserId) || (args.accessToken !== undefined && args.accessToken === order.accessToken);
    if (!hasAccess) throw new Error("גישה נדחתה");

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();

    return {
      ...order,
      items,
    };
  },
});

/**
 * List orders for a specific customer email.
 * Used for storefront order history.
 */
export const listByCustomer = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireActiveUser(ctx);
    return await ctx.db
      .query("orders")
      .withIndex("by_customerId", (q) => q.eq("customerId", user._id))
      .order("desc")
      .collect();
  },
});

/**
 * Get an order by its orderNumber (short ID like 1001).
 * Admin-only query.
 */
export const getByOrderNumber = adminQuery({
  args: { orderNumber: v.number() },
  handler: async (ctx, args) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderNumber", (q) => q.eq("orderNumber", args.orderNumber))
      .unique();

    if (!order) return null;

    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .collect();

    return {
      ...order,
      items,
    };
  },
});

/**
 * List all orders for admin with pagination.
 * Supports status filtering.
 */
export const listAll = adminQuery({
  args: { 
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("shipped")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    
    let results;
    if (args.status) {
      results = await ctx.db
        .query("orders")
        .withIndex("by_status", (qi) => qi.eq("status", args.status!))
        .order("desc")
        .take(limit);
    } else {
      results = await ctx.db.query("orders").order("desc").take(limit);
    }
    
    return results;
  },
});

/**
 * Backfill orderNumber for existing orders that don't have one.
 * Assigns sequential numbers starting from STARTING_ORDER_NUMBER.
 * Admin-only mutation - run once to migrate existing orders.
 */
export const backfillOrderNumbers = adminMutation({
  args: {},
  handler: async (ctx) => {
    // Get all orders without an orderNumber, sorted by createdAt
    const ordersWithoutNumber = await ctx.db
      .query("orders")
      .order("asc")
      .collect();

    let nextNumber = STARTING_ORDER_NUMBER;
    let updatedCount = 0;

    for (const order of ordersWithoutNumber) {
      if (order.orderNumber === undefined) {
        await ctx.db.patch(order._id, {
          orderNumber: nextNumber,
          updatedAt: new Date().toISOString(),
        });
        nextNumber++;
        updatedCount++;
      }
    }

    return { updatedCount, nextOrderNumber: nextNumber };
  },
});

/**
 * Update order status.
 * Admin-only mutation.
 */
export const updateStatus = adminMutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("shipped")
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();

    // Get order details before updating
    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    await ctx.db.patch(args.orderId, {
      status: args.status,
      updatedAt: now,
    });

    // Map status to activity/notification status
    const statusMap: Record<string, string> = {
      pending: "placed",
      processing: "processing",
      shipped: "shipped",
      completed: "completed",
      cancelled: "cancelled",
    };

    // Create activity entry for status change
    const status = args.status as "pending" | "processing" | "completed" | "cancelled" | "shipped";
    
    const statusLabels: Record<string, { title: string; color: string }> = {
      pending: { title: `הזמנה #${order.orderNumber} נוצרה`, color: "blue.500" },
      processing: { title: `הזמנה #${order.orderNumber} בעיבוד`, color: "orange.500" },
      shipped: { title: `הזמנה #${order.orderNumber} נשלחה`, color: "cyan.500" },
      completed: { title: `הזמנה #${order.orderNumber} הושלמה`, color: "green.500" },
      cancelled: { title: `הזמנה #${order.orderNumber} בוטלה`, color: "red.500" },
    };

    const statusInfo = statusLabels[status];
    if (statusInfo) {
      // Create activity entry
      await ctx.db.insert("activities", {
        title: statusInfo.title,
        subtitle: `${order.customerName} - ₪${order.total.toLocaleString("he-IL")}`,
        type: "order",
        color: statusInfo.color || "blue.500",
        relatedId: String(args.orderId),
        createdAt: now,
      });

      // Create notification for the customer if they have a userId
      if (order.customerId) {
        const orderStatus = statusMap[status] || "placed";
        await insertOrderNotification(ctx, {
          userId: order.customerId,
          orderNumber: order.orderNumber || 0,
          customerName: order.customerName,
          total: order.total,
          status: orderStatus,
        });
      }
    }
  },
});
