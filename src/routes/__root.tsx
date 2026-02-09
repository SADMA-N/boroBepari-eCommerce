import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  redirect,
  useRouterState,
} from '@tanstack/react-router'
import React from 'react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { CartProvider } from '../contexts/CartContext'
import { WishlistProvider } from '../contexts/WishlistContext'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { ThemeProvider } from '../contexts/ThemeContext'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { checkUserPasswordStatus, getAuthSession } from '@/lib/auth-server'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ location }) => {
    if (
      location.pathname === '/' ||
      location.pathname.startsWith('/seller') ||
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/auth/set-password') ||
      location.pathname.startsWith('/api') ||
      location.pathname.startsWith('/login') ||
      location.pathname.startsWith('/register')
    )
      return

    try {
      const status = await checkUserPasswordStatus()
      if (status.needsPassword) {
        // Note: skipping via cookie is harder to check here on SSR without complex header parsing
        // but for client-side navigation it works perfectly.
        throw redirect({ to: '/auth/set-password' })
      }
    } catch (err) {
      if ((err as any).status === 307 || (err as any).status === 302) throw err
      console.error('Auth session fetch failed:', err)
    }
  },
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'BoroBepari - Bangladesh B2B Wholesale Marketplace',
      },
      {
        name: 'description',
        content:
          'Discover wholesale products from verified suppliers across Bangladesh. Shop fashion, electronics, home goods and more at bulk prices.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/svg+xml',
        href: '/favicon.svg',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFoundPage,
})

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-bold text-gray-300 dark:text-slate-700">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-gray-800 dark:text-gray-200">
        Page Not Found
      </h2>
      <p className="mt-2 text-gray-500 dark:text-gray-400">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/"
        className="mt-6 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
      >
        Go to Homepage
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const isSellerRoute = pathname.startsWith('/seller')
  const isAdminRoute = pathname.startsWith('/admin')
  const showBuyerShell = !isSellerRoute && !isAdminRoute

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getTheme() {
                  try {
                    var stored = localStorage.getItem('borobepari-theme');
                    if (stored === 'dark' || stored === 'light') return stored;
                    if (stored === 'system' || !stored) {
                      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                    }
                  } catch (e) {}
                  return 'light';
                }
                var theme = getTheme();
                var root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme);
                root.style.colorScheme = theme;
              })();
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html.dark { background-color: #020817; color-scheme: dark; }
              html.dark body { background-color: #020817; color: hsl(210 40% 98%); }
              html.light, html:not(.dark):not(.light) { background-color: #ffffff; color-scheme: light; }
              html.light body, html:not(.dark):not(.light) body { background-color: #ffffff; color: hsl(222.2 84% 4.9%); }
            `,
          }}
        />
        <HeadContent />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="light" storageKey="borobepari-theme">
          {showBuyerShell ? (
            <AuthProvider>
              <NotificationProvider>
                <CartProvider>
                  <WishlistProvider>
                    <Header />
                    {children}
                    <TanStackDevtools
                      config={{
                        position: 'bottom-right',
                      }}
                      plugins={[
                        {
                          name: 'Tanstack Router',
                          render: <TanStackRouterDevtoolsPanel />,
                        },
                        TanStackQueryDevtools,
                      ]}
                    />
                  </WishlistProvider>
                </CartProvider>
              </NotificationProvider>
            </AuthProvider>
          ) : (
            <>
              {children}
              <TanStackDevtools
                config={{
                  position: 'bottom-right',
                }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                  TanStackQueryDevtools,
                ]}
              />
            </>
          )}
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  )
}
