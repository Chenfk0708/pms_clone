const HUDSON_BASE_URL = '/api'
const DEFAULT_CAMP_ID = 'mock-camp-main'
const EXPORT_EXCEL_MENU_ID = '1744634863299338249'
const PROVIDER_STORAGE_KEY = 'pms.profitReport.provider'
const FIXED_TIMESTAMP = '2026-05-19T10:00:00+08:00'

export const profitReportEndpoint = '/report/profit/get/v2'
export const profitReportStoreEndpoint = '/select/poi/page/get'
export const profitReportRoomCategoryEndpoint = '/select/roomCategory/page/get'
export const profitReportChannelEndpoint = '/select/calChannel4Order/get'
export const profitReportRoomGroupEndpoint = '/roomCategoryGroups/get'
export const profitReportExportEndpoint = '/statistics/profit-report/export'
export const profitReportExportPath = '/api/statistics/profit-report/export'

type ProviderMode = 'mock' | 'api'

export type ProfitMockState = 'success' | 'empty' | 'error'

export type ProfitReportOption = {
  id: string
  label: string
}

export type ProfitReportDescription = {
  field: string
  detail: string
}

export type ProfitReportFilters = {
  campId: string
  startDate: string
  endDate: string
  pageNum: number
  pageSize: number
  storeId: string
  roomCategoryId?: string
  channelId?: string
  roomGroupId?: string
  includeCleanCost: boolean
  mockState?: ProfitMockState
}

export type ProfitReportRow = {
  date: string
  isTotal: boolean
  roomFeeMinusCommission: string
  ticketPrice: string
  cateringPrice: string
  otherOrderExpense: string
  writeDownIncome: string
  totalIncome: string
  writeDownExpenses: string
  cleanCost: string
  profitPrice: string
  profitRate: string
}

export type ProfitReportDashboard = {
  provider: ProviderMode
  requestBody: Record<string, unknown>
  rows: ProfitReportRow[]
  total: number
  pageNum: number
  pageSize: number
  pageCount: number
  stores: ProfitReportOption[]
  roomCategories: ProfitReportOption[]
  channels: ProfitReportOption[]
  roomGroups: ProfitReportOption[]
  descriptions: ProfitReportDescription[]
  traceId: string
}

export type ProfitExportTask = {
  taskId: string
  path: string
  requestBody: Record<string, unknown>
  downloadUrl?: string
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
  errorCode?: string | number | null
  errorMsg?: string | null
  errorDetail?: string | null
  data?: T
}

type HudsonPagePayload = {
  total?: unknown
  size?: unknown
  current?: unknown
  pageNum?: unknown
  pages?: unknown
  list?: unknown
}

type MockDashboardPayload = {
  rows: Array<Record<string, unknown>>
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  stores: ProfitReportOption[]
  roomCategories: ProfitReportOption[]
  channels: ProfitReportOption[]
  roomGroups: ProfitReportOption[]
  descriptions: ProfitReportDescription[]
}

