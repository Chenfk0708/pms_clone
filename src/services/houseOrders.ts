export type HouseOrderStatus = '进行中' | '已完成' | '已取消' | '已预订'
export type HouseLiveStatus = '入住中' | '已退房' | '已取消' | '待入住'
export type HouseOrderProviderMode = 'mock' | 'api'
export type HouseOrderMockState = 'success' | 'empty' | 'error'

export interface ApiResponseEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

export interface HouseOrderRow {
  orderNo: string
  channel: string
  status: HouseOrderStatus
  contact: string
  phone: string
  stayType: string
  roomType: string
  room: string
  store: string
  checkInAt: string
  leaveAt: string
  liveStatus: HouseLiveStatus
  afterSaleStatus: string
  roomRevenueNet: string
  otherExpense: string
  roomRevenueGross: string
  totalRevenue: string
  debt: string
  bookedAt: string
  channelOrderNo: string
  stockFlag: string
  roomFlag: string
  planFlag: string
  needsRoomAssignment?: boolean
  commission?: string
  collected?: string
  confirmNo?: string
}

export interface HouseOrderFilters {
  campId?: string
  pageNum: number
  pageSize: number
  orderType: string
  keyword: string
}

export interface HouseOrderReport {
  todayNewOrder: number
  todayPredictCheckIn: number
  staying: number
  todayPredictCheckOut: number
  tomorrowCheckIn: number
  tomorrowCheckOut: number
  pending: number
  refunding: number
  exception: number
}

export interface HouseOrderData {
  rows: HouseOrderRow[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
  report: HouseOrderReport
  requestPaths: string[]
  providerMode: HouseOrderProviderMode
  traceIds: string[]
}

export interface HouseOrderActionResponse {
  orderId: string
  status?: string
  message?: string
}

interface HouseOrderListData {
  list: unknown[]
  total: number
  pageNum: number
  pageSize: number
  pages: number
}

const HUDSON_API_BASE = '/api'
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'
const DEFAULT_MOCK_CAMP_ID = 'mock-camp-qianhai-001'
const REQUEST_PATHS = ['/order/report/get', '/orders/page/get']

export class HouseOrderRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HouseOrderRequestError'
  }
}

export function resolveHouseOrderCampId() {
  const params = readHouseOrderSearchParams()
  return (
    params.get('campId') ||
    window.localStorage.getItem('pmsCampId') ||
    window.localStorage.getItem('pms.currentCampId') ||
    readStoredUserCampId() ||
    (import.meta.env.VITE_PMS_CAMP_ID as string | undefined) ||
    ''
  )
}

export function resolveHouseOrderProviderMode(): HouseOrderProviderMode {
  const params = readHouseOrderSearchParams()
  const configured =
    params.get('houseOrderProvider') ||
    window.localStorage.getItem('pms.houseOrderProvider') ||
    (import.meta.env.VITE_HOUSE_ORDER_PROVIDER as string | undefined) ||
    'api'

  if (configured === 'api' || configured === 'real') return 'api'
  if (configured === 'mock') return 'mock'
  throw new HouseOrderRequestError(`住宿订单数据源配置无效：${configured}`)
}

export async function fetchHouseOrders(filters: HouseOrderFilters, signal?: AbortSignal): Promise<HouseOrderData> {
  const providerMode = resolveHouseOrderProviderMode()

  if (providerMode === 'mock') {
    return fetchMockHouseOrders(filters, resolveHouseOrderMockState(), signal)
  }

  if (!filters.campId) {
    throw new HouseOrderRequestError('缺少 campId：api 数据源需要明确的门店上下文')
  }

  return fetchApiHouseOrders(filters, signal)
}

export async function cancelHouseOrder(request: {
  campId: string
  orderId: string
  reason?: string
}): Promise<HouseOrderActionResponse> {
  const data = await postHudson<unknown>(`/orders/${encodeURIComponent(request.orderId)}/cancel`, {
    campId: request.campId,
    reason: request.reason,
  })
  if (!isRecord(data)) {
    throw new HouseOrderRequestError('取消订单响应缺少 data 字段')
  }

  return {
    orderId: readString(readPath(data, ['orderId'])) || readString(readPath(data, ['id'])) || request.orderId,
    status: readString(readPath(data, ['status'])) || readString(readPath(data, ['orderStatus'])) || readString(readPath(data, ['liveStatus'])),
    message: readString(readPath(data, ['message'])) || '订单取消成功',
  }
}

