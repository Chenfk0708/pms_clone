const SMART_HOTEL_SETTINGS_PROVIDER_KEY = 'pms.smartHotelSettingsProvider'
const SMART_HOTEL_SETTINGS_DIAGNOSTICS_KEY = 'pms.smartHotelSettings.lastRequest'
const DEFAULT_CAMP_ID = '1796067693589061634'
const MOCK_TIMESTAMP = '2026-05-19T17:30:00+08:00'

export const SMART_HOTEL_SETTINGS_DASHBOARD_ENDPOINT = '/smartHotelSettings/dashboard/get'
export const SMART_HOTEL_SETTINGS_DECORATE_SAVE_ENDPOINT = '/smartHotelSettings/decorate/save'
export const SMART_HOTEL_SETTINGS_SHARE_PUBLISH_ENDPOINT = '/smartHotelSettings/share/publish'
export const SMART_HOTEL_SETTINGS_ICON_UPLOAD_ENDPOINT = '/smartHotelSettings/button/icon/upload'

export type SmartHotelSettingsProviderName = 'mock' | 'api'
export type SmartHotelSettingsMockState = 'success' | 'empty' | 'error'

export type SmartHotelSettingsQuery = {
  campId: string
  mockState: SmartHotelSettingsMockState
}

export type SmartHotelSettingsPreviewAction =
  | {
      kind: 'route'
      path: string
      label: string
    }
  | {
      kind: 'dialog'
      title: string
      description: string
      primaryLabel?: string
      primaryPath?: string
    }

export type SmartHotelSettingsActionButton = {
  id: string
  name: string
  content: string
  iconSeed: string
  previewAction: SmartHotelSettingsPreviewAction
}

export type SmartHotelSettingsShareToken = {
  id: string
  label: string
  placeholder: string
}

export type SmartHotelSettingsShareImageMode = 'default' | 'room-cover' | 'custom'

export type SmartHotelSettingsShareDraft = {
  titleTemplate: string
  imageMode: SmartHotelSettingsShareImageMode
  shareLink: string
  qrCodeHint: string
  customPosterName: string
  tokens: SmartHotelSettingsShareToken[]
}

export type SmartHotelSettingsEmptyState = {
  title: string
  description: string
  actionLabel: string
}

