const CLEAN_SETTING_PROVIDER_KEY = 'pms.cleanSettingProvider'
const REAL_BASE_URL = '/api'

export const CLEAN_SETTING_OVERVIEW_PATH = '/cleanManage/cleanSetting/overview'
export const CLEAN_SETTING_SAVE_PATH = '/cleanManage/cleanSetting/rule/save'
export const CLEAN_SETTING_EXPORT_PATH = '/cleanManage/cleanSetting/export'

export type CleanSettingProviderName = 'mock' | 'api'
export type CleanSettingMockState = 'success' | 'empty' | 'error'

export type CleanSettingFilters = {
  businessDate: string
  storeId: string
  projectId: string
  status: string
  page: number
  pageSize: number
  mockState: CleanSettingMockState
}

export type CleanSettingOption = {
  value: string
  label: string
}

export type CleanSettingMetric = {
  key: string
  label: string
  value: string
  description: string
}

export type CleanSettingPolicyRule = {
  id: string
  name: string
  storeId?: string
  projectId?: string
  storeName: string
  roomScope: string
  trigger: string
  cleanerGroup: string
  status: 'enabled' | 'paused'
  updatedAt: string
  detail: string
}

export type CleanSettingPriceRule = {
  id: string
  name: string
  cleanType: string
  amount: string
  settlementMode: string
  status: 'enabled' | 'paused'
}

export type CleanSettingReminder = {
  id: string
  title: string
  description: string
  severity: 'normal' | 'warning'
}

export type CleanSettingSchedule = {
  label: string
  value: string
  tone: 'primary' | 'success' | 'warning'
}

