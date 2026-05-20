import { useEffect, useMemo, useRef, useState } from 'react'
import {
  createStatementOrderQuery,
  exportStatementOrderData,
  getStatementOrderStoreOptions,
  loadStatementOrderData,
  type StatementOrderResult,
  type StatementOrderRow,
  type StatementOrderStoreScope,
} from '../services/statementOrder'
import './StatementOrderPage.css'

const columns = [
  '订单号',
  '客户信息',
  '产品类型',
  '产品名称',
  '预订时间',
  '渠道',
  '应付金额',
  '实付金额',
  '优惠金额',
  '退款金额',
  '支付手续费',
  '平台服务费',
  '全员分销佣金',
  '支付方式',
  '结算金额',
] as const

type RequestReason = 'initial' | 'query' | 'reset' | 'retry'

export function StatementOrderPage() {
  const stores = getStatementOrderStoreOptions()
  const [selectedScope, setSelectedScope] = useState<StatementOrderStoreScope>('all')
  const [submittedScope, setSubmittedScope] = useState<StatementOrderStoreScope>('all')
  const [reloadToken, setReloadToken] = useState(0)
  const [data, setData] = useState<StatementOrderResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [exportAudit, setExportAudit] = useState<string[]>([])
  const requestReasonRef = useRef<RequestReason>('initial')

  const serviceAudit = useMemo(() => {
    const segments = data?.audit ?? []
    return [...segments, ...exportAudit].join(';')
  }, [data?.audit, exportAudit])

  useEffect(() => {
    const controller = new AbortController()

    void loadStatementOrderData(submittedScope, controller.signal)
      .then((result) => {
        setData(result)
        setNotice(resolveSuccessNotice(requestReasonRef.current, submittedScope))
      })
      .catch((loadError) => {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setData(null)
        setNotice('')
        setError(loadError instanceof Error ? loadError.message : '品牌小程序订单服务暂不可用，请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [reloadToken, submittedScope])

  const rows = data?.rows ?? []
  const pagination = data?.pagination
  const rangeStart = rows.length ? 1 : 0
  const rangeEnd = rows.length

  function reload(scope: StatementOrderStoreScope, reason: RequestReason, pendingNotice: string) {
    requestReasonRef.current = reason
    setIsLoading(true)
    setError('')
    setSubmittedScope(scope)
    setNotice(pendingNotice)
    setExportAudit([])
    setReloadToken((value) => value + 1)
  }

  function resetFilters() {
    setSelectedScope('all')
    reload('all', 'reset', '正在恢复默认筛选条件')
  }

  async function handleExport() {
    setIsExporting(true)
    setNotice('正在生成品牌小程序订单导出任务')
    setError('')
    try {
      const result = await exportStatementOrderData(submittedScope)
      setExportAudit(result.audit)
      setNotice('已生成品牌小程序订单导出任务')
    } catch (exportError) {
      setNotice('')
      setError(exportError instanceof Error ? exportError.message : '品牌小程序订单导出任务创建失败，请稍后重试')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="statement-order-page">
      <h1 className="sr-only-heading">品牌小程序订单</h1>
      <div className="sr-only-heading" aria-label="品牌小程序订单数据服务">
        {serviceAudit}
      </div>

      <section className="statement-order-toolbar" aria-label="品牌小程序订单筛选">
        <div className="statement-order-store" role="group" aria-label="门店">
          {stores.map((store) => (
            <button
              key={store.id}
              type="button"
              aria-pressed={selectedScope === store.id}
              className={selectedScope === store.id ? 'is-active' : ''}
              onClick={() => setSelectedScope(store.id)}
            >
              {store.label}
            </button>
          ))}
        </div>

        <div className="statement-order-actions">
          <button type="button" className="is-outline" disabled={isLoading || isExporting} onClick={resetFilters}>
            重置
          </button>
          <button
            type="button"
            className="is-primary"
            disabled={isLoading || isExporting}
            onClick={() => reload(selectedScope, 'query', '正在刷新品牌小程序订单')}
          >
            查询
          </button>
          <button type="button" className="is-outline" disabled={isLoading || isExporting} onClick={handleExport}>
            导出明细
          </button>
        </div>
      </section>

      {notice ? (
        <div className="statement-order-notice" role="status">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="statement-order-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => reload(submittedScope, 'retry', '正在重新加载品牌小程序订单')}>
            重新加载
          </button>
        </div>
      ) : null}

      <section className="statement-order-table-shell" aria-label="品牌小程序订单表格">
        <header className="statement-order-table-caption">
          <strong>共 {pagination?.total ?? 0} 条订单</strong>
          <span>
            查询条件：
            {formatScopeText(submittedScope)} · {createStatementOrderQuery(submittedScope).bookingStartDate} 至{' '}
            {createStatementOrderQuery(submittedScope).bookingEndDate}
          </span>
        </header>

        <div className="statement-order-table-scroll">
          <table className="statement-order-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => <StatementOrderTableRow key={row.orderId} row={row} />)
              ) : (
                <tr className="statement-order-empty-row">
                  <td colSpan={columns.length}>
                    <div className="statement-order-empty">
                      <span aria-hidden="true" />
                      <p>{isLoading ? '正在刷新品牌小程序订单' : '当前条件暂无品牌小程序订单'}</p>
                      {!isLoading ? <small>暂无数据</small> : null}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <footer className="statement-order-pagination" aria-label="品牌小程序订单分页">
        <span>
          第 {rangeStart}-{rangeEnd} 条，共 {pagination?.total ?? 0} 条
        </span>
        <button type="button" disabled>
          上一页
        </button>
        <button type="button" className="is-current">
          1
        </button>
        <button type="button" disabled>
          下一页
        </button>
      </footer>
    </div>
  )
}

function StatementOrderTableRow({ row }: { row: StatementOrderRow }) {
  return (
    <tr>
      <td>{row.orderId}</td>
      <td>{row.customerInfo}</td>
      <td>{row.productType}</td>
      <td>{row.productName}</td>
      <td>{row.bookingTime}</td>
      <td>{row.channelName}</td>
      <td>{formatAmount(row.payableAmount)}</td>
      <td>{formatAmount(row.paidAmount)}</td>
      <td>{formatAmount(row.discountAmount)}</td>
      <td>{formatAmount(row.refundAmount)}</td>
      <td>{formatAmount(row.paymentFee)}</td>
      <td>{formatAmount(row.platformServiceFee)}</td>
      <td>{formatAmount(row.distributorCommission)}</td>
      <td>{row.paymentWayName}</td>
      <td>{formatAmount(row.settlementAmount)}</td>
    </tr>
  )
}

function formatAmount(value: number) {
  return value.toFixed(2)
}

function formatScopeText(scope: StatementOrderStoreScope) {
  return scope === 'current' ? '当前门店' : '全部门店'
}

function resolveSuccessNotice(reason: RequestReason, scope: StatementOrderStoreScope) {
  if (reason === 'initial') return ''
  if (reason === 'reset') return '已恢复默认筛选条件'
  if (reason === 'retry') return '已重新加载品牌小程序订单'
  return scope === 'current' ? '已按当前门店刷新品牌小程序订单' : '已按全部门店刷新品牌小程序订单'
}
