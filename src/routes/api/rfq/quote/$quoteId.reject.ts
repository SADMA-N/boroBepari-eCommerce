import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rfq/quote/$quoteId/reject')({
  server: {
    handlers: {
      PATCH: ({ params }) => {
        const { quoteId } = params
        // TODO: Update quote status to 'rejected'
        return new Response(
          JSON.stringify({ message: `Quote ${quoteId} rejected` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
