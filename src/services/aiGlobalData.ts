const TASK_ID = 'ai-quanyu-leida--shuju-yu-peizhi--quanyu-shuju'
const MOCK_TIMESTAMP = '2026-05-19T18:20:00+08:00'
const MOCK_DELAY_MS = 180

export const AI_GLOBAL_DATA_OVERVIEW_ENDPOINT = '/order/report/get'
export const AI_GLOBAL_DATA_REMINDERS_ENDPOINT = '/orders/strongReminder/page/get'
export const AI_GLOBAL_DATA_POI_ENDPOINT = '/select/poi/page/get'
export const AI_GLOBAL_DATA_ROOMS_ENDPOINT = '/roomCategories/page/get'
export const AI_GLOBAL_DATA_SHOPS_ENDPOINT = '/radarConfig/shop/get'
export const AI_GLOBAL_DATA_EDITION_ENDPOINT = '/edition/resource/get'
export const AI_GLOBAL_DATA_PAYMENT_ENDPOINT = '/paymentTypes/get/v2'
export const AI_GLOBAL_DATA_EXPORT_ENDPOINT = '/globalRadar/export/create'
export const AI_GLOBAL_DATA_REMINDER_POSTPONE_ENDPOINT = '/globalRadar/strongReminder/postpone'
export const AI_GLOBAL_DATA_REMINDER_RESOLVE_ENDPOINT = '/globalRadar/strongReminder/resolve'

export type AiGlobalDataProvider = 'mock' | 'api'
export type AiGlobalDataMockState = 'success' | 'empty' | 'error'
export type AiGlobalDataChannel = 'all' | 'ctrip' | 'meituan'
export type AiGlobalDataAttention = 'all' | 'high' | 'medium' | 'low'
type BusinessChannel = Exclude<AiGlobalDataChannel, 'all'>
type BusinessAttention = Exclude<AiGlobalDataAttention, 'all'>

export type AiGlobalDataQuery = {
  provider?: AiGlobalDataProvider
  mockState?: AiGlobalDataMockState
  campId: string
  channel: AiGlobalDataChannel
  attention: AiGlobalDataAttention
  roomKeyword: string
  reminderPage: number
  reminderPageSize: number
}

export type AiGlobalDataOption = {
  label: string
  value: string
}

export type AiGlobalSummaryMetric = {
  id: string
  label: string
  value: string
  unit: string
  description: string
  tone: 'blue' | 'teal' | 'green' | 'orange' | 'red' | 'gold'
  detailLines: string[]
}

export type AiGlobalTrendBar = {
  id: string
  label: string
  value: number
  caption: string
  tone: 'book' | 'checkin' | 'checkout' | 'risk'
}

export type AiGlobalReminder = {
  id: string
  campId: string
  level: BusinessAttention
  title: string
  guestName: string
  roomName: string
  orderNo: string
  dueAt: string
  channel: BusinessChannel
  status: 'pending' | 'postponed' | 'resolved'
  primaryAction: 'order' | 'status'
  summary: string
}

export type AiGlobalRoomRow = {
  id: string
  campId: string
  city: string
  name: string
  inventory: number
  staying: number
  basePrice: number
  weekendPrice: number
  holidayPrice: number
  occupancyRate: number
  pendingOrders: number
  riskLevel: BusinessAttention
  channels: BusinessChannel[]
  lastSyncedAt: string
}

export type AiGlobalRoomDetail = {
  roomId: string
  roomName: string
  occupancyRate: number
  inventory: number
  staying: number
  pendingOrders: number
  channelPrices: Array<{
    label: string
    price: number
    status: string
  }>
  guidance: string[]
}

export type AiGlobalStoreStatus = {
  id: string
  campId: string
  name: string
  connectorStatus: 'online' | 'warning' | 'offline'
  radarStatus: 'running' | 'delay' | 'setup'
  authorizedChannels: string[]
  updatedAt: string
}

export type AiGlobalQuickLink = {
  label: string
  path: string
}

export type AiGlobalSubscription = {
  title: string
  description: string
  actionText: string
  priceText: string
  connectorProgress: string
  editionName: string
  paymentHint: string
}

export type AiGlobalRequestContract = {
  endpoint: string
  request: Record<string, unknown>
  traceId: string
}

export type AiGlobalDataViewModel = {
  provider: AiGlobalDataProvider
  state: AiGlobalDataMockState
  traceId: string
  timestamp: string
  query: AiGlobalDataQuery
  filterOptions: {
    camps: AiGlobalDataOption[]
    channels: AiGlobalDataOption[]
    attentions: AiGlobalDataOption[]
  }
  summary: AiGlobalSummaryMetric[]
  trend: AiGlobalTrendBar[]
  reminders: AiGlobalReminder[]
  roomCategories: AiGlobalRoomRow[]
  stores: AiGlobalStoreStatus[]
  quickLinks: AiGlobalQuickLink[]
  subscription: AiGlobalSubscription
  requestContracts: Record<string, AiGlobalRequestContract>
  isEmpty: boolean
}

export type AiGlobalExportTask = {
  taskId: string
  traceId: string
  timestamp: string
  fileName?: string
  contentType?: string
  downloadUrl?: string
  total?: number
}

export type AiGlobalReminderActionResult = {
  reminderId: string
  orderNo: string
  status: AiGlobalReminder['status']
  message: string
  traceId: string
  timestamp: string
}

type Envelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type ApiPayload = {
  code?: number
  message?: string
  success?: boolean
  errorMsg?: string | null
  errorCode?: string | null
  errorDetail?: string | null
  traceId?: string
  timestamp?: string
  data?: unknown
}

type OverviewData = {
  todayNewOrder: number
  todayCheckIn: number
  todayCheckOut: number
  staying: number
  pending: number
  exception: number
  refunding: number
  tomorrowCheckIn: number
  tomorrowCheckOut: number
}

