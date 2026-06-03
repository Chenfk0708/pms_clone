import { type ReactNode, useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultLocalsMallQuery,
  fetchLocalsMallApplicableRooms,
  fetchLocalsMallDetail,
  fetchLocalsMallOverview,
  fetchLocalsMallPaymentGroups,
  getLocalsMallContract,
  type LocalsMallDetail,
  type LocalsMallOverview,
  type LocalsMallPageMode,
  type LocalsMallPaymentGroup,
  type LocalsMallProduct,
  type LocalsMallQuery,
  type LocalsMallRoomGroup,
} from '../services/localsMall'
import './LocalsMallPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

export function LocalsMallPage() {
  const location = useLocation()
  const pageMode: LocalsMallPageMode = location.pathname.endsWith('/detail') ? 'detail' : 'mall'
  const query = createDefaultLocalsMallQuery(new URLSearchParams(location.search), pageMode)

  return <LocalsMallViewShell key={`${location.pathname}${location.search}`} pageMode={pageMode} query={query} />
}

function LocalsMallViewShell({
  pageMode,
  query,
}: {
  pageMode: LocalsMallPageMode
  query: LocalsMallQuery
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const [overview, setOverview] = useState<LocalsMallOverview | null>(null)
  const [detail, setDetail] = useState<LocalsMallDetail | null>(null)
  const [roomGroups, setRoomGroups] = useState<LocalsMallRoomGroup[]>([])
  const [paymentGroups, setPaymentGroups] = useState<LocalsMallPaymentGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState(pageMode === 'mall' ? '路客商城数据加载中' : '路客商城详情加载中')
  const [isAgreementChecked, setIsAgreementChecked] = useState(false)
  const [isRoomsDialogOpen, setIsRoomsDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    const handleError = (error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const message =
        error instanceof Error
          ? error.message
          : pageMode === 'mall'
            ? '路客商城数据加载失败，请稍后重试'
            : '路客商城详情加载失败，请稍后重试'
      setErrorMessage(message)
      setFeedback(message)
    }

    if (pageMode === 'mall') {
      void fetchLocalsMallOverview(query, controller.signal)
        .then((result) => {
          setOverview(result)
          setFeedback(result.emptyState ? '当前门店暂无可采购的商品' : '路客商城数据已就绪')
        })
        .catch(handleError)
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false)
          }
        })
      return () => controller.abort()
    }

    void fetchLocalsMallDetail(query, controller.signal)
      .then((result) => {
        setDetail(result)
        setFeedback('路客商城详情已就绪')
      })
      .catch(handleError)
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [pageMode, query])

  async function openRoomsDialog() {
    if (isLoading || isRoomsDialogOpen) return
    try {
      const groups = await fetchLocalsMallApplicableRooms(query)
      setRoomGroups(groups)
      setIsRoomsDialogOpen(true)
      setFeedback('已展开适用房型')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '适用房型加载失败，请稍后重试')
    }
  }

  async function openPaymentDialog() {
    if (isLoading || isPaymentDialogOpen) return
    try {
      const groups = await fetchLocalsMallPaymentGroups(query)
      setPaymentGroups(groups)
      setIsPaymentDialogOpen(true)
      setFeedback('已展开支付方式')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '支付方式加载失败，请稍后重试')
    }
  }

  function handleRetry() {
    navigate(location.pathname, { replace: true })
  }

  function handleOpenDetail(product: LocalsMallProduct) {
    navigate(`/version/localsMall/detail?productId=${product.id}`)
  }

  function handleSubmitPurchase() {
    if (!isAgreementChecked) {
      setFeedback('请先勾选购买协议')
      return
    }

    setIsSubmitDialogOpen(true)
    setFeedback('购买申请已提交')
  }

  const provider = overview?.provider ?? detail?.provider ?? 'mock'
  const state = errorMessage ? 'error' : overview?.emptyState ? 'empty' : isLoading ? 'loading' : 'ready'
  const traceId = overview?.traceId ?? detail?.traceId ?? ''
  const contractQuery = {
    ...query,
    productId: resolveContractProductId(query, overview, detail),
  }
  const contract = getLocalsMallContract(
    contractQuery,
    provider,
    errorMessage ? 'error' : overview?.emptyState ? 'empty' : isLoading ? 'loading' : 'success',
    traceId,
  )

  return (
    <div className="locals-mall-page" data-provider={provider} data-page={pageMode} data-state={state}>
      <pre hidden data-testid="locals-mall-service-contract" data-provider={contract.provider} data-state={contract.state}>
        {JSON.stringify(contract, null, 2)}
      </pre>

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

      {pageMode === 'mall' ? (
        <MallView
          overview={overview}
          isLoading={isLoading}
          errorMessage={errorMessage}
          feedback={feedback}
          onRetry={handleRetry}
          onBuy={handleOpenDetail}
          onNavigate={navigate}
        />
      ) : (
        <DetailView
          detail={detail}
          isLoading={isLoading}
          errorMessage={errorMessage}
          isAgreementChecked={isAgreementChecked}
          onAgreementChange={setIsAgreementChecked}
          onOpenRooms={openRoomsDialog}
          onOpenPayments={openPaymentDialog}
          onRetry={handleRetry}
          onBack={() => navigate('/version/localsMall')}
          onSubmit={handleSubmitPurchase}
        />
      )}

      <StatusToast message={feedback} />

      {isRoomsDialogOpen ? (
        <Dialog title="适用房型" closeLabel="关闭适用房型" onClose={() => setIsRoomsDialogOpen(false)}>
          <div className="locals-mall-dialog-list">
            {roomGroups.map((group) => (
              <section key={group.roomCategoryId} className="locals-mall-dialog-group">
                <h3>{group.roomCategoryName}</h3>
                <p>{group.rooms.join('、')}</p>
              </section>
            ))}
          </div>
        </Dialog>
      ) : null}

      {isPaymentDialogOpen ? (
        <Dialog title="支付方式" closeLabel="关闭支付方式" onClose={() => setIsPaymentDialogOpen(false)}>
          <div className="locals-mall-dialog-list">
            {paymentGroups.map((group) => (
              <section key={group.groupType} className="locals-mall-dialog-group">
                <h3>{group.groupTypeName}</h3>
                <p>{group.paymentTypes.join('、')}</p>
              </section>
            ))}
          </div>
        </Dialog>
      ) : null}

      {isSubmitDialogOpen && detail ? (
        <Dialog title="购买申请已提交" closeLabel="关闭购买结果" onClose={() => setIsSubmitDialogOpen(false)}>
          <div className="locals-mall-submit-body">
            <h3>{detail.productName}</h3>
            <p>采购申请已进入处理队列，可继续前往智能门锁页面完成后续配置。</p>
            <div className="locals-mall-submit-actions">
              <button type="button" onClick={() => setIsSubmitDialogOpen(false)}>
                留在当前页
              </button>
              <button type="button" className="locals-mall-primary-button" onClick={() => navigate(detail.routeAfterSubmit)}>
                前往智能门锁
              </button>
            </div>
          </div>
        </Dialog>
      ) : null}
    </div>
  )
}

