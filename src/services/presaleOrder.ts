export const PRESALE_ORDER_ENDPOINT = 'https://hudson-prod.localhome.cn/orders/page/get'
export const PRESALE_CAMPS_ENDPOINT = 'https://hudson-prod.localhome.cn/camps/get'
export const PRESALE_CHANNELS_ENDPOINT = 'https://hudson-prod.localhome.cn/channels/get'
export const PRESALE_PAYMENT_TYPES_ENDPOINT = 'https://hudson-prod.localhome.cn/paymentTypes/get/v2'
export const PRESALE_CATEGORIES_ENDPOINT = 'https://hudson-prod.localhome.cn/categories/get'

export type SelectOption = {
  value: string
  label: string
}

export type PresaleOrderFilters = {
  campId?: string
  orderState: string
  productType: string
  source: string
  category: string
  payment: string
  afterSale: string
  keyword: string
  startDate: string
  endDate: string
  pageNum: number
  pageSize: number
}

export type PresaleOrderRow = {
  id: string
  productName: string
  productSubName: string
  productType: string
  categoryName: string
  unitPrice: string
  quantity: string
  totalAmount: string
  paidAmount: string
  buyer: string
  contact: string
  orderState: string
  afterSaleState: string
}

export type PresaleOrderData = {
  campId: string
  endpoint: string
  requestBody: Record<string, unknown>
  rows: PresaleOrderRow[]
  total: number
  pageNum: number
  pageSize: number
  hasNextPage: boolean
  requestedAt: string
  options: {
    sources: SelectOption[]
    categories: SelectOption[]
    payments: SelectOption[]
  }
}

export type PresaleOrderLoadResult =
  | { ok: true; data: PresaleOrderData }
  | { ok: false; endpoint: string; requestBody?: Record<string, unknown>; message: string; status?: number }

const defaultProductTypes = ['1', '2', '3']
const orderStateRequestMap: Record<string, number[]> = {
  '0': [],
  '1': [6],
  '3': [3],
  '4': [4],
  '5': [5, 7, 8, 9, 10],
}

const orderStateLabels: Record<string, string> = {
  '1': '待处理',
  '2': '待发货',
  '3': '已发货',
  '4': '已完成',
  '5': '已取消',
  '6': '待支付',
  '7': '已取消',
  '8': '已取消',
  '9': '已取消',
  '10': '已取消',
}

const refundLabels: Record<string, string> = {
  '1': '申请退款中',
  '2': '部分退款',
  '3': '已退款',
}

const productTypeLabels: Record<string, string> = {
  '1': '虚拟商品',
  '2': '实物商品',
  '3': '电子卡券',
  '4': '酒店套餐',
}

export function createPresaleOrderRequestBody(
  filters: PresaleOrderFilters,
  campId: string,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    campId,
    pageNum: String(filters.pageNum || 1),
    pageSize: String(filters.pageSize || 20),
    orderStates: orderStateRequestMap[filters.orderState] ?? [],
    roomCategoryTypes: filters.productType ? [filters.productType] : defaultProductTypes,
    categoryIds: filters.category ? [filters.category] : [],
    orderChannelIds: filters.source ? [filters.source] : [],
    paymentWayIds: filters.payment ? [filters.payment] : [],
    bookedStartDate: toStartOfDay(filters.startDate),
    bookedEndDate: toNextDayStart(filters.endDate),
    keyword: filters.keyword.trim(),
  }

  if (filters.afterSale) body.refundDisplayState = Number(filters.afterSale)
  return body
}

