/**
 * Cart Page
 *
 * Displays the shopping cart with:
 * - Items grouped by supplier
 * - Quantity controls with direct input
 * - MOQ validation with quick-fix actions
 * - Coupon code validation via API
 * - Order summary with checkout button
 * - Responsive design with sticky checkout on mobile
 * - Server-side stock and price validation
 */

import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Minus,
  Package,
  Percent,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useCart } from '../contexts/CartContext'
import { getSupplierById } from '../data/mock-products'
import { formatCurrency } from '@/lib/cart-utils'
import { useCouponValidation } from '@/hooks/useCouponValidation'
import type { CartItem as CartItemType, SupplierBreakdown, CartValidation } from '@/types/cart'
import { validateCartServer } from '@/lib/cart-actions'
import Toast from '@/components/Toast'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

// ============================================================================ 
// Server Validation Banner
// ============================================================================ 

interface ServerValidationBannerProps {
  changes: Array<{ itemId: string; type: 'price' | 'stock' | 'removed'; message: string }>
  onDismiss: () => void
}

function ServerValidationBanner({ changes, onDismiss }: ServerValidationBannerProps) {
  if (changes.length === 0) return null

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
      <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
      <div className="flex-1">
        <h3 className="font-bold text-yellow-800 text-sm">Cart Updated</h3>
        <ul className="mt-1 space-y-1">
          {changes.map((change, idx) => (
            <li key={idx} className="text-sm text-yellow-700">
              {change.message}
            </li>
          ))}
        </ul>
        <p className="text-xs text-yellow-600 mt-2">
          Please review your cart items before proceeding.
        </p>
      </div>
      <button 
        onClick={onDismiss}
        className="text-yellow-500 hover:text-yellow-700"
        aria-label="Dismiss warning"
      >
        <X size={18} />
      </button>
    </div>
  )
}

// ============================================================================ 
// MOQ Warning Banner Component
// ============================================================================ 

interface MoqWarningBannerProps {
  validation: CartValidation
  items: CartItemType[]
  onFixAll: () => void
  onRemoveItem: (itemId: string) => void
}

