export const STORE_OPTIONS_ENDPOINT = '/select/poi/page/get'

export type StoreOption = {
  id: string
  label: string
  address?: string
  contactNumber?: string
}

type StoreOptionsInput = {
  campId?: string
  signal?: AbortSignal
  includeAll?: boolean
  baseUrl?: string
  pageSize?: number
}

type HudsonEnvelope<T> = {
  code?: number
  success?: boolean
  message?: string | null
  errorMsg?: string | null
  errorCode?: string | number | null
  data?: T | null
}

export async function fetchStoreOptions(input: StoreOptionsInput = {}): Promise<StoreOption[]> {
  const campId = input.campId?.trim() || resolveCurrentCampId()
  const body = {
    campId,
    pageNum: 1,
    pageSize: input.pageSize ?? 100,
  }
  const response = await postHudson<unknown>(`${input.baseUrl ?? '/api'}${STORE_OPTIONS_ENDPOINT}`, body, input.signal)
  const stores = adaptStoreOptions(response.data)
  return input.includeAll === false ? stores : [{ id: 'all', label: '全部门店' }, ...stores]
}

export function resolveCurrentCampId() {
  return (
    readRuntimeConfig('pmsCampId') ||
    readRuntimeConfig('pms.currentCampId') ||
    readCampIdFromStoredObject('pms.currentCamp') ||
    readCampIdFromStoredObject('pms.camp') ||
    (import.meta.env.VITE_PMS_CAMP_ID as string | undefined)?.trim() ||
    '10001'
  )
}

function adaptStoreOptions(payload: unknown): StoreOption[] {
  const list = Array.isArray(payload) ? payload : asArray(asRecord(payload).list)
  const stores = list
    .map((item) => {
      const record = asRecord(item)
      return {
        id: readString(record.poiId ?? record.id ?? record.value ?? record.storeId, ''),
        label: readString(record.poiName ?? record.name ?? record.label ?? record.storeName, ''),
        address: readString(record.address, ''),
        contactNumber: readString(record.contactNumber, ''),
      }
    })
    .filter((item) => item.id && item.label)

  const seen = new Set<string>()
  return stores.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

async function postHudson<T>(url: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<HudsonEnvelope<T>> {
  const headers = new Headers({ 'content-type': 'application/json' })
  const token = readRuntimeConfig('pms_token')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(body),
    signal,
  })
  const payload = (await response.json().catch(() => null)) as HudsonEnvelope<T> | null
  if (!response.ok) {
    throw new Error(payload?.errorMsg || payload?.message || `门店列表加载失败：HTTP ${response.status}`)
  }
  if (!payload || payload.success === false || (payload.code !== undefined && payload.code !== 0)) {
    throw new Error(payload?.errorMsg || payload?.message || payload?.errorCode?.toString() || '门店列表加载失败')
  }
  return payload
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function readCampIdFromStoredObject(key: string) {
  const text = readRuntimeConfig(key)
  if (!text) return ''
  try {
    const value = JSON.parse(text) as Record<string, unknown>
    return readString(value.campId ?? value.id, '')
  } catch {
    return ''
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}
