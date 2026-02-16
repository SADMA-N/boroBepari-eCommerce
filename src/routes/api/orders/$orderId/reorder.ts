import { createFileRoute } from '@tanstack/react-router'
import { proxyAllApiMethods } from '@/api/proxy'

export const Route = createFileRoute('/api/orders/$orderId/reorder')({
  server: {
    handlers: proxyAllApiMethods,
  },
})
