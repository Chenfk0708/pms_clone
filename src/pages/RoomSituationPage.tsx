import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StoreSelectControl, type StoreSelectOption } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import {
  dailyRoomSituationEndpoint,
  fetchDailyRoomSituation,
  fetchForwardRoomSituation,
  fetchRoomSituationStores,
  formatRoomSituationDataSource,
  formatRoomSituationFeedback,
  forwardRoomSituationEndpoint,
  resolveRoomSituationCampId,
  resolveRoomSituationProvider,
  type DailyRoomSituationRow,
  type ForwardRoomSituationRow,
  type RoomSituationStore,
} from '../services/roomSituation'

type RoomSituationMode = 'day' | 'future'

const dayColumns: Array<{ key: keyof Omit<DailyRoomSituationRow, 'id' | 'name'>; label: string }> = [
  { key: 'total', label: '总房间数' },
  { key: 'sold', label: '已售房间数' },
  { key: 'available', label: '剩余可售数' },
  { key: 'closed', label: '总关房数' },
  { key: 'disabled', label: '停用房' },
  { key: 'reserved', label: '保留房' },
  { key: 'repair', label: '维修房' },
  { key: 'linkedClosed', label: '联动关房' },
  { key: 'usable', label: '总可用房数' },
  { key: 'arriving', label: '预抵' },
  { key: 'occupied', label: '在住' },
  { key: 'leaving', label: '预离' },
  { key: 'clean', label: '净房' },
  { key: 'dirty', label: '脏房' },
]

const metricDescriptions = [
  { label: '总房间数', text: '企业的房间总数；' },
  { label: '已售房间数', text: '已售房间数=在住-预离+预抵；' },
  { label: '剩余可售', text: '当天剩余的可售房间数量；' },
  { label: '占用', text: '订单占用、停用房占用、维修房占用、保留房占用的占用房间总数；' },
] as const

const dayMs = 24 * 60 * 60 * 1000
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const forwardWindowDays = 30
const summaryRowId = '__room_situation_summary__'

