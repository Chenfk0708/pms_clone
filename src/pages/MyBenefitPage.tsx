import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './MyBenefitPage.css'

type ResourceRow = {
  name: string
  total: string
  used: string
  source: string
  status: string
  expires: string
  action: string
}

const resourceRows: ResourceRow[] = [
  { name: '门店数', total: '1', used: '1', source: '畅享版(1)', status: '正常', expires: '-', action: '扩容' },
  { name: '企业数', total: '1', used: '1', source: '畅享版(1)', status: '正常', expires: '-', action: '扩容' },
  { name: '库存数', total: '10', used: '4', source: '畅享版(10)', status: '正常', expires: '-', action: '扩容' },
  { name: '成员账号数', total: '3', used: '1', source: '畅享版(3)', status: '正常', expires: '-', action: '扩容' },
  { name: '携程直连', total: '-', used: '-', source: '畅享版 + 系统赠送 (1)', status: '正常', expires: '2027-09-28', action: '-' },
  { name: '木鸟直连', total: '-', used: '-', source: '畅享版 + 扩容 (1)', status: '正常', expires: '无期限', action: '-' },
  { name: '美团民宿直连', total: '-', used: '-', source: '畅享版 + 扩容 (1)', status: '正常', expires: '无期限', action: '-' },
  { name: '途家直连', total: '-', used: '-', source: '畅享版 + 扩容 (1)', status: '正常', expires: '无期限', action: '-' },
  { name: '飞猪直连', total: '-', used: '-', source: '畅享版 + 系统赠送 (1)', status: '正常', expires: '2027-09-28', action: '-' },
  { name: 'Booking', total: '-', used: '-', source: '限时体验', status: '正常', expires: '2027-09-28', action: '-' },
  { name: '美团酒店直连', total: '-', used: '-', source: '畅享版 + 系统赠送 (1)', status: '正常', expires: '2027-09-28', action: '-' },
  { name: '小猪直连', total: '-', used: '-', source: '畅享版 + 扩容 (1)', status: '正常', expires: '无期限', action: '-' },
  { name: '线上付款', total: '-', used: '-', source: '畅享版 + 系统赠送 (1)', status: '正常', expires: '2027-09-28', action: '-' },
  { name: '抖音直连', total: '-', used: '-', source: '限时体验', status: '正常', expires: '2027-09-28', action: '-' },
]

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

const plans = [
  { name: '标准版', price: '免费使用', tag: '', tone: 'standard' },
  { name: '畅享版', price: '1388元/一年', oldPrice: '1588元/一年', tag: '特别优惠', tone: 'enjoy', active: true },
  { name: '高级版', price: '2388元/一年', oldPrice: '2800元/一年', tag: '特别优惠', tone: 'advanced' },
  { name: '专业版', price: '4888元/一年', oldPrice: '5800元/一年', tag: '特别优惠', tone: 'pro' },
  { name: '旗舰版', price: '8888元/一年', oldPrice: '9800元/一年', tag: '特别优惠', tone: 'flagship' },
  { name: '定制版', price: '50000元/起', tag: '特别优惠', tone: 'custom' },
]

const featureColumns = [
  {
    title: '专业住宿管理',
    items: ['智能房态房价', '订单管理', '多渠道消息聚合', '包栋/联动关房', '多岗位协同', '支持日历房、多种售卖产品', '支持日房态/月房态', '线上收付款', '房态分享'],
  },
  {
    title: '专业报表',
    items: ['基础报表', '综合月报', '夜审', '交接班'],
  },
  {
    title: '民宿渠道',
    items: ['美团民宿直连', '途家直连', '小猪直连', '木鸟直连'],
  },
  {
    title: '服务特权',
    items: ['专业培训', '金牌进群服务', '7x12小时在线客服'],
  },
]

