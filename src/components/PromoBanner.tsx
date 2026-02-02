import { Link } from '@tanstack/react-router'
import { promoBanners } from '../data/mock-products'
import type { PromoBanner as PromoBannerType } from '../data/mock-products'

interface PromoBannersProps {
  banners?: Array<PromoBannerType>
}

export default function PromoBanners({
  banners = promoBanners,
}: PromoBannersProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {banners.map((banner) => (
        <Link
          key={banner.id}
          to={banner.link}
          className="relative group overflow-hidden rounded-lg"
        >
          <img
            src={banner.image}
            alt={banner.title}
            className="w-full h-32 sm:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-4">
            <h3 className="text-white font-bold text-lg">{banner.title}</h3>
          </div>
        </Link>
      ))}
    </div>
  )
}

// Single promotional banner strip
interface PromoStripProps {
  title: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  bgColor?: string
}

export function PromoStrip({
  title,
  subtitle,
  ctaText = 'Shop Now',
  ctaLink = '/deals',
  bgColor = 'bg-gradient-to-r from-orange-500 to-red-500',
}: PromoStripProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4 sm:p-6`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h3 className="text-white font-bold text-xl sm:text-2xl">{title}</h3>
          {subtitle && (
            <p className="text-white/90 text-sm sm:text-base mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <Link
          to={ctaLink}
          className="bg-white text-orange-600 font-semibold px-6 py-2 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
        >
          {ctaText}
        </Link>
      </div>
    </div>
  )
}

// Frequently searched keywords
interface FrequentlySearchedProps {
  keywords: Array<string>
  title?: string
}

export function FrequentlySearched({
  keywords,
  title = 'Frequently Searched',
}: FrequentlySearchedProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <Link
            key={index}
            to="/search"
            search={{ q: keyword }}
            className="px-3 py-1.5 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 text-gray-700 text-sm rounded-full transition-colors"
          >
            {keyword}
          </Link>
        ))}
      </div>
    </div>
  )
}
