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
  liveStatus?: string
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
  columns: MonthDateColumn[]
  requestPaths: string[]
}

export type HouseMonthsProviderName = 'mock' | 'real'
type HouseMonthsMockMode = 'success' | 'empty' | 'error'

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
  if (resolveHouseMonthsProviderName() === 'mock') {
    return fetchMockHouseMonthsSnapshot(filters, columns)
  }

  const payload = buildPayload(filters)
  const [rooms, occ, inv, block, dailyMonitor, redDot, orderDetails] = await Promise.all(
    REQUEST_PATHS.map((requestPath) => postHudsonJson(requestPath, payload)),
  )

  return {
    rows: adaptHouseMonthsRows({ rooms, occ, inv, block, dailyMonitor, redDot, orderDetails }, columns),
    columns: adaptHouseMonthsColumns(dailyMonitor, columns),
    requestPaths: [...REQUEST_PATHS],
  }
}

export async function fetchHouseMonthsDefaultCampId() {
  if (resolveHouseMonthsProviderName() === 'mock') {
    const response = unwrapHouseMonthsEnvelope(mockHouseMonthsDefaultCampResponse())
    const campId = pickString(toArray(readPath(response, ['camps']))[0], ['campId', 'id'])
    if (!campId) throw new Error('/camps/get 缺少可用 campId')
    return campId
  }

  const data = await postHudsonJson(CAMPS_PATH, {})
  const camps = toArray(readPath(data, ['camps']))
  const campId = pickString(camps[0], ['campId', 'id'])
  if (!campId) {
    throw new Error('/camps/get 缺少可用 campId')
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

function resolveHouseMonthsProviderName(): HouseMonthsProviderName {
  const configured = readRuntimeConfig('pms.houseMonthsProvider') || import.meta.env.VITE_HOUSE_MONTHS_PROVIDER
  return configured === 'real' ? 'real' : 'mock'
}

function resolveMockMode(): HouseMonthsMockMode {
  const configured = readRuntimeConfig('pms.houseMonthsMockMode') || import.meta.env.VITE_HOUSE_MONTHS_MOCK_MODE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

interface HouseMonthsApiEnvelope<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

function unwrapHouseMonthsEnvelope<T>(response: HouseMonthsApiEnvelope<T>) {
  if (response.code !== 0) {
    throw new Error(`${response.message}（traceId: ${response.traceId}）`)
  }
  return response.data
}

async function fetchMockHouseMonthsSnapshot(filters: HouseMonthsFilters, columns: MonthDateColumn[]): Promise<HouseMonthsSnapshot> {
  const mode = resolveMockMode()
  if (mode === 'error') {
    unwrapHouseMonthsEnvelope(mockErrorEnvelope())
  }

  const payload = buildPayload(filters)
  const bundle =
    mode === 'empty'
      ? mockEmptyHouseMonthsBundle()
      : mockSuccessHouseMonthsBundle(payload, columns)

  return {
    rows: adaptHouseMonthsRows(
      {
        rooms: unwrapHouseMonthsEnvelope(bundle.rooms),
        occ: unwrapHouseMonthsEnvelope(bundle.occ),
        inv: unwrapHouseMonthsEnvelope(bundle.inv),
        block: unwrapHouseMonthsEnvelope(bundle.block),
        dailyMonitor: unwrapHouseMonthsEnvelope(bundle.dailyMonitor),
        redDot: unwrapHouseMonthsEnvelope(bundle.redDot),
        orderDetails: unwrapHouseMonthsEnvelope(bundle.orderDetails),
      },
      columns,
    ),
    columns: adaptHouseMonthsColumns(unwrapHouseMonthsEnvelope(bundle.dailyMonitor), columns),
    requestPaths: ['统一响应包', ...REQUEST_PATHS],
  }
}

function successEnvelope<T>(traceId: string, data: T): HouseMonthsApiEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId,
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function mockErrorEnvelope(): HouseMonthsApiEnvelope<null> {
  return {
    code: 50001,
    message: '月房态数据加载失败，请稍后重试',
    data: null,
    traceId: 'mock-fangtai--fangtai-guanli--yuefangtai-error-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function mockHouseMonthsDefaultCampResponse() {
  return successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-camps-001', {
    camps: [{ campId: 'camp-001', name: '天落会宿公寓' }],
  })
}

function mockEmptyHouseMonthsBundle() {
  return {
    rooms: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-rooms-empty-001', {
      isSingleInventory: 0,
      list: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    }),
    occ: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-occ-empty-001', { list: [] }),
    inv: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-inv-empty-001', { list: [] }),
    block: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-block-empty-001', { list: [] }),
    dailyMonitor: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-daily-empty-001', { list: [] }),
    redDot: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-red-dot-empty-001', { list: [] }),
    orderDetails: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-orders-empty-001', {
      list: [],
      orderArrangementInfos: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    }),
  }
}

