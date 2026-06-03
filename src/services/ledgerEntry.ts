export type LedgerEntryProviderName = 'mock' | 'api'
export type LedgerEntryMockState = 'success' | 'empty' | 'error'
export type LedgerEntryType = 'all' | 'income' | 'expense'

export type LedgerEntryQuery = {
  storeId: string
  storeName: string
  startDate: string
  endDate: string
  type: LedgerEntryType
  roomCategoryId: string
  page: number
  pageSize: number
  state?: LedgerEntryMockState
}

export type LedgerEntrySummaryCard = {
  key: 'income' | 'expense'
  title: string
  amount: number
  trend: string
  detail: string
}

export type LedgerEntryRow = {
  id: string
  type: Exclude<LedgerEntryType, 'all'>
  typeLabel: string
  project: string
  amount: number
  paymentWay: string
  occurredAt: string
  roomCategoryName: string
  roomName: string
  remark: string
  operatorName: string
  channelName: string
}

export type LedgerEntryDashboard = {
  provider: LedgerEntryProviderName
  state: LedgerEntryMockState
  request: LedgerEntryQuery
  stores: Array<{ id: string; name: string }>
  typeOptions: Array<{ value: LedgerEntryType; label: string }>
  roomCategories: Array<{ id: string; name: string }>
  paymentWays: string[]
  summaryCards: LedgerEntrySummaryCard[]
  netIncome: number
  currency: string
  rows: LedgerEntryRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  updatedAt: string
  traceIds: string[]
}

type TargetEnvelope<T> = {
  success: boolean
  errorCode: string | null
  errorMsg: string | null
  errorDetail: string | null
  data: T
}

type RawPagedList<T> = {
  total: number
  size: number
  current: number
  extraInfo: null
  pageNum: number
  hasNextPage: boolean
  pages: number
  list: T[]
}

type RawLedgerListItem = {
  id: string
  accountName: string
  isIncome: 0 | 1
  typeName: string
  amount: number
  paymentWayName: string
  roomCategoryName: string
  roomName: string
  note: string
  operatorName: string
  channelName: string
  gmtCreate: string
}

type RawLedgerPage = {
  costPricePages: RawPagedList<RawLedgerListItem>
  income: number
  expend: number
  netIncome: number
}

type RawRoomCategory = {
  roomCategoryId: string
  name: string
}

type RawRoomCategoryResponse = RawPagedList<RawRoomCategory>

type RawRoomCategoryRoom = {
  roomCategoryId: string
  roomCategoryName: string
  rooms: Array<{ roomId: string; roomName: string }>
}

type RawPaymentWay = {
  paymentWayId: string
  paymentWayName: string
}

type RawPoiPage = RawPagedList<{
  poiId: string
  poiName: string
}>

const RESPONSE_TIMESTAMP = '2026-05-19T16:40:00+08:00'
const PRIMARY_STORE_ID = '1796067693589061634'
const PRIMARY_STORE_NAME = '天落会宿公寓(前海壹方城宝安中心店)'
const ALL_STORES_ID = 'all-stores'
const LEDGER_ENTRY_PROVIDER_KEY = 'pms.ledgerEntryProvider'
const realBaseUrl = '/api'
const poiEndpoint = '/select/poi/page/get'
const roomCategoriesEndpoint = '/roomCategories/page/get'
const paymentWaysEndpoint = '/paymentWays/get'
const roomsEndpoint = '/rooms/get'
const ledgerDashboardEndpoint = '/orderLedger/dashboard/get'

