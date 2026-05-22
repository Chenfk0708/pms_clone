import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchHouseOrders,
  resolveHouseOrderCampId,
  type HouseOrderData,
  type HouseOrderRow as OrderRow,
} from '../services/houseOrders'
import {
  fetchLongRentalOrders,
  resolveLongRentalQueryFromLocation,
  type LongRentalOrderOption,
  type LongRentalOrderPageData,
  type LongRentalOrderQuery,
  type LongRentalOrderRow,
} from '../services/longRentalOrders'
import './OrdersPage.css'

const quickFilters = [
  '全部',
  '今日新单',
  '今日预抵',
  '今日在住',
  '今日预离',
  '明日入住',
  '明日退房',
  '待接单',
  '待退款',
  '异常订单',
]

const houseBaseColumns = [
  '订单号',
  '渠道',
  '订单状态',
  '联系人',
  '手机号',
  '入住类型',
  '房型',
  '房间',
  '门店',
  '入住时间',
  '离开时间',
  '入住状态',
  '售后状态',
  '房费(减佣)',
  '其他消费',
  '房费(含佣)',
  '订单总收入',
  '订单欠款',
  '预订时间',
  '渠道单号',
]

const longRentalBaseColumns = [
  '订单号',
  '渠道',
  '租客姓名',
  '手机号',
  '房型',
  '房间',
  '门店',
  '入住时间',
  '离开时间',
  '入住状态',
  '房费（含佣）',
  '房费（减佣）',
  '其他消费',
  '押金',
  '订单总收入',
  '合同时间',
  '合同期限',
  '缴费方式',
  '缴费时间',
  '预订时间',
]

const collapsedTrailingColumns = ['操作']
const expandedTrailingColumns = ['操作', '占库存', '已排房', '计入统计']

const longRentalAdvancedFilters = [
  ['日期类型', '请选择日期类型'],
  ['订单状态', '请选择订单状态'],
  ['订单渠道', '全部'],
  ['订单房型', '全部'],
  ['入住状态', '全部'],
  ['平台账号', '全部'],
  ['订单门店', '全部'],
  ['订单标签', '全部'],
  ['排房情况', '请选择排房情况'],
  ['库存情况', '请选择占库存情况'],
  ['统计情况', '请选择统计情况'],
  ['房型标签', '全部'],
] as const

function statusTone(status: string) {
  if (status === '进行中' || status === '入住中') return 'is-running'
  if (status === '已完成' || status === '已退房') return 'is-done'
  if (status === '已预订' || status === '待入住') return 'is-booked'
  return 'is-canceled'
}

function formatDateRange(order: OrderRow) {
  const start = order.checkInAt.slice(0, 10).replace(/-/g, '.')
  const end = order.leaveAt.slice(0, 10).replace(/-/g, '.')
  return `${start}-${end} 1晚`
}

function formatLongContractTime(order: LongRentalOrderRow) {
  return `${order.contractStart} 至 ${order.contractEnd}`
}

type OrderFlagKind = 'stock' | 'room' | 'plan'

function resolveOrderFlagState(kind: OrderFlagKind, value: string | undefined, fallbackState = false) {
  const normalized = value?.trim().toLowerCase() ?? ''

  if (['1', 'true', 'yes', '是', '√', '✓', '占库存', '已排房', '计入统计'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', '否', '×', '✕', '未排房', '不占库存', '不计入统计'].includes(normalized)) {
    return false
  }

  if (kind === 'room' && normalized === '-') {
    return false
  }

  return fallbackState
}

function renderOrderFlagIndicator(kind: OrderFlagKind, value: string | undefined, fallbackState = false) {
  const enabled = resolveOrderFlagState(kind, value, fallbackState)

  return (
    <span className={`order-flag-indicator ${enabled ? 'is-positive' : 'is-negative'}`} aria-label={enabled ? '是' : '否'}>
      {enabled ? '√' : '×'}
    </span>
  )
}

function resolveVisibleColumns(baseColumns: string[], expanded: boolean) {
  return [...baseColumns, ...(expanded ? expandedTrailingColumns : collapsedTrailingColumns)]
}

function resolveFixedColumnClassName(column: string) {
  if (column === '操作') return 'order-action-head order-action-head--edge'
  if (column === '占库存') return 'order-fixed-flag-head order-fixed-flag-head--stock'
  if (column === '已排房') return 'order-fixed-flag-head order-fixed-flag-head--room'
  if (column === '计入统计') return 'order-fixed-flag-head order-fixed-flag-head--plan'
  return undefined
}

function OrderColumnToggle({
  expanded,
  onToggle,
}: {
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`order-column-toggle ${expanded ? 'is-expanded' : ''}`}
      aria-label={expanded ? '隐藏操作列' : '显示操作列'}
      data-testid="order-column-toggle"
      onClick={onToggle}
    >
      <span className="order-column-toggle__icon" aria-hidden="true">
        {expanded ? '‹' : '›'}
      </span>
      <span>{expanded ? '收起' : '展开'}</span>
    </button>
  )
}

