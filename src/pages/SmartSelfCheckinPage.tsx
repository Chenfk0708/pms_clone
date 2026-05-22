import { useEffect, useState, type MouseEvent, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartSelfCheckinFilters,
  fetchSmartSelfCheckinDashboard,
  type SmartSelfCheckinDashboard,
  type SmartSelfCheckinFlowStep,
  type SmartSelfCheckinPlan,
} from '../services/smartSelfCheckin'
import './SmartSelfCheckinPage.css'

type SectionId = 'cloud' | 'scan' | 'kiosk'

type DeviceKind =
  | 'kiosk-desktop'
  | 'kiosk-wall'
  | 'door-qr'
  | 'door-nfc'
  | 'door-face'
  | 'door-password'
  | 'door-card'
  | 'door-phone'
  | 'wifi-router'
  | 'wifi-router-alt'
  | 'locker'

type DeviceGroup = {
  title: string
  cards: Array<{
    title: string
    kind: DeviceKind
  }>
}

const scanFlowSteps: SmartSelfCheckinFlowStep[] = [
  { id: 'scan-arrive', label: '到达酒店' },
  { id: 'scan-qr', label: '扫描智住二维码' },
  { id: 'scan-mini-program', label: '进入智住小程序' },
  { id: 'scan-identity', label: '身份登记' },
  { id: 'scan-deposit', label: '缴纳押金' },
  { id: 'scan-checkin', label: '办理入住' },
  { id: 'scan-password', label: '查看门锁密码' },
]

const kioskFlowSteps: SmartSelfCheckinFlowStep[] = [
  { id: 'kiosk-arrive', label: '到达酒店' },
  { id: 'kiosk-checkin', label: '入住办理' },
  { id: 'kiosk-identity', label: '身份识别' },
  { id: 'kiosk-door', label: '获取房间开门权限' },
  { id: 'kiosk-wifi', label: '连接WIFI' },
  { id: 'kiosk-luggage', label: '行李寄存' },
]

const kioskDeviceGroups: DeviceGroup[] = [
  {
    title: '入住办理',
    cards: [
      { title: '选配台式自助机', kind: 'kiosk-desktop' },
      { title: '选配嵌入式自助机', kind: 'kiosk-wall' },
    ],
  },
  {
    title: '获取房间开门权限',
    cards: [
      { title: '二维码取房卡', kind: 'door-qr' },
      { title: '碰一碰开门', kind: 'door-nfc' },
      { title: '刷脸开门', kind: 'door-face' },
      { title: '密码开门', kind: 'door-password' },
      { title: '刷卡开门', kind: 'door-card' },
      { title: '二维码房卡', kind: 'door-phone' },
    ],
  },
  {
    title: '连接WIFI',
    cards: [
      { title: '路由器S1', kind: 'wifi-router' },
      { title: '路由器S2', kind: 'wifi-router-alt' },
    ],
  },
  {
    title: '行李寄存柜',
    cards: [{ title: '行李寄存柜', kind: 'locker' }],
  },
]

