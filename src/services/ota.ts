const OTA_PROVIDER_KEY = 'pms.otaProvider'
const fixedTimestamp = '2026-05-18T10:00:00+08:00'

export type OtaProviderName = 'mock' | 'api'
export type OtaMockState = 'success' | 'empty' | 'error'

export type OtaFilters = {
  businessDate: string
  storeId: string
  dimension: 'all' | 'connected' | 'pending'
  mockState: OtaMockState
}

export type OtaLogFilters = {
  channelId: string
  keyword: string
  operator: string
  operationType: string
  operationStatus: string
  page: number
  pageSize: number
  mockState: OtaMockState
}

export type OtaOption = {
  value: string
  label: string
}

export type OtaMetric = {
  key: string
  label: string
  value: string
  detail: string
}

export type OtaChannel = {
  id: string
  name: string
  relation: string
  status: 'connected' | 'pending'
  roomTypeCount: number
  mappedRoomTypeCount: number
  lastSyncAt: string
  logoText: string
  detail: string
}

export type OtaReminder = {
  id: string
  title: string
  detail: string
}

export type OtaQuickLink = {
  id: string
  label: string
  route: string
}

export type OtaDashboard = {
  filters: OtaFilters
  stores: OtaOption[]
  dimensions: OtaOption[]
  metrics: OtaMetric[]
  connectedChannels: OtaChannel[]
  pendingChannels: OtaChannel[]
  reminders: OtaReminder[]
  quickLinks: OtaQuickLink[]
  updatedAt: string
  provider: OtaProviderName
  traceId: string
  request: Omit<OtaFilters, 'mockState'>
}

export type OtaLogRow = {
  id: string
  channelId: string
  channel: string
  type: string
  operationType: string
  content: string
  status: '成功' | '失败'
  operator: string
  time: string
}

