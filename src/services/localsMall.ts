const LOCALS_MALL_PROVIDER_KEY = 'pms.localsMall.provider'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_BUY_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-19T11:28:54+08:00'

export type LocalsMallProviderName = 'mock' | 'api'
export type LocalsMallMockState = 'success' | 'empty' | 'error'
export type LocalsMallPageMode = 'mall' | 'detail'
export type LocalsMallProductSectionId = 'system' | 'hardware'

export type LocalsMallQuery = {
  campId: string
  buyCampId: string
  page: LocalsMallPageMode
  mockState: LocalsMallMockState
  productId: string
}

export type LocalsMallProduct = {
  id: string
  sectionId: LocalsMallProductSectionId
  name: string
  description: string
  image: string
  priceLabel: string
  tag: string
}

export type LocalsMallProductSection = {
  id: LocalsMallProductSectionId
  title: string
  products: LocalsMallProduct[]
}

export type LocalsMallOverview = {
  provider: LocalsMallProviderName
  traceId: string
  requestedAt: string
  requestedAtLabel: string
  sections: LocalsMallProductSection[]
  quickEntries: Array<{ id: string; label: string; path: string; description: string }>
  emptyState?: {
    title: string
    description: string
    actionLabel: string
    actionPath: string
  }
}

export type LocalsMallRoomGroup = {
  roomCategoryId: string
  roomCategoryName: string
  rooms: string[]
}

export type LocalsMallPaymentGroup = {
  groupType: number
  groupTypeName: string
  paymentTypes: string[]
}

export type LocalsMallDetail = {
  provider: LocalsMallProviderName
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
  roomSummary: string
  paymentSummary: string
  roomCategoryIds: string[]
}

export type LocalsMallContract = {
  provider: LocalsMallProviderName
  state: LocalsMallMockState | 'loading'
  traceId: string
  overviewRequest: {
    method: 'POST'
    path: '/weiRoomCategories/page/get'
    body: {
      campId: string
      buyCampId: string
      roomCategoryTypes: number[]
      goodsTypes: number[]
    }
  }
  commodityRequest: {
    method: 'POST'
    path: '/youzan/commodity/get'
    body: Record<string, never>
  }
  roomsRequest: {
    method: 'POST'
    path: '/rooms/get'
    body: {
      campId: string
      roomCategoryIds: string[]
      saleType: 1
    }
  }
  paymentRequest: {
    method: 'POST'
    path: '/paymentTypes/get/v2'
    body: {
      campId: string
      bizTypes: number[]
      isEnable: 1
    }
  }
  paymentWayRequest: {
    method: 'POST'
    path: '/paymentWays/get'
    body: {
      campId: string
    }
  }
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type LocalsMallOverviewPayload = Omit<LocalsMallOverview, 'provider' | 'traceId'>
type LocalsMallDetailPayload = Omit<LocalsMallDetail, 'provider' | 'traceId'>

const defaultProductId = 'door-card-system'
const defaultRoomCategoryIds = [
  '1796425099729092609',
  '1796425099485822977',
  '1796425099242553345',
  '1796425098965729282',
]

const mallProducts: LocalsMallProduct[] = [
  {
    id: 'door-card-system',
    sectionId: 'system',
    name: '门卡管理系统',
    description: '支持门卡制卡、发卡和房卡管理，目标站已取证一年期购买入口。',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0017687596945558.png',
    priceLabel: '¥ 800',
    tag: '系统功能',
  },
  {
    id: 'cpe-p5',
    sectionId: 'hardware',
    name: '蜂助手CPE路由器P5(5G门店版)',
    description: '适合高并发门店联网部署，当前按商城统一购买链路承接。',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/Frlt8ag-VDbNxOh89eJ1VdLMUa89.png',
    priceLabel: '¥ 1,643',
    tag: '智能硬件',
  },
  {
    id: 'cpe-s1',
    sectionId: 'hardware',
    name: '蜂助手CPE路由器S1(4G版)',
    description: '适合轻量门店联网与备用链路场景。',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/Fj94TEpC_LcsFp5VvAjmtvNZxsEu.jpg',
    priceLabel: '¥ 896',
    tag: '智能硬件',
  },
  {
    id: 'box-s2',
    sectionId: 'hardware',
    name: '蜂助手4G盒子S2(极光TV版)',
    description: '客房多媒体与轻部署场景的统一采买入口。',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/FrJO5s4hR7Rv7WZizAXeUrsVDW6j.jpg',
    priceLabel: '¥ 1,195',
    tag: '智能硬件',
  },
  {
    id: 'uifi-u1',
    sectionId: 'hardware',
    name: '蜂助手随身WiFi U1',
    description: '适用于移动补盲和短期门店布点。',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/FoqI8nd05yB3budBt9VZt9BI8NGw.png',
    priceLabel: '¥ 341',
    tag: '智能硬件',
  },
  {
    id: 'smart-lock',
    sectionId: 'hardware',
    name: '指定款【智能密码锁/门锁】',
    description: '适合智慧酒店门锁改造，与既有智能门锁页面联动。',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/zdkms.webp',
    priceLabel: '¥ 998',
    tag: '智能硬件',
  },
  {
    id: 'd12-lock',
    sectionId: 'hardware',
    name: '无人入住智能门锁智能入住 D12',
    description: '适合无人入住场景的硬件采购入口。',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/wrrzms.webp',
    priceLabel: '¥ 299',
    tag: '智能硬件',
  },
]

const quickEntries = [
  {
    id: 'smart-lock',
    label: '智能门锁',
    path: '/smartHotel/smartHardware/smartLook',
    description: '继续配置门锁品牌与门店接入信息。',
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
    description: '进入智慧酒店全局配置与策略设置。',
  },
]

const roomGroups: LocalsMallRoomGroup[] = [
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
    rooms: ['房间1'],
  },
  {
    roomCategoryId: '1796425098965729282',
    roomCategoryName: '观影大床房',
    rooms: ['房间1'],
  },
]

