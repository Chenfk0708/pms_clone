import { type MouseEvent as ReactMouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
        <aside className="month-order-drawer" role="dialog" aria-label="订单详情" onClick={(event) => event.stopPropagation()}>
          <header className="month-order-drawer__header">
            <div>
              <strong>订单详情</strong>
              <span>全日房</span>
            </div>
            <button type="button" aria-label="关闭订单详情" onClick={() => setSelectedBooking(null)}>
              ×
            </button>
          </header>

          <nav className="month-order-drawer__tabs" aria-label="订单详情标签">
            <button type="button" className="is-active">订单信息</button>
            <button type="button">渠道信息</button>
            <button type="button">操作日志</button>
          </nav>

          <div className="month-order-drawer__body">
            <section className="month-order-card">
              <div className="month-order-card__guest">
                <strong>{selectedBooking.cell.title}</strong>
                <span>直{selectedBooking.cell.subtitle ?? '携程'}</span>
              </div>
              <p>手机号：{selectedBooking.cell.phone ?? '无'}</p>
              <p>渠道单号：5116035240226051843</p>
            </section>

            <section className="month-room-order-card">
              <div className="month-room-order-card__top">
                <strong>{selectedBooking.roomType}（{selectedBooking.roomLabel}）</strong>
                <span>待入住</span>
              </div>
              <div className="month-room-order-card__stay">2026.05.18-2026.05.20 2晚</div>
              <div className="month-room-order-card__amount">¥ 664</div>
              <div className="month-room-order-card__guest">
                <span>入住人（0/1）</span>
                <button type="button" onClick={() => showActionResult('登记入住人')}>登记入住人</button>
              </div>
              <em>{selectedBooking.roomType}</em>
            </section>

            <section className="month-finance-card">
              <div className="month-finance-summary">
                <span>房费(减佣):<strong>¥597.60</strong></span>
                <span>订单总收入:<strong>¥664.00</strong></span>
              </div>
              <div className="month-finance-meta">
                <span>佣金:¥66.40</span>
                <span>房费(含佣):¥664.00</span>
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
                    <td>{selectedBooking.roomType}({selectedBooking.roomLabel})</td>
                    <td>298.8</td>
                    <td>298.8</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="month-info-block">
              <h3>房费收款</h3>
              <div><span>收款金额: ￥1624</span><span>房费欠款: ￥0</span></div>
            </section>

            <section className="month-info-block">
              <h3>开票信息</h3>
            </section>

            <section className="month-info-block">
              <h3>其他收入/支出</h3>
              <p>0项/¥0.00</p>
            </section>
          </div>

          <footer className="month-order-drawer__footer">
            <div className="month-order-actions">
              {['邀请登记', '入住人', '置为noshow', '换房', '取消排房', '不占库存', '不计入统计', '设为续住单', '取消房单', '保洁', '打印'].map((action) => (
                <button key={action} type="button" onClick={() => showActionResult(action)}>{action}</button>
              ))}
            </div>
            <div className="month-order-footer-row">
              <div>
                <span>房费(减佣)：¥597.60</span>
                <span>订单总收入：¥664.00</span>
              </div>
              <button type="button" onClick={() => showActionResult('更多操作')}>更多操作</button>
              <button type="button" className="is-primary" onClick={() => showActionResult('收款')}>收 款</button>
              <button type="button" onClick={() => showActionResult('信用住结账')}>信用住结账</button>
              <button type="button" className="is-primary" onClick={() => showActionResult('入住')}>入住</button>
              <button type="button" onClick={() => showActionResult('退房')}>退房</button>
            </div>
          </footer>
        </aside>
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
