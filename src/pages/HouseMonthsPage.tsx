import { type ChangeEvent, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  cancelHouseMonthOrder,
  changeHouseMonthOrderRoom,
  checkInHouseMonthOrder,
  checkOutHouseMonthOrder,
  closeHouseMonthRoom,
  fetchHouseMonthChangeRoomOptions,
  fetchHouseMonthsDefaultCampId,
  fetchHouseMonthsSnapshot,
  markNoShowHouseMonthOrder,
  openHouseMonthRoom,
  saveHouseMonthOrderGuests,
  skipStockHouseMonthOrder,
  type HouseMonthChangeRoomOption,
  type MonthCell,
  type MonthDateColumn,
  type MonthRoomGroup,
} from '../services/houseMonths'
import { StoreSelectControl, type StoreSelectOption } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import { fetchOrderRoomCategoryPrice } from '../services/orderRoomSelector'
import { OrderRefreshPopover } from './HouseStatusSharingPage'
import { OrderEntryDrawerHost, type OrderEntryInitialRoom } from './OrdersPage'
import {
  validateCredentialNumber,
  validateOptionalMainlandMobile,
  validatePersonName,
} from '../utils/inputValidation'
import './HouseMonthsPage.css'

export type BatchMode = 'dirty' | 'clean' | 'close' | 'open'
type BatchMenu = 'dirty-clean' | 'open-close' | null
export type RoomStatusSettingsDrawer = 'legend' | 'display' | null

export interface RoomStatusDisplaySettings {
  colorMode: 'channel' | 'order'
  showListPrice: boolean
  showOrders: boolean
  showOrderPrice: boolean
  showRoomCode: boolean
  showOrderTags: boolean
  showRoomStatus: boolean
}

export const DEFAULT_ROOM_STATUS_DISPLAY_SETTINGS: RoomStatusDisplaySettings = {
  colorMode: 'order',
  showListPrice: false,
  showOrders: true,
  showOrderPrice: true,
  showRoomCode: false,
  showOrderTags: true,
  showRoomStatus: true,
}

export interface HoveredBooking {
  cell: MonthCell
  roomType: string
  roomLabel: string
  left: number
  top: number
}

export interface SelectedBooking {
  cell: MonthCell
  roomType: string
  roomLabel: string
}

interface FloatingAnchor {
  left: number
  top: number
}

interface SelectedMonthCell {
  key: string
  storeId: string
  storeName: string
  roomType: string
  roomCategoryId: string
  roomId: string
  roomLabel: string
  date: string
  price?: string
  monthlyRent?: string
  status: 'blank' | 'closed'
}

interface RenderedRoomCell {
  cell: MonthCell
  cellIndex: number
  span: number
}

type OrderDrawerTab = 'order' | 'channel' | 'log'
type MonthOrderDialog = 'noshow' | 'checkout' | 'modify-fee' | 'reminder' | null
type MonthOrderState = 'pending' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show'
type MonthOrderOverlay = 'edit-order' | null
type EditOrderRoomMode = 'all-day' | 'hourly' | 'long-stay'
type MonthOrderActionFlow =
  | 'invite'
  | 'early-checkin'
  | 'invite-renew'
  | 'late-checkout'
  | 'change-room'
  | 'cancel-arrange'
  | 'skip-stock'
  | 'skip-report'
  | 'continue'
  | 'cancel-order'
  | 'clean'
  | 'print'
  | 'credit-checkout'
  | 'checkin'
  | 'renew'

interface UploadedAttachment {
  id: string
  name: string
}

interface MonthOrderAction {
  key: string
  label: string
  icon: string
  testId: string
}

interface MonthOrderActionDialogConfig {
  title: string
  confirmLabel: string
  actionLabel: string
  testId: string
}

interface MonthOrderLogEntry {
  id: string
  occurredAt: number
  title: string
  operator: string
  detail: string
}

const ORDER_GUEST_DOCUMENT_TYPES = ['居民身份证', '港澳通行证', '港澳回乡证', '台胞证', 'Passport'] as const

interface MonthOrderGuestForm {
  guestName: string
  guestMobile: string
  guestIdCardType: string
  guestIdCard: string
}

type MonthOrderGuestFormErrors = Partial<Record<'guestName' | 'guestMobile' | 'guestIdCard', string>>

const ORDER_TAG_GROUP_LABEL = '默认标签'
const ORDER_TAG_OPTIONS = ['促销', '重单', '保留房', '钟点房'] as const

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const DAY_MS = 24 * 60 * 60 * 1000
const WINDOW_START_OFFSET_DAYS = -3

const monthDates: MonthDateColumn[] = Array.from({ length: 33 }, (_, index) => {
  const today = new Date()
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const date = new Date(localMidnight.getTime() + (WINDOW_START_OFFSET_DAYS + index) * DAY_MS)
  const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  return {
    fullDate: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
    isoDate,
    date: `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
    weekday: weekdays[date.getDay()],
    remain: '余0间',
    hot: date.getDay() === 5 || date.getDay() === 6,
  }
})

const monthPickerWeekdays = ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u65e5']
const MONTH_WINDOW_DAYS = 33
const DEFAULT_SELECTED_DATE_INDEX = 3

interface MonthPickerCell {
  isoDate: string
  label: string
  inViewMonth: boolean
  isSelected: boolean
}

function toLocalDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function shiftDate(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatFullDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function formatMonthDay(date: Date) {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function parseIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function parsePlainAmount(value: string | undefined) {
  if (!value) return undefined
  const amount = Number.parseFloat(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(amount) ? amount : undefined
}

function formatPlainAmount(value: number) {
  if (!Number.isFinite(value)) return '0'
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)))
}

function sumSelectedCellPrices(cells: SelectedMonthCell[]) {
  const prices = cells.map((cell) => parsePlainAmount(cell.price))
  if (prices.some((price) => price === undefined)) return undefined
  return prices.reduce<number>((sum, price) => sum + (price ?? 0), 0)
}

function getStayNightCount(stayRange: string) {
  const [startPart, endPart] = stayRange.split('-')
  if (!startPart || !endPart) return 2

  const [startYear, startMonth, startDay] = startPart.split('.').map(Number)
  const endParts = endPart.split('.').map(Number)
  if (!startYear || !startMonth || !startDay || endParts.length < 2) return 2

  const [endMonth, endDay] = endParts.length === 3 ? [endParts[1], endParts[2]] : [endParts[0], endParts[1]]
  const endYear = endParts.length === 3 ? endParts[0] : endMonth < startMonth ? startYear + 1 : startYear
  if (!endMonth || !endDay) return 2

  const startDate = new Date(startYear, startMonth - 1, startDay)
  const endDate = new Date(endYear, endMonth - 1, endDay)
  const diffDays = Math.round((toLocalDate(endDate).getTime() - toLocalDate(startDate).getTime()) / DAY_MS)

  return diffDays > 0 ? diffDays : 2
}

function getStayRangeDetails(stayRange: string) {
  const [startPart, endPart] = stayRange.split('-')
  if (!startPart || !endPart) {
    return {
      checkinDate: '2026-05-20',
      checkoutDate: '2026-05-21',
      nights: 1,
    }
  }

  const [startYear, startMonth, startDay] = startPart.split('.').map(Number)
  const endParts = endPart.split('.').map(Number)
  if (!startYear || !startMonth || !startDay || endParts.length < 2) {
    return {
      checkinDate: startPart.replace(/\./g, '-'),
      checkoutDate: endPart.replace(/\./g, '-'),
      nights: getStayNightCount(stayRange),
    }
  }

  const [endMonth, endDay] = endParts.length === 3 ? [endParts[1], endParts[2]] : [endParts[0], endParts[1]]
  const endYear = endParts.length === 3 ? endParts[0] : endMonth < startMonth ? startYear + 1 : startYear

  return {
    checkinDate: `${String(startYear).padStart(4, '0')}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
    checkoutDate: `${String(endYear).padStart(4, '0')}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    nights: getStayNightCount(stayRange),
  }
}

function copyText(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  }

  if (typeof document !== 'undefined') {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    textarea.style.pointerEvents = 'none'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }

  return Promise.resolve()
}

function createMonthDateColumns(startDate: Date): MonthDateColumn[] {
  return Array.from({ length: MONTH_WINDOW_DAYS }, (_, index) => {
    const date = shiftDate(startDate, index)

    return {
      fullDate: formatFullDate(date),
      isoDate: formatIsoDate(date),
      date: formatMonthDay(date),
      weekday: weekdays[date.getDay()],
      remain: monthDates[0]?.remain ?? '',
      hot: date.getDay() === 5 || date.getDay() === 6,
    }
  })
}

function createMonthPickerCells(cursorMonth: Date, selectedDate: Date): MonthPickerCell[] {
  const monthStart = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1)
  const firstGridDate = shiftDate(monthStart, -((monthStart.getDay() + 6) % 7))
  const selectedIsoDate = formatIsoDate(selectedDate)

  return Array.from({ length: 42 }, (_, index) => {
    const date = shiftDate(firstGridDate, index)
    return {
      isoDate: formatIsoDate(date),
      label: String(date.getDate()),
      inViewMonth: date.getMonth() === cursorMonth.getMonth(),
      isSelected: formatIsoDate(date) === selectedIsoDate,
    }
  })
}

export function createHoveredBooking(
  rect: Pick<DOMRect, 'right' | 'top' | 'height'>,
  cell: MonthCell,
  roomType: string,
  roomLabel: string,
): HoveredBooking {
  const popoverWidth = 300
  const popoverHeight = 232
  const left = Math.min(rect.right + 18, window.innerWidth - popoverWidth - 12)
  const top = Math.max(8, Math.min(Math.round(rect.top + rect.height / 2 - popoverHeight / 2), window.innerHeight - popoverHeight - 12))

  return {
    cell,
    roomType,
    roomLabel,
    left: Math.round(left),
    top,
  }
}

function createSelectedMonthCell(
  key: string,
  row: MonthRoomGroup,
  column: MonthDateColumn,
  status: SelectedMonthCell['status'],
): SelectedMonthCell {
  return {
    key,
    storeId: row.storeId,
    storeName: row.storeName,
    roomType: row.label,
    roomCategoryId: row.roomCategoryId || row.id,
    roomId: row.roomId,
    roomLabel: row.roomLabel,
    date: column.isoDate,
    price: row.price,
    monthlyRent: row.monthlyRent,
    status,
  }
}

function resolveRoomCategoryLabel(roomCategoryFilter: string, rows: MonthRoomGroup[]) {
  const match = rows.find((row) => (row.roomCategoryId || row.label) === roomCategoryFilter)
  return match?.label || roomCategoryFilter
}

function sortSelectedMonthCells(cells: SelectedMonthCell[]) {
  return [...cells].sort((left, right) => left.date.localeCompare(right.date))
}

function areSelectedCellsContinuous(cells: SelectedMonthCell[]) {
  const sortedCells = sortSelectedMonthCells(cells)
  return sortedCells.every((cell, index) => {
    if (index === 0) return true
    const previousDate = parseIsoDate(sortedCells[index - 1].date)
    return formatIsoDate(shiftDate(previousDate, 1)) === cell.date
  })
}

function getBookingMergeKey(cell: MonthCell) {
  if (!cell.tone.startsWith('booking')) return ''
  return cell.orderId || `${cell.title}|${cell.subtitle ?? ''}|${cell.stayRange ?? ''}|${cell.phone ?? ''}`
}

function createRenderedRoomCells(cells: MonthCell[]): RenderedRoomCell[] {
  const renderedCells: RenderedRoomCell[] = []
  let cellIndex = 0

  while (cellIndex < cells.length) {
    const cell = cells[cellIndex]
    const mergeKey = getBookingMergeKey(cell)
    let span = 1

    if (mergeKey) {
      while (cellIndex + span < cells.length && getBookingMergeKey(cells[cellIndex + span]) === mergeKey) {
        span += 1
      }
    }

    renderedCells.push({ cell, cellIndex, span })
    cellIndex += span
  }

  return renderedCells
}

export function MonthOrderPopover({ hoveredBooking }: { hoveredBooking: HoveredBooking }) {
  return (
    <section
      className="month-order-popover"
      style={{ left: hoveredBooking.left, top: hoveredBooking.top }}
      aria-label="订单悬浮信息"
    >
      <header>
        {hoveredBooking.roomType}-{hoveredBooking.roomLabel}
      </header>
      <div className="month-order-popover__content">
        <div>预订人: {hoveredBooking.cell.title}</div>
        <div>手机号: {hoveredBooking.cell.phone ?? '-'}</div>
        <div>入离时间: {hoveredBooking.cell.stayRange ?? '2026-05-18-05-20'}</div>
        <div>
          渠道来源: <span>{hoveredBooking.cell.subtitle ?? '-'}</span>
        </div>
        <div className="month-order-popover__price">
          <span>
            房费(减佣): <em>{hoveredBooking.cell.amount ?? '-'}</em>
          </span>
          <span>
            订单总收入: <em>{hoveredBooking.cell.totalIncome ?? hoveredBooking.cell.amount ?? '-'}</em>
          </span>
        </div>
        <div>备注: {hoveredBooking.cell.remark ?? '-'}</div>
      </div>
    </section>
  )
}

const batchConfig: Record<BatchMode, { title: string; enter: string; apply: string; result: string }> = {
  dirty: { title: '批量设脏', enter: '已进入批量设脏模式', apply: '设为脏房', result: '脏房' },
  clean: { title: '批量设净', enter: '已进入批量设净模式', apply: '设为净房', result: '净房' },
  close: { title: '批量关房', enter: '已进入批量关房模式', apply: '设为关闭房', result: '关闭房' },
  open: { title: '批量开房', enter: '已进入批量开房模式', apply: '设为开放房', result: '开放房' },
}

function createBatchDialogInitialState(mode: BatchMode) {
  return {
    roomText: '',
    dateStart: '',
    dateEnd: '',
    channel: 'all',
    closeType: 'disabled',
    remark: '',
    mode,
  }
}

type BatchDialogState = ReturnType<typeof createBatchDialogInitialState>

export function BatchOperationDialog({
  mode,
  state,
  onChange,
  onClose,
  onConfirm,
}: {
  mode: BatchMode
  state: BatchDialogState
  onChange: (patch: Partial<BatchDialogState>) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const isDirtyLike = mode === 'dirty' || mode === 'clean'
  const isClose = mode === 'close'
  const isOpen = mode === 'open'
  const title = batchConfig[mode].title

  return (
    <div className="month-order-dialog-scrim month-batch-dialog-scrim" role="presentation" onClick={onClose}>
      <section
        className={`month-order-dialog month-order-dialog--medium month-batch-dialog${isClose || isOpen ? ' month-batch-dialog--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="month-order-dialog__header month-batch-dialog__header">
          <strong>{title}</strong>
          <button type="button" aria-label={`关闭${title}`} onClick={onClose}>
            {'\u00d7'}
          </button>
        </header>
        <div className="month-order-dialog__body month-batch-dialog__body">
          <div className="month-batch-dialog__field">
            <span>{'\u623f\u95f4:'}</span>
            <div className="month-batch-dialog__room-picker">
              <input
                className="month-order-dialog__input"
                aria-label={'\u6279\u91cf\u623f\u95f4'}
                placeholder={'\u8bf7\u6dfb\u52a0\u623f\u95f4'}
                value={state.roomText}
                onChange={(event) => onChange({ roomText: event.target.value })}
              />
              <button type="button" className="month-batch-dialog__link" onClick={() => onChange({ roomText: '\u623f\u95f41' })}>
                {'+\u6dfb\u52a0'}
              </button>
            </div>
          </div>

          {isDirtyLike ? null : (
            <>
              <div className="month-batch-dialog__field">
                <span>{'\u65e5\u671f:'}</span>
                <div className="month-batch-dialog__date-range">
                  <input
                    className="month-order-dialog__input"
                    aria-label={'\u5f00\u59cb\u65e5\u671f'}
                    type="date"
                    value={state.dateStart}
                    onChange={(event) => onChange({ dateStart: event.target.value })}
                  />
                  <em>{'→'}</em>
                  <input
                    className="month-order-dialog__input"
                    aria-label={'\u7ed3\u675f\u65e5\u671f'}
                    type="date"
                    value={state.dateEnd}
                    onChange={(event) => onChange({ dateEnd: event.target.value })}
                  />
                </div>
              </div>
              <div className="month-batch-dialog__field">
                <span>{'\u6e20\u9053:'}</span>
                <select
                  className="month-order-dialog__select month-batch-dialog__select"
                  aria-label={'\u5168\u90e8\u6e20\u9053'}
                  value={state.channel}
                  onChange={(event) => onChange({ channel: event.target.value })}
                >
                  <option value="all">{'\u5168\u90e8\u6e20\u9053'}</option>
                  <option value="ctrip">{'\u643a\u7a0b'}</option>
                  <option value="meituan-hotel">{'\u7f8e\u56e2\u9152\u5e97'}</option>
                  <option value="feizhu-hotel">{'\u98de\u732a\u6dd8\u9152\u5e97'}</option>
                  <option value="meituan-homestay">{'\u7f8e\u56e2\u6c11\u5bbf'}</option>
                  <option value="tujia">{'\u9014\u5bb6'}</option>
                  <option value="muniao">{'\u6728\u9e1f'}</option>
                  <option value="xiaozhu">{'\u5c0f\u732a'}</option>
                  <option value="locals">{'\u8def\u5ba2\u4e91\u805a\u5408'}</option>
                </select>
              </div>
            </>
          )}

          {isClose ? (
            <>
              <div className="month-batch-dialog__field month-batch-dialog__field--radios">
                <span>{'\u5173\u623f\u7c7b\u578b:'}</span>
                <div className="month-order-dialog__radio-group month-batch-dialog__radio-group">
                  <label>
                    <input type="radio" name="batch-close-type" checked={state.closeType === 'disabled'} onChange={() => onChange({ closeType: 'disabled' })} />
                    <span>{'\u505c\u7528\u623f'}</span>
                  </label>
                  <label>
                    <input type="radio" name="batch-close-type" checked={state.closeType === 'repair'} onChange={() => onChange({ closeType: 'repair' })} />
                    <span>{'\u7ef4\u4fee\u623f'}</span>
                  </label>
                  <label>
                    <input type="radio" name="batch-close-type" checked={state.closeType === 'reserved'} onChange={() => onChange({ closeType: 'reserved' })} />
                    <span>{'\u4fdd\u7559\u623f'}</span>
                  </label>
                </div>
              </div>
              <div className="month-batch-dialog__field month-batch-dialog__field--textarea">
                <span>{'\u5907\u6ce8:'}</span>
                <label className="month-batch-dialog__textarea-wrap">
                  <textarea
                    className="month-order-dialog__textarea"
                    aria-label={'\u8bf7\u8f93\u5165\u5907\u6ce8'}
                    maxLength={200}
                    placeholder={'\u8bf7\u8f93\u5165\u5907\u6ce8'}
                    value={state.remark}
                    onChange={(event) => onChange({ remark: event.target.value })}
                  />
                  <b>{state.remark.length} / 200</b>
                </label>
              </div>
              <p className="month-batch-dialog__hint">
                {'\u6b64\u7c7b\u578b\u5173\u623f\u4ecd\u8bb0\u4e3a\u53ef\u552e\u8ba1\u5165\u5165\u4f4f\u7387\uff0c'}
                <button type="button">{'\u53ef\u524d\u5f80\u8bbe\u7f6e'}</button>
              </p>
            </>
          ) : null}

          {isOpen ? (
            <p className="month-batch-dialog__hint month-batch-dialog__hint--inline">
              {'\u6b64\u7c7b\u578b\u5173\u623f\u4ecd\u8bb0\u4e3a\u53ef\u552e\u8ba1\u5165\u5165\u4f4f\u7387\uff0c\u53ef\u524d\u5f80\u8bbe\u7f6e'}
            </p>
          ) : null}
        </div>
        <footer className="month-order-dialog__footer month-batch-dialog__footer">
          <button type="button" onClick={onClose}>
            {'\u53d6\u6d88'}
          </button>
          <button type="button" className="is-primary" onClick={onConfirm}>
            {'\u786e\u5b9a'}
          </button>
        </footer>
      </section>
    </div>
  )
}

type LegendStatusIcon = 'dirty' | 'disabled' | 'repair' | 'reserve'

interface LegendItem {
  label: string
  kind: 'room' | 'color' | 'status' | 'tag'
  tone: string
  icon?: LegendStatusIcon
  marker?: string
  fill?: boolean
}

interface LegendSection {
  title: string
  layout: 'rooms' | 'colors' | 'icons'
  items: LegendItem[]
}

const legendSections: LegendSection[] = [
  {
    title: '房间信息',
    layout: 'rooms',
    items: [
      { label: '空房', kind: 'room', tone: 'empty' },
      { label: '关房', kind: 'room', tone: 'closed' },
      { label: '各平台房态不一致', kind: 'room', tone: 'mismatch' },
    ],
  },
  {
    title: '订单颜色',
    layout: 'colors',
    items: [
      { label: '待入住', kind: 'color', tone: 'pending' },
      { label: '入住中', kind: 'color', tone: 'live' },
      { label: '已退房', kind: 'color', tone: 'checkout' },
      { label: '重单', kind: 'color', tone: 'duplicate' },
    ],
  },
  {
    title: '房间状态',
    layout: 'icons',
    items: [
      { label: '脏房', kind: 'status', tone: 'orange', icon: 'dirty' },
      { label: '停用房', kind: 'status', tone: 'red', icon: 'disabled' },
      { label: '维修房', kind: 'status', tone: 'blue', icon: 'repair' },
      { label: '保留房', kind: 'status', tone: 'purple', icon: 'reserve' },
    ],
  },
  {
    title: '订单标签',
    layout: 'icons',
    items: [
      { label: '重单', kind: 'tag', tone: 'red', marker: '重', fill: true },
      { label: '订单备注', kind: 'tag', tone: 'orange', marker: '备' },
      { label: '订单欠款', kind: 'tag', tone: 'red', marker: '欠' },
      { label: '提前退房', kind: 'tag', tone: 'blue', marker: '退' },
      { label: '邀请续住中', kind: 'tag', tone: 'orange', marker: '邀' },
      { label: '续住订单', kind: 'tag', tone: 'blue', marker: '续' },
    ],
  },
  {
    title: '入住类型',
    layout: 'icons',
    items: [
      { label: '钟点房', kind: 'tag', tone: 'blue', marker: '钟' },
      { label: '长租', kind: 'tag', tone: 'purple', marker: '长' },
    ],
  },
]

const legendNotices = [
  '若格子出现“小红点”，为房态不一致，请点格子进行调整，统一当天房态避免重单！',
  '请避免在平台调整房态、房价等信息，统一在路客云维护，以免发生信息错乱、修改失败之情况！',
  '请关闭在平台的 iCal/日历同步功能，以免影响房态同步。',
] as const

function LegendStatusMark({ icon }: { icon: LegendStatusIcon }) {
  switch (icon) {
    case 'dirty':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 6.5h8l3 3v6.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3z" />
          <path d="m9 12 2.2 2.2 4-4.4" />
        </svg>
      )
    case 'disabled':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5.5 19 18H5z" />
          <path d="M12 10v4.2" />
          <circle cx="12" cy="16.8" r="0.9" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'repair':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14.6 6.4 2.9-2.1 1.2 1.2-2.1 2.9-.2 1.8-4.7 4.7a2.1 2.1 0 1 1-3-3l4.7-4.7z" />
          <path d="m8.4 10.8-2.9-.5L4.3 9l2.1-2.9" />
        </svg>
      )
    case 'reserve':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="7" y="11" width="10" height="7.5" rx="1.6" />
          <path d="M9 11V8.9A3 3 0 0 1 12 6a3 3 0 0 1 3 2.9V11" />
        </svg>
      )
  }
}

