/**
 * Single owner of order and payment state. Nothing else may patch `status`
 * on orders/paymentTransactions or touch stock; call these helpers instead.
 */
import { v } from "convex/values";
import { MutationCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { releaseCouponUsage } from "./coupons";
import { notifyAdmins } from "./notifications";

export const orderStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("shipped"),
  v.literal("completed"),
  v.literal("cancelled")
);
export type OrderStatus = Doc<"orders">["status"];

export const paymentStatusValidator = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);
export type PaymentStatus = Doc<"paymentTransactions">["status"];

const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
};

const PAYMENT_TRANSITIONS: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ["processing", "completed", "failed", "cancelled"],
  processing: ["completed", "failed", "cancelled"],
  // A customer may retry on the same payment page after a decline.
  failed: ["completed", "cancelled"],
  completed: [],
  // Cancelled transactions only accept late-arriving money so it is recorded, never re-opened.
  cancelled: ["completed"],
};

export const canTransitionOrder = (from: OrderStatus, to: OrderStatus) =>
  from === to || ORDER_TRANSITIONS[from].includes(to);

export const isPaymentTerminal = (status: PaymentStatus) => status === "completed";

/** Who may see or pay an order: admin, its active owner, or the holder of its secret token. */
export function hasOrderAccess(
  order: Doc<"orders">,
  user: Doc<"users"> | null,
  accessToken: string | undefined
): boolean {
  if (user?.role === "admin") return true;
  if (user?.status === "active" && order.customerId === user._id) return true;
  return order.accessToken !== undefined && accessToken !== undefined && accessToken === order.accessToken;
}

/** Decrement stock for every line, all-or-nothing within the mutation. */
export async function reserveStock(
  ctx: MutationCtx,
  lines: { productId: Id<"products">; quantity: number }[]
): Promise<void> {
  const totals = new Map<Id<"products">, number>();
  for (const line of lines) totals.set(line.productId, (totals.get(line.productId) ?? 0) + line.quantity);

  for (const [productId, quantity] of totals) {
    const product = await ctx.db.get(productId);
    if (!product) throw new Error("מוצר לא נמצא");
    if (product.status === "discontinued") throw new Error(`המוצר ${product.productName} הופסק מהמכירה`);
    if (product.quantityInStock < quantity) {
      throw new Error(`מלאי לא מספיק עבור ${product.productName}. זמין: ${product.quantityInStock}, נדרש: ${quantity}`);
    }
    await adjustStock(ctx, product, -quantity);
  }
}

async function adjustStock(ctx: MutationCtx, product: Doc<"products">, delta: number) {
  const quantityInStock = product.quantityInStock + delta;
  const stockStatus =
    quantityInStock <= 0 ? "out_of_stock" : product.stockStatus === "out_of_stock" ? "in_stock" : product.stockStatus;
  await ctx.db.patch(product._id, { quantityInStock, stockStatus, updatedAt: new Date().toISOString() });
}

async function releaseReservation(ctx: MutationCtx, order: Doc<"orders">) {
  if (order.stockReserved) {
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .collect();
    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (product) await adjustStock(ctx, product, item.quantity);
    }
  }
  if (order.appliedCouponCode) {
    await releaseCouponUsage(ctx, { code: order.appliedCouponCode, userEmail: order.customerEmail });
  }
}

/** Move an order to a new status; invalid moves throw, cancelling releases stock and coupon. */
export async function transitionOrder(ctx: MutationCtx, order: Doc<"orders">, to: OrderStatus): Promise<void> {
  if (order.status === to) return;
  if (!canTransitionOrder(order.status, to)) {
    throw new Error(`לא ניתן לשנות סטטוס הזמנה מ-${order.status} ל-${to}`);
  }
  if (to === "cancelled") {
    // A paid order was cancelled: alert admins so a manual iCredit refund can be arranged.
    if (order.status === "processing" || order.status === "shipped" || order.status === "completed") {
      await notifyAdmins(ctx, {
        type: "warning",
        title: "הזמנה ששולמה בוטלה",
        message: `הזמנה #${order.orderNumber} בוטלה לאחר תשלום - ₪${order.total.toLocaleString("he-IL")}. יש לבצע החזר ידני ב-iCredit.`,
      });
    }
    await releaseReservation(ctx, order);
    // Close any open payment pages so late IPNs cannot resurrect a cancelled order.
    const transactions = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_orderId", (q) => q.eq("orderId", order._id))
      .collect();
    for (const transaction of transactions) {
      if (transaction.status === "pending" || transaction.status === "processing" || transaction.status === "failed") {
        await ctx.db.patch(transaction._id, { status: "cancelled", updatedAt: new Date().toISOString() });
      }
    }
  }
  await ctx.db.patch(order._id, {
    status: to,
    ...(to === "cancelled" ? { stockReserved: false } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export type PaymentEvent =
  | {
      type: "succeeded";
      fields: Partial<
        Pick<
          Doc<"paymentTransactions">,
          "rivhitDocumentNumber" | "rivhitDocumentLink" | "rivhitCustomerId" | "rivhitConfirmationNumber" | "ipnData"
        >
      >;
    }
  | { type: "failed"; errorMessage: string; ipnData?: string };

/**
 * The only way a payment outcome changes state. Updates the transaction and,
 * on success, moves a pending order to processing in the same transaction.
 */
export async function applyPaymentEvent(
  ctx: MutationCtx,
  transaction: Doc<"paymentTransactions">,
  event: PaymentEvent
): Promise<{ applied: boolean }> {
  const next: PaymentStatus = event.type === "succeeded" ? "completed" : "failed";
  if (isPaymentTerminal(transaction.status) || !PAYMENT_TRANSITIONS[transaction.status].includes(next)) {
    return { applied: false };
  }
  const now = new Date().toISOString();

  if (event.type === "failed") {
    await ctx.db.patch(transaction._id, {
      status: "failed",
      errorMessage: event.errorMessage,
      ...(event.ipnData !== undefined ? { ipnData: event.ipnData } : {}),
      updatedAt: now,
    });
    return { applied: true };
  }

  const fields = Object.fromEntries(Object.entries(event.fields).filter(([, value]) => value !== undefined));
  await ctx.db.patch(transaction._id, { ...fields, status: "completed", errorMessage: undefined, updatedAt: now });

  const order = await ctx.db.get(transaction.orderId);
  if (order?.status === "pending") {
    await transitionOrder(ctx, order, "processing");
    // Notify admins that a payment succeeded (order is funded and ready to fulfill)
    await notifyAdmins(ctx, {
      type: "payment",
      title: "תשלום בוצע בהצלחה",
      message: `הזמנה #${order.orderNumber} - ₪${Number(transaction.amount).toLocaleString("he-IL")}`,
    });
  } else if (order?.status === "cancelled") {
    // Money was taken for an order we already released: flag it for the admin.
    await ctx.db.insert("activities", {
      title: `תשלום התקבל להזמנה מבוטלת #${order.orderNumber}`,
      subtitle: `${order.customerName} - ₪${order.total.toLocaleString("he-IL")}`,
      type: "order",
      color: "red.500",
      relatedId: String(order._id),
      createdAt: now,
    });
    await notifyAdmins(ctx, {
      type: "payment",
      title: "תשלום התקבל להזמנה מבוטלת",
      message: `הזמנה #${order.orderNumber} - ₪${transaction.amount.toLocaleString("he-IL")}. יש לבצע החזר ידני.`,
    });
  }
  return { applied: true };
}
