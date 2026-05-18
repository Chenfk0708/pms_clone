export type FullMarketingProviderName = 'mock' | 'api'
type FullMarketingMockMode = 'success' | 'empty' | 'error'

export type FullMarketingProductType = 'calendar' | 'presale'
export type FullMarketingTab = 'commission' | 'distribution'

export type FullMarketingCommissionFilters = {
  productType: FullMarketingProductType
  keyword: string
  page: number
  pageSize: number
  provider?: FullMarketingProviderName
}

export type FullMarketingDistributionFilters = {
  productType: FullMarketingProductType | 'all'
  startDate: string
  endDate: string
  page: number
  pageSize: number
  provider?: FullMarketingProviderName
}

export type FullMarketingCommissionRow = {
  id: string
  name: string
  level: string
  indirectRatio: string
  directRatio: string
  enabled: boolean
  type: FullMarketingProductType
}

export type FullMarketingDistributionRow = {
  id: string
  name: string
  sales: number
  turnover: string
  commission: string
}

export type FullMarketingDistributorRow = {
  id: string
  name: string
  sales: number
  turnover: string
  commission: string
}

export type FullMarketingViewModel = {
  tab: FullMarketingTab
  provider: FullMarketingProviderName
  endpoint: string
  requestBody: Record<string, unknown>
  traceId: string
  timestamp: string
  commission?: {
    filters: FullMarketingCommissionFilters
    rows: FullMarketingCommissionRow[]
    pagination: { page: number; pageSize: number; total: number }
  }
  distribution?: {
    filters: FullMarketingDistributionFilters
    metrics: { turnover: string; commission: string }
    productRows: FullMarketingDistributionRow[]
    distributorRows: FullMarketingDistributorRow[]
    pagination: { page: number; pageSize: number; total: number }
  }
}

type FullMarketingEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type TargetEnvelope = Partial<{
  success: boolean
  errorCode: string | null
  errorMsg: string | null
  data: unknown
  code: number
  message: string
  traceId: string
  timestamp: string
}>

export class FullMarketingRequestError extends Error {
  constructor(message = '全员营销数据加载失败') {
    super(message)
    this.name = 'FullMarketingRequestError'
  }
}

export const defaultFullMarketingCommissionFilters: FullMarketingCommissionFilters = {
  productType: 'calendar',
  keyword: '',
  page: 1,
  pageSize: 20,
}

export const defaultFullMarketingDistributionFilters: FullMarketingDistributionFilters = {
  productType: 'all',
  startDate: '2026-05-01',
  endDate: '2026-05-31',
  page: 1,
  pageSize: 10,
}

export const fullMarketingCommissionEndpoint = 'https://hudson-prod.localhome.cn/promotionPlanProducts/page/get'
export const fullMarketingDistributionMetricEndpoint = 'https://hudson-prod.localhome.cn/report/promotion/get'
export const fullMarketingProductSaleEndpoint = 'https://hudson-prod.localhome.cn/report/promotion/productSale/page/get'

const campId = '1796067693589061634'

export async function fetchFullMarketingCommission(
  filters: FullMarketingCommissionFilters,
  signal?: AbortSignal,
): Promise<FullMarketingViewModel> {
  const requestBody = createCommissionRequestBody(filters)
  const provider = resolveFullMarketingProviderName(filters.provider)

  if (provider === 'mock') {
    return fetchMockCommission(filters, requestBody)
  }

  const response = await fetch(fullMarketingCommissionEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(requestBody),
    signal,
  })
  const payload = await readJson(response)
  if (!response.ok || isFailedResponse(payload)) {
    throw new FullMarketingRequestError(extractErrorMessage(payload) ?? `全员营销数据加载失败（HTTP ${response.status}）`)
  }
  return adaptCommission(payload?.data, filters, requestBody, 'api', payload)
}

export async function fetchFullMarketingDistribution(
  filters: FullMarketingDistributionFilters,
  signal?: AbortSignal,
): Promise<FullMarketingViewModel> {
  const requestBody = createDistributionRequestBody(filters)
  const provider = resolveFullMarketingProviderName(filters.provider)

  if (provider === 'mock') {
    return fetchMockDistribution(filters, requestBody)
  }

  const [metricResponse, productResponse] = await Promise.all([
    fetch(fullMarketingDistributionMetricEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody.metric),
      signal,
    }),
    fetch(fullMarketingProductSaleEndpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(requestBody.productSale),
      signal,
    }),
  ])
  const [metricPayload, productPayload] = await Promise.all([readJson(metricResponse), readJson(productResponse)])
  if (!metricResponse.ok || isFailedResponse(metricPayload)) {
    throw new FullMarketingRequestError(extractErrorMessage(metricPayload) ?? '全员营销数据加载失败')
  }
  if (!productResponse.ok || isFailedResponse(productPayload)) {
    throw new FullMarketingRequestError(extractErrorMessage(productPayload) ?? '全员营销数据加载失败')
  }
  return adaptDistribution(
    { metric: metricPayload?.data, productSale: productPayload?.data, distributors: { list: [] } },
    filters,
    requestBody,
    'api',
    productPayload,
  )
}

