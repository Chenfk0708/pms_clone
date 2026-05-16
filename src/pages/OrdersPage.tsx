import { useMemo, useState } from 'react'
import './OrdersPage.css'

type OrderRow = {
  orderNo: string
  channel: string
  status: '进行中' | '已完成' | '已取消' | '已预订'
  contact: string
  phone: string
  stayType: string
  roomType: string
  room: string
  store: string
  checkInAt: string
  leaveAt: string
  liveStatus: '入住中' | '已退房' | '已取消' | '待入住'
  afterSaleStatus: string
  roomRevenueNet: string
  otherExpense: string
  roomRevenueGross: string
  totalRevenue: string
  debt: string
  bookedAt: string
  channelOrderNo: string
  stockFlag: string
  roomFlag: string
  planFlag: string
  needsRoomAssignment?: boolean
  commission?: string
  collected?: string
  confirmNo?: string
}

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

const orders: OrderRow[] = [
  {
    orderNo: '2055143511458684929',
    channel: '携程',
    status: '已取消',
    contact: 'CHAN SHUK KWAN',
    phone: '-',
    stayType: '全日房',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '-',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-23 15:00',
    leaveAt: '2026-05-24 12:00',
    liveStatus: '已取消',
    afterSaleStatus: '--',
    roomRevenueNet: '0',
    otherExpense: '0',
    roomRevenueGross: '0',
    totalRevenue: '0',
    debt: '0',
    bookedAt: '2026-05-15 12:29:30',
    channelOrderNo: '1359044583414945',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2055103007337734146',
    channel: '飞猪淘酒店',
    status: '已预订',
    contact: '黄国辉',
    phone: '+8617328513805',
    stayType: '全日房',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    room: '-',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-16 15:00',
    leaveAt: '2026-05-23 12:00',
    liveStatus: '待入住',
    afterSaleStatus: '--',
    roomRevenueNet: '1980.85',
    otherExpense: '0',
    roomRevenueGross: '2116.53',
    totalRevenue: '2116.53',
    debt: '0',
    bookedAt: '2026-05-15 09:48:30',
    channelOrderNo: '5115623835635087439',
    stockFlag: '',
    roomFlag: '未排房',
    planFlag: '',
    needsRoomAssignment: true,
  },
  {
    orderNo: '2054982772215554049',
    channel: '飞猪淘酒店',
    status: '已预订',
    contact: '陈家辉',
    phone: '-',
    stayType: '全日房',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-18 15:00',
    leaveAt: '2026-05-20 12:00',
    liveStatus: '待入住',
    afterSaleStatus: '--',
    roomRevenueNet: '597.6',
    otherExpense: '0',
    roomRevenueGross: '664',
    totalRevenue: '664',
    debt: '0',
    bookedAt: '2026-05-15 01:50:10',
    channelOrderNo: '5116035240226051843',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2054958882479181826',
    channel: '飞猪淘酒店',
    status: '已预订',
    contact: '李慧萍',
    phone: '+8618089877096',
    stayType: '全日房',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-06-19 15:00',
    leaveAt: '2026-06-21 12:00',
    liveStatus: '待入住',
    afterSaleStatus: '--',
    roomRevenueNet: '597.6',
    otherExpense: '0',
    roomRevenueGross: '637.92',
    totalRevenue: '637.92',
    debt: '0',
    bookedAt: '2026-05-15 00:15:48',
    channelOrderNo: '5116107745021014602',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2054803500091822081',
    channel: '自来客',
    status: '已取消',
    contact: '翌',
    phone: '-',
    stayType: '全日房',
    roomType: '观影大床房',
    room: '-',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-14 15:00',
    leaveAt: '2026-05-15 12:00',
    liveStatus: '已取消',
    afterSaleStatus: '--',
    roomRevenueNet: '376.2',
    otherExpense: '0',
    roomRevenueGross: '376.2',
    totalRevenue: '376.2',
    debt: '0',
    bookedAt: '2026-05-14 13:58:25',
    channelOrderNo: '-',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2054765870809522177',
    channel: '携程',
    status: '已预订',
    contact: '闵尊海',
    phone: '-',
    stayType: '全日房',
    roomType: '天落大床电竞套间',
    room: '1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-16 15:00',
    leaveAt: '2026-05-17 12:00',
    liveStatus: '待入住',
    afterSaleStatus: '--',
    roomRevenueNet: '209.17',
    otherExpense: '0',
    roomRevenueGross: '269',
    totalRevenue: '269',
    debt: '0',
    bookedAt: '2026-05-14 11:28:53',
    channelOrderNo: '1128147922175371',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2054616751201689601',
    channel: '携程',
    status: '已完成',
    contact: '李虹岐',
    phone: '-',
    stayType: '全日房',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-14 15:00',
    leaveAt: '2026-05-15 12:00',
    liveStatus: '已退房',
    afterSaleStatus: '--',
    roomRevenueNet: '276.64',
    otherExpense: '0',
    roomRevenueGross: '355',
    totalRevenue: '355',
    debt: '0',
    bookedAt: '2026-05-14 01:36:21',
    channelOrderNo: '1128147921209625',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2054409001821356034',
    channel: '路客云聚合',
    status: '已完成',
    contact: '陈崇科',
    phone: '+8618319045566',
    stayType: '全日房',
    roomType: '天落大床电竞套间',
    room: '1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-13 15:00',
    leaveAt: '2026-05-14 12:00',
    liveStatus: '已退房',
    afterSaleStatus: '--',
    roomRevenueNet: '369.75',
    otherExpense: '0',
    roomRevenueGross: '435',
    totalRevenue: '435',
    debt: '0',
    bookedAt: '2026-05-13 11:50:49',
    channelOrderNo: '10085200031107',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
    collected: '435.00',
  },
  {
    orderNo: '2054340491892084738',
    channel: '携程',
    status: '已完成',
    contact: '张张',
    phone: '-',
    stayType: '全日房',
    roomType: '观影大床房',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-13 15:00',
    leaveAt: '2026-05-14 12:00',
    liveStatus: '已退房',
    afterSaleStatus: '--',
    roomRevenueNet: '163.94',
    otherExpense: '0',
    roomRevenueGross: '211',
    totalRevenue: '211',
    debt: '0',
    bookedAt: '2026-05-13 07:18:35',
    channelOrderNo: '1128147908092485',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
    commission: '47.06',
    collected: '178.26',
    confirmNo: '1128147908092485-1',
  },
  {
    orderNo: '2054266689027952643',
    channel: '携程',
    status: '已完成',
    contact: '曾观强',
    phone: '-',
    stayType: '全日房',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-12 15:00',
    leaveAt: '2026-05-13 12:00',
    liveStatus: '已退房',
    afterSaleStatus: '--',
    roomRevenueNet: '169.3',
    otherExpense: '0',
    roomRevenueGross: '233',
    totalRevenue: '233',
    debt: '0',
    bookedAt: '2026-05-13 02:25:19',
    channelOrderNo: '1128147906877974',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2054198383042457601',
    channel: '途家',
    status: '已取消',
    contact: '张宇',
    phone: '-',
    stayType: '全日房',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    room: '-',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-13 15:00',
    leaveAt: '2026-05-14 12:00',
    liveStatus: '已取消',
    afterSaleStatus: '--',
    roomRevenueNet: '0',
    otherExpense: '0',
    roomRevenueGross: '0',
    totalRevenue: '0',
    debt: '0',
    bookedAt: '2026-05-12 21:53:48',
    channelOrderNo: '10085100147463',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2054107372756955137',
    channel: '飞猪淘酒店',
    status: '已预订',
    contact: '陈家辉',
    phone: '-',
    stayType: '全日房',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-17 15:00',
    leaveAt: '2026-05-20 12:00',
    liveStatus: '待入住',
    afterSaleStatus: '--',
    roomRevenueNet: '896.4',
    otherExpense: '0',
    roomRevenueGross: '996',
    totalRevenue: '996',
    debt: '0',
    bookedAt: '2026-05-12 15:52:01',
    channelOrderNo: '5115231003771015833',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2053977389904437249',
    channel: '飞猪淘酒店',
    status: '已完成',
    contact: '张勇',
    phone: '-',
    stayType: '全日房',
    roomType: '天落大床电竞套间',
    room: '1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-12 15:00',
    leaveAt: '2026-05-13 12:00',
    liveStatus: '已退房',
    afterSaleStatus: '--',
    roomRevenueNet: '164.46',
    otherExpense: '0',
    roomRevenueGross: '182.07',
    totalRevenue: '182.07',
    debt: '0',
    bookedAt: '2026-05-12 07:15:30',
    channelOrderNo: '5115711637758049210',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2053904159843667969',
    channel: '携程',
    status: '已完成',
    contact: '张张',
    phone: '-',
    stayType: '全日房',
    roomType: '观影大床房',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-12 15:00',
    leaveAt: '2026-05-13 12:00',
    liveStatus: '已退房',
    afterSaleStatus: '--',
    roomRevenueNet: '163.94',
    otherExpense: '0',
    roomRevenueGross: '211',
    totalRevenue: '211',
    debt: '0',
    bookedAt: '2026-05-12 02:24:46',
    channelOrderNo: '1128147865865163',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2053868305083363330',
    channel: '携程',
    status: '进行中',
    contact: '刘翻红',
    phone: '-',
    stayType: '全日房',
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-13 15:00',
    leaveAt: '2026-05-14 12:00',
    liveStatus: '入住中',
    afterSaleStatus: '--',
    roomRevenueNet: '285.44',
    otherExpense: '0',
    roomRevenueGross: '365',
    totalRevenue: '365',
    debt: '0',
    bookedAt: '2026-05-12 00:02:17',
    channelOrderNo: '1128147865610093',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2053844376356769793',
    channel: '美团酒店',
    status: '已预订',
    contact: '樊润虎',
    phone: '+8613049425760',
    stayType: '全日房',
    roomType: '观影大床房',
    room: '房间1',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-14 00:00',
    leaveAt: '2026-05-15 00:00',
    liveStatus: '待入住',
    afterSaleStatus: '--',
    roomRevenueNet: '229.18',
    otherExpense: '0',
    roomRevenueGross: '291.43',
    totalRevenue: '291.43',
    debt: '0',
    bookedAt: '2026-05-11 22:26:56',
    channelOrderNo: '5026028505688868639',
    stockFlag: '',
    roomFlag: '',
    planFlag: '',
  },
  {
    orderNo: '2052953037821870082',
    channel: '飞猪淘酒店',
    status: '进行中',
    contact: '黄国辉',
    phone: '+8617328513805',
    stayType: '全日房',
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    room: '-',
    store: '天落会宿公寓(前海壹方城宝安中心店)',
    checkInAt: '2026-05-10 15:00',
    leaveAt: '2026-05-16 12:00',
    liveStatus: '入住中',
    afterSaleStatus: '--',
    roomRevenueNet: '1743.86',
    otherExpense: '0',
    roomRevenueGross: '1863.38',
    totalRevenue: '1863.38',
    debt: '0',
    bookedAt: '2026-05-09 20:15:08',
    channelOrderNo: '5115711637758049210',
    stockFlag: '',
    roomFlag: '未排房',
    planFlag: '',
    needsRoomAssignment: true,
  },
]

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

