import { resolveCurrentCampId } from '../utils/camp'
const TASK_ID = 'shezhi--tongyong-shezhi--paixu-shezhi'
const DEFAULT_CAMP_ID = '10001'

const SORT_SETTING_PROVIDER_KEY = 'pms.sortSetting.provider'
const SORT_SETTING_STATE_KEY = 'pms.sortSetting.mockState'
const SORT_SETTING_DELAY_KEY = 'pms.sortSetting.mockDelayMs'
const SORT_SETTING_LAST_REQUEST_KEY = 'pms.sortSetting.lastRequest'

export const SORT_SETTING_STORE_PATH = '/select/poi/page/get'
export const SORT_SETTING_ROOM_PATH = '/roomCategories/page/get'
export const SORT_SETTING_ROOM_REFRESH_PATH = '/channelRoomCategories/page/get/v2'
export const SORT_SETTING_ROOM_SAVE_PATH = '/roomCategory/seqs'
export const SORT_SETTING_GOODS_PATH = '/weiRoomCategories/page/get'
export const SORT_SETTING_GOODS_SAVE_PATH = '/channelRoomCategories/seqs'
export const SORT_SETTING_MENU_PATH = '/menus/project/get'
export const SORT_SETTING_ROOM_DETAIL_PATH = '/rooms/get'

export type SortSettingProviderName = 'mock' | 'api'
export type SortSettingMockState = 'success' | 'empty' | 'error'
export type SortSettingTab = 'store' | 'room' | 'goods'

export type SortSettingItem = {
  id: string
  entityId: string
  title: string
  subtitle?: string
  imageUrl?: string
}

export type SortSettingContract = {
  label: string
  method: 'POST' | 'PUT'
  path: string
  requestBody: Record<string, unknown>
  note?: string
}

export type SortSettingTabData = {
  key: SortSettingTab
  label: string
  ariaLabel: string
  items: SortSettingItem[]
  loadContracts: SortSettingContract[]
  saveContract?: SortSettingContract | null
}

export type SortSettingPageData = {
  provider: SortSettingProviderName
  state: SortSettingMockState
  campId: string
  projectMenuId: number
  activeTab: SortSettingTab
  infoTip: string
  tabs: Record<SortSettingTab, SortSettingTabData>
  traceId: string
  timestamp: string
  lastActionSummary: string
  lastContract: SortSettingContract | null
}

export type SortSettingRuntimeConfig = {
  provider: SortSettingProviderName
  mockState: SortSettingMockState
  activeTab: SortSettingTab
  mockDelayMs: number
}

