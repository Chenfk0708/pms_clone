import { resolveCurrentCampId } from '../utils/camp'

const SHIFT_RECORD_PROVIDER_KEY = 'pms.shiftRecordProvider'

export const SHIFT_RECORD_LIST_PATH = '/shiftWorkReport/page/get'
export const SHIFT_RECORD_STORE_PATH = '/select/poi/page/get'
export const SHIFT_RECORD_EMPLOYEE_PATH = '/campRoles/get'

const realBaseUrl = '/api'
const defaultCampId = '10001'
const currentStorePoiId = '1796425098638573570'

export type ShiftRecordProviderName = 'mock' | 'api'
export type ShiftRecordMockState = 'success' | 'empty' | 'error'

export type ShiftRecordFilters = {
  startDate: string
  endDate: string
  storeId: string
  handoverUserId: string
  receiverUserId: string
  pageNum: number
  pageSize: number
  campId: string
  mockState: ShiftRecordMockState
}

export type ShiftRecordOption = {
  value: string
  label: string
}

export type ShiftRecordIncomeSourceItem = {
  sourceName: string
  income: number
  expend: number
  remark: string
}

export type ShiftRecordPaymentTypeItem = {
  paymentName: string
  income: number
  expend: number
  remark: string
}

export type ShiftRecordGoodsItem = {
  id: string
  goodsName: string
  goodsNumber: number
  remark: string
}

export type ShiftRecordWorkReport = {
  workUserStartDate: string
  workUserEndDate: string
  generalIncome: number
  netIncome: number
  totalExpenditure: number
  workGoods: ShiftRecordGoodsItem[]
  workIncomeSourceList: ShiftRecordIncomeSourceItem[]
  paymentTypeList: ShiftRecordPaymentTypeItem[]
  remark: string
}

export type ShiftRecordRow = {
  id: string
  handoverDate: string
  shiftName: string
  handoverUserId: string
  handoverUserName: string
  handoverTime: string
  receiverUserId: string
  receiverUserName: string
  receiverTime: string
  workStatus: number
  status: string
  handoverRemark: string
  receiverRemark: string
  systemGeneratedAt: string
  storeId: string
  storeName: string
  workReport: string
  workReportDetail: ShiftRecordWorkReport | null
  cashAmount: number
  roomCardCount: number
  nightAuditStatus: string
}

export type ShiftRecordDashboard = {
  filters: ShiftRecordFilters
  stores: ShiftRecordOption[]
  employees: ShiftRecordOption[]
  rows: ShiftRecordRow[]
  pagination: {
    total: number
    size: number
    current: number
    pageNum: number
    hasNextPage: boolean
    pages: number
  }
  requestedAt: string
  provider: ShiftRecordProviderName
  audit: string[]
}

export type ShiftRecordExportResult = {
  provider: ShiftRecordProviderName
  taskId: string
  downloadUrl: string
  requestedAt: string
  audit: string[]
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
  errorCode?: string | null
  errorMsg?: string | null
  errorDetail?: string | null
  data?: T
}

type ShiftRecordPayload = {
  stores: ShiftRecordOption[]
  employees: ShiftRecordOption[]
  rows: ShiftRecordRow[]
  pagination: ShiftRecordDashboard['pagination']
}

function createMockWorkReport(detail: {
  workUserStartDate: string
  workUserEndDate: string
  generalIncome: number
  netIncome: number
  totalExpenditure: number
  workGoods: ShiftRecordGoodsItem[]
  workIncomeSourceList: ShiftRecordIncomeSourceItem[]
  paymentTypeList: ShiftRecordPaymentTypeItem[]
  remark: string
}) {
  return JSON.stringify(detail)
}

const storeOptions: ShiftRecordOption[] = [
  { value: 'all', label: '全部门店' },
  { value: currentStorePoiId, label: '天落会宿公寓(前海壹方城宝安中心店)' },
  { value: '1796425098638573588', label: '天落会宿公寓(会展中心店)' },
]

