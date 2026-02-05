import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { AdminLayout } from './AdminLayout'
import type { AdminPermission } from '@/types/admin'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

interface AdminProtectedRouteProps {
  children: React.ReactNode
  requiredPermission?: AdminPermission
  requiredPermissions?: Array<AdminPermission>
  requireAll?: boolean
}

export function AdminProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requireAll = false,
}: AdminProtectedRouteProps) {
  const navigate = useNavigate()
  const { admin, permissions, isLoading, isAuthenticated } = useAdminAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: '/admin/login' })
    }
  }, [isLoading, isAuthenticated, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !admin) {
    return null
  }

  // Check specific permission if required
  const permissionsToCheck =
    requiredPermissions || (requiredPermission ? [requiredPermission] : [])
  if (permissionsToCheck.length > 0 && permissions) {
    const allowed = requireAll
      ? permissionsToCheck.every((perm) => permissions[perm])
      : permissionsToCheck.some((perm) => permissions[perm])

    if (!allowed) {
      return (
        <AdminLayout>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                Access Denied
              </h2>
              <p className="mt-2 text-slate-600">
                You don't have permission to access this page.
              </p>
              <button
                onClick={() => navigate({ to: '/admin/dashboard' })}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </AdminLayout>
      )
    }
  }

  return <AdminLayout>{children}</AdminLayout>
}
