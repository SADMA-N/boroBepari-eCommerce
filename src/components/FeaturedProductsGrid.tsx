import ProductCard from './ProductCard'

interface FeaturedProductsGridProps {
  products: Array<any>
  title?: string
  subtitle?: string
  showViewAll?: boolean
  viewAllLink?: string
  onQuickView?: (product: any) => void
}

export default function FeaturedProductsGrid({
  products,
  title,
  subtitle,
  showViewAll = false,
  viewAllLink = '/products',
  onQuickView,
}: FeaturedProductsGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12 transition-colors">
        <p className="text-gray-500 dark:text-gray-400">No products found</p>
      </div>
    )
  }

  return (
    <section className="py-6">
      {/* Section Header */}
      {(title || showViewAll) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                {subtitle}
              </p>
            )}
          </div>
          {showViewAll && (
            <a
              href={viewAllLink}
              className="text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400 text-sm font-medium transition-colors"
            >
              View All &rarr;
            </a>
          )}
        </div>
      )}

      {/* Products Grid - 6 columns desktop, 4 tablet, 2 mobile */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onQuickView={onQuickView}
          />
        ))}
      </div>
    </section>
  )
}

// Loading skeleton for the grid
export function FeaturedProductsGridSkeleton({
  count = 12,
}: {
  count?: number
}) {
  return (
    <section className="py-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="h-7 w-48 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-5 w-20 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden border border-gray-100 dark:border-slate-800 transition-colors">
      <div className="aspect-square bg-gray-200 dark:bg-slate-800 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-3 w-20 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
        <div className="h-5 w-24 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
      </div>
    </div>
  )
}
