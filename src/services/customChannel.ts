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

export type CustomChannelDialogInput = {
  name: string
  color: string
  colorName: string
}

type Envelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type DashboardPayload = {
  systemChannels: SystemChannel[]
  customChannels: CustomChannelRecord[]
}

const colorOptions = [
  { value: '#f59e0b', label: '琥珀橙' },
  { value: '#2563eb', label: '晴空蓝' },
  { value: '#7c3aed', label: '夜幕紫' },
  { value: '#14b8a6', label: '松石绿' },
  { value: '#ef4444', label: '珊瑚红' },
]

const systemChannelSeeds = [
  '自来客',
  '路客云聚合',
  '美团民宿',
  '美团酒店',
  '途家',
  '途家直连',
  '爱彼迎',
  '飞猪淘酒店',
  '飞猪民宿直连',
  '飞猪酒店直连',
  '小猪',
  '木鸟',
  '品牌小程序',
  '抖音小程序',
  '小红书',
  '百度',
  '微店',
  '携程',
  '携程国际',
  '58同城',
  '贝壳',
  '安居客',
  '艺龙',
  '京东直连',
  '房多多',
  '住多多',
  '云客赞',
  '千里马',
  '联联',
  '享库',
  '千千惠',
  '侠侣',
  '抖音',
  'Agoda',
  'Booking',
  'Expidia',
  'Homeaway',
  'Verbo',
  '其他',
  '高德酒店直连',
  '秋果',
  '轻住',
  '旅划算',
  '昇途',
  '尚美',
  '同程酒店直连',
  '抖音来客',
  '同程民宿直连',
  '路客云',
  '凤悦',
  '自助机RW',
  '同程民宿',
  '去哪儿酒店直连',
  '自助机YZ',
  '自助机ZD',
  '自助机PY',
  '自助机CQ',
  '锦江',
  '抖音来客直连',
  '自助机微住',
  '华住MO',
  '自助机PC',
  '视频号',
  '美酒分销',
  '自助机YK',
  '自营',
  '深圳捷旅',
  'Hotelbeds',
  'MG',
  '自助机KT',
  '自助机LM',
]

const systemChannelColors = [
  '#6f89d1',
  '#263f86',
  '#ffc20c',
  '#08a6c8',
  '#ff6827',
  '#ff6a21',
  '#ff5561',
  '#edc36b',
  '#f0c46a',
  '#edc36b',
  '#fb3d70',
  '#ff792b',
  '#6ed331',
  '#801d72',
  '#ff1e3b',
  '#f52325',
  '#cf3737',
  '#0868e5',
  '#24c2df',
  '#ff7900',
  '#3268e4',
  '#20a719',
  '#f00000',
  '#e6291f',
  '#ff2814',
  '#ff0635',
  '#ff6841',
  '#40516a',
  '#13aee0',
  '#fc1d4e',
  '#5057df',
  '#ffe000',
  '#801d72',
  '#d9d9d9',
  '#d9461c',
  '#0076b6',
  '#095fe0',
  '#d9d9d9',
  '#bfc8d8',
  '#108df0',
  '#211c1d',
  '#314f88',
  '#ff9018',
  '#d79c2c',
  '#e25747',
  '#09bd72',
  '#1cc8df',
  '#0cbc72',
  '#07c676',
  '#14b7c1',
  '#0db5bf',
  '#08bd69',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20527f',
  '#22539a',
  '#18cbed',
  '#1dc7ef',
  '#d9d9d9',
  '#1f5284',
  '#08ba65',
  '#0fb8de',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20527f',
  '#20509a',
  '#20509a',
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
    operator: '路客云6TS5',
    note: '用于线下散客转单与熟客介绍，已同步前台筛选项。',
  },
  {
    id: 'custom-002',
    name: '跨境长住合作',
    code: 'CUSTOM-002',
    color: '#14b8a6',
    colorName: '松石绿',
    enabled: true,
    updatedAt: '2026-05-19 19:05:00',
    operator: '路客云6TS5',
    note: '承接长住包月合作客户，房态统计单独归类。',
  },
]

