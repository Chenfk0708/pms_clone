import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmsSettingFilters,
  fetchSmsSettingDashboard,
  readSmsSettingDiagnostics,
  type SmsSettingChannelOption,
  type SmsSettingRechargePlan,
  type SmsSettingRechargeRecord,
  type SmsSettingSection,
  type SmsSettingTemplate,
  type SmsSettingViewModel,
} from '../services/smsSetting'
import './SmsSettingPage.css'

type LocalDialogState = 'recharge' | 'rechargeRecord' | 'channel' | 'sign' | 'template' | null

export function SmsSettingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useMemo(() => createDefaultSmsSettingFilters(new URLSearchParams(location.search)), [location.search])
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${filters.campId}:${filters.mockState}:${reloadKey}`
  const [viewModel, setViewModel] = useState<SmsSettingViewModel | null>(null)
  const [settledRequestKey, setSettledRequestKey] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('正在加载短信设置...')
  const [dialog, setDialog] = useState<LocalDialogState>(null)
  const [selectedRechargePlan, setSelectedRechargePlan] = useState('')
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [activeTemplate, setActiveTemplate] = useState<SmsSettingTemplate | null>(null)
  const loading = settledRequestKey !== requestKey
  const hasError = !loading && Boolean(errorMessage)

  useEffect(() => {
    const controller = new AbortController()

    void fetchSmsSettingDashboard(filters, controller.signal)
      .then((result) => {
        setViewModel(result)
        setSelectedChannelId(result.currentChannel.id)
        setErrorMessage('')
        setFeedback(result.emptyState ? result.emptyState.title : '短信设置已同步')
        setSettledRequestKey(requestKey)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setViewModel(null)
        setErrorMessage(error instanceof Error ? error.message : '短信设置数据加载失败，请稍后重试')
        setFeedback(error instanceof Error ? error.message : '短信设置数据加载失败，请稍后重试')
        setSettledRequestKey(requestKey)
      })

    return () => controller.abort()
  }, [filters, requestKey])

  const diagnostics = readSmsSettingDiagnostics()
  const provider = viewModel?.provider ?? diagnostics?.provider ?? 'mock'
  const pageState = loading ? 'loading' : hasError ? 'error' : viewModel?.state ?? filters.mockState ?? 'success'
  const requestBody =
    viewModel?.requestBody ??
    diagnostics?.requestBody ?? {
      campId: filters.campId,
      endpoints: [],
    }
  const contractText = JSON.stringify(
    {
      provider,
      state: pageState,
      requestBody: viewModel?.requestBody ?? diagnostics?.requestBody,
      traceId: viewModel?.traceId ?? diagnostics?.traceId ?? '',
      timestamp: viewModel?.timestamp ?? diagnostics?.timestamp ?? '',
    },
    null,
    2,
  )

  function retryLoad() {
    setDialog(null)
    setActiveTemplate(null)
    setFeedback('正在重新加载短信设置...')
    setReloadKey((current) => current + 1)
  }

  function openRechargeDialog() {
    setDialog('recharge')
    setFeedback('请选择短信充值套餐')
  }

  function openRechargeRecordDialog() {
    setDialog('rechargeRecord')
    setFeedback('已打开最近充值记录')
  }

  function openChannelDialog() {
    if (!viewModel) return
    setSelectedChannelId(viewModel.currentChannel.id)
    setDialog('channel')
    setFeedback('请选择启用短信渠道')
  }

  function openSignDialog() {
    setDialog('sign')
    setFeedback('已打开短信签名说明')
  }

  function openTemplateDialog(template: SmsSettingTemplate) {
    setActiveTemplate(template)
    setDialog('template')
    setFeedback(`已打开 ${template.title} 模板详情`)
  }

  function handleRechargePlanSelect(plan: SmsSettingRechargePlan) {
    setSelectedRechargePlan(plan.id)
    setFeedback(`已选择 ${plan.countLabel}短信套餐`)
  }

  function handleChannelSave() {
    if (!viewModel) return
    const selected = viewModel.channelOptions.find((item) => item.id === selectedChannelId) ?? viewModel.currentChannel
    setViewModel({
      ...viewModel,
      currentChannel: selected,
      channelOptions: viewModel.channelOptions.map((item) => ({
        ...item,
        enabled: item.id === selected.id,
      })),
    })
    setDialog(null)
    setFeedback(`启用渠道已切换为 ${selected.name}`)
  }

  function handleTemplateToggle(sectionId: string, templateId: string) {
    setViewModel((current) => {
      if (!current) return current
      return {
        ...current,
        sections: current.sections.map((section) => {
          if (section.id !== sectionId) return section
          return {
            ...section,
            templates: section.templates.map((template) =>
              template.id === templateId ? { ...template, enabled: !template.enabled } : template,
            ),
          }
        }),
      }
    })

    const template = viewModel?.sections
      .find((item) => item.id === sectionId)
      ?.templates.find((item) => item.id === templateId)

    if (template) {
      setFeedback(`${template.title}${template.enabled ? ' 已停用' : ' 已启用'}`)
    }
  }

  function handleCloseDialog() {
    setDialog(null)
  }

  return (
    <div className="sms-setting-page" data-provider={provider} data-state={pageState}>
      <pre
        id="sms-setting-service-contract"
        hidden
        data-provider={provider}
        data-state={pageState}
        data-request={JSON.stringify(requestBody)}
        data-trace-id={viewModel?.traceId ?? diagnostics?.traceId ?? ''}
      >
        {contractText}
      </pre>

      <section className="sms-setting-shell" aria-label="短信设置">
        <div className="sms-setting-status" role="status" aria-label="短信设置操作反馈">
          {loading ? '正在加载短信设置...' : feedback}
        </div>

        <header className="sms-setting-header">
          <div className="sms-setting-header__main" data-testid="sms-setting-overview">
            <div className="sms-setting-header__toolbar">
              <div className="sms-setting-header__balance">
                <h1>{viewModel?.title ?? '短信设置'}</h1>
                <div className="sms-setting-header__balance-text">
                  <span>剩余短信：</span>
                  <strong>{viewModel?.balance.remaining ?? '--'}</strong>
                </div>
                <button type="button" className="sms-setting-primary" onClick={openRechargeDialog}>
                  充值
                </button>
                <button type="button" className="sms-setting-secondary" onClick={openRechargeRecordDialog}>
                  充值记录
                </button>
              </div>

              <p className="sms-setting-header__hint">{viewModel?.introText ?? '启用短信推送模版后，系统将在预设条件下自动向客人发送短信通知'}</p>
            </div>

            {!loading && !hasError && !viewModel?.emptyState && viewModel ? (
              <div className="sms-setting-header__meta">
                <div className="sms-setting-channel-row" data-testid="sms-channel-row">
                  <span className="sms-setting-label">启用渠道:</span>
                  <div className="sms-setting-channel-list" aria-label="已启用短信渠道">
                    {viewModel.channelOptions.map((channel) => (
                      <span
                        key={channel.id}
                        className={`sms-setting-channel-badge sms-setting-channel-badge--${channel.tone}${channel.enabled ? ' is-active' : ''}`}
                        title={channel.name}
                      >
                        {channel.badgeText}
                      </span>
                    ))}
                  </div>
                  <button type="button" className="sms-setting-text-button" onClick={openChannelDialog}>
                    修改
                  </button>
                </div>

                <div className="sms-setting-sign-row" data-testid="sms-sign-row">
                  <span className="sms-setting-label">签名:</span>
                  <strong>{viewModel.sign.value}</strong>
                  <button type="button" className="sms-setting-text-button" onClick={openSignDialog}>
                    修改
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        {loading ? (
          <section className="sms-setting-state sms-setting-state--loading" aria-live="polite" aria-label="短信设置加载中">
            <div className="sms-setting-skeleton sms-setting-skeleton--overview" />
            <div className="sms-setting-skeleton sms-setting-skeleton--section" />
            <div className="sms-setting-skeleton sms-setting-skeleton--section" />
          </section>
        ) : null}

        {hasError ? (
          <section className="sms-setting-state sms-setting-state--error" role="alert" aria-label="短信设置数据错误">
            <h2>短信设置数据加载失败，请稍后重试</h2>
            <p>{errorMessage}</p>
            <button type="button" className="sms-setting-primary" onClick={retryLoad}>
              重新加载
            </button>
          </section>
        ) : null}

        {!loading && !hasError && viewModel?.emptyState ? (
          <section className="sms-setting-state sms-setting-state--empty" aria-label="短信设置空状态">
            <h2>{viewModel.emptyState.title}</h2>
            <p>{viewModel.emptyState.description}</p>
            <button
              type="button"
              className="sms-setting-primary"
              onClick={() => navigate(viewModel.emptyState?.actionPath ?? '/smartHotel/smartHome')}
            >
              {viewModel.emptyState.actionLabel}
            </button>
          </section>
        ) : null}

        {!loading && !hasError && !viewModel?.emptyState && viewModel ? (
          <div className="sms-setting-section-list" data-testid="sms-section-list">
            {viewModel.sections.map((section) => (
              <SmsTemplateSection
                key={section.id}
                section={section}
                onRoute={(route) => {
                  setFeedback(`正在前往 ${section.title} 承接页`)
                  navigate(route)
                }}
                onToggle={handleTemplateToggle}
                onEdit={openTemplateDialog}
              />
            ))}
          </div>
        ) : null}
      </section>

      {dialog === 'recharge' && viewModel ? (
        <RechargeDialog
          plans={viewModel.rechargePlans}
          selectedPlanId={selectedRechargePlan}
          onSelect={handleRechargePlanSelect}
          onClose={handleCloseDialog}
        />
      ) : null}

      {dialog === 'rechargeRecord' && viewModel ? (
        <RechargeRecordDialog records={viewModel.rechargeRecords} onClose={handleCloseDialog} />
      ) : null}

      {dialog === 'channel' && viewModel ? (
        <ChannelDialog
          options={viewModel.channelOptions}
          selectedChannelId={selectedChannelId}
          onChange={setSelectedChannelId}
          onClose={handleCloseDialog}
          onSave={handleChannelSave}
        />
      ) : null}

      {dialog === 'sign' && viewModel ? (
        <SignDialog signValue={viewModel.sign.value} description={viewModel.sign.description} onClose={handleCloseDialog} />
      ) : null}

      {dialog === 'template' && activeTemplate ? (
        <TemplateDialog template={activeTemplate} onClose={handleCloseDialog} />
      ) : null}
    </div>
  )
}

function SmsTemplateSection({
  section,
  onRoute,
  onToggle,
  onEdit,
}: {
  section: SmsSettingSection
  onRoute: (route: string) => void
  onToggle: (sectionId: string, templateId: string) => void
  onEdit: (template: SmsSettingTemplate) => void
}) {
  return (
    <section className="sms-section-card" data-accent={section.accent} aria-label={section.title}>
      <header className="sms-section-card__header">
        <span className="sms-section-card__icon" aria-hidden="true">
          {section.iconLabel}
        </span>

        <div className="sms-section-card__copy">
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </div>

        {section.actionLabel && section.actionRoute ? (
          <button type="button" className="sms-setting-text-button" onClick={() => onRoute(section.actionRoute!)}>
            {section.actionLabel}
          </button>
        ) : (
          <span />
        )}
      </header>

      <div className="sms-section-card__body">
        {section.templates.map((template) => (
          <article className="sms-template-item" key={template.id}>
            <div className="sms-template-item__top">
              <div className="sms-template-item__title">
                <span className="sms-template-item__clock" aria-hidden="true" />
                <strong>{template.title}</strong>
              </div>

              <SmsSwitch
                checked={template.enabled}
                label={`${template.title}开关`}
                onChange={() => onToggle(section.id, template.id)}
              />
            </div>

            <div className="sms-template-item__body">
              <p>{template.content}</p>
              <button
                type="button"
                className="sms-template-item__edit"
                aria-label={`编辑${template.title}`}
                onClick={() => onEdit(template)}
              >
                <span />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function SmsSwitch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: () => void
}) {
  return (
    <button
      type="button"
      className={`sms-switch${checked ? ' is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span />
    </button>
  )
}

