export const WECHAT_SERVICE_REPORT_ENDPOINT = '/api/wxcp/kfAccount/report/get'
export const WECHAT_SERVICE_ACCOUNT_ENDPOINT = '/api/wxcp/kfAccount/page/get'
export const WECHAT_SERVICE_MOCK_ENDPOINT = '/scrm/wechatService/dashboard'
export const WECHAT_SERVICE_EXPORT_ENDPOINT = '/scrm/wechatService/export'

const TASK_ID = 'scrm--kehu-goutong--weixin-kefu'
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'

export type WechatServiceProvider = 'mock' | 'api'
export type WechatServiceMockState = 'success' | 'empty' | 'error'

export type WechatServiceQuery = {
  provider?: WechatServiceProvider
  mockState?: WechatServiceMockState
  campId: string
  startDate: string
  endDate: string
  channel: string
  status: string
  keyword: string
  page: number
  pageSize: number
}

export type WechatServiceOption = {
  label: string
  value: string
}

export type WechatServiceSummary = {
  todaySessions: number
  pendingSessions: number
  averageReplySeconds: number
  conversionLeads: number
  responseRate: string
}

export type WechatServiceAccount = {
  id: string
  name: string
  status: 'online' | 'busy' | 'offline'
  todaySessions: number
  averageReplySeconds: number
  serviceScore: number
}

export type WechatServiceConversation = {
  id: string
  customerName: string
  channel: string
  channelName: string
  status: string
  statusName: string
  orderStatus: string
  stayDate: string
  roomType: string
  lastMessage: string
  lastMessageAt: string
  assignee: string
  unread: number
}

export type WechatServiceTodo = {
  id: string
  title: string
  count: number
  action: string
}

export type WechatServiceViewModel = {
  summary: WechatServiceSummary
  accounts: WechatServiceAccount[]
  conversations: WechatServiceConversation[]
  todos: WechatServiceTodo[]
  filterOptions: {
    stores: WechatServiceOption[]
    channels: WechatServiceOption[]
    statuses: WechatServiceOption[]
  }
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  refreshedAt: string
}

export type WechatServiceDiagnostics = {
  endpoint: string
  provider: WechatServiceProvider
  state: WechatServiceMockState
  traceId: string
  request: Record<string, unknown>
}

