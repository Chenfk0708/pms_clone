export type GlobalSettingProviderName = 'mock' | 'api'
export type GlobalSettingMockMode = 'success' | 'empty' | 'error'
export type GlobalSettingAuthorizationStatus = 'all' | 'authorized' | 'warning' | 'unauthorized'
export type GlobalSettingConnectorStatus = 'all' | 'online' | 'warning' | 'offline'

export type GlobalSettingFilters = {
  campId: string
  authorizationStatus: GlobalSettingAuthorizationStatus
  connectorStatus: GlobalSettingConnectorStatus
  keyword: string
  provider?: GlobalSettingProviderName
}

export type GlobalSettingSummaryMetric = {
  label: string
  value: string
  hint: string
  tone: 'blue' | 'green' | 'orange' | 'red'
}

export type GlobalSettingStoreRow = {
  id: string
  poiId: string
  campId: string
  name: string
  city: string
  connectorStatus: Exclude<GlobalSettingConnectorStatus, 'all'>
  monitorStatus: 'checking' | 'delay' | 'paused'
  ctripAuthStatus: 'authorized' | 'failed' | 'unauthorized'
  meituanAuthStatus: 'authorized' | 'failed' | 'unauthorized'
  enabledChannels: string[]
  riskCount: number
  updatedAt: string
}

export type GlobalSettingStoreCandidate = {
  poiId: string
  campId: string
  name: string
  city: string
  currentStatus: 'monitored' | 'available'
}

export type GlobalSettingChannelConfig = {
  enabled: boolean
  username: string
  password: string
  authStatus: 'authorized' | 'failed' | 'unauthorized'
  lastVerifiedAt: string
}

export type GlobalSettingStoreConfig = {
  storeId: string
  poiId: string
  storeName: string
  ctrip: GlobalSettingChannelConfig
  meituan: GlobalSettingChannelConfig
  connectorVersion: string
  lastSyncAt: string
  notes: string[]
}

export type GlobalSettingTodo = {
  id: string
  title: string
  storeName: string
  level: '高' | '中' | '低'
  action: 'open-config' | 'route' | 'acknowledge'
}

export type GlobalSettingQuickLink = {
  label: string
  path: string
}

export type GlobalSettingViewModel = {
  filters: GlobalSettingFilters
  filterOptions: {
    camps: { label: string; value: string }[]
    authorizationStatuses: { label: string; value: GlobalSettingAuthorizationStatus }[]
    connectorStatuses: { label: string; value: GlobalSettingConnectorStatus }[]
  }
  summary: GlobalSettingSummaryMetric[]
  stores: GlobalSettingStoreRow[]
  candidates: GlobalSettingStoreCandidate[]
  todos: GlobalSettingTodo[]
  quickLinks: GlobalSettingQuickLink[]
  connectorLimit: number
  updatedAt: string
  requestBody: Record<string, unknown>
  endpoint: string
  provider: GlobalSettingProviderName
  traceId: string
  timestamp: string
}

type Envelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type ApiResponse = Partial<Envelope<unknown>> & {
  success?: boolean
  errorMsg?: string | null
  errorCode?: string | null
}

type MockStoreSeed = {
  id: string
  poiId: string
  campId: string
  name: string
  city: string
  connectorStatus: GlobalSettingStoreRow['connectorStatus']
  monitorStatus: GlobalSettingStoreRow['monitorStatus']
  ctripAuthStatus: GlobalSettingStoreRow['ctripAuthStatus']
  meituanAuthStatus: GlobalSettingStoreRow['meituanAuthStatus']
  enabledChannels: string[]
  riskCount: number
  updatedAt: string
}

const connectorLimit = 3
const timestamp = '2026-05-19T16:30:00+08:00'

export const globalSettingOverviewEndpoint = '/radarConfig/shop/get'
export const globalSettingMockSourceLabel = 'mock:/radarConfig/shop/get'

export const defaultGlobalSettingFilters: GlobalSettingFilters = {
  campId: 'camp-up-valley',
  authorizationStatus: 'all',
  connectorStatus: 'all',
  keyword: '',
}

const campOptions = [
  { label: 'UP智谷店', value: 'camp-up-valley' },
  { label: '广州市海珠智选店', value: 'camp-haizhu' },
  { label: '广州市天河电竞公寓', value: 'camp-tianhe' },
]

