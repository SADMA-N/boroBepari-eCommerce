import { createFileRoute } from '@tanstack/react-router'
import { AdminSuppliersPage } from '@/components/admin'

export const Route = createFileRoute('/admin/suppliers')({
  component: AdminSuppliersPage,
})
