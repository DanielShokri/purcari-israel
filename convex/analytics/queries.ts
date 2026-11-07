import { query } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../authHelpers";
import { getStartOfDay, getEndOfDay } from "./aggregates";
import {
  TimeSeriesDataPoint,
  countVisitorsInRange,
  getTopProductsByViews,
  buildTimeSeries,
  getTimeSeriesPeriods,
  getEventsInRange,
  getEventsSince,
  calculateChange,
  calculateRate,
} from "./helpers";

/**
 * Get analytics summary for dashboard
 */
export const getSummary = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const ONE_WEEK = 7 * ONE_DAY;

    // Get today's start and end times
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    // Yesterday's boundaries
    const yesterdayStart = getStartOfDay(now - ONE_DAY);
    const yesterdayEnd = getEndOfDay(now - ONE_DAY);

    // Calculate week boundaries (Sunday to Saturday)
    const today = new Date(now);
    const dayOfWeek = today.getDay();
    const startOfWeekDate = new Date(now - dayOfWeek * ONE_DAY);
    const startOfWeek = getStartOfDay(startOfWeekDate.getTime());
    const endOfWeek = todayEnd;

    // Last week's boundaries
    const lastWeekStart = startOfWeek - ONE_WEEK;
    const lastWeekEnd = endOfWeek - ONE_WEEK;

    // Calculate month boundaries
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // Last month's boundaries
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);

    // Each range is read once and yields both unique-visitor and
    // authenticated-user counts; all reads run in parallel.
    const [
      today_,
      thisWeek,
      thisMonth,
      yesterday,
      lastWeek,
      lastMonth,
      allEvents,
      topProducts,
    ] = await Promise.all([
      countVisitorsInRange(ctx, todayStart, todayEnd),
      countVisitorsInRange(ctx, startOfWeek, endOfWeek),
      countVisitorsInRange(ctx, startOfMonth.getTime(), endOfMonth.getTime()),
      countVisitorsInRange(ctx, yesterdayStart, yesterdayEnd),
      countVisitorsInRange(ctx, lastWeekStart, lastWeekEnd),
      countVisitorsInRange(ctx, lastMonthStart.getTime(), lastMonthEnd.getTime()),
      // All unique visitors (all time)
      ctx.db.query("analyticsEvents").collect(),
      // Top products
      getTopProductsByViews(ctx, 10),
    ]);

    // Unique visitors (authenticated + anonymous)
    const visitorsToday = today_.uniqueVisitors;
    const visitorsThisWeek = thisWeek.uniqueVisitors;
    const visitorsThisMonth = thisMonth.uniqueVisitors;
    const visitorsYesterday = yesterday.uniqueVisitors;
    const visitorsLastWeek = lastWeek.uniqueVisitors;
    const visitorsLastMonth = lastMonth.uniqueVisitors;

    // Authenticated user counts (DAU/WAU/MAU)
    const dau = today_.authenticatedUsers;
    const wau = thisWeek.authenticatedUsers;
    const mau = thisMonth.authenticatedUsers;
    const dauYesterday = yesterday.authenticatedUsers;
    const wauLastWeek = lastWeek.authenticatedUsers;
    const mauLastMonth = lastMonth.authenticatedUsers;

    const allUniqueVisitors = new Set<string>();
    for (const event of allEvents) {
      const visitorId = event.userId || event.anonymousId;
      if (visitorId) {
        allUniqueVisitors.add(visitorId);
      }
    }
    const totalVisitors = allUniqueVisitors.size;

    return {
      totalViews: totalVisitors,
      totalVisitors,
      viewsToday: visitorsToday,
      viewsThisWeek: visitorsThisWeek,
      viewsThisMonth: visitorsThisMonth,
      viewsTodayChange: calculateChange(visitorsToday, visitorsYesterday),
      viewsWeekChange: calculateChange(visitorsThisWeek, visitorsLastWeek),
      viewsMonthChange: calculateChange(visitorsThisMonth, visitorsLastMonth),
      dau,
      wau,
      mau,
      dauChange: calculateChange(dau, dauYesterday),
      wauChange: calculateChange(wau, wauLastWeek),
      mauChange: calculateChange(mau, mauLastMonth),
      topProducts,
      averageSessionDuration: 0,
      bounceRate: 0,
      conversionRate: 0,
    };
  },
});

