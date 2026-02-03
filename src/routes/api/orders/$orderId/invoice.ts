import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/orders/$orderId/invoice')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        return new Response(
          JSON.stringify({ message: `Generating invoice for order ${params.orderId}` }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
