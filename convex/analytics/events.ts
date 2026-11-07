import { mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  dailyViewsAggregate,
  activeUsersAggregate,
  productViewsAggregate,
} from "./aggregates";

/**
 * Track an analytics event
 * This mutation records the event and updates all relevant aggregates
 */
export const trackEvent = mutation({
  args: {
    event: v.string(),
    properties: v.optional(v.any()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const timestamp = Date.now();

    // Insert the raw event
    const eventDoc = await ctx.db.insert("analyticsEvents", {
      userId: userId || undefined,
      anonymousId: args.anonymousId,
      event: args.event,
      properties: args.properties || {},
      timestamp: timestamp,
    });

    // Get the inserted document for aggregate updates
    const doc = await ctx.db.get("analyticsEvents", eventDoc);
    if (!doc) throw new Error("Failed to retrieve inserted event");

    // Update all aggregates (each has its own filtering logic)
    // dailyViews: only tracks page_viewed events
    // activeUsers: tracks all events for unique user counting
    // productViews: only tracks product_viewed events
    try {
      await dailyViewsAggregate.insertIfDoesNotExist(ctx, doc);
      await activeUsersAggregate.insertIfDoesNotExist(ctx, doc);
      await productViewsAggregate.insertIfDoesNotExist(ctx, doc);
    } catch (error) {
      console.error("Error updating aggregates:", error);
      throw error;
    }

    return eventDoc;
  },
});

/**
 * Alias for trackEvent - matches plan naming convention
 * Global tracking mutation for all analytics events
 */
export const track = mutation({
  args: {
    event: v.string(),
    properties: v.optional(v.any()),
    anonymousId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const timestamp = Date.now();

    const eventDoc = await ctx.db.insert("analyticsEvents", {
      userId: userId || undefined,
      anonymousId: args.anonymousId,
      event: args.event,
      properties: args.properties || {},
      timestamp: timestamp,
    });

    const doc = await ctx.db.get("analyticsEvents", eventDoc);
    if (!doc) throw new Error("Failed to retrieve inserted event");

    try {
      await dailyViewsAggregate.insertIfDoesNotExist(ctx, doc);
      await activeUsersAggregate.insertIfDoesNotExist(ctx, doc);
      await productViewsAggregate.insertIfDoesNotExist(ctx, doc);
    } catch (error) {
      console.error("Error updating aggregates:", error);
      throw error;
    }

    return eventDoc;
  },
});

/**
 * Identify an anonymous user after they log in (Identity Stitching)
 * Links all anonymous guest events to the authenticated user.
 * Uses the optimized by_anon_id index for efficient lookup.
 */
export const identifyUser = mutation({
  args: {
    anonymousId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { linked: 0 };
    }

    // Use the by_anon_id index for efficient lookup of anonymous events
    const guestEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_anon_id", (q) => q.eq("anonymousId", args.anonymousId))
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    // Batch update all anonymous events to link them to the user (in parallel)
    await Promise.all(
      guestEvents.map((event) => ctx.db.patch(event._id, { userId }))
    );

    return { linked: guestEvents.length };
  },
});

/**
 * Alias for identifyUser - matches plan naming convention
 * Identity stitching: links anonymous guest events to authenticated user
 */
export const linkIdentity = mutation({
  args: { anonymousId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { linked: 0 };

    const guestEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_anon_id", (q) => q.eq("anonymousId", args.anonymousId))
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    await Promise.all(
      guestEvents.map((event) => ctx.db.patch(event._id, { userId }))
    );
    return { linked: guestEvents.length };
  },
});

export const migrateTimestamps = mutation({
  args: {},
  handler: async (ctx) => {
    const events = await ctx.db.query("analyticsEvents").collect();
    let updated = 0;
    for (const event of events) {
      if (typeof event.timestamp === "string") {
        await ctx.db.patch(event._id, {
          timestamp: Number(event.timestamp),
        });
        updated++;
      }
    }
    return { updated };
  },
});

/**
 * Prune analytics events older than 180 days
 * Called by cron job daily at 2:00 AM UTC
 * Deletes events in batches to avoid timeout
 */
export const pruneOldEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const RETENTION_DAYS = 180;
    const BATCH_SIZE = 1000;
    const cutoffDate = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    
    // Query events older than cutoff using timestamp index
    const oldEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoffDate))
      .take(BATCH_SIZE); // Process in batches to avoid timeout
    
    let deleted = 0;
    for (const event of oldEvents) {
      // Remove from aggregates before deleting
      try {
        await dailyViewsAggregate.deleteIfExists(ctx, event);
        await activeUsersAggregate.deleteIfExists(ctx, event);
        await productViewsAggregate.deleteIfExists(ctx, event);
      } catch (error) {
        // Aggregate may not have this event, continue
        console.warn("Error removing from aggregate:", error);
      }
      
      await ctx.db.delete(event._id);
      deleted++;
    }
    
    const hasMore = oldEvents.length === BATCH_SIZE;

    // Keep pruning in follow-up transactions until the backlog is cleared,
    // instead of waiting for tomorrow's cron run (which only handles one batch).
    if (hasMore) {
      await ctx.scheduler.runAfter(0, internal.analytics.events.pruneOldEvents, {});
    }

    console.log(`Pruned ${deleted} analytics events older than ${RETENTION_DAYS} days`);
    return { deleted, hasMore };
  },
});
