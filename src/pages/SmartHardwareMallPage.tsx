import { type ReactNode, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartHardwareMallQuery,
  fetchSmartHardwareApplicableRooms,
  fetchSmartHardwareMallDetail,
  fetchSmartHardwareMallOverview,
  fetchSmartHardwarePaymentGroups,
  type SmartHardwareMallDetail,
  type SmartHardwareMallOverview,
  type SmartHardwareMallPageMode,
  type SmartHardwarePaymentGroup,
  type SmartHardwareProduct,
  type SmartHardwareRoomGroup,
} from '../services/smartHardwareMall'
import './SmartHardwareMallPage.css'

export function SmartHardwareMallPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const pageMode: SmartHardwareMallPageMode = location.pathname.endsWith('/detail') ? 'detail' : 'mall'
  const [overview, setOverview] = useState<SmartHardwareMallOverview | null>(null)
  const [detail, setDetail] = useState<SmartHardwareMallDetail | null>(null)
  const [roomGroups, setRoomGroups] = useState<SmartHardwareRoomGroup[]>([])
  const [paymentGroups, setPaymentGroups] = useState<SmartHardwarePaymentGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('智能硬件商城数据加载中')
  const [contactProduct, setContactProduct] = useState<SmartHardwareProduct | null>(null)
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isAgreementChecked, setIsAgreementChecked] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)

  function getCurrentQuery() {
    return createDefaultSmartHardwareMallQuery(new URLSearchParams(location.search), pageMode)
  }

  useEffect(() => {
    const controller = new AbortController()
    const query = getCurrentQuery()
    setOverview(null)
    setDetail(null)
    setRoomGroups([])
    setPaymentGroups([])
    setContactProduct(null)
    setIsRoomDialogOpen(false)
    setIsPaymentDialogOpen(false)
    setIsAgreementChecked(false)
    setIsSubmitDialogOpen(false)
    setErrorMessage('')
    setIsLoading(true)
    setFeedback(pageMode === 'mall' ? '智能硬件商城数据加载中' : '智能硬件详情加载中')

    const handleError = (error: unknown) => {
      if (error instanceof DOMException && error.name === 'AbortError') return
      const message =
        error instanceof Error
          ? error.message
          : pageMode === 'mall'
            ? '智能硬件商城数据加载失败，请稍后重试'
            : '智能硬件商城详情加载失败，请稍后重试'
      setErrorMessage(message)
      setFeedback(message)
    }

    if (pageMode === 'mall') {
      void fetchSmartHardwareMallOverview(query, controller.signal)
        .then((result) => {
          setOverview(result)
          setFeedback(result.emptyState ? '当前门店暂无可采购的智能硬件商品' : '智能硬件商城数据已就绪')
        })
        .catch(handleError)
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false)
          }
        })
    } else {
      void fetchSmartHardwareMallDetail(query, controller.signal)
        .then((result) => {
          setDetail(result)
          setFeedback('智能硬件详情已就绪')
        })
        .catch(handleError)
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsLoading(false)
          }
        })
    }

    return () => controller.abort()
  }, [location.pathname, location.search, pageMode])

  async function openRoomDialog() {
    if (isRoomDialogOpen || isLoading) return
    try {
      const groups = await fetchSmartHardwareApplicableRooms(getCurrentQuery())
      setRoomGroups(groups)
      setIsRoomDialogOpen(true)
      setFeedback('已展开适用房型')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '适用房型加载失败，请稍后重试')
    }
  }

  async function openPaymentDialog() {
    if (isPaymentDialogOpen || isLoading) return
    try {
      const groups = await fetchSmartHardwarePaymentGroups(getCurrentQuery())
      setPaymentGroups(groups)
      setIsPaymentDialogOpen(true)
      setFeedback('已展开支付方式')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '支付方式加载失败，请稍后重试')
    }
  }

  function openContactDialog(product: SmartHardwareProduct) {
    setContactProduct(product)
    setFeedback(`已选择 ${product.name} 咨询方案`)
  }

  function confirmContactTask() {
    if (!contactProduct) return
    setFeedback(`咨询任务已创建：${contactProduct.name}`)
    setContactProduct(null)
  }

  function handlePurchaseEntry(product: SmartHardwareProduct) {
    navigate(`/smartHotel/smartHardware/mall/detail?productId=${product.id}`)
  }

  function handleRetry() {
    navigate(location.pathname, { replace: true })
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
  const viewState = errorMessage ? 'error' : overview?.emptyState ? 'empty' : isLoading ? 'loading' : 'ready'

  return (
    <div className="smart-hardware-mall-page" data-provider={provider} data-page={pageMode} data-state={viewState}>
      {pageMode === 'mall' ? (
        <MallView
          overview={overview}
          isLoading={isLoading}
          errorMessage={errorMessage}
          feedback={feedback}
          onRetry={handleRetry}
          onContact={openContactDialog}
          onBuy={handlePurchaseEntry}
          onNavigate={navigate}
        />
      ) : (
        <DetailView
          detail={detail}
          isLoading={isLoading}
          errorMessage={errorMessage}
          feedback={feedback}
          isAgreementChecked={isAgreementChecked}
          onAgreementChange={setIsAgreementChecked}
          onOpenRooms={openRoomDialog}
          onOpenPayments={openPaymentDialog}
          onBack={() => navigate('/smartHotel/smartHardware/mall')}
          onRetry={handleRetry}
          onSubmit={handleSubmitPurchase}
        />
      )}

      <StatusToast message={feedback} />

      {contactProduct ? (
        <ContactDialog product={contactProduct} onClose={() => setContactProduct(null)} onConfirm={confirmContactTask} />
      ) : null}

      {isRoomDialogOpen ? (
        <DetailDialog
          title="适用房型"
          closeLabel="关闭适用房型"
          onClose={() => setIsRoomDialogOpen(false)}
        >
          <div className="smart-hardware-dialog-list">
            {roomGroups.map((group) => (
              <section key={group.roomCategoryId} className="smart-hardware-room-group">
                <h3>{group.roomCategoryName}</h3>
                <p>{group.rooms.join('、')}</p>
              </section>
            ))}
          </div>
        </DetailDialog>
      ) : null}

      {isPaymentDialogOpen ? (
        <DetailDialog
          title="支付方式"
          closeLabel="关闭支付方式"
          onClose={() => setIsPaymentDialogOpen(false)}
        >
          <div className="smart-hardware-dialog-list">
            {paymentGroups.map((group) => (
              <section key={group.groupType} className="smart-hardware-payment-group">
                <h3>{group.groupTypeName}</h3>
                <p>{group.paymentTypes.join('、')}</p>
              </section>
            ))}
          </div>
        </DetailDialog>
      ) : null}

      {isSubmitDialogOpen && detail ? (
        <SubmitDialog
          productName={detail.productName}
          onClose={() => setIsSubmitDialogOpen(false)}
          onNavigate={() => navigate(detail.routeAfterSubmit)}
        />
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
  onContact,
  onBuy,
  onNavigate,
}: {
  overview: SmartHardwareMallOverview | null
  isLoading: boolean
  errorMessage: string
  feedback: string
  onRetry: () => void
  onContact: (product: SmartHardwareProduct) => void
  onBuy: (product: SmartHardwareProduct) => void
  onNavigate: (path: string) => void
}) {
  return (
    <>
      <section className="smart-hardware-hero">
        <div className="smart-hardware-hero__copy">
          <p className="smart-hardware-hero__eyebrow">最近同步</p>
          <h1>{overview?.heroTitle ?? '智慧酒店一站式部署'}</h1>
          <span>{overview?.requestedAtLabel ?? '最近同步：2026-05-19 16:03'}</span>
          <strong>{overview?.heroDescription ?? '助力酒店高效运营'}</strong>
        </div>
      </section>

      <section className="smart-hardware-card-shell">
        <header className="smart-hardware-section-head">
          <div>
            <h2>硬件商品</h2>
            <p>当前按真实取证契约拆分为官方硬件与第三方咨询硬件，后续可直接切换到 API provider。</p>
          </div>
          <span className="smart-hardware-feedback-inline">{feedback}</span>
        </header>

        {isLoading ? <div className="smart-hardware-loading">智能硬件商城数据加载中</div> : null}

        {errorMessage ? (
          <div className="smart-hardware-alert" role="alert" aria-label="智能硬件商城加载失败">
            <strong>智能硬件商城加载失败</strong>
            <span>{errorMessage}</span>
            <button type="button" onClick={onRetry}>
              重新加载
            </button>
          </div>
        ) : null}

        {!isLoading && !errorMessage && overview?.emptyState ? (
          <section className="smart-hardware-empty" aria-label="智能硬件商城空状态">
            <strong>{overview.emptyState.title}</strong>
            <p>{overview.emptyState.description}</p>
            <button type="button" onClick={() => onNavigate(overview.emptyState!.actionPath)}>
              {overview.emptyState.actionLabel}
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && overview && !overview.emptyState ? (
          <section className="smart-hardware-products" aria-label="智能硬件商城商品列表">
            {overview.products.map((product) => (
              <article key={product.id} className="smart-hardware-product-card">
                <div className="smart-hardware-product-card__tag">{product.tag}</div>
                <div className="smart-hardware-product-card__content">
                  <div className="smart-hardware-product-card__image">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="smart-hardware-product-card__info">
                    <strong>{product.name}</strong>
                    <p>{product.description}</p>
                    <span>{product.priceLabel}</span>
                  </div>
                </div>
                <button type="button" onClick={() => (product.action === 'buy' ? onBuy(product) : onContact(product))}>
                  {product.action === 'buy' ? '立即购买' : '联系客服'}
                </button>
              </article>
            ))}
          </section>
        ) : null}
      </section>

      <section className="smart-hardware-shortcuts">
        <header className="smart-hardware-section-head">
          <div>
            <h2>快捷入口</h2>
            <p>从商城直接承接到智慧酒店已有页面，避免停留在无响应按钮。</p>
          </div>
        </header>
        <div className="smart-hardware-shortcuts__grid">
          {(overview?.quickEntries ?? []).map((entry) => (
            <button key={entry.id} type="button" className="smart-hardware-shortcut" onClick={() => onNavigate(entry.path)}>
              <strong>{entry.label}</strong>
              <span>{entry.description}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}

function DetailView({
  detail,
  isLoading,
  errorMessage,
  feedback,
  isAgreementChecked,
  onAgreementChange,
  onOpenRooms,
  onOpenPayments,
  onBack,
  onRetry,
  onSubmit,
}: {
  detail: SmartHardwareMallDetail | null
  isLoading: boolean
  errorMessage: string
  feedback: string
  isAgreementChecked: boolean
  onAgreementChange: (value: boolean) => void
  onOpenRooms: () => void
  onOpenPayments: () => void
  onBack: () => void
  onRetry: () => void
  onSubmit: () => void
}) {
  return (
    <section className="smart-hardware-detail-shell">
      <header className="smart-hardware-detail-head">
        <button type="button" className="smart-hardware-back-button" onClick={onBack}>
          返回商城
        </button>
        <div>
          <span>{detail?.requestedAtLabel ?? '最近同步：2026-05-19 16:03'}</span>
          <h1>{detail?.productName ?? '门卡管理系统'}</h1>
          <p>{detail?.productDescription ?? '已按真实取证契约同步适用房型与支付方式，可直接发起购买申请。'}</p>
        </div>
      </header>

      {isLoading ? <div className="smart-hardware-loading">智能硬件详情加载中</div> : null}

      {errorMessage ? (
        <div className="smart-hardware-alert" role="alert" aria-label="智能硬件商城加载失败">
          <strong>智能硬件商城加载失败</strong>
          <span>{errorMessage}</span>
          <button type="button" onClick={onRetry}>
            重新加载
          </button>
        </div>
      ) : null}

      {!isLoading && !errorMessage && detail ? (
        <div className="smart-hardware-detail-layout">
          <section className="smart-hardware-detail-card">
            <div className="smart-hardware-detail-row">
              <span>购买时长</span>
              <strong>{detail.purchaseTermLabel}</strong>
            </div>
            <div className="smart-hardware-detail-row">
              <span>购买方</span>
              <strong>{detail.buyerName}</strong>
            </div>
            <div className="smart-hardware-detail-row">
              <span>适用房型</span>
              <div className="smart-hardware-detail-row__content">
                <strong>{detail.roomSummary}</strong>
                <button type="button" onClick={onOpenRooms}>
                  查看适用房型
                </button>
              </div>
            </div>
            <div className="smart-hardware-detail-row">
              <span>支付方式</span>
              <div className="smart-hardware-detail-row__content">
                <strong>{detail.paymentSummary}</strong>
                <button type="button" onClick={onOpenPayments}>
                  查看支付方式
                </button>
              </div>
            </div>
            <div className="smart-hardware-detail-row smart-hardware-detail-row--total">
              <span>总费用</span>
              <strong>{detail.totalAmountLabel}</strong>
            </div>
            <label className="smart-hardware-agreement-row">
              <input
                type="checkbox"
                aria-label="购买协议"
                checked={isAgreementChecked}
                onChange={(event) => onAgreementChange(event.target.checked)}
              />
              <span>{detail.agreementLabel}</span>
            </label>
            <p className="smart-hardware-detail-notice">{detail.purchaseNotice}</p>
            <div className="smart-hardware-detail-actions">
              <button type="button" className="smart-hardware-primary-button" onClick={onSubmit}>
                提交购买申请
              </button>
            </div>
          </section>

          <aside className="smart-hardware-detail-aside">
            <h2>提交流程</h2>
            <ol>
              <li>确认适用房型与采购周期。</li>
              <li>核对支付方式与金额归属。</li>
              <li>提交后由智慧酒店专家接续门锁与房卡配置。</li>
            </ol>
            <div className="smart-hardware-feedback-inline">{feedback}</div>
          </aside>
        </div>
      ) : null}
    </section>
  )
}

function ContactDialog({
  product,
  onClose,
  onConfirm,
}: {
  product: SmartHardwareProduct
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <DetailDialog title="联系客服" closeLabel="关闭联系客服" onClose={onClose}>
      <div className="smart-hardware-contact-body">
        <h3>{product.name}</h3>
        <p>将为当前门店创建硬件咨询任务，并同步到智慧酒店专家跟进。</p>
        <div className="smart-hardware-contact-actions">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="smart-hardware-primary-button" onClick={onConfirm}>
            创建咨询任务
          </button>
        </div>
      </div>
    </DetailDialog>
  )
}

function SubmitDialog({
  productName,
  onClose,
  onNavigate,
}: {
  productName: string
  onClose: () => void
  onNavigate: () => void
}) {
  return (
    <DetailDialog title="购买申请已提交" closeLabel="关闭购买结果" onClose={onClose}>
      <div className="smart-hardware-contact-body">
        <h3>{productName}</h3>
        <p>采购任务已进入智慧酒店跟进队列，可继续前往智能门锁页面完成后续配置。</p>
        <div className="smart-hardware-contact-actions">
          <button type="button" onClick={onClose}>
            留在当前页
          </button>
          <button type="button" className="smart-hardware-primary-button" onClick={onNavigate}>
            前往智能门锁
          </button>
        </div>
      </div>
    </DetailDialog>
  )
}

function DetailDialog({
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
    <div className="smart-hardware-dialog-backdrop">
      <section className="smart-hardware-dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header className="smart-hardware-dialog__header">
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
    <div className="smart-hardware-status" role="status" aria-live="polite" aria-label="智能硬件商城操作反馈">
      {message}
    </div>
  )
}
