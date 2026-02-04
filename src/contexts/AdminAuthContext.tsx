import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { adminLogin, validateAdminToken } from '@/lib/admin-auth-server'
import type { AdminUser, AdminPermissions, AdminPermission } from '@/types/admin'
import { getAdminPermissions, hasPermission } from '@/types/admin'

const ADMIN_TOKEN_KEY = 'admin_token'

interface AdminAuthContextValue {
  admin: AdminUser | null
  permissions: AdminPermissions | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: { email: string; password: string; otp: string }) => Promise<AdminUser>
  logout: () => void
  getToken: () => string | null
  can: (permission: AdminPermission) => boolean
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastActivityRef = useRef<number>(Date.now())

  const SESSION_TIMEOUT_MS = 30 * 60 * 1000

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

  useEffect(() => {
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const interval = window.setInterval(() => {
      if (!admin) return
      const inactiveFor = Date.now() - lastActivityRef.current
      if (inactiveFor > SESSION_TIMEOUT_MS) {
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        setAdmin(null)
      }
    }, 60 * 1000)

    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('scroll', updateActivity)

    const handleBeforeUnload = () => {
      // Auto-logout on close (client-only safeguard).
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('scroll', updateActivity)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [admin])

  const login = useCallback(
    async (credentials: { email: string; password: string; otp: string }) => {
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
      can: (permission: AdminPermission) => hasPermission(permissions, permission),
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
