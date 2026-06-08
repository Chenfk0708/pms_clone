import { useEffect, useMemo, useState } from 'react'
import {
  createInitialSalesReportQuery,
  createSalesReportExportTask,
  createSalesReportRequestBody,
  getDefaultSalesReportQuery,
  getSalesReportStaticLookups,
  loadSalesReportDashboard,
  type SalesReportColumnGroup,
  type SalesReportDashboard,
  type SalesReportExportTask,
  type SalesReportQuery,
  type SalesReportServiceError,
  type SalesReportTab,
  type SalesReportTableRow,
} from '../services/salesReport'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './SalesReportPage.css'

type ExpandableSalesColumn =
  | 'adr'
  | 'adrMinusCommission'
  | 'roomFeeIncludingCommission'
  | 'accommodationOrderCount'

type DerivedColumn = {
  key: string
  label: string
  expanded?: boolean
  expandable?: ExpandableSalesColumn
}

type ExpandableMeta = {
  label: string
  afterIndex: number
  groupIndex: number
  children: string[]
}

const tabs: Array<{ key: SalesReportTab; label: string }> = [
  { key: 'day', label: '按日' },
  { key: 'month', label: '按月' },
  { key: 'store', label: '按门店' },
  { key: 'channel', label: '按渠道' },
  { key: 'roomType', label: '按房型' },
  { key: 'room', label: '按房间' },
]

const staticLookups = getSalesReportStaticLookups()

