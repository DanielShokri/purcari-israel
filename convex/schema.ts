import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  // Standard Convex Auth tables (authAccounts, authSessions, etc.)
  ...authTables,

  // Maps a stable key (e.g. "wines/01_divin_bardar_silver") to a Convex file
  // storage id, so product docs can reference images hosted on Convex.
  productImages: defineTable({
    key: v.string(),
    storageId: v.id("_storage"),
    sourceUrl: v.optional(v.string()),
  })
    .index("by_key", ["key"]),

  users: defineTable({
    // Keep optional to handle the "race condition" during initial auth signup
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),

    role: v.optional(
      v.union(v.literal("admin"), v.literal("viewer"))
    ),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("suspended"))
    ),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
    
    cart: v.optional(
      v.object({
        items: v.array(v.any()),
        appliedCoupon: v.optional(v.any()),
        updatedAt: v.string(),
      })
    ),
  })
    .index("email", ["email"])
    .index("phone", ["phone"])
    .index("by_role", ["role"])
    .index("by_status", ["status"])
    .index("by_role_status", ["role", "status"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_users", { searchField: "name", filterFields: ["role"] }),

  userAddresses: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    street: v.string(),
    apartment: v.optional(v.string()),
    city: v.string(),
    postalCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
    userId: v.id("users"),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_default", ["userId", "isDefault"]),

  // Separate carts table to avoid hitting 1MB document limit
  carts: defineTable({
    userId: v.id("users"),
    items: v.array(v.any()),
    appliedCoupon: v.optional(v.any()),
    updatedAt: v.string(),
  })
    .index("by_userId", ["userId"]),

  products: defineTable({
    productName: v.string(),
    productNameHe: v.optional(v.string()),
    price: v.float64(),
    quantityInStock: v.number(), 
    sku: v.string(),
    category: v.id("categories"), // Refined to v.id for integrity

    description: v.optional(v.string()),
    descriptionHe: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    shortDescriptionHe: v.optional(v.string()),
    salePrice: v.optional(v.float64()),
    onSale: v.optional(v.boolean()),

    wineType: v.optional(
      v.union(
        v.literal("Red"),
        v.literal("White"),
        v.literal("Rosé"),
        v.literal("Sparkling")
      )
    ),
    region: v.optional(v.string()),
    vintage: v.optional(v.number()),
    alcoholContent: v.optional(v.float64()),
    volume: v.optional(v.string()), 
    grapeVariety: v.optional(v.string()),
    servingTemperature: v.optional(v.string()),
    tastingNotes: v.optional(v.string()),

    featuredImage: v.optional(v.string()), 
    images: v.optional(v.array(v.string())), 

    isFeatured: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
    relatedProducts: v.optional(v.array(v.id("products"))), // Refined to v.id

    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("hidden"),
        v.literal("discontinued")
      )
    ),
    stockStatus: v.optional(
      v.union(
        v.literal("in_stock"),
        v.literal("out_of_stock"),
        v.literal("low_stock")
      )
    ),

    dateAdded: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .searchIndex("search_he", { searchField: "productNameHe" })
    .searchIndex("search_en", { searchField: "productName" })
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_wineType", ["wineType"])
    .index("by_stockStatus", ["stockStatus"])
    .index("by_isFeatured", ["isFeatured"])
    .index("by_onSale", ["onSale"])
    .index("by_createdAt", ["createdAt"]),

  categories: defineTable({
    name: v.string(),
    nameHe: v.optional(v.string()),
    slug: v.string(),
    description: v.optional(v.string()),
    parentId: v.optional(v.id("categories")), // Refined to v.id
    order: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("draft"), v.literal("hidden"))),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_slug", ["slug"])
    .index("by_parentId", ["parentId"])
    .index("by_status", ["status"]),

  orders: defineTable({
    customerId: v.optional(v.id("users")), 
    customerName: v.string(),
    customerEmail: v.string(),
    customerPhone: v.optional(v.string()),
    customerAvatar: v.optional(v.string()),
    // Secret capability for guest order confirmation and payment retries.
    accessToken: v.optional(v.string()),

    // Short human-readable order number (e.g., 1001, 1002)
    orderNumber: v.optional(v.number()),

    subtotal: v.float64(),
    tax: v.float64(),
    shippingCost: v.float64(),
    discount: v.optional(v.float64()),
    total: v.float64(),

    shippingStreet: v.string(),
    shippingApartment: v.optional(v.string()),
    shippingCity: v.string(),
    shippingPostalCode: v.string(),
    shippingCountry: v.string(),

    paymentMethod: v.string(),
    paymentCardExpiry: v.optional(v.string()),
    paymentTransactionId: v.string(),
    paymentChargeDate: v.string(),

    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("cancelled"),
      v.literal("shipped")
    ),

    appliedCouponCode: v.optional(v.string()),
    appliedCouponDiscount: v.optional(v.float64()),

    // True while this order holds stock; released on cancel.
    stockReserved: v.optional(v.boolean()),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_customerEmail", ["customerEmail"])
    .index("by_customerId", ["customerId"])
    .index("by_status", ["status"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_status_createdAt", ["status", "createdAt"])
    .index("by_createdAt", ["createdAt"])
    .searchIndex("search_orders", { searchField: "customerEmail", filterFields: ["status"] }),

  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("products"),
    productName: v.string(),
    productImage: v.optional(v.string()),
    variant: v.optional(v.string()),
    quantity: v.number(),
    price: v.float64(),
    total: v.float64(),
  }).index("by_orderId", ["orderId"]),

  coupons: defineTable({
    code: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("paused"),
      v.literal("expired"),
      v.literal("scheduled")
    ),
    description: v.optional(v.string()),

    discountType: v.union(
      v.literal("percentage"), 
      v.literal("fixed_amount"), 
      v.literal("free_shipping"), 
      v.literal("free_product"), 
      v.literal("buy_x_get_y") 
    ),
    discountValue: v.float64(),

    buyQuantity: v.optional(v.number()),
    getQuantity: v.optional(v.number()),

    startDate: v.string(), 
    endDate: v.optional(v.string()),
    minimumOrder: v.optional(v.float64()),
    maximumDiscount: v.optional(v.float64()),

    usageLimit: v.optional(v.number()), 
    usageLimitPerUser: v.optional(v.number()), 
    usageCount: v.number(), 

    categoryIds: v.optional(v.array(v.id("categories"))),
    productIds: v.optional(v.array(v.id("products"))),
    userIds: v.optional(v.array(v.id("users"))),
    firstPurchaseOnly: v.optional(v.boolean()),
    excludeOtherCoupons: v.optional(v.boolean()),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status"]),

  couponUsage: defineTable({
    couponId: v.id("coupons"),
    couponCode: v.string(),
    userId: v.optional(v.id("users")),
    userEmail: v.string(),
    usageCount: v.number(),
    lastUsedAt: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_couponCode_userEmail", ["couponCode", "userEmail"])
    .index("by_userId", ["userId"]),

  cartRules: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.union(v.literal("draft"), v.literal("active"), v.literal("paused")),
    ruleType: v.union(v.literal("buy_x_get_y"), v.literal("bulk_discount"), v.literal("shipping")),
    config: v.union(
      v.object({
        type: v.literal("buy_x_get_y"),
        buyQuantity: v.number(),
        getQuantity: v.number(),
        discountProductId: v.optional(v.id("products")),
        discountPercentage: v.optional(v.number()),
      }),
      v.object({
        type: v.literal("bulk_discount"),
        minQuantity: v.number(),
        discountPercentage: v.number(),
        maxDiscountAmount: v.optional(v.float64()),
      }),
      v.object({
        type: v.literal("shipping"),
        minOrderAmount: v.number(),
      })
    ),
    priority: v.optional(v.number()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_ruleType", ["ruleType"]),

  analyticsEvents: defineTable({
    userId: v.optional(v.id("users")),
    anonymousId: v.optional(v.string()),
    event: v.string(),
    properties: v.any(),
    timestamp: v.number(),
  })
    .index("by_event", ["event"])
    .index("by_userId", ["userId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_event_timestamp", ["event", "timestamp"])
    .index("by_userId_event", ["userId", "event"])
    .index("by_anon_id", ["anonymousId"]),

  activities: defineTable({
    title: v.string(),
    subtitle: v.string(),
    type: v.union(
      v.literal("order"),
      v.literal("payment"),
      v.literal("inventory"),
      v.literal("user_action"),
      v.literal("system")
    ),
    color: v.optional(v.string()),
    relatedId: v.optional(v.string()),
    createdAt: v.string(),
  })
    .index("by_type", ["type"])
    .index("by_createdAt", ["createdAt"]),

  notifications: defineTable({
    userId: v.id("users"), 
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("warning"),
      v.literal("error"),
      v.literal("success"),
      v.literal("order"),
      v.literal("system"),
      v.literal("inventory"),
      v.literal("user_action"),
      v.literal("payment"),
      v.literal("promotion"),
      v.literal("price_change"),
      v.literal("system_error")
    ),
    isRead: v.boolean(),
    icon: v.optional(v.string()),
    orderId: v.optional(v.id("orders")),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_isRead", ["userId", "isRead"]),

  // Rivhit Payment Transactions - tracks payment lifecycle for Israeli payment gateway
  paymentTransactions: defineTable({
    orderId: v.id("orders"),
    rivhitPaymentUrl: v.optional(v.string()),
    rivhitDocumentType: v.optional(v.number()),
    rivhitDocumentNumber: v.optional(v.number()),
    rivhitCustomerId: v.optional(v.number()),
    rivhitDocumentLink: v.optional(v.string()),
    rivhitConfirmationNumber: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    amount: v.number(),
    environment: v.string(), // 'test' | 'production'
    ipnData: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_orderId", ["orderId"])
    .index("by_status", ["status"]),

  // System Announcements - for banner notifications on storefront
  systemAnnouncements: defineTable({
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
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_status_startDate", ["status", "startDate"]),

  // Counter table for atomic order number generation
  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
});