export type StatisticsDistributionOrderProviderName = 'mock' | 'api'
export type StatisticsDistributionOrderMockState = 'success' | 'empty' | 'error'
export type StatisticsDistributionOrderFilter = '' | '全部' | '非置换订单' | '置换订单'
export type StatisticsDistributionOrderStoreScope = 'all' | 'current'

export type StatisticsDistributionOrderQuery = {
  campId?: string
  storeScope?: StatisticsDistributionOrderStoreScope
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
  success?: boolean
  data?: T
  errorCode?: string | null
  errorMsg?: string | null
  errorDetail?: string | null
}

type StatisticsDistributionOrderEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type StatisticsDistributionOrderPayload = {
  total?: unknown
  size?: unknown
  current?: unknown
  pageNum?: unknown
  hasNextPage?: unknown
  pages?: unknown
  list?: unknown
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
}

const realBaseUrl = 'https://hudson-prod.localhome.cn'
export const statisticsDistributionOrderEndpoint = '/report/flows/get'
export const defaultStatisticsDistributionOrderCampId = '1796067693589061634'
const defaultCampName = '天落会宿公寓(前海壹方城宝安中心店)'
const mockTimestamp = '2026-05-19T08:47:40+08:00'
const mockLatencyMs = 120

const mockRows: StatisticsDistributionOrderRow[] = [
  {
    orderId: '2054409001821356034',
    customerName: '陈崇科',
    customerPhone: '+8618319045566',
    customerInfo: '陈崇科/+8618319045566',
    roomCategoryName: '天落大床电竞套间',
    bookedTime: '2026-05-13 11:50:49',
    paidAmount: 435,
    serviceFee: 65.25,
    settlementAmount: 369.75,
    settledAmount: 0,
    settlementStatus: '待结算',
    orderFilter: '非置换订单',
  },
  {
    orderId: '2056641572589068289',
    customerName: '朱小波',
    customerPhone: '051286660337178370',
    customerInfo: '朱小波/051286660337178370',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    bookedTime: '2026-05-16 15:24:10',
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
  const requestBody = createRequestBody(query)
  const envelope = buildMockEnvelope(query)
  return adaptPayloadEnvelope(envelope, query, requestBody, 'mock', resolveMockState())
}

export function getStatisticsDistributionOrderProviderName(): StatisticsDistributionOrderProviderName {
  return resolveProvider()
}

function resolveProvider(): StatisticsDistributionOrderProviderName {
  const configured =
    readRuntimeConfig('pms.statisticsDistributionOrderProvider') ||
    import.meta.env.VITE_STATISTICS_DISTRIBUTION_ORDER_PROVIDER
  return configured === 'api' ? 'api' : 'mock'
}

function resolveMockState(): StatisticsDistributionOrderMockState {
  const fromUrl = readUrlMockState()
  if (fromUrl) return fromUrl
  const configured =
    readRuntimeConfig('pms.statisticsDistributionOrderMockState') ||
    import.meta.env.VITE_STATISTICS_DISTRIBUTION_ORDER_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readUrlMockState(): StatisticsDistributionOrderMockState | '' {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const configured = params.get('mockState') || params.get('statisticsDistributionOrderMockState')
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

function buildMockEnvelope(
  query: StatisticsDistributionOrderQuery,
): StatisticsDistributionOrderEnvelope<StatisticsDistributionOrderPayload | null> {
  const mockState = resolveMockState()
  if (mockState === 'error') {
    return {
      code: 50318,
      message: '聚合分销订单服务暂不可用，请稍后重试',
      data: null,
      traceId: 'mock-baobiao--jiesuanbiao--juhe-fenxiao-dingdan-error-001',
      timestamp: mockTimestamp,
    }
  }

  if (mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        total: 0,
        size: query.pageSize ?? 20,
        current: query.current ?? 1,
        pageNum: query.pageNum ?? 1,
        hasNextPage: false,
        pages: 0,
        list: [],
      },
      traceId: 'mock-baobiao--jiesuanbiao--juhe-fenxiao-dingdan-empty-001',
      timestamp: mockTimestamp,
    }
  }

  const rows = filterRows(mockRows, query)
  const summary = summarizeRows(rows)
  const summaryRow = {
    orderNo: '合计',
    paidAmount: summary.paidAmount,
    serviceFee: summary.serviceFee,
    settlementAmount: summary.settlementAmount,
    settledAmount: summary.settledAmount,
    settlementStatus: '-',
  }

  return {
    code: 0,
    message: 'success',
    data: {
      total: rows.length + 1,
      size: query.pageSize ?? 20,
      current: query.current ?? 1,
      pageNum: query.pageNum ?? 1,
      hasNextPage: false,
      pages: rows.length ? 1 : 0,
      list: [summaryRow, ...rows.map(toPayloadItem)],
    },
    traceId: 'mock-baobiao--jiesuanbiao--juhe-fenxiao-dingdan-success-001',
    timestamp: mockTimestamp,
  }
}

function toPayloadItem(row: StatisticsDistributionOrderRow) {
  return {
    orderNo: row.orderId,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    roomCategoryName: row.roomCategoryName,
    bookedTime: row.bookedTime,
    paidAmount: row.paidAmount,
    serviceFee: row.serviceFee,
    settlementAmount: row.settlementAmount,
    settledAmount: row.settledAmount,
    settlementStatus: row.settlementStatus,
    orderFilter: row.orderFilter,
  }
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
  return {
    campId: query.campId || defaultStatisticsDistributionOrderCampId,
    pageNum: query.pageNum ?? 1,
    pageSize: query.pageSize ?? 20,
    current: query.current ?? 1,
    bookingStartDate: query.bookingStartDate,
    bookingEndDate: query.bookingEndDate,
    keyword: query.keyword?.trim() || undefined,
    breakTemp: mapBreakTemp(query.settlementState),
  }
}

function mapBreakTemp(settlementState: StatisticsDistributionOrderFilter | undefined) {
  if (settlementState === '置换订单') return true
  if (settlementState === '全部') return undefined
  return false
}

function adaptPayloadEnvelope(
  envelope: StatisticsDistributionOrderEnvelope<StatisticsDistributionOrderPayload | null>,
  query: StatisticsDistributionOrderQuery,
  requestBody: Record<string, unknown>,
  provider: StatisticsDistributionOrderProviderName,
  mockState: StatisticsDistributionOrderMockState,
): StatisticsDistributionOrderData {
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.message || '聚合分销订单服务暂不可用，请稍后重试')
  }

  return adaptPayload(envelope.data, query, requestBody, provider, mockState, envelope.traceId, envelope.timestamp)
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
  return adaptPayload(
    payload,
    query,
    requestBody,
    'api',
    'success',
    'api-baobiao--jiesuanbiao--juhe-fenxiao-dingdan',
    new Date().toISOString(),
  )
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

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg ?? payload?.errorDetail ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

