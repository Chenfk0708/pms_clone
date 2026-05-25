import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT,
  AutoStrategySettingServiceError,
  createDefaultAutoStrategySettingQuery,
  loadAutoStrategySettingViewModel,
  resolveAutoStrategySettingRuntimeConfig,
  updateNegotiateRefundAutomaticAcceptStrategy,
  updateOrderAutoPendingStrategy,
  updateOrderAutoSettleStrategy,
  type AutoStrategySettingMockState,
  type AutoStrategySettingQuery,
  type AutoStrategySettingResponseState,
  type AutoStrategySettingTabKey,
  type AutoStrategySettingViewModel,
  type NegotiateRefundValue,
  type OrderAutoPendingValue,
} from '../services/autoStrategySetting'
import './AutoStrategySettingPage.css'

type ContractState = {
  provider: string
  responseState: AutoStrategySettingResponseState
  endpoint: string
  mockState: AutoStrategySettingMockState
  requestBody: Record<string, unknown>
  traceId: string
  timestamp: string
  lastAction: string
  lastRequestBody: Record<string, unknown> | null
}

type LoadState =
  | { kind: 'loading'; contract: ContractState }
  | { kind: 'ready'; data: AutoStrategySettingViewModel; contract: ContractState }
  | { kind: 'error'; message: string; contract: ContractState }

const defaultContract: ContractState = {
  provider: 'mock',
  responseState: 'loading',
  endpoint: AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT,
  mockState: 'success',
  requestBody: {},
  traceId: '',
  timestamp: '',
  lastAction: '',
  lastRequestBody: null,
}

export function AutoStrategySettingPage() {
  const location = useLocation()
  const runtimeConfig = useMemo(
    () => resolveAutoStrategySettingRuntimeConfig({ search: location.search }),
    [location.search],
  )
  const query = useMemo(() => createDefaultAutoStrategySettingQuery(runtimeConfig), [runtimeConfig])
  const queryKey = JSON.stringify(query)

  return <AutoStrategySettingSurface key={queryKey} query={query} />
}

