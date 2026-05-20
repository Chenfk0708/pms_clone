import { useEffect, useMemo, useState } from 'react'
import {
  createInitialSalesReportQuery,
  createSalesReportExportTask,
  createSalesReportRequestBody,
  getDefaultSalesReportQuery,
  getSalesReportStaticLookups,
  loadSalesReportDashboard,
  type SalesReportDashboard,
  type SalesReportExportTask,
  type SalesReportQuery,
  type SalesReportServiceError,
  type SalesReportTab,
} from '../services/salesReport'
import './SalesReportPage.css'

const tabs: Array<{ key: SalesReportTab; label: string }> = [
  { key: 'day', label: '按日' },
  { key: 'month', label: '按月' },
  { key: 'store', label: '按门店' },
  { key: 'channel', label: '按渠道' },
  { key: 'roomType', label: '按房型' },
  { key: 'room', label: '按房间' },
]

const defaultSalesReportQuery = getDefaultSalesReportQuery()
const staticLookups = getSalesReportStaticLookups()

export function SalesReportPage() {
  const [query, setQuery] = useState<SalesReportQuery>(createInitialSalesReportQuery)
  const [dashboard, setDashboard] = useState<SalesReportDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [errorTraceId, setErrorTraceId] = useState('')
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [filtersCollapsed, setFiltersCollapsed] = useState(false)
  const [exportTask, setExportTask] = useState<SalesReportExportTask | null>(null)

  useEffect(() => {
    void runQuery(query)
    // The initial request should only run once; follow-up changes go through explicit handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentState = error ? 'error' : dashboard?.state ?? query.mockState ?? 'success'
  const stores = dashboard?.stores ?? staticLookups.stores
  const roomTypes = dashboard?.roomTypes ?? staticLookups.roomTypes
  const channels = dashboard?.channels ?? staticLookups.channels
  const roomGroups = dashboard?.roomGroups ?? staticLookups.roomGroups
  const rooms = dashboard?.rooms ?? staticLookups.rooms
  const descriptionItems = dashboard?.descriptionItems ?? staticLookups.descriptionItems
  const requestBody = useMemo(() => createSalesReportRequestBody(query), [query])
  const serviceContract = useMemo(
    () =>
      JSON.stringify({
        provider: dashboard?.provider ?? query.provider ?? 'mock',
        state: currentState,
        tab: query.activeTab,
        requestBody,
        rows: dashboard?.table.rows.length ?? 0,
        traceId: dashboard?.traceId ?? errorTraceId,
      }),
    [currentState, dashboard, errorTraceId, query.activeTab, query.provider, requestBody],
  )

  const exportContract = useMemo(() => JSON.stringify(exportTask ?? {}), [exportTask])

  async function runQuery(nextQuery: SalesReportQuery, nextNotice = '') {
    setIsLoading(true)
    setError('')
    setErrorTraceId('')
    setDescriptionOpen(false)

    try {
      const nextDashboard = await loadSalesReportDashboard(nextQuery)
      setDashboard(nextDashboard)
      setQuery(nextQuery)
      setNotice(nextNotice)
    } catch (reason) {
      const nextError = reason instanceof Error ? reason.message : '销况报表加载失败，请稍后重试'
      const traceId = reason instanceof Error && 'response' in reason ? readTraceId(reason as SalesReportServiceError) : ''
      setDashboard(null)
      setQuery(nextQuery)
      setNotice('')
      setError(nextError)
      setErrorTraceId(traceId)
    } finally {
      setIsLoading(false)
    }
  }

  function patchQuery(patch: Partial<SalesReportQuery>) {
    setQuery((current) => ({
      ...current,
      ...patch,
    }))
  }

  function handleTabChange(activeTab: SalesReportTab) {
    const defaults = getDefaultSalesReportQuery()
    const nextQuery: SalesReportQuery = {
      ...query,
      activeTab,
      roomIds: activeTab === 'room' ? query.roomIds : [],
      pageNum: 1,
      monthStartDate: defaults.monthStartDate,
      monthEndDate: defaults.monthEndDate,
    }
    setExportTask(null)
    void runQuery(nextQuery, `已切换到${tabs.find((item) => item.key === activeTab)?.label}`)
  }

  function handleReset() {
    const defaults = getDefaultSalesReportQuery()
    const nextQuery: SalesReportQuery = {
      ...defaults,
      activeTab: query.activeTab,
      provider: query.provider,
      mockState: query.mockState,
    }
    setExportTask(null)
    void runQuery(nextQuery, '已重置筛选条件')
  }

  function handleQuery() {
    setExportTask(null)
    void runQuery({ ...query, pageNum: 1 }, '已按当前条件刷新销况报表')
  }

  async function handleExport() {
    const nextExportTask = await createSalesReportExportTask(query)
    setExportTask(nextExportTask)
    setNotice(nextExportTask.message)
  }

  const roomTypeValue = query.roomCategoryIds[0] ?? ''
  const channelValue = query.channelIds[0] ?? ''
  const roomGroupValue = query.roomCategoryGroupIds[0] ?? ''
  const roomValue = query.roomIds[0] ?? ''

  return (
    <div
      className="sales-report-page"
      data-provider={dashboard?.provider ?? query.provider ?? 'mock'}
      data-response-state={currentState}
      data-trace-id={dashboard?.traceId ?? errorTraceId}
    >
      <h1 className="sr-only-heading">销况报表</h1>

      <pre hidden data-testid="sales-report-service-contract">
        {serviceContract}
      </pre>
      <pre hidden data-testid="sales-report-export-contract">
        {exportContract}
      </pre>

      <section className="sales-report-panel" aria-label="销况报表筛选">
        <div className="sales-report-tabs" role="tablist" aria-label="销况报表维度">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={query.activeTab === tab.key}
              className={query.activeTab === tab.key ? 'is-active' : ''}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="sales-report-store-row" role="radiogroup" aria-label="门店范围">
          {stores.map((item) => (
            <label key={item.id} className={query.storeScope === item.id ? 'is-active' : ''}>
              <input
                type="radio"
                name="sales-store-scope"
                value={item.id}
                checked={query.storeScope === item.id}
                onChange={() => patchQuery({ storeScope: item.id })}
              />
              <span>{item.label}</span>
            </label>
          ))}
          <span className="sales-store-name">{dashboard?.currentStoreName ?? staticLookups.currentStoreName}</span>
        </div>

        {!filtersCollapsed ? (
          <div className="sales-report-filter-row">
            {query.activeTab === 'month' ? (
              <DateMonthFields
                startValue={query.monthStartDate.slice(0, 7)}
                endValue={query.monthEndDate.slice(0, 7)}
                onStartChange={(value) => patchQuery({ monthStartDate: `${value}-01` })}
                onEndChange={(value) => patchQuery({ monthEndDate: `${value}-${lastDayOfMonth(value)}` })}
              />
            ) : (
              <DateDayFields
                startValue={query.dayStartDate}
                endValue={query.dayEndDate}
                onStartChange={(value) => patchQuery({ dayStartDate: value })}
                onEndChange={(value) => patchQuery({ dayEndDate: value })}
                onShortcutSelect={({ startDate, endDate }) =>
                  patchQuery({
                    dayStartDate: startDate,
                    dayEndDate: endDate,
                  })
                }
              />
            )}

            {query.activeTab !== 'store' ? (
              <SelectField
                id="sales-room-type"
                label="房型"
                value={roomTypeValue}
                options={roomTypes}
                onChange={(value) => patchQuery({ roomCategoryIds: value ? [value] : [], roomIds: [] })}
              />
            ) : null}

            {query.activeTab === 'room' ? (
              <SelectField
                id="sales-room"
                label="房间"
                value={roomValue}
                options={rooms}
                onChange={(value) => patchQuery({ roomIds: value ? [value] : [] })}
              />
            ) : null}

            <SelectField
              id="sales-channel"
              label="渠道"
              value={channelValue}
              options={channels}
              onChange={(value) => patchQuery({ channelIds: value ? [value] : [] })}
            />

            {query.activeTab !== 'store' ? (
              <SelectField
                id="sales-room-group"
                label="房型分组"
                value={roomGroupValue}
                options={roomGroups}
                onChange={(value) => patchQuery({ roomCategoryGroupIds: value ? [value] : [] })}
              />
            ) : null}
          </div>
        ) : null}

        <div className="sales-report-actions">
          <button type="button" className="is-outline" disabled={isLoading} onClick={handleReset}>
            重置
          </button>
          <button type="button" className="is-primary" disabled={isLoading} onClick={handleQuery}>
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
              setNotice('')
            }}
          >
            说明
          </button>
          <button
            type="button"
            className="is-link"
            disabled={isLoading}
            aria-label={filtersCollapsed ? '展开筛选' : '收起筛选'}
            onClick={() => setFiltersCollapsed((current) => !current)}
          >
            {filtersCollapsed ? '展开筛选' : '收起筛选'}
          </button>
        </div>
      </section>

      {error ? (
        <section className="sales-report-alert" role="alert" aria-label="销况报表加载失败">
          <strong>销况报表加载失败</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void runQuery(query, '已重新加载销况报表')}>
            重试
          </button>
        </section>
      ) : null}

      {notice ? (
        <div className="sales-report-notice" role="status" aria-label="销况报表操作反馈">
          {notice}
        </div>
      ) : null}

      <section className="sales-report-table-wrap" aria-label="销况报表表格">
        {isLoading ? (
          <div className="sales-report-empty">正在加载销况报表...</div>
        ) : dashboard && dashboard.table.rows.length === 0 ? (
          <div className="sales-report-empty">{dashboard.emptyMessage}</div>
        ) : (
          <table className="sales-report-table" aria-label="销况报表表格">
            <thead>
              <tr>
                {dashboard?.table.groups.map((group, index) => (
                  <th key={`${group.label}-${index}`} colSpan={group.span}>
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr>
                {dashboard?.table.columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboard?.table.rows.map((row) => (
                <tr key={row.id} className={row.summary ? 'is-summary' : ''}>
                  {row.cells.map((cell, index) => (
                    <td key={`${row.id}-${index}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {!isLoading && dashboard ? (
        <nav className="sales-report-pagination" aria-label="分页">
          <span>{dashboard.pageText}</span>
          <button type="button" disabled aria-label="上一页">
            上一页
          </button>
          <button type="button" className="is-current" aria-current="page" disabled>
            {dashboard.pagination.pageNum}
          </button>
          <button type="button" disabled aria-label="下一页">
            下一页
          </button>
          <button type="button" disabled>
            {dashboard.pagination.pageSize} 条/页
          </button>
        </nav>
      ) : null}

      {descriptionOpen ? (
        <div className="sales-modal-backdrop" role="presentation">
          <section className="sales-description-modal" role="dialog" aria-modal="true" aria-label="报表字段说明">
            <header>
              <strong>报表字段说明</strong>
              <button type="button" aria-label="关闭报表字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="sales-description-grid">
              {descriptionItems.map((item) => (
                <div key={item.field} className="sales-description-row">
                  <span>{item.field}</span>
                  <span>{item.detail}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function DateDayFields({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  onShortcutSelect,
}: {
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  onShortcutSelect: (range: { startDate: string; endDate: string }) => void
}) {
  const shortcuts = createDayShortcuts(defaultSalesReportQuery.dayEndDate)

  return (
    <fieldset className="sales-date-range" aria-label="日期">
      <legend>日期</legend>
      <label htmlFor="sales-day-start" className="sr-only-heading">
        开始日期
      </label>
      <input id="sales-day-start" aria-label="开始日期" type="date" value={startValue} onChange={(event) => onStartChange(event.target.value)} />
      <span>至</span>
      <label htmlFor="sales-day-end" className="sr-only-heading">
        结束日期
      </label>
      <input id="sales-day-end" aria-label="结束日期" type="date" value={endValue} onChange={(event) => onEndChange(event.target.value)} />
      <div className="sales-date-shortcuts" aria-label="日期快捷">
        {shortcuts.map((shortcut) => (
          <button key={shortcut.label} type="button" onClick={() => onShortcutSelect(shortcut)}>
            {shortcut.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function DateMonthFields({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
}: {
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}) {
  return (
    <fieldset className="sales-date-range" aria-label="月份">
      <legend>月份</legend>
      <label htmlFor="sales-month-start" className="sr-only-heading">
        开始月份
      </label>
      <input
        id="sales-month-start"
        aria-label="开始月份"
        type="month"
        value={startValue}
        onChange={(event) => onStartChange(event.target.value)}
      />
      <span>至</span>
      <label htmlFor="sales-month-end" className="sr-only-heading">
        结束月份
      </label>
      <input id="sales-month-end" aria-label="结束月份" type="month" value={endValue} onChange={(event) => onEndChange(event.target.value)} />
    </fieldset>
  )
}

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: Array<{ id: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="sales-select-field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">请选择</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function lastDayOfMonth(monthValue: string) {
  const [yearText, monthText] = monthValue.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return '31'
  return String(new Date(year, month, 0).getDate()).padStart(2, '0')
}

function createDayShortcuts(anchorDate: string) {
  const anchor = parseDateValue(anchorDate)
  const yesterday = shiftUtcDays(anchor, -1)
  const weekStart = shiftUtcDays(anchor, -((anchor.getUTCDay() + 6) % 7))
  const monthStart = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
  const lastMonthStart = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - 1, 1))
  const lastMonthEnd = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 0))

  return [
    { label: '昨天', startDate: formatDateValue(yesterday), endDate: formatDateValue(yesterday) },
    { label: '本周', startDate: formatDateValue(weekStart), endDate: formatDateValue(anchor) },
    { label: '本月', startDate: formatDateValue(monthStart), endDate: formatDateValue(anchor) },
    { label: '上月', startDate: formatDateValue(lastMonthStart), endDate: formatDateValue(lastMonthEnd) },
  ]
}

function parseDateValue(value: string) {
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return parseDateValue(defaultSalesReportQuery.dayEndDate)
  }

  return new Date(Date.UTC(year, month - 1, day))
}

function shiftUtcDays(value: Date, amount: number) {
  const next = new Date(value.getTime())
  next.setUTCDate(next.getUTCDate() + amount)
  return next
}

function formatDateValue(value: Date) {
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function readTraceId(reason: SalesReportServiceError) {
  return reason.response.traceId || ''
}