/**
 * Get unique visitors time-series data for charts
 */
export const getViewsSeries = query({
  args: { interval: v.string() },
  handler: async (ctx, args): Promise<TimeSeriesDataPoint[]> => {
    await requireAdmin(ctx);

    return buildTimeSeries(ctx, args.interval as "daily" | "weekly" | "monthly", async (events, start, end) => {
      // Count unique visitors per period
      const uniqueVisitors = new Set<string>();
      for (const event of events) {
        const userId = event.userId || event.anonymousId;
        if (userId) {
          uniqueVisitors.add(userId);
        }
      }
      return uniqueVisitors.size;
    });
  },
});

/**
 * Get new users time-series data (placeholder: 30% of page views)
 */
export const getNewUsersSeries = query({
  args: { interval: v.string() },
  handler: async (ctx, args): Promise<TimeSeriesDataPoint[]> => {
    await requireAdmin(ctx);

    // Get page views series using buildTimeSeries
    const pageViewsSeries = await buildTimeSeries(
      ctx,
      args.interval as "daily" | "weekly" | "monthly",
      async (events) => {
        // Count page_viewed events
        return events.filter(e => e.event === "page_viewed").length;
      }
    );
    // Scale down to simulate new users (30% of page views)
    return pageViewsSeries.map(point => ({
      ...point,
      value: Math.floor(point.value * 0.3),
    }));
  },
});

/**
 * Get top products by views
 */
export const getTopProducts = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    return getTopProductsByViews(ctx, args.limit || 10);
  },
});

/**
 * Get conversion metrics for the dashboard
 */
export const getConversionMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    const yesterdayStart = getStartOfDay(now - ONE_DAY);
    const yesterdayEnd = getEndOfDay(now - ONE_DAY);

    // Read only the 4 event types we need (via by_event_timestamp), in parallel
    const [productViews, addToCarts, checkoutsStarted, ordersCompleted] =
      await Promise.all(
        ["product_viewed", "cart_item_added", "checkout_started", "order_completed"].map(
          (event) => getEventsInRange(ctx, event, yesterdayStart, todayEnd)
        )
      );

    const countIn = (events: any[], start: number, end: number) =>
      events.filter((e) => e.timestamp >= start && e.timestamp <= end).length;

    // Today's metrics
    const productViewsToday = countIn(productViews, todayStart, todayEnd);
    const addToCartsToday = countIn(addToCarts, todayStart, todayEnd);
    const checkoutsStartedToday = countIn(checkoutsStarted, todayStart, todayEnd);
    const ordersCompletedToday = countIn(ordersCompleted, todayStart, todayEnd);

    // Yesterday's metrics
    const productViewsYesterday = countIn(productViews, yesterdayStart, yesterdayEnd);
    const addToCartsYesterday = countIn(addToCarts, yesterdayStart, yesterdayEnd);
    const checkoutsStartedYesterday = countIn(checkoutsStarted, yesterdayStart, yesterdayEnd);
    const ordersCompletedYesterday = countIn(ordersCompleted, yesterdayStart, yesterdayEnd);

    return {
      productToCartRate: calculateRate(addToCartsToday, productViewsToday),
      cartToCheckoutRate: calculateRate(checkoutsStartedToday, addToCartsToday),
      checkoutToOrderRate: calculateRate(ordersCompletedToday, checkoutsStartedToday),
      overallConversionRate: calculateRate(ordersCompletedToday, productViewsToday),

      productToCartRateYesterday: calculateRate(addToCartsYesterday, productViewsYesterday),
      cartToCheckoutRateYesterday: calculateRate(checkoutsStartedYesterday, addToCartsYesterday),
      checkoutToOrderRateYesterday: calculateRate(ordersCompletedYesterday, checkoutsStartedYesterday),
      overallConversionRateYesterday: calculateRate(ordersCompletedYesterday, productViewsYesterday),

      productToCartRateChange: calculateChange(
        calculateRate(addToCartsToday, productViewsToday),
        calculateRate(addToCartsYesterday, productViewsYesterday)
      ),
      overallConversionRateChange: calculateChange(
        calculateRate(ordersCompletedToday, productViewsToday),
        calculateRate(ordersCompletedYesterday, productViewsYesterday)
      ),

      productViewsToday,
      addToCartsToday,
      checkoutsStartedToday,
      ordersCompletedToday,
    };
  },
});

