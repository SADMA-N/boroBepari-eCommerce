import { createServerFn } from '@tanstack/react-start'
import { desc, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { adminAuthMiddleware } from './admin-auth-server'
import { db } from '@/db'
import * as schema from '@/db/schema'

/**
 * Returns an existing supplierId for a seller, or creates a new suppliers record
 * from the seller's data and links it back.
 */
async function getOrCreateSupplierForSeller(
  seller: typeof schema.sellers.$inferSelect,
): Promise<number> {
  if (seller.supplierId) {
    return seller.supplierId
  }

  const shortId = crypto.randomUUID().slice(0, 8)
  const slug = `${seller.businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${shortId}`

  const kycInfo = seller.kycAdditionalInfo as { description?: string } | null

  const [newSupplier] = await db
    .insert(schema.suppliers)
    .values({
      name: seller.businessName,
      slug,
      location: seller.city ?? seller.address ?? '',
      verified:
        seller.verificationBadge === 'verified' ||
        seller.verificationBadge === 'premium',
      yearsInBusiness: seller.yearsInBusiness ?? 0,
      description: kycInfo?.description ?? '',
      responseRate: '0',
      onTimeDelivery: '0',
    })
    .returning({ id: schema.suppliers.id })

  // Link the seller to the newly created supplier
  await db
    .update(schema.sellers)
    .set({ supplierId: newSupplier.id, updatedAt: new Date() })
    .where(eq(schema.sellers.id, seller.id))

  return newSupplier.id
}

export const getAdminSellerProducts = createServerFn({ method: 'GET' })
  .middleware([adminAuthMiddleware])
  .handler(async ({ context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const rows = await db.query.sellerProducts.findMany({
      with: { seller: true, publishedProduct: true },
      orderBy: [desc(schema.sellerProducts.createdAt)],
    })

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.publishedProduct?.slug ?? r.slug,  
      sku: r.sku ?? '',
      brand: r.brand,
      mainCategory: r.mainCategory,
      subCategory: r.subCategory,
      description: r.description,
      tags: (r.tags) ?? [],
      images: (r.images) ?? [],
      price: parseFloat(r.price),
      originalPrice: r.originalPrice ? parseFloat(r.originalPrice) : null,
      tieredPricing:
        (r.tieredPricing as Array<{
          minQty: number
          maxQty: number | null
          price: number
        }> | null) ?? [],
      moq: r.moq,
      stock: r.stock ?? 0,  
      status: r.status,
      moderationStatus: r.deletedAt ? 'deleted' : r.status,
      specifications:
        (r.specifications as Array<{ key: string; value: string }> | null) ?? [],
      weight: r.weight,
      shipFrom: r.shipFrom,
      deliveryTime: r.deliveryTime,
      returnPolicy: r.returnPolicy,
      hasSample: r.hasSample,
      samplePrice: r.samplePrice ? parseFloat(r.samplePrice) : null,
      adminNotes: r.adminNotes,
      reviewedBy: r.reviewedBy,
      reviewedAt: r.reviewedAt?.toISOString() ?? null,
      publishedProductId: r.publishedProductId,
      deletedAt: r.deletedAt?.toISOString() ?? null,
      deletedBy: r.deletedBy ?? null,
      createdAt: r.createdAt.toISOString(),
      sellerBusinessName: r.seller?.businessName ?? 'Unknown Seller', // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      sellerId: r.sellerId,
    }))
  })

