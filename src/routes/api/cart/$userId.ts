import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/cart/$userId')({
  server: {
    handlers: {
      GET: ({ params }) => {
        // Placeholder: Fetch user cart from DB
        return new Response(JSON.stringify({ 
          items: [], 
          userId: params.userId,
          message: 'Cart fetched' 
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
