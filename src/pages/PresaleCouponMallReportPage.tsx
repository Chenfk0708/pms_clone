import { useEffect, useState } from 'react'
import './PresaleCouponMallReportPage.css'

type SelectKind = 'channel' | 'couponType' | null

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']

const tableColumns = [
  '商品名称',
  '成交券数',
  '交易金额',
  '成交率',
  '核销券数',
  '核销金额',
  '核销率',
  '退款券数',
  '退款金额',
  '退款率',
  '操作',
]

const descriptionRows = [
  ['成交券数', '商品的总成交券数（包括已核销、未核销、已退款的券）'],
  ['成交金额', '商品的总交易金额（包括已核销、未核销、已退款的金额）'],
  ['成交率', '成交券数÷总券数 x 100%'],
  ['核销率', '核销券数÷成交券数 x 100%'],
]

export function PresaleCouponMallReportPage() {
  const [store, setStore] = useState(stores[0])
  const [startDate, setStartDate] = useState('2026-05-01')
  const [endDate, setEndDate] = useState('2026-05-31')
  const [channel, setChannel] = useState('')
  const [couponType, setCouponType] = useState('')
  const [keyword, setKeyword] = useState('')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [datePanelOpen, setDatePanelOpen] = useState(false)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpenSelect(null)
      setDatePanelOpen(false)
      setDescriptionOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function resetFilters() {
    setStore(stores[0])
    setStartDate('2026-05-01')
    setEndDate('2026-05-31')
    setChannel('')
    setCouponType('')
    setKeyword('')
    setOpenSelect(null)
    setDatePanelOpen(false)
    setExpanded(true)
    setNotice('')
  }

  return (
    <div className="presale-coupon-report-page">
      <h1 className="sr-only-heading">预售券核销明细</h1>

      <section className="presale-coupon-query" aria-label="预售券数据筛选">
        <div className="presale-coupon-store-row" role="radiogroup" aria-label="门店">
          {stores.map((item) => (
            <button
              key={item}
              type="button"
              role="radio"
              aria-checked={store === item}
              className={store === item ? 'is-active' : ''}
              onClick={() => setStore(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {expanded ? (
          <div className="presale-coupon-filter-row">
            <fieldset className="presale-coupon-date-range" aria-label="统计日期">
              <legend>统计日期</legend>
              <input
                aria-label="开始日期"
                placeholder="开始日期"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                onFocus={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
                onClick={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
              />
              <span>至</span>
              <input
                aria-label="结束日期"
                placeholder="结束日期"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                onFocus={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
                onClick={() => {
                  setOpenSelect(null)
                  setDatePanelOpen(true)
                }}
              />
              {datePanelOpen ? <DatePanel /> : null}
            </fieldset>

            <SelectField
              label="渠道"
              value={channel}
              kind="channel"
              openSelect={openSelect}
              onToggle={() => {
                setDatePanelOpen(false)
                setOpenSelect(openSelect === 'channel' ? null : 'channel')
              }}
              onSelect={(value) => {
                setChannel(value)
                setOpenSelect(null)
              }}
            />

            <SelectField
              label="预售券类型"
              value={couponType}
              kind="couponType"
              openSelect={openSelect}
              onToggle={() => {
                setDatePanelOpen(false)
                setOpenSelect(openSelect === 'couponType' ? null : 'couponType')
              }}
              onSelect={(value) => {
                setCouponType(value)
                setOpenSelect(null)
              }}
            />

            <label className="presale-coupon-keyword">
              <span>商品搜索</span>
              <input
                value={keyword}
                placeholder="请输入商品编号/商品名称"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <div className="presale-coupon-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              setOpenSelect(null)
              setDatePanelOpen(false)
              setNotice('已按当前条件查询预售券数据')
            }}
          >
            查 询
          </button>
          <button type="button" className="is-outline" onClick={() => setNotice('已生成预售券数据导出任务')}>
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
          <button
            type="button"
            className="is-link"
            onClick={() => {
              setOpenSelect(null)
              setDatePanelOpen(false)
              setExpanded((value) => !value)
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      {notice ? (
        <div className="presale-coupon-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="presale-coupon-table-wrap" aria-label="预售券数据表格">
        <table className="presale-coupon-table">
          <thead>
            <tr>
              {tableColumns.map((heading) => (
                <th key={heading}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="is-empty">
              <td colSpan={tableColumns.length}>
                <span className="presale-coupon-empty-icon" aria-hidden="true" />
                <strong>暂无数据</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {descriptionOpen ? (
        <div className="presale-coupon-modal-backdrop" role="presentation" onClick={() => setDescriptionOpen(false)}>
          <section
            className="presale-coupon-description-modal"
            role="dialog"
            aria-modal="true"
            aria-label="字段说明"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <strong>字段说明</strong>
              <button type="button" aria-label="关闭字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="presale-coupon-description-table">
              <div className="presale-coupon-description-table__head">
                <span>字段</span>
                <span>说明</span>
              </div>
              {descriptionRows.map(([field, detail]) => (
                <div key={field} className="presale-coupon-description-table__row">
                  <span>{field}</span>
                  <span>{detail}</span>
                </div>
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
  value,
  kind,
  openSelect,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  const open = openSelect === kind
  const displayValue = value || '请选择'

  return (
    <div className="presale-coupon-select-field">
      <span>{label}</span>
      <div className="presale-coupon-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label} ${displayValue}`} onClick={onToggle}>
          {displayValue}
        </button>
        {open ? (
          <div className="presale-coupon-options" role="listbox" aria-label={`${label}选项`}>
            <button type="button" role="option" aria-selected="false" disabled onClick={() => onSelect('')}>
              暂无数据
            </button>
          </div>
        ) : null}
      </div>
    </div>
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

function CalendarMonth({ title, days, highlighted }: { title: string; days: string[]; highlighted: string[] }) {
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
