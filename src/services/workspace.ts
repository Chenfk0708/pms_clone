import type { DonutSlice, RevenueMetric, WorkspaceMetric } from '../types'

const HUDSON_API_BASE = 'https://hudson-prod.localhome.cn'

type HudsonResponse<T> = {
  success?: boolean
  errorMsg?: string | null
  data?: T
}

export type WorkspacePeriod = 'yesterday' | 'month'
export type WorkspaceChartRange = 'week' | 'lastWeek'
export type WorkspaceOrderTab = 'arrivals' | 'staying' | 'departing'

export interface WorkspaceOrder {
  source: string
  name: string
  phone: string
  roomType: string
  room: string
  stayRange: string
  nights: string
  status: string
}

export interface WorkspaceSummary {
  metrics: Array<WorkspaceMetric & { testId?: string; route?: string }>
}

export interface WorkspaceAnalysis {
  revenueMetrics: RevenueMetric[]
  chartDates: string[]
  donutSlices: DonutSlice[]
}

export interface WorkspaceListState {
  orders: WorkspaceOrder[]
  memoCount: number
  productItems: Array<{ title: string; detail: string }>
}

export interface WorkspaceTrafficState {
  level: string
  suggestions: string[]
  connectedChannels: string[]
}

export interface WorkspaceDashboard {
  summary: WorkspaceSummary
  analysis: WorkspaceAnalysis
  lists: WorkspaceListState
  traffic: WorkspaceTrafficState
}

export function resolveWorkspaceCampId() {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('campId')
  const fromStorage = window.localStorage.getItem('pmsCampId')
  const fromEnv = import.meta.env.VITE_PMS_CAMP_ID as string | undefined
  const campId = fromQuery || fromStorage || fromEnv

  if (!campId) {
    throw new Error('缺少 campId：请通过 URL query、localStorage.pmsCampId 或 VITE_PMS_CAMP_ID 提供当前门店上下文')
  }

  return campId
}

export async function fetchWorkspaceDashboard(campId: string, period: WorkspacePeriod, chartRange: WorkspaceChartRange, orderTab: WorkspaceOrderTab, keyword: string) {
  const [summary, revenueAnalysis, chartAnalysis, lists, traffic] = await Promise.all([
    fetchWorkspaceSummary(campId),
    fetchWorkspaceAnalysis(campId, period),
    fetchWorkspaceAnalysis(campId, chartRange),
    fetchWorkspaceLists(campId, orderTab, keyword),
    fetchWorkspaceTraffic(campId),
  ])

  return {
    summary,
    analysis: {
      revenueMetrics: revenueAnalysis.revenueMetrics,
      chartDates: chartAnalysis.chartDates,
      donutSlices: chartAnalysis.donutSlices,
    },
    lists,
    traffic,
  } satisfies WorkspaceDashboard
}

export async function fetchWorkspaceSummary(campId: string): Promise<WorkspaceSummary> {
  const data = await postHudson<{
    nowPredictCheckIn?: number
    nowAlreadyCheckIn?: number
    nowPredictCheckOut?: number
    nowOnSaleNum?: number
    userBusyRepairNum?: number
    dirtyNum?: number
    exceptionOrderNum?: number
    nowIncome?: number
  }>('/report/homePage/v2', { campId })

  return {
    metrics: [
      { label: '预抵', value: formatNumber(data.nowPredictCheckIn), testId: 'workspace-metric-arrivals' },
      { label: '在住', value: formatNumber(data.nowAlreadyCheckIn), testId: 'workspace-metric-staying', route: '/statistics/roomSituation' },
      { label: '预离', value: formatNumber(data.nowPredictCheckOut) },
      { label: '可售', value: formatNumber(data.nowOnSaleNum) },
      { label: '维修房', value: formatNumber(data.userBusyRepairNum) },
      { label: '脏房', value: formatNumber(data.dirtyNum) },
      { label: '异常', value: formatNumber(data.exceptionOrderNum), accent: 'rose' },
      { label: '总营业收入', value: formatCurrencyFromCents(data.nowIncome), testId: 'workspace-metric-revenue', accent: 'orange' },
    ],
  }
}

