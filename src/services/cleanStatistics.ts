export const cleanStatisticsEndpoint = 'https://hudson-prod.localhome.cn/cleanTask/statistics'
export const cleanCleanerEndpoint = 'https://hudson-prod.localhome.cn/cleaner/list/get'
export const cleanRoomCategoriesEndpoint = 'https://hudson-prod.localhome.cn/roomCategories/page/get'
export const cleanRoomsEndpoint = 'https://hudson-prod.localhome.cn/rooms/get'

export const cleanStatisticsContractPath = '/api/clean/statistics/dashboard'
export const cleanStatisticsExportPath = '/api/clean/statistics/export'

type ProviderMode = 'mock' | 'api'
export type CleanMockState = 'success' | 'empty' | 'error'

export type CleanStatisticsFilters = {
  campId: string
  startDate: string
  endDate: string
  pageNum: number
  pageSize: number
  storeId?: string
  roomIds?: string[]
  cleanerIds?: string[]
  mockState?: CleanMockState
}

export type CleanSummaryRow = {
  date: string
  checkoutCount: number
  checkoutFee: string
  stayCount: number
  stayFee: string
  departureCount: number
  departureFee: string
  deepCount: number
  deepFee: string
  totalCount: number
  totalFee: string
}

export type CleanDetailRow = {
  id: string
  cleanDate: string
  roomName: string
  cleanerName: string
  cleanType: string
  fee: string
  status: '已完成' | '待验收' | '已派单'
}

export type CleanMetric = {
  id: string
  label: string
  value: string
  unit: string
  trend: string
  description: string
}

export type CleanTodo = {
  id: string
  title: string
  count: number
  action: string
}

export type CleanLookupOption = {
  id: string
  label: string
}

export type CleanStatisticsData = {
  rows: CleanSummaryRow[]
  detailRows: CleanDetailRow[]
  metrics: CleanMetric[]
  todos: CleanTodo[]
  total: number
  pageNum: number
  pageSize: number
  requestBody: Record<string, unknown>
}

export type CleanStatisticsDashboard = {
  statistics: CleanStatisticsData
  stores: CleanLookupOption[]
  rooms: CleanLookupOption[]
  cleaners: CleanLookupOption[]
}

type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HudsonPayload = {
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
  data?: unknown
}

type MockDashboardPayload = {
  statistics: {
    list: Record<string, unknown>[]
    detailList: Record<string, unknown>[]
    metrics: CleanMetric[]
    todos: CleanTodo[]
    pagination: {
      page: number
      pageSize: number
      total: number
    }
  }
  stores: CleanLookupOption[]
  cleaners: CleanLookupOption[]
  rooms: CleanLookupOption[]
}

const defaultCampId = 'mock-camp-main'
const fixedTimestamp = '2026-05-18T10:00:00+08:00'

