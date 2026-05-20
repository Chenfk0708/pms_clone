import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loadCustomerMarketingData,
  type CustomerMarketingCampaign,
  type CustomerMarketingData,
  type CustomerMarketingLead,
  type CustomerMarketingMetric,
  type CustomerMarketingQuery,
  type CustomerMarketingTodo,
} from '../services/customerMarketing'
import './CustomerMarketingPage.css'

const defaultQuery: CustomerMarketingQuery = {
  date: '2026-05-18',
  storeId: 'all',
  channel: 'all',
  stage: 'all',
  keyword: '',
  page: 1,
  pageSize: 20,
}

const statusText: Record<CustomerMarketingCampaign['status'], string> = {
  running: '进行中',
  scheduled: '待执行',
  paused: '已暂停',
}

export function CustomerMarketingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState<CustomerMarketingQuery>(defaultQuery)
  const [keywordDraft, setKeywordDraft] = useState('')
  const [reloadSeq, setReloadSeq] = useState(0)
  const [data, setData] = useState<CustomerMarketingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedMetric, setSelectedMetric] = useState<CustomerMarketingMetric | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<CustomerMarketingCampaign | null>(null)
  const [selectedLead, setSelectedLead] = useState<CustomerMarketingLead | null>(null)
  const [activeFunnel, setActiveFunnel] = useState('触达客户')

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setError('')
      try {
        const result = await loadCustomerMarketingData(query, signal)
        setData(result)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : '客户营销数据加载失败，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    },
    [query],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void fetchData(controller.signal)
      }
    })
    return () => controller.abort()
  }, [fetchData, reloadSeq])

  function updateQuery(patch: Partial<CustomerMarketingQuery>) {
    setQuery((current) => ({ ...current, ...patch, page: patch.page ?? 1 }))
  }

  function submitQuery() {
    updateQuery({ keyword: keywordDraft.trim() })
    setNotice('查询条件已应用')
  }

  function resetQuery() {
    setKeywordDraft('')
    setQuery(defaultQuery)
    setNotice('筛选条件已重置')
  }

  function refreshData(message = '数据已刷新') {
    setNotice(message)
    setReloadSeq((current) => current + 1)
  }

  const hasRows = Boolean(data?.campaigns.length || data?.leads.list.length || data?.todos.length)

  return (
    <div className="customer-marketing-page">
      <header className="customer-marketing-header">
        <div>
          <h1>客户营销</h1>
          <p>围绕企微私域、优惠券和订单客户，跟踪触达、转化与待跟进任务。</p>
        </div>
        <span aria-label="客户营销数据状态" className={`customer-marketing-state ${error ? 'is-error' : ''}`}>
          {isLoading ? '数据加载中' : error ? '数据加载失败' : hasRows ? '数据已更新' : '当前条件暂无数据'}
        </span>
      </header>

      <section className="customer-marketing-filters" aria-label="客户营销筛选">
        <label>
          <span>日期</span>
          <input
            type="date"
            aria-label="营销日期"
            value={query.date}
            onChange={(event) => updateQuery({ date: event.target.value })}
          />
        </label>
        <label>
          <span>门店</span>
          <select aria-label="门店" value={query.storeId} onChange={(event) => updateQuery({ storeId: event.target.value })}>
            {(data?.filters.stores ?? [{ id: 'all', name: '全部门店' }]).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>渠道</span>
          <select aria-label="营销渠道" value={query.channel} onChange={(event) => updateQuery({ channel: event.target.value })}>
            {(data?.filters.channels ?? [{ id: 'all', name: '全部渠道' }]).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>阶段</span>
          <select aria-label="营销阶段" value={query.stage} onChange={(event) => updateQuery({ stage: event.target.value })}>
            {(data?.filters.stages ?? [{ id: 'all', name: '全部阶段' }]).map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </label>
        <label className="customer-marketing-keyword">
          <span>客户</span>
          <input
            value={keywordDraft}
            placeholder="客户名/渠道/阶段"
            onChange={(event) => setKeywordDraft(event.target.value)}
          />
        </label>
        <div className="customer-marketing-actions">
          <button type="button" onClick={resetQuery} disabled={isLoading}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={submitQuery} disabled={isLoading}>
            查 询
          </button>
        </div>
      </section>

      {notice ? (
        <div className="customer-marketing-notice" role="status" aria-label="客户营销操作反馈">
          {notice}
        </div>
      ) : null}

      <div
        data-testid="customer-marketing-service-contract"
        data-provider={data?.provider ?? 'mock'}
        data-request-summary={data?.requestSummary.join(';') ?? ''}
        hidden
      />

      {error ? (
        <section className="customer-marketing-alert" role="alert" aria-label="客户营销加载失败">
          <strong>客户营销数据加载失败，请稍后重试</strong>
          <span>{error}</span>
          <button type="button" onClick={() => refreshData('已重新发起加载')}>
            重试
          </button>
        </section>
      ) : null}

      <section className="customer-marketing-toolbar" aria-label="客户营销工具栏">
        <span>更新时间：{data?.updatedAt ?? '-'}</span>
        <button type="button" onClick={() => refreshData()} disabled={isLoading}>
          刷新
        </button>
        <button type="button" onClick={() => setNotice('导出任务已创建，完成后可在任务中心查看')} disabled={isLoading || !hasRows}>
          导出
        </button>
        <button type="button" onClick={() => setNotice('批量触达任务已加入执行队列')} disabled={isLoading || !data?.leads.list.length}>
          批量触达
        </button>
      </section>

      <section className="customer-marketing-metrics" aria-label="客户营销指标">
        {(data?.metrics ?? []).map((metric) => (
          <button
            key={metric.id}
            type="button"
            className={`customer-marketing-metric is-${metric.status}`}
            onClick={() => setSelectedMetric(metric)}
          >
            <span>{metric.label}</span>
            <strong>
              {metric.value}
              <small>{metric.unit}</small>
            </strong>
            <em>{metric.trend}</em>
          </button>
        ))}
      </section>

      <main className="customer-marketing-grid">
        <section className="customer-marketing-panel customer-marketing-funnel" aria-label="客户转化漏斗">
          <div className="customer-marketing-panel__title">
            <h2>客户转化漏斗</h2>
            <div className="customer-marketing-legend" role="tablist" aria-label="漏斗阶段">
              {(data?.funnel ?? []).slice(0, 3).map((point) => (
                <button
                  key={point.label}
                  type="button"
                  role="tab"
                  aria-selected={activeFunnel === point.label}
                  className={activeFunnel === point.label ? 'is-active' : ''}
                  onClick={() => {
                    setActiveFunnel(point.label)
                    setNotice(`${point.label}已选中`)
                  }}
                >
                  {point.label}
                </button>
              ))}
            </div>
          </div>
          {data?.funnel.length ? (
            <div className="customer-marketing-bars">
              {data.funnel.map((point, index) => (
                <div key={point.label} className="customer-marketing-bar-row">
                  <span>{point.label}</span>
                  <div>
                    <i style={{ width: `${Math.max(12, 100 - index * 18)}%` }} />
                  </div>
                  <strong>{point.value}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="客户营销空态" text="暂无符合当前条件的客户营销任务" />
          )}
        </section>

        <section className="customer-marketing-panel" aria-label="营销活动">
          <div className="customer-marketing-panel__title">
            <h2>营销活动</h2>
          </div>
          <div className="customer-marketing-campaigns">
            {isLoading ? <LoadingState /> : null}
            {!isLoading && data?.campaigns.length
              ? data.campaigns.map((campaign) => (
                  <article key={campaign.id} className="customer-marketing-campaign">
                    <div>
                      <strong>{campaign.name}</strong>
                      <span>
                        {campaign.channel} · {statusText[campaign.status]} · {campaign.owner}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>目标客户</dt>
                        <dd>{campaign.audience}</dd>
                      </div>
                      <div>
                        <dt>转化率</dt>
                        <dd>{campaign.conversionRate}</dd>
                      </div>
                    </dl>
                    <button type="button" onClick={() => setSelectedCampaign(campaign)}>
                      {campaign.nextAction}
                    </button>
                  </article>
                ))
              : null}
            {!isLoading && !data?.campaigns.length ? <EmptyState label="客户营销空态" text="暂无符合当前条件的客户营销任务" /> : null}
          </div>
        </section>

        <section className="customer-marketing-panel" aria-label="待跟进任务">
          <div className="customer-marketing-panel__title">
            <h2>待跟进</h2>
          </div>
          <div className="customer-marketing-todos">
            {(data?.todos ?? []).map((todo) => (
              <TodoRow key={todo.id} todo={todo} onDone={() => setNotice(`${todo.title}跟进任务已记录`)} />
            ))}
            {!isLoading && !data?.todos.length ? <EmptyState label="客户营销空态" text="暂无符合当前条件的客户营销任务" /> : null}
          </div>
        </section>

        <section className="customer-marketing-panel customer-marketing-table-panel" aria-label="客户名单">
          <div className="customer-marketing-panel__title">
            <h2>客户名单</h2>
            <span>
              共 {data?.leads.pagination.total ?? 0} 条，当前第 {data?.leads.pagination.page ?? 1} 页
            </span>
          </div>
          <div className="customer-marketing-table" role="table" aria-label="客户营销名单">
            <div className="customer-marketing-table__head" role="row">
              {['客户', '渠道', '阶段', '最近触达', '下一步', '负责人', '操作'].map((column) => (
                <div key={column} role="columnheader">
                  {column}
                </div>
              ))}
            </div>
            {isLoading ? (
              <LoadingState />
            ) : data?.leads.list.length ? (
              data.leads.list.map((lead) => (
                <div className="customer-marketing-table__row" role="row" key={lead.id}>
                  <div role="cell">{lead.customerName}</div>
                  <div role="cell">{lead.channel}</div>
                  <div role="cell">{lead.stage}</div>
                  <div role="cell">{lead.lastTouch}</div>
                  <div role="cell">{lead.nextStep}</div>
                  <div role="cell">{lead.owner}</div>
                  <div role="cell">
                    <button type="button" onClick={() => setSelectedLead(lead)}>
                      查看详情
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState label="客户营销空态" text="暂无符合当前条件的客户营销任务" />
            )}
          </div>
          <div className="customer-marketing-pager">
            <button type="button" disabled={isLoading || (data?.leads.pagination.page ?? 1) <= 1} onClick={() => updateQuery({ page: 1 })}>
              上一页
            </button>
            <button type="button" disabled={isLoading || !data?.leads.list.length} onClick={() => setNotice('已保持当前分页条件')}>
              下一页
            </button>
          </div>
        </section>

        <section className="customer-marketing-panel" aria-label="快捷入口">
          <div className="customer-marketing-panel__title">
            <h2>快捷入口</h2>
          </div>
          <div className="customer-marketing-links">
            {(data?.quickLinks ?? []).map((link) => (
              <button key={link.path} type="button" onClick={() => navigate(link.path)}>
                {link.label}
              </button>
            ))}
          </div>
        </section>
      </main>

      {selectedMetric ? <MetricDialog metric={selectedMetric} onClose={() => setSelectedMetric(null)} /> : null}
      {selectedCampaign ? <CampaignDialog campaign={selectedCampaign} onClose={() => setSelectedCampaign(null)} /> : null}
      {selectedLead ? <LeadDialog lead={selectedLead} onClose={() => setSelectedLead(null)} /> : null}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="customer-marketing-loading" role="status">
      数据加载中
    </div>
  )
}

function EmptyState({ label, text }: { label: string; text: string }) {
  return (
    <div className="customer-marketing-empty" role="status" aria-label={label}>
      <span aria-hidden="true" />
      <strong>{text}</strong>
    </div>
  )
}

function TodoRow({ todo, onDone }: { todo: CustomerMarketingTodo; onDone: () => void }) {
  return (
    <article className="customer-marketing-todo">
      <div>
        <strong>{todo.title}</strong>
        <span>
          {todo.source} · {todo.priority} · {todo.dueText}
        </span>
      </div>
      <button type="button" onClick={onDone}>
        跟进
      </button>
    </article>
  )
}

function MetricDialog({ metric, onClose }: { metric: CustomerMarketingMetric; onClose: () => void }) {
  return (
    <div className="customer-marketing-overlay" role="dialog" aria-modal="true" aria-label="客户营销指标详情">
      <section className="customer-marketing-dialog">
        <header>
          <h2>{metric.label}</h2>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <dl>
          <div>
            <dt>当前数值</dt>
            <dd>
              {metric.value}
              {metric.unit}
            </dd>
          </div>
          <div>
            <dt>趋势</dt>
            <dd>{metric.trend}</dd>
          </div>
          <div>
            <dt>关联口径</dt>
            <dd>触达客户、有效咨询、形成订单与待跟进任务同步计算。</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function CampaignDialog({ campaign, onClose }: { campaign: CustomerMarketingCampaign; onClose: () => void }) {
  return (
    <div className="customer-marketing-overlay" role="dialog" aria-modal="true" aria-label="营销活动详情">
      <section className="customer-marketing-dialog">
        <header>
          <h2>{campaign.name}</h2>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <dl>
          <div>
            <dt>渠道</dt>
            <dd>{campaign.channel}</dd>
          </div>
          <div>
            <dt>目标客户</dt>
            <dd>{campaign.audience}</dd>
          </div>
          <div>
            <dt>转化率</dt>
            <dd>{campaign.conversionRate}</dd>
          </div>
          <div>
            <dt>负责人</dt>
            <dd>{campaign.owner}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function LeadDialog({ lead, onClose }: { lead: CustomerMarketingLead; onClose: () => void }) {
  return (
    <div className="customer-marketing-overlay" role="dialog" aria-modal="true" aria-label="客户详情">
      <section className="customer-marketing-dialog">
        <header>
          <h2>{lead.customerName}</h2>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </header>
        <dl>
          <div>
            <dt>渠道</dt>
            <dd>{lead.channel}</dd>
          </div>
          <div>
            <dt>阶段</dt>
            <dd>{lead.stage}</dd>
          </div>
          <div>
            <dt>最近触达</dt>
            <dd>{lead.lastTouch}</dd>
          </div>
          <div>
            <dt>下一步</dt>
            <dd>{lead.nextStep}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
