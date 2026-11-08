/**
 * Pure cart pricing, shared by the storefront (display) and convex/orders.create
 * (authoritative). Keep it free of runtime imports.
 */
export interface CartItem {
  productId: string;
  title: string;
  price: number;
  salePrice?: number;
  quantity: number;
}

export interface BuyXGetYConfig {
  type: 'buy_x_get_y';
  buyQuantity: number;
  getQuantity: number;
  discountPercentage?: number;
}

export interface BulkDiscountConfig {
  type: 'bulk_discount';
  minQuantity: number;
  discountPercentage: number;
  maxDiscountAmount?: number;
}

export interface ShippingConfig {
  type: 'shipping';
  minOrderAmount: number;
}

export interface CartRule {
  name: string;
  config: BuyXGetYConfig | BulkDiscountConfig | ShippingConfig;
}

export const DEFAULT_SHIPPING_COST = 29.9;

export interface CartTotals {
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  itemCount: number;
  validationErrors: string[];
  appliedBenefits: string[];
  freeItems: FreeItem[];
}

export interface FreeItem {
  productId: string;
  productName: string;
  quantity: number;
  ruleName: string;
}

/**
 * Buy X Get Y discount: for every (buy + get) items, `get` items are free.
 * Uses the average item price for the discount.
 */
const applyBuyXGetY = (
  items: CartItem[],
  config: BuyXGetYConfig,
  ruleName: string
): { discount: number; benefit: string; freeItems: FreeItem[] } => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const { buyQuantity, getQuantity, discountPercentage = 100 } = config;
  
  // Calculate how many complete sets of (buy + get) we have
  const setSize = buyQuantity + getQuantity;
  const completeSets = Math.floor(totalQuantity / setSize);
  
  if (completeSets === 0) {
    return { discount: 0, benefit: '', freeItems: [] };
  }
  
  // Calculate the number of free items
  const freeItemCount = completeSets * getQuantity;
  
  // Find the cheapest items to apply the discount to (customer gets best deal)
  const sortedItems = [...items]
    .flatMap(item => Array(item.quantity).fill({ ...item, quantity: 1 }))
    .sort((a, b) => {
      const priceA = a.salePrice ?? a.price;
      const priceB = b.salePrice ?? b.price;
      return priceA - priceB; // Sort ascending - cheapest first
    });
  
  // Apply discount to the cheapest items
  let discount = 0;
  const freeItems: FreeItem[] = [];
  
  for (let i = 0; i < Math.min(freeItemCount, sortedItems.length); i++) {
    const item = sortedItems[i];
    const itemPrice = item.salePrice ?? item.price;
    const itemDiscount = itemPrice * (discountPercentage / 100);
    discount += itemDiscount;
    
    // Track free items for display
    const existingFreeItem = freeItems.find(fi => fi.productId === item.productId);
    if (existingFreeItem) {
      existingFreeItem.quantity++;
    } else {
      freeItems.push({
        productId: item.productId,
        productName: item.title,
        quantity: 1,
        ruleName,
      });
    }
  }
  
  const discountText = discountPercentage === 100 ? 'חינם' : `${discountPercentage}% הנחה`;
  const benefit = `קנה ${buyQuantity} קבל ${getQuantity} ${discountText} - ${freeItemCount} מוצרים בחינם`;
  
  return { discount, benefit, freeItems };
};

/**
 * Calculate Bulk Discount
 * When total quantity reaches minQuantity, apply percentage discount to entire order
 */
const applyBulkDiscount = (
  items: CartItem[],
  subtotal: number,
  config: BulkDiscountConfig,
  ruleName: string
): { discount: number; benefit: string } => {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const { minQuantity, discountPercentage, maxDiscountAmount } = config;
  
  if (totalQuantity < minQuantity) {
    return { discount: 0, benefit: '' };
  }
  
  let discount = subtotal * (discountPercentage / 100);
  
  // Apply maximum discount cap if specified
  if (maxDiscountAmount && discount > maxDiscountAmount) {
    discount = maxDiscountAmount;
  }
  
  const benefit = `הנחת כמות ${discountPercentage}% - קנית ${totalQuantity} מוצרים`;
  
  return { discount, benefit };
};

/**
 * Calculate Free Shipping
 * When subtotal reaches minOrderAmount, shipping is free
 */
const applyFreeShipping = (
  subtotal: number,
  config: ShippingConfig,
  ruleName: string
): { freeShipping: boolean; benefit: string } => {
  const { minOrderAmount } = config;
  
  if (subtotal >= minOrderAmount) {
    return { 
      freeShipping: true, 
      benefit: `משלוח חינם - הזמנה מעל ₪${minOrderAmount}` 
    };
  }
  
  return { freeShipping: false, benefit: '' };
};

export const calculateCartTotals = (items: CartItem[], rules: CartRule[]): CartTotals => {
  const subtotal = items.reduce((acc, item) => {
    const price = item.salePrice ?? item.price;
    return acc + (price * item.quantity);
  }, 0);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  let shippingCost = DEFAULT_SHIPPING_COST;
  let discount = 0;
  const validationErrors: string[] = [];
  const appliedBenefits: string[] = [];
  const freeItems: FreeItem[] = [];

  // Process rules in priority order (already sorted by backend)
  for (const rule of rules) {
    const config = rule.config;

    switch (config.type) {
      case 'buy_x_get_y': {
        const result = applyBuyXGetY(items, config, rule.name);
        if (result.discount > 0) {
          discount += result.discount;
          appliedBenefits.push(result.benefit);
          freeItems.push(...result.freeItems);
        }
        break;
      }

      case 'bulk_discount': {
        const result = applyBulkDiscount(items, subtotal, config, rule.name);
        if (result.discount > 0) {
          discount += result.discount;
          appliedBenefits.push(result.benefit);
        }
        break;
      }

      case 'shipping': {
        const result = applyFreeShipping(subtotal, config, rule.name);
        if (result.freeShipping) {
          shippingCost = 0;
          appliedBenefits.push(result.benefit);
        }
        break;
      }

      default:
        break;
    }
  }

  const total = subtotal + shippingCost - discount;

  return {
    subtotal,
    shippingCost,
    discount,
    total: Math.max(0, Math.round(total * 100) / 100),
    itemCount,
    validationErrors,
    appliedBenefits,
    freeItems,
  };
};
