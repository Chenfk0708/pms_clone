import { fetchDayOrderCardsFromMonthSource, type DayOrderBooking, type DayOrderCard } from './houseDaysShared'

const MOCK_ENDPOINT = '/houseManage/days/overview'
const REAL_ENDPOINT = '/api/roomStatusesToday/get'
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'
const TASK_ID = 'fangtai--fangtai-guanli--rifangtai'

export type HouseDaysProviderMode = 'mock' | 'real'
export type HouseDaysMockState = 'success' | 'empty' | 'error'

export type HouseDaysQuery = {
  provider?: HouseDaysProviderMode
  mockState?: HouseDaysMockState
  storeId: string
  keyword: string
  viewMode: string
  statusFilters: string[]
  channel: string
  roomType: string
  tag: string
}

export type HouseDaysStatusFilterItem = {
  label: string
  value: number
  color?: string
}

export type HouseDaysRoomBooking = {
  guest: string
  channel: string
  price: string
  tone: 'blue' | 'orange'
  monthOrder?: DayOrderBooking
}

export type HouseDaysRoomCard = {
  id: string
  storeId: string
  storeName: string
  roomType: string
  roomName: string
  status: 'cleanVacant' | 'dirtyVacant' | 'occupiedClean' | 'occupiedDirty' | 'closed'
  hasTag?: boolean
  filterLabels?: string[]
  bookings?: HouseDaysRoomBooking[]
  booking?: HouseDaysRoomBooking
}

export type HouseDaysStatusGroup = {
  title: string
  items: HouseDaysStatusFilterItem[]
}

