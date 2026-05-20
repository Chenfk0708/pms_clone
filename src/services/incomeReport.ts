export const INCOME_REPORT_ENDPOINT = '/report/accommodation/get'
export const INCOME_REPORT_STORE_ENDPOINT = '/select/poi/page/get'
export const INCOME_REPORT_ROOM_TYPE_ENDPOINT = '/select/roomCategory/page/get'
export const INCOME_REPORT_CHANNEL_ENDPOINT = '/select/calChannel4Order/get'
export const INCOME_REPORT_ROOM_GROUP_ENDPOINT = '/roomCategoryGroups/get'
export const INCOME_REPORT_ROOM_ENDPOINT = '/rooms/get'

export type IncomeReportProvider = 'mock' | 'api'
export type IncomeReportState = 'success' | 'empty' | 'error'
export type IncomeReportDimension = 'day' | 'month' | 'store' | 'channel' | 'roomType' | 'room' | 'checkout'

export type IncomeReportQuery = {
  campId: string
  dimension: IncomeReportDimension
  storeId: string
  storeName: string
  startDate: string
  endDate: string
  roomTypeId: string
  roomTypeName: string
  channelId: string
  channelName: string
  roomGroupId: string
  roomGroupName: string
  roomId: string
  roomName: string
  pageNum: number
  pageSize: number
  state?: IncomeReportState
}

export type IncomeReportOption = {
  id: string
  label: string
}

export type IncomeReportDescription = {
  field: string
  detail: string
}

export type IncomeReportRow = {
  key: string
  label: string
  roomFeeMinusCommission: string
  channelCommission: string
  roomFeeIncludingCommission: string
  otherExpense: string
  orderTotalIncome: string
  manualIncome: string
  businessIncomeIncludingCommission: string
  businessIncomeMinusCommission: string
  roomFeeMinusCommissionRatio?: string
  channelCommissionRatio?: string
  detailContext: string
}

