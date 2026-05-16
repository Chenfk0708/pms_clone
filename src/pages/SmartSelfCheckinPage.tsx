import { useState } from 'react'
import './SmartSelfCheckinPage.css'

interface CheckinPlan {
  title: string
  description: string
  message: string
  badge?: '推荐' | '未开通'
}

const plans: CheckinPlan[] = [
  {
    title: '仅发送门锁密码(直接入住)',
    description: '房客通过短信查看门锁密码，直接入住。',
    message: '【路客云】您入住的房间 {房源名称} ${房间号}，门锁密码：{密码}#;点击 minsubao.net/{小程序跳转短链接} 查看入住指引',
  },
  {
    title: '短信+智住小程序(自助登记)',
    badge: '推荐',
    description: '房客自行完成入住登记并获取门锁密码。',
    message: '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 登记入住，获取门锁密码。',
  },
  {
    title: '短信+企微客服(人工接待)',
    badge: '未开通',
    description: '引导房客添加企微，由客服进行接待。',
    message: '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 添加企微，进行登记入住，获取入住指引与门锁密码。',
  },
  {
    title: '短信+公众号(自助登记)',
    badge: '未开通',
    description: '引导房客进入酒店公众号进行咨询。',
    message: '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 关注微信公众号进行登记入住，获取门锁密码。',
  },
]

export function SmartSelfCheckinPage() {
  const [enabled, setEnabled] = useState(true)
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false)

  return (
    <div className="smart-checkin-page">
      <section className="smart-checkin-panel" aria-label="云端入住登记配置">
        <header className="smart-checkin-head">
          <div>
            <h1>云端入住登记</h1>
            <p>房客在到店前，通过短信完成入住相关操作</p>
          </div>
          <button
            type="button"
            aria-label="云端入住登记开关"
            aria-pressed={enabled}
            className={`smart-checkin-switch${enabled ? ' is-on' : ''}`}
            onClick={() => setEnabled((current) => !current)}
          >
            <span />
          </button>
        </header>

        <div className="smart-checkin-plans" aria-label="云端入住登记方式">
          {plans.map((plan) => (
            <article key={plan.title} className="smart-checkin-plan">
              <header>
                <h2>{plan.title}</h2>
                {plan.badge === '推荐' ? <span className="smart-checkin-badge is-recommended">推荐</span> : null}
                {plan.badge === '未开通' ? (
                  <button
                    type="button"
                    className="smart-checkin-badge is-locked"
                    onClick={() => setShowPurchaseDialog(true)}
                  >
                    未开通
                  </button>
                ) : null}
              </header>
              <p>{plan.description}</p>
              <div className="smart-checkin-message">{plan.message}</div>
            </article>
          ))}
        </div>

        <section className="smart-checkin-flow" aria-labelledby="smart-checkin-flow-title">
          <div className="smart-checkin-section-head">
            <h2 id="smart-checkin-flow-title">场景流程</h2>
            <button type="button">编辑短信内容</button>
          </div>
          <div className="smart-checkin-flow__steps">
            <div className="smart-checkin-step">
              <strong>1</strong>
              <span>接收短信</span>
            </div>
            <div className="smart-checkin-flow__line" />
            <div className="smart-checkin-step">
              <strong>2</strong>
              <span>查看门锁密码</span>
            </div>
          </div>
        </section>
      </section>

      <section className="smart-checkin-card smart-checkin-card--scan">
        <div>
          <h2>前台数字化（扫码）</h2>
          <p>房客到店后，扫描前台二维码，进入智住小程序，完成入住操作</p>
        </div>
        <button type="button">下载二维码</button>
      </section>

      <section className="smart-checkin-card smart-checkin-card--kiosk">
        <div>
          <h2>自助机入住</h2>
          <p>房客到店后，通过自助机完成入住操作</p>
        </div>
        <button type="button">联系智慧酒店专家</button>
      </section>

      {showPurchaseDialog ? <PurchaseDialog onClose={() => setShowPurchaseDialog(false)} /> : null}
    </div>
  )
}

function PurchaseDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="smart-checkin-modal-backdrop">
      <div className="smart-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="smart-checkin-purchase-title">
        <header>
          <h2 id="smart-checkin-purchase-title">付费购买</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-checkin-modal__body">此功能需要付费使用，请前往购买</div>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={onClose}>
            确 定
          </button>
        </footer>
      </div>
    </div>
  )
}
