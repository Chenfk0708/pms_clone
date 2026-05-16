import { type ReactNode, useState } from 'react'
import { Link } from 'react-router-dom'
import './BrandWebsitePage.css'

type BrandSection =
  | 'templates'
  | 'store'
  | 'profile'
  | 'coupon'
  | 'navigation'
  | 'float'
  | 'popup'
  | 'style'

const pageNavGroups: Array<{ title?: string; items: Array<{ key: BrandSection; label: string }> }> = [
  { items: [{ key: 'templates', label: '模板市场' }] },
  {
    title: '系统页面',
    items: [
      { key: 'store', label: '店铺主页' },
      { key: 'profile', label: '个人中心' },
      { key: 'coupon', label: '领券活动' },
    ],
  },
  {
    title: '通用组件',
    items: [
      { key: 'navigation', label: '通用导航' },
      { key: 'float', label: '悬浮框' },
      { key: 'popup', label: '首页弹窗' },
    ],
  },
  { items: [{ key: 'style', label: '全局风格' }] },
]

const templateImages = {
  campHome: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0469557016661888.png',
  hotelHome: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/6610922389666490.png',
  homestayHome: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/4103834076457345.png',
  defaultHome: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/9688575736882047.png',
  profile: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0386037526210836.png',
  store: 'https://dimg04.c-ctrip.com/images/27c0812000na9jbqk7A54_R_640_428_Q50.jpg',
}

const templates = [
  {
    title: '露营地主题模板',
    home: templateImages.campHome,
    colors: ['#ee5263', '#7c8a83', '#e75264'],
  },
  {
    title: '酒店主题模板',
    home: templateImages.hotelHome,
    colors: ['#f05767', '#78877f', '#dc4d61'],
  },
  {
    title: '民宿主题模板',
    home: templateImages.homestayHome,
    colors: ['#ef5363', '#7b887f', '#e24f63'],
  },
  {
    title: '默认模板',
    home: templateImages.defaultHome,
    colors: ['#eb5363', '#76867e', '#dc4e60'],
  },
]

function MiniTop({ title }: { title: string }) {
  return (
    <div className="brand-phone__top">
      <span>▮▮⌁</span>
      <strong>{title}</strong>
      <span className="brand-phone__capsule">••  ◉</span>
    </div>
  )
}

function TemplatePhone({ src, label }: { src: string; label: string }) {
  return (
    <figure className="brand-template-phone">
      <div className="brand-template-phone__image">
        <img src={src} alt={`${label}预览`} />
        <span>预览</span>
      </div>
      <figcaption>{label}</figcaption>
    </figure>
  )
}

