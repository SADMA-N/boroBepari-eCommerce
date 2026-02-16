const BASE = '/api'

type QueryParams = Record<string, string | number | boolean | undefined | null>

function getApiOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return (
    process.env.VITE_BETTER_AUTH_URL ||
    process.env.BETTER_AUTH_URL ||
    'http://localhost:3000'
  )
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    body?: unknown
    query?: QueryParams
    token?: string
    headers?: Record<string, string>
  },
): Promise<T> {
  const url = new URL(`${BASE}${path}`, getApiOrigin())

  if (options?.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value != null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    }
  }

  const headers: Record<string, string> = {
    ...options?.headers,
  }

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`
  }

  if (options?.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    credentials: 'include',
    body: options?.body
      ? options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body)
      : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || err.message || `Request failed: ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  return res.json()
}

function get<T>(path: string, query?: QueryParams, token?: string) {
  return request<T>('GET', path, { query, token })
}

function post<T>(path: string, body?: unknown, token?: string) {
  return request<T>('POST', path, { body, token })
}

function put<T>(path: string, body?: unknown, token?: string) {
  return request<T>('PUT', path, { body, token })
}

function patch<T>(path: string, body?: unknown, token?: string) {
  return request<T>('PATCH', path, { body, token })
}

function del<T>(path: string, body?: unknown, token?: string) {
  return request<T>('DELETE', path, { body, token })
}