const authorizationStatusOptions: GlobalSettingViewModel['filterOptions']['authorizationStatuses'] = [
  { label: '全部授权状态', value: 'all' },
  { label: '已授权', value: 'authorized' },
  { label: '授权异常', value: 'warning' },
  { label: '未授权', value: 'unauthorized' },
]

const connectorStatusOptions: GlobalSettingViewModel['filterOptions']['connectorStatuses'] = [
  { label: '全部连接器状态', value: 'all' },
  { label: '在线', value: 'online' },
  { label: '更新延迟', value: 'warning' },
  { label: '离线', value: 'offline' },
]

const allCandidates: GlobalSettingStoreCandidate[] = [
  { poiId: 'poi-up-valley', campId: 'camp-up-valley', name: 'UP智谷店', city: '广州', currentStatus: 'monitored' },
  { poiId: 'poi-haizhu', campId: 'camp-haizhu', name: '广州市海珠智选店', city: '广州', currentStatus: 'monitored' },
  { poiId: 'poi-tianhe', campId: 'camp-tianhe', name: '广州市天河电竞公寓', city: '广州', currentStatus: 'available' },
  { poiId: 'poi-jinan', campId: 'camp-jinan', name: '银丰颐美酒店（济南融创文旅城唐冶店）', city: '济南', currentStatus: 'available' },
]

const storeSeeds: Record<string, MockStoreSeed> = {
  'poi-up-valley': {
    id: 'store-up-valley',
    poiId: 'poi-up-valley',
    campId: 'camp-up-valley',
    name: 'UP智谷店',
    city: '广州',
    connectorStatus: 'online',
    monitorStatus: 'checking',
    ctripAuthStatus: 'authorized',
    meituanAuthStatus: 'authorized',
    enabledChannels: ['携程酒店', '美团酒店'],
    riskCount: 0,
    updatedAt: '2026-05-19 16:08',
  },
  'poi-haizhu': {
    id: 'store-haizhu',
    poiId: 'poi-haizhu',
    campId: 'camp-haizhu',
    name: '广州市海珠智选店',
    city: '广州',
    connectorStatus: 'warning',
    monitorStatus: 'delay',
    ctripAuthStatus: 'authorized',
    meituanAuthStatus: 'failed',
    enabledChannels: ['携程酒店', '美团酒店'],
    riskCount: 2,
    updatedAt: '2026-05-19 15:46',
  },
  'poi-tianhe': {
    id: 'store-tianhe',
    poiId: 'poi-tianhe',
    campId: 'camp-tianhe',
    name: '广州市天河电竞公寓',
    city: '广州',
    connectorStatus: 'offline',
    monitorStatus: 'paused',
    ctripAuthStatus: 'unauthorized',
    meituanAuthStatus: 'failed',
    enabledChannels: ['美团酒店'],
    riskCount: 3,
    updatedAt: '2026-05-19 14:20',
  },
  'poi-jinan': {
    id: 'store-jinan',
    poiId: 'poi-jinan',
    campId: 'camp-jinan',
    name: '银丰颐美酒店（济南融创文旅城唐冶店）',
    city: '济南',
    connectorStatus: 'online',
    monitorStatus: 'checking',
    ctripAuthStatus: 'authorized',
    meituanAuthStatus: 'unauthorized',
    enabledChannels: ['携程酒店'],
    riskCount: 1,
    updatedAt: '2026-05-19 15:12',
  },
}

