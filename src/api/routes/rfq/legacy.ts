import { Hono } from 'hono'

const router = new Hono().basePath('/rfq')

// Legacy compatibility endpoints that were previously file-routes.
router.post('/submit', (c) => {
  return c.json({ message: 'Submit RFQ placeholder' })
})

router.post('/:rfqId/quote', (c) => {
  const rfqId = c.req.param('rfqId')
  return c.json({ message: `Quote submitted for RFQ ${rfqId}` })
})

router.get('/:rfqId/quotes', (c) => {
  const rfqId = c.req.param('rfqId')
  return c.json({ message: `Quotes list for RFQ ${rfqId}` })
})

router.get('/buyer/:buyerId', (c) => {
  const buyerId = c.req.param('buyerId')
  return c.json({ message: `RFQs for buyer ${buyerId}` })
})

router.get('/supplier/:supplierId', (c) => {
  const supplierId = c.req.param('supplierId')
  return c.json({ message: `RFQs for supplier ${supplierId}` })
})

router.patch('/quote/:quoteId/accept', (c) => {
  const quoteId = c.req.param('quoteId')
  return c.json({ message: `Quote ${quoteId} accepted` })
})

router.patch('/quote/:quoteId/reject', (c) => {
  const quoteId = c.req.param('quoteId')
  return c.json({ message: `Quote ${quoteId} rejected` })
})

router.post('/quote/:quoteId/counter', (c) => {
  const quoteId = c.req.param('quoteId')
  return c.json({ message: `Counter offer for quote ${quoteId}` })
})

export default router
