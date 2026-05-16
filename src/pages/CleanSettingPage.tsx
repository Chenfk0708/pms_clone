import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './CleanSettingPage.css'

const subscriptionSideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

const smartCleanPrice = '¥1,232.46'
const smartCleanOriginalPrice = '¥2,194.38 / 年'

function CleanUnpaidMask({ onSubscribe }: { onSubscribe: () => void }) {
  return (
    <section className="clean-unpaid-mask" aria-label="智能保洁订阅提示">
      <div className="clean-unpaid-card">
        <div className="clean-unpaid-visual" aria-hidden="true" />
        <div className="clean-unpaid-copy">
          <strong>限时钜惠！智能保洁6折开通</strong>
          <span>自动派单 ｜实时提醒 ｜ 报表清晰</span>
          <button type="button" onClick={onSubscribe}>
            订阅开通
          </button>
        </div>
      </div>
    </section>
  )
}

export function CleanSettingPage() {
  const [activeTab, setActiveTab] = useState<'basic' | 'price'>('basic')
  const [agreed, setAgreed] = useState(false)
  const [scrmAgreed, setScrmAgreed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isPaymentDetail = location.pathname === '/version/applicationPayment/detail'
  const paymentProduct = (location.state as { product?: string } | null)?.product
  const isGlobalRadarPayment = isPaymentDetail && new URLSearchParams(location.search).get('app') === 'globalRadar'
  const isSmartPricingPayment = isPaymentDetail && new URLSearchParams(location.search).get('app') === 'smartPricing'
  const isDouyinPayment = isPaymentDetail && new URLSearchParams(location.search).get('app') === 'douyin'
  const isScrmPayment = isPaymentDetail && paymentProduct === 'scrm'

  if (isGlobalRadarPayment) {
    return (
      <div className="clean-setting-page clean-subscribe-page">
        <section className="clean-subscribe-hero">
          <div className="clean-product-icon">雷</div>
          <div>
            <h2>全域雷达</h2>
            <p>安装数据连接器，打破OTA数据孤岛一屏掌控酒店Ebooking经营数据。</p>
          </div>
        </section>

        <section className="clean-subscribe-card">
          <h3>商品详情</h3>
          <div className="clean-product-detail">
            <div>
              <strong>全域雷达</strong>
              <span>多渠道聚合 ｜ AI预警 ｜ 风险监测 ｜ 全局决策</span>
            </div>
          </div>
        </section>

        <section className="clean-subscribe-card">
          <h3>购买信息</h3>
          <div className="clean-buy-grid">
            <article>
              <span>商品价格</span>
              <strong>¥1,927.68</strong>
              <em>¥3,303.16 / 年</em>
            </article>
            <article>
              <span>购买时长</span>
              <strong>跟随版本</strong>
              <em>2027-09-28 到期</em>
            </article>
            <article>
              <span>订单金额</span>
              <strong>¥1,927.68</strong>
              <em>明细</em>
            </article>
          </div>
          <label className="clean-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            我已阅读并同意《路客云产品服务购买协议》
          </label>
          <div className="clean-subscribe-actions">
            <button type="button" onClick={() => navigate('/channels/globalRadar/globalSetting')}>
              返回
            </button>
            <button type="button" className="is-primary" disabled={!agreed}>
              立即购买
            </button>
          </div>
        </section>
      </div>
    )
  }

  if (isScrmPayment) {
    return (
      <div className="scrm-payment-page">
        <section className="scrm-payment-main">
          <header className="scrm-payment-hero">
            <img src="/scrm-add-batch-assets/brandScrmLogo.png" alt="" aria-hidden="true" />
            <div>
              <h2>企微SCRM</h2>
              <p>利用企业微信高效工具完成入住前、入住中、入住后的全入住流程体验升级，在企业微信中智能接待，高效沟通；</p>
            </div>
          </header>

          <section className="scrm-payment-detail" aria-label="商品详情">
            <h3>商品详情</h3>
            <img src="/scrm-add-batch-assets/brandPromotionScrm1136V2.png" alt="企微SCRM高效获客留存" />
            <img src="/scrm-add-batch-assets/brandPromotionScrm1136-2V2.png" alt="全自动留存用户" />
            <img src="/scrm-add-batch-assets/brandPromotionScrm1136-3V2.png" alt="高效沟通工具" />
          </section>
        </section>

        <aside className="scrm-payment-aside" aria-label="购买信息">
          <h3>购买信息</h3>
          <div className="scrm-payment-price-row">
            <span>商品价格</span>
            <strong>¥150.6</strong>
            <del>¥75,300/年</del>
          </div>
          <div className="scrm-payment-duration-row">
            <span>购买<br />时长</span>
            <div>
              <button type="button">跟随版本2027-09-28到期</button>
              <em>跟随版本2027-09-28到期</em>
            </div>
          </div>
          <div className="scrm-payment-total-row">
            <span>订单金额</span>
            <strong>¥150.6</strong>
            <button type="button">明细 ⓘ</button>
          </div>
          <label className="scrm-payment-agreement">
            <input
              type="checkbox"
              checked={scrmAgreed}
              onChange={(event) => setScrmAgreed(event.target.checked)}
            />
            我已阅读并同意《路客云产品服务购买协议》
          </label>
          <button type="button" className="scrm-payment-buy">
            立即购买
          </button>
        </aside>
      </div>
    )
  }

  if (isDouyinPayment) {
    return (
      <div className="app-payment-detail-page">
        <aside className="app-payment-sidebar" aria-label="订阅中心侧栏">
          <div className="app-payment-sidebar__root">订阅中心</div>
          <nav>
            {subscriptionSideLinks.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `app-payment-link${isActive || item.path === '/version/applicationPayment' ? ' is-active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="app-payment-build">版本号：v4.10.7</span>
        </aside>

        <section className="app-payment-main app-payment-main--product" aria-label="抖音直连购买详情">
          <div className="app-payment-product-column">
            <section className="app-payment-hero app-payment-hero--douyin">
              <div className="app-payment-douyin-icon">抖</div>
              <div>
                <h2>抖音直连</h2>
                <p>开通抖音直连，实现房态、房价、订单管理。</p>
              </div>
            </section>

            <section className="app-payment-card">
              <h3>商品详情</h3>
              <div className="app-payment-douyin-detail">
                <div>
                  <strong>抖音来客</strong>
                  <p>支持抖音来客预售券</p>
                  <p>支持抖音来客日历房</p>
                  <p>支持抖音来客特价酒店</p>
                </div>
                <div className="app-payment-phone-preview" aria-hidden="true">
                  <span>15:43</span>
                  <strong>Hotels 广州榜单</strong>
                  <em>推荐 预订 设施 评价</em>
                </div>
              </div>
            </section>
          </div>

          <aside className="app-payment-purchase-panel" aria-label="购买信息">
            <h3>购买信息</h3>
            <div className="app-payment-purchase-row">
              <span>商品价格</span>
              <strong>¥37,047.6</strong>
              <em>¥37,047.6 / 年</em>
            </div>
            <div className="app-payment-purchase-row app-payment-purchase-row--duration">
              <span>购买<br />时长</span>
              <div>
                <button type="button">跟随版本2027-09-28到期</button>
                <em>跟随版本2027-09-28到期</em>
              </div>
            </div>
            <div className="app-payment-purchase-row">
              <span>订单金额</span>
              <strong className="is-total">¥37,047.6</strong>
              <em>明细 ⓘ</em>
            </div>
            <label className="app-payment-agreement">
              <input type="checkbox" checked={agreed} aria-label="我已阅读并同意《路客云产品服务购买协议》" onChange={(event) => setAgreed(event.target.checked)} />
              我已阅读并同意《路客云产品服务购买协议》
            </label>
            <button type="button" className="app-payment-buy-button" disabled={!agreed}>
              立即购买
            </button>
          </aside>
        </section>
      </div>
    )
  }

  if (isSmartPricingPayment) {
    return (
      <div className="app-payment-detail-page">
        <aside className="app-payment-sidebar" aria-label="订阅中心侧栏">
          <div className="app-payment-sidebar__root">订阅中心</div>
          <nav>
            {subscriptionSideLinks.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `app-payment-link${isActive || item.path === '/version/applicationPayment' ? ' is-active' : ''}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="app-payment-build">版本号：v4.10.7</span>
        </aside>

        <section className="app-payment-main" aria-label="智能调价购买详情">
          <section className="app-payment-hero">
            <div className="app-payment-product-icon">价</div>
            <div>
              <h2>智能调价</h2>
              <p>1. 定时获取竞争圈酒店的房价，与各门店的房价对比后得出比价参考，并提供改价建议 2. 设置中央价动态调价策略，实时根据入住率和可售数提醒客户执行调价策略</p>
            </div>
          </section>

          <section className="app-payment-card">
            <h3>商品详情</h3>
            <div className="app-payment-product-detail">
              <strong>智能调价</strong>
              <span>竞争圈比价、入住率监测、动态调价提醒与中央价策略联动。</span>
            </div>
          </section>

          <section className="app-payment-card">
            <h3>购买信息</h3>
            <div className="app-payment-buy-grid">
              <article>
                <span>商品价格</span>
                <strong>¥1,503</strong>
                <em>¥2,605.2/年</em>
              </article>
              <article>
                <span>购买时长</span>
                <strong>跟随版本</strong>
                <em>2027-09-28到期</em>
              </article>
              <article>
                <span>订单金额</span>
                <strong>¥1,503</strong>
                <em>明细</em>
              </article>
            </div>
            <label className="app-payment-agreement">
              <input type="checkbox" checked={agreed} aria-label="我已阅读并同意《路客云产品服务购买协议》" onChange={(event) => setAgreed(event.target.checked)} />
              我已阅读并同意《路客云产品服务购买协议》
            </label>
            <button type="button" className="app-payment-buy-button" disabled={!agreed}>
              立即购买
            </button>
          </section>
        </section>
      </div>
    )
  }

  if (isPaymentDetail) {
    return (
      <div className="clean-setting-page clean-subscribe-page">
        <section className="clean-subscribe-hero">
          <div className="clean-product-icon">净</div>
          <div>
            <h2>智能保洁</h2>
            <p>适用于酒店、民宿日常的保洁场景，支持自动或手动给保洁员创建任务，统计保洁数据。</p>
          </div>
        </section>

        <section className="clean-subscribe-card">
          <h3>商品详情</h3>
          <div className="clean-product-detail">
            <div>
              <strong>智能保洁</strong>
              <span>自动派单 ｜实时提醒 ｜ 报表清晰</span>
            </div>
          </div>
        </section>

        <section className="clean-subscribe-card">
          <h3>购买信息</h3>
          <div className="clean-buy-grid">
            <article>
              <span>商品价格</span>
              <strong>{smartCleanPrice}</strong>
              <em>{smartCleanOriginalPrice}</em>
            </article>
            <article>
              <span>购买时长</span>
              <strong>跟随版本</strong>
              <em>2027-09-28 到期</em>
            </article>
            <article>
              <span>订单金额</span>
              <strong>{smartCleanPrice}</strong>
              <em>明细</em>
            </article>
          </div>
          <label className="clean-agreement">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(event) => setAgreed(event.target.checked)}
            />
            我已阅读并同意《路客云产品服务购买协议》
          </label>
          <div className="clean-subscribe-actions">
            <button type="button" onClick={() => navigate('/cleanManage/cleanSetting')}>
              返回
            </button>
            <button type="button" className="is-primary" disabled={!agreed}>
              立即购买
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="clean-setting-page">
      <section className="clean-setting-panel">
        <div className="clean-setting-tabs" role="tablist" aria-label="保洁设置类型">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'basic'}
            className={activeTab === 'basic' ? 'is-active' : ''}
            onClick={() => setActiveTab('basic')}
          >
            基础设置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'price'}
            className={activeTab === 'price' ? 'is-active' : ''}
            onClick={() => setActiveTab('price')}
          >
            价格设置
          </button>
        </div>
        <CleanUnpaidMask onSubscribe={() => navigate('/version/applicationPayment/detail')} />
      </section>
    </div>
  )
}