function TemplateMarket() {
  return (
    <div className="brand-template-market">
      {templates.map((template) => (
        <section key={template.title} className="brand-template">
          <div className="brand-template__head">
            <h2>{template.title}</h2>
            <button type="button">一键使用</button>
          </div>
          <div className="brand-template__colors">
            <strong>颜色选择</strong>
            {template.colors.map((color) => (
              <span
                key={`${template.title}-${color}`}
                className="brand-template__swatch"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="brand-template__phones">
            <TemplatePhone src={template.home} label="首页" />
            <TemplatePhone src={templateImages.profile} label="个人中心" />
          </div>
        </section>
      ))}
    </div>
  )
}

function StorePreview() {
  return (
    <div className="brand-phone brand-phone--home">
      <MiniTop title="首页" />
      <div className="brand-hero">
        <div className="brand-hero__logo">LOCALS</div>
        <div className="brand-hero__cn">路 客 云</div>
      </div>
      <div className="brand-search-card">
        <div className="brand-search-card__row">
          <span>输入关键词搜索</span>
          <em>全国</em>
        </div>
        <div className="brand-date-row">
          <div>
            <small>周三入住</small>
            <strong>09月14日</strong>
          </div>
          <span>共1晚</span>
          <div>
            <small>周四退房</small>
            <strong>09月15日</strong>
          </div>
        </div>
        <button type="button">搜索</button>
      </div>
      <PhoneSectionTitle title="热门套餐" />
      <PhoneSectionTitle title="品牌门店" />
      <img className="brand-store-image" src={templateImages.store} alt="品牌门店" />
    </div>
  )
}

function PhoneSectionTitle({ title }: { title: string }) {
  return (
    <div className="brand-phone-title">
      <strong>{title}</strong>
      <span>查看更多 &gt;</span>
    </div>
  )
}

function ProfilePreview() {
  const orderItems = ['待支付', '待入住', '已完成', '已取消']
  const listItems = ['微商城订单', '我的优惠券', '分销钱包', '分销', '服务资质', '联系我们', '退出登录']
  return (
    <div className="brand-phone brand-phone--profile">
      <MiniTop title="个人中心" />
      <div className="brand-user">
        <span>♙</span>
        <strong>用户昵称</strong>
      </div>
      <section className="brand-order-card">
        <header>
          <strong>我的订单</strong>
          <span>全部订单 〉</span>
        </header>
        <div className="brand-order-icons">
          {orderItems.map((item) => (
            <div key={item}>
              <span>▰</span>
              <small>{item}<em>1</em></small>
            </div>
          ))}
        </div>
      </section>
      <div className="brand-profile-list">
        {listItems.map((item, index) => (
          <div key={item}>
            <span>{item}</span>
            {index === 0 ? <em>1</em> : null}
            <b>〉</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="brand-detail-panel">
      <h2>{title}</h2>
      <div className="brand-detail-panel__line" />
      {children}
    </aside>
  )
}

function StoreEditor({ type }: { type: 'store' | 'profile' }) {
  return (
    <div className="brand-editor-state">
      <div className="brand-phone-stage">{type === 'store' ? <StorePreview /> : <ProfilePreview />}</div>
      <DetailPanel title={type === 'store' ? '店铺主页' : '个人中心'}>
        <div className="brand-store-row">
          <span>路客云6TS5的店铺</span>
          <button type="button">前往装修</button>
        </div>
      </DetailPanel>
    </div>
  )
}

function CouponState() {
  return (
    <div className="brand-management-state">
      <form className="brand-coupon-filter" aria-label="领券活动筛选">
        <label>
          <span>活动页面名称:</span>
          <input placeholder="请输入领券活动名称" />
        </label>
        <label>
          <span>状态:</span>
          <button type="button">全部⌄</button>
        </label>
        <label>
          <span>活动时间:</span>
          <input placeholder="开始…  →  结束…" />
        </label>
        <button type="button">重置</button>
        <button type="button" className="brand-primary-button">
          搜索
        </button>
      </form>
      <div className="brand-table-toolbar">
        <button type="button" className="brand-primary-button">
          新建活动
        </button>
        <span>↻</span>
        <span>↧</span>
        <span>⚙</span>
      </div>
      <div className="brand-empty-table" aria-label="领券活动表格">
        <div className="brand-empty-table__head">
          {['活动页面名称', '状态', '活动时间', '微信访客数/浏览数', '抖音访客数/浏览数', '小红书访客数/浏览数', '主图', '操作'].map(
            (column) => (
              <span key={column}>{column}</span>
            ),
          )}
        </div>
        <div className="brand-empty">▱<span>暂无数据</span></div>
      </div>
    </div>
  )
}

function EmptyPhone({ dim = false }: { dim?: boolean }) {
  return (
    <div className={`brand-phone brand-phone--empty${dim ? ' is-dimmed' : ''}`}>
      <MiniTop title="" />
    </div>
  )
}

function NavigationState() {
  return (
    <div className="brand-editor-state">
      <div className="brand-warning">● 品牌小程序暂未开通，请尽快开通。 <button type="button">前往开通</button><button type="button">知道了</button></div>
      <div className="brand-phone-stage brand-phone-stage--settings">
        <EmptyPhone />
        <div className="brand-bottom-nav">
          <span>⌂<b>首页</b></span>
          <span>▱<b>联系房东</b></span>
          <span>♙<b>个人中心</b></span>
        </div>
      </div>
      <DetailPanel title="底部导航">
        <p className="brand-help">由于第三方平台限制，自定义底部导航功能在 iPhone 中/小红书小程序、抖音小程序，暂不生效。</p>
        <div className="brand-radio-row">
          <b>导航显示颜色</b>
          <label><input type="radio" /> 全局风格颜色</label>
          <label><input type="radio" defaultChecked /> 自定义颜色</label>
        </div>
        <div className="brand-color-row"><span>未选中</span><i style={{ background: '#bfbfbf' }} /> <button type="button">重置</button></div>
        <div className="brand-color-row"><span>已选中</span><i style={{ background: '#2c2c2c' }} /> <button type="button">重置</button></div>
        <section className="brand-nav-card">
          <h3>导航1</h3>
          <label>名称:<input defaultValue="首页" /></label>
        </section>
      </DetailPanel>
      <SaveBar />
    </div>
  )
}

function FloatingState({ popup = false }: { popup?: boolean }) {
  return (
    <div className="brand-editor-state">
      <div className="brand-phone-stage brand-phone-stage--settings">
        <EmptyPhone dim={popup} />
      </div>
      <DetailPanel title={popup ? '首页弹窗' : '悬浮框'}>
        <div className="brand-radio-row">
          <b>是否开启:</b>
          <label><input type="radio" defaultChecked /> 不启用</label>
          <label><input type="radio" /> 启用</label>
        </div>
        <div className="brand-upload-row">
          <b>图片上传:</b>
          <span>建议上传{popup ? '宽度280*350' : '50*50'}的图片</span>
          <button type="button" className="brand-upload">▱<small>点击上传+</small></button>
        </div>
        <div className="brand-link-form">
          <b>链接配置:</b>
          <span>h5跳转地址</span>
          <input placeholder="开头为https://" />
          <a>小程序跳转地址</a>
          <input placeholder="开头为/pages" />
        </div>
      </DetailPanel>
      <SaveBar />
    </div>
  )
}

function StyleState() {
  return (
    <div className="brand-editor-state">
      <div className="brand-global-preview">
        <h2>当前小程序展示</h2>
        <div className="brand-global-phones">
          <StorePreview />
          <ProfilePreview />
        </div>
      </div>
      <DetailPanel title="选择颜色">
        <div className="brand-style-swatches">
          {['#ed5263', '#df5160', '#7a8881'].map((color) => (
            <span key={color} style={{ backgroundColor: color }} />
          ))}
        </div>
      </DetailPanel>
      <SaveBar />
    </div>
  )
}

function SaveBar() {
  return <div className="brand-savebar"><button type="button">保存并发布</button></div>
}

function BrandWorkspace({ active }: { active: BrandSection }) {
  if (active === 'templates') return <TemplateMarket />
  if (active === 'store') return <StoreEditor type="store" />
  if (active === 'profile') return <StoreEditor type="profile" />
  if (active === 'coupon') return <CouponState />
  if (active === 'navigation') return <NavigationState />
  if (active === 'float') return <FloatingState />
  if (active === 'popup') return <FloatingState popup />
  return <StyleState />
}

export function BrandWebsitePage() {
  const [active, setActive] = useState<BrandSection>('templates')

  return (
    <div className="brand-website-page">
      <h1 className="sr-only-heading">品牌官网</h1>
      <aside className="brand-module-menu" aria-label="OTA 私域导航">
        <Link to="/channels/ota">OTA</Link>
        <Link to="/channels/social">社媒</Link>
        <div className="brand-module-menu__group is-open">
          <span>私域⌄</span>
          <Link to="/channels/private">私域渠道</Link>
          <Link className="is-active" to="/mallManagement/weapp/decorate">
            品牌官网
          </Link>
        </div>
        <small>版本号：v4.10.7</small>
      </aside>

      <section className="brand-decorate-shell">
        <nav className="brand-page-nav" aria-label="页面导航">
          <h2>页面导航</h2>
          {pageNavGroups.map((group, groupIndex) => (
            <div key={group.title ?? `group-${groupIndex}`} className="brand-page-nav__group">
              {group.title ? <p>{group.title}</p> : null}
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={active === item.key ? 'is-active' : ''}
                  onClick={() => setActive(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <main className="brand-workspace">
          <BrandWorkspace active={active} />
        </main>
      </section>
    </div>
  )
}
