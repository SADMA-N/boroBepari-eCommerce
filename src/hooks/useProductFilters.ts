import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { filterProducts } from '../data/mock-products'
import type { MockProduct, ProductFilters } from '../data/mock-products'

interface UseProductFiltersOptions {
  initialFilters?: ProductFilters
  debounceMs?: number
  basePath?: string
}

interface UseProductFiltersReturn {
  filters: ProductFilters
  products: Array<MockProduct>
  isLoading: boolean
  totalCount: number
  setFilters: (filters: ProductFilters) => void
  updateFilter: <TKey extends keyof ProductFilters>(
    key: TKey,
    value: ProductFilters[TKey],
  ) => void
  clearFilters: () => void
  syncToUrl: () => void
}

export function useProductFilters({
  initialFilters = {},
  debounceMs = 300,
  basePath,
}: UseProductFiltersOptions = {}): UseProductFiltersReturn {
  const [filters, setFiltersState] = useState<ProductFilters>(initialFilters)
  const [products, setProducts] = useState<Array<MockProduct>>([])
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  // Update filters with debounce for input fields
  const setFilters = useCallback((newFilters: ProductFilters) => {
    setFiltersState(newFilters)
  }, [])

  // Update a single filter key
  const updateFilter = useCallback(
    <TKey extends keyof ProductFilters>(
      key: TKey,
      value: ProductFilters[TKey],
    ) => {
      setFiltersState((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    [],
  )

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFiltersState({})
  }, [])

  // Sync filters to URL
  const syncToUrl = useCallback(() => {
    if (!basePath) return

    const searchParams: Record<string, string> = {}

    if (filters.search) searchParams.q = filters.search
    if (filters.categoryId) searchParams.category = String(filters.categoryId)
    if (filters.minPrice !== undefined)
      searchParams.minPrice = String(filters.minPrice)
    if (filters.maxPrice !== undefined)
      searchParams.maxPrice = String(filters.maxPrice)
    if (filters.minMoq !== undefined)
      searchParams.minMoq = String(filters.minMoq)
    if (filters.maxMoq !== undefined)
      searchParams.maxMoq = String(filters.maxMoq)
    if (filters.locations?.length)
      searchParams.locations = filters.locations.join(',')
    if (filters.verifiedOnly) searchParams.verifiedOnly = 'true'
    if (filters.sortBy) searchParams.sortBy = filters.sortBy

    navigate({
      to: basePath,
      search: searchParams,
      replace: true,
    })
  }, [basePath, filters, navigate])

  // Debounced filter effect
  useEffect(() => {
    setIsLoading(true)

    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      const filtered = filterProducts(filters)
      setProducts(filtered)
      setIsLoading(false)
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [filters, debounceMs])

  // Sync initial filters
  useEffect(() => {
    setFiltersState(initialFilters)
  }, []) // Only run on mount

  const totalCount = useMemo(() => products.length, [products])

  return {
    filters,
    products,
    isLoading,
    totalCount,
    setFilters,
    updateFilter,
    clearFilters,
    syncToUrl,
  }
}

// Helper to parse URL search params into filters
export function parseSearchParamsToFilters(
  search: Record<string, string | undefined>,
): ProductFilters {
  return {
    search: search.q,
    categoryId: search.category ? Number(search.category) : undefined,
    minPrice: search.minPrice ? Number(search.minPrice) : undefined,
    maxPrice: search.maxPrice ? Number(search.maxPrice) : undefined,
    minMoq: search.minMoq ? Number(search.minMoq) : undefined,
    maxMoq: search.maxMoq ? Number(search.maxMoq) : undefined,
    locations: search.locations ? search.locations.split(',') : undefined,
    verifiedOnly: search.verifiedOnly === 'true',
    sortBy: search.sortBy as ProductFilters['sortBy'],
  }
}

// Helper to convert filters to URL search params
export function filtersToSearchParams(
  filters: ProductFilters,
): Record<string, string> {
  const params: Record<string, string> = {}

  if (filters.search) params.q = filters.search
  if (filters.categoryId) params.category = String(filters.categoryId)
  if (filters.minPrice !== undefined) params.minPrice = String(filters.minPrice)
  if (filters.maxPrice !== undefined) params.maxPrice = String(filters.maxPrice)
  if (filters.minMoq !== undefined) params.minMoq = String(filters.minMoq)
  if (filters.maxMoq !== undefined) params.maxMoq = String(filters.maxMoq)
  if (filters.locations?.length) params.locations = filters.locations.join(',')
  if (filters.verifiedOnly) params.verifiedOnly = 'true'
  if (filters.sortBy) params.sortBy = filters.sortBy

  return params
}
