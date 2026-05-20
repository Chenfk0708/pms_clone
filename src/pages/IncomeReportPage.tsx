import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createDefaultIncomeReportQuery,
  createIncomeReportExportTask,
  fetchIncomeReportDashboard,
  type IncomeReportDashboard,
  type IncomeReportDimension,
  type IncomeReportOption,
  type IncomeReportQuery,
  type IncomeReportRow,
} from '../services/incomeReport'
import './IncomeReportPage.css'

type SelectKey = 'roomType' | 'channel' | 'roomGroup' | null

export function IncomeReportPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState(createInitialQuery)
  const [draft, setDraft] = useState(createInitialQuery)
  const [dashboard, setDashboard] = useState<IncomeReportDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [detailRow, setDetailRow] = useState<IncomeReportRow | null>(null)
  const [openSelect, setOpenSelect] = useState<SelectKey>(null)

  useEffect(() => {
    const abort = new AbortController()
    fetchIncomeReportDashboard(query, abort.signal)
      .then((nextDashboard) => {
        setDashboard(nextDashboard)
        setError('')
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : '收入报表加载失败')
      })
      .finally(() => setLoading(false))
    return () => abort.abort()
  }, [query])

  const contractText = useMemo(
    () =>
      JSON.stringify({
        provider: dashboard?.provider ?? 'mock',
        state: dashboard?.state ?? query.state,
        endpoint: dashboard?.endpoint ?? '/report/accommodation/get',
        requestBody: dashboard?.requestBody ?? null,
        pagination: dashboard?.pagination ?? null,
        traceId: dashboard?.traceId ?? null,
      }),
    [dashboard, query.state],
  )

  const dimensions = dashboard?.dimensions ?? []
  const stores = dashboard?.stores ?? []
  const roomTypes = dashboard?.roomTypes ?? []
  const channels = dashboard?.channels ?? []
  const roomGroups = dashboard?.roomGroups ?? []
  const rows = dashboard?.rows ?? []
  const isChannelDimension = query.dimension === 'channel'
  const isEmpty = !loading && !error && rows.length === 0

  function patchDraft(next: Partial<IncomeReportQuery>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function switchDimension(dimension: IncomeReportDimension) {
    const next = { ...draft, dimension, pageNum: 1 }
    setDraft(next)
    setLoading(true)
    setError('')
    setNotice('')
    setOpenSelect(null)
    setQuery(next)
  }

  function submitQuery() {
    setLoading(true)
    setError('')
    setNotice('')
    setOpenSelect(null)
    setQuery({ ...draft, pageNum: 1 })
    setNotice('收入报表已刷新')
  }

  function resetFilters() {
    const next = createDefaultIncomeReportQuery()
    next.state = query.state
    setDraft(next)
    setLoading(true)
    setError('')
    setNotice('已恢复默认筛选')
    setOpenSelect(null)
    setQuery(next)
  }

  async function handleExport() {
    const result = await createIncomeReportExportTask(query)
    setNotice(`收入报表导出任务已创建：${result.data.taskId}`)
  }

  function handleRetry() {
    setLoading(true)
    setError('')
    setNotice('')
    setQuery(createInitialQuery())
    setDraft(createInitialQuery())
  }

  return (
    <div
      className="income-report-page"
      data-provider={dashboard?.provider ?? 'mock'}
      data-state={dashboard?.state ?? query.state ?? 'success'}
    >
      <h1 className="sr-only-heading">收入报表</h1>
      <pre
        hidden
        data-testid="income-report-contract"
        data-provider={dashboard?.provider ?? 'mock'}
        data-endpoint={dashboard?.endpoint ?? '/report/accommodation/get'}
      >
        {contractText}
      </pre>

      <section className="income-report-query" aria-label="收入报表筛选">
        <div className="income-report-mode" role="group" aria-label="统计维度">
          {dimensions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={query.dimension === item.value ? 'is-active' : ''}
              aria-pressed={query.dimension === item.value}
              onClick={() => switchDimension(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="income-report-form">
          <div className="income-report-store-row" aria-label="门店">
            {stores.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={draft.storeId === item.id}
                className={draft.storeId === item.id ? 'is-active' : ''}
                onClick={() => patchDraft({ storeId: item.id, storeName: item.label })}
              >
                {item.label}
              </button>
            ))}
          </div>

          {expanded ? (
            <div className="income-report-filter-row">
              <label className="income-date-field">
                <span>开始日期</span>
                <input
                  aria-label="开始日期"
                  value={draft.startDate}
                  onChange={(event) => patchDraft({ startDate: event.target.value })}
                />
              </label>
              <label className="income-date-field">
                <span>结束日期</span>
                <input
                  aria-label="结束日期"
                  value={draft.endDate}
                  onChange={(event) => patchDraft({ endDate: event.target.value })}
                />
              </label>
              <SelectField
                label="房型"
                selectedId={draft.roomTypeId}
                selectedLabel={draft.roomTypeName}
                options={roomTypes}
                open={openSelect === 'roomType'}
                onToggle={() => setOpenSelect(openSelect === 'roomType' ? null : 'roomType')}
                onSelect={(option) => {
                  patchDraft({ roomTypeId: option.id, roomTypeName: option.id ? option.label : '' })
                  setOpenSelect(null)
                }}
              />
              <SelectField
                label="渠道"
                selectedId={draft.channelId}
                selectedLabel={draft.channelName}
                options={channels}
                open={openSelect === 'channel'}
                onToggle={() => setOpenSelect(openSelect === 'channel' ? null : 'channel')}
                onSelect={(option) => {
                  patchDraft({ channelId: option.id, channelName: option.id ? option.label : '' })
                  setOpenSelect(null)
                }}
              />
              <SelectField
                label="房型分组"
                selectedId={draft.roomGroupId}
                selectedLabel={draft.roomGroupName}
                options={roomGroups}
                open={openSelect === 'roomGroup'}
                onToggle={() => setOpenSelect(openSelect === 'roomGroup' ? null : 'roomGroup')}
                onSelect={(option) => {
                  patchDraft({ roomGroupId: option.id, roomGroupName: option.id ? option.label : '' })
                  setOpenSelect(null)
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="income-report-actions">
          <button type="button" onClick={resetFilters} disabled={loading}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={submitQuery} disabled={loading}>
            查 询
          </button>
          <button type="button" onClick={handleExport} disabled={loading || Boolean(error)}>
            导出
          </button>
          <button
            type="button"
            onClick={() => {
              setDescriptionOpen(true)
              setOpenSelect(null)
            }}
          >
            说明
          </button>
          <button type="button" className="is-link" onClick={() => setExpanded((current) => !current)}>
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      {notice ? (
        <div className="income-report-notice" role="status" aria-label="收入报表操作反馈">
          {notice}
        </div>
      ) : null}

      {error ? (
        <section className="income-report-error" role="alert" aria-label="收入报表数据错误">
          <strong>收入报表加载失败</strong>
          <p>{error}</p>
          <button type="button" onClick={handleRetry}>
            重新加载
          </button>
        </section>
      ) : null}

      {isEmpty ? (
        <section className="income-report-empty" role="status" aria-label="收入报表空态">
          <strong>当前筛选条件暂无收入数据</strong>
          <p>请切换统计维度、日期范围或门店后重新查询。</p>
        </section>
      ) : null}

      <section className={`income-report-table-wrap${loading ? ' is-loading' : ''}`} aria-label="收入报表表格">
        {loading ? <div className="income-report-loading">正在加载收入报表数据</div> : null}
        <table className={`income-report-table${isChannelDimension ? ' income-report-table--channel' : ''}`}>
          <thead>
            <tr>
              <th>{firstColumnLabel(query.dimension)}</th>
              <th>房费(减佣)</th>
              {isChannelDimension ? <th>占比</th> : null}
              <th>佣金</th>
              {isChannelDimension ? <th>占比</th> : null}
              <th>房费(含佣)</th>
              <th>其他消费</th>
              <th>订单总收入</th>
              <th>记一笔收入</th>
              <th>总营收(含佣)</th>
              <th>总营收(减佣)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.key} className={row.label === '合计' ? 'is-summary' : ''}>
                  <td>{row.label}</td>
                  <td>{row.roomFeeMinusCommission}</td>
                  {isChannelDimension ? <td>{row.roomFeeMinusCommissionRatio ?? '-'}</td> : null}
                  <td>{row.channelCommission}</td>
                  {isChannelDimension ? <td>{row.channelCommissionRatio ?? '-'}</td> : null}
                  <td>{row.roomFeeIncludingCommission}</td>
                  <td>{row.otherExpense}</td>
                  <td>{row.orderTotalIncome}</td>
                  <td>{row.manualIncome}</td>
                  <td>{row.businessIncomeIncludingCommission}</td>
                  <td>{row.businessIncomeMinusCommission}</td>
                  <td>
                    <button type="button" className="income-detail-link" onClick={() => setDetailRow(row)}>
                      下载订单明细
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="income-report-empty-cell" colSpan={isChannelDimension ? 12 : 10}>
                  暂无数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {dashboard ? (
        <nav className="income-report-pagination" aria-label="分页">
          <span>{paginationText(dashboard.pagination.page, dashboard.pagination.pageSize, dashboard.pagination.total)}</span>
          <button type="button" disabled>
            ‹
          </button>
          <button type="button" className="is-current">
            {dashboard.pagination.page}
          </button>
          <button type="button" disabled>
            ›
          </button>
          <button type="button">{dashboard.pagination.pageSize} 条/页</button>
        </nav>
      ) : null}

      {descriptionOpen ? (
        <div className="income-modal-backdrop" role="presentation" onClick={() => setDescriptionOpen(false)}>
          <section
            className="income-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="报表字段说明"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>报表字段说明</h2>
              <button type="button" aria-label="关闭报表字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="income-description-list">
              {(dashboard?.descriptions ?? []).map((item) => (
                <div key={item.field} className="income-description-row">
                  <strong>{item.field}</strong>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {detailRow ? (
        <div className="income-modal-backdrop" role="presentation" onClick={() => setDetailRow(null)}>
          <section
            className="income-dialog income-dialog--detail"
            role="dialog"
            aria-modal="true"
            aria-label="订单明细下载任务"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>订单明细下载任务</h2>
              <button type="button" aria-label="关闭订单明细下载任务" onClick={() => setDetailRow(null)}>
                ×
              </button>
            </header>
            <div className="income-detail-body">
              <p>已为当前行生成下载任务，以下为任务摘要：</p>
              <dl>
                <div>
                  <dt>统计项</dt>
                  <dd>{detailRow.label}</dd>
                </div>
                <div>
                  <dt>业务上下文</dt>
                  <dd>{detailRow.detailContext}</dd>
                </div>
                <div>
                  <dt>总营收(减佣)</dt>
                  <dd>{detailRow.businessIncomeMinusCommission}</dd>
                </div>
              </dl>
            </div>
            <footer>
              <button type="button" onClick={() => setDetailRow(null)}>
                关闭
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  setDetailRow(null)
                  navigate('/statistics/orderLedger')
                }}
              >
                查看收支明细
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function SelectField({
  label,
  selectedId,
  selectedLabel,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string
  selectedId: string
  selectedLabel: string
  options: IncomeReportOption[]
  open: boolean
  onToggle: () => void
  onSelect: (option: IncomeReportOption) => void
}) {
  const displayLabel = selectedId && selectedLabel ? selectedLabel : '请选择'
  const selectableOptions = options.filter((item) => item.id !== undefined)

  return (
    <label className="income-select-field">
      <span>{label}</span>
      <div className="income-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label} ${displayLabel}`} onClick={onToggle}>
          {displayLabel}
        </button>
        {open ? (
          <div className="income-options" role="listbox" aria-label={`${label}选项`}>
            {selectableOptions.map((option) => (
              <button
                key={`${label}-${option.id}-${option.label}`}
                type="button"
                role="option"
                aria-selected={selectedId === option.id}
                onClick={() => onSelect(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  )
}

function createInitialQuery() {
  if (typeof window === 'undefined') return createDefaultIncomeReportQuery()
  const defaults = createDefaultIncomeReportQuery()
  const state = window.localStorage.getItem('pms.incomeReport.state')
  defaults.state = state === 'empty' || state === 'error' ? state : 'success'
  return defaults
}

function firstColumnLabel(dimension: IncomeReportDimension) {
  if (dimension === 'month') return '月份'
  if (dimension === 'store') return '门店'
  if (dimension === 'channel') return '渠道'
  if (dimension === 'roomType') return '房型'
  if (dimension === 'room') return '房间'
  if (dimension === 'checkout') return '退房时间'
  return '日期'
}

function paginationText(page: number, pageSize: number, total: number) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return `第 ${start}-${end} 条/总共 ${total} 条`
}
