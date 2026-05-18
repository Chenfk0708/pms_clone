import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  fetchScrmSidebarDashboard,
  type ScrmConversation,
  type ScrmMetric,
  type ScrmSidebarDashboard,
  type ScrmSidebarFilters,
  type ScrmSidebarScenario,
} from '../services/scrmSidebarPreview'
import './ScrmSidebarPreviewPage.css'

const defaultFilters: ScrmSidebarFilters = {
  campId: '1796067693589061634',
  poiId: 'ALL',
  date: '2026-05-18',
  channel: 'ALL',
  keyword: '',
  page: 1,
  pageSize: 20,
}

const scenarioValues = new Set<ScrmSidebarScenario>(['success', 'empty', 'error'])

function scenarioFromQuery(value: string | null): ScrmSidebarScenario {
  return scenarioValues.has(value as ScrmSidebarScenario) ? (value as ScrmSidebarScenario) : 'success'
}

export function ScrmSidebarPreviewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scenario = scenarioFromQuery(searchParams.get('mockState'))
  const [filters, setFilters] = useState<ScrmSidebarFilters>(defaultFilters)
  const [dashboard, setDashboard] = useState<ScrmSidebarDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('正在加载聊天工具栏数据')
  const [selectedConversation, setSelectedConversation] = useState<ScrmConversation | null>(null)
  const [selectedMetricId, setSelectedMetricId] = useState('sessions')
  const [hiddenSeries, setHiddenSeries] = useState<'none' | 'orders'>('none')
  const [showMoreReplies, setShowMoreReplies] = useState(false)
  const successFeedbackRef = useRef<string | null>(null)

  const requestFilters = useMemo(() => ({ ...filters, scenario }), [filters, scenario])

  useEffect(() => {
    let alive = true

    async function loadDashboard() {
      setLoading(true)
      setError('')
      return fetchScrmSidebarDashboard(requestFilters)
    }

    loadDashboard()
      .then((nextDashboard) => {
        if (!alive) return
        setDashboard(nextDashboard)
        setFeedback(successFeedbackRef.current ?? `已通过聊天工具栏数据服务刷新，trace ${nextDashboard.traceId}`)
        successFeedbackRef.current = null
      })
      .catch((nextError: Error) => {
        if (!alive) return
        setDashboard(null)
        setError(nextError.message)
        setFeedback(nextError.message)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [requestFilters])

  const selectedMetric = useMemo(
    () => dashboard?.metrics.find((metric) => metric.id === selectedMetricId) ?? dashboard?.metrics[0],
    [dashboard, selectedMetricId],
  )

  function updateFilter<K extends keyof ScrmSidebarFilters>(key: K, value: ScrmSidebarFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }))
  }

  function runQuery() {
    successFeedbackRef.current = '已按筛选条件更新聊天工具栏'
    setFilters((current) => ({ ...current, page: 1 }))
  }

  function resetFilters() {
    setFilters({ ...defaultFilters, scenario: 'success' })
    setFeedback('筛选条件已重置')
  }

  function refreshData() {
    successFeedbackRef.current = '数据已刷新'
    setFilters((current) => ({ ...current }))
  }

  function exportReport() {
    setFeedback(`导出任务已创建，日期 ${filters.date}，渠道 ${filters.channel === 'ALL' ? '全部' : filters.channel}`)
  }

  function sendReply(templateTitle: string) {
    setFeedback(`话术已发送：${templateTitle}`)
  }

  function markFollowUp(itemTitle: string) {
    setFeedback(`待办已标记跟进：${itemTitle}`)
  }

  const hasRows = Boolean(dashboard?.conversations.length)

  return (
    <div className="scrm-sidebar-page">
      <header className="scrm-sidebar-hero">
        <div>
          <p>SCRM / 客户沟通</p>
          <h1>聊天工具栏</h1>
          <span>集中处理咨询、客户画像、房态推荐、订单承接和复购触达。</span>
        </div>
        <div className="scrm-sidebar-hero__actions">
          <button type="button" onClick={() => navigate('/setting/imSetting')}>
            会话设置
          </button>
          <button type="button" onClick={refreshData} disabled={loading}>
            刷新
          </button>
        </div>
      </header>

      <section className="scrm-sidebar-filter" aria-label="聊天工具栏筛选">
        <label>
          <span>会话日期</span>
          <input
            aria-label="会话日期"
            type="date"
            value={filters.date}
            onChange={(event) => updateFilter('date', event.target.value)}
          />
        </label>
        <label>
          <span>门店</span>
          <select
            aria-label="门店"
            value={filters.poiId}
            onChange={(event) => updateFilter('poiId', event.target.value)}
          >
            {(dashboard?.stores ?? [{ id: 'ALL', label: '全部门店' }]).map((store) => (
              <option key={store.id} value={store.id}>
                {store.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>渠道</span>
          <select
            aria-label="渠道"
            value={filters.channel}
            onChange={(event) => updateFilter('channel', event.target.value)}
          >
            {(dashboard?.channels ?? [{ id: 'ALL', label: '全部渠道' }]).map((channel) => (
              <option key={channel.id} value={channel.id}>
                {channel.label}
              </option>
            ))}
          </select>
        </label>
        <label className="scrm-sidebar-filter__keyword">
          <span>关键词</span>
          <input
            aria-label="关键词"
            value={filters.keyword}
            placeholder="客户昵称、房型、订单号"
            onChange={(event) => updateFilter('keyword', event.target.value)}
          />
        </label>
        <div className="scrm-sidebar-filter__actions">
          <button type="button" onClick={runQuery} disabled={loading}>
            查询
          </button>
          <button type="button" onClick={resetFilters} disabled={loading}>
            重置
          </button>
          <button type="button" onClick={exportReport} disabled={loading || Boolean(error)}>
            导出
          </button>
        </div>
      </section>

      <p className="scrm-sidebar-feedback" role="status" aria-label="聊天工具栏操作反馈">
        {loading ? '加载中...' : feedback}
      </p>

      {error ? (
        <section className="scrm-sidebar-state" role="alert" aria-label="聊天工具栏数据错误">
          <h2>聊天工具栏数据加载失败</h2>
          <p>{error}</p>
          <button type="button" onClick={refreshData}>
            重试
          </button>
        </section>
      ) : null}

      {!error && dashboard ? (
        <>
          <section className="scrm-sidebar-metrics" aria-label="聊天工具栏核心指标">
            {dashboard.metrics.map((metric) => (
              <MetricCard
                key={metric.id}
                metric={metric}
                selected={selectedMetricId === metric.id}
                onClick={() => setSelectedMetricId(metric.id)}
              />
            ))}
          </section>

          <main className="scrm-sidebar-grid">
            <section className="scrm-sidebar-panel scrm-sidebar-panel--wide" aria-label="聊天工具栏会话列表">
              <div className="scrm-sidebar-panel__head">
                <div>
                  <h2>会话处理台</h2>
                  <span>共 {dashboard.pagination.total} 条，按响应优先级排序</span>
                </div>
                <button type="button" onClick={() => setFeedback('已同步最新会话顺序')}>
                  同步排序
                </button>
              </div>

              {hasRows ? (
                <div className="scrm-sidebar-table" role="table" aria-label="聊天工具栏会话表格">
                  <div className="scrm-sidebar-table__head" role="row">
                    <span>客户</span>
                    <span>房型与订单</span>
                    <span>最近消息</span>
                    <span>响应</span>
                    <span>操作</span>
                  </div>
                  {dashboard.conversations.map((conversation) => (
                    <article key={conversation.id} className="scrm-sidebar-row" role="row">
                      <div>
                        <strong>{conversation.guestName}</strong>
                        <em>{conversation.status}</em>
                        <p>{conversation.tags.join(' / ')}</p>
                      </div>
                      <div>
                        <strong>{conversation.roomName}</strong>
                        <p>
                          {conversation.orderNo} · {conversation.stayRange}
                        </p>
                      </div>
                      <div>
                        <span>{conversation.lastMessage}</span>
                        <p>{conversation.lastMessageAt}</p>
                      </div>
                      <div>
                        <strong className={conversation.responseSla.includes('超时') ? 'is-danger' : ''}>
                          {conversation.responseSla}
                        </strong>
                      </div>
                      <div className="scrm-sidebar-row__actions">
                        <button type="button" onClick={() => setSelectedConversation(conversation)}>
                          查看详情 {conversation.guestName}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <section className="scrm-sidebar-state" aria-label="聊天工具栏空状态">
                  <h2>当前筛选条件下暂无会话</h2>
                  <p>可重置筛选后查看全部客户沟通记录。</p>
                  <button type="button" onClick={resetFilters}>
                    重置筛选
                  </button>
                </section>
              )}
            </section>

            <section className="scrm-sidebar-panel" aria-label="聊天工具栏趋势图">
              <div className="scrm-sidebar-panel__head">
                <div>
                  <h2>会话转化趋势</h2>
                  <span>{selectedMetric?.detail}</span>
                </div>
                <button
                  type="button"
                  aria-pressed={hiddenSeries === 'orders'}
                  onClick={() => setHiddenSeries((current) => (current === 'orders' ? 'none' : 'orders'))}
                >
                  订单趋势
                </button>
              </div>
              <div className="scrm-sidebar-bars">
                {dashboard.trend.map((point) => (
                  <div key={point.label} className="scrm-sidebar-bars__item">
                    <span>{point.label}</span>
                    <i style={{ height: `${point.sessions * 3}px` }} title={`会话 ${point.sessions}`} />
                    {hiddenSeries === 'none' ? <b style={{ height: `${point.orders * 10}px` }} title={`订单 ${point.orders}`} /> : null}
                  </div>
                ))}
              </div>
            </section>

            <section className="scrm-sidebar-panel" aria-label="聊天工具栏话术库">
              <div className="scrm-sidebar-panel__head">
                <div>
                  <h2>快捷话术</h2>
                  <span>可直接发送到当前会话</span>
                </div>
                <button type="button" onClick={() => setShowMoreReplies((current) => !current)}>
                  {showMoreReplies ? '收起' : '更多'}
                </button>
              </div>
              <div className="scrm-sidebar-replies">
                {dashboard.replyTemplates.slice(0, showMoreReplies ? undefined : 2).map((template) => (
                  <article key={template.id}>
                    <strong>{template.title}</strong>
                    <p>{template.content}</p>
                    <button type="button" onClick={() => sendReply(template.title)}>
                      发送{template.title}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="scrm-sidebar-panel" aria-label="聊天工具栏房态建议">
              <div className="scrm-sidebar-panel__head">
                <div>
                  <h2>房态推荐</h2>
                  <span>用于续住、升级和替代房源推荐</span>
                </div>
                <button type="button" onClick={() => navigate('/statistics/roomSituation')}>
                  去房态
                </button>
              </div>
              <div className="scrm-sidebar-room-list">
                {dashboard.roomSuggestions.map((room) => (
                  <button key={room.id} type="button" onClick={() => setFeedback(`${room.roomName} 已加入推荐话术`)}>
                    <strong>{room.roomName}</strong>
                    <span>{room.status}</span>
                    <em>{room.availableTonight} 间</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="scrm-sidebar-panel" aria-label="聊天工具栏待办">
              <div className="scrm-sidebar-panel__head">
                <div>
                  <h2>待办提醒</h2>
                  <span>会话跟进与订单动作</span>
                </div>
              </div>
              <div className="scrm-sidebar-todos">
                {dashboard.pendingItems.map((item) => (
                  <button key={item.id} type="button" onClick={() => markFollowUp(item.title)}>
                    <strong>{item.title}</strong>
                    <span>
                      {item.owner} · {item.dueTime}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            <section className="scrm-sidebar-panel" aria-label="聊天工具栏快捷入口">
              <div className="scrm-sidebar-panel__head">
                <div>
                  <h2>快捷入口</h2>
                  <span>使用项目已有路由承接</span>
                </div>
              </div>
              <div className="scrm-sidebar-shortcuts">
                <button type="button" onClick={() => navigate('/order/house-order/list')}>
                  去订单
                </button>
                <button type="button" onClick={() => navigate('/statistics/roomSituation')}>
                  查房态
                </button>
                <button type="button" onClick={() => navigate('/mallManagement/couponMgt')}>
                  发优惠券
                </button>
                <button type="button" onClick={() => navigate('/setting/imSetting')}>
                  话术设置
                </button>
              </div>
            </section>
          </main>

          <output
            data-testid="scrm-sidebar-service-contract"
            hidden
            data-provider={dashboard.providerMode}
            data-endpoint={dashboard.endpoint}
            data-request-keyword={String(dashboard.requestBody.keyword ?? '')}
            data-trace-id={dashboard.traceId}
          />
        </>
      ) : null}

      {selectedConversation ? (
        <section className="scrm-sidebar-drawer-layer" role="presentation">
          <aside className="scrm-sidebar-drawer" role="dialog" aria-modal="true" aria-label="会话详情">
            <header>
              <div>
                <h2>{selectedConversation.guestName}</h2>
                <span>{selectedConversation.status}</span>
              </div>
              <button type="button" aria-label="关闭会话详情" onClick={() => setSelectedConversation(null)}>
                ×
              </button>
            </header>
            <dl>
              <dt>客户偏好</dt>
              <dd>{selectedConversation.preference}</dd>
              <dt>历史订单</dt>
              <dd>
                {selectedConversation.orderNo} · {selectedConversation.roomName} · ￥{selectedConversation.orderAmount}
              </dd>
              <dt>最近消息</dt>
              <dd>{selectedConversation.lastMessage}</dd>
            </dl>
            <div className="scrm-sidebar-drawer__actions">
              <button type="button" onClick={() => sendReply('续住话术')}>
                发送续住话术
              </button>
              <button type="button" onClick={() => navigate('/order/house-order/list')}>
                查看订单
              </button>
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  )
}

function MetricCard({
  metric,
  selected,
  onClick,
}: {
  metric: ScrmMetric
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`scrm-sidebar-metric is-${metric.tone}${selected ? ' is-selected' : ''}`}
      onClick={onClick}
    >
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      <em>{metric.change}</em>
    </button>
  )
}
