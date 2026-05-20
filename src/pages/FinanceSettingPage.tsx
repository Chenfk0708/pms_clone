import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultFinanceSettingQuery,
  FINANCE_SETTING_GET_ENDPOINT,
  getFinanceLockDate,
  initializeFinanceSettingDefaults,
  isFinanceRuleLocked,
  loadFinanceSettingViewModel,
  resolveFinanceSettingRuntimeConfig,
  saveFinanceAmortizeSetting,
  saveFinanceNightAuditSetting,
  saveFinanceVendibleSetting,
  type FinanceAmortizeStrategy,
  type FinanceSettingViewModel,
} from '../services/financeSetting'
import './FinanceSettingPage.css'

type DialogState =
  | { type: 'permission-enable' }
  | { type: 'amortize-confirm'; strategy: FinanceAmortizeStrategy }
  | { type: 'vendible-confirm'; selectedValues: number[] }
  | null

export function FinanceSettingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const runtimeConfig = useMemo(() => resolveFinanceSettingRuntimeConfig(location.search), [location.search])
  const query = useMemo(() => createDefaultFinanceSettingQuery(runtimeConfig), [runtimeConfig])
  const [viewModel, setViewModel] = useState<FinanceSettingViewModel | null>(null)
  const [statusText, setStatusText] = useState('财务设置数据加载中')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [isVendibleEditing, setIsVendibleEditing] = useState(false)
  const [vendibleDraft, setVendibleDraft] = useState<number[]>([])

  useEffect(() => {
    const controller = new AbortController()

    loadFinanceSettingViewModel(query, controller.signal)
      .then((nextViewModel) => {
        if (controller.signal.aborted) return
        setViewModel(nextViewModel)
        setVendibleDraft(nextViewModel.vendible.selectedValues)
        setStatusText(nextViewModel.feedback)
      })
      .catch((loadError: Error) => {
        if (controller.signal.aborted) return
        setViewModel(null)
        setVendibleDraft([])
        setError(loadError.message || '财务设置加载失败，请稍后重试')
        setStatusText('财务设置加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query])

  const contractText = useMemo(
    () =>
      JSON.stringify(
        {
          endpoint: viewModel?.diagnostics.getRequest.endpoint ?? FINANCE_SETTING_GET_ENDPOINT,
          request: viewModel?.diagnostics.getRequest.body ?? query,
          provider: viewModel?.provider ?? runtimeConfig.provider,
          mockState: viewModel?.mockState ?? runtimeConfig.mockState,
          lockDates: viewModel
            ? {
                amortize: getFinanceLockDate(viewModel.amortize.lockKey),
                vendible: getFinanceLockDate(viewModel.vendible.lockKey),
              }
            : {},
          saveRequests: viewModel?.diagnostics.saveRequests ?? null,
          traceId: viewModel?.traceId ?? '',
          timestamp: viewModel?.timestamp ?? '',
        },
        null,
        2,
      ),
    [query, runtimeConfig.mockState, runtimeConfig.provider, viewModel],
  )

  const canInteract = !isLoading && !isSubmitting && Boolean(viewModel)

  async function reload(nextStatus = '财务设置数据已刷新') {
    setStatusText(nextStatus)
    setIsLoading(true)
    setError('')
    setViewModel(null)

    try {
      const nextViewModel = await loadFinanceSettingViewModel(query)
      setViewModel(nextViewModel)
      setVendibleDraft(nextViewModel.vendible.selectedValues)
      setStatusText(nextStatus)
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '财务设置加载失败，请稍后重试'
      setError(message)
      setStatusText('财务设置加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  async function commitNightAudit(enabled: boolean, time?: number, nextStatus?: string) {
    if (!viewModel) return
    setIsSubmitting(true)
    setError('')
    setStatusText(nextStatus ?? '夜审设置保存中')

    try {
      const result = await saveFinanceNightAuditSetting(viewModel, { enabled, time }, enabled ? 'direct-enable' : 'disable')
      setViewModel(result.viewModel)
      setStatusText(result.feedback)
      setDialog(null)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '夜审设置保存失败，请稍后重试'
      setError(message)
      setStatusText('夜审设置保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function commitNightAuditTime(time: number) {
    if (!viewModel) return
    setIsSubmitting(true)
    setError('')
    setStatusText('自动夜审时间保存中')

    try {
      const result = await saveFinanceNightAuditSetting(viewModel, { enabled: viewModel.nightAudit.enabled, time }, 'time')
      setViewModel(result.viewModel)
      setStatusText(result.feedback)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '自动夜审时间保存失败，请稍后重试'
      setError(message)
      setStatusText('自动夜审时间保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function confirmAmortize(strategy: FinanceAmortizeStrategy) {
    if (!viewModel) return
    setIsSubmitting(true)
    setError('')
    setStatusText('连住订单分摊模式保存中')

    try {
      const result = await saveFinanceAmortizeSetting(viewModel, strategy)
      setViewModel(result.viewModel)
      setStatusText(result.feedback)
      setDialog(null)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '连住订单分摊模式保存失败，请稍后重试'
      setError(message)
      setStatusText('连住订单分摊模式保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function confirmVendible() {
    if (!viewModel) return
    setIsSubmitting(true)
    setError('')
    setStatusText('关房计入可售规则保存中')

    try {
      const result = await saveFinanceVendibleSetting(viewModel, vendibleDraft)
      setViewModel(result.viewModel)
      setVendibleDraft(result.viewModel.vendible.selectedValues)
      setIsVendibleEditing(false)
      setStatusText(result.feedback)
      setDialog(null)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '关房计入可售规则保存失败，请稍后重试'
      setError(message)
      setStatusText('关房计入可售规则保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function initializeDefaults() {
    if (!viewModel) return

    setIsSubmitting(true)
    setError('')
    setStatusText('财务规则初始化中')

    try {
      const result = await initializeFinanceSettingDefaults(viewModel)
      setViewModel(result.viewModel)
      setVendibleDraft(result.viewModel.vendible.selectedValues)
      setStatusText(result.feedback)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '财务规则初始化失败，请稍后重试'
      setError(message)
      setStatusText('财务规则初始化失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleNightAuditToggle(nextEnabled: boolean) {
    if (!viewModel || isSubmitting) return
    if (nextEnabled && !viewModel.nightAudit.enabled) {
      setDialog({ type: 'permission-enable' })
      return
    }
    void commitNightAudit(nextEnabled, viewModel.nightAudit.time)
  }

  function handleNightAuditTimeChange(value: number) {
    if (!viewModel || isSubmitting || value === viewModel.nightAudit.time) return
    void commitNightAuditTime(value)
  }

  function handleAmortizeChange(strategy: FinanceAmortizeStrategy) {
    if (!viewModel || isSubmitting || strategy === viewModel.amortize.strategy) return
    if (isFinanceRuleLocked(viewModel.amortize.lockKey)) {
      setStatusText('连住订单分摊模式今天已修改，请明日再试')
      return
    }
    setDialog({ type: 'amortize-confirm', strategy })
  }

  function toggleVendible(value: number, checked: boolean) {
    if (!isVendibleEditing || isSubmitting) return
    setVendibleDraft((current) => {
      const nextSet = new Set(current)
      if (checked) {
        nextSet.add(value)
      } else if (nextSet.size > 1) {
        nextSet.delete(value)
      }
      return [...nextSet].sort((left, right) => left - right)
    })
  }

  function beginVendibleEdit() {
    if (!viewModel || isSubmitting) return
    setVendibleDraft(viewModel.vendible.selectedValues)
    setIsVendibleEditing(true)
    setStatusText('请确认关房计入可售的房态类型')
  }

  function cancelVendibleEdit() {
    if (!viewModel) return
    setVendibleDraft(viewModel.vendible.selectedValues)
    setIsVendibleEditing(false)
    setDialog(null)
    setStatusText('已恢复当前关房计入可售规则')
  }

  function submitVendibleEdit() {
    if (!viewModel || isSubmitting) return
    if (isFinanceRuleLocked(viewModel.vendible.lockKey)) {
      setStatusText('关房计入可售规则今天已修改，请明日再试')
      return
    }
    setDialog({ type: 'vendible-confirm', selectedValues: vendibleDraft })
  }

  return (
    <div className="finance-setting-page">
      <section className="finance-setting-panel" aria-label="财务设置">
        <h1 className="finance-setting-sr-title">财务设置</h1>

        <div className="finance-setting-status-row">
          <div className="finance-setting-status" role="status" aria-label="财务设置操作反馈">
            {isLoading ? '财务设置数据加载中' : statusText}
          </div>
          <button type="button" className="finance-setting-refresh" onClick={() => void reload()} disabled={isLoading || isSubmitting}>
            刷新
          </button>
        </div>

        <pre data-testid="finance-setting-contract" className="finance-setting-contract">
          {contractText}
        </pre>

        {error ? (
          <section className="finance-setting-state-card finance-setting-state-card--error" role="alert">
            <strong>财务设置加载失败</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void reload('财务设置数据已重试')}>
              重新加载
            </button>
          </section>
        ) : null}

        {!error && viewModel && !viewModel.isInitialized ? (
          <section className="finance-setting-state-card" role="status" aria-label="财务设置初始化提醒">
            <strong>当前门店尚未完成财务规则设置</strong>
            <span>建议先初始化默认规则，再按门店经营方式调整夜审、分摊与可售口径。</span>
            <button type="button" onClick={() => void initializeDefaults()} disabled={isSubmitting}>
              初始化默认规则
            </button>
          </section>
        ) : null}

        {viewModel ? (
          <>
            <section className="finance-setting-section">
              <h2>夜审设置</h2>
              <div className="finance-setting-row finance-setting-row--night">
                <div className="finance-setting-row-main">
                  <span className="finance-setting-label">夜审</span>
                  <button
                    type="button"
                    role="switch"
                    aria-label="夜审"
                    aria-checked={viewModel.nightAudit.enabled}
                    className={`finance-switch${viewModel.nightAudit.enabled ? ' is-on' : ''}`}
                    onClick={() => handleNightAuditToggle(!viewModel.nightAudit.enabled)}
                    disabled={!canInteract}
                  />
                  <p>开启后，每天指定时间会自动进行夜审。</p>
                </div>
                <label className={`finance-time-select${!canInteract ? ' is-disabled' : ''}`}>
                  <span>自动夜审时间</span>
                  <select
                    aria-label="自动夜审时间"
                    value={viewModel.nightAudit.time}
                    onChange={(event) => handleNightAuditTimeChange(Number(event.target.value))}
                    disabled={!canInteract}
                  >
                    {viewModel.nightAudit.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="finance-setting-section">
              <h2>分摊设置</h2>
              <div className="finance-setting-content">
                <div className="finance-setting-line">
                  <span>连住订单分摊(一天仅能修改一次，请谨慎操作。)</span>
                </div>
                <div className="finance-setting-options" role="radiogroup" aria-label="连住订单分摊模式">
                  {viewModel.amortize.options.map((option) => (
                    <label key={option.value}>
                      <input
                        type="radio"
                        name="finance-allocation"
                        aria-label={option.label}
                        checked={viewModel.amortize.strategy === option.value}
                        disabled={!canInteract}
                        onChange={() => handleAmortizeChange(option.value)}
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                <div className="finance-setting-hint">
                  <span>今日修改记录：{getFinanceLockDate(viewModel.amortize.lockKey) || '未修改'}</span>
                </div>
              </div>
            </section>

            <section className="finance-setting-section">
              <h2>可售设置</h2>
              <div className="finance-setting-content">
                <div className="finance-setting-line">
                  <span>关房计入可售(一天仅能修改一次，请谨慎操作。)</span>
                </div>
                <div className="finance-setting-actions-row">
                  <div className="finance-setting-options" aria-label="关房计入可售选项">
                    {viewModel.vendible.options.map((option) => (
                      <label key={option.value}>
                        <input
                          type="checkbox"
                          aria-label={option.label}
                          checked={vendibleDraft.includes(option.value)}
                          disabled={!isVendibleEditing || isSubmitting}
                          onChange={(event) => toggleVendible(option.value, event.target.checked)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>

                  {isVendibleEditing ? (
                    <div className="finance-setting-inline-actions">
                      <button type="button" onClick={cancelVendibleEdit} disabled={isSubmitting}>
                        取消
                      </button>
                      <button type="button" onClick={submitVendibleEdit} disabled={isSubmitting}>
                        保存
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="finance-setting-edit" onClick={beginVendibleEdit} disabled={!canInteract}>
                      编辑
                    </button>
                  )}
                </div>
                <div className="finance-setting-hint">
                  <span>今日修改记录：{getFinanceLockDate(viewModel.vendible.lockKey) || '未修改'}</span>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </section>

      {dialog?.type === 'permission-enable' ? (
        <Modal
          title="是否确认开启夜审？"
          ariaLabel="是否确认开启夜审"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" onClick={() => setDialog(null)} disabled={isSubmitting}>
                取消
              </button>
              <button type="button" onClick={() => void commitNightAudit(true, viewModel?.nightAudit.time, '夜审设置保存中')} disabled={isSubmitting}>
                确认开启
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => navigate(viewModel?.permissionRoute ?? '/setting/role')}
                disabled={isSubmitting}
              >
                去设置权限
              </button>
            </>
          }
        >
          <p>建议限制管理员外的其他成员无法修改历史订单/账单权限后再开启夜审。</p>
        </Modal>
      ) : null}

      {dialog?.type === 'amortize-confirm' ? (
        <Modal
          title="确认修改连住订单分摊模式？"
          ariaLabel="确认修改连住订单分摊模式"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" onClick={() => setDialog(null)} disabled={isSubmitting}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => void confirmAmortize(dialog.strategy)} disabled={isSubmitting}>
                确定
              </button>
            </>
          }
        >
          <p>修改之后所有待入住订单将按选定模式进行分摊，当前入住和历史订单仍按修改前模式进行分摊。</p>
        </Modal>
      ) : null}

      {dialog?.type === 'vendible-confirm' ? (
        <Modal
          title="是否确认操作？"
          ariaLabel="是否确认操作"
          onClose={() => setDialog(null)}
          footer={
            <>
              <button type="button" onClick={() => setDialog(null)} disabled={isSubmitting}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => void confirmVendible()} disabled={isSubmitting}>
                确定
              </button>
            </>
          }
        >
          <p>入住率 = 开房数 / 总可售房间数。如勾选关房不计入可售，则对应关房不计入总可售房间数；确认后仅更新当天及远期数据，历史数据不做调整。</p>
          <p>本次将计入可售的房态：{formatVendibleSummary(dialog.selectedValues, viewModel?.vendible.options ?? [])}</p>
        </Modal>
      ) : null}
    </div>
  )
}

function Modal({
  title,
  ariaLabel,
  children,
  footer,
  onClose,
}: {
  title: string
  ariaLabel: string
  children: React.ReactNode
  footer: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="finance-setting-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="finance-setting-modal" role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={(event) => event.stopPropagation()}>
        <header>
          <h3>{title}</h3>
          <button type="button" aria-label={`关闭${title}`} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="finance-setting-modal__content">{children}</div>
        <footer>{footer}</footer>
      </section>
    </div>
  )
}

function formatVendibleSummary(
  selectedValues: number[],
  options: Array<{
    label: string
    value: number
  }>,
) {
  const selectedLabels = options.filter((option) => selectedValues.includes(option.value)).map((option) => option.label)
  return selectedLabels.join('、') || '未选择'
}
