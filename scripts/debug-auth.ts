
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import * as schema from "../src/db/schema";

async function main() {
  console.log("Debugging Auth Query...");
  
  const testUserId = "debug-user-" + Date.now();
  
  // 1. Create User
  await db.insert(schema.user).values({
    id: testUserId,
    name: "Debug User",
    email: `debug-${Date.now()}@example.com`,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  // 2. Create Google Account
  await db.insert(schema.account).values({
    id: "acc-" + Date.now(),
    userId: testUserId,
    providerId: "google",
    accountId: "google-123",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  console.log(`Created user ${testUserId} with Google account`);

  // 3. Run the query exactly as in auth.ts
  try {
      const accounts = await db.query.account.findMany({
        where: eq(schema.account.userId, testUserId)
      });
      
      console.log("Accounts found:", JSON.stringify(accounts, null, 2));
      
      const hasPassword = accounts.some(a => a.providerId === "credential");
      const isSocial = accounts.some(a => a.providerId !== "credential");
      
      console.log(`hasPassword: ${hasPassword}`);
      console.log(`isSocial: ${isSocial}`);
      console.log(`needsPassword: ${isSocial && !hasPassword}`);
      
  } catch (e) {
      console.error("Query failed:", e);
  }

  // Cleanup
  await db.delete(schema.account).where(eq(schema.account.userId, testUserId));
  await db.delete(schema.user).where(eq(schema.user.id, testUserId));
  
  process.exit(0);
}

main();
