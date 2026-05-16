import { NavLink, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import './VersionSubscriptionPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

const plans = [
  { name: '标准版', price: '免费使用', note: '', tone: 'standard' },
  { name: '畅享版', price: '1388元/一年', note: '原价:1588元/一年', tone: 'delight', active: true },
  { name: '高级版', price: '2388元/一年', note: '原价:2800元/一年', tone: 'advanced' },
  { name: '专业版', price: '4888元/一年', note: '原价:5800元/一年', tone: 'professional' },
  { name: '旗舰版', price: '8888元/一年', note: '原价:9800元/一年', tone: 'flagship' },
  { name: '定制版', price: '50000元/起', note: '', tone: 'custom' },
]

const featureGroups = [
  {
    title: '专业住宿管理',
    items: ['智能房态房价', '订单管理', '多渠道消息聚合', '包栋/联动关房', '多岗位协同', '支持日历房、多种售卖产品', '支持日房态/月房态', '线上收付款', '房态分享'],
    disabled: ['AI全域雷达', '支持预售券/酒店套餐', '智能保洁'],
  },
  {
    title: 'SCRM',
    items: ['客户管理', '客户标签'],
    disabled: ['企微直连'],
  },
  {
    title: '专业报表',
    items: ['基础报表', '综合月报', '夜审'],
    disabled: ['交接班'],
  },
  {
    title: '智能房价',
    items: ['中央价格（一键改价）', '实际售卖价模式'],
    disabled: ['竞争圈比价', '智能调价'],
  },
  {
    title: '智慧酒店',
    items: ['直连智能门锁', '短信自助入住', '公安身份验证', '二维码自助入住', '在线押金'],
    disabled: ['制卡门锁直连', '自助机入住', '电子房价牌', '旅业系统对接'],
  },
  {
    title: '民宿渠道',
    items: ['美团民宿直连', '途家直连', '小猪直连', '木鸟直连'],
    disabled: [],
  },
  {
    title: '酒店渠道',
    items: ['携程直连', '美团酒店直连', '飞猪淘酒店直连', '飞猪百途直连'],
    disabled: [],
  },
  {
    title: '国际渠道',
    items: [],
    disabled: ['booking直连', 'airbnb直连', 'trip.com直连'],
  },
  {
    title: '社媒渠道',
    items: [],
    disabled: ['抖音直连', '抖音共管', '视频号'],
  },
  {
    title: '私域渠道',
    items: [],
    disabled: ['品牌小程序', '企业微信、公众号'],
  },
  {
    title: '多业态管理',
    items: ['住宿营收报表', '餐饮营收报表', '商超营收报表', '娱乐营收报表', '场地营收报表'],
    disabled: [],
  },
  {
    title: '路客云聚合渠道',
    items: ['路客云聚合渠道'],
    disabled: [],
  },
  {
    title: '服务特权',
    items: ['专业培训', '金牌讲师服务', '一对一服务'],
    disabled: ['按需定制功能'],
  },
]

const durations = [
  { label: '一年', multiplier: 1 },
  { label: '两年', multiplier: 2 },
  { label: '无期限', multiplier: 5 },
]

export function VersionSubscriptionPage() {
  const navigate = useNavigate()
  const [duration, setDuration] = useState(durations[0])
  const [agreed, setAgreed] = useState(true)
  const [compareOpen, setCompareOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const total = useMemo(() => duration.multiplier * 1388, [duration])

  function submitOrder() {
    if (!agreed) {
      setNotice('请先阅读并同意购买协议')
      return
    }
    navigate('/version/applicationPayment/detail?plan=delight')
  }

  return (
    <div className="version-subscription-page">
      <aside className="version-subscription-sidebar" aria-label="订阅中心侧栏">
        <div className="version-subscription-sidebar__root">订阅中心</div>
        <nav>
          {sideLinks.map((item) => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `version-subscription-link${isActive ? ' is-active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <span className="version-subscription-build">版本号：v4.10.7</span>
      </aside>

      <section className="version-subscription-main" aria-label="版本订阅页面">
        <div className="version-subscription-hero">
          <div>
            <h1>版本订阅</h1>
            <p>
              <span>当前版本：</span>
              <strong>畅享版</strong>
            </p>
            <p>有效期到: 2027-09-28</p>
          </div>
          <button type="button" className="version-subscription-compare" onClick={() => setCompareOpen(true)}>
            版本对比
          </button>
        </div>

        <ul className="version-subscription-plans" aria-label="版本套餐">
          {plans.map((plan) => (
            <li key={plan.name} className={`version-subscription-plan version-subscription-plan--${plan.tone}${plan.active ? ' is-active' : ''}`}>
              <span className="version-subscription-badge">特别优惠</span>
              <h2>{plan.name}</h2>
              <strong>{plan.price}</strong>
              {plan.note ? <em>{plan.note}</em> : null}
            </li>
          ))}
        </ul>

        <section className="version-subscription-matrix" aria-label="版本能力矩阵">
          <div className="version-subscription-limits">
            <h2>版本订阅</h2>
            <span>库存(10个)</span>
            <span>成员账号(3个)</span>
            <span>门店(1个)</span>
          </div>
          <div className="version-subscription-features">
            <h2>功能订阅</h2>
            <div className="version-subscription-feature-grid">
              {featureGroups.map((group) => (
                <section key={group.title} className="version-subscription-feature-group">
                  <h3>{group.title}</h3>
                  {group.items.map((item) => (
                    <p key={item} className="is-enabled">
                      {item}
                    </p>
                  ))}
                  {group.disabled.map((item) => (
                    <p key={item} className="is-disabled">
                      {item}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
          <div className="version-subscription-service">
            <h2>服务特权</h2>
            <p>专业培训</p>
            <p>金牌讲师服务</p>
            <p>一对一服务</p>
            <p className="is-disabled">按需定制功能</p>
          </div>
        </section>

        <section className="version-subscription-checkout" aria-label="续费升级">
          <strong>续费升级</strong>
          <span>扩容</span>
          <div className="version-subscription-duration" role="group" aria-label="购买时长">
            <span>购买时长:</span>
            {durations.map((item) => (
              <button
                key={item.label}
                type="button"
                className={item.label === duration.label ? 'is-active' : ''}
                onClick={() => setDuration(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="version-subscription-total">
            <span>总费用:</span>
            <strong>¥ {total}</strong>
          </div>
          <label className="version-subscription-agreement">
            <input
              type="checkbox"
              checked={agreed}
              aria-label="我已经阅读并同意《畅享版购买协议》"
              onChange={(event) => setAgreed(event.target.checked)}
            />
            我已经阅读并同意《畅享版购买协议》
          </label>
          <button type="button" className="version-subscription-buy" onClick={submitOrder}>
            立即购买
          </button>
          <button type="button" className="version-subscription-tail" onClick={() => navigate('/version/displacementBenefit')}>
            尾房置换
          </button>
        </section>
      </section>

      {notice ? (
        <div className="version-subscription-toast" role="status" onAnimationEnd={() => setNotice('')}>
          {notice}
        </div>
      ) : null}

      {compareOpen ? (
        <div className="version-subscription-modal" role="presentation">
          <div className="version-subscription-dialog" role="dialog" aria-modal="true" aria-label="版本对比">
            <button type="button" aria-label="关闭版本对比" onClick={() => setCompareOpen(false)}>
              ×
            </button>
            <h2>版本对比</h2>
            <div className="version-subscription-compare-grid">
              {plans.slice(0, 5).map((plan) => (
                <article key={plan.name}>
                  <strong>{plan.name}</strong>
                  <span>{plan.price}</span>
                  <p>{plan.name === '畅享版' ? '当前版本，覆盖住宿管理、基础渠道和报表能力。' : '按套餐开放不同能力范围。'}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
