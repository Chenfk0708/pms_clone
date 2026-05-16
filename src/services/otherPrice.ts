export type OtherPriceOption = {
  id: string
  name: string
}

export type OtherPriceTableGroup = {
  roomCategoryId: string
  roomType: string
  channels: string[][]
}

export type OtherPriceData = {
  campId: string
  campName: string
  channels: OtherPriceOption[]
  rooms: OtherPriceOption[]
  feeColumns: string[]
  feeRows: OtherPriceTableGroup[]
  activityColumns: string[]
  activityRows: OtherPriceTableGroup[]
  endpoints: string[]
  requestedAt: string
}

export type OtherPriceQuery = {
  channelId?: string
  roomCategoryId?: string
}

type HudsonResponse<T> = {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorCode?: string | null
}

const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn'
const feeEndpoint = '/roomCategoryPricings/get'
const rulesEndpoint = '/roomCategoryRules/get'
const defaultFeeColumns = ['押金', '可加客人数', '加人费(每人)', '餐食数量', '佣金率(%)']
const defaultActivityColumns = [
  '连住2天以上',
  '连住3天以上',
  '连住4天以上',
  '连住5天以上',
  '连住7天以上',
  '连住30天以上',
  '连住35天以上',
  '甩卖第一阶段',
  '甩卖第二阶段',
]

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  let payload: HudsonResponse<T> | null
  try {
    payload = (await response.json()) as HudsonResponse<T>
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.errorMsg ?? payload?.errorCode ?? `${endpoint} 返回 HTTP ${response.status}`)
  }

  return payload?.data as T
}

export async function loadOtherPriceData(query: OtherPriceQuery = {}, signal?: AbortSignal): Promise<OtherPriceData> {
  const campInfo = readCampId(await postHudson('/camps/get', {}, signal))
  const campId = campInfo.campId
  const roomCategoryIds = query.roomCategoryId ? [query.roomCategoryId] : []
  const channelIds = query.channelId ? [query.channelId] : []

  const [channelsData, roomsData, feeData, longStayRules, flashSaleRules] = await Promise.all([
    postHudson('/select/calChannel4RoomCategory/get', { campId }, signal),
    postHudson('/roomCategories/page/get', {
      campId,
      pageSize: 999,
      pageNum: 1,
      roomCategoryName: '',
      keyword: '',
      cityIds: [],
      channelId: '',
    }, signal),
    postHudson(feeEndpoint, { campId, roomCategoryIds, channelIds }, signal),
    postHudson(rulesEndpoint, { campId, discountType: 1 }, signal),
    postHudson(rulesEndpoint, { campId, discountType: 2 }, signal),
  ])

  const feeColumns = readColumns(feeData, defaultFeeColumns)
  const longStayColumns = readColumns(longStayRules, defaultActivityColumns.slice(0, 7))
  const flashSaleColumns = readColumns(flashSaleRules, defaultActivityColumns.slice(7))
  const activityColumns = [...longStayColumns, ...flashSaleColumns]

  return {
    campId,
    campName: campInfo.campName,
    channels: adaptOptions(channelsData, 'channel'),
    rooms: adaptOptions(roomsData, 'room'),
    feeColumns,
    feeRows: adaptTableRows(feeData, feeColumns, formatFeeCell),
    activityColumns,
    activityRows: mergeActivityRows(
      adaptTableRows(longStayRules, longStayColumns, formatActivityCell),
      adaptTableRows(flashSaleRules, flashSaleColumns, formatActivityCell),
      longStayColumns.length,
    ),
    endpoints: [
      'POST /camps/get',
      'POST /select/calChannel4RoomCategory/get',
      'POST /roomCategories/page/get',
      `POST ${feeEndpoint}`,
      `POST ${rulesEndpoint} discountType=1`,
      `POST ${rulesEndpoint} discountType=2`,
    ],
    requestedAt: new Date().toISOString(),
  }
}

function readCampId(campsData: unknown): { campId: string; campName: string } {
  const camps = (asRecord(campsData).camps as unknown[])?.map(asRecord) ?? []
  const camp = camps.find((item) => item.campId)
  if (!camp?.campId) throw new Error('/camps/get 未返回可用 campId')
  return { campId: String(camp.campId), campName: String(camp.name ?? '当前门店') }
}

