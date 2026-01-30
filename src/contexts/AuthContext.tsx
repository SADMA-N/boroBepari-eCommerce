import React, { createContext, useContext, useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from '@tanstack/react-router'
import { checkUserPasswordStatus } from '@/lib/auth-server'

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending: isLoading } = authClient.useSession()
  const router = useRouter()
  const user = session?.user as User | null

  const logout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.invalidate()
        },
      },
    })
  }

  useEffect(() => {
    const verifyPasswordStatus = async () => {
        if (!user || isLoading) return;

        // Respect skip cookie - only redirect if not skipped
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=')
            acc[name] = value
            return acc
        }, {} as Record<string, string>)

        if (cookies['skippedPasswordSetup']) {
            console.log("[AuthContext] Password setup skipped via cookie");
            return;
        }

        try {
            const status = await checkUserPasswordStatus()
            if (status.needsPassword) {
                if (window.location.pathname !== '/auth/set-password') {
                    console.log("[AuthContext] Navigating to /auth/set-password");
                    router.navigate({ to: '/auth/set-password' })
                }
            }
        } catch (error) {
            console.error("[AuthContext] Status check failed:", error)
        }
    }
    
    verifyPasswordStatus()
  }, [user?.id, isLoading, router])

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated: !!user,
        isLoading,
        logout,
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
