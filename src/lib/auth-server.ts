import { createServerFn, createMiddleware } from '@tanstack/react-start'
import { auth } from './auth'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const authMiddleware = createMiddleware().server(async ({ next, request }) => {
    try {
        const session = await auth.api.getSession({ headers: request.headers })
        return next({ context: { session, headers: request.headers } })
    } catch (error) {
        console.error("Failed to get session in middleware:", error)
        return next({ context: { session: null, headers: request.headers } })
    }
})

export const getAuthSession = createServerFn({ method: 'GET' })
    .middleware([authMiddleware])
    .handler(async ({ context }) => {
        return context.session
    })

export const setUserPassword = createServerFn({ method: 'POST' })
    .inputValidator((input: { password: string }) => {
        if (!input.password || input.password.length < 8) {
            throw new Error('Password must be at least 8 characters')
        }
        return input
    })
    .middleware([authMiddleware])
    .handler(async ({ data, context }) => {
        const session = context.session
        if (!session) throw new Error('Unauthorized')

        const userId = session.user.id

        // Check if user already has a password account
        const existing = await db.query.account.findFirst({
            where: and(
                eq(schema.account.userId, userId),
                eq(schema.account.providerId, "credential")
            )
        })

        if (existing) {
            throw new Error('Password already set. Use change password instead.')
        }

        // Use better-auth's API to set the password
        // This ensures compatibility with better-auth's hashing and verification
        const res = await auth.api.setPassword({
            body: {
                newPassword: data.password,
            },
            headers: context.headers
        })

        if (!res) {
             // Fallback or error handling if needed
             throw new Error("Failed to set password")
        }

        return { success: true }
    })

export const checkUserPasswordStatus = createServerFn({ method: 'GET' })
    .middleware([authMiddleware])
    .handler(async ({ context }) => {
        const { session } = context
        if (!session?.user) return { needsPassword: false }
        
        const accounts = await db.query.account.findMany({
            where: eq(schema.account.userId, session.user.id)
        })
        
        const hasPassword = accounts.some(a => a.providerId === "credential")
        const isSocial = accounts.some(a => a.providerId !== "credential")
        
        return { needsPassword: isSocial && !hasPassword }
    })

export const verifyResetCode = createServerFn({ method: 'POST' })
    .inputValidator((input: { email: string; code: string }) => {
        return z.object({
            email: z.string().email(),
            code: z.string().length(6)
        }).parse(input)
    })
    .handler(async ({ data }) => {
        const { email, code } = data

        // Find the OTP record
        const record = await db.query.passwordResetOtps.findFirst({
            where: and(
                eq(schema.passwordResetOtps.email, email),
                eq(schema.passwordResetOtps.code, code)
            ),
            orderBy: (t, { desc }) => [desc(t.createdAt)]
        })

        if (!record) {
            throw new Error('Invalid code')
        }

        if (record.used) {
            throw new Error('Code already used')
        }

        if (new Date() > record.expiresAt) {
            throw new Error('Code expired')
        }

        // Mark code as used
        await db.update(schema.passwordResetOtps)
            .set({ used: true })
            .where(eq(schema.passwordResetOtps.id, record.id))

        // Return the token so the client can redirect to reset-password page
        return { success: true, token: record.token }
    })
