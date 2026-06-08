export type OrderRoomSelectorRoom = {
  roomId: string
  roomName: string
  price?: string
  unitPrice?: string
  monthlyRent?: string
}

export type OrderRoomSelectorGroup = {
  roomCategoryId: string
  roomCategoryName: string
  poiId: string
  poiName: string
  price?: string
  unitPrice?: string
  monthlyRent?: string
  rooms: OrderRoomSelectorRoom[]
}

export type OrderRoomSelectorQuery = {
  campId: string
  startDate: string
  days: number
  stayType?: string
  keyword?: string
}

export type OrderRoomCategoryPrice = {
  price: string
  unitPrice: string
}

type HudsonEnvelope<T> = {
  code?: number
  message?: string | null
  success?: boolean
  data?: T
  errorMsg?: unknown
  errorDetail?: unknown
}

const roomStatusesRoomsEndpoint = '/api/roomStatuses/rooms/get'
const roomCategoryStatusesEndpoint = '/api/roomCategoryStatuses/roomCategory/get'

export async function fetchOrderRoomSelectorOptions(
  query: OrderRoomSelectorQuery,
  signal?: AbortSignal,
): Promise<OrderRoomSelectorGroup[]> {
  const normalizedCampId = query.campId.trim()
  if (!normalizedCampId) {
    throw new Error('缺少 campId，无法加载可选房型房间')
  }

  const body: Record<string, unknown> = {
    campId: normalizedCampId,
    startDate: query.startDate,
    days: query.days,
    stayType: query.stayType,
    queryCode: query.keyword?.trim() ?? '',
    page: 1,
    pageSize: 999,
  }
  const roomsPayload = await postHudson<unknown>(roomStatusesRoomsEndpoint, body, signal)
  const groups = adaptRoomSelectorGroups(roomsPayload)

  return enrichRoomSelectorGroupsWithPrices(groups, { ...query, campId: normalizedCampId }, signal)
}