type ReminderPageData = {
  list: AiGlobalReminder[]
  pagination: {
    pageNum: number
    pageSize: number
    total: number
  }
}

type RoomPageData = {
  list: AiGlobalRoomRow[]
  pagination: {
    pageNum: number
    pageSize: number
    total: number
  }
}

type EditionData = {
  editionName: string
  resourceName: string
  priceText: string
  connectorProgress: string
}

type PaymentGroupData = {
  paymentGroups: Array<{
    name: string
    paymentTypes: Array<{ name: string }>
  }>
}

const campOptions: AiGlobalDataOption[] = [
  { label: 'UP智谷店', value: 'camp-up-valley' },
  { label: '广州市海珠智选店', value: 'camp-haizhu' },
  { label: '广州市天河电竞公寓', value: 'camp-tianhe' },
]

const channelOptions: AiGlobalDataViewModel['filterOptions']['channels'] = [
  { label: '全部渠道', value: 'all' },
  { label: '携程酒店', value: 'ctrip' },
  { label: '美团酒店', value: 'meituan' },
]

const attentionOptions: AiGlobalDataViewModel['filterOptions']['attentions'] = [
  { label: '全部级别', value: 'all' },
  { label: '高优先级', value: 'high' },
  { label: '中优先级', value: 'medium' },
  { label: '低优先级', value: 'low' },
]

const quickLinks: AiGlobalQuickLink[] = [
  { label: '房态', path: '/houseManage/months' },
  { label: '订单', path: '/order/house-order/list' },
  { label: '报表', path: '/statistics/report' },
  { label: '配置中心', path: '/channels/globalRadar/globalSetting' },
]

const overviewByCamp: Record<string, OverviewData> = {
  'camp-up-valley': {
    todayNewOrder: 16,
    todayCheckIn: 12,
    todayCheckOut: 8,
    staying: 34,
    pending: 5,
    exception: 2,
    refunding: 1,
    tomorrowCheckIn: 10,
    tomorrowCheckOut: 7,
  },
  'camp-haizhu': {
    todayNewOrder: 13,
    todayCheckIn: 9,
    todayCheckOut: 6,
    staying: 26,
    pending: 4,
    exception: 1,
    refunding: 1,
    tomorrowCheckIn: 8,
    tomorrowCheckOut: 5,
  },
  'camp-tianhe': {
    todayNewOrder: 9,
    todayCheckIn: 7,
    todayCheckOut: 4,
    staying: 18,
    pending: 3,
    exception: 2,
    refunding: 0,
    tomorrowCheckIn: 6,
    tomorrowCheckOut: 4,
  },
}

const reminderSeeds: AiGlobalReminder[] = [
  {
    id: 'reminder-up-1',
    campId: 'camp-up-valley',
    level: 'high',
    title: '待处理提醒',
    guestName: '王梓涵',
    roomName: 'A栋·山景大床房',
    orderNo: 'LH20260519001',
    dueAt: '18:40',
    channel: 'ctrip',
    status: 'pending',
    primaryAction: 'order',
    summary: '客人 18:00 后仍未完成入住登记，需要二次提醒。',
  },
  {
    id: 'reminder-up-2',
    campId: 'camp-up-valley',
    level: 'medium',
    title: '价格校验',
    guestName: '吴宇晨',
    roomName: 'B栋·观景双床房',
    orderNo: 'LH20260519007',
    dueAt: '19:10',
    channel: 'meituan',
    status: 'pending',
    primaryAction: 'status',
    summary: '节假日价与渠道价差超过 18%，建议先核对房态与价格策略。',
  },
  {
    id: 'reminder-haizhu-1',
    campId: 'camp-haizhu',
    level: 'high',
    title: '待处理提醒',
    guestName: '刘佩琪',
    roomName: '海珠·行政大床房',
    orderNo: 'LH20260519032',
    dueAt: '17:55',
    channel: 'meituan',
    status: 'pending',
    primaryAction: 'order',
    summary: '客人已确认到店，但订单仍处于待入住状态。',
  },
  {
    id: 'reminder-haizhu-2',
    campId: 'camp-haizhu',
    level: 'low',
    title: '连接器巡检',
    guestName: '系统任务',
    roomName: '海珠全店',
    orderNo: 'TASK-HZ-001',
    dueAt: '20:00',
    channel: 'ctrip',
    status: 'pending',
    primaryAction: 'status',
    summary: '巡检延迟 12 分钟，建议检查连接器所在前台电脑网络。',
  },
  {
    id: 'reminder-tianhe-1',
    campId: 'camp-tianhe',
    level: 'medium',
    title: '入住核验',
    guestName: '陈晓岚',
    roomName: '天河·电竞四人房',
    orderNo: 'LH20260519061',
    dueAt: '21:00',
    channel: 'ctrip',
    status: 'pending',
    primaryAction: 'order',
    summary: '客人已到店，身份证核验次数不足，需要人工辅助处理。',
  },
]