const ledgerRows: RawLedgerListItem[] = [
  {
    id: 'ledger-20260518-001',
    accountName: '订单房费入账',
    isIncome: 1,
    typeName: '收入',
    amount: 1680,
    paymentWayName: '微信支付',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    roomName: '顶层套房 01',
    note: '携程订单 M335275070 完成结算',
    operatorName: '系统自动入账',
    channelName: '携程民宿',
    gmtCreate: '2026-05-18 10:20:12',
  },
  {
    id: 'ledger-20260518-002',
    accountName: '保洁服务采购',
    isIncome: 0,
    typeName: '支出',
    amount: 220,
    paymentWayName: '支付宝',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomName: '总裁套间 02',
    note: '周末深度保洁补差',
    operatorName: '店长 刘敏',
    channelName: '线下采购',
    gmtCreate: '2026-05-18 14:08:33',
  },
  {
    id: 'ledger-20260517-003',
    accountName: '加时房费补收',
    isIncome: 1,
    typeName: '收入',
    amount: 368,
    paymentWayName: '美团支付',
    roomCategoryName: '观影大床房',
    roomName: '观影大床房(房间1)',
    note: '凌晨延时退房补收 2 小时',
    operatorName: '前台 小路',
    channelName: '美团民宿',
    gmtCreate: '2026-05-17 23:18:08',
  },
  {
    id: 'ledger-20260517-004',
    accountName: '零食补货',
    isIncome: 0,
    typeName: '支出',
    amount: 96,
    paymentWayName: '现金',
    roomCategoryName: '天落大床电竞套间',
    roomName: '电竞套间 03',
    note: '补充房内饮品与零食',
    operatorName: '采购 阿泽',
    channelName: '门店仓库',
    gmtCreate: '2026-05-17 11:42:51',
  },
  {
    id: 'ledger-20260516-005',
    accountName: '押金转房费',
    isIncome: 1,
    typeName: '收入',
    amount: 520,
    paymentWayName: '银行卡',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomName: '总裁套间 06',
    note: '入住押金结转至房费',
    operatorName: '前台 小苏',
    channelName: '门店直销',
    gmtCreate: '2026-05-16 18:06:17',
  },
  {
    id: 'ledger-20260516-006',
    accountName: '布草清洗费',
    isIncome: 0,
    typeName: '支出',
    amount: 180,
    paymentWayName: '对公转账',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    roomName: '顶层套房 02',
    note: '周中批量清洗结算',
    operatorName: '运营主管',
    channelName: '洗涤供应商',
    gmtCreate: '2026-05-16 16:24:05',
  },
]

const stores = [
  { id: ALL_STORES_ID, name: '全部门店' },
  { id: PRIMARY_STORE_ID, name: PRIMARY_STORE_NAME },
]

const typeOptions = [
  { value: 'all' as const, label: '全部类型' },
  { value: 'income' as const, label: '收入' },
  { value: 'expense' as const, label: '支出' },
]

