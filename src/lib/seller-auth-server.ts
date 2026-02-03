import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import * as schema from '@/db/schema'
import type { SellerUser } from '@/types/seller'

// Simple JWT-like token generation and verification
// In production, use a proper JWT library like jose
const SECRET = process.env.SELLER_AUTH_SECRET || 'seller-secret-key-change-in-production'

function generateToken(sellerId: string): string {
  const payload = {
    sellerId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = Buffer.from(SECRET + encoded).toString('base64').slice(0, 32)
  return `${encoded}.${signature}`
}

function verifyToken(token: string): { sellerId: string } | null {
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

    return { sellerId: payload.sellerId }
  } catch {
    return null
  }
}

// Simple password hashing (in production, use bcrypt or argon2)
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

// Seller auth middleware - extracts seller from token in Authorization header
export const sellerAuthMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    let sellerUser: SellerUser | null = null

    try {
      const authHeader = request.headers.get('Authorization')
      const token = authHeader?.replace('Bearer ', '')

      if (token) {
        const decoded = verifyToken(token)
        if (decoded) {
          const seller = await db.query.sellers.findFirst({
            where: eq(schema.sellers.id, decoded.sellerId),
          })

          if (seller) {
            sellerUser = {
              id: seller.id,
              businessName: seller.businessName,
              email: seller.email,
              phone: seller.phone,
              kycStatus: seller.kycStatus,
              verificationBadge: seller.verificationBadge,
            }
          }
        }
      }
    } catch (error) {
      console.error('Seller auth middleware error:', error)
    }

    return next({ context: { seller: sellerUser, headers: request.headers } })
  },
)

// Register a new seller
export const sellerRegister = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      businessName: z.string().min(2, 'Business name must be at least 2 characters'),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      phone: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const { businessName, email, password, phone } = data

    // Check if seller already exists
    const existing = await db.query.sellers.findFirst({
      where: eq(schema.sellers.email, email.toLowerCase()),
    })

    if (existing) {
      throw new Error('An account with this email already exists')
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Generate unique ID
    const id = crypto.randomUUID()

    // Create seller
    await db.insert(schema.sellers).values({
      id,
      email: email.toLowerCase(),
      password: hashedPassword,
      businessName,
      phone: phone || null,
      kycStatus: 'pending',
      verificationBadge: 'none',
    })

    // Generate token
    const token = generateToken(id)

    // Fetch created seller
    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, id),
    })

    if (!seller) {
      throw new Error('Failed to create seller account')
    }

    const sellerUser: SellerUser = {
      id: seller.id,
      businessName: seller.businessName,
      email: seller.email,
      phone: seller.phone,
      kycStatus: seller.kycStatus,
      verificationBadge: seller.verificationBadge,
    }

    return { seller: sellerUser, token }
  })

// Login seller
export const sellerLogin = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      identifier: z.string().min(1, 'Email or phone is required'),
      password: z.string().min(1, 'Password is required'),
    }),
  )
  .handler(async ({ data }) => {
    const { identifier, password } = data

    // Find seller
    const trimmed = identifier.trim()
    const isEmail = trimmed.includes('@')
    const seller = await db.query.sellers.findFirst({
      where: isEmail
        ? eq(schema.sellers.email, trimmed.toLowerCase())
        : eq(schema.sellers.phone, trimmed),
    })

    if (!seller) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValid = await verifyPassword(password, seller.password)
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Generate token
    const token = generateToken(seller.id)

    const sellerUser: SellerUser = {
      id: seller.id,
      businessName: seller.businessName,
      email: seller.email,
      phone: seller.phone,
      kycStatus: seller.kycStatus,
      verificationBadge: seller.verificationBadge,
    }

    return { seller: sellerUser, token }
  })

// Get current seller session
export const getSellerSession = createServerFn({ method: 'GET' })
  .middleware([sellerAuthMiddleware])
  .handler(({ context }) => {
    return { seller: context.seller }
  })

// Validate seller token (called from client to verify stored token)
export const validateSellerToken = createServerFn({ method: 'POST' })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { token } = data

    const decoded = verifyToken(token)
    if (!decoded) {
      return { valid: false, seller: null }
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, decoded.sellerId),
    })

    if (!seller) {
      return { valid: false, seller: null }
    }

    const sellerUser: SellerUser = {
      id: seller.id,
      businessName: seller.businessName,
      email: seller.email,
      phone: seller.phone,
      kycStatus: seller.kycStatus,
      verificationBadge: seller.verificationBadge,
    }

    return { valid: true, seller: sellerUser }
  })
