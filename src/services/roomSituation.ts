const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn'
const mockCampId = 'mock-camp-fangqingbiao'
const mockTimestamp = '2026-05-18T10:00:00+08:00'

export const roomSituationStoresEndpoint = '/select/poi/page/get'
export const dailyRoomSituationEndpoint = '/report/dailyRoomStatus/get'
export const forwardRoomSituationEndpoint = '/report/forwardRoomStatus/get'
export const roomSituationProviderConfigKey = 'pms.roomSituation.provider'
export const roomSituationMockScenarioKey = 'pms.roomSituation.mockScenario'

export type RoomSituationProviderName = 'mock' | 'real'
export type RoomSituationMockScenario = 'success' | 'empty' | 'error'

export type RoomSituationApiResponse<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

export type RoomSituationStore = {
  poiId: string
  poiName: string
}

export type DailyRoomSituationRow = {
  id: string
  name: string
  total: number
  sold: number
  available: number
  closed: number
  disabled: number
  reserved: number
  repair: number
  linkedClosed: number
  usable: number
  arriving: number
  occupied: number
  leaving: number
  clean: number
  dirty: number
}

export type ForwardRoomSituationRow = {
  id: string
  name: string
  total: number
  days: Array<{
    available: number
    occupied: number
  }>
}

export type RoomSituationPageData<T> = {
  endpoint: string
  requestBody: Record<string, unknown>
  rows: T[]
  total: number
  pageNum: number
  pageSize: number
}

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorDetail?: string | null
  errorCode?: string | null
}

type PagePayload = {
  total?: unknown
  pageNum?: unknown
  current?: unknown
  pageSize?: unknown
  size?: unknown
  list?: unknown
}

export function resolveRoomSituationCampId() {
  const params = new URLSearchParams(window.location.search)
  const fromUrl = params.get('campId')?.trim()
  const fromStorage = window.localStorage.getItem('pmsCampId')?.trim()
  const fromEnv = (import.meta.env.VITE_PMS_CAMP_ID as string | undefined)?.trim()
  const campId = fromUrl || fromStorage || fromEnv

  if (!campId) {
    if (resolveRoomSituationProvider() === 'mock') {
      return mockCampId
    }

    throw new Error('缺少 campId：请通过 URL query、localStorage.pmsCampId 或 VITE_PMS_CAMP_ID 提供当前房情表上下文')
  }

  return campId
}

export function resolveRoomSituationProvider(): RoomSituationProviderName {
  const params = new URLSearchParams(window.location.search)
  const rawProvider =
    params.get('roomSituationProvider') ??
    window.localStorage.getItem(roomSituationProviderConfigKey) ??
    (import.meta.env.VITE_ROOM_SITUATION_PROVIDER as string | undefined) ??
    'mock'

  return rawProvider === 'real' ? 'real' : 'mock'
}

export function formatRoomSituationDataSource(endpoint: string) {
  void endpoint
  return '房情表数据已同步'
}

export function formatRoomSituationFeedback(state: 'loading' | 'success' | 'failure') {
  const provider = resolveRoomSituationProvider()

  if (provider === 'mock') {
    if (state === 'loading') return '房情表数据加载中'
    if (state === 'failure') return '房情表数据加载失败'
    return '房情表数据已更新'
  }

  if (state === 'loading') return '房情表数据加载中'
  if (state === 'failure') return '房情表数据加载失败'
  return '房情表数据已更新'
}

export async function fetchRoomSituationStores(campId: string, signal?: AbortSignal): Promise<RoomSituationStore[]> {
  const requestBody = { campId, pageSize: 999, pageNum: 1, channelId: 0, isAvailability: '1' }
  const data =
    resolveRoomSituationProvider() === 'mock'
      ? unwrapRoomSituationResponse(mockRoomSituationStores(requestBody))
      : await postHudson<PagePayload>(roomSituationStoresEndpoint, requestBody, signal)
  const list = Array.isArray(data.list) ? data.list.map(asRecord) : []

  return list.map((item, index) => ({
    poiId: String(item.poiId ?? item.id ?? `poi-${index}`),
    poiName: String(item.poiName ?? item.name ?? `门店 ${index + 1}`),
  }))
}

