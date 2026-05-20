export const FINANCE_SETTING_PROVIDER_KEY = 'pms.financeSetting.provider'
export const FINANCE_SETTING_MOCK_STATE_KEY = 'pms.financeSetting.mockState'
export const FINANCE_SETTING_GET_ENDPOINT = '/systemConfigs/get'
export const FINANCE_SETTING_SAVE_NIGHT_AUDIT_ENDPOINT = '/systemConfigs/nightAudit/save'
export const FINANCE_SETTING_SAVE_STRATEGY_ENDPOINT = '/systemConfigs/financeStrategy/save'
export const FINANCE_SETTING_SAVE_VENDIBLE_ENDPOINT = '/systemConfigs/vendibleTypes/save'

const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-20T20:15:00+08:00'
const DEFAULT_TRACE_PREFIX = 'mock-shezhi--tongyong-shezhi--caiwu-shezhi'
const AMORTIZE_LOCK_SUFFIX = '_isChangeOrderAmortizeStrategy'
const VENDIBLE_LOCK_SUFFIX = '_isChangeOrderStrategy'
const TODAY_KEY = '2026-05-20'

export type FinanceSettingProvider = 'mock' | 'api'
export type FinanceSettingMockState = 'success' | 'empty' | 'error'
export type FinanceAmortizeStrategy = 'calendar' | 'average'
export type FinanceNightAuditAction = 'confirm-enable' | 'direct-enable' | 'disable' | 'time'
export type FinanceRuleAction = 'amortize' | 'vendible' | 'initialize'

export type FinanceSettingRuntimeConfig = {
  provider: FinanceSettingProvider
  mockState: FinanceSettingMockState
}

export type FinanceSettingQuery = FinanceSettingRuntimeConfig & {
  campId: string
}

export type FinanceSelectOption<T extends string | number> = {
  label: string
  value: T
}

export type FinanceSettingEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

export type FinanceNightAuditModel = {
  enabled: boolean
  time: number
  timeLabel: string
  options: Array<FinanceSelectOption<number>>
  saveRequest: {
    campId: string
    isNightAudit: 0 | 1
    autoNightAuditTime: number
  }
}

export type FinanceAmortizeModel = {
  strategy: FinanceAmortizeStrategy
  options: Array<FinanceSelectOption<FinanceAmortizeStrategy>>
  lockKey: string
  saveRequest: {
    campId: string
    orderAmortizeStrategy: 1 | 2
  }
}

export type FinanceVendibleModel = {
  selectedValues: number[]
  options: Array<FinanceSelectOption<number>>
  lockKey: string
  saveRequest: {
    campId: string
    vendibleTypes: number[]
  }
}

export type FinanceSettingDiagnostics = {
  provider: FinanceSettingProvider
  mockState: FinanceSettingMockState
  getRequest: {
    endpoint: string
    body: {
      campId: string
    }
  }
  saveRequests: {
    nightAudit: {
      endpoint: string
      body: FinanceNightAuditModel['saveRequest']
    }
    amortize: {
      endpoint: string
      body: FinanceAmortizeModel['saveRequest']
    }
    vendible: {
      endpoint: string
      body: FinanceVendibleModel['saveRequest']
    }
  }
}

export type FinanceSettingViewModel = {
  provider: FinanceSettingProvider
  mockState: FinanceSettingMockState
  traceId: string
  timestamp: string
  request: {
    campId: string
  }
  feedback: string
  isInitialized: boolean
  permissionRoute: string
  canRoutePermissionSetting: boolean
  lastUpdatedAt: string
  nightAudit: FinanceNightAuditModel
  amortize: FinanceAmortizeModel
  vendible: FinanceVendibleModel
  diagnostics: FinanceSettingDiagnostics
}

export type FinanceSettingMutationResult = {
  viewModel: FinanceSettingViewModel
  feedback: string
  traceId: string
}

type FinanceSettingPayload = {
  isNightAudit?: string | number | null
  autoNightAuditTime?: string | number | null
  orderAmortizeStrategy?: string | number | null
  vendibleTypes?: string | number[] | null
}

type MutableFinanceSettingState = {
  isNightAudit: 0 | 1
  autoNightAuditTime: number
  orderAmortizeStrategy: 1 | 2
  vendibleTypes: number[]
}

export class FinanceSettingServiceError extends Error {
  provider: FinanceSettingProvider
  request: Record<string, unknown>
  response: FinanceSettingEnvelope<Record<string, unknown>>

  constructor(provider: FinanceSettingProvider, request: Record<string, unknown>, response: FinanceSettingEnvelope<Record<string, unknown>>) {
    super(response.message)
    this.name = 'FinanceSettingServiceError'
    this.provider = provider
    this.request = request
    this.response = response
  }
}

