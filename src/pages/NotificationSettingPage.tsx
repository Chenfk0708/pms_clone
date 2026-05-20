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
      .then((data: NotificationSettingViewModel) => {
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
        setFeedback(message === '通知设置加载失败，请稍后重试' ? '通知设置进入错误态，请点击重新加载通知设置。' : message)
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
    <div className="notification-setting-page">
      <pre
        hidden
        data-testid="notification-setting-service-contract"
        data-provider={state.contract.provider}
        data-response-state={state.contract.responseState}
        data-endpoint={state.contract.endpoint}
      >
        {contractJson}
      </pre>

      <section className="notification-setting-card" aria-label="通知设置">
        <div className="notification-feedback" role="status" aria-label="通知设置操作反馈">
          {feedback}
        </div>

        <header className="notification-follow">
          <div className="notification-qr">
            <div role="img" aria-label={readyData?.qrCode.alt ?? '路客云微信公众号二维码'}>
              <img src={readyData?.qrCode.imageDataUrl} alt={readyData?.qrCode.alt ?? '路客云微信公众号二维码'} />
            </div>
          </div>

          <div className="notification-follow__content">
            <strong>{readyData?.intro.title ?? '扫码关注公众号【路客云】，快速通过微信推送订单、房态与门店经营动态。'}</strong>
            <button type="button" className="notification-link" aria-label="查看接受微信通知公众号" onClick={() => setDialogOpen(true)}>
              {readyData?.intro.detailButtonText ?? '查看接受微信通知公众号'}
            </button>
          </div>
        </header>

        <div className="notification-toolbar">
          <button
            type="button"
            className="notification-inline-button"
            aria-label="我已关注？"
            disabled={busyKey === 'follow'}
            onClick={() =>
              void runMutation('follow', () => markNotificationAccountFollowed({ ...requestQuery, mockState: 'success' }))
            }
          >
            我已关注？
          </button>
          <button
            type="button"
            className="notification-inline-button"
            aria-label="刷新一下"
            disabled={busyKey === 'refresh'}
            onClick={() =>
              void runMutation('refresh', () => refreshNotificationFollowStatus({ ...requestQuery, mockState: 'success' }))
            }
          >
            刷新一下
          </button>
        </div>

        {state.kind === 'error' ? (
          <section className="notification-state-card notification-state-card--error" role="alert" aria-label="通知设置加载失败">
            <h2>通知设置加载失败，请稍后重试</h2>
            <p>当前无法同步渠道权限与公众号状态，请点击“重新加载通知设置”重试。</p>
            <button type="button" className="notification-primary-button" onClick={handleRetry}>
              重新加载通知设置
            </button>
          </section>
        ) : null}

        {state.kind === 'loading' ? (
          <section className="notification-state-card" aria-live="polite" aria-label="通知设置加载中">
            <h2>通知设置加载中</h2>
            <p>正在同步渠道权限、公众号关注状态和通知开关，请稍候。</p>
          </section>
        ) : null}

        {readyData && readyData.state === 'empty' ? (
          <section className="notification-state-card notification-state-card--empty" aria-label="通知设置空状态">
            <h2>当前暂无可配置的通知项</h2>
            <p>通知模板尚未初始化，页面保留关注与刷新能力，待服务开通后可继续配置。</p>
          </section>
        ) : null}

        {readyData && readyData.state === 'success' ? (
          <div className="notification-grid" role="table" aria-label="通知设置表">
            <div className="notification-grid__head" role="row">
              <div role="columnheader" />
              {readyData.channels.map((channel: NotificationSettingViewModel['channels'][number]) => (
                <div className="notification-grid__column" role="columnheader" key={channel.key}>
                  <div className="notification-grid__column-text">
                    <span>{channel.title}</span>
                    {channel.subtitle ? <small>{channel.subtitle}</small> : null}
                  </div>
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
                </div>
              ))}
            </div>

            {readyData.items.map((item: NotificationSettingViewModel['items'][number]) => (
              <div className="notification-row" role="row" key={item.key}>
                <div className="notification-row__copy" role="cell">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>

                <div className="notification-row__switch" role="cell">
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
                    <span className="notification-placeholder">-</span>
                  )}
                </div>

                <div className="notification-row__switch" role="cell">
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
                    <span className="notification-placeholder">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {dialogOpen ? (
        <div className="notification-dialog-backdrop" role="presentation" onClick={() => setDialogOpen(false)}>
          <section
            className="notification-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="接受微信通知公众号"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="notification-dialog__header">
              <h2>接受微信通知公众号</h2>
              <button type="button" aria-label="关闭公众号详情" onClick={() => setDialogOpen(false)}>
                ×
              </button>
            </header>

            <p className="notification-dialog__hint">
              {readyData?.followSummary.hint ?? '当前暂无已关注公众号，请扫码关注后刷新状态。'}
            </p>

            {readyData?.followSummary.accounts.length ? (
              <ul className="notification-account-list">
                {readyData.followSummary.accounts.map((account: NotificationSettingViewModel['followSummary']['accounts'][number]) => (
                  <li key={account.accountId}>
                    <strong>{account.accountName}</strong>
                    <span>{account.receivedAt}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="notification-account-empty">暂无已绑定公众号记录，请扫码关注后刷新。</div>
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
      className={`notification-toggle${checked ? ' is-on' : ''}`}
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
