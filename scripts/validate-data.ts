import { db } from '@/db';
import { products, sellers, suppliers, categories } from '@/db/schema';
import { eq, count } from 'drizzle-orm';

async function validateData() {
  console.log("Starting data validation...\n");
  let errors: string[] = [];
  let warnings: string[] = [];

  try {
    // 1. Fetch Data
    const allSellers = await db.select().from(sellers);
    const allProducts = await db.select().from(products);
    const allSuppliers = await db.select().from(suppliers);
    const allCategories = await db.select().from(categories);

    const supplierMap = new Map(allSuppliers.map(s => [s.id, s]));
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));

    // 2. Validate Sellers & Product Counts
    console.log("Checking Seller Product Counts...");
    for (const seller of allSellers) {
      if (!seller.supplierId) {
        errors.push(`Seller ${seller.email} has no linked Supplier ID.`);
        continue;
      }

      const sellerProducts = allProducts.filter(p => p.supplierId === seller.supplierId);
      if (sellerProducts.length < 3) {
        warnings.push(`Seller ${seller.businessName} (ID: ${seller.id}) has only ${sellerProducts.length} products (Expected 3+).`);
      }
    }

    // 3. Validate Products
    console.log("Checking Products...");
    for (const product of allProducts) {
      // Images
      const images = product.images as string[];
      if (!Array.isArray(images) || images.length < 3) {
        errors.push(`Product "${product.name}" (ID: ${product.id}) has fewer than 3 images.`);
      }

      // Description
      if (!product.description || product.description.length < 10) {
        errors.push(`Product "${product.name}" (ID: ${product.id}) has missing or too short description.`);
      }

      // Specifications
      const specs = product.specifications as any[];
      if (!Array.isArray(specs) || specs.length === 0) {
        warnings.push(`Product "${product.name}" (ID: ${product.id}) has no specifications.`);
      }

      // Foreign Keys (Category)
      if (!product.categoryId || !categoryMap.has(product.categoryId)) {
        errors.push(`Product "${product.name}" (ID: ${product.id}) has invalid category ID: ${product.categoryId}`);
      }

      // Foreign Keys (Supplier)
      if (!product.supplierId || !supplierMap.has(product.supplierId)) {
        errors.push(`Product "${product.name}" (ID: ${product.id}) has invalid supplier ID: ${product.supplierId}`);
      }

      // Stock
      if (typeof product.stock !== 'number' || product.stock < 0) {
        errors.push(`Product "${product.name}" (ID: ${product.id}) has invalid stock level: ${product.stock}`);
      } else if (product.stock < 10) {
        warnings.push(`Product "${product.name}" (ID: ${product.id}) has low stock: ${product.stock}`);
      }

      // Tiered Pricing
      const pricing = product.tieredPricing as any[];
      if (!Array.isArray(pricing) || pricing.length === 0) {
        warnings.push(`Product "${product.name}" (ID: ${product.id}) has no tiered pricing.`);
      } else {
        for (const tier of pricing) {
          if (typeof tier.minQty !== 'number' || typeof tier.price !== 'number') {
            errors.push(`Product "${product.name}" (ID: ${product.id}) has invalid tiered pricing structure.`);
            break;
          }
        }
      }
    }

    // 4. Report
    console.log("\nValidation Report:");
    console.log(`Total Sellers: ${allSellers.length}`);
    console.log(`Total Products: ${allProducts.length}`);
    console.log(`Total Suppliers: ${allSuppliers.length}`);
    console.log(`Total Categories: ${allCategories.length}`);
    console.log("-".repeat(30));

    if (errors.length > 0) {
      console.log(`\n❌ Found ${errors.length} Errors:`);
      errors.forEach(e => console.error(` - ${e}`));
    } else {
      console.log("\n✅ No critical errors found.");
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️ Found ${warnings.length} Warnings:`);
      warnings.forEach(w => console.warn(` - ${w}`));
    } else {
      console.log("\n✅ No warnings found.");
    }

    if (errors.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error("Validation failed with exception:", error);
    process.exit(1);
  }
}

validateData();
