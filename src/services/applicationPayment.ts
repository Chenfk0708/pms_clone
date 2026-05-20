const APPLICATION_PAYMENT_PROVIDER_KEY = 'pms.applicationPaymentProvider'

export const APPLICATION_PAYMENT_RESOURCE_PATH = '/edition/resource/get'
export const APPLICATION_PAYMENT_TYPES_PATH = '/paymentTypes/get'
export const APPLICATION_PAYMENT_STORE_PATH = '/select/poi/page/get'
export const APPLICATION_PAYMENT_ROOM_CATEGORY_PATH = '/roomCategories/page/get'
export const APPLICATION_PAYMENT_WAYS_PATH = '/paymentWays/get'
export const APPLICATION_PAYMENT_TYPES_V2_PATH = '/paymentTypes/get/v2'
export const APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH = '/weiRoomCategories/page/get'
export const APPLICATION_PAYMENT_ROOMS_PATH = '/rooms/get'

const realBaseUrl = 'https://hudson-prod.localhome.cn'
const defaultCampId = '1796067693589061634'
const detailBuyCampId = '64'
const defaultExpiryDate = '2027-09-28'

export type ApplicationPaymentProviderName = 'mock' | 'api'
export type ApplicationPaymentMockState = 'success' | 'empty' | 'error'
export type ApplicationPaymentCategory = 'all' | 'channel' | 'feature'
export type ApplicationPaymentProductId =
  | 'ctrip-direct'
  | 'meituan-hotel-direct'
  | 'fliggy-direct'
  | 'douyin-direct'
  | 'xiaohongshu-direct'
  | 'brand-mini-program'
  | 'video-account-direct'
  | 'booking-direct'
  | 'meituan-homestay-direct'
  | 'tujia-direct'
  | 'muniao-direct'
  | 'xiaozhu-direct'
  | 'smart-pricing'
  | 'scrm'
  | 'global-radar'
  | 'smart-clean'
  | 'price-board'
  | 'distribution'
  | 'online-payment'
  | 'police-direct'

export type ApplicationPaymentFilters = {
  category: ApplicationPaymentCategory
  mockState: ApplicationPaymentMockState
  campId: string
}

export type ApplicationPaymentDetailRequest = {
  productId: ApplicationPaymentProductId
  mockState: ApplicationPaymentMockState
  campId: string
}

export type ApplicationPaymentCardAction =
  | {
      type: 'use'
      label: '去使用'
      routeTarget: string
      feedback: string
    }
  | {
      type: 'subscribe'
      label: '订阅开通'
      detailSearch?: string
      detailState?: { product: string }
    }
  | {
      type: 'disabled'
      label: '敬请期待'
      feedback: string
    }

export type ApplicationPaymentCard = {
  id: ApplicationPaymentProductId
  name: string
  description: string
  tag: string
  category: Exclude<ApplicationPaymentCategory, 'all'>
  priceLabel: string
  originalPriceLabel?: string
  badge?: string
  iconText: string
  iconTone: string
  action: ApplicationPaymentCardAction
}

export type ApplicationPaymentSection = {
  id: string
  title: string
  cards: ApplicationPaymentCard[]
}

export type ApplicationPaymentDashboard = {
  provider: ApplicationPaymentProviderName
  filters: ApplicationPaymentFilters
  sections: ApplicationPaymentSection[]
  requestedAt: string
  feedback: string
  audit: string[]
}