export type CleanSettingDashboard = {
  filters: CleanSettingFilters
  stores: CleanSettingOption[]
  projects: CleanSettingOption[]
  statusOptions: CleanSettingOption[]
  metrics: CleanSettingMetric[]
  policyRules: CleanSettingPolicyRule[]
  priceRules: CleanSettingPriceRule[]
  reminders: CleanSettingReminder[]
  schedule: CleanSettingSchedule[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  requestedAt: string
  provider: CleanSettingProviderName
  traceId: string
}

export type CleanSettingExportResponse = {
  fileName: string
  contentType: string
  total: number
  policyRules: CleanSettingPolicyRule[]
  priceRules: CleanSettingPriceRule[]
}

export type CleanSettingSaveResponse = {
  rule: CleanSettingPolicyRule
  total: number
  message: string
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type CleanSettingPayload = Omit<CleanSettingDashboard, 'filters' | 'provider' | 'traceId'>

type HudsonResponse<T> = {
  success?: boolean
  code?: number
  message?: string
  data?: T
  traceId?: string
  timestamp?: string
  errorMsg?: string | null
  errorCode?: string | null
}

export function createDefaultCleanSettingFilters(searchParams = new URLSearchParams()): CleanSettingFilters {
  return {
    businessDate: searchParams.get('date') || '2026-05-18',
    storeId: searchParams.get('storeId') || 'all',
    projectId: searchParams.get('projectId') || 'all',
    status: searchParams.get('status') || 'all',
    page: Number(searchParams.get('page') || 1),
    pageSize: Number(searchParams.get('pageSize') || 20),
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export async function fetchCleanSettingDashboard(
  filters: CleanSettingFilters,
  providerName = getCleanSettingProviderName(),
): Promise<CleanSettingDashboard> {
  validateFilters(filters)

  if (providerName === 'api') {
    return fetchRealCleanSettingDashboard(filters)
  }

  const envelope = await fetchMockCleanSettingDashboard(filters)
  return adaptCleanSettingEnvelope(envelope, filters, providerName)
}

export async function saveCleanSettingRule(
  rule: CleanSettingPolicyRule,
  providerName = getCleanSettingProviderName(),
): Promise<CleanSettingSaveResponse> {
  if (providerName !== 'api') {
    return {
      rule,
      total: 1,
      message: '保洁策略保存成功',
    }
  }

  const { data } = await postHudson<CleanSettingSaveResponse>(CLEAN_SETTING_SAVE_PATH, {
    campId: resolveCampId(),
    rule,
  })
  return {
    rule: normalizePolicyRule(data.rule ?? rule),
    total: readNumber(data.total, 1),
    message: data.message || '保洁策略保存成功',
  }
}

export async function exportCleanSetting(
  filters: CleanSettingFilters,
  providerName = getCleanSettingProviderName(),
): Promise<CleanSettingExportResponse> {
  validateFilters(filters)

  if (providerName !== 'api') {
    return {
      fileName: `保洁设置-${filters.businessDate}.xlsx`,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      total: 0,
      policyRules: [],
      priceRules: [],
    }
  }

  const { data } = await postHudson<CleanSettingExportResponse>(CLEAN_SETTING_EXPORT_PATH, {
    campId: resolveCampId(),
    ...buildCleanSettingRequest(filters),
  })

  return {
    fileName: data.fileName || `clean_setting_${filters.businessDate}.csv`,
    contentType: data.contentType || 'text/csv',
    total: readNumber(data.total, 0),
    policyRules: Array.isArray(data.policyRules) ? data.policyRules.map(normalizePolicyRule) : [],
    priceRules: Array.isArray(data.priceRules) ? data.priceRules : [],
  }
}

export function buildCleanSettingRequest(filters: CleanSettingFilters) {
  return {
    businessDate: filters.businessDate,
    storeId: filters.storeId,
    projectId: filters.projectId,
    status: filters.status,
    page: filters.page,
    pageSize: filters.pageSize,
  }
}

async function fetchRealCleanSettingDashboard(filters: CleanSettingFilters): Promise<CleanSettingDashboard> {
  const { data, traceId } = await postHudson<CleanSettingPayload>(CLEAN_SETTING_OVERVIEW_PATH, {
    campId: resolveCampId(),
    ...buildCleanSettingRequest(filters),
  })

  return {
    ...adaptRealCleanSettingPayload(data, filters),
    filters,
    provider: 'api',
    traceId,
  }
}

function getCleanSettingProviderName(): CleanSettingProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(CLEAN_SETTING_PROVIDER_KEY)
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

async function fetchMockCleanSettingDashboard(
  filters: CleanSettingFilters,
): Promise<UnifiedEnvelope<CleanSettingPayload>> {
  await delay(120)

  if (filters.mockState === 'error') {
    return {
      code: 50001,
      message: '保洁设置加载失败，请稍后重试',
      data: createEmptyPayload(filters),
      traceId: 'mock-fangtai--baojie-guanli--baojie-shezhi-error-001',
      timestamp: '2026-05-18T10:00:00+08:00',
    }
  }

  if (filters.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: createEmptyPayload(filters),
      traceId: 'mock-fangtai--baojie-guanli--baojie-shezhi-empty-001',
      timestamp: '2026-05-18T10:00:00+08:00',
    }
  }

  return {
    code: 0,
    message: 'success',
    data: createSuccessPayload(filters),
    traceId: 'mock-fangtai--baojie-guanli--baojie-shezhi-success-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function adaptCleanSettingEnvelope(
  envelope: UnifiedEnvelope<CleanSettingPayload>,
  filters: CleanSettingFilters,
  provider: CleanSettingProviderName,
): CleanSettingDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '保洁设置加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.policyRules) || !Array.isArray(data.priceRules)) {
    throw new Error('保洁设置加载失败，请稍后重试')
  }

  return {
    ...data,
    filters,
    provider,
    traceId: envelope.traceId,
  }
}

function createSuccessPayload(filters: CleanSettingFilters): CleanSettingPayload {
  const stores = createStoreOptions()
  const projects = createProjectOptions()
  const statusOptions = createStatusOptions()
  const selectedStore = stores.find((item) => item.value === filters.storeId)?.label ?? stores[0].label

  const allPolicies: CleanSettingPolicyRule[] = [
    {
      id: 'policy-checkout-auto',
      name: '退房保洁自动派单',
      storeName: selectedStore === '全部门店' ? '前海店' : selectedStore,
      roomScope: '天落大床电竞套间、观影大床房',
      trigger: '订单退房后 10 分钟',
      cleanerGroup: '一组保洁',
      status: 'enabled',
      updatedAt: '2026-05-18 09:20',
      detail: '退房后自动创建保洁任务，并提醒保洁员在 30 分钟内接单。',
    },
    {
      id: 'policy-stay-remind',
      name: '续住客房提醒',
      storeName: selectedStore === '全部门店' ? '天落会展店' : selectedStore,
      roomScope: '总统套间、顶层套房',
      trigger: '每日 14:00',
      cleanerGroup: '主管复核',
      status: 'enabled',
      updatedAt: '2026-05-18 08:55',
      detail: '续住房间每日生成轻保洁提醒，主管可按入住状态调整执行时间。',
    },
    {
      id: 'policy-deep-clean',
      name: '深度保洁复核',
      storeName: selectedStore === '全部门店' ? '前海店' : selectedStore,
      roomScope: '连续入住 5 晚以上房间',
      trigger: '满足条件次日 11:00',
      cleanerGroup: '深度保洁组',
      status: 'paused',
      updatedAt: '2026-05-17 18:40',
      detail: '为长住客房生成深度保洁复核计划，暂停后不会自动派单。',
    },
  ]

  const policyRules = allPolicies.filter((item) => filters.status === 'all' || item.status === filters.status)
  const todayTasks = filters.storeId === 'qianhai' ? '18' : '32'

  return {
    stores,
    projects,
    statusOptions,
    metrics: [
      { key: 'todayTasks', label: '今日任务', value: todayTasks, description: '按当前条件统计待执行与执行中任务' },
      { key: 'enabledRules', label: '启用策略', value: String(policyRules.filter((item) => item.status === 'enabled').length), description: '可自动触发的保洁策略' },
      { key: 'avgResponse', label: '平均接单', value: '8.6 分钟', description: '保洁员接单平均响应时间' },
      { key: 'exceptionRate', label: '异常率', value: '2.4%', description: '超时、退回和人工改派占比' },
    ],
    policyRules,
    priceRules: [
      { id: 'price-checkout', name: '默认退房保洁费', cleanType: '退房保洁', amount: '¥35.00', settlementMode: '按间结算', status: 'enabled' },
      { id: 'price-stay', name: '续住轻保洁费', cleanType: '续住保洁', amount: '¥18.00', settlementMode: '按间结算', status: 'enabled' },
      { id: 'price-deep', name: '深度保洁附加费', cleanType: '深度保洁', amount: '¥68.00', settlementMode: '按任务结算', status: 'paused' },
    ],
    reminders: [
      { id: 'todo-confirm', title: '待确认任务', description: '5 间房等待主管确认保洁完成', severity: 'warning' },
      { id: 'todo-timeout', title: '接单提醒', description: '2 条任务即将超过 15 分钟未接单', severity: 'normal' },
      { id: 'todo-price', title: '价格复核', description: '深度保洁价格规则本周有 1 次调整', severity: 'normal' },
    ],
    schedule: [
      { label: '09:00-12:00', value: '12 间', tone: 'primary' },
      { label: '12:00-16:00', value: '15 间', tone: 'success' },
      { label: '16:00-20:00', value: '5 间', tone: 'warning' },
    ],
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: policyRules.length,
    },
    requestedAt: '2026-05-18 10:00:00',
  }
}

function createEmptyPayload(filters: CleanSettingFilters): CleanSettingPayload {
  return {
    stores: createStoreOptions(),
    projects: createProjectOptions(),
    statusOptions: createStatusOptions(),
    metrics: [
      { key: 'todayTasks', label: '今日任务', value: '0', description: '按当前条件统计待执行与执行中任务' },
      { key: 'enabledRules', label: '启用策略', value: '0', description: '可自动触发的保洁策略' },
      { key: 'avgResponse', label: '平均接单', value: '-', description: '保洁员接单平均响应时间' },
      { key: 'exceptionRate', label: '异常率', value: '-', description: '超时、退回和人工改派占比' },
    ],
    policyRules: [],
    priceRules: [],
    reminders: [],
    schedule: [],
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: 0,
    },
    requestedAt: '2026-05-18 10:00:00',
  }
}

