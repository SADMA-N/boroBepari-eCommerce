import React, { createContext, useContext, useState, useEffect } from 'react'
import { mockProducts, type MockProduct } from '../data/mock-products'

interface WishlistContextType {
  wishlistIds: number[]
  addToWishlist: (productId: number) => void
  removeFromWishlist: (productId: number) => void
  toggleWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  wishlistItems: MockProduct[]
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('wishlist')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlistIds))
  }, [wishlistIds])

  const addToWishlist = (productId: number) => {
    setWishlistIds((prev) => {
      if (!prev.includes(productId)) {
        return [...prev, productId]
      }
      return prev
    })
  }

  const removeFromWishlist = (productId: number) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId))
  }

  const toggleWishlist = (productId: number) => {
    setWishlistIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const isInWishlist = (productId: number) => {
    return wishlistIds.includes(productId)
  }

  const wishlistItems = wishlistIds
    .map((id) => mockProducts.find((p) => p.id === id))
    .filter((p): p is MockProduct => p !== undefined)

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