function renderOrderColumnHeader(column: string, expanded: boolean, onToggle: () => void) {
  if (column === '操作') {
    return (
      <div key={column} role="columnheader" className={resolveFixedColumnClassName(column)}>
        <span>操作</span>
        <OrderColumnToggle expanded={expanded} onToggle={onToggle} />
      </div>
    )
  }

  return (
    <div
      key={column}
      role="columnheader"
      className={resolveFixedColumnClassName(column)}
    >
      {column}
    </div>
  )
}

function OrderDetail({
  order,
  onClose,
  onBlockedAction,
}: {
  order: OrderRow
  onClose: () => void
  onBlockedAction: (label: string) => void
}) {
  const collected = order.collected ?? order.totalRevenue
  const commission = order.commission ?? '0'

  return (
    <div className="order-detail-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-detail-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="订单详情"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="order-detail-drawer__header">
          <div>
            <h2>订单详情</h2>
            <span>{order.stayType}</span>
          </div>
          <button type="button" aria-label="关闭订单详情" onClick={onClose}>
            ×
          </button>
        </header>

        <nav className="order-detail-tabs" aria-label="订单详情标签">
          <button type="button" className="is-active">
            订单信息
          </button>
          <button type="button">渠道信息</button>
          <button type="button">操作日志</button>
        </nav>

        <div className="order-detail-body">
          <section className="order-guest-card">
            <div>
              <strong>{order.contact}</strong>
              <span>直</span>
              <em>{order.channel}</em>
            </div>
            <p>手机号：{order.phone === '-' ? '无' : order.phone}</p>
            <p>渠道单号：{order.channelOrderNo}</p>
          </section>

          <section className="order-room-card">
            <div className="order-room-card__title">
              <strong>
                {order.roomType}（{order.room === '-' ? '未排房' : order.room}）
              </strong>
              <span className={statusTone(order.liveStatus)}>{order.liveStatus}</span>
            </div>
            <p>{formatDateRange(order)}</p>
            <strong className="order-room-card__total">¥ {order.totalRevenue}</strong>
          </section>

          <section className="order-detail-section">
            <h3>入住人（0/1）</h3>
            <button type="button" className="order-link-button" onClick={() => onBlockedAction('登记入住人')}>
              登记入住人
            </button>
          </section>

          <section className="order-rate-card">
            <header>
              <strong>{order.roomType}&lt;无早&gt;</strong>
            </header>
            <div className="order-rate-grid">
              <span>房费(减佣):</span>
              <strong>¥{order.roomRevenueNet}</strong>
              <span>订单总收入:</span>
              <strong>¥{Number(order.totalRevenue).toFixed(2)}</strong>
              <span>佣金:</span>
              <strong>¥{commission}</strong>
              <span>房费(含佣):</span>
              <strong>¥{Number(order.roomRevenueGross).toFixed(2)}</strong>
              <span>其他消费:</span>
              <strong>¥{Number(order.otherExpense).toFixed(2)}</strong>
            </div>
            <div className="order-room-date-table" role="table" aria-label="房费日历">
              <div role="row" className="order-room-date-table__head">
                <div role="columnheader">房间/日期</div>
                <div role="columnheader">{order.checkInAt.slice(0, 10)}</div>
              </div>
              <div role="row">
                <div role="cell">
                  {order.roomType}({order.room === '-' ? '未排房' : order.room})
                </div>
                <div role="cell">{order.roomRevenueNet}</div>
              </div>
            </div>
          </section>

          <section className="order-pay-card">
            <h3>房费收款</h3>
            <p>收款金额: ￥{collected}</p>
            <p>房费欠款: ￥{order.debt}</p>
          </section>

          <section className="order-detail-columns">
            <div>
              <h3>开票信息</h3>
              <p>其他收入/支出 0项/ ¥0.00</p>
            </div>
            <div>
              <h3>押金信息</h3>
              <p>押金金额: ¥ 0</p>
            </div>
            <div>
              <h3>订单欠款</h3>
              <p>¥{order.debt}</p>
            </div>
          </section>

          <section className="order-detail-section">
            <h3>订单备注</h3>
            <p>
              联系客人请拨打:02160454587(验证码:05383);如客人需要发票，请贵酒店开具，
              开票金额：CNY{collected} 客人电话:联系客人请拨打:02160454587;
              订单确认号: {order.confirmNo ?? order.channelOrderNo}
            </p>
          </section>

          <section className="order-detail-meta">
            <span>订单标签</span>
            <span>订单提醒</span>
            <span>订单附件</span>
            <span>创建人 无</span>
            <span>订单号 {order.orderNo}</span>
            <span>预订时间 {order.bookedAt.replace(/-/g, '.')}</span>
          </section>

          <section className="order-detail-actions" aria-label="订单操作">
            {['邀请登记', '邀请续住', '入住人', '延迟退房', '换房', '取消排房', '不占库存', '不计入统计', '设为续住单', '取消房单', '保洁', '打印'].map((action) => (
              <button key={action} type="button" onClick={() => onBlockedAction(action)}>
                {action}
              </button>
            ))}
          </section>
        </div>

        <footer className="order-detail-footer">
          <div>
            <span>房费(减佣)：</span>
            <strong>¥{order.roomRevenueNet}</strong>
          </div>
          <div>
            <span>订单总收入：</span>
            <strong>¥{Number(order.totalRevenue).toFixed(2)}</strong>
          </div>
          <button type="button" onClick={() => onBlockedAction('更多操作')}>更多操作</button>
          <button type="button" onClick={() => onBlockedAction('收款')}>收 款</button>
          <button type="button" onClick={() => onBlockedAction('续住')}>续 住</button>
          <button type="button" onClick={() => onBlockedAction('入住')}>入住</button>
          <button type="button" onClick={() => onBlockedAction('退房')}>退房</button>
        </footer>
      </section>
    </div>
  )
}

