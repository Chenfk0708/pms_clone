export type CellTone = 'free' | 'blank' | 'sold' | 'disabled' | 'booking-blue' | 'booking-gold' | 'booking-teal'

export interface MonthDateColumn {
  fullDate: string
  isoDate: string
  date: string
  weekday: string
  remain: string
  hot: boolean
}

export interface MonthCell {
  title: string
  subtitle?: string
  amount?: string
  stayRange?: string
  totalIncome?: string
  phone?: string
  remark?: string
  orderId?: string
  badge?: string
  tone: CellTone
}

export interface MonthRoomGroup {
  id: string
  label: string
  roomLabel: string
  roomId: string
  typeCells: MonthCell[]
  roomCells: MonthCell[]
}

export interface HouseMonthsSnapshot {
  rows: MonthRoomGroup[]
  requestPaths: string[]
}

export interface HouseMonthsFilters {
  campId: string
  startDate: string
  days: number
  queryCode?: string
  roomCategoryId?: string
}

const HUDSON_API_BASE = 'https://hudson-prod.localhome.cn'
const REQUEST_PATHS = [
  '/roomStatuses/rooms/get',
  '/roomStatuses/occ/get',
  '/roomStatuses/inv/get',
  '/roomStatuses/block/get',
  '/roomStatuses/dailyMonitor/get',
  '/roomStatuses/redDot/get',
  '/roomStatuses/orderDetails/get',
] as const

export async function fetchHouseMonthsSnapshot(filters: HouseMonthsFilters, columns: MonthDateColumn[]): Promise<HouseMonthsSnapshot> {
  const payload = buildPayload(filters)
  const [rooms, occ, inv, block, dailyMonitor, redDot, orderDetails] = await Promise.all(
    REQUEST_PATHS.map((requestPath) => postHudsonJson(requestPath, payload)),
  )

  return {
    rows: adaptHouseMonthsRows({ rooms, occ, inv, block, dailyMonitor, redDot, orderDetails }, columns),
    requestPaths: [...REQUEST_PATHS],
  }
}

function buildPayload(filters: HouseMonthsFilters) {
  return {
    campId: filters.campId,
    startDate: filters.startDate,
    days: filters.days,
    queryCode: filters.queryCode || undefined,
    roomCategoryIds: filters.roomCategoryId ? [filters.roomCategoryId] : undefined,
  }
}