const employeeOptions: ShiftRecordOption[] = [
  { value: 'all', label: '全部员工' },
  { value: '1796067693261905922', label: '路客云6TS5' },
  { value: '1796067693261905933', label: '陈早班' },
  { value: '1796067693261905944', label: '王夜班' },
]

const mockRows: ShiftRecordRow[] = [
  {
    id: 'SR20260518001',
    handoverDate: '2026-05-18',
    shiftName: '早班',
    handoverUserId: '1796067693261905922',
    handoverUserName: '路客云6TS5',
    handoverTime: '2026-05-18 08:30:00',
    receiverUserId: '1796067693261905933',
    receiverUserName: '陈早班',
    receiverTime: '2026-05-18 08:45:00',
    workStatus: 1,
    status: '已完成',
    handoverRemark: '备用金 5000 元，房卡 12 张，布草已交接。',
    receiverRemark: '夜审报表已核对，前台备用金确认无误。',
    systemGeneratedAt: '2026-05-18 08:45:12',
    storeId: currentStorePoiId,
    storeName: '天落会宿公寓(前海壹方城宝安中心店)',
    workReport: createMockWorkReport({
      workUserStartDate: '08:00:00',
      workUserEndDate: '08:45:00',
      generalIncome: 5320,
      netIncome: 4860,
      totalExpenditure: 460,
      workGoods: [
        { id: 'goods-card-a', goodsName: '房卡A组', goodsNumber: 12, remark: '已清点' },
        { id: 'goods-key-frontdesk', goodsName: '前台备用钥匙', goodsNumber: 2, remark: '柜内存放' },
      ],
      workIncomeSourceList: [
        { sourceName: '房费', income: 4680, expend: 0, remark: '含散客与续住' },
        { sourceName: '其他', income: 640, expend: 0, remark: '月租追缴' },
      ],
      paymentTypeList: [
        { paymentName: '现金', income: 1200, expend: 0, remark: '备用金已核对' },
        { paymentName: '微信', income: 4120, expend: 460, remark: '退款已冲销' },
      ],
      remark: '夜审报表、房卡与钥匙物资均已完成交接。',
    }),
    workReportDetail: {
      workUserStartDate: '08:00:00',
      workUserEndDate: '08:45:00',
      generalIncome: 5320,
      netIncome: 4860,
      totalExpenditure: 460,
      workGoods: [
        { id: 'goods-card-a', goodsName: '房卡A组', goodsNumber: 12, remark: '已清点' },
        { id: 'goods-key-frontdesk', goodsName: '前台备用钥匙', goodsNumber: 2, remark: '柜内存放' },
      ],
      workIncomeSourceList: [
        { sourceName: '房费', income: 4680, expend: 0, remark: '含散客与续住' },
        { sourceName: '其他', income: 640, expend: 0, remark: '月租追缴' },
      ],
      paymentTypeList: [
        { paymentName: '现金', income: 1200, expend: 0, remark: '备用金已核对' },
        { paymentName: '微信', income: 4120, expend: 460, remark: '退款已冲销' },
      ],
      remark: '夜审报表、房卡与钥匙物资均已完成交接。',
    },
    cashAmount: 5000,
    roomCardCount: 12,
    nightAuditStatus: '夜审报表已核对',
  },
  {
    id: 'SR20260518002',
    handoverDate: '2026-05-18',
    shiftName: '晚班',
    handoverUserId: '1796067693261905933',
    handoverUserName: '陈早班',
    handoverTime: '2026-05-18 20:10:00',
    receiverUserId: '1796067693261905922',
    receiverUserName: '路客云6TS5',
    receiverTime: '2026-05-18 20:22:00',
    workStatus: 2,
    status: '待接班',
    handoverRemark: '待查 1 笔微信退款，已登记在交班本。',
    receiverRemark: '已通知值班店长复核退款流水。',
    systemGeneratedAt: '2026-05-18 20:22:31',
    storeId: currentStorePoiId,
    storeName: '天落会宿公寓(前海壹方城宝安中心店)',
    workReport: createMockWorkReport({
      workUserStartDate: '20:00:00',
      workUserEndDate: '20:22:00',
      generalIncome: 4200,
      netIncome: 3920,
      totalExpenditure: 280,
      workGoods: [{ id: 'goods-card-b', goodsName: '房卡B组', goodsNumber: 10, remark: '待复核' }],
      workIncomeSourceList: [{ sourceName: '房费', income: 4200, expend: 0, remark: '晚班实收' }],
      paymentTypeList: [{ paymentName: '微信', income: 4200, expend: 280, remark: '退款流水待复核' }],
      remark: '有一笔退款需接班人继续核对。',
    }),
    workReportDetail: {
      workUserStartDate: '20:00:00',
      workUserEndDate: '20:22:00',
      generalIncome: 4200,
      netIncome: 3920,
      totalExpenditure: 280,
      workGoods: [{ id: 'goods-card-b', goodsName: '房卡B组', goodsNumber: 10, remark: '待复核' }],
      workIncomeSourceList: [{ sourceName: '房费', income: 4200, expend: 0, remark: '晚班实收' }],
      paymentTypeList: [{ paymentName: '微信', income: 4200, expend: 280, remark: '退款流水待复核' }],
      remark: '有一笔退款需接班人继续核对。',
    },
    cashAmount: 4200,
    roomCardCount: 10,
    nightAuditStatus: '退款流水待复核',
  },
  {
    id: 'SR20260519001',
    handoverDate: '2026-05-19',
    shiftName: '早班',
    handoverUserId: '1796067693261905922',
    handoverUserName: '路客云6TS5',
    handoverTime: '2026-05-19 08:18:00',
    receiverUserId: '1796067693261905933',
    receiverUserName: '陈早班',
    receiverTime: '2026-05-19 08:29:00',
    workStatus: 0,
    status: '待交班',
    handoverRemark: '客诉 1 起已转客服，房态与房卡数量一致。',
    receiverRemark: '已跟进客诉，交班信息完整。',
    systemGeneratedAt: '2026-05-19 08:29:10',
    storeId: '1796425098638573588',
    storeName: '天落会宿公寓(会展中心店)',
    workReport: createMockWorkReport({
      workUserStartDate: '08:00:00',
      workUserEndDate: '08:29:00',
      generalIncome: 3800,
      netIncome: 3800,
      totalExpenditure: 0,
      workGoods: [{ id: 'goods-card-c', goodsName: '房卡C组', goodsNumber: 8, remark: '数量一致' }],
      workIncomeSourceList: [{ sourceName: '房费', income: 3800, expend: 0, remark: '早班房费' }],
      paymentTypeList: [{ paymentName: '支付宝', income: 3800, expend: 0, remark: '已全部入账' }],
      remark: '客诉已转客服，本班次待正式交班确认。',
    }),
    workReportDetail: {
      workUserStartDate: '08:00:00',
      workUserEndDate: '08:29:00',
      generalIncome: 3800,
      netIncome: 3800,
      totalExpenditure: 0,
      workGoods: [{ id: 'goods-card-c', goodsName: '房卡C组', goodsNumber: 8, remark: '数量一致' }],
      workIncomeSourceList: [{ sourceName: '房费', income: 3800, expend: 0, remark: '早班房费' }],
      paymentTypeList: [{ paymentName: '支付宝', income: 3800, expend: 0, remark: '已全部入账' }],
      remark: '客诉已转客服，本班次待正式交班确认。',
    },
    cashAmount: 3800,
    roomCardCount: 8,
    nightAuditStatus: '客诉已转客服',
  },
]

