export type OrderCreateKeyValueItem = {
  id?: string
  text: string
}

export type OrderCreateRoomItem = {
  roomCategoryId?: string
  roomId?: string
  roomType?: string
  roomName?: string
  dateRange?: string
  contractStart?: string
  contractEnd?: string
  price?: number
  quantity?: number
  guests?: number
  monthlyRent?: number
  deposit?: number
}

export type OrderCreatePayload = {
  campId: string
  poiId?: string
  roomCategoryId?: string
  roomId?: string
  orderType: string
  stayType?: string
  guestName: string
  guestMobile?: string
  checkInDate: string
  checkOutDate: string
  totalPrice: number
  totalPayPrice: number
  paymentStatus?: string
  poiName?: string
  roomCategoryName?: string
  roomName?: string
  sourceLabel?: string
  channelOrderNo?: string
  depositPrice?: number
  otherPrice?: number
  invoiceIssuer?: string
  invoiceAmount?: number
  emergencyName?: string
  emergencyMobile?: string
  paymentCycle?: string
  paymentMonth?: string
  paymentDay?: string
  roomChargeStatus?: string
  roomChargeReceived?: number
  roomChargeMethod?: string
  depositChargeStatus?: string
  depositChargeReceived?: number
  depositChargeMethod?: string
  reminderEnabled?: number
  contractDueMode?: string
  contractNo?: string
  nextPaymentDate?: string
  nextPaymentAmount?: number
  extraFee?: number
  rooms?: OrderCreateRoomItem[]
  tags?: OrderCreateKeyValueItem[]
  reminders?: OrderCreateKeyValueItem[]
  extraFeeItems?: OrderCreateKeyValueItem[]
  billingSnapshot?: string
  remark?: string
}

type HudsonResponse<T> = {
  success?: boolean
  errorMsg?: unknown
  errorDetail?: unknown
  data?: T
}

export async function createOrder(payload: OrderCreatePayload, signal?: AbortSignal) {
  const response = await fetch('/api/orders/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal,
  })

  const result = (await response.json().catch(() => null)) as HudsonResponse<{ orderId?: string; message?: string }> | null

  if (!response.ok) {
    throw new Error(result?.errorMsg ? String(result.errorMsg) : `HTTP ${response.status}`)
  }
  if (!result || typeof result !== 'object') {
    throw new Error('创建订单响应不可解析')
  }
  if (result.success === false) {
    throw new Error(String(result.errorMsg || result.errorDetail || '创建订单失败'))
  }
  if (!result.data) {
    throw new Error('创建订单响应缺少 data')
  }

  return result.data
}
