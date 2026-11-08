/**
 * Internal queries and mutations for the iCredit action and HTTP handlers,
 * kept separate because they don't need the Node.js runtime.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { applyPaymentEvent, hasOrderAccess, paymentStatusValidator } from "./orderLifecycle";

// Public Queries

/**
 * Get payment transaction for an order.
 */
export const getPaymentByOrderId = query({
  args: {
    orderId: v.id("orders"),
    accessToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;
    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.db.get(userId) : null;
    if (!hasOrderAccess(order, user, args.accessToken)) throw new Error("גישה נדחתה");
    const transaction = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .order("desc")
      .first();

    return transaction;
  },
});

// Internal Queries (used by createPaymentPage action)

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
});

/**
 * Latest payment transaction for an order, readable from a node action
 * (the public query enforces user auth, which an action cannot do).
 */
export const getLatestPaymentTransaction = internalQuery({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentTransactions")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .order("desc")
      .first();
  },
});

/**
 * Internal query to get order by ID (for use in actions).
 */
export const getOrderById = internalQuery({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.orderId);
  },
});

/**
 * Internal query to get order items (for use in actions).
 */
export const getOrderItems = internalQuery({
  args: {
    orderId: v.id("orders"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("orderItems")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .collect();
  },
});

// Internal Mutations (used by createPaymentPage action and IPN handler)

/**
 * Internal mutation to create a payment transaction record.
 */
export const createPaymentTransaction = internalMutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    environment: v.string(),
    status: paymentStatusValidator,
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("paymentTransactions", {
      orderId: args.orderId,
      amount: args.amount,
      environment: args.environment,
      status: args.status,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Internal mutation to update a payment transaction record.
 */
export const updatePaymentTransaction = internalMutation({
  args: {
    paymentTransactionId: v.id("paymentTransactions"),
    rivhitPaymentUrl: v.optional(v.string()),
    rivhitDocumentNumber: v.optional(v.number()),
    rivhitDocumentLink: v.optional(v.string()),
    rivhitCustomerId: v.optional(v.number()),
    rivhitConfirmationNumber: v.optional(v.number()),
    ipnData: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { paymentTransactionId, ...updates } = args;
    const now = new Date().toISOString();

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = { updatedAt: now };
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(paymentTransactionId, cleanUpdates);
  },
});

/**
 * Apply a payment outcome (success or failure) through the lifecycle, which
 * handles transitions, terminal-state idempotency and the order side atomically.
 */
export const applyPaymentOutcome = internalMutation({
  args: {
    paymentTransactionId: v.id("paymentTransactions"),
    outcome: v.union(
      v.object({
        type: v.literal("succeeded"),
        fields: v.object({
          rivhitDocumentNumber: v.optional(v.number()),
          rivhitDocumentLink: v.optional(v.string()),
          rivhitCustomerId: v.optional(v.number()),
          rivhitConfirmationNumber: v.optional(v.number()),
          ipnData: v.optional(v.string()),
        }),
      }),
      v.object({
        type: v.literal("failed"),
        errorMessage: v.string(),
        ipnData: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.paymentTransactionId);
    if (!transaction) throw new Error("Payment transaction not found");
    return applyPaymentEvent(ctx, transaction, args.outcome);
  },
});

/**
 * Handle an iCredit IPN: parse the body, find the transaction via Custom1,
 * update payment status and move the order to processing on success. Only
 * business rejections return {success:false}; unexpected errors throw so the
 * HTTP layer answers 500 and iCredit retries the delivery.
 */
export const handleIpnNotification = internalMutation({
  args: {
    rawBody: v.string(),
  },
  handler: async (ctx, args) => {
    // Parse the IPN data - iCredit sends JSON or form-urlencoded
    let ipnData: Record<string, unknown>;

    // Try JSON first
    try {
      ipnData = JSON.parse(args.rawBody);
    } catch {
      // Try form-urlencoded
      const params = new URLSearchParams(args.rawBody);
      ipnData = Object.fromEntries(params.entries());
    }

    // Extract our custom data from Custom1 field (contains orderId and paymentTransactionId)
    let orderContext: { orderId?: string; paymentTransactionId?: string } = {};
    const custom1 = ipnData.Custom1 || ipnData.custom1;
    if (custom1 && typeof custom1 === "string") {
      try {
        orderContext = JSON.parse(custom1);
      } catch {
        console.error("[iCredit IPN] Failed to parse Custom1");
      }
    }

    if (!orderContext.paymentTransactionId) {
      console.error("[iCredit IPN] No paymentTransactionId in Custom1 data");
      return { success: false, error: "Missing paymentTransactionId" };
    }

    // Validate the id instead of casting, so a forged or malformed id is rejected.
    const paymentTransactionId = ctx.db.normalizeId("paymentTransactions", orderContext.paymentTransactionId);
    if (!paymentTransactionId) {
      return { success: false, error: "Invalid paymentTransactionId" };
    }

    const paymentTransaction = await ctx.db.get(paymentTransactionId);
    if (!paymentTransaction) {
      console.error("[iCredit IPN] Payment transaction not found");
      return { success: false, error: "Payment transaction not found" };
    }

    // If Custom1 also carries an orderId it must match the transaction's own order.
    if (orderContext.orderId && orderContext.orderId !== paymentTransaction.orderId) {
      return { success: false, error: "Order mismatch" };
    }

    // Require the token stored when the payment page was created.
    const ipnToken = ipnData.Token || ipnData.token || ipnData.PrivateSaleToken;
    if (!ipnToken || !paymentTransaction.ipnData) {
      return { success: false, error: "Missing payment verification token" };
    }
    let storedData: Record<string, unknown>;
    try {
      storedData = JSON.parse(paymentTransaction.ipnData);
    } catch {
      return { success: false, error: "Invalid payment verification data" };
    }
    const storedToken = storedData.privateSaleToken;
    if (!storedToken || storedToken !== ipnToken) {
      console.error("[iCredit IPN] Token mismatch");
      return { success: false, error: "Invalid token - possible spoofed IPN" };
    }

    // Amount check to prevent tampering (only when the IPN reports a positive amount)
    const ipnAmount = Number(ipnData.Amount || ipnData.amount || 0);
    if (ipnAmount > 0 && Math.abs(ipnAmount - paymentTransaction.amount) > 0.01) {
      console.error("[iCredit IPN] Amount mismatch");
      return { success: false, error: "Amount mismatch - possible tampering" };
    }

    // Determine payment status from iCredit (TransactionStatus: 0 = success)
    const rawStatus = ipnData.TransactionStatus ?? ipnData.transactionStatus ?? ipnData.Status ?? ipnData.status;
    const isSuccess = Number(rawStatus ?? -1) === 0;

    // Keep the stored data (privateSaleToken etc.) and append the raw IPN payload.
    const mergedIpnData = JSON.stringify({ ...storedData, ipn: ipnData });
    const errorMessage = (ipnData.ErrorMessage ??
      ipnData.ErrorDescription ??
      ipnData.errorMessage ??
      ipnData.client_message ??
      ipnData.debug_message ??
      "Payment failed") as string;

    const result = await applyPaymentEvent(
      ctx,
      paymentTransaction,
      isSuccess
        ? {
            type: "succeeded",
            fields: {
              // iCredit document fields (PascalCase)
              rivhitDocumentNumber: Number(ipnData.DocumentNum ?? ipnData.ReceiptNum) || undefined,
              rivhitDocumentLink: (ipnData.DocumentURL ?? ipnData.ReceiptURL) as string | undefined,
              rivhitCustomerId: Number(ipnData.CustomerId) || undefined,
              ipnData: mergedIpnData,
            },
          }
        : {
            type: "failed",
            errorMessage,
            ipnData: mergedIpnData,
          }
    );

    if (!result.applied) {
      return { success: false, error: "Payment already processed" };
    }

    return isSuccess ? { success: true } : { success: false, error: errorMessage };
  },
});
