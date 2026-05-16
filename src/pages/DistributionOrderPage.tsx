import { useState } from 'react'
import './DistributionOrderPage.css'

type SettlementFilter = '' | '待结算' | '已结算'

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

export function DistributionOrderPage() {
  const [expanded, setExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<SettlementFilter>('')
  const [openFilter, setOpenFilter] = useState(false)
  const [notice, setNotice] = useState('')

  function resetFilters() {
    setKeyword('')
    setFilter('')
    setOpenFilter(false)
    setNotice('')
  }

  const filterLabel = filter || '请选择'

  return (
    <div className="distribution-order-page">
      <h1 className="sr-only-heading">聚合分销订单</h1>

      <section className="distribution-order-store" aria-label="门店筛选">
        <button type="button" className="distribution-order-store__scope">
          全部门店
        </button>
        <button type="button" className="distribution-order-store__current">
          天落会宿公寓(前海壹方城宝安中心店)
        </button>
        <button type="button" className="distribution-order-store__settings" aria-label="门店设置">
          ⚙
        </button>
      </section>

      <section className={`distribution-order-query${expanded ? ' is-expanded' : ''}`} aria-label="聚合分销订单筛选">
        {expanded ? (
          <div className="distribution-order-query__advanced">
            <div className="distribution-order-field distribution-order-date" role="group" aria-label="预订时间">
              <span>预订时间:</span>
              <div className="distribution-order-date__range">
                <input aria-label="预订开始日期" value="2026-05-01" readOnly />
                <em>至</em>
                <input aria-label="预订结束日期" value="2026-05-31" readOnly />
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
                onClick={() => setOpenFilter((value) => !value)}
              >
                {filterLabel}
              </button>
            </label>
          </div>
        ) : null}

        {openFilter ? (
          <div className="distribution-order-options" role="listbox" aria-label="订单筛选选项">
            {(['待结算', '已结算'] as const).map((option) => (
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

        <div className="distribution-order-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              setOpenFilter(false)
              setNotice('已查询聚合分销订单')
            }}
          >
            查 询
          </button>
          <button type="button" className="is-primary" onClick={() => setNotice('已生成聚合分销订单导出任务')}>
            导出明细
          </button>
          <button
            type="button"
            className="is-link"
            onClick={() => {
              setExpanded((value) => !value)
              setOpenFilter(false)
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

      <section className="distribution-order-table" aria-label="聚合分销订单表格">
        <div className="distribution-order-table__head">
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="distribution-order-table__row is-summary">
          <div>合计</div>
          <div>-</div>
          <div>-</div>
          <div>-</div>
          <div>435.00</div>
          <div>65.25</div>
          <div>369.75</div>
          <div>0.00</div>
          <div>-</div>
        </div>
        <div className="distribution-order-table__row">
          <div>
            <a href="#order-detail">{orderRow.orderNo}</a>
          </div>
          <div>{orderRow.customer}</div>
          <div>{orderRow.roomType}</div>
          <div>{orderRow.bookedAt}</div>
          <div>{orderRow.paidAmount}</div>
          <div>{orderRow.serviceFee}</div>
          <div>{orderRow.settlementAmount}</div>
          <div>{orderRow.settledAmount}</div>
          <div>{orderRow.settlementStatus}</div>
        </div>
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
