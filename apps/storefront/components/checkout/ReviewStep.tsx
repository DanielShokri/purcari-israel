import React from 'react';
import { CartItem } from '@shared/types';
import { ClipboardCheck, AlertCircle, Loader2 } from 'lucide-react';
import ProductImage from '../ProductImage';

interface ReviewStepProps {
  formData: any;
  cartItems: CartItem[];
  handleSubmit: () => void;
  prevStep: () => void;
  isCreatingOrder: boolean;
  /** Payment error from iCredit API, if any */
  paymentError?: string | null;
  /** Retry function when there's an error */
  onRetry?: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({ 
  formData, 
  cartItems, 
  handleSubmit, 
  prevStep, 
  isCreatingOrder,
  paymentError,
  onRetry,
}) => {
  return (
    <>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ClipboardCheck className="text-secondary" />
        סיכום ואישור
      </h2>
      
      <div className="space-y-6">
        {/* Shipping address summary */}
        <div className="border-b pb-4">
          <h3 className="font-bold mb-2 text-gray-900">משלוח אל:</h3>
          <p className="text-gray-600">{formData.name}</p>
          <p className="text-gray-600">{formData.street}, {formData.city}</p>
          {formData.postalCode && <p className="text-gray-600">מיקוד: {formData.postalCode}</p>}
          <p className="text-gray-600">{formData.phone}</p>
          <p className="text-gray-600">{formData.email}</p>
        </div>
        
        {/* Cart items summary */}
        <div>
          <h3 className="font-bold mb-4 text-gray-900">הפריטים שלך:</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cartItems.map((item, index) => (
              <div key={item.id || item.productId || `review-item-${index}`} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <ProductImage src={item.imgSrc} alt={item.title} className="w-12 h-16 object-cover rounded" widths={[400]} sizes="48px" />
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.quantity} יחידות</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${item.originalPrice ? 'text-red-600' : 'text-gray-900'}`}>
                    ₪{(item.price * item.quantity).toFixed(2)}
                  </p>
                  {item.originalPrice && (
                    <p className="text-[10px] text-gray-400 line-through">
                      ₪{(item.originalPrice * item.quantity).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment error display */}
        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium mb-1">שגיאה ביצירת עמוד התשלום</p>
                <p className="text-sm text-red-600">{paymentError}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 mt-8">
        <button 
          onClick={prevStep} 
          disabled={isCreatingOrder}
          className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
        >
          חזרה
        </button>
        
        {paymentError && onRetry ? (
          <button 
            onClick={onRetry} 
            disabled={isCreatingOrder}
            className="flex-1 bg-red-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                מנסה שוב...
              </>
            ) : (
              'נסה שוב'
            )}
          </button>
        ) : (
          <button 
            onClick={handleSubmit} 
            disabled={isCreatingOrder}
            className="flex-1 bg-secondary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/90 transition-colors"
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                מעבד...
              </>
            ) : (
              'המשך לתשלום'
            )}
          </button>
        )}
      </div>
    </>
  );
};

export default ReviewStep;