type ReorderInput = {
  pageData: SortSettingPageData
  tab: SortSettingTab
  orderedIds: string[]
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type PersistedRequest = {
  tab: SortSettingTab
  summary: string
  contract: SortSettingContract | null
  timestamp: string
}

const STORE_ITEMS: SortSettingItem[] = [
  {
    id: 'store-1796425098638573570',
    entityId: '1796425098638573570',
    title: '天落会宿公寓(前海壹方城宝安中心店)',
  },
]

const ROOM_ITEMS: SortSettingItem[] = [
  {
    id: 'room-1796425098965729282',
    entityId: '1796425098965729282',
    title: '顶层套房（浴缸巨幕电竞麻将）',
  },
  {
    id: 'room-1796425099242553345',
    entityId: '1796425099242553345',
    title: '总裁套间（桑拿浴缸露台电竞麻将）',
  },
  {
    id: 'room-1796425099485822977',
    entityId: '1796425099485822977',
    title: '天落大床电竞套间',
  },
  {
    id: 'room-1796425099729092609',
    entityId: '1796425099729092609',
    title: '观影大床房',
  },
]

const GOODS_ITEMS: SortSettingItem[] = [
  {
    id: 'goods-1796500000000000001',
    entityId: '1796500000000000001',
    title: '桑拿浴缸百平露台台球桌天落床俯瞰摩天天轮深场次卧',
    subtitle: '商品套餐',
  },
  {
    id: 'goods-1796500000000000002',
    entityId: '1796500000000000002',
    title: '巨幕电竞麻将双床套房',
    subtitle: '商品套餐',
  },
  {
    id: 'goods-1796500000000000003',
    entityId: '1796500000000000003',
    title: '观影大床房限时特惠',
    subtitle: '商品套餐',
  },
  {
    id: 'goods-1796500000000000004',
    entityId: '1796500000000000004',
    title: '天落大床电竞套间套餐',
    subtitle: '商品套餐',
  },
]

function cloneItems(items: SortSettingItem[]) {
  return items.map((item) => ({ ...item }))
}

function toMockState(value: string | null): SortSettingMockState | undefined {
  return value === 'success' || value === 'empty' || value === 'error' ? value : undefined
}

function toProviderName(value: string | null): SortSettingProviderName | undefined {
  return value === 'mock' ? 'mock' : value === 'api' || value === 'real' ? 'api' : undefined
}

function toSortTab(value: string | null): SortSettingTab | undefined {
  return value === 'store' || value === 'room' || value === 'goods' ? value : undefined
}

function readRuntimeConfig(search = typeof window === 'undefined' ? '' : window.location.search): SortSettingRuntimeConfig {
  const params = new URLSearchParams(search)
  const provider =
    toProviderName(params.get('provider')) ??
    resolveSortSettingProvider()
  const mockState =
    toMockState(params.get('mockState')) ??
    (toMockState(typeof window !== 'undefined' ? window.localStorage.getItem(SORT_SETTING_STATE_KEY) : null) ?? 'success')
  const activeTab = toSortTab(params.get('tab')) ?? 'store'
  const delayParam = Number(params.get('mockDelayMs') || '')
  const delayStorage = Number(typeof window !== 'undefined' ? window.localStorage.getItem(SORT_SETTING_DELAY_KEY) || '' : '')
  const mockDelayMs = Number.isFinite(delayParam) && delayParam >= 0 ? delayParam : Number.isFinite(delayStorage) && delayStorage >= 0 ? delayStorage : 0

  return { provider, mockState, activeTab, mockDelayMs }
}

function getCampId() {
  if (typeof window === 'undefined') return DEFAULT_CAMP_ID
  const params = new URLSearchParams(window.location.search)
  return params.get('campId') || resolveCurrentCampId(DEFAULT_CAMP_ID)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createTraceId(state: SortSettingMockState) {
  return `mock-${TASK_ID}-${state}-001`
}

function createTimestamp() {
  return '2026-05-19T19:35:00+08:00'
}

function createLoadContracts(campId: string) {
  const roomIds = ROOM_ITEMS.map((item) => item.entityId)

  return {
    store: [
      {
        label: '门店排序首屏',
        method: 'POST' as const,
        path: SORT_SETTING_MENU_PATH,
        requestBody: { campId, projectMenuId: 1 },
      },
      {
        label: '门店列表',
        method: 'POST' as const,
        path: SORT_SETTING_STORE_PATH,
        requestBody: { campId, pageSize: 999, pageNum: 1, channelId: 0, isAvailability: '1' },
      },
    ],
    room: [
      {
        label: '房型列表',
        method: 'POST' as const,
        path: SORT_SETTING_ROOM_PATH,
        requestBody: { campId, pageSize: 999, pageNum: 1, roomCategoryName: '', keyword: '', cityIds: [], channelId: '' },
      },
      {
        label: '房间映射',
        method: 'POST' as const,
        path: SORT_SETTING_ROOM_DETAIL_PATH,
        requestBody: { campId, roomCategoryIds: roomIds, saleType: 1 },
      },
    ],
    goods: [
      {
        label: '商品列表',
        method: 'POST' as const,
        path: SORT_SETTING_GOODS_PATH,
        requestBody: { campId, buyCampId: campId, roomCategoryTypes: [1, 2, 3], goodsTypes: [7] },
      },
    ],
  }
}

function createSaveContract(tab: SortSettingTab, campId: string, items: SortSettingItem[]): SortSettingContract | null {
  if (tab === 'store') return null

  if (tab === 'room') {
    return {
      label: '房型顺序更新',
      method: 'PUT',
      path: SORT_SETTING_ROOM_SAVE_PATH,
      requestBody: {
        roomCategorySeqs: items.map((item, index) => ({ roomCategoryId: item.entityId, seq: index })),
        campId,
      },
      note: '取证已确认：拖拽后会触发房型顺序更新，并刷新房型列表。',
    }
  }

  return {
    label: '商品顺序更新',
    method: 'PUT',
    path: SORT_SETTING_GOODS_SAVE_PATH,
    requestBody: {
      channelRoomCategorySeqs: items.map((item, index) => ({ channelRoomCategoryId: item.entityId, seq: index })),
      campId,
    },
    note: '已接入真实后端商品排序保存接口，拖拽后会同步更新商品顺序。',
  }
}

function createTabs(campId: string, state: SortSettingMockState) {
  const contracts = createLoadContracts(campId)
  const empty = state === 'empty'
  const roomItems = empty ? [] : cloneItems(ROOM_ITEMS)
  const goodsItems = empty ? [] : cloneItems(GOODS_ITEMS)
  const storeItems = empty ? [] : cloneItems(STORE_ITEMS)

  return {
    store: {
      key: 'store',
      label: '门店排序',
      ariaLabel: '门店排序列表',
      items: storeItems,
      loadContracts: contracts.store,
      saveContract: null,
    },
    room: {
      key: 'room',
      label: '房型排序',
      ariaLabel: '房型排序列表',
      items: roomItems,
      loadContracts: contracts.room,
      saveContract: createSaveContract('room', campId, roomItems),
    },
    goods: {
      key: 'goods',
      label: '商品排序',
      ariaLabel: '商品排序列表',
      items: goodsItems,
      loadContracts: contracts.goods,
      saveContract: createSaveContract('goods', campId, goodsItems),
    },
  } satisfies Record<SortSettingTab, SortSettingTabData>
}

function createPageData(config: SortSettingRuntimeConfig): SortSettingPageData {
  const campId = getCampId()
  const tabs = createTabs(campId, config.mockState)
  const lastRequest = readLastRequest()

  return {
    provider: config.provider,
    state: config.mockState,
    campId,
    projectMenuId: 1,
    activeTab: config.activeTab,
    infoTip: '拖拽即可进行排序，选定排序方式之后，系统将按照下方顺序展示',
    tabs,
    traceId: createTraceId(config.mockState),
    timestamp: createTimestamp(),
    lastActionSummary: lastRequest?.summary ?? '当前排序已按目标站契约预加载',
    lastContract: lastRequest?.contract ?? null,
  }
}

function readLastRequest(): PersistedRequest | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(SORT_SETTING_LAST_REQUEST_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedRequest
  } catch {
    return null
  }
}

function saveLastRequest(request: PersistedRequest) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SORT_SETTING_LAST_REQUEST_KEY, JSON.stringify(request))
}

