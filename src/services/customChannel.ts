import { apiPost } from '../api/client'

const TASK_ID = 'shezhi--tongyong-shezhi--zidingyi-qudao'
const MOCK_TIMESTAMP = '2026-05-20T00:30:00+08:00'
const MOCK_LATENCY_MS = 160

const CUSTOM_CHANNEL_PROVIDER_KEY = 'pms.customChannel.provider'
const CUSTOM_CHANNEL_LAST_REQUEST_KEY = 'pms.customChannel.lastRequest'

export const CUSTOM_CHANNEL_LIST_PATH = '/channels/custom/list'
export const CUSTOM_CHANNEL_UPDATE_PATH = '/channels/custom/update'
export const CUSTOM_CHANNEL_CREATE_PATH = '/channels/custom/create'
export const CUSTOM_CHANNEL_DELETE_PATH = '/channels/custom/delete'

export type CustomChannelProviderName = 'mock' | 'api'
export type CustomChannelMockState = 'success' | 'empty' | 'error'

export type CustomChannelQuery = {
  provider: CustomChannelProviderName
  mockState: CustomChannelMockState
}

export type SystemChannel = {
  id: string
  name: string
  color: string
  enabled: boolean
}

export type CustomChannelRecord = {
  id: string
  name: string
  code: string
  color: string
  colorName: string
  enabled: boolean
  updatedAt: string
  operator: string
  note: string
}

export type CustomChannelDashboard = {
  provider: CustomChannelProviderName
  state: CustomChannelMockState
  traceId: string
  timestamp: string
  systemChannels: SystemChannel[]
  customChannels: CustomChannelRecord[]
  audit: string[]
}

export type ChannelCatalogItem = {
  id: string
  name: string
  shortName: string
  color: string
  enabled: boolean
  source: 'local' | 'system' | 'custom'
}

export type CustomChannelDialogInput = {
  name: string
  color: string
  colorName: string
}

type DashboardPayload = {
  systemChannels: SystemChannel[]
  customChannels: CustomChannelRecord[]
}

type CustomChannelApiPayload = DashboardPayload

type SystemChannelStatePayload = {
  id: string
  enabled: boolean
}

const colorOptions = [
  { value: '#f59e0b', label: '琥珀橙' },
  { value: '#2563eb', label: '晴空蓝' },
  { value: '#7c3aed', label: '紫罗兰' },
  { value: '#14b8a6', label: '松石绿' },
  { value: '#ef4444', label: '珊瑚红' },
]

const systemChannelSeeds = [
  '自来客', '路客云聚合', '携程', '美团', '飞猪', '去哪儿', '同程旅行', '马蜂窝', '途家民宿', '小猪民宿',
  '爱彼迎', '榛果民宿', '木鸟民宿', '一家民宿', '住多多', 'Airbnb', '微信', '电话', '官网', '58同城', '抖音', '小红书',
  '快手', '视频号', '微信小程序', '支付宝小程序', '公众号', '企业协议', '会员', '门店散客', '长租客户', '团购', '美团酒店', 'Agoda',
  'Booking', 'Expedia', 'Homeaway', 'Vrbo', '去哪儿民宿', '携程民宿', '飞猪民宿', '同程艺龙', '抖音团购', '快手团购', '微信商城',
  '本地生活联盟', '渠道分销', '旅行社', '公司协议', '客服代订', 'PMS同步RW', '路客优选', '渠道同步', '云渠道YZ',
  '云渠道ZD', '云渠道PY', '云渠道CQ', '社群', '私域分销', '民宿管家', '渠道MO', '渠道PC', '小程序', '美宿联盟',
  '渠道YK', '散客', '线下订单', 'Hotelbeds', 'MG', '渠道KT', '渠道LM',
]

