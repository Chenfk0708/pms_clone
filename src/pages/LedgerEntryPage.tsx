import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  createLedgerEntryExportTask,
  defaultLedgerEntryQuery,
  fetchLedgerEntryDashboard,
  LedgerEntryServiceError,
  type LedgerEntryDashboard,
  type LedgerEntryQuery,
  type LedgerEntryRow,
  type LedgerEntrySummaryCard,
  type LedgerEntryType,
} from '../services/ledgerEntry'
import './LedgerEntryPage.css'

type SelectKind = 'type' | 'roomType' | null

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
  const [query, setQuery] = useState<LedgerEntryQuery>(() => makeInitialQuery())
  const [dashboard, setDashboard] = useState<LedgerEntryDashboard | null>(null)
  const [serviceError, setServiceError] = useState<LedgerEntryServiceError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [isDateOpen, setIsDateOpen] = useState(false)
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<LedgerEntrySummaryCard | null>(null)
  const [selectedRow, setSelectedRow] = useState<LedgerEntryRow | null>(null)

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
  const activePreset = findPresetRangeKey(query.startDate, query.endDate)
  const roomCategoryName =
    dashboard?.roomCategories.find((item) => item.id === query.roomCategoryId)?.name ?? '请选择房型'

  function patchQuery(next: Partial<LedgerEntryQuery>, nextNotice?: string) {
    setQuery((current) => ({
      ...current,
      ...next,
      page: next.page ?? 1,
    }))
    if (nextNotice) setNotice(nextNotice)
  }

  function resetFilters() {
    setQuery(defaultLedgerEntryQuery())
    setOpenSelect(null)
    setNotice('筛选条件已重置')
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

      <section className="ledger-entry-filter" aria-label="记一笔明细筛选">
        <div className="ledger-entry-store-row" role="radiogroup" aria-label="门店">
          {(dashboard?.stores ?? [{ id: query.storeId, name: query.storeName }]).map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={query.storeId === item.id}
              className={query.storeId === item.id ? 'is-active' : ''}
              onClick={() => patchQuery({ storeId: item.id, storeName: item.name }, `已切换到${item.name}`)}
            >
              {item.name}
            </button>
          ))}
          <button
            type="button"
            className="ledger-entry-gear"
            aria-label="门店设置"
            onClick={() => setIsStoreDialogOpen(true)}
          >
            ⚙
          </button>
        </div>

        <div className="ledger-entry-date-line">
          <div className="ledger-entry-presets" role="group" aria-label="日期快捷筛选">
            {presetRanges.map((item) => (
              <button
                key={item.key}
                type="button"
                className={activePreset === item.key ? 'is-active' : ''}
                onClick={() => patchQuery({ startDate: item.start, endDate: item.end }, `已切换到${item.label}`)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ledger-entry-date-range" aria-label="账本日期">
            <button type="button" aria-label="开始日期" onClick={() => setIsDateOpen(true)}>
              {query.startDate}
            </button>
            <span>→</span>
            <button type="button" aria-label="结束日期" onClick={() => setIsDateOpen(true)}>
              {query.endDate}
            </button>
          </div>
        </div>

        <div className="ledger-entry-field-line">
          <SelectField
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
            onSelect={(value) => {
              patchQuery({ type: value as LedgerEntryType }, '已更新类型筛选')
              setOpenSelect(null)
            }}
          />
          <SelectField
            label="房型"
            value={roomCategoryName}
            kind="roomType"
            openSelect={openSelect}
            optionLabel="房型选项"
            options={(dashboard?.roomCategories ?? []).map((item) => ({ value: item.id, label: item.name }))}
            onToggle={() => setOpenSelect(openSelect === 'roomType' ? null : 'roomType')}
            onSelect={(value) => {
              patchQuery({ roomCategoryId: value }, '已更新房型筛选')
              setOpenSelect(null)
            }}
          />
        </div>

        <div className="ledger-entry-actions">
          <button type="button" className="is-outline" onClick={resetFilters} disabled={isLoading}>
            重置筛选
          </button>
          <button type="button" className="is-primary" onClick={exportReport} disabled={isLoading}>
            报表导出
          </button>
        </div>
      </section>

      {notice || isLoading ? (
        <div className="ledger-entry-notice" role="status" aria-live="polite">
          {isLoading ? '账本数据加载中' : notice}
        </div>
      ) : null}

      {serviceError ? (
        <section className="ledger-entry-alert" role="alert">
          <strong>{serviceError.message}</strong>
          <span>请检查日期范围或稍后重试，当前错误已在数据服务层显式暴露。</span>
          <button type="button" onClick={() => patchQuery({}, '重新加载中')}>
            重新加载
          </button>
        </section>
      ) : null}

      <section className="ledger-entry-summary" aria-label="账本概括">
        <div className="ledger-entry-section-header">
          <h2>账本概括</h2>
          <span>净收入：¥ {formatMoney(dashboard?.netIncome ?? 0)}</span>
        </div>
        <div className="ledger-entry-summary-grid">
          {(dashboard?.summaryCards ?? []).map((card) => (
            <button
              key={card.key}
              type="button"
              className="ledger-entry-summary-card"
              aria-label={`查看${card.title}详情`}
              onClick={() => setSelectedCard(card)}
            >
              <div className="ledger-entry-card-label">
                <span aria-hidden="true">¥</span>
                <strong>{card.title}</strong>
              </div>
              <b>¥ {formatMoney(card.amount)}</b>
              <small>{card.trend}</small>
            </button>
          ))}
        </div>
      </section>

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
              {dashboard?.rows.length ? (
                dashboard.rows.map((row) => (
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

      {isDateOpen ? (
        <DateRangeDialog
          startDate={query.startDate}
          endDate={query.endDate}
          onClose={() => setIsDateOpen(false)}
          onConfirm={(nextStartDate, nextEndDate) => {
            patchQuery({ startDate: nextStartDate, endDate: nextEndDate }, '已更新账本日期')
            setIsDateOpen(false)
          }}
        />
      ) : null}

      {isStoreDialogOpen ? <StoreDialog onClose={() => setIsStoreDialogOpen(false)} /> : null}
      {selectedCard ? <SummaryDialog card={selectedCard} onClose={() => setSelectedCard(null)} /> : null}
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

function formatMoney(value: number) {
  return value.toFixed(2)
}

function SelectField({
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
    <div className="ledger-entry-select-field">
      <button type="button" aria-haspopup="listbox" aria-expanded={openSelect === kind} onClick={onToggle}>
        <span>{label}</span>
        <strong>{value}</strong>
      </button>
      {openSelect === kind ? (
        <div className="ledger-entry-options" role="listbox" aria-label={optionLabel}>
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

function DateRangeDialog({
  startDate,
  endDate,
  onClose,
  onConfirm,
}: {
  startDate: string
  endDate: string
  onClose: () => void
  onConfirm: (startDate: string, endDate: string) => void
}) {
  const [cursorMonth, setCursorMonth] = useState(() => startDate.slice(0, 7))
  const [draftStartDate, setDraftStartDate] = useState(startDate)
  const [draftEndDate, setDraftEndDate] = useState(endDate)
  const [isPickingRangeEnd, setIsPickingRangeEnd] = useState(false)

  const months = [cursorMonth, shiftMonth(cursorMonth, 1)]

  function onPick(date: string) {
    if (!isPickingRangeEnd) {
      setDraftStartDate(date)
      setDraftEndDate(date)
      setIsPickingRangeEnd(true)
      return
    }

    if (date < draftStartDate) {
      setDraftEndDate(draftStartDate)
      setDraftStartDate(date)
    } else {
      setDraftEndDate(date)
    }
    setIsPickingRangeEnd(false)
  }

  return (
    <div className="ledger-entry-dialog-layer">
      <section className="ledger-entry-date-popover" role="dialog" aria-modal="true" aria-label="日期选择">
        {months.map((month) => (
          <CalendarMonth
            key={month}
            month={month}
            startDate={draftStartDate}
            endDate={draftEndDate}
            onPrevious={() => setCursorMonth((current) => shiftMonth(current, -1))}
            onNext={() => setCursorMonth((current) => shiftMonth(current, 1))}
            onPick={onPick}
          />
        ))}
        <div className="ledger-entry-date-popover__footer">
          <span>
            已选：{draftStartDate} 至 {draftEndDate}
          </span>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={() => onConfirm(draftStartDate, draftEndDate)}>
            确定
          </button>
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
  onPrevious: () => void
  onNext: () => void
  onPick: (date: string) => void
}) {
  const days = buildCalendarDays(month)
  const monthLabel = formatMonthLabel(month)

  return (
    <section className="ledger-entry-calendar" aria-label={monthLabel}>
      <header>
        <button type="button" aria-label="上一月" onClick={onPrevious}>
          ‹
        </button>
        <strong>{monthLabel.slice(0, 5)}</strong>
        <strong>{monthLabel.slice(5)}</strong>
        <button type="button" aria-label="下一月" onClick={onNext}>
          ›
        </button>
      </header>
      <div className="ledger-entry-calendar__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="ledger-entry-calendar__grid">
        {days.map((day) => {
          const inRange = day.date >= startDate && day.date <= endDate
          const isSelectedEdge = day.date === startDate || day.date === endDate
          return (
            <button
              key={day.date}
              type="button"
              aria-label={`选择 ${day.date}`}
              className={`${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelectedEdge ? ' is-selected' : ''}`}
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

function SummaryDialog({ card, onClose }: { card: LedgerEntrySummaryCard; onClose: () => void }) {
  return (
    <div className="ledger-entry-dialog-layer">
      <section className="ledger-entry-dialog" role="dialog" aria-modal="true" aria-label={`${card.title}详情`}>
        <header>
          <strong>{card.title}详情</strong>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            ×
          </button>
        </header>
        <p>{card.detail}</p>
        <dl>
          <div>
            <dt>当前金额</dt>
            <dd>¥ {formatMoney(card.amount)}</dd>
          </div>
          <div>
            <dt>趋势说明</dt>
            <dd>{card.trend}</dd>
          </div>
        </dl>
        <footer>
          <Link to="/statistics/orderLedger">查看收支明细</Link>
          <Link to="/statistics/totalLedger">查看收支汇总</Link>
        </footer>
      </section>
    </div>
  )
}

function RowDialog({ row, onClose }: { row: LedgerEntryRow; onClose: () => void }) {
  return (
    <div className="ledger-entry-dialog-layer">
      <section className="ledger-entry-dialog" role="dialog" aria-modal="true" aria-label="账本明细详情">
        <header>
          <strong>账本明细详情</strong>
          <button type="button" aria-label="关闭明细详情" onClick={onClose}>
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

function StoreDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="ledger-entry-dialog-layer">
      <section className="ledger-entry-dialog ledger-entry-store-dialog" role="dialog" aria-modal="true" aria-label="门店设置">
        <header>
          <strong>门店设置</strong>
          <button type="button" aria-label="关闭门店设置" onClick={onClose}>
            ×
          </button>
        </header>
        <p>当前账本页沿用收支类报表的现有路由承接，门店切换与账本明细、收支汇总保持同一门店语境。</p>
        <nav>
          <Link to="/statistics/orderLedger">前往收支明细</Link>
          <Link to="/statistics/totalLedger">前往收支汇总</Link>
        </nav>
      </section>
    </div>
  )
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const shifted = new Date(year, monthNumber - 1 + offset, 1)
  const nextYear = shifted.getFullYear()
  const nextMonth = `${shifted.getMonth() + 1}`.padStart(2, '0')
  return `${nextYear}-${nextMonth}`
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-')
  return `${year}年${Number(monthNumber)}月`
}

function buildCalendarDays(month: string) {
  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthNumber = Number(monthText)
  const firstDay = new Date(year, monthNumber - 1, 1)
  const firstWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = new Date(year, monthNumber, 0).getDate()
  const daysInPreviousMonth = new Date(year, monthNumber - 1, 0).getDate()
  const cells = []

  for (let index = 0; index < 42; index += 1) {
    const dayOffset = index - firstWeekday + 1
    const cellDate = new Date(year, monthNumber - 1, dayOffset)
    const cellMonth = cellDate.getMonth() + 1
    const isCurrentMonth = cellMonth === monthNumber
    const label = isCurrentMonth
      ? `${dayOffset}`
      : index < firstWeekday
        ? `${daysInPreviousMonth - firstWeekday + index + 1}`
        : `${index - firstWeekday - daysInMonth + 1}`
    cells.push({
      date: `${cellDate.getFullYear()}-${`${cellMonth}`.padStart(2, '0')}-${`${cellDate.getDate()}`.padStart(2, '0')}`,
      label,
      isMuted: !isCurrentMonth,
    })
  }

  return cells
}
