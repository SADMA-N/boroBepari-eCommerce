import { createFileRoute } from '@tanstack/react-router'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { orders, user } from '@/db/schema'
import { sendCancellationEmail } from '@/lib/email'
import {
  sendOrderStatusEmail,
  sendPushNotification,
  sendSmsNotification,
} from '@/lib/notifications'
import { auth } from '@/lib/auth'

export const Route = createFileRoute('/api/orders/$orderId/status')({
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
            status: order.status,
            updatedAt: order.updatedAt,
            cancellationReason: order.cancellationReason,
            cancelledAt: order.cancelledAt,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
      PATCH: async ({ request, params }) => {
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

        const payload = await request.json().catch(() => ({}))
        const action = payload?.action

        if (action !== 'cancel' && action !== 'update') {
          return new Response(JSON.stringify({ error: 'Unsupported action' }), {
            status: 400,
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

        if (action === 'cancel') {
          if (!['placed', 'confirmed'].includes(order.status)) {
            return new Response(
              JSON.stringify({
                error: 'Order cannot be cancelled at this stage.',
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          if (order.status === 'cancelled') {
            return new Response(
              JSON.stringify({ error: 'Order already cancelled.' }),
              {
                status: 409,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const cancellationReason = payload?.reason ?? 'No reason provided'
          const [updatedOrder] = await db
            .update(orders)
            .set({
              status: 'cancelled',
              cancellationReason,
              cancelledAt: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning()

          const buyer = await db.query.user.findFirst({
            where: eq(user.id, order.userId),
          })

          const refundSummary = buildRefundSummary(order)
          if (buyer) {
            await sendCancellationEmail({
              email: buyer.email,
              name: buyer.name,
              orderNumber: buildOrderNumber(order),
              refundSummary,
            })
          }

          // Placeholder supplier notification (hook up to supplier queue service)
          console.log(`Supplier notification: order ${orderId} cancelled`)

          return new Response(
            JSON.stringify({
              status: updatedOrder.status,
              cancellationReason: updatedOrder.cancellationReason,
              cancelledAt: updatedOrder.cancelledAt,
              refundSummary,
            }),
            { headers: { 'Content-Type': 'application/json' } },
          )
        }

        const nextStatus = payload?.status
        if (!nextStatus) {
          return new Response(JSON.stringify({ error: 'status is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        const [updatedOrder] = await db
          .update(orders)
          .set({ status: nextStatus })
          .where(eq(orders.id, orderId))
          .returning()

        const buyer = await db.query.user.findFirst({
          where: eq(user.id, order.userId),
        })

        if (buyer) {
          await sendOrderStatusEmail({
            email: buyer.email,
            name: buyer.name,
            orderId: orderId,
            status: nextStatus as
              | 'placed'
              | 'confirmed'
              | 'processing'
              | 'shipped'
              | 'out_for_delivery'
              | 'delivered'
              | 'cancelled'
              | 'refund_processed',
            tracking: payload?.tracking,
          })

          if (
            ['shipped', 'delivered'].includes(nextStatus) &&
            buyer.phoneNumber
          ) {
            sendSmsNotification({
              phone: buyer.phoneNumber,
              message: `Order ${buildOrderNumber(order)} is ${nextStatus.replace(/_/g, ' ')}`,
            })
          }

          sendPushNotification({
            userId: buyer.id,
            title: `Order ${buildOrderNumber(order)}`,
            message: `Status updated to ${nextStatus.replace(/_/g, ' ')}`,
          })
        }

        return new Response(
          JSON.stringify({
            status: updatedOrder.status,
            updatedAt: updatedOrder.updatedAt,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})

function buildRefundSummary(order: typeof orders.$inferSelect) {
  const total = Number(order.totalAmount)
  const deposit = Number(order.depositAmount)
  const paymentStatus = order.paymentStatus

  if (paymentStatus === 'escrow_hold') {
    return 'A full refund will be issued from escrow.'
  }

  if (deposit > 0 && total > deposit) {
    return `Deposit refund of ৳${deposit.toLocaleString('en-BD')} will be issued.`
  }

  if (paymentStatus === 'full_paid' || paymentStatus === 'released') {
    return `Full refund of ৳${total.toLocaleString('en-BD')} will be issued.`
  }

  return 'No payment was captured. No refund is required.'
}

function buildOrderNumber(order: typeof orders.$inferSelect) {
  const year = order.createdAt
    ? new Date(order.createdAt).getFullYear()
    : new Date().getFullYear()
  return `BO-${year}-${order.id.toString().padStart(4, '0')}`
}
