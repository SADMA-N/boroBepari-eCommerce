import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  Building2,
  FileCheck,
  ShoppingCart,
  AlertTriangle,
  Package,
  BarChart3,
  Settings,
  ScrollText,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import type { AdminRole, AdminPermission } from '@/types/admin'

const NAV_ITEMS: Array<{
  to: string
  label: string
  icon: React.ElementType
  permission?: AdminPermission
}> = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Users Management', icon: Users, permission: 'users.view' },
  { to: '/admin/suppliers', label: 'Suppliers Management', icon: Building2, permission: 'suppliers.view' },
  { to: '/admin/kyc', label: 'KYC Review Queue', icon: FileCheck, permission: 'kyc.review' },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, permission: 'disputes.view' },
  { to: '/admin/products', label: 'Products', icon: Package, permission: 'products.view' },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings, permission: 'settings.view' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, permission: 'logs.view' },
]

function getRoleBadgeColor(role: AdminRole): string {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'admin':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'moderator':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
  }
}

function formatRole(role: AdminRole): string {
  return role
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { admin, logout, can } = useAdminAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-orange-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">BoroBepari</span>
                <span className="block text-xs text-slate-400">Admin Console</span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? 'bg-orange-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User info */}
          {admin && (
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-semibold">
                  {admin.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{admin.name}</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs border ${getRoleBadgeColor(admin.role)}`}
                  >
                    {formatRole(admin.role)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900"
            >
              <Menu size={24} />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>

              {/* Profile dropdown */}
              {admin && (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100"
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-slate-700">
                      {admin.name}
                    </span>
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-medium text-slate-900">{admin.name}</p>
                          <p className="text-xs text-slate-500">{admin.email}</p>
                        </div>
                        <button
                          onClick={() => {
                            logout()
                            setProfileOpen(false)
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
