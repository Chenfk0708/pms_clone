import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  cancelHouseOrder,
  fetchHouseOrders,
  resolveHouseOrderCampId,
  skipStockHouseOrder,
  type HouseOrderData,
  type HouseOrderRow as OrderRow,
} from '../services/houseOrders'
import {
  fetchLongRentalOrders,
  resolveLongRentalQueryFromLocation,
  type LongRentalOrderOption,
  type LongRentalOrderPageData,
  type LongRentalOrderQuery,
  type LongRentalOrderRow,
} from '../services/longRentalOrders'
import { createOrder } from '../services/orderCreate'
import {
  fetchOrderRoomSelectorOptions,
  type OrderRoomSelectorGroup,
} from '../services/orderRoomSelector'
import { StoreSelectControl } from '../components/StoreSelect'
import {
  validateCredentialNumber,
  validateOptionalMainlandMobile,
  validatePersonName,
  validateRequiredMainlandMobile,
} from '../utils/inputValidation'
import './OrdersPage.css'

const quickFilters = [
  '全部',
  '今日新单',
  '今日预抵',
  '今日在住',
  '今日预离',
  '明日入住',
  '明日退房',
  '待接单',
  '待退款',
  '异常订单',
]

const houseBaseColumns = [
  '订单号',
  '渠道',
  '订单状态',
  '联系人',
  '手机号',
  '入住类型',
  '房型',
  '房间',
  '门店',
  '入住时间',
  '离开时间',
  '入住状态',
  '售后状态',
  '房费(减佣)',
  '其他消费',
  '房费(含佣)',
  '订单总收入',
  '订单欠款',
  '预订时间',
  '渠道单号',
]

const longRentalBaseColumns = [
  '订单号',
  '渠道',
  '租客姓名',
  '手机号',
  '房型',
  '房间',
  '门店',
  '入住时间',
  '离开时间',
  '入住状态',
  '房费（含佣）',
  '房费（减佣）',
  '其他消费',
  '押金',
  '订单总收入',
  '合同时间',
  '合同期限',
  '缴费方式',
  '缴费时间',
  '预订时间',
]

const collapsedTrailingColumns = ['操作']
const expandedTrailingColumns = ['操作', '占库存', '已排房', '计入统计']

const longRentalAdvancedFilters = [
  ['日期类型', '请选择日期类型'],
  ['订单状态', '请选择订单状态'],
  ['订单渠道', '全部'],
  ['订单房型', '全部'],
  ['入住状态', '全部'],
  ['平台账号', '全部'],
  ['订单门店', '全部'],
  ['订单标签', '全部'],
  ['排房情况', '请选择排房情况'],
  ['库存情况', '请选择占库存情况'],
  ['统计情况', '请选择统计情况'],
  ['房型标签', '全部'],
] as const

type EntryOrderType = 'fullDay' | 'hourly' | 'longRental'
type EntryCollectionStatus = 'received' | 'unreceived' | 'onsite'
type EntryPayMethod = 'platform' | 'wechat' | 'alipay' | 'cash'
type EntryStayKind = 'fullDay' | 'hourly'
type LongRentalStep = 1 | 2

export type OrderEntryInitialRoom = {
  poiId?: string
  poiName?: string
  roomCategoryId: string
  roomCategoryName: string
  roomId: string
  roomName: string
  startDate: string
  endDate?: string
  price?: string
  unitPrice?: string
  monthlyRent?: string
}

type EntryInlineItem = {
  id: string
  text: string
}

type EntryRoomSelection = {
  poiId: string
  poiName: string
  roomCategoryId: string
  roomCategoryName: string
  roomId: string
  roomName: string
  price?: string
  unitPrice?: string
  monthlyRent?: string
}

type EntryStayRoom = {
  id: string
  roomType: string
  roomCategoryId: string
  roomCategoryName: string
  roomId: string
  roomName: string
  poiId: string
  poiName: string
  dateRange: string
  price: string
  unitPrice: string
  quantity: string
  guests: string
  configured: boolean
  registeredGuests: EntryStayGuest[]
  registrationOpen: boolean
}

type EntryStayGuestErrors = {
  name?: string
  mobile?: string
  credentialNo?: string
}

type EntryStayGuest = {
  id: string
  name: string
  mobile: string
  credentialType: string
  credentialNo: string
  errors: EntryStayGuestErrors
}

type EntryStayErrors = {
  guestName?: string
  guestMobile?: string
}

type EntryStayForm = {
  useGuestAsCheckin: boolean
  guestName: string
  guestMobile: string
  orderSource: string
  channelOrderNo: string
  rooms: EntryStayRoom[]
  commission: string
  deposit: string
  roomChargeStatus: EntryCollectionStatus
  roomChargeReceived: string
  roomChargeMethod: EntryPayMethod
  depositChargeStatus: EntryCollectionStatus
  depositChargeReceived: string
  depositChargeMethod: EntryPayMethod
  invoiceIssuer: string
  invoiceAmount: string
  reminders: EntryInlineItem[]
  tags: EntryInlineItem[]
  remark: string
  errors: EntryStayErrors
}

type LongRentalRoom = {
  id: string
  roomLabel: string
  roomCategoryId: string
  roomCategoryName: string
  roomId: string
  roomName: string
  poiId: string
  poiName: string
  contractStart: string
  contractEnd: string
  monthlyRent: string
  deposit: string
  guests: string
}

type LongRentalEntryErrors = {
  tenantName?: string
  phone?: string
}

type LongRentalEntryForm = {
  step: LongRentalStep
  tenantName: string
  phone: string
  emergencyName: string
  emergencyPhone: string
  orderSource: string
  rooms: LongRentalRoom[]
  commission: string
  paymentCycle: '月付' | '季付' | '半年付' | '一次性付清'
  paymentMonth: '本月' | '下月'
  paymentDay: string
  reminderEnabled: '开启' | '关闭'
  contractDueMode: '月付' | '分段付'
  broadband: string
  shared: string
  sanitation: string
  property: string
  park: string
  errors: LongRentalEntryErrors
}

type StayFormUpdater = (updater: (current: EntryStayForm) => EntryStayForm) => void
type LongRentalFormUpdater = (updater: (current: LongRentalEntryForm) => LongRentalEntryForm) => void

type RoomSelectorModalState = {
  open: boolean
  mode: EntryOrderType
  visibleMonth: string
  selectedStart: string
  selectedEnd: string
  selectedHour: string
  selectedMinute: string
  selectingEnd: boolean
  keyword: string
  expandedRoomTypes: string[]
  selectedRooms: string[]
  roomOptions: OrderRoomSelectorGroup[]
  isLoading: boolean
  error: string
}

type ReminderModalState = {
  open: boolean
  date: string
  content: string
}

type TagSelectorModalState = {
  open: boolean
  keyword: string
  expandedGroups: string[]
  selectedTagIds: string[]
}

const entryOrderSourceOptions = ['自来客', '携程', '飞猪', '美团', '企业客户']
const entryCollectionStatusOptions: Array<{ value: EntryCollectionStatus; label: string }> = [
  { value: 'received', label: '已收' },
  { value: 'unreceived', label: '未收' },
  { value: 'onsite', label: '现场收' },
]
const entryPayMethodOptions: Array<{ value: EntryPayMethod; label: string }> = [
  { value: 'platform', label: '平台代收' },
  { value: 'wechat', label: '微信' },
  { value: 'alipay', label: '支付宝' },
  { value: 'cash', label: '现金' },
]
const longRentalPaymentCycles: LongRentalEntryForm['paymentCycle'][] = ['月付', '季付', '半年付', '一次性付清']
const longRentalPaymentMonths: LongRentalEntryForm['paymentMonth'][] = ['本月', '下月']
const longRentalPaymentDays = Array.from({ length: 31 }, (_, index) => `${index + 1}号`)
const hourlyRoomHours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'))
const hourlyRoomMinutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))
const orderTagGroups = [
  {
    id: 'default',
    label: '默认标签',
    tags: [
      { id: 'promotion', label: '促销' },
      { id: 'duplicate', label: '重单' },
      { id: 'keep', label: '保留房' },
      { id: 'hourly', label: '钟点房' },
    ],
  },
]

let orderEntrySeed = 0

function nextOrderEntryId(prefix: string) {
  orderEntrySeed += 1
  return `${prefix}-${orderEntrySeed}`
}

function sanitizeAmount(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 0
}

function formatMoney(value: number) {
  return value.toFixed(2)
}