function adaptOptions(data: unknown, kind: 'channel' | 'room'): OtherPriceOption[] {
  const record = asRecord(data)
  const source = Array.isArray(record.select) ? record.select : Array.isArray(record.list) ? record.list : []
  return source.map(asRecord).map((item, index) => {
    if (kind === 'channel') {
      return {
        id: String(item.value ?? item.channelId ?? item.id ?? index),
        name: String(item.label ?? item.channelName ?? item.name ?? `渠道 ${index + 1}`),
      }
    }

    return {
      id: String(item.roomCategoryId ?? item.id ?? index),
      name: String(item.roomCategoryName ?? item.name ?? `房型 ${index + 1}`),
    }
  })
}

function readColumns(data: unknown, fallback: string[]) {
  const head = asArray(asRecord(data).head).map(asRecord)
  const columns = head.map((item) => String(item.tn ?? item.cellName ?? '')).filter(Boolean)
  return columns.length > 0 ? columns : fallback
}

function adaptTableRows(data: unknown, columns: string[], formatter: (cell: Record<string, unknown> | null, column: string) => string): OtherPriceTableGroup[] {
  const rows = asArray(asRecord(data).body).map(asRecord)
  const grouped = new Map<string, OtherPriceTableGroup>()

  for (const row of rows) {
    const roomCategoryId = String(row.rcpi ?? row.roomCategoryId ?? row.rci ?? '')
    const roomType = String(row.rcn ?? row.roomCategoryName ?? '未命名房型')
    const channel = String(row.cn ?? row.channelName ?? '未知渠道')
    const cells = asArray(row.cells).map(asRecord)
    const values = columns.map((column) => formatter(cells.find((cell) => cell.cellName === column || cell.key === column) ?? null, column))
    const groupKey = roomCategoryId || roomType
    const group = grouped.get(groupKey) ?? { roomCategoryId, roomType, channels: [] }
    group.channels.push([channel, ...values])
    grouped.set(groupKey, group)
  }

  return Array.from(grouped.values())
}

function mergeActivityRows(longStayRows: OtherPriceTableGroup[], flashSaleRows: OtherPriceTableGroup[], longStayColumnCount: number): OtherPriceTableGroup[] {
  const merged = new Map<string, OtherPriceTableGroup>()
  for (const row of longStayRows) {
    merged.set(row.roomCategoryId || row.roomType, {
      ...row,
      channels: row.channels.map((channel) => [...channel, '暂不支持', '暂不支持']),
    })
  }

  for (const row of flashSaleRows) {
    const key = row.roomCategoryId || row.roomType
    const existing = merged.get(key)
    if (!existing) {
      merged.set(key, {
        ...row,
        channels: row.channels.map((channel) => [channel[0], ...Array.from({ length: longStayColumnCount }, () => '暂不支持'), ...channel.slice(1)]),
      })
      continue
    }

    for (const flashChannel of row.channels) {
      const matched = existing.channels.find((channel) => channel[0] === flashChannel[0])
      if (matched) {
        matched.splice(1 + longStayColumnCount, flashChannel.length - 1, ...flashChannel.slice(1))
      } else {
        existing.channels.push([flashChannel[0], ...Array.from({ length: longStayColumnCount }, () => '暂不支持'), ...flashChannel.slice(1)])
      }
    }
  }

  return Array.from(merged.values())
}

function formatFeeCell(cell: Record<string, unknown> | null) {
  if (!cell) return '设置'
  const value = cell.value
  if (value === null || value === undefined || value === '' || value === 0) return '设置'
  return String(value)
}

function formatActivityCell(cell: Record<string, unknown> | null) {
  if (!cell) return '暂不支持'
  const value = cell.value
  if (value === null || value === undefined || value === '') return '原价'
  const valueText = String(value)
  const flashSale = valueText.match(/^(\d+)-(\d+)$/)
  if (flashSale) return `${flashSale[1]}:00开始 ${Number(flashSale[2]) / 10}折`
  const numeric = Number(valueText)
  if (Number.isFinite(numeric) && numeric > 0 && numeric < 100) return `${numeric / 10}折`
  return valueText
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}
