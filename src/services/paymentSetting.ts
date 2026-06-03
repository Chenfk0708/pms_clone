export type PaymentSettingProviderName = 'mock' | 'api'
export type PaymentSettingMockState = 'success' | 'empty' | 'error'
export type PaymentMethodStatus = 'enabled' | 'disabled'
export type PaymentMethodMoveDirection = 'up' | 'down'

export type PaymentSettingPageQuery = {
  campId?: string
}

export type PaymentMethodSummary = {
  id: string
  name: string
  status: PaymentMethodStatus
  sortOrder: number
  isSystemDefault: boolean
  isPreferred: boolean
  description: string
  availableScopes: string[]
  settlementAccount: string
  lastUsedAt: string
  updatedAt: string
}

export type PaymentMethodDetail = PaymentMethodSummary & {
  code: string
  remark: string
  usageCountLabel: string
}

export type PaymentSettingPageData = {
  provider: PaymentSettingProviderName
  mockState: PaymentSettingMockState
  endpoint: string
  traceId: string
  timestamp: string
  requestBody: Record<string, unknown>
  requestSummary: string[]
  notice: string
  campName: string
  updatedAt: string
  enabledMethods: PaymentMethodSummary[]
  disabledMethods: PaymentMethodSummary[]
}

export type PaymentMethodDetailData = {
  provider: PaymentSettingProviderName
  endpoint: string
  traceId: string
  timestamp: string
  requestBody: Record<string, unknown>
  requestSummary: string[]
  detail: PaymentMethodDetail
}

export type PaymentSettingMutationData = {
  provider: PaymentSettingProviderName
  endpoint: string
  traceId: string
  timestamp: string
  requestBody: Record<string, unknown>
  requestSummary: string[]
  message: string
}

type PaymentSettingEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type PaymentMethodRecord = {
  id: string
  code: string
  name: string
  status: PaymentMethodStatus
  isSystemDefault: boolean
  isPreferred: boolean
  description: string
  availableScopes: string[]
  settlementAccount: string
  lastUsedAt: string
  updatedAt: string
  remark: string
}

type RawPaymentWay = {
  paymentWayId?: string | number
  paymentWayName?: string
  paymentWayCode?: string
  wayType?: string
  sortNo?: number
  isCustom?: number
  isEnable?: number
}

const defaultCampId = '1796067693589061634'
const mockTimestamp = '2026-05-20T01:20:00+08:00'
const mockCampName = '路客云 6TS5 店铺'

export const paymentSettingListEndpoint = '/paymentSettings/list'
export const paymentSettingDetailEndpoint = '/paymentSettings/detail'
export const paymentSettingCreateEndpoint = '/paymentSettings/create'
export const paymentSettingStatusEndpoint = '/paymentSettings/status/update'
export const paymentSettingDefaultEndpoint = '/paymentSettings/default/update'
export const paymentSettingSortEndpoint = '/paymentSettings/sort/update'
export const paymentSettingExportEndpoint = '/paymentSettings/export'
export const paymentWaysEndpoint = '/paymentWays/get'

