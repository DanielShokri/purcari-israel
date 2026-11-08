import { v } from "convex/values";
import { adminQuery } from "./authHelpers";

// Hebrew month names
const hebrewMonths = [
  "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
  "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

export const getStats = adminQuery({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString();
    const startOfLastMonth = new Date(currentMonth === 0 ? currentYear - 1 : currentYear, currentMonth === 0 ? 11 : currentMonth - 1, 1).toISOString();
    // Last month ends where this month starts (the previous end value was the
    // *start* of the last day, which dropped that day's orders).

    // Day boundaries for the order change calculation (today vs yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Run all independent reads in parallel
    const [
      thisMonthOrdersAll,
      lastMonthOrdersAll,
      allOrders,
      allUsers,
      allTodayOrders,
      allYesterdayOrders,
      cancelledOrders,
      pendingOrders,
    ] = await Promise.all([
      // This month's orders (cancelled orders are excluded below)
      ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", startOfMonth))
        .collect(),
      // Last month's orders
      ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) =>
          q.gte("createdAt", startOfLastMonth).lt("createdAt", startOfMonth)
        )
        .collect(),
      ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", "completed"))
        .collect(),
      ctx.db
        .query("users")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect(),
      ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) => q.gte("createdAt", today.toISOString()))
        .collect(),
      // Range is applied in the index (instead of .filter) so only yesterday's rows are read
      ctx.db
        .query("orders")
        .withIndex("by_createdAt", (q) =>
          q.gte("createdAt", yesterday.toISOString()).lt("createdAt", today.toISOString())
        )
        .collect(),
      ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", "cancelled"))
        .collect(),
      ctx.db
        .query("orders")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
    ]);

    const notCancelled = (o: { status: string }) => o.status !== "cancelled";
    const thisMonthOrders = thisMonthOrdersAll.filter(notCancelled);
    const lastMonthOrders = lastMonthOrdersAll.filter(notCancelled);

    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Calculate revenue change
    const thisMonthRevenue = thisMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + o.total, 0);
    const revenueChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0;

    // Calculate user change
    const thisMonthUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const userDate = new Date(u.createdAt);
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
    }).length;
    const lastMonthUsers = allUsers.filter(u => {
      if (!u.createdAt) return false;
      const userDate = new Date(u.createdAt);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return userDate.getMonth() === lastMonth && userDate.getFullYear() === lastMonthYear;
    }).length;
    const usersChange = lastMonthUsers > 0
      ? ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0;

    const ordersChange = allYesterdayOrders.length > 0
      ? ((allTodayOrders.length - allYesterdayOrders.length) / allYesterdayOrders.length) * 100
      : 0;

    return {
      totalSales: allOrders.length,
      totalRevenue,
      revenueChange,
      orderCount: allTodayOrders.length + allYesterdayOrders.length + thisMonthOrders.length,
      newOrders: thisMonthOrders.length,
      ordersChange,
      customerCount: allUsers.length,
      totalUsers: allUsers.length,
      usersChange,
      averageOrderValue: allOrders.length > 0 ? totalRevenue / allOrders.length : 0,
      salesGrowth: revenueChange,
      orderGrowth: ordersChange,
      customerGrowth: usersChange,
      cancelledOrders: cancelledOrders.length,
      pendingOrders: pendingOrders.length,
      conversionRate: 0,
    };
  }
});

export const getMonthlySales = adminQuery({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const targetYear = (args.year as number | undefined) || new Date().getFullYear();
    const startOfYear = `${targetYear}-01-01`;
    const endOfYear = `${targetYear + 1}-01-01`;

    // Get completed orders for the target year using the status+createdAt index
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_status_createdAt", (q) =>
        q
          .eq("status", "completed")
          .gte("createdAt", startOfYear)
          .lt("createdAt", endOfYear)
      )
      .collect();

    // Initialize monthly data with zeros
    const monthlyData = hebrewMonths.map((month, index) => ({
      name: month,
      value: 0,
      month: index,
    }));

    // Aggregate orders by month
    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      const month = orderDate.getMonth();
      monthlyData[month].value += (order.total || 0);
    }

    return monthlyData;
  }
});

/**
 * Get available years for sales data based on orders
 */
export const getAvailableYears = adminQuery({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    const years = new Set<number>();

    for (const order of orders) {
      const orderDate = new Date(order.createdAt);
      years.add(orderDate.getFullYear());
    }

    // If no orders, return current year
    if (years.size === 0) {
      years.add(new Date().getFullYear());
    }

    // Return sorted array (descending - newest first)
    return Array.from(years).sort((a, b) => b - a);
  }
});

/**
 * Admin-only global prefix search across products, orders and users
 * using Convex search indexes.
 */
export const globalSearch = adminQuery({
  args: { 
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const limit = (args.limit as number | undefined) || 10;
    const searchQuery = (args.query as string).trim();
    
    if (!searchQuery) {
      return {
        products: [],
        orders: [],
        users: [],
        categories: [],
        counts: {
          total: 0,
          products: 0,
          orders: 0,
          users: 0,
          categories: 0,
        },
        searchTime: 0,
      };
    }

    // Run all independent searches in parallel
    const [productsHe, productsEn, orders, users, usersByEmail, allCategories] =
      await Promise.all([
        // Search products (Hebrew and English)
        ctx.db
          .query("products")
          .withSearchIndex("search_he", (q) =>
            q.search("productNameHe", searchQuery)
          )
          .take(limit),
        ctx.db
          .query("products")
          .withSearchIndex("search_en", (q) =>
            q.search("productName", searchQuery)
          )
          .take(limit),
        // Search orders by customer email
        ctx.db
          .query("orders")
          .withSearchIndex("search_orders", (q) =>
            q.search("customerEmail", searchQuery)
          )
          .take(limit),
        // Search users by name
        ctx.db
          .query("users")
          .withSearchIndex("search_users", (q) =>
            q.search("name", searchQuery)
          )
          .take(limit),
        // Also try exact email match for users
        ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", searchQuery))
          .take(limit),
        // Categories (only if query is short enough for substring match)
        searchQuery.length <= 50
          ? ctx.db.query("categories").collect()
          : Promise.resolve([]),
      ]);

    // Combine and deduplicate products
    const productMap = new Map();
    [...productsHe, ...productsEn].forEach(p => {
      if (!productMap.has(p._id)) {
        productMap.set(p._id, p);
      }
    });
    const products = Array.from(productMap.values()).slice(0, limit);

    // Combine and deduplicate users
    const userMap = new Map();
    [...users, ...usersByEmail].forEach(u => {
      if (!userMap.has(u._id)) {
        userMap.set(u._id, u);
      }
    });
    const allUsers = Array.from(userMap.values()).slice(0, limit);

    // Search categories (if query is short enough for exact match)
    let categories: any[] = [];
    if (searchQuery.length <= 50) {
      categories = allCategories.filter((c: any) => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nameHe && c.nameHe.includes(searchQuery)) ||
        c.slug.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, limit);
    }

    const searchTime = (Date.now() - startTime) / 1000;

    return {
      products,
      orders,
      users: allUsers,
      categories,
      counts: {
        total: products.length + orders.length + allUsers.length + categories.length,
        products: products.length,
        orders: orders.length,
        users: allUsers.length,
        categories: categories.length,
      },
      searchTime,
    };
  }
});
