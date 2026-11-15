/**
 * Store policy numbers shared by the Shipping/Terms pages, the Product schema and the prerender
 * script, so the copy shoppers read and the markup crawlers read cannot drift apart.
 * The fee and threshold mirror the live announcement banner and convex/pricing.ts.
 */
export const FREE_SHIPPING_THRESHOLD = 300; // ILS, free shipping above this order total
export const SHIPPING_FEE = 30; // ILS, below the threshold
export const RETURN_WINDOW_DAYS = 14; // consumer-protection cancellation window
export const REFUND_BUSINESS_DAYS = 14; // refund after the cancellation is approved