const initialPaymentMethods: PaymentMethodRecord[] = [
  {
    id: 'payment-platform-collect',
    code: 'platform_collect',
    name: '平台代收',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: true,
    description: '平台统一代收，适用于线上预付订单。',
    availableScopes: ['订单收款', '线上预付'],
    settlementAccount: '平台清分账户',
    lastUsedAt: '2026-05-19 23:18',
    updatedAt: '2026-05-19 23:18',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-wechat',
    code: 'wechat',
    name: '微信',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '用于微信支付、扫码支付和客服代收。',
    availableScopes: ['前台收款', '扫码支付'],
    settlementAccount: '微信商户号 18123941382',
    lastUsedAt: '2026-05-19 22:54',
    updatedAt: '2026-05-19 22:54',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-alipay',
    code: 'alipay',
    name: '支付宝',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '用于支付宝扫码、线下核销和转付场景。',
    availableScopes: ['前台收款', '线下核销'],
    settlementAccount: '支付宝收款户',
    lastUsedAt: '2026-05-19 21:13',
    updatedAt: '2026-05-19 21:13',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-other',
    code: 'other',
    name: '其他',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '兜底记录无法归类的收款方式。',
    availableScopes: ['补录收款'],
    settlementAccount: '线下手工核对',
    lastUsedAt: '2026-05-18 17:40',
    updatedAt: '2026-05-18 17:40',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-cash',
    code: 'cash',
    name: '现金',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '适用于门店前台现金收款场景。',
    availableScopes: ['前台收款'],
    settlementAccount: '门店现金箱',
    lastUsedAt: '2026-05-19 18:36',
    updatedAt: '2026-05-19 18:36',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-bank-transfer',
    code: 'bank_transfer',
    name: '银行转帐',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '适用于企业客户对公转账入账。',
    availableScopes: ['对公收款', '企业结算'],
    settlementAccount: '招商银行尾号 2048',
    lastUsedAt: '2026-05-17 15:08',
    updatedAt: '2026-05-17 15:08',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-credit-card',
    code: 'credit_card',
    name: '信用卡',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '适用于 POS 收款及信用卡担保入账。',
    availableScopes: ['前台收款'],
    settlementAccount: 'POS 终端 A-03',
    lastUsedAt: '2026-05-18 12:10',
    updatedAt: '2026-05-18 12:10',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-allinpay',
    code: 'allinpay',
    name: '通联',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '用于通联聚合支付的统一记账。',
    availableScopes: ['扫码支付', '统一清分'],
    settlementAccount: '通联聚合户',
    lastUsedAt: '2026-05-16 11:20',
    updatedAt: '2026-05-16 11:20',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-balance',
    code: 'stored_balance',
    name: '储值金',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '用于会员储值消费与补差。',
    availableScopes: ['会员消费'],
    settlementAccount: '会员钱包',
    lastUsedAt: '2026-05-19 19:42',
    updatedAt: '2026-05-19 19:42',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-pending',
    code: 'pending_collection',
    name: '暂未收款',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '用于先记账、后补录收款方式的场景。',
    availableScopes: ['订单挂账'],
    settlementAccount: '待补录',
    lastUsedAt: '2026-05-19 17:03',
    updatedAt: '2026-05-19 17:03',
    remark: '系统默认内置方式，不支持删除。',
  },
  {
    id: 'payment-onsite',
    code: 'onsite_collection',
    name: '现场收款',
    status: 'enabled',
    isSystemDefault: true,
    isPreferred: false,
    description: '适用于线下核销、补差和现场收现。',
    availableScopes: ['现场补差', '线下核销'],
    settlementAccount: '前台现场核销',
    lastUsedAt: '2026-05-19 16:44',
    updatedAt: '2026-05-19 16:44',
    remark: '系统默认内置方式，不支持删除。',
  },
]

function cloneMethods(methods: PaymentMethodRecord[]) {
  return methods.map((method) => ({
    ...method,
    availableScopes: [...method.availableScopes],
  }))
}

let mockMethods = cloneMethods(initialPaymentMethods)

export class PaymentSettingRequestError extends Error {
  constructor(message = '支付方式设置加载失败，请稍后重试') {
    super(message)
    this.name = 'PaymentSettingRequestError'
  }
}

export async function loadPaymentSettingPage(
  query: PaymentSettingPageQuery = {},
  signal?: AbortSignal,
): Promise<PaymentSettingPageData> {
  const provider = resolveProvider()
  const requestBody = createListRequestBody(query)

  if (provider === 'api') {
    const payload = (await postJson(paymentWaysEndpoint, requestBody, signal)) as PaymentSettingEnvelope<{
      paymentWays?: RawPaymentWay[]
      methods?: PaymentMethodRecord[]
      notice?: string
    }>
    return adaptListEnvelope(adaptPaymentWaysEnvelope(payload), requestBody, 'api', resolveMockState(), paymentWaysEndpoint)
  }

  await waitForMockLatency(signal)
  const envelope = buildMockListEnvelope()
  return adaptListEnvelope(envelope, requestBody, 'mock', resolveMockState())
}