const systemChannelColors = [
  '#20527f', '#6f89d1', '#263f86', '#ffc20c', '#08a6c8', '#ff6827', '#ff6a21', '#ff5561', '#edc36b', '#f0c46a',
  '#edc36b', '#fb3d70', '#ff792b', '#6ed331', '#801d72', '#ff1e3b', '#f52325', '#cf3737', '#0868e5', '#24c2df',
  '#ff7900', '#3268e4', '#20a719', '#f00000', '#e6291f', '#ff2814', '#ff0635', '#ff6841', '#40516a', '#13aee0',
  '#fc1d4e', '#5057df', '#ffe000', '#801d72', '#d9d9d9', '#d9461c', '#0076b6', '#095fe0', '#d9d9d9', '#bfc8d8',
  '#108df0', '#211c1d', '#314f88', '#ff9018', '#d79c2c', '#e25747', '#09bd72', '#1cc8df', '#0cbc72', '#07c676',
  '#14b7c1', '#0db5bf', '#08bd69', '#20527f', '#20527f', '#20527f', '#20527f', '#20527f', '#22539a', '#18cbed',
  '#1dc7ef', '#d9d9d9', '#1f5284', '#08ba65', '#0fb8de', '#20527f', '#20527f', '#20527f', '#20527f', '#20509a', '#20509a',
]

const seedCustomChannels: CustomChannelRecord[] = [
  {
    id: 'custom-001',
    name: '深圳散客联盟',
    code: 'CUSTOM-001',
    color: '#2563eb',
    colorName: '晴空蓝',
    enabled: true,
    updatedAt: '2026-05-19 18:20:00',
    operator: '系统 TS5',
    note: '用于线下散客与本地活动合作渠道。',
  },
  {
    id: 'custom-002',
    name: '跨境长住合作',
    code: 'CUSTOM-002',
    color: '#14b8a6',
    colorName: '松石绿',
    enabled: true,
    updatedAt: '2026-05-19 19:05:00',
    operator: '系统 TS5',
    note: '用于跨境长住与企业客户合作渠道。',
  },
]

let mockSystemChannels = createSystemChannels()
let mockCustomChannels = seedCustomChannels.map((channel) => ({ ...channel }))

const localPlatformChannel: ChannelCatalogItem = {
  id: '100',
  name: '宿银平台',
  shortName: '宿',
  color: '#4d65f6',
  enabled: true,
  source: 'local',
}

export function createDefaultCustomChannelQuery(searchParams = new URLSearchParams()): CustomChannelQuery {
  return {
    provider: toProvider(searchParams.get('provider')) ?? getCustomChannelProviderName(),
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export function getColorOptions() {
  return colorOptions
}

export async function fetchCustomChannelDashboard(query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({ action: 'load', provider: query.provider, mockState: query.mockState, listPath: CUSTOM_CHANNEL_LIST_PATH })

  if (query.provider === 'api') {
    const data = await apiPost<CustomChannelApiPayload>(CUSTOM_CHANNEL_LIST_PATH, {})
    return adaptApiDashboard(data, query, 'list')
  }

  return adaptMockDashboard(await fetchMockDashboard(query), query, 'success-001')
}

export async function fetchEnabledChannelCatalog(query?: Partial<CustomChannelQuery>): Promise<ChannelCatalogItem[]> {
  const dashboard = await fetchCustomChannelDashboard({
    provider: query?.provider ?? getCustomChannelProviderName(),
    mockState: query?.mockState ?? 'success',
  })

  const systemChannels = dashboard.systemChannels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    shortName: createShortName(channel.name),
    color: channel.color,
    enabled: channel.enabled,
    source: 'system' as const,
  }))
  const customChannels = dashboard.customChannels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    shortName: createShortName(channel.name),
    color: channel.color,
    enabled: channel.enabled,
    source: 'custom' as const,
  }))

  return dedupeChannelCatalog([localPlatformChannel, ...systemChannels, ...customChannels]).filter((channel) => channel.enabled)
}

