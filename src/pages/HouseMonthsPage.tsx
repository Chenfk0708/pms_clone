import { type ChangeEvent, type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchHouseMonthsDefaultCampId,
  fetchHouseMonthsSnapshot,
  type MonthCell,
  type MonthDateColumn,
  type MonthRoomGroup,
} from '../services/houseMonths'
import './HouseMonthsPage.css'

type BatchMode = 'dirty' | 'clean' | 'close' | 'open'
type BatchMenu = 'dirty-clean' | 'open-close' | null

interface HoveredBooking {
  cell: MonthCell
  roomType: string
  roomLabel: string
  left: number
  top: number
}

interface SelectedBooking {
  cell: MonthCell
  roomType: string
  roomLabel: string
}

type OrderDrawerTab = 'order' | 'channel' | 'log'
type MonthOrderDialog = 'noshow' | 'checkout' | 'modify-fee' | 'reminder' | null
type MonthOrderState = 'pending' | 'checked-in' | 'checked-out'
type MonthOrderOverlay = 'edit-order' | null
type EditOrderRoomMode = 'all-day' | 'hourly' | 'long-stay'

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

const batchConfig: Record<BatchMode, { title: string; enter: string; apply: string; result: string }> = {
  dirty: { title: '批量设脏', enter: '已进入批量设脏模式', apply: '设为脏房', result: '脏房' },
  clean: { title: '批量设净', enter: '已进入批量设净模式', apply: '设为净房', result: '净房' },
  close: { title: '批量关房', enter: '已进入批量关房模式', apply: '设为关闭房', result: '关闭房' },
  open: { title: '批量开房', enter: '已进入批量开房模式', apply: '设为开放房', result: '开放房' },
}

