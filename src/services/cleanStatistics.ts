export const cleanStatisticsEndpoint = 'https://hudson-prod.localhome.cn/cleanTask/statistics'
export const cleanCleanerEndpoint = 'https://hudson-prod.localhome.cn/cleaner/list/get'
export const cleanRoomCategoriesEndpoint = 'https://hudson-prod.localhome.cn/roomCategories/page/get'
export const cleanRoomsEndpoint = 'https://hudson-prod.localhome.cn/rooms/get'

export type CleanStatisticsFilters = {
  campId: string
  startDate: string
  endDate: string
  pageNum: number
  pageSize: number
}

export type CleanSummaryRow = {
  date: string
  checkoutCount: number
  checkoutFee: string
  stayCount: number
  stayFee: string
  departureCount: number
  departureFee: string
  deepCount: number
  deepFee: string
  totalCount: number
  totalFee: string
}

export type CleanLookupOption = {
  id: string
  label: string
}

export type CleanStatisticsData = {
  rows: CleanSummaryRow[]
  total: number
  pageNum: number
  pageSize: number
  endpoint: string
  requestBody: Record<string, unknown>
}

export type CleanStatisticsDashboard = {
  statistics: CleanStatisticsData
  rooms: CleanLookupOption[]
  cleaners: CleanLookupOption[]
}

type HudsonPayload = {
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
  data?: unknown
}

export function getCurrentMonthRange(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]))
  const today = `${parts.year}-${parts.month}-${parts.day}`
  return { start: `${parts.year}-${parts.month}-01`, end: today }
}

export function createCleanStatisticsRequestBody(filters: CleanStatisticsFilters): Record<string, unknown> {
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    campId: filters.campId,
    cleanStartTime: startOfShanghaiDay(filters.startDate),
    cleanEndTime: endOfShanghaiDay(filters.endDate),
  }
}

export async function fetchCleanStatisticsDashboard(
  filters: CleanStatisticsFilters,
  signal?: AbortSignal,
): Promise<CleanStatisticsDashboard> {
  const [statistics, cleaners, roomCategories] = await Promise.all([
    fetchCleanStatistics(filters, signal),
    fetchCleaners(filters.campId, signal),
    fetchRoomCategories(filters.campId, signal),
  ])
  const rooms = await fetchRooms(filters.campId, roomCategories.map((item) => item.id), signal)

  return { statistics, cleaners, rooms }
}

async function fetchCleanStatistics(
  filters: CleanStatisticsFilters,
  signal?: AbortSignal,
): Promise<CleanStatisticsData> {
  const requestBody = createCleanStatisticsRequestBody(filters)
  const data = await postHudson(cleanStatisticsEndpoint, requestBody, signal)
  const record = asRecord(data)
  const list = Array.isArray(record.list) ? record.list.map(asRecord) : []

  return {
    endpoint: cleanStatisticsEndpoint,
    requestBody,
    rows: list.map(adaptSummaryRow),
    total: toNumber(record.total, list.length),
    pageNum: toNumber(record.pageNum ?? record.current, filters.pageNum),
    pageSize: toNumber(record.size, filters.pageSize),
  }
}

async function fetchCleaners(campId: string, signal?: AbortSignal): Promise<CleanLookupOption[]> {
  const data = await postHudson(cleanCleanerEndpoint, { campId }, signal)
  const list = Array.isArray(data) ? data : []

  return list.map(asRecord).map((item, index) => ({
    id: String(item.cleanerId ?? item.userId ?? item.id ?? `cleaner-${index}`),
    label: String(item.cleanerName ?? item.userName ?? item.name ?? `保洁员 ${index + 1}`),
  }))
}

async function fetchRoomCategories(campId: string, signal?: AbortSignal): Promise<CleanLookupOption[]> {
  const data = await postHudson(
    cleanRoomCategoriesEndpoint,
    { campId, pageSize: 999, pageNum: 1, roomCategoryName: '', keyword: '', cityIds: [], channelId: '' },
    signal,
  )
  const record = asRecord(data)
  const list = Array.isArray(record.list) ? record.list.map(asRecord) : []

  return list.map((item, index) => ({
    id: String(item.roomCategoryId ?? `room-category-${index}`),
    label: String(item.roomCategoryName ?? item.name ?? `房型 ${index + 1}`),
  }))
}

async function fetchRooms(campId: string, roomCategoryIds: string[], signal?: AbortSignal): Promise<CleanLookupOption[]> {
  if (roomCategoryIds.length === 0) return []

  const data = await postHudson(cleanRoomsEndpoint, { campId, roomCategoryIds, saleType: 1 }, signal)
  const record = asRecord(data)
  const roomCategoryRooms = Array.isArray(record.roomCategoryRooms) ? record.roomCategoryRooms.map(asRecord) : []

  return roomCategoryRooms.flatMap((category, categoryIndex) => {
    const roomCategoryName = String(category.roomCategoryName ?? `房型 ${categoryIndex + 1}`)
    const rooms = Array.isArray(category.rooms) ? category.rooms.map(asRecord) : []
    return rooms.map((room, roomIndex) => ({
      id: String(room.roomId ?? `${category.roomCategoryId ?? categoryIndex}-${roomIndex}`),
      label: `${roomCategoryName} ${String(room.roomName ?? `房间 ${roomIndex + 1}`)}`,
    }))
  })
}

async function postHudson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const payload = (await readJson(response)) as HudsonPayload | null
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) || `${endpoint} 返回 HTTP ${response.status}`)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error(`${endpoint} 响应不是 JSON 对象`)
  }

  if (payload.success !== true) {
    throw new Error(extractErrorMessage(payload) || `${endpoint} 返回业务失败`)
  }

  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

function adaptSummaryRow(row: Record<string, unknown>): CleanSummaryRow {
  return {
    date: String(row.cleanTime ?? '-'),
    checkoutCount: toNumber(row.cleanTypeOneNum, 0),
    checkoutFee: formatMoney(row.cleanTypeOneCost),
    stayCount: toNumber(row.cleanTypeTwoNum, 0),
    stayFee: formatMoney(row.cleanTypeTwoCost),
    departureCount: toNumber(row.cleanTypeThreeNum, 0),
    departureFee: formatMoney(row.cleanTypeThreeCost),
    deepCount: toNumber(row.cleanTypeFourNum, 0),
    deepFee: formatMoney(row.cleanTypeFourCost),
    totalCount: toNumber(row.countNum, 0),
    totalFee: formatMoney(row.countCost),
  }
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function startOfShanghaiDay(date: string) {
  return new Date(`${date}T00:00:00+08:00`).getTime()
}

function endOfShanghaiDay(date: string) {
  return new Date(`${date}T23:59:59.999+08:00`).getTime()
}

function formatMoney(value: unknown) {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return '0.00'
  return (numeric / 100).toFixed(2)
}

function extractErrorMessage(payload: HudsonPayload | null) {
  return String(payload?.errorMsg ?? payload?.errorDetail ?? '').trim()
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