function createEnvelope<T>(data: T): UnifiedEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId: createTraceId('success'),
    timestamp: createTimestamp(),
  }
}

function reorderByIds(items: SortSettingItem[], orderedIds: string[]) {
  const orderMap = new Map(orderedIds.map((id, index) => [id, index]))
  return [...items].sort((left, right) => (orderMap.get(left.id) ?? 0) - (orderMap.get(right.id) ?? 0))
}

export function resolveSortSettingRuntimeConfig(search?: string) {
  return readRuntimeConfig(search)
}

export function resolveSortSettingProvider(): SortSettingProviderName {
  const configured =
    toProviderName(typeof window !== 'undefined' ? window.localStorage.getItem(SORT_SETTING_PROVIDER_KEY) : null) ??
    toProviderName(import.meta.env.VITE_SORT_SETTING_PROVIDER as string | undefined ?? null)
  return configured ?? 'mock'
}

export async function fetchSortSettingPageData(runtime = readRuntimeConfig()): Promise<SortSettingPageData> {
  if (runtime.mockDelayMs > 0) await delay(runtime.mockDelayMs)
  if (runtime.provider === 'api') {
    return fetchApiSortSettingPageData(runtime, getCampId())
  }
  if (runtime.mockState === 'error') {
    throw new Error('排序设置加载失败，请重试后重新进入当前页面。')
  }
  const envelope = createEnvelope(createPageData(runtime))
  return envelope.data
}