const storeConfigs: Record<string, GlobalSettingStoreConfig> = {
  'store-up-valley': {
    storeId: 'store-up-valley',
    poiId: 'poi-up-valley',
    storeName: 'UP智谷店',
    ctrip: {
      enabled: true,
      username: 'ctrip-up',
      password: 'safe-pass-ctrip',
      authStatus: 'authorized',
      lastVerifiedAt: '2026-05-19 15:58',
    },
    meituan: {
      enabled: true,
      username: '',
      password: '',
      authStatus: 'failed',
      lastVerifiedAt: '2026-05-19 15:41',
    },
    connectorVersion: 'v1.8.3',
    lastSyncAt: '2026-05-19 16:08',
    notes: ['携程酒店账号状态正常', '美团酒店密码已过期，需要重新授权'],
  },
  'store-haizhu': {
    storeId: 'store-haizhu',
    poiId: 'poi-haizhu',
    storeName: '广州市海珠智选店',
    ctrip: {
      enabled: true,
      username: 'ctrip-haizhu',
      password: 'safe-pass-haizhu',
      authStatus: 'authorized',
      lastVerifiedAt: '2026-05-19 15:20',
    },
    meituan: {
      enabled: true,
      username: 'meituan-haizhu',
      password: '',
      authStatus: 'failed',
      lastVerifiedAt: '2026-05-19 15:18',
    },
    connectorVersion: 'v1.8.1',
    lastSyncAt: '2026-05-19 15:46',
    notes: ['美团酒店授权失败', '连接器 20 分钟未回传新数据'],
  },
  'store-tianhe': {
    storeId: 'store-tianhe',
    poiId: 'poi-tianhe',
    storeName: '广州市天河电竞公寓',
    ctrip: {
      enabled: false,
      username: '',
      password: '',
      authStatus: 'unauthorized',
      lastVerifiedAt: '未配置',
    },
    meituan: {
      enabled: true,
      username: '',
      password: '',
      authStatus: 'failed',
      lastVerifiedAt: '2026-05-19 14:02',
    },
    connectorVersion: 'v1.7.9',
    lastSyncAt: '2026-05-19 14:20',
    notes: ['当前门店未接入携程酒店', '美团酒店凭证为空，无法继续同步'],
  },
  'store-jinan': {
    storeId: 'store-jinan',
    poiId: 'poi-jinan',
    storeName: '银丰颐美酒店（济南融创文旅城唐冶店）',
    ctrip: {
      enabled: true,
      username: 'ctrip-jinan',
      password: 'safe-pass-jinan',
      authStatus: 'authorized',
      lastVerifiedAt: '2026-05-19 15:02',
    },
    meituan: {
      enabled: false,
      username: '',
      password: '',
      authStatus: 'unauthorized',
      lastVerifiedAt: '未配置',
    },
    connectorVersion: 'v1.8.0',
    lastSyncAt: '2026-05-19 15:12',
    notes: ['当前仅接入携程酒店授权'],
  },
}

const todos: GlobalSettingTodo[] = [
  { id: 'todo-up', title: '补齐美团酒店授权', storeName: 'UP智谷店', level: '高', action: 'open-config' },
  { id: 'todo-haizhu', title: '处理连接器延迟', storeName: '广州市海珠智选店', level: '中', action: 'acknowledge' },
  { id: 'todo-route', title: '补录新监控门店', storeName: '门店信息', level: '低', action: 'route' },
]

const quickLinks: GlobalSettingQuickLink[] = [
  { label: '全域数据', path: '/channels/globalRadar/globalData' },
  { label: '门店信息', path: '/InformationMaintenance/campInfo/edit' },
  { label: '房态', path: '/houseManage/months' },
  { label: '报表', path: '/statistics/report' },
]

export class GlobalSettingRequestError extends Error {
  constructor(message = '配置中心数据加载失败') {
    super(message)
    this.name = 'GlobalSettingRequestError'
  }
}

export async function fetchGlobalSettingOverview(
  filters: GlobalSettingFilters,
  signal?: AbortSignal,
): Promise<GlobalSettingViewModel> {
  const requestBody = createGlobalSettingRequestBody(filters)
  const provider = resolveProvider(filters.provider)

  if (provider === 'mock') {
    return fetchMockOverview(filters, requestBody)
  }

  const response = await fetch(globalSettingOverviewEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
    signal,
  })
  const payload = await readJson(response)
  if (!response.ok || isFailedResponse(payload)) {
    throw new GlobalSettingRequestError(extractErrorMessage(payload) ?? `配置中心数据加载失败（HTTP ${response.status}）`)
  }
  return adaptOverview(payload?.data, filters, requestBody, 'api', payload)
}

export async function fetchGlobalSettingStoreConfig(storeId: string): Promise<GlobalSettingStoreConfig> {
  if (resolveProvider() === 'api') {
    const payload = await postJson('/radarConfig/shop/config/get', { storeId })
    const data = readRecord(payload?.data)
    if (!data) throw new GlobalSettingRequestError('配置详情响应缺失')
    return adaptStoreConfig(data, storeId)
  }
  const config = storeConfigs[storeId]
  if (!config) throw new GlobalSettingRequestError('未找到门店配置')
  return cloneConfig(config)
}

