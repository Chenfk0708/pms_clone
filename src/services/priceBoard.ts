const HUDSON_BASE_URL = '/api'
const PRICE_BOARD_PRODUCT_CAMP_ID = '64'
const PRICE_BOARD_MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'
const PRICE_BOARD_MOCK_SOURCE_LABEL = 'POST /houseManage/priceBoard/overview'

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorCode?: string | null
}

type CampsResponse = {
  camps?: Array<{ campId?: string; name?: string }>
}

type WeiRoomCategoriesResponse = {
  total?: number
  list?: PriceBoardRawProduct[]
}

type PaymentTypesResponse = {
  paymentGroups?: Array<{
    groupTypeName?: string
    paymentTypes?: Array<{ paymentTypeName?: string; isEnable?: number }>
  }>
}

type PriceBoardRawProduct = {
  channelRoomCategoryName?: string
  description?: string
  lowestSellingPrice?: number
  lowestOriginalPrice?: number
  roomCategoryProductGetViews?: Array<{
    roomCategoryProductId?: string
    roomCategoryProductName?: string
    sellingPrice?: number
    originalPrice?: number
    stock?: number
  }>
}

type PriceBoardProviderName = 'mock' | 'real'
type PriceBoardMockMode = 'success' | 'empty' | 'error'

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type PriceBoardOverviewPayload = {
  camp: { campId: string; campName: string }
  product: PriceBoardRawProduct | null
  totalProductCount: number
  paymentTypeNames: string[]
  requestSummary: string[]
}

export type PriceBoardDurationOption = {
  id: string
  label: string
  price: number
  originalPrice: number
  stock: number | null
}

export type PriceBoardData = {
  provider: PriceBoardProviderName
  responseState: 'success' | 'empty'
  sourceLabel: string
  traceId: string
  timestamp: string
  campId: string
  campName: string
  productName: string
  description: string
  totalProductCount: number
  durationOptions: PriceBoardDurationOption[]
  paymentTypeNames: string[]
  requestSummary: string[]
  requestedAt: string
}

export async function loadPriceBoardData(signal?: AbortSignal): Promise<PriceBoardData> {
  if (resolvePriceBoardProviderName() === 'mock') {
    return loadMockPriceBoardData()
  }

  const campInfo = readCampInfo(await postHudson<CampsResponse>('/camps/get', {}, signal))
  const campId = campInfo.campId

  const [editionResources, productPage, paymentTypes] = await Promise.all([
    postHudson<unknown>('/edition/resource/get', { campId }, signal),
    postHudson<WeiRoomCategoriesResponse>(
      '/weiRoomCategories/page/get',
      {
        campId: PRICE_BOARD_PRODUCT_CAMP_ID,
        buyCampId: campId,
        roomCategoryTypes: [1],
        goodsTypes: [7],
      },
      signal,
    ),
    postHudson<PaymentTypesResponse>('/paymentTypes/get/v2', { campId, bizTypes: [3], isEnable: 1 }, signal),
  ])

  const product = findPriceBoardProduct(productPage)
  const durationOptions = normalizeDurationOptions(product)
  if (durationOptions.length === 0) {
    throw new Error('/weiRoomCategories/page/get 未返回电子房价牌可购买时长')
  }

  return {
    provider: 'real',
    responseState: 'success',
    sourceLabel: '/weiRoomCategories/page/get',
    traceId: `real-price-board-${campId}`,
    timestamp: new Date().toISOString(),
    campId,
    campName: campInfo.campName,
    productName: product.channelRoomCategoryName || '电子房价牌',
    description: product.description || '电子房价牌接口未返回商品描述',
    totalProductCount: Number(productPage.total ?? productPage.list?.length ?? 0),
    durationOptions,
    paymentTypeNames: normalizePaymentTypes(paymentTypes),
    requestSummary: [
      'POST /camps/get',
      'POST /edition/resource/get',
      'POST /weiRoomCategories/page/get',
      'POST /paymentTypes/get/v2',
      `edition fields: ${Object.keys(asRecord(editionResources)).slice(0, 4).join(', ') || 'empty'}`,
    ],
    requestedAt: new Date().toISOString(),
  }
}

function loadMockPriceBoardData(): PriceBoardData {
  const mode = resolvePriceBoardMockMode()
  const envelope: ApiEnvelope<PriceBoardOverviewPayload | null> =
    mode === 'error'
      ? mockPriceBoardErrorEnvelope()
      : mode === 'empty'
        ? mockPriceBoardEmptyEnvelope()
        : mockPriceBoardSuccessEnvelope()

  if (envelope.code !== 0) {
    throw new Error(`数据加载失败，请稍后重试（traceId: ${envelope.traceId}）`)
  }
  if (!envelope.data) {
    throw new Error(`数据加载失败，请稍后重试（traceId: ${envelope.traceId}）`)
  }

  const product = envelope.data.product
  const durationOptions = product ? normalizeDurationOptions(product) : []

  return {
    provider: 'mock',
    responseState: product && durationOptions.length > 0 ? 'success' : 'empty',
    sourceLabel: PRICE_BOARD_MOCK_SOURCE_LABEL,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    campId: envelope.data.camp.campId,
    campName: envelope.data.camp.campName,
    productName: product?.channelRoomCategoryName || '暂无电子房价牌商品配置',
    description: product?.description || '当前门店暂未配置可购买的电子房价牌商品',
    totalProductCount: envelope.data.totalProductCount,
    durationOptions,
    paymentTypeNames: envelope.data.paymentTypeNames,
    requestSummary: envelope.data.requestSummary,
    requestedAt: envelope.timestamp,
  }
}

