import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rfq/buyer/$buyerId')({
  server: {
    handlers: {
      GET: ({ params }) => {
        const { buyerId } = params
        // TODO: Fetch RFQs for buyerId from database
        return new Response(
          JSON.stringify({ message: `RFQs for buyer ${buyerId}` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
