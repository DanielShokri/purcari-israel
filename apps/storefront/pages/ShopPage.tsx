import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { Filter, ArrowUpDown, ChevronDown } from 'lucide-react';
import { Product } from '@shared/types';
import { useTrackCategoryViewed } from '../hooks/useAnalytics';

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'on-sale' | 'name';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'חדשים ביותר' },
  { value: 'price-asc', label: 'מחיר: מהנמוך לגבוה' },
  { value: 'price-desc', label: 'מחיר: מהגבוה לנמוך' },
  { value: 'on-sale', label: 'מבצעים' },
  { value: 'name', label: 'לפי שם' },
];

const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  const searchFromUrl = searchParams.get('search');
  
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { trackCategoryViewed } = useTrackCategoryViewed();
  
  // Derive activeCategory directly from URL - single source of truth
  const activeCategory = categoryFromUrl || 'all';

  // Categories come from the DB so new ones (e.g. brandy) appear automatically.
  // The hardcoded list below is only a fallback if the DB has none yet.
  const dbCategories = useQuery(api.categories.list, {});
  const categoriesFromDb = useMemo(() => (dbCategories || []).map(c => ({
    id: c.slug,
    label: c.nameHe || c.name,
  })), [dbCategories]);

  const displayCategories = categoriesFromDb.length > 0 ? [
    { id: 'all', label: 'הכל' },
    ...categoriesFromDb.filter(c => c.id !== 'wines'), // parent umbrella not needed as a filter
  ] : [
    { id: 'all', label: 'הכל' },
    { id: 'red-wines', label: 'יינות אדומים' },
    { id: 'white-wines', label: 'יינות לבנים' },
    { id: 'rose-wines', label: 'רוזה' },
    { id: 'sparkling-wines', label: 'מבעבעים' },
  ];

  // Update URL when category changes
  const handleCategoryChange = (categoryId: string) => {
    if (categoryId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryId);
    }
    searchParams.delete('search');
    setSearchParams(searchParams);
  };
  
  const handleClearSearch = () => {
    searchParams.delete('search');
    setSearchParams(searchParams);
  };
  
  // Search query - use dedicated search if search param exists
  const searchResults = useQuery(
    api.products.search,
    searchFromUrl ? { query: searchFromUrl } : "skip"
  );
  
  const productsResult = useQuery(api.products.list, {
    ...(activeCategory !== 'all' ? { category: activeCategory } : {}),
    limit: 200,
  });

  const isLoading = searchFromUrl 
    ? searchResults === undefined 
    : productsResult === undefined;
    
  // Use search results if searching, otherwise use category results
  const products = searchFromUrl 
    ? (searchResults || []) 
    : (productsResult || []);

  // Track category views when category changes
  useEffect(() => {
    const categoryLabel = displayCategories.find(c => c.id === activeCategory)?.label || 'כל המוצרים';
    trackCategoryViewed(activeCategory, categoryLabel, products.length);
  }, [activeCategory, products.length, trackCategoryViewed, displayCategories]);

  // Sort products based on selected option
  const sortedProducts = useMemo(() => {
    if (!products) return [];
    
    const sorted = [...products];
    
    const getEffectivePrice = (p: Product) => p.onSale && p.salePrice ? p.salePrice : p.price;
    
    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => getEffectivePrice(a) - getEffectivePrice(b));
      case 'price-desc':
        return sorted.sort((a, b) => getEffectivePrice(b) - getEffectivePrice(a));
      case 'on-sale':
        return sorted.sort((a, b) => {
          if (a.onSale && !b.onSale) return -1;
          if (!a.onSale && b.onSale) return 1;
          return 0;
        });
      case 'name':
        return sorted.sort((a, b) => 
          (a.productNameHe || a.productName).localeCompare(b.productNameHe || b.productName, 'he')
        );
      case 'newest':
      default:
        return sorted.sort((a, b) => 
          new Date(b.dateAdded || b.createdAt || '').getTime() - new Date(a.dateAdded || a.createdAt || '').getTime()
        );
    }
  }, [products, sortBy]);

  const currentSortLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'מיון';

  const currentCategoryLabel = displayCategories.find(c => c.id === activeCategory)?.label || 'הכל';

  const pageTitle = searchFromUrl 
    ? `חיפוש: ${searchFromUrl} - פורקארי ישראל`
    : `חנות - ${currentCategoryLabel}`;
    
  const pageDescription = searchFromUrl
    ? `תוצאות חיפוש עבור "${searchFromUrl}" - יינות פורקרי ממולדובה במחירים מעולים.`
    : `צפו בקטלוג היינות המלא של פורקארי ישראל. ${currentCategoryLabel} - יינות איכותיים ממולדובה במחירים מעולים.`;

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
        "name": searchFromUrl ? `חיפוש: ${searchFromUrl}` : "חנות",
        "item": "https://purcari.co.il/products"
      }
    ]
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <SEO 
        title={pageTitle}
        description={pageDescription}
        canonical={searchFromUrl ? `/products?search=${searchFromUrl}` : "/products"}
        schemaData={breadcrumbSchema}
      />
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 mb-10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2">
            {searchFromUrl ? `תוצאות חיפוש: "${searchFromUrl}"` : 'החנות שלנו'}
          </h1>
          <p className="text-gray-400">
            {searchFromUrl 
              ? `נמצאו ${sortedProducts.length} תוצאות`
              : 'גלו את המבחר המלא של יינות פורקרי'
            }
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={searchFromUrl ? [
            { label: 'חנות', href: '/products' },
            { label: `חיפוש: "${searchFromUrl}"` }
          ] : [
            { label: 'חנות' }
          ]}
          className="mb-6"
        />

        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 flex-shrink-0">
             <div className="bg-white p-6 rounded-lg shadow-sm sticky top-24">
               <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                 <Filter size={20} className="text-secondary" />
                 <h3 className="font-bold text-lg">סינון</h3>
               </div>
               
               <div className="space-y-2">
                 {displayCategories.map(cat => (
                   <button
                     key={cat.id}
                     onClick={() => handleCategoryChange(cat.id)}
                     className={`w-full text-right px-3 py-2 rounded-md transition-colors cursor-pointer ${
                       activeCategory === cat.id 
                       ? 'bg-secondary text-white font-bold' 
                       : 'text-gray-600 hover:bg-gray-100'
                     }`}
                   >
                     {cat.label}
                   </button>
                 ))}
               </div>
             </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
             {isLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="h-96 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
               </div>
             ) : (
               <>
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-2">
                       {searchFromUrl ? (
                         <>
                           <p className="text-gray-500 text-sm">נמצאו {sortedProducts.length} תוצאות עבור "{searchFromUrl}"</p>
                           <button
                             onClick={handleClearSearch}
                             className="text-sm text-secondary hover:underline cursor-pointer"
                           >
                             נקה חיפוש
                           </button>
                         </>
                       ) : (
                         <p className="text-gray-500 text-sm">מציג {sortedProducts.length} מוצרים</p>
                       )}
                     </div>
                    
                    {/* Sort Dropdown */}
                    <div className="relative">
                      <button
                        onClick={() => setIsSortOpen(!isSortOpen)}
                        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <ArrowUpDown size={16} className="text-secondary" />
                        <span>{currentSortLabel}</span>
                        <ChevronDown size={16} className={`transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {isSortOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-10" 
                            onClick={() => setIsSortOpen(false)}
                          />
                          <div className="absolute end-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] py-2">
                            {sortOptions.map(option => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setSortBy(option.value);
                                  setIsSortOpen(false);
                                }}
                                className={`w-full text-right px-4 py-2 text-sm transition-colors cursor-pointer ${
                                  sortBy === option.value
                                    ? 'bg-secondary/10 text-secondary font-medium'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                 </div>
                 
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedProducts.map((product: any) => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>


                  {sortedProducts.length === 0 && (
                    <div className="text-center py-20">
                      <p className="text-gray-500 text-lg">
                        {searchFromUrl 
                          ? `לא נמצאו תוצאות עבור "${searchFromUrl}".`
                          : 'לא נמצאו מוצרים בקטגוריה זו.'
                        }
                      </p>
                      {searchFromUrl && (
                        <button
                          onClick={handleClearSearch}
                          className="mt-4 text-secondary hover:underline cursor-pointer"
                        >
                          נקה חיפוש
                        </button>
                      )}
                    </div>
                  )}
               </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;