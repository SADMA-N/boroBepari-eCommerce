import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { sellerAuthMiddleware } from './seller-auth-server'
import { uploadProductImage } from './product-images-s3'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { sanitizeHtml, sanitizeText } from '@/lib/sanitize'

export const uploadSellerProductImage = createServerFn({ method: 'POST' })
  .middleware([sellerAuthMiddleware])
  .inputValidator(
    z.object({
      fileBase64: z.string(),
      mimeType: z.string(),
      fileName: z.string(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.seller) {
      throw new Error('Unauthorized')
    }

    // Validate file size (base64 is ~33% larger than binary)
    const maxBase64Size = 10 * 1024 * 1024 * 1.34
    if (data.fileBase64.length > maxBase64Size) {
      throw new Error('File too large. Maximum size is 10MB.')
    }

    const buffer = Buffer.from(data.fileBase64, 'base64')
    const url = await uploadProductImage(
      buffer,
      context.seller.id,
      data.mimeType,
    )

    return { url }
  })

export const submitProductSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  mainCategory: z.string().optional(),
  subCategory: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string()).default([]),
  price: z.string().min(1),
  originalPrice: z.string().optional(),
  tieredPricingEnabled: z.boolean().default(false),
  tieredPricing: z
    .array(
      z.object({
        minQty: z.string(),
        maxQty: z.string(),
        price: z.string(),
      }),
    )
    .optional(),
  moq: z.string().min(1),
  stock: z.string().min(1),
  sku: z.string().optional(),
  unit: z.string().optional(),
  lowStockThreshold: z.string().optional(),
  specifications: z
    .array(z.object({ key: z.string(), value: z.string() }))
    .optional(),
  weight: z.string().optional(),
  dimensions: z
    .object({
      length: z.string(),
      width: z.string(),
      height: z.string(),
    })
    .optional(),
  shipFrom: z.string().optional(),
  deliveryTime: z.string().optional(),
  returnPolicy: z.string().optional(),
  hasSample: z.boolean().default(false),
  samplePrice: z.string().optional(),
  sampleMaxQty: z.string().optional(),
  sampleDelivery: z.string().optional(),
  mode: z.enum(['draft', 'publish']),
})

export const submitSellerProduct = createServerFn({ method: 'POST' })
  .middleware([sellerAuthMiddleware])
  .inputValidator(submitProductSchema)
  .handler(async ({ data, context }) => {
    if (!context.seller) {
      throw new Error('Unauthorized')
    }

    const shortId = crypto.randomUUID().slice(0, 8)
    const safeName = sanitizeText(data.name)
    const slug = `${safeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${shortId}`

    const status = data.mode === 'publish' ? 'pending' : 'draft'

    const tieredPricingData =
      data.tieredPricingEnabled && data.tieredPricing
        ? data.tieredPricing
            .filter((t) => t.minQty && t.price)
            .map((t) => ({
              minQty: parseInt(t.minQty),
              maxQty: t.maxQty ? parseInt(t.maxQty) : null,
              price: parseFloat(t.price),
            }))
        : []

    const specsData =
      data.specifications
        ?.filter((s) => s.key && s.value)
        .map((s) => ({ key: s.key, value: s.value })) ?? []

    const [inserted] = await db
      .insert(schema.sellerProducts)
      .values({
        sellerId: context.seller.id,
        name: safeName,
        slug,
        brand: data.brand ? sanitizeText(data.brand) : null,
        mainCategory: data.mainCategory ? sanitizeText(data.mainCategory) : null,
        subCategory: data.subCategory ? sanitizeText(data.subCategory) : null,
        description: data.description ? sanitizeHtml(data.description) : null,
        tags: data.tags ?? [],
        images: data.images,
        price: data.price,
        originalPrice: data.originalPrice || null,
        tieredPricing: tieredPricingData,
        moq: parseInt(data.moq),
        stock: parseInt(data.stock),
        sku: data.sku ? sanitizeText(data.sku) : null,
        unit: data.unit || 'piece',
        lowStockThreshold: data.lowStockThreshold
          ? parseInt(data.lowStockThreshold)
          : 10,
        specifications: specsData,
        weight: data.weight ? sanitizeText(data.weight) : null,
        dimensions: data.dimensions || null,
        shipFrom: data.shipFrom ? sanitizeText(data.shipFrom) : null,
        deliveryTime: data.deliveryTime ? sanitizeText(data.deliveryTime) : null,
        returnPolicy: data.returnPolicy ? sanitizeText(data.returnPolicy) : null,
        hasSample: data.hasSample,
        samplePrice: data.samplePrice || null,
        sampleMaxQty: data.sampleMaxQty
          ? parseInt(data.sampleMaxQty)
          : null,
        sampleDelivery: data.sampleDelivery ? sanitizeText(data.sampleDelivery) : null,
        status,
      })
      .returning({ id: schema.sellerProducts.id, status: schema.sellerProducts.status, slug: schema.sellerProducts.slug })

    return { id: inserted.id, status: inserted.status, slug: inserted.slug }
  })

