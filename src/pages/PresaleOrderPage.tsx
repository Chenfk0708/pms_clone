import { useEffect, useMemo, useRef, useState } from 'react'
import {
  PRESALE_ORDER_ENDPOINT,
  type PresaleOrderData,
  type PresaleOrderFilters,
  type PresaleOrderRow,
  type SelectOption,
  createPresaleOrderRequestBody,
  loadPresaleOrderData,
} from '../services/presaleOrder'
import './PresaleOrderPage.css'

type FilterKey = 'orderState' | 'productType' | 'source' | 'category' | 'payment' | 'afterSale'

const defaultFilters: PresaleOrderFilters = {
  orderState: '0',
  productType: '',
  source: '',
  category: '',
  payment: '',
  afterSale: '',
  keyword: '',
  startDate: '',
  endDate: '',
  pageNum: 1,
  pageSize: 20,
}

const orderStateOptions: SelectOption[] = [
  { value: '0', label: '全部' },
  { value: '1', label: '待支付' },
  { value: '3', label: '已发货' },
  { value: '4', label: '已完成' },
  { value: '5', label: '已取消' },
]

const productTypeOptions: SelectOption[] = [
  { value: '1', label: '虚拟商品' },
  { value: '2', label: '实物商品' },
  { value: '3', label: '电子卡券' },
]

const sourceFallbackOptions: SelectOption[] = [
  { value: '33', label: '抖音小程序' },
  { value: '34', label: '微信小程序' },
  { value: '35', label: '百度小程序' },
  { value: '36', label: '小红书' },
]