const storeOptions: CleanLookupOption[] = [
  { id: 'all', label: '全部门店' },
  { id: 'qianhai', label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const cleanerOptions: CleanLookupOption[] = [
  { id: 'cleaner-1', label: '李清清' },
  { id: 'cleaner-2', label: '王明洁' },
  { id: 'cleaner-3', label: '周晨' },
]

const roomOptions: CleanLookupOption[] = [
  { id: 'room-1', label: '观影大床房 房间1' },
  { id: 'room-2', label: '顶层套房（浴缸巨幕电竞麻将） 房间1' },
  { id: 'room-3', label: '天落大床电竞套间 房间2' },
]

const summaryList = [
  {
    cleanTime: '合计',
    countNum: 186,
    countCost: 1288600,
    cleanTypeOneNum: 68,
    cleanTypeOneCost: 448800,
    cleanTypeTwoNum: 74,
    cleanTypeTwoCost: 421800,
    cleanTypeThreeNum: 38,
    cleanTypeThreeCost: 342000,
    cleanTypeFourNum: 6,
    cleanTypeFourCost: 76000,
  },
  {
    cleanTime: '2026-05-16',
    countNum: 3,
    countCost: 18800,
    cleanTypeOneNum: 1,
    cleanTypeOneCost: 6600,
    cleanTypeTwoNum: 2,
    cleanTypeTwoCost: 12200,
    cleanTypeThreeNum: 0,
    cleanTypeThreeCost: 0,
    cleanTypeFourNum: 0,
    cleanTypeFourCost: 0,
  },
  {
    cleanTime: '2026-05-17',
    countNum: 5,
    countCost: 35600,
    cleanTypeOneNum: 2,
    cleanTypeOneCost: 13200,
    cleanTypeTwoNum: 1,
    cleanTypeTwoCost: 6100,
    cleanTypeThreeNum: 2,
    cleanTypeThreeCost: 16300,
    cleanTypeFourNum: 0,
    cleanTypeFourCost: 0,
  },
]

const detailList = [
  {
    id: 'CL20260516001',
    cleanDate: '2026-05-16',
    roomName: '观影大床房 房间1',
    cleanerName: '李清清',
    cleanType: '扫尘保洁',
    fee: 6600,
    status: '已完成',
  },
  {
    id: 'CL20260516002',
    cleanDate: '2026-05-16',
    roomName: '顶层套房（浴缸巨幕电竞麻将） 房间1',
    cleanerName: '王明洁',
    cleanType: '续住保洁',
    fee: 6100,
    status: '待验收',
  },
  {
    id: 'CL20260516003',
    cleanDate: '2026-05-16',
    roomName: '天落大床电竞套间 房间2',
    cleanerName: '周晨',
    cleanType: '续住保洁',
    fee: 6100,
    status: '已派单',
  },
]

const metrics: CleanMetric[] = [
  { id: 'month-count', label: '本月保洁', value: '186', unit: '次', trend: '较上月 +12%', description: '本月全部保洁任务完成量' },
  { id: 'month-fee', label: '保洁费用', value: '12,886.00', unit: '元', trend: '费用率 8.4%', description: '按目标站金额字段汇总' },
  { id: 'pass-rate', label: '验收通过率', value: '96.8', unit: '%', trend: '连续 7 天稳定', description: '已完成任务的验收通过比例' },
  { id: 'pending', label: '待处理', value: '7', unit: '项', trend: '今日需跟进', description: '待派单、待验收和异常提醒' },
]

const todos: CleanTodo[] = [
  { id: 'today-checkout', title: '今日退房保洁', count: 5, action: '查看房态' },
  { id: 'pending-acceptance', title: '待验收任务', count: 2, action: '查看明细' },
  { id: 'staff-schedule', title: '保洁员排班', count: 3, action: '查看人员' },
]

export function getCurrentMonthRange(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(formatter.formatToParts(now).map((part) => [part.type, part.value]))
  const today = `${parts.year}-${parts.month}-${parts.day}`
  return { start: `${parts.year}-${parts.month}-01`, end: today }
}

export function getDefaultCleanStatisticsFilters(): CleanStatisticsFilters {
  const range = getCurrentMonthRange()
  return {
    campId: defaultCampId,
    startDate: range.start,
    endDate: range.end,
    pageNum: 1,
    pageSize: 20,
    storeId: 'all',
    roomIds: [],
    cleanerIds: [],
    mockState: 'success',
  }
}

export function createCleanStatisticsRequestBody(filters: CleanStatisticsFilters): Record<string, unknown> {
  return {
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    campId: filters.campId || defaultCampId,
    storeId: filters.storeId || 'all',
    roomIds: filters.roomIds ?? [],
    cleanerIds: filters.cleanerIds ?? [],
    cleanStartTime: startOfShanghaiDay(filters.startDate),
    cleanEndTime: endOfShanghaiDay(filters.endDate),
  }
}

export async function fetchCleanStatisticsDashboard(
  filters: CleanStatisticsFilters,
  signal?: AbortSignal,
): Promise<CleanStatisticsDashboard> {
  if (resolveProviderMode() === 'api') {
    return fetchApiDashboard(filters, signal)
  }

  const envelope = await fetchMockDashboard(filters)
  return adaptDashboard(envelope, createCleanStatisticsRequestBody(filters))
}

export async function createCleanStatisticsExportTask(filters: CleanStatisticsFilters) {
  const requestBody = createCleanStatisticsRequestBody(filters)
  return {
    taskId: `CLEAN-EXPORT-${String(requestBody.cleanStartTime).slice(-6)}`,
    path: cleanStatisticsExportPath,
    requestBody,
  }
}

function resolveProviderMode(): ProviderMode {
  return import.meta.env.VITE_PMS_CLEAN_STATISTICS_PROVIDER === 'api' ? 'api' : 'mock'
}

async function fetchMockDashboard(filters: CleanStatisticsFilters): Promise<UnifiedEnvelope<MockDashboardPayload>> {
  const requestBody = createCleanStatisticsRequestBody(filters)

  if (filters.mockState === 'error') {
    return makeEnvelope(5001, '数据加载失败，请稍后重试', emptyPayload(), 'error', requestBody)
  }

  if (filters.mockState === 'empty') {
    return makeEnvelope(0, 'success', emptyPayload(), 'empty', requestBody)
  }

  return makeEnvelope(
    0,
    'success',
    {
      statistics: {
        list: summaryList,
        detailList,
        metrics,
        todos,
        pagination: {
          page: filters.pageNum,
          pageSize: filters.pageSize,
          total: summaryList.length,
        },
      },
      stores: storeOptions,
      cleaners: cleanerOptions,
      rooms: filterOptions(roomOptions, filters.roomIds),
    },
    'success',
    requestBody,
  )
}

function makeEnvelope<T>(
  code: number,
  message: string,
  data: T,
  suffix: string,
  requestBody: Record<string, unknown>,
): UnifiedEnvelope<T> {
  return {
    code,
    message,
    data,
    traceId: `mock-fangtai--baojie-guanli--baojie-tongji-${suffix}-${requestBody.pageNum}`,
    timestamp: fixedTimestamp,
  }
}

function emptyPayload(): MockDashboardPayload {
  return {
    statistics: {
      list: [],
      detailList: [],
      metrics: metrics.map((item) => ({ ...item, value: item.id === 'pass-rate' ? '0' : '0', trend: '暂无待处理变化' })),
      todos: [],
      pagination: { page: 1, pageSize: 20, total: 0 },
    },
    stores: storeOptions,
    cleaners: cleanerOptions,
    rooms: roomOptions,
  }
}

function adaptDashboard(
  envelope: UnifiedEnvelope<MockDashboardPayload>,
  requestBody: Record<string, unknown>,
): CleanStatisticsDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message)
  }

  const statistics = envelope.data.statistics
  return {
    stores: envelope.data.stores,
    cleaners: envelope.data.cleaners,
    rooms: envelope.data.rooms,
    statistics: {
      requestBody,
      rows: statistics.list.map(adaptSummaryRow),
      detailRows: statistics.detailList.map(adaptDetailRow),
      metrics: statistics.metrics,
      todos: statistics.todos,
      total: statistics.pagination.total,
      pageNum: statistics.pagination.page,
      pageSize: statistics.pagination.pageSize,
    },
  }
}

