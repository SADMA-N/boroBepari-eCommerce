import { createFileRoute } from '@tanstack/react-router'
import { AdminUsersPage } from '@/components/admin'

export const Route = createFileRoute('/admin/users')({
  component: AdminUsersPage,
})
