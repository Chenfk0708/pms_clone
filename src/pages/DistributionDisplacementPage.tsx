import { useEffect, useMemo, useState } from 'react'
import {
  defaultDistributionDisplacementFilters,
  loadDistributionDisplacementData,
  readInitialDistributionDisplacementFilters,
  type DistributionDisplacementData,
  type DistributionDisplacementFilters,
  type DistributionDisplacementRow,
} from '../services/distributionDisplacement'
import './DistributionDisplacementPage.css'

const detailColumns = [
  '序号',
  '订单号/渠道单号',
  '置换月份',
  '渠道',
  '房型',
  '房间',
  '联系人',
  '手机号',
  '入住状态',
  '结算状态',
  '入离日期',
  '结算日期',
  '结算金额',
  '置换金额',
  '操作',
]

type ToastTone = 'success' | 'error'

export function DistributionDisplacementPage() {
  const [filters, setFilters] = useState<DistributionDisplacementFilters>(() => readInitialDistributionDisplacementFilters())
  const [appliedFilters, setAppliedFilters] = useState<DistributionDisplacementFilters>(filters)
  const [data, setData] = useState<DistributionDisplacementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ tone: ToastTone; text: string } | null>(null)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [selectedRow, setSelectedRow] = useState<DistributionDisplacementRow | null>(null)
  const requestBodyText = useMemo(() => JSON.stringify(data?.requestBody ?? {}), [data?.requestBody])

  useEffect(() => {
    let active = true

    loadDistributionDisplacementData(appliedFilters)
      .then((nextData) => {
        if (!active) return
        setData(nextData)
      })
      .catch((nextError: unknown) => {
        if (!active) return
        setError(nextError instanceof Error ? nextError.message : String(nextError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [appliedFilters])

  function showToast(text: string, tone: ToastTone = 'success') {
    setToast({ text, tone })
    window.setTimeout(() => setToast(null), 2200)
  }

  function prepareLoad() {
    setLoading(true)
    setError('')
  }

  function updateFilter(key: keyof DistributionDisplacementFilters, value: string) {
    setFilters((current) => ({ ...current, [key]: value, pageNum: 1 }))
  }

  function submitFilters() {
    prepareLoad()
    setAppliedFilters(filters)
    showToast('筛选已更新')
  }

  function resetFilters() {
    prepareLoad()
    setFilters(defaultDistributionDisplacementFilters)
    setAppliedFilters(defaultDistributionDisplacementFilters)
    showToast('筛选已重置')
  }

  function refreshData() {
    prepareLoad()
    setAppliedFilters((current) => ({ ...current }))
    showToast(`刷新完成：${formatDisplayTime(data?.timestamp)}`)
  }

  function exportRows() {
    if (!data || data.rows.length === 0) {
      showToast('当前条件暂无可导出明细', 'error')
      return
    }
    showToast(`导出任务已创建，共 ${data.pagination.total} 条`)
  }

  return (
    <div className="distribution-displacement-page">
      <h1 className="sr-only-heading">置换权益</h1>
      <span
        className="distribution-displacement-service-state"
        data-testid="distribution-displacement-service-state"
        data-provider={data?.provider ?? 'mock'}
        data-endpoint={data?.endpoint ?? '/api/edition/replace/order/get'}
        data-request-body={requestBodyText}
        data-trace-id={data?.traceId ?? ''}
      />

      {toast ? (
        <div className={`distribution-displacement-toast distribution-displacement-toast--${toast.tone}`} role="status">
          {toast.text}
        </div>
      ) : null}

      <section className="distribution-displacement-overview" aria-label="置换概况">
        <div className="distribution-displacement-section-title">
          <h2>置换概况</h2>
          <div className="distribution-displacement-actions" aria-label="置换权益操作">
            <button type="button" onClick={refreshData} disabled={loading}>
              刷新
            </button>
            <button type="button" onClick={exportRows} disabled={loading}>
              导出
            </button>
            <button type="button" className="distribution-displacement-primary" onClick={() => setShowApplyDialog(true)}>
              申请尾房置换
            </button>
          </div>
        </div>

        <div className="distribution-displacement-summary">
          <article className="distribution-displacement-card" tabIndex={0} aria-label="待置换金额">
            <span>待置换金额:</span>
            <strong>{data?.summary.pendingReplaceAmountText ?? '¥0.00'}</strong>
          </article>
          <article className="distribution-displacement-card" tabIndex={0} aria-label="已置换金额">
            <span>已置换金额:</span>
            <strong>{data?.summary.completedReplaceAmountText ?? '¥0.00'}</strong>
          </article>
        </div>
      </section>

      <section className="distribution-displacement-detail" aria-label="置换明细">
        <div className="distribution-displacement-detail__title">
          <h2>置换明细</h2>
          <span aria-hidden="true">?</span>
        </div>

        <div className="distribution-displacement-filter" role="search" aria-label="日期筛选">
          <span>日期筛选:</span>
          <button type="button" className="is-active" aria-pressed="true">
            全部
          </button>
          <label>
            <span className="sr-only-heading">开始日期</span>
            <input
              aria-label="开始日期"
              type="date"
              value={filters.startDate}
              onChange={(event) => updateFilter('startDate', event.target.value)}
            />
          </label>
          <em aria-hidden="true">~</em>
          <label>
            <span className="sr-only-heading">结束日期</span>
            <input
              aria-label="结束日期"
              type="date"
              value={filters.endDate}
              onChange={(event) => updateFilter('endDate', event.target.value)}
            />
          </label>
          <button type="button" onClick={submitFilters} disabled={loading}>
            查询
          </button>
          <button type="button" onClick={resetFilters} disabled={loading}>
            重置
          </button>
        </div>

        {error ? (
          <div className="distribution-displacement-alert" role="alert">
            <strong>置换权益数据加载失败</strong>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => {
                prepareLoad()
                setAppliedFilters((current) => ({ ...current }))
              }}
            >
              重试
            </button>
          </div>
        ) : null}

        <div className="distribution-displacement-table" aria-busy={loading} aria-label="置换明细表格">
          <table aria-label="置换明细表格">
            <thead>
              <tr>
                {detailColumns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={detailColumns.length}>
                    <div className="distribution-displacement-loading">数据加载中</div>
                  </td>
                </tr>
              ) : data && data.rows.length > 0 ? (
                data.rows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.orderText}</td>
                    <td>{row.replaceMonth}</td>
                    <td>{row.channelName}</td>
                    <td>{row.roomCategoryName}</td>
                    <td>{row.roomName}</td>
                    <td>{row.contactName}</td>
                    <td>{row.contactMobile}</td>
                    <td>{row.stayStatusLabel}</td>
                    <td>{row.settlementStatusLabel}</td>
                    <td>{row.stayDateRange}</td>
                    <td>{row.settlementDate}</td>
                    <td>{row.settlementAmountText}</td>
                    <td>{row.replaceAmountText}</td>
                    <td>
                      <button
                        type="button"
                        className="distribution-displacement-link-button"
                        aria-label={`查看 ${row.orderText.split(' / ')[0]} 详情`}
                        onClick={() => setSelectedRow(row)}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={detailColumns.length}>
                    <div className="distribution-displacement-empty">
                      <span aria-hidden="true" />
                      <p>暂无置换明细</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="distribution-displacement-pagination">共 {data?.pagination.total ?? 0} 条</div>
      </section>

      {showApplyDialog ? (
        <div className="distribution-displacement-modal" role="presentation">
          <div className="distribution-displacement-dialog" role="dialog" aria-modal="true" aria-label="尾房置换">
            <button
              type="button"
              className="distribution-displacement-dialog__close"
              aria-label="关闭尾房置换"
              onClick={() => setShowApplyDialog(false)}
            >
              ×
            </button>
            <h2>尾房置换</h2>
            <div className="distribution-displacement-qr" aria-label="尾房置换二维码">
              <span />
            </div>
            <p>联系业务经理，进行尾房置换</p>
            <button type="button" className="distribution-displacement-primary" onClick={() => setShowApplyDialog(false)}>
              我知道了
            </button>
          </div>
        </div>
      ) : null}

      {selectedRow ? (
        <div className="distribution-displacement-modal" role="presentation">
          <div className="distribution-displacement-drawer" role="dialog" aria-modal="true" aria-label="置换明细详情">
            <button
              type="button"
              className="distribution-displacement-dialog__close"
              aria-label="关闭置换明细详情"
              onClick={() => setSelectedRow(null)}
            >
              ×
            </button>
            <h2>置换明细详情</h2>
            <dl>
              <div>
                <dt>订单</dt>
                <dd>{selectedRow.orderText}</dd>
              </div>
              <div>
                <dt>房型房间</dt>
                <dd>
                  {selectedRow.roomCategoryName} / {selectedRow.roomName}
                </dd>
              </div>
              <div>
                <dt>联系人</dt>
                <dd>
                  {selectedRow.contactName} {selectedRow.contactMobile}
                </dd>
              </div>
              <div>
                <dt>置换金额</dt>
                <dd>{selectedRow.replaceAmountText}</dd>
              </div>
              <div>
                <dt>业务备注</dt>
                <dd>{selectedRow.remark}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function formatDisplayTime(value?: string) {
  if (!value) return '2026-05-18 10:00'
  return value.replace('T', ' ').replace('+08:00', '').slice(0, 16)
}
