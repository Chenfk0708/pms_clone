import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  exportTotalLedger,
  getDefaultTotalLedgerQuery,
  getDefaultTotalLedgerRangeKey,
  getTotalLedgerProviderName,
  getTotalLedgerRangePresets,
  loadTotalLedgerData,
  type TotalLedgerData,
  type TotalLedgerQuery,
  type TotalLedgerRangeKey,
} from '../services/totalLedger'
import './TotalLedgerPage.css'

type DatePickTarget = 'start' | 'end'
type DatePanelPosition = { top: number; left: number }

const rangePresets = getTotalLedgerRangePresets()
const defaultQuery = getDefaultTotalLedgerQuery()

export function TotalLedgerPage() {
  const [activeStoreId, setActiveStoreId] = useState('all')
  const [query, setQuery] = useState<TotalLedgerQuery>(defaultQuery)
  const [activeRange, setActiveRange] = useState<TotalLedgerRangeKey | ''>(getDefaultTotalLedgerRangeKey(defaultQuery))
  const [panelRange, setPanelRange] = useState(() => ({
    beginTime: defaultQuery.beginTime,
    endTime: defaultQuery.endTime,
  }))
  const [data, setData] = useState<TotalLedgerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadSeq, setReloadSeq] = useState(0)
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false)
  const [datePickTarget, setDatePickTarget] = useState<DatePickTarget>('start')
  const [calendarMonth, setCalendarMonth] = useState(() => defaultQuery.beginTime.slice(0, 7))
  const [datePanelPosition, setDatePanelPosition] = useState<DatePanelPosition>({ top: 0, left: 0 })
  const [isExporting, setIsExporting] = useState(false)
  const dateRangeRef = useRef<HTMLDivElement | null>(null)

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setError('')
      try {
        const result = await loadTotalLedgerData(query, signal)
        setData(result)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : '收支汇总服务暂不可用，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    },
    [query],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void fetchData(controller.signal)
      }
    })
    return () => controller.abort()
  }, [fetchData, reloadSeq])

  const contractProvider = data?.provider ?? getTotalLedgerProviderName()
  const contractMockState = data?.mockState ?? readCurrentMockState()
  const requestBody = data?.requestBody ?? query
  const stores =
    data?.stores ?? [
      { id: 'all', label: '全部门店' },
      { id: defaultQuery.campId, label: '天落会宿公寓(前海壹方城宝安中心店)' },
    ]
  const activeStoreLabel = stores.find((item) => item.id === activeStoreId)?.label ?? '全部门店'
  const pageStart = data?.pagination.total ? 1 : 0
  const pageEnd = data?.pagination.total ? Math.min(data.pagination.total, data.pagination.pageSize) : 0
  const ratioCards = useMemo(
    () => [
      {
        title: '收入占比',
        items: data?.income ?? [],
        total: data?.summary.totalIncomePrice ?? 0,
        emptyText: '暂无数据',
      },
      {
        title: '支出占比',
        items: data?.expend.filter((item) => item.price > 0) ?? [],
        total: data?.summary.totalExpendPrice ?? 0,
        emptyText: '暂无数据',
      },
    ],
    [data],
  )

  function openDatePanel(target: DatePickTarget = 'start') {
    setDatePickTarget(target)
    setPanelRange({ beginTime: query.beginTime, endTime: query.endTime })
    setCalendarMonth(query.beginTime.slice(0, 7))
    const rect = dateRangeRef.current?.getBoundingClientRect()
    if (rect) {
      setDatePanelPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 624)),
      })
    }
    setIsDatePanelOpen(true)
  }

  function applyRange(nextRange: TotalLedgerRangeKey) {
    const preset = rangePresets.find((item) => item.key === nextRange)
    if (!preset) return
    setActiveRange(nextRange)
    setPanelRange({ beginTime: preset.beginTime, endTime: preset.endTime })
    setQuery((current) => ({
      ...current,
      beginTime: preset.beginTime,
      endTime: preset.endTime,
      pageNum: 1,
    }))
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
  }

  function applyStore(storeId: string) {
    setActiveStoreId(storeId)
    setQuery((current) => ({
      ...current,
      poiIds: storeId === 'all' ? [] : [storeId],
      pageNum: 1,
    }))
  }

  function applyDateSelection(date: string) {
    if (datePickTarget === 'start') {
      const nextEndTime = date <= panelRange.endTime ? panelRange.endTime : date
      setPanelRange({ beginTime: date, endTime: nextEndTime })
      setDatePickTarget('end')
      return
    }

    const nextBeginTime = date < panelRange.beginTime ? date : panelRange.beginTime
    const nextEndTime = date < panelRange.beginTime ? panelRange.beginTime : date
    setPanelRange({ beginTime: nextBeginTime, endTime: nextEndTime })
    setQuery((current) => ({
      ...current,
      beginTime: nextBeginTime,
      endTime: nextEndTime,
      pageNum: 1,
    }))
    setActiveRange(resolveRangeKey(nextBeginTime, nextEndTime))
    setDatePickTarget('start')
    setIsDatePanelOpen(false)
  }

  function resetFilters() {
    setActiveStoreId('all')
    setActiveRange(getDefaultTotalLedgerRangeKey(defaultQuery))
    setPanelRange({ beginTime: defaultQuery.beginTime, endTime: defaultQuery.endTime })
    setQuery(defaultQuery)
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
    setError('')
  }

  async function handleExport() {
    setIsExporting(true)
    setError('')
    try {
      await exportTotalLedger(query)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : '收支汇总导出失败，请稍后重试')
    } finally {
      setIsExporting(false)
    }
  }

  function retryLoad() {
    setReloadSeq((current) => current + 1)
  }

  return (
    <div className="total-ledger-page">
      <div
        data-testid="total-ledger-service-contract"
        data-provider={contractProvider}
        data-endpoint="/accountBookPaymentWay/page/get"
        data-export-endpoint="/accountBookPaymentWay/page/get"
        data-mock-state={contractMockState}
        data-request-body={JSON.stringify(requestBody)}
        hidden
      />

      <h1 className="sr-only-heading">收支汇总</h1>

      <section className="total-ledger-filter" aria-label="收支汇总筛选">
        <div className="total-ledger-store-head">
          <div className="total-ledger-store-row" role="radiogroup" aria-label="门店">
            {stores.map((store) => (
              <button
                key={store.id}
                type="button"
                role="radio"
                aria-checked={activeStoreId === store.id}
                className={activeStoreId === store.id ? 'is-active' : ''}
                onClick={() => applyStore(store.id)}
                disabled={isLoading || isExporting}
              >
                {store.label}
              </button>
            ))}
          </div>
        </div>

        <div className="total-ledger-query-row">
          <div className="total-ledger-query-main">
            <div className="total-ledger-range-buttons" role="group" aria-label="日期快捷筛选">
              {rangePresets.map((range) => (
                <button
                  key={range.key}
                  type="button"
                  className={activeRange === range.key ? 'is-active' : ''}
                  onClick={() => applyRange(range.key)}
                  disabled={isLoading || isExporting}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div
              ref={dateRangeRef}
              className="total-ledger-date-range"
              role="button"
              tabIndex={0}
              aria-label="收支汇总日期范围"
              onClick={() => openDatePanel('start')}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openDatePanel('start')
                }
              }}
            >
              <button
                type="button"
                className="total-ledger-date-field"
                aria-label="开始日期"
                onClick={(event) => {
                  event.stopPropagation()
                  openDatePanel('start')
                }}
              >
                <span>{query.beginTime}</span>
              </button>
              <em aria-hidden="true">至</em>
              <button
                type="button"
                className="total-ledger-date-field"
                aria-label="结束日期"
                onClick={(event) => {
                  event.stopPropagation()
                  openDatePanel('end')
                }}
              >
                <span>{query.endTime}</span>
              </button>
              <i aria-hidden="true" />
            </div>
          </div>

          <div className="total-ledger-actions">
            <button type="button" className="is-outline" onClick={resetFilters} disabled={isLoading || isExporting}>
              重置
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={() => void handleExport()}
              disabled={isLoading || isExporting || Boolean(error)}
            >
              {isExporting ? '导出中...' : '导出'}
            </button>
          </div>
        </div>
      </section>

      {isDatePanelOpen ? (
        <DatePanel
          month={calendarMonth}
          startDate={panelRange.beginTime}
          endDate={panelRange.endTime}
          pickTarget={datePickTarget}
          position={datePanelPosition}
          onClose={() => {
            setIsDatePanelOpen(false)
            setDatePickTarget('start')
            setPanelRange({ beginTime: query.beginTime, endTime: query.endTime })
          }}
          onPrevious={() => setCalendarMonth((current) => shiftMonth(current, -1))}
          onNext={() => setCalendarMonth((current) => shiftMonth(current, 1))}
          onPick={applyDateSelection}
        />
      ) : null}

      <div className="sr-only-heading" role="status" aria-label="收支汇总操作反馈">
        {isLoading ? '正在加载收支汇总' : ''}
      </div>

      {error ? (
        <div className="total-ledger-alert" role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={retryLoad}>
            重新加载
          </button>
        </div>
      ) : null}

      <section className="total-ledger-summary" aria-label="账本概况">
        <article className="total-ledger-card total-ledger-balance-card">
          <div className="total-ledger-card__head">
            <h2>账本概况</h2>
          </div>
          <div className="total-ledger-balance">
            <div className="total-ledger-balance__icon">净收入</div>
            <div className="total-ledger-balance__content">
              <span>{activeStoreLabel}</span>
              <strong>{formatCurrency(data?.summary.netIncome ?? 0)}</strong>
              <p>总收入：{formatCurrency(data?.summary.totalIncomePrice ?? 0)}</p>
              <p>总支出：{formatCurrency(data?.summary.totalExpendPrice ?? 0)}</p>
            </div>
          </div>
        </article>

        {ratioCards.map((card) => (
          <RatioCard
            key={card.title}
            title={card.title}
            items={card.items}
            total={card.total}
            emptyText={card.emptyText}
          />
        ))}
      </section>

      <section className="total-ledger-table-section" aria-label="收支汇总表">
        <div className="total-ledger-table-section__head">
          <h2>收支汇总表</h2>
        </div>
        <div className="total-ledger-table-wrap">
          {error ? null : isLoading ? (
            <div className="total-ledger-table-loading">正在加载数据</div>
          ) : data?.rows.length ? (
            <>
              <table className="total-ledger-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    {data.paymentWays.map((way) => (
                      <th key={way.paymentWayId}>{way.paymentWayName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.date} className={row.date === '合计' ? 'is-summary' : ''}>
                      <td>{row.date}</td>
                      {data.paymentWays.map((way) => (
                        <td key={`${row.date}-${way.paymentWayId}`}>{formatAmount(row.values[way.paymentWayId] ?? 0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <nav className="total-ledger-pagination" aria-label="分页">
                <span>
                  第 {pageStart}-{pageEnd} 条，共 {data.pagination.total} 条
                </span>
                <button type="button" className="is-current">
                  {data.pagination.current}
                </button>
              </nav>
            </>
          ) : (
            <>
              <div className="total-ledger-empty" role="status" aria-label="收支汇总空状态">
                当前条件暂无收支汇总数据
              </div>
              <nav className="total-ledger-pagination" aria-label="分页">
                <span>第 0-0 条，共 0 条</span>
                <button type="button" className="is-current">
                  1
                </button>
              </nav>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

function RatioCard({
  title,
  items,
  total,
  emptyText,
}: {
  title: string
  items: TotalLedgerData['income']
  total: number
  emptyText: string
}) {
  const hasValues = items.length > 0 && total > 0
  const chartStyle = hasValues ? { backgroundImage: buildConicGradient(items, total) } : undefined

  return (
    <article className="total-ledger-card total-ledger-ratio-card" aria-label={title}>
      <div className="total-ledger-card__head">
        <h2>{title}</h2>
      </div>
      {hasValues ? (
        <div className="total-ledger-ratio-body">
          <div className="total-ledger-donut" style={chartStyle}>
            <span>{formatPercent(items[0]?.price ?? 0, total)}</span>
          </div>
          <ul className="total-ledger-ratio-legend">
            {items.map((item, index) => (
              <li key={`${title}-${item.paymentWayId}`}>
                <i style={{ background: pickChartColor(index) }} />
                <span>{item.paymentWayName}</span>
                <strong>{formatPercent(item.price, total)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="total-ledger-ratio-empty">{emptyText}</div>
      )}
    </article>
  )
}

function DatePanel({
  month,
  startDate,
  endDate,
  pickTarget,
  position,
  onClose,
  onPrevious,
  onNext,
  onPick,
}: {
  month: string
  startDate: string
  endDate: string
  pickTarget: DatePickTarget
  position: DatePanelPosition
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onPick: (date: string) => void
}) {
  const months = [month, shiftMonth(month, 1)]

  return (
    <div className="total-ledger-date-panel-wrap" role="presentation" onMouseDown={onClose}>
      <section
        className="total-ledger-date-panel"
        role="dialog"
        aria-label="收支汇总日期面板"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="total-ledger-date-panel__header">
          <strong>{pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期'}</strong>
          <button type="button" aria-label="关闭收支汇总日期面板" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="total-ledger-date-panel__range">
          <span>{startDate}</span>
          <em>至</em>
          <span>{endDate}</span>
        </div>
        <div className="total-ledger-date-panel__months">
          {months.map((item, index) => (
            <CalendarMonth
              key={item}
              month={item}
              startDate={startDate}
              endDate={endDate}
              onPrevious={index === 0 ? onPrevious : undefined}
              onNext={index === months.length - 1 ? onNext : undefined}
              onPick={onPick}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function CalendarMonth({
  month,
  startDate,
  endDate,
  onPrevious,
  onNext,
  onPick,
}: {
  month: string
  startDate: string
  endDate: string
  onPrevious?: () => void
  onNext?: () => void
  onPick: (date: string) => void
}) {
  const days = buildCalendarDays(month)

  return (
    <section className="total-ledger-calendar-month" aria-label={formatMonthLabel(month)}>
      <header>
        <button type="button" aria-label="上个月" onClick={onPrevious} disabled={!onPrevious}>
          ‹
        </button>
        <strong>{formatMonthLabel(month)}</strong>
        <button type="button" aria-label="下个月" onClick={onNext} disabled={!onNext}>
          ›
        </button>
      </header>
      <div className="total-ledger-calendar-month__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="total-ledger-calendar-month__days">
        {days.map((day) => {
          const inRange = day.date >= startDate && day.date <= endDate
          const isSelected = day.date === startDate || day.date === endDate
          return (
            <button
              key={day.date}
              type="button"
              aria-label={day.date}
              className={`${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`}
              onClick={() => onPick(day.date)}
            >
              {day.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function resolveRangeKey(beginTime: string, endTime: string): TotalLedgerRangeKey | '' {
  return rangePresets.find((item) => item.beginTime === beginTime && item.endTime === endTime)?.key ?? ''
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const nextDate = new Date(year, monthIndex - 1 + offset, 1)
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string) {
  const [year, monthValue] = month.split('-')
  return `${year}年${Number(monthValue)}月`
}

function buildCalendarDays(month: string) {
  const [year, monthValue] = month.split('-').map(Number)
  const firstDay = new Date(year, monthValue - 1, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, monthValue - 1, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      label: String(date.getDate()),
      isMuted: date.getMonth() !== monthValue - 1,
    }
  })
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`
}

function formatAmount(value: number) {
  return value.toFixed(2)
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0.00%'
  return `${((value / total) * 100).toFixed(2)}%`
}

function buildConicGradient(items: Array<{ price: number }>, total: number) {
  let start = 0
  const segments = items.map((item, index) => {
    const ratio = total <= 0 ? 0 : (item.price / total) * 100
    const end = start + ratio
    const segment = `${pickChartColor(index)} ${start}% ${end}%`
    start = end
    return segment
  })
  if (!segments.length) return 'none'
  return `conic-gradient(${segments.join(', ')})`
}

function pickChartColor(index: number) {
  const palette = ['#4d65f6', '#43b581', '#ff8a3d', '#f2c94c']
  return palette[index % palette.length]
}

function readCurrentMockState() {
  if (typeof window === 'undefined') return 'success'
  const params = new URLSearchParams(window.location.search)
  const configured = params.get('mockState') || params.get('totalLedgerMockMode')
  return configured === 'empty' || configured === 'error' || configured === 'success' ? configured : 'success'
}
