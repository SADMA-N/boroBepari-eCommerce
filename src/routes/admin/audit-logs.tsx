import { createFileRoute } from '@tanstack/react-router'
import { AdminAuditLogsPage } from '@/components/admin'

export const Route = createFileRoute('/admin/audit-logs')({
  component: AdminAuditLogsPage,
})