const roomCategories = [
  { roomCategoryId: 'all', name: '请选择房型' },
  { roomCategoryId: '1796425099729092609', name: '观影大床房' },
  { roomCategoryId: '1796425099485822977', name: '天落大床电竞套间' },
  { roomCategoryId: '1796425099242553345', name: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { roomCategoryId: '1796425098965729282', name: '顶层套房（浴缸巨幕电竞麻将）' },
]

const paymentWays = [
  { paymentWayId: 'wechat', paymentWayName: '微信支付' },
  { paymentWayId: 'alipay', paymentWayName: '支付宝' },
  { paymentWayId: 'bank-card', paymentWayName: '银行卡' },
  { paymentWayId: 'cash', paymentWayName: '现金' },
  { paymentWayId: 'public-transfer', paymentWayName: '对公转账' },
]

export class LedgerEntryServiceError extends Error {
  readonly response: TargetEnvelope<null>
  readonly provider: LedgerEntryProviderName
  readonly state: LedgerEntryMockState
  readonly request: LedgerEntryQuery

  constructor(message: string, response: TargetEnvelope<null>, request: LedgerEntryQuery) {
    super(message)
    this.name = 'LedgerEntryServiceError'
    this.response = response
    this.provider = resolveLedgerEntryProvider()
    this.state = 'error'
    this.request = request
  }
}

export function defaultLedgerEntryQuery(): LedgerEntryQuery {
  return {
    storeId: ALL_STORES_ID,
    storeName: '全部门店',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    type: 'all',
    roomCategoryId: 'all',
    page: 1,
    pageSize: 10,
    state: 'success',
  }
}

export function resolveLedgerEntryProvider(searchParams = readLedgerEntrySearchParams()): LedgerEntryProviderName {
  const urlValue = searchParams.get('provider')?.trim() || searchParams.get('ledgerEntryProvider')?.trim()
  const localValue = typeof window !== 'undefined' ? window.localStorage.getItem(LEDGER_ENTRY_PROVIDER_KEY)?.trim() : null
  const envValue = (import.meta.env.VITE_LEDGER_ENTRY_PROVIDER as string | undefined)?.trim()
  const provider = (urlValue || localValue || envValue || 'api').toLowerCase()
  if (provider === 'mock' || provider === 'api') return provider
  if (provider === 'real') return 'api'
  throw new Error(`Unsupported ledger entry provider: ${provider}`)
}

export async function fetchLedgerEntryDashboard(
  request: LedgerEntryQuery,
  signal?: AbortSignal,
): Promise<LedgerEntryDashboard> {
  const provider = resolveLedgerEntryProvider()
  const normalizedRequest = normalizeQuery(request)
  validateQuery(normalizedRequest)

  if (provider === 'api') {
    return fetchApiLedgerEntryDashboard(normalizedRequest, signal)
  }

  await waitForMockLatency(signal)

  if (normalizedRequest.state === 'error') {
    throw new LedgerEntryServiceError(
      '记一笔明细数据加载失败，请稍后重试',
      failEnvelope('LEDGER_ENTRY_QUERY_FAILED', '账本明细查询失败', null),
      normalizedRequest,
    )
  }

  const roomCategoriesEnvelope = makeRoomCategoriesEnvelope()
  const paymentWaysEnvelope = makePaymentWaysEnvelope()
  const roomCategoryRoomsEnvelope = makeRoomsEnvelope()
  const ledgerEnvelope = makeLedgerEnvelope(normalizedRequest)

  return adaptDashboard(provider, normalizedRequest, roomCategoriesEnvelope, paymentWaysEnvelope, roomCategoryRoomsEnvelope, ledgerEnvelope)
}

export async function createLedgerEntryExportTask(request: LedgerEntryQuery, signal?: AbortSignal) {
  validateQuery(normalizeQuery(request))
  await waitForMockLatency(signal)
  return okEnvelope({
    taskId: 'ledger-entry-export-20260519-001',
    requestedAt: RESPONSE_TIMESTAMP,
    targetRoute: '/statistics/orderLedger',
  })
}

function normalizeQuery(request: LedgerEntryQuery): LedgerEntryQuery {
  const defaults = defaultLedgerEntryQuery()
  const state: LedgerEntryMockState = request.state === 'empty' || request.state === 'error' ? request.state : 'success'
  const store = stores.find((item) => item.id === request.storeId)
  return {
    ...defaults,
    ...request,
    storeId: request.storeId || defaults.storeId,
    storeName: store?.name ?? request.storeName ?? defaults.storeName,
    type: request.type === 'income' || request.type === 'expense' ? request.type : 'all',
    roomCategoryId: request.roomCategoryId || defaults.roomCategoryId,
    page: Number.isFinite(request.page) && request.page > 0 ? Math.floor(request.page) : defaults.page,
    pageSize: Number.isFinite(request.pageSize) && request.pageSize > 0 ? Math.floor(request.pageSize) : defaults.pageSize,
    state,
  }
}

function validateQuery(request: LedgerEntryQuery) {
  if (request.startDate > request.endDate) {
    throw new LedgerEntryServiceError(
      '开始日期不能晚于结束日期',
      failEnvelope('LEDGER_ENTRY_INVALID_DATE_RANGE', '开始日期不能晚于结束日期', null),
      request,
    )
  }
}


async function fetchApiLedgerEntryDashboard(
  request: LedgerEntryQuery,
  signal?: AbortSignal,
): Promise<LedgerEntryDashboard> {
  const campId = resolveCampId()
  const ledgerRequest = {
    campId,
    pageNum: request.page,
    pageSize: request.pageSize,
    beginTime: toDayStart(request.startDate),
    endTime: toDayEnd(request.endDate),
    isIncome: request.type === 'income' ? 1 : request.type === 'expense' ? 0 : null,
    roomCategoryId: request.roomCategoryId === 'all' ? null : request.roomCategoryId,
  }

  const [poiEnvelope, roomCategoriesEnvelope, paymentWaysEnvelope, roomsEnvelope, ledgerEnvelope] = await Promise.all([
    postHudson<RawPoiPage>(poiEndpoint, { campId, pageNum: 1, pageSize: 100 }, signal),
    postHudson<RawRoomCategoryResponse>(roomCategoriesEndpoint, { campId, pageNum: 1, pageSize: 100 }, signal),
    postHudson<{ paymentWays: RawPaymentWay[] }>(paymentWaysEndpoint, { campId }, signal),
    postHudson<{ roomCategoryRooms: RawRoomCategoryRoom[] }>(roomsEndpoint, { campId }, signal),
    postHudson<RawLedgerPage>(ledgerDashboardEndpoint, ledgerRequest, signal),
  ])

  return adaptDashboard('api', request, roomCategoriesEnvelope, paymentWaysEnvelope, roomsEnvelope, ledgerEnvelope, poiEnvelope)
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<TargetEnvelope<T>> {
  const response = await fetch(`${realBaseUrl}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: (TargetEnvelope<T> & { code?: number; message?: string }) | null
  try {
    payload = (await response.json()) as TargetEnvelope<T> & { code?: number; message?: string }
  } catch {
    payload = null
  }

  if (!response.ok || !payload) {
    throw new Error(`${endpoint} request failed`)
  }
  if ('code' in payload && payload.code !== 0) {
    throw new Error(payload.message || `${endpoint} business error`)
  }
  if ('success' in payload && payload.success === false) {
    throw new Error(payload.errorMsg ?? payload.errorDetail ?? `${endpoint} business error`)
  }
  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} response missing data`)
  }

  return okEnvelope(payload.data)
}

function makeRoomCategoriesEnvelope(): TargetEnvelope<RawRoomCategoryResponse> {
  return okEnvelope({
    total: roomCategories.length - 1,
    size: 999,
    current: 1,
    extraInfo: null,
    pageNum: 1,
    hasNextPage: false,
    pages: 1,
    list: roomCategories.slice(1).map((item) => ({ roomCategoryId: item.roomCategoryId, name: item.name })),
  })
}

function makePaymentWaysEnvelope(): TargetEnvelope<{ paymentWays: RawPaymentWay[] }> {
  return okEnvelope({ paymentWays })
}

function makeRoomsEnvelope(): TargetEnvelope<{ roomCategoryRooms: RawRoomCategoryRoom[] }> {
  return okEnvelope({
    roomCategoryRooms: roomCategories.slice(1).map((category, index) => ({
      roomCategoryId: category.roomCategoryId,
      roomCategoryName: category.name,
      rooms: [
        { roomId: `${category.roomCategoryId}-0`, roomName: `${category.name} ${index + 1}号` },
        { roomId: `${category.roomCategoryId}-1`, roomName: `${category.name} ${index + 2}号` },
      ],
    })),
  })
}

function makeLedgerEnvelope(request: LedgerEntryQuery): TargetEnvelope<RawLedgerPage> {
  const filteredList = request.state === 'empty' ? [] : filterLedgerRows(request)
  const startIndex = (request.page - 1) * request.pageSize
  const pageList = filteredList.slice(startIndex, startIndex + request.pageSize)
  const income = filteredList.filter((item) => item.isIncome === 1).reduce((sum, item) => sum + item.amount, 0)
  const expend = filteredList.filter((item) => item.isIncome === 0).reduce((sum, item) => sum + item.amount, 0)
  return okEnvelope({
    costPricePages: {
      total: filteredList.length,
      size: request.pageSize,
      current: request.page,
      extraInfo: null,
      pageNum: request.page,
      hasNextPage: startIndex + request.pageSize < filteredList.length,
      pages: Math.max(1, Math.ceil(filteredList.length / request.pageSize)),
      list: pageList,
    },
    income,
    expend,
    netIncome: income - expend,
  })
}

function filterLedgerRows(request: LedgerEntryQuery) {
  return ledgerRows.filter((row) => {
    const typeMatches =
      request.type === 'all' ||
      (request.type === 'income' && row.isIncome === 1) ||
      (request.type === 'expense' && row.isIncome === 0)
    const roomCategoryMatches =
      request.roomCategoryId === 'all' ||
      roomCategories.find((category) => category.roomCategoryId === request.roomCategoryId)?.name === row.roomCategoryName
    const dateMatches = row.gmtCreate.slice(0, 10) >= request.startDate && row.gmtCreate.slice(0, 10) <= request.endDate
    return typeMatches && roomCategoryMatches && dateMatches
  })
}

function adaptDashboard(
  provider: LedgerEntryProviderName,
  request: LedgerEntryQuery,
  roomCategoriesEnvelope: TargetEnvelope<RawRoomCategoryResponse>,
  paymentWaysEnvelope: TargetEnvelope<{ paymentWays: RawPaymentWay[] }>,
  roomsEnvelope: TargetEnvelope<{ roomCategoryRooms: RawRoomCategoryRoom[] }>,
  ledgerEnvelope: TargetEnvelope<RawLedgerPage>,
  poiEnvelope?: TargetEnvelope<RawPoiPage>,
): LedgerEntryDashboard {
  assertSuccess(roomCategoriesEnvelope)
  assertSuccess(paymentWaysEnvelope)
  assertSuccess(roomsEnvelope)
  assertSuccess(ledgerEnvelope)
  if (poiEnvelope) assertSuccess(poiEnvelope)

  const paymentWayNames = paymentWaysEnvelope.data.paymentWays.map((item) => item.paymentWayName)
  const storeList = poiEnvelope
    ? [
        { id: ALL_STORES_ID, name: '全部门店' },
        ...poiEnvelope.data.list.map((item) => ({ id: item.poiId, name: item.poiName })),
      ]
    : stores
  const rows = ledgerEnvelope.data.costPricePages.list.map((row) => ({
    id: row.id,
    type: (row.isIncome === 1 ? 'income' : 'expense') as LedgerEntryRow['type'],
    typeLabel: row.typeName,
    project: row.accountName,
    amount: row.amount,
    paymentWay: row.paymentWayName,
    occurredAt: row.gmtCreate,
    roomCategoryName: row.roomCategoryName,
    roomName: row.roomName,
    remark: row.note,
    operatorName: row.operatorName,
    channelName: row.channelName,
  }))

  const summaryCards: LedgerEntrySummaryCard[] = [
    {
      key: 'income',
      title: '收入(元)',
      amount: ledgerEnvelope.data.income,
      trend: rows.length ? `共 ${rows.filter((row) => row.type === 'income').length} 笔收入流水` : '当前周期暂无收入流水',
      detail: '收入明细来自账本分页接口，覆盖订单房费、押金转房费和加时补收等场景。',
    },
    {
      key: 'expense',
      title: '支出 (元)',
      amount: ledgerEnvelope.data.expend,
      trend: rows.length ? `共 ${rows.filter((row) => row.type === 'expense').length} 笔支出流水` : '当前周期暂无支出流水',
      detail: '支出明细来自账本分页接口，覆盖保洁、布草和门店补货等成本项目。',
    },
  ]

  const roomCategoryOptions = [
    { id: roomCategories[0].roomCategoryId, name: roomCategories[0].name },
    ...roomCategoriesEnvelope.data.list.map((item) => ({ id: item.roomCategoryId, name: item.name })),
  ]

  return {
    provider,
    state: request.state ?? 'success',
    request,
    stores: storeList,
    typeOptions,
    roomCategories: roomCategoryOptions,
    paymentWays: paymentWayNames,
    summaryCards,
    netIncome: ledgerEnvelope.data.netIncome,
    currency: 'CNY',
    rows,
    pagination: {
      page: ledgerEnvelope.data.costPricePages.current,
      pageSize: ledgerEnvelope.data.costPricePages.size,
      total: ledgerEnvelope.data.costPricePages.total,
    },
    updatedAt: RESPONSE_TIMESTAMP,
    traceIds: [
      'mock-ledger-room-categories-001',
      'mock-ledger-payment-ways-001',
      'mock-ledger-rooms-001',
      'mock-ledger-account-book-001',
    ],
  }
}

function assertSuccess<T>(response: TargetEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.errorMsg ?? '服务请求失败')
  }
}

