import { fetchEnabledChannelCatalog, type ChannelCatalogItem } from './customChannel'

const fixedTimestamp = '2026-05-21T10:00:00+08:00'
export const distributionListEndpoints = {
  campFlow: '/api/campFlow/get',
  roomCategories: '/api/roomCategories/page/get',
  undistributedRoomCategories: '/api/select/roomCategory/page/get',
  importedRoomCategories: '/api/weiRoomCategories/page/get',
  stores: '/api/select/poi/page/get',
}

export const localDistributionStatusStorageKey = 'pms.distribution.localStatus'
export const localDistributionChannelId = '100'

export type DistributionProvider = 'mock' | 'api'
export type DistributionScenario = 'success' | 'empty' | 'error'
export type DistributionTab = 'distributed' | 'undistributed'
export type DistributionProgress = 'distributing' | 'closed'

export type DistributionFilters = {
  campId: string
  buyCampId: string
  poiId: string
  keyword: string
  tab: DistributionTab
  page: number
  pageSize: number
  scenario: DistributionScenario
}

export type DistributionOption = {
  id: string
  label: string
}

export type DistributionChannel = {
  id: string
  name: string
  shortName: string
  color: string
}

export type DistributionRoomCategory = {
  id: string
  name: string
  storeId: string
  storeName: string
  thumbnail: string
  progress: DistributionProgress
  channelIds: string[]
}

export type DistributionDashboard = {
  provider: DistributionProvider
  filters: DistributionFilters
  request: {
    campFlow: Record<string, unknown>
    roomCategories: Record<string, unknown>
    undistributedRoomCategories: Record<string, unknown>
    importedRoomCategories: Record<string, unknown>
    stores: Record<string, unknown>
  }
  stores: DistributionOption[]
  channels: DistributionChannel[]
  distributedRooms: DistributionRoomCategory[]
  undistributedRooms: DistributionRoomCategory[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  updatedAt: string
  traceId: string
}

type Envelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type DashboardPayload = Omit<DistributionDashboard, 'provider' | 'filters' | 'request' | 'traceId'>

const localChannel: DistributionChannel = {
  id: localDistributionChannelId,
  name: '宿银平台',
  shortName: '宿',
  color: '#0f766e',
}

const fallbackStores: DistributionOption[] = [
  { id: 'ALL', label: '全部门店' },
  { id: 'store-1', label: '宿银门店' },
]

const fallbackRooms: DistributionRoomCategory[] = [
  createRoom('room-1', '标准大床房', 'store-1', '宿银门店', 'distributing', [localChannel.id]),
  createRoom('room-2', '观影大床房', 'store-1', '宿银门店', 'distributing', [localChannel.id]),
]

export function createDefaultDistributionFilters(searchParams = new URLSearchParams()): DistributionFilters {
  const campId = searchParams.get('campId') || readRuntimeCampId() || ''
  return {
    campId,
    buyCampId: searchParams.get('buyCampId') || campId,
    poiId: searchParams.get('poiId') || 'ALL',
    keyword: searchParams.get('keyword') || '',
    tab: searchParams.get('tab') === 'undistributed' ? 'undistributed' : 'distributed',
    page: Number(searchParams.get('page') || 1),
    pageSize: Number(searchParams.get('pageSize') || 20),
    scenario: toScenario(searchParams.get('state')),
  }
}

export async function fetchDistributionDashboard(
  filters: DistributionFilters,
  provider: DistributionProvider = getDistributionProvider(),
): Promise<DistributionDashboard> {
  validateFilters(filters)
  const channels = await fetchDistributionChannels(provider)
  if (provider === 'api') {
    return fetchApiDistributionDashboard(filters, channels)
  }

  const envelope = await fetchMockDistributionDashboard(filters, channels)
  return adaptDistributionDashboard(envelope, filters, provider)
}

export function buildDistributionRequests(filters: DistributionFilters) {
  const poiId = isAllStore(filters.poiId) ? '' : filters.poiId
  return {
    campFlow: { campId: filters.campId },
    roomCategories: {
      campId: filters.campId,
      pageSize: 999,
      pageNum: 1,
      roomCategoryName: filters.keyword,
      keyword: filters.keyword,
      poiId,
      cityIds: [],
      channelId: localDistributionChannelId,
    },
    undistributedRoomCategories: {
      campId: filters.campId,
      pageNum: filters.page,
      pageSize: filters.pageSize,
      current: filters.page,
      poiId,
      filterSyncChannelId: localDistributionChannelId,
      isAvailability: 1,
      channelId: localDistributionChannelId,
      isFilterAlreadyFlow: 1,
    },
    importedRoomCategories: {
      campId: filters.campId,
      buyCampId: filters.buyCampId,
      roomCategoryTypes: [1],
      goodsTypes: [7],
    },
    stores: {
      campId: filters.campId,
      pageSize: 999,
      pageNum: 1,
      channelId: localDistributionChannelId,
      isAvailability: '1',
    },
  }
}

function getDistributionProvider(): DistributionProvider {
  if (typeof window === 'undefined') return 'api'
  return normalizeProviderValue(window.localStorage.getItem('pms.distributionListProvider')) ?? 'api'
}

async function fetchApiDistributionDashboard(
  filters: DistributionFilters,
  channels: DistributionChannel[],
): Promise<DistributionDashboard> {
  const requests = buildDistributionRequests(filters)
  const [roomPayload, storePayload] = await Promise.all([
    postJson(distributionListEndpoints.roomCategories, requests.roomCategories),
    postJson(distributionListEndpoints.stores, requests.stores),
  ])

  const stores = adaptStores(storePayload)
  const rooms = adaptRoomCategories(roomPayload, stores)
  const filteredRooms = filterRooms(rooms, filters)
  const distributedRooms = filteredRooms.filter((room) => room.progress === 'distributing')
  const undistributedRooms = filteredRooms.filter((room) => room.progress === 'closed')
  const activeRows = filters.tab === 'distributed' ? distributedRooms : undistributedRooms

  return {
    provider: 'api',
    filters,
    request: requests,
    stores,
    channels,
    distributedRooms,
    undistributedRooms,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: activeRows.length,
    },
    updatedAt: new Date().toISOString(),
    traceId: readTraceId(roomPayload) || 'distribution-list-api',
  }
}

