import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './LocalsMallPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

const systemProducts = [
  {
    name: '门卡管理系统',
    price: '￥800',
    image:
      'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0017687596945558.png',
  },
]

const hardwareProducts = [
  {
    name: '蜂助手CPE路由器P5(5G门店版)',
    price: '￥1643',
    image:
      'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/Frlt8ag-VDbNxOh89eJ1VdLMUa89.png',
  },
  {
    name: '蜂助手CPE路由器S1(4G版)',
    price: '￥896',
    image:
      'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/Fj94TEpC_LcsFp5VvAjmtvNZxsEu.jpg',
  },
  {
    name: '蜂助手4G盒子S2(极光TV版)',
    price: '￥1195',
    image:
      'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/FrJO5s4hR7Rv7WZizAXeUrsVDW6j.jpg',
  },
  {
    name: '蜂助手随身UiFi U1',
    price: '￥341',
    image:
      'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/FoqI8nd05yB3budBt9VZt9BI8NGw.png',
  },
  {
    name: '指定款【智能密码锁/门锁】',
    price: '￥998',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/zdkms.webp',
  },
  {
    name: '无人入住智能门锁智能入住 D12',
    price: '￥299',
    image: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/wrrzms.webp',
  },
]

const doorCardImage = 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0017687596945558.png'

export function LocalsMallPage() {
  const location = useLocation()

  return (
    <div className="locals-mall-page">
      <aside className="locals-mall-sidebar" aria-label="订阅中心侧栏">
        <div className="locals-mall-sidebar__root">订阅中心</div>
        <nav aria-label="权益与订阅侧栏">
          {sideLinks.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `locals-mall-link${isActive ? ' is-active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <span className="locals-mall-build">版本号：v4.10.7</span>
      </aside>

      {location.pathname.endsWith('/detail') ? <LocalsMallDetail /> : <LocalsMallCatalog />}
    </div>
  )
}

function LocalsMallCatalog() {
  return (
    <main className="locals-mall-main">
      <h1 className="sr-only-heading">路客商城</h1>
      <ProductSection title="系统功能" products={systemProducts} columns="single" />
      <ProductSection title="智能硬件" products={hardwareProducts} columns="grid" />
    </main>
  )
}

function ProductSection({
  title,
  products,
  columns,
}: {
  title: string
  products: typeof systemProducts
  columns: 'single' | 'grid'
}) {
  return (
    <section className="locals-mall-section" aria-label={title}>
      <h2>{title}</h2>
      <div className={`locals-mall-products locals-mall-products--${columns}`}>
        {products.map((product) => (
          <ProductCard key={product.name} product={product} />
        ))}
      </div>
    </section>
  )
}

function ProductCard({ product }: { product: (typeof hardwareProducts)[number] }) {
  const navigate = useNavigate()

  return (
    <article className="locals-mall-card">
      <img className="locals-mall-thumb" src={product.image} alt="" />
      <div className="locals-mall-card__body">
        <h3>{product.name}</h3>
        <strong>{product.price}</strong>
      </div>
      <button type="button" onClick={() => navigate('/version/localsMall/detail')}>
        立即购买
      </button>
    </article>
  )
}

function LocalsMallDetail() {
  const navigate = useNavigate()

  return (
    <main className="locals-mall-main locals-mall-main--detail">
      <h1 className="sr-only-heading">路客商城详情</h1>
      <div className="locals-mall-crumb">
        <button type="button" onClick={() => navigate('/version/localsMall')}>
          路客商城/
        </button>
        <span>详情</span>
      </div>
      <img className="locals-mall-detail-hero" src={doorCardImage} alt="" aria-label="门卡管理系统产品图" />
      <section className="locals-mall-purchase" aria-label="购买信息">
        <div className="locals-mall-purchase-row">
          <span>购买时长</span>
          <button type="button">一年</button>
        </div>
        <div className="locals-mall-purchase-row">
          <span>购买方</span>
          <strong>路客云6TS5</strong>
        </div>
        <div className="locals-mall-purchase-row">
          <span>总费用</span>
          <strong>¥ 800</strong>
        </div>
        <div className="locals-mall-purchase-line" />
        <label className="locals-mall-agreement">
          <input type="checkbox" checked readOnly aria-label="我已经阅读同意《路客云产品服务购买协议》" />
          我已经阅读同意
          <a href="/version/localsMall/detail" onClick={(event) => event.preventDefault()}>
            《路客云产品服务购买协议》
          </a>
        </label>
        <button type="button" className="locals-mall-buy">
          立即购买
        </button>
      </section>
    </main>
  )
}
