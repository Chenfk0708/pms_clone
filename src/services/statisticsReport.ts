export const STATISTICS_REPORT_ENDPOINT = '/report/accommodation/management/analysis/get'
export const STATISTICS_REPORT_STORE_ENDPOINT = '/select/poi/page/get'
export const STATISTICS_REPORT_ROOM_TYPE_ENDPOINT = '/select/roomCategory/page/get'
export const STATISTICS_REPORT_CHANNEL_ENDPOINT = '/select/calChannel4Order/get'
export const STATISTICS_REPORT_ROOM_TAG_ENDPOINT = '/roomCategoryGroups/get'

export type StatisticsReportProvider = 'mock' | 'api'
export type StatisticsReportState = 'success' | 'empty' | 'error'
export type StatisticsReportPreset = 'yesterday' | 'today' | 'lastWeek' | 'thisWeek' | 'lastMonth' | 'thisMonth'
export type StatisticsReportTrendKey = 'businessIncome' | 'occ' | 'adr' | 'revPar' | 'openRoomCount'

export type StatisticsReportQuery = {
  campId: string
  preset: StatisticsReportPreset
  startDate: string
  endDate: string
  predictStartDate: string
  predictEndDate: string
  roomCategoryIds: string[]
  channelIds: string[]
  roomCategoryGroupIds: string[]
  state?: StatisticsReportState
}

export type StatisticsReportOption = {
  id: string
  label: string
}

export type StatisticsReportRevenueCard = {
  label: string
  value: string
}

export type StatisticsReportMetricCard = {
  label: string
  value: string
  details: Array<{ label: string; value: string }>
}

export type StatisticsReportTrendSeries = {
  key: string
  label: string
  color: string
  values: number[]
}

export type StatisticsReportTrendMetric = {
  key: StatisticsReportTrendKey
  label: string
  valueFormat: 'currency' | 'percent' | 'count'
  xLabels: string[]
  series: StatisticsReportTrendSeries[]
}

export type StatisticsReportSourceItem = {
  id: string
  label: string
  count: number
  countText: string
  percentageText: string
  color: string
}

