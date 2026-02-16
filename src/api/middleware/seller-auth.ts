import { createMiddleware } from 'hono/factory'
import { eq } from 'drizzle-orm'
import { verifySellerToken } from '@/lib/seller-auth-server'
import { db } from '@/db'
import * as schema from '@/db/schema'
import type { SellerUser } from '@/types/seller'

function mapSellerToUser(seller: any): SellerUser {
  return {
    id: seller.id,
    businessName: seller.businessName,
    businessType: seller.businessType,
    tradeLicenseNumber: seller.tradeLicenseNumber,
    businessCategory: seller.businessCategory,
    yearsInBusiness: seller.yearsInBusiness,
    fullName: seller.fullName,
    email: seller.email,
    phone: seller.phone,
    address: seller.address,
    city: seller.city,
    postalCode: seller.postalCode,
    bankName: seller.bankName,
    accountHolderName: seller.accountHolderName,
    accountNumber: seller.accountNumber,
    branchName: seller.branchName,
    routingNumber: seller.routingNumber,
    kycStatus: seller.kycStatus,
    kycSubmittedAt: seller.kycSubmittedAt
      ? seller.kycSubmittedAt.toISOString()
      : null,
    kycRejectionReason: seller.kycRejectionReason,
    verificationBadge: seller.verificationBadge,
  }
}

export type SellerEnv = {
  Variables: {
    seller: SellerUser | null
  }
}

export const optionalSellerAuth = createMiddleware<SellerEnv>(
  async (c, next) => {
    try {
      const authHeader = c.req.header('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (token) {
        const decoded = verifySellerToken(token)
        if (decoded) {
          const seller = await db.query.sellers.findFirst({
            where: eq(schema.sellers.id, decoded.sellerId),
          })
          if (seller) {
            c.set('seller', mapSellerToUser(seller))
            return next()
          }
        }
      }
    } catch (error) {
      console.error('Seller auth middleware error:', error)
    }

    c.set('seller', null)
    await next()
  },
)

export const requireSellerAuth = createMiddleware<SellerEnv>(
  async (c, next) => {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const decoded = verifySellerToken(token)
    if (!decoded) {
      return c.json({ error: 'Invalid or expired token' }, 401)
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, decoded.sellerId),
    })

    if (!seller) {
      return c.json({ error: 'Seller not found' }, 401)
    }

    c.set('seller', mapSellerToUser(seller))
    await next()
  },
)

export { mapSellerToUser }
