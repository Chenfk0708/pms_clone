import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchHouseDays,
  resolveHouseDaysQueryFromLocation,
  type HouseDaysRoomCard,
  type HouseDaysViewModel,
} from '../services/houseDays'
import {
  BatchOperationDialog,
  type BatchMode,
  createHoveredBooking,
  MonthOrderDrawer,
  MonthOrderPopover,
  type HoveredBooking,
  type SelectedBooking,
} from './HouseMonthsPage'
import { OrderRefreshPopover } from './HouseStatusSharingPage'
import './HouseDaysPage.css'

const ROOM_TYPE_VIEW = '按房型'
const ROOM_NUMBER_VIEW = '按房间号'
const FLOOR_VIEW = '按楼层'

type RoomTypeSummaryCard = {
  roomType: string
  rooms: HouseDaysRoomCard[]
}

type DayRoomActionAnchor = {
  left: number
  top: number
  room: HouseDaysRoomCard
}

function getRoomBookings(room: HouseDaysRoomCard) {
  if (room.bookings?.length) return room.bookings
  return room.booking ? [room.booking] : []
}

function renderRoomBookings(room: HouseDaysRoomCard) {
  return getRoomBookings(room).map((booking, index) => (
    <div key={`${room.id}-booking-${index}`} className="day-room-booking">
      <strong>{booking.guest}</strong>
      <span>{booking.channel}</span>
      <span>{booking.price}</span>
    </div>
  ))
}

function buildRoomTypeSummaryCards(rooms: HouseDaysRoomCard[]): RoomTypeSummaryCard[] {
  const grouped = new Map<string, RoomTypeSummaryCard>()

  for (const room of rooms) {
    const summary = grouped.get(room.roomType) ?? {
      roomType: room.roomType,
      rooms: [],
    }

    summary.rooms.push(room)
    grouped.set(room.roomType, summary)
  }

  return Array.from(grouped.values())
}

function FloorEmptyState({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <div className="day-floor-empty-state" data-testid="day-floor-empty-state">
      <div className="day-floor-empty-state__illustration" aria-hidden="true">
        <span className="day-floor-empty-state__building" />
        <span className="day-floor-empty-state__bubble" />
      </div>
      <strong>请先设置楼层</strong>
      <button type="button" className="primary-action" onClick={onOpenSettings}>
        前往设置
      </button>
    </div>
  )
}

function RoomNumberView({
  rooms,
  loading,
  error,
  setHoveredBooking,
  setSelectedBooking,
  setRoomActionAnchor,
  setFeedback,
}: {
  rooms: HouseDaysRoomCard[]
  loading: boolean
  error: string
  setHoveredBooking: (value: HoveredBooking | null) => void
  setSelectedBooking: (value: SelectedBooking | null) => void
  setRoomActionAnchor: (value: DayRoomActionAnchor | null) => void
  setFeedback: (value: string) => void
}) {
  return (
    <>
      {rooms.map((room) => (
        <section key={room.id} className="day-room-group">
          <h3>{room.roomType}</h3>
          <article
            className="day-room-card"
            data-tone={room.booking?.tone ?? 'empty'}
            aria-label={`${room.roomType} ${room.roomName}`}
            tabIndex={0}
            onMouseEnter={(event) => {
              if (!room.booking?.monthOrder) return
              const rect = event.currentTarget.getBoundingClientRect()
              setHoveredBooking(
                createHoveredBooking(
                  rect,
                  room.booking.monthOrder.cell,
                  room.booking.monthOrder.roomType,
                  room.booking.monthOrder.roomLabel,
                ),
              )
            }}
            onMouseLeave={() => setHoveredBooking(null)}
            onClick={(event) => {
              if (room.booking?.monthOrder) {
                setSelectedBooking({
                  cell: room.booking.monthOrder.cell,
                  roomType: room.booking.monthOrder.roomType,
                  roomLabel: room.booking.monthOrder.roomLabel,
                })
                setRoomActionAnchor(null)
                setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`)
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              setRoomActionAnchor({
                room,
                left: Math.min(window.innerWidth - 156, rect.right + 12),
                top: Math.max(12, rect.top + rect.height / 2 - 128),
              })
              setFeedback(`已打开 ${room.roomName} 房间操作菜单。`)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              if (room.booking?.monthOrder) {
                setSelectedBooking({
                    cell: room.booking.monthOrder.cell,
                    roomType: room.booking.monthOrder.roomType,
                    roomLabel: room.booking.monthOrder.roomLabel,
                  })
                setRoomActionAnchor(null)
                setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`)
                return
              }
              const rect = event.currentTarget.getBoundingClientRect()
              setRoomActionAnchor({
                room,
                left: Math.min(window.innerWidth - 156, rect.right + 12),
                top: Math.max(12, rect.top + rect.height / 2 - 128),
              })
              setFeedback(`已打开 ${room.roomName} 房间操作菜单。`)
            }}
          >
            <strong>{room.roomName}</strong>
            <span>{room.roomType}</span>
            {renderRoomBookings(room)}
            {room.hasTag ? <b aria-label="备注标签">●</b> : null}
          </article>
        </section>
      ))}
      {!loading && !error && rooms.length === 0 ? (
        <div className="day-empty-state">
          <strong>暂无日房态数据</strong>
          <span>当前条件下没有可展示房间，请调整筛选条件后重试。</span>
        </div>
      ) : null}
    </>
  )
}