export type ApplicationPaymentDetailView = {
  provider: ApplicationPaymentProviderName
  request: ApplicationPaymentDetailRequest
  product: {
    id: ApplicationPaymentProductId
    name: string
    description: string
    detailTitle: string
    detailLines: string[]
    iconText: string
    iconTone: string
  }
  purchaseInfo: {
    priceLabel: string
    originalPriceLabel?: string
    durationLabel: string
    durationMeta: string
    orderAmountLabel: string
  }
  feedback: string
  requestedAt: string
  agreementLabel: string
  audit: string[]
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HudsonEnvelope<T> = {
  success?: boolean
  errorCode?: string | null
  errorMsg?: string | null
  errorDetail?: string | null
  data?: T | null
}

type ApplicationPaymentCatalogPayload = {
  sections: ApplicationPaymentSection[]
}

type ApplicationPaymentDetailPayload = {
  detail: ApplicationPaymentDetailView
}

type ApplicationPaymentDetailDefinition = {
  id: ApplicationPaymentProductId
  name: string
  description: string
  detailLines: string[]
  iconText: string
  iconTone: string
  priceLabel: string
  originalPriceLabel?: string
  durationLabel: string
  durationMeta: string
  orderAmountLabel: string
}

const catalogCards: ApplicationPaymentCard[] = [
  {
    id: 'ctrip-direct',
    name: '携程直连',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1599/年',
    description: '开通携程直连，实现房态、房价、订单统一管理。',
    tag: '酒店渠道',
    category: 'channel',
    iconText: '携',
    iconTone: 'ctrip',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/order/house-order/list',
      feedback: '已进入订单工作台，请继续处理渠道订单。',
    },
  },
  {
    id: 'meituan-hotel-direct',
    name: '美团酒店直连',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1599/年',
    description: '开通美团酒店直连，实现房态、房价、订单统一管理。',
    tag: '酒店渠道',
    category: 'channel',
    iconText: '美',
    iconTone: 'meituan',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/order/house-order/list',
      feedback: '已进入订单工作台，请继续处理渠道订单。',
    },
  },
  {
    id: 'fliggy-direct',
    name: '飞猪直连',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1599/年',
    description: '开通飞猪直连，实现房态、房价、订单统一管理。',
    tag: '酒店渠道',
    category: 'channel',
    iconText: '飞',
    iconTone: 'fliggy',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/order/house-order/list',
      feedback: '已进入订单工作台，请继续处理渠道订单。',
    },
  },
  {
    id: 'douyin-direct',
    name: '抖音直连',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1899/年',
    description: '开通抖音直连，实现房态、房价、订单统一管理。',
    tag: '社媒渠道',
    badge: '限时体验中',
    category: 'channel',
    iconText: '抖',
    iconTone: 'douyin',
    action: {
      type: 'subscribe',
      label: '订阅开通',
      detailSearch: '?app=douyin',
    },
  },
  {
    id: 'xiaohongshu-direct',
    name: '小红书',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1899/年',
    description: '开通小红书直连，持续承接内容种草与预订转化。',
    tag: '社媒渠道',
    category: 'channel',
    iconText: '红',
    iconTone: 'redbook',
    action: {
      type: 'subscribe',
      label: '订阅开通',
    },
  },
  {
    id: 'brand-mini-program',
    name: '品牌小程序',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1899/年',
    description: '自有品牌小程序一键上架，高效管理私域订单。',
    tag: '私域渠道',
    category: 'channel',
    iconText: '小',
    iconTone: 'miniapp',
    action: {
      type: 'subscribe',
      label: '订阅开通',
    },
  },
  {
    id: 'video-account-direct',
    name: '视频号直连',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1899/年',
    description: '直连视频号上架酒店套餐，高效转化私域流量。',
    tag: '社媒渠道',
    category: 'channel',
    iconText: '视',
    iconTone: 'video',
    action: {
      type: 'subscribe',
      label: '订阅开通',
    },
  },
  {
    id: 'booking-direct',
    name: 'Booking',
    priceLabel: '¥1399/年',
    originalPriceLabel: '¥1899/年',
    description: '开通 Booking 直连，统一处理国际渠道房态与订单。',
    tag: '国际渠道',
    badge: '限时体验中',
    category: 'channel',
    iconText: 'B.',
    iconTone: 'booking',
    action: {
      type: 'subscribe',
      label: '订阅开通',
    },
  },
  {
    id: 'meituan-homestay-direct',
    name: '美团民宿直连',
    priceLabel: '免费',
    description: '开通美团民宿直连，实现房态、房价、订单统一管理。',
    tag: '民宿渠道',
    category: 'channel',
    iconText: '民',
    iconTone: 'meituan',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/order/house-order/list',
      feedback: '已进入订单工作台，请继续处理渠道订单。',
    },
  },
  {
    id: 'tujia-direct',
    name: '途家直连',
    priceLabel: '免费',
    description: '开通途家直连，实现房态、房价、订单统一管理。',
    tag: '民宿渠道',
    category: 'channel',
    iconText: '途',
    iconTone: 'tujia',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/order/house-order/list',
      feedback: '已进入订单工作台，请继续处理渠道订单。',
    },
  },
  {
    id: 'muniao-direct',
    name: '木鸟直连',
    priceLabel: '免费',
    description: '开通木鸟直连，实现房态、房价、订单统一管理。',
    tag: '民宿渠道',
    category: 'channel',
    iconText: '木',
    iconTone: 'muniao',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/order/house-order/list',
      feedback: '已进入订单工作台，请继续处理渠道订单。',
    },
  },
  {
    id: 'xiaozhu-direct',
    name: '小猪直连',
    priceLabel: '免费',
    description: '开通小猪直连，实现房态、房价、订单统一管理。',
    tag: '民宿渠道',
    category: 'channel',
    iconText: '猪',
    iconTone: 'xiaozhu',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/order/house-order/list',
      feedback: '已进入订单工作台，请继续处理渠道订单。',
    },
  },
  {
    id: 'smart-pricing',
    name: '智能调价',
    priceLabel: '¥1099/年',
    originalPriceLabel: '¥1899/年',
    description: '按竞争圈房价与入住率变化，提供调价建议并同步执行。',
    tag: '功能订阅',
    category: 'feature',
    iconText: '价',
    iconTone: 'price',
    action: {
      type: 'subscribe',
      label: '订阅开通',
      detailSearch: '?app=smartPricing',
    },
  },
  {
    id: 'scrm',
    name: '企微SCRM',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1499/年',
    description: '用企业微信完成住前、住中、住后的全流程客户沟通与转化。',
    tag: '功能订阅',
    category: 'feature',
    iconText: '企',
    iconTone: 'scrm',
    action: {
      type: 'subscribe',
      label: '订阅开通',
      detailState: { product: 'scrm' },
    },
  },
  {
    id: 'global-radar',
    name: '全域雷达',
    priceLabel: '¥1399/年',
    originalPriceLabel: '¥2399/年',
    description: '打通多渠道经营数据，一屏追踪预警、风险和经营结果。',
    tag: '功能订阅',
    category: 'feature',
    iconText: '雷',
    iconTone: 'radar',
    action: {
      type: 'subscribe',
      label: '订阅开通',
      detailSearch: '?app=globalRadar',
    },
  },
  {
    id: 'smart-clean',
    name: '智能保洁',
    priceLabel: '¥899/年',
    originalPriceLabel: '¥1599/年',
    description: '支持自动或手动创建保洁任务，统一管理保洁过程与统计。',
    tag: '功能订阅',
    category: 'feature',
    iconText: '洁',
    iconTone: 'clean',
    action: {
      type: 'subscribe',
      label: '订阅开通',
    },
  },
  {
    id: 'price-board',
    name: '电子房价牌',
    priceLabel: '¥499/年',
    originalPriceLabel: '¥899/年',
    description: '前台大屏实时展示房价，并联动路客云统一调价。',
    tag: '功能订阅',
    category: 'feature',
    iconText: '牌',
    iconTone: 'board',
    action: {
      type: 'subscribe',
      label: '订阅开通',
    },
  },
  {
    id: 'distribution',
    name: '聚合分销',
    priceLabel: '¥599/年',
    originalPriceLabel: '¥999/年',
    description: '聚合分销渠道，统一上房、调价与结果回流。',
    tag: '功能订阅',
    badge: '限时免费',
    category: 'feature',
    iconText: '销',
    iconTone: 'distribution',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/statistics/report',
      feedback: '已进入统计总览，请继续处理分销经营数据。',
    },
  },
  {
    id: 'online-payment',
    name: '线上付款',
    priceLabel: '¥499/年',
    originalPriceLabel: '¥899/年',
    description: '支持扫码支付、流水核对和退款处理，统一查看支付结果。',
    tag: '功能订阅',
    category: 'feature',
    iconText: '付',
    iconTone: 'pay',
    action: {
      type: 'use',
      label: '去使用',
      routeTarget: '/statistics/orderLedger',
      feedback: '已进入收支明细，请继续查看支付流水。',
    },
  },
  {
    id: 'police-direct',
    name: '旅业系统直连',
    priceLabel: '¥999/年',
    originalPriceLabel: '¥1665/年',
    description: '身份证登记直传公安系统，统一处理入住、退房与续住同步。',
    tag: '功能订阅',
    category: 'feature',
    iconText: '旅',
    iconTone: 'police',
    action: {
      type: 'disabled',
      label: '敬请期待',
      feedback: '旅业系统直连暂未开放购买，请联系业务经理确认开通计划。',
    },
  },
]

