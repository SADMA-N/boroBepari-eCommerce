import { Hono } from 'hono'
import { z } from 'zod'
import { and, eq, desc } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { requireBuyerAuth, optionalBuyerAuth } from '@/api/middleware/buyer-auth'

const router = new Hono().basePath('/auth/buyer')

// GET /session
router.get('/session', optionalBuyerAuth, async (c) => {
  const session = c.get('buyerSession')
  return c.json({ session })
})

// POST /set-password
router.post('/set-password', requireBuyerAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { password } = z.object({
      password: z.string().min(8),
    }).parse(body)

    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Check if user already has a credential account
    const existing = await db.query.account.findFirst({
      where: and(
        eq(schema.account.userId, session.user.id),
        eq(schema.account.providerId, 'credential'),
      ),
    })

    if (existing) {
      return c.json({ error: 'Password already set' }, 400)
    }

    await auth.api.setPassword({
      body: { newPassword: password },
      headers: c.req.raw.headers,
    })

    return c.json({ success: true })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to set password' }, 500)
  }
})

// POST /update-password
router.post('/update-password', requireBuyerAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8).regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, 'Password must contain letters and numbers'),
    }).parse(body)

    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: c.req.raw.headers,
    })

    return c.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes('password') || error.status === 400) {
      return c.json({ error: 'Incorrect current password' }, 400)
    }
    return c.json({ error: error.message || 'Failed to update password' }, 500)
  }
})

// GET /password-status
router.get('/password-status', optionalBuyerAuth, async (c) => {
  try {
    const session = c.get('buyerSession')
    if (!session?.user) {
      return c.json({ needsPassword: false })
    }

    const accounts = await db.query.account.findMany({
      where: eq(schema.account.userId, session.user.id),
    })

    const hasPassword = accounts.some((a) => a.providerId === 'credential')
    const isSocial = accounts.some((a) => a.providerId !== 'credential')

    return c.json({ needsPassword: isSocial && !hasPassword })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to get password status' }, 500)
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

    const record = await db.query.passwordResetOtps.findFirst({
      where: and(
        eq(schema.passwordResetOtps.email, email.toLowerCase()),
        eq(schema.passwordResetOtps.code, code),
      ),
      orderBy: desc(schema.passwordResetOtps.createdAt),
    })

    if (!record) {
      return c.json({ error: 'Invalid verification code' }, 400)
    }

    if (record.used) {
      return c.json({ error: 'Code has already been used' }, 400)
    }

    if (new Date(record.expiresAt) < new Date()) {
      return c.json({ error: 'Code has expired' }, 400)
    }

    // Mark as used
    await db
      .update(schema.passwordResetOtps)
      .set({ used: true })
      .where(eq(schema.passwordResetOtps.id, record.id))

    return c.json({ success: true, token: record.token })
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to verify reset code' }, 500)
  }
})

export default router