const timeOptions: Array<FinanceSelectOption<number>> = Array.from({ length: 13 }, (_, index) => ({
  value: index,
  label: `${String(index).padStart(2, '0')}:00`,
}))

const amortizeOptions: Array<FinanceSelectOption<FinanceAmortizeStrategy>> = [
  { label: '按日历价分摊', value: 'calendar' },
  { label: '平均分摊', value: 'average' },
]

const vendibleOptions: Array<FinanceSelectOption<number>> = [
  { label: '普通关房', value: 1 },
  { label: '维修房', value: 2 },
  { label: '保留房', value: 3 },
  { label: '屏蔽关房', value: 4 },
  { label: '联动关房', value: 5 },
]

let mockState: MutableFinanceSettingState = createDefaultMutableState()

export function resolveFinanceSettingRuntimeConfig(search: string): FinanceSettingRuntimeConfig {
  const params = new URLSearchParams(search)
  return {
    provider: normalizeProvider(params.get('financeSettingProvider')) ?? readProvider(),
    mockState: normalizeMockState(params.get('financeSettingMockState')) ?? readMockState(),
  }
}

export function createDefaultFinanceSettingQuery(config: FinanceSettingRuntimeConfig): FinanceSettingQuery {
  return {
    campId: DEFAULT_CAMP_ID,
    provider: config.provider,
    mockState: config.mockState,
  }
}

export async function loadFinanceSettingViewModel(
  query: FinanceSettingQuery,
  signal?: AbortSignal,
): Promise<FinanceSettingViewModel> {
  const request = { campId: query.campId }
  const provider = query.provider
  const mockStateName = query.mockState

  await delay(180, signal)

  if (provider === 'api') {
    throw new FinanceSettingServiceError(provider, request, createEnvelope('error', '财务设置服务暂未接入真实后端'))
  }

  if (mockStateName === 'error') {
    throw new FinanceSettingServiceError(provider, request, createEnvelope('error', '财务设置加载失败，请稍后重试'))
  }

  const payload: FinanceSettingPayload | undefined =
    mockStateName === 'empty'
      ? undefined
      : {
          isNightAudit: mockState.isNightAudit,
          autoNightAuditTime: mockState.autoNightAuditTime,
          orderAmortizeStrategy: mockState.orderAmortizeStrategy,
          vendibleTypes: JSON.stringify(mockState.vendibleTypes),
        }

  return adaptViewModel(query, payload, {
    traceId: `${DEFAULT_TRACE_PREFIX}-${mockStateName}-001`,
    timestamp: DEFAULT_TIMESTAMP,
  })
}

export async function saveFinanceNightAuditSetting(
  current: FinanceSettingViewModel,
  input: {
    enabled: boolean
    time?: number
  },
  action: FinanceNightAuditAction,
  signal?: AbortSignal,
): Promise<FinanceSettingMutationResult> {
  const nextState = {
    ...mockState,
    isNightAudit: (input.enabled ? 1 : 0) as 0 | 1,
    autoNightAuditTime: typeof input.time === 'number' ? clampTime(input.time) : mockState.autoNightAuditTime,
  }

  await delay(160, signal)
  mockState = nextState

  const feedback =
    action === 'disable'
      ? '夜审已关闭'
      : action === 'time'
        ? `自动夜审时间已更新为 ${formatHour(nextState.autoNightAuditTime)}`
        : '夜审设置已更新'

  return {
    viewModel: adaptViewModel(
      { ...current.request, provider: current.provider, mockState: 'success' },
      {
        isNightAudit: nextState.isNightAudit,
        autoNightAuditTime: nextState.autoNightAuditTime,
        orderAmortizeStrategy: nextState.orderAmortizeStrategy,
        vendibleTypes: JSON.stringify(nextState.vendibleTypes),
      },
      {
        traceId: `${DEFAULT_TRACE_PREFIX}-night-audit-save-001`,
        timestamp: DEFAULT_TIMESTAMP,
        feedback,
      },
    ),
    feedback,
    traceId: `${DEFAULT_TRACE_PREFIX}-night-audit-save-001`,
  }
}

