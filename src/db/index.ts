import { drizzle } from 'drizzle-orm/node-postgres'

import * as schema from './schema.ts'

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL)
  console.log(`DB Connection: ${url.host}${url.pathname}`)
} else {
  console.log('DATABASE_URL is missing!')
}

export const db = drizzle(process.env.DATABASE_URL!, { schema })