const roomSeeds: AiGlobalRoomRow[] = [
  {
    id: 'room-up-a1',
    campId: 'camp-up-valley',
    city: '广州',
    name: 'A栋·山景大床房',
    inventory: 18,
    staying: 16,
    basePrice: 468,
    weekendPrice: 528,
    holidayPrice: 598,
    occupancyRate: 89,
    pendingOrders: 3,
    riskLevel: 'high',
    channels: ['ctrip', 'meituan'],
    lastSyncedAt: '2026-05-19 18:10',
  },
  {
    id: 'room-up-b2',
    campId: 'camp-up-valley',
    city: '广州',
    name: 'B栋·观景双床房',
    inventory: 12,
    staying: 9,
    basePrice: 436,
    weekendPrice: 496,
    holidayPrice: 556,
    occupancyRate: 75,
    pendingOrders: 1,
    riskLevel: 'medium',
    channels: ['ctrip', 'meituan'],
    lastSyncedAt: '2026-05-19 18:08',
  },
  {
    id: 'room-haizhu-c1',
    campId: 'camp-haizhu',
    city: '广州',
    name: '海珠·行政大床房',
    inventory: 15,
    staying: 12,
    basePrice: 398,
    weekendPrice: 458,
    holidayPrice: 518,
    occupancyRate: 80,
    pendingOrders: 2,
    riskLevel: 'high',
    channels: ['meituan'],
    lastSyncedAt: '2026-05-19 17:58',
  },
  {
    id: 'room-haizhu-d2',
    campId: 'camp-haizhu',
    city: '广州',
    name: '海珠·雅致双床房',
    inventory: 10,
    staying: 6,
    basePrice: 356,
    weekendPrice: 416,
    holidayPrice: 488,
    occupancyRate: 60,
    pendingOrders: 1,
    riskLevel: 'low',
    channels: ['ctrip', 'meituan'],
    lastSyncedAt: '2026-05-19 17:51',
  },
  {
    id: 'room-tianhe-e1',
    campId: 'camp-tianhe',
    city: '广州',
    name: '天河·电竞四人房',
    inventory: 8,
    staying: 5,
    basePrice: 598,
    weekendPrice: 658,
    holidayPrice: 738,
    occupancyRate: 63,
    pendingOrders: 2,
    riskLevel: 'medium',
    channels: ['ctrip'],
    lastSyncedAt: '2026-05-19 17:43',
  },
]

const storeSeeds: AiGlobalStoreStatus[] = [
  {
    id: 'store-up',
    campId: 'camp-up-valley',
    name: 'UP智谷店',
    connectorStatus: 'online',
    radarStatus: 'running',
    authorizedChannels: ['携程酒店', '美团酒店'],
    updatedAt: '2026-05-19 18:12',
  },
  {
    id: 'store-haizhu',
    campId: 'camp-haizhu',
    name: '广州市海珠智选店',
    connectorStatus: 'warning',
    radarStatus: 'delay',
    authorizedChannels: ['携程酒店'],
    updatedAt: '2026-05-19 17:56',
  },
  {
    id: 'store-tianhe',
    campId: 'camp-tianhe',
    name: '广州市天河电竞公寓',
    connectorStatus: 'offline',
    radarStatus: 'setup',
    authorizedChannels: ['美团酒店'],
    updatedAt: '2026-05-19 17:32',
  },
]

const editionData: EditionData = {
  editionName: '全域雷达',
  resourceName: '门店经营数据连接器',
  priceText: '￥1,908.48 / 年',
  connectorProgress: '2 / 3 门店已接入连接器',
}

const paymentGroupData: PaymentGroupData = {
  paymentGroups: [
    {
      name: '经营分析订阅',
      paymentTypes: [{ name: '微信支付' }, { name: '支付宝' }],
    },
  ],
}

export function getAiGlobalDataFallbackFilterOptions() {
  return {
    camps: campOptions,
    channels: channelOptions,
    attentions: attentionOptions,
  }
}

export function resolveAiGlobalDataRuntimeConfig(search: string): Pick<AiGlobalDataQuery, 'provider' | 'mockState'> {
  const params = readAiGlobalDataSearchParams(search)
  const provider = params.get('aiGlobalDataProvider')
  const mockState = params.get('aiGlobalDataMockState')
  return {
    provider: provider === 'api' || provider === 'real' ? 'api' : provider === 'mock' ? 'mock' : undefined,
    mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
  }
}

function readAiGlobalDataSearchParams(search: string) {
  const params = new URLSearchParams(search)
  if (typeof window === 'undefined') return params
  const hashQuery = window.location.hash.split('?')[1]
  if (!hashQuery) return params
  const hashParams = new URLSearchParams(`?${hashQuery}`)
  hashParams.forEach((value, key) => {
    if (!params.has(key)) params.set(key, value)
  })
  return params
}

export function getDefaultAiGlobalDataQuery(
  overrides: Pick<AiGlobalDataQuery, 'provider' | 'mockState'> = {},
): AiGlobalDataQuery {
  return {
    provider: overrides.provider,
    mockState: overrides.mockState,
    campId: 'camp-up-valley',
    channel: 'all',
    attention: 'all',
    roomKeyword: '',
    reminderPage: 1,
    reminderPageSize: 10,
  }
}

