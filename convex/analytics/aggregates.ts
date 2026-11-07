import { components } from "../_generated/api";
import { TableAggregate } from "@convex-dev/aggregate";
import type { DataModel } from "../_generated/dataModel";

/**
 * Get YYYY-MM-DD string for a timestamp (UTC)
 * Used for daily aggregation buckets
 */
export function getDayKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

/**
 * Get YYYY-W## string for a timestamp (UTC)
 * Used for weekly aggregation buckets
 */
export function getWeekKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  // Get ISO week number
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((+d - +yearStart) / 86400000 + 1) / 7);
  return `${year}-W${weekNum.toString().padStart(2, "0")}`;
}

/**
 * Get YYYY-MM string for a timestamp (UTC)
 * Used for monthly aggregation buckets
 */
export function getMonthKey(timestamp: number = Date.now()): string {
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get start of day timestamp (UTC)
 */
export function getStartOfDay(timestamp: number = Date.now()): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Get end of day timestamp (UTC)
 */
export function getEndOfDay(timestamp: number = Date.now()): number {
  const date = new Date(timestamp);
  date.setUTCHours(23, 59, 59, 999);
  return date.getTime();
}

/**
 * Aggregate for daily page view counts
 * Key: YYYY-MM-DD date string
 * Value: count of views for that day
 */
export const dailyViewsAggregate = new TableAggregate<{
  Key: string; // YYYY-MM-DD
  DataModel: DataModel;
  TableName: "analyticsEvents";
}>(components.dailyViews, {
  sortKey: (event) => {
    // Only aggregate page_viewed events
    if (event.event !== "page_viewed") return null;
    return getDayKey(event.timestamp);
  },
  sumValue: () => 1, // Each event counts as 1 view
});

/**
 * Aggregate for active user tracking (DAU/WAU/MAU)
 * Key: [date, userId] tuple for unique user per day
 * Value: 1 (unique user count)
 *
 * This allows counting unique users per day, week, or month
 * by using bounds with date prefixes
 */
export const activeUsersAggregate = new TableAggregate<{
  Key: [string, string]; // [YYYY-MM-DD, userId or anonymousId]
  DataModel: DataModel;
  TableName: "analyticsEvents";
}>(components.activeUsers, {
  sortKey: (event) => {
    // Track any user activity (any event type)
    const userId = event.userId || event.anonymousId;
    if (!userId) return null;
    return [getDayKey(event.timestamp), userId];
  },
  sumValue: () => 1,
});

/**
 * Aggregate for per-product view counts
 * Key: [date, productId] tuple for product views per day
 * Value: count of views for that product on that day
 */
export const productViewsAggregate = new TableAggregate<{
  Key: [string, string]; // [YYYY-MM-DD, productId]
  DataModel: DataModel;
  TableName: "analyticsEvents";
}>(components.productViews, {
  sortKey: (event) => {
    // Only aggregate product_viewed events
    if (event.event !== "product_viewed") return null;
    // Extract productId from event properties
    const productId = event.properties?.productId;
    if (!productId || typeof productId !== "string") return null;
    return [getDayKey(event.timestamp), productId];
  },
  sumValue: () => 1,
});
