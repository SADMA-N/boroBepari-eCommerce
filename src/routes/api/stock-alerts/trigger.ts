import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { products, stockAlerts } from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import { sendStockAlertEmail } from '@/lib/email'
import { sendSmsNotification } from '@/lib/notifications'

export const Route = createFileRoute('/api/stock-alerts/trigger')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const payload = await request.json().catch(() => ({}))
        const productId = Number(payload?.productId)

        if (!productId) {
          return new Response(JSON.stringify({ error: 'productId is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const product = await db.query.products.findFirst({
          where: eq(products.id, productId),
        })

        if (!product || product.stock <= 0) {
          return new Response(JSON.stringify({ error: 'Product not in stock' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const alerts = await db.query.stockAlerts.findMany({
          where: and(eq(stockAlerts.productId, productId), eq(stockAlerts.isActive, true)),
          with: {
            user: true,
          },
        })

        const notifiedIds: number[] = []
        for (const alert of alerts) {
          await sendStockAlertEmail({
            email: alert.email,
            name: alert.user?.name ?? 'Customer',
            productName: product.name,
            productImage: product.images?.[0],
            price: `৳${Number(product.price).toLocaleString('en-BD')}`,
            moq: `${product.moq} units`,
            productLink: `/products/${product.slug}`,
          })

          if (alert.phone) {
            sendSmsNotification({
              phone: alert.phone,
              message: `${product.name} is back in stock on BoroBepari! Order now: /products/${product.slug}`,
            })
          }

          notifiedIds.push(alert.id)
        }

        if (notifiedIds.length) {
          await db
            .update(stockAlerts)
            .set({ notifiedAt: new Date(), isActive: false })
            .where(inArray(stockAlerts.id, notifiedIds))
        }

        return new Response(
          JSON.stringify({ success: true, notifiedCount: notifiedIds.length }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
