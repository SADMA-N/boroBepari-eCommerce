
import fs from 'node:fs';
import path from 'node:path';
import { eq, inArray, notInArray } from 'drizzle-orm';
import { db } from '@/db';
import { products } from '@/db/schema';

const catalogPath = path.join(process.cwd(), 'products-catalog.json');
const productsCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));

// Slugify function to match what was used in seeding
const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

async function promoteNewProducts() {
  console.log('Promoting seeded products...');

  try {
    const seededSlugs = productsCatalog.map((p: any) => slugify(p.name));
    
    if (seededSlugs.length === 0) {
        console.error("No products found in catalog!");
        return;
    }

    // 1. Feature Seeded Products
    await db.update(products)
      .set({ featured: true, isNew: true })
      .where(inArray(products.slug, seededSlugs));
      
    console.log(`Marked ${seededSlugs.length} seeded products as Featured & New.`);

    // 2. Unfeature Legacy Products
    await db.update(products)
      .set({ featured: false, isNew: false })
      .where(notInArray(products.slug, seededSlugs));
      
    console.log('Unfeatured all legacy products.');

  } catch (error) {
    console.error('Error promoting products:', error);
  }
  process.exit(0);
}

promoteNewProducts();