async function postJson(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = await readJson(response)
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload) || `分销列表接口请求失败：${endpoint}，HTTP ${response.status}`)
  }
  if (isFailureEnvelope(payload)) {
    throw new Error(extractErrorMessage(payload) || `分销列表接口返回失败：${endpoint}`)
  }
  return payload
}

async function fetchMockDistributionDashboard(
  filters: DistributionFilters,
  channels: DistributionChannel[],
): Promise<Envelope<DashboardPayload>> {
  await delay(80)

  if (filters.scenario === 'error') {
    return {
      code: 50001,
      message: '分销列表加载失败，请稍后重试',
      data: createPayload(filters, channels, true),
      traceId: 'mock-distribution-list-error-001',
      timestamp: fixedTimestamp,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: createPayload(filters, channels, filters.scenario === 'empty'),
    traceId: `mock-distribution-list-${filters.scenario}-001`,
    timestamp: fixedTimestamp,
  }
}

function createPayload(filters: DistributionFilters, channels: DistributionChannel[], empty: boolean): DashboardPayload {
  const rooms = empty ? [] : filterRooms(applyLocalStatusMap(fallbackRooms), filters)
  const distributedRooms = rooms.filter((room) => room.progress === 'distributing')
  const undistributedRooms = rooms.filter((room) => room.progress === 'closed')
  const activeRows = filters.tab === 'distributed' ? distributedRooms : undistributedRooms

  return {
    stores: fallbackStores,
    channels,
    distributedRooms,
    undistributedRooms,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: activeRows.length,
    },
    updatedAt: fixedTimestamp,
  }
}

