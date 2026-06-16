export interface TopNavItem {
  label: string
  path: string
  badge?: string
}

export interface SideNavGroup {
  title: string
  items: Array<{
    label: string
    path: string
  }>
}

export interface WorkspaceMetric {
  label: string
  value: string
  accent?: 'orange' | 'blue' | 'green' | 'rose'
}

export interface RevenueMetric {
  label: string
  value: string
  detailLeft: string
  detailRight: string
  accent: 'amber' | 'mint' | 'peach' | 'sky'
}

export interface DonutSlice {
  label: string
  value: string
  color: string
  count?: number
  percent?: number
}

export interface WorkspaceTrendPoint {
  date: string
  label: string
  businessIncome: number
  occ: number
  adr: number
  revPar: number
  openRoomCount: number
}

export interface HouseDateColumn {
  date: string
  weekday: string
  remaining: string
  highlight?: boolean
}

export interface HouseRow {
  roomType: string
  roomName: string
  cells: Array<{
    status: string
    note?: string
    price?: string
    tone?: 'empty' | 'blocked' | 'booking-blue' | 'booking-orange'
  }>
}

export interface OrderRecord {
  orderNo: string
  channel: string
  status: string
  contact: string
  phone: string
  stayType: string
  roomType: string
  room: string
  store: string
  checkInAt: string
  leaveAt: string
  liveStatus: string
  afterSaleStatus: string
  roomRevenueNet: string
  otherExpense: string
  roomRevenueGross: string
  totalRevenue: string
  debt: string
  bookedAt: string
  channelOrderNo: string
  stockFlag: string
  roomFlag: string
  planFlag: string
  needsRoomAssignment?: boolean
}

export interface PriceDateColumn {
  date: string
  weekday: string
}

export interface PriceChannelRow {
  channel: string
  coefficient: string
  basePrice: string
  prices: string[]
  comparePrices: string[]
}

export interface OtaConnectedCard {
  name: string
  relation: string
  badge?: string
}

export interface OtaPendingCard {
  name: string
}

export interface ReportSummaryCard {
  label: string
  value: string
  detailA?: string
  detailB?: string
}

export interface ChannelCard {
  name: string
  relation?: string
  support?: string
  action: string
  accent?: 'blue' | 'green' | 'red' | 'orange'
}

export interface InformationSummaryTag {
  label: string
  tone?: 'blue' | 'green' | 'orange'
}

export interface InformationRadarMetric {
  label: string
  value: number
}

export interface InformationFlowItem {
  name: string
  detail: string
  accent?: 'blue' | 'green' | 'orange'
}
