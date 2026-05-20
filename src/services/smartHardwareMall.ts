const SMART_HARDWARE_MALL_PROVIDER_KEY = 'pms.smartHardwareMallProvider'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-19T16:03:00+08:00'

export type SmartHardwareMallProviderName = 'mock' | 'api'
export type SmartHardwareMallMockState = 'success' | 'empty' | 'error'
export type SmartHardwareMallPageMode = 'mall' | 'detail'

export type SmartHardwareMallQuery = {
  campId: string
  page: SmartHardwareMallPageMode
  mockState: SmartHardwareMallMockState
  productId: string
}

export type SmartHardwareProductAction = 'buy' | 'contact'
export type SmartHardwareProductSource = 'internal' | 'external'

export type SmartHardwareProduct = {
  id: string
  name: string
  description: string
  image: string
  priceLabel: string
  action: SmartHardwareProductAction
  source: SmartHardwareProductSource
  tag: string
  supportRoute?: string
}

export type SmartHardwareMallOverview = {
  provider: SmartHardwareMallProviderName
  traceId: string
  requestedAt: string
  requestedAtLabel: string
  heroTitle: string
  heroDescription: string
  products: SmartHardwareProduct[]
  quickEntries: Array<{ id: string; label: string; path: string; description: string }>
  emptyState?: {
    title: string
    description: string
    actionLabel: string
    actionPath: string
  }
}

export type SmartHardwareRoomGroup = {
  roomCategoryId: string
  roomCategoryName: string
  rooms: string[]
}

export type SmartHardwarePaymentGroup = {
  groupType: number
  groupTypeName: string
  paymentTypes: string[]
}