export type WechatServiceResult = {
  view: WechatServiceViewModel
  diagnostics: WechatServiceDiagnostics
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type WechatServiceBackendData = {
  summary: Partial<WechatServiceSummary>
  accounts: Partial<WechatServiceAccount>[]
  conversations: Partial<WechatServiceConversation>[]
  todos: WechatServiceTodo[]
  dictionaries: WechatServiceViewModel['filterOptions']
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

type RawSuccessResponse = {
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
  data?: Record<string, unknown> | null
}

export async function fetchWechatServiceDashboard(
  query: WechatServiceQuery,
  signal?: AbortSignal,
): Promise<WechatServiceResult> {
  const provider = query.provider ?? resolveWechatServiceProvider()
  const request = buildWechatServiceRequest(query)
  const envelope =
    provider === 'api'
      ? await fetchApiWechatService(query, request, signal)
      : await fetchMockWechatService(query, request, signal)
  const data = unwrapEnvelope(envelope)
  const diagnostics: WechatServiceDiagnostics = {
    endpoint: provider === 'api' ? WECHAT_SERVICE_REPORT_ENDPOINT : WECHAT_SERVICE_MOCK_ENDPOINT,
    provider,
    state: query.mockState ?? readWechatServiceMockState(),
    traceId: envelope.traceId,
    request,
  }
  writeDiagnostics(diagnostics)

  return {
    view: {
      summary: adaptSummary(data.summary),
      accounts: data.accounts.map(adaptAccount),
      conversations: data.conversations.map(adaptConversation),
      todos: data.todos,
      filterOptions: data.dictionaries,
      pagination: data.pagination,
      refreshedAt: envelope.timestamp,
    },
    diagnostics,
  }
}

export function createWechatServiceExportTask(query: WechatServiceQuery) {
  const request = buildWechatServiceRequest(query)
  const diagnostics: WechatServiceDiagnostics = {
    endpoint: WECHAT_SERVICE_EXPORT_ENDPOINT,
    provider: query.provider ?? resolveWechatServiceProvider(),
    state: query.mockState ?? readWechatServiceMockState(),
    traceId: `mock-${TASK_ID}-export-001`,
    request,
  }
  writeDiagnostics(diagnostics)

  return {
    taskId: `EXPORT-${TASK_ID}-20260518-001`,
    traceId: diagnostics.traceId,
    timestamp: MOCK_TIMESTAMP,
  }
}

export function resolveWechatServiceRuntimeConfig(location: Pick<Location, 'search'>): Pick<WechatServiceQuery, 'provider' | 'mockState'> {
  const params = new URLSearchParams(location.search)
  const provider = params.get('wechatServiceProvider')
  const mockState = params.get('wechatServiceMockState')

  return {
    provider: provider === 'api' || provider === 'mock' ? provider : undefined,
    mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
  }
}

export function resolveWechatServiceProvider(): WechatServiceProvider {
  const configured = readRuntimeConfig('pms.wechatServiceProvider') || import.meta.env.VITE_WECHAT_SERVICE_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

export function getDefaultWechatServiceOptions() {
  return filterOptions
}

function readWechatServiceMockState(): WechatServiceMockState {
  const configured =
    readRuntimeConfig('pms.wechatServiceMockState') || import.meta.env.VITE_WECHAT_SERVICE_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

async function fetchMockWechatService(
  query: WechatServiceQuery,
  _request: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelope<WechatServiceBackendData>> {
  await delay(80, signal)

  const state = query.mockState ?? readWechatServiceMockState()
  if (state === 'error') {
    return {
      code: 50001,
      message: '微信客服数据加载失败，请重试',
      data: createBackendData([], query),
      traceId: `mock-${TASK_ID}-error-001`,
      timestamp: MOCK_TIMESTAMP,
    }
  }

  const rows = state === 'empty' ? [] : filterConversations(mockConversations, query)
  return {
    code: 0,
    message: 'success',
    data: createBackendData(rows, query),
    traceId: `mock-${TASK_ID}-${state === 'empty' ? 'empty' : 'list'}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

async function fetchApiWechatService(
  query: WechatServiceQuery,
  request: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelope<WechatServiceBackendData>> {
  const [reportPayload, accountPayload] = await Promise.all([
    fetchJson(WECHAT_SERVICE_REPORT_ENDPOINT, request, signal),
    fetchJson(WECHAT_SERVICE_ACCOUNT_ENDPOINT, { campId: query.campId, pageNum: 1, pageSize: 20 }, signal),
  ])

  if (reportPayload.success !== true) {
    return {
      code: 500,
      message: reportPayload.errorMsg || reportPayload.errorDetail || '微信客服数据加载失败，请重试',
      data: createBackendData([], query),
      traceId: `api-${TASK_ID}-business-error`,
      timestamp: new Date().toISOString(),
    }
  }

  const reportData = isRecord(reportPayload.data) ? reportPayload.data : {}
  const accountData = isRecord(accountPayload.data) ? accountPayload.data : {}
  const conversations = readArray(reportData.conversations).filter(isRecord)
  const accounts = readArray(accountData.list).filter(isRecord)

  return {
    code: 0,
    message: 'success',
    data: {
      summary: isRecord(reportData.summary) ? reportData.summary : {},
      accounts: accounts.map((account) => account as Partial<WechatServiceAccount>),
      conversations: conversations.map((conversation) => conversation as Partial<WechatServiceConversation>),
      todos: createTodos(conversations.length),
      dictionaries: filterOptions,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total: Number(reportData.total ?? conversations.length),
      },
    },
    traceId: `api-${TASK_ID}-dashboard`,
    timestamp: new Date().toISOString(),
  }
}

async function fetchJson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<RawSuccessResponse> {
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (error) {
    throw new Error(`微信客服数据加载失败，请重试：${error instanceof Error ? error.message : String(error)}`, {
      cause: error,
    })
  }

  if (!response.ok) {
    throw new Error(`微信客服数据加载失败，请重试：HTTP ${response.status}`)
  }

  return (await response.json()) as RawSuccessResponse
}

function buildWechatServiceRequest(query: WechatServiceQuery) {
  return {
    campId: query.campId,
    startDate: query.startDate,
    endDate: query.endDate,
    channel: query.channel,
    status: query.status,
    keyword: query.keyword,
    pageNum: query.page,
    pageSize: query.pageSize,
  }
}

function createBackendData(
  conversations: Partial<WechatServiceConversation>[],
  query: WechatServiceQuery,
): WechatServiceBackendData {
  return {
    summary: createSummary(conversations),
    accounts: mockAccounts,
    conversations,
    todos: createTodos(conversations.length),
    dictionaries: filterOptions,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: conversations.length,
    },
  }
}

function createSummary(conversations: Partial<WechatServiceConversation>[]) {
  const pendingCount = conversations.filter((item) => item.status === 'pendingCheckIn' || item.unread).length
  return {
    todaySessions: conversations.length === 0 ? 0 : 128,
    pendingSessions: pendingCount,
    averageReplySeconds: conversations.length === 0 ? 0 : 138,
    conversionLeads: conversations.length === 0 ? 0 : 23,
    responseRate: conversations.length === 0 ? '0%' : '96.8%',
  }
}

function createTodos(activeCount: number): WechatServiceTodo[] {
  return [
    { id: 'todo-unread', title: '待回复会话', count: Math.min(activeCount, 18), action: '优先处理最近未读咨询' },
    { id: 'todo-checkin', title: '待入住咨询', count: 6, action: '同步入住指引与门锁信息' },
    { id: 'todo-transfer', title: '需转接客服', count: 3, action: '分配给在线接待人员' },
  ]
}

function filterConversations(rows: Partial<WechatServiceConversation>[], query: WechatServiceQuery) {
  const keyword = query.keyword.trim().toLowerCase()
  return rows.filter((row) => {
    if (query.channel && row.channel !== query.channel) return false
    if (query.status && row.status !== query.status) return false
    if (!keyword) return true
    return [row.customerName, row.roomType, row.lastMessage, row.assignee, row.id]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
  })
}

function adaptSummary(summary: Partial<WechatServiceSummary>): WechatServiceSummary {
  return {
    todaySessions: readNumber(summary.todaySessions, 0),
    pendingSessions: readNumber(summary.pendingSessions, 0),
    averageReplySeconds: readNumber(summary.averageReplySeconds, 0),
    conversionLeads: readNumber(summary.conversionLeads, 0),
    responseRate: readString(summary.responseRate, '0%'),
  }
}

function adaptAccount(account: Partial<WechatServiceAccount>): WechatServiceAccount {
  const status = account.status === 'busy' || account.status === 'offline' ? account.status : 'online'
  return {
    id: readString(account.id, 'account-unknown'),
    name: readString(account.name, '-'),
    status,
    todaySessions: readNumber(account.todaySessions, 0),
    averageReplySeconds: readNumber(account.averageReplySeconds, 0),
    serviceScore: readNumber(account.serviceScore, 0),
  }
}

function adaptConversation(conversation: Partial<WechatServiceConversation>): WechatServiceConversation {
  const channel = readString(conversation.channel, '')
  const status = readString(conversation.status, '')
  return {
    id: readString(conversation.id, 'WS-CV-UNKNOWN'),
    customerName: readString(conversation.customerName, '-'),
    channel,
    channelName: channelLabels[channel] ?? readString(conversation.channelName, '-'),
    status,
    statusName: statusLabels[status] ?? readString(conversation.statusName, '-'),
    orderStatus: readString(conversation.orderStatus, '-'),
    stayDate: readString(conversation.stayDate, '-'),
    roomType: readString(conversation.roomType, '-'),
    lastMessage: readString(conversation.lastMessage, '-'),
    lastMessageAt: readString(conversation.lastMessageAt, '-'),
    assignee: readString(conversation.assignee, '-'),
    unread: readNumber(conversation.unread, 0),
  }
}

function unwrapEnvelope<T>(envelope: ApiEnvelope<T>) {
  if (envelope.code !== 0) {
    writeDiagnostics({
      endpoint: WECHAT_SERVICE_MOCK_ENDPOINT,
      provider: resolveWechatServiceProvider(),
      state: readWechatServiceMockState(),
      traceId: envelope.traceId,
      request: {},
    })
    throw new Error(envelope.message || '微信客服数据加载失败，请重试')
  }

  return envelope.data
}

function writeDiagnostics(diagnostics: WechatServiceDiagnostics) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('pms.wechatService.lastRequest', JSON.stringify(diagnostics))
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function readString(value: unknown, fallback: string) {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function readNumber(value: unknown, fallback: number) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object')
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('微信客服请求已取消', 'AbortError'))
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('微信客服请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
}

const filterOptions = {
  stores: [{ label: '天落会宿公寓(前海壹方城宝安中心店)', value: '1796067693589061634' }],
  channels: [
    { label: '全部渠道', value: '' },
    { label: '途家', value: 'tujia' },
    { label: '美团民宿', value: 'meituan' },
    { label: '小猪', value: 'xiaozhu' },
    { label: '携程民宿', value: 'ctrip' },
  ],
  statuses: [
    { label: '全部状态', value: '' },
    { label: '咨询中', value: 'consulting' },
    { label: '待入住', value: 'pendingCheckIn' },
    { label: '入住中', value: 'checkedIn' },
    { label: '已取消', value: 'cancelled' },
  ],
}

const channelLabels: Record<string, string> = {
  tujia: '途家',
  meituan: '美团民宿',
  xiaozhu: '小猪',
  ctrip: '携程民宿',
}

const statusLabels: Record<string, string> = {
  consulting: '咨询中',
  pendingCheckIn: '待入住',
  checkedIn: '入住中',
  cancelled: '已取消',
}

const mockAccounts: Partial<WechatServiceAccount>[] = [
  {
    id: 'KF-001',
    name: '天落会宿公寓',
    status: 'online',
    todaySessions: 52,
    averageReplySeconds: 74,
    serviceScore: 98,
  },
  {
    id: 'KF-002',
    name: '夜班接待',
    status: 'busy',
    todaySessions: 43,
    averageReplySeconds: 112,
    serviceScore: 94,
  },
  {
    id: 'KF-003',
    name: '订单跟进',
    status: 'online',
    todaySessions: 33,
    averageReplySeconds: 126,
    serviceScore: 96,
  },
]

const mockConversations: Partial<WechatServiceConversation>[] = [
  {
    id: 'WS-CV-001',
    customerName: '携程民宿-【M335275070】',
    channel: 'tujia',
    status: 'consulting',
    orderStatus: '咨询中',
    stayDate: '2026-05-18 至 2026-05-20',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    lastMessage: '房:加了',
    lastMessageAt: '2026-05-18 09:35:00',
    assignee: '天落会宿公寓',
    unread: 2,
  },
  {
    id: 'WS-CV-002',
    customerName: '携程民宿-【M566739056】',
    channel: 'tujia',
    status: 'consulting',
    orderStatus: '咨询中',
    stayDate: '2026-05-21 至 2026-05-22',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    lastMessage: '房:已办理退房',
    lastMessageAt: '2026-05-18 09:22:00',
    assignee: '订单跟进',
    unread: 0,
  },
  {
    id: 'WS-CV-003',
    customerName: '去哪民宿-【dukx6737】',
    channel: 'tujia',
    status: 'consulting',
    orderStatus: '咨询中',
    stayDate: '2026-05-22 至 2026-05-24',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    lastMessage: '房:您留个绿色号加您',
    lastMessageAt: '2026-05-18 08:51:00',
    assignee: '天落会宿公寓',
    unread: 1,
  },
  {
    id: 'WS-CV-004',
    customerName: 'Dr陈先森',
    channel: 'meituan',
    status: 'checkedIn',
    orderStatus: '入住中',
    stayDate: '2026-05-18 至 2026-05-19',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    lastMessage: '房:可以了',
    lastMessageAt: '2026-05-18 08:16:00',
    assignee: '夜班接待',
    unread: 0,
  },
  {
    id: 'WS-CV-005',
    customerName: '妍蜥',
    channel: 'xiaozhu',
    status: 'consulting',
    orderStatus: '咨询中',
    stayDate: '2026-05-25 至 2026-05-26',
    roomType: '天落大床电竞套间',
    lastMessage: '房:682777',
    lastMessageAt: '2026-05-18 07:55:00',
    assignee: '订单跟进',
    unread: 0,
  },
  {
    id: 'WS-CV-006',
    customerName: 'Abraham160',
    channel: 'meituan',
    status: 'pendingCheckIn',
    orderStatus: '待入住',
    stayDate: '2026-05-18 至 2026-05-19',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    lastMessage: '客:暂不支持房客招呼消息，请发送入住指引',
    lastMessageAt: '2026-05-18 07:36:00',
    assignee: '夜班接待',
    unread: 3,
  },
  {
    id: 'WS-CV-007',
    customerName: '风中少年',
    channel: 'meituan',
    status: 'cancelled',
    orderStatus: '已取消',
    stayDate: '2026-05-19 至 2026-05-20',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    lastMessage: '房:同意了',
    lastMessageAt: '2026-05-18 07:20:00',
    assignee: '订单跟进',
    unread: 0,
  },
]