export async function fetchAiGlobalDataDashboard(
  query: AiGlobalDataQuery,
  signal?: AbortSignal,
): Promise<AiGlobalDataViewModel> {
  const provider = query.provider ?? resolveProvider()
  const state = query.mockState ?? resolveMockState()

  if (provider === 'mock') {
    await delay(MOCK_DELAY_MS, signal)
    if (state === 'error') {
      throw new Error('全域数据加载失败，请稍后重试')
    }

    const overviewEnvelope = createMockOverviewEnvelope(query, state)
    const reminderEnvelope = createMockReminderEnvelope(query, state)
    const poiEnvelope = createMockPoiEnvelope(query)
    const roomEnvelope = createMockRoomEnvelope(query, state)
    const shopEnvelope = createMockShopEnvelope(query, state)
    const editionEnvelope = createMockEditionEnvelope()
    const paymentEnvelope = createMockPaymentEnvelope()

    return buildViewModel(
      query,
      provider,
      state,
      overviewEnvelope,
      reminderEnvelope,
      poiEnvelope,
      roomEnvelope,
      shopEnvelope,
      editionEnvelope,
      paymentEnvelope,
    )
  }

  const overviewRequest = createOverviewRequest(query)
  const reminderRequest = createReminderRequest(query)
  const poiRequest = createPoiRequest(query)
  const roomRequest = createRoomRequest(query)
  const shopRequest = createShopRequest(query)
  const editionRequest = createEditionRequest(query)
  const paymentRequest = createPaymentRequest(query)

  const [overviewPayload, reminderPayload, poiPayload, roomPayload, shopPayload, editionPayload, paymentPayload] = await Promise.all([
    postJson(AI_GLOBAL_DATA_OVERVIEW_ENDPOINT, overviewRequest, signal),
    postJson(AI_GLOBAL_DATA_REMINDERS_ENDPOINT, reminderRequest, signal),
    postJson(AI_GLOBAL_DATA_POI_ENDPOINT, poiRequest, signal),
    postJson(AI_GLOBAL_DATA_ROOMS_ENDPOINT, roomRequest, signal),
    postJson(AI_GLOBAL_DATA_SHOPS_ENDPOINT, shopRequest, signal),
    postJson(AI_GLOBAL_DATA_EDITION_ENDPOINT, editionRequest, signal),
    postJson(AI_GLOBAL_DATA_PAYMENT_ENDPOINT, paymentRequest, signal),
  ])

  return buildViewModel(
    query,
    provider,
    state,
    normalizeEnvelope(overviewPayload, overviewRequest),
    normalizeEnvelope(reminderPayload, reminderRequest),
    normalizeEnvelope(poiPayload, poiRequest),
    normalizeEnvelope(roomPayload, roomRequest),
    normalizeEnvelope(shopPayload, shopRequest),
    normalizeEnvelope(editionPayload, editionRequest),
    normalizeEnvelope(paymentPayload, paymentRequest),
  )
}

export async function fetchAiGlobalRoomDetail(
  roomId: string,
  query: AiGlobalDataQuery,
): Promise<AiGlobalRoomDetail> {
  const provider = query.provider ?? resolveProvider()
  if (provider === 'api') {
    const payload = await postJson('/roomCategories/detail/get', { roomCategoryId: roomId })
    const record = asRecord(payload.data)
    if (!record) {
      throw new Error('房型经营详情缺失')
    }
    return adaptRoomDetail(record, roomId)
  }

  const room = roomSeeds.find((item) => item.id === roomId)
  if (!room) {
    throw new Error('未找到房型经营详情')
  }

  return createRoomDetail(room)
}

export async function createAiGlobalDataExportTask(query: AiGlobalDataQuery): Promise<AiGlobalExportTask> {
  const request = createExportRequest(query)
  const provider = query.provider ?? resolveProvider()
  const state = query.mockState ?? resolveMockState()

  if (provider === 'api') {
    const payload = await postJson(AI_GLOBAL_DATA_EXPORT_ENDPOINT, request)
    const data = asRecord(payload.data)
    const taskId = readString(data?.taskId)
    if (!taskId) {
      throw new Error('?????????? taskId')
    }
    const result = {
      taskId,
      traceId: payload.traceId ?? `api-${TASK_ID}-export`,
      timestamp: payload.timestamp ?? MOCK_TIMESTAMP,
      fileName: readString(data?.fileName) ?? undefined,
      contentType: readString(data?.contentType) ?? undefined,
      downloadUrl: readString(data?.downloadUrl) ?? undefined,
      total: readNumber(data?.total) ?? undefined,
    }
    writeDiagnostics({ endpoint: AI_GLOBAL_DATA_EXPORT_ENDPOINT, provider, state, traceId: result.traceId, request })
    return result
  }

  const result = {
    taskId: `EXPORT-${TASK_ID}-20260519-001`,
    traceId: `mock-${TASK_ID}-export-001`,
    timestamp: MOCK_TIMESTAMP,
  }
  writeDiagnostics({ endpoint: AI_GLOBAL_DATA_EXPORT_ENDPOINT, provider, state, traceId: result.traceId, request })
  return result
}

export async function postponeAiGlobalReminder(
  reminder: AiGlobalReminder,
  query: AiGlobalDataQuery,
): Promise<AiGlobalReminderActionResult> {
  return submitAiGlobalReminderAction(
    AI_GLOBAL_DATA_REMINDER_POSTPONE_ENDPOINT,
    reminder,
    query,
    'postponed',
    `mock-${TASK_ID}-reminder-postpone-001`,
  )
}

export async function resolveAiGlobalReminder(
  reminder: AiGlobalReminder,
  query: AiGlobalDataQuery,
): Promise<AiGlobalReminderActionResult> {
  return submitAiGlobalReminderAction(
    AI_GLOBAL_DATA_REMINDER_RESOLVE_ENDPOINT,
    reminder,
    query,
    'resolved',
    `mock-${TASK_ID}-reminder-resolve-001`,
  )
}

async function submitAiGlobalReminderAction(
  endpoint: string,
  reminder: AiGlobalReminder,
  query: AiGlobalDataQuery,
  fallbackStatus: AiGlobalReminder['status'],
  mockTraceId: string,
): Promise<AiGlobalReminderActionResult> {
  const provider = query.provider ?? resolveProvider()
  const state = query.mockState ?? resolveMockState()
  const request = {
    reminderId: reminder.id,
    orderNo: reminder.orderNo,
    campId: mapCampId(query.campId),
  }

  if (provider === 'api') {
    const payload = await postJson(endpoint, request)
    const data = asRecord(payload.data)
    const result = {
      reminderId: readString(data?.reminderId) ?? reminder.id,
      orderNo: readString(data?.orderNo) ?? reminder.orderNo,
      status: readReminderStatus(data?.status ?? fallbackStatus),
      message: readString(data?.message) ?? '',
      traceId: payload.traceId ?? `api-${TASK_ID}-${fallbackStatus}`,
      timestamp: payload.timestamp ?? MOCK_TIMESTAMP,
    }
    writeDiagnostics({ endpoint, provider, state, traceId: result.traceId, request })
    return result
  }

  writeDiagnostics({ endpoint, provider, state, traceId: mockTraceId, request })
  return {
    reminderId: reminder.id,
    orderNo: reminder.orderNo,
    status: fallbackStatus,
    message: '',
    traceId: mockTraceId,
    timestamp: MOCK_TIMESTAMP,
  }
}

