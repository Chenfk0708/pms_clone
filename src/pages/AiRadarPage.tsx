import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createAiGlobalDataExportTask,
  fetchAiGlobalDataDashboard,
  fetchAiGlobalRoomDetail,
  getAiGlobalDataFallbackFilterOptions,
  getDefaultAiGlobalDataQuery,
  postponeAiGlobalReminder,
  resolveAiGlobalDataRuntimeConfig,
  resolveAiGlobalReminder,
  type AiGlobalDataAttention,
  type AiGlobalDataChannel,
  type AiGlobalDataQuery,
  type AiGlobalDataViewModel,
  type AiGlobalReminder,
  type AiGlobalRoomDetail,
  type AiGlobalRoomRow,
  type AiGlobalSummaryMetric,
} from '../services/aiGlobalData'
import './AiRadarPage.css'

type DialogState =
  | { type: 'metric'; metric: AiGlobalSummaryMetric }
  | { type: 'room'; detail: AiGlobalRoomDetail }
  | null

export function AiRadarPage() {
  const navigate = useNavigate()
  const runtimeConfig = useMemo(() => resolveAiGlobalDataRuntimeConfig(window.location.search), [])
  const initialQuery = useMemo(() => getDefaultAiGlobalDataQuery(runtimeConfig), [runtimeConfig])
  const [filters, setFilters] = useState<AiGlobalDataQuery>(initialQuery)
  const [query, setQuery] = useState<AiGlobalDataQuery>(initialQuery)
  const [viewModel, setViewModel] = useState<AiGlobalDataViewModel | null>(null)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('全域数据加载中')
  const [reminderStatusMap, setReminderStatusMap] = useState<Record<string, AiGlobalReminder['status']>>({})
  const nextSuccessFeedback = useRef('')
  const filterOptions = viewModel?.filterOptions ?? getAiGlobalDataFallbackFilterOptions()
  const filterIds = {
    camp: 'ai-global-data-filter-camp',
    channel: 'ai-global-data-filter-channel',
    attention: 'ai-global-data-filter-attention',
    roomKeyword: 'ai-global-data-filter-room-keyword',
  }

  useEffect(() => {
    const controller = new AbortController()

    fetchAiGlobalDataDashboard(query, controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return
        setViewModel(result)
        setErrorMessage('')
        setFeedback(nextSuccessFeedback.current || '全域数据已加载')
        nextSuccessFeedback.current = ''
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setViewModel(null)
        setErrorMessage(error instanceof Error ? error.message : '全域数据加载失败，请稍后重试')
        setFeedback('全域数据加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [query])

  const contractText = useMemo(
    () =>
      JSON.stringify(
        {
          traceId: viewModel?.traceId ?? '',
          provider: viewModel?.provider ?? query.provider ?? 'mock',
          requestContracts: viewModel?.requestContracts ?? {},
        },
        null,
        2,
      ),
    [query.provider, viewModel],
  )

  const reminders = useMemo(
    () =>
      (viewModel?.reminders ?? []).map((item) => ({
        ...item,
        status: reminderStatusMap[item.id] ?? item.status,
      })),
    [reminderStatusMap, viewModel],
  )

  function updateFilter<K extends keyof AiGlobalDataQuery>(key: K, value: AiGlobalDataQuery[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function submitFilters() {
    nextSuccessFeedback.current = '已按当前条件刷新全域数据'
    setIsLoading(true)
    setErrorMessage('')
    setFeedback('全域数据加载中')
    setQuery({ ...filters, reminderPage: 1 })
  }

  function resetFilters() {
    const defaults = getDefaultAiGlobalDataQuery(runtimeConfig)
    nextSuccessFeedback.current = '筛选条件已重置'
    setIsLoading(true)
    setErrorMessage('')
    setFeedback('全域数据加载中')
    setReminderStatusMap({})
    setFilters(defaults)
    setQuery(defaults)
  }

  function refreshDashboard() {
    nextSuccessFeedback.current = '全域数据已刷新'
    setIsLoading(true)
    setErrorMessage('')
    setFeedback('全域数据加载中')
    setQuery((current) => ({ ...current }))
  }

  function exportSnapshot() {
    createAiGlobalDataExportTask(query)
    setFeedback('全域数据导出任务已创建')
  }

  function openSubscription() {
    navigate('/version/applicationPayment/detail?app=globalRadar')
  }

  async function openRoomDetail(room: AiGlobalRoomRow) {
    const detail = await fetchAiGlobalRoomDetail(room.id, query)
    setDialog({ type: 'room', detail })
  }

  function postponeReminder(reminder: AiGlobalReminder) {
    postponeAiGlobalReminder(reminder, query)
    setReminderStatusMap((current) => ({ ...current, [reminder.id]: 'postponed' }))
    setFeedback('已延后提醒并保留在今日待办')
  }

  function resolveReminder(reminder: AiGlobalReminder) {
    resolveAiGlobalReminder(reminder, query)
    setReminderStatusMap((current) => ({ ...current, [reminder.id]: 'resolved' }))
    setFeedback('提醒已标记为已处理')
  }

  function openReminderTarget(reminder: AiGlobalReminder) {
    if (reminder.primaryAction === 'status') {
      navigate('/houseManage/months')
      return
    }
    navigate('/order/house-order/list')
  }

  return (
    <div
      className="ai-global-data-page"
      data-provider={viewModel?.provider ?? query.provider ?? 'mock'}
      data-response-state={errorMessage ? 'error' : viewModel?.state ?? query.mockState ?? 'success'}
      data-request-camp={query.campId}
      data-request-channel={query.channel}
      data-request-attention={query.attention}
      data-request-room-keyword={query.roomKeyword}
    >
      <section className="ai-global-data-shell">
        <header className="ai-global-data-hero">
          <div>
            <p>AI全域雷达 / 数据与配置</p>
            <h1>全域数据</h1>
            <span>{viewModel?.subscription.connectorProgress ?? '连接器状态加载中'}</span>
          </div>
          <div className="ai-global-data-hero__actions">
            <button type="button" data-testid="ai-global-data-refresh" aria-label="刷新" onClick={refreshDashboard} disabled={isLoading}>
              刷新
            </button>
            <button
              type="button"
              data-testid="ai-global-data-export"
              aria-label="导出快照"
              onClick={exportSnapshot}
              disabled={isLoading || !viewModel}
            >
              导出快照
            </button>
            <button
              type="button"
              data-testid="ai-global-data-open-subscription"
              aria-label="立即开通"
              className="is-primary"
              onClick={openSubscription}
            >
              立即开通
            </button>
          </div>
        </header>

        <section className="ai-global-data-filters" aria-label="全域数据筛选条件">
          <label htmlFor={filterIds.camp}>
            <span>门店范围</span>
            <select
              id={filterIds.camp}
              aria-label="门店范围"
              value={filters.campId}
              onChange={(event) => updateFilter('campId', event.target.value)}
            >
              {filterOptions.camps.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={filterIds.channel}>
            <span>渠道视图</span>
            <select
              id={filterIds.channel}
              aria-label="渠道视图"
              value={filters.channel}
              onChange={(event) => updateFilter('channel', event.target.value as AiGlobalDataChannel)}
            >
              {filterOptions.channels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor={filterIds.attention}>
            <span>关注级别</span>
            <select
              id={filterIds.attention}
              aria-label="关注级别"
              value={filters.attention}
              onChange={(event) => updateFilter('attention', event.target.value as AiGlobalDataAttention)}
            >
              {filterOptions.attentions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="is-wide" htmlFor={filterIds.roomKeyword}>
            <span>房型关键字</span>
            <input
              id={filterIds.roomKeyword}
              aria-label="房型关键字"
              value={filters.roomKeyword}
              placeholder="房型 / 渠道关键词"
              onChange={(event) => updateFilter('roomKeyword', event.target.value)}
            />
          </label>
          <div className="ai-global-data-filters__actions">
            <button type="button" aria-label="查询" className="is-primary" onClick={submitFilters} disabled={isLoading}>
              查询
            </button>
            <button type="button" aria-label="重置" onClick={resetFilters} disabled={isLoading}>
              重置
            </button>
          </div>
        </section>

        <div className="ai-global-data-feedback" role="status" aria-label="全域数据操作反馈">
          {isLoading ? '全域数据加载中' : feedback}
        </div>

        <pre data-testid="ai-global-data-contract" className="ai-global-data-contract">
          {contractText}
        </pre>

        {errorMessage ? (
          <section className="ai-global-data-error" role="alert">
            <strong>全域数据加载失败</strong>
            <p>{errorMessage}</p>
            <button type="button" aria-label="重新加载" onClick={refreshDashboard}>
              重新加载
            </button>
          </section>
        ) : null}

        {viewModel ? (
          <>
            {viewModel.isEmpty ? (
              <section className="ai-global-data-empty" aria-label="全域数据空态">
                <strong>当前筛选条件下暂无经营数据</strong>
                <p>可以调整门店、渠道或关注级别后再次查询，也可以先前往配置中心检查连接器状态。</p>
              </section>
            ) : null}

            <section className="ai-global-data-summary" aria-label="全域经营指标">
              {viewModel.summary.map((metric) => (
                <button
                  key={metric.id}
                  type="button"
                  className={`ai-global-data-summary-card is-${metric.tone}`}
                  onClick={() => setDialog({ type: 'metric', metric })}
                >
                  <span>{metric.label}</span>
                  <strong>
                    {metric.value}
                    <em>{metric.unit}</em>
                  </strong>
                  <small>{metric.description}</small>
                </button>
              ))}
            </section>

            <div className="ai-global-data-grid">
              <section className="ai-global-data-card" aria-label="强提醒列表">
                <header>
                  <div>
                    <h2>强提醒列表</h2>
                    <p>待处理提醒</p>
                  </div>
                </header>
                {reminders.length > 0 ? (
                  <div className="ai-global-data-reminders">
                    {reminders.map((reminder) => (
                      <article key={reminder.id} className={`ai-global-data-reminder is-${reminder.level}`}>
                        <div>
                          <strong>{reminder.title}</strong>
                          <span>
                            {reminder.guestName} · {reminder.roomName}
                          </span>
                          <small>
                            {reminder.orderNo} · {reminder.dueAt} · {statusText(reminder.status)}
                          </small>
                        </div>
                        <p>{reminder.summary}</p>
                        <div className="ai-global-data-reminder__actions">
                          <button type="button" aria-label="查看订单" onClick={() => openReminderTarget(reminder)}>
                            查看订单
                          </button>
                          <button
                            type="button"
                            aria-label="稍后提醒"
                            onClick={() => postponeReminder(reminder)}
                            disabled={reminder.status !== 'pending'}
                          >
                            稍后提醒
                          </button>
                          <button
                            type="button"
                            aria-label="标记完成"
                            onClick={() => resolveReminder(reminder)}
                            disabled={reminder.status === 'resolved'}
                          >
                            标记完成
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <InlineEmpty text="当前没有待跟进的强提醒。" />
                )}
              </section>

              <section className="ai-global-data-card" aria-label="渠道接入状态">
                <header>
                  <div>
                    <h2>渠道接入状态</h2>
                    <p>连接器与授权健康度</p>
                  </div>
                </header>
                {viewModel.stores.length > 0 ? (
                  <div className="ai-global-data-stores">
                    {viewModel.stores.map((store) => (
                      <article key={store.id}>
                        <div>
                          <strong>{store.name}</strong>
                          <span>{store.authorizedChannels.join(' / ') || '待配置渠道'}</span>
                        </div>
                        <div className="ai-global-data-store-tags">
                          <b className={`is-${store.connectorStatus}`}>{connectorText(store.connectorStatus)}</b>
                          <small>{radarText(store.radarStatus)}</small>
                        </div>
                        <footer>
                          <span>{store.updatedAt}</span>
                          <button type="button" aria-label="查看配置" onClick={() => navigate('/channels/globalRadar/globalSetting')}>
                            查看配置
                          </button>
                        </footer>
                      </article>
                    ))}
                  </div>
                ) : (
                  <InlineEmpty text="当前门店还没有接入连接器状态数据。" />
                )}
              </section>
            </div>

            <div className="ai-global-data-grid">
              <section className="ai-global-data-card" aria-label="经营节奏">
                <header>
                  <div>
                    <h2>经营节奏</h2>
                    <p>按关键经营动作聚合的今日节奏分布</p>
                  </div>
                </header>
                <div className="ai-global-data-trend">
                  {viewModel.trend.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`ai-global-data-trend__item is-${item.tone}`}
                      onClick={() => {
                        const metric = viewModel.summary.find((summaryItem) => summaryItem.id === item.id)
                        if (metric) setDialog({ type: 'metric', metric })
                      }}
                    >
                      <span>{item.label}</span>
                      <i style={{ height: `${Math.max(18, item.value * 6)}px` }} />
                      <strong>{item.value}</strong>
                      <small>{item.caption}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="ai-global-data-card">
                <header>
                  <div>
                    <h2>快捷入口</h2>
                    <p>统一复用项目已有业务路由</p>
                  </div>
                </header>
                <div className="ai-global-data-quick-links">
                  {viewModel.quickLinks.map((link) => (
                    <button key={link.path} type="button" aria-label={link.label} onClick={() => navigate(link.path)}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <section className="ai-global-data-card" aria-label="房型经营看板">
              <header>
                <div>
                  <h2>房型经营看板</h2>
                  <p>房型经营数据来自房型契约、渠道契约和经营提醒统一适配。</p>
                </div>
              </header>
              {viewModel.roomCategories.length > 0 ? (
                <div className="ai-global-data-table">
                  <div className="ai-global-data-table__head">
                    <div>房型</div>
                    <div>库存 / 在住</div>
                    <div>基础价</div>
                    <div>周末价</div>
                    <div>节假日价</div>
                    <div>入住率</div>
                    <div>待处理</div>
                    <div>操作</div>
                  </div>
                  {viewModel.roomCategories.map((room) => (
                    <div key={room.id} className="ai-global-data-table__row">
                      <div>
                        <strong>{room.name}</strong>
                        <span>
                          {room.city} · {channelNames(room.channels)}
                        </span>
                      </div>
                      <div>
                        {room.inventory} / {room.staying}
                      </div>
                      <div>￥{room.basePrice}</div>
                      <div>￥{room.weekendPrice}</div>
                      <div>￥{room.holidayPrice}</div>
                      <div>{room.occupancyRate}%</div>
                      <div>
                        <b className={`is-${room.riskLevel}`}>{room.pendingOrders} 单</b>
                      </div>
                      <div className="ai-global-data-table__actions">
                        <button type="button" aria-label="房态" onClick={() => navigate('/houseManage/months')}>
                          房态
                        </button>
                        <button type="button" aria-label="查看详情" onClick={() => void openRoomDetail(room)}>
                          查看详情
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <InlineEmpty text="当前筛选条件下没有匹配的房型经营数据。" />
              )}
            </section>

            <section className="ai-global-data-subscription">
              <div>
                <p>{viewModel.subscription.editionName}</p>
                <h2>{viewModel.subscription.title}</h2>
                <span>{viewModel.subscription.priceText}</span>
                <p>{viewModel.subscription.description}</p>
              </div>
              <div>
                <strong>{viewModel.subscription.connectorProgress}</strong>
                <small>支付方式：{viewModel.subscription.paymentHint}</small>
                <button
                  type="button"
                  data-testid="ai-global-data-subscription-cta"
                  aria-label={viewModel.subscription.actionText}
                  className="is-primary"
                  onClick={openSubscription}
                >
                  {viewModel.subscription.actionText}
                </button>
              </div>
            </section>
          </>
        ) : null}
      </section>

      {dialog ? <AiGlobalDialog dialog={dialog} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function AiGlobalDialog({ dialog, onClose }: { dialog: NonNullable<DialogState>; onClose: () => void }) {
  if (dialog.type === 'metric') {
    return (
      <DialogFrame title="指标详情" closeLabel="关闭指标详情" onClose={onClose}>
        <div className="ai-global-data-dialog-list">
          {dialog.metric.detailLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </DialogFrame>
    )
  }

  return (
    <DialogFrame title="房型经营详情" closeLabel="关闭房型经营详情" onClose={onClose}>
      <dl className="ai-global-data-room-detail">
        <div>
          <dt>房型</dt>
          <dd>{dialog.detail.roomName}</dd>
        </div>
        <div>
          <dt>库存 / 在住</dt>
          <dd>
            {dialog.detail.inventory} / {dialog.detail.staying}
          </dd>
        </div>
        <div>
          <dt>入住率</dt>
          <dd>{dialog.detail.occupancyRate}%</dd>
        </div>
        <div>
          <dt>待处理订单</dt>
          <dd>{dialog.detail.pendingOrders} 单</dd>
        </div>
      </dl>
      <div className="ai-global-data-dialog-section">
        <h3>渠道价格</h3>
        <ul>
          {dialog.detail.channelPrices.map((item) => (
            <li key={item.label}>
              <strong>{item.label}</strong>
              <span>￥{item.price}</span>
              <small>{item.status}</small>
            </li>
          ))}
        </ul>
      </div>
      <div className="ai-global-data-dialog-section">
        <h3>跟进建议</h3>
        <ul>
          {dialog.detail.guidance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </DialogFrame>
  )
}

function DialogFrame({
  title,
  closeLabel,
  children,
  onClose,
}: {
  title: string
  closeLabel: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="ai-global-data-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="ai-global-data-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="ai-global-data-modal__body">{children}</div>
      </section>
    </div>
  )
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <div className="ai-global-data-inline-empty">
      <strong>暂无数据</strong>
      <p>{text}</p>
    </div>
  )
}

function statusText(status: AiGlobalReminder['status']) {
  if (status === 'postponed') return '已延后'
  if (status === 'resolved') return '已处理'
  return '待处理'
}

function connectorText(status: AiGlobalDataViewModel['stores'][number]['connectorStatus']) {
  if (status === 'warning') return '连接器延迟'
  if (status === 'offline') return '离线'
  return '在线'
}

function radarText(status: AiGlobalDataViewModel['stores'][number]['radarStatus']) {
  if (status === 'delay') return '采集延迟'
  if (status === 'setup') return '配置中'
  return '采集中'
}

function channelNames(channels: AiGlobalRoomRow['channels']) {
  if (channels.length === 0) return '未接渠道'
  return channels.map((item) => (item === 'ctrip' ? '携程酒店' : '美团酒店')).join(' / ')
}