export function RoomSituationPage() {
  const navigate = useNavigate()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [mode, setMode] = useState<RoomSituationMode>('day')
  const [forwardStartDate, setForwardStartDate] = useState(today)
  const [forwardPickerMonth, setForwardPickerMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [forwardCalendarOpen, setForwardCalendarOpen] = useState(false)
  const [pageSizeOpen, setPageSizeOpen] = useState(false)
  const [pageSize, setPageSize] = useState(20)
  const [showMetricHelp, setShowMetricHelp] = useState(false)
  const [stores, setStores] = useState<RoomSituationStore[]>([])
  const [storeError, setStoreError] = useState('')
  const [activeStoreId, setActiveStoreId] = useState('all')
  const [dailyRows, setDailyRows] = useState<DailyRoomSituationRow[]>([])
  const [forwardRows, setForwardRows] = useState<ForwardRoomSituationRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('等待加载')
  const [reloadKey, setReloadKey] = useState(0)
  const activeEndpoint = mode === 'day' ? dailyRoomSituationEndpoint : forwardRoomSituationEndpoint
  const dataSourceLabel = formatRoomSituationDataSource(activeEndpoint)
  const providerName = resolveRoomSituationProvider()

  useEffect(() => {
    const controller = new AbortController()

    async function loadStores() {
      try {
        const campId = resolveRoomSituationCampId()
        const nextStores = await fetchRoomSituationStores(campId, controller.signal)
        setStores(nextStores)
        setStoreError('')
      } catch (caught) {
        if (isAbortError(caught)) return
        setStoreError(toErrorMessage(caught))
      }
    }

    void loadStores()
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    const controller = new AbortController()

    async function loadTableData() {
      setLoading(true)
      setError('')
      setFeedback(formatRoomSituationFeedback('loading'))

      try {
        const campId = resolveRoomSituationCampId()
        const todayLabel = formatDate()

        if (mode === 'day') {
          const nextData = await fetchDailyRoomSituation(
            { campId, date: todayLabel, poiIds: activeStoreId === 'all' ? [] : [activeStoreId], pageNum: 1, pageSize },
            controller.signal,
          )
          setDailyRows(nextData.rows)
          setTotal(nextData.total)
        } else {
          const startDate = formatDateFromValue(forwardStartDate)
          const nextData = await fetchForwardRoomSituation(
            {
              campId,
              startDate,
              endDate: formatDateFromValue(shiftDate(forwardStartDate, forwardWindowDays)),
              poiIds: activeStoreId === 'all' ? [] : [activeStoreId],
              pageNum: 1,
              pageSize,
            },
            controller.signal,
          )
          setForwardRows(nextData.rows)
          setTotal(nextData.total)
        }

        setFeedback(formatRoomSituationFeedback('success'))
      } catch (caught) {
        if (isAbortError(caught)) return
        setError(toErrorMessage(caught))
        setFeedback(formatRoomSituationFeedback('failure'))
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void loadTableData()
    return () => controller.abort()
  }, [activeStoreId, forwardStartDate, mode, pageSize, reloadKey])

  const rowsInView = mode === 'day' ? dailyRows.length : forwardRows.length
  const futureDates = useMemo(
    () => buildFutureDates(forwardStartDate, Math.max(1, maxForwardDays(forwardRows))),
    [forwardRows, forwardStartDate],
  )
  const storeOptions = useMemo<StoreSelectOption[]>(
    () => [
      { id: 'all', name: '全部门店' },
      ...stores
        .filter((store) => store.poiId && store.poiId !== 'all')
        .map((store) => ({ id: store.poiId, name: store.poiName })),
    ],
    [stores],
  )
  const { storeOptions: backendStoreOptions } = useStoreOptions({
    fallbackOptions: storeOptions.map((store) => ({
      id: store.id,
      label: store.name,
    })),
    enabled: providerName === 'real',
  })
  const sharedStoreOptions = useMemo<StoreSelectOption[]>(
    () => backendStoreOptions.map((store) => ({ id: store.id, name: store.label })),
    [backendStoreOptions],
  )
  useEffect(() => {
    if (activeStoreId === 'all') return
    if (sharedStoreOptions.some((store) => store.id === activeStoreId)) return
    setActiveStoreId('all')
  }, [activeStoreId, sharedStoreOptions])
  const forwardDateLabel = `${formatDateFromValue(forwardStartDate)} ${weekdays[forwardStartDate.getDay()]}`
  const forwardCalendarCells = useMemo(
    () => buildCalendarCells(forwardPickerMonth, forwardStartDate),
    [forwardPickerMonth, forwardStartDate],
  )
  const forwardPickerLabel = `${forwardPickerMonth.getFullYear()}年 ${forwardPickerMonth.getMonth() + 1}月`

  function retry() {
    setReloadKey((value) => value + 1)
  }

  return (
    <div className="page-stack room-situation-page">
      <section className="room-situation-toolbar" aria-label="房情表筛选">
        <div className="room-situation-tabs">
          <button type="button" className={mode === 'day' ? 'is-active' : ''} onClick={() => setMode('day')}>
            单日房情表
          </button>
          <button type="button" className={mode === 'future' ? 'is-active' : ''} onClick={() => setMode('future')}>
            远期房情表
          </button>
        </div>

        <div className="room-situation-filters">
          <StoreSelectControl
            className="room-situation-store-control"
            label="门店范围"
            options={sharedStoreOptions}
            value={activeStoreId}
            onChange={(storeId) => setActiveStoreId(storeId)}
            settingsLabel="门店设置"
            onSettingsClick={() => navigate('/InformationMaintenance/campInfo')}
          />
          <button type="button" className="room-metric-help" onClick={() => setShowMetricHelp(true)}>
            指标说明
          </button>
        </div>

        {mode === 'future' ? (
          <div className="room-forward-toolbar">
            <div className="room-forward-date-nav" aria-label="远期开始日期">
              <button type="button" className="room-forward-date-nav__arrow" aria-label="上一天" onClick={() => setForwardStartDate((current) => shiftDate(current, -1))}>
                ‹
              </button>
              <button
                type="button"
                className="room-forward-date-display"
                aria-expanded={forwardCalendarOpen}
                onClick={() => {
                  setForwardPickerMonth(new Date(forwardStartDate.getFullYear(), forwardStartDate.getMonth(), 1))
                  setForwardCalendarOpen((current) => !current)
                }}
              >
                <strong>{forwardDateLabel}</strong>
                <span aria-hidden="true">📅</span>
              </button>
              <button type="button" className="room-forward-date-nav__arrow" aria-label="下一天" onClick={() => setForwardStartDate((current) => shiftDate(current, 1))}>
                ›
              </button>
              {forwardCalendarOpen ? (
                <div className="room-forward-calendar" role="dialog" aria-label="选择远期开始日期">
                  <div className="room-forward-calendar__header">
                    <div className="room-forward-calendar__nav">
                      <button type="button" aria-label="上一年" onClick={() => setForwardPickerMonth((current) => new Date(current.getFullYear() - 1, current.getMonth(), 1))}>
                        «
                      </button>
                      <button type="button" aria-label="上一月" onClick={() => setForwardPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                        ‹
                      </button>
                    </div>
                    <strong>{forwardPickerLabel}</strong>
                    <div className="room-forward-calendar__nav">
                      <button type="button" aria-label="下一月" onClick={() => setForwardPickerMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                        ›
                      </button>
                      <button type="button" aria-label="下一年" onClick={() => setForwardPickerMonth((current) => new Date(current.getFullYear() + 1, current.getMonth(), 1))}>
                        »
                      </button>
                    </div>
                  </div>
                  <div className="room-forward-calendar__weekdays">
                    {['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (
                      <span key={weekday}>{weekday}</span>
                    ))}
                  </div>
                  <div className="room-forward-calendar__grid">
                    {forwardCalendarCells.map((cell) => (
                      <button
                        key={cell.isoDate}
                        type="button"
                        className={`room-forward-calendar__cell${cell.inViewMonth ? ' is-in-month' : ''}${cell.isSelected ? ' is-selected' : ''}`}
                        onClick={() => {
                          setForwardStartDate(parseDateValue(cell.isoDate))
                          setForwardCalendarOpen(false)
                        }}
                      >
                        {cell.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="room-forward-calendar__today"
                    onClick={() => {
                      setForwardStartDate(today)
                      setForwardPickerMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                      setForwardCalendarOpen(false)
                    }}
                  >
                    今天
                  </button>
                </div>
              ) : null}
            </div>
            <div className="room-situation-caption">
              <span>可售=当天剩余可售，占用=订单占用+关房占用</span>
            </div>
          </div>
        ) : null}

        <div className="room-request-status" aria-live="polite" data-provider={providerName} data-endpoint={activeEndpoint}>
          <div className="room-data-source" aria-label="房情表数据来源">
            数据来源：{dataSourceLabel}
          </div>
          <div className="room-feedback" aria-label="房情表操作反馈">
            {loading ? formatRoomSituationFeedback('loading') : feedback}
          </div>
          {storeError ? <div className="room-store-warning">门店加载失败：{storeError}</div> : null}
        </div>
      </section>

      <section className="room-situation-board">
        {error ? (
          <div className="room-error" role="alert">
            <strong>{error}</strong>
            <button type="button" onClick={retry} disabled={loading}>
              重试
            </button>
          </div>
        ) : null}

        {loading ? <div className="room-loading">正在加载房情表数据...</div> : null}

        {!loading && !error && rowsInView === 0 ? <div className="room-empty">暂无房情表数据</div> : null}

        {mode === 'future' ? (
          <FutureSituationTable rows={forwardRows} dates={futureDates} />
        ) : (
          <DaySituationTable rows={dailyRows} />
        )}

        <footer className="room-situation-pagination">
          <span>
            第 {rowsInView === 0 ? 0 : 1}-{rowsInView} 条 总共 {total} 条
          </span>
          <button type="button" className="is-active">
            1
          </button>
          <div className="room-page-size-wrap">
            <button type="button" className="room-page-size" onClick={() => setPageSizeOpen((value) => !value)}>
              {pageSize} 条/页
            </button>
            {pageSizeOpen ? (
              <div className="room-page-size-options" role="listbox" aria-label="每页条数">
                {[10, 20, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="option"
                    aria-selected={pageSize === size}
                    onClick={() => {
                      setPageSize(size)
                      setPageSizeOpen(false)
                    }}
                  >
                    {size} 条/页
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </footer>
      </section>

      {showMetricHelp ? (
        <div className="room-metric-drawer-backdrop" onClick={() => setShowMetricHelp(false)}>
          <section
            className="room-metric-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="指标说明"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>指标说明</h2>
              <button type="button" aria-label="关闭指标说明" onClick={() => setShowMetricHelp(false)}>
                ×
              </button>
            </header>
            <div className="room-metric-drawer__body">
              {metricDescriptions.map((item) => (
                <p key={item.label}>
                  <strong>{item.label}：</strong>
                  {item.text}
                </p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function DaySituationTable({ rows }: { rows: DailyRoomSituationRow[] }) {
  const displayRows = withDailySummaryRow(rows)

  return (
    <div className="room-situation-table-scroll" data-testid="room-situation-table-scroll">
      <table className="room-situation-table">
        <thead>
          <tr>
            <th className="room-type-column">房型名称</th>
            {dayColumns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row) => (
            <tr key={row.id} className={isSummaryRow(row) ? 'is-summary' : undefined}>
              <th className="room-type-column">
                <span className="room-row-summary">{formatDailyRowSummary(row)}</span>
                <span>{row.name}</span>
              </th>
              {dayColumns.map((column) => (
                <td key={column.key}> {row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FutureSituationTable({ rows, dates }: { rows: ForwardRoomSituationRow[]; dates: string[] }) {
  const displayRows = withForwardSummaryRow(rows)
  const tableMinWidth = Math.max(1400, 220 + dates.length * 112)

  return (
    <div className="room-situation-future-wrap">
      <div className="room-situation-table-scroll" data-testid="room-situation-table-scroll">
        <table className="room-situation-table room-situation-table--future" style={{ minWidth: `${tableMinWidth}px` }}>
          <thead>
            <tr>
              <th className="room-type-column" rowSpan={2}>
                房型
              </th>
              <th rowSpan={2}>总房间数</th>
              {dates.map((date) => (
                <th key={date} colSpan={2}>
                  {date}
                </th>
              ))}
            </tr>
            <tr>
              {dates.flatMap((date) => [
                <th key={`${date}-available`}>剩余可售</th>,
                <th key={`${date}-occupied`}>占用</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row) => (
              <tr key={row.id} className={isSummaryRow(row) ? 'is-summary' : undefined}>
                <th className="room-type-column">
                  <span className="room-row-summary">{formatForwardRowSummary(row)}</span>
                  <span>{row.name}</span>
                </th>
                <td> {row.total}</td>
                {row.days.flatMap((day, index) => [
                  <td key={`${row.id}-${dates[index] ?? index}-available`}> {day.available}</td>,
                  <td key={`${row.id}-${dates[index] ?? index}-occupied`}> {day.occupied}</td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function withDailySummaryRow(rows: DailyRoomSituationRow[]) {
  const detailRows = rows.filter((row) => !isSummaryRow(row))
  if (detailRows.length === 0) return rows

  const summary = createEmptyDailySummaryRow()
  for (const row of detailRows) {
    for (const column of dayColumns) {
      summary[column.key] += row[column.key]
    }
  }

  return [summary, ...detailRows]
}

function withForwardSummaryRow(rows: ForwardRoomSituationRow[]) {
  const detailRows = rows.filter((row) => !isSummaryRow(row))
  if (detailRows.length === 0) return rows

  const dayCount = maxForwardDays(detailRows)
  const summary: ForwardRoomSituationRow = {
    id: summaryRowId,
    name: '合计',
    total: detailRows.reduce((sum, row) => sum + row.total, 0),
    days: Array.from({ length: dayCount }, (_, index) => ({
      available: detailRows.reduce((sum, row) => sum + (row.days[index]?.available ?? 0), 0),
      occupied: detailRows.reduce((sum, row) => sum + (row.days[index]?.occupied ?? 0), 0),
    })),
  }

  return [summary, ...detailRows]
}

function createEmptyDailySummaryRow(): DailyRoomSituationRow {
  return {
    id: summaryRowId,
    name: '合计',
    total: 0,
    sold: 0,
    available: 0,
    closed: 0,
    disabled: 0,
    reserved: 0,
    repair: 0,
    linkedClosed: 0,
    usable: 0,
    arriving: 0,
    occupied: 0,
    leaving: 0,
    clean: 0,
    dirty: 0,
  }
}

function isSummaryRow(row: { id: string; name: string }) {
  return row.id === summaryRowId || row.name.trim() === '合计'
}

function formatDate(offset = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildFutureDates(startDate: Date, length: number) {
  return Array.from({ length }, (_, index) => {
    const date = shiftDate(startDate, index)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]}`
  })
}

function buildCalendarCells(cursorMonth: Date, selectedDate: Date) {
  const monthStart = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1)
  const firstGridDate = shiftDate(monthStart, -((monthStart.getDay() + 6) % 7))
  const selectedIsoDate = formatDateFromValue(selectedDate)

  return Array.from({ length: 42 }, (_, index) => {
    const date = shiftDate(firstGridDate, index)
    return {
      isoDate: formatDateFromValue(date),
      label: String(date.getDate()),
      inViewMonth: date.getMonth() === cursorMonth.getMonth(),
      isSelected: formatDateFromValue(date) === selectedIsoDate,
    }
  })
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function shiftDate(date: Date, offset: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + offset)
}

function formatDateFromValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

function maxForwardDays(rows: ForwardRoomSituationRow[]) {
  return rows.reduce((max, row) => Math.max(max, row.days.length), 0)
}

function formatDailyRowSummary(row: DailyRoomSituationRow) {
  return [row.name, ...dayColumns.map((column) => row[column.key])].join(' ')
}

function formatForwardRowSummary(row: ForwardRoomSituationRow) {
  return [
    row.name,
    row.total,
    ...row.days.flatMap((day) => [day.available, day.occupied]),
  ].join(' ')
}

function toErrorMessage(caught: unknown) {
  return caught instanceof Error ? caught.message : String(caught)
}

function isAbortError(caught: unknown) {
  return caught instanceof DOMException && caught.name === 'AbortError'
}
