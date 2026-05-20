export type DistributionOrderProviderName = 'mock' | 'api'
type DistributionOrderMockMode = 'success' | 'empty' | 'error'

export type DistributionOrderSettlementState = 'pending' | 'settled'

export type DistributionOrderQuery = {
  campId?: string
  bookingStartDate: string
  bookingEndDate: string
  keyword?: string
  settlementState?: DistributionOrderSettlementState | ''
  page?: number
  pageSize?: number
}

export type DistributionOrderItem = {
  orderId: string
  customerInfo: string
  roomCategoryName: string
  bookedTime: string
  invoicePrice: number
  commission: number
  incomePrice: number
  settledPrice: number
  settledState: DistributionOrderSettlementState
}

export type DistributionOrderData = {
  provider: DistributionOrderProviderName
  campId: string
  campName: string
  list: DistributionOrderItem[]
  summary: {
    invoicePrice: number
    commission: number
    incomePrice: number
    settledPrice: number
  }
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  requestedAt: string
  requestSummary: string[]
}

type DistributionOrderEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type DistributionOrderEnvelopeData = {
  camp: {
    campId: string
    campName: string
  }
  list: DistributionOrderItem[]
  summary: DistributionOrderData['summary']
  pagination: DistributionOrderData['pagination']
}

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorCode?: string | null
}

const realBaseUrl = 'https://hudson-prod.localhome.cn'
const flowEndpoint = '/report/flows/get'
const defaultCampId = '1796067693589061634'
const defaultCampName = '天落会宿公寓(前海壹方城宝安中心店)'

const mockRows: DistributionOrderItem[] = [
  {
    orderId: '2054409001821356034',
    customerInfo: '陈崇科/+8618319045566',
    roomCategoryName: '天落大床电竞套间',
    bookedTime: '2026-05-13 11:50:49',
    invoicePrice: 435,
    commission: 65.25,
    incomePrice: 369.75,
    settledPrice: 0,
    settledState: 'pending',
  },
]

export async function loadDistributionOrderData(
  query: DistributionOrderQuery,
  signal?: AbortSignal,
): Promise<DistributionOrderData> {
  if (resolveProvider() === 'api') {
    return loadRealDistributionOrderData(query, signal)
  }

  await waitForMockLatency(signal)
  const envelope = buildMockEnvelope(query)
  return adaptEnvelope(envelope, query, 'mock')
}

export function getDistributionOrderProviderName(): DistributionOrderProviderName {
  return resolveProvider()
}

function resolveProvider(): DistributionOrderProviderName {
  const configured = readRuntimeConfig('pms.distributionOrderProvider') || import.meta.env.VITE_DISTRIBUTION_ORDER_PROVIDER
  return configured === 'api' ? 'api' : 'mock'
}

function resolveMockMode(): DistributionOrderMockMode {
  const fromUrl = readUrlMockMode()
  if (fromUrl) return fromUrl
  const configured =
    readRuntimeConfig('pms.distributionOrderMockMode') || import.meta.env.VITE_DISTRIBUTION_ORDER_MOCK_MODE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readUrlMockMode(): DistributionOrderMockMode | '' {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const configured = params.get('mockState') || params.get('distributionOrderMockMode')
  return configured === 'empty' || configured === 'error' || configured === 'success' ? configured : ''
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 80)
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
  query: DistributionOrderQuery,
): DistributionOrderEnvelope<DistributionOrderEnvelopeData | null> {
  const mode = resolveMockMode()
  if (mode === 'error') {
    return {
      code: 50318,
      message: '聚合分销订单服务暂不可用，请稍后重试',
      data: null,
      traceId: 'mock-juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan-error-001',
      timestamp: '2026-05-18T10:00:00+08:00',
    }
  }

  const list = mode === 'empty' ? [] : filterRows(mockRows, query)
  const summary = summarizeRows(list)
  return {
    code: 0,
    message: 'success',
    data: {
      camp: {
        campId: query.campId || defaultCampId,
        campName: defaultCampName,
      },
      list,
      summary,
      pagination: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
        total: mode === 'empty' ? 0 : 2,
      },
    },
    traceId:
      mode === 'empty'
        ? 'mock-juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan-empty-001'
        : 'mock-juhe-fenxiao--fenxiao--juhe-fenxiao-dingdan-list-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function filterRows(rows: DistributionOrderItem[], query: DistributionOrderQuery) {
  const keyword = query.keyword?.trim()
  return rows.filter((item) => {
    if (query.settlementState && item.settledState !== query.settlementState) return false
    if (
      keyword &&
      !item.orderId.includes(keyword) &&
      !item.customerInfo.includes(keyword) &&
      !item.roomCategoryName.includes(keyword)
    ) {
      return false
    }
    return true
  })
}

