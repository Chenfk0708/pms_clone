import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createCustomerAddBatchExportTask,
  createCustomerAddBatchMarkTask,
  createCustomerAddBatchSmsTask,
  fetchCustomerAddBatchDashboard,
  getDefaultCustomerAddBatchQuery,
  resolveCustomerAddBatchRuntimeConfig,
  type CustomerAddBatchCandidate,
  type CustomerAddBatchMetric,
  type CustomerAddBatchQuery,
  type CustomerAddBatchTask,
  type CustomerAddBatchViewModel,
} from '../services/customerAddBatch'
import './CustomerAddBatchPage.css'

const assetBase = '/scrm-add-batch-assets'

const detailImages = [
  {
    src: `${assetBase}/brandPromotionScrm1136.png`,
    alt: '企微SCRM高效获客留存',
  },
  {
    src: `${assetBase}/brandPromotionScrm1136-2.png`,
    alt: '全自动留存用户',
  },
  {
    src: `${assetBase}/brandPromotionScrm1136-3.png`,
    alt: '高效沟通工具',
  },
]

type SelectKey = 'storeId' | 'channel' | 'friendStatus'
type DetailDialog =
  | { type: 'metric'; metric: CustomerAddBatchMetric }
  | { type: 'candidate'; candidate: CustomerAddBatchCandidate }
  | { type: 'task'; task: CustomerAddBatchTask }
  | null

