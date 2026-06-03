import type { ApiEnvelope } from '../api/client'
import { resolveCurrentCampId } from '../utils/camp'

const SMART_HARDWARE_MALL_PROVIDER_KEY = 'pms.smartHardwareMallProvider'
const DEFAULT_CATALOG_CAMP_ID = '64'
const DEFAULT_REAL_CAMP_ID = '10001'
const DEFAULT_MOCK_CAMP_ID = '1796067693589061634'
const DEFAULT_TIMESTAMP = '2026-05-19T16:03:00+08:00'
const DEFAULT_ROUTE_AFTER_SUBMIT = '/smartHotel/smartHardware/smartLook'
const DEFAULT_AGREEMENT_LABEL = '我已经阅读同意《路客云产品服务购买协议》'
const DEFAULT_PURCHASE_NOTICE = '提交后会创建智慧酒店硬件采购任务，并同步给门店专家跟进。'
export type SmartHardwareMallProviderName = 'mock' | 'api'
export type SmartHardwareMallMockState = 'success' | 'empty' | 'error'
export type SmartHardwareMallPageMode = 'mall' | 'detail'
export type SmartHardwareMallQuery = {
  campId: string
  page: SmartHardwareMallPageMode
  mockState: SmartHardwareMallMockState
  productId: string
}
export type SmartHardwareProductAction = 'buy' | 'contact'
export type SmartHardwareProductSource = 'internal' | 'external'
export type SmartHardwareProduct = {
  id: string
  name: string
  description: string
  image: string
  priceLabel: string
  action: SmartHardwareProductAction
  source: SmartHardwareProductSource
  tag: string
  supportRoute?: string
}
export type SmartHardwareMallOverview = {
  provider: SmartHardwareMallProviderName
  traceId: string
  requestedAt: string
  requestedAtLabel: string
  heroTitle: string
  heroDescription: string
  products: SmartHardwareProduct[]
  quickEntries: Array<{ id: string; label: string; path: string; description: string }>
  emptyState?: {
    title: string
    description: string
    actionLabel: string
    actionPath: string
  }
}
export type SmartHardwareRoomGroup = {
  roomCategoryId: string
  roomCategoryName: string
  rooms: string[]
}
export type SmartHardwarePaymentGroup = {
  groupType: number
  groupTypeName: string
  paymentTypes: string[]
}
export type SmartHardwareMallDetail = {
  provider: SmartHardwareMallProviderName
  traceId: string
  requestedAt: string
  requestedAtLabel: string
  productId: string
  productName: string
  productDescription: string
  purchaseTermLabel: string
  buyerName: string
  totalAmountLabel: string
  agreementLabel: string
  purchaseNotice: string
  routeAfterSubmit: string
  roomCategoryIds: string[]
  roomSummary: string
  paymentSummary: string
}
type UnifiedEnvelope<T> = {
  code: number
  message: string
  data: T
  traceId: string
  timestamp: string
}
type SmartHardwareMallOverviewPayload = Omit<SmartHardwareMallOverview, 'provider' | 'traceId'>
type SmartHardwareMallDetailPayload = Omit<SmartHardwareMallDetail, 'provider' | 'traceId'>
type WeiRoomCategoryItem = {
  channelRoomCategoryId?: string
  channelRoomCategoryName?: string
  description?: string
  mainPhoto?: string
  goodsType?: number
  lowestSellingPrice?: number
}
type WeiRoomCategoryResponse = {
  list?: WeiRoomCategoryItem[]
}
type CommodityDetailApiPayload = {
  commodityId?: string
  commodityName?: string
  description?: string
  mainPhoto?: string
  sellingPriceCent?: number
  purchaseTermLabel?: string
  roomCategoryIds?: string[]
}
type PaymentTypeApiItem = {
  paymentTypeName?: string
}
type PaymentTypeApiGroup = {
  groupType?: number
  groupTypeName?: string
  paymentTypes?: PaymentTypeApiItem[]
}
type PaymentTypeApiResponse = {
  paymentGroups?: PaymentTypeApiGroup[]
}
type RoomApiItem = {
  roomName?: string
}
type RoomApiGroup = {
  roomCategoryId?: string
  roomCategoryName?: string
  rooms?: RoomApiItem[]
}
type RoomApiResponse = {
  roomCategoryRooms?: RoomApiGroup[]
}
type ApiEnvelopeWithMeta<T> = {
  data: T
  traceId: string
  timestamp: string
}
const assetBase = '/assets/smart-hardware-mall'
const defaultProductId = 'door-card-system'
const defaultProductName = '门卡管理系统'
const overviewProducts: SmartHardwareProduct[] = [
  {
    id: 'door-card-system',
    name: '门卡管理系统',
    description: '对接门卡制卡与房卡管理，一次配置即可进入购买详情与支付申请流程。',
    image: `${assetBase}/door-card-system.png`,
    priceLabel: '¥800',
    action: 'buy',
    source: 'internal',
    tag: '官方硬件',
    supportRoute: '/smartHotel/smartHardware/mall/detail',
  },
  {
    id: 'cpe-p5',
    name: '蜂助手 CPE 路由器 P5(5G 门店版)',
    description: '适用于高并发门店联网场景，支持现场部署咨询。',
    image: `${assetBase}/cpe-p5.png`,
    priceLabel: '¥1643',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'cpe-s1',
    name: '蜂助手 CPE 路由器 S1(4G 版)',
    description: '适合轻量网络覆盖与门店备用链路。',
    image: `${assetBase}/cpe-s1.jpg`,
    priceLabel: '¥896',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'box-s2',
    name: '蜂助手 4G 盒子 S2(极光 TV 版)',
    description: '客房多媒体场景快速接入，支持套餐咨询。',
    image: `${assetBase}/box-s2.jpg`,
    priceLabel: '¥1195',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'uifi-u1',
    name: '蜂助手随身 WiFi U1',
    description: '适合临时部署与移动覆盖补盲。',
    image: `${assetBase}/uifi-u1.png`,
    priceLabel: '¥341',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'smart-lock',
    name: '指定款【智能密码锁/门锁】',
    description: '联动智能门锁页面，可按门店场景创建咨询任务。',
    image: `${assetBase}/smart-lock.webp`,
    priceLabel: '¥998',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
  {
    id: 'd12-lock',
    name: '无人入住智能门锁智能入住 D12',
    description: '支持自助入住场景，适合智慧酒店标准化升级。',
    image: `${assetBase}/d12-lock.webp`,
    priceLabel: '¥299',
    action: 'contact',
    source: 'external',
    tag: '第三方硬件',
  },
]
const quickEntries = [
  {
    id: 'smart-lock',
    label: '智能门锁',
    path: '/smartHotel/smartHardware/smartLook',
    description: '继续配置门锁品牌与对接账号。',
  },
  {
    id: 'self-checkin',
    label: '自助入住',
    path: '/smartHotel/smartHome',
    description: '查看自助入住与门锁联动方案。',
  },
  {
    id: 'global-setting',
    label: '全局设置',
    path: '/smartHotel/checkInGuide',
    description: '进入智慧酒店全局配置与策略规则。',
  },
]
const applicableRoomGroups: SmartHardwareRoomGroup[] = [
  {
    roomCategoryId: '1796425099729092609',
    roomCategoryName: '顶层套房（浴缸巨幕电竞麻将）',
    rooms: ['房间1'],
  },
  {
    roomCategoryId: '1796425099485822977',
    roomCategoryName: '总裁套间（桑拿浴缸露台电竞麻将）',
    rooms: ['房间1'],
  },
  {
    roomCategoryId: '1796425099242553345',
    roomCategoryName: '天落大床电竞套间',
    rooms: ['1'],
  },
  {
    roomCategoryId: '1796425098965729282',
    roomCategoryName: '观影大床房',
    rooms: ['房间1'],
  },
]
const paymentGroups: SmartHardwarePaymentGroup[] = [
  {
    groupType: 1,
    groupTypeName: '住宿',
    paymentTypes: ['加床', '加人', '损坏赔偿', '其他收入', '退房费'],
  },
]
const consultationProducts = overviewProducts.filter((product) => product.action === 'contact')
export function createDefaultSmartHardwareMallQuery(
  searchParams = new URLSearchParams(),
  page: SmartHardwareMallPageMode = 'mall',
): SmartHardwareMallQuery {
  const provider = getSmartHardwareMallProviderName()
  const fallbackCampId = provider === 'api' ? resolveCurrentCampId(DEFAULT_REAL_CAMP_ID) : DEFAULT_MOCK_CAMP_ID
  return {
    campId: searchParams.get('campId')?.trim() || fallbackCampId,
    page,
    mockState: toMockState(searchParams.get('mockState')),
    productId: searchParams.get('productId') || defaultProductId,
  }
}
export async function fetchSmartHardwareMallOverview(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwareMallOverview> {
  validateQuery(query)
  if (providerName === 'api') {
    return fetchApiSmartHardwareMallOverview(query, signal)
  }
  await waitForMockLatency(signal)
  return adaptOverviewEnvelope(buildOverviewEnvelope(query), providerName)
}
export async function fetchSmartHardwareMallDetail(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwareMallDetail> {
  validateQuery(query)
  if (providerName === 'api') {
    return fetchApiSmartHardwareMallDetail(query, signal)
  }
  await waitForMockLatency(signal)
  return adaptDetailEnvelope(buildDetailEnvelope(query), providerName)
}
export async function fetchSmartHardwareApplicableRooms(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwareRoomGroup[]> {
  validateQuery(query)
  if (providerName === 'api') {
    const composite = await fetchApiSmartHardwareMallComposite(query, signal)
    return composite.roomGroups
  }
  await waitForMockLatency(signal)
  if (query.mockState === 'error') {
    throw new Error('适用房型加载失败，请稍后重试')
  }
  return applicableRoomGroups
}
export async function fetchSmartHardwarePaymentGroups(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
  providerName = getSmartHardwareMallProviderName(),
): Promise<SmartHardwarePaymentGroup[]> {
  validateQuery(query)
  if (providerName === 'api') {
    const composite = await fetchApiSmartHardwareMallComposite(query, signal)
    return composite.paymentGroups
  }
  await waitForMockLatency(signal)
  if (query.mockState === 'error') {
    throw new Error('支付方式加载失败，请稍后重试')
  }
  return paymentGroups
}
function getSmartHardwareMallProviderName(): SmartHardwareMallProviderName {
  if (typeof window === 'undefined') return 'mock'
  return normalizeProviderValue(window.localStorage.getItem(SMART_HARDWARE_MALL_PROVIDER_KEY)) === 'api' ? 'api' : 'mock'
}
async function fetchApiSmartHardwareMallOverview(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
): Promise<SmartHardwareMallOverview> {
  const response = await postHudsonEnvelope<WeiRoomCategoryResponse>(
    '/weiRoomCategories/page/get',
    {
      campId: DEFAULT_CATALOG_CAMP_ID,
      buyCampId: query.campId,
      roomCategoryTypes: [1],
      goodsTypes: [6],
    },
    signal,
  )
  const buyableProducts = asArray(response.data?.list).map(adaptApiOverviewItem)
  return {
    provider: 'api',
    traceId: response.traceId,
    requestedAt: response.timestamp,
    requestedAtLabel: buildRequestedAtLabel(response.timestamp),
    heroTitle: '门卡管理系统',
    heroDescription: '助力酒店高效运营',
    products: [...buyableProducts, ...consultationProducts],
    quickEntries,
  }
}
async function fetchApiSmartHardwareMallDetail(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
): Promise<SmartHardwareMallDetail> {
  const composite = await fetchApiSmartHardwareMallComposite(query, signal)
  const commodity = composite.commodity
  const roomGroupsList = composite.roomGroups
  const paymentGroupsList = composite.paymentGroups
  return {
    provider: 'api',
    traceId: commodity.traceId,
    requestedAt: commodity.timestamp,
    requestedAtLabel: buildRequestedAtLabel(commodity.timestamp),
    productId: readString(commodity.data.commodityId, query.productId),
    productName: readString(commodity.data.commodityName, defaultProductName),
    productDescription: readString(commodity.data.description, ''),
    purchaseTermLabel: readString(commodity.data.purchaseTermLabel, '1年'),
    buyerName: readBuyerName(),
    totalAmountLabel: formatMoneyLabel(commodity.data.sellingPriceCent),
    agreementLabel: DEFAULT_AGREEMENT_LABEL,
    purchaseNotice: DEFAULT_PURCHASE_NOTICE,
    routeAfterSubmit: DEFAULT_ROUTE_AFTER_SUBMIT,
    roomCategoryIds:
      asArray(commodity.data.roomCategoryIds).filter(Boolean).length > 0
        ? asArray(commodity.data.roomCategoryIds).filter(Boolean)
        : roomGroupsList.map((group) => group.roomCategoryId),
    roomSummary: buildRoomSummary(roomGroupsList),
    paymentSummary: buildPaymentSummary(paymentGroupsList),
  }
}
async function fetchApiSmartHardwareMallComposite(
  query: SmartHardwareMallQuery,
  signal?: AbortSignal,
): Promise<{
  commodity: ApiEnvelopeWithMeta<CommodityDetailApiPayload>
  roomGroups: SmartHardwareRoomGroup[]
  paymentGroups: SmartHardwarePaymentGroup[]
}> {
  const commodity = await postHudsonEnvelope<CommodityDetailApiPayload>(
    '/youzan/commodity/get',
    {
      campId: query.campId,
      commodityId: query.productId,
    },
    signal,
  )
  const roomCategoryIds = asArray(commodity.data?.roomCategoryIds).filter(Boolean)
  const [roomsResponse, paymentResponse] = await Promise.all([
    postHudsonEnvelope<RoomApiResponse>(
      '/rooms/get',
      {
        campId: query.campId,
        roomCategoryIds,
        saleType: 1,
      },
      signal,
    ),
    postHudsonEnvelope<PaymentTypeApiResponse>(
      '/paymentTypes/get/v2',
      {
        campId: query.campId,
        bizTypes: [2],
        isEnable: 1,
      },
      signal,
    ),
  ])
  return {
    commodity,
    roomGroups: adaptRoomGroups(roomsResponse.data),
    paymentGroups: adaptPaymentGroups(paymentResponse.data),
  }
}
function buildOverviewEnvelope(
  query: SmartHardwareMallQuery,
): UnifiedEnvelope<SmartHardwareMallOverviewPayload> {
  if (query.mockState === 'error') {
    return {
      code: 50301,
      message: '智能硬件商城数据加载失败，请稍后重试',
      data: createEmptyOverviewPayload(),
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-overview-error-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }
  if (query.mockState === 'empty') {
    return {
      code: 0,
      message: 'success',
      data: {
        ...createEmptyOverviewPayload(),
        emptyState: {
          title: '当前门店暂无可采购的智能硬件商品',
          description: '请先完成智慧酒店基础设置或联系专家开通适配商品，再回到商城统一采购。',
          actionLabel: '前往全局设置',
          actionPath: '/smartHotel/checkInGuide',
        },
      },
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-overview-empty-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }
  return {
    code: 0,
    message: 'success',
    data: {
      requestedAt: DEFAULT_TIMESTAMP,
      requestedAtLabel: '最近同步：2026-05-19 16:03',
      heroTitle: '智慧酒店一站式部署',
      heroDescription: '助力酒店高效运营',
      products: overviewProducts,
      quickEntries,
    },
    traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-overview-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}
function buildDetailEnvelope(
  query: SmartHardwareMallQuery,
): UnifiedEnvelope<SmartHardwareMallDetailPayload> {
  if (query.mockState === 'error') {
    return {
      code: 50302,
      message: '智能硬件商城详情加载失败，请稍后重试',
      data: createEmptyDetailPayload(),
      traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-detail-error-001',
      timestamp: DEFAULT_TIMESTAMP,
    }
  }
  const product = overviewProducts.find((item) => item.id === query.productId) ?? overviewProducts[0]
  return {
    code: 0,
    message: 'success',
    data: {
      requestedAt: DEFAULT_TIMESTAMP,
      requestedAtLabel: '最近同步：2026-05-19 16:03',
      productId: product.id,
      productName: product.name,
      productDescription: '已按真实取证契约同步适用房型与支付方式，可直接发起购买申请。',
      purchaseTermLabel: '一年',
      buyerName: '路客云6TS5',
      totalAmountLabel: '¥800',
      agreementLabel: DEFAULT_AGREEMENT_LABEL,
      purchaseNotice: DEFAULT_PURCHASE_NOTICE,
      routeAfterSubmit: DEFAULT_ROUTE_AFTER_SUBMIT,
      roomCategoryIds: applicableRoomGroups.map((group) => group.roomCategoryId),
      roomSummary: '4 个适用房型 / 4 间房',
      paymentSummary: '住宿分组 / 5 个支付项',
    },
    traceId: 'mock-zhihui-jiudian--zhizhu-yu-yingjian--zhineng-yingjian-shangcheng-detail-success-001',
    timestamp: DEFAULT_TIMESTAMP,
  }
}
function createEmptyOverviewPayload(): SmartHardwareMallOverviewPayload {
  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: '最近同步：2026-05-19 16:03',
    heroTitle: '智慧酒店一站式部署',
    heroDescription: '助力酒店高效运营',
    products: [],
    quickEntries,
  }
}
function createEmptyDetailPayload(): SmartHardwareMallDetailPayload {
  return {
    requestedAt: DEFAULT_TIMESTAMP,
    requestedAtLabel: '最近同步：2026-05-19 16:03',
    productId: defaultProductId,
    productName: defaultProductName,
    productDescription: '',
    purchaseTermLabel: '一年',
    buyerName: '路客云6TS5',
    totalAmountLabel: '¥800',
    agreementLabel: DEFAULT_AGREEMENT_LABEL,
    purchaseNotice: '',
    routeAfterSubmit: DEFAULT_ROUTE_AFTER_SUBMIT,
    roomCategoryIds: [],
    roomSummary: '0 个适用房型',
    paymentSummary: '0 个支付项',
  }
}
function adaptOverviewEnvelope(
  envelope: UnifiedEnvelope<SmartHardwareMallOverviewPayload>,
  provider: SmartHardwareMallProviderName,
): SmartHardwareMallOverview {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '智能硬件商城数据加载失败，请稍后重试')
  }
  const data = envelope.data
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.quickEntries)) {
    throw new Error('智能硬件商城数据加载失败，请稍后重试')
  }
  return {
    ...data,
    provider,
    traceId: envelope.traceId,
  }
}
function adaptDetailEnvelope(
  envelope: UnifiedEnvelope<SmartHardwareMallDetailPayload>,
  provider: SmartHardwareMallProviderName,
): SmartHardwareMallDetail {
  if (envelope.code !== 0) {
    throw new Error(envelope.message || '智能硬件商城详情加载失败，请稍后重试')
  }
  const data = envelope.data
  if (!data || !data.productId || !Array.isArray(data.roomCategoryIds)) {
    throw new Error('智能硬件商城详情加载失败，请稍后重试')
  }
  return {
    ...data,
    provider,
    traceId: envelope.traceId,
  }
}
async function postHudsonEnvelope<T>(
  endpoint: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<ApiEnvelopeWithMeta<T>> {
  const response = await fetch(`/api${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: buildApiHeaders(),
    body: JSON.stringify(body),
    signal,
  })
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null
  if (!response.ok || !payload) {
    throw new Error(payload?.message || `${endpoint} 请求失败，HTTP ${response.status}`)
  }
  if (payload.code !== 0 || payload.data === undefined || payload.data === null) {
    throw new Error(payload.message || `${endpoint} 响应无效`)
  }
  return {
    data: payload.data,
    traceId: payload.traceId,
    timestamp: payload.timestamp,
  }
}
function buildApiHeaders() {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('pms_token')?.trim()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  return headers
}
function adaptApiOverviewItem(item: WeiRoomCategoryItem): SmartHardwareProduct {
  const fallback = overviewProducts.find((product) => product.source === 'internal') ?? overviewProducts[0]
  const name = readString(item.channelRoomCategoryName, fallback?.name || defaultProductName)
  return {
    id: readString(item.channelRoomCategoryId, defaultProductId),
    name,
    description: readString(item.description, fallback?.description || ''),
    image: readString(item.mainPhoto, fallback?.image || ''),
    priceLabel: formatMoneyLabel(item.lowestSellingPrice),
    action: 'buy',
    source: 'internal',
    tag: '官方硬件',
    supportRoute: '/smartHotel/smartHardware/mall/detail',
  }
}
function adaptRoomGroups(data: RoomApiResponse | undefined): SmartHardwareRoomGroup[] {
  return asArray(data?.roomCategoryRooms).map((group) => ({
    roomCategoryId: readString(group.roomCategoryId, ''),
    roomCategoryName: readString(group.roomCategoryName, '未命名房型'),
    rooms: asArray(group.rooms)
      .map((room) => readString(room.roomName, ''))
      .filter(Boolean),
  }))
}
function adaptPaymentGroups(data: PaymentTypeApiResponse | undefined): SmartHardwarePaymentGroup[] {
  return asArray(data?.paymentGroups).map((group) => ({
    groupType: readNumber(group.groupType, 0),
    groupTypeName: readString(group.groupTypeName, '未命名分组'),
    paymentTypes: asArray(group.paymentTypes)
      .map((item) => readString(item.paymentTypeName, ''))
      .filter(Boolean),
  }))
}
function buildRoomSummary(groups: SmartHardwareRoomGroup[]) {
  const roomCount = groups.reduce((sum, group) => sum + group.rooms.length, 0)
  return `${groups.length} 个适用房型${roomCount > 0 ? ` / ${roomCount} 间房` : ''}`
}
function buildPaymentSummary(groups: SmartHardwarePaymentGroup[]) {
  const itemCount = groups.reduce((sum, group) => sum + group.paymentTypes.length, 0)
  const groupLabel = groups.length > 0 ? `${groups[0].groupTypeName}分组` : '0 个分组'
  return `${groupLabel} / ${itemCount} 个支付项`
}
function buildRequestedAtLabel(timestamp: string) {
  if (!timestamp) return '最近同步：--'
  const value = timestamp.replace('T', ' ').replace(/([+-]\d{2}:\d{2}|Z)$/, '')
  return `最近同步：${value.slice(0, 16)}`
}
function readBuyerName() {
  if (typeof window === 'undefined') return '当前门店'
  try {
    const raw = window.localStorage.getItem('pms_user')
    if (!raw) return '当前门店'
    const user = JSON.parse(raw) as { campName?: string; name?: string }
    return user.campName || user.name || '当前门店'
  } catch {
    return '当前门店'
  }
}
function formatMoneyLabel(value: number | undefined) {
  const amount = readNumber(value, 0)
  return `¥${formatMoney(amount / 100)}`
}
function formatMoney(value: number) {
  const numberFormat = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })
  return numberFormat.format(value)
}
function readString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}
function readNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}
function asArray<T>(value: T[] | undefined | null): T[] {
  return Array.isArray(value) ? value : []
}
function validateQuery(query: SmartHardwareMallQuery) {
  if (!query.campId.trim()) {
    throw new Error('智能硬件商城门店参数不正确')
  }
}
function toMockState(value: string | null): SmartHardwareMallMockState {
  return value === 'empty' || value === 'error' ? value : 'success'
}
async function waitForMockLatency(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, 180)
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}
function normalizeProviderValue(value: string | null | undefined) {
  return value === 'api' || value === 'real' ? 'api' : value === 'mock' ? 'mock' : undefined
}