const detailDefinitions: Record<ApplicationPaymentProductId, ApplicationPaymentDetailDefinition> = {
  'ctrip-direct': {
    id: 'ctrip-direct',
    name: '携程直连',
    description: '开通携程直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持携程房态同步', '支持订单自动入库', '支持价格与库存统一维护'],
    iconText: '携',
    iconTone: 'ctrip',
    priceLabel: '¥899',
    originalPriceLabel: '¥1599/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥899',
  },
  'meituan-hotel-direct': {
    id: 'meituan-hotel-direct',
    name: '美团酒店直连',
    description: '开通美团酒店直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持美团酒店房态同步', '支持订单自动入库', '支持房价与库存统一维护'],
    iconText: '美',
    iconTone: 'meituan',
    priceLabel: '¥899',
    originalPriceLabel: '¥1599/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥899',
  },
  'fliggy-direct': {
    id: 'fliggy-direct',
    name: '飞猪直连',
    description: '开通飞猪直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持飞猪房态同步', '支持订单自动入库', '支持价格库存统一维护'],
    iconText: '飞',
    iconTone: 'fliggy',
    priceLabel: '¥899',
    originalPriceLabel: '¥1599/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥899',
  },
  'douyin-direct': {
    id: 'douyin-direct',
    name: '抖音直连',
    description: '开通抖音直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持抖音来客预售', '支持抖音来客日历房', '支持抖音来客特价酒店'],
    iconText: '抖',
    iconTone: 'douyin',
    priceLabel: '¥36,678.6',
    originalPriceLabel: '¥36,678.6/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥36,678.6',
  },
  'xiaohongshu-direct': {
    id: 'xiaohongshu-direct',
    name: '小红书',
    description: '开通小红书直连，持续承接内容种草与预订转化。',
    detailLines: ['支持内容种草承接', '支持预订转化链路', '支持营销活动配置'],
    iconText: '红',
    iconTone: 'redbook',
    priceLabel: '¥899',
    originalPriceLabel: '¥1899/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥899',
  },
  'brand-mini-program': {
    id: 'brand-mini-program',
    name: '品牌小程序',
    description: '自有品牌小程序一键上架，高效管理私域订单。',
    detailLines: ['支持自有小程序上架', '支持私域会员承接', '支持订单统一管理'],
    iconText: '小',
    iconTone: 'miniapp',
    priceLabel: '¥899',
    originalPriceLabel: '¥1899/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥899',
  },
  'video-account-direct': {
    id: 'video-account-direct',
    name: '视频号直连',
    description: '直连视频号上架酒店套餐，高效转化私域流量。',
    detailLines: ['支持视频号上架套餐', '支持私域转化追踪', '支持活动效果复盘'],
    iconText: '视',
    iconTone: 'video',
    priceLabel: '¥899',
    originalPriceLabel: '¥1899/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥899',
  },
  'booking-direct': {
    id: 'booking-direct',
    name: 'Booking',
    description: '开通 Booking 直连，统一处理国际渠道房态与订单。',
    detailLines: ['支持国际渠道房态同步', '支持订单统一处理', '支持库存联动维护'],
    iconText: 'B.',
    iconTone: 'booking',
    priceLabel: '¥1399',
    originalPriceLabel: '¥1899/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥1399',
  },
  'meituan-homestay-direct': {
    id: 'meituan-homestay-direct',
    name: '美团民宿直连',
    description: '开通美团民宿直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持民宿订单统一处理', '支持房态库存联动', '支持客诉处理追踪'],
    iconText: '民',
    iconTone: 'meituan',
    priceLabel: '免费',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '免费',
  },
  'tujia-direct': {
    id: 'tujia-direct',
    name: '途家直连',
    description: '开通途家直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持途家订单统一处理', '支持房态价格同步', '支持渠道活动承接'],
    iconText: '途',
    iconTone: 'tujia',
    priceLabel: '免费',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '免费',
  },
  'muniao-direct': {
    id: 'muniao-direct',
    name: '木鸟直连',
    description: '开通木鸟直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持木鸟订单统一处理', '支持房态联动同步', '支持价格策略配置'],
    iconText: '木',
    iconTone: 'muniao',
    priceLabel: '免费',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '免费',
  },
  'xiaozhu-direct': {
    id: 'xiaozhu-direct',
    name: '小猪直连',
    description: '开通小猪直连，实现房态、房价、订单统一管理。',
    detailLines: ['支持小猪订单统一处理', '支持库存联动维护', '支持价格同步管理'],
    iconText: '猪',
    iconTone: 'xiaozhu',
    priceLabel: '免费',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '免费',
  },
  'smart-pricing': {
    id: 'smart-pricing',
    name: '智能调价',
    description: '按竞争圈房价与入住率变化，提供调价建议并同步执行。',
    detailLines: ['支持竞争圈比价', '支持中央价格策略联动', '支持入住率提醒与执行建议'],
    iconText: '价',
    iconTone: 'price',
    priceLabel: '¥1,503',
    originalPriceLabel: '¥2,605.2/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥1,503',
  },
  scrm: {
    id: 'scrm',
    name: '企微SCRM',
    description: '用企业微信完成住前、住中、住后的全流程客户沟通与转化。',
    detailLines: ['支持企业微信会话承接', '支持客户标签沉淀', '支持自动化客户转化链路'],
    iconText: '企',
    iconTone: 'scrm',
    priceLabel: '¥150.6',
    originalPriceLabel: '¥75,300/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥150.6',
  },
  'global-radar': {
    id: 'global-radar',
    name: '全域雷达',
    description: '打通多渠道经营数据，一屏追踪预警、风险和经营结果。',
    detailLines: ['支持经营数据聚合', '支持 AI 预警与风险监控', '支持全域经营决策看板'],
    iconText: '雷',
    iconTone: 'radar',
    priceLabel: '¥1,927.68',
    originalPriceLabel: '¥3,303.16/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥1,927.68',
  },
  'smart-clean': {
    id: 'smart-clean',
    name: '智能保洁',
    description: '支持自动或手动创建保洁任务，统一管理保洁过程与统计。',
    detailLines: ['支持自动派单', '支持保洁任务追踪', '支持保洁统计复盘'],
    iconText: '洁',
    iconTone: 'clean',
    priceLabel: '¥1,232.46',
    originalPriceLabel: '¥2,194.38/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥1,232.46',
  },
  'price-board': {
    id: 'price-board',
    name: '电子房价牌',
    description: '前台大屏实时展示房价，并联动路客云统一调价。',
    detailLines: ['支持实时展示房价', '支持门市价与会员价切换', '支持前台大屏统一展示'],
    iconText: '牌',
    iconTone: 'board',
    priceLabel: '¥499',
    originalPriceLabel: '¥899/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥499',
  },
  distribution: {
    id: 'distribution',
    name: '聚合分销',
    description: '聚合分销渠道，统一上房、调价与结果回流。',
    detailLines: ['支持多分销渠道联动', '支持统一上房与调价', '支持结果回流复盘'],
    iconText: '销',
    iconTone: 'distribution',
    priceLabel: '¥599',
    originalPriceLabel: '¥999/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥599',
  },
  'online-payment': {
    id: 'online-payment',
    name: '线上付款',
    description: '支持扫码支付、流水核对和退款处理，统一查看支付结果。',
    detailLines: ['支持外接扫码设备', '支持流水实时核对', '支持退款处理与结果追踪'],
    iconText: '付',
    iconTone: 'pay',
    priceLabel: '¥499',
    originalPriceLabel: '¥899/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥499',
  },
  'police-direct': {
    id: 'police-direct',
    name: '旅业系统直连',
    description: '身份证登记直传公安系统，统一处理入住、退房与续住同步。',
    detailLines: ['支持住客登记同步', '支持续住与退房联动', '支持公安侧数据核验'],
    iconText: '旅',
    iconTone: 'police',
    priceLabel: '¥999',
    originalPriceLabel: '¥1665/年',
    durationLabel: '跟随版本',
    durationMeta: `跟随版本${defaultExpiryDate}到期`,
    orderAmountLabel: '¥999',
  },
}

