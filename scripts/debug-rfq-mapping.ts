import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import * as schema from '../src/db/schema'

async function debug() {
  console.log('--- SUPPLIER 21 ---')
  const supplier21 = await db.query.suppliers.findFirst({
    where: eq(schema.suppliers.id, 21)
  })
  console.log(supplier21)
}

debug().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); })
