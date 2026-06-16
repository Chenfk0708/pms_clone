import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createPreSaleCouponMallExportTask,
  defaultPreSaleCouponMallQuery,
  fetchPreSaleCouponMallDashboard,
  PreSaleCouponMallServiceError,
  type PreSaleCouponMallDashboard,
  type PreSaleCouponMallDescriptionRow,
  type PreSaleCouponMallMetric,
  type PreSaleCouponMallQuery,
  type PreSaleCouponMallRow,
} from '../services/preSaleCouponMallReport'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './PresaleCouponMallReportPage.css'

type SelectKind = 'channel' | 'category' | null
type DatePickTarget = 'start' | 'end'
type DatePreset = 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth'

const datePresetOptions: Array<{ key: DatePreset; label: string }> = [
  { key: 'yesterday', label: '昨天' },
  { key: 'thisWeek', label: '本周' },
  { key: 'thisMonth', label: '本月' },
  { key: 'lastMonth', label: '上月' },
]

export function PresaleCouponMallReportPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [draft, setDraft] = useState<PreSaleCouponMallQuery>(() => makeInitialQuery())
  const [query, setQuery] = useState<PreSaleCouponMallQuery>(() => makeInitialQuery())
  const [dashboard, setDashboard] = useState<PreSaleCouponMallDashboard | null>(null)
  const [serviceError, setServiceError] = useState<PreSaleCouponMallServiceError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [datePanelOpen, setDatePanelOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => makeInitialQuery().startDate.slice(0, 7))
  const [datePickTarget, setDatePickTarget] = useState<DatePickTarget>('start')
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState<PreSaleCouponMallRow | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    async function run() {
      setIsLoading(true)
      setServiceError(null)
      try {
        const nextDashboard = await fetchPreSaleCouponMallDashboard(query, controller.signal)
        setDashboard(nextDashboard)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        if (error instanceof PreSaleCouponMallServiceError) {
          setServiceError(error)
          setDashboard(null)
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

  useEffect(() => {
    const nextQuery = makeInitialQuery()
    setDraft((current) => (isSamePreSaleCouponMallQuery(current, nextQuery) ? current : nextQuery))
    setQuery((current) => (isSamePreSaleCouponMallQuery(current, nextQuery) ? current : nextQuery))
    setCalendarMonth((current) => {
      const nextMonth = nextQuery.startDate.slice(0, 7)
      return current === nextMonth ? current : nextMonth
    })
    setDatePickTarget('start')
    setOpenSelect(null)
    setDatePanelOpen(false)
  }, [location.key, location.pathname, location.search, location.hash])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpenSelect(null)
      setDatePanelOpen(false)
      setDescriptionOpen(false)
      setSelectedRow(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const diagnosticsState = dashboard?.state ?? serviceError?.state ?? query.state ?? 'success'
  const diagnosticsProvider = dashboard?.provider ?? serviceError?.provider ?? 'mock'
  const diagnosticsRequest = dashboard?.request ?? serviceError?.request ?? query
  const rows = dashboard?.rows ?? []
  const channels = dashboard?.channels ?? [{ value: '', label: '全部渠道' }]
  const categories = dashboard?.categories ?? [{ value: '', label: '全部类型' }]
  const descriptions = dashboard?.descriptions ?? []
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: dashboard?.stores.map((store) => ({ id: store.id, label: store.name })),
  })
  const activePreset = findMatchingPreset(draft.startDate, draft.endDate)

  function updateDraft(next: Partial<PreSaleCouponMallQuery>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function applyFilters() {
    setQuery({ ...draft, page: 1 })
    setOpenSelect(null)
    setDatePanelOpen(false)
  }

  function resetFilters() {
    const nextQuery = createAllStoreQuery()
    setDraft(nextQuery)
    setQuery(nextQuery)
    setCalendarMonth(nextQuery.startDate.slice(0, 7))
    setDatePickTarget('start')
    setOpenSelect(null)
    setDatePanelOpen(false)
  }

  function refresh() {
    setQuery((current) => ({ ...current }))
    setOpenSelect(null)
    setDatePanelOpen(false)
  }

  async function exportRows() {
    setIsLoading(true)
    try {
      await createPreSaleCouponMallExportTask(query)
    } finally {
      setIsLoading(false)
    }
  }

  function chooseOption(kind: Exclude<SelectKind, null>, value: string) {
    updateDraft(kind === 'channel' ? { channelId: value } : { categoryId: value })
    setOpenSelect(null)
  }

  function switchStore(storeId: string) {
    setOpenSelect(null)
    setDatePanelOpen(false)

    if (storeId === 'all') {
      updateDraft({ poiId: 'all', poiName: '全部门店' })
      return
    }

    const store = storeOptions.find((item) => item.id === storeId)
    updateDraft({ poiId: storeId, poiName: store?.label ?? storeId })
  }

  function openDatePanel(target: DatePickTarget = 'start') {
    setOpenSelect(null)
    setDatePickTarget(target)
    setCalendarMonth(draft.startDate.slice(0, 7))
    setDatePanelOpen(true)
  }

  function pickDate(date: string) {
    if (datePickTarget === 'start') {
      updateDraft({
        startDate: date,
        endDate: date <= draft.endDate ? draft.endDate : date,
      })
      setDatePickTarget('end')
      return
    }

    updateDraft({
      startDate: date < draft.startDate ? date : draft.startDate,
      endDate: date < draft.startDate ? draft.startDate : date,
    })
    setDatePickTarget('start')
    setDatePanelOpen(false)
  }

  function applyPreset(preset: DatePreset) {
    const nextRange = buildPresetRange(preset)
    updateDraft(nextRange)
    setCalendarMonth(nextRange.startDate.slice(0, 7))
    setDatePickTarget('start')
    setDatePanelOpen(false)
  }

  return (
    <div className="presale-coupon-report-page">
      <h1 className="sr-only-heading">预售券核销明细</h1>
      <output
        id="pre-sale-coupon-mall-diagnostics"
        hidden
        data-provider={diagnosticsProvider}
        data-state={diagnosticsState}
        data-request={JSON.stringify(diagnosticsRequest)}
      />

      <section className="presale-coupon-query" aria-label="预售券数据筛选">
        <StoreSelectControl
          className="presale-coupon-store-switch"
          label="门店切换"
          options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
          value={draft.poiId}
          disabled={storeLoading}
          onChange={(storeId) => switchStore(storeId)}
          settingsLabel="打开门店信息设置"
          onSettingsClick={() => navigate('/InformationMaintenance/campInfo')}
        />

        <div className="presale-coupon-filter-row">
          <div className="presale-coupon-date-range">
            <span>统计日期:</span>
            <button
              type="button"
              className="presale-coupon-date-trigger"
              aria-label="统计日期"
              onClick={() => openDatePanel('start')}
            >
              <strong>{draft.startDate}</strong>
              <em>至</em>
              <strong>{draft.endDate}</strong>
              <i aria-hidden="true">📅</i>
            </button>
            {datePanelOpen ? (
              <DatePanel
                month={calendarMonth}
                startDate={draft.startDate}
                endDate={draft.endDate}
                pickTarget={datePickTarget}
                activePreset={activePreset}
                onPrevious={() => setCalendarMonth((current) => shiftMonth(current, -1))}
                onNext={() => setCalendarMonth((current) => shiftMonth(current, 1))}
                onPick={pickDate}
                onPreset={applyPreset}
              />
            ) : null}
          </div>

          <SelectField
            label="渠道:"
            displayValue={labelForOption(channels, draft.channelId, '请选择')}
            isOpen={openSelect === 'channel'}
            options={channels}
            currentValue={draft.channelId}
            ariaLabel="渠道选项"
            onToggle={() => {
              setDatePanelOpen(false)
              setOpenSelect(openSelect === 'channel' ? null : 'channel')
            }}
            onSelect={(value) => chooseOption('channel', value)}
          />

          <SelectField
            label="预售券类型:"
            displayValue={labelForOption(categories, draft.categoryId, '请选择')}
            isOpen={openSelect === 'category'}
            options={categories}
            currentValue={draft.categoryId}
            ariaLabel="预售券类型选项"
            onToggle={() => {
              setDatePanelOpen(false)
              setOpenSelect(openSelect === 'category' ? null : 'category')
            }}
            onSelect={(value) => chooseOption('category', value)}
          />

          <label className="presale-coupon-keyword">
            <span>商品搜索:</span>
            <input
              value={draft.keyword}
              placeholder="请输入商品编号/商品名称"
              onChange={(event) => updateDraft({ keyword: event.target.value })}
            />
          </label>
        </div>

        {/*
        {openSelect === 'channel' ? (
          <SelectOptions
            ariaLabel="渠道选项"
            options={channels}
            currentValue={draft.channelId}
            onSelect={(value) => chooseOption('channel', value)}
          />
        ) : null}

        {openSelect === 'category' ? (
          <SelectOptions
            ariaLabel="预售券类型选项"
            options={categories}
            currentValue={draft.categoryId}
            onSelect={(value) => chooseOption('category', value)}
          />
        ) : null}
        */}

        <div className="presale-coupon-actions">
          <button type="button" className="is-outline" onClick={resetFilters} disabled={isLoading}>
            重置
          </button>
          <button type="button" className="is-primary" onClick={applyFilters} disabled={isLoading}>
            查询
          </button>
          <button type="button" className="is-outline" onClick={exportRows} disabled={isLoading}>
            导出
          </button>
          <button
            type="button"
            className="is-outline"
            onClick={() => {
              setOpenSelect(null)
              setDatePanelOpen(false)
              setDescriptionOpen(true)
            }}
          >
            说明
          </button>
        </div>
      </section>

      {serviceError ? (
        <section className="presale-coupon-alert" role="alert">
          <strong>预售券核销明细加载失败</strong>
          <span>请稍后重试，或调整筛选条件后重新加载。</span>
          <button type="button" onClick={refresh}>
            重新加载
          </button>
        </section>
      ) : null}

      <section className="presale-coupon-metrics" aria-label="预售券核销指标">
        {(dashboard?.metrics ?? []).map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </section>

      <section className="presale-coupon-table-wrap" aria-label="预售券数据表格">
        <table className="presale-coupon-table">
          <thead>
            <tr>
              <th>商品名称</th>
              <th>预售券类型</th>
              <th>渠道</th>
              <th>成交券数</th>
              <th>交易金额</th>
              <th>成交率</th>
              <th>核销券数</th>
              <th>核销金额</th>
              <th>核销率</th>
              <th>退款券数</th>
              <th>退款金额</th>
              <th>退款率</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.preSaleName}</td>
                <td>{row.categoryName}</td>
                <td>{row.channelName}</td>
                <td>{row.makeBargainCount}</td>
                <td>{formatAmount(row.transactionPrice)}</td>
                <td>{row.turnoverRate}</td>
                <td>{row.writeOffCount}</td>
                <td>{formatAmount(row.writeOffPrice)}</td>
                <td>{row.writeOffRate}</td>
                <td>{row.refundCount}</td>
                <td>{formatAmount(row.refundPrice)}</td>
                <td>{row.refundRate}</td>
                <td>
                  <button
                    type="button"
                    className="presale-coupon-link"
                    aria-label={`查看详情 ${row.preSaleName}`}
                    onClick={() => setSelectedRow(row)}
                  >
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && !serviceError && rows.length === 0 ? (
          <div className="presale-coupon-empty" role="status">
            <span className="presale-coupon-empty-icon" aria-hidden="true" />
            <strong>当前筛选条件下暂无核销明细</strong>
          </div>
        ) : null}
      </section>

      {descriptionOpen ? (
        <DescriptionDialog descriptions={descriptions} onClose={() => setDescriptionOpen(false)} />
      ) : null}

      {selectedRow ? <DetailDialog row={selectedRow} onClose={() => setSelectedRow(null)} /> : null}
    </div>
  )
}

function makeInitialQuery(): PreSaleCouponMallQuery {
  const query = createAllStoreQuery()
  const params = readRouteSearchParams()
  const mockState = params.get('mockState')
  if (mockState === 'empty' || mockState === 'error') query.state = mockState
  return query
}

function readRouteSearchParams() {
  const hashQueryIndex = window.location.hash.indexOf('?')
  if (hashQueryIndex >= 0) {
    return new URLSearchParams(window.location.hash.slice(hashQueryIndex + 1))
  }
  return new URLSearchParams(window.location.search)
}

function createAllStoreQuery(): PreSaleCouponMallQuery {
  const query = defaultPreSaleCouponMallQuery()
  return {
    ...query,
    poiId: 'all',
    poiName: '全部门店',
  }
}

function isSamePreSaleCouponMallQuery(left: PreSaleCouponMallQuery, right: PreSaleCouponMallQuery) {
  return (
    left.campId === right.campId &&
    left.poiId === right.poiId &&
    left.poiName === right.poiName &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.channelId === right.channelId &&
    left.categoryId === right.categoryId &&
    left.keyword === right.keyword &&
    left.page === right.page &&
    left.pageSize === right.pageSize &&
    left.state === right.state
  )
}

function labelForOption(
  options: Array<{ value: string; label: string }>,
  value: string,
  fallback: string,
) {
  return options.find((option) => option.value === value)?.label ?? fallback
}

function formatAmount(value: number) {
  return value.toLocaleString('zh-CN')
}

function SelectField({
  label,
  displayValue,
  isOpen,
  options,
  currentValue,
  ariaLabel,
  onToggle,
  onSelect,
}: {
  label: string
  displayValue: string
  isOpen: boolean
  options: Array<{ value: string; label: string }>
  currentValue: string
  ariaLabel: string
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="presale-coupon-select-field">
      <span>{label}</span>
      <div className="presale-coupon-select-field__control">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`${label} ${displayValue}`}
          onClick={onToggle}
        >
          {displayValue}
        </button>
        {isOpen ? (
          <SelectOptions
            ariaLabel={ariaLabel}
            options={options}
            currentValue={currentValue}
            onSelect={onSelect}
          />
        ) : null}
      </div>
    </div>
  )
}

