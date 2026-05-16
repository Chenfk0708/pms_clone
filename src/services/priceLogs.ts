export const PRICE_LOG_CHANNELS_ENDPOINT = 'https://hudson-prod.localhome.cn/channels/get'
export const PRICE_LOG_ROOM_CATEGORIES_ENDPOINT = 'https://hudson-prod.localhome.cn/roomCategories/page/get'

export type PriceLogEvidenceQuery = {
  campId: string
  keyword?: string
  channelId?: string
}

export type PriceLogChannel = {
  channelId?: string | number
  channelName?: string
  name?: string
}

export type PriceLogRoomCategory = {
  roomCategoryId?: string | number
  roomCategoryName?: string
  name?: string
}

export type PriceLogEvidence = {
  channels: PriceLogChannel[]
  roomCategories: PriceLogRoomCategory[]
  capturedListEndpoint: false
  requests: Array<{
    endpoint: string
    body: Record<string, unknown>
  }>
}

type RawApiResponse = {
  success?: boolean
  errorMsg?: string | null
  errorDetail?: string | null
  data?: unknown
}

export async function fetchPriceLogEvidence(query: PriceLogEvidenceQuery, signal?: AbortSignal): Promise<PriceLogEvidence> {
  const channelsBody = {
    campId: query.campId,
    hasAllChannel: 1,
  }
  const roomCategoriesBody = {
    campId: query.campId,
    pageSize: 999,
    pageNum: 1,
    roomCategoryName: query.keyword ?? '',
    keyword: query.keyword ?? '',
    cityIds: [],
    channelId: query.channelId ?? '',
  }

  const [channelsPayload, roomCategoriesPayload] = await Promise.all([
    postJson(PRICE_LOG_CHANNELS_ENDPOINT, channelsBody, signal),
    postJson(PRICE_LOG_ROOM_CATEGORIES_ENDPOINT, roomCategoriesBody, signal),
  ])

  return {
    channels: readArray(readRecord(channelsPayload.data).channels).filter(isRecord),
    roomCategories: readArray(readRecord(channelsPayload.data).list).filter(isRecord).concat(
      readArray(readRecord(roomCategoriesPayload.data).list).filter(isRecord),
    ),
    capturedListEndpoint: false,
    requests: [
      { endpoint: PRICE_LOG_CHANNELS_ENDPOINT, body: channelsBody },
      { endpoint: PRICE_LOG_ROOM_CATEGORIES_ENDPOINT, body: roomCategoriesBody },
    ],
  }
}

async function postJson(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<RawApiResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let payload: RawApiResponse | null = null
  try {
    payload = (await response.json()) as RawApiResponse
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  if (!payload || typeof payload !== 'object') {
    throw new Error('接口响应不是 JSON 对象')
  }

  if (payload.success !== true) {
    throw new Error(payload.errorMsg || payload.errorDetail || '接口返回失败')
  }

  return payload
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object')
}
