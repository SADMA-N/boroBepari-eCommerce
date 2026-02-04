import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/orders/$orderId/reorder')({
  server: {
    handlers: {
      POST: ({ request, params }) => {
        return new Response(
          JSON.stringify({ message: `Reordering items from order ${params.orderId}` }),
          { headers: { 'Content-Type': 'application/json' } },
        )
      },
    },
  },
})