function adaptPayload(
  payload: StatisticsDistributionOrderPayload,
  query: StatisticsDistributionOrderQuery,
  requestBody: Record<string, unknown>,
  provider: StatisticsDistributionOrderProviderName,
  mockState: StatisticsDistributionOrderMockState,
  traceId: string,
  timestamp: string,
): StatisticsDistributionOrderData {
  const record = asRecord(payload)
  const list = asArray(record.list).map(adaptPayloadItem)
  const summary = list.length ? readSummaryRow(list[0]) : emptySummary()
  const rows = list.slice(1).map(adaptRow)

  return {
    provider,
    mockState,
    endpoint: statisticsDistributionOrderEndpoint,
    traceId,
    timestamp,
    requestBody,
    requestSummary: buildRequestSummary(query, requestBody, provider, mockState, traceId),
    campId: String(requestBody.campId ?? defaultStatisticsDistributionOrderCampId),
    campName: defaultCampName,
    summary,
    rows,
    pagination: {
      total: readNumber(record.total, list.length),
      size: readNumber(record.size, query.pageSize ?? 20),
      current: readNumber(record.current, query.current ?? 1),
      pageNum: readNumber(record.pageNum, query.pageNum ?? 1),
      pages: readNumber(record.pages, list.length ? 1 : 0),
      hasNextPage: Boolean(record.hasNextPage),
    },
  }
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
    `campId=${requestBody.campId ?? defaultStatisticsDistributionOrderCampId}`,
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

function readSummaryRow(item: StatisticsDistributionOrderPayloadItem): StatisticsDistributionOrderSummary {
  return {
    paidAmount: readNumber(item.paidAmount ?? item.invoicePrice, 0),
    serviceFee: readNumber(item.serviceFee ?? item.commission, 0),
    settlementAmount: readNumber(item.settlementAmount ?? item.incomePrice, 0),
    settledAmount: readNumber(item.settledAmount ?? item.settledPrice, 0),
  }
}

function adaptRow(item: StatisticsDistributionOrderPayloadItem): StatisticsDistributionOrderRow {
  const customerName = String(item.customerName ?? '')
  const customerPhone = String(item.customerPhone ?? '')
  return {
    orderId: String(item.orderNo ?? item.orderId ?? ''),
    customerName,
    customerPhone,
    customerInfo: [customerName, customerPhone].filter(Boolean).join('/'),
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
