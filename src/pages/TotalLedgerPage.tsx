import { useState } from 'react'
import './TotalLedgerPage.css'

type RangeKey = 'yesterday' | 'today' | 'lastWeek' | 'thisWeek' | 'lastMonth' | 'thisMonth'

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']

const ranges: Array<{ key: RangeKey; label: string; start: string; end: string }> = [
  { key: 'yesterday', label: '昨天', start: '2026-05-13', end: '2026-05-13' },
  { key: 'today', label: '今天', start: '2026-05-14', end: '2026-05-14' },
  { key: 'lastWeek', label: '上周', start: '2026-05-04', end: '2026-05-10' },
  { key: 'thisWeek', label: '本周', start: '2026-05-11', end: '2026-05-14' },
  { key: 'lastMonth', label: '上月', start: '2026-04-01', end: '2026-04-30' },
  { key: 'thisMonth', label: '本月', start: '2026-05-01', end: '2026-05-14' },
]

const rows = [
  { date: '合计', collection: '815.26' },
  { date: '2026-05-13', collection: '815.26' },
]

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

export function TotalLedgerPage() {
  const [activeStore, setActiveStore] = useState(stores[0])
  const [activeRange, setActiveRange] = useState<RangeKey>('yesterday')
  const [startDate, setStartDate] = useState('2026-05-13')
  const [endDate, setEndDate] = useState('2026-05-13')
  const [expanded, setExpanded] = useState(true)
  const [dateDialogOpen, setDateDialogOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function applyRange(key: RangeKey) {
    const range = ranges.find((item) => item.key === key)
    if (!range) return
    setActiveRange(key)
    setStartDate(range.start)
    setEndDate(range.end)
    setNotice('')
  }

  function resetFilters() {
    setActiveStore(stores[0])
    applyRange('yesterday')
    setExpanded(true)
    setDateDialogOpen(false)
  }

  return (
    <div className="total-ledger-page">
      <h1 className="sr-only-heading">收支汇总</h1>

      <section className="total-ledger-filter" aria-label="收支汇总筛选">
        <div className="total-ledger-store-row" role="radiogroup" aria-label="门店">
          {stores.map((store) => (
            <button
              key={store}
              type="button"
              role="radio"
              aria-checked={activeStore === store}
              className={activeStore === store ? 'is-active' : ''}
              onClick={() => setActiveStore(store)}
            >
              {store}
            </button>
          ))}
        </div>

        {expanded ? (
          <div className="total-ledger-range-row">
            <fieldset className="total-ledger-date-range">
              <legend>日期</legend>
              <input
                aria-label="开始日期"
                placeholder="开始日期"
                readOnly
                value={startDate}
                onClick={() => setDateDialogOpen(true)}
              />
              <span>至</span>
              <input
                aria-label="结束日期"
                placeholder="结束日期"
                readOnly
                value={endDate}
                onClick={() => setDateDialogOpen(true)}
              />
            </fieldset>

            <div className="total-ledger-range-buttons" role="group" aria-label="日期快捷筛选">
              {ranges.map((range) => (
                <button
                  key={range.key}
                  type="button"
                  className={activeRange === range.key ? 'is-active' : ''}
                  onClick={() => applyRange(range.key)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="total-ledger-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => setNotice('已生成收支汇总导出任务')}
          >
            导 出
          </button>
          <button
            type="button"
            className="is-link"
            onClick={() => {
              setExpanded((value) => !value)
              setDateDialogOpen(false)
            }}
          >
            {expanded ? '收 起' : '展 开'}
          </button>
        </div>
      </section>

      {notice ? (
        <div className="total-ledger-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="total-ledger-summary" aria-label="账本概括">
        <article className="total-ledger-card total-ledger-balance-card">
          <h2>账本概括</h2>
          <div className="total-ledger-balance">
            <div className="total-ledger-balance__icon">净收入</div>
            <div>
              <span>净收入</span>
              <strong>¥ 815.26</strong>
              <p>总收入：¥ 815.26</p>
              <p>总支出：¥ 0</p>
            </div>
          </div>
        </article>

        <RatioCard title="收入占比" value="100%" tone="income" />
        <RatioCard title="支出占比" value="0%" tone="expense" />
      </section>

      <section className="total-ledger-table-section">
        <h2>收支汇总表</h2>
        <div className="total-ledger-table-wrap" aria-label="收支汇总表格">
          <table className="total-ledger-table">
            <thead>
              <tr>
                <th>日期</th>
                <th>平台代收</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date} className={row.date === '合计' ? 'is-summary' : ''}>
                  <td>{row.date}</td>
                  <td>{row.collection}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <nav className="total-ledger-pagination" aria-label="分页">
            <span>第 1-2 条/总共 2 条</span>
            <button type="button" className="is-current">
              1
            </button>
          </nav>
        </div>
      </section>

      {dateDialogOpen ? <DatePickerDialog onClose={() => setDateDialogOpen(false)} /> : null}
    </div>
  )
}

function RatioCard({ title, value, tone }: { title: string; value: string; tone: 'income' | 'expense' }) {
  return (
    <article className="total-ledger-card total-ledger-ratio-card" aria-label={title}>
      <h2>{title}</h2>
      <div className={`total-ledger-donut is-${tone}`} aria-hidden="true">
        <span>{value}</span>
      </div>
    </article>
  )
}

function DatePickerDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="total-ledger-date-popover" role="dialog" aria-label="日期选择">
      <CalendarMonth title="2026年" month="5月" weeks={mayWeeks} highlight="13" />
      <CalendarMonth title="2026年" month="6月" weeks={juneWeeks} />
      <div className="total-ledger-date-popover__footer">
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

function CalendarMonth({ title, month, weeks, highlight }: { title: string; month: string; weeks: string[][]; highlight?: string }) {
  return (
    <section className="total-ledger-calendar" aria-label={`${title}${month}`}>
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
      <div className="total-ledger-calendar__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="total-ledger-calendar__grid">
        {weeks.flat().map((day, index) => (
          <button
            key={`${month}-${index}`}
            type="button"
            className={day === highlight ? 'is-selected' : index < 4 && month === '5月' ? 'is-muted' : ''}
          >
            {day}
          </button>
        ))}
      </div>
    </section>
  )
}
