export type CustomerMarketingProviderName = 'mock' | 'real'
type CustomerMarketingMockMode = 'success' | 'empty' | 'error'

export type CustomerMarketingQuery = {
  date: string
  storeId: string
  channel: string
  stage: string
  keyword: string
  page?: number
  pageSize?: number
}

export type CustomerMarketingOption = {
  id: string
  name: string
}

export type CustomerMarketingMetric = {
  id: string
  label: string
  value: number
  unit: string
  trend: string
  status: 'healthy' | 'watch' | 'risk'
}

export type CustomerMarketingCampaign = {
  id: string
  name: string
  channel: string
  status: 'running' | 'scheduled' | 'paused'
  audience: number
  conversionRate: string
  owner: string
  nextAction: string
}

export type CustomerMarketingLead = {
  id: string
  customerName: string
  channel: string
  stage: string
  lastTouch: string
  nextStep: string
  owner: string
}

export type CustomerMarketingTodo = {
  id: string
  title: string
  dueText: string
  priority: string
  source: string
}

export type CustomerMarketingData = {
  provider: CustomerMarketingProviderName
  filters: {
    stores: CustomerMarketingOption[]
    channels: CustomerMarketingOption[]
    stages: CustomerMarketingOption[]
  }
  metrics: CustomerMarketingMetric[]
  campaigns: CustomerMarketingCampaign[]
  funnel: Array<{ label: string; value: number }>
  todos: CustomerMarketingTodo[]
  leads: {
    list: CustomerMarketingLead[]
    pagination: {
      page: number
      pageSize: number
      total: number
    }
  }
  quickLinks: Array<{ label: string; path: string }>
  updatedAt: string
  requestSummary: string[]
  traceId: string
  timestamp: string
}

type CustomerMarketingEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type CustomerMarketingEnvelopeData = Omit<CustomerMarketingData, 'provider' | 'requestSummary' | 'traceId' | 'timestamp'>

const realBaseUrl = 'https://hudson-prod.localhome.cn'
const overviewEndpoint = '/scrm/marketing/customer/overview'

const filterOptions = {
  stores: [
    { id: 'all', name: '全部门店' },
    { id: 'store-qianhai', name: '天落会宿公寓(前海壹方城宝安中心店)' },
  ],
  channels: [
    { id: 'all', name: '全部渠道' },
    { id: 'wechat', name: '企微私域' },
    { id: 'coupon', name: '优惠券' },
    { id: 'order', name: '订单客户' },
  ],
  stages: [
    { id: 'all', name: '全部阶段' },
    { id: 'new', name: '新客转化' },
    { id: 'retention', name: '复购维护' },
    { id: 'sleeping', name: '沉睡唤醒' },
  ],
} satisfies CustomerMarketingEnvelopeData['filters']

const mockCampaigns: CustomerMarketingCampaign[] = [
  {
    id: 'campaign-sleeping',
    name: '沉睡客户唤醒',
    channel: '企微私域',
    status: 'running',
    audience: 368,
    conversionRate: '16.8%',
    owner: 'SCRM运营',
    nextAction: '查看详情',
  },
  {
    id: 'campaign-retention',
    name: '复购维护名单',
    channel: '优惠券',
    status: 'scheduled',
    audience: 126,
    conversionRate: '22.4%',
    owner: '会员运营',
    nextAction: '查看详情',
  },
  {
    id: 'campaign-new',
    name: '新客首住转化',
    channel: '订单客户',
    status: 'running',
    audience: 214,
    conversionRate: '11.3%',
    owner: '前台主管',
    nextAction: '查看详情',
  },
]

const mockLeads: CustomerMarketingLead[] = [
  {
    id: 'lead-001',
    customerName: '陈家辉',
    channel: '企微私域',
    stage: '复购维护',
    lastTouch: '2026-05-18 09:42',
    nextStep: '发送周末套房券',
    owner: 'SCRM运营',
  },
  {
    id: 'lead-002',
    customerName: '携程民宿-M335275070',
    channel: '订单客户',
    stage: '新客转化',
    lastTouch: '2026-05-18 09:20',
    nextStep: '确认入住偏好',
    owner: '前台主管',
  },
  {
    id: 'lead-003',
    customerName: '去哪儿用户-owen9629',
    channel: '优惠券',
    stage: '沉睡唤醒',
    lastTouch: '2026-05-17 18:15',
    nextStep: '推送电竞套房回流券',
    owner: '会员运营',
  },
]

