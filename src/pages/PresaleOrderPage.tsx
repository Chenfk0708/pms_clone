import { useState } from 'react'
import './PresaleOrderPage.css'

type FilterKey = 'productType' | 'source' | 'category' | 'payment' | 'afterSale'

const filterOptions: Record<FilterKey, string[]> = {
  productType: ['虚拟商品', '实物商品', '电子卡券'],
  source: ['品牌小程序', '微信商城', '线下导入', '分销渠道'],
  category: ['全部类目', '住宿套餐', '餐饮券', '体验券'],
  payment: ['微信支付', '余额支付', '线下支付', '积分兑换'],
  afterSale: ['无售后', '退款中', '退款成功', '退款拒绝'],
}

const filters: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: 'productType', label: '商品类型', placeholder: '请选择商品类型' },
  { key: 'source', label: '订单来源', placeholder: '请选择订单来源' },
  { key: 'category', label: '商品类目', placeholder: '请选择商品类目' },
  { key: 'payment', label: '支付方式', placeholder: '请选择支付方式' },
  { key: 'afterSale', label: '售后状态', placeholder: '请选择售后状态' },
]

const tableColumns = [
  '商品',
  '商品类型(商品类目)',
  '单价(元)/数量',
  '商品总价(元)',
  '实付金额(元)',
  '买家/联系人',
  '订单状态',
  '售后状态',
  '操作',
]

export function PresaleOrderPage() {
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [values, setValues] = useState<Record<FilterKey, string>>({
    productType: '',
    source: '',
    category: '',
    payment: '',
    afterSale: '',
  })
  const [keyword, setKeyword] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [notice, setNotice] = useState('')

  function chooseFilter(value: string) {
    if (!openFilter) return
    setValues((current) => ({ ...current, [openFilter]: value }))
    setOpenFilter(null)
  }

  function resetFilters() {
    setValues({
      productType: '',
      source: '',
      category: '',
      payment: '',
      afterSale: '',
    })
    setKeyword('')
    setDateRange({ start: '', end: '' })
    setOpenFilter(null)
    setNotice('')
  }

  const currentFilter = openFilter ? filters.find((filter) => filter.key === openFilter) : null

  return (
    <div className="presale-order-page">
      <h1 className="sr-only-heading">预售券订单</h1>
      <section className="presale-order-query" aria-label="预售券订单筛选">
        <div className="presale-order-query__grid">
          <label className="presale-order-field">
            <span>订单状态</span>
            <button type="button" aria-label="订单状态" className="presale-order-select is-fixed">
              全部
            </button>
          </label>
          {filters.slice(0, 3).map((filter) => (
            <FilterSelect
              key={filter.key}
              filter={filter}
              value={values[filter.key]}
              isOpen={openFilter === filter.key}
              onToggle={() => setOpenFilter(openFilter === filter.key ? null : filter.key)}
            />
          ))}
          <FilterSelect
            filter={filters[3]}
            value={values.payment}
            isOpen={openFilter === 'payment'}
            onToggle={() => setOpenFilter(openFilter === 'payment' ? null : 'payment')}
          />
          <div className="presale-order-field presale-order-date" role="group" aria-label="下单时间">
            <span>下单时间</span>
            <div className="presale-order-date__range">
              <input
                aria-label="下单开始日期"
                placeholder="开始日期"
                value={dateRange.start}
                onChange={(event) => setDateRange((current) => ({ ...current, start: event.target.value }))}
              />
              <em>→</em>
              <input
                aria-label="下单结束日期"
                placeholder="结束日期"
                value={dateRange.end}
                onChange={(event) => setDateRange((current) => ({ ...current, end: event.target.value }))}
              />
            </div>
          </div>
          <label className="presale-order-field presale-order-keyword">
            <span>搜索</span>
            <input
              value={keyword}
              placeholder="请输入订单编号/买家联系方式"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <FilterSelect
            filter={filters[4]}
            value={values.afterSale}
            isOpen={openFilter === 'afterSale'}
            onToggle={() => setOpenFilter(openFilter === 'afterSale' ? null : 'afterSale')}
          />
        </div>

        {currentFilter ? (
          <div className="presale-order-options" role="listbox" aria-label={`${currentFilter.label}选项`}>
            {filterOptions[currentFilter.key].map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={values[currentFilter.key] === option}
                onClick={() => chooseFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        <div className="presale-order-actions">
          <button type="button" onClick={resetFilters}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={() => setOpenFilter(null)}>
            搜 索
          </button>
        </div>
      </section>

      <div className="presale-order-export">
        <button type="button" onClick={() => setNotice('已生成预售券订单导出任务')}>
          导出明细
        </button>
      </div>
      {notice ? (
        <div className="presale-order-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="presale-order-table" aria-label="预售券订单表格">
        <div className="presale-order-table__head">
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="presale-order-empty">
          <span className="presale-order-empty__icon" aria-hidden="true" />
          <strong>暂无数据</strong>
        </div>
      </section>
    </div>
  )
}

function FilterSelect({
  filter,
  value,
  isOpen,
  onToggle,
}: {
  filter: { key: FilterKey; label: string; placeholder: string }
  value: string
  isOpen: boolean
  onToggle: () => void
}) {
  const displayValue = value || filter.placeholder

  return (
    <label className="presale-order-field">
      <span>{filter.label}</span>
      <button
        type="button"
        className="presale-order-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${filter.label} ${displayValue}`}
        onClick={onToggle}
      >
        {displayValue}
      </button>
    </label>
  )
}
