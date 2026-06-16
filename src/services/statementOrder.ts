export type StatementOrderProviderName = 'mock' | 'api'
type StatementOrderMockMode = 'success' | 'empty' | 'error'
export type StatementOrderStoreScope = string

export type StatementOrderStoreOption = {
  id: string
  label: string
  poiIds: string[]
}

export type StatementOrderQuery = {
  campId: string
  poiIds: string[]
  bookingStartDate: string
  bookingEndDate: string
  current: number
  pageNum: number
  pageSize: number
  breakTemp: boolean
}

export type StatementOrderRow = {
  orderId: string
  customerInfo: string
  productType: string
  productName: string
  bookingTime: string
  channelName: string
  payableAmount: number
  paidAmount: number
  discountAmount: number
  refundAmount: number
  paymentFee: number
  platformServiceFee: number
  distributorCommission: number
  paymentWayName: string
  settlementAmount: number
}

export type StatementOrderPagination = {
  total: number
  size: number
  current: number
  pageNum: number
  hasNextPage: boolean
  pages: number
}

export type StatementOrderResult = {
  provider: StatementOrderProviderName
  rows: StatementOrderRow[]
  pagination: StatementOrderPagination
  stores: StatementOrderStoreOption[]
  query: StatementOrderQuery
  requestedAt: string
  audit: string[]
}

export type StatementOrderExportResult = {
  provider: StatementOrderProviderName
  downloadUrl: string
  requestedAt: string
  audit: string[]
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorCode?: string | null
}

type StatementOrderEnvelopeData = {
  stores: StatementOrderStoreOption[]
  list: StatementOrderRow[]
  pagination: StatementOrderPagination
}

const realBaseUrl = '/api'
const statementEndpoint = '/report/storer/statement/get'
const exportExcelMenuId = '1732967098146951178'
const defaultCampId = '1796067693589061634'
const currentStorePoiId = '1796425098638573570'
const defaultBookingStartDate = '2026-05-01'
const defaultBookingEndDate = '2026-05-31'

const stores: StatementOrderStoreOption[] = [
  { id: 'all', label: '全部门店', poiIds: [] },
  { id: 'current', label: '天落会宿公寓(前海壹方城宝安中心店)', poiIds: [currentStorePoiId] },
]

const allStoreRows: StatementOrderRow[] = [
  {
    orderId: 'MP202605010001',
    customerInfo: '林小满 / 13800138000',
    productType: '微信小程序',
    productName: '双床影音房',
    bookingTime: '2026-05-01 14:23:00',
    channelName: '路客云聚合',
    payableAmount: 699,
    paidAmount: 699,
    discountAmount: 80,
    refundAmount: 0,
    paymentFee: 8.5,
    platformServiceFee: 36,
    distributorCommission: 24,
    paymentWayName: '微信支付',
    settlementAmount: 550.5,
  },
  {
    orderId: 'MP202605010007',
    customerInfo: '顾南栀 / 13900001111',
    productType: '品牌官网',
    productName: '总裁套间（桑拿浴缸露台电竞麻将）',
    bookingTime: '2026-05-05 21:10:00',
    channelName: '美团民宿',
    payableAmount: 899,
    paidAmount: 859,
    discountAmount: 40,
    refundAmount: 0,
    paymentFee: 10.2,
    platformServiceFee: 43,
    distributorCommission: 28,
    paymentWayName: '平台代收',
    settlementAmount: 777.8,
  },
  {
    orderId: 'MP202605010101',
    customerInfo: '唐知夏 / 13755554444',
    productType: '抖音团购',
    productName: '电竞大床房',
    bookingTime: '2026-05-11 09:18:00',
    channelName: '抖音来客',
    payableAmount: 399,
    paidAmount: 399,
    discountAmount: 0,
    refundAmount: 0,
    paymentFee: 4.5,
    platformServiceFee: 20,
    distributorCommission: 12,
    paymentWayName: '支付宝',
    settlementAmount: 362.5,
  },
]

