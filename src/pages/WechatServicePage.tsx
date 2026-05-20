import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createWechatServiceExportTask,
  fetchWechatServiceDashboard,
  getDefaultWechatServiceOptions,
  resolveWechatServiceRuntimeConfig,
  type WechatServiceAccount,
  type WechatServiceConversation,
  type WechatServiceOption,
  type WechatServiceQuery,
  type WechatServiceViewModel,
} from '../services/wechatService'
import './WechatServicePage.css'

const defaultCampId = '1796067693589061634'
const defaultStartDate = '2026-05-18'
const defaultEndDate = '2026-05-18'

type Feedback = {
  tone: 'success' | 'error' | 'info'
  text: string
}

type Filters = {
  channel: string
  status: string
  keyword: string
}

export function WechatServicePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const runtimeConfig = useMemo(() => resolveWechatServiceRuntimeConfig({ search: location.search }), [location.search])
  const campId = new URLSearchParams(location.search).get('campId') || defaultCampId

  const [filters, setFilters] = useState<Filters>({
    channel: '',
    status: '',
    keyword: '',
  })
  const [view, setView] = useState<WechatServiceViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [openDropdown, setOpenDropdown] = useState<'channel' | 'status' | null>(null)
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<WechatServiceAccount | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<WechatServiceConversation | null>(null)

  const options = view?.filterOptions ?? getDefaultWechatServiceOptions()

  const buildQuery = useCallback(
    (nextFilters: Filters): WechatServiceQuery => ({
      ...runtimeConfig,
      campId,
      startDate: defaultStartDate,
      endDate: defaultEndDate,
      channel: nextFilters.channel,
      status: nextFilters.status,
      keyword: nextFilters.keyword.trim(),
      page: 1,
      pageSize: 8,
    }),
    [campId, runtimeConfig],
  )

  const loadDashboard = useCallback(
    async (nextFilters: Filters, options?: { feedback?: string }) => {
      const controller = new AbortController()
      setIsLoading(true)
      setError('')
      try {
        const result = await fetchWechatServiceDashboard(buildQuery(nextFilters), controller.signal)
        setView(result.view)
        if (options?.feedback) {
          setFeedback({ tone: 'success', text: options.feedback })
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : '微信客服数据加载失败，请重试')
      } finally {
        setIsLoading(false)
      }
      return () => controller.abort()
    },
    [buildQuery],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard({ channel: '', status: '', keyword: '' })
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  const selectedChannelLabel = labelFor(options.channels, filters.channel)
  const selectedStatusLabel = labelFor(options.statuses, filters.status)
  const averageReply = formatSeconds(view?.summary.averageReplySeconds ?? 0)

  function updateFilter(key: keyof Filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
    setOpenDropdown(null)
  }

  function handleQuery() {
    void loadDashboard(filters, { feedback: '微信客服数据已更新' })
  }

  function handleReset() {
    const nextFilters = { channel: '', status: '', keyword: '' }
    setFilters(nextFilters)
    void loadDashboard(nextFilters, { feedback: '筛选条件已重置' })
  }

  function handleRefresh() {
    void loadDashboard(filters, { feedback: '微信客服数据已刷新' })
  }

  function handleExport() {
    createWechatServiceExportTask(buildQuery(filters))
    setFeedback({ tone: 'success', text: '导出任务已创建，可在任务中心查看进度' })
  }

  function handleFollowUp() {
    setFeedback({ tone: 'success', text: '会话已标记为已跟进' })
  }

  return (
    <div className="wechat-service-page" data-testid="wechat-service-page">
      <header className="wechat-service-header">
        <div>
          <span className="wechat-service-eyebrow">SCRM / 客户沟通</span>
          <h1>微信客服运营台</h1>
          <p>统一查看企业微信客服账号、渠道咨询、待处理会话和入住沟通状态。</p>
        </div>
        <div className="wechat-service-header__actions">
          <button type="button" onClick={() => navigate('/scrm/wechatService/receptionConfig')}>
            接待配置
          </button>
          <button type="button" onClick={() => navigate('/scrm/sidebar/preview')}>
            聊天工具栏
          </button>
        </div>
      </header>

      <section className="wechat-service-filters" aria-label="微信客服筛选">
        <FilterMenu
          label={selectedChannelLabel}
          options={options.channels}
          isOpen={openDropdown === 'channel'}
          onToggle={() => setOpenDropdown(openDropdown === 'channel' ? null : 'channel')}
          onSelect={(value) => updateFilter('channel', value)}
        />
        <FilterMenu
          label={selectedStatusLabel}
          options={options.statuses}
          isOpen={openDropdown === 'status'}
          onToggle={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
          onSelect={(value) => updateFilter('status', value)}
        />
        <label className="wechat-service-search">
          <span>关键词</span>
          <input
            aria-label="会话关键词"
            value={filters.keyword}
            placeholder="搜索客户、订单或消息"
            onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
          />
        </label>
        <div className="wechat-service-filter-actions">
          <button type="button" disabled={isLoading} onClick={handleQuery}>
            查询
          </button>
          <button type="button" disabled={isLoading} onClick={handleReset}>
            重置
          </button>
          <button type="button" disabled={isLoading} onClick={handleRefresh}>
            刷新
          </button>
          <button type="button" onClick={handleExport}>
            导出
          </button>
        </div>
      </section>

      {feedback ? (
        <div className={`wechat-service-feedback is-${feedback.tone}`} role="status">
          {feedback.text}
        </div>
      ) : null}

      {error ? (
        <section className="wechat-service-alert" role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={handleRefresh}>
            重试
          </button>
        </section>
      ) : null}

      <section className="wechat-service-metrics" aria-label="微信客服核心指标">
        <MetricCard label="今日会话" value={view?.summary.todaySessions ?? 0} onClick={() => setSelectedMetric('今日会话')} />
        <MetricCard label="待处理会话" value={view?.summary.pendingSessions ?? 0} onClick={() => setSelectedMetric('待处理会话')} />
        <MetricCard label="平均响应" value={averageReply} onClick={() => setSelectedMetric('平均响应')} />
        <MetricCard label="转化线索" value={view?.summary.conversionLeads ?? 0} onClick={() => setSelectedMetric('转化线索')} />
      </section>

      <main className="wechat-service-grid">
        <section className="wechat-service-section" aria-label="客服账号">
          <div className="wechat-service-section__head">
            <h2>客服账号</h2>
            <span>{view?.summary.responseRate ?? '0%'} 响应率</span>
          </div>
          <div className="wechat-service-account-list">
            {(view?.accounts ?? []).map((account) => (
              <button key={account.id} type="button" className="wechat-service-account" onClick={() => setSelectedAccount(account)}>
                <span>
                  <strong>{account.name}</strong>
                  <em>{accountStatusText[account.status]}</em>
                </span>
                <span>今日会话 {account.todaySessions}</span>
                <span>{formatSeconds(account.averageReplySeconds)}</span>
                <span>评分 {account.serviceScore}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="wechat-service-section" aria-label="待办提醒">
          <div className="wechat-service-section__head">
            <h2>待办提醒</h2>
            <span>{defaultStartDate}</span>
          </div>
          <div className="wechat-service-todos">
            {(view?.todos ?? []).map((todo) => (
              <button
                key={todo.id}
                type="button"
                onClick={() => setFeedback({ tone: 'info', text: todo.action })}
                className="wechat-service-todo"
              >
                <strong>{todo.count}</strong>
                <span>{todo.title}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="wechat-service-section wechat-service-conversations" aria-label="会话队列">
          <div className="wechat-service-section__head">
            <h2>会话队列</h2>
            <span>{view?.pagination.total ?? 0} 条</span>
          </div>
          {isLoading ? <div className="wechat-service-loading">正在同步微信客服数据...</div> : null}
          {!isLoading && view?.conversations.length === 0 ? (
            <div className="wechat-service-empty">暂无微信客服会话</div>
          ) : null}
          <div className="wechat-service-table" role="table" aria-label="微信客服会话列表">
            <div className="wechat-service-table__head" role="row">
              <div role="columnheader">客户</div>
              <div role="columnheader">渠道</div>
              <div role="columnheader">状态</div>
              <div role="columnheader">房源/入住</div>
              <div role="columnheader">最后消息</div>
              <div role="columnheader">客服</div>
              <div role="columnheader">操作</div>
            </div>
            {(view?.conversations ?? []).map((conversation) => (
              <div className="wechat-service-table__row" role="row" key={conversation.id}>
                <div role="cell">
                  <strong>{conversation.customerName}</strong>
                  {conversation.unread > 0 ? <span className="wechat-service-unread">{conversation.unread}</span> : null}
                </div>
                <div role="cell">{conversation.channelName}</div>
                <div role="cell">
                  <span className={`wechat-service-status is-${conversation.status}`}>{conversation.statusName}</span>
                </div>
                <div role="cell">
                  <span>{conversation.roomType}</span>
                  <small>{conversation.stayDate}</small>
                </div>
                <div role="cell">{conversation.lastMessage}</div>
                <div role="cell">{conversation.assignee}</div>
                <div role="cell">
                  <button type="button" onClick={() => setSelectedConversation(conversation)}>
                    查看会话 {conversation.id}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {selectedMetric ? (
        <Dialog title="指标详情" onClose={() => setSelectedMetric(null)}>
          <p>{selectedMetric} 已按当前筛选条件统计，数据更新时间 {view?.refreshedAt ?? '-'}</p>
        </Dialog>
      ) : null}

      {selectedAccount ? (
        <Dialog title="客服账号详情" onClose={() => setSelectedAccount(null)}>
          <p>{selectedAccount.name} 当前状态：{accountStatusText[selectedAccount.status]}</p>
          <p>今日会话 {selectedAccount.todaySessions}，平均响应 {formatSeconds(selectedAccount.averageReplySeconds)}。</p>
        </Dialog>
      ) : null}

      {selectedConversation ? (
        <Dialog title="会话详情" onClose={() => setSelectedConversation(null)}>
          <p>{selectedConversation.customerName}</p>
          <p>{selectedConversation.channelName} / {selectedConversation.statusName} / {selectedConversation.orderStatus}</p>
          <p>{selectedConversation.roomType}</p>
          <p>{selectedConversation.stayDate}</p>
          <p>{selectedConversation.lastMessage}</p>
          <div className="wechat-service-dialog-actions">
            <button type="button" onClick={handleFollowUp}>标记已跟进</button>
            <button type="button" onClick={() => setSelectedConversation(null)}>关闭详情</button>
          </div>
        </Dialog>
      ) : null}
    </div>
  )
}

function FilterMenu({
  label,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string
  options: WechatServiceOption[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="wechat-service-menu">
      <button type="button" aria-haspopup="listbox" aria-expanded={isOpen} onClick={onToggle}>
        {label}
      </button>
      {isOpen ? (
        <div className="wechat-service-menu__list" role="listbox">
          {options.map((option) => (
            <button key={option.value || option.label} type="button" role="option" onClick={() => onSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({ label, value, onClick }: { label: string; value: number | string; onClick: () => void }) {
  return (
    <button type="button" className="wechat-service-metric" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  )
}

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="wechat-service-dialog-backdrop">
      <section className="wechat-service-dialog" role="dialog" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label={`关闭${title}`}>
            ×
          </button>
        </header>
        <div>{children}</div>
      </section>
    </div>
  )
}

function labelFor(options: WechatServiceOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? options[0]?.label ?? '全部'
}

function formatSeconds(seconds: number) {
  if (seconds <= 0) return '0秒'
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.floor(seconds / 60)
  const restSeconds = seconds % 60
  return `${minutes}分${restSeconds}秒`
}

const accountStatusText: Record<WechatServiceAccount['status'], string> = {
  online: '在线',
  busy: '忙碌',
  offline: '离线',
}