export async function fetchOrderRoomCategoryPrice(
  query: OrderRoomSelectorQuery & { roomCategoryId: string; poiId?: string },
  signal?: AbortSignal,
): Promise<OrderRoomCategoryPrice | undefined> {
  const normalizedCampId = query.campId.trim()
  if (!normalizedCampId) {
    throw new Error('缺少 campId，无法加载房型价格')
  }
  const pricePayload = await postHudson<unknown>(
    roomCategoryStatusesEndpoint,
    {
      campId: normalizedCampId,
      roomCategoryIds: [query.roomCategoryId],
      poiIds: query.poiId ? [query.poiId] : null,
      date: query.startDate,
      days: Math.max(query.days, 1),
      pageNum: 1,
      pageSize: 1,
      isStores: 1,
      stayType: query.stayType,
    },
    signal,
  )
  return readRoomCategoryPrices(pricePayload, { ...query, campId: normalizedCampId }).get(query.roomCategoryId)
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

function adaptRoomSelectorGroups(roomsPayload: unknown): OrderRoomSelectorGroup[] {
  const directGroups = readArray(
    asRecord(roomsPayload).list ??
      asRecord(roomsPayload).roomCategoryRooms ??
      asRecord(roomsPayload).roomOptions ??
      (Array.isArray(roomsPayload) ? roomsPayload : []),
  )

  return directGroups
    .map((item, index) => {
      const group = asRecord(item)
      const roomCategoryId = readString(group.roomCategoryId ?? group.id, '')
      if (!roomCategoryId) return null

      const rooms = readArray(group.rooms)
        .map((roomItem, roomIndex) => {
          const room = asRecord(roomItem)
          const roomId = readString(room.roomId ?? room.id, '')
          const roomName = readString(room.roomName ?? room.name, '')
          if (!roomId || !roomName) return null
          const price = readMoneyString(
            room.price ??
              room.salePrice ??
              room.roomPrice ??
              room.basePrice ??
              room.marketPrice ??
              group.price ??
              group.salePrice ??
              group.roomPrice ??
              group.basePrice ??
              group.marketPrice,
          )
          const monthlyRent = readMoneyString(
            room.monthlyRent ??
              room.monthRent ??
              room.rent ??
              group.monthlyRent ??
              group.monthRent ??
              group.rent,
          )
          return {
            roomId,
            roomName,
            ...(price ? { price } : {}),
            ...(price ? { unitPrice: price } : {}),
            ...(monthlyRent ? { monthlyRent } : {}),
          }
        })
        .filter((room): room is OrderRoomSelectorRoom => Boolean(room))

      const price = readMoneyString(group.price ?? group.salePrice ?? group.roomPrice ?? group.basePrice ?? group.marketPrice)
      const monthlyRent = readMoneyString(group.monthlyRent ?? group.monthRent ?? group.rent)
      return {
        roomCategoryId,
        roomCategoryName:
          readString(group.roomCategoryName ?? group.name, '') ||
          `房型${index + 1}`,
        poiId: readString(group.poiId ?? group.storeId, ''),
        poiName: readString(group.poiName ?? group.storeName, ''),
        ...(price ? { price } : {}),
        ...(price ? { unitPrice: price } : {}),
        ...(monthlyRent ? { monthlyRent } : {}),
        rooms,
      }
    })
    .filter((group): group is OrderRoomSelectorGroup => Boolean(group))
}

async function enrichRoomSelectorGroupsWithPrices(
  groups: OrderRoomSelectorGroup[],
  query: OrderRoomSelectorQuery,
  signal?: AbortSignal,
) {
  if (!groups.length || !needsPriceLookup(groups, query.stayType)) return groups

  const roomCategoryIds = Array.from(new Set(groups.map((group) => group.roomCategoryId).filter(Boolean)))
  const poiIds = Array.from(new Set(groups.map((group) => group.poiId).filter(Boolean)))
  let pricePayload: unknown
  try {
    pricePayload = await postHudson<unknown>(
      roomCategoryStatusesEndpoint,
      {
        campId: query.campId,
        roomCategoryIds,
        poiIds: poiIds.length ? poiIds : null,
        date: query.startDate,
        days: Math.max(query.days, 1),
        pageNum: 1,
        pageSize: Math.max(roomCategoryIds.length, 1),
        isStores: 1,
        stayType: query.stayType,
      },
      signal,
    )
  } catch (error) {
    if (isAbortError(error) || signal?.aborted) throw error
    return groups
  }
  const pricesByCategoryId = readRoomCategoryPrices(pricePayload, query)
  if (pricesByCategoryId.size === 0) return groups

  const isLongRental = query.stayType === 'long_rental'
  return groups.map((group) => {
    const fallbackPrice = pricesByCategoryId.get(group.roomCategoryId)
    if (!fallbackPrice) return group

    return {
      ...group,
      price: group.price ?? fallbackPrice.price,
      unitPrice: group.unitPrice ?? fallbackPrice.unitPrice,
      monthlyRent: group.monthlyRent ?? (isLongRental ? fallbackPrice.price : undefined),
      rooms: group.rooms.map((room) => ({
        ...room,
        price: room.price ?? fallbackPrice.price,
        unitPrice: room.unitPrice ?? fallbackPrice.unitPrice,
        monthlyRent: room.monthlyRent ?? (isLongRental ? fallbackPrice.price : undefined),
      })),
    }
  })
}

function needsPriceLookup(groups: OrderRoomSelectorGroup[], stayType: string | undefined) {
  const isLongRental = stayType === 'long_rental'
  return groups.some((group) =>
    group.rooms.some((room) =>
      isLongRental
        ? !(room.monthlyRent ?? group.monthlyRent ?? room.price ?? group.price)
        : !(room.price ?? group.price),
    ),
  )
}

function readRoomCategoryPrices(pricePayload: unknown, query: OrderRoomSelectorQuery) {
  const root = asRecord(pricePayload)
  const rows = readArray(
    root.roomStatusViews ??
      root.list ??
      root.roomCategoryStatuses ??
      (Array.isArray(pricePayload) ? pricePayload : []),
  )
  const pricesByCategoryId = new Map<string, OrderRoomCategoryPrice>()

  for (const item of rows) {
    const row = asRecord(item)
    const roomCategoryId = readString(row.roomCategoryId ?? row.id, '')
    if (!roomCategoryId) continue

    const statusViews = readArray(row.statusViews ?? row.priceViews ?? row.days)
    const price = resolveRoomCategoryPrice(
      statusViews.map(asRecord),
      row,
      query.startDate,
      Math.max(query.days, 1),
      query.stayType,
    )
    if (price) pricesByCategoryId.set(roomCategoryId, price)
  }

  return pricesByCategoryId
}

function resolveRoomCategoryPrice(
  statusViews: Record<string, unknown>[],
  row: Record<string, unknown>,
  startDate: string,
  days: number,
  stayType: string | undefined,
): OrderRoomCategoryPrice | undefined {
  const startTime = parseDateKeyTime(startDate)
  const isLongRental = stayType === 'long_rental'
  const matchedStatuses = Number.isFinite(startTime)
    ? statusViews.filter((status) => {
        const date = readString(status.date ?? status.day, '')
        const time = parseDateKeyTime(date)
        return Number.isFinite(time) && time >= startTime && time < startTime + days * 24 * 60 * 60 * 1000
      })
    : []
  const statuses = matchedStatuses.length ? matchedStatuses : statusViews

  if (!isLongRental && statuses.length > 0) {
    const amounts = statuses
      .slice(0, days)
      .map((status) =>
        readCentAmount(
          status.salePrice ??
            status.actualSalePrice ??
            status.price,
        ),
      )
      .filter((amount): amount is number => amount !== undefined)

    if (amounts.length > 0) {
      const total = amounts.reduce((sum, amount) => sum + amount, 0)
      return {
        price: formatMoneyString(total),
        unitPrice: formatMoneyString(total / amounts.length),
      }
    }
  }

  const matchedStatus = statusViews.find((status) => readString(status.date ?? status.day, '') === startDate)
  const firstStatus = statusViews[0]
  const status = matchedStatus ?? firstStatus
  const fallbackUnitPrice = readCentAmount(
    status?.salePrice ??
      status?.actualSalePrice ??
      status?.price ??
      row.normalActualSalePrice ??
      row.normalPrice,
  )
  if (fallbackUnitPrice === undefined) return undefined
  const multiplier = isLongRental ? 1 : days
  return {
    price: formatMoneyString(fallbackUnitPrice * multiplier),
    unitPrice: formatMoneyString(fallbackUnitPrice),
  }
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

function readMoneyString(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
  }
  const normalized = String(value).replace(/[￥¥,]/g, '').trim()
  if (!normalized) return undefined
  const amount = Number(normalized)
  if (!Number.isFinite(amount)) return undefined
  return Number.isInteger(amount) ? String(amount) : String(Number(amount.toFixed(2)))
}

function readCentAmount(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined
  const numeric = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, '').trim())
  if (!Number.isFinite(numeric)) return undefined
  return numeric / 100
}

function readCentMoneyString(value: unknown) {
  const amount = readCentAmount(value)
  return amount === undefined ? undefined : formatMoneyString(amount)
}

function formatMoneyString(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

function parseDateKeyTime(dateKey: string) {
  if (!dateKey) return Number.NaN
  const time = new Date(`${dateKey}T00:00:00`).getTime()
  return Number.isFinite(time) ? time : Number.NaN
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
