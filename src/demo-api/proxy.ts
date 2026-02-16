import app from '@/demo-api'

type ProxyContext = {
  request: Request
}

async function proxyDemoApiRequest({ request }: ProxyContext) {
  return app.fetch(request)
}

export const proxyAllDemoApiMethods = {
  HEAD: proxyDemoApiRequest,
  GET: proxyDemoApiRequest,
  POST: proxyDemoApiRequest,
  PUT: proxyDemoApiRequest,
  PATCH: proxyDemoApiRequest,
  DELETE: proxyDemoApiRequest,
  OPTIONS: proxyDemoApiRequest,
}