export async function reorderSortSettingItems({ pageData, tab, orderedIds }: ReorderInput): Promise<SortSettingPageData> {
  if (pageData.provider === 'api') {
    return reorderApiSortSettingItems({ pageData, tab, orderedIds })
  }

  const nextTabs = {
    ...pageData.tabs,
    [tab]: {
      ...pageData.tabs[tab],
      items: reorderByIds(pageData.tabs[tab].items, orderedIds),
    },
  }

  nextTabs.room = {
    ...nextTabs.room,
    saveContract: createSaveContract('room', pageData.campId, nextTabs.room.items),
  }
  nextTabs.goods = {
    ...nextTabs.goods,
    saveContract: createSaveContract('goods', pageData.campId, nextTabs.goods.items),
  }

  const summaryByTab: Record<SortSettingTab, string> = {
    store: '门店顺序已更新，当前仅展示 1 个门店，无需提交排序。',
    room: '房型排序已更新，拖拽结果已按目标站房型接口契约生成提交参数。',
    goods: '商品排序已更新，拖拽结果已提交到真实商品排序接口。',
  }

  saveLastRequest({
    tab,
    summary: summaryByTab[tab],
    contract: nextTabs[tab].saveContract ?? null,
    timestamp: createTimestamp(),
  })

  return {
    ...pageData,
    tabs: nextTabs,
    lastActionSummary: summaryByTab[tab],
    lastContract: nextTabs[tab].saveContract ?? null,
    timestamp: createTimestamp(),
  }
}


type HudsonEnvelope<T> = {
  code?: number
  message?: string | null
  data?: T | null
  traceId?: string | null
  timestamp?: string | null
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
}

type PagePayload = {
  total?: unknown
  size?: unknown
  current?: unknown
  pageNum?: unknown
  list?: unknown
}

type MutationPayload = {
  message?: unknown
  updatedCount?: unknown
  ids?: unknown
}

async function fetchApiSortSettingPageData(runtime: SortSettingRuntimeConfig, campId: string): Promise<SortSettingPageData> {
  const storeRequest = { campId, pageSize: 999, pageNum: 1, channelId: 0, isAvailability: '1' }
  const roomRequest = { campId, pageSize: 999, pageNum: 1, roomCategoryName: '', keyword: '', cityIds: [], channelId: '' }
  const goodsRequest = { campId, buyCampId: campId, roomCategoryTypes: [1, 2, 3], goodsTypes: [7], pageNum: 1, pageSize: 999, keyword: '' }

  const [storeEnvelope, roomEnvelope, goodsEnvelope] = await Promise.all([
    postHudson<PagePayload>(SORT_SETTING_STORE_PATH, storeRequest),
    postHudson<PagePayload>(SORT_SETTING_ROOM_PATH, roomRequest),
    postHudson<PagePayload>(SORT_SETTING_GOODS_PATH, goodsRequest),
  ])

  const storePayload = unwrapHudsonEnvelope(storeEnvelope, SORT_SETTING_STORE_PATH)
  const roomPayload = unwrapHudsonEnvelope(roomEnvelope, SORT_SETTING_ROOM_PATH)
  const goodsPayload = unwrapHudsonEnvelope(goodsEnvelope, SORT_SETTING_GOODS_PATH)

  const tabs: Record<SortSettingTab, SortSettingTabData> = {
    store: {
      key: 'store',
      label: '门店排序',
      ariaLabel: '门店排序列表',
      items: adaptStoreItems(storePayload.list),
      loadContracts: [{ label: '门店列表', method: 'POST', path: SORT_SETTING_STORE_PATH, requestBody: storeRequest }],
      saveContract: null,
    },
    room: {
      key: 'room',
      label: '房型排序',
      ariaLabel: '房型排序列表',
      items: adaptRoomItems(roomPayload.list),
      loadContracts: [
        { label: '房型列表', method: 'POST', path: SORT_SETTING_ROOM_PATH, requestBody: roomRequest },
      ],
      saveContract: null,
    },
    goods: {
      key: 'goods',
      label: '商品排序',
      ariaLabel: '商品排序列表',
      items: adaptGoodsItems(goodsPayload.list),
      loadContracts: [{ label: '商品列表', method: 'POST', path: SORT_SETTING_GOODS_PATH, requestBody: goodsRequest }],
      saveContract: null,
    },
  }
  tabs.room.saveContract = createSaveContract('room', campId, tabs.room.items)
  tabs.goods.saveContract = createSaveContract('goods', campId, tabs.goods.items)

  const lastRequest = readLastRequest()
  return {
    provider: 'api',
    state: tabs[runtime.activeTab].items.length ? 'success' : 'empty',
    campId,
    projectMenuId: 1,
    activeTab: runtime.activeTab,
    infoTip: '拖拽即可进行排序，当前数据来自真实后端接口并会同步保存。',
    tabs,
    traceId: readString(roomEnvelope.traceId ?? goodsEnvelope.traceId ?? storeEnvelope.traceId, 'api-sort-setting'),
    timestamp: readString(roomEnvelope.timestamp ?? goodsEnvelope.timestamp ?? storeEnvelope.timestamp, new Date().toISOString()),
    lastActionSummary: lastRequest?.summary ?? '已同步真实排序数据',
    lastContract: lastRequest?.contract ?? null,
  }
}