function LongRentalOrderDetail({
  order,
  onClose,
  onAction,
}: {
  order: LongRentalOrderRow
  onClose: () => void
  onAction: (label: string) => void
}) {
  const [activeTab, setActiveTab] = useState<'order' | 'contract' | 'payment'>('order')

  return (
    <div className="order-detail-backdrop" role="presentation" onClick={onClose}>
      <section
        className="order-detail-drawer long-rental-detail"
        role="dialog"
        aria-modal="true"
        aria-label="长租订单详情"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="order-detail-drawer__header">
          <div>
            <h2>长租订单详情</h2>
            <span>{order.contractTerm} / {order.paymentMethod}</span>
          </div>
          <button type="button" aria-label="关闭长租订单详情" onClick={onClose}>
            ×
          </button>
        </header>

        <nav className="order-detail-tabs" aria-label="长租订单详情标签">
          <button type="button" className={activeTab === 'order' ? 'is-active' : ''} onClick={() => setActiveTab('order')}>
            订单信息
          </button>
          <button type="button" className={activeTab === 'contract' ? 'is-active' : ''} onClick={() => setActiveTab('contract')}>
            合同信息
          </button>
          <button type="button" className={activeTab === 'payment' ? 'is-active' : ''} onClick={() => setActiveTab('payment')}>
            缴费记录
          </button>
        </nav>

        <div className="order-detail-body">
          {activeTab === 'order' ? (
            <>
              <section className="order-guest-card">
                <div>
                  <strong>{order.tenantName}</strong>
                  <span>长</span>
                  <em>{order.channel}</em>
                </div>
                <p>手机号：{order.phone}</p>
                <p>订单号：{order.orderNo}</p>
              </section>

              <section className="order-room-card">
                <div className="order-room-card__title">
                  <strong>
                    {order.roomType}（{order.room === '-' ? '未排房' : order.room}）
                  </strong>
                  <span className={`order-status ${statusTone(order.liveStatus)}`}>{order.liveStatus}</span>
                </div>
                <p>{formatLongContractTime(order)}</p>
                <strong className="order-room-card__total">押金：{order.deposit}</strong>
              </section>

              <section className="order-rate-card">
                <header>
                  <strong>合同与费用</strong>
                </header>
                <div className="order-rate-grid">
                  <span>房费（含佣）：</span>
                  <strong>{order.roomRevenueGross}</strong>
                  <span>房费（减佣）：</span>
                  <strong>{order.roomRevenueNet}</strong>
                  <span>其他消费：</span>
                  <strong>{order.otherExpense}</strong>
                  <span>押金：</span>
                  <strong>{order.deposit}</strong>
                  <span>订单总收入：</span>
                  <strong>{order.totalRevenue}</strong>
                  <span>缴费方式：</span>
                  <strong>{order.paymentMethod}</strong>
                  <span>缴费时间：</span>
                  <strong>{order.paymentDate}</strong>
                  <span>合同期限：</span>
                  <strong>{order.contractTerm}</strong>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === 'contract' ? (
            <>
              <section className="order-detail-section">
                <h3>合同周期</h3>
                <p>{formatLongContractTime(order)}</p>
                <p>合同编号：{order.contractNo}</p>
              </section>
              <section className="order-rate-card">
                <header>
                  <strong>租住约定</strong>
                </header>
                <div className="order-rate-grid">
                  <span>合同期限：</span>
                  <strong>{order.contractTerm}</strong>
                  <span>缴费方式：</span>
                  <strong>{order.paymentMethod}</strong>
                  <span>占库存：</span>
                  <strong>{order.stockFlag || '1'}</strong>
                  <span>计入统计：</span>
                  <strong>{order.planFlag || '-'}</strong>
                </div>
              </section>
            </>
          ) : null}

          {activeTab === 'payment' ? (
            <>
              <section className="order-detail-section">
                <h3>缴费计划</h3>
                <p>下次缴费日期：{order.nextPaymentDate}</p>
                <p>下次应收金额：{order.nextPaymentAmount}</p>
              </section>
              <section className="order-pay-card">
                <h3>押金与收款</h3>
                <p>押金：{order.deposit}</p>
                <p>订单总收入：{order.totalRevenue}</p>
              </section>
            </>
          ) : null}

          <section className="order-detail-meta">
            <span>租客姓名 {order.tenantName}</span>
            <span>预订时间 {order.bookedAt}</span>
            <span>入住状态 {order.liveStatus}</span>
            <span>占库存 {order.stockFlag || '1'}</span>
            <span>已排房 {order.roomFlag || '-'}</span>
            <span>计入统计 {order.planFlag || '-'}</span>
          </section>
        </div>

        <footer className="order-detail-footer">
          <div>
            <span>押金：</span>
            <strong>{order.deposit}</strong>
          </div>
          <div>
            <span>订单总收入：</span>
            <strong>{order.totalRevenue}</strong>
          </div>
          <button type="button" onClick={() => onAction('更多操作')}>
            更多操作
          </button>
          <button type="button" onClick={() => onAction('收款流程')}>
            收 款
          </button>
          <button type="button" onClick={() => onAction('续租流程')}>
            续 租
          </button>
          <button type="button" onClick={() => onAction('退租流程')}>
            退 租
          </button>
        </footer>
      </section>
    </div>
  )
}

function LongRentalOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [columnsExpanded, setColumnsExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [dateType, setDateType] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [channel, setChannel] = useState('')
  const [roomType, setRoomType] = useState('')
  const [liveStatus, setLiveStatus] = useState('')
  const [store, setStore] = useState('')
  const [openSelect, setOpenSelect] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<LongRentalOrderRow | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [data, setData] = useState<LongRentalOrderPageData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [operationFeedback, setOperationFeedback] = useState('长租订单已就绪')
  const [requestRevision, setRequestRevision] = useState(0)

  const locationQuery = useMemo(() => resolveLongRentalQueryFromLocation(window.location), [])
  const orderType = orderTypeByFilter[activeFilter] ?? ''

  const query = useMemo<LongRentalOrderQuery>(
    () => ({
      provider: locationQuery.provider,
      mockState: locationQuery.mockState,
      campId: locationQuery.campId,
      pageNum: 1,
      pageSize: 20,
      orderType,
      keyword: appliedKeyword,
      dateType,
      orderStatus,
      channel,
      roomType,
      liveStatus,
      store,
    }),
    [
      appliedKeyword,
      channel,
      dateType,
      liveStatus,
      locationQuery.mockState,
      locationQuery.provider,
      locationQuery.campId,
      orderStatus,
      orderType,
      roomType,
      store,
    ],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      setIsLoading(true)
      setRequestError('')
      try {
        const nextData = await fetchLongRentalOrders(query, controller.signal)
        if (controller.signal.aborted) return
        setData(nextData)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setData(null)
        setRequestError(error instanceof Error ? error.message : String(error))
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [query, requestRevision])

  const orders = data?.rows ?? []
  const options = data?.options

  const handleQuery = useCallback(() => {
    setAppliedKeyword(keyword.trim())
    setOperationFeedback('已按当前条件查询长租订单')
    setRequestRevision((value) => value + 1)
  }, [keyword])

  const handleReset = useCallback(() => {
    setKeyword('')
    setAppliedKeyword('')
    setActiveFilter('全部')
    setFiltersExpanded(false)
    setColumnsExpanded(false)
    setDateType('')
    setOrderStatus('')
    setChannel('')
    setRoomType('')
    setLiveStatus('')
    setStore('')
    setOpenSelect(null)
    setOperationFeedback('筛选条件已重置')
    setRequestRevision((value) => value + 1)
  }, [])

  const handleAction = useCallback((label: string) => {
    setOperationFeedback(`${label}已记录`)
  }, [])

  const handleSelect = useCallback((label: string, value: string, setter: (nextValue: string) => void) => {
    setter(value)
    setOpenSelect(null)
    setOperationFeedback(`${label}已更新`)
    setRequestRevision((revision) => revision + 1)
  }, [])

  const requestSummary = `orderType=${orderType || 'all'} keyword=${appliedKeyword || 'all'} dateType=${dateType || 'all'}`
  const visibleColumns = useMemo(() => resolveVisibleColumns(longRentalBaseColumns, columnsExpanded), [columnsExpanded])
  const tableClassName = `order-table order-table--long-rental ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`

  return (
    <div className="page-stack order-page order-page--long-rental">
      <h1>长租订单</h1>
      <section className="order-source-panel" aria-label="长租订单数据来源">
        <span>长租订单服务 · 业务数据</span>
        <span role="status" aria-label="长租订单加载状态">
          {isLoading ? '正在加载长租订单' : `已加载 ${orders.length} 条`}
        </span>
      </section>
      {requestError ? (
        <section className="order-request-error" role="alert" aria-label="长租订单数据错误">
          <span>{requestError}</span>
          <button type="button" onClick={() => setRequestRevision((value) => value + 1)}>
            重试
          </button>
        </section>
      ) : null}
      <section className="order-filter-panel" aria-label="长租订单筛选">
        <div className="order-filter-tabs" role="radiogroup" aria-label="订单快捷筛选">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              role="radio"
              aria-checked={activeFilter === filter}
              className={activeFilter === filter ? 'is-active' : ''}
              disabled={isLoading}
              onClick={() => {
                setActiveFilter(filter)
                setOperationFeedback(`${filter}筛选已切换`)
              }}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="order-filter-row">
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入订单号/姓名/手机号"
          />
          <div className="order-filter-actions">
            <button type="button" className="order-primary-action" onClick={handleQuery} disabled={isLoading}>
              查询
            </button>
            <button
              type="button"
              className="order-link-action"
              data-testid="order-filter-toggle"
              onClick={() => setFiltersExpanded((value) => !value)}
            >
              {filtersExpanded ? '收起' : '展开'}
            </button>
            <button
              type="button"
              className="order-outline-action"
              onClick={handleReset}
              disabled={isLoading}
            >
              重置筛选
            </button>
            <button
              type="button"
              className="order-outline-action"
              onClick={() => {
                setOperationFeedback('长租订单已刷新')
                setRequestRevision((value) => value + 1)
              }}
              disabled={isLoading}
            >
              刷新
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => setOperationFeedback('导出任务已创建，请在下载中心查看')}
            >
              导出明细
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => setCreateDialogOpen(true)}
            >
              录入订单
            </button>
          </div>
        </div>

        {filtersExpanded ? (
          <div className="order-advanced-filters order-advanced-filters--long-rental">
            <LongRentalSelect label="日期类型" placeholder="请选择日期类型" value={dateType} options={options?.dateTypes ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('日期类型', value, setDateType)} />
            <LongRentalSelect label="订单状态" placeholder="请选择订单状态" value={orderStatus} options={options?.orderStatuses ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('订单状态', value, setOrderStatus)} />
            <LongRentalSelect label="订单渠道" placeholder="全部" value={channel} options={options?.channels ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('订单渠道', value, setChannel)} />
            <LongRentalSelect label="订单房型" placeholder="全部" value={roomType} options={options?.roomTypes ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('订单房型', value, setRoomType)} />
            <LongRentalSelect label="入住状态" placeholder="全部" value={liveStatus} options={options?.liveStatuses ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('入住状态', value, setLiveStatus)} />
            <LongRentalSelect label="订单门店" placeholder="全部" value={store} options={options?.stores ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={(value) => handleSelect('订单门店', value, setStore)} />
            <LongRentalSelect label="订单标签" placeholder="全部" value="" options={options?.tags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('订单标签筛选')} />
            <LongRentalSelect label="排房情况" placeholder="请选择排房情况" value="" options={options?.roomFlags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('排房情况筛选')} />
            <LongRentalSelect label="库存情况" placeholder="请选择占库存情况" value="" options={options?.stockFlags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('库存情况筛选')} />
            <LongRentalSelect label="统计情况" placeholder="请选择统计情况" value="" options={options?.statisticsFlags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('统计情况筛选')} />
            {longRentalAdvancedFilters.slice(5, 6).map(([label, value]) => (
              <LongRentalSelect key={label} label={label} placeholder={value} value="" options={[{ label: value, value: '' }]} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction(`${label}筛选`)} />
            ))}
            <LongRentalSelect label="房型标签" placeholder="全部" value="" options={options?.tags ?? []} openSelect={openSelect} setOpenSelect={setOpenSelect} onSelect={() => handleAction('房型标签筛选')} />
          </div>
        ) : null}
      </section>
      <div className="order-operation-feedback" role="status" aria-label="长租订单操作反馈">
        {operationFeedback}
      </div>

      <section className="order-table-card">
        <div className="order-table-scroll">
          <div className={tableClassName} role="table" aria-label="长租订单列表">
            <div className="order-table__head" role="row">
              {visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value)))}
            </div>
            {isLoading ? (
              <div className="order-table__empty" role="row">
                <div role="cell">正在加载长租订单...</div>
              </div>
            ) : null}
            {!isLoading && !requestError ? orders.map((order) => (
              <div key={order.orderNo} className="order-table__row" role="row">
                <div role="cell" className="order-no">
                  {order.orderNo}
                </div>
                <div role="cell">{order.channel}</div>
                <div role="cell">{order.tenantName}</div>
                <div role="cell">{order.phone}</div>
                <div role="cell" className="order-room-type">
                  {order.roomType}
                </div>
                <div role="cell">{order.room}</div>
                <div role="cell">{order.store}</div>
                <div role="cell">{order.checkInAt}</div>
                <div role="cell">{order.leaveAt}</div>
                <div role="cell">
                  <span className={`order-status ${statusTone(order.liveStatus)}`}>{order.liveStatus}</span>
                </div>
                <div role="cell">{order.roomRevenueGross}</div>
                <div role="cell">{order.roomRevenueNet}</div>
                <div role="cell">{order.otherExpense}</div>
                <div role="cell">{order.deposit}</div>
                <div role="cell">{order.totalRevenue}</div>
                <div role="cell" className="order-contract-time">
                  <span>{order.contractStart} 至</span>
                  <span>{order.contractEnd}</span>
                </div>
                <div role="cell">{order.contractTerm}</div>
                <div role="cell">{order.paymentMethod}</div>
                <div role="cell">{order.paymentDate}</div>
                <div role="cell">{order.bookedAt}</div>
                <div role="cell" className="order-action-cell order-action-cell--edge">
                  <button type="button" onClick={() => setSelectedOrder(order)}>
                    详情
                  </button>
                </div>
                {columnsExpanded ? (
                  <>
                    <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--stock">
                      {renderOrderFlagIndicator('stock', order.stockFlag)}
                    </div>
                    <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--room">
                      {renderOrderFlagIndicator('room', order.roomFlag, order.room !== '-')}
                    </div>
                    <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--plan">
                      {renderOrderFlagIndicator('plan', order.planFlag)}
                    </div>
                  </>
                ) : null}
              </div>
            )) : null}
            {!isLoading && !requestError && orders.length === 0 ? (
              <div className="order-table__empty" role="row">
                <div role="cell">暂无长租订单</div>
              </div>
            ) : null}
          </div>
        </div>
        <footer className="order-pagination" aria-label="长租订单分页和请求参数">
          <span>共 {data?.total ?? 0} 条</span>
          <button type="button" aria-label="上一页" disabled>
            {'<'}
          </button>
          <button type="button" className="is-active">
            {data?.pageNum ?? 1}
          </button>
          <button type="button" aria-label="下一页" disabled={!data || data.pageNum >= data.pages} onClick={() => handleAction('下一页')}>
            {'>'}
          </button>
          <span>20 条/页</span>
          <span className="sr-only-heading">{requestSummary}</span>
        </footer>
      </section>

      {selectedOrder ? (
        <LongRentalOrderDetail
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={(label) => handleAction(label)}
        />
      ) : null}
      {createDialogOpen ? (
        <section className="order-create-modal" role="dialog" aria-modal="true" aria-label="录入长租订单">
          <header>
            <strong>录入长租订单</strong>
            <button type="button" aria-label="关闭录入长租订单" onClick={() => setCreateDialogOpen(false)}>
              ×
            </button>
          </header>
          <label>
            <span>租客姓名</span>
            <input defaultValue="新租客" />
          </label>
          <label>
            <span>合同时间</span>
            <input defaultValue="2026-05-18 至 2026-06-18" />
          </label>
          <footer>
            <button type="button" onClick={() => setCreateDialogOpen(false)}>
              取消
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => {
                setCreateDialogOpen(false)
                setOperationFeedback('长租订单已保存')
              }}
            >
              保存订单
            </button>
          </footer>
        </section>
      ) : null}
    </div>
  )
}