export function createDefaultApplicationPaymentFilters(
  searchParams = new URLSearchParams(),
): ApplicationPaymentFilters {
  return {
    category: toCategory(searchParams.get('applicationPaymentCategory')),
    mockState: toMockState(searchParams.get('applicationPaymentMockState')),
    campId: searchParams.get('campId')?.trim() || defaultCampId,
  }
}

export function createDefaultApplicationPaymentDetailRequest(
  searchParams = new URLSearchParams(),
  routeState?: { product?: string } | null,
): ApplicationPaymentDetailRequest {
  return {
    productId: resolveDetailProductId(searchParams, routeState),
    mockState: toMockState(searchParams.get('applicationPaymentDetailMockState')),
    campId: searchParams.get('campId')?.trim() || defaultCampId,
  }
}

export function buildApplicationPaymentRequest(filters: ApplicationPaymentFilters) {
  return {
    campId: filters.campId,
    category: filters.category,
    mockState: filters.mockState,
  }
}

export function getApplicationPaymentProviderName(): ApplicationPaymentProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(APPLICATION_PAYMENT_PROVIDER_KEY)?.trim()
  return configured === 'api' ? 'api' : 'mock'
}

export async function fetchApplicationPaymentDashboard(
  filters: ApplicationPaymentFilters,
  providerName = getApplicationPaymentProviderName(),
  signal?: AbortSignal,
): Promise<ApplicationPaymentDashboard> {
  validateCatalogFilters(filters)

  if (providerName === 'api') {
    return fetchApiApplicationPaymentDashboard(filters, signal)
  }

  const envelope = await fetchMockApplicationPaymentDashboard(filters, signal)
  return adaptApplicationPaymentDashboard(envelope, filters, providerName)
}

