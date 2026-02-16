import { Hono } from 'hono'
import { z } from 'zod'
import { and, inArray, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { products } from '@/db/schema'
import type { CouponCode, ValidateCouponResponse } from '@/types/cart'

const router = new Hono().basePath('/cart')

interface StoredCoupon extends CouponCode {
  singleUse: boolean
  maxUses: number | null
  usedCount: number
  usedByUsers: Array<string>
  isActive: boolean
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

interface ValidationResult {
  isValid: boolean
  error?: string
  coupon?: CouponCode
  calculatedDiscount?: number
  description?: string
}

function validateCoupon(
  code: string,
  subtotal: number,
  userId?: string,
): ValidationResult {
  const couponCode = code.trim().toUpperCase()
  const storedCoupon = COUPON_DATABASE[couponCode]

  if (!storedCoupon) {
    return {
      isValid: false,
      error: 'Invalid coupon code. Please check and try again.',
    }
  }

  if (!storedCoupon.isActive) {
    return {
      isValid: false,
      error: 'This coupon is no longer active.',
    }
  }

  const now = new Date()
  const expiry = new Date(storedCoupon.expiryDate)
  if (now > expiry) {
    return {
      isValid: false,
      error: `This coupon expired on ${expiry.toLocaleDateString('en-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}.`,
    }
  }

  if (subtotal < storedCoupon.minOrderValue) {
    return {
      isValid: false,
      error: `Minimum order of ৳${storedCoupon.minOrderValue.toLocaleString()} required. Add ৳${(storedCoupon.minOrderValue - subtotal).toLocaleString()} more to use this coupon.`,
    }
  }

  if (
    storedCoupon.maxUses !== null &&
    storedCoupon.usedCount >= storedCoupon.maxUses
  ) {
    return {
      isValid: false,
      error: 'This coupon has reached its maximum usage limit.',
    }
  }

  if (
    storedCoupon.singleUse &&
    userId &&
    storedCoupon.usedByUsers.includes(userId)
  ) {
    return {
      isValid: false,
      error: 'You have already used this coupon.',
    }
  }

  let discount = 0
  if (storedCoupon.discountType === 'percentage') {
    discount = (subtotal * storedCoupon.value) / 100
    if (storedCoupon.maxDiscount && discount > storedCoupon.maxDiscount) {
      discount = storedCoupon.maxDiscount
    }
  } else {
    discount = Math.min(storedCoupon.value, subtotal)
  }

  discount = Math.round(discount * 100) / 100

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

// Legacy compatibility endpoints that now run through Hono
router.get('/:userId', (c) => {
  const userId = c.req.param('userId')
  return c.json({
    items: [],
    userId,
    message: 'Cart fetched',
  })
})

router.post('/add', (c) => {
  return c.json({
    success: true,
    message: 'Item added to cart',
  })
})

router.patch('/item/:itemId', (c) => {
  const itemId = c.req.param('itemId')
  return c.json({
    success: true,
    itemId,
    message: 'Item updated',
  })
})

router.delete('/item/:itemId', (c) => {
  const itemId = c.req.param('itemId')
  return c.json({
    success: true,
    itemId,
    message: 'Item removed',
  })
})

router.post('/validate-coupon', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const code = body?.code
    const cartSubtotal = body?.cartSubtotal
    const userId = body?.userId

    if (!code || typeof code !== 'string') {
      return c.json(
        {
          isValid: false,
          error: 'Coupon code is required.',
        } satisfies ValidateCouponResponse,
        400,
      )
    }

    if (typeof cartSubtotal !== 'number' || cartSubtotal < 0) {
      return c.json(
        {
          isValid: false,
          error: 'Invalid cart subtotal.',
        } satisfies ValidateCouponResponse,
        400,
      )
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    const result = validateCoupon(code, cartSubtotal, userId)
    const response: ValidateCouponResponse & { description?: string } = {
      isValid: result.isValid,
      error: result.error,
      coupon: result.coupon,
      calculatedDiscount: result.calculatedDiscount,
    }
    if (result.description) response.description = result.description

    return c.json(response, result.isValid ? 200 : 400)
  } catch (error: any) {
    console.error('Coupon validation error:', error)
    return c.json(
      {
        isValid: false,
        error: 'An error occurred while validating the coupon.',
      } satisfies ValidateCouponResponse,
      500,
    )
  }
})

// POST /validate - Validate cart items
router.post('/validate', async (c) => {
  try {
    const body = await c.req.json()
    const items = z
      .array(
        z.object({
          productId: z.number(),
          quantity: z.number().positive(),
          unitPrice: z.number(),
          id: z.string(),
        }),
      )
      .parse(body)

    if (!items.length) {
      return c.json({ valid: true, changes: [], errors: [] })
    }

    const productIds = items.map((item) => item.productId)
    const dbProducts = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, productIds), isNull(products.deletedAt)))

    const productMap = new Map(dbProducts.map((p) => [p.id, p]))

    const changes: Array<{
      id: string
      type: string
      productId: number
      message: string
      oldValue?: number
      newValue?: number
    }> = []
    const errors: Array<{
      id: string
      type: string
      productId: number
      message: string
    }> = []

    for (const item of items) {
      const product = productMap.get(item.productId)

      if (!product) {
        errors.push({
          id: item.id,
          type: 'removed',
          productId: item.productId,
          message: 'Product is no longer available',
        })
        continue
      }

      const currentPrice = parseFloat(product.price)
      if (currentPrice !== item.unitPrice) {
        changes.push({
          id: item.id,
          type: 'price_changed',
          productId: item.productId,
          message: `Price changed from ৳${item.unitPrice} to ৳${currentPrice}`,
          oldValue: item.unitPrice,
          newValue: currentPrice,
        })
      }

      const stock = product.stock ?? 0
      if (item.quantity > stock) {
        changes.push({
          id: item.id,
          type: 'stock_changed',
          productId: item.productId,
          message:
            stock === 0
              ? 'Product is out of stock'
              : `Only ${stock} units available`,
          oldValue: item.quantity,
          newValue: stock,
        })
      }
    }

    const valid = changes.length === 0 && errors.length === 0

    return c.json({ valid, changes, errors })
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to validate cart' },
      500,
    )
  }
})

export default router
