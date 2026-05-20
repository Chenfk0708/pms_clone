import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  comprehensiveMonthlyDetailColumns,
  createDefaultComprehensiveMonthlyReportQuery,
  findComprehensiveMonthlyReportRow,
  loadComprehensiveMonthlyReportList,
  readComprehensiveMonthlySelection,
  resolveComprehensiveMonthlyRuntimeConfig,
  runComprehensiveMonthlyReportAction,
  type ComprehensiveMonthlyReportAction,
  type ComprehensiveMonthlyReportListData,
} from '../services/comprehensiveMonthlyReport'
import './ComprehensiveMonthlyReportPage.css'

type ToastState = {
  id: number
  text: string
}

export function ComprehensiveMonthlyReportPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/Monthly')) {
    return <ComprehensiveMonthlyDetailPage key={`${location.pathname}${location.search}`} />
  }

  return <ComprehensiveMonthlyListPage key={`${location.pathname}${location.search}`} />
}

function ComprehensiveMonthlyListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const runtime = resolveComprehensiveMonthlyRuntimeConfig(location.search)
  const [pageSize, setPageSize] = useState(20)
  const [reloadKey, setReloadKey] = useState(0)
  const [view, setView] = useState<ComprehensiveMonthlyReportListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)

  const requestQuery = createDefaultComprehensiveMonthlyReportQuery({
    pageSize,
    provider: runtime.provider,
    mockState: runtime.mockState,
  })

  useEffect(() => {
    const controller = new AbortController()
    const nextQuery = createDefaultComprehensiveMonthlyReportQuery({
      pageSize,
      provider: runtime.provider,
      mockState: runtime.mockState,
    })

    loadComprehensiveMonthlyReportList(nextQuery, controller.signal)
      .then((nextView) => {
        setView(nextView)
      })
      .catch((nextError: unknown) => {
        if (controller.signal.aborted) return
        setView(null)
        setError(nextError instanceof Error ? nextError.message : '综合月报加载失败，请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [location.search, pageSize, reloadKey, runtime.mockState, runtime.provider])

  function showToast(text: string) {
    const id = window.setTimeout(() => setToast(null), 2200)
    setToast({ id, text })
  }

  function retry() {
    setLoading(true)
    setError('')
    setView(null)
    setReloadKey((current) => current + 1)
  }

  function togglePageSize() {
    const nextPageSize = pageSize === 20 ? 50 : 20
    setLoading(true)
    setError('')
    setPageSize(nextPageSize)
    showToast(`每页条数已切换为 ${nextPageSize}`)
  }

  return (
    <div className="comprehensive-monthly-page">
      <ComprehensiveMonthlyDiagnostics view={view} requestBody={requestQuery} responseState={view?.state ?? runtime.mockState} />

      {toast ? (
        <div key={toast.id} className="comprehensive-toast" role="status">
          {toast.text}
        </div>
      ) : null}

      <section className="comprehensive-card">
        <header className="comprehensive-card-title">
          <h1>综合月报</h1>
        </header>

        {error ? (
          <div className="comprehensive-alert" role="alert">
            <strong>综合月报加载失败</strong>
            <span>{error}</span>
            <button data-testid="comprehensive-monthly-retry" type="button" onClick={retry}>
              重试
            </button>
          </div>
        ) : null}

        <div className="comprehensive-table-shell">
          <table
            className="comprehensive-report-table"
            aria-label="综合月报列表"
            aria-busy={loading}
            data-testid="comprehensive-monthly-report-table"
          >
            <thead>
              <tr>
                <th>时段</th>
                <th>统计周期</th>
                <th>营业收入</th>
                <th>入住率OCC</th>
                <th>平均房价ADR</th>
                <th>平均客房收益REVPAR</th>
                <th>生成时间</th>
                <th>生成人</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9}>
                    <div className="comprehensive-loading">数据加载中...</div>
                  </td>
                </tr>
              ) : view && view.rows.length > 0 ? (
                view.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.monthLabel}</td>
                    <td>{row.rangeLabel}</td>
                    <td>{row.revenueText}</td>
                    <td>{row.occText}</td>
                    <td>{row.adrText}</td>
                    <td>{row.revParText}</td>
                    <td>{row.generatedAtText}</td>
                    <td>{row.creatorText}</td>
                    <td>
                      <button
                        data-testid="comprehensive-monthly-view-report"
                        type="button"
                        className="comprehensive-link-button"
                        onClick={() =>
                          navigate(`/statistics/Comprehensive/Monthly?startDate=${row.startDate}&endDate=${row.endDate}`)
                        }
                      >
                        查看报表
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9}>
                    <div className="comprehensive-empty-state" data-testid="comprehensive-monthly-empty">
                      <div aria-hidden="true" />
                      <strong>暂无月报数据</strong>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <nav className="comprehensive-pagination" aria-label="分页">
          <span data-testid="comprehensive-monthly-pagination-summary">
            第 {view?.rows.length ? 1 : 0}-{view?.rows.length ?? 0} 条 / 总共 {view?.pagination.total ?? 0} 条
          </span>
          <button type="button" aria-label="上一页" disabled>
            ‹
          </button>
          <button type="button" className="is-current">
            1
          </button>
          <button type="button" aria-label="下一页" disabled>
            ›
          </button>
          <button data-testid="comprehensive-monthly-page-size-toggle" type="button" onClick={togglePageSize}>
            {pageSize} 条/页
          </button>
        </nav>
      </section>
    </div>
  )
}

function ComprehensiveMonthlyDetailPage() {
  const location = useLocation()
  const runtime = resolveComprehensiveMonthlyRuntimeConfig(location.search)
  const selection = readComprehensiveMonthlySelection(location.search)
  const [reloadKey, setReloadKey] = useState(0)
  const [view, setView] = useState<ComprehensiveMonthlyReportListData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<ToastState | null>(null)
  const [actionLoading, setActionLoading] = useState<ComprehensiveMonthlyReportAction | null>(null)

  const requestQuery = createDefaultComprehensiveMonthlyReportQuery({
    provider: runtime.provider,
    mockState: runtime.mockState,
  })

  useEffect(() => {
    const controller = new AbortController()
    const nextQuery = createDefaultComprehensiveMonthlyReportQuery({
      provider: runtime.provider,
      mockState: runtime.mockState,
    })

    loadComprehensiveMonthlyReportList(nextQuery, controller.signal)
      .then((nextView) => {
        setView(nextView)
      })
      .catch((nextError: unknown) => {
        if (controller.signal.aborted) return
        setView(null)
        setError(nextError instanceof Error ? nextError.message : '综合月报加载失败，请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => controller.abort()
  }, [location.search, reloadKey, runtime.mockState, runtime.provider])

  const currentRow = findComprehensiveMonthlyReportRow(view?.rows ?? [], selection)

  function showToast(text: string) {
    const id = window.setTimeout(() => setToast(null), 2200)
    setToast({ id, text })
  }

  function retry() {
    setLoading(true)
    setError('')
    setView(null)
    setReloadKey((current) => current + 1)
  }

  function runAction(action: ComprehensiveMonthlyReportAction) {
    if (!view) return
    setActionLoading(action)
    runComprehensiveMonthlyReportAction(action, view.provider)
      .then((result) => {
        showToast(result.message)
      })
      .catch((nextError: unknown) => {
        showToast(nextError instanceof Error ? nextError.message : '操作执行失败，请稍后重试')
      })
      .finally(() => {
        setActionLoading(null)
      })
  }

  return (
    <div className="comprehensive-monthly-page comprehensive-monthly-detail-page">
      <ComprehensiveMonthlyDiagnostics view={view} requestBody={requestQuery} responseState={view?.state ?? runtime.mockState} />

      {toast ? (
        <div key={toast.id} className="comprehensive-toast" role="status">
          {toast.text}
        </div>
      ) : null}

      <section className="comprehensive-card">
        <header className="comprehensive-detail-bar">
          <div className="comprehensive-breadcrumb">
            <span>综合月报 /</span>
            <strong>综合月报表（住宿）</strong>
          </div>
          <div className="comprehensive-detail-actions">
            <button
              data-testid="comprehensive-monthly-refresh-action"
              type="button"
              disabled={loading || actionLoading !== null}
              onClick={() => runAction('refresh')}
            >
              {actionLoading === 'refresh' ? '更新中...' : '更新报告'}
            </button>
            <button
              data-testid="comprehensive-monthly-print-action"
              type="button"
              disabled={loading || actionLoading !== null}
              onClick={() => runAction('print')}
            >
              {actionLoading === 'print' ? '创建中...' : '打印'}
            </button>
          </div>
        </header>

        <section className="comprehensive-detail" aria-label="综合月报表固化详情" data-testid="comprehensive-monthly-detail">
          <h1>综合月报表（固化）</h1>

          {error ? (
            <div className="comprehensive-alert" role="alert">
              <strong>综合月报加载失败</strong>
              <span>{error}</span>
              <button data-testid="comprehensive-monthly-retry" type="button" onClick={retry}>
                重试
              </button>
            </div>
          ) : null}

          {loading ? (
            <div className="comprehensive-loading comprehensive-loading--detail">报告加载中...</div>
          ) : currentRow ? (
            <>
              <div className="comprehensive-meta-row">
                <span>企业/门店：天鹅会宿公寓（前海壹方城宝安中心店）</span>
                <span>
                  营业月份：<strong>{currentRow.monthLabel}</strong>
                </span>
                <span>
                  统计周期：<strong>{currentRow.startDate} ~ {currentRow.endDate}</strong>
                </span>
                <span>
                  生成时间：<strong>{currentRow.generatedAtText.replace('\n', ' ')}</strong>
                </span>
              </div>

              <table className="comprehensive-summary-table">
                <thead>
                  <tr>
                    <th colSpan={2}>营业数据</th>
                    <th colSpan={2}>经营指标</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRow.summaryPairs.map((pair) => (
                    <tr key={`${pair.leftLabel}-${pair.rightLabel}`}>
                      <td>{pair.leftLabel}</td>
                      <td>{pair.leftValue}</td>
                      <td>{pair.rightLabel}</td>
                      <td>{pair.rightValue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="comprehensive-detail-table-wrap">
                <table className="comprehensive-detail-table">
                  <thead>
                    <tr>
                      {comprehensiveMonthlyDetailColumns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRow.detailRows.map((row) => (
                      <tr key={row.id}>
                        {row.cells.map((cell, index) => (
                          <td key={`${row.id}-${index}`}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="comprehensive-empty-state" data-testid="comprehensive-monthly-empty">
              <div aria-hidden="true" />
              <strong>暂无月报详情</strong>
            </div>
          )}
        </section>
      </section>
    </div>
  )
}

function ComprehensiveMonthlyDiagnostics({
  view,
  requestBody,
  responseState,
}: {
  view: ComprehensiveMonthlyReportListData | null
  requestBody: Record<string, unknown>
  responseState: string
}) {
  return (
    <span
      className="comprehensive-monthly-service-state"
      data-testid="comprehensive-monthly-service-state"
      data-provider={view?.provider ?? 'mock'}
      data-endpoint={view?.endpoint ?? 'https://hudson-prod.localhome.cn/report/monthly/page/get'}
      data-request-body={JSON.stringify(view?.requestBody ?? requestBody)}
      data-trace-id={view?.traceId ?? ''}
      data-response-state={responseState}
    />
  )
}
