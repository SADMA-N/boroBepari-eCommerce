import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rfq/$rfqId/quotes')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { rfqId } = params
        // TODO: Fetch all quotes for this RFQ from database
        return new Response(
          JSON.stringify({ message: `Quotes list for RFQ ${rfqId}` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
