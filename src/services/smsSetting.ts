const SMS_SETTING_PROVIDER_KEY = 'pms.smsSetting.provider'
const SMS_SETTING_MOCK_STATE_KEY = 'pms.smsSetting.mockState'
const SMS_SETTING_DIAGNOSTICS_KEY = 'pms.smsSetting.lastRequest'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-19T11:35:00+08:00'
const DEFAULT_TRACE_PREFIX = 'mock-shezhi--tongyong-shezhi--duanxin-shezhi'

export type SmsSettingProvider = 'mock' | 'api'
export type SmsSettingMockState = 'success' | 'empty' | 'error'

export type SmsSettingFilters = {
  campId: string
  mockState: SmsSettingMockState
}

export type SmsSettingTemplate = {
  id: string
  title: string
  content: string
  enabled: boolean
  sendStatus: 'enabled'
  auditStatus: 'approved'
  signName: string
}

export type SmsSettingSectionAccent = 'blue' | 'violet' | 'cyan' | 'green' | 'orange' | 'slate'

export type SmsSettingSection = {
  id: string
  title: string
  description: string
  accent: SmsSettingSectionAccent
  iconLabel: string
  actionLabel?: string
  actionRoute?: string
  templates: SmsSettingTemplate[]
}

export type SmsSettingRechargePlan = {
  id: string
  countLabel: string
  priceLabel: string
  totalLabel: string
}

export type SmsSettingRechargeRecord = {
  id: string
  createdAt: string
  packageLabel: string
  amountLabel: string
  statusLabel: string
}

export type SmsSettingChannelOption = {
  id: string
  name: string
  shortName: string
  badgeText: string
  tone: SmsSettingSectionAccent
  enabled: boolean
}

export type SmsSettingViewModel = {
  provider: SmsSettingProvider
  state: SmsSettingMockState
  traceId: string
  timestamp: string
  requestBody: {
    campId: string
    endpoints: string[]
  }
  title: string
  versionLabel: string
  introText: string
  balance: {
    remaining: number
    total: number
    summary: string
  }
  currentChannel: SmsSettingChannelOption
  channelOptions: SmsSettingChannelOption[]
  sign: {
    value: string
    description: string
    canEdit: boolean
  }
  sections: SmsSettingSection[]
  rechargePlans: SmsSettingRechargePlan[]
  rechargeRecords: SmsSettingRechargeRecord[]
  routes: {
    selfCheckin: string
    rechargeRecord: string
    templateEdit: string
  }
  emptyState?: {
    title: string
    description: string
    actionLabel: string
    actionPath: string
  }
}

export type SmsSettingContractSnapshot = {
  provider: SmsSettingProvider
  state: SmsSettingMockState
  traceId: string
  timestamp: string
  requestBody: SmsSettingViewModel['requestBody']
}

type SmsSettingEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type SmsSettingPayload = Omit<SmsSettingViewModel, 'provider' | 'state' | 'traceId' | 'timestamp'>

const SMS_SETTING_ENDPOINTS = [
  '/smsAccount/get',
  '/smsTemplateMsgConfig/channel/get',
  '/smsTemplateMsgConfig/signName/get',
  '/smsTemplateMsgConfig/page/get',
]

export class SmsSettingServiceError extends Error {
  provider: SmsSettingProvider
  contract: SmsSettingContractSnapshot

  constructor(message: string, provider: SmsSettingProvider, contract: SmsSettingContractSnapshot) {
    super(message)
    this.name = 'SmsSettingServiceError'
    this.provider = provider
    this.contract = contract
  }
}

export function createDefaultSmsSettingFilters(searchParams = new URLSearchParams()): SmsSettingFilters {
  return {
    campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
    mockState: normalizeMockState(searchParams.get('mockState')) ?? readMockState(),
  }
}

