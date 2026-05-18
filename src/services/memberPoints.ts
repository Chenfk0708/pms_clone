export type MemberPointsProviderName = 'mock' | 'api'
export type MemberPointsMockState = 'success' | 'empty' | 'error'

export type MemberPointsQuery = {
  storeId: string
  storeName: string
  startDate: string
  endDate: string
  scene: MemberPointsSceneKey | 'all'
  keyword: string
  page: number
  pageSize: number
  state?: MemberPointsMockState
}

export type MemberPointsSceneKey = 'reward' | 'redeem' | 'adjust' | 'expire'

export type MemberPointsMetric = {
  key: string
  title: string
  value: number
  unit: string
  trend: string
  tone: 'blue' | 'green' | 'orange' | 'purple'
  detail: string
}

export type MemberPointsTrendPoint = {
  date: string
  issued: number
  consumed: number
}

export type MemberPointsRecord = {
  id: string
  memberName: string
  phoneSuffix: string
  scene: MemberPointsSceneKey
  sceneLabel: string
  change: number
  balance: number
  source: string
  operator: string
  occurredAt: string
  status: 'completed' | 'processing' | 'reversed'
  remark: string
}

export type MemberPointsReminder = {
  id: string
  title: string
  count: number
  route: string
}

export type MemberPointsShortcut = {
  label: string
  route: string
  description: string
}

