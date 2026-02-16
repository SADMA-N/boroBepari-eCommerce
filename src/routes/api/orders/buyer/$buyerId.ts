import { createFileRoute } from '@tanstack/react-router'
import { proxyAllApiMethods } from '@/api/proxy'

export const Route = createFileRoute('/api/orders/buyer/$buyerId')({
  server: {
    handlers: proxyAllApiMethods,
  },
})
