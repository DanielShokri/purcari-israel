import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Listens for payment-completion postMessages from the iCredit iframe.
 * Navigates to the order confirmation or calls onPaymentComplete.
 */
export function usePaymentListener(
  currentOrderId: string | null,
  onPaymentComplete?: (orderId: string) => void
) {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePaymentMessage = (event: MessageEvent) => {
      // Only handle messages from iCredit domains (test and production)
      const isIcreditOrigin =
        event.origin.includes('icredit.rivhit.co.il') ||
        event.origin.includes('testicredit.rivhit.co.il');

      if (!isIcreditOrigin) return;


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
  }, [currentOrderId, navigate, onPaymentComplete]);
}
