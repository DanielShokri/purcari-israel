import { v } from "convex/values";
import { action, internalAction, internalMutation, internalQuery, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./authHelpers";
import { sendEmail } from "./lib/email";
import { getAssetsUrl } from "./lib/emailLayout";
import {
  adminNewOrderEmail,
  contactNotificationEmail,
  orderCancelledEmail,
  orderConfirmationEmail,
  testEmail,
  welcomeEmail,
  type OrderEmailData,
} from "./lib/emailTemplates";

const TEST_RECIPIENT = "danielshokri@gmail.com";

/** Where internal notifications (new order, contact form) go. Comma-separated list allowed. */
const shopRecipients = (): string[] =>
  (process.env.SHOP_NOTIFY_EMAIL || "hello@purcari.co.il")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

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

/** Loads an order and shapes it for the order templates. */
async function loadOrderEmailData(ctx: ActionCtx, orderId: Id<"orders">) {
  const order = await ctx.runQuery(internal.icreditHelpers.getOrderById, { orderId });
  if (!order) return null;
  const tx = await ctx.runQuery(internal.icreditHelpers.getLatestPaymentTransaction, { orderId });
  const items = await ctx.runQuery(internal.icreditHelpers.getOrderItems, { orderId });

  const assetsUrl = getAssetsUrl();
  const toAbsolute = (src?: string) =>
    !src ? undefined : /^https?:\/\//.test(src) ? src : `${assetsUrl}${src.startsWith("/") ? "" : "/"}${src}`;

  const data: OrderEmailData = {
    orderNumber: order.orderNumber ?? String(order._id),
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    items: items.map((i) => ({
      productName: i.productName,
      variant: i.variant,
      quantity: i.quantity,
      price: i.price,
      total: i.total,
      image: toAbsolute(i.productImage),
    })),
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
    receiptUrl: tx?.rivhitDocumentLink,
  };
  return { order, tx, data };
}

/**
 * Order confirmation. Scheduled only after a payment is confirmed. Never sends
 * unless a completed payment transaction exists, and never twice for an order.
 */
export const sendOrderConfirmation = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const loaded = await loadOrderEmailData(ctx, args.orderId);
    if (!loaded) return;
    const { order, tx, data } = loaded;
    if (order.confirmationEmailSentAt) return; // dedupe: Unosend has no idempotency
    if (!tx || tx.status !== "completed") return;

    const { subject, html, text } = orderConfirmationEmail(data);
    const id = await sendEmail({ to: order.customerEmail, subject, html, text });
    await ctx.runMutation(internal.email.markConfirmationSent, { orderId: args.orderId, emailId: id });
    console.log(`[email] order confirmation sent for ${args.orderId}, unosend id=${id}`);
  },
});

/** Tells the shop a paid order came in. Scheduled next to the customer confirmation, once per payment. */
export const sendAdminNewOrder = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const loaded = await loadOrderEmailData(ctx, args.orderId);
    if (!loaded || loaded.tx?.status !== "completed") return;
    const { subject, html, text } = adminNewOrderEmail(loaded.data);
    const id = await sendEmail({ to: shopRecipients(), subject, html, text });
    console.log(`[email] admin new-order sent for ${args.orderId}, unosend id=${id}`);
  },
});

/**
 * Cancellation notice for an order that had been paid. Scheduled by transitionOrder, which only
 * moves an order to "cancelled" once, so this goes out once per order.
 */
export const sendOrderCancelled = internalAction({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    const loaded = await loadOrderEmailData(ctx, args.orderId);
    if (!loaded || loaded.order.status !== "cancelled") return;
    const { subject, html, text } = orderCancelledEmail(loaded.data);
    const id = await sendEmail({ to: loaded.order.customerEmail, subject, html, text });
    console.log(`[email] order cancelled sent for ${args.orderId}, unosend id=${id}`);
  },
});

export const getUserForEmail = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user ? { email: user.email, name: user.name } : null;
  },
});

/** Welcome email for a newly created account (password or Google sign-up). */
export const sendWelcomeEmail = internalAction({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.email.getUserForEmail, { userId: args.userId });
    if (!user?.email) return;
    const shopUrl = (process.env.STOREFRONT_URL || "https://purcari-storefront.pages.dev").replace(/\/$/, "");
    const { subject, html, text } = welcomeEmail({ name: user.name || user.email.split("@")[0], shopUrl: `${shopUrl}/products` });
    const id = await sendEmail({ to: user.email, subject, html, text });
    console.log(`[email] welcome sent for ${args.userId}, unosend id=${id}`);
  },
});

/** Forwards a contact-form message to the shop; replying goes straight to the customer. */
export const sendContactNotification = internalAction({
  args: { name: v.string(), email: v.string(), subject: v.string(), message: v.string() },
  handler: async (_ctx, args) => {
    const { subject, html, text } = contactNotificationEmail(args);
    const id = await sendEmail({ to: shopRecipients(), subject, html, text, replyTo: args.email });
    console.log(`[email] contact notification sent, unosend id=${id}`);
  },
});
