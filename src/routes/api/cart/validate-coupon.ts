/**
 * Coupon Validation API Endpoint
 *
 * POST /api/cart/validate-coupon
 *
 * Validates a coupon code and returns discount information.
 * Handles expiry checks, minimum order validation, and usage limits.
 */

import { createFileRoute } from '@tanstack/react-router'
import type { CouponCode, ValidateCouponRequest, ValidateCouponResponse } from '@/types/cart'

// ============================================================================
// Mock Coupon Database
// In production, this would come from a database
// ============================================================================

interface StoredCoupon extends CouponCode {
  /** Whether this coupon can only be used once per user */
  singleUse: boolean
  /** Maximum total uses across all users */
  maxUses: number | null
  /** Current usage count */
  usedCount: number
  /** User IDs that have already used this coupon (for single-use) */
  usedByUsers: Array<string>
  /** Whether the coupon is active */
  isActive: boolean
  /** Description for display */
  description: string
}

const COUPON_DATABASE: Partial<Record<string, StoredCoupon>> = {
  WELCOME10: {
    code: 'WELCOME10',
    discountType: 'percentage',
    value: 10,
    minOrderValue: 1000,
    expiryDate: '2026-12-31',
    maxDiscount: 500,
    singleUse: true,
    maxUses: null,
    usedCount: 0,
    usedByUsers: [],
    isActive: true,
    description: '10% off your first order (max ৳500)',
  },
  FLAT200: {
    code: 'FLAT200',
    discountType: 'fixed',
    value: 200,
    minOrderValue: 2000,
    expiryDate: '2026-12-31',
    singleUse: false,
    maxUses: 1000,
    usedCount: 450,
    usedByUsers: [],
    isActive: true,
    description: '৳200 off on orders above ৳2000',
  },
  FREESHIP: {
    code: 'FREESHIP',
    discountType: 'fixed',
    value: 100,
    minOrderValue: 3000,
    expiryDate: '2026-12-31',
    singleUse: false,
    maxUses: null,
    usedCount: 0,
    usedByUsers: [],
    isActive: true,
    description: 'Free shipping on orders above ৳3000',
  },
  BULK15: {
    code: 'BULK15',
    discountType: 'percentage',
    value: 15,
    minOrderValue: 10000,
    expiryDate: '2026-06-30',
    maxDiscount: 2000,
    singleUse: false,
    maxUses: 500,
    usedCount: 123,
    usedByUsers: [],
    isActive: true,
    description: '15% off bulk orders above ৳10,000 (max ৳2000)',
  },
  EXPIRED2024: {
    code: 'EXPIRED2024',
    discountType: 'percentage',
    value: 20,
    minOrderValue: 500,
    expiryDate: '2024-12-31',
    singleUse: false,
    maxUses: null,
    usedCount: 0,
    usedByUsers: [],
    isActive: true,
    description: 'Expired coupon for testing',
  },
  INACTIVE: {
    code: 'INACTIVE',
    discountType: 'fixed',
    value: 100,
    minOrderValue: 0,
    expiryDate: '2026-12-31',
    singleUse: false,
    maxUses: null,
    usedCount: 0,
    usedByUsers: [],
    isActive: false,
    description: 'Inactive coupon for testing',
  },
  MAXEDOUT: {
    code: 'MAXEDOUT',
    discountType: 'percentage',
    value: 25,
    minOrderValue: 1000,
    expiryDate: '2026-12-31',
    singleUse: false,
    maxUses: 100,
    usedCount: 100,
    usedByUsers: [],
    isActive: true,
    description: 'Coupon that has reached max uses',
  },
  USEDONCE: {
    code: 'USEDONCE',
    discountType: 'fixed',
    value: 500,
    minOrderValue: 2500,
    expiryDate: '2026-12-31',
    singleUse: true,
    maxUses: null,
    usedCount: 5,
    usedByUsers: ['user-123', 'demo-user'],
    isActive: true,
    description: 'Single-use coupon (already used by demo-user)',
  },
}

// ============================================================================
// Validation Functions
// ============================================================================

interface ValidationResult {
  isValid: boolean
  error?: string
  errorCode?: 'INVALID' | 'EXPIRED' | 'MIN_ORDER' | 'ALREADY_USED' | 'MAX_USES' | 'INACTIVE'
  coupon?: CouponCode
  calculatedDiscount?: number
  description?: string
}