export async function saveGlobalSettingStoreSelection(
  current: GlobalSettingViewModel,
  selectedPoiIds: string[],
): Promise<GlobalSettingViewModel> {
  if (resolveProvider() === 'api') {
    await postJson('/radarConfig/shop/save', {
      campId: current.filters.campId,
      poiIds: selectedPoiIds,
    })
  }

  return buildOverviewViewModel(
    buildStoresFromPoiIds(selectedPoiIds),
    normalizeCandidates(selectedPoiIds),
    current.filters,
    current.requestBody,
    current.provider,
    'mock-ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin-selection-001',
  )
}

export async function saveGlobalSettingStoreConfig(
  current: GlobalSettingViewModel,
  detail: GlobalSettingStoreConfig,
): Promise<{ viewModel: GlobalSettingViewModel; detail: GlobalSettingStoreConfig }> {
  const nextDetail = {
    ...detail,
    ctrip: normalizeChannelConfig(detail.ctrip),
    meituan: normalizeChannelConfig(detail.meituan),
    lastSyncAt: '2026-05-19 16:30',
  }

  if (resolveProvider() === 'api') {
    await postJson('/radarConfig/shop/config/save', createConfigRequestBody(nextDetail))
  }

  storeConfigs[nextDetail.storeId] = cloneConfig(nextDetail)
  storeSeeds[nextDetail.poiId] = {
    ...storeSeeds[nextDetail.poiId],
    ctripAuthStatus: nextDetail.ctrip.enabled
      ? nextDetail.ctrip.username && nextDetail.ctrip.password
        ? 'authorized'
        : 'failed'
      : 'unauthorized',
    meituanAuthStatus: nextDetail.meituan.enabled
      ? nextDetail.meituan.username && nextDetail.meituan.password
        ? 'authorized'
        : 'failed'
      : 'unauthorized',
    connectorStatus:
      nextDetail.ctrip.enabled || nextDetail.meituan.enabled
        ? nextDetail.ctrip.authStatus === 'failed' || nextDetail.meituan.authStatus === 'failed'
          ? 'warning'
          : 'online'
        : 'offline',
    monitorStatus:
      nextDetail.ctrip.authStatus === 'authorized' || nextDetail.meituan.authStatus === 'authorized' ? 'checking' : 'delay',
    enabledChannels: [nextDetail.ctrip.enabled ? '携程酒店' : '', nextDetail.meituan.enabled ? '美团酒店' : ''].filter(Boolean),
    riskCount: nextDetail.notes.length,
    updatedAt: nextDetail.lastSyncAt,
  }

  const nextViewModel = buildOverviewViewModel(
    current.stores.map((item) => storeSeeds[item.poiId]),
    current.candidates,
    current.filters,
    current.requestBody,
    current.provider,
    'mock-ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin-config-save-001',
  )

  return { viewModel: nextViewModel, detail: cloneConfig(nextDetail) }
}

export async function removeGlobalSettingStore(
  current: GlobalSettingViewModel,
  storeId: string,
): Promise<GlobalSettingViewModel> {
  if (resolveProvider() === 'api') {
    await postJson('/radarConfig/shop/delete', { storeId })
  }

  const nextStores = current.stores.filter((item) => item.id !== storeId).map((item) => storeSeeds[item.poiId])
  const selectedPoiIds = nextStores.map((item) => item.poiId)
  return buildOverviewViewModel(
    nextStores,
    normalizeCandidates(selectedPoiIds),
    current.filters,
    current.requestBody,
    current.provider,
    'mock-ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin-remove-001',
  )
}

export async function startGlobalSettingConnectorDownload() {
  if (resolveProvider() === 'api') {
    await postJson('/radarConfig/connector/download', {})
  }
  return {
    fileName: 'AI全域雷达数据连接器.rar',
    message: '数据连接器下载任务已启动',
  }
}

