import { Link, useLocation } from '@tanstack/react-router'
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  Lock,
  Package,
  Settings,
  ShoppingCart,
  Wallet,
  X,
} from 'lucide-react'
import { useSellerAuth } from '@/contexts/SellerAuthContext'

interface SellerSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const navItems = [
  { label: 'Dashboard', path: '/seller/dashboard', icon: LayoutDashboard },
  { label: 'Products', path: '/seller/products', icon: Package },
  { label: 'Orders', path: '/seller/orders', icon: ShoppingCart },
  { label: 'RFQs', path: '/seller/rfqs', icon: FileText },
  { label: 'Analytics', path: '/seller/analytics', icon: BarChart3 },
  { label: 'Payouts', path: '/seller/payouts', icon: Wallet },
  { label: 'Settings', path: '/seller/profile', icon: Settings },
]

export function SellerSidebar({ isOpen, onClose }: SellerSidebarProps) {
  const location = useLocation()
  const { seller } = useSellerAuth()
  const isVerified = seller?.kycStatus === 'approved'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 z-50
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:z-0 transition-colors
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b dark:border-slate-800 lg:hidden">
          <span className="font-bold text-orange-600">Seller Central</span>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="dark:text-gray-400" />
          </button>
        </div>

        {/* Logo for desktop */}
        <div className="hidden lg:flex items-center h-16 px-6 border-b dark:border-slate-800 transition-colors">
          <Link to="/seller/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-xl text-orange-600">
              BoroBepari
            </span>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium transition-colors">
              Seller
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/seller/dashboard' &&
                location.pathname.startsWith(item.path))
            const Icon = item.icon
            const isRestricted =
              !isVerified &&
              item.path !== '/seller/profile' &&
              item.path !== '/seller/dashboard'

            if (isRestricted) {
              return (
                <div
                  key={item.path}
                  className="flex items-center justify-between px-4 py-3 rounded-lg text-gray-400 cursor-not-allowed group relative"
                  title="Verification required"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </div>
                  <Lock
                    size={14}
                    className="text-gray-300 dark:text-gray-600"
                  />

                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    Verification Required
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-gray-100'
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
