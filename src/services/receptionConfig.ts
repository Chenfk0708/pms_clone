export const RECEPTION_CONFIG_DASHBOARD_ENDPOINT = '/scrm/wechatService/receptionConfig/dashboard'
export const RECEPTION_CONFIG_SAVE_ENDPOINT = '/scrm/wechatService/receptionConfig/save'
export const RECEPTION_CONFIG_EXPORT_ENDPOINT = '/scrm/wechatService/receptionConfig/export'

const TASK_ID = 'scrm--kehu-goutong--jiedai-peizhi'
const DEFAULT_TIMESTAMP = '2026-05-19T16:45:00+08:00'
const DEFAULT_STORE_ID = '1796067693589061634'

export type ReceptionConfigProvider = 'mock' | 'api'
export type ReceptionConfigMockState = 'success' | 'empty' | 'error'

export type ReceptionConfigQuery = {
  provider?: ReceptionConfigProvider
  mockState?: ReceptionConfigMockState
  storeId: string
  staffGroup: string
  configStatus: string
  keyword: string
}

export type ReceptionConfigOption = {
  label: string
  value: string
}

export type ReceptionConfigMetric = {
  id: string
  label: string
  value: number
  detail: string
}

export type ReceptionConfigRule = {
  id: string
  name: string
  staffGroup: string
  staffGroupLabel: string
  status: string
  statusLabel: string
  trigger: string
  note: string
  welcomeMessage: string
  updatedAt: string
}

export type ReceptionConfigStaff = {
  id: string
  name: string
  staffGroup: string
  staffGroupLabel: string
  coverage: string
  templateCount: number
  note: string
}

export type ReceptionConfigShortcut = {
  id: string
  label: string
  description: string
  path: string
}

export type ReceptionConfigViewModel = {
  provider: ReceptionConfigProvider
  state: ReceptionConfigMockState
  metrics: ReceptionConfigMetric[]
  rules: ReceptionConfigRule[]
  staffMembers: ReceptionConfigStaff[]
  filterOptions: {
    staffGroups: ReceptionConfigOption[]
    statuses: ReceptionConfigOption[]
  }
  shortcuts: ReceptionConfigShortcut[]
  previewMessage: string
  refreshedAt: string
}

export type ReceptionConfigDiagnostics = {
  endpoint: string
  provider: ReceptionConfigProvider
  state: ReceptionConfigMockState
  traceId: string
  request: Record<string, unknown>
}

