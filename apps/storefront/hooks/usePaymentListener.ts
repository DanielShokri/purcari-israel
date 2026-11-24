import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Exact origins only: a substring match would also accept look-alikes such as
// https://icredit.rivhit.co.il.evil.example.
const ICREDIT_ORIGINS = new Set(['https://icredit.rivhit.co.il', 'https://testicredit.rivhit.co.il']);

// Our own /icredit/iframe-redirect page (on the Convex site) posts here when payment ends.
// Derived from VITE_CONVEX_URL (https://<name>.convex.cloud -> https://<name>.convex.site).
const CONVEX_SITE_ORIGIN = (() => {
  try {
    const url = new URL(import.meta.env.VITE_CONVEX_URL as string);
    return url.origin.replace(/\.convex\.cloud$/, '.convex.site');
  } catch {
    return null;
  }
})();

/**
 * Returns the in-app path (+query) to navigate to, or null unless the URL is a
 * same-origin /order-confirmation/<currentOrderId> page.
 */
function safeConfirmationTarget(rawUrl: unknown, orderId: string): { to: string; failed: boolean } | null {
  if (typeof rawUrl !== 'string') return null;
  try {
    const url = new URL(rawUrl);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname !== `/order-confirmation/${orderId}`) return null;
    return { to: `${url.pathname}${url.search}`, failed: url.searchParams.get('status') === 'failed' };
  } catch {
    return null;
  }
}

/**
 * Listens for payment-completion postMessages from the iCredit iframe.
 * Navigates to the order confirmation or calls onPaymentComplete.
 */
export function usePaymentListener(
  currentOrderId: string | null,
  onPaymentComplete?: (orderId: string) => void,
  onRedirect?: (result: { failed: boolean }) => void
) {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      // Redirect request from our own iframe-redirect page. It carries no payment
      // authority (the server decides that via IPN); it only says where to go.
      if (CONVEX_SITE_ORIGIN && event.origin === CONVEX_SITE_ORIGIN) {
        if (event.data?.type === 'icredit-redirect' && currentOrderId) {
          const target = safeConfirmationTarget(event.data.url, currentOrderId);
          if (target) {
            onRedirect?.({ failed: target.failed });
            navigate(target.to);
          }
        }
        return;
      }

      // Only handle messages from iCredit domains (test and production)
      if (!ICREDIT_ORIGINS.has(event.origin)) return;


      // Require explicit success indicators: iCredit's Status 0 is a generic OK also
      // sent with housekeeping messages like ParentFrameLoad.
      const data = event.data;
      const isPaymentComplete = !!data && (
        data.type === 'payment_complete' ||
        data.status === 'success' ||
        (data.Status === 0 && (data.SaleId || data.saleId))
      );

      if (isPaymentComplete && currentOrderId) {
        if (onPaymentComplete) {
          onPaymentComplete(currentOrderId);
        } else {
          navigate(`/order-confirmation/${currentOrderId}`);
        }
      }
    };

    window.addEventListener('message', handlePaymentMessage);
    return () => window.removeEventListener('message', handlePaymentMessage);
  }, [currentOrderId, navigate, onPaymentComplete, onRedirect]);
}