function statusTone(status: OrderRow['status'] | OrderRow['liveStatus']) {
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

function OrderDetail({ order, onClose }: { order: OrderRow; onClose: () => void }) {
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
            <button type="button" className="order-link-button">
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
              <button key={action} type="button">
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
          <button type="button">更多操作</button>
          <button type="button">收 款</button>
          <button type="button">续 住</button>
          <button type="button">入住</button>
          <button type="button">退房</button>
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

  const filteredOrders = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    return longRentalOrders.filter((order) => {
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
  }, [activeFilter, keyword])

  return (
    <div className="page-stack order-page order-page--long-rental">
      <h1>长租订单</h1>
      <section className="order-filter-panel" aria-label="长租订单筛选">
        <div className="order-filter-tabs" role="radiogroup" aria-label="订单快捷筛选">
          {quickFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              role="radio"
              aria-checked={activeFilter === filter}
              className={activeFilter === filter ? 'is-active' : ''}
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
              }}
            >
              重置筛选
            </button>
            <button type="button" className="order-primary-action">
              导出明细
            </button>
            <button type="button" className="order-primary-action">
              录入订单
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="order-advanced-filters order-advanced-filters--long-rental">
            {longRentalAdvancedFilters.map(([label, value]) => (
              <label key={label}>
                <span>{label}</span>
                <button type="button" aria-label={label} className="order-select-like">
                  {value}
                </button>
              </label>
            ))}
          </div>
        ) : null}
      </section>

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

