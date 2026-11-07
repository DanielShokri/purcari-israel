import { getDayKey, getWeekKey, getMonthKey, getStartOfDay, getEndOfDay } from "./aggregates";

/**
 * Time series data point for charts
 */
export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  name?: string;
  orders?: number; // For sales data that includes order count
}

/**
 * Read events of a single type within [startTime, endTime] using the
 * compound `by_event_timestamp` index, so only matching rows are read
 * (instead of scanning every event in the range or every event of the type).
 */
export async function getEventsInRange(
  ctx: any,
  event: string,
  startTime: number,
  endTime: number
): Promise<any[]> {
  return await ctx.db
    .query("analyticsEvents")
    .withIndex("by_event_timestamp", (q: any) =>
      q.eq("event", event).gte("timestamp", startTime).lte("timestamp", endTime)
    )
    .collect();
}

/**
 * Read events of a single type with timestamp >= startTime using the
 * compound `by_event_timestamp` index.
 */
export async function getEventsSince(
  ctx: any,
  event: string,
  startTime: number
): Promise<any[]> {
  return await ctx.db
    .query("analyticsEvents")
    .withIndex("by_event_timestamp", (q: any) =>
      q.eq("event", event).gte("timestamp", startTime)
    )
    .collect();
}

/**
 * Count page views directly from events table within a time range
 */
export async function countPageViewsInRange(
  ctx: any,
  startTime: number,
  endTime: number
): Promise<number> {
  const events = await getEventsInRange(ctx, "page_viewed", startTime, endTime);
  return events.length;
}

/**
 * Count authenticated users (those with userId, not anonymousId) in a time range
 */
export async function countAuthenticatedUsersInRange(
  ctx: any,
  startTime: number,
  endTime: number
): Promise<number> {
  const events = await ctx.db
    .query("analyticsEvents")
    .withIndex("by_timestamp", (q: any) =>
      q.gte("timestamp", startTime)
        .lte("timestamp", endTime)
    )
    .collect();

  // Only count authenticated users (those with userId)
  const authenticatedUsers = new Set<string>();
  for (const event of events) {
    if (event.userId) {
      authenticatedUsers.add(event.userId);
    }
  }
  return authenticatedUsers.size;
}

/**
 * Count unique visitors (both authenticated and anonymous) in a time range
 */
export async function countUniqueVisitorsInRange(
  ctx: any,
  startTime: number,
  endTime: number
): Promise<number> {
  const events = await ctx.db
    .query("analyticsEvents")
    .withIndex("by_timestamp", (q: any) =>
      q.gte("timestamp", startTime)
        .lte("timestamp", endTime)
    )
    .collect();

  const uniqueVisitors = new Set<string>();
  for (const event of events) {
    const userId = event.userId || event.anonymousId;
    if (userId) {
      uniqueVisitors.add(userId);
    }
  }
  return uniqueVisitors.size;
}

/**
 * Count both unique visitors (userId or anonymousId) and authenticated users
 * (userId only) in a time range with a single read of the events.
 */
export async function countVisitorsInRange(
  ctx: any,
  startTime: number,
  endTime: number
): Promise<{ uniqueVisitors: number; authenticatedUsers: number }> {
  const events = await ctx.db
    .query("analyticsEvents")
    .withIndex("by_timestamp", (q: any) =>
      q.gte("timestamp", startTime).lte("timestamp", endTime)
    )
    .collect();

  const uniqueVisitors = new Set<string>();
  const authenticatedUsers = new Set<string>();
  for (const event of events) {
    const visitorId = event.userId || event.anonymousId;
    if (visitorId) uniqueVisitors.add(visitorId);
    if (event.userId) authenticatedUsers.add(event.userId);
  }
  return {
    uniqueVisitors: uniqueVisitors.size,
    authenticatedUsers: authenticatedUsers.size,
  };
}

/**
 * Get top products by view count
 */