export type OtaLogResult = {
  filters: OtaLogFilters
  channelOptions: OtaOption[]
  operationTypeOptions: OtaOption[]
  operationStatusOptions: OtaOption[]
  rows: OtaLogRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  provider: OtaProviderName
  traceId: string
  request: Omit<OtaLogFilters, 'mockState'>
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type OtaDashboardPayload = Omit<OtaDashboard, 'filters' | 'provider' | 'traceId' | 'request'>
type OtaLogPayload = Omit<OtaLogResult, 'filters' | 'provider' | 'traceId' | 'request'>

const stores: OtaOption[] = [
  { value: 'all', label: '全部门店' },
  { value: 'qianhai', label: '天落方城' },
  { value: 'baoan', label: '宝安中心店' },
]

const dimensions: OtaOption[] = [
  { value: 'all', label: '全部渠道' },
  { value: 'connected', label: '已直连' },
  { value: 'pending', label: '待关联' },
]

const channelOptions: OtaOption[] = [
  { value: 'all', label: '全部渠道' },
  { value: 'ctrip', label: '携程' },
  { value: 'meituan-hotel', label: '美团酒店' },
  { value: 'fliggy', label: '飞猪淘酒店' },
  { value: 'tujia', label: '途家' },
]

const operationTypeOptions: OtaOption[] = [
  { value: 'all', label: '全部类型' },
  { value: 'bindRoomType', label: '关联渠道房型' },
  { value: 'unbindRoomType', label: '解除渠道房型' },
  { value: 'bindAccount', label: '关联渠道账号' },
]

const operationStatusOptions: OtaOption[] = [
  { value: 'all', label: '全部状态' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
]

const connectedChannels: OtaChannel[] = [
  createChannel('ctrip', '携程', 'connected'),
  createChannel('meituan-hotel', '美团酒店', 'connected'),
  createChannel('fliggy', '飞猪淘酒店', 'connected'),
  createChannel('meituan-homestay', '美团民宿', 'connected'),
  createChannel('tujia', '途家', 'connected'),
  createChannel('muniao', '木鸟', 'connected'),
  createChannel('xiaozhu', '小猪', 'connected'),
  createChannel('locals', '路客云聚合', 'connected'),
]

const pendingChannels: OtaChannel[] = [
  createChannel('ctrip-play', '携程玩乐', 'pending'),
  createChannel('booking', 'Booking', 'pending'),
  createChannel('ctrip-global', '携程国际', 'pending'),
  createChannel('airbnb', '爱彼迎', 'pending'),
  createChannel('ly-homestay', '同程民宿', 'pending'),
  createChannel('58', '58同城', 'pending'),
  createChannel('beike', '贝壳', 'pending'),
  createChannel('tencent-map', '腾讯地图', 'pending'),
]

const logRows: OtaLogRow[] = [
  createLog('1', 'meituan-hotel', '美团酒店', 'bindRoomType', '关联渠道房型-观影大床房到 路客云房型-观影大床房', '路客云6TS5', '2025-10-03 21:49:53'),
  createLog('2', 'meituan-hotel', '美团酒店', 'bindRoomType', '关联渠道房型-天落大床房（电竞升降电脑）到 路客云房型-天落大床电竞套间', '路客云6TS5', '2025-10-03 21:49:50'),
  createLog('3', 'meituan-hotel', '美团酒店', 'bindRoomType', '关联渠道房型-总裁套间-独享台球电竞桑拿浴缸轰趴露台麻将到 路客云房型-总裁套间（桑拿浴缸露台电竞麻将）', '路客云6TS5', '2025-10-03 21:49:46'),
  createLog('4', 'meituan-hotel', '美团酒店', 'bindAccount', '关联渠道账号-主账号已完成授权', '路客云6TS5', '2025-10-03 21:49:25'),
  createLog('5', 'ctrip', '携程', 'bindRoomType', '关联渠道房型-顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）到 路客云房型-顶层套房（浴缸巨幕电竞麻将）', '11', '2025-09-29 15:48:12'),
  createLog('6', 'ctrip', '携程', 'bindRoomType', '关联渠道房型-总裁套间（独享浴缸桑拿房露台台球麻将）到 路客云房型-总裁套间（桑拿浴缸露台电竞麻将）', '路客云6TS5', '2025-09-29 15:44:57'),
  createLog('7', 'ctrip', '携程', 'unbindRoomType', '解除渠道房型-顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）到 路客云房型-顶层套房（浴缸巨幕电竞麻将）', '11', '2025-09-29 15:44:37'),
  createLog('8', 'fliggy', '飞猪淘酒店', 'bindRoomType', '关联渠道房型-观影大床房到 路客云房型-观影大床房', '路客云6TS5', '2025-09-28 12:20:11'),
  createLog('9', 'tujia', '途家', 'bindRoomType', '关联渠道房型-天落大床房到 路客云房型-天落大床电竞套间', '路客云6TS5', '2025-09-27 10:08:02'),
]

export function createDefaultOtaFilters(searchParams = new URLSearchParams()): OtaFilters {
  return {
    businessDate: searchParams.get('date') || '2026-05-18',
    storeId: searchParams.get('storeId') || 'all',
    dimension: toDimension(searchParams.get('dimension')),
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export function createDefaultOtaLogFilters(searchParams = new URLSearchParams()): OtaLogFilters {
  return {
    channelId: searchParams.get('channelId') || 'all',
    keyword: searchParams.get('keyword') || '',
    operator: searchParams.get('operator') || '',
    operationType: searchParams.get('operationType') || 'all',
    operationStatus: searchParams.get('operationStatus') || 'all',
    page: Number(searchParams.get('page') || 1),
    pageSize: Number(searchParams.get('pageSize') || 6),
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export async function fetchOtaDashboard(
  filters: OtaFilters,
  providerName = getOtaProviderName(),
): Promise<OtaDashboard> {
  validateDate(filters.businessDate, '业务日期格式不正确')

  if (providerName === 'api') {
    throw new Error('OTA数据加载失败，请稍后重试')
  }

  const envelope = await fetchMockOtaDashboard(filters)
  return adaptDashboardEnvelope(envelope, filters, providerName)
}

export async function fetchOtaOperationLogs(
  filters: OtaLogFilters,
  providerName = getOtaProviderName(),
): Promise<OtaLogResult> {
  validatePagination(filters.page, filters.pageSize)

  if (providerName === 'api') {
    throw new Error('OTA操作日志加载失败，请稍后重试')
  }

  const envelope = await fetchMockOtaOperationLogs(filters)
  return adaptLogEnvelope(envelope, filters, providerName)
}

export function buildOtaDashboardRequest(filters: OtaFilters) {
  return {
    businessDate: filters.businessDate,
    storeId: filters.storeId,
    dimension: filters.dimension,
  }
}

export function buildOtaLogRequest(filters: OtaLogFilters) {
  return {
    channelId: filters.channelId,
    keyword: filters.keyword,
    operator: filters.operator,
    operationType: filters.operationType,
    operationStatus: filters.operationStatus,
    page: filters.page,
    pageSize: filters.pageSize,
  }
}

function getOtaProviderName(): OtaProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(OTA_PROVIDER_KEY)
  return configured === 'api' ? 'api' : 'mock'
}

async function fetchMockOtaDashboard(filters: OtaFilters): Promise<UnifiedEnvelope<OtaDashboardPayload>> {
  await delay(100)

  if (filters.mockState === 'error') {
    return {
      code: 50001,
      message: 'OTA数据加载失败，请稍后重试',
      data: createEmptyDashboardPayload(filters),
      traceId: 'mock-ota--ota--ota-dashboard-error-001',
      timestamp: fixedTimestamp,
    }
  }

  const data = filters.mockState === 'empty' ? createEmptyDashboardPayload(filters) : createDashboardPayload(filters)
  return {
    code: 0,
    message: 'success',
    data,
    traceId: `mock-ota--ota--ota-dashboard-${filters.mockState}-001`,
    timestamp: fixedTimestamp,
  }
}

async function fetchMockOtaOperationLogs(filters: OtaLogFilters): Promise<UnifiedEnvelope<OtaLogPayload>> {
  await delay(100)

  if (filters.mockState === 'error') {
    return {
      code: 50001,
      message: 'OTA操作日志加载失败，请稍后重试',
      data: createEmptyLogPayload(filters),
      traceId: 'mock-ota--ota--ota-operation-logs-error-001',
      timestamp: fixedTimestamp,
    }
  }

  const data = filters.mockState === 'empty' ? createEmptyLogPayload(filters) : createLogPayload(filters)
  return {
    code: 0,
    message: 'success',
    data,
    traceId: `mock-ota--ota--ota-operation-logs-${filters.mockState}-001`,
    timestamp: fixedTimestamp,
  }
}

function adaptDashboardEnvelope(
  envelope: UnifiedEnvelope<OtaDashboardPayload>,
  filters: OtaFilters,
  provider: OtaProviderName,
): OtaDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || 'OTA数据加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.connectedChannels) || !Array.isArray(data.pendingChannels)) {
    throw new Error('OTA数据结构异常，请稍后重试')
  }

  return {
    ...data,
    filters,
    provider,
    traceId: envelope.traceId,
    request: buildOtaDashboardRequest(filters),
  }
}

function adaptLogEnvelope(
  envelope: UnifiedEnvelope<OtaLogPayload>,
  filters: OtaLogFilters,
  provider: OtaProviderName,
): OtaLogResult {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || 'OTA操作日志加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.rows) || !data.pagination) {
    throw new Error('OTA操作日志结构异常，请稍后重试')
  }

  return {
    ...data,
    filters,
    provider,
    traceId: envelope.traceId,
    request: buildOtaLogRequest(filters),
  }
}

function createDashboardPayload(filters: OtaFilters): OtaDashboardPayload {
  const connected =
    filters.dimension === 'pending'
      ? []
      : connectedChannels.map((channel) => applyStoreRelation(channel, filters.storeId))
  const pending = filters.dimension === 'connected' ? [] : pendingChannels

  return {
    stores,
    dimensions,
    metrics: [
      { key: 'connected', label: '已直连', value: String(connected.length), detail: '可同步房型、价格、库存' },
      { key: 'pending', label: '待关联', value: String(pending.length), detail: '可发起授权或渠道申请' },
      { key: 'roomTypes', label: '关联房型', value: '32/32', detail: '目标站当前渠道房型均已映射' },
      { key: 'sync', label: '最近同步', value: '09:40', detail: '库存、房价、订单状态已完成同步' },
    ],
    connectedChannels: connected,
    pendingChannels: pending,
    reminders: [
      { id: 'room-map', title: '房型映射复核', detail: '美团酒店新增账号后需复核观影大床房映射' },
      { id: 'rate-check', title: '价格同步巡检', detail: '飞猪淘酒店周末价已完成同步，可在中央价查看' },
    ],
    quickLinks: [
      { id: 'orders', label: '去订单', route: '/order/house-order/list' },
      { id: 'room-status', label: '去房态', route: '/houseManage/months' },
      { id: 'report', label: '去报表', route: '/statistics/roomSituation' },
    ],
    updatedAt: fixedTimestamp,
  }
}

function createEmptyDashboardPayload(filters: OtaFilters): OtaDashboardPayload {
  return {
    stores,
    dimensions,
    metrics: [
      { key: 'connected', label: '已直连', value: '0', detail: '当前条件暂无渠道' },
      { key: 'pending', label: '待关联', value: '0', detail: '当前条件暂无待关联渠道' },
      { key: 'roomTypes', label: '关联房型', value: '0/0', detail: '暂无房型映射' },
      { key: 'sync', label: '最近同步', value: '-', detail: '暂无同步记录' },
    ],
    connectedChannels: filters.dimension === 'pending' ? [] : [],
    pendingChannels: [],
    reminders: [],
    quickLinks: [
      { id: 'orders', label: '去订单', route: '/order/house-order/list' },
      { id: 'room-status', label: '去房态', route: '/houseManage/months' },
      { id: 'report', label: '去报表', route: '/statistics/roomSituation' },
    ],
    updatedAt: fixedTimestamp,
  }
}

function createLogPayload(filters: OtaLogFilters): OtaLogPayload {
  const filtered = logRows.filter((row) => {
    const channelMatches = filters.channelId === 'all' || row.channelId === filters.channelId
    const keywordMatches = !filters.keyword || row.content.includes(filters.keyword) || row.channel.includes(filters.keyword)
    const operatorMatches = !filters.operator || row.operator.includes(filters.operator)
    const typeMatches = filters.operationType === 'all' || row.operationType === filters.operationType
    const statusMatches = filters.operationStatus === 'all' || (filters.operationStatus === 'success' && row.status === '成功')
    return channelMatches && keywordMatches && operatorMatches && typeMatches && statusMatches
  })
  const start = (filters.page - 1) * filters.pageSize

  return {
    channelOptions,
    operationTypeOptions,
    operationStatusOptions,
    rows: filtered.slice(start, start + filters.pageSize),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: filtered.length,
    },
  }
}

function createEmptyLogPayload(filters: OtaLogFilters): OtaLogPayload {
  return {
    channelOptions,
    operationTypeOptions,
    operationStatusOptions,
    rows: [],
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: 0,
    },
  }
}

