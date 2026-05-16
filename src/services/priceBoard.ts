const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn'
const PRICE_BOARD_PRODUCT_CAMP_ID = '64'

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

export type PriceBoardDurationOption = {
  id: string
  label: string
  price: number
  originalPrice: number
  stock: number | null
}

export type PriceBoardData = {
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
