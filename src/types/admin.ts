export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  avatar: string | null
  lastLoginAt: string | null
}

export interface AdminPermissions {
  canManageUsers: boolean
  canManageSuppliers: boolean
  canReviewKYC: boolean
  canManageOrders: boolean
  canResolveDisputes: boolean
  canManageProducts: boolean
  canViewAnalytics: boolean
  canManageSettings: boolean
  canViewAuditLogs: boolean
  canCreateAdmins: boolean
}

export function getAdminPermissions(role: AdminRole): AdminPermissions {
  switch (role) {
    case 'super_admin':
      return {
        canManageUsers: true,
        canManageSuppliers: true,
        canReviewKYC: true,
        canManageOrders: true,
        canResolveDisputes: true,
        canManageProducts: true,
        canViewAnalytics: true,
        canManageSettings: true,
        canViewAuditLogs: true,
        canCreateAdmins: true,
      }
    case 'admin':
      return {
        canManageUsers: true,
        canManageSuppliers: true,
        canReviewKYC: true,
        canManageOrders: true,
        canResolveDisputes: true,
        canManageProducts: true,
        canViewAnalytics: true,
        canManageSettings: false,
        canViewAuditLogs: true,
        canCreateAdmins: false,
      }
    case 'moderator':
      return {
        canManageUsers: false,
        canManageSuppliers: false,
        canReviewKYC: true,
        canManageOrders: false,
        canResolveDisputes: true,
        canManageProducts: false,
        canViewAnalytics: false,
        canManageSettings: false,
        canViewAuditLogs: false,
        canCreateAdmins: false,
      }
  }
}
