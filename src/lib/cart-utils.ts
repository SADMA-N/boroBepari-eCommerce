/**
 * Cart Validation and Calculation Utilities
 *
 * This module provides comprehensive utilities for cart operations:
 * - MOQ (Minimum Order Quantity) validation
 * - Stock availability checks
 * - Supplier-wise breakdown calculations
 * - Coupon code validation and discount calculations
 * - Cart total calculations
 * - localStorage persistence helpers
 */

import type {
  Cart,
  CartItem,
  CartItemValidation,
  CartValidation,
  CouponCode,
  StoredCart,
  SupplierBreakdown,
} from '@/types/cart'
import { getSupplierById } from '@/data/mock-products'

/** Storage key for cart in localStorage */
const CART_STORAGE_KEY = 'borobepari_cart_v2'

/** Number of days before cart expires */
const CART_EXPIRY_DAYS = 7

/** Base delivery fee per supplier (in BDT) */
const BASE_DELIVERY_FEE_PER_SUPPLIER = 100

/** Free delivery threshold per supplier (in BDT) */
const FREE_DELIVERY_THRESHOLD = 5000

// ============================================================================
// MOQ and Stock Validation
// ============================================================================

/**
 * Validates if a cart item meets the Minimum Order Quantity (MOQ).
 *
 * @param item - The cart item to validate
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * const result = validateMoq(cartItem);
 * if (!result.valid) {
 *   console.error(result.message);
 * }
 */
export function validateMoq(item: CartItem): {
  valid: boolean
  message?: string
} {
  if (item.quantity < item.moq) {
    return {
      valid: false,
      message: `Minimum order quantity for ${item.productName} is ${item.moq} units. You have ${item.quantity}.`,
    }
  }
  return { valid: true }
}

/**
 * Validates if the requested quantity is within stock limits.
 *
 * @param item - The cart item to validate
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * const result = validateStock(cartItem);
 * if (!result.valid) {
 *   showStockWarning(result.message);
 * }
 */
export function validateStock(item: CartItem): {
  valid: boolean
  message?: string
} {
  if (item.quantity > item.stock) {
    return {
      valid: false,
      message: `Only ${item.stock} units of ${item.productName} available in stock.`,
    }
  }
  return { valid: true }
}

/**
 * Performs complete validation on a single cart item.
 *
 * @param item - The cart item to validate
 * @returns Detailed validation result including all error types
 */
export function validateCartItem(item: CartItem): CartItemValidation {
  const moqResult = validateMoq(item)
  const stockResult = validateStock(item)

  const errors: CartItemValidation['errors'] = {}

  if (!moqResult.valid) {
    errors.moqError = moqResult.message
  }

  if (!stockResult.valid) {
    errors.stockError = stockResult.message
  }

  return {
    itemId: item.id,
    isValid: moqResult.valid && stockResult.valid,
    errors,
  }
}

/**
 * Validates the entire cart including all items and applied coupon.
 *
 * @param cart - The complete cart to validate
 * @returns Comprehensive validation result for the cart
 *
 * @example
 * const validation = validateCart(cart);
 * if (!validation.isValid) {
 *   validation.itemValidations.forEach(v => {
 *     if (!v.isValid) displayItemErrors(v);
 *   });
 *   validation.cartErrors.forEach(e => displayCartError(e));
 * }
 */
export function validateCart(cart: Cart): CartValidation {
  const itemValidations = cart.items.map(validateCartItem)
  const cartErrors: Array<string> = []

  // Check if coupon is expired
  if (cart.appliedCoupon) {
    const now = new Date()
    const expiry = new Date(cart.appliedCoupon.expiryDate)
    if (now > expiry) {
      cartErrors.push(`Coupon "${cart.appliedCoupon.code}" has expired.`)
    }

    // Check minimum order value
    if (cart.subtotal < cart.appliedCoupon.minOrderValue) {
      cartErrors.push(
        `Minimum order of ৳${cart.appliedCoupon.minOrderValue.toLocaleString()} required for coupon "${cart.appliedCoupon.code}".`,
      )
    }
  }

  // Check if cart is empty
  if (cart.items.length === 0) {
    cartErrors.push('Your cart is empty.')
  }

  const allItemsValid = itemValidations.every((v) => v.isValid)

  return {
    isValid: allItemsValid && cartErrors.length === 0,
    itemValidations,
    cartErrors,
  }
}

// ============================================================================
// Supplier Breakdown Calculations
// ============================================================================

/**
 * Calculates supplier-wise breakdown of cart items.
 * Groups items by supplier and calculates subtotals, delivery fees, and item counts.
 *
 * @param items - Array of cart items
 * @returns Array of supplier breakdowns with calculated totals
 *
 * @example
 * const breakdowns = calculateSupplierBreakdown(cart.items);
 * breakdowns.forEach(b => {
 *   console.log(`${b.supplierName}: ৳${b.subtotal} (${b.itemCount} items)`);
 * });
 */
