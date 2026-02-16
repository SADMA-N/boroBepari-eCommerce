import { createMiddleware } from 'hono/factory'
import { eq } from 'drizzle-orm'
import { verifyAdminToken } from '@/lib/admin-auth-server'
import { db } from '@/db'
import * as schema from '@/db/schema'
import type { AdminUser } from '@/types/admin'

export type AdminEnv = {
  Variables: {
    admin: AdminUser | null
  }
}

export const optionalAdminAuth = createMiddleware<AdminEnv>(async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      const decoded = verifyAdminToken(token)
      if (decoded) {
        const admin = await db.query.admins.findFirst({
          where: eq(schema.admins.id, decoded.adminId),
        })
        if (admin && admin.isActive) {
          c.set('admin', {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.role,
            avatar: admin.avatar,
            lastLoginAt: admin.lastLoginAt?.toISOString() || null,
          })
          return next()
        }
      }
    }
  } catch (error) {
    console.error('Admin auth middleware error:', error)
  }

  c.set('admin', null)
  await next()
})

export const requireAdminAuth = createMiddleware<AdminEnv>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const decoded = verifyAdminToken(token)
  if (!decoded) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  const admin = await db.query.admins.findFirst({
    where: eq(schema.admins.id, decoded.adminId),
  })

  if (!admin || !admin.isActive) {
    return c.json({ error: 'Admin not found or deactivated' }, 401)
  }

  c.set('admin', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    avatar: admin.avatar,
    lastLoginAt: admin.lastLoginAt?.toISOString() || null,
  })
  await next()
})