export async function fetchApplicationPaymentDetail(
  request: ApplicationPaymentDetailRequest,
  providerName = getApplicationPaymentProviderName(),
  signal?: AbortSignal,
): Promise<ApplicationPaymentDetailView> {
  validateDetailRequest(request)

  if (providerName === 'api') {
    return fetchApiApplicationPaymentDetail(request, signal)
  }

  const envelope = await fetchMockApplicationPaymentDetail(request, signal)
  return adaptApplicationPaymentDetail(envelope, request, providerName)
}

function buildSections(category: ApplicationPaymentCategory) {
  const cards = category === 'all' ? catalogCards : catalogCards.filter((card) => card.category === category)
  const channelCards = cards.filter((card) => card.category === 'channel')
  const featureCards = cards.filter((card) => card.category === 'feature')

  return [
    ...(channelCards.length > 0 ? [{ id: 'channel', title: '渠道直连', cards: channelCards }] : []),
    ...(featureCards.length > 0 ? [{ id: 'feature', title: '功能订阅', cards: featureCards }] : []),
  ]
}

async function fetchMockApplicationPaymentDashboard(
  filters: ApplicationPaymentFilters,
  signal?: AbortSignal,
): Promise<UnifiedEnvelope<ApplicationPaymentCatalogPayload>> {
  await delay(180, signal)

  if (filters.mockState === 'error') {
    return {
      code: 50324,
      message: '应用订阅数据加载失败，请稍后重试',
      data: { sections: [] },
      traceId: 'mock-application-payment-catalog-error-001',
      timestamp: '2026-05-20T10:20:00+08:00',
    }
  }

  if (filters.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: { sections: [] },
      traceId: 'mock-application-payment-catalog-empty-001',
      timestamp: '2026-05-20T10:20:00+08:00',
    }
  }

  return {
    code: 0,
    message: 'success',
    data: { sections: buildSections(filters.category) },
    traceId: 'mock-application-payment-catalog-success-001',
    timestamp: '2026-05-20T10:20:00+08:00',
  }
}