function formatContractDuration(start: string, end: string) {
  if (!start || !end) return '--'

  const startDate = new Date(start)
  const endDate = new Date(end)
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))

  if (!Number.isFinite(diff) || diff < 0) return '--'
  return `${Math.max(diff, 1)}日`
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatClockTime(date: Date) {
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

function getTodayDateKey() {
  return formatDateKey(new Date())
}

function addDaysToDateKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`)
  date.setDate(date.getDate() + days)
  return formatDateKey(date)
}

function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7)
}

function toDisplayDateRange(start: string, end: string) {
  return `${start.replace(/-/g, '.')}-${end.replace(/-/g, '.')}`
}

function toDisplayHourlyStartDateTime(date = new Date()) {
  return `${formatDateKey(date).replace(/-/g, '.')} ${formatClockTime(date)}`
}

function formatMonthLabel(value: string) {
  const [year, month] = value.split('-')
  return `${year}-${month}`
}

function formatMonthDayRange(start: string, end: string) {
  const formatDate = (value: string) => {
    const [, month, day] = value.split('-')
    return `${month}-${day}`
  }
  if (!start && !end) return ''
  if (!end) return formatDate(start)
  return `${formatDate(start)}~${formatDate(end)}`
}

function getNightCount(start: string, end: string) {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  const diff = Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
  return Math.max(diff, 0)
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildCalendarDays(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  const firstDay = new Date(year, monthNumber - 1, 1)
  const dayOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, monthNumber - 1, 1 - dayOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return {
      key: formatDateKey(date),
      date,
      day: String(date.getDate()),
      isCurrentMonth: date.getMonth() === monthNumber - 1,
    }
  })
}

function resolveCount(value: string, fallback = 0) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function calculateStayRoomAmount(room: EntryStayRoom) {
  return sanitizeAmount(room.price)
}

function formatPlainAmount(value: number) {
  if (!Number.isFinite(value)) return '0'
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

function resolveRoomUnitPrice(price: string, unitPrice: string | undefined, quantity: string, fallbackQuantity = 1) {
  const normalizedUnitPrice = sanitizeAmount(unitPrice || '')
  if (normalizedUnitPrice > 0) return normalizedUnitPrice
  const count = Math.max(resolveCount(quantity, fallbackQuantity), 1)
  return sanitizeAmount(price) / count
}

function calculateRoomTotalPrice(unitPrice: number, quantity: number) {
  return formatPlainAmount(unitPrice * Math.max(quantity, 1))
}

function updateStayRoomQuantity(room: EntryStayRoom, nextQuantity: number, fallbackQuantity = 1) {
  const unitPrice = resolveRoomUnitPrice(room.price, room.unitPrice, room.quantity, fallbackQuantity)
  return {
    ...room,
    quantity: String(Math.max(nextQuantity, 1)),
    unitPrice: formatPlainAmount(unitPrice),
    price: calculateRoomTotalPrice(unitPrice, nextQuantity),
  }
}

function looksLikeHourlyDateRange(value: string) {
  return /\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}/.test(value.trim())
}

function splitRoomTypeAndName(value: string) {
  const normalized = value.trim()
  if (!normalized) {
    return { roomType: '', roomName: '101' }
  }

  const parts = normalized.split(/[\s（(]+/).filter(Boolean)
  return {
    roomType: normalized,
    roomName: parts.length > 1 ? parts[parts.length - 1].replace(/[）)]/g, '') : '101',
  }
}

function calculateStayFormSummary(form: EntryStayForm) {
  const roomRevenueGross = form.rooms.reduce((sum, room) => sum + calculateStayRoomAmount(room), 0)
  const commission = sanitizeAmount(form.commission)
  const deposit = sanitizeAmount(form.deposit)
  const roomRevenueNet = Math.max(roomRevenueGross - commission, 0)
  const received = sanitizeAmount(form.roomChargeReceived) + sanitizeAmount(form.depositChargeReceived)
  const totalRevenue = roomRevenueGross + deposit

  return {
    roomRevenueGross,
    roomRevenueNet,
    commission,
    deposit,
    received,
    totalRevenue,
    unpaid: Math.max(totalRevenue - received, 0),
  }
}

function calculateLongRentalSummary(form: LongRentalEntryForm) {
  const monthlyRent = form.rooms.reduce((sum, room) => sum + sanitizeAmount(room.monthlyRent), 0)
  const deposit = form.rooms.reduce((sum, room) => sum + sanitizeAmount(room.deposit), 0)
  const commission = sanitizeAmount(form.commission)
  const extras = form.broadband
    ? sanitizeAmount(form.broadband) +
      sanitizeAmount(form.shared) +
      sanitizeAmount(form.sanitation) +
      sanitizeAmount(form.property) +
      sanitizeAmount(form.park)
    : sanitizeAmount(form.shared) +
      sanitizeAmount(form.sanitation) +
      sanitizeAmount(form.property) +
      sanitizeAmount(form.park)

  return {
    monthlyRent,
    deposit,
    commission,
    extras,
    firstPayment: monthlyRent + deposit + extras,
    recurringPayment: monthlyRent + extras,
  }
}

function validateLongRentalEntryStep(form: LongRentalEntryForm) {
  const errors: LongRentalEntryErrors = {}

  const tenantNameError = validatePersonName(form.tenantName)
  if (tenantNameError) errors.tenantName = tenantNameError

  const phoneError = validateRequiredMainlandMobile(form.phone)
  if (phoneError) errors.phone = phoneError

  return errors
}

function validateStayForm(form: EntryStayForm): EntryStayForm {
  let hasErrors = false
  const errors: EntryStayErrors = {}
  const guestNameError = validatePersonName(form.guestName)
  const guestMobileError = validateOptionalMainlandMobile(form.guestMobile)

  if (guestNameError) {
    errors.guestName = guestNameError
    hasErrors = true
  }
  if (guestMobileError) {
    errors.guestMobile = guestMobileError
    hasErrors = true
  }

  const rooms = form.rooms.map((room) => ({
    ...room,
    registeredGuests: room.registeredGuests.map((guest) => {
      const rowTouched = Boolean(guest.name.trim() || guest.mobile.trim() || guest.credentialNo.trim())
      if (!rowTouched) return { ...guest, errors: {} }

      const guestErrors: EntryStayGuestErrors = {}
      const nameError = validatePersonName(guest.name || form.guestName)
      const mobileError = validateOptionalMainlandMobile(guest.mobile)
      const credentialError = validateCredentialNumber(guest.credentialType, guest.credentialNo)

      if (nameError) guestErrors.name = nameError
      if (mobileError) guestErrors.mobile = mobileError
      if (credentialError) guestErrors.credentialNo = credentialError

      if (Object.keys(guestErrors).length > 0) hasErrors = true
      return { ...guest, errors: guestErrors }
    }),
  }))

  return {
    ...form,
    errors,
    rooms,
    useGuestAsCheckin: hasErrors ? form.useGuestAsCheckin : form.useGuestAsCheckin,
  }
}

function stayFormHasErrors(form: EntryStayForm) {
  return Boolean(
    form.errors.guestName ||
      form.errors.guestMobile ||
      form.rooms.some((room) =>
        room.registeredGuests.some((guest) => guest.errors.name || guest.errors.mobile || guest.errors.credentialNo),
      ),
  )
}

function createStayForm(type: EntryStayKind = 'fullDay'): EntryStayForm {
  return {
    useGuestAsCheckin: false,
    guestName: '',
    guestMobile: '',
    orderSource: '自来客',
    channelOrderNo: '',
    rooms: [type === 'hourly' ? createHourlyStayRoom() : createStayRoom()],
    commission: '0',
    deposit: '0',
    roomChargeStatus: 'received',
    roomChargeReceived: '0',
    roomChargeMethod: 'platform',
    depositChargeStatus: 'received',
    depositChargeReceived: '0',
    depositChargeMethod: 'wechat',
    invoiceIssuer: '',
    invoiceAmount: '0',
    reminders: [],
    tags: [],
    remark: '',
    errors: {},
  }
}

function createStayRoom(): EntryStayRoom {
  const today = getTodayDateKey()
  const tomorrow = addDaysToDateKey(today, 1)
  return {
    id: nextOrderEntryId('stay-room'),
    roomType: '',
    roomCategoryId: '',
    roomCategoryName: '',
    roomId: '',
    roomName: '',
    poiId: '',
    poiName: '',
    dateRange: toDisplayDateRange(today, tomorrow),
    price: '0',
    unitPrice: '0',
    quantity: '1',
    guests: '1',
    configured: false,
    registeredGuests: [],
    registrationOpen: false,
  }
}

function createHourlyStayRoom(): EntryStayRoom {
  return {
    ...createStayRoom(),
    dateRange: toDisplayHourlyStartDateTime(),
    quantity: '1',
  }
}

function createStayRoomFromInitialRoom(initialRoom: OrderEntryInitialRoom, type: EntryStayKind = 'fullDay'): EntryStayRoom {
  const start = initialRoom.startDate
  const end = initialRoom.endDate || addDaysToDateKey(start, 1)
  const initialNights = Math.max(getNightCount(start, end), 1)
  const totalPrice = initialRoom.price || '0'
  const unitPrice = initialRoom.unitPrice || formatPlainAmount(sanitizeAmount(totalPrice) / initialNights)
  return {
    ...(type === 'hourly' ? createHourlyStayRoom() : createStayRoom()),
    roomType: `${initialRoom.roomCategoryName}（${initialRoom.roomName}）`,
    roomCategoryId: initialRoom.roomCategoryId,
    roomCategoryName: initialRoom.roomCategoryName,
    roomId: initialRoom.roomId,
    roomName: initialRoom.roomName,
    poiId: initialRoom.poiId || '',
    poiName: initialRoom.poiName || '',
    dateRange: type === 'hourly' ? toDisplayHourlyStartDateTime() : toDisplayDateRange(start, end),
    price: totalPrice,
    unitPrice,
    quantity: type === 'hourly' ? '1' : String(initialNights),
    configured: true,
  }
}

function createStayFormWithInitialRoom(initialRoom?: OrderEntryInitialRoom, type: EntryStayKind = 'fullDay'): EntryStayForm {
  const form = createStayForm(type)
  if (!initialRoom) return form
  return {
    ...form,
    rooms: [createStayRoomFromInitialRoom(initialRoom, type)],
  }
}

function createStayGuest(): EntryStayGuest {
  return {
    id: nextOrderEntryId('stay-guest'),
    name: '',
    mobile: '',
    credentialType: '居民身份证',
    credentialNo: '',
    errors: {},
  }
}

function createLongRentalRoom(): LongRentalRoom {
  const today = getTodayDateKey()
  const tomorrow = addDaysToDateKey(today, 1)
  return {
    id: nextOrderEntryId('long-room'),
    roomLabel: '',
    roomCategoryId: '',
    roomCategoryName: '',
    roomId: '',
    roomName: '',
    poiId: '',
    poiName: '',
    contractStart: today,
    contractEnd: tomorrow,
    monthlyRent: '0',
    deposit: '0',
    guests: '1',
  }
}

function createLongRentalRoomFromInitialRoom(initialRoom: OrderEntryInitialRoom): LongRentalRoom {
  return {
    ...createLongRentalRoom(),
    roomLabel: `${initialRoom.roomCategoryName}（${initialRoom.roomName}）`,
    roomCategoryId: initialRoom.roomCategoryId,
    roomCategoryName: initialRoom.roomCategoryName,
    roomId: initialRoom.roomId,
    roomName: initialRoom.roomName,
    poiId: initialRoom.poiId || '',
    poiName: initialRoom.poiName || '',
    contractStart: initialRoom.startDate,
    contractEnd: initialRoom.endDate || addDaysToDateKey(initialRoom.startDate, 1),
    monthlyRent: initialRoom.monthlyRent || initialRoom.price || '0',
  }
}

function createLongRentalEntryForm(initialRoom?: OrderEntryInitialRoom): LongRentalEntryForm {
  return {
    step: 1,
    tenantName: '',
    phone: '',
    emergencyName: '',
    emergencyPhone: '',
    orderSource: '自来客',
    rooms: [initialRoom ? createLongRentalRoomFromInitialRoom(initialRoom) : createLongRentalRoom()],
    commission: '0',
    paymentCycle: '月付',
    paymentMonth: '本月',
    paymentDay: '1号',
    reminderEnabled: '开启',
    contractDueMode: '月付',
    broadband: '',
    shared: '',
    sanitation: '',
    property: '',
    park: '',
    errors: {},
  }
}

function createRoomSelectorModalState(initialRoom?: OrderEntryInitialRoom): RoomSelectorModalState {
  const now = new Date()
  const today = initialRoom?.startDate || formatDateKey(now)
  const tomorrow = initialRoom?.endDate || addDaysToDateKey(today, 1)
  return {
    open: false,
    mode: 'fullDay',
    visibleMonth: getMonthKey(today),
    selectedStart: today,
    selectedEnd: tomorrow,
    selectedHour: String(now.getHours()).padStart(2, '0'),
    selectedMinute: String(now.getMinutes()).padStart(2, '0'),
    selectingEnd: false,
    keyword: '',
    expandedRoomTypes: [],
    selectedRooms: [],
    roomOptions: [],
    isLoading: false,
    error: '',
  }
}

function createReminderModalState(): ReminderModalState {
  return {
    open: false,
    date: '',
    content: '',
  }
}

function createTagSelectorModalState(): TagSelectorModalState {
  return {
    open: false,
    keyword: '',
    expandedGroups: orderTagGroups.map((item) => item.id),
    selectedTagIds: [],
  }
}

function toCent(value: string) {
  return Math.round(sanitizeAmount(value) * 100)
}

function parseStayDateRange(value: string) {
  const [startRaw, endRaw] = value.split('-')
  const start = startRaw?.replace(/\./g, '-').trim() || getTodayDateKey()
  const end = endRaw?.replace(/\./g, '-').trim() || start
  return { start, end }
}

function parseHourlyDateTimeRange(value: string, hours: string) {
  const now = new Date()
  const fallbackDateTime = toDisplayHourlyStartDateTime(now)
  const [dateRaw = formatDateKey(now).replace(/-/g, '.'), timeRaw = formatClockTime(now)] =
    (value.trim() || fallbackDateTime).split(/\s+/)
  const normalizedDateRaw = dateRaw.trim()
  const startDate = normalizedDateRaw.includes('.') ? parseStayDateRange(normalizedDateRaw).start : normalizedDateRaw
  const [hour = String(now.getHours()), minute = String(now.getMinutes())] = timeRaw.split(':')
  const start = new Date(`${startDate}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00`)
  const duration = Math.max(resolveCount(hours, 1), 1)
  const end = new Date(start)
  end.setHours(end.getHours() + duration)
  return { start, end, duration }
}

function formatHourlyDateTimeRange(dateRange: string, hours: string) {
  const { start, end } = parseHourlyDateTimeRange(dateRange, hours)
  const formatDateTime = (value: Date) => {
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    return `${month}-${day} ${formatClockTime(value)}`
  }
  const endText = formatDateKey(start) === formatDateKey(end) ? formatClockTime(end) : formatDateTime(end)
  return `${formatDateTime(start)}-${endText}`
}

function roomSelectionKey(roomCategoryId: string, roomId: string) {
  return `${roomCategoryId}:${roomId}`
}

function findRoomSelection(groups: OrderRoomSelectorGroup[], key: string): EntryRoomSelection | null {
  const [roomCategoryId, roomId] = key.split(':')
  if (!roomCategoryId || !roomId) return null

  const group = groups.find((item) => item.roomCategoryId === roomCategoryId)
  const room = group?.rooms.find((item) => item.roomId === roomId)
  if (!group || !room) return null

  return {
    poiId: group.poiId,
    poiName: group.poiName,
    roomCategoryId: group.roomCategoryId,
    roomCategoryName: group.roomCategoryName,
    roomId: room.roomId,
    roomName: room.roomName,
    price: room.price ?? group.price,
    unitPrice: room.unitPrice ?? group.unitPrice,
    monthlyRent: room.monthlyRent ?? group.monthlyRent ?? room.price ?? group.price,
  }
}

function resolveRoomSelectorRange(state: RoomSelectorModalState) {
  const start = state.selectedStart || getTodayDateKey()
  const end = state.mode === 'hourly' ? start : state.selectedEnd || start
  return start <= end ? { start, end } : { start: end, end: start }
}

function resolveRoomSelectorStayType(mode: EntryOrderType) {
  if (mode === 'hourly') return 'hourly_room'
  if (mode === 'longRental') return 'long_rental'
  return 'daily_room'
}

function applyHourlyRoomToSelectorState(state: RoomSelectorModalState, room: EntryStayRoom): RoomSelectorModalState {
  const { start } = parseHourlyDateTimeRange(room.dateRange, room.quantity)
  const selectedStart = formatDateKey(start)
  const [selectedHour, selectedMinute] = formatClockTime(start).split(':')
  return {
    ...state,
    open: true,
    mode: 'hourly',
    visibleMonth: getMonthKey(selectedStart),
    selectedStart,
    selectedEnd: selectedStart,
    selectedHour,
    selectedMinute,
    selectingEnd: false,
  }
}

function buildRoomSelectorQuery(state: RoomSelectorModalState, campId: string) {
  const { start, end } = resolveRoomSelectorRange(state)
  return {
    campId,
    startDate: start,
    days: state.mode === 'hourly' ? 1 : Math.max(getNightCount(start, end), 1),
    stayType: resolveRoomSelectorStayType(state.mode),
    keyword: state.keyword,
  }
}

function applySelectionToStayRoom(room: EntryStayRoom, selection: EntryRoomSelection, dateRange: string): EntryStayRoom {
  const isHourly = looksLikeHourlyDateRange(dateRange)
  const { start, end } = parseStayDateRange(dateRange)
  const quantity = isHourly ? Math.max(resolveCount(room.quantity, 1), 1) : Math.max(getNightCount(start, end), 1)
  const selectedPrice = selection.price || room.price || '0'
  const unitPrice = selection.unitPrice || formatPlainAmount(sanitizeAmount(selectedPrice) / quantity)
  const price =
    quantity > 1 && selection.unitPrice && sanitizeAmount(selectedPrice) === sanitizeAmount(selection.unitPrice)
      ? calculateRoomTotalPrice(sanitizeAmount(selection.unitPrice), quantity)
      : selectedPrice
  return {
    ...room,
    roomType: `${selection.roomCategoryName}（${selection.roomName}）`,
    roomCategoryId: selection.roomCategoryId,
    roomCategoryName: selection.roomCategoryName,
    roomId: selection.roomId,
    roomName: selection.roomName,
    poiId: selection.poiId,
    poiName: selection.poiName,
    dateRange,
    price,
    unitPrice,
    quantity: String(quantity),
    configured: true,
  }
}

function applySelectionToLongRentalRoom(room: LongRentalRoom, selection: EntryRoomSelection, start: string, end: string): LongRentalRoom {
  return {
    ...room,
    roomLabel: `${selection.roomCategoryName}（${selection.roomName}）`,
    roomCategoryId: selection.roomCategoryId,
    roomCategoryName: selection.roomCategoryName,
    roomId: selection.roomId,
    roomName: selection.roomName,
    poiId: selection.poiId,
    poiName: selection.poiName,
    contractStart: start || room.contractStart,
    contractEnd: end || room.contractEnd,
    monthlyRent: selection.monthlyRent || room.monthlyRent || '0',
  }
}

function buildStayOrderPayload(type: EntryStayKind, form: EntryStayForm, campId: string) {
  const room = form.rooms[0] ?? createStayRoom()
  const summary = calculateStayFormSummary(form)
  const { start, end } = parseStayDateRange(room.dateRange)
  const hourlyRange = parseHourlyDateTimeRange(room.dateRange, room.quantity)
  const formatBackendDateTime = (value: Date) => {
    const year = value.getFullYear()
    const month = String(value.getMonth() + 1).padStart(2, '0')
    const day = String(value.getDate()).padStart(2, '0')
    const hour = String(value.getHours()).padStart(2, '0')
    const minute = String(value.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}:00`
  }
  const roomInfo = splitRoomTypeAndName(room.roomType)
  const roomCategoryName = room.roomCategoryName || roomInfo.roomType || ''
  const roomName = room.roomName || roomInfo.roomName
  const guests = room.registeredGuests
    .filter((item) => item.name.trim() || item.mobile.trim() || item.credentialNo.trim())
    .map((item) => ({
      guestName: item.name.trim() || form.guestName.trim(),
      guestMobile: item.mobile.trim(),
      guestIdCardType: item.credentialType,
      guestIdCard: item.credentialNo.trim(),
      guestType: 'adult',
    }))

  return {
    campId,
    poiId: room.poiId || undefined,
    roomCategoryId: room.roomCategoryId || undefined,
    roomId: room.roomId || undefined,
    orderType: type === 'hourly' ? 'hourly_room' : 'daily_room',
    stayType: type === 'hourly' ? 'hourly_room' : 'daily_room',
    guestName: form.guestName.trim(),
    guestMobile: form.guestMobile.trim(),
    checkInDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.start) : `${start} 14:00:00`,
    checkOutDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.end) : `${end} 12:00:00`,
    totalPrice: Math.round(summary.roomRevenueGross * 100),
    totalPayPrice: Math.round(summary.received * 100),
    commissionPrice: Math.round(summary.commission * 100),
    paymentStatus: summary.unpaid > 0 ? 'partial' : 'paid',
    poiName: room.poiName || undefined,
    roomCategoryName: roomCategoryName || undefined,
    roomName,
    sourceLabel: form.orderSource,
    channelOrderNo: form.channelOrderNo.trim(),
    depositPrice: toCent(form.deposit),
    otherPrice: 0,
    invoiceIssuer: form.invoiceIssuer.trim(),
    invoiceAmount: toCent(form.invoiceAmount),
    roomChargeStatus: form.roomChargeStatus,
    roomChargeReceived: toCent(form.roomChargeReceived),
    roomChargeMethod: form.roomChargeMethod,
    depositChargeStatus: form.depositChargeStatus,
    depositChargeReceived: toCent(form.depositChargeReceived),
    depositChargeMethod: form.depositChargeMethod,
    rooms: [
      {
        roomCategoryId: room.roomCategoryId || undefined,
        roomId: room.roomId || undefined,
        roomType: roomCategoryName || room.roomType,
        roomName,
        dateRange: room.dateRange,
        checkInDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.start) : `${start} 14:00:00`,
        checkOutDate: type === 'hourly' ? formatBackendDateTime(hourlyRange.end) : `${end} 12:00:00`,
        price: toCent(room.price),
        quantity: resolveCount(room.quantity, 1),
        guests: resolveCount(room.guests, 1),
      },
    ],
    tags: form.tags.map((item) => ({ id: item.id, text: item.text })),
    reminders: form.reminders.map((item) => ({ id: item.id, text: item.text })),
    remark: form.remark.trim(),
    guests,
  }
}

function buildLongRentalOrderPayload(form: LongRentalEntryForm, campId: string) {
  const room = form.rooms[0] ?? createLongRentalRoom()
  const summary = calculateLongRentalSummary(form)
  const roomInfo = splitRoomTypeAndName(room.roomLabel)
  const roomCategoryName = room.roomCategoryName || roomInfo.roomType || ''
  const roomName = room.roomName || roomInfo.roomName

  return {
    campId,
    poiId: room.poiId || undefined,
    roomCategoryId: room.roomCategoryId || undefined,
    roomId: room.roomId || undefined,
    orderType: 'long_rental',
    stayType: 'long_rental',
    guestName: form.tenantName.trim(),
    guestMobile: form.phone.trim(),
    checkInDate: `${room.contractStart} 14:00:00`,
    checkOutDate: `${room.contractEnd} 12:00:00`,
    totalPrice: Math.round(summary.monthlyRent * 100),
    totalPayPrice: Math.round(summary.firstPayment * 100),
    commissionPrice: Math.round(summary.commission * 100),
    paymentStatus: 'paid',
    poiName: room.poiName || undefined,
    roomCategoryName: roomCategoryName || undefined,
    roomName,
    sourceLabel: form.orderSource,
    depositPrice: Math.round(summary.deposit * 100),
    otherPrice: Math.round(summary.extras * 100),
    emergencyName: form.emergencyName.trim(),
    emergencyMobile: form.emergencyPhone.trim(),
    paymentCycle: form.paymentCycle,
    paymentMonth: form.paymentMonth,
    paymentDay: form.paymentDay,
    reminderEnabled: form.reminderEnabled === '开启' ? 1 : 0,
    contractDueMode: form.contractDueMode,
    contractNo: `HT-LR-${Date.now()}`,
    nextPaymentDate: room.contractEnd,
    nextPaymentAmount: Math.round(summary.recurringPayment * 100),
    extraFee: Math.round(summary.extras * 100),
    rooms: [
      {
        roomCategoryId: room.roomCategoryId || undefined,
        roomId: room.roomId || undefined,
        roomType: roomCategoryName || room.roomLabel,
        roomName,
        contractStart: room.contractStart,
        contractEnd: room.contractEnd,
        monthlyRent: Math.round(sanitizeAmount(room.monthlyRent) * 100),
        deposit: Math.round(sanitizeAmount(room.deposit) * 100),
        guests: resolveCount(room.guests, 1),
      },
    ],
    extraFeeItems: [
      { text: `宽带费:${form.broadband || '0'}` },
      { text: `公摊费:${form.shared || '0'}` },
      { text: `卫生费:${form.sanitation || '0'}` },
      { text: `物业费:${form.property || '0'}` },
      { text: `停车费:${form.park || '0'}` },
    ],
    billingSnapshot: JSON.stringify({
      paymentCycle: form.paymentCycle,
      paymentMonth: form.paymentMonth,
      paymentDay: form.paymentDay,
      roomContract: {
        start: room.contractStart,
        end: room.contractEnd,
      },
    }),
  }
}

function statusTone(status: string) {
  if (status === '进行中' || status === '入住中') return 'is-running'
  if (status === '已完成' || status === '已退房') return 'is-done'
  if (status === '已预订' || status === '待入住') return 'is-booked'
  return 'is-canceled'
}

function formatDateRange(order: OrderRow) {
  const start = order.checkInAt.slice(0, 10).replace(/-/g, '.')
  const end = order.leaveAt.slice(0, 10).replace(/-/g, '.')
  return `${start}-${end} 1晚`
}

function formatLongContractTime(order: LongRentalOrderRow) {
  return `${order.contractStart} 至 ${order.contractEnd}`
}

type OrderFlagKind = 'stock' | 'room' | 'plan'