export async function fetchSmsSettingDashboard(
  filters: SmsSettingFilters,
  signal?: AbortSignal,
  provider = readProvider(),
): Promise<SmsSettingViewModel> {
  validateFilters(filters)

  const requestBody = {
    campId: filters.campId,
    endpoints: SMS_SETTING_ENDPOINTS,
  }

  if (provider === 'api') {
    const contract = createContractSnapshot(provider, 'error', 'api-shezhi--tongyong-shezhi--duanxin-shezhi-pending', requestBody)
    writeDiagnostics(contract)
    throw new SmsSettingServiceError('短信设置数据加载失败，请稍后重试', provider, contract)
  }

  await waitForLatency(signal, 160)
  const envelope = buildMockEnvelope(filters)
  const contract = createContractSnapshot(provider, filters.mockState, envelope.traceId, requestBody)
  writeDiagnostics(contract)

  if (envelope.code !== 0) {
    throw new SmsSettingServiceError(envelope.message || '短信设置数据加载失败，请稍后重试', provider, contract)
  }

  return {
    ...envelope.data,
    provider,
    state: filters.mockState,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
  }
}

export function readSmsSettingDiagnostics(): SmsSettingContractSnapshot | null {
  if (typeof window === 'undefined') return null
  const rawText = window.localStorage.getItem(SMS_SETTING_DIAGNOSTICS_KEY)
  if (!rawText) return null

  try {
    return JSON.parse(rawText) as SmsSettingContractSnapshot
  } catch {
    return null
  }
}