function MoqWarningBanner({ validation, items, onFixAll, onRemoveItem }: MoqWarningBannerProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Get items that violate MOQ
  const violatingItems = useMemo(() => {
    return validation.itemValidations
      .filter((v) => v.errors.moqError)
      .map((v) => {
        const item = items.find((i) => i.id === v.itemId)
        return item ? { ...v, item } : null
      })
      .filter(Boolean) as Array<{ itemId: string; errors: { moqError?: string }; item: CartItemType }>
  }, [validation.itemValidations, items])

  // Group by supplier
  const groupedBySupplier = useMemo(() => {
    const groups: Record<number, { supplier: ReturnType<typeof getSupplierById>; items: typeof violatingItems }> = {}

    violatingItems.forEach((v) => {
      const supplierId = v.item.supplierId
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplier: getSupplierById(supplierId),
          items: [],
        }
      }
      groups[supplierId].items.push(v)
    })

    return Object.values(groups)
  }, [violatingItems])

  if (violatingItems.length === 0) return null

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl overflow-hidden shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-red-100/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="moq-warning-content"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle size={24} className="text-red-600" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-red-800">
              Cannot Proceed to Checkout
            </h3>
            <p className="text-sm text-red-600">
              {violatingItems.length} {violatingItems.length === 1 ? 'item doesn\'t' : 'items don\'t'} meet minimum order quantity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFixAll()
            }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Zap size={16} />
            Fix All MOQ Issues
          </button>
          {isExpanded ? (
            <ChevronUp size={20} className="text-red-400" />
          ) : (
            <ChevronDown size={20} className="text-red-400" />
          )}
        </div>
      </button>

      {/* Expandable Content */}
      <div 
        id="moq-warning-content"
        className={`
          transition-all duration-300 ease-in-out overflow-hidden
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Mobile Fix All Button */}
          <button
            onClick={onFixAll}
            className="sm:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Zap size={16} />
            Fix All MOQ Issues
          </button>

          {/* Grouped Items */}
          {groupedBySupplier.map(({ supplier, items: supplierItems }) => (
            <div key={supplier?.id || 'unknown'} className="bg-white rounded-lg border border-red-100 overflow-hidden">
              {/* Supplier Header */}
              <div className="px-3 py-2 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <Store size={14} className="text-red-500" />
                <span className="text-sm font-medium text-red-800">
                  {supplier?.name || 'Unknown Supplier'}
                </span>
                {supplier?.verified && (
                  <BadgeCheck size={14} className="text-blue-500" />
                )}
              </div>

              {/* Items */}
              <div className="divide-y divide-red-50">
                {supplierItems.map(({ item }) => (
                  <div key={item.id} className="p-3 flex items-center gap-3">
                    {/* Thumbnail */}
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-12 h-12 rounded-lg object-cover border"
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to="/products/$productSlug"
                        params={{ productSlug: item.productId.toString() }}
                        className="text-sm font-medium text-gray-900 hover:text-orange-600 line-clamp-1 flex items-center gap-1"
                      >
                        {item.productName}
                        <ExternalLink size={12} className="flex-shrink-0 opacity-50" />
                      </Link>
                      <p className="text-xs text-red-600 mt-0.5">
                        Need <strong>{item.moq - item.quantity}</strong> more (have {item.quantity}, need {item.moq})
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove item"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Help Text */}
          <p className="text-xs text-red-600 text-center pt-2">
            Increase quantities to meet MOQ or remove items to proceed with checkout
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================ 
// Cart Item Row Component
// ============================================================================ 

interface CartItemRowProps {
  item: CartItemType
  showSupplier?: boolean
  onIncreaseToMoq?: (itemId: string, moq: number) => void
}

function CartItemRow({ item, showSupplier = false, onIncreaseToMoq }: CartItemRowProps) {
  const { removeItem, updateQuantity } = useCart()
  const [inputValue, setInputValue] = useState(item.quantity.toString())
  const [isRemoving, setIsRemoving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const supplier = getSupplierById(item.supplierId)
  const isLocked = item.isPriceLocked
  const isBelowMoq = item.quantity < item.moq
  const isLowStock = item.stock < 50
  const moqShortfall = item.moq - item.quantity

  useEffect(() => {
    setInputValue(item.quantity.toString())
  }, [item.quantity])

  const handleDecrement = () => {
    if (item.quantity > 1 && !isLocked) {
      updateQuantity(item.id, item.quantity - 1)
    }
  }

  const handleIncrement = () => {
    if (item.quantity < item.stock && !isLocked) {
      updateQuantity(item.id, item.quantity + 1)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*$/.test(value)) {
      setInputValue(value)
    }
  }

  const handleInputBlur = () => {
    let newQty = parseInt(inputValue, 10)

    if (isNaN(newQty) || newQty < 1) {
      newQty = 1
    } else if (newQty > item.stock) {
      newQty = item.stock
    }

    setInputValue(newQty.toString())
    if (newQty !== item.quantity) {
      updateQuantity(item.id, newQty)
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
  }

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(() => {
      removeItem(item.id)
    }, 300)
  }

  const handleIncreaseToMoq = () => {
    if (item.moq <= item.stock) {
      setIsUpdating(true)
      updateQuantity(item.id, item.moq)
      setTimeout(() => setIsUpdating(false), 500)
      onIncreaseToMoq?.(item.id, item.moq)
    }
  }

  return (
    <div
      className={`
        relative flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border-2
        transition-all duration-300 ease-in-out
        ${isRemoving ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100 scale-100'}
        ${isBelowMoq ? 'border-amber-300 bg-amber-50/30 shadow-amber-100' : 'border-transparent'}
        ${isLocked && !isBelowMoq ? 'border-orange-200 bg-orange-50/20' : ''}
        ${!isBelowMoq && !isLocked ? 'border-gray-100 hover:shadow-md hover:border-gray-200' : ''}
        ${isUpdating ? 'ring-2 ring-green-400 ring-opacity-50' : ''}
      `}
    >
      {/* MOQ Warning Indicator */}
      {isBelowMoq && (
        <div className="absolute -top-2 -left-2 z-10">
          <div className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse">
            <AlertTriangle size={10} />
            MOQ
          </div>
        </div>
      )}

      {/* Product Image */}
      <Link
        to="/products/$productSlug"
        params={{ productSlug: item.productId.toString() }}
        className="w-full sm:w-28 h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative group"
        aria-label={`View details for ${item.productName}`}
      >
        <img
          src={item.image}
          alt={item.productName}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isLocked && item.rfqId && (
          <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-br-lg">
            RFQ #{item.rfqId}
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <Link
              to="/products/$productSlug"
              params={{ productSlug: item.productId.toString() }}
              className="text-base font-medium text-gray-900 hover:text-orange-600 transition-colors line-clamp-2"
            >
              {item.productName}
            </Link>

            {showSupplier && supplier && (
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                {supplier.verified && (
                  <BadgeCheck size={14} className="text-blue-500 flex-shrink-0" />
                )}
                <span className="truncate">{supplier.name}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleRemove}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
            title="Remove from cart"
            aria-label={`Remove ${item.productName} from cart`}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Price */}
        <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-lg font-bold text-orange-600">
            {formatCurrency(item.lineTotal)}
          </span>
          <span className="text-sm text-gray-500">
            ({formatCurrency(item.unitPrice)} each)
          </span>
        </div>

        {/* Badges */}
        <div className="mt-2 flex flex-wrap gap-2">
          {isLocked && item.quoteId && (
            <span className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded-full font-medium">
              <Tag size={12} />
              Quote #{item.quoteId}
            </span>
          )}

          <span className={`
            inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium
            ${isBelowMoq ? 'text-amber-800 bg-amber-200' : 'text-gray-600 bg-gray-100'}
          `}>
            <Package size={12} />
            MOQ: {item.moq}
          </span>

          {isLowStock && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              <AlertTriangle size={12} />
              {item.stock} left
            </span>
          )}
        </div>

        {/* MOQ Warning with Quick Actions */}
        {isBelowMoq && (
          <div className="mt-3 p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  Below Minimum Order Quantity
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  You need <strong>{moqShortfall}</strong> more {moqShortfall === 1 ? 'unit' : 'units'} to meet the minimum of <strong>{item.moq}</strong>
                </p>
              </div>
            </div>

            {/* Quick Fix Actions */}
            <div className="flex flex-wrap gap-2 mt-2">
              {item.moq <= item.stock ? (
                <button
                  onClick={handleIncreaseToMoq}
                  disabled={isLocked}
                  className={`
                    flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2
                    text-sm font-medium rounded-lg transition-all
                    ${isLocked
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow'}
                  `}
                >
                  <ArrowUp size={14} />
                  Set to {item.moq} units
                </button>
              ) : (
                <span className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  Not enough stock (only {item.stock} available)
                </span>
              )}

              <button
                onClick={handleRemove}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-amber-300 text-amber-700 text-sm font-medium rounded-lg hover:bg-amber-50 transition-colors"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-0">
        <div className={`
          flex items-center border-2 rounded-lg overflow-hidden transition-colors
          ${isLocked ? 'bg-gray-100 border-gray-200' : 'bg-white'}
          ${isBelowMoq ? 'border-amber-400' : 'border-gray-200'}
        `}>
          <button
            onClick={handleDecrement}
            className="p-2.5 hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            disabled={item.quantity <= 1 || isLocked}
            title={isLocked ? 'Quantity fixed for quote' : 'Decrease quantity'}
            aria-label="Decrease quantity"
          >
            <Minus size={16} />
          </button>

          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            disabled={isLocked}
            aria-label="Quantity"
            className={`
              w-14 text-center font-bold border-x-2
              focus:outline-none focus:bg-orange-50
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${isBelowMoq ? 'border-amber-300 text-amber-700 bg-amber-50' : 'border-gray-200 text-gray-900'}
            `}
          />

          <button
            onClick={handleIncrement}
            className="p-2.5 hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            disabled={item.quantity >= item.stock || isLocked}
            title={isLocked ? 'Quantity fixed for quote' : 'Increase quantity'}
            aria-label="Increase quantity"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Quick MOQ Button (Compact) */}
        {isBelowMoq && item.moq <= item.stock && !isLocked && (
          <button
            onClick={handleIncreaseToMoq}
            className="hidden sm:flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium"
          >
            <Zap size={12} />
            Quick fix
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================ 
// Supplier Group Component
// ============================================================================ 

interface SupplierGroupProps {
  breakdown: SupplierBreakdown
  isExpanded: boolean
  onToggle: () => void
  onIncreaseToMoq: (itemId: string, moq: number) => void
}

function SupplierGroup({ breakdown, isExpanded, onToggle, onIncreaseToMoq }: SupplierGroupProps) {
  const supplier = getSupplierById(breakdown.supplierId)

  // Count MOQ violations
  const moqViolationCount = breakdown.items.filter((item) => item.quantity < item.moq).length

  return (
    <div className={`
      border rounded-xl bg-white overflow-hidden shadow-sm transition-all
      ${moqViolations > 0 ? 'border-amber-200' : 'border-gray-200'}
    `}>
      {/* Supplier Header */}
      <button
        onClick={onToggle}
        className={`
          w-full flex items-center justify-between p-4 transition-colors
          ${moqViolations > 0 ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-50 hover:bg-gray-100'}
        `}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg shadow-sm ${moqViolations > 0 ? 'bg-amber-100' : 'bg-white'}`}>
            <Store size={20} className={moqViolations > 0 ? 'text-amber-600' : 'text-gray-600'} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {breakdown.supplierName}
              </span>
              {supplier?.verified && (
                <BadgeCheck size={16} className="text-blue-500" />
              )}
              {moqViolations > 0 && (
                <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                  {moqViolations} MOQ {moqViolations === 1 ? 'issue' : 'issues'}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {breakdown.itemCount} item{breakdown.itemCount > 1 ? 's' : ''} ·
              Subtotal: {formatCurrency(breakdown.subtotal)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm text-gray-500">Delivery</div>
            <div className="font-medium text-gray-900">
              {breakdown.deliveryFee === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatCurrency(breakdown.deliveryFee)
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Items */}
      <div className={`
        transition-all duration-300 ease-in-out overflow-hidden
        ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="p-4 space-y-3 border-t bg-gray-50/50">
          {breakdown.items.map((item) => (
            <CartItemRow key={item.id} item={item} onIncreaseToMoq={onIncreaseToMoq} />
          ))}
        </div>

        {/* Supplier Footer */}
        <div className="px-4 py-3 border-t bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Truck size={16} />
            <span>
              {breakdown.deliveryFee === 0
                ? 'Free delivery for this supplier'
                : `Delivery: ${formatCurrency(breakdown.deliveryFee)}`}
            </span>
          </div>
          <div className="font-semibold text-gray-900">
            {formatCurrency(breakdown.subtotal + breakdown.deliveryFee)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================ 
// Empty Cart Component
// ============================================================================ 

function EmptyCart() {
  return (
    <div className="text-center py-16 px-4">
      <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
        <ShoppingBag size={48} className="text-gray-300" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">
        Your cart is empty
      </h2>
      <p className="text-gray-500 mb-8 max-w-md mx-auto">
        Looks like you haven\'t added any products yet. Start exploring our catalog to find the best deals for your business.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <ShoppingCart size={20} />
          Start Shopping
        </Link>
        <Link
          to="/search"
          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium border transition-colors"
        >
          Browse Products
        </Link>
      </div>
    </div>
  )
}

// ============================================================================ 
// Coupon Input Component
// ============================================================================ 

function CouponSection() {
  const [couponInput, setCouponInput] = useState('')
  const {
    isValidating,
    error,
    successMessage,
    appliedCoupon,
    couponDescription,
    calculatedDiscount,
    validateAndApply,
    removeCoupon,
    clearError,
    clearSuccess,
  } = useCouponValidation()

  const handleApply = async () => {
    if (!couponInput.trim()) return
    const success = await validateAndApply(couponInput)
    if (success) {
      setCouponInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating) {
      handleApply()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCouponInput(e.target.value.toUpperCase())
    if (error) clearError()
  }

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(clearSuccess, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, clearSuccess])

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Promo Code
      </label>

      {!appliedCoupon && (
        <>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={couponInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter code"
                disabled={isValidating}
                aria-label="Enter coupon code"
                className={`
                  w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm uppercase
                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                  disabled:bg-gray-50 disabled:cursor-not-allowed
                  ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                `}
              />
            </div>
            <button
              onClick={handleApply}
              disabled={isValidating || !couponInput.trim()}
              className={`
                px-5 py-2.5 text-sm font-medium rounded-lg transition-all
                flex items-center gap-2 min-w-[90px] justify-center
                ${isValidating || !couponInput.trim()
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-900 hover:bg-gray-800 text-white'}
              `}
            >
              {isValidating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2" role="alert">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2 font-medium">Available coupons:</p>
            <div className="flex flex-wrap gap-2">
              {['WELCOME10', 'FLAT200', 'FREESHIP', 'BULK15'].map((code) => (
                <button
                  key={code}
                  onClick={() => setCouponInput(code)}
                  className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-md hover:border-orange-300 hover:bg-orange-50 transition-colors"
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {successMessage && !appliedCoupon && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2" role="status">
          <Check size={16} className="text-green-600" />
          <p className="text-sm text-green-700 font-medium">{successMessage}</p>
        </div>
      )}

      {appliedCoupon && (
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles size={20} className="text-green-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-800 text-lg">
                    {appliedCoupon.code}
                  </span>
                  <Check size={18} className="text-green-600" />
                </div>
                <p className="text-sm text-green-700 mt-0.5">
                  {couponDescription || (
                    appliedCoupon.discountType === 'percentage'
                      ? `${appliedCoupon.value}% off your order`
                      : `${formatCurrency(appliedCoupon.value)} off your order`
                  )}
                </p>
                <span className="inline-block mt-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">
                  You save {formatCurrency(calculatedDiscount)}
                </span>
              </div>
            </div>
            <button
              onClick={removeCoupon}
              className="p-1.5 text-green-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Remove coupon"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================ 
// Order Summary Component
// ============================================================================ 

interface OrderSummaryProps {
  cart: ReturnType<typeof useCart>['cart']
  hasValidationErrors: boolean
  moqViolationCount: number
  onCheckout: () => void
}

function OrderSummary({ cart, hasValidationErrors, moqViolationCount, onCheckout }: OrderSummaryProps) {
  const originalTotal = cart.subtotal + cart.deliveryFee
  const hasDiscount = cart.discount > 0

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

        <CouponSection />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({cart.items.length} items)</span>
            <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
          </div>

          <div className="flex justify-between text-gray-600">
            <span className="flex items-center gap-1">
              <Truck size={14} />
              Delivery
              {cart.supplierBreakdown.length > 1 && (
                <span className="text-xs">({cart.supplierBreakdown.length} suppliers)</span>
              )}
            </span>
            <span className="font-medium">
              {cart.deliveryFee === 0 ? (
                <span className="text-green-600">Free</span>
              ) : (
                formatCurrency(cart.deliveryFee)
              )}
            </span>
          </div>

          {hasDiscount && (
            <div className="flex justify-between text-green-600 bg-green-50 -mx-2 px-2 py-2 rounded-lg">
              <span className="flex items-center gap-1 font-medium">
                <Percent size={14} />
                Coupon Discount
              </span>
              <span className="font-bold">-{formatCurrency(cart.discount)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div>
            <span className="text-base font-bold text-gray-900">Total</span>
            {hasDiscount && (
              <p className="text-xs text-gray-500">
                <span className="line-through">{formatCurrency(originalTotal)}</span>
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-orange-600">
              {formatCurrency(cart.total)}
            </span>
            {hasDiscount && (
              <p className="text-xs text-green-600 font-medium">
                You save {formatCurrency(cart.discount)}!
              </p>
            )}
          </div>
        </div>

        {/* MOQ Validation Warning */}
        {hasValidationErrors && moqViolationCount > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  MOQ Requirements Not Met
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {moqViolationCount} {moqViolationCount === 1 ? 'item needs' : 'items need'} quantity adjustment before checkout
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Button */}
        <button
          onClick={!hasValidationErrors ? onCheckout : undefined}
          disabled={hasValidationErrors}
          className={`
            w-full mt-6 py-3.5 rounded-lg font-bold text-white
            flex items-center justify-center gap-2
            transition-all duration-200
            ${hasValidationErrors
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg active:scale-[0.98]'}
          `}
        >
          {hasValidationErrors ? (
            <>
              <AlertTriangle size={20} />
              Fix MOQ Issues to Checkout
            </>
          ) : (
            <>
              Proceed to Checkout
              <ArrowRight size={20} />
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-3">
          Secure checkout · SSL encrypted
        </p>
      </div>

      {cart.supplierBreakdown.length > 1 && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Delivery by Supplier
          </h3>
          <div className="space-y-2">
            {cart.supplierBreakdown.map((supplier) => (
              <div
                key={supplier.supplierId}
                className="flex justify-between text-sm"
              >
                <span className="text-gray-600 truncate mr-2">
                  {supplier.supplierName}
                </span>
                <span className="font-medium text-gray-900 flex-shrink-0">
                  {supplier.deliveryFee === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    formatCurrency(supplier.deliveryFee)
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================ 
// Main Cart Page Component
// ============================================================================ 

function CartPage() {
  const { cart, cartCount, clearCart, validateCartItems, updateQuantity, removeItem } = useCart()
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<number>>(new Set())
  const [serverValidationChanges, setServerValidationChanges] = useState<Array<{ itemId: string; type: 'price' | 'stock' | 'removed'; message: string }>>([])
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false })
  const router = useRouter()

  // Validate on mount and when cart items change (debounced via effect deps)
  // We use a ref to prevent spamming validation on every keystroke if local state updates rapidly,
  // but cart context updates are typically "committed" changes.
  useEffect(() => {
    let isMounted = true
    
    async function validate() {
      if (cart.items.length === 0) return

      try {
        const result = await validateCartServer({
          data: cart.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            id: i.id
          }))
        })

        if (isMounted && !result.valid) {
          setServerValidationChanges(result.changes)
          // Ideally we might auto-update cart here, but for now we warn
        } else if (isMounted) {
          setServerValidationChanges([])
        }
      } catch (err) {
        console.error('Validation failed', err)
      }
    }

    const timer = setTimeout(validate, 1000) // Debounce validation call
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [cart.items]) // Re-validate when cart items change

  useEffect(() => {
    const allSupplierIds = new Set(cart.supplierBreakdown.map((s) => s.supplierId))
    setExpandedSuppliers(allSupplierIds)
  }, [cart.supplierBreakdown.length])

  const validation = validateCartItems()
  const hasValidationErrors = !validation.isValid || serverValidationChanges.some(c => c.type === 'stock' || c.type === 'removed')

  // Count MOQ violations
  const moqViolationCount = useMemo(() => {
    return cart.items.filter((item) => item.quantity < item.moq).length
  }, [cart.items])

  const toggleSupplier = (supplierId: number) => {
    setExpandedSuppliers((prev) => {
      const next = new Set(prev)
      if (next.has(supplierId)) {
        next.delete(supplierId)
      } else {
        next.add(supplierId)
      }
      return next
    })
  }

  // Fix all MOQ issues at once
  const handleFixAllMoq = () => {
    cart.items.forEach((item) => {
      if (item.quantity < item.moq && item.moq <= item.stock && !item.isPriceLocked) {
        updateQuantity(item.id, item.moq)
      }
    })
  }

  const handleIncreaseToMoq = (itemId: string, moq: number) => {
    updateQuantity(itemId, moq)
  }

  const handleCheckout = () => {
    router.navigate({ to: '/checkout' })
  }

  const isSingleSupplier = cart.supplierBreakdown.length === 1

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={() => setToast(prev => ({...prev, isVisible: false}))} 
      />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ShoppingCart size={24} className="text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Shopping Cart
              </h1>
              <p className="text-sm text-gray-500">
                {cartCount} {cartCount === 1 ? 'item' : 'items'}
                {moqViolationCount > 0 && (
                  <span className="text-amber-600 ml-2">
                    · {moqViolationCount} MOQ {moqViolationCount === 1 ? 'issue' : 'issues'}
                  </span>
                )}
              </p>
            </div>
          </div>

          {cart.items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
            >
              <Trash2 size={16} />
              <span className="hidden sm:inline">Clear Cart</span>
            </button>
          )}
        </div>

        {cart.items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
              
              <ServerValidationBanner 
                changes={serverValidationChanges} 
                onDismiss={() => setServerValidationChanges([])} 
              />

              {/* MOQ Warning Banner */}
              {moqViolationCount > 0 && (
                <MoqWarningBanner
                  validation={validation}
                  items={cart.items}
                  onFixAll={handleFixAllMoq}
                  onRemoveItem={removeItem}
                />
              )}

              {/* Multi-Supplier Notice */}
              {!isSingleSupplier && moqViolationCount === 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <Store size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">
                      Multi-Supplier Order
                    </p>
                    <p className="text-sm text-blue-700 mt-0.5">
                      Your cart contains items from {cart.supplierBreakdown.length} different suppliers.
                      Each supplier will ship separately.
                    </p>
                  </div>
                </div>
              )}

              {/* Items grouped by supplier or flat list */}
              {isSingleSupplier ? (
                <div className="bg-white rounded-xl border p-4 space-y-3">
                  {cart.items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      showSupplier
                      onIncreaseToMoq={handleIncreaseToMoq}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.supplierBreakdown.map((breakdown) => (
                    <SupplierGroup
                      key={breakdown.supplierId}
                      breakdown={breakdown}
                      isExpanded={expandedSuppliers.has(breakdown.supplierId)}
                      onToggle={() => toggleSupplier(breakdown.supplierId)}
                      onIncreaseToMoq={handleIncreaseToMoq}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="lg:w-[380px] flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <OrderSummary
                  cart={cart}
                  hasValidationErrors={hasValidationErrors}
                  moqViolationCount={moqViolationCount}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout Bar */}
      {cart.items.length > 0 && (
        <div className={`
          lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40
          ${moqViolationCount > 0 ? 'pb-safe' : ''}
        `}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(cart.total)}
              </p>
              {cart.discount > 0 && (
                <p className="text-xs text-green-600">
                  Saving {formatCurrency(cart.discount)}
                </p>
              )}
            </div>
            <button
              onClick={!hasValidationErrors ? handleCheckout : undefined}
              disabled={hasValidationErrors}
              className={`
                flex-1 max-w-[200px] py-3 rounded-lg font-bold text-white
                flex items-center justify-center gap-2
                transition-all duration-200
                ${hasValidationErrors
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 active:scale-[0.98]'}
              `}
            >
              {hasValidationErrors ? (
                <>
                  <AlertTriangle size={16} />
                  Fix Issues
                </>
              ) : (
                <>
                  Checkout
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
          {moqViolationCount > 0 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t">
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle size={12} />
                {moqViolationCount} MOQ {moqViolationCount === 1 ? 'issue' : 'issues'}
              </p>
              <button
                onClick={handleFixAllMoq}
                className="text-xs text-amber-700 font-medium flex items-center gap-1 hover:text-amber-800"
              >
                <Zap size={12} />
                Fix All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
