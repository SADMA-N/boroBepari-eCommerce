import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'

export const Route = createFileRoute('/admin')({
  component: AdminRouteWrapper,
})

function AdminRouteWrapper() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  )
}
