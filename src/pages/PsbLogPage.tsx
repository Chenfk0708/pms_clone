import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
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
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './PsbLogPage.css'

const tableColumns = [
  '姓名',
  '手机号',
  '证件号码',
  '房间号',
  '订单来源',
  '订单号',
  '路客云订单号',
  '上报时间',
  '上报类型',
  '上报状态',
  '备注',
]

const calendarWeekdays = ['一', '二', '三', '四', '五', '六', '日']

type OpenPanel = 'date' | 'bizType' | 'state' | null
type PageViewState = 'loading' | 'success' | 'empty' | 'error'
type DraftFilters = Pick<
  PsbLogQuery,
  'storeId' | 'keyword' | 'bizType' | 'state' | 'startDate' | 'endDate'
>

type CalendarMonth = {
  year: number
  month: number
  days: Array<{
    key: string
    label: number
    value: string
    isCurrentMonth: boolean
  }>
}

export function PsbLogPage() {
  const location = useLocation()
  const runtime = useMemo(
    () => resolvePsbLogRuntimeConfig(window.location),
    [location.pathname, location.search, location.hash],
  )
  const defaults = useMemo(
    () => createDefaultPsbLogQuery(window.location),
    [location.pathname, location.search, location.hash],
  )
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
      if (event.key === 'Escape') setOpenPanel(null)
    }

    window.addEventListener('keydown', closePanelsOnEscape)
    return () => window.removeEventListener('keydown', closePanelsOnEscape)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let ignore = false

    setError('')
    setSelectedLog(null)
    fetchPsbLogPageData(query, controller.signal)
      .then((nextResult) => {
        if (ignore) return
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
        if (ignore) return
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setResult(null)
        setError(caught instanceof Error ? caught.message : '上报日志加载失败，请稍后重试')
      })

    return () => {
      ignore = true
      controller.abort()
    }
  }, [appliedFilters, query, reloadToken])

  const fallbackStores = result?.view.stores ?? [
    { label: '全部门店', value: '' },
    { label: '当前门店', value: '1796425098638573570' },
  ]
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: fallbackStores.map((store) => ({ id: store.value || 'all', label: store.label })),
  })
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
      const nextLog = await retryPsbLogReport(selectedLog, {
        campId: defaults.campId,
        provider: query.provider,
        mockState: runtime.mockState as PsbLogMockState | undefined,
      })
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

      <section className="psb-log-panel" aria-label="上报日志">
        <StoreSelectControl
          className="psb-log-store-row"
          label="门店范围"
          options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
          value={draftFilters.storeId || 'all'}
          disabled={storeLoading}
          onChange={(storeId) => setDraftFilters((current) => ({ ...current, storeId: storeId === 'all' ? '' : storeId }))}
          settingsLabel="门店设置"
          onSettingsClick={() => setStatusMessage('请在门店信息页面维护公安上报关联门店')}
        />

        <div className="psb-log-toolbar">
          <label className="psb-log-field psb-log-field--keyword">
            <span>搜索：</span>
            <input
              aria-label="搜索"
              value={draftFilters.keyword}
              onChange={(event) => setDraftFilters((current) => ({ ...current, keyword: event.target.value }))}
              placeholder="请输入订单号/手机号/房号"
            />
          </label>

          <div className="psb-log-field psb-log-field--date">
            <span>上报时间：</span>
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
                onChange={(field, value) => setDraftFilters((current) => ({ ...current, [field]: value }))}
              />
            ) : null}
          </div>

          <SelectPanel
            label="上报类型："
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
            label="上报状态："
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
            <button type="button" className="psb-log-button is-primary" onClick={applyQuery} disabled={viewState === 'loading'}>
              查 询
            </button>
            <button type="button" className="psb-log-button is-ghost" onClick={reset} disabled={viewState === 'loading'}>
              重 置
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
            <div className="psb-log-table__feedback psb-log-table__feedback--empty">
              <div className="psb-log-empty-icon" aria-hidden="true">
                <span />
              </div>
              <p>暂无数据</p>
            </div>
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
              <div role="cell">{row.stateLabel}</div>
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
}: {
  startDate: string
  endDate: string
  onChange: (field: 'startDate' | 'endDate', value: string) => void
}) {
  const selectedDate = endDate || startDate || '2026-05-23'
  const baseDate = new Date(`${selectedDate}T00:00:00`)
  const leftMonth = createCalendarMonth(baseDate.getFullYear(), baseDate.getMonth())
  const rightDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1)
  const rightMonth = createCalendarMonth(rightDate.getFullYear(), rightDate.getMonth())

  function selectDate(value: string) {
    onChange('startDate', value)
    onChange('endDate', value)
  }

  return (
    <div className="psb-log-calendar" role="dialog" aria-label="上报时间">
      <CalendarMonthPanel month={leftMonth} selectedValue={selectedDate} onSelect={selectDate} />
      <CalendarMonthPanel month={rightMonth} selectedValue={selectedDate} onSelect={selectDate} />
    </div>
  )
}