function buildViewModel(
  query: AiGlobalDataQuery,
  provider: AiGlobalDataProvider,
  state: AiGlobalDataMockState,
  overviewEnvelope: Envelope<unknown>,
  reminderEnvelope: Envelope<unknown>,
  poiEnvelope: Envelope<unknown>,
  roomEnvelope: Envelope<unknown>,
  shopEnvelope: Envelope<unknown>,
  editionEnvelope: Envelope<unknown>,
  paymentEnvelope: Envelope<unknown>,
): AiGlobalDataViewModel {
  const overview = adaptOverview(overviewEnvelope.data)
  const reminders = adaptReminderPage(reminderEnvelope.data)
  const roomPage = adaptRoomPage(roomEnvelope.data)
  const stores = adaptStores(shopEnvelope.data)
  const poiOptions = adaptPoiOptions(poiEnvelope.data)
  const edition = adaptEdition(editionEnvelope.data)
  const paymentGroups = adaptPaymentGroups(paymentEnvelope.data)

  const metrics: AiGlobalSummaryMetric[] = [
    createMetric('new-order', '今日新增订单', overview.todayNewOrder, '单', '今日新增并已入池的订单数', query.campId),
    createMetric('check-in', '今日入住', overview.todayCheckIn, '单', '今日应入住且已完成状态推进的订单', query.campId),
    createMetric('check-out', '今日退房', overview.todayCheckOut, '单', '今日应退房并完成房态释放的订单', query.campId),
    createMetric('staying', '在住订单', overview.staying, '单', '当前所有在住客人的有效订单', query.campId),
    createMetric('pending', '待处理提醒', overview.pending, '条', '需要跟进的强提醒、巡检与未排房事项', query.campId),
    createMetric('exception', '异常订单', overview.exception, '条', '退款、未入住超时与连接器异常汇总', query.campId),
  ]

  const trend: AiGlobalTrendBar[] = [
    { id: 'new-order', label: '新增', value: overview.todayNewOrder, caption: `${overview.tomorrowCheckIn} 单明日入住`, tone: 'book' },
    { id: 'check-in', label: '入住', value: overview.todayCheckIn, caption: `${overview.todayCheckIn} 单已推进`, tone: 'checkin' },
    { id: 'check-out', label: '退房', value: overview.todayCheckOut, caption: `${overview.todayCheckOut} 单待复盘`, tone: 'checkout' },
    { id: 'risk', label: '风险', value: overview.pending + overview.exception + overview.refunding, caption: `${overview.refunding} 条退款关注`, tone: 'risk' },
  ]

  const requestContracts: Record<string, AiGlobalRequestContract> = {
    overview: { endpoint: AI_GLOBAL_DATA_OVERVIEW_ENDPOINT, request: createOverviewRequest(query), traceId: overviewEnvelope.traceId },
    reminders: { endpoint: AI_GLOBAL_DATA_REMINDERS_ENDPOINT, request: createReminderRequest(query), traceId: reminderEnvelope.traceId },
    poi: { endpoint: AI_GLOBAL_DATA_POI_ENDPOINT, request: createPoiRequest(query), traceId: poiEnvelope.traceId },
    rooms: { endpoint: AI_GLOBAL_DATA_ROOMS_ENDPOINT, request: createRoomRequest(query), traceId: roomEnvelope.traceId },
    shops: { endpoint: AI_GLOBAL_DATA_SHOPS_ENDPOINT, request: createShopRequest(query), traceId: shopEnvelope.traceId },
    edition: { endpoint: AI_GLOBAL_DATA_EDITION_ENDPOINT, request: createEditionRequest(query), traceId: editionEnvelope.traceId },
    payment: { endpoint: AI_GLOBAL_DATA_PAYMENT_ENDPOINT, request: createPaymentRequest(query), traceId: paymentEnvelope.traceId },
  }

  return {
    provider,
    state,
    traceId: `mock-${TASK_ID}-dashboard-001`,
    timestamp: overviewEnvelope.timestamp || MOCK_TIMESTAMP,
    query,
    filterOptions: {
      camps: poiOptions.length > 0 ? poiOptions : campOptions,
      channels: channelOptions,
      attentions: attentionOptions,
    },
    summary: metrics,
    trend,
    reminders: reminders.list,
    roomCategories: roomPage.list,
    stores,
    quickLinks,
    subscription: {
      title: edition.editionName,
      description: `${edition.resourceName} 已对齐真实站采集到的订单、强提醒、门店与房型契约，可直接承接经营闭环。`,
      actionText: '立即开通',
      priceText: edition.priceText,
      connectorProgress: edition.connectorProgress,
      editionName: edition.editionName,
      paymentHint: paymentGroups.join('、'),
    },
    requestContracts,
    isEmpty: roomPage.list.length === 0 && reminders.list.length === 0,
  }
}

function createMetric(
  id: string,
  label: string,
  value: number,
  unit: string,
  description: string,
  campId: string,
): AiGlobalSummaryMetric {
  const toneMap: Record<string, AiGlobalSummaryMetric['tone']> = {
    'new-order': 'blue',
    'check-in': 'teal',
    'check-out': 'gold',
    staying: 'green',
    pending: 'orange',
    exception: 'red',
  }
  return {
    id,
    label,
    value: String(value),
    unit,
    description,
    tone: toneMap[id] ?? 'blue',
    detailLines: [
      `指标口径：${description}`,
      `筛选门店：${findCampLabel(campId)}`,
      '取数来源：订单总览、强提醒和房型经营契约统一适配后展示。',
    ],
  }
}

