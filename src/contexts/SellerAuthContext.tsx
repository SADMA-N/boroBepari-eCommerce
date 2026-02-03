import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'
import type { SellerUser } from '@/types/seller'
import { validateSellerToken, sellerLogin, sellerRegister } from '@/lib/seller-auth-server'
import type { SellerLoginData, SellerRegisterData } from '@/types/seller'

const SELLER_TOKEN_KEY = 'seller_token'

interface SellerAuthContextType {
  seller: SellerUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: SellerLoginData) => Promise<void>
  register: (data: SellerRegisterData) => Promise<void>
  logout: () => void
  refreshSeller: () => Promise<void>
}

const SellerAuthContext = createContext<SellerAuthContextType | undefined>(undefined)

export function SellerAuthProvider({ children }: { children: React.ReactNode }) {
  const [seller, setSeller] = useState<SellerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const getToken = useCallback(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(SELLER_TOKEN_KEY)
  }, [])

  const setToken = useCallback((token: string | null) => {
    if (typeof window === 'undefined') return
    if (token) {
      localStorage.setItem(SELLER_TOKEN_KEY, token)
    } else {
      localStorage.removeItem(SELLER_TOKEN_KEY)
    }
  }, [])

  const refreshSeller = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setSeller(null)
      setIsLoading(false)
      return
    }

    try {
      const result = await validateSellerToken({ data: { token } })
      if (result.valid && result.seller) {
        setSeller(result.seller)
      } else {
        setToken(null)
        setSeller(null)
      }
    } catch (error) {
      console.error('Failed to validate seller token:', error)
      setToken(null)
      setSeller(null)
    } finally {
      setIsLoading(false)
    }
  }, [getToken, setToken])

  const login = useCallback(async (data: SellerLoginData) => {
    const result = await sellerLogin({ data })
    setToken(result.token)
    setSeller(result.seller)
    router.navigate({ to: '/seller/dashboard' })
  }, [setToken, router])

  const register = useCallback(async (data: SellerRegisterData) => {
    const result = await sellerRegister({ data })
    setToken(result.token)
    setSeller(result.seller)
    router.navigate({ to: '/seller/kyc' })
  }, [setToken, router])

  const logout = useCallback(() => {
    setToken(null)
    setSeller(null)
    window.location.href = '/seller/login'
  }, [setToken])

  // Validate token on mount
  useEffect(() => {
    refreshSeller()
  }, [refreshSeller])

  return (
    <SellerAuthContext.Provider
      value={{
        seller,
        isAuthenticated: !!seller,
        isLoading,
        login,
        register,
        logout,
        refreshSeller,
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  )
}

export function useSellerAuth() {
  const context = useContext(SellerAuthContext)
  if (context === undefined) {
    throw new Error('useSellerAuth must be used within a SellerAuthProvider')
  }
  return context
}
