import React, { useEffect } from 'react';
import useToast from '../store/hooks/useToast';
import { useCart } from '../hooks/useCart';
import { useCartUI } from '../hooks/useCartUI';
import { useTrackCheckoutStart, useTrackCartViewed, useTrackCartItemRemoved } from '../hooks/useAnalytics';
import { X, Trash2, Plus, Minus, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductImage from './ProductImage';

const CartModal: React.FC = () => {
  const toast = useToast();
  const cart = useCart();
  const { closeCart } = useCartUI();
  const { trackCheckoutStart } = useTrackCheckoutStart();
  const { trackCartViewed } = useTrackCartViewed();
  const { trackCartItemRemoved } = useTrackCartItemRemoved();

  const { items, subtotal, discount, appliedBenefits, removeItem, updateQuantity } = cart;

  // Track cart viewed when modal opens
  useEffect(() => {
    trackCartViewed(items.length, subtotal);
  }, []);

   const handleRemoveItem = (productId: string, title: string, price: number, quantity: number) => {
     // Track cart item removed
     trackCartItemRemoved(
       productId,
       title,
       quantity,
       price,
       items.length - 1
     );
     removeItem(productId);
     toast.info(`${title} הוסר מהסל`);
   };

  const handleCheckoutClick = () => {
    // Track checkout started event
    trackCheckoutStart(
      `cart_${Date.now()}`, // Cart ID (generate if not available)
      items.length,
      subtotal
    );
    closeCart();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={closeCart}
      />
      
        {/* Panel */}
        <motion.div 
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '-100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute top-0 end-0 w-full max-w-md h-full bg-white shadow-2xl flex flex-col"
        >
          
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">סל הקניות</h2>
          <button 
            onClick={closeCart}
            className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <p className="text-lg">הסל שלך ריק</p>
              <button 
                onClick={closeCart} 
                className="mt-4 text-secondary underline font-medium cursor-pointer"
              >
                המשך בקניות
              </button>
            </div>
          ) : (
            items.map((item, index) => (
              <div key={item.id || item.productId || `cart-item-${index}`} className="flex gap-4">
                <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border border-gray-200">
                  <ProductImage src={item.imgSrc} alt={item.title} className="w-full h-full object-cover" widths={[400]} sizes="80px" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold ${item.originalPrice ? 'text-red-600' : 'text-secondary'}`}>₪{item.price}</p>
                      {item.originalPrice && (
                        <p className="text-xs text-gray-400 line-through">₪{item.originalPrice}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
                      <button 
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-2 text-sm font-medium w-8 text-center">{item.quantity}</span>
                      <button 
                        className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                       onClick={() => handleRemoveItem(item.productId, item.title, item.price, item.quantity)}
                       className="text-gray-400 hover:text-red-500 cursor-pointer"
                     >
                       <Trash2 size={18} />
                     </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50">
            {/* Applied Benefits */}
            {appliedBenefits.length > 0 && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Gift size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">הטבות פעילות</span>
                </div>
                <ul className="text-xs text-green-700 space-y-1">
                  {appliedBenefits.map((benefit, idx) => (
                    <li key={idx}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-gray-600">
                <span>סכום ביניים:</span>
                <span>₪{subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-600 font-medium">
                  <span>הנחה:</span>
                  <span>-₪{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-2 border-t">
                <span>סה"כ:</span>
                <span>₪{(subtotal - discount).toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 text-center">משלוח יחושב בקופה</p>
            </div>
            <Link 
              to="/checkout"
              className="block w-full bg-secondary hover:bg-red-900 text-white text-center py-3 rounded-md font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              onClick={handleCheckoutClick}
            >
              לקופה
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CartModal;