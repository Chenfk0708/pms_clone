import { useEffect, useMemo, useState } from 'react'
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
  '总房间数：企业的房间总数。',
  '已售房间数：今日已销售的房间总数，已售房间数=在住-预离+预抵。',
  '剩余可售数：今日可销售的房间数量，不包含已售。',
  '总关房数：今日关房不可销售的房间数量。',
  '停用房：关房类型为停用房。',
  '保留房：关房类型为保留房。',
  '维修房：关房类型为维修房。',
  '联动关房：与其他房型绑定联动关系后产生的关房。',
  '总可用房数：当前可安排客人入住的房间数量。',
  '预抵：今日待入住订单数。',
  '在住：今日入住状态为入住中的订单数。',
  '预离：预计今日退房的订单数。',
  '净房：已完成清洁、可直接安排入住的房间数量。',
  '脏房：待清洁或清洁中的房间数量。',
]

const dayMs = 24 * 60 * 60 * 1000
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function RoomSituationPage() {
  const [mode, setMode] = useState<RoomSituationMode>('day')
  const [pageSizeOpen, setPageSizeOpen] = useState(false)
  const [pageSize, setPageSize] = useState(20)
  const [showMetricHelp, setShowMetricHelp] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)
  const [stores, setStores] = useState<RoomSituationStore[]>([])
  const [storeError, setStoreError] = useState('')
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
        const today = formatDate()

        if (mode === 'day') {
          const nextData = await fetchDailyRoomSituation(
            { campId, date: today, poiIds: [], pageNum: 1, pageSize },
            controller.signal,
          )
          setDailyRows(nextData.rows)
          setTotal(nextData.total)
        } else {
          const nextData = await fetchForwardRoomSituation(
            { campId, startDate: today, endDate: formatDate(30), poiIds: [], pageNum: 1, pageSize },
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
  }, [mode, pageSize, reloadKey])

  const rowsInView = mode === 'day' ? dailyRows.length : forwardRows.length
  const futureDates = useMemo(() => buildFutureDates(Math.max(1, maxForwardDays(forwardRows))), [forwardRows])
  const currentStoreName = stores[0]?.poiName ?? (storeError ? '门店请求失败' : '全部门店')

  function showTooltip(text: string) {
    setTooltip(text)
  }

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
          <div className="room-store-select">
            <button type="button" className="room-store-scope" onClick={() => showTooltip('全部门店')}>
              全部门店
            </button>
            <button type="button" className="room-store-current" onClick={() => showTooltip(currentStoreName)}>
              {currentStoreName}
            </button>
            {tooltip ? (
              <div className="room-store-tooltip" role="tooltip">
                {tooltip}
              </div>
            ) : null}
          </div>
          <button type="button" className="room-icon-button" aria-label="设置" onClick={() => showTooltip('列设置已应用')}>
            ⚙
          </button>
          <button type="button" className="room-metric-help" onClick={() => setShowMetricHelp(true)}>
            指标说明
          </button>
        </div>

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
              {metricDescriptions.map((description) => (
                <p key={description}>{description}</p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function DaySituationTable({ rows }: { rows: DailyRoomSituationRow[] }) {
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
          {rows.map((row) => (
            <tr key={row.id}>
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
  return (
    <>
      <div className="room-situation-caption">
        <span>可售=当天剩余可售，占用=订单占用+关房占用</span>
      </div>
      <div className="room-situation-table-scroll" data-testid="room-situation-table-scroll">
        <table className="room-situation-table room-situation-table--future">
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
            {rows.map((row) => (
              <tr key={row.id}>
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
    </>
  )
}

function formatDate(offset = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + offset)

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function buildFutureDates(length: number) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length }, (_, index) => {
    const date = new Date(today.getTime() + index * dayMs)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]}`
  })
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