export async function fetchDailyRoomSituation(
  filters: {
    campId: string
    date: string
    poiIds: string[]
    pageNum: number
    pageSize: number
  },
  signal?: AbortSignal,
): Promise<RoomSituationPageData<DailyRoomSituationRow>> {
  const requestBody = {
    campId: filters.campId,
    date: filters.date,
    poiIds: filters.poiIds,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
  }
  const data =
    resolveRoomSituationProvider() === 'mock'
      ? unwrapRoomSituationResponse(mockDailyRoomSituation(requestBody))
      : await postHudson<PagePayload>(dailyRoomSituationEndpoint, requestBody, signal)
  const list = Array.isArray(data.list) ? data.list.map(asRecord) : []

  return {
    endpoint: dailyRoomSituationEndpoint,
    requestBody,
    rows: list.map(adaptDailyRow),
    total: toNumber(data.total, list.length),
    pageNum: toNumber(data.pageNum ?? data.current, filters.pageNum),
    pageSize: toNumber(data.pageSize ?? data.size, filters.pageSize),
  }
}

export async function fetchForwardRoomSituation(
  filters: {
    campId: string
    startDate: string
    endDate: string
    poiIds: string[]
    pageNum: number
    pageSize: number
  },
  signal?: AbortSignal,
): Promise<RoomSituationPageData<ForwardRoomSituationRow>> {
  const requestBody = {
    campId: filters.campId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    poiIds: filters.poiIds,
    pageNum: filters.pageNum,
    pageSize: filters.pageSize,
  }
  const data =
    resolveRoomSituationProvider() === 'mock'
      ? unwrapRoomSituationResponse(mockForwardRoomSituation(requestBody))
      : await postHudson<PagePayload>(forwardRoomSituationEndpoint, requestBody, signal)
  const list = Array.isArray(data.list) ? data.list.map(asRecord) : []

  return {
    endpoint: forwardRoomSituationEndpoint,
    requestBody,
    rows: list.map(adaptForwardRow),
    total: toNumber(data.total, list.length),
    pageNum: toNumber(data.pageNum ?? data.current, filters.pageNum),
    pageSize: toNumber(data.pageSize ?? data.size, filters.pageSize),
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

  const payload = (await readJson(response)) as HudsonResponse<T> | null
  if (!response.ok) {
    throw new Error(`${formatEndpoint(endpoint)} 返回 HTTP ${response.status}`)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error(`${formatEndpoint(endpoint)} 响应不是 JSON 对象`)
  }

  if (payload.success !== true) {
    throw new Error(`${formatEndpoint(endpoint)} 返回业务失败：${extractErrorMessage(payload)}`)
  }

  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${formatEndpoint(endpoint)} 响应缺少 data 字段`)
  }

  return payload.data
}

function mockRoomSituationStores(requestBody: Record<string, unknown>): RoomSituationApiResponse<PagePayload> {
  return createRoomSituationResponse(
    'stores',
    {
      total: 1,
      pageNum: 1,
      pageSize: toNumber(requestBody.pageSize, 999),
      list: [{ poiId: 'poi-1', poiName: '天落会宿公寓(前海壹方城宝安中心店)' }],
    },
    requestBody,
  )
}

function mockDailyRoomSituation(requestBody: Record<string, unknown>): RoomSituationApiResponse<PagePayload> {
  const scenario = resolveRoomSituationMockScenario()
  const basePayload = {
    total: dailyMockRows.length,
    pageNum: toNumber(requestBody.pageNum, 1),
    pageSize: toNumber(requestBody.pageSize, 20),
    list: dailyMockRows,
  }

  if (scenario === 'empty') {
    return createRoomSituationResponse('daily-empty', { ...basePayload, total: 0, list: [] }, requestBody)
  }

  if (scenario === 'error') {
    return createRoomSituationResponse('daily-error', basePayload, requestBody, 50001, '房情表数据加载失败，请重试')
  }

  return createRoomSituationResponse('daily', basePayload, requestBody)
}

function mockForwardRoomSituation(requestBody: Record<string, unknown>): RoomSituationApiResponse<PagePayload> {
  const scenario = resolveRoomSituationMockScenario()
  const basePayload = {
    total: futureMockRows.length,
    pageNum: toNumber(requestBody.pageNum, 1),
    pageSize: toNumber(requestBody.pageSize, 20),
    list: futureMockRows,
  }

  if (scenario === 'empty') {
    return createRoomSituationResponse('forward-empty', { ...basePayload, total: 0, list: [] }, requestBody)
  }

  if (scenario === 'error') {
    return createRoomSituationResponse('forward-error', basePayload, requestBody, 50002, '远期房情表数据加载失败，请重试')
  }

  return createRoomSituationResponse('forward', basePayload, requestBody)
}

function createRoomSituationResponse<T>(
  name: string,
  data: T,
  requestBody: Record<string, unknown>,
  code = 0,
  message = 'success',
): RoomSituationApiResponse<T> {
  return {
    code,
    message,
    data,
    traceId: `mock-fangtai--fangqingbiao--fangqingbiao-${name}-${String(requestBody.pageNum ?? 1)}`,
    timestamp: mockTimestamp,
  }
}

function unwrapRoomSituationResponse<T>(response: RoomSituationApiResponse<T>) {
  if (response.code !== 0) {
    throw new Error(`${response.message}（traceId: ${response.traceId}）`)
  }

  return response.data
}

function resolveRoomSituationMockScenario(): RoomSituationMockScenario {
  const params = new URLSearchParams(window.location.search)
  const rawScenario = params.get('roomSituationMockScenario') ?? window.localStorage.getItem(roomSituationMockScenarioKey)

  if (rawScenario === 'empty' || rawScenario === 'error') {
    return rawScenario
  }

  return 'success'
}

function adaptDailyRow(row: Record<string, unknown>, index: number): DailyRoomSituationRow {
  return {
    id: String(row.roomCategoryId ?? row.roomCategoryName ?? `daily-row-${index}`),
    name: String(row.roomCategoryName ?? '-'),
    total: toNumber(row.availabilityCount, 0),
    sold: toNumber(row.openRoomCount, 0),
    available: toNumber(row.roomSaleCount, 0),
    closed: toNumber(row.closeRoomCount, 0),
    disabled: toNumber(row.userBusyNum, 0),
    reserved: toNumber(row.userBusyRetainNum, 0),
    repair: toNumber(row.userBusyRepairNum, 0),
    linkedClosed: toNumber(row.mainViceRelNum, 0),
    usable: toNumber(row.totalVacantRoomCount, 0),
    arriving: toNumber(row.preComeNum, 0),
    occupied: toNumber(row.liveNum, 0),
    leaving: toNumber(row.preLeaveNum, 0),
    clean: toNumber(row.cleanNum, 0),
    dirty: toNumber(row.dirtyNum, 0),
  }
}

function adaptForwardRow(row: Record<string, unknown>, index: number): ForwardRoomSituationRow {
  const days = Array.isArray(row.forwardRoomStatusList) ? row.forwardRoomStatusList.map(asRecord) : []

  return {
    id: String(row.roomCategoryId ?? row.roomCategoryName ?? `forward-row-${index}`),
    name: String(row.roomCategoryName ?? '-'),
    total: toNumber(row.availabilityCount, 0),
    days: days.map((day) => ({
      available: toNumber(day.roomSaleCount, 0),
      occupied: toNumber(day.occupationCount, 0),
    })),
  }
}

async function readJson(response: Response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

function extractErrorMessage(payload: HudsonResponse<unknown>) {
  return String(payload.errorMsg ?? payload.errorDetail ?? payload.errorCode ?? '未知错误').trim()
}

function formatEndpoint(endpoint: string) {
  return endpoint.replace(/^\//, '')
}

function toNumber(value: unknown, fallback: number) {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

const dailyMockRows = [
  {
    roomCategoryId: '1',
    roomCategoryName: '合计',
    availabilityCount: 4,
    openRoomCount: 0,
    roomSaleCount: 2,
    closeRoomCount: 2,
    userBusyNum: 2,
    userBusyRetainNum: 0,
    userBusyRepairNum: 0,
    mainViceRelNum: 0,
    totalVacantRoomCount: 1,
    preComeNum: 0,
    liveNum: 1,
    preLeaveNum: 0,
    cleanNum: 3,
    dirtyNum: 1,
  },
  {
    roomCategoryId: 'room-1',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    availabilityCount: 1,
    openRoomCount: 0,
    roomSaleCount: 0,
    closeRoomCount: 1,
    userBusyNum: 1,
    userBusyRetainNum: 0,
    userBusyRepairNum: 0,
    mainViceRelNum: 0,
    totalVacantRoomCount: -1,
    preComeNum: 0,
    liveNum: 1,
    preLeaveNum: 0,
    cleanNum: 1,
    dirtyNum: 0,
  },
  {
    roomCategoryId: 'room-2',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    availabilityCount: 1,
    openRoomCount: 0,
    roomSaleCount: 1,
    closeRoomCount: 0,
    userBusyNum: 0,
    userBusyRetainNum: 0,
    userBusyRepairNum: 0,
    mainViceRelNum: 0,
    totalVacantRoomCount: 1,
    preComeNum: 0,
    liveNum: 0,
    preLeaveNum: 0,
    cleanNum: 1,
    dirtyNum: 0,
  },
  {
    roomCategoryId: 'room-3',
    roomCategoryName: '天落大床电竞套间',
    availabilityCount: 1,
    openRoomCount: 0,
    roomSaleCount: 0,
    closeRoomCount: 1,
    userBusyNum: 1,
    userBusyRetainNum: 0,
    userBusyRepairNum: 0,
    mainViceRelNum: 0,
    totalVacantRoomCount: 0,
    preComeNum: 0,
    liveNum: 0,
    preLeaveNum: 0,
    cleanNum: 1,
    dirtyNum: 0,
  },
  {
    roomCategoryId: 'room-4',
    roomCategoryName: '观影大床房',
    availabilityCount: 1,
    openRoomCount: 0,
    roomSaleCount: 1,
    closeRoomCount: 0,
    userBusyNum: 0,
    userBusyRetainNum: 0,
    userBusyRepairNum: 0,
    mainViceRelNum: 0,
    totalVacantRoomCount: 1,
    preComeNum: 0,
    liveNum: 0,
    preLeaveNum: 0,
    cleanNum: 0,
    dirtyNum: 1,
  },
]

const futureMockRows = [
  {
    roomCategoryId: '1',
    roomCategoryName: '合计',
    availabilityCount: 4,
    forwardRoomStatusList: [
      { roomSaleCount: 1, occupationCount: 3 },
      { roomSaleCount: 2, occupationCount: 2 },
      { roomSaleCount: 2, occupationCount: 2 },
      { roomSaleCount: 3, occupationCount: 1 },
      { roomSaleCount: 4, occupationCount: 0 },
    ],
  },
  {
    roomCategoryId: 'room-1',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    availabilityCount: 1,
    forwardRoomStatusList: [
      { roomSaleCount: 0, occupationCount: 1 },
      { roomSaleCount: 1, occupationCount: 0 },
      { roomSaleCount: 1, occupationCount: 0 },
      { roomSaleCount: 1, occupationCount: 0 },
      { roomSaleCount: 1, occupationCount: 0 },
    ],
  },
]
