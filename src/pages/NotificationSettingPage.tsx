import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  createDefaultNotificationSettingQuery,
  loadNotificationSettingViewModel,
  markNotificationAccountFollowed,
  NotificationSettingServiceError,
  refreshNotificationFollowStatus,
  resolveNotificationSettingRuntimeConfig,
  toggleNotificationChannel,
  toggleNotificationItem,
  type NotificationChannelKey,
  type NotificationItemKey,
  type NotificationSettingMockState,
  type NotificationSettingQuery,
  type NotificationSettingResponseState,
  type NotificationSettingViewModel,
} from '../services/notificationSetting'
import './NotificationSettingPage.css'

type ContractState = {
  provider: string
  responseState: NotificationSettingResponseState
  endpoint: string
  traceId: string
  timestamp: string
  request: Record<string, unknown>
}

type LoadState =
  | { kind: 'loading'; contract: ContractState }
  | { kind: 'ready'; data: NotificationSettingViewModel; contract: ContractState }
  | { kind: 'error'; message: string; contract: ContractState }

const defaultContract: ContractState = {
  provider: 'mock',
  responseState: 'loading',
  endpoint: '/setting/wechatPushSetting/bootstrap',
  traceId: '',
  timestamp: '',
  request: {},
}

export function NotificationSettingPage() {
  const location = useLocation()
  const runtimeConfig = useMemo(
    () => resolveNotificationSettingRuntimeConfig({ search: location.search }),
    [location.search],
  )
  const query = useMemo(() => createDefaultNotificationSettingQuery(runtimeConfig), [runtimeConfig])
  const queryKey = JSON.stringify(query)

  return <NotificationSettingSurface key={queryKey} query={query} />
}

