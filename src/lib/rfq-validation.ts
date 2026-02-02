import { z } from 'zod';

// RFQ Validation Schemas

export const rfqStatusEnum = z.enum([
  'pending',
  'quoted',
  'accepted',
  'rejected',
  'expired',
  'converted',
]);

export const quoteStatusEnum = z.enum([
  'pending',
  'accepted',
  'rejected',
  'countered',
]);

export const createRfqSchema = z.object({
  buyerId: z.string().min(1, 'Buyer ID is required'),
  supplierId: z.number().int().positive('Supplier ID is required'),
  productId: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  targetPrice: z.number().positive('Target price must be greater than 0').optional(),
  deliveryLocation: z.string().min(5, 'Delivery location is required'),
  notes: z.string().optional(),
  attachments: z.array(z.string().url()).optional(),
  expiresAt: z.string().datetime().optional(), // ISO date string
});

export const createQuoteSchema = z.object({
  rfqId: z.number().int().positive('RFQ ID is required'),
  supplierId: z.number().int().positive('Supplier ID is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  validityPeriod: z.string().datetime(), // ISO date string
  terms: z.string().optional(),
});

/**
 * Validates if the requested quantity meets the Minimum Order Quantity (MOQ).
 * @param quantity Requested quantity
 * @param moq Minimum Order Quantity of the product
 * @returns boolean
 */
export function validateMoq(quantity: number, moq: number): boolean {
  return quantity >= moq;
}

/**
 * Validates if the target price is within a reasonable range (e.g., not zero).
 * Further logic could compare against current product price if needed.
 * @param price Target price
 * @returns boolean
 */
export function validatePrice(price: number): boolean {
  return price > 0;
}

/**
 * Calculates the expiry date based on a duration in days.
 * @param days Number of days until expiry
 * @returns Date object
 */
export function calculateExpiry(days: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Checks if an RFQ or Quote is expired.
 * @param expiryDate The expiration date to check
 * @returns boolean
 */
export function isExpired(expiryDate: Date | string): boolean {
  const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
  return date < new Date();
}
