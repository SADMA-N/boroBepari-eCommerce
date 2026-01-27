import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { ChevronRight, SlidersHorizontal, Grid3X3, List, X } from 'lucide-react'
import ProductCard from '../../components/ProductCard'
import FilterSidebar from '../../components/FilterSidebar'
import Footer from '../../components/Footer'
import { FeaturedProductsGridSkeleton } from '../../components/FeaturedProductsGrid'
import {
  getCategoryBySlug,
  filterProducts,
  mockCategories,
  type ProductFilters,
  type MockProduct,
} from '../../data/mock-products'

interface SearchParams {
  minPrice?: string
  maxPrice?: string
  minMoq?: string
  maxMoq?: string
  locations?: string
  verifiedOnly?: string
  sortBy?: string
  page?: string
}

export const Route = createFileRoute('/categories/$categorySlug')({
  component: CategoryPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    minPrice: search.minPrice as string | undefined,
    maxPrice: search.maxPrice as string | undefined,
    minMoq: search.minMoq as string | undefined,
    maxMoq: search.maxMoq as string | undefined,
    locations: search.locations as string | undefined,
    verifiedOnly: search.verifiedOnly as string | undefined,
    sortBy: search.sortBy as string | undefined,
    page: search.page as string | undefined,
  }),
})