function mockSuccessHouseMonthsBundle(payload: ReturnType<typeof buildPayload>, columns: MonthDateColumn[]) {
  const roomCategories = [
    {
      roomCategoryId: 'room-category-deluxe',
      roomCategoryName: '豪华大床房',
      roomId: 'room-801',
      roomName: '801',
    },
    {
      roomCategoryId: 'room-category-president',
      roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
      roomId: 'room-902',
      roomName: '902',
    },
    {
      roomCategoryId: 'room-category-sky',
      roomCategoryName: '天落大床电竞套间',
      roomId: 'room-1206',
      roomName: '1206',
    },
    {
      roomCategoryId: 'room-category-movie',
      roomCategoryName: '观影大床房',
      roomId: 'room-706',
      roomName: '706',
    },
  ]
  const orderDate = (index: number) => columns[index]?.isoDate ?? payload.startDate
  const stayRange = (startIndex: number, endIndex: number) => {
    const start = orderDate(startIndex)
    const end = orderDate(endIndex)
    return `${start}-${end.slice(5)}`
  }

  return {
    rooms: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-rooms-001', {
      isSingleInventory: 0,
      list: roomCategories.map((category) => ({
        roomCategoryId: category.roomCategoryId,
        roomCategoryName: category.roomCategoryName,
        rooms: [{ roomId: category.roomId, roomName: category.roomName }],
      })),
      pagination: { page: 1, pageSize: 20, total: roomCategories.length },
    }),
    occ: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-occ-001', { list: [] }),
    inv: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-inv-001', {
      list: roomCategories.flatMap((category, categoryIndex) =>
        columns.map((column, columnIndex) => ({
          roomCategoryId: category.roomCategoryId,
          date: column.isoDate,
          inventory: categoryInventoryForIndex(categoryIndex, columnIndex),
        })),
      ),
    }),
    block: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-block-001', {
      list: [
        {
          roomCategoryId: 'room-category-president',
          roomId: 'room-902',
          date: orderDate(8),
          reason: '设备维护',
        },
        {
          roomCategoryId: 'room-category-sky',
          roomId: 'room-1206',
          date: orderDate(12),
          reason: '保养停用',
        },
      ],
    }),
    dailyMonitor: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-daily-001', {
      list: columns.map((column, index) => ({
        date: column.isoDate,
        remain: `余${dailyRemainForIndex(index)}间`,
      })),
    }),
    redDot: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-red-dot-001', { list: [] }),
    orderDetails: successEnvelope('mock-fangtai--fangtai-guanli--yuefangtai-orders-001', {
      list: [
        {
          roomCategoryId: 'room-category-deluxe',
          roomId: 'room-801',
          date: orderDate(3),
          guestName: '李思思',
          channelName: '携程旅行',
          roomFee: 288,
          totalIncome: 318,
          stayRange: stayRange(3, 4),
          phone: '13800000000',
          remark: '已确认到店时间',
          orderId: 'order-001',
        },
        {
          roomCategoryId: 'room-category-president',
          roomId: 'room-902',
          date: orderDate(6),
          guestName: '王欣怡',
          channelName: '美团酒店',
          roomFee: 668,
          totalIncome: 728,
          stayRange: stayRange(6, 8),
          phone: '13900000001',
          remark: '需提前开空调',
          orderId: 'order-002',
          hasRemark: true,
        },
        {
          roomCategoryId: 'room-category-sky',
          roomId: 'room-1206',
          date: orderDate(9),
          guestName: '赵晨',
          channelName: '飞猪旅行',
          roomFee: 398,
          totalIncome: 428,
          stayRange: stayRange(9, 10),
          phone: '13700000002',
          remark: '高楼层偏好',
          orderId: 'order-003',
        },
        {
          roomCategoryId: 'room-category-movie',
          roomId: 'room-706',
          date: orderDate(5),
          guestName: '张张',
          channelName: '去哪儿旅行',
          roomFee: 218,
          totalIncome: 236,
          stayRange: stayRange(5, 6),
          phone: '13600000003',
          remark: '到店后补押金',
          orderId: 'order-004',
          hasRemark: true,
        },
      ],
      orderArrangementInfos: [],
      pagination: { page: 1, pageSize: 20, total: 4 },
    }),
  }
}