export async function loadPresaleOrderData(
  filters: PresaleOrderFilters,
  signal?: AbortSignal,
): Promise<PresaleOrderLoadResult> {
  let campId = filters.campId
  try {
    if (!campId) campId = await fetchDefaultCampId(signal)
    if (!campId) {
      return {
        ok: false,
        endpoint: PRESALE_CAMPS_ENDPOINT,
        message: '真实接口未返回可用 campId，无法请求预售券订单列表。',
      }
    }

    const requestBody = createPresaleOrderRequestBody(filters, campId)
    const [ordersPayload, sources, categories, payments] = await Promise.all([
      postHudson(PRESALE_ORDER_ENDPOINT, requestBody, signal),
      fetchSourceOptions(campId, signal),
      fetchCategoryOptions(signal),
      fetchPaymentOptions(campId, signal),
    ])

    return {
      ok: true,
      data: adaptOrderPayload(ordersPayload, {
        campId,
        requestBody,
        sources,
        categories,
        payments,
      }),
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return {
      ok: false,
      endpoint: PRESALE_ORDER_ENDPOINT,
      requestBody: campId ? createPresaleOrderRequestBody(filters, campId) : undefined,
      message: error instanceof Error ? error.message : String(error),
    }
  }
}

async function fetchDefaultCampId(signal?: AbortSignal) {
  const payload = await postHudson(PRESALE_CAMPS_ENDPOINT, {}, signal)
  const camps = toArray(readPath(payload, ['data', 'camps']))
  return pickString(camps[0], ['campId'])
}

async function fetchSourceOptions(campId: string, signal?: AbortSignal): Promise<SelectOption[]> {
  const payload = await postHudson(PRESALE_CHANNELS_ENDPOINT, { campId, hasAllChannel: 1 }, signal)
  return toArray(readPath(payload, ['data', 'channels']))
    .map((item) => ({
      value: pickString(item, ['channelId']) ?? '',
      label: pickString(item, ['channelName']) ?? '',
    }))
    .filter((item) => item.value && item.label)
}

async function fetchPaymentOptions(campId: string, signal?: AbortSignal): Promise<SelectOption[]> {
  const payload = await postHudson(
    PRESALE_PAYMENT_TYPES_ENDPOINT,
    { campId, bizTypes: [3], isEnable: 1 },
    signal,
  )
  const groups = toArray(readPath(payload, ['data', 'paymentGroups']))
  return groups
    .flatMap((group) => toArray(readPath(group, ['paymentTypes'])))
    .map((item) => ({
      value: pickString(item, ['paymentTypeId', 'paymentWayId']) ?? '',
      label: pickString(item, ['paymentTypeName', 'paymentWayName']) ?? '',
    }))
    .filter((item) => item.value && item.label)
}

async function fetchCategoryOptions(signal?: AbortSignal): Promise<SelectOption[]> {
  const payload = await postHudson(PRESALE_CATEGORIES_ENDPOINT, { parentId: 0 }, signal)
  const roots = toArray(readPath(payload, ['data', 'categoryViews']))
  return flattenCategories(roots)
}

async function postHudson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  const payload = await response.json().catch(() => null)
  const payloadMessage = extractPayloadMessage(payload)
  if (!response.ok) {
    throw new Error(payloadMessage || `${endpoint} 返回 HTTP ${response.status}`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error(`${endpoint} 响应不是 JSON 对象`)
  }
  if ((payload as { success?: boolean }).success === false) {
    throw new Error(payloadMessage || `${endpoint} 返回业务失败`)
  }
  return payload
}

function extractPayloadMessage(payload: unknown) {
  const record = asRecord(payload)
  const message = record.errorMsg ?? record.errorDetail ?? record.message
  return typeof message === 'string' && message.trim() ? message.trim() : ''
}

function adaptOrderPayload(
  payload: unknown,
  context: {
    campId: string
    requestBody: Record<string, unknown>
    sources: SelectOption[]
    categories: SelectOption[]
    payments: SelectOption[]
  },
): PresaleOrderData {
  const data = asRecord(readPath(payload, ['data']))
  const list = toArray(data.list)
  const total = toNumber(data.total, list.length)
  const pageNum = toNumber(data.pageNum ?? data.current, toNumber(context.requestBody.pageNum, 1))
  const pageSize = toNumber(data.size ?? data.pageSize, toNumber(context.requestBody.pageSize, 20))

  return {
    campId: context.campId,
    endpoint: PRESALE_ORDER_ENDPOINT,
    requestBody: context.requestBody,
    rows: list.map(adaptOrderRow),
    total,
    pageNum,
    pageSize,
    hasNextPage: Boolean(data.hasNextPage) || pageNum * pageSize < total,
    requestedAt: new Date().toISOString(),
    options: {
      sources: context.sources,
      categories: context.categories,
      payments: context.payments,
    },
  }
}

function adaptOrderRow(value: unknown, index: number): PresaleOrderRow {
  const row = asRecord(value)
  const details = toArray(row.orderDetailViews)
  const firstDetail = asRecord(details[0])
  const productType = pickString(firstDetail, ['roomCategoryType']) ?? pickString(row, ['roomCategoryType'])
  const quantity = pickString(firstDetail, ['count', 'quantity', 'num']) ?? pickString(row, ['count', 'quantity']) ?? '-'

  return {
    id: pickString(row, ['orderId', 'id', 'orderNo']) ?? `presale-order-${index}`,
    productName:
      pickString(firstDetail, ['roomCategoryName', 'goodsName', 'productName']) ??
      pickString(row, ['roomCategoryName', 'goodsName', 'productName']) ??
      '未命名商品',
    productSubName: pickString(firstDetail, ['roomCategoryProductName', 'skuName']) ?? '-',
    productType: productTypeLabels[String(productType ?? '')] ?? String(productType ?? '-'),
    categoryName: pickString(firstDetail, ['categoryName']) ?? pickString(row, ['categoryName']) ?? '-',
    unitPrice: formatMoney(firstExisting(firstDetail, ['price', 'salePrice', 'unitPrice'])),
    quantity,
    totalAmount: formatMoney(firstExisting(row, ['totalAmount', 'totalPrice', 'orderAmount'])),
    paidAmount: formatMoney(firstExisting(row, ['paidAmount', 'realPayAmount', 'paymentAmount'])),
    buyer: pickString(row, ['buyerName', 'guestName', 'contactName', 'userName', 'nickName']) ?? '-',
    contact: pickString(row, ['buyerMobile', 'contactPhone', 'mobile', 'phone']) ?? '-',
    orderState: orderStateLabels[String(row.orderState ?? '')] ?? String(row.orderState ?? '-'),
    afterSaleState: refundLabels[String(row.refundDisplayState ?? '')] ?? '-',
  }
}

function flattenCategories(items: unknown[], prefix = ''): SelectOption[] {
  return items.flatMap((item) => {
    const label = pickString(item, ['name', 'categoryName']) ?? ''
    const value = pickString(item, ['categoryId', 'id']) ?? ''
    const fullLabel = prefix && label ? `${prefix} / ${label}` : label
    const children = toArray(readPath(item, ['children']))
    const current = value && fullLabel ? [{ value, label: fullLabel }] : []
    return [...current, ...flattenCategories(children, fullLabel)]
  })
}

function toStartOfDay(date: string) {
  if (!date) return ''
  const timestamp = new Date(`${date}T00:00:00+08:00`).getTime()
  return Number.isFinite(timestamp) ? timestamp : ''
}

function toNextDayStart(date: string) {
  if (!date) return ''
  const parsed = new Date(`${date}T00:00:00+08:00`)
  if (!Number.isFinite(parsed.getTime())) return ''
  parsed.setDate(parsed.getDate() + 1)
  return parsed.getTime()
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  const yuan = Math.abs(numeric) >= 100 ? numeric / 100 : numeric
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: Number.isInteger(yuan) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(yuan)
}

function firstExisting(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') return record[key]
  }
  return undefined
}

function pickString(value: unknown, keys: string[]) {
  const record = asRecord(value)
  for (const key of keys) {
    const candidate = record[key]
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim()
    if (typeof candidate === 'number') return String(candidate)
  }
  return undefined
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function readPath(value: unknown, path: string[]) {
  let current = value
  for (const segment of path) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }
  return current
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