export function createDefaultShiftRecordFilters(searchParams = new URLSearchParams()): ShiftRecordFilters {
  return {
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    storeId: searchParams.get('storeId') || 'all',
    handoverUserId: searchParams.get('handoverUserId') || 'all',
    receiverUserId: searchParams.get('receiverUserId') || 'all',
    pageNum: Number(searchParams.get('pageNum') || 1),
    pageSize: Number(searchParams.get('pageSize') || 20),
    campId: searchParams.get('campId') || resolveCurrentCampId(defaultCampId),
    mockState: toMockState(searchParams.get('mockState')),
  }
}

export function buildShiftRecordRequest(filters: ShiftRecordFilters) {
  return {
    startDate: filters.startDate,
    endDate: filters.endDate,
    storeId: filters.storeId,
    handoverUserId: filters.handoverUserId,
    receiverUserId: filters.receiverUserId,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    campId: filters.campId,
  }
}

export async function fetchShiftRecordDashboard(
  filters: ShiftRecordFilters,
  providerName = getShiftRecordProviderName(),
  signal?: AbortSignal,
): Promise<ShiftRecordDashboard> {
  validateFilters(filters)

  if (providerName === 'api') {
    return fetchApiShiftRecordDashboard(filters, signal)
  }

  const envelope = await fetchMockShiftRecordDashboard(filters, signal)
  return adaptShiftRecordEnvelope(envelope, filters, providerName)
}

