import { Hono } from 'hono'
import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm'
import { addDays } from 'date-fns'
import { db } from '@/db'
import { products, stockAlerts } from '@/db/schema'
import { sendStockAlertEmail } from '@/lib/email'
import { sendSmsNotification } from '@/lib/notifications'
import { BD_PHONE_REGEX } from '@/lib/validators'

const router = new Hono().basePath('/stock-alerts')

// GET / - Get stock alerts for a user
router.get('/', async (c) => {
  const userId = c.req.query('userId')
  const includeNotified = c.req.query('includeNotified') === '1'

  if (!userId) {
    return c.json({ error: 'userId is required' }, 400)
  }

  // Auto-expire old alerts
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

  const userAlerts = await db.query.stockAlerts.findMany({
    where: eq(stockAlerts.userId, userId),
    with: { product: true },
    orderBy: (alerts, { desc }) => [desc(alerts.createdAt)],
  })

  const notified = includeNotified
    ? userAlerts.filter((alert) => alert.notifiedAt && !alert.acknowledgedAt)
    : []

  return c.json({ alerts: userAlerts, notified })
})

// POST / - Create a stock alert
router.post('/', async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const productId = Number(payload?.productId)
  const email = payload?.email
  const phone = payload?.phone
  const source = payload?.source ?? 'manual'
  const userId = payload?.userId ?? null

  if (!productId || !email) {
    return c.json({ error: 'productId and email are required' }, 400)
  }
  if (phone && !BD_PHONE_REGEX.test(String(phone).trim())) {
    return c.json({ error: 'Phone must be BD format: 01XXXXXXXXX' }, 400)
  }

  const existing = await db.query.stockAlerts.findFirst({
    where: and(
      eq(stockAlerts.productId, productId),
      eq(stockAlerts.email, email),
      or(isNull(stockAlerts.notifiedAt), eq(stockAlerts.isActive, true)),
    ),
  })

  if (existing) {
    return c.json({ alert: existing, alreadySubscribed: true })
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

  return c.json({ alert })
})

// PATCH / - Acknowledge alerts
router.patch('/', async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const action = payload?.action

  if (action !== 'acknowledge') {
    return c.json({ error: 'Unsupported action' }, 400)
  }

  const ids = payload?.ids as Array<number> | undefined
  if (!ids?.length) {
    return c.json({ error: 'ids are required' }, 400)
  }

  await db
    .update(stockAlerts)
    .set({ acknowledgedAt: new Date() })
    .where(inArray(stockAlerts.id, ids))

  return c.json({ success: true })
})

// DELETE / - Deactivate a stock alert
router.delete('/', async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const alertId = Number(payload?.alertId)
  if (!alertId) {
    return c.json({ error: 'alertId is required' }, 400)
  }

  await db
    .update(stockAlerts)
    .set({ isActive: false })
    .where(eq(stockAlerts.id, alertId))

  return c.json({ success: true })
})

// POST /trigger - Notify subscribers when a product is back in stock
router.post('/trigger', async (c) => {
  const payload = await c.req.json().catch(() => ({}))
  const productId = Number(payload?.productId)

  if (!productId) {
    return c.json({ error: 'productId is required' }, 400)
  }

  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  })

  if (!product || product.stock <= 0) {
    return c.json({ error: 'Product not in stock' }, 400)
  }

  const alerts = await db.query.stockAlerts.findMany({
    where: and(
      eq(stockAlerts.productId, productId),
      eq(stockAlerts.isActive, true),
    ),
    with: {
      user: true,
    },
  })

  const notifiedIds: Array<number> = []
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

  return c.json({ success: true, notifiedCount: notifiedIds.length })
})

export default router
