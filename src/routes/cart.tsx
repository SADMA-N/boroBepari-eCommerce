/**
 * Cart Page
 *
 * Displays the shopping cart with:
 * - Items grouped by supplier
 * - Quantity controls with direct input
 * - MOQ validation
 * - Coupon code input
 * - Order summary with checkout button
 * - Responsive design with sticky checkout on mobile
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  Truck,
  X,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useCart } from '../contexts/CartContext'
import { getSupplierById } from '../data/mock-products'
import { formatCurrency } from '@/lib/cart-utils'
import type { CartItem as CartItemType, CouponCode, SupplierBreakdown } from '@/types/cart'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

// Demo coupons for testing
const DEMO_COUPONS: Record<string, CouponCode> = {
  WELCOME10: {
    code: 'WELCOME10',
    discountType: 'percentage',
    value: 10,
    minOrderValue: 1000,
    expiryDate: '2026-12-31',
    maxDiscount: 500,
  },
  FLAT200: {
    code: 'FLAT200',
    discountType: 'fixed',
    value: 200,
    minOrderValue: 2000,
    expiryDate: '2026-12-31',
  },
  FREESHIP: {
    code: 'FREESHIP',
    discountType: 'fixed',
    value: 100,
    minOrderValue: 3000,
    expiryDate: '2026-12-31',
  },
}

// ============================================================================
// Cart Item Row Component
// ============================================================================

interface CartItemRowProps {
  item: CartItemType
  showSupplier?: boolean
}

function CartItemRow({ item, showSupplier = false }: CartItemRowProps) {
  const { removeItem, updateQuantity } = useCart()
  const [inputValue, setInputValue] = useState(item.quantity.toString())
  const [isRemoving, setIsRemoving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const supplier = getSupplierById(item.supplierId)
  const isLocked = item.isPriceLocked
  const isBelowMoq = item.quantity < item.moq
  const isLowStock = item.stock < 50

  // Sync input value when quantity changes externally
  useEffect(() => {
    setInputValue(item.quantity.toString())
  }, [item.quantity])

  const handleDecrement = () => {
    if (item.quantity > item.moq && !isLocked) {
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
      newQty = item.moq
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

  return (
    <div
      className={`
        flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-lg border
        transition-all duration-300 ease-in-out
        ${isRemoving ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100 scale-100'}
        ${isBelowMoq ? 'border-red-200 bg-red-50/30' : ''}
        ${isLocked ? 'border-orange-200 bg-orange-50/20' : ''}
        ${!isBelowMoq && !isLocked ? 'hover:shadow-md hover:border-gray-300' : ''}
      `}
    >
      {/* Product Image */}
      <Link
        to="/products/$productSlug"
        params={{ productSlug: item.productId.toString() }}
        className="w-full sm:w-28 h-28 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden relative group"
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

          <span className="inline-flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
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

        {/* MOQ Warning */}
        {isBelowMoq && (
          <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
            <AlertTriangle size={16} className="flex-shrink-0" />
            <span>
              Minimum order is <strong>{item.moq}</strong> units. Please increase quantity.
            </span>
          </div>
        )}
      </div>

      {/* Quantity Controls */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-0">
        <div className={`
          flex items-center border rounded-lg overflow-hidden
          ${isLocked ? 'bg-gray-100' : 'bg-white'}
          ${isBelowMoq ? 'border-red-300' : 'border-gray-200'}
        `}>
          <button
            onClick={handleDecrement}
            className="p-2.5 hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            disabled={item.quantity <= 1 || isLocked}
            title={isLocked ? 'Quantity fixed for quote' : 'Decrease quantity'}
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
            className={`
              w-14 text-center font-medium text-gray-900 border-x
              focus:outline-none focus:bg-orange-50
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${isBelowMoq ? 'border-red-200 text-red-600' : 'border-gray-200'}
            `}
          />

          <button
            onClick={handleIncrement}
            className="p-2.5 hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            disabled={item.quantity >= item.stock || isLocked}
            title={isLocked ? 'Quantity fixed for quote' : 'Increase quantity'}
          >
            <Plus size={16} />
          </button>
        </div>
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
}

