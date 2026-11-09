/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as admin from "../admin.js";
import type * as analytics from "../analytics.js";
import type * as analytics_aggregates from "../analytics/aggregates.js";
import type * as analytics_events from "../analytics/events.js";
import type * as analytics_helpers from "../analytics/helpers.js";
import type * as analytics_index from "../analytics/index.js";
import type * as analytics_queries from "../analytics/queries.js";
import type * as auth from "../auth.js";
import type * as authCleanup from "../authCleanup.js";
import type * as authHelpers from "../authHelpers.js";
import type * as cart from "../cart.js";
import type * as cartRules from "../cartRules.js";
import type * as categories from "../categories.js";
import type * as coupons from "../coupons.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as icredit from "../icredit.js";
import type * as icreditHelpers from "../icreditHelpers.js";
import type * as media from "../media.js";
import type * as migrateAnalytics from "../migrateAnalytics.js";
import type * as notifications from "../notifications.js";
import type * as orderItems from "../orderItems.js";
import type * as orderLifecycle from "../orderLifecycle.js";
import type * as orders from "../orders.js";
import type * as pricing from "../pricing.js";
import type * as productImages from "../productImages.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as seedWines from "../seedWines.js";
import type * as systemAnnouncements from "../systemAnnouncements.js";
import type * as userAddresses from "../userAddresses.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  admin: typeof admin;
  analytics: typeof analytics;
  "analytics/aggregates": typeof analytics_aggregates;
  "analytics/events": typeof analytics_events;
  "analytics/helpers": typeof analytics_helpers;
  "analytics/index": typeof analytics_index;
  "analytics/queries": typeof analytics_queries;
  auth: typeof auth;
  authCleanup: typeof authCleanup;
  authHelpers: typeof authHelpers;
  cart: typeof cart;
  cartRules: typeof cartRules;
  categories: typeof categories;
  coupons: typeof coupons;
  crons: typeof crons;
  http: typeof http;
  icredit: typeof icredit;
  icreditHelpers: typeof icreditHelpers;
  media: typeof media;
  migrateAnalytics: typeof migrateAnalytics;
  notifications: typeof notifications;
  orderItems: typeof orderItems;
  orderLifecycle: typeof orderLifecycle;
  orders: typeof orders;
  pricing: typeof pricing;
  productImages: typeof productImages;
  products: typeof products;
  seed: typeof seed;
  seedWines: typeof seedWines;
  systemAnnouncements: typeof systemAnnouncements;
  userAddresses: typeof userAddresses;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  dailyViews: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"dailyViews">;
  activeUsers: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"activeUsers">;
  productViews: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"productViews">;
};