function CalendarMonthPanel({
  month,
  selectedValue,
  onSelect,
}: {
  month: CalendarMonth
  selectedValue: string
  onSelect: (value: string) => void
}) {
  return (
    <section className="psb-log-calendar-month">
      <header>
        <button type="button" aria-label="上一月">
          ‹‹
        </button>
        <button type="button" aria-label="上个月">
          ‹
        </button>
        <strong>
          {month.year}年 {month.month + 1}月
        </strong>
        <button type="button" aria-label="下个月">
          ›
        </button>
        <button type="button" aria-label="下一月">
          ››
        </button>
      </header>

      <div className="psb-log-calendar-weekdays">
        {calendarWeekdays.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="psb-log-calendar-grid">
        {month.days.map((day) => (
          <button
            key={day.key}
            type="button"
            className={[
              'psb-log-calendar-day',
              day.isCurrentMonth ? '' : 'is-muted',
              day.value === selectedValue ? 'is-selected' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => selectDateIfCurrent(day, onSelect)}
          >
            {day.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function selectDateIfCurrent(
  day: CalendarMonth['days'][number],
  onSelect: (value: string) => void,
) {
  if (!day.isCurrentMonth) return
  onSelect(day.value)
}

function createCalendarMonth(year: number, month: number): CalendarMonth {
  const firstDay = new Date(year, month, 1)
  const startWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const days: CalendarMonth['days'] = []

  for (let index = 0; index < 42; index += 1) {
    const dayNumber = index - startWeekday + 1

    if (dayNumber <= 0) {
      const label = prevMonthDays + dayNumber
      const prevDate = new Date(year, month - 1, label)
      days.push({
        key: `prev-${label}-${index}`,
        label,
        value: formatDate(prevDate),
        isCurrentMonth: false,
      })
      continue
    }

    if (dayNumber > daysInMonth) {
      const nextLabel = dayNumber - daysInMonth
      const nextDate = new Date(year, month + 1, nextLabel)
      days.push({
        key: `next-${nextLabel}-${index}`,
        label: nextLabel,
        value: formatDate(nextDate),
        isCurrentMonth: false,
      })
      continue
    }

    days.push({
      key: `current-${dayNumber}`,
      label: dayNumber,
      value: formatDate(new Date(year, month, dayNumber)),
      isCurrentMonth: true,
    })
  }

  return { year, month, days }
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readSelectedOption(options: PsbLogOption[], value: string) {
  return options.find((option) => option.value === value) ?? null
}

function buildDateLabel(startDate: string, endDate: string) {
  if (!startDate && !endDate) return '请选择'
  if (startDate && endDate && startDate === endDate) return startDate
  if (startDate && endDate) return `${startDate} - ${endDate}`
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
