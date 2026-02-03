import { db } from '../src/db'
import { categories, products, suppliers } from '../src/db/schema'
import { mockCategories, mockProducts, mockSuppliers } from '../src/data/mock-products'
import { sql } from 'drizzle-orm'

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // 1. Clear existing data (optional, be careful in prod)
    // Using TRUNCATE CASCADE to clear dependent tables
    console.log('Cleaning up old data...')
    await db.execute(sql`TRUNCATE TABLE ${products} RESTART IDENTITY CASCADE`)
    await db.execute(sql`TRUNCATE TABLE ${suppliers} RESTART IDENTITY CASCADE`)
    await db.execute(sql`TRUNCATE TABLE ${categories} RESTART IDENTITY CASCADE`)

    // 2. Insert Categories
    console.log(`Inserting ${mockCategories.length} categories...`)
    await db.insert(categories).values(mockCategories.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      icon: c.icon,
      parentId: c.parentId
    })))
    
    // Reset sequence for categories if needed, but since we insert with IDs, Postgres might need sequence update
    await db.execute(sql`SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))`)

    // 3. Insert Suppliers
    console.log(`Inserting ${mockSuppliers.length} suppliers...`)
    await db.insert(suppliers).values(mockSuppliers.map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      logo: s.logo,
      verified: s.verified,
      location: s.location,
      responseRate: s.responseRate.toString(),
      onTimeDelivery: s.onTimeDelivery.toString(),
      yearsInBusiness: s.yearsInBusiness,
      description: s.description
    })))
    await db.execute(sql`SELECT setval('suppliers_id_seq', (SELECT MAX(id) FROM suppliers))`)

    // 4. Insert Products
    console.log(`Inserting ${mockProducts.length} products...`)
    // Batch insert to avoid query size limits
    const batchSize = 50
    for (let i = 0; i < mockProducts.length; i += batchSize) {
      const batch = mockProducts.slice(i, i + batchSize)
      await db.insert(products).values(batch.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        images: p.images,
        price: p.price.toString(),
        originalPrice: p.originalPrice?.toString(),
        moq: p.moq,
        stock: p.stock,
        unit: p.unit,
        categoryId: p.categoryId,
        supplierId: p.supplierId,
        featured: p.featured,
        isNew: p.isNew,
        rating: p.rating.toString(),
        reviewCount: p.reviewCount,
        soldCount: p.soldCount,
        tags: p.tags,
      })))
    }
    await db.execute(sql`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products))`)

    console.log('✅ Seeding complete!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