async function postHudsonJson(pathname: string, body: Record<string, unknown>) {
  let response: Response
  try {
    response = await fetch(`${HUDSON_API_BASE}${pathname}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(`真实接口请求失败：${pathname}，${error instanceof Error ? error.message : String(error)}`)
  }

  if (!response.ok) {
    throw new Error(`真实接口请求失败：${pathname}，HTTP ${response.status}`)
  }

  const json = (await response.json().catch(() => null)) as HudsonResponse | null
  if (!json || typeof json !== 'object') {
    throw new Error(`真实接口响应不可解析：${pathname}`)
  }
  if (json.success === false) {
    throw new Error(String(json.errorMsg || json.errorDetail || `真实接口业务失败：${pathname}`))
  }

  return json.data
}

interface HudsonResponse {
  success?: boolean
  errorMsg?: unknown
  errorDetail?: unknown
  data?: unknown
}

interface RawBundle {
  rooms: unknown
  occ: unknown
  inv: unknown
  block: unknown
  dailyMonitor: unknown
  redDot: unknown
  orderDetails: unknown
}

export function adaptHouseMonthsRows(bundle: RawBundle, columns: MonthDateColumn[]): MonthRoomGroup[] {
  const roomCategories = toArray(readPath(bundle.rooms, ['list']))
  const orderRecords = [
    ...toArray(readPath(bundle.orderDetails, ['list'])),
    ...toArray(readPath(bundle.orderDetails, ['orderArrangementInfos'])),
  ]
  const inventoryRecords = toArray(readPath(bundle.inv, ['list']))
  const blockRecords = toArray(readPath(bundle.block, ['list']))

  return roomCategories.flatMap((category, categoryIndex) => {
    const categoryId = pickString(category, ['roomCategoryId', 'categoryId', 'id', 'rcId']) || `category-${categoryIndex}`
    const label = pickString(category, ['roomCategoryName', 'categoryName', 'name', 'label', 'title']) || `未识别房型 ${categoryIndex + 1}`
    const rooms = toArray(firstExisting(category, ['rooms', 'roomList', 'roomViews', 'children', 'roomInfos']))
    const normalizedRooms = rooms.length ? rooms : [{ roomId: `${categoryId}-room`, roomName: '房间1' }]

    return normalizedRooms.map((room, roomIndex) => {
      const roomId = pickString(room, ['roomId', 'id', 'roomInfoId']) || `${categoryId}-room-${roomIndex}`
      const roomLabel = pickString(room, ['roomName', 'name', 'label', 'title']) || `房间${roomIndex + 1}`

      return {
        id: `${categoryId}-${roomId}`,
        label,
        roomLabel,
        roomId,
        typeCells: columns.map((column) => buildTypeCell(categoryId, column.isoDate, inventoryRecords)),
        roomCells: columns.map((column) => buildRoomCell(categoryId, roomId, column.isoDate, orderRecords, blockRecords)),
      }
    })
  })
}

function buildTypeCell(categoryId: string, isoDate: string, inventoryRecords: unknown[]): MonthCell {
  const record = findDatedRecord(inventoryRecords, categoryId, undefined, isoDate)
  const inventory = pickNumber(record, ['inventory', 'inv', 'remain', 'remainNum', 'availableNum', 'num'])

  if (inventory === 0) return { title: '售罄', tone: 'sold' }
  if (typeof inventory === 'number') return { title: `余${inventory}`, tone: 'free' }
  return { title: '未返回', tone: 'blank' }
}

function buildRoomCell(categoryId: string, roomId: string, isoDate: string, orderRecords: unknown[], blockRecords: unknown[]): MonthCell {
  const block = findDatedRecord(blockRecords, categoryId, roomId, isoDate)
  if (block) return { title: '停用', tone: 'disabled' }

  const order = findDatedRecord(orderRecords, categoryId, roomId, isoDate)
  if (!order) return { title: '', tone: 'blank' }

  const guest = pickString(order, ['guestName', 'customerName', 'reserveName', 'name', 'orderName', 'contactName']) || '未命名订单'
  const channel = pickString(order, ['channelName', 'otaName', 'sourceName', 'channel', 'source']) || undefined
  const amount = pickNumber(order, ['roomFee', 'roomPrice', 'price', 'amount', 'totalRoomFee'])
  const totalIncome = pickNumber(order, ['totalIncome', 'orderTotalIncome', 'totalAmount', 'income'])

  return {
    title: guest,
    subtitle: channel,
    amount: typeof amount === 'number' ? formatMoney(amount) : undefined,
    totalIncome: typeof totalIncome === 'number' ? formatMoney(totalIncome) : undefined,
    stayRange: pickString(order, ['stayRange', 'dateRange', 'checkInOutDate']),
    phone: pickString(order, ['phone', 'mobile', 'contactPhone']),
    remark: pickString(order, ['remark', 'orderRemark']),
    orderId: pickString(order, ['orderId', 'id', 'orderNo']),
    badge: pickBooleanLike(order, ['hasRemark', 'remarkFlag', 'isRemark']) ? '备' : undefined,
    tone: toneForChannel(channel),
  }
}

function findDatedRecord(records: unknown[], categoryId: string, roomId: string | undefined, isoDate: string) {
  return records.find((record) => {
    const recordCategoryId = pickString(record, ['roomCategoryId', 'categoryId', 'rcId'])
    const recordRoomId = pickString(record, ['roomId', 'roomInfoId'])
    const recordDate = normalizeDate(pickString(record, ['date', 'day', 'bizDate', 'roomDate', 'startDate']))

    if (recordCategoryId && recordCategoryId !== categoryId) return false
    if (roomId && recordRoomId && recordRoomId !== roomId) return false
    return recordDate === isoDate
  })
}

function firstExisting(value: unknown, keys: string[]) {
  if (!isRecord(value)) return undefined
  for (const key of keys) {
    if (value[key] !== undefined) return value[key]
  }
  return undefined
}

function readPath(value: unknown, path: string[]) {
  let current = value
  for (const segment of path) {
    if (!isRecord(current)) return undefined
    current = current[segment]
  }
  return current
}

function pickString(value: unknown, keys: string[]) {
  if (!isRecord(value)) return undefined
  for (const key of keys) {
    const candidate = value[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (typeof candidate === 'number') return String(candidate)
  }
  return undefined
}

function pickNumber(value: unknown, keys: string[]) {
  if (!isRecord(value)) return undefined
  for (const key of keys) {
    const candidate = value[key]
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
    if (typeof candidate === 'string' && candidate.trim() && Number.isFinite(Number(candidate))) return Number(candidate)
  }
  return undefined
}

function pickBooleanLike(value: unknown, keys: string[]) {
  if (!isRecord(value)) return false
  return keys.some((key) => Boolean(value[key]))
}

function toArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeDate(value: string | undefined) {
  if (!value) return undefined
  return value.slice(0, 10).replace(/\./g, '-').replace(/\//g, '-')
}

function formatMoney(value: number) {
  return `¥${Number.isInteger(value) ? value : Number(value.toFixed(2))}`
}

function toneForChannel(channel: string | undefined): CellTone {
  if (!channel) return 'booking-blue'
  if (channel.includes('飞猪')) return 'booking-gold'
  if (channel.includes('美团') || channel.includes('路客云')) return 'booking-teal'
  return 'booking-blue'
}