export async function saveFullMarketingCommissionPlan(input: {
  row: FullMarketingCommissionRow
  directRatio: string
  enabled: boolean
}) {
  const ratio = Number(input.directRatio)
  if (!Number.isFinite(ratio) || ratio < 0 || ratio > 100) {
    throw new FullMarketingRequestError('佣金比例需在 0 至 100 之间')
  }

  return {
    ...input.row,
    directRatio: `${ratio}%`,
    indirectRatio: input.row.indirectRatio === '-%' ? '-%' : input.row.indirectRatio,
    enabled: input.enabled,
  }
}

export function createCommissionRequestBody(filters: FullMarketingCommissionFilters) {
  return {
    campId,
    pageNum: filters.page,
    pageSize: filters.pageSize,
    current: filters.page,
    type: filters.productType === 'calendar' ? '0' : '1',
    keyword: filters.keyword.trim() || null,
  }
}

export function createDistributionRequestBody(filters: FullMarketingDistributionFilters) {
  const type =
    filters.productType === 'calendar' ? '0' : filters.productType === 'presale' ? '1' : null
  const endDate = toExclusiveEndDate(filters.endDate)
  return {
    metric: {
      campId,
      startDate: filters.startDate,
      endDate,
      type,
    },
    productSale: {
      campId,
      pageNum: filters.page,
      pageSize: filters.pageSize,
      startDate: filters.startDate,
      endDate,
      type,
    },
  }
}

function fetchMockCommission(filters: FullMarketingCommissionFilters, requestBody: Record<string, unknown>) {
  const mode = resolveFullMarketingMockMode()
  const response =
    mode === 'error'
      ? mockCommissionErrorEnvelope()
      : mode === 'empty'
        ? mockCommissionEmptyEnvelope(requestBody)
        : mockCommissionSuccessEnvelope(requestBody)

  if (response.code !== 0) throw new FullMarketingRequestError(response.message)
  return adaptCommission(response.data, filters, requestBody, 'mock', response)
}

function fetchMockDistribution(
  filters: FullMarketingDistributionFilters,
  requestBody: ReturnType<typeof createDistributionRequestBody>,
) {
  const mode = resolveFullMarketingMockMode()
  const response =
    mode === 'error'
      ? mockDistributionErrorEnvelope()
      : mode === 'empty'
        ? mockDistributionEmptyEnvelope(requestBody)
        : mockDistributionSuccessEnvelope(requestBody)

  if (response.code !== 0) throw new FullMarketingRequestError(response.message)
  return adaptDistribution(response.data, filters, requestBody, 'mock', response)
}

function adaptCommission(
  data: unknown,
  filters: FullMarketingCommissionFilters,
  requestBody: Record<string, unknown>,
  provider: FullMarketingProviderName,
  envelope?: TargetEnvelope | FullMarketingEnvelope<unknown> | null,
): FullMarketingViewModel {
  const record = readRecord(data)
  const list = readArray(record?.list).map(adaptCommissionRow).filter((row): row is FullMarketingCommissionRow => Boolean(row))
  const filteredRows = filterCommissionRows(list, filters)
  const pagination = {
    page: readNumber(record?.current) ?? readNumber(record?.pageNum) ?? filters.page,
    pageSize: readNumber(record?.size) ?? filters.pageSize,
    total: filteredRows.length,
  }

  return {
    tab: 'commission',
    provider,
    endpoint: fullMarketingCommissionEndpoint,
    requestBody,
    traceId: readString(envelope?.traceId) ?? `${provider}-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission`,
    timestamp: readString(envelope?.timestamp) ?? '2026-05-18T10:00:00+08:00',
    commission: {
      filters,
      rows: filteredRows,
      pagination,
    },
  }
}