export async function exportShiftRecords(
  filters: ShiftRecordFilters,
  providerName = getShiftRecordProviderName(),
  signal?: AbortSignal,
): Promise<ShiftRecordExportResult> {
  validateFilters(filters)

  if (providerName === 'api') {
    throw new Error('交接班导出接口暂不可用，请稍后重试')
  }

  await delay(120, signal)
  const taskId = 'shift-record-export-001'
  return {
    provider: providerName,
    taskId,
    downloadUrl: `https://download.mock.local/shift-record/${taskId}.xlsx`,
    requestedAt: '2026-05-20T00:18:00+08:00',
    audit: [
      `exportTaskId=${taskId}`,
      `exportProvider=${providerName}`,
      `exportPageSize=${filters.pageSize}`,
      `exportStoreId=${filters.storeId}`,
    ],
  }
}

function getShiftRecordProviderName(): ShiftRecordProviderName {
  if (typeof window === 'undefined') return 'mock'
  const configured = window.localStorage.getItem(SHIFT_RECORD_PROVIDER_KEY)?.trim()
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

async function fetchMockShiftRecordDashboard(
  filters: ShiftRecordFilters,
  signal?: AbortSignal,
): Promise<UnifiedEnvelope<ShiftRecordPayload>> {
  await delay(160, signal)

  if (filters.mockState === 'error') {
    return {
      code: 50320,
      message: '交接班记录加载失败，请稍后重试',
      data: createEmptyPayload(filters),
      traceId: 'mock-baobiao--jiaojieban--jiaojieban-error-001',
      timestamp: '2026-05-20T00:18:00+08:00',
    }
  }

  if (filters.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: createEmptyPayload(filters),
      traceId: 'mock-baobiao--jiaojieban--jiaojieban-empty-001',
      timestamp: '2026-05-20T00:18:00+08:00',
    }
  }

  const rows = filterRows(filters)
  return {
    code: 0,
    message: 'success',
    data: {
      stores: storeOptions,
      employees: employeeOptions,
      rows,
      pagination: {
        total: rows.length,
        size: filters.pageSize,
        current: filters.pageNum,
        pageNum: filters.pageNum,
        hasNextPage: false,
        pages: rows.length ? 1 : 0,
      },
    },
    traceId: 'mock-baobiao--jiaojieban--jiaojieban-success-001',
    timestamp: '2026-05-20T00:18:00+08:00',
  }
}

