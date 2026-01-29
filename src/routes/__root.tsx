import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
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
import { redirect } from '@tanstack/react-router'
import { getAuthSession } from '@/lib/auth-server'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async ({ location }) => {
     if (location.pathname.startsWith('/auth/set-password') || location.pathname.startsWith('/api')) return

     const session: any = await getAuthSession()
     if (session?.user && !session.user.hasPassword) {
         // Check for skip cookie (client-side only check possible here easily if hydration matches?)
         // Ideally this runs on server too.
         // For now, let's force the redirect if no password, and let the page handle the "Skip" (which sets cookie)
         // Wait, if I redirect here, I need to know the cookie.
         // If I can't read cookie in `beforeLoad` easily on server (without request context plumbing), 
         // I might get infinite loop if I don't handle "Skip".
         // Solution: Do this check in the `useEffect` of the root component or `AuthProvider`.
         // `beforeLoad` is aggressive.
         // Let's NOT do it in `beforeLoad` for now to avoid complexity with cookies/headers.
         // I'll put it in `AuthContext` or a `useEffect` in `Header` or Root.
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