export async function skipStockHouseOrder(request: {
  campId: string
  orderId: string
  reason?: string
}): Promise<HouseOrderActionResponse> {
  const data = await postHudson<unknown>(`/orders/${encodeURIComponent(request.orderId)}/skip-stock`, {
    campId: request.campId,
    reason: request.reason,
  })
  if (!isRecord(data)) {
    throw new HouseOrderRequestError('不占库存响应缺少 data 字段')
  }

  return {
    orderId: readString(readPath(data, ['orderId'])) || readString(readPath(data, ['id'])) || request.orderId,
    status: readString(readPath(data, ['status'])) || readString(readPath(data, ['orderStatus'])) || readString(readPath(data, ['liveStatus'])),
    message: readString(readPath(data, ['message'])) || '订单已释放库存并取消排房',
  }
}

function resolveHouseOrderMockState(): HouseOrderMockState {
  const params = readHouseOrderSearchParams()
  const state = params.get('houseOrderMockState') || window.localStorage.getItem('pms.houseOrderMockState') || 'success'
  if (state === 'success' || state === 'empty' || state === 'error') return state
  throw new HouseOrderRequestError(`住宿订单数据状态配置无效：${state}`)
}

function readHouseOrderSearchParams() {
  const params = new URLSearchParams(window.location.search)
  const hashQuery = window.location.hash.split('?')[1]
  if (!hashQuery) return params

  const hashParams = new URLSearchParams(hashQuery)
  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value)
  })
  return params
}

function readStoredUserCampId() {
  const rawValue = window.localStorage.getItem('pms_user')?.trim()
  if (!rawValue) return ''

  try {
    const user = JSON.parse(rawValue) as Record<string, unknown>
    const campId = user.campId ?? user.currentCampId
    if (typeof campId === 'string' || typeof campId === 'number') {
      return String(campId).trim()
    }

    // 兼容旧登录代码曾把 campId 写入 campName 的会话格式。
    const legacyCampName = user.campName
    if (typeof legacyCampName === 'string' || typeof legacyCampName === 'number') {
      const candidate = String(legacyCampName).trim()
      return /^\d+$/.test(candidate) ? candidate : ''
    }
  } catch {
    return ''
  }

  return ''
}

async function fetchMockHouseOrders(
  filters: HouseOrderFilters,
  state: HouseOrderMockState,
  signal?: AbortSignal,
): Promise<HouseOrderData> {
  await waitForMockLatency(signal)

  const reportEnvelope = buildSuccessEnvelope<HouseOrderReport>(
    'mock-dingdan--zhusu-dingdan--zhusu-dingdan-report-001',
    state === 'empty' ? emptyReport() : MOCK_REPORT,
  )

  if (state === 'error') {
    const failedEnvelope = buildEnvelope<HouseOrderListData>(
      503,
      '住宿订单数据服务暂时不可用',
      { list: [], total: 0, pageNum: filters.pageNum, pageSize: filters.pageSize, pages: 0 },
      'mock-dingdan--zhusu-dingdan--zhusu-dingdan-list-error-001',
    )
    return adaptHouseOrderEnvelopes(reportEnvelope, failedEnvelope, 'mock')
  }

  const rows = state === 'empty' ? [] : filterMockRows(filters)
  const listEnvelope = buildSuccessEnvelope<HouseOrderListData>(
    'mock-dingdan--zhusu-dingdan--zhusu-dingdan-list-001',
    {
      list: rows,
      total: rows.length,
      pageNum: filters.pageNum,
      pageSize: filters.pageSize,
      pages: rows.length ? 1 : 0,
    },
  )

  return adaptHouseOrderEnvelopes(reportEnvelope, listEnvelope, 'mock')
}

async function fetchApiHouseOrders(filters: HouseOrderFilters, signal?: AbortSignal): Promise<HouseOrderData> {
  const orderBody = {
    campId: filters.campId,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    orderType: filters.orderType,
    isLt: 0,
    searchContent: filters.keyword || undefined,
  }

  const [reportPayload, orderPayload] = await Promise.all([
    postHudson<unknown>('/order/report/get', { campId: filters.campId }, signal),
    postHudson<unknown>('/orders/page/get', orderBody, signal),
  ])

  const reportEnvelope = buildSuccessEnvelope<HouseOrderReport>(
    'api-dingdan--zhusu-dingdan--zhusu-dingdan-report-001',
    adaptHouseOrderReport(reportPayload),
  )
  const listEnvelope = buildSuccessEnvelope<HouseOrderListData>(
    'api-dingdan--zhusu-dingdan--zhusu-dingdan-list-001',
    {
      list: readArray(readPath(orderPayload, ['list'])),
      total: readNumber(readPath(orderPayload, ['total']), 0),
      pageNum: readNumber(readPath(orderPayload, ['pageNum']), filters.pageNum),
      pageSize: readNumber(readPath(orderPayload, ['pageSize']), filters.pageSize),
      pages: readNumber(readPath(orderPayload, ['pages']), 0),
    },
  )

  return adaptHouseOrderEnvelopes(reportEnvelope, listEnvelope, 'api')
}

