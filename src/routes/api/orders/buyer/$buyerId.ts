import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/orders/buyer/$buyerId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        return new Response(
          JSON.stringify({ message: `Fetching orders for buyer ${params.buyerId}` }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