export async function saveSystemChannels(enabledMap: Record<string, boolean>, query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({ action: 'save-system', provider: query.provider, updatePath: CUSTOM_CHANNEL_UPDATE_PATH, enabledMap })

  if (query.provider === 'api') {
    const systemChannels: SystemChannelStatePayload[] = Object.entries(enabledMap).map(([id, enabled]) => ({ id, enabled }))
    const data = await apiPost<CustomChannelApiPayload>(CUSTOM_CHANNEL_UPDATE_PATH, { systemChannels })
    return adaptApiDashboard(data, query, 'save-system')
  }

  await wait(MOCK_LATENCY_MS)
  mockSystemChannels = mockSystemChannels.map((channel) => ({ ...channel, enabled: enabledMap[channel.id] ?? channel.enabled }))
  return adaptMockDashboard({ systemChannels: mockSystemChannels, customChannels: mockCustomChannels }, query, 'save-system-001')
}

export async function createCustomChannel(input: CustomChannelDialogInput, query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({ action: 'create', provider: query.provider, createPath: CUSTOM_CHANNEL_CREATE_PATH, payload: input })
  validateDialogInput(input)

  if (query.provider === 'api') {
    const data = await apiPost<CustomChannelApiPayload>(CUSTOM_CHANNEL_CREATE_PATH, input)
    return adaptApiDashboard(data, query, 'create')
  }

  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = [...mockCustomChannels, {
    id: `custom-${String(mockCustomChannels.length + 1).padStart(3, '0')}`,
    name: input.name.trim(),
    code: `CUSTOM-${String(mockCustomChannels.length + 1).padStart(3, '0')}`,
    color: input.color,
    colorName: input.colorName,
    enabled: true,
    updatedAt: '2026-05-20 00:30:00',
    operator: '系统 TS5',
    note: '通过前端新增的自定义渠道。',
  }]
  return adaptMockDashboard({ systemChannels: mockSystemChannels, customChannels: mockCustomChannels }, query, 'create-001')
}

export async function updateCustomChannel(channelId: string, input: CustomChannelDialogInput, query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({ action: 'update', provider: query.provider, updatePath: CUSTOM_CHANNEL_UPDATE_PATH, channelId, payload: input })
  validateDialogInput(input)

  if (query.provider === 'api') {
    const data = await apiPost<CustomChannelApiPayload>(CUSTOM_CHANNEL_UPDATE_PATH, { channelId, ...input })
    return adaptApiDashboard(data, query, 'update')
  }

  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = mockCustomChannels.map((channel) =>
    channel.id === channelId ? { ...channel, name: input.name.trim(), color: input.color, colorName: input.colorName, updatedAt: '2026-05-20 00:30:00' } : channel,
  )
  return adaptMockDashboard({ systemChannels: mockSystemChannels, customChannels: mockCustomChannels }, query, 'update-001')
}

export async function toggleCustomChannelStatus(channelId: string, nextEnabled: boolean, query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({ action: 'toggle', provider: query.provider, updatePath: CUSTOM_CHANNEL_UPDATE_PATH, channelId, nextEnabled })

  if (query.provider === 'api') {
    const data = await apiPost<CustomChannelApiPayload>(CUSTOM_CHANNEL_UPDATE_PATH, { channelId, enabled: nextEnabled ? 1 : 0 })
    return adaptApiDashboard(data, query, 'toggle')
  }

  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = mockCustomChannels.map((channel) =>
    channel.id === channelId ? { ...channel, enabled: nextEnabled, updatedAt: '2026-05-20 00:30:00' } : channel,
  )
  return adaptMockDashboard({ systemChannels: mockSystemChannels, customChannels: mockCustomChannels }, query, 'toggle-001')
}

export async function deleteCustomChannel(channelId: string, query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({ action: 'delete', provider: query.provider, deletePath: CUSTOM_CHANNEL_DELETE_PATH, channelId })

  if (query.provider === 'api') {
    const data = await apiPost<CustomChannelApiPayload>(CUSTOM_CHANNEL_DELETE_PATH, { channelId })
    return adaptApiDashboard(data, query, 'delete')
  }

  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = mockCustomChannels.filter((channel) => channel.id !== channelId)
  return adaptMockDashboard({ systemChannels: mockSystemChannels, customChannels: mockCustomChannels }, query, 'delete-001')
}

