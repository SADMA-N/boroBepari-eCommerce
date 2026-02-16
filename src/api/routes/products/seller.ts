import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import { requireSellerAuth, type SellerEnv } from '@/api/middleware/seller-auth'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { uploadProductImage } from '@/lib/product-images-s3'
import { sanitizeHtml, sanitizeText } from '@/lib/sanitize'

const submitProductSchema = z.object({
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

const router = new Hono<SellerEnv>().basePath('/seller/products')

router.use(requireSellerAuth)

// POST /seller/products/upload-image
router.post('/upload-image', async (c) => {
  try {
    const seller = c.get('seller')!
    const body = await c.req.json()

    const data = z
      .object({
        fileBase64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      })
      .parse(body)

    // Validate file size (base64 is ~33% larger than binary)
    const maxBase64Size = 10 * 1024 * 1024 * 1.34
    if (data.fileBase64.length > maxBase64Size) {
      return c.json({ error: 'File too large. Maximum size is 10MB.' }, 400)
    }

    const buffer = Buffer.from(data.fileBase64, 'base64')
    const url = await uploadProductImage(buffer, seller.id, data.mimeType)

    return c.json({ url })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to upload image' }, 500)
  }
})

// POST /seller/products
router.post('/', async (c) => {
  try {
    const seller = c.get('seller')!
    const body = await c.req.json()
    const data = submitProductSchema.parse(body)

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
        sellerId: seller.id,
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
        sampleMaxQty: data.sampleMaxQty ? parseInt(data.sampleMaxQty) : null,
        sampleDelivery: data.sampleDelivery ? sanitizeText(data.sampleDelivery) : null,
        status,
      })
      .returning({
        id: schema.sellerProducts.id,
        status: schema.sellerProducts.status,
        slug: schema.sellerProducts.slug,
      })

    return c.json({ id: inserted.id, status: inserted.status, slug: inserted.slug })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create product' }, 500)
  }
})

// GET /seller/products
router.get('/', async (c) => {
  try {
    const seller = c.get('seller')!

    const rows = await db.query.sellerProducts.findMany({
      where: and(
        eq(schema.sellerProducts.sellerId, seller.id),
        isNull(schema.sellerProducts.deletedAt),
      ),
      orderBy: [desc(schema.sellerProducts.createdAt)],
    })

    return c.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        sku: r.sku ?? '',
        price: parseFloat(r.price),
        moq: r.moq,
        stock: r.stock ?? 0,
        lowStockThreshold: r.lowStockThreshold ?? 10,
        status: r.status,
        images: r.images ?? [],
        adminNotes: r.adminNotes,
        createdAt: r.createdAt.toISOString(),
      })),
    )
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch products' }, 500)
  }
})

// GET /seller/products/:id
router.get('/:id', async (c) => {
  try {
    const seller = c.get('seller')!
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid product id' }, 400)
    }

    const product = await db.query.sellerProducts.findFirst({
      where: and(
        eq(schema.sellerProducts.id, id),
        eq(schema.sellerProducts.sellerId, seller.id),
        isNull(schema.sellerProducts.deletedAt),
      ),
    })

    if (!product) {
      return c.json({ error: 'Product not found' }, 404)
    }

    return c.json({
      ...product,
      images: product.images ?? [],
      tags: product.tags ?? [],
      specifications: (product.specifications as Array<any> | null) ?? [],
      tieredPricing: (product.tieredPricing as Array<any> | null) ?? [],
      dimensions: (product.dimensions as any) || null,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch product' }, 500)
  }
})

// PUT /seller/products/:id
router.put('/:id', async (c) => {
  try {
    const seller = c.get('seller')!
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid product id' }, 400)
    }

    const body = await c.req.json()
    const data = submitProductSchema.parse(body)

    const existing = await db.query.sellerProducts.findFirst({
      where: and(
        eq(schema.sellerProducts.id, id),
        eq(schema.sellerProducts.sellerId, seller.id),
        isNull(schema.sellerProducts.deletedAt),
      ),
    })

    if (!existing) {
      return c.json({ error: 'Product not found' }, 404)
    }

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

    const status = data.mode === 'publish' ? 'pending' : 'draft'
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
        status,
        updatedAt: new Date(),
      })
      .where(eq(schema.sellerProducts.id, id))
      .returning({
        id: schema.sellerProducts.id,
        slug: schema.sellerProducts.slug,
      })

    // Sync with public products table if mode is publish
    if (data.mode === 'publish') {
      try {
        const sellerRecord = await db.query.sellers.findFirst({
          where: eq(schema.sellers.id, seller.id),
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
        } else if (sellerRecord?.supplierId) {
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
              supplierId: sellerRecord.supplierId,
              categoryId: null,
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
      }
    }

    return c.json({ success: true, id: updated.id, slug: updated.slug })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update product' }, 500)
  }
})

// DELETE /seller/products
router.delete('/', async (c) => {
  try {
    const seller = c.get('seller')!
    const body = await c.req.json()

    const data = z
      .object({
        ids: z.array(z.number().int().positive()).min(1),
      })
      .parse(body)

    const uniqueIds = Array.from(new Set(data.ids))

    const sellerRows = await db.query.sellerProducts.findMany({
      columns: {
        id: true,
        publishedProductId: true,
      },
      where: and(
        eq(schema.sellerProducts.sellerId, seller.id),
        inArray(schema.sellerProducts.id, uniqueIds),
      ),
    })

    if (sellerRows.length !== uniqueIds.length) {
      return c.json({ error: 'One or more products were not found for this seller' }, 404)
    }

    const publicProductIds = Array.from(
      new Set(
        sellerRows
          .map((row) => row.publishedProductId)
          .filter((id): id is number => typeof id === 'number'),
      ),
    )

    await db.transaction(async (tx) => {
      await tx
        .update(schema.sellerProducts)
        .set({
          deletedAt: new Date(),
          deletedBy: seller.id,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.sellerProducts.sellerId, seller.id),
            inArray(schema.sellerProducts.id, uniqueIds),
            isNull(schema.sellerProducts.deletedAt),
          ),
        )

      if (publicProductIds.length > 0) {
        await tx
          .update(schema.products)
          .set({
            deletedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(
            and(
              inArray(schema.products.id, publicProductIds),
              isNull(schema.products.deletedAt),
            ),
          )
      }
    })

    return c.json({
      success: true,
      deletedSellerProductIds: uniqueIds,
      deletedPublicProductIds: publicProductIds,
    })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete products' }, 500)
  }
})

export default router
