import { useState } from 'react'
import './AutoStrategySettingPage.css'

type StrategyTab = 'order' | 'room' | 'stock'
type OrderTimeoutAction = 'none' | 'approve' | 'reject'
type CancelAction = 'approve' | 'reject'

const tabs: Array<{ id: StrategyTab; label: string }> = [
  { id: 'order', label: '接单规则' },
  { id: 'room', label: '房态自动化' },
  { id: 'stock', label: '库存占用规则' },
]

export function AutoStrategySettingPage() {
  const [activeTab, setActiveTab] = useState<StrategyTab>('order')
  const [orderAction, setOrderAction] = useState<OrderTimeoutAction>('none')
  const [checkoutEnabled, setCheckoutEnabled] = useState(true)
  const [cancelAction, setCancelAction] = useState<CancelAction>('reject')
  const [status, setStatus] = useState('')

  function updateCheckout() {
    setCheckoutEnabled((enabled) => !enabled)
    setStatus('修改成功')
  }

  return (
    <div className="auto-strategy-page">
      <h1 className="auto-strategy-sr-title">自动策略设置</h1>

      <div className="auto-strategy-tabs" role="tablist" aria-label="自动策略设置">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? 'is-active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="auto-strategy-panel">
        {activeTab === 'order' ? (
          <OrderRules
            orderAction={orderAction}
            setOrderAction={setOrderAction}
            checkoutEnabled={checkoutEnabled}
            updateCheckout={updateCheckout}
            cancelAction={cancelAction}
            setCancelAction={setCancelAction}
          />
        ) : null}
        {activeTab === 'room' ? <RoomAutomationRules /> : null}
        {activeTab === 'stock' ? <StockRules /> : null}
      </div>

      {status ? <div className="auto-strategy-toast" role="status">{status}</div> : null}
    </div>
  )
}

function OrderRules({
  orderAction,
  setOrderAction,
  checkoutEnabled,
  updateCheckout,
  cancelAction,
  setCancelAction,
}: {
  orderAction: OrderTimeoutAction
  setOrderAction: (action: OrderTimeoutAction) => void
  checkoutEnabled: boolean
  updateCheckout: () => void
  cancelAction: CancelAction
  setCancelAction: (action: CancelAction) => void
}) {
  return (
    <>
      <section className="auto-rule-card" role="region" aria-label="住宿订单接单规则">
        <h2>住宿订单接单规则</h2>
        <p>设置后，待处理订单过期前5分钟，系统会按照您的设定自动处理订单</p>
        <div className="auto-rule-options">
          <RadioOption
            name="order-timeout-action"
            label="不操作"
            checked={orderAction === 'none'}
            onChange={() => setOrderAction('none')}
          />
          <RadioOption
            name="order-timeout-action"
            label="逾期前自动同意"
            checked={orderAction === 'approve'}
            onChange={() => setOrderAction('approve')}
          />
          <RadioOption
            name="order-timeout-action"
            label="逾期前自动拒绝"
            checked={orderAction === 'reject'}
            onChange={() => setOrderAction('reject')}
          />
        </div>
      </section>

      <section className="auto-rule-card auto-rule-card--switch" role="region" aria-label="飞猪自动结账">
        <div>
          <h2>飞猪自动结账</h2>
          <p>开启设置后，客人离店当日自动发起结账</p>
        </div>
        <div className="auto-rule-switch-line">
          <span>信用住自动结账</span>
          <button
            type="button"
            role="switch"
            aria-label="信用住自动结账"
            aria-checked={checkoutEnabled}
            className={`auto-rule-switch${checkoutEnabled ? ' is-on' : ''}`}
            onClick={updateCheckout}
          >
            <span />
          </button>
        </div>
      </section>

      <section className="auto-rule-card" role="region" aria-label="携程规则外取消订单设置">
        <h2>携程规则外取消订单设置</h2>
        <p>超过25分钟后未确认，将自动按设置处理</p>
        <div className="auto-rule-options">
          <RadioOption
            name="cancel-action"
            label="同意取消"
            checked={cancelAction === 'approve'}
            onChange={() => setCancelAction('approve')}
          />
          <RadioOption
            name="cancel-action"
            label="不同意取消"
            checked={cancelAction === 'reject'}
            onChange={() => setCancelAction('reject')}
          />
        </div>
      </section>
    </>
  )
}

function RoomAutomationRules() {
  return (
    <section className="auto-rule-card auto-rule-card--room" role="region" aria-label="房态自动化策略">
      <h2>房态自动化策略</h2>
      <p>开启后，系统会在订单、房态和清洁任务发生变化时自动同步相关状态。</p>
      <div className="auto-rule-list">
        <ToggleRow title="入住中订单换房后自动创建" detail="换房完成后，自动为新房间创建待清洁任务" enabled={false} />
        <ToggleRow title="退房后自动创建保洁任务" detail="订单办理退房后，自动生成保洁任务并释放后续流程" enabled={false} />
        <ToggleRow title="订单取消后自动恢复房态" detail="取消订单后恢复可售库存，避免手工遗漏" enabled={false} />
      </div>
    </section>
  )
}

function StockRules() {
  return (
    <section className="auto-rule-card auto-rule-card--stock" role="region" aria-label="库存占用规则">
      <h2>库存占用规则</h2>
      <p>用于控制不同订单状态是否占用房型库存，确保渠道库存与 PMS 房态保持一致。</p>
      <div className="auto-stock-grid" role="table" aria-label="库存占用规则表">
        <div role="row" className="auto-stock-grid__head">
          <span role="columnheader">订单状态</span>
          <span role="columnheader">是否占用库存</span>
          <span role="columnheader">说明</span>
        </div>
        <StockRow status="待处理订单" checked detail="渠道已推送但尚未确认，默认占用库存" />
        <StockRow status="待入住订单" checked detail="确认后持续占用对应房型库存" />
        <StockRow status="已取消订单" checked={false} detail="取消后不继续占用库存" />
      </div>
    </section>
  )
}

function ToggleRow({ title, detail, enabled }: { title: string; detail: string; enabled: boolean }) {
  const [checked, setChecked] = useState(enabled)

  return (
    <div className="auto-rule-list__item">
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-label={title}
        aria-checked={checked}
        className={`auto-rule-switch${checked ? ' is-on' : ''}`}
        onClick={() => setChecked((value) => !value)}
      >
        <span />
      </button>
    </div>
  )
}

function StockRow({ status, checked, detail }: { status: string; checked: boolean; detail: string }) {
  return (
    <div role="row" className="auto-stock-grid__row">
      <span role="cell">{status}</span>
      <span role="cell">
        <input type="checkbox" aria-label={`${status}占用库存`} checked={checked} readOnly />
      </span>
      <span role="cell">{detail}</span>
    </div>
  )
}

function RadioOption({
  name,
  label,
  checked,
  onChange,
}: {
  name: string
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="auto-rule-radio">
      <input type="radio" name={name} aria-label={label} checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  )
}
