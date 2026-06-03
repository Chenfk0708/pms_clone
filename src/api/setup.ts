import { getToken, clearToken } from '../utils/auth'

const originalFetch = window.fetch

window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const nextInit: RequestInit = init ? { ...init } : {}
  const token = getToken()
  if (token && isApiRequest(input)) {
    const headers = new Headers(nextInit.headers)
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    nextInit.headers = headers
  }
  return originalFetch(input, nextInit).then((res) => {
    if (res.status === 401 && getToken()) {
      clearToken()
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login'
      }
    }
    return res
  })
}

function isApiRequest(input: RequestInfo | URL) {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  return url.startsWith('/api') || url.startsWith(`${window.location.origin}/api`)
}