function adaptShiftRecordEnvelope(
  envelope: UnifiedEnvelope<ShiftRecordPayload>,
  filters: ShiftRecordFilters,
  provider: ShiftRecordProviderName,
): ShiftRecordDashboard {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '交接班记录加载失败，请稍后重试')
  }

  const data = envelope.data
  if (!data || !Array.isArray(data.rows) || !Array.isArray(data.stores) || !Array.isArray(data.employees)) {
    throw new Error('交接班记录响应结构异常，请稍后重试')
  }

  return {
    filters,
    provider,
    stores: data.stores,
    employees: data.employees,
    rows: data.rows,
    pagination: data.pagination,
    requestedAt: envelope.timestamp,
    audit: [
      `provider=${provider}`,
      `listPath=${SHIFT_RECORD_LIST_PATH}`,
      `storePath=${SHIFT_RECORD_STORE_PATH}`,
      `employeePath=${SHIFT_RECORD_EMPLOYEE_PATH}`,
      `campId=${filters.campId}`,
      `startDate=${filters.startDate || 'all'}`,
      `endDate=${filters.endDate || 'all'}`,
      `poiId=${filters.storeId === 'all' ? 'all' : filters.storeId}`,
      `handoverUserId=${filters.handoverUserId === 'all' ? 'all' : filters.handoverUserId}`,
      `receiverUserId=${filters.receiverUserId === 'all' ? 'all' : filters.receiverUserId}`,
      `pageSize=${filters.pageSize}`,
      `total=${data.pagination.total}`,
      `storeCount=${Math.max(0, data.stores.length - 1)}`,
      `employeeCount=${Math.max(0, data.employees.length - 1)}`,
      `traceId=${envelope.traceId}`,
    ],
  }
}

function createEmptyPayload(filters: ShiftRecordFilters): ShiftRecordPayload {
  return {
    stores: storeOptions,
    employees: employeeOptions,
    rows: [],
    pagination: {
      total: 0,
      size: filters.pageSize,
      current: filters.pageNum,
      pageNum: filters.pageNum,
      hasNextPage: false,
      pages: 0,
    },
  }
}

function filterRows(filters: ShiftRecordFilters) {
  return mockRows.filter((row) => {
    if (filters.storeId !== 'all' && row.storeId !== filters.storeId) return false
    if (filters.handoverUserId !== 'all' && row.handoverUserId !== filters.handoverUserId) return false
    if (filters.receiverUserId !== 'all' && row.receiverUserId !== filters.receiverUserId) return false
    if (filters.startDate && row.handoverDate < filters.startDate) return false
    if (filters.endDate && row.handoverDate > filters.endDate) return false
    return true
  })
}

async function fetchApiShiftRecordDashboard(
  filters: ShiftRecordFilters,
  signal?: AbortSignal,
): Promise<ShiftRecordDashboard> {
  const [listPayload, storePayload, employeePayload] = await Promise.all([
    postHudson<Record<string, unknown>>(SHIFT_RECORD_LIST_PATH, buildListRequest(filters), signal),
    postHudson<Record<string, unknown>>(SHIFT_RECORD_STORE_PATH, buildStoreRequest(filters), signal),
    postHudson<Record<string, unknown>>(SHIFT_RECORD_EMPLOYEE_PATH, { campId: filters.campId }, signal),
  ])

  const stores = adaptStoreOptions(storePayload)
  const employees = adaptEmployeeOptions(employeePayload)
  const rows = asArray(listPayload.list).map(adaptApiRow)
  const pagination: ShiftRecordDashboard['pagination'] = {
    total: readNumber(listPayload.total, rows.length),
    size: readNumber(listPayload.size, filters.pageSize),
    current: readNumber(listPayload.current, filters.pageNum),
    pageNum: readNumber(listPayload.pageNum, filters.pageNum),
    hasNextPage: Boolean(listPayload.hasNextPage),
    pages: readNumber(listPayload.pages, rows.length ? 1 : 0),
  }

  return {
    filters,
    provider: 'api',
    stores,
    employees,
    rows,
    pagination,
    requestedAt: new Date().toISOString(),
    audit: [
      'provider=api',
      `listPath=${SHIFT_RECORD_LIST_PATH}`,
      `storePath=${SHIFT_RECORD_STORE_PATH}`,
      `employeePath=${SHIFT_RECORD_EMPLOYEE_PATH}`,
      `campId=${filters.campId}`,
      `startDate=${filters.startDate || 'all'}`,
      `endDate=${filters.endDate || 'all'}`,
      `poiId=${filters.storeId === 'all' ? 'all' : filters.storeId}`,
      `handoverUserId=${filters.handoverUserId === 'all' ? 'all' : filters.handoverUserId}`,
      `receiverUserId=${filters.receiverUserId === 'all' ? 'all' : filters.receiverUserId}`,
      `pageSize=${filters.pageSize}`,
      `total=${pagination.total}`,
      `storeCount=${Math.max(0, stores.length - 1)}`,
      `employeeCount=${Math.max(0, employees.length - 1)}`,
    ],
  }
}

