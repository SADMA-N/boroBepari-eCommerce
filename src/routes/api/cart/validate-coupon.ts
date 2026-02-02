import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/cart/validate-coupon')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Placeholder: Validate coupon
        return new Response(JSON.stringify({ 
          valid: true,
          code: 'WELCOME10',
          discount: 10,
          type: 'percentage'
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
