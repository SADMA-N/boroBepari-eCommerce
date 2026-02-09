import { Link } from '@tanstack/react-router'
import {
  Boxes,
  Briefcase,
  ChevronRight,
  Dumbbell,
  Factory,
  Home,
  Package,
  Shirt,
  Smartphone,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { mockCategories } from '../data/mock-products'
import type { MockCategory } from '../data/mock-products'

// Map icon names to Lucide components
const iconMap: Partial<
  Record<string, React.ComponentType<{ size?: number; className?: string }>>
> = {
  Shirt,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Factory,
  Briefcase,
  Package,
  Boxes,
}

interface CategorySidebarProps {
  categories?: Array<MockCategory>
  activeCategoryId?: number
  className?: string
}

export default function CategorySidebar({
  categories = mockCategories.filter((c) => c.parentId === null),
  activeCategoryId,
  className = '',
}: CategorySidebarProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 transition-colors ${className}`}
    >
      <div className="p-3 border-b border-gray-100 dark:border-slate-800">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">
          Categories
        </h3>
      </div>
      <nav className="py-2">
        {categories.map((category) => {
          const IconComponent = iconMap[category.icon] || Package
          const isActive = category.id === activeCategoryId

          return (
            <Link
              key={category.id}
              to="/categories/$categorySlug"
              params={{ categorySlug: category.slug }}
              className={`flex items-center justify-between px-4 py-2.5 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors group ${
                isActive
                  ? 'bg-orange-50 dark:bg-orange-950/30 border-l-2 border-orange-500'
                  : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent
                  size={18}
                  className={`${
                    isActive
                      ? 'text-orange-500'
                      : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-500'
                  }`}
                />
                <span
                  className={`text-sm ${
                    isActive
                      ? 'text-orange-600 dark:text-orange-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                  }`}
                >
                  {category.name}
                </span>
              </div>
              <ChevronRight
                size={16}
                className={`${
                  isActive
                    ? 'text-orange-500'
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-orange-500'
                }`}
              />
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// Compact category list for homepage
export function CategoryList({
  categories = mockCategories.filter((c) => c.parentId === null),
}: {
  categories?: Array<MockCategory>
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {categories.map((category) => {
        const IconComponent = iconMap[category.icon] || Package
        return (
          <Link
            key={category.id}
            to="/categories/$categorySlug"
            params={{ categorySlug: category.slug }}
            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-900 transition-all group"
          >
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-full group-hover:bg-orange-100 dark:group-hover:bg-orange-900/40 transition-colors">
              <IconComponent size={24} className="text-orange-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 text-center font-medium group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              {category.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