const paymentGroups: LocalsMallPaymentGroup[] = [
  {
    groupType: 1,
    groupTypeName: '住宿',
    paymentTypes: ['加床', '加人', '损坏赔偿', '其他收入', '退房费'],
  },
]

export function createDefaultLocalsMallQuery(
  searchParams = new URLSearchParams(),
  page: LocalsMallPageMode = 'mall',
): LocalsMallQuery {
  return {
    campId: searchParams.get('campId') || DEFAULT_CAMP_ID,
    buyCampId: searchParams.get('buyCampId') || DEFAULT_BUY_CAMP_ID,
    page,
    mockState: toMockState(searchParams.get('mockState')),
    productId: searchParams.get('productId') || defaultProductId,
  }
}

export function getLocalsMallContract(
  query: LocalsMallQuery,
  provider: LocalsMallProviderName,
  state: LocalsMallMockState | 'loading',
  traceId = '',
): LocalsMallContract {
  return {
    provider,
    state,
    traceId,
    overviewRequest: {
      method: 'POST',
      path: '/weiRoomCategories/page/get',
      body: {
        campId: '64',
        buyCampId: query.buyCampId,
        roomCategoryTypes: [1],
        goodsTypes: [6],
      },
    },
    commodityRequest: {
      method: 'POST',
      path: '/youzan/commodity/get',
      body: {},
    },
    roomsRequest: {
      method: 'POST',
      path: '/rooms/get',
      body: {
        campId: query.campId,
        roomCategoryIds: defaultRoomCategoryIds,
        saleType: 1,
      },
    },
    paymentRequest: {
      method: 'POST',
      path: '/paymentTypes/get/v2',
      body: {
        campId: query.campId,
        bizTypes: [2],
        isEnable: 1,
      },
    },
    paymentWayRequest: {
      method: 'POST',
      path: '/paymentWays/get',
      body: {
        campId: query.campId,
      },
    },
  }
}

