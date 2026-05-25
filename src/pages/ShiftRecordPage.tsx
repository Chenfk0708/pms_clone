import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  buildShiftRecordRequest,
  createDefaultShiftRecordFilters,
  exportShiftRecords,
  fetchShiftRecordDashboard,
  type ShiftRecordDashboard,
  type ShiftRecordFilters,
  type ShiftRecordOption,
  type ShiftRecordRow,
} from '../services/shiftRecord'
import './ShiftRecordPage.css'

type LoadReason = 'initial' | 'query' | 'reset' | 'retry'

export function ShiftRecordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialFilters = useMemo(() => createDefaultShiftRecordFilters(new URLSearchParams(location.search)), [location.search])
  const [filters, setFilters] = useState<ShiftRecordFilters>(initialFilters)
  const [dashboard, setDashboard] = useState<ShiftRecordDashboard | null>(null)
  const [submittedFilters, setSubmittedFilters] = useState<ShiftRecordFilters>(initialFilters)
  const [selectedDetail, setSelectedDetail] = useState<ShiftRecordRow | null>(null)
  const [feedback, setFeedback] = useState('交接班记录加载中')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportAudit, setExportAudit] = useState<string[]>([])

  const loadDashboard = useCallback(async (nextFilters: ShiftRecordFilters, reason: LoadReason) => {
    setIsLoading(true)
    setError('')
    setSelectedDetail(null)
    setExportAudit([])
    setSubmittedFilters(nextFilters)
    setFeedback(reason === 'retry' ? '正在重新加载交接班记录' : '交接班记录加载中')

    try {
      const nextDashboard = await fetchShiftRecordDashboard(nextFilters)
      setDashboard(nextDashboard)
      setFeedback(resolveFeedback(reason, nextDashboard.rows.length))
    } catch (loadError) {
      setDashboard(null)
      setFeedback('')
      setError(loadError instanceof Error ? loadError.message : '交接班记录加载失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard(initialFilters, 'initial')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialFilters, loadDashboard])

  const serviceContract = useMemo(() => {
    const parts = [...(dashboard?.audit ?? []), ...exportAudit]
    return parts.join(';')
  }, [dashboard?.audit, exportAudit])

  const stores = dashboard?.stores ?? fallbackStores()
  const employees = dashboard?.employees ?? fallbackEmployees()
  const rows = dashboard?.rows ?? []
  const canExport = Boolean(dashboard && rows.length > 0 && !error && !isLoading && !isExporting)
  const request = buildShiftRecordRequest(submittedFilters)

  function updateFilter<K extends keyof ShiftRecordFilters>(key: K, value: ShiftRecordFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadDashboard(filters, 'query')
  }

  function handleReset() {
    const nextFilters = createDefaultShiftRecordFilters(new URLSearchParams(location.search))
    setFilters(nextFilters)
    void loadDashboard(nextFilters, 'reset')
  }

  async function handleExport() {
    setIsExporting(true)
    setError('')
    setFeedback('正在创建交接班导出任务')
    try {
      const result = await exportShiftRecords(submittedFilters)
      setExportAudit(result.audit)
      setFeedback('交接班导出任务已创建')
    } catch (exportError) {
      setFeedback('')
      setError(exportError instanceof Error ? exportError.message : '交接班导出任务创建失败，请稍后重试')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="shift-record-page">
      <h1 className="sr-only-heading">交接班</h1>
      <div className="sr-only-heading" aria-label="交接班数据服务">
        {serviceContract}
      </div>

      <div className="sr-only-heading" role="status">
        {feedback}
      </div>
      {/*
      <header className="shift-record-header">
        <div>
          <h2>交接班记录</h2>
          <p>按门店、时间和交接班人追踪班次交接结果，核对备注与系统生成记录。</p>
        </div>
        <div role="status" aria-label="交接班操作反馈" className="shift-record-feedback">
          {feedback}
        </div>
      </header>
      */}

      <form className="shift-record-query" aria-label="交接班筛选" onSubmit={handleSubmit}>
        <label>
          <span>开始日期</span>
          <input
            aria-label="开始日期"
            type="date"
            value={filters.startDate}
            disabled={isLoading}
            onChange={(event) => updateFilter('startDate', event.target.value)}
          />
        </label>

        <label>
          <span>结束日期</span>
          <input
            aria-label="结束日期"
            type="date"
            value={filters.endDate}
            disabled={isLoading}
            onChange={(event) => updateFilter('endDate', event.target.value)}
          />
        </label>

        <label>
          <span>门店</span>
          <select
            aria-label="门店"
            value={filters.storeId}
            disabled={isLoading}
            onChange={(event) => updateFilter('storeId', event.target.value)}
          >
            {stores.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>交班人</span>
          <select
            aria-label="交班人"
            value={filters.handoverUserId}
            disabled={isLoading}
            onChange={(event) => updateFilter('handoverUserId', event.target.value)}
          >
            {employees.map((option) => (
              <option key={`handover-${option.value}`} value={option.value}>
                {resolveEmployeeLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>接班人</span>
          <select
            aria-label="接班人"
            value={filters.receiverUserId}
            disabled={isLoading}
            onChange={(event) => updateFilter('receiverUserId', event.target.value)}
          >
            {employees.map((option) => (
              <option key={`receiver-${option.value}`} value={option.value}>
                {resolveEmployeeLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <div className="shift-record-actions">
          <button type="submit" className="is-primary" disabled={isLoading || isExporting}>
            查询
          </button>
          <button type="button" disabled={isLoading || isExporting} onClick={handleReset}>
            重置
          </button>
          <button type="button" disabled={!canExport} onClick={handleExport}>
            导出
          </button>
          <button type="button" className="is-setting" disabled={isLoading || isExporting} onClick={() => navigate('/setting/shiftSetting')}>
            设 置
          </button>
        </div>
      </form>

      <section className="shift-record-current" aria-label="当前筛选条件">
        <span>{resolveOptionLabel(stores, submittedFilters.storeId, '全部门店')}</span>
        <span>{submittedFilters.startDate || '开始日期不限'}</span>
        <span>{submittedFilters.endDate || '结束日期不限'}</span>
        <span>{resolveEmployeeFilterLabel(employees, submittedFilters.handoverUserId, '全部交班人')}</span>
        <span>{resolveEmployeeFilterLabel(employees, submittedFilters.receiverUserId, '全部接班人')}</span>
        <span>第 {request.pageNum} 页</span>
      </section>

      {error ? (
        <section className="shift-record-error" role="alert" aria-label="交接班数据错误">
          <strong>交接班数据异常</strong>
          <span>{error}</span>
          <button type="button" onClick={() => void loadDashboard(submittedFilters, 'retry')}>
            重试
          </button>
        </section>
      ) : null}

      <section className="shift-record-table-wrap" aria-label="交接班表格">
        <header className="shift-record-table-caption">
          <strong>共 {dashboard?.pagination.total ?? 0} 条交接记录</strong>
          <span>
            当前请求：{request.campId} / pageSize {request.pageSize}
          </span>
        </header>

        <div className="shift-record-table-scroll">
          <table className="shift-record-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} data-testid="shift-record-row">
                    <td>{row.handoverDate}</td>
                    <td>{row.shiftName}</td>
                    <td>{row.handoverUserName}</td>
                    <td>{row.handoverTime}</td>
                    <td>{row.receiverUserName}</td>
                    <td>{row.receiverTime}</td>
                    <td>
                      <span className={`shift-record-status ${row.workStatus === 1 ? 'is-complete' : 'is-review'}`}>{row.status}</span>
                    </td>
                    <td>{row.handoverRemark}</td>
                    <td>{row.receiverRemark}</td>
                    <td>{row.systemGeneratedAt}</td>
                    <td>
                      <button type="button" aria-label={`查看详情 ${row.id}`} onClick={() => setSelectedDetail(row)}>
                        查看详情
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="shift-record-empty-row">
                  <td colSpan={columns.length}>
                    <div className="shift-record-empty">
                      <span aria-hidden="true" />
                      <p>{isLoading ? '交接班记录加载中' : '暂无数据'}</p>
                      {!isLoading ? <small>当前筛选条件暂无交接班记录</small> : null}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedDetail ? <ShiftRecordDetailDialog row={selectedDetail} onClose={() => setSelectedDetail(null)} /> : null}
    </div>
  )
}

function ShiftRecordDetailDialog({ row, onClose }: { row: ShiftRecordRow; onClose: () => void }) {
  const report = row.workReportDetail
  const incomeSources = report?.workIncomeSourceList ?? []
  const paymentTypes = report?.paymentTypeList ?? []
  const workGoods = report?.workGoods ?? []
  const shiftPeriod =
    report?.workUserStartDate || report?.workUserEndDate
      ? `${report?.workUserStartDate || '--'} - ${report?.workUserEndDate || '--'}`
      : '--'

  return (
    <div className="shift-record-modal-mask">
      <section role="dialog" aria-modal="true" aria-label="交接班详情" className="shift-record-modal">
        <header>
          <div>
            <h3>交接班详情</h3>
            <p>{row.id}</p>
          </div>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            关闭详情
          </button>
        </header>

        <dl className="shift-record-detail-grid">
          <div>
            <dt>门店</dt>
            <dd>{row.storeName}</dd>
          </div>
          <div>
            <dt>班次</dt>
            <dd>{row.handoverDate} / {row.shiftName}</dd>
          </div>
          <div>
            <dt>交班人</dt>
            <dd>{row.handoverUserName}</dd>
          </div>
          <div>
            <dt>接班人</dt>
            <dd>{row.receiverUserName}</dd>
          </div>
          <div>
            <dt>交班状态</dt>
            <dd>{row.status}</dd>
          </div>
          <div>
            <dt>交班时段</dt>
            <dd>{shiftPeriod}</dd>
          </div>
          <div>
            <dt>净收入</dt>
            <dd>{formatMoney(report?.netIncome)}</dd>
          </div>
          <div>
            <dt>总收入</dt>
            <dd>{formatMoney(report?.generalIncome)}</dd>
          </div>
          <div>
            <dt>总支出</dt>
            <dd>{formatMoney(report?.totalExpenditure)}</dd>
          </div>
          <div>
            <dt>系统生成时间</dt>
            <dd>{row.systemGeneratedAt}</dd>
          </div>
        </dl>

        <ShiftRecordDetailList
          title="收款来源"
          items={incomeSources.map((item) => ({
            key: item.sourceName,
            name: item.sourceName,
            summary: `收入 ${formatMoney(item.income)} / 支出 ${formatMoney(item.expend)}`,
            remark: item.remark,
          }))}
        />

        <ShiftRecordDetailList
          title="支付方式"
          items={paymentTypes.map((item) => ({
            key: item.paymentName,
            name: item.paymentName,
            summary: `收入 ${formatMoney(item.income)} / 支出 ${formatMoney(item.expend)}`,
            remark: item.remark,
          }))}
        />

        <ShiftRecordDetailList
          title="交班物品"
          items={workGoods.map((item) => ({
            key: item.id,
            name: item.goodsName,
            summary: `库存 ${item.goodsNumber}`,
            remark: item.remark,
          }))}
        />

        {report?.remark ? (
          <section className="shift-record-detail-note">
            <h4>交班摘要</h4>
            <p>{report.remark}</p>
          </section>
        ) : null}

        <section className="shift-record-detail-note">
          <h4>交班备注</h4>
          <p>{row.handoverRemark}</p>
        </section>

        <section className="shift-record-detail-note">
          <h4>接班备注</h4>
          <p>{row.receiverRemark}</p>
        </section>
      </section>
    </div>
  )
}

function ShiftRecordDetailList({
  title,
  items,
}: {
  title: string
  items: Array<{ key: string; name: string; summary: string; remark: string }>
}) {
  if (items.length === 0) return null

  return (
    <section className="shift-record-detail-section">
      <h4>{title}</h4>
      <ul className="shift-record-detail-list">
        {items.map((item) => (
          <li key={item.key}>
            <strong>{item.name}</strong>
            <span>{item.summary}</span>
            {item.remark ? <small>{item.remark}</small> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

const columns = ['交班日期', '交班班次', '交班人', '交班时间', '接班人', '接班时间', '交接状态', '交班备注', '接班备注', '系统生成时间', '操作']

function resolveFeedback(reason: LoadReason, rowCount: number) {
  if (rowCount === 0) return '当前筛选条件暂无交接班记录'
  if (reason === 'query') return '已按筛选条件更新交接班记录'
  if (reason === 'reset') return '已恢复默认筛选条件'
  if (reason === 'retry') return '已重新加载交接班记录'
  return '已加载交接班记录'
}

function resolveOptionLabel(options: ShiftRecordOption[], value: string, fallback: string) {
  return options.find((item) => item.value === value)?.label || fallback
}

function resolveEmployeeLabel(option: ShiftRecordOption) {
  return option.value === 'all' ? '全部员工' : option.label
}

function resolveEmployeeFilterLabel(options: ShiftRecordOption[], value: string, fallback: string) {
  if (value === 'all') return fallback
  return options.find((item) => item.value === value)?.label || fallback
}

function formatMoney(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '--'
  return `¥${value.toFixed(2)}`
}

function fallbackStores() {
  return [
    { value: 'all', label: '全部门店' },
    { value: '1796425098638573570', label: '天落会宿公寓(前海壹方城宝安中心店)' },
  ]
}

function fallbackEmployees() {
  return [
    { value: 'all', label: '全部员工' },
    { value: '1796067693261905922', label: '路客云6TS5' },
    { value: '1796067693261905933', label: '陈早班' },
  ]
}
