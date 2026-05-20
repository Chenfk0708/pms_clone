import { type ReactNode, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  loadBrandWebsiteData,
  type BrandWebsiteCoupon,
  type BrandWebsiteMetric,
  type BrandWebsiteTemplate,
  type BrandWebsiteViewModel,
} from '../services/brandWebsite'
import './BrandWebsitePage.css'

type BrandSection = 'templates' | 'store' | 'profile' | 'coupon' | 'navigation' | 'float' | 'popup' | 'style'

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

const METRIC_DETAIL_TITLE = String.fromCharCode(0x6307, 0x6807, 0x8be6, 0x60c5)
const METRIC_DETAIL_CLOSE_LABEL = String.fromCharCode(0x5173, 0x95ed, 0x6307, 0x6807, 0x8be6, 0x60c5)
type LoadState =
  | { kind: 'ready'; data: BrandWebsiteViewModel }
  | { kind: 'error'; message: string }

function initialState(): LoadState {
  try {
    return { kind: 'ready', data: loadBrandWebsiteData() }
  } catch (error) {
    return { kind: 'error', message: error instanceof Error ? error.message : '品牌官网数据加载失败' }
  }
}

export function BrandWebsitePage() {
  const navigate = useNavigate()
  const [active, setActive] = useState<BrandSection>('templates')
  const [state, setState] = useState<LoadState>(() => initialState())
  const [query, setQuery] = useState({ campId: 'camp-ts5', businessDate: '2026-05-18', keyword: '' })
  const [notice, setNotice] = useState('品牌官网数据已更新')
  const [isLoading, setIsLoading] = useState(false)
  const [metricDetail, setMetricDetail] = useState<BrandWebsiteMetric | null>(null)
  const [templateDetail, setTemplateDetail] = useState<BrandWebsiteTemplate | null>(null)
  const [couponDetail, setCouponDetail] = useState<BrandWebsiteCoupon | null>(null)

  const data = state.kind === 'ready' ? state.data : null

  function loadWithFeedback(nextQuery = query, message = '品牌官网数据已刷新') {
    setIsLoading(true)
    window.setTimeout(() => {
      try {
        const next = loadBrandWebsiteData(nextQuery)
        setState({ kind: 'ready', data: next })
        setNotice(message)
      } catch (error) {
        setState({ kind: 'error', message: error instanceof Error ? error.message : '品牌官网数据加载失败' })
      } finally {
        setIsLoading(false)
      }
    }, 120)
  }

  function retry() {
    window.localStorage.setItem('pms.brandWebsiteMockMode', 'success')
    loadWithFeedback(query, '已重新加载品牌官网')
  }

  function resetFilters() {
    const nextQuery = { campId: 'camp-ts5', businessDate: '2026-05-18', keyword: '' }
    setQuery(nextQuery)
    loadWithFeedback(nextQuery, '已恢复默认条件')
  }

  function updateSection(section: BrandSection) {
    setActive(section)
    setNotice(`已切换到${pageNavGroups.flatMap((group) => group.items).find((item) => item.key === section)?.label}`)
  }

  if (state.kind === 'error') {
    return (
      <BrandShell active={active} onSectionChange={updateSection}>
        <section className="brand-state-card" role="alert">
          <h1>品牌官网数据加载失败</h1>
          <p>{state.message}</p>
          <button type="button" onClick={retry}>
            重试
          </button>
        </section>
        <ActionStatus message={notice} />
      </BrandShell>
    )
  }

  if (!data) return null

  return (
    <BrandShell active={active} onSectionChange={updateSection}>
      <header className="brand-toolbar" aria-label="品牌官网筛选区">
        <div>
          <h1>品牌官网</h1>
          <p>{data.camp.name}，{data.businessDate} 运营概览</p>
        </div>
        <label>
          <span>门店</span>
          <select
            aria-label="门店"
            value={query.campId}
            onChange={(event) => setQuery((current) => ({ ...current, campId: event.target.value }))}
            disabled={isLoading}
          >
            {data.stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>运营日期</span>
          <input
            aria-label="运营日期"
            type="date"
            value={query.businessDate}
            onChange={(event) => setQuery((current) => ({ ...current, businessDate: event.target.value }))}
            disabled={isLoading}
          />
        </label>
        <button type="button" onClick={() => loadWithFeedback(query, '已按当前条件更新品牌官网')} disabled={isLoading}>
          查询
        </button>
        <button type="button" onClick={resetFilters} disabled={isLoading}>
          重置
        </button>
        <button type="button" onClick={() => loadWithFeedback(query, '品牌官网数据已刷新')} disabled={isLoading}>
          刷新
        </button>
        <button type="button" onClick={() => setNotice('导出任务已创建，可在下载中心查看')} disabled={isLoading}>
          导出
        </button>
      </header>

      <ActionStatus message={isLoading ? '正在更新品牌官网数据' : notice} />
      <span className="brand-contract" data-testid="brand-website-contract">
        {JSON.stringify(data.contract)}
      </span>

      <main className="brand-workspace">
        <MetricStrip
          data={data}
          onMetricDetail={(metric) => {
            setMetricDetail(metric)
            setNotice(`\u5df2\u67e5\u770b${metric.label}\u8be6\u60c5`)
          }}
        />
        {data.templates.length === 0 ? (
          <section className="brand-state-card" role="status" aria-label="品牌官网空态">
            <h2>暂无符合当前条件的品牌官网配置</h2>
            <p>可以重置条件后查看默认门店配置，或新建模板方案继续运营。</p>
            <button type="button" onClick={resetFilters}>
              重置条件
            </button>
          </section>
        ) : (
          <BrandWorkspace
            active={active}
            data={data}
            keyword={query.keyword}
            onKeywordChange={(keyword) => setQuery((current) => ({ ...current, keyword }))}
            onSearchCoupons={() => loadWithFeedback(query, '已筛选领券活动')}
            onTemplateApply={(template) => setNotice(`已应用${template.name}`)}
            onTemplateDetail={setTemplateDetail}
            onCouponDetail={setCouponDetail}
            onNavigate={(path) => navigate(path)}
            onNotice={setNotice}
          />
        )}
      </main>

      {templateDetail ? (
        <BrandDialog title="模板详情" closeLabel="关闭模板详情" onClose={() => setTemplateDetail(null)}>
          <h3>{templateDetail.name}</h3>
          <p>{templateDetail.scene}</p>
          <div className="brand-dialog-swatches">
            {templateDetail.colors.map((color) => (
              <span key={color} style={{ backgroundColor: color }} />
            ))}
          </div>
        </BrandDialog>
      ) : null}

      {metricDetail ? (
        <BrandDialog title={METRIC_DETAIL_TITLE} closeLabel={METRIC_DETAIL_CLOSE_LABEL} onClose={() => setMetricDetail(null)}>
          <h3>{metricDetail.label}</h3>
          <p>
            {metricDetail.value}
            {metricDetail.unit}
          </p>
          <p>{metricDetail.trend}</p>
        </BrandDialog>
      ) : null}

      {couponDetail ? (
        <BrandDialog title="活动详情" closeLabel="关闭活动详情" onClose={() => setCouponDetail(null)}>
          <h3>{couponDetail.name}</h3>
          <p>{couponDetail.validPeriod}</p>
          <p>微信 {couponDetail.wechatViews} 次，抖音 {couponDetail.douyinViews} 次，小红书 {couponDetail.redbookViews} 次。</p>
        </BrandDialog>
      ) : null}
    </BrandShell>
  )
}

function BrandShell({
  active,
  children,
  onSectionChange,
}: {
  active: BrandSection
  children: ReactNode
  onSectionChange: (section: BrandSection) => void
}) {
  return (
    <div className="brand-website-page">
      <aside className="brand-module-menu" aria-label="OTA 私域导航">
        <Link to="/channels/ota">OTA</Link>
        <Link to="/channels/social">社媒</Link>
        <div className="brand-module-menu__group is-open">
          <span>私域</span>
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
                  onClick={() => onSectionChange(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <section className="brand-main-panel">{children}</section>
      </section>
    </div>
  )
}

function ActionStatus({ message }: { message: string }) {
  return (
    <div className="brand-action-status" role="status" aria-label="品牌官网操作反馈">
      {message}
    </div>
  )
}

function MetricStrip({
  data,
  onMetricDetail,
}: {
  data: BrandWebsiteViewModel
  onMetricDetail: (metric: BrandWebsiteMetric) => void
}) {
  return (
    <section className="brand-metric-strip" aria-label="品牌官网核心指标">
      {data.metrics.map((metric) => (
        <button key={metric.id} type="button" onClick={() => onMetricDetail(metric)}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <em>{metric.unit}</em>
          <small>{metric.trend}</small>
        </button>
      ))}
    </section>
  )
}

function BrandWorkspace({
  active,
  data,
  keyword,
  onKeywordChange,
  onSearchCoupons,
  onTemplateApply,
  onTemplateDetail,
  onCouponDetail,
  onNavigate,
  onNotice,
}: {
  active: BrandSection
  data: BrandWebsiteViewModel
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearchCoupons: () => void
  onTemplateApply: (template: BrandWebsiteTemplate) => void
  onTemplateDetail: (template: BrandWebsiteTemplate) => void
  onCouponDetail: (coupon: BrandWebsiteCoupon) => void
  onNavigate: (path: string) => void
  onNotice: (message: string) => void
}) {
  if (active === 'store') return <StoreEditor data={data} onNavigate={onNavigate} onNotice={onNotice} />
  if (active === 'profile') return <ProfileEditor data={data} onNotice={onNotice} />
  if (active === 'coupon') {
    return (
      <CouponState
        coupons={data.coupons}
        keyword={keyword}
        onKeywordChange={onKeywordChange}
        onSearch={onSearchCoupons}
        onDetail={onCouponDetail}
        onNotice={onNotice}
      />
    )
  }
  if (active === 'navigation') return <NavigationState data={data} onNotice={onNotice} />
  if (active === 'float') return <ComponentState title="悬浮框" enabled={data.pageConfig.floatingButtonEnabled} onNotice={onNotice} />
  if (active === 'popup') return <ComponentState title="首页弹窗" enabled={data.pageConfig.popupEnabled} onNotice={onNotice} />
  if (active === 'style') return <StyleState data={data} onNotice={onNotice} />
  return <TemplateMarket templates={data.templates} onApply={onTemplateApply} onDetail={onTemplateDetail} />
}

function TemplateMarket({
  templates,
  onApply,
  onDetail,
}: {
  templates: BrandWebsiteTemplate[]
  onApply: (template: BrandWebsiteTemplate) => void
  onDetail: (template: BrandWebsiteTemplate) => void
}) {
  return (
    <div className="brand-template-market">
      {templates.map((template) => (
        <section key={template.id} className="brand-template">
          <header className="brand-template__head">
            <div>
              <h2>{template.name}</h2>
              <p>{template.scene}</p>
            </div>
            <button type="button" onClick={() => onApply(template)}>
              <span>{template.name}</span> <b>一键使用</b>
            </button>
            <button type="button" className="brand-secondary-button" onClick={() => onDetail(template)}>
              查看{template.name}详情
            </button>
          </header>
          <div className="brand-template__colors">
            <strong>颜色选择</strong>
            {template.colors.map((color) => (
              <span key={`${template.id}-${color}`} className="brand-template__swatch" style={{ backgroundColor: color }} />
            ))}
          </div>
          <div className="brand-template__phones">
            <TemplatePhone src={template.previewImage} label="首页" />
            <TemplatePhone src={template.profileImage} label="个人中心" />
          </div>
        </section>
      ))}
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

function StoreEditor({
  data,
  onNavigate,
  onNotice,
}: {
  data: BrandWebsiteViewModel
  onNavigate: (path: string) => void
  onNotice: (message: string) => void
}) {
  return (
    <div className="brand-editor-state">
      <PhonePreview data={data} />
      <DetailPanel title="店铺主页">
        <div className="brand-store-row">
          <span>{data.pageConfig.storeName}</span>
          <button type="button" onClick={() => onNotice('店铺主页配置已保存')}>
            保存配置
          </button>
        </div>
        <div className="brand-route-grid">
          {data.routeTargets.map((target) => (
            <button key={target.path} type="button" onClick={() => onNavigate(target.path)}>
              前往{target.label}
            </button>
          ))}
        </div>
      </DetailPanel>
    </div>
  )
}

function ProfileEditor({ data, onNotice }: { data: BrandWebsiteViewModel; onNotice: (message: string) => void }) {
  return (
    <div className="brand-editor-state">
      <ProfilePreview />
      <DetailPanel title="个人中心">
        <div className="brand-store-row">
          <span>{data.pageConfig.storeName}会员中心</span>
          <button type="button" onClick={() => onNotice('个人中心配置已保存')}>
            保存配置
          </button>
        </div>
        <TodoList todos={data.todos} onNotice={onNotice} />
      </DetailPanel>
    </div>
  )
}

function PhonePreview({ data }: { data: BrandWebsiteViewModel }) {
  return (
    <div className="brand-phone brand-phone--home">
      <MiniTop title="首页" />
      <div className="brand-hero">
        <div className="brand-hero__logo">LOCALS</div>
        <div className="brand-hero__cn">{data.pageConfig.heroTitle}</div>
      </div>
      <div className="brand-search-card">
        <div className="brand-search-card__row">
          <span>输入关键词搜索</span>
          <em>全国</em>
        </div>
        <div className="brand-date-row">
          <div>
            <small>周三入住</small>
            <strong>05月18日</strong>
          </div>
          <span>共1晚</span>
          <div>
            <small>周四退房</small>
            <strong>05月19日</strong>
          </div>
        </div>
        <button type="button">搜索</button>
      </div>
      <PhoneSectionTitle title="热门套餐" />
      <PhoneSectionTitle title="品牌门店" />
    </div>
  )
}

function MiniTop({ title }: { title: string }) {
  return (
    <div className="brand-phone__top">
      <span>9:41</span>
      <strong>{title}</strong>
      <span className="brand-phone__capsule">•••</span>
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
  const listItems = ['微商城订单', '我的优惠券', '分销钱包', '服务资质', '联系我们']
  return (
    <div className="brand-phone brand-phone--profile">
      <MiniTop title="个人中心" />
      <div className="brand-user">
        <span>会</span>
        <strong>用户昵称</strong>
      </div>
      <section className="brand-order-card">
        <header>
          <strong>我的订单</strong>
          <span>全部订单</span>
        </header>
        <div className="brand-order-icons">
          {orderItems.map((item) => (
            <div key={item}>
              <span>□</span>
              <small>{item}</small>
            </div>
          ))}
        </div>
      </section>
      <div className="brand-profile-list">
        {listItems.map((item) => (
          <div key={item}>
            <span>{item}</span>
            <b>&gt;</b>
          </div>
        ))}
      </div>
    </div>
  )
}

function CouponState({
  coupons,
  keyword,
  onKeywordChange,
  onSearch,
  onDetail,
  onNotice,
}: {
  coupons: BrandWebsiteCoupon[]
  keyword: string
  onKeywordChange: (keyword: string) => void
  onSearch: () => void
  onDetail: (coupon: BrandWebsiteCoupon) => void
  onNotice: (message: string) => void
}) {
  return (
    <div className="brand-management-state">
      <form className="brand-coupon-filter" aria-label="领券活动筛选" onSubmit={(event) => event.preventDefault()}>
        <label>
          <span>活动名称</span>
          <input value={keyword} placeholder="请输入活动名称" onChange={(event) => onKeywordChange(event.target.value)} />
        </label>
        <button type="button" onClick={onSearch}>
          搜索活动
        </button>
        <button type="button" onClick={() => onKeywordChange('')}>
          清空
        </button>
      </form>
      <div className="brand-table-toolbar">
        <button type="button" onClick={() => onDetail(coupons[0])}>
          新建活动
        </button>
        <button type="button" onClick={() => onNotice('活动列表已刷新')}>
          刷新活动
        </button>
      </div>
      <div className="brand-coupon-table" aria-label="领券活动表格">
        <div className="brand-coupon-table__head">
          <span>活动页面名称</span>
          <span>状态</span>
          <span>活动时间</span>
          <span>微信访问</span>
          <span>抖音访问</span>
          <span>小红书访问</span>
          <span>操作</span>
        </div>
        {coupons.map((coupon) => (
          <div key={coupon.id} className="brand-coupon-table__row">
            <span>{coupon.name}</span>
            <span>{readCouponStatus(coupon.status)}</span>
            <span>{coupon.validPeriod}</span>
            <span>{coupon.wechatViews}</span>
            <span>{coupon.douyinViews}</span>
            <span>{coupon.redbookViews}</span>
            <button type="button" onClick={() => onDetail(coupon)}>
              查看详情
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function NavigationState({ data, onNotice }: { data: BrandWebsiteViewModel; onNotice: (message: string) => void }) {
  return (
    <div className="brand-editor-state">
      <div className="brand-phone-stage">
        <PhonePreview data={data} />
        <div className="brand-bottom-nav">
          {data.pageConfig.bottomNavigation.map((item) => (
            <span key={item.id}>{item.label}</span>
          ))}
        </div>
      </div>
      <DetailPanel title="底部导航">
        {data.pageConfig.bottomNavigation.map((item, index) => (
          <label key={item.id} className="brand-nav-card">
            <span>导航{index + 1}</span>
            <input defaultValue={item.label} />
          </label>
        ))}
        <SaveBar onNotice={onNotice} />
      </DetailPanel>
    </div>
  )
}

function ComponentState({
  title,
  enabled,
  onNotice,
}: {
  title: string
  enabled: boolean
  onNotice: (message: string) => void
}) {
  return (
    <div className="brand-editor-state">
      <EmptyPhone dim={title === '首页弹窗'} />
      <DetailPanel title={title}>
        <div className="brand-radio-row">
          <b>是否开启</b>
          <label>
            <input type="radio" name={title} defaultChecked={!enabled} /> 不启用
          </label>
          <label>
            <input type="radio" name={title} defaultChecked={enabled} /> 启用
          </label>
        </div>
        <button type="button" className="brand-upload" onClick={() => onNotice(`${title}素材已上传`)}>
          点击上传
        </button>
        <SaveBar onNotice={onNotice} />
      </DetailPanel>
    </div>
  )
}

function StyleState({ data, onNotice }: { data: BrandWebsiteViewModel; onNotice: (message: string) => void }) {
  return (
    <div className="brand-editor-state">
      <div className="brand-global-preview">
        <h2>当前小程序展示</h2>
        <PhonePreview data={data} />
      </div>
      <DetailPanel title="选择颜色">
        <div className="brand-style-swatches">
          {data.templates[0]?.colors.map((color) => (
            <button key={color} type="button" style={{ backgroundColor: color }} onClick={() => onNotice('全局风格颜色已更新')} />
          ))}
        </div>
        <SaveBar onNotice={onNotice} />
      </DetailPanel>
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

function DetailPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="brand-detail-panel">
      <h2>{title}</h2>
      <div className="brand-detail-panel__line" />
      {children}
    </aside>
  )
}

function TodoList({ todos, onNotice }: { todos: BrandWebsiteViewModel['todos']; onNotice: (message: string) => void }) {
  return (
    <div className="brand-todo-list">
      {todos.map((todo) => (
        <button key={todo.id} type="button" onClick={() => onNotice(`${todo.title}已标记处理`)}>
          <strong>{todo.title}</strong>
          <span>{todo.owner} · {todo.dueText}</span>
        </button>
      ))}
    </div>
  )
}

function SaveBar({ onNotice }: { onNotice: (message: string) => void }) {
  return (
    <div className="brand-savebar">
      <button type="button" onClick={() => onNotice('配置已保存并发布')}>
        保存并发布
      </button>
    </div>
  )
}

function BrandDialog({
  title,
  closeLabel,
  children,
  onClose,
}: {
  title: string
  closeLabel: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="brand-dialog-backdrop" role="presentation" onClick={onClose}>
      <section className="brand-dialog" role="dialog" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button type="button" onClick={onClose}>
            {closeLabel}
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function readCouponStatus(status: BrandWebsiteCoupon['status']) {
  if (status === 'active') return '进行中'
  if (status === 'scheduled') return '未开始'
  return '已暂停'
}
