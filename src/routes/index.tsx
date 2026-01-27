import { createFileRoute } from '@tanstack/react-router'
import HeroBanner from '../components/HeroBanner'
import CategorySidebar, { CategoryList } from '../components/CategorySidebar'
import FeaturedProductsGrid from '../components/FeaturedProductsGrid'
import PopularSuppliers from '../components/PopularSuppliers'
import PromoBanners, { PromoStrip, FrequentlySearched } from '../components/PromoBanner'
import Footer from '../components/Footer'
import {
  getFeaturedProducts,
  getNewArrivals,
  getTopRanking,
  mockCategories,
  frequentlySearched,
} from '../data/mock-products'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
  const featuredProducts = getFeaturedProducts()
  const newArrivals = getNewArrivals()
  const topRanking = getTopRanking()
  const mainCategories = mockCategories.filter((c) => c.parentId === null)

  return (
    <div className="min-h-screen bg-gray-50">
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
        <h2 className="text-xl font-bold text-gray-800 mb-4">Shop by Category</h2>
        <CategoryList categories={mainCategories} />
      </section>

      {/* Popular Suppliers */}
      <section className="max-w-[1440px] mx-auto px-6">
        <PopularSuppliers />
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
          products={featuredProducts.slice(0, 12)}
          title="Recommended for Business"
          subtitle="Products selected based on trending wholesale demands"
          showViewAll
          viewAllLink="/products?featured=true"
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
          viewAllLink="/products?sort=popularity"
        />
      </section>

      {/* New Arrivals */}
      <section className="max-w-[1440px] mx-auto px-6">
        <FeaturedProductsGrid
          products={newArrivals}
          title="New Arrivals"
          subtitle="Fresh products from verified suppliers"
          showViewAll
          viewAllLink="/products?new=true"
        />
      </section>

      {/* Category Discovery */}
      <section className="max-w-[1440px] mx-auto px-6 py-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Discover More Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {mainCategories.map((category) => (
            <a
              key={category.id}
              href={`/categories/${category.slug}`}
              className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow border border-gray-100"
            >
              <div className="text-3xl mb-2">
                {getCategoryEmoji(category.slug)}
              </div>
              <h3 className="font-medium text-gray-800">{category.name}</h3>
            </a>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

// Helper function for category emojis
function getCategoryEmoji(slug: string): string {
  const emojiMap: Record<string, string> = {
    'fashion-apparel': '👕',
    'electronics': '📱',
    'home-living': '🏠',
    'beauty-personal-care': '✨',
    'sports-outdoors': '⚽',
    'food-beverages': '🍜',
    'industrial-supplies': '🏭',
    'office-stationery': '📎',
    'packaging': '📦',
    'raw-materials': '🧱',
  }
  return emojiMap[slug] || '📦'
}