export type ReceptionConfigResult = {
  view: ReceptionConfigViewModel
  diagnostics: ReceptionConfigDiagnostics
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type ReceptionConfigBackendData = {
  metrics: ReceptionConfigMetric[]
  rules: ReceptionConfigRule[]
  staffMembers: ReceptionConfigStaff[]
  filterOptions: ReceptionConfigViewModel['filterOptions']
  shortcuts: ReceptionConfigShortcut[]
  previewMessage: string
}

export function resolveReceptionConfigRuntimeConfig(
  location: Pick<Location, 'search'>,
): Pick<ReceptionConfigQuery, 'provider' | 'mockState'> {
  const params = new URLSearchParams(location.search)
  const provider = params.get('receptionConfigProvider')
  const mockState = params.get('receptionConfigMockState')

  return {
    provider: provider === 'api' || provider === 'mock' ? provider : undefined,
    mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
  }
}

export function resolveReceptionConfigProvider(): ReceptionConfigProvider {
  const configured = readRuntimeConfig('pms.receptionConfigProvider') || import.meta.env.VITE_RECEPTION_CONFIG_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

export function getDefaultReceptionConfigOptions() {
  return filterOptions
}

export async function fetchReceptionConfigDashboard(
  query: ReceptionConfigQuery,
  signal?: AbortSignal,
): Promise<ReceptionConfigResult> {
  const provider = query.provider ?? resolveReceptionConfigProvider()
  const state = query.mockState ?? readReceptionConfigMockState()
  const request = buildReceptionConfigRequest(query)
  const envelope =
    provider === 'api'
      ? await fetchApiReceptionConfig(state, request, signal)
      : await fetchMockReceptionConfig(state, query, request, signal)
  const diagnostics: ReceptionConfigDiagnostics = {
    endpoint: RECEPTION_CONFIG_DASHBOARD_ENDPOINT,
    provider,
    state,
    traceId: envelope.traceId,
    request,
  }
  writeDiagnostics(diagnostics)

  if (envelope.code !== 0) {
    throw new Error(envelope.message || '接待配置数据加载失败，请重试')
  }

  return {
    view: {
      provider,
      state,
      metrics: envelope.data.metrics,
      rules: envelope.data.rules,
      staffMembers: envelope.data.staffMembers,
      filterOptions: envelope.data.filterOptions,
      shortcuts: envelope.data.shortcuts,
      previewMessage: envelope.data.previewMessage,
      refreshedAt: envelope.timestamp,
    },
    diagnostics,
  }
}

export function createReceptionConfigSaveTask(query: ReceptionConfigQuery) {
  const diagnostics: ReceptionConfigDiagnostics = {
    endpoint: RECEPTION_CONFIG_SAVE_ENDPOINT,
    provider: query.provider ?? resolveReceptionConfigProvider(),
    state: query.mockState ?? readReceptionConfigMockState(),
    traceId: `mock-${TASK_ID}-save-001`,
    request: buildReceptionConfigRequest(query),
  }
  writeDiagnostics(diagnostics)

  return {
    taskId: `SAVE-${TASK_ID}-20260519-001`,
    timestamp: DEFAULT_TIMESTAMP,
    traceId: diagnostics.traceId,
  }
}

export function createReceptionConfigExportTask(query: ReceptionConfigQuery) {
  const diagnostics: ReceptionConfigDiagnostics = {
    endpoint: RECEPTION_CONFIG_EXPORT_ENDPOINT,
    provider: query.provider ?? resolveReceptionConfigProvider(),
    state: query.mockState ?? readReceptionConfigMockState(),
    traceId: `mock-${TASK_ID}-export-001`,
    request: buildReceptionConfigRequest(query),
  }
  writeDiagnostics(diagnostics)

  return {
    taskId: `EXPORT-${TASK_ID}-20260519-001`,
    timestamp: DEFAULT_TIMESTAMP,
    traceId: diagnostics.traceId,
  }
}

function buildReceptionConfigRequest(query: ReceptionConfigQuery) {
  return {
    storeId: query.storeId || DEFAULT_STORE_ID,
    staffGroup: query.staffGroup,
    configStatus: query.configStatus,
    keyword: query.keyword.trim(),
  }
}

function readReceptionConfigMockState(): ReceptionConfigMockState {
  const configured =
    readRuntimeConfig('pms.receptionConfigMockState') || import.meta.env.VITE_RECEPTION_CONFIG_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

async function fetchMockReceptionConfig(
  state: ReceptionConfigMockState,
  query: ReceptionConfigQuery,
  _request: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelope<ReceptionConfigBackendData>> {
  await delay(80, signal)
  if (state === 'error') {
    return {
      code: 50001,
      message: '接待配置数据加载失败，请重试',
      data: createBackendData([], [], state),
      traceId: `mock-${TASK_ID}-error-001`,
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  const rules = state === 'empty' ? [] : filterRules(mockRules, query)
  const staffMembers = state === 'empty' ? [] : filterStaffMembers(mockStaffMembers, query)
  const normalizedState: ReceptionConfigMockState =
    rules.length === 0 && staffMembers.length === 0 ? 'empty' : 'success'

  return {
    code: 0,
    message: 'success',
    data: createBackendData(rules, staffMembers, normalizedState),
    traceId: `mock-${TASK_ID}-${normalizedState === 'empty' ? 'empty' : 'dashboard'}-001`,
    timestamp: DEFAULT_TIMESTAMP,
  }
}

async function fetchApiReceptionConfig(
  state: ReceptionConfigMockState,
  _request: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelope<ReceptionConfigBackendData>> {
  await delay(80, signal)
  return {
    code: 50002,
    message: '接待配置数据加载失败，请重试',
    data: createBackendData([], [], state),
    traceId: `api-${TASK_ID}-unavailable-001`,
    timestamp: new Date().toISOString(),
  }
}

function createBackendData(
  rules: ReceptionConfigRule[],
  staffMembers: ReceptionConfigStaff[],
  state: ReceptionConfigMockState,
): ReceptionConfigBackendData {
  const activeRules = rules.filter((rule) => rule.status === 'enabled').length
  const templateCount = rules.length === 0 ? 0 : new Set(rules.map((rule) => rule.welcomeMessage)).size
  return {
    metrics: [
      {
        id: 'staff-count',
        label: '接待员工',
        value: staffMembers.length === 0 ? 0 : 12,
        detail: '按当前门店已配置企业微信接待员工与分组协同规则。',
      },
      {
        id: 'template-count',
        label: '欢迎语模板',
        value: rules.length === 0 ? 0 : Math.max(templateCount, 6),
        detail: '按不同客源、入住阶段和问题场景切换欢迎语模板。',
      },
      {
        id: 'enabled-rules',
        label: '已启用规则',
        value: activeRules,
        detail: '已启用规则会在会话开始、入住提醒和追评关怀时自动生效。',
      },
      {
        id: 'covered-stores',
        label: '覆盖门店',
        value: state === 'empty' ? 0 : 5,
        detail: '覆盖当前在营门店和夜班兜底接待场景。',
      },
    ],
    rules,
    staffMembers,
    filterOptions,
    shortcuts,
    previewMessage: rules[0]?.welcomeMessage ?? defaultPreviewMessage,
  }
}

function filterRules(rules: ReceptionConfigRule[], query: ReceptionConfigQuery) {
  const keyword = query.keyword.trim().toLowerCase()
  return rules.filter((rule) => {
    if (query.staffGroup && rule.staffGroup !== query.staffGroup) return false
    if (query.configStatus && rule.status !== query.configStatus) return false
    if (!keyword) return true
    const content = `${rule.name} ${rule.trigger} ${rule.note} ${rule.staffGroupLabel}`.toLowerCase()
    return content.includes(keyword)
  })
}

function filterStaffMembers(staffMembers: ReceptionConfigStaff[], query: ReceptionConfigQuery) {
  const keyword = query.keyword.trim().toLowerCase()
  return staffMembers.filter((staffMember) => {
    if (query.staffGroup && staffMember.staffGroup !== query.staffGroup) return false
    if (!keyword) return true
    const content = `${staffMember.name} ${staffMember.staffGroupLabel} ${staffMember.note}`.toLowerCase()
    return content.includes(keyword)
  })
}

function writeDiagnostics(diagnostics: ReceptionConfigDiagnostics) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('pms.receptionConfig.lastRequest', JSON.stringify(diagnostics))
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('接待配置请求已取消', 'AbortError'))
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('接待配置请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
}

const filterOptions = {
  staffGroups: [
    { label: '全部分组', value: '' },
    { label: '夜班接待组', value: 'night' },
    { label: 'VIP接待组', value: 'vip' },
    { label: '复购关怀组', value: 'retention' },
  ],
  statuses: [
    { label: '全部规则', value: '' },
    { label: '已启用', value: 'enabled' },
    { label: '草稿中', value: 'draft' },
    { label: '已停用', value: 'paused' },
  ],
}

const shortcuts: ReceptionConfigShortcut[] = [
  {
    id: 'wechat-service',
    label: '微信客服',
    description: '回到客服运营台查看当前会话与接待表现。',
    path: '/scrm/wechatService/manage',
  },
  {
    id: 'staff-list',
    label: '企微员工列表',
    description: '查看员工状态、班次和接待分工。',
    path: '/customer/staffList',
  },
  {
    id: 'customer-tag',
    label: '客户标签',
    description: '同步查看标签命中情况与欢迎语分流条件。',
    path: '/customer/tag',
  },
]

const defaultPreviewMessage =
  '欢迎入住天麓会宿公寓，已为您安排夜班接待专员在线值守，如需停车、入住指引或延迟退房，请直接回复当前会话。'

const mockRules: ReceptionConfigRule[] = [
  {
    id: 'rule-001',
    name: '新客入住欢迎规则',
    staffGroup: 'night',
    staffGroupLabel: '夜班接待组',
    status: 'enabled',
    statusLabel: '已启用',
    trigger: '新订单支付成功后 3 分钟内自动发送',
    note: '覆盖夜间到店和晚到提醒，附带停车与门锁说明。',
    welcomeMessage: defaultPreviewMessage,
    updatedAt: '2026-05-19 16:18',
  },
  {
    id: 'rule-002',
    name: '高价值会员复购关怀',
    staffGroup: 'vip',
    staffGroupLabel: 'VIP接待组',
    status: 'enabled',
    statusLabel: '已启用',
    trigger: '会员再次咨询或复购房型时发送专属权益说明',
    note: '自动补充会员权益、早餐与升级房型说明。',
    welcomeMessage: '欢迎再次光临天麓会宿公寓，已为您保留会员权益和延迟退房名额。',
    updatedAt: '2026-05-19 15:40',
  },
  {
    id: 'rule-003',
    name: '退房后追评提醒',
    staffGroup: 'retention',
    staffGroupLabel: '复购关怀组',
    status: 'draft',
    statusLabel: '草稿中',
    trigger: '离店后 2 小时触发追评与复购券提醒',
    note: '当前处于草稿态，待补充五一档期权益文案。',
    welcomeMessage: '感谢您的入住，离店后将为您发送复购优惠与点评入口。',
    updatedAt: '2026-05-19 14:55',
  },
  {
    id: 'rule-004',
    name: '停车与门锁说明兜底',
    staffGroup: 'night',
    staffGroupLabel: '夜班接待组',
    status: 'paused',
    statusLabel: '已停用',
    trigger: '房客在 22:00 后首次发起咨询时触发',
    note: '历史版本，已由新客入住欢迎规则合并承接。',
    welcomeMessage: '夜间到店请提前联系前台，我们将发送停车位和门锁密码说明。',
    updatedAt: '2026-05-18 21:20',
  },
]

const mockStaffMembers: ReceptionConfigStaff[] = [
  {
    id: 'staff-001',
    name: '陈雨晴',
    staffGroup: 'night',
    staffGroupLabel: '夜班接待组',
    coverage: '22:00 - 08:00 / 晚到、停车、门锁咨询',
    templateCount: 3,
    note: '负责夜班兜底接待和入住提醒。',
  },
  {
    id: 'staff-002',
    name: '李之南',
    staffGroup: 'night',
    staffGroupLabel: '夜班接待组',
    coverage: '20:00 - 02:00 / 订单确认、会话分流',
    templateCount: 2,
    note: '负责夜班会话分流与紧急问题升级。',
  },
  {
    id: 'staff-003',
    name: '赵敏',
    staffGroup: 'vip',
    staffGroupLabel: 'VIP接待组',
    coverage: '09:00 - 18:00 / 会员关怀、复购优惠',
    templateCount: 4,
    note: '负责高价值会员和私域复购咨询。',
  },
  {
    id: 'staff-004',
    name: '顾嘉禾',
    staffGroup: 'retention',
    staffGroupLabel: '复购关怀组',
    coverage: '10:00 - 19:00 / 追评、优惠券跟进',
    templateCount: 2,
    note: '负责退房关怀和追评邀约。',
  },
]
