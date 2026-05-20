export const NOTIFICATION_SETTING_PROVIDER_KEY = 'pms.notificationSetting.provider'
export const NOTIFICATION_SETTING_MOCK_STATE_KEY = 'pms.notificationSetting.mockState'
export const NOTIFICATION_SETTING_ENDPOINT = '/setting/wechatPushSetting/bootstrap'
export const NOTIFICATION_SETTING_TARGET_URL = 'https://minsubao.localhome.cn/setting/wechatPushSetting'

const DEFAULT_TIMESTAMP = '2026-05-20T10:35:00+08:00'
const TRACE_PREFIX = 'mock-shezhi--tongyong-shezhi--tongzhi-shezhi'

export type NotificationSettingProvider = 'mock' | 'api'
export type NotificationSettingMockState = 'success' | 'empty' | 'error'
export type NotificationSettingResponseState = 'loading' | NotificationSettingMockState
export type NotificationChannelKey = 'pcApp' | 'wechat'
export type NotificationItemKey = 'order' | 'storeAlert' | 'storeUpdate' | 'im'

export type NotificationSettingQuery = {
  provider?: NotificationSettingProvider
  mockState?: NotificationSettingMockState
}

export type NotificationSettingAccount = {
  accountId: string
  accountName: string
  receivedAt: string
}

export type NotificationSettingChannel = {
  key: NotificationChannelKey
  title: string
  subtitle?: string
  enabled: boolean
}

export type NotificationSettingItem = {
  key: NotificationItemKey
  title: string
  description: string
  toggles: Partial<Record<NotificationChannelKey, boolean>>
}

export type NotificationSettingViewModel = {
  provider: NotificationSettingProvider
  state: NotificationSettingMockState
  endpoint: string
  traceId: string
  timestamp: string
  request: Record<string, unknown>
  intro: {
    title: string
    detailButtonText: string
  }
  qrCode: {
    alt: string
    imageDataUrl: string
  }
  followSummary: {
    accounts: NotificationSettingAccount[]
    hint: string
  }
  channels: NotificationSettingChannel[]
  items: NotificationSettingItem[]
}

export type NotificationSettingMutationResult = {
  viewModel: NotificationSettingViewModel
  statusMessage: string
}

type NotificationSettingRuntimeConfig = {
  provider: NotificationSettingProvider
  mockState: NotificationSettingMockState
}

type NotificationSettingEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type NotificationAuthorityModule = {
  authorityId: number
  authorityName: string
  remark: string
  isSelected: boolean
}

type NotificationChannelModule = {
  moduleName: string
  children: NotificationAuthorityModule[]
}

type NotificationSettingPayload = {
  intro: NotificationSettingViewModel['intro']
  qrCode: NotificationSettingViewModel['qrCode']
  followSummary: NotificationSettingViewModel['followSummary']
  modules: NotificationChannelModule[]
}

type NotificationStore = {
  followedAccounts: NotificationSettingAccount[]
  items: NotificationSettingItem[]
}

