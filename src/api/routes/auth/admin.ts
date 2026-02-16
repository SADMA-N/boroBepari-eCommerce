import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { verifyAdminToken } from '@/lib/admin-auth-server'
import { optionalAdminAuth } from '@/api/middleware/admin-auth'
import { db } from '@/db'
import * as schema from '@/db/schema'
import type { AdminUser } from '@/types/admin'

const SECRET = process.env.ADMIN_AUTH_SECRET || 'admin-secret-key-change-in-production'
const ADMIN_2FA_CODE = process.env.ADMIN_2FA_CODE || '123456'
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000
const loginAttempts = new Map<string, { count: number; firstAttempt: number }>()

function generateToken(adminId: string): string {
  const payload = {
    adminId,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = Buffer.from(SECRET + encoded)
    .toString('base64')
    .slice(0, 32)
  return `${encoded}.${signature}`
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + SECRET)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

const router = new Hono().basePath('/auth/admin')

// POST /login
router.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, otp } = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
      otp: z.string().min(6, '2FA code is required'),
    }).parse(body)

    // Rate limiting check
    const now = Date.now()
    const key = email.toLowerCase()
    const attempt = loginAttempts.get(key)
    if (
      attempt &&
      now - attempt.firstAttempt < LOGIN_WINDOW_MS &&
      attempt.count >= MAX_LOGIN_ATTEMPTS
    ) {
      return c.json({ error: 'Too many login attempts. Please try again later.' }, 429)
    }

    const admin = await db.query.admins.findFirst({
      where: eq(schema.admins.email, email.toLowerCase()),
    })

    if (!admin) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    if (!admin.isActive) {
      return c.json({ error: 'Account is deactivated' }, 403)
    }

    // Verify 2FA
    if (otp !== ADMIN_2FA_CODE) {
      const next =
        attempt && now - attempt.firstAttempt < LOGIN_WINDOW_MS
          ? { count: attempt.count + 1, firstAttempt: attempt.firstAttempt }
          : { count: 1, firstAttempt: now }
      loginAttempts.set(key, next)
      return c.json({ error: 'Invalid 2FA code' }, 401)
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password)
    if (!isValid) {
      const next =
        attempt && now - attempt.firstAttempt < LOGIN_WINDOW_MS
          ? { count: attempt.count + 1, firstAttempt: attempt.firstAttempt }
          : { count: 1, firstAttempt: now }
      loginAttempts.set(key, next)
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    // Clear login attempts on success
    loginAttempts.delete(key)

    // Update last login
    await db
      .update(schema.admins)
      .set({ lastLoginAt: new Date() })
      .where(eq(schema.admins.id, admin.id))

    const token = generateToken(admin.id)

    const adminUser: AdminUser = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      lastLoginAt: new Date().toISOString(),
    }

    return c.json({ admin: adminUser, token })
  } catch (error: any) {
    return c.json({ error: error.message || 'Login failed' }, 500)
  }
})

// GET /session
router.get('/session', optionalAdminAuth, async (c) => {
  const admin = c.get('admin')
  return c.json({ admin })
})

// POST /validate-token
router.post('/validate-token', async (c) => {
  try {
    const body = await c.req.json()
    const { token } = z.object({
      token: z.string(),
    }).parse(body)

    const decoded = verifyAdminToken(token)
    if (!decoded) {
      return c.json({ valid: false, admin: null })
    }

    const admin = await db.query.admins.findFirst({
      where: eq(schema.admins.id, decoded.adminId),
    })

    if (!admin || !admin.isActive) {
      return c.json({ valid: false, admin: null })
    }

    const adminUser: AdminUser = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      lastLoginAt: admin.lastLoginAt?.toISOString() || null,
    }

    return c.json({ valid: true, admin: adminUser })
  } catch (error: any) {
    return c.json({ error: error.message || 'Token validation failed' }, 500)
  }
})

// POST /create
router.post('/create', async (c) => {
  try {
    const body = await c.req.json()
    const { email, password, name, role, creatorToken } = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      role: z.enum(['super_admin', 'admin', 'moderator']),
      creatorToken: z.string(),
    }).parse(body)

    // Verify creator is super_admin
    const decoded = verifyAdminToken(creatorToken)
    if (!decoded) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const creator = await db.query.admins.findFirst({
      where: eq(schema.admins.id, decoded.adminId),
    })

    if (!creator || creator.role !== 'super_admin') {
      return c.json({ error: 'Only super admins can create new admins' }, 403)
    }

    // Check if email exists
    const existing = await db.query.admins.findFirst({
      where: eq(schema.admins.email, email.toLowerCase()),
    })

    if (existing) {
      return c.json({ error: 'Email already exists' }, 400)
    }

    const hashedPassword = await hashPassword(password)
    const id = crypto.randomUUID()

    await db.insert(schema.admins).values({
      id,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role,
    })

    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to create admin' }, 500)
  }
})

export default router
