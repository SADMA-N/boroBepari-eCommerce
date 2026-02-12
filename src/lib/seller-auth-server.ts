import { createMiddleware, createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { sendVerificationEmail } from './email'
import type { SellerUser } from '@/types/seller'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { BD_PHONE_REGEX } from '@/lib/validators'
import { sanitizeText } from '@/lib/sanitize'

// Simple JWT-like token generation and verification
// In production, use a proper JWT library like jose
const SECRET =
  process.env.SELLER_AUTH_SECRET || 'seller-secret-key-change-in-production'

function generateToken(sellerId: string): string {
  const payload = {
    sellerId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = Buffer.from(SECRET + encoded)
    .toString('base64')
    .slice(0, 32)
  return `${encoded}.${signature}`
}

export function verifySellerToken(token: string): { sellerId: string } | null {
  try {
    const [encoded, signature] = token.split('.')
    const expectedSignature = Buffer.from(SECRET + encoded)
      .toString('base64')
      .slice(0, 32)

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
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function mapSellerToUser(seller: any): SellerUser {
  return {
    id: seller.id,
    businessName: seller.businessName,
    businessType: seller.businessType,
    tradeLicenseNumber: seller.tradeLicenseNumber,
    businessCategory: seller.businessCategory,
    yearsInBusiness: seller.yearsInBusiness,
    fullName: seller.fullName,
    email: seller.email,
    phone: seller.phone,
    address: seller.address,
    city: seller.city,
    postalCode: seller.postalCode,
    bankName: seller.bankName,
    accountHolderName: seller.accountHolderName,
    accountNumber: seller.accountNumber,
    branchName: seller.branchName,
    routingNumber: seller.routingNumber,
    kycStatus: seller.kycStatus,
    kycSubmittedAt: seller.kycSubmittedAt
      ? seller.kycSubmittedAt.toISOString()
      : null,
    kycRejectionReason: seller.kycRejectionReason,
    verificationBadge: seller.verificationBadge,
  }
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
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
        const decoded = verifySellerToken(token)
        if (decoded) {
          const seller = await db.query.sellers.findFirst({
            where: eq(schema.sellers.id, decoded.sellerId),
          })

          if (seller) {
            sellerUser = mapSellerToUser(seller)
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
  .inputValidator(
    z.object({
      businessName: z
        .string()
        .min(2, 'Business name must be at least 2 characters'),
      businessType: z.string().min(1),
      tradeLicenseNumber: z.string().min(1),
      businessCategory: z.string().min(1),
      yearsInBusiness: z.string().optional(),
      fullName: z.string().min(1),
      email: z.string().email('Invalid email address'),
      phone: z
        .string()
        .regex(BD_PHONE_REGEX, 'Use BD format: 01XXXXXXXXX'),
      address: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().min(1),
      bankName: z.string().min(1),
      accountHolderName: z.string().min(1),
      accountNumber: z.string().min(1),
      branchName: z.string().min(1),
      routingNumber: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    // Check if seller already exists
    const existing = await db.query.sellers.findFirst({
      where: eq(schema.sellers.email, data.email.toLowerCase()),
    })

    if (existing) {
      throw new Error('An account with this email already exists')
    }

    // Generate a temporary random password
    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await hashPassword(tempPassword)

    // Generate unique ID
    const id = crypto.randomUUID()

    // Create seller
    await db.insert(schema.sellers).values({
      id,
      email: data.email.toLowerCase(),
      password: hashedPassword,
      businessName: sanitizeText(data.businessName),
      businessType: sanitizeText(data.businessType),
      tradeLicenseNumber: sanitizeText(data.tradeLicenseNumber),
      businessCategory: sanitizeText(data.businessCategory),
      yearsInBusiness: data.yearsInBusiness
        ? parseInt(data.yearsInBusiness)
        : null,
      fullName: sanitizeText(data.fullName),
      phone: data.phone.trim(),
      address: sanitizeText(data.address),
      city: sanitizeText(data.city),
      postalCode: sanitizeText(data.postalCode),
      bankName: sanitizeText(data.bankName),
      accountHolderName: sanitizeText(data.accountHolderName),
      accountNumber: sanitizeText(data.accountNumber),
      branchName: sanitizeText(data.branchName),
      routingNumber: data.routingNumber ? sanitizeText(data.routingNumber) : null,
      kycStatus: 'pending',
      verificationBadge: 'none',
    })

    // Create verification token
    const token = Math.random().toString(36).slice(2, 15)
    await db.insert(schema.verification).values({
      id: crypto.randomUUID(),
      identifier: data.email.toLowerCase(),
      value: token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    })

    // Send verification email
    const verificationUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/auth/set-password?token=${token}&email=${encodeURIComponent(data.email.toLowerCase())}&type=seller`

    await sendVerificationEmail({
      email: data.email.toLowerCase(),
      name: data.fullName,
      url: verificationUrl,
    })

    return { success: true }
  })

// Set seller password after email verification
export const setSellerPassword = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email(),
      token: z.string(),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    const { email, token, password } = data

    // Verify token
    const verification = await db.query.verification.findFirst({
      where: (v, { and, eq: eqField, gt }) =>
        and(
          eqField(v.identifier, email.toLowerCase()),
          eqField(v.value, token),
          gt(v.expiresAt, new Date()),
        ),
    })

    if (!verification) {
      throw new Error('Invalid or expired verification link')
    }

    // Hash new password
    const hashedPassword = await hashPassword(password)

    const results = await db
      .update(schema.sellers)
      .set({
        password: hashedPassword,
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(schema.sellers.email, email.toLowerCase()))
      .returning()

    if (results.length === 0) {
      throw new Error('Seller not found')
    }

    const updatedSeller = results[0]

    // Delete verification token
    await db
      .delete(schema.verification)
      .where(eq(schema.verification.id, verification.id))

    // Generate session token
    const authToken = generateToken(updatedSeller.id)

    const sellerUser = mapSellerToUser(updatedSeller)

    return { seller: sellerUser, token: authToken }
  })

// Update seller profile
export const updateSellerProfile = createServerFn({ method: 'POST' })
  .middleware([sellerAuthMiddleware])
  .inputValidator(
    z.object({
      businessName: z.string().min(2).optional(),
      businessType: z.string().optional(),
      tradeLicenseNumber: z.string().optional(),
      businessCategory: z.string().optional(),
      yearsInBusiness: z.number().optional(),
      fullName: z.string().optional(),
      phone: z
        .string()
        .regex(BD_PHONE_REGEX, 'Use BD format: 01XXXXXXXXX')
        .optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      bankName: z.string().optional(),
      accountHolderName: z.string().optional(),
      accountNumber: z.string().optional(),
      branchName: z.string().optional(),
      routingNumber: z.string().optional(),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!context.seller) {
      throw new Error('Unauthorized')
    }

    const [updated] = await db
      .update(schema.sellers)
      .set({
        businessName: data.businessName ? sanitizeText(data.businessName) : undefined,
        businessType: data.businessType ? sanitizeText(data.businessType) : undefined,
        tradeLicenseNumber: data.tradeLicenseNumber ? sanitizeText(data.tradeLicenseNumber) : undefined,
        businessCategory: data.businessCategory ? sanitizeText(data.businessCategory) : undefined,
        yearsInBusiness: data.yearsInBusiness ?? undefined,
        fullName: data.fullName ? sanitizeText(data.fullName) : undefined,
        phone: data.phone ? data.phone.trim() : undefined,
        address: data.address ? sanitizeText(data.address) : undefined,
        city: data.city ? sanitizeText(data.city) : undefined,
        postalCode: data.postalCode ? sanitizeText(data.postalCode) : undefined,
        bankName: data.bankName ? sanitizeText(data.bankName) : undefined,
        accountHolderName: data.accountHolderName ? sanitizeText(data.accountHolderName) : undefined,
        accountNumber: data.accountNumber ? sanitizeText(data.accountNumber) : undefined,
        branchName: data.branchName ? sanitizeText(data.branchName) : undefined,
        routingNumber: data.routingNumber ? sanitizeText(data.routingNumber) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(schema.sellers.id, context.seller.id))
      .returning()

    const sellerUser = mapSellerToUser(updated)

    return { seller: sellerUser }
  })

// Request password reset for seller - sends a 6-digit code
export const requestSellerPasswordReset = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data }) => {
    const { email } = data

    // Check if seller exists
    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.email, email.toLowerCase()),
    })

    // Generic message for security
    const successResult = {
      success: true,
      message:
        'If this email is registered, a verification code has been sent.',
    }

    if (!seller) {
      return successResult
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store in verification table
    await db.insert(schema.verification).values({
      id: crypto.randomUUID(),
      identifier: email.toLowerCase(),
      value: code,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    })

    // Send reset email with code
    await sendVerificationEmail({
      email: email.toLowerCase(),
      name: seller.fullName || 'Seller',
      code,
      type: 'reset-password',
    })

    return successResult
  })

// Verify the 6-digit code and return a temporary reset token
export const verifySellerResetCode = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }),
  )
  .handler(async ({ data }) => {
    const { email, code } = data

    // Verify code
    const verification = await db.query.verification.findFirst({
      where: (v, { and, eq: eqField, gt }) =>
        and(
          eqField(v.identifier, email.toLowerCase()),
          eqField(v.value, code),
          gt(v.expiresAt, new Date()),
        ),
    })

    if (!verification) {
      throw new Error('Invalid or expired verification code')
    }

    // Delete the code
    await db
      .delete(schema.verification)
      .where(eq(schema.verification.id, verification.id))

    // Generate a long-lived temporary token for the reset page
    const resetToken =
      Math.random().toString(36).slice(2, 15) +
      Math.random().toString(36).slice(2, 15)

    await db.insert(schema.verification).values({
      id: crypto.randomUUID(),
      identifier: email.toLowerCase(),
      value: resetToken,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes to complete reset
    })

    return { token: resetToken }
  })

// Login seller with Google
export const sellerGoogleLogin = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) => {
    const { email } = data

    // Find seller
    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.email, email.toLowerCase()),
    })

    if (!seller) {
      throw new Error(
        'This email is not registered as a seller account. Please register first.',
      )
    }

    // Generate token
    const token = generateToken(seller.id)

    const sellerUser = mapSellerToUser(seller)

    return { seller: sellerUser, token }
  })

// Login seller
export const sellerLogin = createServerFn({ method: 'POST' })
  .inputValidator(
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

    const sellerUser = mapSellerToUser(seller)

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
  .inputValidator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    const { token } = data

    const decoded = verifySellerToken(token)
    if (!decoded) {
      return { valid: false, seller: null }
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, decoded.sellerId),
    })

    if (!seller) {
      return { valid: false, seller: null }
    }

    const sellerUser = mapSellerToUser(seller)

    return { valid: true, seller: sellerUser }
  })
