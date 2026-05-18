import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  defaultSocialFilters,
  fetchSocialOverview,
  type SocialAccountRow,
  type SocialChannel,
  type SocialFilters,
  type SocialViewModel,
} from '../services/social'
import './SocialPage.css'

type DialogState =
  | { type: 'channel'; channel: SocialChannel }
  | { type: 'subscription'; channel: SocialChannel }
  | { type: 'more' }
  | null

function logoText(name: string) {
  if (name === '抖音来客' || name === '抖音特价酒店') return '♪'
  if (name === '小红书') return '小红书'
  if (name === '视频号') return '视频号'
  return name.slice(0, 2)
}

export function SocialPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<SocialFilters>(defaultSocialFilters)
  const [query, setQuery] = useState<SocialFilters>(defaultSocialFilters)
  const [viewModel, setViewModel] = useState<SocialViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('社媒数据加载中')
  const [dialog, setDialog] = useState<DialogState>(null)
  const nextSuccessFeedback = useRef('')

  useEffect(() => {
    const controller = new AbortController()

    fetchSocialOverview(query, controller.signal)
      .then((data) => {
        setViewModel(data)
        setFeedback(nextSuccessFeedback.current || '社媒数据已更新')
        nextSuccessFeedback.current = ''
      })
      .catch((loadError: Error) => {
        if (controller.signal.aborted) return
        setError(loadError.message || '社媒数据加载失败')
        setFeedback('社媒数据加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query])

  const allChannels = useMemo(
    () => [...(viewModel?.connectedChannels ?? []), ...(viewModel?.pendingChannels ?? [])],
    [viewModel],
  )
  const requestBody = viewModel ? JSON.stringify(viewModel.requestBody) : '{}'

  function updateFilter<K extends keyof SocialFilters>(key: K, value: SocialFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function submitFilters() {
    nextSuccessFeedback.current = '已按当前条件更新'
    setIsLoading(true)
    setError('')
    setFeedback('社媒数据加载中')
    setQuery(filters)
  }

  function resetFilters() {
    nextSuccessFeedback.current = '筛选条件已重置'
    setIsLoading(true)
    setError('')
    setFeedback('社媒数据加载中')
    setFilters(defaultSocialFilters)
    setQuery(defaultSocialFilters)
  }

  function refreshData() {
    nextSuccessFeedback.current = '社媒数据已刷新'
    setIsLoading(true)
    setError('')
    setFeedback('社媒数据加载中')
    setQuery((current) => ({ ...current }))
  }

  function exportData() {
    setFeedback('导出任务已创建，请在下载中心查看')
  }

  function showChannelDetail(channel: SocialChannel) {
    setDialog({ type: 'channel', channel })
  }

  function showSubscription(channel: SocialChannel) {
    setDialog({ type: 'subscription', channel })
  }

  function confirmSubscription() {
    setDialog(null)
    setFeedback('订阅开通申请已提交，客户经理将在今日跟进')
  }

  function syncRoomTypes(row: SocialAccountRow) {
    setFeedback(`${row.channel}房型同步任务已提交`)
  }

  return (
    <div
      className="social-channel-page"
      data-testid="social-channel-page"
      data-provider={viewModel?.provider ?? 'loading'}
      data-trace-id={viewModel?.traceId ?? ''}
      data-request-body={requestBody}
    >
      <h1 className="sr-only-heading">社媒</h1>
      <section className="social-channel-surface">
        <header className="social-ops-header">
          <div>
            <p>OTA / 社媒 / 社媒</p>
            <h2>社媒渠道运营</h2>
          </div>
          <div className="social-ops-header__actions">
            <button type="button" onClick={refreshData} disabled={isLoading}>
              刷新
            </button>
            <button type="button" onClick={exportData} disabled={isLoading || !viewModel}>
              导出
            </button>
            <button type="button" onClick={() => setDialog({ type: 'more' })}>
              更多
            </button>
          </div>
        </header>

        <form className="social-filter-bar" onSubmit={(event) => event.preventDefault()}>
          <label>
            <span>运营日期</span>
            <input
              aria-label="运营日期"
              type="date"
              value={filters.date}
              onChange={(event) => updateFilter('date', event.target.value)}
            />
          </label>
          <label>
            <span>门店</span>
            <select aria-label="门店" value={filters.campId} onChange={(event) => updateFilter('campId', event.target.value)}>
              {(viewModel?.filterOptions.camps ?? [{ label: '全部门店', value: 'all' }]).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>项目</span>
            <select
              aria-label="项目"
              value={filters.projectId}
              onChange={(event) => updateFilter('projectId', event.target.value)}
            >
              {(viewModel?.filterOptions.projects ?? [{ label: '全部项目', value: 'all' }]).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>渠道状态</span>
            <select
              aria-label="渠道状态"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value as SocialFilters['status'])}
            >
              {(viewModel?.filterOptions.statuses ?? [{ label: '全部状态', value: 'all' as const }]).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>关键词</span>
            <input
              aria-label="关键词"
              value={filters.keyword}
              placeholder="渠道/账号"
              onChange={(event) => updateFilter('keyword', event.target.value)}
            />
          </label>
          <div className="social-filter-bar__actions">
            <button type="button" onClick={submitFilters} disabled={isLoading}>
              查询
            </button>
            <button type="button" onClick={resetFilters} disabled={isLoading}>
              重置
            </button>
          </div>
        </form>

        <div className="social-feedback" role="status">
          {isLoading ? '社媒数据加载中' : feedback}
        </div>

        {error ? (
          <section className="social-state-panel social-state-panel--error" role="alert">
            <strong>社媒数据加载失败</strong>
            <span>请检查当前筛选条件后重新加载。</span>
            <button type="button" onClick={refreshData}>
              重新加载
            </button>
          </section>
        ) : null}

        {viewModel ? (
          <>
            <section className="social-metric-grid" aria-label="社媒核心指标">
              {viewModel.metrics.map((metric) => (
                <article key={metric.label} className={`social-metric-card social-metric-card--${metric.tone}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.change}</small>
                </article>
              ))}
            </section>

            {allChannels.length === 0 ? (
              <section className="social-state-panel">
                <strong>暂无符合当前筛选条件的社媒渠道</strong>
                <span>调整门店、状态或关键词后可重新查询。</span>
              </section>
            ) : (
              <>
                <ChannelSection title="已直连渠道" channels={viewModel.connectedChannels} onDetail={showChannelDetail} />
                <ChannelSection
                  title="未直连渠道"
                  channels={viewModel.pendingChannels}
                  onDetail={showChannelDetail}
                  onSubscribe={showSubscription}
                />
              </>
            )}

            <section className="social-dashboard-grid">
              <section className="social-panel" aria-label="社媒运营趋势">
                <PanelTitle title="社媒运营趋势" />
                <TrendChart viewModel={viewModel} />
              </section>

              <section className="social-panel" aria-label="社媒待办">
                <PanelTitle title="待办提醒" />
                <div className="social-todo-list">
                  {viewModel.todos.length === 0 ? (
                    <span className="social-empty-inline">暂无待办事项</span>
                  ) : (
                    viewModel.todos.map((todo) => (
                      <button key={todo.id} type="button" onClick={() => setFeedback(`${todo.title}已加入今日处理队列`)}>
                        <strong>{todo.title}</strong>
                        <span>{todo.channel}</span>
                        <small>
                          {todo.priority} / {todo.dueText}
                        </small>
                      </button>
                    ))
                  )}
                </div>
              </section>

              <section className="social-panel" aria-label="快捷入口">
                <PanelTitle title="快捷入口" />
                <div className="social-quick-links">
                  {viewModel.quickLinks.map((link) => (
                    <button key={link.path} type="button" onClick={() => navigate(link.path)}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </section>
            </section>

            <section className="social-panel social-account-panel">
              <PanelTitle title="账号管理" />
              <AccountTable rows={viewModel.accounts.list} onDetail={showChannelDetail} onSync={syncRoomTypes} channels={allChannels} />
            </section>
          </>
        ) : null}
      </section>

      {dialog?.type === 'channel' ? <ChannelDialog channel={dialog.channel} onClose={() => setDialog(null)} /> : null}
      {dialog?.type === 'subscription' ? (
        <SubscriptionDialog channel={dialog.channel} onConfirm={confirmSubscription} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.type === 'more' ? <MoreDialog onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function PanelTitle({ title }: { title: string }) {
  return (
    <div className="social-channel-section__title">
      <span aria-hidden="true" />
      <h2>{title}</h2>
    </div>
  )
}

function ChannelSection({
  title,
  channels,
  onDetail,
  onSubscribe,
}: {
  title: string
  channels: SocialChannel[]
  onDetail: (channel: SocialChannel) => void
  onSubscribe?: (channel: SocialChannel) => void
}) {
  if (channels.length === 0) return null

  return (
    <section className="social-channel-section">
      <PanelTitle title={title} />
      <div className={channels.length === 1 ? 'social-channel-grid social-channel-grid--single' : 'social-channel-grid'}>
        {channels.map((card) => (
          <article
            key={card.id}
            className={`social-channel-card social-channel-card--${card.status}`}
            aria-label={card.name}
            tabIndex={0}
            onClick={() => onDetail(card)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onDetail(card)
            }}
          >
            <div className="social-channel-card__meta">
              <strong>{card.name}</strong>
              <span>{card.relation}</span>
              <span>支持：{card.support.join('、') || '渠道运营'}</span>
              <span>
                今日订单 {card.dailyOrders}，转化率 {card.conversionRate}
              </span>
            </div>
            <div className={`social-channel-card__logo social-channel-card__logo--${card.accent}`}>{logoText(card.name)}</div>
            <div className="social-channel-card__actions">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (card.status === 'pending' && onSubscribe) onSubscribe(card)
                  else onDetail(card)
                }}
              >
                {card.action}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function TrendChart({ viewModel }: { viewModel: SocialViewModel }) {
  return (
    <>
      <div className="social-trend-chart">
        {viewModel.trend.length === 0 ? (
          <span className="social-empty-inline">暂无趋势数据</span>
        ) : (
          viewModel.trend.map((point) => (
            <div key={point.label} className="social-trend-chart__row">
              <span>{point.label}</span>
              <i style={{ width: `${Math.max(point.douyin * 5, 8)}px` }} title="抖音来客" />
              <b style={{ width: `${Math.max(point.xiaohongshu * 8, 8)}px` }} title="小红书" />
              <em style={{ width: `${Math.max(point.shipinhao * 9, 8)}px` }} title="视频号" />
            </div>
          ))
        )}
      </div>
      <div className="social-trend-legend">
        <span>抖音来客</span>
        <span>小红书</span>
        <span>视频号</span>
      </div>
    </>
  )
}

function AccountTable({
  rows,
  channels,
  onDetail,
  onSync,
}: {
  rows: SocialAccountRow[]
  channels: SocialChannel[]
  onDetail: (channel: SocialChannel) => void
  onSync: (row: SocialAccountRow) => void
}) {
  if (rows.length === 0) return <div className="social-empty-inline">暂无符合当前筛选条件的账号</div>

  return (
    <div className="social-detail-table-wrap">
      <table className="social-detail-table" aria-label="社媒账号管理列表">
        <thead>
          <tr>
            <th>渠道账号id</th>
            <th>账号ID</th>
            <th>门店</th>
            <th>授权业务</th>
            <th>审核状态</th>
            <th>同步状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const channel = channels.find((item) => item.name === row.channel)
            return (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.accountId}</td>
                <td>{row.store}</td>
                <td>{row.authorization.map((item) => <span key={item}>{item}</span>)}</td>
                <td>
                  <span className={row.auditStatus === '已发布' ? 'social-detail-status' : 'social-detail-status--reviewing'}>
                    {row.auditStatus}
                  </span>
                </td>
                <td>{row.syncStatus}</td>
                <td>
                  <div className="social-detail-actions">
                    <button type="button" onClick={() => channel && onDetail(channel)}>
                      查看详情
                    </button>
                    <button type="button" onClick={() => onSync(row)}>
                      拉取房型
                    </button>
                    <button type="button" onClick={() => onSync(row)}>
                      授权日历房
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function ChannelDialog({ channel, onClose }: { channel: SocialChannel; onClose: () => void }) {
  return (
    <div className="social-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="social-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${channel.name}渠道详情`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h3>{channel.name}渠道详情</h3>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>渠道状态</dt>
            <dd>{channel.status === 'connected' ? '已直连' : '待开通'}</dd>
          </div>
          <div>
            <dt>关联房型</dt>
            <dd>
              {channel.linkedRoomTypeCount}/{channel.roomTypeCount}
            </dd>
          </div>
          <div>
            <dt>支持业务</dt>
            <dd>{channel.support.join('、') || '渠道运营'}</dd>
          </div>
          <div>
            <dt>今日订单</dt>
            <dd>{channel.dailyOrders}</dd>
          </div>
        </dl>
        <div className="social-modal__tasks">
          {channel.pendingTasks.map((task) => (
            <span key={task}>{task}</span>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            关闭详情
          </button>
        </footer>
      </section>
    </div>
  )
}

function SubscriptionDialog({
  channel,
  onClose,
  onConfirm,
}: {
  channel: SocialChannel
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="social-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="social-modal social-modal--small"
        role="dialog"
        aria-modal="true"
        aria-label={`${channel.name}订阅方案`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h3>{channel.name}订阅方案</h3>
          <button type="button" aria-label="关闭订阅方案" onClick={onClose}>
            ×
          </button>
        </header>
        <p>开通后可管理渠道内容、活动库存和订单承接。</p>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="social-modal__primary" onClick={onConfirm}>
            确认订阅
          </button>
        </footer>
      </section>
    </div>
  )
}

function MoreDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="social-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="social-modal social-modal--small"
        role="dialog"
        aria-modal="true"
        aria-label="更多操作"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h3>更多操作</h3>
          <button type="button" aria-label="关闭更多操作" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="social-more-actions">
          <button type="button">渠道日志</button>
          <button type="button">订阅记录</button>
          <button type="button">同步记录</button>
        </div>
      </section>
    </div>
  )
}

export function SocialSettingPage() {
  return (
    <div className="social-channel-page social-channel-page--detail" data-testid="social-channel-detail">
      <h1 className="sr-only-heading">社媒</h1>
      <section className="social-detail-surface">
        <div className="social-detail-breadcrumb">
          <span>社媒/</span>
          <strong>渠道详情</strong>
        </div>

        <section className="social-detail-card">
          <header className="social-detail-card__head">
            <div>
              <h2>抖音来客直连</h2>
              <p>账号已完成授权，可继续维护门店、房型和预售券业务。</p>
            </div>
          </header>
          <div className="social-detail-tabs" role="tablist" aria-label="社媒渠道详情">
            {['账号管理', '门店管理', '日历房型', '预售房型'].map((tab, index) => (
              <button key={tab} type="button" role="tab" aria-selected={index === 0} className={index === 0 ? 'is-active' : ''}>
                {tab}
              </button>
            ))}
          </div>
          <div className="social-detail-toolbar">
            <button type="button" className="social-detail-toolbar__primary">
              添加账号
            </button>
            <label>
              <span>审核状态：</span>
              <select aria-label="审核状态" defaultValue="all">
                <option value="all">全部</option>
                <option value="published">已发布</option>
                <option value="reviewing">审核中</option>
              </select>
            </label>
            <label>
              <span>账号：</span>
              <input aria-label="账号" />
            </label>
            <button type="button">查 询</button>
            <button type="button">重 置</button>
          </div>
          <div className="social-detail-table-wrap">
            <table className="social-detail-table" aria-label="社媒账号管理列表">
              <thead>
                <tr>
                  <th>渠道账号id</th>
                  <th>账号ID</th>
                  <th>门店</th>
                  <th>授权业务</th>
                  <th>审核状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>7370207731854149643</td>
                  <td>1820360983796908034</td>
                  <td>天落会宿公寓(前海壹方城宝安中心店)</td>
                  <td>
                    <span>酒店行业预售券解决方案</span>
                    <span>酒店行业日历房解决方案</span>
                  </td>
                  <td>
                    <span className="social-detail-status">已发布</span>
                  </td>
                  <td>
                    <div className="social-detail-actions">
                      <button type="button">断开直连</button>
                      <button type="button">拉取房型</button>
                      <button type="button">授权日历房</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <footer className="social-detail-pagination">
            <span>第 1-1 条/总共 1 条</span>
            <button type="button" className="is-active">
              1
            </button>
            <span>10 条/页</span>
          </footer>
        </section>
      </section>
    </div>
  )
}