export async function loadPaymentMethodDetail(
  methodId: string,
  signal?: AbortSignal,
): Promise<PaymentMethodDetailData> {
  const provider = resolveProvider()
  const requestBody = { methodId }

  if (provider === 'api') {
    const payload = (await postJson(paymentSettingDetailEndpoint, requestBody, signal)) as PaymentSettingEnvelope<PaymentMethodRecord>
    return adaptDetailEnvelope(payload, requestBody, 'api')
  }

  await waitForMockLatency(signal)
  const envelope = buildMockDetailEnvelope(methodId)
  return adaptDetailEnvelope(envelope, requestBody, 'mock')
}

export async function createPaymentMethod(
  input: { name: string; status: PaymentMethodStatus },
  signal?: AbortSignal,
): Promise<PaymentSettingMutationData> {
  const name = input.name.trim()
  if (!name) {
    throw new PaymentSettingRequestError('请输入支付方式名称')
  }
  if (mockMethods.some((method) => method.name === name)) {
    throw new PaymentSettingRequestError(`支付方式“${name}”已存在，请更换名称`)
  }

  const requestBody = {
    campId: defaultCampId,
    name,
    status: input.status,
  }

  if (resolveProvider() === 'api') {
    await postJson(paymentSettingCreateEndpoint, requestBody, signal)
  }

  await waitForMockLatency(signal)
  const nextRecord: PaymentMethodRecord = {
    id: `payment-custom-${Date.now()}`,
    code: `custom_${Date.now()}`,
    name,
    status: input.status,
    isSystemDefault: false,
    isPreferred: false,
    description: '自定义支付方式，用于补充门店特殊收款场景。',
    availableScopes: input.status === 'enabled' ? ['门店收款'] : ['待启用'],
    settlementAccount: '待配置',
    lastUsedAt: '未启用',
    updatedAt: '2026-05-20 01:20',
    remark: '自定义支付方式，可启停、可设为默认。',
  }

  const insertIndex = input.status === 'enabled' ? enabledRecords(mockMethods).length : mockMethods.length
  mockMethods = [...mockMethods.slice(0, insertIndex), nextRecord, ...mockMethods.slice(insertIndex)]

  return buildMutationResult(paymentSettingCreateEndpoint, requestBody, 'mock', 'create-001', `已新增支付方式：${name}`)
}

export async function updatePaymentMethodStatus(
  input: { methodId: string; nextStatus: PaymentMethodStatus },
  signal?: AbortSignal,
): Promise<PaymentSettingMutationData> {
  const requestBody = {
    campId: defaultCampId,
    methodId: input.methodId,
    status: input.nextStatus,
  }

  if (resolveProvider() === 'api') {
    await postJson(paymentSettingStatusEndpoint, requestBody, signal)
  }

  await waitForMockLatency(signal)
  const current = findMethod(input.methodId)
  current.status = input.nextStatus
  current.updatedAt = '2026-05-20 01:20'
  if (input.nextStatus === 'disabled') {
    current.isPreferred = false
  }
  mockMethods = normalizeMethodOrder(mockMethods)

  const actionLabel = input.nextStatus === 'enabled' ? '启用' : '停用'
  return buildMutationResult(
    paymentSettingStatusEndpoint,
    requestBody,
    'mock',
    `status-${input.nextStatus}-001`,
    `已${actionLabel}支付方式：${current.name}`,
  )
}

export async function setDefaultPaymentMethod(
  input: { methodId: string },
  signal?: AbortSignal,
): Promise<PaymentSettingMutationData> {
  const requestBody = {
    campId: defaultCampId,
    methodId: input.methodId,
  }

  if (resolveProvider() === 'api') {
    await postJson(paymentSettingDefaultEndpoint, requestBody, signal)
  }

  await waitForMockLatency(signal)
  const current = findMethod(input.methodId)
  mockMethods = mockMethods.map((method) => ({
    ...method,
    isPreferred: method.id === current.id,
    updatedAt: method.id === current.id ? '2026-05-20 01:20' : method.updatedAt,
    availableScopes: [...method.availableScopes],
  }))

  return buildMutationResult(
    paymentSettingDefaultEndpoint,
    requestBody,
    'mock',
    'default-001',
    `已将${current.name}设为默认支付方式`,
  )
}

