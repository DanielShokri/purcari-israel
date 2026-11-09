import { v } from "convex/values";
import { internalMutation, mutation, query, MutationCtx } from "./_generated/server";
import { adminMutation, adminQuery, requireActiveUser } from "./authHelpers";
import { getAuthUserId } from "@convex-dev/auth/server";
import { incrementCouponUsage, evaluateCoupon, normalizeEmail } from "./coupons";
import { calculateCartTotals } from "./pricing";
import { loadActiveCartRules } from "./cartRules";
import { hasOrderAccess, OrderStatus, reserveStock, transitionOrder } from "./orderLifecycle";
import { insertOrderActivity } from "./activities";
import { insertOrderNotification, notifyAdmins } from "./notifications";

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
    
    // Prices, shipping and discounts are computed server-side; `total` is only
    // the amount the customer saw, used to detect stale carts.
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.int64(),
    })),
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
  },
  handler: async (ctx, args) => {
    // Never trust a client-supplied customer ID. Guest checkout remains supported.
    const authenticatedUserId = await getAuthUserId(ctx);
    const customer = authenticatedUserId ? await ctx.db.get(authenticatedUserId) : null;
    if (customer && customer.status !== "active") throw new Error("החשבון אינו פעיל");

    const products = await Promise.all(args.items.map((item) => ctx.db.get(item.productId)));
    const pricingItems = args.items.map((item, index) => {
      const product = products[index];
      if (!product) throw new Error("מוצר לא נמצא");
      return {
        productId: product._id,
        title: product.productName,
        price: product.price,
        salePrice: product.onSale && product.salePrice !== undefined ? product.salePrice : undefined,
        quantity: Number(item.quantity),
      };
    });

    // Every price line comes from the catalog and the active cart rules, never the client.
    const totals = calculateCartTotals(pricingItems, await loadActiveCartRules(ctx));
    const customerEmail = normalizeEmail(customer?.email || args.customerEmail);

    let couponDiscount = 0;
    if (args.appliedCouponCode) {
      const evaluation = await evaluateCoupon(ctx, {
        code: args.appliedCouponCode,
        subtotal: totals.subtotal,
        itemCount: totals.itemCount,
        userEmail: customerEmail,
        userId: authenticatedUserId ?? undefined,
      });
      if ("error" in evaluation) throw new Error(evaluation.error);
      couponDiscount = evaluation.discountAmount;
    }

    const round2 = (n: number) => Math.round(n * 100) / 100;
    const subtotal = round2(totals.subtotal);
    const shippingCost = totals.shippingCost;
    const discount = round2(totals.discount + couponDiscount);
    const total = Math.max(0, round2(subtotal + shippingCost - discount));
    if (Math.abs(total - args.total) > 0.01) throw new Error("המחירים עודכנו, נא לרענן את העגלה");

    await reserveStock(ctx, pricingItems);

    // Tax is already included in product prices (Israeli standard: מחיר כולל מע"מ)
    const tax = 0;

    const now = new Date().toISOString();

    // Generate the next sequential order number
    const orderNumber = await getNextOrderNumber(ctx);

    // 5. Create Order Document
    const orderId = await ctx.db.insert("orders", {
      customerId: authenticatedUserId ?? undefined,
      customerName: customer?.name || args.customerName,
      customerEmail,
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
      appliedCouponCode: args.appliedCouponCode?.toUpperCase(),
      appliedCouponDiscount: args.appliedCouponCode ? couponDiscount : undefined,
      stockReserved: true,

      createdAt: now,
      updatedAt: now,
    });

    for (const [index, item] of pricingItems.entries()) {
      await ctx.db.insert("orderItems", {
        orderId,
        productId: item.productId,
        productName: item.title,
        productImage: products[index]?.featuredImage,
        price: item.salePrice ?? item.price,
        quantity: item.quantity,
        total: (item.salePrice ?? item.price) * item.quantity,
      });
    }

    // Increment coupon usage by calling the helper directly (same transaction),
    // avoiding ctx.runMutation overhead.
    if (args.appliedCouponCode) {
      await incrementCouponUsage(ctx, {
        code: args.appliedCouponCode,
        userEmail: customerEmail,
        userId: authenticatedUserId ?? undefined,
      });
    }

    // 8. Create activity entry for the new order
    await insertOrderActivity(ctx, {
      orderNumber,
      customerName: customer?.name || args.customerName,
      total,
    });

    // 9. Notify every admin about the new order (notification bell)
    await notifyAdmins(ctx, {
      type: "order",
      title: "הזמנה חדשה התקבלה",
      message: `הזמנה #${orderNumber} מ${customer?.name || args.customerName} - ₪${total.toLocaleString("he-IL")}`,
      orderId,
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
    const hasAccess = hasOrderAccess(order, currentUser, args.accessToken);
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
 * Backfill orderNumber for existing orders without one, using the
 * shared counter so numbers never collide. Admin-only, run once.
 */
export const backfillOrderNumbers = adminMutation({
  args: {},
  handler: async (ctx) => {
    // Get all orders without an orderNumber, sorted by createdAt
    const ordersWithoutNumber = await ctx.db
      .query("orders")
      .order("asc")
      .collect();

    let updatedCount = 0;

    for (const order of ordersWithoutNumber) {
      if (order.orderNumber === undefined) {
        await ctx.db.patch(order._id, {
          orderNumber: await getNextOrderNumber(ctx),
          updatedAt: new Date().toISOString(),
        });
        updatedCount++;
      }
    }

    return { updatedCount };
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

    const order = await ctx.db.get(args.orderId);
    if (!order) {
      throw new Error("Order not found");
    }
    if (order.status === args.status) return;

    // adminMutation erases arg types, hence the cast.
    await transitionOrder(ctx, order, args.status as OrderStatus);

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

const PENDING_ORDER_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Cancel orders that were never paid, releasing their stock and coupon.
 * Run hourly; a late payment still completes its transaction and is flagged.
 */
export const expireStalePendingOrders = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MS).toISOString();
    const stale = await ctx.db
      .query("orders")
      .withIndex("by_status_createdAt", (q) => q.eq("status", "pending").lt("createdAt", cutoff))
      .take(50);
    for (const order of stale) await transitionOrder(ctx, order, "cancelled");
    return { expired: stale.length };
  },
});
