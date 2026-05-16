export const LONG_RENTAL_ORDER_ENDPOINT = 'https://hudson-prod.localhome.cn/orders/page/get'

export type LongRentalOrderRow = {
  orderNo: string
  channel: string
  tenantName: string
  phone: string
  roomType: string
  room: string
  store: string
  checkInAt: string
  leaveAt: string
  liveStatus: '已取消' | '入住中' | '已退房' | '待入住'
  roomRevenueGross: string
  roomRevenueNet: string
  otherExpense: string
  deposit: string
  totalRevenue: string
  contractStart: string
  contractEnd: string
  contractTerm: string
  paymentMethod: string
  paymentDate: string
  bookedAt: string
  stockFlag: string
  roomFlag: string
  planFlag: string
}

export type LongRentalOrderQuery = {
  campId: string
  pageNum: number
  pageSize: number
  current: number
  keyword?: string
}

type RawLongRentalOrderResponse = {
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
  data?: {
    total?: number
    list?: unknown
  } | null
}

export type LongRentalOrderPageData = {
  total: number
  rows: LongRentalOrderRow[]
}

export function createLongRentalOrderRequestBody(query: LongRentalOrderQuery): Record<string, unknown> {
  const keyword = query.keyword?.trim()
  return {
    campId: query.campId,
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    current: query.current,
    isLt: 1,
    ...(keyword ? { keyword, searchCode: keyword } : {}),
  }
}

export async function fetchLongRentalOrders(
  query: LongRentalOrderQuery,
  signal?: AbortSignal,
): Promise<LongRentalOrderPageData> {
  const body = createLongRentalOrderRequestBody(query)
  const response = await fetch(LONG_RENTAL_ORDER_ENDPOINT, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  const payload = (await response.json().catch(() => null)) as RawLongRentalOrderResponse | null

  if (!response.ok) {
    const message = payload?.errorMsg ?? payload?.errorDetail
    throw new Error(message ? `HTTP ${response.status}：${message}` : `HTTP ${response.status}`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('长租订单接口响应不是 JSON 对象')
  }
  if (payload.success === false) {
    throw new Error(payload.errorMsg || payload.errorDetail || '长租订单接口返回业务失败')
  }
  if (!payload.data || !Array.isArray(payload.data.list)) {
    throw new Error('长租订单接口响应缺少 data.list')
  }

  return {
    total: toNumber(payload.data.total, payload.data.list.length),
    rows: payload.data.list.map(adaptLongRentalOrderRow),
  }
}

function adaptLongRentalOrderRow(value: unknown, index: number): LongRentalOrderRow {
  const row = asRecord(value)
  return {
    orderNo: pickString(row, ['orderId', 'orderNo', 'id']) ?? `long-rental-${index}`,
    channel: pickString(row, ['channelName', 'orderChannelName', 'channel']) ?? '-',
    tenantName: pickString(row, ['contactName', 'guestName', 'tenantName', 'name']) ?? '-',
    phone: pickString(row, ['contactPhone', 'guestMobile', 'phone', 'mobile']) ?? '-',
    roomType: pickString(row, ['roomCategoryName', 'roomTypeName']) ?? '-',
    room: pickString(row, ['roomName', 'roomNo']) ?? '-',
    store: pickString(row, ['poiName', 'campName', 'storeName']) ?? '-',
    checkInAt: pickString(row, ['checkInTime', 'checkInDate']) ?? '-',
    leaveAt: pickString(row, ['checkOutTime', 'checkOutDate']) ?? '-',
    liveStatus: normalizeLiveStatus(pickString(row, ['liveStatusName', 'orderDetailDisplayStateName'])),
    roomRevenueGross: formatCell(firstExisting(row, ['roomRevenue'])),
    roomRevenueNet: formatCell(firstExisting(row, ['roomRevenueWithoutCommission'])),
    otherExpense: formatCell(firstExisting(row, ['otherExpense'])),
    deposit: formatCell(firstExisting(row, ['deposit'])),
    totalRevenue: formatCell(firstExisting(row, ['orderTotalRevenue', 'totalRevenue'])),
    contractStart: pickString(row, ['contractStartDate']) ?? '-',
    contractEnd: pickString(row, ['contractEndDate']) ?? '-',
    contractTerm: pickString(row, ['contractTerm']) ?? '-',
    paymentMethod: pickString(row, ['paymentWayName']) ?? '-',
    paymentDate: pickString(row, ['paymentDateDesc']) ?? '-',
    bookedAt: pickString(row, ['createTime', 'bookedAt']) ?? '-',
    stockFlag: formatStockFlag(firstExisting(row, ['isOccupyStock', 'stockFlag'])),
    roomFlag: pickString(row, ['arrangeRoomStatusName', 'roomFlag']) ?? '',
    planFlag: pickString(row, ['includeStatisticsName', 'planFlag']) ?? '',
  }
}

function normalizeLiveStatus(value: string | undefined): LongRentalOrderRow['liveStatus'] {
  if (value === '入住中' || value === '已退房' || value === '待入住') return value
  return '已取消'
}

function formatStockFlag(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  return String(value)
}

function formatCell(value: unknown) {
  if (value === null || value === undefined || value === '') return '--'
  return String(value)
}

function firstExisting(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') return record[key]
  }
  return undefined
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  const value = firstExisting(record, keys)
  if (value === undefined) return undefined
  return String(value)
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
