
import { db } from '@/db';
import { products, sellers, suppliers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

async function debugProducts() {
  console.log("Debugging Products with Relational Query...\n");

  try {
    // 1. Test getFeaturedProducts logic
    console.log("Fetching Featured Products via db.query...");
    
    // Check if db.query.products exists
    if (!db.query || !db.query.products) {
        console.error("Error: db.query.products is undefined. Schema might not be loaded correctly.");
        return;
    }

    const featured = await db.query.products.findMany({
      where: eq(products.featured, true),
      with: { supplier: true },
      limit: 12,
    });

    console.log(`Featured Count: ${featured.length}`);
    if (featured.length > 0) {
        console.log("Sample Featured:", {
            id: featured[0].id,
            name: featured[0].name,
            supplier: featured[0].supplier
        });
    }

    // 2. Test getNewArrivals logic
    console.log("\nFetching New Arrivals...");
    const newArrivals = await db.query.products.findMany({
      where: eq(products.isNew, true),
      with: { supplier: true },
      limit: 12,
    });
    console.log(`New Arrivals Count: ${newArrivals.length}`);

    // 3. Test Top Ranking
    console.log("\nFetching Top Ranking...");
    const topRanking = await db.query.products.findMany({
      orderBy: [desc(products.soldCount)],
      with: { supplier: true },
      limit: 12,
    });
    console.log(`Top Ranking Count: ${topRanking.length}`);

  } catch (error) {
    console.error("Error debugging products:", error);
  }
  process.exit(0);
}

debugProducts();