const QR_CODE_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="136" height="136" viewBox="0 0 136 136">
      <rect width="136" height="136" rx="8" fill="#ffffff"/>
      <rect x="8" y="8" width="120" height="120" rx="6" fill="#f3f5fb" stroke="#d8deef"/>
      <rect x="18" y="18" width="28" height="28" rx="4" fill="#111827"/>
      <rect x="90" y="18" width="28" height="28" rx="4" fill="#111827"/>
      <rect x="18" y="90" width="28" height="28" rx="4" fill="#111827"/>
      <rect x="58" y="58" width="20" height="20" rx="4" fill="#4f67ff"/>
      <rect x="54" y="18" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="68" y="18" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="54" y="32" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="68" y="32" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="54" y="90" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="68" y="90" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="82" y="62" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="94" y="74" width="10" height="10" rx="2" fill="#111827"/>
      <rect x="82" y="86" width="10" height="10" rx="2" fill="#111827"/>
    </svg>
  `)

const initialStore: NotificationStore = {
  followedAccounts: [],
  items: [
    {
      key: 'order',
      title: '订单通知',
      description: '新订单、取消订单、待接单、退款申请等核心订单节点通知。',
      toggles: {
        pcApp: true,
        wechat: true,
      },
    },
    {
      key: 'storeAlert',
      title: '门店预警',
      description: '账号过期、渠道异常、退款失败、库存同步异常等经营预警通知。',
      toggles: {
        pcApp: true,
        wechat: true,
      },
    },
    {
      key: 'storeUpdate',
      title: '门店动态',
      description: '人员变更、基础配置调整、交接班等门店运营动态通知。',
      toggles: {
        pcApp: true,
        wechat: true,
      },
    },
    {
      key: 'im',
      title: 'IM消息通知',
      description: '收到新的 IM 会话消息时，通过工作台提醒和系统弹窗同步告知。',
      toggles: {
        pcApp: true,
      },
    },
  ],
}

let mockStore = cloneStore(initialStore)

export class NotificationSettingServiceError extends Error {
  provider: NotificationSettingProvider
  request: Record<string, unknown>
  response: NotificationSettingEnvelope<NotificationSettingPayload>

  constructor(
    provider: NotificationSettingProvider,
    request: Record<string, unknown>,
    response: NotificationSettingEnvelope<NotificationSettingPayload>,
  ) {
    super(response.message)
    this.name = 'NotificationSettingServiceError'
    this.provider = provider
    this.request = request
    this.response = response
  }
}

export function resolveNotificationSettingRuntimeConfig(location: { search: string }): NotificationSettingRuntimeConfig {
  const searchParams = new URLSearchParams(location.search)

  return {
    provider:
      normalizeProvider(searchParams.get('provider') ?? searchParams.get('notificationSettingProvider')) ?? readProvider(),
    mockState:
      normalizeMockState(searchParams.get('mockState') ?? searchParams.get('notificationSettingMockState')) ?? readMockState(),
  }
}

export function createDefaultNotificationSettingQuery(
  config: NotificationSettingRuntimeConfig,
): NotificationSettingQuery {
  return {
    provider: config.provider,
    mockState: config.mockState,
  }
}

export async function loadNotificationSettingViewModel(
  query: NotificationSettingQuery,
  signal?: AbortSignal,
): Promise<NotificationSettingViewModel> {
  const provider = query.provider ?? 'mock'
  const request = buildRequest(query)
  const requestedState = query.mockState ?? 'success'

  await delay(180, signal)

  if (provider === 'api') {
    throw new NotificationSettingServiceError(
      provider,
      request,
      createEnvelope('error', 50301, '通知设置实时接口暂未开放，请切换到 mock 数据源。'),
    )
  }

  if (requestedState === 'error') {
    throw new NotificationSettingServiceError(provider, request, createEnvelope('error', 50001, '通知设置加载失败，请稍后重试'))
  }

  const responseState: NotificationSettingMockState = requestedState === 'empty' ? 'empty' : 'success'
  const payload = buildPayload(responseState)
  const response = createEnvelope(responseState, 0, 'success', payload)

  return adaptEnvelope(provider, request, response, responseState)
}

export async function markNotificationAccountFollowed(
  query: NotificationSettingQuery,
  signal?: AbortSignal,
): Promise<NotificationSettingMutationResult> {
  await delay(120, signal)

  if (mockStore.followedAccounts.length === 0) {
    mockStore = {
      ...mockStore,
      followedAccounts: [
        {
          accountId: 'wx-mp-001',
          accountName: '路客云通知助手',
          receivedAt: '2026-05-20 10:40',
        },
      ],
    }
  }

  return {
    viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
    statusMessage: '已刷新关注状态，当前可接收公众号通知。',
  }
}

export async function refreshNotificationFollowStatus(
  query: NotificationSettingQuery,
  signal?: AbortSignal,
): Promise<NotificationSettingMutationResult> {
  await delay(120, signal)

  return {
    viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
    statusMessage: mockStore.followedAccounts.length > 0 ? '关注状态已更新。' : '已刷新关注状态，当前暂无已关注公众号。',
  }
}

export async function toggleNotificationChannel(
  query: NotificationSettingQuery,
  channel: NotificationChannelKey,
  nextChecked: boolean,
  signal?: AbortSignal,
): Promise<NotificationSettingMutationResult> {
  await delay(80, signal)

  mockStore = {
    ...mockStore,
    items: mockStore.items.map((item) =>
      item.toggles[channel] === undefined
        ? cloneItem(item)
        : {
            ...item,
            toggles: {
              ...item.toggles,
              [channel]: nextChecked,
            },
          },
    ),
  }

  return {
    viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
    statusMessage: `${channelLabelMap[channel]}总开关已${nextChecked ? '开启' : '关闭'}。`,
  }
}

export async function toggleNotificationItem(
  query: NotificationSettingQuery,
  itemKey: NotificationItemKey,
  channel: NotificationChannelKey,
  nextChecked: boolean,
  signal?: AbortSignal,
): Promise<NotificationSettingMutationResult> {
  await delay(80, signal)

  const currentItem = mockStore.items.find((item) => item.key === itemKey)
  if (!currentItem || currentItem.toggles[channel] === undefined) {
    throw new NotificationSettingServiceError(
      query.provider ?? 'mock',
      { ...buildRequest(query), itemKey, channel, nextChecked },
      createEnvelope('error', 40404, '未找到可切换的通知项。'),
    )
  }

  mockStore = {
    ...mockStore,
    items: mockStore.items.map((item) =>
      item.key !== itemKey
        ? cloneItem(item)
        : {
            ...item,
            toggles: {
              ...item.toggles,
              [channel]: nextChecked,
            },
          },
    ),
  }

  return {
    viewModel: await loadNotificationSettingViewModel({ ...query, mockState: 'success' }, signal),
    statusMessage: `${currentItem.title}${channelLabelMap[channel]}已${nextChecked ? '开启' : '关闭'}。`,
  }
}

function buildRequest(query: NotificationSettingQuery) {
  return {
    provider: query.provider ?? 'mock',
    mockState: query.mockState ?? 'success',
  }
}

function buildPayload(state: NotificationSettingMockState): NotificationSettingPayload {
  const items = state === 'empty' ? [] : mockStore.items.map(cloneItem)

  return {
    intro: {
      title: '扫码关注公众号【路客云】，快速通过微信推送订单、房态与门店经营动态。',
      detailButtonText: '查看接受微信通知公众号',
    },
    qrCode: {
      alt: '路客云微信公众号二维码',
      imageDataUrl: QR_CODE_DATA_URL,
    },
    followSummary: {
      accounts: mockStore.followedAccounts.map(cloneAccount),
      hint: mockStore.followedAccounts.length > 0 ? '已关注的公众号会在此处展示，可直接确认接收通知状态。' : '当前暂无已关注公众号，请扫码关注后刷新状态。',
    },
    modules: [
      createChannelModule('PC\\APP推送', 'pcApp', items, {
        order: 1624,
        storeAlert: 1625,
        storeUpdate: 1626,
        im: 1627,
      }),
      createChannelModule('公众号推送', 'wechat', items, {
        order: 1628,
        storeAlert: 1629,
        storeUpdate: 1630,
      }),
    ],
  }
}

function createChannelModule(
  moduleName: string,
  channel: NotificationChannelKey,
  items: NotificationSettingItem[],
  authorityIds: Partial<Record<NotificationItemKey, number>>,
): NotificationChannelModule {
  return {
    moduleName,
    children: items
      .filter((item) => item.toggles[channel] !== undefined)
      .map((item) => ({
        authorityId: authorityIds[item.key] ?? 0,
        authorityName: item.title,
        remark: item.description,
        isSelected: Boolean(item.toggles[channel]),
      })),
  }
}

function adaptEnvelope(
  provider: NotificationSettingProvider,
  request: Record<string, unknown>,
  response: NotificationSettingEnvelope<NotificationSettingPayload>,
  state: NotificationSettingMockState,
): NotificationSettingViewModel {
  if (response.code !== 0) {
    throw new NotificationSettingServiceError(provider, request, response)
  }

  const items = mapItemsFromModules(response.data.modules)

  return {
    provider,
    state,
    endpoint: NOTIFICATION_SETTING_ENDPOINT,
    traceId: response.traceId,
    timestamp: response.timestamp,
    request,
    intro: response.data.intro,
    qrCode: response.data.qrCode,
    followSummary: {
      accounts: response.data.followSummary.accounts.map(cloneAccount),
      hint: response.data.followSummary.hint,
    },
    channels: [
      {
        key: 'pcApp',
        title: 'PC\\APP推送',
        enabled: items.filter((item) => item.toggles.pcApp !== undefined).every((item) => item.toggles.pcApp === true),
      },
      {
        key: 'wechat',
        title: '公众号推送',
        subtitle: '（请先扫码关注公众号）',
        enabled: items.filter((item) => item.toggles.wechat !== undefined).every((item) => item.toggles.wechat === true),
      },
    ],
    items,
  }
}

function mapItemsFromModules(modules: NotificationChannelModule[]) {
  const itemMap = new Map<NotificationItemKey, NotificationSettingItem>()

  for (const item of mockStore.items) {
    itemMap.set(item.key, {
      key: item.key,
      title: item.title,
      description: item.description,
      toggles: {},
    })
  }

  for (const module of modules) {
    const channel = module.moduleName === '公众号推送' ? 'wechat' : 'pcApp'
    for (const child of module.children) {
      const itemKey = authorityNameMap[child.authorityName]
      if (!itemKey) {
        continue
      }

      const current = itemMap.get(itemKey)
      if (!current) {
        continue
      }

      current.toggles[channel] = child.isSelected
    }
  }

  return Array.from(itemMap.values()).sort((left, right) => itemOrder[left.key] - itemOrder[right.key])
}

function createEnvelope(
  state: NotificationSettingMockState,
  code: number,
  message: string,
  data?: NotificationSettingPayload,
): NotificationSettingEnvelope<NotificationSettingPayload> {
  return {
    code,
    message,
    data: data ?? buildPayload(state === 'error' ? 'success' : state),
    traceId: `${TRACE_PREFIX}-${state}-001`,
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function cloneStore(store: NotificationStore): NotificationStore {
  return {
    followedAccounts: store.followedAccounts.map(cloneAccount),
    items: store.items.map(cloneItem),
  }
}

function cloneAccount(account: NotificationSettingAccount): NotificationSettingAccount {
  return { ...account }
}

function cloneItem(item: NotificationSettingItem): NotificationSettingItem {
  return {
    ...item,
    toggles: { ...item.toggles },
  }
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

function normalizeProvider(value: string | null | undefined): NotificationSettingProvider | undefined {
  return value === 'mock' || value === 'api' ? value : undefined
}

function normalizeMockState(value: string | null | undefined): NotificationSettingMockState | undefined {
  return value === 'success' || value === 'empty' || value === 'error' ? value : undefined
}

function readProvider(): NotificationSettingProvider {
  if (typeof window === 'undefined') {
    return 'mock'
  }

  return normalizeProvider(window.localStorage.getItem(NOTIFICATION_SETTING_PROVIDER_KEY)) ?? 'mock'
}

function readMockState(): NotificationSettingMockState {
  if (typeof window === 'undefined') {
    return 'success'
  }

  return normalizeMockState(window.localStorage.getItem(NOTIFICATION_SETTING_MOCK_STATE_KEY)) ?? 'success'
}

const channelLabelMap: Record<NotificationChannelKey, string> = {
  pcApp: 'PC\\APP推送',
  wechat: '公众号推送',
}

const authorityNameMap: Record<string, NotificationItemKey> = {
  订单通知: 'order',
  门店预警: 'storeAlert',
  门店动态: 'storeUpdate',
  'IM消息通知': 'im',
}

const itemOrder: Record<NotificationItemKey, number> = {
  order: 1,
  storeAlert: 2,
  storeUpdate: 3,
  im: 4,
}
