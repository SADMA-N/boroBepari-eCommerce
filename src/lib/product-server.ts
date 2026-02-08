import { createServerFn } from '@tanstack/react-start'
import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { products, suppliers } from '@/db/schema'

export interface ProductWithSupplier {
  id: number
  name: string
  slug: string
  images: string[]
  price: number
  originalPrice: number | null
  moq: number
  stock: number
  unit: string
  supplierId: number
  supplierName: string
  supplierVerified: boolean
  featured: boolean
  isNew: boolean
  rating: number
  reviewCount: number
  soldCount: number
}

export interface SupplierDisplay {
  id: number
  name: string
  slug: string
  logo: string
  verified: boolean
  location: string
  responseRate: number
  onTimeDelivery: number
  yearsInBusiness: number
  description: string
}

export interface TieredPrice {
  minQty: number
  maxQty: number | null
  price: number
}

export interface Specification {
  key: string
  value: string
}

export interface ProductDetailWithSupplier {
  id: number
  name: string
  slug: string
  description: string
  images: string[]
  price: number
  originalPrice: number | null
  moq: number
  stock: number
  unit: string
  supplierId: number
  featured: boolean
  isNew: boolean
  rating: number
  reviewCount: number
  soldCount: number
  tags: string[]
  tieredPricing: TieredPrice[]
  specifications: Specification[]
  hasSample: boolean
  samplePrice: number | null
  supplier: SupplierDisplay | null
}

function mapProduct(row: {
  id: number
  name: string
  slug: string
  images: unknown
  price: string
  originalPrice: string | null
  moq: number
  stock: number | null
  unit: string | null
  supplierId: number | null
  featured: boolean | null
  isNew: boolean | null
  rating: string | null
  reviewCount: number | null
  soldCount: number | null
  supplier: { name: string; verified: boolean | null } | null
}): ProductWithSupplier {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    images: (row.images as string[]) ?? [],
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

export const getFeaturedProducts = createServerFn({ method: 'GET' })
  .inputValidator((limit: number) => limit)
  .handler(async ({ data: limit }) => {
    const rows = await db.query.products.findMany({
      where: eq(products.featured, true),
      with: { supplier: true },
      limit,
    })
    return rows.map(mapProduct)
  })

export const getNewArrivals = createServerFn({ method: 'GET' })
  .inputValidator((limit: number) => limit)
  .handler(async ({ data: limit }) => {
    const rows = await db.query.products.findMany({
      where: eq(products.isNew, true),
      with: { supplier: true },
      limit,
    })
    return rows.map(mapProduct)
  })

export const getTopRanking = createServerFn({ method: 'GET' })
  .inputValidator((limit: number) => limit)
  .handler(async ({ data: limit }) => {
    const rows = await db.query.products.findMany({
      orderBy: [desc(products.soldCount)],
      with: { supplier: true },
      limit,
    })
    return rows.map(mapProduct)
  })

export const getVerifiedSuppliersList = createServerFn({ method: 'GET' }).handler(
  async () => {
    const rows = await db.query.suppliers.findMany({
      where: eq(suppliers.verified, true),
    })
    return rows.map(
      (s): SupplierDisplay => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logo: s.logo ?? '',
        verified: s.verified ?? false,
        location: s.location ?? '',
        responseRate: s.responseRate ? parseFloat(s.responseRate) : 0,
        onTimeDelivery: s.onTimeDelivery ? parseFloat(s.onTimeDelivery) : 0,
        yearsInBusiness: s.yearsInBusiness ?? 0,
        description: s.description ?? '',
      }),
    )
  },
)

function mapProductDetail(row: {
  id: number
  name: string
  slug: string
  description: string | null
  images: unknown
  price: string
  originalPrice: string | null
  moq: number
  stock: number | null
  unit: string | null
  supplierId: number | null
  featured: boolean | null
  isNew: boolean | null
  rating: string | null
  reviewCount: number | null
  soldCount: number | null
  tags: unknown
  tieredPricing: unknown
  specifications: unknown
  hasSample: boolean | null
  samplePrice: string | null
  supplier: {
    id: number
    name: string
    slug: string
    logo: string | null
    verified: boolean | null
    location: string | null
    responseRate: string | null
    onTimeDelivery: string | null
    yearsInBusiness: number | null
    description: string | null
  } | null
}): ProductDetailWithSupplier {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? '',
    images: (row.images as string[]) ?? [],
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
    tags: (row.tags as string[]) ?? [],
    tieredPricing: (row.tieredPricing as TieredPrice[]) ?? [],
    specifications: (row.specifications as Specification[]) ?? [],
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

export const getProductBySlug = createServerFn({ method: 'POST' })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }) => {
    const row = await db.query.products.findFirst({
      where: eq(products.slug, slug),
      with: { supplier: true },
    })
    if (!row) return null
    return mapProductDetail(row)
  })

export const searchProducts = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      query: z.string().optional(),
      categoryId: z.number().optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      sortBy: z.string().optional(),
      limit: z.number().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const conditions = []

    if (data.query) {
      conditions.push(ilike(products.name, `%${data.query}%`))
    }
    if (data.categoryId) {
      conditions.push(eq(products.categoryId, data.categoryId))
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined

    const rows = await db.query.products.findMany({
      where: whereClause,
      with: { supplier: true },
      limit: data.limit || 50,
      orderBy: data.sortBy === 'price-asc'
        ? [sql`${products.price} ASC`]
        : data.sortBy === 'price-desc'
          ? [desc(products.price)]
          : data.sortBy === 'newest'
            ? [desc(products.createdAt)]
            : data.sortBy === 'popularity'
              ? [desc(products.soldCount)]
              : [desc(products.createdAt)],
    })

    return rows.map(mapProduct)
  })

export const formatBDT = (price: number): string => {
  return `\u09F3${price.toLocaleString('en-BD')}`
}
