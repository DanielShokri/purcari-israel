import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { Id } from "./_generated/dataModel";

async function requireAuth(ctx: any): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("יש להתחבר למערכת");
  return userId;
}

/**
 * List all addresses for the current authenticated user.
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuth(ctx);
    return await ctx.db
      .query("userAddresses")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

/**
 * Create a new address for the current authenticated user.
 */
export const create = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    street: v.string(),
    apartment: v.optional(v.string()),
    city: v.string(),
    postalCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const { isDefault, ...addressFields } = args;

    if (isDefault) {
      const existingAddresses = await ctx.db
        .query("userAddresses")
        .withIndex("by_userId_default", (q) =>
          q.eq("userId", userId).eq("isDefault", true)
        )
        .collect();

      for (const address of existingAddresses) {
        await ctx.db.patch(address._id, { isDefault: false });
      }
    }

    const addressId = await ctx.db.insert("userAddresses", {
      userId,
      isDefault,
      ...addressFields,
      createdAt: new Date().toISOString(),
    });

    return addressId;
  },
});

/**
 * Save shipping details from checkout as a new address for the logged-in user.
 * Skips creation if an identical address (street + city + postalCode) already
 * exists, and never changes the default address.
 */
export const saveFromCheckout = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    street: v.string(),
    city: v.string(),
    postalCode: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);

    const existing = await ctx.db
      .query("userAddresses")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const duplicate = existing.find(
      (a) =>
        a.street.trim() === args.street.trim() &&
        a.city.trim() === args.city.trim() &&
        (a.postalCode || "").trim() === args.postalCode.trim()
    );
    if (duplicate) {
      // The address itself is unchanged, but the name or phone may have been
      // edited in checkout (e.g. saved earlier without a phone). Keep the
      // stored record in sync instead of silently dropping the new values.
      const updates: { name?: string; phone?: string } = {};
      if (duplicate.name.trim() !== args.name.trim()) {
        updates.name = args.name;
      }
      if ((duplicate.phone || "").trim() !== (args.phone || "").trim()) {
        updates.phone = args.phone || "";
      }
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(duplicate._id, updates);
        return { addressId: duplicate._id, existed: true, updated: true };
      }
      return { addressId: duplicate._id, existed: true };
    }

    const addressId = await ctx.db.insert("userAddresses", {
      userId,
      isDefault: false,
      ...args,
      createdAt: new Date().toISOString(),
    });

    return { addressId, existed: false };
  },
});

/**
 * Update an existing address. Only the owner can update.
 */
export const update = mutation({
  args: {
    addressId: v.id("userAddresses"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    street: v.optional(v.string()),
    apartment: v.optional(v.string()),
    city: v.optional(v.string()),
    postalCode: v.optional(v.string()),
    country: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);
    const { addressId, isDefault, ...fields } = args;
    const existing = await ctx.db.get(addressId);
    if (!existing) throw new Error("Address not found");
    if (existing.userId !== authUserId) throw new Error("גישה נדחתה");

    if (isDefault === true && !existing.isDefault) {
      // Unset other defaults if this one is becoming the default
      const userId = existing.userId;
      const otherDefaults = await ctx.db
        .query("userAddresses")
        .withIndex("by_userId_default", (q) =>
          q.eq("userId", userId).eq("isDefault", true)
        )
        .collect();

      for (const address of otherDefaults) {
        await ctx.db.patch(address._id, { isDefault: false });
      }
    }

    await ctx.db.patch(addressId, {
      ...fields,
      ...(isDefault !== undefined ? { isDefault } : {}),
    });
  },
});

/**
 * Remove an address. Only the owner can delete.
 */
export const remove = mutation({
  args: {
    addressId: v.id("userAddresses"),
  },
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);
    const existing = await ctx.db.get(args.addressId);
    if (!existing) throw new Error("Address not found");
    if (existing.userId !== authUserId) throw new Error("גישה נדחתה");
    await ctx.db.delete(args.addressId);
  },
});

/**
 * Explicitly set an address as the default for the current user.
 */
export const setDefault = mutation({
  args: {
    addressId: v.id("userAddresses"),
  },
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);
    const address = await ctx.db.get(args.addressId);
    if (!address) throw new Error("Address not found");
    if (address.userId !== authUserId) throw new Error("גישה נדחתה");

    if (address.isDefault) return;

    // Unset other defaults
    const otherDefaults = await ctx.db
      .query("userAddresses")
      .withIndex("by_userId_default", (q) =>
        q.eq("userId", authUserId).eq("isDefault", true)
      )
      .collect();

    for (const addr of otherDefaults) {
      await ctx.db.patch(addr._id, { isDefault: false });
    }

    // Set this one as default
    await ctx.db.patch(args.addressId, { isDefault: true });
  },
});
