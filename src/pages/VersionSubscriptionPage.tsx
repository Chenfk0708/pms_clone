import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  calculateVersionSubscriptionTotal,
  createDefaultVersionSubscriptionFilters,
  fetchVersionSubscriptionDashboard,
  submitVersionSubscriptionOrder,
  type VersionSubscriptionDashboard,
  type VersionSubscriptionDurationId,
  type VersionSubscriptionFilters,
} from '../services/versionSubscription'
import './VersionSubscriptionPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

type LoadReason = 'initial' | 'retry' | 'refresh'

export function VersionSubscriptionPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const initialFilters = useMemo(
    () => createDefaultVersionSubscriptionFilters(new URLSearchParams(location.search)),
    [location.search],
  )

  const [filters, setFilters] = useState<VersionSubscriptionFilters>(initialFilters)
  const [dashboard, setDashboard] = useState<VersionSubscriptionDashboard | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState('delight')
  const [durationId, setDurationId] = useState<VersionSubscriptionDurationId>('1y')
  const [agreed, setAgreed] = useState(true)
  const [compareOpen, setCompareOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('版本订阅数据加载中')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters(initialFilters)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [initialFilters])

  const loadDashboard = useCallback(async (nextFilters: VersionSubscriptionFilters, reason: LoadReason) => {
    setIsLoading(true)
    setError('')

    if (reason === 'retry') {
      setFeedback('正在重新加载版本订阅数据')
    } else if (reason === 'refresh') {
      setFeedback('正在刷新版本订阅数据')
    } else {
      setFeedback('版本订阅数据加载中')
    }

    try {
      const nextDashboard = await fetchVersionSubscriptionDashboard(nextFilters)
      setDashboard(nextDashboard)
      setSelectedPlanId((current) =>
        nextDashboard.plans.some((item) => item.id === current) ? current : nextDashboard.currentPlanId,
      )
      setFeedback(nextDashboard.state === 'empty' ? '当前暂无可订阅版本' : '版本订阅数据已更新')
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '版本订阅加载失败，请稍后重试'
      setDashboard(null)
      setError(message)
      setFeedback(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard(filters, 'initial')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [filters, loadDashboard])

  const selectedPlan = dashboard?.plans.find((item) => item.id === selectedPlanId) ?? null
  const total = dashboard ? calculateVersionSubscriptionTotal(dashboard, selectedPlanId, durationId) : 0
  const canSubmit = Boolean(dashboard && selectedPlan) && !isLoading && !isSubmitting && dashboard?.state !== 'empty'

  async function handlePurchase() {
    if (!dashboard) return

    setIsSubmitting(true)
    setError('')

    try {
      const result = await submitVersionSubscriptionOrder(filters, dashboard, selectedPlanId, durationId, agreed)
      setFeedback(result.message)
      navigate(result.redirectTo)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '版本订阅操作失败，请稍后重试'
      setFeedback(message)
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handlePlanSelect(planId: string) {
    setSelectedPlanId(planId)
    setFeedback('已更新续费版本')
  }

  function handleDurationSelect(nextDurationId: VersionSubscriptionDurationId) {
    setDurationId(nextDurationId)
    setFeedback('已更新购买时长')
  }

  function handleRetry() {
    if (filters.mockState === 'error') {
      setFilters({ ...filters, mockState: 'success' })
      return
    }

    void loadDashboard(filters, 'retry')
  }

  return (
    <div
      className="version-subscription-page"
      data-provider={dashboard?.provider ?? 'mock'}
      data-response-state={error ? 'error' : dashboard?.state ?? 'loading'}
      data-selected-plan={selectedPlanId}
      data-request-camp-id={filters.campId}
    >
      <aside className="version-subscription-sidebar" aria-label="订阅中心侧栏">
        <div className="version-subscription-sidebar__root">订阅中心</div>
        <nav aria-label="订阅中心导航">
          {sideLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `version-subscription-link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <span className="version-subscription-build">版本号：{dashboard?.buildVersion ?? 'v4.10.7'}</span>
      </aside>

      <section className="version-subscription-main" aria-label="版本订阅页面">
        <section className="version-subscription-hero" aria-label="当前版本信息">
          <div>
            <h1>版本订阅</h1>
            <p>
              <span>当前版本：</span>
              <strong>{dashboard?.currentPlanName ?? '加载中'}</strong>
            </p>
            <p>有效期到：{dashboard?.expirationDate ?? '--'}</p>
            <span className="version-subscription-camp">{dashboard?.campName ?? '正在读取门店信息'}</span>
          </div>
          <div className="version-subscription-hero-actions">
            <button
              type="button"
              className="version-subscription-compare"
              disabled={!dashboard || dashboard.plans.length === 0}
              onClick={() => setCompareOpen(true)}
            >
              版本对比
            </button>
          </div>
        </section>

        <div className="version-subscription-statebar">
          <span role="status" aria-label="版本订阅操作反馈">
            {feedback}
          </span>
          {dashboard ? <span>{dashboard.requestedAt}</span> : null}
        </div>

        {isLoading ? (
          <div className="version-subscription-loading" aria-label="版本订阅加载状态">
            版本订阅数据加载中
          </div>
        ) : null}

        {error ? (
          <div className="version-subscription-error" role="alert" aria-label="版本订阅数据错误">
            <strong>版本订阅加载失败，请稍后重试</strong>
            <span>{error}</span>
            <button type="button" onClick={handleRetry}>
              重新加载
            </button>
          </div>
        ) : null}

        {!error && dashboard?.state === 'empty' ? (
          <section className="version-subscription-empty" aria-label="版本订阅空态">
            <strong>当前版本资源暂未开放</strong>
            <span>请联系业务经理确认开通状态，或稍后重新加载。</span>
          </section>
        ) : null}

        <ul className="version-subscription-plans" aria-label="版本套餐">
          {(dashboard?.plans ?? []).map((plan) => (
            <li key={plan.id}>
              <button
                type="button"
                aria-label={`选择 ${plan.name}`}
                className={`version-subscription-plan version-subscription-plan--${plan.tone}${selectedPlanId === plan.id ? ' is-active' : ''}`}
                onClick={() => handlePlanSelect(plan.id)}
              >
                <span className="version-subscription-badge">{plan.badge}</span>
                <h2>{plan.name}</h2>
                <strong>{plan.priceLabel}</strong>
                {plan.originalPriceLabel ? <em>{plan.originalPriceLabel}</em> : null}
                <p>{plan.summary}</p>
              </button>
            </li>
          ))}
        </ul>

        <section className="version-subscription-matrix" aria-label="版本能力矩阵">
          <div className="version-subscription-limits">
            <h2>版本订阅</h2>
            {(dashboard?.quotas ?? []).map((quota) => (
              <span key={quota.id}>
                {quota.name}({quota.total}
                {quota.unit})
              </span>
            ))}
          </div>
          <div className="version-subscription-features">
            <h2>功能订阅</h2>
            <div className="version-subscription-feature-grid">
              {(dashboard?.featureGroups ?? []).map((group) => (
                <section key={group.title} className="version-subscription-feature-group">
                  <h3>{group.title}</h3>
                  {group.items.map((item) => (
                    <p key={item.name} className={item.enabled ? 'is-enabled' : 'is-disabled'}>
                      {item.name}
                    </p>
                  ))}
                </section>
              ))}
            </div>
          </div>
          <div className="version-subscription-service">
            <h2>服务特权</h2>
            {(dashboard?.featureGroups.find((item) => item.title === '服务特权')?.items ?? []).map((item) => (
              <p key={item.name} className={item.enabled ? 'is-enabled' : 'is-disabled'}>
                {item.name}
              </p>
            ))}
          </div>
        </section>

        <section className="version-subscription-checkout" aria-label="续费升级">
          <strong>续费升级</strong>
          <span>{selectedPlan?.name ?? '待选择'}</span>
          <div className="version-subscription-duration" role="group" aria-label="购买时长">
            <span>购买时长:</span>
            {(dashboard?.durations ?? []).map((duration) => (
              <button
                key={duration.id}
                type="button"
                className={durationId === duration.id ? 'is-active' : ''}
                disabled={!dashboard || dashboard.state === 'empty'}
                onClick={() => handleDurationSelect(duration.id)}
              >
                {duration.label}
              </button>
            ))}
          </div>
          <div className="version-subscription-total">
            <span>总费用</span>
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
            <span>确认下单即表示您已知晓《路客云产品服务购买协议》。</span>
          </label>
          <button
            type="button"
            className="version-subscription-buy"
            disabled={!canSubmit}
            onClick={() => void handlePurchase()}
          >
            立即购买
          </button>
          <button type="button" className="version-subscription-tail" onClick={() => navigate('/version/displacementBenefit')}>
            尾房置换
          </button>
        </section>
      </section>

      {compareOpen && dashboard ? (
        <div className="version-subscription-modal" role="presentation">
          <div className="version-subscription-dialog" role="dialog" aria-modal="true" aria-label="版本对比">
            <button type="button" aria-label="关闭版本对比" onClick={() => setCompareOpen(false)}>
              ×
            </button>
            <h2>版本对比</h2>
            <p>{dashboard.compareSummary}</p>
            <div className="version-subscription-compare-grid">
              {dashboard.plans.map((plan) => (
                <article key={plan.id}>
                  <strong>{plan.name}</strong>
                  <span>{plan.priceLabel}</span>
                  <p>{plan.summary}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
