export type HotelProductProviderName = 'mock' | 'real'
type HotelProductMockMode = 'success' | 'empty' | 'error'

export type HotelProductOption = {
  id: string
  name: string
}

export type HotelProductListQuery = {
  keyword?: string
  roomCategoryId?: string
  channelId?: string
  page?: number
  pageSize?: number
}

export type HotelProductListItem = {
  id: string
  title: string
  roomCategoryName: string
  channelName: string
  stock: number
  salePrice: number
  extraPrice: number
  createdAt: string
  updatedAt: string
  status: 'onSale' | 'draft' | 'paused'
  reservationPhone: string
  reservationNote: string
}

export type HotelProductData = {
  provider: HotelProductProviderName
  campId: string
  campName: string
  roomTypes: HotelProductOption[]
  channels: HotelProductOption[]
  list: HotelProductListItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  requestedAt: string
  requestSummary: string[]
}

type HotelProductEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HotelProductEnvelopeData = {
  camp: {
    campId: string
    campName: string
  }
  filters: {
    roomTypes: HotelProductOption[]
    channels: HotelProductOption[]
  }
  products: {
    list: HotelProductListItem[]
    pagination: {
      page: number
      pageSize: number
      total: number
    }
  }
}

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorCode?: string | null
}

const realBaseUrl = '/api'
const productListEndpoint = '/roomCategoryProducts/page/get'

const mockRoomTypes: HotelProductOption[] = [
  { id: 'room-mock-1', name: '顶层套房（浴缸巨幕电竞麻将）' },
  { id: 'room-mock-2', name: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { id: 'room-mock-3', name: '天落大床电竞套间' },
  { id: 'room-mock-4', name: '观影大床房' },
]

const mockChannels: HotelProductOption[] = [
  { id: '4', name: '携程' },
  { id: '5', name: '美团酒店' },
  { id: '6', name: '飞猪淘酒店' },
  { id: '7', name: '美团民宿' },
  { id: '2', name: '途家' },
  { id: '8', name: '木鸟' },
  { id: '9', name: '小猪' },
  { id: '10', name: '路客云聚合' },
]

const mockProducts: HotelProductListItem[] = [
  {
    id: 'hotel-product-001',
    title: '电竞欢聚双晚套餐',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    channelName: '携程',
    stock: 18,
    salePrice: 699,
    extraPrice: 88,
    createdAt: '2026-05-12 10:20',
    updatedAt: '2026-05-18 09:40',
    status: 'onSale',
    reservationPhone: '0755-88990011',
    reservationNote: '适用于周日至周四入住，节假日需提前确认库存。',
  },
  {
    id: 'hotel-product-002',
    title: '影音大床工作日套餐',
    roomCategoryName: '观影大床房',
    channelName: '美团酒店',
    stock: 12,
    salePrice: 399,
    extraPrice: 0,
    createdAt: '2026-05-10 14:12',
    updatedAt: '2026-05-18 08:25',
    status: 'onSale',
    reservationPhone: '0755-88990022',
    reservationNote: '可预约未来 30 天房量，需在入住前 1 天确认。',
  },
  {
    id: 'hotel-product-003',
    title: '总裁套间周末升级套餐',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    channelName: '途家',
    stock: 6,
    salePrice: 899,
    extraPrice: 120,
    createdAt: '2026-05-08 18:30',
    updatedAt: '2026-05-17 22:10',
    status: 'paused',
    reservationPhone: '0755-88990033',
    reservationNote: '周末库存紧张时需要人工确认后生效。',
  },
]

export async function loadHotelProductData(query: HotelProductListQuery = {}, signal?: AbortSignal): Promise<HotelProductData> {
  if (resolveProvider() === 'real') {
    return loadRealHotelProductData(query, signal)
  }

  await waitForMockLatency(signal)
  const envelope = buildMockEnvelope(query)
  if (envelope.code !== 0) {
    throw new Error('酒店套餐服务暂不可用，请稍后重试')
  }

  return adaptEnvelope(envelope, query, 'mock')
}

export function getHotelProductProviderName(): HotelProductProviderName {
  return resolveProvider()
}

function resolveProvider(): HotelProductProviderName {
  const configured = readRuntimeConfig('pms.hotelProductProvider') || import.meta.env.VITE_HOTEL_PRODUCT_PROVIDER
  return configured === 'real' ? 'real' : 'mock'
}

function resolveMockMode(): HotelProductMockMode {
  const configured = readRuntimeConfig('pms.hotelProductMockMode') || import.meta.env.VITE_HOTEL_PRODUCT_MOCK_MODE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 80)
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

function buildMockEnvelope(query: HotelProductListQuery): HotelProductEnvelope<HotelProductEnvelopeData | null> {
  const mode = resolveMockMode()
  if (mode === 'error') {
    return {
      code: 50018,
      message: 'hotel product service failed',
      data: null,
      traceId: 'mock-shoumai-chanpin--yushouquan--jiudian-taocan-error-001',
      timestamp: '2026-05-18T10:00:00+08:00',
    }
  }

  const list = mode === 'empty' ? [] : filterProducts(mockProducts, query)
  return {
    code: 0,
    message: 'success',
    data: {
      camp: {
        campId: 'camp-mock-hotel-product',
        campName: '路客云6TS5的店铺',
      },
      filters: {
        roomTypes: mockRoomTypes,
        channels: mockChannels,
      },
      products: {
        list,
        pagination: {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 20,
          total: list.length,
        },
      },
    },
    traceId:
      mode === 'empty'
        ? 'mock-shoumai-chanpin--yushouquan--jiudian-taocan-empty-001'
        : 'mock-shoumai-chanpin--yushouquan--jiudian-taocan-list-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function filterProducts(products: HotelProductListItem[], query: HotelProductListQuery) {
  const keyword = query.keyword?.trim()
  return products.filter((item) => {
    const roomType = mockRoomTypes.find((option) => option.id === query.roomCategoryId)?.name
    const channel = mockChannels.find((option) => option.id === query.channelId)?.name
    if (keyword && !item.title.includes(keyword)) return false
    if (roomType && item.roomCategoryName !== roomType) return false
    if (channel && item.channelName !== channel) return false
    return true
  })
}

function adaptEnvelope(
  envelope: HotelProductEnvelope<HotelProductEnvelopeData | null>,
  query: HotelProductListQuery,
  provider: HotelProductProviderName,
): HotelProductData {
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.message || '酒店套餐服务暂不可用，请稍后重试')
  }

  return {
    provider,
    campId: envelope.data.camp.campId,
    campName: envelope.data.camp.campName,
    roomTypes: envelope.data.filters.roomTypes,
    channels: envelope.data.filters.channels,
    list: envelope.data.products.list,
    pagination: envelope.data.products.pagination,
    requestedAt: envelope.timestamp,
    requestSummary: buildRequestSummary(query, envelope.traceId),
  }
}

