export const cleanTaskListEndpoint = '/api/cleanTask/page/get'
export const cleanTaskCreateEndpoint = '/api/cleanTask/create'
export const cleanTaskNotifyEndpoint = '/api/cleanTask/notify'
export const cleanTaskExportEndpoint = '/api/cleanTask/export'
export const cleanTaskAssignEndpoint = '/api/cleanTask/assign'
export const cleanTaskStartEndpoint = '/api/cleanTask/start'
export const cleanTaskCompleteEndpoint = '/api/cleanTask/complete'
export const cleanTaskCancelEndpoint = '/api/cleanTask/cancel'

export type CleanTaskProviderMode = 'mock' | 'api'
export const cleanTaskProviderMode: CleanTaskProviderMode = 'api'

export type CleanTaskScenario = 'success' | 'empty' | 'error'
export type CleanTaskType = 'CHECKOUT' | 'STAY' | 'PLAN' | 'TEMPORARY' | 'ALL'
export type CleanTaskStatus = 'PENDING_ASSIGN' | 'PENDING_CLEAN' | 'CLEANING' | 'DONE' | 'CANCELLED' | 'ALL'

export type CleanTaskFilters = {
  campId: string
  poiId: string
  cleanDate: string
  roomId: string
  cleanType: CleanTaskType
  status: CleanTaskStatus
  cleanerId: string
  page: number
  pageSize: number
  scenario?: CleanTaskScenario
}

export type CleanLookupOption = {
  id: string
  label: string
}

export type CleanTaskSummary = {
  total: number
  pendingAssign: number
  pendingClean: number
  cleaning: number
  done: number
  overdue: number
}

export type CleanTaskRecord = {
  id: string
  taskNo: string
  roomName: string
  storeName: string
  cleanType: CleanTaskType
  cleanTypeLabel: string
  status: CleanTaskStatus
  statusLabel: string
  cleanerId: string
  cleanerName: string
  cleanDate: string
  planTime: string
  deadline: string
  sourceOrderNo: string
  guestName: string
  remark: string
  progress: number
  priority: 'normal' | 'urgent'
}

export type CleanTaskDashboard = {
  providerMode: CleanTaskProviderMode
  listEndpoint: string
  requestBody: Record<string, unknown>
  stores: CleanLookupOption[]
  rooms: CleanLookupOption[]
  cleanTypes: Array<CleanLookupOption & { id: CleanTaskType }>
  statuses: Array<CleanLookupOption & { id: CleanTaskStatus }>
  cleaners: CleanLookupOption[]
  summary: CleanTaskSummary
  tasks: CleanTaskRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  updatedAt: string
}

export type CleanTaskCreatePayload = {
  campId: string
  poiId?: string
  roomId: string
  cleanerId?: string
  cleanType: CleanTaskType
  cleanStatus: CleanTaskStatus
  cleanTime: string
  deadlineAt?: string
  deadline?: string
  remark?: string
}

export type CleanTaskActionResult = {
  taskId?: string
  taskNo?: string
  cleanStatus?: CleanTaskStatus
  notifiedCount?: number
  taskIds?: string[]
  message?: string
  traceId?: string
  timestamp?: string
}

export type CleanTaskActionPayload = {
  campId: string
  taskId: string
  cleanerId?: string
  remark?: string
}

export type CleanTaskExportResult = {
  fileName: string
  contentType?: string
  total?: number
  rows?: CleanTaskRecord[]
  traceId?: string
  timestamp?: string
}

type ApiEnvelope<T> = {
  code: number
  success?: boolean
  message: string
  data: T
  traceId: string
  timestamp: string
  errorMsg?: string | null
  errorDetail?: string | null
}

type RawCleanTask = {
  taskId?: string
  taskNo?: string
  roomName?: string
  poiName?: string
  cleanType?: CleanTaskType
  cleanStatus?: CleanTaskStatus
  cleanerId?: string
  cleanerName?: string
  cleanDate?: string
  planTime?: string
  deadline?: string
  sourceOrderNo?: string
  guestName?: string
  remark?: string
  progress?: number
  priority?: 'normal' | 'urgent'
}

