import { Hono } from 'hono'
import { z } from 'zod'
import { desc, eq, ilike } from 'drizzle-orm'
import { requireAdminAuth, type AdminEnv } from '@/api/middleware/admin-auth'
import { db } from '@/db'
import * as schema from '@/db/schema'

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

const router = new Hono<AdminEnv>().basePath('/admin/products')

router.use(requireAdminAuth)

// GET /admin/products
router.get('/', async (c) => {
  try {
    const rows = await db.query.sellerProducts.findMany({
      with: { seller: true, publishedProduct: true },
      orderBy: [desc(schema.sellerProducts.createdAt)],
    })

    return c.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.publishedProduct?.slug ?? r.slug,
        sku: r.sku ?? '',
        brand: r.brand,
        mainCategory: r.mainCategory,
        subCategory: r.subCategory,
        description: r.description,
        tags: r.tags ?? [],
        images: r.images ?? [],
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
        sellerBusinessName: r.seller?.businessName ?? 'Unknown Seller',
        sellerId: r.sellerId,
      })),
    )
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch products' }, 500)
  }
})

// POST /admin/products/:id/approve
router.post('/:id/approve', async (c) => {
  try {
    const admin = c.get('admin')!
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid product id' }, 400)
    }

    const sp = await db.query.sellerProducts.findFirst({
      where: eq(schema.sellerProducts.id, id),
      with: { seller: true },
    })

    if (!sp) {
      return c.json({ error: 'Seller product not found' }, 404)
    }
    if (sp.deletedAt) {
      return c.json({ error: 'Product was deleted by seller' }, 400)
    }
    if (sp.status !== 'pending') {
      return c.json({ error: 'Product is not in pending status' }, 400)
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
    const supplierId = sp.seller
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
        images: sp.images ?? [],
        price: sp.price,
        originalPrice: sp.originalPrice,
        moq: sp.moq,
        stock: sp.stock ?? 0,
        unit: sp.unit ?? 'piece',
        categoryId,
        supplierId,
        featured: false,
        isNew: true,
        tags: sp.tags ?? [],
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
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        publishedProductId: newProduct.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.sellerProducts.id, id))

    return c.json({ success: true, publishedProductId: newProduct.id })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to approve product' }, 500)
  }
})

// POST /admin/products/:id/decline
router.post('/:id/decline', async (c) => {
  try {
    const admin = c.get('admin')!
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid product id' }, 400)
    }

    const body = await c.req.json()
    const data = z
      .object({
        reason: z.string().min(1, 'Reason is required'),
      })
      .parse(body)

    const sp = await db.query.sellerProducts.findFirst({
      where: eq(schema.sellerProducts.id, id),
    })

    if (!sp) {
      return c.json({ error: 'Seller product not found' }, 404)
    }
    if (sp.deletedAt) {
      return c.json({ error: 'Product was deleted by seller' }, 400)
    }
    if (sp.status !== 'pending') {
      return c.json({ error: 'Product is not in pending status' }, 400)
    }

    await db
      .update(schema.sellerProducts)
      .set({
        status: 'declined',
        adminNotes: data.reason,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.sellerProducts.id, id))

    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to decline product' }, 500)
  }
})

// POST /admin/products/:id/restore
router.post('/:id/restore', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)

    if (isNaN(id)) {
      return c.json({ error: 'Invalid product id' }, 400)
    }

    const sp = await db.query.sellerProducts.findFirst({
      where: eq(schema.sellerProducts.id, id),
      columns: {
        id: true,
        deletedAt: true,
        publishedProductId: true,
      },
    })

    if (!sp) {
      return c.json({ error: 'Seller product not found' }, 404)
    }

    if (!sp.deletedAt) {
      return c.json({ error: 'Product is not deleted' }, 400)
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
        .where(eq(schema.sellerProducts.id, id))

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

    return c.json({ success: true, restoredStatus: 'draft' })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to restore product' }, 500)
  }
})

export default router
