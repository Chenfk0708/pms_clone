import { useCallback, useMemo, useState, useEffect, type FormEvent } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  buildCleanSettingRequest,
  createDefaultCleanSettingFilters,
  exportCleanSetting,
  fetchCleanSettingDashboard,
  saveCleanSettingRule,
  type CleanSettingDashboard,
  type CleanSettingFilters,
  type CleanSettingPolicyRule,
} from '../services/cleanSetting'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
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

const statusLabel: Record<string, string> = {
  all: '全部状态',
  enabled: '已启用',
  paused: '已暂停',
}

const policyStatusLabel: Record<CleanSettingPolicyRule['status'], string> = {
  enabled: '已启用',
  paused: '已暂停',
}

function CleanSettingBusinessPage({ search }: { search: string }) {
  const navigate = useNavigate()
  const initialFilters = useMemo(() => createDefaultCleanSettingFilters(new URLSearchParams(search)), [search])
  const [filters, setFilters] = useState<CleanSettingFilters>(initialFilters)
  const [dashboard, setDashboard] = useState<CleanSettingDashboard | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'price'>('basic')
  const [feedback, setFeedback] = useState('数据加载中')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [detailRule, setDetailRule] = useState<CleanSettingPolicyRule | null>(null)
  const [editRule, setEditRule] = useState<CleanSettingPolicyRule | null>(null)

  const loadDashboard = useCallback(async (nextFilters: CleanSettingFilters, reason: 'initial' | 'query' | 'refresh' | 'reset') => {
    setIsLoading(true)
    setError('')
    setFeedback('数据加载中')

    try {
      const nextDashboard = await fetchCleanSettingDashboard(nextFilters)
      setDashboard(nextDashboard)
      if (nextDashboard.policyRules.length === 0) {
        setFeedback('暂无符合条件的保洁设置')
      } else if (reason === 'query') {
        setFeedback('已按筛选条件更新')
      } else if (reason === 'refresh') {
        setFeedback('数据已刷新')
      } else if (reason === 'reset') {
        setFeedback('筛选条件已重置')
      } else {
        setFeedback('数据已更新')
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '保洁设置加载失败，请稍后重试'
      setError(message)
      setFeedback(message)
      setDashboard(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard(initialFilters, 'initial')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialFilters, loadDashboard])

  const selectedStore = dashboard?.stores.find((item) => item.value === filters.storeId)?.label ?? '全部门店'
  const selectedProject = dashboard?.projects.find((item) => item.value === filters.projectId)?.label ?? '全部项目'
  const canExport = Boolean(dashboard && dashboard.policyRules.length > 0 && !isLoading)
  const requestSummary = buildCleanSettingRequest(filters)
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: (dashboard?.stores ?? [{ value: 'all', label: '全部门店' }]).map((store) => ({
      id: store.value,
      label: store.label,
    })),
  })

  function updateFilter<K extends keyof CleanSettingFilters>(key: K, value: CleanSettingFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadDashboard(filters, 'query')
  }

  function handleReset() {
    const nextFilters = createDefaultCleanSettingFilters(new URLSearchParams(search))
    setFilters(nextFilters)
    void loadDashboard(nextFilters, 'reset')
  }

  function handleRefresh() {
    void loadDashboard(filters, 'refresh')
  }

  function handleExport() {
    void (async () => {
      try {
        const result = await exportCleanSetting(filters)
        setFeedback(`导出任务已创建：${result.fileName}`)
      } catch (exportError) {
        const message = exportError instanceof Error ? exportError.message : '保洁设置导出失败，请稍后重试'
        setError(message)
        setFeedback(message)
      }
    })()
  }

  function handleSaveRule() {
    if (!editRule) return
    void (async () => {
      try {
        const result = await saveCleanSettingRule(editRule)
        setEditRule(null)
        setFeedback(result.message)
      } catch (saveError) {
        const message = saveError instanceof Error ? saveError.message : '保洁设置保存失败，请稍后重试'
        setError(message)
        setFeedback(message)
      }
    })()
  }

  return (
    <div className="clean-setting-page">
      <header className="clean-setting-head">
        <div>
          <h1>保洁设置</h1>
          <p>按门店、项目和策略状态维护自动派单、提醒和价格规则。</p>
        </div>
        <div role="status" aria-label="保洁设置操作反馈" className="clean-setting-feedback">
          {feedback}
        </div>
      </header>

      <form className="clean-setting-filters" aria-label="保洁设置筛选" onSubmit={handleSubmit}>
        <label>
          <span>保洁日期</span>
          <input
            aria-label="保洁日期"
            type="date"
            value={filters.businessDate}
            disabled={isLoading}
            onChange={(event) => updateFilter('businessDate', event.target.value)}
          />
        </label>
        <StoreSelectControl
          className="clean-setting-store"
          label="门店"
          options={storeOptions.map((option) => ({ id: option.id, name: option.label }))}
          value={filters.storeId}
          disabled={isLoading || storeLoading}
          onChange={(storeId) => updateFilter('storeId', storeId)}
        />
        <label>
          <span>项目</span>
          <select
            aria-label="项目"
            value={filters.projectId}
            disabled={isLoading || !dashboard}
            onChange={(event) => updateFilter('projectId', event.target.value)}
          >
            {(dashboard?.projects ?? [{ value: 'all', label: '全部项目' }]).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>策略状态</span>
          <select
            aria-label="策略状态"
            value={filters.status}
            disabled={isLoading || !dashboard}
            onChange={(event) => updateFilter('status', event.target.value)}
          >
            {(dashboard?.statusOptions ?? [{ value: 'all', label: '全部状态' }]).map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <div className="clean-setting-filter-actions">
          <button type="submit" disabled={isLoading}>查询</button>
          <button type="button" disabled={isLoading} onClick={handleReset}>重置</button>
          <button type="button" disabled={isLoading} onClick={handleRefresh}>刷新</button>
          <button type="button" disabled={!canExport} onClick={handleExport}>导出</button>
        </div>
      </form>

      <section className="clean-setting-current" aria-label="当前筛选条件">
        <span>{selectedStore}</span>
        <span>{selectedProject}</span>
        <span>{statusLabel[filters.status] ?? filters.status}</span>
        <span>{requestSummary.businessDate}</span>
      </section>

      {isLoading && (
        <section className="clean-setting-loading" aria-label="保洁设置加载状态">
          保洁设置数据加载中
        </section>
      )}

      {error && (
        <section className="clean-setting-error" role="alert" aria-label="保洁设置数据错误">
          <strong>保洁设置加载失败</strong>
          <span>{error}</span>
          <button type="button" onClick={handleRefresh}>重新加载</button>
        </section>
      )}

      {dashboard && !error && (
        <>
          <section className="clean-setting-metrics" aria-label="保洁设置核心指标">
            {dashboard.metrics.map((metric) => (
              <article key={metric.key}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <em>{metric.description}</em>
              </article>
            ))}
          </section>

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

          <div className="clean-setting-grid">
            <section className="clean-setting-card clean-setting-card--wide">
              <div className="clean-setting-card-head">
                <h2>{activeTab === 'basic' ? '自动派单策略' : '保洁价格规则'}</h2>
                <button type="button" onClick={() => dashboard.policyRules[0] && setEditRule(dashboard.policyRules[0])} disabled={dashboard.policyRules.length === 0}>
                  新增策略
                </button>
              </div>
              <table className="clean-setting-table" aria-label="保洁策略列表">
                <thead>
                  <tr>
                    <th>策略名称</th>
                    <th>门店</th>
                    <th>适用房源</th>
                    <th>触发规则</th>
                    <th>保洁组</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.policyRules.length === 0 ? (
                    <tr>
                      <td colSpan={7}>暂无保洁策略</td>
                    </tr>
                  ) : dashboard.policyRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{rule.name}</td>
                      <td>{rule.storeName}</td>
                      <td>{rule.roomScope}</td>
                      <td>{rule.trigger}</td>
                      <td>{rule.cleanerGroup}</td>
                      <td><span className={`clean-setting-badge is-${rule.status}`}>{policyStatusLabel[rule.status]}</span></td>
                      <td>
                        <button type="button" onClick={() => setDetailRule(rule)}>查看详情 {rule.name}</button>
                        <button type="button" onClick={() => setEditRule(rule)}>编辑 {rule.name}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="clean-setting-card" aria-label="保洁待办提醒">
              <h2>待办提醒</h2>
              {dashboard.reminders.length === 0 ? (
                <p className="clean-setting-empty">暂无待办提醒</p>
              ) : dashboard.reminders.map((item) => (
                <button key={item.id} type="button" className={`clean-setting-reminder is-${item.severity}`} onClick={() => setFeedback(`${item.title}已打开`)}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </section>

            <section className="clean-setting-card clean-setting-card--wide">
              <h2>价格规则</h2>
              <table className="clean-setting-table" aria-label="保洁价格规则">
                <thead>
                  <tr>
                    <th>规则名称</th>
                    <th>保洁类型</th>
                    <th>金额</th>
                    <th>结算方式</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.priceRules.length === 0 ? (
                    <tr>
                      <td colSpan={5}>暂无价格规则</td>
                    </tr>
                  ) : dashboard.priceRules.map((rule) => (
                    <tr key={rule.id}>
                      <td>{rule.name}</td>
                      <td>{rule.cleanType}</td>
                      <td>{rule.amount}</td>
                      <td>{rule.settlementMode}</td>
                      <td><span className={`clean-setting-badge is-${rule.status}`}>{policyStatusLabel[rule.status]}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="clean-setting-card">
              <h2>运营时段</h2>
              {dashboard.schedule.length === 0 ? (
                <p className="clean-setting-empty">暂无时段任务</p>
              ) : dashboard.schedule.map((item) => (
                <div key={item.label} className={`clean-setting-schedule is-${item.tone}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </section>
          </div>

          <section className="clean-setting-quick" aria-label="保洁设置快捷入口">
            <button type="button" onClick={() => navigate('/cleanManage/cleanTask')}>查看保洁任务</button>
            <button type="button" onClick={() => navigate('/cleanManage/cleanStatistics')}>查看保洁统计</button>
            <button type="button" onClick={() => navigate('/cleanManage/cleanLog')}>查看保洁日志</button>
          </section>
        </>
      )}

      {detailRule && (
        <div className="clean-setting-modal-backdrop">
          <section role="dialog" aria-modal="true" aria-label="保洁策略详情" className="clean-setting-modal">
            <h2>保洁策略详情</h2>
            <dl>
              <div><dt>策略</dt><dd>{detailRule.name}</dd></div>
              <div><dt>适用房源</dt><dd>{detailRule.roomScope}</dd></div>
              <div><dt>执行说明</dt><dd>{detailRule.detail}</dd></div>
              <div><dt>最近更新</dt><dd>{detailRule.updatedAt}</dd></div>
            </dl>
            <button type="button" onClick={() => setDetailRule(null)}>关闭详情</button>
          </section>
        </div>
      )}

      {editRule && (
        <div className="clean-setting-modal-backdrop">
          <section role="dialog" aria-modal="true" aria-label="编辑保洁策略" className="clean-setting-modal">
            <h2>编辑保洁策略</h2>
            <strong className="clean-setting-modal-summary">{editRule.name}</strong>
            <label>
              <span>策略名称</span>
              <input value={editRule.name} readOnly />
            </label>
            <label>
              <span>触发规则</span>
              <input value={editRule.trigger} readOnly />
            </label>
            <div className="clean-setting-modal-actions">
              <button type="button" onClick={() => setEditRule(null)}>取消</button>
              <button type="button" onClick={handleSaveRule}>保存策略</button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export function CleanSettingPage() {
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

  return <CleanSettingBusinessPage key={location.search} search={location.search} />
}