// Typed API client
export const api = {
  // Auth - Buyer
  auth: {
    buyer: {
      session: () => get<any>('/auth/buyer/session'),
      setPassword: (body: { password: string }) =>
        post<{ success: boolean }>('/auth/buyer/set-password', body),
      updatePassword: (body: {
        currentPassword: string
        newPassword: string
      }) => post<{ success: boolean }>('/auth/buyer/update-password', body),
      passwordStatus: () =>
        get<{ needsPassword: boolean }>('/auth/buyer/password-status'),
      verifyResetCode: (body: { email: string; code: string }) =>
        post<{ success: boolean; token: string }>(
          '/auth/buyer/verify-reset-code',
          body,
        ),
    },
    seller: {
      register: (body: any) =>
        post<{ success: boolean }>('/auth/seller/register', body),
      login: (body: { identifier: string; password: string }) =>
        post<{ seller: any; token: string }>('/auth/seller/login', body),
      googleLogin: (body: { email: string }) =>
        post<{ seller: any; token: string }>(
          '/auth/seller/google-login',
          body,
        ),
      setPassword: (body: { email: string; token: string; password: string }) =>
        post<{ seller: any; token: string }>(
          '/auth/seller/set-password',
          body,
        ),
      updateProfile: (body: any, token: string) =>
        patch<{ seller: any }>('/auth/seller/profile', body, token),
      requestReset: (body: { email: string }) =>
        post<{ success: boolean; message: string }>(
          '/auth/seller/request-reset',
          body,
        ),
      verifyResetCode: (body: { email: string; code: string }) =>
        post<{ token: string }>('/auth/seller/verify-reset-code', body),
      session: (token: string) =>
        get<{ seller: any }>('/auth/seller/session', undefined, token),
      validateToken: (body: { token: string }) =>
        post<{ valid: boolean; seller: any }>(
          '/auth/seller/validate-token',
          body,
        ),
    },
    admin: {
      login: (body: { email: string; password: string; otp: string }) =>
        post<{ admin: any; token: string }>('/auth/admin/login', body),
      session: (token: string) =>
        get<{ admin: any }>('/auth/admin/session', undefined, token),
      validateToken: (body: { token: string }) =>
        post<{ valid: boolean; admin: any }>(
          '/auth/admin/validate-token',
          body,
        ),
      create: (body: any) =>
        post<{ success: boolean }>('/auth/admin/create', body),
    },
  },

  // Products - Public
  products: {
    featured: (limit = 12) =>
      get<any[]>('/products/featured', { limit }),
    newArrivals: (limit = 12) =>
      get<any[]>('/products/new-arrivals', { limit }),
    topRanking: (limit = 12) =>
      get<any[]>('/products/top-ranking', { limit }),
    bySlug: (slug: string) => get<any>(`/products/${slug}`),
    suggestions: (query: string) =>
      get<any[]>('/products/suggestions', { query }),
    search: (params: QueryParams) => get<any>('/products/search', params),
  },

  // Products - Seller
  seller: {
    products: {
      list: (token: string, query?: QueryParams) =>
        get<any>('/seller/products', query, token),
      get: (id: string, token: string) =>
        get<any>(`/seller/products/${id}`, undefined, token),
      create: (body: any, token: string) =>
        post<any>('/seller/products', body, token),
      update: (id: string, body: any, token: string) =>
        put<any>(`/seller/products/${id}`, body, token),
      delete: (ids: string[], token: string) =>
        del<any>('/seller/products', { ids }, token),
      uploadImage: (formData: FormData, token: string) =>
        request<{ url: string }>('POST', '/seller/products/upload-image', {
          body: formData,
          token,
        }),
    },
    orders: {
      list: (token: string, query?: QueryParams) =>
        get<any>('/seller/orders', query, token),
      updateStatus: (
        orderId: string,
        body: any,
        token: string,
      ) => patch<any>(`/seller/orders/${orderId}/status`, body, token),
    },
    rfq: {
      list: (token: string) => get<any>('/seller/rfq', undefined, token),
      sendQuote: (rfqId: string, body: any, token: string) =>
        post<any>(`/seller/rfq/${rfqId}/quote`, body, token),
    },
    analytics: (token: string, range?: string) =>
      get<any>('/seller/analytics', { range }, token),
    kyc: {
      submit: (body: any, token: string) =>
        post<any>('/seller/kyc', body, token),
    },
  },

  // Orders - Buyer
  orders: {
    list: (params?: QueryParams) => get<any>('/orders', params),
    get: (orderId: string) => get<any>(`/orders/${orderId}`),
    create: (body: any) => post<any>('/orders', body),
    updatePayment: (orderId: string, body: any) =>
      patch<any>(`/orders/${orderId}/payment`, body),
    getStatus: (orderId: string) => get<any>(`/orders/${orderId}/status`),
    updateStatus: (orderId: string, body: any) =>
      patch<any>(`/orders/${orderId}/status`, body),
  },

  // RFQ - Buyer
  rfq: {
    submit: (body: any) => post<any>('/rfq', body),
    uploadAttachment: (formData: FormData) =>
      request<{ url: string }>('POST', '/rfq/upload-attachment', {
        body: formData,
      }),
    buyerList: () => get<any>('/rfq/buyer'),
    get: (rfqId: string) => get<any>(`/rfq/${rfqId}`),
    buyerQuotes: () => get<any>('/rfq/buyer/quotes'),
    updateQuoteStatus: (quoteId: string, body: any) =>
      patch<any>(`/rfq/quotes/${quoteId}/status`, body),
  },

  // Supplier RFQ
  supplier: {
    rfq: {
      list: (token: string) =>
        get<any>('/supplier/rfq', undefined, token),
      respond: (rfqId: string, body: any, token: string) =>
        post<any>(`/supplier/rfq/${rfqId}/quote`, body, token),
    },
  },

  // Addresses
  addresses: {
    list: (userId?: string) => get<any[]>('/addresses', { userId }),
    create: (body: any) => post<any>('/addresses', body),
    update: (id: string, body: any) => put<any>(`/addresses/${id}`, body),
    delete: (id: string) => del<any>(`/addresses/${id}`),
  },

  // Cart
  cart: {
    validate: (body: any) => post<any>('/cart/validate', body),
  },

  // Stock Alerts
  stockAlerts: {
    list: () => get<any[]>('/stock-alerts'),
    create: (body: any) => post<any>('/stock-alerts', body),
    update: (id: string, body: any) => patch<any>(`/stock-alerts/${id}`, body),
    delete: (id: string) => del<any>(`/stock-alerts/${id}`),
  },

  // Suppliers
  suppliers: {
    verified: () => get<any[]>('/suppliers/verified'),
  },

  // Admin
  admin: {
    products: {
      list: (token: string, query?: QueryParams) =>
        get<any>('/admin/products', query, token),
      approve: (id: string, token: string) =>
        post<any>(`/admin/products/${id}/approve`, undefined, token),
      decline: (id: string, body: any, token: string) =>
        post<any>(`/admin/products/${id}/decline`, body, token),
      restore: (id: string, token: string) =>
        post<any>(`/admin/products/${id}/restore`, undefined, token),
    },
    orders: {
      list: (token: string, query?: QueryParams) =>
        get<any>('/admin/orders', query, token),
      updateStatus: (orderId: string, body: any, token: string) =>
        patch<any>(`/admin/orders/${orderId}/status`, body, token),
    },
    analytics: (token: string, days?: number) =>
      get<any>('/admin/analytics', { days }, token),
    kyc: {
      queue: (token: string) =>
        get<any>('/admin/kyc/queue', undefined, token),
      details: (sellerId: string, token: string) =>
        get<any>(`/admin/kyc/${sellerId}`, undefined, token),
      review: (sellerId: string, body: any, token: string) =>
        post<any>(`/admin/kyc/${sellerId}/review`, body, token),
    },
    suppliers: {
      list: (token: string, query?: QueryParams) =>
        get<any>('/admin/suppliers', query, token),
    },
  },
}