export function CustomerAddBatchPage() {
  const navigate = useNavigate()
  const runtimeConfig = useMemo(() => resolveCustomerAddBatchRuntimeConfig(window.location), [])
  const [query, setQuery] = useState<CustomerAddBatchQuery>(() => getDefaultCustomerAddBatchQuery(runtimeConfig))
  const [viewModel, setViewModel] = useState<CustomerAddBatchViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('批量加好友看板已加载')
  const [openSelect, setOpenSelect] = useState<SelectKey | null>(null)
  const [dialog, setDialog] = useState<DetailDialog>(null)
  const [sentIds, setSentIds] = useState<Set<string>>(() => new Set())
  const [markedIds, setMarkedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    fetchCustomerAddBatchDashboard(query, controller.signal)
      .then((result) => {
        setViewModel(result)
        setErrorMessage('')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setViewModel(null)
        setErrorMessage(error instanceof Error ? error.message : '批量加好友数据加载失败，请重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query])

  const storeName = viewModel?.storeOptions.find((option) => option.value === query.storeId)?.label ?? '全部门店'
  const channelName = viewModel?.channelOptions.find((option) => option.value === query.channel)?.label ?? '全部渠道'
  const statusName = viewModel?.statusOptions.find((option) => option.value === query.friendStatus)?.label ?? '全部状态'

  function openSubscribeDetail() {
    navigate(viewModel?.routeTargets.paymentDetail ?? '/version/applicationPayment/detail', { state: { product: 'scrm' } })
  }

  function updateQuery(next: Partial<CustomerAddBatchQuery>, message: string) {
    setQuery((current) => ({ ...current, ...next, page: 1 }))
    setOpenSelect(null)
    setNotice(message)
  }

  function runSearch() {
    setQuery((current) => ({ ...current }))
    setNotice('已按当前条件刷新批量加好友数据')
  }

  function resetFilters() {
    setQuery(getDefaultCustomerAddBatchQuery(runtimeConfig))
    setOpenSelect(null)
    setDialog(null)
    setNotice('筛选条件已重置')
  }

  function refreshDashboard() {
    setQuery((current) => ({ ...current }))
    setNotice('已刷新批量加好友看板')
  }

  function exportDashboard() {
    createCustomerAddBatchExportTask(query)
    setNotice('已生成批量加好友导出任务')
  }

  function sendSms(candidate: CustomerAddBatchCandidate) {
    createCustomerAddBatchSmsTask(candidate, query)
    setSentIds((current) => new Set(current).add(candidate.id))
    setNotice(`加好友短信已下发：${candidate.customerName}`)
  }

  function markAdded(candidate: CustomerAddBatchCandidate) {
    createCustomerAddBatchMarkTask(candidate, query)
    setMarkedIds((current) => new Set(current).add(candidate.id))
    setNotice(`已标记为企微好友：${candidate.customerName}`)
  }

  const candidates = (viewModel?.candidates ?? []).map((candidate) => ({
    ...candidate,
    friendStatus: markedIds.has(candidate.id) ? '已添加' : candidate.friendStatus,
    smsStatus: sentIds.has(candidate.id) ? '已发送' : candidate.smsStatus,
  }))

  return (
    <div
      className="customer-add-batch-page"
      data-provider={viewModel?.provider ?? query.provider ?? 'mock'}
      data-response-state={viewModel?.state ?? query.mockState ?? 'success'}
      data-request-store={query.storeId}
      data-request-channel={query.channel}
      data-request-status={query.friendStatus}
      data-request-date-start={query.dateStart}
      data-request-date-end={query.dateEnd}
    >
      <section className="customer-add-batch-shell">
        <header className="customer-add-batch-hero">
          <div className="customer-add-batch-intro">
            <img src={`${assetBase}/brandScrmLogo.png`} alt="" aria-hidden="true" />
            <div>
              <h1>企微SCRM-批量加好友</h1>
              <p>{viewModel?.subscription.description ?? '客户下单后获取到客户手机号，可引导客户添加企业微信。'}</p>
            </div>
          </div>
          <div className="customer-add-batch-actions">
            <span>{viewModel?.subscription.priceText ?? '限时免费'}</span>
            <button type="button" onClick={openSubscribeDetail}>
              {viewModel?.subscription.actionText ?? '立即开通'}
            </button>
          </div>
        </header>

        <section className="customer-add-batch-query" aria-label="批量加好友筛选">
          <div className="customer-add-batch-field">
            <span>门店:</span>
            <SelectButton
              label="门店"
              value={storeName}
              isOpen={openSelect === 'storeId'}
              onClick={() => setOpenSelect(openSelect === 'storeId' ? null : 'storeId')}
            />
          </div>
          <label className="customer-add-batch-field">
            <span>开始日期:</span>
            <input aria-label="开始日期" value={query.dateStart} placeholder="YYYY-MM-DD" onChange={(event) => updateQuery({ dateStart: event.target.value }, '开始日期已更新')} />
          </label>
          <label className="customer-add-batch-field">
            <span>结束日期:</span>
            <input aria-label="结束日期" value={query.dateEnd} placeholder="YYYY-MM-DD" onChange={(event) => updateQuery({ dateEnd: event.target.value }, '结束日期已更新')} />
          </label>
          <div className="customer-add-batch-field">
            <span>渠道:</span>
            <SelectButton
              label="渠道"
              value={channelName}
              isOpen={openSelect === 'channel'}
              onClick={() => setOpenSelect(openSelect === 'channel' ? null : 'channel')}
            />
          </div>
          <div className="customer-add-batch-field">
            <span>加好友状态:</span>
            <SelectButton
              label="加好友状态"
              value={statusName}
              isOpen={openSelect === 'friendStatus'}
              onClick={() => setOpenSelect(openSelect === 'friendStatus' ? null : 'friendStatus')}
            />
          </div>
          <div className="customer-add-batch-query__actions">
            <button type="button" className="is-primary" onClick={runSearch} disabled={isLoading}>
              查 询
            </button>
            <button type="button" onClick={resetFilters} disabled={isLoading}>
              重 置
            </button>
            <button type="button" onClick={refreshDashboard} disabled={isLoading}>
              刷 新
            </button>
            <button type="button" onClick={exportDashboard} disabled={!viewModel || isLoading}>
              导 出
            </button>
          </div>
          {openSelect ? (
            <SelectOptions
              options={
                openSelect === 'storeId'
                  ? (viewModel?.storeOptions ?? [])
                  : openSelect === 'channel'
                    ? (viewModel?.channelOptions ?? [])
                    : (viewModel?.statusOptions ?? [])
              }
              selected={query[openSelect]}
              onChoose={(value) => updateQuery({ [openSelect]: value }, '筛选条件已更新')}
            />
          ) : null}
        </section>

        <div className="customer-add-batch-feedback" role="status" aria-label="批量加好友操作反馈">
          {isLoading ? '正在刷新批量加好友数据' : notice}
        </div>

        {errorMessage ? (
          <section className="customer-add-batch-error" role="alert" aria-label="批量加好友数据错误">
            <strong>批量加好友数据加载失败</strong>
            <p>{errorMessage}</p>
            <button type="button" onClick={refreshDashboard}>
              重试
            </button>
          </section>
        ) : null}

        {viewModel ? (
          <>
            <section className="customer-add-batch-metrics" aria-label="批量加好友核心指标">
              {viewModel.metrics.map((metric) => (
                <button key={metric.key} type="button" className="customer-add-batch-metric" onClick={() => setDialog({ type: 'metric', metric })}>
                  <span>{metric.label}</span>
                  <strong>
                    {metric.value}
                    <em>{metric.unit}</em>
                  </strong>
                  <small>{metric.description}</small>
                </button>
              ))}
            </section>

            <div className="customer-add-batch-grid">
              <section className="customer-add-batch-panel customer-add-batch-trend" aria-label="批量转化趋势">
                <header>
                  <h2>批量转化趋势</h2>
                  <span>{viewModel.timestamp.slice(0, 10)} 更新</span>
                </header>
                {viewModel.trend.length > 0 ? (
                  <div className="customer-add-batch-bars">
                    {viewModel.trend.map((item) => (
                      <div key={item.date} className="customer-add-batch-bars__item" title={`${item.date} 触达 ${item.sent}，添加 ${item.added}`}>
                        <i style={{ height: `${Math.max(18, item.candidates * 2)}px` }} />
                        <b>{item.date}</b>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState />
                )}
              </section>

              <section className="customer-add-batch-panel customer-add-batch-routes" aria-label="快捷入口">
                <header>
                  <h2>快捷入口</h2>
                </header>
                <button type="button" onClick={() => navigate(viewModel.routeTargets.customerList)}>
                  客户列表
                </button>
                <button type="button" onClick={() => navigate(viewModel.routeTargets.staffList)}>
                  企微员工列表
                </button>
                <button type="button" onClick={() => navigate(viewModel.routeTargets.customerTag)}>
                  客户标签
                </button>
              </section>
            </div>

            <section className="customer-add-batch-panel" aria-label="候选客户列表">
              <header>
                <h2>候选客户列表</h2>
                <span>第 {viewModel.pagination.page}-{Math.min(viewModel.pagination.pageSize, viewModel.pagination.total)} 条/总共 {viewModel.pagination.total} 条</span>
              </header>
              {candidates.length > 0 ? (
                <div className="customer-add-batch-table">
                  <div className="customer-add-batch-table__head">
                    <div>客户</div>
                    <div>来源</div>
                    <div>订单/房型</div>
                    <div>状态</div>
                    <div>最近沟通</div>
                    <div>操作</div>
                  </div>
                  {candidates.map((candidate) => (
                    <div key={candidate.id} className="customer-add-batch-row">
                      <div>
                        <strong>{candidate.customerName}</strong>
                        <span>{candidate.maskedPhone}</span>
                      </div>
                      <div>{candidate.sourceChannel}</div>
                      <div>
                        <span>{candidate.orderDate}</span>
                        <span>{candidate.roomName}</span>
                      </div>
                      <div>
                        <b className={`status status-${candidate.friendStatus}`}>{candidate.friendStatus}</b>
                        <span>{candidate.smsStatus}</span>
                      </div>
                      <div>{candidate.lastMessage}</div>
                      <div className="customer-add-batch-row__actions">
                        <button type="button" onClick={() => setDialog({ type: 'candidate', candidate })}>
                          详情
                        </button>
                        <button type="button" onClick={() => sendSms(candidate)} disabled={candidate.friendStatus === '已添加'}>
                          下发短信
                        </button>
                        <button type="button" onClick={() => markAdded(candidate)} disabled={candidate.friendStatus === '已添加'}>
                          标记已添加
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </section>

            <section className="customer-add-batch-panel" aria-label="批量任务列表">
              <header>
                <h2>批量任务列表</h2>
              </header>
              {viewModel.tasks.length > 0 ? (
                <div className="customer-add-batch-task-list">
                  {viewModel.tasks.map((task) => (
                    <article key={task.id}>
                      <div>
                        <strong>{task.name}</strong>
                        <span>{task.scope}</span>
                      </div>
                      <p>
                        <b>{task.status}</b>，触达 {task.sentCount}/{task.targetCount}，已添加 {task.addedCount}
                      </p>
                      <button type="button" onClick={() => setDialog({ type: 'task', task })}>
                        查看任务
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </section>

            <section className="customer-add-batch-detail" aria-label="商品详情">
              <h2>商品详情</h2>
              <div className="customer-add-batch-images">
                {detailImages.map((image) => (
                  <img key={image.src} src={image.src} alt={image.alt} />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>

      {dialog ? <DetailDialog dialog={dialog} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function SelectButton({
  label,
  value,
  isOpen,
  onClick,
}: {
  label: string
  value: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="customer-add-batch-select" aria-haspopup="listbox" aria-expanded={isOpen} onClick={onClick}>
      {label} {value}
    </button>
  )
}

function SelectOptions({
  options,
  selected,
  onChoose,
}: {
  options: Array<{ label: string; value: string }>
  selected: string
  onChoose: (value: string) => void
}) {
  return (
    <div className="customer-add-batch-options" role="listbox">
      {options.map((option) => (
        <button key={`${option.label}-${option.value}`} type="button" role="option" aria-selected={selected === option.value} onClick={() => onChoose(option.value)}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="customer-add-batch-empty">
      <strong>暂无可触达客户</strong>
      <p>当前筛选条件下没有待加好友客户，请调整条件后重新查询。</p>
    </div>
  )
}

function DetailDialog({ dialog, onClose }: { dialog: NonNullable<DetailDialog>; onClose: () => void }) {
  if (dialog.type === 'metric') {
    return (
      <DialogFrame title="指标详情" closeLabel="关闭指标详情" onClose={onClose}>
        <p>{dialog.metric.description}</p>
        <p>客户手机号已脱敏，仅用于运营触达和回归验证。</p>
      </DialogFrame>
    )
  }

  if (dialog.type === 'candidate') {
    return (
      <DialogFrame title="客户加好友详情" closeLabel="关闭客户加好友详情" onClose={onClose}>
        <dl>
          <dt>客户</dt>
          <dd>{dialog.candidate.customerName}</dd>
          <dt>手机号</dt>
          <dd>{dialog.candidate.maskedPhone}</dd>
          <dt>推荐话术</dt>
          <dd>{dialog.candidate.suggestion}</dd>
        </dl>
      </DialogFrame>
    )
  }

  return (
    <DialogFrame title="批量任务详情" closeLabel="关闭批量任务详情" onClose={onClose}>
      <dl>
        <dt>任务名称</dt>
        <dd>{dialog.task.name}</dd>
        <dt>任务进度</dt>
        <dd>
          已触达 {dialog.task.sentCount}/{dialog.task.targetCount}，已添加 {dialog.task.addedCount}
        </dd>
        <dt>负责人</dt>
        <dd>{dialog.task.owner}</dd>
      </dl>
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
    <div className="customer-add-batch-modal-backdrop">
      <section className="customer-add-batch-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-add-batch-modal__body">{children}</div>
      </section>
    </div>
  )
}
