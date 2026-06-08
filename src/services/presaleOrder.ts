export const PRESALE_ORDER_ENDPOINT = '/api/orders/page/get'
export const PRESALE_CAMPS_ENDPOINT = '/api/camps/get'
export const PRESALE_CHANNELS_ENDPOINT = '/api/channels/get'
export const PRESALE_PAYMENT_TYPES_ENDPOINT = '/api/paymentTypes/get/v2'
export const PRESALE_CATEGORIES_ENDPOINT = '/api/categories/get'

const PRESALE_PROVIDER_STORAGE_KEY = 'pmsPresaleOrderProvider'
const PRESALE_MOCK_STATE_STORAGE_KEY = 'pmsPresaleOrderMockState'
const MOCK_CAMP_ID = 'mock-camp-dingdan-yushouquan'
const TASK_TRACE_PREFIX = 'mock-dingdan--yushouquan-dingdan--yushouquan-dingdan'

export type SelectOption = {
  value: string
  label: string
}

export type PresaleOrderProviderName = 'mock' | 'real'
export type PresaleOrderMockState = 'success' | 'empty' | 'error'

export type PresaleOrderFilters = {
  campId?: string
  poiIds?: string[]
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
  productTypeValue: string
  categoryName: string
  categoryId: string
  sourceName: string
  sourceId: string
  paymentName: string
  paymentId: string
  unitPrice: string
  quantity: string
  totalAmount: string
  paidAmount: string
  buyer: string
  contact: string
  orderState: string
  orderStateValue: string
  afterSaleState: string
  afterSaleValue: string
  createdAt: string
}

export type PresaleOrderMetric = {
  label: string
  value: string
  hint: string
}

export type PresaleOrderData = {
  providerName: PresaleOrderProviderName
  responseState: PresaleOrderMockState
  traceId: string
  timestamp: string
  campId: string
  endpoint: string
  requestBody: Record<string, unknown>
  rows: PresaleOrderRow[]
  metrics: PresaleOrderMetric[]
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
  | {
      ok: false
      providerName: PresaleOrderProviderName
      endpoint: string
      requestBody?: Record<string, unknown>
      message: string
      traceId: string
      timestamp: string
      status?: number
    }

type PresaleOrderResponse<T> = {
  code: number
  message: string
  data: T | null
  traceId: string
  timestamp: string
}

type PresaleOrderListData = {
  campId: string
  list: PresaleOrderRow[]
  metrics: PresaleOrderMetric[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  options: {
    sources: SelectOption[]
    categories: SelectOption[]
    payments: SelectOption[]
  }
}

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

const mockOptions = {
  sources: [
    { value: '34', label: '微信小程序' },
    { value: '33', label: '抖音小程序' },
    { value: '36', label: '小红书' },
  ],
  categories: [
    { value: '11', label: '住宿套餐 / 早餐券' },
    { value: '12', label: '住宿套餐 / 房费抵扣券' },
    { value: '13', label: '体验活动 / 周末加购' },
  ],
  payments: [
    { value: '2', label: '微信' },
    { value: '3', label: '支付宝' },
    { value: '8', label: '储值余额' },
  ],
}

const mockRows: PresaleOrderRow[] = [
  {
    id: 'ORDER-001',
    productName: '早鸟预售券',
    productSubName: '周末双人早餐券',
    productType: '虚拟商品',
    productTypeValue: '1',
    categoryName: '住宿套餐 / 早餐券',
    categoryId: '11',
    sourceName: '微信小程序',
    sourceId: '34',
    paymentName: '微信',
    paymentId: '2',
    unitPrice: '199',
    quantity: '1',
    totalAmount: '199',
    paidAmount: '199',
    buyer: '张三',
    contact: '13800000000',
    orderState: '待支付',
    orderStateValue: '1',
    afterSaleState: '申请退款中',
    afterSaleValue: '1',
    createdAt: '2026-05-18 10:12',
  },
  {
    id: 'ORDER-002',
    productName: '连住抵扣券',
    productSubName: '满 3 晚可用',
    productType: '电子卡券',
    productTypeValue: '3',
    categoryName: '住宿套餐 / 房费抵扣券',
    categoryId: '12',
    sourceName: '抖音小程序',
    sourceId: '33',
    paymentName: '支付宝',
    paymentId: '3',
    unitPrice: '80',
    quantity: '2',
    totalAmount: '160',
    paidAmount: '160',
    buyer: '李四',
    contact: '13900000000',
    orderState: '已完成',
    orderStateValue: '4',
    afterSaleState: '-',
    afterSaleValue: '',
    createdAt: '2026-05-18 09:24',
  },
  {
    id: 'ORDER-003',
    productName: '下午茶体验券',
    productSubName: '入住当日可用',
    productType: '实物商品',
    productTypeValue: '2',
    categoryName: '体验活动 / 周末加购',
    categoryId: '13',
    sourceName: '小红书',
    sourceId: '36',
    paymentName: '储值余额',
    paymentId: '8',
    unitPrice: '59',
    quantity: '3',
    totalAmount: '177',
    paidAmount: '177',
    buyer: '王五',
    contact: '13700000000',
    orderState: '已发货',
    orderStateValue: '3',
    afterSaleState: '部分退款',
    afterSaleValue: '2',
    createdAt: '2026-05-17 18:36',
  },
]

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
  if (filters.poiIds?.length) body.poiIds = filters.poiIds
  return body
}

export function getPresaleOrderProviderName(): PresaleOrderProviderName {
  const fromStorage =
    typeof window === 'undefined' ? null : window.localStorage.getItem(PRESALE_PROVIDER_STORAGE_KEY)
  if (fromStorage === 'real' || fromStorage === 'mock') return fromStorage

  const fromEnv = import.meta.env.VITE_PRESALE_ORDER_PROVIDER as PresaleOrderProviderName | undefined
  return fromEnv === 'real' ? 'real' : 'mock'
}

export function normalizePresaleOrderMockState(value: string | null | undefined): PresaleOrderMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}