function mockPriceBoardSuccessEnvelope(): ApiEnvelope<{
  camp: { campId: string; campName: string }
  product: PriceBoardRawProduct
  totalProductCount: number
  paymentTypeNames: string[]
  requestSummary: string[]
}> {
  return {
    code: 0,
    message: 'success',
    traceId: 'mock-fangtai--fangjia-guanli--dianzi-fangjiapai-overview-001',
    timestamp: PRICE_BOARD_MOCK_TIMESTAMP,
    data: {
      camp: { campId: 'mock-camp-price-board', campName: '深圳湾门店' },
      product: {
        channelRoomCategoryName: '电子房价牌',
        description: '可直连路客云系统房价，展示于门店的电子展示牌上面，一目了然',
        lowestSellingPrice: 49900,
        lowestOriginalPrice: 89900,
        roomCategoryProductGetViews: [
          {
            roomCategoryProductId: 'mock-price-board-one-year',
            roomCategoryProductName: '一年',
            sellingPrice: 49900,
            originalPrice: 89900,
            stock: 99847,
          },
          {
            roomCategoryProductId: 'mock-price-board-two-year',
            roomCategoryProductName: '两年',
            sellingPrice: 99800,
            originalPrice: 179800,
            stock: 99986,
          },
        ],
      },
      totalProductCount: 1,
      paymentTypeNames: ['微信支付', '房费'],
      requestSummary: [
        'POST /houseManage/priceBoard/overview',
        'POST /houseManage/priceBoard/payment-config',
      ],
    },
  }
}

function mockPriceBoardEmptyEnvelope(): ApiEnvelope<{
  camp: { campId: string; campName: string }
  product: null
  totalProductCount: number
  paymentTypeNames: string[]
  requestSummary: string[]
}> {
  return {
    code: 0,
    message: 'success',
    traceId: 'mock-fangtai--fangjia-guanli--dianzi-fangjiapai-empty-001',
    timestamp: PRICE_BOARD_MOCK_TIMESTAMP,
    data: {
      camp: { campId: 'mock-camp-price-board', campName: '深圳湾门店' },
      product: null,
      totalProductCount: 0,
      paymentTypeNames: [],
      requestSummary: ['POST /houseManage/priceBoard/overview'],
    },
  }
}

function mockPriceBoardErrorEnvelope(): ApiEnvelope<null> {
  return {
    code: 50001,
    message: '电子房价牌数据服务模拟失败',
    data: null,
    traceId: 'mock-fangtai--fangjia-guanli--dianzi-fangjiapai-error-001',
    timestamp: PRICE_BOARD_MOCK_TIMESTAMP,
  }
}

function resolvePriceBoardProviderName(): PriceBoardProviderName {
  const configured = readRuntimeConfig('pmsPriceBoardProvider') || import.meta.env.VITE_PRICE_BOARD_PROVIDER
  return configured === 'real' ? 'real' : 'mock'
}

function resolvePriceBoardMockMode(): PriceBoardMockMode {
  const configured = readRuntimeConfig('pmsPriceBoardMockMode') || import.meta.env.VITE_PRICE_BOARD_MOCK_MODE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(`${endpoint} 返回 HTTP ${response.status}：${payload?.errorMsg ?? '无错误详情'}`)
  }

  if (!payload || payload.success !== true) {
    throw new Error(`${endpoint} 返回业务错误：${payload?.errorMsg ?? payload?.errorCode ?? '未知错误'}`)
  }

  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

function readCampInfo(data: CampsResponse) {
  const camp = data.camps?.find((item) => item.campId)
  if (!camp?.campId) {
    throw new Error('/camps/get 未返回可用 campId')
  }

  return { campId: camp.campId, campName: camp.name || '当前门店' }
}

function findPriceBoardProduct(data: WeiRoomCategoriesResponse) {
  const product = data.list?.find((item) => item.channelRoomCategoryName === '电子房价牌')
  if (!product) {
    throw new Error('/weiRoomCategories/page/get 未返回电子房价牌商品')
  }

  return product
}

function normalizeDurationOptions(product: PriceBoardRawProduct): PriceBoardDurationOption[] {
  const options = product.roomCategoryProductGetViews ?? []
  const preferred = options.filter((item) => {
    const name = item.roomCategoryProductName ?? ''
    return name.includes('年') && !name.includes('无期限')
  })
  const source = preferred.length > 0 ? preferred : options

  return source
    .map((item) => ({
      id: item.roomCategoryProductId || item.roomCategoryProductName || '',
      label: item.roomCategoryProductName || '未命名时长',
      price: Number(item.sellingPrice ?? 0),
      originalPrice: Number(item.originalPrice ?? item.sellingPrice ?? 0),
      stock: item.stock == null ? null : Number(item.stock),
    }))
    .filter((item) => item.id && Number.isFinite(item.price) && item.price > 0)
}

function normalizePaymentTypes(data: PaymentTypesResponse) {
  return (data.paymentGroups ?? [])
    .flatMap((group) => group.paymentTypes ?? [])
    .filter((item) => item.isEnable !== 0 && item.paymentTypeName)
    .map((item) => item.paymentTypeName as string)
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
