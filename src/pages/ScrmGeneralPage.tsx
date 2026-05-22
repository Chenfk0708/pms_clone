import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  defaultScrmGeneralFilters,
  loadScrmGeneralData,
  type ScrmGeneralFilters,
  type ScrmGeneralModel,
  type ScrmGeneralScenario,
} from '../services/scrmGeneral'
import './ScrmGeneralPage.css'

export function ScrmGeneralPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<ScrmGeneralFilters>(defaultScrmGeneralFilters)
  const [scenario, setScenario] = useState<ScrmGeneralScenario>(
    searchParams.get('scenario') === 'empty' || searchParams.get('scenario') === 'error'
      ? (searchParams.get('scenario') as ScrmGeneralScenario)
      : 'success',
  )
  const [dashboard, setDashboard] = useState<ScrmGeneralModel | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState('')
  const [showAuthAlert, setShowAuthAlert] = useState(true)

  useEffect(() => {
    let alive = true

    loadScrmGeneralData(filters, scenario)
      .then((data) => {
        if (!alive) return
        setDashboard(data)
      })
      .catch((reason: Error) => {
        if (!alive) return
        setDashboard(null)
        setError(reason.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [filters, scenario])

  const requestEcho = useMemo(() => dashboard?.requestEcho ?? '', [dashboard])

  function updateDateFilter(key: 'startDate' | 'endDate', value: string) {
    setLoading(true)
    setError('')
    setScenario('success')
    setFilters((current) => ({ ...current, [key]: value }))
    setFeedback('已更新客户增长趋势日期')
  }

  function handleRetry() {
    setLoading(true)
    setError('')
    setScenario('success')
    setFeedback('已重新加载客户概况')
  }

  return (
    <div className="scrm-page scrm-page--general">
      <h1 className="scrm-visually-hidden">客户概况</h1>

      <output data-testid="scrm-general-request-state" hidden aria-label="客户概况请求状态">
        {requestEcho}
      </output>
      <output className="scrm-general-feedback" role="status" aria-label="客户概况操作反馈">
        {feedback}
      </output>

      {showAuthAlert ? (
        <section className="scrm-auth-alert" aria-label="企业微信授权提醒">
          <span className="scrm-auth-alert__icon" aria-hidden="true" />
          <span className="scrm-auth-alert__text">企业微信未授权，可能导致部分功能无法使用，请尽快前往授权。</span>
          <button type="button" onClick={() => navigate('/channels/private/setting/weComSetting')}>
            前往企业微信授权
          </button>
          <button type="button" onClick={() => setShowAuthAlert(false)}>
            知道了
          </button>
        </section>
      ) : null}

      {loading ? <div className="scrm-general-loading">客户概况加载中</div> : null}

      {error ? (
        <section className="scrm-general-error" role="alert" aria-label="客户概况数据错误">
          <strong>{error}</strong>
          <button type="button" onClick={handleRetry}>
            重试
          </button>
        </section>
      ) : null}

      {dashboard ? (
        <>
          <section className="scrm-section" aria-label="客户资产盘点">
            <h2>客户资产盘点</h2>
            <div className="scrm-asset-grid">
              {dashboard.metrics.map((metric) => (
                <article key={metric.id} className="scrm-asset-card">
                  <div className={`scrm-asset-card__badge tone-${metric.tone}`} aria-hidden="true">
                    <span className="scrm-asset-card__glyph" />
                  </div>
                  <div className="scrm-asset-card__content">
                    <span className="scrm-asset-card__label">{metric.label}</span>
                    <strong>
                      {metric.value}
                      {metric.unit ? <em>{metric.unit}</em> : null}
                    </strong>
                    {metric.actionLabel && metric.actionRoute ? (
                      <Link to={metric.actionRoute} className="scrm-asset-card__link">
                        {metric.actionLabel}
                      </Link>
                    ) : (
                      <small>{metric.trend}</small>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="scrm-section scrm-section--trend" aria-label="客户增长趋势图">
            <h2>客户增长趋势图</h2>
            <div className="scrm-trend-panel">
              <div className="scrm-trend-panel__header">
                <div className="scrm-trend-panel__range">
                  <label className="scrm-trend-panel__field">
                    <input
                      aria-label="趋势开始日期"
                      type="date"
                      value={filters.startDate}
                      onChange={(event) => updateDateFilter('startDate', event.target.value)}
                    />
                  </label>
                  <span className="scrm-trend-panel__divider" aria-hidden="true">
                    →
                  </span>
                  <label className="scrm-trend-panel__field">
                    <input
                      aria-label="趋势结束日期"
                      type="date"
                      value={filters.endDate}
                      onChange={(event) => updateDateFilter('endDate', event.target.value)}
                    />
                  </label>
                </div>
                <div className="scrm-trend-legend">
                  {dashboard.trends.map((series) => (
                    <span key={series.label}>
                      <i className={`tone-${series.tone}`} aria-hidden="true" />
                      {series.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="scrm-mini-charts">
                {dashboard.trends.map((series) => (
                  <article key={series.label} className={`scrm-mini-chart tone-${series.tone}`}>
                    <div className="scrm-mini-chart__canvas" aria-hidden="true">
                      <div className="scrm-mini-chart__baseline" />
                    </div>
                    <div className="scrm-mini-chart__axis">
                      {series.points.map((point) => (
                        <strong key={point.date}>{point.date}</strong>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="scrm-section scrm-section--scenes" aria-label="推荐场景">
            <h2>推荐场景</h2>
            <div className="scrm-scene-grid">
              {dashboard.scenes.map((scene) => (
                <article key={scene.id} className="scrm-scene-card">
                  <div className={`scrm-scene-card__icon tone-${scene.tone}`} aria-hidden="true">
                    <span className="scrm-scene-card__glyph" />
                  </div>
                  <strong>{scene.title}</strong>
                  <p>{scene.description}</p>
                  <Link to={scene.route} className="scrm-scene-card__action">
                    立即体验
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