/**
 * Get checkout funnel data
 */
export const getCheckoutFunnel = query({
  args: { days: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const days = args.days || 7;
    const now = Date.now();
    const startTime = getStartOfDay(now - days * 24 * 60 * 60 * 1000);
    const endTime = getEndOfDay(now);

    // Read only the funnel event types (via by_event_timestamp), in parallel
    const [
      productViewedEvents,
      cartItemAddedEvents,
      cartViewedEvents,
      checkoutStartedEvents,
      checkoutStepEvents,
      orderCompletedEvents,
    ] = await Promise.all(
      [
        "product_viewed",
        "cart_item_added",
        "cart_viewed",
        "checkout_started",
        "checkout_step_viewed",
        "order_completed",
      ].map((event) => getEventsInRange(ctx, event, startTime, endTime))
    );

    const uniqueUsers = (events: any[]) =>
      new Set(events.map((e) => e.userId || e.anonymousId)).size;

    // Count unique users at each funnel stage
    const productViews = uniqueUsers(productViewedEvents);
    const addToCart = uniqueUsers(cartItemAddedEvents);
    const cartViews = uniqueUsers(cartViewedEvents);
    const checkoutStarted = uniqueUsers(checkoutStartedEvents);
    const checkoutShipping = uniqueUsers(
      checkoutStepEvents.filter((e) => e.properties?.step === "shipping")
    );
    const checkoutPayment = uniqueUsers(
      checkoutStepEvents.filter((e) => e.properties?.step === "payment")
    );
    const ordersCompleted = uniqueUsers(orderCompletedEvents);

    const steps = [
      { name: "הצגת מוצר", count: productViews, dropOff: 0 },
      { name: "הוספה לסל", count: addToCart, dropOff: productViews > 0 ? ((productViews - addToCart) / productViews) * 100 : 0 },
      { name: "צפייה בסל", count: cartViews, dropOff: addToCart > 0 ? ((addToCart - cartViews) / addToCart) * 100 : 0 },
      { name: "התחלת תשלום", count: checkoutStarted, dropOff: cartViews > 0 ? ((cartViews - checkoutStarted) / cartViews) * 100 : 0 },
      { name: "פרטי משלוח", count: checkoutShipping, dropOff: checkoutStarted > 0 ? ((checkoutStarted - checkoutShipping) / checkoutStarted) * 100 : 0 },
      { name: "תשלום", count: checkoutPayment, dropOff: checkoutShipping > 0 ? ((checkoutShipping - checkoutPayment) / checkoutShipping) * 100 : 0 },
      { name: "הזמנה הושלמה", count: ordersCompleted, dropOff: checkoutPayment > 0 ? ((checkoutPayment - ordersCompleted) / checkoutPayment) * 100 : 0 },
    ];

    return {
      steps,
      totalConversion: productViews > 0 ? (ordersCompleted / productViews) * 100 : 0,
    };
  },
});

/**
 * Get cart metrics including abandonment rate
 */
export const getCartMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    const weekStart = getStartOfDay(now - 7 * ONE_DAY);

    // Only events from the last week are used, so read just that range
    // (previously every cart/checkout/order event ever was read).
    const [weekCartEvents, orderEvents] = await Promise.all([
      getEventsInRange(ctx, "cart_item_added", weekStart, todayEnd),
      getEventsInRange(ctx, "order_completed", weekStart, todayEnd),
    ]);

    const todayCartEvents = weekCartEvents.filter(e => e.timestamp >= todayStart && e.timestamp <= todayEnd);

    const todayOrders = orderEvents.filter(e => e.timestamp >= todayStart && e.timestamp <= todayEnd).length;
    const weekOrders = orderEvents.filter(e => e.timestamp >= weekStart && e.timestamp <= todayEnd).length;

    // Calculate abandonment
    const todayCartUsers = new Set(todayCartEvents.map(e => e.userId || e.anonymousId));
    const todayOrderUsers = new Set(
      orderEvents.filter(e => e.timestamp >= todayStart && e.timestamp <= todayEnd)
        .map(e => e.userId || e.anonymousId)
    );

    const abandonedCartsToday = Array.from(todayCartUsers).filter(id => !todayOrderUsers.has(id)).length;
    const abandonmentRateToday = todayCartUsers.size > 0 ? (abandonedCartsToday / todayCartUsers.size) * 100 : 0;

    const calcAvgCartValue = (events: typeof orderEvents) => {
      if (events.length === 0) return 0;
      const total = events.reduce((sum, e) => sum + (e.properties?.total || 0), 0);
      return total / events.length;
    };

    return {
      cartsCreatedToday: todayCartEvents.length,
      cartsCreatedWeek: weekCartEvents.length,
      abandonedCartsToday,
      abandonmentRateToday,
      abandonmentRateChange: 0,
      averageCartValueToday: calcAvgCartValue(orderEvents.filter(e => e.timestamp >= todayStart && e.timestamp <= todayEnd)),
      averageCartValueWeek: calcAvgCartValue(orderEvents.filter(e => e.timestamp >= weekStart && e.timestamp <= todayEnd)),
      ordersToday: todayOrders,
      ordersWeek: weekOrders,
    };
  },
});

