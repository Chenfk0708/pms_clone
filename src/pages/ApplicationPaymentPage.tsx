import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import './ApplicationPaymentPage.css'

type SubscriptionCategory = 'all' | 'channel' | 'feature'

type SubscriptionProduct = {
  name: string
  price: string
  oldPrice?: string
  description: string
  tag: string
  status?: string
  action: 'use' | 'subscribe' | 'expect'
  category: Exclude<SubscriptionCategory, 'all'>
  icon: string
  tone: string
  app?: string
}

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

const products: SubscriptionProduct[] = [
  {
    name: '携程直连',
    price: '¥899/年',
    oldPrice: '¥1599/年',
    description: '开通携程直连，实现房态、房价、订单管理。',
    tag: '酒店渠道',
    action: 'use',
    category: 'channel',
    icon: '携',
    tone: 'ctrip',
  },
  {
    name: '美团酒店直连',
    price: '¥899/年',
    oldPrice: '¥1599/年',
    description: '开通美团酒店直连，实现房态、房价、订单管理。',
    tag: '酒店渠道',
    action: 'use',
    category: 'channel',
    icon: '美',
    tone: 'meituan',
  },
  {
    name: '飞猪直连',
    price: '¥899/年',
    oldPrice: '¥1599/年',
    description: '开通飞猪直连，实现房态、房价、订单管理。',
    tag: '酒店渠道',
    action: 'use',
    category: 'channel',
    icon: '飞',
    tone: 'fliggy',
  },
  {
    name: '抖音直连',
    price: '¥899/年',
    oldPrice: '¥1899/年',
    description: '开通抖音直连，实现房态、房价、订单管理。',
    tag: '社媒渠道',
    status: '限时体验中',
    action: 'subscribe',
    category: 'channel',
    icon: '抖',
    tone: 'douyin',
    app: 'douyin',
  },
  {
    name: '小红书',
    price: '¥899/年',
    oldPrice: '¥1899/年',
    description: '开通小红书直连，实现房态、房价、订单管理。',
    tag: '社媒渠道',
    action: 'subscribe',
    category: 'channel',
    icon: '红',
    tone: 'redbook',
  },
  {
    name: '品牌小程序',
    price: '¥899/年',
    oldPrice: '¥1899/年',
    description: '自有品牌小程序，一键上房，高效管理，私域成单。',
    tag: '私域渠道',
    action: 'subscribe',
    category: 'channel',
    icon: '小',
    tone: 'miniapp',
  },
  {
    name: '视频号直连',
    price: '¥899/年',
    oldPrice: '¥1899/年',
    description: '直连视频号上架酒店套餐，高效转化私域流量。',
    tag: '社媒渠道',
    action: 'subscribe',
    category: 'channel',
    icon: '视',
    tone: 'video',
  },
  {
    name: 'Booking',
    price: '¥1399/年',
    oldPrice: '¥1899/年',
    description: '开通Booking直连，实现房态、房价、订单管理。',
    tag: '国际渠道',
    status: '限时体验中',
    action: 'subscribe',
    category: 'channel',
    icon: 'B.',
    tone: 'booking',
  },
  {
    name: '美团民宿直连',
    price: '免费',
    description: '开通美团民宿直连，实现房态、房价、订单管理。',
    tag: '民宿渠道',
    action: 'use',
    category: 'channel',
    icon: '民',
    tone: 'meituan',
  },
  {
    name: '途家直连',
    price: '免费',
    description: '开通途家直连，实现房态、房价、订单管理。',
    tag: '民宿渠道',
    action: 'use',
    category: 'channel',
    icon: '途',
    tone: 'tujia',
  },
  {
    name: '木鸟直连',
    price: '免费',
    description: '开通木鸟直连，实现房态、房价、订单管理。',
    tag: '民宿渠道',
    action: 'use',
    category: 'channel',
    icon: '木',
    tone: 'muniao',
  },
  {
    name: '小猪直连',
    price: '免费',
    description: '开通小猪直连，实现房态、房价、订单管理。',
    tag: '民宿渠道',
    action: 'use',
    category: 'channel',
    icon: '猪',
    tone: 'xiaozhu',
  },
  {
    name: '智能调价',
    price: '¥1099/年',
    oldPrice: '¥1899/年',
    description: '定时获取竞争圈酒店的房价，并根据入住率和可售数提醒客户执行调价策略。',
    tag: '功能订阅',
    action: 'subscribe',
    category: 'feature',
    icon: '价',
    tone: 'price',
    app: 'smartPricing',
  },
  {
    name: '企微SCRM',
    price: '¥899/年',
    oldPrice: '¥1499/年',
    description: '利用企业微信高效工具完成入住前、入住中、入住后的全流程体验升级。',
    tag: '功能订阅',
    action: 'subscribe',
    category: 'feature',
    icon: '企',
    tone: 'scrm',
  },
  {
    name: '全域雷达',
    price: '¥1399/年',
    oldPrice: '¥2399/年',
    description: '安装数据连接器，打破OTA数据孤岛一屏掌控酒店Ebooking经营数据。',
    tag: '功能订阅',
    action: 'subscribe',
    category: 'feature',
    icon: '雷',
    tone: 'radar',
    app: 'globalRadar',
  },
  {
    name: '智能保洁',
    price: '¥899/年',
    oldPrice: '¥1599/年',
    description: '支持自动或手动给保洁员创建任务，统计保洁数据。',
    tag: '功能订阅',
    action: 'subscribe',
    category: 'feature',
    icon: '洁',
    tone: 'clean',
  },
  {
    name: '电子房价牌',
    price: '¥499/年',
    oldPrice: '¥899/年',
    description: '外接前台大屏实时展示当前房型价格，联动路客云改价。',
    tag: '功能订阅',
    action: 'subscribe',
    category: 'feature',
    icon: '牌',
    tone: 'board',
  },
  {
    name: '聚合分销',
    price: '¥599/年',
    oldPrice: '¥999/年',
    description: '聚合十大分销渠道，一键上房至渠道快速售卖。',
    tag: '功能订阅',
    status: '限时免费',
    action: 'use',
    category: 'feature',
    icon: '分',
    tone: 'distribution',
  },
  {
    name: '线上付款',
    price: '¥499/年',
    oldPrice: '¥899/年',
    description: '支持外接扫码枪、小白盒，快捷支付，实时流水记录，一键退款。',
    tag: '功能订阅',
    action: 'use',
    category: 'feature',
    icon: '付',
    tone: 'pay',
  },
  {
    name: '旅业系统直连',
    price: '¥999/年',
    oldPrice: '¥1665/年',
    description: '身份登记直接上传公安系统，入住、退房、续住一键同步。',
    tag: '功能订阅',
    action: 'expect',
    category: 'feature',
    icon: '旅',
    tone: 'police',
  },
]