const storeOptions: ProfitReportOption[] = [
  { id: 'all', label: '全部门店' },
  { id: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const roomCategoryOptions: ProfitReportOption[] = [
  { id: '1796425098965729282', label: '观影大床房' },
  { id: '1796425099242553345', label: '天落大床电竞套间' },
  { id: '1796425099485822977', label: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { id: '1796425099729092609', label: '顶层套房（浴缸巨幕电竞麻将）' },
]

const channelOptions: ProfitReportOption[] = [
  { id: 'zilaike', label: '自来客' },
  { id: 'localhome', label: '路客云聚合' },
  { id: 'meituan-minsu', label: '美团民宿' },
  { id: 'meituan-hotel', label: '美团酒店' },
  { id: 'tujia', label: '途家' },
  { id: 'feizhu', label: '飞猪淘酒店' },
  { id: 'xiaozhu', label: '小猪' },
  { id: 'muniao', label: '木鸟' },
  { id: 'ctrip', label: '携程' },
]

const roomGroupOptions: ProfitReportOption[] = []

const descriptions: ProfitReportDescription[] = [
  { field: '房费(减佣)', detail: '房费(含佣)减去渠道佣金后的净房费收入。' },
  { field: '门票', detail: '订单内门票销售收入减去退款后的实际收入。' },
  { field: '餐饮', detail: '订单内餐饮消费收入减去退款后的实际收入。' },
  { field: '其他消费', detail: '订单内除房费、门票、餐饮外的其他消费收入。' },
  { field: '记一笔收入', detail: '通过记一笔录入的额外收入。' },
  { field: '记一笔支出', detail: '通过记一笔录入的运营支出；勾选包含保洁费用时包含保洁成本。' },
  { field: '利润', detail: '总收入减去记一笔支出和保洁费用后的利润。' },
  { field: '利润率', detail: '利润除以总收入，按百分比展示。' },
]

const pageOneRows = [
  createRow('合计', 11362.58, 0, 0, 0, 0, 11362.58, 0, 11362.58, true),
  createRow('2026-05-01', 966.87, 0, 0, 0, 0, 966.87, 0, 966.87),
  createRow('2026-05-02', 682, 0, 0, 0, 0, 682, 0, 682),
  createRow('2026-05-03', 791.8, 0, 0, 0, 0, 791.8, 0, 791.8),
  createRow('2026-05-04', 895.3, 0, 0, 0, 0, 895.3, 0, 895.3),
  createRow('2026-05-05', 623.21, 0, 0, 0, 0, 623.21, 0, 623.21),
  createRow('2026-05-06', 160.28, 0, 0, 0, 0, 160.28, 0, 160.28),
  createRow('2026-05-07', 163.94, 0, 0, 0, 0, 163.94, 0, 163.94),
  createRow('2026-05-08', 182.81, 0, 0, 0, 0, 182.81, 0, 182.81),
  createRow('2026-05-09', 182.81, 0, 0, 0, 0, 182.81, 0, 182.81),
  createRow('2026-05-10', 302.59, 0, 0, 0, 0, 302.59, 0, 302.59),
  createRow('2026-05-11', 327.88, 0, 0, 0, 0, 327.88, 0, 327.88),
  createRow('2026-05-12', 497.7, 0, 0, 0, 0, 497.7, 0, 497.7),
  createRow('2026-05-13', 819.13, 0, 0, 0, 0, 819.13, 0, 819.13),
  createRow('2026-05-14', 505.82, 0, 0, 0, 0, 505.82, 0, 505.82),
  createRow('2026-05-15', 249.52, 0, 0, 0, 0, 249.52, 0, 249.52),
  createRow('2026-05-16', 1262.15, 0, 0, 0, 0, 1262.15, 0, 1262.15),
  createRow('2026-05-17', 595.18, 0, 0, 0, 0, 595.18, 0, 595.18),
  createRow('2026-05-18', 510.93, 0, 0, 0, 0, 510.93, 0, 510.93),
  createRow('2026-05-19', 508.29, 0, 0, 0, 0, 508.29, 0, 508.29),
]

const pageTwoRows = [
  createRow('2026-04-30', 418.18, 0, 0, 0, 0, 418.18, 0, 418.18),
  createRow('2026-04-29', 522.36, 0, 0, 0, 0, 522.36, 0, 522.36),
  createRow('2026-04-28', 388.22, 0, 0, 0, 0, 388.22, 0, 388.22),
  createRow('2026-04-27', 305.48, 0, 0, 0, 0, 305.48, 0, 305.48),
  createRow('2026-04-26', 296.5, 0, 0, 0, 0, 296.5, 0, 296.5),
  createRow('2026-04-25', 482.66, 0, 0, 0, 0, 482.66, 0, 482.66),
  createRow('2026-04-24', 446.12, 0, 0, 0, 0, 446.12, 0, 446.12),
  createRow('2026-04-23', 337.95, 0, 0, 0, 0, 337.95, 0, 337.95),
  createRow('2026-04-22', 598.43, 0, 0, 0, 0, 598.43, 0, 598.43),
  createRow('2026-04-21', 274.44, 0, 0, 0, 0, 274.44, 0, 274.44),
  createRow('2026-04-20', 654.28, 0, 0, 0, 0, 654.28, 0, 654.28),
  createRow('2026-04-19', 415.9, 0, 0, 0, 0, 415.9, 0, 415.9),
]

export function getProfitReportStaticLookups() {
  return {
    stores: storeOptions,
    roomCategories: roomCategoryOptions,
    channels: channelOptions,
    roomGroups: roomGroupOptions,
    descriptions,
  }
}

export function getDefaultProfitReportFilters(): ProfitReportFilters {
  const monthRange = getCurrentMonthRange()
  return {
    campId: resolveProfitReportCampId(),
    startDate: monthRange.start,
    endDate: monthRange.end,
    pageNum: 1,
    pageSize: 20,
    storeId: storeOptions[0].id,
    includeCleanCost: false,
    mockState: 'success',
  }
}

export function getCurrentMonthRange(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]))
  const year = Number(parts.year)
  const month = Number(parts.month)
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return {
    start: `${parts.year}-${parts.month}-01`,
    end: `${parts.year}-${parts.month}-${String(lastDay).padStart(2, '0')}`,
  }
}

