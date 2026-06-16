import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createWorkspaceMemo,
  fetchWorkspaceDashboard,
  fetchWorkspaceLists,
  fetchWorkspaceMemos,
  fetchWorkspaceAnalysis,
  handleWorkspaceMemo,
  resolveWorkspaceCampId,
  type WorkspaceChartRange,
  type WorkspaceDashboard,
  type WorkspaceOrder,
  type WorkspaceOrderTab,
  type WorkspacePeriod,
} from '../services/workspace'
import type { DonutSlice, WorkspaceTrendPoint } from '../types'
import './WorkspacePage.css'

const emptyDashboard: WorkspaceDashboard = {
  summary: {
    metrics: [
      { label: '预抵', value: '--', testId: 'workspace-metric-arrivals' },
      { label: '在住', value: '--', testId: 'workspace-metric-staying', route: '/statistics/roomSituation' },
      { label: '预离', value: '--' },
      { label: '可售', value: '--' },
      { label: '维修房', value: '--' },
      { label: '脏房', value: '--' },
      { label: '异常', value: '--', accent: 'rose' },
      { label: '总营业收入', value: '--', testId: 'workspace-metric-revenue', accent: 'orange' },
    ],
  },
  analysis: {
    revenueMetrics: [
      { label: '营业收入', value: '--', detailLeft: '预计总收入 --', detailRight: '记一笔 --　其他收入/支出 --', accent: 'amber' },
      { label: '入住率OCC', value: '--', detailLeft: '已售房间数 --', detailRight: '总房数 --', accent: 'mint' },
      { label: '平均客房收益RevPAR', value: '--', detailLeft: '全日房 --', detailRight: '钟点房 --', accent: 'peach' },
      { label: '平均房费ADR', value: '--', detailLeft: '入住率OCC --', detailRight: '平均房费ADR --', accent: 'sky' },
    ],
    chartDates: [],
    chartSeries: [],
    donutSlices: [],
  },
  lists: {
    orders: [],
    memoCount: 0,
    memoItems: [],
    todoItems: [],
    productItems: [],
  },
  traffic: {
    level: '--',
    suggestions: [],
    connectedChannels: [],
    pendingChannels: [],
  },
}

const metricGroups = {
  availability: [0, 1, 2, 3],
  housekeeping: [4, 5],
  exception: [6],
  revenue: [7],
}

type TrendMetricKey = 'businessIncome' | 'occ' | 'adr' | 'revPar' | 'openRoomCount'

type TrendMetricConfig = {
  label: string
  key: TrendMetricKey
  valueType: 'currency' | 'percent' | 'roomCount'
}

const chartMetricConfigs: TrendMetricConfig[] = [
  { label: '营业收入', key: 'businessIncome', valueType: 'currency' },
  { label: '入住率OCC', key: 'occ', valueType: 'percent' },
  { label: '平均房费ADR', key: 'adr', valueType: 'currency' },
  { label: '平均客房收益RevPAR', key: 'revPar', valueType: 'currency' },
  { label: '已售房间数', key: 'openRoomCount', valueType: 'roomCount' },
]

type RenderedTrendPoint = WorkspaceTrendPoint & {
  x: number
  y: number
  value: number
}

const trendChartBounds = {
  left: 2,
  right: 98,
  top: 1.19,
  bottom: 58.33,
}

const trendChartLayout = {
  axisWidth: 44,
  svgTop: 6,
  svgHeight: 168,
}

