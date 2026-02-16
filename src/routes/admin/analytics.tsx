import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardPage } from '@/components/admin'

export const Route = createFileRoute('/admin/analytics')({
  component: AdminDashboardPage,
})
