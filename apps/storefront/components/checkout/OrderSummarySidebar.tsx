import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { CartItem, CouponValidationResult } from '@shared/types';
import ProductImage from '../ProductImage';

interface OrderSummarySidebarProps {
  cartItems: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  appliedCoupon?: { code: string } | null;
  validationState: 'idle' | 'validating' | 'valid' | 'invalid';
  validationError?: string;
  onValidateCoupon: (code: string) => Promise<CouponValidationResult | null>;
  onApplyCoupon: (validationResult: CouponValidationResult) => void;
  onRemoveCoupon: () => void;
}

const OrderSummarySidebar: React.FC<OrderSummarySidebarProps> = ({ 
  cartItems, 
  subtotal, 
  shipping,
  discount, 
  total,
  appliedCoupon,
  validationState,
  validationError,
  onValidateCoupon,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const [couponInput, setCouponInput] = useState('');
  const [validatedCoupon, setValidatedCoupon] = useState<CouponValidationResult | null>(null);

  const handleValidate = async () => {
    if (!couponInput.trim()) {
      return;
    }
    const result = await onValidateCoupon(couponInput);
    if (result) {
      setValidatedCoupon(result);
    }
  };

  const handleApply = () => {
    if (validatedCoupon) {
      onApplyCoupon(validatedCoupon);
      setCouponInput('');
      setValidatedCoupon(null);
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setCouponInput('');
    setValidatedCoupon(null);
  };
  return (
    <div className="lg:col-span-1">
      <div className="bg-white p-6 rounded-2xl shadow-sm sticky top-24">
        <h3 className="font-bold text-lg mb-6 border-b pb-4">סיכום הזמנה</h3>
        
        {/* Added Cart Items List */}
        <div className="space-y-4 mb-6 border-b pb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
          {cartItems.map((item, index) => (
            <div key={item.id || item.productId || `item-${index}`} className="flex gap-3">
              <div className="w-12 h-16 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                <ProductImage src={item.imgSrc} alt={item.title} className="w-full h-full object-cover" widths={[400]} sizes="48px" />
              </div>
              <div className="flex-1 flex flex-col justify-center min-w-0">
                <h4 className="text-xs font-bold text-gray-800 truncate">{item.title}</h4>
                <p className="text-[10px] text-gray-500">כמות: {item.quantity}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className={`text-xs font-bold ${item.originalPrice ? 'text-red-600' : 'text-secondary'}`}>₪{item.price * item.quantity}</p>
                  {item.originalPrice && (
                    <p className="text-[10px] text-gray-400 line-through">₪{item.originalPrice * item.quantity}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between text-gray-600">
            <span>סכום ביניים</span>
            <span>₪{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-red-600 font-medium">
              <span>הנחה</span>
              <span>-₪{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-gray-600">
            <span>משלוח</span>
            {shipping === 0 ? (
              <span className="text-green-600">חינם</span>
            ) : (
              <span>₪{shipping.toFixed(2)}</span>
            )}
          </div>
          <div className="flex justify-between text-xl font-bold pt-4 border-t">
            <span>סה"כ</span>
            <span>₪{total.toFixed(2)}</span>
          </div>
        </div>

         <div className="mt-8">
           <label className="block text-sm font-medium text-gray-700 mb-2">קוד קופון</label>
           
           {/* Step 1: Input field + Validate button (hidden if coupon applied) */}
           {!appliedCoupon && (
             <div className="space-y-2">
               <div className="flex gap-2 items-stretch">
                 <input 
                   type="text" 
                   value={couponInput}
                   onChange={(e) => setCouponInput(e.target.value)}
                   placeholder="הכנס קוד..."
                   disabled={validationState === 'validating'}
                   onKeyPress={(e) => {
                     if (e.key === 'Enter') {
                       handleValidate();
                     }
                   }}
                   className="flex-1 min-w-0 border-gray-300 rounded-lg p-2 text-sm border focus:ring-secondary focus:border-secondary disabled:bg-gray-50 disabled:text-gray-400" 
                 />
                 <button
                   onClick={handleValidate}
                   disabled={validationState === 'validating' || !couponInput.trim()}
                   className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-medium hover:bg-secondary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-2 flex-shrink-0 whitespace-nowrap"
                 >
                   {validationState === 'validating' && <Loader size={14} className="animate-spin" />}
                   בדוק
                 </button>
               </div>

               {/* Step 2: Validation status messages */}
               {validationState === 'valid' && validatedCoupon && (
                 <div className="space-y-2">
                   <p className="text-green-600 text-xs flex items-center gap-1">
                     <CheckCircle2 size={12} />
                     קופון תקין!
                   </p>
                   {/* Step 3: Apply button (visible when validated) */}
                   <button
                     onClick={handleApply}
                     className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                   >
                     החל קופון
                   </button>
                 </div>
               )}

               {validationState === 'invalid' && (
                 <p className="text-red-500 text-xs flex items-center gap-1">
                   <AlertCircle size={12} />
                   {validationError || 'קוד לא תקין'}
                 </p>
               )}
             </div>
           )}

           {/* Applied coupon display with remove button */}
           {appliedCoupon && (
             <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
               <div className="flex items-center gap-2">
                 <CheckCircle2 size={14} className="text-green-600" />
                 <div>
                   <p className="text-sm font-medium text-green-900">קופון הוחל</p>
                   <p className="text-xs text-green-700">{appliedCoupon.code}</p>
                 </div>
               </div>
               <button
                 onClick={handleRemove}
                 className="text-xs text-green-700 hover:text-green-900 underline cursor-pointer transition-colors"
               >
                 הסר
               </button>
             </div>
           )}
         </div>
      </div>
    </div>
  );
};

export default OrderSummarySidebar;
