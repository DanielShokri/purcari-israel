import { v } from "convex/values";
import { z } from "zod";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { auth } from "./auth";
import { requireActiveUser, requireAdmin } from "./authHelpers";

const profileNameSchema = z.string().trim().min(7).regex(/^\S{3,}\s+\S{3,}$/);
const phoneSchema = z.string().trim().min(7).max(20).regex(/^[+\d\s-]+$/);

/**
 * Get current user's full profile including addresses.
 * Uses Convex Auth's getAuthUserId to reliably get the authenticated user ID.
 */
export const get = query({
  args: {},
  handler: async (ctx) => {
    // Use getAuthUserId for reliable auth user lookup
    const userId = await getAuthUserId(ctx);
    
    if (userId === null) {
      return null;
    }

    // Fetch user by ID
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Fetch all addresses linked to this user
    const addresses = await ctx.db
      .query("userAddresses")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Return combined profile with addresses
    return {
      ...user,
      addresses,
    };
  },
});

/**
 * Create or update the authenticated user's profile (phone and other custom
 * fields), using auth's getUserId.
 */
export const createOrUpdateUserProfile = mutation({
  args: {
    phone: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    const userId = user._id;
    if (!phoneSchema.safeParse(args.phone).success) throw new Error("מספר טלפון לא תקין");
    if (args.name !== undefined && !profileNameSchema.safeParse(args.name).success) throw new Error("שם מלא לא תקין");

    const now = new Date().toISOString();
    
    await ctx.db.patch(userId, {
      phone: args.phone,
      ...(args.name && { name: args.name }),
      updatedAt: now,
    });
    
    return userId;
  },
});

/**
 * List all users with pagination. (Admin only)
 */
export const listAll = query({
  args: {
    role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const limit = args.limit ?? 20;

    // Read one extra row to know whether there is a next page,
    // instead of collecting the entire users table.
    let results;
    if (args.role && args.status) {
      results = await ctx.db
        .query("users")
        .withIndex("by_role_status", (qi) => 
          qi.eq("role", args.role!).eq("status", args.status!)
        )
        .take(limit + 1);
    } else if (args.role) {
      results = await ctx.db
        .query("users")
        .withIndex("by_role", (qi) => qi.eq("role", args.role!))
        .take(limit + 1);
    } else if (args.status) {
      results = await ctx.db
        .query("users")
        .withIndex("by_status", (qi) => qi.eq("status", args.status!))
        .take(limit + 1);
    } else {
      results = await ctx.db.query("users").take(limit + 1);
    }
    
    let nextCursor: string | null = null;
    if (results.length > limit) {
      const lastItem = results[limit - 1];
      nextCursor = lastItem._id;
      results.length = limit;
    }
    
    return { users: results, nextCursor };
  },
});

/**
 * Delete a user. (Admin only)
 * Cascades deletion of addresses, notifications, and anonymizes orders/couponUsage.
 */
export const remove = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const userId = args.userId;
    if (userId === admin._id) throw new Error("לא ניתן למחוק את החשבון שלך");
    const target = await ctx.db.get(userId);
    if (target?.role === "admin") {
      const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).collect();
      if (admins.length <= 1) throw new Error("לא ניתן למחוק את המנהל האחרון");
    }

    // Load all related records in parallel
    const [addresses, notifications, orders, couponUsage, userCart, authAccounts, authSessions] =
      await Promise.all([
        ctx.db
          .query("userAddresses")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("notifications")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("orders")
          .withIndex("by_customerId", (q) => q.eq("customerId", userId))
          .collect(),
        ctx.db
          .query("couponUsage")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect(),
        ctx.db
          .query("carts")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .first(),
        ctx.db.query("authAccounts").filter((q) => q.eq(q.field("userId"), userId)).collect(),
        ctx.db.query("authSessions").filter((q) => q.eq(q.field("userId"), userId)).collect(),
      ]);

    await Promise.all([
      // Delete addresses
      ...addresses.map((addr) => ctx.db.delete(addr._id)),
      // Delete notifications
      ...notifications.map((notif) => ctx.db.delete(notif._id)),
      // Anonymize orders (keep order history but remove personal data)
      ...orders.map((order) =>
        ctx.db.patch(order._id, {
          customerId: undefined,
          customerName: "משתמש נמחק",
          customerEmail: "deleted@example.com",
          customerPhone: undefined,
        })
      ),
      // Delete coupon usage records
      ...couponUsage.map((usage) => ctx.db.delete(usage._id)),
      // Delete cart and invalidate all authentication records.
      ...(userCart ? [ctx.db.delete(userCart._id)] : []),
      ...authAccounts.map((account) => ctx.db.delete(account._id)),
      ...authSessions.map((session) => ctx.db.delete(session._id)),
    ]);

    await ctx.db.delete(userId);
  },
});

/**
 * Update a user (Admin only).
 */
export const update = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const { userId, ...updates } = args;
    const target = await ctx.db.get(userId);
    if (!target) throw new Error("משתמש לא נמצא");
    const removesAdmin = target.role === "admin" && (updates.role === "viewer" || (updates.status !== undefined && updates.status !== "active"));
    if ((userId === admin._id && removesAdmin) || removesAdmin && (await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).collect()).length <= 1) {
      throw new Error("לא ניתן להסיר או להשבית את המנהל האחרון");
    }
    await ctx.db.patch(userId, { ...updates, updatedAt: new Date().toISOString() });
  },
});

/**
 * Create a new user (Admin only).
 * Creates user without authentication - for admin use only.
 */
export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("viewer"))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();
    
    if (existing) {
      throw new Error("משתמש עם כתובת אימייל זו כבר קיים");
    }
    
    const now = new Date().toISOString();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      role: args.role || "viewer",
      status: args.status || "active",
      createdAt: now,
      updatedAt: now,
    });
    
    return userId;
  },
});

/**
 * Update user role. (Admin only)
 */
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdmin(ctx);
    
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: new Date().toISOString(),
    });
  },
});

/**
 * Update user status. (Admin only)
 */
export const updateStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended")),
  },
  handler: async (ctx, args) => {
    // Verify admin access
    await requireAdmin(ctx);
    
    await ctx.db.patch(args.userId, {
      status: args.status,
      updatedAt: new Date().toISOString(),
    });
  },
});

/**
 * Update current user's profile information.
 * Uses getAuthUserId for reliable auth user lookup (consistent with get query).
 */
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireActiveUser(ctx);
    if (args.name !== undefined && !profileNameSchema.safeParse(args.name).success) throw new Error("שם מלא לא תקין");
    if (args.phone !== undefined && !phoneSchema.safeParse(args.phone).success) throw new Error("מספר טלפון לא תקין");
    const updates = Object.fromEntries(Object.entries(args).filter(([, value]) => value !== undefined));
    await ctx.db.patch(user._id, { ...updates, updatedAt: new Date().toISOString() });

    return user._id;
  },
});