export async function createGlobalSettingExportTask(filters: GlobalSettingFilters) {
  if (resolveProvider() === 'api') {
    await postJson('/radarConfig/shop/export', createGlobalSettingRequestBody(filters))
  }
  return {
    taskId: 'export-global-setting-001',
    message: '导出任务已创建',
  }
}

export function createGlobalSettingRequestBody(filters: GlobalSettingFilters): Record<string, unknown> {
  return {
    campId: filters.campId === 'all' ? null : filters.campId,
    authorizationStatus: filters.authorizationStatus === 'all' ? null : filters.authorizationStatus,
    connectorStatus: filters.connectorStatus === 'all' ? null : filters.connectorStatus,
    keyword: filters.keyword.trim() || null,
    limit: connectorLimit,
  }
}

function fetchMockOverview(filters: GlobalSettingFilters, requestBody: Record<string, unknown>) {
  return waitForMockOverview(filters, requestBody)
}

async function waitForMockOverview(filters: GlobalSettingFilters, requestBody: Record<string, unknown>) {
  const mode = resolveMockMode()
  const latencyMs = resolveMockLatencyMs()
  if (latencyMs > 0) {
    await new Promise((resolve) => window.setTimeout(resolve, latencyMs))
  }
  if (mode === 'error') {
    throw new GlobalSettingRequestError('配置中心数据加载失败')
  }

  const selectedPoiIds = mode === 'empty' ? [] : ['poi-up-valley', 'poi-haizhu']
  const stores = buildStoresFromPoiIds(selectedPoiIds)
  return buildOverviewViewModel(
    stores,
    normalizeCandidates(selectedPoiIds),
    filters,
    requestBody,
    'mock',
    'mock-ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin-overview-001',
  )
}

function adaptOverview(
  data: unknown,
  filters: GlobalSettingFilters,
  requestBody: Record<string, unknown>,
  provider: GlobalSettingProviderName,
  envelope?: ApiResponse | null,
) {
  const record = readRecord(data)
  const stores = readArray(record?.stores).map(adaptStoreRow).filter((item): item is GlobalSettingStoreRow => Boolean(item))
  const candidates = readArray(record?.candidates)
    .map(adaptCandidate)
    .filter((item): item is GlobalSettingStoreCandidate => Boolean(item))
  return buildOverviewViewModel(
    stores.length > 0 ? stores.map((item) => storeSeeds[item.poiId] ?? item) : [],
    candidates.length > 0 ? candidates : normalizeCandidates(stores.map((item) => item.poiId)),
    filters,
    requestBody,
    provider,
    envelope?.traceId ?? `${provider}-ai-quanyu-leida--shuju-yu-peizhi--peizhi-zhongxin-overview`,
    envelope?.timestamp ?? timestamp,
  )
}

function buildOverviewViewModel(
  sourceStores: Array<MockStoreSeed | GlobalSettingStoreRow>,
  candidates: GlobalSettingStoreCandidate[],
  filters: GlobalSettingFilters,
  requestBody: Record<string, unknown>,
  provider: GlobalSettingProviderName,
  traceId: string,
  responseTimestamp = timestamp,
): GlobalSettingViewModel {
  const rows = sourceStores.map((item) => ('poiId' in item && 'city' in item ? adaptSeedRow(item) : item))
  const filteredStores = rows.filter((item) => matchesFilters(item, filters))

  const authorizedCount = filteredStores.filter((item) => isAuthorizedStore(item)).length
  const warningCount = filteredStores.filter((item) => item.connectorStatus === 'warning' || hasFailedAuthorization(item)).length
  const unauthorizedCount = filteredStores.filter((item) => !isAuthorizedStore(item)).length

  return {
    filters,
    filterOptions: {
      camps: campOptions,
      authorizationStatuses: authorizationStatusOptions,
      connectorStatuses: connectorStatusOptions,
    },
    summary: [
      { label: '已启用门店', value: `${rows.length} / ${connectorLimit}`, hint: '当前账号监控上限', tone: 'blue' },
      { label: '已授权门店', value: String(authorizedCount), hint: '携程 / 美团授权完整', tone: 'green' },
      { label: '异常门店', value: String(warningCount), hint: '连接器延迟或授权失败', tone: 'orange' },
      { label: '待处理项', value: String(unauthorizedCount), hint: '需要继续配置或补齐凭证', tone: 'red' },
    ],
    stores: filteredStores,
    candidates,
    todos: todos.filter((item) => filteredStores.some((row) => item.storeName === row.name) || item.action === 'route'),
    quickLinks,
    connectorLimit,
    updatedAt: filteredStores[0]?.updatedAt ?? '2026-05-19 16:08',
    requestBody,
    endpoint: provider === 'mock' ? globalSettingMockSourceLabel : globalSettingOverviewEndpoint,
    provider,
    traceId,
    timestamp: responseTimestamp,
  }
}

