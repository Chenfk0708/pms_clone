import { useState } from 'react'
import './OrderLedgerPage.css'

type SelectKind = 'type' | 'source' | 'project' | 'payment' | null

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']
const datePresets = ['昨天', '今天', '上周', '本周', '上月', '本月']

const options = {
  type: ['全部类型', '收入', '支出'],
  source: ['全部来源', '住宿订单', '记一笔'],
  project: ['房费', '押金', '其他消费', '记一笔收入', '记一笔支出'],
  payment: ['平台代收', '微信', '支付宝', '其他', '现金', '银行转帐', '信用卡', '通联', '储值金', '暂未收款'],
}

const ledgerRows = [
  {
    type: '收入',
    source: '住宿订单',
    orderNo: '2054409001821356034',
    project: '房费',
    amount: '435',
    debt: '0',
    payment: '暂未收款',
    serial: '-',
    paidAt: '-',
    createdAt: '2026-05-13 11:50:49',
    room: '天落大床电竞套间-1',
    remark: '-',
    operator: '-',
  },
  {
    type: '收入',
    source: '住宿订单',
    orderNo: '2054340491892084738',
    project: '房费',
    amount: '178.26',
    debt: '0',
    payment: '暂未收款',
    serial: '-',
    paidAt: '-',
    createdAt: '2026-05-13 07:18:35',
    room: '观影大床房-房间1',
    remark: '-',
    operator: '-',
  },
  {
    type: '收入',
    source: '住宿订单',
    orderNo: '2054266689027952643',
    project: '房费',
    amount: '202',
    debt: '0',
    payment: '暂未收款',
    serial: '-',
    paidAt: '-',
    createdAt: '2026-05-13 02:25:19',
    room: '总裁套间（桑拿浴缸露台电竞麻将）-房间1',
    remark: '-',
    operator: '-',
  },
]

