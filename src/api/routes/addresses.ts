import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { requireBuyerAuth, type BuyerEnv } from '@/api/middleware/buyer-auth'
import { db } from '@/db'
import { addresses } from '@/db/schema'

const router = new Hono<BuyerEnv>().basePath('/addresses')

router.use('*', requireBuyerAuth)

// GET / - Get addresses for a user
router.get('/', async (c) => {
  try {
    const userId = c.req.query('userId')
    if (!userId) {
      return c.json({ error: 'userId is required' }, 400)
    }

    const userAddresses = await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))

    return c.json(userAddresses)
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to fetch addresses' },
      500,
    )
  }
})

// POST / - Create a new address
router.post('/', async (c) => {
  try {
    const body = await c.req.json()

    // If isDefault, unset other defaults
    if (body.isDefault && body.userId) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, body.userId))
    }

    const [created] = await db.insert(addresses).values(body).returning()

    return c.json(created)
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to create address' },
      500,
    )
  }
})

// PUT /:id - Update an address
router.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) return c.json({ error: 'Invalid address ID' }, 400)

    const body = await c.req.json()

    // If isDefault, unset other defaults
    if (body.isDefault && body.userId) {
      await db
        .update(addresses)
        .set({ isDefault: false })
        .where(eq(addresses.userId, body.userId))
    }

    const [updated] = await db
      .update(addresses)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(addresses.id, id))
      .returning()

    return c.json(updated)
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to update address' },
      500,
    )
  }
})

// DELETE /:id - Delete an address
router.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10)
    if (isNaN(id)) return c.json({ error: 'Invalid address ID' }, 400)

    const [deleted] = await db
      .delete(addresses)
      .where(eq(addresses.id, id))
      .returning()

    return c.json(deleted)
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to delete address' },
      500,
    )
  }
})

export default router
