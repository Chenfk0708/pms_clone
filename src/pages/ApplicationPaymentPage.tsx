import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import {
  APPLICATION_PAYMENT_RESOURCE_PATH,
  APPLICATION_PAYMENT_ROOM_CATEGORY_PATH,
  APPLICATION_PAYMENT_STORE_PATH,
  APPLICATION_PAYMENT_TYPES_PATH,
  APPLICATION_PAYMENT_WAYS_PATH,
  buildApplicationPaymentRequest,
  createDefaultApplicationPaymentFilters,
  fetchApplicationPaymentDashboard,
  type ApplicationPaymentCard,
  type ApplicationPaymentCategory,
  type ApplicationPaymentDashboard,
  type ApplicationPaymentFilters,
} from '../services/applicationPayment'
import './ApplicationPaymentPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

const tabs: Array<{ label: string; value: ApplicationPaymentCategory }> = [
  { label: '全部', value: 'all' },
  { label: '渠道直连', value: 'channel' },
  { label: '功能订阅', value: 'feature' },
]

type LoadReason = 'initial' | 'tab' | 'retry'

export function ApplicationPaymentPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialFilters = useMemo(() => createDefaultApplicationPaymentFilters(searchParams), [searchParams])

  function updateSearchParamCategory(category: ApplicationPaymentCategory) {
    const next = new URLSearchParams(searchParams)
    if (category === 'all') {
      next.delete('applicationPaymentCategory')
    } else {
      next.set('applicationPaymentCategory', category)
    }
    setSearchParams(next, { replace: true })
  }

  return (
    <ApplicationPaymentBoard
      key={searchParams.toString()}
      initialFilters={initialFilters}
      onChangeCategory={updateSearchParamCategory}
    />
  )
}

function ApplicationPaymentBoard({
  initialFilters,
  onChangeCategory,
}: {
  initialFilters: ApplicationPaymentFilters
  onChangeCategory: (category: ApplicationPaymentCategory) => void
}) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<ApplicationPaymentFilters>(initialFilters)
  const [dashboard, setDashboard] = useState<ApplicationPaymentDashboard | null>(null)
  const [feedback, setFeedback] = useState('应用订阅数据加载中')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const loadDashboard = useCallback(async (nextFilters: ApplicationPaymentFilters, reason: LoadReason) => {
    setIsLoading(true)
    setError('')
    setFeedback(reason === 'tab' ? '正在切换应用订阅目录' : '应用订阅数据加载中')

    try {
      const nextDashboard = await fetchApplicationPaymentDashboard(nextFilters)
      setDashboard(nextDashboard)
      setFeedback(
        nextDashboard.sections.length === 0
          ? '暂无可展示的应用订阅商品'
          : reason === 'tab'
            ? '已按目录切换应用订阅商品'
            : nextDashboard.feedback,
      )
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '应用订阅数据加载失败，请稍后重试'
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

  function handleTabChange(category: ApplicationPaymentCategory) {
    const nextFilters = { ...filters, category }
    setFilters(nextFilters)
    onChangeCategory(category)
    void loadDashboard(nextFilters, 'tab')
  }

  function handleRetry() {
    void loadDashboard(filters, 'retry')
  }

  function handleCardAction(card: ApplicationPaymentCard) {
    if (card.action.type === 'use') {
      navigate(card.action.routeTarget)
      return
    }

    if (card.action.type === 'subscribe') {
      navigate(`/version/applicationPayment/detail${card.action.detailSearch ?? ''}`, {
        state: card.action.detailState,
      })
      return
    }

    setFeedback(card.action.feedback)
  }

  const provider = dashboard?.provider ?? 'mock'
  const contract = {
    provider,
    request: buildApplicationPaymentRequest(filters),
    paths: {
      resource: APPLICATION_PAYMENT_RESOURCE_PATH,
      paymentTypes: APPLICATION_PAYMENT_TYPES_PATH,
      stores: APPLICATION_PAYMENT_STORE_PATH,
      roomCategories: APPLICATION_PAYMENT_ROOM_CATEGORY_PATH,
      paymentWays: APPLICATION_PAYMENT_WAYS_PATH,
    },
    audit: dashboard?.audit ?? [],
  }

  return (
    <div
      className="application-payment-page"
      data-provider={provider}
      data-request-category={filters.category}
      data-request-mock-state={filters.mockState}
    >
      <section className="application-payment-contract" aria-label="应用订阅数据服务">
        <pre>{JSON.stringify(contract, null, 2)}</pre>
      </section>

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
        <header className="application-payment-toolbar">
          <div className="application-payment-tabs" role="tablist" aria-label="应用订阅分类">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filters.category === tab.value}
                onClick={() => handleTabChange(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="application-payment-feedback" role="status" aria-live="polite" aria-label="应用订阅操作反馈">
            {feedback}
          </div>
        </header>

        {isLoading ? (
          <section className="application-payment-state application-payment-state--loading" aria-label="应用订阅加载状态">
            <strong>正在同步应用订阅目录</strong>
            <p>正在刷新渠道直连与功能订阅商品，请稍候。</p>
          </section>
        ) : null}

        {error ? (
          <section className="application-payment-state application-payment-state--error" role="alert" aria-label="应用订阅数据错误">
            <strong>应用订阅数据加载失败</strong>
            <p>{error}</p>
            <button type="button" onClick={handleRetry}>
              重试
            </button>
          </section>
        ) : null}

        {!isLoading && !error && dashboard && dashboard.sections.length === 0 ? (
          <section className="application-payment-state application-payment-state--empty" aria-label="应用订阅空状态">
            <strong>当前条件下暂无应用订阅商品</strong>
            <p>可以切换目录或确认当前门店订阅状态后再查看。</p>
          </section>
        ) : null}

        {!isLoading && !error && dashboard
          ? dashboard.sections.map((section) => (
              <section key={section.id} className="application-payment-section" aria-label={section.title}>
                <h2>{section.title}</h2>
                <div className="application-payment-grid">
                  {section.cards.map((card) => (
                    <article key={card.id} className="application-payment-card">
                      <div className={`application-payment-icon application-payment-icon--${card.iconTone}`} aria-hidden="true">
                        {card.iconText}
                      </div>
                      <div className="application-payment-card__body">
                        <header>
                          <h3>{card.name}</h3>
                          {card.badge ? <span className="application-payment-status">{card.badge}</span> : null}
                        </header>
                        <p className="application-payment-price">
                          <strong>{card.priceLabel}</strong>
                          {card.originalPriceLabel ? <del>{card.originalPriceLabel}</del> : null}
                        </p>
                        <p className="application-payment-desc">{card.description}</p>
                      </div>
                      <footer>
                        <span className={`application-payment-tag application-payment-tag--${card.category}`}>{card.tag}</span>
                        <button
                          type="button"
                          className={card.action.type === 'use' ? 'is-secondary' : ''}
                          disabled={card.action.type === 'disabled'}
                          aria-label={`${card.action.label} ${card.name}`}
                          onClick={() => handleCardAction(card)}
                        >
                          {card.action.label}
                        </button>
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            ))
          : null}
      </main>
    </div>
  )
}
