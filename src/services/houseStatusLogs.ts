export const HOUSE_STATUS_LOG_ENDPOINT =
  '/api/roomStatusOperationLog/page/get/v2'

export type HouseStatusLogsProvider = 'mock' | 'real'

export type HouseStatusLogsMockScenario = 'success' | 'empty' | 'error'

export type HouseStatusLogQuery = {
  campId?: string
  pageNum: number
  pageSize: number
  current: number
  keyword?: string
  adjustType?: number
  channelId?: string
  startDate?: string
  endDate?: string
  createStartTime?: string
  createEndTime?: string
  userName?: string
  mockScenario?: HouseStatusLogsMockScenario
}

export type ChannelStatusLog = {
  channelName?: string
  channelRoomCategoryProductName?: string
  stockContent?: string
  isSuccess?: number
  errorMsg?: string | null
}

export type HouseStatusLogRecord = {
  roomStatusOperationLogId?: string
  roomCategoryName?: string
  roomName?: string | null
  startDate?: string
  endDate?: string
  operationContent?: string
  adjustContent?: string
  userName?: string
  createTime?: string
  channelRoomStatusOperationLogViews?: ChannelStatusLog[]
}

export type HouseStatusLogPageData = {
  source: HouseStatusLogsProvider
  traceId: string
  timestamp: string
  total: number
  list: HouseStatusLogRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

type RawHouseStatusLogResponse = {
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
  data?: {
    total?: number
    list?: unknown
  } | null
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}

type HouseStatusLogResponseData = {
  list: HouseStatusLogRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

const MOCK_TIMESTAMP = '2026-05-18T10:00:00+08:00'
const MOCK_TRACE_ID = 'mock-fangtai--fangtai-guanli--fangtai-rizhi-list-001'

const mockHouseStatusLogs: HouseStatusLogRecord[] = [
  {
    roomStatusOperationLogId: 'mock-log-001',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    roomName: '2501',
    startDate: '2026-05-18',
    endDate: '2026-05-18',
    operationContent: '同步房态',
    adjustContent: '手动调整',
    userName: '超级管理员',
    createTime: '2026-05-18 09:20:16',
    channelRoomStatusOperationLogViews: [
      {
        channelName: '途家直连',
        channelRoomCategoryProductName: '总裁套间（桑拿浴缸露台电竞麻将）',
        stockContent: '余1',
        isSuccess: 1,
      },
    ],
  },
  {
    roomStatusOperationLogId: 'mock-log-002',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    roomName: '2608',
    startDate: '2026-05-18',
    endDate: '2026-05-19',
    operationContent: '渠道库存变更',
    adjustContent: '手动调整',
    userName: '运营值班',
    createTime: '2026-05-18 10:05:32',
    channelRoomStatusOperationLogViews: [
      {
        channelName: '美团民宿',
        channelRoomCategoryProductName: '顶层套房（浴缸巨幕电竞麻将）',
        stockContent: '余2',
        isSuccess: 1,
      },
      {
        channelName: '携程',
        channelRoomCategoryProductName: '顶层套房（浴缸巨幕电竞麻将）',
        stockContent: '余2',
        isSuccess: 1,
      },
    ],
  },
]

export async function fetchHouseStatusLogs(query: HouseStatusLogQuery): Promise<HouseStatusLogPageData> {
  const provider = resolveHouseStatusLogsProvider()
  const payload = provider === 'real' ? await fetchRealHouseStatusLogs(query) : await fetchMockHouseStatusLogs(query)

  return adaptHouseStatusLogResponse(payload, provider)
}

export function resolveHouseStatusLogsProvider(): HouseStatusLogsProvider {
  const configuredProvider = readConfiguredProvider()
  if (configuredProvider === 'real' || configuredProvider === 'mock') return configuredProvider
  return 'mock'
}

async function fetchRealHouseStatusLogs(query: HouseStatusLogQuery): Promise<ApiResponse<HouseStatusLogResponseData>> {
  if (!query.campId) {
    return {
      code: 400,
      message: '缺少门店上下文 campId，无法发起真实房态日志请求',
      data: emptyResponseData(query),
      traceId: 'real-fangtai--fangtai-guanli--fangtai-rizhi-invalid-params',
      timestamp: new Date().toISOString(),
    }
  }

  let response: Response
  try {
    response = await fetch(HOUSE_STATUS_LOG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(query),
    })
  } catch (error) {
    throw new Error(`真实接口请求失败：${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }

  if (!response.ok) {
    throw new Error(`真实接口请求失败：HTTP ${response.status}`)
  }

  const payload = (await response.json()) as RawHouseStatusLogResponse

  if (payload.success !== true) {
    return {
      code: 500,
      message: payload.errorMsg || payload.errorDetail || '接口返回失败',
      data: emptyResponseData(query),
      traceId: 'real-fangtai--fangtai-guanli--fangtai-rizhi-business-error',
      timestamp: new Date().toISOString(),
    }
  }

  const data = payload.data
  if (!data || !Array.isArray(data.list)) {
    return {
      code: 502,
      message: '接口响应缺少 data.list',
      data: emptyResponseData(query),
      traceId: 'real-fangtai--fangtai-guanli--fangtai-rizhi-invalid-response',
      timestamp: new Date().toISOString(),
    }
  }

  const list = data.list.filter(isHouseStatusLogRecord)
  const total = Number(data.total ?? list.length)

  return {
    code: 0,
    message: 'success',
    data: {
      list,
      pagination: {
        page: query.pageNum,
        pageSize: query.pageSize,
        total,
      },
    },
    traceId: 'real-fangtai--fangtai-guanli--fangtai-rizhi-list',
    timestamp: new Date().toISOString(),
  }
}

async function fetchMockHouseStatusLogs(query: HouseStatusLogQuery): Promise<ApiResponse<HouseStatusLogResponseData>> {
  await delay(120)

  if (query.mockScenario === 'error') {
    return {
      code: 500,
      message: '房态日志服务暂不可用',
      data: emptyResponseData(query),
      traceId: 'mock-fangtai--fangtai-guanli--fangtai-rizhi-error-001',
      timestamp: MOCK_TIMESTAMP,
    }
  }

  if (query.mockScenario === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: emptyResponseData(query),
      traceId: 'mock-fangtai--fangtai-guanli--fangtai-rizhi-empty-001',
      timestamp: MOCK_TIMESTAMP,
    }
  }

  const filteredList = filterMockLogs(query)
  return {
    code: 0,
    message: 'success',
    data: {
      list: filteredList,
      pagination: {
        page: query.pageNum,
        pageSize: query.pageSize,
        total: filteredList.length,
      },
    },
    traceId: MOCK_TRACE_ID,
    timestamp: MOCK_TIMESTAMP,
  }
}

function adaptHouseStatusLogResponse(
  response: ApiResponse<HouseStatusLogResponseData>,
  provider: HouseStatusLogsProvider,
): HouseStatusLogPageData {
  if (response.code !== 0) {
    throw new Error(response.message || '房态日志接口返回失败')
  }

  if (!response.data || !Array.isArray(response.data.list)) {
    throw new Error('房态日志接口响应缺少 data.list')
  }

  const total = Number(response.data.pagination?.total ?? response.data.list.length)

  return {
    source: provider,
    traceId: response.traceId,
    timestamp: response.timestamp,
    total,
    list: response.data.list.filter(isHouseStatusLogRecord),
    pagination: {
      page: Number(response.data.pagination?.page ?? 1),
      pageSize: Number(response.data.pagination?.pageSize ?? response.data.list.length),
      total,
    },
  }
}

function readConfiguredProvider() {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem('pms.houseStatusLogsProvider') || ''
  }

  return import.meta.env.VITE_HOUSE_STATUS_LOGS_PROVIDER as string | undefined
}

function emptyResponseData(query: HouseStatusLogQuery): HouseStatusLogResponseData {
  return {
    list: [],
    pagination: {
      page: query.pageNum,
      pageSize: query.pageSize,
      total: 0,
    },
  }
}

function filterMockLogs(query: HouseStatusLogQuery) {
  const keyword = query.keyword?.trim()
  const selectedChannelId = query.channelId?.trim()
  const selectedChannelName = channelNameById[selectedChannelId || '']

  return mockHouseStatusLogs.filter((log) => {
    if (query.adjustType && adjustmentTypeByText[log.adjustContent || ''] !== query.adjustType) return false
    if (selectedChannelName && !log.channelRoomStatusOperationLogViews?.some((item) => item.channelName === selectedChannelName)) return false
    if (query.userName && !log.userName?.includes(query.userName)) return false
    if (!keyword) return true

    return [log.roomCategoryName, log.roomName, log.operationContent, log.adjustContent, log.userName]
      .filter(Boolean)
      .some((value) => String(value).includes(keyword))
  })
}

const adjustmentTypeByText: Record<string, number> = {
  手动调整: 1,
  系统调整: 2,
}

const channelNameById: Record<string, string> = {
  '0': '自来客',
  '17': '路客云聚合',
  '3': '美团民宿',
  '6': '美团酒店',
  '5': '携程',
  '2': '途家',
  '49': '途家直连',
  '1': '爱彼迎',
  '8': '飞猪淘酒店',
  '59': '飞猪民宿直连',
  '60': '飞猪酒店直连',
}

function delay(timeout: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, timeout)
  })
}

function isHouseStatusLogRecord(value: unknown): value is HouseStatusLogRecord {
  return Boolean(value && typeof value === 'object')
}
