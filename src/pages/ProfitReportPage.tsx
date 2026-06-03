import { useEffect, useMemo, useRef, useSyncExternalStore, useState } from 'react'
import {
  createProfitReportExportTask,
  createProfitReportRequestBody,
  fetchProfitReportDashboard,
  getDefaultProfitReportFilters,
  getProfitReportStaticLookups,
  resolveProfitReportProvider,
  type ProfitExportTask,
  type ProfitMockState,
  type ProfitReportDashboard,
  type ProfitReportDescription,
  type ProfitReportFilters,
  type ProfitReportOption,
} from '../services/profitReport'
import './ProfitReportPage.css'

type SelectKind = 'roomType' | 'channel' | 'roomGroup' | null
type DatePickTarget = 'start' | 'end'
type DatePanelPosition = { top: number; left: number }

const staticLookups = getProfitReportStaticLookups()

export function ProfitReportPage() {
  const routeKey = useRouteSearchKey()
  const provider = useMemo(() => resolveProfitReportProvider(), [])
  const mockState = useMemo(() => resolveMockState(), [routeKey])
  const [filters, setFilters] = useState<ProfitReportFilters>(() => ({
    ...getDefaultProfitReportFilters(),
    mockState,
  }))
  const [dashboard, setDashboard] = useState<ProfitReportDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [exportTask, setExportTask] = useState<ProfitExportTask | null>(null)
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false)
  const [datePickTarget, setDatePickTarget] = useState<DatePickTarget>('start')
  const [calendarMonth, setCalendarMonth] = useState(() => filters.startDate.slice(0, 7))
  const [datePanelPosition, setDatePanelPosition] = useState<DatePanelPosition>({ top: 0, left: 0 })
  const dateRangeRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const nextFilters = { ...getDefaultProfitReportFilters(), mockState }
    setFilters(nextFilters)
    setCalendarMonth(nextFilters.startDate.slice(0, 7))
    void loadDashboard(nextFilters, '利润报表已完成加载')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockState])

  const stores = dashboard?.stores ?? staticLookups.stores
  const roomCategories = dashboard?.roomCategories ?? staticLookups.roomCategories
  const channels = dashboard?.channels ?? staticLookups.channels
  const roomGroups = dashboard?.roomGroups ?? staticLookups.roomGroups
  const descriptions = dashboard?.descriptions ?? staticLookups.descriptions
  const rows = dashboard?.rows ?? []
  const total = dashboard?.total ?? 0
  const pageNum = dashboard?.pageNum ?? filters.pageNum
  const pageSize = dashboard?.pageSize ?? filters.pageSize
  const pageCount = dashboard?.pageCount ?? 1
  const requestBody = dashboard?.requestBody ?? createProfitReportRequestBody(filters)
  const currentRoomType = roomCategories.find((item) => item.id === filters.roomCategoryId)
  const currentChannel = channels.find((item) => item.id === filters.channelId)
  const currentRoomGroup = roomGroups.find((item) => item.id === filters.roomGroupId)
  const dataFilters = {
    storeId: filters.storeId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    roomCategoryId: currentRoomType?.id ?? '',
    roomCategoryLabel: currentRoomType?.label ?? '',
    channelId: currentChannel?.id ?? '',
    channelLabel: currentChannel?.label ?? '',
    roomGroupId: currentRoomGroup?.id ?? '',
    roomGroupLabel: currentRoomGroup?.label ?? '',
    includeCleanCost: filters.includeCleanCost,
    pageNum,
    pageSize,
  }

  async function loadDashboard(nextFilters: ProfitReportFilters, successMessage: string) {
    setIsLoading(true)
    setError('')
    setOpenSelect(null)

    try {
      const nextDashboard = await fetchProfitReportDashboard(nextFilters)
      setDashboard(nextDashboard)
      setFilters(nextFilters)
      setStatus(successMessage)
    } catch (reason) {
      setDashboard(null)
      setFilters(nextFilters)
      setStatus('')
      setError(reason instanceof Error ? reason.message : '利润报表数据加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  function patchFilters(partial: Partial<ProfitReportFilters>) {
    setFilters((current) => ({
      ...current,
      ...partial,
    }))
  }

  function selectOption(kind: Exclude<SelectKind, null>, option: ProfitReportOption) {
    setOpenSelect(null)

    if (kind === 'roomType') {
      patchFilters({ roomCategoryId: option.id, pageNum: 1 })
      setStatus(`已选择房型：${option.label}`)
      return
    }

    if (kind === 'channel') {
      patchFilters({ channelId: option.id, pageNum: 1 })
      setStatus(`已选择渠道：${option.label}`)
      return
    }

    patchFilters({ roomGroupId: option.id, pageNum: 1 })
    setStatus(`已选择房型分组：${option.label}`)
  }

  function openDatePanel(target: DatePickTarget = 'start') {
    setOpenSelect(null)
    setDatePickTarget(target)
    setCalendarMonth(filters.startDate.slice(0, 7))
    const rect = dateRangeRef.current?.getBoundingClientRect()
    if (rect) {
      setDatePanelPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 600)),
      })
    }
    setIsDatePanelOpen(true)
  }

  function applyDateSelection(date: string) {
    if (datePickTarget === 'start') {
      const nextEndDate = date <= filters.endDate ? filters.endDate : date
      patchFilters({ startDate: date, endDate: nextEndDate, pageNum: 1 })
      setDatePickTarget('end')
      return
    }

    const nextStartDate = date < filters.startDate ? date : filters.startDate
    const nextEndDate = date < filters.startDate ? filters.startDate : date
    patchFilters({ startDate: nextStartDate, endDate: nextEndDate, pageNum: 1 })
    setDatePickTarget('start')
    setIsDatePanelOpen(false)
    setStatus(`已选择日期范围：${nextStartDate} 至 ${nextEndDate}`)
  }

  async function handleQuery() {
    await loadDashboard({ ...filters, pageNum: 1 }, '已按当前条件更新利润报表')
  }

  async function handleReset() {
    const nextFilters = { ...getDefaultProfitReportFilters(), mockState }
    setExportTask(null)
    setCalendarMonth(nextFilters.startDate.slice(0, 7))
    await loadDashboard(nextFilters, '已重置筛选并刷新利润报表')
  }

  async function handleChangePage(nextPageNum: number) {
    if (nextPageNum === filters.pageNum || nextPageNum < 1 || nextPageNum > pageCount) {
      return
    }

    await loadDashboard({ ...filters, pageNum: nextPageNum }, `已切换到第 ${nextPageNum} 页`)
  }

  async function handleExport() {
    const nextTask = await createProfitReportExportTask(filters)
    setExportTask(nextTask)
    setStatus(`导出任务已创建：${nextTask.taskId}`)
  }

  return (
    <div
      className="profit-report-page"
      data-provider={provider}
      data-profit-request={JSON.stringify(requestBody)}
      data-profit-filters={JSON.stringify(dataFilters)}
      data-profit-export={exportTask ? JSON.stringify(exportTask) : ''}
    >
      <h1 className="sr-only-heading">利润报表</h1>

      <section className="profit-report-query" aria-label="利润报表筛选">
        <div className="profit-report-store-row" role="radiogroup" aria-label="门店">
          {stores.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={filters.storeId === item.id}
              className={filters.storeId === item.id ? 'is-active' : ''}
              onClick={() => {
                patchFilters({ storeId: item.id, pageNum: 1 })
                setStatus(`已切换门店：${item.label}`)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {expanded ? (
          <div className="profit-report-form">
            <div className="profit-report-filter-row">
              <label className="profit-date-field">
                <span>日期：</span>
                <div
                  ref={dateRangeRef}
                  className="profit-date-range"
                  role="button"
                  tabIndex={0}
                  aria-label="利润报表日期范围"
                  onClick={() => openDatePanel('start')}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openDatePanel('start')
                    }
                  }}
                >
                  <input
                    aria-label="开始日期"
                    value={filters.startDate}
                    readOnly
                    onClick={(event) => {
                      event.stopPropagation()
                      openDatePanel('start')
                    }}
                  />
                  <span>至</span>
                  <input
                    aria-label="结束日期"
                    value={filters.endDate}
                    readOnly
                    onClick={(event) => {
                      event.stopPropagation()
                      openDatePanel('end')
                    }}
                  />
                  <i aria-hidden="true" />
                </div>
              </label>

              <SelectField
                label="房型："
                placeholder="请选择"
                selectedId={currentRoomType?.id ?? ''}
                value={currentRoomType?.label ?? ''}
                options={roomCategories}
                emptyCopy="暂无房型数据"
                open={openSelect === 'roomType'}
                onToggle={() => setOpenSelect((current) => (current === 'roomType' ? null : 'roomType'))}
                onSelect={(option) => selectOption('roomType', option)}
              />
              <SelectField
                label="渠道："
                placeholder="请选择"
                selectedId={currentChannel?.id ?? ''}
                value={currentChannel?.label ?? ''}
                options={channels}
                emptyCopy="暂无渠道数据"
                open={openSelect === 'channel'}
                onToggle={() => setOpenSelect((current) => (current === 'channel' ? null : 'channel'))}
                onSelect={(option) => selectOption('channel', option)}
              />
              <SelectField
                label="房型分组："
                placeholder="请选择"
                selectedId={currentRoomGroup?.id ?? ''}
                value={currentRoomGroup?.label ?? ''}
                options={roomGroups}
                emptyCopy="暂无房型分组"
                open={openSelect === 'roomGroup'}
                onToggle={() => setOpenSelect((current) => (current === 'roomGroup' ? null : 'roomGroup'))}
                onSelect={(option) => selectOption('roomGroup', option)}
              />
            </div>

            <div className="profit-report-extra-row">
              <label className="profit-checkbox">
                <input
                  type="checkbox"
                  aria-label="包含保洁费用"
                  checked={filters.includeCleanCost}
                  onChange={(event) => {
                    patchFilters({ includeCleanCost: event.target.checked, pageNum: 1 })
                    setStatus(event.target.checked ? '已计入保洁费用' : '已取消计入保洁费用')
                  }}
                />
                <span>包含保洁费用</span>
              </label>
            </div>
          </div>
        ) : null}

        <div className="profit-report-actions">
          <button type="button" className="is-outline" disabled={isLoading} onClick={() => void handleReset()}>
            重置
          </button>
          <button type="button" className="is-primary" disabled={isLoading} onClick={() => void handleQuery()}>
            查询
          </button>
          <button type="button" className="is-outline" disabled={isLoading} onClick={() => void handleExport()}>
            导出
          </button>
          <button
            type="button"
            className="is-outline"
            disabled={isLoading}
            onClick={() => {
              setDescriptionOpen(true)
              setOpenSelect(null)
            }}
          >
            说明
          </button>
          <button
            type="button"
            className="is-link"
            disabled={isLoading}
            aria-label={expanded ? '收起' : '展开'}
            onClick={() => {
              const nextExpanded = !expanded
              setExpanded(nextExpanded)
              setOpenSelect(null)
              setStatus(nextExpanded ? '已展开筛选条件' : '已收起筛选条件')
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      {isDatePanelOpen ? (
        <DatePanel
          month={calendarMonth}
          startDate={filters.startDate}
          endDate={filters.endDate}
          pickTarget={datePickTarget}
          position={datePanelPosition}
          onClose={() => {
            setIsDatePanelOpen(false)
            setDatePickTarget('start')
          }}
          onPrevious={() => setCalendarMonth((current) => shiftMonth(current, -1))}
          onNext={() => setCalendarMonth((current) => shiftMonth(current, 1))}
          onPick={applyDateSelection}
        />
      ) : null}

      <div className="sr-only-heading" role="status" aria-label="利润报表操作反馈">
        {status}
      </div>

      {error ? (
        <div className="profit-report-alert" role="alert" aria-label="利润报表数据错误">
          <span>{error}</span>
          <button type="button" onClick={() => void loadDashboard(filters, '利润报表已重试并更新')}>
            重试
          </button>
        </div>
      ) : null}

      <section className="profit-report-table-wrap" aria-label="利润报表表格">
        {isLoading ? <div className="profit-report-empty">正在加载利润报表...</div> : null}
        {!isLoading && rows.length === 0 ? <div className="profit-report-empty">暂无利润报表数据</div> : null}

        <table className="profit-report-table">
          <thead>
            <tr>
              <th colSpan={7}>收入</th>
              <th>支出</th>
              <th colSpan={2}>利润</th>
            </tr>
            <tr>
              <th>日期</th>
              <th>房费(减佣)</th>
              <th>门票</th>
              <th>餐饮</th>
              <th>其他消费</th>
              <th>记一笔收入</th>
              <th>总收入</th>
              <th>记一笔支出</th>
              <th>利润</th>
              <th>利润率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.date}-${row.isTotal ? 'total' : 'detail'}`} className={row.isTotal ? 'is-summary' : ''}>
                <td>{row.date}</td>
                <td>{row.roomFeeMinusCommission}</td>
                <td>{row.ticketPrice}</td>
                <td>{row.cateringPrice}</td>
                <td>{row.otherOrderExpense}</td>
                <td>{row.writeDownIncome}</td>
                <td>{row.totalIncome}</td>
                <td>{row.writeDownExpenses}</td>
                <td>{row.profitPrice}</td>
                <td>{row.profitRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav className="profit-report-pagination" aria-label="分页">
        <span>{paginationText(pageNum, pageSize, total, rows.length)}</span>
        <button type="button" aria-label="上一页" disabled={isLoading || pageNum <= 1} onClick={() => void handleChangePage(pageNum - 1)}>
          ‹
        </button>
        {buildPageButtons(pageCount).map((item) => (
          <button
            key={item}
            type="button"
            className={item === pageNum ? 'is-current' : ''}
            disabled={isLoading}
            onClick={() => void handleChangePage(item)}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          aria-label="下一页"
          disabled={isLoading || pageNum >= pageCount}
          onClick={() => void handleChangePage(pageNum + 1)}
        >
          ›
        </button>
        <button type="button" disabled={isLoading}>
          {pageSize} 条/页
        </button>
      </nav>

      {descriptionOpen ? (
        <div className="profit-modal-backdrop" role="presentation">
          <section className="profit-description-modal" role="dialog" aria-modal="true" aria-label="利润报表字段说明">
            <header>
              <strong>利润报表字段说明</strong>
              <button type="button" aria-label="关闭利润报表字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="profit-description-table" aria-label="利润报表字段说明表格">
              <div className="profit-description-table__head">
                <span>字段</span>
                <span>说明</span>
              </div>
              {descriptions.map((item) => (
                <DescriptionRow key={item.field} item={item} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function SelectField({
  label,
  placeholder,
  selectedId,
  value,
  options,
  emptyCopy,
  open,
  onToggle,
  onSelect,
}: {
  label: string
  placeholder: string
  selectedId: string
  value: string
  options: ProfitReportOption[]
  emptyCopy: string
  open: boolean
  onToggle: () => void
  onSelect: (option: ProfitReportOption) => void
}) {
  return (
    <div className="profit-select-field">
      <span>{label}</span>
      <div className="profit-select-wrap">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${label}${value || placeholder}`}
          onClick={onToggle}
        >
          {value || placeholder}
        </button>
        {open ? (
          <div className="profit-options" role="listbox" aria-label={`${label}选项`}>
            {options.length === 0 ? (
              <div className="profit-options__empty">{emptyCopy}</div>
            ) : (
              options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  aria-selected={selectedId === option.id}
                  onClick={() => onSelect(option)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
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
    <div className="profit-date-panel-wrap" role="presentation" onMouseDown={onClose}>
      <section
        className="profit-date-panel"
        role="dialog"
        aria-label="利润报表日期面板"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="profit-date-panel__header">
          <strong>{pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期'}</strong>
          <button type="button" aria-label="关闭利润报表日期面板" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="profit-date-panel__months">
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
  const monthLabel = formatMonthLabel(month)

  return (
    <section className="profit-calendar-month" aria-label={monthLabel}>
      <header>
        <button type="button" aria-label="上个月" onClick={onPrevious} disabled={!onPrevious}>
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button type="button" aria-label="下个月" onClick={onNext} disabled={!onNext}>
          ›
        </button>
      </header>
      <div className="profit-calendar-month__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="profit-calendar-month__days">
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

function DescriptionRow({ item }: { item: ProfitReportDescription }) {
  return (
    <div className="profit-description-table__row">
      <span>{item.field}</span>
      <span>{item.detail}</span>
    </div>
  )
}

function buildPageButtons(pageCount: number) {
  return Array.from({ length: Math.max(pageCount, 1) }, (_, index) => index + 1)
}

function paginationText(pageNum: number, pageSize: number, total: number, length: number) {
  const start = total === 0 ? 0 : (pageNum - 1) * pageSize + 1
  const end = total === 0 ? 0 : (pageNum - 1) * pageSize + length
  return `第 ${start}-${end} 条/总共 ${total} 条`
}

function resolveMockState(): ProfitMockState {
  const state = readRouteParam('profitMockState')
  return state === 'empty' || state === 'error' ? state : 'success'
}

function useRouteSearchKey() {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener('hashchange', notify)
      window.addEventListener('popstate', notify)
      return () => {
        window.removeEventListener('hashchange', notify)
        window.removeEventListener('popstate', notify)
      }
    },
    () => `${window.location.search}|${window.location.hash}`,
  )
}

function readRouteParam(key: string) {
  const searchValue = new URLSearchParams(window.location.search).get(key)
  if (searchValue) return searchValue

  const hashQuery = window.location.hash.split('?')[1] ?? ''
  return new URLSearchParams(hashQuery).get(key)
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
