import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders, user } from '@/db/schema'
import { sendInvoiceEmail } from '@/lib/email'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/orders/$orderId/invoice')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const orderId = Number(params.orderId)
        if (Number.isNaN(orderId)) {
          return new Response(JSON.stringify({ error: 'Invalid order id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        })

        if (!order) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (order.userId !== session.user.id) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        return new Response(
          JSON.stringify({
            invoiceUrl: order.invoiceUrl,
            invoiceGeneratedAt: order.invoiceGeneratedAt,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
      POST: async ({ request, params }) => {
        const orderId = Number(params.orderId)
        if (Number.isNaN(orderId)) {
          return new Response(JSON.stringify({ error: 'Invalid order id' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const payload = await request.json().catch(() => ({}))
        const action = payload?.action ?? 'store'

        const session = await auth.api.getSession({ headers: request.headers })
        if (!session?.user) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const order = await db.query.orders.findFirst({
          where: eq(orders.id, orderId),
        })

        if (!order) {
          return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        if (action === 'store') {
          const invoiceUrl = payload?.invoiceUrl
          if (!invoiceUrl) {
            return new Response(JSON.stringify({ error: 'invoiceUrl is required' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const [updatedOrder] = await db
            .update(orders)
            .set({
              invoiceUrl,
              invoiceGeneratedAt: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning()

          return new Response(
            JSON.stringify({
              invoiceUrl: updatedOrder.invoiceUrl,
              invoiceGeneratedAt: updatedOrder.invoiceGeneratedAt,
            }),
            { headers: { 'Content-Type': 'application/json' } },
          )
        }

        if (action === 'email') {
          const invoiceUrl = payload?.invoiceUrl ?? order.invoiceUrl
          if (!invoiceUrl) {
            return new Response(JSON.stringify({ error: 'Invoice URL not available' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const buyer = await db.query.user.findFirst({
            where: eq(user.id, order.userId),
          })

          if (!buyer) {
            return new Response(JSON.stringify({ error: 'Buyer not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const year = order.createdAt
            ? new Date(order.createdAt).getFullYear()
            : new Date().getFullYear()
          const invoiceNumber = `INV-${year}-${order.id.toString().padStart(5, '0')}`
          const orderNumber = `BO-${year}-${order.id.toString().padStart(4, '0')}`

          const result = await sendInvoiceEmail({
            email: buyer.email,
            name: buyer.name,
            invoiceNumber,
            invoiceUrl,
            orderNumber,
          })

          return new Response(
            JSON.stringify({ success: result.success }),
            { headers: { 'Content-Type': 'application/json' } },
          )
        }

        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