export async function saveFinanceAmortizeSetting(
  current: FinanceSettingViewModel,
  strategy: FinanceAmortizeStrategy,
  signal?: AbortSignal,
): Promise<FinanceSettingMutationResult> {
  await delay(160, signal)
  mockState = {
    ...mockState,
    orderAmortizeStrategy: strategy === 'calendar' ? 1 : 2,
  }
  writeLock(current.amortize.lockKey)

  const feedback = '连住订单分摊模式已更新'

  return {
    viewModel: adaptViewModel(
      { ...current.request, provider: current.provider, mockState: 'success' },
      {
        isNightAudit: mockState.isNightAudit,
        autoNightAuditTime: mockState.autoNightAuditTime,
        orderAmortizeStrategy: mockState.orderAmortizeStrategy,
        vendibleTypes: JSON.stringify(mockState.vendibleTypes),
      },
      {
        traceId: `${DEFAULT_TRACE_PREFIX}-amortize-save-001`,
        timestamp: DEFAULT_TIMESTAMP,
        feedback,
      },
    ),
    feedback,
    traceId: `${DEFAULT_TRACE_PREFIX}-amortize-save-001`,
  }
}

export async function saveFinanceVendibleSetting(
  current: FinanceSettingViewModel,
  selectedValues: number[],
  signal?: AbortSignal,
): Promise<FinanceSettingMutationResult> {
  const normalized = normalizeVendibleValues(selectedValues)

  await delay(160, signal)
  mockState = {
    ...mockState,
    vendibleTypes: normalized,
  }
  writeLock(current.vendible.lockKey)

  const feedback = '关房计入可售规则已更新'

  return {
    viewModel: adaptViewModel(
      { ...current.request, provider: current.provider, mockState: 'success' },
      {
        isNightAudit: mockState.isNightAudit,
        autoNightAuditTime: mockState.autoNightAuditTime,
        orderAmortizeStrategy: mockState.orderAmortizeStrategy,
        vendibleTypes: JSON.stringify(mockState.vendibleTypes),
      },
      {
        traceId: `${DEFAULT_TRACE_PREFIX}-vendible-save-001`,
        timestamp: DEFAULT_TIMESTAMP,
        feedback,
      },
    ),
    feedback,
    traceId: `${DEFAULT_TRACE_PREFIX}-vendible-save-001`,
  }
}

export async function initializeFinanceSettingDefaults(
  current: FinanceSettingViewModel,
  signal?: AbortSignal,
): Promise<FinanceSettingMutationResult> {
  await delay(160, signal)
  mockState = createDefaultMutableState()

  const feedback = '财务规则已初始化为默认方案'

  return {
    viewModel: adaptViewModel(
      { ...current.request, provider: current.provider, mockState: 'success' },
      {
        isNightAudit: mockState.isNightAudit,
        autoNightAuditTime: mockState.autoNightAuditTime,
        orderAmortizeStrategy: mockState.orderAmortizeStrategy,
        vendibleTypes: JSON.stringify(mockState.vendibleTypes),
      },
      {
        traceId: `${DEFAULT_TRACE_PREFIX}-initialize-001`,
        timestamp: DEFAULT_TIMESTAMP,
        feedback,
      },
    ),
    feedback,
    traceId: `${DEFAULT_TRACE_PREFIX}-initialize-001`,
  }
}

export function isFinanceRuleLocked(lockKey: string) {
  if (typeof window === 'undefined') return false
  return window.localStorage.getItem(lockKey) === TODAY_KEY
}

export function getFinanceLockDate(lockKey: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(lockKey)?.trim() || ''
}

function adaptViewModel(
  query: FinanceSettingQuery,
  payload: FinanceSettingPayload | undefined,
  envelope: Pick<FinanceSettingEnvelope<Record<string, unknown>>, 'traceId' | 'timestamp'> & {
    feedback?: string
  },
): FinanceSettingViewModel {
  const state = adaptMutableState(payload)
  const lockPrefix = query.campId || DEFAULT_CAMP_ID
  const amortizeLockKey = `${lockPrefix}${AMORTIZE_LOCK_SUFFIX}`
  const vendibleLockKey = `${lockPrefix}${VENDIBLE_LOCK_SUFFIX}`

  return {
    provider: query.provider,
    mockState: query.mockState,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    request: {
      campId: query.campId,
    },
    feedback: envelope.feedback ?? '财务设置数据已同步',
    isInitialized: Boolean(payload),
    permissionRoute: '/setting/role',
    canRoutePermissionSetting: true,
    lastUpdatedAt: '2026-05-20 20:15',
    nightAudit: {
      enabled: state.isNightAudit === 1,
      time: state.autoNightAuditTime,
      timeLabel: formatHour(state.autoNightAuditTime),
      options: timeOptions,
      saveRequest: {
        campId: query.campId,
        isNightAudit: state.isNightAudit,
        autoNightAuditTime: state.autoNightAuditTime,
      },
    },
    amortize: {
      strategy: state.orderAmortizeStrategy === 1 ? 'calendar' : 'average',
      options: amortizeOptions,
      lockKey: amortizeLockKey,
      saveRequest: {
        campId: query.campId,
        orderAmortizeStrategy: state.orderAmortizeStrategy,
      },
    },
    vendible: {
      selectedValues: [...state.vendibleTypes],
      options: vendibleOptions,
      lockKey: vendibleLockKey,
      saveRequest: {
        campId: query.campId,
        vendibleTypes: [...state.vendibleTypes],
      },
    },
    diagnostics: {
      provider: query.provider,
      mockState: query.mockState,
      getRequest: {
        endpoint: FINANCE_SETTING_GET_ENDPOINT,
        body: {
          campId: query.campId,
        },
      },
      saveRequests: {
        nightAudit: {
          endpoint: FINANCE_SETTING_SAVE_NIGHT_AUDIT_ENDPOINT,
          body: {
            campId: query.campId,
            isNightAudit: state.isNightAudit,
            autoNightAuditTime: state.autoNightAuditTime,
          },
        },
        amortize: {
          endpoint: FINANCE_SETTING_SAVE_STRATEGY_ENDPOINT,
          body: {
            campId: query.campId,
            orderAmortizeStrategy: state.orderAmortizeStrategy,
          },
        },
        vendible: {
          endpoint: FINANCE_SETTING_SAVE_VENDIBLE_ENDPOINT,
          body: {
            campId: query.campId,
            vendibleTypes: [...state.vendibleTypes],
          },
        },
      },
    },
  }
}

