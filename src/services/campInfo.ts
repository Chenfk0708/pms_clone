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
  imageUrl?: string
  roomCount: number
  roomLabel: string
}

export type CampInfoStore = {
  id: string
  campId: string
  name: string
  typeLabel: string
  coverLabel: string
  coverImageDataUrl?: string
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
  plainIntro: string
  richIntro: string
  mapCopyright: string
}

export type CampInfoSaveInput = {
  storeId: string
  campId?: string
  poiId?: string
  campName: string
  name?: string
  typeName?: string
  campTypeName?: string
  phone?: string
  contactNumber?: string
  cityName?: string
  cityPath?: string
  address?: string
  streetAddress?: string
  communityName?: string
  unitNo?: string
  fullAddress?: string
  tags?: string[]
  plainIntro?: string
  richIntro?: string
  coverImageDataUrl?: string
  photoCount?: number
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
const CAMP_INFO_MOCK_EDITED_STORES_KEY = 'pms.campInfoEditedStores'
const CAMP_INFO_POI_ENDPOINT = '/select/poi/page/get'
const CAMP_INFO_ROOM_CATEGORY_ENDPOINT = '/roomCategories/page/get'
const CAMP_INFO_ROOMS_ENDPOINT = '/rooms/get'
const NEW_STORE_ID_PREFIX = 'new-camp-info-store-'

type CampInfoMockStoreOverride = Partial<
  Pick<CampInfoStore, 'id' | 'campId' | 'name' | 'typeLabel' | 'address' | 'cityLabel' | 'phone' | 'tagLine' | 'listedRoomTypeCount'>
> & {
  streetAddress?: string
  communityName?: string
  unitNo?: string
  fullAddress?: string
  plainIntro?: string
  richIntro?: string
  coverImageDataUrl?: string
  photoCount?: number
}

export const campInfoObservedEndpoints = [
  '/camps/get',
  CAMP_INFO_POI_ENDPOINT,
  '/camp/get',
  CAMP_INFO_ROOM_CATEGORY_ENDPOINT,
  CAMP_INFO_ROOMS_ENDPOINT,
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
  const store = resolveMockStore(storeId)
  if (!store) throw new CampInfoRequestError('未找到门店详情')
  const override = readMockStoreOverride(store.id)
  return {
    provider: 'mock',
    endpoint: 'camp-info-detail-mock-provider',
    traceId: 'mock-shezhi--xinxi-weihu--mendian-xinxi-detail-001',
    timestamp: MOCK_TIMESTAMP,
    store,
    albumImageCount: 9,
    cityPath: override?.cityLabel ?? store.cityLabel,
    streetAddress: override?.streetAddress ?? '深圳宝安区新安街道海裕社区N15幸福海岸花园',
    communityName: override?.communityName ?? '幸福海岸花园',
    unitNo: override?.unitNo ?? '10栋30楼',
    fullAddress: override?.fullAddress ?? store.address,
    plainIntro: override?.plainIntro ?? '',
    richIntro: override?.richIntro ?? '',
    mapCopyright: '© 2026 AutoNavi - GS(2023)4677号',
  }
}

export async function fetchCampInfoSortData(
  activeTab: CampInfoSortTab,
  signal?: AbortSignal,
): Promise<CampInfoSortData> {
  const provider = resolveProvider()
  let apiOverview: CampInfoOverview | null = null
  if (provider === 'api') {
    apiOverview = await fetchCampInfoOverview(DEFAULT_QUERY, signal)
  } else {
    await waitForMockLatency()
    if (resolveMockMode() === 'error') {
      throw new CampInfoRequestError('门店排序加载失败')
    }
  }

  return {
    provider,
    endpoint: provider === 'mock' ? 'camp-info-sort-mock-provider' : `${HUDSON_BASE_URL}${CAMP_INFO_POI_ENDPOINT}`,
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
        ? provider === 'api'
          ? (apiOverview?.stores ?? []).map((item) => ({ id: item.id, label: item.name }))
          : readMockStores().map((item) => ({ id: item.id, label: item.name }))
        : activeTab === 'roomType'
          ? provider === 'api'
            ? (apiOverview?.stores[0]?.roomTypes ?? []).map((item) => ({ id: item.id, label: item.name }))
            : storeSeed.roomTypes.map((item) => ({ id: item.id, label: item.name }))
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

export async function saveCampInfoDetail(input: CampInfoSaveInput, signal?: AbortSignal): Promise<CampInfoDetail> {
  if (resolveProvider() === 'api') {
    const campId = await resolveApiCampId(input.campId, input.storeId, signal)
    const payload = await postHudson('/camp/save', buildSavePayload({ ...input, campId }), signal)
    const rawStore = payload?.data ?? payload
    const source = readApiStoreSource(rawStore)
    const savedCampId = readString(source?.campId) ?? campId
    const savedStoreId = readString(source?.poiId) ?? readString(source?.id) ?? input.storeId
    const roomTypes = await fetchApiRoomTypes(savedCampId, savedStoreId, signal)
    const store = adaptApiStore({ ...readRecord(rawStore), campId: savedCampId }, DEFAULT_QUERY, roomTypes)
    if (!store) throw new CampInfoRequestError('/camp/save 未返回门店详情')
    return buildApiDetail(payload, rawStore, store, `${HUDSON_BASE_URL}/camp/save`, `api-shezhi--xinxi-weihu--mendian-xinxi-save-${input.storeId}`)
  }

  await waitForMockLatency()
  if (resolveMockMode() === 'error') {
    throw new CampInfoRequestError('门店信息保存失败')
  }
  const store = saveMockStoreOverride(input)
  return {
    provider: 'mock',
    endpoint: 'camp-info-save-mock-provider',
    traceId: `mock-shezhi--xinxi-weihu--mendian-xinxi-save-${input.storeId}`,
    timestamp: new Date().toISOString(),
    store,
    albumImageCount: input.photoCount ?? 0,
    cityPath: input.cityPath ?? input.cityName ?? store.cityLabel,
    streetAddress: input.streetAddress ?? store.address,
    communityName: input.communityName ?? '',
    unitNo: input.unitNo ?? '',
    fullAddress: input.fullAddress ?? input.address ?? store.address,
    plainIntro: input.plainIntro ?? '',
    richIntro: input.richIntro ?? '',
    mapCopyright: '© 2026 AutoNavi - GS(2023)4677号',
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

  const allStores = mode === 'empty' ? [] : readMockStores()
  const stores = filterStores(allStores, query)
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
        activeStoreText: `${allStores.length}/1`,
        effectivePeriod: '2025.09.28 至 2027.09.28',
        total: allStores.length,
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
  const [poiPayload, resourcePayload] = await Promise.all([
    postHudson(
      CAMP_INFO_POI_ENDPOINT,
      { campId, pageSize: query.pageSize, pageNum: query.page, isAvailability: '1' },
      signal,
    ),
    postHudson('/edition/resource/get', { campId }, signal),
  ])

  const poiData = poiPayload?.data ?? poiPayload
  const poiItems = readApiPoiItems(poiData)
  const stores = (
    await Promise.all(
      poiItems.map(async (item) => {
        const poiId = readApiPoiId(item)
        const roomTypes = await fetchApiRoomTypes(campId, poiId, signal)
        return adaptApiStore({ campId, ...item }, query, roomTypes)
      }),
    )
  ).filter((item): item is CampInfoStore => Boolean(item))
  const total = readApiTotal(poiData, poiItems.length)
  const page = readApiPage(poiData) ?? query.page
  const pageSize = readApiPageSize(poiData) ?? query.pageSize
  return {
    provider: 'api',
    state: stores.length > 0 ? 'success' : 'empty',
    endpoint: `${HUDSON_BASE_URL}${CAMP_INFO_POI_ENDPOINT}`,
    traceId: readString(poiPayload?.traceId) ?? `api-shezhi--xinxi-weihu--mendian-xinxi-${campId}`,
    timestamp: readString(poiPayload?.timestamp) ?? new Date().toISOString(),
    request: query,
    observedEndpoints: [...campInfoObservedEndpoints],
    summary: {
      activeStoreText: `${total}/${Math.max(total, 1)}`,
      effectivePeriod: readString((resourcePayload?.data as Record<string, unknown> | undefined)?.expireDateRange) ?? '待接口补齐',
      total,
      limit: Math.max(total, 1),
    },
    stores,
    importOptions,
    pagination: {
      page,
      pageSize,
      total,
    },
    emptyMessage: poiItems.length > 0 ? '暂无符合条件的门店' : '暂无已创建的门店',
  }
}

async function fetchApiDetail(storeId: string, signal?: AbortSignal): Promise<CampInfoDetail> {
  const campId = await fetchApiCampId(signal)
  const payload = await postHudson('/camp/get', { campId, storeId, poiId: storeId }, signal)
  const rawStore = payload?.data ?? payload
  const source = readApiStoreSource(rawStore)
  const roomTypes = await fetchApiRoomTypes(readString(source?.campId) ?? campId, readString(source?.poiId) ?? storeId, signal)
  const store = adaptApiStore({ ...readRecord(rawStore), campId }, DEFAULT_QUERY, roomTypes)
  if (!store) throw new CampInfoRequestError('/camp/get 未返回门店详情')
  return buildApiDetail(payload, rawStore, store, `${HUDSON_BASE_URL}/camp/get`, `api-shezhi--xinxi-weihu--mendian-xinxi-detail-${storeId}`)
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
    endpoint: provider === 'mock' ? 'camp-info-mock-provider' : `${HUDSON_BASE_URL}${CAMP_INFO_POI_ENDPOINT}`,
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

async function fetchApiRoomTypes(campId: string, poiId?: string, signal?: AbortSignal): Promise<CampInfoRoomType[]> {
  const roomCategoryPayload = await postHudson(
    CAMP_INFO_ROOM_CATEGORY_ENDPOINT,
    {
      campId,
      ...(poiId ? { poiId } : {}),
      pageSize: 999,
      pageNum: 1,
      roomCategoryName: '',
      keyword: '',
      cityIds: [],
      channelId: '',
    },
    signal,
  )
  const roomTypes = readApiRoomCategoryItems(roomCategoryPayload?.data ?? roomCategoryPayload)
    .map(adaptApiRoomTypeDraft)
    .filter((item): item is CampInfoRoomType & { inlineRoomNames: string[] } => Boolean(item))
  const roomCategoryIds = roomTypes.map((item) => item.id)
  if (roomCategoryIds.length === 0) return []

  const roomsPayload = await postHudson(CAMP_INFO_ROOMS_ENDPOINT, { campId, roomCategoryIds }, signal)
  const roomsByCategory = readApiRoomsByCategory(roomsPayload?.data ?? roomsPayload)
  return roomTypes.map(({ inlineRoomNames, ...roomType }) => {
    const roomNames = roomsByCategory.get(roomType.id) ?? inlineRoomNames
    return {
      ...roomType,
      roomCount: roomNames.length > 0 ? roomNames.length : roomType.roomCount,
      roomLabel: buildRoomLabel(roomNames, roomType.roomLabel),
    }
  })
}

function readApiRoomCategoryItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(readRecord).filter((item): item is Record<string, unknown> => Boolean(item))
  const record = readRecord(value)
  const nestedData = readRecord(record?.data)
  const list = Array.isArray(record?.list) ? record.list : Array.isArray(nestedData?.list) ? nestedData.list : []
  return list.map(readRecord).filter((item): item is Record<string, unknown> => Boolean(item))
}

function adaptApiRoomTypeDraft(
  value: Record<string, unknown>,
  index: number,
): (CampInfoRoomType & { inlineRoomNames: string[] }) | null {
  const id = readString(value.roomCategoryId) ?? readString(value.id)
  const name = readString(value.roomCategoryName) ?? readString(value.name) ?? readString(value.displayName)
  if (!id || !name) return null

  const inlineRoomNames = readRoomNames(value)
  const fallbackRoomLabel = readString(value.roomNames) ?? readString(value.roomLabel) ?? ''
  return {
    id,
    name,
    imageKey: `api-${index % 4}`,
    imageUrl:
      readString(value.mainPhotoMediaUrl) ??
      readString(value.mainPhotoUrl) ??
      readString(value.mainPhoto) ??
      undefined,
    roomCount: readNumber(value.roomNum) ?? readNumber(value.roomCount) ?? inlineRoomNames.length,
    roomLabel: buildRoomLabel(inlineRoomNames, fallbackRoomLabel),
    inlineRoomNames,
  }
}

function readApiRoomsByCategory(value: unknown): Map<string, string[]> {
  const record = readRecord(value)
  const nestedData = readRecord(record?.data)
  const groups = Array.isArray(record?.roomCategoryRooms)
    ? record.roomCategoryRooms
    : Array.isArray(nestedData?.roomCategoryRooms)
      ? nestedData.roomCategoryRooms
      : Array.isArray(value)
        ? value
        : []

  const roomsByCategory = new Map<string, string[]>()
  for (const group of groups) {
    const groupRecord = readRecord(group)
    if (!groupRecord) continue
    const categoryId = readString(groupRecord.roomCategoryId) ?? readString(groupRecord.id)
    if (!categoryId) continue
    roomsByCategory.set(categoryId, readRoomNames(groupRecord))
  }
  return roomsByCategory
}

function readRoomNames(value: Record<string, unknown>): string[] {
  const explicitNames = parseDelimitedNames(readString(value.roomNames))
  const roomRows = Array.isArray(value.rooms) ? value.rooms : Array.isArray(value.roomViews) ? value.roomViews : []
  const rowNames = roomRows
    .map(readRecord)
    .map((item) =>
      item
        ? readString(item.roomName) ??
          readString(item.name) ??
          readString(item.roomNo) ??
          readString(item.roomNumber) ??
          readString(item.roomId)
        : null,
    )
    .filter((item): item is string => Boolean(item))
  return uniqueStrings([...explicitNames, ...rowNames])
}

function parseDelimitedNames(value: string | null): string[] {
  if (!value) return []
  return uniqueStrings(value.split(/[,，、/]+/).map((item) => item.trim()))
}

function buildRoomLabel(roomNames: string[], fallback: string) {
  const names = uniqueStrings(roomNames)
  if (names.length > 0) return names.join(', ')
  return fallback.trim() || '暂无房间'
}

function uniqueStrings(values: string[]): string[] {
  return values.map((item) => item.trim()).filter(Boolean).filter((item, index, list) => list.indexOf(item) === index)
}

function adaptApiStore(value: unknown, query: CampInfoQuery, roomTypes?: CampInfoRoomType[]): CampInfoStore | null {
  const source = readApiStoreSource(value)
  const rawName =
    readString(source?.poiName) ||
    readString(source?.name) ||
    readString(source?.campName) ||
    readString(source?.title)
  if (!rawName) return null
  const tagLine = buildTagLine(source?.tags) || buildTagLine(source?.tagsJson) || readString(source?.tagLine) || ''
  const hasRealRoomTypes = Array.isArray(roomTypes)
  const store: CampInfoStore = {
    id: readString(source?.poiId) ?? readString(source?.id) ?? readString(source?.value) ?? readString(source?.campId) ?? storeSeed.id,
    campId: readString(source?.campId) ?? storeSeed.campId,
    name: rawName,
    typeLabel: readString(source?.typeName) ?? readString(source?.campTypeName) ?? readString(source?.poiType) ?? '',
    coverLabel: '门店图片预览',
    coverImageDataUrl: readString(source?.coverImageDataUrl) ?? undefined,
    address: readString(source?.fullAddress) ?? readString(source?.address) ?? readString(source?.streetAddress) ?? '',
    cityLabel: readString(source?.cityPath) ?? readString(source?.cityName) ?? '',
    phone:
      readString(source?.contactNumber) ??
      readString(source?.phone) ??
      readString(source?.mobile) ??
      '',
    tagLine,
    listedRoomTypeCount: hasRealRoomTypes
      ? roomTypes.length
      : readNumber(source?.roomTypeCount) ?? readNumber(source?.listedRoomTypeCount) ?? 0,
    roomTypes: hasRealRoomTypes ? roomTypes.map((item) => ({ ...item })) : [],
  }
  if (!filterStores([store], query).length) return null
  return store
}

async function postHudson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<ApiPayload> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  const token = readRuntimeConfig('pms_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
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

async function fetchApiCampId(signal?: AbortSignal) {
  const campPayload = await postHudson('/camps/get', {}, signal)
  return readCampId(campPayload?.data ?? campPayload)
}

async function resolveApiCampId(campId: string | undefined, storeId: string, signal?: AbortSignal) {
  const normalizedCampId = campId?.trim()
  if (normalizedCampId && normalizedCampId !== storeId && !normalizedCampId.startsWith(NEW_STORE_ID_PREFIX)) {
    return normalizedCampId
  }
  return fetchApiCampId(signal)
}

function readApiStoreSource(value: unknown): Record<string, unknown> {
  const record = readRecord(value) ?? {}
  const dataRecord = readRecord(record.data)
  const sourceRecord = dataRecord ?? record
  const campRecord = readRecord(sourceRecord.camp)
  return campRecord ? { ...campRecord, ...sourceRecord } : sourceRecord
}

function buildApiDetail(
  payload: ApiPayload,
  rawStore: unknown,
  store: CampInfoStore,
  endpoint: string,
  fallbackTraceId: string,
): CampInfoDetail {
  const source = readApiStoreSource(rawStore)
  const photoCount = readNumber(source.photoCount) ?? (store.coverImageDataUrl ? 1 : 0)
  return {
    provider: 'api',
    endpoint,
    traceId: readString(payload?.traceId) ?? fallbackTraceId,
    timestamp: readString(payload?.timestamp) ?? new Date().toISOString(),
    store,
    albumImageCount: photoCount,
    cityPath: readString(source.cityPath) ?? readString(source.cityName) ?? store.cityLabel,
    streetAddress: readString(source.streetAddress) ?? store.address,
    communityName: readString(source.communityName) ?? '',
    unitNo: readString(source.unitNo) ?? '',
    fullAddress: readString(source.fullAddress) ?? readString(source.address) ?? store.address,
    plainIntro: readString(source.plainIntro) ?? '',
    richIntro: readString(source.richIntro) ?? '',
    mapCopyright: '© 2026 AutoNavi - GS(2023)4677号',
  }
}

function readApiPoiItems(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.map(readRecord).filter((item): item is Record<string, unknown> => Boolean(item))
  const record = readRecord(value)
  const nestedData = readRecord(record?.data)
  const list = Array.isArray(record?.list) ? record.list : Array.isArray(nestedData?.list) ? nestedData.list : []
  return list.map(readRecord).filter((item): item is Record<string, unknown> => Boolean(item))
}

function readApiPoiId(value: Record<string, unknown>) {
  return readString(value.poiId) ?? readString(value.id) ?? readString(value.value) ?? undefined
}

function readApiTotal(value: unknown, fallback: number) {
  const record = readRecord(value)
  const nestedData = readRecord(record?.data)
  return readNumber(record?.total) ?? readNumber(nestedData?.total) ?? fallback
}

function readApiPage(value: unknown) {
  const record = readRecord(value)
  const nestedData = readRecord(record?.data)
  return readNumber(record?.pageNum) ?? readNumber(record?.current) ?? readNumber(nestedData?.pageNum) ?? readNumber(nestedData?.current)
}

function readApiPageSize(value: unknown) {
  const record = readRecord(value)
  const nestedData = readRecord(record?.data)
  return readNumber(record?.pageSize) ?? readNumber(record?.size) ?? readNumber(nestedData?.pageSize) ?? readNumber(nestedData?.size)
}

function buildSavePayload(input: CampInfoSaveInput): Record<string, unknown> {
  const campId = input.campId ?? input.storeId
  const name = input.name ?? input.campName
  const phone = input.phone ?? input.contactNumber ?? ''
  const cityName = input.cityName ?? input.cityPath ?? ''
  const address = input.address ?? input.fullAddress ?? input.streetAddress ?? ''
  const fullAddress = input.fullAddress ?? input.address ?? input.streetAddress ?? ''
  return {
    campId,
    storeId: input.storeId,
    poiId: input.poiId,
    campName: input.campName,
    name,
    typeName: input.typeName ?? input.campTypeName ?? '',
    campTypeName: input.campTypeName ?? input.typeName ?? '',
    phone,
    contactNumber: input.contactNumber ?? phone,
    cityName,
    cityPath: input.cityPath ?? cityName,
    address,
    streetAddress: input.streetAddress ?? address,
    communityName: input.communityName ?? '',
    unitNo: input.unitNo ?? '',
    fullAddress,
    tags: normalizeTagList(input.tags),
    plainIntro: input.plainIntro ?? '',
    richIntro: input.richIntro ?? '',
    coverImageDataUrl: input.coverImageDataUrl ?? '',
    photoCount: input.photoCount ?? 0,
  }
}

function resolveMockStore(storeId: string): CampInfoStore | null {
  return readMockStores().find((item) => item.id === storeId || item.campId === storeId) ?? null
}

function readMockStores(): CampInfoStore[] {
  const overrides = readMockStoreOverrides()
  const stores = new Map<string, CampInfoStore>()
  stores.set(storeSeed.id, mergeMockStoreOverride(cloneStore(storeSeed), findSeedStoreOverride(overrides)))

  for (const [key, override] of Object.entries(overrides)) {
    if (isSeedStoreOverride(key, override)) continue
    const store = createMockStoreFromOverride(key, override)
    stores.set(store.id, store)
  }

  return Array.from(stores.values())
}

function saveMockStoreOverride(input: CampInfoSaveInput): CampInfoStore {
  const currentStore = resolveMockStore(input.storeId) ?? createMockStoreFromInput(input)
  const override: CampInfoMockStoreOverride = {
    id: currentStore.id,
    campId: input.campId ?? currentStore.campId,
    name: input.name ?? input.campName,
    typeLabel: input.typeName ?? input.campTypeName ?? currentStore.typeLabel,
    address: input.fullAddress ?? input.address ?? input.streetAddress ?? currentStore.address,
    cityLabel: input.cityPath ?? input.cityName ?? currentStore.cityLabel,
    phone: input.phone ?? input.contactNumber ?? currentStore.phone,
    tagLine: buildTagLine(input.tags) || currentStore.tagLine,
    streetAddress: input.streetAddress,
    communityName: input.communityName,
    unitNo: input.unitNo,
    fullAddress: input.fullAddress ?? input.address,
    plainIntro: input.plainIntro,
    richIntro: input.richIntro,
    coverImageDataUrl: input.coverImageDataUrl,
    photoCount: input.photoCount,
  }
  writeMockStoreOverride(currentStore.id, override)
  return mergeMockStoreOverride(currentStore, override)
}

function findSeedStoreOverride(overrides: Record<string, CampInfoMockStoreOverride>): CampInfoMockStoreOverride | undefined {
  return Object.entries(overrides).find(([key, override]) => isSeedStoreOverride(key, override))?.[1]
}

function isSeedStoreOverride(key: string, override: CampInfoMockStoreOverride) {
  return key === storeSeed.id || key === storeSeed.campId || override.id === storeSeed.id || override.campId === storeSeed.campId
}

function createMockStoreFromInput(input: CampInfoSaveInput): CampInfoStore {
  return {
    id: input.storeId,
    campId: input.campId ?? input.storeId,
    name: input.name ?? input.campName,
    typeLabel: input.typeName ?? input.campTypeName ?? '',
    coverLabel: '门店图片预览',
    address: input.fullAddress ?? input.address ?? input.streetAddress ?? '',
    cityLabel: input.cityPath ?? input.cityName ?? '',
    phone: input.phone ?? input.contactNumber ?? '',
    tagLine: buildTagLine(input.tags),
    listedRoomTypeCount: 0,
    roomTypes: [],
  }
}

function createMockStoreFromOverride(key: string, override: CampInfoMockStoreOverride): CampInfoStore {
  const id = override.id ?? key
  return mergeMockStoreOverride(
    {
      id,
      campId: override.campId ?? id,
      name: override.name ?? '',
      typeLabel: override.typeLabel ?? '',
      coverLabel: '门店图片预览',
      address: override.address ?? override.fullAddress ?? '',
      cityLabel: override.cityLabel ?? '',
      phone: override.phone ?? '',
      tagLine: override.tagLine ?? '',
      listedRoomTypeCount: override.listedRoomTypeCount ?? 0,
      roomTypes: [],
    },
    override,
  )
}

function readMockStoreOverride(storeId: string): CampInfoMockStoreOverride | null {
  const override = readMockStoreOverrides()[storeId]
  return override ? { ...override } : null
}

function readMockStoreOverrides(): Record<string, CampInfoMockStoreOverride> {
  if (typeof window === 'undefined') return {}
  const rawValue = window.localStorage.getItem(CAMP_INFO_MOCK_EDITED_STORES_KEY)
  if (!rawValue) return {}
  try {
    const parsedValue = JSON.parse(rawValue)
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) return {}
    return Object.fromEntries(
      Object.entries(parsedValue)
        .map(([key, value]) => [key, normalizeMockStoreOverride(value)])
        .filter((entry): entry is [string, CampInfoMockStoreOverride] => Boolean(entry[1])),
    )
  } catch {
    return {}
  }
}

function writeMockStoreOverride(storeId: string, override: CampInfoMockStoreOverride) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    CAMP_INFO_MOCK_EDITED_STORES_KEY,
    JSON.stringify({
      ...readMockStoreOverrides(),
      [storeId]: override,
    }),
  )
}

function normalizeMockStoreOverride(value: unknown): CampInfoMockStoreOverride | null {
  const record = readRecord(value)
  if (!record) return null
  return {
    id: readString(record.id) ?? undefined,
    campId: readString(record.campId) ?? undefined,
    name: readString(record.name) ?? undefined,
    typeLabel: readString(record.typeLabel) ?? undefined,
    address: readString(record.address) ?? undefined,
    cityLabel: readString(record.cityLabel) ?? undefined,
    phone: readString(record.phone) ?? undefined,
    tagLine: readString(record.tagLine) ?? undefined,
    listedRoomTypeCount: readNumber(record.listedRoomTypeCount) ?? undefined,
    streetAddress: readString(record.streetAddress) ?? undefined,
    communityName: readString(record.communityName) ?? undefined,
    unitNo: readString(record.unitNo) ?? undefined,
    fullAddress: readString(record.fullAddress) ?? undefined,
    plainIntro: readString(record.plainIntro) ?? undefined,
    richIntro: readString(record.richIntro) ?? undefined,
    coverImageDataUrl: readString(record.coverImageDataUrl) ?? undefined,
    photoCount: readNumber(record.photoCount) ?? undefined,
  }
}

function mergeMockStoreOverride(store: CampInfoStore, override?: CampInfoMockStoreOverride): CampInfoStore {
  if (!override) return store
  return {
    ...store,
    ...override,
    id: override.id ?? store.id,
    campId: override.campId ?? store.campId,
    coverLabel: store.coverLabel,
    listedRoomTypeCount: override.listedRoomTypeCount ?? store.listedRoomTypeCount,
    roomTypes: store.roomTypes.map((item) => ({ ...item })),
  }
}

function buildTagLine(value: unknown): string {
  return normalizeTagList(value).join(' / ')
}

function normalizeTagList(value: unknown): string[] {
  const rawTags = Array.isArray(value) ? value : parseTagString(readString(value))
  return rawTags.map((item) => String(item).trim()).filter(Boolean).filter((item, index, list) => list.indexOf(item) === index)
}

function parseTagString(value: string | null): string[] {
  if (!value) return []
  try {
    const parsedValue = JSON.parse(value)
    if (Array.isArray(parsedValue)) return parsedValue.map(String)
  } catch {
    // Non-JSON tag strings are split below.
  }
  return value.split(/[\/,，、]/)
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