export async function movePaymentMethod(
  input: { methodId: string; direction: PaymentMethodMoveDirection },
  signal?: AbortSignal,
): Promise<PaymentSettingMutationData> {
  const requestBody = {
    campId: defaultCampId,
    methodId: input.methodId,
    direction: input.direction,
  }

  if (resolveProvider() === 'api') {
    await postJson(paymentSettingSortEndpoint, requestBody, signal)
  }

  await waitForMockLatency(signal)
  const target = findMethod(input.methodId)
  const records = target.status === 'enabled' ? enabledRecords(mockMethods) : disabledRecords(mockMethods)
  const index = records.findIndex((method) => method.id === input.methodId)
  const nextIndex = input.direction === 'up' ? index - 1 : index + 1
  if (index >= 0 && nextIndex >= 0 && nextIndex < records.length) {
    const moved = [...records]
    const [record] = moved.splice(index, 1)
    moved.splice(nextIndex, 0, record)
    mockMethods = normalizeMethodOrder(rebuildStatusScopedMethods(mockMethods, target.status, moved))
  }

  return buildMutationResult(
    paymentSettingSortEndpoint,
    requestBody,
    'mock',
    `sort-${input.direction}-001`,
    input.direction === 'up' ? '已上移支付方式' : '已下移支付方式',
  )
}

export async function createPaymentSettingExportTask(signal?: AbortSignal): Promise<PaymentSettingMutationData> {
  const requestBody = {
    campId: defaultCampId,
    exportAt: mockTimestamp,
  }

  if (resolveProvider() === 'api') {
    await postJson(paymentSettingExportEndpoint, requestBody, signal)
  }

  await waitForMockLatency(signal)
  return buildMutationResult(paymentSettingExportEndpoint, requestBody, 'mock', 'export-001', '导出任务已创建')
}

function createListRequestBody(query: PaymentSettingPageQuery) {
  return {
    campId: query.campId || resolveCampId(),
    includeDisabled: true,
  }
}

function buildMockListEnvelope(): PaymentSettingEnvelope<{ methods: PaymentMethodRecord[]; notice: string }> {
  const mockState = resolveMockState()
  if (mockState === 'error') {
    throw new PaymentSettingRequestError('支付方式设置加载失败，请稍后重试')
  }

  const methods = mockState === 'empty' ? [] : cloneMethods(mockMethods)
  return {
    code: 0,
    message: 'success',
    data: {
      methods,
      notice: '系统默认支付方式不支持编辑和删除，可直接拖动调整排序。',
    },
    traceId:
      mockState === 'empty'
        ? 'mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-list-empty-001'
        : 'mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-list-success-001',
    timestamp: mockTimestamp,
  }
}

function buildMockDetailEnvelope(methodId: string): PaymentSettingEnvelope<PaymentMethodRecord> {
  const method = findMethod(methodId)
  return {
    code: 0,
    message: 'success',
    data: { ...method, availableScopes: [...method.availableScopes] },
    traceId: 'mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-detail-success-001',
    timestamp: mockTimestamp,
  }
}

function adaptPaymentWaysEnvelope(
  envelope: PaymentSettingEnvelope<{ paymentWays?: RawPaymentWay[]; methods?: PaymentMethodRecord[]; notice?: string }>,
): PaymentSettingEnvelope<{ methods: PaymentMethodRecord[]; notice: string }> {
  if (envelope.code !== 0) {
    return {
      ...envelope,
      data: {
        methods: [],
        notice: '',
      },
    }
  }

  const methods = Array.isArray(envelope.data.methods)
    ? envelope.data.methods
    : (envelope.data.paymentWays ?? []).map(adaptPaymentWay)

  return {
    ...envelope,
    data: {
      methods,
      notice: envelope.data.notice || '系统默认支付方式不支持编辑和删除，可直接拖动调整排序。',
    },
  }
}

