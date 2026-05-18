export const centralPriceEndpoint = 'https://hudson-prod.localhome.cn/roomCategoryStatuses/central/get'
export const centralPriceBusinessSourceLabel = '中央价格服务'

export type CentralPriceProviderName = 'mock' | 'real'
type CentralPriceMockMode = 'success' | 'empty' | 'error'

export type CentralPriceFilters = {
  selectedStore: string
  selectedChannel: string
  selectedRoom: string
  selectedTag: string
  date: string
  pageNum: number
  pageSize: number
}

export type CentralPriceDate = {
  key: string
  label: string
  dateLabel: string
  weekday: string
}

export type CentralPriceRow = {
  channel: string
  coefficient: string
  basePrice: string
  prices: string[]
  comparePrices: string[]
  product?: string
}

export type CentralPriceRoom = {
  id: string
  name: string
  stock: string
  basePrice: string
  prices: Array<{ price: string; stock: string }>
  channelRows: CentralPriceRow[]
}

export type CentralPriceData = {
  dates: CentralPriceDate[]
  rooms: CentralPriceRoom[]
  page: {
    total: number
    pageNum: number
    pageSize: number
    hasNextPage: boolean
  }
  requestBody: Record<string, unknown>
  endpoint: string
  provider: CentralPriceProviderName
  sourceLabel: string
}

export type CentralPriceLoadResult =
  | { ok: true; data: CentralPriceData }
  | { ok: false; message: string; status?: number; requestBody: Record<string, unknown>; endpoint: string }

const channelIdByName: Record<string, string> = {
  途家: '2',
  小猪: '3',
  携程: '4',
  美团酒店: '5',
  飞猪淘酒店: '6',
  路客云聚合: '7',
  木鸟: '8',
}

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