async function loadRealHotelProductData(query: HotelProductListQuery, signal?: AbortSignal): Promise<HotelProductData> {
  const camp = readCamp(await postHudson('/camps/get', {}, signal))
  const [roomData, channelData, productData] = await Promise.all([
    postHudson('/roomCategories/page/get', {
      campId: camp.campId,
      pageNum: 1,
      pageSize: 999,
      roomCategoryName: '',
      keyword: '',
      cityIds: [],
      channelId: '',
    }, signal),
    postHudson('/select/calChannel4RoomCategory/get', { campId: camp.campId }, signal),
    postHudson(productListEndpoint, createRealListRequest(camp.campId, query), signal),
  ])

  const roomTypes = adaptOptions(roomData, 'room')
  const channels = adaptOptions(channelData, 'channel')
  const list = adaptRealProducts(productData)

  return {
    provider: 'real',
    campId: camp.campId,
    campName: camp.campName,
    roomTypes,
    channels,
    list,
    pagination: {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      total: readPaginationTotal(productData, list.length),
    },
    requestedAt: new Date().toISOString(),
    requestSummary: buildRequestSummary(query, 'real-hudson-request'),
  }
}

function createRealListRequest(campId: string, query: HotelProductListQuery): Record<string, unknown> {
  return {
    campId,
    keyword: query.keyword?.trim() ?? '',
    roomCategoryId: query.roomCategoryId || '',
    channelId: query.channelId || '',
    pageNum: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${realBaseUrl}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

function readCamp(data: unknown) {
  const camps = asArray(asRecord(data).camps).map(asRecord)
  const camp = camps.find((item) => item.campId)
  if (!camp?.campId) throw new Error('/camps/get 未返回可用门店')
  return {
    campId: String(camp.campId),
    campName: String(camp.name ?? '当前门店'),
  }
}

function adaptOptions(data: unknown, kind: 'room' | 'channel'): HotelProductOption[] {
  const record = asRecord(data)
  const source = Array.isArray(record.select) ? record.select : Array.isArray(record.list) ? record.list : []
  return source.map(asRecord).map((item, index) => {
    if (kind === 'room') {
      return {
        id: String(item.roomCategoryId ?? item.id ?? index),
        name: String(item.roomCategoryName ?? item.name ?? `房型 ${index + 1}`),
      }
    }

    return {
      id: String(item.value ?? item.channelId ?? item.id ?? index),
      name: String(item.label ?? item.channelName ?? item.name ?? `渠道 ${index + 1}`),
    }
  })
}

function adaptRealProducts(data: unknown): HotelProductListItem[] {
  const record = asRecord(data)
  return asArray(record.list).map(asRecord).map((item, index) => ({
    id: String(item.productId ?? item.id ?? `real-product-${index}`),
    title: String(item.title ?? item.productName ?? item.roomCategoryProductName ?? `酒店套餐 ${index + 1}`),
    roomCategoryName: String(item.roomCategoryName ?? item.roomName ?? '未命名房型'),
    channelName: String(item.channelName ?? item.channel ?? '全部渠道'),
    stock: readNumber(item.stock ?? item.inventory, 0),
    salePrice: readNumber(item.salePrice ?? item.price, 0),
    extraPrice: readNumber(item.extraPrice ?? item.raisePrice, 0),
    createdAt: String(item.createdAt ?? item.createTime ?? ''),
    updatedAt: String(item.updatedAt ?? item.updateTime ?? ''),
    status: readStatus(item.status),
    reservationPhone: String(item.reservationPhone ?? item.phone ?? '0755-00000000'),
    reservationNote: String(item.reservationNote ?? item.note ?? '按当前套餐规则预约入住。'),
  }))
}

function readPaginationTotal(data: unknown, fallback: number) {
  const pagination = asRecord(asRecord(data).pagination)
  return readNumber(pagination.total ?? asRecord(data).total, fallback)
}

function readNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function readStatus(value: unknown): HotelProductListItem['status'] {
  if (value === 0 || value === 'draft') return 'draft'
  if (value === 2 || value === 'paused') return 'paused'
  return 'onSale'
}

function buildRequestSummary(query: HotelProductListQuery, traceId: string) {
  return [
    `traceId=${traceId}`,
    `keyword=${query.keyword?.trim() || '全部套餐'}`,
    `roomCategoryId=${query.roomCategoryId || '全部房型'}`,
    `channelId=${query.channelId || '全部渠道'}`,
    `page=${query.page ?? 1}`,
    `pageSize=${query.pageSize ?? 20}`,
  ]
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