function createStoreOptions(): CleanSettingOption[] {
  return [
    { value: 'all', label: '全部门店' },
    { value: 'qianhai', label: '前海店' },
    { value: 'expo', label: '天落会展店' },
  ]
}

function createProjectOptions(): CleanSettingOption[] {
  return [
    { value: 'all', label: '全部项目' },
    { value: 'daily-clean', label: '日常保洁' },
    { value: 'deep-clean', label: '深度保洁' },
  ]
}

function createStatusOptions(): CleanSettingOption[] {
  return [
    { value: 'all', label: '全部状态' },
    { value: 'enabled', label: '已启用' },
    { value: 'paused', label: '已暂停' },
  ]
}

function validateFilters(filters: CleanSettingFilters) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(filters.businessDate)) {
    throw new Error('保洁日期格式不正确')
  }

  if (!Number.isFinite(filters.page) || filters.page < 1) {
    throw new Error('分页参数不正确')
  }
}

function toMockState(value: string | null): CleanSettingMockState {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function resolveCampId(fallback = '10001') {
  if (typeof window === 'undefined') return fallback
  const configured =
    window.localStorage.getItem('pmsCampId')?.trim() ||
    window.localStorage.getItem('pms.currentCampId')?.trim() ||
    window.localStorage.getItem('pms.campId')?.trim()
  return configured || fallback
}

function adaptRealCleanSettingPayload(data: CleanSettingPayload, filters: CleanSettingFilters): CleanSettingPayload {
  if (!data || !Array.isArray(data.policyRules) || !Array.isArray(data.priceRules)) {
    throw new Error('保洁设置加载失败，请稍后重试')
  }

  return {
    stores: Array.isArray(data.stores) ? data.stores : createStoreOptions(),
    projects: Array.isArray(data.projects) ? data.projects : createProjectOptions(),
    statusOptions: Array.isArray(data.statusOptions) ? data.statusOptions : createStatusOptions(),
    metrics: Array.isArray(data.metrics) ? data.metrics : [],
    policyRules: data.policyRules.map(normalizePolicyRule),
    priceRules: data.priceRules,
    reminders: Array.isArray(data.reminders) ? data.reminders : [],
    schedule: Array.isArray(data.schedule) ? data.schedule : [],
    pagination: data.pagination ?? {
      page: filters.page,
      pageSize: filters.pageSize,
      total: data.policyRules.length,
    },
    requestedAt: data.requestedAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
  }
}

function normalizePolicyRule(rule: CleanSettingPolicyRule): CleanSettingPolicyRule {
  return {
    ...rule,
    storeId: rule.storeId ?? 'all',
    projectId: rule.projectId ?? 'all',
  }
}

async function postHudson<T>(path: string, body: Record<string, unknown>): Promise<{ data: T; traceId: string; timestamp: string }> {
  const response = await fetch(`${REAL_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false || (payload?.code !== undefined && payload.code !== 0)) {
    throw new Error(payload?.errorMsg ?? payload?.message ?? payload?.errorCode ?? `${path} 返回 HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${path} 响应缺少 data 字段`)
  }

  return {
    data: payload.data,
    traceId: payload.traceId ?? `api-${path.replaceAll('/', '-')}`,
    timestamp: payload.timestamp ?? new Date().toISOString(),
  }
}

function readNumber(value: unknown, fallback: number) {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
