"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { hasOrderAccess } from "./orderLifecycle";

// iCredit uses SEPARATE test and production servers; tokens only work on their own.
// Host is *.rivhit.co.il (old icredit.co.il hosts fail TLS). Docs: https://rivhit-api.readme.io/docs/test-enviornment-icredit
const ICREDIT_BASE_URLS = {
  test: "https://testicredit.rivhit.co.il/API/PaymentPageRequest.svc",
  production: "https://icredit.rivhit.co.il/API/PaymentPageRequest.svc",
} as const;

function getIcreditApiUrl(environment: "test" | "production", endpoint: string): string {
  return `${ICREDIT_BASE_URLS[environment]}/${endpoint}`;
}

// iCredit API Response status codes
const ICREDIT_STATUS = {
  SUCCESS: 0,
  // Other status codes indicate errors
} as const;

/**
 * Create an iCredit hosted payment page for an order, record a paymentTransactions
 * row, and return the URL. API: https://rivhit-api.readme.io/reference/post_api-paymentpagerequest-svc-geturl
 */
export const createPaymentPage = action({
  args: {
    orderId: v.id("orders"),
    accessToken: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{
    success: boolean;
    paymentUrl?: string;
    paymentTransactionId?: Id<"paymentTransactions">;
    error?: string;
  }> => {
    // 1. Get iCredit GroupPrivateToken (Payment Page ID) from environment
    // This is the "מזהה דף תשלום" from the iCredit dashboard
    const groupPrivateToken = process.env.RIVHIT_API_TOKEN;
    if (!groupPrivateToken) {
      return {
        success: false,
        error: "RIVHIT_API_TOKEN environment variable is not set",
      };
    }

    // 2. Determine environment
    const environment = (process.env.RIVHIT_ENVIRONMENT || "test") as "test" | "production";

    // 3. Get site URL for callbacks
    const siteUrl = process.env.CONVEX_SITE_URL;
    if (!siteUrl) {
      return {
        success: false,
        error: "CONVEX_SITE_URL environment variable is not set",
      };
    }

    // Get storefront URL for redirect after payment
    const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";

    // 4 + 5. Read the order and its items in parallel
    const [order, orderItems] = await Promise.all([
      ctx.runQuery(internal.icreditHelpers.getOrderById, {
        orderId: args.orderId,
      }),
      ctx.runQuery(internal.icreditHelpers.getOrderItems, {
        orderId: args.orderId,
      }),
    ]);

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    const userId = await getAuthUserId(ctx);
    const user = userId ? await ctx.runQuery(internal.icreditHelpers.getUserById, { userId }) : null;
    if (!hasOrderAccess(order, user, args.accessToken)) return { success: false, error: "Access denied" };

    // A cancelled (or any non-pending) order can no longer receive a new payment page.
    if (order.status !== "pending") return { success: false, error: "ההזמנה אינה פתוחה לתשלום" };

    // Reuse an existing open transaction with a payment URL instead of creating one per click,
    // so a page refresh or retry does not generate a new iCredit sale each time.
    const existing = await ctx.runQuery(internal.icreditHelpers.getLatestPaymentTransaction, {
      orderId: args.orderId,
    });
    if (existing && existing.status === "pending" && existing.rivhitPaymentUrl) {
      return {
        success: true,
        paymentUrl: existing.rivhitPaymentUrl,
        paymentTransactionId: existing._id,
      };
    }

    // 6. Create a pending payment transaction record first
    const paymentTransactionId = await ctx.runMutation(
      internal.icreditHelpers.createPaymentTransaction,
      {
        orderId: args.orderId,
        amount: order.total,
        environment,
        status: "pending",
      }
    );

    // Build callback URLs: an intermediary handler breaks out of the iframe and
    // redirects to the order confirmation page.
    const tokenQuery = order.accessToken ? `?token=${encodeURIComponent(order.accessToken)}` : "";
    const finalDestination = `${storefrontUrl}/order-confirmation/${args.orderId}${tokenQuery}`;
    const finalFailDestination = `${storefrontUrl}/order-confirmation/${args.orderId}${tokenQuery ? `${tokenQuery}&` : "?"}status=failed`;
    
    // RedirectURL points to our iframe-redirect handler which will redirect the parent window
    const redirectUrl = `${siteUrl}/icredit/iframe-redirect?finalUrl=${encodeURIComponent(finalDestination)}`;
    const failRedirectUrl = `${siteUrl}/icredit/iframe-redirect?finalUrl=${encodeURIComponent(finalFailDestination)}`;
    
    // IPNURL - webhook for payment notifications (server-to-server)
    const ipnUrl = `${siteUrl}/icredit/ipn`;
    

    // Build the GetUrl request. Required: GroupPrivateToken, Items, CustomerLastName.
    // Spec: https://rivhit-api.readme.io/reference/post_api-paymentpagerequest-svc-geturl
    
    // Build items array - prices already include tax
    const items = orderItems.map((item) => ({
      Description: item.productName,
      Quantity: item.quantity,
      UnitPrice: item.price,
    }));
    
    // Add shipping as a line item if non-zero
    if (order.shippingCost > 0) {
      items.push({
        Description: "משלוח",
        Quantity: 1,
        UnitPrice: order.shippingCost,
      });
    }
    
    // Add discount as a negative line item if applicable
    if (order.discount && order.discount > 0) {
      items.push({
        Description: "הנחה",
        Quantity: 1,
        UnitPrice: -order.discount,
      });
    }
    

    // iCredit rejects over-long values instead of truncating them server-side,
    // so clamp every length-constrained field to the documented maximum.
    const clamp = (value: string | undefined, max: number): string | undefined => {
      const trimmed = value?.trim();
      if (!trimmed) return undefined;
      return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
    };

    // CustomerLastName is required (1-30) and FirstName must be non-empty (1-20);
    // Hebrew names don't split reliably, so full name goes to LastName.
    const fullName = order.customerName.trim() || "לקוח";
    const firstName = fullName.split(/\s+/)[0] || fullName;
    
    const requestBody = {
      // Required: Payment Page ID (GroupPrivateToken)
      GroupPrivateToken: groupPrivateToken,
      
      // Items (PascalCase field names for iCredit API)
      Items: items,
      
      // Callback URLs
      RedirectURL: redirectUrl,
      FailRedirectURL: failRedirectUrl,
      IPNURL: ipnUrl,
      // Also report failures to the IPN endpoint so the transaction is marked
      // failed instead of being left pending forever.
      IPNFailureURL: ipnUrl,
      IPNMethod: 1, // 1 = POST (recommended), 2 = GET
      
      // Custom data to identify the order in IPN callback
      // Using Custom1 field to pass our order context
      Custom1: JSON.stringify({
        orderId: args.orderId,
        paymentTransactionId,
      }),
      
      // Customer information
      CustomerLastName: clamp(fullName, 30),
      CustomerFirstName: clamp(firstName, 20),
      EmailAddress: clamp(order.customerEmail, 50),
      PhoneNumber: clamp(order.customerPhone, 15),
      Address: clamp(order.shippingStreet, 30),
      City: clamp(order.shippingCity, 20),
      
      // Payment settings
      PriceIncludeVAT: true,
      Currency: 1, // 1 = ILS (Israeli Shekel)
      MaxPayments: 12, // Allow up to 12 installments
      
      // Customer management
      CreateCustomer: true,
      FindByMail: true,
      SendMail: true,
      
      // UI settings
      DocumentLanguage: "he", // Hebrew
      DisplayBackButton: true,
    };

    // 9. Call iCredit GetUrl API
    try {
      const apiUrl = getIcreditApiUrl(environment, "GetUrl");
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json() as {
        Status: number;
        DebugMessage: string | null;
        URL: string | null;
        PrivateSaleToken: string | null;
        PublicSaleToken: string | null;
      };


      // 10. Process response
      if (result.Status === ICREDIT_STATUS.SUCCESS && result.URL) {
        // Success - update payment transaction with URL and tokens
        await ctx.runMutation(internal.icreditHelpers.updatePaymentTransaction, {
          paymentTransactionId,
          // Stored in the existing schema field (the iCredit gateway is provided via Rivhit)
          rivhitPaymentUrl: result.URL,
          // Store the sale tokens for later verification
          ipnData: JSON.stringify({
            privateSaleToken: result.PrivateSaleToken,
            publicSaleToken: result.PublicSaleToken,
          }),
        });

        return {
          success: true,
          paymentUrl: result.URL,
          paymentTransactionId,
        };
      } else {
        // Error - update payment transaction with error
        const errorMessage = result.DebugMessage || `iCredit error (Status: ${result.Status})`;
        
        await ctx.runMutation(internal.icreditHelpers.applyPaymentOutcome, {
          paymentTransactionId,
          outcome: { type: "failed", errorMessage },
        });

        return {
          success: false,
          error: errorMessage,
          paymentTransactionId,
        };
      }
    } catch (error) {
      // Network or parsing error
      const errorMessage = error instanceof Error ? error.message : "Network error";
      
      await ctx.runMutation(internal.icreditHelpers.applyPaymentOutcome, {
        paymentTransactionId,
        outcome: { type: "failed", errorMessage },
      });

      return {
        success: false,
        error: errorMessage,
        paymentTransactionId,
      };
    }
  },
});

/**
 * Pull the authoritative payment state via SaleDetails, since the IPN can be delayed or lost.
 * The sale token comes from the stored transaction and the caller must own the order.
 */
export const verifyPaymentStatus = action({
  args: {
    orderId: v.id("orders"),
    accessToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const order = await ctx.runQuery(internal.icreditHelpers.getOrderById, {
      orderId: args.orderId,
    });
    if (!order) return { success: false, error: "Order not found" };

    const userId = await getAuthUserId(ctx);
    const user = userId
      ? await ctx.runQuery(internal.icreditHelpers.getUserById, { userId })
      : null;
    if (!hasOrderAccess(order, user, args.accessToken)) return { success: false, error: "Access denied" };

    const transaction = await ctx.runQuery(
      internal.icreditHelpers.getLatestPaymentTransaction,
      { orderId: args.orderId }
    );
    if (!transaction) return { success: false, status: "pending", error: "No payment transaction" };

    // Nothing to verify for terminal states.
    if (transaction.status === "completed" || transaction.status === "cancelled") {
      return { success: true, status: transaction.status };
    }

    // The sale token was captured when the payment page was created.
    let privateSaleToken: string | undefined;
    try {
      const stored = JSON.parse(transaction.ipnData || "{}");
      privateSaleToken = stored.privateSaleToken;
    } catch {
      // ipnData may hold a raw IPN body; not fatal, we just can't verify.
    }
    if (!privateSaleToken) {
      return { success: false, status: transaction.status, error: "No sale token stored" };
    }

    const environment = (transaction.environment || "test") as "test" | "production";
    const apiUrl = getIcreditApiUrl(environment, "SaleDetails");

    let sale: Record<string, unknown>;
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ SalePrivateToken: privateSaleToken }),
      });
      sale = (await response.json()) as Record<string, unknown>;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network error";
      return { success: false, status: transaction.status, error: message };
    }

    // A sale that was never completed has no TransactionStatus yet.
    const rawStatus = sale.TransactionStatus;
    if (rawStatus === undefined || rawStatus === null) {
      return { success: true, status: transaction.status, verified: false };
    }

    const status = Number(rawStatus);

    if (status === 0) {
      await ctx.runMutation(internal.icreditHelpers.applyPaymentOutcome, {
        paymentTransactionId: transaction._id,
        outcome: {
          type: "succeeded",
          fields: {
            rivhitDocumentNumber: Number(sale.DocumentNum ?? sale.ReceiptNum) || undefined,
            rivhitDocumentLink: (sale.DocumentURL ?? sale.ReceiptURL) as string | undefined,
            rivhitCustomerId: Number(sale.CustomerId) || undefined,
            rivhitConfirmationNumber: Number(sale.AuthNum) || undefined,
            ipnData: JSON.stringify({ privateSaleToken, ipn: sale }),
          },
        },
      });

      return {
        success: true,
        status: "completed",
        documentNumber: Number(sale.DocumentNum) || undefined,
        documentUrl: (sale.DocumentURL as string) || undefined,
      };
    }

    // Non-zero TransactionStatus on an existing sale is a declined payment.
    if (status > 0) {
      await ctx.runMutation(internal.icreditHelpers.applyPaymentOutcome, {
        paymentTransactionId: transaction._id,
        outcome: {
          type: "failed",
          errorMessage:
            (sale.ClientMessage as string) ||
            (sale.DebugMessage as string) ||
            `iCredit declined (status ${status})`,
        },
      });
      return { success: true, status: "failed" };
    }

    return { success: true, status: transaction.status, verified: false };
  },
});