function NotificationSettingSurface({ query }: { query: NotificationSettingQuery }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [mockStateOverride, setMockStateOverride] = useState<NotificationSettingMockState | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [busyKey, setBusyKey] = useState('')
  const [feedback, setFeedback] = useState('正在加载通知设置...')
  const [state, setState] = useState<LoadState>({
    kind: 'loading',
    contract: {
      ...defaultContract,
      provider: query.provider ?? 'mock',
      request: query,
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
        request: requestQuery,
      },
    })

    loadNotificationSettingViewModel(requestQuery, abort.signal)
      .then((data) => {
        setState({
          kind: 'ready',
          data,
          contract: toContract(data),
        })
        setFeedback(data.state === 'empty' ? '通知模板尚未初始化。' : '通知设置已同步。')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        const message = error instanceof Error ? error.message : '通知设置加载失败，请稍后重试'
        setState({
          kind: 'error',
          message,
          contract: toErrorContract(error, requestQuery),
        })
        setFeedback(message)
      })

    return () => abort.abort()
  }, [reloadKey, requestQuery])

  const contractJson = JSON.stringify(state.contract)
  const readyData = state.kind === 'ready' ? state.data : null

  async function runMutation(
    busyLabel: string,
    task: () => Promise<{ viewModel: NotificationSettingViewModel; statusMessage: string }>,
  ) {
    setBusyKey(busyLabel)

    try {
      const result = await task()
      setMockStateOverride(result.viewModel.state)
      setState({
        kind: 'ready',
        data: result.viewModel,
        contract: toContract(result.viewModel),
      })
      setFeedback(result.statusMessage)
    } catch (error) {
      const message = error instanceof Error ? error.message : '通知设置操作失败，请稍后重试'
      setFeedback(message)
      setState((current) =>
        current.kind === 'ready'
          ? current
          : {
              kind: 'error',
              message,
              contract: toErrorContract(error, requestQuery),
            },
      )
    } finally {
      setBusyKey('')
    }
  }

  function handleRetry() {
    setMockStateOverride('success')
    setReloadKey((current) => current + 1)
    setFeedback('正在重新加载通知设置...')
  }

  return (
    <div className="notification-page">
      <pre
        hidden
        data-testid="notification-setting-service-contract"
        data-provider={state.contract.provider}
        data-response-state={state.contract.responseState}
        data-endpoint={state.contract.endpoint}
      >
        {contractJson}
      </pre>

      <section className="notification-page__surface" aria-label="通知设置">
        <div className="notification-page__status" role="status" aria-label="通知设置操作反馈">
          {feedback}
        </div>

        <header className="notification-page__hero">
          <div className="notification-page__intro">
            <div className="notification-page__qr-panel">
              <div className="notification-page__qr" role="img" aria-label={readyData?.qrCode.alt ?? '路客云微信公众号二维码'}>
                <img src={readyData?.qrCode.imageDataUrl} alt={readyData?.qrCode.alt ?? '路客云微信公众号二维码'} />
              </div>

              <div className="notification-page__qr-actions">
                <button
                  type="button"
                  className="notification-page__text-button"
                  aria-label="我已关注？"
                  disabled={busyKey === 'follow'}
                  onClick={() =>
                    void runMutation('follow', () =>
                      markNotificationAccountFollowed({ ...requestQuery, mockState: 'success' }),
                    )
                  }
                >
                  我已关注？
                </button>
                <button
                  type="button"
                  className="notification-page__text-button"
                  aria-label="刷新一下"
                  disabled={busyKey === 'refresh'}
                  onClick={() =>
                    void runMutation('refresh', () =>
                      refreshNotificationFollowStatus({ ...requestQuery, mockState: 'success' }),
                    )
                  }
                >
                  刷新一下
                </button>
              </div>
            </div>

            <div className="notification-page__hero-copy">
              <strong>
                {readyData?.intro.title ?? '扫码关注公众号【路客云】，快速通过微信推送订单、房态'}
              </strong>
              <button
                type="button"
                className="notification-page__link-button"
                aria-label="查看接受微信通知公众号"
                onClick={() => setDialogOpen(true)}
              >
                {readyData?.intro.detailButtonText ?? '查看接受微信通知公众号'}
              </button>
            </div>
          </div>

          {readyData && readyData.state === 'success' ? (
            <div className="notification-page__channel-heads" role="presentation">
              {readyData.channels.map((channel) => (
                <div className="notification-page__channel-head" key={channel.key}>
                  <NotificationSwitch
                    checked={channel.enabled}
                    disabled={busyKey === `channel-${channel.key}`}
                    label={`${channel.title} 总开关`}
                    onChange={(nextChecked) =>
                      void runMutation(`channel-${channel.key}`, () =>
                        toggleNotificationChannel(
                          { ...requestQuery, mockState: 'success' },
                          channel.key,
                          nextChecked,
                        ),
                      )
                    }
                  />
                  <div className="notification-page__channel-head-copy">
                    {channel.key === 'wechat' ? null : <span>{channel.title}</span>}
                    {channel.subtitle ? <small>{channel.subtitle}</small> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </header>

        {state.kind === 'error' ? (
          <section className="notification-page__state notification-page__state--error" role="alert" aria-label="通知设置加载失败">
            <h2>通知设置加载失败，请稍后重试</h2>
            <p>当前无法同步渠道权限与公众号状态，请重新加载通知设置。</p>
            <button type="button" className="notification-page__primary-button" onClick={handleRetry}>
              重新加载通知设置
            </button>
          </section>
        ) : null}

        {state.kind === 'loading' ? (
          <section className="notification-page__state" aria-live="polite" aria-label="通知设置加载中">
            <h2>通知设置加载中</h2>
            <p>正在同步公众号状态、通知渠道和开关配置，请稍候。</p>
          </section>
        ) : null}

        {readyData && readyData.state === 'empty' ? (
          <section className="notification-page__state notification-page__state--empty" aria-label="通知设置空状态">
            <h2>当前暂无可配置的通知项</h2>
            <p>通知模板尚未初始化，稍后开通后即可继续配置推送渠道。</p>
          </section>
        ) : null}

        {readyData && readyData.state === 'success' ? (
          <section className="notification-page__table" role="table" aria-label="通知设置表">
            {readyData.items.map((item) => (
              <div className="notification-page__row" role="row" key={item.key}>
                <div className="notification-page__row-copy" role="cell">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>

                <div className="notification-page__row-switch" role="cell">
                  {item.toggles.pcApp !== undefined ? (
                    <NotificationSwitch
                      checked={item.toggles.pcApp}
                      disabled={busyKey === `item-${item.key}-pcApp`}
                      label={`${item.title} PC\\APP推送`}
                      onChange={(nextChecked) =>
                        void handleItemToggle(item.key, 'pcApp', nextChecked, requestQuery, runMutation)
                      }
                    />
                  ) : (
                    <span className="notification-page__placeholder">-</span>
                  )}
                </div>

                <div className="notification-page__row-switch" role="cell">
                  {item.toggles.wechat !== undefined ? (
                    <NotificationSwitch
                      checked={item.toggles.wechat}
                      disabled={busyKey === `item-${item.key}-wechat`}
                      label={`${item.title} 公众号推送`}
                      onChange={(nextChecked) =>
                        void handleItemToggle(item.key, 'wechat', nextChecked, requestQuery, runMutation)
                      }
                    />
                  ) : (
                    <span className="notification-page__placeholder">-</span>
                  )}
                </div>
              </div>
            ))}
          </section>
        ) : null}
      </section>

      {dialogOpen ? (
        <div className="notification-page__dialog-backdrop" role="presentation" onClick={() => setDialogOpen(false)}>
          <section
            className="notification-page__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="接受微信通知公众号"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="notification-page__dialog-header">
              <h2>接受微信通知公众号</h2>
              <button type="button" aria-label="关闭公众号详情" onClick={() => setDialogOpen(false)}>
                ×
              </button>
            </header>

            <p className="notification-page__dialog-hint">
              {readyData?.followSummary.hint ?? '当前暂无已关注公众号，请扫码关注后刷新状态。'}
            </p>

            {readyData?.followSummary.accounts.length ? (
              <ul className="notification-page__account-list">
                {readyData.followSummary.accounts.map((account) => (
                  <li key={account.accountId}>
                    <strong>{account.accountName}</strong>
                    <span>{account.receivedAt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="notification-page__account-empty">暂无已绑定公众号记录，请扫码关注后刷新。</div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}

function NotificationSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (nextChecked: boolean) => void
}) {
  return (
    <button
      type="button"
      className={`notification-switch${checked ? ' is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  )
}

async function handleItemToggle(
  itemKey: NotificationItemKey,
  channel: NotificationChannelKey,
  nextChecked: boolean,
  query: NotificationSettingQuery,
  runMutation: (
    busyLabel: string,
    task: () => Promise<{ viewModel: NotificationSettingViewModel; statusMessage: string }>,
  ) => Promise<void>,
) {
  await runMutation(`item-${itemKey}-${channel}`, () =>
    toggleNotificationItem({ ...query, mockState: 'success' }, itemKey, channel, nextChecked),
  )
}

function toContract(data: NotificationSettingViewModel): ContractState {
  return {
    provider: data.provider,
    responseState: data.state,
    endpoint: data.endpoint,
    traceId: data.traceId,
    timestamp: data.timestamp,
    request: data.request,
  }
}

function toErrorContract(error: unknown, query: NotificationSettingQuery): ContractState {
  const serviceError = error instanceof NotificationSettingServiceError ? error : null

  if (serviceError) {
    return {
      provider: serviceError.provider,
      responseState: 'error',
      endpoint: '/setting/wechatPushSetting/bootstrap',
      traceId: serviceError.response.traceId,
      timestamp: serviceError.response.timestamp,
      request: serviceError.request,
    }
  }

  return {
    provider: query.provider ?? 'mock',
    responseState: 'error',
    endpoint: '/setting/wechatPushSetting/bootstrap',
    traceId: '',
    timestamp: '',
    request: query,
  }
}