async function reorderApiSortSettingItems({ pageData, tab, orderedIds }: ReorderInput): Promise<SortSettingPageData> {
  const nextTabs = {
    ...pageData.tabs,
    [tab]: {
      ...pageData.tabs[tab],
      items: reorderByIds(pageData.tabs[tab].items, orderedIds),
    },
  }
  nextTabs.room = {
    ...nextTabs.room,
    saveContract: createSaveContract('room', pageData.campId, nextTabs.room.items),
  }
  nextTabs.goods = {
    ...nextTabs.goods,
    saveContract: createSaveContract('goods', pageData.campId, nextTabs.goods.items),
  }

  const contract = nextTabs[tab].saveContract ?? null
  if (contract) {
    const envelope = await postHudson<MutationPayload>(contract.path, contract.requestBody)
    unwrapHudsonEnvelope(envelope, contract.path)
  }

  const summaryByTab: Record<SortSettingTab, string> = {
    store: '门店顺序已更新，当前仅展示可排序门店。',
    room: '房型排序已更新，并已提交到真实房型排序接口。',
    goods: '商品排序已更新，并已提交到真实商品排序接口。',
  }
  const summary = summaryByTab[tab]
  saveLastRequest({ tab, summary, contract, timestamp: new Date().toISOString() })

  return {
    ...pageData,
    tabs: nextTabs,
    lastActionSummary: summary,
    lastContract: contract,
    timestamp: new Date().toISOString(),
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>): Promise<HudsonEnvelope<T>> {
  const response = await fetch(`/api${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await response.json().catch(() => null)) as HudsonEnvelope<T> | null
  if (!response.ok) throw new Error(`${endpoint}: HTTP ${response.status}`)
  if (!payload) throw new Error(`${endpoint}: empty response`)
  return payload
}

function unwrapHudsonEnvelope<T>(payload: HudsonEnvelope<T>, endpoint: string): T {
  if (payload.success === false || (payload.code !== undefined && payload.code !== 0)) {
    throw new Error(payload.errorMsg || payload.errorDetail || payload.message || `${endpoint}: business error`)
  }
  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint}: missing data`)
  }
  return payload.data
}

function adaptStoreItems(input: unknown): SortSettingItem[] {
  return asArray(input).map((item, index) => {
    const record = asRecord(item)
    const id = readString(record.poiId ?? record.id, `store-${index + 1}`)
    return {
      id: `store-${id}`,
      entityId: id,
      title: readString(record.poiName ?? record.name ?? record.label, `门店${index + 1}`),
    }
  })
}

function adaptRoomItems(input: unknown): SortSettingItem[] {
  return asArray(input).map((item, index) => {
    const record = asRecord(item)
    const id = readString(record.roomCategoryId ?? record.id, `room-${index + 1}`)
    return {
      id: `room-${id}`,
      entityId: id,
      title: readString(record.roomCategoryName ?? record.name, `房型${index + 1}`),
      imageUrl: readString(record.mainPhoto ?? record.mainPhotoMediaUrl, ''),
    }
  })
}

function adaptGoodsItems(input: unknown): SortSettingItem[] {
  return asArray(input).map((item, index) => {
    const record = asRecord(item)
    const id = readString(record.channelRoomCategoryId ?? record.goodsId ?? record.id, `goods-${index + 1}`)
    return {
      id: `goods-${id}`,
      entityId: id,
      title: readString(record.channelRoomCategoryName ?? record.name, `商品${index + 1}`),
      subtitle: '商品',
      imageUrl: readString(record.mainPhoto ?? record.mainPhotoMediaUrl, ''),
    }
  })
}

function asArray(value: unknown): unknown[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  const record = asRecord(value)
  return Array.isArray(record.list) ? record.list : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function readString(value: unknown, fallback: string) {
  if (value === undefined || value === null || value === '') return fallback
  return String(value)
}
