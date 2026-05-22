import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  buildStatisticsReportQueryForPreset,
  createDefaultStatisticsReportQuery,
  fetchStatisticsReportDashboard,
  statisticsReportPresetOptions,
  type StatisticsReportDashboard,
  type StatisticsReportOption,
  type StatisticsReportPreset,
  type StatisticsReportQuery,
  type StatisticsReportTrendKey,
} from '../services/statisticsReport'
import './ReportPage.css'

type ReportMode = 'overview' | 'future'
type FilterKey = 'roomType' | 'channel' | 'tag' | null
type StoreScope = 'all' | 'current'
type DatePickTarget = 'start' | 'end'
type DatePanelPosition = { top: number; left: number }
export function ReportPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState(createInitialQuery)
  const [dashboard, setDashboard] = useState<StatisticsReportDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('统计概览看板已加载')
  const [mode, setMode] = useState<ReportMode>('overview')
  const [openFilter, setOpenFilter] = useState<FilterKey>(null)
  const [activeTrendKey, setActiveTrendKey] = useState<StatisticsReportTrendKey>('businessIncome')
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false)
  const [storeScope, setStoreScope] = useState<StoreScope>('current')
  const [calendarMonth, setCalendarMonth] = useState(() => query.startDate.slice(0, 7))
  const [datePickTarget, setDatePickTarget] = useState<DatePickTarget>('start')
  const [datePanelPosition, setDatePanelPosition] = useState<DatePanelPosition>({ top: 0, left: 0 })
  const dateRangeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchStatisticsReportDashboard(query, controller.signal)
      .then((nextDashboard) => {
        setDashboard(nextDashboard)
        setError('')
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setDashboard(null)
        setError(reason instanceof Error ? reason.message : '统计概览加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [query])

  const trendMetric =
    dashboard?.trendMetrics.find((item) => item.key === activeTrendKey) ?? dashboard?.trendMetrics[0] ?? null
  const roomTypeLabel = selectedLabel(
    dashboard?.roomTypeOptions ?? [],
    query.roomCategoryIds[0],
    '全部房型',
  )
  const channelLabel = selectedLabel(dashboard?.channelOptions ?? [], query.channelIds[0], '全部渠道')
  const roomTagLabel = dashboard && dashboard.roomTagOptions.length > 0 ? '全部房型标签' : '暂无房型标签'
  const contractText = useMemo(
    () =>
      JSON.stringify(
        {
          provider: dashboard?.provider ?? 'mock',
          state: dashboard?.state ?? query.state ?? 'success',
          endpoint: dashboard?.endpoint ?? '/report/accommodation/management/analysis/get',
          requestBody: dashboard?.requestBody ?? null,
          overviewSnapshot: dashboard?.overviewSnapshot ?? null,
          traceId: dashboard?.traceId ?? null,
          timestamp: dashboard?.timestamp ?? null,
        },
      ),
    [dashboard, query.state],
  )

  const isEmpty = !loading && !error && dashboard?.state === 'empty'
  const activePreset = findMatchingPreset(query.startDate, query.endDate)

  function switchPreset(preset: StatisticsReportPreset, label: string) {
    setLoading(true)
    setError('')
    setOpenFilter(null)
    setIsDatePanelOpen(false)
    setQuery((current) => {
      const next = buildStatisticsReportQueryForPreset(preset, current)
      return {
        ...next,
        roomCategoryIds: current.roomCategoryIds,
        channelIds: current.channelIds,
        roomCategoryGroupIds: current.roomCategoryGroupIds,
        state: current.state,
      }
    })
    setNotice(`已切换到${label}`)
  }

  function updateQuery(next: Partial<StatisticsReportQuery>, message: string) {
    setLoading(true)
    setError('')
    setOpenFilter(null)
    setQuery((current) => ({ ...current, ...next }))
    setNotice(message)
  }

  function openDatePanel(target: DatePickTarget = 'start') {
    setOpenFilter(null)
    setDatePickTarget(target)
    setCalendarMonth(query.startDate.slice(0, 7))
    const rect = dateRangeRef.current?.getBoundingClientRect()
    if (rect) {
      setDatePanelPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 600)),
      })
    }
    setIsDatePanelOpen(true)
  }

  function applyDateSelection(date: string) {
    if (datePickTarget === 'start') {
      const nextEndDate = date <= query.endDate ? query.endDate : date
      updateQuery({ startDate: date, endDate: nextEndDate }, '已更新统计日期')
      setDatePickTarget('end')
      return
    }

    const nextStartDate = date < query.startDate ? date : query.startDate
    const nextEndDate = date < query.startDate ? query.startDate : date
    updateQuery({ startDate: nextStartDate, endDate: nextEndDate }, '已更新统计日期')
    setDatePickTarget('start')
    setIsDatePanelOpen(false)
  }

  function retryDashboard() {
    setLoading(true)
    setError('')
    setOpenFilter(null)
    setQuery(createInitialQuery())
    setNotice('统计概览看板已重新加载')
  }

  function switchStoreScope(nextScope: StoreScope) {
    setStoreScope(nextScope)
    setNotice(nextScope === 'all' ? '已切换到全部门店视角' : '已切换到当前门店视角')
  }

  function openTagSelect() {
    setOpenFilter(openFilter === 'tag' ? null : 'tag')
    if ((dashboard?.roomTagOptions.length ?? 0) === 0) {
      setNotice('当前门店暂无房型标签可筛选')
    }
  }

  return (
    <div
      className="statistics-report-page"
      data-provider={dashboard?.provider ?? 'mock'}
      data-state={dashboard?.state ?? query.state ?? 'success'}
    >
      <pre
        hidden
        data-testid="statistics-report-contract"
        data-provider={dashboard?.provider ?? 'mock'}
        data-endpoint={dashboard?.endpoint ?? '/report/accommodation/management/analysis/get'}
      >
        {contractText}
      </pre>

      <section className="statistics-report-panel">
        <div className="statistics-report-mode" role="group" aria-label="统计模式">
          <button
            type="button"
            className={mode === 'overview' ? 'is-active' : ''}
            onClick={() => {
              setMode('overview')
              setNotice('已切换到统计总览')
            }}
          >
            统计总览
          </button>
          <button
            type="button"
            className={mode === 'future' ? 'is-active' : ''}
            onClick={() => {
              setMode('future')
              setNotice('已切换到远期分析')
            }}
          >
            远期分析
          </button>
        </div>

        <div className="statistics-report-store">
          <button
            type="button"
            className={`store-scope${storeScope === 'all' ? ' is-active' : ''}`}
            aria-pressed={storeScope === 'all'}
            onClick={() => switchStoreScope('all')}
          >
            全部门店
          </button>
          <button
            type="button"
            className={`store-current${storeScope === 'current' ? ' is-active' : ''}`}
            aria-pressed={storeScope === 'current'}
            onClick={() => switchStoreScope('current')}
          >
            {dashboard?.currentStoreName ?? '天落会宿公寓(前海壹方城宝安中心店)'}
          </button>
          <button
            type="button"
            className="store-settings-button"
            aria-label="打开门店信息设置"
            onClick={() => navigate('/InformationMaintenance/campInfo')}
          >
            <span aria-hidden="true" />
          </button>
        </div>
        <div className="statistics-report-filters">
          <div className="statistics-report-presets" role="group" aria-label="日期快捷筛选">
            {statisticsReportPresetOptions.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={activePreset === preset.key ? 'is-active' : ''}
                onClick={() => switchPreset(preset.key, preset.label)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div
            ref={dateRangeRef}
            className="report-date-range"
            role="button"
            tabIndex={0}
            aria-label="统计日期"
            onClick={() => openDatePanel('start')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openDatePanel('start')
              }
            }}
          >
            <input
              aria-label="开始日期"
              value={query.startDate}
              readOnly
              onClick={(event) => {
                event.stopPropagation()
                openDatePanel('start')
              }}
            />
            <span>至</span>
            <input
              aria-label="结束日期"
              value={query.endDate}
              readOnly
              onClick={(event) => {
                event.stopPropagation()
                openDatePanel('end')
              }}
            />
            <i aria-hidden="true" />
          </div>

          <FilterSelect
            label="房型"
            value={roomTypeLabel}
            open={openFilter === 'roomType'}
            options={dashboard?.roomTypeOptions ?? []}
            onToggle={() => setOpenFilter(openFilter === 'roomType' ? null : 'roomType')}
            onSelect={(option) =>
              updateQuery(
                { roomCategoryIds: option ? [option.id] : [], channelIds: query.channelIds },
                '已按房型筛选',
              )
            }
          />
          <FilterSelect
            label="渠道"
            value={channelLabel}
            open={openFilter === 'channel'}
            options={dashboard?.channelOptions ?? []}
            onToggle={() => setOpenFilter(openFilter === 'channel' ? null : 'channel')}
            onSelect={(option) =>
              updateQuery({ channelIds: option ? [option.id] : [] }, '已按渠道筛选')
            }
          />
          <FilterSelect
            label="房型标签"
            value={roomTagLabel}
            open={openFilter === 'tag'}
            options={dashboard?.roomTagOptions ?? []}
            emptyLabel="暂无房型标签"
            onToggle={openTagSelect}
            onSelect={() => setOpenFilter(null)}
          />
        </div>

        {isDatePanelOpen ? (
          <DatePanel
            month={calendarMonth}
            startDate={query.startDate}
            endDate={query.endDate}
            pickTarget={datePickTarget}
            position={datePanelPosition}
            onClose={() => {
              setIsDatePanelOpen(false)
              setDatePickTarget('start')
            }}
            onPrevious={() => setCalendarMonth((current) => shiftMonth(current, -1))}
            onNext={() => setCalendarMonth((current) => shiftMonth(current, 1))}
            onPick={applyDateSelection}
          />
        ) : null}

        <div className="statistics-report-feedback sr-only-heading" role="status" aria-label="统计概览反馈">
          {loading ? '正在刷新统计概览数据' : notice}
        </div>

        {error ? (
          <section className="statistics-report-error" role="alert" aria-label="统计概览错误">
            <strong>统计概览加载失败</strong>
            <p>{error}</p>
            <button type="button" onClick={retryDashboard}>
              重试
            </button>
          </section>
        ) : null}

        {isEmpty ? (
          <section className="statistics-report-empty" aria-label="统计概览空状态">
            <strong>暂无统计数据</strong>
            <p>当前筛选条件下没有可展示的经营数据，请调整条件后重试。</p>
            <button type="button" onClick={retryDashboard}>
              刷新
            </button>
          </section>
        ) : null}

        {!error && !isEmpty ? (
          mode === 'overview' ? (
            <OverviewContent
              dashboard={dashboard}
              trendMetric={trendMetric}
              activeTrendKey={activeTrendKey}
              onSwitchTrend={(key, label) => {
                setActiveTrendKey(key)
                setNotice(`已切换趋势指标：${label}`)
              }}
            />
          ) : (
            <FutureContent dashboard={dashboard} />
          )
        ) : null}
      </section>
    </div>
  )
}

