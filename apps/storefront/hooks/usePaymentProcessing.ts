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
  subtotal,
  shipping,
  totalDiscount,
  total,
  appliedCoupon,
}: UsePaymentProcessingParams): UsePaymentProcessingReturn {
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<Id<'orders'> | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const handleProceedToPayment = useCallback(async () => {
    const formData = getFormData();
    try {
      setIsCreatingOrder(true);
      setPaymentError(null);

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
          productName: item.title,
          productImage: item.imgSrc,
          quantity: BigInt(item.quantity),
          price: item.price,
        })),
        subtotal,
        shippingCost: shipping,
        discount: totalDiscount,
        total,
        ...(appliedCoupon && {
          appliedCouponCode: appliedCoupon.code,
          appliedCouponDiscount: appliedCoupon.discountAmount,
        }),
      });

      setCurrentOrderId(order.orderId);
      setAccessToken(order.accessToken);
      sessionStorage.setItem(`order-access-${order.orderId}`, order.accessToken);
      setIsCreatingOrder(false);
      setIsLoadingPayment(true);

      // Generate payment page
      const result = await createPaymentPage({ orderId: order.orderId, accessToken: order.accessToken });

      if (result.success && result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
      } else {
        setPaymentError(result.error || 'שגיאה ביצירת עמוד התשלום');
      }
    } catch (err) {
      console.error('Failed to process payment:', err);
      setPaymentError(err instanceof Error ? err.message : 'שגיאה בעיבוד התשלום');
    } finally {
      setIsCreatingOrder(false);
      setIsLoadingPayment(false);
    }
  }, [getFormData, createOrder, createPaymentPage, cartItems, subtotal, shipping, totalDiscount, total, appliedCoupon]);

  const handleRetryPayment = useCallback(async () => {
    if (!currentOrderId) {
      // No order exists yet - need to call handleProceedToPayment with formData
      return;
    }

    try {
      setPaymentError(null);
      setIsLoadingPayment(true);

      const result = await createPaymentPage({ orderId: currentOrderId, accessToken: accessToken ?? undefined });

      if (result.success && result.paymentUrl) {
        setPaymentUrl(result.paymentUrl);
      } else {
        setPaymentError(result.error || 'שגיאה ביצירת עמוד התשלום');
      }
    } catch (err) {
      console.error('Failed to retry payment:', err);
      setPaymentError(err instanceof Error ? err.message : 'שגיאה בעיבוד התשלום');
    } finally {
      setIsLoadingPayment(false);
    }
  }, [createPaymentPage, currentOrderId, accessToken]);

  const resetPaymentState = useCallback(() => {
    setPaymentUrl(null);
    setPaymentError(null);
    setCurrentOrderId(null);
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
