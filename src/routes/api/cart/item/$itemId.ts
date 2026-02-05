import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/cart/item/$itemId')({
  server: {
    handlers: {
      PATCH: ({ params }) => {
        // Placeholder: Update item quantity
        return new Response(
          JSON.stringify({
            success: true,
            itemId: params.itemId,
            message: 'Item updated',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
      DELETE: ({ params }) => {
        // Placeholder: Remove item
        return new Response(
          JSON.stringify({
            success: true,
            itemId: params.itemId,
            message: 'Item removed',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        )
      },
    },
  },
})
