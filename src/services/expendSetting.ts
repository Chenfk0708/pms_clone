export type ExpendSettingProviderName = 'mock' | 'api'
export type ExpendSettingMockState = 'success' | 'empty' | 'error'
export type ExpendSettingTab = 'income' | 'expense'

export type ExpendSettingQuery = {
  campId: string
  tab: ExpendSettingTab
}

export type ExpendSettingItem = {
  id: string
  name: string
  isDefault: boolean
  isCustom: boolean
  isIncome: boolean
  isEnabled: boolean
  bizType: number
  groupType: number
  groupName: string
  ignoreOrderGetItem: boolean
}

export type ExpendSettingGroup = {
  id: string
  name: string
  items: ExpendSettingItem[]
}

export type ExpendSettingOption = {
  id: string
  name: string
}

export type ExpendSettingItemStatus = 'enabled' | 'disabled'

export type ExpendSettingDashboard = {
  provider: ExpendSettingProviderName
  state: ExpendSettingMockState
  request: ExpendSettingQuery
  endpoints: string[]
  timestamp: string
  traceIds: string[]
  activeTab: ExpendSettingTab
  tabs: Array<{ key: ExpendSettingTab; label: string }>
  groups: ExpendSettingGroup[]
  disabledGroups: ExpendSettingGroup[]
  businessTypeOptions: ExpendSettingOption[]
  paymentWayOptions: ExpendSettingOption[]
  catalogPreview: string[]
}

export type CreateExpendSettingItemInput = {
  campId: string
  tab: ExpendSettingTab
  groupName: string
  name: string
  status: ExpendSettingItemStatus
}

export type CreateExpendSettingItemResult = {
  message: string
  item: ExpendSettingItem
  traceId: string
}

type TargetEnvelope<T> = {
  success: boolean
  errorCode: string | null
  errorMsg: string | null
  errorDetail: string | null
  data: T
}

type RawPaymentType = {
  paymentTypeId: string
  paymentTypeName: string
  ignoreOrderGetItem: number
  isCustom: number
  isIncome: number
  isEnable: number
  bizType: number
  groupType: number
}

type RawPaymentGroup = {
  groupType: number
  groupTypeName: string
  paymentTypes: RawPaymentType[]
}

type RawPaymentWay = {
  paymentWayId: string
  paymentWayName: string
  isCustom: number
  isEnable: number
}

const realBaseUrl = '/api'
const defaultCampId = '1796067693589061634'
const responseTimestamp = '2026-05-19T19:40:00+08:00'
const requestLatencyMs = 180
const endpoints = ['/paymentTypes/get', '/paymentTypes/get/v2', '/paymentWays/get']

const tabs: ExpendSettingDashboard['tabs'] = [
  { key: 'income', label: '收入项' },
  { key: 'expense', label: '支出项' },
]

const businessTypeOptions: ExpendSettingOption[] = [
  { id: '1', name: '住宿' },
  { id: '2', name: '餐饮' },
  { id: '3', name: '商超' },
  { id: '4', name: '娱乐' },
  { id: '5', name: '场地' },
]

const paymentWayOptions: ExpendSettingOption[] = [
  { id: '1', name: '平台代收' },
  { id: '2', name: '微信' },
  { id: '3', name: '支付宝' },
  { id: '4', name: '其他' },
  { id: '5', name: '现金' },
  { id: '6', name: '银行转帐' },
  { id: '7', name: '信用卡' },
  { id: '11', name: '通联' },
  { id: '12', name: '储值金' },
  { id: '13', name: '暂未收款' },
  { id: '14', name: '现场收款' },
]

const visiblePaymentTypes: RawPaymentType[] = [
  rawType('6', '加床', 1, 1),
  rawType('7', '加人', 1, 1),
  rawType('9', '损坏赔偿', 1, 1),
  rawType('10', '其他收入', 1, 1),
  rawType('20', '其他支出', 0, 1),
  rawType('34', '加时(延迟退房)', 1, 1),
  rawType('35', '餐饮', 1, 1),
  rawType('36', '旅游服务', 1, 1),
  rawType('50', '退房费', 0, 1),
  rawType('54', '其他佣金支出', 0, 1),
]

const catalogPreview = [
  '房费',
  '清洁费',
  '平台服务费',
  '押金',
  '退订扣款',
  '保洁费',
  '长租租金',
  '燃气费',
  '钟点房',
  '押金逾期费',
]

export class ExpendSettingServiceError extends Error {
  readonly provider: ExpendSettingProviderName
  readonly state: ExpendSettingMockState

  constructor(message: string, provider: ExpendSettingProviderName, state: ExpendSettingMockState) {
    super(message)
    this.name = 'ExpendSettingServiceError'
    this.provider = provider
    this.state = state
  }
}

export function getDefaultExpendSettingQuery(): ExpendSettingQuery {
  return {
    campId: defaultCampId,
    tab: 'income',
  }
}

