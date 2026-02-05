import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from '@/env'
import * as schema from './schema.ts'

if (env.DATABASE_URL) {
  const url = new URL(env.DATABASE_URL)
  console.log(`DB Connection: ${url.host}${url.pathname}`)
}

export const db = drizzle(env.DATABASE_URL, { schema })
