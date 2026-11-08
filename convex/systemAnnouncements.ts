import { v } from "convex/values";
import { query } from "./_generated/server";
import { adminMutation, adminQuery } from "./authHelpers";

/**
 * Admin: Get system announcement by ID.
 */
export const get = adminQuery({
  args: { id: v.id("systemAnnouncements") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Admin: List all system announcements sorted by createdAt desc.
 */
export const list = adminQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("systemAnnouncements")
      .order("desc")
      .collect();
  },
});

/**
 * Active announcements for the storefront: status active, within start/end dates,
 * and targetAudience 'all' or 'customers'.
 */
export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0]; // YYYY-MM-DD format

    const announcements = await ctx.db
      .query("systemAnnouncements")
      // startDate <= today is applied in the index range, so future announcements aren't read
      .withIndex("by_status_startDate", (q) =>
        q.eq("status", "active").lte("startDate", today)
      )
      .collect();

    // Filter by date validity and target audience
    return announcements.filter((announcement) => {
      // Check startDate <= today
      const startDateValid = announcement.startDate <= today;
      
      // Check endDate (if exists) >= today
      const endDateValid = !announcement.endDate || announcement.endDate >= today;
      
      // Check target audience (only show 'all' or 'customers' on storefront)
      const audienceValid = 
        announcement.targetAudience === "all" || 
        announcement.targetAudience === "customers";

      return startDateValid && endDateValid && audienceValid;
    });
  },
});

/**
 * Admin: Create a new system announcement.
 */
export const create = adminMutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("success"),
      v.literal("error"),
      v.literal("maintenance")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("scheduled"),
      v.literal("expired"),
      v.literal("draft")
    ),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    isDismissible: v.boolean(),
    targetAudience: v.union(
      v.literal("all"),
      v.literal("customers"),
      v.literal("admins")
    ),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("systemAnnouncements", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

/**
 * Admin: Update an existing system announcement.
 */
export const update = adminMutation({
  args: {
    id: v.id("systemAnnouncements"),
    title: v.optional(v.string()),
    message: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("info"),
        v.literal("warning"),
        v.literal("success"),
        v.literal("error"),
        v.literal("maintenance")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("scheduled"),
        v.literal("expired"),
        v.literal("draft")
      )
    ),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    isDismissible: v.optional(v.boolean()),
    targetAudience: v.optional(
      v.union(
        v.literal("all"),
        v.literal("customers"),
        v.literal("admins")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, {
      ...patch,
      updatedAt: new Date().toISOString(),
    });
  },
});

/**
 * Admin: Remove a system announcement.
 */
export const remove = adminMutation({
  args: { id: v.id("systemAnnouncements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
