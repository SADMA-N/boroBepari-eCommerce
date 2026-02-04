import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { AdminUser } from '@/types/admin'
import { db } from '@/db'
import * as schema from '@/db/schema'

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
  const signature = Buffer.from(SECRET + encoded).toString('base64').slice(0, 32)
  return `${encoded}.${signature}`
}

export function verifyAdminToken(token: string): { adminId: string } | null {
  try {
    const [encoded, signature] = token.split('.')
    const expectedSignature = Buffer.from(SECRET + encoded).toString('base64').slice(0, 32)

    if (signature !== expectedSignature) {
      return null
    }

    const payload = JSON.parse(Buffer.from(encoded, 'base64').toString())

    if (payload.exp < Date.now()) {
      return null
    }

    return { adminId: payload.adminId }
  } catch {
    return null
  }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + SECRET)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password)
  return passwordHash === hash
}

// Admin auth middleware
export const adminAuthMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    let adminUser: AdminUser | null = null

    try {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (token) {
        const decoded = verifyAdminToken(token)
        if (decoded) {
          const admin = await db.query.admins.findFirst({
            where: eq(schema.admins.id, decoded.adminId),
          })

          if (admin && admin.isActive) {
            adminUser = {
              id: admin.id,
              email: admin.email,
              name: admin.name,
              role: admin.role,
              avatar: admin.avatar,
              lastLoginAt: admin.lastLoginAt?.toISOString() || null,
            }
          }
        }
      }
    } catch (error) {
      console.error('Admin auth middleware error:', error)
    }

    return next({ context: { admin: adminUser, headers: request.headers } })
  },
)

// Admin login
export const adminLogin = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
      otp: z.string().min(6, '2FA code is required'),
    }),
  )
  .handler(async ({ data }) => {
    const { email, password, otp } = data

    const now = Date.now()
    const key = email.toLowerCase()
    const attempt = loginAttempts.get(key)
    if (attempt && now - attempt.firstAttempt < LOGIN_WINDOW_MS && attempt.count >= MAX_LOGIN_ATTEMPTS) {
      throw new Error('Too many login attempts. Please try again later.')
    }

    const admin = await db.query.admins.findFirst({
      where: eq(schema.admins.email, email.toLowerCase()),
    })

    if (!admin) {
      throw new Error('Invalid email or password')
    }

    if (!admin.isActive) {
      throw new Error('Account is deactivated')
    }

    if (otp !== ADMIN_2FA_CODE) {
      const next = attempt && now - attempt.firstAttempt < LOGIN_WINDOW_MS
        ? { count: attempt.count + 1, firstAttempt: attempt.firstAttempt }
        : { count: 1, firstAttempt: now }
      loginAttempts.set(key, next)
      throw new Error('Invalid 2FA code')
    }

    const isValid = await verifyPassword(password, admin.password)
    if (!isValid) {
      const next = attempt && now - attempt.firstAttempt < LOGIN_WINDOW_MS
        ? { count: attempt.count + 1, firstAttempt: attempt.firstAttempt }
        : { count: 1, firstAttempt: now }
      loginAttempts.set(key, next)
      throw new Error('Invalid email or password')
    }

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

    return { admin: adminUser, token }
  })

// Get current admin session
export const getAdminSession = createServerFn({ method: 'GET' })
  .middleware([adminAuthMiddleware])
  .handler(({ context }) => {
    return { admin: context.admin }
  })

// Validate admin token
export const validateAdminToken = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { token } = data

    const decoded = verifyAdminToken(token)
    if (!decoded) {
      return { valid: false, admin: null }
    }

    const admin = await db.query.admins.findFirst({
      where: eq(schema.admins.id, decoded.adminId),
    })

    if (!admin || !admin.isActive) {
      return { valid: false, admin: null }
    }

    const adminUser: AdminUser = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      avatar: admin.avatar,
      lastLoginAt: admin.lastLoginAt?.toISOString() || null,
    }

    return { valid: true, admin: adminUser }
  })

// Create admin (only super_admin can do this)
export const createAdmin = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      role: z.enum(['super_admin', 'admin', 'moderator']),
      creatorToken: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const { email, password, name, role, creatorToken } = data

    // Verify creator is super_admin
    const decoded = verifyAdminToken(creatorToken)
    if (!decoded) {
      throw new Error('Unauthorized')
    }

    const creator = await db.query.admins.findFirst({
      where: eq(schema.admins.id, decoded.adminId),
    })

    if (!creator || creator.role !== 'super_admin') {
      throw new Error('Only super admins can create new admins')
    }

    // Check if email exists
    const existing = await db.query.admins.findFirst({
      where: eq(schema.admins.email, email.toLowerCase()),
    })

    if (existing) {
      throw new Error('Email already exists')
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

    return { success: true }
  })
