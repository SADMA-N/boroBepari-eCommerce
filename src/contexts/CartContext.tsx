import React, { createContext, useContext, useState, useEffect } from 'react'
import { mockProducts } from '../data/mock-products'

interface CartItem {
  productId: number
  quantity: number
}

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  cartCount: number
  getCartTotal: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (productId: number, quantity: number) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.productId === productId)
      if (existing) {
        return prev.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { productId, quantity }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.productId !== productId))
  }

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    )
  }

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0)

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const product = mockProducts.find((p) => p.id === item.productId)
      return total + (product ? product.price * item.quantity : 0)
    }, 0)
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        cartCount,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
