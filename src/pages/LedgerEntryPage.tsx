import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createLedgerEntryExportTask,
  defaultLedgerEntryQuery,
  fetchLedgerEntryDashboard,
  LedgerEntryServiceError,
  type LedgerEntryDashboard,
  type LedgerEntryQuery,
  type LedgerEntryRow,
  type LedgerEntryType,
} from '../services/ledgerEntry'
import './OrderLedgerPage.css'
import './LedgerEntryPage.css'

type SelectKind = 'type' | 'roomType' | null
type DatePickTarget = 'start' | 'end'
type DatePanelPosition = { top: number; left: number }

const presetRanges = [
  { key: 'yesterday', label: '昨天', start: '2026-05-18', end: '2026-05-18' },
  { key: 'today', label: '今天', start: '2026-05-19', end: '2026-05-19' },
  { key: 'lastWeek', label: '上周', start: '2026-05-12', end: '2026-05-18' },
  { key: 'thisWeek', label: '本周', start: '2026-05-19', end: '2026-05-25' },
  { key: 'lastMonth', label: '上月', start: '2026-04-01', end: '2026-04-30' },
  { key: 'thisMonth', label: '本月', start: '2026-05-01', end: '2026-05-31' },
] as const

type PresetRangeKey = (typeof presetRanges)[number]['key'] | 'custom'