function adaptApplicationPaymentDashboard(
  envelope: UnifiedEnvelope<ApplicationPaymentCatalogPayload>,
  filters: ApplicationPaymentFilters,
  provider: ApplicationPaymentProviderName,
): ApplicationPaymentDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '应用订阅数据加载失败，请稍后重试')
  }

  const sections = envelope.data.sections
  const totalCards = sections.reduce((sum, section) => sum + section.cards.length, 0)

  return {
    provider,
    filters,
    sections,
    requestedAt: envelope.timestamp,
    feedback: totalCards === 0 ? '暂无可展示的应用订阅商品' : '应用订阅目录已更新',
    audit: [
      `category:${filters.category}`,
      `campId:${filters.campId}`,
      `resourcePath:${APPLICATION_PAYMENT_RESOURCE_PATH}`,
      `paymentTypePath:${APPLICATION_PAYMENT_TYPES_PATH}`,
      `storePath:${APPLICATION_PAYMENT_STORE_PATH}`,
      `roomCategoryPath:${APPLICATION_PAYMENT_ROOM_CATEGORY_PATH}`,
      `paymentWaysPath:${APPLICATION_PAYMENT_WAYS_PATH}`,
      `sectionCount:${sections.length}`,
      `cardCount:${totalCards}`,
      `traceId:${envelope.traceId}`,
    ],
  }
}

