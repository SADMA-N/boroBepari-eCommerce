import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { suppliers } from '@/db/schema'

const router = new Hono().basePath('/suppliers')

router.get('/verified', async (c) => {
  try {
    const rows = await db.query.suppliers.findMany({
      where: eq(suppliers.verified, true),
    })

    return c.json(
      rows.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        logo: s.logo ?? '',
        verified: s.verified ?? false,
        location: s.location ?? '',
        responseRate: s.responseRate ? parseFloat(s.responseRate) : 0,
        onTimeDelivery: s.onTimeDelivery ? parseFloat(s.onTimeDelivery) : 0,
        yearsInBusiness: s.yearsInBusiness ?? 0,
        description: s.description ?? '',
      })),
    )
  } catch (error: any) {
    return c.json(
      { error: error.message || 'Failed to fetch verified suppliers' },
      500,
    )
  }
})

export default router
