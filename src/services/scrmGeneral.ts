export const SCRM_GENERAL_PROVIDER = 'mock'
export const SCRM_GENERAL_ENDPOINT = '/scrm/general/overview/get'
export const SCRM_GENERAL_TARGET_URL = 'https://minsubao.localhome.cn/scrm/general'

export type ScrmGeneralScenario = 'success' | 'empty' | 'error'
export type ScrmGeneralDimension = 'all' | 'private' | 'member' | 'wechat'

export type ScrmGeneralFilters = {
  campId: string
  poiId: string
  startDate: string
  endDate: string
  dimension: ScrmGeneralDimension
}

export type ScrmGeneralMetric = {
  id: string
  label: string
  value: string
  unit: string
  trend: string
  tone: 'blue' | 'orange' | 'gold' | 'green'
  description: string
}

export type ScrmGeneralTrend = {
  label: string
  tone: 'blue' | 'orange' | 'green'
  points: Array<{ date: string; value: number }>
}

export type ScrmGeneralTodo = {
  id: string
  title: string
  count: number
  route: string
  description: string
}

export type ScrmGeneralScene = {
  id: string
  title: string
  description: string
  route: string
  tone: 'blue' | 'green' | 'purple' | 'gold'
}

export type ScrmGeneralSource = {
  channel: string
  customerCount: number
  memberCount: number
  conversionRate: string
}

