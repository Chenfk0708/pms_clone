import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type CardVerificationData,
  type CardVerificationRow,
  checkCardVerificationTicket,
  loadCardVerificationData,
} from '../services/cardVerification'
import './CardVerificationPage.css'

const defaultFilters = {
  pageNum: 1,
  pageSize: 20,
  ticketItemVerifyState: 1,
}

const tableColumns = [
  '卡券码',
  '类目',
  '商品名称',
  '卡券名称',
  '用户昵称',
  '用户手机',
  '价格',
  '核销人',
  '核销时间',
  '相关订单',
  '状态',
  '操作',
]

export function CardVerificationPage() {
  const [code, setCode] = useState('')
  const [data, setData] = useState<CardVerificationData | null>(null)
  const [rows, setRows] = useState<CardVerificationRow[]>([])
  const [selectedRow, setSelectedRow] = useState<CardVerificationRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [dataNotice, setDataNotice] = useState('')
  const [actionNotice, setActionNotice] = useState('')
  const requestRef = useRef(0)

  async function requestData(reason = '刷新') {
    const requestId = requestRef.current + 1
    requestRef.current = requestId
    setLoading(true)
    setError('')
    setValidationError('')
    setDataNotice(reason === '刷新' ? '正在刷新核销记录' : '正在加载核销记录')

    try {
      const result = await loadCardVerificationData(defaultFilters)
      if (requestRef.current !== requestId) return
      setData(result)
      setRows(result.rows)
      setDataNotice('核销记录已更新')
    } catch (caught) {
      if (requestRef.current !== requestId) return
      const message = caught instanceof Error ? caught.message : String(caught)
      setError(message || '核销记录加载失败')
      setDataNotice('核销记录加载失败')
      setRows([])
    } finally {
      if (requestRef.current === requestId) setLoading(false)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void requestData('加载')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  const contract = useMemo(() => {
    return {
      provider: data?.provider ?? 'mock',
      mode: data?.mode ?? 'success',
      traceId: data?.traceId ?? '',
      requestBody: data ? JSON.stringify(data.requestBody) : '',
    }
  }, [data])

  async function submitVerification() {
    const trimmedCode = code.trim()
    setActionNotice('')
    setValidationError('')

    if (!trimmedCode) {
      setValidationError('请输入卡券码')
      return
    }

    setLoading(true)
    try {
      const result = await checkCardVerificationTicket(trimmedCode, String(data?.requestBody.campId ?? ''))
      if (result.row) {
        const verifiedRow = result.row
        setRows((current) => {
          const withoutDuplicate = current.filter((row) => row.ticketNo !== verifiedRow.ticketNo)
          return [verifiedRow, ...withoutDuplicate]
        })
      }
      setActionNotice(`核销成功：${trimmedCode}`)
      setCode('')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught)
      setValidationError(message || '卡券核销失败')
    } finally {
      setLoading(false)
    }
  }

  function exportRecords() {
    setValidationError('')
    setActionNotice(`导出任务已创建，共 ${rows.length} 条核销记录`)
  }

  function nextPage() {
    if (!data?.pagination.hasNextPage) {
      setActionNotice('已经是最后一页')
      return
    }
    setActionNotice(`已切换到第 ${data.pagination.page + 1} 页`)
  }

  const total = data?.pagination.total ?? rows.length

  return (
    <div className="card-verify-page" aria-label="卡券核销">
      <h1 className="sr-only-heading">卡券核销</h1>
      <span
        data-testid="card-verification-service-contract"
        data-provider={contract.provider}
        data-mode={contract.mode}
        data-trace-id={contract.traceId}
        data-request-body={contract.requestBody}
        hidden
      />

      <section className="card-verify-entry" aria-label="卡券核销入口">
        <input
          value={code}
          placeholder="请输入卡券码"
          disabled={loading}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void submitVerification()
          }}
        />
        <button type="button" disabled={loading} onClick={() => void submitVerification()}>
          核 销
        </button>
        <button type="button" className="card-verify-secondary" disabled={loading} onClick={() => void requestData('刷新')}>
          刷新
        </button>
      </section>

      <div className="card-verify-feedback">
        {validationError ? (
          <div className="card-verify-alert" role="alert">
            {validationError}
          </div>
        ) : null}
        <div className="card-verify-status" role="status" aria-label="卡券核销数据状态" aria-live="polite">
          {loading ? '正在处理，请稍候' : dataNotice || '核销记录已更新'}
        </div>
        {actionNotice ? (
          <div className="card-verify-status card-verify-status--action" role="status" aria-label="卡券核销操作反馈">
            {actionNotice}
          </div>
        ) : null}
      </div>

      <section className="card-verify-records" aria-label="核销记录">
        <header className="card-verify-records__head">
          <h2>核销记录</h2>
          <button type="button" disabled={loading || rows.length === 0} onClick={exportRecords}>
            导出明细
          </button>
        </header>

        {error ? (
          <div className="card-verify-error" role="status" aria-label="卡券核销错误状态">
            <strong>核销记录加载失败</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void requestData('重新加载')}>
              重新加载
            </button>
          </div>
        ) : (
          <div className="card-verify-table" aria-label="卡券核销记录表格">
            <div className="card-verify-table__head">
              {tableColumns.map((column) => (
                <div key={column}>{column}</div>
              ))}
            </div>
            {rows.length > 0 ? (
              rows.map((row) => (
                <div className="card-verify-table__row" key={row.id}>
                  <div>{row.ticketNo}</div>
                  <div>{row.category}</div>
                  <div>{row.productName}</div>
                  <div>{row.ticketName}</div>
                  <div>{row.userName}</div>
                  <div>{row.userMobile}</div>
                  <div>{row.price}</div>
                  <div>{row.verifier}</div>
                  <div>{row.verifiedAt}</div>
                  <div>{row.orderNo}</div>
                  <div>
                    <span className="card-verify-tag">{row.status}</span>
                  </div>
                  <div>
                    <button type="button" className="card-verify-link" onClick={() => setSelectedRow(row)}>
                      查看详情 {row.ticketNo}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card-verify-empty" role="status" aria-label="卡券核销空态">
                <span className="card-verify-empty__icon" aria-hidden="true" />
                <strong>暂无符合条件的核销记录</strong>
              </div>
            )}
          </div>
        )}
      </section>

      <footer className="card-verify-pagination" aria-label="卡券核销分页">
        <span>
          第 {data?.pagination.page ?? 1} 页 / 共 {total} 条
        </span>
        <button type="button" disabled={loading} onClick={nextPage}>
          下一页
        </button>
      </footer>

      {selectedRow ? (
        <div className="card-verify-drawer-mask" role="presentation" onMouseDown={() => setSelectedRow(null)}>
          <aside
            className="card-verify-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="卡券核销详情"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <strong>卡券核销详情</strong>
              <button type="button" aria-label="关闭卡券核销详情" onClick={() => setSelectedRow(null)}>
                ×
              </button>
            </header>
            <dl>
              <div>
                <dt>卡券码</dt>
                <dd>{selectedRow.ticketNo}</dd>
              </div>
              <div>
                <dt>商品名称</dt>
                <dd>{selectedRow.productName}</dd>
              </div>
              <div>
                <dt>卡券名称</dt>
                <dd>{selectedRow.ticketName}</dd>
              </div>
              <div>
                <dt>相关订单</dt>
                <dd>{selectedRow.orderNo}</dd>
              </div>
              <div>
                <dt>核销时间</dt>
                <dd>{selectedRow.verifiedAt}</dd>
              </div>
              <div>
                <dt>核销人</dt>
                <dd>{selectedRow.verifier}</dd>
              </div>
            </dl>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
