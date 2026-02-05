import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  RotateCcw,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { bdLocationsList } from '../data/mock-products'
import type { ProductFilters } from '../data/mock-products'

interface FilterSidebarProps {
  filters: ProductFilters
  onFiltersChange: (filters: ProductFilters) => void
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

export default function FilterSidebar({
  filters,
  onFiltersChange,
  isOpen = true,
  onClose,
  className = '',
}: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['price', 'moq', 'location', 'verification', 'sort']),
  )

  // Local state for range inputs (for debouncing)
  const [localPriceMin, setLocalPriceMin] = useState<string>(
    filters.minPrice?.toString() || '',
  )
  const [localPriceMax, setLocalPriceMax] = useState<string>(
    filters.maxPrice?.toString() || '',
  )
  const [localMoqMin, setLocalMoqMin] = useState<string>(
    filters.minMoq?.toString() || '',
  )
  const [localMoqMax, setLocalMoqMax] = useState<string>(
    filters.maxMoq?.toString() || '',
  )

  // Sync local state with props
  useEffect(() => {
    setLocalPriceMin(filters.minPrice?.toString() || '')
    setLocalPriceMax(filters.maxPrice?.toString() || '')
    setLocalMoqMin(filters.minMoq?.toString() || '')
    setLocalMoqMax(filters.maxMoq?.toString() || '')
  }, [filters])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const handlePriceApply = () => {
    onFiltersChange({
      ...filters,
      minPrice: localPriceMin ? Number(localPriceMin) : undefined,
      maxPrice: localPriceMax ? Number(localPriceMax) : undefined,
    })
  }

  const handleMoqApply = () => {
    onFiltersChange({
      ...filters,
      minMoq: localMoqMin ? Number(localMoqMin) : undefined,
      maxMoq: localMoqMax ? Number(localMoqMax) : undefined,
    })
  }

  const handleLocationChange = (location: string) => {
    const currentLocations = filters.locations || []
    const newLocations = currentLocations.includes(location)
      ? currentLocations.filter((l) => l !== location)
      : [...currentLocations, location]
    onFiltersChange({ ...filters, locations: newLocations })
  }

  const handleVerifiedToggle = () => {
    onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly })
  }

  const handleSortChange = (sortBy: ProductFilters['sortBy']) => {
    onFiltersChange({ ...filters, sortBy })
  }

  const clearAllFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = () => {
    return (
      filters.minPrice !== undefined ||
      filters.maxPrice !== undefined ||
      filters.minMoq !== undefined ||
      filters.maxMoq !== undefined ||
      (filters.locations && filters.locations.length > 0) ||
      filters.verifiedOnly ||
      filters.sortBy
    )
  }

  const sidebarContent = (
    <div className={`bg-white dark:bg-slate-900 transition-colors ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="font-semibold text-gray-800 dark:text-gray-100">Filters</span>
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors"
            >
              <X size={20} className="dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {/* Sort By */}
        <FilterSection
          title="Sort By"
          isExpanded={expandedSections.has('sort')}
          onToggle={() => toggleSection('sort')}
        >
          <div className="space-y-2">
            {[
              { value: undefined, label: 'Default' },
              { value: 'price-asc' as const, label: 'Price: Low to High' },
              { value: 'price-desc' as const, label: 'Price: High to Low' },
              { value: 'newest' as const, label: 'Newest First' },
              { value: 'popularity' as const, label: 'Most Popular' },
            ].map((option) => (
              <label
                key={option.label}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="radio"
                  name="sortBy"
                  checked={filters.sortBy === option.value}
                  onChange={() => handleSortChange(option.value)}
                  className="text-orange-500 focus:ring-orange-500 dark:bg-slate-800 dark:border-slate-700 transition-colors"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{option.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection
          title="Price Range (BDT)"
          isExpanded={expandedSections.has('price')}
          onToggle={() => toggleSection('price')}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localPriceMin}
              onChange={(e) => setLocalPriceMin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
            <span className="text-gray-400 dark:text-gray-600">-</span>
            <input
              type="number"
              placeholder="Max"
              value={localPriceMax}
              onChange={(e) => setLocalPriceMax(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>
          <button
            onClick={handlePriceApply}
            className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded text-sm font-medium transition-all shadow-sm"
          >
            Apply
          </button>
        </FilterSection>

        {/* MOQ Range */}
        <FilterSection
          title="Minimum Order Qty"
          isExpanded={expandedSections.has('moq')}
          onToggle={() => toggleSection('moq')}
        >
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={localMoqMin}
              onChange={(e) => setLocalMoqMin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
            <span className="text-gray-400 dark:text-gray-600">-</span>
            <input
              type="number"
              placeholder="Max"
              value={localMoqMax}
              onChange={(e) => setLocalMoqMax(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
            />
          </div>
          <button
            onClick={handleMoqApply}
            className="mt-2 w-full bg-orange-500 hover:bg-orange-600 text-white py-1.5 rounded text-sm font-medium transition-all shadow-sm"
          >
            Apply
          </button>
        </FilterSection>

        {/* Supplier Location */}
        <FilterSection
          title="Supplier Location"
          isExpanded={expandedSections.has('location')}
          onToggle={() => toggleSection('location')}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {bdLocationsList.map((location) => (
              <label
                key={location}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.locations?.includes(location) || false}
                  onChange={() => handleLocationChange(location)}
                  className="rounded text-orange-500 focus:ring-orange-500 dark:bg-slate-800 dark:border-slate-700 transition-colors"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{location}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Verification Status */}
        <FilterSection
          title="Supplier Verification"
          isExpanded={expandedSections.has('verification')}
          onToggle={() => toggleSection('verification')}
        >
          <label className="flex items-center gap-3 cursor-pointer group">
            <div
              className={`relative w-10 h-6 rounded-full transition-colors ${
                filters.verifiedOnly ? 'bg-orange-500' : 'bg-gray-300 dark:bg-slate-700'
              }`}
              onClick={handleVerifiedToggle}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  filters.verifiedOnly ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
              Verified Suppliers Only
            </span>
          </label>
        </FilterSection>
      </div>
    </div>
  )

  // Mobile overlay
  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Mobile Overlay */}
      {onClose && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          lg:relative lg:block
          fixed inset-y-0 left-0 z-50 w-72
          lg:w-full lg:z-auto
          transform transition-transform duration-300
          translate-x-0
        `}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

interface FilterSectionProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function FilterSection({
  title,
  isExpanded,
  onToggle,
  children,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-100 dark:border-slate-800 pb-4 transition-colors">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left mb-2 group"
      >
        <span className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{title}</span>
        {isExpanded ? (
          <ChevronUp size={18} className="text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown size={18} className="text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isExpanded && <div className="pt-2 animate-in fade-in slide-in-from-top-1 duration-200">{children}</div>}
    </div>
  )
}
