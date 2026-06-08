import {
  fetchHouseMonthsSnapshot,
  type HouseMonthsProviderName,
  type MonthCell,
  type MonthDateColumn,
  type MonthRoomGroup,
} from './houseMonths'

const WINDOW_START_OFFSET_DAYS = -3
const MONTH_WINDOW_DAYS = 33
const DEFAULT_SELECTED_DATE_INDEX = 3
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

export interface DayOrderBooking {
  cell: MonthCell
  roomType: string
  roomLabel: string
}

export interface DayOrderCard {
  id: string
  storeId: string
  storeName: string
  roomType: string
  roomName: string
  roomCategoryId?: string
  roomId: string
  status: 'cleanVacant' | 'dirtyVacant' | 'occupiedClean' | 'occupiedDirty' | 'closed'
  hasTag?: boolean
  filterLabels: string[]
  booking?: DayOrderBooking
}

export function createHouseMonthDateColumns(today: Date = new Date()) {
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const startDate = new Date(localMidnight.getFullYear(), localMidnight.getMonth(), localMidnight.getDate() + WINDOW_START_OFFSET_DAYS)

  return Array.from({ length: MONTH_WINDOW_DAYS }, (_, index) => {
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + index)
    return {
      fullDate: `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
      isoDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      date: `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`,
      weekday: WEEKDAYS[date.getDay()] ?? '',
      remain: '余4间',
      hot: date.getDay() === 5 || date.getDay() === 6,
    } satisfies MonthDateColumn
  })
}

type FetchDayOrderCardsOptions = {
  campId?: string
  provider?: HouseMonthsProviderName
}

export async function fetchDayOrderCardsFromMonthSource(queryCode: string, options: FetchDayOrderCardsOptions = {}) {
  const columns = createHouseMonthDateColumns()
  const snapshot = await fetchHouseMonthsSnapshot(
    {
      campId: options.campId ?? 'camp-001',
      startDate: columns[0]!.isoDate,
      days: MONTH_WINDOW_DAYS,
      queryCode,
      provider: options.provider,
    },
    columns,
  )

  return adaptDayOrderCards(snapshot.rows, columns[DEFAULT_SELECTED_DATE_INDEX]!.isoDate, queryCode)
}

export function adaptDayOrderCards(rows: MonthRoomGroup[], todayIsoDate: string, queryCode: string) {
  const normalizedQuery = queryCode.trim()
  const todayIndex = createHouseMonthDateColumns()
    .findIndex((column) => column.isoDate === todayIsoDate)

  const effectiveTodayIndex = todayIndex >= 0 ? todayIndex : DEFAULT_SELECTED_DATE_INDEX

  return rows
    .map((row) => {
      const roomCell = row.roomCells[effectiveTodayIndex]
      const booking = roomCell && roomCell.tone.startsWith('booking')
        ? {
            cell: roomCell,
            roomType: row.label,
            roomLabel: row.roomLabel,
          }
        : undefined

      const status = resolveDayRoomStatus(roomCell)
      const filterLabels = buildFilterLabels(roomCell, booking)
      const card: DayOrderCard = {
        id: row.id,
        storeId: row.storeId,
        storeName: row.storeName,
        roomType: row.label,
        roomName: row.roomLabel,
        roomCategoryId: row.roomCategoryId,
        roomId: row.roomId,
        status,
        hasTag: Boolean(roomCell?.badge),
        filterLabels,
        booking,
      }
      return card
    })
    .filter((card) => matchesDayQuery(card, normalizedQuery))
}

function matchesDayQuery(card: DayOrderCard, queryCode: string) {
  if (!queryCode) return true
  return [card.roomType, card.roomName, card.booking?.cell.title, card.booking?.cell.subtitle, card.booking?.cell.remark]
    .filter(Boolean)
    .some((value) => value?.includes(queryCode))
}

function resolveDayRoomStatus(cell: MonthCell | undefined): DayOrderCard['status'] {
  if (!cell) return 'cleanVacant'
  if (cell.tone === 'disabled') return 'closed'
  if (!cell.tone.startsWith('booking')) return 'cleanVacant'
  if (cell.liveStatus?.includes('入住中')) return 'occupiedClean'
  return 'occupiedDirty'
}

function buildFilterLabels(cell: MonthCell | undefined, booking: DayOrderBooking | undefined) {
  if (!booking) return ['空净']

  const labels = new Set<string>()
  const liveStatus = booking.cell.liveStatus ?? ''
  if (liveStatus.includes('待入住')) labels.add('预抵')
  if (liveStatus.includes('入住中')) labels.add('在住')
  if (booking.cell.remark) labels.add('备注')

  if (booking.cell.tone === 'booking-duplicate') labels.add('重单')

  const channelTone = booking.cell.channelTone ?? booking.cell.tone
  if (channelTone === 'booking-blue') labels.add('住净')
  if (channelTone === 'booking-gold' || channelTone === 'booking-teal') labels.add('住脏')

  const stayRange = cell?.stayRange ?? ''
  if (stayRange.includes('-')) labels.add('预离')

  return Array.from(labels)
}
