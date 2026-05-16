export const HOUSE_STATUS_LOG_ENDPOINT =
  'https://hudson-prod.localhome.cn/roomStatusOperationLog/page/get/v2'

export type HouseStatusLogQuery = {
  campId: string
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
  total: number
  list: HouseStatusLogRecord[]
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

export async function fetchHouseStatusLogs(query: HouseStatusLogQuery): Promise<HouseStatusLogPageData> {
  const response = await fetch(HOUSE_STATUS_LOG_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(query),
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const payload = (await response.json()) as RawHouseStatusLogResponse

  if (payload.success !== true) {
    throw new Error(payload.errorMsg || payload.errorDetail || '接口返回失败')
  }

  const data = payload.data
  if (!data || !Array.isArray(data.list)) {
    throw new Error('接口响应缺少 data.list')
  }

  return {
    total: Number(data.total ?? data.list.length),
    list: data.list.filter(isHouseStatusLogRecord),
  }
}

function isHouseStatusLogRecord(value: unknown): value is HouseStatusLogRecord {
  return Boolean(value && typeof value === 'object')
}
