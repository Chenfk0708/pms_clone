import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import {
  APPLICATION_PAYMENT_ROOMS_PATH,
  APPLICATION_PAYMENT_TYPES_V2_PATH,
  APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH,
  createDefaultApplicationPaymentDetailRequest,
  fetchApplicationPaymentDetail,
  type ApplicationPaymentDetailRequest,
  type ApplicationPaymentDetailView,
} from '../services/applicationPayment'
import './ApplicationPaymentDetailPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

export function ApplicationPaymentDetailPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const routeState = location.state as { product?: string } | null
  const initialRequest = useMemo(
    () => createDefaultApplicationPaymentDetailRequest(searchParams, routeState),
    [searchParams, routeState],
  )

  return <ApplicationPaymentDetailBoard key={`${searchParams.toString()}-${routeState?.product ?? 'default'}`} initialRequest={initialRequest} />
}

function ApplicationPaymentDetailBoard({ initialRequest }: { initialRequest: ApplicationPaymentDetailRequest }) {
  const navigate = useNavigate()
  const [request] = useState(initialRequest)
  const [detail, setDetail] = useState<ApplicationPaymentDetailView | null>(null)
  const [feedback, setFeedback] = useState('应用订阅详情加载中')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)

  const loadDetail = useCallback(async () => {
    setIsLoading(true)
    setError('')
    setFeedback('应用订阅详情加载中')

    try {
      const nextDetail = await fetchApplicationPaymentDetail(request)
      setDetail(nextDetail)
      setFeedback(nextDetail.feedback)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '应用订阅详情加载失败，请稍后重试'
      setDetail(null)
      setError(message)
      setFeedback(message)
    } finally {
      setIsLoading(false)
    }
  }, [request])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDetail()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadDetail])

  const provider = detail?.provider ?? 'mock'
  const contract = {
    provider,
    productId: request.productId,
    campId: request.campId,
    paths: {
      paymentTypesV2: APPLICATION_PAYMENT_TYPES_V2_PATH,
      weiRoomCategories: APPLICATION_PAYMENT_WEI_ROOM_CATEGORY_PATH,
      rooms: APPLICATION_PAYMENT_ROOMS_PATH,
    },
    audit: detail?.audit ?? [],
  }

  return (
    <div
      className="application-payment-detail-page"
      data-provider={provider}
      data-product-id={request.productId}
      data-request-mock-state={request.mockState}
    >
      <aside className="application-payment-detail-sidebar" aria-label="订阅中心侧栏">
        <div className="application-payment-detail-sidebar__root">订阅中心</div>
        <nav aria-label="订阅中心侧栏">
          {sideLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `application-payment-detail-link${isActive || item.path === '/version/applicationPayment' ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <span className="application-payment-detail-build">版本号：v4.10.7</span>
      </aside>

      <main className="application-payment-detail-main">
        <section className="application-payment-detail-contract" aria-label="应用订阅详情数据服务">
          <pre>{JSON.stringify(contract, null, 2)}</pre>
        </section>

        <div className="application-payment-detail-feedback" role="status" aria-live="polite" aria-label="应用订阅详情操作反馈">
          {feedback}
        </div>

        {isLoading ? (
          <section className="application-payment-detail-state application-payment-detail-state--loading" aria-label="应用订阅详情加载状态">
            <strong>正在同步购买详情</strong>
            <p>正在刷新商品详情与购买信息，请稍候。</p>
          </section>
        ) : null}

        {error ? (
          <section className="application-payment-detail-state application-payment-detail-state--error" role="alert" aria-label="应用订阅详情数据错误">
            <strong>应用订阅详情加载失败</strong>
            <p>{error}</p>
            <button type="button" onClick={() => void loadDetail()}>
              重试
            </button>
          </section>
        ) : null}

        {!isLoading && !error && detail ? (
          <div className="application-payment-detail-layout">
            <section className="application-payment-detail-product">
              <section className={`application-payment-detail-hero application-payment-detail-hero--${detail.product.iconTone}`}>
                <div className={`application-payment-detail-icon application-payment-detail-icon--${detail.product.iconTone}`} aria-hidden="true">
                  {detail.product.iconText}
                </div>
                <div>
                  <h1>{detail.product.name}</h1>
                  <p>{detail.product.description}</p>
                </div>
              </section>

              <section className="application-payment-detail-card" aria-label="商品详情">
                <h2>{detail.product.detailTitle}</h2>
                <div className="application-payment-detail-summary">
                  <strong>{detail.product.name}</strong>
                  {detail.product.detailLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </section>
            </section>

            <aside className="application-payment-detail-purchase" aria-label="购买信息">
              <h2>购买信息</h2>
              <div className="application-payment-detail-row">
                <span>商品价格</span>
                <strong>{detail.purchaseInfo.priceLabel}</strong>
                {detail.purchaseInfo.originalPriceLabel ? <em>{detail.purchaseInfo.originalPriceLabel}</em> : null}
              </div>
              <div className="application-payment-detail-row application-payment-detail-row--duration">
                <span>购买时长</span>
                <strong>{detail.purchaseInfo.durationMeta}</strong>
                <em>{detail.purchaseInfo.durationLabel}</em>
              </div>
              <div className="application-payment-detail-row">
                <span>订单金额</span>
                <strong>{detail.purchaseInfo.orderAmountLabel}</strong>
                <em>明细</em>
              </div>
              <label className="application-payment-detail-agreement">
                <input
                  type="checkbox"
                  aria-label={detail.agreementLabel}
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                />
                <span>{detail.agreementLabel}</span>
              </label>
              <div className="application-payment-detail-actions">
                <button type="button" className="is-secondary" onClick={() => navigate('/version/applicationPayment')}>
                  返回目录
                </button>
                <button type="button" disabled={!agreed}>
                  立即购买
                </button>
              </div>
            </aside>
          </div>
        ) : null}
      </main>
    </div>
  )
}
