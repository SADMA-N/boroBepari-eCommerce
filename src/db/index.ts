import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.ts'
import { env } from '@/env'

if (env.DATABASE_URL) {
  const url = new URL(env.DATABASE_URL)
  console.log(`DB Connection: ${url.host}${url.pathname}`)
}

export const db = drizzle(env.DATABASE_URL, { schema })
