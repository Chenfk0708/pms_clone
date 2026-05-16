export type ChannelPriceFilters = {
  campId: string
  channel: string
  date: string
}

export type ChannelPriceRow = {
  channel: string
  coefficient: string
  basePrice: string
  prices: string[]
  comparePrices: string[]
  product?: string
}

type ChannelPriceResponse = {
  success?: boolean
  errorMsg?: string | null
  data?: unknown
}

export class ChannelPriceRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ChannelPriceRequestError'
  }
}

export async function fetchChannelPriceRows(filters: ChannelPriceFilters, signal?: AbortSignal): Promise<ChannelPriceRow[]> {
  const body = {
    campId: filters.campId,
    channelIds: filters.channel && filters.channel !== '渠道' && filters.channel !== '全部渠道' ? [filters.channel] : null,
    roomCategoryGroupIds: null,
    roomCategoryProductSaleType: null,
    roomCategoryIds: null,
    date: filters.date,
    days: 30,
    poiIds: null,
    pageNum: 1,
    pageSize: 15,
    isFinalChannelRp: 1,
  }

  const response = await fetch('https://hudson-prod.localhome.cn/roomCategoryStatuses/roomCategory/channel/get', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
    signal,
  })

  let payload: ChannelPriceResponse | null = null
  try {
    payload = (await response.json()) as ChannelPriceResponse
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    throw new ChannelPriceRequestError(payload?.errorMsg ?? `HTTP ${response.status}`)
  }

  return adaptChannelPriceRows(payload?.data)
}

export function adaptChannelPriceRows(data: unknown): ChannelPriceRow[] {
  if (!data || typeof data !== 'object') return []

  const directRows = readRows(data)
  if (directRows.length > 0) return directRows

  const roomInfos = readProperty(data, 'roomCategoryInfos')
  if (!Array.isArray(roomInfos)) return []

  return roomInfos.flatMap((roomInfo) => readRows(roomInfo))
}

function readRows(value: unknown): ChannelPriceRow[] {
  if (!value || typeof value !== 'object') return []

  const rows = readProperty(value, 'rows')
  if (Array.isArray(rows)) return rows.map(adaptRow).filter((row): row is ChannelPriceRow => Boolean(row))

  const list = readProperty(value, 'list')
  if (Array.isArray(list)) return list.map(adaptRow).filter((row): row is ChannelPriceRow => Boolean(row))

  const products = readProperty(value, 'roomCategoryProductPriceInfos') ?? readProperty(value, 'roomCategoryProducts')
  if (Array.isArray(products)) {
    return products.map(adaptRow).filter((row): row is ChannelPriceRow => Boolean(row))
  }

  return []
}

function adaptRow(value: unknown): ChannelPriceRow | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const channel = readString(record.roomCategoryName) ?? readString(record.channel) ?? readString(record.name)
  const product = readString(record.product) ?? readString(record.roomCategoryProductName) ?? readString(record.title)
  if (!channel && !product) return null

  const prices = readStringArray(record.prices) ?? readPriceCells(record)
  const comparePrices = readStringArray(record.comparePrices) ?? readStringArray(record.linePrices) ?? prices.map(() => '-')

  return {
    channel: channel ?? product ?? '未命名产品',
    coefficient: readString(record.coefficient) ?? readString(record.rate) ?? readString(record.rpRate) ?? '-',
    basePrice: readString(record.basePrice) ?? readString(record.price) ?? prices[0] ?? '-',
    prices,
    comparePrices,
    product: product ?? undefined,
  }
}

function readPriceCells(record: Record<string, unknown>) {
  const candidates = [record.priceInfos, record.datePrices, record.roomCategoryStatusViews, record.channelStatusViews]
  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue
    const values = candidate
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const itemRecord = item as Record<string, unknown>
        return readString(itemRecord.salePrice) ?? readString(itemRecord.price) ?? readString(itemRecord.finalPrice)
      })
      .filter((item): item is string => Boolean(item))
    if (values.length > 0) return values
  }

  return []
}

function readString(value: unknown) {
  if (value === null || value === undefined || value === '') return null
  return String(value)
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) return null
  return value.map((item) => String(item))
}

function readProperty(value: unknown, key: string) {
  if (!value || typeof value !== 'object') return undefined
  return (value as Record<string, unknown>)[key]
}