export function SmartSelfCheckinPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboard, setDashboard] = useState<SmartSelfCheckinDashboard | null>(null)
  const [plans, setPlans] = useState<SmartSelfCheckinPlan[]>([])
  const [enabled, setEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('自助入住数据加载中')
  const [purchasePlan, setPurchasePlan] = useState<SmartSelfCheckinPlan | null>(null)
  const [isExpertDialogOpen, setIsExpertDialogOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('password-only')
  const [collapsedSections, setCollapsedSections] = useState<Record<SectionId, boolean>>({
    cloud: false,
    scan: false,
    kiosk: false,
  })

  useEffect(() => {
    const controller = new AbortController()
    const filters = createDefaultSmartSelfCheckinFilters(new URLSearchParams(location.search))

    setIsLoading(true)
    setErrorMessage('')

    void fetchSmartSelfCheckinDashboard(filters, controller.signal)
      .then((result) => {
        setDashboard(result)
        setPlans(result.plans)
        setEnabled(result.enabled)
        setSelectedPlanId(result.plans.find((plan) => plan.badge !== 'locked')?.id ?? result.plans[0]?.id ?? '')
        setFeedback(result.emptyState ? '当前暂无可发布的自助入住方案' : '自助入住数据已加载')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDashboard(null)
        setPlans([])
        setEnabled(false)
        setSelectedPlanId('')
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
    setSelectedPlanId('')
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

  function toggleSection(sectionId: SectionId) {
    setCollapsedSections((current) => ({
      ...current,
      [sectionId]: !current[sectionId],
    }))
  }

  function isSectionHeaderActionTarget(target: EventTarget | null) {
    return target instanceof HTMLElement && Boolean(target.closest('button, a, input, textarea, select, label'))
  }

  function handleSectionHeaderToggle(sectionId: SectionId, event: MouseEvent<HTMLElement>) {
    if (isSectionHeaderActionTarget(event.target)) return

    toggleSection(sectionId)
  }

  function createQrTask() {
    setFeedback('二维码下载任务已创建，可前往下载中心查看。')
  }

  function createKioskLead() {
    setIsExpertDialogOpen(true)
    setFeedback('已打开智慧酒店专家联系信息。')
  }

  function handlePlanSelect(plan: SmartSelfCheckinPlan) {
    if (plan.badge === 'locked') {
      setPurchasePlan(plan)
      return
    }

    setSelectedPlanId(plan.id)
    setFeedback(`已切换到「${plan.title}」方案。`)
  }

  const provider = dashboard?.provider ?? 'mock'
  const emptyState = dashboard?.emptyState
  const activePlan = plans.find((plan) => plan.id === selectedPlanId) ?? plans[0] ?? null
  const cloudFlowSteps = getFlowStepsForPlan(activePlan, dashboard?.flowSteps ?? [])
  const globalSettingPath = dashboard?.routes.globalSetting ?? '/smartHotel/checkInGuide'
  const hardwareMallPath = dashboard?.routes.hardwareMall ?? '/smartHotel/smartHardware/mall'

  return (
    <div
      className="smart-checkin-page"
      data-provider={provider}
      data-enabled={enabled ? 'true' : 'false'}
      data-empty={emptyState ? 'true' : 'false'}
    >
      <div className="smart-checkin-page__content">
        <section className="smart-checkin-hero" aria-label="智慧酒店自助入住介绍">
          <div className="smart-checkin-hero__copy">
            <h1>智慧酒店：全场景自助入住</h1>
            <p>路客云支持三种数字化自助入住模式，灵活适配酒店、民宿、公寓等全业态。同时可自由选配智能硬件组合，部署无人酒店，实现降本增效。</p>
          </div>
          <div className="smart-checkin-hero__art" aria-hidden="true">
            <span className="smart-checkin-hero__beam" />
            <span className="smart-checkin-hero__platform smart-checkin-hero__platform--main" />
            <span className="smart-checkin-hero__platform smart-checkin-hero__platform--side" />
            <span className="smart-checkin-hero__tower" />
            <span className="smart-checkin-hero__device smart-checkin-hero__device--kiosk" />
            <span className="smart-checkin-hero__device smart-checkin-hero__device--phone" />
          </div>
        </section>

        <section className="smart-checkin-section smart-checkin-section--cloud" aria-labelledby="smart-checkin-cloud-title">
          <header
            className="smart-checkin-section__header smart-checkin-section__header--interactive"
            onClick={(event) => handleSectionHeaderToggle('cloud', event)}
          >
            <div className="smart-checkin-section__meta">
              <div className="smart-checkin-section__icon smart-checkin-section__icon--cloud" aria-hidden="true">
                <CloudIcon />
              </div>
              <div>
                <h2 id="smart-checkin-cloud-title">云端入住登记</h2>
                <p>房客在到店前，通过短信完成入住相关操作</p>
              </div>
            </div>
            <div className="smart-checkin-section__controls">
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
              <button
                type="button"
                className={`smart-checkin-collapse${collapsedSections.cloud ? ' is-collapsed' : ''}`}
                aria-label="云端入住登记展开收起"
                aria-expanded={!collapsedSections.cloud}
                onClick={() => toggleSection('cloud')}
              >
                <ChevronIcon />
              </button>
            </div>
          </header>

          <div className={`smart-checkin-section__body${collapsedSections.cloud ? ' is-hidden' : ''}`}>
            <span role="status" aria-label="自助入住操作反馈" className="smart-checkin-status">
              {feedback}
            </span>

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
                  {plans.map((plan) => {
                    const isLocked = plan.badge === 'locked'
                    const isActive = plan.id === selectedPlanId
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        className={`smart-checkin-plan${isActive ? ' is-active' : ''}${isLocked ? ' is-locked' : ''}`}
                        onClick={() => handlePlanSelect(plan)}
                        aria-pressed={isActive}
                      >
                        <span className="smart-checkin-plan__head">
                          <span className="smart-checkin-plan__title">{plan.title}</span>
                          {plan.badge === 'recommended' ? <span className="smart-checkin-badge is-recommended">推荐</span> : null}
                          {isLocked ? <span className="smart-checkin-badge is-locked">未开通</span> : null}
                        </span>
                        <span className="smart-checkin-plan__description">{plan.description}</span>
                        <span className="smart-checkin-message">{plan.messageTemplate}</span>
                      </button>
                    )
                  })}
                </div>

                <SceneFlow
                  title="场景流程"
                  action={
                    <button type="button" onClick={() => navigate('/setting/balanceAndTemplate')}>
                      编辑短信内容
                    </button>
                  }
                  steps={cloudFlowSteps}
                />
              </>
            ) : null}
          </div>
        </section>

        <section className="smart-checkin-section" aria-labelledby="smart-checkin-scan-title">
          <header
            className="smart-checkin-section__header smart-checkin-section__header--interactive"
            onClick={(event) => handleSectionHeaderToggle('scan', event)}
          >
            <div className="smart-checkin-section__meta">
              <div className="smart-checkin-section__icon smart-checkin-section__icon--scan" aria-hidden="true">
                <PhoneIcon />
              </div>
              <div>
                <h2 id="smart-checkin-scan-title">前台数字化（扫码）</h2>
                <p>房客到店后，扫描前台二维码，进入智住小程序，完成入住操作</p>
              </div>
            </div>
            <div className="smart-checkin-section__controls">
              <button type="button" className="smart-checkin-outline-button smart-checkin-outline-button--primary" onClick={createQrTask}>
                下载二维码
              </button>
              <button
                type="button"
                className={`smart-checkin-collapse${collapsedSections.scan ? ' is-collapsed' : ''}`}
                aria-label="前台数字化（扫码）展开收起"
                aria-expanded={!collapsedSections.scan}
                onClick={() => toggleSection('scan')}
              >
                <ChevronIcon />
              </button>
            </div>
          </header>

          <div className={`smart-checkin-section__body${collapsedSections.scan ? ' is-hidden' : ''}`}>
            <SceneFlow
              title="场景流程"
              action={
                <button type="button" onClick={() => navigate(globalSettingPath)}>
                  全局设置
                </button>
              }
              steps={scanFlowSteps}
            />
          </div>
        </section>

        <section className="smart-checkin-section" aria-labelledby="smart-checkin-kiosk-title">
          <header
            className="smart-checkin-section__header smart-checkin-section__header--interactive"
            onClick={(event) => handleSectionHeaderToggle('kiosk', event)}
          >
            <div className="smart-checkin-section__meta">
              <div className="smart-checkin-section__icon smart-checkin-section__icon--kiosk" aria-hidden="true">
                <KioskIcon />
              </div>
              <div>
                <h2 id="smart-checkin-kiosk-title">自助机入住</h2>
                <p>房客到店后，通过自助机完成入住操作</p>
              </div>
            </div>
            <div className="smart-checkin-section__controls">
              <button type="button" className="smart-checkin-outline-button" onClick={createKioskLead}>
                联系智慧酒店专家
              </button>
              <button
                type="button"
                className={`smart-checkin-collapse${collapsedSections.kiosk ? ' is-collapsed' : ''}`}
                aria-label="自助机入住展开收起"
                aria-expanded={!collapsedSections.kiosk}
                onClick={() => toggleSection('kiosk')}
              >
                <ChevronIcon />
              </button>
            </div>
          </header>

          <div className={`smart-checkin-section__body${collapsedSections.kiosk ? ' is-hidden' : ''}`}>
            <SceneFlow
              title="场景流程"
              extra={
                <p className="smart-checkin-flow__helper">
                  可搭配更多智能硬件，前往
                  <Link to={hardwareMallPath}>智能硬件商城</Link>
                  查看
                </p>
              }
              steps={kioskFlowSteps}
            />

            <div className="smart-checkin-device-groups">
              {kioskDeviceGroups.map((group) => (
                <section key={group.title} className={`smart-checkin-device-group smart-checkin-device-group--${toGroupModifier(group.title)}`}>
                  <h3>{group.title}</h3>
                  <div className="smart-checkin-device-grid">
                    {group.cards.map((card) => (
                      <article key={card.title} className="smart-checkin-device-card">
                        <div className={`smart-checkin-device-art smart-checkin-device-art--${card.kind}`} aria-hidden="true">
                          <DeviceIllustration kind={card.kind} />
                        </div>
                        <strong>{card.title}</strong>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
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

      {isExpertDialogOpen ? (
        <ExpertDialog
          onClose={() => setIsExpertDialogOpen(false)}
          onNavigate={() => {
            setIsExpertDialogOpen(false)
            navigate(hardwareMallPath)
          }}
        />
      ) : null}
    </div>
  )
}

function SceneFlow({
  title,
  action,
  extra,
  steps,
}: {
  title: string
  action?: ReactNode
  extra?: ReactNode
  steps: SmartSelfCheckinFlowStep[]
}) {
  return (
    <section className="smart-checkin-flow" aria-label={title}>
      <div className="smart-checkin-section-head">
        <div className="smart-checkin-flow__label">
          <FlowIcon />
          <h3>{title}</h3>
        </div>
        {action ?? extra}
      </div>
      <div className="smart-checkin-flow__steps">
        {steps.map((step, index) => (
          <div key={step.id} className="smart-checkin-flow__step-group">
            <div className="smart-checkin-step">
              <strong>{index + 1}</strong>
              <span>{step.label}</span>
            </div>
            {index < steps.length - 1 ? <div className="smart-checkin-flow__line" /> : null}
          </div>
        ))}
      </div>
    </section>
  )
}

function getFlowStepsForPlan(
  activePlan: SmartSelfCheckinPlan | null,
  fallbackSteps: SmartSelfCheckinFlowStep[],
): SmartSelfCheckinFlowStep[] {
  if (!activePlan) return fallbackSteps

  switch (activePlan.id) {
    case 'mini-program':
      return [
        { id: 'sms', label: '接收短信' },
        { id: 'mini-program-entry', label: '进入智住小程序' },
        { id: 'identity', label: '身份登记' },
        { id: 'deposit', label: '缴纳押金' },
        { id: 'checkin', label: '办理入住' },
        { id: 'password', label: '查看门锁密码' },
      ]
    case 'wecom-service':
      return [
        { id: 'sms', label: '接收短信' },
        { id: 'wecom', label: '添加企微' },
        { id: 'service', label: '人工接待入住' },
      ]
    case 'wechat-official':
      return [
        { id: 'sms', label: '接收短信' },
        { id: 'follow', label: '关注公众号' },
        { id: 'register', label: '办理登记入住' },
      ]
    default:
      return fallbackSteps
  }
}

function toGroupModifier(title: string) {
  switch (title) {
    case '入住办理':
      return 'checkin'
    case '获取房间开门权限':
      return 'door'
    case '连接WIFI':
      return 'wifi'
    default:
      return 'locker'
  }
}

function DeviceIllustration({ kind }: { kind: DeviceKind }) {
  switch (kind) {
    case 'kiosk-desktop':
      return (
        <>
          <span className="device-screen" />
          <span className="device-stand" />
        </>
      )
    case 'kiosk-wall':
      return (
        <>
          <span className="device-panel" />
          <span className="device-base" />
        </>
      )
    case 'door-qr':
    case 'door-nfc':
    case 'door-face':
    case 'door-password':
    case 'door-card':
      return (
        <>
          <span className="device-door" />
          <span className="device-handle" />
        </>
      )
    case 'door-phone':
      return (
        <>
          <span className="device-phone" />
          <span className="device-phone-code" />
        </>
      )
    case 'wifi-router':
    case 'wifi-router-alt':
      return (
        <>
          <span className="device-router" />
          <span className="device-router-antenna device-router-antenna--left" />
          <span className="device-router-antenna device-router-antenna--right" />
        </>
      )
    case 'locker':
      return (
        <>
          <span className="device-locker" />
          <span className="device-locker-split" />
        </>
      )
  }
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
            <li>跟进方式：创建咨询后 30 分钟内回电</li>
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

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.4 18.2h8.9a4 4 0 0 0 .5-8 5.1 5.1 0 0 0-9.8-1.2 3.7 3.7 0 0 0 .4 7.2Z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="4" width="8" height="16" rx="2.4" />
      <path d="M10.5 7.3h3M11.2 17h1.6" />
    </svg>
  )
}

function KioskIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 4.8h6a2 2 0 0 1 2 2v5.7a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6.8a2 2 0 0 1 2-2Z" />
      <path d="M10.2 17.2h3.6l1.2 2H9Z" />
    </svg>
  )
}

function FlowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="5" width="5" height="5" rx="1.2" />
      <rect x="14" y="14" width="5" height="5" rx="1.2" />
      <path d="M10 7.5h3.4v9H14" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m8 10 4 4 4-4" />
    </svg>
  )
}
