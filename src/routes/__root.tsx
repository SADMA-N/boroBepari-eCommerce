import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  redirect,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { CartProvider } from '../contexts/CartContext'
import { WishlistProvider } from '../contexts/WishlistContext'
import { AuthProvider } from '../contexts/AuthContext'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { checkUserPasswordStatus, getAuthSession } from '@/lib/auth-server'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ location }) => {
    if (
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
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <AuthProvider>
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
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  )
}