export function WorkspacePage() {
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<WorkspaceDashboard>(emptyDashboard)
  const [revenuePeriod, setRevenuePeriod] = useState<WorkspacePeriod>('yesterday')
  const [chartRange, setChartRange] = useState<WorkspaceChartRange>('week')
  const [activeChartMetric, setActiveChartMetric] = useState('营业收入')
  const [orderTab, setOrderTab] = useState<WorkspaceOrderTab>('arrivals')
  const [orderKeyword, setOrderKeyword] = useState('')
  const [todoTab, setTodoTab] = useState<'todo' | 'product'>('todo')
  const [memoTab, setMemoTab] = useState<'todo' | 'done'>('todo')
  const [memoText, setMemoText] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<WorkspaceOrder | null>(null)
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null)
  const [hoveredDonutIndex, setHoveredDonutIndex] = useState<number | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const campId = useMemo(() => {
    try {
      return resolveWorkspaceCampId()
    } catch (error) {
      return error instanceof Error ? error.message : ''
    }
  }, [])
  const hasCampContext = !campId.startsWith('缺少 campId')

  useEffect(() => {
    void loadDashboard()
    // Initial load is intentionally tied to the first visible state only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDashboard() {
    if (!hasCampContext) {
      setErrorMessage('')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    try {
      const nextDashboard = await fetchWorkspaceDashboard(campId, revenuePeriod, chartRange, orderTab, orderKeyword)
      setDashboard(nextDashboard)
      setStatusMessage('首页数据已刷新')
    } catch (error) {
      setErrorMessage(formatBusinessError('首页数据加载失败', error))
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshRevenue(nextPeriod: WorkspacePeriod) {
    setRevenuePeriod(nextPeriod)
    if (!hasCampContext) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      const analysis = await fetchWorkspaceAnalysis(campId, nextPeriod)
      setDashboard((current) => ({ ...current, analysis: { ...current.analysis, revenueMetrics: analysis.revenueMetrics } }))
      setStatusMessage(`${nextPeriod === 'month' ? '本月' : '昨日'}营收已刷新`)
    } catch (error) {
      setErrorMessage(formatBusinessError('营收数据加载失败', error))
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshChart(nextRange: WorkspaceChartRange) {
    setChartRange(nextRange)
    if (!hasCampContext) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      const analysis = await fetchWorkspaceAnalysis(campId, nextRange)
      setDashboard((current) => ({
        ...current,
        analysis: { ...current.analysis, chartDates: analysis.chartDates, chartSeries: analysis.chartSeries, donutSlices: analysis.donutSlices },
      }))
      setHoveredTrendIndex(null)
      setHoveredDonutIndex(null)
      setStatusMessage(`${nextRange === 'lastWeek' ? '上周' : '本周'}趋势已刷新`)
    } catch (error) {
      setErrorMessage(formatBusinessError('趋势数据加载失败', error))
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshOrders(nextTab = orderTab, keyword = orderKeyword) {
    setOrderTab(nextTab)
    if (!hasCampContext) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      const lists = await fetchWorkspaceLists(campId, nextTab, keyword, memoTab === 'done' ? 1 : 0)
      setDashboard((current) => ({ ...current, lists }))
      setStatusMessage('订单列表已刷新')
    } catch (error) {
      setErrorMessage(formatBusinessError('订单列表加载失败', error))
    } finally {
      setIsLoading(false)
    }
  }

  function showStatus(message: string) {
    setStatusMessage(message)
  }

  async function refreshMemos(nextTab = memoTab) {
    setMemoTab(nextTab)
    if (!hasCampContext) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      const memoState = await fetchWorkspaceMemos(campId, nextTab === 'done' ? 1 : 0)
      setDashboard((current) => ({ ...current, lists: { ...current.lists, ...memoState } }))
      setStatusMessage('备忘录已刷新')
    } catch (error) {
      setErrorMessage(formatBusinessError('备忘录加载失败', error))
    } finally {
      setIsLoading(false)
    }
  }

  async function submitMemo() {
    if (!memoText.trim()) {
      showStatus('请输入新的备忘录')
      return
    }

    if (!hasCampContext) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      await createWorkspaceMemo(campId, memoText.trim())
      setMemoText('')
      await refreshMemos('todo')
      setStatusMessage('备忘录已提交')
    } catch (error) {
      setErrorMessage(formatBusinessError('备忘录提交失败', error))
    } finally {
      setIsLoading(false)
    }
  }

  async function markMemoHandled(memoId: string) {
    if (!hasCampContext) return

    setIsLoading(true)
    setErrorMessage('')
    try {
      await handleWorkspaceMemo(campId, memoId, 1)
      await refreshMemos(memoTab)
      setStatusMessage('备忘录已处理')
    } catch (error) {
      setErrorMessage(formatBusinessError('备忘录处理失败', error))
    } finally {
      setIsLoading(false)
    }
  }

  const metrics = dashboard.summary.metrics
  const revenueMetrics = dashboard.analysis.revenueMetrics
  const activeChartConfig = chartMetricConfigs.find((item) => item.label === activeChartMetric) ?? chartMetricConfigs[0]
  const trendChart = useMemo(() => buildTrendChart(dashboard.analysis.chartSeries, activeChartConfig), [dashboard.analysis.chartSeries, activeChartConfig])
  const chartDates = trendChart.points.length > 0
    ? trendChart.points.map((point) => point.label)
    : dashboard.analysis.chartDates.length > 0
      ? dashboard.analysis.chartDates
      : ['--', '--', '--', '--', '--', '--', '--']
  const donutSlices = dashboard.analysis.donutSlices
  const donutBackground = useMemo(() => buildDonutBackground(donutSlices), [donutSlices])
  const hoveredTrendPoint = hoveredTrendIndex === null ? null : trendChart.points[hoveredTrendIndex] ?? null
  const hoveredDonutSlice = hoveredDonutIndex === null ? null : donutSlices[hoveredDonutIndex] ?? null
  const visibleTodoItems = todoTab === 'todo' ? dashboard.lists.todoItems : dashboard.lists.productItems

  return (
    <div className="workspace-grid workspace-home" aria-busy={isLoading}>
      {errorMessage ? (
        <div className="workspace-feedback workspace-feedback--error" role="alert">
          <span>{errorMessage}</span>
          <button type="button" onClick={loadDashboard}>重试</button>
        </div>
      ) : null}
      {statusMessage ? <div className="workspace-feedback workspace-feedback--status" role="status">{statusMessage}</div> : null}

      <section className="workspace-top-strip" aria-label="首页核心概览">
        <MetricGroup className="metrics-strip workspace-stat-group--availability" label="房态概览" indexes={metricGroups.availability} metrics={metrics} onNavigate={navigate} />
        <MetricGroup className="workspace-stat-group--housekeeping" label="房务概览" indexes={metricGroups.housekeeping} metrics={metrics} onNavigate={navigate} />
        <MetricGroup className="workspace-stat-group--exception" label="异常概览" indexes={metricGroups.exception} metrics={metrics} onNavigate={navigate} />
        <MetricGroup className="workspace-stat-group--revenue" label="营收概览" indexes={metricGroups.revenue} metrics={metrics} onNavigate={navigate} />

        <button type="button" className="workspace-quick-card workspace-quick-card--shift" onClick={() => navigate('/statistics/shift/record')}>
          <span>班</span>
          <strong>交接班</strong>
        </button>
        <article className="workspace-quick-card workspace-quick-card--night">
          <span>夜</span>
          <div>
            <strong>夜审</strong>
            <button type="button" onClick={() => showStatus('夜审检查已发起，请稍后查看结果')}>立即开启夜审</button>
          </div>
        </article>
        <section className="workspace-quick-strip" aria-label="首页快捷入口">
          <Link className="workspace-quick-card workspace-quick-card--report" to="/statistics/roomSituation">
            <span>房</span>
            <strong>房情表</strong>
          </Link>
          <Link className="workspace-quick-card workspace-quick-card--report" to="/statistics/stay">
            <span>收</span>
            <strong>收入报表</strong>
          </Link>
          <Link className="workspace-quick-card workspace-quick-card--report" to="/statistics/profitReport">
            <span>利</span>
            <strong>利润报表</strong>
          </Link>
        </section>
      </section>

      <section className="workspace-panel workspace-revenue">
        <div className="panel-toolbar">
          <div className="segmented">
            <button type="button" className={revenuePeriod === 'yesterday' ? 'is-active' : ''} onClick={() => void refreshRevenue('yesterday')} disabled={isLoading}>
              昨日
            </button>
            <button type="button" className={revenuePeriod === 'month' ? 'is-active' : ''} onClick={() => void refreshRevenue('month')} disabled={isLoading}>
              本月
            </button>
          </div>
          <Link to="/statistics/report">查看详情</Link>
        </div>
        <div className="revenue-cards">
          {revenueMetrics.map((metric) => (
            <article
              key={metric.label}
              className={`revenue-card revenue-${metric.accent}`}
              data-testid={metric.label === '营业收入' ? 'workspace-revenue-card' : metric.label === '入住率OCC' ? 'workspace-occ-card' : undefined}
            >
              <header>{metric.label}</header>
              <strong>{metric.value}</strong>
              <footer>
                <span>{metric.detailLeft}</span>
                <span>{metric.detailRight}</span>
              </footer>
            </article>
          ))}
        </div>
      </section>

      <section className="workspace-panel chart-panel">
        <div className="panel-toolbar">
          <div className="segmented">
            <button type="button" className={chartRange === 'week' ? 'is-active' : ''} onClick={() => void refreshChart('week')} disabled={isLoading}>
              本周
            </button>
            <button type="button" className={chartRange === 'lastWeek' ? 'is-active' : ''} onClick={() => void refreshChart('lastWeek')} disabled={isLoading}>
              上周
            </button>
          </div>
          <Link to="/statistics/report">查看详情</Link>
        </div>
        <div className="chart-tabs">
          {chartMetricConfigs.map((metric) => (
            <button
              key={metric.label}
              type="button"
              className={activeChartMetric === metric.label ? 'is-active' : ''}
              onClick={() => {
                setActiveChartMetric(metric.label)
                setHoveredTrendIndex(null)
              }}
            >
              {metric.label}
            </button>
          ))}
        </div>
        <div className="chart-stage">
          <div className="chart-grid" onMouseLeave={() => setHoveredTrendIndex(null)}>
            {trendChart.axisLabels.map((value) => (
              <div key={value} className="chart-grid__row">
                <span>{value}</span>
                <div />
              </div>
            ))}
            {trendChart.points.length > 0 ? (
              <svg className="workspace-trend-svg" data-testid="workspace-trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`${activeChartConfig.label}趋势`}>
                <path className="workspace-trend-line" data-testid="workspace-trend-line" d={trendChart.path} />
                {trendChart.points.map((point, index) => (
                  <g key={`${point.date}-${index}`}>
                    <circle className="workspace-trend-point-dot" cx={point.x} cy={point.y} r="2.25" />
                    <circle
                      className="workspace-trend-point-hit"
                      data-testid="workspace-trend-point"
                      cx={point.x}
                      cy={point.y}
                      r="7.5"
                      onMouseEnter={() => setHoveredTrendIndex(index)}
                      onFocus={() => setHoveredTrendIndex(index)}
                      tabIndex={0}
                    />
                  </g>
                ))}
              </svg>
            ) : null}
            {hoveredTrendPoint ? (
              <div
                className="workspace-chart-tooltip"
                data-testid="workspace-chart-tooltip"
                style={{
                  left: `calc(${trendChartLayout.axisWidth}px + ${hoveredTrendPoint.x}% - ${(hoveredTrendPoint.x * trendChartLayout.axisWidth) / 100}px)`,
                  top: `${trendChartLayout.svgTop + (hoveredTrendPoint.y / 100) * trendChartLayout.svgHeight}px`,
                }}
              >
                <strong>{hoveredTrendPoint.label}</strong>
                <span>{activeChartConfig.label}</span>
                <em>{formatTrendValue(hoveredTrendPoint.value, activeChartConfig.valueType)}</em>
              </div>
            ) : null}
            <div className="chart-grid__dates" data-testid="workspace-chart-dates">
              {chartDates.map((date, index) => {
                const x = trendChart.points[index]?.x ?? (chartDates.length <= 1 ? 50 : (100 / (chartDates.length - 1)) * index)
                return (
                  <span
                    key={`${date}-${index}`}
                    style={{
                      left: `calc(${trendChartLayout.axisWidth}px + ${x}% - ${(x * trendChartLayout.axisWidth) / 100}px)`,
                    }}
                  >
                    {date}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="donut">
            <div
              className="donut-ring"
              data-testid="workspace-donut-ring"
              style={{ background: donutBackground }}
              onMouseMove={(event) => setHoveredDonutIndex(resolveDonutSliceIndex(event.currentTarget.getBoundingClientRect(), event.clientX, event.clientY, donutSlices))}
              onMouseLeave={() => setHoveredDonutIndex(null)}
            />
            {hoveredDonutSlice ? (
              <div className="workspace-donut-tooltip" data-testid="workspace-donut-tooltip">
                <strong>{hoveredDonutSlice.label}</strong>
                <span>{formatDonutCount(hoveredDonutSlice)}</span>
                <em>{formatDonutPercent(hoveredDonutSlice)}</em>
              </div>
            ) : null}
            <ul data-testid="workspace-donut-legend" onMouseLeave={() => setHoveredDonutIndex(null)}>
              {donutSlices.length > 0 ? (
                donutSlices.map((slice, index) => (
                  <li
                    key={slice.label}
                    className={hoveredDonutIndex === index ? 'is-active' : ''}
                    onMouseEnter={() => setHoveredDonutIndex(index)}
                    onFocus={() => setHoveredDonutIndex(index)}
                    tabIndex={0}
                  >
                    <i style={{ background: slice.color }} />
                    <span>{slice.label}</span>
                    <strong>{slice.value}</strong>
                  </li>
                ))
              ) : (
                <li>暂无渠道占比</li>
              )}
            </ul>
          </div>
        </div>
      </section>

      <section className="workspace-panel workspace-orders-panel">
        <div className="panel-toolbar workspace-orders-toolbar">
          <div className="segmented">
            <button type="button" className={orderTab === 'arrivals' ? 'is-active' : ''} onClick={() => void refreshOrders('arrivals')} disabled={isLoading}>
              预抵
            </button>
            <button type="button" className={orderTab === 'staying' ? 'is-active' : ''} onClick={() => void refreshOrders('staying')} disabled={isLoading}>
              在住
            </button>
            <button type="button" className={orderTab === 'departing' ? 'is-active' : ''} onClick={() => void refreshOrders('departing')} disabled={isLoading}>
              预离
            </button>
          </div>
          <label className="table-search">
            <input
              type="text"
              placeholder="请输入姓名/手机号"
              value={orderKeyword}
              onChange={(event) => setOrderKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void refreshOrders(orderTab, orderKeyword)
              }}
            />
          </label>
          <Link to="/order/house-order/list">查看全部订单</Link>
        </div>
        <table className="workspace-order-table">
          <thead>
            <tr>
              {['来源', '姓名', '手机号', '房型', '房间', '入离时间', '房晚', '状态', '操作'].map((head) => (
                <th key={head}>{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dashboard.lists.orders.length > 0 ? (
              dashboard.lists.orders.map((order) => (
                <tr key={`${order.source}-${order.name}-${order.stayRange}`} data-testid="workspace-order-row">
                  <td>{order.source}</td>
                  <td>{order.name}</td>
                  <td>{order.phone}</td>
                  <td>{order.roomType}</td>
                  <td>{order.room}</td>
                  <td>{order.stayRange}</td>
                  <td>{order.nights}</td>
                  <td>
                    <span className="workspace-status">{order.status}</span>
                  </td>
                  <td className="workspace-order-actions">
                    <button type="button" aria-label="排房" onClick={() => navigate('/houseManage/months')} title="排房">排</button>
                    <button type="button" aria-label="住客资料" onClick={() => {
                      setSelectedOrder(order)
                      showStatus('住客资料已打开')
                    }} title="住客资料">客</button>
                    <button type="button" aria-label="查看订单" onClick={() => setSelectedOrder(order)} title="查看订单">看</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state">暂无数据</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="workspace-panel empty-panel" data-testid="workspace-todo-panel">
        <div className="panel-toolbar">
          <div className="segmented">
            <button type="button" className={todoTab === 'todo' ? 'is-active' : ''} onClick={() => setTodoTab('todo')}>
              待办事项
            </button>
            <button type="button" className={todoTab === 'product' ? 'is-active' : ''} onClick={() => setTodoTab('product')}>
              产品动态
            </button>
          </div>
        </div>
        {visibleTodoItems.length > 0 ? (
          <ul className="workspace-news-list">
            {visibleTodoItems.map((item) => (
              <li key={item.title}>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">暂无数据</div>
        )}
      </section>

      <section className="workspace-panel memo-panel">
        <div className="panel-toolbar">
          <div className="segmented">
            <button type="button" className={memoTab === 'todo' ? 'is-active' : ''} onClick={() => void refreshMemos('todo')} disabled={isLoading}>
              待处理
            </button>
            <button type="button" className={memoTab === 'done' ? 'is-active' : ''} onClick={() => void refreshMemos('done')} disabled={isLoading}>
              已处理
            </button>
          </div>
        </div>
        {dashboard.lists.memoItems.length > 0 ? (
          <ul className="workspace-memo-list">
            {dashboard.lists.memoItems.map((memo) => (
              <li key={memo.memoId}>
                <span>{memo.content}</span>
                {memo.isHandle === 0 ? (
                  <button type="button" onClick={() => void markMemoHandled(memo.memoId)} disabled={isLoading}>
                    处理
                  </button>
                ) : (
                  <strong>已处理</strong>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">{dashboard.lists.memoCount > 0 ? `共有 ${dashboard.lists.memoCount} 条备忘录` : '暂无数据'}</div>
        )}
        <div className="memo-input">
          <input type="text" placeholder="请输入新的备忘录" value={memoText} onChange={(event) => setMemoText(event.target.value)} />
          <button type="button" onClick={() => void submitMemo()} disabled={isLoading}>提交</button>
        </div>
      </section>

      <aside className="workspace-traffic-panel">
        <section className="workspace-traffic-banner">
          <strong>帮您实现<br />全网同价</strong>
          <button type="button" onClick={() => navigate('/setting/customChannel')}>点我设置</button>
        </section>
        <section className="workspace-panel workspace-traffic-card">
          <header>
            <p>
              门店流量获取能力 <strong>{dashboard.traffic.level}</strong>
            </p>
            <button type="button" onClick={() => navigate('/channels/ota')}>一键上渠道</button>
          </header>
          <TrafficGroup title="OTA流量" items={dashboard.traffic.connectedChannels} emptyText="暂无已开通渠道" />
          <TrafficGroup title="待开通渠道" items={dashboard.traffic.pendingChannels} mutedFrom={0} emptyText="暂无待开通渠道" />
          <p>建议：{dashboard.traffic.suggestions[0] ?? '暂无建议'}</p>
        </section>
      </aside>

      {selectedOrder ? (
        <div className="workspace-order-dialog-mask" role="presentation" onMouseDown={() => setSelectedOrder(null)}>
          <section className="workspace-order-dialog" role="dialog" aria-modal="true" aria-label="订单详情" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <strong>订单详情</strong>
              <button type="button" aria-label="关闭订单详情" onClick={() => setSelectedOrder(null)}>×</button>
            </header>
            <dl>
              <dt>客人</dt>
              <dd>{selectedOrder.name}</dd>
              <dt>渠道</dt>
              <dd>{selectedOrder.source}</dd>
              <dt>房型</dt>
              <dd>{selectedOrder.roomType}</dd>
              <dt>入离时间</dt>
              <dd>{selectedOrder.stayRange}</dd>
            </dl>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function buildTrendChart(series: WorkspaceTrendPoint[], metric: TrendMetricConfig) {
  const values = series.map((point) => toFiniteNumber(point[metric.key]))
  const ceiling = getTrendAxisCeiling(Math.max(...values, 0), metric.valueType)
  const points: RenderedTrendPoint[] = series.map((point, index) => {
    const value = toFiniteNumber(point[metric.key])
    const x = series.length <= 1
      ? 50
      : trendChartBounds.left + ((trendChartBounds.right - trendChartBounds.left) / (series.length - 1)) * index
    const y = trendChartBounds.bottom - (value / ceiling) * (trendChartBounds.bottom - trendChartBounds.top)

    return { ...point, x, y, value }
  })

  return {
    axisLabels: buildTrendAxisLabels(ceiling, metric.valueType),
    path: buildSmoothTrendPath(points),
    points,
  }
}

function buildSmoothTrendPath(points: RenderedTrendPoint[]) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index]
    const midX = (previous.x + point.x) / 2
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
  }, `M ${points[0].x} ${points[0].y}`)
}

function buildTrendAxisLabels(ceiling: number, valueType: TrendMetricConfig['valueType']) {
  return [ceiling, ceiling * 0.75, ceiling * 0.5, ceiling * 0.25, 0].map((value) => formatTrendAxisValue(value, valueType))
}

function getTrendAxisCeiling(maxValue: number, valueType: TrendMetricConfig['valueType']) {
  if (valueType === 'percent') return Math.max(100, Math.ceil(maxValue / 25) * 25)
  if (valueType === 'roomCount') return Math.max(4, Math.ceil(maxValue))
  if (maxValue <= 0) return 100

  const magnitude = 10 ** Math.floor(Math.log10(maxValue))
  const normalized = maxValue / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 3 ? 3 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function formatTrendAxisValue(value: number, valueType: TrendMetricConfig['valueType']) {
  if (valueType === 'percent') return `${formatPlainNumber(value, 0)}%`
  if (valueType === 'roomCount') return formatPlainNumber(value, 0)
  if (value >= 10000) return `${formatPlainNumber(value / 10000, 1)}万`
  return formatPlainNumber(value, 0)
}

function formatTrendValue(value: number, valueType: TrendMetricConfig['valueType']) {
  if (valueType === 'currency') return `￥${formatPlainNumber(value)}`
  if (valueType === 'percent') return `${formatPlainNumber(value)}%`
  return `${formatPlainNumber(value, 0)}间`
}

function buildDonutBackground(slices: DonutSlice[]) {
  const innerMask = 'radial-gradient(circle at center, #fff 43%, transparent 44%)'
  if (slices.length === 0) return `${innerMask}, conic-gradient(#e6ebf3 0% 100%)`

  let cursor = 0
  const segments = slices.flatMap((slice) => {
    const percent = clampPercent(slice.percent ?? Number.parseFloat(slice.value))
    if (percent <= 0) return []

    const start = cursor
    const end = Math.min(100, cursor + percent)
    cursor = end
    return `${slice.color} ${start}% ${end}%`
  })

  if (cursor < 100) segments.push(`#e6ebf3 ${cursor}% 100%`)
  return `${innerMask}, conic-gradient(${segments.join(', ')})`
}

function resolveDonutSliceIndex(rect: DOMRect, clientX: number, clientY: number, slices: DonutSlice[]) {
  if (slices.length === 0) return null

  const x = clientX - rect.left - rect.width / 2
  const y = clientY - rect.top - rect.height / 2
  const distance = Math.sqrt(x * x + y * y)
  if (distance < rect.width * 0.22 || distance > rect.width * 0.52) return null

  const angle = (Math.atan2(y, x) * 180) / Math.PI
  const percentAtPointer = ((angle + 450) % 360) / 3.6
  let cursor = 0

  for (let index = 0; index < slices.length; index += 1) {
    cursor += clampPercent(slices[index].percent ?? Number.parseFloat(slices[index].value))
    if (percentAtPointer <= cursor) return index
  }

  return null
}

function formatDonutCount(slice: DonutSlice) {
  return `${formatPlainNumber(toFiniteNumber(slice.count), 0)}单`
}

function formatDonutPercent(slice: DonutSlice) {
  return `${formatPlainNumber(clampPercent(slice.percent ?? Number.parseFloat(slice.value)), 2)}%`
}

function formatPlainNumber(value: number, fractionDigits = 2) {
  const normalized = Number.isInteger(value) || fractionDigits === 0
    ? value.toFixed(0)
    : value.toFixed(fractionDigits).replace(/\.?0+$/, '')
  return normalized
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.min(Math.max(value, 0), 100)
}

function toFiniteNumber(value: unknown) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function MetricGroup({
  className,
  label,
  indexes,
  metrics,
  onNavigate,
}: {
  className: string
  label: string
  indexes: number[]
  metrics: WorkspaceDashboard['summary']['metrics']
  onNavigate: (path: string) => void
}) {
  return (
    <section className={`workspace-stat-group ${className}`} aria-label={label}>
      {indexes.map((index) => {
        const metric = metrics[index] ?? emptyDashboard.summary.metrics[index]
        return (
          <button
            key={metric.label}
            type="button"
            className={`metric-card metric-${metric.accent ?? 'blue'}`}
            data-testid={metric.testId}
            onClick={() => {
              if (metric.route) onNavigate(metric.route)
            }}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </button>
        )
      })}
    </section>
  )
}

function TrafficGroup({ title, items, mutedFrom, emptyText }: { title: string; items: string[]; mutedFrom?: number; emptyText: string }) {
  return (
    <div className="workspace-traffic-group">
      <h3>{title}</h3>
      <div>
        {items.length > 0 ? (
          items.map((item, index) => (
            <span key={`${item}-${index}`} className={mutedFrom !== undefined && index >= mutedFrom ? 'is-muted' : ''}>
              {item}
            </span>
          ))
        ) : (
          <em>{emptyText}</em>
        )}
      </div>
    </div>
  )
}

function formatBusinessError(prefix: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const hasTechnicalDetail = /mock|provider|接口|契约|后端|阻塞|未接入|campId/i.test(message)
  return hasTechnicalDetail ? `${prefix}，请稍后重试` : `${prefix}：${message}`
}
