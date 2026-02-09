import { Outlet, createFileRoute } from '@tanstack/react-router'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import { NotificationProvider } from '@/contexts/NotificationContext'

export const Route = createFileRoute('/admin')({
  component: AdminRouteWrapper,
})

function AdminRouteWrapper() {
  return (
    <AdminAuthProvider>
      <NotificationProvider>
        <Outlet />
      </NotificationProvider>
    </AdminAuthProvider>
  )
}
