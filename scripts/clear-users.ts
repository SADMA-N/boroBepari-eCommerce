
import { db } from "../src/db";
import * as schema from "../src/db/schema";

async function main() {
  console.log("Cleaning up all user-related data...");
  
  try {
    // Delete in order to respect foreign key constraints
    console.log("Deleting login events...");
    await db.delete(schema.loginEvents);
    
    console.log("Deleting sessions...");
    await db.delete(schema.session);
    
    console.log("Deleting accounts...");
    await db.delete(schema.account);
    
    console.log("Deleting users...");
    await db.delete(schema.user);
    
    console.log("Successfully cleared all users and related data.");
  } catch (error) {
    console.error("Failed to clear users:", error);
  } finally {
    process.exit(0);
  }
}

main();
