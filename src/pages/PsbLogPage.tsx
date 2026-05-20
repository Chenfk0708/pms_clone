import { useEffect, useMemo, useState } from 'react'
import {
  createDefaultPsbLogQuery,
  fetchPsbLogPageData,
  psbLogBizTypeOptions,
  psbLogStateOptions,
  resolvePsbLogRuntimeConfig,
  retryPsbLogReport,
  type PsbLogMockState,
  type PsbLogOption,
  type PsbLogQuery,
  type PsbLogRow,
  type PsbLogServiceResult,
} from '../services/psbLog'
import './PsbLogPage.css'

const tableColumns = [
  '姓名',
  '手机号',
  '证件号码',
  '房间号',
  '订单来源',
  '订单号',
  '旅客云订单号',
  '上报时间',
  '上报类型',
  '上报状态',
  '备注',
]

type OpenPanel = 'date' | 'bizType' | 'state' | null
type PageViewState = 'loading' | 'success' | 'empty' | 'error'
type DraftFilters = Pick<
  PsbLogQuery,
  'storeId' | 'keyword' | 'bizType' | 'state' | 'startDate' | 'endDate'
>

export function PsbLogPage() {
  const runtime = useMemo(() => resolvePsbLogRuntimeConfig(window.location), [])
  const defaults = useMemo(() => createDefaultPsbLogQuery(window.location), [])
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
    storeId: '',
    keyword: '',
    bizType: '',
    state: '',
    startDate: '',
    endDate: '',
  })
  const [appliedFilters, setAppliedFilters] = useState<DraftFilters>({
    storeId: '',
    keyword: '',
    bizType: '',
    state: '',
    startDate: '',
    endDate: '',
  })
  const [reloadToken, setReloadToken] = useState(0)
  const [statusMessage, setStatusMessage] = useState('正在加载上报日志')
  const [error, setError] = useState('')
  const [result, setResult] = useState<PsbLogServiceResult | null>(null)
  const [selectedLog, setSelectedLog] = useState<PsbLogRow | null>(null)
  const [retryingLogId, setRetryingLogId] = useState('')

  const query = useMemo<PsbLogQuery>(
    () => ({
      provider: runtime.provider,
      mockState: runtime.mockState,
      campId: defaults.campId,
      page: defaults.page,
      pageSize: defaults.pageSize,
      ...appliedFilters,
    }),
    [appliedFilters, defaults.campId, defaults.page, defaults.pageSize, runtime.mockState, runtime.provider],
  )

  useEffect(() => {
    function closePanelsOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenPanel(null)
      }
    }

    window.addEventListener('keydown', closePanelsOnEscape)
    return () => window.removeEventListener('keydown', closePanelsOnEscape)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    setError('')
    setSelectedLog(null)
    fetchPsbLogPageData(query, controller.signal)
      .then((nextResult) => {
        setResult(nextResult)
        setStatusMessage(
          nextResult.view.rows.length > 0
            ? appliedFiltersChanged(appliedFilters)
              ? '已按筛选条件刷新上报日志'
              : `已加载 ${nextResult.view.rows.length} 条上报日志`
            : '暂无上报日志',
        )
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setResult(null)
        setError(caught instanceof Error ? caught.message : '上报日志加载失败，请稍后重试')
      })

    return () => controller.abort()
  }, [appliedFilters, query, reloadToken])

  const stores = result?.view.stores ?? [
    { label: '全部门店', value: '' },
    { label: '天鹅会宿公寓(前海壹方城宝安中心店)', value: '1796425098638573570' },
  ]
  const rows = result?.view.rows ?? []
  const provider = result?.diagnostics.provider ?? runtime.provider ?? 'mock'
  const viewState: PageViewState = error
    ? 'error'
    : result
      ? rows.length > 0
        ? 'success'
        : 'empty'
      : 'loading'

  const selectedBizType = readSelectedOption(psbLogBizTypeOptions, draftFilters.bizType)
  const selectedState = readSelectedOption(psbLogStateOptions, draftFilters.state)
  const dateLabel = buildDateLabel(draftFilters.startDate, draftFilters.endDate)

  function applyQuery() {
    setOpenPanel(null)
    setAppliedFilters({ ...draftFilters })
  }

  function reset() {
    const nextFilters: DraftFilters = {
      storeId: '',
      keyword: '',
      bizType: '',
      state: '',
      startDate: '',
      endDate: '',
    }

    setOpenPanel(null)
    setDraftFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setStatusMessage('筛选条件已重置')
  }

  function refresh() {
    setReloadToken((current) => current + 1)
  }

  async function handleRetrySelectedLog() {
    if (!selectedLog) return

    setRetryingLogId(selectedLog.id)
    setError('')
    try {
      const nextLog = await retryPsbLogReport(
        selectedLog,
        {
          campId: defaults.campId,
          provider: query.provider,
          mockState: runtime.mockState as PsbLogMockState | undefined,
        },
      )
      setSelectedLog(nextLog)
      setResult((current) =>
        current
          ? {
              ...current,
              view: {
                ...current.view,
                rows: current.view.rows.map((row) => (row.id === nextLog.id ? nextLog : row)),
              },
            }
          : current,
      )
      setStatusMessage(`订单 ${nextLog.orderNo} 已重新上报`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '重新上报失败，请稍后重试')
    } finally {
      setRetryingLogId('')
    }
  }

  return (
    <div className="psb-log-page" data-provider={provider} data-view-state={viewState}>
      <h1 className="psb-log-title">上报日志</h1>
      <span className="psb-log-version">版本号：v4.10.7</span>

      <section className="psb-log-panel" aria-label="上报日志">
        <div className="psb-log-store-row" role="radiogroup" aria-label="门店范围">
          {stores.map((store) => (
            <label
              key={store.value || 'all'}
              className={`psb-log-store${draftFilters.storeId === store.value ? ' is-active' : ''}`}
            >
              <input
                type="radio"
                name="psb-store"
                aria-label={store.label}
                checked={draftFilters.storeId === store.value}
                onChange={() => setDraftFilters((current) => ({ ...current, storeId: store.value }))}
              />
              <span>{store.label}</span>
            </label>
          ))}
        </div>

        <div className="psb-log-toolbar">
          <label className="psb-log-field psb-log-field--keyword">
            <span>搜索</span>
            <input
              aria-label="搜索"
              value={draftFilters.keyword}
              onChange={(event) =>
                setDraftFilters((current) => ({ ...current, keyword: event.target.value }))
              }
              placeholder="请输入订单号/手机号/房号"
            />
          </label>

          <div className="psb-log-field psb-log-field--date">
            <span>上报时间</span>
            <button
              type="button"
              className={`psb-log-control-button${openPanel === 'date' ? ' is-open' : ''}`}
              aria-label={`上报时间 ${dateLabel}`}
              onClick={() => setOpenPanel((current) => (current === 'date' ? null : 'date'))}
            >
              <span>{dateLabel}</span>
              <i aria-hidden="true" />
            </button>
            {openPanel === 'date' ? (
              <DatePanel
                startDate={draftFilters.startDate}
                endDate={draftFilters.endDate}
                onChange={(field, value) =>
                  setDraftFilters((current) => ({ ...current, [field]: value }))
                }
                onApply={() => setOpenPanel(null)}
                onClear={() =>
                  setDraftFilters((current) => ({ ...current, startDate: '', endDate: '' }))
                }
              />
            ) : null}
          </div>

          <SelectPanel
            label="上报类型"
            selected={selectedBizType}
            options={psbLogBizTypeOptions}
            open={openPanel === 'bizType'}
            onToggle={() => setOpenPanel((current) => (current === 'bizType' ? null : 'bizType'))}
            onSelect={(value) => {
              setDraftFilters((current) => ({ ...current, bizType: value }))
              setOpenPanel(null)
            }}
          />

          <SelectPanel
            label="上报状态"
            selected={selectedState}
            options={psbLogStateOptions}
            open={openPanel === 'state'}
            onToggle={() => setOpenPanel((current) => (current === 'state' ? null : 'state'))}
            onSelect={(value) => {
              setDraftFilters((current) => ({ ...current, state: value }))
              setOpenPanel(null)
            }}
          />

          <div className="psb-log-actions">
            <button
              type="button"
              className="psb-log-button is-primary"
              onClick={applyQuery}
              disabled={viewState === 'loading'}
            >
              查询
            </button>
            <button
              type="button"
              className="psb-log-button is-ghost"
              onClick={reset}
              disabled={viewState === 'loading'}
            >
              重置
            </button>
          </div>
        </div>

        {error ? (
          <div role="alert" className="psb-log-alert">
            <span>{error}</span>
            <button type="button" className="psb-log-inline-button" onClick={refresh}>
              重试
            </button>
          </div>
        ) : null}

        <div role="status" className="psb-log-status">
          {error ? '' : statusMessage}
        </div>

        <section className="psb-log-table" aria-label="上报日志列表">
          <div className="psb-log-table__head" role="row">
            {tableColumns.map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>

          {viewState === 'loading' ? (
            <div className="psb-log-table__feedback">正在加载上报日志...</div>
          ) : null}

          {viewState === 'empty' ? (
            <div className="psb-log-table__feedback">暂无上报日志</div>
          ) : null}

          {rows.map((row) => (
            <div className="psb-log-table__row" role="row" key={row.id}>
              <div role="cell">{row.guestName}</div>
              <div role="cell">{row.phone}</div>
              <div role="cell">{row.idCard}</div>
              <div role="cell">{row.roomNo}</div>
              <div role="cell">{row.orderSource}</div>
              <div role="cell">
                <button
                  type="button"
                  className="psb-log-link-button"
                  aria-label={`查看订单 ${row.orderNo}`}
                  onClick={() => setSelectedLog(row)}
                >
                  {row.orderNo}
                </button>
              </div>
              <div role="cell">{row.channelOrderNo}</div>
              <div role="cell">{row.reportTime}</div>
              <div role="cell">{row.bizTypeLabel}</div>
              <div role="cell">
                <span className={`psb-log-state-badge is-${row.stateCode === '1' ? 'success' : 'error'}`}>
                  {row.stateLabel}
                </span>
              </div>
              <div role="cell">{row.remark}</div>
            </div>
          ))}
        </section>
      </section>

      {selectedLog ? (
        <aside className="psb-log-drawer" role="dialog" aria-modal="true" aria-label="上报详情">
          <header>
            <div>
              <strong>上报详情</strong>
              <span>{selectedLog.orderNo}</span>
            </div>
            <button type="button" aria-label="关闭详情" onClick={() => setSelectedLog(null)}>
              ×
            </button>
          </header>

          <dl>
            <div>
              <dt>姓名</dt>
              <dd>{selectedLog.guestName}</dd>
            </div>
            <div>
              <dt>手机号</dt>
              <dd>{selectedLog.phone}</dd>
            </div>
            <div>
              <dt>上报类型</dt>
              <dd>{selectedLog.bizTypeLabel}</dd>
            </div>
            <div>
              <dt>上报状态</dt>
              <dd>{selectedLog.stateLabel}</dd>
            </div>
            <div>
              <dt>上报时间</dt>
              <dd>{selectedLog.reportTime}</dd>
            </div>
            <div className="is-full">
              <dt>公安回执</dt>
              <dd>{selectedLog.receiptMessage}</dd>
            </div>
          </dl>

          <footer>
            {selectedLog.stateCode === '0' ? (
              <button
                type="button"
                className="psb-log-button is-primary"
                onClick={handleRetrySelectedLog}
                disabled={retryingLogId === selectedLog.id}
              >
                {retryingLogId === selectedLog.id ? '重新上报中...' : '重新上报'}
              </button>
            ) : null}
            <button type="button" className="psb-log-button is-ghost" onClick={() => setSelectedLog(null)}>
              关闭
            </button>
          </footer>
        </aside>
      ) : null}
    </div>
  )
}

