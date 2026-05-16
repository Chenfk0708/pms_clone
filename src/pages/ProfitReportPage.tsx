import { useState } from 'react'
import './ProfitReportPage.css'

type SelectKind = 'roomType' | 'channel' | 'roomGroup' | null

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']
const roomTypeOptions = ['观影大床房', '天落大床电竞套间', '总裁套间（桑拿浴缸露台电竞麻将）', '顶层套房（浴缸巨幕电竞麻将）']
const channelOptions = ['携程', '途家', '飞猪淘酒店', '美团民宿', '小猪', '木鸟']
const roomGroupOptions = ['全部房型分组', '顶层房型', '电竞套间', '观影大床房']

const reportRows = [
  { date: '合计', roomFee: '8207.71', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '8207.71', expense: '0', profit: '8207.71', margin: '100.00%' },
  { date: '2026-05-01', roomFee: '966.87', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '966.87', expense: '0', profit: '966.87', margin: '100.00%' },
  { date: '2026-05-02', roomFee: '682', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '682', expense: '0', profit: '682', margin: '100.00%' },
  { date: '2026-05-03', roomFee: '791.8', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '791.8', expense: '0', profit: '791.8', margin: '100.00%' },
  { date: '2026-05-04', roomFee: '895.3', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '895.3', expense: '0', profit: '895.3', margin: '100.00%' },
  { date: '2026-05-05', roomFee: '623.21', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '623.21', expense: '0', profit: '623.21', margin: '100.00%' },
  { date: '2026-05-06', roomFee: '160.28', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '160.28', expense: '0', profit: '160.28', margin: '100.00%' },
  { date: '2026-05-07', roomFee: '163.94', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '163.94', expense: '0', profit: '163.94', margin: '100.00%' },
  { date: '2026-05-08', roomFee: '182.81', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '182.81', expense: '0', profit: '182.81', margin: '100.00%' },
  { date: '2026-05-09', roomFee: '182.81', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '182.81', expense: '0', profit: '182.81', margin: '100.00%' },
  { date: '2026-05-10', roomFee: '302.59', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '302.59', expense: '0', profit: '302.59', margin: '100.00%' },
  { date: '2026-05-11', roomFee: '327.88', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '327.88', expense: '0', profit: '327.88', margin: '100.00%' },
  { date: '2026-05-12', roomFee: '497.7', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '497.7', expense: '0', profit: '497.7', margin: '100.00%' },
  { date: '2026-05-13', roomFee: '819.13', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '819.13', expense: '0', profit: '819.13', margin: '100.00%' },
  { date: '2026-05-14', roomFee: '505.82', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '505.82', expense: '0', profit: '505.82', margin: '100.00%' },
  { date: '2026-05-15', roomFee: '0', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '0', expense: '0', profit: '0', margin: '0%' },
  { date: '2026-05-16', roomFee: '209.17', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '209.17', expense: '0', profit: '209.17', margin: '100.00%' },
  { date: '2026-05-17', roomFee: '298.8', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '298.8', expense: '0', profit: '298.8', margin: '100.00%' },
  { date: '2026-05-18', roomFee: '298.8', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '298.8', expense: '0', profit: '298.8', margin: '100.00%' },
  { date: '2026-05-19', roomFee: '298.8', ticket: '0', catering: '0', other: '0', manualIncome: '0', total: '298.8', expense: '0', profit: '298.8', margin: '100.00%' },
]

const descriptions = [
  ['房费(减佣)', '房费(含佣) - 佣金'],
  ['门票/餐饮', '核销金额-佣金-退款金额'],
  ['其他消费', '订单手工录入的其他收入/支出'],
  ['记一笔收入', '记一笔录入的收入'],
  ['记一笔支出', '记一笔录入的支出'],
  ['利润', '收入-支出'],
  ['利润率', '利润/收入'],
]

