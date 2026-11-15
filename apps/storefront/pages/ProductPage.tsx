import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import useToast from '../store/hooks/useToast';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { isConvexId } from '../utils/convexId';
import { Product } from '@shared/types';
import { buildProductSchema } from '../utils/productSchema';
import SEO from '../components/SEO';
import { useCart } from '../hooks/useCart';
import { useTrackProductView, useTrackAddToCart } from '../hooks/useAnalytics';
import { Minus, Plus, ShoppingBag, Truck, Shield, RotateCcw, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { getWineTypeLabel } from '../utils/wineHelpers';
import ProductImage from '../components/ProductImage';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const validId = isConvexId(id);
  const product = useQuery(
    api.products.getById,
    validId ? { productId: id as Id<"products"> } : "skip"
  );

  const allProducts = useQuery(api.products.list, {});

  const toast = useToast();
  const [quantity, setQuantity] = useState(1);
  const cart = useCart();
  const cartTotal = cart.subtotal;

  // Track product view with all required properties
  useTrackProductView(
    id || '',
    product?.productNameHe || product?.productName,
    product?.onSale && product?.salePrice ? product?.salePrice : product?.price,
    getWineTypeLabel(product?.wineType)
  );

  // Track add to cart events
  const { trackAddToCart } = useTrackAddToCart();

  const isLoading = validId && product === undefined;

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1);
  }, [id]);

   // Get related products - first try relatedProducts field, then fallback to same category/wineType
   // Keep raw data for filtering logic
   const relatedProductsRaw = useMemo(() => {
     if (!product || !allProducts) return [];
     
     // If product has explicit related products, use those
     if (product.relatedProducts && product.relatedProducts.length > 0) {
       return allProducts
         .filter(p => product.relatedProducts?.includes(p._id) && p._id !== product._id)
         .slice(0, 4);
     }
     
     // Fallback: find products with same wineType or category
     return allProducts
       .filter(p => 
         p._id !== product._id && 
         (p.wineType === product.wineType || p.category === product.category)
       )
       .slice(0, 4);
   }, [product, allProducts]);