function SelectPanel({
  label,
  selected,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string
  selected: PsbLogOption | null
  options: PsbLogOption[]
  open: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="psb-log-field psb-log-field--select">
      <span>{label}</span>
      <button
        type="button"
        className={`psb-log-control-button${open ? ' is-open' : ''}`}
        aria-label={`${label} ${selected?.label ?? '请选择'}`}
        onClick={onToggle}
      >
        <span>{selected?.label ?? '请选择'}</span>
        <i aria-hidden="true" />
      </button>
      {open ? (
        <div className="psb-log-dropdown" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected?.value === option.value}
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DatePanel({
  startDate,
  endDate,
  onChange,
  onApply,
  onClear,
}: {
  startDate: string
  endDate: string
  onChange: (field: 'startDate' | 'endDate', value: string) => void
  onApply: () => void
  onClear: () => void
}) {
  return (
    <div className="psb-log-calendar" role="dialog" aria-label="上报时间">
      <label>
        <span>开始日期</span>
        <input
          aria-label="开始日期"
          type="date"
          value={startDate}
          onChange={(event) => onChange('startDate', event.target.value)}
        />
      </label>
      <label>
        <span>结束日期</span>
        <input
          aria-label="结束日期"
          type="date"
          value={endDate}
          onChange={(event) => onChange('endDate', event.target.value)}
        />
      </label>
      <footer>
        <button type="button" className="psb-log-button is-ghost" onClick={onClear}>
          清空日期
        </button>
        <button type="button" className="psb-log-button is-primary" onClick={onApply}>
          应用日期
        </button>
      </footer>
    </div>
  )
}

function readSelectedOption(options: PsbLogOption[], value: string) {
  return options.find((option) => option.value === value) ?? null
}

function buildDateLabel(startDate: string, endDate: string) {
  if (!startDate && !endDate) return '请选择'
  if (startDate && endDate) return `${startDate} 至 ${endDate}`
  return startDate || endDate
}

function appliedFiltersChanged(filters: DraftFilters) {
  return Boolean(
    filters.storeId ||
      filters.keyword ||
      filters.bizType ||
      filters.state ||
      filters.startDate ||
      filters.endDate,
  )
}
