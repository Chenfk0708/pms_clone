import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartHotelGlobalSettingFilters,
  fetchSmartHotelGlobalSettingDashboard,
  type SmartHotelGlobalSettingDashboard,
  type SmartHotelGlobalSettingGuideField,
  type SmartHotelGlobalSettingTabId,
  type SmartHotelGlobalSettingToggle,
} from '../services/smartHotelGlobalSetting'
import './SmartHotelGlobalSettingPage.css'

type DialogState = 'identity' | 'sms-templates' | 'payment-methods' | null

export function SmartHotelGlobalSettingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboard, setDashboard] = useState<SmartHotelGlobalSettingDashboard | null>(null)
  const [activeTab, setActiveTab] = useState<SmartHotelGlobalSettingTabId>('rules')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('全局设置数据加载中')

  useEffect(() => {
    const controller = new AbortController()
    const filters = createDefaultSmartHotelGlobalSettingFilters(new URLSearchParams(location.search))

    void fetchSmartHotelGlobalSettingDashboard(filters, controller.signal)
      .then((result) => {
        setDashboard(result)
        setErrorMessage('')
        setFeedback(result.emptyState ? result.emptyState.title : '全局设置数据已加载')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDashboard(null)
        setErrorMessage(error instanceof Error ? error.message : '全局设置数据加载失败，请稍后重试。')
        setFeedback('全局设置数据加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [location.search])

  function handleRetry() {
    setIsLoading(true)
    setErrorMessage('')
    setDialog(null)
    setFeedback('全局设置数据加载中')
    const nextSearchParams = new URLSearchParams(location.search)
    nextSearchParams.delete('mockState')
    navigate(
      {
        pathname: '/smartHotel/checkInGuide',
        search: nextSearchParams.toString() ? `?${nextSearchParams.toString()}` : '',
      },
      { replace: true },
    )
  }

  function handleDisabledAction(message: string) {
    setFeedback(message)
  }

  return (
    <div className="smart-global-page" data-provider={dashboard?.provider ?? 'mock'} data-state={dashboard?.state ?? 'loading'}>
      <div
        id="smart-hotel-global-setting-diagnostics"
        data-provider={dashboard?.provider ?? 'mock'}
        data-state={dashboard?.state ?? (errorMessage ? 'error' : 'loading')}
        data-request={JSON.stringify(dashboard?.requestBody ?? {})}
        data-trace-id={dashboard?.traceId ?? ''}
        hidden
      />

      <h1 className="sr-only-heading">全局设置</h1>
      <span className="smart-global-version">{dashboard?.versionLabel ?? '版本号：v4.10.7'}</span>

      <section className="smart-global-shell" aria-label="全局设置">
        <header className="smart-global-header">
          <div>
            <p className="smart-global-header__eyebrow">智慧酒店 / 智住与硬件</p>
            <h2>{dashboard?.pageTitle ?? '全局设置'}</h2>
            <span className="smart-global-header__sync">{dashboard?.syncLabel ?? '等待同步结果'}</span>
          </div>
          <div className="smart-global-header__actions">
            <button type="button" className="smart-global-link-button" onClick={() => navigate(dashboard?.routes.smsSetting ?? '/setting/balanceAndTemplate')}>
              前往短信设置
            </button>
            <button type="button" className="smart-global-link-button" onClick={() => navigate(dashboard?.routes.paymentSetting ?? '/setting/paymentSetting')}>
              前往支付设置
            </button>
          </div>
        </header>

        <div className="smart-global-tabs" role="tablist" aria-label="全局设置页签">
          {(dashboard?.tabs ?? []).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={activeTab === tab.id ? 'is-active' : ''}
              onClick={() => {
                setActiveTab(tab.id)
                setFeedback(`已切换到${tab.label}`)
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="smart-global-statusbar" role="status" aria-label="全局设置操作反馈">
          {isLoading ? '全局设置数据加载中' : feedback}
        </div>

        {errorMessage ? (
          <section className="smart-global-state smart-global-state--error" role="alert">
            <strong>全局设置数据加载失败</strong>
            <p>{errorMessage}</p>
            <button type="button" onClick={handleRetry}>
              重新加载
            </button>
          </section>
        ) : null}

        {!errorMessage && dashboard?.emptyState ? (
          <section className="smart-global-state" aria-label="全局设置空状态">
            <strong>{dashboard.emptyState.title}</strong>
            <p>{dashboard.emptyState.description}</p>
            <button type="button" onClick={() => navigate(dashboard.emptyState?.actionPath ?? '/setting/roomTypeInfo')}>
              {dashboard.emptyState.actionLabel}
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && !dashboard?.emptyState && dashboard ? (
          <>
            {activeTab === 'rules' ? (
              <RulesPanel
                dashboard={dashboard}
                onOpenIdentityDialog={() => setDialog('identity')}
                onOpenSmsTemplateDialog={() => setDialog('sms-templates')}
                onOpenPaymentDialog={() => setDialog('payment-methods')}
                onDisabledAction={handleDisabledAction}
                onRoomTypeRoute={() => navigate(dashboard.routes.roomTypeInfo)}
              />
            ) : null}

            {activeTab === 'guide' ? <GuidePanel fields={dashboard.guideFields} smartSettingsPath={dashboard.routes.smartSettings} /> : null}
            {activeTab === 'wifi' ? <WifiPanel fields={dashboard.wifiFields} /> : null}
          </>
        ) : null}

        <footer className="smart-global-footer">
          <span>{dashboard?.saveEnabled ? '当前配置可提交' : '当前模式无需保存配置'}</span>
          <button
            type="button"
            disabled={!dashboard?.saveEnabled}
            onClick={() => handleDisabledAction('当前模式无需保存配置')}
          >
            保 存
          </button>
        </footer>
      </section>

      {dialog === 'identity' && dashboard ? (
        <Modal
          title="认证与短信余量详情"
          closeLabel="关闭认证与短信余量详情"
          onClose={() => setDialog(null)}
        >
          <dl className="smart-global-dialog-list">
            <div>
              <dt>实名认证</dt>
              <dd>{dashboard.identitySummary.realNameBalance}</dd>
            </div>
            <div>
              <dt>短信余量</dt>
              <dd>{dashboard.identitySummary.smsBalance}</dd>
            </div>
            <div>
              <dt>支付通道</dt>
              <dd>{dashboard.identitySummary.channelName}</dd>
            </div>
          </dl>
        </Modal>
      ) : null}

      {dialog === 'sms-templates' && dashboard ? (
        <Modal title="短信发送模板" closeLabel="关闭短信发送模板" onClose={() => setDialog(null)}>
          <div className="smart-global-template-list">
            {dashboard.smsTemplates.map((template) => (
              <article key={template.id}>
                <strong>{template.title}</strong>
                <p>{template.content}</p>
              </article>
            ))}
          </div>
        </Modal>
      ) : null}

      {dialog === 'payment-methods' && dashboard ? (
        <Modal title="押金与收款方式" closeLabel="关闭押金与收款方式" onClose={() => setDialog(null)}>
          <div className="smart-global-payment-list">
            {dashboard.paymentMethods.map((method) => (
              <span key={method}>{method}</span>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  )
}

function RulesPanel({
  dashboard,
  onOpenIdentityDialog,
  onOpenSmsTemplateDialog,
  onOpenPaymentDialog,
  onDisabledAction,
  onRoomTypeRoute,
}: {
  dashboard: SmartHotelGlobalSettingDashboard
  onOpenIdentityDialog: () => void
  onOpenSmsTemplateDialog: () => void
  onOpenPaymentDialog: () => void
  onDisabledAction: (message: string) => void
  onRoomTypeRoute: () => void
}) {
  return (
    <div className="smart-global-rule-layout">
      <div className="smart-global-rule-main">
        <div className="smart-global-alert">{dashboard.alertText}</div>

        <section className="smart-global-section">
          <h3>入住登记方式</h3>
          <SettingLine label={dashboard.toggles.autoInvite.label}>
            <SwitchControl toggle={dashboard.toggles.autoInvite} onDisabledAction={onDisabledAction} />
            <span className="smart-global-muted">{dashboard.toggles.autoInvite.description}</span>
          </SettingLine>
        </section>

        <section className="smart-global-section">
          <h3>身份验证方式</h3>
          <div className="smart-global-field-row">
            <span className="smart-global-label">线上验证身份/预登记:</span>
            <div className="smart-global-radio-stack">
              {dashboard.guestVerificationChoices.map((choice) => (
                <RadioLine key={choice.id} selected={choice.selected} title={choice.title}>
                  {choice.selected ? (
                    <>
                      <span>剩余核验次数:</span>
                      <strong>5次</strong>
                      <button type="button" className="smart-global-small-action" onClick={onOpenIdentityDialog}>
                        充值
                      </button>
                    </>
                  ) : null}
                  {choice.description ? <p>{choice.description}</p> : null}
                </RadioLine>
              ))}
            </div>
          </div>
          <div className="smart-global-field-row">
            <span className="smart-global-label">登记要求:</span>
            <div className="smart-global-radio-stack is-compact">
              {dashboard.registerChoices.map((choice) => (
                <RadioLine key={choice.id} selected={choice.selected} title={choice.title}>
                  {choice.badge ? <span className="smart-global-tag">{choice.badge}</span> : null}
                </RadioLine>
              ))}
            </div>
          </div>
        </section>

        <section className="smart-global-section">
          <h3>押金</h3>
          <SettingLine label={dashboard.toggles.deposit.label}>
            <SwitchControl toggle={dashboard.toggles.deposit} onDisabledAction={onDisabledAction} />
            <span className="smart-global-muted">{dashboard.toggles.deposit.description}</span>
            <button type="button" className="smart-global-link-button" onClick={onOpenPaymentDialog}>
              查看支付方式
            </button>
          </SettingLine>
        </section>

        <section className="smart-global-section">
          <h3>入住状态</h3>
          <SettingLine label={dashboard.toggles.guestStatus.label}>
            <SwitchControl toggle={dashboard.toggles.guestStatus} onDisabledAction={onDisabledAction} />
            <span className="smart-global-muted">{dashboard.toggles.guestStatus.description}</span>
          </SettingLine>
          <SettingLine label={dashboard.toggles.dirtyRoomBlock.label}>
            <SwitchControl toggle={dashboard.toggles.dirtyRoomBlock} onDisabledAction={onDisabledAction} />
            <span className="smart-global-muted">{dashboard.toggles.dirtyRoomBlock.description}</span>
          </SettingLine>
        </section>

        <section className="smart-global-section">
          <h3>门锁密码</h3>
          <div className="smart-global-summary-row">
            <strong>{dashboard.roomTypeSummary}</strong>
            <button type="button" className="smart-global-link-button" onClick={onRoomTypeRoute}>
              前往房型信息
            </button>
          </div>
          <div className="smart-global-field-row">
            <span className="smart-global-label">门锁密码:</span>
            <div className="smart-global-radio-stack">
              {dashboard.roomPasswordStrategies.map((choice) => (
                <RadioLine key={choice.id} selected={choice.selected} title={choice.title}>
                  {choice.description ? <p>{choice.description}</p> : null}
                </RadioLine>
              ))}
            </div>
          </div>
          <SettingLine label={dashboard.toggles.earlyPassword.label}>
            <SwitchControl toggle={dashboard.toggles.earlyPassword} onDisabledAction={onDisabledAction} />
            <span className="smart-global-muted">{dashboard.toggles.earlyPassword.description}</span>
          </SettingLine>
          <div className="smart-global-field-row smart-global-field-row--sms">
            <span className="smart-global-label">短信发送密码</span>
            <div className="smart-global-radio-stack">
              <div className="smart-global-summary-row is-template-summary">
                <strong>{dashboard.smsTemplateSummary}</strong>
                <button type="button" className="smart-global-link-button" onClick={onOpenSmsTemplateDialog}>
                  查看短信模板
                </button>
              </div>
              {dashboard.smsSendChoices.map((choice) => (
                <RadioLine key={choice.id} selected={choice.selected} title={choice.title}>
                  {choice.description ? <p>{choice.description}</p> : null}
                </RadioLine>
              ))}
            </div>
          </div>
        </section>
      </div>

      <GuestFlowPanel steps={dashboard.flowSteps} />
    </div>
  )
}

function SettingLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="smart-global-setting-line">
      <span className="smart-global-label">{label}:</span>
      <div>{children}</div>
    </div>
  )
}

function SwitchControl({
  toggle,
  onDisabledAction,
}: {
  toggle: SmartHotelGlobalSettingToggle
  onDisabledAction: (message: string) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={toggle.label}
      aria-checked={toggle.checked}
      disabled={toggle.disabled}
      className={`smart-global-switch${toggle.checked ? ' is-on' : ''}`}
      onClick={() => onDisabledAction(`${toggle.label}当前由统一策略控制，如需调整请先切换入住模式。`)}
    >
      <span />
    </button>
  )
}

function RadioLine({ selected, title, children }: { selected?: boolean; title: string; children?: React.ReactNode }) {
  return (
    <label className={`smart-global-radio-line${selected ? ' is-selected' : ''}`}>
      <input type="radio" checked={Boolean(selected)} readOnly />
      <span>
        <strong>{title}</strong>
        {children ? <span className="smart-global-radio-extra">{children}</span> : null}
      </span>
    </label>
  )
}

function GuestFlowPanel({ steps }: { steps: string[] }) {
  return (
    <aside className="smart-global-flow" aria-label="房客入住流程">
      <h2>房客入住流程</h2>
      <div className="smart-global-flow__steps">
        {steps.map((step, index) => (
          <article key={step} className="smart-global-flow-step">
            <span>{`步骤${index + 1}`}</span>
            <strong>{step}</strong>
          </article>
        ))}
      </div>
    </aside>
  )
}

function GuidePanel({ fields, smartSettingsPath }: { fields: SmartHotelGlobalSettingGuideField[]; smartSettingsPath: string }) {
  return (
    <div className="smart-global-subpanel" aria-label="入住指引设置">
      <h2>入住指引</h2>
      <div className="smart-global-guide-grid">
        {fields.map((field) => (
          <label key={field.id}>
            {field.label}
            <textarea value={field.value} readOnly />
          </label>
        ))}
      </div>
      <div className="smart-global-guide-actions">
        <Link to={smartSettingsPath}>前往智住小程序</Link>
      </div>
    </div>
  )
}

function WifiPanel({ fields }: { fields: SmartHotelGlobalSettingGuideField[] }) {
  return (
    <div className="smart-global-subpanel" aria-label="WIFI上网设置">
      <h2>WIFI上网</h2>
      <div className="smart-global-wifi-form">
        {fields.map((field) => (
          <label key={field.id}>
            {field.label}
            {field.id === 'wifiNotice' ? (
              <textarea value={field.value} readOnly />
            ) : (
              <input aria-label={field.label} value={field.value} readOnly />
            )}
          </label>
        ))}
      </div>
    </div>
  )
}

function Modal({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string
  closeLabel: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="smart-global-modal-backdrop">
      <section className="smart-global-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            脳
          </button>
        </header>
        <div className="smart-global-modal__body">{children}</div>
      </section>
    </div>
  )
}
