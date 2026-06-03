export const CLEAN_LOG_ENDPOINT = '/api/cleanLog/page/get'
export const CLEAN_LOG_MOCK_ENDPOINT = '/cleanManage/cleanLog/list'

const TASK_ID = 'fangtai--baojie-guanli--baojie-rizhi'
const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'

export type CleanLogProvider = 'mock' | 'api'
export type CleanLogMockState = 'success' | 'empty' | 'error'

export type CleanLogQuery = {
  provider?: CleanLogProvider
  mockState?: CleanLogMockState
  campId: string
  storeId: string
  roomIds: string[]
  operatorId: string
  operatorStartTime?: number
  operatorEndTime?: number
  page: number
  pageSize: number
}

export type CleanLogOption = {
  label: string
  value: string
}

export type CleanLogRoomOption = CleanLogOption & {
  roomType: string
  roomName: string
  cleanState: 'clean' | 'dirty'
}

export type CleanLogRow = {
  id: string
  operatorTime: string
  operatorName: string
  operatorType: string
  operatorDetails: string
  roomType: string
  roomName: string
}

export type CleanLogViewModel = {
  rows: CleanLogRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  filterOptions: CleanLogFilterOptions
  refreshedAt: string
}

export type CleanLogFilterOptions = {
  stores: CleanLogOption[]
  rooms: CleanLogRoomOption[]
  operators: CleanLogOption[]
}

export type CleanLogDiagnostics = {
  endpoint: string
  provider: CleanLogProvider
  state: CleanLogMockState
  traceId: string
  request: Record<string, unknown>
}

export type CleanLogServiceResult = {
  view: CleanLogViewModel
  diagnostics: CleanLogDiagnostics
}

type ApiEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type CleanLogBackendData = {
  list: CleanLogBackendRow[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  dictionaries: CleanLogFilterOptions
}

type CleanLogBackendRow = {
  id?: string
  operatorTime?: string
  operatorName?: string
  operatorType?: number | string
  operatorTypeName?: string
  operatorDetails?: string
  roomType?: string
  roomName?: string
  storeId?: string
  roomId?: string
  operatorId?: string
}

type RawCleanLogResponse = {
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
  data?: {
    total?: number
    list?: unknown
  } | null
}

export async function fetchCleanLogs(query: CleanLogQuery, signal?: AbortSignal): Promise<CleanLogServiceResult> {
  const provider = query.provider ?? resolveCleanLogProvider()
  const request = buildCleanLogRequest(query)
  const envelope = provider === 'api' ? await fetchApiCleanLogs(query, request, signal) : await fetchMockCleanLogs(query, request, signal)
  const data = unwrapEnvelope(envelope)
  const state = query.mockState ?? readCleanLogMockState()
  const diagnostics: CleanLogDiagnostics = {
    endpoint: provider === 'api' ? CLEAN_LOG_ENDPOINT : CLEAN_LOG_MOCK_ENDPOINT,
    provider,
    state,
    traceId: envelope.traceId,
    request,
  }
  writeDiagnostics(diagnostics)

  return {
    view: {
      rows: data.list.map(adaptCleanLogRow),
      pagination: data.pagination,
      filterOptions: data.dictionaries,
      refreshedAt: envelope.timestamp,
    },
    diagnostics,
  }
}

export function resolveCleanLogRuntimeConfig(location: Location): Pick<CleanLogQuery, 'provider' | 'mockState'> {
  const params = new URLSearchParams(location.search)
  const provider = params.get('cleanLogProvider')
  const mockState = params.get('cleanLogMockState')

  return {
    provider: provider === 'api' || provider === 'mock' ? provider : undefined,
    mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
  }
}

export function getDefaultCleanLogFilterOptions(): CleanLogFilterOptions {
  return filterOptions
}

export function createCleanLogExportTask(query: CleanLogQuery) {
  const request = buildCleanLogRequest(query)
  const diagnostics = {
    endpoint: '/cleanManage/cleanLog/export',
    provider: query.provider ?? resolveCleanLogProvider(),
    state: query.mockState ?? readCleanLogMockState(),
    traceId: `mock-${TASK_ID}-export-001`,
    request,
  }
  writeDiagnostics(diagnostics)

  return {
    taskId: `EXPORT-${TASK_ID}-20260518-001`,
    traceId: diagnostics.traceId,
    timestamp: MOCK_TIMESTAMP,
  }
}

export function resolveCleanLogProvider(): CleanLogProvider {
  const configured = readRuntimeConfig('pms.cleanLogProvider') || import.meta.env.VITE_CLEAN_LOG_PROVIDER
  return configured === 'api' || configured === 'real' ? 'api' : 'mock'
}

function readCleanLogMockState(): CleanLogMockState {
  const configured = readRuntimeConfig('pms.cleanLogMockState') || import.meta.env.VITE_CLEAN_LOG_MOCK_STATE
  if (configured === 'empty' || configured === 'error') return configured
  return 'success'
}

async function fetchMockCleanLogs(
  query: CleanLogQuery,
  _request: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelope<CleanLogBackendData>> {
  await delay(80, signal)

  const state = query.mockState ?? readCleanLogMockState()
  if (state === 'error') {
    return {
      code: 50001,
      message: '保洁日志加载失败，请重试',
      data: createBackendData([], query),
      traceId: `mock-${TASK_ID}-error-001`,
      timestamp: MOCK_TIMESTAMP,
    }
  }

  const rows = state === 'empty' ? [] : filterRows(mockRows, query)
  return {
    code: 0,
    message: 'success',
    data: createBackendData(rows, query),
    traceId: `mock-${TASK_ID}-${state === 'empty' ? 'empty' : 'list'}-001`,
    timestamp: MOCK_TIMESTAMP,
  }
}

async function fetchApiCleanLogs(
  query: CleanLogQuery,
  request: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelope<CleanLogBackendData>> {
  if (!query.campId) {
    return {
      code: 400,
      message: '请选择门店后再查询保洁日志',
      data: createBackendData([], query),
      traceId: `api-${TASK_ID}-invalid-params`,
      timestamp: new Date().toISOString(),
    }
  }

  let response: Response
  try {
    response = await fetch(CLEAN_LOG_ENDPOINT, {
      method: 'POST',
      credentials: 'include',
      signal,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
    })
  } catch (error) {
    throw new Error(`保洁日志加载失败，请重试：${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }

  if (!response.ok) {
    throw new Error(`保洁日志加载失败，请重试：HTTP ${response.status}`)
  }

  const payload = (await response.json()) as RawCleanLogResponse
  if (payload.success !== true) {
    return {
      code: 500,
      message: payload.errorMsg || payload.errorDetail || '保洁日志加载失败，请重试',
      data: createBackendData([], query),
      traceId: `api-${TASK_ID}-business-error`,
      timestamp: new Date().toISOString(),
    }
  }

  const rawList = Array.isArray(payload.data?.list) ? payload.data.list : []
  const list = rawList.filter(isRecord).map((row) => row as CleanLogBackendRow)
  const total = Number(payload.data?.total ?? list.length)

  return {
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
      },
      dictionaries: filterOptions,
    },
    traceId: `api-${TASK_ID}-list`,
    timestamp: new Date().toISOString(),
  }
}

function createBackendData(rows: CleanLogBackendRow[], query: CleanLogQuery): CleanLogBackendData {
  return {
    list: rows,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      total: rows.length,
    },
    dictionaries: filterOptions,
  }
}

function buildCleanLogRequest(query: CleanLogQuery) {
  const request: Record<string, unknown> = {
    campId: query.campId,
    pageNum: query.page,
    pageSize: query.pageSize,
  }

  if (query.storeId) request.poiId = query.storeId
  if (query.roomIds.length > 0) request.roomId = query.roomIds
  if (query.operatorId) request.operatorId = query.operatorId
  if (query.operatorStartTime) request.operatorStartTime = query.operatorStartTime
  if (query.operatorEndTime) request.operatorEndTime = query.operatorEndTime

  return request
}

function filterRows(rows: CleanLogBackendRow[], query: CleanLogQuery) {
  return rows.filter((row) => {
    if (query.storeId && row.storeId !== query.storeId) return false
    if (query.roomIds.length > 0 && row.roomId && !query.roomIds.includes(row.roomId)) return false
    if (query.operatorId && row.operatorId !== query.operatorId) return false
    if (!query.operatorStartTime && !query.operatorEndTime) return true

    const rowTime = row.operatorTime ? Date.parse(row.operatorTime.replace(/-/g, '/')) : Number.NaN
    if (!Number.isFinite(rowTime)) return true
    if (query.operatorStartTime && rowTime < query.operatorStartTime) return false
    if (query.operatorEndTime) {
      const dayEnd = query.operatorEndTime + 24 * 60 * 60 * 1000 - 1
      if (rowTime > dayEnd) return false
    }
    return true
  })
}

function adaptCleanLogRow(row: CleanLogBackendRow): CleanLogRow {
  return {
    id: readString(row.id, 'CL-UNKNOWN'),
    operatorTime: readString(row.operatorTime, '-'),
    operatorName: readString(row.operatorName, '-'),
    operatorType: readString(row.operatorTypeName ?? operatorTypeLabels[String(row.operatorType ?? '')], '-'),
    operatorDetails: readString(row.operatorDetails, '-'),
    roomType: readString(row.roomType, '-'),
    roomName: readString(row.roomName, '-'),
  }
}

function unwrapEnvelope<T>(envelope: ApiEnvelope<T>) {
  if (envelope.code !== 0) {
    writeDiagnostics({
      endpoint: CLEAN_LOG_MOCK_ENDPOINT,
      provider: resolveCleanLogProvider(),
      state: readCleanLogMockState(),
      traceId: envelope.traceId,
      request: {},
    })
    throw new Error(envelope.message || '保洁日志加载失败，请重试')
  }

  return envelope.data
}

function readRuntimeConfig(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() || ''
}

function writeDiagnostics(diagnostics: CleanLogDiagnostics | Omit<CleanLogDiagnostics, 'provider' | 'state'> & Partial<CleanLogDiagnostics>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('pms.cleanLog.lastRequest', JSON.stringify(diagnostics))
}

function readString(value: unknown, fallback: string) {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object')
}

function delay(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) {
    return Promise.reject(new DOMException('保洁日志请求已取消', 'AbortError'))
  }

  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('保洁日志请求已取消', 'AbortError'))
      },
      { once: true },
    )
  })
}

const operatorTypeLabels: Record<string, string> = {
  '1': '新增',
  '2': '修改',
  '3': '删除',
  '4': '完成',
  '5': '取消',
  '6': '状态更新',
}

const filterOptions: CleanLogFilterOptions = {
  stores: [
    { label: '全部门店', value: '' },
    { label: '天落会宿公寓(前海壹方城宝安中心店)', value: '1796067693589061634' },
  ],
  rooms: [
    {
      label: '顶层套房 房间1',
      value: 'room-penthouse-1',
      roomType: '顶层套房（落幕巨幕电竞麻将）',
      roomName: '房间1（净）',
      cleanState: 'clean',
    },
    {
      label: '总裁套间 房间1',
      value: 'room-president-1',
      roomType: '总裁套间（桔拿落幕露台电竞麻将）',
      roomName: '房间1（净）',
      cleanState: 'clean',
    },
    {
      label: '天落大床电竞套间 1',
      value: 'room-esports-1',
      roomType: '天落大床电竞套间',
      roomName: '1（净）',
      cleanState: 'clean',
    },
    {
      label: '观影大床房 房间1',
      value: 'room-observation-1',
      roomType: '观影大床房',
      roomName: '房间1（脏）',
      cleanState: 'dirty',
    },
  ],
  operators: [
    { label: '1796067693261905922', value: '1796067693261905922' },
    { label: '路客云6TS5', value: '1796067693261905922' },
  ],
}

const mockRows: CleanLogBackendRow[] = [
  {
    id: 'CL20260518001',
    operatorTime: '2026-05-18 09:18:26',
    operatorName: '路客云6TS5',
    operatorType: 4,
    operatorTypeName: '完成',
    operatorDetails: '房间1 已完成保洁并标记为净房',
    roomType: '观影大床房',
    roomName: '房间1',
    storeId: '1796067693589061634',
    roomId: 'room-observation-1',
    operatorId: '1796067693261905922',
  },
  {
    id: 'CL20260518002',
    operatorTime: '2026-05-18 10:04:12',
    operatorName: '超级管理员',
    operatorType: 6,
    operatorTypeName: '状态更新',
    operatorDetails: '顶层套房 房间1 从待查房更新为已检查',
    roomType: '顶层套房（落幕巨幕电竞麻将）',
    roomName: '房间1',
    storeId: '1796067693589061634',
    roomId: 'room-penthouse-1',
    operatorId: '1796067693261905922',
  },
  {
    id: 'CL20260518003',
    operatorTime: '2026-05-18 11:36:45',
    operatorName: '路客云6TS5',
    operatorType: 2,
    operatorTypeName: '修改',
    operatorDetails: '总裁套间 房间1 保洁备注已更新',
    roomType: '总裁套间（桔拿落幕露台电竞麻将）',
    roomName: '房间1',
    storeId: '1796067693589061634',
    roomId: 'room-president-1',
    operatorId: '1796067693261905922',
  },
]
