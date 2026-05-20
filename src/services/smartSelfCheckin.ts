const SMART_SELF_CHECKIN_PROVIDER_KEY = 'pms.smartSelfCheckinProvider'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-19T10:00:00+08:00'

export type SmartSelfCheckinProviderName = 'mock' | 'api'
export type SmartSelfCheckinMockState = 'success' | 'empty' | 'error'

export type SmartSelfCheckinFilters = {
  campId: string
  scene: 'cloud-checkin'
  mockState: SmartSelfCheckinMockState
}

export type SmartSelfCheckinPlan = {
  id: string
  title: string
  description: string
  messageTemplate: string
  badge: 'default' | 'recommended' | 'locked'
  routePath?: string
  routeLabel?: string
}

export type SmartSelfCheckinFlowStep = {
  id: string
  label: string
}

export type SmartSelfCheckinDashboard = {
  provider: SmartSelfCheckinProviderName
  traceId: string
  requestedAt: string
  requestedAtLabel: string
  enabled: boolean
  description: string
  plans: SmartSelfCheckinPlan[]
  flowSteps: SmartSelfCheckinFlowStep[]
  routes: {
    globalSetting: string
    miniProgram: string
    hardwareMall: string
    police: string
  }
  emptyState?: {
    title: string
    description: string
    actionLabel: string
    actionPath: string
  }
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type SmartSelfCheckinPayload = Omit<SmartSelfCheckinDashboard, 'provider' | 'traceId'>

export function createDefaultSmartSelfCheckinFilters(
  searchParams = new URLSearchParams(),
): SmartSelfCheckinFilters {
  return {
    campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
    scene: 'cloud-checkin',
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export async function fetchSmartSelfCheckinDashboard(
  filters: SmartSelfCheckinFilters,
  signal?: AbortSignal,
  providerName = getSmartSelfCheckinProviderName(),
): Promise<SmartSelfCheckinDashboard> {
  validateFilters(filters)

  if (providerName === 'api') {
    throw new Error('自助入住加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  const envelope = buildMockEnvelope(filters)
  return adaptSmartSelfCheckinEnvelope(envelope, providerName)
}

function getSmartSelfCheckinProviderName(): SmartSelfCheckinProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(SMART_SELF_CHECKIN_PROVIDER_KEY)
  return configured === 'api' ? 'api' : 'mock'
}

function buildMockEnvelope(
  filters: SmartSelfCheckinFilters,
): UnifiedEnvelope<SmartSelfCheckinPayload> {
  if (filters.mockState === 'error') {
    return {
      code: 50301,
      message: '自助入住加载失败，请稍后重试',
      data: createEmptyPayload(),
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zizhu-ruzhu-error-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  if (filters.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        ...createEmptyPayload(),
        emptyState: {
          title: '当前暂无可发布的自助入住方案',
          description: '请先到全局设置完成入住规则配置，再选择短信邀请或小程序登记方案。',
          actionLabel: '前往全局设置',
          actionPath: '/smartHotel/checkInGuide',
        },
      },
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zizhu-ruzhu-empty-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: {
      requestedAt: DEFAULT_TIMESTAMP,
      requestedAtLabel: '最近同步：2026-05-19 10:00',
      enabled: true,
      description: '房客在到店前，通过短信完成入住相关操作。',
      plans: [
        {
          id: 'password-only',
          title: '仅发送门锁密码（直接入住）',
          description: '房客通过短信查看门锁密码，直接办理入住。',
          messageTemplate:
            '【路客云】您入住的房间{房源名称} {房间号}，门锁密码：{密码}#；点击 minsubao.net/{小程序跳转短链接} 查看入住指引。',
          badge: 'default',
          routePath: '/smartHotel/checkInGuide',
          routeLabel: '查看规则',
        },
        {
          id: 'mini-program',
          title: '短信 + 智住小程序（自助登记）',
          description: '房客自行完成入住登记并获取门锁密码。',
          messageTemplate:
            '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 登记入住，获取门锁密码。',
          badge: 'recommended',
          routePath: '/smartHotel/smartSettings',
          routeLabel: '装修小程序',
        },
        {
          id: 'wecom-service',
          title: '短信 + 企微客服（人工接待）',
          description: '引导房客添加企微，由客服进行接待和入住协助。',
          messageTemplate:
            '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 添加企微，获取入住指引与门锁密码。',
          badge: 'locked',
        },
        {
          id: 'wechat-official',
          title: '短信 + 公众号（自助登记）',
          description: '引导房客进入酒店公众号完成咨询和登记。',
          messageTemplate:
            '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 关注酒店公众号并办理入住。',
          badge: 'locked',
        },
      ],
      flowSteps: [
        { id: 'sms', label: '接收短信' },
        { id: 'password', label: '查看门锁密码' },
      ],
      routes: {
        globalSetting: '/smartHotel/checkInGuide',
        miniProgram: '/smartHotel/smartSettings',
        hardwareMall: '/smartHotel/smartHardware/mall',
        police: '/psb/list',
      },
    },
    traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zizhu-ruzhu-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function createEmptyPayload(): SmartSelfCheckinPayload {
  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: '最近同步：2026-05-19 10:00',
    enabled: false,
    description: '房客在到店前，通过短信完成入住相关操作。',
    plans: [],
    flowSteps: [
      { id: 'sms', label: '接收短信' },
      { id: 'password', label: '查看门锁密码' },
    ],
    routes: {
      globalSetting: '/smartHotel/checkInGuide',
      miniProgram: '/smartHotel/smartSettings',
      hardwareMall: '/smartHotel/smartHardware/mall',
      police: '/psb/list',
    },
  }
}

function adaptSmartSelfCheckinEnvelope(
  envelope: UnifiedEnvelope<SmartSelfCheckinPayload>,
  provider: SmartSelfCheckinProviderName,
): SmartSelfCheckinDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '自助入住加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.plans) || !Array.isArray(data.flowSteps)) {
    throw new Error('自助入住加载失败，请稍后重试')
  }

  return {
    ...data,
    provider,
    traceId: envelope.traceId,
  }
}

function validateFilters(filters: SmartSelfCheckinFilters) {
  if (!filters.campId.trim()) {
    throw new Error('自助入住门店参数不正确')
  }
}

function toMockState(value: string | null): SmartSelfCheckinMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 120)
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
