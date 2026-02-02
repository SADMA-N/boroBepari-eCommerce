import { createFileRoute } from '@tanstack/react-router'
import { createRfqSchema } from '@/lib/rfq-validation'

export const Route = createFileRoute('/api/rfq/submit')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // TODO: Parse body using createRfqSchema
        // TODO: Create RFQ in database
        // TODO: Return created RFQ
        return new Response(
          JSON.stringify({ message: 'Submit RFQ placeholder' }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