function okEnvelope<T>(data: T): TargetEnvelope<T> {
  return {
    success: true,
    errorCode: null,
    errorMsg: null,
    errorDetail: null,
    data,
  }
}

function failEnvelope<T>(errorCode: string, errorMsg: string, data: T): TargetEnvelope<T> {
  return {
    success: false,
    errorCode,
    errorMsg,
    errorDetail: errorMsg,
    data,
  }
}

function waitForMockLatency(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Request aborted', 'AbortError'))
      return
    }
    const timer = window.setTimeout(resolve, 180)
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

function readLedgerEntrySearchParams(baseParams = new URLSearchParams()) {
  const params = new URLSearchParams(baseParams)
  if (typeof window === 'undefined') return params

  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value)
  })

  const hashQuery = window.location.hash.split('?')[1]
  if (hashQuery) {
    new URLSearchParams(hashQuery).forEach((value, key) => {
      if (!params.has(key)) params.set(key, value)
    })
  }

  return params
}

function resolveCampId() {
  const params = readLedgerEntrySearchParams()
  const urlCampId = params.get('campId')?.trim()
  const storageCampId =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('pmsCampId')?.trim() ||
        window.localStorage.getItem('pms.currentCampId')?.trim() ||
        ''
      : ''
  const envCampId = (import.meta.env.VITE_PMS_CAMP_ID as string | undefined)?.trim()
  return urlCampId || storageCampId || envCampId || PRIMARY_STORE_ID
}

function toDayStart(value: string) {
  return value.length === 10 ? `${value} 00:00:00` : value
}

function toDayEnd(value: string) {
  return value.length === 10 ? `${value} 23:59:59` : value
}
