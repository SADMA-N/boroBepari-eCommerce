import { Hono } from 'hono'
import { z } from 'zod'
import { and, desc, eq, ilike, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { products, sellerProducts } from '@/db/schema'

function mapProduct(row: any): any {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    images: (row.images as Array<string> | null) ?? [],
    price: parseFloat(row.price),
    originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
    moq: row.moq,
    stock: row.stock ?? 0,
    unit: row.unit ?? 'piece',
    supplierId: row.supplierId ?? 0,
    supplierName: row.supplier?.name ?? 'Unknown',
    supplierVerified: row.supplier?.verified ?? false,
    featured: row.featured ?? false,
    isNew: row.isNew ?? false,
    rating: row.rating ? parseFloat(row.rating) : 0,
    reviewCount: row.reviewCount ?? 0,
    soldCount: row.soldCount ?? 0,
  }
}

function mapProductDetail(row: any): any {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    images: (row.images as Array<string> | null) ?? [],
    price: parseFloat(row.price),
    originalPrice: row.originalPrice ? parseFloat(row.originalPrice) : null,
    moq: row.moq,
    stock: row.stock ?? 0,
    unit: row.unit ?? 'piece',
    supplierId: row.supplierId ?? 0,
    featured: row.featured ?? false,
    isNew: row.isNew ?? false,
    rating: row.rating ? parseFloat(row.rating) : 0,
    reviewCount: row.reviewCount ?? 0,
    soldCount: row.soldCount ?? 0,
    tags: (row.tags as Array<string> | null) ?? [],
    tieredPricing:
      (row.tieredPricing as Array<{ minQty: number; maxQty: number | null; price: number }> | null) ?? [],
    specifications:
      (row.specifications as Array<{ key: string; value: string }> | null) ?? [],
    hasSample: row.hasSample ?? false,
    samplePrice: row.samplePrice ? parseFloat(row.samplePrice) : null,
    supplier: row.supplier
      ? {
          id: row.supplier.id,
          name: row.supplier.name,
          slug: row.supplier.slug,
          logo: row.supplier.logo ?? '',
          verified: row.supplier.verified ?? false,
          location: row.supplier.location ?? '',
          responseRate: row.supplier.responseRate
            ? parseFloat(row.supplier.responseRate)
            : 0,
          onTimeDelivery: row.supplier.onTimeDelivery
            ? parseFloat(row.supplier.onTimeDelivery)
            : 0,
          yearsInBusiness: row.supplier.yearsInBusiness ?? 0,
          description: row.supplier.description ?? '',
        }
      : null,
  }
}

const router = new Hono().basePath('/products')

// GET /products/featured
router.get('/featured', async (c) => {
  try {
    const limitParam = c.req.query('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 12

    const rows = await db.query.products.findMany({
      where: and(eq(products.featured, true), isNull(products.deletedAt)),
      with: { supplier: true },
      limit,
    })

    return c.json(rows.map(mapProduct))
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch featured products' }, 500)
  }
})

// GET /products/new-arrivals
router.get('/new-arrivals', async (c) => {
  try {
    const limitParam = c.req.query('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 12

    const rows = await db.query.products.findMany({
      where: and(eq(products.isNew, true), isNull(products.deletedAt)),
      with: { supplier: true },
      limit,
    })

    return c.json(rows.map(mapProduct))
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch new arrivals' }, 500)
  }
})

// GET /products/top-ranking
router.get('/top-ranking', async (c) => {
  try {
    const limitParam = c.req.query('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 12

    const rows = await db.query.products.findMany({
      where: isNull(products.deletedAt),
      orderBy: [desc(products.soldCount)],
      with: { supplier: true },
      limit,
    })

    return c.json(rows.map(mapProduct))
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch top ranking products' }, 500)
  }
})

// GET /products/suggestions
router.get('/suggestions', async (c) => {
  try {
    const query = c.req.query('query')
    if (!query) {
      return c.json({ error: 'query parameter is required' }, 400)
    }

    const parsed = z.object({ query: z.string().min(1) }).parse({ query })
    const escaped = parsed.query.replace(/[%_]/g, '\\$&')

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        images: products.images,
        price: products.price,
      })
      .from(products)
      .where(and(ilike(products.name, `${escaped}%`), isNull(products.deletedAt)))
      .limit(6)

    return c.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        image: (r.images as Array<string> | null)?.[0] ?? null,
        price: parseFloat(r.price),
      })),
    )
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch suggestions' }, 500)
  }
})

// GET /products/search
router.get('/search', async (c) => {
  try {
    const raw = c.req.query()
    const params = z
      .object({
        query: z.string().optional(),
        categoryId: z.coerce.number().optional(),
        minPrice: z.coerce.number().optional(),
        maxPrice: z.coerce.number().optional(),
        featured: z.coerce.boolean().optional(),
        isNew: z.coerce.boolean().optional(),
        sortBy: z.string().optional(),
        limit: z.coerce.number().optional(),
      })
      .parse(raw)

    const conditions = [isNull(products.deletedAt)]

    if (params.query) {
      conditions.push(ilike(products.name, `%${params.query}%`))
    }
    if (params.categoryId) {
      conditions.push(eq(products.categoryId, params.categoryId))
    }
    if (params.featured) {
      conditions.push(eq(products.featured, true))
    }
    if (params.isNew) {
      conditions.push(eq(products.isNew, true))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db.query.products.findMany({
      where: whereClause,
      with: { supplier: true },
      limit: params.limit || 50,
      orderBy:
        params.sortBy === 'price-asc'
          ? [sql`${products.price} ASC`]
          : params.sortBy === 'price-desc'
            ? [desc(products.price)]
            : params.sortBy === 'newest'
              ? [desc(products.createdAt)]
              : params.sortBy === 'popularity'
                ? [desc(products.soldCount)]
                : [desc(products.createdAt)],
    })

    return c.json(rows.map(mapProduct))
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to search products' }, 500)
  }
})

// GET /products/:slug
router.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')

    const row = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), isNull(products.deletedAt)),
      with: { supplier: true },
    })

    if (!row) {
      return c.json({ error: 'Product not found' }, 404)
    }

    const product = mapProductDetail(row)

    // Fallback: if no supplier, look up seller info via seller_products -> sellers
    if (!product.supplier) {
      const sp = await db.query.sellerProducts.findFirst({
        where: eq(sellerProducts.publishedProductId, row.id),
        with: { seller: true },
      })
      if (sp?.seller) {
        const seller = sp.seller
        const kycInfo = seller.kycAdditionalInfo as { description?: string } | null
        product.supplier = {
          id: 0,
          name: seller.businessName,
          slug: '',
          logo: '',
          verified:
            seller.verificationBadge === 'verified' ||
            seller.verificationBadge === 'premium',
          location: seller.city ?? seller.address ?? '',
          responseRate: 0,
          onTimeDelivery: 0,
          yearsInBusiness: seller.yearsInBusiness ?? 0,
          description: kycInfo?.description ?? '',
        }
      }
    }

    return c.json(product)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to fetch product' }, 500)
  }
})

export default router