async function fetchApiDashboard(filters: CleanStatisticsFilters, signal?: AbortSignal): Promise<CleanStatisticsDashboard> {
  const requestBody = createCleanStatisticsRequestBody(filters)
  const [statisticsPayload, cleanersPayload, roomCategoriesPayload] = await Promise.all([
    postHudson(cleanStatisticsEndpoint, requestBody, signal),
    postHudson(cleanCleanerEndpoint, { campId: requestBody.campId }, signal),
    postHudson(
      cleanRoomCategoriesEndpoint,
      { campId: requestBody.campId, pageSize: 999, pageNum: 1, roomCategoryName: '', keyword: '', cityIds: [], channelId: '' },
      signal,
    ),
  ])

  const statisticsRecord = asRecord(statisticsPayload)
  const roomCategories = adaptRoomCategories(roomCategoriesPayload)
  const roomsPayload = roomCategories.length
    ? await postHudson(cleanRoomsEndpoint, { campId: requestBody.campId, roomCategoryIds: roomCategories.map((item) => item.id), saleType: 1 }, signal)
    : { roomCategoryRooms: [] }
  const rows = Array.isArray(statisticsRecord.list) ? statisticsRecord.list.map(asRecord) : []

  return {
    stores: storeOptions,
    cleaners: adaptCleaners(cleanersPayload),
    rooms: adaptRooms(roomsPayload),
    statistics: {
      requestBody,
      rows: rows.map(adaptSummaryRow),
      detailRows: [],
      metrics,
      todos,
      total: toNumber(statisticsRecord.total, rows.length),
      pageNum: toNumber(statisticsRecord.pageNum ?? statisticsRecord.current, filters.pageNum),
      pageSize: toNumber(statisticsRecord.size, filters.pageSize),
    },
  }
}

