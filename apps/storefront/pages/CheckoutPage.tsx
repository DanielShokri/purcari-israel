import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useToast from '../store/hooks/useToast';
import { useCart } from '../hooks/useCart';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCheckoutCoupon } from '../hooks/useCheckoutCoupon';
import { usePaymentProcessing } from '../hooks/usePaymentProcessing';
import { useCheckoutAnalytics } from '../hooks/useCheckoutAnalytics';
import { usePaymentListener } from '../hooks/usePaymentListener';
import { ShoppingBag } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { checkoutSchema, CheckoutInput } from '../schemas/validationSchemas';
import { Id } from '../../../convex/_generated/dataModel';

import CheckoutProgressBar from '../components/checkout/CheckoutProgressBar';
import ShippingStep from '../components/checkout/ShippingStep';
import ReviewStep from '../components/checkout/ReviewStep';
import PaymentStep from '../components/checkout/PaymentStep';
import OrderSummarySidebar from '../components/checkout/OrderSummarySidebar';
import EmptyCartView from '../components/checkout/EmptyCartView';
import CheckoutWarnings from '../components/checkout/CheckoutWarnings';

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const cart = useCart();
  const {
    items: cartItems,
    subtotal,
    shipping,
    validationErrors: cartValidationErrors,
    appliedBenefits,
    discount: automaticDiscount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = cart;

  const user = useQuery(api.users.get);
  const addresses = useQuery(api.userAddresses.list, user ? {} : "skip");

  // Step state
  const [step, setStep] = useState(1);

  // Form
  const methods = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      postalCode: '',
      country: 'Israel',
    }
  });
  const { watch, setValue, trigger } = methods;

  // Payment processing (includes state & logic)
  const createOrderMutation = useMutation(api.orders.create);
  const createPaymentPageAction = useAction(api.icredit.createPaymentPage);
  const {
    paymentUrl,
    isCreatingOrder,
    isLoadingPayment,
    paymentError,
    currentOrderId,
    handleProceedToPayment,
    handleRetryPayment,
  } = usePaymentProcessing({
    getFormData: () => watch(),
    createOrder: createOrderMutation,
    createPaymentPage: createPaymentPageAction,
    cartItems,
    user,
    subtotal,
    shipping,
    totalDiscount: automaticDiscount + (appliedCoupon?.discountAmount || 0),
    total: Math.max(0, subtotal + shipping - (automaticDiscount + (appliedCoupon?.discountAmount || 0))),
    appliedCoupon,
  });

  // Coupon management
  const {
    validationState: couponValidationState,
    couponError,
    validateCoupon,
    onApplyCoupon,
    onRemoveCoupon,
  } = useCheckoutCoupon(applyCoupon, removeCoupon);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
      if (user.phone) setValue('phone', user.phone);
    }

    if (addresses && addresses.length > 0) {
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setValue('street', defaultAddr.street);
      setValue('city', defaultAddr.city);
      setValue('postalCode', defaultAddr.postalCode);
      setValue('country', defaultAddr.country);
    }
  }, [user, addresses, setValue]);

  // Analytics tracking
  useCheckoutAnalytics({
    cartItemsLength: cartItems.length,
    subtotal,
    step,
  });

  // Step navigation
  const nextStep = async () => {
    if (cartValidationErrors.length > 0) {
      toast.error(cartValidationErrors[0]);
      return;
    }

    const fieldsToValidate: (keyof CheckoutInput)[] = ['name', 'email', 'phone', 'street', 'city', 'postalCode'];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(2);
    }
  };

  const prevStep = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  // Listen for payment completion
  usePaymentListener(currentOrderId, (orderId) => {
    clearCart();
    navigate(`/order-confirmation/${orderId}`);
  });

  // Empty cart state
  if (cartItems.length === 0) {
    return <EmptyCartView />;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <CheckoutProgressBar currentStep={step} />

        <CheckoutWarnings
          validationErrors={cartValidationErrors}
          appliedBenefits={appliedBenefits}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Area */}
          <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-sm">
            <FormProvider {...methods}>
              <form onSubmit={(e) => e.preventDefault()}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <ShippingStep
                      key="step1"
                      nextStep={nextStep}
                      user={user}
                    />
                  )}

                  {step === 2 && (
                    <ReviewStep
                      key="step2"
                      formData={watch()}
                      cartItems={cartItems}
                      handleSubmit={handleProceedToPayment}
                      prevStep={prevStep}
                      isCreatingOrder={isCreatingOrder || isLoadingPayment}
                      paymentError={paymentError}
                      onRetry={handleRetryPayment}
                    />
                  )}

                  {step === 3 && (
                    <PaymentStep
                      key="step3"
                      paymentUrl={paymentUrl}
                      isLoadingUrl={isLoadingPayment}
                      paymentError={paymentError}
                      onRetry={handleRetryPayment}
                      prevStep={prevStep}
                      total={subtotal + shipping - (automaticDiscount + (appliedCoupon?.discountAmount || 0))}
                    />
                  )}
                </AnimatePresence>
              </form>
            </FormProvider>
          </div>

          <OrderSummarySidebar
            cartItems={cartItems}
            subtotal={subtotal}
            shipping={shipping}
            discount={automaticDiscount + (appliedCoupon?.discountAmount || 0)}
            total={Math.max(0, subtotal + shipping - (automaticDiscount + (appliedCoupon?.discountAmount || 0)))}
            appliedCoupon={appliedCoupon}
            validationState={couponValidationState}
            validationError={couponError}
            onValidateCoupon={validateCoupon}
            onApplyCoupon={onApplyCoupon}
            onRemoveCoupon={onRemoveCoupon}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
