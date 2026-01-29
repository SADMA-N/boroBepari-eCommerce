import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema.ts'

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing!");
}

const url = new URL(process.env.DATABASE_URL);
console.log(`DB Connection: ${url.protocol}//${url.username}:***@${url.host}${url.pathname}`);

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema })
