export type CampInfoProviderName = 'mock' | 'api'
export type CampInfoMockMode = 'success' | 'empty' | 'error'
export type CampInfoSortTab = 'store' | 'roomType' | 'goods'

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type ApiPayload = {
  success?: boolean
  data?: unknown
  code?: number
  message?: string
  errorMsg?: string
  errorCode?: string
  traceId?: string
  timestamp?: string
}

export type CampInfoQuery = {
  keyword: string
  page: number
  pageSize: number
}

export type CampInfoRoomType = {
  id: string
  name: string
  imageKey: string
  roomCount: number
  roomLabel: string
}

export type CampInfoStore = {
  id: string
  campId: string
  name: string
  typeLabel: string
  coverLabel: string
  address: string
  cityLabel: string
  phone: string
  tagLine: string
  listedRoomTypeCount: number
  roomTypes: CampInfoRoomType[]
}

export type CampInfoImportOption = {
  id: string
  label: string
  description: string
}

export type CampInfoOverview = {
  provider: CampInfoProviderName
  state: 'success' | 'empty'
  endpoint: string
  traceId: string
  timestamp: string
  request: CampInfoQuery
  observedEndpoints: string[]
  summary: {
    activeStoreText: string
    effectivePeriod: string
    total: number
    limit: number
  }
  stores: CampInfoStore[]
  importOptions: CampInfoImportOption[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  emptyMessage: string
}

export type CampInfoDetail = {
  provider: CampInfoProviderName
  endpoint: string
  traceId: string
  timestamp: string
  store: CampInfoStore
  albumImageCount: number
  cityPath: string
  streetAddress: string
  communityName: string
  unitNo: string
  fullAddress: string
  mapCopyright: string
}

export type CampInfoSortItem = {
  id: string
  label: string
}

export type CampInfoSortData = {
  provider: CampInfoProviderName
  endpoint: string
  traceId: string
  timestamp: string
  activeTab: CampInfoSortTab
  tabs: Array<{ key: CampInfoSortTab; label: string }>
  items: CampInfoSortItem[]
}

export class CampInfoRequestError extends Error {
  constructor(message = '门店信息加载失败') {
    super(message)
    this.name = 'CampInfoRequestError'
  }
}

const HUDSON_BASE_URL = '/api'
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'
const DEFAULT_QUERY: CampInfoQuery = { keyword: '', page: 1, pageSize: 20 }
const CAMP_INFO_PROVIDER_KEY = 'pms.campInfoProvider'
const CAMP_INFO_MOCK_MODE_KEY = 'pms.campInfoMockMode'
const CAMP_INFO_MOCK_LATENCY_KEY = 'pms.campInfoMockLatencyMs'

export const campInfoObservedEndpoints = [
  '/camps/get',
  '/camp/get',
  '/channels/get',
  '/edition/resource/get',
  '/order/report/get',
] as const

const importOptions: CampInfoImportOption[] = [
  { id: 'room-types', label: '导入门店基础资料', description: '同步门店名称、地址、房型和展示封面。' },
  { id: 'gallery', label: '导入图片与标签', description: '同步门店图片、标签和城市信息。' },
  { id: 'inventory', label: '导入房态资源', description: '同步房型数量、房间标签和排序基础数据。' },
]

const storeSeed: CampInfoStore = {
  id: 'store-qianhai-001',
  campId: 'camp-qianhai-001',
  name: '天落会宿公寓(前海壹方城宝安中心店)',
  typeLabel: '酒店',
  coverLabel: '门店图片预览',
  address: '深圳宝安区新安街道海裕社区N15幸福海岸花园10栋30楼, 中国',
  cityLabel: '广东省/深圳市/宝安区',
  phone: '+86-18123941382',
  tagLine: '电竞麻将 / 巨幕观影 / 浴缸露台',
  listedRoomTypeCount: 4,
  roomTypes: [
    {
      id: 'room-night',
      name: '顶层套房（浴缸巨幕电竞麻将）',
      imageKey: 'night',
      roomCount: 1,
      roomLabel: '房间1',
    },
    {
      id: 'room-suite',
      name: '总裁套间（桑拿浴缸露台电竞麻将）',
      imageKey: 'suite',
      roomCount: 1,
      roomLabel: '房间1',
    },
    {
      id: 'room-bed',
      name: '天落大床电竞套间',
      imageKey: 'bed',
      roomCount: 1,
      roomLabel: '房间1',
    },
    {
      id: 'room-film',
      name: '观影大床房',
      imageKey: 'film',
      roomCount: 1,
      roomLabel: '房间1',
    },
  ],
}

const goodsSortItems: CampInfoSortItem[] = [
  { id: 'goods-sauna-suite', label: '桑拿浴缸百平露台台球桌天落床俯瞰摩天轮深圳湾' },
  { id: 'goods-double-esports', label: '双人电竞麻将套票' },
  { id: 'goods-screening', label: '巨幕观影套餐' },
  { id: 'goods-late-checkout', label: '延迟退房权益' },
]

export async function fetchCampInfoOverview(
  query: Partial<CampInfoQuery> = {},
  signal?: AbortSignal,
): Promise<CampInfoOverview> {
  const normalizedQuery = normalizeQuery(query)
  const provider = resolveProvider()
  if (provider === 'api') {
    return fetchApiOverview(normalizedQuery, signal)
  }
  return fetchMockOverview(normalizedQuery)
}

export async function fetchCampInfoDetail(storeId: string, signal?: AbortSignal): Promise<CampInfoDetail> {
  const provider = resolveProvider()
  if (provider === 'api') {
    return fetchApiDetail(storeId, signal)
  }
  const store = cloneStore(storeSeed)
  if (store.id !== storeId) throw new CampInfoRequestError('未找到门店详情')
  return {
    provider: 'mock',
    endpoint: 'camp-info-detail-mock-provider',
    traceId: 'mock-shezhi--xinxi-weihu--mendian-xinxi-detail-001',
    timestamp: MOCK_TIMESTAMP,
    store,
    albumImageCount: 9,
    cityPath: store.cityLabel,
    streetAddress: '深圳宝安区新安街道海裕社区N15幸福海岸花园',
    communityName: '幸福海岸花园',
    unitNo: '10栋30楼',
    fullAddress: store.address,
    mapCopyright: '© 2026 AutoNavi - GS(2023)4677号',
  }
}

export async function fetchCampInfoSortData(
  activeTab: CampInfoSortTab,
  signal?: AbortSignal,
): Promise<CampInfoSortData> {
  const provider = resolveProvider()
  if (provider === 'api') {
    await fetchCampInfoOverview(DEFAULT_QUERY, signal)
  } else {
    await waitForMockLatency()
    if (resolveMockMode() === 'error') {
      throw new CampInfoRequestError('门店排序加载失败')
    }
  }

  return {
    provider,
    endpoint: provider === 'mock' ? 'camp-info-sort-mock-provider' : `${HUDSON_BASE_URL}/camp/get`,
    traceId: `mock-shezhi--xinxi-weihu--mendian-xinxi-sort-${activeTab}-001`,
    timestamp: MOCK_TIMESTAMP,
    activeTab,
    tabs: [
      { key: 'store', label: '门店排序' },
      { key: 'roomType', label: '房型排序' },
      { key: 'goods', label: '商品排序' },
    ],
    items:
      activeTab === 'store'
        ? [{ id: storeSeed.id, label: storeSeed.name }]
        : activeTab === 'roomType'
          ? storeSeed.roomTypes.map((item) => ({ id: item.id, label: item.name }))
          : goodsSortItems.map((item) => ({ ...item })),
  }
}

export async function createCampInfoImportTask(optionId: string) {
  const option = importOptions.find((item) => item.id === optionId)
  if (!option) throw new CampInfoRequestError('未找到导入选项')
  if (resolveProvider() === 'api') {
    await Promise.resolve()
  }
  return {
    taskId: `camp-info-import-${optionId}`,
    message: '导入任务已创建',
  }
}

export async function saveCampInfoSort(activeTab: CampInfoSortTab, itemIds: string[]) {
  if (resolveProvider() === 'api') {
    await Promise.resolve({ activeTab, itemIds })
  }
  return {
    message: '排序已保存',
    traceId: `mock-shezhi--xinxi-weihu--mendian-xinxi-save-sort-${activeTab}-001`,
  }
}

function normalizeQuery(query: Partial<CampInfoQuery>): CampInfoQuery {
  return {
    keyword: String(query.keyword ?? DEFAULT_QUERY.keyword).trim(),
    page: Number.isFinite(query.page) && Number(query.page) > 0 ? Number(query.page) : DEFAULT_QUERY.page,
    pageSize:
      Number.isFinite(query.pageSize) && Number(query.pageSize) > 0 ? Number(query.pageSize) : DEFAULT_QUERY.pageSize,
  }
}

async function fetchMockOverview(query: CampInfoQuery) {
  await waitForMockLatency()
  const mode = resolveMockMode()
  if (mode === 'error') {
    throw new CampInfoRequestError('门店信息加载失败')
  }

  const stores = mode === 'empty' ? [] : filterStores([cloneStore(storeSeed)], query)
  const emptyMessage =
    mode === 'empty'
      ? '暂无已创建的门店'
      : stores.length === 0
        ? '暂无符合条件的门店'
        : '暂无已创建的门店'

  const envelope = createMockEnvelope(
    'mock-shezhi--xinxi-weihu--mendian-xinxi-list-001',
    {
      list: stores,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: stores.length,
      },
      summary: {
        activeStoreText: mode === 'empty' ? '0/1' : '1/1',
        effectivePeriod: '2025.09.28 至 2027.09.28',
        total: stores.length,
        limit: 1,
      },
      importOptions,
    },
  )

  return adaptOverview(envelope, query, 'mock', emptyMessage)
}

async function fetchApiOverview(query: CampInfoQuery, signal?: AbortSignal): Promise<CampInfoOverview> {
  const campPayload = await postHudson('/camps/get', {}, signal)
  const campId = readCampId(campPayload?.data ?? campPayload)
  const [campPayloadDetail, resourcePayload] = await Promise.all([
    postHudson('/camp/get', { campId }, signal),
    postHudson('/edition/resource/get', { campId }, signal),
  ])

  const store = adaptApiStore(campPayloadDetail?.data ?? campPayloadDetail, query)
  return {
    provider: 'api',
    state: store ? 'success' : 'empty',
    endpoint: `${HUDSON_BASE_URL}/camp/get`,
    traceId: readString(campPayloadDetail?.traceId) ?? `api-shezhi--xinxi-weihu--mendian-xinxi-${campId}`,
    timestamp: readString(campPayloadDetail?.timestamp) ?? new Date().toISOString(),
    request: query,
    observedEndpoints: [...campInfoObservedEndpoints],
    summary: {
      activeStoreText: store ? '1/1' : '0/1',
      effectivePeriod: readString((resourcePayload?.data as Record<string, unknown> | undefined)?.expireDateRange) ?? '待接口补齐',
      total: store ? 1 : 0,
      limit: 1,
    },
    stores: store ? [store] : [],
    importOptions,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: store ? 1 : 0,
    },
    emptyMessage: store ? '暂无符合条件的门店' : '暂无已创建的门店',
  }
}

async function fetchApiDetail(storeId: string, signal?: AbortSignal): Promise<CampInfoDetail> {
  const payload = await postHudson('/camp/get', { campId: storeId }, signal)
  const store = adaptApiStore(payload?.data ?? payload, DEFAULT_QUERY)
  if (!store) throw new CampInfoRequestError('/camp/get 未返回门店详情')
  return {
    provider: 'api',
    endpoint: `${HUDSON_BASE_URL}/camp/get`,
    traceId: readString(payload?.traceId) ?? `api-shezhi--xinxi-weihu--mendian-xinxi-detail-${storeId}`,
    timestamp: readString(payload?.timestamp) ?? new Date().toISOString(),
    store,
    albumImageCount: 9,
    cityPath: store.cityLabel,
    streetAddress: store.address,
    communityName: '',
    unitNo: '',
    fullAddress: store.address,
    mapCopyright: '© 2026 AutoNavi - GS(2023)4677号',
  }
}

function adaptOverview(
  envelope: ApiEnvelope<{
    list: CampInfoStore[]
    pagination: CampInfoOverview['pagination']
    summary: CampInfoOverview['summary']
    importOptions: CampInfoImportOption[]
  }>,
  request: CampInfoQuery,
  provider: CampInfoProviderName,
  emptyMessage: string,
): CampInfoOverview {
  const data = unwrapEnvelope(envelope)
  return {
    provider,
    state: data.list.length === 0 ? 'empty' : 'success',
    endpoint: provider === 'mock' ? 'camp-info-mock-provider' : `${HUDSON_BASE_URL}/camp/get`,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    request,
    observedEndpoints: [...campInfoObservedEndpoints],
    summary: data.summary,
    stores: data.list.map(cloneStore),
    importOptions: data.importOptions.map((item) => ({ ...item })),
    pagination: data.pagination,
    emptyMessage,
  }
}

function filterStores(stores: CampInfoStore[], query: CampInfoQuery) {
  if (!query.keyword) return stores
  return stores.filter((item) => `${item.name}${item.address}${item.tagLine}`.includes(query.keyword))
}

function adaptApiStore(value: unknown, query: CampInfoQuery): CampInfoStore | null {
  const record = readRecord(value)
  const rawName =
    readString(record?.name) ||
    readString(record?.campName) ||
    readString(record?.poiName) ||
    readString(record?.title)
  if (!rawName) return null
  const store: CampInfoStore = {
    id: readString(record?.campId) ?? readString(record?.poiId) ?? storeSeed.id,
    campId: readString(record?.campId) ?? storeSeed.campId,
    name: rawName,
    typeLabel: readString(record?.typeName) ?? readString(record?.campTypeName) ?? storeSeed.typeLabel,
    coverLabel: '门店图片预览',
    address: readString(record?.address) ?? readString(record?.fullAddress) ?? storeSeed.address,
    cityLabel: readString(record?.cityName) ?? storeSeed.cityLabel,
    phone: readString(record?.phone) ?? readString(record?.mobile) ?? storeSeed.phone,
    tagLine: readString(record?.tags) ?? storeSeed.tagLine,
    listedRoomTypeCount: readNumber(record?.roomTypeCount) ?? storeSeed.listedRoomTypeCount,
    roomTypes: storeSeed.roomTypes.map((item) => ({ ...item })),
  }
  if (!filterStores([store], query).length) return null
  return store
}

async function postHudson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<ApiPayload> {
  const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  })

  const payload = (await readJson(response)) ?? {}
  if (!response.ok) {
    throw new CampInfoRequestError(`${endpoint} 返回 HTTP ${response.status}`)
  }

  if (payload.code !== undefined && payload.code !== 0) {
    throw new CampInfoRequestError(payload.message ?? '门店信息接口返回业务错误')
  }
  if (payload.success === false) {
    throw new CampInfoRequestError(payload.errorMsg ?? payload.errorCode ?? '门店信息接口返回业务错误')
  }

  return payload
}

async function readJson(response: Response): Promise<ApiPayload | null> {
  try {
    return (await response.json()) as ApiPayload
  } catch {
    return null
  }
}

async function waitForMockLatency() {
  const latencyMs = resolveMockLatencyMs()
  if (latencyMs <= 0) return
  await new Promise((resolve) => window.setTimeout(resolve, latencyMs))
}

function createMockEnvelope<T>(traceId: string, data: T): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId,
    timestamp: MOCK_TIMESTAMP,
  }
}

function unwrapEnvelope<T>(envelope: ApiEnvelope<T>) {
  if (envelope.code !== 0) {
    throw new CampInfoRequestError(`${envelope.message}（traceId: ${envelope.traceId}）`)
  }
  return envelope.data
}

function readCampId(value: unknown) {
  const record = readRecord(value)
  const camps = Array.isArray(record?.camps) ? record.camps : Array.isArray((value as { camps?: unknown })?.camps) ? (value as { camps: unknown[] }).camps : []
  const firstCamp = camps.map(readRecord).find((item) => readString(item?.campId))
  const campId = readString(firstCamp?.campId)
  if (!campId) throw new CampInfoRequestError('/camps/get 未返回可用 campId')
  return campId
}

function resolveProvider(): CampInfoProviderName {
  const configured = readRuntimeConfig(CAMP_INFO_PROVIDER_KEY) || import.meta.env.VITE_CAMP_INFO_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function resolveMockMode(): CampInfoMockMode {
  const configured = readRuntimeConfig(CAMP_INFO_MOCK_MODE_KEY) || import.meta.env.VITE_CAMP_INFO_MOCK_MODE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function resolveMockLatencyMs() {
  const configured = readRuntimeConfig(CAMP_INFO_MOCK_LATENCY_KEY)
  const value = Number(configured)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function readRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function readString(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  return String(value)
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function cloneStore(store: CampInfoStore): CampInfoStore {
  return {
    ...store,
    roomTypes: store.roomTypes.map((item) => ({ ...item })),
  }
}
