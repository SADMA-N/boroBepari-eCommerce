import { db } from '../src/db'
import * as schema from '../src/db/schema'

async function checkAdmins() {
  const admins = await db.query.admins.findMany()
  console.log('Admins in DB:', admins.map(a => ({ email: a.email, name: a.name, role: a.role })))
  process.exit(0)
}

checkAdmins()