const currentStoreRows: StatementOrderRow[] = [
  allStoreRows[2],
  {
    orderId: 'MP202605010131',
    customerInfo: '赵清和 / 13666668888',
    productType: '微信小程序',
    productName: '城景露台房',
    bookingTime: '2026-05-18 17:42:00',
    channelName: '路客云聚合',
    payableAmount: 588,
    paidAmount: 568,
    discountAmount: 20,
    refundAmount: 0,
    paymentFee: 6.8,
    platformServiceFee: 28,
    distributorCommission: 16,
    paymentWayName: '微信支付',
    settlementAmount: 517.2,
  },
]

export function getStatementOrderStoreOptions() {
  return stores
}

export async function loadStatementOrderData(
  scope: StatementOrderStoreScope,
  signal?: AbortSignal,
): Promise<StatementOrderResult> {
  const query = createStatementOrderQuery(scope)
  if (resolveProvider() === 'api') {
    return loadRealStatementOrderData(scope, query, signal)
  }

  await waitForMockLatency(signal)
  const envelope = buildMockStatementEnvelope(scope, query)
  return adaptStatementEnvelope(resolveProvider(), query, envelope)
}

export async function exportStatementOrderData(
  scope: StatementOrderStoreScope,
  signal?: AbortSignal,
): Promise<StatementOrderExportResult> {
  const query = createStatementOrderQuery(scope)
  if (resolveProvider() === 'api') {
    return exportRealStatementOrderData(query, signal)
  }

  await waitForMockLatency(signal)
  const envelope = buildMockExportEnvelope(scope, query)
  return adaptExportEnvelope(resolveProvider(), query, envelope)
}

export function createStatementOrderQuery(scope: StatementOrderStoreScope): StatementOrderQuery {
  const poiIds = resolveStatementOrderPoiIds(scope)
  return {
    campId: resolveCampId(),
    poiIds,
    bookingStartDate: defaultBookingStartDate,
    bookingEndDate: defaultBookingEndDate,
    current: 1,
    pageNum: 1,
    pageSize: 20,
    breakTemp: false,
  }
}