export async function fetchLocalsMallOverview(
  query: LocalsMallQuery,
  signal?: AbortSignal,
  providerName = getLocalsMallProviderName(),
): Promise<LocalsMallOverview> {
  validateQuery(query)
  if (providerName === 'api') {
    throw new Error('路客商城数据加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  return adaptOverviewEnvelope(buildOverviewEnvelope(query), providerName)
}

export async function fetchLocalsMallDetail(
  query: LocalsMallQuery,
  signal?: AbortSignal,
  providerName = getLocalsMallProviderName(),
): Promise<LocalsMallDetail> {
  validateQuery(query)
  if (providerName === 'api') {
    throw new Error('路客商城详情加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  return adaptDetailEnvelope(buildDetailEnvelope(query), providerName)
}

export async function fetchLocalsMallApplicableRooms(
  query: LocalsMallQuery,
  signal?: AbortSignal,
  providerName = getLocalsMallProviderName(),
): Promise<LocalsMallRoomGroup[]> {
  validateQuery(query)
  if (providerName === 'api') {
    throw new Error('适用房型加载失败，请稍后重试')
  }

  await waitForMockLatency(signal)
  if (query.mockState === 'error') {
    throw new Error('适用房型加载失败，请稍后重试')
  }

  return roomGroups
}

export async function fetchLocalsMallPaymentGroups(
  query: LocalsMallQuery,
  signal?: AbortSignal,
  providerName = getLocalsMallProviderName(),
): Promise<LocalsMallPaymentGroup[]> {
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

function getLocalsMallProviderName(): LocalsMallProviderName {
  if (typeof window === 'undefined') return 'mock'
  return window.localStorage.getItem(LOCALS_MALL_PROVIDER_KEY) === 'api' ? 'api' : 'mock'
}

function buildOverviewEnvelope(query: LocalsMallQuery): UnifiedEnvelope<LocalsMallOverviewPayload> {
  if (query.mockState === 'error') {
    return {
      code: 50301,
      message: '路客商城数据加载失败，请稍后重试',
      data: createEmptyOverviewPayload(),
      traceId: 'mock-yingyong-dingyue--quanyi-yu-dingyue--luke-shangcheng-overview-error-001',
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
          title: '当前门店暂无可采购的商品',
          description: '可先完成智慧酒店基础设置，再回到路客商城统一发起采购。',
          actionLabel: '前往全局设置',
          actionPath: '/smartHotel/checkInGuide',
        },
      },
      traceId: 'mock-yingyong-dingyue--quanyi-yu-dingyue--luke-shangcheng-overview-empty-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  return {
    code: 0,
    message: 'success',
    data: {
      requestedAt: DEFAULT_TIMESTAMP,
      requestedAtLabel: '最近同步：2026-05-19 11:28',
      sections: [
        {
          id: 'system',
          title: '系统功能',
          products: mallProducts.filter((product) => product.sectionId === 'system'),
        },
        {
          id: 'hardware',
          title: '智能硬件',
          products: mallProducts.filter((product) => product.sectionId === 'hardware'),
        },
      ],
      quickEntries,
    },
    traceId: 'mock-yingyong-dingyue--quanyi-yu-dingyue--luke-shangcheng-overview-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function buildDetailEnvelope(query: LocalsMallQuery): UnifiedEnvelope<LocalsMallDetailPayload> {
  if (query.mockState === 'error') {
    return {
      code: 50302,
      message: '路客商城详情加载失败，请稍后重试',
      data: createEmptyDetailPayload(),
      traceId: 'mock-yingyong-dingyue--quanyi-yu-dingyue--luke-shangcheng-detail-error-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }

  const product = mallProducts.find((item) => item.id === query.productId) ?? mallProducts[0]
  return {
    code: 0,
    message: 'success',
    data: {
      requestedAt: DEFAULT_TIMESTAMP,
      requestedAtLabel: '最近同步：2026-05-19 11:28',
      productId: product.id,
      productName: product.name,
      productDescription: '已按目标站取证补齐购买、适用房型和支付方式闭环。',
      purchaseTermLabel: '一年',
      buyerName: '路客云6TS5',
      totalAmountLabel: '¥ 800',
      agreementLabel: '我已经阅读并同意《路客云产品服务购买协议》',
      purchaseNotice: '提交后会创建采购申请，并同步到智慧酒店后续配置流程。',
      routeAfterSubmit: '/smartHotel/smartHardware/smartLook',
      roomSummary: '4 个适用房型 / 4 间房',
      paymentSummary: '住宿分组 / 5 个支付项',
      roomCategoryIds: defaultRoomCategoryIds,
    },
    traceId: 'mock-yingyong-dingyue--quanyi-yu-dingyue--luke-shangcheng-detail-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}

function createEmptyOverviewPayload(): LocalsMallOverviewPayload {
  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: '最近同步：2026-05-19 11:28',
    sections: [
      { id: 'system', title: '系统功能', products: [] },
      { id: 'hardware', title: '智能硬件', products: [] },
    ],
    quickEntries,
  }
}

function createEmptyDetailPayload(): LocalsMallDetailPayload {
  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: '最近同步：2026-05-19 11:28',
    productId: defaultProductId,
    productName: '门卡管理系统',
    productDescription: '',
    purchaseTermLabel: '一年',
    buyerName: '路客云6TS5',
    totalAmountLabel: '¥ 800',
    agreementLabel: '我已经阅读并同意《路客云产品服务购买协议》',
    purchaseNotice: '',
    routeAfterSubmit: '/smartHotel/smartHardware/smartLook',
    roomSummary: '0 个适用房型',
    paymentSummary: '0 个支付项',
    roomCategoryIds: [],
  }
}

function adaptOverviewEnvelope(
  envelope: UnifiedEnvelope<LocalsMallOverviewPayload>,
  provider: LocalsMallProviderName,
): LocalsMallOverview {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '路客商城数据加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.sections) || !Array.isArray(data.quickEntries)) {
    throw new Error('路客商城数据加载失败，请稍后重试')
  }

  return {
    ...data,
    provider,
    traceId: envelope.traceId,
  }
}

function adaptDetailEnvelope(
  envelope: UnifiedEnvelope<LocalsMallDetailPayload>,
  provider: LocalsMallProviderName,
): LocalsMallDetail {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '路客商城详情加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !data.productId || !Array.isArray(data.roomCategoryIds)) {
    throw new Error('路客商城详情加载失败，请稍后重试')
  }

  return {
    ...data,
    provider,
    traceId: envelope.traceId,
  }
}

function validateQuery(query: LocalsMallQuery) {
  if (!query.campId.trim()) {
    throw new Error('路客商城门店参数不正确')
  }
}

function toMockState(value: string | null): LocalsMallMockState {
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
