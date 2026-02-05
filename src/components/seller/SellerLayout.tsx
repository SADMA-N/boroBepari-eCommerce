import { useState } from 'react'
import { SellerHeader } from './SellerHeader'
import { SellerSidebar } from './SellerSidebar'
import { SellerMobileNav } from './SellerMobileNav'

interface SellerLayoutProps {
  children: React.ReactNode
}

export function SellerLayout({ children }: SellerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="flex">
        {/* Sidebar */}
        <SellerSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main content area */}
        <div className="flex-1 lg:ml-0">
          {/* Header */}
          <SellerHeader onMenuClick={() => setIsSidebarOpen(true)} />

          {/* Page content */}
          <main className="p-4 lg:p-6 pb-24 lg:pb-6">
            {children}
          </main>
        </div>
      </div>
      <SellerMobileNav />
    </div>
  )
}
