import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '@shared/types';
import useToast from '../store/hooks/useToast';
import { useCart } from '../hooks/useCart';
import { useTrackAddToCart } from '../hooks/useAnalytics';
import { ShoppingBag, Eye, Zap, Package, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import theme from '../theme/styles';
import { getWineTypeLabel } from '../utils/wineHelpers';

interface ProductCardProps {
  product: Product;
}

// Calculate discount percentage
// When onSale is true: price is the original price, salePrice is the discounted price
const getDiscountPercent = (originalPrice: number, salePrice?: number) => {
  if (!salePrice || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

// Infinite Marquee component using Framer Motion
const SaleMarquee: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gray-900 text-white overflow-hidden py-2" dir="ltr">
      <motion.div
        className="flex whitespace-nowrap w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 15,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        <div className="flex">
          {[...Array(6)].map((_, i) => (
            <span key={`a-${i}`} className="inline-flex items-center gap-2 px-6 text-sm font-bold flex-shrink-0">
              <Zap size={14} className="text-red-500 fill-red-500" />
              <span dir="rtl">{text}</span>
            </span>
          ))}
        </div>
        <div className="flex">
          {[...Array(6)].map((_, i) => (
            <span key={`b-${i}`} className="inline-flex items-center gap-2 px-6 text-sm font-bold flex-shrink-0">
              <Zap size={14} className="text-red-500 fill-red-500" />
              <span dir="rtl">{text}</span>
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const toast = useToast();
  const { addItem } = useCart();
  const { trackAddToCart } = useTrackAddToCart();
  const discountPercent = getDiscountPercent(product.price, product.salePrice);
  
  // Stock status helpers
  const isOutOfStock = Number(product.quantityInStock) <= 0;
  const isLowStock = Number(product.quantityInStock) > 0 && Number(product.quantityInStock) <= 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    const currentPrice = product.onSale && product.salePrice ? product.salePrice : product.price;
    
    addItem(product, 1);

    // Track add to cart event
    trackAddToCart(
      product._id,
      product.productNameHe || product.productName,
      1,
      currentPrice
    );
     
    toast.success('המוצר נוסף לסל');
  };

  // Sale banner text
  const saleBannerText = `מבצע חם ${discountPercent}% הנחה`;

  return (
    <div className={`group relative ${theme.CARD} ${theme.CARD_HOVER} flex flex-col h-full border-transparent hover:border-gray-100`}>
      <div className="relative aspect-[2/3] overflow-hidden bg-amber-50">
        <Link to={`/product/${product._id}`} className="block w-full h-full p-4 flex items-center justify-center">
          <img
            src={product.featuredImage || product.images?.[0] || ''}
            alt={product.productNameHe || product.productName}
            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        
        {/* Sale Badge - Top Right */}
        {product.onSale && discountPercent > 0 && !isOutOfStock && (
          <span className="absolute top-3 end-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none">
            -{discountPercent}%
          </span>
        )}

        {/* Out of Stock Badge */}
        {isOutOfStock && (
          <span className="absolute top-3 end-3 bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none flex items-center gap-1">
            <Package size={12} />
            אזל מהמלאי
          </span>
        )}

        {/* Low Stock Badge */}
        {isLowStock && !isOutOfStock && (
          <span className="absolute top-3 start-3 bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full pointer-events-none flex items-center gap-1">
            <AlertTriangle size={12} />
            נותרו {Number(product.quantityInStock)} בלבד
          </span>
        )}

        {/* Running Sale Banner - Bottom of Image using Framer Motion */}
        {product.onSale && <SaleMarquee text={saleBannerText} />}

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
            <span className="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-bold text-sm">
              אזל מהמלאי
            </span>
          </div>
        )}

        {/* Overlay Actions */}
        <div className={`absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none ${isOutOfStock ? 'hidden' : ''}`}>
          <Link
            to={`/product/${product._id}`}
            className="bg-white text-gray-900 p-3 rounded-full hover:bg-secondary hover:text-white transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 pointer-events-auto flex items-center justify-center"
          >
            <Eye size={20} />
          </Link>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`bg-white text-gray-900 p-3 rounded-full transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75 pointer-events-auto flex items-center justify-center ${
              isOutOfStock 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-secondary hover:text-white cursor-pointer'
            }`}
          >
            <ShoppingBag size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 text-center flex-grow flex flex-col justify-end">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mb-1">
          <span>{getWineTypeLabel(product.wineType)}</span>
          {product.vintage && (
            <>
              <span className="text-gray-300">|</span>
              <span>{product.vintage}</span>
            </>
          )}
        </div>
        <Link to={`/product/${product._id}`}>
          <h3 className="font-bold text-gray-800 hover:text-secondary transition-colors mb-2 leading-snug">{product.productNameHe || product.productName}</h3>
        </Link>
        <div className="flex items-center justify-center gap-2 text-sm">
          {product.onSale && product.salePrice && (
            <span className="text-gray-400 line-through">₪{product.price}</span>
          )}
          <span className={`font-bold ${product.onSale ? 'text-red-600' : 'text-gray-900'}`}>
            ₪{product.onSale && product.salePrice ? product.salePrice : product.price}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;