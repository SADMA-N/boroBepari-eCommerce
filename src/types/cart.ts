/**
 * Cart Data Types for BoroBepari B2B Marketplace
 *
 * These types define the structure for cart items, cart state,
 * coupon codes, and supplier breakdowns for multi-supplier orders.
 */

/**
 * Represents a single item in the shopping cart.
 * Each item tracks the product details, quantity, pricing, and optional RFQ linkage.
 */
export interface CartItem {
  /** Unique identifier for the cart item (format: "{productId}-std" or "{productId}-rfq-{rfqId}") */
  id: string
  /** Reference to the product in the catalog */
  productId: number
  /** Product display name */
  productName: string
  /** Product image URL */
  image: string
  /** Supplier ID for multi-supplier cart support */
  supplierId: number
  /** Quantity of items */
  quantity: number
  /** Unit price (may differ from catalog price if from RFQ) */
  unitPrice: number
  /** Minimum Order Quantity required for this product */
  moq: number
  /** Available stock quantity */
  stock: number
  /** Calculated line total (quantity * unitPrice) */
  lineTotal: number
  /** Optional: RFQ ID if this item came from a quote */
  rfqId?: number
  /** Optional: Quote ID if this item came from an accepted quote */
  quoteId?: number
  /** Whether the price is locked (e.g., from accepted RFQ quote) */
  isPriceLocked?: boolean
}

/**
 * Breakdown of cart items by supplier.
 * Used for calculating shipping and displaying supplier-wise summaries.
 */
export interface SupplierBreakdown {
  /** Supplier ID */
  supplierId: number
  /** Supplier name for display */
  supplierName: string
  /** Items from this supplier */
  items: CartItem[]
  /** Subtotal for this supplier's items */
  subtotal: number
  /** Estimated delivery fee for this supplier */
  deliveryFee: number
  /** Number of items from this supplier */
  itemCount: number
}

/**
 * Represents a coupon/promo code that can be applied to the cart.
 */
export interface CouponCode {
  /** The coupon code string */
  code: string
  /** Type of discount: percentage off or fixed amount */
  discountType: 'percentage' | 'fixed'
  /** Discount value (percentage 0-100 or fixed amount in BDT) */
  value: number
  /** Minimum order value required to use this coupon */
  minOrderValue: number
  /** Expiry date in ISO format */
  expiryDate: string
  /** Optional: Maximum discount amount for percentage coupons */
  maxDiscount?: number
  /** Optional: Specific product IDs this coupon applies to */
  applicableProductIds?: number[]
  /** Optional: Specific supplier IDs this coupon applies to */
  applicableSupplierIds?: number[]
}

/**
 * Complete cart state including items, totals, and applied discounts.
 */
export interface Cart {
  /** Array of cart items */
  items: CartItem[]
  /** Subtotal before discounts and delivery (sum of all line totals) */
  subtotal: number
  /** Total delivery fee (sum of all supplier delivery fees) */
  deliveryFee: number
  /** Discount amount from applied coupon */
  discount: number
  /** Final total (subtotal + deliveryFee - discount) */
  total: number
  /** Breakdown of items by supplier */
  supplierBreakdown: SupplierBreakdown[]
  /** Currently applied coupon (if any) */
  appliedCoupon?: CouponCode
}

/**
 * Validation result for a single cart item.
 */
export interface CartItemValidation {
  /** The item being validated */
  itemId: string
  /** Whether the item passes all validations */
  isValid: boolean
  /** Specific validation errors */
  errors: {
    /** MOQ not met */
    moqError?: string
    /** Insufficient stock */
    stockError?: string
    /** Price changed since added to cart */
    priceError?: string
  }
}

/**
 * Complete cart validation result.
 */
export interface CartValidation {
  /** Whether the entire cart is valid for checkout */
  isValid: boolean
  /** Validation results for each item */
  itemValidations: CartItemValidation[]
  /** Cart-level errors (e.g., coupon expired) */
  cartErrors: string[]
}

/**
 * Request payload for adding item to cart.
 */
export interface AddToCartRequest {
  productId: number
  quantity: number
  /** Optional custom price from RFQ */
  customPrice?: number
  /** Optional RFQ ID if from quote */
  rfqId?: number
  /** Optional Quote ID if from accepted quote */
  quoteId?: number
}

/**
 * Request payload for updating cart item quantity.
 */
export interface UpdateCartItemRequest {
  quantity: number
}

/**
 * Request payload for validating a coupon code.
 */
export interface ValidateCouponRequest {
  code: string
  cartSubtotal: number
}

/**
 * Response from coupon validation.
 */
export interface ValidateCouponResponse {
  isValid: boolean
  coupon?: CouponCode
  error?: string
  calculatedDiscount?: number
}

/**
 * Stored cart format for localStorage persistence.
 */
export interface StoredCart {
  /** Cart items to persist */
  items: CartItem[]
  /** Applied coupon code (if any) */
  appliedCouponCode?: string
  /** Timestamp when cart was last updated */
  updatedAt: number
  /** User ID (null for guest carts) */
  userId?: string | null
}