export async function fetchWorkspaceAnalysis(campId: string, range: WorkspacePeriod | WorkspaceChartRange): Promise<WorkspaceAnalysis> {
  const query = getAnalysisRange(range)
  const data = await postHudson<{
    businessIncome?: number
    roomFeePriceIncludingCommission?: number
    writeDownIncome?: number
    otherOrderExpense?: number
    occ?: number
    adr?: number
    revPar?: number
    openRoomCount?: number
    roomCount?: number
    allDayOpenRoomCount?: number
    hourOpenRoomCount?: number
    growthTrendAnalysisList?: Array<{
      date?: string
      businessIncome?: number
      occ?: number
      adr?: number
      revPar?: number
      openRoomCount?: number
    }>
    orderOriginAnalysisList?: Array<{ channelName?: string; orderCount?: number }>
  }>('/report/accommodation/management/analysis/get', { campId, ...query })

  return {
    revenueMetrics: [
      {
        label: '营业收入',
        value: formatCurrency(data.businessIncome),
        detailLeft: `预计总收入 ${formatCurrency(0)}`,
        detailRight: `记一笔 ${formatCurrency(data.writeDownIncome)} 其他收入/支出 ${formatCurrency(data.otherOrderExpense)}`,
        accent: 'amber',
      },
      {
        label: '入住率OCC',
        value: formatPercent(data.occ),
        detailLeft: `已售房间数 ${formatNumber(data.openRoomCount)}`,
        detailRight: `总房数 ${formatNumber(data.roomCount)}`,
        accent: 'mint',
      },
      {
        label: '平均客房收益RevPAR',
        value: formatCurrency(data.revPar),
        detailLeft: `全日房 ${formatCurrency(data.roomFeePriceIncludingCommission)}`,
        detailRight: `钟点房 ${formatCurrency(0)}`,
        accent: 'peach',
      },
      {
        label: '平均房费ADR',
        value: formatCurrency(data.adr),
        detailLeft: `入住率OCC ${formatPercent(data.occ)}`,
        detailRight: `平均房费ADR ${formatCurrency(data.adr)}`,
        accent: 'sky',
      },
    ],
    chartDates: normalizeTrendDates(data.growthTrendAnalysisList),
    donutSlices: normalizeOriginSlices(data.orderOriginAnalysisList),
  }
}

export async function fetchWorkspaceLists(campId: string, orderTab: WorkspaceOrderTab, keyword: string): Promise<WorkspaceListState> {
  const [orderData, memoData, backlogData] = await Promise.all([
    postHudson<{ list?: unknown[] }>('/orders/get', {
      campId,
      orderType: orderTypeByTab[orderTab],
      pageNum: 1,
      keyword,
      pageSize: 10,
    }),
    postHudson<{ total?: number; list?: unknown[] }>('/memo/page/get', { campId, pageNum: 1, pageSize: 10, isHandle: 0 }),
    postHudson<unknown[]>('/backlogs/get', { campId }),
  ])

  return {
    orders: Array.isArray(orderData.list) ? orderData.list.map(normalizeOrder) : [],
    memoCount: Number(memoData.total ?? 0),
    productItems: Array.isArray(backlogData) ? backlogData.map(normalizeBacklogItem).filter(isBacklogItem) : [],
  }
}

export async function fetchWorkspaceTraffic(campId: string): Promise<WorkspaceTrafficState> {
  const data = await postHudson<{ isOpenFlow?: number; channelInfos?: Array<{ channelName?: string; isApplyOpen?: number }> }>('/campFlow/get', { campId })
  const connectedChannels = data.channelInfos?.filter((item) => item.isApplyOpen).map((item) => item.channelName || '未命名渠道') ?? []

  return {
    level: data.isOpenFlow ? '较好' : '待开通',
    connectedChannels,
    suggestions: ['小红书和抖音渠道暂未开通，渠道每天上亿流量，搭载图文和视频，能够快速吸引用户，促成下单。'],
  }
}

