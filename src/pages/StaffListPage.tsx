import { useState } from 'react'
import './StaffListPage.css'

const scrmLogo = '/scrm-assets/brand-scrm-logo.png'
const promotionImages = [
  {
    src: '/scrm-assets/brand-promotion-scrm-hero.png',
    alt: '企微SCRM高效获客留存',
  },
  {
    src: '/scrm-assets/brand-promotion-scrm-auto.png',
    alt: '企微SCRM全自动留存用户',
  },
  {
    src: '/scrm-assets/brand-promotion-scrm-wechat.png',
    alt: '企微SCRM企业微信沟通转化',
  },
]

export function StaffListPage() {
  const [showPurchase, setShowPurchase] = useState(false)

  if (showPurchase) {
    return <StaffPurchaseDetail onBack={() => setShowPurchase(false)} />
  }

  return (
    <div className="staff-list-page">
      <section className="staff-subscription-card" aria-label="企微员工列表未开通态">
        <header className="staff-subscription-hero">
          <img src={scrmLogo} alt="" aria-hidden="true" />
          <div>
            <h1>企微SCRM-员工管理</h1>
            <p>实时获取企业微信员工，实现员工管理</p>
          </div>
          <div className="staff-subscription-action">
            <button type="button" onClick={() => setShowPurchase(true)}>
              立即开通
            </button>
            <span>限时免费</span>
          </div>
        </header>

        <section className="staff-product-detail" aria-label="商品详情">
          <h2>商品详情</h2>
          <div className="staff-product-images">
            {promotionImages.map((image) => (
              <img key={image.src} src={image.src} alt={image.alt} />
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

function StaffPurchaseDetail({ onBack }: { onBack: () => void }) {
  return (
    <div className="staff-list-page staff-list-page--purchase">
      <section className="staff-purchase-main" aria-label="企微SCRM购买详情">
        <header className="staff-purchase-header">
          <img src={scrmLogo} alt="" aria-hidden="true" />
          <div>
            <h1>企微SCRM</h1>
            <p>利用企业微信高效工具完成入住前、入住中、入住后的全入住流程体验升级，在企业微信中智能接待，高效沟通；</p>
          </div>
          <button type="button" onClick={onBack}>
            返回
          </button>
        </header>

        <section className="staff-product-detail staff-product-detail--purchase" aria-label="商品详情">
          <h2>商品详情</h2>
          <div className="staff-product-images">
            <img src="/scrm-assets/brand-promotion-scrm-hero-v2.png" alt="企微SCRM高效获客留存" />
            <img src="/scrm-assets/brand-promotion-scrm-auto-v2.png" alt="企微SCRM全自动留存用户" />
            <img src="/scrm-assets/brand-promotion-scrm-wechat-v2.png" alt="企微SCRM企业微信沟通转化" />
          </div>
        </section>
      </section>

      <aside className="staff-purchase-sidebar" aria-label="购买信息">
        <h2>购买信息</h2>
        <dl>
          <div>
            <dt>商品价格</dt>
            <dd>
              <strong>¥150.6</strong>
              <span>¥75,300 /年</span>
            </dd>
          </div>
          <div>
            <dt>购买时长</dt>
            <dd>
              <button type="button">跟随版本2027-09-28到期</button>
              <button type="button">跟随版本2027-09-28到期</button>
            </dd>
          </div>
          <div>
            <dt>订单金额</dt>
            <dd>
              <strong className="staff-purchase-price">¥150.6</strong>
              <span>明细 ⓘ</span>
            </dd>
          </div>
        </dl>
        <label className="staff-purchase-agreement">
          <input type="checkbox" defaultChecked />
          <span>我已阅读并同意《路客云产品服务购买协议》</span>
        </label>
        <button type="button" className="staff-purchase-submit">
          立即购买
        </button>
      </aside>
    </div>
  )
}