function SelectOptions({
  ariaLabel,
  options,
  currentValue,
  onSelect,
}: {
  ariaLabel: string
  options: Array<{ value: string; label: string }>
  currentValue: string
  onSelect: (value: string) => void
}) {
  const availableOptions = options.filter((option) => option.value !== '')

  return (
    <div className="presale-coupon-options" role="listbox" aria-label={ariaLabel}>
      {availableOptions.length > 0 ? (
        availableOptions.map((option) => (
          <button
            key={option.value || option.label}
            type="button"
            role="option"
            aria-selected={currentValue === option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </button>
        ))
      ) : (
        <div className="presale-coupon-options-empty">
          <span className="presale-coupon-options-empty__icon" aria-hidden="true" />
          <strong>鏆傛棤鏁版嵁</strong>
        </div>
      )}
    </div>
  )
}

function MetricCard({ metric }: { metric: PreSaleCouponMallMetric }) {
  return (
    <button type="button" className="presale-coupon-metric" aria-label={metric.title}>
      <span>{metric.title}</span>
      <strong>
        {formatAmount(metric.value)}
        <em>{metric.unit}</em>
      </strong>
      <small>{metric.detail}</small>
    </button>
  )
}

function DatePanel({
  month,
  startDate,
  endDate,
  pickTarget,
  activePreset,
  onPrevious,
  onNext,
  onPick,
  onPreset,
}: {
  month: string
  startDate: string
  endDate: string
  pickTarget: DatePickTarget
  activePreset: DatePreset | null
  onPrevious: () => void
  onNext: () => void
  onPick: (date: string) => void
  onPreset: (preset: DatePreset) => void
}) {
  const months = [month, shiftMonth(month, 1)]

  return (
    <div className="presale-coupon-date-panel" role="dialog" aria-label="统计日期面板">
      <div className="presale-coupon-date-presets">
        <span>{pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期'}</span>
        {datePresetOptions.map((preset) => (
          <button
            key={preset.key}
            type="button"
            className={activePreset === preset.key ? 'is-active' : ''}
            onClick={() => onPreset(preset.key)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="presale-coupon-date-months">
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
    <section className="presale-coupon-calendar-month">
      <header>
        <button type="button" aria-label="上个月" onClick={onPrevious} disabled={!onPrevious}>
          ‹
        </button>
        <h2>{formatMonthLabel(month)}</h2>
        <button type="button" aria-label="下个月" onClick={onNext} disabled={!onNext}>
          ›
        </button>
      </header>
      <div className="presale-coupon-calendar-weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="presale-coupon-calendar-days">
        {days.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`${day.isMuted ? 'is-muted' : ''}${day.date >= startDate && day.date <= endDate ? ' is-in-range' : ''}${day.date === startDate || day.date === endDate ? ' is-picked' : ''}`}
            onClick={() => onPick(day.date)}
          >
            {day.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function DescriptionDialog({
  descriptions,
  onClose,
}: {
  descriptions: PreSaleCouponMallDescriptionRow[]
  onClose: () => void
}) {
  return (
    <div className="presale-coupon-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="presale-coupon-description-modal"
        role="dialog"
        aria-modal="true"
        aria-label="字段说明"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <strong>字段说明</strong>
          <button type="button" aria-label="关闭字段说明" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="presale-coupon-description-table">
          <div className="presale-coupon-description-table__head">
            <span>字段</span>
            <span>说明</span>
          </div>
          {descriptions.map((item) => (
            <div key={item.field} className="presale-coupon-description-table__row">
              <span>{item.field}</span>
              <span>{item.description}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function DetailDialog({ row, onClose }: { row: PreSaleCouponMallRow; onClose: () => void }) {
  return (
    <div className="presale-coupon-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="presale-coupon-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-label="预售券详情"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <strong>预售券详情</strong>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>商品名称</dt>
            <dd>{row.preSaleName}</dd>
          </div>
          <div>
            <dt>预售券类型</dt>
            <dd>{row.categoryName}</dd>
          </div>
          <div>
            <dt>关联渠道</dt>
            <dd>{row.channelName}</dd>
          </div>
          <div>
            <dt>最近更新时间</dt>
            <dd>{row.updatedAt}</dd>
          </div>
          <div>
            <dt>备注</dt>
            <dd>{row.remark}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}

function findMatchingPreset(startDate: string, endDate: string) {
  for (const preset of datePresetOptions) {
    const range = buildPresetRange(preset.key)
    if (range.startDate === startDate && range.endDate === endDate) {
      return preset.key
    }
  }
  return null
}

function buildPresetRange(preset: DatePreset) {
  const today = new Date()
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  if (preset === 'yesterday') {
    const yesterday = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1)
    const value = formatDate(yesterday)
    return { startDate: value, endDate: value }
  }

  if (preset === 'thisWeek') {
    const day = current.getDay() === 0 ? 7 : current.getDay()
    const start = new Date(current.getFullYear(), current.getMonth(), current.getDate() - day + 1)
    return { startDate: formatDate(start), endDate: formatDate(current) }
  }

  if (preset === 'lastMonth') {
    const start = new Date(current.getFullYear(), current.getMonth() - 1, 1)
    const end = new Date(current.getFullYear(), current.getMonth(), 0)
    return { startDate: formatDate(start), endDate: formatDate(end) }
  }

  const start = new Date(current.getFullYear(), current.getMonth(), 1)
  const end = new Date(current.getFullYear(), current.getMonth() + 1, 0)
  return { startDate: formatDate(start), endDate: formatDate(end) }
}

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const nextDate = new Date(year, monthIndex - 1 + offset, 1)
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string) {
  const [year, monthValue] = month.split('-')
  return `${year}年 ${Number(monthValue)}月`
}

function buildCalendarDays(month: string) {
  const [year, monthValue] = month.split('-').map(Number)
  const firstDay = new Date(year, monthValue - 1, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, monthValue - 1, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    return {
      date: formatDate(date),
      label: String(date.getDate()),
      isMuted: date.getMonth() !== monthValue - 1,
    }
  })
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