export type StatisticsReportDashboard = {
  provider: StatisticsReportProvider
  state: StatisticsReportState
  endpoint: string
  requestBody: Record<string, unknown>
  traceId: string
  timestamp: string
  currentStoreName: string
  storeOptions: StatisticsReportOption[]
  roomTypeOptions: StatisticsReportOption[]
  channelOptions: StatisticsReportOption[]
  roomTagOptions: StatisticsReportOption[]
  revenueCards: StatisticsReportRevenueCard[]
  metricCards: StatisticsReportMetricCard[]
  trendMetrics: StatisticsReportTrendMetric[]
  sourceItems: StatisticsReportSourceItem[]
  futureCards: StatisticsReportRevenueCard[]
  hasFutureData: boolean
  overviewSnapshot: {
    businessIncome: number
    occ: number
    adr: number
    revPar: number
    openRoomCount: number
    roomCount: number
    orderTotalCount: number
    predictForwardBusinessIncome: number | null
    predictTotalBusinessIncome: number | null
  }
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type RawTrendPoint = {
  date: string
  businessIncome: number
  roomFeePriceIncludingCommission: number
  otherOrderExpense: number
  writeDownIncome: number
  occ: number
  adr: number
  revPar: number
  openRoomCount: number
}

type RawOrderSource = {
  channelId: string
  channelName: string
  orderCount: number
}

type RawStatisticsReport = {
  writeDownIncome: number
  businessIncome: number
  predictForwardBusinessIncome: number | null
  predictTotalBusinessIncome: number | null
  roomFeePriceIncludingCommission: number
  hourRoomFeePriceIncludingCommission: number
  otherOrderExpense: number
  occ: number
  adr: number
  revPar: number
  openRoomCount: number
  roomCount: number
  allDayOpenRoomCount: number
  hourOpenRoomCount: number
  growthTrendAnalysisList: RawTrendPoint[]
  orderOriginAnalysisList: RawOrderSource[]
  orderTotalCount: number
  accommodationIncome: number
  predictForwardAccommodationIncome: number | null
  predictTotalAccommodationIncome: number | null
  foodIncome: number
  predictForwardFoodIncome: number | null
  predictTotalFoodIncome: number | null
  supermarketIncome: number
  predictForwardSupermarketIncome: number | null
  predictTotalSupermarketIncome: number | null
  entertainmentIncome: number
  predictForwardEntertainmentIncome: number | null
  predictTotalEntertainmentIncome: number | null
  venueIncome: number
  predictForwardVenueIncome: number | null
  predictTotalVenueIncome: number | null
  allDayRoomFeePriceIncludingCommission: number
}

const TASK_ID = 'baobiao--tongji-baobiao--tongji-gailan'
const MOCK_TIMESTAMP = '2026-05-19T16:35:00+08:00'
const DEFAULT_CAMP_ID = '1796067693589061634'
const DEFAULT_STORE_NAME = '天落会宿公寓(前海壹方城宝安中心店)'

export const statisticsReportPresetOptions: Array<{
  key: StatisticsReportPreset
  label: string
  supported: boolean
}> = [
  { key: 'yesterday', label: '昨天', supported: true },
  { key: 'today', label: '今天', supported: true },
  { key: 'lastWeek', label: '上周', supported: false },
  { key: 'thisWeek', label: '本周', supported: false },
  { key: 'lastMonth', label: '上月', supported: false },
  { key: 'thisMonth', label: '本月', supported: true },
]

const storeOptions: StatisticsReportOption[] = [
  { id: 'all', label: '全部门店' },
  { id: '1796425098638573570', label: DEFAULT_STORE_NAME },
]

const roomTypeOptions: StatisticsReportOption[] = [
  { id: '1796425098965729282', label: '观影大床房' },
  { id: '1796425099242553345', label: '天落大床电竞套间' },
  { id: '1796425099485822977', label: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { id: '1796425099729092609', label: '顶层套房（浴缸巨幕电竞麻将）' },
]

const channelOptions: StatisticsReportOption[] = [
  { id: '0', label: '自来客' },
  { id: '17', label: '路客云聚合' },
  { id: '3', label: '美团民宿' },
  { id: '6', label: '美团酒店' },
  { id: '2', label: '途家' },
  { id: '8', label: '飞猪淘酒店' },
  { id: '4', label: '小猪' },
  { id: '21', label: '木鸟' },
  { id: '5', label: '携程' },
]

const roomTagOptions: StatisticsReportOption[] = []

const channelColors = ['#4d65f6', '#ff7a2e', '#f0c56b', '#56c9a5', '#7f8cff', '#f78fb3']

const baseMonthTrend: RawTrendPoint[] = [
  rawTrend('2026-05-01', 1281.12, 1281.12, 0, 0, 1, 320.28, 320.28, 4),
  rawTrend('2026-05-02', 795.69, 795.69, 0, 0, 1, 198.92, 198.92, 4),
  rawTrend('2026-05-03', 879, 879, 0, 0, 0.75, 293, 219.75, 3),
  rawTrend('2026-05-04', 1184.46, 1184.46, 0, 0, 0.75, 394.82, 296.12, 3),
  rawTrend('2026-05-05', 801, 801, 0, 0, 0.75, 267, 200.25, 3),
  rawTrend('2026-05-06', 171.69, 171.69, 0, 0, 0.25, 171.69, 42.92, 1),
  rawTrend('2026-05-07', 211, 211, 0, 0, 0.25, 211, 52.75, 1),
  rawTrend('2026-05-08', 231, 231, 0, 0, 0.25, 231, 57.75, 1),
  rawTrend('2026-05-09', 231, 231, 0, 0, 0.25, 231, 57.75, 1),
  rawTrend('2026-05-10', 396, 396, 0, 0, 0.5, 198, 99, 2),
  rawTrend('2026-05-11', 422, 422, 0, 0, 0.25, 422, 105.5, 1),
  rawTrend('2026-05-12', 626.07, 626.07, 0, 0, 0.75, 208.69, 156.52, 3),
  rawTrend('2026-05-13', 1011, 1011, 0, 0, 0.75, 337, 252.75, 3),
  rawTrend('2026-05-14', 646.43, 646.43, 0, 0, 0.5, 323.22, 161.61, 2),
  rawTrend('2026-05-15', 330.72, 330.72, 0, 0, 0.5, 165.36, 82.68, 2),
  rawTrend('2026-05-16', 1561.37, 1561.37, 0, 0, 1, 390.34, 390.34, 4),
  rawTrend('2026-05-17', 636, 636, 0, 0, 0.25, 636, 159, 1),
  rawTrend('2026-05-18', 554.97, 554.97, 0, 0, 0.25, 554.97, 138.74, 1),
  rawTrend('2026-05-19', 567.43, 567.43, 0, 0, 0.25, 567.43, 141.86, 1),
]

const monthRoomTypeTrend: RawTrendPoint[] = [
  rawTrend('2026-05-01', 201, 201, 0, 0, 1, 201, 201, 1),
  rawTrend('2026-05-02', 193.69, 193.69, 0, 0, 1, 193.69, 193.69, 1),
  rawTrend('2026-05-03', 201, 201, 0, 0, 1, 201, 201, 1),
  rawTrend('2026-05-04', 337, 337, 0, 0, 1, 337, 337, 1),
  rawTrend('2026-05-05', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-06', 171.69, 171.69, 0, 0, 1, 171.69, 171.69, 1),
  rawTrend('2026-05-07', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-08', 231, 231, 0, 0, 1, 231, 231, 1),
  rawTrend('2026-05-09', 231, 231, 0, 0, 1, 231, 231, 1),
  rawTrend('2026-05-10', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-11', 422, 422, 0, 0, 1, 422, 422, 1),
  rawTrend('2026-05-12', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-13', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-14', 291.43, 291.43, 0, 0, 1, 291.43, 291.43, 1),
  rawTrend('2026-05-15', 151.72, 151.72, 0, 0, 1, 151.72, 151.72, 1),
  rawTrend('2026-05-16', 190, 190, 0, 0, 1, 190, 190, 1),
  rawTrend('2026-05-17', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-18', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-19', 0, 0, 0, 0, 0, 0, 0, 0),
]

const monthRoomTypeChannelTrend: RawTrendPoint[] = [
  rawTrend('2026-05-01', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-02', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-03', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-04', 337, 337, 0, 0, 1, 337, 337, 1),
  rawTrend('2026-05-05', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-06', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-07', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-08', 231, 231, 0, 0, 1, 231, 231, 1),
  rawTrend('2026-05-09', 231, 231, 0, 0, 1, 231, 231, 1),
  rawTrend('2026-05-10', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-11', 422, 422, 0, 0, 1, 422, 422, 1),
  rawTrend('2026-05-12', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-13', 211, 211, 0, 0, 1, 211, 211, 1),
  rawTrend('2026-05-14', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-15', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-16', 190, 190, 0, 0, 1, 190, 190, 1),
  rawTrend('2026-05-17', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-18', 0, 0, 0, 0, 0, 0, 0, 0),
  rawTrend('2026-05-19', 0, 0, 0, 0, 0, 0, 0, 0),
]

const defaultYesterdayResponse = rawResponse({
  businessIncome: 554.97,
  predictForwardBusinessIncome: null,
  predictTotalBusinessIncome: null,
  roomFeePriceIncludingCommission: 554.97,
  occ: 25,
  adr: 554.97,
  revPar: 138.74,
  openRoomCount: 1,
  roomCount: 4,
  allDayOpenRoomCount: 1,
  growthTrendAnalysisList: [baseMonthTrend[17]],
  orderOriginAnalysisList: [{ channelId: '8', channelName: '飞猪淘酒店', orderCount: 2 }],
  orderTotalCount: 2,
  allDayRoomFeePriceIncludingCommission: 554.97,
})

const todayResponse = rawResponse({
  businessIncome: 567.43,
  predictForwardBusinessIncome: null,
  predictTotalBusinessIncome: null,
  roomFeePriceIncludingCommission: 567.43,
  occ: 25,
  adr: 567.43,
  revPar: 141.86,
  openRoomCount: 1,
  roomCount: 4,
  allDayOpenRoomCount: 1,
  growthTrendAnalysisList: [baseMonthTrend[18]],
  orderOriginAnalysisList: [
    { channelId: '8', channelName: '飞猪淘酒店', orderCount: 1 },
    { channelId: '17', channelName: '路客云聚合', orderCount: 1 },
  ],
  orderTotalCount: 2,
  allDayRoomFeePriceIncludingCommission: 567.43,
})

const thisMonthResponse = rawResponse({
  businessIncome: 12537.95,
  predictForwardBusinessIncome: 1272.05,
  predictTotalBusinessIncome: 13810,
  roomFeePriceIncludingCommission: 12537.95,
  occ: 53.95,
  adr: 305.8,
  revPar: 164.98,
  openRoomCount: 41,
  roomCount: 76,
  allDayOpenRoomCount: 41,
  growthTrendAnalysisList: baseMonthTrend,
  orderOriginAnalysisList: [
    { channelId: '5', channelName: '携程', orderCount: 23 },
    { channelId: '6', channelName: '美团酒店', orderCount: 5 },
    { channelId: '8', channelName: '飞猪淘酒店', orderCount: 13 },
    { channelId: '17', channelName: '路客云聚合', orderCount: 2 },
  ],
  orderTotalCount: 43,
  predictForwardAccommodationIncome: 0,
  predictTotalAccommodationIncome: 0,
  predictForwardFoodIncome: 0,
  predictTotalFoodIncome: 0,
  predictForwardSupermarketIncome: 0,
  predictTotalSupermarketIncome: 0,
  predictForwardEntertainmentIncome: 0,
  predictTotalEntertainmentIncome: 0,
  predictForwardVenueIncome: 0,
  predictTotalVenueIncome: 0,
  allDayRoomFeePriceIncludingCommission: 12537.95,
})

const thisMonthRoomTypeResponse = rawResponse({
  businessIncome: 3676.53,
  predictForwardBusinessIncome: 0,
  predictTotalBusinessIncome: 3676.53,
  roomFeePriceIncludingCommission: 3676.53,
  occ: 84.21,
  adr: 229.78,
  revPar: 193.5,
  openRoomCount: 16,
  roomCount: 19,
  allDayOpenRoomCount: 16,
  growthTrendAnalysisList: monthRoomTypeTrend,
  orderOriginAnalysisList: [
    { channelId: '5', channelName: '携程', orderCount: 11 },
    { channelId: '6', channelName: '美团酒店', orderCount: 2 },
    { channelId: '8', channelName: '飞猪淘酒店', orderCount: 4 },
  ],
  orderTotalCount: 17,
  predictForwardAccommodationIncome: 0,
  predictTotalAccommodationIncome: 0,
  predictForwardFoodIncome: 0,
  predictTotalFoodIncome: 0,
  predictForwardSupermarketIncome: 0,
  predictTotalSupermarketIncome: 0,
  predictForwardEntertainmentIncome: 0,
  predictTotalEntertainmentIncome: 0,
  predictForwardVenueIncome: 0,
  predictTotalVenueIncome: 0,
  allDayRoomFeePriceIncludingCommission: 3676.53,
})

const thisMonthRoomTypeChannelResponse = rawResponse({
  businessIncome: 2466,
  predictForwardBusinessIncome: 0,
  predictTotalBusinessIncome: 2466,
  roomFeePriceIncludingCommission: 2466,
  occ: 52.63,
  adr: 246.6,
  revPar: 129.79,
  openRoomCount: 10,
  roomCount: 19,
  allDayOpenRoomCount: 10,
  growthTrendAnalysisList: monthRoomTypeChannelTrend,
  orderOriginAnalysisList: [{ channelId: '5', channelName: '携程', orderCount: 11 }],
  orderTotalCount: 11,
  predictForwardAccommodationIncome: 0,
  predictTotalAccommodationIncome: 0,
  predictForwardFoodIncome: 0,
  predictTotalFoodIncome: 0,
  predictForwardSupermarketIncome: 0,
  predictTotalSupermarketIncome: 0,
  predictForwardEntertainmentIncome: 0,
  predictTotalEntertainmentIncome: 0,
  predictForwardVenueIncome: 0,
  predictTotalVenueIncome: 0,
  allDayRoomFeePriceIncludingCommission: 2466,
})

export class StatisticsReportServiceError extends Error {
  readonly provider: StatisticsReportProvider
  readonly request: StatisticsReportQuery
  readonly response: ApiEnvelope<null>

  constructor(message: string, provider: StatisticsReportProvider, request: StatisticsReportQuery, response: ApiEnvelope<null>) {
    super(message)
    this.name = 'StatisticsReportServiceError'
    this.provider = provider
    this.request = request
    this.response = response
  }
}

export function createDefaultStatisticsReportQuery(): StatisticsReportQuery {
  return {
    campId: DEFAULT_CAMP_ID,
    preset: 'yesterday',
    startDate: '2026-05-18',
    endDate: '2026-05-18',
    predictStartDate: '',
    predictEndDate: '',
    roomCategoryIds: [],
    channelIds: [],
    roomCategoryGroupIds: [],
    state: 'success',
  }
}

export function buildStatisticsReportQueryForPreset(
  preset: StatisticsReportPreset,
  current?: StatisticsReportQuery,
): StatisticsReportQuery {
  const base = current ?? createDefaultStatisticsReportQuery()
  if (preset === 'today') {
    return { ...base, preset, startDate: '2026-05-19', endDate: '2026-05-19', predictStartDate: '', predictEndDate: '' }
  }
  if (preset === 'thisMonth') {
    return {
      ...base,
      preset,
      startDate: '2026-05-01',
      endDate: '2026-05-19',
      predictStartDate: '2026-05-01',
      predictEndDate: '2026-05-31',
    }
  }
  return { ...base, preset: 'yesterday', startDate: '2026-05-18', endDate: '2026-05-18', predictStartDate: '', predictEndDate: '' }
}

export function resolveStatisticsReportProvider(): StatisticsReportProvider {
  const value =
    typeof window !== 'undefined' ? window.localStorage.getItem('pms.statisticsReport.provider') : null
  return value === 'api' ? 'api' : 'mock'
}

export function resolveStatisticsReportState(): StatisticsReportState {
  const value = typeof window !== 'undefined' ? window.localStorage.getItem('pms.statisticsReport.scenario') : null
  return value === 'empty' || value === 'error' ? value : 'success'
}

export function createStatisticsReportRequestBody(query: StatisticsReportQuery): Record<string, unknown> {
  const requestBody: Record<string, unknown> = {
    campId: query.campId,
    startDate: query.startDate,
    endDate: query.endDate,
  }
  if (query.predictStartDate) requestBody.predictStartDate = query.predictStartDate
  if (query.predictEndDate) requestBody.predictEndDate = query.predictEndDate
  if (query.roomCategoryIds.length > 0) requestBody.roomCategoryIds = query.roomCategoryIds
  if (query.channelIds.length > 0) requestBody.channelIds = query.channelIds
  if (query.roomCategoryGroupIds.length > 0) requestBody.roomCategoryGroupIds = query.roomCategoryGroupIds
  return requestBody
}

export async function fetchStatisticsReportDashboard(
  input: StatisticsReportQuery,
  signal?: AbortSignal,
): Promise<StatisticsReportDashboard> {
  const request = normalizeQuery(input)
  const provider = resolveStatisticsReportProvider()
  if (provider === 'api') {
    throw new StatisticsReportServiceError(
      '统计概览服务暂不可用，请稍后重试',
      provider,
      request,
      createNullEnvelope(503, 'statistics report api unavailable', 'api'),
    )
  }

  await delay(160, signal)
  validateQuery(request)
  const state = request.state ?? resolveStatisticsReportState()
  if (state === 'error') {
    throw new StatisticsReportServiceError(
      `统计概览加载失败：${STATISTICS_REPORT_ENDPOINT} 返回业务错误`,
      provider,
      request,
      createNullEnvelope(503, 'statistics report mock failed', 'error'),
    )
  }

  const requestBody = createStatisticsReportRequestBody(request)
  const raw = state === 'empty' ? createEmptyResponse() : resolveMockResponse(requestBody)
  const envelope = createEnvelope(raw, state === 'empty' ? 'empty' : mockSuffixForRequest(requestBody))
  return adaptDashboard(provider, state, requestBody, envelope)
}

function adaptDashboard(
  provider: StatisticsReportProvider,
  state: StatisticsReportState,
  requestBody: Record<string, unknown>,
  envelope: ApiEnvelope<RawStatisticsReport>,
): StatisticsReportDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message)
  }

  const raw = envelope.data
  return {
    provider,
    state,
    endpoint: STATISTICS_REPORT_ENDPOINT,
    requestBody,
    traceId: envelope.traceId,
    timestamp: envelope.timestamp,
    currentStoreName: DEFAULT_STORE_NAME,
    storeOptions,
    roomTypeOptions,
    channelOptions,
    roomTagOptions,
    revenueCards: [
      { label: '总营业收入', value: formatMoney(raw.businessIncome) },
      { label: '住宿', value: formatMoney(raw.accommodationIncome) },
      { label: '餐饮', value: formatMoney(raw.foodIncome) },
      { label: '商超', value: formatMoney(raw.supermarketIncome) },
      { label: '娱乐', value: formatMoney(raw.entertainmentIncome) },
      { label: '场地', value: formatMoney(raw.venueIncome) },
    ],
    metricCards: [
      {
        label: '总营业收入',
        value: formatMoney(raw.businessIncome),
        details: [
          { label: '房费(含佣)', value: formatMoney(raw.roomFeePriceIncludingCommission) },
          { label: '其他消费', value: formatMoney(raw.otherOrderExpense) },
          { label: '记一笔收入', value: formatMoney(raw.writeDownIncome) },
        ],
      },
      {
        label: '入住率OCC',
        value: formatPercent(raw.occ),
        details: [
          { label: '已售房间数', value: String(raw.openRoomCount) },
          { label: '总房间数', value: String(raw.roomCount) },
        ],
      },
      {
        label: '平均房费ADR',
        value: formatMoney(raw.adr),
        details: [
          { label: '全日房费(含佣)', value: formatMoney(raw.allDayRoomFeePriceIncludingCommission) },
          { label: '钟点房费(含佣)', value: formatMoney(raw.hourRoomFeePriceIncludingCommission) },
        ],
      },
      {
        label: '平均客房收益RevPAR',
        value: formatMoney(raw.revPar),
        details: [
          { label: '入住率OCC', value: formatPercent(raw.occ) },
          { label: '平均房费ADR', value: formatMoney(raw.adr) },
        ],
      },
      {
        label: '已售房间数',
        value: String(raw.openRoomCount),
        details: [
          { label: '全日房已售房间数', value: String(raw.allDayOpenRoomCount) },
          { label: '钟点房已售房间数', value: String(raw.hourOpenRoomCount) },
        ],
      },
    ],
    trendMetrics: createTrendMetrics(raw.growthTrendAnalysisList),
    sourceItems: adaptSourceItems(raw.orderOriginAnalysisList, raw.orderTotalCount),
    futureCards: [
      { label: '预计未来营业收入', value: formatNullableMoney(raw.predictForwardBusinessIncome) },
      { label: '预计总营业收入', value: formatNullableMoney(raw.predictTotalBusinessIncome) },
      { label: '当前已售房间数', value: String(raw.openRoomCount) },
      { label: '当前入住率OCC', value: formatPercent(raw.occ) },
    ],
    hasFutureData: raw.predictForwardBusinessIncome !== null || raw.predictTotalBusinessIncome !== null,
    overviewSnapshot: {
      businessIncome: raw.businessIncome,
      occ: raw.occ,
      adr: raw.adr,
      revPar: raw.revPar,
      openRoomCount: raw.openRoomCount,
      roomCount: raw.roomCount,
      orderTotalCount: raw.orderTotalCount,
      predictForwardBusinessIncome: raw.predictForwardBusinessIncome,
      predictTotalBusinessIncome: raw.predictTotalBusinessIncome,
    },
  }
}

function createTrendMetrics(trend: RawTrendPoint[]): StatisticsReportTrendMetric[] {
  const xLabels = trend.map((item) => item.date.slice(5))
  return [
    {
      key: 'businessIncome',
      label: '营业收入',
      valueFormat: 'currency',
      xLabels,
      series: [
        series('businessIncome', '营业收入', '#4d65f6', trend.map((item) => item.businessIncome)),
        series('roomFeePriceIncludingCommission', '房费(含佣)', '#56c9a5', trend.map((item) => item.roomFeePriceIncludingCommission)),
        series('otherOrderExpense', '其他消费', '#ff7a2e', trend.map((item) => item.otherOrderExpense)),
        series('writeDownIncome', '记一笔收入', '#f0c56b', trend.map((item) => item.writeDownIncome)),
      ],
    },
    {
      key: 'occ',
      label: '入住率OCC',
      valueFormat: 'percent',
      xLabels,
      series: [series('occ', '入住率OCC', '#4d65f6', trend.map((item) => Number((item.occ * 100).toFixed(2))))],
    },
    {
      key: 'adr',
      label: '平均房费ADR',
      valueFormat: 'currency',
      xLabels,
      series: [series('adr', '平均房费ADR', '#4d65f6', trend.map((item) => item.adr))],
    },
    {
      key: 'revPar',
      label: 'RevPAR',
      valueFormat: 'currency',
      xLabels,
      series: [series('revPar', 'RevPAR', '#4d65f6', trend.map((item) => item.revPar))],
    },
    {
      key: 'openRoomCount',
      label: '已售房间数',
      valueFormat: 'count',
      xLabels,
      series: [series('openRoomCount', '已售房间数', '#4d65f6', trend.map((item) => item.openRoomCount))],
    },
  ]
}

function adaptSourceItems(list: RawOrderSource[], total: number): StatisticsReportSourceItem[] {
  return list.map((item, index) => ({
    id: item.channelId,
    label: item.channelName,
    count: item.orderCount,
    countText: `${item.orderCount}单`,
    percentageText: total > 0 ? `${((item.orderCount / total) * 100).toFixed(2)}%` : '0.00%',
    color: channelColors[index % channelColors.length],
  }))
}

function resolveMockResponse(requestBody: Record<string, unknown>) {
  const signature = buildSignature(requestBody)
  const response = mockResponseMap[signature]
  if (!response) {
    throw new StatisticsReportServiceError(
      '当前筛选条件暂不支持统计概览查询，请调整后重试',
      'mock',
      normalizeQuery(createDefaultStatisticsReportQuery()),
      createNullEnvelope(422, `unsupported mock request: ${signature}`, 'unsupported'),
    )
  }
  return response
}

function mockSuffixForRequest(requestBody: Record<string, unknown>) {
  const signature = buildSignature(requestBody)
  if (signature === buildSignature(createStatisticsReportRequestBody(createDefaultStatisticsReportQuery()))) return 'yesterday'
  if (signature === buildSignature(createStatisticsReportRequestBody(buildStatisticsReportQueryForPreset('today')))) return 'today'
  if (signature === buildSignature(createStatisticsReportRequestBody(buildStatisticsReportQueryForPreset('thisMonth')))) return 'this-month'
  if (
    signature ===
    buildSignature(
      createStatisticsReportRequestBody({
        ...buildStatisticsReportQueryForPreset('thisMonth'),
        roomCategoryIds: ['1796425098965729282'],
        channelIds: [],
        roomCategoryGroupIds: [],
      }),
    )
  ) {
    return 'this-month-room-type'
  }
  return 'this-month-room-type-channel'
}

const mockResponseMap: Record<string, RawStatisticsReport> = {
  [buildSignature(createStatisticsReportRequestBody(createDefaultStatisticsReportQuery()))]: defaultYesterdayResponse,
  [buildSignature(createStatisticsReportRequestBody(buildStatisticsReportQueryForPreset('today')))]:
    todayResponse,
  [buildSignature(createStatisticsReportRequestBody(buildStatisticsReportQueryForPreset('thisMonth')))]:
    thisMonthResponse,
  [
    buildSignature(
      createStatisticsReportRequestBody({
        ...buildStatisticsReportQueryForPreset('thisMonth'),
        roomCategoryIds: ['1796425098965729282'],
        channelIds: [],
        roomCategoryGroupIds: [],
      }),
    )
  ]: thisMonthRoomTypeResponse,
  [
    buildSignature(
      createStatisticsReportRequestBody({
        ...buildStatisticsReportQueryForPreset('thisMonth'),
        roomCategoryIds: ['1796425098965729282'],
        channelIds: ['5'],
        roomCategoryGroupIds: [],
      }),
    )
  ]: thisMonthRoomTypeChannelResponse,
}

function normalizeQuery(input: StatisticsReportQuery): StatisticsReportQuery {
  const defaults = createDefaultStatisticsReportQuery()
  const presetBased = buildStatisticsReportQueryForPreset(input.preset || defaults.preset, defaults)
  return {
    ...presetBased,
    ...input,
    campId: input.campId || defaults.campId,
    roomCategoryIds: Array.isArray(input.roomCategoryIds) ? [...input.roomCategoryIds] : [],
    channelIds: Array.isArray(input.channelIds) ? [...input.channelIds] : [],
    roomCategoryGroupIds: Array.isArray(input.roomCategoryGroupIds) ? [...input.roomCategoryGroupIds] : [],
    state: input.state ?? resolveStatisticsReportState(),
  }
}

function validateQuery(query: StatisticsReportQuery) {
  const start = new Date(`${query.startDate}T00:00:00+08:00`)
  const end = new Date(`${query.endDate}T00:00:00+08:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('统计概览查询参数不合法：日期格式无效')
  }
  if (start.getTime() > end.getTime()) {
    throw new Error('统计概览查询参数不合法：开始日期不能晚于结束日期')
  }
}

function createEmptyResponse(): RawStatisticsReport {
  return rawResponse({
    businessIncome: 0,
    predictForwardBusinessIncome: null,
    predictTotalBusinessIncome: null,
    roomFeePriceIncludingCommission: 0,
    occ: 0,
    adr: 0,
    revPar: 0,
    openRoomCount: 0,
    roomCount: 0,
    allDayOpenRoomCount: 0,
    growthTrendAnalysisList: [],
    orderOriginAnalysisList: [],
    orderTotalCount: 0,
    allDayRoomFeePriceIncludingCommission: 0,
  })
}

function createEnvelope(data: RawStatisticsReport, suffix: string): ApiEnvelope<RawStatisticsReport> {
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

function rawTrend(
  date: string,
  businessIncome: number,
  roomFeePriceIncludingCommission: number,
  otherOrderExpense: number,
  writeDownIncome: number,
  occ: number,
  adr: number,
  revPar: number,
  openRoomCount: number,
): RawTrendPoint {
  return {
    date,
    businessIncome,
    roomFeePriceIncludingCommission,
    otherOrderExpense,
    writeDownIncome,
    occ,
    adr,
    revPar,
    openRoomCount,
  }
}

function rawResponse(overrides: Partial<RawStatisticsReport>): RawStatisticsReport {
  return {
    writeDownIncome: 0,
    businessIncome: 0,
    predictForwardBusinessIncome: null,
    predictTotalBusinessIncome: null,
    roomFeePriceIncludingCommission: 0,
    hourRoomFeePriceIncludingCommission: 0,
    otherOrderExpense: 0,
    occ: 0,
    adr: 0,
    revPar: 0,
    openRoomCount: 0,
    roomCount: 0,
    allDayOpenRoomCount: 0,
    hourOpenRoomCount: 0,
    growthTrendAnalysisList: [],
    orderOriginAnalysisList: [],
    orderTotalCount: 0,
    accommodationIncome: 0,
    predictForwardAccommodationIncome: null,
    predictTotalAccommodationIncome: null,
    foodIncome: 0,
    predictForwardFoodIncome: null,
    predictTotalFoodIncome: null,
    supermarketIncome: 0,
    predictForwardSupermarketIncome: null,
    predictTotalSupermarketIncome: null,
    entertainmentIncome: 0,
    predictForwardEntertainmentIncome: null,
    predictTotalEntertainmentIncome: null,
    venueIncome: 0,
    predictForwardVenueIncome: null,
    predictTotalVenueIncome: null,
    allDayRoomFeePriceIncludingCommission: 0,
    ...overrides,
  }
}

function series(key: string, label: string, color: string, values: number[]): StatisticsReportTrendSeries {
  return { key, label, color, values }
}

function buildSignature(requestBody: Record<string, unknown>) {
  const ordered: Record<string, unknown> = {}
  for (const key of Object.keys(requestBody).sort()) {
    ordered[key] = requestBody[key]
  }
  return JSON.stringify(ordered)
}

function formatMoney(value: number) {
  return value.toFixed(2)
}

function formatNullableMoney(value: number | null) {
  return value === null ? '-' : value.toFixed(2)
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`
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