export async function getTopProductsByViews(
  ctx: any,
  limit: number
): Promise<Array<{ productId: string; productName: string; views: number }>> {
  // Query analyticsEvents for product_viewed events
  const events = await ctx.db
    .query("analyticsEvents")
    .withIndex("by_event", (q: any) => q.eq("event", "product_viewed"))
    .collect();

  // Aggregate views per product
  const productViews: Record<string, number> = {};

  for (const event of events) {
    const productId = event.properties?.productId;
    if (productId && typeof productId === "string") {
      productViews[productId] = (productViews[productId] || 0) + 1;
    }
  }

  // Sort by views and get top N
  const sorted = Object.entries(productViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  // Get product details (in parallel)
  const products = await Promise.all(
    sorted.map(([productId]) => {
      // Guard against malformed ids stored in event properties
      const id = ctx.db.normalizeId("products", productId);
      return id ? ctx.db.get("products", id) : null;
    })
  );

  return sorted.map(([productId, views], i) => {
    const product = products[i];
    return {
      productId,
      productName: product?.productNameHe || product?.productName || "Unknown Product",
      views,
    };
  });
}

/**
 * A single bucket in a time series (shared by buildTimeSeries and getSalesSeries)
 */
export interface TimeSeriesPeriod {
  name: string;
  timestamp: string;
  start: number;
  end: number;
}

/**
 * Compute the period buckets for an interval:
 * - daily: last 30 days
 * - weekly: last 12 weeks
 * - monthly: last 12 months
 */
export function getTimeSeriesPeriods(
  interval: "daily" | "weekly" | "monthly",
  now: number = Date.now()
): TimeSeriesPeriod[] {
  const periods: TimeSeriesPeriod[] = [];

  if (interval === "daily") {
    // Last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      periods.push({
        name: date.toLocaleDateString("he-IL", { day: "numeric", month: "short" }),
        timestamp: getDayKey(date.getTime()),
        start: getStartOfDay(date.getTime()),
        end: getEndOfDay(date.getTime()),
      });
    }
  } else if (interval === "weekly") {
    // Last 12 weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      const weekKey = getWeekKey(weekStart.getTime());
      periods.push({
        name: `שבוע ${weekKey.split("-W")[1]}`,
        timestamp: weekKey,
        start: getStartOfDay(weekStart.getTime()),
        end: getEndOfDay(weekEnd.getTime()),
      });
    }
  } else if (interval === "monthly") {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setUTCMonth(date.getUTCMonth() - i);

      const startOfMonth = new Date(date);
      startOfMonth.setUTCDate(1);
      const endOfMonth = new Date(date);
      endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1, 0);

      periods.push({
        name: date.toLocaleDateString("he-IL", { month: "short" }),
        timestamp: getMonthKey(date.getTime()),
        start: startOfMonth.getTime(),
        end: endOfMonth.getTime(),
      });
    }
  }

  return periods;
}

/**
 * Build time series query helper for any aggregation logic.
 * All period reads run in parallel; output order is preserved.
 */
export async function buildTimeSeries(
  ctx: any,
  interval: "daily" | "weekly" | "monthly",
  aggregateFunc: (events: any[], start: number, end: number) => number | Promise<number>
): Promise<TimeSeriesDataPoint[]> {
  const periods = getTimeSeriesPeriods(interval);

  return await Promise.all(
    periods.map(async (period) => {
      const events = await ctx.db
        .query("analyticsEvents")
        .withIndex("by_timestamp", (q: any) =>
          q.gte("timestamp", period.start).lte("timestamp", period.end)
        )
        .collect();

      const value = await aggregateFunc(events, period.start, period.end);

      return {
        name: period.name,
        value,
        timestamp: period.timestamp,
      };
    })
  );
}

/**
 * Calculate percentage change between current and previous values
 */
export function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate conversion rate
 */
export function calculateRate(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}

/**
 * Filter events by type and time range
 */
export function filterEvents(
  events: any[],
  eventType: string,
  startTime: number,
  endTime: number
): any[] {
  return events.filter(e => {
    const ts = typeof e.timestamp === "string" ? Number(e.timestamp) : e.timestamp;
    return e.event === eventType && ts >= startTime && ts <= endTime;
  });
}