export function resolveProfitReportCampId() {
  const params = new URLSearchParams(window.location.search)
  return (
    params.get('campId') ||
    window.localStorage.getItem('pmsCampId') ||
    (import.meta.env.VITE_PMS_CAMP_ID as string | undefined) ||
    DEFAULT_CAMP_ID
  )
}

export function resolveProfitReportProvider(): ProviderMode {
  const params = readProfitReportSearchParams()
  const rawProvider =
    params.get('provider') ??
    params.get('profitProvider') ??
    (import.meta.env.VITE_PMS_PROFIT_REPORT_PROVIDER as string | undefined) ??
    window.localStorage.getItem(PROVIDER_STORAGE_KEY) ??
    'mock'

  return rawProvider === 'api' || rawProvider === 'real' ? 'api' : 'mock'
}

export async function fetchProfitReportDashboard(
  filters: ProfitReportFilters,
  signal?: AbortSignal,
): Promise<ProfitReportDashboard> {
  const provider = resolveProfitReportProvider()
  if (provider === 'api') {
    return fetchApiDashboard(filters, signal)
  }

  const envelope = await fetchMockDashboard(filters)
  return adaptMockDashboard(envelope, filters)
}

export async function createProfitReportExportTask(filters: ProfitReportFilters): Promise<ProfitExportTask> {
  const requestBody = createProfitReportExportRequestBody(filters)

  if (resolveProfitReportProvider() === 'api') {
    const payload = asRecord(await postHudson<unknown>(profitReportExportEndpoint, requestBody))
    const taskId = String(payload.taskId ?? '').trim()
    if (!taskId) {
      throw new Error('?????????? taskId')
    }

    return {
      taskId,
      path: profitReportExportPath,
      requestBody,
      downloadUrl: typeof payload.downloadUrl === 'string' ? payload.downloadUrl : undefined,
    }
  }

  return {
    taskId: `PROFIT-EXPORT-${String(filters.pageNum)}-${filters.startDate.replaceAll('-', '')}`,
    path: profitReportExportPath,
    requestBody,
    downloadUrl: `https://oss.localhome.cn/mock/${filters.startDate}-profit-report.xlsx`,
  }
}

export function createProfitReportRequestBody(filters: ProfitReportFilters) {
  return {
    campId: filters.campId || DEFAULT_CAMP_ID,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    current: filters.pageNum,
    startDate: filters.startDate,
    endDate: filters.endDate,
    breakTemp: false,
    isCleanCost: filters.includeCleanCost ? 1 : 0,
  }
}

