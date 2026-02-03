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
      <div className="bg-gray-900 text-gray-300 text-xs py-2 hidden sm:block">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Welcome to BoroBepari - Bangladesh's B2B Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/sell"
              className="hover:text-orange-400 flex items-center gap-1"
            >
              <Store size={14} />
              Sell on BoroBepari
            </a>
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
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center h-16 gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              aria-label="Open menu"
            >
              <Menu size={24} className="text-gray-700" />
            </button>

            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold">
                <span className="text-gray-800">Boro</span>
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
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                  {mainCategories.map((category) => (
                    <Link
                      key={category.id}
                      to="/categories/$categorySlug"
                      params={{ categorySlug: category.slug }}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-orange-50 text-gray-700 hover:text-orange-600"
                    >
                      <Package size={18} className="text-gray-400" />
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
                className="hidden sm:flex flex-col items-center text-gray-600 hover:text-orange-500 transition-colors relative"
              >
                <div className="relative">
                  <Heart size={22} />
                  {isAuthenticated && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-xs">Wishlist</span>
              </a>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex flex-col items-center text-gray-600 hover:text-orange-500 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs hidden sm:block">Cart</span>
              </button>

              {/* Notifications - Only show if logged in */}
              {isAuthenticated && (
                <div className="hidden sm:block">
                  <NotificationBell />
                </div>
              )}

              {/* User Account */}
              <div
                className="relative"
                onMouseEnter={() => setShowUserDropdown(true)}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex flex-col items-center text-gray-600 hover:text-orange-500 transition-colors focus:outline-none"
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
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 overflow-hidden">
                    {isAuthenticated ? (
                      <>
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user?.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/account"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <User size={16} />
                            My Profile
                          </Link>
                          <Link
                            to="/buyer/orders"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Package size={16} />
                            My Orders
                          </Link>
                        </div>
                        <hr className="border-gray-100" />
                        <div className="py-1">
                          <button
                            onClick={() => {
                              handleLogout()
                              setShowUserDropdown(false)
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                          >
                            <LogOut size={16} />
                            Sign Out
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">
                            Welcome to BoroBepari
                          </p>
                          <p className="text-xs text-gray-500">
                            Sign in to start trading
                          </p>
                        </div>
                        <div className="p-3 space-y-2">
                          <button
                            onClick={() => {
                              setAuthModalOpen(true)
                              setShowUserDropdown(false)
                            }}
                            className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors"
                          >
                            <LogIn size={16} />
                            Login
                          </button>
                          <Link
                            to="/register"
                            onClick={() => setShowUserDropdown(false)}
                            className="flex w-full items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-semibold hover:bg-gray-50 transition-colors"
                          >
                            <UserPlus size={16} />
                            Register
                          </Link>
                        </div>
                        <hr className="border-gray-100" />
                        <div className="py-1">
                          <Link
                            to="/buyer/orders"
                            onClick={(e) => {
                              handleAuthRequired(e, '/buyer/orders')
                              setShowUserDropdown(false)
                            }}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600"
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
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">
            <span className="text-gray-800">Boro</span>
            <span className="text-orange-500">Bepari</span>
          </h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 overflow-y-auto max-h-[calc(100vh-80px)]">
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-orange-50 text-gray-700 font-medium"
            >
              Home
            </Link>

            <div className="pt-4 pb-2">
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase">
                Categories
              </span>
            </div>

            {mainCategories.map((category) => (
              <Link
                key={category.id}
                to="/categories/$categorySlug"
                params={{ categorySlug: category.slug }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-lg hover:bg-orange-50 text-gray-700"
              >
                {category.name}
              </Link>
            ))}

            <hr className="my-4 border-gray-200" />

            <a
              href="/wishlist"
              onClick={(e) => {
                handleAuthRequired(e, '/wishlist')
                if (isAuthenticated) setIsMobileMenuOpen(false)
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 text-gray-700"
            >
              <Heart size={20} />
              Wishlist
            </a>

            <a
              href="/buyer/orders"
              onClick={(e) => {
                handleAuthRequired(e, '/buyer/orders')
                if (isAuthenticated) setIsMobileMenuOpen(false)
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 text-gray-700"
            >
              <Package size={20} />
              My Orders
            </a>

            <a
              href="/help"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 text-gray-700"
            >
              <HelpCircle size={20} />
              Help Center
            </a>

            <hr className="my-4 border-gray-200" />

            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setAuthModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-lg bg-orange-500 text-white font-medium"
                >
                  <LogIn size={20} />
                  Sign In
                </button>

                <a
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-orange-500 text-orange-500 font-medium"
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
                className="flex w-full items-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 font-medium"
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
