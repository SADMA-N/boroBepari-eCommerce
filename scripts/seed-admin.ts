import { db } from '../src/db'
import * as schema from '../src/db/schema'

const SECRET =
  process.env.ADMIN_AUTH_SECRET || 'admin-secret-key-change-in-production'

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + SECRET)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function seedAdmin() {
  console.log('Seeding default admin...')

  const email = 'admin@borobepari.com'
  const password = 'admin123456'
  const hashedPassword = await hashPassword(password)

  const existing = await db.query.admins.findFirst({
    where: (admins, { eq }) => eq(admins.email, email),
  })

  if (existing) {
    console.log('Admin already exists.')
  } else {
    await db.insert(schema.admins).values({
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin',
      isActive: true,
    })
    console.log('Admin seeded successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('2FA Code: 123456 (default)')
  }

  process.exit(0)
}

seedAdmin()
