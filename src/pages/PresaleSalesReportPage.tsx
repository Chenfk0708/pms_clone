import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createInitialPresaleSalesQuery,
  createPresaleSalesRequestBodies,
  fetchPresaleSalesDashboard,
  type PresaleSalesDashboard,
  type PresaleSalesMetricCard,
  type PresaleSalesSourceRow,
  type PresaleSalesTrendChart,
  type PresaleTrendMode,
} from '../services/presaleSalesReport'
import './PresaleSalesReportPage.css'

export function PresaleSalesReportPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState(createInitialPresaleSalesQuery)
  const [dashboard, setDashboard] = useState<PresaleSalesDashboard | null>(null)
  const [trendMode, setTrendMode] = useState<PresaleTrendMode>('amount')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const abortController = new AbortController()
    setLoading(true)

    fetchPresaleSalesDashboard(query, abortController.signal)
      .then((nextDashboard) => {
        setDashboard(nextDashboard)
        setError('')
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : '预售券销售统计加载失败，请稍后重试')
      })
      .finally(() => {
        setLoading(false)
      })

    return () => abortController.abort()
  }, [query])

  const contractText = JSON.stringify({
    provider: dashboard?.provider ?? 'mock',
    state: dashboard?.state ?? query.state ?? 'success',
    activeTrendMode: trendMode,
    requests: dashboard?.serviceRequests ?? createPresaleSalesRequestBodies(query),
  })

  const currentChart = dashboard?.trendCharts[trendMode]
  const isEmpty = dashboard?.state === 'empty'
  const detailRoute = dashboard?.detailRoute ?? '/statistics/preSaleCouponMall'
  const controlsDisabled = loading || Boolean(error)

  function handleRetry() {
    setDashboard(null)
    setError('')
    setQuery(createInitialPresaleSalesQuery())
  }

  function handleTrendModeChange(nextMode: PresaleTrendMode) {
    setTrendMode(nextMode)
  }

  return (
    <div className="presale-sales-report-page" aria-label="预售券销售统计">
      <h1 className="sr-only-heading">预售券销售统计</h1>

      <pre
        hidden
        data-testid="presale-sales-service-contract"
        data-provider={dashboard?.provider ?? 'mock'}
        data-state={dashboard?.state ?? query.state ?? 'success'}
      >
        {contractText}
      </pre>

      <section className="presale-sales-section presale-sales-kpi-section">
        <header className="presale-sales-section__header">
          <h2>经营指标</h2>
          <button type="button" className="presale-sales-link" disabled={controlsDisabled} onClick={() => navigate(detailRoute)}>
            查看明细数据&gt;
          </button>
        </header>
        {error ? (
          <section className="presale-sales-error" role="alert" aria-label="预售券销售统计错误提示">
            <strong>预售券销售统计加载失败</strong>
            <p>{error}</p>
            <button type="button" onClick={handleRetry}>
              重新加载
            </button>
          </section>
        ) : loading ? (
          <div className="presale-sales-loading" role="status" aria-label="预售券销售统计加载中">
            正在加载预售券销售统计数据
          </div>
        ) : (
          <>
            <div className="presale-sales-metrics" aria-label="预售券经营指标">
              {(dashboard?.metricCards ?? []).map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </div>

            {isEmpty ? (
              <div className="presale-sales-inline-empty">{dashboard?.emptyMessage}</div>
            ) : null}
          </>
        )}
      </section>

      <section className="presale-sales-analysis-grid">
        <article className="presale-sales-section presale-sales-trend" aria-label="增长趋势分析">
          <header className="presale-sales-chart-header">
            <h2>增长趋势分析</h2>
            <div className="presale-sales-tabs" role="tablist" aria-label="增长趋势维度">
              <button
                type="button"
                aria-pressed={trendMode === 'amount'}
                className={trendMode === 'amount' ? 'is-active' : ''}
                disabled={controlsDisabled}
                onClick={() => handleTrendModeChange('amount')}
              >
                交易额
              </button>
              <button
                type="button"
                aria-pressed={trendMode === 'orders'}
                className={trendMode === 'orders' ? 'is-active' : ''}
                disabled={controlsDisabled}
                onClick={() => handleTrendModeChange('orders')}
              >
                订单数
              </button>
            </div>
            <div className="presale-sales-legend" aria-label="趋势图例">
              {(currentChart?.series ?? []).map((item) => (
                <span key={item.key} className={`is-${item.tone}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </header>

          {error ? null : loading ? (
            <div className="presale-sales-chart-loading">正在同步趋势数据</div>
          ) : isEmpty ? (
            <EmptyPanel message={dashboard?.emptyMessage ?? '当前周期暂无预售券成交数据'} />
          ) : currentChart ? (
            <TrendChart chart={currentChart} />
          ) : null}
        </article>

        <article className="presale-sales-section presale-sales-source" aria-label="小程序订单来源分析">
          <header className="presale-sales-chart-header">
            <h2>小程序订单来源分析</h2>
          </header>

          {error ? null : loading ? (
            <div className="presale-sales-chart-loading">正在同步来源分析</div>
          ) : (
            <>
              <div className="presale-sales-source-summary">
                {(dashboard?.sourceSummary ?? []).map((item) => (
                  <article key={item.label} className="presale-sales-source-card">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.hint}</small>
                  </article>
                ))}
              </div>

              {isEmpty ? (
                <EmptyPanel message={dashboard?.emptyMessage ?? '当前周期暂无预售券成交数据'} />
              ) : (
                <SourceTable rows={dashboard?.sourceRows ?? []} />
              )}
            </>
          )}
        </article>
      </section>
    </div>
  )
}

function MetricCard({ metric }: { metric: PresaleSalesMetricCard }) {
  return (
    <article className="presale-sales-metric">
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <dl>
        {metric.details.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

function TrendChart({ chart }: { chart: PresaleSalesTrendChart }) {
  const maxValue = chart.points.reduce((current, item) => Math.max(current, item.total), 1)

  return (
    <div className="presale-sales-trend-chart" aria-label={chart.title}>
      <div className="presale-sales-chart-callout">
        <strong>{chart.title}</strong>
        <span>{`按近 7 日${chart.unit === '元' ? '交易额' : '订单量'}汇总展示`}</span>
      </div>

      <div className="presale-sales-bars">
        {chart.points.map((point) => (
          <div key={point.label} className="presale-sales-bar-row">
            <span className="presale-sales-bar-label">{point.label}</span>
            <div className="presale-sales-bar-track">
              {chart.series.map((series) => (
                <div
                  key={series.key}
                  className={`presale-sales-bar is-${series.tone}`}
                  style={{ width: `${Math.max((point[series.key] / maxValue) * 100, 4)}%` }}
                  title={`${series.label} ${point[series.key]}${chart.unit}`}
                />
              ))}
            </div>
            <span className="presale-sales-bar-value">{`${point.total}${chart.unit}`}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourceTable({ rows }: { rows: PresaleSalesSourceRow[] }) {
  return (
    <div className="presale-sales-source-table-wrap">
      <table className="presale-sales-source-table">
        <thead>
          <tr>
            <th>来源</th>
            <th>成交券数</th>
            <th>交易金额</th>
            <th>成交率</th>
            <th>核销券数</th>
            <th>核销金额</th>
            <th>核销率</th>
            <th>退款券数</th>
            <th>退款金额</th>
            <th>退款率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.source}</td>
              <td>{row.dealCouponCount}</td>
              <td>{row.transactionAmount}</td>
              <td>{row.transactionRate}</td>
              <td>{row.writeOffCouponCount}</td>
              <td>{row.writeOffAmount}</td>
              <td>{row.writeOffRate}</td>
              <td>{row.refundCouponCount}</td>
              <td>{row.refundAmount}</td>
              <td>{row.refundRate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="presale-sales-empty">
      <span aria-hidden="true" />
      <strong>{message}</strong>
    </div>
  )
}
