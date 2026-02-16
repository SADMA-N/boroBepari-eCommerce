import { BadgeCheck, Eye, Heart, MessageSquare, Package } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import RFQFormModal from './RFQFormModal'
import { formatBDT } from '@/lib/format'

interface ProductCardProps {
  product: any
  onQuickView?: (product: any) => void
}

export default function ProductCard({
  product,
  onQuickView,
}: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { isAuthenticated } = useAuth()
  const [activeIndex, setActiveIndex] = useState(0)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isRfqOpen, setIsRfqOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Check if image is already loaded (cached) on mount
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setImageLoaded(true)
    }
  }, [activeIndex])

  const handleRequestQuote = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      setIsAuthModalOpen(true)
      return
    }
    setIsRfqOpen(true)
  }

  const isWishlisted = isInWishlist(product.id)
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : null
  const images = product.images
  const hasMultipleImages = images.length > 1

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-slate-800">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-800">
        <Link
          to="/products/$productSlug"
          params={{ productSlug: product.slug }}
          className="block w-full h-full"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-slate-700 animate-pulse" />
          )}
          <img
            ref={imgRef}
            src={images[activeIndex]}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount && (
            <span className="bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
              -{discount}%
            </span>
          )}
          {product.isNew && (
            <span className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded">
              New
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleWishlist(product.id)
            }}
            className={`p-2 rounded-full shadow-md transition-colors ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
            }`}
            aria-label={
              isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'
            }
          >
            <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              onQuickView?.(product)
            }}
            className="p-2 bg-white dark:bg-slate-900 rounded-full shadow-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Quick view"
          >
            <Eye size={16} />
          </button>
        </div>

        {/* Image Dots - visible on hover when multiple images */}
        {hasMultipleImages && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault()
                  setActiveIndex(idx)
                  setImageLoaded(false)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === activeIndex
                    ? 'bg-white dark:bg-slate-100 scale-110 shadow-md'
                    : 'bg-white/60 hover:bg-white/80 dark:bg-slate-100/40 dark:hover:bg-slate-100/70'
                }`}
                aria-label={`View image ${idx + 1}`}
              />
            ))}
          </div>
        )}

        {/* MOQ Badge */}
        <div className="absolute bottom-2 left-2">
          <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 text-xs font-medium px-2 py-1 rounded transition-colors">
            <Package size={12} />
            MOQ: {product.moq} {product.unit}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 transition-colors">
        {/* Supplier Info */}
        <div className="flex items-center gap-1 mb-1">
          {product.supplierVerified && (
            <BadgeCheck size={14} className="text-blue-500" />
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate transition-colors">
            {product.supplierName}
          </span>
        </div>

        {/* Product Name */}
        <Link
          to="/products/$productSlug"
          params={{ productSlug: product.slug }}
          className="block"
        >
          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 line-clamp-2 hover:text-orange-600 dark:hover:text-orange-500 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1 transition-colors">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2 transition-colors">
          <span className="text-lg font-bold text-orange-600">
            {formatBDT(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
              {formatBDT(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-3 grid grid-cols-1 gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleRequestQuote}
            className="flex items-center justify-center gap-2 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <MessageSquare size={16} />
            Request Quote
          </button>
        </div>

        {/* Sold Count */}
        {product.soldCount > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
            {product.soldCount.toLocaleString()} sold
          </p>
        )}
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <RFQFormModal
        isOpen={isRfqOpen}
        onClose={() => setIsRfqOpen(false)}
        productId={product.id}
        productName={product.name}
      />
    </div>
  )
}
