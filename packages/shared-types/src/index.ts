/**
 * Shared Types Package
 * All types used across storefront and admin applications
 */

// ENUMS

// Product status enum - for admin product editor
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  HIDDEN = 'hidden',
  DISCONTINUED = 'discontinued',
}

// User role enum - for user management and permissions
export enum UserRole {
  ADMIN = 'admin',
  VIEWER = 'viewer',
}

// User status enum - for user account status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// Analytics interval enum - for analytics queries
export enum AnalyticsInterval {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

// Stock status enum matching backend
export enum StockStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  LOW_STOCK = 'low_stock',
}

// Wine type enum - matches Convex schema exactly
export enum WineType {
  RED = 'Red',
  WHITE = 'White',
  ROSE = 'Rosé',
  SPARKLING = 'Sparkling',
}

// Category status enum
export enum CategoryStatus {
  ACTIVE = 'active',
  DRAFT = 'draft',
  HIDDEN = 'hidden',
}

// Order status enum - for order management
export enum OrderStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SHIPPED = 'shipped',
}

export enum CouponDiscountType {
  PERCENTAGE = 'percentage',
  FIXED_AMOUNT = 'fixed_amount',
  FREE_SHIPPING = 'free_shipping',
  FREE_PRODUCT = 'free_product',
  BUY_X_GET_Y = 'buy_x_get_y',
}

export enum CouponStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  EXPIRED = 'expired',
  SCHEDULED = 'scheduled',
}

export enum NotificationType {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  ORDER = 'order',
  SYSTEM = 'system',
  INVENTORY = 'inventory',
  USER_ACTION = 'user_action',
  PAYMENT = 'payment',
  PROMOTION = 'promotion',
  PRICE_CHANGE = 'price_change',
  SYSTEM_ERROR = 'system_error',
}

// System Announcement types - for banner notifications
export enum SystemAnnouncementType {
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
  MAINTENANCE = 'maintenance',
}

export enum SystemAnnouncementStatus {
  ACTIVE = 'active',
  SCHEDULED = 'scheduled',
  EXPIRED = 'expired',
  DRAFT = 'draft',
}

// PRODUCT & CATEGORY INTERFACES

export interface Product {
  _id: string;
  _creationTime?: number;
  productName: string;
  productNameHe?: string;
  description?: string;
  descriptionHe?: string;
  shortDescription?: string;
  shortDescriptionHe?: string;
  price: number;
  salePrice?: number;
  onSale?: boolean;
  quantityInStock: number;
  sku: string;
  stockStatus?: StockStatus | 'in_stock' | 'out_of_stock' | 'low_stock';
  status?: ProductStatus | 'active' | 'draft' | 'hidden' | 'discontinued';
  category: string;
  dateAdded?: string;
  tags?: string[];
  relatedProducts?: string[];
  isFeatured?: boolean;
  featuredImage?: string;
  images?: string[];
  wineType?: WineType | 'Red' | 'White' | 'Rosé' | 'Sparkling';
  region?: string;
  vintage?: number;
  alcoholContent?: number;
  volume?: string;
  grapeVariety?: string;
  servingTemperature?: string;
  tastingNotes?: string;
}

export interface Category {
  _id: string;
  _creationTime?: number;
  name: string;
  nameHe?: string;
  slug: string;
  parentId?: string | null;
  status: CategoryStatus | 'active' | 'draft' | 'hidden' | 'inactive';
  displayOrder: number;
  description?: string;
  descriptionHe?: string;
  image?: string;
  icon?: string;
  iconColor?: string;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

// CART INTERFACES

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  salePrice?: number;
  originalPrice?: number;
  quantity: number;
  maxQuantity: number;
  imgSrc: string;
  variant?: string;
}

export interface SavedCart {
  items: CartItem[];
  appliedCoupon?: AppliedCoupon | null;
  updatedAt: string;
}

// Cart sync result - returned when merging guest cart on login
export interface CartSyncResult {
  mergedCart: CartItem[];
  skippedItems: { productId: string; productName: string; reason: string }[];
  priceChanges: { productId: string; productName: string; oldPrice: number; newPrice: number }[];
  adjustedItems: { productId: string; productName: string; requestedQty: number; availableQty: number }[];
}

// ORDER INTERFACES

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'shipped';

export interface ShippingAddress {
  street: string;
  apartment?: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface PaymentInfo {
  method: string;
  cardExpiry?: string;
  transactionId: string;
  chargeDate: string;
}

export interface OrderItem {
  _id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variant?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  _id: string;
  _creationTime?: number;
  orderNumber?: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  customerAvatar?: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  status: OrderStatus;
  shippingStreet: string;
  shippingApartment?: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  paymentMethod: string;
  paymentCardExpiry?: string;
  createdAt: string;
  paymentTransactionId: string;
  paymentChargeDate: string;
}

export interface OrderDetails extends Order {
  shippingAddress: ShippingAddress;
  payment: PaymentInfo;
  items: OrderItem[];
}

export interface CreateOrderPayload {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: ShippingAddress;
  payment: PaymentInfo;
  items: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    variant?: string;
    quantity: number;
    price: number;
  }>;
  couponCode?: string;
  appliedCouponCode?: string;
  appliedCouponDiscount?: number;
  appliedCouponType?: CouponDiscountType;
}

// COUPON INTERFACES