const filters: { label: string; value: SubscriptionCategory }[] = [
  { label: '全部', value: 'all' },
  { label: '渠道直连', value: 'channel' },
  { label: '功能订阅', value: 'feature' },
]

export function ApplicationPaymentPage() {
  const [activeFilter, setActiveFilter] = useState<SubscriptionCategory>('all')
  const navigate = useNavigate()
  const visibleProducts =
    activeFilter === 'all' ? products : products.filter((product) => product.category === activeFilter)
  const channelProducts = visibleProducts.filter((product) => product.category === 'channel')
  const featureProducts = visibleProducts.filter((product) => product.category === 'feature')

  function openSubscription(product: SubscriptionProduct) {
    if (product.app === 'smartPricing') {
      navigate('/version/applicationPayment/detail?app=smartPricing')
      return
    }
    if (product.app === 'globalRadar') {
      navigate('/version/applicationPayment/detail?app=globalRadar')
      return
    }
    if (product.app === 'douyin') {
      navigate('/version/applicationPayment/detail?app=douyin')
      return
    }
    navigate('/version/applicationPayment/detail')
  }

  return (
    <div className="application-payment-page">
      <aside className="application-payment-sidebar" aria-label="应用订阅侧栏">
        <div className="application-payment-sidebar__root">订阅中心</div>
        <nav aria-label="应用订阅侧栏">
          {sideLinks.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `application-payment-side-link${isActive ? ' is-active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <span className="application-payment-build">版本号：v4.10.7</span>
      </aside>

      <main className="application-payment-main" aria-label="应用订阅页面">
        <div className="application-payment-tabs" role="tablist" aria-label="应用订阅分类">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.value}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {channelProducts.length > 0 ? (
          <ProductSection title="渠道直连" products={channelProducts} onSubscribe={openSubscription} />
        ) : null}
        {featureProducts.length > 0 ? (
          <ProductSection title="功能订阅" products={featureProducts} onSubscribe={openSubscription} />
        ) : null}
      </main>
    </div>
  )
}

function ProductSection({
  title,
  products,
  onSubscribe,
}: {
  title: string
  products: SubscriptionProduct[]
  onSubscribe: (product: SubscriptionProduct) => void
}) {
  return (
    <section className="application-payment-section" aria-label={title}>
      <h2>{title}</h2>
      <div className="application-payment-grid">
        {products.map((product) => (
          <article key={product.name} className="application-payment-card">
            <div className={`application-payment-icon application-payment-icon--${product.tone}`} aria-hidden="true">
              {product.icon}
            </div>
            <div className="application-payment-card__body">
              <header>
                <h3>{product.name}</h3>
                {product.status ? <span className="application-payment-status">{product.status}</span> : null}
              </header>
              <p className="application-payment-price">
                <strong>{product.price}</strong>
                {product.oldPrice ? <del>{product.oldPrice}</del> : null}
              </p>
              <p className="application-payment-desc">{product.description}</p>
            </div>
            <footer>
              <span className={`application-payment-tag application-payment-tag--${product.category}`}>{product.tag}</span>
              {product.action === 'expect' ? (
                <button type="button" disabled>
                  敬请期待
                </button>
              ) : product.action === 'use' ? (
                <button type="button" className="is-secondary">
                  去使用
                </button>
              ) : (
                <button type="button" aria-label={`${product.name} 订阅开通`} onClick={() => onSubscribe(product)}>
                  订阅开通
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
    </section>
  )
}