export type IncomeReportDashboard = {
  provider: IncomeReportProvider
  state: IncomeReportState
  endpoint: string
  requestBody: Record<string, unknown>
  traceId: string
  timestamp: string
  dimensions: Array<{ value: IncomeReportDimension; label: string; queryType: number }>
  stores: IncomeReportOption[]
  roomTypes: IncomeReportOption[]
  channels: IncomeReportOption[]
  roomGroups: IncomeReportOption[]
  rooms: IncomeReportOption[]
  descriptions: IncomeReportDescription[]
  rows: IncomeReportRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type IncomeReportPayload = {
  dimensions: IncomeReportDashboard['dimensions']
  stores: IncomeReportOption[]
  roomTypes: IncomeReportOption[]
  channels: IncomeReportOption[]
  roomGroups: IncomeReportOption[]
  rooms: IncomeReportOption[]
  descriptions: IncomeReportDescription[]
  list: IncomeReportRow[]
  pagination: IncomeReportDashboard['pagination']
}

type IncomeReportExportTask = {
  taskId: string
  endpoint: string
  requestBody: Record<string, unknown>
}

const TASK_ID = 'baobiao--tongji-baobiao--shouru-baobiao'
const MOCK_TIMESTAMP = '2026-05-19T16:35:00+08:00'
const DEFAULT_CAMP_ID = '1796067693589061634'

const dimensionConfig: IncomeReportDashboard['dimensions'] = [
  { value: 'day', label: '按日', queryType: 1 },
  { value: 'month', label: '按月', queryType: 2 },
  { value: 'store', label: '按门店', queryType: 3 },
  { value: 'channel', label: '按渠道', queryType: 4 },
  { value: 'roomType', label: '按房型', queryType: 5 },
  { value: 'room', label: '按房间', queryType: 6 },
  { value: 'checkout', label: '按退房时间', queryType: 7 },
]

const storeOptions: IncomeReportOption[] = [
  { id: 'all', label: '全部门店' },
  { id: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const roomTypeOptions: IncomeReportOption[] = [
  { id: '', label: '请选择' },
  { id: '1796425099729092609', label: '观影大床房' },
  { id: '1796425099485822977', label: '天落大床电竞套间' },
  { id: '1796425099242553345', label: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { id: '1796425098965729282', label: '顶层套房（浴缸巨幕电竞麻将）' },
]

const channelOptions: IncomeReportOption[] = [
  { id: '', label: '请选择' },
  { id: 'ctrip', label: '携程' },
  { id: 'meituan-hotel', label: '美团酒店' },
  { id: 'meituan-home', label: '美团民宿' },
  { id: 'feizhu', label: '飞猪酒店' },
  { id: 'localhome', label: '路客云聚合' },
]

const roomGroupOptions: IncomeReportOption[] = [
  { id: '', label: '请选择' },
  { id: 'video-suite', label: '影音电竞' },
  { id: 'roof-suite', label: '高层景观' },
]

const roomOptions: IncomeReportOption[] = [
  { id: '', label: '请选择' },
  { id: 'room-1', label: '观影大床房(房间1)' },
  { id: 'room-2', label: '天落大床电竞套间(房间1)' },
  { id: 'room-3', label: '总裁套间（桑拿浴缸露台电竞麻将）(房间1)' },
  { id: 'room-4', label: '顶层套房（浴缸巨幕电竞麻将）(房间1)' },
]

const descriptionRows: IncomeReportDescription[] = [
  { field: '总营收(减佣)', detail: '房费(减佣) + 其他消费 + 记一笔收入。' },
  { field: '房费(减佣)', detail: '房费(含佣) - 佣金。' },
  { field: '佣金', detail: '渠道佣金，包含渠道优惠。' },
  { field: '房费(含佣)', detail: '住宿订单的结算金额。' },
  { field: '其他消费', detail: '订单中的住宿外消费总额。' },
  { field: '订单总收入', detail: '房费(含佣) + 其他消费。' },
  { field: '记一笔收入', detail: '通过记一笔录入的补充收入。' },
  { field: '总营收(含佣)', detail: '订单总收入 + 记一笔收入。' },
]

const dayRows: IncomeReportRow[] = [
  incomeRow('合计', '10228.21', '2309.74', '12537.95', '0', '12537.95', '0', '12537.95', '10228.21', '全部日期收入汇总'),
  incomeRow('2026-05-01', '966.87', '314.25', '1281.12', '0', '1281.12', '0', '1281.12', '966.87', '观影大床房 / 携程'),
  incomeRow('2026-05-02', '682', '113.69', '795.69', '0', '795.69', '0', '795.69', '682', '顶层套房 / 美团酒店'),
  incomeRow('2026-05-03', '791.8', '87.2', '879', '0', '879', '0', '879', '791.8', '总裁套间 / 飞猪酒店'),
  incomeRow('2026-05-04', '895.3', '289.16', '1184.46', '0', '1184.46', '0', '1184.46', '895.3', '观影大床房 / 携程'),
  incomeRow('2026-05-05', '623.21', '177.79', '801', '0', '801', '0', '801', '623.21', '总裁套间 / 携程'),
  incomeRow('2026-05-06', '160.28', '11.41', '171.69', '0', '171.69', '0', '171.69', '160.28', '天落大床电竞套间 / 路客云聚合'),
  incomeRow('2026-05-07', '163.94', '47.06', '211', '0', '211', '0', '211', '163.94', '顶层套房 / 携程'),
  incomeRow('2026-05-08', '182.81', '48.19', '231', '0', '231', '0', '231', '182.81', '观影大床房 / 美团酒店'),
  incomeRow('2026-05-09', '182.81', '48.19', '231', '0', '231', '0', '231', '182.81', '观影大床房 / 美团民宿'),
  incomeRow('2026-05-10', '302.59', '93.41', '396', '0', '396', '0', '396', '302.59', '天落大床电竞套间 / 携程'),
  incomeRow('2026-05-11', '327.88', '94.12', '422', '0', '422', '0', '422', '327.88', '顶层套房 / 携程'),
  incomeRow('2026-05-12', '497.7', '128.37', '626.07', '0', '626.07', '0', '626.07', '497.7', '观影大床房 / 美团酒店'),
  incomeRow('2026-05-13', '819.13', '191.87', '1011', '0', '1011', '0', '1011', '819.13', '总裁套间 / 携程'),
  incomeRow('2026-05-14', '505.82', '140.61', '646.43', '0', '646.43', '0', '646.43', '505.82', '观影大床房 / 携程'),
  incomeRow('2026-05-15', '249.52', '81.2', '330.72', '0', '330.72', '0', '330.72', '249.52', '观影大床房 / 美团民宿'),
  incomeRow('2026-05-16', '1262.15', '299.22', '1561.37', '0', '1561.37', '0', '1561.37', '1262.15', '总裁套间 / 携程'),
  incomeRow('2026-05-17', '595.18', '40.82', '636', '0', '636', '0', '636', '595.18', '天落大床电竞套间 / 飞猪酒店'),
  incomeRow('2026-05-18', '510.93', '44.04', '554.97', '0', '554.97', '0', '554.97', '510.93', '顶层套房 / 路客云聚合'),
  incomeRow('2026-05-19', '508.29', '59.14', '567.43', '0', '567.43', '0', '567.43', '508.29', '观影大床房 / 携程'),
]

const monthRows: IncomeReportRow[] = [
  incomeRow('合计', '127317.3', '25334', '152651.31', '0', '152651.31', '0', '152651.31', '127317.3', '月度收入汇总'),
  incomeRow('2025-11', '25137.97', '2786.36', '27924.34', '0', '27924.34', '0', '27924.34', '25137.97', '2025-11 月'),
  incomeRow('2025-12', '21679.37', '3177.57', '24856.94', '0', '24856.94', '0', '24856.94', '21679.37', '2025-12 月'),
  incomeRow('2026-01', '14952.61', '4185.29', '19137.88', '0', '19137.88', '0', '19137.88', '14952.61', '2026-01 月'),
  incomeRow('2026-02', '17124.37', '4306.29', '21430.66', '0', '21430.66', '0', '21430.66', '17124.37', '2026-02 月'),
  incomeRow('2026-03', '22712.59', '4592.73', '27305.34', '0', '27305.34', '0', '27305.34', '22712.59', '2026-03 月'),
  incomeRow('2026-04', '17502.68', '4341.01', '21843.69', '0', '21843.69', '0', '21843.69', '17502.68', '2026-04 月'),
  incomeRow('2026-05', '8207.71', '1944.75', '10152.46', '0', '10152.46', '0', '10152.46', '8207.71', '2026-05 月'),
]

const storeRows: IncomeReportRow[] = [
  incomeRow('合计', '10228.21', '2309.74', '12537.95', '0', '12537.95', '0', '12537.95', '10228.21', '门店汇总'),
  incomeRow('天落会宿公寓(前海壹方城宝安中心店)', '10228.21', '2309.74', '12537.95', '0', '12537.95', '0', '12537.95', '10228.21', '门店收入'),
]

const channelRows: IncomeReportRow[] = [
  incomeRow('合计', '10228.21', '2309.74', '12537.95', '0', '12537.95', '0', '12537.95', '10228.21', '渠道汇总'),
  incomeRow('携程', '3307.29', '966.71', '4274', '0', '4274', '0', '4274', '3307.29', '携程渠道', '46.57%', '54.15%'),
  incomeRow('美团酒店', '1050.56', '504.45', '1555.01', '0', '1555.01', '0', '1555.01', '1050.56', '美团酒店渠道', '14.79%', '28.26%'),
  incomeRow('飞猪酒店', '2374.54', '248.91', '2623.45', '0', '2623.45', '0', '2623.45', '2374.54', '飞猪酒店渠道', '33.43%', '13.94%'),
  incomeRow('路客云聚合', '369.75', '65.25', '435', '0', '435', '0', '435', '369.75', '路客云聚合渠道', '5.21%', '3.65%'),
]

const roomTypeRows: IncomeReportRow[] = [
  incomeRow('合计', '10228.21', '2309.74', '12537.95', '0', '12537.95', '0', '12537.95', '10228.21', '房型汇总'),
  incomeRow('观影大床房', '2707.45', '627.36', '3334.81', '0', '3334.81', '0', '3334.81', '2707.45', '观影大床房'),
  incomeRow('天落大床电竞套间', '1008.65', '261.08', '1269.73', '0', '1269.73', '0', '1269.73', '1008.65', '天落大床电竞套间'),
  incomeRow('总裁套间（桑拿浴缸露台电竞麻将）', '2203.22', '432.78', '2636', '0', '2636', '0', '2636', '2203.22', '总裁套间'),
  incomeRow('顶层套房（浴缸巨幕电竞麻将）', '1182.82', '464.1', '1646.92', '0', '1646.92', '0', '1646.92', '1182.82', '顶层套房'),
]

const roomRows: IncomeReportRow[] = [
  incomeRow('合计', '6938.2', '1738.26', '8676.46', '0', '8676.46', '0', '8676.46', '6938.2', '房间收入汇总'),
  incomeRow('观影大床房(房间1)', '2543.51', '580.3', '3123.81', '0', '3123.81', '0', '3123.81', '2543.51', '观影大床房(房间1)'),
  incomeRow('天落大床电竞套间(房间1)', '1008.65', '261.08', '1269.73', '0', '1269.73', '0', '1269.73', '1008.65', '天落大床电竞套间(房间1)'),
  incomeRow('总裁套间（桑拿浴缸露台电竞麻将）(房间1)', '2203.22', '432.78', '2636', '0', '2636', '0', '2636', '2203.22', '总裁套间(房间1)'),
  incomeRow('顶层套房（浴缸巨幕电竞麻将）(房间1)', '1182.82', '464.1', '1646.92', '0', '1646.92', '0', '1646.92', '1182.82', '顶层套房(房间1)'),
]

const checkoutRows: IncomeReportRow[] = [
  incomeRow('合计', '6862.56', '1762.13', '8624.69', '0', '8624.69', '0', '8624.69', '6862.56', '退房时间汇总'),
  incomeRow('2026-05-01', '266.24', '117.42', '383.66', '0', '383.66', '0', '383.66', '266.24', '退房时间 2026-05-01'),
  incomeRow('2026-05-02', '668.07', '281.05', '949.12', '0', '949.12', '0', '949.12', '668.07', '退房时间 2026-05-02'),
  incomeRow('2026-05-03', '383.2', '80.49', '463.69', '0', '463.69', '0', '463.69', '383.2', '退房时间 2026-05-03'),
  incomeRow('2026-05-04', '493', '54', '547', '0', '547', '0', '547', '493', '退房时间 2026-05-04'),
  incomeRow('2026-05-05', '1791.7', '388.76', '2180.46', '0', '2180.46', '0', '2180.46', '1791.7', '退房时间 2026-05-05'),
  incomeRow('2026-05-06', '623.21', '177.79', '801', '0', '801', '0', '801', '623.21', '退房时间 2026-05-06'),
  incomeRow('2026-05-07', '160.28', '11.41', '171.69', '0', '171.69', '0', '171.69', '160.28', '退房时间 2026-05-07'),
  incomeRow('2026-05-08', '163.94', '47.06', '211', '0', '211', '0', '211', '163.94', '退房时间 2026-05-08'),
]

export class IncomeReportServiceError extends Error {
  readonly provider: IncomeReportProvider
  readonly request: IncomeReportQuery
  readonly response: ApiEnvelope<null>

  constructor(message: string, provider: IncomeReportProvider, request: IncomeReportQuery, response: ApiEnvelope<null>) {
    super(message)
    this.name = 'IncomeReportServiceError'
    this.provider = provider
    this.request = request
    this.response = response
  }
}

export function createDefaultIncomeReportQuery(): IncomeReportQuery {
  return {
    campId: DEFAULT_CAMP_ID,
    dimension: 'day',
    storeId: 'all',
    storeName: '全部门店',
    startDate: '2026-05-01',
    endDate: '2026-05-19',
    roomTypeId: '',
    roomTypeName: '',
    channelId: '',
    channelName: '',
    roomGroupId: '',
    roomGroupName: '',
    roomId: '',
    roomName: '',
    pageNum: 1,
    pageSize: 20,
    state: 'success',
  }
}

export function resolveIncomeReportProvider(): IncomeReportProvider {
  const value =
    typeof window !== 'undefined' ? window.localStorage.getItem('pms.incomeReport.provider') : null
  return value === 'api' ? 'api' : 'mock'
}

export function resolveIncomeReportState(): IncomeReportState {
  const value = typeof window !== 'undefined' ? window.localStorage.getItem('pms.incomeReport.state') : null
  return value === 'empty' || value === 'error' ? value : 'success'
}

export function createIncomeReportRequestBody(query: IncomeReportQuery): Record<string, unknown> {
  return {
    campId: query.campId,
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    current: query.pageNum,
    startDate: query.startDate,
    endDate: query.endDate,
    breakTemp: false,
    queryType: queryTypeForDimension(query.dimension),
    poiId: query.storeId === 'all' ? undefined : query.storeId,
    roomCategoryId: query.roomTypeId || undefined,
    channelId: query.channelId || undefined,
    roomCategoryGroupId: query.roomGroupId || undefined,
    roomId: query.roomId || undefined,
    dimension: query.dimension,
    roomTypeName: query.roomTypeName,
    channelName: query.channelName,
    roomGroupName: query.roomGroupName,
    roomName: query.roomName,
  }
}

export async function fetchIncomeReportDashboard(
  input: IncomeReportQuery,
  signal?: AbortSignal,
): Promise<IncomeReportDashboard> {
  const request = normalizeQuery(input)
  const provider = resolveIncomeReportProvider()
  if (provider === 'api') {
    throw new IncomeReportServiceError(
      '收入报表服务暂时不可用，请稍后重试',
      provider,
      request,
      createNullEnvelope(503, 'income report api unavailable', 'api'),
    )
  }

  await delay(160, signal)
  validateQuery(request)
  const state = request.state ?? resolveIncomeReportState()
  if (state === 'error') {
    throw new IncomeReportServiceError(
      '收入报表加载失败，请稍后重试',
      provider,
      request,
      createNullEnvelope(503, 'income report mock failed', 'error'),
    )
  }

  const payload = createMockPayload(request, state)
  const envelope = createEnvelope(payload, state === 'empty' ? 'empty' : request.dimension)
  return adaptDashboard(provider, state, request, envelope)
}

export async function createIncomeReportExportTask(
  query: IncomeReportQuery,
  signal?: AbortSignal,
): Promise<ApiEnvelope<IncomeReportExportTask>> {
  await delay(100, signal)
  return createEnvelope(
    {
      taskId: 'income-report-export-20260519-001',
      endpoint: INCOME_REPORT_ENDPOINT,
      requestBody: createIncomeReportRequestBody(normalizeQuery(query)),
    },
    'export',
  )
}

function adaptDashboard(
  provider: IncomeReportProvider,
  state: IncomeReportState,
  request: IncomeReportQuery,
  envelope: ApiEnvelope<IncomeReportPayload>,
): IncomeReportDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message)
  }

  return {
    provider,
    state,
    endpoint: INCOME_REPORT_ENDPOINT,
    requestBody: createIncomeReportRequestBody(request),
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    dimensions: envelope.data.dimensions,
    stores: envelope.data.stores,
    roomTypes: envelope.data.roomTypes,
    channels: envelope.data.channels,
    roomGroups: envelope.data.roomGroups,
    rooms: envelope.data.rooms,
    descriptions: envelope.data.descriptions,
    rows: envelope.data.list,
    pagination: envelope.data.pagination,
  }
}

function createMockPayload(query: IncomeReportQuery, state: IncomeReportState): IncomeReportPayload {
  const rows = state === 'empty' ? [] : rowsForDimension(query.dimension)
  return {
    dimensions: dimensionConfig,
    stores: storeOptions,
    roomTypes: roomTypeOptions,
    channels: channelOptions,
    roomGroups: roomGroupOptions,
    rooms: roomOptions,
    descriptions: descriptionRows,
    list: rows,
    pagination: {
      page: query.pageNum,
      pageSize: query.pageSize,
      total: rows.length,
    },
  }
}

function rowsForDimension(dimension: IncomeReportDimension) {
  if (dimension === 'month') return monthRows
  if (dimension === 'store') return storeRows
  if (dimension === 'channel') return channelRows
  if (dimension === 'roomType') return roomTypeRows
  if (dimension === 'room') return roomRows
  if (dimension === 'checkout') return checkoutRows
  return dayRows
}

function normalizeQuery(input: IncomeReportQuery): IncomeReportQuery {
  const defaults = createDefaultIncomeReportQuery()
  return {
    ...defaults,
    ...input,
    campId: input.campId || defaults.campId,
    dimension: input.dimension || defaults.dimension,
    storeId: input.storeId || defaults.storeId,
    storeName: input.storeName || optionLabel(storeOptions, input.storeId, defaults.storeName),
    startDate: input.startDate || defaults.startDate,
    endDate: input.endDate || defaults.endDate,
    roomTypeId: input.roomTypeId ?? defaults.roomTypeId,
    roomTypeName: input.roomTypeName || optionLabel(roomTypeOptions, input.roomTypeId, ''),
    channelId: input.channelId ?? defaults.channelId,
    channelName: input.channelName || optionLabel(channelOptions, input.channelId, ''),
    roomGroupId: input.roomGroupId ?? defaults.roomGroupId,
    roomGroupName: input.roomGroupName || optionLabel(roomGroupOptions, input.roomGroupId, ''),
    roomId: input.roomId ?? defaults.roomId,
    roomName: input.roomName || optionLabel(roomOptions, input.roomId, ''),
    pageNum: Number.isFinite(input.pageNum) && input.pageNum > 0 ? Math.floor(input.pageNum) : defaults.pageNum,
    pageSize: Number.isFinite(input.pageSize) && input.pageSize > 0 ? Math.floor(input.pageSize) : defaults.pageSize,
    state: input.state ?? resolveIncomeReportState(),
  }
}

function validateQuery(query: IncomeReportQuery) {
  const start = new Date(`${query.startDate}T00:00:00+08:00`)
  const end = new Date(`${query.endDate}T00:00:00+08:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('收入报表查询参数不合法：日期格式无效')
  }
  if (start.getTime() > end.getTime()) {
    throw new Error('收入报表查询参数不合法：开始日期不能晚于结束日期')
  }
}

function queryTypeForDimension(dimension: IncomeReportDimension) {
  return dimensionConfig.find((item) => item.value === dimension)?.queryType ?? 1
}

function optionLabel(options: IncomeReportOption[], id: string | undefined, fallback: string) {
  if (!id) return fallback
  return options.find((item) => item.id === id)?.label ?? fallback
}

function createEnvelope<T>(data: T, suffix: string): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId: `mock-${TASK_ID}-${suffix}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function createNullEnvelope(code: number, message: string, suffix: string): ApiEnvelope<null> {
  return {
    code,
    message,
    data: null,
    traceId: `mock-${TASK_ID}-${suffix}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function incomeRow(
  label: string,
  roomFeeMinusCommission: string,
  channelCommission: string,
  roomFeeIncludingCommission: string,
  otherExpense: string,
  orderTotalIncome: string,
  manualIncome: string,
  businessIncomeIncludingCommission: string,
  businessIncomeMinusCommission: string,
  detailContext: string,
  roomFeeMinusCommissionRatio?: string,
  channelCommissionRatio?: string,
): IncomeReportRow {
  return {
    key: label,
    label,
    roomFeeMinusCommission,
    channelCommission,
    roomFeeIncludingCommission,
    otherExpense,
    orderTotalIncome,
    manualIncome,
    businessIncomeIncludingCommission,
    businessIncomeMinusCommission,
    roomFeeMinusCommissionRatio,
    channelCommissionRatio,
    detailContext,
  }
}

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Request aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
