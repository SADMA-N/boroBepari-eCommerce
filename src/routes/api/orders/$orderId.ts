import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/orders/$orderId')({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        return new Response(
          JSON.stringify({
            message: `Fetching details for order ${params.orderId}`,
          }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
