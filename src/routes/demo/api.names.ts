import { createFileRoute } from '@tanstack/react-router'
import { proxyAllDemoApiMethods } from '@/demo-api/proxy'

export const Route = createFileRoute('/demo/api/names')({
  server: {
    handlers: proxyAllDemoApiMethods,
  },
})