const afterSaleOptions: SelectOption[] = [
  { value: '1', label: '申请退款中' },
  { value: '2', label: '部分退款' },
  { value: '3', label: '已退款' },
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
  const [filters, setFilters] = useState<PresaleOrderFilters>(() => readInitialFilters())
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [data, setData] = useState<PresaleOrderData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const initialFiltersRef = useRef(filters)

  const optionsByFilter = useMemo<Record<FilterKey, SelectOption[]>>(
    () => ({
      orderState: orderStateOptions,
      productType: productTypeOptions,
      source: data?.options.sources.length ? data.options.sources : sourceFallbackOptions,
      category: data?.options.categories ?? [],
      payment: data?.options.payments ?? [],
      afterSale: afterSaleOptions,
    }),
    [data],
  )

  useEffect(() => {
    const controller = new AbortController()
    void requestOrders(initialFiltersRef.current, controller.signal, '首屏加载')
    return () => controller.abort()
  }, [])

  async function requestOrders(nextFilters: PresaleOrderFilters, signal?: AbortSignal, reason = '查询') {
    setLoading(true)
    setError('')
    setNotice(`${reason}：正在请求 ${PRESALE_ORDER_ENDPOINT}`)
    const result = await loadPresaleOrderData(nextFilters, signal)
    if (result.ok) {
      setData(result.data)
      setNotice(`真实请求成功：${result.data.rows.length}/${result.data.total} 条，接口 ${PRESALE_ORDER_ENDPOINT}`)
    } else {
      setError(`${result.message}；接口 ${result.endpoint}`)
      setNotice('真实请求失败，已作为阻塞暴露；未使用假成功或 mock 数据。')
    }
    setLoading(false)
  }

  function updateFilter(partial: Partial<PresaleOrderFilters>) {
    setFilters((current) => ({ ...current, ...partial }))
  }

  function chooseFilter(key: FilterKey, option: SelectOption) {
    updateFilter({ [key]: option.value } as Partial<PresaleOrderFilters>)
    setOpenFilter(null)
    setNotice(`${labelForFilter(key)} 已选择 ${option.label}，点击“搜 索”后按真实接口刷新。`)
  }

  function resetFilters() {
    const nextFilters = { ...defaultFilters, campId: filters.campId }
    setFilters(nextFilters)
    setOpenFilter(null)
    void requestOrders(nextFilters, undefined, '重置')
  }

  function submitSearch() {
    const nextFilters = { ...filters, pageNum: 1 }
    setFilters(nextFilters)
    setOpenFilter(null)
    void requestOrders(nextFilters, undefined, '搜索')
  }

  function changePage(offset: number) {
    const nextPage = Math.max(1, filters.pageNum + offset)
    const nextFilters = { ...filters, pageNum: nextPage }
    setFilters(nextFilters)
    void requestOrders(nextFilters, undefined, `分页到第 ${nextPage} 页`)
  }

  function exposeBlockedAction(action: string) {
    setNotice(`${action}：目标站真实接口或项目对应路由未完成取证接入，当前作为阻塞暴露。`)
  }

  const currentFilter = openFilter
  const currentOptions = currentFilter ? optionsByFilter[currentFilter] : []
  const requestPreview = createPresaleOrderRequestBody(filters, data?.campId ?? filters.campId ?? '待获取')

  return (
    <div className="presale-order-page">
      <h1 className="sr-only-heading">预售券订单</h1>
      <section className="presale-order-query" aria-label="预售券订单筛选">
        <div className="presale-order-query__grid">
          <FilterSelect
            filterKey="orderState"
            label="订单状态"
            placeholder="全部"
            value={filters.orderState}
            options={orderStateOptions}
            isOpen={openFilter === 'orderState'}
            onToggle={() => setOpenFilter(openFilter === 'orderState' ? null : 'orderState')}
          />
          <FilterSelect
            filterKey="productType"
            label="商品类型"
            placeholder="请选择商品类型"
            value={filters.productType}
            options={productTypeOptions}
            isOpen={openFilter === 'productType'}
            onToggle={() => setOpenFilter(openFilter === 'productType' ? null : 'productType')}
          />
          <FilterSelect
            filterKey="source"
            label="订单来源"
            placeholder="请选择订单来源"
            value={filters.source}
            options={optionsByFilter.source}
            isOpen={openFilter === 'source'}
            onToggle={() => setOpenFilter(openFilter === 'source' ? null : 'source')}
          />
          <FilterSelect
            filterKey="category"
            label="商品类目"
            placeholder="请选择商品类目"
            value={filters.category}
            options={optionsByFilter.category}
            isOpen={openFilter === 'category'}
            onToggle={() => setOpenFilter(openFilter === 'category' ? null : 'category')}
          />
          <FilterSelect
            filterKey="payment"
            label="支付方式"
            placeholder="请选择支付方式"
            value={filters.payment}
            options={optionsByFilter.payment}
            isOpen={openFilter === 'payment'}
            onToggle={() => setOpenFilter(openFilter === 'payment' ? null : 'payment')}
          />
          <div className="presale-order-field presale-order-date" role="group" aria-label="下单时间">
            <span>下单时间</span>
            <div className="presale-order-date__range">
              <input
                aria-label="下单开始日期"
                type="date"
                value={filters.startDate}
                onChange={(event) => updateFilter({ startDate: event.target.value })}
              />
              <em>→</em>
              <input
                aria-label="下单结束日期"
                type="date"
                value={filters.endDate}
                onChange={(event) => updateFilter({ endDate: event.target.value })}
              />
            </div>
          </div>
          <label className="presale-order-field presale-order-keyword">
            <span>搜索</span>
            <input
              value={filters.keyword}
              placeholder="请输入订单编号/买家联系方式"
              onChange={(event) => updateFilter({ keyword: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch()
              }}
            />
          </label>
          <FilterSelect
            filterKey="afterSale"
            label="售后状态"
            placeholder="请选择售后状态"
            value={filters.afterSale}
            options={afterSaleOptions}
            isOpen={openFilter === 'afterSale'}
            onToggle={() => setOpenFilter(openFilter === 'afterSale' ? null : 'afterSale')}
          />
        </div>

        {currentFilter ? (
          <div className="presale-order-options" role="listbox" aria-label={`${labelForFilter(currentFilter)}选项`}>
            {currentOptions.length ? (
              currentOptions.map((option) => (
                <button
                  key={`${currentFilter}-${option.value}`}
                  type="button"
                  role="option"
                  aria-selected={filters[currentFilter] === option.value}
                  onClick={() => chooseFilter(currentFilter, option)}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <span className="presale-order-options__empty">真实选项接口未返回数据</span>
            )}
          </div>
        ) : null}

        <div className="presale-order-actions">
          <button type="button" onClick={resetFilters} disabled={loading}>
            重 置
          </button>
          <button type="button" onClick={() => void requestOrders(filters, undefined, '刷新')} disabled={loading}>
            刷 新
          </button>
          <button type="button" className="is-primary" onClick={submitSearch} disabled={loading}>
            {loading ? '加载中' : '搜 索'}
          </button>
        </div>
      </section>

      <section className="presale-order-source" aria-label="预售券订单数据来源">
        <div>
          <strong>{loading ? '真实请求中' : error ? '真实请求阻塞' : '真实请求状态'}</strong>
          <span role={error ? 'alert' : 'status'}>{error || notice}</span>
        </div>
        <code>{PRESALE_ORDER_ENDPOINT}</code>
      </section>

      <div className="presale-order-export">
        <button type="button" onClick={() => exposeBlockedAction('导出明细')}>
          导出明细
        </button>
      </div>

      <section className="presale-order-table" aria-label="预售券订单表格">
        <div className="presale-order-table__head">
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        {data?.rows.length ? (
          <div className="presale-order-table__body">
            {data.rows.map((row) => (
              <OrderRow key={row.id} row={row} onDetail={() => exposeBlockedAction(`订单详情 ${row.id}`)} />
            ))}
          </div>
        ) : (
          <div className="presale-order-empty" role="status" aria-label={error ? '预售券订单接口阻塞空态' : '预售券订单空态'}>
            <span className="presale-order-empty__icon" aria-hidden="true" />
            <strong>{error ? '真实请求未完成' : '暂无数据'}</strong>
            {error ? <small>暂无数据；接口失败已暴露，请点击“刷 新”重试。</small> : null}
          </div>
        )}
      </section>

      <footer className="presale-order-footer" aria-label="预售券订单分页和请求参数">
        <div className="presale-order-pagination">
          <button type="button" disabled={loading || filters.pageNum <= 1} onClick={() => changePage(-1)}>
            上一页
          </button>
          <span>第 {filters.pageNum} 页</span>
          <button type="button" disabled={loading || !data?.hasNextPage} onClick={() => changePage(1)}>
            下一页
          </button>
          <span>共 {data?.total ?? 0} 条</span>
        </div>
        <details>
          <summary>请求参数</summary>
          <pre>{JSON.stringify(requestPreview, null, 2)}</pre>
        </details>
      </footer>
    </div>
  )
}

function OrderRow({ row, onDetail }: { row: PresaleOrderRow; onDetail: () => void }) {
  return (
    <div className="presale-order-row" role="row">
      <div>
        <strong>{row.productName}</strong>
        <span>{row.productSubName}</span>
      </div>
      <div>
        {row.productType}
        <span>{row.categoryName}</span>
      </div>
      <div>
        {row.unitPrice}
        <span>数量 {row.quantity}</span>
      </div>
      <div>{row.totalAmount}</div>
      <div>{row.paidAmount}</div>
      <div>
        {row.buyer}
        <span>{row.contact}</span>
      </div>
      <div>{row.orderState}</div>
      <div>{row.afterSaleState}</div>
      <div>
        <button type="button" onClick={onDetail}>
          订单详情
        </button>
      </div>
    </div>
  )
}

function FilterSelect({
  filterKey,
  label,
  placeholder,
  value,
  options,
  isOpen,
  onToggle,
}: {
  filterKey: FilterKey
  label: string
  placeholder: string
  value: string
  options: SelectOption[]
  isOpen: boolean
  onToggle: () => void
}) {
  const selected = options.find((option) => option.value === value)
  const displayValue = selected?.label ?? placeholder

  return (
    <label className="presale-order-field">
      <span>{label}</span>
      <button
        type="button"
        className="presale-order-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label} ${displayValue}`}
        data-filter={filterKey}
        onClick={onToggle}
      >
        {displayValue}
      </button>
    </label>
  )
}

function labelForFilter(key: FilterKey) {
  const labels: Record<FilterKey, string> = {
    orderState: '订单状态',
    productType: '商品类型',
    source: '订单来源',
    category: '商品类目',
    payment: '支付方式',
    afterSale: '售后状态',
  }
  return labels[key]
}

function readInitialFilters(): PresaleOrderFilters {
  const params = new URLSearchParams(window.location.search)
  return {
    ...defaultFilters,
    campId: params.get('campId') ?? undefined,
    keyword: params.get('keyword') ?? '',
    pageNum: Number(params.get('pageNum') ?? '1') || 1,
  }
}
