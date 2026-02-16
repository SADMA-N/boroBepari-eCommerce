import app from '@/api'

type ProxyContext = {
  request: Request
}

export async function proxyApiRequest({ request }: ProxyContext) {
  return app.fetch(request)
}

export const proxyAllApiMethods = {
  HEAD: proxyApiRequest,
  GET: proxyApiRequest,
  POST: proxyApiRequest,
  PUT: proxyApiRequest,
  PATCH: proxyApiRequest,
  DELETE: proxyApiRequest,
  OPTIONS: proxyApiRequest,
}
