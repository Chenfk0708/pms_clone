import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  type OtaChannel,
  type OtaDashboard,
  type OtaFilters,
  type OtaLogFilters,
  type OtaLogResult,
  createDefaultOtaFilters,
  createDefaultOtaLogFilters,
  fetchOtaDashboard,
  fetchOtaOperationLogs,
} from '../services/ota'
import './OtaPage.css'

type FeedbackKind = 'idle' | 'success' | 'error'
type DialogState =
  | { type: 'detail'; channel: OtaChannel }
  | { type: 'account'; channel: OtaChannel; account: string }
  | { type: 'activate'; channel: OtaChannel }
  | null

export function OtaPage() {
  const location = useLocation()
  const isLogPage = location.pathname.endsWith('/log')

  return isLogPage ? <OtaLogPage key={location.search} /> : <OtaDashboardPage key={location.search} />
}

function OtaDashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<OtaFilters>(() => createDefaultOtaFilters(new URLSearchParams(location.search)))
  const [data, setData] = useState<OtaDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState({ kind: 'idle' as FeedbackKind, message: '' })
  const [dialog, setDialog] = useState<DialogState>(null)

  useEffect(() => {
    let active = true

    fetchOtaDashboard(filters)
      .then((nextData) => {
        if (!active) return
        setData(nextData)
        setFeedback((current) => current.message ? current : { kind: 'success', message: 'OTA渠道数据已更新' })
      })
      .catch((caught: Error) => {
        if (!active) return
        setError(caught.message)
        setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters])

  function updateFilter<Key extends keyof OtaFilters>(key: Key, value: OtaFilters[Key]) {
    setLoading(true)
    setError('')
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function queryDashboard() {
    setFeedback({ kind: 'success', message: '已按筛选条件更新 OTA 渠道数据' })
    setLoading(true)
    setError('')
    setFilters((current) => ({ ...current }))
  }

  function resetDashboard() {
    setFeedback({ kind: 'success', message: '已重置 OTA 筛选条件' })
    setLoading(true)
    setError('')
    setFilters(createDefaultOtaFilters())
  }

  function refreshDashboard() {
    setFeedback({ kind: 'success', message: '数据已刷新，最近同步时间已更新' })
    setLoading(true)
    setError('')
    setFilters((current) => ({ ...current }))
  }

  function exportDashboard() {
    setFeedback({ kind: 'success', message: '导出任务已创建，可在任务中心查看进度' })
  }

  function submitAccount() {
    if (dialog?.type !== 'account') return
    if (!dialog.account.trim()) {
      setFeedback({ kind: 'error', message: '请输入渠道账号后再提交' })
      return
    }

    setDialog(null)
    setFeedback({ kind: 'success', message: `${dialog.channel.name}账号新增成功，正在同步渠道资料` })
  }

  function confirmActivation() {
    if (dialog?.type !== 'activate') return
    const channelName = dialog.channel.name
    setDialog(null)
    setFeedback({ kind: 'success', message: `${channelName}关联申请已提交，授权完成后会自动同步渠道资料` })
  }

  const hasNoChannels = data && data.connectedChannels.length === 0 && data.pendingChannels.length === 0

  return (
    <div className="ota-page">
      <h1 className="sr-only-heading">OTA</h1>
      <section className="ota-toolbar" aria-label="OTA筛选">
        <label className="ota-field">
          <span>业务日期</span>
          <input
            aria-label="业务日期"
            type="date"
            value={filters.businessDate}
            onChange={(event) => updateFilter('businessDate', event.target.value)}
          />
        </label>
        <label className="ota-field">
          <span>门店</span>
          <select aria-label="门店" value={filters.storeId} onChange={(event) => updateFilter('storeId', event.target.value)}>
            {(data?.stores ?? []).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            {!data ? <option value={filters.storeId}>全部门店</option> : null}
          </select>
        </label>
        <label className="ota-field">
          <span>运营维度</span>
          <select aria-label="运营维度" value={filters.dimension} onChange={(event) => updateFilter('dimension', event.target.value as OtaFilters['dimension'])}>
            {(data?.dimensions ?? []).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
            {!data ? <option value={filters.dimension}>全部渠道</option> : null}
          </select>
        </label>
        <div className="ota-toolbar__actions">
          <button type="button" className="ota-button" onClick={resetDashboard}>重置</button>
          <button type="button" className="ota-button ota-button--primary" onClick={queryDashboard} disabled={loading}>查询</button>
          <button type="button" className="ota-button" onClick={refreshDashboard} disabled={loading}>刷新</button>
          <button type="button" className="ota-button" onClick={exportDashboard}>导出</button>
        </div>
      </section>

      {loading ? <div className="ota-loading" role="status">OTA渠道数据加载中</div> : null}

      {error ? (
        <section className="ota-state ota-state--error" role="alert" aria-label="OTA数据错误">
          <strong>OTA数据加载失败</strong>
          <span>{error}</span>
          <button type="button" onClick={refreshDashboard}>重试</button>
        </section>
      ) : null}

      {data ? (
        <>
          <div
            className="sr-only-heading"
            role="status"
            aria-label="OTA数据请求状态"
            data-trace-id={data.traceId}
            data-request={`date=${data.request.businessDate};storeId=${data.request.storeId};dimension=${data.request.dimension}`}
          >
            OTA渠道数据已就绪
          </div>
          <section className="ota-metrics" aria-label="OTA核心指标">
            {data.metrics.map((metric) => (
              <article key={metric.key} className="ota-metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <p>{metric.detail}</p>
              </article>
            ))}
          </section>

          {hasNoChannels ? (
            <section className="ota-state" aria-label="OTA空状态">
              <strong>当前筛选条件下暂无渠道数据</strong>
              <span>可以调整门店、日期或运营维度后重新查询。</span>
            </section>
          ) : (
            <>
              <ChannelSection
                title="已直连渠道"
                channels={data.connectedChannels}
                kind="connected"
                onAccount={(channel) => setDialog({ type: 'account', channel, account: '' })}
                onDetail={(channel) => setDialog({ type: 'detail', channel })}
                onActivate={(channel) => setDialog({ type: 'activate', channel })}
              />
              <ChannelSection
                title="未直连渠道"
                channels={data.pendingChannels}
                kind="pending"
                onAccount={(channel) => setDialog({ type: 'account', channel, account: '' })}
                onDetail={(channel) => setDialog({ type: 'detail', channel })}
                onActivate={(channel) => setDialog({ type: 'activate', channel })}
              />
            </>
          )}

          <section className="ota-bottom-grid">
            <div className="ota-reminders" aria-label="OTA待办提醒">
              <h2>待办提醒</h2>
              {data.reminders.length ? data.reminders.map((item) => (
                <button key={item.id} type="button" onClick={() => setFeedback({ kind: 'success', message: `${item.title}已打开` })}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </button>
              )) : <span>暂无待办提醒</span>}
            </div>
            <div className="ota-quick-links" aria-label="OTA快捷入口">
              <h2>快捷入口</h2>
              {data.quickLinks.map((item) => (
                <button key={item.id} type="button" onClick={() => navigate(item.route)}>{item.label}</button>
              ))}
            </div>
          </section>
        </>
      ) : null}

      <button type="button" className="ota-log-entry" onClick={() => navigate('/channels/ota/log')}>操作日志</button>
      <FeedbackStatus feedback={feedback} />
      {dialog ? (
        <OtaDialog
          dialog={dialog}
          onClose={() => setDialog(null)}
          onAccountChange={(account) => dialog.type === 'account' && setDialog({ ...dialog, account })}
          onSubmitAccount={submitAccount}
          onConfirmActivation={confirmActivation}
          onNavigate={navigate}
        />
      ) : null}
    </div>
  )
}

function OtaLogPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<OtaLogFilters>(() => createDefaultOtaLogFilters(new URLSearchParams(location.search)))
  const [data, setData] = useState<OtaLogResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [feedback, setFeedback] = useState({ kind: 'idle' as FeedbackKind, message: '' })

  useEffect(() => {
    let active = true

    fetchOtaOperationLogs(filters)
      .then((nextData) => {
        if (!active) return
        setData(nextData)
      })
      .catch((caught: Error) => {
        if (!active) return
        setError(caught.message)
        setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters])

  function updateFilter<Key extends keyof OtaLogFilters>(key: Key, value: OtaLogFilters[Key]) {
    setLoading(true)
    setError('')
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function queryLogs() {
    setFeedback({ kind: 'success', message: '已查询 OTA 操作日志' })
    setLoading(true)
    setError('')
    setFilters((current) => ({ ...current, page: 1 }))
  }

  function resetLogs() {
    setFeedback({ kind: 'success', message: '已重置 OTA 操作日志筛选' })
    setLoading(true)
    setError('')
    setFilters(createDefaultOtaLogFilters())
  }

  return (
    <div className="ota-page ota-page--log">
      <h1 className="sr-only-heading">OTA</h1>
      <div className="ota-breadcrumb">
        <button type="button" onClick={() => navigate('/channels/ota')}>OTA</button>
        <span>/</span>
        <strong>操作日志</strong>
      </div>

      <section className="ota-log-panel" aria-label="OTA操作日志筛选">
        <div className="ota-log-filter">
          <label className="ota-field">
            <span>渠道</span>
            <select aria-label="渠道" value={filters.channelId} onChange={(event) => updateFilter('channelId', event.target.value)}>
              {(data?.channelOptions ?? [{ value: 'all', label: '全部渠道' }]).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label className="ota-field">
            <span>关键词</span>
            <input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="搜索关键词" />
          </label>
          <label className="ota-field">
            <span>操作人</span>
            <input value={filters.operator} onChange={(event) => updateFilter('operator', event.target.value)} placeholder="搜索操作人" />
          </label>
          <div className="ota-log-actions">
            <button type="button" className="ota-button" onClick={resetLogs}>重 置</button>
            <button type="button" className="ota-button ota-button--primary" onClick={queryLogs} disabled={loading}>查 询</button>
            <button type="button" className="ota-link-button" onClick={() => setExpanded((value) => !value)}>
              {expanded ? '收起' : '展开'}
            </button>
          </div>
          {expanded ? (
            <div className="ota-log-filter ota-log-filter--advanced">
              <label className="ota-field">
                <span>操作类型</span>
                <select aria-label="操作类型" value={filters.operationType} onChange={(event) => updateFilter('operationType', event.target.value)}>
                  {(data?.operationTypeOptions ?? []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label className="ota-field">
                <span>操作状态</span>
                <select aria-label="操作状态" value={filters.operationStatus} onChange={(event) => updateFilter('operationStatus', event.target.value)}>
                  {(data?.operationStatusOptions ?? []).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </section>

      {loading ? <div className="ota-loading" role="status">OTA操作日志加载中</div> : null}
      {error ? (
        <section className="ota-state ota-state--error" role="alert" aria-label="OTA日志错误">
          <strong>OTA操作日志加载失败</strong>
          <span>{error}</span>
        </section>
      ) : null}

      {data ? (
        <>
          <div
            className="sr-only-heading"
            role="status"
            aria-label="OTA日志请求状态"
            data-trace-id={data.traceId}
            data-request={`channelId=${data.request.channelId};keyword=${data.request.keyword};page=${data.request.page}`}
          >
            OTA操作日志已就绪
          </div>
          <section className="ota-table-shell">
            <table aria-label="OTA操作日志列表" className="ota-log-table">
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>操作类型</th>
                  <th>操作内容</th>
                  <th>操作状态</th>
                  <th>操作人</th>
                  <th>操作时间</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.channel}</td>
                    <td>{row.type}</td>
                    <td>{row.content}</td>
                    <td><span className="ota-status-success">{row.status}</span></td>
                    <td>{row.operator}</td>
                    <td>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.rows.length === 0 ? (
              <div className="ota-state" aria-label="OTA日志空状态">
                <strong>暂无操作日志</strong>
                <span>可以调整筛选条件后重新查询。</span>
              </div>
            ) : null}
          </section>
          <nav className="ota-pagination" aria-label="OTA日志分页">
            {[1, 2, 3].map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                aria-label={`第 ${pageNumber} 页`}
                className={filters.page === pageNumber ? 'is-active' : ''}
                onClick={() => updateFilter('page', pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <span>共 {data.pagination.total} 条</span>
          </nav>
        </>
      ) : null}

      <FeedbackStatus feedback={feedback} />
    </div>
  )
}

function ChannelSection({
  title,
  channels,
  kind,
  onAccount,
  onDetail,
  onActivate,
}: {
  title: string
  channels: OtaChannel[]
  kind: 'connected' | 'pending'
  onAccount: (channel: OtaChannel) => void
  onDetail: (channel: OtaChannel) => void
  onActivate: (channel: OtaChannel) => void
}) {
  if (channels.length === 0) return null

  return (
    <section className="ota-channel-section">
      <div className="ota-section-title">
        <h2>{title}</h2>
      </div>
      <div className="ota-card-grid">
        {channels.map((channel, index) => (
          <article
            key={channel.id}
            className={`ota-channel-card ota-channel-card--${kind}`}
            data-testid={kind === 'pending' ? 'ota-pending-card' : channel.id === 'locals' ? 'ota-luke-card' : 'ota-connected-card'}
          >
            <div className="ota-channel-card__header">
              <div>
                <strong>{channel.name}</strong>
                <span>{channel.relation}</span>
              </div>
              <div className={`ota-channel-logo ota-channel-logo--${(index % 5) + 1}${kind === 'pending' ? ' ota-channel-logo--pending' : ''}`}>
                {channel.logoText}
              </div>
            </div>
            <p>{channel.detail}</p>
            <div className="ota-channel-card__actions">
              {kind === 'connected' && channel.id !== 'locals' ? (
                <button type="button" aria-label={`新增账号 ${channel.name}`} onClick={() => onAccount(channel)}>新增账号</button>
              ) : null}
              {kind === 'connected' ? (
                <button type="button" aria-label={`管理渠道 ${channel.name}`} onClick={() => onDetail(channel)}>管理渠道</button>
              ) : (
                <button type="button" className="ota-primary-action" aria-label={`立即关联 ${channel.name}`} onClick={() => onActivate(channel)}>立即关联</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function FeedbackStatus({ feedback }: { feedback: { kind: FeedbackKind; message: string } }) {
  return (
    <div role="status" aria-label="OTA操作反馈" className={`ota-live-status ${feedback.kind === 'error' ? 'is-error' : ''}`}>
      {feedback.message}
    </div>
  )
}

function OtaDialog({
  dialog,
  onClose,
  onAccountChange,
  onSubmitAccount,
  onConfirmActivation,
  onNavigate,
}: {
  dialog: NonNullable<DialogState>
  onClose: () => void
  onAccountChange: (value: string) => void
  onSubmitAccount: () => void
  onConfirmActivation: () => void
  onNavigate: (path: string) => void
}) {
  if (dialog.type === 'detail') {
    return (
      <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
        <aside className="ota-drawer" role="dialog" aria-label="渠道详情" onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <strong>{dialog.channel.name}</strong>
            <button type="button" aria-label="关闭详情" onClick={onClose}>×</button>
          </header>
          <dl>
            <div><dt>房型映射</dt><dd>{dialog.channel.mappedRoomTypeCount}/{dialog.channel.roomTypeCount}</dd></div>
            <div><dt>最近同步</dt><dd>{dialog.channel.lastSyncAt}</dd></div>
            <div><dt>渠道状态</dt><dd>{dialog.channel.relation}</dd></div>
          </dl>
          <p>{dialog.channel.detail}</p>
          <footer>
            <button type="button" onClick={() => onNavigate('/houseManage/months')}>去房态</button>
            <button type="button" onClick={() => onNavigate('/order/house-order/list')}>去订单</button>
          </footer>
        </aside>
      </div>
    )
  }

  if (dialog.type === 'account') {
    return (
      <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
        <section className="ota-dialog" role="dialog" aria-label="新增渠道账号" onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <strong>新增{dialog.channel.name}账号</strong>
            <button type="button" aria-label="关闭新增账号" onClick={onClose}>×</button>
          </header>
          <label className="ota-field">
            <span>渠道账号</span>
            <input aria-label="渠道账号" value={dialog.account} onChange={(event) => onAccountChange(event.target.value)} placeholder="请输入渠道账号" />
          </label>
          <footer>
            <button type="button" onClick={onClose}>取消</button>
            <button type="button" className="ota-button--primary" onClick={onSubmitAccount}>提交账号</button>
          </footer>
        </section>
      </div>
    )
  }

  return (
    <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section className="ota-dialog" role="dialog" aria-label="关联渠道" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <strong>关联{dialog.channel.name}</strong>
          <button type="button" aria-label="关闭关联渠道" onClick={onClose}>×</button>
        </header>
        <p>确认发起{dialog.channel.name}渠道关联申请。授权完成后，系统会同步房型、房价和库存。</p>
        <footer>
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" className="ota-button--primary" onClick={onConfirmActivation}>确认关联</button>
        </footer>
      </section>
    </div>
  )
}