function RoomStatusLegendTile({
  item,
}: {
  item: LegendItem
}) {
  return (
    <div className="room-status-legend__item">
      <span className={`room-status-legend__tile is-${item.kind} tone-${item.tone}`} aria-hidden="true">
        {item.kind === 'status' && item.icon ? (
          <span className={`room-status-legend__status-mark tone-${item.tone}`}>
            <LegendStatusMark icon={item.icon} />
          </span>
        ) : null}
        {item.kind === 'tag' && item.marker ? (
          <span className={`room-status-legend__tag-mark tone-${item.tone}${item.fill ? ' is-filled' : ''}`}>{item.marker}</span>
        ) : null}
      </span>
      <span className="room-status-legend__label">{item.label}</span>
    </div>
  )
}

export function RoomStatusLegendDrawer({ onClose }: { onClose: () => void }) {
  return (
    <aside className="room-status-side-drawer" role="dialog" aria-modal="true" aria-label="图例说明">
      <header className="room-status-side-drawer__header">
        <strong>图例说明</strong>
        <button type="button" aria-label="关闭图例说明" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="room-status-side-drawer__body room-status-legend">
        {legendSections.map((section) => (
          <section key={section.title} className="room-status-legend__section">
            <h3>{section.title}</h3>
            <div className={`room-status-legend__items is-${section.layout}`}>
              {section.items.map((item) => (
                <RoomStatusLegendTile key={item.label} item={item} />
              ))}
            </div>
          </section>
        ))}
        <section className="room-status-legend__notice">
          <h3>注意事项</h3>
          <ol>
            {legendNotices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ol>
        </section>
      </div>
    </aside>
  )
}

function DrawerSwitch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className="room-status-setting-switch"
      onClick={() => onChange(!checked)}
    >
      <span>{label}</span>
      <i aria-hidden="true" />
    </button>
  )
}

