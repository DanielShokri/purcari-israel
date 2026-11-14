import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Add Convex Auth HTTP routes
auth.addHttpRoutes(http);

// iCredit Payment Gateway Routes (via Rivhit)

/**
 * IPN webhook for iCredit (POST), called when a payment completes or fails.
 * Updates order and payment status.
 */
http.route({
  path: "/icredit/ipn",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.text();

      await ctx.runMutation(internal.icreditHelpers.handleIpnNotification, {
        rawBody: body,
      });


      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[iCredit IPN POST] Error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

/**
 * IPN webhook for iCredit - GET method (fallback).
 */
http.route({
  path: "/icredit/ipn",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const params: Record<string, string> = {};
      url.searchParams.forEach((value, key) => {
        params[key] = value;
      });

      if (params.SaleId || params.saleid) {
        await ctx.runMutation(internal.icreditHelpers.handleIpnNotification, {
          rawBody: JSON.stringify(params),
        });
      }

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[iCredit IPN GET] Error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }),
});

/**
 * Redirect handler for when the user returns from iCredit payment page.
 */
http.route({
  path: "/icredit/redirect",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const orderId = url.searchParams.get("orderId");

    const storefrontUrl = process.env.VITE_STOREFRONT_URL || "http://localhost:5183";

    if (orderId) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${storefrontUrl}/order-confirmation/${orderId}` },
      });
    } else {
      return new Response(null, {
        status: 302,
        headers: { Location: storefrontUrl },
      });
    }
  }),
});

/**
 * Iframe redirect handler for iCredit payment completion.
 */
http.route({
  path: "/icredit/iframe-redirect",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    
    const finalRedirectUrl = url.searchParams.get("finalUrl");
    const status = url.searchParams.get("Status"); // Payment status if available
    const saleId = url.searchParams.get("SaleId");
    const response = url.searchParams.get("Response"); // May contain success/failure info
    
    
    // Get the storefront URL from environment or use default
    const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:5183";
    
    // Build the final destination URL
    let destination = finalRedirectUrl ? decodeURIComponent(finalRedirectUrl) : storefrontUrl;
    
    // Append token and status if available
    const destUrl = new URL(destination);
    // Do NOT forward iCredit's payment Token as ?token=: that is the order access token
    // (already in finalUrl), and overwriting it made orders.getPublic reject the request.
    if (status) destUrl.searchParams.set("paymentStatus", status);
    if (saleId) destUrl.searchParams.set("saleId", saleId);
    if (response) destUrl.searchParams.set("response", response);
    destination = destUrl.toString();
    
    
    // Return HTML page that breaks out of iframe and redirects parent
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>מעבד תשלום...</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f9fafb;
      direction: rtl;
    }
    .loader {
      text-align: center;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #722F37;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader">
    <div class="spinner"></div>
    <p>מעבד תשלום, אנא המתן...</p>
  </div>
  <script>
    // Break out of iframe and redirect parent window
    if (window.top !== window.self) {
      window.top.location.href = ${JSON.stringify(destination)};
    } else {
      window.location.href = ${JSON.stringify(destination)};
    }
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 
        "Content-Type": "text/html; charset=utf-8",
        // Allow this page to be loaded in iframe
        "X-Frame-Options": "ALLOWALL",
      },
    });
  }),
});

export default http;