let mockSystemChannels = createSystemChannels()
let mockCustomChannels = seedCustomChannels.map((channel) => ({ ...channel }))

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
  writeDiagnostics({
    action: 'load',
    provider: query.provider,
    mockState: query.mockState,
    listPath: CUSTOM_CHANNEL_LIST_PATH,
  })

  if (query.provider === 'api') {
    throw new Error('自定义渠道服务暂不可用，请稍后重试')
  }

  const envelope = await fetchMockDashboard(query)
  return adaptDashboard(envelope, query)
}

export async function saveSystemChannels(
  enabledMap: Record<string, boolean>,
  query: CustomChannelQuery,
): Promise<CustomChannelDashboard> {
  writeDiagnostics({
    action: 'save-system',
    provider: query.provider,
    updatePath: CUSTOM_CHANNEL_UPDATE_PATH,
    enabledMap,
  })

  if (query.provider === 'api') {
    throw new Error('系统渠道保存失败，请稍后重试')
  }

  await wait(MOCK_LATENCY_MS)
  mockSystemChannels = mockSystemChannels.map((channel) => ({
    ...channel,
    enabled: enabledMap[channel.id] ?? channel.enabled,
  }))

  return adaptDashboard(
    createSuccessEnvelope('save-system-001', {
      systemChannels: mockSystemChannels,
      customChannels: mockCustomChannels,
    }),
    { ...query, mockState: 'success' },
  )
}

export async function createCustomChannel(input: CustomChannelDialogInput, query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({
    action: 'create',
    provider: query.provider,
    createPath: CUSTOM_CHANNEL_CREATE_PATH,
    payload: input,
  })

  if (query.provider === 'api') {
    throw new Error('新增自定义渠道失败，请稍后重试')
  }

  validateDialogInput(input)
  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = [
    ...mockCustomChannels,
    {
      id: `custom-${String(mockCustomChannels.length + 1).padStart(3, '0')}`,
      name: input.name.trim(),
      code: `CUSTOM-${String(mockCustomChannels.length + 1).padStart(3, '0')}`,
      color: input.color,
      colorName: input.colorName,
      enabled: true,
      updatedAt: '2026-05-20 00:30:00',
      operator: '路客云6TS5',
      note: '已加入自定义渠道筛选与统计口径。',
    },
  ]

  return adaptDashboard(
    createSuccessEnvelope('create-001', {
      systemChannels: mockSystemChannels,
      customChannels: mockCustomChannels,
    }),
    { ...query, mockState: 'success' },
  )
}

export async function updateCustomChannel(
  channelId: string,
  input: CustomChannelDialogInput,
  query: CustomChannelQuery,
): Promise<CustomChannelDashboard> {
  writeDiagnostics({
    action: 'update',
    provider: query.provider,
    updatePath: CUSTOM_CHANNEL_UPDATE_PATH,
    channelId,
    payload: input,
  })

  if (query.provider === 'api') {
    throw new Error('更新自定义渠道失败，请稍后重试')
  }

  validateDialogInput(input)
  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = mockCustomChannels.map((channel) =>
    channel.id === channelId
      ? {
          ...channel,
          name: input.name.trim(),
          color: input.color,
          colorName: input.colorName,
          updatedAt: '2026-05-20 00:30:00',
        }
      : channel,
  )

  return adaptDashboard(
    createSuccessEnvelope('update-001', {
      systemChannels: mockSystemChannels,
      customChannels: mockCustomChannels,
    }),
    { ...query, mockState: 'success' },
  )
}

export async function toggleCustomChannelStatus(
  channelId: string,
  nextEnabled: boolean,
  query: CustomChannelQuery,
): Promise<CustomChannelDashboard> {
  writeDiagnostics({
    action: 'toggle',
    provider: query.provider,
    updatePath: CUSTOM_CHANNEL_UPDATE_PATH,
    channelId,
    nextEnabled,
  })

  if (query.provider === 'api') {
    throw new Error('更新自定义渠道状态失败，请稍后重试')
  }

  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = mockCustomChannels.map((channel) =>
    channel.id === channelId
      ? {
          ...channel,
          enabled: nextEnabled,
          updatedAt: '2026-05-20 00:30:00',
        }
      : channel,
  )

  return adaptDashboard(
    createSuccessEnvelope('toggle-001', {
      systemChannels: mockSystemChannels,
      customChannels: mockCustomChannels,
    }),
    { ...query, mockState: 'success' },
  )
}