function createProfitReportExportRequestBody(filters: ProfitReportFilters) {
  return {
    ...createProfitReportRequestBody(filters),
    pageSize: 9999,
    exportExcelMenuId: EXPORT_EXCEL_MENU_ID,
  }
}

async function fetchMockDashboard(filters: ProfitReportFilters): Promise<UnifiedEnvelope<MockDashboardPayload>> {
  const requestBody = createProfitReportRequestBody(filters)
  const mockState = filters.mockState ?? 'success'

  if (mockState === 'error') {
    return createEnvelope(
      5001,
      '利润报表数据加载失败，请稍后重试',
      createEmptyPayload(filters.pageNum, filters.pageSize),
      'error',
    )
  }

  const rows = mockState === 'empty' ? [] : selectRows(filters)
  const total = mockState === 'empty' ? 0 : 32
  return createEnvelope(
    0,
    'success',
    {
      rows,
      pagination: {
        page: filters.pageNum,
        pageSize: filters.pageSize,
        total,
      },
      stores: storeOptions,
      roomCategories: roomCategoryOptions,
      channels: channelOptions,
      roomGroups: roomGroupOptions,
      descriptions,
    },
    `success-${requestBody.pageNum}`,
  )
}

function createEmptyPayload(page: number, pageSize: number): MockDashboardPayload {
  return {
    rows: [],
    pagination: { page, pageSize, total: 0 },
    stores: storeOptions,
    roomCategories: roomCategoryOptions,
    channels: channelOptions,
    roomGroups: roomGroupOptions,
    descriptions,
  }
}

function createEnvelope<T>(code: number, message: string, data: T, suffix: string): UnifiedEnvelope<T> {
  return {
    code,
    message,
    data,
    traceId: `mock-baobiao--tongji-baobiao--lirun-baobiao-${suffix}`,
    timestamp: FIXED_TIMESTAMP,
  }
}

function adaptMockDashboard(
  envelope: UnifiedEnvelope<MockDashboardPayload>,
  filters: ProfitReportFilters,
): ProfitReportDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message)
  }

  return {
    provider: 'mock',
    requestBody: createProfitReportRequestBody(filters),
    rows: envelope.data.rows.map(adaptMockRow),
    total: envelope.data.pagination.total,
    pageNum: envelope.data.pagination.page,
    pageSize: envelope.data.pagination.pageSize,
    pageCount: Math.max(1, Math.ceil(envelope.data.pagination.total / envelope.data.pagination.pageSize)),
    stores: envelope.data.stores,
    roomCategories: envelope.data.roomCategories,
    channels: envelope.data.channels,
    roomGroups: envelope.data.roomGroups,
    descriptions: envelope.data.descriptions,
    traceId: envelope.traceId,
  }
}

