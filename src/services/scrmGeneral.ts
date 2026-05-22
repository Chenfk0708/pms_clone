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
  actionLabel?: string
  actionRoute?: string
}

export type ScrmGeneralTrend = {
  label: string
  tone: 'blue' | 'orange' | 'green'
  points: Array<{ date: string; value: number }>
}

export type ScrmGeneralScene = {
  id: string
  title: string
  description: string
  route: string
  tone: 'blue' | 'green' | 'purple' | 'gold'
}

export type ScrmGeneralData = {
  metrics: ScrmGeneralMetric[]
  trends: ScrmGeneralTrend[]
  scenes: ScrmGeneralScene[]
  stores: Array<{ value: string; label: string }>
  dimensions: Array<{ value: ScrmGeneralDimension; label: string }>
  trendRange: {
    startDate: string
    endDate: string
  }
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

const timestamp = '2026-05-21T10:00:00+08:00'

export const defaultScrmGeneralFilters: ScrmGeneralFilters = {
  campId: '1796067693589061634',
  poiId: '1796425098638573570',
  startDate: '2026-05-21',
  endDate: '2026-06-21',
  dimension: 'all',
}

const stores = [{ value: '1796425098638573570', label: '天洛会宿公寓(前海壹方城宝安中心店)' }]

const dimensions: ScrmGeneralData['dimensions'] = [
  { value: 'all', label: '全部客户' },
  { value: 'private', label: '私域客户' },
  { value: 'member', label: '会员客户' },
  { value: 'wechat', label: '企微客户' },
]

const trendRange = {
  startDate: '2026-05-21',
  endDate: '2026-06-21',
}

const metrics: ScrmGeneralMetric[] = [
  {
    id: 'customerTotal',
    label: '客户数',
    value: '590',
    unit: '',
    trend: '',
    tone: 'blue',
    description: '客户总量。',
  },
  {
    id: 'fanTotal',
    label: '粉丝总数',
    value: '敬请期待',
    unit: '',
    trend: '',
    tone: 'orange',
    description: '目标站当前显示敬请期待。',
  },
  {
    id: 'memberTotal',
    label: '会员总数',
    value: '277',
    unit: '',
    trend: '',
    tone: 'gold',
    description: '会员总量。',
  },
  {
    id: 'wecomTotal',
    label: '添加企微人数',
    value: '',
    unit: '',
    trend: '',
    tone: 'green',
    description: '企微人数需先完成配置。',
    actionLabel: '前往设置',
    actionRoute: '/channels/private/setting/weComSetting',
  },
]

const trends: ScrmGeneralTrend[] = [
  {
    label: '客户数',
    tone: 'orange',
    points: [
      { date: '05/27', value: 575 },
      { date: '06/02', value: 580 },
      { date: '06/08', value: 584 },
      { date: '06/14', value: 588 },
      { date: '06/21', value: 590 },
    ],
  },
  {
    label: '会员数',
    tone: 'green',
    points: [
      { date: '05/27', value: 270 },
      { date: '06/02', value: 272 },
      { date: '06/08', value: 274 },
      { date: '06/14', value: 276 },
      { date: '06/21', value: 277 },
    ],
  },
  {
    label: '添加企微人数',
    tone: 'blue',
    points: [
      { date: '05/27', value: 0 },
      { date: '06/02', value: 0 },
      { date: '06/08', value: 0 },
      { date: '06/14', value: 0 },
      { date: '06/21', value: 0 },
    ],
  },
]

const scenes: ScrmGeneralScene[] = [
  {
    id: 'smart-checkin-wecom',
    title: '智能入住接入企业微信',
    description: '通过企业微信接待渠道客户入住，实现私域客户沉淀',
    route: '/smartHotel/smartHome',
    tone: 'green',
  },
  {
    id: 'chat-toolbar',
    title: '聊天工具栏',
    description: '可配置企微的工具栏，在对话中营销，实现高效沟通与转化',
    route: '/scrm/sidebarPreview',
    tone: 'blue',
  },
  {
    id: 'wechat-service',
    title: '品牌小程序接入微信客服',
    description: '极大提升私域客户的咨询体验，提升客服的回复能力',
    route: '/scrm/wechatService/manage',
    tone: 'purple',
  },
  {
    id: 'member-growth',
    title: '会员成长体系',
    description: '通过会员权益搭配会员等级，实现会员复购经营',
    route: '/scrm/memberCenter/level',
    tone: 'gold',
  },
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
    const response = createEnvelope(503, '客户概况服务暂时不可用，请稍后重试', emptyData(), request)
    throw new ScrmGeneralServiceError(response)
  }

  const data = scenario === 'empty' ? emptyData() : fullData()
  return adaptScrmGeneralResponse(createEnvelope(0, 'success', data, request), request)
}

function fullData(): ScrmGeneralData {
  return {
    metrics,
    trends,
    scenes,
    stores,
    dimensions,
    trendRange,
    pagination: {
      page: 1,
      pageSize: 20,
      total: scenes.length,
    },
  }
}

function emptyData(): ScrmGeneralData {
  return {
    metrics: metrics.map((metric) =>
      metric.id === 'fanTotal' || metric.id === 'wecomTotal'
        ? metric
        : {
            ...metric,
            value: '0',
          },
    ),
    trends: trends.map((trend) => ({
      ...trend,
      points: trend.points.map((point) => ({ ...point, value: 0 })),
    })),
    scenes,
    stores,
    dimensions,
    trendRange,
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
  data: ScrmGeneralData,
  _request: ScrmGeneralModel['request'],
): ScrmGeneralEnvelope {
  return {
    code,
    message,
    data,
    traceId: `mock-scrm-general-${code === 0 ? 'success' : 'error'}-001`,
    timestamp,
  }
}

function adaptScrmGeneralResponse(
  response: ScrmGeneralEnvelope,
  request: ScrmGeneralModel['request'],
): ScrmGeneralModel {
  if (response.code !== 0) {
    throw new ScrmGeneralServiceError(response)
  }

  return {
    ...response.data,
    request,
    traceId: response.traceId,
    timestamp: response.timestamp,
    requestEcho: JSON.stringify(request),
  }
}