function adaptHouseOrderEnvelopes(
  reportEnvelope: ApiResponseEnvelope<HouseOrderReport>,
  listEnvelope: ApiResponseEnvelope<HouseOrderListData>,
  providerMode: HouseOrderProviderMode,
): HouseOrderData {
  assertEnvelopeOk(reportEnvelope, '住宿订单统计')
  assertEnvelopeOk(listEnvelope, '住宿订单列表')

  return {
    rows: adaptHouseOrderRows(readArray(listEnvelope.data.list)),
    total: readNumber(listEnvelope.data.total, 0),
    pageNum: readNumber(listEnvelope.data.pageNum, 1),
    pageSize: readNumber(listEnvelope.data.pageSize, 20),
    pages: readNumber(listEnvelope.data.pages, 0),
    report: reportEnvelope.data,
    requestPaths: REQUEST_PATHS,
    providerMode,
    traceIds: [reportEnvelope.traceId, listEnvelope.traceId],
  }
}

function assertEnvelopeOk<T>(envelope: ApiResponseEnvelope<T>, label: string) {
  if (envelope.code !== 0) {
    throw new HouseOrderRequestError(`${label}返回失败：${envelope.message}（traceId=${envelope.traceId}）`)
  }
}

function buildSuccessEnvelope<T>(traceId: string, data: T): ApiResponseEnvelope<T> {
  return buildEnvelope(0, 'success', data, traceId)
}

