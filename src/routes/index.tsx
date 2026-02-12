import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import HeroBanner from '../components/HeroBanner'
import CategorySidebar, { CategoryList } from '../components/CategorySidebar'
import FeaturedProductsGrid from '../components/FeaturedProductsGrid'
import PopularSuppliers from '../components/PopularSuppliers'
import PromoBanners, {
  FrequentlySearched,
  PromoStrip,
} from '../components/PromoBanner'
import Footer from '../components/Footer'
import QuickViewModal from '../components/QuickViewModal'
import Toast from '../components/Toast'
import { frequentlySearched, mockCategories } from '../data/mock-products'
import {
  getFeaturedProducts,
  getNewArrivals,
  getTopRanking,
  getVerifiedSuppliersList,
} from '@/lib/product-server'
import type { ProductWithSupplier } from '@/lib/product-server'
import { checkUserPasswordStatus } from '@/lib/auth-server'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    try {
      const status = await checkUserPasswordStatus()
      if (status.needsPassword) {
        throw redirect({ to: '/auth/set-password' })
      }
    } catch (e) {
      if ((e as any).status === 307 || (e as any).status === 302) throw e
    }
  },
  loader: async () => {
    const [featured, newArrivals, topRanking, verifiedSuppliers] =
      await Promise.all([
        getFeaturedProducts({ data: 12 }),
        getNewArrivals({ data: 12 }),
        getTopRanking({ data: 12 }),
        getVerifiedSuppliersList(),
      ])
    return { featured, newArrivals, topRanking, verifiedSuppliers }
  },
  component: HomePage,
})

function HomePage() {
  const { featured, newArrivals, topRanking, verifiedSuppliers } =
    Route.useLoaderData()
  const mainCategories = mockCategories.filter((c) => c.parentId === null)

  // Quick View & Toast State
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductWithSupplier | null>(null)
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({
    message: '',
    isVisible: false,
  })

  const handleQuickView = (product: ProductWithSupplier) => {
    setQuickViewProduct(product)
  }

  const handleAddToCart = (product: ProductWithSupplier, quantity: number) => {
    console.log(`Added ${quantity} of ${product.name} to cart`)

    setQuickViewProduct(null)
    setToast({
      message: `Added ${quantity} ${product.unit}(s) of "${product.name}" to cart`,
      isVisible: true,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      {/* Hero Section with Sidebar */}
      <section className="max-w-[1440px] mx-auto px-6 py-4">
        <div className="flex gap-4">
          {/* Category Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <CategorySidebar categories={mainCategories} />
          </div>

          {/* Hero Banner */}
          <div className="flex-1">
            <HeroBanner />
          </div>

          {/* Right Sidebar - Frequently Searched */}
          <div className="hidden xl:block w-64 flex-shrink-0 space-y-4">
            <FrequentlySearched keywords={frequentlySearched} />
          </div>
        </div>
      </section>

      {/* Categories Grid - Mobile/Tablet */}
      <section className="lg:hidden max-w-[1440px] mx-auto px-6 py-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Shop by Category
        </h2>
        <CategoryList categories={mainCategories} />
      </section>

      {/* Popular Suppliers */}
      <section className="max-w-[1440px] mx-auto px-6">
        <PopularSuppliers suppliers={verifiedSuppliers} />
      </section>

      {/* Promo Banner Strip */}
      <section className="max-w-[1440px] mx-auto px-6 py-4">
        <PromoStrip
          title="Bulk Order Discount"
          subtitle="Get 15% off on orders above ৳50,000"
          ctaText="Start Ordering"
          ctaLink="/categories"
        />
      </section>

      {/* Promotional Banners */}
      <section className="max-w-[1440px] mx-auto px-6 py-4">
        <PromoBanners />
      </section>

      {/* Featured Products */}
      <section className="max-w-[1440px] mx-auto px-6">
        <FeaturedProductsGrid
          products={featured}
          title="Recommended for Business"
          subtitle="Products selected based on trending wholesale demands"
          showViewAll
          viewAllLink="/search?featured=true"
          onQuickView={handleQuickView}
        />
      </section>

      {/* Second Promo Strip */}
      <section className="max-w-[1440px] mx-auto px-6 py-4">
        <PromoStrip
          title="New Supplier Registration"
          subtitle="Become a verified seller and reach thousands of buyers"
          ctaText="Register Now"
          ctaLink="/sell"
          bgColor="bg-gradient-to-r from-blue-500 to-purple-600"
        />
      </section>

      {/* Top Ranking Products */}
      <section className="max-w-[1440px] mx-auto px-6">
        <FeaturedProductsGrid
          products={topRanking}
          title="Top Ranking Products"
          subtitle="Most ordered products this month"
          showViewAll
          viewAllLink="/search?sortBy=popularity"
          onQuickView={handleQuickView}
        />
      </section>

      {/* New Arrivals */}
      <section className="max-w-[1440px] mx-auto px-6">
        <FeaturedProductsGrid
          products={newArrivals}
          title="New Arrivals"
          subtitle="Fresh products from verified suppliers"
          showViewAll
          viewAllLink="/search?new=true"
          onQuickView={handleQuickView}
        />
      </section>

      {/* Category Discovery */}
      <section className="max-w-[1440px] mx-auto px-6 py-8 transition-colors">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 transition-colors">
          Discover More Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mainCategories.map((category) => (
            <a
              key={category.id}
              href={`/categories/${category.slug}`}
              className="bg-white dark:bg-slate-900 rounded-lg p-4 text-center hover:shadow-md transition-all border border-gray-100 dark:border-slate-800 group"
            >
              <div className="text-3xl mb-2 transition-transform group-hover:scale-110">
                {getCategoryEmoji(category.slug)}
              </div>
              <h3 className="font-medium text-gray-800 dark:text-gray-200 transition-colors group-hover:text-orange-500">
                {category.name}
              </h3>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
      />
    </div>
  )
}

// Helper function for category emojis
function getCategoryEmoji(slug: string): string {
  const emojiMap: Record<string, string> = {
    'fashion-apparel': '👕',
    electronics: '📱',
    'home-living': '🏠',
    'beauty-personal-care': '✨',
    'sports-outdoors': '⚽',
    'food-beverages': '🍜',
    'industrial-supplies': '🏭',
    'office-stationery': '📎',
    packaging: '📦',
    'raw-materials': '🧱',
  }
  return emojiMap[slug] || '📦'
}
