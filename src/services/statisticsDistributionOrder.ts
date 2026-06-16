import { resolveCurrentCampId } from '../utils/camp'

export type StatisticsDistributionOrderProviderName = 'mock' | 'api'
export type StatisticsDistributionOrderMockState = 'success' | 'empty' | 'error'
export type StatisticsDistributionOrderFilter = '' | '全部' | '非置换订单' | '置换订单'
export type StatisticsDistributionOrderStoreScope = string

export type StatisticsDistributionOrderQuery = {
  campId?: string
  storeScope?: StatisticsDistributionOrderStoreScope
  poiIds?: string[]
  bookingStartDate: string
  bookingEndDate: string
  keyword?: string
  settlementState?: StatisticsDistributionOrderFilter
  pageNum?: number
  pageSize?: number
  current?: number
}

export type StatisticsDistributionOrderRow = {
  orderId: string
  customerName: string
  customerPhone: string
  customerInfo: string
  roomCategoryName: string
  bookedTime: string
  paidAmount: number
  serviceFee: number
  settlementAmount: number
  settledAmount: number
  settlementStatus: string
  orderFilter: Exclude<StatisticsDistributionOrderFilter, '' | '全部'>
}

export type StatisticsDistributionOrderSummary = {
  paidAmount: number
  serviceFee: number
  settlementAmount: number
  settledAmount: number
}

export type StatisticsDistributionOrderData = {
  provider: StatisticsDistributionOrderProviderName
  mockState: StatisticsDistributionOrderMockState
  endpoint: string
  traceId: string
  timestamp: string
  requestBody: Record<string, unknown>
  requestSummary: string[]
  campId: string
  campName: string
  summary: StatisticsDistributionOrderSummary
  rows: StatisticsDistributionOrderRow[]
  pagination: {
    total: number
    size: number
    current: number
    pageNum: number
    pages: number
    hasNextPage: boolean
  }
}

type HudsonResponse<T> = {
  code?: number
  message?: string | null
  success?: boolean
  data?: T
  errorCode?: string | null
  errorMsg?: string | null
  errorDetail?: string | null
}

type StatisticsDistributionOrderPayloadItem = {
  orderNo?: unknown
  orderId?: unknown
  customerName?: unknown
  customerPhone?: unknown
  roomCategoryName?: unknown
  bookedTime?: unknown
  bookedTimeStr?: unknown
  paidAmount?: unknown
  invoicePrice?: unknown
  serviceFee?: unknown
  commission?: unknown
  settlementAmount?: unknown
  incomePrice?: unknown
  settledAmount?: unknown
  settledPrice?: unknown
  settlementStatus?: unknown
  settledState?: unknown
  orderFilter?: unknown
  customerInfo?: unknown
}

type StatisticsDistributionOrderPayload = {
  total?: unknown
  size?: unknown
  current?: unknown
  pageNum?: unknown
  hasNextPage?: unknown
  pages?: unknown
  list?: unknown
  summary?: unknown
  camp?: unknown
  pagination?: unknown
}

const realBaseUrl = '/api'
export const statisticsDistributionOrderEndpoint = '/distribution/orders/page/get'
export const defaultStatisticsDistributionOrderCampId = '10001'

const defaultCampName = '天落会宿公寓(前海壹方城宝安中心店)'
const mockTimestamp = '2026-05-22T10:00:00+08:00'
const mockLatencyMs = 120

const mockRows: StatisticsDistributionOrderRow[] = [
  {
    orderId: '2054409001821356034',
    customerName: '陈崇科',
    customerPhone: '+8618319045566',
    customerInfo: '陈崇科/+8618319045566',
    roomCategoryName: '天落大床电竞间',
    bookedTime: '2026-05-13 11:50:49',
    paidAmount: 435,
    serviceFee: 65.25,
    settlementAmount: 369.75,
    settledAmount: 369.75,
    settlementStatus: '已结算',
    orderFilter: '非置换订单',
  },
  {
    orderId: '2056641572589068289',
    customerName: '朱小波',
    customerPhone: '051286660337178370',
    customerInfo: '朱小波/051286660337178370',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    bookedTime: '2026-05-19 15:42:15',
    paidAmount: 241.05,
    serviceFee: 39.75,
    settlementAmount: 225.31,
    settledAmount: 0,
    settlementStatus: '待结算',
    orderFilter: '置换订单',
  },
]

