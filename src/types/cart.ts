export interface CartItem {
  id: string; // Unique identifier for the cart line item (e.g., `${productId}-${rfqId || 'std'}`)
  productId: number;
  productName: string;
  image: string;
  supplierId: number;
  quantity: number;
  unitPrice: number;
  moq: number;
  stock: number; // Added for validation
  lineTotal: number;
  // Metadata for special orders
  rfqId?: number;
  quoteId?: number;
  isPriceLocked?: boolean;
}

export interface SupplierBreakdown {
  supplierId: number;
  supplierName: string; // Ideally we'd have this
  items: CartItem[];
  subtotal: number;
}

export interface CouponCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  expiryDate: string; // ISO date string
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  supplierBreakdown: SupplierBreakdown[];
  appliedCoupon?: CouponCode;
}