function HouseOrdersPage() {
  const [activeFilter, setActiveFilter] = useState('全部')
  const [expanded, setExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)

  const filteredOrders = useMemo(() => {
    const trimmedKeyword = keyword.trim().toLowerCase()
    return orders.filter((order) => {
      const filterMatched =
        activeFilter === '全部' ||
        (activeFilter === '今日新单' && order.bookedAt.startsWith('2026-05-13')) ||
        (activeFilter === '今日预抵' && order.checkInAt.startsWith('2026-05-13')) ||
        (activeFilter === '今日在住' && order.liveStatus === '入住中') ||
        (activeFilter === '今日预离' && order.leaveAt.startsWith('2026-05-13')) ||
        (activeFilter === '明日入住' && order.checkInAt.startsWith('2026-05-14')) ||
        (activeFilter === '明日退房' && order.leaveAt.startsWith('2026-05-14')) ||
        (activeFilter === '异常订单' && order.needsRoomAssignment)

      if (!filterMatched) return false
      if (!trimmedKeyword) return true

      return [
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
        .includes(trimmedKeyword)
    })
  }, [activeFilter, keyword])

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
              }}
            >
              重置筛选
            </button>
            <button type="button" className="order-primary-action">
              导出明细
            </button>
            <button type="button" className="order-primary-action">
              录入订单
            </button>
          </div>
        </div>

        {expanded ? (
          <div className="order-advanced-filters">
            <label>
              <span>订单状态</span>
              <select defaultValue="">
                <option value="">全部</option>
                <option>进行中</option>
                <option>已预订</option>
                <option>已完成</option>
                <option>已取消</option>
              </select>
            </label>
            <label>
              <span>渠道</span>
              <select defaultValue="">
                <option value="">全部渠道</option>
                <option>携程</option>
                <option>路客云聚合</option>
                <option>飞猪淘酒店</option>
                <option>途家</option>
              </select>
            </label>
            <label>
              <span>入住日期</span>
              <input type="text" placeholder="开始日期 - 结束日期" />
            </label>
            <label>
              <span>离开日期</span>
              <input type="text" placeholder="开始日期 - 结束日期" />
            </label>
          </div>
        ) : null}
      </section>

      <section className="order-table-card">
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
            {filteredOrders.map((order) => (
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
                  {order.needsRoomAssignment ? <button type="button">排房</button> : null}
                  <button type="button" onClick={() => setSelectedOrder(order)}>
                    详情
                  </button>
                </div>
                <div role="cell">{order.stockFlag}</div>
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
          <span>共 1680 条</span>
          <button type="button" aria-label="上一页">
            {'<'}
          </button>
          <button type="button" className="is-active">
            1
          </button>
          <button type="button">2</button>
          <button type="button">3</button>
          <span>...</span>
          <button type="button">84</button>
          <button type="button" aria-label="下一页">
            {'>'}
          </button>
          <span>20 条/页</span>
        </footer>
      </section>

      {selectedOrder ? <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} /> : null}
    </div>
  )
}

export function OrdersPage({ variant = 'house' }: { variant?: 'house' | 'longRental' }) {
  return variant === 'longRental' ? <LongRentalOrdersPage /> : <HouseOrdersPage />
}
