import React, { createContext, useContext, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { authClient } from '@/lib/auth-client'
import { checkUserPasswordStatus } from '@/lib/auth-server'

const BUYER_TOKEN_KEY = 'buyer_token'

interface User {
  id: string
  name: string
  email: string
  hasPassword?: boolean
  needsPassword?: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const {
    data: session,
    isPending: isLoading,
    refetch,
  } = authClient.useSession()
  const router = useRouter()
  const user = session?.user as User | null

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(BUYER_TOKEN_KEY)
    }
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.invalidate()
        },
      },
    })
  }

  const refreshUser = async () => {
    await refetch()
  }

  useEffect(() => {
    const verifyPasswordStatus = async () => {
      if (!user || isLoading) return

      // Respect skip cookie - only redirect if not skipped
      const cookies = document.cookie.split(';').reduce(
        (acc, cookie) => {
          const [name, value] = cookie.trim().split('=')
          acc[name] = value
          return acc
        },
        {} as Record<string, string>,
      )

      if (cookies['skippedPasswordSetup']) {
        console.log('[AuthContext] Password setup skipped via cookie')
        return
      }

      try {
        const status = await checkUserPasswordStatus()
        if (status.needsPassword) {
          // Only redirect if NOT on the homepage and NOT already on set-password
          if (window.location.pathname !== '/' && window.location.pathname !== '/auth/set-password') {
            console.log('[AuthContext] Navigating to /auth/set-password')
            router.navigate({ to: '/auth/set-password' })
          }
        }
      } catch (error) {
        console.error('[AuthContext] Status check failed:', error)
      }
    }

    verifyPasswordStatus()
  }, [user?.id, isLoading, router])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (user?.id) {
      localStorage.setItem(BUYER_TOKEN_KEY, user.id)
    } else {
      localStorage.removeItem(BUYER_TOKEN_KEY)
    }
  }, [user?.id])

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated: !!user,
        isLoading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
