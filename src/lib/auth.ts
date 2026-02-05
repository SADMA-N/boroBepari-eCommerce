import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { createLoginEvent } from '@/db/login-events'
import { sendVerificationEmail } from '@/lib/email'
import { env } from '@/env'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // Extract token from the URL using URL object
      let token = ''
      try {
        const urlObj = new URL(url)
        token = urlObj.searchParams.get('token') || ''

        // If not in query param, check path
        if (!token) {
          // path looks like /api/auth/reset-password/<token>
          const parts = urlObj.pathname.split('/')
          const resetIndex = parts.indexOf('reset-password')
          if (resetIndex !== -1 && parts[resetIndex + 1]) {
            token = parts[resetIndex + 1]
          }
        }
      } catch (e) {
        console.error('Failed to parse reset URL:', url, e)
      }

      // Fallback for string parsing if URL constructor fails (relative URLs?)
      if (!token) {
        const match = url.match(/reset-password\/([^?/]+)/)
        if (match) token = match[1]
      }

      if (!token) {
        token = url.split('token=')[1]?.split('&')[0]
      }

      if (!token) {
        console.error('Could not extract token from reset URL:', url)
        return
      }

      // Generate 6-digit OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString()

      // Store in DB
      await db.insert(schema.passwordResetOtps).values({
        email: user.email,
        code,
        token,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      })

      // Send email with code
      console.log(`[Auth] Sending reset code ${code} to ${user.email}`)
      const emailResult = await sendVerificationEmail({
        email: user.email,
        name: user.name,
        code,
        type: 'reset-password',
      })

      if (!emailResult.success) {
        console.error('[Auth] Failed to send reset email:', emailResult.error)
      } else {
        console.log('[Auth] Reset email sent successfully:', emailResult.data)
      }
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({
        email: user.email,
        url,
        name: user.name,
        type: 'verification',
      })
    },
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const user = await db.query.user.findFirst({
            where: eq(schema.user.id, session.userId),
          })

          if (!user?.emailVerified) {
            // Allow social provider users through — their email is verified by the provider
            const socialAccount = await db.query.account.findFirst({
              where: eq(schema.account.userId, session.userId),
            })
            if (!socialAccount || socialAccount.providerId === 'credential') {
              throw new Error(
                'Please verify your email address before logging in.',
              )
            }
          }
        },
        after: async (session) => {
          try {
            await createLoginEvent({
              userId: session.userId,
              ipAddress: session.ipAddress,
              userAgent: session.userAgent,
            })
          } catch (error) {
            console.error('[Auth] Failed to create login event:', (error as Error).message)
          }
        },
      },
    },
  },
  callbacks: {
    session: async ({ session, user }) => {
      console.log('[Auth] Session callback for user:', user.email)
      const accounts = await db.query.account.findMany({
        where: eq(schema.account.userId, user.id),
      })
      const hasPassword = accounts.some((a) => a.providerId === 'credential')
      const isSocial = accounts.some((a) => a.providerId !== 'credential')

      const needsPassword = isSocial && !hasPassword
      console.log(
        `[Auth] User ${user.email}: hasPassword=${hasPassword}, isSocial=${isSocial}, needsPassword=${needsPassword}`,
      )

      return {
        ...session,
        user: {
          ...session.user,
          hasPassword,
          needsPassword,
        },
      }
    },
  },
})
