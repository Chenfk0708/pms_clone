export const SALES_REPORT_ENDPOINT = '/report/open/room/get'
export const SALES_REPORT_ROOM_TYPE_ENDPOINT = '/select/roomCategory/page/get'
export const SALES_REPORT_CHANNEL_ENDPOINT = '/select/calChannel4Order/get'
export const SALES_REPORT_ROOM_GROUP_ENDPOINT = '/roomCategoryGroups/get'
export const SALES_REPORT_ROOM_ENDPOINT = '/rooms/page/get'
export const SALES_REPORT_EXPORT_MENU_ID = '1898993554540892168'

const TASK_ID = 'baobiao--tongji-baobiao--xiaokuang-baobiao'
const REAL_BASE_URL = 'https://hudson-prod.localhome.cn'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_STORE_POI_ID = '1796425098638573570'
const DEFAULT_STORE_NAME = '天落会宿公寓(前海壹方城宝安中心店)'
const MOCK_TIMESTAMP = '2026-05-19T08:40:30+08:00'

export type SalesReportProvider = 'mock' | 'api'
export type SalesReportMockState = 'success' | 'empty' | 'error'
export type SalesReportTab = 'day' | 'month' | 'store' | 'channel' | 'roomType' | 'room'

export type SalesReportStoreScope = 'all' | 'current'

export type SalesReportStoreOption = {
  id: SalesReportStoreScope
  label: string
  poiIds: string[]
}

export type SalesReportOption = {
  id: string
  label: string
}

export type SalesReportQuery = {
  campId: string
  provider?: SalesReportProvider
  mockState?: SalesReportMockState
  activeTab: SalesReportTab
  storeScope: SalesReportStoreScope
  dayStartDate: string
  dayEndDate: string
  monthStartDate: string
  monthEndDate: string
  roomCategoryIds: string[]
  channelIds: string[]
  roomCategoryGroupIds: string[]
  roomIds: string[]
  pageNum: number
  pageSize: number
}

export type SalesReportColumnGroup = {
  label: string
  span: number
}

export type SalesReportTableRow = {
  id: string
  cells: string[]
  summary?: boolean
}

export type SalesReportTableModel = {
  groups: SalesReportColumnGroup[]
  columns: string[]
  rows: SalesReportTableRow[]
}

export type SalesReportDescriptionItem = {
  field: string
  detail: string
}

export type SalesReportRequestSummary = {
  label: string
  path: string
  body: Record<string, unknown>
}

export type SalesReportDashboard = {
  provider: SalesReportProvider
  state: SalesReportMockState
  tab: SalesReportTab
  endpoint: string
  requestBody: Record<string, unknown>
  requestSummary: string[]
  traceId: string
  timestamp: string
  stores: SalesReportStoreOption[]
  currentStoreName: string
  roomTypes: SalesReportOption[]
  channels: SalesReportOption[]
  roomGroups: SalesReportOption[]
  rooms: SalesReportOption[]
  table: SalesReportTableModel
  pagination: {
    pageNum: number
    pageSize: number
    total: number
  }
  pageText: string
  emptyMessage: string
  descriptionItems: SalesReportDescriptionItem[]
  serviceRequests: SalesReportRequestSummary[]
}

export type SalesReportExportTask = {
  provider: SalesReportProvider
  requestBody: Record<string, unknown>
  traceId: string
  timestamp: string
  taskId: string
  downloadUrl: string
  message: string
}

type SalesReportEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorCode?: string | null
}

type SalesReportEnvelopeData = {
  stores: SalesReportStoreOption[]
  currentStoreName: string
  roomTypes: SalesReportOption[]
  channels: SalesReportOption[]
  roomGroups: SalesReportOption[]
  rooms: SalesReportOption[]
  table: SalesReportTableModel
  pagination: SalesReportDashboard['pagination']
  emptyMessage: string
  descriptionItems: SalesReportDescriptionItem[]
  serviceRequests: SalesReportRequestSummary[]
}

export class SalesReportServiceError extends Error {
  readonly provider: SalesReportProvider
  readonly requestBody: Record<string, unknown>
  readonly response: SalesReportEnvelope<null>

  constructor(
    message: string,
    provider: SalesReportProvider,
    requestBody: Record<string, unknown>,
    response: SalesReportEnvelope<null>,
  ) {
    super(message)
    this.name = 'SalesReportServiceError'
    this.provider = provider
    this.requestBody = requestBody
    this.response = response
  }
}

const storeOptions: SalesReportStoreOption[] = [
  { id: 'all', label: '全部门店', poiIds: [] },
  { id: 'current', label: DEFAULT_STORE_NAME, poiIds: [DEFAULT_STORE_POI_ID] },
]

