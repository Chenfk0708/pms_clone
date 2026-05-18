import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createPriceLogExportRequest,
  fetchPriceLogs,
  getDefaultPriceLogAdjustmentOptions,
  getDefaultPriceLogChannelOptions,
  resolvePriceLogQueryFromLocation,
  type PriceLogOption,
  type PriceLogQuery,
  type PriceLogRow,
  type PriceLogViewModel,
} from '../services/priceLogs'
import './PriceLogPage.css'

const columns = ['房型', '价格日期', '操作内容', '调整方式', '同步渠道', '渠道价格', '操作人', '操作时间', '操作']
const PAGE_SIZE = 20

export function PriceLogPage() {
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [adjustmentMode, setAdjustmentMode] = useState('手动调整')
  const [channel, setChannel] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [openSelect, setOpenSelect] = useState<'adjustment' | 'channel' | null>(null)
  const [adjustmentStart, setAdjustmentStart] = useState('')
  const [adjustmentEnd, setAdjustmentEnd] = useState('')
  const [operationStart, setOperationStart] = useState('')
  const [operationEnd, setOperationEnd] = useState('')
  const [operator, setOperator] = useState('')
  const [submittedOperator, setSubmittedOperator] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('调价日志已加载')
  const [error, setError] = useState('')
  const [data, setData] = useState<PriceLogViewModel | null>(null)
  const [selectedLog, setSelectedLog] = useState<PriceLogRow | null>(null)

  const campId = useMemo(() => resolveCampId(), [])
  const locationQuery = useMemo(() => resolvePriceLogQueryFromLocation(window.location), [])
  const channelOptions = data?.channelOptions ?? getDefaultPriceLogChannelOptions()
  const adjustmentOptions = data?.adjustmentOptions ?? getDefaultPriceLogAdjustmentOptions()

  const currentQuery = useMemo<PriceLogQuery>(
    () => ({
      provider: locationQuery.provider,
      mockState: locationQuery.mockState,
      campId: campId || '1796067693589061634',
      keyword: submittedKeyword,
      adjustmentMode,
      channelId: channel,
      adjustmentStart,
      adjustmentEnd,
      operationStart,
      operationEnd,
      operator: submittedOperator,
      page: 1,
      pageSize: PAGE_SIZE,
    }),
    [
      adjustmentEnd,
      adjustmentMode,
      adjustmentStart,
      campId,
      channel,
      locationQuery.mockState,
      locationQuery.provider,
      operationEnd,
      operationStart,
      submittedKeyword,
      submittedOperator,
    ],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setIsLoading(true)
      setError('')
    })

    fetchPriceLogs(currentQuery, controller.signal)
      .then((result) => {
        setData(result.view)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setData(null)
        setError(requestError instanceof Error ? requestError.message : '调价日志数据加载失败，请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [currentQuery, refreshTick])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setOpenSelect(null)
    setSubmittedKeyword(keyword.trim())
    setSubmittedOperator(operator.trim())
    setMessage('查询完成')
  }

  function handleReset() {
    setKeyword('')
    setSubmittedKeyword('')
    setAdjustmentMode('手动调整')
    setChannel('')
    setAdjustmentStart('')
    setAdjustmentEnd('')
    setOperationStart('')
    setOperationEnd('')
    setOperator('')
    setSubmittedOperator('')
    setOpenSelect(null)
    setSelectedLog(null)
    setError('')
    setRefreshTick((tick) => tick + 1)
    setMessage('筛选条件已重置')
  }

  function handleRefresh() {
    setOpenSelect(null)
    setRefreshTick((tick) => tick + 1)
    setMessage('已刷新')
  }

  function handleExport() {
    const exportRequest = createPriceLogExportRequest(currentQuery)
    window.localStorage.setItem('pms.priceLog.lastExportRequest', JSON.stringify(exportRequest))
    setMessage('导出任务已创建')
  }

  return (
    <div className="price-log-page">
      <section className="price-log-panel">
        <form className={`price-log-query${expanded ? ' is-expanded' : ''}`} aria-label="调价日志筛选" onSubmit={handleSubmit}>
          <label className="price-log-field price-log-field--keyword">
            <span>日志关键词</span>
            <input
              type="text"
              aria-label="日志关键词"
              placeholder="搜索房型名称/房间号/渠道房源名称"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              disabled={isLoading}
            />
          </label>

          <div className="price-log-field price-log-field--adjustment">
            <span>调整方式</span>
            <PriceLogSelect
              ariaLabel={`调整方式 ${adjustmentMode}`}
              listLabel="调整方式"
              valueLabel={adjustmentMode}
              options={adjustmentOptions}
              open={openSelect === 'adjustment'}
              disabled={isLoading}
              onToggle={() => setOpenSelect(openSelect === 'adjustment' ? null : 'adjustment')}
              onSelect={(option) => {
                setAdjustmentMode(option.label)
                setOpenSelect(null)
              }}
            />
          </div>

          <div className="price-log-field price-log-field--channel">
            <span>渠道</span>
            <PriceLogSelect
              ariaLabel={`渠道 ${channelOptions.find((option) => option.value === channel)?.label ?? '请选择'}`}
              listLabel="渠道"
              valueLabel={channelOptions.find((option) => option.value === channel)?.label ?? '请选择'}
              options={channelOptions}
              open={openSelect === 'channel'}
              disabled={isLoading}
              optionClassName="price-log-options--channel"
              onToggle={() => setOpenSelect(openSelect === 'channel' ? null : 'channel')}
              onSelect={(option) => {
                setChannel(option.value)
                setOpenSelect(null)
              }}
            />
          </div>

          {expanded ? (
            <>
              <label className="price-log-field price-log-field--date price-log-field--adjust-time">
                <span>调整时间</span>
                <div className="price-log-date-range" role="group" aria-label="调整时间">
                  <input
                    aria-label="调整时间开始"
                    type="text"
                    placeholder="请选择"
                    value={adjustmentStart}
                    onChange={(event) => setAdjustmentStart(event.target.value)}
                    disabled={isLoading}
                  />
                  <span aria-hidden="true">→</span>
                  <input
                    aria-label="调整时间结束"
                    type="text"
                    placeholder="请选择"
                    value={adjustmentEnd}
                    onChange={(event) => setAdjustmentEnd(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </label>

              <label className="price-log-field price-log-field--date price-log-field--operation-date">
                <span>操作日期</span>
                <div className="price-log-date-range" role="group" aria-label="操作日期">
                  <input
                    aria-label="操作日期开始"
                    type="text"
                    placeholder="请选择"
                    value={operationStart}
                    onChange={(event) => setOperationStart(event.target.value)}
                    disabled={isLoading}
                  />
                  <span aria-hidden="true">→</span>
                  <input
                    aria-label="操作日期结束"
                    type="text"
                    placeholder="请选择"
                    value={operationEnd}
                    onChange={(event) => setOperationEnd(event.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </label>

              <label className="price-log-field price-log-field--operator">
                <span>操作人姓名</span>
                <input
                  aria-label="操作人姓名"
                  type="text"
                  placeholder="搜索操作人名称/手机号"
                  value={operator}
                  onChange={(event) => setOperator(event.target.value)}
                  disabled={isLoading}
                />
              </label>
            </>
          ) : null}

          <div className="price-log-query__actions">
            <button type="button" onClick={handleExport} disabled={isLoading}>
              导出
            </button>
            <button type="button" onClick={handleRefresh} disabled={isLoading}>
              刷新
            </button>
            <button type="button" onClick={handleReset} disabled={isLoading}>
              重 置
            </button>
            <button type="submit" className="is-primary" disabled={isLoading}>
              {isLoading ? '查询中' : '查 询'}
            </button>
            <button
              type="button"
              className="is-link"
              disabled={isLoading}
              onClick={() => {
                setExpanded((value) => !value)
                setOpenSelect(null)
              }}
            >
              {expanded ? '收起' : '展开'}
            </button>
          </div>
        </form>

        <div className="price-log-table" role="table" aria-label="调价日志列表" aria-busy={isLoading}>
          <div className="price-log-table__head" role="row">
            {columns.map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          {data?.rows.map((row) => (
            <div className="price-log-table__row" role="row" key={row.id}>
              <div role="cell">{row.roomType}</div>
              <div role="cell">{row.priceDate}</div>
              <div role="cell">{row.actionContent}</div>
              <div role="cell">{row.adjustmentMode}</div>
              <div role="cell">{row.channel}</div>
              <div role="cell">{row.channelPrice}</div>
              <div role="cell">{row.operator}</div>
              <div role="cell">{row.operationTime}</div>
              <div role="cell">
                <button type="button" onClick={() => setSelectedLog(row)} aria-label={`查看详情 ${row.id}`}>
                  查看详情
                </button>
              </div>
            </div>
          ))}
          {isLoading ? (
            <div className="price-log-empty">
              <div className="price-log-empty__icon" aria-hidden="true" />
              <span>正在加载</span>
            </div>
          ) : null}
          {!isLoading && !error && (!data || data.rows.length === 0) ? (
            <div className="price-log-empty">
              <div className="price-log-empty__icon" aria-hidden="true" />
              <span>暂无数据</span>
            </div>
          ) : null}
        </div>

        <div className="price-log-feedback" role="status" aria-label="调价日志操作反馈" aria-live="polite">
          {message}
          {data ? <span>；共 {data.pagination.total} 条</span> : null}
        </div>

        {error ? (
          <div className="price-log-error" role="alert" aria-label="调价日志数据错误">
            <span>{error}</span>
            <button type="button" onClick={handleRefresh} disabled={isLoading}>
              重试
            </button>
          </div>
        ) : null}
      </section>

      {selectedLog ? (
        <div className="price-log-dialog-backdrop" role="presentation">
          <section className="price-log-dialog" role="dialog" aria-modal="true" aria-label="调价日志详情">
            <header>
              <h2>调价日志详情</h2>
              <button type="button" onClick={() => setSelectedLog(null)} aria-label="关闭详情">
                ×
              </button>
            </header>
            <dl>
              <div>
                <dt>日志编号</dt>
                <dd>{selectedLog.id}</dd>
              </div>
              <div>
                <dt>房型</dt>
                <dd>{selectedLog.roomType}</dd>
              </div>
              <div>
                <dt>操作内容</dt>
                <dd>{selectedLog.actionContent}</dd>
              </div>
              <div>
                <dt>同步渠道</dt>
                <dd>{selectedLog.channel}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function PriceLogSelect({
  ariaLabel,
  listLabel,
  valueLabel,
  options,
  open,
  disabled,
  optionClassName,
  onToggle,
  onSelect,
}: {
  ariaLabel: string
  listLabel: string
  valueLabel: string
  options: PriceLogOption[]
  open: boolean
  disabled: boolean
  optionClassName?: string
  onToggle: () => void
  onSelect: (option: PriceLogOption) => void
}) {
  return (
    <div className="price-log-select">
      <button type="button" aria-haspopup="listbox" aria-label={ariaLabel} aria-expanded={open} onClick={onToggle} disabled={disabled}>
        {valueLabel}
      </button>
      {open ? (
        <div className={`price-log-options ${optionClassName ?? ''}`} role="listbox" aria-label={listLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.label === valueLabel}
              key={`${option.value}-${option.label}`}
              onClick={() => onSelect(option)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function resolveCampId() {
  const params = new URLSearchParams(window.location.search)
  const queryCampId = params.get('campId')
  if (queryCampId) return queryCampId

  for (const key of ['currentCamp', 'camp', 'pms.currentCamp', 'pms.currentCampId']) {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) continue

    try {
      const parsed = JSON.parse(rawValue) as { campId?: unknown; id?: unknown }
      const campId = parsed.campId ?? parsed.id
      if (typeof campId === 'string' && campId) return campId
      if (typeof campId === 'number') return String(campId)
    } catch {
      if (/^\d+$/.test(rawValue)) return rawValue
    }
  }

  return ''
}