export async function loadStatisticsDistributionOrderData(
  query: StatisticsDistributionOrderQuery,
  signal?: AbortSignal,
): Promise<StatisticsDistributionOrderData> {
  if (resolveProvider() === 'api') {
    return loadRealStatisticsDistributionOrderData(query, signal)
  }

  await waitForMockLatency(signal)

  const mockState = resolveMockState()
  if (mockState === 'error') {
    throw new Error('聚合分销订单服务暂不可用，请稍后重试')
  }

  const requestBody = createRequestBody(query)
  const rows = mockState === 'empty' ? [] : filterRows(mockRows, query)
  const summary = summarizeRows(rows)

  return {
    provider: 'mock',
    mockState,
    endpoint: statisticsDistributionOrderEndpoint,
    traceId: `mock-distribution-order-${mockState}-001`,
    timestamp: mockTimestamp,
    requestBody,
    requestSummary: buildRequestSummary(query, requestBody, 'mock', mockState, `mock-distribution-order-${mockState}-001`),
    campId: String(requestBody.campId ?? resolveStatisticsDistributionOrderCampId()),
    campName: defaultCampName,
    summary,
    rows,
    pagination: {
      total: rows.length + (rows.length ? 1 : 0),
      size: readNumber(requestBody.pageSize, 20),
      current: readNumber(requestBody.current, 1),
      pageNum: readNumber(requestBody.pageNum, 1),
      pages: rows.length ? 1 : 0,
      hasNextPage: false,
    },
  }
}

export function getStatisticsDistributionOrderProviderName(): StatisticsDistributionOrderProviderName {
  return resolveProvider()
}

function resolveProvider(): StatisticsDistributionOrderProviderName {
  const fromUrl = readUrlProvider()
  if (fromUrl) return fromUrl

  const configured =
    import.meta.env.VITE_STATISTICS_DISTRIBUTION_ORDER_PROVIDER ||
    readRuntimeConfig('pms.statisticsDistributionOrderProvider')
  if (configured === 'api' || configured === 'real') return 'api'
  return 'mock'
}

function readUrlProvider(): StatisticsDistributionOrderProviderName | '' {
  if (typeof window === 'undefined') return ''
  const configured =
    new URLSearchParams(window.location.search).get('provider') ||
    new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('provider')
  if (configured === 'mock') return 'mock'
  return configured === 'api' || configured === 'real' ? 'api' : ''
}

