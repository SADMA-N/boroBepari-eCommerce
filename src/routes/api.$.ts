import { createFileRoute } from '@tanstack/react-router'
import app from '@/api'

async function handle({ request }: { request: Request }) {
  return app.fetch(request)
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
})
