import { db } from '@/db';
import { products, sellerProducts } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function checkProduct() {
  console.log('Checking Product ID 22...');

  // Check main products table
  const product = await db.select().from(products).where(eq(products.id, 22)).limit(1);
  if (product.length > 0) {
    console.log('--- Main Product (public) ---');
    console.log('ID:', product[0].id);
    console.log('Name:', product[0].name);
    console.log('Images:', JSON.stringify(product[0].images, null, 2));
    console.log('Supplier ID:', product[0].supplierId);
  } else {
    console.log('Product 22 not found in main products table.');
  }

  // Check seller_products table (drafts/edits)
  // Note: seller_products usually has its own ID, but sometimes it might reference the published ID. 
  // Let's check if there's a seller_product that *references* product 22 or has ID 22.
  
  const sellerProductById = await db.select().from(sellerProducts).where(eq(sellerProducts.id, 22)).limit(1);
  if (sellerProductById.length > 0) {
    console.log('
--- Seller Product (draft/edit) by ID 22 ---');
    console.log('ID:', sellerProductById[0].id);
    console.log('Name:', sellerProductById[0].name);
    console.log('Images:', JSON.stringify(sellerProductById[0].images, null, 2));
    console.log('Status:', sellerProductById[0].status);
    console.log('Published Product ID:', sellerProductById[0].publishedProductId);
  } else {
    console.log('
Seller Product with ID 22 not found.');
  }

  // If the user meant the *published* product 22 is being edited, find the seller_product linked to it.
  const sellerProductByPublishedId = await db.select().from(sellerProducts).where(eq(sellerProducts.publishedProductId, 22)).limit(1);
  if (sellerProductByPublishedId.length > 0) {
    console.log('
--- Seller Product (draft/edit) linked to Public Product 22 ---');
    console.log('ID:', sellerProductByPublishedId[0].id);
    console.log('Name:', sellerProductByPublishedId[0].name);
    console.log('Images:', JSON.stringify(sellerProductByPublishedId[0].images, null, 2));
    console.log('Status:', sellerProductByPublishedId[0].status);
  }

  process.exit(0);
}

checkProduct();
