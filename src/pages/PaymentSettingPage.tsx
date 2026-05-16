import { useState } from 'react'
import './PaymentSettingPage.css'

const enabledPaymentMethods = [
  '平台代收',
  '微信',
  '支付宝',
  '其他',
  '现金',
  '银行转帐',
  '信用卡',
  '通联',
  '储值金',
  '暂未收款',
  '现场收款',
]

export function PaymentSettingPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="payment-setting-page">
      <section className="payment-setting-panel" aria-label="支付方式设置">
        <div className="payment-setting-notice" role="note">
          <span aria-hidden="true">!</span>
          系统默认支付方式不支持编辑和删除，可直接拖动调整排序。
        </div>

        <div className="payment-setting-heading-row">
          <SectionHeading>已启用支付方式</SectionHeading>
          <button type="button" className="payment-setting-primary" onClick={() => setDialogOpen(true)}>
            新增
          </button>
        </div>

        <div className="payment-setting-grid" aria-label="已启用支付方式列表">
          {enabledPaymentMethods.map((method) => (
            <PaymentMethodCard key={method} name={method} />
          ))}
        </div>

        <div className="payment-setting-divider" />

        <SectionHeading>已停用支付方式</SectionHeading>
        <div className="payment-setting-disabled" aria-label="已停用支付方式列表" />
      </section>

      {dialogOpen ? <AddPaymentDialog onClose={() => setDialogOpen(false)} /> : null}
    </div>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="payment-setting-title">
      <span aria-hidden="true" />
      {children}
    </h2>
  )
}

function PaymentMethodCard({ name }: { name: string }) {
  return (
    <article className="payment-method-card">
      <span className="payment-method-card__drag" aria-hidden="true">
        ⠿
      </span>
      <strong>{name}</strong>
      <span className="payment-method-card__badge">默认</span>
    </article>
  )
}

function AddPaymentDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="payment-setting-modal-backdrop">
      <section className="payment-setting-modal" role="dialog" aria-modal="true" aria-label="新增支付方式">
        <header>
          <h2>新增支付方式</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            x
          </button>
        </header>
        <form>
          <label className="payment-setting-form-row">
            <span>
              <em>*</em>
              名称
            </span>
            <input type="text" aria-label="支付方式名称" />
          </label>
          <label className="payment-setting-form-row">
            <span>状态</span>
            <button type="button" className="payment-setting-select">
              启用
              <i aria-hidden="true">⌄</i>
            </button>
          </label>
        </form>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="payment-setting-primary" onClick={onClose}>
            保存
          </button>
        </footer>
      </section>
    </div>
  )
}