async function fetchApiDashboard(filters: ProfitReportFilters, signal?: AbortSignal): Promise<ProfitReportDashboard> {
  const requestBody = createProfitReportRequestBody(filters)
  const [storesPayload, roomCategoriesPayload, channelsPayload, roomGroupsPayload, reportPayload] = await Promise.all([
    postHudson<HudsonPagePayload>(
      profitReportStoreEndpoint,
      { campId: filters.campId, pageSize: 999, pageNum: 1, channelId: 0, isAvailability: '1' },
      signal,
    ),
    postHudson<HudsonPagePayload>(
      profitReportRoomCategoryEndpoint,
      { campId: filters.campId, pageNum: 1, pageSize: 9999, isAvailability: 1, channelId: 0 },
      signal,
    ),
    postHudson<{ select?: unknown }>(profitReportChannelEndpoint, { campId: filters.campId }, signal),
    postHudson<{ roomCategoryGroups?: unknown }>(profitReportRoomGroupEndpoint, { campId: filters.campId }, signal),
    postHudson<HudsonPagePayload>(profitReportEndpoint, requestBody, signal),
  ])

  const rows = Array.isArray(reportPayload.list) ? reportPayload.list.map(asRecord).map(adaptApiRow) : []
  const total = toNumber(reportPayload.total, rows.length)
  const pageNum = toNumber(reportPayload.pageNum ?? reportPayload.current, filters.pageNum)
  const pageSize = toNumber(reportPayload.size, filters.pageSize)

  return {
    provider: 'api',
    requestBody,
    rows,
    total,
    pageNum,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / Math.max(pageSize, 1))),
    stores: adaptStoreOptions(storesPayload),
    roomCategories: adaptRoomCategoryOptions(roomCategoriesPayload),
    channels: adaptChannelOptions(channelsPayload),
    roomGroups: adaptRoomGroupOptions(roomGroupsPayload),
    descriptions,
    traceId: 'api-baobiao--tongji-baobiao--lirun-baobiao',
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  const payload = (await readJson(response)) as HudsonEnvelope<T> | null
  if (!response.ok) {
    throw new Error(`利润报表数据加载失败，HTTP ${response.status}`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('利润报表数据响应格式异常')
  }
  if (payload.success !== true) {
    throw new Error(extractErrorMessage(payload) || '利润报表数据加载失败，请稍后重试')
  }
  if (payload.data === undefined) {
    throw new Error('利润报表数据响应缺少 data 字段')
  }

  return payload.data
}

function adaptStoreOptions(payload: HudsonPagePayload): ProfitReportOption[] {
  const list = Array.isArray(payload.list) ? payload.list.map(asRecord) : []
  return [{ id: 'all', label: '全部门店' }].concat(
    list.map((item, index) => ({
      id: String(item.poiId ?? `poi-${index}`),
      label: String(item.poiName ?? `门店 ${index + 1}`),
    })),
  )
}

function adaptRoomCategoryOptions(payload: HudsonPagePayload): ProfitReportOption[] {
  const list = Array.isArray(payload.list) ? payload.list.map(asRecord) : []
  return list.map((item, index) => ({
    id: String(item.channelRoomCategoryId ?? item.roomCategoryId ?? `room-category-${index}`),
    label: String(item.name ?? item.parentRoomCategoryName ?? `房型 ${index + 1}`),
  }))
}

function adaptChannelOptions(payload: { select?: unknown }): ProfitReportOption[] {
  const list = Array.isArray(payload.select) ? payload.select.map(asRecord) : []
  return list.map((item, index) => ({
    id: String(item.channelId ?? `channel-${index}`),
    label: String(item.channelName ?? `渠道 ${index + 1}`),
  }))
}

function adaptRoomGroupOptions(payload: { roomCategoryGroups?: unknown }): ProfitReportOption[] {
  const list = Array.isArray(payload.roomCategoryGroups) ? payload.roomCategoryGroups.map(asRecord) : []
  return list.map((item, index) => ({
    id: String(item.roomCategoryGroupId ?? item.id ?? `room-group-${index}`),
    label: String(item.roomCategoryGroupName ?? item.name ?? `房型分组 ${index + 1}`),
  }))
}

function adaptApiRow(row: Record<string, unknown>): ProfitReportRow {
  const cleanCost = toNumber(row.cleanCost, 0)
  const writeDownExpenses = toNumber(row.writeDownExpenses, 0)

  return {
    date: String(row.date ?? '-'),
    isTotal: toNumber(row.isTotal, 0) === 1,
    roomFeeMinusCommission: formatMoney(row.roomFeeMinusCommission),
    ticketPrice: formatMoney(row.ticketPrice),
    cateringPrice: formatMoney(row.cateringPrice),
    otherOrderExpense: formatMoney(row.otherOrderExpense),
    writeDownIncome: formatMoney(row.writeDownIncome),
    totalIncome: formatMoney(row.totalIncome),
    writeDownExpenses: formatMoney(writeDownExpenses + cleanCost),
    cleanCost: formatMoney(cleanCost),
    profitPrice: formatMoney(row.profitPrice),
    profitRate: String(row.profitRate ?? '0.00%'),
  }
}

