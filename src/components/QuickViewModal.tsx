import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, Check, Minus, Plus, ShoppingCart, X } from 'lucide-react'
import { formatBDT } from '../data/mock-products'
import type { MockProduct} from '../data/mock-products';

interface QuickViewModalProps {
  product: MockProduct | null
  isOpen: boolean
  onClose: () => void
  onAddToCart: (product: MockProduct, quantity: number) => void
}

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState('')
  const [isSample, setIsSample] = useState(false)

  // Reset state when product changes
  useEffect(() => {
    if (product) {
      setQuantity(product.moq)
      setSelectedImage(product.images[0])
      setIsSample(false)
    }
  }, [product])

  if (!isOpen || !product) return null

  const isOutOfStock = product.stock === 0
  const maxQuantity = isSample ? 5 : product.stock
  
  // Calculate price
  const currentPrice = isSample 
    ? (product.samplePrice || product.price) 
    : (product.tieredPricing?.find(t => quantity >= t.minQty && (t.maxQty === null || quantity <= t.maxQty))?.price || product.price)

  const handleQuantityChange = (val: number) => {
    let newQty = val
    const minQty = isSample ? 1 : product.moq
    if (newQty < minQty) newQty = minQty
    if (newQty > maxQuantity) newQty = maxQuantity
    setQuantity(newQty)
  }

  const handleAddToCart = () => {
    onAddToCart(product, quantity)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row animate-in zoom-in-95 duration-200">
        
        {/* Close Button (Mobile: Top Right, Desktop: Top Right) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full shadow-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <X size={24} />
        </button>

        {/* Image Gallery Section */}
        <div className="w-full sm:w-1/2 bg-gray-50 p-6 flex flex-col justify-center relative">
          <div className="aspect-square w-full relative mb-4 flex items-center justify-center">
             <img 
               src={selectedImage} 
               alt={product.name} 
               className="max-h-full max-w-full object-contain mix-blend-multiply"
             />
          </div>
          
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`w-16 h-16 border-2 rounded-lg overflow-hidden flex-shrink-0 ${selectedImage === img ? 'border-orange-500' : 'border-transparent hover:border-gray-300'}`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Details Section */}
        <div className="w-full sm:w-1/2 p-6 flex flex-col h-full overflow-y-auto">
          <div className="flex-1">
            {/* Header */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                  MOQ: {product.moq} {product.unit}s
                </span>
                <span>|</span>
                <span>{product.soldCount} Sold</span>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-100">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">
                  {formatBDT(currentPrice)}
                </span>
                <span className="text-gray-500">/ {product.unit}</span>
              </div>
              {product.originalPrice && (
                <div className="text-sm text-gray-400 line-through mt-1">
                  {formatBDT(product.originalPrice)}
                </div>
              )}
              {isOutOfStock ? (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm font-medium">
                  <AlertCircle size={16} />
                  Out of Stock
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1 text-green-600 text-sm font-medium">
                  <Check size={16} />
                  In Stock ({product.stock} available)
                </div>
              )}
            </div>

            {/* Options */}
            <div className="space-y-6">
              {/* Sample Toggle */}
              {product.hasSample && !isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Order Sample</span>
                  <button 
                    onClick={() => {
                        const newVal = !isSample
                        setIsSample(newVal)
                        setQuantity(newVal ? 1 : product.moq)
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSample ? 'bg-orange-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSample ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              )}

              {/* Quantity Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity ({product.unit}s)
                </label>
                <div className="flex items-center w-full max-w-[200px] border border-gray-300 rounded-lg">
                  <button 
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= (isSample ? 1 : product.moq) || isOutOfStock}
                    className="p-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <Minus size={18} />
                  </button>
                  <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 0)}
                    className="flex-1 text-center border-none focus:ring-0 text-gray-900 font-medium p-0"
                    disabled={isOutOfStock}
                  />
                  <button 
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= maxQuantity || isOutOfStock}
                    className="p-3 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {!isOutOfStock && (
                    <p className="text-xs text-gray-500 mt-1">
                        Min. Order: {isSample ? 1 : product.moq} {product.unit}s
                    </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-200"
            >
              <ShoppingCart size={22} />
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            
            <Link
              to="/products/$productSlug"
              params={{ productSlug: product.slug }}
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-orange-600 font-medium py-2 transition-colors"
            >
              View Full Details <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
