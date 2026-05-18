export type PriceComparisonProviderName = 'mock' | 'api'

export type PriceComparisonMockState = 'success' | 'empty' | 'error'

type ApiResponse<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

export type PriceComparisonFilters = {
  date: string
  storeId: string
  roomTypeId: string
  channelId: string
}

type PriceComparisonOption = {
  value: string
  label: string
}

type PriceComparisonMetricResponse = {
  id: string
  label: string
  value: string
  delta: string
  tone: 'primary' | 'green' | 'orange'
}

type PriceComparisonTrendResponse = {
  dateLabel: string
  ownPrice: number
  competitorPrice: number
  marketAverage: number
}

type PriceComparisonRoomResponse = {
  id: string
  roomType: string
  channel: string
  ownPrice: number
  competitorPrice: number
  marketAverage: number
  priceDiff: number
  occupancy: string
  suggestion: string
  status: 'advantage' | 'watch' | 'adjust'
}

type PriceComparisonTodoResponse = {
  id: string
  title: string
  due: string
  priority: '高' | '中' | '低'
}

type PriceComparisonQuickLinkResponse = {
  id: string
  label: string
  route: string
}

type PriceComparisonDashboardResponse = {
  filters: PriceComparisonFilters
  filterOptions: {
    stores: PriceComparisonOption[]
    roomTypes: PriceComparisonOption[]
    channels: PriceComparisonOption[]
  }
  metrics: PriceComparisonMetricResponse[]
  trend: PriceComparisonTrendResponse[]
  rooms: {
    list: PriceComparisonRoomResponse[]
    pagination: {
      page: number
      pageSize: number
      total: number
    }
  }
  todos: PriceComparisonTodoResponse[]
  quickLinks: PriceComparisonQuickLinkResponse[]
  updatedAt: string
}

export type PriceComparisonDashboard = PriceComparisonDashboardResponse & {
  provider: PriceComparisonProviderName
  traceId: string
  timestamp: string
}

export type PriceComparisonRequest = Partial<PriceComparisonFilters> & {
  mockState?: PriceComparisonMockState
  provider?: PriceComparisonProviderName
}

const taskId = 'fangtai--fangjia-guanli--jingzhengquan-bijia'
const fixedTimestamp = '2026-05-18T10:00:00+08:00'

const defaultFilters: PriceComparisonFilters = {
  date: '2026-05-18',
  storeId: 'qianhai',
  roomTypeId: 'all',
  channelId: 'all',
}

const filterOptions = {
  stores: [
    { value: 'qianhai', label: '天落会宿公寓(前海壹方城宝安中心店)' },
    { value: 'nanshan', label: '路客云南山科技园店' },
  ],
  roomTypes: [
    { value: 'all', label: '全部房型' },
    { value: 'suite', label: '顶层套房（浴缸巨幕电竞麻将）' },
    { value: 'president', label: '总裁套间（桑拿浴缸露台电竞麻将）' },
    { value: 'cinema', label: '观影大床房' },
  ],
  channels: [
    { value: 'all', label: '全部渠道' },
    { value: 'tujia', label: '途家' },
    { value: 'ctrip', label: '携程' },
    { value: 'meituan', label: '美团' },
  ],
}

const baseRooms: PriceComparisonRoomResponse[] = [
  {
    id: 'suite-tujia',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    channel: '途家',
    ownPrice: 869,
    competitorPrice: 899,
    marketAverage: 886,
    priceDiff: -30,
    occupancy: '78%',
    suggestion: '保持当前价格，晚高峰观察竞品浮动',
    status: 'advantage',
  },
  {
    id: 'president-ctrip',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    channel: '携程',
    ownPrice: 1089,
    competitorPrice: 1039,
    marketAverage: 1060,
    priceDiff: 50,
    occupancy: '61%',
    suggestion: '建议下调 30 元提升曝光',
    status: 'adjust',
  },
  {
    id: 'cinema-meituan',
    roomType: '观影大床房',
    channel: '美团',
    ownPrice: 238,
    competitorPrice: 239,
    marketAverage: 242,
    priceDiff: -1,
    occupancy: '84%',
    suggestion: '价格贴近竞争圈，可保持',
    status: 'watch',
  },
]

function ok<T>(data: T, traceId: string): ApiResponse<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId,
    timestamp: fixedTimestamp,
  }
}

function fail<T>(message: string, traceId: string): ApiResponse<T> {
  return {
    code: 503,
    message,
    data: {} as T,
    traceId,
    timestamp: fixedTimestamp,
  }
}

