import { format, addBusinessDays } from 'date-fns'

/**
 * Generates a formatted order number.
 * Format: BO-YYYY-XXXXX
 */
export function generateOrderNumber(sequence: number): string {
  const year = new Date().getFullYear()
  const paddedSequence = sequence.toString().padStart(5, '0')
  return `BO-${year}-${paddedSequence}`
}

/**
 * Calculates estimated delivery date based on order date and business days.
 */
export function calculateEstimatedDelivery(orderDate: Date, businessDays: number = 3): Date {
  return addBusinessDays(orderDate, businessDays)
}

/**
 * Determines if an order can be cancelled.
 */
export function canCancelOrder(status: string): boolean {
  return ['placed', 'confirmed', 'pending'].includes(status)
}

/**
 * Mock invoice generation logic (returns a URL or blob placeholder).
 */
export function generateInvoiceUrl(orderId: number): string {
  return `/api/orders/${orderId}/invoice`
}
