import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  createMemberPointsExportTask,
  defaultMemberPointsQuery,
  fetchMemberPointsDashboard,
  MemberPointsServiceError,
  type MemberPointsDashboard,
  type MemberPointsMetric,
  type MemberPointsQuery,
  type MemberPointsRecord,
  type MemberPointsSceneKey,
} from '../services/memberPoints'
import './MemberPointsPage.css'

type SeriesKey = 'issued' | 'consumed'

export function MemberPointsPage() {
  const initialQuery = useMemo(() => makeInitialQuery(), [])
  const [draft, setDraft] = useState<MemberPointsQuery>(initialQuery)
  const [query, setQuery] = useState<MemberPointsQuery>(initialQuery)
  const [dashboard, setDashboard] = useState<MemberPointsDashboard | null>(null)
  const [serviceError, setServiceError] = useState<MemberPointsServiceError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedMetric, setSelectedMetric] = useState<MemberPointsMetric | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<MemberPointsRecord | null>(null)
  const [series, setSeries] = useState<SeriesKey>('issued')

  useEffect(() => {
    document.body.classList.add('member-points-route')
    return () => document.body.classList.remove('member-points-route')
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    async function run() {
      setIsLoading(true)
      setServiceError(null)
      try {
        const nextDashboard = await fetchMemberPointsDashboard(query, controller.signal)
        setDashboard(nextDashboard)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof MemberPointsServiceError) {
          setServiceError(error)
          return
        }
        throw error
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void run()

    return () => controller.abort()
  }, [query])

  const diagnosticsState = dashboard?.state ?? serviceError?.state ?? query.state ?? 'success'
  const diagnosticsProvider = dashboard?.provider ?? serviceError?.provider ?? 'mock'
  const diagnosticsRequest = dashboard?.request ?? serviceError?.request ?? query

  function updateDraft(next: Partial<MemberPointsQuery>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function applyFilters() {
    setQuery({ ...draft, page: 1 })
    setNotice('筛选条件已应用')
  }

  function resetFilters() {
    const nextQuery = defaultMemberPointsQuery()
    setDraft(nextQuery)
    setQuery(nextQuery)
    setNotice('筛选条件已重置')
  }

  function refresh() {
    setQuery((current) => ({ ...current }))
    setNotice('数据已更新')
  }

  async function exportRecords() {
    setIsLoading(true)
    try {
      await createMemberPointsExportTask(query)
      setNotice('导出任务已创建，可在任务中心查看')
    } finally {
      setIsLoading(false)
    }
  }

  function changePage(page: number) {
    const next = { ...query, page }
    setQuery(next)
    setDraft(next)
    setNotice(`已切换到第 ${page} 页`)
  }

  const maxTrendValue = Math.max(1, ...(dashboard?.trend.map((point) => Math.max(point.issued, point.consumed)) ?? [1]))

  return (
    <div className="member-points-page">
      <h1 className="sr-only-heading">会员积分</h1>
      <output
        id="member-points-diagnostics"
        hidden
        data-provider={diagnosticsProvider}
        data-state={diagnosticsState}
        data-request={JSON.stringify(diagnosticsRequest)}
      />

      <section className="member-points-hero" aria-label="会员积分筛选">
        <div>
          <span className="member-points-kicker">SCRM / 会员中心</span>
          <h2>会员积分运营台</h2>
          <p>按门店、周期和积分场景查看积分发放、消耗、清零与会员活跃情况。</p>
        </div>
        <div className="member-points-actions">
          <button type="button" onClick={refresh} disabled={isLoading}>
            刷新
          </button>
          <button type="button" onClick={exportRecords} disabled={isLoading || !dashboard?.records.length}>
            导出
          </button>
        </div>
      </section>

      <section className="member-points-filters" aria-label="会员积分查询条件">
        <label>
          <span>门店</span>
          <select
            aria-label="门店"
            value={draft.storeId}
            onChange={(event) => {
              const store = dashboard?.stores.find((item) => item.id === event.target.value)
              updateDraft({ storeId: event.target.value, storeName: store?.name ?? draft.storeName })
            }}
          >
            {(dashboard?.stores ?? [{ id: draft.storeId, name: draft.storeName }]).map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>开始日期</span>
          <input
            aria-label="开始日期"
            type="date"
            value={draft.startDate}
            onChange={(event) => updateDraft({ startDate: event.target.value })}
          />
        </label>
        <label>
          <span>结束日期</span>
          <input
            aria-label="结束日期"
            type="date"
            value={draft.endDate}
            onChange={(event) => updateDraft({ endDate: event.target.value })}
          />
        </label>
        <label>
          <span>积分场景</span>
          <select
            aria-label="积分场景"
            value={draft.scene}
            onChange={(event) => updateDraft({ scene: event.target.value as MemberPointsSceneKey | 'all' })}
          >
            {(dashboard?.scenes ?? [{ value: 'all' as const, label: '全部场景' }]).map((sceneOption) => (
              <option key={sceneOption.value} value={sceneOption.value}>
                {sceneOption.label}
              </option>
            ))}
          </select>
        </label>
        <label className="member-points-search">
          <span>会员搜索</span>
          <input
            aria-label="会员搜索"
            value={draft.keyword}
            placeholder="姓名、手机号尾号或流水号"
            onChange={(event) => updateDraft({ keyword: event.target.value })}
          />
        </label>
        <div className="member-points-filter-actions">
          <button type="button" className="is-primary" onClick={applyFilters} disabled={isLoading}>
            查询
          </button>
          <button type="button" onClick={resetFilters} disabled={isLoading}>
            重置
          </button>
        </div>
      </section>

      {notice || isLoading ? (
        <div className="member-points-toast" role="status" aria-live="polite">
          {isLoading ? '数据加载中' : notice}
        </div>
      ) : null}

      {serviceError ? (
        <section className="member-points-alert" role="alert">
          <strong>会员积分数据加载失败</strong>
          <span>请稍后重试，或调整筛选条件后重新加载。</span>
          <button type="button" onClick={refresh}>
            重新加载
          </button>
        </section>
      ) : null}

      <section className="member-points-metrics" aria-label="会员积分核心指标">
        {(dashboard?.metrics ?? []).map((metric) => (
          <button
            key={metric.key}
            type="button"
            className={`member-points-metric is-${metric.tone}`}
            aria-label={`查看${metric.title}详情`}
            onClick={() => setSelectedMetric(metric)}
          >
            <span>{metric.title}</span>
            <strong>
              {metric.value.toLocaleString()}
              <em>{metric.unit}</em>
            </strong>
            <small>{metric.trend}</small>
          </button>
        ))}
      </section>

      <div className="member-points-main">
        <section className="member-points-chart" aria-label="积分趋势">
          <header>
            <h2>积分趋势</h2>
            <div className="member-points-legend" role="group" aria-label="趋势系列">
              <button
                type="button"
                className={series === 'issued' ? 'is-selected' : ''}
                aria-pressed={series === 'issued'}
                onClick={() => setSeries('issued')}
              >
                发放
              </button>
              <button
                type="button"
                className={series === 'consumed' ? 'is-selected' : ''}
                aria-pressed={series === 'consumed'}
                onClick={() => setSeries('consumed')}
              >
                消耗
              </button>
            </div>
          </header>
          {dashboard?.trend.length ? (
            <div className="member-points-bars">
              {dashboard.trend.map((point) => {
                const value = series === 'issued' ? point.issued : point.consumed
                return (
                  <div key={point.date} className="member-points-bar">
                    <i style={{ height: `${Math.max(8, (value / maxTrendValue) * 132)}px` }} />
                    <span>{point.date}</span>
                    <em>{value}</em>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="member-points-empty-block">当前筛选条件下暂无趋势数据</div>
          )}
        </section>

        <aside className="member-points-side" aria-label="会员积分待办与快捷入口">
          <section>
            <h2>待办提醒</h2>
            {(dashboard?.reminders ?? []).map((item) => (
              <Link key={item.id} to={item.route} className="member-points-reminder">
                <span>{item.title}</span>
                <strong>{item.count}</strong>
              </Link>
            ))}
          </section>
          <section>
            <h2>快捷入口</h2>
            {(dashboard?.shortcuts ?? []).map((item) => (
              <Link key={item.route} to={item.route} className="member-points-shortcut">
                <span>{item.label}</span>
                <small>{item.description}</small>
              </Link>
            ))}
          </section>
        </aside>
      </div>

      <section className="member-points-records">
        <header>
          <h2>积分变更记录</h2>
          <span>更新时间：{dashboard?.updatedAt ?? '2026-05-18T10:00:00+08:00'}</span>
        </header>
        <table aria-label="会员积分变更记录">
          <thead>
            <tr>
              <th>会员</th>
              <th>场景</th>
              <th>积分变动</th>
              <th>当前余额</th>
              <th>来源</th>
              <th>操作人</th>
              <th>发生时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {dashboard?.records.map((record) => (
              <tr key={record.id}>
                <td>
                  <strong>{record.memberName}</strong>
                  <span>尾号 {record.phoneSuffix}</span>
                </td>
                <td>{record.sceneLabel}</td>
                <td className={record.change >= 0 ? 'is-plus' : 'is-minus'}>
                  {record.change >= 0 ? '+' : ''}
                  {record.change}
                </td>
                <td>{record.balance}</td>
                <td>{record.source}</td>
                <td>{record.operator}</td>
                <td>{record.occurredAt}</td>
                <td>{statusLabel(record.status)}</td>
                <td>
                  <button type="button" onClick={() => setSelectedRecord(record)} aria-label={`查看流水详情 ${record.memberName}`}>
                    详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dashboard && dashboard.records.length === 0 ? (
          <div className="member-points-empty-block">当前筛选条件下暂无积分流水</div>
        ) : null}
        <footer className="member-points-pagination">
          <span>
            第 {dashboard?.pagination.page ?? query.page} 页，共 {dashboard?.pagination.total ?? 0} 条
          </span>
          <button type="button" onClick={() => changePage(Math.max(1, query.page - 1))} disabled={query.page <= 1}>
            上一页
          </button>
          <button
            type="button"
            onClick={() => changePage(query.page + 1)}
            disabled={!dashboard || query.page * query.pageSize >= dashboard.pagination.total}
          >
            下一页
          </button>
        </footer>
      </section>

      {selectedMetric ? <MetricDialog metric={selectedMetric} onClose={() => setSelectedMetric(null)} /> : null}
      {selectedRecord ? <RecordDialog record={selectedRecord} onClose={() => setSelectedRecord(null)} /> : null}
    </div>
  )
}

function makeInitialQuery(): MemberPointsQuery {
  const query = defaultMemberPointsQuery()
  const params = new URLSearchParams(window.location.search)
  const mockState = params.get('mockState')
  if (mockState === 'empty' || mockState === 'error') query.state = mockState
  return query
}

function statusLabel(status: MemberPointsRecord['status']) {
  const labels: Record<MemberPointsRecord['status'], string> = {
    completed: '已完成',
    processing: '处理中',
    reversed: '已撤销',
  }
  return labels[status]
}

function MetricDialog({ metric, onClose }: { metric: MemberPointsMetric; onClose: () => void }) {
  return (
    <div className="member-points-dialog-layer">
      <section className="member-points-dialog" role="dialog" aria-modal="true" aria-label={`${metric.title}详情`}>
        <header>
          <h2>{metric.title}详情</h2>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            ×
          </button>
        </header>
        <p>{metric.detail}</p>
        <dl>
          <div>
            <dt>当前数值</dt>
            <dd>
              {metric.value.toLocaleString()}
              {metric.unit}
            </dd>
          </div>
          <div>
            <dt>趋势说明</dt>
            <dd>{metric.trend}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function RecordDialog({ record, onClose }: { record: MemberPointsRecord; onClose: () => void }) {
  return (
    <div className="member-points-dialog-layer">
      <section className="member-points-dialog" role="dialog" aria-modal="true" aria-label="积分流水详情">
        <header>
          <h2>积分流水详情</h2>
          <button type="button" aria-label="关闭流水详情" onClick={onClose}>
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>会员</dt>
            <dd>{record.memberName}</dd>
          </div>
          <div>
            <dt>场景</dt>
            <dd>{record.sceneLabel}</dd>
          </div>
          <div>
            <dt>来源</dt>
            <dd>{record.source}</dd>
          </div>
          <div>
            <dt>备注</dt>
            <dd>{record.remark}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
