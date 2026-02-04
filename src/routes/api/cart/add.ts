import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/cart/add')({
  server: {
    handlers: {
      POST: ({ request }) => {
        // Placeholder: Add item to cart
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Item added to cart' 
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
