import React, { useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTrackPurchase } from '../hooks/useAnalytics';
import { useCart } from '../hooks/useCart';
import { CheckCircle, Package, Truck, ArrowRight, AlertCircle, Clock, XCircle, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Id } from '../../../convex/_generated/dataModel';

// Payment status labels in Hebrew
const PAYMENT_STATUS_LABELS = {
  pending: 'התשלום בעיבוד...',
  completed: 'התשלום אושר ✓',
  failed: 'התשלום נכשל',
  cancelled: 'התשלום בוטל',
} as const;

// Payment status styling
const PAYMENT_STATUS_STYLES = {
  pending: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: Clock,
    iconColor: 'text-yellow-500',
  },
  completed: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  failed: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: XCircle,
    iconColor: 'text-red-500',
  },
  cancelled: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: AlertCircle,
    iconColor: 'text-gray-500',
  },
} as const;

const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderData = useQuery(api.orders.getPublic, id ? { orderId: id as Id<"orders"> } : "skip");
  
  // Get payment transaction for this order (reactive - will auto-update when IPN arrives)
  const payment = useQuery(
    api.icreditHelpers.getPaymentByOrderId, 
    id ? { orderId: id as Id<"orders"> } : "skip"
  );
  
  const { trackPurchase } = useTrackPurchase();
  const hasTracked = useRef(false);
  const hasCleared = useRef(false);

  // Clear cart when payment is completed
  useEffect(() => {
    if (payment?.status === 'completed' && !hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }
  }, [payment?.status, clearCart]);

  // Track order completion once when payment is confirmed
  useEffect(() => {
    if (orderData && payment?.status === 'completed' && !hasTracked.current) {
      hasTracked.current = true;
      
      const items = orderData.items?.map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        price: item.price,
      })) || [];

      trackPurchase(
        orderData._id,
        orderData.total,
        items,
        'Rivhit'
      );
    }
  }, [orderData, payment?.status, trackPurchase]);

  if (orderData === undefined) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-secondary mr-2" size={24} />
      <span>טוען פרטי הזמנה...</span>
    </div>
  );
  
  if (orderData === null) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <AlertCircle size={48} className="text-red-500" />
      <p className="text-xl">הזמנה לא נמצאה</p>
      <Link to="/products" className="text-secondary hover:underline">חזרה לחנות</Link>
    </div>
  );

  const { items } = orderData;
  
  // Determine payment status (default to 'pending' if no payment record yet)
  const paymentStatus = (payment?.status || 'pending') as keyof typeof PAYMENT_STATUS_STYLES;
  const statusConfig = PAYMENT_STATUS_STYLES[paymentStatus] || PAYMENT_STATUS_STYLES.pending;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-gray-50 min-h-screen py-20">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-10 rounded-3xl shadow-xl text-center"
        >
          {/* Success icon for completed payments, loading for pending */}
          {paymentStatus === 'completed' ? (
            <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-600" />
            </div>
          ) : paymentStatus === 'pending' ? (
            <div className="bg-yellow-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 size={40} className="text-yellow-600 animate-spin" />
            </div>
          ) : (
            <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} className="text-red-600" />
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-2">
            {paymentStatus === 'completed' ? 'תודה על הזמנתך!' : 
             paymentStatus === 'pending' ? 'ממתין לאישור תשלום...' :
             'התשלום לא הושלם'}
          </h1>
          <p className="text-gray-500 mb-6">מספר הזמנה: #{orderData._id.slice(-6).toUpperCase()}</p>
          
          {/* Payment Status Section */}
          <div className={`${statusConfig.bg} ${statusConfig.border} border rounded-xl p-4 mb-6`}>
            <div className="flex items-center justify-center gap-3">
              <StatusIcon size={24} className={statusConfig.iconColor} />
              <span className={`font-bold ${statusConfig.text}`}>
                {PAYMENT_STATUS_LABELS[paymentStatus]}
              </span>
              {paymentStatus === 'pending' && (
                <Loader2 size={16} className="animate-spin text-yellow-500" />
              )}
            </div>
            
            {/* Pending payment explanation */}
            {paymentStatus === 'pending' && (
              <p className="text-sm text-yellow-600 mt-2">
                העמוד יתעדכן אוטומטית כאשר התשלום יאושר
              </p>
            )}
            
            {/* Failed payment - show error and retry option */}
            {paymentStatus === 'failed' && (
              <div className="mt-3">
                {payment?.errorMessage && (
                  <p className="text-sm text-red-600 mb-2">{payment.errorMessage}</p>
                )}
                <button
                  onClick={() => navigate('/checkout')}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                >
                  נסה שוב
                </button>
              </div>
            )}
            
            {/* Cancelled payment - retry option */}
            {paymentStatus === 'cancelled' && (
              <div className="mt-3">
                <button
                  onClick={() => navigate('/checkout')}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  חזרה לתשלום
                </button>
              </div>
            )}
            
            {/* Completed - show Rivhit document info if available */}
            {paymentStatus === 'completed' && payment?.rivhitDocumentNumber && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm text-green-700">
                  מספר מסמך: {payment.rivhitDocumentNumber}
                </p>
                {payment.rivhitDocumentLink && (
                  <a
                    href={payment.rivhitDocumentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 mt-2 underline"
                  >
                    <FileText size={14} />
                    צפה בחשבונית
                  </a>
                )}
              </div>
            )}
          </div>
          
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-right">
            <h3 className="font-bold mb-4 border-b pb-2">סיכום הזמנה</h3>
            <div className="space-y-4">
              {items.map((item: any) => (
                <div key={item._id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3">
                    <img src={item.productImage || ''} alt={item.productName} className="w-10 h-14 object-cover rounded" />
                    <span>{item.productName} x {Number(item.quantity)}</span>
                  </div>
                  <span className="font-bold">₪{item.total}</span>
                </div>
              ))}
              
              {/* Subtotal */}
              <div className="pt-4 border-t flex justify-between text-sm text-gray-600">
                <span>סכום ביניים</span>
                <span>₪{orderData.subtotal}</span>
              </div>
              
              {/* Shipping */}
              <div className="flex justify-between text-sm text-gray-600">
                <span>משלוח</span>
                <span>{orderData.shippingCost === 0 ? 'חינם' : `₪${orderData.shippingCost}`}</span>
              </div>
              
              {/* Discount (if any) */}
              {((orderData.discount && orderData.discount > 0) || (orderData.appliedCouponDiscount && orderData.appliedCouponDiscount > 0)) && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>
                    הנחה
                    {orderData.appliedCouponCode && ` (${orderData.appliedCouponCode})`}
                  </span>
                  <span>-₪{orderData.discount || orderData.appliedCouponDiscount}</span>
                </div>
              )}
              
              {/* Total */}
              <div className="pt-4 border-t flex justify-between font-bold text-lg">
                <span>סה"כ לתשלום</span>
                <span>₪{orderData.total}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white border border-gray-100 p-4 rounded-xl flex flex-col items-center">
              <Package className="text-secondary mb-2" size={24} />
              <span className="text-xs text-gray-500">סטטוס הזמנה</span>
              <span className="font-bold text-sm">
                {orderData.status === 'processing' ? 'בטיפול' : 
                 orderData.status === 'pending' ? 'ממתין לתשלום' : 
                 orderData.status}
              </span>
            </div>
            <div className="bg-white border border-gray-100 p-4 rounded-xl flex flex-col items-center">
              <Truck className="text-secondary mb-2" size={24} />
              <span className="text-xs text-gray-500">משלוח</span>
              <span className="font-bold text-sm">3-5 ימי עסקים</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/products" className="bg-secondary text-white py-4 rounded-xl font-bold hover:bg-red-900 transition-colors">
              המשך בקניות
            </Link>
            <Link to="/" className="text-gray-500 text-sm font-medium flex items-center justify-center gap-1 hover:text-gray-900 transition-colors">
              חזרה לדף הבית
              <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
