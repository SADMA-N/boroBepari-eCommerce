import { createFileRoute } from '@tanstack/react-router'
import { createQuoteSchema } from '@/lib/rfq-validation'

export const Route = createFileRoute('/api/rfq/$rfqId/quote')({
  server: {
    handlers: {
      POST: async ({ request, params }) => {
        const { rfqId } = params
        // TODO: Parse body using createQuoteSchema
        // TODO: Validate RFQ exists and is open
        // TODO: Create Quote in database
        return new Response(
          JSON.stringify({ message: `Quote submitted for RFQ ${rfqId}` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
