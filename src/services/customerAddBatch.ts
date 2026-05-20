const TASK_ID = 'scrm--zengzhang-huoke--piliang-jiahaoyou'
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'

export const CUSTOMER_ADD_BATCH_MOCK_ENDPOINT = '/customer/addBatch/dashboard/get'
export const CUSTOMER_ADD_BATCH_EXPORT_ENDPOINT = '/customer/addBatch/export/create'
export const CUSTOMER_ADD_BATCH_SMS_ENDPOINT = '/customer/addBatch/sms/send'
export const CUSTOMER_ADD_BATCH_MARK_ENDPOINT = '/customer/addBatch/friend/mark'
export const CUSTOMER_ADD_BATCH_TARGET_RESOURCE_ENDPOINT = 'https://hudson-prod.localhome.cn/edition/resource/get'

export type CustomerAddBatchProvider = 'mock' | 'api'
export type CustomerAddBatchMockState = 'success' | 'empty' | 'error'

export type CustomerAddBatchQuery = {
  provider?: CustomerAddBatchProvider
  mockState?: CustomerAddBatchMockState
  storeId: string
  dateStart: string
  dateEnd: string
  channel: string
  friendStatus: string
  page: number
  pageSize: number
}

export type CustomerAddBatchOption = {
  label: string
  value: string
}

export type CustomerAddBatchMetric = {
  key: string
  label: string
  value: string
  unit: string
  description: string
}

export type CustomerAddBatchCandidate = {
  id: string
  customerName: string
  maskedPhone: string
  sourceChannel: string
  roomName: string
  orderDate: string
  lastMessage: string
  friendStatus: '待添加' | '短信已发送' | '已添加' | '已跳过'
  smsStatus: '未发送' | '已发送' | '已确认'
  suggestion: string
}

export type CustomerAddBatchTask = {
  id: string
  name: string
  scope: string
  status: '进行中' | '待执行' | '已完成'
  targetCount: number
  sentCount: number
  addedCount: number
  owner: string
  updatedAt: string
}

export type CustomerAddBatchTrend = {
  date: string
  candidates: number
  sent: number
  added: number
}