async function postHudson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

  const payload = (await readJson(response)) as HudsonPayload | null
  if (!response.ok) throw new Error(extractErrorMessage(payload) || `数据请求失败，HTTP ${response.status}`)
  if (!payload || typeof payload !== 'object') throw new Error('数据响应格式异常')
  if (payload.success !== true) throw new Error(extractErrorMessage(payload) || '数据加载失败，请稍后重试')
  if (payload.data === undefined || payload.data === null) throw new Error('数据响应缺少业务内容')
  return payload.data
}

function adaptCleaners(data: unknown): CleanLookupOption[] {
  const list = Array.isArray(data) ? data : []
  return list.map(asRecord).map((item, index) => ({
    id: String(item.cleanerId ?? item.userId ?? item.id ?? `cleaner-${index}`),
    label: String(item.cleanerName ?? item.userName ?? item.name ?? `保洁员 ${index + 1}`),
  }))
}

function adaptRoomCategories(data: unknown): CleanLookupOption[] {
  const record = asRecord(data)
  const list = Array.isArray(record.list) ? record.list.map(asRecord) : []
  return list.map((item, index) => ({
    id: String(item.roomCategoryId ?? `room-category-${index}`),
    label: String(item.roomCategoryName ?? item.name ?? `房型 ${index + 1}`),
  }))
}

function adaptRooms(data: unknown): CleanLookupOption[] {
  const record = asRecord(data)
  const roomCategoryRooms = Array.isArray(record.roomCategoryRooms) ? record.roomCategoryRooms.map(asRecord) : []
  return roomCategoryRooms.flatMap((category, categoryIndex) => {
    const roomCategoryName = String(category.roomCategoryName ?? `房型 ${categoryIndex + 1}`)
    const rooms = Array.isArray(category.rooms) ? category.rooms.map(asRecord) : []
    return rooms.map((room, roomIndex) => ({
      id: String(room.roomId ?? `${category.roomCategoryId ?? categoryIndex}-${roomIndex}`),
      label: `${roomCategoryName} ${String(room.roomName ?? `房间 ${roomIndex + 1}`)}`,
    }))
  })
}

function adaptSummaryRow(row: Record<string, unknown>): CleanSummaryRow {
  return {
    date: String(row.cleanTime ?? '-'),
    checkoutCount: toNumber(row.cleanTypeOneNum, 0),
    checkoutFee: formatMoney(row.cleanTypeOneCost),
    stayCount: toNumber(row.cleanTypeTwoNum, 0),
    stayFee: formatMoney(row.cleanTypeTwoCost),
    departureCount: toNumber(row.cleanTypeThreeNum, 0),
    departureFee: formatMoney(row.cleanTypeThreeCost),
    deepCount: toNumber(row.cleanTypeFourNum, 0),
    deepFee: formatMoney(row.cleanTypeFourCost),
    totalCount: toNumber(row.countNum, 0),
    totalFee: formatMoney(row.countCost),
  }
}

function adaptDetailRow(row: Record<string, unknown>): CleanDetailRow {
  return {
    id: String(row.id ?? ''),
    cleanDate: String(row.cleanDate ?? ''),
    roomName: String(row.roomName ?? ''),
    cleanerName: String(row.cleanerName ?? ''),
    cleanType: String(row.cleanType ?? ''),
    fee: formatMoney(row.fee),
    status: String(row.status ?? '已派单') as CleanDetailRow['status'],
  }
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function startOfShanghaiDay(date: string) {
  return new Date(`${date}T00:00:00+08:00`).getTime()
}

function endOfShanghaiDay(date: string) {
  return new Date(`${date}T23:59:59.999+08:00`).getTime()
}

function formatMoney(value: unknown) {
  const numeric = Number(value ?? 0)
  if (!Number.isFinite(numeric)) return '0.00'
  return (numeric / 100).toFixed(2)
}

function filterOptions(options: CleanLookupOption[], selectedIds: string[] | undefined) {
  if (!selectedIds || selectedIds.length === 0) return options
  const selected = new Set(selectedIds)
  return options.filter((item) => selected.has(item.id))
}

function extractErrorMessage(payload: HudsonPayload | null) {
  return String(payload?.errorMsg ?? payload?.errorDetail ?? '').trim()
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
