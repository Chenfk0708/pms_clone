const OTA_PROVIDER_KEY = 'pms.otaProvider'
const fixedTimestamp = '2026-05-18T10:00:00+08:00'

export type OtaProviderName = 'mock' | 'api'
export type OtaMockState = 'success' | 'empty' | 'error'
export type OtaDetailTab = 'roomTypes' | 'stores'

export type OtaFilters = {
  businessDate: string
  storeId: string
  dimension: 'all' | 'connected' | 'pending'
  mockState: OtaMockState
}

export type OtaLogFilters = {
  channelId: string
  keyword: string
  operator: string
  operationType: string
  operationStatus: string
  page: number
  pageSize: number
  mockState: OtaMockState
}

export type OtaDetailFilters = {
  channelStoreId: string
  accountId: string
  status: 'all' | 'linked' | 'unlinked'
  keyword: string
}

export type OtaOption = {
  value: string
  label: string
}

export type OtaMetric = {
  key: string
  label: string
  value: string
  detail: string
}

export type OtaChannelNoticeSection = {
  heading: string
  paragraphs: string[]
}

export type OtaChannelAuthorizationNotice = {
  title: string
  summary: string
  highlight?: string
  summarySuffix: string
  noticeTitle: string
  noticeSections: OtaChannelNoticeSection[]
  cancelLabel: string
  confirmLabel: string
  countdownSeconds?: number
  badgeText: string
  badgeTone: 'ctrip' | 'meituan' | 'default'
}

export type OtaChannel = {
  id: string
  name: string
  relation: string
  status: 'connected' | 'pending'
  roomTypeCount: number
  mappedRoomTypeCount: number
  lastSyncAt: string
  logoText: string
  detail: string
  authorizationNotice: OtaChannelAuthorizationNotice
}

export type OtaDashboard = {
  filters: OtaFilters
  stores: OtaOption[]
  dimensions: OtaOption[]
  metrics: OtaMetric[]
  connectedChannels: OtaChannel[]
  pendingChannels: OtaChannel[]
  reminders: { id: string; title: string; detail: string }[]
  quickLinks: { id: string; label: string; route: string }[]
  updatedAt: string
  provider: OtaProviderName
  traceId: string
  request: Omit<OtaFilters, 'mockState'>
}

export type OtaLogRow = {
  id: string
  channelId: string
  channel: string
  type: string
  operationType: string
  content: string
  status: '成功' | '失败'
  operator: string
  time: string
}

export type OtaLogResult = {
  filters: OtaLogFilters
  channelOptions: OtaOption[]
  operationTypeOptions: OtaOption[]
  operationStatusOptions: OtaOption[]
  rows: OtaLogRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  provider: OtaProviderName
  traceId: string
  request: Omit<OtaLogFilters, 'mockState'>
}

export type OtaDetailRoomRow = {
  id: string
  channelStoreId: string
  channelStoreName: string
  channelRoomType: string
  status: 'linked' | 'unlinked'
  statusLabel: string
  linkedRoomType: string
}

export type OtaDetailStoreRow = {
  id: string
  accountId: string
  channelStoreId: string
  channelStoreName: string
  hotelType: string
  hotelId: string
  relatedRoomTypeSummary: string
  status: 'linked' | 'unlinked'
  statusLabel: string
}

export type OtaSyncStoreForm = {
  hotelSubtype: 'prepay' | 'payAtHotel'
  subHotelId: string
  hotelName: string
}

export type OtaSyncStoreNotice = {
  title: string
  paragraphs: string[]
}