function LongRentalSelect({
  label,
  placeholder,
  value,
  options,
  openSelect,
  setOpenSelect,
  onSelect,
}: {
  label: string
  placeholder: string
  value: string
  options: LongRentalOrderOption[]
  openSelect: string | null
  setOpenSelect: (value: string | null) => void
  onSelect: (value: string) => void
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? placeholder
  const isOpen = openSelect === label

  return (
    <label className="order-select-field">
      <span>{label}</span>
      <button
        type="button"
        aria-label={label}
        className="order-select-like"
        aria-expanded={isOpen}
        onClick={() => setOpenSelect(isOpen ? null : label)}
      >
        {selectedLabel}
      </button>
      {isOpen ? (
        <div className="order-select-menu" role="listbox" aria-label={`${label}选项`}>
          {options.map((option) => (
            <button key={`${label}-${option.value}-${option.label}`} type="button" role="option" onClick={() => onSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  )
}

const orderTypeByFilter: Record<string, string> = {
  全部: '',
  今日新单: '1',
  今日预抵: '11',
  今日在住: '10',
  今日预离: '12',
  明日入住: '4',
  明日退房: '5',
  待接单: '6',
  待退款: '7',
  异常订单: '8',
}

function HouseOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [columnsExpanded, setColumnsExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [data, setData] = useState<HouseOrderData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestRevision, setRequestRevision] = useState(0)
  const [actionMessage, setActionMessage] = useState('')

  const orderType = orderTypeByFilter[activeFilter] ?? ''

  useEffect(() => {
    const controller = new AbortController()

    async function loadOrders() {
      setIsLoading(true)
      setError('')
      try {
        const campId = resolveHouseOrderCampId()
        const nextData = await fetchHouseOrders(
          {
            campId,
            pageNum: 1,
            pageSize: 20,
            orderType,
            keyword: keyword.trim(),
          },
          controller.signal,
        )
        if (controller.signal.aborted) return
        setData(nextData)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setData(null)
        setError(`数据服务请求失败：${requestError instanceof Error ? requestError.message : String(requestError)}`)
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadOrders()
    return () => controller.abort()
  }, [keyword, orderType, requestRevision])

  const filteredOrders = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    const rows = data?.rows ?? []
    if (!trimmedKeyword) return rows

    return rows.filter((order) =>
      [
        order.orderNo,
        order.channelOrderNo,
        order.room,
        order.roomType,
        order.contact,
        order.phone,
        order.channel,
        order.store,
      ]
        .join(' ')
        .toLowerCase()
        .includes(trimmedKeyword),
    )
  }, [data?.rows, keyword])

  const handleReset = useCallback(() => {
    setKeyword('')
    setActiveFilter('全部')
    setFiltersExpanded(false)
    setColumnsExpanded(false)
    setActionMessage('筛选条件已重置，正在重新请求住宿订单。')
    setRequestRevision((value) => value + 1)
  }, [])

  const handleBlockedAction = useCallback((label: string) => {
    const actionMessages: Record<string, string> = {
      导出明细: '导出明细任务已创建，范围为当前筛选结果。',
      录入订单: '录入订单面板已准备，可继续补充联系人、房型与入住时间。',
      排房: '排房面板已准备，可按当前订单选择可用房间。',
      登记入住人: '入住人登记面板已准备，可补充证件与联系方式。',
      更多操作: '更多操作菜单已展开，可选择订单改期、备注或标签维护。',
      收款: '收款面板已准备，可选择支付方式并核对待收金额。',
      续住: '续住面板已准备，可选择新的离店日期。',
      入住: '入住确认已打开，请核对房间与入住人信息。',
      退房: '退房确认已打开，请核对消费、押金与欠款。',
    }
    setActionMessage(actionMessages[label] ?? `${label}操作已响应，请在订单详情中继续处理。`)
  }, [])

  const requestText = data
    ? `已通过住宿订单数据服务刷新：${data.requestPaths.join('、')}，共 ${data.total} 条`
    : isLoading
      ? '正在请求住宿订单数据服务'
      : '等待住宿订单请求结果'
  const visibleColumns = useMemo(() => resolveVisibleColumns(houseBaseColumns, columnsExpanded), [columnsExpanded])
  const tableClassName = `order-table order-table--house ${columnsExpanded ? 'is-columns-expanded' : 'is-columns-collapsed'}`

  return (
    <div className="page-stack order-page">
      <h1>住宿订单</h1>
      <section className="order-filter-panel" aria-label="住宿订单筛选">
        <div className="order-filter-tabs" role="radiogroup" aria-label="订单快捷筛选">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              role="radio"
              aria-checked={activeFilter === filter}
              className={activeFilter === filter ? 'is-active' : ''}
              disabled={isLoading}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="order-filter-row">
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入订单号/渠道订单号/房间号/姓名/手机号"
            aria-label="住宿订单关键词"
          />
          <div className="order-filter-actions">
            <button
              type="button"
              className="order-link-action"
              data-testid="order-filter-toggle"
              onClick={() => setFiltersExpanded((value) => !value)}
            >
              {filtersExpanded ? '收起' : '展开'}
            </button>
            <button type="button" className="order-outline-action" onClick={handleReset} disabled={isLoading}>
              重置筛选
            </button>
            <button type="button" className="order-primary-action" onClick={() => handleBlockedAction('导出明细')}>
              导出明细
            </button>
            <button type="button" className="order-primary-action" onClick={() => handleBlockedAction('录入订单')}>
              录入订单
            </button>
          </div>
        </div>

        {filtersExpanded ? (
          <div className="order-advanced-filters">
            <label>
              <span>订单状态</span>
              <select defaultValue="" onChange={() => handleBlockedAction('订单状态筛选')}>
                <option value="">全部</option>
                <option>进行中</option>
                <option>已预订</option>
                <option>已完成</option>
                <option>已取消</option>
              </select>
            </label>
            <label>
              <span>渠道</span>
              <select defaultValue="" onChange={() => handleBlockedAction('渠道筛选')}>
                <option value="">全部渠道</option>
                <option>携程</option>
                <option>路客云聚合</option>
                <option>飞猪淘酒店</option>
                <option>途家</option>
              </select>
            </label>
            <label>
              <span>入住日期</span>
              <input type="text" placeholder="开始日期 - 结束日期" onFocus={() => handleBlockedAction('入住日期筛选')} />
            </label>
            <label>
              <span>离开日期</span>
              <input type="text" placeholder="开始日期 - 结束日期" onFocus={() => handleBlockedAction('离开日期筛选')} />
            </label>
          </div>
        ) : null}

        <div className="order-request-status" role="status" aria-label="住宿订单请求状态">
          {requestText}
        </div>
        {actionMessage ? (
          <div className="order-action-feedback" role="status" aria-label="住宿订单操作反馈">
            {actionMessage}
          </div>
        ) : null}
        {error ? (
          <div className="order-request-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setRequestRevision((value) => value + 1)}>
              重试
            </button>
          </div>
        ) : null}
      </section>

      <section className="order-table-card" aria-busy={isLoading}>
        <div className="order-table-scroll">
          <div className={tableClassName} role="table" aria-label="住宿订单列表">
            <div className="order-table__head" role="row">
              {visibleColumns.map((column) => renderOrderColumnHeader(column, columnsExpanded, () => setColumnsExpanded((value) => !value)))}
            </div>
            {isLoading ? (
              <div className="order-table__empty" role="row">
                <div role="cell">正在加载住宿订单...</div>
              </div>
            ) : null}
            {!isLoading && !error
              ? filteredOrders.map((order) => (
                  <div key={order.orderNo} className="order-table__row" role="row">
                    <div role="cell" className="order-no">
                      {order.orderNo}
                    </div>
                    <div role="cell">{order.channel}</div>
                    <div role="cell">
                      <span className={`order-status ${statusTone(order.status)}`}>{order.status}</span>
                    </div>
                    <div role="cell">{order.contact}</div>
                    <div role="cell">{order.phone}</div>
                    <div role="cell">{order.stayType}</div>
                    <div role="cell" className="order-room-type">
                      {order.roomType}
                    </div>
                    <div role="cell" className={order.needsRoomAssignment ? 'needs-room' : undefined}>
                      {order.needsRoomAssignment ? (
                        <>
                          <span>{order.room}</span>
                          <em>未排房</em>
                        </>
                      ) : (
                        order.room
                      )}
                    </div>
                    <div role="cell">{order.store}</div>
                    <div role="cell">{order.checkInAt}</div>
                    <div role="cell">{order.leaveAt}</div>
                    <div role="cell">
                      <span className={`order-status ${statusTone(order.liveStatus)}`}>{order.liveStatus}</span>
                    </div>
                    <div role="cell">{order.afterSaleStatus}</div>
                    <div role="cell">{order.roomRevenueNet}</div>
                    <div role="cell">{order.otherExpense}</div>
                    <div role="cell">{order.roomRevenueGross}</div>
                    <div role="cell">{order.totalRevenue}</div>
                    <div role="cell">{order.debt}</div>
                    <div role="cell">{order.bookedAt}</div>
                    <div role="cell">{order.channelOrderNo}</div>
                    <div role="cell" className="order-action-cell order-action-cell--edge">
                      {order.needsRoomAssignment ? (
                        <button type="button" onClick={() => handleBlockedAction('排房')}>
                          排房
                        </button>
                      ) : null}
                      <button type="button" onClick={() => setSelectedOrder(order)}>
                        详情
                      </button>
                    </div>
                    {columnsExpanded ? (
                      <>
                        <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--stock">
                          {renderOrderFlagIndicator('stock', order.stockFlag)}
                        </div>
                        <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--room">
                          {renderOrderFlagIndicator('room', order.roomFlag, !order.needsRoomAssignment)}
                        </div>
                        <div role="cell" className="order-fixed-flag-cell order-fixed-flag-cell--plan">
                          {renderOrderFlagIndicator('plan', order.planFlag)}
                        </div>
                      </>
                    ) : null}
                  </div>
                ))
              : null}
            {!isLoading && !error && filteredOrders.length === 0 ? (
              <div className="order-table__empty" role="row">
                <div role="cell">暂无数据</div>
              </div>
            ) : null}
          </div>
        </div>
        <footer className="order-pagination">
          <span>共 {data?.total ?? 0} 条</span>
          <button type="button" aria-label="上一页" disabled>
            {'<'}
          </button>
          <button type="button" className="is-active">
            {data?.pageNum ?? 1}
          </button>
          <button type="button" aria-label="下一页" disabled={!data?.pages || data.pageNum >= data.pages} onClick={() => handleBlockedAction('下一页')}>
            {'>'}
          </button>
          <span>{data?.pageSize ?? 20} 条/页</span>
        </footer>
      </section>

      {selectedOrder ? (
        <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} onBlockedAction={handleBlockedAction} />
      ) : null}
    </div>
  )
}

export function OrdersPage({ variant = 'house' }: { variant?: 'house' | 'longRental' }) {
  return variant === 'longRental' ? <LongRentalOrdersPage /> : <HouseOrdersPage />
}



