import { Heart, Eye, BadgeCheck, Package } from 'lucide-react'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  formatBDT,
  getSupplierById,
  type MockProduct,
} from '../data/mock-products'
import { useWishlist } from '../contexts/WishlistContext'

interface ProductCardProps {
  product: MockProduct
  onQuickView?: (product: MockProduct) => void
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { toggleWishlist, isInWishlist } = useWishlist()
  const [imageLoaded, setImageLoaded] = useState(false)

  const isWishlisted = isInWishlist(product.id)
  const supplier = getSupplierById(product.supplierId)
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <Link 
          to="/products/$productSlug" 
          params={{ productSlug: product.slug }}
          className="block w-full h-full"
        >
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}
          <img
            src={product.images[0]}
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
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault()
              onQuickView?.(product)
            }}
            className="p-2 bg-white rounded-full shadow-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Quick view"
          >
            <Eye size={16} />
          </button>
        </div>

        {/* MOQ Badge */}
        <div className="absolute bottom-2 left-2">
          <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded">
            <Package size={12} />
            MOQ: {product.moq} {product.unit}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Supplier Info */}
        {supplier && (
          <div className="flex items-center gap-1 mb-1">
            {supplier.verified && (
              <BadgeCheck size={14} className="text-blue-500" />
            )}
            <span className="text-xs text-gray-500 truncate">
              {supplier.name}
            </span>
          </div>
        )}

        {/* Product Name */}
        <Link 
          to="/products/$productSlug"
          params={{ productSlug: product.slug }}
          className="block"
        >
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-orange-600 transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.floor(product.rating)
                      ? 'text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold text-orange-600">
            {formatBDT(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatBDT(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Sold Count */}
        {product.soldCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {product.soldCount.toLocaleString()} sold
          </p>
        )}
      </div>
    </div>
  )
}