export const approveSellerProduct = createServerFn({ method: 'POST' })
  .middleware([adminAuthMiddleware])
  .inputValidator(z.object({ sellerProductId: z.number() }))
  .handler(async ({ data, context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const sp = await db.query.sellerProducts.findFirst({
      where: eq(schema.sellerProducts.id, data.sellerProductId),
      with: { seller: true },
    })

    if (!sp) {
      throw new Error('Seller product not found')
    }
    if (sp.deletedAt) {
      throw new Error('Product was deleted by seller')
    }
    if (sp.status !== 'pending') {
      throw new Error('Product is not in pending status')
    }

    // Try to find a matching category
    let categoryId: number | null = null
    if (sp.subCategory) {
      const cat = await db.query.categories.findFirst({
        where: ilike(schema.categories.name, sp.subCategory),
      })
      if (cat) categoryId = cat.id
    }
    if (!categoryId && sp.mainCategory) {
      const cat = await db.query.categories.findFirst({
        where: ilike(schema.categories.name, sp.mainCategory),
      })
      if (cat) categoryId = cat.id
    }

    // Get or create a supplier record for this seller
    const supplierId = sp.seller // eslint-disable-line @typescript-eslint/no-unnecessary-condition
      ? await getOrCreateSupplierForSeller(sp.seller)
      : null

    // Generate a unique slug for the products table
    const shortId = crypto.randomUUID().slice(0, 8)
    const productSlug = `${sp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${shortId}`

    // Insert into the main products table
    const [newProduct] = await db
      .insert(schema.products)
      .values({
        name: sp.name,
        slug: productSlug,
        description: sp.description,
        images: (sp.images) ?? [],
        price: sp.price,
        originalPrice: sp.originalPrice,
        moq: sp.moq,
        stock: sp.stock ?? 0,  
        unit: sp.unit ?? 'piece',  
        categoryId,
        supplierId,
        featured: false,
        isNew: true,
        tags: (sp.tags) ?? [],
        tieredPricing:
          (sp.tieredPricing as Array<{
            minQty: number
            maxQty: number | null
            price: number
          }> | null) ?? [],
        specifications:
          (sp.specifications as Array<{ key: string; value: string }> | null) ?? [],
        hasSample: sp.hasSample ?? false,
        samplePrice: sp.samplePrice,
      })
      .returning({ id: schema.products.id })

    // Update the seller product record
    await db
      .update(schema.sellerProducts)
      .set({
        status: 'accepted',
        reviewedBy: context.admin.id,
        reviewedAt: new Date(),
        publishedProductId: newProduct.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.sellerProducts.id, data.sellerProductId))

    return { success: true, publishedProductId: newProduct.id }
  })

export const declineSellerProduct = createServerFn({ method: 'POST' })
  .middleware([adminAuthMiddleware])
  .inputValidator(
    z.object({
      sellerProductId: z.number(),
      reason: z.string().min(1, 'Reason is required'),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const sp = await db.query.sellerProducts.findFirst({
      where: eq(schema.sellerProducts.id, data.sellerProductId),
    })

    if (!sp) {
      throw new Error('Seller product not found')
    }
    if (sp.deletedAt) {
      throw new Error('Product was deleted by seller')
    }
    if (sp.status !== 'pending') {
      throw new Error('Product is not in pending status')
    }

    await db
      .update(schema.sellerProducts)
      .set({
        status: 'declined',
        adminNotes: data.reason,
        reviewedBy: context.admin.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.sellerProducts.id, data.sellerProductId))

    return { success: true }
  })

export const restoreSellerDeletedProduct = createServerFn({ method: 'POST' })
  .middleware([adminAuthMiddleware])
  .inputValidator(z.object({ sellerProductId: z.number() }))
  .handler(async ({ data, context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const sp = await db.query.sellerProducts.findFirst({
      where: eq(schema.sellerProducts.id, data.sellerProductId),
      columns: {
        id: true,
        deletedAt: true,
        publishedProductId: true,
      },
    })

    if (!sp) {
      throw new Error('Seller product not found')
    }

    if (!sp.deletedAt) {
      throw new Error('Product is not deleted')
    }

    const now = new Date()

    await db.transaction(async (tx) => {
      await tx
        .update(schema.sellerProducts)
        .set({
          deletedAt: null,
          deletedBy: null,
          status: 'draft',
          updatedAt: now,
        })
        .where(eq(schema.sellerProducts.id, data.sellerProductId))

      if (sp.publishedProductId) {
        await tx
          .update(schema.products)
          .set({
            deletedAt: null,
            updatedAt: now,
          })
          .where(eq(schema.products.id, sp.publishedProductId))
      }
    })

    return { success: true, restoredStatus: 'draft' as const }
  })
