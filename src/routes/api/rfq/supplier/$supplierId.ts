import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/rfq/supplier/$supplierId')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supplierId } = params
        // TODO: Fetch RFQs for supplierId from database
        return new Response(
          JSON.stringify({ message: `RFQs for supplier ${supplierId}` }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