function resolveOrderFlagState(kind: OrderFlagKind, value: string | undefined, fallbackState = false) {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (['1', 'true', 'yes', '是', '√', '✓', '占库存', '已排房', '计入统计'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', '否', '×', '✕', '未排房', '不占库存', '不计入统计'].includes(normalized)) {
    return false
  }

  if (kind === 'room' && normalized === '-') {
    return false
  }

  return fallbackState
}

function renderOrderFlagIndicator(kind: OrderFlagKind, value: string | undefined, fallbackState = false) {
  const enabled = resolveOrderFlagState(kind, value, fallbackState)

  return (
    <span className={`order-flag-indicator ${enabled ? 'is-positive' : 'is-negative'}`} aria-label={enabled ? '是' : '否'}>
      {enabled ? '√' : '×'}
    </span>
  )
}

function resolveVisibleColumns(baseColumns: string[], expanded: boolean) {
  return [...baseColumns, ...(expanded ? expandedTrailingColumns : collapsedTrailingColumns)]
}

function resolveFixedColumnClassName(column: string) {
  if (column === '操作') return 'order-action-head order-action-head--edge'
  if (column === '占库存') return 'order-fixed-flag-head order-fixed-flag-head--stock'
  if (column === '已排房') return 'order-fixed-flag-head order-fixed-flag-head--room'
  if (column === '计入统计') return 'order-fixed-flag-head order-fixed-flag-head--plan'
  return undefined
}

function OrderColumnToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`order-column-toggle ${expanded ? 'is-expanded' : ''}`}
      aria-label={expanded ? '隐藏操作列' : '显示操作列'}
      data-testid="order-column-toggle"
      onClick={onToggle}
    >
      <span className="order-column-toggle__icon" aria-hidden="true">
        {expanded ? '‹' : '›'}
      </span>
      <span>{expanded ? '收起' : '展开'}</span>
    </button>
  )
}

function renderOrderColumnHeader(column: string, expanded: boolean, onToggle: () => void) {
  if (column === '操作') {
    return (
      <div key={column} role="columnheader" className={resolveFixedColumnClassName(column)}>
        <span>操作</span>
        <OrderColumnToggle expanded={expanded} onToggle={onToggle} />
      </div>
    )
  }

  return (
    <div
      key={column}
      role="columnheader"
      className={resolveFixedColumnClassName(column)}
    >
      {column}
    </div>
  )
}

