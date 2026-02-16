import { createFileRoute } from '@tanstack/react-router'
import { AdminOrdersPage } from '@/components/admin'

export const Route = createFileRoute('/admin/orders')({
  component: AdminOrdersPage,
})