export const getSellerProducts = createServerFn({ method: 'GET' })
  .middleware([sellerAuthMiddleware])
  .handler(async ({ context }) => {
    if (!context.seller) {
      throw new Error('Unauthorized')
    }

    const rows = await db.query.sellerProducts.findMany({
      where: eq(schema.sellerProducts.sellerId, context.seller.id),
      orderBy: [desc(schema.sellerProducts.createdAt)],
    })

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      sku: r.sku ?? '',
      price: parseFloat(r.price),
      moq: r.moq,
      stock: r.stock ?? 0,
      lowStockThreshold: r.lowStockThreshold ?? 10,
      status: r.status,
      images: (r.images as string[]) ?? [],
      adminNotes: r.adminNotes,
      createdAt: r.createdAt.toISOString(),
    }))
  })

export const getSellerProductById = createServerFn({ method: 'POST' })
  .middleware([sellerAuthMiddleware])
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data, context }) => {
    if (!context.seller) throw new Error('Unauthorized')

    const product = await db.query.sellerProducts.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, data.id), eq(p.sellerId, context.seller!.id)),
    })

    if (!product) throw new Error('Product not found')

    return {
      ...product,
      images: (product.images as string[]) || [],
      tags: (product.tags as string[]) || [],
      specifications: (product.specifications as any[]) || [],
      tieredPricing: (product.tieredPricing as any[]) || [],
      dimensions: (product.dimensions as any) || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    }
  })