function buildListRequest(filters: ShiftRecordFilters) {
  return {
    campId: filters.campId,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
    ...(filters.storeId !== 'all' ? { poiId: filters.storeId } : {}),
    ...(filters.startDate ? { startDate: filters.startDate } : {}),
    ...(filters.endDate ? { endDate: filters.endDate } : {}),
    ...(filters.handoverUserId !== 'all' ? { handoverUserId: filters.handoverUserId } : {}),
    ...(filters.receiverUserId !== 'all' ? { receiverUserId: filters.receiverUserId } : {}),
  }
}

function buildStoreRequest(filters: ShiftRecordFilters) {
  return {
    campId: filters.campId,
    pageSize: 999,
    pageNum: 1,
    channelId: 0,
    isAvailability: '1',
  }
}

async function postHudson<T>(path: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${realBaseUrl}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: HudsonEnvelope<T> | null
  try {
    payload = (await response.json()) as HudsonEnvelope<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg || payload?.errorDetail || payload?.errorCode || `${path} 请求失败：HTTP ${response.status}`)
  }

  if (!payload || payload.data === undefined || payload.data === null) {
    throw new Error(`${path} 响应缺少 data 字段`)
  }

  return payload.data
}

function adaptStoreOptions(payload: Record<string, unknown>) {
  const list = asArray(payload.list).map((item) => {
    const record = asRecord(item)
    return {
      value: readString(record, ['poiId', 'value', 'id']),
      label: readString(record, ['poiName', 'label', 'name']),
    }
  })
  const options = list.filter((item) => item.value && item.label)
  return [{ value: 'all', label: '全部门店' }, ...options]
}

function adaptEmployeeOptions(payload: Record<string, unknown>) {
  const employees = asArray(payload.employees).map((item) => {
    const record = asRecord(item)
    return {
      value: readString(record, ['userId', 'value', 'id']),
      label: readString(record, ['displayName', 'userName', 'name']),
    }
  })
  const options = employees.filter((item) => item.value && item.label)
  return [{ value: 'all', label: '全部员工' }, ...options]
}

