import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";
import { adminQuery } from "./authHelpers";

/**
 * Shared helper: insert the "new order" activity entry.
 * Called directly from orders.create (no ctx.runMutation sub-transaction).
 */
export async function insertOrderActivity(
  ctx: MutationCtx,
  args: { orderNumber: number; customerName: string; total: number }
): Promise<void> {
  const title = `הזמנה חדשה #${args.orderNumber}`;
  const subtitle = `${args.customerName} - ₪${args.total.toLocaleString("he-IL")}`;

  await ctx.db.insert("activities", {
    title,
    subtitle,
    type: "order",
    color: "blue.500",
    createdAt: new Date().toISOString(),
  });
}

/**
 * Get the latest activities for the dashboard feed
 * Returns the most recent 10 activities
 */
export const getLatest = adminQuery({
  args: {},
  handler: async (ctx) => {
    const activities = await ctx.db
      .query("activities")
      .order("desc")
      .take(10);

    return activities.map((activity) => ({
      title: activity.title,
      subtitle: activity.subtitle,
      color: activity.color || getDefaultColor(activity.type),
      createdAt: activity.createdAt,
    }));
  },
});

/**
 * Create an activity entry for a new order
 */
export const createOrderActivity = internalMutation({
  args: {
    orderNumber: v.number(),
    customerName: v.string(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    await insertOrderActivity(ctx, args);
  },
});

/**
 * Create an activity entry for a successful payment
 */
export const createPaymentActivity = internalMutation({
  args: {
    orderNumber: v.number(),
    invoiceNumber: v.optional(v.string()),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const title = "התשלום התקבל בהצלחה";
    const subtitle = args.invoiceNumber
      ? `חשבונית ${args.invoiceNumber} - הזמנה #${args.orderNumber}`
      : `הזמנה #${args.orderNumber} - ₪${args.amount.toLocaleString("he-IL")}`;

    await ctx.db.insert("activities", {
      title,
      subtitle,
      type: "payment",
      color: "green.500",
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Create an activity entry for low inventory
 */
export const createInventoryActivity = internalMutation({
  args: {
    productName: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    const title = "התראה על מלאי נמוך";
    const subtitle = `${args.productName} - נשארו ${args.quantity} יחידות`;

    await ctx.db.insert("activities", {
      title,
      subtitle,
      type: "inventory",
      color: "yellow.500",
      relatedId: args.productId,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Create an activity entry for new user registration
 */
export const createUserActivity = internalMutation({
  args: {
    userName: v.string(),
    userId: v.id("users"),
    action: v.optional(v.string()), // "registration", "login", "update"
  },
  handler: async (ctx, args) => {
    const actionLabels: Record<string, string> = {
      registration: "נרשם משתמש חדש",
      login: "כניסה למערכת",
      update: "עדכון פרטים",
    };

    const title = actionLabels[args.action || "registration"];
    const subtitle = args.userName;

    await ctx.db.insert("activities", {
      title,
      subtitle,
      type: "user_action",
      color: "purple.500",
      relatedId: args.userId,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Keep only the 150 most recent activities (ordered via index).
 * Run periodically via cron or manually.
 */
export const cleanupOldActivities = internalMutation({
  args: {},
  handler: async (ctx) => {
    const keepCount = 150;
    
    // Take 150 most recent using index
    const recentActivities = await ctx.db
      .query("activities")
      .withIndex("by_createdAt")
      .order("desc")
      .take(keepCount + 50);

    if (recentActivities.length <= keepCount) {
      return { deletedCount: 0 };
    }

    const toDelete = recentActivities.slice(keepCount);
    for (const activity of toDelete) {
      await ctx.db.delete(activity._id);
    }

    return { deletedCount: toDelete.length };
  },
});

// Helper function to get default color based on activity type
function getDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    order: "blue.500",
    payment: "green.500",
    inventory: "yellow.500",
    user_action: "purple.500",
    system: "gray.500",
  };
  return colors[type] || "gray.500";
}
