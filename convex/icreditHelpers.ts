/**
 * Rivhit Helper Functions (non-node)
 * 
 * These are internal queries and mutations used by the Rivhit action
 * and HTTP handlers. They are in a separate file because they don't
 * need Node.js runtime.
 */

import { v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// ============================================================================
// Public Queries
// ============================================================================

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
    const hasAccess = user?.role === "admin" || (user?.status === "active" && order.customerId === userId) || args.accessToken === order.accessToken;
    if (!hasAccess) throw new Error("גישה נדחתה");
    const transaction = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_orderId", (q) => q.eq("orderId", args.orderId))
      .order("desc")
      .first();

    return transaction;
  },
});

// ============================================================================
// Internal Queries (used by createPaymentPage action)
// ============================================================================

export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => ctx.db.get(args.userId),
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

// ============================================================================
// Internal Mutations (used by createPaymentPage action and IPN handler)
// ============================================================================

/**
 * Internal mutation to create a payment transaction record.
 */
export const createPaymentTransaction = internalMutation({
  args: {
    orderId: v.id("orders"),
    amount: v.number(),
    environment: v.string(),
    status: v.string(),
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
    status: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
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
 * Handle IPN (Instant Payment Notification) from iCredit.
 * 
 * iCredit sends IPN data containing:
 * - Status: 0 = success, other = error
 * - Custom1: Our order context JSON (orderId, paymentTransactionId)
 * - Token: Sale token for verification
 * - DocumentNum, DocumentURL, ReceiptNum, ReceiptURL: Invoice/receipt info
 * 
 * This internal mutation:
 * 1. Parses the raw IPN body
 * 2. Extracts order and payment info from Custom1
 * 3. Updates the payment transaction status
 * 4. Updates the order status if payment is successful
 */
export const handleIpnNotification = internalMutation({
  args: {
    rawBody: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[iCredit IPN] Processing notification:", args.rawBody);

    try {
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

      console.log("[iCredit IPN] Parsed data:", JSON.stringify(ipnData));

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

      const orderId = orderContext.orderId as Id<"orders"> | undefined;
      const paymentTransactionId = orderContext.paymentTransactionId as Id<"paymentTransactions"> | undefined;

      if (!paymentTransactionId) {
        console.error("[iCredit IPN] No paymentTransactionId in Custom1 data");
        return { success: false, error: "Missing paymentTransactionId" };
      }

      // Get the payment transaction
      const paymentTransaction = await ctx.db.get(paymentTransactionId);
      if (!paymentTransaction) {
        console.error("[iCredit IPN] Payment transaction not found:", paymentTransactionId);
        return { success: false, error: "Payment transaction not found" };
      }

      // SECURITY: Verify payment is in pending status (not already processed)
      if (paymentTransaction.status !== "pending") {
        console.error("[iCredit IPN] Payment transaction already processed:", paymentTransaction.status);
        return { success: false, error: "Payment already processed" };
      }

      // SECURITY: Verify the order exists and amount matches (prevent price manipulation)
      if (orderId) {
        const order = await ctx.db.get(orderId);
        if (!order) {
          console.error("[iCredit IPN] Order not found:", orderId);
          return { success: false, error: "Order not found" };
        }

        // Verify amount matches to prevent tampering
        const ipnAmount = Number(ipnData.Amount || ipnData.amount || 0);
        if (ipnAmount > 0 && Math.abs(ipnAmount - paymentTransaction.amount) > 0.01) {
          console.error("[iCredit IPN] Amount mismatch:", ipnAmount, "vs", paymentTransaction.amount);
          return { success: false, error: "Amount mismatch - possible tampering" };
        }
      }

      // Require the token stored when the payment page was created.
      const ipnToken = ipnData.Token || ipnData.token || ipnData.PrivateSaleToken;
      if (!ipnToken || !paymentTransaction.ipnData) {
        return { success: false, error: "Missing payment verification token" };
      }
      try {
        const storedData = JSON.parse(paymentTransaction.ipnData);
        const storedToken = storedData.privateSaleToken;
        if (!storedToken || storedToken !== ipnToken) {
          console.error("[iCredit IPN] Token mismatch");
          return { success: false, error: "Invalid token - possible spoofed IPN" };
        }
      } catch {
        return { success: false, error: "Invalid payment verification data" };
      }

      // Determine payment status from iCredit response
      // iCredit uses TransactionStatus field: 0 = success, other values = error codes
      const rawStatus = ipnData.TransactionStatus ?? ipnData.transactionStatus ?? ipnData.Status ?? ipnData.status;
      const status = Number(rawStatus ?? -1);
      const isSuccess = status === 0;
      
      console.log("[iCredit IPN] Raw TransactionStatus:", rawStatus, "Parsed Status:", status, "isSuccess:", isSuccess);
      console.log("[iCredit IPN] All IPN fields:", Object.keys(ipnData).join(", "));
      
      // Get error message if present
      const errorMsg = ipnData.ErrorMessage ?? ipnData.ErrorDescription ?? ipnData.errorMessage;

      const now = new Date().toISOString();

      if (isSuccess) {
        // Payment successful - update transaction with iCredit document info
        await ctx.db.patch(paymentTransactionId, {
          status: "completed",
          ipnData: args.rawBody,
          // iCredit document fields (PascalCase)
          rivhitDocumentNumber: Number(ipnData.DocumentNum ?? ipnData.ReceiptNum) || undefined,
          rivhitDocumentLink: (ipnData.DocumentURL ?? ipnData.ReceiptURL) as string | undefined,
          rivhitCustomerId: Number(ipnData.CustomerId) || undefined,
          // Store the sale token for future reference (refunds, etc.)
          rivhitConfirmationNumber: undefined, // Not used in iCredit
          updatedAt: now,
        });

        // Update order status to processing
        if (orderId) {
          await ctx.db.patch(orderId, {
            status: "processing",
            updatedAt: now,
          });
        }

        console.log("[iCredit IPN] Payment completed successfully for order:", orderId);
        return { success: true };
      } else {
        // Payment failed
        const errorMessage = (errorMsg ?? ipnData.client_message ?? ipnData.debug_message ?? "Payment failed") as string;
        await ctx.db.patch(paymentTransactionId, {
          status: "failed",
          ipnData: args.rawBody,
          errorMessage,
          updatedAt: now,
        });

        console.log("[iCredit IPN] Payment failed for order:", orderId, "Error:", errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("[iCredit IPN] Error processing notification:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  },
});