export type OtaChannelDetailView = {
  id: string
  channelName: string
  title: string
  description: string
  logoText: string
  logoTone: 1 | 2 | 3 | 4 | 5
  noticeText: string
  noticeLinkLabel?: string
  channelStoreOptions: OtaOption[]
  accountOptions: OtaOption[]
  statusOptions: OtaOption[]
  roomRows: OtaDetailRoomRow[]
  storeRows: OtaDetailStoreRow[]
  syncStoreNotice: OtaSyncStoreNotice
  syncStoreDefaults: OtaSyncStoreForm
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type OtaDashboardPayload = Omit<OtaDashboard, 'filters' | 'provider' | 'traceId' | 'request'>
type OtaLogPayload = Omit<OtaLogResult, 'filters' | 'provider' | 'traceId' | 'request'>

const stores: OtaOption[] = [
  { value: 'all', label: '全部门店' },
  { value: 'qianhai', label: '天落会宿公寓（前海壹方城宝安中心店）' },
  { value: 'baoan', label: '宝安电竞公寓' },
]

const dimensions: OtaOption[] = [
  { value: 'all', label: '全部渠道' },
  { value: 'connected', label: '已直连' },
  { value: 'pending', label: '未直连' },
]

const channelOptions: OtaOption[] = [
  { value: 'all', label: '全部渠道' },
  { value: 'ctrip', label: '携程直连' },
  { value: 'meituan-hotel', label: '美团酒店直连' },
  { value: 'fliggy', label: '飞猪酒店' },
  { value: 'tujia', label: '途家' },
]

const operationTypeOptions: OtaOption[] = [
  { value: 'all', label: '全部类型' },
  { value: 'bindRoomType', label: '关联渠道房型' },
  { value: 'unbindRoomType', label: '解除渠道房型' },
  { value: 'bindAccount', label: '渠道授权' },
]

const operationStatusOptions: OtaOption[] = [
  { value: 'all', label: '全部状态' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
]

const detailStatusOptions: OtaOption[] = [
  { value: 'all', label: '全部' },
  { value: 'linked', label: '已关联' },
  { value: 'unlinked', label: '未关联' },
]

const detailAccountOptions: OtaOption[] = [
  { value: 'all', label: '全部' },
  { value: 'main', label: '全部' },
]

const ctripSyncStoreNotice: OtaSyncStoreNotice = {
  title: '开通携程直连',
  paragraphs: [
    '1. 直连进行房型关联时，将会自动把路客云房态房价推送至携程，请注意检查房态房价',
    '2. 房型关联后佣金率将会重置为10%，如需修改，请先联系携程业务经理修改携程佣金率后再至路客云系统同步修改佣金率，否则将导致价格同步出错',
    '3. 直连后部分促销活动将会自动取消，请检查活动或重新报名',
  ],
}

const connectedChannels: OtaChannel[] = [
  createChannel('ctrip', '携程直连', 'connected'),
  createChannel('meituan-hotel', '美团酒店直连', 'connected'),
  createChannel('fliggy', '飞猪酒店', 'connected'),
  createChannel('meituan-homestay', '美团民宿', 'connected'),
  createChannel('tujia', '途家', 'connected'),
  createChannel('muniao', '木鸟', 'connected'),
  createChannel('xiaozhu', '小猪', 'connected'),
  createChannel('locals', '路客云聚合', 'connected'),
]

const pendingChannels: OtaChannel[] = [
  createChannel('ctrip-play', '携程玩乐', 'pending'),
  createChannel('booking', 'Booking', 'pending'),
  createChannel('ctrip-global', '携程国际', 'pending'),
  createChannel('airbnb', 'Airbnb', 'pending'),
  createChannel('ly-homestay', '同程民宿', 'pending'),
  createChannel('58', '58同城', 'pending'),
  createChannel('beike', '贝壳', 'pending'),
  createChannel('tencent-map', '腾讯地图', 'pending'),
]

const ctripRoomRows: OtaDetailRoomRow[] = [
  {
    id: 'ctrip-room-1',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    channelRoomType: '总裁套间（独享浴缸豪华露台台球麻将）',
    status: 'linked',
    statusLabel: '已关联',
    linkedRoomType: '总裁套间（桑拿浴缸露台电竞麻将）',
  },
  {
    id: 'ctrip-room-2',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    channelRoomType: '顶层套间（独享浴缸麻将巨幕观影电动秋千欧式大床）',
    status: 'linked',
    statusLabel: '已关联',
    linkedRoomType: '顶层套房（浴缸巨幕电竞麻将）',
  },
  {
    id: 'ctrip-room-3',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    channelRoomType: '天落大床房（电竞 4060 升降电脑）',
    status: 'linked',
    statusLabel: '已关联',
    linkedRoomType: '天落大床电竞套间',
  },
  {
    id: 'ctrip-room-4',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    channelRoomType: '观影大床房',
    status: 'linked',
    statusLabel: '已关联',
    linkedRoomType: '观影大床房',
  },
]

const ctripStoreRows: OtaDetailStoreRow[] = [
  {
    id: 'ctrip-store-1',
    accountId: 'main',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    hotelType: '预付',
    hotelId: '118891202',
    relatedRoomTypeSummary: '4/4',
    status: 'linked',
    statusLabel: '已关联',
  },
]

const meituanRoomRows: OtaDetailRoomRow[] = [
  {
    id: 'meituan-room-1',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    channelRoomType: '观影大床房',
    status: 'linked',
    statusLabel: '已关联',
    linkedRoomType: '观影大床房',
  },
  {
    id: 'meituan-room-2',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    channelRoomType: '天落大床房（电竞 4060 升降电脑）',
    status: 'linked',
    statusLabel: '已关联',
    linkedRoomType: '天落大床电竞套间',
  },
]

const meituanStoreRows: OtaDetailStoreRow[] = [
  {
    id: 'meituan-store-1',
    accountId: 'main',
    channelStoreId: 'qianhai',
    channelStoreName: '天落会宿公寓（前海壹方城宝安中心店）',
    hotelType: '预付',
    hotelId: '118891202',
    relatedRoomTypeSummary: '2/2',
    status: 'linked',
    statusLabel: '已关联',
  },
]

function createDetailView(
  base: OtaChannelDetailView,
  overrides: Partial<OtaChannelDetailView>,
): OtaChannelDetailView {
  return {
    ...base,
    ...overrides,
    channelStoreOptions: overrides.channelStoreOptions ?? structuredClone(base.channelStoreOptions),
    accountOptions: overrides.accountOptions ?? structuredClone(base.accountOptions),
    statusOptions: overrides.statusOptions ?? structuredClone(base.statusOptions),
    roomRows: overrides.roomRows ?? structuredClone(base.roomRows),
    storeRows: overrides.storeRows ?? structuredClone(base.storeRows),
    syncStoreNotice: overrides.syncStoreNotice ?? structuredClone(base.syncStoreNotice),
    syncStoreDefaults: overrides.syncStoreDefaults ?? structuredClone(base.syncStoreDefaults),
  }
}

const channelDetailMap: Record<string, OtaChannelDetailView> = {
  ctrip: {
    id: 'ctrip',
    channelName: '携程直连',
    title: '携程直连',
    description: '您已开通携程直连，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '携程',
    logoTone: 1,
    noticeText: '房型关联后佣金率将会重置为10%，如需修改，请先联系携程业务经理修改携程佣金率后再至路客云同步修改佣金率，否则将导致价格同步出错；',
    noticeLinkLabel: '去修改佣金率',
    channelStoreOptions: [
      { value: 'all', label: '全部' },
      { value: 'qianhai', label: '天落会宿公寓（前海壹方城宝安中心店）' },
    ],
    accountOptions: detailAccountOptions,
    statusOptions: detailStatusOptions,
    roomRows: ctripRoomRows,
    storeRows: ctripStoreRows,
    syncStoreNotice: ctripSyncStoreNotice,
    syncStoreDefaults: {
      hotelSubtype: 'prepay',
      subHotelId: '',
      hotelName: '',
    },
  },
  'meituan-hotel': {
    id: 'meituan-hotel',
    channelName: '美团酒店直连',
    title: '美团酒店直连',
    description: '您已开通美团酒店直连，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '美团',
    logoTone: 4,
    noticeText: '如在美团酒店直连过程中出现房态无法同步的提示，请及时联系客服处理，以避免订单库存异常；',
    channelStoreOptions: [
      { value: 'all', label: '全部' },
      { value: 'qianhai', label: '天落会宿公寓（前海壹方城宝安中心店）' },
    ],
    accountOptions: detailAccountOptions,
    statusOptions: detailStatusOptions,
    roomRows: meituanRoomRows,
    storeRows: meituanStoreRows,
    syncStoreNotice: {
      title: '开通美团酒店直连',
      paragraphs: [
        '1. 直连进行房型关联时，请确保路客云房态和价格准确',
        '2. 同步门店后请及时读取房源并核对房型映射关系',
      ],
    },
    syncStoreDefaults: {
      hotelSubtype: 'prepay',
      subHotelId: '',
      hotelName: '',
    },
  },
  fliggy: createDetailView(channelDetailMapSeed('meituan-hotel'), {
    id: 'fliggy',
    channelName: '飞猪酒店',
    title: '飞猪酒店',
    description: '您已开通飞猪酒店，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '飞猪',
    logoTone: 3,
    noticeText: '飞猪渠道调价后请及时核对售卖库存与活动价，避免渠道侧活动冲突影响同步结果；',
    syncStoreNotice: {
      title: '开通飞猪酒店',
      paragraphs: ['1. 同步门店前请确认飞猪账号授权已完成', '2. 建议先核对房型映射，再进行库存和价格同步'],
    },
  }),
  'meituan-homestay': createDetailView(channelDetailMapSeed('meituan-hotel'), {
    id: 'meituan-homestay',
    channelName: '美团民宿',
    title: '美团民宿',
    description: '您已开通美团民宿，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '美宿',
    logoTone: 4,
    noticeText: '美团民宿关联房型后，请留意民宿侧退款规则和早餐规则是否同步一致；',
  }),
  tujia: createDetailView(channelDetailMapSeed('ctrip'), {
    id: 'tujia',
    channelName: '途家',
    title: '途家',
    description: '您已开通途家，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '途家',
    logoTone: 2,
    noticeText: '途家渠道同步前请优先确认佣金率、早餐和退改规则，避免价格计算差异；',
    noticeLinkLabel: undefined,
    syncStoreNotice: {
      title: '开通途家',
      paragraphs: ['1. 房型同步前请先核对渠道门店与路客云门店关系', '2. 如涉及活动房价，请先在途家侧确认活动状态'],
    },
  }),
  muniao: createDetailView(channelDetailMapSeed('ctrip'), {
    id: 'muniao',
    channelName: '木鸟',
    title: '木鸟',
    description: '您已开通木鸟，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '木鸟',
    logoTone: 5,
    noticeText: '木鸟渠道同步后，请检查房态和最短入住限制，避免前台售卖规则不一致；',
    noticeLinkLabel: undefined,
  }),
  xiaozhu: createDetailView(channelDetailMapSeed('ctrip'), {
    id: 'xiaozhu',
    channelName: '小猪',
    title: '小猪',
    description: '您已开通小猪，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '小猪',
    logoTone: 3,
    noticeText: '小猪渠道同步时请确认民宿规则、入住须知和价格计划保持一致；',
    noticeLinkLabel: undefined,
  }),
  locals: createDetailView(channelDetailMapSeed('ctrip'), {
    id: 'locals',
    channelName: '路客云聚合',
    title: '路客云聚合',
    description: '您已开通路客云聚合，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
    logoText: '路客',
    logoTone: 1,
    noticeText: '路客云聚合渠道同步后，请优先核对聚合分发房型与本地房型映射是否完整；',
    noticeLinkLabel: undefined,
  }),
}

function channelDetailMapSeed(channelId: 'ctrip' | 'meituan-hotel'): OtaChannelDetailView {
  return channelId === 'ctrip'
    ? {
        id: 'ctrip',
        channelName: '携程直连',
        title: '携程直连',
        description: '您已开通携程直连，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
        logoText: '携程',
        logoTone: 1,
        noticeText: '房型关联后佣金率将会重置为10%，如需修改，请先联系携程业务经理修改携程佣金率后再至路客云同步修改佣金率，否则将导致价格同步出错；',
        noticeLinkLabel: '去修改佣金率',
        channelStoreOptions: [
          { value: 'all', label: '全部' },
          { value: 'qianhai', label: '天落会宿公寓（前海壹方城宝安中心店）' },
        ],
        accountOptions: detailAccountOptions,
        statusOptions: detailStatusOptions,
        roomRows: ctripRoomRows,
        storeRows: ctripStoreRows,
        syncStoreNotice: ctripSyncStoreNotice,
        syncStoreDefaults: {
          hotelSubtype: 'prepay' as const,
          subHotelId: '',
          hotelName: '',
        },
      }
    : {
        id: 'meituan-hotel',
        channelName: '美团酒店直连',
        title: '美团酒店直连',
        description: '您已开通美团酒店直连，可在下方门店管理添加渠道门店（同步门店），或进行同步房型操作。',
        logoText: '美团',
        logoTone: 4 as const,
        noticeText: '如在美团酒店直连过程中出现房态无法同步的提示，请及时联系客服处理，以避免订单库存异常；',
        channelStoreOptions: [
          { value: 'all', label: '全部' },
          { value: 'qianhai', label: '天落会宿公寓（前海壹方城宝安中心店）' },
        ],
        accountOptions: detailAccountOptions,
        statusOptions: detailStatusOptions,
        roomRows: meituanRoomRows,
        storeRows: meituanStoreRows,
        syncStoreNotice: {
          title: '开通美团酒店直连',
          paragraphs: ['1. 直连进行房型关联时，请确保路客云房态和价格准确', '2. 同步门店后请及时读取房源并核对房型映射关系'],
        },
        syncStoreDefaults: {
          hotelSubtype: 'prepay' as const,
          subHotelId: '',
          hotelName: '',
        },
      }
}

const logRows: OtaLogRow[] = [
  createLog('1', 'meituan-hotel', '美团酒店直连', 'bindRoomType', '关联渠道房型-观影大床房到 路客云房型-观影大床房', '路客云 TS5', '2025-10-03 21:49:53'),
  createLog('2', 'meituan-hotel', '美团酒店直连', 'bindRoomType', '关联渠道房型-天落大床房（电竞 4060 升降电脑）到 路客云房型-天落大床电竞套间', '路客云 TS5', '2025-10-03 21:49:50'),
  createLog('3', 'meituan-hotel', '美团酒店直连', 'bindAccount', '渠道授权-主账号已完成授权', '路客云 TS5', '2025-10-03 21:49:25'),
  createLog('4', 'ctrip', '携程直连', 'bindRoomType', '关联渠道房型-顶层套间到 路客云房型-顶层套房', '路客云 TS5', '2025-09-29 15:48:12'),
]

export function createDefaultOtaFilters(searchParams = new URLSearchParams()): OtaFilters {
  return {
    businessDate: searchParams.get('date') || '2026-05-18',
    storeId: searchParams.get('storeId') || 'all',
    dimension: toDimension(searchParams.get('dimension')),
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export function createDefaultOtaLogFilters(searchParams = new URLSearchParams()): OtaLogFilters {
  return {
    channelId: searchParams.get('channelId') || 'all',
    keyword: searchParams.get('keyword') || '',
    operator: searchParams.get('operator') || '',
    operationType: searchParams.get('operationType') || 'all',
    operationStatus: searchParams.get('operationStatus') || 'all',
    page: Number(searchParams.get('page') || 1),
    pageSize: Number(searchParams.get('pageSize') || 6),
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export function createDefaultOtaDetailFilters(): OtaDetailFilters {
  return {
    channelStoreId: 'all',
    accountId: 'all',
    status: 'all',
    keyword: '',
  }
}

export async function fetchOtaDashboard(
  filters = createDefaultOtaFilters(),
  providerName = getOtaProviderName(),
): Promise<OtaDashboard> {
  validateDate(filters.businessDate, '业务日期格式不正确')
  if (providerName === 'api') throw new Error('OTA 数据加载失败，请稍后重试')
  const envelope = await fetchMockOtaDashboard(filters)
  return adaptDashboardEnvelope(envelope, filters, providerName)
}

export async function fetchOtaOperationLogs(
  filters: OtaLogFilters,
  providerName = getOtaProviderName(),
): Promise<OtaLogResult> {
  validatePagination(filters.page, filters.pageSize)
  if (providerName === 'api') throw new Error('OTA 操作日志加载失败，请稍后重试')
  const envelope = await fetchMockOtaOperationLogs(filters)
  return adaptLogEnvelope(envelope, filters, providerName)
}

export async function fetchOtaChannelDetail(
  channelId: string,
  providerName = getOtaProviderName(),
): Promise<OtaChannelDetailView> {
  if (providerName === 'api') throw new Error('OTA 渠道详情加载失败，请稍后重试')
  await delay(100)
  return structuredClone(channelDetailMap[channelId] ?? channelDetailMap.ctrip)
}

function getOtaProviderName(): OtaProviderName {
  if (typeof window === 'undefined') return 'mock'
  return window.localStorage.getItem(OTA_PROVIDER_KEY) === 'api' ? 'api' : 'mock'
}

async function fetchMockOtaDashboard(filters: OtaFilters): Promise<UnifiedEnvelope<OtaDashboardPayload>> {
  await delay(100)
  if (filters.mockState === 'error') {
    return {
      code: 50001,
      message: 'OTA 数据加载失败，请稍后重试',
      data: createEmptyDashboardPayload(),
      traceId: 'mock-ota-dashboard-error-001',
      timestamp: fixedTimestamp,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: filters.mockState === 'empty' ? createEmptyDashboardPayload() : createDashboardPayload(filters),
    traceId: `mock-ota-dashboard-${filters.mockState}-001`,
    timestamp: fixedTimestamp,
  }
}

async function fetchMockOtaOperationLogs(filters: OtaLogFilters): Promise<UnifiedEnvelope<OtaLogPayload>> {
  await delay(100)
  if (filters.mockState === 'error') {
    return {
      code: 50001,
      message: 'OTA 操作日志加载失败，请稍后重试',
      data: createEmptyLogPayload(filters),
      traceId: 'mock-ota-operation-logs-error-001',
      timestamp: fixedTimestamp,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: filters.mockState === 'empty' ? createEmptyLogPayload(filters) : createLogPayload(filters),
    traceId: `mock-ota-operation-logs-${filters.mockState}-001`,
    timestamp: fixedTimestamp,
  }
}

function adaptDashboardEnvelope(
  envelope: UnifiedEnvelope<OtaDashboardPayload>,
  filters: OtaFilters,
  provider: OtaProviderName,
): OtaDashboard {
  if (envelope.code !== 0) throw new Error(envelope.message || 'OTA 数据加载失败，请稍后重试')
  return {
    ...envelope.data,
    filters,
    provider,
    traceId: envelope.traceId,
    request: {
      businessDate: filters.businessDate,
      storeId: filters.storeId,
      dimension: filters.dimension,
    },
  }
}

function adaptLogEnvelope(
  envelope: UnifiedEnvelope<OtaLogPayload>,
  filters: OtaLogFilters,
  provider: OtaProviderName,
): OtaLogResult {
  if (envelope.code !== 0) throw new Error(envelope.message || 'OTA 操作日志加载失败，请稍后重试')
  return {
    ...envelope.data,
    filters,
    provider,
    traceId: envelope.traceId,
    request: {
      channelId: filters.channelId,
      keyword: filters.keyword,
      operator: filters.operator,
      operationType: filters.operationType,
      operationStatus: filters.operationStatus,
      page: filters.page,
      pageSize: filters.pageSize,
    },
  }
}

function createDashboardPayload(filters: OtaFilters): OtaDashboardPayload {
  const connected = filters.dimension === 'pending' ? [] : connectedChannels.map((channel) => applyStoreRelation(channel, filters.storeId))
  const pending = filters.dimension === 'connected' ? [] : pendingChannels

  return {
    stores,
    dimensions,
    metrics: [
      { key: 'connected', label: '已直连', value: String(connected.length), detail: '可同步房型、价格、库存' },
      { key: 'pending', label: '未直连', value: String(pending.length), detail: '可发起授权或渠道申请' },
      { key: 'roomTypes', label: '关联房型', value: '32/32', detail: '目标站当前渠道房型均已映射' },
      { key: 'sync', label: '最近同步', value: '09:40', detail: '库存、房价、订单状态已完成同步' },
    ],
    connectedChannels: connected,
    pendingChannels: pending,
    reminders: [],
    quickLinks: [],
    updatedAt: fixedTimestamp,
  }
}

function createEmptyDashboardPayload(): OtaDashboardPayload {
  return {
    stores,
    dimensions,
    metrics: [
      { key: 'connected', label: '已直连', value: '0', detail: '当前条件暂无渠道' },
      { key: 'pending', label: '未直连', value: '0', detail: '当前条件暂无待关联渠道' },
      { key: 'roomTypes', label: '关联房型', value: '0/0', detail: '暂无房型映射' },
      { key: 'sync', label: '最近同步', value: '-', detail: '暂无同步记录' },
    ],
    connectedChannels: [],
    pendingChannels: [],
    reminders: [],
    quickLinks: [],
    updatedAt: fixedTimestamp,
  }
}

function createLogPayload(filters: OtaLogFilters): OtaLogPayload {
  const filtered = logRows.filter((row) => {
    const channelMatches = filters.channelId === 'all' || row.channelId === filters.channelId
    const keywordMatches = !filters.keyword || row.content.includes(filters.keyword) || row.channel.includes(filters.keyword)
    const operatorMatches = !filters.operator || row.operator.includes(filters.operator)
    const typeMatches = filters.operationType === 'all' || row.operationType === filters.operationType
    const statusMatches =
      filters.operationStatus === 'all' ||
      (filters.operationStatus === 'success' && row.status === '成功') ||
      (filters.operationStatus === 'failed' && row.status === '失败')
    return channelMatches && keywordMatches && operatorMatches && typeMatches && statusMatches
  })

  const start = (filters.page - 1) * filters.pageSize

  return {
    channelOptions,
    operationTypeOptions,
    operationStatusOptions,
    rows: filtered.slice(start, start + filters.pageSize),
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: filtered.length,
    },
  }
}

function createEmptyLogPayload(filters: OtaLogFilters): OtaLogPayload {
  return {
    channelOptions,
    operationTypeOptions,
    operationStatusOptions,
    rows: [],
    pagination: {
      page: filters.page,
      pageSize: filters.pageSize,
      total: 0,
    },
  }
}

function createChannel(id: string, name: string, status: OtaChannel['status']): OtaChannel {
  const isConnected = status === 'connected'
  const mapped = isConnected ? 4 : 0

  return {
    id,
    name,
    relation: isConnected ? `关联房型 ${mapped}/4` : '等待授权',
    status,
    roomTypeCount: 4,
    mappedRoomTypeCount: mapped,
    lastSyncAt: isConnected ? '2026-05-18 09:40' : '-',
    logoText: name.length > 4 ? name.slice(0, 2) : name,
    detail: isConnected ? `${name} 已完成房型、价格、库存同步` : `${name} 可发起渠道授权申请`,
    authorizationNotice: createAuthorizationNotice(id, name, status),
  }
}

function createAuthorizationNotice(id: string, name: string, status: OtaChannel['status']): OtaChannelAuthorizationNotice {
  if (id === 'ctrip') {
    return {
      title: '开始携程直连',
      summary: '完成携程账号或门店授权后，即可开始直连，',
      highlight: '请确保路客云房态准确后再操作直连，否则可能会导致超卖。',
      summarySuffix: ' 直连前，请先阅读并同意《携程直连须知》。',
      noticeTitle: '携程直连须知',
      noticeSections: [
        {
          heading: '一、携程直连功能',
          paragraphs: ['开启后可在路客云中统一维护携程渠道房型、库存、价格与订单。'],
        },
      ],
      cancelLabel: '取消',
      confirmLabel: '同意并开始授权',
      badgeText: '携程',
      badgeTone: 'ctrip',
    }
  }

  if (id === 'meituan-hotel') {
    return {
      title: '开始美团酒店直连',
      summary: '完成美团酒店账号或门店授权后，即可开始直连，',
      highlight: '请确保路客云房态准确后再操作直连，否则可能会导致超卖。',
      summarySuffix: ' 直连前，请先阅读并同意《美团酒店直连须知》。',
      noticeTitle: '美团酒店直连须知',
      noticeSections: [
        {
          heading: '一、美团酒店直连功能',
          paragraphs: ['开启后可在路客云中统一维护美团酒店渠道房型、库存、价格与订单。'],
        },
      ],
      cancelLabel: '取消',
      confirmLabel: '同意并开始授权',
      countdownSeconds: 3,
      badgeText: '美团',
      badgeTone: 'meituan',
    }
  }

  return {
    title: status === 'connected' ? `开始${name}授权` : `关联${name}`,
    summary: '完成渠道账号或门店授权后，即可开始后续同步操作，',
    summarySuffix: ' 如继续操作，代表您已阅读并同意渠道授权须知。',
    noticeTitle: `${name}授权须知`,
    noticeSections: [{ heading: '一、授权说明', paragraphs: ['授权完成后，渠道房型、库存和价格将进入统一维护流程。'] }],
    cancelLabel: '取消',
    confirmLabel: status === 'connected' ? '同意并开始授权' : '确认关联',
    badgeText: name.slice(0, 2),
    badgeTone: 'default',
  }
}

function createLog(
  id: string,
  channelId: string,
  channel: string,
  operationType: string,
  content: string,
  operator: string,
  time: string,
): OtaLogRow {
  return {
    id,
    channelId,
    channel,
    type: operationTypeOptions.find((item) => item.value === operationType)?.label ?? operationType,
    operationType,
    content,
    status: '成功',
    operator,
    time,
  }
}

function applyStoreRelation(channel: OtaChannel, storeId: string): OtaChannel {
  if (storeId !== 'qianhai' || channel.id !== 'locals') return channel
  return {
    ...channel,
    relation: '关联房型 3/4',
    mappedRoomTypeCount: 3,
    detail: '路客云聚合在当前门店还有 1 个房型待复核',
  }
}

function toMockState(value: string | null): OtaMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

function toDimension(value: string | null): OtaFilters['dimension'] {
  return value === 'connected' || value === 'pending' ? value : 'all'
}

function validateDate(value: string, message: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(message)
}

function validatePagination(page: number, pageSize: number) {
  if (!Number.isFinite(page) || page < 1 || !Number.isFinite(pageSize) || pageSize < 1) {
    throw new Error('分页参数不正确')
  }
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
