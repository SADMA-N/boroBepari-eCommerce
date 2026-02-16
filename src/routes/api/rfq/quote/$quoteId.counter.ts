import { createFileRoute } from '@tanstack/react-router'
import { proxyAllApiMethods } from '@/api/proxy'

export const Route = createFileRoute('/api/rfq/quote/$quoteId/counter')({
  server: {
    handlers: proxyAllApiMethods,
  },
})