function adaptPaymentWay(way: RawPaymentWay): PaymentMethodRecord {
  const id = String(way.paymentWayId ?? '')
  const name = way.paymentWayName?.trim() || id || '-'
  const isEnabled = way.isEnable !== 0
  const isCustom = way.isCustom === 1
  const updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')

  return {
    id,
    code: way.paymentWayCode || id,
    name,
    status: isEnabled ? 'enabled' : 'disabled',
    isSystemDefault: !isCustom,
    isPreferred: false,
    description: way.wayType ? `接口支付方式：${way.wayType}` : '接口支付方式',
    availableScopes: isEnabled ? ['门店收款'] : ['已停用'],
    settlementAccount: way.paymentWayCode || '-',
    lastUsedAt: '-',
    updatedAt,
    remark: isCustom ? '自定义支付方式' : '系统支付方式',
  }
}

function adaptListEnvelope(
  envelope: PaymentSettingEnvelope<{ methods: PaymentMethodRecord[]; notice: string }>,
  requestBody: Record<string, unknown>,
  provider: PaymentSettingProviderName,
  mockState: PaymentSettingMockState,
  endpoint = paymentSettingListEndpoint,
): PaymentSettingPageData {
  if (envelope.code !== 0) {
    throw new PaymentSettingRequestError(envelope.message || '支付方式设置加载失败，请稍后重试')
  }

  const allMethods = Array.isArray(envelope.data.methods) ? envelope.data.methods : []
  const normalizedMethods = normalizeMethodOrder(allMethods)
  const enabledMethods = normalizedMethods.filter((method) => method.status === 'enabled').map((method, index) => adaptSummary(method, index))
  const disabledMethods = normalizedMethods
    .filter((method) => method.status === 'disabled')
    .map((method, index) => adaptSummary(method, index))

  return {
    provider,
    mockState,
    endpoint,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    requestBody,
    requestSummary: [
      `provider=${provider}`,
      `mockState=${mockState}`,
      `traceId=${envelope.traceId}`,
      `path=${endpoint}`,
      `campId=${String(requestBody.campId ?? defaultCampId)}`,
      'includeDisabled=true',
    ],
    notice: envelope.data.notice,
    campName: mockCampName,
    updatedAt: enabledMethods[0]?.updatedAt ?? '2026-05-20 01:20',
    enabledMethods,
    disabledMethods,
  }
}

function adaptDetailEnvelope(
  envelope: PaymentSettingEnvelope<PaymentMethodRecord>,
  requestBody: Record<string, unknown>,
  provider: PaymentSettingProviderName,
): PaymentMethodDetailData {
  if (envelope.code !== 0) {
    throw new PaymentSettingRequestError(envelope.message || '支付方式详情加载失败，请稍后重试')
  }

  const detail = adaptDetail(envelope.data)
  return {
    provider,
    endpoint: paymentSettingDetailEndpoint,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    requestBody,
    requestSummary: [
      `provider=${provider}`,
      `traceId=${envelope.traceId}`,
      `path=${paymentSettingDetailEndpoint}`,
      `methodId=${String(requestBody.methodId ?? '')}`,
      `methodName=${detail.name}`,
    ],
    detail,
  }
}

function buildMutationResult(
  endpoint: string,
  requestBody: Record<string, unknown>,
  provider: PaymentSettingProviderName,
  traceSuffix: string,
  message: string,
): PaymentSettingMutationData {
  return {
    provider,
    endpoint,
    traceId: `mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-${traceSuffix}`,
    timestamp: mockTimestamp,
    requestBody,
    requestSummary: [
      `provider=${provider}`,
      `traceId=mock-shezhi--tongyong-shezhi--zhifu-fangshi-shezhi-${traceSuffix}`,
      `path=${endpoint}`,
      ...Object.entries(requestBody).map(([key, value]) => `${key}=${String(value)}`),
    ],
    message,
  }
}

function adaptSummary(method: PaymentMethodRecord, index: number): PaymentMethodSummary {
  return {
    id: method.id,
    name: method.name,
    status: method.status,
    sortOrder: index + 1,
    isSystemDefault: method.isSystemDefault,
    isPreferred: method.isPreferred,
    description: method.description,
    availableScopes: [...method.availableScopes],
    settlementAccount: method.settlementAccount,
    lastUsedAt: method.lastUsedAt,
    updatedAt: method.updatedAt,
  }
}