/**
 * Get coupon usage metrics
 */
export const getCouponMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Read only this month's events via by_event_timestamp
    const monthEvents = await getEventsSince(ctx, "coupon_applied", monthStart.getTime());

    const successful = monthEvents.filter(e => e.properties?.success);
    const failed = monthEvents.filter(e => !e.properties?.success);

    // Group by coupon code
    const couponStats: Record<string, { uses: number; totalDiscount: number }> = {};
    for (const event of successful) {
      const code = event.properties?.couponCode;
      if (code && typeof code === "string") {
        if (!couponStats[code]) {
          couponStats[code] = { uses: 0, totalDiscount: 0 };
        }
        couponStats[code].uses++;
        couponStats[code].totalDiscount += event.properties?.discountAmount || 0;
      }
    }

    const topCoupons = Object.entries(couponStats)
      .map(([code, stats]) => ({ code, ...stats }))
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 5);

    return {
      totalUsesThisMonth: successful.length,
      failedAttemptsThisMonth: failed.length,
      totalDiscountGiven: successful.reduce((sum, e) => sum + (e.properties?.discountAmount || 0), 0),
      topCoupons,
    };
  },
});

/**
 * Get search analytics
 */
export const getSearchMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const now = Date.now();
    const monthStart = new Date(now);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Read only this month's events via by_event_timestamp
    const monthEvents = await getEventsSince(ctx, "search_performed", monthStart.getTime());

    // Group by query
    const queryStats: Record<string, { count: number; avgResults: number }> = {};
    for (const event of monthEvents) {
      const query = event.properties?.query;
      if (query && typeof query === "string") {
        const normalizedQuery = query.toLowerCase().trim();
        if (!queryStats[normalizedQuery]) {
          queryStats[normalizedQuery] = { count: 0, avgResults: 0 };
        }
        queryStats[normalizedQuery].count++;
        queryStats[normalizedQuery].avgResults = event.properties?.resultsCount || 0;
      }
    }

    const topSearches = Object.entries(queryStats)
      .map(([query, stats]) => ({ query, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const searchesWithZeroResults = monthEvents.filter(e => (e.properties?.resultsCount || 0) === 0).length;

    return {
      totalSearchesThisMonth: monthEvents.length,
      searchesWithZeroResults,
      averageResultsPerSearch: monthEvents.length > 0
        ? monthEvents.reduce((sum, e) => sum + (e.properties?.resultsCount || 0), 0) / monthEvents.length
        : 0,
      topSearches,
    };
  },
});

/**
 * Get sales/revenue time series data
 */
export const getSalesSeries = query({
  args: { interval: v.string() },
  handler: async (ctx, args): Promise<TimeSeriesDataPoint[]> => {
    await requireAdmin(ctx);

    const periods = getTimeSeriesPeriods(
      args.interval as "daily" | "weekly" | "monthly"
    );

    // Read only order_completed events for each period (in parallel)
    const points: TimeSeriesDataPoint[] = await Promise.all(
      periods.map(async (period) => {
        const orders = await getEventsInRange(
          ctx,
          "order_completed",
          period.start,
          period.end
        );
        const revenue = orders.reduce(
          (sum: number, e: any) => sum + (e.properties?.total || 0),
          0
        );
        return {
          name: period.name,
          value: revenue,
          orders: orders.length,
          timestamp: period.timestamp,
        };
      })
    );

    return points;
  },
});