export type ScrmGeneralData = {
  metrics: ScrmGeneralMetric[]
  trends: ScrmGeneralTrend[]
  todos: ScrmGeneralTodo[]
  scenes: ScrmGeneralScene[]
  sources: ScrmGeneralSource[]
  stores: Array<{ value: string; label: string }>
  dimensions: Array<{ value: ScrmGeneralDimension; label: string }>
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

export type ScrmGeneralEnvelope = {
  code: number
  message: string
  data: ScrmGeneralData
  traceId: string
  timestamp: string
}

export type ScrmGeneralModel = ScrmGeneralData & {
  request: {
    provider: typeof SCRM_GENERAL_PROVIDER
    path: typeof SCRM_GENERAL_ENDPOINT
    targetUrl: typeof SCRM_GENERAL_TARGET_URL
    body: ReturnType<typeof buildScrmGeneralRequestBody>
    scenario: ScrmGeneralScenario
  }
  traceId: string
  timestamp: string
  requestEcho: string
}

export class ScrmGeneralServiceError extends Error {
  response: ScrmGeneralEnvelope

  constructor(response: ScrmGeneralEnvelope) {
    super(response.message)
    this.name = 'ScrmGeneralServiceError'
    this.response = response
  }
}

const timestamp = '2026-05-18T10:00:00+08:00'

export const defaultScrmGeneralFilters: ScrmGeneralFilters = {
  campId: '1796067693589061634',
  poiId: '1796425098638573570',
  startDate: '2026-05-27',
  endDate: '2026-06-18',
  dimension: 'all',
}

const stores = [
  { value: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const dimensions: ScrmGeneralData['dimensions'] = [
  { value: 'all', label: '全部客户' },
  { value: 'private', label: '私域客户' },
  { value: 'member', label: '会员客户' },
  { value: 'wechat', label: '企微客户' },
]

const metrics: ScrmGeneralMetric[] = [
  {
    id: 'customerTotal',
    label: '客户数',
    value: '589',
    unit: '人',
    trend: '较上期 +1',
    tone: 'blue',
    description: '来自客户资产盘点，包含历史订单客户、私域客户和会员客户。',
  },
  {
    id: 'fanTotal',
    label: '粉丝总数',
    value: '敬请期待',
    unit: '',
    trend: '目标站暂未开放统计',
    tone: 'orange',
    description: '目标站当前展示敬请期待，后端联调时确认微信生态粉丝口径。',
  },
  {
    id: 'memberTotal',
    label: '会员总数',
    value: '276',
    unit: '人',
    trend: '较上期 +1',
    tone: 'gold',
    description: '已成为会员的客户总量，可跳转会员等级与权益体系承接。',
  },
  {
    id: 'wecomTotal',
    label: '添加企微人数',
    value: '前往设置',
    unit: '',
    trend: '待完成企微授权',
    tone: 'green',
    description: '目标站卡片引导前往企业微信设置，当前用已有私域设置路由承接。',
  },
]

const trends: ScrmGeneralTrend[] = [
  {
    label: '客户数',
    tone: 'orange',
    points: [
      { date: '05/27', value: 571 },
      { date: '06/03', value: 578 },
      { date: '06/10', value: 584 },
      { date: '06/18', value: 589 },
    ],
  },
  {
    label: '会员数',
    tone: 'green',
    points: [
      { date: '05/27', value: 268 },
      { date: '06/03', value: 271 },
      { date: '06/10', value: 274 },
      { date: '06/18', value: 276 },
    ],
  },
  {
    label: '添加企微人数',
    tone: 'blue',
    points: [
      { date: '05/27', value: 0 },
      { date: '06/03', value: 0 },
      { date: '06/10', value: 0 },
      { date: '06/18', value: 0 },
    ],
  },
]

const todos: ScrmGeneralTodo[] = [
  {
    id: 'follow-up',
    title: '待跟进客户',
    count: 12,
    route: '/customer/list',
    description: '近 7 天有咨询或订单行为但未形成会员沉淀的客户。',
  },
  {
    id: 'member-upgrade',
    title: '会员成长提醒',
    count: 8,
    route: '/scrm/memberCenter/level',
    description: '满足消费或入住条件，可引导升级会员等级的客户。',
  },
  {
    id: 'wechat-auth',
    title: '企微授权待处理',
    count: 1,
    route: '/channels/private/setting/weComSetting',
    description: '企业微信未授权，完成后可统计添加企微人数。',
  },
]

const scenes: ScrmGeneralScene[] = [
  {
    id: 'smart-checkin-wecom',
    title: '智能入住接入企业微信',
    description: '通过企业微信接待渠道客户入住，实现私域客户沉淀。',
    route: '/smartHotel/smartHome',
    tone: 'green',
  },
  {
    id: 'chat-toolbar',
    title: '聊天工具栏',
    description: '可配置企微的工具栏，在对话中营销，实现高效沟通与转化。',
    route: '/scrm/sidebarPreview',
    tone: 'blue',
  },
  {
    id: 'wechat-service',
    title: '品牌小程序接入微信客服',
    description: '提升私域客户咨询体验，增强客服回复能力。',
    route: '/scrm/wechatService/manage',
    tone: 'purple',
  },
  {
    id: 'member-growth',
    title: '会员成长体系',
    description: '通过会员权益搭配会员等级，实现会员复购经营。',
    route: '/scrm/memberCenter/level',
    tone: 'gold',
  },
]

const sources: ScrmGeneralSource[] = [
  { channel: '携程民宿', customerCount: 168, memberCount: 72, conversionRate: '42.9%' },
  { channel: '途家', customerCount: 146, memberCount: 61, conversionRate: '41.8%' },
  { channel: '美团民宿', customerCount: 124, memberCount: 55, conversionRate: '44.4%' },
  { channel: '小猪', customerCount: 83, memberCount: 36, conversionRate: '43.4%' },
]

export function buildScrmGeneralRequestBody(filters: ScrmGeneralFilters) {
  return {
    campId: filters.campId,
    poiId: filters.poiId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    dimension: filters.dimension,
    pageNum: 1,
    pageSize: 20,
  }
}

export async function loadScrmGeneralData(
  filters: ScrmGeneralFilters,
  scenario: ScrmGeneralScenario = 'success',
): Promise<ScrmGeneralModel> {
  await new Promise((resolve) => window.setTimeout(resolve, 80))

  const request: ScrmGeneralModel['request'] = {
    provider: SCRM_GENERAL_PROVIDER,
    path: SCRM_GENERAL_ENDPOINT,
    targetUrl: SCRM_GENERAL_TARGET_URL,
    body: buildScrmGeneralRequestBody(filters),
    scenario,
  }

  if (scenario === 'error') {
    const response = createEnvelope(503, '客户概况服务暂时不可用，请稍后重试', request, emptyData())
    throw new ScrmGeneralServiceError(response)
  }

  const data = scenario === 'empty' ? emptyData() : fullData(filters)
  return adaptScrmGeneralResponse(createEnvelope(0, 'success', request, data), request)
}

function fullData(filters: ScrmGeneralFilters): ScrmGeneralData {
  const filteredSources =
    filters.dimension === 'all'
      ? sources
      : sources.map((source) => ({
          ...source,
          customerCount: Math.max(12, Math.round(source.customerCount * 0.62)),
          memberCount: Math.max(6, Math.round(source.memberCount * 0.58)),
        }))

  return {
    metrics,
    trends,
    todos,
    scenes,
    sources: filteredSources,
    stores,
    dimensions,
    pagination: {
      page: 1,
      pageSize: 20,
      total: filteredSources.length,
    },
  }
}

function emptyData(): ScrmGeneralData {
  return {
    metrics: metrics.map((metric) =>
      metric.id === 'fanTotal' || metric.id === 'wecomTotal' ? metric : { ...metric, value: '0', trend: '当前条件暂无新增' },
    ),
    trends: trends.map((trend) => ({
      ...trend,
      points: trend.points.map((point) => ({ ...point, value: 0 })),
    })),
    todos: [],
    scenes,
    sources: [],
    stores,
    dimensions,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
    },
  }
}

function createEnvelope(
  code: number,
  message: string,
  request: ScrmGeneralModel['request'],
  data: ScrmGeneralData,
): ScrmGeneralEnvelope {
  return {
    code,
    message,
    data: {
      ...data,
      pagination: data.pagination ?? { page: 1, pageSize: 20, total: 0 },
    },
    traceId: `mock-scrm--kehu-gaikuang--kehu-gaikuang-${code === 0 ? 'overview' : 'error'}-001`,
    timestamp,
  }
}

function adaptScrmGeneralResponse(
  response: ScrmGeneralEnvelope,
  request: ScrmGeneralModel['request'],
): ScrmGeneralModel {
  if (response.code !== 0) throw new ScrmGeneralServiceError(response)

  return {
    ...response.data,
    request,
    traceId: response.traceId,
    timestamp: response.timestamp,
    requestEcho: JSON.stringify(request),
  }
}
