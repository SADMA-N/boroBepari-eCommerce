import { CartItem, CouponCode, SupplierBreakdown } from "@/types/cart";

/**
 * Validates if a cart item meets the Minimum Order Quantity (MOQ).
 */
export function validateMoq(item: CartItem): { valid: boolean; message?: string } {
  if (item.quantity < item.moq) {
    return { 
      valid: false, 
      message: `Minimum order quantity for ${item.productName} is ${item.moq}.` 
    };
  }
  return { valid: true };
}

/**
 * Validates if the requested quantity is within stock limits.
 */
export function validateStock(item: CartItem): { valid: boolean; message?: string } {
  if (item.quantity > item.stock) {
    return {
      valid: false,
      message: `Only ${item.stock} units of ${item.productName} available.`
    };
  }
  return { valid: true };
}

/**
 * Calculates the total cost for a specific supplier's items in the cart.
 */
export function calculateSupplierBreakdown(items: CartItem[]): SupplierBreakdown[] {
  const breakdown: Record<number, SupplierBreakdown> = {};

  items.forEach(item => {
    if (!breakdown[item.supplierId]) {
      breakdown[item.supplierId] = {
        supplierId: item.supplierId,
        supplierName: `Supplier #${item.supplierId}`, // Placeholder, typically fetched
        items: [],
        subtotal: 0
      };
    }
    breakdown[item.supplierId].items.push(item);
    breakdown[item.supplierId].subtotal += item.lineTotal;
  });

  return Object.values(breakdown);
}

/**
 * Validates and calculates discount for a coupon code.
 */
export function calculateDiscount(coupon: CouponCode, subtotal: number): number {
  const now = new Date();
  const expiry = new Date(coupon.expiryDate);

  if (now > expiry) return 0;
  if (subtotal < coupon.minOrderValue) return 0;

  if (coupon.discountType === 'fixed') {
    return Math.min(coupon.value, subtotal); // Cannot discount more than subtotal
  } else {
    return (subtotal * coupon.value) / 100;
  }
}

/**
 * Recalculates the entire cart totals.
 */
export function calculateCartTotals(items: CartItem[], coupon?: CouponCode) {
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = coupon ? calculateDiscount(coupon, subtotal) : 0;
  // Delivery fee logic would go here (e.g., calculated per supplier or fixed)
  const deliveryFee = 0; 
  const total = Math.max(0, subtotal - discount + deliveryFee);

  return {
    subtotal,
    discount,
    deliveryFee,
    total,
    supplierBreakdown: calculateSupplierBreakdown(items)
  };
}