async function fetchApiApplicationPaymentDashboard(
  filters: ApplicationPaymentFilters,
  signal?: AbortSignal,
): Promise<ApplicationPaymentDashboard> {
  const [resource, paymentTypes, stores, roomCategories, paymentWays] = await Promise.all([
    postHudson<Record<string, unknown>>(APPLICATION_PAYMENT_RESOURCE_PATH, { campId: filters.campId }, signal),
    postHudson<Record<string, unknown>>(APPLICATION_PAYMENT_TYPES_PATH, { campId: filters.campId }, signal),
    postHudson<Record<string, unknown>>(
      APPLICATION_PAYMENT_STORE_PATH,
      { campId: filters.campId, pageSize: 999, pageNum: 1, channelId: 0, isAvailability: '1' },
      signal,
    ),
    postHudson<Record<string, unknown>>(
      APPLICATION_PAYMENT_ROOM_CATEGORY_PATH,
      {
        campId: filters.campId,
        pageSize: 999,
        pageNum: 1,
        roomCategoryName: '',
        keyword: '',
        cityIds: [],
        channelId: '',
      },
      signal,
    ),
    postHudson<Record<string, unknown>>(APPLICATION_PAYMENT_WAYS_PATH, { campId: filters.campId }, signal),
  ])

  const sections = buildSections(filters.category)
  const totalCards = sections.reduce((sum, section) => sum + section.cards.length, 0)

  return {
    provider: 'api',
    filters,
    sections,
    requestedAt: new Date().toISOString(),
    feedback: totalCards === 0 ? '暂无可展示的应用订阅商品' : '应用订阅目录已更新',
    audit: [
      `category:${filters.category}`,
      `campId:${filters.campId}`,
      `resourcePath:${APPLICATION_PAYMENT_RESOURCE_PATH}`,
      `paymentTypePath:${APPLICATION_PAYMENT_TYPES_PATH}`,
      `storePath:${APPLICATION_PAYMENT_STORE_PATH}`,
      `roomCategoryPath:${APPLICATION_PAYMENT_ROOM_CATEGORY_PATH}`,
      `paymentWaysPath:${APPLICATION_PAYMENT_WAYS_PATH}`,
      `resourceKeys:${Object.keys(resource).length}`,
      `paymentTypeKeys:${Object.keys(paymentTypes).length}`,
      `storeCount:${asArray(stores.list).length}`,
      `roomCategoryCount:${asArray(roomCategories.list).length}`,
      `paymentWayCount:${asArray(paymentWays.paymentWays).length}`,
      `cardCount:${totalCards}`,
    ],
  }
}

async function fetchMockApplicationPaymentDetail(
  request: ApplicationPaymentDetailRequest,
  signal?: AbortSignal,
): Promise<UnifiedEnvelope<ApplicationPaymentDetailPayload>> {
  await delay(160, signal)

  if (request.mockState === 'error') {
    return {
      code: 50325,
      message: '应用订阅详情加载失败，请稍后重试',
      data: { detail: createDetailView(detailDefinitions[request.productId], request, 'mock') },
      traceId: 'mock-application-payment-detail-error-001',
      timestamp: '2026-05-20T10:20:00+08:00',
    }
  }

  return {
    code: 0,
    message: 'success',
    data: {
      detail: createDetailView(detailDefinitions[request.productId], request, 'mock'),
    },
    traceId: `mock-application-payment-detail-${request.productId}-001`,
    timestamp: '2026-05-20T10:20:00+08:00',
  }
}

function adaptApplicationPaymentDetail(
  envelope: UnifiedEnvelope<ApplicationPaymentDetailPayload>,
  request: ApplicationPaymentDetailRequest,
  provider: ApplicationPaymentProviderName,
): ApplicationPaymentDetailView {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '应用订阅详情加载失败，请稍后重试')
  }

  const detail = envelope.data.detail

  return {
    ...detail,
    provider,
    request,
    requestedAt: envelope.timestamp,
    audit: [
      `productId:${request.productId}`,
      `campId:${request.campId}`,
      `paymentTypesV2Path:${APPLICATION_PAYMENT_TYPES_V2_PATH}`,
      `weiRoomCategoryPath:${APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH}`,
      `roomsPath:${APPLICATION_PAYMENT_ROOMS_PATH}`,
      `traceId:${envelope.traceId}`,
    ],
  }
}