// Use raw related products directly (Convex format)
   const relatedProducts = useMemo(() => {
     return relatedProductsRaw;
   }, [relatedProductsRaw]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-gray-900" dir="rtl">טוען...</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-gray-900" dir="rtl">המוצר לא נמצא</div>;

  // Stock status helpers
  const isOutOfStock = Number(product.quantityInStock) <= 0;
  const isLowStock = Number(product.quantityInStock) > 0 && Number(product.quantityInStock) <= 5;

  // Calculate discount percentage
  const getDiscountPercent = (originalPrice: number, salePrice?: number) => {
    if (!salePrice || salePrice >= originalPrice) return 0;
    return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
  };

  const discountPercent = getDiscountPercent(product.price, product.salePrice);
  const currentPrice = product.onSale && product.salePrice ? product.salePrice : product.price;

  const productImage = product.featuredImage || product.images?.[0];
  const productSchema = buildProductSchema({
    siteUrl: 'https://purcari.co.il',
    id: product._id,
    name: product.productNameHe || product.productName,
    image: productImage,
    description: product.descriptionHe || product.description,
    sku: product.sku,
    price: currentPrice,
    inStock: Number(product.quantityInStock) > 0,
    wineType: product.wineType,
    region: product.region,
    vintage: product.vintage,
    volume: product.volume,
    grapeVariety: product.grapeVariety,
    alcoholContent: product.alcoholContent,
  });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "דף הבית",
        "item": "https://purcari.co.il"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "חנות",
        "item": "https://purcari.co.il/products"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.productNameHe || product.productName,
        "item": `https://purcari.co.il/product/${product._id}`
      }
    ]
  };

  const handleAddToCart = () => {
    if (isOutOfStock || !product) return;
    cart.addItem(product, quantity);
    trackAddToCart(
      product._id,
      product.productNameHe || product.productName,
      quantity,
      currentPrice,
      cartTotal
    );
    toast.success(quantity > 1 ? `${quantity} פריטים נוספו לסל` : 'המוצר נוסף לסל');
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      <SEO 
        title={product.productNameHe || product.productName}
        description={product.descriptionHe || product.description}
        ogImage={productImage}
        ogType="product"
        canonical={`/product/${product._id}`}
        schemaData={[productSchema, breadcrumbSchema]}
      />
      <div className="container mx-auto px-4 py-10">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'חנות', href: '/products' },
            { label: product.productNameHe || product.productName }
          ]}
          className="mb-8"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-amber-50 rounded-lg overflow-hidden border border-gray-100 p-6 flex items-center justify-center">
              <ProductImage src={productImage} alt={product.productNameHe || product.productName} className="max-w-full max-h-full object-contain" sizes="(min-width: 768px) 40vw, 90vw" priority />
              
              {/* Sale Badge */}
              {product.onSale && discountPercent > 0 && !isOutOfStock && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg z-10">
                  -{discountPercent}% הנחה
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-2 text-secondary font-medium tracking-wide text-sm uppercase">{getWineTypeLabel(product.wineType)}</div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">{product.productNameHe || product.productName}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <p className={`text-3xl font-bold ${product.onSale ? 'text-red-600' : 'text-gray-900'}`}>₪{currentPrice}</p>
              {product.onSale && product.salePrice && (
                <p className="text-xl text-gray-400 line-through">₪{product.price}</p>
              )}
            </div>
            
            {/* Stock Status */}
            <div className="mb-6">
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                  <Package size={16} />
                  <span>אזל מהמלאי</span>
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-medium">
                  <AlertTriangle size={16} />
                  <span>נותרו {Number(product.quantityInStock)} בלבד - הזמינו עכשיו!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
                  <CheckCircle size={16} />
                  <span>במלאי</span>
                </div>
              )}
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-8 text-lg">
              {product.descriptionHe || product.description}
            </p>

             {/* Wine Attributes Grid */}
             <div className="grid grid-cols-2 gap-4 mb-8 text-sm text-gray-600">
               {product.vintage && (
                 <div className="p-3 bg-gray-50 rounded border border-gray-100">
                   <span className="block font-bold text-gray-900 mb-1">בציר</span>
                   {String(product.vintage)}
                 </div>
               )}
              {product.volume && (
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="block font-bold text-gray-900 mb-1">נפח</span>
                  {product.volume}
                </div>
              )}
              {product.grapeVariety && (
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="block font-bold text-gray-900 mb-1">זני ענבים</span>
                  {product.grapeVariety}
                </div>
              )}
              {product.servingTemperature && (
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="block font-bold text-gray-900 mb-1">טמפרטורת הגשה</span>
                  {product.servingTemperature}
                </div>
              )}
              {product.alcoholContent && (
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="block font-bold text-gray-900 mb-1">אלכוהול</span>
                  {product.alcoholContent}%
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 mb-8 border-t border-b border-gray-100 py-6">
              <div className={`flex items-center border border-gray-300 rounded-md ${isOutOfStock ? 'opacity-50' : ''}`}>
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={isOutOfStock}
                  className={`px-4 py-3 text-gray-600 ${isOutOfStock ? 'cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}`}
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 font-bold text-lg w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(Number(product.quantityInStock), q + 1))}
                  disabled={isOutOfStock || quantity >= Number(product.quantityInStock)}
                  className={`px-4 py-3 text-gray-600 ${isOutOfStock || quantity >= Number(product.quantityInStock) ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100 cursor-pointer'}`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3 px-6 rounded-md font-bold text-lg flex items-center justify-center gap-2 transition-colors shadow-md ${
                  isOutOfStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-secondary hover:bg-red-900 text-white hover:shadow-xl cursor-pointer'
                }`}
              >
                {isOutOfStock ? (
                  <>
                    <Package size={20} />
                    אזל מהמלאי
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    הוסף לסל
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-500">
               <div className="flex items-center gap-3">
                 <Truck size={18} />
                 <span>משלוח חינם בהזמנה מעל ₪300</span>
               </div>
               <div className="flex items-center gap-3">
                 <Shield size={18} />
                 <span>אחריות על איכות היין</span>
               </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              יינות שאולי יעניינו אותך
            </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map(relatedProduct => (
            <ProductCard key={relatedProduct._id} product={relatedProduct} />
          ))}
        </div>
      </div>
    )}

      </div>
    </div>
  );
};

export default ProductPage;