function adaptApiDashboard(payload: DashboardPayload, query: CustomChannelQuery, action: string): CustomChannelDashboard {
  return {
    provider: query.provider,
    state: query.mockState,
    traceId: `api-${TASK_ID}-${action}`,
    timestamp: new Date().toISOString(),
    systemChannels: payload.systemChannels,
    customChannels: payload.customChannels,
    audit: [
      `provider=${query.provider}`,
      `listPath=${CUSTOM_CHANNEL_LIST_PATH}`,
      `updatePath=${CUSTOM_CHANNEL_UPDATE_PATH}`,
      `createPath=${CUSTOM_CHANNEL_CREATE_PATH}`,
      `deletePath=${CUSTOM_CHANNEL_DELETE_PATH}`,
      `systemCount=${payload.systemChannels.length}`,
      `customCount=${payload.customChannels.length}`,
    ],
  }
}

function adaptMockDashboard(payload: DashboardPayload, query: CustomChannelQuery, traceSuffix: string): CustomChannelDashboard {
  return {
    provider: query.provider,
    state: query.mockState,
    traceId: `mock-${TASK_ID}-${traceSuffix}`,
    timestamp: MOCK_TIMESTAMP,
    systemChannels: payload.systemChannels,
    customChannels: payload.customChannels,
    audit: [
      `provider=${query.provider}`,
      `listPath=${CUSTOM_CHANNEL_LIST_PATH}`,
      `updatePath=${CUSTOM_CHANNEL_UPDATE_PATH}`,
      `createPath=${CUSTOM_CHANNEL_CREATE_PATH}`,
      `deletePath=${CUSTOM_CHANNEL_DELETE_PATH}`,
      `systemCount=${payload.systemChannels.length}`,
      `customCount=${payload.customChannels.length}`,
    ],
  }
}

async function fetchMockDashboard(query: CustomChannelQuery): Promise<DashboardPayload> {
  await wait(MOCK_LATENCY_MS)
  if (query.mockState === 'error') throw new Error('自定义渠道加载失败，请稍后重试')
  if (query.mockState === 'empty') return { systemChannels: mockSystemChannels, customChannels: [] }
  return { systemChannels: mockSystemChannels, customChannels: mockCustomChannels }
}

function createSystemChannels(): SystemChannel[] {
  return systemChannelSeeds.map((name, index) => ({
    id: `system-${String(index + 1).padStart(3, '0')}`,
    name,
    color: systemChannelColors[index],
    enabled: true,
  }))
}

function dedupeChannelCatalog(channels: ChannelCatalogItem[]) {
  const seen = new Set<string>()
  return channels.filter((channel) => {
    const key = normalizeChannelName(channel.name)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function normalizeChannelName(value: string) {
  return value.trim().toLowerCase()
}

function createShortName(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return '渠'
  const chineseChars = Array.from(trimmed).filter((char) => /[\u4e00-\u9fff]/.test(char))
  if (chineseChars.length > 0) return chineseChars.slice(0, 2).join('')
  return trimmed.slice(0, 2).toUpperCase()
}

function toMockState(value: string | null): CustomChannelMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

function toProvider(value: string | null): CustomChannelProviderName | null {
  return value === 'api' || value === 'mock' ? value : null
}

function getCustomChannelProviderName(): CustomChannelProviderName {
  if (typeof window === 'undefined') return 'api'
  const fromEnv = import.meta.env.VITE_CUSTOM_CHANNEL_PROVIDER as CustomChannelProviderName | undefined
  if (fromEnv === 'api' || fromEnv === 'mock') return fromEnv
  const stored = window.localStorage.getItem(CUSTOM_CHANNEL_PROVIDER_KEY)
  if (stored === 'api' || stored === 'mock') return stored
  return 'api'
}

function validateDialogInput(input: CustomChannelDialogInput) {
  if (!input.name.trim()) throw new Error('请输入渠道名称')
  if (!input.color.trim()) throw new Error('请选择渠道颜色')
}

function writeDiagnostics(value: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CUSTOM_CHANNEL_LAST_REQUEST_KEY, JSON.stringify({ ...value, timestamp: MOCK_TIMESTAMP }))
}

function wait(milliseconds: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds))
}