export function resolveExpendSettingProvider(): ExpendSettingProviderName {
  const configured = readRuntimeConfig('pms.expendSettingProvider') || import.meta.env.VITE_EXPEND_SETTING_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

export function resolveExpendSettingMockState(): ExpendSettingMockState {
  const fromUrl = readCurrentMockState()
  if (fromUrl) return fromUrl
  const configured = readRuntimeConfig('pms.expendSettingMockState') || import.meta.env.VITE_EXPEND_SETTING_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

export async function fetchExpendSettingDashboard(
  request: ExpendSettingQuery,
  signal?: AbortSignal,
): Promise<ExpendSettingDashboard> {
  const normalizedRequest = normalizeQuery(request)
  const provider = resolveExpendSettingProvider()

  if (provider === 'api') {
    return loadApiDashboard(normalizedRequest, signal)
  }

  await waitForLatency(signal)
  const state = resolveExpendSettingMockState()
  if (state === 'error') {
    throw new ExpendSettingServiceError('收入/支出设置数据加载失败，请稍后重试', 'mock', 'error')
  }

  return buildDashboardFromGroups(normalizedRequest, state === 'empty' ? [] : buildVisibleGroups(normalizedRequest.tab), 'mock', state)
}

export async function createExpendSettingItem(
  input: CreateExpendSettingItemInput,
  signal?: AbortSignal,
): Promise<CreateExpendSettingItemResult> {
  const provider = resolveExpendSettingProvider()
  await waitForLatency(signal)

  const trimmedName = input.name.trim()
  if (!trimmedName) {
    throw new ExpendSettingServiceError('请输入项目名称', provider, resolveExpendSettingMockState())
  }

  if (provider === 'api') {
    throw new ExpendSettingServiceError('当前环境未启用收入/支出设置新增接口', 'api', 'error')
  }

  if (resolveExpendSettingMockState() === 'error') {
    throw new ExpendSettingServiceError('收入/支出设置新增失败，请稍后重试', 'mock', 'error')
  }

  return {
    message: `已新增${input.tab === 'income' ? '收入' : '支出'}项目：${trimmedName}`,
    traceId: `mock-setting-expend-create-${input.tab}-${slugify(trimmedName)}`,
    item: {
      id: `mock-${input.tab}-${slugify(trimmedName)}`,
      name: trimmedName,
      isDefault: false,
      isCustom: true,
      isIncome: input.tab === 'income',
      isEnabled: input.status === 'enabled',
      bizType: 2,
      groupType: resolveGroupType(input.groupName),
      groupName: input.groupName,
      ignoreOrderGetItem: false,
    },
  }
}

function normalizeQuery(request: ExpendSettingQuery): ExpendSettingQuery {
  const defaults = getDefaultExpendSettingQuery()
  return {
    campId: request.campId || defaults.campId,
    tab: request.tab === 'expense' ? 'expense' : 'income',
  }
}

function buildVisibleGroups(tab: ExpendSettingTab) {
  return businessTypeOptions.map((group) => ({
    id: group.id,
    name: group.name,
    items: visiblePaymentTypes
      .filter((item) => item.isEnable === 1 && item.groupType === resolveGroupType(group.name))
      .filter((item) => (tab === 'income' ? item.isIncome === 1 : item.isIncome === 0))
      .map(adaptPaymentType),
  }))
}

function createEmptyGroups() {
  return businessTypeOptions.map((group) => ({
    id: `disabled-${group.id}`,
    name: group.name,
    items: [],
  }))
}

function buildDashboardFromGroups(
  request: ExpendSettingQuery,
  groups: ExpendSettingGroup[],
  provider: ExpendSettingProviderName,
  state: ExpendSettingMockState,
): ExpendSettingDashboard {
  return {
    provider,
    state,
    request,
    endpoints: [...endpoints],
    timestamp: responseTimestamp,
    traceIds: [
      'mock-setting-expend-paymentTypes-get-001',
      'mock-setting-expend-paymentTypes-get-v2-bizType2-001',
      'mock-setting-expend-paymentTypes-get-v2-bizType3-001',
      'mock-setting-expend-paymentWays-get-001',
    ],
    activeTab: request.tab,
    tabs: tabs.map((item) => ({ ...item })),
    groups,
    disabledGroups: createEmptyGroups(),
    businessTypeOptions: businessTypeOptions.map((item) => ({ ...item })),
    paymentWayOptions: paymentWayOptions.map((item) => ({ ...item })),
    catalogPreview: [...catalogPreview],
  }
}

async function loadApiDashboard(request: ExpendSettingQuery, signal?: AbortSignal): Promise<ExpendSettingDashboard> {
  const [catalogEnvelope, bizTypeTwoEnvelope, bizTypeThreeEnvelope, paymentWaysEnvelope] = await Promise.all([
    postHudson<{ paymentTypes: RawPaymentType[] }>('/paymentTypes/get', { campId: request.campId }, signal),
    postHudson<{ paymentGroups: RawPaymentGroup[] }>(
      '/paymentTypes/get/v2',
      { campId: request.campId, bizTypes: [2], isEnable: 1 },
      signal,
    ),
    postHudson<{ paymentGroups: RawPaymentGroup[] }>(
      '/paymentTypes/get/v2',
      { campId: request.campId, bizTypes: [3], isEnable: 1 },
      signal,
    ),
    postHudson<{ paymentWays: RawPaymentWay[] }>('/paymentWays/get', { campId: request.campId }, signal),
  ])

  assertSuccess(catalogEnvelope)
  assertSuccess(bizTypeTwoEnvelope)
  assertSuccess(bizTypeThreeEnvelope)
  assertSuccess(paymentWaysEnvelope)

  const mergedPaymentTypes = mergeUniqueTypes([
    ...extractPaymentTypes(bizTypeTwoEnvelope.data.paymentGroups),
    ...extractPaymentTypes(bizTypeThreeEnvelope.data.paymentGroups),
  ])

  const groups = businessTypeOptions.map((group) => ({
    id: group.id,
    name: group.name,
    items: mergedPaymentTypes
      .filter((item) => item.groupType === resolveGroupType(group.name))
      .filter((item) => (request.tab === 'income' ? item.isIncome === 1 : item.isIncome === 0))
      .map(adaptPaymentType),
  }))

  return {
    provider: 'api',
    state: 'success',
    request,
    endpoints: [...endpoints],
    timestamp: new Date().toISOString(),
    traceIds: [
      'api-paymentTypes-get',
      'api-paymentTypes-get-v2-bizType2',
      'api-paymentTypes-get-v2-bizType3',
      'api-paymentWays-get',
    ],
    activeTab: request.tab,
    tabs: tabs.map((item) => ({ ...item })),
    groups,
    disabledGroups: createEmptyGroups(),
    businessTypeOptions: businessTypeOptions.map((item) => ({ ...item })),
    paymentWayOptions: paymentWaysEnvelope.data.paymentWays
      .filter((item) => item.isEnable === 1)
      .map((item) => ({ id: item.paymentWayId, name: item.paymentWayName })),
    catalogPreview: catalogEnvelope.data.paymentTypes.slice(0, 10).map((item) => item.paymentTypeName),
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<TargetEnvelope<T>> {
  const response = await fetch(`${realBaseUrl}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: TargetEnvelope<T> | null
  try {
    payload = (await response.json()) as TargetEnvelope<T>
  } catch {
    payload = null
  }

  if (!response.ok || !payload) {
    throw new ExpendSettingServiceError(`收入/支出设置接口请求失败：${endpoint}`, 'api', 'error')
  }

  return payload
}

function extractPaymentTypes(groups: RawPaymentGroup[]) {
  return groups.flatMap((group) => group.paymentTypes)
}

function mergeUniqueTypes(items: RawPaymentType[]) {
  const map = new Map<string, RawPaymentType>()
  for (const item of items) {
    map.set(item.paymentTypeId, item)
  }
  return [...map.values()]
}

function adaptPaymentType(item: RawPaymentType): ExpendSettingItem {
  return {
    id: item.paymentTypeId,
    name: item.paymentTypeName,
    isDefault: item.isCustom === 0,
    isCustom: item.isCustom === 1,
    isIncome: item.isIncome === 1,
    isEnabled: item.isEnable === 1,
    bizType: item.bizType,
    groupType: item.groupType,
    groupName: resolveGroupName(item.groupType),
    ignoreOrderGetItem: item.ignoreOrderGetItem === 1,
  }
}

function assertSuccess<T>(envelope: TargetEnvelope<T>) {
  if (!envelope.success) {
    throw new ExpendSettingServiceError(
      envelope.errorMsg || envelope.errorDetail || '收入/支出设置数据加载失败，请稍后重试',
      'api',
      'error',
    )
  }
}

function readCurrentMockState(): ExpendSettingMockState | '' {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  const configured = params.get('mockState') || params.get('expendSettingMockState')
  return configured === 'success' || configured === 'empty' || configured === 'error' ? configured : ''
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function waitForLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Request aborted', 'AbortError')
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, requestLatencyMs)
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

function resolveGroupType(groupName: string) {
  return businessTypeOptions.find((item) => item.name === groupName)?.id ? Number(businessTypeOptions.find((item) => item.name === groupName)?.id) : 1
}

function resolveGroupName(groupType: number) {
  return businessTypeOptions.find((item) => Number(item.id) === groupType)?.name ?? '住宿'
}

function slugify(value: string) {
  return value.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '').slice(0, 24)
}

function rawType(id: string, name: string, isIncome: number, groupType: number): RawPaymentType {
  return {
    paymentTypeId: id,
    paymentTypeName: name,
    ignoreOrderGetItem: 0,
    isCustom: 0,
    isIncome,
    isEnable: 1,
    bizType: 1,
    groupType,
  }
}
