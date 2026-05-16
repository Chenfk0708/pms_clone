export interface RetailStore {
  poiId: string
  poiName: string
}

export interface RetailRoomCategory {
  roomCategoryId: string
  roomCategoryName: string
}

export interface RetailSalePriceSetting {
  isInitPriceDisplay?: number
  pricePriceInterfaceDisplayType?: string
  priceSalePriceSettings?: unknown[]
}

export interface RetailPriceData {
  campId: string
  campName: string
  stores: RetailStore[]
  rooms: RetailRoomCategory[]
  salePriceSetting: RetailSalePriceSetting
  storesPriceShow: unknown
  statuses: unknown
  requestedAt: string
}

export interface RetailPriceQuery {
  keyword?: string
  poiIds?: string[]
  roomCategoryIds?: string[]
}

interface HudsonResponse<T> {
  success?: boolean
  data?: T
  errorMsg?: string | null
  errorCode?: string | null
}

const HUDSON_BASE_URL = 'https://hudson-prod.localhome.cn'

async function postHudson<T>(endpoint: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${HUDSON_BASE_URL}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    throw new Error(`${endpoint} 返回 HTTP ${response.status}`)
  }

  const payload = (await response.json()) as HudsonResponse<T>
  if (payload.success !== true) {
    throw new Error(`${endpoint} 返回业务错误：${payload.errorMsg ?? payload.errorCode ?? '未知错误'}`)
  }

  return payload.data as T
}

function asList<T>(value: unknown): T[] {
  if (!value || typeof value !== 'object') return []
  const list = (value as { list?: unknown }).list
  return Array.isArray(list) ? (list as T[]) : []
}

function readCampId(campsData: unknown): { campId: string; campName: string } {
  const camps = (campsData as { camps?: Array<{ campId?: string; name?: string }> })?.camps
  const camp = Array.isArray(camps) ? camps.find((item) => item.campId) : null
  if (!camp?.campId) {
    throw new Error('/camps/get 未返回可用 campId')
  }
  return { campId: camp.campId, campName: camp.name ?? '当前门店' }
}

export async function loadRetailPriceData(query: RetailPriceQuery = {}, signal?: AbortSignal): Promise<RetailPriceData> {
  const campInfo = readCampId(await postHudson('/camps/get', {}, signal))
  const campId = campInfo.campId
  const keyword = query.keyword ?? ''
  const today = new Date().toISOString().slice(0, 10)

  const [storesData, roomsData, salePriceSetting, storesPriceShow, statuses] = await Promise.all([
    postHudson('/select/poi/page/get', {
      campId,
      pageSize: 999,
      pageNum: 1,
      channelId: 0,
      isAvailability: '1',
    }, signal),
    postHudson('/roomCategories/page/get', {
      campId,
      pageSize: 999,
      pageNum: 1,
      roomCategoryName: keyword,
      keyword,
      cityIds: [],
      channelId: '',
    }, signal),
    postHudson<RetailSalePriceSetting>('/roomCategoryPrice/salePriceSetting/get', { campId }, signal),
    postHudson('/systemConfig/price/storesPriceShow/get', { campId }, signal),
    postHudson('/roomCategoryStatuses/roomCategory/get', {
      campId,
      roomCategoryGroupIds: null,
      roomCategoryProductSaleType: null,
      roomCategoryIds: query.roomCategoryIds?.length ? query.roomCategoryIds : null,
      date: today,
      days: 30,
      poiIds: query.poiIds?.length ? query.poiIds : null,
      isStores: 1,
    }, signal),
  ])

  return {
    campId,
    campName: campInfo.campName,
    stores: asList<RetailStore>(storesData),
    rooms: asList<RetailRoomCategory>(roomsData),
    salePriceSetting: salePriceSetting ?? {},
    storesPriceShow,
    statuses,
    requestedAt: new Date().toISOString(),
  }
}
