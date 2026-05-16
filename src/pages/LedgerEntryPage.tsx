import { useState } from 'react'
import './LedgerEntryPage.css'

type SelectKind = 'type' | 'roomType' | null
type RangeKey = 'yesterday' | 'today' | 'lastWeek' | 'thisWeek' | 'lastMonth' | 'thisMonth'

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']
const ranges: Array<{ key: RangeKey; label: string; start: string; end: string }> = [
  { key: 'yesterday', label: '昨天', start: '2026-05-13', end: '2026-05-13' },
  { key: 'today', label: '今天', start: '2026-05-14', end: '2026-05-14' },
  { key: 'lastWeek', label: '上周', start: '2026-05-04', end: '2026-05-10' },
  { key: 'thisWeek', label: '本周', start: '2026-05-11', end: '2026-05-14' },
  { key: 'lastMonth', label: '上月', start: '2026-04-01', end: '2026-04-30' },
  { key: 'thisMonth', label: '本月', start: '2026-05-01', end: '2026-05-31' },
]

const typeOptions = ['全部类型', '收入', '支出']
const roomTypeOptions = ['观影大床房', '天落大床电竞套间', '总裁套间（桑拿浴缸露台电竞麻将）', '顶层套房（浴缸巨幕电竞麻将）']

const mayWeeks = [
  ['27', '28', '29', '30', '1', '2', '3'],
  ['4', '5', '6', '7', '8', '9', '10'],
  ['11', '12', '13', '14', '15', '16', '17'],
  ['18', '19', '20', '21', '22', '23', '24'],
  ['25', '26', '27', '28', '29', '30', '31'],
  ['1', '2', '3', '4', '5', '6', '7'],
]

const juneWeeks = [
  ['1', '2', '3', '4', '5', '6', '7'],
  ['8', '9', '10', '11', '12', '13', '14'],
  ['15', '16', '17', '18', '19', '20', '21'],
  ['22', '23', '24', '25', '26', '27', '28'],
  ['29', '30', '1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '10', '11', '12'],
]

export function LedgerEntryPage() {
  const [store, setStore] = useState(stores[0])
  const [range, setRange] = useState<RangeKey>('thisMonth')
  const [startDate, setStartDate] = useState('2026-05-01')
  const [endDate, setEndDate] = useState('2026-05-31')
  const [type, setType] = useState(typeOptions[0])
  const [roomType, setRoomType] = useState('请选择房型')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [dateOpen, setDateOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function applyRange(key: RangeKey) {
    const nextRange = ranges.find((item) => item.key === key)
    if (!nextRange) return
    setRange(key)
    setStartDate(nextRange.start)
    setEndDate(nextRange.end)
    setDateOpen(false)
    setNotice('')
  }

  function resetFilters() {
    setStore(stores[0])
    applyRange('thisMonth')
    setType(typeOptions[0])
    setRoomType('请选择房型')
    setOpenSelect(null)
    setNotice('')
  }

  return (
    <div className="ledger-entry-page">
      <h1 className="sr-only-heading">记一笔明细</h1>

      <section className="ledger-entry-filter" aria-label="记一笔明细筛选">
        <div className="ledger-entry-store-row" role="radiogroup" aria-label="门店">
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
          <button type="button" className="ledger-entry-gear" aria-label="门店设置">
            ⚙
          </button>
        </div>

        <div className="ledger-entry-date-line">
          <div className="ledger-entry-presets" role="group" aria-label="日期快捷筛选">
            {ranges.map((item) => (
              <button
                key={item.key}
                type="button"
                className={range === item.key ? 'is-active' : ''}
                onClick={() => applyRange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ledger-entry-date-range" aria-label="账本日期">
            <input aria-label="开始日期" placeholder="开始日期" readOnly value={startDate} onClick={() => setDateOpen(true)} />
            <span>→</span>
            <input aria-label="结束日期" placeholder="结束日期" readOnly value={endDate} onClick={() => setDateOpen(true)} />
          </div>
        </div>

        <div className="ledger-entry-field-line">
          <SelectField
            label="类型"
            value={type}
            kind="type"
            openSelect={openSelect}
            optionLabel="类型选项"
            options={typeOptions}
            onToggle={() => setOpenSelect(openSelect === 'type' ? null : 'type')}
            onSelect={(value) => {
              setType(value)
              setOpenSelect(null)
            }}
          />
          <SelectField
            label="房型"
            value={roomType}
            kind="roomType"
            openSelect={openSelect}
            optionLabel="房型选项"
            options={roomTypeOptions}
            onToggle={() => setOpenSelect(openSelect === 'roomType' ? null : 'roomType')}
            onSelect={(value) => {
              setRoomType(value)
              setOpenSelect(null)
            }}
          />
        </div>

        <div className="ledger-entry-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重置筛选
          </button>
          <button type="button" className="is-primary" onClick={() => setNotice('已生成记一笔明细导出任务')}>
            报表导出
          </button>
        </div>
      </section>

      {notice ? (
        <div className="ledger-entry-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="ledger-entry-summary" aria-label="账本概括">
        <h2>账本概括</h2>
        <div className="ledger-entry-summary-grid">
          <SummaryCard label="收入(元)" value="¥ 0.00" />
          <SummaryCard label="支出 (元)" value="¥0.00" />
        </div>
      </section>

      <section className="ledger-entry-table-section" aria-label="账本明细表格">
        <h2>账本明细</h2>
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
              <tr className="ledger-entry-empty-row">
                <td colSpan={9}>
                  <div className="ledger-entry-empty">
                    <span aria-hidden="true" />
                    <p>暂无数据</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {dateOpen ? <DatePickerDialog onClose={() => setDateOpen(false)} /> : null}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="ledger-entry-summary-card">
      <div className="ledger-entry-card-label">
        <span aria-hidden="true">¥</span>
        <strong>{label}</strong>
      </div>
      <b>{value}</b>
    </article>
  )
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
  options: string[]
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
            <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => onSelect(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DatePickerDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="ledger-entry-date-popover" role="dialog" aria-label="日期选择">
      <CalendarMonth title="2026年" month="5月" weeks={mayWeeks} start="1" end="31" />
      <CalendarMonth title="2026年" month="6月" weeks={juneWeeks} />
      <div className="ledger-entry-date-popover__footer">
        <button type="button" onClick={onClose}>
          取消
        </button>
        <button type="button" className="is-primary" onClick={onClose}>
          确定
        </button>
      </div>
    </div>
  )
}

function CalendarMonth({
  title,
  month,
  weeks,
  start,
  end,
}: {
  title: string
  month: string
  weeks: string[][]
  start?: string
  end?: string
}) {
  return (
    <section className="ledger-entry-calendar" aria-label={`${title}${month}`}>
      <header>
        <button type="button" aria-label="上一月">
          ‹
        </button>
        <strong>{title}</strong>
        <strong>{month}</strong>
        <button type="button" aria-label="下一月">
          ›
        </button>
      </header>
      <div className="ledger-entry-calendar__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="ledger-entry-calendar__grid">
        {weeks.flat().map((day, index) => (
          <button
            key={`${month}-${index}`}
            type="button"
            className={`${index < 4 && month === '5月' ? 'is-muted' : ''}${day === start || day === end ? ' is-selected' : ''}`}
          >
            {day}
          </button>
        ))}
      </div>
    </section>
  )
}