const roomTypeOptions: SalesReportOption[] = [
  { id: '1796425098965729282', label: '观影大床房' },
  { id: '1796425099242553345', label: '天落大床电竞套间' },
  { id: '1796425099485822977', label: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { id: '1796425099729092609', label: '顶层套房（浴缸巨幕电竞麻将）' },
]

const channelOptions: SalesReportOption[] = [
  { id: '0', label: '自来客' },
  { id: '2', label: '途家' },
  { id: '3', label: '美团民宿' },
  { id: '4', label: '小猪' },
  { id: '5', label: '携程' },
  { id: '6', label: '美团酒店' },
  { id: '8', label: '飞猪淘酒店' },
  { id: '17', label: '路客云聚合' },
]

const roomGroupOptions: SalesReportOption[] = [
  { id: 'group-top', label: '顶层房型' },
  { id: 'group-esports', label: '电竞套间' },
  { id: 'group-cinema', label: '观影房型' },
]

const roomOptions: SalesReportOption[] = [
  { id: 'room-1801', label: '观影大床房(房间1)' },
  { id: 'room-1802', label: '观影大床房(房间2)' },
  { id: 'room-1208', label: '天落大床电竞套间(1208)' },
  { id: 'room-2101', label: '顶层套房（浴缸巨幕电竞麻将）(2101)' },
]

const descriptionItems: SalesReportDescriptionItem[] = [
  { field: '入住率', detail: '开房数 / 可售房间数 * 100%' },
  { field: 'ADR', detail: '房费(含佣) / 开房数' },
  { field: '全日房ADR', detail: '全日房费(含佣) / 过夜开房数' },
  { field: '钟点房ADR', detail: '钟点房费(含佣) / 钟点开房数' },
  { field: 'RevPAR', detail: '入住率 x ADR' },
  { field: 'RevPAR(减佣)', detail: '入住率 x ADR(减佣)' },
]

const standardGroups: SalesReportColumnGroup[] = [
  { label: '', span: 1 },
  { label: '入住间夜', span: 5 },
  { label: '', span: 1 },
  { label: '平均房费ADR', span: 2 },
  { label: '平均客房收益RevPAR', span: 2 },
  { label: '房费收入', span: 3 },
  { label: '住宿订单渠道来源', span: 1 },
]

const dayColumns = [
  '日期',
  '总房间数',
  '可售房间数',
  '已售房间数',
  '全日房已售房间数',
  '钟点房已售房间数',
  '入住率OCC',
  'ADR',
  'ADR(减佣)',
  'RevPar',
  'RevPar(减佣)',
  '房费(减佣)',
  '佣金',
  '房费(含佣)',
  '住宿订单总数',
]

const monthColumns = [
  '月份',
  '总房间数',
  '可售房间数',
  '已可售数',
  '全日房已售房间数',
  '钟点房已售房间数',
  '入住率',
  'ADR',
  'ADR(减佣)',
  'RevPar',
  'RevPar(减佣)',
  '房费(减佣)',
  '佣金',
  '房费(含佣)',
  '住宿订单总数',
]

const storeColumns = ['门店', ...dayColumns.slice(1)]
const roomColumns = ['房间', ...dayColumns.slice(1)]

const channelGroups: SalesReportColumnGroup[] = [
  { label: '', span: 1 },
  { label: '已售房间数', span: 6 },
  { label: '住宿订单', span: 2 },
]

const channelColumns = ['渠道', '已售房间数', '占比', '全日房已售房间数', '占比', '钟点房已售房间数', '占比', '订单数', '占比']

const roomTypeGroups: SalesReportColumnGroup[] = [
  { label: '', span: 1 },
  { label: '入住间夜', span: 5 },
  { label: '', span: 1 },
  { label: 'ADR', span: 2 },
  { label: 'RevPar', span: 2 },
  { label: '房费收入', span: 3 },
  { label: '住宿订单渠道来源', span: 1 },
]

const roomTypeColumns = [
  '房型',
  '总房间数',
  '可售房间数',
  '开房数',
  '过夜开房数',
  '钟点开房数',
  '入住率',
  'ADR',
  'ADR(减佣)',
  'RevPar',
  'RevPar(减佣)',
  '房费(减佣)',
  '佣金',
  '房费(含佣)',
  '住宿订单总数',
]

const dailyRows = makeRows([
  ['合计', '76', '76', '41', '41', '0', '53.95%', '305.80', '249.47', '164.98', '134.59', '10228.21', '2309.74', '12537.95', '46'],
  ['2026-05-01', '4', '4', '4', '4', '0', '100.00%', '320.28', '241.72', '320.28', '241.72', '966.87', '314.25', '1281.12', '4'],
  ['2026-05-02', '4', '4', '4', '4', '0', '100.00%', '198.92', '170.50', '198.92', '170.50', '682.00', '113.69', '795.69', '4'],
  ['2026-05-03', '4', '4', '3', '3', '0', '75.00%', '293.00', '263.93', '219.75', '197.95', '791.80', '87.20', '879.00', '3'],
  ['2026-05-04', '4', '4', '3', '3', '0', '75.00%', '394.82', '298.43', '296.12', '223.82', '895.30', '289.16', '1184.46', '3'],
  ['2026-05-05', '4', '4', '3', '3', '0', '75.00%', '267.00', '207.74', '200.25', '155.81', '623.21', '177.79', '801.00', '3'],
  ['2026-05-06', '4', '4', '1', '1', '0', '25.00%', '171.69', '160.28', '42.92', '40.07', '160.28', '11.41', '171.69', '1'],
  ['2026-05-07', '4', '4', '1', '1', '0', '25.00%', '211.00', '163.94', '52.75', '40.99', '163.94', '47.06', '211.00', '1'],
  ['2026-05-08', '4', '4', '1', '1', '0', '25.00%', '231.00', '182.81', '57.75', '45.70', '182.81', '48.19', '231.00', '1'],
  ['2026-05-09', '4', '4', '1', '1', '0', '25.00%', '231.00', '182.81', '57.75', '45.70', '182.81', '48.19', '231.00', '1'],
  ['2026-05-10', '4', '4', '2', '2', '0', '50.00%', '198.00', '151.30', '99.00', '75.65', '302.59', '93.41', '396.00', '2'],
  ['2026-05-11', '4', '4', '1', '1', '0', '25.00%', '422.00', '327.88', '105.50', '81.97', '327.88', '94.12', '422.00', '2'],
  ['2026-05-12', '4', '4', '3', '3', '0', '75.00%', '208.69', '165.90', '156.52', '124.43', '497.70', '128.37', '626.07', '3'],
  ['2026-05-13', '4', '4', '3', '3', '0', '75.00%', '337.00', '273.04', '252.75', '204.78', '819.13', '191.87', '1011.00', '3'],
  ['2026-05-14', '4', '4', '2', '2', '0', '50.00%', '323.22', '252.91', '161.61', '126.46', '505.82', '140.61', '646.43', '2'],
  ['2026-05-15', '4', '4', '2', '2', '0', '50.00%', '165.36', '124.76', '82.68', '62.38', '249.52', '81.20', '330.72', '2'],
  ['2026-05-16', '4', '4', '4', '4', '0', '100.00%', '390.34', '315.54', '390.34', '315.54', '1262.15', '299.22', '1561.37', '5'],
  ['2026-05-17', '4', '4', '1', '1', '0', '25.00%', '636.00', '595.18', '159.00', '148.80', '595.18', '40.82', '636.00', '2'],
  ['2026-05-18', '4', '4', '1', '1', '0', '25.00%', '554.97', '510.93', '138.74', '127.73', '510.93', '44.04', '554.97', '2'],
  ['2026-05-19', '4', '4', '1', '1', '0', '25.00%', '567.43', '508.29', '141.86', '127.07', '508.29', '59.14', '567.43', '2'],
])

const filteredDailyRows = makeRows([
  ['合计', '19', '19', '16', '16', '0', '84.21%', '229.78', '185.35', '193.50', '156.08', '2965.65', '710.88', '3676.53', '17'],
  ['2026-05-01', '1', '1', '1', '1', '0', '100.00%', '201.00', '201.00', '201.00', '201.00', '201.00', '0.00', '201.00', '1'],
  ['2026-05-02', '1', '1', '1', '1', '0', '100.00%', '193.69', '193.69', '193.69', '193.69', '193.69', '0.00', '193.69', '1'],
  ['2026-05-03', '1', '1', '1', '1', '0', '100.00%', '201.00', '201.00', '201.00', '201.00', '201.00', '0.00', '201.00', '1'],
  ['2026-05-04', '1', '1', '1', '1', '0', '100.00%', '337.00', '337.00', '337.00', '337.00', '337.00', '0.00', '337.00', '1'],
  ['2026-05-05', '1', '1', '1', '1', '0', '100.00%', '211.00', '211.00', '211.00', '211.00', '211.00', '0.00', '211.00', '1'],
  ['2026-05-06', '1', '1', '1', '1', '0', '100.00%', '171.69', '171.69', '171.69', '171.69', '171.69', '0.00', '171.69', '1'],
  ['2026-05-07', '1', '1', '1', '1', '0', '100.00%', '211.00', '211.00', '211.00', '211.00', '211.00', '0.00', '211.00', '1'],
  ['2026-05-08', '1', '1', '1', '1', '0', '100.00%', '231.00', '231.00', '231.00', '231.00', '231.00', '0.00', '231.00', '1'],
  ['2026-05-09', '1', '1', '1', '1', '0', '100.00%', '231.00', '231.00', '231.00', '231.00', '231.00', '0.00', '231.00', '1'],
  ['2026-05-10', '1', '1', '1', '1', '0', '100.00%', '211.00', '211.00', '211.00', '211.00', '211.00', '0.00', '211.00', '1'],
  ['2026-05-11', '1', '1', '1', '1', '0', '100.00%', '422.00', '422.00', '422.00', '422.00', '422.00', '0.00', '422.00', '1'],
  ['2026-05-12', '1', '1', '1', '1', '0', '100.00%', '211.00', '211.00', '211.00', '211.00', '211.00', '0.00', '211.00', '1'],
  ['2026-05-13', '1', '1', '1', '1', '0', '100.00%', '211.00', '211.00', '211.00', '211.00', '211.00', '0.00', '211.00', '1'],
  ['2026-05-14', '1', '1', '1', '1', '0', '100.00%', '291.43', '291.43', '291.43', '291.43', '291.43', '0.00', '291.43', '1'],
  ['2026-05-15', '1', '1', '1', '1', '0', '100.00%', '151.72', '151.72', '151.72', '151.72', '151.72', '0.00', '151.72', '1'],
  ['2026-05-16', '1', '1', '1', '1', '0', '100.00%', '190.00', '190.00', '190.00', '190.00', '190.00', '0.00', '190.00', '1'],
  ['2026-05-17', '1', '1', '0', '0', '0', '0.00%', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0'],
  ['2026-05-18', '1', '1', '0', '0', '0', '0.00%', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0'],
  ['2026-05-19', '1', '1', '0', '0', '0', '0.00%', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0'],
])

const storeRows = makeRows([
  ['合计', '76', '76', '41', '41', '0', '53.95%', '305.80', '249.47', '164.98', '134.59', '10228.21', '2309.74', '12537.95', '40'],
  [DEFAULT_STORE_NAME, '76', '76', '41', '41', '0', '53.95%', '305.80', '249.47', '164.98', '134.59', '10228.21', '2309.74', '12537.95', '40'],
])

const channelRows = makeRows([
  ['合计', '41', '-', '41', '-', '0', '-', '40', '-'],
  ['自来客', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['途家', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['美团民宿', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['小猪', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['携程', '23', '56.10%', '23', '56.10%', '0', '0%', '22', '55.00%'],
  ['美团酒店', '5', '12.20%', '5', '12.20%', '0', '0%', '5', '12.50%'],
  ['飞猪淘酒店', '13', '31.70%', '13', '31.70%', '0', '0%', '11', '27.50%'],
  ['路客云聚合', '0', '0.00%', '0', '0.00%', '0', '0%', '2', '5.00%'],
])

const roomTypeRows = makeRows([
  ['合计', '76', '76', '41', '41', '0', '53.95%', '305.80', '249.47', '164.98', '134.59', '10228.21', '2309.74', '12537.95', '40'],
  ['观影大床房', '19', '19', '16', '16', '0', '84.21%', '229.78', '185.35', '193.50', '156.08', '2965.65', '710.88', '3676.53', '17'],
  ['天落大床电竞套间', '19', '19', '8', '8', '0', '42.11%', '253.95', '201.73', '106.93', '84.94', '1613.84', '417.76', '2031.60', '8'],
  ['总裁套间（桑拿浴缸露台电竞麻将）', '19', '19', '9', '9', '0', '47.37%', '329.50', '275.40', '156.08', '130.39', '2478.60', '486.90', '2965.50', '8'],
  ['顶层套房（浴缸巨幕电竞麻将）', '19', '19', '8', '8', '0', '42.11%', '324.29', '273.61', '136.54', '115.20', '3170.12', '694.20', '3864.32', '7'],
])

const roomRows = makeRows([
  ['合计', '76', '76', '41', '41', '0', '53.95%', '271.16', '217.86', '146.29', '117.54', '8932.35', '2185.12', '11117.47', '38'],
  ['观影大床房(房间1)', '19', '19', '16', '16', '0', '84.21%', '216.60', '181.88', '182.40', '153.16', '2910.08', '555.52', '3465.60', '16'],
  ['观影大床房(房间2)', '19', '19', '0', '0', '0', '0.00%', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0.00', '0'],
  ['天落大床电竞套间(1208)', '19', '19', '8', '8', '0', '42.11%', '253.95', '201.73', '106.93', '84.94', '1613.84', '417.76', '2031.60', '8'],
  ['顶层套房（浴缸巨幕电竞麻将）(2101)', '19', '19', '8', '8', '0', '42.11%', '324.29', '273.61', '136.54', '115.20', '3170.12', '694.20', '3864.32', '7'],
])

export function getDefaultSalesReportQuery(): SalesReportQuery {
  return {
    campId: DEFAULT_CAMP_ID,
    activeTab: 'day',
    storeScope: 'all',
    dayStartDate: '2026-05-01',
    dayEndDate: '2026-05-19',
    monthStartDate: '2025-11-01',
    monthEndDate: '2026-05-31',
    roomCategoryIds: [],
    channelIds: [],
    roomCategoryGroupIds: [],
    roomIds: [],
    pageNum: 1,
    pageSize: 20,
    provider: 'mock',
    mockState: 'success',
  }
}

export function createInitialSalesReportQuery(): SalesReportQuery {
  const defaults = getDefaultSalesReportQuery()
  if (typeof window === 'undefined') return defaults

  const params = new URLSearchParams(window.location.search)
  const provider = resolveSalesReportProvider()
  const mockState = resolveSalesReportMockState()
  const activeTab = normalizeTab(params.get('tab')) ?? defaults.activeTab

  return {
    ...defaults,
    activeTab,
    provider,
    mockState,
  }
}

export function resolveSalesReportProvider(): SalesReportProvider {
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const fromQuery = search?.get('provider')
  if (fromQuery === 'api') return 'api'
  const fromStorage = readRuntimeConfig('pms.salesReport.provider') || import.meta.env.VITE_SALES_REPORT_PROVIDER
  return fromStorage === 'api' ? 'api' : 'mock'
}

export function resolveSalesReportMockState(): SalesReportMockState {
  const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const fromQuery = search?.get('mockState') || search?.get('salesReportMockState')
  if (fromQuery === 'empty' || fromQuery === 'error' || fromQuery === 'success') return fromQuery
  const fromStorage = readRuntimeConfig('pms.salesReport.mockState') || import.meta.env.VITE_SALES_REPORT_MOCK_STATE
  return fromStorage === 'empty' || fromStorage === 'error' ? fromStorage : 'success'
}

export function getSalesReportStaticLookups() {
  return {
    stores: storeOptions,
    currentStoreName: DEFAULT_STORE_NAME,
    roomTypes: roomTypeOptions,
    channels: channelOptions,
    roomGroups: roomGroupOptions,
    rooms: roomOptions,
    descriptionItems,
  }
}

export async function loadSalesReportDashboard(
  input: SalesReportQuery,
  signal?: AbortSignal,
): Promise<SalesReportDashboard> {
  const query = normalizeQuery(input)
  const provider = query.provider ?? resolveSalesReportProvider()

  if (provider === 'api') {
    return loadRealSalesReportDashboard(query, signal)
  }

  await waitForMockLatency(signal)
  const requestBody = createSalesReportRequestBody(query)
  const envelope = buildMockEnvelope(query, requestBody)
  return adaptDashboard(provider, query, envelope, envelope.data)
}

export async function createSalesReportExportTask(
  input: SalesReportQuery,
  signal?: AbortSignal,
): Promise<SalesReportExportTask> {
  const query = normalizeQuery(input)
  const provider = query.provider ?? resolveSalesReportProvider()
  const requestBody = createSalesReportExportRequestBody(query)

  if (provider === 'api') {
    const downloadUrl = await postHudson<string>(SALES_REPORT_ENDPOINT, requestBody, signal)
    const timestamp = new Date().toISOString()
    return {
      provider,
      requestBody,
      traceId: `api-${TASK_ID}-export`,
      timestamp,
      taskId: 'sales-report-export-api',
      downloadUrl: typeof downloadUrl === 'string' ? downloadUrl : '',
      message: '导出任务已提交，请稍后下载',
    }
  }

  await waitForMockLatency(signal)
  return {
    provider: 'mock',
    requestBody,
    traceId: `mock-${TASK_ID}-export-001`,
    timestamp: MOCK_TIMESTAMP,
    taskId: 'sales-report-export-001',
    downloadUrl: 'https://download.mock.local/sales-report/2026-05-01_2026-05-19.xlsx',
    message: '导出任务已创建，请到导出记录下载',
  }
}

export function createSalesReportRequestBody(query: SalesReportQuery): Record<string, unknown> {
  const queryType = resolveQueryType(query.activeTab)
  const startDate = query.activeTab === 'month' ? query.monthStartDate : query.dayStartDate
  const endDate = query.activeTab === 'month' ? query.monthEndDate : query.dayEndDate
  const requestBody: Record<string, unknown> = {
    campId: query.campId,
    pageNum: query.pageNum,
    pageSize: query.pageSize,
    current: query.pageNum,
    startDate,
    endDate,
    breakTemp: false,
    queryType,
  }

  if (query.roomCategoryIds.length > 0) requestBody.roomCategoryIds = [...query.roomCategoryIds]
  if (query.channelIds.length > 0) requestBody.channelIds = [...query.channelIds]
  if (query.roomCategoryGroupIds.length > 0) requestBody.roomCategoryGroupIds = [...query.roomCategoryGroupIds]
  if (query.activeTab === 'room') requestBody.roomIds = [...query.roomIds]

  return requestBody
}

export function createSalesReportExportRequestBody(query: SalesReportQuery): Record<string, unknown> {
  return {
    ...createSalesReportRequestBody(query),
    pageSize: 9999,
    exportExcelMenuId: SALES_REPORT_EXPORT_MENU_ID,
  }
}

function buildMockEnvelope(
  query: SalesReportQuery,
  requestBody: Record<string, unknown>,
): SalesReportEnvelope<SalesReportEnvelopeData> {
  const state = query.mockState ?? resolveSalesReportMockState()
  if (state === 'error') {
    throw new SalesReportServiceError(
      '销况报表加载失败，请稍后重试',
      'mock',
      requestBody,
      {
        code: 50318,
        message: '销况报表服务暂不可用',
        data: null,
        traceId: `mock-${TASK_ID}-error-001`,
        timestamp: MOCK_TIMESTAMP,
      },
    )
  }

  const rooms = filterRoomOptions(query)
  const table = state === 'empty' ? createEmptyTable(query.activeTab) : createTable(query)
  const total = state === 'empty' ? 0 : Math.max(table.rows.length, 0)

  return {
    code: 0,
    message: 'success',
    data: {
      stores: storeOptions,
      currentStoreName: DEFAULT_STORE_NAME,
      roomTypes: roomTypeOptions,
      channels: channelOptions,
      roomGroups: roomGroupOptions,
      rooms,
      table,
      pagination: {
        pageNum: query.pageNum,
        pageSize: query.pageSize,
        total,
      },
      emptyMessage: query.activeTab === 'month' ? '暂无数据' : '暂无销况数据',
      descriptionItems,
      serviceRequests: createServiceRequests(query),
    },
    traceId: `mock-${TASK_ID}-${query.activeTab}-${state}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

function adaptDashboard(
  provider: SalesReportProvider,
  query: SalesReportQuery,
  envelope: SalesReportEnvelope<SalesReportEnvelopeData>,
  data: SalesReportEnvelopeData,
): SalesReportDashboard {
  return {
    provider,
    state: query.mockState ?? resolveSalesReportMockState(),
    tab: query.activeTab,
    endpoint: SALES_REPORT_ENDPOINT,
    requestBody: createSalesReportRequestBody(query),
    requestSummary: buildRequestSummary(provider, createSalesReportRequestBody(query), envelope.traceId),
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    stores: data.stores,
    currentStoreName: data.currentStoreName,
    roomTypes: data.roomTypes,
    channels: data.channels,
    roomGroups: data.roomGroups,
    rooms: data.rooms,
    table: data.table,
    pagination: data.pagination,
    pageText: createPageText(data.pagination, data.table.rows.length, query.activeTab),
    emptyMessage: data.emptyMessage,
    descriptionItems: data.descriptionItems,
    serviceRequests: data.serviceRequests,
  }
}

async function loadRealSalesReportDashboard(
  query: SalesReportQuery,
  signal?: AbortSignal,
): Promise<SalesReportDashboard> {
  const requestBody = createSalesReportRequestBody(query)
  const [tablePayload, roomTypesPayload, channelsPayload, roomGroupsPayload, roomsPayload] = await Promise.all([
    postHudson<unknown>(SALES_REPORT_ENDPOINT, requestBody, signal),
    postHudson<unknown>(
      SALES_REPORT_ROOM_TYPE_ENDPOINT,
      { campId: query.campId, pageNum: 1, pageSize: 9999, isAvailability: 1, channelId: 0 },
      signal,
    ),
    postHudson<unknown>(SALES_REPORT_CHANNEL_ENDPOINT, { campId: query.campId }, signal),
    postHudson<unknown>(SALES_REPORT_ROOM_GROUP_ENDPOINT, { campId: query.campId }, signal),
    query.activeTab === 'room'
      ? postHudson<unknown>(SALES_REPORT_ROOM_ENDPOINT, createRoomRequestBody(query), signal)
      : Promise.resolve(null),
  ])

  const roomTypes = adaptOptionList(roomTypesPayload, ['roomCategoryId', 'id'], ['roomCategoryName', 'name'])
  const channels = adaptOptionList(channelsPayload, ['channelId', 'id'], ['channelName', 'name'])
  const roomGroups = adaptOptionList(roomGroupsPayload, ['groupId', 'id'], ['groupName', 'name'])
  const rooms = query.activeTab === 'room' ? adaptOptionList(roomsPayload, ['roomId', 'id'], ['roomName', 'name']) : []
  const table = adaptApiTable(query.activeTab, tablePayload)
  const state: SalesReportMockState = table.rows.length === 0 ? 'empty' : 'success'
  const timestamp = new Date().toISOString()
  const traceId = `api-${TASK_ID}-${query.activeTab}`

  return {
    provider: 'api',
    state,
    tab: query.activeTab,
    endpoint: SALES_REPORT_ENDPOINT,
    requestBody,
    requestSummary: buildRequestSummary('api', requestBody, traceId),
    traceId,
    timestamp,
    stores: storeOptions,
    currentStoreName: DEFAULT_STORE_NAME,
    roomTypes: roomTypes.length > 0 ? roomTypes : roomTypeOptions,
    channels: channels.length > 0 ? channels : channelOptions,
    roomGroups: roomGroups.length > 0 ? roomGroups : roomGroupOptions,
    rooms: rooms.length > 0 ? rooms : filterRoomOptions(query),
    table,
    pagination: {
      pageNum: readNumber(asRecord(tablePayload).current ?? asRecord(tablePayload).pageNum, query.pageNum),
      pageSize: readNumber(asRecord(tablePayload).size ?? asRecord(tablePayload).pageSize, query.pageSize),
      total: readNumber(asRecord(tablePayload).total, table.rows.length),
    },
    pageText: createPageText(
      {
        pageNum: readNumber(asRecord(tablePayload).current ?? asRecord(tablePayload).pageNum, query.pageNum),
        pageSize: readNumber(asRecord(tablePayload).size ?? asRecord(tablePayload).pageSize, query.pageSize),
        total: readNumber(asRecord(tablePayload).total, table.rows.length),
      },
      table.rows.length,
      query.activeTab,
    ),
    emptyMessage: query.activeTab === 'month' ? '暂无数据' : '暂无销况数据',
    descriptionItems,
    serviceRequests: createServiceRequests(query),
  }
}

function createTable(query: SalesReportQuery): SalesReportTableModel {
  if (query.activeTab === 'month') {
    return {
      groups: standardGroups,
      columns: monthColumns,
      rows: [],
    }
  }

  if (query.activeTab === 'store') {
    return { groups: standardGroups, columns: storeColumns, rows: storeRows }
  }

  if (query.activeTab === 'channel') {
    return { groups: channelGroups, columns: channelColumns, rows: channelRows }
  }

  if (query.activeTab === 'roomType') {
    return { groups: roomTypeGroups, columns: roomTypeColumns, rows: roomTypeRows }
  }

  if (query.activeTab === 'room') {
    return { groups: standardGroups, columns: roomColumns, rows: roomRows }
  }

  const hasRoomTypeFilter = query.roomCategoryIds.includes(roomTypeOptions[0].id)
  return {
    groups: standardGroups,
    columns: dayColumns,
    rows: hasRoomTypeFilter ? filteredDailyRows : dailyRows,
  }
}

function createEmptyTable(tab: SalesReportTab): SalesReportTableModel {
  const model = createTable({
    ...getDefaultSalesReportQuery(),
    activeTab: tab,
    roomCategoryIds: [],
  })
  return {
    groups: model.groups,
    columns: model.columns,
    rows: [],
  }
}

function createServiceRequests(query: SalesReportQuery): SalesReportRequestSummary[] {
  const requests: SalesReportRequestSummary[] = [
    { label: '主报表数据', path: SALES_REPORT_ENDPOINT, body: createSalesReportRequestBody(query) },
    {
      label: '房型筛选',
      path: SALES_REPORT_ROOM_TYPE_ENDPOINT,
      body: { campId: query.campId, pageNum: 1, pageSize: 9999, isAvailability: 1, channelId: 0 },
    },
    { label: '渠道筛选', path: SALES_REPORT_CHANNEL_ENDPOINT, body: { campId: query.campId } },
    { label: '房型分组筛选', path: SALES_REPORT_ROOM_GROUP_ENDPOINT, body: { campId: query.campId } },
  ]

  if (query.activeTab === 'room') {
    requests.push({
      label: '房间筛选',
      path: SALES_REPORT_ROOM_ENDPOINT,
      body: createRoomRequestBody(query),
    })
  }

  return requests
}

function createRoomRequestBody(query: SalesReportQuery): Record<string, unknown> {
  return {
    campId: query.campId,
    isAvailability: 1,
    pageNum: 1,
    pageSize: 20,
    saleType: null,
    checkInDate: query.dayEndDate,
    checkOutDate: addOneDay(query.dayEndDate),
    keyword: '',
  }
}

function filterRoomOptions(query: SalesReportQuery) {
  if (query.roomCategoryIds.length === 0) return roomOptions
  if (query.roomCategoryIds.includes(roomTypeOptions[0].id)) {
    return roomOptions.filter((item) => item.label.includes('观影大床房'))
  }
  return roomOptions
}

function createPageText(
  pagination: SalesReportDashboard['pagination'],
  rowCount: number,
  activeTab: SalesReportTab,
) {
  if (rowCount === 0) return activeTab === 'month' ? '暂无数据' : '第 0-0 条/总共 0 条'
  const start = (pagination.pageNum - 1) * pagination.pageSize + 1
  const end = Math.min(start + rowCount - 1, pagination.total)
  return `第 ${start}-${end} 条/总共 ${pagination.total} 条`
}

function buildRequestSummary(provider: SalesReportProvider, requestBody: Record<string, unknown>, traceId: string) {
  return [
    `provider=${provider}`,
    `path=${SALES_REPORT_ENDPOINT}`,
    `traceId=${traceId}`,
    `queryType=${String(requestBody.queryType ?? '')}`,
    `startDate=${String(requestBody.startDate ?? '')}`,
    `endDate=${String(requestBody.endDate ?? '')}`,
    `pageNum=${String(requestBody.pageNum ?? '')}`,
    `pageSize=${String(requestBody.pageSize ?? '')}`,
  ]
}

function normalizeQuery(input: SalesReportQuery): SalesReportQuery {
  const defaults = getDefaultSalesReportQuery()
  return {
    ...defaults,
    ...input,
    campId: input.campId || defaults.campId,
    activeTab: input.activeTab,
    provider: input.provider ?? resolveSalesReportProvider(),
    mockState: input.mockState ?? resolveSalesReportMockState(),
    roomCategoryIds: [...input.roomCategoryIds],
    channelIds: [...input.channelIds],
    roomCategoryGroupIds: [...input.roomCategoryGroupIds],
    roomIds: [...input.roomIds],
  }
}

function resolveQueryType(tab: SalesReportTab) {
  const queryTypeMap: Record<SalesReportTab, number> = {
    day: 1,
    month: 2,
    store: 3,
    channel: 4,
    roomType: 5,
    room: 6,
  }
  return queryTypeMap[tab]
}

function normalizeTab(value: string | null): SalesReportTab | null {
  return value === 'day' ||
    value === 'month' ||
    value === 'store' ||
    value === 'channel' ||
    value === 'roomType' ||
    value === 'room'
    ? value
    : null
}

function makeRows(values: string[][]): SalesReportTableRow[] {
  return values.map((cells, index) => ({
    id: `${index}-${cells[0]}`,
    cells,
    summary: index === 0,
  }))
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 120)
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

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${REAL_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

function adaptOptionList(value: unknown, idKeys: string[], labelKeys: string[]) {
  const list = asArray(asRecord(value).list ?? value)
  return list
    .map((item) => {
      const record = asRecord(item)
      const id = readString(record, idKeys)
      const label = readString(record, labelKeys)
      return id && label ? { id, label } : null
    })
    .filter((item): item is SalesReportOption => item !== null)
}

function adaptApiTable(tab: SalesReportTab, value: unknown): SalesReportTableModel {
  const record = asRecord(value)
  const list = asArray(record.list ?? record.records ?? record.rows)

  if (tab === 'month') {
    return {
      groups: standardGroups,
      columns: monthColumns,
      rows: [],
    }
  }

  const schema = createTable({ ...getDefaultSalesReportQuery(), activeTab: tab })
  const rows = list.map((item, index) => ({
    id: `api-${tab}-${index}`,
    cells: adaptApiRow(tab, asRecord(item)),
    summary: index === 0 && readString(asRecord(item), ['date', 'month', 'poiName', 'channelName', 'roomCategoryName', 'roomName']) === '合计',
  }))

  return {
    groups: schema.groups,
    columns: schema.columns,
    rows,
  }
}

function adaptApiRow(tab: SalesReportTab, record: Record<string, unknown>) {
  if (tab === 'channel') {
    return [
      readString(record, ['channelName', 'name']) || '-',
      formatLooseNumber(record.saleRoomCount),
      formatLoosePercent(record.saleRoomRate),
      formatLooseNumber(record.allDaySaleRoomCount),
      formatLoosePercent(record.allDaySaleRoomRate),
      formatLooseNumber(record.hourSaleRoomCount),
      formatLoosePercent(record.hourSaleRoomRate),
      formatLooseNumber(record.orderCount),
      formatLoosePercent(record.orderRate),
    ]
  }

  const leading =
    tab === 'store'
      ? readString(record, ['poiName', 'storeName', 'name'])
      : tab === 'roomType'
        ? readString(record, ['roomCategoryName', 'name'])
        : tab === 'room'
          ? readString(record, ['roomName', 'name'])
          : readString(record, ['date', 'month', 'bizDate'])

  return [
    leading || '-',
    formatLooseNumber(record.roomCount ?? record.totalRoomCount),
    formatLooseNumber(record.canSaleRoomCount ?? record.saleRoomCount ?? record.availableRoomCount),
    formatLooseNumber(record.openRoomCount ?? record.soldRoomCount),
    formatLooseNumber(record.allDayOpenRoomCount ?? record.allDaySaleRoomCount),
    formatLooseNumber(record.hourOpenRoomCount ?? record.hourSaleRoomCount),
    formatLoosePercent(record.occ ?? record.occupancyRate),
    formatLooseNumber(record.adr),
    formatLooseNumber(record.adrAfterCommission ?? record.adrMinusCommission ?? record.adrReduceCommission),
    formatLooseNumber(record.revPar ?? record.revpar),
    formatLooseNumber(record.revParAfterCommission ?? record.revparAfterCommission ?? record.revParReduceCommission),
    formatLooseNumber(record.roomFeeAfterCommission ?? record.roomFeeMinusCommission),
    formatLooseNumber(record.commission),
    formatLooseNumber(record.roomFeeIncludingCommission ?? record.roomFeePriceIncludingCommission),
    formatLooseNumber(record.orderCount ?? record.totalOrderCount),
  ]
}

function addOneDay(date: string) {
  const value = new Date(`${date}T00:00:00+08:00`)
  if (Number.isNaN(value.getTime())) return date
  value.setUTCDate(value.getUTCDate() + 1)
  return value.toISOString().slice(0, 10)
}

function formatLooseNumber(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string') return value
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2)
  return String(value)
}

function formatLoosePercent(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return String(value)
  return numeric > 1 ? `${numeric.toFixed(2)}%` : `${(numeric * 100).toFixed(2)}%`
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number') return String(value)
  }
  return ''
}

function readNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}
