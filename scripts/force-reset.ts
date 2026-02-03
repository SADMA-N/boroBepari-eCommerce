import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/borobepari';
const pool = new pg.Pool({ connectionString });
const db = drizzle(pool);

async function reset() {
  console.log('Force resetting DB...');
  try {
      await db.execute(sql`DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO public;`);
      console.log('DB Reset successfully.');
  } catch (e) {
      console.error(e);
  }
  process.exit(0);
}

reset();
