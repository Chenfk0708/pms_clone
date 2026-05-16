import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchHouseOrders,
  resolveHouseOrderCampId,
  type HouseOrderData,
  type HouseOrderRow as OrderRow,
} from '../services/houseOrders'
import { fetchLongRentalOrders } from '../services/longRentalOrders'
import './OrdersPage.css'


type LongRentalOrderRow = {
  orderNo: string
  channel: string
  tenantName: string
  phone: string
  roomType: string
  room: string
  store: string
  checkInAt: string
  leaveAt: string
  liveStatus: '已取消' | '入住中' | '已退房' | '待入住'
  roomRevenueGross: string
  roomRevenueNet: string
  otherExpense: string
  deposit: string
  totalRevenue: string
  contractStart: string
  contractEnd: string
  contractTerm: string
  paymentMethod: string
  paymentDate: string
  bookedAt: string
  stockFlag: string
  roomFlag: string
  planFlag: string
}

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

const columns = [
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
  '操作',
  '占库存',
  '已排房',
  '计入统计',
]

const longRentalColumns = [
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
  '操作',
  '占库存',
  '已排房',
  '计入统计',
]

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

const longRentalOrders: LongRentalOrderRow[] = [
  {
    orderNo: '1871589898539520001',
    channel: '美团民宿',
    tenantName: '佟扬',
    phone: '+8613701374866',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '-',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2025-01-12 15:00',
    leaveAt: '2025-01-27 12:00',
    liveStatus: '已取消',
    roomRevenueGross: '--',
    roomRevenueNet: '--',
    otherExpense: '--',
    deposit: '200',
    totalRevenue: '--',
    contractStart: '2025-01-12',
    contractEnd: '2025-01-27',
    contractTerm: '15日',
    paymentMethod: '一次性付清',
    paymentDate: '本月11号',
    bookedAt: '2024-12-25 00:12:54',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
]

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
}: {
  order: LongRentalOrderRow
  onClose: () => void
}) {
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
          <button type="button" className="is-active">
            订单信息
          </button>
          <button type="button">合同信息</button>
          <button type="button">缴费记录</button>
        </nav>

        <div className="order-detail-body">
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

          <section className="order-detail-section">
            <h3>合同时间</h3>
            <p>{formatLongContractTime(order)}</p>
          </section>

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
          <button type="button">更多操作</button>
          <button type="button">收 款</button>
          <button type="button">续 租</button>
          <button type="button">退 租</button>
        </footer>
      </section>
    </div>
  )
}

function LongRentalOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [expanded, setExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<LongRentalOrderRow | null>(null)
  const [orders, setOrders] = useState<LongRentalOrderRow[]>(longRentalOrders)
  const [dataSource, setDataSource] = useState('orders/page/get · 真实目标站取证快照')
  const [loadStatus, setLoadStatus] = useState('未接入实时上下文，展示真实目标站取证快照')
  const [requestError, setRequestError] = useState<string | null>(null)
  const [operationFeedback, setOperationFeedback] = useState('等待操作')

  const campId = useMemo(() => new URLSearchParams(window.location.search).get('campId')?.trim() ?? '', [])

  const loadRealOrders = useCallback(
    async (signal?: AbortSignal) => {
      if (!campId) {
        setOrders(longRentalOrders)
        setDataSource('orders/page/get · 真实目标站取证快照')
        setLoadStatus('缺少 campId，未发起长租订单真实接口请求')
        setRequestError('缺少 campId，无法请求 hudson-prod.localhome.cn/orders/page/get')
        return
      }

      setRequestError(null)
      setLoadStatus('正在请求 orders/page/get')
      const result = await fetchLongRentalOrders(
        {
          campId,
          pageNum: 1,
          pageSize: 20,
          current: 1,
          keyword,
        },
        signal,
      )
      setOrders(result.rows)
      setDataSource(`orders/page/get · 真实接口已加载 · campId=${campId}`)
      setLoadStatus(`真实接口已加载 ${result.rows.length} 条`)
    },
    [campId, keyword],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      loadRealOrders(controller.signal).catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setOrders(longRentalOrders)
        setDataSource('orders/page/get · 真实接口请求失败，保留真实目标站取证快照')
        setLoadStatus('真实接口请求失败')
        setRequestError(error instanceof Error ? error.message : String(error))
      })
    })
    return () => controller.abort()
  }, [loadRealOrders])

  const filteredOrders = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    return orders.filter((order) => {
      const filterMatched =
        activeFilter === '全部' ||
        (activeFilter === '今日新单' && order.bookedAt.startsWith('2026-05-13')) ||
        (activeFilter === '今日预抵' && order.checkInAt.startsWith('2026-05-13')) ||
        (activeFilter === '今日在住' && order.liveStatus === '入住中') ||
        (activeFilter === '今日预离' && order.leaveAt.startsWith('2026-05-13'))

      if (!filterMatched) return false
      if (!trimmedKeyword) return true

      return [order.orderNo, order.tenantName, order.phone, order.roomType, order.room, order.channel, order.store]
        .join(' ')
        .toLowerCase()
        .includes(trimmedKeyword)
    })
  }, [activeFilter, keyword, orders])

  return (
    <div className="page-stack order-page order-page--long-rental">
      <h1>长租订单</h1>
      <section className="order-source-panel" aria-label="长租订单数据来源">
        <span>{dataSource}</span>
        <span role="status" aria-label="长租订单加载状态">
          {loadStatus}
        </span>
      </section>
      {requestError ? (
        <section className="order-blocked-alert" role="alert" aria-label="长租订单接口阻塞">
          <span>{requestError}</span>
          {campId ? (
            <button
              type="button"
              onClick={() => {
                loadRealOrders().catch((error) => {
                  setRequestError(error instanceof Error ? error.message : String(error))
                  setLoadStatus('真实接口请求失败')
                })
              }}
            >
              重试长租订单接口
            </button>
          ) : null}
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
              onClick={() => {
                setActiveFilter(filter)
                setOperationFeedback(`${filter}筛选已切换${campId ? '，正在同步真实接口' : '，缺少 campId 未请求真实接口'}`)
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
            <button type="button" className="order-link-action" onClick={() => setExpanded((value) => !value)}>
              {expanded ? '收起' : '展开'}
            </button>
            <button
              type="button"
              className="order-outline-action"
              onClick={() => {
                setKeyword('')
                setActiveFilter('全部')
                setExpanded(false)
                setOperationFeedback(`重置筛选完成${campId ? '，正在刷新真实接口' : '，缺少 campId 未请求真实接口'}`)
              }}
            >
              重置筛选
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => setOperationFeedback('导出明细真实接口未取证，当前不执行假成功导出')}
            >
              导出明细
            </button>
            <button
              type="button"
              className="order-primary-action"
              onClick={() => setOperationFeedback('录入订单入口未接入真实长租订单创建流程')}
            >
              录入订单
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="order-advanced-filters order-advanced-filters--long-rental">
            {longRentalAdvancedFilters.map(([label, value]) => (
              <label key={label}>
                <span>{label}</span>
                <button
                  type="button"
                  aria-label={label}
                  className="order-select-like"
                  onClick={() => setOperationFeedback(`${label}真实选项未接入，等待目标站筛选配置接口闭环`)}
                >
                  {value}
                </button>
              </label>
            ))}
          </div>
        ) : null}
      </section>
      <div className="order-operation-feedback" role="status" aria-label="长租订单操作反馈">
        {operationFeedback}
      </div>

      <section className="order-table-card">
        <div className="order-table-scroll">
          <div className="order-table" role="table" aria-label="长租订单列表">
            <div className="order-table__head" role="row">
              {longRentalColumns.map((column) => (
                <div
                  key={column}
                  role="columnheader"
                  className={column === '操作' ? 'order-action-head' : undefined}
                >
                  {column}
                </div>
              ))}
            </div>
            {filteredOrders.map((order) => (
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
                <div role="cell" className="order-action-cell">
                  <button type="button" onClick={() => setSelectedOrder(order)}>
                    详情
                  </button>
                </div>
                <div role="cell">{order.stockFlag || '1'}</div>
                <div role="cell">{order.roomFlag}</div>
                <div role="cell">{order.planFlag}</div>
              </div>
            ))}
            {filteredOrders.length === 0 ? (
              <div className="order-table__empty" role="row">
                <div role="cell">暂无数据</div>
              </div>
            ) : null}
          </div>
        </div>
        <footer className="order-pagination">
          <button type="button" aria-label="上一页" disabled>
            {'<'}
          </button>
          <button type="button" className="is-active">
            1
          </button>
          <span>20 条/页</span>
        </footer>
      </section>

      {selectedOrder ? <LongRentalOrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
    </div>
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
  const [expanded, setExpanded] = useState(false)
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
        setError(`真实接口请求失败：${requestError instanceof Error ? requestError.message : String(requestError)}。请检查登录态、campId、CORS 或后端可达性。`)
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
    setExpanded(false)
    setActionMessage('筛选条件已重置，正在重新请求住宿订单。')
    setRequestRevision((value) => value + 1)
  }, [])

  const handleBlockedAction = useCallback((label: string) => {
    setActionMessage(`${label}：目标站存在该入口，但本地尚未接入可变更业务接口，已作为阻塞暴露。`)
  }, [])

  const requestText = data
    ? `已通过真实接口刷新：${data.requestPaths.join('、')}，共 ${data.total} 条`
    : isLoading
      ? '正在请求住宿订单真实接口'
      : '等待住宿订单请求结果'

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
            <button type="button" className="order-link-action" onClick={() => setExpanded((value) => !value)}>
              {expanded ? '收起' : '展开'}
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

        {expanded ? (
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
          <div className="order-table" role="table" aria-label="住宿订单列表">
            <div className="order-table__head" role="row">
              {columns.map((column) => (
                <div
                  key={column}
                  role="columnheader"
                  className={column === '操作' ? 'order-action-head' : undefined}
                >
                  {column}
                </div>
              ))}
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
                    <div role="cell" className="order-action-cell">
                      {order.needsRoomAssignment ? (
                        <button type="button" onClick={() => handleBlockedAction('排房')}>
                          排房
                        </button>
                      ) : null}
                      <button type="button" onClick={() => setSelectedOrder(order)}>
                        详情
                      </button>
                    </div>
                    <div role="cell">{order.stockFlag}</div>
                    <div role="cell">{order.roomFlag}</div>
                    <div role="cell">{order.planFlag}</div>
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



