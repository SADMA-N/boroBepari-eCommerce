import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'borobepari-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        return stored
      }
    } catch (e) {
      console.error('Failed to access localStorage:', e)
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = window.document.documentElement

    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme

    // Only update if needed to avoid unnecessary repaints
    if (!root.classList.contains(resolved)) {
      root.classList.remove('light', 'dark')
      root.classList.add(resolved)
    }

    if (root.style.colorScheme !== resolved) {
      root.style.colorScheme = resolved
    }

    // Clear the temporary background color set by the early script
    if (root.style.backgroundColor) {
      root.style.backgroundColor = ''
    }

    // Set cookie for SSR support
    document.cookie = `${storageKey}=${theme}; path=/; max-age=31536000; SameSite=Lax`
  }, [theme, storageKey])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      try {
        localStorage.setItem(storageKey, newTheme)
      } catch (e) {
        console.error('Failed to set localStorage:', e)
      }
      setTheme(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  return useContext(ThemeProviderContext)
}