function CategoryPage() {
  const { categorySlug } = Route.useParams()
  const search = Route.useSearch()
  const navigate = useNavigate()

  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(false)

  // Get category info
  const category = getCategoryBySlug(categorySlug)

  // Get subcategories
  const subcategories = mockCategories.filter((c) => {
    const parent = mockCategories.find((p) => p.slug === categorySlug)
    return parent && c.parentId === parent.id
  })

  // Parse filters from URL search params
  const filters: ProductFilters = useMemo(() => ({
    categoryId: category?.id,
    minPrice: search.minPrice ? Number(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
    minMoq: search.minMoq ? Number(search.minMoq) : undefined,
    maxMoq: search.maxMoq ? Number(search.maxMoq) : undefined,
    locations: search.locations ? search.locations.split(',') : undefined,
    verifiedOnly: search.verifiedOnly === 'true',
    sortBy: search.sortBy as ProductFilters['sortBy'],
  }), [category?.id, search])

  // Filter products
  const [products, setProducts] = useState<MockProduct[]>([])

  // Debounced filter update
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      const filtered = filterProducts(filters)
      setProducts(filtered)
      setIsLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [filters])

  // Update URL when filters change
  const handleFiltersChange = useCallback((newFilters: ProductFilters) => {
    const newSearch: Record<string, string> = {}

    if (newFilters.minPrice !== undefined) newSearch.minPrice = String(newFilters.minPrice)
    if (newFilters.maxPrice !== undefined) newSearch.maxPrice = String(newFilters.maxPrice)
    if (newFilters.minMoq !== undefined) newSearch.minMoq = String(newFilters.minMoq)
    if (newFilters.maxMoq !== undefined) newSearch.maxMoq = String(newFilters.maxMoq)
    if (newFilters.locations?.length) newSearch.locations = newFilters.locations.join(',')
    if (newFilters.verifiedOnly) newSearch.verifiedOnly = 'true'
    if (newFilters.sortBy) newSearch.sortBy = newFilters.sortBy

    navigate({
      to: '/categories/$categorySlug',
      params: { categorySlug },
      search: newSearch,
      replace: true,
    })
  }, [navigate, categorySlug])

  // Pagination
  const page = search.page ? Number(search.page) : 1
  const productsPerPage = 24
  const totalPages = Math.ceil(products.length / productsPerPage)
  const paginatedProducts = products.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  )

  const handlePageChange = (newPage: number) => {
    navigate({
      to: '/categories/$categorySlug',
      params: { categorySlug },
      search: { ...search, page: String(newPage) },
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Category Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The category you're looking for doesn't exist.
          </p>
          <Link
            to="/"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            &larr; Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-orange-500">
              Home
            </Link>
            <ChevronRight size={14} className="text-gray-400" />
            <Link
              to="/categories/$categorySlug"
              params={{ categorySlug }}
              className="text-gray-800 font-medium"
            >
              {category.name}
            </Link>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800">{category.name}</h1>
          <p className="text-gray-600 mt-1">
            Discover wholesale {category.name.toLowerCase()} products from
            verified suppliers
          </p>

          {/* Subcategories */}
          {subcategories.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  to="/categories/$categorySlug"
                  params={{ categorySlug: sub.slug }}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 text-gray-700 text-sm rounded-full transition-colors"
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Filter Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {/* Results count */}
                <p className="text-sm text-gray-600">
                  <span className="font-medium">{products.length}</span> products
                  found
                </p>

                <div className="flex items-center gap-4">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <SlidersHorizontal size={18} />
                    Filters
                  </button>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded ${
                        viewMode === 'grid'
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <Grid3X3 size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded ${
                        viewMode === 'list'
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <List size={18} />
                    </button>
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    value={filters.sortBy || ''}
                    onChange={(e) =>
                      handleFiltersChange({
                        ...filters,
                        sortBy: e.target.value as ProductFilters['sortBy'] || undefined,
                      })
                    }
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">Sort by: Default</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                    <option value="popularity">Most Popular</option>
                  </select>
                </div>
              </div>

              {/* Active Filters */}
              {(filters.minPrice ||
                filters.maxPrice ||
                filters.minMoq ||
                filters.maxMoq ||
                filters.locations?.length ||
                filters.verifiedOnly) && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {filters.minPrice && (
                    <FilterTag
                      label={`Min: ৳${filters.minPrice}`}
                      onRemove={() =>
                        handleFiltersChange({ ...filters, minPrice: undefined })
                      }
                    />
                  )}
                  {filters.maxPrice && (
                    <FilterTag
                      label={`Max: ৳${filters.maxPrice}`}
                      onRemove={() =>
                        handleFiltersChange({ ...filters, maxPrice: undefined })
                      }
                    />
                  )}
                  {filters.minMoq && (
                    <FilterTag
                      label={`MOQ Min: ${filters.minMoq}`}
                      onRemove={() =>
                        handleFiltersChange({ ...filters, minMoq: undefined })
                      }
                    />
                  )}
                  {filters.maxMoq && (
                    <FilterTag
                      label={`MOQ Max: ${filters.maxMoq}`}
                      onRemove={() =>
                        handleFiltersChange({ ...filters, maxMoq: undefined })
                      }
                    />
                  )}
                  {filters.locations?.map((location) => (
                    <FilterTag
                      key={location}
                      label={location}
                      onRemove={() =>
                        handleFiltersChange({
                          ...filters,
                          locations: filters.locations?.filter((l) => l !== location),
                        })
                      }
                    />
                  ))}
                  {filters.verifiedOnly && (
                    <FilterTag
                      label="Verified Only"
                      onRemove={() =>
                        handleFiltersChange({ ...filters, verifiedOnly: false })
                      }
                    />
                  )}
                  <button
                    onClick={() => handleFiltersChange({})}
                    className="text-sm text-orange-500 hover:text-orange-600"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Products */}
            {isLoading ? (
              <FeaturedProductsGridSkeleton count={12} />
            ) : products.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No products found matching your filters.
                </p>
                <button
                  onClick={() => handleFiltersChange({})}
                  className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
                      : 'space-y-4'
                  }
                >
                  {paginatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-10 h-10 rounded-lg ${
                            page === pageNum
                              ? 'bg-orange-500 text-white'
                              : 'border border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      <FilterSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        className="lg:hidden"
      />

      <Footer />
    </div>
  )
}

function FilterTag({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full">
      {label}
      <button onClick={onRemove} className="hover:text-orange-900">
        <X size={14} />
      </button>
    </span>
  )
}
