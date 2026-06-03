export type OrderRoomSelectorRoom = {
  roomId: string
  roomName: string
}

export type OrderRoomSelectorGroup = {
  roomCategoryId: string
  roomCategoryName: string
  poiId: string
  poiName: string
  rooms: OrderRoomSelectorRoom[]
}

type HudsonEnvelope<T> = {
  code?: number
  message?: string | null
  success?: boolean
  data?: T
  errorMsg?: unknown
  errorDetail?: unknown
}

const roomsEndpoint = '/api/rooms/get'
const roomCategoriesEndpoint = '/api/roomCategories/page/get'

export async function fetchOrderRoomSelectorOptions(
  campId: string,
  signal?: AbortSignal,
): Promise<OrderRoomSelectorGroup[]> {
  const normalizedCampId = campId.trim()
  if (!normalizedCampId) {
    throw new Error('缺少 campId，无法加载可选房型房间')
  }

  const [roomsPayload, categoriesPayload] = await Promise.all([
    postHudson<unknown>(roomsEndpoint, { campId: normalizedCampId, pageNum: 1, pageSize: 999 }, signal),
    postHudson<unknown>(
      roomCategoriesEndpoint,
      {
        campId: normalizedCampId,
        pageNum: 1,
        pageSize: 999,
        roomCategoryName: '',
        keyword: '',
        cityIds: [],
        channelId: '',
      },
      signal,
    ),
  ])

  return adaptRoomSelectorGroups(roomsPayload, categoriesPayload)
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  const payload = (await response.json().catch(() => null)) as HudsonEnvelope<T> | null
  if (!response.ok) {
    throw new Error(readHudsonError(payload) || `${endpoint} 请求失败：HTTP ${response.status}`)
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error(`${endpoint} 响应格式异常`)
  }
  if (payload.success === false || (payload.code !== undefined && payload.code !== 0)) {
    throw new Error(readHudsonError(payload) || `${endpoint} 返回失败`)
  }
  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data`)
  }

  return payload.data
}

function adaptRoomSelectorGroups(roomsPayload: unknown, categoriesPayload: unknown): OrderRoomSelectorGroup[] {
  const categories = new Map<string, { poiId: string; poiName: string; roomCategoryName: string }>()
  for (const item of readArray(asRecord(categoriesPayload).list)) {
    const record = asRecord(item)
    const roomCategoryId = readString(record.roomCategoryId ?? record.id, '')
    if (!roomCategoryId) continue
    categories.set(roomCategoryId, {
      poiId: readString(record.poiId, ''),
      poiName: readString(record.poiName, ''),
      roomCategoryName: readString(record.roomCategoryName ?? record.name, ''),
    })
  }

  const directGroups = readArray(
    asRecord(roomsPayload).roomCategoryRooms ??
      asRecord(roomsPayload).roomOptions ??
      (Array.isArray(roomsPayload) ? roomsPayload : []),
  )

  return directGroups
    .map((item, index) => {
      const group = asRecord(item)
      const roomCategoryId = readString(group.roomCategoryId ?? group.id, '')
      if (!roomCategoryId) return null

      const category = categories.get(roomCategoryId)
      const rooms = readArray(group.rooms)
        .map((roomItem, roomIndex) => {
          const room = asRecord(roomItem)
          const roomId = readString(room.roomId ?? room.id, '')
          const roomName = readString(room.roomName ?? room.name, '')
          if (!roomId || !roomName) return null
          return { roomId, roomName }
        })
        .filter((room): room is OrderRoomSelectorRoom => Boolean(room))

      return {
        roomCategoryId,
        roomCategoryName:
          readString(group.roomCategoryName ?? group.name, '') ||
          category?.roomCategoryName ||
          `房型${index + 1}`,
        poiId: readString(group.poiId, '') || category?.poiId || '',
        poiName: readString(group.poiName, '') || category?.poiName || '',
        rooms,
      }
    })
    .filter((group): group is OrderRoomSelectorGroup => Boolean(group))
}

function readHudsonError(payload: HudsonEnvelope<unknown> | null) {
  return readString(payload?.errorMsg ?? payload?.errorDetail ?? payload?.message, '')
}

function readArray(value: unknown) {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown, fallback: string) {
  if (value === undefined || value === null) return fallback
  const text = String(value).trim()
  return text || fallback
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