export function getCentralPriceRequestDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${byType.year}-${byType.month}-${byType.day}`
}

export function createCentralPriceRequestBody(filters: CentralPriceFilters): Record<string, unknown> {
  return {
    campId: null,
    channelIds: resolveChannelIds(filters.selectedChannel),
    roomCategoryGroupIds: null,
    roomCategoryProductSaleType: null,
    roomCategoryIds: null,
    date: filters.date,
    days: 30,
    poiIds: null,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
  }
}

export async function fetchCentralPrices(filters: CentralPriceFilters, signal?: AbortSignal): Promise<CentralPriceLoadResult> {
  const requestBody = createCentralPriceRequestBody(filters)

  if (resolveCentralPriceProviderName() === 'mock') {
    return fetchMockCentralPrices(requestBody)
  }

  try {
    const response = await fetch(centralPriceEndpoint, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const payload = await readJson(response)
    if (!response.ok) {
      return {
        ok: false,
        endpoint: centralPriceEndpoint,
        requestBody,
        status: response.status,
        message: extractErrorMessage(payload) || `中央价接口返回 HTTP ${response.status}`,
      }
    }

    if (!payload || typeof payload !== 'object') {
      return {
        ok: false,
        endpoint: centralPriceEndpoint,
        requestBody,
        status: response.status,
        message: '中央价接口响应不是 JSON 对象',
      }
    }

    if ('success' in payload && payload.success !== true) {
      return {
        ok: false,
        endpoint: centralPriceEndpoint,
        requestBody,
        status: response.status,
        message: extractErrorMessage(payload) || '中央价接口返回失败',
      }
    }

    return { ok: true, data: adaptCentralPriceResponse(payload, requestBody, 'real') }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error

    return {
      ok: false,
      endpoint: centralPriceEndpoint,
      requestBody,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

export function getCentralPriceSourceLabel() {
  return centralPriceBusinessSourceLabel
}

function resolveCentralPriceProviderName(): CentralPriceProviderName {
  const configured = readRuntimeConfig('pms.centralPriceProvider') || import.meta.env.VITE_CENTRAL_PRICE_PROVIDER
  return configured === 'real' ? 'real' : 'mock'
}

function resolveCentralPriceMockMode(): CentralPriceMockMode {
  const configured = readRuntimeConfig('pms.centralPriceMockMode') || import.meta.env.VITE_CENTRAL_PRICE_MOCK_MODE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function fetchMockCentralPrices(requestBody: Record<string, unknown>): CentralPriceLoadResult {
  const mode = resolveCentralPriceMockMode()
  const response =
    mode === 'error'
      ? mockCentralPriceErrorEnvelope()
      : mode === 'empty'
        ? mockCentralPriceEmptyEnvelope(requestBody)
        : mockCentralPriceSuccessEnvelope(requestBody)

  if (response.code !== 0) {
    return {
      ok: false,
      endpoint: 'central-price-mock-provider',
      requestBody,
      status: response.code,
      message: `${response.message}（traceId: ${response.traceId}）`,
    }
  }

  return { ok: true, data: adaptCentralPriceResponse(response, requestBody, 'mock') }
}

interface CentralPriceApiEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

function successEnvelope<T>(traceId: string, data: T): CentralPriceApiEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId,
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function mockCentralPriceErrorEnvelope(): CentralPriceApiEnvelope<null> {
  return {
    code: 50001,
    message: 'mock 中央价接口模拟失败',
    data: null,
    traceId: 'mock-fangtai--fangjia-guanli--zhongyang-jiage-error-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function mockCentralPriceEmptyEnvelope(requestBody: Record<string, unknown>) {
  return successEnvelope('mock-fangtai--fangjia-guanli--zhongyang-jiage-empty-001', {
    list: [],
    pagination: {
      page: toNumber(requestBody.pageNum, 1),
      pageSize: toNumber(requestBody.pageSize, 15),
      total: 0,
    },
    roomStatusViews: [],
    pageX: {
      total: 0,
      pageNum: toNumber(requestBody.pageNum, 1),
      pageSize: toNumber(requestBody.pageSize, 15),
      hasNextPage: false,
    },
  })
}

function mockCentralPriceSuccessEnvelope(requestBody: Record<string, unknown>) {
  const startDate = String(requestBody.date ?? getCentralPriceRequestDate())
  const dates = Array.from({ length: 30 }, (_, index) => addDays(startDate, index))

  return successEnvelope('mock-fangtai--fangjia-guanli--zhongyang-jiage-list-001', {
    list: [],
    pagination: {
      page: toNumber(requestBody.pageNum, 1),
      pageSize: toNumber(requestBody.pageSize, 15),
      total: 2,
    },
    roomStatusViews: [
      buildMockRoom({
        roomCategoryId: 'central-deluxe-suite',
        roomCategoryName: '臻选豪华套房',
        normalPrice: 73000,
        normalActualSalePrice: 73000,
        totalStock: 2,
        dates,
        channelName: '中央直连',
        expressValue: '1.00',
      }),
      buildMockRoom({
        roomCategoryId: 'central-cinema-room',
        roomCategoryName: '观影大床房',
        normalPrice: 29800,
        normalActualSalePrice: 29800,
        totalStock: 3,
        dates,
        channelName: '途家',
        expressValue: '0.95',
      }),
    ],
    pageX: {
      total: 2,
      pageNum: toNumber(requestBody.pageNum, 1),
      pageSize: toNumber(requestBody.pageSize, 15),
      hasNextPage: false,
    },
  })
}

function buildMockRoom({
  roomCategoryId,
  roomCategoryName,
  normalPrice,
  normalActualSalePrice,
  totalStock,
  dates,
  channelName,
  expressValue,
}: {
  roomCategoryId: string
  roomCategoryName: string
  normalPrice: number
  normalActualSalePrice: number
  totalStock: number
  dates: string[]
  channelName: string
  expressValue: string
}) {
  const statusViews = dates.map((date, index) => ({
    date,
    totalStock: Math.max(totalStock - (index % 3 === 2 ? 1 : 0), 0),
    price: normalActualSalePrice + (index % 7 >= 5 ? 20000 : 0),
  }))

  return {
    roomCategoryId,
    roomCategoryName,
    normalPrice,
    normalActualSalePrice,
    statusViews,
    channelRoomCategoryStatuses: [
      {
        channelId: channelName === '途家' ? '2' : 'mock-channel-central',
        channelName,
        channelRoomCategoryName: `${roomCategoryName}<无早>`,
        expressValue,
        normalPrice,
        normalActualSalePrice,
        statusViews: statusViews.map((item) => ({
          date: item.date,
          price: item.price,
          salePrice: Math.round(item.price * Number(expressValue)),
        })),
      },
    ],
  }
}

export function adaptCentralPriceResponse(
  payload: unknown,
  requestBody: Record<string, unknown>,
  provider: CentralPriceProviderName = 'real',
): CentralPriceData {
  const root = asRecord(payload)
  const data = asRecord(root.data)
  const roomStatusViews = Array.isArray(data.roomStatusViews) ? data.roomStatusViews.map(asRecord) : []
  const dates = buildDates(roomStatusViews, String(requestBody.date ?? getCentralPriceRequestDate()))
  const pageX = asRecord(data.pageX)

  return {
    endpoint: provider === 'mock' ? 'central-price-mock-provider' : centralPriceEndpoint,
    provider,
    sourceLabel: centralPriceBusinessSourceLabel,
    requestBody,
    dates,
    rooms: roomStatusViews.map((room, index) => adaptRoom(room, dates, index)),
    page: {
      total: toNumber(pageX.total, roomStatusViews.length),
      pageNum: toNumber(pageX.pageNum ?? pageX.current, toNumber(requestBody.pageNum, 1)),
      pageSize: toNumber(pageX.pageSize ?? pageX.size, toNumber(requestBody.pageSize, 15)),
      hasNextPage: Boolean(pageX.hasNextPage),
    },
  }
}

function adaptRoom(room: Record<string, unknown>, dates: CentralPriceDate[], index: number): CentralPriceRoom {
  const statusViews = Array.isArray(room.statusViews) ? room.statusViews.map(asRecord) : []
  const channelRows = Array.isArray(room.channelRoomCategoryStatuses)
    ? room.channelRoomCategoryStatuses.map((item) => adaptChannelRow(asRecord(item), dates))
    : []

  return {
    id: String(room.roomCategoryId ?? `central-room-${index}`),
    name: String(room.roomCategoryName ?? `未命名房型 ${index + 1}`),
    basePrice: formatMoney(room.normalActualSalePrice ?? room.normalPrice),
    stock: formatStock(statusViews[0]?.totalStock),
    prices: dates.map((date) => {
      const status = statusViews.find((item) => item.date === date.key) ?? {}
      return {
        price: formatMoney(status.price ?? status.salePrice ?? status.basePrice),
        stock: formatStock(status.totalStock),
      }
    }),
    channelRows,
  }
}

function adaptChannelRow(row: Record<string, unknown>, dates: CentralPriceDate[]): CentralPriceRow {
  const statusViews = Array.isArray(row.statusViews) ? row.statusViews.map(asRecord) : []
  return {
    channel: String(row.channelName ?? '未知渠道'),
    coefficient: row.expressValue == null ? '-' : String(row.expressValue),
    basePrice: formatMoney(row.normalActualSalePrice ?? row.normalPrice),
    product: typeof row.channelRoomCategoryName === 'string' ? row.channelRoomCategoryName : undefined,
    prices: dates.map((date) => {
      const status = statusViews.find((item) => item.date === date.key) ?? {}
      return formatMoney(status.salePrice ?? status.price)
    }),
    comparePrices: dates.map((date) => {
      const status = statusViews.find((item) => item.date === date.key) ?? {}
      return formatMoney(status.price ?? status.basePrice)
    }),
  }
}

function buildDates(rooms: Array<Record<string, unknown>>, fallbackDate: string): CentralPriceDate[] {
  const firstRoomStatuses = Array.isArray(rooms[0]?.statusViews) ? rooms[0].statusViews.map(asRecord) : []
  const sourceDates = firstRoomStatuses.map((item) => String(item.date ?? '')).filter(Boolean)
  const dates = sourceDates.length > 0 ? sourceDates : Array.from({ length: 30 }, (_, index) => addDays(fallbackDate, index))

  return dates.map((date, index) => {
    const parsed = new Date(`${date}T00:00:00+08:00`)
    const dateLabel = date.slice(5).replace('-', '.')
    return {
      key: date,
      label: index === 0 ? '今日' : dateLabel,
      dateLabel,
      weekday: weekdays[parsed.getDay()] ?? '',
    }
  })
}

function addDays(date: string, offset: number) {
  const parsed = new Date(`${date}T00:00:00+08:00`)
  parsed.setDate(parsed.getDate() + offset)
  return parsed.toISOString().slice(0, 10)
}

function resolveChannelIds(channel: string) {
  const id = channelIdByName[channel]
  return id ? [id] : null
}

function formatStock(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  return `余${value}`
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  const amount = numeric / 100
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function extractErrorMessage(payload: unknown) {
  const record = asRecord(payload)
  return String(record.errorMsg ?? record.message ?? record.errorDetail ?? '').trim()
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
