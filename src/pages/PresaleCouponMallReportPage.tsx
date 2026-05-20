import { useEffect, useState } from 'react'
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
import './PresaleCouponMallReportPage.css'

type SelectKind = 'channel' | 'category' | null

export function PresaleCouponMallReportPage() {
  const [draft, setDraft] = useState<PreSaleCouponMallQuery>(() => makeInitialQuery())
  const [query, setQuery] = useState<PreSaleCouponMallQuery>(() => makeInitialQuery())
  const [dashboard, setDashboard] = useState<PreSaleCouponMallDashboard | null>(null)
  const [serviceError, setServiceError] = useState<PreSaleCouponMallServiceError | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [datePanelOpen, setDatePanelOpen] = useState(false)
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
  const selectedStore = dashboard?.stores[0]?.name ?? draft.poiName

  function updateDraft(next: Partial<PreSaleCouponMallQuery>) {
    setDraft((current) => ({ ...current, ...next }))
  }

  function applyFilters() {
    setQuery({ ...draft, page: 1 })
    setOpenSelect(null)
    setDatePanelOpen(false)
    setNotice('已按当前条件刷新核销明细')
  }

  function resetFilters() {
    const nextQuery = defaultPreSaleCouponMallQuery()
    setDraft(nextQuery)
    setQuery(nextQuery)
    setOpenSelect(null)
    setDatePanelOpen(false)
    setNotice('筛选条件已重置')
  }

  function refresh() {
    setQuery((current) => ({ ...current }))
    setOpenSelect(null)
    setDatePanelOpen(false)
    setNotice('已刷新预售券核销明细')
  }

  async function exportRows() {
    setIsLoading(true)
    try {
      await createPreSaleCouponMallExportTask(query)
      setNotice('导出任务已创建')
    } finally {
      setIsLoading(false)
    }
  }

  function chooseOption(kind: Exclude<SelectKind, null>, value: string) {
    updateDraft(kind === 'channel' ? { channelId: value } : { categoryId: value })
    setOpenSelect(null)
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
        <section className="presale-coupon-store-field" aria-label="门店">
          <span>门店</span>
          <strong>{selectedStore}</strong>
        </section>

        <div className="presale-coupon-filter-row">
          <label className="presale-coupon-date-range">
            <span>统计日期</span>
            <div className="presale-coupon-date-inputs">
              <input
                aria-label="开始日期"
                value={draft.startDate}
                onChange={(event) => updateDraft({ startDate: event.target.value })}
                onFocus={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
                onClick={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
                readOnly
              />
              <em>至</em>
              <input
                aria-label="结束日期"
                value={draft.endDate}
                onChange={(event) => updateDraft({ endDate: event.target.value })}
                onFocus={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
                onClick={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
                readOnly
              />
            </div>
            {datePanelOpen ? <DatePanel /> : null}
          </label>

          <SelectField
            label="渠道"
            displayValue={labelForOption(channels, draft.channelId, '全部渠道')}
            isOpen={openSelect === 'channel'}
            onToggle={() => {
              setDatePanelOpen(false)
              setOpenSelect(openSelect === 'channel' ? null : 'channel')
            }}
          />

          <SelectField
            label="预售券类型"
            displayValue={labelForOption(categories, draft.categoryId, '全部类型')}
            isOpen={openSelect === 'category'}
            onToggle={() => {
              setDatePanelOpen(false)
              setOpenSelect(openSelect === 'category' ? null : 'category')
            }}
          />

          <label className="presale-coupon-keyword">
            <span>商品搜索</span>
            <input
              value={draft.keyword}
              placeholder="请输入商品编号/商品名称"
              onChange={(event) => updateDraft({ keyword: event.target.value })}
            />
          </label>
        </div>

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

        <div className="presale-coupon-actions">
          <button type="button" className="is-outline" onClick={resetFilters} disabled={isLoading}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={applyFilters} disabled={isLoading}>
            查 询
          </button>
          <button type="button" className="is-outline" onClick={refresh} disabled={isLoading}>
            刷 新
          </button>
          <button type="button" className="is-outline" onClick={exportRows} disabled={isLoading}>
            导 出
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
            说 明
          </button>
        </div>
      </section>

      {notice || isLoading ? (
        <div className="presale-coupon-notice" role="status">
          {isLoading ? '预售券核销明细加载中' : notice}
        </div>
      ) : null}

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
  const query = defaultPreSaleCouponMallQuery()
  const params = new URLSearchParams(window.location.search)
  const mockState = params.get('mockState')
  if (mockState === 'empty' || mockState === 'error') query.state = mockState
  return query
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
  onToggle,
}: {
  label: string
  displayValue: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <label className="presale-coupon-select-field">
      <span>{label}</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} ${displayValue}`}
        onClick={onToggle}
      >
        {displayValue}
      </button>
    </label>
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
  return (
    <div className="presale-coupon-options" role="listbox" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value || option.label}
          type="button"
          role="option"
          aria-selected={currentValue === option.value}
          onClick={() => onSelect(option.value)}
        >
          {option.label}
        </button>
      ))}
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

function DatePanel() {
  const mayDays = ['27', '28', '29', '30', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '1', '2', '3', '4', '5', '6', '7']
  const juneDays = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

  return (
    <div className="presale-coupon-date-panel" role="dialog" aria-label="统计日期面板">
      <CalendarMonth title="2026年5月" days={mayDays} highlighted={['1', '31']} />
      <CalendarMonth title="2026年6月" days={juneDays} highlighted={[]} />
      <div className="presale-coupon-date-presets">
        {['昨天', '本周', '本月', '上月'].map((preset) => (
          <button key={preset} type="button">
            {preset}
          </button>
        ))}
      </div>
    </div>
  )
}

function CalendarMonth({
  title,
  days,
  highlighted,
}: {
  title: string
  days: string[]
  highlighted: string[]
}) {
  return (
    <section className="presale-coupon-calendar-month">
      <h2>{title}</h2>
      <div className="presale-coupon-calendar-weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="presale-coupon-calendar-days">
        {days.map((day, index) => (
          <button key={`${title}-${day}-${index}`} type="button" className={highlighted.includes(day) ? 'is-picked' : ''}>
            {day}
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
