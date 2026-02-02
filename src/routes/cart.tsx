import { Link, createFileRoute } from '@tanstack/react-router'
import {
  ArrowRight,
  BadgeCheck,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { formatBDT, getSupplierById, mockProducts } from '../data/mock-products'
import type { MockProduct } from '../data/mock-products'
import type { CartItem as CartItemType } from '../types/cart'

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

function CartItem({ item }: { item: CartItemType }) {
  const { removeFromCart, updateQuantity } = useCart()
  const product = mockProducts.find((p) => p.id === item.productId)
  
  if (!product) return null

  const supplier = getSupplierById(product.supplierId)
  const quantity = item.quantity

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
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
            <h3 className="text-lg font-medium text-gray-800 hover:text-orange-600 transition-colors">
              <a href={`/products/${product.slug}`}>{product.name}</a>
            </h3>
            <button
              onClick={() => removeFromCart(product.id)}
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
              {formatBDT(product.price * quantity)}
            </span>
            <span className="text-sm text-gray-500">
              ({formatBDT(product.price)} / {product.unit})
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
             <Package size={14} />
             <span>MOQ: {product.moq} {product.unit}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => updateQuantity(product.id, quantity - 1)}
            className="p-2 hover:bg-gray-50 text-gray-600 disabled:opacity-50"
            disabled={quantity <= product.moq}
          >
            <Minus size={16} />
          </button>
          <span className="w-12 text-center font-medium text-gray-700">
            {quantity}
          </span>
          <button
            onClick={() => updateQuantity(product.id, quantity + 1)}
            className="p-2 hover:bg-gray-50 text-gray-600"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CartPage() {
  const { cartItems, getCartTotal } = useCart()
  const cartTotal = getCartTotal()
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <ShoppingCart size={32} className="text-gray-800" />
        <h1 className="text-2xl font-bold text-gray-800">Shopping Cart</h1>
        <span className="text-gray-500 text-lg">({itemCount} items)</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="flex-1">
          {cartItems.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <div className="bg-white p-4 rounded-full inline-block shadow-sm mb-4">
                 <ShoppingCart size={48} className="text-gray-300" />
              </div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
              <a
                href="/"
                className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Start Shopping
              </a>
            </div>
          ) : (
            <div className="grid gap-4">
              {cartItems.map((item) => (
                <CartItem key={item.productId} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div className="lg:w-96">
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 text-sm border-b pb-4 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatBDT(cartTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Estimate</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax Estimate</span>
                  <span>Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-base font-bold text-gray-900">Order Total</span>
                <span className="text-xl font-bold text-orange-600">{formatBDT(cartTotal)}</span>
              </div>

              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                Proceed to Checkout
                <ArrowRight size={20} />
              </button>

              <div className="mt-4 text-xs text-center text-gray-500">
                <p>Secure Checkout - SSL Encrypted</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
