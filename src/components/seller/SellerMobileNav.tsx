import { Link, useLocation } from '@tanstack/react-router'
import {
  BarChart3,
  Home,
  Package,
  ShoppingCart,
  User,
} from 'lucide-react'

const navItems = [
  { label: 'Home', path: '/seller/dashboard', icon: Home },
  { label: 'Orders', path: '/seller/orders', icon: ShoppingCart },
  { label: 'Products', path: '/seller/products', icon: Package },
  { label: 'Analytics', path: '/seller/analytics', icon: BarChart3 },
  { label: 'Profile', path: '/seller/profile', icon: User },
]

export function SellerMobileNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-3 py-2 lg:hidden">
      <div className="flex items-center justify-between">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 text-xs ${
                isActive ? 'text-orange-600' : 'text-slate-500'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