function applyLocalStatusMap(rooms: DistributionRoomCategory[]) {
  const statusMap = readLocalDistributionStateMap()
  return rooms.map((room) => {
    const savedState = statusMap[room.id]
    const progress = savedState?.progress ?? room.progress
    return {
      ...room,
      progress,
      channelIds: progress === 'distributing' ? savedState?.channelIds ?? room.channelIds : [],
    }
  })
}

function adaptDistributionDashboard(
  envelope: Envelope<DashboardPayload>,
  filters: DistributionFilters,
  provider: DistributionProvider,
): DistributionDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '分销列表加载失败，请稍后重试')
  }

  return {
    ...envelope.data,
    provider,
    filters,
    request: buildDistributionRequests(filters),
    traceId: envelope.traceId,
  }
}

function adaptStores(payload: unknown): DistributionOption[] {
  const list = extractList(payload)
  const stores = list
    .map(asRecord)
    .map((item, index) => ({
      id: readString(item.poiId ?? item.id ?? item.value ?? item.storeId ?? item.campId) || `store-${index + 1}`,
      label: readString(item.poiName ?? item.name ?? item.label ?? item.storeName ?? item.campName) || `门店 ${index + 1}`,
    }))
    .filter((store) => store.id && store.label)

  return [{ id: 'ALL', label: '全部门店' }, ...dedupeOptions(stores)]
}

function adaptRoomCategories(payload: unknown, stores: DistributionOption[]): DistributionRoomCategory[] {
  const statusMap = readLocalDistributionStateMap()
  return extractList(payload)
    .map(asRecord)
    .map((item, index) => {
      const id = readString(item.roomCategoryId ?? item.id ?? item.value ?? item.roomTypeId) || `room-${index + 1}`
      const name =
        readString(item.internalName ?? item.innerName ?? item.name ?? item.roomCategoryName ?? item.displayName ?? item.roomTypeName) ||
        `房型 ${index + 1}`
      const storeId = readString(item.poiId ?? item.storeId ?? item.campId) || stores.find((store) => !isAllStore(store.id))?.id || 'store-1'
      const storeName =
        readString(item.poiName ?? item.storeName ?? item.campName) ||
        stores.find((store) => store.id === storeId)?.label ||
        '当前门店'
      const savedState = statusMap[id]
      const progress: DistributionProgress = savedState?.progress ?? 'distributing'
      const imageUrl = readString(
        item.thumbnail ?? item.thumbnailUrl ?? item.coverImageUrl ?? item.imageUrl ?? item.photoUrl ?? item.roomCategoryImageUrl,
      )

      return {
        id,
        name,
        storeId,
        storeName,
        progress,
        channelIds: progress === 'distributing' ? savedState?.channelIds ?? [localDistributionChannelId] : [],
        thumbnail: imageUrl || createRoomThumbnail(name),
      }
    })
}

function filterRooms(rooms: DistributionRoomCategory[], filters: DistributionFilters) {
  return rooms.filter((room) => {
    const keywordMatched = !filters.keyword || room.name.includes(filters.keyword)
    const storeMatched = isAllStore(filters.poiId) || room.storeId === filters.poiId
    return keywordMatched && storeMatched
  })
}

function isAllStore(storeId: string) {
  return !storeId || storeId === 'ALL' || storeId === 'all'
}

function createRoom(
  id: string,
  name: string,
  storeId: string,
  storeName: string,
  progress: DistributionProgress,
  channelIds: string[],
): DistributionRoomCategory {
  return {
    id,
    name,
    storeId,
    storeName,
    progress,
    channelIds,
    thumbnail: createRoomThumbnail(name),
  }
}

