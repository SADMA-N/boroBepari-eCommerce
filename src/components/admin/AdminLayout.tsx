import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ScrollText,
  Settings,
  Shield,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import type { AdminPermission, AdminRole } from '@/types/admin'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

const NAV_ITEMS: Array<{
  to: string
  label: string
  icon: React.ElementType
  permission?: AdminPermission
}> = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    to: '/admin/users',
    label: 'Users Management',
    icon: Users,
    permission: 'users.view',
  },
  {
    to: '/admin/suppliers',
    label: 'Suppliers Management',
    icon: Building2,
    permission: 'suppliers.view',
  },
  {
    to: '/admin/kyc',
    label: 'KYC Review Queue',
    icon: FileCheck,
    permission: 'kyc.review',
  },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  {
    to: '/admin/disputes',
    label: 'Disputes',
    icon: AlertTriangle,
    permission: 'disputes.view',
  },
  {
    to: '/admin/products',
    label: 'Products',
    icon: Package,
    permission: 'products.view',
  },
  { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    permission: 'settings.view',
  },
  {
    to: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
    permission: 'logs.view',
  },
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
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 dark:bg-slate-900 transform transition-transform duration-200 ease-in-out lg:translate-x-0 border-r dark:border-slate-800 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-orange-600 shadow-lg shadow-orange-600/20">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold text-white">BoroBepari</span>
                <span className="block text-xs text-slate-400">
                  Admin Console
                </span>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {NAV_ITEMS.filter(
                (item) => !item.permission || can(item.permission),
              ).map((item) => {
                const Icon = item.icon
                const active = isActive(item.to)
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
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
                  <p className="text-sm font-medium text-white truncate">
                    {admin.name}
                  </p>
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
        <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-between h-full px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>

            <div className="flex-1 lg:flex-none" />

            <div className="flex items-center gap-4">
              <ThemeToggle />

              {/* Notifications */}
              <button className="relative p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
              </button>

              {/* Profile dropdown */}
              {admin && (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold transition-colors group-hover:bg-slate-300 dark:group-hover:bg-slate-600">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="hidden sm:block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {admin.name}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-slate-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {profileOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-20 transition-colors animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {admin.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {admin.email}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            logout()
                            setProfileOpen(false)
                          }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-left"
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
        <main className="p-4 lg:p-6 text-slate-900 dark:text-slate-100">
          {children}
        </main>
      </div>
    </div>
  )
}