function matchesFilters(row: GlobalSettingStoreRow, filters: GlobalSettingFilters) {
  const keyword = filters.keyword.trim()
  if (filters.connectorStatus !== 'all' && row.connectorStatus !== filters.connectorStatus) return false
  if (filters.authorizationStatus !== 'all') {
    if (filters.authorizationStatus === 'authorized' && !isAuthorizedStore(row)) return false
    if (filters.authorizationStatus === 'warning' && !hasFailedAuthorization(row)) return false
    if (filters.authorizationStatus === 'unauthorized' && isAuthorizedStore(row)) return false
  }
  if (keyword && !`${row.name}${row.city}${row.enabledChannels.join('')}`.includes(keyword)) return false
  return true
}

function isAuthorizedStore(row: GlobalSettingStoreRow) {
  return row.ctripAuthStatus === 'authorized' && row.meituanAuthStatus === 'authorized'
}

function hasFailedAuthorization(row: GlobalSettingStoreRow) {
  return row.ctripAuthStatus === 'failed' || row.meituanAuthStatus === 'failed'
}

function buildStoresFromPoiIds(selectedPoiIds: string[]) {
  return selectedPoiIds.map((poiId) => storeSeeds[poiId]).filter((item): item is MockStoreSeed => Boolean(item))
}

function normalizeCandidates(selectedPoiIds: string[]): GlobalSettingStoreCandidate[] {
  return allCandidates.map((item) => ({
    ...item,
    currentStatus: selectedPoiIds.includes(item.poiId) ? 'monitored' : 'available',
  }))
}

function normalizeChannelConfig(channel: GlobalSettingChannelConfig): GlobalSettingChannelConfig {
  const enabled = channel.enabled
  const username = channel.username.trim()
  const password = channel.password.trim()
  return {
    enabled,
    username,
    password,
    authStatus: !enabled ? 'unauthorized' : username && password ? 'authorized' : 'failed',
    lastVerifiedAt: !enabled ? '未启用' : username && password ? '2026-05-19 16:30' : '待重新校验',
  }
}

function createConfigRequestBody(detail: GlobalSettingStoreConfig) {
  return {
    storeId: detail.storeId,
    poiId: detail.poiId,
    ctrip: detail.ctrip,
    meituan: detail.meituan,
  }
}

function adaptSeedRow(seed: MockStoreSeed | GlobalSettingStoreRow): GlobalSettingStoreRow {
  if ('riskCount' in seed && 'enabledChannels' in seed) {
    return {
      id: seed.id,
      poiId: seed.poiId,
      campId: seed.campId,
      name: seed.name,
      city: seed.city,
      connectorStatus: seed.connectorStatus,
      monitorStatus: seed.monitorStatus,
      ctripAuthStatus: seed.ctripAuthStatus,
      meituanAuthStatus: seed.meituanAuthStatus,
      enabledChannels: [...seed.enabledChannels],
      riskCount: seed.riskCount,
      updatedAt: seed.updatedAt,
    }
  }
  return seed
}

function adaptStoreRow(value: unknown): GlobalSettingStoreRow | null {
  const record = readRecord(value)
  const id = readString(record?.id)
  const poiId = readString(record?.poiId)
  const name = readString(record?.name)
  if (!record || !id || !poiId || !name) return null
  return {
    id,
    poiId,
    campId: readString(record.campId) ?? 'camp-up-valley',
    name,
    city: readString(record.city) ?? '广州',
    connectorStatus: readConnectorStatus(record.connectorStatus),
    monitorStatus: readMonitorStatus(record.monitorStatus),
    ctripAuthStatus: readAuthStatus(record.ctripAuthStatus),
    meituanAuthStatus: readAuthStatus(record.meituanAuthStatus),
    enabledChannels: readStringArray(record.enabledChannels) ?? [],
    riskCount: readNumber(record.riskCount) ?? 0,
    updatedAt: readString(record.updatedAt) ?? '2026-05-19 16:08',
  }
}

