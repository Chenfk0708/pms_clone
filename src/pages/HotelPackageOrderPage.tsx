import { useEffect, useMemo, useRef, useState } from 'react'
import {
  type HotelPackageOrderData,
  type HotelPackageOrderFilters,
  type HotelPackageOrderOption,
  type HotelPackageOrderRow,
  createHotelPackageOrderRequestBody,
  getHotelPackageOrderMockState,
  loadHotelPackageOrderData,
  readInitialHotelPackageOrderFilters,
} from '../services/hotelPackageOrder'
import './PresaleOrderPage.css'

type FilterKey = 'orderState' | 'source' | 'afterSale'

const defaultFilters: HotelPackageOrderFilters = {
  orderState: 'all',
  source: '',
  afterSale: '',
  keyword: '',
  startDate: '',
  endDate: '',
  pageNum: 1,
  pageSize: 2,
}

const fallbackOptions: HotelPackageOrderData['options'] = {
  orderStates: [
    { value: 'all', label: '全部' },
    { value: 'paid', label: '已支付' },
    { value: 'finished', label: '已完成' },
    { value: 'canceled', label: '已取消' },
  ],
  sources: [
    { value: 'brand', label: '品牌小程序' },
    { value: 'wechat', label: '微信商城' },
    { value: 'offline', label: '线下导入' },
    { value: 'distribution', label: '分销渠道' },
  ],
  afterSales: [
    { value: 'none', label: '无售后' },
    { value: 'refunding', label: '退款中' },
    { value: 'refunded', label: '退款成功' },
  ],
}

const tableColumns = ['商品', '购买数量', '商品单价(元)', '团期差价（元）', '实付金额(元)', '联系号码', '订单状态', '售后状态', '操作']