function resolveMockState(): StatisticsDistributionOrderMockState {
  const fromUrl = readUrlMockState()
  if (fromUrl) return fromUrl

  const configured =
    readRuntimeConfig('pms.statisticsDistributionOrderMockState') ||
    import.meta.env.VITE_STATISTICS_DISTRIBUTION_ORDER_MOCK_STATE
  if (configured === 'success' || configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readUrlMockState(): StatisticsDistributionOrderMockState | '' {
  if (typeof window === 'undefined') return ''
  const searchParams = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const configured =
    searchParams.get('mockState') ||
    searchParams.get('statisticsDistributionOrderMockState') ||
    hashParams.get('mockState') ||
    hashParams.get('statisticsDistributionOrderMockState')
  return configured === 'success' || configured === 'empty' || configured === 'error' ? configured : ''
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, mockLatencyMs)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

function filterRows(rows: StatisticsDistributionOrderRow[], query: StatisticsDistributionOrderQuery) {
  const keyword = query.keyword?.trim()
  const settlementState = query.settlementState || ''

  return rows.filter((row) => {
    if (settlementState && settlementState !== '全部' && row.orderFilter !== settlementState) {
      return false
    }
    if (!keyword) return true

    return (
      row.orderId.includes(keyword) ||
      row.customerName.includes(keyword) ||
      row.customerPhone.includes(keyword) ||
      row.roomCategoryName.includes(keyword)
    )
  })
}

function summarizeRows(rows: StatisticsDistributionOrderRow[]): StatisticsDistributionOrderSummary {
  return rows.reduce(
    (summary, row) => ({
      paidAmount: roundAmount(summary.paidAmount + row.paidAmount),
      serviceFee: roundAmount(summary.serviceFee + row.serviceFee),
      settlementAmount: roundAmount(summary.settlementAmount + row.settlementAmount),
      settledAmount: roundAmount(summary.settledAmount + row.settledAmount),
    }),
    {
      paidAmount: 0,
      serviceFee: 0,
      settlementAmount: 0,
      settledAmount: 0,
    },
  )
}

function createRequestBody(query: StatisticsDistributionOrderQuery) {
  const poiIds =
    Array.isArray(query.poiIds) && query.poiIds.length > 0
      ? query.poiIds
      : query.storeScope && query.storeScope !== 'all'
        ? [query.storeScope]
        : []
  return {
    campId: query.campId || resolveStatisticsDistributionOrderCampId(),
    ...(poiIds.length > 0 ? { poiIds } : {}),
    pageNum: query.pageNum ?? 1,
    pageSize: query.pageSize ?? 20,
    current: query.current ?? 1,
    bookingStartDate: query.bookingStartDate,
    bookingEndDate: query.bookingEndDate,
    keyword: query.keyword?.trim() || undefined,
    breakTemp: mapBreakTemp(query.settlementState),
    settledState: mapSettledState(query.settlementState),
  }
}

function mapBreakTemp(settlementState: StatisticsDistributionOrderFilter | undefined) {
  if (settlementState === '置换订单') return true
  if (settlementState === '非置换订单') return false
  return undefined
}

function mapSettledState(settlementState: string | undefined) {
  if (settlementState === '已结算') return 'settled'
  if (settlementState === '待结算') return 'pending'
  return undefined
}

async function loadRealStatisticsDistributionOrderData(
  query: StatisticsDistributionOrderQuery,
  signal?: AbortSignal,
): Promise<StatisticsDistributionOrderData> {
  const requestBody = createRequestBody(query)
  const payload = await postHudson<StatisticsDistributionOrderPayload>(
    statisticsDistributionOrderEndpoint,
    requestBody,
    signal,
  )

  const record = asRecord(payload)
  const camp = asRecord(record.camp)
  const summaryRecord = asRecord(record.summary)
  const paginationRecord = asRecord(record.pagination)
  const rawList = asArray(record.list).map(adaptPayloadItem)
  const rows = rawList
    .filter((item) => String(item.orderNo ?? item.orderId ?? '') !== '合计')
    .map(adaptRow)
  const summary = hasSummary(summaryRecord) ? adaptSummary(summaryRecord) : rows.length ? summarizeRows(rows) : emptySummary()

  return {
    provider: 'api',
    mockState: 'success',
    endpoint: statisticsDistributionOrderEndpoint,
    traceId: 'api-distribution-order-001',
    timestamp: new Date().toISOString(),
    requestBody,
    requestSummary: buildRequestSummary(query, requestBody, 'api', 'success', 'api-distribution-order-001'),
    campId: String(camp.campId ?? requestBody.campId ?? resolveStatisticsDistributionOrderCampId()),
    campName: String(camp.campName ?? defaultCampName),
    summary,
    rows,
    pagination: {
      total: readNumber(paginationRecord.total ?? record.total, rows.length),
      size: readNumber(paginationRecord.pageSize ?? record.size, query.pageSize ?? 20),
      current: readNumber(record.current ?? paginationRecord.page ?? record.pageNum, query.current ?? 1),
      pageNum: readNumber(record.pageNum ?? paginationRecord.page, query.pageNum ?? 1),
      pages: readNumber(paginationRecord.pages ?? record.pages, rows.length ? 1 : 0),
      hasNextPage: Boolean(paginationRecord.hasNextPage ?? record.hasNextPage),
    },
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${realBaseUrl}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false || (payload?.code !== undefined && payload.code !== 0)) {
    throw new Error(
      payload?.errorMsg ?? payload?.errorDetail ?? payload?.message ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`,
    )
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

function buildRequestSummary(
  query: StatisticsDistributionOrderQuery,
  requestBody: Record<string, unknown>,
  provider: StatisticsDistributionOrderProviderName,
  mockState: StatisticsDistributionOrderMockState,
  traceId: string,
) {
  return [
    `provider=${provider}`,
    `mockState=${mockState}`,
    `traceId=${traceId}`,
    `path=${statisticsDistributionOrderEndpoint}`,
    `campId=${requestBody.campId ?? resolveStatisticsDistributionOrderCampId()}`,
    `storeScope=${query.storeScope ?? 'all'}`,
    `bookingStartDate=${query.bookingStartDate}`,
    `bookingEndDate=${query.bookingEndDate}`,
    `keyword=${query.keyword?.trim() || ''}`,
    `settlementState=${query.settlementState || ''}`,
    `pageNum=${requestBody.pageNum ?? 1}`,
    `pageSize=${requestBody.pageSize ?? 20}`,
    `breakTemp=${String(requestBody.breakTemp ?? '')}`,
  ]
}

function resolveStatisticsDistributionOrderCampId() {
  return resolveCurrentCampId(defaultStatisticsDistributionOrderCampId)
}

function adaptRow(item: StatisticsDistributionOrderPayloadItem): StatisticsDistributionOrderRow {
  const customerName = String(item.customerName ?? '')
  const customerPhone = String(item.customerPhone ?? '')

  return {
    orderId: String(item.orderNo ?? item.orderId ?? ''),
    customerName,
    customerPhone,
    customerInfo: String(item.customerInfo ?? [customerName, customerPhone].filter(Boolean).join('/')),
    roomCategoryName: String(item.roomCategoryName ?? ''),
    bookedTime: String(item.bookedTime ?? item.bookedTimeStr ?? ''),
    paidAmount: readNumber(item.paidAmount ?? item.invoicePrice, 0),
    serviceFee: readNumber(item.serviceFee ?? item.commission, 0),
    settlementAmount: readNumber(item.settlementAmount ?? item.incomePrice, 0),
    settledAmount: readNumber(item.settledAmount ?? item.settledPrice, 0),
    settlementStatus: String(item.settlementStatus ?? item.settledState ?? '待结算'),
    orderFilter: readOrderFilter(item.orderFilter),
  }
}

function readOrderFilter(value: unknown): Exclude<StatisticsDistributionOrderFilter, '' | '全部'> {
  return value === '置换订单' ? '置换订单' : '非置换订单'
}

function adaptPayloadItem(value: unknown): StatisticsDistributionOrderPayloadItem {
  return asRecord(value) as StatisticsDistributionOrderPayloadItem
}

function emptySummary(): StatisticsDistributionOrderSummary {
  return {
    paidAmount: 0,
    serviceFee: 0,
    settlementAmount: 0,
    settledAmount: 0,
  }
}

function readNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function roundAmount(value: number) {
  return Math.round(value * 100) / 100
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function hasSummary(value: Record<string, unknown>) {
  return Object.keys(value).length > 0
}

function adaptSummary(value: Record<string, unknown>): StatisticsDistributionOrderSummary {
  return {
    paidAmount: readNumber(value.paidAmount ?? value.invoicePrice, 0),
    serviceFee: readNumber(value.serviceFee ?? value.commission, 0),
    settlementAmount: readNumber(value.settlementAmount ?? value.incomePrice, 0),
    settledAmount: readNumber(value.settledAmount ?? value.settledPrice, 0),
  }
}