function OrderDetail({
  order,
  onClose,
  onBlockedAction,
  onOrderCancelled,
  onOrderSkippedStock,
}: {
  order: OrderRow
  onClose: () => void
  onBlockedAction: (label: string) => void
  onOrderCancelled: (orderNo: string, message: string) => void
  onOrderSkippedStock: (orderNo: string, message: string) => void
}) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [skipStockDialogOpen, setSkipStockDialogOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isSkippingStock, setIsSkippingStock] = useState(false)
  const [localOrderStatus, setLocalOrderStatus] = useState(order.status)
  const [localLiveStatus, setLocalLiveStatus] = useState(order.liveStatus)
  const [localRoom, setLocalRoom] = useState(order.room)
  const [localNeedsRoomAssignment, setLocalNeedsRoomAssignment] = useState(order.needsRoomAssignment)
  const [localStockFlag, setLocalStockFlag] = useState(order.stockFlag)
  const [localRoomFlag, setLocalRoomFlag] = useState(order.roomFlag)
  const [operationMessage, setOperationMessage] = useState('')
  const collected = order.collected ?? order.totalRevenue
  const commission = order.commission ?? '0'
  const isCancelled = localOrderStatus === '已取消' || localLiveStatus === '已取消'
  const roomDisplayText = `${order.roomType}（${localRoom === '-' ? '未排房' : localRoom}）`

  const handleCancelOrder = async () => {
    const campId = resolveHouseOrderCampId()
    if (!campId) {
      setOperationMessage('缺少当前门店，无法取消订单')
      return
    }

    setIsCancelling(true)
    setOperationMessage('')
    try {
      const response = await cancelHouseOrder({
        campId,
        orderId: order.orderNo,
        reason: '订单详情取消房单',
      })
      const message = response.message || '订单取消成功'
      setLocalOrderStatus('已取消')
      setLocalLiveStatus('已取消')
      setCancelDialogOpen(false)
      setOperationMessage(message)
      onOrderCancelled(order.orderNo, message)
    } catch (error) {
      setOperationMessage(`取消房单失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsCancelling(false)
    }
  }

  const handleSkipStockOrder = async () => {
    const campId = resolveHouseOrderCampId()
    if (!campId) {
      setOperationMessage('缺少当前门店，无法设置不占库存')
      return
    }

    setIsSkippingStock(true)
    setOperationMessage('')
    try {
      const response = await skipStockHouseOrder({
        campId,
        orderId: order.orderNo,
        reason: '订单详情不占库存',
      })
      const message = response.message || '订单已释放库存并取消排房'
      setLocalRoom('-')
      setLocalNeedsRoomAssignment(true)
      setLocalStockFlag('')
      setLocalRoomFlag('未排房')
      setSkipStockDialogOpen(false)
      setOperationMessage(message)
      onOrderSkippedStock(order.orderNo, message)
    } catch (error) {
      setOperationMessage(`不占库存失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSkippingStock(false)
    }
  }

  return (
    <div className="order-detail-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="订单详情"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="order-detail-drawer__header">
          <div>
            <h2>订单详情</h2>
            <span>{order.stayType}</span>
          </div>
          <button type="button" aria-label="关闭订单详情" onClick={onClose}>
            ×
          </button>
        </header>

        <nav className="order-detail-tabs" aria-label="订单详情标签">
          <button type="button" className="is-active">
            订单信息
          </button>
          <button type="button">渠道信息</button>
          <button type="button">操作日志</button>
        </nav>

        <div className="order-detail-body">
          <section className="order-guest-card">
            <div>
              <strong>{order.contact}</strong>
              <span>直</span>
              <em>{order.channel}</em>
            </div>
            <p>手机号：{order.phone === '-' ? '无' : order.phone}</p>
            <p>渠道单号：{order.channelOrderNo}</p>
          </section>

          <section className="order-room-card">
            <div className="order-room-card__title">
              <strong>
                {roomDisplayText}
              </strong>
              <span className={`order-status ${statusTone(localLiveStatus)}`}>{localLiveStatus}</span>
            </div>
            <div className="order-room-card__status-row">
              <span>订单状态</span>
              <strong className={`order-status ${statusTone(localOrderStatus)}`}>{localOrderStatus}</strong>
            </div>
            <p>{formatDateRange(order)}</p>
            <strong className="order-room-card__total">¥ {order.totalRevenue}</strong>
          </section>

          {operationMessage ? (
            <div className={`order-detail-operation-message ${operationMessage.includes('失败') ? 'is-error' : ''}`} role="status">
              {operationMessage}
            </div>
          ) : null}

          <section className="order-detail-section">
            <h3>入住人（0/1）</h3>
            <button type="button" className="order-link-button" onClick={() => onBlockedAction('登记入住人')}>
              登记入住人
            </button>
          </section>

          <section className="order-rate-card">
            <header>
              <strong>{order.roomType}&lt;无早&gt;</strong>
            </header>
            <div className="order-rate-grid">
              <span>房费(减佣):</span>
              <strong>¥{order.roomRevenueNet}</strong>
              <span>订单总收入:</span>
              <strong>¥{Number(order.totalRevenue).toFixed(2)}</strong>
              <span>佣金:</span>
              <strong>¥{commission}</strong>
              <span>房费(含佣):</span>
              <strong>¥{Number(order.roomRevenueGross).toFixed(2)}</strong>
              <span>其他消费:</span>
              <strong>¥{Number(order.otherExpense).toFixed(2)}</strong>
            </div>
            <div className="order-room-date-table" role="table" aria-label="房费日历">
              <div role="row" className="order-room-date-table__head">
                <div role="columnheader">房间/日期</div>
                <div role="columnheader">{order.checkInAt.slice(0, 10)}</div>
              </div>
              <div role="row">
                <div role="cell">
                  {order.roomType}({localRoom === '-' ? '未排房' : localRoom})
                </div>
                <div role="cell">{order.roomRevenueNet}</div>
              </div>
            </div>
          </section>

          <section className="order-pay-card">
            <h3>房费收款</h3>
            <p>收款金额: ￥{collected}</p>
            <p>房费欠款: ￥{order.debt}</p>
          </section>

          <section className="order-detail-columns">
            <div>
              <h3>开票信息</h3>
              <p>其他收入/支出 0项/ ¥0.00</p>
            </div>
            <div>
              <h3>押金信息</h3>
              <p>押金金额: ¥ 0</p>
            </div>
            <div>
              <h3>订单欠款</h3>
              <p>¥{order.debt}</p>
            </div>
          </section>

          <section className="order-detail-section">
            <h3>订单备注</h3>
            <p>
              联系客人请拨打:02160454587(验证码:05383);如客人需要发票，请贵酒店开具，
              开票金额：CNY{collected} 客人电话:联系客人请拨打:02160454587;
              订单确认号: {order.confirmNo ?? order.channelOrderNo}
            </p>
          </section>

          <section className="order-detail-meta">
            <span>订单标签</span>
            <span>订单提醒</span>
            <span>订单附件</span>
            <span>创建人 无</span>
            <span>订单号 {order.orderNo}</span>
            <span>预订时间 {order.bookedAt.replace(/-/g, '.')}</span>
            <span>占库存 {localStockFlag ? '占库存' : '不占库存'}</span>
            <span>已排房 {localRoomFlag || (localNeedsRoomAssignment ? '未排房' : '已排房')}</span>
          </section>

          <section className="order-detail-actions" aria-label="订单操作">
            {['邀请登记', '邀请续住', '入住人', '延迟退房', '换房', '取消排房', '不占库存', '不计入统计', '设为续住单', '取消房单', '保洁', '打印'].map((action) => (
              <button
                key={action}
                type="button"
                disabled={action === '取消房单' && (isCancelled || isCancelling)}
                onClick={() => {
                  if (action === '取消房单') {
                    setCancelDialogOpen(true)
                    return
                  }
                  if (action === '不占库存') {
                    setSkipStockDialogOpen(true)
                    return
                  }
                  onBlockedAction(action)
                }}
              >
                {action}
              </button>
            ))}
          </section>
        </div>

        <footer className="order-detail-footer">
          <div>
            <span>房费(减佣)：</span>
            <strong>¥{order.roomRevenueNet}</strong>
          </div>
          <div>
            <span>订单总收入：</span>
            <strong>¥{Number(order.totalRevenue).toFixed(2)}</strong>
          </div>
          <button type="button" onClick={() => onBlockedAction('更多操作')}>更多操作</button>
          <button type="button" onClick={() => onBlockedAction('收款')}>收 款</button>
          <button type="button" onClick={() => onBlockedAction('续住')}>续 住</button>
          <button type="button" onClick={() => onBlockedAction('入住')}>入住</button>
          <button type="button" onClick={() => onBlockedAction('退房')}>退房</button>
        </footer>

        {cancelDialogOpen ? (
          <div className="order-confirm-backdrop" role="presentation" onClick={() => setCancelDialogOpen(false)}>
            <section
              className="order-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="取消房单"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <strong>取消房单</strong>
                <button type="button" aria-label="关闭取消房单" onClick={() => setCancelDialogOpen(false)}>
                  ×
                </button>
              </header>
              <div className="order-cancel-confirm">
                <span className="order-cancel-confirm__icon" aria-hidden="true">
                  !
                </span>
                <div>
                  <strong>确定取消此房单吗？</strong>
                  <p>取消后将释放房态，不可恢复，请谨慎操作</p>
                  <dl>
                    <div>
                      <dt>房间信息</dt>
                      <dd>
                        {roomDisplayText}
                      </dd>
                    </div>
                    <div>
                      <dt>订单编号</dt>
                      <dd>{order.orderNo}</dd>
                    </div>
                    <div>
                      <dt>当前状态</dt>
                      <dd>{localLiveStatus}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setCancelDialogOpen(false)} disabled={isCancelling}>
                  取消
                </button>
                <button type="button" className="is-primary" onClick={() => void handleCancelOrder()} disabled={isCancelling}>
                  {isCancelling ? '取消中' : '确定'}
                </button>
              </footer>
            </section>
          </div>
        ) : null}

        {skipStockDialogOpen ? (
          <div className="order-confirm-backdrop" role="presentation" onClick={() => setSkipStockDialogOpen(false)}>
            <section
              className="order-confirm-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="不占库存"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <strong>不占库存</strong>
                <button type="button" aria-label="关闭不占库存" onClick={() => setSkipStockDialogOpen(false)}>
                  ×
                </button>
              </header>
              <div className="order-cancel-confirm order-skip-stock-confirm">
                <span className="order-cancel-confirm__icon" aria-hidden="true">
                  !
                </span>
                <div>
                  <strong>订单将释放库存会同时取消排房，是否确定此操作？</strong>
                  <p>确认后该订单不再占用当前房间库存，当前排房也会同步取消。</p>
                  <button type="button" className="order-skip-stock-confirm__tag" onClick={() => onBlockedAction('添加标签')}>
                    <span>添加标签：</span>
                    <strong>+ 添加标签</strong>
                  </button>
                  <dl>
                    <div>
                      <dt>房间信息</dt>
                      <dd>{roomDisplayText}</dd>
                    </div>
                    <div>
                      <dt>订单编号</dt>
                      <dd>{order.orderNo}</dd>
                    </div>
                    <div>
                      <dt>当前状态</dt>
                      <dd>{localLiveStatus}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <footer>
                <button type="button" onClick={() => setSkipStockDialogOpen(false)} disabled={isSkippingStock}>
                  取消
                </button>
                <button type="button" className="is-primary" onClick={() => void handleSkipStockOrder()} disabled={isSkippingStock}>
                  {isSkippingStock ? '处理中' : '确定'}
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function LongRentalOrderDetail({
  order,
  onClose,
  onAction,
}: {
  order: LongRentalOrderRow
  onClose: () => void
  onAction: (label: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'order' | 'contract' | 'payment'>('order')

  return (
    <div className="order-detail-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-detail-drawer long-rental-detail"
        role="dialog"
        aria-modal="true"
        aria-label="长租订单详情"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="order-detail-drawer__header">
          <div>
            <h2>长租订单详情</h2>
            <span>{order.contractTerm} / {order.paymentMethod}</span>
          </div>
          <button type="button" aria-label="关闭长租订单详情" onClick={onClose}>
            ×
          </button>
        </header>

        <nav className="order-detail-tabs" aria-label="长租订单详情标签">
          <button type="button" className={activeTab === 'order' ? 'is-active' : ''} onClick={() => setActiveTab('order')}>
            订单信息
          </button>
          <button type="button" className={activeTab === 'contract' ? 'is-active' : ''} onClick={() => setActiveTab('contract')}>
            合同信息
          </button>
          <button type="button" className={activeTab === 'payment' ? 'is-active' : ''} onClick={() => setActiveTab('payment')}>
            缴费记录
          </button>
        </nav>

        <div className="order-detail-body">
          {activeTab === 'order' ? (
            <>
              <section className="order-guest-card">
                <div>
                  <strong>{order.tenantName}</strong>
                  <span>长</span>
                  <em>{order.channel}</em>
                </div>
                <p>手机号：{order.phone}</p>
                <p>订单号：{order.orderNo}</p>
              </section>

              <section className="order-room-card">
                <div className="order-room-card__title">
                  <strong>
                    {order.roomType}（{order.room === '-' ? '未排房' : order.room}）
                  </strong>
                  <span className={`order-status ${statusTone(order.liveStatus)}`}>{order.liveStatus}</span>
                </div>
                <p>{formatLongContractTime(order)}</p>
                <strong className="order-room-card__total">押金：{order.deposit}</strong>
              </section>

              <section className="order-rate-card">
                <header>
                  <strong>合同与费用</strong>
                </header>
                <div className="order-rate-grid">
                  <span>房费（含佣）：</span>
                  <strong>{order.roomRevenueGross}</strong>
                  <span>房费（减佣）：</span>
                  <strong>{order.roomRevenueNet}</strong>
                  <span>其他消费：</span>
                  <strong>{order.otherExpense}</strong>
                  <span>押金：</span>
                  <strong>{order.deposit}</strong>
                  <span>订单总收入：</span>
                  <strong>{order.totalRevenue}</strong>
                  <span>缴费方式：</span>
                  <strong>{order.paymentMethod}</strong>
                  <span>缴费时间：</span>
                  <strong>{order.paymentDate}</strong>
                  <span>合同期限：</span>
                  <strong>{order.contractTerm}</strong>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === 'contract' ? (
            <>
              <section className="order-detail-section">
                <h3>合同周期</h3>
                <p>{formatLongContractTime(order)}</p>
                <p>合同编号：{order.contractNo}</p>
              </section>
              <section className="order-rate-card">
                <header>
                  <strong>租住约定</strong>
                </header>
                <div className="order-rate-grid">
                  <span>合同期限：</span>
                  <strong>{order.contractTerm}</strong>
                  <span>缴费方式：</span>
                  <strong>{order.paymentMethod}</strong>
                  <span>占库存：</span>
                  <strong>{order.stockFlag || '1'}</strong>
                  <span>计入统计：</span>
                  <strong>{order.planFlag || '-'}</strong>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === 'payment' ? (
            <>
              <section className="order-detail-section">
                <h3>缴费计划</h3>
                <p>下次缴费日期：{order.nextPaymentDate}</p>
                <p>下次应收金额：{order.nextPaymentAmount}</p>
              </section>
              <section className="order-pay-card">
                <h3>押金与收款</h3>
                <p>押金：{order.deposit}</p>
                <p>订单总收入：{order.totalRevenue}</p>
              </section>
            </>
          ) : null}

          <section className="order-detail-meta">
            <span>租客姓名 {order.tenantName}</span>
            <span>预订时间 {order.bookedAt}</span>
            <span>入住状态 {order.liveStatus}</span>
            <span>占库存 {order.stockFlag || '1'}</span>
            <span>已排房 {order.roomFlag || '-'}</span>
            <span>计入统计 {order.planFlag || '-'}</span>
          </section>
        </div>

        <footer className="order-detail-footer">
          <div>
            <span>押金：</span>
            <strong>{order.deposit}</strong>
          </div>
          <div>
            <span>订单总收入：</span>
            <strong>{order.totalRevenue}</strong>
          </div>
          <button type="button" onClick={() => onAction('更多操作')}>
            更多操作
          </button>
          <button type="button" onClick={() => onAction('收款流程')}>
            收 款
          </button>
          <button type="button" onClick={() => onAction('续租流程')}>
            续 租
          </button>
          <button type="button" onClick={() => onAction('退租流程')}>
            退 租
          </button>
        </footer>
      </section>
    </div>
  )
}

function LongRentalOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [columnsExpanded, setColumnsExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [dateType, setDateType] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [channel, setChannel] = useState('')
  const [roomType, setRoomType] = useState('')
  const [liveStatus, setLiveStatus] = useState('')
  const [store, setStore] = useState('')
  const [openSelect, setOpenSelect] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<LongRentalOrderRow | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [data, setData] = useState<LongRentalOrderPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [operationFeedback, setOperationFeedback] = useState('长租订单已就绪')
  const [requestRevision, setRequestRevision] = useState(0)

  const locationQuery = useMemo(() => resolveLongRentalQueryFromLocation(window.location), [])
  const orderType = orderTypeByFilter[activeFilter] ?? ''

  const query = useMemo<LongRentalOrderQuery>(
    () => ({
      provider: locationQuery.provider,
      mockState: locationQuery.mockState,
      campId: locationQuery.campId,
      pageNum: 1,
      pageSize: 20,
      orderType,
      keyword: appliedKeyword,
      dateType,
      orderStatus,
      channel,
      roomType,
      liveStatus,
      store,
    }),
    [
      appliedKeyword,
      channel,
      dateType,
      liveStatus,
      locationQuery.mockState,
      locationQuery.provider,
      locationQuery.campId,
      orderStatus,
      orderType,
      roomType,
      store,
    ],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      setIsLoading(true)
      setRequestError('')
      try {
        const nextData = await fetchLongRentalOrders(query, controller.signal)
        if (controller.signal.aborted) return
        setData(nextData)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setData(null)
        setRequestError(error instanceof Error ? error.message : String(error))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [query, requestRevision])

  const orders = data?.rows ?? []
  const options = data?.options

  const handleQuery = useCallback(() => {
    setAppliedKeyword(keyword.trim())
    setOperationFeedback('已按当前条件查询长租订单')
    setRequestRevision((value) => value + 1)
  }, [keyword])

  const handleReset = useCallback(() => {
    setKeyword('')
    setAppliedKeyword('')
    setActiveFilter('全部')
    setFiltersExpanded(false)
    setColumnsExpanded(false)
    setDateType('')
    setOrderStatus('')
    setChannel('')
    setRoomType('')
    setLiveStatus('')
    setStore('')
    setOpenSelect(null)
    setOperationFeedback('筛选条件已重置')
    setRequestRevision((value) => value + 1)
  }, [])

  const handleAction = useCallback((label: string) => {
    setOperationFeedback(`${label}已记录`)
  }, [])

  const handleSelect = useCallback((label: string, value: string, setter: (nextValue: string) => void) => {
    setter(value)
    setOpenSelect(null)
    setOperationFeedback(`${label}已更新`)
    setRequestRevision((revision) => revision + 1)
  }, [])

  const requestSummary = `orderType=${orderType || 'all'} keyword=${appliedKeyword || 'all'} dateType=${dateType || 'all'}`
  const visibleColumns = useMemo(() => resolveVisibleColumns(longRentalBaseColumns, columnsExpanded), [columnsExpanded])
  const tableClassName = `order-table order-table--long-rental ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`

  return (
    <div className="page-stack order-page order-page--long-rental">
      <h1>长租订单</h1>
      <section className="order-source-panel" aria-label="长租订单数据来源">
        <span>长租订单服务 · 业务数据</span>
        <span role="status" aria-label="长租订单加载状态">
          {isLoading ? '正在加载长租订单' : `已加载 ${orders.length} 条`}
        </span>
      </section>
      {requestError ? (
        <section className="order-request-error" role="alert" aria-label="长租订单数据错误">
          <span>{requestError}</span>
          <button type="button" onClick={() => setRequestRevision((value) => value + 1)}>
            重试
          </button>
        </section>
      ) : null}
      <section className="order-filter-panel" aria-label="长租订单筛选">
        <div className="order-filter-tabs" role="radiogroup" aria-label="订单快捷筛选">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              role="radio"
              aria-checked={activeFilter === filter}
              className={activeFilter === filter ? 'is-active' : ''}
              disabled={isLoading}
              onClick={() => {
                setActiveFilter(filter)
                setOperationFeedback(`${filter}筛选已切换`)
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="order-filter-row">
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入订单号/姓名/手机号"
          />
          <div className="order-filter-actions">
            <button type="button" className="order-primary-action" onClick={handleQuery} disabled={isLoading}>
              查询
            </button>
            <button
              type="button"
              className="order-link-action"
              data-testid="order-filter-toggle"
              onClick={() => setFiltersExpanded((value) => !value)}
            >
              {filtersExpanded ? '收起' : '展开'}
            </button>
            <button
              type="button"
              className="order-outline-action"
              onClick={handleReset}
              disabled={isLoading}
            >
              重置筛选
            </button>
            <button
              type="button"
              className="order-outline-action"
              onClick={() => {
                setOperationFeedback('长租订单已刷新')
                setRequestRevision((value) => value + 1)
              }}
              disabled={isLoading}
            >
              刷新
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => setOperationFeedback('导出任务已创建，请在下载中心查看')}
            >
              导出明细
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => setCreateDialogOpen(true)}
            >
              录入订单
            </button>
          </div>
        </div>

        {filtersExpanded ? (
          <div className="order-advanced-filters order-advanced-filters--long-rental">
            <LongRentalSelect label="日期类型" placeholder="请选择日期类型" value={dateType} options={options?.dateTypes ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('日期类型', value, setDateType)} />
            <LongRentalSelect label="订单状态" placeholder="请选择订单状态" value={orderStatus} options={options?.orderStatuses ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('订单状态', value, setOrderStatus)} />
            <LongRentalSelect label="订单渠道" placeholder="全部" value={channel} options={options?.channels ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('订单渠道', value, setChannel)} />
            <LongRentalSelect label="订单房型" placeholder="全部" value={roomType} options={options?.roomTypes ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('订单房型', value, setRoomType)} />
            <LongRentalSelect label="入住状态" placeholder="全部" value={liveStatus} options={options?.liveStatuses ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('入住状态', value, setLiveStatus)} />
            <label className="order-select-field order-select-field--store">
              <span>订单门店</span>
              <StoreSelectControl
                label="订单门店"
                className="order-store-select"
                options={options?.stores ?? []}
                value={store || 'all'}
                disabled={isLoading}
                onChange={(storeId) => {
                  setOpenSelect(null)
                  handleSelect('订单门店', storeId === 'all' ? '' : storeId, setStore)
                }}
              />
            </label>
            <LongRentalSelect label="订单标签" placeholder="全部" value="" options={options?.tags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('订单标签筛选')} />
            <LongRentalSelect label="排房情况" placeholder="请选择排房情况" value="" options={options?.roomFlags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('排房情况筛选')} />
            <LongRentalSelect label="库存情况" placeholder="请选择占库存情况" value="" options={options?.stockFlags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('库存情况筛选')} />
            <LongRentalSelect label="统计情况" placeholder="请选择统计情况" value="" options={options?.statisticsFlags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('统计情况筛选')} />
            {longRentalAdvancedFilters.slice(5, 6).map(([label, value]) => (
              <LongRentalSelect key={label} label={label} placeholder={value} value="" options={[{ label: value, value: '' }]} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction(`${label}筛选`)} />
            ))}
            <LongRentalSelect label="房型标签" placeholder="全部" value="" options={options?.tags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('房型标签筛选')} />
          </div>
        ) : null}
      </section>
      <div className="order-operation-feedback" role="status" aria-label="长租订单操作反馈">
        {operationFeedback}
      </div>

      <section className="order-table-card">
        <div className="order-table-scroll">
          <div className={tableClassName} role="table" aria-label="长租订单列表">
            <div className="order-table__head" role="row">
              {visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value)))}
            </div>
            {isLoading ? (
              <div className="order-table__empty" role="row">
                <div role="cell">正在加载长租订单...</div>
              </div>
            ) : null}
            {!isLoading && !requestError ? orders.map((order) => (
              <div key={order.orderNo} className="order-table__row" role="row">
                <div role="cell" className="order-no">
                  {order.orderNo}
                </div>
                <div role="cell">{order.channel}</div>
                <div role="cell">{order.tenantName}</div>
                <div role="cell">{order.phone}</div>
                <div role="cell" className="order-room-type">
                  {order.roomType}
                </div>
                <div role="cell">{order.room}</div>
                <div role="cell">{order.store}</div>
                <div role="cell">{order.checkInAt}</div>
                <div role="cell">{order.leaveAt}</div>
                <div role="cell">
                  <span className={`order-status ${statusTone(order.liveStatus)}`}>{order.liveStatus}</span>
                </div>
                <div role="cell">{order.roomRevenueGross}</div>
                <div role="cell">{order.roomRevenueNet}</div>
                <div role="cell">{order.otherExpense}</div>
                <div role="cell">{order.deposit}</div>
                <div role="cell">{order.totalRevenue}</div>
                <div role="cell" className="order-contract-time">
                  <span>{order.contractStart} 至</span>
                  <span>{order.contractEnd}</span>
                </div>
                <div role="cell">{order.contractTerm}</div>
                <div role="cell">{order.paymentMethod}</div>
                <div role="cell">{order.paymentDate}</div>
                <div role="cell">{order.bookedAt}</div>
                <div role="cell" className="order-action-cell order-action-cell--edge">
                  <button type="button" onClick={() => setSelectedOrder(order)}>
                    详情
                  </button>
                </div>
                {columnsExpanded ? (
                  <>
                    <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--stock">
                      {renderOrderFlagIndicator('stock', order.stockFlag)}
                    </div>
                    <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--room">
                      {renderOrderFlagIndicator('room', order.roomFlag, order.room !== '-')}
                    </div>
                    <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--plan">
                      {renderOrderFlagIndicator('plan', order.planFlag)}
                    </div>
                  </>
                ) : null}
              </div>
            )) : null}
            {!isLoading && !requestError && orders.length === 0 ? (
              <div className="order-table__empty" role="row">
                <div role="cell">暂无长租订单</div>
              </div>
            ) : null}
          </div>
        </div>
        <footer className="order-pagination" aria-label="长租订单分页和请求参数">
          <span>共 {data?.total ?? 0} 条</span>
          <button type="button" aria-label="上一页" disabled>
            {'<'}
          </button>
          <button type="button" className="is-active">
            {data?.pageNum ?? 1}
          </button>
          <button type="button" aria-label="下一页" disabled={!data || data.pageNum >= data.pages} onClick={() => handleAction('下一页')}>
            {'>'}
          </button>
          <span>20 条/页</span>
          <span className="sr-only-heading">{requestSummary}</span>
        </footer>
      </section>

      {selectedOrder ? (
        <LongRentalOrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={(label) => handleAction(label)}
        />
      ) : null}
      {createDialogOpen ? (
        <section className="order-create-modal" role="dialog" aria-modal="true" aria-label="录入长租订单">
          <header>
            <strong>录入长租订单</strong>
            <button type="button" aria-label="关闭录入长租订单" onClick={() => setCreateDialogOpen(false)}>
              ×
            </button>
          </header>
          <label>
            <span>租客姓名</span>
            <input defaultValue="新租客" />
          </label>
          <label>
            <span>合同时间</span>
            <input defaultValue="2026-05-18 至 2026-06-18" />
          </label>
          <footer>
            <button type="button" onClick={() => setCreateDialogOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => {
                setCreateDialogOpen(false)
                setOperationFeedback('长租订单已保存')
              }}
            >
              保存订单
            </button>
          </footer>
        </section>
      ) : null}
    </div>
  )
}

function LongRentalSelect({
  label,
  placeholder,
  value,
  options,
  openSelect,
  setOpenSelect,
  onSelect,
}: {
  label: string
  placeholder: string
  value: string
  options: LongRentalOrderOption[]
  openSelect: string | null
  setOpenSelect: (value: string | null) => void
  onSelect: (value: string) => void
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder
  const isOpen = openSelect === label

  return (
    <label className="order-select-field">
      <span>{label}</span>
      <button
        type="button"
        aria-label={label}
        className="order-select-like"
        aria-expanded={isOpen}
        onClick={() => setOpenSelect(isOpen ? null : label)}
      >
        {selectedLabel}
      </button>
      {isOpen ? (
        <div className="order-select-menu" role="listbox" aria-label={`${label}选项`}>
          {options.map((option) => (
            <button key={`${label}-${option.value}-${option.label}`} type="button" role="option" onClick={() => onSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  )
}

function OrderEntrySection({
  title,
  extra,
  children,
  compact = false,
  boxed = false,
}: {
  title: ReactNode
  extra?: ReactNode
  children: ReactNode
  compact?: boolean
  boxed?: boolean
}) {
  return (
    <section className={`order-entry-section ${compact ? 'order-entry-section--compact' : ''} ${boxed ? 'order-entry-section--boxed' : ''}`}>
      <header className="order-entry-section__header">
        <h3>{title}</h3>
        {extra ? <div className="order-entry-section__extra">{extra}</div> : null}
      </header>
      <div className="order-entry-section__body">{children}</div>
    </section>
  )
}

function InlineChipEditor({
  items,
  emptyText,
  onChange,
}: {
  items: EntryInlineItem[]
  emptyText: string
  onChange: (items: EntryInlineItem[]) => void
}) {
  const [draft, setDraft] = useState('')

  const handleAdd = useCallback(() => {
    const value = draft.trim()
    if (!value) return

    onChange([
      ...items,
      {
        id: nextOrderEntryId('entry-chip'),
        text: value,
      },
    ])
    setDraft('')
  }, [draft, items, onChange])

  return (
    <div className="order-entry-chip-editor">
      <div className="order-entry-chip-list">
        {items.length === 0 ? <span className="order-entry-chip-list__empty">{emptyText}</span> : null}
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="order-entry-chip"
            onClick={() => onChange(items.filter((current) => current.id !== item.id))}
          >
            {item.text}
            <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>
      <div className="order-entry-chip-editor__input">
        <input
          type="text"
          value={draft}
          placeholder="输入后添加"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              handleAdd()
            }
          }}
        />
        <button type="button" onClick={handleAdd}>
          添加
        </button>
      </div>
    </div>
  )
}

function StayRoomCard({
  kind,
  room,
  roomIndex,
  onChange,
  onRemove,
}: {
  kind: EntryStayKind
  room: EntryStayRoom
  roomIndex: number
  onChange: (room: EntryStayRoom) => void
  onRemove: () => void
}) {
  const amount = calculateStayRoomAmount(room)

  return (
    <article className="order-entry-room-card">
      <div className="order-entry-room-card__header">
        <strong>{kind === 'hourly' ? `钟点房 ${roomIndex + 1}` : `房间 ${roomIndex + 1}`}</strong>
        <div>
          <span>小计 ¥{formatMoney(amount)}</span>
          <button type="button" className="order-entry-link" onClick={onRemove}>
            删除
          </button>
        </div>
      </div>
      <div className="order-entry-grid order-entry-grid--room">
        <label>
          <span>房型</span>
          <input type="text" value={room.roomType} placeholder="请选择房型" onChange={(event) => onChange({ ...room, roomType: event.target.value })} />
        </label>
        <label>
          <span>{kind === 'hourly' ? '入住时段' : '入住时间'}</span>
          <input
            type="text"
            value={room.dateRange}
            placeholder={kind === 'hourly' ? '例如 06-01 12:00 至 18:00' : '例如 06-01 至 06-02'}
            onChange={(event) => onChange({ ...room, dateRange: event.target.value })}
          />
        </label>
        <label>
          <span>{kind === 'hourly' ? '钟点价' : '单价'}</span>
          <input type="text" value={room.price} placeholder="0" onChange={(event) => onChange({ ...room, price: event.target.value })} />
        </label>
        <label>
          <span>数量</span>
          <input type="number" min="1" value={room.quantity} onChange={(event) => onChange({ ...room, quantity: event.target.value })} />
        </label>
        <label>
          <span>入住人数</span>
          <input type="number" min="1" value={room.guests} onChange={(event) => onChange({ ...room, guests: event.target.value })} />
        </label>
      </div>
    </article>
  )
}

function CollectionSection({
  title,
  status,
  received,
  payMethod,
  onStatusChange,
  onReceivedChange,
  onMethodChange,
}: {
  title: string
  status: EntryCollectionStatus
  received: string
  payMethod: EntryPayMethod
  onStatusChange: (value: EntryCollectionStatus) => void
  onReceivedChange: (value: string) => void
  onMethodChange: (value: EntryPayMethod) => void
}) {
  return (
    <div className="order-entry-collection-card">
      <h4>{title}</h4>
      <div className="order-entry-grid order-entry-grid--collection">
        <label>
          <span>收款状态</span>
          <select value={status} onChange={(event) => onStatusChange(event.target.value as EntryCollectionStatus)}>
            {entryCollectionStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>已收金额</span>
          <input type="text" value={received} onChange={(event) => onReceivedChange(event.target.value)} />
        </label>
        <label>
          <span>收款方式</span>
          <select value={payMethod} onChange={(event) => onMethodChange(event.target.value as EntryPayMethod)}>
            {entryPayMethodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

function StayOrderForm({
  type,
  form,
  setForm,
  onOpenRoomSelector,
  onOpenReminder,
  onOpenTags,
  onSubmit,
  isSubmitting,
}: {
  type: EntryStayKind
  form: EntryStayForm
  setForm: StayFormUpdater
  onOpenRoomSelector: () => void
  onOpenReminder: () => void
  onOpenTags: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const summary = calculateStayFormSummary(form)
  const room = form.rooms[0] ?? createStayRoom()
  const roomAmount = calculateStayRoomAmount(room)
  const parsedRoomInfo = splitRoomTypeAndName(room.roomType)
  const roomInfo = {
    roomType: room.roomCategoryName || parsedRoomInfo.roomType,
    roomName: room.roomName || parsedRoomInfo.roomName,
  }
  const { start, end } = parseStayDateRange(room.dateRange)
  const nightCount = Math.max(getNightCount(start, end), 1)
  const hourlyDuration = Math.max(resolveCount(room.quantity, 5), 1)
  const hourlyDateTimeRange = formatHourlyDateTimeRange(room.dateRange, String(hourlyDuration))

  const updatePrimaryRoom = (updater: (room: EntryStayRoom) => EntryStayRoom) => {
    setForm((current) => ({
      ...current,
      rooms: current.rooms.map((item, index) => (index === 0 ? updater(item) : item)),
    }))
  }

  return (
    <>
      <div className="order-entry-scroll order-entry-scroll--plain">
        <OrderEntrySection
          title="基本信息"
          compact
          extra={
            <label className="order-entry-switch order-entry-switch--right">
              <input
                type="checkbox"
                checked={form.useGuestAsCheckin}
                onChange={(event) => setForm((current) => ({ ...current, useGuestAsCheckin: event.target.checked }))}
              />
              <span>默认为入住人信息</span>
            </label>
          }
        >
          <div className="order-entry-basic-grid">
            <label className={`order-entry-inline-field is-required ${form.errors.guestName ? 'has-error' : ''}`}>
              <span>姓名：</span>
              <input
                type="text"
                value={form.guestName}
                placeholder="姓名"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    guestName: event.target.value,
                    errors: { ...current.errors, guestName: undefined },
                  }))
                }
              />
              {form.errors.guestName ? <em>{form.errors.guestName}</em> : null}
            </label>
            <label className={`order-entry-inline-field ${form.errors.guestMobile ? 'has-error' : ''}`}>
              <span>手机号：</span>
              <input
                type="text"
                value={form.guestMobile}
                placeholder="手机号"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    guestMobile: event.target.value,
                    errors: { ...current.errors, guestMobile: undefined },
                  }))
                }
              />
              {form.errors.guestMobile ? <em>{form.errors.guestMobile}</em> : null}
            </label>
            <label className="order-entry-inline-field">
              <span>订单来源：</span>
              <select value={form.orderSource} onChange={(event) => setForm((current) => ({ ...current, orderSource: event.target.value }))}>
                {entryOrderSourceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="order-entry-inline-field">
              <span>渠道单号：</span>
              <input
                type="text"
                value={form.channelOrderNo}
                placeholder="渠道单号"
                onChange={(event) => setForm((current) => ({ ...current, channelOrderNo: event.target.value }))}
              />
            </label>
          </div>
        </OrderEntrySection>

        <OrderEntrySection
          title={
            <span>
              房间/费用信息
              <em className="order-entry-section-tip">
                房费总计:¥{summary.roomRevenueGross.toFixed(0)} | 共{form.rooms.length}间房
              </em>
            </span>
          }
          compact
          extra={
            <button
              type="button"
              className="order-entry-link order-entry-link--add"
              onClick={onOpenRoomSelector}
            >
              + 添加房间
            </button>
          }
        >
          {room.configured ? (
            <div className="order-entry-stay-room-shell">
              <div className="order-entry-stay-room-bar">
                <button type="button" className="order-entry-stay-room-trigger" onClick={onOpenRoomSelector}>
                  <strong>
                    {roomInfo.roomType ? `${roomInfo.roomType}（${roomInfo.roomName || '未排房'}）` : '请选择房型（房间）'}
                  </strong>
                  <span>{type === 'hourly' ? hourlyDateTimeRange : room.dateRange}</span>
                </button>
                <div className="order-entry-stay-room-bar__tail">
                  <label className="order-entry-stay-room-price">
                    <span>￥</span>
                    <input
                      type="text"
                      value={room.price}
                      onChange={(event) =>
                        updatePrimaryRoom((current) => {
                          const nextPrice = event.target.value
                          const quantity = type === 'hourly' ? hourlyDuration : nightCount
                          return {
                            ...current,
                            price: nextPrice,
                            unitPrice: formatPlainAmount(sanitizeAmount(nextPrice) / Math.max(quantity, 1)),
                            quantity: current.quantity || '1',
                          }
                        })
                      }
                    />
                  </label>
                  {type === 'hourly' ? (
                    <div className="order-entry-hourly-duration">
                      <button
                        type="button"
                        onClick={() =>
                          updatePrimaryRoom((current) =>
                            updateStayRoomQuantity(current, Math.max(resolveCount(current.quantity, 5) - 1, 1), 5),
                          )
                        }
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={String(hourlyDuration)}
                        onChange={(event) =>
                          updatePrimaryRoom((current) =>
                            updateStayRoomQuantity(current, Math.max(resolveCount(event.target.value, 1), 1), 1),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updatePrimaryRoom((current) =>
                            updateStayRoomQuantity(current, Math.max(resolveCount(current.quantity, 5), 1) + 1, 5),
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="order-entry-stay-room-stepper">
                        <input
                          type="number"
                          min="1"
                          value={String(nightCount)}
                          onChange={(event) => {
                            const nextNightCount = Math.max(resolveCount(event.target.value, 1), 1)
                            const { start } = parseStayDateRange(room.dateRange)
                            const startDate = new Date(start)
                            startDate.setDate(startDate.getDate() + nextNightCount)
                            const end = startDate.toISOString().slice(0, 10).replace(/-/g, '.')
                            updatePrimaryRoom((current) => ({
                              ...updateStayRoomQuantity(current, nextNightCount),
                              dateRange: `${start.replace(/-/g, '.')} - ${end}`.replace(' - ', '-'),
                            }))
                          }}
                        />
                        <span>晚</span>
                      </label>
                      <label className="order-entry-stay-room-stepper">
                        <input
                          type="number"
                          min="1"
                          value={room.guests || '1'}
                          onChange={(event) =>
                            updatePrimaryRoom((current) => ({
                              ...current,
                              guests: String(Math.max(resolveCount(event.target.value, 1), 1)),
                            }))
                          }
                        />
                        <span>人</span>
                      </label>
                    </>
                  )}
                  <button
                    type="button"
                    className="order-entry-link order-entry-link--register"
                    onClick={() =>
                      updatePrimaryRoom((current) => ({
                        ...current,
                        registrationOpen: !current.registrationOpen,
                        registeredGuests:
                          current.registeredGuests.length > 0 ? current.registeredGuests : [createStayGuest()],
                      }))
                    }
                  >
                    登记
                  </button>
                </div>
              </div>

              {room.registrationOpen ? (
                <div className="order-entry-stay-guest-list">
                  {room.registeredGuests.map((guest) => (
                    <div key={guest.id} className="order-entry-stay-guest-row">
                      <label className={`order-entry-stay-guest-field ${guest.errors.name ? 'has-error' : ''}`}>
                        <input
                          type="text"
                          value={guest.name}
                          placeholder="客户姓名"
                          onChange={(event) =>
                            updatePrimaryRoom((current) => ({
                              ...current,
                              registeredGuests: current.registeredGuests.map((item) =>
                                item.id === guest.id
                                  ? { ...item, name: event.target.value, errors: { ...item.errors, name: undefined } }
                                  : item,
                              ),
                            }))
                          }
                        />
                        {guest.errors.name ? <em>{guest.errors.name}</em> : null}
                      </label>
                      <label className={`order-entry-stay-guest-field ${guest.errors.mobile ? 'has-error' : ''}`}>
                        <input
                          type="text"
                          value={guest.mobile}
                          placeholder="手机号"
                          onChange={(event) =>
                            updatePrimaryRoom((current) => ({
                              ...current,
                              registeredGuests: current.registeredGuests.map((item) =>
                                item.id === guest.id
                                  ? { ...item, mobile: event.target.value, errors: { ...item.errors, mobile: undefined } }
                                  : item,
                              ),
                            }))
                          }
                        />
                        {guest.errors.mobile ? <em>{guest.errors.mobile}</em> : null}
                      </label>
                      <label className="order-entry-stay-guest-field">
                        <select
                          value={guest.credentialType}
                          onChange={(event) =>
                            updatePrimaryRoom((current) => ({
                              ...current,
                              registeredGuests: current.registeredGuests.map((item) =>
                                item.id === guest.id
                                  ? {
                                      ...item,
                                      credentialType: event.target.value,
                                      errors: { ...item.errors, credentialNo: undefined },
                                    }
                                  : item,
                              ),
                            }))
                          }
                        >
                          <option value="居民身份证">居民身份证</option>
                          <option value="港澳通行证">港澳通行证</option>
                          <option value="港澳回乡证">港澳回乡证</option>
                          <option value="台胞证">台胞证</option>
                          <option value="Passport">Passport</option>
                        </select>
                      </label>
                      <label className={`order-entry-stay-guest-field ${guest.errors.credentialNo ? 'has-error' : ''}`}>
                        <input
                          type="text"
                          value={guest.credentialNo}
                          placeholder="请输入证件号码"
                          onChange={(event) =>
                            updatePrimaryRoom((current) => ({
                              ...current,
                              registeredGuests: current.registeredGuests.map((item) =>
                                item.id === guest.id
                                  ? {
                                      ...item,
                                      credentialNo: event.target.value,
                                      errors: { ...item.errors, credentialNo: undefined },
                                    }
                                  : item,
                              ),
                            }))
                          }
                        />
                        {guest.errors.credentialNo ? <em>{guest.errors.credentialNo}</em> : null}
                      </label>
                      <button type="button" className="order-entry-link order-entry-link--tiny">
                        读卡
                      </button>
                      <button
                        type="button"
                        className="order-entry-link order-entry-link--tiny"
                        onClick={() =>
                          updatePrimaryRoom((current) => ({
                            ...current,
                            registeredGuests: current.registeredGuests.filter((item) => item.id !== guest.id),
                          }))
                        }
                      >
                        取消
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="order-entry-link order-entry-link--guest-add"
                    onClick={() =>
                      updatePrimaryRoom((current) => ({
                        ...current,
                        registeredGuests: [...current.registeredGuests, createStayGuest()],
                      }))
                    }
                  >
                    添加入住人
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="order-entry-fee-row">
            <label className="order-entry-inline-money">
              <span>佣金：</span>
              <div className="order-entry-money-box">
                <span>￥</span>
                <input type="text" value={form.commission} onChange={(event) => setForm((current) => ({ ...current, commission: event.target.value }))} />
              </div>
            </label>
            <label className="order-entry-inline-money">
              <span>押金：</span>
              <div className="order-entry-money-box">
                <span>￥</span>
                <input type="text" value={form.deposit} onChange={(event) => setForm((current) => ({ ...current, deposit: event.target.value }))} />
              </div>
            </label>
          </div>
        </OrderEntrySection>

        <OrderEntrySection title="收款信息" compact>
          <div className="order-entry-payment-grid">
            <div className="order-entry-payment-row">
              <div className="order-entry-payment-label">房费收款:</div>
              <div className="order-entry-segment">
                {entryCollectionStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={form.roomChargeStatus === option.value ? 'is-active' : ''}
                    onClick={() => setForm((current) => ({ ...current, roomChargeStatus: option.value }))}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="order-entry-inline-money order-entry-inline-money--tight">
                <span>已收房费：</span>
                <div className="order-entry-money-box">
                  <span>￥</span>
                  <input type="text" value={form.roomChargeReceived} onChange={(event) => setForm((current) => ({ ...current, roomChargeReceived: event.target.value }))} />
                </div>
              </label>
              <label className="order-entry-inline-field order-entry-inline-field--compact">
                <span>收款方式：</span>
                <select value={form.roomChargeMethod} onChange={(event) => setForm((current) => ({ ...current, roomChargeMethod: event.target.value as EntryPayMethod }))}>
                  {entryPayMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="order-entry-payment-row">
              <div className="order-entry-payment-label">押金收款:</div>
              <div className="order-entry-segment is-disabled">
                {entryCollectionStatusOptions.map((option) => (
                  <button key={option.value} type="button" className={form.depositChargeStatus === option.value ? 'is-active' : ''} disabled>
                    {option.label}
                  </button>
                ))}
              </div>
              <label className="order-entry-inline-money order-entry-inline-money--tight">
                <span>已收押金：</span>
                <div className="order-entry-money-box is-disabled">
                  <span>￥</span>
                  <input type="text" value={form.depositChargeReceived} disabled onChange={() => undefined} />
                </div>
              </label>
              <label className="order-entry-inline-field order-entry-inline-field--compact">
                <span>收款方式：</span>
                <select value={form.depositChargeMethod} disabled onChange={() => undefined}>
                  {entryPayMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </OrderEntrySection>

        <OrderEntrySection title="开票信息" compact>
          <div className="order-entry-invoice-row">
            <label className="order-entry-inline-field order-entry-inline-field--narrow">
              <span>开票方：</span>
              <input
                type="text"
                value={form.invoiceIssuer}
                placeholder="请输入"
                onChange={(event) => setForm((current) => ({ ...current, invoiceIssuer: event.target.value }))}
              />
            </label>
            <label className="order-entry-inline-money">
              <span>开票金额：</span>
              <div className="order-entry-money-box">
                <span>￥</span>
                <input type="text" value={form.invoiceAmount} onChange={(event) => setForm((current) => ({ ...current, invoiceAmount: event.target.value }))} />
              </div>
            </label>
          </div>
        </OrderEntrySection>

        <OrderEntrySection
          title="订单提醒"
          compact
          boxed
          extra={
            <button type="button" className="order-entry-link order-entry-link--icon" onClick={onOpenReminder}>
              ＋
            </button>
          }
        >
          {form.reminders.length > 0 ? (
            <div className="order-entry-token-list">
              {form.reminders.map((item) => (
                <span key={item.id} className="order-entry-token">
                  {item.text}
                </span>
              ))}
            </div>
          ) : (
            <div className="order-entry-collapsed-line" />
          )}
        </OrderEntrySection>

        <OrderEntrySection
          title="订单标签"
          compact
          boxed
          extra={
            <button type="button" className="order-entry-link order-entry-link--icon" onClick={onOpenTags}>
              ＋
            </button>
          }
        >
          {form.tags.length > 0 ? (
            <div className="order-entry-token-list">
              {form.tags.map((item) => (
                <span key={item.id} className="order-entry-token">
                  {item.text}
                </span>
              ))}
            </div>
          ) : (
            <div className="order-entry-collapsed-line" />
          )}
        </OrderEntrySection>

        <OrderEntrySection title="订单备注：" compact boxed>
          <textarea
            className="order-entry-textarea order-entry-textarea--plain"
            value={form.remark}
            placeholder="请输入订单备注"
            onChange={(event) => setForm((current) => ({ ...current, remark: event.target.value }))}
          />
        </OrderEntrySection>
      </div>

      <footer className="order-entry-footer">
        <div className="order-entry-footer__metrics">
          <div>
            <span>房费(减佣):</span>
            <strong>¥{formatMoney(summary.roomRevenueNet)}</strong>
          </div>
          <div>
            <span>订单总收入：</span>
            <strong>¥{formatMoney(summary.totalRevenue)}</strong>
          </div>
        </div>
        <button type="button" className="order-entry-submit" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交'}
        </button>
      </footer>
    </>
  )
}

function LongRentalRoomCard({
  room,
  roomIndex,
  onChange,
  onRemove,
}: {
  room: LongRentalRoom
  roomIndex: number
  onChange: (room: LongRentalRoom) => void
  onRemove: () => void
}) {
  return (
    <article className="order-entry-room-card">
      <div className="order-entry-room-card__header">
        <strong>房间 {roomIndex + 1}</strong>
        <div>
          <span>{formatContractDuration(room.contractStart, room.contractEnd)}</span>
          <button type="button" className="order-entry-link" onClick={onRemove}>
            删除
          </button>
        </div>
      </div>
      <div className="order-entry-grid order-entry-grid--long-room">
        <label>
          <span>房型/房号</span>
          <input type="text" value={room.roomLabel} placeholder="例如 大床房 201" onChange={(event) => onChange({ ...room, roomLabel: event.target.value })} />
        </label>
        <label>
          <span>合同开始</span>
          <input type="date" value={room.contractStart} onChange={(event) => onChange({ ...room, contractStart: event.target.value })} />
        </label>
        <label>
          <span>合同结束</span>
          <input type="date" value={room.contractEnd} onChange={(event) => onChange({ ...room, contractEnd: event.target.value })} />
        </label>
        <label>
          <span>月租金</span>
          <input type="text" value={room.monthlyRent} onChange={(event) => onChange({ ...room, monthlyRent: event.target.value })} />
        </label>
        <label>
          <span>押金</span>
          <input type="text" value={room.deposit} onChange={(event) => onChange({ ...room, deposit: event.target.value })} />
        </label>
        <label>
          <span>入住人数</span>
          <input type="number" min="1" value={room.guests} onChange={(event) => onChange({ ...room, guests: event.target.value })} />
        </label>
      </div>
    </article>
  )
}

function LongRentalOrderForm({
  form,
  setForm,
  onClose,
  onOpenRoomSelector,
  onSubmit,
  isSubmitting,
}: {
  form: LongRentalEntryForm
  setForm: LongRentalFormUpdater
  onClose: () => void
  onOpenRoomSelector: () => void
  onSubmit: () => void
  isSubmitting: boolean
}) {
  const summary = calculateLongRentalSummary(form)
  const room = form.rooms[0] ?? createLongRentalRoom()
  const contractDays = formatContractDuration(room.contractStart, room.contractEnd)
  const totalIncome = summary.firstPayment

  const moveToStepTwo = useCallback(() => {
    const errors = validateLongRentalEntryStep(form)
    if (Object.keys(errors).length > 0) {
      setForm((current) => ({ ...current, errors }))
      return
    }

    setForm((current) => ({
      ...current,
      step: 2,
      errors: {},
      contractDueMode: current.paymentCycle === '一次性付清' ? '分段付' : '月付',
    }))
  }, [form, setForm])

  return (
    <>
      <div className="order-entry-steps order-entry-steps--line" aria-label="长租录入步骤">
        <button type="button" className={form.step === 1 ? 'is-active' : 'is-done'} onClick={() => setForm((current) => ({ ...current, step: 1 }))}>
          <span>1</span>
          <strong>填写订单信息</strong>
        </button>
        <div className="order-entry-steps__line" />
        <button type="button" className={form.step === 2 ? 'is-active' : ''} onClick={moveToStepTwo}>
          <span>2</span>
          <strong>核对账单</strong>
        </button>
      </div>

      {form.step === 1 ? (
        <div className="order-entry-scroll order-entry-scroll--plain">
          <OrderEntrySection title="基本信息" compact>
            <div className="order-entry-basic-grid order-entry-basic-grid--long">
              <label className={`order-entry-inline-field is-required ${form.errors.tenantName ? 'has-error' : ''}`}>
                <span>租客姓名：</span>
                <input
                  type="text"
                  value={form.tenantName}
                  placeholder="请输入租客姓名"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tenantName: event.target.value,
                      errors: { ...current.errors, tenantName: undefined },
                    }))
                  }
                />
                {form.errors.tenantName ? <em>{form.errors.tenantName}</em> : null}
              </label>
              <label className={`order-entry-inline-field is-required ${form.errors.phone ? 'has-error' : ''}`}>
                <span>手机号：</span>
                <input
                  type="text"
                  value={form.phone}
                  placeholder="请输入手机号"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                      errors: { ...current.errors, phone: undefined },
                    }))
                  }
                />
                {form.errors.phone ? <em>{form.errors.phone}</em> : null}
              </label>
              <label className="order-entry-inline-field">
                <span>紧急联系人姓名：</span>
                <input type="text" value={form.emergencyName} placeholder="请输入" onChange={(event) => setForm((current) => ({ ...current, emergencyName: event.target.value }))} />
              </label>
              <label className="order-entry-inline-field">
                <span>紧急联系人电话：</span>
                <input type="text" value={form.emergencyPhone} placeholder="请输入" onChange={(event) => setForm((current) => ({ ...current, emergencyPhone: event.target.value }))} />
              </label>
              <label className="order-entry-inline-field is-required">
                <span>订单来源：</span>
                <select value={form.orderSource} onChange={(event) => setForm((current) => ({ ...current, orderSource: event.target.value }))}>
                  {entryOrderSourceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </OrderEntrySection>

          <OrderEntrySection title="房间信息" compact>
            <div className="order-entry-long-table">
              <div className="order-entry-long-table__head">
                <div>房间/入离日期</div>
                <div>每月租金</div>
                <div>押金</div>
                <div>人数</div>
              </div>
              <div className="order-entry-long-table__row">
                <button type="button" className="order-entry-long-table__picker" onClick={onOpenRoomSelector}>
                  {room.roomLabel || '请选择'}
                </button>
                <label className="order-entry-long-table__input">
                  <span>¥</span>
                  <input type="text" value={room.monthlyRent} onChange={(event) => setForm((current) => ({ ...current, rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, monthlyRent: event.target.value } : item)) }))} />
                </label>
                <label className="order-entry-long-table__input">
                  <span>¥</span>
                  <input type="text" value={room.deposit} onChange={(event) => setForm((current) => ({ ...current, rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, deposit: event.target.value } : item)) }))} />
                </label>
                <input
                  className="order-entry-long-table__people"
                  type="number"
                  min="1"
                  value={room.guests}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, guests: event.target.value } : item)),
                    }))
                  }
                />
              </div>
            </div>
          </OrderEntrySection>

          <OrderEntrySection title="佣金" compact>
            <div className="order-entry-fee-row order-entry-fee-row--single">
              <label className="order-entry-inline-money">
                <span>佣金：</span>
                <div className="order-entry-money-box">
                  <span>￥</span>
                  <input type="text" value={form.commission} onChange={(event) => setForm((current) => ({ ...current, commission: event.target.value }))} />
                </div>
              </label>
            </div>
          </OrderEntrySection>

          <OrderEntrySection title="租赁信息" compact>
            <div className="order-entry-rental-info">
              <div className="order-entry-info-line">
                <span>合同时间：</span>
                <strong>
                  {room.contractStart} 至 {room.contractEnd}
                </strong>
              </div>
              <div className="order-entry-info-line">
                <span>合同期限：</span>
                <strong>{contractDays}</strong>
              </div>
              <div className="order-entry-rental-row">
                <span>缴费方式：</span>
                <div className="order-entry-pill-group">
                  {longRentalPaymentCycles.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={form.paymentCycle === option ? 'is-active' : ''}
                      onClick={() => setForm((current) => ({ ...current, paymentCycle: option }))}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="order-entry-rental-row">
                <span>缴费时间：</span>
                <div className="order-entry-select-pair">
                  <select value={form.paymentMonth} onChange={(event) => setForm((current) => ({ ...current, paymentMonth: event.target.value as LongRentalEntryForm['paymentMonth'] }))}>
                    {longRentalPaymentMonths.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <select value={form.paymentDay} onChange={(event) => setForm((current) => ({ ...current, paymentDay: event.target.value }))}>
                    {longRentalPaymentDays.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="order-entry-rental-row">
                <span>收租提醒：</span>
                <div className="order-entry-select-pair order-entry-select-pair--wide">
                  <select value={form.reminderEnabled} onChange={(event) => setForm((current) => ({ ...current, reminderEnabled: event.target.value as LongRentalEntryForm['reminderEnabled'] }))}>
                    <option value="开启">开启</option>
                    <option value="关闭">关闭</option>
                  </select>
                  <em>开启后 在每月“应收时间”发送提醒</em>
                </div>
              </div>
            </div>
          </OrderEntrySection>

          <OrderEntrySection title="随房付费项目" compact>
            <div className="order-entry-extra-grid">
              <label className="order-entry-inline-addon">
                <span>宽带费：</span>
                <input type="text" value={form.broadband} placeholder="00.00" onChange={(event) => setForm((current) => ({ ...current, broadband: event.target.value }))} />
                <em>元/月</em>
              </label>
              <label className="order-entry-inline-addon">
                <span>公摊费：</span>
                <input type="text" value={form.shared} placeholder="00.00" onChange={(event) => setForm((current) => ({ ...current, shared: event.target.value }))} />
                <em>元/月</em>
              </label>
              <label className="order-entry-inline-addon">
                <span>卫生费：</span>
                <input type="text" value={form.sanitation} placeholder="00.00" onChange={(event) => setForm((current) => ({ ...current, sanitation: event.target.value }))} />
                <em>元/月</em>
              </label>
              <label className="order-entry-inline-addon">
                <span>物业费：</span>
                <input type="text" value={form.property} placeholder="00.00" onChange={(event) => setForm((current) => ({ ...current, property: event.target.value }))} />
                <em>元/月</em>
              </label>
              <label className="order-entry-inline-addon">
                <span>停车费：</span>
                <input type="text" value={form.park} placeholder="00.00" onChange={(event) => setForm((current) => ({ ...current, park: event.target.value }))} />
                <em>元/月</em>
              </label>
            </div>
          </OrderEntrySection>
        </div>
      ) : (
        <div className="order-entry-scroll order-entry-scroll--plain order-entry-scroll--long-bill">
          <div className="order-entry-long-bill-topline">
            <div>
              <span>账单信息</span>
              <strong>
                起止时间: {room.contractStart}至{room.contractEnd}(合同期限{contractDays})
              </strong>
            </div>
            <span>缴费方式: {form.paymentCycle}</span>
          </div>

          <div className="order-entry-long-bill-table" role="table" aria-label="长租核对账单">
            <div role="row" className="order-entry-long-bill-table__head">
              <div role="columnheader">缴费次数</div>
              <div role="columnheader">应收时间</div>
              <div role="columnheader">有效期</div>
              <div role="columnheader">租金</div>
              <div role="columnheader">其他费用</div>
              <div role="columnheader">应收金额</div>
            </div>

            <div role="row" className="order-entry-long-bill-table__row order-entry-long-bill-table__row--deposit">
              <div role="cell">缴纳押金</div>
              <div role="cell">
                <label className="order-entry-long-bill-date">
                  <input
                    type="date"
                    value={room.contractStart}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, contractStart: event.target.value } : item)),
                      }))
                    }
                  />
                </label>
              </div>
              <div role="cell" className="order-entry-long-bill-period">
                <strong>{room.contractStart}</strong>
                <span>至</span>
                <strong>{room.contractEnd}</strong>
              </div>
              <div role="cell">-</div>
              <div role="cell">0项 ¥ 0</div>
              <div role="cell">¥ {formatMoney(summary.deposit)}</div>
            </div>

            <div role="row" className="order-entry-long-bill-table__row">
              <div role="cell">1</div>
              <div role="cell">
                <label className="order-entry-long-bill-date">
                  <input
                    type="date"
                    value={room.contractStart}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, contractStart: event.target.value } : item)),
                      }))
                    }
                  />
                </label>
              </div>
              <div role="cell" className="order-entry-long-bill-period">
                <strong>{room.contractStart}</strong>
                <span>至</span>
                <strong>{room.contractEnd}</strong>
              </div>
              <div role="cell">
                <label className="order-entry-long-bill-money">
                  <span>¥</span>
                  <input
                    type="text"
                    value={room.monthlyRent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        rooms: current.rooms.map((item, index) => (index === 0 ? { ...item, monthlyRent: event.target.value } : item)),
                      }))
                    }
                  />
                </label>
              </div>
              <div role="cell">0项 ¥ 0</div>
              <div role="cell">¥ {formatMoney(summary.monthlyRent + summary.extras)}</div>
            </div>
          </div>

          <div className="order-entry-long-bill-summary">
            <strong>
              总收入 <em>¥ {formatMoney(totalIncome)}</em>
            </strong>
            <span>
              (租金 <em>¥ {formatMoney(summary.monthlyRent)}</em> 其他费用 <em>¥ {formatMoney(summary.extras)}</em>)
            </span>
            <span>
              押金 <em>¥ {formatMoney(summary.deposit)}</em>
            </span>
          </div>
        </div>
      )}

      <footer className="order-entry-footer">
        <div className="order-entry-footer__metrics order-entry-footer__metrics--long" />
        {form.step === 1 ? (
          <>
            <button type="button" className="order-entry-secondary" onClick={onClose}>
              取消
            </button>
            <button type="button" className="order-entry-secondary order-entry-secondary--primary" onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存后结束'}
            </button>
            <button type="button" className="order-entry-submit" onClick={moveToStepTwo}>
              保存后下一步
            </button>
          </>
        ) : (
          <>
            <button type="button" className={`order-entry-secondary ${form.contractDueMode === '月付' ? 'order-entry-secondary--primary' : ''}`} onClick={() => setForm((current) => ({ ...current, contractDueMode: '月付' }))}>
              月付
            </button>
            <button type="button" className={`order-entry-secondary ${form.contractDueMode === '分段付' ? 'order-entry-secondary--primary' : ''}`} onClick={() => setForm((current) => ({ ...current, contractDueMode: '分段付' }))}>
              分段付
            </button>
            <button type="button" className="order-entry-secondary" onClick={() => setForm((current) => ({ ...current, step: 1 }))}>
              返回上一步
            </button>
            <button type="button" className="order-entry-submit" onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '核对后结束'}
            </button>
          </>
        )}
      </footer>
    </>
  )
}

