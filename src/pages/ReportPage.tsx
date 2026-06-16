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
  type StatisticsReportSourceItem,
  type StatisticsReportTrendMetric,
  type StatisticsReportTrendKey,
  type StatisticsReportTrendSeries,
} from '../services/statisticsReport'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './ReportPage.css'

type ReportMode = 'overview' | 'future'
type FilterKey = 'roomType' | 'channel' | 'tag' | null
type DatePickTarget = 'start' | 'end'
type DatePanelPosition = { top: number; left: number }
type StatisticsRenderedTrendPoint = {
  x: number
  y: number
  value: number
  label: string
}

type StatisticsRenderedTrendSeries = StatisticsReportTrendSeries & {
  path: string
  points: StatisticsRenderedTrendPoint[]
}

const statisticsTrendViewBox = {
  width: 520,
  height: 220,
  left: 18,
  right: 462,
  top: 0,
  bottom: 220,
}

const statisticsTrendPlotHeight = 220

export function ReportPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState(createInitialQuery)
  const [expanded, setExpanded] = useState(true)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [dashboard, setDashboard] = useState<StatisticsReportDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('统计概览看板已加载')
  const [mode, setMode] = useState<ReportMode>('overview')
  const [openFilter, setOpenFilter] = useState<FilterKey>(null)
  const [activeTrendKey, setActiveTrendKey] = useState<StatisticsReportTrendKey>('businessIncome')
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false)
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
  const { storeOptions, storeLoading } = useStoreOptions({ fallbackOptions: dashboard?.storeOptions })
  const selectedStoreId = query.poiIds[0] ?? 'all'
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
        poiIds: current.poiIds,
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

  function resetFilters() {
    setLoading(true)
    setError('')
    setOpenFilter(null)
    setIsDatePanelOpen(false)
    setQuery(createInitialQuery())
    setMode('overview')
    setActiveTrendKey('businessIncome')
    setNotice('已恢复默认筛选')
  }

  function refreshDashboard() {
    setLoading(true)
    setError('')
    setOpenFilter(null)
    setIsDatePanelOpen(false)
    setQuery((current) => ({ ...current }))
    setNotice('统计概览看板已刷新')
  }

  function exportDashboard() {
    setNotice('统计概览导出任务已创建')
  }

  function switchStore(storeId: string) {
    setLoading(true)
    setError('')
    setOpenFilter(null)
    setIsDatePanelOpen(false)
    setQuery((current) => ({
      ...current,
      poiIds: storeId === 'all' ? [] : [storeId],
    }))
    const store = storeOptions.find((item) => item.id === storeId)
    setNotice(storeId === 'all' ? '已切换到全部门店视角' : `已切换到${store?.label ?? '所选门店'}视角`)
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
        <section className="statistics-report-query" aria-label="统计概览筛选">
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

          <div className="statistics-report-form">
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

            <StoreSelectControl
              className="statistics-report-store"
              label="门店范围"
              options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
              value={selectedStoreId}
              disabled={storeLoading}
              onChange={(storeId) => switchStore(storeId)}
              settingsLabel="打开门店信息设置"
              onSettingsClick={() => navigate('/InformationMaintenance/campInfo')}
            />

            {expanded ? (
              <div className="statistics-report-filters">
                <label className="statistics-date-field">
                  <span>开始日期</span>
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
                </label>

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
            ) : null}
          </div>

          <div className="statistics-report-actions">
            <button type="button" onClick={resetFilters} disabled={loading}>
              重置
            </button>
            <button type="button" className="is-primary" onClick={refreshDashboard} disabled={loading}>
              查询
            </button>
            <button type="button" onClick={exportDashboard} disabled={loading || Boolean(error)}>
              导出
            </button>
            <button
              type="button"
              onClick={() => {
                setDescriptionOpen(true)
                setOpenFilter(null)
              }}
            >
              说明
            </button>
            <button type="button" className="is-link" onClick={() => setExpanded((current) => !current)}>
              {expanded ? '收起' : '展开'}
            </button>
          </div>
        </section>

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

        {descriptionOpen ? (
          <div className="statistics-modal-backdrop" role="presentation" onClick={() => setDescriptionOpen(false)}>
            <section
              className="statistics-dialog"
              role="dialog"
              aria-modal="true"
              aria-label="统计概览字段说明"
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <h2>统计概览字段说明</h2>
                <button type="button" aria-label="关闭统计概览字段说明" onClick={() => setDescriptionOpen(false)}>
                  ×
                </button>
              </header>
              <div className="statistics-description-list">
                <div className="statistics-description-row">
                  <strong>总营业收入</strong>
                  <span>当前筛选日期内房费、其他消费、记一笔收入的汇总。</span>
                </div>
                <div className="statistics-description-row">
                  <strong>入住率 OCC</strong>
                  <span>已售房间数占总房间数的比例，用于观察出租效率。</span>
                </div>
                <div className="statistics-description-row">
                  <strong>平均房费 ADR</strong>
                  <span>已售房间对应的平均房费，反映客房售价水平。</span>
                </div>
                <div className="statistics-description-row">
                  <strong>RevPAR</strong>
                  <span>平均可售客房收入，综合反映房量和房价表现。</span>
                </div>
              </div>
            </section>
          </div>
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
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null)
  const [hoveredSourceIndex, setHoveredSourceIndex] = useState<number | null>(null)
  const trendChart = useMemo(() => buildStatisticsTrendChart(trendMetric), [trendMetric])
  const hoveredTrendPoint = hoveredTrendIndex === null ? null : trendChart.primarySeries?.points[hoveredTrendIndex] ?? null
  const sourceItems = dashboard?.sourceItems ?? []
  const hoveredSourceItem = hoveredSourceIndex === null ? null : sourceItems[hoveredSourceIndex] ?? null

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
                  onClick={() => {
                    setHoveredTrendIndex(null)
                    onSwitchTrend(tab.key, tab.label)
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </header>
          <div className="statistics-line-chart" aria-label={`${trendMetric?.label ?? '营业收入'}趋势图`}>
            <div className="statistics-y-axis">
              {trendChart.axisValues.map((value, index) => (
                <span
                  key={`${value}-${index}`}
                  style={{
                    top: `${trendChart.axisValues.length <= 1 ? 0 : (100 / (trendChart.axisValues.length - 1)) * index}%`,
                  }}
                >
                  {formatAxisValue(value, trendMetric?.valueFormat ?? 'currency')}
                </span>
              ))}
            </div>
            <div className="statistics-plot" data-testid="statistics-trend-chart" onMouseLeave={() => setHoveredTrendIndex(null)}>
              <div className="plot-grid" />
              <svg viewBox={`0 0 ${statisticsTrendViewBox.width} ${statisticsTrendViewBox.height}`} preserveAspectRatio="none" role="img" aria-label={`${trendMetric?.label ?? '营业收入'} 趋势`}>
                {trendChart.series.map((series) => (
                  <path
                    key={series.key}
                    className="statistics-trend-line"
                    d={series.path}
                    stroke={series.color}
                    data-testid={series.key === trendChart.primarySeries?.key ? 'statistics-trend-line' : undefined}
                    style={{ strokeWidth: series.key === trendChart.primarySeries?.key ? 3 : 2 }}
                  />
                ))}
                {trendChart.primarySeries?.points.map((point, index) => (
                  <g key={`${point.label}-${index}`}>
                    <circle className="statistics-trend-point-dot" cx={point.x} cy={point.y} r="5.2" />
                    <circle
                      className="statistics-trend-point-hit"
                      data-testid="statistics-trend-point"
                      cx={point.x}
                      cy={point.y}
                      r="13"
                      tabIndex={0}
                      onMouseEnter={() => setHoveredTrendIndex(index)}
                      onFocus={() => setHoveredTrendIndex(index)}
                    />
                  </g>
                ))}
              </svg>
              {hoveredTrendPoint ? (
                <div
                  className="statistics-chart-tooltip"
                  data-testid="statistics-trend-tooltip"
                  style={{
                    left: `${(hoveredTrendPoint.x / statisticsTrendViewBox.width) * 100}%`,
                    top: `${(hoveredTrendPoint.y / statisticsTrendViewBox.height) * statisticsTrendPlotHeight}px`,
                  }}
                >
                  <strong>{hoveredTrendPoint.label}</strong>
                  <span>{trendChart.primarySeries?.label ?? trendMetric?.label}</span>
                  <em>{formatTrendTooltipValue(hoveredTrendPoint.value, trendMetric?.valueFormat ?? 'currency')}</em>
                </div>
              ) : null}
              <div className="statistics-x-axis">
                {(trendMetric?.xLabels ?? []).map((label, index) => {
                  const point = trendChart.primarySeries?.points[index]
                  return (
                    <span
                      key={label}
                      style={{
                        left: point ? `${(point.x / statisticsTrendViewBox.width) * 100}%` : `${(100 / Math.max((trendMetric?.xLabels.length ?? 1) - 1, 1)) * index}%`,
                      }}
                    >
                      {label}
                    </span>
                  )
                })}
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
            <div
              className="statistics-donut"
              data-testid="statistics-donut-ring"
              aria-hidden="true"
              style={{ background: donutBackground(sourceItems) }}
              onMouseMove={(event) => setHoveredSourceIndex(resolveStatisticsSourceIndex(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY, sourceItems))}
              onMouseLeave={() => setHoveredSourceIndex(null)}
            />
            {hoveredSourceItem ? (
              <div className="statistics-donut-tooltip" data-testid="statistics-donut-tooltip">
                <strong>{hoveredSourceItem.label}</strong>
                <span>{hoveredSourceItem.countText}</span>
                <em>{hoveredSourceItem.percentageText}</em>
              </div>
            ) : null}
            <ul data-testid="statistics-donut-legend" onMouseLeave={() => setHoveredSourceIndex(null)}>
              {sourceItems.length > 0 ? (
                sourceItems.map((source, index) => (
                  <li
                    key={source.id}
                    className={hoveredSourceIndex === index ? 'is-active' : ''}
                    tabIndex={0}
                    onMouseEnter={() => setHoveredSourceIndex(index)}
                    onFocus={() => setHoveredSourceIndex(index)}
                  >
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
    <label className="statistics-select-field">
      <span>{label}</span>
      <div className="report-filter-select">
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label} ${value}`} onClick={onToggle}>
          <strong>{value}</strong>
        </button>
      </div>
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
    </label>
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

function formatAxisValue(value: number, format: 'currency' | 'percent' | 'count') {
  if (format === 'percent') return `${value.toFixed(0)}%`
  if (format === 'count') return `${Math.round(value)}`
  return `${Math.round(value)}`
}

function buildStatisticsTrendChart(metric: StatisticsReportTrendMetric | null) {
  const seriesValues = metric?.series.flatMap((series) => series.values.map(toFiniteNumber)) ?? []
  const ceiling = getStatisticsAxisCeiling(Math.max(...seriesValues, 0), metric?.valueFormat ?? 'currency')
  const plotCeiling = ceiling > 0 ? ceiling : 1
  const axisValues = [ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0].map((value) => Number(value.toFixed(2)))
  const series: StatisticsRenderedTrendSeries[] = (metric?.series ?? []).map((item) => {
    const points = item.values.map((rawValue, index) => {
      const value = toFiniteNumber(rawValue)
      const x = item.values.length <= 1
        ? (statisticsTrendViewBox.left + statisticsTrendViewBox.right) / 2
        : statisticsTrendViewBox.left + ((statisticsTrendViewBox.right - statisticsTrendViewBox.left) / (item.values.length - 1)) * index
      const y = statisticsTrendViewBox.bottom - (value / plotCeiling) * (statisticsTrendViewBox.bottom - statisticsTrendViewBox.top)
      return {
        x,
        y,
        value,
        label: metric?.xLabels[index] ?? '--',
      }
    })

    return {
      ...item,
      points,
      path: buildStatisticsTrendPath(points),
    }
  })

  return {
    axisValues,
    series,
    primarySeries: series[0] ?? null,
  }
}

function buildStatisticsTrendPath(points: StatisticsRenderedTrendPoint[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const midX = (previous.x + point.x) / 2
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

function getStatisticsAxisCeiling(maxValue: number, format: 'currency' | 'percent' | 'count') {
  if (maxValue <= 0) return 0
  if (format === 'percent') return Math.max(100, Math.ceil(maxValue / 25) * 25)
  if (format === 'count') return Math.max(4, Math.ceil(maxValue))

  const magnitude = 10 ** Math.floor(Math.log10(maxValue))
  const normalized = maxValue / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 3 ? 3 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function formatTrendTooltipValue(value: number, format: 'currency' | 'percent' | 'count') {
  if (format === 'percent') return `${formatPlainNumber(value)}%`
  if (format === 'count') return `${formatPlainNumber(value, 0)}间`
  return `￥${formatPlainNumber(value)}`
}

function donutBackground(items: StatisticsReportDashboard['sourceItems']) {
  if (items.length === 0) {
    return 'radial-gradient(circle at center, #fff 0 44%, transparent 45%), conic-gradient(#f0f0f0 0 100%)'
  }
  let offset = 0
  const segments = items.map((item) => {
    const value = parseSourcePercent(item)
    const start = offset
    offset += value
    return `${item.color} ${start}% ${offset}%`
  })
  return `radial-gradient(circle at center, #fff 0 44%, transparent 45%), conic-gradient(${segments.join(', ')})`
}

function resolveStatisticsSourceIndex(rect: DOMRect, clientX: number, clientY: number, items: StatisticsReportSourceItem[]) {
  if (items.length === 0) return null

  const x = clientX - rect.left - rect.width / 2
  const y = clientY - rect.top - rect.height / 2
  const distance = Math.sqrt(x * x + y * y)
  if (distance < rect.width * 0.22 || distance > rect.width * 0.52) return null

  const angle = (Math.atan2(y, x) * 180) / Math.PI
  const percentAtPointer = ((angle + 450) % 360) / 3.6
  let cursor = 0

  for (let index = 0; index < items.length; index += 1) {
    cursor += parseSourcePercent(items[index])
    if (percentAtPointer <= cursor) return index
  }

  return null
}

function parseSourcePercent(item: StatisticsReportSourceItem) {
  const value = Number(item.percentageText.replace('%', ''))
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 100)
}

function formatPlainNumber(value: number, fractionDigits = 2) {
  if (Number.isInteger(value) || fractionDigits === 0) return value.toFixed(0)
  return value.toFixed(fractionDigits).replace(/\.?0+$/, '')
}

function toFiniteNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}
