import { useState, useCallback } from 'react';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { CartItem, AppliedCoupon } from '@shared/types';
import { CheckoutInput } from '../schemas/validationSchemas';

export interface UsePaymentProcessingParams {
  getFormData: () => CheckoutInput;
  createOrder: ReturnType<typeof useMutation<typeof api.orders.create>>;
  createPaymentPage: ReturnType<typeof useAction<typeof api.icredit.createPaymentPage>>;
  cartItems: CartItem[];
  user: { _id: string; name?: string; email?: string; phone?: string } | null;
  subtotal: number;
  shipping: number;
  totalDiscount: number;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  /**
   * Called once an order exists, before the slow payment-page request finishes,
   * so the page can move to the payment step right away.
   */
  onOrderCreated?: () => void;
}

export interface UsePaymentProcessingReturn {
  paymentUrl: string | null;
  isCreatingOrder: boolean;
  isLoadingPayment: boolean;
  paymentError: string | null;
  currentOrderId: Id<'orders'> | null;
  accessToken: string | null;
  handleProceedToPayment: () => Promise<void>;
  handleRetryPayment: () => Promise<void>;
  resetPaymentState: () => void;
}

/**
 * Manages payment processing, order creation, and payment page generation
 */
export function usePaymentProcessing({
  getFormData,
  createOrder,
  createPaymentPage,
  cartItems,
  user,
  total,
  appliedCoupon,
  onOrderCreated,
}: UsePaymentProcessingParams): UsePaymentProcessingReturn {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<Id<'orders'> | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  // Total of the order we created, so we can tell whether the cart still
  // matches it before reusing the order.
  const [createdOrderTotal, setCreatedOrderTotal] = useState<number | null>(null);

  const generatePaymentUrl = useCallback(
    async (orderId: Id<'orders'>, token: string | null) => {
      setIsLoadingPayment(true);
      try {
        const result = await createPaymentPage({
          orderId,
          accessToken: token ?? undefined,
        });

        if (result.success && result.paymentUrl) {
          setPaymentUrl(result.paymentUrl);
          setPaymentError(null);
        } else {
          setPaymentError(result.error || 'שגיאה ביצירת עמוד התשלום');
        }
      } catch (err) {
        console.error('Failed to create payment page:', err);
        setPaymentError(err instanceof Error ? err.message : 'שגיאה בעיבוד התשלום');
      } finally {
        setIsLoadingPayment(false);
      }
    },
    [createPaymentPage]
  );

  const handleProceedToPayment = useCallback(async () => {
    setPaymentError(null);

    // Reuse the existing order when the cart is unchanged, so going back and
    // continuing does not leave orphan pending orders.
    if (currentOrderId && createdOrderTotal === total) {
      onOrderCreated?.();
      await generatePaymentUrl(currentOrderId, accessToken);
      return;
    }

    const formData = getFormData();

    try {
      setIsCreatingOrder(true);

      // Create order with cart items
      const order = await createOrder({
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          postalCode: formData.postalCode || '',
          country: formData.country,
        },
        payment: {
          method: 'Rivhit',
          transactionId: 'pending',
          chargeDate: new Date().toISOString(),
        },
        items: cartItems.map(item => ({
          productId: item.productId as Id<'products'>,
          quantity: BigInt(item.quantity),
        })),
        total,
        ...(appliedCoupon && {
          appliedCouponCode: appliedCoupon.code,
        }),
      });

      setCurrentOrderId(order.orderId);
      setAccessToken(order.accessToken);
      setCreatedOrderTotal(total);
      sessionStorage.setItem(`order-access-${order.orderId}`, order.accessToken);
      sessionStorage.setItem(`cart-clear-${order.orderId}`, '1');

      // The order exists — let the page show the payment step now. Requesting
      // the payment page is the slow part and has its own loading state.
      setIsCreatingOrder(false);
      onOrderCreated?.();

      await generatePaymentUrl(order.orderId, order.accessToken);
    } catch (err) {
      console.error('Failed to process payment:', err);
      setPaymentError(err instanceof Error ? err.message : 'שגיאה בעיבוד התשלום');
    } finally {
      setIsCreatingOrder(false);
    }
  }, [
    getFormData,
    createOrder,
    cartItems,
    total,
    appliedCoupon,
    currentOrderId,
    createdOrderTotal,
    accessToken,
    onOrderCreated,
    generatePaymentUrl,
  ]);

  const handleRetryPayment = useCallback(async () => {
    // No order yet means creation failed, so there is nothing to retry:
    // run the whole flow again.
    if (!currentOrderId) {
      await handleProceedToPayment();
      return;
    }

    await generatePaymentUrl(currentOrderId, accessToken);
  }, [currentOrderId, accessToken, generatePaymentUrl, handleProceedToPayment]);

  const resetPaymentState = useCallback(() => {
    setPaymentUrl(null);
    setPaymentError(null);
    setCurrentOrderId(null);
    setAccessToken(null);
    setCreatedOrderTotal(null);
    setIsCreatingOrder(false);
    setIsLoadingPayment(false);
  }, []);

  return {
    paymentUrl,
    isCreatingOrder,
    isLoadingPayment,
    paymentError,
    currentOrderId,
    accessToken,
    handleProceedToPayment,
    handleRetryPayment,
    resetPaymentState,
  };
}
