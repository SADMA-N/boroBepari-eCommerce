/**
 * Cart Page
 *
 * Displays the shopping cart with full item details, quantity controls,
 * coupon code input, and order summary with checkout button.
 */

import { createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { getSupplierById } from '../data/mock-products'
import { formatCurrency } from '@/lib/cart-utils'
import type { CartItem as CartItemType, CouponCode } from '@/types/cart'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

// Mock coupon for demo purposes
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
}

function CartItemRow({ item }: { item: CartItemType }) {
  const { removeItem, updateQuantity } = useCart()
  const supplier = getSupplierById(item.supplierId)
  const isLocked = item.isPriceLocked

  const handleDecrement = () => {
    const result = updateQuantity(item.id, item.quantity - 1)
    if (!result.success) {
      // Could show a toast here
      console.warn(result.error)
    }
  }

  const handleIncrement = () => {
    const result = updateQuantity(item.id, item.quantity + 1)
    if (!result.success) {
      console.warn(result.error)
    }
  }

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow ${isLocked ? 'border-orange-200 bg-orange-50/10' : ''}`}
    >
      {/* Image */}
      <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
        <img
          src={item.image}
          alt={item.productName}
          className="w-full h-full object-cover"
        />
        {isLocked && item.rfqId && (
          <div className="absolute top-0 left-0 bg-orange-500 text-white text-[10px] px-2 py-0.5 font-bold rounded-br">
            QUOTE #{item.rfqId}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium text-gray-800 hover:text-orange-600 transition-colors">
              <a href={`/products/${item.productId}`}>{item.productName}</a>
            </h3>
            <button
              onClick={() => removeItem(item.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Remove from cart"
            >
              <Trash2 size={18} />
            </button>
          </div>

          {supplier && (
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
              {supplier.verified && (
                <BadgeCheck size={14} className="text-blue-500" />
              )}
              <span>{supplier.name}</span>
            </div>
          )}

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-bold text-orange-600">
              {formatCurrency(item.lineTotal)}
            </span>
            <span className="text-sm text-gray-500">
              ({formatCurrency(item.unitPrice)} each)
            </span>
          </div>

          {isLocked && item.quoteId && (
            <div className="text-xs text-orange-700 bg-orange-100 inline-block px-2 py-1 rounded mt-1 font-medium">
              Price locked from Quote #{item.quoteId}
            </div>
          )}

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <Package size={14} />
            <span>MOQ: {item.moq} units</span>
            {item.quantity < item.moq && (
              <span className="text-red-500 font-medium">
                (Below minimum!)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quantity Controls */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
        <div className="flex items-center border rounded-lg bg-white">
          <button
            onClick={handleDecrement}
            className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={item.quantity <= item.moq || isLocked}
            title={isLocked ? 'Quantity fixed for quote' : ''}
          >
            <Minus size={16} />
          </button>
          <span className="w-12 text-center font-medium text-gray-700">
            {item.quantity}
          </span>
          <button
            onClick={handleIncrement}
            className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={item.quantity >= item.stock || isLocked}
            title={isLocked ? 'Quantity fixed for quote' : ''}
          >
            <Plus size={16} />
          </button>
        </div>
        {item.stock < 50 && (
          <span className="text-xs text-orange-600">
            Only {item.stock} left
          </span>
        )}
      </div>
    </div>
  )
}

function CartPage() {
  const { cart, cartCount, applyCoupon, removeCoupon, clearCart } = useCart()
  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')

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

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShoppingCart size={32} className="text-gray-800" />
          <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
          <span className="text-gray-500 text-lg">({cartCount} items)</span>
        </div>
        {cart.items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Clear Cart
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="flex-1">
          {cart.items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                <ShoppingCart size={48} className="text-gray-300" />
              </div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">
                Your cart is empty
              </h2>
              <p className="text-gray-500 mb-6">
                Looks like you haven't added anything to your cart yet.
              </p>
              <a
                href="/"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Start Shopping
              </a>
            </div>
          ) : (
            <>
              {/* Supplier Breakdown */}
              {cart.supplierBreakdown.length > 1 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Multi-Supplier Order:</strong> Your cart contains
                    items from {cart.supplierBreakdown.length} suppliers. Each
                    supplier ships separately.
                  </p>
                </div>
              )}

              <div className="grid gap-4">
                {cart.items.map((item) => (
                  <CartItemRow key={item.id} item={item} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Order Summary */}
        {cart.items.length > 0 && (
          <div className="lg:w-96">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Summary
              </h2>

              {/* Coupon Input */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter coupon code"
                      className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-xs text-red-500 mt-1">{couponError}</p>
                )}
                {cart.appliedCoupon && (
                  <div className="flex items-center justify-between mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">
                      {cart.appliedCoupon.code} applied
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-green-700 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3 text-sm border-b pb-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cart.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery ({cart.supplierBreakdown.length} supplier{cart.supplierBreakdown.length > 1 ? 's' : ''})</span>
                  <span>
                    {cart.deliveryFee === 0
                      ? 'Free'
                      : formatCurrency(cart.deliveryFee)}
                  </span>
                </div>
                {cart.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(cart.discount)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-bold text-gray-900">
                  Order Total
                </span>
                <span className="text-xl font-bold text-orange-600">
                  {formatCurrency(cart.total)}
                </span>
              </div>

              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <div className="mt-4 text-xs text-center text-gray-500">
                <p>Secure Checkout - SSL Encrypted</p>
              </div>

              {/* Supplier Breakdown */}
              {cart.supplierBreakdown.length > 1 && (
                <div className="mt-6 pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Shipping by Supplier
                  </h3>
                  <div className="space-y-2">
                    {cart.supplierBreakdown.map((supplier) => (
                      <div
                        key={supplier.supplierId}
                        className="flex justify-between text-xs text-gray-600"
                      >
                        <span>{supplier.supplierName}</span>
                        <span>
                          {supplier.deliveryFee === 0
                            ? 'Free'
                            : formatCurrency(supplier.deliveryFee)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