function adaptCandidate(value: unknown): GlobalSettingStoreCandidate | null {
  const record = readRecord(value)
  const poiId = readString(record?.poiId)
  const name = readString(record?.name)
  if (!record || !poiId || !name) return null
  return {
    poiId,
    campId: readString(record.campId) ?? 'camp-up-valley',
    name,
    city: readString(record.city) ?? '广州',
    currentStatus: record.currentStatus === 'monitored' ? 'monitored' : 'available',
  }
}

function adaptStoreConfig(value: Record<string, unknown>, storeId: string): GlobalSettingStoreConfig {
  return {
    storeId,
    poiId: readString(value.poiId) ?? `poi-${storeId}`,
    storeName: readString(value.storeName) ?? '监控门店',
    ctrip: adaptChannelConfig(readRecord(value.ctrip)),
    meituan: adaptChannelConfig(readRecord(value.meituan)),
    connectorVersion: readString(value.connectorVersion) ?? 'v1.8.0',
    lastSyncAt: readString(value.lastSyncAt) ?? '2026-05-19 16:08',
    notes: readStringArray(value.notes) ?? [],
  }
}

function adaptChannelConfig(value: Record<string, unknown> | null): GlobalSettingChannelConfig {
  return {
    enabled: Boolean(value?.enabled),
    username: readString(value?.username) ?? '',
    password: readString(value?.password) ?? '',
    authStatus: readAuthStatus(value?.authStatus),
    lastVerifiedAt: readString(value?.lastVerifiedAt) ?? '未配置',
  }
}

function cloneConfig(config: GlobalSettingStoreConfig): GlobalSettingStoreConfig {
  return {
    ...config,
    ctrip: { ...config.ctrip },
    meituan: { ...config.meituan },
    notes: [...config.notes],
  }
}

async function postJson(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })
  const payload = await readJson(response)
  if (!response.ok || isFailedResponse(payload)) {
    throw new GlobalSettingRequestError(extractErrorMessage(payload) ?? `请求失败（HTTP ${response.status}）`)
  }
  return payload
}

async function readJson(response: Response): Promise<ApiResponse | null> {
  try {
    return (await response.json()) as ApiResponse
  } catch {
    return null
  }
}

function isFailedResponse(payload: ApiResponse | null) {
  if (!payload) return false
  if (payload.code !== undefined) return payload.code !== 0
  return payload.success === false
}

function extractErrorMessage(payload: ApiResponse | null) {
  if (!payload) return null
  return payload.message ?? payload.errorMsg ?? payload.errorCode ?? null
}

function resolveProvider(explicitProvider?: GlobalSettingProviderName): GlobalSettingProviderName {
  const configured =
    explicitProvider ||
    readRuntimeConfig('pms.globalSettingProvider') ||
    (import.meta.env.VITE_PMS_GLOBAL_SETTING_PROVIDER as string | undefined)
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function resolveMockMode(): GlobalSettingMockMode {
  const configured =
    readRuntimeConfig('pms.globalSettingMockMode') ||
    (import.meta.env.VITE_PMS_GLOBAL_SETTING_MOCK_MODE as string | undefined)
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function resolveMockLatencyMs() {
  const configured = readRuntimeConfig('pms.globalSettingMockLatencyMs') || ''
  const value = Number(configured)
  return Number.isFinite(value) && value > 0 ? value : 0
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function readRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown) {
  if (value === undefined || value === null || value === '') return null
  return String(value)
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return null
  return value.map((item) => String(item))
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function readConnectorStatus(value: unknown): GlobalSettingStoreRow['connectorStatus'] {
  return value === 'warning' || value === 'offline' ? value : 'online'
}

function readMonitorStatus(value: unknown): GlobalSettingStoreRow['monitorStatus'] {
  return value === 'delay' || value === 'paused' ? value : 'checking'
}

function readAuthStatus(value: unknown): GlobalSettingChannelConfig['authStatus'] {
  return value === 'authorized' || value === 'failed' ? value : 'unauthorized'
}
