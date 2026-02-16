import { createMiddleware } from 'hono/factory'
import { auth } from '@/lib/auth'

type BuyerSession = Awaited<ReturnType<typeof auth.api.getSession>>

export type BuyerEnv = {
  Variables: {
    buyerSession: BuyerSession
  }
}

export const optionalBuyerAuth = createMiddleware<BuyerEnv>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    c.set('buyerSession', session)
  } catch {
    c.set('buyerSession', null)
  }
  await next()
})

export const requireBuyerAuth = createMiddleware<BuyerEnv>(async (c, next) => {
  try {
    const session = await auth.api.getSession({ headers: c.req.raw.headers })
    if (!session?.user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    c.set('buyerSession', session)
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
})
