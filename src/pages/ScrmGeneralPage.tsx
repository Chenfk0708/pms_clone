import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  defaultScrmGeneralFilters,
  loadScrmGeneralData,
  type ScrmGeneralFilters,
  type ScrmGeneralMetric,
  type ScrmGeneralModel,
  type ScrmGeneralScenario,
  type ScrmGeneralScene,
} from '../services/scrmGeneral'
import './ScrmGeneralPage.css'

type DialogState =
  | { type: 'metric'; metric: ScrmGeneralMetric }
  | { type: 'scene'; scene: ScrmGeneralScene }
  | null

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
  const [dialog, setDialog] = useState<DialogState>(null)

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

  function updateFilter<Key extends keyof ScrmGeneralFilters>(key: Key, value: ScrmGeneralFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleQuery() {
    setLoading(true)
    setError('')
    setScenario('success')
    setFilters((current) => ({ ...current }))
    setFeedback('已按当前条件刷新客户概况')
  }

  function handleReset() {
    setLoading(true)
    setError('')
    setScenario('success')
    setFilters(defaultScrmGeneralFilters)
    setFeedback('已恢复默认条件')
  }

  function handleRefresh() {
    setLoading(true)
    setError('')
    setScenario('success')
    setFilters((current) => ({ ...current }))
    setFeedback('客户概况已刷新')
  }

  function handleRetry() {
    setLoading(true)
    setError('')
    setScenario('success')
    setFeedback('已重新加载客户概况')
  }

  function handleExport() {
    setFeedback('已创建客户概况导出任务')
  }

  return (
    <div className="scrm-page scrm-page--general">
      <header className="scrm-general-header">
        <div>
          <span className="scrm-general-kicker">SCRM / 客户概况</span>
          <h1>客户概况</h1>
        </div>
        <div className="scrm-general-header__actions">
          <Link to="/customer/list">客户列表</Link>
          <button type="button" onClick={handleRefresh} disabled={loading}>
            刷新
          </button>
          <button type="button" onClick={handleExport} disabled={loading || Boolean(error)}>
            导出
          </button>
        </div>
      </header>

      <output data-testid="scrm-general-request-state" hidden aria-label="客户概况请求状态">
        {requestEcho}
      </output>
      <output className="scrm-general-feedback" role="status" aria-label="客户概况操作反馈">
        {feedback}
      </output>

      {showAuthAlert ? (
        <section className="scrm-auth-alert" aria-label="企业微信授权提醒">
          <span className="scrm-auth-alert__icon" aria-hidden="true" />
          <span>企业微信未授权，可能导致部分功能无法使用，请尽快前往授权。</span>
          <button type="button" onClick={() => navigate('/channels/private/setting/weComSetting')}>
            前往企业微信授权
          </button>
          <button type="button" onClick={() => setShowAuthAlert(false)}>
            知道了
          </button>
        </section>
      ) : null}

      <section className="scrm-filter-bar" aria-label="客户概况筛选">
        <label>
          <span>开始日期</span>
          <input
            aria-label="开始日期"
            type="date"
            value={filters.startDate}
            onChange={(event) => updateFilter('startDate', event.target.value)}
          />
        </label>
        <label>
          <span>结束日期</span>
          <input
            aria-label="结束日期"
            type="date"
            value={filters.endDate}
            onChange={(event) => updateFilter('endDate', event.target.value)}
          />
        </label>
        <label>
          <span>门店</span>
          <select aria-label="门店" value={filters.poiId} onChange={(event) => updateFilter('poiId', event.target.value)}>
            {(dashboard?.stores ?? [{ value: filters.poiId, label: '天落会宿公寓(前海壹方城宝安中心店)' }]).map((store) => (
              <option key={store.value} value={store.value}>
                {store.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>运营维度</span>
          <select
            aria-label="运营维度"
            value={filters.dimension}
            onChange={(event) => updateFilter('dimension', event.target.value as ScrmGeneralFilters['dimension'])}
          >
            {(dashboard?.dimensions ?? []).map((dimension) => (
              <option key={dimension.value} value={dimension.value}>
                {dimension.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={handleQuery} disabled={loading}>
          查询
        </button>
        <button type="button" onClick={handleReset} disabled={loading}>
          重置
        </button>
      </section>

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
                  <span className={`scrm-asset-card__icon tone-${metric.tone}`} aria-hidden="true" />
                  <div>
                    <span className="scrm-asset-card__label">{metric.label}</span>
                    <strong>{metric.value}</strong>
                    {metric.unit ? <em>{metric.unit}</em> : null}
                    <small>{metric.trend}</small>
                  </div>
                  <button type="button" aria-label={`查看${metric.label}详情`} onClick={() => setDialog({ type: 'metric', metric })}>
                    查看详情
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="scrm-section scrm-section--trend" aria-label="客户增长趋势图">
            <h2>客户增长趋势图</h2>
            <div className="scrm-trend-legend">
              {dashboard.trends.map((series) => (
                <span key={series.label}>
                  <i className={`tone-${series.tone}`} aria-hidden="true" />
                  {series.label}
                </span>
              ))}
            </div>
            <div className="scrm-mini-charts">
              {dashboard.trends.map((series) => (
                <article key={series.label} className={`scrm-mini-chart tone-${series.tone}`}>
                  <div className="scrm-mini-chart__plot" aria-hidden="true">
                    {series.points.map((point) => (
                      <span key={point.date} style={{ height: `${Math.max(8, point.value / 8)}px` }} />
                    ))}
                  </div>
                  <div className="scrm-mini-chart__axis">
                    {series.points.map((point) => (
                      <strong key={point.date}>{point.date}</strong>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <div className="scrm-general-columns">
            <section className="scrm-section" aria-label="客户运营待办">
              <h2>客户运营待办</h2>
              {dashboard.todos.length > 0 ? (
                <div className="scrm-todo-list">
                  {dashboard.todos.map((todo) => (
                    <button key={todo.id} type="button" onClick={() => navigate(todo.route)}>
                      <strong>{todo.title}</strong>
                      <span>{todo.count}</span>
                      <small>{todo.description}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="scrm-empty">当前条件暂无待办</p>
              )}
            </section>

            <section className="scrm-section" aria-label="客户来源排行">
              <h2>客户来源排行</h2>
              {dashboard.sources.length > 0 ? (
                <table className="scrm-source-table">
                  <thead>
                    <tr>
                      <th>来源</th>
                      <th>客户数</th>
                      <th>会员数</th>
                      <th>转化率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.sources.map((source) => (
                      <tr key={source.channel}>
                        <td>{source.channel}</td>
                        <td>{source.customerCount}</td>
                        <td>{source.memberCount}</td>
                        <td>{source.conversionRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="scrm-empty">暂无来源数据</p>
              )}
            </section>
          </div>

          <section className="scrm-section scrm-section--scenes" aria-label="推荐场景">
            <h2>推荐场景</h2>
            <div className="scrm-scene-grid">
              {dashboard.scenes.map((scene) => (
                <article key={scene.id} className="scrm-scene-card">
                  <span className={`scrm-scene-card__icon tone-${scene.tone}`} aria-hidden="true" />
                  <strong>{scene.title}</strong>
                  <p>{scene.description}</p>
                  <button type="button" aria-label={`体验 ${scene.title}`} onClick={() => setDialog({ type: 'scene', scene })}>
                    立即体验
                  </button>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <section className="scrm-release-banner" aria-label="SCRM新版上线">
        <strong>路客云 SCRM 全新上线：私域留存转化和企微深度融合</strong>
      </section>

      {dialog ? <ScrmGeneralDialog dialog={dialog} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function ScrmGeneralDialog({ dialog, onClose }: { dialog: DialogState; onClose: () => void }) {
  if (!dialog) return null

  if (dialog.type === 'metric') {
    return (
      <div className="scrm-dialog-layer">
        <section className="scrm-dialog" role="dialog" aria-modal="true" aria-label="客户指标详情">
          <header>
            <h2>{dialog.metric.label}</h2>
            <button type="button" aria-label="关闭详情" onClick={onClose}>
              ×
            </button>
          </header>
          <p>{dialog.metric.description}</p>
          <strong>
            {dialog.metric.value}
            {dialog.metric.unit}
          </strong>
        </section>
      </div>
    )
  }

  return (
    <div className="scrm-dialog-layer">
      <section className="scrm-dialog" role="dialog" aria-modal="true" aria-label="推荐场景详情">
        <header>
          <h2>{dialog.scene.title}</h2>
          <button type="button" aria-label="关闭场景详情" onClick={onClose}>
            ×
          </button>
        </header>
        <p>{dialog.scene.description}</p>
        <Link to={dialog.scene.route}>进入业务页面</Link>
      </section>
    </div>
  )
}
