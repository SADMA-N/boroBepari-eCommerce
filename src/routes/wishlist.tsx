import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  BadgeCheck,
  Minus,
  Package,
  Plus,
  Share2,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useWishlist } from '../contexts/WishlistContext'
import { useCart } from '../contexts/CartContext'
import { formatBDT, getSupplierById } from '../data/mock-products'
import Toast from '../components/Toast'
import type { MockProduct } from '../data/mock-products'

export const Route = createFileRoute('/wishlist')({
  component: WishlistPage,
})

function WishlistItem({ product }: { product: MockProduct }) {
  const { removeFromWishlist } = useWishlist()
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(product.moq)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const supplier = getSupplierById(product.supplierId)

  const handleAddToCart = () => {
    const result = addItem({ productId: product.id, quantity })
    if (result.success) {
      setToastMessage(
        `Added ${quantity} ${product.unit}(s) of "${product.name}" to cart`,
      )
    } else {
      setToastMessage(result.error || 'Failed to add to cart')
    }
    setShowToast(true)
  }

  const increment = () => setQuantity((q) => q + 1)
  const decrement = () =>
    setQuantity((q) => (q > product.moq ? q - 1 : product.moq))

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all">
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
      {/* Image */}
      <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-100 dark:bg-slate-800 rounded-md overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-500 transition-colors">
              <a href={`/products/${product.slug}`}>{product.name}</a>
            </h3>
            <button
              onClick={() => removeFromWishlist(product.id)}
              className="text-muted-foreground hover:text-red-500 transition-colors"
              title="Remove from wishlist"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {supplier && (
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {supplier.verified && (
                <BadgeCheck size={14} className="text-blue-500" />
              )}
              <span>{supplier.name}</span>
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-orange-600 dark:text-orange-500">
              {formatBDT(product.price)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              / {product.unit}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                {formatBDT(product.originalPrice)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <Package size={14} />
            <span>
              MOQ: {product.moq} {product.unit}
            </span>
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${product.stock > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}
            >
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t dark:border-slate-800 sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
        <div className="flex items-center border dark:border-slate-700 rounded-lg overflow-hidden">
          <button
            onClick={decrement}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors"
            disabled={quantity <= product.moq}
          >
            <Minus size={16} />
          </button>
          <span className="w-12 text-center font-medium text-gray-700 dark:text-gray-200 bg-transparent">
            {quantity}
          </span>
          <button
            onClick={increment}
            className="p-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <ShoppingCart size={18} />
          Add to Cart
        </button>
      </div>
    </div>
  )
}

function WishlistPage() {
  const { wishlistItems, wishlistIds } = useWishlist()
  const [shareToastOpen, setShareToastOpen] = useState(false)

  const handleShare = () => {
    // Generate a shareable link (simulated)
    const url = `${window.location.origin}/wishlist?ids=${wishlistIds.join(',')}`
    navigator.clipboard.writeText(url).then(() => {
      setShareToastOpen(true)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <Toast
          message="Wishlist link copied to clipboard!"
          isVisible={shareToastOpen}
          onClose={() => setShareToastOpen(false)}
        />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 transition-colors">
              My Wishlist
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 transition-colors">
              {wishlistItems.length} items saved
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 font-medium transition-all"
            >
              <Share2 size={18} />
              Share Wishlist
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-slate-800 transition-all">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-full inline-block shadow-sm mb-4 transition-colors">
              <HeartIcon
                size={48}
                className="text-gray-300 dark:text-gray-600"
              />
            </div>
            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2 transition-colors">
              Your wishlist is empty
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 transition-colors">
              Save items you want to buy later by clicking the heart icon.
            </p>
            <a
              href="/"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Start Shopping
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {wishlistItems.map((product) => (
              <WishlistItem key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Custom heart icon for empty state to avoid conflict with Lucide import if needed,
// though we can just use the imported one.
function HeartIcon({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  )
}
