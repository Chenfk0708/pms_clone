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
  type SmsSettingViewModel,
} from '../services/smsSetting'
import './SmsSettingPage.css'

type SmsDialogState = 'recharge' | 'rechargeRecord' | 'channel' | 'sign' | null

export function SmsSettingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const filters = useMemo(() => createDefaultSmsSettingFilters(new URLSearchParams(location.search)), [location.search])
  const [reloadKey, setReloadKey] = useState(0)
  const requestKey = `${filters.campId}:${filters.mockState}:${reloadKey}`
  const [viewModel, setViewModel] = useState<SmsSettingViewModel | null>(null)
  const [settledRequestKey, setSettledRequestKey] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('短信设置数据加载中')
  const [dialog, setDialog] = useState<SmsDialogState>(null)
  const [selectedRechargePlan, setSelectedRechargePlan] = useState('')
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const loading = settledRequestKey !== requestKey
  const hasError = !loading && Boolean(errorMessage)

  useEffect(() => {
    const controller = new AbortController()

    void fetchSmsSettingDashboard(filters, controller.signal)
      .then((result) => {
        setViewModel(result)
        setSelectedChannelId(result.currentChannel.id)
        setDialog(null)
        setErrorMessage('')
        setFeedback(result.emptyState ? result.emptyState.title : '短信设置数据已同步')
        setSettledRequestKey(requestKey)
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setViewModel(null)
        setDialog(null)
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
    setFeedback('短信设置数据加载中')
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

  function handleRechargePlanSelect(plan: SmsSettingRechargePlan) {
    setSelectedRechargePlan(plan.id)
    setFeedback(`已选择 ${plan.countLabel.replace('条', ' 条')}短信套餐`)
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

      <section className="sms-setting-panel" aria-label="短信设置">
        <header className="sms-setting-header">
          <div>
            <h1>{viewModel?.title ?? '短信设置'}</h1>
            <span>{viewModel?.versionLabel ?? '版本号：v4.10.7'}</span>
          </div>
        </header>

        <div className="sms-setting-status" role="status" aria-label="短信设置操作反馈">
          {loading ? '短信设置数据加载中' : feedback}
        </div>

        {loading ? (
          <section className="sms-setting-loading" aria-label="短信设置加载状态">
            <div className="sms-setting-skeleton sms-setting-skeleton--wide" />
            <div className="sms-setting-skeleton" />
            <div className="sms-setting-skeleton sms-setting-skeleton--card" />
          </section>
        ) : null}

        {hasError ? (
          <section className="sms-setting-error" role="alert" aria-label="短信设置数据错误">
            <strong>短信设置数据加载失败，请稍后重试</strong>
            <p>{errorMessage}</p>
            <button type="button" className="sms-setting-secondary" onClick={retryLoad}>
              重新加载
            </button>
          </section>
        ) : null}

        {!loading && !hasError && viewModel?.emptyState ? (
          <section className="sms-setting-empty" aria-label="短信设置空状态">
            <strong>{viewModel.emptyState.title}</strong>
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
          <>
            <section className="sms-setting-balance">
              <div className="sms-setting-balance__count">
                <span>剩余短信</span>
                <strong>{viewModel.balance.remaining}</strong>
              </div>
              <div className="sms-setting-balance__actions">
                <button type="button" className="sms-setting-primary" onClick={openRechargeDialog}>
                  充值
                </button>
                <button type="button" className="sms-setting-secondary" onClick={openRechargeRecordDialog}>
                  充值记录
                </button>
              </div>
            </section>

            <p className="sms-setting-intro">{viewModel.introText}</p>

            <div className="sms-setting-meta">
              <div>
                <span>启用渠道</span>
                <em>{viewModel.currentChannel.name}</em>
                <button type="button" aria-label="修改启用渠道" onClick={openChannelDialog}>
                  修改
                </button>
              </div>
              <div>
                <span>签名</span>
                <em>{viewModel.sign.value}</em>
                <button type="button" aria-label="修改签名" onClick={openSignDialog}>
                  修改
                </button>
              </div>
            </div>

            <div className="sms-setting-section-list">
              {viewModel.sections.map((section) => (
                <SmsTemplateSection
                  key={section.id}
                  section={section}
                  onRoute={(route) => {
                    setFeedback(`正在前往「${section.title}」承接页`)
                    navigate(route)
                  }}
                />
              ))}
            </div>
          </>
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
    </div>
  )
}

function SmsTemplateSection({
  section,
  onRoute,
}: {
  section: SmsSettingSection
  onRoute: (route: string) => void
}) {
  return (
    <section className="sms-template-card" aria-label={section.title}>
      <header className="sms-template-card__header">
        <span className="sms-template-card__icon" aria-hidden="true" />
        <div>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
          {section.actionLabel && section.actionRoute ? (
            <button type="button" className="sms-setting-link-button" onClick={() => onRoute(section.actionRoute!)}>
              {section.actionLabel}
            </button>
          ) : null}
        </div>
      </header>

      <div className="sms-template-card__body">
        {section.templates.map((template) => (
          <article className="sms-template-row" key={template.id}>
            <div className="sms-template-row__title">
              <span className="sms-template-row__dot" aria-hidden="true" />
              <strong>{template.title}</strong>
            </div>
            <p>{template.content}</p>
          </article>
        ))}
      </div>
    </section>
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
    <div className="sms-recharge-backdrop">
      <section className="sms-recharge-dialog" role="dialog" aria-modal="true" aria-label="短信充值">
        <header>
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
        <footer>
          <button type="button" onClick={onClose}>
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
    <div className="sms-recharge-backdrop">
      <section className="sms-recharge-dialog sms-recharge-dialog--record" role="dialog" aria-modal="true" aria-label="短信充值记录">
        <header>
          <h2>短信充值记录</h2>
          <button type="button" aria-label="关闭充值记录" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="sms-record-list">
          <strong>最近充值记录</strong>
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
    <div className="sms-recharge-backdrop">
      <section className="sms-recharge-dialog sms-recharge-dialog--form" role="dialog" aria-modal="true" aria-label="启用渠道">
        <header>
          <h2>启用渠道</h2>
          <button type="button" aria-label="关闭启用渠道弹窗" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="sms-dialog-form">
          {options.map((option) => (
            <label key={option.id} className="sms-radio-option">
              <input
                type="radio"
                name="sms-channel"
                checked={selectedChannelId === option.id}
                onChange={() => onChange(option.id)}
                aria-label={option.name}
              />
              <span>{option.name}</span>
            </label>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
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
    <div className="sms-recharge-backdrop">
      <section className="sms-recharge-dialog sms-recharge-dialog--form" role="dialog" aria-modal="true" aria-label="短信签名">
        <header>
          <h2>短信签名</h2>
          <button type="button" aria-label="关闭签名说明" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="sms-dialog-form">
          <strong>{signValue}</strong>
          <p>{description}</p>
        </div>
      </section>
    </div>
  )
}
