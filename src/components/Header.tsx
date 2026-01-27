import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import {
  Menu,
  X,
  ShoppingCart,
  Heart,
  User,
  ChevronDown,
  Package,
  LogIn,
  UserPlus,
  Store,
  HelpCircle,
} from 'lucide-react'
import SearchBar from './SearchBar'
import { mockCategories } from '../data/mock-products'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const mainCategories = mockCategories.filter((c) => c.parentId === null)

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gray-900 text-gray-300 text-xs py-2 hidden sm:block">
        <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Welcome to BoroBepari - Bangladesh's B2B Marketplace</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/sell" className="hover:text-orange-400 flex items-center gap-1">
              <Store size={14} />
              Sell on BoroBepari
            </a>
            <a href="/help" className="hover:text-orange-400 flex items-center gap-1">
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
                className="hidden sm:flex flex-col items-center text-gray-600 hover:text-orange-500 transition-colors"
              >
                <Heart size={22} />
                <span className="text-xs">Wishlist</span>
              </a>

              {/* Cart */}
              <a
                href="/cart"
                className="relative flex flex-col items-center text-gray-600 hover:text-orange-500 transition-colors"
              >
                <div className="relative">
                  <ShoppingCart size={22} />
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    0
                  </span>
                </div>
                <span className="text-xs hidden sm:block">Cart</span>
              </a>

              {/* User Account */}
              <div
                className="relative"
                onMouseEnter={() => setShowUserDropdown(true)}
                onMouseLeave={() => setShowUserDropdown(false)}
              >
                <button className="flex flex-col items-center text-gray-600 hover:text-orange-500 transition-colors">
                  <User size={22} />
                  <span className="text-xs hidden sm:block">Account</span>
                </button>

                {showUserDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
                    <a
                      href="/login"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50 text-gray-700 hover:text-orange-600"
                    >
                      <LogIn size={16} />
                      Sign In
                    </a>
                    <a
                      href="/register"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50 text-gray-700 hover:text-orange-600"
                    >
                      <UserPlus size={16} />
                      Register
                    </a>
                    <hr className="my-2 border-gray-100" />
                    <a
                      href="/orders"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-orange-50 text-gray-700 hover:text-orange-600"
                    >
                      <Package size={16} />
                      My Orders
                    </a>
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
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-orange-50 text-gray-700"
            >
              <Heart size={20} />
              Wishlist
            </a>

            <a
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
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

            <a
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-orange-500 text-white font-medium"
            >
              <LogIn size={20} />
              Sign In
            </a>

            <a
              href="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-orange-500 text-orange-500 font-medium"
            >
              <UserPlus size={20} />
              Register
            </a>
          </div>
        </nav>
      </aside>
    </>
  )
}