export interface Coupon {
  _id: string;
  _creationTime?: number;
  code: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  buyQuantity?: number;
  getQuantity?: number;
  startDate: string;
  endDate?: string;
  minimumOrder?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  categoryIds?: string[];
  productIds?: string[];
  userIds?: string[];
  firstPurchaseOnly?: boolean;
  excludeOtherCoupons?: boolean;
  status: CouponStatus | 'active' | 'paused' | 'expired' | 'scheduled' | 'inactive';
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount?: number;
  error?: string;
}

export interface AppliedCoupon {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  discountAmount: number;
}

export interface CouponUsageRecord {
  _id: string;
  _creationTime?: number;
  userId?: string;
  userEmail: string;
  couponId: string;
  couponCode: string;
  usageCount: number;
  lastUsedAt: string;
}

// CART RULE INTERFACES

export type CartRuleType = 'buy_x_get_y' | 'bulk_discount' | 'shipping';
export type CartRuleStatus = 'draft' | 'active' | 'paused';

export interface BuyXGetYConfig {
  type: 'buy_x_get_y';
  buyQuantity: number;
  getQuantity: number;
  discountProductId?: string;
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

export type CartRuleConfig = BuyXGetYConfig | BulkDiscountConfig | ShippingConfig;

export interface CartRule {
  _id: string;
  name: string;
  description?: string;
  ruleType: CartRuleType;
  status: CartRuleStatus;
  config: CartRuleConfig;
  priority?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  _id: string;
  name: string;
  phone?: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  apartment?: string;
}

export interface UserPreferences {
  addresses?: Address[];
  phone?: string;
  cart?: SavedCart;
}

// ANALYTICS & NOTIFICATIONS

export interface AnalyticsEvent {
  _id: string;
  _creationTime?: number;
  type: 'page_view' | 'product_view' | 'add_to_cart' | 'checkout';
  productId?: string;
  userId?: string;
}

export interface Notification {
  _id: string;
  _creationTime?: number;
  title: string;
  message: string;
  type: NotificationType | 'info' | 'warning' | 'error' | 'success' | 'order' | 'system' | 'inventory' | 'user_action' | 'payment' | 'promotion' | 'price_change' | 'system_error';
  isRead: boolean;
  icon?: string;
  orderId?: string;
  createdAt?: string;
}

// System Announcement - for storefront banner display
export interface SystemAnnouncement {
  _id: string;
  _creationTime?: number;
  title: string;
  message: string;
  type: SystemAnnouncementType | 'info' | 'warning' | 'success' | 'error' | 'maintenance';
  status: SystemAnnouncementStatus | 'active' | 'scheduled' | 'expired' | 'draft';
  startDate: string;
  endDate?: string;
  isDismissible: boolean;
  targetAudience: 'all' | 'customers' | 'admins';
  createdAt: string;
  updatedAt: string;
}

// UI & UTILITY TYPES

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// ANALYTICS TYPES

// Product categories - used in filters
export enum ProductCategoryEnum {
  WINES = 'wines',
  ACCESSORIES = 'accessories',
  GIFTS = 'gifts',
  FEATURED = 'featured',
  BESTSELLERS = 'bestsellers',
  NEW_ARRIVALS = 'new_arrivals',
}

export type ProductCategory = 'wines' | 'accessories' | 'gifts' | 'featured' | 'bestsellers' | 'new_arrivals' | string;

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  name?: string; // For compatibility with chart data
}

export interface AnalyticsSummary {
  // Basic metrics
  totalViews: number;
  totalVisitors: number;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
  // Extended metrics
  viewsToday?: number;
  viewsThisWeek?: number;
  viewsThisMonth?: number;
  dau?: number; // Daily Active Users
  wau?: number; // Weekly Active Users
  mau?: number; // Monthly Active Users
  topProducts?: Array<{
    productId: string;
    productName: string;
    views: number;
  }>;
  retention?: {
    week1: number;
    week7: number;
    week30: number;
  };
}

// USER & ADMIN TYPES

export interface AuthUser {
  _id: string;
  _creationTime?: number;
  name?: string;
  email?: string;
  image?: string;
  phone?: string;
}

export interface User extends AuthUser {
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  address?: string;
  joinedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  prefs?: Record<string, any>;
}

// RIVHIT PAYMENT GATEWAY TYPES

// Rivhit Payment Gateway Types
export type RivhitPaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type RivhitEnvironment = 'test' | 'production';

export interface RivhitDocumentPageRequest {
  api_token: string;
  document_type: number; // Invoice-Receipt type ID from Rivhit
  receipt_type?: number;
  customer_id?: number;
  last_name?: string;
  first_name?: string;
  address?: string;
  city?: string;
  zipcode?: number;
  phone?: string;
  email_to?: string;
  comments?: string;
  price_include_vat?: boolean;
  items: Array<{
    catalog_number?: string;
    quantity: number;
    price: number;
    description: string;
    item_id?: number;
  }>;
  redirect_url: string;
  ipn_url: string;
  ipn_data?: string;
  create_customer?: boolean;
  find_by_mail?: boolean;
  find_by_phone?: boolean;
  send_mail?: boolean;
}

export interface RivhitDocumentPageResponse {
  error_code: number;
  client_message: string | null;
  debug_message: string | null;
  data: {
    page_url: string;
  } | null;
}

export interface RivhitPaymentTransaction {
  orderId: string;
  rivhitPaymentUrl?: string;
  rivhitDocumentType?: number;
  rivhitDocumentNumber?: number;
  rivhitCustomerId?: number;
  rivhitDocumentLink?: string;
  rivhitConfirmationNumber?: number;
  status: RivhitPaymentStatus;
  amount: number;
  environment: RivhitEnvironment;
  ipnData?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

// END OF SHARED TYPES