function createChannel(id: string, name: string, status: OtaChannel['status']): OtaChannel {
  const isConnected = status === 'connected'
  const mapped = isConnected ? 4 : 0
  return {
    id,
    name,
    status,
    roomTypeCount: 4,
    mappedRoomTypeCount: mapped,
    relation: isConnected ? `关联房型${mapped}/4` : '等待授权',
    lastSyncAt: isConnected ? '2026-05-18 09:40' : '-',
    logoText: name.length > 4 ? name.slice(0, 2) : name,
    detail: isConnected ? `${name} 已完成房型、价格、库存同步` : `${name} 可发起渠道授权申请`,
  }
}

function createLog(
  id: string,
  channelId: string,
  channel: string,
  operationType: string,
  content: string,
  operator: string,
  time: string,
): OtaLogRow {
  return {
    id,
    channelId,
    channel,
    type: operationTypeOptions.find((item) => item.value === operationType)?.label ?? operationType,
    operationType,
    content,
    status: '成功',
    operator,
    time,
  }
}

function applyStoreRelation(channel: OtaChannel, storeId: string): OtaChannel {
  if (storeId !== 'qianhai') return channel
  if (channel.id !== 'locals') return channel

  return {
    ...channel,
    relation: '关联房型3/4',
    mappedRoomTypeCount: 3,
    detail: '路客云聚合在当前门店有 1 个房型待复核',
  }
}

function toMockState(value: string | null): OtaMockState {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function toDimension(value: string | null): OtaFilters['dimension'] {
  if (value === 'connected' || value === 'pending') return value
  return 'all'
}

function validateDate(value: string, message: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(message)
  }
}

function validatePagination(page: number, pageSize: number) {
  if (!Number.isFinite(page) || page < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
    throw new Error('分页参数不正确')
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
