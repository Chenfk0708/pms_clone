const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn'

export const roomSituationStoresEndpoint = '/select/poi/page/get'
export const dailyRoomSituationEndpoint = '/report/dailyRoomStatus/get'
export const forwardRoomSituationEndpoint = '/report/forwardRoomStatus/get'

export type RoomSituationStore = {
  poiId: string
  poiName: string
}

export type DailyRoomSituationRow = {
  id: string
  name: string
  total: number
  sold: number
  available: number
  closed: number
  disabled: number
  reserved: number
  repair: number
  linkedClosed: number
  usable: number
  arriving: number
  occupied: number
  leaving: number
  clean: number
  dirty: number
}

export type ForwardRoomSituationRow = {
  id: string
  name: string
  total: number
  days: Array<{
    available: number
    occupied: number
  }>
}

export type RoomSituationPageData<T> = {
  endpoint: string
  requestBody: Record<string, unknown>
  rows: T[]
  total: number
  pageNum: number
  pageSize: number
}

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorDetail?: string | null
  errorCode?: string | null
}

type PagePayload = {
  total?: unknown
  pageNum?: unknown
  current?: unknown
  pageSize?: unknown
  size?: unknown
  list?: unknown
}

export function resolveRoomSituationCampId() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('campId')?.trim()
  const fromStorage = window.localStorage.getItem('pmsCampId')?.trim()
  const fromEnv = (import.meta.env.VITE_PMS_CAMP_ID as string | undefined)?.trim()
  const campId = fromUrl || fromStorage || fromEnv

  if (!campId) {
    throw new Error('缺少 campId：请通过 URL query、localStorage.pmsCampId 或 VITE_PMS_CAMP_ID 提供当前房情表上下文')
  }

  return campId
}

export async function fetchRoomSituationStores(campId: string, signal?: AbortSignal): Promise<RoomSituationStore[]> {
  const data = await postHudson<PagePayload>(
    roomSituationStoresEndpoint,
    { campId, pageSize: 999, pageNum: 1, channelId: 0, isAvailability: '1' },
    signal,
  )
  const list = Array.isArray(data.list) ? data.list.map(asRecord) : []

  return list.map((item, index) => ({
    poiId: String(item.poiId ?? item.id ?? `poi-${index}`),
    poiName: String(item.poiName ?? item.name ?? `门店 ${index + 1}`),
  }))
}

export async function fetchDailyRoomSituation(
  filters: {
    campId: string
    date: string
    poiIds: string[]
    pageNum: number
    pageSize: number
  },
  signal?: AbortSignal,
): Promise<RoomSituationPageData<DailyRoomSituationRow>> {
  const requestBody = {
    campId: filters.campId,
    date: filters.date,
    poiIds: filters.poiIds,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
  }
  const data = await postHudson<PagePayload>(dailyRoomSituationEndpoint, requestBody, signal)
  const list = Array.isArray(data.list) ? data.list.map(asRecord) : []

  return {
    endpoint: dailyRoomSituationEndpoint,
    requestBody,
    rows: list.map(adaptDailyRow),
    total: toNumber(data.total, list.length),
    pageNum: toNumber(data.pageNum ?? data.current, filters.pageNum),
    pageSize: toNumber(data.pageSize ?? data.size, filters.pageSize),
  }
}

export async function fetchForwardRoomSituation(
  filters: {
    campId: string
    startDate: string
    endDate: string
    poiIds: string[]
    pageNum: number
    pageSize: number
  },
  signal?: AbortSignal,
): Promise<RoomSituationPageData<ForwardRoomSituationRow>> {
  const requestBody = {
    campId: filters.campId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    poiIds: filters.poiIds,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
  }
  const data = await postHudson<PagePayload>(forwardRoomSituationEndpoint, requestBody, signal)
  const list = Array.isArray(data.list) ? data.list.map(asRecord) : []

  return {
    endpoint: forwardRoomSituationEndpoint,
    requestBody,
    rows: list.map(adaptForwardRow),
    total: toNumber(data.total, list.length),
    pageNum: toNumber(data.pageNum ?? data.current, filters.pageNum),
    pageSize: toNumber(data.pageSize ?? data.size, filters.pageSize),
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  const payload = (await readJson(response)) as HudsonResponse<T> | null
  if (!response.ok) {
    throw new Error(`${formatEndpoint(endpoint)} 返回 HTTP ${response.status}`)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error(`${formatEndpoint(endpoint)} 响应不是 JSON 对象`)
  }

  if (payload.success !== true) {
    throw new Error(`${formatEndpoint(endpoint)} 返回业务失败：${extractErrorMessage(payload)}`)
  }

  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${formatEndpoint(endpoint)} 响应缺少 data 字段`)
  }

  return payload.data
}

function adaptDailyRow(row: Record<string, unknown>, index: number): DailyRoomSituationRow {
  return {
    id: String(row.roomCategoryId ?? row.roomCategoryName ?? `daily-row-${index}`),
    name: String(row.roomCategoryName ?? '-'),
    total: toNumber(row.availabilityCount, 0),
    sold: toNumber(row.openRoomCount, 0),
    available: toNumber(row.roomSaleCount, 0),
    closed: toNumber(row.closeRoomCount, 0),
    disabled: toNumber(row.userBusyNum, 0),
    reserved: toNumber(row.userBusyRetainNum, 0),
    repair: toNumber(row.userBusyRepairNum, 0),
    linkedClosed: toNumber(row.mainViceRelNum, 0),
    usable: toNumber(row.totalVacantRoomCount, 0),
    arriving: toNumber(row.preComeNum, 0),
    occupied: toNumber(row.liveNum, 0),
    leaving: toNumber(row.preLeaveNum, 0),
    clean: toNumber(row.cleanNum, 0),
    dirty: toNumber(row.dirtyNum, 0),
  }
}

function adaptForwardRow(row: Record<string, unknown>, index: number): ForwardRoomSituationRow {
  const days = Array.isArray(row.forwardRoomStatusList) ? row.forwardRoomStatusList.map(asRecord) : []

  return {
    id: String(row.roomCategoryId ?? row.roomCategoryName ?? `forward-row-${index}`),
    name: String(row.roomCategoryName ?? '-'),
    total: toNumber(row.availabilityCount, 0),
    days: days.map((day) => ({
      available: toNumber(day.roomSaleCount, 0),
      occupied: toNumber(day.occupationCount, 0),
    })),
  }
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function extractErrorMessage(payload: HudsonResponse<unknown>) {
  return String(payload.errorMsg ?? payload.errorDetail ?? payload.errorCode ?? '未知错误').trim()
}

function formatEndpoint(endpoint: string) {
  return endpoint.replace(/^\//, '')
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
