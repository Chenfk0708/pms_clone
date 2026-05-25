import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  defaultStatisticsDistributionOrderCampId,
  getStatisticsDistributionOrderProviderName,
  loadStatisticsDistributionOrderData,
  statisticsDistributionOrderEndpoint,
  type StatisticsDistributionOrderData,
  type StatisticsDistributionOrderFilter,
  type StatisticsDistributionOrderQuery,
  type StatisticsDistributionOrderStoreScope,
} from '../services/statisticsDistributionOrder'
import './OrderLedgerPage.css'
import './DistributionOrderPage.css'
import './StatisticsDistributionOrderPage.css'

type DatePickTarget = 'start' | 'end'
type DatePanelPosition = { top: number; left: number }

const tableColumns = ['订单号', '客户信息', '房型名称', '预订时间', '实付金额', '平台服务费', '应结算金额', '已结算金额', '结算状态']
const orderFilterOptions: Array<Exclude<StatisticsDistributionOrderFilter, ''>> = ['全部', '非置换订单', '置换订单']

const initialQuery: StatisticsDistributionOrderQuery = {
  campId: defaultStatisticsDistributionOrderCampId,
  storeScope: 'all',
  bookingStartDate: '2026-05-01',
  bookingEndDate: '2026-05-31',
  keyword: '',
  settlementState: '',
  pageNum: 1,
  pageSize: 20,
  current: 1,
}

