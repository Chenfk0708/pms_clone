import { getToken } from '../utils/auth'

const BASE = '/api'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
  success?: boolean
}

export async function apiPost<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  let payload: ApiEnvelope<T> | null
  try {
    payload = await response.json()
  } catch {
    throw new Error(`${endpoint}: 响应不是 JSON`)
  }

  if (!payload) {
    throw new Error(`${endpoint}: response body is empty`)
  }

  if (!response.ok) {
    throw new Error(`${endpoint}: HTTP ${response.status} - ${payload?.message || '请求失败'}`)
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new Error(`${endpoint}: ${payload.message || '业务失败'} (code=${payload.code})`)
  }

  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint}: 响应缺少 data 字段`)
  }

  return payload.data
}
