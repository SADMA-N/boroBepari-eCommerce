import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/orders/$orderId/track')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        return new Response(
          JSON.stringify({ message: `Fetching tracking info for order ${params.orderId}` }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
