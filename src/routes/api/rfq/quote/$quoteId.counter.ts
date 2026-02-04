import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rfq/quote/$quoteId/counter')({
  server: {
    handlers: {
      POST: ({ request, params }) => {
        const { quoteId } = params
        // TODO: Parse body for counter offer details
        // TODO: Create counter quote or update status
        return new Response(
          JSON.stringify({ message: `Counter offer for quote ${quoteId}` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
