const TASK_ID = 'shezhi--tongyong-shezhi--paixu-shezhi'
const DEFAULT_CAMP_ID = '1796067693589061634'

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
  return value === 'mock' || value === 'api' ? value : undefined
}

function toSortTab(value: string | null): SortSettingTab | undefined {
  return value === 'store' || value === 'room' || value === 'goods' ? value : undefined
}

function readRuntimeConfig(search = typeof window === 'undefined' ? '' : window.location.search): SortSettingRuntimeConfig {
  const params = new URLSearchParams(search)
  const provider =
    toProviderName(params.get('provider')) ??
    (typeof window !== 'undefined' && window.localStorage.getItem(SORT_SETTING_PROVIDER_KEY) === 'api' ? 'api' : 'mock')
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
  return params.get('campId') || window.localStorage.getItem('pmsCampId') || DEFAULT_CAMP_ID
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
        requestBody: { campId: '64', buyCampId: campId, roomCategoryTypes: [1], goodsTypes: [7] },
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
    note: '该保存路径根据房型排序的同构接口推断，目标站本轮仅取证到商品列表请求，待后端确认最终保存接口。',
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

function assertApiProvider() {
  throw new Error('排序设置 API 数据源当前不可用，请先使用默认数据源继续排序。')
}

export function resolveSortSettingRuntimeConfig(search?: string) {
  return readRuntimeConfig(search)
}

export async function fetchSortSettingPageData(runtime = readRuntimeConfig()): Promise<SortSettingPageData> {
  if (runtime.mockDelayMs > 0) await delay(runtime.mockDelayMs)
  if (runtime.provider === 'api') {
    assertApiProvider()
  }
  if (runtime.mockState === 'error') {
    throw new Error('排序设置加载失败，请重试后重新进入当前页面。')
  }
  const envelope = createEnvelope(createPageData(runtime))
  return envelope.data
}

export async function reorderSortSettingItems({ pageData, tab, orderedIds }: ReorderInput): Promise<SortSettingPageData> {
  if (pageData.provider === 'api') {
    assertApiProvider()
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
    goods: '商品排序已更新，当前会话顺序已同步，商品保存接口待后端最终确认。',
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
