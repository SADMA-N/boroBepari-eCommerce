import { Hono } from 'hono'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { verifySellerToken } from '@/lib/seller-auth-server'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { requireSellerAuth, optionalSellerAuth, mapSellerToUser } from '@/api/middleware/seller-auth'
import { sendVerificationEmail } from '@/lib/email'
import { BD_PHONE_REGEX } from '@/lib/validators'
import { sanitizeText } from '@/lib/sanitize'

const SECRET = process.env.SELLER_AUTH_SECRET || 'seller-secret-key-change-in-production'

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

const router = new Hono().basePath('/auth/seller')

// POST /register
router.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const data = z.object({
      businessName: z.string().min(2, 'Business name must be at least 2 characters'),
      businessType: z.string().min(1),
      tradeLicenseNumber: z.string().min(1),
      businessCategory: z.string().min(1),
      yearsInBusiness: z.string().optional(),
      fullName: z.string().min(1),
      email: z.string().email('Invalid email address'),
      phone: z.string().regex(BD_PHONE_REGEX, 'Use BD format: 01XXXXXXXXX'),
      address: z.string().min(1),
      city: z.string().min(1),
      postalCode: z.string().min(1),
      bankName: z.string().min(1),
      accountHolderName: z.string().min(1),
      accountNumber: z.string().min(1),
      branchName: z.string().min(1),
      routingNumber: z.string().optional(),
    }).parse(body)

    // Check if seller already exists
    const existing = await db.query.sellers.findFirst({
      where: eq(schema.sellers.email, data.email.toLowerCase()),
    })

    if (existing) {
      return c.json({ error: 'An account with this email already exists' }, 400)
    }

    // Generate a temporary random password
    const tempPassword = Math.random().toString(36).slice(-10)
    const hashedPassword = await hashPassword(tempPassword)

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
      yearsInBusiness: data.yearsInBusiness ? parseInt(data.yearsInBusiness) : null,
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

    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message || 'Registration failed' }, 500)
  }
})

// POST /login
router.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { identifier, password } = z.object({
      identifier: z.string().min(1, 'Email or phone is required'),
      password: z.string().min(1, 'Password is required'),
    }).parse(body)

    const trimmed = identifier.trim()
    const isEmail = trimmed.includes('@')
    const seller = await db.query.sellers.findFirst({
      where: isEmail
        ? eq(schema.sellers.email, trimmed.toLowerCase())
        : eq(schema.sellers.phone, trimmed),
    })

    if (!seller) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const isValid = await verifyPassword(password, seller.password)
    if (!isValid) {
      return c.json({ error: 'Invalid email or password' }, 401)
    }

    const token = generateToken(seller.id)
    const sellerUser = mapSellerToUser(seller)

    return c.json({ seller: sellerUser, token })
  } catch (error: any) {
    return c.json({ error: error.message || 'Login failed' }, 500)
  }
})

// POST /google-login
router.post('/google-login', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = z.object({
      email: z.string().email(),
    }).parse(body)

    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.email, email.toLowerCase()),
    })

    if (!seller) {
      return c.json({ error: 'This email is not registered as a seller account. Please register first.' }, 404)
    }

    const token = generateToken(seller.id)
    const sellerUser = mapSellerToUser(seller)

    return c.json({ seller: sellerUser, token })
  } catch (error: any) {
    return c.json({ error: error.message || 'Google login failed' }, 500)
  }
})

// POST /set-password
router.post('/set-password', async (c) => {
  try {
    const body = await c.req.json()
    const { email, token, password } = z.object({
      email: z.string().email(),
      token: z.string(),
      password: z.string().min(8),
    }).parse(body)

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
      return c.json({ error: 'Invalid or expired verification link' }, 400)
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
      return c.json({ error: 'Seller not found' }, 404)
    }

    const updatedSeller = results[0]

    // Delete verification token
    await db
      .delete(schema.verification)
      .where(eq(schema.verification.id, verification.id))

    // Generate session token
    const authToken = generateToken(updatedSeller.id)
    const sellerUser = mapSellerToUser(updatedSeller)

    return c.json({ seller: sellerUser, token: authToken })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to set password' }, 500)
  }
})

// PATCH /profile
router.patch('/profile', requireSellerAuth, async (c) => {
  try {
    const seller = c.get('seller')
    if (!seller) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = await c.req.json()
    const data = z.object({
      businessName: z.string().min(2).optional(),
      businessType: z.string().optional(),
      tradeLicenseNumber: z.string().optional(),
      businessCategory: z.string().optional(),
      yearsInBusiness: z.number().optional(),
      fullName: z.string().optional(),
      phone: z.string().regex(BD_PHONE_REGEX, 'Use BD format: 01XXXXXXXXX').optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      bankName: z.string().optional(),
      accountHolderName: z.string().optional(),
      accountNumber: z.string().optional(),
      branchName: z.string().optional(),
      routingNumber: z.string().optional(),
    }).parse(body)

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
      .where(eq(schema.sellers.id, seller.id))
      .returning()

    const sellerUser = mapSellerToUser(updated)

    return c.json({ seller: sellerUser })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to update profile' }, 500)
  }
})

// POST /request-reset
router.post('/request-reset', async (c) => {
  try {
    const body = await c.req.json()
    const { email } = z.object({
      email: z.string().email(),
    }).parse(body)

    const successResult = {
      success: true,
      message: 'If this email is registered, a verification code has been sent.',
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.email, email.toLowerCase()),
    })

    if (!seller) {
      return c.json(successResult)
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

    return c.json(successResult)
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to request reset' }, 500)
  }
})

// POST /verify-reset-code
router.post('/verify-reset-code', async (c) => {
  try {
    const body = await c.req.json()
    const { email, code } = z.object({
      email: z.string().email(),
      code: z.string().length(6),
    }).parse(body)

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
      return c.json({ error: 'Invalid or expired verification code' }, 400)
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

    return c.json({ token: resetToken })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to verify reset code' }, 500)
  }
})

// GET /session
router.get('/session', optionalSellerAuth, async (c) => {
  const seller = c.get('seller')
  return c.json({ seller })
})

// POST /validate-token
router.post('/validate-token', async (c) => {
  try {
    const body = await c.req.json()
    const { token } = z.object({
      token: z.string(),
    }).parse(body)

    const decoded = verifySellerToken(token)
    if (!decoded) {
      return c.json({ valid: false, seller: null })
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(schema.sellers.id, decoded.sellerId),
    })

    if (!seller) {
      return c.json({ valid: false, seller: null })
    }

    const sellerUser = mapSellerToUser(seller)

    return c.json({ valid: true, seller: sellerUser })
  } catch (error: any) {
    return c.json({ error: error.message || 'Token validation failed' }, 500)
  }
})

export default router