function adaptMutableState(payload: FinanceSettingPayload | undefined): MutableFinanceSettingState {
  if (!payload) {
    return {
      isNightAudit: 0,
      autoNightAuditTime: 6,
      orderAmortizeStrategy: 1,
      vendibleTypes: [1, 2, 3, 4, 5],
    }
  }

  return {
    isNightAudit: readBooleanNumber(payload.isNightAudit),
    autoNightAuditTime: clampTime(readNumber(payload.autoNightAuditTime, 6)),
    orderAmortizeStrategy: readStrategyNumber(payload.orderAmortizeStrategy),
    vendibleTypes: normalizeVendibleValues(readVendibleValues(payload.vendibleTypes)),
  }
}

function createDefaultMutableState(): MutableFinanceSettingState {
  return {
    isNightAudit: 0,
    autoNightAuditTime: 6,
    orderAmortizeStrategy: 1,
    vendibleTypes: [1, 2, 3, 4, 5],
  }
}

function createEnvelope(
  state: FinanceSettingMockState,
  message: string,
): FinanceSettingEnvelope<Record<string, unknown>> {
  return {
    code: state === 'error' ? 50001 : 0,
    message,
    data: {},
    traceId: `${DEFAULT_TRACE_PREFIX}-${state}-001`,
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function normalizeProvider(value: string | null | undefined): FinanceSettingProvider | undefined {
  return value === 'api' || value === 'mock' ? value : undefined
}

function normalizeMockState(value: string | null | undefined): FinanceSettingMockState | undefined {
  return value === 'empty' || value === 'error' || value === 'success' ? value : undefined
}

function readProvider(): FinanceSettingProvider {
  if (typeof window === 'undefined') return 'mock'
  return normalizeProvider(window.localStorage.getItem(FINANCE_SETTING_PROVIDER_KEY)) ?? 'mock'
}

function readMockState(): FinanceSettingMockState {
  if (typeof window === 'undefined') return 'success'
  return normalizeMockState(window.localStorage.getItem(FINANCE_SETTING_MOCK_STATE_KEY)) ?? 'success'
}

function readBooleanNumber(value: unknown): 0 | 1 {
  return String(value ?? '') === '1' ? 1 : 0
}

function readStrategyNumber(value: unknown): 1 | 2 {
  return String(value ?? '') === '2' ? 2 : 1
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return fallback
}

function readVendibleValues(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map((item) => Number(item)).filter((item) => Number.isInteger(item))
  }

  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.map((item) => Number(item)).filter((item) => Number.isInteger(item))
      }
    } catch {
      return [1, 2, 3, 4, 5]
    }
  }

  return [1, 2, 3, 4, 5]
}

function normalizeVendibleValues(values: number[]) {
  const normalized = Array.from(new Set(values.filter((value) => vendibleOptions.some((item) => item.value === value))))
  return normalized.length > 0 ? normalized : [1]
}

function clampTime(value: number) {
  if (!Number.isFinite(value)) return 6
  return Math.min(12, Math.max(0, Math.round(value)))
}

function formatHour(value: number) {
  return `${String(clampTime(value)).padStart(2, '0')}:00`
}

function writeLock(lockKey: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(lockKey, TODAY_KEY)
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
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
