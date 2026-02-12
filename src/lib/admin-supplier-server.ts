import { createServerFn } from '@tanstack/react-start'
import { desc, eq, sql } from 'drizzle-orm'
import { adminAuthMiddleware } from './admin-auth-server'
import { db } from '@/db'
import { sellers, suppliers, products, orderItems } from '@/db/schema'

export type AdminSupplier = {
  id: string
  businessName: string
  ownerName: string
  email: string
  phone: string
  kycStatus: 'pending' | 'verified' | 'rejected'
  verificationBadge: 'none' | 'verified' | 'premium'
  totalProducts: number
  totalOrders: number
  gmv: number
  registrationDate: string
  status: 'active' | 'suspended'
  category: string
  businessType: string
  tradeLicense: string
  address: string
  bank: {
    name: string
    accountName: string
    accountNumberMasked: string
    branch: string
  }
  lastActive: string
  kycDocs: {
    tradeLicense: string
    nidFront: string
    nidBack: string
    bankProof: string
  }
  kycDecision?: {
    date: string
    reason?: string
  }
  analytics: {
    fulfillmentRate: number
    averageRating: number
    rfqResponseRate: number
    topProducts: Array<{ name: string; gmv: number }>
    gmvSeries: Array<{ date: string; gmv: number }>
  }
  activityLog: Array<{ id: string; message: string; time: string }>
}

export const getAdminSuppliers = createServerFn({ method: 'GET' })
  .middleware([adminAuthMiddleware])
  .handler(async () => {
    // Fetch sellers with their linked supplier info
    const allSellers = await db
      .select({
        seller: sellers,
        supplier: suppliers,
      })
      .from(sellers)
      .leftJoin(suppliers, eq(sellers.supplierId, suppliers.id))
      .orderBy(desc(sellers.createdAt))

    // For each seller, fetch product count and GMV (this could be optimized with aggregations)
    const result: AdminSupplier[] = await Promise.all(
      allSellers.map(async ({ seller, supplier }) => {
        let totalProducts = 0
        let gmv = 0
        let totalOrders = 0

        if (supplier) {
            // Count products
            const productsCount = await db
                .select({ count: sql<number>`count(*)` })
                .from(products)
                .where(eq(products.supplierId, supplier.id))
            
            totalProducts = Number(productsCount[0].count)

            // Calculate GMV and Orders from OrderItems linked to this supplier
            // Note: This is a simplified calculation. In a real app, check order status.
            const stats = await db
                .select({
                    gmv: sql<number>`sum(${orderItems.price} * ${orderItems.quantity})`,
                    orders: sql<number>`count(distinct ${orderItems.orderId})`
                })
                .from(orderItems)
                .where(eq(orderItems.supplierId, supplier.id))
            
            gmv = Number(stats[0].gmv) || 0
            totalOrders = Number(stats[0].orders) || 0
        }

        // Map to AdminSupplier type
        return {
          id: seller.id,
          businessName: seller.businessName,
          ownerName: seller.fullName || 'N/A', // Assuming fullName is owner name
          email: seller.email,
          phone: seller.phone || 'N/A',
          kycStatus: (seller.kycStatus === 'approved' ? 'verified' : seller.kycStatus) as any,
          verificationBadge: seller.verificationBadge as any,
          totalProducts,
          totalOrders,
          gmv,
          registrationDate: seller.createdAt.toISOString().split('T')[0],
          status: 'active', // Default to active as 'status' field isn't in sellers table explicitly, maybe infer from verification or other fields
          category: seller.businessCategory || 'Uncategorized',
          businessType: seller.businessType || 'N/A',
          tradeLicense: seller.tradeLicenseNumber || 'N/A',
          address: seller.address || 'N/A',
          bank: {
            name: seller.bankName || 'N/A',
            accountName: seller.accountHolderName || 'N/A',
            accountNumberMasked: seller.accountNumber ? `**** ${seller.accountNumber.slice(-4)}` : 'N/A',
            branch: seller.branchName || 'N/A',
          },
          lastActive: seller.updatedAt.toISOString().replace('T', ' ').substring(0, 16),
          kycDocs: {
            tradeLicense: '/img/kyc/trade-license.png', // Placeholders as actual docs are in kycDocuments json or seller_documents table
            nidFront: '/img/kyc/nid-front.png',
            nidBack: '/img/kyc/nid-back.png',
            bankProof: '/img/kyc/bank-proof.png',
          },
          kycDecision: seller.kycRejectionReason ? {
            date: seller.kycSubmittedAt?.toISOString().split('T')[0] || '',
            reason: seller.kycRejectionReason
          } : undefined,
          analytics: {
            fulfillmentRate: 0, // Mocked
            averageRating: 0, // Mocked
            rfqResponseRate: 0, // Mocked
            topProducts: [], // Mocked
            gmvSeries: [], // Mocked
          },
          activityLog: [], // Mocked
        }
      })
    )

    return result
  })
