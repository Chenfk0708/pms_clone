import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  exportTotalLedger,
  getDefaultTotalLedgerQuery,
  getDefaultTotalLedgerRangeKey,
  getTotalLedgerProviderName,
  getTotalLedgerRangePresets,
  loadTotalLedgerData,
  type TotalLedgerData,
  type TotalLedgerQuery,
  type TotalLedgerRangeKey,
} from '../services/totalLedger'
import './TotalLedgerPage.css'

const rangePresets = getTotalLedgerRangePresets()
const defaultQuery = getDefaultTotalLedgerQuery()

export function TotalLedgerPage() {
  const [activeStoreId, setActiveStoreId] = useState('all')
  const [query, setQuery] = useState<TotalLedgerQuery>(defaultQuery)
  const [activeRange, setActiveRange] = useState<TotalLedgerRangeKey>(getDefaultTotalLedgerRangeKey(defaultQuery))
  const [data, setData] = useState<TotalLedgerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadSeq, setReloadSeq] = useState(0)
  const [dateDialogOpen, setDateDialogOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setError('')
      try {
        const result = await loadTotalLedgerData(query, signal)
        setData(result)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : '收支汇总服务暂不可用，请稍后重试')
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

  const contractProvider = data?.provider ?? getTotalLedgerProviderName()
  const contractMockState = data?.mockState ?? readCurrentMockState()
  const requestBody = data?.requestBody ?? query
  const activeStoreLabel = data?.stores.find((item) => item.id === activeStoreId)?.label ?? '全部门店'
  const pageStart = data?.pagination.total ? 1 : 0
  const pageEnd = data?.pagination.total ? Math.min(data.pagination.total, data.pagination.pageSize) : 0
  const ratioCards = useMemo(
    () => [
      {
        title: '收入占比',
        items: data?.income ?? [],
        total: data?.summary.totalIncomePrice ?? 0,
        emptyText: '暂无数据',
      },
      {
        title: '支出占比',
        items: data?.expend?.filter((item) => item.price > 0) ?? [],
        total: data?.summary.totalExpendPrice ?? 0,
        emptyText: '暂无数据',
      },
    ],
    [data],
  )

  function applyRange(nextRange: TotalLedgerRangeKey) {
    const preset = rangePresets.find((item) => item.key === nextRange)
    if (!preset) return
    setActiveRange(nextRange)
    setQuery((current) => ({
      ...current,
      beginTime: preset.beginTime,
      endTime: preset.endTime,
      pageNum: 1,
    }))
    setNotice(`已按${preset.label}重新查询收支汇总`)
    setDateDialogOpen(false)
  }

  function applyStore(storeId: string) {
    setActiveStoreId(storeId)
    setQuery((current) => ({
      ...current,
      poiIds: storeId === 'all' ? [] : [storeId],
      pageNum: 1,
    }))
    setNotice(storeId === 'all' ? '已切换全部门店' : '已切换当前门店')
  }

  function resetFilters() {
    setActiveStoreId('all')
    setActiveRange(getDefaultTotalLedgerRangeKey(defaultQuery))
    setQuery(defaultQuery)
    setNotice('已重置收支汇总筛选条件')
    setDateDialogOpen(false)
  }

  async function handleExport() {
    setIsExporting(true)
    try {
      const result = await exportTotalLedger(query)
      setNotice(result.message)
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : '收支汇总导出失败，请稍后重试')
    } finally {
      setIsExporting(false)
    }
  }

  function retryLoad() {
    setNotice('已重新发起收支汇总加载')
    setReloadSeq((current) => current + 1)
  }

  return (
    <div className="total-ledger-page">
      <div
        data-testid="total-ledger-service-contract"
        data-provider={contractProvider}
        data-endpoint="/accountBookPaymentWay/page/get"
        data-export-endpoint="/accountBookPaymentWay/page/get"
        data-mock-state={contractMockState}
        data-request-body={JSON.stringify(requestBody)}
        hidden
      />

      <h1 className="total-ledger-title">收支汇总</h1>

      <section className="total-ledger-filter" aria-label="收支汇总筛选">
        <div className="total-ledger-store-row" role="radiogroup" aria-label="门店">
          {(data?.stores ?? [
            { id: 'all', label: '全部门店' },
            { id: defaultQuery.campId, label: '天落会宿公寓(前海壹方城宝安中心店)' },
          ]).map((store) => (
            <button
              key={store.id}
              type="button"
              role="radio"
              aria-checked={activeStoreId === store.id}
              className={activeStoreId === store.id ? 'is-active' : ''}
              onClick={() => applyStore(store.id)}
              disabled={isLoading || isExporting}
            >
              {store.label}
            </button>
          ))}
        </div>

        <div className="total-ledger-range-row">
          <fieldset className="total-ledger-date-range">
            <legend>日期</legend>
            <input
              aria-label="开始日期"
              placeholder="开始日期"
              readOnly
              value={query.beginTime}
              onClick={() => setDateDialogOpen(true)}
            />
            <span>至</span>
            <input
              aria-label="结束日期"
              placeholder="结束日期"
              readOnly
              value={query.endTime}
              onClick={() => setDateDialogOpen(true)}
            />
          </fieldset>

          <div className="total-ledger-range-buttons" role="group" aria-label="日期快捷筛选">
            {rangePresets.map((range) => (
              <button
                key={range.key}
                type="button"
                className={activeRange === range.key ? 'is-active' : ''}
                onClick={() => applyRange(range.key)}
                disabled={isLoading || isExporting}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="total-ledger-actions">
          <button type="button" className="is-outline" onClick={resetFilters} disabled={isLoading || isExporting}>
            重置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => void handleExport()}
            disabled={isLoading || isExporting || !!error}
          >
            {isExporting ? '导出中...' : '导出'}
          </button>
        </div>
      </section>

      {isLoading ? (
        <div className="total-ledger-loading" role="status" aria-label="收支汇总加载状态">
          正在加载收支汇总
        </div>
      ) : null}

      {notice ? (
        <div className="total-ledger-notice" role="status" aria-label="收支汇总操作反馈">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="total-ledger-alert" role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={retryLoad}>
            重新加载
          </button>
        </div>
      ) : null}

      <section className="total-ledger-summary" aria-label="账本概括">
        <article className="total-ledger-card total-ledger-balance-card">
          <h2>账本概括</h2>
          <div className="total-ledger-balance">
            <div className="total-ledger-balance__icon">净收入</div>
            <div>
              <span>{activeStoreLabel}</span>
              <strong>{formatCurrency(data?.summary.netIncome ?? 0)}</strong>
              <p>总收入：{formatCurrency(data?.summary.totalIncomePrice ?? 0)}</p>
              <p>总支出：{formatCurrency(data?.summary.totalExpendPrice ?? 0)}</p>
            </div>
          </div>
        </article>

        {ratioCards.map((card) => (
          <RatioCard
            key={card.title}
            title={card.title}
            items={card.items}
            total={card.total}
            emptyText={card.emptyText}
          />
        ))}
      </section>

      <section className="total-ledger-table-section">
        <h2>收支汇总表</h2>
        <div className="total-ledger-table-wrap" aria-label="收支汇总表格">
          {error ? null : isLoading ? null : data?.rows.length ? (
            <>
              <table className="total-ledger-table">
                <thead>
                  <tr>
                    <th>日期</th>
                    {data.paymentWays.map((way) => (
                      <th key={way.paymentWayId}>{way.paymentWayName}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.date} className={row.date === '合计' ? 'is-summary' : ''}>
                      <td>{row.date}</td>
                      {data.paymentWays.map((way) => (
                        <td key={`${row.date}-${way.paymentWayId}`}>{formatAmount(row.values[way.paymentWayId] ?? 0)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <nav className="total-ledger-pagination" aria-label="分页">
                <span>
                  第 {pageStart}-{pageEnd} 条/总共 {data.pagination.total} 条
                </span>
                <button type="button" className="is-current">
                  {data.pagination.current}
                </button>
              </nav>
            </>
          ) : (
            <>
              <div className="total-ledger-empty" role="status" aria-label="收支汇总空态">
                当前条件暂无收支汇总数据
              </div>
              <nav className="total-ledger-pagination" aria-label="分页">
                <span>第 0-0 条/总共 0 条</span>
                <button type="button" className="is-current">
                  1
                </button>
              </nav>
            </>
          )}
        </div>
      </section>

      {dateDialogOpen ? (
        <DatePickerDialog activeRange={activeRange} onClose={() => setDateDialogOpen(false)} onApplyRange={applyRange} />
      ) : null}
    </div>
  )
}

function RatioCard({
  title,
  items,
  total,
  emptyText,
}: {
  title: string
  items: TotalLedgerData['income']
  total: number
  emptyText: string
}) {
  const hasValues = items.length > 0 && total > 0
  const chartStyle = hasValues ? { backgroundImage: buildConicGradient(items, total) } : undefined

  return (
    <article className="total-ledger-card total-ledger-ratio-card" aria-label={title}>
      <h2>{title}</h2>
      {hasValues ? (
        <div className="total-ledger-ratio-body">
          <div className="total-ledger-donut" style={chartStyle}>
            <span>{formatPercent(items[0]?.price ?? 0, total)}</span>
          </div>
          <ul className="total-ledger-ratio-legend">
            {items.map((item, index) => (
              <li key={`${title}-${item.paymentWayId}`}>
                <i style={{ background: pickChartColor(index) }} />
                <span>{item.paymentWayName}</span>
                <strong>{formatPercent(item.price, total)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="total-ledger-ratio-empty">{emptyText}</div>
      )}
    </article>
  )
}

function DatePickerDialog({
  activeRange,
  onClose,
  onApplyRange,
}: {
  activeRange: TotalLedgerRangeKey
  onClose: () => void
  onApplyRange: (range: TotalLedgerRangeKey) => void
}) {
  return (
    <div className="total-ledger-date-popover" role="dialog" aria-modal="true" aria-label="日期选择">
      <div className="total-ledger-date-popover__header">
        <strong>快捷日期</strong>
        <button type="button" aria-label="关闭日期选择" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="total-ledger-date-popover__content">
        {rangePresets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={activeRange === preset.key ? 'is-active' : ''}
            onClick={() => onApplyRange(preset.key)}
          >
            <span>{preset.label}</span>
            <em>
              {preset.beginTime} 至 {preset.endTime}
            </em>
          </button>
        ))}
      </div>
      <div className="total-ledger-date-popover__footer">
        <button type="button" onClick={onClose}>
          取消
        </button>
      </div>
    </div>
  )
}

function formatCurrency(value: number) {
  return `¥${value.toFixed(2)}`
}

function formatAmount(value: number) {
  return value.toFixed(2)
}

function formatPercent(value: number, total: number) {
  if (total <= 0) return '0.00%'
  return `${((value / total) * 100).toFixed(2)}%`
}

function buildConicGradient(items: Array<{ price: number }>, total: number) {
  let start = 0
  const segments = items.map((item, index) => {
    const ratio = total <= 0 ? 0 : (item.price / total) * 100
    const end = start + ratio
    const segment = `${pickChartColor(index)} ${start}% ${end}%`
    start = end
    return segment
  })
  if (!segments.length) return 'none'
  return `conic-gradient(${segments.join(', ')})`
}

function pickChartColor(index: number) {
  const palette = ['#4d65f6', '#43b581', '#ff8a3d', '#f2c94c']
  return palette[index % palette.length]
}

function readCurrentMockState() {
  if (typeof window === 'undefined') return 'success'
  const params = new URLSearchParams(window.location.search)
  const configured = params.get('mockState') || params.get('totalLedgerMockMode')
  return configured === 'empty' || configured === 'error' || configured === 'success' ? configured : 'success'
}
