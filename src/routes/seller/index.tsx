import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/seller/')({
  beforeLoad: () => {
    // Redirect /seller to /seller/dashboard
    throw redirect({ to: '/seller/dashboard' })
  },
  component: () => null,
})