function RechargeDialog({
  plans,
  selectedPlanId,
  onSelect,
  onClose,
}: {
  plans: SmsSettingRechargePlan[]
  selectedPlanId: string
  onSelect: (plan: SmsSettingRechargePlan) => void
  onClose: () => void
}) {
  return (
    <div className="sms-dialog-backdrop">
      <section className="sms-dialog sms-dialog--recharge" role="dialog" aria-modal="true" aria-label="短信充值">
        <header className="sms-dialog__header">
          <h2>短信充值</h2>
          <button type="button" aria-label="关闭短信充值" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sms-recharge-grid">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              aria-label={plan.countLabel}
              className={`sms-recharge-plan${selectedPlanId === plan.id ? ' is-selected' : ''}`}
              onClick={() => onSelect(plan)}
            >
              <strong>{plan.countLabel}</strong>
              <span>{plan.priceLabel}</span>
              <em>{plan.totalLabel}</em>
            </button>
          ))}
        </div>

        <footer className="sms-dialog__footer">
          <button type="button" className="sms-setting-secondary" onClick={onClose}>
            取消
          </button>
        </footer>
      </section>
    </div>
  )
}

function RechargeRecordDialog({
  records,
  onClose,
}: {
  records: SmsSettingRechargeRecord[]
  onClose: () => void
}) {
  return (
    <div className="sms-dialog-backdrop">
      <section className="sms-dialog" role="dialog" aria-modal="true" aria-label="短信充值记录">
        <header className="sms-dialog__header">
          <h2>短信充值记录</h2>
          <button type="button" aria-label="关闭充值记录" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sms-dialog__content">
          <strong className="sms-dialog__label">最近充值记录</strong>
          <div className="sms-record-list">
            {records.map((record) => (
              <article key={record.id} className="sms-record-item">
                <div>
                  <span>{record.createdAt}</span>
                  <strong>{record.packageLabel}</strong>
                </div>
                <div>
                  <em>{record.amountLabel}</em>
                  <span>{record.statusLabel}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function ChannelDialog({
  options,
  selectedChannelId,
  onChange,
  onClose,
  onSave,
}: {
  options: SmsSettingChannelOption[]
  selectedChannelId: string
  onChange: (value: string) => void
  onClose: () => void
  onSave: () => void
}) {
  return (
    <div className="sms-dialog-backdrop">
      <section className="sms-dialog" role="dialog" aria-modal="true" aria-label="启用渠道">
        <header className="sms-dialog__header">
          <h2>启用渠道</h2>
          <button type="button" aria-label="关闭启用渠道弹窗" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sms-dialog__content">
          <div className="sms-channel-option-list">
            {options.map((option) => (
              <label key={option.id} className={`sms-channel-option${selectedChannelId === option.id ? ' is-selected' : ''}`}>
                <input
                  type="radio"
                  name="sms-channel"
                  checked={selectedChannelId === option.id}
                  onChange={() => onChange(option.id)}
                  aria-label={option.name}
                />
                <span className={`sms-setting-channel-badge sms-setting-channel-badge--${option.tone}`}>{option.badgeText}</span>
                <strong>{option.name}</strong>
              </label>
            ))}
          </div>
        </div>

        <footer className="sms-dialog__footer">
          <button type="button" className="sms-setting-secondary" onClick={onClose}>
            取消
          </button>
          <button type="button" className="sms-setting-primary" onClick={onSave}>
            保存渠道设置
          </button>
        </footer>
      </section>
    </div>
  )
}

function SignDialog({
  signValue,
  description,
  onClose,
}: {
  signValue: string
  description: string
  onClose: () => void
}) {
  return (
    <div className="sms-dialog-backdrop">
      <section className="sms-dialog" role="dialog" aria-modal="true" aria-label="短信签名">
        <header className="sms-dialog__header">
          <h2>短信签名</h2>
          <button type="button" aria-label="关闭签名说明" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sms-dialog__content">
          <strong className="sms-dialog__title">{signValue}</strong>
          <p className="sms-dialog__paragraph">{description}</p>
        </div>
      </section>
    </div>
  )
}

function TemplateDialog({
  template,
  onClose,
}: {
  template: SmsSettingTemplate
  onClose: () => void
}) {
  return (
    <div className="sms-dialog-backdrop">
      <section className="sms-dialog" role="dialog" aria-modal="true" aria-label={`${template.title}模板`}>
        <header className="sms-dialog__header">
          <h2>{template.title}</h2>
          <button type="button" aria-label={`关闭${template.title}模板`} onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sms-dialog__content">
          <strong className="sms-dialog__title">{template.signName}</strong>
          <p className="sms-dialog__paragraph">{template.content}</p>
        </div>

        <footer className="sms-dialog__footer">
          <button type="button" className="sms-setting-secondary" onClick={onClose}>
            关闭
          </button>
        </footer>
      </section>
    </div>
  )
}
