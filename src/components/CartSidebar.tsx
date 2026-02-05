/**
 * Cart Sidebar Component
 *
 * A slide-out sidebar that displays the shopping cart contents.
 * Uses the CartContext for state management.
 */

import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useCart } from '../contexts/CartContext'
import { formatCurrency } from '@/lib/cart-utils'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cart, removeItem, updateQuantity, cartCount } = useCart()
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        isOpen
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.body.style.overflow = 'unset'
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.body.style.overflow = 'unset'
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 transition-colors ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } border-l dark:border-slate-800`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-slate-800">
            <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white transition-colors">
              <ShoppingCart size={24} className="text-orange-500" />
              Your Cart ({cartCount})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {cart.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 transition-colors">
                <ShoppingCart
                  size={48}
                  className="mb-4 text-gray-300 dark:text-gray-700 transition-colors"
                />
                <p className="text-lg font-medium">Your cart is empty</p>
                <button
                  onClick={onClose}
                  className="mt-4 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 font-medium transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 border border-gray-200 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800/50 transition-colors"
                >
                  <div className="w-20 h-20 flex-shrink-0 bg-white dark:bg-slate-800 rounded-md overflow-hidden border border-gray-200 dark:border-slate-700 transition-colors">
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1 transition-colors">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                        {formatCurrency(item.unitPrice)} each
                      </p>
                      {item.quantity < item.moq && (
                        <p className="text-xs text-red-500 dark:text-red-400 transition-colors">
                          Min. order: {item.moq} units
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md transition-colors">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-1 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium dark:text-white transition-colors">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-1 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors"
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors">
                          {formatCurrency(item.lineTotal)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="p-4 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-900 transition-colors">
              {/* Subtotal */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <span className="font-medium text-gray-900 dark:text-white transition-colors">
                  {formatCurrency(cart.subtotal)}
                </span>
              </div>

              {/* Delivery */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  Delivery
                </span>
                <span className="font-medium text-gray-900 dark:text-white transition-colors">
                  {cart.deliveryFee === 0
                    ? 'Free'
                    : formatCurrency(cart.deliveryFee)}
                </span>
              </div>

              {/* Discount */}
              {cart.discount > 0 && (
                <div className="flex items-center justify-between mb-2 text-green-600 dark:text-green-400 transition-colors">
                  <span>Discount</span>
                  <span className="font-medium">
                    -{formatCurrency(cart.discount)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between mb-4 pt-2 border-t dark:border-slate-800">
                <span className="text-gray-900 dark:text-white font-bold transition-colors">
                  Total
                </span>
                <span className="text-xl font-bold text-gray-900 dark:text-white transition-colors">
                  {formatCurrency(cart.total)}
                </span>
              </div>

              <a
                href="/cart"
                onClick={onClose}
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-lg font-bold transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
              >
                View Cart & Checkout
              </a>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2 transition-colors">
                Shipping & taxes calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
