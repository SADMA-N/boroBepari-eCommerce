import { createFileRoute } from '@tanstack/react-router'
import { proxyAllApiMethods } from '@/api/proxy'

export const Route = createFileRoute('/api/rfq/quote/$quoteId/accept')({
  server: {
    handlers: proxyAllApiMethods,
  },
})
