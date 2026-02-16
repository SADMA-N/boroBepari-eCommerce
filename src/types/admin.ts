export type AdminRole = 'super_admin' | 'admin' | 'moderator'

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  avatar: string | null
  lastLoginAt: string | null
}

export type AdminPermission =
  | 'users.view'
  | 'users.edit'
  | 'users.delete'
  | 'orders.view'
  | 'orders.update'
  | 'suppliers.view'
  | 'suppliers.verify'
  | 'suppliers.suspend'
  | 'kyc.review'
  | 'kyc.approve'
  | 'kyc.reject'
  | 'products.view'
  | 'products.moderate'
  | 'products.delete'
  | 'disputes.view'
  | 'disputes.resolve'
  | 'settings.view'
  | 'settings.edit'
  | 'logs.view'

export type AdminPermissions = Record<AdminPermission, boolean>

const basePermissions: AdminPermissions = {
  'users.view': false,
  'users.edit': false,
  'users.delete': false,
  'orders.view': false,
  'orders.update': false,
  'suppliers.view': false,
  'suppliers.verify': false,
  'suppliers.suspend': false,
  'kyc.review': false,
  'kyc.approve': false,
  'kyc.reject': false,
  'products.view': false,
  'products.moderate': false,
  'products.delete': false,
  'disputes.view': false,
  'disputes.resolve': false,
  'settings.view': false,
  'settings.edit': false,
  'logs.view': false,
}

export function getAdminPermissions(role: AdminRole): AdminPermissions {
  switch (role) {
    case 'super_admin':
      return {
        ...basePermissions,
        'users.view': true,
        'users.edit': true,
        'users.delete': true,
        'orders.view': true,
        'orders.update': true,
        'suppliers.view': true,
        'suppliers.verify': true,
        'suppliers.suspend': true,
        'kyc.review': true,
        'kyc.approve': true,
        'kyc.reject': true,
        'products.view': true,
        'products.moderate': true,
        'products.delete': true,
        'disputes.view': true,
        'disputes.resolve': true,
        'settings.view': true,
        'settings.edit': true,
        'logs.view': true,
      }
    case 'admin':
      return {
        ...basePermissions,
        'users.view': true,
        'users.edit': true,
        'users.delete': true,
        'orders.view': true,
        'orders.update': true,
        'suppliers.view': true,
        'suppliers.verify': true,
        'suppliers.suspend': true,
        'kyc.review': true,
        'kyc.approve': true,
        'kyc.reject': true,
        'products.view': true,
        'products.moderate': true,
        'products.delete': true,
        'disputes.view': true,
        'disputes.resolve': true,
        'settings.view': true,
        'settings.edit': false,
        'logs.view': true,
      }
    case 'moderator':
      return {
        ...basePermissions,
        'orders.view': true,
        'orders.update': false,
        'kyc.review': true,
        'kyc.approve': true,
        'kyc.reject': true,
        'products.view': true,
        'products.moderate': true,
        'products.delete': false,
        'disputes.view': false,
        'disputes.resolve': false,
        'settings.view': false,
        'logs.view': false,
      }
  }
}

export function hasPermission(
  permissions: AdminPermissions | null,
  permission: AdminPermission,
): boolean {
  return !!permissions?.[permission]
}
