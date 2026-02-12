
import { db } from '@/db';
import { products, sellerProducts } from '@/db/schema';
import { uploadToS3 } from '@/lib/s3';
import { eq, ilike } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const MANUAL_IMAGES_DIR = path.join(process.cwd(), 'manual_images');

async function attachImagesByName() {
  console.log("Starting manual image attachment...
");

  if (!fs.existsSync(MANUAL_IMAGES_DIR)) {
    console.error(`Directory ${MANUAL_IMAGES_DIR} does not exist.`);
    return;
  }

  const files = fs.readdirSync(MANUAL_IMAGES_DIR).filter(f => !f.startsWith('.'));

  if (files.length === 0) {
    console.log("No images found in 'manual_images/'.");
    console.log("Tip: Name your files exactly like the product name (e.g., 'Steel Angle Bar.jpg')");
    return;
  }

  for (const file of files) {
    const ext = path.extname(file);
    const name = path.basename(file, ext); // "Steel Angle Bar"
    const filePath = path.join(MANUAL_IMAGES_DIR, file);
    
    console.log(`Processing: ${file} -> Searching for product "${name}"...`);

    // Find product by name (case-insensitive)
    const product = await db.query.products.findFirst({
      where: ilike(products.name, name)
    });

    if (!product) {
      console.warn(`  ❌ Product not found for "${name}". Skipping.`);
      continue;
    }

    console.log(`  ✅ Found product ID: ${product.id} (${product.name})`);

    // Upload Image
    try {
      const buffer = fs.readFileSync(filePath);
      // Create a clean key: products/category-slug/product-slug/manual-timestamp.ext
      const timestamp = Date.now();
      const key = `product-images/manual-upload/${product.slug}/${timestamp}${ext}`;
      
      await uploadToS3(buffer, key, getMimeType(ext));
      
      const publicUrl = `/uploads/${key}`; // Assuming local fallback, update if S3 used
      
      // Update Database
      // We append the new image to the existing list
      const currentImages = (product.images as string[]) || [];
      const newImages = [...currentImages, publicUrl];

      await db.update(products)
        .set({ images: newImages })
        .where(eq(products.id, product.id));

      // Also update seller_products for consistency
      await db.update(sellerProducts)
        .set({ images: newImages })
        .where(eq(sellerProducts.slug, product.slug)); // match by slug usually safe

      console.log(`  ✨ Attached image! Total images: ${newImages.length}`);

    } catch (err) {
      console.error(`  ❌ Failed to upload/update:`, err);
    }
  }
  
  console.log("
Done!");
  process.exit(0);
}

function getMimeType(ext: string) {
  switch (ext.toLowerCase()) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}

attachImagesByName();