export function StatisticsDistributionOrderPage({ defaultExpanded = true }: { defaultExpanded?: boolean }) {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<StatisticsDistributionOrderFilter>('')
  const [storeScope, setStoreScope] = useState<StatisticsDistributionOrderStoreScope>('all')
  const [bookingStartDate, setBookingStartDate] = useState(initialQuery.bookingStartDate)
  const [bookingEndDate, setBookingEndDate] = useState(initialQuery.bookingEndDate)
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [submittedFilter, setSubmittedFilter] = useState<StatisticsDistributionOrderFilter>('')
  const [submittedStoreScope, setSubmittedStoreScope] = useState<StatisticsDistributionOrderStoreScope>('all')
  const [submittedBookingStartDate, setSubmittedBookingStartDate] = useState(initialQuery.bookingStartDate)
  const [submittedBookingEndDate, setSubmittedBookingEndDate] = useState(initialQuery.bookingEndDate)
  const [openFilter, setOpenFilter] = useState(false)
  const [notice, setNotice] = useState('')
  const [reloadToken, setReloadToken] = useState(0)
  const [data, setData] = useState<StatisticsDistributionOrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false)
  const [datePickTarget, setDatePickTarget] = useState<DatePickTarget>('start')
  const [calendarMonth, setCalendarMonth] = useState(() => bookingStartDate.slice(0, 7))
  const [datePanelPosition, setDatePanelPosition] = useState<DatePanelPosition>({ top: 0, left: 0 })
  const [dateDraft, setDateDraft] = useState(() => ({ startDate: bookingStartDate, endDate: bookingEndDate }))
  const dateRangeRef = useRef<HTMLDivElement | null>(null)

  const query = useMemo<StatisticsDistributionOrderQuery>(
    () => ({
      ...initialQuery,
      storeScope: submittedStoreScope,
      bookingStartDate: submittedBookingStartDate,
      bookingEndDate: submittedBookingEndDate,
      keyword: submittedKeyword,
      settlementState: submittedFilter,
    }),
    [submittedBookingEndDate, submittedBookingStartDate, submittedFilter, submittedKeyword, submittedStoreScope],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setIsLoading(true)
      setError('')
      try {
        const result = await loadStatisticsDistributionOrderData(query, controller.signal)
        setData(result)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : '聚合分销订单服务暂不可用，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    }

    void run()
    return () => controller.abort()
  }, [query, reloadToken])

  function resetFilters() {
    setKeyword('')
    setSubmittedKeyword('')
    setFilter('')
    setSubmittedFilter('')
    setStoreScope('all')
    setSubmittedStoreScope('all')
    setBookingStartDate(initialQuery.bookingStartDate)
    setBookingEndDate(initialQuery.bookingEndDate)
    setSubmittedBookingStartDate(initialQuery.bookingStartDate)
    setSubmittedBookingEndDate(initialQuery.bookingEndDate)
    setOpenFilter(false)
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
    setNotice('筛选条件已重置')
  }

  function queryOrders() {
    setSubmittedKeyword(keyword.trim())
    setSubmittedFilter(filter)
    setSubmittedBookingStartDate(bookingStartDate)
    setSubmittedBookingEndDate(bookingEndDate)
    setOpenFilter(false)
    setNotice('已查询聚合分销订单')
  }

  function applyStoreScope(nextScope: StatisticsDistributionOrderStoreScope, noticeMessage: string) {
    setStoreScope(nextScope)
    setSubmittedStoreScope(nextScope)
    setOpenFilter(false)
    setIsDatePanelOpen(false)
    setNotice(noticeMessage)
    if (submittedStoreScope === nextScope) {
      setReloadToken((value) => value + 1)
    }
  }

  function reloadOrders(message = '已重新加载聚合分销订单') {
    setOpenFilter(false)
    setIsDatePanelOpen(false)
    setNotice(message)
    setReloadToken((value) => value + 1)
  }

  function openDatePanel(target: DatePickTarget = 'start') {
    setOpenFilter(false)
    setDatePickTarget(target)
    setDateDraft({ startDate: bookingStartDate, endDate: bookingEndDate })
    setCalendarMonth(bookingStartDate.slice(0, 7))
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
    setBookingStartDate(nextStartDate)
    setBookingEndDate(nextEndDate)
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
  }

  const filterLabel = filter || '请选择'
  const pageTotal = data?.pagination.total ?? 0
  const pageStart = pageTotal ? 1 : 0
  const pageEnd = pageTotal ? pageTotal : 0
  const serviceSummary = data?.requestSummary ?? [
    `provider=${getStatisticsDistributionOrderProviderName()}`,
    'mockState=success',
    'traceId=pending',
    `path=${statisticsDistributionOrderEndpoint}`,
    `campId=${query.campId ?? defaultStatisticsDistributionOrderCampId}`,
    `storeScope=${query.storeScope ?? 'all'}`,
    `bookingStartDate=${query.bookingStartDate}`,
    `bookingEndDate=${query.bookingEndDate}`,
    `keyword=${query.keyword?.trim() || ''}`,
    `settlementState=${query.settlementState || ''}`,
  ]

  return (
    <div className="distribution-order-page statistics-distribution-order-page">
      <h1 className="sr-only-heading">聚合分销订单</h1>
      <span id="statistics-distribution-service" hidden data-value={serviceSummary.join(';')} />

      <section className="order-ledger-filter statistics-distribution-filter" aria-label="聚合分销订单筛选">
        <div className="order-ledger-filter__top statistics-distribution-filter__top">
          <div className="order-ledger-store-row statistics-distribution-store" aria-label="门店">
            <button
              type="button"
              className={storeScope === 'all' ? 'is-active' : ''}
              aria-pressed={storeScope === 'all'}
              onClick={() => applyStoreScope('all', '已刷新全部门店口径的聚合分销订单')}
            >
              全部门店
            </button>
            <button
              type="button"
              className={storeScope === 'current' ? 'is-active' : ''}
              aria-pressed={storeScope === 'current'}
              onClick={() => applyStoreScope('current', '已刷新当前门店口径的聚合分销订单')}
            >
              {data?.campName ?? '天落会宿公寓(前海壹方城宝安中心店)'}
            </button>
            <button
              type="button"
              className="order-ledger-gear"
              aria-label="门店设置"
              onClick={() => navigate('/InformationMaintenance/campInfo')}
            >
              ⚙
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="order-ledger-filter__bottom statistics-distribution-filter__bottom">
            <label className="statistics-distribution-field statistics-distribution-field--date">
              <span>预订时间:</span>
              <div
                ref={dateRangeRef}
                className="order-ledger-date-range"
                aria-label="预订时间"
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
                  aria-label="预订开始日期"
                  onClick={(event) => {
                    event.stopPropagation()
                    openDatePanel('start')
                  }}
                >
                  {bookingStartDate}
                </button>
                <span>至</span>
                <button
                  type="button"
                  className="order-ledger-date-field"
                  aria-label="预订结束日期"
                  onClick={(event) => {
                    event.stopPropagation()
                    openDatePanel('end')
                  }}
                >
                  {bookingEndDate}
                </button>
                <i aria-hidden="true" />
              </div>
            </label>

            <label className="statistics-distribution-field statistics-distribution-field--keyword">
              <span>订单搜索:</span>
              <input
                value={keyword}
                placeholder="请输入订单编号/预订人/手机号"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>

            <div className="statistics-distribution-field statistics-distribution-field--select">
              <span>订单筛选:</span>
              <div className="order-ledger-select-field statistics-distribution-select-shell">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={openFilter}
                  aria-label={`订单筛选 ${filterLabel}`}
                  onClick={() => setOpenFilter((value) => !value)}
                >
                  <strong>{filterLabel}</strong>
                </button>
                {openFilter ? (
                  <div className="order-ledger-options statistics-distribution-options" role="listbox" aria-label="订单筛选选项">
                    {orderFilterOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        role="option"
                        aria-selected={filter === option}
                        onClick={() => {
                          setFilter(option)
                          setOpenFilter(false)
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="statistics-distribution-actions">
              <button
                type="button"
                className="statistics-distribution-toggle"
                onClick={() => {
                  setExpanded(false)
                  setOpenFilter(false)
                  setIsDatePanelOpen(false)
                }}
              >
                收起
              </button>
              <button type="button" onClick={resetFilters} disabled={isLoading}>
                重置
              </button>
              <button type="button" className="is-primary" onClick={queryOrders} disabled={isLoading}>
                查询
              </button>
              <button
                type="button"
                onClick={() => setNotice('已生成聚合分销订单导出任务')}
                disabled={isLoading || !data?.rows.length}
              >
                导出明细
              </button>
            </div>
          </div>
        ) : (
          <div className="statistics-distribution-actions statistics-distribution-actions--collapsed">
            <button
              type="button"
              className="statistics-distribution-toggle"
              onClick={() => {
                setExpanded(true)
                setOpenFilter(false)
              }}
            >
              展开
            </button>
          </div>
        )}
      </section>

      <div className="sr-only-heading" role="status">
        {notice}
      </div>

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
            setDateDraft({ startDate: bookingStartDate, endDate: bookingEndDate })
          }}
          onPrevious={() => setCalendarMonth((current) => shiftMonth(current, -1))}
          onNext={() => setCalendarMonth((current) => shiftMonth(current, 1))}
          onPick={applyDateSelection}
        />
      ) : null}

      {error ? (
        <div className="distribution-order-alert" role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={() => reloadOrders('已重新发起加载')}>
            重新加载
          </button>
        </div>
      ) : null}

      <section className="distribution-order-table statistics-distribution-table" aria-label="聚合分销订单表格">
        <table>
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={9} className="statistics-distribution-table__cell">
                  <div className="distribution-order-empty">正在刷新聚合分销订单</div>
                </td>
              </tr>
            ) : error ? null : data?.rows.length ? (
              <>
                <tr className="is-summary">
                  <td>合计</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{formatAmount(data.summary.paidAmount)}</td>
                  <td>{formatAmount(data.summary.serviceFee)}</td>
                  <td>{formatAmount(data.summary.settlementAmount)}</td>
                  <td>{formatAmount(data.summary.settledAmount)}</td>
                  <td>-</td>
                </tr>
                {data.rows.map((row) => (
                  <tr key={row.orderId}>
                    <td>
                      <span className="statistics-distribution-order-id">{row.orderId}</span>
                    </td>
                    <td>{row.customerInfo}</td>
                    <td>{row.roomCategoryName}</td>
                    <td>{row.bookedTime}</td>
                    <td>{formatAmount(row.paidAmount)}</td>
                    <td>{formatAmount(row.serviceFee)}</td>
                    <td>{formatAmount(row.settlementAmount)}</td>
                    <td>{formatAmount(row.settledAmount)}</td>
                    <td>{row.settlementStatus}</td>
                  </tr>
                ))}
              </>
            ) : (
              <tr>
                <td colSpan={9} className="statistics-distribution-table__cell">
                  <div className="distribution-order-empty">当前条件暂无聚合分销订单</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="distribution-order-pagination" aria-label="分页">
        <span>
          第 {pageStart}-{pageEnd} 条/总共 {pageTotal} 条
        </span>
        <button type="button" aria-label="上一页" disabled>
          ‹
        </button>
        <span className="statistics-distribution-page-chip is-current" aria-current="page">
          1
        </span>
        <button type="button" aria-label="下一页" disabled>
          ›
        </button>
        <button type="button" onClick={() => setNotice('当前每页展示 20 条聚合分销订单')}>
          20 条/页
        </button>
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
    <div className="order-ledger-date-panel-wrap" role="presentation" onMouseDown={onClose}>
      <section
        className="order-ledger-date-panel"
        role="dialog"
        aria-label="预订时间日期面板"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="order-ledger-date-panel__header">
          <strong>{pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期'}</strong>
          <button type="button" aria-label="关闭预订时间日期面板" onClick={onClose}>
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

function formatAmount(value: number) {
  return value.toFixed(2)
}