export type SmartHotelSettingsDashboard = {
  provider: SmartHotelSettingsProviderName
  state: SmartHotelSettingsMockState
  endpoint: string
  traceId: string
  timestamp: string
  request: Record<string, unknown>
  version: string
  updatedAtLabel: string
  buttons: SmartHotelSettingsActionButton[]
  shareDraft: SmartHotelSettingsShareDraft
  previewSummary: string
  routes: {
    selfCheckin: string
    globalSetting: string
    hardwareMall: string
    statementOrder: string
  }
  emptyState?: SmartHotelSettingsEmptyState
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type SmartHotelSettingsPayload = Omit<
  SmartHotelSettingsDashboard,
  'provider' | 'state' | 'endpoint' | 'traceId' | 'timestamp' | 'request'
>

export function createDefaultSmartHotelSettingsQuery(
  searchParams = new URLSearchParams(),
): SmartHotelSettingsQuery {
  return {
    campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export function createDefaultSmartHotelSettingsButtons(): SmartHotelSettingsActionButton[] {
  return DEFAULT_BUTTONS.map((button) => ({
    ...button,
    previewAction: { ...button.previewAction },
  }))
}

export async function fetchSmartHotelSettingsDashboard(
  query: SmartHotelSettingsQuery,
  signal?: AbortSignal,
  providerName = getSmartHotelSettingsProviderName(),
): Promise<SmartHotelSettingsDashboard> {
  validateQuery(query)

  const request = {
    endpoint: SMART_HOTEL_SETTINGS_DASHBOARD_ENDPOINT,
    campId: query.campId,
    mockState: query.mockState,
  }

  if (providerName === 'api') {
    writeDiagnostics({
      provider: 'api',
      state: query.mockState,
      traceId: `api-zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu-dashboard-pending`,
      endpoint: SMART_HOTEL_SETTINGS_DASHBOARD_ENDPOINT,
      request,
    })
    throw new Error('智住小程序数据加载失败，请稍后重试')
  }

  await waitForLatency(signal, 160)
  const envelope = buildMockDashboardEnvelope(query)
  writeDiagnostics({
    provider: providerName,
    state: query.mockState,
    traceId: envelope.traceId,
    endpoint: SMART_HOTEL_SETTINGS_DASHBOARD_ENDPOINT,
    request,
  })

  if (envelope.code !== 0) {
    throw new Error(envelope.message || '智住小程序数据加载失败，请稍后重试')
  }

  return {
    provider: providerName,
    state: query.mockState,
    endpoint: SMART_HOTEL_SETTINGS_DASHBOARD_ENDPOINT,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    request,
    ...envelope.data,
  }
}

export async function uploadSmartHotelSettingsButtonIcon(
  button: SmartHotelSettingsActionButton,
): Promise<{ traceId: string; timestamp: string; notice: string }> {
  await waitForLatency(undefined, 120)
  const traceId = `mock-zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu-upload-${button.id}`
  writeDiagnostics({
    provider: getSmartHotelSettingsProviderName(),
    state: 'success',
    traceId,
    endpoint: SMART_HOTEL_SETTINGS_ICON_UPLOAD_ENDPOINT,
    request: {
      buttonId: button.id,
      buttonName: button.name,
    },
  })

  return {
    traceId,
    timestamp: MOCK_TIMESTAMP,
    notice: `已更新「${button.name || '新按钮'}」图标`,
  }
}

export async function saveSmartHotelSettingsDecorate(
  buttons: SmartHotelSettingsActionButton[],
): Promise<{ traceId: string; timestamp: string; message: string }> {
  await waitForLatency(undefined, 180)
  const traceId = 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu-decorate-save-001'
  writeDiagnostics({
    provider: getSmartHotelSettingsProviderName(),
    state: 'success',
    traceId,
    endpoint: SMART_HOTEL_SETTINGS_DECORATE_SAVE_ENDPOINT,
    request: {
      list: buttons.map((button, index) => ({
        sort: index + 1,
        buttonId: button.id,
        buttonName: button.name,
        content: button.content,
      })),
    },
  })
  return {
    traceId,
    timestamp: MOCK_TIMESTAMP,
    message: '装修配置已保存',
  }
}

export async function publishSmartHotelSettingsShare(
  shareDraft: SmartHotelSettingsShareDraft,
): Promise<{ traceId: string; timestamp: string; message: string }> {
  await waitForLatency(undefined, 180)
  const traceId = 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhizhu-xiaochengxu-share-publish-001'
  writeDiagnostics({
    provider: getSmartHotelSettingsProviderName(),
    state: 'success',
    traceId,
    endpoint: SMART_HOTEL_SETTINGS_SHARE_PUBLISH_ENDPOINT,
    request: {
      titleTemplate: shareDraft.titleTemplate,
      imageMode: shareDraft.imageMode,
      customPosterName: shareDraft.customPosterName,
    },
  })
  return {
    traceId,
    timestamp: MOCK_TIMESTAMP,
    message: '分享配置已保存并发布',
  }
}

function getSmartHotelSettingsProviderName(): SmartHotelSettingsProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(SMART_HOTEL_SETTINGS_PROVIDER_KEY)
  return configured === 'api' ? 'api' : 'mock'
}

function buildMockDashboardEnvelope(
  query: SmartHotelSettingsQuery,
): UnifiedEnvelope<SmartHotelSettingsPayload> {
  if (query.mockState === 'error') {
    return {
      code: 50351,
      message: '智住小程序数据加载失败，请稍后重试',
      data: {
        version: 'v4.10.7',
        updatedAtLabel: '最近同步：2026-05-19 17:30',
        buttons: [],
        shareDraft: createDefaultShareDraft(),
        previewSummary: '智住小程序可用于房客自助登记、查看入住指引和在线续住。',
        routes: DEFAULT_ROUTES,
      },
      traceId: 'mock-zhihui-jiudian--zhizhu-yingjian--zhizhu-xiaochengxu-error-001',
      timestamp: MOCK_TIMESTAMP,
    }
  }

  if (query.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        version: 'v4.10.7',
        updatedAtLabel: '最近同步：2026-05-19 17:30',
        buttons: [],
        shareDraft: createDefaultShareDraft(),
        previewSummary: '智住小程序可用于房客自助登记、查看入住指引和在线续住。',
        routes: DEFAULT_ROUTES,
        emptyState: {
          title: '当前还没有可展示的小程序按钮配置',
          description: '请先恢复默认按钮，或前往装修页重新配置住客操作入口。',
          actionLabel: '恢复默认按钮',
        },
      },
      traceId: 'mock-zhihui-jiudian--zhizhu-yingjian--zhizhu-xiaochengxu-empty-001',
      timestamp: MOCK_TIMESTAMP,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: {
      version: 'v4.10.7',
      updatedAtLabel: '最近同步：2026-05-19 17:30',
      buttons: createDefaultSmartHotelSettingsButtons(),
      shareDraft: createDefaultShareDraft(),
      previewSummary: '智住小程序可用于房客自助登记、查看入住指引和在线续住。',
      routes: DEFAULT_ROUTES,
    },
    traceId: 'mock-zhihui-jiudian--zhizhu-yingjian--zhizhu-xiaochengxu-dashboard-001',
    timestamp: MOCK_TIMESTAMP,
  }
}

function createDefaultShareDraft(): SmartHotelSettingsShareDraft {
  return {
    titleTemplate: '欢迎使用智住小程序',
    imageMode: 'default',
    shareLink: 'https://h.localhome.cn/mini-program/smart-checkin',
    qrCodeHint: '扫码后住客可完成入住登记、查看入住指引与门锁密码。',
    customPosterName: '酒店大厅迎宾海报.png',
    tokens: [
      { id: 'store-name', label: '门店名称', placeholder: '[门店名称]' },
      { id: 'guest-name', label: '预订人姓名', placeholder: '[预订人姓名]' },
      { id: 'check-in', label: '入住日期', placeholder: '[入住日期]' },
      { id: 'check-out', label: '离店日期', placeholder: '[离店日期]' },
    ],
  }
}

function validateQuery(query: SmartHotelSettingsQuery) {
  if (!query.campId.trim()) {
    throw new Error('智住小程序门店参数不正确')
  }
}

function toMockState(value: string | null): SmartHotelSettingsMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

function writeDiagnostics(diagnostics: {
  provider: SmartHotelSettingsProviderName
  state: SmartHotelSettingsMockState
  traceId: string
  endpoint: string
  request: Record<string, unknown>
}) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SMART_HOTEL_SETTINGS_DIAGNOSTICS_KEY, JSON.stringify(diagnostics))
}