function AutoStrategySettingSurface({ query }: { query: AutoStrategySettingQuery }) {
  const [reloadKey, setReloadKey] = useState(0)
  const [mockStateOverride, setMockStateOverride] = useState<AutoStrategySettingMockState | null>(null)
  const [activeTab, setActiveTab] = useState<AutoStrategySettingTabKey>('orderRules')
  const [busyKey, setBusyKey] = useState('')
  const [orderAutoPendingValue, setOrderAutoPendingValue] = useState<OrderAutoPendingValue>('1')
  const [orderAutoSettleChecked, setOrderAutoSettleChecked] = useState(false)
  const [negotiateRefundValue, setNegotiateRefundValue] = useState<NegotiateRefundValue>('0')
  const [state, setState] = useState<LoadState>({
    kind: 'loading',
    contract: {
      ...defaultContract,
      provider: query.provider ?? 'mock',
      mockState: query.mockState ?? 'success',
      requestBody: { campId: query.campId },
    },
  })

  const requestQuery = useMemo(
    () => ({
      ...query,
      mockState: mockStateOverride ?? query.mockState,
    }),
    [mockStateOverride, query],
  )

  useEffect(() => {
    const abort = new AbortController()

    setState({
      kind: 'loading',
      contract: {
        ...defaultContract,
        provider: requestQuery.provider ?? 'mock',
        mockState: requestQuery.mockState ?? 'success',
        requestBody: { campId: requestQuery.campId },
      },
    })

    loadAutoStrategySettingViewModel(requestQuery, abort.signal)
      .then((data) => {
        setOrderAutoPendingValue(data.orderRules.orderAutoPending.value)
        setOrderAutoSettleChecked(data.orderRules.orderAutoSettle.checked)
        setNegotiateRefundValue(data.orderRules.negotiateRefund.value)
        setState({
          kind: 'ready',
          data,
          contract: toContract(data),
        })
        setActiveTab('orderRules')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return

        const message = error instanceof Error ? error.message : '自动策略设置加载失败，请稍后重试'
        setState({
          kind: 'error',
          message,
          contract: toErrorContract(error, requestQuery),
        })
      })

    return () => abort.abort()
  }, [reloadKey, requestQuery])

  const readyData = state.kind === 'ready' ? state.data : null

  async function runMutation(
    busyLabel: string,
    task: () => Promise<{
      viewModel: AutoStrategySettingViewModel
      statusMessage: string
      lastAction: string
      endpoint: string
      requestBody: Record<string, unknown>
    }>,
    callbacks?: {
      onMutate?: () => void
      onSuccess?: (viewModel: AutoStrategySettingViewModel) => void
      onError?: () => void
    },
  ) {
    setBusyKey(busyLabel)
    callbacks?.onMutate?.()

    try {
      const result = await task()
      setState({
        kind: 'ready',
        data: result.viewModel,
        contract: {
          ...toContract(result.viewModel),
          endpoint: result.endpoint,
          lastAction: result.lastAction,
          lastRequestBody: result.requestBody,
        },
      })
      callbacks?.onSuccess?.(result.viewModel)
    } catch (error) {
      const message = error instanceof Error ? error.message : '自动策略设置保存失败，请稍后重试'
      callbacks?.onError?.()
      setState((current) => {
        if (current.kind !== 'ready') {
          return {
            kind: 'error',
            message,
            contract: toErrorContract(error, requestQuery),
          }
        }

        return {
          ...current,
          contract: {
            ...toErrorContract(error, requestQuery, current.contract.lastAction, current.contract.lastRequestBody),
          },
        }
      })
    } finally {
      setBusyKey('')
    }
  }

  function handleRetry() {
    setMockStateOverride('success')
    setReloadKey((current) => current + 1)
  }

  return (
    <div className="auto-strategy-page">
      <h1 className="auto-strategy-page__sr-title">自动策略设置</h1>

      <div
        hidden
        data-testid="auto-strategy-setting-service-contract"
        data-provider={state.contract.provider}
        data-endpoint={state.contract.endpoint}
        data-response-state={state.contract.responseState}
        data-mock-state={state.contract.mockState}
        data-request-body={JSON.stringify(state.contract.requestBody)}
        data-last-action={state.contract.lastAction}
        data-last-request-body={JSON.stringify(state.contract.lastRequestBody ?? {})}
      />

      <section className="auto-strategy-page__shell" aria-label="自动策略设置">
        {state.kind === 'error' ? (
          <section className="auto-strategy-page__state auto-strategy-page__state--error" role="alert">
            <h2>自动策略设置加载失败，请稍后重试</h2>
            <p>{state.message}</p>
            <button type="button" className="auto-strategy-page__primary" onClick={handleRetry}>
              重新加载
            </button>
          </section>
        ) : null}

        {state.kind === 'loading' ? (
          <section className="auto-strategy-page__state" role="status" aria-label="自动策略设置加载中">
            <h2>自动策略设置加载中</h2>
            <p>正在同步接单规则、房态自动化与库存占用规则，请稍候。</p>
          </section>
        ) : null}

        {readyData?.state === 'empty' ? (
          <section className="auto-strategy-page__state auto-strategy-page__state--empty" aria-label="自动策略设置空状态">
            <h2>{readyData.emptyState.title}</h2>
            <p>{readyData.emptyState.description}</p>
            <button type="button" className="auto-strategy-page__primary" onClick={handleRetry}>
              {readyData.emptyState.actionText}
            </button>
          </section>
        ) : null}

        {readyData?.state === 'success' ? (
          <>
            <div className="auto-strategy-tabs" role="tablist" aria-label="自动策略设置标签页">
              {readyData.tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  aria-controls={`auto-strategy-panel-${tab.key}`}
                  id={`auto-strategy-tab-${tab.key}`}
                  className={`auto-strategy-tabs__button${activeTab === tab.key ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              id="auto-strategy-panel-orderRules"
              role="tabpanel"
              aria-labelledby="auto-strategy-tab-orderRules"
              aria-label="接单规则"
              hidden={activeTab !== 'orderRules'}
            >
              <StrategyCard title={readyData.orderRules.orderAutoPending.title} description={readyData.orderRules.orderAutoPending.description}>
                <RadioGroup
                  name="order-auto-pending"
                  options={readyData.orderRules.orderAutoPending.options}
                  value={orderAutoPendingValue}
                  disabled={busyKey === 'order-auto-pending'}
                  onChange={(nextValue) => {
                    const previousValue = orderAutoPendingValue
                    void runMutation(
                      'order-auto-pending',
                      () => updateOrderAutoPendingStrategy(requestQuery, nextValue as OrderAutoPendingValue),
                      {
                      onMutate: () => setOrderAutoPendingValue(nextValue as OrderAutoPendingValue),
                      onSuccess: (viewModel) => setOrderAutoPendingValue(viewModel.orderRules.orderAutoPending.value),
                      onError: () => setOrderAutoPendingValue(previousValue),
                      },
                    )
                  }}
                />
              </StrategyCard>

              <StrategyCard title={readyData.orderRules.orderAutoSettle.title} description={readyData.orderRules.orderAutoSettle.description}>
                <div className="auto-strategy-switch-row">
                  <span>{readyData.orderRules.orderAutoSettle.switchLabel}</span>
                  <SwitchButton
                    label={readyData.orderRules.orderAutoSettle.switchLabel}
                    checked={orderAutoSettleChecked}
                    disabled={busyKey === 'order-auto-settle'}
                    onToggle={() => {
                      const previousValue = orderAutoSettleChecked
                      const nextValue = !orderAutoSettleChecked
                      void runMutation(
                        'order-auto-settle',
                        () => updateOrderAutoSettleStrategy(requestQuery, nextValue),
                        {
                        onMutate: () => setOrderAutoSettleChecked(nextValue),
                        onSuccess: (viewModel) => setOrderAutoSettleChecked(viewModel.orderRules.orderAutoSettle.checked),
                        onError: () => setOrderAutoSettleChecked(previousValue),
                        },
                      )
                    }}
                  />
                </div>
              </StrategyCard>

              <StrategyCard title={readyData.orderRules.negotiateRefund.title} description={readyData.orderRules.negotiateRefund.description}>
                <RadioGroup
                  name="negotiate-refund"
                  options={readyData.orderRules.negotiateRefund.options}
                  value={negotiateRefundValue}
                  disabled={busyKey === 'negotiate-refund'}
                  onChange={(nextValue) => {
                    const previousValue = negotiateRefundValue
                    void runMutation(
                      'negotiate-refund',
                      () => updateNegotiateRefundAutomaticAcceptStrategy(requestQuery, nextValue as NegotiateRefundValue),
                      {
                      onMutate: () => setNegotiateRefundValue(nextValue as NegotiateRefundValue),
                      onSuccess: (viewModel) => setNegotiateRefundValue(viewModel.orderRules.negotiateRefund.value),
                      onError: () => setNegotiateRefundValue(previousValue),
                      },
                    )
                  }}
                />
              </StrategyCard>
            </div>

            <div
              id="auto-strategy-panel-roomAutomation"
              role="tabpanel"
              aria-labelledby="auto-strategy-tab-roomAutomation"
              aria-label="房态自动化"
              hidden={activeTab !== 'roomAutomation'}
            >
              <StrategyCard title={readyData.roomAutomation.roomAssign.title}>
                <div className="auto-strategy-stack">
                  <div className="auto-strategy-inline-copy">
                    <span className="auto-strategy-inline-copy__label">{readyData.roomAutomation.roomAssign.strategyLabel}</span>
                  </div>
                  <RadioGroup
                    name="room-assign-strategy"
                    options={readyData.roomAutomation.roomAssign.options}
                    value={readyData.roomAutomation.roomAssign.value}
                    disabled
                    onChange={() => undefined}
                  />
                  <div className="auto-strategy-advanced">
                    <span className="auto-strategy-advanced__title">高级功能</span>
                    {readyData.roomAutomation.roomAssign.advancedOptions.map((item) => (
                      <CheckboxRow key={item.label} label={item.label} checked={item.checked} />
                    ))}
                  </div>
                </div>
              </StrategyCard>

              <StrategyCard
                title={readyData.roomAutomation.autoCheckIn.title}
                description={readyData.roomAutomation.autoCheckIn.description}
              >
                <div className="auto-strategy-time-row">
                  <span>{readyData.roomAutomation.autoCheckIn.label}</span>
                  <SwitchButton
                    label={readyData.roomAutomation.autoCheckIn.switchLabel}
                    checked={readyData.roomAutomation.autoCheckIn.checked}
                    disabled
                  />
                  <div className="auto-strategy-time-chip">{readyData.roomAutomation.autoCheckIn.time}</div>
                </div>
              </StrategyCard>

              <StrategyCard
                title={readyData.roomAutomation.autoCheckOut.title}
                description={readyData.roomAutomation.autoCheckOut.description}
              >
                <div className="auto-strategy-time-row">
                  <span>{readyData.roomAutomation.autoCheckOut.label}</span>
                  <SwitchButton
                    label={readyData.roomAutomation.autoCheckOut.switchLabel}
                    checked={readyData.roomAutomation.autoCheckOut.checked}
                    disabled
                  />
                  <div className="auto-strategy-time-chip">{readyData.roomAutomation.autoCheckOut.time}</div>
                </div>
              </StrategyCard>

              <StrategyCard
                title={readyData.roomAutomation.dirtyRoom.title}
                description={readyData.roomAutomation.dirtyRoom.description}
              >
                <RadioGroup
                  name="dirty-room-strategy"
                  options={readyData.roomAutomation.dirtyRoom.options}
                  value={readyData.roomAutomation.dirtyRoom.value}
                  disabled
                  onChange={() => undefined}
                />
              </StrategyCard>

              <StrategyCard title={readyData.roomAutomation.cleanRoom.title}>
                <div className="auto-strategy-switch-row">
                  <span>{readyData.roomAutomation.cleanRoom.switchLabel}</span>
                  <SwitchButton
                    label={readyData.roomAutomation.cleanRoom.switchLabel}
                    checked={readyData.roomAutomation.cleanRoom.checked}
                    disabled
                  />
                </div>
              </StrategyCard>
            </div>

            <div
              id="auto-strategy-panel-inventoryOccupation"
              role="tabpanel"
              aria-labelledby="auto-strategy-tab-inventoryOccupation"
              aria-label="库存占用规则"
              hidden={activeTab !== 'inventoryOccupation'}
            >
              <StrategyCard
                title={readyData.inventoryOccupation.pendingOrder.title}
                description={readyData.inventoryOccupation.pendingOrder.description}
              >
                <RadioGroup
                  name="pending-order-occupation"
                  options={readyData.inventoryOccupation.pendingOrder.options}
                  value={readyData.inventoryOccupation.pendingOrder.value}
                  disabled
                  onChange={() => undefined}
                />
              </StrategyCard>

              <StrategyCard
                title={readyData.inventoryOccupation.unpaidOrder.title}
                description={readyData.inventoryOccupation.unpaidOrder.description}
              >
                <RadioGroup
                  name="unpaid-order-occupation"
                  options={readyData.inventoryOccupation.unpaidOrder.options}
                  value={readyData.inventoryOccupation.unpaidOrder.value}
                  disabled
                  onChange={() => undefined}
                />
              </StrategyCard>

              <StrategyCard
                title={readyData.inventoryOccupation.hourlyRoom.title}
                description={readyData.inventoryOccupation.hourlyRoom.description}
              >
                <RadioGroup
                  name="hourly-room-occupation"
                  options={readyData.inventoryOccupation.hourlyRoom.options}
                  value={readyData.inventoryOccupation.hourlyRoom.value}
                  disabled
                  onChange={() => undefined}
                />
              </StrategyCard>
            </div>
          </>
        ) : null}
      </section>
    </div>
  )
}

function StrategyCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="auto-strategy-card" role="region" aria-label={title}>
      <header className="auto-strategy-card__header">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      <div className="auto-strategy-card__body">{children}</div>
    </section>
  )
}

function RadioGroup({
  name,
  options,
  value,
  disabled,
  onChange,
}: {
  name: string
  options: Array<{ label: string; value: string; description?: string; actionText?: string }>
  value: string
  disabled?: boolean
  onChange: (nextValue: string) => void
}) {
  return (
    <div className="auto-strategy-radio-group">
      {options.map((option) => (
        <label key={option.value} className={`auto-strategy-radio${disabled ? ' is-disabled' : ''}`}>
          <input
            type="radio"
            name={name}
            aria-label={option.label}
            checked={value === option.value}
            disabled={disabled}
            onChange={() => onChange(option.value)}
          />
          <span className="auto-strategy-radio__content">
            <span className="auto-strategy-radio__main">
              <span>{option.label}</span>
              {option.actionText ? <span className="auto-strategy-radio__action">{option.actionText}</span> : null}
            </span>
            {option.description ? <span className="auto-strategy-radio__description">{option.description}</span> : null}
          </span>
        </label>
      ))}
    </div>
  )
}

function SwitchButton({
  label,
  checked,
  disabled,
  onToggle,
}: {
  label: string
  checked: boolean
  disabled?: boolean
  onToggle?: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      disabled={disabled}
      className={`auto-strategy-switch${checked ? ' is-on' : ''}`}
      onClick={onToggle}
    >
      <span />
    </button>
  )
}

function CheckboxRow({ label, checked }: { label: string; checked: boolean }) {
  return (
    <label className="auto-strategy-checkbox">
      <input type="checkbox" aria-label={label} checked={checked} readOnly />
      <span>{label}</span>
    </label>
  )
}

function toContract(data: AutoStrategySettingViewModel): ContractState {
  return {
    provider: data.provider,
    responseState: data.state,
    endpoint: data.endpoint,
    mockState: data.state,
    requestBody: data.requestBody,
    traceId: data.traceId,
    timestamp: data.timestamp,
    lastAction: '',
    lastRequestBody: null,
  }
}

function toErrorContract(
  error: unknown,
  query: AutoStrategySettingQuery,
  lastAction = '',
  lastRequestBody: Record<string, unknown> | null = null,
): ContractState {
  if (error instanceof AutoStrategySettingServiceError) {
    return {
      provider: error.provider,
      responseState: 'error',
      endpoint: error.endpoint,
      mockState: query.mockState ?? 'error',
      requestBody: error.requestBody,
      traceId: error.response.traceId,
      timestamp: error.response.timestamp,
      lastAction,
      lastRequestBody,
    }
  }

  return {
    provider: query.provider ?? 'mock',
    responseState: 'error',
    endpoint: AUTO_STRATEGY_SETTING_BOOTSTRAP_ENDPOINT,
    mockState: query.mockState ?? 'error',
    requestBody: { campId: query.campId },
    traceId: '',
    timestamp: '',
    lastAction,
    lastRequestBody,
  }
}
