import { createFileRoute } from '@tanstack/react-router'
import { AdminDisputesPage } from '@/components/admin'

export const Route = createFileRoute('/admin/disputes')({
  component: AdminDisputesPage,
})