function summarizeRows(rows: DistributionOrderItem[]): DistributionOrderData['summary'] {
  return rows.reduce(
    (summary, item) => ({
      invoicePrice: roundAmount(summary.invoicePrice + item.invoicePrice),
      commission: roundAmount(summary.commission + item.commission),
      incomePrice: roundAmount(summary.incomePrice + item.incomePrice),
      settledPrice: roundAmount(summary.settledPrice + item.settledPrice),
    }),
    { invoicePrice: 0, commission: 0, incomePrice: 0, settledPrice: 0 },
  )
}

function adaptEnvelope(
  envelope: DistributionOrderEnvelope<DistributionOrderEnvelopeData | null>,
  query: DistributionOrderQuery,
  provider: DistributionOrderProviderName,
): DistributionOrderData {
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.message || '聚合分销订单服务暂不可用，请稍后重试')
  }

  return {
    provider,
    campId: envelope.data.camp.campId,
    campName: envelope.data.camp.campName,
    list: envelope.data.list,
    summary: envelope.data.summary,
    pagination: envelope.data.pagination,
    requestedAt: envelope.timestamp,
    requestSummary: buildRequestSummary(query, envelope.traceId),
  }
}

async function loadRealDistributionOrderData(
  query: DistributionOrderQuery,
  signal?: AbortSignal,
): Promise<DistributionOrderData> {
  const payload = await postHudson<unknown>(flowEndpoint, createRealRequest(query), signal)
  const record = asRecord(payload)
  const list = asArray(record.list).map(adaptRealItem)
  const pagination = {
    page: readNumber(record.pageNum ?? record.current, query.page ?? 1),
    pageSize: readNumber(record.size, query.pageSize ?? 20),
    total: readNumber(record.total, list.length),
  }

  return {
    provider: 'api',
    campId: query.campId || defaultCampId,
    campName: defaultCampName,
    list,
    summary: summarizeRows(list),
    pagination,
    requestedAt: new Date().toISOString(),
    requestSummary: buildRequestSummary(query, 'api-hudson-report-flows-get'),
  }
}

function createRealRequest(query: DistributionOrderQuery): Record<string, unknown> {
  return {
    campId: query.campId || defaultCampId,
    pageNum: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
    current: query.page ?? 1,
    bookingStartDate: query.bookingStartDate,
    bookingEndDate: query.bookingEndDate,
    keyword: query.keyword?.trim() || undefined,
    settledState: query.settlementState || undefined,
    breakTemp: false,
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

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

function adaptRealItem(value: unknown): DistributionOrderItem {
  const item = asRecord(value)
  return {
    orderId: String(item.orderId ?? ''),
    customerInfo: String(item.customerInfo ?? ''),
    roomCategoryName: String(item.roomCategoryName ?? ''),
    bookedTime: String(item.bookedTimeStr ?? item.bookedTime ?? ''),
    invoicePrice: readNumber(item.invoicePrice, 0),
    commission: readNumber(item.commission, 0),
    incomePrice: readNumber(item.incomePrice, 0),
    settledPrice: readNumber(item.settledPrice, 0),
    settledState: readSettlementState(item.settledState),
  }
}

function readSettlementState(value: unknown): DistributionOrderSettlementState {
  return value === 1 || value === 'settled' || value === '已结算' ? 'settled' : 'pending'
}

function buildRequestSummary(query: DistributionOrderQuery, traceId: string) {
  return [
    `traceId=${traceId}`,
    `path=${flowEndpoint}`,
    `campId=${query.campId || defaultCampId}`,
    `bookingStartDate=${query.bookingStartDate}`,
    `bookingEndDate=${query.bookingEndDate}`,
    `keyword=${query.keyword?.trim() || '全部订单'}`,
    `settlementState=${query.settlementState || '全部结算状态'}`,
    `page=${query.page ?? 1}`,
    `pageSize=${query.pageSize ?? 20}`,
  ]
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