function adaptDetail(method: PaymentMethodRecord): PaymentMethodDetail {
  return {
    ...adaptSummary(method, 0),
    code: method.code,
    remark: method.remark,
    usageCountLabel: method.status === 'enabled' ? '近 30 天有收款记录' : '当前停用，暂无收款记录',
  }
}

function resolveProvider(): PaymentSettingProviderName {
  const configured =
    readRuntimeConfig('pms.paymentSettingProvider') || (import.meta.env.VITE_PAYMENT_SETTING_PROVIDER as string | undefined)
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function resolveMockState(): PaymentSettingMockState {
  const fromUrl = readUrlState(['mockState', 'paymentSettingMockState'])
  if (fromUrl) return fromUrl
  const configured =
    readRuntimeConfig('pms.paymentSettingMockState') || (import.meta.env.VITE_PAYMENT_SETTING_MOCK_STATE as string | undefined)
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function resolveMockLatencyMs() {
  const configured =
    readRuntimeConfig('pms.paymentSettingMockLatencyMs') || (import.meta.env.VITE_PAYMENT_SETTING_MOCK_LATENCY_MS as string | undefined)
  const latency = Number(configured)
  return Number.isFinite(latency) && latency > 0 ? latency : 0
}

function readUrlState(keys: string[]): PaymentSettingMockState | '' {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  for (const key of keys) {
    const value = params.get(key)
    if (value === 'success' || value === 'empty' || value === 'error') return value
  }
  return ''
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function postJson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch(`${resolveApiBase()}${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  })

  let payload: PaymentSettingEnvelope<unknown> | null
  try {
    payload = (await response.json()) as PaymentSettingEnvelope<unknown>
  } catch {
    payload = null
  }

  if (!response.ok || !payload || payload.code !== 0) {
    throw new PaymentSettingRequestError(payload?.message || `${endpoint} 返回 HTTP ${response.status}`)
  }
  return payload
}

function resolveApiBase() {
  return resolveProvider() === 'api' ? '/api' : ''
}

function resolveCampId() {
  const storageCampId =
    readRuntimeConfig('pmsCampId') || readRuntimeConfig('pms.currentCampId') || readRuntimeConfig('pms.campId')
  const envCampId = (import.meta.env.VITE_PMS_CAMP_ID as string | undefined)?.trim() || ''
  return storageCampId || envCampId || defaultCampId
}

async function waitForMockLatency(signal?: AbortSignal) {
  const latencyMs = resolveMockLatencyMs()
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
  if (latencyMs <= 0) return
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, latencyMs)
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

function normalizeMethodOrder(methods: PaymentMethodRecord[]) {
  const enabled = enabledRecords(methods)
  const disabled = disabledRecords(methods)
  return [...enabled, ...disabled].map((method) => ({
    ...method,
    availableScopes: [...method.availableScopes],
  }))
}

function rebuildStatusScopedMethods(
  methods: PaymentMethodRecord[],
  status: PaymentMethodStatus,
  scopedMethods: PaymentMethodRecord[],
) {
  const unaffected = methods.filter((method) => method.status !== status)
  return status === 'enabled' ? [...scopedMethods, ...unaffected] : [...enabledRecords(methods), ...scopedMethods]
}

function enabledRecords(methods: PaymentMethodRecord[]) {
  return methods.filter((method) => method.status === 'enabled').map((method) => ({ ...method, availableScopes: [...method.availableScopes] }))
}

function disabledRecords(methods: PaymentMethodRecord[]) {
  return methods.filter((method) => method.status === 'disabled').map((method) => ({ ...method, availableScopes: [...method.availableScopes] }))
}

function findMethod(methodId: string) {
  const method = mockMethods.find((item) => item.id === methodId)
  if (!method) {
    throw new PaymentSettingRequestError('当前支付方式不存在，请刷新后重试')
  }
  return method
}
