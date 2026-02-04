import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bell, ChevronDown, LogOut, Menu, Settings, User } from 'lucide-react'
import { useSellerAuth } from '@/contexts/SellerAuthContext'

interface SellerHeaderProps {
  onMenuClick: () => void
}

export function SellerHeader({ onMenuClick }: SellerHeaderProps) {
  const { seller, logout } = useSellerAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side - Menu button (mobile) and logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>
          <Link
            to="/seller/dashboard"
            className="flex items-center gap-2 lg:hidden"
          >
            <span className="font-bold text-lg text-orange-600">BoroBepari</span>
          </Link>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} className="text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <User size={18} className="text-orange-600" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                  {seller?.businessName || 'Seller'}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[120px]">
                  {seller?.email}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {seller?.businessName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {seller?.email}
                  </p>
                  {seller?.kycStatus !== 'approved' && (
                    <span className="inline-block mt-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                      KYC {seller?.kycStatus}
                    </span>
                  )}
                </div>
                <Link
                  to="/seller/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings size={16} />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false)
                    logout()
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