export function OrderLedgerPage() {
  const [store, setStore] = useState(stores[0])
  const [datePreset, setDatePreset] = useState('昨天')
  const [type, setType] = useState(options.type[0])
  const [source, setSource] = useState(options.source[0])
  const [project, setProject] = useState('请选择项目')
  const [payment, setPayment] = useState('请选择支付方式')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function resetFilters() {
    setStore(stores[0])
    setDatePreset('昨天')
    setType(options.type[0])
    setSource(options.source[0])
    setProject('请选择项目')
    setPayment('请选择支付方式')
    setOpenSelect(null)
    setNotice('')
  }

  return (
    <div className="order-ledger-page">
      <h1 className="sr-only-heading">收支明细</h1>

      <section className="order-ledger-filter" aria-label="收支明细筛选">
        <div className="order-ledger-store-row" aria-label="门店">
          {stores.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={store === item}
              className={store === item ? 'is-active' : ''}
              onClick={() => setStore(item)}
            >
              {item}
            </button>
          ))}
          <button type="button" className="order-ledger-gear" aria-label="门店设置">
            ⚙
          </button>
        </div>

        <div className="order-ledger-presets" role="group" aria-label="日期快捷筛选">
          {datePresets.map((preset) => (
            <button
              key={preset}
              type="button"
              className={datePreset === preset ? 'is-active' : ''}
              onClick={() => setDatePreset(preset)}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="order-ledger-date-range" aria-label="账本日期">
          <input aria-label="开始日期" placeholder="开始日期" value="2026-05-13" readOnly />
          <span>至</span>
          <input aria-label="结束日期" placeholder="结束日期" value="2026-05-13" readOnly />
        </div>

        <SelectField
          label="类型"
          value={type}
          kind="type"
          openSelect={openSelect}
          optionLabel="类型选项"
          options={options.type}
          onToggle={() => setOpenSelect(openSelect === 'type' ? null : 'type')}
          onSelect={(value) => {
            setType(value)
            setOpenSelect(null)
          }}
        />
        <SelectField
          label="来源"
          value={source}
          kind="source"
          openSelect={openSelect}
          optionLabel="来源选项"
          options={options.source}
          onToggle={() => setOpenSelect(openSelect === 'source' ? null : 'source')}
          onSelect={(value) => {
            setSource(value)
            setOpenSelect(null)
          }}
        />
        <SelectField
          label="项目"
          value={project}
          kind="project"
          openSelect={openSelect}
          optionLabel="项目选项"
          options={options.project}
          onToggle={() => setOpenSelect(openSelect === 'project' ? null : 'project')}
          onSelect={(value) => {
            setProject(value)
            setOpenSelect(null)
          }}
        />

        <label className="order-ledger-keyword">
          <span>搜索：</span>
          <input placeholder="输入支付流水号/订单号" />
        </label>

        <button type="button" className="order-ledger-room-select" onClick={() => setRoomDialogOpen(true)}>
          <span>关联房间</span>
          <strong>全部</strong>
        </button>

        <SelectField
          label="支付方式"
          value={payment}
          kind="payment"
          openSelect={openSelect}
          optionLabel="支付方式选项"
          options={options.payment}
          onToggle={() => setOpenSelect(openSelect === 'payment' ? null : 'payment')}
          onSelect={(value) => {
            setPayment(value)
            setOpenSelect(null)
          }}
        />

        <div className="order-ledger-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={() => setNotice('已生成收支明细导出任务')}>
            导 出
          </button>
        </div>
      </section>

      {notice ? (
        <div className="order-ledger-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="order-ledger-summary" aria-label="账本概括">
        <h2>账本概括</h2>
        <div className="order-ledger-summary-grid">
          {[
            ['净收入', '¥ 815.26'],
            ['总收入', '¥ 815.26'],
            ['总支出', '¥ 0'],
          ].map(([label, value]) => (
            <article key={label}>
              <span aria-hidden="true">¥</span>
              <p>{label}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="order-ledger-table-section" aria-label="账本明细表格">
        <h2>账本明细</h2>
        <div className="order-ledger-table-scroll">
          <table className="order-ledger-table">
            <thead>
              <tr>
                {[
                  '类型',
                  '来源',
                  '订单号',
                  '项目',
                  '金额',
                  '欠款',
                  '支付方式',
                  '支付流水号',
                  '支付时间',
                  '创建时间',
                  '关联房型/房间',
                  '备注',
                  '操作人',
                  '操作',
                ].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ledgerRows.map((row) => (
                <tr key={row.orderNo}>
                  <td>{row.type}</td>
                  <td>{row.source}</td>
                  <td>
                    <button type="button" className="order-ledger-link" onClick={() => setDetailOpen(true)}>
                      {row.orderNo}
                    </button>
                  </td>
                  <td>{row.project}</td>
                  <td>{row.amount}</td>
                  <td>{row.debt}</td>
                  <td>{row.payment}</td>
                  <td>{row.serial}</td>
                  <td>{row.paidAt}</td>
                  <td>{row.createdAt}</td>
                  <td>{row.room}</td>
                  <td>{row.remark}</td>
                  <td>{row.operator}</td>
                  <td>
                    <button type="button" className="order-ledger-link" onClick={() => setDetailOpen(true)}>
                      查看详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav className="order-ledger-pagination" aria-label="分页">
          <span>第 1-3 条/总共 3 条</span>
          <button type="button" aria-label="上一页" disabled>
            ‹
          </button>
          <button type="button" className="is-current">
            1
          </button>
          <button type="button" aria-label="下一页" disabled>
            ›
          </button>
          <button type="button">10 条/页</button>
        </nav>
      </section>

      {roomDialogOpen ? <RoomDialog onClose={() => setRoomDialogOpen(false)} /> : null}
      {detailOpen ? <OrderDetail onClose={() => setDetailOpen(false)} /> : null}
    </div>
  )
}

function SelectField({
  label,
  value,
  kind,
  openSelect,
  optionLabel,
  options: selectOptions,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  optionLabel: string
  options: string[]
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="order-ledger-select-field">
      <span className="order-ledger-select-label">{label}：</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={openSelect === kind}
        aria-label={`${label} ${value}`}
        onClick={onToggle}
      >
        <strong>{value}</strong>
      </button>
      {openSelect === kind ? (
        <div className="order-ledger-options" role="listbox" aria-label={optionLabel}>
          {selectOptions.map((option) => (
            <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => onSelect(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RoomDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="order-ledger-dialog-layer">
      <section className="order-ledger-room-dialog" role="dialog" aria-modal="true" aria-label="选择房间">
        <header>
          <strong>选择房间</strong>
          <button type="button" aria-label="关闭选择房间" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="order-ledger-room-dialog__toolbar">
          <input placeholder="输入房间/房型名称" />
          <button type="button">查 询</button>
        </div>
        <div className="order-ledger-room-tree">
          {['天落大床电竞套间', '观影大床房', '总裁套间（桑拿浴缸露台电竞麻将）'].map((roomType) => (
            <label key={roomType}>
              <input type="checkbox" />
              <span>{roomType}</span>
            </label>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={onClose}>
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}

function OrderDetail({ onClose }: { onClose: () => void }) {
  return (
    <>
      <aside className="order-ledger-drawer" aria-label="订单详情抽屉">
        <header>
          <strong>订单详情</strong>
          <button type="button" className="is-tag">
            全日房
          </button>
          <button type="button" aria-label="关闭订单详情" onClick={onClose}>
            ×
          </button>
        </header>
        <section className="order-ledger-order-card">
          <div>
            <span>路客云聚合</span>
            <strong>渠道单号：10085200031107</strong>
          </div>
          <p>天落大床电竞套间[LPS11GM000](1)</p>
          <small>已退房</small>
          <b>¥ 435</b>
        </section>
        <section className="order-ledger-drawer-block">
          <h3>房费(减佣): ¥369.75</h3>
          <span>订单总收入: ¥435.00</span>
          <table>
            <tbody>
              <tr>
                <th>房间/日期</th>
                <th>2026-05-13</th>
              </tr>
              <tr>
                <td>天落大床电竞套间[LPS11GM000](1)</td>
                <td>369.75</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section className="order-ledger-drawer-block is-list">
          <p>房费收款 <strong>收款金额：¥435</strong> <em>房费欠款：¥0</em></p>
          <p>其他收入/支出 <strong>0项/¥0.00</strong></p>
          <p>押金信息 <strong>押金金额：¥0</strong></p>
          <p>订单欠款 <strong>¥0</strong></p>
        </section>
        <footer>
          <span>房费(减佣): <b>¥369.75</b></span>
          <button type="button">更多操作</button>
          <button type="button" className="is-primary">
            收款
          </button>
        </footer>
      </aside>

      <div className="order-ledger-payment-layer">
        <section className="order-ledger-payment-dialog" role="dialog" aria-modal="true" aria-label="收款款项">
          <header>
            <button type="button" disabled>
              收款款项
            </button>
            <button type="button" className="is-active">
              收款记录
            </button>
            <button type="button" aria-label="关闭收款款项" onClick={onClose}>
              ×
            </button>
          </header>
          <table>
            <thead>
              <tr>
                <th>类型</th>
                <th>房间</th>
                <th>项目</th>
                <th>支付方式</th>
                <th>金额(¥)</th>
                <th>支付单号</th>
                <th>日期</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>收款</td>
                <td>- 未排房</td>
                <td>订单金额</td>
                <td>平台代收</td>
                <td>435.00</td>
                <td>10085200031107</td>
                <td>2026.05.13 11:50</td>
                <td />
                <td>
                  <button type="button">退款</button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </>
  )
}