type RawDashboardData = {
  stores: CleanLookupOption[]
  rooms: CleanLookupOption[]
  cleanTypes: Array<CleanLookupOption & { id: CleanTaskType }>
  statuses: Array<CleanLookupOption & { id: CleanTaskStatus }>
  cleaners: CleanLookupOption[]
  summary: CleanTaskSummary
  list: RawCleanTask[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

type CleanTaskProvider = {
  fetchDashboard(filters: CleanTaskFilters): Promise<CleanTaskDashboard>
}

const stores: CleanLookupOption[] = [
  { id: 'ALL', label: '全部门店' },
  { id: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' },
]

const cleanTypes: Array<CleanLookupOption & { id: CleanTaskType }> = [
  { id: 'ALL', label: '全部类型' },
  { id: 'CHECKOUT', label: '退房保洁' },
  { id: 'STAY', label: '续住保洁' },
  { id: 'PLAN', label: '计划保洁' },
  { id: 'TEMPORARY', label: '临时保洁' },
]

const statuses: Array<CleanLookupOption & { id: CleanTaskStatus }> = [
  { id: 'ALL', label: '全部状态' },
  { id: 'PENDING_ASSIGN', label: '待分配' },
  { id: 'PENDING_CLEAN', label: '待保洁' },
  { id: 'CLEANING', label: '保洁中' },
  { id: 'DONE', label: '已完成' },
  { id: 'CANCELLED', label: '已取消' },
]

const cleaners: CleanLookupOption[] = [
  { id: 'cleaner-zhang', label: '张阿姨' },
  { id: 'cleaner-li', label: '李师傅' },
  { id: 'cleaner-wang', label: '王保洁' },
]

const rooms: CleanLookupOption[] = [
  { id: 'room-top-1', label: '顶层套房（浴缸巨幕电竞麻将） / 房间1' },
  { id: 'room-president-1', label: '总裁套间（桑拿浴缸露台电竞麻将） / 房间1' },
  { id: 'room-sky-1', label: '天落大床电竞套间 / 1' },
  { id: 'room-movie-1', label: '观影大床房 / 房间1' },
]

const sourceTasks: RawCleanTask[] = [
  {
    taskId: 'task-001',
    taskNo: 'CT20260518001',
    roomName: '顶层套房（浴缸巨幕电竞麻将） / 房间1',
    poiName: '天落会宿公寓(前海壹方城宝安中心店)',
    cleanType: 'CHECKOUT',
    cleanStatus: 'PENDING_CLEAN',
    cleanerId: 'cleaner-zhang',
    cleanerName: '张阿姨',
    cleanDate: '2026-05-18',
    planTime: '12:30-14:00',
    deadline: '14:00',
    sourceOrderNo: 'HO202605180301',
    guestName: '林女士',
    remark: '退房后优先清洁，需补充浴巾和矿泉水',
    progress: 20,
    priority: 'urgent',
  },
  {
    taskId: 'task-002',
    taskNo: 'CT20260518002',
    roomName: '总裁套间（桑拿浴缸露台电竞麻将） / 房间1',
    poiName: '天落会宿公寓(前海壹方城宝安中心店)',
    cleanType: 'STAY',
    cleanStatus: 'CLEANING',
    cleanerId: 'cleaner-li',
    cleanerName: '李师傅',
    cleanDate: '2026-05-18',
    planTime: '15:00-16:30',
    deadline: '16:30',
    sourceOrderNo: 'HO202605180417',
    guestName: '许先生',
    remark: '续住更换床品，检查投影遥控器电量',
    progress: 65,
    priority: 'normal',
  },
  {
    taskId: 'task-003',
    taskNo: 'CT20260518003',
    roomName: '观影大床房 / 房间1',
    poiName: '天落会宿公寓(前海壹方城宝安中心店)',
    cleanType: 'PLAN',
    cleanStatus: 'DONE',
    cleanerId: 'cleaner-wang',
    cleanerName: '王保洁',
    cleanDate: '2026-05-18',
    planTime: '09:00-10:00',
    deadline: '10:00',
    sourceOrderNo: 'PLAN20260518001',
    guestName: '运营巡检',
    remark: '计划保洁已完成，房间可售',
    progress: 100,
    priority: 'normal',
  },
]

export function createCleanTaskRequestBody(filters: CleanTaskFilters): Record<string, unknown> {
  return {
    campId: filters.campId,
    poiId: filters.poiId === 'ALL' ? '' : filters.poiId,
    cleanTime: filters.cleanDate,
    roomId: filters.roomId === 'ALL' ? null : filters.roomId,
    cleanType: filters.cleanType === 'ALL' ? '' : filters.cleanType,
    cleanStatus: filters.status === 'ALL' ? '' : filters.status,
    cleanerIds: filters.cleanerId === 'ALL' ? [] : [filters.cleanerId],
    pageNum: filters.page,
    pageSize: filters.pageSize,
  }
}

export async function fetchCleanTaskDashboard(filters: CleanTaskFilters): Promise<CleanTaskDashboard> {
  return getCleanTaskProvider(resolveCleanTaskProviderMode()).fetchDashboard(filters)
}

export async function exportCleanTasks(filters: CleanTaskFilters): Promise<CleanTaskExportResult> {
  const requestBody = createCleanTaskRequestBody(filters)
  const providerMode = resolveCleanTaskProviderMode()

  if (providerMode === 'api') {
    const envelope = await postJson<unknown>(cleanTaskExportEndpoint, requestBody)
    const data = asRecord(assertEnvelope(envelope).data)
    return {
      fileName: String(data.fileName ?? `clean_tasks_${filters.cleanDate}.csv`),
      contentType: data.contentType === undefined ? undefined : String(data.contentType),
      total: data.total === undefined ? undefined : toNumber(data.total, 0),
      rows: Array.isArray(data.rows) ? data.rows.map(adaptTask) : undefined,
      traceId: envelope.traceId,
      timestamp: envelope.timestamp,
    }
  }

  return {
    fileName: `clean_tasks_${filters.cleanDate}.csv`,
    contentType: 'text/csv',
    total: filterTasks(sourceTasks, filters).length,
    traceId: 'mock-fangtai--baojie-guanli--baojie-renwu-export',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

export async function notifyCleanTasks(campId: string, taskIds: string[]): Promise<CleanTaskActionResult> {
  const requestBody = { campId, taskIds }
  const providerMode = resolveCleanTaskProviderMode()

  if (providerMode === 'api') {
    const envelope = await postJson<unknown>(cleanTaskNotifyEndpoint, requestBody)
    return adaptActionResult(envelope)
  }

  return {
    notifiedCount: taskIds.length,
    taskIds,
    message: '保洁任务通知成功',
    traceId: 'mock-fangtai--baojie-guanli--baojie-renwu-notify',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

export async function createCleanTask(payload: CleanTaskCreatePayload): Promise<CleanTaskActionResult> {
  const providerMode = resolveCleanTaskProviderMode()

  if (providerMode === 'api') {
    const envelope = await postJson<unknown>(cleanTaskCreateEndpoint, payload)
    return adaptActionResult(envelope)
  }

  return {
    taskId: `mock-clean-task-${Date.now()}`,
    taskNo: `CT-MOCK-${payload.cleanTime.replaceAll('-', '')}`,
    cleanStatus: payload.cleanStatus,
    message: '保洁任务创建成功',
    traceId: 'mock-fangtai--baojie-guanli--baojie-renwu-create',
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

export async function assignCleanTask(payload: CleanTaskActionPayload): Promise<CleanTaskActionResult> {
  const providerMode = resolveCleanTaskProviderMode()

  if (providerMode === 'api') {
    const envelope = await postJson<unknown>(cleanTaskAssignEndpoint, payload)
    return adaptActionResult(envelope)
  }

  return createMockActionResult(payload.taskId, 'PENDING_CLEAN', '保洁任务分派成功', 'assign')
}

export async function startCleanTask(payload: CleanTaskActionPayload): Promise<CleanTaskActionResult> {
  const providerMode = resolveCleanTaskProviderMode()

  if (providerMode === 'api') {
    const envelope = await postJson<unknown>(cleanTaskStartEndpoint, payload)
    return adaptActionResult(envelope)
  }

  return createMockActionResult(payload.taskId, 'CLEANING', '保洁任务已开始', 'start')
}

export async function completeCleanTask(payload: CleanTaskActionPayload): Promise<CleanTaskActionResult> {
  const providerMode = resolveCleanTaskProviderMode()

  if (providerMode === 'api') {
    const envelope = await postJson<unknown>(cleanTaskCompleteEndpoint, payload)
    return adaptActionResult(envelope)
  }

  return createMockActionResult(payload.taskId, 'DONE', '保洁任务已完成', 'complete')
}

export async function cancelCleanTask(payload: CleanTaskActionPayload): Promise<CleanTaskActionResult> {
  const providerMode = resolveCleanTaskProviderMode()

  if (providerMode === 'api') {
    const envelope = await postJson<unknown>(cleanTaskCancelEndpoint, payload)
    return adaptActionResult(envelope)
  }

  return createMockActionResult(payload.taskId, 'CANCELLED', '保洁任务已取消', 'cancel')
}

export function resolveCleanTaskProviderMode(search?: string): CleanTaskProviderMode {
  const params = readCleanTaskSearchParams(search)
  const configured =
    params.get('cleanTaskProvider') ||
    params.get('provider') ||
    readRuntimeValue('pms.cleanTaskProvider') ||
    (import.meta.env.VITE_CLEAN_TASK_PROVIDER as string | undefined) ||
    cleanTaskProviderMode

  if (configured === 'api' || configured === 'real') return 'api'
  if (configured === 'mock') return 'mock'
  throw new Error(`保洁任务数据源配置无效：${configured}`)
}

function getCleanTaskProvider(mode: CleanTaskProviderMode): CleanTaskProvider {
  if (mode === 'api') return apiCleanTaskProvider
  return mockCleanTaskProvider
}

const mockCleanTaskProvider: CleanTaskProvider = {
  async fetchDashboard(filters) {
    await delay(120)

    if (filters.scenario === 'error') {
      throw new Error('保洁任务服务繁忙，请稍后重试')
    }

    const requestBody = createCleanTaskRequestBody(filters)
    const filtered = filters.scenario === 'empty' ? [] : filterTasks(sourceTasks, filters)
    const envelope = createEnvelope<RawDashboardData>('clean-task-list', {
      stores,
      rooms,
      cleanTypes,
      statuses,
      cleaners,
      list: filtered,
      summary: summarizeTasks(filtered),
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: filtered.length,
      },
    })

    return adaptCleanTaskDashboard(envelope, requestBody)
  },
}

const apiCleanTaskProvider: CleanTaskProvider = {
  async fetchDashboard(filters) {
    const requestBody = createCleanTaskRequestBody(filters)
    const response = await fetch(cleanTaskListEndpoint, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    const envelope = (await readJson(response)) as ApiEnvelope<RawDashboardData> | null
    if (!response.ok) {
      throw new Error(`${cleanTaskListEndpoint} 返回 HTTP ${response.status}`)
    }
    return adaptCleanTaskDashboard(assertEnvelope(envelope), requestBody, 'api')
  },
}

async function postJson<T>(endpoint: string, body: Record<string, unknown>): Promise<ApiEnvelope<T>> {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const envelope = (await readJson(response)) as ApiEnvelope<T> | null
  if (!response.ok) {
    throw new Error(`${endpoint} 返回 HTTP ${response.status}`)
  }
  return assertEnvelope(envelope)
}

function adaptActionResult(envelope: ApiEnvelope<unknown>): CleanTaskActionResult {
  const payload = assertEnvelope(envelope)
  const data = asRecord(payload.data)
  return {
    taskId: data.taskId === undefined ? undefined : String(data.taskId),
    taskNo: data.taskNo === undefined ? undefined : String(data.taskNo),
    cleanStatus: asOptionalCleanStatus(data.cleanStatus),
    notifiedCount: data.notifiedCount === undefined ? undefined : toNumber(data.notifiedCount, 0),
    taskIds: Array.isArray(data.taskIds) ? data.taskIds.map(String) : undefined,
    message: data.message === undefined ? undefined : String(data.message),
    traceId: payload.traceId,
    timestamp: payload.timestamp,
  }
}

function createMockActionResult(
  taskId: string,
  cleanStatus: CleanTaskStatus,
  message: string,
  action: string,
): CleanTaskActionResult {
  return {
    taskId,
    cleanStatus,
    message,
    traceId: `mock-fangtai--baojie-guanli--baojie-renwu-${action}`,
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function readCleanTaskSearchParams(search?: string) {
  const params = new URLSearchParams(search ?? (typeof window === 'undefined' ? '' : window.location.search))
  if (typeof window === 'undefined') return params

  const hashQuery = window.location.hash.split('?')[1]
  if (!hashQuery) return params
  new URLSearchParams(hashQuery).forEach((value, key) => {
    if (!params.has(key)) params.set(key, value)
  })
  return params
}

function readRuntimeValue(key: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(key)?.trim() ?? ''
}

function filterTasks(tasks: RawCleanTask[], filters: CleanTaskFilters) {
  return tasks.filter((task) => {
    if (filters.poiId !== 'ALL' && task.poiName !== stores.find((store) => store.id === filters.poiId)?.label) return false
    if (filters.roomId !== 'ALL' && task.roomName !== rooms.find((room) => room.id === filters.roomId)?.label) return false
    if (filters.cleanType !== 'ALL' && task.cleanType !== filters.cleanType) return false
    if (filters.status !== 'ALL' && task.cleanStatus !== filters.status) return false
    if (filters.cleanerId !== 'ALL' && task.cleanerId !== filters.cleanerId) return false
    return task.cleanDate === filters.cleanDate
  })
}

function summarizeTasks(tasks: RawCleanTask[]): CleanTaskSummary {
  return {
    total: tasks.length,
    pendingAssign: tasks.filter((task) => task.cleanStatus === 'PENDING_ASSIGN').length,
    pendingClean: tasks.filter((task) => task.cleanStatus === 'PENDING_CLEAN').length,
    cleaning: tasks.filter((task) => task.cleanStatus === 'CLEANING').length,
    done: tasks.filter((task) => task.cleanStatus === 'DONE').length,
    overdue: tasks.filter((task) => task.priority === 'urgent' && task.cleanStatus !== 'DONE').length,
  }
}

function createEnvelope<T>(traceId: string, data: T): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'success',
    data,
    traceId: `mock-fangtai--baojie-guanli--baojie-renwu-${traceId}`,
    timestamp: '2026-05-18T10:00:00+08:00',
  }
}

function adaptCleanTaskDashboard(
  envelope: ApiEnvelope<RawDashboardData>,
  requestBody: Record<string, unknown>,
  providerMode: CleanTaskProviderMode = cleanTaskProviderMode,
): CleanTaskDashboard {
  const payload = assertEnvelope(envelope)
  const data = payload.data
  const list = Array.isArray(data.list) ? data.list : []

  return {
    providerMode,
    listEndpoint: cleanTaskListEndpoint,
    requestBody,
    stores: normalizeOptions(data.stores),
    rooms: normalizeOptions(data.rooms),
    cleanTypes: normalizeTypedOptions(data.cleanTypes, cleanTypes),
    statuses: normalizeTypedOptions(data.statuses, statuses),
    cleaners: normalizeOptions(data.cleaners),
    summary: {
      total: toNumber(data.summary?.total, list.length),
      pendingAssign: toNumber(data.summary?.pendingAssign, 0),
      pendingClean: toNumber(data.summary?.pendingClean, 0),
      cleaning: toNumber(data.summary?.cleaning, 0),
      done: toNumber(data.summary?.done, 0),
      overdue: toNumber(data.summary?.overdue, 0),
    },
    tasks: list.map(adaptTask),
    pagination: {
      page: toNumber(data.pagination?.page, 1),
      pageSize: toNumber(data.pagination?.pageSize, 20),
      total: toNumber(data.pagination?.total, list.length),
    },
    updatedAt: payload.timestamp,
  }
}

function adaptTask(task: RawCleanTask, index: number): CleanTaskRecord {
  const cleanType = asCleanType(task.cleanType)
  const status = asCleanStatus(task.cleanStatus)

  return {
    id: String(task.taskId ?? `clean-task-${index}`),
    taskNo: String(task.taskNo ?? `CT-${index + 1}`),
    roomName: String(task.roomName ?? '-'),
    storeName: String(task.poiName ?? stores[0].label),
    cleanType,
    cleanTypeLabel: labelOf(cleanTypes, cleanType),
    status,
    statusLabel: labelOf(statuses, status),
    cleanerId: String(task.cleanerId ?? ''),
    cleanerName: String(task.cleanerName ?? '待分配'),
    cleanDate: String(task.cleanDate ?? ''),
    planTime: String(task.planTime ?? '-'),
    deadline: String(task.deadline ?? '-'),
    sourceOrderNo: String(task.sourceOrderNo ?? '-'),
    guestName: String(task.guestName ?? '-'),
    remark: String(task.remark ?? ''),
    progress: toNumber(task.progress, 0),
    priority: task.priority === 'urgent' ? 'urgent' : 'normal',
  }
}

function assertEnvelope<T>(envelope: ApiEnvelope<T> | null): ApiEnvelope<T> {
  if (!envelope || typeof envelope !== 'object') {
    throw new Error('保洁任务响应不是 JSON 对象')
  }
  if (envelope.success === false || (envelope.code !== undefined && envelope.code !== 0)) {
    throw new Error(envelope.errorMsg || envelope.errorDetail || envelope.message || '保洁任务响应返回失败')
  }
  if (envelope.data === undefined || envelope.data === null) {
    throw new Error('保洁任务响应缺少 data 字段')
  }
  return envelope
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function normalizeOptions(options: unknown): CleanLookupOption[] {
  if (!Array.isArray(options)) return []
  return options.map((option, index) => {
    const record = asRecord(option)
    return {
      id: String(record.id ?? `option-${index}`),
      label: String(record.label ?? record.name ?? `选项 ${index + 1}`),
    }
  })
}

function normalizeTypedOptions<T extends string>(
  options: unknown,
  fallback: Array<CleanLookupOption & { id: T }>,
): Array<CleanLookupOption & { id: T }> {
  const normalized = normalizeOptions(options)
  if (normalized.length === 0) return fallback
  return normalized.map((option) => ({ ...option, id: option.id as T }))
}

function asCleanType(value: unknown): CleanTaskType {
  return cleanTypes.some((item) => item.id === value) ? (value as CleanTaskType) : 'PLAN'
}

function asCleanStatus(value: unknown): CleanTaskStatus {
  return statuses.some((item) => item.id === value) ? (value as CleanTaskStatus) : 'PENDING_ASSIGN'
}

function asOptionalCleanStatus(value: unknown): CleanTaskStatus | undefined {
  return statuses.some((item) => item.id === value) ? (value as CleanTaskStatus) : undefined
}

function labelOf<T extends string>(options: Array<CleanLookupOption & { id: T }>, id: T) {
  return options.find((option) => option.id === id)?.label ?? id
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}
