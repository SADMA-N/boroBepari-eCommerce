import { BadgeCheck, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { getVerifiedSuppliers, type MockSupplier } from '../data/mock-products'

interface PopularSuppliersProps {
  suppliers?: MockSupplier[]
  title?: string
}

export default function PopularSuppliers({
  suppliers = getVerifiedSuppliers(),
  title = 'Popular Suppliers',
}: PopularSuppliersProps) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const checkScrollability = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      )
    }
  }

  useEffect(() => {
    checkScrollability()
    window.addEventListener('resize', checkScrollability)
    return () => window.removeEventListener('resize', checkScrollability)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = direction === 'left' ? -300 : 300
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
      setTimeout(checkScrollability, 300)
    }
  }

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full border transition-colors ${
              canScrollLeft
                ? 'border-gray-300 hover:bg-gray-100 text-gray-600'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full border transition-colors ${
              canScrollRight
                ? 'border-gray-300 hover:bg-gray-100 text-gray-600'
                : 'border-gray-200 text-gray-300 cursor-not-allowed'
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {suppliers.map((supplier) => (
          <SupplierCard key={supplier.id} supplier={supplier} />
        ))}
      </div>
    </section>
  )
}

function SupplierCard({ supplier }: { supplier: MockSupplier }) {
  return (
    <a
      href={`/suppliers/${supplier.slug}`}
      className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-orange-200 transition-all"
    >
      <div className="flex items-start gap-3">
        <img
          src={supplier.logo}
          alt={supplier.name}
          className="w-14 h-14 rounded-lg object-cover bg-gray-100"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="font-medium text-gray-800 truncate">{supplier.name}</h3>
            {supplier.verified && (
              <BadgeCheck size={16} className="text-blue-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <MapPin size={12} />
            {supplier.location}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="bg-gray-50 rounded p-2">
          <p className="text-lg font-semibold text-orange-500">
            {supplier.responseRate}%
          </p>
          <p className="text-xs text-gray-500">Response</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <p className="text-lg font-semibold text-green-500">
            {supplier.onTimeDelivery}%
          </p>
          <p className="text-xs text-gray-500">On-time</p>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        {supplier.yearsInBusiness}+ years in business
      </p>
    </a>
  )
}