function resolveProvider(): StatementOrderProviderName {
  const configured = readUrlProvider() || import.meta.env.VITE_STATEMENT_ORDER_PROVIDER || readRuntimeConfig('pms.statementOrderProvider')
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function readUrlProvider(): StatementOrderProviderName | 'real' | '' {
  if (typeof window === 'undefined') return ''
  const configured =
    readProviderFromSearch(window.location.search) ||
    readProviderFromSearch(window.location.hash.split('?')[1] ? `?${window.location.hash.split('?')[1]}` : '')
  return configured === 'mock' || configured === 'api' || configured === 'real' ? configured : ''
}

function readProviderFromSearch(search: string) {
  const params = new URLSearchParams(search)
  return params.get('provider') || params.get('statementOrderProvider') || ''
}

function resolveMockMode(): StatementOrderMockMode {
  const fromUrl = readUrlMockMode()
  if (fromUrl) return fromUrl
  const configured = readRuntimeConfig('pms.statementOrderMockMode') || import.meta.env.VITE_STATEMENT_ORDER_MOCK_MODE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readUrlMockMode(): StatementOrderMockMode | '' {
  if (typeof window === 'undefined') return ''
  const configured =
    readMockModeFromSearch(window.location.search) ||
    readMockModeFromSearch(window.location.hash.split('?')[1] ? `?${window.location.hash.split('?')[1]}` : '')
  return configured === 'empty' || configured === 'error' || configured === 'success' ? configured : ''
}

function readMockModeFromSearch(search: string) {
  const params = new URLSearchParams(search)
  return params.get('mockState') || params.get('statementOrderMockMode') || ''
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function resolveCampId(fallback = defaultCampId) {
  const storageCampId =
    readRuntimeConfig('pmsCampId') || readRuntimeConfig('pms.currentCampId') || readRuntimeConfig('pms.campId')
  const envCampId = (import.meta.env.VITE_PMS_CAMP_ID as string | undefined)?.trim() || ''
  return storageCampId || envCampId || fallback
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 220)
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

function buildMockStatementEnvelope(
  scope: StatementOrderStoreScope,
  query: StatementOrderQuery,
): ApiEnvelope<StatementOrderEnvelopeData | null> {
  const mode = resolveMockMode()
  if (mode === 'error') {
    return {
      code: 50318,
      message: '品牌小程序订单服务暂不可用，请稍后重试',
      data: null,
      traceId: 'mock-baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan-error-001',
      timestamp: '2026-05-19T21:20:00+08:00',
    }
  }

  const rows = mode === 'empty' ? [] : query.poiIds.length > 0 ? currentStoreRows : allStoreRows
  return {
    code: 0,
    message: 'success',
    data: {
      stores,
      list: rows,
      pagination: {
        total: rows.length,
        size: query.pageSize,
        current: query.current,
        pageNum: query.pageNum,
        hasNextPage: false,
        pages: rows.length ? 1 : 0,
      },
    },
    traceId:
      mode === 'empty'
        ? 'mock-baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan-empty-001'
        : `mock-baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan-${scope}-001`,
    timestamp: '2026-05-19T21:20:00+08:00',
  }
}

function buildMockExportEnvelope(
  scope: StatementOrderStoreScope,
  query: StatementOrderQuery,
): ApiEnvelope<{ downloadUrl: string }> {
  const scopeKey = query.poiIds[0] ?? (scope === 'current' ? currentStorePoiId : 'all')
  return {
    code: 0,
    message: 'success',
    data: {
      downloadUrl: `https://download.mock.local/statement-order/${scopeKey}/${query.bookingStartDate}_${query.bookingEndDate}.xlsx`,
    },
    traceId: `mock-baobiao--jiesuanbiao--pinpai-xiaochengxu-dingdan-export-${scopeKey}-001`,
    timestamp: '2026-05-19T21:20:00+08:00',
  }
}

function adaptStatementEnvelope(
  provider: StatementOrderProviderName,
  query: StatementOrderQuery,
  envelope: ApiEnvelope<StatementOrderEnvelopeData | null>,
): StatementOrderResult {
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.message || '品牌小程序订单服务暂不可用，请稍后重试')
  }

  return {
    provider,
    rows: envelope.data.list,
    pagination: envelope.data.pagination,
    stores: envelope.data.stores,
    query,
    requestedAt: envelope.timestamp,
    audit: buildStatementAudit(provider, query, envelope.data.pagination.total, envelope.traceId),
  }
}

function adaptExportEnvelope(
  provider: StatementOrderProviderName,
  query: StatementOrderQuery,
  envelope: ApiEnvelope<{ downloadUrl: string } | null>,
): StatementOrderExportResult {
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.message || '品牌小程序订单导出任务创建失败，请稍后重试')
  }

  return {
    provider,
    downloadUrl: envelope.data.downloadUrl,
    requestedAt: envelope.timestamp,
    audit: buildExportAudit(provider, query, envelope.traceId, envelope.data.downloadUrl),
  }
}

async function loadRealStatementOrderData(
  _scope: StatementOrderStoreScope,
  query: StatementOrderQuery,
  signal?: AbortSignal,
): Promise<StatementOrderResult> {
  const payload = await postHudson<unknown>(statementEndpoint, buildStatementRequestBody(query), signal)
  const record = asRecord(payload)
  const list = asArray(record.list).map(adaptRealRow)
  const pagination: StatementOrderPagination = {
    total: readNumber(record.total, list.length),
    size: readNumber(record.size, query.pageSize),
    current: readNumber(record.current, query.current),
    pageNum: readNumber(record.pageNum, query.pageNum),
    hasNextPage: Boolean(record.hasNextPage),
    pages: readNumber(record.pages, list.length ? 1 : 0),
  }

  return {
    provider: 'api',
    rows: list,
    pagination,
    stores,
    query,
    requestedAt: new Date().toISOString(),
    audit: buildStatementAudit('api', query, pagination.total, 'api-report-storer-statement-get'),
  }
}