function validateCoupon(
  code: string,
  subtotal: number,
  userId?: string
): ValidationResult {
  const couponCode = code.trim().toUpperCase()

  // Check if coupon exists
  const storedCoupon = COUPON_DATABASE[couponCode]
  if (!storedCoupon) {
    return {
      isValid: false,
      error: 'Invalid coupon code. Please check and try again.',
      errorCode: 'INVALID',
    }
  }

  // Check if coupon is active
  if (!storedCoupon.isActive) {
    return {
      isValid: false,
      error: 'This coupon is no longer active.',
      errorCode: 'INACTIVE',
    }
  }

  // Check expiry date
  const now = new Date()
  const expiry = new Date(storedCoupon.expiryDate)
  if (now > expiry) {
    return {
      isValid: false,
      error: `This coupon expired on ${expiry.toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}.`,
      errorCode: 'EXPIRED',
    }
  }

  // Check minimum order value
  if (subtotal < storedCoupon.minOrderValue) {
    return {
      isValid: false,
      error: `Minimum order of ৳${storedCoupon.minOrderValue.toLocaleString()} required. Add ৳${(storedCoupon.minOrderValue - subtotal).toLocaleString()} more to use this coupon.`,
      errorCode: 'MIN_ORDER',
    }
  }

  // Check if max uses reached
  if (storedCoupon.maxUses !== null && storedCoupon.usedCount >= storedCoupon.maxUses) {
    return {
      isValid: false,
      error: 'This coupon has reached its maximum usage limit.',
      errorCode: 'MAX_USES',
    }
  }

  // Check single-use per user
  if (storedCoupon.singleUse && userId && storedCoupon.usedByUsers.includes(userId)) {
    return {
      isValid: false,
      error: 'You have already used this coupon.',
      errorCode: 'ALREADY_USED',
    }
  }

  // Calculate discount
  let discount = 0
  if (storedCoupon.discountType === 'percentage') {
    discount = (subtotal * storedCoupon.value) / 100
    if (storedCoupon.maxDiscount && discount > storedCoupon.maxDiscount) {
      discount = storedCoupon.maxDiscount
    }
  } else {
    discount = Math.min(storedCoupon.value, subtotal)
  }

  // Round to 2 decimal places
  discount = Math.round(discount * 100) / 100

  // Extract the CouponCode fields (without internal tracking fields)
  const couponForClient: CouponCode = {
    code: storedCoupon.code,
    discountType: storedCoupon.discountType,
    value: storedCoupon.value,
    minOrderValue: storedCoupon.minOrderValue,
    expiryDate: storedCoupon.expiryDate,
    maxDiscount: storedCoupon.maxDiscount,
    applicableProductIds: storedCoupon.applicableProductIds,
    applicableSupplierIds: storedCoupon.applicableSupplierIds,
  }

  return {
    isValid: true,
    coupon: couponForClient,
    calculatedDiscount: discount,
    description: storedCoupon.description,
  }
}

// ============================================================================
// API Route Handler
// ============================================================================

export const Route = createFileRoute('/api/cart/validate-coupon')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json() as ValidateCouponRequest & { userId?: string }
          const { code, cartSubtotal, userId } = body

          // Validate required fields
          if (!code || typeof code !== 'string') {
            return new Response(
              JSON.stringify({
                isValid: false,
                error: 'Coupon code is required.',
              } satisfies ValidateCouponResponse),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          }

          if (typeof cartSubtotal !== 'number' || cartSubtotal < 0) {
            return new Response(
              JSON.stringify({
                isValid: false,
                error: 'Invalid cart subtotal.',
              } satisfies ValidateCouponResponse),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              }
            )
          }

          // Simulate network delay for realistic async behavior
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Validate the coupon
          const result = validateCoupon(code, cartSubtotal, userId)

          const response: ValidateCouponResponse & { description?: string } = {
            isValid: result.isValid,
            error: result.error,
            coupon: result.coupon,
            calculatedDiscount: result.calculatedDiscount,
          }

          if (result.description) {
            response.description = result.description
          }

          return new Response(JSON.stringify(response), {
            status: result.isValid ? 200 : 400,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (error) {
          console.error('Coupon validation error:', error)
          return new Response(
            JSON.stringify({
              isValid: false,
              error: 'An error occurred while validating the coupon.',
            } satisfies ValidateCouponResponse),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      },
    },
  },
})
