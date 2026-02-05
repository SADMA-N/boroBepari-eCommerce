import { Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import {
  ChevronDown,
  Heart,
  HelpCircle,
  LogIn,
  LogOut,
  Menu,
  Package,
  ShoppingCart,
  Store,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { mockCategories } from '../data/mock-products'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'
import SearchBar from './SearchBar'
import AuthModal from './AuthModal'
import CartSidebar from './CartSidebar'
import NotificationBell from './NotificationBell'

import { ThemeToggle } from './ThemeToggle'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [redirectPath, setRedirectPath] = useState<string | undefined>(
    undefined,
  )
  const [isCartOpen, setIsCartOpen] = useState(false)

  const { cartCount } = useCart()
  const { wishlistItems } = useWishlist()
  const { isAuthenticated, user, logout } = useAuth()
  const router = useRouter()

  const wishlistCount = wishlistItems.length
  const mainCategories = mockCategories.filter((c) => c.parentId === null)

  const handleAuthRequired = (e: React.MouseEvent, path: string) => {
    if (!isAuthenticated) {
      e.preventDefault()
      setRedirectPath(path)
      setAuthModalOpen(true)
    }
  }

  const handleLogout = () => {
    logout()
    setShowUserDropdown(false)
  }

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectPath={redirectPath}
      />

      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Top Bar */}
      <div className="bg-gray-900 dark:bg-slate-950 text-gray-300 dark:text-gray-400 text-xs py-2 hidden sm:block transition-colors">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Welcome to BoroBepari - Bangladesh's B2B Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/seller/dashboard"
              className="hover:text-orange-400 flex items-center gap-1"
            >
              <Store size={14} />
              Sell on BoroBepari
            </Link>
            <a
              href="/help"
              className="hover:text-orange-400 flex items-center gap-1"
            >
              <HelpCircle size={14} />
              Help
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40 transition-colors border-b dark:border-slate-800">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <Menu size={24} className="text-gray-700 dark:text-gray-300" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold">
                <span className="text-gray-800 dark:text-gray-100">Boro</span>
                <span className="text-orange-500">Bepari</span>
              </h1>
            </Link>

            {/* Categories Dropdown - Desktop */}
            <div
              className="hidden lg:block relative"
              onMouseEnter={() => setShowCategoryDropdown(true)}
              onMouseLeave={() => setShowCategoryDropdown(false)}
            >
              <button className="flex items-center gap-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors">
                <Menu size={18} />
                Categories
                <ChevronDown size={16} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-100 dark:border-slate-800 py-2 z-50 transition-colors">
                  {mainCategories.map((category) => (
                    <Link
                      key={category.id}
                      to="/categories/$categorySlug"
                      params={{ categorySlug: category.slug }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                    >
                      <Package
                        size={18}
                        className="text-gray-400 dark:text-gray-500"
                      />
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="flex-1 hidden sm:block max-w-2xl">
              <SearchBar />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              {/* Wishlist */}
              <a
                href="/wishlist"
                onClick={(e) => handleAuthRequired(e, '/wishlist')}
                className="hidden sm:flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors relative"
              >
                <div className="relative">
                  <Heart size={22} />
                  {isAuthenticated && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-xs">Wishlist</span>
              </a>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs hidden sm:block">Cart</span>
              </button>

              {/* Notifications - Only show if logged in */}
              {isAuthenticated && (
                <div className="hidden sm:flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors relative">
                  <NotificationBell showLabel label="Alerts" />
                </div>
              )}

              <ThemeToggle className="hidden sm:flex" />

              {/* User Account */}
              <div
                className="relative"
                onMouseEnter={() => setShowUserDropdown(true)}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex flex-col items-center text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors focus:outline-none"
                >
                  <User
                    size={22}
                    className={isAuthenticated ? 'text-orange-500' : ''}
                  />
                  <span className="text-xs hidden sm:block">
                    {isAuthenticated && user
                      ? user.name.split(' ')[0]
                      : 'Account'}
                  </span>
                </button>

                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-100 dark:border-slate-800 py-2 z-50 overflow-hidden transition-colors">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/account"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                          >
                            <User size={16} />
                            My Profile
                          </Link>
                          <Link
                            to="/buyer/orders"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                          >
                            <Package size={16} />
                            My Orders
                          </Link>
                        </div>
                        <hr className="border-gray-100 dark:border-slate-800" />
                        <div className="py-1">
                          <button
                            onClick={() => {
                              handleLogout()
                              setShowUserDropdown(false)
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 text-left transition-colors"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Welcome to BoroBepari
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Sign in to start trading
                          </p>
                        </div>
                        <div className="p-3 space-y-2">
                          <button
                            onClick={() => {
                              setAuthModalOpen(true)
                              setShowUserDropdown(false)
                            }}
                            className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                          >
                            <LogIn size={16} />
                            Login
                          </button>
                          <Link
                            to="/register"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex w-full items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <UserPlus size={16} />
                            Register
                          </Link>
                        </div>
                        <hr className="border-gray-100 dark:border-slate-800" />
                        <div className="py-1">
                          <Link
                            to="/buyer/orders"
                            onClick={(e) => {
                              handleAuthRequired(e, '/buyer/orders')
                              setShowUserDropdown(false)
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-orange-950/20 hover:text-orange-600 dark:hover:text-orange-500 transition-colors"
                          >
                            <Package size={16} />
                            My Orders
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="sm:hidden pb-3">
            <SearchBar />
          </div>
        </div>
      </header>

      {/* Mobile Menu Sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 border-r dark:border-slate-800 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-xl font-bold">
            <span className="text-gray-800 dark:text-gray-100">Boro</span>
            <span className="text-orange-500">Bepari</span>
          </h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={24} className="dark:text-gray-400" />
          </button>
        </div>

        <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 font-medium transition-colors"
            >
              Home
            </Link>

            <div className="pt-4 pb-2">
              <span className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Categories
              </span>
            </div>

            {mainCategories.map((category) => (
              <Link
                key={category.id}
                to="/categories/$categorySlug"
                params={{ categorySlug: category.slug }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 transition-colors"
              >
                {category.name}
              </Link>
            ))}

            <hr className="my-4 border-gray-200 dark:border-slate-800" />

            <a
              href="/wishlist"
              onClick={(e) => {
                handleAuthRequired(e, '/wishlist')
                if (isAuthenticated) setIsMobileMenuOpen(false)
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Heart size={20} className="dark:text-gray-400" />
              Wishlist
            </a>

            <a
              href="/buyer/orders"
              onClick={(e) => {
                handleAuthRequired(e, '/buyer/orders')
                if (isAuthenticated) setIsMobileMenuOpen(false)
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <Package size={20} className="dark:text-gray-400" />
              My Orders
            </a>

            <a
              href="/help"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <HelpCircle size={20} className="dark:text-gray-400" />
              Help Center
            </a>

            <hr className="my-4 border-gray-200 dark:border-slate-800" />

            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setAuthModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-lg bg-orange-500 text-white font-medium shadow-sm hover:bg-orange-600 transition-colors"
                >
                  <LogIn size={20} />
                  Sign In
                </button>

                <a
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 mt-2 rounded-lg border border-orange-500 text-orange-500 dark:text-orange-400 font-medium hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                >
                  <UserPlus size={20} />
                  Register
                </a>
              </>
            ) : (
              <button
                onClick={() => {
                  handleLogout()
                  setIsMobileMenuOpen(false)
                }}
                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-medium transition-colors hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            )}
          </div>
        </nav>
      </aside>
    </>
  )
}