export function HotelPackageOrderPage() {
  const [filters, setFilters] = useState<HotelPackageOrderFilters>(() => ({
    ...defaultFilters,
    ...readInitialHotelPackageOrderFilters(),
  }))
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [data, setData] = useState<HotelPackageOrderData | null>(null)
  const [selectedRow, setSelectedRow] = useState<HotelPackageOrderRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('首屏数据加载中')
  const initialFiltersRef = useRef(filters)

  const optionsByFilter = useMemo<Record<FilterKey, HotelPackageOrderOption[]>>(
    () => ({
      orderState: data?.options.orderStates.length ? data.options.orderStates : fallbackOptions.orderStates,
      source: data?.options.sources.length ? data.options.sources : fallbackOptions.sources,
      afterSale: data?.options.afterSales.length ? data.options.afterSales : fallbackOptions.afterSales,
    }),
    [data],
  )

  useEffect(() => {
    const controller = new AbortController()
    void requestOrders(initialFiltersRef.current, controller.signal, '首屏加载')
    return () => controller.abort()
  }, [])

  async function requestOrders(nextFilters: HotelPackageOrderFilters, signal?: AbortSignal, reason = '搜索') {
    setLoading(true)
    setError('')
    setNotice(`${reason}中`)
    const result = await loadHotelPackageOrderData(nextFilters, {
      signal,
      mockState: getHotelPackageOrderMockState(),
    })
    if (result.ok) {
      setData(result.data)
      setNotice(`${reason}完成，当前展示 ${result.data.rows.length} 条，共 ${result.data.pagination.total} 条`)
    } else {
      setError(result.message)
      setNotice(`${reason}失败，可调整条件后重试`)
    }
    setLoading(false)
  }

  function updateFilter(partial: Partial<HotelPackageOrderFilters>) {
    setFilters((current) => ({ ...current, ...partial }))
  }

  function chooseFilter(key: FilterKey, option: HotelPackageOrderOption) {
    updateFilter({ [key]: option.value, pageNum: 1 } as Partial<HotelPackageOrderFilters>)
    setOpenFilter(null)
    setNotice(`${labelForFilter(key)}已选择 ${option.label}`)
  }

  function resetFilters() {
    const nextFilters = { ...defaultFilters }
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
    setNotice(`已切换到第 ${nextPage} 页`)
    void requestOrders(nextFilters, undefined, `已切换到第 ${nextPage} 页`)
  }

  function createExportTask() {
    setNotice(`导出任务已创建，范围为第 ${filters.pageNum} 页、${data?.pagination.total ?? 0} 条订单`)
  }

  const currentFilter = openFilter
  const currentOptions = currentFilter ? optionsByFilter[currentFilter] : []
  const requestPreview = data?.requestBody ?? createHotelPackageOrderRequestBody(filters)
  const hasNextPage = Boolean(data && filters.pageNum * filters.pageSize < data.pagination.total)

  return (
    <div className="presale-order-page hotel-package-order-page">
      <h1 className="sr-only-heading">酒店套餐订单</h1>
      <div
        hidden
        data-testid="hotel-package-order-service-contract"
        data-provider={data?.provider ?? 'mock'}
        data-trace-id={data?.traceId ?? ''}
      />
      <pre hidden data-testid="hotel-package-order-request-body">
        {JSON.stringify(requestPreview, null, 2)}
      </pre>

      <section className="presale-order-query" aria-label="酒店套餐订单筛选">
        <div className="presale-order-query__grid">
          <FilterSelect
            filterKey="orderState"
            label="订单状态"
            placeholder="全部"
            value={filters.orderState}
            options={optionsByFilter.orderState}
            isOpen={openFilter === 'orderState'}
            onToggle={() => setOpenFilter(openFilter === 'orderState' ? null : 'orderState')}
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
          <div className="presale-order-field presale-order-date" role="group" aria-label="下单时间">
            <span>下单时间</span>
            <div className="presale-order-date__range">
              <input
                aria-label="下单开始日期"
                type="date"
                value={filters.startDate}
                onChange={(event) => updateFilter({ startDate: event.target.value, pageNum: 1 })}
              />
              <em>→</em>
              <input
                aria-label="下单结束日期"
                type="date"
                value={filters.endDate}
                onChange={(event) => updateFilter({ endDate: event.target.value, pageNum: 1 })}
              />
            </div>
          </div>
          <label className="presale-order-field presale-order-keyword">
            <span>搜索</span>
            <input
              value={filters.keyword}
              placeholder="请输入订单编号/买家联系方式"
              onChange={(event) => updateFilter({ keyword: event.target.value, pageNum: 1 })}
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
            options={optionsByFilter.afterSale}
            isOpen={openFilter === 'afterSale'}
            onToggle={() => setOpenFilter(openFilter === 'afterSale' ? null : 'afterSale')}
          />
        </div>

        {currentFilter ? (
          <div className="presale-order-options" role="listbox" aria-label={`${labelForFilter(currentFilter)}选项`}>
            {currentOptions.map((option) => (
              <button
                key={`${currentFilter}-${option.value}`}
                type="button"
                role="option"
                aria-selected={filters[currentFilter] === option.value}
                onClick={() => chooseFilter(currentFilter, option)}
              >
                {option.label}
              </button>
            ))}
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

      <div className="presale-order-export">
        <button type="button" onClick={createExportTask} disabled={loading}>
          导出明细
        </button>
      </div>

      <div className="presale-order-notice" role="status" aria-label="酒店套餐订单操作反馈">
        {notice}
      </div>
      {error ? (
        <div className="presale-order-alert" role="alert">
          {error}
        </div>
      ) : null}

      <section className="presale-order-table" aria-label="酒店套餐订单表格">
        <div className="presale-order-table__head">
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        {data?.rows.length ? (
          <div className="presale-order-table__body">
            {data.rows.map((row) => (
              <OrderRow key={row.id} row={row} onDetail={() => setSelectedRow(row)} />
            ))}
          </div>
        ) : (
          <div className="presale-order-empty" role="status" aria-label="酒店套餐订单空态">
            <span className="presale-order-empty__icon" aria-hidden="true" />
            <strong>{error ? '加载失败' : '暂无数据'}</strong>
            <small>{error ? '请点击刷新重试' : '当前条件下暂无符合条件的订单'}</small>
          </div>
        )}
      </section>

      <footer className="presale-order-footer" aria-label="酒店套餐订单分页">
        <div className="presale-order-pagination">
          <button type="button" disabled={loading || filters.pageNum <= 1} onClick={() => changePage(-1)}>
            上一页
          </button>
          <span>第 {filters.pageNum} 页</span>
          <button type="button" disabled={loading || !hasNextPage} onClick={() => changePage(1)}>
            下一页
          </button>
          <span>共 {data?.pagination.total ?? 0} 条</span>
        </div>
      </footer>

      {selectedRow ? <OrderDetailDialog row={selectedRow} onClose={() => setSelectedRow(null)} /> : null}
    </div>
  )
}

function OrderRow({ row, onDetail }: { row: HotelPackageOrderRow; onDetail: () => void }) {
  return (
    <div className="presale-order-row" role="row">
      <div>
        <strong>{row.productName}</strong>
        <span>{row.sourceName}</span>
      </div>
      <div>{row.quantity}</div>
      <div>{row.unitPrice}</div>
      <div>{row.schedulePriceDiff}</div>
      <div>{row.paidAmount}</div>
      <div>{row.contact}</div>
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

function OrderDetailDialog({ row, onClose }: { row: HotelPackageOrderRow; onClose: () => void }) {
  return (
    <div className="presale-order-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section
        className="presale-order-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="酒店套餐订单详情"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <strong>酒店套餐订单详情</strong>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>订单编号</dt>
            <dd>{row.id}</dd>
          </div>
          <div>
            <dt>商品</dt>
            <dd>{row.productName}</dd>
          </div>
          <div>
            <dt>联系号码</dt>
            <dd>{row.contact}</dd>
          </div>
          <div>
            <dt>下单时间</dt>
            <dd>{row.bookedAt}</dd>
          </div>
          <div>
            <dt>实付金额</dt>
            <dd>{row.paidAmount}</dd>
          </div>
        </dl>
      </section>
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
  options: HotelPackageOrderOption[]
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
    source: '订单来源',
    afterSale: '售后状态',
  }
  return labels[key]
}