function SupplierGroup({ breakdown, isExpanded, onToggle }: SupplierGroupProps) {
  const supplier = getSupplierById(breakdown.supplierId)

  return (
    <div className="border rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Supplier Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Store size={20} className="text-gray-600" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">
                {breakdown.supplierName}
              </span>
              {supplier?.verified && (
                <BadgeCheck size={16} className="text-blue-500" />
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
            <CartItemRow key={item.id} item={item} />
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
        Looks like you haven't added any products yet. Start exploring our catalog to find the best deals for your business.
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
// Order Summary Component
// ============================================================================

interface OrderSummaryProps {
  cart: ReturnType<typeof useCart>['cart']
  couponInput: string
  setCouponInput: (value: string) => void
  couponError: string
  onApplyCoupon: () => void
  onRemoveCoupon: () => void
  hasValidationErrors: boolean
}

function OrderSummary({
  cart,
  couponInput,
  setCouponInput,
  couponError,
  onApplyCoupon,
  onRemoveCoupon,
  hasValidationErrors,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

        {/* Coupon Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Promo Code
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Tag
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase"
                onKeyDown={(e) => e.key === 'Enter' && onApplyCoupon()}
              />
            </div>
            <button
              onClick={onApplyCoupon}
              className="px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Apply
            </button>
          </div>

          {couponError && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} />
              {couponError}
            </p>
          )}

          {cart.appliedCoupon && (
            <div className="flex items-center justify-between mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag size={16} className="text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {cart.appliedCoupon.code}
                </span>
                <span className="text-xs text-green-600">
                  ({cart.appliedCoupon.discountType === 'percentage'
                    ? `${cart.appliedCoupon.value}% off`
                    : `${formatCurrency(cart.appliedCoupon.value)} off`})
                </span>
              </div>
              <button
                onClick={onRemoveCoupon}
                className="p-1 text-green-600 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            Try: WELCOME10, FLAT200, FREESHIP
          </p>
        </div>

        {/* Price Breakdown */}
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

          {cart.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span className="font-medium">-{formatCurrency(cart.discount)}</span>
            </div>
          )}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-base font-bold text-gray-900">Total</span>
          <span className="text-2xl font-bold text-orange-600">
            {formatCurrency(cart.total)}
          </span>
        </div>

        {/* Validation Warning */}
        {hasValidationErrors && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              Some items don't meet the minimum order quantity. Please update quantities before checkout.
            </p>
          </div>
        )}

        {/* Checkout Button */}
        <button
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
          Proceed to Checkout
          <ArrowRight size={20} />
        </button>

        <p className="text-center text-xs text-gray-500 mt-3">
          Secure checkout · SSL encrypted
        </p>
      </div>

      {/* Delivery Breakdown */}
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
  const { cart, cartCount, applyCoupon, removeCoupon, clearCart, validateCartItems } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<number>>(new Set())

  // Initialize all suppliers as expanded
  useEffect(() => {
    const allSupplierIds = new Set(cart.supplierBreakdown.map((s) => s.supplierId))
    setExpandedSuppliers(allSupplierIds)
  }, [cart.supplierBreakdown.length])

  // Check for MOQ validation errors
  const validation = validateCartItems()
  const hasValidationErrors = !validation.isValid

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

  const handleApplyCoupon = () => {
    setCouponError('')
    const code = couponInput.trim().toUpperCase()

    if (!code) {
      setCouponError('Please enter a coupon code')
      return
    }

    const coupon = DEMO_COUPONS[code]
    if (!coupon) {
      setCouponError('Invalid coupon code')
      return
    }

    const result = applyCoupon(coupon)
    if (!result.success) {
      setCouponError(result.error || 'Could not apply coupon')
    } else {
      setCouponInput('')
    }
  }

  // Single supplier - show items directly without grouping
  const isSingleSupplier = cart.supplierBreakdown.length === 1

  return (
    <div className="min-h-screen bg-gray-50">
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
              {/* Multi-Supplier Notice */}
              {!isSingleSupplier && (
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
                    <CartItemRow key={item.id} item={item} showSupplier />
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
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary - Sticky on desktop */}
            <div className="lg:w-[380px] flex-shrink-0">
              <div className="lg:sticky lg:top-24">
                <OrderSummary
                  cart={cart}
                  couponInput={couponInput}
                  setCouponInput={setCouponInput}
                  couponError={couponError}
                  onApplyCoupon={handleApplyCoupon}
                  onRemoveCoupon={removeCoupon}
                  hasValidationErrors={hasValidationErrors}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Checkout Bar */}
      {cart.items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-40">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(cart.total)}
              </p>
            </div>
            <button
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
              Checkout
              <ArrowRight size={18} />
            </button>
          </div>
          {hasValidationErrors && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
              <AlertTriangle size={12} />
              Fix MOQ issues to checkout
            </p>
          )}
        </div>
      )}
    </div>
  )
}
