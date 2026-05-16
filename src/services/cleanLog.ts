export const CLEAN_LOG_ENDPOINT = 'https://hudson-prod.localhome.cn/cleanLog/page/get'

export type CleanLogQuery = {
  campId: string
  pageNum: number
  pageSize: number
  poiId?: string
  roomId?: string[]
  operatorId?: string
  operatorStartTime?: number
  operatorEndTime?: number
}

export type CleanLogRecord = {
  id?: string
  operatorTime?: string
  operatorName?: string
  operatorType?: number | string
  operatorDetails?: string
}

export type CleanLogPageData = {
  total: number
  list: CleanLogRecord[]
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

export async function fetchCleanLogs(query: CleanLogQuery): Promise<CleanLogPageData> {
  const response = await fetch(CLEAN_LOG_ENDPOINT, {
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

  const payload = (await response.json()) as RawCleanLogResponse
  if (payload.success !== true) {
    throw new Error(payload.errorMsg || payload.errorDetail || '接口返回失败')
  }

  const data = payload.data
  if (!data || !Array.isArray(data.list)) {
    throw new Error('接口响应缺少 data.list')
  }

  return {
    total: Number(data.total ?? data.list.length),
    list: data.list.filter(isCleanLogRecord),
  }
}

function isCleanLogRecord(value: unknown): value is CleanLogRecord {
  return Boolean(value && typeof value === 'object')
}