function buildEnvelope<T>(code: number, message: string, data: T, traceId: string): ApiResponseEnvelope<T> {
  return {
    code,
    message,
    data,
    traceId,
    timestamp: MOCK_TIMESTAMP,
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${HUDSON_API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    throw new HouseOrderRequestError(`api 数据源请求失败：${endpoint}，${error instanceof Error ? error.message : String(error)}`)
  }

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new HouseOrderRequestError(`api 数据源请求失败：${endpoint}，HTTP ${response.status}`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new HouseOrderRequestError(`api 数据源响应不可解析：${endpoint}`)
  }
  if (payload.success === false) {
    throw new HouseOrderRequestError(String(payload.errorMsg || payload.errorDetail || `api 数据源业务失败：${endpoint}`))
  }
  if (payload.data === undefined || payload.data === null) {
    throw new HouseOrderRequestError(`api 数据源响应缺少 data 字段：${endpoint}`)
  }

  return payload.data
}

interface HudsonResponse<T> {
  success?: boolean
  errorMsg?: unknown
  errorDetail?: unknown
  data?: T
}

function filterMockRows(filters: HouseOrderFilters) {
  const keyword = filters.keyword.trim().toLowerCase()
  return MOCK_ORDER_ROWS.filter((item) => {
    const detail = readArray(readPath(item, ['orderDetailViews']))[0]
    const orderType = String(readPath(item, ['mockOrderType']) ?? '')
    if (filters.orderType && orderType !== filters.orderType) return false
    if (!keyword) return true

    return [
      readPath(item, ['orderId']),
      readPath(item, ['outOrderId']),
      readPath(item, ['channelName']),
      readPath(item, ['guestName']),
      readPath(item, ['guestMobile']),
      readPath(detail, ['roomName']),
      readPath(detail, ['roomCategoryName']),
      readPath(detail, ['poiName']),
    ]
      .join(' ')
      .toLowerCase()
      .includes(keyword)
  })
}

function waitForMockLatency(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
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

function adaptHouseOrderRows(items: unknown[]): HouseOrderRow[] {
  return items.map((item) => {
    const detail = readArray(readPath(item, ['orderDetailViews']))[0]
    const checkInAt = formatDateTime(readPath(detail, ['checkInDate']))
    const leaveAt = formatDateTime(readPath(detail, ['checkOutDate']))
    const room = readString(readPath(detail, ['roomName'])) || '-'
    const needsRoomAssignment = readNumber(readPath(detail, ['isArrangeRoom']), 1) === 0
    const status = orderStatus(readPath(item, ['orderState']))
    const liveStatus = liveStatusFor(readPath(detail, ['orderDetailDisplayState']), status)

    return {
      orderNo: readString(readPath(item, ['orderId'])) || '-',
      channel: readString(readPath(item, ['channelName'])) || readString(readPath(item, ['orderChannelName'])) || channelName(readPath(item, ['channelId'])),
      status,
      contact: readString(readPath(item, ['guestName'])) || '-',
      phone: readString(readPath(item, ['guestMobile'])) || '-',
      stayType: readString(readPath(detail, ['roomCategoryProductName'])) || '全日房',
      roomType: readString(readPath(detail, ['roomCategoryName'])) || '-',
      room,
      store: readString(readPath(detail, ['poiName'])) || '-',
      checkInAt,
      leaveAt,
      liveStatus,
      afterSaleStatus: afterSaleStatus(readPath(item, ['refundDisplayState'])),
      roomRevenueNet: formatMoney(readPath(item, ['totalRoomPrice']) ?? readPath(detail, ['roomPrice'])),
      otherExpense: formatMoney(readPath(item, ['otherPrice']) ?? readPath(detail, ['otherPrice'])),
      roomRevenueGross: formatMoney(readPath(item, ['includeCommissionRoomPrice']) ?? readPath(detail, ['includeCommissionRoomPrice'])),
      totalRevenue: formatMoney(readPath(item, ['orderTotalIncomePrice']) ?? readPath(item, ['orderTotalPrice'])),
      debt: formatMoney(readPath(item, ['debtPrice'])),
      bookedAt: formatDateTime(readPath(item, ['bookedTime']) ?? readPath(item, ['createTime'])),
      channelOrderNo: readString(readPath(item, ['outOrderId'])) || '-',
      stockFlag: readNumber(readPath(detail, ['isOccupation']), 1) ? '1' : '',
      roomFlag: needsRoomAssignment ? '未排房' : '',
      planFlag: readNumber(readPath(detail, ['isStatistics']), 1) ? '1' : '',
      needsRoomAssignment,
      collected: formatMoney(readPath(item, ['totalPayPrice'])),
      commission: formatMoney(readPath(item, ['commissionPrice'])),
      confirmNo: readString(readPath(item, ['confirmNo'])),
    }
  })
}

function adaptHouseOrderReport(data: unknown): HouseOrderReport {
  return {
    todayNewOrder: readNumber(readPath(data, ['todayNewOrder']), 0),
    todayPredictCheckIn: readNumber(readPath(data, ['todayPredictCheckIn']), 0),
    staying: readNumber(readPath(data, ['staying']), 0),
    todayPredictCheckOut: readNumber(readPath(data, ['todayPredictCheckOut']), 0),
    tomorrowCheckIn: readNumber(readPath(data, ['tomorrowCheckIn']), 0),
    tomorrowCheckOut: readNumber(readPath(data, ['tomorrowCheckOut']), 0),
    pending: readNumber(readPath(data, ['pending']), 0),
    refunding: readNumber(readPath(data, ['refunding']), 0),
    exception: readNumber(readPath(data, ['exception']), 0),
  }
}

function emptyReport(): HouseOrderReport {
  return {
    todayNewOrder: 0,
    todayPredictCheckIn: 0,
    staying: 0,
    todayPredictCheckOut: 0,
    tomorrowCheckIn: 0,
    tomorrowCheckOut: 0,
    pending: 0,
    refunding: 0,
    exception: 0,
  }
}

function orderStatus(value: unknown): HouseOrderStatus {
  const text = String(value ?? '').trim().toLowerCase()
  if (text === 'checked_in' || text === 'checked-in' || text === 'living' || text === '进行中' || text === '入住中') return '进行中'
  if (text === 'completed' || text === 'checked_out' || text === 'checked-out' || text === '已完成' || text === '已退房') return '已完成'
  if (text === 'cancelled' || text === 'canceled' || text === 'refunded' || text === '已取消') return '已取消'
  if (text === 'pending' || text === 'booked' || text === '已预订' || text === '待入住') return '已预订'

  const numeric = Number(value)
  if (numeric === 3) return '进行中'
  if (numeric === 4) return '已完成'
  if (numeric === 5 || numeric === 7 || numeric === 8 || numeric === 9 || numeric === 10) return '已取消'
  return '已预订'
}

function liveStatusFor(value: unknown, fallback: HouseOrderStatus): HouseLiveStatus {
  const text = String(value ?? '').trim().toLowerCase()
  if (text === 'checked_in' || text === 'checked-in' || text === 'living' || text === '入住中') return '入住中'
  if (text === 'completed' || text === 'checked_out' || text === 'checked-out' || text === '已退房') return '已退房'
  if (text === 'cancelled' || text === 'canceled' || text === 'refunded' || text === '已取消') return '已取消'
  if (text === 'pending' || text === 'booked' || text === '待入住') return '待入住'

  const numeric = Number(value)
  if (numeric === 2) return '入住中'
  if (numeric === 3) return '已退房'
  if (numeric === 4) return '已取消'
  if (fallback === '进行中') return '入住中'
  if (fallback === '已完成') return '已退房'
  if (fallback === '已取消') return '已取消'
  return '待入住'
}

function afterSaleStatus(value: unknown) {
  const numeric = Number(value)
  return numeric > 0 ? String(value) : '--'
}

function channelName(value: unknown) {
  const id = String(value ?? '')
  const channelMap: Record<string, string> = {
    '5': '携程',
    '6': '美团酒店',
    '8': '飞猪淘酒店',
    '17': '路客云聚合',
  }
  return channelMap[id] || '-'
}

function readPath(value: unknown, path: string[]) {
  let current = value
  for (const segment of path) {
    if (!isRecord(current)) return undefined
    current = current[segment]
  }
  return current
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  return String(value)
}

function readNumber(value: unknown, fallback: number) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function formatMoney(value: unknown) {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return '0'
  const amount = Number.isInteger(number) && Math.abs(number) >= 1000 ? number / 100 : number
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '')
}

function formatDateTime(value: unknown) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  const date = new Date(number)
  if (Number.isNaN(date.getTime())) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

const MOCK_REPORT: HouseOrderReport = {
  todayNewOrder: 2,
  todayPredictCheckIn: 1,
  staying: 0,
  todayPredictCheckOut: 0,
  tomorrowCheckIn: 1,
  tomorrowCheckOut: 0,
  pending: 0,
  refunding: 0,
  exception: 1,
}

const MOCK_ORDER_ROWS = [
  {
    orderId: '2055526750698446849',
    outOrderId: '1128147967607231',
    channelName: '携程',
    guestName: '蔡勇君',
    guestMobile: null,
    orderState: 1,
    refundDisplayState: 0,
    type: 1,
    isLt: 0,
    mockOrderType: '11',
    campId: DEFAULT_MOCK_CAMP_ID,
    includeCommissionRoomPrice: 395,
    totalRoomPrice: 308,
    otherPrice: 0,
    orderTotalIncomePrice: 395,
    totalPayPrice: 395,
    commissionPrice: 87,
    debtPrice: 0,
    bookedTime: 1778910741000,
    confirmNo: '1128147967607231',
    orderDetailViews: [
      {
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        roomCategoryProductName: '全日房',
        roomName: '房间1',
        checkInDate: 1778943600000,
        checkOutDate: 1779019200000,
        duration: '1晚',
        orderDetailDisplayState: 4,
        isArrangeRoom: 1,
        isOccupation: 1,
        isStatistics: 1,
      },
    ],
  },
  {
    orderId: '2055103007337734146',
    outOrderId: '5115623835635087439',
    channelName: '飞猪淘酒店',
    guestName: '黄国辉',
    guestMobile: '+8617328513805',
    orderState: 1,
    type: 1,
    isLt: 0,
    mockOrderType: '4',
    campId: DEFAULT_MOCK_CAMP_ID,
    includeCommissionRoomPrice: 2116.53,
    totalRoomPrice: 1980.85,
    otherPrice: 0,
    orderTotalIncomePrice: 2116.53,
    totalPayPrice: 2116.53,
    commissionPrice: 135.68,
    debtPrice: 0,
    bookedTime: 1778809710000,
    orderDetailViews: [
      {
        poiName: '天落会宿公寓(前海壹方城宝安中心店)',
        roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
        roomCategoryProductName: '全日房',
        roomName: '',
        checkInDate: 1778943600000,
        checkOutDate: 1779547200000,
        duration: '7晚',
        orderDetailDisplayState: 1,
        isArrangeRoom: 0,
        isOccupation: 1,
        isStatistics: 1,
      },
    ],
  },
]
