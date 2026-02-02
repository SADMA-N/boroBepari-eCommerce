import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rfq/quote/$quoteId/accept')({
  server: {
    handlers: {
      PATCH: async ({ params }) => {
        const { quoteId } = params
        // TODO: Update quote status to 'accepted'
        // TODO: Update RFQ status to 'accepted' or 'converted'
        return new Response(
          JSON.stringify({ message: `Quote ${quoteId} accepted` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