export function HouseMonthsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const monthBoardRef = useRef<HTMLElement | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedDateIndex, setSelectedDateIndex] = useState(3)
  const [toastMessage, setToastMessage] = useState('')
  const [activeChip, setActiveChip] = useState('')
  const [query, setQuery] = useState('')
  const [roomType, setRoomType] = useState('')
  const [batchMenu, setBatchMenu] = useState<BatchMenu>(null)
  const [filterMenu, setFilterMenu] = useState<'room' | 'tag' | null>(null)
  const [batchMode, setBatchMode] = useState<BatchMode | null>(null)
  const [batchResult, setBatchResult] = useState<BatchMode | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null)
  const [hoveredBooking, setHoveredBooking] = useState<HoveredBooking | null>(null)
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [loadError, setLoadError] = useState('')
  const [roomGroups, setRoomGroups] = useState<MonthRoomGroup[]>([])
  const [dateColumns, setDateColumns] = useState<MonthDateColumn[]>(monthDates)

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
    if (monthBoardRef.current) monthBoardRef.current.scrollLeft = 184
  }, [])

  const initialCampId = useMemo(() => {
    const queryCampId = new URLSearchParams(location.search).get('campId')?.trim()
    if (queryCampId) return queryCampId
    return window.localStorage.getItem('pms.currentCampId')?.trim() || ''
  }, [location.search])
  const resolvedCampIdRef = useRef('')

  const loadSnapshot = useCallback(async (nextRoomType = roomType, nextQuery = query) => {
    setLoadState('loading')
    setLoadError('')
    try {
      let activeCampId = initialCampId || resolvedCampIdRef.current
      if (!activeCampId) {
        activeCampId = await fetchHouseMonthsDefaultCampId()
        window.localStorage.setItem('pms.currentCampId', activeCampId)
        resolvedCampIdRef.current = activeCampId
      }

      const snapshot = await fetchHouseMonthsSnapshot(
        {
          campId: activeCampId,
          startDate: monthDates[0].isoDate,
          days: monthDates.length,
          roomCategoryId: nextRoomType || undefined,
          queryCode: nextQuery.trim() || undefined,
        },
        monthDates,
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
  }, [initialCampId, query, roomType])

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
      setSelectedBooking(null)
    }

    const closeByPointer = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest('.month-settings')) setSettingsOpen(false)
      if (!target.closest('.month-filter-menu')) setFilterMenu(null)
      if (!target.closest('.month-batch-action')) setBatchMenu(null)
      if (!target.closest('.month-order-drawer') && !target.closest('.tone-booking-blue, .tone-booking-gold, .tone-booking-teal')) {
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

  const filteredRows = useMemo(() => {
    const keyword = query.trim()

    return roomGroups.filter((group) => {
      const searchable = [
        group.label,
        group.roomLabel,
        ...group.typeCells.map((cell) => cell.title),
        ...group.roomCells.map((cell) => `${cell.title} ${cell.subtitle ?? ''} ${cell.amount ?? ''}`),
      ].join(' ')

      if (keyword && !searchable.includes(keyword)) return false
      if (roomType && group.label !== roomType) return false
      return true
    })
  }, [query, roomGroups, roomType])

  const startBatch = (mode: BatchMode) => {
    setBatchMode(mode)
    setBatchMenu(null)
    setBatchResult(null)
    setSelectedKeys([])
    setToastMessage(batchConfig[mode].enter)
  }

  const applyBatch = () => {
    const mode = batchMode ?? 'dirty'
    setBatchMode(null)
    setBatchResult(mode)
    setSelectedKeys([])
    setToastMessage(`${batchConfig[mode].title}已完成：已设为${batchConfig[mode].result}`)
  }

  const showActionResult = (action: string) => {
    setToastMessage(`${action}已处理`)
  }

  const toggleKey = (key: string) => {
    setSelectedKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]))
  }

  const clearFilters = () => {
    setQuery('')
    setRoomType('')
    void loadSnapshot('', '')
  }

  const hasFilters = Boolean(query || roomType)
  const showBookingPopover = (event: ReactMouseEvent<HTMLElement>, cell: MonthCell, row: MonthRoomGroup) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const popoverWidth = 300
    const popoverHeight = 232
    const left = Math.min(rect.right + 18, window.innerWidth - popoverWidth - 12)
    const top = Math.max(8, Math.min(Math.round(rect.top + rect.height / 2 - popoverHeight / 2), window.innerHeight - popoverHeight - 12))

    setHoveredBooking({
      cell,
      roomType: row.label,
      roomLabel: row.roomLabel,
      left: Math.round(left),
      top,
    })
  }

  const openOrderDrawer = (cell: MonthCell, row: MonthRoomGroup) => {
    setHoveredBooking(null)
    setSelectedBooking({
      cell,
      roomType: row.label,
      roomLabel: row.roomLabel,
    })
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
                      showActionResult('图例说明')
                    }}
                  >
                    图例说明
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSettingsOpen(false)
                      showActionResult('房态设置')
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
          <div className="month-store-control">
            <div className="month-store-switch" aria-label="门店范围">
              {['全部门店', '天落会宿公寓(前海壹方城宝安中心店)'].map((chip, index) => (
                <button
                  key={chip}
                  type="button"
                  className={`chip${index === 0 ? ' month-store-chip' : ''}${activeChip === chip ? ' is-active' : ''}`}
                  aria-pressed={activeChip === chip}
                  onClick={() => setActiveChip((current) => (current === chip ? '' : chip))}
                >
                  {chip}
                </button>
              ))}
            </div>
            <button type="button" className="month-store-settings" aria-label="门店设置" onClick={() => navigate('/InformationMaintenance/campInfo')}>
              <span aria-hidden="true">⚙</span>
            </button>
          </div>

          <div className="month-filter-menu">
            <button type="button" className="chip" onClick={() => setFilterMenu(filterMenu === 'room' ? null : 'room')}>
              房型
            </button>
            {filterMenu === 'room' ? (
              <div className="month-filter-menu__panel" role="listbox" aria-label="房型筛选">
                {roomGroups.map((row) => (
                  <button
                    key={row.label}
                    type="button"
                    role="option"
                    aria-selected={roomType === row.label}
                    onClick={() => {
                      setRoomType(row.label)
                      setFilterMenu(null)
                      void loadSnapshot(row.label, query)
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
          <button type="button" className="month-refresh-action" aria-label="刷新房态" disabled={loadState === 'loading'} onClick={() => void loadSnapshot()}>
            ↻
          </button>
          <button type="button" className="month-refresh-action" aria-label="重新加载" disabled={loadState === 'loading'} onClick={() => void loadSnapshot()}>
            ⟳
          </button>
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
          <div className="month-status-toast" role="status" data-batch-result={batchResult ?? undefined}>
            {toastMessage}
          </div>
        ) : null}

        {batchMode ? (
          <div className="month-batch-toolbar" role="toolbar" aria-label="批量操作">
            <strong>{batchConfig[batchMode].title}</strong>
            <span>已选 {selectedKeys.length} 间夜</span>
            <button type="button" disabled={selectedKeys.length === 0} onClick={applyBatch}>
              {batchConfig[batchMode].apply}
            </button>
            <button type="button" onClick={() => setBatchMode(null)}>
              取消
            </button>
          </div>
        ) : null}
      </section>

      <section ref={monthBoardRef} className="timeline-board month-board" aria-label="月房态日历矩阵" data-testid="month-grid">
        <div className="month-grid-row month-board__head">
          <div className="month-calendar-title">
            <div className="month-calendar-date">
              <strong>{dateColumns[selectedDateIndex]?.fullDate}</strong>
              <span aria-hidden="true">▣</span>
            </div>
            <button type="button" onClick={() => setCollapsed((value) => !value)}>
              {collapsed ? '全部展开' : '全部收起'}
            </button>
          </div>

          {dateColumns.map((date, index) => (
            <button
              key={date.date}
              type="button"
              data-testid="month-date-column"
              className={`timeline-date${index === selectedDateIndex ? ' is-highlight' : ''}${date.hot ? ' is-hot' : ''}`}
              aria-current={index === selectedDateIndex ? 'date' : undefined}
              onClick={() => setSelectedDateIndex(index)}
            >
              {index === selectedDateIndex ? <i aria-hidden="true">◆</i> : null}
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
          <div key={row.label} className="month-room-group">
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

                {row.roomCells.map((cell, cellIndex) => {
                  const key = `${rowIndex}-${cellIndex}`
                  const selected = selectedKeys.includes(key)

                  return (
                    <button
                      key={key}
                      type="button"
                      data-testid={batchMode ? 'month-selectable-cell' : undefined}
                      aria-selected={batchMode ? selected : undefined}
                      className={`month-cell tone-${cell.tone}${selected ? ' is-selected' : ''}`}
                      onMouseEnter={(event) => {
                        if (cell.tone.startsWith('booking')) showBookingPopover(event, cell, row)
                      }}
                      onMouseLeave={() => setHoveredBooking(null)}
                      onClick={() => {
                        if (batchMode) {
                          toggleKey(key)
                          return
                        }
                        if (cell.tone.startsWith('booking')) openOrderDrawer(cell, row)
                      }}
                    >
                      <strong>{cell.title}</strong>
                      {cell.subtitle ? <span>{cell.subtitle}</span> : null}
                      {cell.amount ? <em>{cell.amount}</em> : null}
                      {cell.badge ? <b>{cell.badge}</b> : null}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {selectedBooking ? (
        <MonthOrderDrawer selectedBooking={selectedBooking} onClose={() => setSelectedBooking(null)} onAction={showActionResult} />
      ) : null}

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
    </div>
  )
}

interface MonthOrderDrawerProps {
  selectedBooking: SelectedBooking
  onClose: () => void
  onAction: (action: string) => void
}

function MonthOrderDrawer({ selectedBooking, onClose, onAction }: MonthOrderDrawerProps) {
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
  const [editOrderRoomMode, setEditOrderRoomMode] = useState<EditOrderRoomMode>('all-day')
  const [checkoutType, setCheckoutType] = useState<'normal' | 'early'>('normal')
  const orderState = resolveMonthOrderState(selectedBooking.cell.liveStatus)
  const statusLabel =
    orderState === 'checked-in' ? '入住中' : orderState === 'checked-out' ? '已退房' : '待入住'
  const roomFee = formatCurrency(selectedBooking.cell.amount, '¥597.60')
  const totalIncome = formatCurrency(selectedBooking.cell.totalIncome, '¥664.00')
  const commission = formatCurrencyFromNumber(parseCurrencyNumber(totalIncome) * 0.1, '¥66.40')
  const roomFeeAmount = parseCurrencyNumber(roomFee)
  const commissionAmount = parseCurrencyNumber(commission)
  const totalIncomeAmount = parseCurrencyNumber(totalIncome)
  const nightlyAmount = formatCurrencyFromNumber(parseCurrencyNumber(roomFee) / 2, '¥298.80')
  const stayRange = selectedBooking.cell.stayRange ?? '2026.05.18-05.20'
  const channelName = selectedBooking.cell.subtitle ?? '飞猪酒店'
  const orderId = selectedBooking.cell.orderId ?? '5116035240226051843'
  const channelOrderNo = '5116035240226051843'
  const phone = selectedBooking.cell.phone ?? '-'
  const remark = selectedBooking.cell.remark ?? '到店后补押金'
  const [selectedOrderTags, setSelectedOrderTags] = useState<string[]>([])
  const collectedAmount = 387
  const outstandingRoomFee = 0
  const depositAmount = 0
  const recommendedInvoiceAmount = 387
  const quickActions = useMemo<MonthOrderAction[]>(() => {
    const commonActions: MonthOrderAction[] = [
      { key: 'guest', label: '入住人', icon: '住', testId: 'month-order-action-guest' },
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
      { key: 'noshow', label: '置为noshow', icon: 'N', testId: 'month-order-action-noshow' },
      ...commonActions,
    ]
  }, [orderState])
  const roomDisplayName = `${selectedBooking.roomType} ${selectedBooking.roomLabel}`
  const orderKey = `${selectedBooking.cell.orderId ?? selectedBooking.cell.title}-${selectedBooking.roomLabel}`
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
    setOverlayPanel(null)
    setEditOrderRoomMode('all-day')
    setCheckoutType('normal')
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
      setOpenDialog('checkout')
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

  const confirmDialog = () => {
    if (openDialog === 'noshow') {
      onAction('置为noshow')
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

  const visibleTagOptions = ORDER_TAG_OPTIONS.filter((tag) => tag.includes(tagDialogKeyword.trim()))
  const allVisibleTagChecked = visibleTagOptions.length > 0 && visibleTagOptions.every((tag) => tagDraftSelection.includes(tag))
  const someVisibleTagChecked = visibleTagOptions.some((tag) => tagDraftSelection.includes(tag))

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
                    <label>
                      <span>客户姓名</span>
                      <input className="month-order-dialog__input" placeholder="请输入客户姓名" defaultValue={selectedBooking.cell.title} />
                    </label>
                    <label>
                      <span>手机号</span>
                      <input className="month-order-dialog__input" placeholder="请输入手机号" defaultValue={phone === '-' ? '' : phone} />
                    </label>
                    <label>
                      <span>证件类型</span>
                      <select className="month-order-dialog__select" defaultValue="居民身份证">
                        <option value="居民身份证">居民身份证</option>
                      </select>
                    </label>
                    <label>
                      <span>证件号</span>
                      <input className="month-order-dialog__input" placeholder="请输入证件号码" />
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
                      onClick={() => {
                        setGuestEditorOpen(false)
                        onAction('保存入住人')
                      }}
                    >
                      保存
                    </button>
                  </div>
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
          <section className="month-info-block month-info-block--plain">
            <h3>渠道信息</h3>
            <div className="month-info-grid">
              <span>渠道来源: {channelName}</span>
              <span>渠道单号: {channelOrderNo}</span>
              <span>佣金: {commission}</span>
              <span>结算方式: 线上预付</span>
            </div>
          </section>
        ) : null}

        {overlayPanel === null && activeTab === 'log' ? (
          <section className="month-info-block month-info-block--plain">
            <h3>操作日志</h3>
            <ul className="month-log-list">
              <li>2026-05-16 17:41:03 系统创建订单</li>
              <li>2026-05-16 17:45:21 同步渠道订单信息</li>
              <li>2026-05-18 10:20:18 前台确认待入住状态</li>
            </ul>
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
                onClick={() => {
                  if (action.key === 'more') {
                    setMoreMenuOpen((current) => !current)
                    return
                  }
                  if (action.key === 'checkout') {
                    handleDrawerAction('退房')
                    return
                  }
                  handleDrawerAction(action.label)
                }}
              >
                {action.label}
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
                    <span>待入住</span>
                  </div>
                  <div className="month-order-dialog__room-meta">
                    <span>{stayRange.replace(/\./g, '.').replace('-', '-')} (2晚)</span>
                    <strong>¥1624</strong>
                  </div>
                </div>
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
    </aside>
  )
}

function parseCurrencyNumber(value: string) {
  const numeric = Number(value.replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function resolveMonthOrderState(liveStatus: string | undefined): MonthOrderState {
  if (liveStatus?.includes('入住中')) return 'checked-in'
  if (liveStatus?.includes('已退房')) return 'checked-out'
  return 'pending'
}

function formatCurrency(value: string | undefined, fallback: string) {
  if (!value) return fallback
  return formatCurrencyFromNumber(parseCurrencyNumber(value), fallback)
}

function formatCurrencyFromNumber(value: number, fallback: string) {
  if (!Number.isFinite(value) || value <= 0) return fallback
  return `¥${value.toFixed(2)}`
}
