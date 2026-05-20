import { useEffect, useMemo, useState } from 'react'
import {
  defaultStatisticsDistributionOrderCampId,
  getStatisticsDistributionOrderProviderName,
  loadStatisticsDistributionOrderData,
  statisticsDistributionOrderEndpoint,
  type StatisticsDistributionOrderData,
  type StatisticsDistributionOrderFilter,
  type StatisticsDistributionOrderQuery,
  type StatisticsDistributionOrderStoreScope,
} from '../services/statisticsDistributionOrder'
import './DistributionOrderPage.css'
import './StatisticsDistributionOrderPage.css'

const tableColumns = ['订单号', '客户信息', '房型名称', '预订时间', '实付金额', '平台服务费', '应结算金额', '已结算金额', '结算状态']
const orderFilterOptions: Array<Exclude<StatisticsDistributionOrderFilter, ''>> = ['全部', '非置换订单', '置换订单']

const initialQuery: StatisticsDistributionOrderQuery = {
  campId: defaultStatisticsDistributionOrderCampId,
  storeScope: 'all',
  bookingStartDate: '2026-05-01',
  bookingEndDate: '2026-05-31',
  keyword: '',
  settlementState: '',
  pageNum: 1,
  pageSize: 20,
  current: 1,
}

export function StatisticsDistributionOrderPage() {
  const [expanded, setExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<StatisticsDistributionOrderFilter>('')
  const [storeScope, setStoreScope] = useState<StatisticsDistributionOrderStoreScope>('all')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [submittedFilter, setSubmittedFilter] = useState<StatisticsDistributionOrderFilter>('')
  const [submittedStoreScope, setSubmittedStoreScope] = useState<StatisticsDistributionOrderStoreScope>('all')
  const [datePopoverOpen, setDatePopoverOpen] = useState(false)
  const [openFilter, setOpenFilter] = useState(false)
  const [notice, setNotice] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [data, setData] = useState<StatisticsDistributionOrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const query = useMemo<StatisticsDistributionOrderQuery>(
    () => ({
      ...initialQuery,
      storeScope: submittedStoreScope,
      keyword: submittedKeyword,
      settlementState: submittedFilter,
    }),
    [submittedFilter, submittedKeyword, submittedStoreScope],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setIsLoading(true)
      setError('')
      try {
        const result = await loadStatisticsDistributionOrderData(query, controller.signal)
        setData(result)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : '聚合分销订单服务暂不可用，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [query, reloadToken])

  function resetFilters() {
    setKeyword('')
    setSubmittedKeyword('')
    setFilter('')
    setSubmittedFilter('')
    setStoreScope('all')
    setSubmittedStoreScope('all')
    setDatePopoverOpen(false)
    setOpenFilter(false)
    setNotice('筛选条件已重置')
  }

  function queryOrders() {
    setSubmittedKeyword(keyword.trim())
    setSubmittedFilter(filter)
    setOpenFilter(false)
    setNotice('已查询聚合分销订单')
  }

  function applyStoreScope(nextScope: StatisticsDistributionOrderStoreScope, noticeMessage: string) {
    setStoreScope(nextScope)
    setSubmittedStoreScope(nextScope)
    setDatePopoverOpen(false)
    setOpenFilter(false)
    setNotice(noticeMessage)
    if (submittedStoreScope === nextScope) {
      setReloadToken((value) => value + 1)
    }
  }

  function reloadOrders(message = '已重新加载聚合分销订单') {
    setDatePopoverOpen(false)
    setOpenFilter(false)
    setNotice(message)
    setReloadToken((value) => value + 1)
  }

  const filterLabel = filter || '请选择'
  const pageTotal = data?.pagination.total ?? 0
  const pageStart = pageTotal ? 1 : 0
  const pageEnd = pageTotal ? pageTotal : 0
  const serviceSummary = data?.requestSummary ?? [
    `provider=${getStatisticsDistributionOrderProviderName()}`,
    'mockState=success',
    'traceId=pending',
    `path=${statisticsDistributionOrderEndpoint}`,
    `campId=${query.campId ?? defaultStatisticsDistributionOrderCampId}`,
    `storeScope=${query.storeScope ?? 'all'}`,
    `bookingStartDate=${query.bookingStartDate}`,
    `bookingEndDate=${query.bookingEndDate}`,
    `keyword=${query.keyword?.trim() || ''}`,
    `settlementState=${query.settlementState || ''}`,
  ]

  return (
    <div className="distribution-order-page statistics-distribution-order-page">
      <h1 className="sr-only-heading">聚合分销订单</h1>

      <section
        className={`distribution-order-query statistics-distribution-query${expanded ? ' is-expanded' : ''}`}
        aria-label="聚合分销订单筛选"
      >
        <div className="distribution-order-store statistics-distribution-store" aria-label="门店">
          <button
            type="button"
            className={`distribution-order-store__scope${storeScope === 'all' ? ' is-active' : ''}`}
            aria-pressed={storeScope === 'all'}
            onClick={() => applyStoreScope('all', '已刷新全部门店口径的聚合分销订单')}
          >
            全部门店
          </button>
          <button
            type="button"
            className={`distribution-order-store__current${storeScope === 'current' ? ' is-active' : ''}`}
            aria-pressed={storeScope === 'current'}
            onClick={() => applyStoreScope('current', '已刷新当前门店口径的聚合分销订单')}
          >
            {data?.campName ?? '天落会宿公寓(前海壹方城宝安中心店)'}
          </button>
          <button
            type="button"
            className="distribution-order-store__settings"
            aria-label="门店设置"
            onClick={() => setNotice('门店范围设置已同步到当前聚合分销订单')}
          >
            ⚙
          </button>
        </div>

        {expanded ? (
          <div className="distribution-order-query__advanced statistics-distribution-advanced">
            <div className="distribution-order-field distribution-order-date" role="group" aria-label="预订时间">
              <span>预订时间:</span>
              <div className="distribution-order-date__range">
                <input
                  aria-label="预订开始日期"
                  value={query.bookingStartDate}
                  readOnly
                  onClick={() => setDatePopoverOpen(true)}
                />
                <em>至</em>
                <input
                  aria-label="预订结束日期"
                  value={query.bookingEndDate}
                  readOnly
                  onClick={() => setDatePopoverOpen(true)}
                />
              </div>
            </div>

            <label className="distribution-order-field distribution-order-keyword">
              <span>订单搜索:</span>
              <input
                value={keyword}
                placeholder="请输入订单编号/预订人/手机号"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>

            <label className="distribution-order-field distribution-order-select-field">
              <span>订单筛选:</span>
              <button
                type="button"
                className="distribution-order-select"
                aria-haspopup="listbox"
                aria-expanded={openFilter}
                aria-label={`订单筛选 ${filterLabel}`}
                onClick={() => setOpenFilter((value) => !value)}
              >
                {filterLabel}
              </button>
            </label>
          </div>
        ) : null}

        {openFilter ? (
          <div className="distribution-order-options statistics-distribution-options" role="listbox" aria-label="订单筛选选项">
            {orderFilterOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={filter === option}
                onClick={() => {
                  setFilter(option)
                  setOpenFilter(false)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        {datePopoverOpen ? (
          <div className="statistics-distribution-date-panel" role="dialog" aria-label="预订时间范围">
            <strong>预订时间范围</strong>
            <p>
              当前区间：{query.bookingStartDate} 至 {query.bookingEndDate}
            </p>
            <div className="statistics-distribution-date-panel__actions">
              <button
                type="button"
                onClick={() => {
                  setDatePopoverOpen(false)
                  setNotice('已定位到 2026-05 的预订时间范围')
                  setReloadToken((value) => value + 1)
                }}
              >
                本月
              </button>
              <button type="button" onClick={() => setDatePopoverOpen(false)}>
                关闭
              </button>
            </div>
          </div>
        ) : null}

        <div className="distribution-order-actions statistics-distribution-actions">
          <button type="button" className="is-outline" onClick={resetFilters} disabled={isLoading}>
            重置
          </button>
          <button type="button" className="is-primary" onClick={queryOrders} disabled={isLoading}>
            查询
          </button>
          <button
            type="button"
            className="is-outline"
            onClick={() => setNotice('已生成聚合分销订单导出任务')}
            disabled={isLoading || !data?.rows.length}
          >
            导出明细
          </button>
          <button
            type="button"
            className="is-link"
            onClick={() => {
              setExpanded((value) => !value)
              setDatePopoverOpen(false)
              setOpenFilter(false)
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      <section className="distribution-order-service-contract" aria-label="聚合分销订单数据服务">
        {serviceSummary.join(';')}
      </section>

      {notice ? (
        <div className="distribution-order-notice" role="status">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="distribution-order-alert" role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={() => reloadOrders('已重新发起加载')}>
            重新加载
          </button>
        </div>
      ) : null}

      <section className="distribution-order-table statistics-distribution-table" aria-label="聚合分销订单表格">
        <table>
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="statistics-distribution-table__cell">
                  <div className="distribution-order-empty">正在刷新聚合分销订单</div>
                </td>
              </tr>
            ) : error ? null : data?.rows.length ? (
              <>
                <tr className="is-summary">
                  <td>合计</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{formatAmount(data.summary.paidAmount)}</td>
                  <td>{formatAmount(data.summary.serviceFee)}</td>
                  <td>{formatAmount(data.summary.settlementAmount)}</td>
                  <td>{formatAmount(data.summary.settledAmount)}</td>
                  <td>-</td>
                </tr>
                {data.rows.map((row) => (
                  <tr key={row.orderId}>
                    <td>
                      <span className="statistics-distribution-order-id">{row.orderId}</span>
                    </td>
                    <td>{row.customerInfo}</td>
                    <td>{row.roomCategoryName}</td>
                    <td>{row.bookedTime}</td>
                    <td>{formatAmount(row.paidAmount)}</td>
                    <td>{formatAmount(row.serviceFee)}</td>
                    <td>{formatAmount(row.settlementAmount)}</td>
                    <td>{formatAmount(row.settledAmount)}</td>
                    <td>{row.settlementStatus}</td>
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td colSpan={9} className="statistics-distribution-table__cell">
                  <div className="distribution-order-empty">当前条件暂无聚合分销订单</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="distribution-order-pagination" aria-label="分页">
        <span>
          第 {pageStart}-{pageEnd} 条/总共 {pageTotal} 条
        </span>
        <button type="button" aria-label="上一页" disabled>
          ‹
        </button>
        <span className="statistics-distribution-page-chip is-current" aria-current="page">
          1
        </span>
        <button type="button" aria-label="下一页" disabled>
          ›
        </button>
        <button type="button" onClick={() => setNotice('当前每页展示 20 条聚合分销订单')}>
          20 条/页
        </button>
      </div>
    </div>
  )
}

function formatAmount(value: number) {
  return value.toFixed(2)
}