export function LedgerEntryPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState<LedgerEntryQuery>(() => makeInitialQuery())
  const [dashboard, setDashboard] = useState<LedgerEntryDashboard | null>(null)
  const [serviceError, setServiceError] = useState<LedgerEntryServiceError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [selectedRow, setSelectedRow] = useState<LedgerEntryRow | null>(null)
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false)
  const [datePickTarget, setDatePickTarget] = useState<DatePickTarget>('start')
  const [calendarMonth, setCalendarMonth] = useState(() => query.startDate.slice(0, 7))
  const [datePanelPosition, setDatePanelPosition] = useState<DatePanelPosition>({ top: 0, left: 0 })
  const [dateDraft, setDateDraft] = useState(() => ({ startDate: query.startDate, endDate: query.endDate }))
  const dateRangeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setIsLoading(true)
      setServiceError(null)
      try {
        const nextDashboard = await fetchLedgerEntryDashboard(query, controller.signal)
        setDashboard(nextDashboard)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof LedgerEntryServiceError) {
          setServiceError(error)
          return
        }
        throw error
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void run()

    return () => controller.abort()
  }, [query])

  const diagnosticsProvider = dashboard?.provider ?? serviceError?.provider ?? 'mock'
  const diagnosticsState = dashboard?.state ?? serviceError?.state ?? query.state ?? 'success'
  const diagnosticsRequest = dashboard?.request ?? serviceError?.request ?? query
  const activePreset = useMemo(() => findPresetRangeKey(query.startDate, query.endDate), [query.endDate, query.startDate])
  const stores = dashboard?.stores ?? [{ id: query.storeId, name: query.storeName }]
  const allStore = stores[0]
  const roomCategoryName =
    dashboard?.roomCategories.find((item) => item.id === query.roomCategoryId)?.name ?? '请选择房型'
  const rows = dashboard?.rows ?? []

  function patchQuery(next: Partial<LedgerEntryQuery>, nextNotice = '') {
    setOpenSelect(null)
    setNotice(nextNotice)
    setQuery((current) => ({
      ...current,
      ...next,
      page: next.page ?? 1,
    }))
  }

  function openDatePanel(target: DatePickTarget = 'start') {
    setOpenSelect(null)
    setDatePickTarget(target)
    setDateDraft({ startDate: query.startDate, endDate: query.endDate })
    setCalendarMonth(query.startDate.slice(0, 7))
    const rect = dateRangeRef.current?.getBoundingClientRect()
    if (rect) {
      setDatePanelPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 624)),
      })
    }
    setIsDatePanelOpen(true)
  }

  function applyDateSelection(date: string) {
    if (datePickTarget === 'start') {
      const nextEndDate = date <= dateDraft.endDate ? dateDraft.endDate : date
      setDateDraft({ startDate: date, endDate: nextEndDate })
      setDatePickTarget('end')
      return
    }

    const nextStartDate = date < dateDraft.startDate ? date : dateDraft.startDate
    const nextEndDate = date < dateDraft.startDate ? dateDraft.startDate : date
    setDateDraft({ startDate: nextStartDate, endDate: nextEndDate })
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
    patchQuery({ startDate: nextStartDate, endDate: nextEndDate }, '已更新账本日期')
  }

  function resetFilters() {
    setOpenSelect(null)
    setNotice('筛选条件已重置')
    setSelectedRow(null)
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
    setQuery(defaultLedgerEntryQuery())
  }

  async function exportReport() {
    setIsLoading(true)
    try {
      await createLedgerEntryExportTask(query)
      setNotice('已生成记一笔明细导出任务')
    } finally {
      setIsLoading(false)
    }
  }

  function changePage(page: number) {
    patchQuery({ page }, `已切换到第 ${page} 页`)
  }

  return (
    <div className="ledger-entry-page">
      <h1 className="sr-only-heading">记一笔明细</h1>
      <output
        id="ledger-entry-diagnostics"
        hidden
        data-provider={diagnosticsProvider}
        data-state={diagnosticsState}
        data-request={JSON.stringify(diagnosticsRequest)}
      />

      <section className="order-ledger-filter" aria-label="记一笔明细筛选">
        <div className="order-ledger-filter__top">
          <div className="order-ledger-store-row" aria-label="门店">
            <button
              type="button"
              className={query.storeId === allStore.id ? 'is-active' : ''}
              aria-pressed={query.storeId === allStore.id}
              onClick={() => patchQuery({ storeId: allStore.id, storeName: allStore.name }, `已切换到${allStore.name}`)}
            >
              全部门店
            </button>
            {stores.slice(1).map((store) => {
              const selected = query.storeId === store.id
              return (
                <button
                  key={store.id}
                  type="button"
                  className={selected ? 'is-active' : ''}
                  aria-pressed={selected}
                  onClick={() => patchQuery({ storeId: store.id, storeName: store.name }, `已切换到${store.name}`)}
                >
                  {store.name}
                </button>
              )
            })}
            <button
              type="button"
              className="order-ledger-gear"
              aria-label="门店设置"
              onClick={() => navigate('/InformationMaintenance/campInfo')}
            >
              ⚙
            </button>
          </div>

          <div className="order-ledger-presets" role="group" aria-label="日期快捷筛选">
            {presetRanges.map((preset) => (
              <button
                key={preset.key}
                type="button"
                className={activePreset === preset.key ? 'is-active' : ''}
                onClick={() => patchQuery({ startDate: preset.start, endDate: preset.end }, `已切换到${preset.label}`)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div
            ref={dateRangeRef}
            className="order-ledger-date-range"
            aria-label="账本日期"
            role="button"
            tabIndex={0}
            onClick={() => openDatePanel('start')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openDatePanel('start')
              }
            }}
          >
            <button
              type="button"
              className="order-ledger-date-field"
              aria-label="开始日期"
              onClick={(event) => {
                event.stopPropagation()
                openDatePanel('start')
              }}
            >
              {query.startDate}
            </button>
            <span>至</span>
            <button
              type="button"
              className="order-ledger-date-field"
              aria-label="结束日期"
              onClick={(event) => {
                event.stopPropagation()
                openDatePanel('end')
              }}
            >
              {query.endDate}
            </button>
            <i aria-hidden="true" />
          </div>

          <FilterSelect
            label="类型"
            value={
              (dashboard?.typeOptions ?? [{ value: query.type, label: '全部类型' }]).find((item) => item.value === query.type)?.label ??
              '全部类型'
            }
            kind="type"
            openSelect={openSelect}
            optionLabel="类型选项"
            options={(dashboard?.typeOptions ?? []).map((item) => ({ value: item.value, label: item.label }))}
            onToggle={() => setOpenSelect(openSelect === 'type' ? null : 'type')}
            onSelect={(value) => patchQuery({ type: value as LedgerEntryType }, '已更新类型筛选')}
          />
        </div>

        <div className="order-ledger-filter__bottom ledger-entry-filter__bottom">
          <FilterSelect
            label="房型"
            value={roomCategoryName}
            kind="roomType"
            openSelect={openSelect}
            optionLabel="房型选项"
            options={(dashboard?.roomCategories ?? []).map((item) => ({ value: item.id, label: item.name }))}
            onToggle={() => setOpenSelect(openSelect === 'roomType' ? null : 'roomType')}
            onSelect={(value) => patchQuery({ roomCategoryId: value }, '已更新房型筛选')}
          />

          <div className="order-ledger-actions">
            <button type="button" onClick={resetFilters} disabled={isLoading}>
              重置
            </button>
            <button type="button" className="is-primary" onClick={exportReport} disabled={isLoading}>
              导出
            </button>
          </div>
        </div>
      </section>

      <div className="sr-only-heading" role="status" aria-live="polite">
        {isLoading ? '账本数据加载中' : notice}
      </div>

      {serviceError ? (
        <section className="ledger-entry-alert" role="alert">
          <strong>{serviceError.message}</strong>
          <span>请检查日期范围或稍后重试，当前错误已在数据服务层显式暴露。</span>
          <button type="button" onClick={() => patchQuery({}, '重新加载中')}>
            重新加载
          </button>
        </section>
      ) : null}

      <section className="ledger-entry-table-section" aria-label="账本明细表格">
        <div className="ledger-entry-section-header">
          <h2>账本明细</h2>
          <span>更新时间：{dashboard?.updatedAt ?? '2026-05-19T16:40:00+08:00'}</span>
        </div>
        <div className="ledger-entry-table-scroll">
          <table className="ledger-entry-table">
            <thead>
              <tr>
                {['类型', '项目', '金额', '支付方式', '时间', '关联房型/房间', '备注', '操作人', '操作'].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.typeLabel}</td>
                    <td>
                      <strong>{row.project}</strong>
                      <small>{row.channelName}</small>
                    </td>
                    <td className={row.type === 'income' ? 'is-income' : 'is-expense'}>
                      {row.type === 'income' ? '+' : '-'}¥ {formatMoney(row.amount)}
                    </td>
                    <td>{row.paymentWay}</td>
                    <td>{row.occurredAt}</td>
                    <td>
                      <strong>{row.roomCategoryName}</strong>
                      <small>{row.roomName}</small>
                    </td>
                    <td>{row.remark}</td>
                    <td>{row.operatorName}</td>
                    <td>
                      <button
                        type="button"
                        className="ledger-entry-detail-button"
                        aria-label={`查看明细 ${row.id}`}
                        onClick={() => setSelectedRow(row)}
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="ledger-entry-empty-row">
                  <td colSpan={9}>
                    <div className="ledger-entry-empty">
                      <span aria-hidden="true" />
                      <p>暂无数据</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="ledger-entry-pagination" aria-label="分页">
          <span>
            第 {dashboard?.pagination.page ?? query.page} 页 / 共 {dashboard?.pagination.total ?? 0} 条
          </span>
          <button type="button" onClick={() => changePage(Math.max(1, query.page - 1))} disabled={query.page <= 1 || isLoading}>
            上一页
          </button>
          <button
            type="button"
            onClick={() => changePage(query.page + 1)}
            disabled={!dashboard || query.page * query.pageSize >= dashboard.pagination.total || isLoading}
          >
            下一页
          </button>
        </footer>
      </section>

      {isDatePanelOpen ? (
        <DatePanel
          month={calendarMonth}
          startDate={dateDraft.startDate}
          endDate={dateDraft.endDate}
          pickTarget={datePickTarget}
          position={datePanelPosition}
          onClose={() => {
            setIsDatePanelOpen(false)
            setDatePickTarget('start')
            setDateDraft({ startDate: query.startDate, endDate: query.endDate })
          }}
          onPrevious={() => setCalendarMonth((current) => shiftMonth(current, -1))}
          onNext={() => setCalendarMonth((current) => shiftMonth(current, 1))}
          onPick={applyDateSelection}
        />
      ) : null}

      {selectedRow ? <RowDialog row={selectedRow} onClose={() => setSelectedRow(null)} /> : null}
    </div>
  )
}

function makeInitialQuery() {
  const query = defaultLedgerEntryQuery()
  const params = new URLSearchParams(window.location.search)
  const mockState = params.get('mockState')
  if (mockState === 'empty' || mockState === 'error') query.state = mockState
  return query
}

function findPresetRangeKey(startDate: string, endDate: string): PresetRangeKey {
  const matched = presetRanges.find((item) => item.start === startDate && item.end === endDate)
  return matched?.key ?? 'custom'
}

function FilterSelect({
  label,
  value,
  kind,
  openSelect,
  optionLabel,
  options,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  optionLabel: string
  options: Array<{ value: string; label: string }>
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="order-ledger-select-field">
      <span className="order-ledger-select-label">{label}:</span>
      <button type="button" aria-haspopup="listbox" aria-expanded={openSelect === kind} aria-label={`${label} ${value}`} onClick={onToggle}>
        <strong>{value}</strong>
      </button>
      {openSelect === kind ? (
        <div className="order-ledger-options" role="listbox" aria-label={optionLabel}>
          {options.map((option) => (
            <button key={option.value} type="button" role="option" aria-selected={value === option.label} onClick={() => onSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DatePanel({
  month,
  startDate,
  endDate,
  pickTarget,
  position,
  onClose,
  onPrevious,
  onNext,
  onPick,
}: {
  month: string
  startDate: string
  endDate: string
  pickTarget: DatePickTarget
  position: DatePanelPosition
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onPick: (date: string) => void
}) {
  const months = [month, shiftMonth(month, 1)]

  return (
    <div className="order-ledger-date-panel-wrap" role="presentation" onMouseDown={onClose}>
      <section
        className="order-ledger-date-panel"
        role="dialog"
        aria-label="记一笔明细日期面板"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="order-ledger-date-panel__header">
          <strong>{pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期'}</strong>
          <button type="button" aria-label="关闭记一笔明细日期面板" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="order-ledger-date-panel__range">
          <span>{startDate}</span>
          <em>至</em>
          <span>{endDate}</span>
        </div>
        <div className="order-ledger-date-panel__months">
          {months.map((item, index) => (
            <CalendarMonth
              key={item}
              month={item}
              startDate={startDate}
              endDate={endDate}
              onPrevious={index === 0 ? onPrevious : undefined}
              onNext={index === months.length - 1 ? onNext : undefined}
              onPick={onPick}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function CalendarMonth({
  month,
  startDate,
  endDate,
  onPrevious,
  onNext,
  onPick,
}: {
  month: string
  startDate: string
  endDate: string
  onPrevious?: () => void
  onNext?: () => void
  onPick: (date: string) => void
}) {
  const days = buildCalendarDays(month)

  return (
    <section className="order-ledger-calendar-month" aria-label={formatMonthLabel(month)}>
      <header>
        <button type="button" aria-label="上个月" onClick={onPrevious} disabled={!onPrevious}>
          ‹
        </button>
        <strong>{formatMonthLabel(month)}</strong>
        <button type="button" aria-label="下个月" onClick={onNext} disabled={!onNext}>
          ›
        </button>
      </header>
      <div className="order-ledger-calendar-month__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="order-ledger-calendar-month__days">
        {days.map((day) => {
          const inRange = day.date >= startDate && day.date <= endDate
          const isSelected = day.date === startDate || day.date === endDate
          return (
            <button
              key={day.date}
              type="button"
              aria-label={day.date}
              className={`${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`}
              onClick={() => onPick(day.date)}
            >
              {day.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function RowDialog({ row, onClose }: { row: LedgerEntryRow; onClose: () => void }) {
  return (
    <div className="ledger-entry-dialog-layer">
      <section className="ledger-entry-dialog" role="dialog" aria-modal="true" aria-label="账本明细详情">
        <header>
          <strong>账本明细详情</strong>
          <button type="button" aria-label="关闭账本明细详情" onClick={onClose}>
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>项目</dt>
            <dd>{row.project}</dd>
          </div>
          <div>
            <dt>渠道</dt>
            <dd>{row.channelName}</dd>
          </div>
          <div>
            <dt>房型 / 房间</dt>
            <dd>
              {row.roomCategoryName} / {row.roomName}
            </dd>
          </div>
          <div>
            <dt>支付方式</dt>
            <dd>{row.paymentWay}</dd>
          </div>
          <div>
            <dt>备注</dt>
            <dd>{row.remark}</dd>
          </div>
          <div>
            <dt>操作人</dt>
            <dd>{row.operatorName}</dd>
          </div>
        </dl>
        <footer>
          <Link to="/statistics/orderLedger">查看收支明细</Link>
        </footer>
      </section>
    </div>
  )
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const nextDate = new Date(year, monthIndex - 1 + offset, 1)
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string) {
  const [year, monthValue] = month.split('-')
  return `${year}年${Number(monthValue)}月`
}

function buildCalendarDays(month: string) {
  const [year, monthValue] = month.split('-').map(Number)
  const firstDay = new Date(year, monthValue - 1, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, monthValue - 1, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      label: String(date.getDate()),
      isMuted: date.getMonth() !== monthValue - 1,
    }
  })
}

function formatMoney(value: number) {
  return value.toFixed(2)
}