async function waitForLatency(signal?: AbortSignal, delayMs = 120) {
  if (signal?.aborted) {
    throw new DOMException('智住小程序请求已取消', 'AbortError')
  }

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, delayMs)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('智住小程序请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
}

const DEFAULT_ROUTES = {
  selfCheckin: '/smartHotel/smartHome',
  globalSetting: '/smartHotel/checkInGuide',
  hardwareMall: '/smartHotel/smartHardware/mall',
  statementOrder: '/statistics/statementOrder',
}

const DEFAULT_BUTTONS: SmartHotelSettingsActionButton[] = [
  {
    id: 'register',
    name: '入住登记',
    content: '请先登记身份信息后获取门锁密码。',
    iconSeed: '登记',
    previewAction: {
      kind: 'route',
      path: '/smartHotel/smartHome',
      label: '前往自助入住',
    },
  },
  {
    id: 'guide',
    name: '入住指引',
    content: '到店后可在此查看路线、停车说明与门锁密码。',
    iconSeed: '指引',
    previewAction: {
      kind: 'route',
      path: '/smartHotel/checkInGuide',
      label: '前往全局设置',
    },
  },
  {
    id: 'notice',
    name: '入住须知',
    content: '请在办理入住前确认押金、证件登记和退房时间说明。',
    iconSeed: '须知',
    previewAction: {
      kind: 'dialog',
      title: '入住须知',
      description: '请在住客到店前确认押金、入住登记和退房时效说明。',
      primaryLabel: '查看全局设置',
      primaryPath: '/smartHotel/checkInGuide',
    },
  },
  {
    id: 'wifi',
    name: 'WIFI上网',
    content: '连接 Locals-Guest，密码可在入住后自动同步给住客。',
    iconSeed: 'WIFI',
    previewAction: {
      kind: 'dialog',
      title: 'WIFI 上网',
      description: '已为住客同步 WIFI 名称与密码，可在入住完成后自动展示。',
    },
  },
  {
    id: 'renew',
    name: '续住',
    content: '如需延住，可在小程序内发起续住申请并等待确认。',
    iconSeed: '续住',
    previewAction: {
      kind: 'dialog',
      title: '续住申请',
      description: '住客可在此发起续住申请，前台确认后自动同步订单状态。',
      primaryLabel: '查看品牌小程序订单',
      primaryPath: '/statistics/statementOrder',
    },
  },
  {
    id: 'checkout',
    name: '退房',
    content: '支持一键退房并同步更新订单入住状态。',
    iconSeed: '退房',
    previewAction: {
      kind: 'dialog',
      title: '一键退房',
      description: '住客确认退房后可在小程序提交，系统将同步更新入住状态。',
    },
  },
  {
    id: 'invoice',
    name: '发票',
    content: '填写抬头后提交开票申请，前台审核通过后自动回传。',
    iconSeed: '发票',
    previewAction: {
      kind: 'dialog',
      title: '发票申请',
      description: '住客提交发票抬头后，前台可在订单页查看申请进度。',
      primaryLabel: '查看订单承接',
      primaryPath: '/statistics/statementOrder',
    },
  },
]