export async function deleteCustomChannel(channelId: string, query: CustomChannelQuery): Promise<CustomChannelDashboard> {
  writeDiagnostics({
    action: 'delete',
    provider: query.provider,
    deletePath: CUSTOM_CHANNEL_DELETE_PATH,
    channelId,
  })

  if (query.provider === 'api') {
    throw new Error('删除自定义渠道失败，请稍后重试')
  }

  await wait(MOCK_LATENCY_MS)
  mockCustomChannels = mockCustomChannels.filter((channel) => channel.id !== channelId)

  return adaptDashboard(
    createSuccessEnvelope('delete-001', {
      systemChannels: mockSystemChannels,
      customChannels: mockCustomChannels,
    }),
    { ...query, mockState: 'success' },
  )
}

function adaptDashboard(envelope: Envelope<DashboardPayload>, query: CustomChannelQuery): CustomChannelDashboard {
  return {
    provider: query.provider,
    state: query.mockState,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    systemChannels: envelope.data.systemChannels,
    customChannels: envelope.data.customChannels,
    audit: [
      `provider=${query.provider}`,
      `listPath=${CUSTOM_CHANNEL_LIST_PATH}`,
      `updatePath=${CUSTOM_CHANNEL_UPDATE_PATH}`,
      `createPath=${CUSTOM_CHANNEL_CREATE_PATH}`,
      `deletePath=${CUSTOM_CHANNEL_DELETE_PATH}`,
      `traceId=${envelope.traceId}`,
      `systemCount=${envelope.data.systemChannels.length}`,
      `customCount=${envelope.data.customChannels.length}`,
    ],
  }
}

async function fetchMockDashboard(query: CustomChannelQuery): Promise<Envelope<DashboardPayload>> {
  await wait(MOCK_LATENCY_MS)

  if (query.mockState === 'error') {
    throw new Error('自定义渠道加载失败，请稍后重试')
  }

  if (query.mockState === 'empty') {
    return createSuccessEnvelope('empty-001', {
      systemChannels: mockSystemChannels,
      customChannels: [],
    })
  }

  return createSuccessEnvelope('success-001', {
    systemChannels: mockSystemChannels,
    customChannels: mockCustomChannels,
  })
}

function createSuccessEnvelope(traceSuffix: string, data: DashboardPayload): Envelope<DashboardPayload> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId: `mock-${TASK_ID}-${traceSuffix}`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createSystemChannels(): SystemChannel[] {
  return systemChannelSeeds.map((name, index) => ({
    id: `system-${String(index + 1).padStart(3, '0')}`,
    name,
    color: systemChannelColors[index],
    enabled: true,
  }))
}

function toMockState(value: string | null): CustomChannelMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

function toProvider(value: string | null): CustomChannelProviderName | null {
  return value === 'api' || value === 'mock' ? value : null
}

function getCustomChannelProviderName(): CustomChannelProviderName {
  if (typeof window === 'undefined') return 'mock'
  const stored = window.localStorage.getItem(CUSTOM_CHANNEL_PROVIDER_KEY)
  return stored === 'api' ? 'api' : 'mock'
}

function validateDialogInput(input: CustomChannelDialogInput) {
  if (!input.name.trim()) {
    throw new Error('请先填写渠道名称')
  }

  if (!input.color.trim()) {
    throw new Error('请先选择渠道颜色')
  }
}

function writeDiagnostics(value: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    CUSTOM_CHANNEL_LAST_REQUEST_KEY,
    JSON.stringify({
      ...value,
      timestamp: MOCK_TIMESTAMP,
    }),
  )
}

function wait(milliseconds: number) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds))
}
