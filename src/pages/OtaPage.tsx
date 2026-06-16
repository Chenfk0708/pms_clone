import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  type OtaChannel,
  type OtaChannelDetailView,
  type OtaDashboard,
  type OtaDetailFilters,
  type OtaDetailTab,
  type OtaChannelSetupForm,
  type OtaLogFilters,
  type OtaLogResult,
  type OtaSyncStoreForm,
  createDefaultOtaDetailFilters,
  createDefaultOtaLogFilters,
  fetchOtaChannelDetail,
  fetchOtaDashboard,
  fetchOtaOperationLogs,
  saveMockOtaChannelSetup,
} from '../services/ota'
import './OtaPage.css'

type FeedbackKind = 'idle' | 'success' | 'error'
type DialogState =
  | { type: 'authorization'; channel: OtaChannel }
  | { type: 'channel-setup'; channel: OtaChannel }
  | { type: 'pending-guide'; channel: OtaChannel }
  | { type: 'sync-store'; detail: OtaChannelDetailView }
  | { type: 'confirm-danger'; confirmText: string; successMessage: string }
  | null

export function OtaPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/log')) return <OtaLogPage key={location.search} />
  if (location.pathname.endsWith('/detail')) return <OtaDetailPage key={location.search} />
  return <OtaDashboardPage key={location.search} />
}

function OtaDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<OtaDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState({ kind: 'idle' as FeedbackKind, message: '' })
  const [dialog, setDialog] = useState<DialogState>(null)

  useEffect(() => {
    let active = true
    fetchOtaDashboard()
      .then((nextData) => {
        if (!active) return
        setData(nextData)
        setError('')
        setFeedback((current) => (current.message ? current : { kind: 'success', message: 'OTA 渠道数据已更新' }))
      })
      .catch((caught: Error) => {
        if (!active) return
        setError(caught.message)
        setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  function refreshDashboard() {
    setFeedback({ kind: 'success', message: '数据已刷新，最近同步时间已更新' })
    setLoading(true)
    setError('')
    fetchOtaDashboard()
      .then((nextData) => setData(nextData))
      .catch((caught: Error) => setError(caught.message))
      .finally(() => setLoading(false))
  }

  async function handleChannelSetupSubmit(form: OtaChannelSetupForm) {
    setDialog(null)
    setLoading(true)
    try {
      await saveMockOtaChannelSetup(form)
      const nextData = await fetchOtaDashboard()
      setData(nextData)
      setError('')
      setFeedback({ kind: 'success', message: '渠道配置已保存，完成渠道侧开通后才会进入已直连渠道' })
    } catch (caught) {
      setFeedback({ kind: 'error', message: caught instanceof Error ? caught.message : '渠道配置保存失败，请重试' })
    } finally {
      setLoading(false)
    }
  }

  async function handleAuthorizeConfirm(channel: OtaChannel) {
    setDialog(null)
    if (channel.status === 'pending') {
      setFeedback({ kind: 'error', message: '未直连渠道需要先完成 OTA 直连配置' })
      return
      setLoading(true)
      try {
        throw new Error('未直连渠道需要先完成 OTA 直连配置')
        const nextData = await fetchOtaDashboard()
        setData(nextData)
        setError('')
        setFeedback({ kind: 'success', message: `${channel.name} 已关联，已移动到已直连渠道` })
      } catch (caught: any) {
        setFeedback({ kind: 'error', message: caught instanceof Error ? caught.message : '渠道关联失败，请重试' })
      } finally {
        setLoading(false)
      }
      return
    }

    setFeedback({ kind: 'success', message: `${channel.name} 授权流程已启动，请在渠道后台完成确认` })
  }

  const hasNoChannels = data && data.connectedChannels.length === 0 && data.pendingChannels.length === 0

  return (
    <div className="ota-page">
      <h1 className="sr-only-heading">OTA</h1>
      <div className="ota-page-header">
        <div className="ota-page-header__spacer" aria-hidden="true" />
        <button type="button" className="ota-log-entry ota-log-entry--header" onClick={() => navigate('/channels/ota/log')}>
          操作日志
        </button>
      </div>

      {loading ? <div className="ota-loading">OTA 渠道数据加载中...</div> : null}

      {error ? (
        <section className="ota-state ota-state--error" role="alert">
          <strong>OTA 数据加载失败</strong>
          <span>{error}</span>
          <button type="button" onClick={refreshDashboard}>重试</button>
        </section>
      ) : null}

      {data ? (
        <>
          {hasNoChannels ? (
            <section className="ota-state">
              <strong>当前筛选条件下暂无渠道数据</strong>
              <span>可以调整门店、日期或运营维度后重新查询。</span>
            </section>
          ) : (
            <>
              <ChannelSection
                title="未直连渠道"
                channels={data.pendingChannels}
                kind="pending"
                onAuthorize={(channel) => setDialog({ type: 'channel-setup', channel })}
                onDetail={(channel) => navigate(`/channels/ota/detail?channel=${encodeURIComponent(toOtaDetailChannelParam(channel))}`)}
              />
              <ChannelSection
                title="已直连渠道"
                channels={data.connectedChannels}
                kind="connected"
                onAuthorize={(channel) => setDialog({ type: 'authorization', channel })}
                onDetail={(channel) => navigate(`/channels/ota/detail?channel=${encodeURIComponent(toOtaDetailChannelParam(channel))}`)}
              />
            </>
          )}
        </>
      ) : null}

      <FeedbackStatus feedback={feedback} />
      {dialog?.type === 'authorization' ? (
        <AuthorizationDialog
          channel={dialog.channel}
          onClose={() => setDialog(null)}
          onConfirm={() => void handleAuthorizeConfirm(dialog.channel)}
        />
      ) : null}
      {dialog?.type === 'channel-setup' ? (
        <OtaChannelSetupDialog
          channel={dialog.channel}
          onClose={() => setDialog(null)}
          onSubmit={(form) => void handleChannelSetupSubmit(form)}
        />
      ) : null}
      {dialog?.type === 'pending-guide' ? (
        <PendingChannelGuideDialog channel={dialog.channel} onClose={() => setDialog(null)} />
      ) : null}
    </div>
  )
}

function OtaDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const channelId = useMemo(() => new URLSearchParams(location.search).get('channel') || 'ctrip', [location.search])
  const [detail, setDetail] = useState<OtaChannelDetailView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [filters, setFilters] = useState<OtaDetailFilters>(() => createDefaultOtaDetailFilters())
  const [activeTab, setActiveTab] = useState<OtaDetailTab>('roomTypes')
  const [dialog, setDialog] = useState<DialogState>(null)

  useEffect(() => {
    let active = true
    fetchOtaChannelDetail(channelId)
      .then((nextData) => {
        if (!active) return
        setDetail(nextData)
        setError('')
      })
      .catch((caught: Error) => {
        if (!active) return
        setError(caught.message)
        setDetail(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [channelId])

  const roomRows = useMemo(() => {
    if (!detail) return []
    return detail.roomRows.filter((row) => {
      const channelStoreMatches = filters.channelStoreId === 'all' || row.channelStoreId === filters.channelStoreId
      const statusMatches = filters.status === 'all' || row.status === filters.status
      const keyword = filters.keyword.trim()
      const keywordMatches = !keyword || row.channelRoomType.includes(keyword) || row.linkedRoomType.includes(keyword)
      return channelStoreMatches && statusMatches && keywordMatches
    })
  }, [detail, filters])

  const storeRows = useMemo(() => {
    if (!detail) return []
    return detail.storeRows.filter((row) => {
      const accountMatches = filters.accountId === 'all' || row.accountId === filters.accountId
      const keyword = filters.keyword.trim()
      const keywordMatches = !keyword || row.channelStoreName.includes(keyword) || row.hotelId.includes(keyword)
      return accountMatches && keywordMatches
    })
  }, [detail, filters])

  function resetFilters() {
    setFilters(createDefaultOtaDetailFilters())
    setFeedback('已重置渠道详情筛选条件')
  }

  function query() {
    setFeedback(`已查询${activeTab === 'roomTypes' ? '房型管理' : '门店管理'}数据`)
  }

  function refresh() {
    setFeedback('渠道详情数据已刷新')
    setLoading(true)
    setError('')
    fetchOtaChannelDetail(channelId)
      .then((nextData) => setDetail(nextData))
      .catch((caught: Error) => {
        setError(caught.message)
        setDetail(null)
      })
      .finally(() => setLoading(false))
  }

  const currentTotal = activeTab === 'roomTypes' ? roomRows.length : storeRows.length

  return (
    <div className="ota-page ota-page--detail">
      <h1 className="sr-only-heading">OTA</h1>
      <div className="ota-breadcrumb ota-breadcrumb--detail">
        <button type="button" onClick={() => navigate('/channels/ota')}>OTA</button>
        <span>/</span>
        <strong>渠道详情</strong>
      </div>

      {loading ? <div className="ota-loading">OTA 渠道详情加载中...</div> : null}

      {error ? (
        <section className="ota-state ota-state--error" role="alert">
          <strong>OTA 渠道详情加载失败</strong>
          <span>{error}</span>
          <button type="button" onClick={refresh}>重试</button>
        </section>
      ) : null}

      {detail ? (
        <section className="ota-detail-card" aria-label={`${detail.channelName}渠道详情`}>
          <header className="ota-detail-head">
            <div className="ota-detail-head__brand">
              <div className={`ota-channel-logo ota-channel-logo--detail ota-channel-logo--${detail.logoTone}`}>{detail.logoText}</div>
              <div>
                <h2>{detail.title}</h2>
                <p>{detail.description}</p>
              </div>
            </div>
            <button type="button" className="ota-log-link" onClick={() => navigate('/channels/ota/log')}>
              操作日志
            </button>
          </header>

          <div className="ota-detail-notice" role="note">
            <strong>注意：</strong>
            <span>{detail.noticeText}</span>
            {detail.noticeLinkLabel ? (
              <button type="button" className="ota-detail-link" onClick={() => setFeedback(`${detail.noticeLinkLabel}入口已打开`)}>
                {detail.noticeLinkLabel}
              </button>
            ) : null}
          </div>

          <div className="ota-detail-tabs" role="tablist" aria-label="OTA 渠道详情标签">
            <button type="button" role="tab" aria-selected={activeTab === 'roomTypes'} className={activeTab === 'roomTypes' ? 'is-active' : ''} onClick={() => setActiveTab('roomTypes')}>
              房型管理
            </button>
            <button type="button" role="tab" aria-selected={activeTab === 'stores'} className={activeTab === 'stores' ? 'is-active' : ''} onClick={() => setActiveTab('stores')}>
              门店管理
            </button>
          </div>

          <section className={`ota-detail-toolbar ${activeTab === 'stores' ? 'ota-detail-toolbar--stores' : ''}`} aria-label="OTA 渠道详情筛选">
            {activeTab === 'stores' ? (
              <div className="ota-detail-toolbar__topline">
                <button type="button" className="ota-button ota-button--primary ota-detail-sync-button" onClick={() => setDialog({ type: 'sync-store', detail })}>
                  同步门店
                </button>
              </div>
            ) : null}

            <div className="ota-detail-toolbar__filters">
              <label className="ota-detail-field">
                <span>{activeTab === 'roomTypes' ? '渠道门店：' : '全部账号：'}</span>
                {activeTab === 'roomTypes' ? (
                  <select value={filters.channelStoreId} onChange={(event) => setFilters((current) => ({ ...current, channelStoreId: event.target.value }))}>
                    {detail.channelStoreOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                ) : (
                  <select value={filters.accountId} onChange={(event) => setFilters((current) => ({ ...current, accountId: event.target.value }))}>
                    {detail.accountOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                )}
              </label>

              {activeTab === 'roomTypes' ? (
                <label className="ota-detail-field">
                  <span>状态：</span>
                  <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as OtaDetailFilters['status'] }))}>
                    {detail.statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              ) : null}

              <label className="ota-detail-field ota-detail-field--wide">
                <span>{activeTab === 'roomTypes' ? '房型名称：' : '门店名称：'}</span>
                <input value={filters.keyword} onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))} placeholder={activeTab === 'roomTypes' ? '请输入房型名称' : '请输入门店名称'} />
              </label>
            </div>

            <div className="ota-detail-actions">
              <button type="button" className="ota-button ota-button--primary" onClick={query}>查询</button>
              <button type="button" className="ota-button" onClick={resetFilters}>重置</button>
              <button type="button" className="ota-icon-button" aria-label="刷新渠道详情" onClick={refresh}>⟳</button>
            </div>
          </section>

          <div className="ota-detail-table-wrap">
            {activeTab === 'roomTypes' ? (
              <table className="ota-detail-table" aria-label="OTA 房型管理列表">
                <thead>
                  <tr>
                    <th>渠道房型</th>
                    <th>状态</th>
                    <th>关联房型</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {roomRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.channelRoomType}</strong>
                        <span>{row.channelStoreName}</span>
                      </td>
                      <td>{row.statusLabel}</td>
                      <td>{row.linkedRoomType}</td>
                      <td>
                        <button
                          type="button"
                          className="ota-detail-action-link ota-detail-action-link--danger"
                          onClick={() =>
                            setDialog({
                              type: 'confirm-danger',
                              confirmText: '您确认解除关联房源吗?',
                              successMessage: `已提交解除关联：${row.channelRoomType}`,
                            })
                          }
                        >
                          解除关联
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="ota-detail-table ota-detail-table--stores" aria-label="OTA 门店管理列表">
                <thead>
                  <tr>
                    <th>酒店名称</th>
                    <th>酒店类型</th>
                    <th>酒店ID</th>
                    <th>关联房型</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {storeRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.channelStoreName}</td>
                      <td>{row.hotelType}</td>
                      <td>{row.hotelId}</td>
                      <td>{row.relatedRoomTypeSummary}</td>
                      <td>
                        <div className="ota-detail-action-group">
                          <button type="button" className="ota-detail-action-link" onClick={() => setFeedback(`已读取 ${row.channelStoreName} 的房源`)}>读取房源</button>
                          <button
                            type="button"
                            className="ota-detail-action-link ota-detail-action-link--danger"
                            onClick={() =>
                              setDialog({
                                type: 'confirm-danger',
                                confirmText: '您确认断开直连房源吗?',
                                successMessage: `已提交断开直连：${row.channelStoreName}`,
                              })
                            }
                          >
                            断开直连
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <footer className="ota-detail-pagination">
            <span>第 1-{currentTotal} 条/总共 {currentTotal} 条</span>
            <div className="ota-detail-pagination__controls">
              <button type="button" disabled aria-label="上一页">〈</button>
              <button type="button" className="is-active" aria-current="page">1</button>
              <button type="button" disabled aria-label="下一页">〉</button>
            </div>
            <label><span>10 条/页</span></label>
          </footer>
        </section>
      ) : null}

      {dialog?.type === 'sync-store' ? (
        <SyncStoreDialog
          detail={dialog.detail}
          onClose={() => setDialog(null)}
          onConfirm={(form) => {
            setDialog(null)
            setFeedback(`已提交同步门店：${form.hotelName || '未填写酒店名称'}`)
          }}
        />
      ) : null}
      {dialog?.type === 'confirm-danger' ? (
        <UnlinkRoomConfirmDialog
          confirmText={dialog.confirmText}
          onClose={() => setDialog(null)}
          onConfirm={() => {
            setFeedback(dialog.successMessage)
            setDialog(null)
          }}
        />
      ) : null}
    </div>
  )
}

function OtaLogPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<OtaLogFilters>(() => createDefaultOtaLogFilters())
  const [data, setData] = useState<OtaLogResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [feedback, setFeedback] = useState({ kind: 'idle' as FeedbackKind, message: '' })

  useEffect(() => {
    let active = true
    fetchOtaOperationLogs(filters)
      .then((nextData) => {
        if (!active) return
        setData(nextData)
      })
      .catch((caught: Error) => {
        if (!active) return
        setError(caught.message)
        setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [filters])

  function updateFilter<Key extends keyof OtaLogFilters>(key: Key, value: OtaLogFilters[Key]) {
    setLoading(true)
    setError('')
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="ota-page ota-page--log">
      <h1 className="sr-only-heading">OTA</h1>
      <div className="ota-breadcrumb">
        <button type="button" onClick={() => navigate('/channels/ota')}>OTA</button>
        <span>/</span>
        <strong>操作日志</strong>
      </div>

      <section className="ota-log-panel">
        <div className="ota-log-filter">
          <label className="ota-field">
            <span>渠道</span>
            <select value={filters.channelId} onChange={(event) => updateFilter('channelId', event.target.value)}>
              {(data?.channelOptions ?? [{ value: 'all', label: '全部渠道' }]).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="ota-field">
            <span>关键字</span>
            <input value={filters.keyword} onChange={(event) => updateFilter('keyword', event.target.value)} placeholder="搜索关键字" />
          </label>
          <label className="ota-field">
            <span>操作人</span>
            <input value={filters.operator} onChange={(event) => updateFilter('operator', event.target.value)} placeholder="搜索操作人" />
          </label>
          <div className="ota-log-actions">
            <button type="button" className="ota-button" onClick={() => setFilters(createDefaultOtaLogFilters())}>重置</button>
            <button type="button" className="ota-button ota-button--primary" onClick={() => setFilters((current) => ({ ...current, page: 1 }))}>查询</button>
            <button type="button" className="ota-link-button" onClick={() => setExpanded((value) => !value)}>{expanded ? '收起' : '展开'}</button>
          </div>
          {expanded ? (
            <div className="ota-log-filter ota-log-filter--advanced">
              <label className="ota-field">
                <span>操作类型</span>
                <select value={filters.operationType} onChange={(event) => updateFilter('operationType', event.target.value)}>
                  {(data?.operationTypeOptions ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="ota-field">
                <span>操作状态</span>
                <select value={filters.operationStatus} onChange={(event) => updateFilter('operationStatus', event.target.value)}>
                  {(data?.operationStatusOptions ?? []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </section>

      {loading ? <div className="ota-loading">OTA 操作日志加载中...</div> : null}
      {error ? <section className="ota-state ota-state--error"><strong>OTA 操作日志加载失败</strong><span>{error}</span></section> : null}

      {data ? (
        <>
          <section className="ota-table-shell">
            <table className="ota-log-table">
              <thead>
                <tr>
                  <th>渠道</th>
                  <th>操作类型</th>
                  <th>操作内容</th>
                  <th>操作状态</th>
                  <th>操作人</th>
                  <th>操作时间</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.channel}</td>
                    <td>{row.type}</td>
                    <td>{row.content}</td>
                    <td><span className="ota-status-success">{row.status}</span></td>
                    <td>{row.operator}</td>
                    <td>{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <nav className="ota-pagination" aria-label="OTA 日志分页">
            {[1, 2, 3].map((pageNumber) => <button key={pageNumber} type="button" className={filters.page === pageNumber ? 'is-active' : ''} onClick={() => updateFilter('page', pageNumber)}>{pageNumber}</button>)}
            <span>共 {data.pagination.total} 条</span>
          </nav>
        </>
      ) : null}

      <FeedbackStatus feedback={feedback} />
    </div>
  )
}

function ChannelSection({
  title,
  channels,
  kind,
  onAuthorize,
  onDetail,
}: {
  title: string
  channels: OtaChannel[]
  kind: 'connected' | 'pending'
  onAuthorize: (channel: OtaChannel) => void
  onDetail: (channel: OtaChannel) => void
}) {
  if (channels.length === 0) return null
  const sectionTitle = kind === 'connected' ? '已直连渠道' : '未直连渠道'
  return (
    <section className="ota-channel-section">
      <div className="ota-section-title"><h2>{sectionTitle || title}</h2></div>
      <div className="ota-card-grid">
        {channels.map((channel, index) => (
          <article key={channel.id} className={`ota-channel-card ota-channel-card--${kind}`}>
            <div className="ota-channel-card__header">
              <div>
                <strong>{channel.name}</strong>
                <span>{channel.relation}</span>
              </div>
              <div className={`ota-channel-logo ota-channel-logo--${(index % 5) + 1}${kind === 'pending' ? ' ota-channel-logo--pending' : ''}`}>{channel.logoText}</div>
            </div>
            <div className="ota-channel-card__actions">
              {kind === 'connected' ? (
                <>
                  <button type="button" onClick={() => onAuthorize(channel)}>新增房型</button>
                  <button type="button" onClick={() => onDetail(channel)}>渠道详情</button>
                </>
              ) : (
                <button type="button" className="ota-primary-action" onClick={() => onAuthorize(channel)}>立即关联</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function toOtaDetailChannelParam(channel: OtaChannel) {
  return channel.accountId ? `${channel.id}|account:${channel.accountId}` : channel.id
}

function FeedbackStatus({ feedback }: { feedback: { kind: FeedbackKind; message: string } }) {
  return <div role="status" className={`ota-live-status ${feedback.kind === 'error' ? 'is-error' : ''}`}>{feedback.message}</div>
}

function OtaChannelSetupDialog({
  channel,
  onClose,
  onSubmit,
}: {
  channel: OtaChannel
  onClose: () => void
  onSubmit: (form: OtaChannelSetupForm) => void
}) {
  const [form, setForm] = useState<OtaChannelSetupForm>({
    channelId: channel.id,
    accountName: `${channel.name}主账号`,
    ebookingAccount: '',
    ebookingPassword: '',
    storeId: 'default',
    storeName: '宿银',
    hotelId: '',
    remark: '',
  })

  function updateField(field: keyof OtaChannelSetupForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  return (
    <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section className="ota-channel-setup-dialog" role="dialog" aria-modal="true" aria-label={`${channel.name}直连配置`} onMouseDown={(event) => event.stopPropagation()}>
        <header className="ota-channel-setup-dialog__header">
          <div>
            <h3>{channel.name}直连配置</h3>
            <p>保存 eBooking 账号和本地门店绑定后，渠道仍保持未直连；完成渠道侧开通后才会进入已直连渠道。</p>
          </div>
          <button type="button" aria-label="关闭" onClick={onClose}>×</button>
        </header>

        <div className="ota-channel-setup-dialog__body">
          <section className="ota-channel-setup-dialog__notice">
            <strong>配置流程</strong>
            <span>1. 填写渠道 eBooking 账号；2. 绑定本地门店；3. 进入渠道详情做房型映射；4. 渠道开通成功后同步订单、房态、价格。</span>
          </section>

          <label>
            <span>账号名称</span>
            <input value={form.accountName} onChange={(event) => updateField('accountName', event.target.value)} placeholder="例如：美团酒店主账号" />
          </label>
          <label>
            <span>eBooking 账号</span>
            <input value={form.ebookingAccount} onChange={(event) => updateField('ebookingAccount', event.target.value)} placeholder="请输入渠道后台账号" />
          </label>
          <label>
            <span>eBooking 密码</span>
            <input type="password" value={form.ebookingPassword} onChange={(event) => updateField('ebookingPassword', event.target.value)} placeholder="请输入渠道后台密码" />
          </label>
          <label>
            <span>本地门店</span>
            <input value={form.storeName} onChange={(event) => updateField('storeName', event.target.value)} placeholder="请选择或填写 PMS 门店" />
          </label>
          <label>
            <span>渠道酒店 ID</span>
            <input value={form.hotelId} onChange={(event) => updateField('hotelId', event.target.value)} placeholder="没有可先留空，开通后补充" />
          </label>
          <label className="ota-channel-setup-dialog__full">
            <span>备注</span>
            <textarea value={form.remark} onChange={(event) => updateField('remark', event.target.value)} placeholder="记录渠道联系人、开通进度或特殊说明" />
          </label>
        </div>

        <footer className="ota-channel-setup-dialog__footer">
          <button type="button" className="ota-button" onClick={onClose}>取消</button>
          <button type="button" className="ota-button ota-button--primary" onClick={() => onSubmit(form)}>保存配置</button>
        </footer>
      </section>
    </div>
  )
}

function AuthorizationDialog({ channel, onClose, onConfirm }: { channel: OtaChannel; onClose: () => void; onConfirm: () => void }) {
  const notice = channel.authorizationNotice
  const [secondsLeft, setSecondsLeft] = useState(notice.countdownSeconds ?? 0)

  useEffect(() => {
    if (!notice.countdownSeconds || secondsLeft <= 0) return
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [notice.countdownSeconds, secondsLeft])

  const buttonDisabled = secondsLeft > 0
  const buttonLabel = buttonDisabled ? `${notice.confirmLabel}(${secondsLeft}s)` : notice.confirmLabel

  return (
    <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section className="ota-auth-dialog" role="dialog" aria-modal="true" aria-label={notice.title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="ota-auth-dialog__header"><h3>{notice.title}</h3></header>
        <div className="ota-auth-dialog__intro">
          <div className={`ota-auth-dialog__badge ota-auth-dialog__badge--${notice.badgeTone}`}>{notice.badgeText}</div>
          <p>{notice.summary}{notice.highlight ? <span>{notice.highlight}</span> : null}{notice.summarySuffix}</p>
        </div>
        <section className="ota-auth-dialog__notice">
          <h4>{notice.noticeTitle}</h4>
          <div className="ota-auth-dialog__notice-body">
            {notice.noticeSections.map((section) => (
              <div key={section.heading} className="ota-auth-dialog__notice-section">
                <strong>{section.heading}</strong>
                {section.paragraphs.map((paragraph, index) => <p key={`${section.heading}-${index}`}>{paragraph}</p>)}
              </div>
            ))}
          </div>
        </section>
        <footer className="ota-auth-dialog__footer">
          <button type="button" className="ota-button" onClick={onClose}>{notice.cancelLabel}</button>
          <button type="button" className="ota-button ota-button--primary" disabled={buttonDisabled} onClick={onConfirm}>{buttonLabel}</button>
        </footer>
      </section>
    </div>
  )
}

function SyncStoreDialog({
  detail,
  onClose,
  onConfirm,
}: {
  detail: OtaChannelDetailView
  onClose: () => void
  onConfirm: (form: OtaSyncStoreForm) => void
}) {
  const [form, setForm] = useState<OtaSyncStoreForm>(detail.syncStoreDefaults)

  return (
    <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section className="ota-sync-dialog" role="dialog" aria-modal="true" aria-label={detail.syncStoreNotice.title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="ota-sync-dialog__header">
          <h3>{detail.syncStoreNotice.title}</h3>
          <button type="button" className="ota-sync-dialog__close" aria-label="关闭" onClick={onClose}>×</button>
        </header>

        <div className="ota-sync-dialog__body">
          <div className="ota-sync-dialog__notice">
            <strong>直连前须知：</strong>
            <div>
              {detail.syncStoreNotice.paragraphs.map((item) => <p key={item}>{item}</p>)}
            </div>
          </div>

          <div className="ota-sync-dialog__form">
            <div className="ota-sync-dialog__row">
              <span className="ota-sync-dialog__label">子酒店类型：</span>
              <label className="ota-sync-dialog__radio">
                <input type="radio" name="hotelSubtype" checked={form.hotelSubtype === 'prepay'} onChange={() => setForm((current) => ({ ...current, hotelSubtype: 'prepay' }))} />
                <span>预付</span>
              </label>
              <label className="ota-sync-dialog__radio">
                <input type="radio" name="hotelSubtype" checked={form.hotelSubtype === 'payAtHotel'} onChange={() => setForm((current) => ({ ...current, hotelSubtype: 'payAtHotel' }))} />
                <span>现付</span>
              </label>
            </div>

            <label className="ota-sync-dialog__row">
              <span className="ota-sync-dialog__label">子酒店ID：</span>
              <input value={form.subHotelId} onChange={(event) => setForm((current) => ({ ...current, subHotelId: event.target.value }))} placeholder="请输入子酒店ID" />
              <span className="ota-sync-dialog__hint">?</span>
            </label>

            <label className="ota-sync-dialog__row">
              <span className="ota-sync-dialog__label">酒店名称：</span>
              <input value={form.hotelName} onChange={(event) => setForm((current) => ({ ...current, hotelName: event.target.value }))} placeholder="请输入酒店名称" />
            </label>
          </div>
        </div>

        <footer className="ota-sync-dialog__footer">
          <button type="button" className="ota-button ota-button--primary ota-sync-dialog__submit" onClick={() => onConfirm(form)}>下一步</button>
        </footer>
      </section>
    </div>
  )
}

function PendingChannelGuideDialog({
  channel,
  onClose,
}: {
  channel: OtaChannel
  onClose: () => void
}) {
  return (
    <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section
        className="ota-pending-guide"
        role="dialog"
        aria-modal="true"
        aria-label={`${channel.name}关联引导`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ota-pending-guide__orb ota-pending-guide__orb--left" aria-hidden="true" />
        <div className="ota-pending-guide__orb ota-pending-guide__orb--right" aria-hidden="true" />
        <button type="button" className="ota-pending-guide__close" aria-label="关闭" onClick={onClose}>×</button>

        <div className="ota-pending-guide__avatar" aria-hidden="true">
          <div className="ota-pending-guide__avatar-ring">
            <div className="ota-pending-guide__avatar-core" />
          </div>
        </div>

        <p className="ota-pending-guide__headline">
          路客云领先 “软件客服服务”
          <br />
          添加客服即可获得：
        </p>

        <ol className="ota-pending-guide__benefits">
          <li>专业人工培训+操作宝典</li>
          <li>酒店民宿经营学习干货</li>
          <li>开通22大售卖渠道直连</li>
        </ol>

        <div className="ota-pending-guide__qr" aria-label="客服二维码">
          <div className="ota-pending-guide__qr-grid">
            {Array.from({ length: 121 }).map((_, index) => (
              <span key={index} className={`ota-pending-guide__qr-cell${isQrCellFilled(index) ? ' is-filled' : ''}`} />
            ))}
          </div>
          <span className="ota-pending-guide__qr-eye ota-pending-guide__qr-eye--tl" />
          <span className="ota-pending-guide__qr-eye ota-pending-guide__qr-eye--tr" />
          <span className="ota-pending-guide__qr-eye ota-pending-guide__qr-eye--bl" />
          <span className="ota-pending-guide__qr-center">Q</span>
        </div>

        <button type="button" className="ota-pending-guide__save">保存二维码</button>
      </section>
    </div>
  )
}

function UnlinkRoomConfirmDialog({
  confirmText,
  onClose,
  onConfirm,
}: {
  confirmText: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="ota-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section className="ota-inline-confirm" role="dialog" aria-modal="true" aria-label="解除关联确认" onMouseDown={(event) => event.stopPropagation()}>
        <div className="ota-inline-confirm__body">
          <span className="ota-inline-confirm__icon">!</span>
          <strong>{confirmText}</strong>
        </div>
        <div className="ota-inline-confirm__actions">
          <button type="button" className="ota-inline-confirm__button" onClick={onClose}>取消</button>
          <button type="button" className="ota-inline-confirm__button ota-inline-confirm__button--primary" onClick={onConfirm}>确定</button>
        </div>
      </section>
    </div>
  )
}

function isQrCellFilled(index: number) {
  const row = Math.floor(index / 11)
  const col = index % 11
  const finder =
    (row <= 2 && col <= 2) ||
    (row <= 2 && col >= 8) ||
    (row >= 8 && col <= 2)
  if (finder) return true
  return (row * 7 + col * 11 + index) % 5 < 2
}