function OrderEntryModalShell({
  title,
  className,
  onClose,
  children,
  footer,
}: {
  title: string
  className?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="order-entry-modal-backdrop" role="presentation" onClick={onClose}>
      <section className={`order-entry-modal ${className ?? ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header className="order-entry-modal__header">
          <h3>{title}</h3>
          <button type="button" aria-label={`关闭${title}`} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="order-entry-modal__body">{children}</div>
        {footer ? <footer className="order-entry-modal__footer">{footer}</footer> : null}
      </section>
    </div>
  )
}

function RoomSelectorModal({
  state,
  onClose,
  onConfirm,
  setState,
}: {
  state: RoomSelectorModalState
  onClose: () => void
  onConfirm: () => void
  setState: (updater: (current: RoomSelectorModalState) => RoomSelectorModalState) => void
}) {
  if (!state.open) return null

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const calendarDays = buildCalendarDays(state.visibleMonth)
  const isHourlyMode = state.mode === 'hourly'
  const rangeStart = state.selectedStart && state.selectedEnd ? (state.selectedStart <= state.selectedEnd ? state.selectedStart : state.selectedEnd) : state.selectedStart
  const rangeEnd = state.selectedStart && state.selectedEnd ? (state.selectedStart <= state.selectedEnd ? state.selectedEnd : state.selectedStart) : state.selectedEnd
  const selectedNights = rangeStart && rangeEnd ? getNightCount(rangeStart, rangeEnd) : 0
  const selectedHourlyDateTime = `${state.selectedStart} ${state.selectedHour}:${state.selectedMinute}`

  const filteredTypes = state.roomOptions.filter((roomType) => {
    const keyword = state.keyword.trim()
    const matchesKeyword =
      !keyword ||
      roomType.roomCategoryName.includes(keyword) ||
      roomType.rooms.some((room) => room.roomName.includes(keyword))
    return matchesKeyword
  })

  return (
    <OrderEntryModalShell
      title="选择日期房间"
      className="order-entry-modal--room-selector"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="order-entry-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="order-entry-submit" onClick={onConfirm}>
            确定
          </button>
        </>
      }
    >
      <div className="room-selector-modal">
        <div className="room-selector-modal__calendar">
          <div className="room-selector-calendar">
            <div className="room-selector-calendar__header">
              <button type="button" onClick={() => setState((current) => ({ ...current, visibleMonth: shiftMonth(current.visibleMonth, -1) }))}>
                {'<'}
              </button>
              <strong>{formatMonthLabel(state.visibleMonth)}</strong>
              <button type="button" onClick={() => setState((current) => ({ ...current, visibleMonth: shiftMonth(current.visibleMonth, 1) }))}>
                {'>'}
              </button>
            </div>
            <div className="room-selector-calendar__weekdays">
              {days.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div className="room-selector-calendar__grid">
              {calendarDays.map((item) => {
                const isSelected = item.key === state.selectedStart || item.key === state.selectedEnd
                const isInRange = Boolean(rangeStart && rangeEnd && item.key > rangeStart && item.key < rangeEnd)
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`${isSelected ? 'is-selected' : ''} ${isInRange ? 'is-in-range' : ''} ${item.isCurrentMonth ? '' : 'is-muted'}`}
                    onClick={() =>
                      setState((current) => {
                        if (current.mode === 'hourly') {
                          return {
                            ...current,
                            selectedStart: item.key,
                            selectedEnd: item.key,
                            selectingEnd: false,
                          }
                        }

                        if (!current.selectedStart || !current.selectingEnd) {
                          return {
                            ...current,
                            selectedStart: item.key,
                            selectedEnd: '',
                            selectingEnd: true,
                          }
                        }

                        if (item.key === current.selectedStart) {
                          return {
                            ...current,
                            selectedEnd: item.key,
                            selectingEnd: false,
                          }
                        }

                        return {
                          ...current,
                          selectedEnd: item.key,
                          selectingEnd: false,
                        }
                      })
                    }
                  >
                    {item.day}
                  </button>
                )
              })}
            </div>
          </div>
          {isHourlyMode ? (
            <div className="room-selector-time-panel">
              <div className="room-selector-time-panel__columns">
                <div className="room-selector-time-column">
                  {hourlyRoomHours.map((hour) => (
                    <button
                      key={hour}
                      type="button"
                      className={hour === state.selectedHour ? 'is-active' : ''}
                      onClick={() => setState((current) => ({ ...current, selectedHour: hour }))}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
                <div className="room-selector-time-column">
                  {hourlyRoomMinutes.map((minute) => (
                    <button
                      key={minute}
                      type="button"
                      className={minute === state.selectedMinute ? 'is-active' : ''}
                      onClick={() => setState((current) => ({ ...current, selectedMinute: minute }))}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="room-selector-time-panel__now"
                onClick={() => {
                  const now = new Date()
                  const year = now.getFullYear()
                  const month = String(now.getMonth() + 1).padStart(2, '0')
                  const day = String(now.getDate()).padStart(2, '0')
                  const hour = String(now.getHours()).padStart(2, '0')
                  const minute = String(now.getMinutes()).padStart(2, '0')
                  setState((current) => ({
                    ...current,
                    visibleMonth: `${year}-${month}`,
                    selectedStart: `${year}-${month}-${day}`,
                    selectedEnd: `${year}-${month}-${day}`,
                    selectedHour: hour,
                    selectedMinute: minute,
                    selectingEnd: false,
                  }))
                }}
              >
                此刻
              </button>
            </div>
          ) : null}
          <div className="room-selector-modal__summary">
            {isHourlyMode
              ? `入住时间：${selectedHourlyDateTime}`
              : `已选 ${formatMonthDayRange(rangeStart || state.selectedStart, rangeEnd || state.selectedEnd)} 共${selectedNights}晚`}
          </div>
        </div>

        <div className="room-selector-modal__content">
          <div className="room-selector-modal__toolbar">
            <input
              type="text"
              value={state.keyword}
              placeholder="输入房间/房型名称"
              onChange={(event) => setState((current) => ({ ...current, keyword: event.target.value }))}
            />
          </div>
          <div className="room-selector-modal__tree">
            {state.isLoading ? <div className="room-selector-modal__status">正在加载可选房型房间...</div> : null}
            {state.error ? <div className="room-selector-modal__status is-error">{state.error}</div> : null}
            {!state.isLoading && !state.error && filteredTypes.length === 0 ? (
              <div className="room-selector-modal__status">暂无可选房型房间</div>
            ) : null}
            {!state.isLoading && !state.error ? filteredTypes.map((roomType) => {
              const expanded = state.expandedRoomTypes.includes(roomType.roomCategoryId)
              return (
                <div key={roomType.roomCategoryId} className="room-selector-tree__group">
                  <button
                    type="button"
                    className="room-selector-tree__group-header"
                    onClick={() =>
                      setState((current) => ({
                        ...current,
                        expandedRoomTypes: expanded
                          ? current.expandedRoomTypes.filter((item) => item !== roomType.roomCategoryId)
                          : [...current.expandedRoomTypes, roomType.roomCategoryId],
                      }))
                    }
                  >
                    <span>{roomType.roomCategoryName}</span>
                    <span>{expanded ? '▼' : '▶'}</span>
                  </button>
                  {expanded ? (
                    <div className="room-selector-tree__children">
                      {roomType.rooms.map((room) => {
                        const id = roomSelectionKey(roomType.roomCategoryId, room.roomId)
                        const checked = state.selectedRooms.includes(id)
                        return (
                          <label key={id}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                setState((current) => ({
                                  ...current,
                                  error: '',
                                  selectedRooms: event.target.checked ? [id] : current.selectedRooms.filter((item) => item !== id),
                                }))
                              }
                            />
                            <span>{room.roomName}</span>
                          </label>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            }) : null}
          </div>
        </div>
      </div>
    </OrderEntryModalShell>
  )
}

function ReminderModal({
  state,
  onClose,
  onConfirm,
  setState,
}: {
  state: ReminderModalState
  onClose: () => void
  onConfirm: () => void
  setState: (updater: (current: ReminderModalState) => ReminderModalState) => void
}) {
  if (!state.open) return null

  return (
    <OrderEntryModalShell
      title="添加订单提醒"
      className="order-entry-modal--reminder"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="order-entry-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="order-entry-submit" onClick={onConfirm}>
            确定
          </button>
        </>
      }
    >
      <div className="order-entry-form-stack">
        <label className="order-entry-inline-field">
          <span>提醒时间：</span>
          <input type="text" value={state.date} placeholder="请选择日期" onChange={(event) => setState((current) => ({ ...current, date: event.target.value }))} />
        </label>
        <label className="order-entry-form-stack__textarea">
          <span>提醒内容：</span>
          <textarea value={state.content} placeholder="请输入提醒内容" onChange={(event) => setState((current) => ({ ...current, content: event.target.value }))} />
        </label>
      </div>
    </OrderEntryModalShell>
  )
}

function TagSelectorModal({
  state,
  onClose,
  onConfirm,
  setState,
}: {
  state: TagSelectorModalState
  onClose: () => void
  onConfirm: () => void
  setState: (updater: (current: TagSelectorModalState) => TagSelectorModalState) => void
}) {
  if (!state.open) return null

  return (
    <OrderEntryModalShell
      title="选择标签"
      className="order-entry-modal--tags"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="order-entry-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="order-entry-submit" onClick={onConfirm}>
            确定
          </button>
        </>
      }
    >
      <div className="tag-selector-modal">
        <div className="tag-selector-modal__toolbar">
          <input
            type="text"
            value={state.keyword}
            placeholder="搜索"
            onChange={(event) => setState((current) => ({ ...current, keyword: event.target.value }))}
          />
          <button type="button" className="order-entry-link order-entry-link--create">
            +创建标签
          </button>
        </div>
        <div className="tag-selector-modal__section-title">订单标签</div>
        <div className="tag-selector-modal__tree">
          {orderTagGroups.map((group) => {
            const expanded = state.expandedGroups.includes(group.id)
            return (
              <div key={group.id} className="tag-selector-tree__group">
                <button
                  type="button"
                  className="tag-selector-tree__group-header"
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      expandedGroups: expanded ? current.expandedGroups.filter((item) => item !== group.id) : [...current.expandedGroups, group.id],
                    }))
                  }
                >
                  <span>{expanded ? '▼' : '▶'}</span>
                  <label>
                    <input type="checkbox" readOnly checked={group.tags.every((tag) => state.selectedTagIds.includes(tag.id))} />
                    <span>{group.label}</span>
                  </label>
                </button>
                {expanded ? (
                  <div className="tag-selector-tree__children">
                    {group.tags
                      .filter((tag) => !state.keyword.trim() || tag.label.includes(state.keyword.trim()))
                      .map((tag) => (
                        <label key={tag.id}>
                          <input
                            type="checkbox"
                            checked={state.selectedTagIds.includes(tag.id)}
                            onChange={(event) =>
                              setState((current) => ({
                                ...current,
                                selectedTagIds: event.target.checked
                                  ? [...current.selectedTagIds, tag.id]
                                  : current.selectedTagIds.filter((item) => item !== tag.id),
                              }))
                            }
                          />
                          <span>{tag.label}</span>
                        </label>
                      ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </OrderEntryModalShell>
  )
}

function OrderEntryDrawer({
  isOpen,
  orderType,
  fullDayForm,
  hourlyForm,
  longRentalForm,
  roomSelectorModal,
  reminderModal,
  tagSelectorModal,
  onClose,
  onTypeChange,
  setFullDayForm,
  setHourlyForm,
  setLongRentalForm,
  setRoomSelectorModal,
  setReminderModal,
  setTagSelectorModal,
  onCreated,
  setActionMessage,
  isSubmitting,
  setIsSubmitting,
}: {
  isOpen: boolean
  orderType: EntryOrderType
  fullDayForm: EntryStayForm
  hourlyForm: EntryStayForm
  longRentalForm: LongRentalEntryForm
  roomSelectorModal: RoomSelectorModalState
  reminderModal: ReminderModalState
  tagSelectorModal: TagSelectorModalState
  onClose: () => void
  onTypeChange: (type: EntryOrderType) => void
  setFullDayForm: StayFormUpdater
  setHourlyForm: StayFormUpdater
  setLongRentalForm: LongRentalFormUpdater
  setRoomSelectorModal: (updater: (current: RoomSelectorModalState) => RoomSelectorModalState) => void
  setReminderModal: (updater: (current: ReminderModalState) => ReminderModalState) => void
  setTagSelectorModal: (updater: (current: TagSelectorModalState) => TagSelectorModalState) => void
  onCreated: () => void
  setActionMessage: (message: string) => void
  isSubmitting: boolean
  setIsSubmitting: (value: boolean) => void
}) {
  if (!isOpen) return null

  const campId = resolveHouseOrderCampId()

  const handleStaySubmit = async (type: EntryStayKind) => {
    const form = type === 'hourly' ? hourlyForm : fullDayForm
    const validatedForm = validateStayForm(form)
    if (stayFormHasErrors(validatedForm)) {
      if (type === 'hourly') {
        setHourlyForm(() => validatedForm)
      } else {
        setFullDayForm(() => validatedForm)
      }
      setActionMessage('请先修正红色提示的输入内容')
      return
    }

    setIsSubmitting(true)
    try {
      await createOrder(buildStayOrderPayload(type, validatedForm, campId))
      if (type === 'hourly') {
        setHourlyForm(() => createStayForm('hourly'))
      } else {
        setFullDayForm(() => createStayForm())
      }
      setActionMessage('订单创建成功')
      onCreated()
      onClose()
    } catch (error) {
      setActionMessage(`订单创建失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLongRentalSubmit = async () => {
    const errors = validateLongRentalEntryStep(longRentalForm)
    if (Object.keys(errors).length > 0) {
      setLongRentalForm((current) => ({ ...current, errors }))
      return
    }

    setIsSubmitting(true)
    try {
      await createOrder(buildLongRentalOrderPayload(longRentalForm, campId))
      setLongRentalForm(() => createLongRentalEntryForm())
      setActionMessage('长租订单创建成功')
      onCreated()
      onClose()
    } catch (error) {
      setActionMessage(`长租订单创建失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="order-detail-backdrop" role="presentation" onClick={onClose}>
        <section
          className="order-entry-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="录入订单"
          onClick={(event) => event.stopPropagation()}
        >
          <header className="order-entry-drawer__header">
            <h2>录入订单</h2>
            <button type="button" aria-label="关闭录入订单" onClick={onClose}>
              ×
            </button>
          </header>

          <nav className="order-entry-tabs" aria-label="订单类型">
            <button type="button" className={orderType === 'fullDay' ? 'is-active' : ''} onClick={() => onTypeChange('fullDay')}>
              全日房
            </button>
            <button type="button" className={orderType === 'hourly' ? 'is-active' : ''} onClick={() => onTypeChange('hourly')}>
              钟点房
            </button>
            <button type="button" className={orderType === 'longRental' ? 'is-active' : ''} onClick={() => onTypeChange('longRental')}>
              长租房
            </button>
          </nav>

          {orderType === 'fullDay' ? (
            <StayOrderForm
              type="fullDay"
              form={fullDayForm}
              setForm={setFullDayForm}
              onOpenRoomSelector={() => setRoomSelectorModal((current) => ({ ...current, open: true, mode: 'fullDay' }))}
              onOpenReminder={() => setReminderModal((current) => ({ ...current, open: true }))}
              onOpenTags={() => setTagSelectorModal((current) => ({ ...current, open: true }))}
              onSubmit={() => void handleStaySubmit('fullDay')}
              isSubmitting={isSubmitting}
            />
          ) : null}
          {orderType === 'hourly' ? (
            <StayOrderForm
              type="hourly"
              form={hourlyForm}
              setForm={setHourlyForm}
              onOpenRoomSelector={() => setRoomSelectorModal((current) => applyHourlyRoomToSelectorState(current, hourlyForm.rooms[0] ?? createHourlyStayRoom()))}
              onOpenReminder={() => setReminderModal((current) => ({ ...current, open: true }))}
              onOpenTags={() => setTagSelectorModal((current) => ({ ...current, open: true }))}
              onSubmit={() => void handleStaySubmit('hourly')}
              isSubmitting={isSubmitting}
            />
          ) : null}
          {orderType === 'longRental' ? (
            <LongRentalOrderForm
              form={longRentalForm}
              setForm={setLongRentalForm}
              onClose={onClose}
              onOpenRoomSelector={() => setRoomSelectorModal((current) => ({ ...current, open: true, mode: 'longRental' }))}
              onSubmit={() => void handleLongRentalSubmit()}
              isSubmitting={isSubmitting}
            />
          ) : null}
        </section>
      </div>
      <RoomSelectorModal
        state={roomSelectorModal}
        onClose={() => setRoomSelectorModal((current) => ({ ...current, open: false }))}
        onConfirm={() => {
          const selection = findRoomSelection(roomSelectorModal.roomOptions, roomSelectorModal.selectedRooms[0] ?? '')
          const { start, end } = resolveRoomSelectorRange(roomSelectorModal)
          const nextDateRange = orderType === 'hourly'
            ? `${start.replace(/-/g, '.')} ${roomSelectorModal.selectedHour}:${roomSelectorModal.selectedMinute}`
            : toDisplayDateRange(start, end)

          if (!selection) {
            setRoomSelectorModal((current) => ({ ...current, error: '请选择可用房间' }))
            return
          }

          if (orderType === 'hourly') {
            setHourlyForm((current) => ({
              ...current,
              rooms: current.rooms.map((room, index) =>
                index === 0
                  ? applySelectionToStayRoom(room, selection, nextDateRange)
                  : room,
              ),
            }))
          } else if (orderType === 'longRental') {
            setLongRentalForm((current) => ({
              ...current,
              rooms: current.rooms.map((room, index) =>
                index === 0
                  ? applySelectionToLongRentalRoom(room, selection, start, end)
                  : room,
              ),
            }))
          } else {
            setFullDayForm((current) => ({
              ...current,
              rooms: current.rooms.map((room, index) =>
                index === 0
                  ? applySelectionToStayRoom(room, selection, nextDateRange)
                  : room,
              ),
            }))
          }

          setRoomSelectorModal((current) => ({ ...current, open: false }))
        }}
        setState={setRoomSelectorModal}
      />
      <ReminderModal
        state={reminderModal}
        onClose={() => setReminderModal((current) => ({ ...current, open: false }))}
        onConfirm={() => {
          const text = [reminderModal.date, reminderModal.content].filter(Boolean).join(' ')
          if (text) {
            const nextItem = { id: nextOrderEntryId('reminder'), text }
            if (orderType === 'hourly') {
              setHourlyForm((current) => ({ ...current, reminders: [...current.reminders, nextItem] }))
            } else if (orderType === 'fullDay') {
              setFullDayForm((current) => ({ ...current, reminders: [...current.reminders, nextItem] }))
            }
          }
          setReminderModal(() => createReminderModalState())
        }}
        setState={setReminderModal}
      />
      <TagSelectorModal
        state={tagSelectorModal}
        onClose={() => setTagSelectorModal((current) => ({ ...current, open: false }))}
        onConfirm={() => {
          const selectedTags = orderTagGroups
            .flatMap((group) => group.tags)
            .filter((tag) => tagSelectorModal.selectedTagIds.includes(tag.id))
            .map((tag) => ({ id: tag.id, text: tag.label }))
          if (orderType === 'hourly') {
            setHourlyForm((current) => ({ ...current, tags: selectedTags }))
          } else if (orderType === 'fullDay') {
            setFullDayForm((current) => ({ ...current, tags: selectedTags }))
          }
          setTagSelectorModal(() => createTagSelectorModalState())
        }}
        setState={setTagSelectorModal}
      />
    </>
  )
}

export function OrderEntryDrawerHost({
  isOpen,
  initialRoom,
  onClose,
  onCreated,
  onActionMessage,
}: {
  isOpen: boolean
  initialRoom?: OrderEntryInitialRoom | null
  onClose: () => void
  onCreated?: () => void
  onActionMessage?: (message: string) => void
}) {
  const [entryOrderType, setEntryOrderType] = useState<EntryOrderType>('fullDay')
  const [fullDayForm, setFullDayFormState] = useState<EntryStayForm>(() => createStayFormWithInitialRoom(initialRoom ?? undefined))
  const [hourlyForm, setHourlyFormState] = useState<EntryStayForm>(() => createStayFormWithInitialRoom(initialRoom ?? undefined, 'hourly'))
  const [longRentalForm, setLongRentalFormState] = useState<LongRentalEntryForm>(() => createLongRentalEntryForm(initialRoom ?? undefined))
  const [roomSelectorModal, setRoomSelectorModalState] = useState<RoomSelectorModalState>(() => createRoomSelectorModalState(initialRoom ?? undefined))
  const [reminderModal, setReminderModalState] = useState<ReminderModalState>(() => createReminderModalState())
  const [tagSelectorModal, setTagSelectorModalState] = useState<TagSelectorModalState>(() => createTagSelectorModalState())
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setEntryOrderType('fullDay')
    setFullDayFormState(createStayFormWithInitialRoom(initialRoom ?? undefined))
    setHourlyFormState(createStayFormWithInitialRoom(initialRoom ?? undefined, 'hourly'))
    setLongRentalFormState(createLongRentalEntryForm(initialRoom ?? undefined))
    setRoomSelectorModalState(createRoomSelectorModalState(initialRoom ?? undefined))
    setReminderModalState(createReminderModalState())
    setTagSelectorModalState(createTagSelectorModalState())
    setIsSubmittingOrder(false)
  }, [initialRoom, isOpen])

  useEffect(() => {
    if (!roomSelectorModal.open) return

    const controller = new AbortController()
    setRoomSelectorModalState((current) => ({
      ...current,
      isLoading: true,
      error: '',
    }))

    async function loadRoomOptions() {
      try {
        const options = await fetchOrderRoomSelectorOptions(
          buildRoomSelectorQuery(roomSelectorModal, resolveHouseOrderCampId()),
          controller.signal,
        )
        if (controller.signal.aborted) return
        const validSelectionKeys = new Set(
          options.flatMap((group) => group.rooms.map((room) => roomSelectionKey(group.roomCategoryId, room.roomId))),
        )
        setRoomSelectorModalState((current) => ({
          ...current,
          roomOptions: options,
          expandedRoomTypes: options.map((item) => item.roomCategoryId),
          selectedRooms: current.selectedRooms.filter((item) => validSelectionKeys.has(item)),
          isLoading: false,
          error: '',
        }))
      } catch (requestError) {
        if (controller.signal.aborted) return
        setRoomSelectorModalState((current) => ({
          ...current,
          roomOptions: [],
          expandedRoomTypes: [],
          selectedRooms: [],
          isLoading: false,
          error: `房型房间加载失败：${requestError instanceof Error ? requestError.message : String(requestError)}`,
        }))
      }
    }

    void loadRoomOptions()
    return () => controller.abort()
  }, [
    roomSelectorModal.open,
    roomSelectorModal.mode,
    roomSelectorModal.selectedStart,
    roomSelectorModal.selectedEnd,
    roomSelectorModal.selectedHour,
    roomSelectorModal.selectedMinute,
    roomSelectorModal.keyword,
  ])

  const setFullDayForm = useCallback<StayFormUpdater>((updater) => {
    setFullDayFormState((current) => updater(current))
  }, [])

  const setHourlyForm = useCallback<StayFormUpdater>((updater) => {
    setHourlyFormState((current) => updater(current))
  }, [])

  const setLongRentalForm = useCallback<LongRentalFormUpdater>((updater) => {
    setLongRentalFormState((current) => updater(current))
  }, [])

  const setRoomSelectorModal = useCallback((updater: (current: RoomSelectorModalState) => RoomSelectorModalState) => {
    setRoomSelectorModalState((current) => updater(current))
  }, [])

  const setReminderModal = useCallback((updater: (current: ReminderModalState) => ReminderModalState) => {
    setReminderModalState((current) => updater(current))
  }, [])

  const setTagSelectorModal = useCallback((updater: (current: TagSelectorModalState) => TagSelectorModalState) => {
    setTagSelectorModalState((current) => updater(current))
  }, [])

  const closeEntryDrawer = useCallback(() => {
    setEntryOrderType('fullDay')
    setFullDayFormState(createStayFormWithInitialRoom(initialRoom ?? undefined))
    setHourlyFormState(createStayFormWithInitialRoom(initialRoom ?? undefined, 'hourly'))
    setLongRentalFormState(createLongRentalEntryForm(initialRoom ?? undefined))
    setRoomSelectorModalState(createRoomSelectorModalState(initialRoom ?? undefined))
    setReminderModalState(createReminderModalState())
    setTagSelectorModalState(createTagSelectorModalState())
    setIsSubmittingOrder(false)
    onClose()
  }, [initialRoom, onClose])

  return (
    <OrderEntryDrawer
      isOpen={isOpen}
      orderType={entryOrderType}
      fullDayForm={fullDayForm}
      hourlyForm={hourlyForm}
      longRentalForm={longRentalForm}
      roomSelectorModal={roomSelectorModal}
      reminderModal={reminderModal}
      tagSelectorModal={tagSelectorModal}
      onClose={closeEntryDrawer}
      onTypeChange={setEntryOrderType}
      setFullDayForm={setFullDayForm}
      setHourlyForm={setHourlyForm}
      setLongRentalForm={setLongRentalForm}
      setRoomSelectorModal={setRoomSelectorModal}
      setReminderModal={setReminderModal}
      setTagSelectorModal={setTagSelectorModal}
      onCreated={() => {
        onCreated?.()
      }}
      setActionMessage={(message) => onActionMessage?.(message)}
      isSubmitting={isSubmittingOrder}
      setIsSubmitting={setIsSubmittingOrder}
    />
  )
}

const orderTypeByFilter: Record<string, string> = {
  全部: '',
  今日新单: '1',
  今日预抵: '11',
  今日在住: '10',
  今日预离: '12',
  明日入住: '4',
  明日退房: '5',
  待接单: '6',
  待退款: '7',
  异常订单: '8',
}

function HouseOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [columnsExpanded, setColumnsExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [isEntryDrawerOpen, setIsEntryDrawerOpen] = useState(false)
  const [entryOrderType, setEntryOrderType] = useState<EntryOrderType>('fullDay')
  const [fullDayForm, setFullDayFormState] = useState<EntryStayForm>(() => createStayForm())
  const [hourlyForm, setHourlyFormState] = useState<EntryStayForm>(() => createStayForm('hourly'))
  const [longRentalForm, setLongRentalFormState] = useState<LongRentalEntryForm>(() => createLongRentalEntryForm())
  const [roomSelectorModal, setRoomSelectorModalState] = useState<RoomSelectorModalState>(() => createRoomSelectorModalState())
  const [reminderModal, setReminderModalState] = useState<ReminderModalState>(() => createReminderModalState())
  const [tagSelectorModal, setTagSelectorModalState] = useState<TagSelectorModalState>(() => createTagSelectorModalState())
  const [data, setData] = useState<HouseOrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestRevision, setRequestRevision] = useState(0)
  const [actionMessage, setActionMessage] = useState('')
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)

  const orderType = orderTypeByFilter[activeFilter] ?? ''

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      setIsLoading(true)
      setError('')
      try {
        const campId = resolveHouseOrderCampId()
        const nextData = await fetchHouseOrders(
          {
            campId,
            pageNum: 1,
            pageSize: 20,
            orderType,
            keyword: keyword.trim(),
          },
          controller.signal,
        )
        if (controller.signal.aborted) return
        setData(nextData)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setData(null)
        setError(`数据服务请求失败：${requestError instanceof Error ? requestError.message : String(requestError)}`)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [keyword, orderType, requestRevision])

  useEffect(() => {
    if (!roomSelectorModal.open) return

    const controller = new AbortController()
    setRoomSelectorModalState((current) => ({
      ...current,
      isLoading: true,
      error: '',
    }))

    async function loadRoomOptions() {
      try {
        const options = await fetchOrderRoomSelectorOptions(
          buildRoomSelectorQuery(roomSelectorModal, resolveHouseOrderCampId()),
          controller.signal,
        )
        if (controller.signal.aborted) return
        const validSelectionKeys = new Set(
          options.flatMap((group) => group.rooms.map((room) => roomSelectionKey(group.roomCategoryId, room.roomId))),
        )
        setRoomSelectorModalState((current) => ({
          ...current,
          roomOptions: options,
          expandedRoomTypes: options.map((item) => item.roomCategoryId),
          selectedRooms: current.selectedRooms.filter((item) => validSelectionKeys.has(item)),
          isLoading: false,
          error: '',
        }))
      } catch (requestError) {
        if (controller.signal.aborted) return
        setRoomSelectorModalState((current) => ({
          ...current,
          roomOptions: [],
          expandedRoomTypes: [],
          selectedRooms: [],
          isLoading: false,
          error: `房型房间加载失败：${requestError instanceof Error ? requestError.message : String(requestError)}`,
        }))
      }
    }

    void loadRoomOptions()
    return () => controller.abort()
  }, [
    roomSelectorModal.open,
    roomSelectorModal.mode,
    roomSelectorModal.selectedStart,
    roomSelectorModal.selectedEnd,
    roomSelectorModal.selectedHour,
    roomSelectorModal.selectedMinute,
    roomSelectorModal.keyword,
  ])

  const filteredOrders = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    const rows = data?.rows ?? []
    if (!trimmedKeyword) return rows

    return rows.filter((order) =>
      [
        order.orderNo,
        order.channelOrderNo,
        order.room,
        order.roomType,
        order.contact,
        order.phone,
        order.channel,
        order.store,
      ]
        .join(' ')
        .toLowerCase()
        .includes(trimmedKeyword),
    )
  }, [data?.rows, keyword])

  const handleReset = useCallback(() => {
    setKeyword('')
    setActiveFilter('全部')
    setFiltersExpanded(false)
    setColumnsExpanded(false)
    setActionMessage('筛选条件已重置，正在重新请求住宿订单。')
    setRequestRevision((value) => value + 1)
  }, [])

  const handleBlockedAction = useCallback((label: string) => {
    const actionMessages: Record<string, string> = {
      导出明细: '导出明细任务已创建，范围为当前筛选结果。',
      录入订单: '录入订单面板已准备，可继续补充联系人、房型与入住时间。',
      排房: '排房面板已准备，可按当前订单选择可用房间。',
      登记入住人: '入住人登记面板已准备，可补充证件与联系方式。',
      更多操作: '更多操作菜单已展开，可选择订单改期、备注或标签维护。',
      收款: '收款面板已准备，可选择支付方式并核对待收金额。',
      续住: '续住面板已准备，可选择新的离店日期。',
      入住: '入住确认已打开，请核对房间与入住人信息。',
      退房: '退房确认已打开，请核对消费、押金与欠款。',
    }
    setActionMessage(actionMessages[label] ?? `${label}操作已响应，请在订单详情中继续处理。`)
  }, [])

  const handleOrderCancelled = useCallback((orderNo: string, message: string) => {
    setData((current) => {
      if (!current) return current
      return {
        ...current,
        rows: current.rows.map((row) =>
          row.orderNo === orderNo
            ? {
                ...row,
                status: '已取消',
                liveStatus: '已取消',
              }
            : row,
        ),
      }
    })
    setSelectedOrder((current) =>
      current?.orderNo === orderNo
        ? {
            ...current,
            status: '已取消',
            liveStatus: '已取消',
          }
        : current,
    )
    setActionMessage(message)
    setRequestRevision((value) => value + 1)
  }, [])

  const handleOrderSkippedStock = useCallback((orderNo: string, message: string) => {
    setData((current) => {
      if (!current) return current
      return {
        ...current,
        rows: current.rows.map((row) =>
          row.orderNo === orderNo
            ? {
                ...row,
                room: '-',
                stockFlag: '',
                roomFlag: '未排房',
                needsRoomAssignment: true,
              }
            : row,
        ),
      }
    })
    setSelectedOrder((current) =>
      current?.orderNo === orderNo
        ? {
            ...current,
            room: '-',
            stockFlag: '',
            roomFlag: '未排房',
            needsRoomAssignment: true,
          }
        : current,
    )
    setActionMessage(message)
    setRequestRevision((value) => value + 1)
  }, [])

  const setFullDayForm = useCallback<StayFormUpdater>((updater) => {
    setFullDayFormState((current) => updater(current))
  }, [])

  const setHourlyForm = useCallback<StayFormUpdater>((updater) => {
    setHourlyFormState((current) => updater(current))
  }, [])

  const setLongRentalForm = useCallback<LongRentalFormUpdater>((updater) => {
    setLongRentalFormState((current) => updater(current))
  }, [])

  const setRoomSelectorModal = useCallback((updater: (current: RoomSelectorModalState) => RoomSelectorModalState) => {
    setRoomSelectorModalState((current) => updater(current))
  }, [])

  const setReminderModal = useCallback((updater: (current: ReminderModalState) => ReminderModalState) => {
    setReminderModalState((current) => updater(current))
  }, [])

  const setTagSelectorModal = useCallback((updater: (current: TagSelectorModalState) => TagSelectorModalState) => {
    setTagSelectorModalState((current) => updater(current))
  }, [])

  const openEntryDrawer = useCallback((type: EntryOrderType = 'fullDay') => {
    setEntryOrderType(type)
    setIsEntryDrawerOpen(true)
    setActionMessage(`已打开${type === 'fullDay' ? '全日房' : type === 'hourly' ? '钟点房' : '长租房'}录入面板。`)
  }, [])

  const closeEntryDrawer = useCallback(() => {
    setIsEntryDrawerOpen(false)
    setEntryOrderType('fullDay')
    setFullDayFormState(createStayForm())
    setHourlyFormState(createStayForm('hourly'))
    setLongRentalFormState(createLongRentalEntryForm())
    setRoomSelectorModalState(createRoomSelectorModalState())
    setReminderModalState(createReminderModalState())
    setTagSelectorModalState(createTagSelectorModalState())
    setIsSubmittingOrder(false)
  }, [])

  const requestText = data
    ? `已通过住宿订单数据服务刷新：${data.requestPaths.join('、')}，共 ${data.total} 条`
    : isLoading
      ? '正在请求住宿订单数据服务'
      : '等待住宿订单请求结果'
  const visibleColumns = useMemo(() => resolveVisibleColumns(houseBaseColumns, columnsExpanded), [columnsExpanded])
  const tableClassName = `order-table order-table--house ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`

  return (
    <div className="page-stack order-page">
      <h1>住宿订单</h1>
      <section className="order-filter-panel" aria-label="住宿订单筛选">
        <div className="order-filter-tabs" role="radiogroup" aria-label="订单快捷筛选">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              role="radio"
              aria-checked={activeFilter === filter}
              className={activeFilter === filter ? 'is-active' : ''}
              disabled={isLoading}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="order-filter-row">
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入订单号/渠道订单号/房间号/姓名/手机号"
            aria-label="住宿订单关键词"
          />
          <div className="order-filter-actions">
            <button
              type="button"
              className="order-link-action"
              data-testid="order-filter-toggle"
              onClick={() => setFiltersExpanded((value) => !value)}
            >
              {filtersExpanded ? '收起' : '展开'}
            </button>
            <button type="button" className="order-outline-action" onClick={handleReset} disabled={isLoading}>
              重置筛选
            </button>
            <button type="button" className="order-primary-action" onClick={() => handleBlockedAction('导出明细')}>
              导出明细
            </button>
            <button type="button" className="order-primary-action" onClick={() => openEntryDrawer('fullDay')}>
              录入订单
            </button>
          </div>
        </div>

        {filtersExpanded ? (
          <div className="order-advanced-filters">
            <label>
              <span>订单状态</span>
              <select defaultValue="" onChange={() => handleBlockedAction('订单状态筛选')}>
                <option value="">全部</option>
                <option>进行中</option>
                <option>已预订</option>
                <option>已完成</option>
                <option>已取消</option>
              </select>
            </label>
            <label>
              <span>渠道</span>
              <select defaultValue="" onChange={() => handleBlockedAction('渠道筛选')}>
                <option value="">全部渠道</option>
                <option>携程</option>
                <option>路客云聚合</option>
                <option>飞猪淘酒店</option>
                <option>途家</option>
              </select>
            </label>
            <label>
              <span>入住日期</span>
              <input type="text" placeholder="开始日期 - 结束日期" onFocus={() => handleBlockedAction('入住日期筛选')} />
            </label>
            <label>
              <span>离开日期</span>
              <input type="text" placeholder="开始日期 - 结束日期" onFocus={() => handleBlockedAction('离开日期筛选')} />
            </label>
          </div>
        ) : null}

        <div className="order-request-status" role="status" aria-label="住宿订单请求状态">
          {requestText}
        </div>
        {actionMessage ? (
          <div className="order-action-feedback" role="status" aria-label="住宿订单操作反馈">
            {actionMessage}
          </div>
        ) : null}
        {error ? (
          <div className="order-request-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setRequestRevision((value) => value + 1)}>
              重试
            </button>
          </div>
        ) : null}
      </section>

      <section className="order-table-card" aria-busy={isLoading}>
        <div className="order-table-scroll">
          <div className={tableClassName} role="table" aria-label="住宿订单列表">
            <div className="order-table__head" role="row">
              {visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value)))}
            </div>
            {isLoading ? (
              <div className="order-table__empty" role="row">
                <div role="cell">正在加载住宿订单...</div>
              </div>
            ) : null}
            {!isLoading && !error
              ? filteredOrders.map((order) => (
                  <div key={order.orderNo} className="order-table__row" role="row">
                    <div role="cell" className="order-no">
                      {order.orderNo}
                    </div>
                    <div role="cell">{order.channel}</div>
                    <div role="cell">
                      <span className={`order-status ${statusTone(order.status)}`}>{order.status}</span>
                    </div>
                    <div role="cell">{order.contact}</div>
                    <div role="cell">{order.phone}</div>
                    <div role="cell">{order.stayType}</div>
                    <div role="cell" className="order-room-type">
                      {order.roomType}
                    </div>
                    <div role="cell" className={order.needsRoomAssignment ? 'needs-room' : undefined}>
                      {order.needsRoomAssignment ? (
                        <>
                          <span>{order.room}</span>
                          <em>未排房</em>
                        </>
                      ) : (
                        order.room
                      )}
                    </div>
                    <div role="cell">{order.store}</div>
                    <div role="cell">{order.checkInAt}</div>
                    <div role="cell">{order.leaveAt}</div>
                    <div role="cell">
                      <span className={`order-status ${statusTone(order.liveStatus)}`}>{order.liveStatus}</span>
                    </div>
                    <div role="cell">{order.afterSaleStatus}</div>
                    <div role="cell">{order.roomRevenueNet}</div>
                    <div role="cell">{order.otherExpense}</div>
                    <div role="cell">{order.roomRevenueGross}</div>
                    <div role="cell">{order.totalRevenue}</div>
                    <div role="cell">{order.debt}</div>
                    <div role="cell">{order.bookedAt}</div>
                    <div role="cell">{order.channelOrderNo}</div>
                    <div role="cell" className="order-action-cell order-action-cell--edge">
                      {order.needsRoomAssignment ? (
                        <button type="button" onClick={() => handleBlockedAction('排房')}>
                          排房
                        </button>
                      ) : null}
                      <button type="button" onClick={() => setSelectedOrder(order)}>
                        详情
                      </button>
                    </div>
                    {columnsExpanded ? (
                      <>
                        <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--stock">
                          {renderOrderFlagIndicator('stock', order.stockFlag)}
                        </div>
                        <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--room">
                          {renderOrderFlagIndicator('room', order.roomFlag, !order.needsRoomAssignment)}
                        </div>
                        <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--plan">
                          {renderOrderFlagIndicator('plan', order.planFlag)}
                        </div>
                      </>
                    ) : null}
                  </div>
                ))
              : null}
            {!isLoading && !error && filteredOrders.length === 0 ? (
              <div className="order-table__empty" role="row">
                <div role="cell">暂无数据</div>
              </div>
            ) : null}
          </div>
        </div>
        <footer className="order-pagination">
          <span>共 {data?.total ?? 0} 条</span>
          <button type="button" aria-label="上一页" disabled>
            {'<'}
          </button>
          <button type="button" className="is-active">
            {data?.pageNum ?? 1}
          </button>
          <button type="button" aria-label="下一页" disabled={!data?.pages || data.pageNum >= data.pages} onClick={() => handleBlockedAction('下一页')}>
            {'>'}
          </button>
          <span>{data?.pageSize ?? 20} 条/页</span>
        </footer>
      </section>

      {selectedOrder ? (
        <OrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onBlockedAction={handleBlockedAction}
          onOrderCancelled={handleOrderCancelled}
          onOrderSkippedStock={handleOrderSkippedStock}
        />
      ) : null}
      <OrderEntryDrawer
        isOpen={isEntryDrawerOpen}
        orderType={entryOrderType}
        fullDayForm={fullDayForm}
        hourlyForm={hourlyForm}
        longRentalForm={longRentalForm}
        roomSelectorModal={roomSelectorModal}
        reminderModal={reminderModal}
        tagSelectorModal={tagSelectorModal}
        onClose={closeEntryDrawer}
        onTypeChange={setEntryOrderType}
        setFullDayForm={setFullDayForm}
        setHourlyForm={setHourlyForm}
        setLongRentalForm={setLongRentalForm}
        setRoomSelectorModal={setRoomSelectorModal}
        setReminderModal={setReminderModal}
        setTagSelectorModal={setTagSelectorModal}
        onCreated={() => setRequestRevision((value) => value + 1)}
        setActionMessage={setActionMessage}
        isSubmitting={isSubmittingOrder}
        setIsSubmitting={setIsSubmittingOrder}
      />
    </div>
  )
}

export function OrdersPage({ variant = 'house' }: { variant?: 'house' | 'longRental' }) {
  return variant === 'longRental' ? <LongRentalOrdersPage /> : <HouseOrdersPage />
}



