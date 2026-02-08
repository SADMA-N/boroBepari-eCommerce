import { createServerFn } from '@tanstack/react-start'
import { desc, eq, ilike } from 'drizzle-orm'
import { z } from 'zod'
import { adminAuthMiddleware } from './admin-auth-server'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const getAdminSellerProducts = createServerFn({ method: 'GET' })
  .middleware([adminAuthMiddleware])
  .handler(async ({ context }) => {
    if (!context.admin) {
      throw new Error('Unauthorized')
    }

    const rows = await db.query.sellerProducts.findMany({
      with: { seller: true },
      orderBy: [desc(schema.sellerProducts.createdAt)],
    })

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku ?? '',
      brand: r.brand,
      mainCategory: r.mainCategory,
      subCategory: r.subCategory,
      description: r.description,
      tags: (r.tags as string[]) ?? [],
      images: (r.images as string[]) ?? [],
      price: parseFloat(r.price),
      originalPrice: r.originalPrice ? parseFloat(r.originalPrice) : null,
      tieredPricing:
        (r.tieredPricing as Array<{
          minQty: number
          maxQty: number | null
          price: number
        }>) ?? [],
      moq: r.moq,
      stock: r.stock ?? 0,
      status: r.status,
      specifications:
        (r.specifications as Array<{ key: string; value: string }>) ?? [],
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
      createdAt: r.createdAt.toISOString(),
      sellerBusinessName: r.seller?.businessName ?? 'Unknown Seller',
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

    // Get the supplierId from the seller's record
    const supplierId = sp.seller?.supplierId ?? null

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
        images: (sp.images as string[]) ?? [],
        price: sp.price,
        originalPrice: sp.originalPrice,
        moq: sp.moq,
        stock: sp.stock ?? 0,
        unit: sp.unit ?? 'piece',
        categoryId,
        supplierId,
        featured: false,
        isNew: true,
        tags: (sp.tags as string[]) ?? [],
        tieredPricing:
          (sp.tieredPricing as Array<{
            minQty: number
            maxQty: number | null
            price: number
          }>) ?? [],
        specifications:
          (sp.specifications as Array<{ key: string; value: string }>) ?? [],
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
