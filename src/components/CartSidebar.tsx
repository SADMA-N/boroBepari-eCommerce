import { Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useCart } from '../contexts/CartContext'
import { formatBDT, mockProducts } from '../data/mock-products'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const { cartItems, removeFromCart, updateQuantity, getCartTotal } = useCart()
  const sidebarRef = useRef<HTMLDivElement>(null)

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

  const cartProducts = cartItems
    .map((item) => {
      const product = mockProducts.find((p) => p.id === item.productId)
      return { ...product!, quantity: item.quantity }
    })
    .filter((p) => p.id) // Filter out any undefined products just in case

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
        className={`fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart size={24} className="text-orange-500" />
              Your Cart (
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)})
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <ShoppingCart size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">Your cart is empty</p>
                <button
                  onClick={onClose}
                  className="mt-4 text-orange-500 hover:text-orange-600 font-medium"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cartProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex gap-4 p-3 border rounded-lg bg-gray-50"
                >
                  <div className="w-20 h-20 flex-shrink-0 bg-white rounded-md overflow-hidden border">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatBDT(product.price)} / {product.unit}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border bg-white rounded-md">
                        <button
                          onClick={() =>
                            updateQuantity(product.id, product.quantity - 1)
                          }
                          className="p-1 hover:bg-gray-50 text-gray-600"
                          disabled={product.quantity <= product.moq}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {product.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(product.id, product.quantity + 1)
                          }
                          className="p-1 hover:bg-gray-50 text-gray-600"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {cartProducts.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatBDT(getCartTotal())}
                </span>
              </div>
              <a
                href="/cart"
                onClick={onClose}
                className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-lg font-bold transition-colors shadow-lg"
              >
                Checkout
              </a>
              <p className="text-center text-xs text-gray-500 mt-2">
                Shipping & taxes calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
