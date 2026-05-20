const realBaseUrl = 'https://hudson-prod.localhome.cn'
const roomTypeListEndpoint = '/roomCategories/page/get'
const roomTypeStoreEndpoint = '/select/poi/page/get'
const roomTypeGroupEndpoint = '/roomCategoryGroups/get'
const roomTypeRoomEndpoint = '/rooms/get'
const mockTimestamp = '2026-05-19T19:45:00+08:00'
const mockLatencyMs = 120
const defaultCampId = '1796067693589061634'
const defaultStoreId = '1796425098638573570'

export type RoomTypeInfoProviderName = 'mock' | 'api'
export type RoomTypeInfoMockState = 'success' | 'empty' | 'error'

export type RoomTypeInfoFilterOption = {
  id: string
  label: string
}

export type RoomTypeInfoQuery = {
  storeId?: string
  groupId?: string
  keyword?: string
  pageNum?: number
  pageSize?: number
  current?: number
}

export type RoomTypeInfoRow = {
  id: string
  name: string
  storeId: string
  storeName: string
  roomCount: number
  roomNames: string[]
  linkedRoomTypeIds: string[]
  linkedRoomTypeNames: string[]
  groupId: string
  groupName: string
}

export type RoomTypeInfoDashboard = {
  provider: RoomTypeInfoProviderName
  mockState: RoomTypeInfoMockState
  endpoint: string
  traceId: string
  timestamp: string
  requestBody: Record<string, unknown>
  requestSummary: string[]
  stores: RoomTypeInfoFilterOption[]
  groups: RoomTypeInfoFilterOption[]
  rows: RoomTypeInfoRow[]
  pagination: {
    total: number
    pageNum: number
    pageSize: number
    current: number
    pages: number
    hasNextPage: boolean
  }
  stockSummary: {
    used: number
    total: number
    startDate: string
    endDate: string
  }
  tagSnapshots: Array<{ id: string; name: string; roomTypeCount: number }>
  floorSnapshots: Array<{ id: string; name: string; roomCount: number }>
}

export type RoomTypeInfoEditMode = 'create' | 'detail'

export type RoomTypeInfoDraft = {
  provider: RoomTypeInfoProviderName
  traceId: string
  timestamp: string
  mode: RoomTypeInfoEditMode
  title: string
  steps: string[]
  form: {
    roomTypeId: string
    roomTypeName: string
    storeId: string
    groupId: string
    roomCount: string
    roomNo: string
    description: string
  }
}

export type RoomTypeInfoRoom = {
  id: string
  roomName: string
  roomTypeName: string
  lockStatus: string
  floorName: string
}

export type RoomTypeInfoRoomsDialog = {
  traceId: string
  timestamp: string
  roomTypeId: string
  roomTypeName: string
  rooms: RoomTypeInfoRoom[]
}

export type RoomTypeInfoLinkageCandidate = {
  id: string
  name: string
  selected: boolean
}

export type RoomTypeInfoLinkageDialog = {
  traceId: string
  timestamp: string
  roomTypeId: string
  roomTypeName: string
  description: string
  candidates: RoomTypeInfoLinkageCandidate[]
}