export function calculateSupplierBreakdown(
  items: Array<CartItem>,
): Array<SupplierBreakdown> {
  const breakdown: Partial<Record<number, SupplierBreakdown>> = {}

  items.forEach((item) => {
    if (!breakdown[item.supplierId]) {
      // Try to get supplier name from mock data
      const supplier = getSupplierById(item.supplierId)
      breakdown[item.supplierId] = {
        supplierId: item.supplierId,
        supplierName: supplier?.name || `Supplier #${item.supplierId}`,
        items: [],
        subtotal: 0,
        deliveryFee: 0,
        itemCount: 0,
      }
    }
    breakdown[item.supplierId].items.push(item)
    breakdown[item.supplierId].subtotal += item.lineTotal
    breakdown[item.supplierId].itemCount += item.quantity
  })

  // Calculate delivery fees per supplier
  Object.values(breakdown).forEach((supplierBreakdown) => {
    // Free delivery if subtotal exceeds threshold
    if (supplierBreakdown.subtotal >= FREE_DELIVERY_THRESHOLD) {
      supplierBreakdown.deliveryFee = 0
    } else {
      supplierBreakdown.deliveryFee = BASE_DELIVERY_FEE_PER_SUPPLIER
    }
  })

  return Object.values(breakdown)
}

// ============================================================================
// Coupon Code Validation and Discount Calculations
// ============================================================================

/**
 * Validates a coupon code and checks if it can be applied.
 *
 * @param coupon - The coupon to validate
 * @param subtotal - Current cart subtotal
 * @param items - Cart items (for product/supplier-specific coupons)
 * @returns Validation result with error message if invalid
 */
export function validateCoupon(
  coupon: CouponCode,
  subtotal: number,
  items?: Array<CartItem>,
): { valid: boolean; error?: string } {
  const now = new Date()
  const expiry = new Date(coupon.expiryDate)

  // Check expiry
  if (now > expiry) {
    return { valid: false, error: 'This coupon has expired.' }
  }

  // Check minimum order value
  if (subtotal < coupon.minOrderValue) {
    return {
      valid: false,
      error: `Minimum order of ৳${coupon.minOrderValue.toLocaleString()} required for this coupon.`,
    }
  }

  // Check product-specific coupon
  if (
    coupon.applicableProductIds &&
    coupon.applicableProductIds.length > 0 &&
    items
  ) {
    const hasApplicableProduct = items.some((item) =>
      coupon.applicableProductIds!.includes(item.productId),
    )
    if (!hasApplicableProduct) {
      return {
        valid: false,
        error: 'This coupon is not applicable to items in your cart.',
      }
    }
  }

  // Check supplier-specific coupon
  if (
    coupon.applicableSupplierIds &&
    coupon.applicableSupplierIds.length > 0 &&
    items
  ) {
    const hasApplicableSupplier = items.some((item) =>
      coupon.applicableSupplierIds!.includes(item.supplierId),
    )
    if (!hasApplicableSupplier) {
      return {
        valid: false,
        error: 'This coupon is not valid for the suppliers in your cart.',
      }
    }
  }

  return { valid: true }
}

/**
 * Calculates the discount amount for a coupon code.
 *
 * @param coupon - The coupon to apply
 * @param subtotal - Cart subtotal before discount
 * @param items - Cart items (for calculating applicable amount)
 * @returns Calculated discount amount in BDT
 *
 * @example
 * const discount = calculateDiscount(coupon, cart.subtotal);
 * console.log(`You save: ৳${discount}`);
 */
export function calculateDiscount(
  coupon: CouponCode,
  subtotal: number,
  items?: Array<CartItem>,
): number {
  // First validate the coupon
  const validation = validateCoupon(coupon, subtotal, items)
  if (!validation.valid) {
    return 0
  }

  // Calculate applicable amount for product/supplier-specific coupons
  let applicableAmount = subtotal

  if (items) {
    if (coupon.applicableProductIds && coupon.applicableProductIds.length > 0) {
      applicableAmount = items
        .filter((item) => coupon.applicableProductIds!.includes(item.productId))
        .reduce((sum, item) => sum + item.lineTotal, 0)
    } else if (
      coupon.applicableSupplierIds &&
      coupon.applicableSupplierIds.length > 0
    ) {
      applicableAmount = items
        .filter((item) =>
          coupon.applicableSupplierIds!.includes(item.supplierId),
        )
        .reduce((sum, item) => sum + item.lineTotal, 0)
    }
  }

  let discount = 0

  if (coupon.discountType === 'fixed') {
    // Fixed discount cannot exceed applicable amount
    discount = Math.min(coupon.value, applicableAmount)
  } else {
    // Percentage discount
    discount = (applicableAmount * coupon.value) / 100

    // Apply max discount cap if specified
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount
    }
  }

  // Round to 2 decimal places
  return Math.round(discount * 100) / 100
}

// ============================================================================
// Cart Total Calculations
// ============================================================================