export const updateSellerProduct = createServerFn({ method: 'POST' })
  .middleware([sellerAuthMiddleware])
  .inputValidator(submitProductSchema.extend({ id: z.number() }))
  .handler(async ({ data, context }) => {
    if (!context.seller) throw new Error('Unauthorized')

    const existing = await db.query.sellerProducts.findFirst({
      where: (p, { and, eq }) =>
        and(eq(p.id, data.id), eq(p.sellerId, context.seller!.id)),
    })

    if (!existing) throw new Error('Product not found')

    const tieredPricingData =
      data.tieredPricingEnabled && data.tieredPricing
        ? data.tieredPricing
            .filter((t) => t.minQty && t.price)
            .map((t) => ({
              minQty: parseInt(t.minQty),
              maxQty: t.maxQty ? parseInt(t.maxQty) : null,
              price: parseFloat(t.price),
            }))
        : []

    const specsData =
      data.specifications
        ?.filter((s) => s.key && s.value)
        .map((s) => ({ key: s.key, value: s.value })) ?? []

    // If publishing, change status to pending, otherwise draft
    // We will override this to 'accepted' if we successfully sync to products table
    let status = data.mode === 'publish' ? 'pending' : 'draft'

    const safeName = sanitizeText(data.name)
    const [updated] = await db
      .update(schema.sellerProducts)
      .set({
        name: safeName,
        brand: data.brand ? sanitizeText(data.brand) : null,
        mainCategory: data.mainCategory ? sanitizeText(data.mainCategory) : null,
        subCategory: data.subCategory ? sanitizeText(data.subCategory) : null,
        description: data.description ? sanitizeHtml(data.description) : null,
        tags: data.tags ?? [],
        images: data.images,
        price: data.price,
        originalPrice: data.originalPrice || null,
        tieredPricing: tieredPricingData,
        moq: parseInt(data.moq),
        stock: parseInt(data.stock),
        sku: data.sku ? sanitizeText(data.sku) : null,
        unit: data.unit || 'piece',
        lowStockThreshold: data.lowStockThreshold
          ? parseInt(data.lowStockThreshold)
          : 10,
        specifications: specsData,
        weight: data.weight ? sanitizeText(data.weight) : null,
        dimensions: data.dimensions || null,
        shipFrom: data.shipFrom ? sanitizeText(data.shipFrom) : null,
        deliveryTime: data.deliveryTime ? sanitizeText(data.deliveryTime) : null,
        returnPolicy: data.returnPolicy ? sanitizeText(data.returnPolicy) : null,
        hasSample: data.hasSample,
        samplePrice: data.samplePrice || null,
        sampleMaxQty: data.sampleMaxQty ? parseInt(data.sampleMaxQty) : null,
        sampleDelivery: data.sampleDelivery ? sanitizeText(data.sampleDelivery) : null,
        status: status, // Update status based on action
        updatedAt: new Date(),
      })
      .where(eq(schema.sellerProducts.id, data.id))
      .returning({
        id: schema.sellerProducts.id,
        slug: schema.sellerProducts.slug,
      })

    // Sync with public products table if mode is publish
    if (data.mode === 'publish') {
      try {
        const seller = await db.query.sellers.findFirst({
          where: eq(schema.sellers.id, context.seller.id),
        })

        if (existing.publishedProductId) {
          // Update existing public product
          await db
            .update(schema.products)
            .set({
              name: safeName,
              description: data.description ? sanitizeHtml(data.description) : null,
              images: data.images,
              price: data.price,
              originalPrice: data.originalPrice || null,
              moq: parseInt(data.moq),
              stock: parseInt(data.stock),
              unit: data.unit || 'piece',
              specifications: specsData,
              tieredPricing: tieredPricingData,
              updatedAt: new Date(),
            })
            .where(eq(schema.products.id, existing.publishedProductId))

          // Auto-approve
          await db
            .update(schema.sellerProducts)
            .set({ status: 'accepted' })
            .where(eq(schema.sellerProducts.id, updated.id))
        } else if (seller?.supplierId) {
          // Create new public product
          const [newProduct] = await db
            .insert(schema.products)
            .values({
              name: safeName,
              slug: updated.slug,
              description: data.description ? sanitizeHtml(data.description) : null,
              images: data.images,
              price: data.price,
              originalPrice: data.originalPrice || null,
              moq: parseInt(data.moq),
              stock: parseInt(data.stock),
              unit: data.unit || 'piece',
              specifications: specsData,
              tieredPricing: tieredPricingData,
              supplierId: seller.supplierId,
              categoryId: null, // Pending category mapping
              isNew: true,
            })
            .returning({ id: schema.products.id })

          // Link back and auto-approve
          await db
            .update(schema.sellerProducts)
            .set({
              publishedProductId: newProduct.id,
              status: 'accepted',
            })
            .where(eq(schema.sellerProducts.id, updated.id))
        }
      } catch (error) {
        console.error('Error syncing to products table:', error)
        // We don't throw here to avoid breaking the seller flow, but we log it.
        // The seller product is still saved as pending/draft.
      }
    }

    return { success: true, id: updated.id, slug: updated.slug }
  })