function adaptMockRow(row: Record<string, unknown>): ProfitReportRow {
  return {
    date: String(row.date ?? '-'),
    isTotal: Boolean(row.isTotal),
    roomFeeMinusCommission: String(row.roomFeeMinusCommission ?? '0'),
    ticketPrice: String(row.ticketPrice ?? '0'),
    cateringPrice: String(row.cateringPrice ?? '0'),
    otherOrderExpense: String(row.otherOrderExpense ?? '0'),
    writeDownIncome: String(row.writeDownIncome ?? '0'),
    totalIncome: String(row.totalIncome ?? '0'),
    writeDownExpenses: String(row.writeDownExpenses ?? '0'),
    cleanCost: String(row.cleanCost ?? '0'),
    profitPrice: String(row.profitPrice ?? '0'),
    profitRate: String(row.profitRate ?? '0.00%'),
  }
}

function selectRows(filters: ProfitReportFilters) {
  const baseRows = filters.pageNum === 1 ? pageOneRows : pageTwoRows
  if (!filters.includeCleanCost) {
    return baseRows
  }

  return baseRows.map((row) => {
    if (row.isTotal) {
      return {
        ...row,
        writeDownExpenses: '186.40',
        cleanCost: '186.40',
        profitPrice: '11176.18',
        profitRate: '98.36%',
      }
    }

    const cleanCost = row.date === '2026-05-19' ? 18.6 : row.date === '2026-04-30' ? 12.4 : 9.8
    const nextProfit = Math.max(Number(row.profitPrice) - cleanCost, 0)
    return {
      ...row,
      writeDownExpenses: cleanCost.toFixed(2),
      cleanCost: cleanCost.toFixed(2),
      profitPrice: trimFixed(nextProfit),
      profitRate: calculateRate(nextProfit, Number(row.totalIncome)),
    }
  })
}

function createRow(
  date: string,
  roomFeeMinusCommission: number,
  ticketPrice: number,
  cateringPrice: number,
  otherOrderExpense: number,
  writeDownIncome: number,
  totalIncome: number,
  writeDownExpenses: number,
  profitPrice: number,
  isTotal = false,
): Record<string, unknown> {
  return {
    date,
    isTotal,
    roomFeeMinusCommission: trimFixed(roomFeeMinusCommission),
    ticketPrice: trimFixed(ticketPrice),
    cateringPrice: trimFixed(cateringPrice),
    otherOrderExpense: trimFixed(otherOrderExpense),
    writeDownIncome: trimFixed(writeDownIncome),
    totalIncome: trimFixed(totalIncome),
    writeDownExpenses: trimFixed(writeDownExpenses),
    cleanCost: '0',
    profitPrice: trimFixed(profitPrice),
    profitRate: calculateRate(profitPrice, totalIncome),
  }
}

function trimFixed(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '')
}

function calculateRate(profit: number, income: number) {
  if (income <= 0) {
    return '0.00%'
  }
  return `${((profit / income) * 100).toFixed(2)}%`
}

function formatMoney(value: unknown) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) {
    return '0'
  }
  return trimFixed(numeric)
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function extractErrorMessage(payload: HudsonEnvelope<unknown>) {
  return String(payload.errorMsg ?? payload.errorDetail ?? payload.errorCode ?? '').trim()
}

function readProfitReportSearchParams() {
  if (typeof window === 'undefined') return new URLSearchParams()
  const hashQuery = window.location.hash.split('?')[1]
  return new URLSearchParams(hashQuery ? `?${hashQuery}` : window.location.search)
}
