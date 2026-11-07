import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { auth } from "./auth";
import { requireAdmin } from "./authHelpers";

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
 * Create or update user profile after authentication.
 * 
 * This mutation updates the user profile with phone number and other custom fields.
 * Requires user to be authenticated - uses auth's getUserId for consistency.
 */
export const createOrUpdateUserProfile = mutation({
  args: {
    phone: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("יש להתחבר למערכת");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("משתמש לא נמצא");
    }

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
    role: v.optional(v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer"))),
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
    await requireAdmin(ctx);
    const userId = args.userId;

    // Load all related records in parallel
    const [addresses, notifications, orders, couponUsage, userCart] =
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
      // Delete cart
      ...(userCart ? [ctx.db.delete(userCart._id)] : []),
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
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    role: v.optional(v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer"))),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
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
    role: v.optional(v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer"))),
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
    role: v.union(v.literal("admin"), v.literal("editor"), v.literal("viewer")),
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
    // Use getAuthUserId for reliable auth user lookup
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);

    if (!user) {
      throw new Error("User not found");
    }

    await ctx.db.patch(userId, {
      ...args,
      updatedAt: new Date().toISOString(),
    });

    return userId;
  },
});