function createMockOverviewEnvelope(query: AiGlobalDataQuery, state: AiGlobalDataMockState): Envelope<OverviewData> {
  if (state === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        todayNewOrder: 0,
        todayCheckIn: 0,
        todayCheckOut: 0,
        staying: 0,
        pending: 0,
        exception: 0,
        refunding: 0,
        tomorrowCheckIn: 0,
        tomorrowCheckOut: 0,
      },
      traceId: `mock-${TASK_ID}-overview-empty-001`,
      timestamp: MOCK_TIMESTAMP,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: overviewByCamp[query.campId] ?? overviewByCamp['camp-up-valley'],
    traceId: `mock-${TASK_ID}-overview-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createMockReminderEnvelope(query: AiGlobalDataQuery, state: AiGlobalDataMockState): Envelope<ReminderPageData> {
  const rows = state === 'empty' ? [] : filterReminders(reminderSeeds, query)
  return {
    code: 0,
    message: 'success',
    data: {
      list: rows,
      pagination: {
        pageNum: query.reminderPage,
        pageSize: query.reminderPageSize,
        total: rows.length,
      },
    },
    traceId: `mock-${TASK_ID}-${state === 'empty' ? 'reminders-empty' : 'reminders'}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createMockPoiEnvelope(query: AiGlobalDataQuery): Envelope<{ list: AiGlobalDataOption[]; pagination: { pageNum: number; pageSize: number; total: number } }> {
  const list =
    query.channel === 'all'
      ? campOptions
      : campOptions.filter((item) =>
          query.channel === 'ctrip' ? item.value !== 'camp-tianhe' : item.value !== 'camp-haizhu',
        )
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        pageNum: 1,
        pageSize: 999,
        total: list.length,
      },
    },
    traceId: `mock-${TASK_ID}-poi-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createMockRoomEnvelope(query: AiGlobalDataQuery, state: AiGlobalDataMockState): Envelope<RoomPageData> {
  const list = state === 'empty' ? [] : filterRooms(roomSeeds, query)
  return {
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        pageNum: 1,
        pageSize: 999,
        total: list.length,
      },
    },
    traceId: `mock-${TASK_ID}-${state === 'empty' ? 'rooms-empty' : 'rooms'}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createMockShopEnvelope(query: AiGlobalDataQuery, state: AiGlobalDataMockState): Envelope<AiGlobalStoreStatus[]> {
  const list = state === 'empty' ? [] : storeSeeds.filter((item) => item.campId === query.campId)
  return {
    code: 0,
    message: 'success',
    data: list,
    traceId: `mock-${TASK_ID}-${state === 'empty' ? 'shops-empty' : 'shops'}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createMockEditionEnvelope(): Envelope<EditionData> {
  return {
    code: 0,
    message: 'success',
    data: editionData,
    traceId: `mock-${TASK_ID}-edition-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createMockPaymentEnvelope(): Envelope<PaymentGroupData> {
  return {
    code: 0,
    message: 'success',
    data: paymentGroupData,
    traceId: `mock-${TASK_ID}-payment-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function filterReminders(rows: AiGlobalReminder[], query: AiGlobalDataQuery) {
  return rows.filter((row) => {
    if (row.campId !== query.campId) return false
    if (query.channel !== 'all' && row.channel !== query.channel) return false
    if (query.attention !== 'all' && row.level !== query.attention) return false
    return true
  })
}

function filterRooms(rows: AiGlobalRoomRow[], query: AiGlobalDataQuery) {
  const keyword = query.roomKeyword.trim()
  return rows.filter((row) => {
    if (row.campId !== query.campId) return false
    if (query.channel !== 'all' && !row.channels.includes(query.channel)) return false
    if (query.attention !== 'all' && row.riskLevel !== query.attention) return false
    if (keyword && !row.name.includes(keyword)) return false
    return true
  })
}

function createOverviewRequest(query: AiGlobalDataQuery) {
  return { campId: mapCampId(query.campId) }
}

function createReminderRequest(query: AiGlobalDataQuery) {
  return {
    campId: mapCampId(query.campId),
    pageNum: query.reminderPage,
    pageSize: query.reminderPageSize,
  }
}

function createPoiRequest(query: AiGlobalDataQuery) {
  return {
    campId: mapCampId(query.campId),
    pageSize: 999,
    pageNum: 1,
    channelId: query.channel === 'all' ? 0 : query.channel === 'ctrip' ? 1 : 2,
    isAvailability: '1',
  }
}

function createRoomRequest(query: AiGlobalDataQuery) {
  return {
    campId: mapCampId(query.campId),
    pageSize: 999,
    pageNum: 1,
    roomCategoryName: query.roomKeyword.trim(),
    keyword: query.roomKeyword.trim(),
    cityIds: [],
    channelId: query.channel === 'all' ? '' : query.channel,
  }
}

function createShopRequest(query: AiGlobalDataQuery) {
  return {
    campId: mapCampId(query.campId),
    status: 1,
  }
}

function createEditionRequest(query: AiGlobalDataQuery) {
  return { campId: mapCampId(query.campId) }
}

function createPaymentRequest(query: AiGlobalDataQuery) {
  return {
    campId: mapCampId(query.campId),
    bizTypes: [3],
    isEnable: 1,
  }
}

function createExportRequest(query: AiGlobalDataQuery) {
  return {
    ...createOverviewRequest(query),
    channel: query.channel,
    attention: query.attention,
    roomKeyword: query.roomKeyword.trim() || null,
  }
}

function findCampLabel(campId: string) {
  return campOptions.find((option) => option.value === campId)?.label ?? '当前门店'
}

function mapCampId(campId: string) {
  const campMap: Record<string, string> = {
    'camp-up-valley': '1796067693589061634',
    'camp-haizhu': '1796067693589061635',
    'camp-tianhe': '1796067693589061636',
  }
  return campMap[campId] ?? campMap['camp-up-valley']
}

function adaptOverview(value: unknown): OverviewData {
  const record = asRecord(value)
  return {
    todayNewOrder: readNumber(record?.todayNewOrder) ?? 0,
    todayCheckIn: readNumber(record?.todayCheckIn) ?? 0,
    todayCheckOut: readNumber(record?.todayCheckOut) ?? 0,
    staying: readNumber(record?.staying) ?? 0,
    pending: readNumber(record?.pending) ?? 0,
    exception: readNumber(record?.exception) ?? 0,
    refunding: readNumber(record?.refunding) ?? 0,
    tomorrowCheckIn: readNumber(record?.tomorrowCheckIn) ?? 0,
    tomorrowCheckOut: readNumber(record?.tomorrowCheckOut) ?? 0,
  }
}

function adaptReminderPage(value: unknown): ReminderPageData {
  const record = asRecord(value)
  const list = asArray(record?.list).map(adaptReminder).filter((item): item is AiGlobalReminder => Boolean(item))
  const paginationRecord = asRecord(record?.pagination)
  return {
    list,
    pagination: {
      pageNum: readNumber(paginationRecord?.pageNum) ?? 1,
      pageSize: readNumber(paginationRecord?.pageSize) ?? list.length,
      total: readNumber(paginationRecord?.total) ?? list.length,
    },
  }
}

function adaptPoiOptions(value: unknown) {
  const record = asRecord(value)
  const list = asArray(record?.list)
    .map((item) => {
      const row = asRecord(item)
      const label = readString(row?.label) ?? readString(row?.poiName)
      const value = readString(row?.value) ?? readString(row?.poiId)
      if (!label || !value) return null
      return { label, value }
    })
    .filter((item): item is AiGlobalDataOption => Boolean(item))
  return list
}

function adaptRoomPage(value: unknown): RoomPageData {
  const record = asRecord(value)
  const list = asArray(record?.list).map(adaptRoom).filter((item): item is AiGlobalRoomRow => Boolean(item))
  const paginationRecord = asRecord(record?.pagination)
  return {
    list,
    pagination: {
      pageNum: readNumber(paginationRecord?.pageNum) ?? 1,
      pageSize: readNumber(paginationRecord?.pageSize) ?? list.length,
      total: readNumber(paginationRecord?.total) ?? list.length,
    },
  }
}

function adaptStores(value: unknown) {
  return asArray(value).map(adaptStore).filter((item): item is AiGlobalStoreStatus => Boolean(item))
}

function adaptEdition(value: unknown): EditionData {
  const record = asRecord(value)
  return {
    editionName: readString(record?.editionName) ?? '全域雷达',
    resourceName: readString(record?.resourceName) ?? '门店经营数据连接器',
    priceText: readString(record?.priceText) ?? '￥1,908.48 / 年',
    connectorProgress: readString(record?.connectorProgress) ?? '2 / 3 门店已接入连接器',
  }
}

function adaptPaymentGroups(value: unknown) {
  const record = asRecord(value)
  return asArray(record?.paymentGroups)
    .flatMap((group) => {
      const groupRecord = asRecord(group)
      return asArray(groupRecord?.paymentTypes).map((item) => readString(asRecord(item)?.name)).filter(Boolean)
    })
    .filter((item): item is string => Boolean(item))
}

function adaptReminder(value: unknown): AiGlobalReminder | null {
  const record = asRecord(value)
  const id = readString(record?.id)
  const campId = readString(record?.campId)
  const title = readString(record?.title)
  const guestName = readString(record?.guestName)
  const roomName = readString(record?.roomName)
  const orderNo = readString(record?.orderNo)
  const dueAt = readString(record?.dueAt)
  if (!id || !campId || !title || !guestName || !roomName || !orderNo || !dueAt) return null
  return {
    id,
    campId,
    level: readReminderLevel(record?.level),
    title,
    guestName,
    roomName,
    orderNo,
    dueAt,
    channel: readBusinessChannel(record?.channel),
    status: readReminderStatus(record?.status),
    primaryAction: record?.primaryAction === 'status' ? 'status' : 'order',
    summary: readString(record?.summary) ?? '',
  }
}

function adaptRoom(value: unknown): AiGlobalRoomRow | null {
  const record = asRecord(value)
  const id = readString(record?.id)
  const campId = readString(record?.campId)
  const name = readString(record?.name)
  if (!id || !campId || !name) return null
  return {
    id,
    campId,
    city: readString(record?.city) ?? '广州',
    name,
    inventory: readNumber(record?.inventory) ?? 0,
    staying: readNumber(record?.staying) ?? 0,
    basePrice: readNumber(record?.basePrice) ?? 0,
    weekendPrice: readNumber(record?.weekendPrice) ?? 0,
    holidayPrice: readNumber(record?.holidayPrice) ?? 0,
    occupancyRate: readNumber(record?.occupancyRate) ?? 0,
    pendingOrders: readNumber(record?.pendingOrders) ?? 0,
    riskLevel: readReminderLevel(record?.riskLevel),
    channels: asArray(record?.channels).map((item) => readBusinessChannel(item)).filter(isBusinessChannel),
    lastSyncedAt: readString(record?.lastSyncedAt) ?? '2026-05-19 18:00',
  }
}

function adaptStore(value: unknown): AiGlobalStoreStatus | null {
  const record = asRecord(value)
  const id = readString(record?.id)
  const campId = readString(record?.campId)
  const name = readString(record?.name)
  if (!id || !campId || !name) return null
  return {
    id,
    campId,
    name,
    connectorStatus: readStoreConnectorStatus(record?.connectorStatus),
    radarStatus: readStoreRadarStatus(record?.radarStatus),
    authorizedChannels: asArray(record?.authorizedChannels).map((item) => String(item)),
    updatedAt: readString(record?.updatedAt) ?? '2026-05-19 18:00',
  }
}

function adaptRoomDetail(value: Record<string, unknown>, roomId: string): AiGlobalRoomDetail {
  return {
    roomId,
    roomName: readString(value.roomName) ?? '房型经营详情',
    occupancyRate: readNumber(value.occupancyRate) ?? 0,
    inventory: readNumber(value.inventory) ?? 0,
    staying: readNumber(value.staying) ?? 0,
    pendingOrders: readNumber(value.pendingOrders) ?? 0,
    channelPrices:
      asArray(value.channelPrices)
        .map((item) => {
          const row = asRecord(item)
          const label = readString(row?.label)
          if (!label) return null
          return {
            label,
            price: readNumber(row?.price) ?? 0,
            status: readString(row?.status) ?? '正常',
          }
        })
        .filter((item): item is AiGlobalRoomDetail['channelPrices'][number] => Boolean(item)) ?? [],
    guidance: asArray(value.guidance).map((item) => String(item)),
  }
}

function createRoomDetail(room: AiGlobalRoomRow): AiGlobalRoomDetail {
  return {
    roomId: room.id,
    roomName: room.name,
    occupancyRate: room.occupancyRate,
    inventory: room.inventory,
    staying: room.staying,
    pendingOrders: room.pendingOrders,
    channelPrices: [
      { label: '携程酒店', price: room.basePrice, status: room.channels.includes('ctrip') ? '已同步' : '未开通' },
      { label: '美团酒店', price: room.weekendPrice, status: room.channels.includes('meituan') ? '已同步' : '未开通' },
      { label: '节假日保护价', price: room.holidayPrice, status: '已启用' },
    ],
    guidance: [
      `当前库存 ${room.inventory} 间，在住 ${room.staying} 间，入住压力 ${room.occupancyRate}%。`,
      `待处理订单 ${room.pendingOrders} 单，建议优先核对 ${room.name} 的房态与渠道价差。`,
      '渠道价格已按统一契约适配，后续接后端时只需切换 provider。',
    ],
  }
}

async function postJson(url: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<ApiPayload> {
  const response = await fetch(toApiUrl(url), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  })
  const payload = await readJson(response)
  if (!response.ok || isFailedPayload(payload)) {
    throw new Error(readPayloadMessage(payload) ?? `全域数据请求失败（HTTP ${response.status}）`)
  }
  return payload
}


function toApiUrl(url: string) {
  return url.startsWith('/api/') ? url : `/api${url.startsWith('/') ? url : `/${url}`}`
}

function normalizeEnvelope(payload: ApiPayload, request: Record<string, unknown>): Envelope<unknown> {
  if (payload.code !== undefined && payload.code !== 0) {
    throw new Error(readPayloadMessage(payload) ?? '全域数据请求失败')
  }
  return {
    code: 0,
    message: 'success',
    data: payload.data ?? request,
    traceId: payload.traceId ?? `api-${TASK_ID}-${Math.random().toString(16).slice(2, 8)}`,
    timestamp: payload.timestamp ?? MOCK_TIMESTAMP,
  }
}

async function readJson(response: Response): Promise<ApiPayload> {
  try {
    return (await response.json()) as ApiPayload
  } catch {
    return {}
  }
}

function isFailedPayload(payload: ApiPayload) {
  if (payload.code !== undefined) return payload.code !== 0
  return payload.success === false
}

function readPayloadMessage(payload: ApiPayload) {
  return payload.message ?? payload.errorMsg ?? payload.errorCode ?? payload.errorDetail ?? null
}

function resolveProvider(): AiGlobalDataProvider {
  const configured = readRuntimeConfig('pms.aiGlobalDataProvider') || import.meta.env.VITE_AI_GLOBAL_DATA_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function resolveMockState(): AiGlobalDataMockState {
  const configured = readRuntimeConfig('pms.aiGlobalDataMockState') || import.meta.env.VITE_AI_GLOBAL_DATA_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function writeDiagnostics(diagnostics: {
  endpoint: string
  provider: AiGlobalDataProvider
  state: AiGlobalDataMockState
  traceId: string
  request: Record<string, unknown>
}) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('pms.aiGlobalData.lastRequest', JSON.stringify(diagnostics))
}

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
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

function readBusinessChannel(value: unknown): BusinessChannel {
  return value === 'meituan' ? 'meituan' : 'ctrip'
}

function isBusinessChannel(value: AiGlobalDataChannel): value is BusinessChannel {
  return value === 'ctrip' || value === 'meituan'
}

function readReminderLevel(value: unknown): BusinessAttention {
  return value === 'high' || value === 'medium' ? value : 'low'
}

function readReminderStatus(value: unknown): AiGlobalReminder['status'] {
  return value === 'postponed' || value === 'resolved' ? value : 'pending'
}

function readStoreConnectorStatus(value: unknown): AiGlobalStoreStatus['connectorStatus'] {
  return value === 'warning' || value === 'offline' ? value : 'online'
}

function readStoreRadarStatus(value: unknown): AiGlobalStoreStatus['radarStatus'] {
  return value === 'delay' || value === 'setup' ? value : 'running'
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('全域数据请求已取消', 'AbortError'))
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('全域数据请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
}