function dailyRemainForIndex(index: number) {
  const targetLikeRemain = [2, 0, 3, 2, 4, 4, 3]
  return targetLikeRemain[index] ?? 4
}

function categoryInventoryForIndex(categoryIndex: number, columnIndex: number) {
  const inventoryPattern = [
    [1, 0, 0, 1, 2, 2, 1],
    [2, 0, 1, 1, 1, 2, 2],
    [0, 0, 1, 0, 1, 1, 2],
    [1, 1, 1, 1, 0, 1, 1],
  ]
  return inventoryPattern[categoryIndex]?.[columnIndex % 7] ?? 1
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
    throw new Error(`接口请求失败：${pathname}，${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new Error(`接口请求失败：${pathname}，HTTP ${response.status}`)
  }

  const json = (await response.json().catch(() => null)) as HudsonResponse | null
  if (!json || typeof json !== 'object') {
    throw new Error(`接口响应不可解析：${pathname}`)
  }
  if (json.success === false) {
    throw new Error(String(json.errorMsg || json.errorDetail || `接口业务失败：${pathname}`))
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

export function adaptHouseMonthsColumns(dailyMonitor: unknown, columns: MonthDateColumn[]): MonthDateColumn[] {
  const monitorRecords = toArray(readPath(dailyMonitor, ['list']))

  return columns.map((column) => {
    const record = monitorRecords.find((item) => normalizeDate(firstExisting(item, ['date', 'day', 'bizDate', 'd'])) === column.isoDate)
    const remainText = pickString(record, ['remain', 'remainText', 'remainDesc'])
    const remainNumber = pickNumber(record, ['remainNum', 'remainRoomNum', 'availableNum', 'num'])

    if (remainText) return { ...column, remain: remainText }
    if (typeof remainNumber === 'number') return { ...column, remain: `余${remainNumber}间` }
    return column
  })
}

function buildTypeCell(categoryId: string, isoDate: string, columnIndex: number, inventoryRecords: unknown[]): MonthCell {
  const record = findDatedRecord(inventoryRecords, categoryId, undefined, isoDate)
  const compactRecord = inventoryRecords.find((item) => pickString(item, ['rci']) === categoryId)
  const compactInventory = pickIndexedNumber(firstExisting(compactRecord, ['ivs']), columnIndex)
  const inventory = compactInventory ?? pickNumber(record, ['inventory', 'inv', 'remain', 'remainNum', 'availableNum', 'num'])

  if (inventory === 0) return { title: '售罄', tone: 'sold' }
  if (typeof inventory === 'number') return { title: `余${inventory}`, tone: 'free' }
  return { title: '售罄', tone: 'sold' }
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
    liveStatus: pickString(order, ['liveStatus', 'liveStatusName', 'statusName', 'roomStatusName', 'liveName', 'lsn']) ?? inferLiveStatus(order),
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

function inferLiveStatus(order: unknown) {
  const statusText = pickString(order, ['liveStatusText', 'statusText', 'statusDesc', 'orderStatusText', 'oss'])
  if (statusText) return statusText

  const statusCode = pickNumber(order, ['liveStatus', 'status', 'orderStatus', 'checkStatus', 'ls'])
  if (statusCode === 2) return '入住中'
  if (statusCode === 3 || statusCode === 4) return '已退房'
  if (statusCode === 1) return '待入住'
  return undefined
}

function toneForChannel(channel: string | undefined): CellTone {
  if (!channel) return 'booking-blue'
  if (channel.includes('飞猪')) return 'booking-gold'
  if (channel.includes('美团') || channel.includes('路客云')) return 'booking-teal'
  return 'booking-blue'
}
