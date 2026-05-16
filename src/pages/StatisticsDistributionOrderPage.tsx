import { useEffect, useState } from 'react'
import './DistributionOrderPage.css'
import './StatisticsDistributionOrderPage.css'

type OrderFilter = '' | '全部' | '非置换订单' | '置换订单'

const tableColumns = [
  '订单号',
  '客户信息',
  '房型名称',
  '预订时间',
  '实付金额',
  '平台服务费',
  '应结算金额',
  '已结算金额',
  '结算状态',
]

const orderRow = {
  orderNo: '2054409001821356034',
  customer: '陈崇科/+8618319045566',
  roomType: '天落大床电竞套间',
  bookedAt: '2026-05-13 11:50:49',
  paidAmount: '435.00',
  serviceFee: '65.25',
  settlementAmount: '369.75',
  settledAmount: '0.00',
  settlementStatus: '待结算',
}

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

export function StatisticsDistributionOrderPage() {
  const [expanded, setExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<OrderFilter>('')
  const [openFilter, setOpenFilter] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    function closeFloating(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpenFilter(false)
      setDateOpen(false)
    }
    window.addEventListener('keydown', closeFloating)
    return () => window.removeEventListener('keydown', closeFloating)
  }, [])

  function resetFilters() {
    setKeyword('')
    setFilter('')
    setOpenFilter(false)
    setDateOpen(false)
    setNotice('')
  }

  const filterLabel = filter || '请选择'

  return (
    <div className="distribution-order-page statistics-distribution-order-page">
      <h1 className="sr-only-heading">聚合分销订单</h1>

      <section
        className={`distribution-order-query statistics-distribution-query${expanded ? ' is-expanded' : ''}`}
        aria-label="聚合分销订单筛选"
      >
        <div className="distribution-order-store statistics-distribution-store" aria-label="门店">
          <button type="button" className="distribution-order-store__scope">
            全部门店
          </button>
          <button type="button" className="distribution-order-store__current">
            天落会宿公寓(前海壹方城宝安中心店)
          </button>
          <button type="button" className="distribution-order-store__settings" aria-label="门店设置">
            ⚙
          </button>
        </div>

        {expanded ? (
          <div className="distribution-order-query__advanced statistics-distribution-advanced">
            <div className="distribution-order-field distribution-order-date" role="group" aria-label="预订时间">
              <span>预订时间:</span>
              <div className="distribution-order-date__range">
                <input
                  aria-label="开始日期"
                  placeholder="开始日期"
                  value="2026-05-01"
                  readOnly
                  onClick={() => setDateOpen(true)}
                />
                <em>至</em>
                <input
                  aria-label="结束日期"
                  placeholder="结束日期"
                  value="2026-05-31"
                  readOnly
                  onClick={() => setDateOpen(true)}
                />
              </div>
            </div>

            <label className="distribution-order-field distribution-order-keyword">
              <span>订单搜索:</span>
              <input
                value={keyword}
                placeholder="请输入订单编号/预订人/手机号"
                onChange={(event) => setKeyword(event.target.value)}
              />
            </label>

            <label className="distribution-order-field distribution-order-select-field">
              <span>订单筛选:</span>
              <button
                type="button"
                className="distribution-order-select"
                aria-haspopup="listbox"
                aria-expanded={openFilter}
                aria-label={`订单筛选 ${filterLabel}`}
                onClick={() => {
                  setDateOpen(false)
                  setOpenFilter((value) => !value)
                }}
              >
                {filterLabel}
              </button>
            </label>
          </div>
        ) : null}

        {dateOpen ? <DatePickerDialog /> : null}

        {openFilter ? (
          <div className="distribution-order-options statistics-distribution-options" role="listbox" aria-label="订单筛选选项">
            {(['全部', '非置换订单', '置换订单'] as const).map((option) => (
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

        <div className="distribution-order-actions statistics-distribution-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              setOpenFilter(false)
              setDateOpen(false)
              setNotice('已查询聚合分销订单')
            }}
          >
            查 询
          </button>
          <button type="button" className="is-outline" onClick={() => setNotice('已生成聚合分销订单导出任务')}>
            导出明细
          </button>
          <button
            type="button"
            className="is-link"
            onClick={() => {
              setExpanded((value) => !value)
              setOpenFilter(false)
              setDateOpen(false)
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      {notice ? (
        <div className="distribution-order-notice" role="status">
          {notice}
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
            <tr className="is-summary">
              <td>合计</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
              <td>435.00</td>
              <td>65.25</td>
              <td>369.75</td>
              <td>0.00</td>
              <td>-</td>
            </tr>
            <tr>
              <td>
                <a href="#order-detail">{orderRow.orderNo}</a>
              </td>
              <td>{orderRow.customer}</td>
              <td>{orderRow.roomType}</td>
              <td>{orderRow.bookedAt}</td>
              <td>{orderRow.paidAmount}</td>
              <td>{orderRow.serviceFee}</td>
              <td>{orderRow.settlementAmount}</td>
              <td>{orderRow.settledAmount}</td>
              <td>{orderRow.settlementStatus}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <div className="distribution-order-pagination" aria-label="分页">
        <span>第 1-2 条/总共 2 条</span>
        <button type="button" aria-label="上一页" disabled>
          ‹
        </button>
        <button type="button" className="is-current">
          1
        </button>
        <button type="button" aria-label="下一页" disabled>
          ›
        </button>
        <button type="button">20 条/页</button>
      </div>
    </div>
  )
}

function DatePickerDialog() {
  return (
    <div className="statistics-distribution-date-popover" role="dialog" aria-label="日期选择">
      <CalendarMonth title="2026年" month="5月" weeks={mayWeeks} />
      <CalendarMonth title="2026年" month="6月" weeks={juneWeeks} />
      <div className="statistics-distribution-date-presets">
        {['昨天', '本周', '本月', '上月'].map((preset) => (
          <button key={preset} type="button">
            {preset}
          </button>
        ))}
      </div>
    </div>
  )
}

function CalendarMonth({ title, month, weeks }: { title: string; month: string; weeks: string[][] }) {
  const isMay = month === '5月'
  const isJune = month === '6月'

  return (
    <section className="statistics-distribution-calendar" aria-label={`${title}${month}`}>
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
      <div className="statistics-distribution-weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="statistics-distribution-days">
        {weeks.flat().map((day, index) => {
          const classNames = [
            (isMay && (index < 4 || index > 34)) || (isJune && index > 29) ? 'is-muted' : '',
            isMay && index >= 4 && index <= 34 ? 'is-in-range' : '',
            isMay && (index === 4 || index === 34) ? 'is-selected' : '',
            isMay && index === 17 ? 'is-today' : '',
          ].filter(Boolean)

          return (
            <button key={`${month}-${index}`} type="button" className={classNames.join(' ')}>
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}
