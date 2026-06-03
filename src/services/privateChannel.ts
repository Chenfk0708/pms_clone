export type PrivateChannelScenario = 'success' | 'empty' | 'error'
export type PrivateChannelProviderName = 'mock' | 'api'

export interface PrivateChannelQuery {
  scenario?: PrivateChannelScenario
  provider?: PrivateChannelProviderName
}

export interface PrivateChannelApiCard {
  id: string
  name: string
  relationStatus: 'ready' | 'trial' | 'subscription'
  actionCode: 'connect_wecom' | 'authorize_official' | 'subscribe_program'
  actionText: string
  accent: 'blue' | 'green'
  description: string
  targetPath?: string
}

export interface PrivateChannelData {
  pageTitle: string
  cards: PrivateChannelApiCard[]
  enterprise: {
    name: string
    trialText: string
    statusText: string
    actionText: string
    benefits: string[]
    description: string
  }
  officialAccount: {
    title: string
    description: string
    helper: string
    options: Array<{
      id: string
      label: string
      primary: boolean
    }>
  }
}

export interface PrivateChannelResponse<T> {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

export interface PrivateChannelViewModel extends PrivateChannelData {
  contract: {
    provider: PrivateChannelProviderName
    scenario: PrivateChannelScenario
    traceId: string
    request: {
      path: string
      method: 'POST'
      body: {
        includeAuthState: boolean
        includeOfficialAccount: boolean
        includeMiniProgram: boolean
      }
    }
  }
}

const timestamp = '2026-05-18T10:00:00+08:00'

const successData: PrivateChannelData = {
  pageTitle: '私域渠道',
  cards: [
    {
      id: 'wecom',
      name: '企业微信',
      relationStatus: 'trial',
      actionCode: 'connect_wecom',
      actionText: '立即关联',
      accent: 'blue',
      description: '承接住中沟通、客户沉淀和复购触达',
      targetPath: '/channels/private/setting/weComSetting',
    },
    {
      id: 'official-account',
      name: '公众号',
      relationStatus: 'ready',
      actionCode: 'authorize_official',
      actionText: '立即关联',
      accent: 'green',
      description: '用于消息接待、会员触达和活动通知',
      targetPath: '/channels/private/setting/authorizationSettings',
    },
    {
      id: 'brand-program',
      name: '品牌小程序',
      relationStatus: 'subscription',
      actionCode: 'subscribe_program',
      actionText: '订阅开通',
      accent: 'green',
      description: '搭建自有预订入口，沉淀门店私域流量',
      targetPath: '/version/applicationPayment',
    },
  ],
  enterprise: {
    name: '企业微信',
    trialText: '免费试用90天',
    statusText: '待配置',
    actionText: '立即配置',
    benefits: ['自动化的获客流程', '低成本的获客方式', '丰富的活动运营数据分析和精细化的管理'],
    description: '企业微信用于沉淀私域客户、承接入住沟通和后续复购触达。完成配置后，可在 SCRM 场景中统一管理客户关系。',
  },
  officialAccount: {
    title: '授权微信公众号',
    description: '将您已认证企业资质的公众号，授权给路客云后，可用于客户消息接待、会员触达和私域运营。',
    helper: '请选择已有公众号授权，或先开通公众号后再完成授权。',
    options: [
      { id: 'existing', label: '已有公众号，立即授权', primary: true },
      { id: 'new', label: '没有公众号，立即开通', primary: false },
    ],
  },
}

export function loadPrivateChannel(query: PrivateChannelQuery = {}): PrivateChannelViewModel {
  const scenario = query.scenario ?? readScenario()
  const provider = query.provider ?? readProvider()
  const response = createMockPrivateChannelResponse(scenario)

  if (response.code !== 0) {
    throw new Error(response.message)
  }

  return adaptPrivateChannelResponse(response, provider, scenario)
}

export function createMockPrivateChannelResponse(scenario: PrivateChannelScenario): PrivateChannelResponse<PrivateChannelData> {
  if (scenario === 'error') {
    return {
      code: 50301,
      message: '私域渠道数据加载失败',
      data: { ...successData, cards: [] },
      traceId: 'mock-ota--siyu--siyu-qudao-error-001',
      timestamp,
    }
  }

  if (scenario === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: { ...successData, cards: [] },
      traceId: 'mock-ota--siyu--siyu-qudao-empty-001',
      timestamp,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: successData,
    traceId: 'mock-ota--siyu--siyu-qudao-list-001',
    timestamp,
  }
}

function adaptPrivateChannelResponse(
  response: PrivateChannelResponse<PrivateChannelData>,
  provider: PrivateChannelProviderName,
  scenario: PrivateChannelScenario,
): PrivateChannelViewModel {
  return {
    ...response.data,
    contract: {
      provider,
      scenario,
      traceId: response.traceId,
      request: {
        path: '/channels/private/summary/get',
        method: 'POST',
        body: {
          includeAuthState: true,
          includeOfficialAccount: true,
          includeMiniProgram: true,
        },
      },
    },
  }
}

function readScenario(): PrivateChannelScenario {
  if (typeof window === 'undefined') return 'success'
  const value = window.localStorage.getItem('pmsPrivateChannelScenario')
  return value === 'empty' || value === 'error' ? value : 'success'
}

function readProvider(): PrivateChannelProviderName {
  if (typeof window === 'undefined') return 'mock'
  const value = window.localStorage.getItem('pmsPrivateChannelProvider')
  return value === 'api' || value === 'real' ? 'api' : 'mock'
}
