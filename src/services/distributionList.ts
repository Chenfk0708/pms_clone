const fixedTimestamp = '2026-05-18T10:00:00+08:00'

export const distributionListEndpoints = {
  campFlow: 'https://hudson-prod.localhome.cn/campFlow/get',
  roomCategories: 'https://hudson-prod.localhome.cn/roomCategories/page/get',
  undistributedRoomCategories: 'https://hudson-prod.localhome.cn/select/roomCategory/page/get',
  importedRoomCategories: 'https://hudson-prod.localhome.cn/weiRoomCategories/page/get',
  stores: 'https://hudson-prod.localhome.cn/select/poi/page/get',
}

export type DistributionProvider = 'mock' | 'api'
export type DistributionScenario = 'success' | 'empty' | 'error'
export type DistributionTab = 'distributed' | 'undistributed'

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

export type DistributionMetric = {
  key: string
  label: string
  value: string
  detail: string
}

export type DistributionChannel = {
  id: string
  name: string
  expectedOrders: number
  statusLabel: string
}

export type DistributionRoomCategory = {
  id: string
  name: string
  storeName: string
  channelName: string
  reason: string
  syncStatus: 'synced' | 'pending' | 'error'
  syncStatusLabel: string
  inventory: number
  price: number
  updatedAt: string
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
  metrics: DistributionMetric[]
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

const stores: DistributionOption[] = [
  { id: 'ALL', label: '全部门店' },
  { id: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const channels: DistributionChannel[] = [
  { id: '17', name: '路客云聚合', expectedOrders: 28, statusLabel: '已开通' },
  { id: '5', name: '途家', expectedOrders: 12, statusLabel: '已开通' },
  { id: '13', name: '小猪', expectedOrders: 8, statusLabel: '已开通' },
  { id: '1001', name: '携程民宿', expectedOrders: 12, statusLabel: '申请中' },
]

const distributedRooms: DistributionRoomCategory[] = [
  createRoom('1796425099729092609', '顶层套房（浴缸巨幕电竞麻将）', '路客云聚合', 'synced', 2, 699),
  createRoom('1796425099485822977', '总裁套间（桑拿浴缸露台电竞麻将）', '途家', 'synced', 1, 899),
  createRoom('1796425099242553345', '天落大床电竞套间', '小猪', 'pending', 1, 499),
  createRoom('1796425098965729282', '观影大床房', '携程民宿', 'synced', 3, 399),
]

const undistributedRooms: DistributionRoomCategory[] = [
  {
    ...createRoom('1796425098965729282-pending', '观影大床房', '路客云聚合', 'pending', 3, 399),
    reason: '缺少渠道房型映射',
  },
  {
    ...createRoom('1796425099242553345-pending', '天落大床电竞套间', '路客云聚合', 'pending', 1, 499),
    reason: '待完善图片与售卖规则',
  },
]

export function createDefaultDistributionFilters(searchParams = new URLSearchParams()): DistributionFilters {
  return {
    campId: '1796067693589061634',
    buyCampId: '1796067693589061634',
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
  if (provider === 'api') {
    throw new Error('分销列表加载失败，请稍后重试')
  }

  const envelope = await fetchMockDistributionDashboard(filters)
  return adaptDistributionDashboard(envelope, filters, provider)
}

export function buildDistributionRequests(filters: DistributionFilters) {
  const poiId = filters.poiId === 'ALL' ? '' : filters.poiId
  return {
    campFlow: { campId: filters.campId },
    roomCategories: {
      campId: filters.campId,
      pageSize: 999,
      pageNum: 1,
      roomCategoryName: filters.keyword,
      keyword: filters.keyword,
      cityIds: [],
      channelId: '',
    },
    undistributedRoomCategories: {
      campId: filters.campId,
      pageNum: filters.page,
      pageSize: filters.pageSize,
      current: filters.page,
      poiId,
      filterSyncChannelId: 17,
      isAvailability: 1,
      channelId: 0,
      isFilterAlreadyFlow: 1,
    },
    importedRoomCategories: {
      campId: '64',
      buyCampId: filters.buyCampId,
      roomCategoryTypes: [1],
      goodsTypes: [7],
    },
    stores: {
      campId: filters.campId,
      pageSize: 999,
      pageNum: 1,
      channelId: 0,
      isAvailability: '1',
    },
  }
}

function getDistributionProvider(): DistributionProvider {
  if (typeof window === 'undefined') return 'mock'
  return window.localStorage.getItem('pms.distributionListProvider') === 'api' ? 'api' : 'mock'
}

async function fetchMockDistributionDashboard(
  filters: DistributionFilters,
): Promise<Envelope<DashboardPayload>> {
  await delay(100)

  if (filters.scenario === 'error') {
    return {
      code: 50001,
      message: '分销列表加载失败，请稍后重试',
      data: createPayload(filters, true),
      traceId: 'mock-juhe-fenxiao--fenxiao--fenxiao-liebiao-error-001',
      timestamp: fixedTimestamp,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: createPayload(filters, filters.scenario === 'empty'),
    traceId: `mock-juhe-fenxiao--fenxiao--fenxiao-liebiao-${filters.scenario}-001`,
    timestamp: fixedTimestamp,
  }
}

function createPayload(filters: DistributionFilters, empty: boolean): DashboardPayload {
  const distributed = empty ? [] : filterRooms(distributedRooms, filters)
  const pending = empty ? [] : filterRooms(undistributedRooms, filters)
  const totalExpectedOrders = channels.reduce((sum, channel) => sum + channel.expectedOrders, 0)
  const totalRooms = distributed.length + pending.length

  return {
    stores,
    metrics: [
      { key: 'expectedOrders', label: '预计渠道订单', value: String(totalExpectedOrders), detail: '来自 campFlow/get expectedChannelOrderTotalNum' },
      { key: 'distributedRooms', label: '已分销房型', value: String(distributed.length), detail: '来自 roomCategories/page/get list' },
      { key: 'pendingRooms', label: '待完善房型', value: String(pending.length), detail: '来自 select/roomCategory/page/get list' },
      { key: 'syncRate', label: '房型同步率', value: totalRooms ? `${Math.round((distributed.length / totalRooms) * 100)}%` : '0%', detail: '已分销房型 / 全部分销房型' },
    ],
    channels,
    distributedRooms: distributed,
    undistributedRooms: pending,
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: filters.tab === 'distributed' ? distributed.length : pending.length,
    },
    updatedAt: fixedTimestamp,
  }
}

function adaptDistributionDashboard(
  envelope: Envelope<DashboardPayload>,
  filters: DistributionFilters,
  provider: DistributionProvider,
): DistributionDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '分销列表加载失败，请稍后重试')
  }
  if (!envelope.data || !Array.isArray(envelope.data.metrics)) {
    throw new Error('分销列表响应结构异常，请稍后重试')
  }

  return {
    ...envelope.data,
    provider,
    filters,
    request: buildDistributionRequests(filters),
    traceId: envelope.traceId,
  }
}

function filterRooms(rooms: DistributionRoomCategory[], filters: DistributionFilters) {
  return rooms.filter((room) => {
    const keywordMatched =
      !filters.keyword ||
      room.name.includes(filters.keyword) ||
      room.reason.includes(filters.keyword) ||
      room.channelName.includes(filters.keyword)
    const storeMatched = filters.poiId === 'ALL' || room.storeName === stores.find((store) => store.id === filters.poiId)?.label
    return keywordMatched && storeMatched
  })
}

function createRoom(
  id: string,
  name: string,
  channelName: string,
  syncStatus: DistributionRoomCategory['syncStatus'],
  inventory: number,
  price: number,
): DistributionRoomCategory {
  return {
    id,
    name,
    storeName: '天落会宿公寓(前海壹方城宝安中心店)',
    channelName,
    reason: syncStatus === 'synced' ? '渠道同步正常' : '等待运营完善',
    syncStatus,
    syncStatusLabel: syncStatus === 'synced' ? '已同步' : syncStatus === 'pending' ? '待完善' : '异常',
    inventory,
    price,
    updatedAt: '2026-05-18 10:00',
  }
}

function validateFilters(filters: DistributionFilters) {
  if (!Number.isFinite(filters.page) || filters.page < 1) throw new Error('分页参数不正确')
  if (!Number.isFinite(filters.pageSize) || filters.pageSize < 1) throw new Error('分页参数不正确')
}

function toScenario(value: string | null): DistributionScenario {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