function adaptDistribution(
  data: unknown,
  filters: FullMarketingDistributionFilters,
  requestBody: ReturnType<typeof createDistributionRequestBody>,
  provider: FullMarketingProviderName,
  envelope?: TargetEnvelope | FullMarketingEnvelope<unknown> | null,
): FullMarketingViewModel {
  const record = readRecord(data)
  const metric = readRecord(record?.metric)
  const productSale = readRecord(record?.productSale)
  const distributors = readRecord(record?.distributors)
  const productRows = readArray(productSale?.list)
    .map(adaptDistributionRow)
    .filter((row): row is FullMarketingDistributionRow => Boolean(row))
  const distributorRows = readArray(distributors?.list)
    .map(adaptDistributorRow)
    .filter((row): row is FullMarketingDistributorRow => Boolean(row))

  return {
    tab: 'distribution',
    provider,
    endpoint: fullMarketingDistributionMetricEndpoint,
    requestBody,
    traceId: readString(envelope?.traceId) ?? `${provider}-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution`,
    timestamp: readString(envelope?.timestamp) ?? '2026-05-18T10:00:00+08:00',
    distribution: {
      filters,
      metrics: {
        turnover: formatMoney(readNumber(metric?.turnover) ?? 0),
        commission: formatMoney(readNumber(metric?.commission) ?? 0),
      },
      productRows,
      distributorRows,
      pagination: {
        page: readNumber(productSale?.current) ?? readNumber(productSale?.pageNum) ?? filters.page,
        pageSize: readNumber(productSale?.size) ?? filters.pageSize,
        total: readNumber(productSale?.total) ?? productRows.length,
      },
    },
  }
}

function filterCommissionRows(rows: FullMarketingCommissionRow[], filters: FullMarketingCommissionFilters) {
  const keyword = filters.keyword.trim()
  return rows.filter((row) => {
    if (row.type !== filters.productType) return false
    if (keyword && !row.name.includes(keyword)) return false
    return true
  })
}

function adaptCommissionRow(value: unknown): FullMarketingCommissionRow | null {
  const record = readRecord(value)
  if (!record) return null
  const id = readString(record.productId) ?? readString(record.id)
  const name = readString(record.name)
  if (!id || !name) return null
  return {
    id,
    name,
    level: readString(record.level) ?? '-',
    indirectRatio: formatRatio(record.parentRatio),
    directRatio: formatRatio(record.directRatio),
    enabled: readBoolean(record.state),
    type: readProductType(record.type),
  }
}

function adaptDistributionRow(value: unknown): FullMarketingDistributionRow | null {
  const record = readRecord(value)
  if (!record) return null
  const id = readString(record.id) ?? readString(record.productId) ?? readString(record.name)
  const name = readString(record.name) ?? readString(record.productName)
  if (!id || !name) return null
  return {
    id,
    name,
    sales: readNumber(record.sales) ?? readNumber(record.saleNum) ?? 0,
    turnover: formatMoney(readNumber(record.turnover) ?? readNumber(record.amount) ?? 0),
    commission: formatMoney(readNumber(record.commission) ?? 0),
  }
}

function adaptDistributorRow(value: unknown): FullMarketingDistributorRow | null {
  const record = readRecord(value)
  if (!record) return null
  const id = readString(record.id) ?? readString(record.name)
  const name = readString(record.name) ?? readString(record.distributorName)
  if (!id || !name) return null
  return {
    id,
    name,
    sales: readNumber(record.sales) ?? 0,
    turnover: formatMoney(readNumber(record.turnover) ?? 0),
    commission: formatMoney(readNumber(record.commission) ?? 0),
  }
}

