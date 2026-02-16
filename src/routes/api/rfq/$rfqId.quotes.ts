import { createFileRoute } from '@tanstack/react-router'
import { proxyAllApiMethods } from '@/api/proxy'

export const Route = createFileRoute('/api/rfq/$rfqId/quotes')({
  server: {
    handlers: proxyAllApiMethods,
  },
})
