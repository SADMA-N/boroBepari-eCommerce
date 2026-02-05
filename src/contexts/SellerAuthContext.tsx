import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { SellerLoginData, SellerRegisterData, SellerUser  } from '@/types/seller'
import { sellerGoogleLogin, sellerLogin, sellerRegister, validateSellerToken, updateSellerProfile } from '@/lib/seller-auth-server'

const SELLER_TOKEN_KEY = 'seller_token'

interface SellerAuthContextType {
  seller: SellerUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: SellerLoginData) => Promise<SellerUser>
  googleLogin: (email: string) => Promise<SellerUser>
  updateProfile: (data: Partial<SellerUser>) => Promise<void>
  register: (data: SellerRegisterData) => Promise<void>
  logout: () => void
  refreshSeller: () => Promise<void>
}

const SellerAuthContext = createContext<SellerAuthContextType | undefined>(undefined)

export function SellerAuthProvider({ children }: { children: React.ReactNode }) {
  const [seller, setSeller] = useState<SellerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      if (result.valid) {
        setSeller(result.seller)
      } else {
        setToken(null)
        setSeller(null)
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/seller')) {
          window.location.href = '/seller/login'
        }
      }
    } catch (error) {
      console.error('Failed to validate seller token:', error)
      setToken(null)
      setSeller(null)
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/seller')) {
        window.location.href = '/seller/login'
      }
    } finally {
      setIsLoading(false)
    }
  }, [getToken, setToken])

  const login = useCallback(async (data: SellerLoginData) => {
    const result = await sellerLogin({ data })
    setToken(result.token)
    setSeller(result.seller)
    return result.seller
  }, [setToken])

  const googleLogin = useCallback(async (email: string) => {
    const result = await sellerGoogleLogin({ data: { email } })
    setToken(result.token)
    setSeller(result.seller)
    return result.seller
  }, [setToken])

  const updateProfile = useCallback(async (data: Partial<SellerUser>) => {
    // Only pass fields that updateSellerProfile expects
    const { 
      businessName, businessType, tradeLicenseNumber, businessCategory, 
      yearsInBusiness, fullName, phone, address, city, postalCode,
      bankName, accountHolderName, accountNumber, branchName, routingNumber
    } = data

    const result = await updateSellerProfile({
      data: {
        businessName, businessType, tradeLicenseNumber, businessCategory,
        yearsInBusiness, fullName, phone, address, city, postalCode,
        bankName, accountHolderName, accountNumber, branchName, routingNumber
      }
    })
    setSeller(result.seller)
  }, [])

  const register = useCallback(async (data: SellerRegisterData) => {
    await sellerRegister({ data })
    // No setToken or setSeller here, as account is pending email verification
  }, [])

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
        googleLogin,
        updateProfile,
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