export type SmartHardwareMallDetail = {
  provider: SmartHardwareMallProviderName
  traceId: string
  requestedAt: string
  requestedAtLabel: string
  productId: string
  productName: string
  productDescription: string
  purchaseTermLabel: string
  buyerName: string
  totalAmountLabel: string
  agreementLabel: string
  purchaseNotice: string
  routeAfterSubmit: string
  roomCategoryIds: string[]
  roomSummary: string
  paymentSummary: string
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type SmartHardwareMallOverviewPayload = Omit<SmartHardwareMallOverview, 'provider' | 'traceId'>
type SmartHardwareMallDetailPayload = Omit<SmartHardwareMallDetail, 'provider' | 'traceId'>

const assetBase = '/assets/smart-hardware-mall'
const defaultProductId = 'door-card-system'

const overviewProducts: SmartHardwareProduct[] = [
  {
    id: 'door-card-system',
    name: '门卡管理系统',
    description: '对接门卡制卡与房卡管理，一次配置即可进入购买详情与支付申请流程。',
    image: `${assetBase}/door-card-system.png`,
    priceLabel: '¥800',
    action: 'buy',
    source: 'internal',
    tag: '官方硬件',
    supportRoute: '/smartHotel/smartHardware/mall/detail',
  },
  {
    id: 'cpe-p5',
    name: '蜂助手CPE路由器P5(5G门店版)',
    description: '适用于高并发门店联网场景，支持现场部署咨询。',
    image: `${assetBase}/cpe-p5.png`,
    priceLabel: '¥1643',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'cpe-s1',
    name: '蜂助手CPE路由器S1(4G版)',
    description: '适合轻量网络覆盖与门店备用链路。',
    image: `${assetBase}/cpe-s1.jpg`,
    priceLabel: '¥896',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'box-s2',
    name: '蜂助手4G盒子S2(极光TV版)',
    description: '客房多媒体场景快速接入，支持套餐咨询。',
    image: `${assetBase}/box-s2.jpg`,
    priceLabel: '¥1195',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'uifi-u1',
    name: '蜂助手随身UiFi U1',
    description: '适合临时部署与移动覆盖补盲。',
    image: `${assetBase}/uifi-u1.png`,
    priceLabel: '¥341',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'smart-lock',
    name: '指定款【智能密码锁/门锁】',
    description: '联动智能门锁页面，可按门店场景创建咨询任务。',
    image: `${assetBase}/smart-lock.webp`,
    priceLabel: '¥998',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'd12-lock',
    name: '无人入住智能门锁智能入住 D12',
    description: '支持自助入住场景，适合智慧酒店标准化升级。',
    image: `${assetBase}/d12-lock.webp`,
    priceLabel: '¥299',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
]

const quickEntries = [
  {
    id: 'smart-lock',
    label: '智能门锁',
    path: '/smartHotel/smartHardware/smartLook',
    description: '继续配置门锁品牌与对接账号。',
  },
  {
    id: 'self-checkin',
    label: '自助入住',
    path: '/smartHotel/smartHome',
    description: '查看自助入住与门锁联动方案。',
  },
  {
    id: 'global-setting',
    label: '全局设置',
    path: '/smartHotel/checkInGuide',
    description: '进入智慧酒店全局配置与策略规则。',
  },
]

const applicableRoomGroups: SmartHardwareRoomGroup[] = [
  {
    roomCategoryId: '1796425099729092609',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    rooms: ['房间1'],
  },
  {
    roomCategoryId: '1796425099485822977',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    rooms: ['房间1'],
  },
  {
    roomCategoryId: '1796425099242553345',
    roomCategoryName: '天落大床电竞套间',
    rooms: ['1'],
  },
  {
    roomCategoryId: '1796425098965729282',
    roomCategoryName: '观影大床房',
    rooms: ['房间1'],
  },
]

const paymentGroups: SmartHardwarePaymentGroup[] = [
  {
    groupType: 1,
    groupTypeName: '住宿',
    paymentTypes: ['加床', '加人', '损坏赔偿', '其他收入', '退房费'],
  },
]

export function createDefaultSmartHardwareMallQuery(
  searchParams = new URLSearchParams(),
  page: SmartHardwareMallPageMode = 'mall',
): SmartHardwareMallQuery {
  return {
    campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
    page,
    mockState: toMockState(searchParams.get('mockState')),
    productId: searchParams.get('productId') || defaultProductId,
  }
}

export async function fetchSmartHardwareMallOverview(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwareMallOverview> {
  validateQuery(query)
  if (providerName === 'api') {
    throw new Error('智能硬件商城数据加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  return adaptOverviewEnvelope(buildOverviewEnvelope(query), providerName)
}

export async function fetchSmartHardwareMallDetail(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwareMallDetail> {
  validateQuery(query)
  if (providerName === 'api') {
    throw new Error('智能硬件商城详情加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  return adaptDetailEnvelope(buildDetailEnvelope(query), providerName)
}

export async function fetchSmartHardwareApplicableRooms(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwareRoomGroup[]> {
  validateQuery(query)
  if (providerName === 'api') {
    throw new Error('适用房型加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  if (query.mockState === 'error') {
    throw new Error('适用房型加载失败，请稍后重试')
  }

  return applicableRoomGroups
}

export async function fetchSmartHardwarePaymentGroups(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwarePaymentGroup[]> {
  validateQuery(query)
  if (providerName === 'api') {
    throw new Error('支付方式加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  if (query.mockState === 'error') {
    throw new Error('支付方式加载失败，请稍后重试')
  }

  return paymentGroups
}

function getSmartHardwareMallProviderName(): SmartHardwareMallProviderName {
  if (typeof window === 'undefined') return 'mock'
  return window.localStorage.getItem(SMART_HARDWARE_MALL_PROVIDER_KEY) === 'api' ? 'api' : 'mock'
}

function buildOverviewEnvelope(
  query: SmartHardwareMallQuery,
): UnifiedEnvelope<SmartHardwareMallOverviewPayload> {
  if (query.mockState === 'error') {
    return {
      code: 50301,
      message: '智能硬件商城数据加载失败，请稍后重试',
      data: createEmptyOverviewPayload(),
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-overview-error-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  if (query.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        ...createEmptyOverviewPayload(),
        emptyState: {
          title: '当前门店暂无可采购的智能硬件商品',
          description: '请先完成智慧酒店基础设置或联系专家开通适配商品，再回到商城统一采购。',
          actionLabel: '前往全局设置',
          actionPath: '/smartHotel/checkInGuide',
        },
      },
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-overview-empty-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: {
      requestedAt: DEFAULT_TIMESTAMP,
      requestedAtLabel: '最近同步：2026-05-19 16:03',
      heroTitle: '智慧酒店一站式部署',
      heroDescription: '助力酒店高效运营',
      products: overviewProducts,
      quickEntries,
    },
    traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-overview-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function buildDetailEnvelope(
  query: SmartHardwareMallQuery,
): UnifiedEnvelope<SmartHardwareMallDetailPayload> {
  if (query.mockState === 'error') {
    return {
      code: 50302,
      message: '智能硬件商城详情加载失败，请稍后重试',
      data: createEmptyDetailPayload(),
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-detail-error-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  const product = overviewProducts.find((item) => item.id === query.productId) ?? overviewProducts[0]
  return {
    code: 0,
    message: 'success',
    data: {
      requestedAt: DEFAULT_TIMESTAMP,
      requestedAtLabel: '最近同步：2026-05-19 16:03',
      productId: product.id,
      productName: product.name,
      productDescription: '已按真实取证契约同步适用房型与支付方式，可直接发起购买申请。',
      purchaseTermLabel: '一年',
      buyerName: '路客云6TS5',
      totalAmountLabel: '¥800',
      agreementLabel: '我已经阅读同意《路客云产品服务购买协议》',
      purchaseNotice: '提交后会创建智慧酒店硬件采购任务，并同步给门店专家跟进。',
      routeAfterSubmit: '/smartHotel/smartHardware/smartLook',
      roomCategoryIds: applicableRoomGroups.map((group) => group.roomCategoryId),
      roomSummary: '4 个适用房型 / 4 间房',
      paymentSummary: '住宿分组 / 5 个支付项',
    },
    traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-detail-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function createEmptyOverviewPayload(): SmartHardwareMallOverviewPayload {
  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: '最近同步：2026-05-19 16:03',
    heroTitle: '智慧酒店一站式部署',
    heroDescription: '助力酒店高效运营',
    products: [],
    quickEntries,
  }
}

function createEmptyDetailPayload(): SmartHardwareMallDetailPayload {
  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: '最近同步：2026-05-19 16:03',
    productId: defaultProductId,
    productName: '门卡管理系统',
    productDescription: '',
    purchaseTermLabel: '一年',
    buyerName: '路客云6TS5',
    totalAmountLabel: '¥800',
    agreementLabel: '我已经阅读同意《路客云产品服务购买协议》',
    purchaseNotice: '',
    routeAfterSubmit: '/smartHotel/smartHardware/smartLook',
    roomCategoryIds: [],
    roomSummary: '0 个适用房型',
    paymentSummary: '0 个支付项',
  }
}

function adaptOverviewEnvelope(
  envelope: UnifiedEnvelope<SmartHardwareMallOverviewPayload>,
  provider: SmartHardwareMallProviderName,
): SmartHardwareMallOverview {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '智能硬件商城数据加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.quickEntries)) {
    throw new Error('智能硬件商城数据加载失败，请稍后重试')
  }

  return {
    ...data,
    provider,
    traceId: envelope.traceId,
  }
}

function adaptDetailEnvelope(
  envelope: UnifiedEnvelope<SmartHardwareMallDetailPayload>,
  provider: SmartHardwareMallProviderName,
): SmartHardwareMallDetail {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '智能硬件商城详情加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !data.productId || !Array.isArray(data.roomCategoryIds)) {
    throw new Error('智能硬件商城详情加载失败，请稍后重试')
  }

  return {
    ...data,
    provider,
    traceId: envelope.traceId,
  }
}

function validateQuery(query: SmartHardwareMallQuery) {
  if (!query.campId.trim()) {
    throw new Error('智能硬件商城门店参数不正确')
  }
}

function toMockState(value: string | null): SmartHardwareMallMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 180)
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