async function exportRealStatementOrderData(
  query: StatementOrderQuery,
  signal?: AbortSignal,
): Promise<StatementOrderExportResult> {
  const payload = await postHudson<string>(
    statementEndpoint,
    {
      ...buildStatementRequestBody(query),
      pageSize: 9999,
      exportExcelMenuId,
    },
    signal,
  )

  return {
    provider: 'api',
    downloadUrl: typeof payload === 'string' ? payload : '',
    requestedAt: new Date().toISOString(),
    audit: buildExportAudit('api', query, 'api-report-storer-statement-export', typeof payload === 'string' ? payload : ''),
  }
}

function buildStatementRequestBody(query: StatementOrderQuery) {
  return {
    campId: query.campId,
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    current: query.current,
    ...(query.poiIds.length ? { poiIds: query.poiIds } : {}),
    bookingStartDate: query.bookingStartDate,
    bookingEndDate: query.bookingEndDate,
    breakTemp: query.breakTemp,
  }
}

function resolveStatementOrderPoiIds(scope: StatementOrderStoreScope) {
  if (!scope || scope === 'all') return []
  const store = stores.find((item) => item.id === scope)
  if (store) return [...store.poiIds]
  return [scope]
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

function adaptRealRow(value: unknown): StatementOrderRow {
  const record = asRecord(value)
  return {
    orderId: readString(record, ['orderId', 'orderNo', 'id']),
    customerInfo: combineCustomerInfo(record),
    productType: readString(record, ['productType', 'productTypeName', 'goodsTypeName']),
    productName: readString(record, ['productName', 'roomCategoryName', 'goodsName']),
    bookingTime: readString(record, ['bookingTime', 'bookingTimeStr', 'bookedTime', 'createTimeStr']),
    channelName: readString(record, ['channelName', 'channel', 'channelTypeName']),
    payableAmount: readNumber(record.payableAmount ?? record.shouldPayAmount ?? record.orderAmount, 0),
    paidAmount: readNumber(record.paidAmount ?? record.actualAmount ?? record.realPayAmount, 0),
    discountAmount: readNumber(record.discountAmount ?? record.discountPrice ?? record.couponAmount, 0),
    refundAmount: readNumber(record.refundAmount ?? record.refundPrice, 0),
    paymentFee: readNumber(record.paymentFee ?? record.serviceCharge ?? record.paymentServiceFee, 0),
    platformServiceFee: readNumber(record.platformServiceFee ?? record.platformFee, 0),
    distributorCommission: readNumber(record.distributorCommission ?? record.allMemberCommission ?? record.commission, 0),
    paymentWayName: readString(record, ['paymentWayName', 'paymentTypeName', 'payWayName']),
    settlementAmount: readNumber(record.settlementAmount ?? record.settleAmount ?? record.incomePrice, 0),
  }
}

function combineCustomerInfo(record: Record<string, unknown>) {
  const direct = readString(record, ['customerInfo'])
  if (direct) return direct

  const customerName = readString(record, ['customerName', 'guestName', 'memberName'])
  const mobile = readString(record, ['mobile', 'phone', 'telephone'])
  return [customerName, mobile].filter(Boolean).join(' / ')
}

function buildStatementAudit(
  provider: StatementOrderProviderName,
  query: StatementOrderQuery,
  total: number,
  traceId: string,
) {
  return [
    `provider=${provider}`,
    `path=${statementEndpoint}`,
    `campId=${query.campId}`,
    `poiIds=${query.poiIds.join(',') || 'all'}`,
    `bookingStartDate=${query.bookingStartDate}`,
    `bookingEndDate=${query.bookingEndDate}`,
    `pageSize=${query.pageSize}`,
    `total=${total}`,
    `traceId=${traceId}`,
  ]
}

function buildExportAudit(
  provider: StatementOrderProviderName,
  query: StatementOrderQuery,
  traceId: string,
  downloadUrl: string,
) {
  return [
    `provider=${provider}`,
    `path=${statementEndpoint}`,
    `campId=${query.campId}`,
    `poiIds=${query.poiIds.join(',') || 'all'}`,
    `pageSize=9999`,
    `exportExcelMenuId=${exportExcelMenuId}`,
    `traceId=${traceId}`,
    `downloadUrl=${downloadUrl}`,
  ]
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function readNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
