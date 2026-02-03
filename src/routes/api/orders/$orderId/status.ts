import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/orders/$orderId/status')({
  server: {
    handlers: {
      PATCH: async ({ request, params }) => {
        return new Response(
          JSON.stringify({ message: `Updating status for order ${params.orderId}` }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