function MallView({
  overview,
  isLoading,
  errorMessage,
  feedback,
  onRetry,
  onBuy,
  onNavigate,
}: {
  overview: LocalsMallOverview | null
  isLoading: boolean
  errorMessage: string
  feedback: string
  onRetry: () => void
  onBuy: (product: LocalsMallProduct) => void
  onNavigate: (path: string) => void
}) {
  return (
    <main className="locals-mall-main">
      <header className="locals-mall-summary">
        <div>
          <h1>路客商城</h1>
          <p>按目标站商品结构整理系统功能与智能硬件，并保持购买链路与现有路由协调。</p>
        </div>
        <span>{overview?.requestedAtLabel ?? '最近同步：2026-05-19 11:28'}</span>
      </header>

      <section className="locals-mall-feedback-card" aria-label="路客商城数据概览">
        <strong>当前反馈</strong>
        <span>{feedback}</span>
      </section>

      {isLoading ? <div className="locals-mall-loading">路客商城数据加载中</div> : null}

      {errorMessage ? (
        <section className="locals-mall-alert" role="alert" aria-label="路客商城加载失败">
          <strong>路客商城加载失败</strong>
          <p>{errorMessage}</p>
          <button type="button" onClick={onRetry}>
            重新加载
          </button>
        </section>
      ) : null}

      {!isLoading && !errorMessage && overview?.emptyState ? (
        <EmptyStateView emptyState={overview.emptyState} onNavigate={onNavigate} />
      ) : null}

      {!isLoading && !errorMessage && overview && !overview.emptyState
        ? overview.sections.map((section) => (
            <section key={section.id} className="locals-mall-section" aria-label={section.title}>
              <h2>{section.title}</h2>
              <div
                className={`locals-mall-products ${
                  section.id === 'system' ? 'locals-mall-products--single' : 'locals-mall-products--grid'
                }`}
              >
                {section.products.map((product) => (
                  <article key={product.id} className="locals-mall-card">
                    <img className="locals-mall-thumb" src={product.image} alt={product.name} />
                    <div className="locals-mall-card__body">
                      <span className="locals-mall-card__tag">{product.tag}</span>
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <strong>{product.priceLabel}</strong>
                    </div>
                    <button type="button" onClick={() => onBuy(product)}>
                      立即购买
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))
        : null}

      <section className="locals-mall-shortcuts" aria-label="快捷入口">
        <header className="locals-mall-shortcuts__head">
          <h2>快捷入口</h2>
          <p>从商城直接衔接到智慧酒店现有页面，避免停留在无响应入口。</p>
        </header>
        <div className="locals-mall-shortcuts__grid">
          {(overview?.quickEntries ?? []).map((entry) => (
            <button key={entry.id} type="button" className="locals-mall-shortcut" onClick={() => onNavigate(entry.path)}>
              <strong>{entry.label}</strong>
              <span>{entry.description}</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}

function DetailView({
  detail,
  isLoading,
  errorMessage,
  isAgreementChecked,
  onAgreementChange,
  onOpenRooms,
  onOpenPayments,
  onRetry,
  onBack,
  onSubmit,
}: {
  detail: LocalsMallDetail | null
  isLoading: boolean
  errorMessage: string
  isAgreementChecked: boolean
  onAgreementChange: (value: boolean) => void
  onOpenRooms: () => void
  onOpenPayments: () => void
  onRetry: () => void
  onBack: () => void
  onSubmit: () => void
}) {
  return (
    <main className="locals-mall-main locals-mall-main--detail">
      <div className="locals-mall-crumb">
        <button type="button" onClick={onBack}>
          路客商城/
        </button>
        <span>详情</span>
      </div>

      {isLoading ? <div className="locals-mall-loading">路客商城详情加载中</div> : null}

      {errorMessage ? (
        <section className="locals-mall-alert" role="alert" aria-label="路客商城加载失败">
          <strong>路客商城加载失败</strong>
          <p>{errorMessage}</p>
          <button type="button" onClick={onRetry}>
            重新加载
          </button>
        </section>
      ) : null}

      {!isLoading && !errorMessage && detail ? (
        <div className="locals-mall-detail-layout">
          <section className="locals-mall-detail-media">
            <img
              className="locals-mall-detail-hero"
              src="https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com/hudson/0017687596945558.png"
              alt={detail.productName}
            />
            <div className="locals-mall-detail-copy">
              <span>{detail.requestedAtLabel}</span>
              <h1>{detail.productName}</h1>
              <p>{detail.productDescription}</p>
            </div>
          </section>

          <section className="locals-mall-purchase" aria-label="购买信息">
            <div className="locals-mall-purchase-row">
              <span>购买时长</span>
              <strong>{detail.purchaseTermLabel}</strong>
            </div>
            <div className="locals-mall-purchase-row">
              <span>购买方</span>
              <strong>{detail.buyerName}</strong>
            </div>
            <div className="locals-mall-purchase-row locals-mall-purchase-row--action">
              <span>适用房型</span>
              <div>
                <strong>{detail.roomSummary}</strong>
                <button type="button" onClick={onOpenRooms}>
                  查看适用房型
                </button>
              </div>
            </div>
            <div className="locals-mall-purchase-row locals-mall-purchase-row--action">
              <span>支付方式</span>
              <div>
                <strong>{detail.paymentSummary}</strong>
                <button type="button" onClick={onOpenPayments}>
                  查看支付方式
                </button>
              </div>
            </div>
            <div className="locals-mall-purchase-row locals-mall-purchase-row--total">
              <span>总费用</span>
              <strong>{detail.totalAmountLabel}</strong>
            </div>
            <div className="locals-mall-purchase-line" />
            <label className="locals-mall-agreement">
              <input
                type="checkbox"
                aria-label="购买协议"
                checked={isAgreementChecked}
                onChange={(event) => onAgreementChange(event.target.checked)}
              />
              <span>{detail.agreementLabel}</span>
            </label>
            <p className="locals-mall-purchase-notice">{detail.purchaseNotice}</p>
            <button type="button" className="locals-mall-primary-button locals-mall-buy" onClick={onSubmit}>
              提交购买申请
            </button>
          </section>
        </div>
      ) : null}
    </main>
  )
}

function EmptyStateView({
  emptyState,
  onNavigate,
}: {
  emptyState: NonNullable<LocalsMallOverview['emptyState']>
  onNavigate: (path: string) => void
}) {
  return (
    <section className="locals-mall-empty" aria-label="路客商城空状态">
      <strong>{emptyState.title}</strong>
      <p>{emptyState.description}</p>
      <button type="button" onClick={() => onNavigate(emptyState.actionPath)}>
        {emptyState.actionLabel}
      </button>
    </section>
  )
}

function Dialog({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string
  closeLabel: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="locals-mall-dialog-backdrop">
      <section className="locals-mall-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header className="locals-mall-dialog__header">
          <h2>{title}</h2>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function StatusToast({ message }: { message: string }) {
  return (
    <div className="locals-mall-status" role="status" aria-live="polite" aria-label="路客商城操作反馈">
      {message}
    </div>
  )
}

function resolveContractProductId(
  query: LocalsMallQuery,
  overview: LocalsMallOverview | null,
  detail: LocalsMallDetail | null,
) {
  if (detail?.productId) return detail.productId

  for (const section of overview?.sections ?? []) {
    const currentProduct = section.products.find((product) => product.id)
    if (currentProduct) return currentProduct.id
  }

  return query.productId
}