function createRoomThumbnail(name: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="144" height="84" viewBox="0 0 144 84">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ccfbf1" />
          <stop offset="100%" stop-color="#99f6e4" />
        </linearGradient>
      </defs>
      <rect width="144" height="84" rx="12" fill="url(#g)" />
      <rect x="10" y="12" width="60" height="42" rx="8" fill="#ffffff" opacity="0.74" />
      <rect x="77" y="20" width="54" height="8" rx="4" fill="#ffffff" opacity="0.92" />
      <rect x="77" y="36" width="40" height="8" rx="4" fill="#ffffff" opacity="0.7" />
      <rect x="10" y="62" width="124" height="10" rx="5" fill="#f0fdfa" opacity="0.96" />
      <text x="12" y="76" fill="#0f766e" font-size="10" font-family="Arial, sans-serif">${escapeXml(
        name.slice(0, 10),
      )}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function extractList(payload: unknown): unknown[] {
  const root = asRecord(payload)
  const data = asRecord(root.data)
  const candidates = [
    payload,
    data,
    data.list,
    data.records,
    data.rows,
    data.select,
    data.items,
    root.list,
    root.records,
    root.rows,
    root.select,
    root.items,
  ]
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }
  return []
}

export function toDistributionChannels(catalog: ChannelCatalogItem[]): DistributionChannel[] {
  return ensureLocalDistributionChannel(
    catalog
      .filter((channel) => channel.source === 'local' || channel.source === 'custom')
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        shortName: channel.shortName,
        color: channel.color,
      })),
  )
}

async function fetchDistributionChannels(provider: DistributionProvider) {
  const catalog = await fetchEnabledChannelCatalog({ provider: provider === 'api' ? 'api' : 'mock', mockState: 'success' })
  return toDistributionChannels(catalog)
}

function ensureLocalDistributionChannel(channels: DistributionChannel[]) {
  if (channels.some((channel) => channel.id === localDistributionChannelId || channel.name === localChannel.name)) {
    return dedupeChannels(channels)
  }
  return [localChannel, ...dedupeChannels(channels)]
}

function dedupeChannels(channels: DistributionChannel[]) {
  const seen = new Set<string>()
  return channels.filter((channel) => {
    const key = channel.id || channel.name
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function readLocalDistributionStateMap(): Record<string, { progress: DistributionProgress; channelIds?: string[] }> {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(localDistributionStatusStorageKey) || '{}') as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([roomId, value]) => [roomId, readStoredDistributionState(value)] as const)
        .filter((entry): entry is readonly [string, { progress: DistributionProgress; channelIds?: string[] }] => Boolean(entry[1])),
    )
  } catch {
    return {}
  }
}

function readStoredDistributionState(value: unknown) {
  if (value === 'closed' || value === 'distributing') return { progress: value }
  const record = asRecord(value)
  const progress = record.progress
  if (progress !== 'closed' && progress !== 'distributing') return null
  const channelIds = Array.isArray(record.channelIds)
    ? record.channelIds.map((item) => readString(item)).filter(Boolean)
    : undefined
  return channelIds?.length ? { progress, channelIds } : { progress }
}

function readRuntimeCampId() {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem('pmsCampId') || window.localStorage.getItem('campId') || ''
}

function dedupeOptions(options: DistributionOption[]) {
  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.id)) return false
    seen.add(option.id)
    return true
  })
}

function validateFilters(filters: DistributionFilters) {
  if (!Number.isFinite(filters.page) || filters.page < 1) throw new Error('分页参数不正确')
  if (!Number.isFinite(filters.pageSize) || filters.pageSize < 1) throw new Error('分页参数不正确')
}

function toScenario(value: string | null): DistributionScenario {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function normalizeProviderValue(value: string | null | undefined) {
  return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function isFailureEnvelope(payload: unknown) {
  const record = asRecord(payload)
  if ('success' in record) return record.success !== true
  if ('code' in record) return Number(record.code) !== 0
  return false
}

function extractErrorMessage(payload: unknown) {
  const record = asRecord(payload)
  const message = String(record.errorMsg ?? record.message ?? record.errorDetail ?? '').trim()
  return message === 'null' || message === 'undefined' ? '' : message
}

function readTraceId(payload: unknown) {
  const record = asRecord(payload)
  return readString(record.traceId ?? asRecord(record.data).traceId)
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function readString(value: unknown) {
  if (value === null || value === undefined || value === '') return ''
  return String(value).trim()
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
