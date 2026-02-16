import { createFileRoute } from '@tanstack/react-router'
import { proxyAllApiMethods } from '@/api/proxy'

export const Route = createFileRoute('/api/cart/item/$itemId')({
  server: {
    handlers: proxyAllApiMethods,
  },
})