export function ProfitReportPage() {
  const [store, setStore] = useState(stores[0])
  const [startDate, setStartDate] = useState('2026-05-01')
  const [endDate, setEndDate] = useState('2026-05-31')
  const [roomType, setRoomType] = useState('')
  const [channel, setChannel] = useState('')
  const [roomGroup, setRoomGroup] = useState('')
  const [includeCleanFee, setIncludeCleanFee] = useState(false)
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [expanded, setExpanded] = useState(true)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function resetFilters() {
    setStore(stores[0])
    setStartDate('2026-05-01')
    setEndDate('2026-05-31')
    setRoomType('')
    setChannel('')
    setRoomGroup('')
    setIncludeCleanFee(false)
    setOpenSelect(null)
    setExpanded(true)
    setNotice('')
  }

  return (
    <div className="profit-report-page">
      <h1 className="sr-only-heading">利润报表</h1>

      <section className="profit-report-query" aria-label="利润报表筛选">
        <div className="profit-report-store-row" role="radiogroup" aria-label="门店">
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
          <div className="profit-report-filter-row">
            <fieldset className="profit-date-range" aria-label="日期">
              <legend>日期</legend>
              <input aria-label="开始日期" placeholder="开始日期" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <span>至</span>
              <input aria-label="结束日期" placeholder="结束日期" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </fieldset>

            <SelectField
              label="房型"
              placeholder="请选择"
              value={roomType}
              kind="roomType"
              openSelect={openSelect}
              options={roomTypeOptions}
              onToggle={() => setOpenSelect(openSelect === 'roomType' ? null : 'roomType')}
              onSelect={(value) => {
                setRoomType(value)
                setOpenSelect(null)
              }}
            />
            <SelectField
              label="渠道"
              placeholder="请选择"
              value={channel}
              kind="channel"
              openSelect={openSelect}
              options={channelOptions}
              onToggle={() => setOpenSelect(openSelect === 'channel' ? null : 'channel')}
              onSelect={(value) => {
                setChannel(value)
                setOpenSelect(null)
              }}
            />
            <SelectField
              label="房型分组"
              placeholder="请选择"
              value={roomGroup}
              kind="roomGroup"
              openSelect={openSelect}
              options={roomGroupOptions}
              onToggle={() => setOpenSelect(openSelect === 'roomGroup' ? null : 'roomGroup')}
              onSelect={(value) => {
                setRoomGroup(value)
                setOpenSelect(null)
              }}
            />

            <label className="profit-checkbox">
              <input checked={includeCleanFee} type="checkbox" onChange={(event) => setIncludeCleanFee(event.target.checked)} />
              包含保洁费用
            </label>
          </div>
        ) : null}

        <div className="profit-report-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              setOpenSelect(null)
              setNotice('已按当前条件查询利润报表')
            }}
          >
            查 询
          </button>
          <button type="button" className="is-outline" onClick={() => setNotice('已生成利润报表导出任务')}>
            导 出
          </button>
          <button
            type="button"
            className="is-outline"
            onClick={() => {
              setOpenSelect(null)
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
              setExpanded((value) => !value)
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      {notice ? (
        <div className="profit-report-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="profit-report-table-wrap" aria-label="利润报表表格">
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
            {reportRows.map((row) => (
              <tr key={row.date} className={row.date === '合计' ? 'is-summary' : ''}>
                <td>{row.date}</td>
                <td>{row.roomFee}</td>
                <td>{row.ticket}</td>
                <td>{row.catering}</td>
                <td>{row.other}</td>
                <td>{row.manualIncome}</td>
                <td>{row.total}</td>
                <td>{row.expense}</td>
                <td>{row.profit}</td>
                <td>{row.margin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav className="profit-report-pagination" aria-label="分页">
        <span>第 1-20 条/总共 32 条</span>
        <button type="button" aria-label="上一页" disabled>
          ‹
        </button>
        <button type="button" className="is-current">
          1
        </button>
        <button type="button">2</button>
        <button type="button" aria-label="下一页">
          ›
        </button>
        <button type="button">20 条/页</button>
      </nav>

      {descriptionOpen ? (
        <div className="profit-modal-backdrop" role="presentation">
          <section className="profit-description-modal" role="dialog" aria-modal="true" aria-label="报表字段说明">
            <header>
              <strong>报表字段说明</strong>
              <button type="button" aria-label="关闭报表字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="profit-description-table" aria-label="报表字段说明表格">
              <div className="profit-description-table__head">
                <span>字段</span>
                <span>说明</span>
              </div>
              {descriptions.map(([field, detail]) => (
                <div key={field} className="profit-description-table__row">
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
  placeholder,
  value,
  kind,
  openSelect,
  options,
  onToggle,
  onSelect,
}: {
  label: string
  placeholder: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  options: string[]
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="profit-select-field">
      <span>{label}</span>
      <div className="profit-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={openSelect === kind} aria-label={`${label} ${value || placeholder}`} onClick={onToggle}>
          {value || placeholder}
        </button>
        {openSelect === kind ? (
          <div className="profit-options" role="listbox" aria-label={`${label}选项`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => onSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