function buildMockEnvelope(filters: SmsSettingFilters): SmsSettingEnvelope<SmsSettingPayload> {
  if (filters.mockState === 'error') {
    return {
      code: 50321,
      message: '短信设置数据加载失败，请稍后重试',
      data: createBasePayload(),
      traceId: `${DEFAULT_TRACE_PREFIX}-error-001`,
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  if (filters.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        ...createBasePayload(),
        sections: [],
        emptyState: {
          title: '当前暂无短信模板配置',
          description: '当前门店还没有可用的短信模板，请先完成自助入住和门锁相关设置后再回来配置。',
          actionLabel: '前往自助入住设置',
          actionPath: '/smartHotel/smartHome',
        },
      },
      traceId: `${DEFAULT_TRACE_PREFIX}-empty-001`,
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: createBasePayload(),
    traceId: `${DEFAULT_TRACE_PREFIX}-success-001`,
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function createBasePayload(): SmsSettingPayload {
  const channelOptions: SmsSettingChannelOption[] = [
    { id: 'juhe', name: '聚合数据', shortName: '聚合', badgeText: '聚', tone: 'blue', enabled: false },
    { id: 'aliyun', name: '阿里云短信', shortName: '阿里云', badgeText: '阿', tone: 'violet', enabled: true },
    { id: 'meilian', name: '美联短信', shortName: '美联', badgeText: '美', tone: 'cyan', enabled: false },
    { id: 'tencent', name: '腾讯云短信', shortName: '腾讯云', badgeText: '腾', tone: 'green', enabled: false },
    { id: 'qiniu', name: '七牛云短信', shortName: '七牛', badgeText: '七', tone: 'orange', enabled: false },
    { id: 'smsbao', name: '短信宝', shortName: '短信宝', badgeText: '宝', tone: 'slate', enabled: false },
    { id: 'huyi', name: '互亿无线', shortName: '互亿', badgeText: '互', tone: 'blue', enabled: false },
    { id: 'ronglian', name: '容联云通讯', shortName: '容联', badgeText: '容', tone: 'violet', enabled: false },
    { id: 'chuanglan', name: '创蓝短信', shortName: '创蓝', badgeText: '创', tone: 'cyan', enabled: false },
    { id: 'jiguang', name: '极光短信', shortName: '极光', badgeText: '极', tone: 'green', enabled: false },
    { id: 'yunpian', name: '云片短信', shortName: '云片', badgeText: '云', tone: 'orange', enabled: false },
    { id: 'weilan', name: '微链短信', shortName: '微链', badgeText: '微', tone: 'slate', enabled: false },
  ]

  return {
    requestBody: {
      campId: DEFAULT_CAMP_ID,
      endpoints: SMS_SETTING_ENDPOINTS,
    },
    title: '短信设置',
    versionLabel: '版本号：v4.10.7',
    introText: '启用短信推送模版后，系统将在预设条件下自动向客人发送短信通知',
    balance: {
      remaining: 50,
      total: 100,
      summary: '剩余短信：50',
    },
    currentChannel: channelOptions.find((item) => item.enabled) ?? channelOptions[0],
    channelOptions,
    sign: {
      value: '【路客云】',
      description: '当前签名已通过审核，可用于订单提醒、门锁密码通知和自助入住短信。',
      canEdit: true,
    },
    sections: [
      {
        id: 'order-status',
        title: '订单状态通知',
        description: '订单状态变更时，系统自动通知房客',
        accent: 'blue',
        iconLabel: '订',
        templates: [
          createTemplate('booking-success', '预订提醒', '【路客云】预订成功：{房源名称} {房间数量}间，{入住时间}入住，{间夜数}晚。'),
          createTemplate('booking-cancel', '订单取消', '【路客云】预订取消：您预订的{房源名称} {房间数量}间 已取消预订。'),
          createTemplate('checkin-reminder', '入住提醒', '【路客云】您订购的{房源名称}，将于明天入住。'),
        ],
      },
      {
        id: 'long-rent',
        title: '长租订单费用提醒',
        description: '用于长租账单提醒，提前告知租客应付账款',
        accent: 'violet',
        iconLabel: '租',
        templates: [
          createTemplate(
            'rent-collection',
            '长租催收短信',
            '【路客云】尊敬的{房型名称}{房间名称}租客{姓名}您好！您本周期{缴费开始时间}至{缴费结束时间}房租费合计：{应收金额}。',
          ),
          createTemplate(
            'rent-monthly',
            '每月租金提醒',
            '【路客云】您的长租订单{订单}本期账单{开始时间}至{结束时间}需要催收，租客姓名：{租客姓名}，应收金额：{应收金额}。',
          ),
        ],
      },
      {
        id: 'mall-order',
        title: '商城订单提醒',
        description: '商城下单、支付等状态变更时，系统自动通知房客',
        accent: 'cyan',
        iconLabel: '商',
        templates: [
          createTemplate('mall-purchase', '商城商品购买', '【路客云】您已成功购买{卡券名称} {卡券数量}个，有效期至{失效时间}。'),
          createTemplate('mall-expire', '商城商品过期', '【路客云】临期提醒：您购买的{卡券名称}还有{距离多少天失效}天失效。'),
        ],
      },
      {
        id: 'self-checkin',
        title: '自助入住短信',
        description: '引导客人完成实名登记与智能入住办理',
        accent: 'green',
        iconLabel: '住',
        actionLabel: '去设置',
        actionRoute: '/smartHotel/smartHome',
        templates: [
          createTemplate(
            'smart-password',
            '获得密码（智能入住）',
            '【路客云】您入住的房间{房源名称}{房间号}，门锁密码：{密码}#；点击{小程序跳转短链接}查看入住指引。',
          ),
          createTemplate(
            'smart-register',
            '实名登记（智能入住）',
            '【路客云】您预订的房间可智能入住，点击{小程序跳转短链接}完成实名登记并获取门锁密码。',
          ),
          createTemplate(
            'smart-wechat-register',
            '智住发送入住登记短信(微信公众号)',
            '【路客云】请先完成入住登记，点击{公众号跳转短链接}提交实名信息，审核后可自助办理入住。',
          ),
          createTemplate(
            'smart-wecom-register',
            '智住发送入住登记短信(企微)',
            '【路客云】请点击{企微跳转短链接}进入企微服务页，完成入住登记后即可继续获取入住指引。',
          ),
        ],
      },
      {
        id: 'door-lock',
        title: '门锁密码通知',
        description: '用于发送或更新门锁密码，提醒房客安全入住',
        accent: 'orange',
        iconLabel: '锁',
        templates: [
          createTemplate('door-password', '门锁临时密码', '【路客云】{名称} 开锁密码：{密码}# 有效期：{生效时间}至{失效时间}。'),
          createTemplate('manual-password', '获得密码（非智住）', '【路客云】您入住的房间{房源名称}{房间名称}，门锁密码：{密码}#。'),
          createTemplate('door-timeout', '门锁临时密码超时提示', '【路客云】您的门锁临时密码即将过期，如需延长入住请及时联系门店前台。'),
        ],
      },
      {
        id: 'others',
        title: '其他短信通知',
        description: '未归类到以上模块的其他短信模板',
        accent: 'slate',
        iconLabel: '其',
        templates: [
          createTemplate(
            'wecom-add-friend',
            '企微批量加好友',
            '【路客云】回馈新老用户，不定期推出优惠活动，点击{小程序跳转短链接}添加企微获取最新优惠信息。',
          ),
        ],
      },
    ],
    rechargePlans: [
      { id: '100', countLabel: '100条', priceLabel: '0.08元/条', totalLabel: '￥8' },
      { id: '500', countLabel: '500条', priceLabel: '0.07元/条', totalLabel: '￥35' },
      { id: '1000', countLabel: '1000条', priceLabel: '0.07元/条', totalLabel: '￥70' },
      { id: '2000', countLabel: '2000条', priceLabel: '0.07元/条', totalLabel: '￥140' },
      { id: '5000', countLabel: '5000条', priceLabel: '0.06元/条', totalLabel: '￥300' },
      { id: '15000', countLabel: '15000条', priceLabel: '0.05元/条', totalLabel: '￥750' },
    ],
    rechargeRecords: [
      {
        id: 'record-20260518',
        createdAt: '2026-05-18 16:40',
        packageLabel: '5000条短信包',
        amountLabel: '￥300',
        statusLabel: '支付成功',
      },
      {
        id: 'record-20260510',
        createdAt: '2026-05-10 09:20',
        packageLabel: '1000条短信包',
        amountLabel: '￥70',
        statusLabel: '支付成功',
      },
    ],
    routes: {
      selfCheckin: '/smartHotel/smartHome',
      rechargeRecord: '/setting/balanceAndTemplate/rechargeRecord',
      templateEdit: '/setting/balanceAndTemplate/edit',
    },
  }
}

function createTemplate(id: string, title: string, content: string, enabled = true): SmsSettingTemplate {
  return {
    id,
    title,
    content,
    enabled,
    sendStatus: 'enabled',
    auditStatus: 'approved',
    signName: '【路客云】',
  }
}

function validateFilters(filters: SmsSettingFilters) {
  if (!filters.campId.trim()) {
    throw new Error('短信设置门店参数不正确')
  }
}

function normalizeMockState(value: string | null | undefined): SmsSettingMockState | undefined {
  return value === 'success' || value === 'empty' || value === 'error' ? value : undefined
}

function readProvider(): SmsSettingProvider {
  if (typeof window === 'undefined') return 'mock'
  return normalizeProviderValue(window.localStorage.getItem(SMS_SETTING_PROVIDER_KEY)) === 'api' ? 'api' : 'mock'
}

function readMockState(): SmsSettingMockState {
  if (typeof window === 'undefined') return 'success'
  return normalizeMockState(window.localStorage.getItem(SMS_SETTING_MOCK_STATE_KEY)) ?? 'success'
}

function createContractSnapshot(
  provider: SmsSettingProvider,
  state: SmsSettingMockState,
  traceId: string,
  requestBody: SmsSettingViewModel['requestBody'],
): SmsSettingContractSnapshot {
  return {
    provider,
    state,
    traceId,
    timestamp: DEFAULT_TIMESTAMP,
    requestBody,
  }
}

function writeDiagnostics(contract: SmsSettingContractSnapshot) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(SMS_SETTING_DIAGNOSTICS_KEY, JSON.stringify(contract))
}

async function waitForLatency(signal?: AbortSignal, delayMs = 120) {
  if (signal?.aborted) {
    throw new DOMException('短信设置请求已取消', 'AbortError')
  }

  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, delayMs)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('短信设置请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
}

function normalizeProviderValue(value: string | null | undefined) {
  return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined
}