export function MyBenefitPage() {
  const [activeTab, setActiveTab] = useState<'resources' | 'services' | 'records'>('resources')
  const [showUpgrade, setShowUpgrade] = useState(false)

  if (showUpgrade) {
    return <VersionUpgradePanel onBack={() => setShowUpgrade(false)} />
  }

  return (
    <div className="my-benefit-page">
      <VersionSideNav />
      <main className="my-benefit-main">
        <section className="my-benefit-tabs" role="tablist" aria-label="我的权益视图">
          <button type="button" role="tab" aria-selected={activeTab === 'resources'} onClick={() => setActiveTab('resources')}>
            版本资源
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'services'} onClick={() => setActiveTab('services')}>
            功能服务
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'records'} onClick={() => setActiveTab('records')}>
            开通记录
          </button>
        </section>

        {activeTab === 'resources' ? (
          <>
            <section className="my-benefit-version" aria-label="当前版本">
              <div className="my-benefit-version__icon" aria-hidden="true" />
              <div>
                <h1>当前版本：畅享版</h1>
                <p>
                  有效期到：2027-09-28 <button type="button">开通记录</button>
                </p>
              </div>
              <div className="my-benefit-version__actions">
                <button type="button" className="is-outline">
                  续 费
                </button>
                <button type="button" className="is-primary" onClick={() => setShowUpgrade(true)}>
                  版本升级
                </button>
              </div>
            </section>

            <ResourceTable />
          </>
        ) : (
          <section className="my-benefit-empty-state" aria-label={activeTab === 'services' ? '功能服务' : '开通记录'}>
            <strong>{activeTab === 'services' ? '功能服务' : '开通记录'}</strong>
            <span>暂无数据</span>
          </section>
        )}
      </main>
    </div>
  )
}

function VersionSideNav() {
  return (
    <aside className="my-benefit-sidebar" aria-label="订阅中心侧栏">
      <div className="my-benefit-sidebar__root">订阅中心</div>
      <nav>
        {sideLinks.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `my-benefit-side-link${isActive ? ' is-active' : ''}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <span className="my-benefit-build">版本号：v4.10.7</span>
    </aside>
  )
}

function ResourceTable() {
  return (
    <table className="my-benefit-table" aria-label="版本资源表">
      <thead>
        <tr>
          {['资源名称', '可用数量', '已经用数量', '资源来源', '状态', '有效期', '操作'].map((column) => (
            <th key={column}>{column}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {resourceRows.map((row) => (
          <tr key={row.name}>
            <td>{row.name}</td>
            <td>{row.total}</td>
            <td>
              {row.used}
              {row.used !== '-' ? <span className="my-benefit-eye" aria-hidden="true" /> : null}
            </td>
            <td>{row.source}</td>
            <td>
              <span className="my-benefit-status">{row.status}</span>
            </td>
            <td>{row.expires}</td>
            <td>{row.action === '-' ? '-' : <button type="button">{row.action}</button>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function VersionUpgradePanel({ onBack }: { onBack: () => void }) {
  return (
    <div className="my-benefit-upgrade">
      <header className="my-benefit-upgrade__header">
        <div>
          <h1>当前版本：畅享版</h1>
          <p>有效期到:2027-09-28</p>
        </div>
        <button type="button" onClick={onBack}>
          版本对比
        </button>
      </header>

      <section className="my-benefit-plan-row" aria-label="版本套餐">
        {plans.map((plan) => (
          <article key={plan.name} className={`my-benefit-plan my-benefit-plan--${plan.tone}${plan.active ? ' is-active' : ''}`} aria-label={plan.name}>
            {plan.tag ? <span>{plan.tag}</span> : null}
            <strong>{plan.name}</strong>
            <em>{plan.price}</em>
            {plan.oldPrice ? <del>原价:{plan.oldPrice}</del> : null}
          </article>
        ))}
      </section>

      <section className="my-benefit-feature-board" aria-label="版本订阅功能明细">
        <aside className="my-benefit-subscription-list">
          <h2>版本订阅</h2>
          <p>库存(10个)</p>
          <p>成员账号(3个)</p>
          <p>门店(1个)</p>
        </aside>

        <div className="my-benefit-feature-grid">
          <h2>功能订阅</h2>
          {featureColumns.map((group) => (
            <section key={group.title} aria-label={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </section>
          ))}
          <section aria-label="SCRM">
            <h3>SCRM</h3>
            <p>客户管理</p>
            <p>客户标签</p>
            <p className="is-muted">企微直连</p>
          </section>
          <section aria-label="智慧酒店">
            <h3>智慧酒店</h3>
            <p>直连智能门锁</p>
            <p>短信自助入住</p>
            <p>公安身份验证</p>
          </section>
          <section aria-label="渠道扩展">
            <h3>酒店渠道</h3>
            <p>携程直连</p>
            <p>美团酒店直连</p>
            <p>飞猪酒店直连</p>
            <p>飞猪百达直连</p>
          </section>
        </div>

        <aside className="my-benefit-service-list">
          <h2>服务特权</h2>
          <p>专业培训</p>
          <p>金牌进群服务</p>
          <p>7x12小时在线客服</p>
        </aside>
      </section>
    </div>
  )
}
