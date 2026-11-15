import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2, Wine, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { closeSearchModal, selectIsSearchModalOpen } from '../store/slices/uiSlice';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Product } from '@shared/types';
import { getWineTypeLabel } from '../utils/wineHelpers';
import { useTrackSearch } from '../hooks/useAnalytics';
import ProductImage from './ProductImage';
import { productPath } from '../utils/productPath';

// Debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};


const SearchModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const isOpen = useAppSelector(selectIsSearchModalOpen);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);
  const { trackSearch } = useTrackSearch();
  const hasTrackedSearch = useRef<string>('');

  // Fetch products from Convex using search query (bilingual)
  const searchResults = useQuery(api.products.search, 
    debouncedSearch.length >= 2 ? { query: debouncedSearch } : "skip"
  ) || [];

  const isLoading = searchResults === undefined && searchTerm.length >= 2;

  // Track search when results are loaded
  useEffect(() => {
    if (debouncedSearch.length >= 2 && searchResults && hasTrackedSearch.current !== debouncedSearch) {
      hasTrackedSearch.current = debouncedSearch;
      trackSearch(debouncedSearch, searchResults.length);
    }
  }, [debouncedSearch, searchResults, trackSearch]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        dispatch(closeSearchModal());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dispatch]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    dispatch(closeSearchModal());
  };

  const handleProductClick = () => {
    dispatch(closeSearchModal());
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl mx-auto mt-20 sm:mt-32"
          >
            <div className="mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="relative border-b border-gray-100">
                <Search className="absolute start-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="חפש יינות, סוגים, אזורים..."
                  className="w-full py-5 ps-14 pe-14 text-lg bg-transparent outline-none placeholder:text-gray-400"
                  dir="rtl"
                />
                <button
                  onClick={handleClose}
                  className="absolute end-4 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Results Area */}
              <div className="max-h-[60vh] overflow-y-auto">
                {/* Loading State */}
                {isLoading && searchTerm && (
                  <div className="flex items-center justify-center py-12 text-gray-400">
                    <Loader2 className="animate-spin me-3" size={24} />
                    <span>מחפש...</span>
                  </div>
                )}

                {/* Empty State - No Search Term */}
                {!searchTerm && !isLoading && (
                  <div className="py-12 px-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-secondary/10 rounded-full flex items-center justify-center">
                      <Wine className="text-secondary" size={28} />
                    </div>
                    <p className="text-gray-500 text-lg mb-2">חפש בקולקציית היינות שלנו</p>
                    <p className="text-gray-400 text-sm">הקלד שם יין, סוג או אזור</p>
                  </div>
                )}

                {/* No Results */}
                {searchTerm && debouncedSearch && !isLoading && searchResults.length === 0 && (
                  <div className="py-12 px-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="text-gray-400" size={28} />
                    </div>
                    <p className="text-gray-600 text-lg mb-2">לא נמצאו תוצאות</p>
                    <p className="text-gray-400 text-sm">נסה לחפש במילים אחרות</p>
                  </div>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="py-3">
                    <p className="px-5 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      {searchResults.length} תוצאות
                    </p>
                    <div className="divide-y divide-gray-50">
                        {searchResults.map((product: any) => (
                          <Link
                            key={product._id}
                            to={productPath(product)}
                            onClick={handleProductClick}
                            className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                          >
                          {/* Product Image */}
                          <div className="w-16 h-20 flex-shrink-0 bg-amber-50 rounded-lg overflow-hidden">
                            <ProductImage
                              src={product.featuredImage || product.images?.[0]}
                              alt={product.productNameHe || product.productName}
                              className="w-full h-full object-cover"
                              widths={[400]}
                              sizes="64px"
                            />
                          </div>

                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-secondary font-medium mb-1">
                              {getWineTypeLabel(product.wineType)}
                              {product.vintage && ` · ${product.vintage}`}
                            </p>
                            <h4 className="font-bold text-gray-800 group-hover:text-secondary transition-colors truncate">
                              {product.productNameHe || product.productName}
                            </h4>
                            {product.region && (
                              <p className="text-sm text-gray-400 truncate">{product.region}</p>
                            )}
                          </div>

                          {/* Price */}
                          <div className="text-start flex-shrink-0">
                            {product.onSale && product.salePrice ? (
                              <>
                                <p className="text-sm text-gray-400 line-through">₪{product.price}</p>
                                <p className="font-bold text-red-600">₪{product.salePrice}</p>
                              </>
                            ) : (
                              <p className="font-bold text-gray-900">₪{product.price}</p>
                            )}
                          </div>

                          {/* Arrow */}
                          <ArrowLeft 
                            size={18} 
                            className="text-gray-300 group-hover:text-secondary group-hover:-translate-x-1 transition-all flex-shrink-0" 
                          />
                        </Link>
                      ))}
                    </div>

                    {/* View All Link */}
                    <div className="px-5 py-4 border-t border-gray-100">
                      <Link
                        to={`/products?search=${encodeURIComponent(debouncedSearch)}`}
                        onClick={handleProductClick}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-secondary hover:text-white text-gray-700 font-medium rounded-xl transition-colors"
                      >
                        <span>צפה בכל התוצאות</span>
                        <ArrowLeft size={16} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="text-center mt-4">
              <span className="text-white/60 text-sm">
                לחץ <kbd className="px-2 py-1 bg-white/20 rounded text-white/80 text-xs mx-1">ESC</kbd> לסגירה
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