export function RoomStatusDisplaySettingsDrawer({
  settings,
  onClose,
  onChange,
}: {
  settings: RoomStatusDisplaySettings
  onClose: () => void
  onChange: (settings: RoomStatusDisplaySettings) => void
}) {
  const patchSettings = (patch: Partial<RoomStatusDisplaySettings>) => {
    onChange({ ...settings, ...patch })
  }

  return (
    <aside className="room-status-side-drawer room-status-side-drawer--settings" role="dialog" aria-modal="true" aria-label="房态显示设置">
      <header className="room-status-side-drawer__header">
        <strong>房态显示设置</strong>
        <button type="button" aria-label="关闭房态显示设置" onClick={onClose}>
          ×
        </button>
      </header>
      <div className="room-status-side-drawer__body room-status-settings-panel">
        <section className="room-status-settings-panel__section">
          <h3>房态页（可左右拖动排序）</h3>
          <div className="room-status-settings-panel__drag-list" aria-label="房态页排序">
            {['月房态', '日房态'].map((label) => (
              <button key={label} type="button" className="room-status-settings-panel__drag-item">
                <span className="room-status-settings-panel__eye" aria-hidden="true" />
                <span>{label}</span>
                <span className="room-status-settings-panel__handle" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="room-status-settings-panel__section">
          <h3>日房态视图（可左右拖动排序）</h3>
          <div className="room-status-settings-panel__drag-list" aria-label="日房态视图排序">
            {['按房型', '按房间号', '按楼层'].map((label) => (
              <button key={label} type="button" className="room-status-settings-panel__drag-item">
                <span className="room-status-settings-panel__eye" aria-hidden="true" />
                <span>{label}</span>
                <span className="room-status-settings-panel__handle" aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>

        <section className="room-status-settings-panel__section">
          <h3>订单颜色</h3>
          <div className="room-status-setting-radio-group">
            <label>
              <input
                type="radio"
                name="room-status-color-mode"
                checked={settings.colorMode === 'channel'}
                onChange={() => patchSettings({ colorMode: 'channel' })}
              />
              <span>渠道为主色</span>
            </label>
            <label>
              <input
                type="radio"
                name="room-status-color-mode"
                checked={settings.colorMode === 'order'}
                onChange={() => patchSettings({ colorMode: 'order' })}
              />
              <span>订单状态为主色</span>
            </label>
          </div>
        </section>

        <section className="room-status-settings-panel__section">
          <h3>显示内容</h3>
          <div className="room-status-settings-panel__switches">
            <DrawerSwitch label="显示门市价" checked={settings.showListPrice} onChange={(checked) => patchSettings({ showListPrice: checked })} />
            <DrawerSwitch label="显示房源编码" checked={settings.showRoomCode} onChange={(checked) => patchSettings({ showRoomCode: checked })} />
          </div>
        </section>
      </div>
    </aside>
  )
}

export function HouseMonthsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const monthBoardRef = useRef<HTMLElement | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const today = useMemo(() => toLocalDate(new Date()), [])
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(today)
  const [windowStartDate, setWindowStartDate] = useState(() => shiftDate(today, WINDOW_START_OFFSET_DAYS))
  const [pickerMonth, setPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [toastMessage, setToastMessage] = useState('')
  const [activeChip, setActiveChip] = useState('all')
  const [query, setQuery] = useState('')
  const [roomType, setRoomType] = useState('')
  const [batchMenu, setBatchMenu] = useState<BatchMenu>(null)
  const [batchDialogMode, setBatchDialogMode] = useState<BatchMode | null>(null)
  const [batchDialogState, setBatchDialogState] = useState<BatchDialogState>(() => createBatchDialogInitialState('dirty'))
  const [filterMenu, setFilterMenu] = useState<'room' | 'tag' | null>(null)
  const [batchResult, setBatchResult] = useState<BatchMode | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedCells, setSelectedCells] = useState<SelectedMonthCell[]>([])
  const [selectedCell, setSelectedCell] = useState<SelectedMonthCell | null>(null)
  const [selectionAnchor, setSelectionAnchor] = useState<FloatingAnchor | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null)
  const [hoveredBooking, setHoveredBooking] = useState<HoveredBooking | null>(null)
  const [orderEntryInitialRoom, setOrderEntryInitialRoom] = useState<OrderEntryInitialRoom | null>(null)
  const [statusDrawer, setStatusDrawer] = useState<RoomStatusSettingsDrawer>(null)
  const [displaySettings, setDisplaySettings] = useState<RoomStatusDisplaySettings>(DEFAULT_ROOM_STATUS_DISPLAY_SETTINGS)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [loadError, setLoadError] = useState('')
  const [refreshPopoverOpen, setRefreshPopoverOpen] = useState(false)
  const [roomGroups, setRoomGroups] = useState<MonthRoomGroup[]>([])
  const [dateColumns, setDateColumns] = useState<MonthDateColumn[]>(() => createMonthDateColumns(shiftDate(today, WINDOW_START_OFFSET_DAYS)))
  const initialCampId = useMemo(() => {
    const queryCampId = new URLSearchParams(location.search).get('campId')?.trim()
    if (queryCampId) return queryCampId
    return window.localStorage.getItem('pms.currentCampId')?.trim() || ''
  }, [location.search])
  const resolvedCampIdRef = useRef('')

  const selectedDateIso = useMemo(() => formatIsoDate(selectedDate), [selectedDate])
  const selectedDateIndex = useMemo(
    () => dateColumns.findIndex((column) => column.isoDate === selectedDateIso),
    [dateColumns, selectedDateIso],
  )
  const activeSelectedDateIndex = selectedDateIndex >= 0 ? selectedDateIndex : DEFAULT_SELECTED_DATE_INDEX
  const monthPickerCells = useMemo(() => createMonthPickerCells(pickerMonth, selectedDate), [pickerMonth, selectedDate])
  const pickerMonthLabel = `${pickerMonth.getFullYear()}\u5e74 ${pickerMonth.getMonth() + 1}\u6708`
  const activeStoreCampId = useMemo(() => initialCampId || resolvedCampIdRef.current, [initialCampId])
  const roomTypeLabel = useMemo(() => resolveRoomCategoryLabel(roomType, roomGroups), [roomGroups, roomType])

  useEffect(() => {
    if (!toastMessage) return undefined

    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('')
      toastTimerRef.current = null
    }, 2400)

    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
        toastTimerRef.current = null
      }
    }
  }, [toastMessage])

  useEffect(() => {
    setDateColumns(createMonthDateColumns(windowStartDate))
    if (monthBoardRef.current) monthBoardRef.current.scrollLeft = 184
  }, [windowStartDate])

  const loadSnapshot = useCallback(async (nextRoomType = roomType, nextQuery = query) => {
    setLoadState('loading')
    setLoadError('')
    try {
      const requestColumns = createMonthDateColumns(windowStartDate)
      let activeCampId = activeStoreCampId || resolvedCampIdRef.current
      if (!activeCampId) {
        activeCampId = await fetchHouseMonthsDefaultCampId()
        window.localStorage.setItem('pms.currentCampId', activeCampId)
        resolvedCampIdRef.current = activeCampId
      }

      const snapshot = await fetchHouseMonthsSnapshot(
        {
          campId: activeCampId,
          startDate: requestColumns[0].isoDate,
          days: requestColumns.length,
          roomCategoryId: nextRoomType || undefined,
          queryCode: nextQuery.trim() || undefined,
        },
        requestColumns,
      )
      setRoomGroups(snapshot.rows)
      setDateColumns(snapshot.columns)
      setLoadState('ready')
      setToastMessage('月房态已刷新，营业日历已同步')
    } catch (error) {
      setRoomGroups([])
      setLoadState('error')
      setLoadError(error instanceof Error ? error.message : String(error))
    }
  }, [activeStoreCampId, query, roomType, windowStartDate])

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) void loadSnapshot()
    })

    return () => {
      cancelled = true
    }
  }, [loadSnapshot])

  useEffect(() => {
    const closeByKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setSettingsOpen(false)
      setFilterMenu(null)
      setBatchMenu(null)
      setDatePickerOpen(false)
      setSelectedBooking(null)
      setBatchDialogMode(null)
      setSelectedCells([])
      setSelectedCell(null)
      setSelectionAnchor(null)
      setStatusDrawer(null)
    }

    const closeByPointer = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest('.month-settings')) setSettingsOpen(false)
      if (!target.closest('.month-filter-menu')) setFilterMenu(null)
      if (!target.closest('.month-batch-action')) setBatchMenu(null)
      if (!target.closest('.month-toolbar__refresh-group')) setRefreshPopoverOpen(false)
      if (!target.closest('.month-calendar-title') && !target.closest('.month-date-picker')) setDatePickerOpen(false)
      if (!target.closest('.month-order-drawer') && !target.closest('.month-cell[class*="tone-booking-"]')) {
        setSelectedBooking(null)
      }
    }

    window.addEventListener('keydown', closeByKey)
    window.addEventListener('click', closeByPointer)

    return () => {
      window.removeEventListener('keydown', closeByKey)
      window.removeEventListener('click', closeByPointer)
    }
  }, [])

  const roomGroupStoreFallbackOptions = useMemo(
    () =>
      roomGroups
        .filter((group) => group.storeId && group.storeId !== 'all')
        .map((group) => ({
          id: group.storeId,
          label: group.storeName || `门店 ${group.storeId}`,
        })),
    [roomGroups],
  )
  const { storeOptions: backendStoreOptions } = useStoreOptions({
    fallbackOptions: roomGroupStoreFallbackOptions,
  })
  const storeOptions = useMemo<StoreSelectOption[]>(() => {
    const stores = new Map<string, StoreSelectOption>()
    for (const store of backendStoreOptions) {
      if (store.id && store.id !== 'all') stores.set(store.id, { id: store.id, name: store.label })
    }
    for (const group of roomGroups) {
      if (group.storeId && group.storeId !== 'all') {
        stores.set(group.storeId, { id: group.storeId, name: group.storeName || `门店 ${stores.size + 1}` })
      }
    }
    return [{ id: 'all', name: '全部门店' }, ...stores.values()]
  }, [backendStoreOptions, roomGroups])

  useEffect(() => {
    if (activeChip === 'all') return
    if (storeOptions.some((store) => store.id === activeChip)) return
    setActiveChip('all')
  }, [activeChip, storeOptions])

  const filteredRows = useMemo(() => {
    const keyword = query.trim()

    return roomGroups.filter((group) => {
      if (activeChip !== 'all' && group.storeId !== activeChip) return false

      const searchable = [
        group.label,
        group.roomLabel,
        ...group.typeCells.map((cell) => cell.title),
        ...group.roomCells.map((cell) => `${cell.title} ${cell.subtitle ?? ''} ${cell.amount ?? ''}`),
      ].join(' ')

      if (keyword && !searchable.includes(keyword)) return false
      if (roomType && (group.roomCategoryId || group.label) !== roomType) return false
      return true
    })
  }, [activeChip, query, roomGroups, roomType])

  const setDateFromPicker = (date: Date) => {
    const nextDate = toLocalDate(date)
    setSelectedDate(nextDate)
    setWindowStartDate(shiftDate(nextDate, WINDOW_START_OFFSET_DAYS))
    setPickerMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1))
    setDatePickerOpen(false)
  }

  const toggleDatePicker = () => {
    setPickerMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    setDatePickerOpen((open) => !open)
  }

  const shiftPickerMonth = (months: number) => {
    setPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + months, 1))
  }

  const startBatch = (mode: BatchMode) => {
    setBatchMenu(null)
    setBatchResult(null)
    setBatchDialogState(createBatchDialogInitialState(mode))
    setBatchDialogMode(mode)
  }

  const applyBatch = (mode: BatchMode) => {
    setBatchDialogMode(null)
    setBatchResult(mode)
    setSelectedKeys([])
    setSelectedCells([])
    setSelectedCell(null)
    setSelectionAnchor(null)
    setToastMessage(`${batchConfig[mode].title}已完成：已设为${batchConfig[mode].result}`)
  }

  const showActionResult = (action: string) => {
    setToastMessage(action === '复制成功' ? action : `${action}已处理`)
  }

  const selectMonthCell = (key: string, row: MonthRoomGroup, cellIndex: number, rect: DOMRect, status: SelectedMonthCell['status']) => {
    const column = dateColumns[cellIndex]
    if (!column) return

    if (selectedKeys.includes(key)) {
      const nextCells = selectedCells.filter((cell) => cell.key !== key)
      setSelectedCells(nextCells)
      setSelectedKeys(nextCells.map((cell) => cell.key))
      setSelectedCell(nextCells.at(-1) ?? null)
      if (nextCells.length === 0) {
        setSelectionAnchor(null)
      } else {
        updateSelectionAnchor(rect)
      }
      return
    }

    const nextCell = createSelectedMonthCell(key, row, column, status)
    const nextCells = [...selectedCells, nextCell]
    setSelectedCells(nextCells)
    setSelectedKeys(nextCells.map((cell) => cell.key))
    setSelectedCell(nextCell)
    updateSelectionAnchor(rect)
  }

  const openOrderEntryForSelectedCell = async () => {
    const cells = selectedCells.length ? selectedCells : selectedCell ? [selectedCell] : []
    if (!cells.length) return

    const firstCell = cells[0]
    const sameRoom = cells.every((cell) => cell.roomCategoryId === firstCell.roomCategoryId && cell.roomId === firstCell.roomId)
    if (!sameRoom || !areSelectedCellsContinuous(cells)) {
      setToastMessage('多选录单请连续选择同一房间日期')
      return
    }

    const sortedCells = sortSelectedMonthCells(cells)
    const startDate = sortedCells[0].date
    const endDate = formatIsoDate(shiftDate(parseIsoDate(sortedCells[sortedCells.length - 1].date), 1))
    const days = sortedCells.length
    const closedCells = sortedCells.filter((cell) => cell.status === 'closed')
    if (closedCells.length > 0) {
      const campId = activeStoreCampId || resolvedCampIdRef.current
      if (!campId) {
        setToastMessage('缺少当前门店，无法开房录单')
        return
      }

      try {
        await Promise.all(
          closedCells.map((cell) =>
            openHouseMonthRoom({
              campId,
              roomCategoryId: cell.roomCategoryId,
              roomId: cell.roomId,
              date: cell.date,
              reason: '月房态录单自动开房',
            }),
          ),
        )
        await loadSnapshot(roomType, query)
      } catch (error) {
        setToastMessage(`开房失败：${error instanceof Error ? error.message : String(error)}`)
        return
      }
    }
    const inlinePriceTotal = sumSelectedCellPrices(sortedCells)
    let price = inlinePriceTotal !== undefined ? formatPlainAmount(inlinePriceTotal) : undefined
    let unitPrice = inlinePriceTotal !== undefined ? formatPlainAmount(inlinePriceTotal / days) : firstCell.price
    if (!price) {
      const campId = activeStoreCampId || resolvedCampIdRef.current
      if (!campId) {
        setToastMessage('Missing campId, cannot load room price')
        return
      }

      try {
        const categoryPrice = await fetchOrderRoomCategoryPrice({
          campId,
          poiId: firstCell.storeId,
          roomCategoryId: firstCell.roomCategoryId,
          startDate,
          days,
          stayType: 'daily_room',
        })
        price = categoryPrice?.price
        unitPrice = categoryPrice?.unitPrice
      } catch (error) {
        setToastMessage(`Load room price failed: ${error instanceof Error ? error.message : String(error)}`)
        return
      }
    }

    clearSelectedCells()
    setOrderEntryInitialRoom({
      poiId: firstCell.storeId,
      poiName: firstCell.storeName,
      roomCategoryId: firstCell.roomCategoryId,
      roomCategoryName: firstCell.roomType,
      roomId: firstCell.roomId,
      roomName: firstCell.roomLabel,
      startDate,
      endDate,
      price,
      unitPrice,
      monthlyRent: firstCell.monthlyRent,
    })
    setToastMessage(closedCells.length > 0 ? '已开房，录入订单面板已打开' : '录入订单面板已打开，可继续补充联系人和费用信息')
  }

  const closeSelectedMonthCellRoom = async () => {
    const targetCells = (selectedCells.length ? selectedCells : selectedCell ? [selectedCell] : []).filter((cell) => cell.status === 'blank')
    if (!targetCells.length) return
    const campId = activeStoreCampId || resolvedCampIdRef.current
    if (!campId) {
      setToastMessage('缺少当前门店，无法关房')
      return
    }

    try {
      const results = await Promise.all(
        targetCells.map((cell) =>
          closeHouseMonthRoom({
            campId,
            roomCategoryId: cell.roomCategoryId,
            roomId: cell.roomId,
            date: cell.date,
            reason: '月房态手动关房',
          }),
        ),
      )
      clearSelectedCells()
      await loadSnapshot(roomType, query)
      setToastMessage(targetCells.length === 1 ? results[0]?.message || '关房成功' : `已关房${targetCells.length}个房态`)
    } catch (error) {
      setToastMessage(`关房失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const openSelectedMonthCellRoom = async () => {
    const targetCells = (selectedCells.length ? selectedCells : selectedCell ? [selectedCell] : []).filter((cell) => cell.status === 'closed')
    if (!targetCells.length) return
    const campId = activeStoreCampId || resolvedCampIdRef.current
    if (!campId) {
      setToastMessage('缺少当前门店，无法开房')
      return
    }

    try {
      const results = await Promise.all(
        targetCells.map((cell) =>
          openHouseMonthRoom({
            campId,
            roomCategoryId: cell.roomCategoryId,
            roomId: cell.roomId,
            date: cell.date,
            reason: '月房态手动开房',
          }),
        ),
      )
      clearSelectedCells()
      await loadSnapshot(roomType, query)
      setToastMessage(targetCells.length === 1 ? results[0]?.message || '开房成功' : `已开房${targetCells.length}个房态`)
    } catch (error) {
      setToastMessage(`开房失败：${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const clearSelectedCells = () => {
    setSelectedKeys([])
    setSelectedCells([])
    setSelectedCell(null)
    setSelectionAnchor(null)
  }

  const clearFilters = () => {
    setQuery('')
    setRoomType('')
    void loadSnapshot('', '')
  }

  const handleStoreSwitch = (storeId: string) => {
    const nextStore = storeOptions.find((store) => store.id === storeId)
    const nextCampId = activeStoreCampId.trim()

    setActiveChip(storeId)
    if (nextCampId) {
      window.localStorage.setItem('pms.currentCampId', nextCampId)
      resolvedCampIdRef.current = nextCampId
    }
    setToastMessage(
      storeId === 'all'
        ? '\u5df2\u5207\u6362\u5230\u5168\u90e8\u95e8\u5e97'
        : `\u5df2\u5207\u6362\u5230${nextStore?.name ?? '\u5f53\u524d\u95e8\u5e97'}`,
    )
  }

  const clearRoomTypeFilter = () => {
    setRoomType('')
    setFilterMenu(null)
    void loadSnapshot('', query)
  }

  const hasFilters = Boolean(query || roomType)
  const showBookingPopover = (event: ReactMouseEvent<HTMLElement>, cell: MonthCell, row: MonthRoomGroup) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setHoveredBooking(createHoveredBooking(rect, cell, row.label, row.roomLabel))
  }

  const openOrderDrawer = (cell: MonthCell, row: MonthRoomGroup) => {
    setHoveredBooking(null)
    setSelectedBooking({
      cell,
      roomType: row.label,
      roomLabel: row.roomLabel,
    })
  }

  const isSelectableCell = (cell: MonthCell) => cell.tone === 'blank' || cell.tone === 'disabled'
  const updateSelectionAnchor = (rect: DOMRect) => {
    const panelWidth = 138
    const left = Math.min(
      window.innerWidth - panelWidth - 12,
      Math.max(12, Math.round(rect.left + rect.width / 2 - panelWidth / 2)),
    )
    const top = Math.min(window.innerHeight - 120, Math.round(rect.bottom + 8))
    setSelectionAnchor({ left, top })
  }

  return (
    <div className="page-stack month-status-page">
      <h1 className="month-route-heading">月房态</h1>
      <section className="month-toolbar" aria-label="月房态筛选">
        <div className="month-toolbar__primary">
          <div className="segmented">
            <button type="button" className="is-active">
              月房态
            </button>
            <button type="button" onClick={() => navigate('/houseManage/days')}>
              日房态
            </button>
          </div>

          <div className="month-toolbar__actions">
            <input
              type="text"
              value={query}
              placeholder="输入客户姓名/手机/房间/渠道单/备注"
              onChange={(event) => setQuery(event.target.value)}
            />
            <button type="button" onClick={() => showActionResult('读卡')}>
              读 卡
            </button>
            <button type="button" onClick={() => navigate('/houseManage/houseCale')}>
              房价管理
            </button>

            <div className="month-settings">
              <button type="button" aria-label="更多设置" onClick={() => setSettingsOpen((open) => !open)}>
                更多设置
              </button>
              {settingsOpen ? (
                <div className="month-settings__menu" role="menu" aria-label="更多设置">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSettingsOpen(false)
                      setStatusDrawer('legend')
                    }}
                  >
                    图例说明
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSettingsOpen(false)
                      setStatusDrawer('display')
                    }}
                  >
                    房态设置
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="month-toolbar__filters">
          <StoreSelectControl
            label="门店范围"
            options={storeOptions}
            value={activeChip}
            onChange={(storeId) => handleStoreSwitch(storeId)}
            settingsLabel="门店设置"
            onSettingsClick={() => navigate('/InformationMaintenance/campInfo')}
          />

          <div className={`month-filter-menu month-filter-menu--room${roomType ? ' has-value' : ''}`}>
            <button
              type="button"
              className="chip month-room-filter-trigger"
              aria-expanded={filterMenu === 'room'}
              data-testid="month-room-filter-trigger"
              onClick={() => setFilterMenu(filterMenu === 'room' ? null : 'room')}
            >
              {roomType ? (
                <span className="month-room-filter-trigger__value" data-testid="month-room-filter-value" title={roomTypeLabel}>
                  {roomTypeLabel}
                </span>
              ) : (
                <span className="month-room-filter-trigger__placeholder">房型</span>
              )}
            </button>
            {roomType ? (
              <button
                type="button"
                className="month-room-filter-clear"
                aria-label="清除房型筛选"
                data-testid="month-room-filter-clear"
                onClick={clearRoomTypeFilter}
              >
                ×
              </button>
            ) : null}
            {filterMenu === 'room' ? (
              <div className="month-filter-menu__panel" role="listbox" aria-label="房型筛选">
                {Array.from(
                  new Map(roomGroups.map((row) => [row.roomCategoryId || row.label, row])).values(),
                ).map((row) => (
                  <button
                    key={row.roomCategoryId || row.label}
                    type="button"
                    role="option"
                    aria-selected={roomType === (row.roomCategoryId || row.label)}
                    onClick={() => {
                      const roomCategoryFilter = row.roomCategoryId || row.label
                      setRoomType(roomCategoryFilter)
                      setFilterMenu(null)
                      void loadSnapshot(roomCategoryFilter, query)
                    }}
                  >
                    {row.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="month-filter-menu">
            <button type="button" className="chip" onClick={() => setFilterMenu(filterMenu === 'tag' ? null : 'tag')}>
              房型标签
            </button>
            {filterMenu === 'tag' ? (
              <div className="month-filter-menu__panel" role="listbox" aria-label="房型标签筛选">
                <div className="month-empty-option">暂无数据</div>
              </div>
            ) : null}
          </div>

          <div className="month-filter-search-wrap">
            <input className="month-filter-search" value={query} placeholder="房源编码/简称/标题" onChange={(event) => setQuery(event.target.value)} />
            <button type="button" className="month-filter-search-button" aria-label="搜索房源" onClick={() => void loadSnapshot(roomType, query)}>
              <span aria-hidden="true">⌕</span>
            </button>
          </div>
          {hasFilters ? (
          <button type="button" className="month-clear-filter" onClick={clearFilters}>
              清除筛选
            </button>
          ) : null}
          <div className="month-batch-action month-batch-action--first">
            <button
              type="button"
              className="month-outline-action"
              aria-expanded={batchMenu === 'dirty-clean'}
              onClick={() => setBatchMenu((current) => (current === 'dirty-clean' ? null : 'dirty-clean'))}
            >
              批量设脏/净
            </button>
            {batchMenu === 'dirty-clean' ? (
              <div className="month-batch-menu" role="menu" aria-label="批量设脏/净">
                <button type="button" role="menuitem" onClick={() => startBatch('dirty')}>
                  批量设脏
                </button>
                <button type="button" role="menuitem" onClick={() => startBatch('clean')}>
                  批量设净
                </button>
              </div>
            ) : null}
          </div>
          <div className="month-batch-action">
            <button
              type="button"
              className="month-outline-action"
              aria-expanded={batchMenu === 'open-close'}
              onClick={() => setBatchMenu((current) => (current === 'open-close' ? null : 'open-close'))}
            >
              批量开/关房
            </button>
            {batchMenu === 'open-close' ? (
              <div className="month-batch-menu" role="menu" aria-label="批量开/关房">
                <button type="button" role="menuitem" onClick={() => startBatch('close')}>
                  批量关房
                </button>
                <button type="button" role="menuitem" onClick={() => startBatch('open')}>
                  批量开房
                </button>
              </div>
            ) : null}
          </div>
          <div className="month-toolbar__refresh-group">
            <button
              type="button"
              className="month-refresh-action"
              aria-label="分享房态"
              onClick={() => navigate('/houseManage/months/sharingRoomStatus')}
            >
              ↺
            </button>
            <button
              type="button"
              className="month-refresh-action"
              aria-label="订单刷新"
              disabled={loadState === 'loading'}
              onClick={() => setRefreshPopoverOpen((current) => !current)}
            >
              ⟳
            </button>
            <OrderRefreshPopover
              open={refreshPopoverOpen}
              onRefresh={() => {
                setRefreshPopoverOpen(false)
                setToastMessage('美团酒店订单已刷新')
              }}
            />
          </div>
        </div>

        {loadState === 'loading' ? (
          <div className="month-status-loading" role="status">
            正在加载月房态数据...
          </div>
        ) : null}

        {loadState === 'error' ? (
          <div className="month-status-error" role="alert">
            <strong>月房态数据加载失败</strong>
            <span>{loadError}</span>
            <button type="button" onClick={() => void loadSnapshot()}>
              重试请求
            </button>
          </div>
        ) : null}

        {toastMessage ? (
          <div
            className={`month-status-toast${toastMessage === '复制成功' ? ' month-status-toast--top' : ''}`}
            role="status"
            data-batch-result={batchResult ?? undefined}
          >
            {toastMessage}
          </div>
        ) : null}

      </section>

      <section ref={monthBoardRef} className="timeline-board month-board" aria-label="月房态日历矩阵" data-testid="month-grid">
        <div className="month-grid-row month-board__head">
          <div className="month-calendar-title">
            <button
              type="button"
              className="month-calendar-date"
              aria-haspopup="dialog"
              aria-expanded={datePickerOpen}
              onClick={toggleDatePicker}
            >
              <strong>{dateColumns[activeSelectedDateIndex]?.fullDate}</strong>
              <span className="month-calendar-date__icon" aria-hidden="true" />
            </button>
            {datePickerOpen ? (
              <div className="month-date-picker" role="dialog" aria-label="日期选择">
                <div className="month-date-picker__header">
                  <div className="month-date-picker__nav">
                    <button type="button" aria-label="上一年" onClick={() => shiftPickerMonth(-12)}>
                      {'<<'}
                    </button>
                    <button type="button" aria-label="上一月" onClick={() => shiftPickerMonth(-1)}>
                      {'<'}
                    </button>
                  </div>
                  <strong>{pickerMonthLabel}</strong>
                  <div className="month-date-picker__nav">
                    <button type="button" aria-label="下一月" onClick={() => shiftPickerMonth(1)}>
                      {'>'}
                    </button>
                    <button type="button" aria-label="下一年" onClick={() => shiftPickerMonth(12)}>
                      {'>>'}
                    </button>
                  </div>
                </div>
                <div className="month-date-picker__weekdays">
                  {monthPickerWeekdays.map((weekday) => (
                    <span key={weekday}>{weekday}</span>
                  ))}
                </div>
                <div className="month-date-picker__grid">
                  {monthPickerCells.map((cell) => (
                    <button
                      key={cell.isoDate}
                      type="button"
                      data-date={cell.isoDate}
                      className={`month-date-picker__cell${cell.inViewMonth ? ' is-in-view' : ''}${cell.isSelected ? ' is-selected' : ''}`}
                      onClick={() => setDateFromPicker(parseIsoDate(cell.isoDate))}
                    >
                      <span>{cell.label}</span>
                    </button>
                  ))}
                </div>
                <button type="button" className="month-date-picker__today" onClick={() => setDateFromPicker(today)}>
                  今天
                </button>
              </div>
            ) : null}
            <button
              type="button"
              className="month-calendar-toggle"
              onClick={() => {
                setDatePickerOpen(false)
                setCollapsed((value) => !value)
              }}
            >
              {collapsed ? '全部展开' : '全部收起'}
            </button>
          </div>

          {dateColumns.map((date, index) => (
            <button
              key={date.date}
              type="button"
              data-testid="month-date-column"
              className={`timeline-date${index === activeSelectedDateIndex ? ' is-highlight' : ''}${date.hot ? ' is-hot' : ''}`}
              aria-current={index === activeSelectedDateIndex ? 'date' : undefined}
              onClick={() => {
                setSelectedDate(parseIsoDate(date.isoDate))
                setDatePickerOpen(false)
              }}
            >
              {index === activeSelectedDateIndex ? <i aria-hidden="true" /> : null}
              <strong>{date.date}</strong>
              <span>{date.weekday}</span>
              <em>{date.remain}</em>
            </button>
          ))}
        </div>

        {loadState === 'ready' && filteredRows.length === 0 ? (
          <div className="month-empty-state" role="status">
            暂无月房态数据
          </div>
        ) : null}

        {filteredRows.map((row, rowIndex) => (
          <div key={row.id} className="month-room-group">
            <div className="month-grid-row month-board__row is-type" data-row-kind="type" data-testid="month-type-row">
              <div className="timeline-room month-board__room">
                <strong>{row.label}</strong>
                <span className="month-room-collapse">收起</span>
              </div>

              {row.typeCells.map((cell, cellIndex) => (
                <button key={`${row.label}-type-${cellIndex}`} type="button" className={`month-cell tone-${cell.tone}`}>
                  <strong>{cell.title}</strong>
                </button>
              ))}
            </div>

            {!collapsed ? (
              <div className="month-grid-row month-board__row is-room" data-row-kind="room" data-testid="month-room-row">
                <div className="timeline-room month-board__room">
                  <strong>{row.roomLabel}</strong>
                </div>

                {createRenderedRoomCells(row.roomCells).map(({ cell, cellIndex, span }) => {
                  const key = `${rowIndex}-${cellIndex}`
                  const selected = selectedKeys.includes(key)
                  const selectable = isSelectableCell(cell)
                  const cellStatus: SelectedMonthCell['status'] = cell.tone === 'disabled' ? 'closed' : 'blank'
                  const renderTone =
                    displaySettings.colorMode === 'channel' && cell.tone !== 'booking-duplicate'
                      ? cell.channelTone ?? cell.tone
                      : cell.tone
                  const isBookingCell = cell.tone.startsWith('booking')
                  const showRoomStatusLabel = !isBookingCell && displaySettings.showRoomStatus

                  return (
                    <button
                      key={key}
                      type="button"
                      data-testid={cell.tone === 'blank' ? 'month-selectable-cell' : undefined}
                      data-order-span={span > 1 ? String(span) : undefined}
                      aria-selected={selectable ? selected : undefined}
                      data-selectable={selectable ? 'true' : undefined}
                      className={`month-cell tone-${renderTone}${selected ? ' is-selected' : ''}${selectable ? ' is-selectable' : ''}`}
                      style={span > 1 ? { gridColumn: `span ${span}` } : undefined}
                      onMouseEnter={(event) => {
                        if (cell.tone.startsWith('booking')) showBookingPopover(event, cell, row)
                      }}
                      onMouseLeave={() => setHoveredBooking(null)}
                      onClick={(event) => {
                        if (selectable) {
                          selectMonthCell(key, row, cellIndex, event.currentTarget.getBoundingClientRect(), cellStatus)
                          return
                        }
                        if (cell.tone.startsWith('booking')) openOrderDrawer(cell, row)
                      }}
                    >
                      {isBookingCell || showRoomStatusLabel ? <strong>{cell.title}</strong> : null}
                      {isBookingCell && cell.subtitle ? <span>{cell.subtitle}</span> : null}
                      {isBookingCell && cell.amount ? <em>{cell.amount}</em> : null}
                      {isBookingCell && cell.badge ? <b>{cell.badge}</b> : null}
                      {selected ? <i className="month-cell__check" aria-hidden="true">✓</i> : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {selectedCells.length > 0 && selectedCell && selectionAnchor ? (
        <div className="month-selection-actions" role="menu" aria-label="房态操作菜单" style={{ left: selectionAnchor.left, top: selectionAnchor.top }}>
          <button
            type="button"
            role="menuitem"
            onClick={() => void openOrderEntryForSelectedCell()}
          >
            {'\u5f55\u5355'}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => void (selectedCells.every((cell) => cell.status === 'closed') ? openSelectedMonthCellRoom() : closeSelectedMonthCellRoom())}
          >
            {selectedCells.every((cell) => cell.status === 'closed') ? '\u5f00\u623f' : '\u5173\u623f'}
          </button>
        </div>
      ) : null}

      {batchDialogMode ? (
        <BatchOperationDialog
          mode={batchDialogMode}
          state={batchDialogState}
          onChange={(patch) => setBatchDialogState((current) => ({ ...current, ...patch }))}
          onClose={() => setBatchDialogMode(null)}
          onConfirm={() => applyBatch(batchDialogMode)}
        />
      ) : null}

      {selectedBooking ? (
        <MonthOrderDrawer
          selectedBooking={selectedBooking}
          campId={activeStoreCampId || resolvedCampIdRef.current}
          onClose={() => setSelectedBooking(null)}
          onAction={showActionResult}
          onOrderChanged={() => loadSnapshot(roomType, query)}
        />
      ) : null}

      <OrderEntryDrawerHost
        isOpen={Boolean(orderEntryInitialRoom)}
        initialRoom={orderEntryInitialRoom}
        onClose={() => setOrderEntryInitialRoom(null)}
        onCreated={() => {
          setOrderEntryInitialRoom(null)
          void loadSnapshot(roomType, query)
        }}
        onActionMessage={setToastMessage}
      />

      {hoveredBooking ? (
        <section
          className="month-order-popover"
          style={{ left: hoveredBooking.left, top: hoveredBooking.top }}
          aria-label="订单悬浮信息"
        >
          <header>{hoveredBooking.roomType}-{hoveredBooking.roomLabel}</header>
          <div className="month-order-popover__content">
            <div>预订人: {hoveredBooking.cell.title}</div>
            <div>手机号: {hoveredBooking.cell.phone ?? '-'}</div>
            <div>入离时间: {hoveredBooking.cell.stayRange ?? '2026.05.18-05.20'}</div>
            <div>
              渠道来源: <span>{hoveredBooking.cell.subtitle ?? '-'}</span>
            </div>
            <div className="month-order-popover__price">
              <span>房费(减佣): <em>{hoveredBooking.cell.amount ?? '-'}</em></span>
              <span>订单总收入: <em>{hoveredBooking.cell.totalIncome ?? hoveredBooking.cell.amount ?? '-'}</em></span>
            </div>
            <div>备注: {hoveredBooking.cell.remark ?? '-'}</div>
          </div>
        </section>
      ) : null}
      {statusDrawer === 'legend' ? <RoomStatusLegendDrawer onClose={() => setStatusDrawer(null)} /> : null}
      {statusDrawer === 'display' ? (
        <RoomStatusDisplaySettingsDrawer
          settings={displaySettings}
          onClose={() => setStatusDrawer(null)}
          onChange={setDisplaySettings}
        />
      ) : null}
    </div>
  )
}

interface MonthOrderDrawerProps {
  selectedBooking: SelectedBooking
  campId?: string
  onClose: () => void
  onAction: (action: string) => void
  onOrderChanged?: () => Promise<unknown> | void
}

export function MonthOrderDrawer({ selectedBooking, campId = '', onClose, onAction, onOrderChanged }: MonthOrderDrawerProps) {
  const [activeTab, setActiveTab] = useState<OrderDrawerTab>('order')
  const [openDialog, setOpenDialog] = useState<MonthOrderDialog>(null)
  const [collectDialogOpen, setCollectDialogOpen] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [extraIncomeExpanded, setExtraIncomeExpanded] = useState(false)
  const [guestEditorOpen, setGuestEditorOpen] = useState(false)
  const [paymentEditorOpen, setPaymentEditorOpen] = useState(false)
  const [invoiceEditorOpen, setInvoiceEditorOpen] = useState(false)
  const [depositEditorOpen, setDepositEditorOpen] = useState(false)
  const [remarkEditorOpen, setRemarkEditorOpen] = useState(false)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagDialogKeyword, setTagDialogKeyword] = useState('')
  const [tagDraftSelection, setTagDraftSelection] = useState<string[]>([])
  const [uploadedAttachments, setUploadedAttachments] = useState<UploadedAttachment[]>([])
  const [overlayPanel, setOverlayPanel] = useState<MonthOrderOverlay>(null)
  const [actionFlow, setActionFlow] = useState<MonthOrderActionFlow | null>(null)
  const [editOrderRoomMode, setEditOrderRoomMode] = useState<EditOrderRoomMode>('all-day')
  const [checkoutType, setCheckoutType] = useState<'normal' | 'early'>('normal')
  const [localLiveStatus, setLocalLiveStatus] = useState(selectedBooking.cell.liveStatus ?? '')
  const [guestRegistered, setGuestRegistered] = useState(() => Boolean(selectedBooking.cell.guestRegisteredAt))
  const [checkInBlockedDialogOpen, setCheckInBlockedDialogOpen] = useState(false)
  const [guestForm, setGuestForm] = useState<MonthOrderGuestForm>(() =>
    createMonthOrderGuestForm(selectedBooking.cell.title, selectedBooking.cell.phone),
  )
  const [guestFormErrors, setGuestFormErrors] = useState<MonthOrderGuestFormErrors>({})
  const [operationMessage, setOperationMessage] = useState('')
  const [submittingAction, setSubmittingAction] = useState<null | 'guest' | 'checkin' | 'checkout' | 'change-room' | 'cancel' | 'skip-stock' | 'no-show'>(null)
  const [changeRoomOptions, setChangeRoomOptions] = useState<HouseMonthChangeRoomOption[]>([])
  const [changeRoomOptionsLoading, setChangeRoomOptionsLoading] = useState(false)
  const [changeRoomOptionsError, setChangeRoomOptionsError] = useState('')
  const [selectedChangeRoomId, setSelectedChangeRoomId] = useState('')
  const [changeRoomReason, setChangeRoomReason] = useState('')
  const orderState = resolveMonthOrderState(localLiveStatus || selectedBooking.cell.liveStatus)
  const statusLabel =
    orderState === 'checked-in'
      ? '入住中'
      : orderState === 'checked-out'
        ? '已退房'
      : orderState === 'cancelled'
        ? '已取消'
        : orderState === 'no-show'
          ? '未到店'
          : '待入住'
  const roomFee = formatCurrency(selectedBooking.cell.amount, '¥597.60')
  const totalIncome = formatCurrency(selectedBooking.cell.totalIncome, '¥664.00')
  const commission = formatCurrencyFromNumber(parseCurrencyNumber(totalIncome) * 0.1, '¥66.40')
  const roomFeeAmount = parseCurrencyNumber(roomFee)
  const commissionAmount = parseCurrencyNumber(commission)
  const totalIncomeAmount = parseCurrencyNumber(totalIncome)
  const nightlyAmount = formatCurrencyFromNumber(parseCurrencyNumber(roomFee) / 2, '¥298.80')
  const stayRange = selectedBooking.cell.stayRange ?? '2026.05.18-05.20'
  const { checkinDate, checkoutDate, nights: stayNights } = getStayRangeDetails(stayRange)
  const channelName = selectedBooking.cell.subtitle ?? '飞猪酒店'
  const orderId = selectedBooking.cell.orderId ?? ''
  const channelOrderNo = '5116035240226051843'
  const phone = selectedBooking.cell.phone ?? '-'
  const remark = selectedBooking.cell.remark ?? '-'
  const [selectedOrderTags, setSelectedOrderTags] = useState<string[]>([])
  const roomLogLabel = `${selectedBooking.roomType}(${selectedBooking.roomLabel})`
  const [operationLogs, setOperationLogs] = useState<MonthOrderLogEntry[]>(() =>
    createMonthOrderInitialLogs(selectedBooking, roomLogLabel),
  )
  const collectedAmount = 387
  const outstandingRoomFee = 0
  const depositAmount = 0
  const recommendedInvoiceAmount = 387
  const quickActions = useMemo<MonthOrderAction[]>(() => {
    const commonActions: MonthOrderAction[] = [
      { key: 'change-room', label: '换房', icon: '换', testId: 'month-order-action-change-room' },
      { key: 'cancel-arrange', label: '取消排房', icon: '排', testId: 'month-order-action-cancel-arrange' },
      { key: 'skip-stock', label: '不占库存', icon: '库', testId: 'month-order-action-skip-stock' },
      { key: 'skip-report', label: '不计入统计', icon: '统', testId: 'month-order-action-skip-report' },
      { key: 'continue', label: '设为续住单', icon: '续', testId: 'month-order-action-continue' },
      { key: 'cancel-order', label: '取消房单', icon: '消', testId: 'month-order-action-cancel-order' },
      { key: 'clean', label: '保洁', icon: '洁', testId: 'month-order-action-clean' },
      { key: 'print', label: '打印', icon: '打', testId: 'month-order-action-print' },
    ]

    if (orderState === 'checked-in') {
      return [
        { key: 'invite-renew', label: '邀请续住', icon: '邀', testId: 'month-order-action-invite-renew' },
        { key: 'guest', label: '入住人', icon: '住', testId: 'month-order-action-guest' },
        { key: 'late-checkout', label: '延迟退房', icon: '延', testId: 'month-order-action-late-checkout' },
        ...commonActions,
      ]
    }

    if (orderState === 'checked-out') {
      return commonActions
    }

    return [
      { key: 'invite', label: '邀请登记', icon: '邀', testId: 'month-order-action-invite' },
      { key: 'guest', label: '入住人', icon: '住', testId: 'month-order-action-guest' },
      { key: 'early-checkin', label: '提前入住', icon: '提', testId: 'month-order-action-early-checkin' },
      { key: 'noshow', label: '置为noshow', icon: 'N', testId: 'month-order-action-noshow' },
      ...commonActions,
    ]
  }, [orderState])
  const roomDisplayName = `${selectedBooking.roomType} ${selectedBooking.roomLabel}`
  const orderKey = `${selectedBooking.cell.orderId ?? selectedBooking.cell.title}-${selectedBooking.roomLabel}`
  const channelBlocks = [
    {
      key: 'basic',
      title: '基础信息',
      testId: 'month-channel-section-basic',
      items: [
        { label: '渠道单号', value: channelOrderNo, noWrap: true, wide: true },
        { label: '入住人', value: '-' },
        { label: '渠道订单状态', value: '-' },
        { label: '手机号', value: '-' },
        { label: '入住人数', value: '-' },
        { label: '房间数量', value: '1间', noWrap: true },
        { label: '预计到店时间', value: '-' },
        { label: '预定入离日期', value: `${checkinDate}至${checkoutDate}，共${stayNights}晚`, noWrap: true },
        { label: '预定房型', value: roomDisplayName },
      ],
    },
    {
      key: 'fee',
      title: '费用信息',
      testId: 'month-channel-section-fee',
      items: [
        { label: '订单总收入', value: totalIncomeAmount > 0 ? totalIncome : '¥0', noWrap: true },
        { label: '房费(减佣)', value: roomFee, noWrap: true },
        { label: '折扣信息', value: '-' },
        { label: '支付方式', value: '-' },
        { label: '发票要求', value: '-' },
      ],
    },
    {
      key: 'other',
      title: '其他信息',
      testId: 'month-channel-section-other',
      items: [
        { label: '预定人', value: selectedBooking.cell.title },
        { label: '预定人手机号', value: phone },
        { label: '预定时间', value: '2026-05-19 21:33:51', noWrap: true },
        { label: '渠道备注信息', value: remark || '-' },
      ],
    },
  ]
  const footerActions =
    orderState === 'checked-out'
      ? [
          { key: 'collect', label: '收款', className: 'is-primary', testId: 'month-order-footer-collect' },
          { key: 'more', label: '更多操作', className: '', testId: 'month-order-footer-more' },
        ]
      : orderState === 'checked-in'
        ? [
            { key: 'more', label: '更多操作', className: '', testId: 'month-order-footer-more' },
            { key: 'collect', label: '收款', className: 'is-primary', testId: 'month-order-footer-collect' },
            { key: 'renew', label: '续住', className: '', testId: 'month-order-footer-renew' },
            { key: 'checkin', label: '入住', className: 'is-primary', testId: 'month-order-footer-checkin' },
            { key: 'checkout', label: '退房', className: '', testId: 'month-order-footer-checkout' },
          ]
        : [
            { key: 'more', label: '更多操作', className: '', testId: 'month-order-footer-more' },
            { key: 'collect', label: '收款', className: 'is-primary', testId: 'month-order-footer-collect' },
            { key: 'credit-checkout', label: '信用住结账', className: '', testId: 'month-order-footer-credit-checkout' },
            { key: 'checkin', label: '入住', className: 'is-primary', testId: 'month-order-footer-checkin' },
            { key: 'checkout', label: '退房', className: '', testId: 'month-order-footer-checkout' },
          ]

  useEffect(() => {
    setActiveTab('order')
    setOpenDialog(null)
    setCollectDialogOpen(false)
    setMoreMenuOpen(false)
    setExtraIncomeExpanded(false)
    setGuestEditorOpen(false)
    setPaymentEditorOpen(false)
    setInvoiceEditorOpen(false)
    setDepositEditorOpen(false)
    setRemarkEditorOpen(false)
    setTagDialogOpen(false)
    setTagDialogKeyword('')
    setTagDraftSelection([])
    setSelectedOrderTags([])
    setUploadedAttachments([])
    setActionFlow(null)
    setOverlayPanel(null)
    setEditOrderRoomMode('all-day')
    setCheckoutType('normal')
    setLocalLiveStatus(selectedBooking.cell.liveStatus ?? '')
    setGuestRegistered(Boolean(selectedBooking.cell.guestRegisteredAt))
    setCheckInBlockedDialogOpen(false)
    setGuestForm(createMonthOrderGuestForm(selectedBooking.cell.title, selectedBooking.cell.phone))
    setGuestFormErrors({})
    setOperationLogs(createMonthOrderInitialLogs(selectedBooking, `${selectedBooking.roomType}(${selectedBooking.roomLabel})`))
    setOperationMessage('')
    setSubmittingAction(null)
    setChangeRoomOptions([])
    setChangeRoomOptionsLoading(false)
    setChangeRoomOptionsError('')
    setSelectedChangeRoomId('')
    setChangeRoomReason('')
  }, [orderKey])

  useEffect(() => {
    const closeMoreMenu = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('[data-testid="month-order-footer-more"]') || target.closest('[data-testid="month-order-footer-more-menu"]')) return
      setMoreMenuOpen(false)
    }

    window.addEventListener('click', closeMoreMenu)
    return () => window.removeEventListener('click', closeMoreMenu)
  }, [])

  useEffect(() => {
    if (actionFlow !== 'change-room') return

    const resolvedCampId = campId.trim()
    const resolvedOrderId = orderId.trim()
    if (!resolvedCampId || !resolvedOrderId) {
      setChangeRoomOptions([])
      setSelectedChangeRoomId('')
      setChangeRoomOptionsError(!resolvedCampId ? '缺少当前门店，无法加载可换房间' : '缺少订单号，无法加载可换房间')
      return
    }

    let ignored = false
    setChangeRoomOptionsLoading(true)
    setChangeRoomOptionsError('')
    setChangeRoomOptions([])
    setSelectedChangeRoomId('')

    void fetchHouseMonthChangeRoomOptions({ campId: resolvedCampId, orderId: resolvedOrderId })
      .then((response) => {
        if (ignored) return
        setChangeRoomOptions(response.rooms)
        setSelectedChangeRoomId(response.rooms[0]?.roomId ?? '')
      })
      .catch((error) => {
        if (ignored) return
        setChangeRoomOptionsError(`加载可换房间失败：${error instanceof Error ? error.message : String(error)}`)
      })
      .finally(() => {
        if (!ignored) setChangeRoomOptionsLoading(false)
      })

    return () => {
      ignored = true
    }
  }, [actionFlow, campId, orderId])

  const requireOrderActionContext = () => {
    const resolvedCampId = campId.trim()
    const resolvedOrderId = orderId.trim()
    if (!resolvedCampId) {
      setOperationMessage('缺少当前门店，无法操作订单')
      return null
    }
    if (!resolvedOrderId) {
      setOperationMessage('缺少订单号，无法操作订单')
      return null
    }
    return { campId: resolvedCampId, orderId: resolvedOrderId }
  }

  const refreshOrderSnapshot = () => {
    if (!onOrderChanged) return
    void Promise.resolve(onOrderChanged()).catch((error) => {
      setOperationMessage(`订单已更新，但刷新月房态失败：${error instanceof Error ? error.message : String(error)}`)
    })
  }

  const addOperationLog = (title: string, detail: string, occurredAtText?: string) => {
    const occurredAt = parseMonthOrderLogTimestamp(occurredAtText) ?? Date.now()
    setOperationLogs((current) => [createMonthOrderActionLog(title, detail, occurredAt), ...current])
  }

  const handleSaveGuest = async () => {
    const normalizedGuestName = guestForm.guestName.trim() || selectedBooking.cell.title
    const nextErrors: MonthOrderGuestFormErrors = {}
    const guestNameError = validatePersonName(normalizedGuestName)
    const guestMobileError = validateOptionalMainlandMobile(guestForm.guestMobile)
    const guestIdCardError = validateCredentialNumber(guestForm.guestIdCardType, guestForm.guestIdCard)

    if (guestNameError) nextErrors.guestName = guestNameError
    if (guestMobileError) nextErrors.guestMobile = guestMobileError
    if (guestIdCardError) nextErrors.guestIdCard = guestIdCardError

    if (Object.keys(nextErrors).length > 0) {
      setGuestFormErrors(nextErrors)
      setOperationMessage('请先修正红色提示的输入内容')
      return
    }

    const context = requireOrderActionContext()
    if (!context) return

    setSubmittingAction('guest')
    setOperationMessage('')
    try {
      const response = await saveHouseMonthOrderGuests({
        ...context,
        guests: [
          {
            guestName: normalizedGuestName,
            guestMobile: guestForm.guestMobile.trim(),
            guestIdCardType: guestForm.guestIdCardType,
            guestIdCard: guestForm.guestIdCard.trim(),
            guestType: 'adult',
          },
        ],
      })
      const message = response.message || '入住人保存成功'
      setGuestEditorOpen(false)
      setGuestRegistered(true)
      setGuestFormErrors({})
      setOperationMessage(message)
      addOperationLog('登记入住人', `入住人：${normalizedGuestName}`, response.guestRegisteredAt)
      onAction(message)
      refreshOrderSnapshot()
    } catch (error) {
      setOperationMessage(`保存入住人失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleCheckInOrder = async () => {
    const context = requireOrderActionContext()
    if (!context) return

    if (!guestRegistered) {
      setActionFlow(null)
      setCheckInBlockedDialogOpen(true)
      setOperationMessage('请先登记入住人')
      return
    }

    setSubmittingAction('checkin')
    setOperationMessage('')
    try {
      const response = await checkInHouseMonthOrder(context)
      const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '入住中')
      setLocalLiveStatus(nextLiveStatus)
      const message = response.message || '办理入住成功'
      setOperationMessage(message)
      addOperationLog('办理入住', `入住房间：${roomLogLabel}`, response.guestRegisteredAt)
      onAction(message)
      refreshOrderSnapshot()
    } catch (error) {
      setOperationMessage(`办理入住失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleCheckOutOrder = async () => {
    const context = requireOrderActionContext()
    if (!context) return

    setSubmittingAction('checkout')
    setOperationMessage('')
    try {
      const response = await checkOutHouseMonthOrder(context)
      const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '已退房')
      setLocalLiveStatus(nextLiveStatus)
      const message = response.message || '办理退房成功'
      setOperationMessage(message)
      addOperationLog('办理退房', `退房房间：${roomLogLabel}`, response.checkedOutAt)
      onAction(message)
      refreshOrderSnapshot()
    } catch (error) {
      setOperationMessage(`办理退房失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleChangeRoomOrder = async () => {
    const context = requireOrderActionContext()
    if (!context) return
    if (!selectedChangeRoomId) {
      setChangeRoomOptionsError('请选择要调整到的房间')
      return
    }

    const selectedRoom = changeRoomOptions.find((room) => room.roomId === selectedChangeRoomId)
    setSubmittingAction('change-room')
    setOperationMessage('')
    setChangeRoomOptionsError('')
    try {
      const response = await changeHouseMonthOrderRoom({
        ...context,
        roomId: selectedChangeRoomId,
        reason: changeRoomReason.trim(),
      })
      const roomName = response.roomName || selectedRoom?.roomName || selectedChangeRoomId
      const roomCategoryName = response.roomCategoryName || selectedRoom?.roomCategoryName || selectedBooking.roomType
      const message = response.message || '换房成功'
      setActionFlow(null)
      setOperationMessage(message)
      addOperationLog('换房', `从 ${roomDisplayName} 调整至 ${roomCategoryName} ${roomName}`)
      onAction(message)
      refreshOrderSnapshot()
    } catch (error) {
      setChangeRoomOptionsError(`换房失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleCancelOrder = async () => {
    const context = requireOrderActionContext()
    if (!context) return

    setSubmittingAction('cancel')
    setOperationMessage('')
    try {
      const response = await cancelHouseMonthOrder({
        ...context,
        reason: '订单详情取消房单',
      })
      const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '已取消')
      setLocalLiveStatus(nextLiveStatus)
      const message = response.message || '订单取消成功'
      setActionFlow(null)
      setOperationMessage(message)
      addOperationLog('取消房单', `取消房间：${roomLogLabel}`)
      onAction(message)
      refreshOrderSnapshot()
    } catch (error) {
      setOperationMessage(`取消房单失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleSkipStockOrder = async () => {
    const context = requireOrderActionContext()
    if (!context) return

    setSubmittingAction('skip-stock')
    setOperationMessage('')
    try {
      const response = await skipStockHouseMonthOrder({
        ...context,
        reason: '订单详情不占库存',
      })
      const message = response.message || '订单已释放库存并取消排房'
      setActionFlow(null)
      setOperationMessage(message)
      addOperationLog('不占库存', `释放库存并取消排房：${roomLogLabel}`)
      onAction(message)
      refreshOrderSnapshot()
    } catch (error) {
      setOperationMessage(`不占库存失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleMarkNoShowOrder = async () => {
    const context = requireOrderActionContext()
    if (!context) return

    setSubmittingAction('no-show')
    setOperationMessage('')
    try {
      const response = await markNoShowHouseMonthOrder({
        ...context,
        reason: '订单详情置为未到店',
      })
      const nextLiveStatus = resolveOrderActionLiveStatus(response.status, '未到店')
      setLocalLiveStatus(nextLiveStatus)
      const message = response.message || '已标记为未到店'
      setOpenDialog(null)
      setOperationMessage(message)
      addOperationLog('置为未到店', `未到店房间：${roomLogLabel}`)
      onAction(message)
      refreshOrderSnapshot()
    } catch (error) {
      setOperationMessage(`置为未到店失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSubmittingAction(null)
    }
  }

  const handleDrawerAction = (action: string) => {
    setMoreMenuOpen(false)
    if (action === '置为noshow') {
      setOpenDialog('noshow')
      return
    }
    if (action === '收款' || action === '添加收款') {
      setCollectDialogOpen(true)
      return
    }
    if (action === '订单提醒') {
      setOpenDialog('reminder')
      return
    }
    if (action === '入住人' || action === '登记入住人') {
      setGuestEditorOpen(true)
      return
    }
    if (action === '退房') {
      void handleCheckOutOrder()
      return
    }
    if (action === '邀请登记') {
      setActionFlow('invite')
      return
    }
    if (action === '提前入住') {
      setActionFlow('early-checkin')
      return
    }
    if (action === '邀请续住') {
      setActionFlow('invite-renew')
      return
    }
    if (action === '延迟退房') {
      setActionFlow('late-checkout')
      return
    }
    if (action === '换房') {
      setActionFlow('change-room')
      return
    }
    if (action === '取消排房') {
      setActionFlow('cancel-arrange')
      return
    }
    if (action === '不占库存') {
      setActionFlow('skip-stock')
      return
    }
    if (action === '不计入统计') {
      setActionFlow('skip-report')
      return
    }
    if (action === '设为续住单') {
      setActionFlow('continue')
      return
    }
    if (action === '取消房单') {
      setActionFlow('cancel-order')
      return
    }
    if (action === '保洁') {
      setActionFlow('clean')
      return
    }
    if (action === '打印') {
      setActionFlow('print')
      return
    }
    if (action === '信用住结账') {
      setActionFlow('credit-checkout')
      return
    }
    if (action === '入住') {
      void handleCheckInOrder()
      return
    }
    if (action === '续住') {
      setActionFlow('renew')
      return
    }
    onAction(action)
  }

  const handleMoreMenuAction = (action: string) => {
    setMoreMenuOpen(false)
    if (action === '编辑订单') {
      setOverlayPanel('edit-order')
      return
    }
    if (action === '修改费用') {
      setOpenDialog('modify-fee')
      return
    }
    onAction(action)
  }

  const handleChannelOrderCopy = () => {
    void copyText(channelOrderNo).catch(() => undefined).finally(() => {
      onAction('复制成功')
    })
  }

  const confirmDialog = () => {
    if (openDialog === 'noshow') {
      void handleMarkNoShowOrder()
      return
    }
    if (openDialog === 'checkout') {
      onAction(checkoutType === 'normal' ? '办理退房' : '提前退房')
    }
    if (openDialog === 'reminder') {
      onAction('添加订单提醒')
    }
    if (openDialog === 'modify-fee') {
      onAction('修改费用')
    }
    setOpenDialog(null)
  }

  const confirmCollectDialog = () => {
    onAction('添加收款记录')
    setCollectDialogOpen(false)
  }

  const confirmActionFlow = () => {
    if (!actionFlow) return
    onAction(resolveMonthOrderActionDialogConfig(actionFlow).actionLabel)
    setActionFlow(null)
  }

  const visibleTagOptions = ORDER_TAG_OPTIONS.filter((tag) => tag.includes(tagDialogKeyword.trim()))
  const allVisibleTagChecked = visibleTagOptions.length > 0 && visibleTagOptions.every((tag) => tagDraftSelection.includes(tag))
  const someVisibleTagChecked = visibleTagOptions.some((tag) => tagDraftSelection.includes(tag))
  const isChangeRoomSubmitting = submittingAction === 'change-room'
  const isCancelSubmitting = submittingAction === 'cancel'
  const isSkipStockSubmitting = submittingAction === 'skip-stock'
  const isNoShowSubmitting = submittingAction === 'no-show'
  const isActionConfirmDisabled =
    (actionFlow === 'checkin' && submittingAction === 'checkin') ||
    (actionFlow === 'cancel-order' && isCancelSubmitting) ||
    (actionFlow === 'skip-stock' && isSkipStockSubmitting) ||
    (actionFlow === 'change-room' &&
      (isChangeRoomSubmitting || changeRoomOptionsLoading || !selectedChangeRoomId || Boolean(changeRoomOptionsError && !changeRoomOptions.length)))

  const openTagDialog = () => {
    setTagDialogKeyword('')
    setTagDraftSelection(selectedOrderTags)
    setTagDialogOpen(true)
  }

  const closeTagDialog = () => {
    setTagDialogOpen(false)
    setTagDialogKeyword('')
    setTagDraftSelection([])
  }

  const toggleTagOption = (tag: string) => {
    setTagDraftSelection((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))
  }

  const toggleAllVisibleTags = () => {
    setTagDraftSelection((current) => {
      if (allVisibleTagChecked) {
        return current.filter((tag) => !visibleTagOptions.includes(tag as (typeof ORDER_TAG_OPTIONS)[number]))
      }
      const next = new Set(current)
      visibleTagOptions.forEach((tag) => next.add(tag))
      return Array.from(next)
    })
  }

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setUploadedAttachments((current) => [
      ...current,
      ...files.map((file, index) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${index}`,
        name: file.name,
      })),
    ])

    event.target.value = ''
  }

  const removeAttachment = (attachmentId: string) => {
    setUploadedAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))
  }

  const actionDialogConfig = actionFlow ? resolveMonthOrderActionDialogConfig(actionFlow) : null

  return (
    <aside className="month-order-drawer" role="dialog" aria-label="订单详情" onClick={(event) => event.stopPropagation()}>
      <header className="month-order-drawer__header">
        <div>
          <strong>{overlayPanel === 'edit-order' ? '编辑订单' : '订单详情'}</strong>
          <span>全日房</span>
        </div>
        <button
          type="button"
          aria-label={overlayPanel === 'edit-order' ? '关闭编辑订单' : '关闭订单详情'}
          onClick={overlayPanel === 'edit-order' ? () => setOverlayPanel(null) : onClose}
        >
          ×
        </button>
      </header>

      {overlayPanel === null ? (
        <nav className="month-order-drawer__tabs" aria-label="订单详情标签">
          <button type="button" className={activeTab === 'order' ? 'is-active' : ''} onClick={() => setActiveTab('order')}>
            订单信息
          </button>
          <button type="button" className={activeTab === 'channel' ? 'is-active' : ''} onClick={() => setActiveTab('channel')}>
            渠道信息
          </button>
          <button type="button" className={activeTab === 'log' ? 'is-active' : ''} onClick={() => setActiveTab('log')}>
            操作日志
          </button>
        </nav>
      ) : null}

      <div className="month-order-drawer__body" data-testid="month-order-drawer-body">
        {overlayPanel === 'edit-order' ? (
          <section className="month-order-edit-panel" data-testid="month-order-edit-panel">
            <div className="month-order-edit-tabs" role="tablist" aria-label="编辑订单房型">
              <button
                type="button"
                role="tab"
                aria-selected={editOrderRoomMode === 'all-day'}
                className={editOrderRoomMode === 'all-day' ? 'is-active' : ''}
                onClick={() => setEditOrderRoomMode('all-day')}
              >
                全日房
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editOrderRoomMode === 'hourly'}
                className={editOrderRoomMode === 'hourly' ? 'is-active' : ''}
                onClick={() => setEditOrderRoomMode('hourly')}
              >
                钟点房
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={editOrderRoomMode === 'long-stay'}
                className={editOrderRoomMode === 'long-stay' ? 'is-active' : ''}
                onClick={() => setEditOrderRoomMode('long-stay')}
              >
                长租房
              </button>
            </div>

            <section className="month-order-edit-section">
              <div className="month-order-edit-section__header">
                <h3>基本信息</h3>
              </div>
              <div className="month-order-edit-grid">
                <label>
                  <span>*姓名</span>
                  <input className="month-order-dialog__input" defaultValue={selectedBooking.cell.title} />
                </label>
                <label>
                  <span>手机号</span>
                  <input className="month-order-dialog__input" defaultValue={phone === '-' ? '' : phone} />
                </label>
                <label>
                  <span>订单来源</span>
                  <input className="month-order-dialog__input" defaultValue={channelName} />
                </label>
                <label>
                  <span>渠道单号</span>
                  <input className="month-order-dialog__input" defaultValue={channelOrderNo} />
                </label>
              </div>
            </section>

            <section className="month-order-edit-section">
              <div className="month-order-edit-section__header month-order-edit-section__header--summary">
                <h3>房间/费用信息</h3>
                <div className="month-order-edit-section__summary">
                  <span>房费总计:{totalIncome}</span>
                  <span>共1间房</span>
                </div>
              </div>
              <div className="month-order-edit-room-row">
                <div>
                  <strong>{roomDisplayName}</strong>
                  <span>{stayRange} · 1晚 · 1人</span>
                </div>
                <button type="button" onClick={() => handleDrawerAction('登记入住人')}>
                  登记
                </button>
              </div>
              <div className="month-order-edit-grid month-order-edit-grid--compact">
                <label>
                  <span>佣金</span>
                  <input className="month-order-dialog__input" defaultValue={String(commissionAmount || 0)} />
                </label>
                <label>
                  <span>押金</span>
                  <input className="month-order-dialog__input" defaultValue="0" />
                </label>
              </div>
            </section>

            <section className="month-order-edit-section">
              <div className="month-order-edit-section__header">
                <h3>开票信息</h3>
              </div>
              <div className="month-order-edit-grid month-order-edit-grid--compact">
                <label>
                  <span>开票方</span>
                  <input className="month-order-dialog__input" placeholder="请选择开票方" />
                </label>
                <label>
                  <span>开票金额</span>
                  <input className="month-order-dialog__input" defaultValue={String(totalIncomeAmount || 0)} />
                </label>
              </div>
            </section>

            <section className="month-order-edit-section">
              <div className="month-order-edit-inline-row">
                <div className="month-order-edit-inline-row__label">订单提醒</div>
                <button type="button" className="month-order-mini-action" onClick={() => handleDrawerAction('订单提醒')}>
                  +
                </button>
              </div>
              <div className="month-order-edit-inline-row">
                <div className="month-order-edit-inline-row__label">订单标签</div>
                <button type="button" className="month-order-mini-action" onClick={openTagDialog}>
                  +
                </button>
              </div>
              <label className="month-order-edit-remark">
                <span>订单备注</span>
                <textarea className="month-order-dialog__textarea" defaultValue={remark} />
              </label>
            </section>

            <section className="month-order-edit-section">
              <div className="month-order-edit-section__header">
                <h3>关联订单</h3>
              </div>
              <div className="month-order-edit-related-head">
                <span>订单号</span>
                <span>房间</span>
                <span>状态</span>
              </div>
            </section>
          </section>
        ) : null}

        {overlayPanel === null && activeTab === 'order' ? (
          <>
            <section className="month-order-card">
              <div className="month-order-card__guest">
                <strong>{selectedBooking.cell.title}</strong>
                <span>{channelName}</span>
              </div>
              <p>手机号：{phone}</p>
              <p>渠道单号：{channelOrderNo}</p>
            </section>

            <section className="month-room-order-card">
              <div className="month-room-order-card__top">
                <strong>
                  {selectedBooking.roomType}（{selectedBooking.roomLabel}）
                </strong>
                <span>{statusLabel}</span>
              </div>
              <div className="month-room-order-card__stay">{stayRange} 2晚</div>
              <div className="month-room-order-card__amount">{totalIncome}</div>
              <div className="month-room-order-card__guest">
                <span>入住人（0/1）</span>
                <button type="button" data-testid="month-order-register-guest" onClick={() => handleDrawerAction('登记入住人')}>
                  登记入住人
                </button>
              </div>
              {guestEditorOpen ? (
                <div className="month-room-order-card__guest-editor" data-testid="month-order-guest-editor">
                  <div className="month-order-guest-editor__grid">
                    <label className={`month-order-guest-field ${guestFormErrors.guestName ? 'has-error' : ''}`}>
                      <span>客户姓名</span>
                      <input
                        className="month-order-dialog__input"
                        placeholder="请输入客户姓名"
                        value={guestForm.guestName}
                        onChange={(event) => {
                          setGuestForm((current) => ({ ...current, guestName: event.target.value }))
                          setGuestFormErrors((current) => ({ ...current, guestName: undefined }))
                        }}
                      />
                      {guestFormErrors.guestName ? <em>{guestFormErrors.guestName}</em> : null}
                    </label>
                    <label className={`month-order-guest-field ${guestFormErrors.guestMobile ? 'has-error' : ''}`}>
                      <span>手机号</span>
                      <input
                        className="month-order-dialog__input"
                        placeholder="请输入手机号"
                        value={guestForm.guestMobile}
                        onChange={(event) => {
                          setGuestForm((current) => ({ ...current, guestMobile: event.target.value }))
                          setGuestFormErrors((current) => ({ ...current, guestMobile: undefined }))
                        }}
                      />
                      {guestFormErrors.guestMobile ? <em>{guestFormErrors.guestMobile}</em> : null}
                    </label>
                    <label className="month-order-guest-field">
                      <span>证件类型</span>
                      <select
                        className="month-order-dialog__select"
                        value={guestForm.guestIdCardType}
                        onChange={(event) => {
                          setGuestForm((current) => ({ ...current, guestIdCardType: event.target.value }))
                          setGuestFormErrors((current) => ({ ...current, guestIdCard: undefined }))
                        }}
                      >
                        {ORDER_GUEST_DOCUMENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={`month-order-guest-field ${guestFormErrors.guestIdCard ? 'has-error' : ''}`}>
                      <span>证件号</span>
                      <input
                        className="month-order-dialog__input"
                        placeholder="请输入证件号码"
                        value={guestForm.guestIdCard}
                        onChange={(event) => {
                          setGuestForm((current) => ({ ...current, guestIdCard: event.target.value }))
                          setGuestFormErrors((current) => ({ ...current, guestIdCard: undefined }))
                        }}
                      />
                      {guestFormErrors.guestIdCard ? <em>{guestFormErrors.guestIdCard}</em> : null}
                    </label>
                  </div>
                  <div className="month-order-guest-editor__actions">
                    <button type="button" onClick={() => onAction('读卡')}>
                      读卡
                    </button>
                    <button type="button" onClick={() => setGuestEditorOpen(false)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="is-primary"
                      disabled={submittingAction === 'guest'}
                      onClick={() => void handleSaveGuest()}
                    >
                      {submittingAction === 'guest' ? '保存中' : '保存'}
                    </button>
                  </div>
                </div>
              ) : null}
              {operationMessage ? (
                <div className="month-order-operation-message" role="status">
                  {operationMessage}
                </div>
              ) : null}
              <em>{selectedBooking.roomType}</em>
            </section>

            <section className="month-finance-card">
              <div className="month-finance-summary">
                <span>
                  房费(减佣):<strong>{roomFee}</strong>
                </span>
                <span>
                  订单总收入:<strong>{totalIncome}</strong>
                </span>
              </div>
              <div className="month-finance-meta">
                <span>佣金:{commission}</span>
                <span>房费(含佣):{totalIncome}</span>
                <span>其他消费:¥0.00</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>房间/日期</th>
                    <th>2026-05-18</th>
                    <th>2026-05-19</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {selectedBooking.roomType}({selectedBooking.roomLabel})
                    </td>
                    <td>{nightlyAmount}</td>
                    <td>{nightlyAmount}</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-payment">
              <div className="month-order-section-header month-order-section-header--summary">
                <h3>房费收款</h3>
                {paymentEditorOpen ? (
                  <div className="month-order-section-inline-actions">
                    <button type="button" className="month-order-mini-action" onClick={() => setPaymentEditorOpen(false)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="month-order-mini-action"
                      onClick={() => {
                        setPaymentEditorOpen(false)
                        onAction('保存房费收款')
                      }}
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="month-order-section-summary">
                      <span>收款金额: ¥{collectedAmount}</span>
                      <span>房费欠款: ¥{outstandingRoomFee}</span>
                    </div>
                    <button
                      type="button"
                      className="month-order-icon-action"
                      data-testid="month-order-section-payment-edit"
                      aria-label="编辑房费收款"
                      onClick={() => setPaymentEditorOpen(true)}
                    >
                      ✎
                    </button>
                  </>
                )}
              </div>
              {paymentEditorOpen ? (
                <div className="month-order-inline-form month-order-inline-form--payment" data-testid="month-order-section-payment-editor">
                  <label>
                    <span>已收房费：</span>
                    <input className="month-order-dialog__input" defaultValue={String(collectedAmount)} />
                  </label>
                  <label>
                    <span>收款方式：</span>
                    <select className="month-order-dialog__select" defaultValue="平台代收">
                      <option value="平台代收">平台代收</option>
                      <option value="线下收款">线下收款</option>
                    </select>
                  </label>
                  <label>
                    <span>收款时间：</span>
                    <input className="month-order-dialog__input" defaultValue="2026-05-19 20:00" />
                  </label>
                </div>
              ) : null}
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-invoice">
              <div className="month-order-section-header month-order-section-header--summary">
                <h3>开票信息</h3>
                {invoiceEditorOpen ? (
                  <div className="month-order-section-inline-actions">
                    <button type="button" className="month-order-mini-action" onClick={() => setInvoiceEditorOpen(false)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="month-order-mini-action"
                      onClick={() => {
                        setInvoiceEditorOpen(false)
                        onAction('保存开票信息')
                      }}
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="month-order-icon-action"
                    data-testid="month-order-section-invoice-edit"
                    aria-label="编辑开票信息"
                    onClick={() => setInvoiceEditorOpen(true)}
                  >
                    ✎
                  </button>
                )}
              </div>
              {invoiceEditorOpen ? (
                <div className="month-order-inline-form" data-testid="month-order-section-invoice-editor">
                  <label>
                    <span>开票方：</span>
                    <input className="month-order-dialog__input" placeholder="请选择开票方" />
                  </label>
                  <label>
                    <span>开票金额：</span>
                    <div className="month-order-inline-money">
                      <span>￥</span>
                      <input className="month-order-dialog__input" defaultValue={String(totalIncomeAmount || 0)} />
                    </div>
                  </label>
                  <p>建议开票金额：¥{recommendedInvoiceAmount}</p>
                </div>
              ) : null}
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-extra-income">
              <div className="month-order-section-header month-order-section-header--summary">
                <button
                  type="button"
                  className="month-order-collapse-toggle"
                  data-testid="month-order-section-extra-income-toggle"
                  aria-label={extraIncomeExpanded ? '收起其他收入支出' : '展开其他收入支出'}
                  aria-expanded={extraIncomeExpanded}
                  onClick={() => setExtraIncomeExpanded((current) => !current)}
                >
                  {extraIncomeExpanded ? '收起' : '展开'}
                </button>
                <h3>其他收入/支出</h3>
                <div className="month-order-section-summary">
                  <span>0项/</span>
                  <span>¥0.00</span>
                </div>
                <button type="button" className="month-order-mini-action" aria-label="新增其他收入支出" onClick={() => onAction('其他收入支出')}>
                  +
                </button>
              </div>
              {extraIncomeExpanded ? (
                <div className="month-order-empty-table" data-testid="month-order-section-extra-income-table">
                  暂无其他收入/支出记录
                </div>
              ) : null}
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-deposit">
              <div className="month-order-section-header month-order-section-header--summary">
                <h3>押金信息</h3>
                {depositEditorOpen ? (
                  <div className="month-order-section-inline-actions">
                    <button type="button" className="month-order-mini-action" onClick={() => setDepositEditorOpen(false)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="month-order-mini-action"
                      onClick={() => {
                        setDepositEditorOpen(false)
                        onAction('保存押金信息')
                      }}
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="month-order-section-summary">
                      <span>押金金额: ¥{depositAmount}</span>
                    </div>
                    <button
                      type="button"
                      className="month-order-icon-action"
                      data-testid="month-order-section-deposit-edit"
                      aria-label="编辑押金信息"
                      onClick={() => setDepositEditorOpen(true)}
                    >
                      ✎
                    </button>
                  </>
                )}
              </div>
              {depositEditorOpen ? (
                <div className="month-order-inline-form month-order-inline-form--deposit" data-testid="month-order-section-deposit-editor">
                  <label className="month-order-inline-form__single-line">
                    <span>修改押金：</span>
                    <div className="month-order-inline-money">
                      <span>¥</span>
                      <input className="month-order-dialog__input" defaultValue={String(depositAmount)} />
                    </div>
                    <button type="button" className="month-order-inline-link" onClick={() => onAction('一键免押')}>
                      一键免押
                    </button>
                  </label>
                </div>
              ) : null}
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-arrears">
              <div className="month-order-section-header">
                <h3>订单欠款</h3>
              </div>
              <div className="month-order-arrears-shell" data-testid="month-order-section-arrears-body">
                <div className="month-order-arrears-shell__content" />
              </div>
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-remark">
              <div className="month-order-section-header">
                <h3>订单备注</h3>
                {remarkEditorOpen ? (
                  <div className="month-order-section-inline-actions">
                    <button type="button" className="month-order-mini-action" onClick={() => setRemarkEditorOpen(false)}>
                      取消
                    </button>
                    <button
                      type="button"
                      className="month-order-mini-action"
                      onClick={() => {
                        setRemarkEditorOpen(false)
                        onAction('保存订单备注')
                      }}
                    >
                      保存
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="month-order-icon-action"
                    data-testid="month-order-section-remark-edit"
                    aria-label="编辑订单备注"
                    onClick={() => setRemarkEditorOpen(true)}
                  >
                    ✎
                  </button>
                )}
              </div>
              {remarkEditorOpen ? (
                <div className="month-order-inline-form" data-testid="month-order-section-remark-editor">
                  <textarea className="month-order-dialog__textarea" defaultValue={remark} />
                </div>
              ) : (
                <p>{remark}</p>
              )}
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-tags">
              <div className="month-order-section-header">
                <h3>订单标签</h3>
                <button
                  type="button"
                  className="month-order-mini-action"
                  data-testid="month-order-section-tags-add"
                  aria-label="新增订单标签"
                  onClick={openTagDialog}
                >
                  +
                </button>
              </div>
              {selectedOrderTags.length ? (
                <div>
                  {selectedOrderTags.map((tag) => (
                    <span key={tag} className="month-info-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-reminder">
              <div className="month-order-section-header">
                <h3>订单提醒</h3>
                <button
                  type="button"
                  className="month-order-mini-action"
                  data-testid="month-order-section-reminder-add"
                  aria-label="新增订单提醒"
                  onClick={() => handleDrawerAction('订单提醒')}
                >
                  +
                </button>
              </div>
              <p>入住前30分钟短信提醒</p>
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-attachment">
              <div className="month-order-section-header">
                <h3>订单附件</h3>
                <label className="month-order-upload-trigger" aria-label="新增订单附件" data-testid="month-order-section-attachment-upload">
                  <input type="file" accept="*" onChange={handleAttachmentChange} />
                  <span>+</span>
                </label>
              </div>
              <div className="month-order-upload-list" data-testid="month-order-section-attachment-list">
                {uploadedAttachments.map((attachment) => (
                  <div key={attachment.id} className="month-order-upload-item" data-testid="month-order-section-attachment-item">
                    <span className="month-order-upload-item__icon" aria-hidden="true">
                      <svg viewBox="64 64 896 896" focusable="false">
                        <path d="M779.3 196.6c-94.2-94.2-247.6-94.2-341.7 0l-261 260.8c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l261-260.8c32.4-32.4 75.5-50.2 121.3-50.2s88.9 17.8 121.2 50.2c32.4 32.4 50.2 75.5 50.2 121.2 0 45.8-17.8 88.8-50.2 121.2l-266 265.9-43.1 43.1c-40.3 40.3-105.8 40.3-146.1 0-19.5-19.5-30.2-45.4-30.2-73s10.7-53.5 30.2-73l263.9-263.8c6.7-6.6 15.5-10.3 24.9-10.3h.1c9.4 0 18.1 3.7 24.7 10.3 6.7 6.7 10.3 15.5 10.3 24.9 0 9.3-3.7 18.1-10.3 24.7L372.4 653c-1.7 1.7-2.6 4-2.6 6.4s.9 4.7 2.6 6.4l36.9 36.9a9 9 0 0012.7 0l215.6-215.6c19.9-19.9 30.8-46.3 30.8-74.4s-11-54.6-30.8-74.4c-41.1-41.1-107.9-41-149 0L463 364 224.8 602.1A172.22 172.22 0 00174 724.8c0 46.3 18.1 89.8 50.8 122.5 33.9 33.8 78.3 50.7 122.7 50.7 44.4 0 88.8-16.9 122.6-50.7l309.2-309C824.8 492.7 850 432 850 367.5c.1-64.6-25.1-125.3-70.7-170.9z" />
                      </svg>
                    </span>
                    <span className="month-order-upload-item__name" title={attachment.name}>
                      {attachment.name}
                    </span>
                    <button
                      type="button"
                      className="month-order-upload-item__delete"
                      aria-label={`删除附件 ${attachment.name}`}
                      data-testid="month-order-section-attachment-delete"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      <svg viewBox="64 64 896 896" focusable="false">
                        <path d="M360 184h-8c4.4 0 8-3.6 8-8v8h304v-8c0 4.4 3.6 8 8 8h-8v72h72v-80c0-35.3-28.7-64-64-64H352c-35.3 0-64 28.7-64 64v80h72v-72zm504 72H160c-17.7 0-32 14.3-32 32v32c0 4.4 3.6 8 8 8h60.4l24.7 523c1.6 34.1 29.8 61 63.9 61h454c34.2 0 62.3-26.8 63.9-61l24.7-523H888c4.4 0 8-3.6 8-8v-32c0-17.7-14.3-32-32-32zM731.3 840H292.7l-24.2-512h487l-24.2 512z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="month-info-block month-order-section-row" data-testid="month-order-section-meta">
              <div className="month-order-key-value-list">
                <div className="month-order-key-value-row">
                  <span>创建人</span>
                  <strong>无</strong>
                </div>
                <div className="month-order-key-value-row">
                  <span>订单号</span>
                  <strong>{orderId}</strong>
                </div>
                <div className="month-order-key-value-row">
                  <span>预订时间</span>
                  <strong>2026.05.16 17:41:03</strong>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {overlayPanel === null && activeTab === 'channel' ? (
          <section className="month-channel-panel" data-testid="month-channel-panel">
            {channelBlocks.map((section) => (
              <section key={section.key} className="month-channel-section" data-testid={section.testId}>
                <div className="month-channel-section__header">
                  <h3>{section.title}</h3>
                </div>
                <div className={`month-channel-grid${section.key === 'fee' ? ' month-channel-grid--compact' : ''}`}>
                  {section.items.map((item, itemIndex) => (
                    <div
                      key={item.label}
                      className={`month-channel-kv${item.wide || item.label === '预定房型' || item.label === '发票要求' || item.label === '渠道备注信息' ? ' month-channel-kv--wide' : ''}${
                        item.noWrap ? ' month-channel-kv--no-wrap' : ''
                      }${
                        itemIndex === 0 && section.key === 'basic' ? ' month-channel-kv--with-copy' : ''
                      }`}
                    >
                      <span>{item.label}:</span>
                      <strong>{item.value}</strong>
                      {itemIndex === 0 && section.key === 'basic' ? (
                        <button
                          type="button"
                          className="month-channel-copy"
                          aria-label="复制渠道订单号"
                          data-testid="month-channel-copy-order-no"
                          onClick={handleChannelOrderCopy}
                        >
                          <span aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </section>
        ) : null}

        {overlayPanel === null && activeTab === 'log' ? (
          <section className="month-order-log-panel" data-testid="month-order-log-panel">
            <ol className="month-order-log-timeline" data-testid="month-order-log-timeline">
              {operationLogs.map((log) => (
                <li key={log.id} className="month-order-log-item" data-testid="month-order-log-item">
                  <time className="month-order-log-time" dateTime={new Date(log.occurredAt).toISOString()}>
                    <span>{formatMonthOrderLogDate(log.occurredAt)}</span>
                    <span>{formatMonthOrderLogTime(log.occurredAt)}</span>
                  </time>
                  <span className="month-order-log-dot" aria-hidden="true" />
                  <article className="month-order-log-card">
                    <header>
                      <strong>{log.title}</strong>
                      <span>操作人：{log.operator}</span>
                    </header>
                    <p>{log.detail}</p>
                  </article>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </div>

      {overlayPanel === 'edit-order' ? (
        <footer className="month-order-drawer__footer month-order-drawer__footer--edit" data-testid="month-order-drawer-footer">
          <div className="month-order-edit-footer">
            <div className="month-order-edit-footer__summary">
              <span>房费(减佣):{roomFee}</span>
              <span>订单总收入:{totalIncome}</span>
            </div>
            <button type="button" className="is-primary" data-testid="month-order-edit-submit" onClick={() => onAction('提交编辑订单')}>
              提交
            </button>
          </div>
        </footer>
      ) : (
        <footer className="month-order-drawer__footer" data-testid="month-order-drawer-footer">
          <div className="month-order-actions">
            {quickActions.map((action) => (
              <button
                key={action.key}
                type="button"
                className="month-order-action-button"
                data-testid={action.testId}
                onClick={() => handleDrawerAction(action.label)}
              >
                <span className="month-order-action-icon" aria-hidden="true">
                  {action.icon}
                </span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
          <div className="month-order-footer-row">
            <div>
              <span>房费(减佣)：{roomFee}</span>
              <span>订单总收入：{totalIncome}</span>
            </div>
            {footerActions.map((action) => (
              <button
                key={action.key}
                type="button"
                className={action.className || undefined}
                data-testid={action.testId}
                disabled={
                  (action.key === 'checkin' && submittingAction === 'checkin') ||
                  (action.key === 'checkout' && submittingAction === 'checkout')
                }
                onClick={() => {
                  if (action.key === 'more') {
                    setMoreMenuOpen((current) => !current)
                    return
                  }
                  if (action.key === 'checkin') {
                    void handleCheckInOrder()
                    return
                  }
                  if (action.key === 'checkout') {
                    void handleCheckOutOrder()
                    return
                  }
                  handleDrawerAction(action.label)
                }}
              >
                {action.key === 'checkin' && submittingAction === 'checkin'
                  ? '入住中'
                  : action.key === 'checkout' && submittingAction === 'checkout'
                    ? '退房中'
                    : action.label}
              </button>
            ))}
            {moreMenuOpen ? (
              <div className="month-order-more-menu" role="menu" aria-label="月房态订单更多操作" data-testid="month-order-footer-more-menu">
                <button type="button" role="menuitem" data-testid="month-order-more-item-edit-order" onClick={() => handleMoreMenuAction('编辑订单')}>
                  编辑订单
                </button>
                <button type="button" role="menuitem" data-testid="month-order-more-item-modify-fee" onClick={() => handleMoreMenuAction('修改费用')}>
                  修改费用
                </button>
              </div>
            ) : null}
          </div>
        </footer>
      )}

      {checkInBlockedDialogOpen ? (
        <div className="month-order-dialog-scrim" onClick={() => setCheckInBlockedDialogOpen(false)}>
          <section
            className="month-order-dialog month-order-dialog--medium"
            role="dialog"
            aria-modal="true"
            aria-label="入住提示"
            data-testid="month-order-dialog-checkin-blocked"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>入住提示</strong>
              <button type="button" aria-label="关闭入住提示" onClick={() => setCheckInBlockedDialogOpen(false)}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body">
              <p>请先登记入住人</p>
            </div>
            <footer className="month-order-dialog__footer">
              <button type="button" onClick={() => setCheckInBlockedDialogOpen(false)}>
                知道了
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  setCheckInBlockedDialogOpen(false)
                  setGuestEditorOpen(true)
                }}
              >
                去登记
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {openDialog === 'noshow' ? (
        <div className="month-order-dialog-scrim" onClick={() => setOpenDialog(null)}>
          <section
            className="month-order-dialog month-order-dialog--medium"
            role="dialog"
            aria-modal="true"
            aria-label="置为noshow失约单"
            data-testid="month-order-dialog-noshow"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>置为noshow失约单</strong>
              <button type="button" aria-label="关闭置为noshow失约单" onClick={() => setOpenDialog(null)}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body">
              <div className="month-order-dialog__selection">
                <label>
                  <input type="checkbox" checked readOnly />
                  <span>选择全部房间</span>
                </label>
                <span>已选1间 共1间</span>
              </div>
              <div className="month-order-dialog__room">
                <label className="month-order-dialog__room-check">
                  <input type="checkbox" checked readOnly />
                </label>
                <div className="month-order-dialog__room-content">
                  <div className="month-order-dialog__room-title">
                    <strong>{roomDisplayName}</strong>
                    <span>{statusLabel}</span>
                  </div>
                  <div className="month-order-dialog__room-meta">
                    <span>{stayRange.replace(/\./g, '.').replace('-', '-')} (2晚)</span>
                    <strong>¥1624</strong>
                  </div>
                </div>
              </div>
              {operationMessage.startsWith('置为未到店失败') ? (
                <div className="month-order-dialog__error" role="alert">
                  {operationMessage}
                </div>
              ) : null}
            </div>
            <footer className="month-order-dialog__footer">
              <button type="button" onClick={() => setOpenDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" disabled={isNoShowSubmitting} onClick={confirmDialog}>
                {isNoShowSubmitting ? '处理中' : '确定'}
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {openDialog === 'checkout' ? (
        <div className="month-order-dialog-scrim" onClick={() => setOpenDialog(null)}>
          <section
            className="month-order-dialog month-order-dialog--large"
            role="dialog"
            aria-modal="true"
            aria-label="办理退房"
            data-testid="month-order-dialog-checkout"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>办理退房</strong>
              <button type="button" aria-label="关闭办理退房" onClick={() => setOpenDialog(null)}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body month-order-dialog__body--scroll">
              <section className="month-order-dialog__group">
                <h3>租客信息</h3>
                <div className="month-order-dialog__grid">
                  <span>租客姓名: {selectedBooking.cell.title}</span>
                  <span>手机号码: {phone}</span>
                </div>
              </section>
              <section className="month-order-dialog__group">
                <h3>租赁信息</h3>
                <div className="month-order-dialog__grid">
                  <span>房间信息: {roomDisplayName}</span>
                  <span>合同时间: 2026-05-16 至 2026-05-16</span>
                  <span>合同期限: 2晚</span>
                  <span>每月租金: ¥0</span>
                  <span>押金: ¥0</span>
                  <span>缴费方式: 线上预付</span>
                </div>
              </section>
              <section className="month-order-dialog__group">
                <h3>退房信息</h3>
                <div className="month-order-dialog__radio-group">
                  <label>
                    <input type="radio" name="month-checkout-type" checked={checkoutType === 'normal'} onChange={() => setCheckoutType('normal')} />
                    <span>正常退房</span>
                  </label>
                  <label>
                    <input type="radio" name="month-checkout-type" checked={checkoutType === 'early'} onChange={() => setCheckoutType('early')} />
                    <span>提前退房</span>
                  </label>
                </div>
              </section>
              <section className="month-order-dialog__group">
                <div className="month-order-dialog__checkout-bar">
                  <span>账单信息</span>
                  <button
                    type="button"
                    className="is-primary"
                    data-testid="month-order-dialog-checkout-add-collect"
                    onClick={() => handleDrawerAction('添加收款')}
                  >
                    添加收款
                  </button>
                </div>
              </section>
              <section className="month-order-dialog__group">
                <div className="month-order-dialog__grid month-order-dialog__grid--inputs">
                  <label>
                    <span>应退押金</span>
                    <input className="month-order-dialog__input" value="0 元" readOnly />
                  </label>
                  <label>
                    <span>退押金</span>
                    <input className="month-order-dialog__input" value="0 元" readOnly />
                  </label>
                  <label>
                    <span>扣押金</span>
                    <input className="month-order-dialog__input" value="0 元" readOnly />
                  </label>
                </div>
              </section>
              <section className="month-order-dialog__group">
                <label className="month-order-dialog__textarea-label">
                  <span>备注信息</span>
                  <textarea className="month-order-dialog__textarea" placeholder="限制300字以内" defaultValue={remark} />
                </label>
              </section>
            </div>
            <footer className="month-order-dialog__footer">
              <button type="button" onClick={() => setOpenDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={confirmDialog}>
                办理退房
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {collectDialogOpen ? (
        <div className="month-order-dialog-scrim" onClick={() => setCollectDialogOpen(false)}>
          <section
            className="month-order-dialog month-order-dialog--medium"
            role="dialog"
            aria-modal="true"
            aria-label="添加收款记录"
            data-testid="month-order-dialog-collect"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>添加收款记录</strong>
              <button type="button" aria-label="关闭添加收款记录" onClick={() => setCollectDialogOpen(false)}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body">
              <div className="month-order-dialog__stats">
                <div className="month-order-dialog__stat">
                  <span>应收款</span>
                  <strong>¥1624</strong>
                </div>
                <div className="month-order-dialog__stat">
                  <span>已收款</span>
                  <strong>¥0</strong>
                </div>
                <div className="month-order-dialog__stat month-order-dialog__stat--pending">
                  <span>待收款</span>
                  <strong>¥0</strong>
                </div>
              </div>
              <div className="month-order-dialog__form-grid">
                <label>
                  <span>类型</span>
                  <select className="month-order-dialog__select" defaultValue="">
                    <option value="" disabled>
                      请选择类型
                    </option>
                    <option value="房费">房费</option>
                  </select>
                </label>
                <label>
                  <span>支付方式</span>
                  <select className="month-order-dialog__select" defaultValue="">
                    <option value="" disabled>
                      请选择支付方式
                    </option>
                    <option value="线上预付">线上预付</option>
                    <option value="线下收款">线下收款</option>
                  </select>
                </label>
                <label>
                  <span>日期</span>
                  <input className="month-order-dialog__input" placeholder="请选择日期" readOnly />
                </label>
                <label>
                  <span>金额(¥)</span>
                  <input className="month-order-dialog__input" placeholder="请输入金额" />
                </label>
                <label className="month-order-dialog__form-grid-full">
                  <span>备注</span>
                  <textarea className="month-order-dialog__textarea" placeholder="请输入备注" />
                </label>
              </div>
            </div>
            <footer className="month-order-dialog__footer">
              <span className="month-order-dialog__footer-note">在线收款</span>
              <button type="button" className="is-primary" onClick={confirmCollectDialog}>
                提交
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {tagDialogOpen ? (
        <div className="month-order-dialog-scrim" onClick={closeTagDialog}>
          <section
            className="month-order-dialog month-order-dialog--tags"
            role="dialog"
            aria-modal="true"
            aria-label="选择标签"
            data-testid="month-order-dialog-tags"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>选择标签</strong>
              <button type="button" aria-label="关闭选择标签" onClick={closeTagDialog}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body">
              <div className="month-order-tag-dialog__toolbar">
                <label className="month-order-tag-dialog__search">
                  <span aria-hidden="true">⌕</span>
                  <input
                    type="text"
                    placeholder="搜索"
                    value={tagDialogKeyword}
                    onChange={(event) => setTagDialogKeyword(event.target.value)}
                  />
                </label>
                <button type="button" className="month-order-tag-dialog__create-link" onClick={() => onAction('创建标签')}>
                  +创建标签
                </button>
              </div>
              <div className="month-order-tag-dialog__tabs">
                <button type="button" className="is-active">
                  订单标签
                </button>
              </div>
              <div className="month-order-tag-tree" data-testid="month-order-tag-tree">
                <div className="month-order-tag-tree__group">
                  <button type="button" className="month-order-tag-tree__caret" aria-label="展开默认标签">
                    ▾
                  </button>
                  <label className="month-order-tag-tree__row month-order-tag-tree__row--group">
                    <input
                      type="checkbox"
                      checked={allVisibleTagChecked}
                      ref={(node) => {
                        if (node) {
                          node.indeterminate = !allVisibleTagChecked && someVisibleTagChecked
                        }
                      }}
                      onChange={toggleAllVisibleTags}
                    />
                    <span>{ORDER_TAG_GROUP_LABEL}</span>
                  </label>
                </div>
                <div className="month-order-tag-tree__children">
                  {visibleTagOptions.map((tag) => (
                    <label key={tag} className="month-order-tag-tree__row">
                      <input type="checkbox" checked={tagDraftSelection.includes(tag)} onChange={() => toggleTagOption(tag)} />
                      <span>{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <footer className="month-order-dialog__footer">
              <button type="button" onClick={closeTagDialog}>
                取消
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  setSelectedOrderTags(tagDraftSelection)
                  closeTagDialog()
                  onAction('保存订单标签')
                }}
              >
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {openDialog === 'modify-fee' ? (
        <div className="month-order-dialog-scrim" onClick={() => setOpenDialog(null)}>
          <section
            className="month-order-dialog month-order-dialog--medium"
            role="dialog"
            aria-modal="true"
            aria-label="修改费用"
            data-testid="month-order-dialog-modify-fee"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>修改费用</strong>
              <button type="button" aria-label="关闭修改费用" onClick={() => setOpenDialog(null)}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body">
              <div className="month-order-dialog__form-grid month-order-dialog__form-grid--single">
                <label>
                  <span>房费(减佣)</span>
                  <input className="month-order-dialog__input" defaultValue={String(roomFeeAmount || 0)} />
                </label>
                <label>
                  <span>佣金</span>
                  <input className="month-order-dialog__input" defaultValue={String(commissionAmount || 0)} />
                </label>
                <label>
                  <span>房费(含佣)</span>
                  <input className="month-order-dialog__input" defaultValue={String(totalIncomeAmount || 0)} />
                </label>
              </div>
            </div>
            <footer className="month-order-dialog__footer">
              <button type="button" onClick={() => setOpenDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={confirmDialog}>
                保存
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {openDialog === 'reminder' ? (
        <div className="month-order-dialog-scrim" onClick={() => setOpenDialog(null)}>
          <section
            className="month-order-dialog month-order-dialog--medium"
            role="dialog"
            aria-modal="true"
            aria-label="添加订单提醒"
            data-testid="month-order-dialog-reminder"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>添加订单提醒</strong>
              <button type="button" aria-label="关闭添加订单提醒" onClick={() => setOpenDialog(null)}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body">
              <div className="month-order-dialog__form-grid month-order-dialog__form-grid--single">
                <label>
                  <span>提醒时间</span>
                  <input className="month-order-dialog__input" placeholder="请选择日期" readOnly />
                </label>
                <label className="month-order-dialog__form-grid-full">
                  <span>提醒内容</span>
                  <textarea className="month-order-dialog__textarea" placeholder="请输入提醒内容" />
                </label>
              </div>
            </div>
            <footer className="month-order-dialog__footer">
              <button type="button" onClick={() => setOpenDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={confirmDialog}>
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {actionDialogConfig ? (
        <div className="month-order-dialog-scrim" onClick={() => setActionFlow(null)}>
          <section
            className="month-order-dialog month-order-dialog--medium"
            role="dialog"
            aria-modal="true"
            aria-label={actionDialogConfig.title}
            data-testid={actionDialogConfig.testId}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="month-order-dialog__header">
              <strong>{actionDialogConfig.title}</strong>
              <button type="button" aria-label={`关闭${actionDialogConfig.title}`} onClick={() => setActionFlow(null)}>
                ×
              </button>
            </header>
            <div className="month-order-dialog__body">
              {actionFlow === 'invite' || actionFlow === 'invite-renew' ? (
                <div className="month-order-dialog__form-grid month-order-dialog__form-grid--single">
                  <label>
                    <span>{actionFlow === 'invite' ? '邀请方式' : '续住方式'}</span>
                    <select className="month-order-dialog__select" defaultValue="短信链接">
                      <option value="短信链接">短信链接</option>
                      <option value="微信发送">微信发送</option>
                    </select>
                  </label>
                  <label>
                    <span>目标手机号</span>
                    <input className="month-order-dialog__input" defaultValue={phone === '-' ? '' : phone} placeholder="请输入手机号" />
                  </label>
                  <label className="month-order-dialog__form-grid-full">
                    <span>发送内容</span>
                    <textarea
                      className="month-order-dialog__textarea"
                      defaultValue={
                        actionFlow === 'invite'
                          ? `请完成 ${roomDisplayName} 的入住登记，入住日期 ${stayRange}`
                          : `请确认 ${roomDisplayName} 的续住申请，当前入住周期 ${stayRange}`
                      }
                    />
                  </label>
                </div>
              ) : null}

              {actionFlow === 'early-checkin' || actionFlow === 'late-checkout' || actionFlow === 'renew' || actionFlow === 'continue' ? (
                <div className="month-order-dialog__form-grid month-order-dialog__form-grid--single">
                  <label>
                    <span>{actionFlow === 'late-checkout' ? '延退至' : actionFlow === 'renew' || actionFlow === 'continue' ? '续住至' : '提前入住时间'}</span>
                    <input
                      className="month-order-dialog__input"
                      defaultValue={
                        actionFlow === 'late-checkout'
                          ? '2026-05-21 14:00'
                          : actionFlow === 'renew' || actionFlow === 'continue'
                            ? '2026-05-22'
                            : '2026-05-20 12:00'
                      }
                      readOnly
                    />
                  </label>
                  <label className="month-order-dialog__form-grid-full">
                    <span>备注</span>
                    <textarea
                      className="month-order-dialog__textarea"
                      defaultValue={
                        actionFlow === 'late-checkout'
                          ? '客户已确认延迟退房，需要同步房态与清扫时间。'
                          : actionFlow === 'renew' || actionFlow === 'continue'
                            ? '续住后沿用当前房间与价格策略。'
                            : '提前入住后请同步门锁密码和入住提醒。'
                      }
                    />
                  </label>
                </div>
              ) : null}

              {actionFlow === 'change-room' ? (
                <div className="month-order-dialog__form-grid">
                  <label>
                    <span>当前房间</span>
                    <input className="month-order-dialog__input" value={roomDisplayName} readOnly />
                  </label>
                  <label>
                    <span>调整至</span>
                    <select
                      className="month-order-dialog__select"
                      value={selectedChangeRoomId}
                      disabled={changeRoomOptionsLoading || !changeRoomOptions.length || submittingAction === 'change-room'}
                      onChange={(event) => setSelectedChangeRoomId(event.target.value)}
                    >
                      {changeRoomOptionsLoading ? <option value="">正在加载可换房间</option> : null}
                      {!changeRoomOptionsLoading && !changeRoomOptions.length ? <option value="">当前房型暂无可换空房</option> : null}
                      {changeRoomOptions.map((room) => (
                        <option key={room.roomId} value={room.roomId}>
                          {room.roomCategoryName || selectedBooking.roomType} {room.roomName}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="month-order-dialog__form-grid-full">
                    <span>换房原因</span>
                    <textarea
                      className="month-order-dialog__textarea"
                      value={changeRoomReason}
                      disabled={submittingAction === 'change-room'}
                      onChange={(event) => setChangeRoomReason(event.target.value)}
                    />
                  </label>
                  {changeRoomOptionsError ? (
                    <div className="month-order-dialog__form-grid-full month-order-dialog__error" role="alert">
                      {changeRoomOptionsError}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {actionFlow === 'clean' ? (
                <div className="month-order-dialog__form-grid">
                  <label>
                    <span>保洁房间</span>
                    <input className="month-order-dialog__input" value={roomDisplayName} readOnly />
                  </label>
                  <label>
                    <span>优先级</span>
                    <select className="month-order-dialog__select" defaultValue="普通">
                      <option value="普通">普通</option>
                      <option value="加急">加急</option>
                    </select>
                  </label>
                  <label className="month-order-dialog__form-grid-full">
                    <span>任务说明</span>
                    <textarea className="month-order-dialog__textarea" defaultValue="退房后安排保洁，检查布草和 minibar 消耗。" />
                  </label>
                </div>
              ) : null}

              {actionFlow === 'print' ? (
                <div className="month-order-dialog__form-grid month-order-dialog__form-grid--single">
                  <label>
                    <span>打印类型</span>
                    <select className="month-order-dialog__select" defaultValue="订单详情单">
                      <option value="订单详情单">订单详情单</option>
                      <option value="入住单">入住单</option>
                      <option value="账单">账单</option>
                    </select>
                  </label>
                  <label className="month-order-dialog__form-grid-full">
                    <span>打印说明</span>
                    <textarea className="month-order-dialog__textarea" defaultValue="打印将按当前订单信息生成单据，提交后进入打印流程。" />
                  </label>
                </div>
              ) : null}

              {actionFlow === 'credit-checkout' ? (
                <div className="month-order-dialog__stats">
                  <div className="month-order-dialog__stat">
                    <span>信用住房费</span>
                    <strong>{roomFee}</strong>
                  </div>
                  <div className="month-order-dialog__stat">
                    <span>佣金</span>
                    <strong>{commission}</strong>
                  </div>
                  <div className="month-order-dialog__stat month-order-dialog__stat--pending">
                    <span>待结金额</span>
                    <strong>{totalIncome}</strong>
                  </div>
                </div>
              ) : null}

              {actionFlow === 'checkin' ? (
                <div className="month-order-dialog__form-grid month-order-dialog__form-grid--single">
                  <label>
                    <span>入住房间</span>
                    <input className="month-order-dialog__input" value={roomDisplayName} readOnly />
                  </label>
                  <label>
                    <span>入住人</span>
                    <input className="month-order-dialog__input" value={selectedBooking.cell.title} readOnly />
                  </label>
                  <label className="month-order-dialog__form-grid-full">
                    <span>办理说明</span>
                    <textarea className="month-order-dialog__textarea" defaultValue="确认证件、房费与押金信息后即可办理入住。" />
                  </label>
                </div>
              ) : null}

              {actionFlow === 'cancel-order' ? (
                <div className="month-order-cancel-confirm">
                  <span className="month-order-cancel-confirm__icon" aria-hidden="true">
                    !
                  </span>
                  <div>
                    <strong>确定取消此房单吗？</strong>
                    <p>取消后将释放房态，不可恢复，请谨慎操作</p>
                    <dl>
                      <div>
                        <dt>房间信息</dt>
                        <dd>{roomDisplayName}</dd>
                      </div>
                      <div>
                        <dt>订单编号</dt>
                        <dd>{orderId || '-'}</dd>
                      </div>
                      <div>
                        <dt>当前状态</dt>
                        <dd>{statusLabel}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : null}

              {actionFlow === 'skip-stock' ? (
                <div className="month-order-cancel-confirm month-order-skip-stock-confirm">
                  <span className="month-order-cancel-confirm__icon" aria-hidden="true">
                    !
                  </span>
                  <div>
                    <strong>订单将释放库存会同时取消排房，是否确定此操作？</strong>
                    <p>确认后该订单不再占用当前房间库存，当前排房也会同步取消。</p>
                    <button type="button" className="month-order-skip-stock-confirm__tag" onClick={openTagDialog}>
                      <span>添加标签：</span>
                      <strong>+ 添加标签</strong>
                    </button>
                    <dl>
                      <div>
                        <dt>房间信息</dt>
                        <dd>{roomDisplayName}</dd>
                      </div>
                      <div>
                        <dt>订单编号</dt>
                        <dd>{orderId || '-'}</dd>
                      </div>
                      <div>
                        <dt>当前状态</dt>
                        <dd>{statusLabel}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : null}

              {actionFlow === 'cancel-arrange' || actionFlow === 'skip-report' ? (
                <div className="month-order-dialog__grid month-order-dialog__grid--inputs">
                  <span>房间信息: {roomDisplayName}</span>
                  <span>订单编号: {orderId}</span>
                  <span>当前状态: {statusLabel}</span>
                  <span>
                    {actionFlow === 'cancel-arrange'
                      ? '确认后将移除当前排房记录。'
                      : actionFlow === 'skip-report'
                          ? '确认后该订单将不再计入统计口径。'
                          : ''}
                  </span>
                </div>
              ) : null}
            </div>
            <footer className="month-order-dialog__footer">
              <button type="button" onClick={() => setActionFlow(null)}>
                取消
              </button>
              <button
                type="button"
                className="is-primary"
                disabled={isActionConfirmDisabled}
                onClick={() => {
                  if (actionFlow === 'checkin') {
                    setActionFlow(null)
                    void handleCheckInOrder()
                    return
                  }
                  if (actionFlow === 'change-room') {
                    void handleChangeRoomOrder()
                    return
                  }
                  if (actionFlow === 'cancel-order') {
                    void handleCancelOrder()
                    return
                  }
                  if (actionFlow === 'skip-stock') {
                    void handleSkipStockOrder()
                    return
                  }
                  confirmActionFlow()
                }}
              >
                {actionFlow === 'checkin'
                  ? (submittingAction === 'checkin' ? '入住中' : '办理入住')
                  : actionFlow === 'change-room' && isChangeRoomSubmitting
                    ? '换房中'
                    : actionFlow === 'cancel-order' && isCancelSubmitting
                      ? '取消中'
                      : actionFlow === 'skip-stock' && isSkipStockSubmitting
                        ? '处理中'
                    : actionDialogConfig.confirmLabel}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </aside>
  )
}

function parseCurrencyNumber(value: string) {
  const numeric = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveMonthOrderState(liveStatus: string | undefined): MonthOrderState {
  if (liveStatus?.includes('未到店') || liveStatus?.includes('失约') || liveStatus === 'no_show' || liveStatus === 'no-show' || liveStatus === 'noshow') return 'no-show'
  if (liveStatus?.includes('已取消') || liveStatus === 'cancelled' || liveStatus === 'canceled') return 'cancelled'
  if (liveStatus?.includes('入住中')) return 'checked-in'
  if (liveStatus?.includes('已退房')) return 'checked-out'
  return 'pending'
}

function createMonthOrderGuestForm(guestName: string, guestMobile: string | undefined): MonthOrderGuestForm {
  return {
    guestName,
    guestMobile: guestMobile && guestMobile !== '-' ? guestMobile : '',
    guestIdCardType: '居民身份证',
    guestIdCard: '',
  }
}

function createMonthOrderInitialLogs(selectedBooking: SelectedBooking, roomLogLabel: string): MonthOrderLogEntry[] {
  const now = Date.now()
  const initialId = selectedBooking.cell.orderId || `${selectedBooking.cell.title}-${roomLogLabel}`
  const channelTime = parseMonthOrderLogTimestamp(selectedBooking.cell.bookingAt ?? selectedBooking.cell.createdAt) ?? now - 120_000
  const checkInTime = parseMonthOrderLogTimestamp(selectedBooking.cell.guestRegisteredAt)
  const checkOutTime = parseMonthOrderLogTimestamp(selectedBooking.cell.checkedOutAt)
  const orderState = resolveMonthOrderState(selectedBooking.cell.liveStatus)
  const logs: MonthOrderLogEntry[] = [
    {
      id: `${initialId}-channel`,
      occurredAt: channelTime,
      title: '渠道来单',
      operator: '系统自动',
      detail: '订单状态:进行中',
    },
  ]

  if ((orderState === 'checked-in' || orderState === 'checked-out') && checkInTime !== undefined) {
    logs.push({
      id: `${initialId}-checkin`,
      occurredAt: checkInTime,
      title: '办理入住',
      operator: '系统自动',
      detail: `入住房间：${roomLogLabel}`,
    })
  }

  if (orderState === 'checked-out' && checkOutTime !== undefined) {
    logs.push({
      id: `${initialId}-checkout`,
      occurredAt: checkOutTime,
      title: '办理退房',
      operator: '系统自动',
      detail: `退房房间：${roomLogLabel}`,
    })
  }

  return logs.sort((left, right) => right.occurredAt - left.occurredAt)
}

function createMonthOrderActionLog(title: string, detail: string, occurredAt: number): MonthOrderLogEntry {
  return {
    id: `${title}-${occurredAt}-${Date.now()}`,
    occurredAt,
    title,
    operator: '系统自动',
    detail,
  }
}

function formatMonthOrderLogDate(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`
}

function formatMonthOrderLogTime(timestamp: number) {
  const date = new Date(timestamp)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

function parseMonthOrderLogTimestamp(value: string | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  const localMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
  if (localMatch) {
    const [, year, month, day, hour = '0', minute = '0', second = '0'] = localMatch
    const timestamp = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)).getTime()
    return Number.isFinite(timestamp) ? timestamp : undefined
  }
  const parsed = Date.parse(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function resolveOrderActionLiveStatus(status: string | undefined, fallback: string) {
  if (!status) return fallback
  const normalized = status.toLowerCase()
  if (normalized === 'checked_in' || normalized === 'checked-in' || normalized.includes('入住中')) return '入住中'
  if (normalized === 'completed' || normalized === 'checked_out' || normalized === 'checked-out' || normalized.includes('已退房')) return '已退房'
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized.includes('已取消')) return '已取消'
  if (normalized === 'no_show' || normalized === 'no-show' || normalized === 'noshow' || normalized.includes('未到店') || normalized.includes('失约')) return '未到店'
  if (normalized === 'booked' || normalized.includes('待入住')) return '待入住'
  return fallback
}

function formatCurrency(value: string | undefined, fallback: string) {
  if (!value) return fallback
  return formatCurrencyFromNumber(parseCurrencyNumber(value), fallback)
}

function formatCurrencyFromNumber(value: number, fallback: string) {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return `¥${value.toFixed(2)}`
}

function resolveMonthOrderActionDialogConfig(action: MonthOrderActionFlow): MonthOrderActionDialogConfig {
  const mapping: Record<MonthOrderActionFlow, MonthOrderActionDialogConfig> = {
    invite: {
      title: '邀请登记',
      confirmLabel: '发送邀请',
      actionLabel: '发送入住登记邀请',
      testId: 'month-order-dialog-invite',
    },
    'early-checkin': {
      title: '提前入住',
      confirmLabel: '确认提前入住',
      actionLabel: '提前入住',
      testId: 'month-order-dialog-early-checkin',
    },
    'invite-renew': {
      title: '邀请续住',
      confirmLabel: '发送续住邀请',
      actionLabel: '邀请续住',
      testId: 'month-order-dialog-invite-renew',
    },
    'late-checkout': {
      title: '延迟退房',
      confirmLabel: '确认延退',
      actionLabel: '延迟退房',
      testId: 'month-order-dialog-late-checkout',
    },
    'change-room': {
      title: '换房',
      confirmLabel: '确认换房',
      actionLabel: '换房',
      testId: 'month-order-dialog-change-room',
    },
    'cancel-arrange': {
      title: '取消排房',
      confirmLabel: '确认取消',
      actionLabel: '取消排房',
      testId: 'month-order-dialog-cancel-arrange',
    },
    'skip-stock': {
      title: '不占库存',
      confirmLabel: '确定',
      actionLabel: '设置不占库存',
      testId: 'month-order-dialog-skip-stock',
    },
    'skip-report': {
      title: '不计入统计',
      confirmLabel: '确认设置',
      actionLabel: '设置不计入统计',
      testId: 'month-order-dialog-skip-report',
    },
    continue: {
      title: '设为续住单',
      confirmLabel: '确认续住',
      actionLabel: '设为续住单',
      testId: 'month-order-dialog-continue',
    },
    'cancel-order': {
      title: '取消房单',
      confirmLabel: '确定',
      actionLabel: '取消房单',
      testId: 'month-order-dialog-cancel-order',
    },
    clean: {
      title: '保洁',
      confirmLabel: '创建保洁任务',
      actionLabel: '创建保洁任务',
      testId: 'month-order-dialog-clean',
    },
    print: {
      title: '打印',
      confirmLabel: '进入打印',
      actionLabel: '打印订单',
      testId: 'month-order-dialog-print',
    },
    'credit-checkout': {
      title: '信用住结账',
      confirmLabel: '确认结账',
      actionLabel: '信用住结账',
      testId: 'month-order-dialog-credit-checkout',
    },
    checkin: {
      title: '办理入住',
      confirmLabel: '办理入住',
      actionLabel: '办理入住',
      testId: 'month-order-dialog-checkin',
    },
    renew: {
      title: '续住',
      confirmLabel: '确认续住',
      actionLabel: '续住',
      testId: 'month-order-dialog-renew',
    },
  }

  return mapping[action]
}
