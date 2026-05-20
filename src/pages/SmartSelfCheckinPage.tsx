import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartSelfCheckinFilters,
  fetchSmartSelfCheckinDashboard,
  type SmartSelfCheckinDashboard,
  type SmartSelfCheckinPlan,
} from '../services/smartSelfCheckin'
import './SmartSelfCheckinPage.css'

type MessageDraftMap = Record<string, string>

export function SmartSelfCheckinPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboard, setDashboard] = useState<SmartSelfCheckinDashboard | null>(null)
  const [plans, setPlans] = useState<SmartSelfCheckinPlan[]>([])
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('自助入住数据加载中')
  const [isMessageEditorOpen, setIsMessageEditorOpen] = useState(false)
  const [draftMessages, setDraftMessages] = useState<MessageDraftMap>({})
  const [purchasePlan, setPurchasePlan] = useState<SmartSelfCheckinPlan | null>(null)
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const filters = createDefaultSmartSelfCheckinFilters(new URLSearchParams(location.search))

    void fetchSmartSelfCheckinDashboard(filters, controller.signal)
      .then((result) => {
        setDashboard(result)
        setPlans(result.plans)
        setEnabled(result.enabled)
        setFeedback(result.emptyState ? '当前暂无可发布的自助入住方案' : '自助入住数据已加载')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDashboard(null)
        setPlans([])
        setEnabled(false)
        setErrorMessage(error instanceof Error ? error.message : '自助入住加载失败，请稍后重试')
        setFeedback(error instanceof Error ? error.message : '自助入住加载失败，请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [location.search])

  function handleRetry() {
    setDashboard(null)
    setPlans([])
    setEnabled(false)
    setErrorMessage('')
    setFeedback('自助入住数据加载中')
    setIsLoading(true)
    navigate('/smartHotel/smartHome', { replace: true })
  }

  function handleSwitchToggle() {
    setEnabled((current) => {
      const next = !current
      setFeedback(next ? '云端入住登记已开启，短信邀请将按当前方案发送。' : '云端入住登记已关闭，新的入住邀请不会自动发送。')
      return next
    })
  }

  function openMessageEditor() {
    const nextDrafts: MessageDraftMap = {}
    for (const plan of plans) {
      nextDrafts[plan.id] = plan.messageTemplate
    }
    setDraftMessages(nextDrafts)
    setIsMessageEditorOpen(true)
  }

  function saveMessageEditor() {
    setPlans((current) =>
      current.map((plan) => ({
        ...plan,
        messageTemplate: draftMessages[plan.id] ?? plan.messageTemplate,
      })),
    )
    setIsMessageEditorOpen(false)
    setFeedback('短信模板已更新，后续入住邀请会按最新配置发送。')
  }

  async function copyTemplate(plan: SmartSelfCheckinPlan) {
    try {
      await navigator.clipboard.writeText(plan.messageTemplate)
      setFeedback(`已复制「${plan.title}」短信模板。`)
    } catch {
      setFeedback(`已选中「${plan.title}」模板，请手动复制。`)
    }
  }

  function createQrTask() {
    setFeedback('前台二维码下载任务已创建，可前往下载中心查看。')
  }

  function createKioskLead() {
    setIsExpertDialogOpen(true)
    setFeedback('已打开智慧酒店专家联系信息。')
  }

  const provider = dashboard?.provider ?? 'mock'
  const emptyState = dashboard?.emptyState

  return (
    <div
      className="smart-checkin-page"
      data-provider={provider}
      data-enabled={enabled ? 'true' : 'false'}
      data-empty={dashboard?.emptyState ? 'true' : 'false'}
    >
      <div className="smart-checkin-page__content">
        <section className="smart-checkin-panel" aria-label="云端入住登记配置">
          <header className="smart-checkin-head">
            <div>
              <h1>云端入住登记</h1>
              <p>{dashboard?.description ?? '房客在到店前，通过短信完成入住相关操作。'}</p>
            </div>
            <div className="smart-checkin-head__actions">
              <span className="smart-checkin-requested-at">{dashboard?.requestedAtLabel ?? '等待刷新数据'}</span>
              <button
                type="button"
                aria-label="云端入住登记开关"
                aria-pressed={enabled}
                className={`smart-checkin-switch${enabled ? ' is-on' : ''}`}
                onClick={handleSwitchToggle}
                disabled={isLoading || Boolean(errorMessage)}
              >
                <span />
              </button>
            </div>
          </header>

          <div className="smart-checkin-statusbar">
            <span role="status" aria-label="自助入住操作反馈">
              {feedback}
            </span>
            {dashboard ? (
              <button type="button" className="smart-checkin-link-button" onClick={() => navigate(dashboard.routes.globalSetting)}>
                前往全局设置
              </button>
            ) : null}
          </div>

          {isLoading ? <div className="smart-checkin-loading">自助入住数据加载中</div> : null}

          {errorMessage ? (
            <div className="smart-checkin-error" role="alert" aria-label="自助入住加载失败">
              <strong>自助入住加载失败</strong>
              <span>{errorMessage}</span>
              <button type="button" onClick={handleRetry}>
                重新加载
              </button>
            </div>
          ) : null}

          {!isLoading && !errorMessage && emptyState ? (
            <section className="smart-checkin-empty" aria-label="自助入住空状态">
              <strong>{emptyState.title}</strong>
              <p>{emptyState.description}</p>
              <button type="button" onClick={() => navigate(emptyState.actionPath)}>
                {emptyState.actionLabel}
              </button>
            </section>
          ) : null}

          {!isLoading && !errorMessage && !emptyState ? (
            <>
              <div className="smart-checkin-plans" aria-label="云端入住登记方式">
                {plans.map((plan) => (
                  <article key={plan.id} className="smart-checkin-plan">
                    <header>
                      <h2>{plan.title}</h2>
                      {plan.badge === 'recommended' ? (
                        <span className="smart-checkin-badge is-recommended">推荐</span>
                      ) : null}
                      {plan.badge === 'locked' ? (
                        <button
                          type="button"
                          className="smart-checkin-badge is-locked"
                          onClick={() => setPurchasePlan(plan)}
                        >
                          未开通
                        </button>
                      ) : null}
                    </header>
                    <p>{plan.description}</p>
                    <div className="smart-checkin-message">{plan.messageTemplate}</div>
                    <footer className="smart-checkin-plan__footer">
                      <button type="button" onClick={() => copyTemplate(plan)}>
                        复制短信模板
                      </button>
                      {plan.routePath ? (
                        <button type="button" onClick={() => plan.routePath && navigate(plan.routePath)}>
                          {plan.routeLabel}
                        </button>
                      ) : null}
                    </footer>
                  </article>
                ))}
              </div>

              <section className="smart-checkin-flow" aria-labelledby="smart-checkin-flow-title">
                <div className="smart-checkin-section-head">
                  <h2 id="smart-checkin-flow-title">场景流程</h2>
                  <button type="button" onClick={openMessageEditor}>
                    编辑短信内容
                  </button>
                </div>
                <div className="smart-checkin-flow__steps">
                  {dashboard?.flowSteps.map((step, index) => (
                    <div key={step.id} className="smart-checkin-flow__step-group">
                      <div className="smart-checkin-step">
                        <strong>{index + 1}</strong>
                        <span>{step.label}</span>
                      </div>
                      {index < dashboard.flowSteps.length - 1 ? <div className="smart-checkin-flow__line" /> : null}
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </section>

        <section className="smart-checkin-card smart-checkin-card--scan">
          <div>
            <h2>前台数字化（扫码）</h2>
            <p>房客到店后，扫描前台二维码，进入智住小程序，完成入住操作。</p>
          </div>
          <div className="smart-checkin-card__actions">
            <button type="button" onClick={createQrTask}>
              下载二维码
            </button>
            <button type="button" className="is-secondary" onClick={() => navigate('/smartHotel/smartSettings')}>
              查看小程序
            </button>
          </div>
        </section>

        <section className="smart-checkin-card smart-checkin-card--kiosk">
          <div>
            <h2>自助机入住</h2>
            <p>房客到店后，通过自助机完成入住操作，并同步下发门锁密码。</p>
          </div>
          <div className="smart-checkin-card__actions">
            <button type="button" onClick={createKioskLead}>
              联系智慧酒店专家
            </button>
            <button type="button" className="is-secondary" onClick={() => navigate('/smartHotel/smartHardware/mall')}>
              智能硬件商城
            </button>
          </div>
        </section>

        <section className="smart-checkin-links" aria-label="相关入口">
          <h2>相关入口</h2>
          <div className="smart-checkin-links__grid">
            <button type="button" onClick={() => navigate('/smartHotel/checkInGuide')}>
              全局设置
            </button>
            <button type="button" onClick={() => navigate('/smartHotel/smartSettings')}>
              智住小程序
            </button>
            <button type="button" onClick={() => navigate('/smartHotel/smartHardware/smartLook')}>
              智能门锁
            </button>
            <button type="button" onClick={() => navigate('/psb/list')}>
              PSB 公安对接
            </button>
          </div>
        </section>
      </div>

      {purchasePlan ? (
        <PurchaseDialog
          planTitle={purchasePlan.title}
          onClose={() => setPurchasePlan(null)}
          onContact={() => {
            setPurchasePlan(null)
            setIsExpertDialogOpen(true)
            setFeedback(`已为「${purchasePlan.title}」创建购买咨询，请联系智慧酒店专家跟进。`)
          }}
        />
      ) : null}

      {isMessageEditorOpen ? (
        <MessageEditorDialog
          plans={plans}
          draftMessages={draftMessages}
          onChange={(planId, value) =>
            setDraftMessages((current) => ({
              ...current,
              [planId]: value,
            }))
          }
          onClose={() => setIsMessageEditorOpen(false)}
          onSave={saveMessageEditor}
        />
      ) : null}

      {isExpertDialogOpen ? (
        <ExpertDialog
          onClose={() => setIsExpertDialogOpen(false)}
          onNavigate={() => {
            setIsExpertDialogOpen(false)
            navigate('/smartHotel/smartHardware/mall')
          }}
        />
      ) : null}
    </div>
  )
}

function PurchaseDialog({
  planTitle,
  onClose,
  onContact,
}: {
  planTitle: string
  onClose: () => void
  onContact: () => void
}) {
  return (
    <div className="smart-checkin-modal-backdrop">
      <div className="smart-checkin-modal" role="dialog" aria-modal="true" aria-labelledby="smart-checkin-purchase-title">
        <header>
          <h2 id="smart-checkin-purchase-title">付费购买</h2>
          <button type="button" aria-label="关闭付费购买弹窗" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-checkin-modal__body">
          <strong>{planTitle}</strong>
          <p>当前门店尚未开通该入住方案，可先联系智慧酒店专家确认开通方式与交付周期。</p>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={onContact}>
            联系专家
          </button>
        </footer>
      </div>
    </div>
  )
}

function MessageEditorDialog({
  plans,
  draftMessages,
  onChange,
  onClose,
  onSave,
}: {
  plans: SmartSelfCheckinPlan[]
  draftMessages: MessageDraftMap
  onChange: (planId: string, value: string) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <div className="smart-checkin-modal-backdrop">
      <section className="smart-checkin-editor" role="dialog" aria-modal="true" aria-labelledby="smart-checkin-editor-title">
        <header>
          <h2 id="smart-checkin-editor-title">编辑短信内容</h2>
          <button type="button" aria-label="关闭短信编辑弹窗" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-checkin-editor__body">
          {plans.map((plan) => (
            <label key={plan.id} className="smart-checkin-editor__field">
              <span>{plan.title}</span>
              <textarea
                value={draftMessages[plan.id] ?? ''}
                onChange={(event) => onChange(plan.id, event.target.value)}
                disabled={plan.badge === 'locked'}
              />
            </label>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={onSave}>
            保存模板
          </button>
        </footer>
      </section>
    </div>
  )
}

function ExpertDialog({ onClose, onNavigate }: { onClose: () => void; onNavigate: () => void }) {
  return (
    <div className="smart-checkin-modal-backdrop">
      <section className="smart-checkin-modal smart-checkin-modal--expert" role="dialog" aria-modal="true" aria-labelledby="smart-checkin-expert-title">
        <header>
          <h2 id="smart-checkin-expert-title">智慧酒店专家</h2>
          <button type="button" aria-label="关闭专家联系弹窗" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-checkin-modal__body">
          <p>已为当前门店准备自助机入住咨询。</p>
          <ul className="smart-checkin-contact-list">
            <li>服务时间：每日 09:00 - 21:00</li>
            <li>联系电话：400-860-1122</li>
            <li>跟进方式：创建咨询后 30 分钟内回呼</li>
          </ul>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            稍后处理
          </button>
          <button type="button" className="is-primary" onClick={onNavigate}>
            前往硬件商城
          </button>
        </footer>
      </section>
    </div>
  )
}
