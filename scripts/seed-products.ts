
import { db } from '@/db';
import { products, sellerProducts, categories, suppliers, sellers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const catalogPath = path.join(process.cwd(), 'products-catalog.json');
const imagesPath = path.join(process.cwd(), 'product-images.json');

const productsCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
const productImages = JSON.parse(fs.readFileSync(imagesPath, 'utf-8'));

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

async function seedProducts() {
  console.log('Seeding products...');

  try {
    // 1. Fetch Categories Map
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map<string, number>();
    const subCategoryMap = new Map<string, number>();

    allCategories.forEach((cat) => {
      categoryMap.set(slugify(cat.name), cat.id);
      if (cat.parentId) {
         // It's a subcategory
         subCategoryMap.set(slugify(cat.name), cat.id);
      }
    });

    // 2. Fetch Sellers Map to get Supplier IDs
    const allSellers = await db.select().from(sellers);
    const sellerSupplierMap = new Map<string, number>(); // sellerId (text) -> supplierId (int)
    
    allSellers.forEach(s => {
        if (s.supplierId) {
            sellerSupplierMap.set(s.id, s.supplierId);
        }
    });

    for (const product of productsCatalog) {
      const slug = slugify(product.name);
      
      // Get category ID
      // Try subcategory first, then main category
      const subCatSlug = slugify(product.subCategory);
      const mainCatSlug = slugify(product.category);
      
      let categoryId = subCategoryMap.get(subCatSlug);
      if (!categoryId) {
        categoryId = categoryMap.get(mainCatSlug);
      }
      
      if (!categoryId) {
        console.warn(`Category not found for product: ${product.name} (${product.category}/${product.subCategory})`);
        continue;
      }

      // Get Supplier ID
      const supplierId = sellerSupplierMap.get(product.sellerId);
      if (!supplierId) {
        console.warn(`Supplier not found for seller ID: ${product.sellerId}`);
        continue;
      }

      // Get Images
      // The image map keys are slugs of the name
      const images = productImages[slug] || [];

      // Check if product exists (by slug)
      const existingProduct = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
      
      if (existingProduct.length > 0) {
        console.log(`Product ${slug} already exists, updating images.`);
        await db.update(products).set({ images }).where(eq(products.slug, slug));
        await db.update(sellerProducts).set({ images }).where(eq(sellerProducts.slug, slug));
        continue;
      }

      // 1. Insert into Products (Published)
      // Note: In a real flow, you might insert into seller_products first, then publish.
      // But for seeding, we want the published product immediately.
      const [publishedProduct] = await db.insert(products).values({
        name: product.name,
        slug: slug,
        description: product.description,
        images: images,
        price: product.tieredPricing[0]?.price.toString() || "0", // Base price
        moq: product.moq,
        stock: Math.floor(Math.random() * (10000 - 100) + 100), // Random stock
        unit: product.unit,
        categoryId: categoryId,
        supplierId: supplierId,
        featured: Math.random() > 0.8, // 20% featured
        isNew: Math.random() > 0.7,
        rating: (Math.random() * (5 - 3.5) + 3.5).toFixed(1), // Random rating 3.5-5.0
        reviewCount: Math.floor(Math.random() * 50),
        soldCount: Math.floor(Math.random() * 500),
        tags: product.tags,
        tieredPricing: product.tieredPricing,
        specifications: Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) })),
        hasSample: false, // Default
      }).returning({ id: products.id });

      console.log(`Created product: ${product.name}`);

      // 2. Insert into Seller Products (Draft/Record)
      await db.insert(sellerProducts).values({
        sellerId: product.sellerId,
        name: product.name,
        slug: slug,
        price: product.tieredPricing[0]?.price.toString() || "0",
        moq: product.moq,
        status: 'accepted',
        publishedProductId: publishedProduct.id,
        mainCategory: product.category,
        subCategory: product.subCategory,
        description: product.description,
        images: images,
        tags: product.tags,
        tieredPricing: product.tieredPricing,
        specifications: Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) })),
        stock: Math.floor(Math.random() * (10000 - 100) + 100),
        unit: product.unit,
      });
    }

    console.log('Products seeded successfully!');

  } catch (error) {
    console.error('Error seeding products:', error);
    process.exit(1);
  }
}

seedProducts();
