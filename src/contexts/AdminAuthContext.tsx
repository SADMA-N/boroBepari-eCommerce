import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { adminLogin, validateAdminToken } from '@/lib/admin-auth-server'
import type { AdminUser, AdminPermissions } from '@/types/admin'
import { getAdminPermissions } from '@/types/admin'

const ADMIN_TOKEN_KEY = 'admin_token'

interface AdminAuthContextValue {
  admin: AdminUser | null
  permissions: AdminPermissions | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: { email: string; password: string }) => Promise<AdminUser>
  logout: () => void
  getToken: () => string | null
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const permissions = useMemo(() => {
    if (!admin) return null
    return getAdminPermissions(admin.role)
  }, [admin])

  useEffect(() => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }

    validateAdminToken({ data: { token } })
      .then((result) => {
        if (result.valid && result.admin) {
          setAdmin(result.admin)
        } else {
          localStorage.removeItem(ADMIN_TOKEN_KEY)
        }
      })
      .catch(() => {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const login = useCallback(
    async (credentials: { email: string; password: string }) => {
      const result = await adminLogin({ data: credentials })
      localStorage.setItem(ADMIN_TOKEN_KEY, result.token)
      setAdmin(result.admin)
      return result.admin
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    setAdmin(null)
  }, [])

  const getToken = useCallback(() => {
    return localStorage.getItem(ADMIN_TOKEN_KEY)
  }, [])

  const value = useMemo(
    () => ({
      admin,
      permissions,
      isLoading,
      isAuthenticated: !!admin,
      login,
      logout,
      getToken,
    }),
    [admin, permissions, isLoading, login, logout, getToken],
  )

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider')
  }
  return context
}
