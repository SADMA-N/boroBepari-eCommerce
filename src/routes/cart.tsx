import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  AlertTriangle,
  Store
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { formatBDT, mockProducts, getSupplierById } from '../data/mock-products'
import type { CartItem as CartItemType } from '../types/cart'
import { useState } from 'react'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartItem({ item }: { item: CartItemType }) {
  const { removeFromCart, updateQuantity } = useCart()
  const product = mockProducts.find((p) => p.id === item.productId)
  const [inputValue, setInputValue] = useState(item.quantity.toString())

  if (!product) return null

  // Ensure local input state syncs with prop changes from other sources
  if (parseInt(inputValue) !== item.quantity && document.activeElement?.id !== `qty-${item.id}`) {
      setInputValue(item.quantity.toString())
  }

  const quantity = item.quantity
  const price = item.customPrice ?? product.price
  const isLocked = item.customPrice !== undefined
  const moqWarning = quantity < item.moq

  const handleBlur = () => {
    let newQty = parseInt(inputValue)
    if (isNaN(newQty) || newQty < 1) newQty = 1
    // If locked, we might restrict changes or allow only if logic permits. 
    // Requirement says "Disable price editing", implies locked line item.
    // But for quantity, we can allow unless it breaks specific quote logic.
    // For now, if locked, we revert to locked quantity or allow updates if logic permits.
    // Let's assume we can update quantity for now unless disabled.
    if (isLocked && newQty !== quantity) {
        // If strict lock, revert
        setInputValue(quantity.toString())
        return
    }
    updateQuantity(item.productId, newQty, item.rfqId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.currentTarget.blur()
    }
  }

  return (
    <div className={`flex flex-col sm:flex-row gap-4 p-4 border-b last:border-b-0 bg-white hover:bg-gray-50/50 transition-colors ${isLocked ? 'bg-orange-50/10' : ''}`}>
      {/* Image */}
      <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative border border-gray-200">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        {isLocked && (
          <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 font-bold rounded-br">
            QUOTE #{item.rfqId}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-800 hover:text-orange-600 transition-colors line-clamp-2">
              <a href={`/products/${product.slug}`}>{product.name}</a>
            </h3>
            <button
              onClick={() => removeFromCart(item.productId, item.rfqId)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title="Remove from cart"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {/* Specs / Variants placeholder */}
          <p className="text-xs text-gray-500 mt-1">Unit: {product.unit}</p>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-bold text-gray-900">
              {formatBDT(price)}
            </span>
            {isLocked && (
               <span className="text-[10px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded font-medium">
                 Locked Price
               </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 sm:mt-0">
           {/* Quantity Controls */}
           <div className="flex flex-col">
              <div className="flex items-center border rounded-md bg-white h-9">
                <button
                  onClick={() => updateQuantity(item.productId, quantity - 1, item.rfqId)}
                  className="px-2.5 h-full hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border-r"
                  disabled={quantity <= 1 || isLocked}
                >
                  <Minus size={14} />
                </button>
                <input 
                  id={`qty-${item.id}`}
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  disabled={isLocked}
                  className="w-12 text-center text-sm font-medium text-gray-700 focus:outline-none disabled:bg-gray-50"
                />
                <button
                  onClick={() => updateQuantity(item.productId, quantity + 1, item.rfqId)}
                  className="px-2.5 h-full hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed border-l"
                  disabled={isLocked}
                >
                  <Plus size={14} />
                </button>
              </div>
              {moqWarning && (
                <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Min: {item.moq}
                </div>
              )}
           </div>

           {/* Line Total */}
           <span className="text-lg font-bold text-gray-900">
             {formatBDT(item.lineTotal)}
           </span>
        </div>
      </div>
    </div>
  )
}

function CartPage() {
  const { cart, cartCount } = useCart()
  
  // Group logic is handled by context/utils, we just render supplierBreakdown
  const hasItems = cart.items.length > 0
  
  // Check if any item violates MOQ
  const hasMoqViolation = cart.items.some(item => item.quantity < item.moq)

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart size={32} className="text-gray-800" />
        <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
        <span className="text-gray-500 text-lg">({cartCount} items)</span>
      </div>

      {!hasItems ? (
        <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-lg">
          <div className="bg-gray-50 p-6 rounded-full inline-block mb-4">
            <ShoppingCart size={48} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 mb-8 max-w-sm mx-auto">
            Browse our marketplace to find wholesale products from top suppliers across Bangladesh.
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
          >
            Start Shopping <ArrowRight size={18} />
          </a>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List - Grouped by Supplier */}
          <div className="flex-1 space-y-6">
            {cart.supplierBreakdown.map((group) => {
               // Mock supplier verification lookup (since group has basic info)
               const supplier = getSupplierById(group.supplierId)
               
               return (
                 <div key={group.supplierId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                   {/* Supplier Header */}
                   <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                     <div className="flex items-center gap-2">
                       <Store size={18} className="text-gray-600" />
                       <span className="font-semibold text-gray-900">{supplier?.name || group.supplierName}</span>
                       {supplier?.verified && <BadgeCheck size={16} className="text-blue-500" />}
                     </div>
                     <div className="text-sm text-gray-500 hidden sm:block">
                       Subtotal: <span className="font-semibold text-gray-900">{formatBDT(group.subtotal)}</span>
                     </div>
                   </div>
                   
                   {/* Items */}
                   <div>
                     {group.items.map((item) => (
                       <CartItem key={item.id} item={item} />
                     ))}
                   </div>
                 </div>
               )
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Summary
              </h2>

              <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatBDT(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  {cart.deliveryFee === 0 ? (
                    <span className="text-green-600">Calculated at checkout</span>
                  ) : (
                    <span>{formatBDT(cart.deliveryFee)}</span>
                  )}
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatBDT(cart.discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-bold text-gray-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-orange-600">
                  {formatBDT(cart.total)}
                </span>
              </div>

              {hasMoqViolation && (
                <div className="mb-4 bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2 text-sm text-red-700">
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                  <p>Some items are below their minimum order quantity (MOQ). Please adjust quantities.</p>
                </div>
              )}

              <button 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={hasMoqViolation}
              >
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Package size={14} />
                <span>Bulk discounts applied where applicable</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}