/**
 * Recalculates all cart totals including subtotal, delivery fees, discount, and final total.
 *
 * @param items - Array of cart items
 * @param coupon - Optional applied coupon
 * @returns Calculated totals and supplier breakdown
 *
 * @example
 * const totals = calculateCartTotals(cart.items, cart.appliedCoupon);
 * setCart(prev => ({ ...prev, ...totals }));
 */
export function calculateCartTotals(
  items: Array<CartItem>,
  coupon?: CouponCode,
): Omit<Cart, 'items' | 'appliedCoupon'> {
  // Calculate subtotal from all items
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)

  // Calculate supplier breakdown
  const supplierBreakdown = calculateSupplierBreakdown(items)

  // Calculate total delivery fee from all suppliers
  const deliveryFee = supplierBreakdown.reduce(
    (sum, s) => sum + s.deliveryFee,
    0,
  )

  // Calculate discount if coupon is applied
  const discount = coupon ? calculateDiscount(coupon, subtotal, items) : 0

  // Calculate final total (cannot be negative)
  const total = Math.max(0, subtotal + deliveryFee - discount)

  return {
    subtotal,
    deliveryFee,
    discount,
    total,
    supplierBreakdown,
  }
}

// ============================================================================
// LocalStorage Persistence
// ============================================================================

/**
 * Saves the cart to localStorage with timestamp for expiry tracking.
 *
 * @param cart - The cart to persist
 * @param userId - Optional user ID for cart association
 *
 * @example
 * // Save guest cart
 * saveCartToStorage(cart);
 *
 * // Save user cart
 * saveCartToStorage(cart, user.id);
 */
export function saveCartToStorage(cart: Cart, userId?: string | null): void {
  if (typeof window === 'undefined') return

  try {
    const storedCart: StoredCart = {
      items: cart.items,
      appliedCouponCode: cart.appliedCoupon?.code,
      updatedAt: Date.now(),
      userId: userId ?? null,
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storedCart))
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error)
  }
}

/**
 * Loads the cart from localStorage, checking for expiry.
 *
 * @returns Stored cart data or null if not found/expired
 *
 * @example
 * const stored = loadCartFromStorage();
 * if (stored) {
 *   initializeCart(stored.items);
 * }
 */
export function loadCartFromStorage(): StoredCart | null {
  if (typeof window === 'undefined') return null

  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY)
    if (!saved) return null

    const parsed: StoredCart = JSON.parse(saved)
    const now = Date.now()
    const expiryMs = CART_EXPIRY_DAYS * 24 * 60 * 60 * 1000

    // Check if cart has expired
    if (now - parsed.updatedAt > expiryMs) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return null
    }

    return parsed
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error)
    return null
  }
}

/**
 * Clears the cart from localStorage.
 */
export function clearCartFromStorage(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(CART_STORAGE_KEY)
}

/**
 * Merges a guest cart with a user's existing cart on login.
 * Strategy: Keep user cart items, add guest items that don't conflict.
 *
 * @param guestItems - Items from the guest cart
 * @param userItems - Items from the user's saved cart
 * @returns Merged array of cart items
 *
 * @example
 * const mergedItems = mergeGuestCartWithUserCart(guestCart.items, userCart.items);
 * updateCart({ items: mergedItems });
 */
export function mergeGuestCartWithUserCart(
  guestItems: Array<CartItem>,
  userItems: Array<CartItem>,
): Array<CartItem> {
  const mergedItems = [...userItems]

  guestItems.forEach((guestItem) => {
    // Check if user already has this item (same product + same rfqId)
    const existingIndex = mergedItems.findIndex(
      (userItem) =>
        userItem.productId === guestItem.productId &&
        userItem.rfqId === guestItem.rfqId,
    )

    if (existingIndex === -1) {
      // Item doesn't exist in user cart, add it
      mergedItems.push(guestItem)
    } else {
      // Item exists, merge quantities (up to stock limit)
      const existing = mergedItems[existingIndex]
      const newQuantity = Math.min(
        existing.quantity + guestItem.quantity,
        existing.stock,
      )
      mergedItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        lineTotal: newQuantity * existing.unitPrice,
      }
    }
  })

  return mergedItems
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generates a unique cart item ID based on product and RFQ.
 *
 * @param productId - Product ID
 * @param rfqId - Optional RFQ ID for quote-based items
 * @returns Unique item ID string
 */
export function generateCartItemId(productId: number, rfqId?: number): string {
  return rfqId ? `${productId}-rfq-${rfqId}` : `${productId}-std`
}

/**
 * Formats currency in Bangladeshi Taka (BDT).
 *
 * @param amount - Amount in BDT
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Calculates the savings compared to original price.
 *
 * @param items - Cart items
 * @param originalPrices - Map of productId to original price
 * @returns Total savings amount
 */
export function calculateSavings(
  items: Array<CartItem>,
  originalPrices: Record<number, number>,
): number {
  return items.reduce((savings, item) => {
    const originalPrice = originalPrices[item.productId] || item.unitPrice
    const itemSavings = (originalPrice - item.unitPrice) * item.quantity
    return savings + Math.max(0, itemSavings)
  }, 0)
}
