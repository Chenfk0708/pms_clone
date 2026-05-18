const MOCK_ENDPOINT = '/houseManage/days/overview'
const REAL_ENDPOINT = 'https://hudson-prod.localhome.cn/roomStatusesToday/get'
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'
const TASK_ID = 'fangtai--fangtai-guanli--rifangtai'

export type HouseDaysProviderMode = 'mock' | 'real'
export type HouseDaysMockState = 'success' | 'empty' | 'error'

export type HouseDaysQuery = {
  provider?: HouseDaysProviderMode
  mockState?: HouseDaysMockState
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

export type HouseDaysRoomCard = {
  id: string
  roomType: string
  roomName: string
  status: 'cleanVacant' | 'dirtyVacant' | 'occupiedClean' | 'occupiedDirty' | 'closed'
  hasTag?: boolean
  booking?: {
    guest: string
    channel: string
    price: string
    tone: 'blue' | 'orange'
  }
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
      data: createMockData(query, []),
      traceId: `mock-${TASK_ID}-error-001`,
      timestamp: MOCK_TIMESTAMP,
    }
  }

  const rooms = responseState === 'empty' ? [] : filterRooms(mockRooms, query)
  return {
    code: 0,
    message: 'success',
    data: createMockData(query, rooms),
    traceId: `mock-${TASK_ID}-${responseState}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

async function fetchRealHouseDays(
  query: HouseDaysQuery,
  signal?: AbortSignal,
): Promise<HouseDaysViewModel> {
  await delay(1, signal)
  throw new Error(
    `real provider 未配置认证代理，禁止在组件内降级为假成功。待后端就绪后在服务层接入 ${REAL_ENDPOINT}，当前请求参数：${JSON.stringify(
      buildRequestParams(query),
    )}`,
  )
}

function createMockData(query: HouseDaysQuery, rooms: HouseDaysRoomCard[]): HouseDaysBackendData {
  return {
    requestParams: buildRequestParams(query),
    statusGroups: buildStatusGroups(rooms),
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
      ...Array.from(new Set(mockRooms.map((room) => room.roomType))).map((roomType) => ({
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
    date: '2026-05-18',
    storeId: 'poi-1796067693589061634',
    keyword: query.keyword,
    viewMode: query.viewMode,
    statusFilters: query.statusFilters,
    channel: query.channel,
    roomType: query.roomType,
    tag: query.tag,
  }
}

function filterRooms(rooms: HouseDaysRoomCard[], query: HouseDaysQuery) {
  return rooms.filter((room) => {
    const keyword = query.keyword.trim()
    const matchesKeyword =
      !keyword ||
      room.roomType.includes(keyword) ||
      room.roomName.includes(keyword) ||
      room.booking?.guest.includes(keyword) ||
      room.booking?.channel.includes(keyword)
    const matchesChannel = !query.channel || query.channel === 'ota' || room.booking?.channel === '直营渠道'
    const matchesRoomType = !query.roomType || room.roomType === query.roomType
    const matchesTag = !query.tag || room.hasTag

    return matchesKeyword && matchesChannel && matchesRoomType && matchesTag
  })
}

function buildStatusGroups(rooms: HouseDaysRoomCard[]): HouseDaysStatusGroup[] {
  const occupied = rooms.filter((room) => room.booking).length
  const vacant = rooms.filter((room) => !room.booking).length
  const remark = rooms.filter((room) => room.hasTag).length

  return [
    {
      title: '入离',
      items: [
        { label: '预抵', value: Math.min(1, occupied), color: '#5c8df6' },
        { label: '预离', value: occupied, color: '#ff9d2e' },
        { label: '在住', value: occupied, color: '#48bf62' },
        { label: '重单', value: 0, color: '#f06363' },
      ],
    },
    {
      title: '房态',
      items: [
        { label: '空净', value: vacant },
        { label: '空脏', value: 0 },
        { label: '住净', value: Math.max(0, occupied - 1) },
        { label: '住脏', value: Math.min(1, occupied) },
        { label: '关房', value: 0 },
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
        { label: '钟点房', value: 0 },
        { label: '长租房', value: 0 },
        { label: '欠费', value: 0 },
        { label: '续住', value: 0 },
        { label: '备注', value: remark },
      ],
    },
  ]
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

const mockRooms: HouseDaysRoomCard[] = [
  {
    id: 'room-top-1',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    roomName: '房间1',
    status: 'cleanVacant',
    hasTag: true,
  },
  {
    id: 'room-president-1',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomName: '房间1',
    status: 'cleanVacant',
    hasTag: true,
  },
  {
    id: 'room-sky-1',
    roomType: '天落大床电竞套间',
    roomName: '1',
    status: 'occupiedClean',
    booking: {
      guest: '张祯',
      channel: '携程',
      price: '¥136.62',
      tone: 'blue',
    },
  },
  {
    id: 'room-movie-1',
    roomType: '观影大床房',
    roomName: '房间1',
    status: 'occupiedDirty',
    hasTag: true,
    booking: {
      guest: '胡志深',
      channel: '美团酒店',
      price: '¥112.9',
      tone: 'orange',
    },
  },
]
