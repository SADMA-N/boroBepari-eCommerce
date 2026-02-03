import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { stockAlerts } from '@/db/schema'
import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm'
import { addDays } from 'date-fns'

export const Route = createFileRoute('/api/stock-alerts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const userId = url.searchParams.get('userId')
        const includeNotified = url.searchParams.get('includeNotified') === '1'

        if (!userId) {
          return new Response(JSON.stringify({ error: 'userId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const now = new Date()
        const expired = await db
          .select()
          .from(stockAlerts)
          .where(and(eq(stockAlerts.userId, userId), lt(stockAlerts.expiresAt, now)))

        if (expired.length) {
          await db
            .update(stockAlerts)
            .set({ isActive: false })
            .where(inArray(stockAlerts.id, expired.map((e) => e.id)))
        }

        const alerts = await db.query.stockAlerts.findMany({
          where: and(eq(stockAlerts.userId, userId)),
          with: {
            product: true,
          },
          orderBy: (alerts, { desc }) => [desc(alerts.createdAt)],
        })

        const notified = includeNotified
          ? alerts.filter((alert) => alert.notifiedAt && !alert.acknowledgedAt)
          : []

        return new Response(
          JSON.stringify({
            alerts,
            notified,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => ({}))
        const productId = Number(payload?.productId)
        const email = payload?.email
        const phone = payload?.phone
        const source = payload?.source ?? 'manual'
        const userId = payload?.userId ?? null

        if (!productId || !email) {
          return new Response(JSON.stringify({ error: 'productId and email are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const existing = await db.query.stockAlerts.findFirst({
          where: and(
            eq(stockAlerts.productId, productId),
            eq(stockAlerts.email, email),
            or(isNull(stockAlerts.notifiedAt), eq(stockAlerts.isActive, true)),
          ),
        })

        if (existing) {
          return new Response(JSON.stringify({ alert: existing, alreadySubscribed: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const [alert] = await db
          .insert(stockAlerts)
          .values({
            productId,
            userId,
            email,
            phone,
            source,
            isActive: true,
            expiresAt: addDays(new Date(), 30),
          })
          .returning()

        return new Response(JSON.stringify({ alert }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
      PATCH: async ({ request }) => {
        const payload = await request.json().catch(() => ({}))
        const action = payload?.action

        if (action !== 'acknowledge') {
          return new Response(JSON.stringify({ error: 'Unsupported action' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const ids = payload?.ids as number[] | undefined
        if (!ids?.length) {
          return new Response(JSON.stringify({ error: 'ids are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        await db
          .update(stockAlerts)
          .set({ acknowledgedAt: new Date() })
          .where(inArray(stockAlerts.id, ids))

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
      DELETE: async ({ request }) => {
        const payload = await request.json().catch(() => ({}))
        const alertId = Number(payload?.alertId)
        if (!alertId) {
          return new Response(JSON.stringify({ error: 'alertId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        await db
          .update(stockAlerts)
          .set({ isActive: false })
          .where(eq(stockAlerts.id, alertId))

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