function RoomTypeView({
  summaries,
  loading,
  error,
  setHoveredBooking,
  setSelectedBooking,
  setRoomActionAnchor,
  setFeedback,
}: {
  summaries: RoomTypeSummaryCard[]
  loading: boolean
  error: string
  setHoveredBooking: (value: HoveredBooking | null) => void
  setSelectedBooking: (value: SelectedBooking | null) => void
  setRoomActionAnchor: (value: DayRoomActionAnchor | null) => void
  setFeedback: (value: string) => void
}) {
  return (
    <div className="day-room-type-list" data-testid="day-room-type-grid">
      {summaries.map((summary) => (
        <section key={summary.roomType} className="day-room-type-section">
          <h3>{summary.roomType}</h3>
          <div className="day-room-type-section__rooms">
            {summary.rooms.map((room) => (
              <article
                key={room.id}
                className="day-room-card"
                data-tone={room.booking?.tone ?? 'empty'}
                aria-label={`${room.roomType} ${room.roomName}`}
                tabIndex={0}
                onMouseEnter={(event) => {
                  if (!room.booking?.monthOrder) return
                  const rect = event.currentTarget.getBoundingClientRect()
                  setHoveredBooking(
                    createHoveredBooking(
                      rect,
                      room.booking.monthOrder.cell,
                      room.booking.monthOrder.roomType,
                      room.booking.monthOrder.roomLabel,
                    ),
                  )
                }}
                onMouseLeave={() => setHoveredBooking(null)}
                onClick={(event) => {
                  if (room.booking?.monthOrder) {
                    setSelectedBooking({
                      cell: room.booking.monthOrder.cell,
                      roomType: room.booking.monthOrder.roomType,
                      roomLabel: room.booking.monthOrder.roomLabel,
                    })
                    setRoomActionAnchor(null)
                    setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`)
                    return
                  }
                  const rect = event.currentTarget.getBoundingClientRect()
                  setRoomActionAnchor({
                    room,
                    left: Math.min(window.innerWidth - 156, rect.right + 12),
                    top: Math.max(12, rect.top + rect.height / 2 - 128),
                  })
                  setFeedback(`已打开 ${room.roomName} 房间操作菜单。`)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  if (room.booking?.monthOrder) {
                    setSelectedBooking({
                        cell: room.booking.monthOrder.cell,
                        roomType: room.booking.monthOrder.roomType,
                        roomLabel: room.booking.monthOrder.roomLabel,
                      })
                    setRoomActionAnchor(null)
                    setFeedback(`已打开 ${room.booking.monthOrder.roomLabel} 的订单详情。`)
                    return
                  }
                  const rect = event.currentTarget.getBoundingClientRect()
                  setRoomActionAnchor({
                    room,
                    left: Math.min(window.innerWidth - 156, rect.right + 12),
                    top: Math.max(12, rect.top + rect.height / 2 - 128),
                  })
                  setFeedback(`已打开 ${room.roomName} 房间操作菜单。`)
                }}
              >
                <strong>{room.roomName}</strong>
                <span>{room.roomType}</span>
                {renderRoomBookings(room)}
                {room.hasTag ? <b aria-label="备注标签">●</b> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
      {!loading && !error && summaries.length === 0 ? (
        <div className="day-empty-state">
          <strong>暂无日房态数据</strong>
          <span>当前条件下没有可展示房型，请调整筛选条件后重试。</span>
        </div>
      ) : null}
    </div>
  )
}

export function HouseDaysPage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState(ROOM_NUMBER_VIEW)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [selectedChannel, setSelectedChannel] = useState('')
  const [selectedRoomType, setSelectedRoomType] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [queryKeyword, setQueryKeyword] = useState('')
  const [openMenu, setOpenMenu] = useState<'settings' | 'clean' | 'openClose' | null>(null)
  const [batchDialogMode, setBatchDialogMode] = useState<BatchMode | null>(null)
  const [batchDialogState, setBatchDialogState] = useState({
    roomText: '',
    dateStart: '',
    dateEnd: '',
    channel: 'all',
    closeType: 'disabled',
    remark: '',
    mode: 'dirty' as BatchMode,
  })
  const [showLegend, setShowLegend] = useState(false)
  const [showStatusSettings, setShowStatusSettings] = useState(false)
  const [roomActionAnchor, setRoomActionAnchor] = useState<DayRoomActionAnchor | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null)
  const [hoveredBooking, setHoveredBooking] = useState<HoveredBooking | null>(null)
  const [keyword, setKeyword] = useState('')
  const [activeStoreChip, setActiveStoreChip] = useState('all')
  const [feedback, setFeedback] = useState('')
  const [refreshPopoverOpen, setRefreshPopoverOpen] = useState(false)
  const [data, setData] = useState<HouseDaysViewModel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const source = resolveHouseDaysQueryFromLocation(window.location)

    void Promise.resolve()
      .then(() => {
        if (controller.signal.aborted) return null
        setLoading(true)
        setError('')
        return fetchHouseDays(
          {
            provider: source.provider,
            mockState: source.mockState,
            storeId: activeStoreChip,
            keyword: queryKeyword,
            viewMode,
            statusFilters: selectedFilters,
            channel: selectedChannel,
            roomType: selectedRoomType,
            tag: selectedTag,
          },
          controller.signal,
        )
      })
      .then((nextData) => {
        if (!nextData) return
        setData(nextData)
      })
      .catch((nextError: unknown) => {
        if (nextError instanceof DOMException && nextError.name === 'AbortError') return
        setError('日房态数据加载失败，请稍后重试。')
        setData(null)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [activeStoreChip, queryKeyword, refreshTick, selectedChannel, selectedFilters, selectedRoomType, selectedTag, viewMode])

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenu(null)
        setShowLegend(false)
        setSelectedBooking(null)
        setBatchDialogMode(null)
        setRoomActionAnchor(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handlePointer = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest('.day-toolbar__refresh-group')) {
        setRefreshPopoverOpen(false)
      }
      if (!target.closest('.day-room-actions-popover') && !target.closest('.day-room-card[data-tone=\"empty\"]')) {
        setRoomActionAnchor(null)
      }
      if (!target.closest('.month-order-drawer') && !target.closest('.day-room-card[data-tone]')) {
        setSelectedBooking(null)
      }
    }

    window.addEventListener('click', handlePointer)
    return () => window.removeEventListener('click', handlePointer)
  }, [])

  const toggleFilter = (label: string) => {
    setSelectedFilters((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label],
    )
    setFeedback(`${label}筛选已更新，日房态已按当前条件刷新。`)
  }

  const blockAction = (message: string) => {
    setOpenMenu(null)
    setFeedback(message)
  }

  const openBatchDialog = (mode: BatchMode) => {
    setOpenMenu(null)
    setBatchDialogState({
      roomText: '',
      dateStart: '',
      dateEnd: '',
      channel: 'all',
      closeType: 'disabled',
      remark: '',
      mode,
    })
    setBatchDialogMode(mode)
  }

  const resetFilters = () => {
    setSelectedFilters([])
    setKeyword('')
    setQueryKeyword('')
    setSelectedChannel('')
    setSelectedRoomType('')
    setSelectedTag('')
    setActiveStoreChip('all')
    setRefreshTick((tick) => tick + 1)
    setFeedback('日房态已刷新，筛选条件已重置。')
  }

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    setQueryKeyword(keyword)
    setFeedback(`已按“${keyword || '全部房间'}”更新日房态。`)
  }

  const viewModes = data?.viewModes ?? [ROOM_TYPE_VIEW, ROOM_NUMBER_VIEW, FLOOR_VIEW]
  const statusGroups = data?.statusGroups ?? []
  const roomCards = data?.rooms ?? []
  const roomTypeSummaries = buildRoomTypeSummaryCards(roomCards)
  const storeOptions = data?.storeOptions ?? [
    { id: 'all', name: '全部门店' },
    { id: 'poi-1796067693589061634', name: '天落会宿公寓(前海壹方城宝安中心店)' },
  ]
  const routeTargets = data?.routeTargets ?? {
    months: '/houseManage/months',
    price: '/houseManage/houseCale',
    storeSettings: '/InformationMaintenance/campInfo',
  }
  const isRoomTypeView = viewMode === ROOM_TYPE_VIEW
  const isRoomNumberView = viewMode === ROOM_NUMBER_VIEW
  const isFloorView = viewMode === FLOOR_VIEW

  return (
    <div className="page-stack day-status-page">
      <section className="toolbar-card day-toolbar month-toolbar">
        {error ? (
          <div className="day-data-error" role="alert" aria-label="日房态数据错误">
            <span>{error}</span>
            <button type="button" onClick={() => setRefreshTick((tick) => tick + 1)}>
              重试
            </button>
          </div>
        ) : null}
        <div className="day-feedback-sr-only" role="status" aria-label="日房态操作反馈" aria-live="polite">
          {feedback}
        </div>
        <div className="day-notice">
          <span>•</span>
          <p>智能调价监测到您当前入住率低于 50%，建议调价获得额外更多订单</p>
          <button type="button">忽略</button>
          <button type="button">立即调价</button>
        </div>
        <div className="month-toolbar__primary">
          <div className="segmented">
            <button type="button" onClick={() => navigate(routeTargets.months)}>
              月房态
            </button>
            <button type="button" className="is-active">
              日房态
            </button>
          </div>
          <div className="month-toolbar__actions">
            <input
              type="text"
              placeholder="输入客户姓名/手机/房间/渠道单/备注"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              type="button"
              className="primary-action"
              onClick={() => blockAction('请连接读卡器后重试，或手动搜索住客信息。')}
            >
              读卡
            </button>
            <button type="button" className="primary-action" onClick={() => navigate(routeTargets.price)}>
              房价管理
            </button>
            <div className="month-settings">
              <button
                type="button"
                className="primary-action"
                onClick={() => setOpenMenu(openMenu === 'settings' ? null : 'settings')}
              >
                更多设置
              </button>
              {openMenu === 'settings' ? (
                <div className="day-popover-menu month-settings__menu" role="menu" aria-label="更多设置">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowLegend(true)
                      setOpenMenu(null)
                      setFeedback('已打开图例说明。')
                    }}
                  >
                    图例说明
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setShowStatusSettings(true)
                      setOpenMenu(null)
                      setFeedback('已打开房态设置。')
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
            <div className="month-store-switch" aria-label="门店切换">
              {storeOptions.map((store, index) => (
                <button
                  key={store.id}
                  type="button"
                  className={`chip${index === 0 ? ' month-store-chip' : ''}${activeStoreChip === store.id ? ' is-active' : ''}`}
                  aria-pressed={activeStoreChip === store.id}
                  onClick={() => {
                    setActiveStoreChip(store.id)
                    setFeedback(store.id === 'all' ? '已切换到全部门店。' : `已切换到${store.name}。`)
                  }}
                >
                  {store.name}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="month-store-settings"
              aria-label="门店设置"
              onClick={() => navigate(routeTargets.storeSettings)}
            >
              ⚙
            </button>
          </div>
          <div className="toolbar-actions">
            <div className="day-action-popover month-batch-action month-batch-action--first">
              <button
                type="button"
                className="month-outline-action"
                onClick={() => setOpenMenu(openMenu === 'clean' ? null : 'clean')}
              >
                批量设脏/净
              </button>
              {openMenu === 'clean' ? (
                <div className="day-popover-menu day-popover-menu--batch" role="menu" aria-label="批量设脏/净">
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量设脏。')}>
                    批量设脏
                  </button>
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量设净。')}>
                    批量设净
                  </button>
                </div>
              ) : null}
            </div>
            <div className="day-action-popover month-batch-action">
              <button
                type="button"
                className="month-outline-action"
                onClick={() => setOpenMenu(openMenu === 'openClose' ? null : 'openClose')}
              >
                批量开/关房
              </button>
              {openMenu === 'openClose' ? (
                <div className="day-popover-menu day-popover-menu--batch" role="menu" aria-label="批量开/关房">
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量关房。')}>
                    批量关房
                  </button>
                  <button type="button" role="menuitem" onClick={() => blockAction('请选择房间后再批量开房。')}>
                    批量开房
                  </button>
                </div>
              ) : null}
            </div>
            <div className="day-toolbar__refresh-group">
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
                onClick={() => setRefreshPopoverOpen((current) => !current)}
              >
                ⟳
              </button>
              <OrderRefreshPopover
                open={refreshPopoverOpen}
                onRefresh={() => {
                  setRefreshPopoverOpen(false)
                  setFeedback('美团酒店订单已刷新。')
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="day-status-layout">
        <div className={`day-room-area${isFloorView ? ' day-room-area--floor' : ''}`}>
          {isRoomNumberView ? (
            <RoomNumberView
              rooms={roomCards}
              loading={loading}
              error={error}
              setHoveredBooking={setHoveredBooking}
              setSelectedBooking={setSelectedBooking}
              setRoomActionAnchor={setRoomActionAnchor}
              setFeedback={setFeedback}
            />
          ) : null}
          {isRoomTypeView ? (
            <RoomTypeView
              summaries={roomTypeSummaries}
              loading={loading}
              error={error}
              setHoveredBooking={setHoveredBooking}
              setSelectedBooking={setSelectedBooking}
              setRoomActionAnchor={setRoomActionAnchor}
              setFeedback={setFeedback}
            />
          ) : null}
          {isFloorView ? <FloorEmptyState onOpenSettings={() => navigate('/setting/roomTypeInfo')} /> : null}
        </div>

        <aside className="day-filter-panel">
          <div className="day-filter-tabs">
            {viewModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={viewMode === mode ? 'is-active' : ''}
                onClick={() => {
                  setViewMode(mode)
                  setFeedback(`已切换为${mode}。`)
                }}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="day-filter-summary">{viewMode}视图</div>
          {selectedFilters.length > 0 ? (
            <div className="day-filter-tags">
              {selectedFilters.map((filter) => (
                <span key={filter}>已筛选：{filter}</span>
              ))}
            </div>
          ) : null}

          {!isFloorView ? (
            <>
              {statusGroups.map((group) => (
                <section key={group.title} className="day-filter-group">
                  <h3>{group.title}</h3>
                  <div className="day-filter-options">
                    {group.items.map((item) => (
                      <label key={item.label}>
                        <span style={{ '--tag-color': item.color ?? '#eef1f6' } as CSSProperties}>{item.label}</span>
                        <strong>{item.value}</strong>
                        <input
                          type="checkbox"
                          aria-label={item.label}
                          checked={selectedFilters.includes(item.label)}
                          onChange={() => {
                            toggleFilter(item.label)
                            setFeedback('')
                          }}
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}

              <section className="day-filter-group">
                <h3>渠道</h3>
                <select
                  aria-label="渠道"
                  value={selectedChannel}
                  onChange={(event) => {
                    setSelectedChannel(event.target.value)
                    setFeedback(`渠道筛选已切换，${event.target.selectedOptions[0]?.text ?? event.target.value}。`)
                  }}
                >
                  {(data?.channelOptions ?? [{ id: '', name: '渠道' }]).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </section>
              <section className="day-filter-group">
                <h3>房型</h3>
                <select
                  aria-label="房型"
                  value={selectedRoomType}
                  onChange={(event) => {
                    setSelectedRoomType(event.target.value)
                    setFeedback(`房型筛选已切换，${event.target.selectedOptions[0]?.text ?? event.target.value}。`)
                  }}
                >
                  {(data?.roomTypeOptions ?? [{ id: '', name: '房型' }]).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </section>
              <section className="day-filter-group">
                <h3>标签</h3>
                <select
                  aria-label="标签"
                  value={selectedTag}
                  onChange={(event) => {
                    setSelectedTag(event.target.value)
                    setFeedback(`标签筛选已切换，${event.target.selectedOptions[0]?.text ?? event.target.value}。`)
                  }}
                >
                  {(data?.tagOptions ?? [{ id: '', name: '房型标签' }]).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </section>
            </>
          ) : null}
        </aside>
      </section>

      {showLegend ? (
        <aside className="day-legend-dialog" role="dialog" aria-label="图例说明">
          <header>
            <strong>图例说明</strong>
            <button type="button" aria-label="关闭图例说明" onClick={() => setShowLegend(false)}>
              ×
            </button>
          </header>
          <p>空净：可售且已清洁，空脏：可售但待清洁，关房：不可售房间。</p>
          <p>批量操作需要先选择房间，执行前会再次确认。</p>
        </aside>
      ) : null}
      {hoveredBooking ? <MonthOrderPopover hoveredBooking={hoveredBooking} /> : null}
      {batchDialogMode ? (
        <BatchOperationDialog
          mode={batchDialogMode}
          state={batchDialogState}
          onChange={(patch) => setBatchDialogState((current) => ({ ...current, ...patch }))}
          onClose={() => setBatchDialogMode(null)}
          onConfirm={() => {
            setBatchDialogMode(null)
            setFeedback(
              batchDialogState.mode === 'dirty'
                ? '批量设脏已处理。'
                : batchDialogState.mode === 'clean'
                  ? '批量设净已处理。'
                  : batchDialogState.mode === 'close'
                    ? '批量关房已处理。'
                    : '批量开房已处理。',
            )
          }}
        />
      ) : null}
      {selectedBooking ? (
        <MonthOrderDrawer selectedBooking={selectedBooking} onClose={() => setSelectedBooking(null)} onAction={blockAction} />
      ) : null}
      {roomActionAnchor ? (
        <aside
          className="day-room-actions-popover"
          role="menu"
          aria-label="房间操作"
          style={{ left: roomActionAnchor.left, top: roomActionAnchor.top }}
        >
          {[
            ['录单', `已打开 ${roomActionAnchor.room.roomName} 的录单流程。`],
            ['关房', `已打开 ${roomActionAnchor.room.roomName} 的关房流程。`],
            ['设为脏房', `已将 ${roomActionAnchor.room.roomName} 设为脏房。`],
            ['查看房态日历', `已打开 ${roomActionAnchor.room.roomName} 的房态日历。`],
            ['房态日志', `已打开 ${roomActionAnchor.room.roomName} 的房态日志。`],
            ['保洁', `已打开 ${roomActionAnchor.room.roomName} 的保洁操作。`],
          ].map(([label, message]) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => {
                setRoomActionAnchor(null)
                blockAction(message)
              }}
            >
              {label}
            </button>
          ))}
        </aside>
      ) : null}
      {showStatusSettings ? (
        <aside className="day-detail-dialog" role="dialog" aria-label="房态设置">
          <header>
            <strong>房态设置</strong>
            <button type="button" aria-label="关闭房态设置" onClick={() => setShowStatusSettings(false)}>
              ×
            </button>
          </header>
          <div className="day-detail-dialog__body">
            <label>
              <span>自动刷新</span>
              <select defaultValue="5">
                <option value="5">每 5 分钟</option>
                <option value="15">每 15 分钟</option>
                <option value="manual">手动刷新</option>
              </select>
            </label>
            <label>
              <span>默认视图</span>
              <select defaultValue={viewMode}>
                {viewModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <footer>
            <button type="button" onClick={() => setShowStatusSettings(false)}>
              取消
            </button>
            <button
              type="button"
              className="primary-action"
              onClick={() => {
                setShowStatusSettings(false)
                setFeedback('房态设置已保存。')
              }}
            >
              保存设置
            </button>
          </footer>
        </aside>
      ) : null}
    </div>
  )
}