function OverviewContent({
  dashboard,
  trendMetric,
  activeTrendKey,
  onSwitchTrend,
}: {
  dashboard: StatisticsReportDashboard | null
  trendMetric: StatisticsReportDashboard['trendMetrics'][number] | null
  activeTrendKey: StatisticsReportTrendKey
  onSwitchTrend: (key: StatisticsReportTrendKey, label: string) => void
}) {
  const polylineValues = trendMetric?.series[0]?.values ?? []
  const yAxisValues = buildYAxis(polylineValues)
  const sourceItems = dashboard?.sourceItems ?? []

  return (
    <>
      <section className="statistics-section" aria-label="营收统计">
        <h2>营收统计</h2>
        <div className="statistics-revenue-grid">
          {(dashboard?.revenueCards ?? []).map((card) => (
            <article key={card.label} className="statistics-metric-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="statistics-section" aria-label="经营指标">
        <h2>经营指标</h2>
        <div className="statistics-operation-grid">
          {(dashboard?.metricCards ?? []).map((card) => (
            <article key={card.label} className="statistics-operation-card">
              <header>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </header>
              <div className="statistics-operation-details">
                {card.details.map((detail) => (
                  <div key={`${card.label}-${detail.label}`}>
                    <strong>{detail.value}</strong>
                    <span>{detail.label}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="statistics-chart-layout">
        <section className="statistics-chart-card" aria-label="增长趋势分析">
          <header>
            <h2>增长趋势分析</h2>
            <div className="statistics-chart-tabs" role="tablist" aria-label="增长趋势指标">
              {(dashboard?.trendMetrics ?? []).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={activeTrendKey === tab.key ? 'is-active' : ''}
                  onClick={() => onSwitchTrend(tab.key, tab.label)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>
          <div className="statistics-line-chart" aria-label={`${trendMetric?.label ?? '营业收入'}趋势图`}>
            <div className="statistics-y-axis">
              {yAxisValues.map((value) => (
                <span key={value}>{formatAxisValue(value, trendMetric?.valueFormat ?? 'currency')}</span>
              ))}
            </div>
            <div className="statistics-plot">
              <div className="plot-grid" />
              <svg viewBox="0 0 520 220" role="img" aria-label={`${trendMetric?.label ?? '营业收入'} 趋势`}>
                {(trendMetric?.series ?? []).map((series) => (
                  <polyline
                    key={series.key}
                    points={buildPolylinePoints(series.values)}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={series.key === trendMetric?.series[0]?.key ? '3' : '2'}
                    strokeLinecap="round"
                  />
                ))}
              </svg>
              <div className="statistics-x-axis">
                {(trendMetric?.xLabels ?? []).map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
            <div className="statistics-legend">
              {(trendMetric?.series ?? []).map((series) => (
                <span key={series.key}>
                  <i className="legend-dot" style={{ background: series.color }} />
                  {series.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="statistics-source-card" aria-label="订单来源分析">
          <h2>订单来源分析</h2>
          <div className="statistics-donut-wrap">
            <div className="statistics-donut" aria-hidden="true" style={{ background: donutBackground(sourceItems) }} />
            <ul>
              {sourceItems.length > 0 ? (
                sourceItems.map((source) => (
                  <li key={source.id}>
                    <i style={{ background: source.color }} />
                    <span>{source.label}</span>
                    <small>{source.countText}</small>
                    <strong>{source.percentageText}</strong>
                  </li>
                ))
              ) : (
                <li className="statistics-source-empty">暂无订单来源数据</li>
              )}
            </ul>
          </div>
        </section>
      </section>
    </>
  )
}

function FutureContent({ dashboard }: { dashboard: StatisticsReportDashboard | null }) {
  if (!dashboard?.hasFutureData) {
    return (
      <section className="statistics-future statistics-future--empty" aria-label="远期趋势分析">
        <header>
          <h2>远期趋势分析</h2>
          <span>本月预测</span>
        </header>
        <div className="statistics-future-empty">
          <strong>暂无预测数据</strong>
          <p>当前所选日期范围没有目标站返回的预测字段，请切换到本月查看远期分析。</p>
        </div>
      </section>
    )
  }

  return (
    <section className="statistics-future" aria-label="远期趋势分析">
      <header>
        <h2>远期趋势分析</h2>
        <span>本月预测</span>
      </header>
      <div className="statistics-future-grid">
        {dashboard.futureCards.map((card) => (
          <article key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>
      <div className="statistics-future-chart">
        <span>月初</span>
        <span>经营中</span>
        <span>预计补量</span>
        <span>预计总额</span>
        <span>月底</span>
      </div>
    </section>
  )
}

function FilterSelect({
  label,
  value,
  open,
  options,
  emptyLabel = '暂无可选项',
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  open: boolean
  options: StatisticsReportOption[]
  emptyLabel?: string
  onToggle: () => void
  onSelect: (option: StatisticsReportOption | null) => void
}) {
  return (
    <div className="report-filter-select">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label} ${value}`} onClick={onToggle}>
        <span>{label}</span>
        <strong>{value}</strong>
      </button>
      {open ? (
        <div className="report-filter-options" role="listbox" aria-label={`${label}选项`}>
          {options.length > 0 ? (
            <>
              <button type="button" role="option" aria-selected={value.includes('全部')} onClick={() => onSelect(null)}>
                {label === '房型' ? '全部房型' : label === '渠道' ? '全部渠道' : '全部房型标签'}
              </button>
              {options.map((option) => (
                <button key={option.id} type="button" role="option" aria-selected={value === option.label} onClick={() => onSelect(option)}>
                  {option.label}
                </button>
              ))}
            </>
          ) : (
            <button type="button" role="option" aria-selected="true" disabled>
              {emptyLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
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
    <div className="report-date-panel-wrap" role="presentation" onMouseDown={onClose}>
      <section className="report-date-panel" role="dialog" aria-label="统计日期面板" style={{ top: `${position.top}px`, left: `${position.left}px` }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="report-date-panel__header">
          <strong>{pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期'}</strong>
          <button type="button" aria-label="关闭统计日期面板" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="report-date-panel__months">
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
  const monthLabel = formatMonthLabel(month)

  return (
    <section className="report-calendar-month" aria-label={monthLabel}>
      <header>
        <button type="button" aria-label="上个月" onClick={onPrevious} disabled={!onPrevious}>
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="下个月" onClick={onNext} disabled={!onNext}>
          ›
        </button>
      </header>
      <div className="report-calendar-month__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="report-calendar-month__days">
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

function createInitialQuery() {
  const query = createDefaultStatisticsReportQuery()
  query.state =
    typeof window === 'undefined'
      ? 'success'
      : window.localStorage.getItem('pms.statisticsReport.scenario') === 'empty'
        ? 'empty'
        : window.localStorage.getItem('pms.statisticsReport.scenario') === 'error'
          ? 'error'
          : 'success'
  return query
}

function selectedLabel(options: StatisticsReportOption[], id: string | undefined, fallback: string) {
  if (!id) return fallback
  return options.find((item) => item.id === id)?.label ?? fallback
}

function findMatchingPreset(startDate: string, endDate: string) {
  for (const preset of statisticsReportPresetOptions) {
    const presetQuery = buildStatisticsReportQueryForPreset(preset.key)
    if (presetQuery.startDate === startDate && presetQuery.endDate === endDate) {
      return preset.key
    }
  }
  return null
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

function buildYAxis(values: number[]) {
  const max = Math.max(...values, 0)
  if (max <= 0) return [0, 0, 0, 0, 0]
  const step = max / 4
  return [step * 4, step * 3, step * 2, step, 0].map((value) => Number(value.toFixed(2)))
}

function formatAxisValue(value: number, format: 'currency' | 'percent' | 'count') {
  if (format === 'percent') return `${value.toFixed(0)}%`
  if (format === 'count') return `${Math.round(value)}`
  return `${Math.round(value)}`
}

function buildPolylinePoints(values: number[]) {
  if (values.length === 0) return '18,178'
  const max = Math.max(...values, 1)
  const width = 444
  const xStart = 18
  const xStep = values.length === 1 ? 0 : width / (values.length - 1)
  return values
    .map((value, index) => {
      const x = xStart + xStep * index
      const y = 190 - (value / max) * 156
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

function donutBackground(items: StatisticsReportDashboard['sourceItems']) {
  if (items.length === 0) {
    return 'radial-gradient(circle at center, #fff 0 44%, transparent 45%), conic-gradient(#f0f0f0 0 100%)'
  }
  let offset = 0
  const segments = items.map((item) => {
    const value = Number(item.percentageText.replace('%', ''))
    const start = offset
    offset += value
    return `${item.color} ${start}% ${offset}%`
  })
  return `radial-gradient(circle at center, #fff 0 44%, transparent 45%), conic-gradient(${segments.join(', ')})`
}
