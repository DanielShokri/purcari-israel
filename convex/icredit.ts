"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// iCredit API Configuration
// CRITICAL: iCredit uses SEPARATE servers for test and production.
// Test tokens only work on the test server, production tokens only on production.
const ICREDIT_BASE_URLS = {
  test: "https://testicredit.icredit.co.il/API/PaymentPageRequest.svc",
  production: "https://icredit.icredit.co.il/API/PaymentPageRequest.svc",
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
 * Create an iCredit hosted payment page for an order.
 * 
 * This action:
 * 1. Reads the order from the database
 * 2. Calls iCredit GetUrl API to create a hosted payment page
 * 3. Creates a paymentTransactions record to track the payment
 * 4. Returns the payment page URL for redirect
 * 
 * iCredit uses the Rivhit infrastructure but has a different API format.
 * API docs: https://icredit.icredit.co.il/API/PaymentPageRequest.svc/help
 */
export const createPaymentPage = action({
  args: {
    orderId: v.id("orders"),
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
      return {
        success: false,
        error: "Order not found",
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

    // 7. Build callback URLs
    // For iframe mode, we use an intermediary redirect handler that breaks out of the iframe
    // The final destination is the order confirmation page
    const finalDestination = `${storefrontUrl}/order-confirmation/${args.orderId}`;
    const finalFailDestination = `${storefrontUrl}/order-confirmation/${args.orderId}?status=failed`;
    
    // RedirectURL points to our iframe-redirect handler which will redirect the parent window
    const redirectUrl = `${siteUrl}/icredit/iframe-redirect?finalUrl=${encodeURIComponent(finalDestination)}`;
    const failRedirectUrl = `${siteUrl}/icredit/iframe-redirect?finalUrl=${encodeURIComponent(finalFailDestination)}`;
    
    // IPNURL - webhook for payment notifications (server-to-server)
    const ipnUrl = `${siteUrl}/icredit/ipn`;
    
    console.log("[iCredit] Order total:", order.total, "Items total:", order.subtotal, "Shipping:", order.shippingCost, "Tax:", order.tax);

    // 8. Build the iCredit GetUrl request
    // API docs: https://icredit.icredit.co.il/API/PaymentPageRequest.svc/help/operations/GetUrl
    
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
    
    console.log("[iCredit] Sending items:", items.length, "items, total:", order.total);
    console.log("[iCredit] Callback URLs:", { redirectUrl, failRedirectUrl, ipnUrl });
    
    const requestBody = {
      // Required: Payment Page ID (GroupPrivateToken)
      GroupPrivateToken: groupPrivateToken,
      
      // Items (PascalCase field names for iCredit API)
      Items: items,
      
      // Callback URLs
      RedirectURL: redirectUrl,
      FailRedirectURL: failRedirectUrl,
      IPNURL: ipnUrl,
      IPNMethod: 1, // 1 = POST (recommended), 2 = GET
      
      // Custom data to identify the order in IPN callback
      // Using Custom1 field to pass our order context
      Custom1: JSON.stringify({
        orderId: args.orderId,
        paymentTransactionId,
      }),
      
      // Customer information
      CustomerLastName: order.customerName,
      CustomerFirstName: "", // Hebrew names often don't split well
      EmailAddress: order.customerEmail,
      PhoneNumber: order.customerPhone || undefined,
      Address: order.shippingStreet,
      City: order.shippingCity,
      
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
      console.log(`[iCredit] Calling GetUrl API (${environment}) for order:`, args.orderId);
      console.log(`[iCredit] URL: ${apiUrl}`);
      
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

      console.log("[iCredit] API Response:", JSON.stringify(result));

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
        console.error("[iCredit] API Error:", errorMessage);
        
        await ctx.runMutation(internal.icreditHelpers.updatePaymentTransaction, {
          paymentTransactionId,
          status: "failed",
          errorMessage,
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
      console.error("[iCredit] Network error:", errorMessage);
      
      await ctx.runMutation(internal.icreditHelpers.updatePaymentTransaction, {
        paymentTransactionId,
        status: "failed",
        errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
        paymentTransactionId,
      };
    }
  },
});