export async function loadPresaleOrderData(
  filters: PresaleOrderFilters,
  signal?: AbortSignal,
): Promise<PresaleOrderLoadResult> {
  const providerName = getPresaleOrderProviderName()
  const campId = filters.campId || (providerName === 'mock' ? MOCK_CAMP_ID : undefined)
  const requestBody = createPresaleOrderRequestBody(filters, campId ?? '待获取')

  try {
    const response =
      providerName === 'mock'
        ? await postPresaleOrderMock(filters)
        : await postPresaleOrderReal(filters, signal)

    const data = unwrapPresaleOrderResponse(response)
    return {
      ok: true,
      data: adaptListData(data, {
        providerName,
        responseState: data.list.length ? 'success' : 'empty',
        traceId: response.traceId,
        timestamp: response.timestamp,
        requestBody: createPresaleOrderRequestBody(filters, data.campId),
      }),
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    const timestamp = getPresaleOrderTimestamp()
    return {
      ok: false,
      providerName,
      endpoint: PRESALE_ORDER_ENDPOINT,
      requestBody,
      message: error instanceof Error ? error.message : String(error),
      traceId:
        providerName === 'mock'
          ? `${TASK_TRACE_PREFIX}-list-error`
          : 'real-dingdan--yushouquan-dingdan--yushouquan-dingdan-list-error',
      timestamp,
    }
  }
}

async function postPresaleOrderMock(
  filters: PresaleOrderFilters,
): Promise<PresaleOrderResponse<PresaleOrderListData>> {
  const params = new URLSearchParams(window.location.search)
  const state = normalizePresaleOrderMockState(
    params.get('mockState') || window.localStorage.getItem(PRESALE_MOCK_STATE_STORAGE_KEY),
  )

  if (state === 'error') {
    return createPresaleOrderResponse<PresaleOrderListData>(null, `${TASK_TRACE_PREFIX}-list-error`, 500, '预售券订单加载失败')
  }

  const campId = filters.campId || MOCK_CAMP_ID
  const rows = state === 'empty' ? [] : filterRows(mockRows, filters)
  const start = (filters.pageNum - 1) * filters.pageSize
  const pagedRows = rows.slice(start, start + filters.pageSize)
  const data: PresaleOrderListData = {
    campId,
    list: pagedRows,
    metrics: buildMetrics(rows),
    pagination: {
      page: filters.pageNum,
      pageSize: filters.pageSize,
      total: rows.length,
    },
    options: mockOptions,
  }

  return createPresaleOrderResponse(data, `${TASK_TRACE_PREFIX}-list-${state === 'empty' ? 'empty' : '001'}`)
}

async function postPresaleOrderReal(
  filters: PresaleOrderFilters,
  signal?: AbortSignal,
): Promise<PresaleOrderResponse<PresaleOrderListData>> {
  let campId = filters.campId
  if (!campId) campId = await fetchDefaultCampId(signal)
  if (!campId) throw new Error('未取得当前门店，无法加载预售券订单')

  const requestBody = createPresaleOrderRequestBody(filters, campId)
  const [ordersPayload, sources, categories, payments] = await Promise.all([
    postHudson(PRESALE_ORDER_ENDPOINT, requestBody, signal),
    fetchSourceOptions(campId, signal),
    fetchCategoryOptions(signal),
    fetchPaymentOptions(campId, signal),
  ])

  const listData = adaptHudsonOrderPayload(ordersPayload, {
    campId,
    requestBody,
    sources,
    categories,
    payments,
  })

  return createPresaleOrderResponse(
    listData,
    'real-dingdan--yushouquan-dingdan--yushouquan-dingdan-list-001',
  )
}

function createPresaleOrderResponse<T>(
  data: T | null,
  traceId: string,
  code = 0,
  message = 'success',
): PresaleOrderResponse<T> {
  return {
    code,
    message,
    data,
    traceId,
    timestamp: getPresaleOrderTimestamp(),
  }
}

function unwrapPresaleOrderResponse<T>(response: PresaleOrderResponse<T>): T {
  if (response.code !== 0) throw new Error(response.message || '预售券订单加载失败')
  if (response.data === null || response.data === undefined) throw new Error('预售券订单加载失败')
  return response.data
}

function adaptListData(
  data: PresaleOrderListData,
  context: {
    providerName: PresaleOrderProviderName
    responseState: PresaleOrderMockState
    traceId: string
    timestamp: string
    requestBody: Record<string, unknown>
  },
): PresaleOrderData {
  const pageNum = data.pagination.page
  const pageSize = data.pagination.pageSize
  const total = data.pagination.total

  return {
    providerName: context.providerName,
    responseState: context.responseState,
    traceId: context.traceId,
    timestamp: context.timestamp,
    campId: data.campId,
    endpoint: PRESALE_ORDER_ENDPOINT,
    requestBody: context.requestBody,
    rows: data.list,
    metrics: data.metrics,
    total,
    pageNum,
    pageSize,
    hasNextPage: pageNum * pageSize < total,
    requestedAt: context.timestamp,
    options: data.options,
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
    throw new Error(payloadMessage || `请求失败，状态码 ${response.status}`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('预售券订单响应格式异常')
  }
  if ((payload as { success?: boolean }).success === false) {
    throw new Error(payloadMessage || '预售券订单返回业务失败')
  }
  return payload
}

function extractPayloadMessage(payload: unknown) {
  const record = asRecord(payload)
  const message = record.errorMsg ?? record.errorDetail ?? record.message
  return typeof message === 'string' && message.trim() ? message.trim() : ''
}

function adaptHudsonOrderPayload(
  payload: unknown,
  context: {
    campId: string
    requestBody: Record<string, unknown>
    sources: SelectOption[]
    categories: SelectOption[]
    payments: SelectOption[]
  },
): PresaleOrderListData {
  const data = asRecord(readPath(payload, ['data']))
  const list = toArray(data.list).map(adaptOrderRow)
  const total = toNumber(data.total, list.length)
  const pageNum = toNumber(data.pageNum ?? data.current, toNumber(context.requestBody.pageNum, 1))
  const pageSize = toNumber(data.size ?? data.pageSize, toNumber(context.requestBody.pageSize, 20))

  return {
    campId: context.campId,
    list,
    metrics: buildMetrics(list),
    pagination: {
      page: pageNum,
      pageSize,
      total,
    },
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
  const categoryName = pickString(firstDetail, ['categoryName']) ?? pickString(row, ['categoryName']) ?? '-'
  const sourceId = pickString(row, ['orderChannelId', 'channelId']) ?? ''
  const paymentId = pickString(row, ['paymentWayId', 'paymentTypeId']) ?? ''
  const orderStateValue = String(row.orderState ?? '')
  const afterSaleValue = String(row.refundDisplayState ?? '')

  return {
    id: pickString(row, ['orderId', 'id', 'orderNo']) ?? `presale-order-${index}`,
    productName:
      pickString(firstDetail, ['roomCategoryName', 'goodsName', 'productName']) ??
      pickString(row, ['roomCategoryName', 'goodsName', 'productName']) ??
      '未命名商品',
    productSubName: pickString(firstDetail, ['roomCategoryProductName', 'skuName']) ?? '-',
    productType: productTypeLabels[String(productType ?? '')] ?? String(productType ?? '-'),
    productTypeValue: String(productType ?? ''),
    categoryName,
    categoryId: pickString(firstDetail, ['categoryId']) ?? pickString(row, ['categoryId']) ?? '',
    sourceName: pickString(row, ['orderChannelName', 'channelName', 'sourceName']) ?? '-',
    sourceId,
    paymentName: pickString(row, ['paymentWayName', 'paymentTypeName']) ?? '-',
    paymentId,
    unitPrice: formatMoney(firstExisting(firstDetail, ['price', 'salePrice', 'unitPrice'])),
    quantity,
    totalAmount: formatMoney(firstExisting(row, ['totalAmount', 'totalPrice', 'orderAmount'])),
    paidAmount: formatMoney(firstExisting(row, ['paidAmount', 'realPayAmount', 'paymentAmount'])),
    buyer: pickString(row, ['buyerName', 'guestName', 'contactName', 'userName', 'nickName']) ?? '-',
    contact: pickString(row, ['buyerMobile', 'contactPhone', 'mobile', 'phone']) ?? '-',
    orderState: orderStateLabels[orderStateValue] ?? (orderStateValue || '-'),
    orderStateValue,
    afterSaleState: refundLabels[afterSaleValue] ?? '-',
    afterSaleValue,
    createdAt: pickString(row, ['createdAt', 'bookedTime', 'createdTime']) ?? '-',
  }
}

function filterRows(rows: PresaleOrderRow[], filters: PresaleOrderFilters) {
  const keyword = filters.keyword.trim()
  return rows.filter((row) => {
    if (filters.orderState !== '0' && row.orderStateValue !== filters.orderState) return false
    if (filters.productType && row.productTypeValue !== filters.productType) return false
    if (filters.source && row.sourceId !== filters.source) return false
    if (filters.category && row.categoryId !== filters.category) return false
    if (filters.payment && row.paymentId !== filters.payment) return false
    if (filters.afterSale && row.afterSaleValue !== filters.afterSale) return false
    if (keyword && !`${row.id} ${row.buyer} ${row.contact} ${row.productName}`.includes(keyword)) return false
    return true
  })
}

function buildMetrics(rows: PresaleOrderRow[]): PresaleOrderMetric[] {
  const paidAmount = rows.reduce((sum, row) => sum + Number(row.paidAmount.replace(/,/g, '') || 0), 0)
  const pendingCount = rows.filter((row) => row.orderState === '待支付').length
  const refundCount = rows.filter((row) => row.afterSaleState !== '-').length
  return [
    { label: '订单总数', value: `${rows.length}`, hint: '当前筛选范围' },
    { label: '实付金额', value: paidAmount.toLocaleString('zh-CN'), hint: '元' },
    { label: '待处理', value: `${pendingCount}`, hint: '需跟进订单' },
    { label: '售后中', value: `${refundCount}`, hint: '退款相关' },
  ]
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

function getPresaleOrderTimestamp() {
  return '2026-05-18T10:00:00+08:00'
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
