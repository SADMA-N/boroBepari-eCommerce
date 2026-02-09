import {
  sendCancellationEmail,
  sendOrderStatusEmail as sendOrderStatusEmailEmail,
} from './email'

type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'refund_processed'

export async function sendOrderStatusEmail({
  email,
  name,
  orderId,
  status,
  tracking,
}: {
  email: string
  name: string
  orderId: number
  status: OrderStatus
  tracking?: {
    number?: string
    courier?: string
    eta?: string
  }
}) {
  if (status === 'cancelled') {
    return sendCancellationEmail({
      email,
      name,
      orderNumber: buildOrderNumber(orderId),
      refundSummary:
        'Refunds will be processed to the original payment method.',
    })
  }

  return sendOrderStatusEmailEmail({
    email,
    name,
    orderNumber: buildOrderNumber(orderId),
    statusLabel: status.replace(/_/g, ' '),
    trackingNumber: tracking?.number,
    courier: tracking?.courier,
    eta: tracking?.eta,
    orderLink: `/buyer/orders/${orderId}`,
  })
}

export function sendSmsNotification({
  phone,
  message,
}: {
  phone: string
  message: string
}) {
  console.log('SMS notification placeholder:', phone, message)
}

export function sendPushNotification({
  userId,
  title,
  message,
}: {
  userId: string
  title: string
  message: string
}) {
  console.log('Push notification placeholder:', userId, title, message)
}

function buildOrderNumber(orderId: number) {
  const year = new Date().getFullYear()
  return `BO-${year}-${orderId.toString().padStart(4, '0')}`
}
