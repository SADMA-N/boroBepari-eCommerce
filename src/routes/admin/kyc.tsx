import { createFileRoute } from '@tanstack/react-router'
import { AdminKYCPage } from '@/components/admin'

export const Route = createFileRoute('/admin/kyc')({
  component: AdminKYCPage,
})