export function normalizePriceComparisonMockState(value: string | null): PriceComparisonMockState {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function getConfiguredProvider(): PriceComparisonProviderName {
  const configured = import.meta.env.VITE_PMS_PRICE_COMPARISON_PROVIDER
  return configured === 'api' ? 'api' : 'mock'
}

function normalizeFilters(request: PriceComparisonRequest): PriceComparisonFilters {
  return {
    date: request.date || defaultFilters.date,
    storeId: request.storeId || defaultFilters.storeId,
    roomTypeId: request.roomTypeId || defaultFilters.roomTypeId,
    channelId: request.channelId || defaultFilters.channelId,
  }
}

function buildDashboardData(filters: PriceComparisonFilters, mockState: PriceComparisonMockState): PriceComparisonDashboardResponse {
  const filteredRooms = baseRooms.filter((room) => {
    const roomMatches = filters.roomTypeId === 'all' || room.id.startsWith(filters.roomTypeId)
    const channelMatches = filters.channelId === 'all' || room.channel.includes(filterOptions.channels.find((item) => item.value === filters.channelId)?.label ?? '')
    return roomMatches && channelMatches
  })
  const list = mockState === 'empty' ? [] : filteredRooms
  const averageDiff = list.length
    ? Math.round(list.reduce((sum, item) => sum + item.priceDiff, 0) / list.length)
    : 0

  return {
    filters,
    filterOptions,
    metrics: [
      { id: 'diff', label: '平均价差', value: `${averageDiff > 0 ? '+' : ''}${averageDiff} 元`, delta: '较昨日优化 12 元', tone: 'primary' },
      { id: 'coverage', label: '竞品覆盖', value: list.length ? '8 家' : '0 家', delta: '覆盖核心商圈', tone: 'green' },
      { id: 'suggestion', label: '调价建议', value: `${list.filter((item) => item.status === 'adjust').length} 条`, delta: '建议今日 18:00 前处理', tone: 'orange' },
    ],
    trend: [
      { dateLabel: '05/18', ownPrice: 869, competitorPrice: 899, marketAverage: 886 },
      { dateLabel: '05/19', ownPrice: 879, competitorPrice: 909, marketAverage: 892 },
      { dateLabel: '05/20', ownPrice: 889, competitorPrice: 919, marketAverage: 902 },
      { dateLabel: '05/21', ownPrice: 899, competitorPrice: 929, marketAverage: 912 },
    ],
    rooms: {
      list,
      pagination: {
        page: 1,
        pageSize: 20,
        total: list.length,
      },
    },
    todos: list.length
      ? [
        { id: 'todo-adjust', title: '调价建议：总裁套间价格高于竞争圈均值，建议复核', due: '今天 18:00', priority: '高' },
        { id: 'todo-watch', title: '观影大床房周末价差低于 5 元，保持观察', due: '明天 10:00', priority: '中' },
      ]
      : [],
    quickLinks: [
      { id: 'central', label: '去中央价', route: '/houseManage/houseCale' },
      { id: 'orders', label: '去订单', route: '/order/house-order/list' },
      { id: 'report', label: '去报表', route: '/statistics/roomSituation' },
    ],
    updatedAt: fixedTimestamp,
  }
}

async function loadMockDashboard(request: PriceComparisonRequest): Promise<ApiResponse<PriceComparisonDashboardResponse>> {
  const mockState = request.mockState ?? 'success'
  if (mockState === 'error') {
    return fail('数据加载失败，请稍后重试。', `mock-${taskId}-dashboard-error-001`)
  }

  const filters = normalizeFilters(request)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    return fail('日期格式不正确，请重新选择。', `mock-${taskId}-dashboard-invalid-date-001`)
  }

  return ok(buildDashboardData(filters, mockState), `mock-${taskId}-dashboard-${mockState}-001`)
}

async function loadApiDashboard(): Promise<ApiResponse<PriceComparisonDashboardResponse>> {
  return fail('数据加载失败，请稍后重试。', `api-${taskId}-dashboard-not-configured-001`)
}

function adaptDashboardResponse(
  response: ApiResponse<PriceComparisonDashboardResponse>,
  provider: PriceComparisonProviderName,
): PriceComparisonDashboard {
  if (response.code !== 0) {
    throw new Error(response.message)
  }

  if (!response.data?.filters || !response.data.rooms?.pagination || !Array.isArray(response.data.rooms.list)) {
    throw new Error('数据结构异常，请稍后重试。')
  }

  return {
    ...response.data,
    provider,
    traceId: response.traceId,
    timestamp: response.timestamp,
  }
}

export async function loadPriceComparisonDashboard(
  request: PriceComparisonRequest = {},
): Promise<PriceComparisonDashboard> {
  const provider = request.provider ?? getConfiguredProvider()
  const response =
    provider === 'mock'
      ? await loadMockDashboard(request)
      : await loadApiDashboard()

  return adaptDashboardResponse(response, provider)
}