function adaptApiRow(value: unknown): ShiftRecordRow {
  const record = asRecord(value)
  const handoverUserName = readString(record, ['workUserName', 'handoverUserName', 'handoverName', 'shiftUserName', 'userName'])
  const receiverUserName = readString(record, ['successorUserName', 'receiverUserName', 'receiverName', 'takeUserName', 'confirmUserName'])
  const workStatus = readNumber(record.workStatus, Number.NaN)
  const workReport = readString(record, ['workReport'])
  const workReportDetail = parseWorkReport(workReport)

  return {
    id: readString(record, ['nightAuditDetailId', 'id', 'shiftRecordId', 'recordId', 'handoverId']),
    handoverDate: readString(record, ['workDate', 'handoverDate', 'shiftDate', 'businessDate']),
    shiftName: readString(record, ['workName', 'shiftName', 'shiftDesc', 'shiftTypeName']),
    handoverUserId: readString(record, ['handoverUserId', 'shiftUserId', 'userId']),
    handoverUserName,
    handoverTime: readString(record, ['workTime', 'handoverTime', 'shiftOutTime', 'outTime', 'createTime']),
    receiverUserId: readString(record, ['receiverUserId', 'takeUserId', 'confirmUserId']),
    receiverUserName,
    receiverTime: readString(record, ['successorTime', 'receiverTime', 'shiftInTime', 'confirmTime']),
    workStatus: Number.isFinite(workStatus) ? workStatus : -1,
    status: resolveShiftRecordStatusLabel(workStatus, readString(record, ['statusName', 'shiftStatusName', 'statusText'])),
    handoverRemark: readString(record, ['workRemark', 'handoverRemark', 'shiftRemark', 'outRemark']),
    receiverRemark: readString(record, ['successorRemark', 'receiverRemark', 'confirmRemark', 'inRemark']),
    systemGeneratedAt: readString(record, ['systemGeneratedAt', 'createTime', 'createdAt']),
    storeId: readString(record, ['poiId', 'storeId']),
    storeName: readString(record, ['poiName', 'storeName']),
    workReport,
    workReportDetail,
    cashAmount: readNumber(record.cashAmount ?? record.reserveCash, 0),
    roomCardCount: readNumber(record.roomCardCount ?? record.cardCount, 0),
    nightAuditStatus: readString(record, ['nightAuditStatus', 'auditStatus', 'auditRemark']),
  }
}

function validateFilters(filters: ShiftRecordFilters) {
  if (!Number.isFinite(filters.pageNum) || filters.pageNum < 1) {
    throw new Error('交接班分页参数不正确')
  }

  if (!Number.isFinite(filters.pageSize) || filters.pageSize < 1) {
    throw new Error('交接班分页参数不正确')
  }

  if (filters.startDate && !/^\d{4}-\d{2}-\d{2}$/.test(filters.startDate)) {
    throw new Error('开始日期格式不正确')
  }

  if (filters.endDate && !/^\d{4}-\d{2}-\d{2}$/.test(filters.endDate)) {
    throw new Error('结束日期格式不正确')
  }
}

function toMockState(value: string | null): ShiftRecordMockState {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function readString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function readNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function resolveShiftRecordStatusLabel(workStatus: number, fallback: string) {
  if (workStatus === 0) return '待交班'
  if (workStatus === 1) return '已完成'
  if (workStatus === 2) return '待接班'
  return fallback
}

function parseWorkReport(value: string): ShiftRecordWorkReport | null {
  if (!value) return null

  try {
    return normalizeWorkReport(JSON.parse(value) as Record<string, unknown>)
  } catch {
    return null
  }
}

function normalizeWorkReport(payload: Record<string, unknown>): ShiftRecordWorkReport {
  return {
    workUserStartDate: readString(payload, ['workUserStartDate']),
    workUserEndDate: readString(payload, ['workUserEndDate']),
    generalIncome: readNumber(payload.generalIncome, 0),
    netIncome: readNumber(payload.netIncome, 0),
    totalExpenditure: readNumber(payload.totalExpenditure, 0),
    workGoods: asArray(payload.workGoods).map((item, index) => {
      const record = asRecord(item)
      return {
        id: readString(record, ['id']) || `goods-${index + 1}`,
        goodsName: readString(record, ['goodsName']),
        goodsNumber: readNumber(record.goodsNumber, 0),
        remark: readString(record, ['remark']),
      }
    }),
    workIncomeSourceList: asArray(payload.workIncomeSourceList).map((item) => {
      const record = asRecord(item)
      return {
        sourceName: readString(record, ['sourceName']),
        income: readNumber(record.income, 0),
        expend: readNumber(record.expend, 0),
        remark: readString(record, ['remark']),
      }
    }),
    paymentTypeList: asArray(payload.paymentTypeList).map((item) => {
      const record = asRecord(item)
      return {
        paymentName: readString(record, ['paymentName']),
        income: readNumber(record.income, 0),
        expend: readNumber(record.expend, 0),
        remark: readString(record, ['remark']),
      }
    }),
    remark: readString(payload, ['remark']),
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
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