export type RoomTypeInfoUtilityDialog = {
  traceId: string
  timestamp: string
  title: '标签管理' | '楼层管理'
  items: Array<{ id: string; name: string; count: number; detail: string }>
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HudsonEnvelope<T> = {
  success?: boolean
  data?: T
  errorCode?: string | number | null
  errorMsg?: string | null
  errorDetail?: string | null
}

type RoomTypePagePayload = {
  total?: unknown
  size?: unknown
  current?: unknown
  pageNum?: unknown
  pages?: unknown
  hasNextPage?: unknown
  list?: unknown
}

const storeOptions: RoomTypeInfoFilterOption[] = [
  { id: defaultStoreId, label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const groupOptions: RoomTypeInfoFilterOption[] = [
  { id: 'group-main', label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const mockRows: RoomTypeInfoRow[] = [
  {
    id: 'room-type-001',
    name: '顶层套房（浴缸巨幕电竞麻将）',
    storeId: defaultStoreId,
    storeName: storeOptions[0].label,
    roomCount: 1,
    roomNames: ['房间1'],
    linkedRoomTypeIds: [],
    linkedRoomTypeNames: [],
    groupId: 'group-main',
    groupName: '',
  },
  {
    id: 'room-type-002',
    name: '总裁套间（桑拿浴缸露台电竞麻将）',
    storeId: defaultStoreId,
    storeName: storeOptions[0].label,
    roomCount: 1,
    roomNames: ['房间1'],
    linkedRoomTypeIds: [],
    linkedRoomTypeNames: [],
    groupId: 'group-main',
    groupName: '',
  },
  {
    id: 'room-type-003',
    name: '天落大床电竞套间',
    storeId: defaultStoreId,
    storeName: storeOptions[0].label,
    roomCount: 1,
    roomNames: ['1'],
    linkedRoomTypeIds: [],
    linkedRoomTypeNames: [],
    groupId: 'group-main',
    groupName: '',
  },
  {
    id: 'room-type-004',
    name: '观影大床房',
    storeId: defaultStoreId,
    storeName: storeOptions[0].label,
    roomCount: 1,
    roomNames: ['房间1'],
    linkedRoomTypeIds: [],
    linkedRoomTypeNames: [],
    groupId: 'group-main',
    groupName: '',
  },
]

const mockTags = [
  { id: 'tag-001', name: '电竞', roomTypeCount: 3, detail: '覆盖电竞房、巨幕房和投影房。' },
  { id: 'tag-002', name: '观影', roomTypeCount: 2, detail: '用于影院房型的站内标签露出。' },
  { id: 'tag-003', name: '麻将', roomTypeCount: 2, detail: '用于整租和聚会类场景。' },
]

const mockFloors = [
  { id: 'floor-001', name: '顶层露台', roomCount: 1, detail: '包含顶层套房房间1。' },
  { id: 'floor-002', name: '行政区', roomCount: 2, detail: '包含总裁套间与观影大床房。' },
  { id: 'floor-003', name: '电竞区', roomCount: 1, detail: '包含天落大床电竞套间。' },
]

const roomTypeSteps = ['基础信息', '位置信息', '房型设施', '详细介绍', '照片信息']

export async function loadRoomTypeInfoDashboard(
  query: RoomTypeInfoQuery,
  signal?: AbortSignal,
): Promise<RoomTypeInfoDashboard> {
  if (resolveProvider() === 'api') {
    return loadRealRoomTypeInfoDashboard(query, signal)
  }

  await waitForMockLatency(signal)
  const mockState = resolveMockState()
  if (mockState === 'error') {
    throw new Error('房型信息加载失败')
  }

  const requestBody = createRequestBody(query)
  const rows = filterMockRows(query)
  const payloadRows = mockState === 'empty' ? [] : rows
  const envelope = buildEnvelope(
    {
      stores: storeOptions,
      groups: groupOptions,
      list: payloadRows,
      pagination: {
        total: payloadRows.length,
        pageNum: 1,
        pageSize: 20,
        current: 1,
        pages: 1,
        hasNextPage: false,
      },
      stockSummary: {
        used: 4,
        total: 10,
        startDate: '2025.09.28',
        endDate: '2027.09.28',
      },
      tagSnapshots: mockTags,
      floorSnapshots: mockFloors,
    },
    'dashboard',
  )
  return adaptMockDashboardEnvelope(envelope, requestBody, query, mockState)
}

export async function loadRoomTypeInfoDraft(
  mode: RoomTypeInfoEditMode,
  roomTypeId?: string,
  signal?: AbortSignal,
): Promise<RoomTypeInfoDraft> {
  await waitForMockLatency(signal)

  const row = roomTypeId ? findRowOrThrow(roomTypeId) : null
  return {
    provider: resolveProvider(),
    traceId: buildTraceId(mode === 'create' ? 'draft-create' : 'draft-detail'),
    timestamp: mockTimestamp,
    mode,
    title: mode === 'create' ? '新增房型' : '详细信息',
    steps: roomTypeSteps,
    form: {
      roomTypeId: row?.id ?? '',
      roomTypeName: row?.name ?? '',
      storeId: row?.storeId ?? defaultStoreId,
      groupId: row?.groupId ?? groupOptions[0].id,
      roomCount: String(row?.roomCount ?? 1),
      roomNo: row?.roomNames.join('、') || '房间1',
      description: row ? `${row.name}的房型详情草案。` : '',
    },
  }
}

export async function loadRoomTypeRooms(roomTypeId: string, signal?: AbortSignal): Promise<RoomTypeInfoRoomsDialog> {
  if (resolveProvider() === 'api') {
    return loadRealRoomTypeRooms(roomTypeId, signal)
  }

  await waitForMockLatency(signal)
  const row = findRowOrThrow(roomTypeId)
  return {
    traceId: buildTraceId('rooms'),
    timestamp: mockTimestamp,
    roomTypeId,
    roomTypeName: row.name,
    rooms: row.roomNames.map((roomName, index) => ({
      id: `${roomTypeId}-room-${index + 1}`,
      roomName,
      roomTypeName: row.name,
      lockStatus: '未绑定',
      floorName: '去设置',
    })),
  }
}

export async function loadRoomTypeLinkage(
  roomTypeId: string,
  signal?: AbortSignal,
): Promise<RoomTypeInfoLinkageDialog> {
  await waitForMockLatency(signal)
  const row = findRowOrThrow(roomTypeId)
  const candidates = mockRows
    .filter((item) => item.id !== roomTypeId)
    .map((item) => ({
      id: item.id,
      name: item.name,
      selected: row.linkedRoomTypeIds.includes(item.id),
    }))

  return {
    traceId: buildTraceId('linkage'),
    timestamp: mockTimestamp,
    roomTypeId,
    roomTypeName: row.name,
    description:
      '设置联动关房后，当前房型关房将联动关联的房型全部关房，关联的房型任一关房，将联动当前房型关房。适用于整租/包栋场景；',
    candidates,
  }
}

export async function loadRoomTypeUtilityDialog(
  kind: 'tags' | 'floors',
  signal?: AbortSignal,
): Promise<RoomTypeInfoUtilityDialog> {
  await waitForMockLatency(signal)
  return {
    traceId: buildTraceId(kind),
    timestamp: mockTimestamp,
    title: kind === 'tags' ? '标签管理' : '楼层管理',
    items:
      kind === 'tags'
        ? mockTags.map((item) => ({ id: item.id, name: item.name, count: item.roomTypeCount, detail: item.detail }))
        : mockFloors.map((item) => ({ id: item.id, name: item.name, count: item.roomCount, detail: item.detail })),
  }
}

export async function saveRoomTypeLinkage(
  roomTypeId: string,
  selectedIds: string[],
  signal?: AbortSignal,
): Promise<{ message: string; traceId: string }> {
  await waitForMockLatency(signal)
  if (resolveProvider() === 'api') {
    throw new Error('当前数据源暂不支持联动关房保存')
  }
  const row = findRowOrThrow(roomTypeId)
  row.linkedRoomTypeIds = [...selectedIds]
  row.linkedRoomTypeNames = mockRows.filter((item) => selectedIds.includes(item.id)).map((item) => item.name)
  return { message: '联动关房已更新', traceId: buildTraceId('save-linkage') }
}

export async function deleteRoomType(roomTypeId: string, signal?: AbortSignal): Promise<{ message: string; traceId: string }> {
  await waitForMockLatency(signal)
  if (resolveProvider() === 'api') {
    throw new Error('当前数据源暂不支持房型删除')
  }
  const rowIndex = mockRows.findIndex((item) => item.id === roomTypeId)
  if (rowIndex < 0) throw new Error('未找到需要删除的房型')
  mockRows.splice(rowIndex, 1)
  return { message: '房型已删除', traceId: buildTraceId('delete') }
}

export async function saveRoomTypeDraft(
  draft: RoomTypeInfoDraft['form'],
  signal?: AbortSignal,
): Promise<{ message: string; traceId: string }> {
  await waitForMockLatency(signal)
  if (!draft.roomTypeName.trim()) {
    throw new Error('请先填写房型名称')
  }

  if (resolveProvider() === 'api') {
    throw new Error('当前数据源暂不支持房型保存')
  }

  return {
    message: draft.roomTypeId ? '房型信息已保存' : '房型已创建',
    traceId: buildTraceId('save-draft'),
  }
}

export function createQuickRoomNoSuggestion(roomCount: string) {
  const count = Math.max(1, Number.parseInt(roomCount, 10) || 1)
  return Array.from({ length: count }, (_, index) => `房间${index + 1}`).join('、')
}

export function getRoomTypeInfoProviderName() {
  return resolveProvider()
}

function resolveProvider(): RoomTypeInfoProviderName {
  const configured = readRuntimeConfig('pms.roomTypeInfoProvider') || import.meta.env.VITE_ROOM_TYPE_INFO_PROVIDER
  return configured === 'api' ? 'api' : 'mock'
}

function resolveMockState(): RoomTypeInfoMockState {
  const fromUrl = readUrlMockState()
  if (fromUrl) return fromUrl
  const configured = readRuntimeConfig('pms.roomTypeInfoMockState') || import.meta.env.VITE_ROOM_TYPE_INFO_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readUrlMockState(): RoomTypeInfoMockState | '' {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const configured = params.get('roomTypeInfoMockState') || params.get('mockState')
  return configured === 'success' || configured === 'empty' || configured === 'error' ? configured : ''
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, mockLatencyMs)
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

function createRequestBody(query: RoomTypeInfoQuery) {
  return {
    campId: defaultCampId,
    poiId: query.storeId || '',
    roomCategoryGroupId: query.groupId || '',
    roomCategoryName: query.keyword?.trim() || '',
    pageNum: query.pageNum ?? 1,
    pageSize: query.pageSize ?? 20,
    current: query.current ?? query.pageNum ?? 1,
  }
}

function buildEnvelope<T>(data: T, suffix: string): UnifiedEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId: buildTraceId(suffix),
    timestamp: mockTimestamp,
  }
}

function adaptMockDashboardEnvelope(
  envelope: UnifiedEnvelope<{
    stores: RoomTypeInfoFilterOption[]
    groups: RoomTypeInfoFilterOption[]
    list: RoomTypeInfoRow[]
    pagination: RoomTypeInfoDashboard['pagination']
    stockSummary: RoomTypeInfoDashboard['stockSummary']
    tagSnapshots: RoomTypeInfoDashboard['tagSnapshots']
    floorSnapshots: RoomTypeInfoDashboard['floorSnapshots']
  }>,
  requestBody: Record<string, unknown>,
  query: RoomTypeInfoQuery,
  mockState: RoomTypeInfoMockState,
): RoomTypeInfoDashboard {
  return {
    provider: 'mock',
    mockState,
    endpoint: roomTypeListEndpoint,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    requestBody,
    requestSummary: buildRequestSummary(query, envelope.data.list.length),
    stores: envelope.data.stores,
    groups: envelope.data.groups,
    rows: envelope.data.list,
    pagination: envelope.data.pagination,
    stockSummary: envelope.data.stockSummary,
    tagSnapshots: envelope.data.tagSnapshots,
    floorSnapshots: envelope.data.floorSnapshots,
  }
}

async function loadRealRoomTypeInfoDashboard(query: RoomTypeInfoQuery, signal?: AbortSignal): Promise<RoomTypeInfoDashboard> {
  const requestBody = createRequestBody(query)
  const [storesResponse, groupsResponse, pageResponse] = await Promise.all([
    fetchJson<HudsonEnvelope<unknown[]>>(`${realBaseUrl}${roomTypeStoreEndpoint}`, {
      method: 'POST',
      body: JSON.stringify({ campId: defaultCampId, pageNum: 1, pageSize: 100 }),
      signal,
    }),
    fetchJson<HudsonEnvelope<unknown[]>>(`${realBaseUrl}${roomTypeGroupEndpoint}`, {
      method: 'POST',
      body: JSON.stringify({ campId: defaultCampId }),
      signal,
    }),
    fetchJson<HudsonEnvelope<RoomTypePagePayload>>(`${realBaseUrl}${roomTypeListEndpoint}`, {
      method: 'POST',
      body: JSON.stringify(requestBody),
      signal,
    }),
  ])

  const stores = adaptStoreOptions(storesResponse)
  const groups = adaptGroupOptions(groupsResponse)
  const payload = unwrapHudsonEnvelope(pageResponse)
  const rows = adaptRoomTypeRows(payload.list)
  const total = readNumber(payload.total, rows.length)
  const pageNum = readNumber(payload.pageNum, 1)
  const pageSize = readNumber(payload.size, requestBody.pageSize as number)
  const pages = readNumber(payload.pages, total > 0 ? 1 : 0)
  const current = readNumber(payload.current, pageNum)

  return {
    provider: 'api',
    mockState: 'success',
    endpoint: roomTypeListEndpoint,
    traceId: buildTraceId('api-dashboard'),
    timestamp: new Date().toISOString(),
    requestBody,
    requestSummary: buildRequestSummary(query, rows.length),
    stores,
    groups,
    rows,
    pagination: {
      total,
      pageNum,
      pageSize,
      current,
      pages,
      hasNextPage: Boolean(payload.hasNextPage),
    },
    stockSummary: {
      used: rows.length,
      total: Math.max(10, rows.length),
      startDate: '2025.09.28',
      endDate: '2027.09.28',
    },
    tagSnapshots: mockTags,
    floorSnapshots: mockFloors,
  }
}

async function loadRealRoomTypeRooms(roomTypeId: string, signal?: AbortSignal): Promise<RoomTypeInfoRoomsDialog> {
  const row = findRowOrThrow(roomTypeId)
  const response = await fetchJson<HudsonEnvelope<unknown[]>>(`${realBaseUrl}${roomTypeRoomEndpoint}`, {
    method: 'POST',
    body: JSON.stringify({
      campId: defaultCampId,
      roomCategoryIds: [roomTypeId],
      pageNum: 1,
      pageSize: 50,
    }),
    signal,
  })

  const payload = unwrapHudsonEnvelope(response)
  const rooms = Array.isArray(payload)
    ? payload.map((item, index) => {
        const room = asRecord(item)
        return {
          id: readString(room.id, `${roomTypeId}-room-${index + 1}`),
          roomName: readString(room.name, row.roomNames[index] || `房间${index + 1}`),
          roomTypeName: row.name,
          lockStatus: readString(room.lockStatus, '未绑定'),
          floorName: readString(room.floorName, '去设置'),
        }
      })
    : []

  return {
    traceId: buildTraceId('api-rooms'),
    timestamp: new Date().toISOString(),
    roomTypeId,
    roomTypeName: row.name,
    rooms,
  }
}

async function fetchJson<T>(url: string, init: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`)
  }
  return (await response.json()) as T
}

function unwrapHudsonEnvelope<T>(response: HudsonEnvelope<T>) {
  if (response.success === false) {
    throw new Error(response.errorMsg || response.errorDetail || '接口返回失败')
  }
  if (response.data === undefined) {
    throw new Error('接口未返回 data 字段')
  }
  return response.data
}

function adaptStoreOptions(response: HudsonEnvelope<unknown[]>) {
  const payload = unwrapHudsonEnvelope(response)
  if (!Array.isArray(payload)) return storeOptions
  const stores = payload.map((item) => {
    const record = asRecord(item)
    return {
      id: readString(record.id, ''),
      label: readString(record.name, ''),
    }
  })
  return stores.filter((item) => item.id && item.label)
}

function adaptGroupOptions(response: HudsonEnvelope<unknown[]>) {
  const payload = unwrapHudsonEnvelope(response)
  if (!Array.isArray(payload)) return groupOptions
  const groups = payload.map((item) => {
    const record = asRecord(item)
    return {
      id: readString(record.id, ''),
      label: readString(record.name, ''),
    }
  })
  return groups.filter((item) => item.id && item.label)
}

function adaptRoomTypeRows(input: unknown) {
  if (!Array.isArray(input)) return []
  return input.map((item, index) => {
    const record = asRecord(item)
    return {
      id: readString(record.id, `room-type-api-${index + 1}`),
      name: readString(record.name ?? record.roomCategoryName, `房型${index + 1}`),
      storeId: readString(record.poiId, defaultStoreId),
      storeName: readString(record.poiName, storeOptions[0].label),
      roomCount: readNumber(record.roomNum ?? record.roomCount, 0),
      roomNames: splitRoomNames(record.roomNames ?? record.roomNo),
      linkedRoomTypeIds: [],
      linkedRoomTypeNames: splitRoomNames(record.linkRoomCategoryNames ?? record.linkedRoomTypeNames),
      groupId: readString(record.roomCategoryGroupId, ''),
      groupName: readString(record.roomCategoryGroupName, ''),
    } satisfies RoomTypeInfoRow
  })
}

function buildRequestSummary(query: RoomTypeInfoQuery, rowCount: number) {
  return [
    `门店：${query.storeId || '全部'}`,
    `分组：${query.groupId || '全部'}`,
    `房型名称：${query.keyword?.trim() || '全部'}`,
    `结果：${rowCount} 条`,
  ]
}

function filterMockRows(query: RoomTypeInfoQuery) {
  const keyword = query.keyword?.trim()
  return mockRows.filter((row) => {
    if (query.storeId && row.storeId !== query.storeId) return false
    if (query.groupId && row.groupId !== query.groupId) return false
    if (keyword && !row.name.includes(keyword)) return false
    return true
  })
}

function findRowOrThrow(roomTypeId: string) {
  const row = mockRows.find((item) => item.id === roomTypeId)
  if (!row) throw new Error('未找到对应房型')
  return row
}

function splitRoomNames(input: unknown) {
  const text = readString(input, '')
  if (!text) return []
  return text
    .split(/[、,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function buildTraceId(suffix: string) {
  return `room-type-info-${suffix}-001`
}