export type MemberPointsDashboard = {
  provider: MemberPointsProviderName
  state: MemberPointsMockState
  request: MemberPointsQuery
  stores: Array<{ id: string; name: string }>
  scenes: Array<{ value: MemberPointsSceneKey | 'all'; label: string }>
  metrics: MemberPointsMetric[]
  trend: MemberPointsTrendPoint[]
  reminders: MemberPointsReminder[]
  shortcuts: MemberPointsShortcut[]
  records: MemberPointsRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  updatedAt: string
  traceIds: string[]
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type RawOverview = {
  stores: Array<{ store_id: string; store_name: string }>
  scenes: Array<{ scene: MemberPointsSceneKey | 'all'; scene_name: string }>
  metrics: Array<{
    metric_key: string
    metric_title: string
    metric_value: number
    unit: string
    trend_text: string
    tone: MemberPointsMetric['tone']
    detail_text: string
  }>
  trend: Array<{ stat_date: string; issued_points: number; consumed_points: number }>
  reminders: Array<{ reminder_id: string; title: string; count: number; route: string }>
  shortcuts: Array<{ label: string; route: string; description: string }>
}

type RawRecord = {
  record_id: string
  member_name: string
  phone_suffix: string
  scene: MemberPointsSceneKey
  scene_name: string
  change_points: number
  balance_points: number
  source_name: string
  operator_name: string
  occurred_at: string
  status: MemberPointsRecord['status']
  remark: string
}

type RawList = {
  list: RawRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

const RESPONSE_TIMESTAMP = '2026-05-18T10:00:00+08:00'

const stores = [
  { store_id: 'store-6ts5', store_name: '路客云 6TS5 的店铺' },
  { store_id: 'store-rooftop', store_name: '宝安顶层套房项目' },
  { store_id: 'store-sky', store_name: '天落电竞套间项目' },
]

const scenes: RawOverview['scenes'] = [
  { scene: 'all', scene_name: '全部场景' },
  { scene: 'reward', scene_name: '订单奖励' },
  { scene: 'redeem', scene_name: '权益兑换' },
  { scene: 'adjust', scene_name: '人工调整' },
  { scene: 'expire', scene_name: '到期清零' },
]

const baseRecords: RawRecord[] = [
  {
    record_id: 'MP202605180001',
    member_name: '任清晨',
    phone_suffix: '4230',
    scene: 'reward',
    scene_name: '订单奖励',
    change_points: 637,
    balance_points: 2637,
    source_name: '携程民宿订单 M335275070',
    operator_name: '系统规则',
    occurred_at: '2026-05-18 09:57:17',
    status: 'completed',
    remark: '订单完成后按房费金额自动发放',
  },
  {
    record_id: 'MP202605180002',
    member_name: '陈家辉',
    phone_suffix: '7958',
    scene: 'redeem',
    scene_name: '权益兑换',
    change_points: -120,
    balance_points: 1480,
    source_name: '延迟退房权益',
    operator_name: '前台小路',
    occurred_at: '2026-05-18 10:18:42',
    status: 'completed',
    remark: '会员使用积分兑换延迟退房权益',
  },
  {
    record_id: 'MP202605170011',
    member_name: '林可',
    phone_suffix: '9365',
    scene: 'adjust',
    scene_name: '人工调整',
    change_points: 80,
    balance_points: 980,
    source_name: '客户关怀补偿',
    operator_name: '运营主管',
    occurred_at: '2026-05-17 18:42:09',
    status: 'completed',
    remark: '入住体验补偿积分',
  },
  {
    record_id: 'MP202605160018',
    member_name: '周明',
    phone_suffix: '8891',
    scene: 'expire',
    scene_name: '到期清零',
    change_points: -60,
    balance_points: 0,
    source_name: '年度积分到期',
    operator_name: '系统规则',
    occurred_at: '2026-05-16 23:59:59',
    status: 'completed',
    remark: '超过有效期的积分自动清理',
  },
  {
    record_id: 'MP202605150026',
    member_name: '许安',
    phone_suffix: '2217',
    scene: 'reward',
    scene_name: '订单奖励',
    change_points: 288,
    balance_points: 1288,
    source_name: '美团民宿订单 MT250515',
    operator_name: '系统规则',
    occurred_at: '2026-05-15 16:20:31',
    status: 'processing',
    remark: '订单仍在结算保护期',
  },
  {
    record_id: 'MP202605140019',
    member_name: '王予',
    phone_suffix: '0731',
    scene: 'redeem',
    scene_name: '权益兑换',
    change_points: -200,
    balance_points: 740,
    source_name: '早餐券兑换',
    operator_name: '前台小路',
    occurred_at: '2026-05-14 08:31:10',
    status: 'completed',
    remark: '兑换双人早餐权益',
  },
]

export class MemberPointsServiceError extends Error {
  readonly response: ApiEnvelope<null>
  readonly provider: MemberPointsProviderName
  readonly state: MemberPointsMockState
  readonly request: MemberPointsQuery

  constructor(message: string, response: ApiEnvelope<null>, request: MemberPointsQuery) {
    super(message)
    this.name = 'MemberPointsServiceError'
    this.response = response
    this.provider = resolveMemberPointsProvider()
    this.state = 'error'
    this.request = request
  }
}

export function defaultMemberPointsQuery(): MemberPointsQuery {
  return {
    storeId: 'store-6ts5',
    storeName: '路客云 6TS5 的店铺',
    startDate: '2026-05-01',
    endDate: '2026-05-18',
    scene: 'all',
    keyword: '',
    page: 1,
    pageSize: 5,
    state: 'success',
  }
}

export function resolveMemberPointsProvider(): MemberPointsProviderName {
  const localValue =
    typeof window !== 'undefined' ? window.localStorage.getItem('pms.memberPointsProvider') : null
  const envValue = import.meta.env.VITE_MEMBER_POINTS_PROVIDER
  const provider = localValue || envValue || 'mock'
  if (provider === 'mock' || provider === 'api') return provider
  throw new Error(`Unsupported member points provider: ${provider}`)
}

export async function fetchMemberPointsDashboard(
  request: MemberPointsQuery,
  signal?: AbortSignal,
): Promise<MemberPointsDashboard> {
  const provider = resolveMemberPointsProvider()
  const normalizedRequest = normalizeQuery(request)

  if (provider === 'api') {
    throw new MemberPointsServiceError(
      '会员积分数据加载失败，请稍后重试',
      envelope(503, 'service unavailable', null, 'api-member-points-unavailable'),
      normalizedRequest,
    )
  }

  await waitForMockLatency(signal)
  const normalizedState = normalizedRequest.state ?? 'success'
  if (normalizedState === 'error') {
    throw new MemberPointsServiceError(
      '会员积分数据加载失败，请稍后重试',
      envelope(503, 'member points query failed', null, 'mock-scrm--huiyuan-zhongxin--huiyuan-jifen-error-001'),
      normalizedRequest,
    )
  }

  const overview = makeOverviewEnvelope(normalizedState)
  const records = makeRecordsEnvelope(normalizedRequest)
  return adaptDashboard(provider, normalizedRequest, overview, records)
}

export async function createMemberPointsExportTask(request: MemberPointsQuery, signal?: AbortSignal) {
  await waitForMockLatency(signal)
  const normalizedRequest = normalizeQuery(request)
  return envelope(
    0,
    'success',
    {
      taskId: 'member-points-export-20260518-001',
      requestedAt: RESPONSE_TIMESTAMP,
      request: normalizedRequest,
    },
    'mock-scrm--huiyuan-zhongxin--huiyuan-jifen-export-001',
  )
}

function normalizeQuery(request: MemberPointsQuery): MemberPointsQuery {
  const defaults = defaultMemberPointsQuery()
  const state: MemberPointsMockState = request.state === 'empty' || request.state === 'error' ? request.state : 'success'
  return {
    ...defaults,
    ...request,
    storeId: request.storeId || defaults.storeId,
    storeName: request.storeName || stores.find((store) => store.store_id === request.storeId)?.store_name || defaults.storeName,
    page: Number.isFinite(request.page) && request.page > 0 ? Math.floor(request.page) : defaults.page,
    pageSize:
      Number.isFinite(request.pageSize) && request.pageSize > 0 ? Math.floor(request.pageSize) : defaults.pageSize,
    keyword: request.keyword.trim(),
    state,
  }
}

function makeOverviewEnvelope(state: MemberPointsMockState): ApiEnvelope<RawOverview> {
  const isEmpty = state === 'empty'
  return envelope(
    0,
    'success',
    {
      stores,
      scenes,
      metrics: [
        {
          metric_key: 'issuedToday',
          metric_title: '今日发放积分',
          metric_value: isEmpty ? 0 : 1288,
          unit: '分',
          trend_text: isEmpty ? '暂无新增' : '较昨日 +12.6%',
          tone: 'blue',
          detail_text: '积分发放主要来自订单奖励，结算保护期内的积分会标记为处理中。',
        },
        {
          metric_key: 'consumedToday',
          metric_title: '今日消耗积分',
          metric_value: isEmpty ? 0 : 320,
          unit: '分',
          trend_text: isEmpty ? '暂无消耗' : '兑换权益 3 次',
          tone: 'orange',
          detail_text: '积分消耗集中在延迟退房、早餐券和房型升级权益。',
        },
        {
          metric_key: 'netGrowth',
          metric_title: '净增长积分',
          metric_value: isEmpty ? 0 : 968,
          unit: '分',
          trend_text: isEmpty ? '保持平稳' : '本周累计 +4,216',
          tone: 'green',
          detail_text: '净增长等于发放积分减去消耗、清零和撤销积分。',
        },
        {
          metric_key: 'activeMembers',
          metric_title: '积分活跃会员',
          metric_value: isEmpty ? 0 : 46,
          unit: '人',
          trend_text: isEmpty ? '暂无活跃' : '覆盖 3 个渠道',
          tone: 'purple',
          detail_text: '活跃会员统计周期内有积分发放、消耗或调整行为。',
        },
      ],
      trend: isEmpty
        ? []
        : [
            { stat_date: '05-12', issued_points: 420, consumed_points: 160 },
            { stat_date: '05-13', issued_points: 580, consumed_points: 220 },
            { stat_date: '05-14', issued_points: 760, consumed_points: 380 },
            { stat_date: '05-15', issued_points: 930, consumed_points: 260 },
            { stat_date: '05-16', issued_points: 690, consumed_points: 240 },
            { stat_date: '05-17', issued_points: 820, consumed_points: 310 },
            { stat_date: '05-18', issued_points: 1288, consumed_points: 320 },
          ],
      reminders: [
        { reminder_id: 'expire-soon', title: '即将到期积分', count: isEmpty ? 0 : 18, route: '/customer/list' },
        { reminder_id: 'pending-settle', title: '待结算积分', count: isEmpty ? 0 : 7, route: '/orderManage/order' },
        { reminder_id: 'benefit-review', title: '权益兑换待确认', count: isEmpty ? 0 : 3, route: '/scrm/memberCenter/equity' },
      ],
      shortcuts: [
        { label: '查看会员等级', route: '/scrm/memberCenter/level', description: '配置等级与升级规则' },
        { label: '查看会员权益', route: '/scrm/memberCenter/equity', description: '维护可兑换权益' },
        { label: '客户列表', route: '/customer/list', description: '查看会员画像' },
        { label: '优惠券', route: '/mallManagement/couponMgt', description: '联动营销活动' },
      ],
    },
    'mock-scrm--huiyuan-zhongxin--huiyuan-jifen-overview-001',
  )
}

function makeRecordsEnvelope(request: MemberPointsQuery): ApiEnvelope<RawList> {
  const filtered = request.state === 'empty' ? [] : filterRecords(request)
  const start = (request.page - 1) * request.pageSize
  const pageList = filtered.slice(start, start + request.pageSize)
  return envelope(
    0,
    'success',
    {
      list: pageList,
      pagination: {
        page: request.page,
        pageSize: request.pageSize,
        total: filtered.length,
      },
    },
    'mock-scrm--huiyuan-zhongxin--huiyuan-jifen-records-001',
  )
}

function filterRecords(request: MemberPointsQuery) {
  return baseRecords.filter((record) => {
    const sceneMatches = request.scene === 'all' || record.scene === request.scene
    const keyword = request.keyword.toLowerCase()
    const keywordMatches =
      !keyword ||
      record.member_name.toLowerCase().includes(keyword) ||
      record.phone_suffix.includes(keyword) ||
      record.record_id.toLowerCase().includes(keyword)
    return sceneMatches && keywordMatches
  })
}

function adaptDashboard(
  provider: MemberPointsProviderName,
  request: MemberPointsQuery,
  overview: ApiEnvelope<RawOverview>,
  records: ApiEnvelope<RawList>,
): MemberPointsDashboard {
  assertOk(overview)
  assertOk(records)
  return {
    provider,
    state: request.state ?? 'success',
    request,
    stores: overview.data.stores.map((store) => ({ id: store.store_id, name: store.store_name })),
    scenes: overview.data.scenes.map((scene) => ({ value: scene.scene, label: scene.scene_name })),
    metrics: overview.data.metrics.map((metric) => ({
      key: metric.metric_key,
      title: metric.metric_title,
      value: metric.metric_value,
      unit: metric.unit,
      trend: metric.trend_text,
      tone: metric.tone,
      detail: metric.detail_text,
    })),
    trend: overview.data.trend.map((point) => ({
      date: point.stat_date,
      issued: point.issued_points,
      consumed: point.consumed_points,
    })),
    reminders: overview.data.reminders.map((item) => ({
      id: item.reminder_id,
      title: item.title,
      count: item.count,
      route: item.route,
    })),
    shortcuts: overview.data.shortcuts,
    records: records.data.list.map((record) => ({
      id: record.record_id,
      memberName: record.member_name,
      phoneSuffix: record.phone_suffix,
      scene: record.scene,
      sceneLabel: record.scene_name,
      change: record.change_points,
      balance: record.balance_points,
      source: record.source_name,
      operator: record.operator_name,
      occurredAt: record.occurred_at,
      status: record.status,
      remark: record.remark,
    })),
    pagination: records.data.pagination,
    updatedAt: RESPONSE_TIMESTAMP,
    traceIds: [overview.traceId, records.traceId],
  }
}

function assertOk<T>(response: ApiEnvelope<T>) {
  if (response.code !== 0) {
    throw new Error(response.message)
  }
}

function envelope<T>(code: number, message: string, data: T, traceId: string): ApiEnvelope<T> {
  return {
    code,
    message,
    data,
    traceId,
    timestamp: RESPONSE_TIMESTAMP,
  }
}

function waitForMockLatency(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Request aborted', 'AbortError'))
      return
    }
    const timer = window.setTimeout(resolve, 180)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Request aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
