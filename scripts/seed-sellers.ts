import { db } from '@/db';
import { sellers, suppliers, rfqStatusEnum } from '@/db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

const sellersDataPath = path.join(process.cwd(), 'sellers-data.json');
const sellersData = JSON.parse(fs.readFileSync(sellersDataPath, 'utf-8'));

const SECRET = process.env.SELLER_AUTH_SECRET || 'seller-secret-key-change-in-production';

// Matches src/lib/seller-auth-server.ts
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');

async function seedSellers() {
  console.log('Seeding sellers (with SHA-256 auth compatibility)...');

  try {
    for (const sellerData of sellersData) {
      // 1. Create Supplier
      const supplierSlug = slugify(sellerData.businessName);
      const existingSupplier = await db.select().from(suppliers).where(eq(suppliers.slug, supplierSlug)).limit(1);
      
      let supplierId: number;

      if (existingSupplier.length > 0) {
        supplierId = existingSupplier[0].id;
      } else {
        const [insertedSupplier] = await db.insert(suppliers).values({
          name: sellerData.businessName,
          slug: supplierSlug,
          verified: true,
          location: sellerData.contactDetails.address,
          yearsInBusiness: sellerData.yearsInBusiness,
          description: `${sellerData.businessType} specializing in ${sellerData.categories.join(', ')}`,
        }).returning({ id: suppliers.id });
        supplierId = insertedSupplier.id;
        console.log(`Created supplier: ${sellerData.businessName}`);
      }

      // 2. Create/Update Seller
      const existingSeller = await db.select().from(sellers).where(eq(sellers.email, sellerData.contactDetails.email)).limit(1);
      const hashedPassword = await hashPassword('password123');

      if (existingSeller.length > 0) {
        // Update password and supplier link to ensure login works
        await db.update(sellers).set({ 
            password: hashedPassword,
            supplierId: supplierId 
        }).where(eq(sellers.email, sellerData.contactDetails.email));
        console.log(`Updated seller ${sellerData.contactDetails.email} (password synced)`);
      } else {
        await db.insert(sellers).values({
          id: sellerData.id,
          email: sellerData.contactDetails.email,
          password: hashedPassword,
          businessName: sellerData.businessName,
          phone: sellerData.contactDetails.phone,
          kycStatus: 'approved',
          verificationBadge: 'verified',
          supplierId: supplierId,
          businessType: sellerData.businessType,
          tradeLicenseNumber: sellerData.kycInformation.tradeLicenseNumber,
          businessCategory: sellerData.categories[0],
          yearsInBusiness: sellerData.yearsInBusiness,
          address: sellerData.contactDetails.address,
          emailVerified: true,
          kycSubmittedAt: new Date(),
          kycDocuments: {},
          kycAdditionalInfo: {
            description: `Leading ${sellerData.businessType} in Bangladesh.`,
            categories: sellerData.categories,
            inventoryRange: "100-10000 units"
          },
        });
        console.log(`Created seller account: ${sellerData.contactDetails.email}`);
      }
    }
    console.log('Sellers seeded successfully!');
  } catch (error) {
    console.error('Error seeding sellers:', error);
    process.exit(1);
  }
}

seedSellers();