async function fetchApiApplicationPaymentDetail(
  request: ApplicationPaymentDetailRequest,
  signal?: AbortSignal,
): Promise<ApplicationPaymentDetailView> {
  const [paymentGroups, weiRoomCategories, rooms] = await Promise.all([
    postHudson<Record<string, unknown>>(
      APPLICATION_PAYMENT_TYPES_V2_PATH,
      { campId: request.campId, bizTypes: [3], isEnable: 1 },
      signal,
    ),
    postHudson<Record<string, unknown>>(
      APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH,
      {
        campId: detailBuyCampId,
        buyCampId: request.campId,
        roomCategoryTypes: [1],
        goodsTypes: [7],
      },
      signal,
    ),
    postHudson<Record<string, unknown>>(
      APPLICATION_PAYMENT_ROOMS_PATH,
      {
        campId: request.campId,
        roomCategoryIds: ['1796425099729092609', '1796425099485822977', '1796425099242553345', '1796425098965729282'],
        saleType: 1,
      },
      signal,
    ),
  ])

  const view = createDetailView(detailDefinitions[request.productId], request, 'api')

  return {
    ...view,
    requestedAt: new Date().toISOString(),
    audit: [
      `productId:${request.productId}`,
      `campId:${request.campId}`,
      `paymentTypesV2Path:${APPLICATION_PAYMENT_TYPES_V2_PATH}`,
      `weiRoomCategoryPath:${APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH}`,
      `roomsPath:${APPLICATION_PAYMENT_ROOMS_PATH}`,
      `paymentGroupCount:${asArray(paymentGroups.paymentGroups).length}`,
      `weiRoomCategoryCount:${asArray(weiRoomCategories.list).length}`,
      `roomCategoryGroupCount:${asArray(rooms.roomCategoryRooms).length}`,
    ],
  }
}

function createDetailView(
  definition: ApplicationPaymentDetailDefinition,
  request: ApplicationPaymentDetailRequest,
  provider: ApplicationPaymentProviderName,
): ApplicationPaymentDetailView {
  return {
    provider,
    request,
    product: {
      id: definition.id,
      name: definition.name,
      description: definition.description,
      detailTitle: '商品详情',
      detailLines: definition.detailLines,
      iconText: definition.iconText,
      iconTone: definition.iconTone,
    },
    purchaseInfo: {
      priceLabel: definition.priceLabel,
      originalPriceLabel: definition.originalPriceLabel,
      durationLabel: definition.durationLabel,
      durationMeta: definition.durationMeta,
      orderAmountLabel: definition.orderAmountLabel,
    },
    feedback: '商品购买信息已更新',
    requestedAt: '2026-05-20T10:20:00+08:00',
    agreementLabel: '我已阅读并同意《路客云产品服务购买协议》',
    audit: [],
  }
}

function resolveDetailProductId(
  searchParams: URLSearchParams,
  routeState?: { product?: string } | null,
): ApplicationPaymentProductId {
  const app = searchParams.get('app')

  if (app === 'smartPricing') return 'smart-pricing'
  if (app === 'globalRadar') return 'global-radar'
  if (app === 'douyin') return 'douyin-direct'
  if (routeState?.product === 'scrm') return 'scrm'

  return 'smart-clean'
}

function validateCatalogFilters(filters: ApplicationPaymentFilters) {
  if (!filters.campId.trim()) {
    throw new Error('应用订阅 campId 不能为空')
  }
}

function validateDetailRequest(request: ApplicationPaymentDetailRequest) {
  if (!detailDefinitions[request.productId]) {
    throw new Error('应用订阅详情商品标识无效')
  }
}

function toCategory(value: string | null): ApplicationPaymentCategory {
  if (value === 'channel' || value === 'feature') return value
  return 'all'
}

function toMockState(value: string | null): ApplicationPaymentMockState {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

async function postHudson<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${realBaseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: HudsonEnvelope<T> | null
  try {
    payload = (await response.json()) as HudsonEnvelope<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg || payload?.errorDetail || payload?.errorCode || `${path} 请求失败，HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${path} 响应缺少 data 字段`)
  }

  return payload.data
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(), ms)

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