export async function loadCustomerMarketingData(
  query: CustomerMarketingQuery,
  signal?: AbortSignal,
): Promise<CustomerMarketingData> {
  if (resolveProvider() === 'real') {
    return loadRealCustomerMarketingData(query, signal)
  }

  await waitForMockLatency(signal)
  const envelope = buildMockEnvelope(query)
  return adaptEnvelope(envelope, query, 'mock')
}

export function getCustomerMarketingProviderName(): CustomerMarketingProviderName {
  return resolveProvider()
}

function resolveProvider(): CustomerMarketingProviderName {
  const configured = readRuntimeConfig('pms.customerMarketingProvider') || import.meta.env.VITE_CUSTOMER_MARKETING_PROVIDER
  return configured === 'real' ? 'real' : 'mock'
}

function resolveMockMode(): CustomerMarketingMockMode {
  const configured =
    readRuntimeConfig('pms.customerMarketingMockMode') || import.meta.env.VITE_CUSTOMER_MARKETING_MOCK_MODE
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

function buildMockEnvelope(query: CustomerMarketingQuery): CustomerMarketingEnvelope<CustomerMarketingEnvelopeData | null> {
  const mode = resolveMockMode()
  if (mode === 'error') {
    return {
      code: 50042,
      message: 'customer marketing service failed',
      data: null,
      traceId: 'mock-scrm--yingxiao-tuiguang--kehu-yingxiao-error-001',
      timestamp: '2026-05-18T10:00:00+08:00',
    }
  }

  const campaigns = mode === 'empty' ? [] : filterCampaigns(mockCampaigns, query)
  const leads = mode === 'empty' ? [] : filterLeads(mockLeads, query)

  return {
    code: 0,
    message: 'success',
    data: {
      filters: filterOptions,
      metrics:
        mode === 'empty'
          ? [
              { id: 'active', label: '活跃客户', value: 0, unit: '人', trend: '当前条件暂无数据', status: 'healthy' },
              { id: 'touch', label: '触达客户', value: 0, unit: '人', trend: '当前条件暂无数据', status: 'watch' },
              { id: 'deal', label: '转化订单', value: 0, unit: '单', trend: '当前条件暂无数据', status: 'healthy' },
              { id: 'todo', label: '待跟进', value: 0, unit: '项', trend: '当前条件暂无数据', status: 'risk' },
            ]
          : [
              { id: 'active', label: '活跃客户', value: 708, unit: '人', trend: '+12.6%', status: 'healthy' },
              { id: 'touch', label: '触达客户', value: 423, unit: '人', trend: '+8.1%', status: 'watch' },
              { id: 'deal', label: '转化订单', value: 56, unit: '单', trend: '+6.4%', status: 'healthy' },
              { id: 'todo', label: '待跟进', value: 9, unit: '项', trend: '3项今日到期', status: 'risk' },
            ],
      campaigns,
      funnel: mode === 'empty' ? [] : [
        { label: '圈选客户', value: 708 },
        { label: '触达客户', value: 423 },
        { label: '有效咨询', value: 138 },
        { label: '形成订单', value: 56 },
      ],
      todos:
        mode === 'empty'
          ? []
          : [
              { id: 'todo-1', title: '跟进高价值复购客', dueText: '今日 18:00', priority: '高', source: '企微私域' },
              { id: 'todo-2', title: '确认沉睡客户优惠券库存', dueText: '今日', priority: '中', source: '优惠券' },
              { id: 'todo-3', title: '复盘新客首住转化活动', dueText: '明日 10:00', priority: '中', source: '订单客户' },
            ],
      leads: {
        list: leads,
        pagination: { page: query.page ?? 1, pageSize: query.pageSize ?? 20, total: leads.length },
      },
      quickLinks: [
        { label: '客户列表', path: '/customer/list' },
        { label: '客户标签', path: '/customer/tag' },
        { label: '优惠券', path: '/mallManagement/couponMgt' },
        { label: '住宿订单', path: '/order/house-order/list' },
      ],
      updatedAt: '2026-05-18 10:00',
    },
    traceId:
      mode === 'empty'
        ? 'mock-scrm--yingxiao-tuiguang--kehu-yingxiao-empty-001'
        : 'mock-scrm--yingxiao-tuiguang--kehu-yingxiao-overview-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function filterCampaigns(campaigns: CustomerMarketingCampaign[], query: CustomerMarketingQuery) {
  const keyword = query.keyword.trim()
  return campaigns.filter((item) => {
    if (query.channel !== 'all' && !item.channel.includes(findOptionName(filterOptions.channels, query.channel))) return false
    if (query.stage === 'retention' && !item.name.includes('复购')) return false
    if (query.stage === 'sleeping' && !item.name.includes('沉睡')) return false
    if (query.stage === 'new' && !item.name.includes('新客')) return false
    if (keyword && !item.name.includes(keyword)) return false
    return true
  })
}

function filterLeads(leads: CustomerMarketingLead[], query: CustomerMarketingQuery) {
  const keyword = query.keyword.trim()
  return leads.filter((item) => {
    if (query.channel !== 'all' && item.channel !== findOptionName(filterOptions.channels, query.channel)) return false
    if (query.stage !== 'all' && item.stage !== findOptionName(filterOptions.stages, query.stage)) return false
    if (keyword && !`${item.customerName}${item.channel}${item.stage}`.includes(keyword)) return false
    return true
  })
}

function findOptionName(options: CustomerMarketingOption[], id: string) {
  return options.find((item) => item.id === id)?.name ?? ''
}

function adaptEnvelope(
  envelope: CustomerMarketingEnvelope<CustomerMarketingEnvelopeData | null>,
  query: CustomerMarketingQuery,
  provider: CustomerMarketingProviderName,
): CustomerMarketingData {
  if (envelope.code !== 0 || !envelope.data) {
    throw new Error(envelope.message || '客户营销数据加载失败，请稍后重试')
  }

  return {
    ...envelope.data,
    provider,
    requestSummary: buildRequestSummary(query, envelope.traceId),
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
  }
}

async function loadRealCustomerMarketingData(
  query: CustomerMarketingQuery,
  signal?: AbortSignal,
): Promise<CustomerMarketingData> {
  const envelope = await postUnified<CustomerMarketingEnvelopeData>(overviewEndpoint, createRequestBody(query), signal)
  return adaptEnvelope(envelope, query, 'real')
}

async function postUnified<T>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<CustomerMarketingEnvelope<T | null>> {
  const response = await fetch(`${realBaseUrl}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: CustomerMarketingEnvelope<T | null> | null
  try {
    payload = (await response.json()) as CustomerMarketingEnvelope<T | null>
  } catch {
    payload = null
  }

  if (!response.ok || !payload) {
    throw new Error(`${endpoint} 返回 HTTP ${response.status}`)
  }

  if (payload.code !== 0) {
    throw new Error(payload.message || `${endpoint} 返回业务失败`)
  }

  return payload
}

function createRequestBody(query: CustomerMarketingQuery): Record<string, unknown> {
  return {
    bizDate: query.date,
    storeId: query.storeId === 'all' ? null : query.storeId,
    channel: query.channel === 'all' ? null : query.channel,
    stage: query.stage === 'all' ? null : query.stage,
    keyword: query.keyword.trim() || null,
    page: query.page ?? 1,
    pageSize: query.pageSize ?? 20,
  }
}

function buildRequestSummary(query: CustomerMarketingQuery, traceId: string) {
  return [
    `traceId=${traceId}`,
    `date=${query.date}`,
    `storeId=${query.storeId}`,
    `channel=${query.channel}`,
    `stage=${query.stage}`,
    `keyword=${query.keyword.trim() || '全部客户'}`,
    `page=${query.page ?? 1}`,
    `pageSize=${query.pageSize ?? 20}`,
  ]
}