const expandableColumnMeta: Record<ExpandableSalesColumn, ExpandableMeta> = {
  adr: {
    label: 'ADR',
    afterIndex: 7,
    groupIndex: 3,
    children: ['全日房ADR', '钟点房ADR'],
  },
  adrMinusCommission: {
    label: 'ADR(减佣)',
    afterIndex: 8,
    groupIndex: 3,
    children: ['全日房ADR(减佣)', '钟点房ADR(减佣)'],
  },
  roomFeeIncludingCommission: {
    label: '房费(含佣)',
    afterIndex: 13,
    groupIndex: 5,
    children: ['全日房费(含佣)', '钟点房费(含佣)'],
  },
  accommodationOrderCount: {
    label: '住宿订单总数',
    afterIndex: 14,
    groupIndex: 6,
    children: ['自来客'],
  },
}

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
  const [expandedColumns, setExpandedColumns] = useState<ExpandableSalesColumn[]>([])
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: (dashboard?.stores ?? staticLookups.stores).map((store) => ({ id: store.id, label: store.label })),
  })

  useEffect(() => {
    void runQuery(query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentState = error ? 'error' : dashboard?.state ?? query.mockState ?? 'success'
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

  const isExpandableTable = Boolean(dashboard && dashboard.table.columns.length >= 15 && dashboard.table.groups.length >= 7)
  const derivedColumns = useMemo(
    () => (dashboard ? buildDerivedColumns(dashboard, expandedColumns) : []),
    [dashboard, expandedColumns],
  )
  const derivedGroups = useMemo(
    () => (dashboard ? buildDerivedGroups(dashboard, expandedColumns) : []),
    [dashboard, expandedColumns],
  )
  const derivedRows = useMemo(
    () => (dashboard ? buildDerivedRows(dashboard, expandedColumns) : []),
    [dashboard, expandedColumns],
  )

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
      const traceId =
        reason instanceof Error && 'response' in reason ? readTraceId(reason as SalesReportServiceError) : ''
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
    setExpandedColumns([])
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
    setExpandedColumns([])
    void runQuery(nextQuery, '已重置筛选条件')
  }

  function handleQuery() {
    setExportTask(null)
    setExpandedColumns([])
    void runQuery({ ...query, pageNum: 1 }, '已按当前条件刷新销况报表')
  }

  async function handleExport() {
    const nextExportTask = await createSalesReportExportTask(query)
    setExportTask(nextExportTask)
    setNotice(nextExportTask.message)
  }

  function toggleExpandedColumn(column: ExpandableSalesColumn) {
    setExpandedColumns((current) =>
      current.includes(column) ? current.filter((item) => item !== column) : [...current, column],
    )
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

      <section className="sales-report-panel">
        <section className="sales-report-query" aria-label="销况报表筛选">
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

          <div className="sales-report-form">
            <StoreSelectControl
              className="sales-report-store-row"
              label="门店范围"
              options={storeOptions.map((item) => ({ id: item.id, name: item.label }))}
              value={query.storeScope}
              disabled={storeLoading}
              onChange={(storeId) => patchQuery({ storeScope: storeId })}
            />

            {!filtersCollapsed ? (
              <div className="sales-report-filter-row">
                {query.activeTab === 'month' ? (
                  <DateMonthFields
                    startValue={query.monthStartDate.slice(0, 7)}
                    endValue={query.monthEndDate.slice(0, 7)}
                    onStartChange={(value) => patchQuery({ monthStartDate: `${value}-01` })}
                    onEndChange={(value) =>
                      patchQuery({ monthEndDate: `${value}-${lastDayOfMonth(value)}` })
                    }
                  />
                ) : (
                  <DateDayFields
                    startValue={query.dayStartDate}
                    endValue={query.dayEndDate}
                    onStartChange={(value) => patchQuery({ dayStartDate: value })}
                    onEndChange={(value) => patchQuery({ dayEndDate: value })}
                  />
                )}

                {query.activeTab !== 'store' ? (
                  <SelectField
                    id="sales-room-type"
                    label="房型"
                    value={roomTypeValue}
                    options={roomTypes}
                    onChange={(value) =>
                      patchQuery({ roomCategoryIds: value ? [value] : [], roomIds: [] })
                    }
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
                    onChange={(value) =>
                      patchQuery({ roomCategoryGroupIds: value ? [value] : [] })
                    }
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="sales-report-actions">
            <button type="button" className="is-outline" disabled={isLoading} onClick={handleReset}>
              重置
            </button>
            <button type="button" className="is-primary" disabled={isLoading} onClick={handleQuery}>
              查询
            </button>
            <button
              type="button"
              className="is-outline"
              disabled={isLoading}
              onClick={() => void handleExport()}
            >
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
              {filtersCollapsed ? '展开' : '收起'}
            </button>
          </div>
        </section>
      </section>

      <div className="sr-only-heading" role="status" aria-label="销况报表操作反馈">
        {notice}
      </div>

      {error ? (
        <section className="sales-report-alert" role="alert" aria-label="销况报表加载失败">
          <strong>销况报表加载失败</strong>
          <p>{error}</p>
          <button type="button" onClick={() => void runQuery(query, '已重新加载销况报表')}>
            重试
          </button>
        </section>
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
                {derivedGroups.map((group, index) => (
                  <th key={`${group.label}-${index}`} colSpan={group.span}>
                    {group.label}
                  </th>
                ))}
              </tr>
              <tr>
                {derivedColumns.map((column) =>
                  column.expandable && isExpandableTable ? (
                    <ExpandableHeader
                      key={column.key}
                      label={column.label}
                      expanded={Boolean(column.expanded)}
                      onClick={() => toggleExpandedColumn(column.expandable!)}
                    />
                  ) : (
                    <th key={column.key} className={column.expanded ? 'is-expanded-group' : ''}>
                      {column.label}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {derivedRows.map((row) => (
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
}: {
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
}) {
  return (
    <div className="sales-date-field">
      <span>开始日期</span>
      <div className="sales-date-field__body">
        <div className="sales-date-range" aria-label="日期">
          <label htmlFor="sales-day-start" className="sr-only-heading">
            开始日期
          </label>
          <input
            id="sales-day-start"
            aria-label="开始日期"
            type="date"
            value={startValue}
            onChange={(event) => onStartChange(event.target.value)}
          />
          <span>至</span>
          <label htmlFor="sales-day-end" className="sr-only-heading">
            结束日期
          </label>
          <input
            id="sales-day-end"
            aria-label="结束日期"
            type="date"
            value={endValue}
            onChange={(event) => onEndChange(event.target.value)}
          />
          <i aria-hidden="true" />
        </div>
      </div>
    </div>
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
    <div className="sales-date-field">
      <span>开始月份</span>
      <div className="sales-date-field__body">
        <div className="sales-date-range sales-date-range--month" aria-label="月份">
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
          <input
            id="sales-month-end"
            aria-label="结束月份"
            type="month"
            value={endValue}
            onChange={(event) => onEndChange(event.target.value)}
          />
          <i aria-hidden="true" />
        </div>
      </div>
    </div>
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

function ExpandableHeader({
  label,
  expanded,
  onClick,
}: {
  label: string
  expanded: boolean
  onClick: () => void
}) {
  return (
    <th className={expanded ? 'is-expanded-group' : ''}>
      <button
        type="button"
        className={`sales-table-expand${expanded ? ' is-expanded' : ''}`}
        aria-expanded={expanded}
        aria-label={`${label}${expanded ? '收起子列' : '展开子列'}`}
        onClick={onClick}
      >
        <span>{label}</span>
        <i aria-hidden="true" />
      </button>
    </th>
  )
}

function buildDerivedColumns(
  dashboard: SalesReportDashboard,
  expandedColumns: ExpandableSalesColumn[],
): DerivedColumn[] {
  const columns: DerivedColumn[] = dashboard.table.columns.map((label, index) => {
    const expandable = getExpandableKey(index)
    return {
      key: `base-${index}`,
      label,
      expandable,
      expanded: expandable ? expandedColumns.includes(expandable) : false,
    }
  })

  const sortedExpanded = [...expandedColumns].sort(
    (left, right) => expandableColumnMeta[left].afterIndex - expandableColumnMeta[right].afterIndex,
  )

  sortedExpanded.forEach((column) => {
    const meta = expandableColumnMeta[column]
    const insertIndex = columns.findIndex((item) => item.key === `base-${meta.afterIndex}`) + 1
    if (insertIndex <= 0) return

    columns.splice(
      insertIndex,
      0,
      ...meta.children.map((label, childIndex) => ({
        key: `${column}-${childIndex}`,
        label,
        expanded: true,
      })),
    )
  })

  return columns
}

function buildDerivedGroups(
  dashboard: SalesReportDashboard,
  expandedColumns: ExpandableSalesColumn[],
): SalesReportColumnGroup[] {
  const groups = dashboard.table.groups.map((group) => ({ ...group }))
  expandedColumns.forEach((column) => {
    const meta = expandableColumnMeta[column]
    if (groups[meta.groupIndex]) {
      groups[meta.groupIndex] = {
        ...groups[meta.groupIndex],
        span: groups[meta.groupIndex].span + meta.children.length,
      }
    }
  })
  return groups
}

function buildDerivedRows(
  dashboard: SalesReportDashboard,
  expandedColumns: ExpandableSalesColumn[],
): SalesReportTableRow[] {
  const sortedExpanded = [...expandedColumns].sort(
    (left, right) => expandableColumnMeta[left].afterIndex - expandableColumnMeta[right].afterIndex,
  )

  return dashboard.table.rows.map((row) => {
    const cells = [...row.cells]

    sortedExpanded.forEach((column) => {
      const insertIndex = expandableColumnMeta[column].afterIndex + 1
      cells.splice(insertIndex, 0, ...buildExpandedCells(row.cells, column))
    })

    return {
      ...row,
      cells,
    }
  })
}

function buildExpandedCells(rowCells: string[], column: ExpandableSalesColumn) {
  if (column === 'adr') return [rowCells[7] ?? '-', '0']
  if (column === 'adrMinusCommission') return [rowCells[8] ?? '-', '0']
  if (column === 'roomFeeIncludingCommission') return [rowCells[13] ?? '-', '0']
  return ['0']
}

function getExpandableKey(index: number): ExpandableSalesColumn | undefined {
  if (index === 7) return 'adr'
  if (index === 8) return 'adrMinusCommission'
  if (index === 13) return 'roomFeeIncludingCommission'
  if (index === 14) return 'accommodationOrderCount'
  return undefined
}

function lastDayOfMonth(monthValue: string) {
  const [yearText, monthText] = monthValue.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return '31'
  return String(new Date(year, month, 0).getDate()).padStart(2, '0')
}

function readTraceId(reason: SalesReportServiceError) {
  return reason.response.traceId || ''
}
