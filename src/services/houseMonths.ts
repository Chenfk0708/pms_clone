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
const CAMPS_PATH = '/camps/get'
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

export async function fetchHouseMonthsDefaultCampId() {
  const data = await postHudsonJson(CAMPS_PATH, {})
  const camps = toArray(readPath(data, ['camps']))
  const campId = pickString(camps[0], ['campId', 'id'])
  if (!campId) {
    throw new Error('/camps/get 未返回可用 campId')
  }
  return campId
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
      headers: buildHudsonHeaders(),
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(`真实接口请求失败：${pathname}，${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    })
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

function buildHudsonHeaders() {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    app_device: 'web',
    app_platform: '2',
    app_source: '1',
    app_system: 'v4.10.7',
    app_version: '4.10.7',
  }
  const token = readHudsonAccessToken()
  if (token) headers['hudson-access-token'] = token
  return headers
}

function readHudsonAccessToken() {
  if (typeof window === 'undefined') return ''
  const tokenKeys = ['pms.hudsonAccessToken', 'hudson-access-token', 'hudsonAccessToken']
  for (const key of tokenKeys) {
    const token = window.localStorage.getItem(key)?.trim()
    if (token) return token
  }
  return ''
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
  const orderRecords = toArray(readPath(bundle.orderDetails, ['list']))
  const orderArrangementRecords = toArray(readPath(bundle.orderDetails, ['orderArrangementInfos']))
  const inventoryRecords = toArray(readPath(bundle.inv, ['list']))
  const blockRecords = toArray(readPath(bundle.block, ['list']))

  return roomCategories.flatMap((category, categoryIndex) => {
    const categoryId = pickString(category, ['roomCategoryId', 'categoryId', 'id', 'rcId', 'i']) || `category-${categoryIndex}`
    const label = pickString(category, ['roomCategoryName', 'categoryName', 'name', 'label', 'title', 'n']) || `未识别房型 ${categoryIndex + 1}`
    const rooms = toArray(firstExisting(category, ['rooms', 'roomList', 'roomViews', 'children', 'roomInfos', 'rs']))
    const normalizedRooms = rooms.length ? rooms : [{ roomId: `${categoryId}-room`, roomName: '房间1' }]

    return normalizedRooms.map((room, roomIndex) => {
      const roomId = pickString(room, ['roomId', 'id', 'roomInfoId', 'i']) || `${categoryId}-room-${roomIndex}`
      const roomLabel = pickString(room, ['roomName', 'name', 'label', 'title', 'n']) || `房间${roomIndex + 1}`

      return {
        id: `${categoryId}-${roomId}`,
        label,
        roomLabel,
        roomId,
        typeCells: columns.map((column, columnIndex) => buildTypeCell(categoryId, column.isoDate, columnIndex, inventoryRecords)),
        roomCells: columns.map((column) =>
          buildRoomCell(categoryId, roomId, column.isoDate, orderRecords, orderArrangementRecords, blockRecords),
        ),
      }
    })
  })
}

function buildTypeCell(categoryId: string, isoDate: string, columnIndex: number, inventoryRecords: unknown[]): MonthCell {
  const record = findDatedRecord(inventoryRecords, categoryId, undefined, isoDate)
  const compactRecord = inventoryRecords.find((item) => pickString(item, ['rci']) === categoryId)
  const compactInventory = pickIndexedNumber(firstExisting(compactRecord, ['ivs']), columnIndex)
  const inventory = compactInventory ?? pickNumber(record, ['inventory', 'inv', 'remain', 'remainNum', 'availableNum', 'num'])

  if (inventory === 0) return { title: '售罄', tone: 'sold' }
  if (typeof inventory === 'number') return { title: `余${inventory}`, tone: 'free' }
  return { title: '未返回', tone: 'blank' }
}

function buildRoomCell(
  categoryId: string,
  roomId: string,
  isoDate: string,
  orderRecords: unknown[],
  orderArrangementRecords: unknown[],
  blockRecords: unknown[],
): MonthCell {
  const block = findDatedRecord(blockRecords, categoryId, roomId, isoDate)
  if (block) return { title: '停用', tone: 'disabled' }

  const arrangement = findDatedRecord(orderArrangementRecords, categoryId, roomId, isoDate)
  const order = findOrderForArrangement(orderRecords, arrangement) ?? findDatedRecord(orderRecords, categoryId, roomId, isoDate)
  if (!order) return { title: '', tone: 'blank' }

  const guest = pickString(order, ['guestName', 'customerName', 'reserveName', 'name', 'orderName', 'contactName', 'gn']) || '未命名订单'
  const channel = pickString(order, ['channelName', 'otaName', 'sourceName', 'channel', 'source', 'ocn']) || undefined
  const amount = pickMoney(order, ['roomFee', 'roomPrice', 'price', 'amount', 'totalRoomFee'], ['rp'])
  const totalIncome = pickMoney(order, ['totalIncome', 'orderTotalIncome', 'totalAmount', 'income'], ['oep', 'otp'])

  return {
    title: guest,
    subtitle: channel,
    amount: typeof amount === 'number' ? formatMoney(amount) : undefined,
    totalIncome: typeof totalIncome === 'number' ? formatMoney(totalIncome) : undefined,
    stayRange: pickString(order, ['stayRange', 'dateRange', 'checkInOutDate']) ?? formatStayRange(order),
    phone: pickString(order, ['phone', 'mobile', 'contactPhone', 'gm']),
    remark: pickString(order, ['remark', 'orderRemark', 'rmk']),
    orderId: pickString(order, ['orderId', 'id', 'orderNo', 'oi', 'odi']),
    badge: pickBooleanLike(order, ['hasRemark', 'remarkFlag', 'isRemark', 'rmk']) ? '备' : undefined,
    tone: toneForChannel(channel),
  }
}

function findDatedRecord(records: unknown[], categoryId: string, roomId: string | undefined, isoDate: string) {
  return records.find((record) => {
    const recordCategoryId = pickString(record, ['roomCategoryId', 'categoryId', 'rcId', 'rci'])
    const recordRoomId = pickString(record, ['roomId', 'roomInfoId', 'ri'])
    const recordDate = normalizeDate(firstExisting(record, ['date', 'day', 'bizDate', 'roomDate', 'startDate', 'd']))

    if (recordCategoryId && recordCategoryId !== categoryId) return false
    if (roomId && recordRoomId && recordRoomId !== roomId) return false
    return recordDate === isoDate
  })
}

function findOrderForArrangement(orderRecords: unknown[], arrangement: unknown) {
  const orderIds = [
    ...toArray(firstExisting(arrangement, ['odis'])),
    ...toArray(firstExisting(arrangement, ['ecodis'])),
  ].map((item) => String(item))

  if (!orderIds.length) return undefined
  return orderRecords.find((order) => {
    const detailId = pickString(order, ['orderDetailId', 'odi', 'id'])
    const orderId = pickString(order, ['orderId', 'oi'])
    return Boolean((detailId && orderIds.includes(detailId)) || (orderId && orderIds.includes(orderId)))
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

function pickIndexedNumber(value: unknown, index: number) {
  if (!Array.isArray(value)) return undefined
  const candidate = value[index]
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate
  if (typeof candidate === 'string' && candidate.trim() && Number.isFinite(Number(candidate))) return Number(candidate)
  return undefined
}

function pickMoney(value: unknown, yuanKeys: string[], centKeys: string[]) {
  const yuanValue = pickNumber(value, yuanKeys)
  if (typeof yuanValue === 'number') return yuanValue

  const centValue = pickNumber(value, centKeys)
  if (typeof centValue === 'number') return centValue / 100

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

function normalizeDate(value: unknown) {
  if (!value) return undefined
  if (typeof value === 'number' && Number.isFinite(value)) {
    return formatDateInShanghai(new Date(value))
  }
  if (value instanceof Date) return formatDateInShanghai(value)
  if (typeof value !== 'string') return undefined
  return value.slice(0, 10).replace(/\./g, '-').replace(/\//g, '-')
}

function formatDateInShanghai(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})

  return `${parts.year}-${parts.month}-${parts.day}`
}

function formatStayRange(order: unknown) {
  const checkIn = normalizeDate(firstExisting(order, ['checkInDate', 'cid', 'ecit']))
  const checkOut = normalizeDate(firstExisting(order, ['checkOutDate', 'cod', 'ecot']))
  if (!checkIn || !checkOut) return undefined
  return `${checkIn}-${checkOut.slice(5)}`
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