function mockCommissionSuccessEnvelope(requestBody: Record<string, unknown>): FullMarketingEnvelope<Record<string, unknown>> {
  return {
    code: 0,
    message: 'success',
    data: {
      total: 4,
      size: 20,
      current: 1,
      pageNum: 1,
      hasNextPage: false,
      pages: 1,
      list: [
        {
          productId: 'calendar-top-suite',
          campId,
          promotionPlanProductId: null,
          name: '顶层套房（浴缸巨幕电竞麻将）',
          mainPhotoMediaUrl: '',
          directRatio: null,
          parentRatio: null,
          type: 0,
          state: 0,
        },
        {
          productId: 'calendar-president-suite',
          campId,
          promotionPlanProductId: null,
          name: '总裁套间（桑拿浴缸露台电竞麻将）',
          mainPhotoMediaUrl: '',
          directRatio: null,
          parentRatio: null,
          type: 0,
          state: 0,
        },
        {
          productId: 'calendar-tianluo-suite',
          campId,
          promotionPlanProductId: null,
          name: '天落大床电竞套间',
          mainPhotoMediaUrl: '',
          directRatio: null,
          parentRatio: null,
          type: 0,
          state: 0,
        },
        {
          productId: 'calendar-cinema-room',
          campId,
          promotionPlanProductId: null,
          name: '观影大床房',
          mainPhotoMediaUrl: '',
          directRatio: null,
          parentRatio: null,
          type: 0,
          state: 0,
        },
        {
          productId: 'presale-tianluo-ticket',
          campId,
          promotionPlanProductId: null,
          name: '天落电竞套房预售券',
          mainPhotoMediaUrl: '',
          directRatio: 5,
          parentRatio: 2,
          type: 1,
          state: 1,
        },
      ],
      requestEcho: requestBody,
    },
    traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function mockCommissionEmptyEnvelope(requestBody: Record<string, unknown>) {
  return {
    ...mockCommissionSuccessEnvelope(requestBody),
    data: {
      ...mockCommissionSuccessEnvelope(requestBody).data,
      total: 0,
      list: [],
    },
    traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission-empty-001',
  }
}

function mockCommissionErrorEnvelope(): FullMarketingEnvelope<null> {
  return {
    code: 50001,
    message: '全员营销数据加载失败',
    data: null,
    traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-commission-error-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function mockDistributionSuccessEnvelope(
  requestBody: ReturnType<typeof createDistributionRequestBody>,
): FullMarketingEnvelope<Record<string, unknown>> {
  return {
    code: 0,
    message: 'success',
    data: {
      metric: { turnover: 0, commission: 0 },
      productSale: {
        total: 0,
        size: 10,
        current: 1,
        pageNum: 1,
        hasNextPage: false,
        pages: 0,
        list: [],
      },
      distributors: {
        total: 0,
        size: 10,
        current: 1,
        pageNum: 1,
        hasNextPage: false,
        pages: 0,
        list: [],
      },
      requestEcho: requestBody,
    },
    traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function mockDistributionEmptyEnvelope(requestBody: ReturnType<typeof createDistributionRequestBody>) {
  return {
    ...mockDistributionSuccessEnvelope(requestBody),
    traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution-empty-001',
  }
}

function mockDistributionErrorEnvelope(): FullMarketingEnvelope<null> {
  return {
    code: 50002,
    message: '全员营销数据加载失败',
    data: null,
    traceId: 'mock-scrm--yingxiao-tuiguang--quanyuan-yingxiao-distribution-error-001',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

async function readJson(response: Response): Promise<TargetEnvelope | null> {
  try {
    return (await response.json()) as TargetEnvelope
  } catch {
    return null
  }
}

function isFailedResponse(payload: TargetEnvelope | null) {
  if (!payload) return false
  if (payload.code !== undefined) return payload.code !== 0
  return payload.success === false
}

function extractErrorMessage(payload: TargetEnvelope | null) {
  if (!payload) return null
  return payload.message ?? payload.errorMsg ?? payload.errorCode ?? null
}

function resolveFullMarketingProviderName(explicitProvider?: FullMarketingProviderName): FullMarketingProviderName {
  const configured =
    explicitProvider ||
    readRuntimeConfig('pms.fullMarketingProvider') ||
    (import.meta.env.VITE_PMS_FULL_MARKETING_PROVIDER as string | undefined)
  return configured === 'api' ? 'api' : 'mock'
}

function resolveFullMarketingMockMode(): FullMarketingMockMode {
  const configured =
    readRuntimeConfig('pms.fullMarketingMockMode') ||
    (import.meta.env.VITE_PMS_FULL_MARKETING_MOCK_MODE as string | undefined)
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function readRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value)
  return null
}

function readBoolean(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true'
}

function readProductType(value: unknown): FullMarketingProductType {
  return value === 1 || value === '1' || value === 'presale' ? 'presale' : 'calendar'
}

function formatRatio(value: unknown) {
  const numberValue = readNumber(value)
  return numberValue === null ? '-%' : `${numberValue}%`
}

function formatMoney(value: number) {
  return value === 0 ? '0' : `¥${value.toLocaleString('zh-CN')}`
}

function toExclusiveEndDate(date: string) {
  const parsed = new Date(`${date}T00:00:00+08:00`)
  if (Number.isNaN(parsed.getTime())) return date
  parsed.setDate(parsed.getDate() + 1)
  const year = parsed.getFullYear()
  const month = `${parsed.getMonth() + 1}`.padStart(2, '0')
  const day = `${parsed.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
