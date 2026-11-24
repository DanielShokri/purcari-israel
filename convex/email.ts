import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./authHelpers";
import { sendEmail } from "./lib/email";
import { orderConfirmationEmail, testEmail } from "./lib/emailTemplates";

const TEST_RECIPIENT = "danielshokri@gmail.com";

/** Admin check usable from actions (actions have no ctx.db). */
export const assertAdmin = internalQuery({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return true;
  },
});

/** Sends the test email to the owner. Admin-only. Returns the Unosend email id. */
export const sendTestEmail = action({
  args: {},
  handler: async (ctx): Promise<{ id: string }> => {
    await ctx.runQuery(internal.email.assertAdmin, {});
    const { subject, html, text } = testEmail();
    const id = await sendEmail({ to: TEST_RECIPIENT, subject, html, text });
    console.log(`[email] test email sent, unosend id=${id}`);
    return { id };
  },
});

export const markConfirmationSent = internalMutation({
  args: { orderId: v.id("orders"), emailId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, { confirmationEmailSentAt: new Date().toISOString(), confirmationEmailId: args.emailId });
  },
});

/**
 * Order confirmation. Scheduled only after a payment is confirmed. Never sends
 * unless a completed payment transaction exists, and never twice for an order.
 */
export const sendOrderConfirmation = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(internal.icreditHelpers.getOrderById, { orderId: args.orderId });
    if (!order) return;
    if (order.confirmationEmailSentAt) return; // dedupe: Unosend has no idempotency
    const tx = await ctx.runQuery(internal.icreditHelpers.getLatestPaymentTransaction, { orderId: args.orderId });
    if (!tx || tx.status !== "completed") return;
    const items = await ctx.runQuery(internal.icreditHelpers.getOrderItems, { orderId: args.orderId });

    const assetsUrl = (process.env.STOREFRONT_URL || "https://purcari-storefront.pages.dev").replace(/\/$/, "");
    const toAbsolute = (src?: string) => (!src ? undefined : /^https?:\/\//.test(src) ? src : `${assetsUrl}${src.startsWith("/") ? "" : "/"}${src}`);

    const { subject, html, text } = orderConfirmationEmail({
      orderNumber: order.orderNumber ?? String(order._id),
      customerName: order.customerName,
      items: items.map((i) => ({ productName: i.productName, variant: i.variant, quantity: i.quantity, price: i.price, total: i.total, image: toAbsolute(i.productImage) })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discount: order.discount,
      total: order.total,
      shipping: {
        street: order.shippingStreet,
        apartment: order.shippingApartment,
        city: order.shippingCity,
        postalCode: order.shippingPostalCode,
      },
      receiptUrl: tx.rivhitDocumentLink,
      assetsUrl,
    });

    const id = await sendEmail({ to: order.customerEmail, subject, html, text });
    await ctx.runMutation(internal.email.markConfirmationSent, { orderId: args.orderId, emailId: id });
    console.log(`[email] order confirmation sent for ${args.orderId}, unosend id=${id}`);
  },
});