async function postHudson<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${HUDSON_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`${endpoint} 返回 HTTP ${response.status}`)
  }

  const payload = (await response.json()) as HudsonResponse<T>
  if (payload.success === false) {
    throw new Error(payload.errorMsg || `${endpoint} 返回业务失败`)
  }

  if (payload.data === undefined || payload.data === null) {
    throw new Error(`${endpoint} 响应缺少 data 字段`)
  }

  return payload.data
}

const orderTypeByTab: Record<WorkspaceOrderTab, string> = {
  arrivals: '11',
  staying: '12',
  departing: '13',
}

function normalizeOrder(raw: unknown): WorkspaceOrder {
  const item = raw as Record<string, unknown>

  return {
    source: String(item.channelName ?? '-'),
    name: String(item.guestName ?? '-'),
    phone: String(item.guestMobile ?? '-'),
    roomType: String(item.roomCategoryName ?? '-'),
    room: item.roomName ? String(item.roomName) : '-',
    stayRange: `${formatDateTime(item.startTime)}至${formatDateTime(item.endTime)}`,
    nights: String(item.dayNum ?? 1),
    status: String(item.orderDetailDisplayStateName ?? item.statusName ?? '待确认'),
  }
}

function normalizeBacklogItem(raw: unknown): { title: string; detail: string } | null {
  const item = raw as Record<string, unknown>
  const content = item.content
  if (typeof content !== 'string') return null

  try {
    const parsed = JSON.parse(content) as { title?: string; sub_title?: string; button?: string }
    return { title: parsed.title || '待办事项', detail: parsed.sub_title || parsed.button || '' }
  } catch {
    return { title: content, detail: '' }
  }
}

function isBacklogItem(value: { title: string; detail: string } | null): value is { title: string; detail: string } {
  return value !== null
}

function normalizeTrendDates(list: WorkspaceAnalysis['chartDates'] | Array<{ date?: string }> | undefined) {
  if (!Array.isArray(list) || list.length === 0) return []

  return list.map((item) => {
    if (typeof item === 'string') return item
    const date = item.date || ''
    const [, , month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? []
    return month && day ? `${month}/${day}` : date
  })
}

function normalizeOriginSlices(list: Array<{ channelName?: string; orderCount?: number }> | undefined): DonutSlice[] {
  const palette = ['#2269df', '#ff7a2e', '#f0c56b', '#31509e']
  if (!Array.isArray(list) || list.length === 0) return []

  const total = list.reduce((sum, item) => sum + Number(item.orderCount ?? 0), 0) || 1
  return list.slice(0, 4).map((item, index) => ({
    label: item.channelName || '未知渠道',
    value: `${((Number(item.orderCount ?? 0) / total) * 100).toFixed(2)}%`,
    color: palette[index % palette.length],
  }))
}

function getAnalysisRange(range: WorkspacePeriod | WorkspaceChartRange) {
  const today = startOfDay(new Date())
  const yesterday = addDays(today, -1)

  if (range === 'month') {
    return { startDate: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: formatDate(today) }
  }

  if (range === 'week') {
    return {
      startDate: formatDate(addDays(today, -5)),
      endDate: formatDate(today),
      predictStartDate: formatDate(addDays(today, -5)),
      predictEndDate: formatDate(addDays(today, 1)),
    }
  }

  if (range === 'lastWeek') {
    return { startDate: formatDate(addDays(today, -12)), endDate: formatDate(addDays(today, -6)) }
  }

  return { startDate: formatDate(yesterday), endDate: formatDate(yesterday) }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTime(value: unknown) {
  const date = typeof value === 'number' ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return '-'

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}.${day} ${hour}:${minute}`
}

function formatNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? String(number) : '0'
}

function formatCurrency(value: unknown) {
  const number = Number(value ?? 0)
  const normalized = Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, '')
  return `￥${normalized}`
}

function formatCurrencyFromCents(value: unknown) {
  const number = Number(value ?? 0)
  if (!Number.isFinite(number)) return '￥0'
  return formatCurrency(number / 100)
}

function formatPercent(value: unknown) {
  const number = Number(value ?? 0)
  const normalized = Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/\.?0+$/, '')
  return `${normalized}%`
}
