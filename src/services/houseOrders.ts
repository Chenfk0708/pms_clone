export type HouseOrderStatus = '进行中' | '已完成' | '已取消' | '已预订'
export type HouseLiveStatus = '入住中' | '已退房' | '已取消' | '待入住'

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
  campId: string
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
}

const HUDSON_API_BASE = 'https://hudson-prod.localhome.cn'

export class HouseOrderRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HouseOrderRequestError'
  }
}

export function resolveHouseOrderCampId() {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('campId')
  const fromStorage = window.localStorage.getItem('pmsCampId')
  const fromEnv = import.meta.env.VITE_PMS_CAMP_ID as string | undefined
  const campId = fromQuery || fromStorage || fromEnv

  if (!campId) {
    throw new HouseOrderRequestError('缺少 campId：请通过 URL query、localStorage.pmsCampId 或 VITE_PMS_CAMP_ID 提供当前门店上下文')
  }

  return campId
}

export async function fetchHouseOrders(filters: HouseOrderFilters, signal?: AbortSignal): Promise<HouseOrderData> {
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

  return {
    rows: adaptHouseOrderRows(readArray(readPath(orderPayload, ['list']))),
    total: readNumber(readPath(orderPayload, ['total']), 0),
    pageNum: readNumber(readPath(orderPayload, ['pageNum']), filters.pageNum),
    pageSize: readNumber(readPath(orderPayload, ['pageSize']), filters.pageSize),
    pages: readNumber(readPath(orderPayload, ['pages']), 0),
    report: adaptHouseOrderReport(reportPayload),
    requestPaths: ['/order/report/get', '/orders/page/get'],
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
    throw new HouseOrderRequestError(`真实接口请求失败：${endpoint}，${error instanceof Error ? error.message : String(error)}`)
  }

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new HouseOrderRequestError(`真实接口请求失败：${endpoint}，HTTP ${response.status}`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new HouseOrderRequestError(`真实接口响应不可解析：${endpoint}`)
  }
  if (payload.success === false) {
    throw new HouseOrderRequestError(String(payload.errorMsg || payload.errorDetail || `真实接口业务失败：${endpoint}`))
  }
  if (payload.data === undefined || payload.data === null) {
    throw new HouseOrderRequestError(`真实接口响应缺少 data 字段：${endpoint}`)
  }

  return payload.data
}

interface HudsonResponse<T> {
  success?: boolean
  errorMsg?: unknown
  errorDetail?: unknown
  data?: T
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

function orderStatus(value: unknown): HouseOrderStatus {
  const numeric = Number(value)
  if (numeric === 2 || numeric === 5) return '已完成'
  if (numeric === 3 || numeric === 9) return '已取消'
  if (numeric === 4) return '进行中'
  return '已预订'
}

function liveStatusFor(value: unknown, fallback: HouseOrderStatus): HouseLiveStatus {
  const numeric = Number(value)
  if (numeric === 2 || fallback === '已完成') return '已退房'
  if (numeric === 3 || fallback === '已取消') return '已取消'
  if (numeric === 4 || fallback === '进行中') return '入住中'
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
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, '')
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