export type HouseDaysViewModel = {
  providerMode: HouseDaysProviderMode
  responseState: HouseDaysMockState
  endpoint: string
  traceId: string
  timestamp: string
  requestParams: Record<string, unknown>
  statusGroups: HouseDaysStatusGroup[]
  rooms: HouseDaysRoomCard[]
  viewModes: string[]
  storeOptions: Array<{ id: string; name: string }>
  channelOptions: Array<{ id: string; name: string }>
  roomTypeOptions: Array<{ id: string; name: string }>
  tagOptions: Array<{ id: string; name: string }>
  routeTargets: {
    months: string
    price: string
    storeSettings: string
  }
  sourceNotes: string[]
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HouseDaysBackendData = Omit<
  HouseDaysViewModel,
  'providerMode' | 'responseState' | 'endpoint' | 'traceId' | 'timestamp'
>

type RealRoomStatusPayload = {
  basic?: Record<string, unknown>
  roomCategories?: unknown[]
  roomViews?: unknown[]
}

export async function fetchHouseDays(query: HouseDaysQuery, signal?: AbortSignal): Promise<HouseDaysViewModel> {
  const providerMode = query.provider ?? resolveHouseDaysProviderMode()

  if (providerMode === 'real') {
    return fetchRealHouseDays(query, signal)
  }

  const envelope = await fetchMockHouseDays(query, signal)
  const data = unwrapEnvelope(envelope, 'mock provider')

  return {
    providerMode,
    responseState: query.mockState ?? 'success',
    endpoint: MOCK_ENDPOINT,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    ...data,
  }
}

export function resolveHouseDaysQueryFromLocation(location: Location): Pick<HouseDaysQuery, 'provider' | 'mockState'> {
  const params = new URLSearchParams(location.search)
  const provider = params.get('houseDaysProvider')
  const mockState = params.get('houseDaysMockState')

  return {
    provider: provider === 'real' || provider === 'mock' ? provider : undefined,
    mockState: mockState === 'empty' || mockState === 'error' || mockState === 'success' ? mockState : undefined,
  }
}

function resolveHouseDaysProviderMode(): HouseDaysProviderMode {
  const configured = (import.meta.env.VITE_PMS_HOUSE_DAYS_PROVIDER as string | undefined)?.trim()
  return configured === 'real' ? 'real' : 'mock'
}

async function fetchMockHouseDays(
  query: HouseDaysQuery,
  signal?: AbortSignal,
): Promise<ApiEnvelope<HouseDaysBackendData>> {
  await delay(80, signal)

  const responseState = query.mockState ?? 'success'
  if (responseState === 'error') {
    return {
      code: 5001,
      message: 'mock provider 返回业务失败：日房态接口模拟错误',
      data: createMockData(query, [], []),
      traceId: `mock-${TASK_ID}-error-001`,
      timestamp: MOCK_TIMESTAMP,
    }
  }

  const sharedRooms = responseState === 'empty' ? [] : await fetchDayOrderCardsFromMonthSource(query.keyword)
  const baseRooms = responseState === 'empty' ? [] : filterRooms(sharedRooms.map(adaptSharedCardToHouseDayRoom), query, false)
  const rooms = responseState === 'empty' ? [] : filterRooms(baseRooms, query, true)
  return {
    code: 0,
    message: 'success',
    data: createMockData(query, rooms, baseRooms),
    traceId: `mock-${TASK_ID}-${responseState}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

async function fetchRealHouseDays(
  query: HouseDaysQuery,
  signal?: AbortSignal,
): Promise<HouseDaysViewModel> {
  const campId = resolveRealHouseDaysCampId()
  const envelope = await postRealHouseDays<RealRoomStatusPayload>(
    REAL_ENDPOINT,
    {
      campId,
      ...buildRequestParams(query),
    },
    signal,
  )
  const backendData = unwrapEnvelope(envelope, 'real provider')
  const baseRooms = adaptRealHouseDaysRooms(backendData)
  const rooms = filterRooms(baseRooms, query, true)

  return {
    providerMode: 'real',
    responseState: 'success',
    endpoint: REAL_ENDPOINT,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    requestParams: {
      campId,
      ...buildRequestParams(query),
    },
    statusGroups: buildStatusGroups(baseRooms, backendData.basic),
    rooms,
    viewModes: ['按房型', '按房间号', '按楼层'],
    storeOptions: [
      { id: 'all', name: '全部门店' },
      { id: campId, name: '路客云演示门店' },
    ],
    channelOptions: [
      { id: '', name: '渠道' },
      { id: 'direct', name: '直营渠道' },
      { id: 'ota', name: 'OTA' },
    ],
    roomTypeOptions: [
      { id: '', name: '房型' },
      ...Array.from(new Set(baseRooms.map((room) => room.roomType))).map((roomType) => ({
        id: roomType,
        name: roomType,
      })),
    ],
    tagOptions: [
      { id: '', name: '房型标签' },
      { id: 'remark', name: '备注' },
      { id: 'debt', name: '欠费' },
      { id: 'hourRoom', name: '钟点房' },
    ],
    routeTargets: {
      months: '/houseManage/months',
      price: '/houseManage/houseCale',
      storeSettings: '/InformationMaintenance/campInfo',
    },
    sourceNotes: [
      `real provider 已接入 ${REAL_ENDPOINT}`,
      '日房态数据优先来自后端 roomCategories[].rooms[]，兼容 roomViews 平铺结构；前端只做字段适配和筛选。',
    ],
  }
}

function createMockData(
  query: HouseDaysQuery,
  rooms: HouseDaysRoomCard[],
  statusGroupRooms: HouseDaysRoomCard[],
): HouseDaysBackendData {
  return {
    requestParams: buildRequestParams(query),
    statusGroups: buildStatusGroups(statusGroupRooms),
    rooms,
    viewModes: ['按房型', '按房间号', '按楼层'],
    storeOptions: [
      { id: 'all', name: '全部门店' },
      { id: 'poi-1796067693589061634', name: '天落会宿公寓(前海壹方城宝安中心店)' },
    ],
    channelOptions: [
      { id: '', name: '渠道' },
      { id: 'direct', name: '直营渠道' },
      { id: 'ota', name: 'OTA' },
    ],
    roomTypeOptions: [
      { id: '', name: '房型' },
      ...Array.from(new Set(statusGroupRooms.map((room) => room.roomType))).map((roomType) => ({
        id: roomType,
        name: roomType,
      })),
    ],
    tagOptions: [
      { id: '', name: '房型标签' },
      { id: 'remark', name: '备注' },
    ],
    routeTargets: {
      months: '/houseManage/months',
      price: '/houseManage/houseCale',
      storeSettings: '/InformationMaintenance/campInfo',
    },
    sourceNotes: [
      'mock provider 使用统一响应包 code/message/data/traceId/timestamp。',
      '组件只消费适配后的 HouseDaysViewModel，后端就绪后集中切换 provider。',
      '页面正文只展示业务态反馈，provider、traceId 与后端接入状态仅写入开发文档和取证产物。',
    ],
  }
}

function buildRequestParams(query: HouseDaysQuery) {
  return {
    date: formatDateInShanghai(new Date()),
    storeId: query.storeId || 'all',
    keyword: query.keyword,
    viewMode: query.viewMode,
    statusFilters: query.statusFilters,
    channel: query.channel,
    roomType: query.roomType,
    tag: query.tag,
  }
}

function resolveRealHouseDaysCampId() {
  return (
    window.localStorage.getItem('pmsCampId')?.trim() ||
    window.localStorage.getItem('pms.currentCampId')?.trim() ||
    (import.meta.env.VITE_PMS_CAMP_ID as string | undefined)?.trim() ||
    '10001'
  )
}

async function postRealHouseDays<T>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelope<T>> {
  let response: Response
  try {
    const headers = new Headers({ 'content-type': 'application/json' })
    const token = window.localStorage.getItem('pms_token')?.trim()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    throw new Error(`real provider 请求失败：${endpoint}，${error instanceof Error ? error.message : String(error)}`)
  }

  if (!response.ok) {
    throw new Error(`real provider 请求失败：${endpoint}，HTTP ${response.status}`)
  }

  const envelope = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!envelope || typeof envelope !== 'object') {
    throw new Error(`real provider 响应不可解析：${endpoint}`)
  }
  return envelope
}

function adaptRealHouseDaysRooms(data: RealRoomStatusPayload): HouseDaysRoomCard[] {
  const categories = readArray(data.roomCategories)
  const sourceCategories = categories.length ? categories : groupRealRoomViewsByCategory(readArray(readPath(data, ['roomViews'])))

  return sourceCategories.flatMap((category, categoryIndex) => {
    const categoryId = readString(readPath(category, ['roomCategoryId'])) || `category-${categoryIndex}`
    const roomType = readString(readPath(category, ['roomCategoryName'])) || `未命名房型${categoryIndex + 1}`
    const rooms = readArray(readPath(category, ['rooms']))

    return rooms.map((room, roomIndex) => {
      const roomId = readString(readPath(room, ['roomId'])) || `${categoryId}-room-${roomIndex}`
      const bookings = readArray(readPath(room, ['orders'])).flatMap((order) => {
        const booking = buildRealRoomBooking(room, order, roomType)
        return booking ? [booking] : []
      })
      const labels = buildRealRoomFilterLabels(room)
      const status = resolveRealRoomStatus(room)

      if (bookings.length === 0) {
        const fallbackBooking = buildRealRoomBooking(room, undefined, roomType)
        if (fallbackBooking) bookings.push(fallbackBooking)
      }

      return {
        id: `${categoryId}-${roomId}`,
        storeId: resolveRealHouseDaysCampId(),
        storeName: '路客云演示门店',
        roomType,
        roomName: readString(readPath(room, ['roomName'])) || `房间${roomIndex + 1}`,
        status,
        hasTag: labels.includes('备注'),
        filterLabels: labels,
        bookings,
        booking: bookings[0],
      }
    })
  })
}

function groupRealRoomViewsByCategory(roomViews: unknown[]) {
  const grouped = new Map<string, { roomCategoryId: string; roomCategoryName: string; rooms: unknown[] }>()

  for (const room of roomViews) {
    const categoryId = readString(readPath(room, ['roomCategoryId'])) || 'uncategorized'
    const categoryName = readString(readPath(room, ['roomCategoryName'])) || '未命名房型'
    const current = grouped.get(categoryId) ?? { roomCategoryId: categoryId, roomCategoryName: categoryName, rooms: [] }
    current.rooms.push(room)
    grouped.set(categoryId, current)
  }

  return Array.from(grouped.values())
}

function resolveRealRoomStatus(room: unknown): HouseDaysRoomCard['status'] {
  const isDirty = readNumber(readPath(room, ['isDirty']), 0) === 1
  const isIdle = readNumber(readPath(room, ['isIdle']), 0) === 1
  const isOccupied = readNumber(readPath(room, ['isOcc']), 0) === 1 || readNumber(readPath(room, ['isLive']), 0) === 1
  const isClosed = readNumber(readPath(room, ['isClosed']), 0) === 1 || readNumber(readPath(room, ['isBlock']), 0) === 1

  if (isClosed) return 'closed'
  if (isIdle && isDirty) return 'dirtyVacant'
  if (isIdle) return 'cleanVacant'
  if (isOccupied && isDirty) return 'occupiedDirty'
  if (isOccupied) return 'occupiedClean'
  return isDirty ? 'dirtyVacant' : 'cleanVacant'
}

function buildRealRoomFilterLabels(room: unknown) {
  const labels: string[] = []
  const status = resolveRealRoomStatus(room)

  if (readNumber(readPath(room, ['isPreCome']), 0) === 1) labels.push('预抵')
  if (readNumber(readPath(room, ['isPreLeave']), 0) === 1) labels.push('预离')
  if (readNumber(readPath(room, ['isLive']), 0) === 1 || readNumber(readPath(room, ['isOcc']), 0) === 1) labels.push('在住')
  if (status === 'cleanVacant') labels.push('空净')
  if (status === 'dirtyVacant') labels.push('空脏')
  if (status === 'occupiedClean') labels.push('住净')
  if (status === 'occupiedDirty') labels.push('住脏')
  if (status === 'closed') labels.push('关房')
  if (readNumber(readPath(room, ['isHourRoomOrder']), 0) === 1) labels.push('钟点房')
  if (readNumber(readPath(room, ['isLt']), 0) === 1) labels.push('长租房')
  if (readNumber(readPath(room, ['isDebt']), 0) === 1) labels.push('欠费')
  if (readNumber(readPath(room, ['isExtendStay']), 0) === 1) labels.push('续住')
  if (readNumber(readPath(room, ['isOrderRemark']), 0) === 1) labels.push('备注')

  return labels
}

function buildRealRoomBooking(room: unknown, order: unknown, roomType: string): HouseDaysRoomCard['booking'] {
  const guest = readString(readPath(order, ['guestName'])) || readString(readPath(room, ['guestName']))
  if (!guest) return undefined

  const channel = readString(readPath(order, ['channelName'])) || '直营渠道'
  const priceCent = readNumber(readPath(order, ['totalPriceCent']), NaN)
  const orderId = readString(readPath(order, ['orderId']))

  return {
    guest,
    channel,
    price: Number.isFinite(priceCent) ? `¥${(priceCent / 100).toFixed(2)}` : '-',
    tone: channel === '直营渠道' ? 'blue' : 'orange',
    monthOrder: {
      roomType,
      roomLabel: readString(readPath(room, ['roomName'])) || '-',
      cell: {
        title: guest,
        subtitle: channel,
        amount: Number.isFinite(priceCent) ? `¥${(priceCent / 100).toFixed(2)}` : undefined,
        tone: channel === '直营渠道' ? 'booking-blue' : 'booking-gold',
        phone: readString(readPath(order, ['guestMobile'])),
        remark: readString(readPath(order, ['remark'])),
        orderId,
      },
    },
  }
}

function adaptSharedCardToHouseDayRoom(card: DayOrderCard): HouseDaysRoomCard {
  const booking: HouseDaysRoomBooking | undefined = card.booking
    ? {
        guest: card.booking.cell.title,
        channel: card.booking.cell.subtitle ?? '-',
        price: card.booking.cell.amount ?? '-',
        tone: card.booking.cell.tone === 'booking-blue' ? 'blue' : 'orange',
        monthOrder: card.booking,
      }
    : undefined

  return {
    id: card.id,
    storeId: resolveMockStoreId(card),
    storeName: resolveMockStoreName(card),
    roomType: card.roomType,
    roomName: card.roomName,
    status: card.status,
    hasTag: card.hasTag,
    filterLabels: card.filterLabels,
    bookings: booking ? [booking] : undefined,
    booking,
  }
}

function filterRooms(rooms: HouseDaysRoomCard[], query: HouseDaysQuery, includeStatusFilters: boolean) {
  return rooms.filter((room) => {
    const bookings = getRoomBookings(room)
    const matchesStore = !query.storeId || query.storeId === 'all' || room.storeId === query.storeId
    const keyword = query.keyword.trim()
    const matchesKeyword =
      !keyword ||
      room.roomType.includes(keyword) ||
      room.roomName.includes(keyword) ||
      bookings.some((booking) =>
        [booking.guest, booking.channel, booking.monthOrder?.cell.phone, booking.monthOrder?.cell.remark, booking.monthOrder?.cell.orderId]
          .filter(Boolean)
          .some((value) => value?.includes(keyword)),
      )
    const matchesChannel = !query.channel || query.channel === 'ota' || room.booking?.channel === '直营渠道'
    const matchesRoomType = !query.roomType || room.roomType === query.roomType
    const matchesTag = !query.tag || room.hasTag
    const matchesStatus =
      !includeStatusFilters ||
      query.statusFilters.length === 0 ||
      query.statusFilters.some((filterLabel) => room.filterLabels?.includes(filterLabel))

    return matchesStore && matchesKeyword && matchesChannel && matchesRoomType && matchesTag && matchesStatus
  })
}

function getRoomBookings(room: HouseDaysRoomCard): HouseDaysRoomBooking[] {
  if (room.bookings?.length) return room.bookings
  return room.booking ? [room.booking] : []
}

function resolveMockStoreId(card: DayOrderCard) {
  return card.roomName === '1206' || card.roomName === '706'
    ? 'poi-1796067693589061634'
    : 'poi-1796067693589061635'
}

function resolveMockStoreName(card: DayOrderCard) {
  return resolveMockStoreId(card) === 'poi-1796067693589061634'
    ? '天落会宿公寓(前海壹方城宝安中心店)'
    : '天落会宿公寓(深圳湾科技园店)'
}

function buildStatusGroups(rooms: HouseDaysRoomCard[], basic?: Record<string, unknown>): HouseDaysStatusGroup[] {
  const countByLabel = (label: string) => rooms.filter((room) => room.filterLabels?.includes(label)).length
  const occupied = countByLabel('在住')
  const vacant = countByLabel('空净') + countByLabel('空脏')
  const remark = countByLabel('备注')
  const count = (key: string, fallback: number) => readNumber(basic?.[key], fallback)

  return [
    {
      title: '入离',
      items: [
        { label: '预抵', value: count('preComeNum', countByLabel('预抵')), color: '#5c8df6' },
        { label: '预离', value: count('preLeaveNum', countByLabel('预离')), color: '#ff9d2e' },
        { label: '在住', value: count('liveNum', occupied), color: '#48bf62' },
        { label: '重单', value: 0, color: '#f06363' },
      ],
    },
    {
      title: '房态',
      items: [
        { label: '空净', value: count('idleCleanNum', countByLabel('空净')) },
        { label: '空脏', value: count('idleDirtyNum', countByLabel('空脏')) },
        { label: '住净', value: count('liveCleanNum', countByLabel('住净')) },
        { label: '住脏', value: count('liveDirtyNum', countByLabel('住脏')) },
        { label: '关房', value: countByLabel('关房') },
      ],
    },
    {
      title: '保洁状态',
      items: [
        { label: '未开始', value: 0 },
        { label: '进行中', value: 0 },
        { label: '已完成', value: 0 },
        { label: '已过期', value: 0 },
      ],
    },
    {
      title: '其他标签',
      items: [
        { label: '钟点房', value: count('hourRoomOrderNum', countByLabel('钟点房')) },
        { label: '长租房', value: count('ltNum', countByLabel('长租房')) },
        { label: '欠费', value: count('debtNum', countByLabel('欠费')) },
        { label: '续住', value: count('extendStayNum', countByLabel('续住')) },
        { label: '备注', value: remark },
      ],
    },
  ]
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function unwrapEnvelope<T>(envelope: ApiEnvelope<T>, providerName: string): T {
  if (envelope.code !== 0) {
    throw new Error(`${providerName} 返回业务失败：${envelope.message}`)
  }

  return envelope.data
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('日房态请求已取消', 'AbortError'))
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('日房态请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
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

const mockRooms: HouseDaysRoomCard[] = [
  {
    id: 'room-top-1',
    storeId: 'poi-1796067693589061634',
    storeName: '天落会宿公寓(前海壹方城宝安中心店)',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    roomName: '房间1',
    status: 'cleanVacant',
    hasTag: true,
    filterLabels: ['绌哄噣', '澶囨敞'],
  },
  {
    id: 'room-president-1',
    storeId: 'poi-1796067693589061634',
    storeName: '天落会宿公寓(前海壹方城宝安中心店)',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomName: '房间1',
    status: 'cleanVacant',
    hasTag: true,
    filterLabels: ['绌哄噣', '澶囨敞'],
  },
  {
    id: 'room-sky-1',
    storeId: 'poi-1796067693589061634',
    storeName: '天落会宿公寓(前海壹方城宝安中心店)',
    roomType: '天落大床电竞套间',
    roomName: '1',
    status: 'occupiedClean',
    filterLabels: ['棰勬姷', '浣忓噣'],
    booking: {
      guest: '张祯',
      channel: '携程',
      price: '¥136.62',
      tone: 'blue',
    },
  },
  {
    id: 'room-movie-1',
    storeId: 'poi-1796067693589061634',
    storeName: '天落会宿公寓(前海壹方城宝安中心店)',
    roomType: '观影大床房',
    roomName: '房间1',
    status: 'occupiedDirty',
    hasTag: true,
    filterLabels: ['鍦ㄤ綇', '棰勭', '浣忚剰', '澶囨敞'],
    booking: {
      guest: '胡志深',
      channel: '美团酒店',
      price: '¥112.9',
      tone: 'orange',
    },
  },
]

mockRooms[0]!.filterLabels = ['\u7a7a\u51c0', '\u5907\u6ce8']
mockRooms[1]!.filterLabels = ['\u7a7a\u51c0', '\u5907\u6ce8']
mockRooms[2]!.filterLabels = ['\u9884\u62b5', '\u4f4f\u51c0']
mockRooms[3]!.filterLabels = ['\u5728\u4f4f', '\u9884\u79bb', '\u4f4f\u810f', '\u5907\u6ce8']