export type CustomerAddBatchViewModel = {
  provider: CustomerAddBatchProvider
  state: CustomerAddBatchMockState
  endpoint: string
  traceId: string
  timestamp: string
  request: Record<string, unknown>
  storeOptions: CustomerAddBatchOption[]
  channelOptions: CustomerAddBatchOption[]
  statusOptions: CustomerAddBatchOption[]
  metrics: CustomerAddBatchMetric[]
  candidates: CustomerAddBatchCandidate[]
  tasks: CustomerAddBatchTask[]
  trend: CustomerAddBatchTrend[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  routeTargets: {
    customerList: string
    customerTag: string
    staffList: string
    paymentDetail: string
  }
  subscription: {
    title: string
    description: string
    priceText: string
    actionText: string
  }
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type CustomerAddBatchBackendData = Omit<
  CustomerAddBatchViewModel,
  'provider' | 'state' | 'endpoint' | 'traceId' | 'timestamp'
>

export function resolveCustomerAddBatchRuntimeConfig(
  location: Location,
): Pick<CustomerAddBatchQuery, 'provider' | 'mockState'> {
  const params = new URLSearchParams(location.search)
  const provider = params.get('customerAddBatchProvider')
  const mockState = params.get('customerAddBatchMockState')

  return {
    provider: provider === 'api' || provider === 'mock' ? provider : undefined,
    mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
  }
}

export function getDefaultCustomerAddBatchQuery(
  overrides: Pick<CustomerAddBatchQuery, 'provider' | 'mockState'> = {},
): CustomerAddBatchQuery {
  return {
    provider: overrides.provider,
    mockState: overrides.mockState,
    storeId: '1796067693589061634',
    dateStart: '',
    dateEnd: '',
    channel: '',
    friendStatus: '',
    page: 1,
    pageSize: 20,
  }
}

export async function fetchCustomerAddBatchDashboard(
  query: CustomerAddBatchQuery,
  signal?: AbortSignal,
): Promise<CustomerAddBatchViewModel> {
  const provider = query.provider ?? resolveCustomerAddBatchProvider()
  const envelope = provider === 'api' ? await fetchApiDashboard(query, signal) : await fetchMockDashboard(query, signal)
  const data = unwrapEnvelope(envelope)

  return {
    provider,
    state: query.mockState ?? readCustomerAddBatchMockState(),
    endpoint: provider === 'api' ? CUSTOMER_ADD_BATCH_TARGET_RESOURCE_ENDPOINT : CUSTOMER_ADD_BATCH_MOCK_ENDPOINT,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    ...data,
  }
}

export function createCustomerAddBatchExportTask(query: CustomerAddBatchQuery) {
  const request = buildRequest(query)
  writeDiagnostics({
    endpoint: CUSTOMER_ADD_BATCH_EXPORT_ENDPOINT,
    provider: query.provider ?? resolveCustomerAddBatchProvider(),
    state: query.mockState ?? readCustomerAddBatchMockState(),
    traceId: `mock-${TASK_ID}-export-001`,
    request,
  })

  return {
    taskId: `EXPORT-${TASK_ID}-20260518-001`,
    traceId: `mock-${TASK_ID}-export-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

export function createCustomerAddBatchSmsTask(candidate: CustomerAddBatchCandidate, query: CustomerAddBatchQuery) {
  writeDiagnostics({
    endpoint: CUSTOMER_ADD_BATCH_SMS_ENDPOINT,
    provider: query.provider ?? resolveCustomerAddBatchProvider(),
    state: query.mockState ?? readCustomerAddBatchMockState(),
    traceId: `mock-${TASK_ID}-sms-001`,
    request: {
      ...buildRequest(query),
      candidateId: candidate.id,
      smsTemplate: 'batch-add-friend-invite',
    },
  })
}

export function createCustomerAddBatchMarkTask(candidate: CustomerAddBatchCandidate, query: CustomerAddBatchQuery) {
  writeDiagnostics({
    endpoint: CUSTOMER_ADD_BATCH_MARK_ENDPOINT,
    provider: query.provider ?? resolveCustomerAddBatchProvider(),
    state: query.mockState ?? readCustomerAddBatchMockState(),
    traceId: `mock-${TASK_ID}-mark-001`,
    request: {
      ...buildRequest(query),
      candidateId: candidate.id,
      friendStatus: '已添加',
    },
  })
}

function resolveCustomerAddBatchProvider(): CustomerAddBatchProvider {
  const configured = readRuntimeConfig('pms.customerAddBatchProvider') || import.meta.env.VITE_CUSTOMER_ADD_BATCH_PROVIDER
  return configured === 'api' ? 'api' : 'mock'
}

function readCustomerAddBatchMockState(): CustomerAddBatchMockState {
  const configured = readRuntimeConfig('pms.customerAddBatchMockState') || import.meta.env.VITE_CUSTOMER_ADD_BATCH_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

async function fetchMockDashboard(
  query: CustomerAddBatchQuery,
  signal?: AbortSignal,
): Promise<ApiEnvelope<CustomerAddBatchBackendData>> {
  await delay(80, signal)

  const state = query.mockState ?? readCustomerAddBatchMockState()
  if (state === 'error') {
    return {
      code: 50039,
      message: '批量加好友数据加载失败，请重试',
      data: createBackendData(query, []),
      traceId: `mock-${TASK_ID}-error-001`,
      timestamp: MOCK_TIMESTAMP,
    }
  }

  const candidates = state === 'empty' ? [] : filterCandidates(mockCandidates, query)
  return {
    code: 0,
    message: 'success',
    data: createBackendData(query, candidates),
    traceId: `mock-${TASK_ID}-${state === 'empty' ? 'empty' : 'dashboard'}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

async function fetchApiDashboard(
  query: CustomerAddBatchQuery,
  signal?: AbortSignal,
): Promise<ApiEnvelope<CustomerAddBatchBackendData>> {
  await delay(1, signal)
  writeDiagnostics({
    endpoint: CUSTOMER_ADD_BATCH_TARGET_RESOURCE_ENDPOINT,
    provider: 'api',
    state: query.mockState ?? readCustomerAddBatchMockState(),
    traceId: `api-${TASK_ID}-dashboard-pending`,
    request: buildRequest(query),
  })
  throw new Error('批量加好友数据加载失败，请稍后重试')
}

function createBackendData(
  query: CustomerAddBatchQuery,
  candidates: CustomerAddBatchCandidate[],
): CustomerAddBatchBackendData {
  const total = candidates.length || (query.mockState === 'empty' ? 0 : mockCandidates.length)

  return {
    request: buildRequest(query),
    storeOptions,
    channelOptions,
    statusOptions,
    metrics: [
      metric('candidate', '预计可加好友', query.mockState === 'empty' ? 0 : 126, '人', '近 30 天有效订单客户'),
      metric('sent', '短信触达', query.mockState === 'empty' ? 0 : 84, '人', '已下发引导添加企微短信的客户'),
      metric('added', '已添加', query.mockState === 'empty' ? 0 : 52, '人', '已完成企微好友添加的客户'),
      metric('rate', '转化率', candidates.length > 0 ? '41.3' : '0', '%', '已添加人数 / 预计可加好友人数'),
    ],
    candidates,
    tasks: candidates.length === 0 ? [] : mockTasks,
    trend: candidates.length === 0 ? [] : mockTrend,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total,
    },
    routeTargets: {
      customerList: '/customer/list',
      customerTag: '/customer/tag',
      staffList: '/customer/staffList',
      paymentDetail: '/version/applicationPayment/detail',
    },
    subscription: {
      title: '企微SCRM-批量加好友',
      description: '客户下单后获取到客户手机号，若该手机号未添加企业微信客户，则可下发添加好友短信，引导客户通过短信添加企业微信。',
      priceText: '限时免费',
      actionText: '立即开通',
    },
  }
}

function buildRequest(query: CustomerAddBatchQuery) {
  return {
    storeId: query.storeId,
    dateStart: query.dateStart,
    dateEnd: query.dateEnd,
    sourceChannel: query.channel,
    friendStatus: query.friendStatus,
    pageNum: query.page,
    pageSize: query.pageSize,
  }
}

function filterCandidates(rows: CustomerAddBatchCandidate[], query: CustomerAddBatchQuery) {
  return rows.filter((row) => {
    if (query.channel && row.sourceChannel !== query.channel) return false
    if (query.friendStatus && row.friendStatus !== query.friendStatus) return false
    return true
  })
}

function metric(key: string, label: string, value: string | number, unit: string, description: string): CustomerAddBatchMetric {
  return {
    key,
    label,
    value: String(value),
    unit,
    description,
  }
}

function unwrapEnvelope<T>(envelope: ApiEnvelope<T>) {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '批量加好友数据加载失败，请重试')
  }
  return envelope.data
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function writeDiagnostics(diagnostics: {
  endpoint: string
  provider: CustomerAddBatchProvider
  state: CustomerAddBatchMockState
  traceId: string
  request: Record<string, unknown>
}) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('pms.customerAddBatch.lastRequest', JSON.stringify(diagnostics))
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('批量加好友请求已取消', 'AbortError'))
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('批量加好友请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
}

const storeOptions: CustomerAddBatchOption[] = [
  { label: '天落会宿公寓(前海壹方城宝安中心店)', value: '1796067693589061634' },
  { label: '全部门店', value: '' },
]

const channelOptions: CustomerAddBatchOption[] = [
  { label: '全部渠道', value: '' },
  { label: '途家', value: '途家' },
  { label: '美团民宿', value: '美团民宿' },
  { label: '小猪', value: '小猪' },
  { label: '携程', value: '携程' },
]

const statusOptions: CustomerAddBatchOption[] = [
  { label: '全部状态', value: '' },
  { label: '待添加', value: '待添加' },
  { label: '短信已发送', value: '短信已发送' },
  { label: '已添加', value: '已添加' },
  { label: '已跳过', value: '已跳过' },
]

const mockCandidates: CustomerAddBatchCandidate[] = [
  {
    id: 'CAB-001',
    customerName: '携程民宿-【M335275070】',
    maskedPhone: '136****8277',
    sourceChannel: '携程',
    roomName: '顶层套房（浴缸巨幕电竞麻将）',
    orderDate: '2026-02-03',
    lastMessage: '房:加了',
    friendStatus: '待添加',
    smsStatus: '未发送',
    suggestion: '您好，入住指引和门锁密码会通过企业微信同步给您，点击短信链接即可添加管家企微。',
  },
  {
    id: 'CAB-002',
    customerName: '去哪民宿-【dukx6737】',
    maskedPhone: '181****1382',
    sourceChannel: '途家',
    roomName: '顶层套房（浴缸巨幕电竞麻将）',
    orderDate: '2026-02-05',
    lastMessage: '房:您留个绿色号加您',
    friendStatus: '短信已发送',
    smsStatus: '已发送',
    suggestion: '提醒客户通过短信添加管家企微，便于发送入住路线和押金提醒。',
  },
  {
    id: 'CAB-003',
    customerName: 'Ludwig',
    maskedPhone: '159****2908',
    sourceChannel: '美团民宿',
    roomName: '顶层套房（浴缸巨幕电竞麻将）',
    orderDate: '2025-10-20',
    lastMessage: '房:请问有什么可以帮到您',
    friendStatus: '待添加',
    smsStatus: '未发送',
    suggestion: '可用入住前关怀话术引导客户添加企业微信。',
  },
  {
    id: 'CAB-004',
    customerName: '携程民宿-【M362021381】',
    maskedPhone: '138****5369',
    sourceChannel: '携程',
    roomName: '总裁套间（桑拿浴缸露台电竞麻将）',
    orderDate: '2025-12-31',
    lastMessage: '房:您绿色号多少 加发您',
    friendStatus: '已添加',
    smsStatus: '已确认',
    suggestion: '客户已添加企微，可进入客户标签补充分层。',
  },
]

const mockTasks: CustomerAddBatchTask[] = [
  {
    id: 'TASK-20260518-001',
    name: '春节前未加企微客户补触达',
    scope: '近 30 天有效订单客户',
    status: '进行中',
    targetCount: 126,
    sentCount: 84,
    addedCount: 52,
    owner: '路客云6TS5',
    updatedAt: '2026-05-18 10:00',
  },
  {
    id: 'TASK-20260518-002',
    name: '高价值客户二次添加',
    scope: '累计消费大于 500 元客户',
    status: '待执行',
    targetCount: 38,
    sentCount: 0,
    addedCount: 0,
    owner: '超级管理员',
    updatedAt: '2026-05-18 09:20',
  },
]

const mockTrend: CustomerAddBatchTrend[] = [
  { date: '05-12', candidates: 22, sent: 18, added: 9 },
  { date: '05-13', candidates: 28, sent: 20, added: 12 },
  { date: '05-14', candidates: 19, sent: 15, added: 8 },
  { date: '05-15', candidates: 31, sent: 21, added: 14 },
  { date: '05-16', candidates: 26, sent: 16, added: 10 },
  { date: '05-17', candidates: 34, sent: 24, added: 16 },
  { date: '05-18', candidates: 29, sent: 22, added: 13 },
]
