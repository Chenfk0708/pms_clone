import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  defaultSocialFilters,
  fetchSocialOverview,
  type SocialChannel,
  type SocialFilters,
  type SocialViewModel,
} from '../services/social'
import './SocialPage.css'

type DialogState =
  | { type: 'channel'; channel: SocialChannel }
  | { type: 'subscription'; channel: SocialChannel }
  | null

type ActionDialogState =
  | { type: 'disconnect'; authorizationName: string }
  | { type: 'addAccount' }
  | { type: 'syncRoomType'; tab: '日历房型' | '预售房型' }
  | null

function getLogoLabel(channel: SocialChannel) {
  if (channel.id.startsWith('xiaohongshu')) return '小红书'
  if (channel.id.startsWith('shipinhao')) return '视频号'
  return '抖音'
}

export function SocialPage() {
  const navigate = useNavigate()
  const [query] = useState<SocialFilters>(defaultSocialFilters)
  const [viewModel, setViewModel] = useState<SocialViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const hasLoaded = useRef(false)

  useEffect(() => {
    const controller = new AbortController()

    fetchSocialOverview(query, controller.signal)
      .then((data) => {
        setViewModel(data)
        setError('')
        hasLoaded.current = true
      })
      .catch((loadError: Error) => {
        if (controller.signal.aborted) return
        setError(loadError.message || '社媒数据加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query])

  const allChannels = useMemo(
    () => [...(viewModel?.connectedChannels ?? []), ...(viewModel?.pendingChannels ?? [])],
    [viewModel],
  )
  const requestBody = viewModel ? JSON.stringify(viewModel.requestBody) : '{}'

  function showChannelDetail(channel: SocialChannel) {
    setDialog({ type: 'channel', channel })
  }

  function showSubscription(channel: SocialChannel) {
    navigate('/version/applicationPayment', { state: { source: 'social-channel', channel: channel.id } })
  }

  function openChannelManage(channel: SocialChannel) {
    if (channel.status === 'connected') {
      navigate('/channels/social/setting')
      return
    }
    showChannelDetail(channel)
  }

  function confirmSubscription() {
    setDialog(null)
  }

  return (
    <div
      className="social-channel-page"
      data-testid="social-channel-page"
      data-provider={viewModel?.provider ?? 'loading'}
      data-trace-id={viewModel?.traceId ?? ''}
      data-request-body={requestBody}
    >
      <h1 className="sr-only-heading">社媒</h1>
      <section className="social-channel-surface social-channel-surface--list">
        {isLoading && !hasLoaded.current ? (
          <div className="social-feedback" role="status">
            社媒数据加载中
          </div>
        ) : null}

        {error ? (
          <section className="social-state-panel social-state-panel--error" role="alert">
            <strong>社媒数据加载失败</strong>
            <span>请稍后刷新页面后重试。</span>
          </section>
        ) : null}

        {viewModel ? (
          allChannels.length === 0 ? (
            <section className="social-state-panel">
              <strong>暂无符合当前条件的社媒渠道</strong>
              <span>当前没有可展示的渠道卡片。</span>
            </section>
          ) : (
            <div className="social-channel-list">
              <ChannelSection title="已直连渠道" channels={viewModel.connectedChannels} onDetail={openChannelManage} />
              <ChannelSection
                title="未直连渠道"
                channels={viewModel.pendingChannels}
                onDetail={openChannelManage}
                onSubscribe={showSubscription}
              />
            </div>
          )
        ) : null}
      </section>

      {dialog?.type === 'channel' ? <ChannelDialog channel={dialog.channel} onClose={() => setDialog(null)} /> : null}
      {dialog?.type === 'subscription' ? (
        <SubscriptionDialog channel={dialog.channel} onConfirm={confirmSubscription} onClose={() => setDialog(null)} />
      ) : null}
    </div>
  )
}

function PanelTitle({ title }: { title: string }) {
  return (
    <div className="social-channel-section__title">
      <span aria-hidden="true" />
      <h2>{title}</h2>
    </div>
  )
}

function ChannelSection({
  title,
  channels,
  onDetail,
  onSubscribe,
}: {
  title: string
  channels: SocialChannel[]
  onDetail: (channel: SocialChannel) => void
  onSubscribe?: (channel: SocialChannel) => void
}) {
  if (channels.length === 0) return null

  return (
    <section className="social-channel-section">
      <PanelTitle title={title} />
      <div className={channels.length === 1 ? 'social-channel-grid social-channel-grid--single' : 'social-channel-grid'}>
        {channels.map((channel) => (
          <article
            key={channel.id}
            className={`social-channel-card social-channel-card--${channel.status}`}
            aria-label={channel.name}
            tabIndex={0}
            onClick={() => onDetail(channel)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') onDetail(channel)
            }}
          >
            <div className="social-channel-card__meta">
              <strong>{channel.name}</strong>
              {channel.status === 'connected' ? (
                <>
                  <span>{channel.relation}</span>
                  <span>支持：{channel.support.join('、') || '渠道运营'}</span>
                </>
              ) : null}
            </div>
            <div className={`social-channel-card__logo social-channel-card__logo--${channel.accent}`}>{getLogoLabel(channel)}</div>
            <div className="social-channel-card__actions">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  if (channel.status === 'pending' && onSubscribe) onSubscribe(channel)
                  else onDetail(channel)
                }}
              >
                {channel.action}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ChannelDialog({ channel, onClose }: { channel: SocialChannel; onClose: () => void }) {
  return (
    <div className="social-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="social-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`${channel.name}渠道详情`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h3>{channel.name}渠道详情</h3>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            ×
          </button>
        </header>
        <dl>
          <div>
            <dt>渠道状态</dt>
            <dd>{channel.status === 'connected' ? '已直连' : '待开通'}</dd>
          </div>
          <div>
            <dt>关联房型</dt>
            <dd>
              {channel.linkedRoomTypeCount}/{channel.roomTypeCount}
            </dd>
          </div>
          <div>
            <dt>支持业务</dt>
            <dd>{channel.support.join('、') || '渠道运营'}</dd>
          </div>
          <div>
            <dt>今日订单</dt>
            <dd>{channel.dailyOrders}</dd>
          </div>
        </dl>
        <div className="social-modal__tasks">
          {channel.pendingTasks.map((task) => (
            <span key={task}>{task}</span>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            关闭详情
          </button>
        </footer>
      </section>
    </div>
  )
}

function SubscriptionDialog({
  channel,
  onClose,
  onConfirm,
}: {
  channel: SocialChannel
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="social-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="social-modal social-modal--small"
        role="dialog"
        aria-modal="true"
        aria-label={`${channel.name}订阅方案`}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h3>{channel.name}订阅方案</h3>
          <button type="button" aria-label="关闭订阅方案" onClick={onClose}>
            ×
          </button>
        </header>
        <p>开通后可管理渠道内容、活动库存和订单承接。</p>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="social-modal__primary" onClick={onConfirm}>
            确认订阅
          </button>
        </footer>
      </section>
    </div>
  )
}

export function SocialSettingPage() {
  const tabs = ['账号管理', '门店管理', '日历房型', '预售房型'] as const
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('账号管理')
  const [statusFilter, setStatusFilter] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [draftKeyword, setDraftKeyword] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)
  const [storeAccountFilter, setStoreAccountFilter] = useState('all')
  const [storeKeyword, setStoreKeyword] = useState('')
  const [calendarChannelFilter, setCalendarChannelFilter] = useState('all')
  const [calendarAuditFilter, setCalendarAuditFilter] = useState('all')
  const [calendarShelfFilter, setCalendarShelfFilter] = useState('all')
  const [calendarKeyword, setCalendarKeyword] = useState('')
  const [presaleChannelFilter, setPresaleChannelFilter] = useState('all')
  const [presaleAuditFilter, setPresaleAuditFilter] = useState('all')
  const [presaleShelfFilter, setPresaleShelfFilter] = useState('all')
  const [presaleKeyword, setPresaleKeyword] = useState('')
  const [actionDialog, setActionDialog] = useState<ActionDialogState>(null)
  const [toastMessage, setToastMessage] = useState('')
  const [selectedSolution, setSelectedSolution] = useState('presale')

  const accountRows = [
    {
      id: '7370207731854149643',
      accountId: '1820360983796908034',
      storeCount: '0',
      authorizations: [
        { name: '酒店行业预售券解决方案', status: '已发布' },
        { name: '酒店行业日历房解决方案', status: '审核中' },
      ],
    },
  ]

  const filteredAccountRows = accountRows.filter((row) => {
    const matchesStatus =
      statusFilter === 'all' ||
      row.authorizations.some((item) => (statusFilter === 'published' ? item.status === '已发布' : item.status === '审核中'))
    const matchesKeyword = keyword.trim() === '' || row.accountId.includes(keyword.trim()) || row.id.includes(keyword.trim())
    return matchesStatus && matchesKeyword
  })

  const accountCountText =
    filteredAccountRows.length > 0 ? `第 1-${filteredAccountRows.length} 条/总共 ${filteredAccountRows.length} 条` : '第 0-0 条/总共 0 条'

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(''), 1800)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  function handleSearch() {
    setKeyword(draftKeyword.trim())
  }

  function handleReset() {
    setStatusFilter('all')
    setDraftKeyword('')
    setKeyword('')
  }

  function handlePullRoomType() {
    setToastMessage('刷新成功')
  }

  function handleDisconnect(authorizationName: string) {
    setActionDialog({ type: 'disconnect', authorizationName })
  }

  function confirmDisconnect() {
    setActionDialog(null)
    setToastMessage('操作成功')
  }

  const tabView = {
    账号管理: (
      <>
        <div className="social-detail-toolbar">
          <div className="social-detail-toolbar__filters">
            <label className="social-detail-field">
              <span>审核状态：</span>
              <select aria-label="审核状态" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">全部</option>
                <option value="published">已发布</option>
                <option value="reviewing">审核中</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>账号：</span>
              <input aria-label="账号" value={draftKeyword} onChange={(event) => setDraftKeyword(event.target.value)} />
            </label>
          </div>
          <div className="social-detail-toolbar__actions">
            <button type="button" className="social-detail-toolbar__primary" onClick={() => setActionDialog({ type: 'addAccount' })}>
              添加账号
            </button>
            <button type="button" className="social-detail-toolbar__submit" onClick={handleSearch}>
              查 询
            </button>
            <button type="button" className="social-detail-toolbar__outline" onClick={handleReset}>
              重 置
            </button>
            <button
              type="button"
              className="social-detail-toolbar__refresh"
              aria-label="刷新账号管理"
              onClick={() => setRefreshTick((value) => value + 1)}
            >
              ↻
            </button>
          </div>
        </div>
        <div className="social-detail-table-wrap" data-refresh-tick={refreshTick}>
          <table className="social-detail-table" aria-label="社媒账号管理列表">
            <thead>
              <tr>
                <th>渠道账号id</th>
                <th>账号ID</th>
                <th>门店</th>
                <th>授权业务</th>
                <th>审核状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccountRows.length > 0 ? (
                filteredAccountRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.accountId}</td>
                    <td>{row.storeCount}</td>
                    <td>
                      <div className="social-detail-stack">
                        {row.authorizations.map((item) => (
                          <span key={item.name}>{item.name}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="social-detail-stack">
                        {row.authorizations.map((item) => (
                          <span
                            key={`${item.name}-${item.status}`}
                            className={item.status === '审核中' ? 'social-detail-status social-detail-status--reviewing' : 'social-detail-status'}
                          >
                            {item.status}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="social-detail-stack social-detail-stack--actions">
                        <div className="social-detail-actions">
                          <button type="button" className="social-detail-actions__danger" onClick={() => handleDisconnect(row.authorizations[0].name)}>
                            断开直连
                          </button>
                          <button type="button" onClick={handlePullRoomType}>
                            拉取房型
                          </button>
                        </div>
                        <div className="social-detail-actions">
                          <button type="button" className="social-detail-actions__danger" onClick={() => handleDisconnect(row.authorizations[1].name)}>
                            断开直连
                          </button>
                          <button type="button" onClick={handlePullRoomType}>
                            拉取房型
                          </button>
                          <button type="button">授权日历房</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <div className="social-detail-empty">暂无符合条件的账号记录</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <footer className="social-detail-pagination">
          <span>{accountCountText}</span>
          <div className="social-detail-pagination__controls">
            <button type="button" aria-label="上一页" disabled>
              ‹
            </button>
            <button type="button" className="is-active">
              1
            </button>
            <button type="button" aria-label="下一页" disabled>
              ›
            </button>
            <button type="button" className="social-detail-pagination__size">
              10 条/页
            </button>
          </div>
        </footer>
      </>
    ),
    门店管理: (
      <SocialDetailScaffold
        intro="您已开通抖音来客直连，可在下方【门店管理】处读取渠道门店，并和路客云门店进行关联操作，完成【门店关联】后可进行房型管理。"
        primaryAction="读取门店"
        onPrimaryAction={handlePullRoomType}
        filters={
          <>
            <label className="social-detail-field">
              <span>全部账号：</span>
              <select value={storeAccountFilter} onChange={(event) => setStoreAccountFilter(event.target.value)}>
                <option value="all">全部</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>门店名称:</span>
              <input value={storeKeyword} placeholder="请输入门店名称" onChange={(event) => setStoreKeyword(event.target.value)} />
            </label>
          </>
        }
        columns={['渠道门店', '渠道账号', '房型数量', '路客云门店关联状态', '关联路客云门店', '操作']}
      />
    ),
    日历房型: (
      <SocialDetailScaffold
        intro="您已开通抖音来客直连，请在【门店管理】处关联门店后，在下方【日历房型】处操作【同步房型】；"
        primaryAction="同步房型"
        onPrimaryAction={() => setActionDialog({ type: 'syncRoomType', tab: '日历房型' })}
        filters={
          <>
            <label className="social-detail-field">
              <span>渠道门店:</span>
              <select value={calendarChannelFilter} onChange={(event) => setCalendarChannelFilter(event.target.value)}>
                <option value="all">全部</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>审核状态:</span>
              <select value={calendarAuditFilter} onChange={(event) => setCalendarAuditFilter(event.target.value)}>
                <option value="all">全部</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>上架状态:</span>
              <select value={calendarShelfFilter} onChange={(event) => setCalendarShelfFilter(event.target.value)}>
                <option value="all">全部</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>房型名称:</span>
              <input value={calendarKeyword} placeholder="请输入房型名称" onChange={(event) => setCalendarKeyword(event.target.value)} />
            </label>
          </>
        }
        columns={['房型', '门店', '关联账号', '房型图片', '上架状态', '审核状态', '路客云房型关联状态', '关联路客云房型', '操作']}
      />
    ),
    预售房型: (
      <SocialDetailScaffold
        intro="您已开通抖音来客直连，请在【门店管理】处关联门店后，在下方【预售房型】处操作【同步房型】。"
        notes={[
          '注：1. 同步预售房型至抖音来客后，需要在抖音来客创建预售券关联同步的预售房型，才可实现房态、订单同步。',
          '2. 预售房型不支持设置房型价格，因此在【价格库存】无法设置预售房型价格；',
        ]}
        primaryAction="同步房型"
        onPrimaryAction={() => setActionDialog({ type: 'syncRoomType', tab: '预售房型' })}
        filters={
          <>
            <label className="social-detail-field">
              <span>渠道门店:</span>
              <select value={presaleChannelFilter} onChange={(event) => setPresaleChannelFilter(event.target.value)}>
                <option value="all">全部</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>审核状态:</span>
              <select value={presaleAuditFilter} onChange={(event) => setPresaleAuditFilter(event.target.value)}>
                <option value="all">全部</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>上架状态:</span>
              <select value={presaleShelfFilter} onChange={(event) => setPresaleShelfFilter(event.target.value)}>
                <option value="all">全部</option>
              </select>
            </label>
            <label className="social-detail-field">
              <span>房型名称:</span>
              <input value={presaleKeyword} placeholder="请输入房型名称" onChange={(event) => setPresaleKeyword(event.target.value)} />
            </label>
          </>
        }
        columns={['房型', '门店', '关联账号', '房型图片', '上架状态', '审核状态', '路客云房型关联状态', '关联路客云房型', '操作']}
      />
    ),
  } satisfies Record<(typeof tabs)[number], ReactNode>

  return (
    <div className="social-channel-page social-channel-page--detail" data-testid="social-channel-detail">
      <h1 className="sr-only-heading">社媒</h1>
      <section className="social-detail-surface">
        {toastMessage ? (
          <div className="social-inline-toast" role="status" aria-live="polite">
            {toastMessage}
          </div>
        ) : null}
        <div className="social-detail-breadcrumb">
          <Link to="/channels/social">社媒</Link>
          <span>/</span>
          <strong>渠道详情</strong>
        </div>

        <section className="social-detail-card">
          <header className="social-detail-card__head">
            <div>
              <h2>抖音来客直连</h2>
              <p>您已开通抖音来客直连，请在账号审核通过后进行门店管理、房型管理操作。</p>
            </div>
          </header>
          <div className="social-detail-tabs" role="tablist" aria-label="社媒渠道详情">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                className={activeTab === tab ? 'is-active' : ''}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          {tabView[activeTab]}
        </section>
      </section>
      {actionDialog?.type === 'disconnect' ? (
        <DisconnectConfirmDialog
          authorizationName={actionDialog.authorizationName}
          onClose={() => setActionDialog(null)}
          onConfirm={confirmDisconnect}
        />
      ) : null}
      {actionDialog?.type === 'addAccount' ? (
        <AddAccountDialog
          selectedSolution={selectedSolution}
          onChangeSolution={setSelectedSolution}
          onClose={() => setActionDialog(null)}
          onConfirm={() => setActionDialog(null)}
        />
      ) : null}
      {actionDialog?.type === 'syncRoomType' ? (
        <SyncRoomTypeDialog title="同步房型至渠道" onClose={() => setActionDialog(null)} onConfirm={() => setActionDialog(null)} />
      ) : null}
    </div>
  )
}

function SocialDetailScaffold({
  intro,
  notes,
  primaryAction,
  onPrimaryAction,
  filters,
  columns,
}: {
  intro: string
  notes?: string[]
  primaryAction: string
  onPrimaryAction?: () => void
  filters: ReactNode
  columns: string[]
}) {
  return (
    <>
      <div className="social-detail-subtoolbar">
        <p className="social-detail-subtoolbar__intro">{intro}</p>
        {notes?.length ? (
          <div className="social-detail-subtoolbar__notes">
            {notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        ) : null}
      </div>
      <div className="social-detail-toolbar">
        <div className="social-detail-toolbar__filters">{filters}</div>
        <div className="social-detail-toolbar__actions">
          <button type="button" className="social-detail-toolbar__primary" onClick={onPrimaryAction}>
            {primaryAction}
          </button>
          <button type="button" className="social-detail-toolbar__submit">
            查 询
          </button>
          <button type="button" className="social-detail-toolbar__outline">
            重 置
          </button>
          <button type="button" className="social-detail-toolbar__refresh" aria-label={`刷新${primaryAction}`}>
            ↻
          </button>
        </div>
      </div>
      <div className="social-detail-table-wrap">
        <table className="social-detail-table" aria-label={columns.join(' / ')}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length}>
                <div className="social-detail-empty">
                  <span className="social-detail-empty__icon" aria-hidden="true" />
                  <span className="social-detail-empty__text">暂无数据</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function DisconnectConfirmDialog({
  authorizationName,
  onClose,
  onConfirm,
}: {
  authorizationName: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="social-confirm-backdrop" role="presentation" onClick={onClose}>
      <section
        className="social-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`断开直连确认：${authorizationName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="social-confirm-dialog__body">是否确认断开直连?</div>
        <footer className="social-confirm-dialog__footer">
          <button type="button" className="social-confirm-dialog__ghost" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="social-confirm-dialog__primary" onClick={onConfirm}>
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}

function AddAccountDialog({
  selectedSolution,
  onChangeSolution,
  onClose,
  onConfirm,
}: {
  selectedSolution: string
  onChangeSolution: (value: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="social-confirm-backdrop" role="presentation" onClick={onClose}>
      <section
        className="social-selection-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="选择抖音解决方案"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="social-selection-dialog__header">
          <h3>选择抖音解决方案</h3>
          <button type="button" aria-label="关闭选择抖音解决方案" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="social-selection-dialog__body">
          <label className="social-radio-option">
            <input
              type="radio"
              name="douyin-solution"
              value="presale"
              checked={selectedSolution === 'presale'}
              onChange={(event) => onChangeSolution(event.target.value)}
            />
            <span>酒店行业预售券解决方案</span>
          </label>
          <label className="social-radio-option">
            <input
              type="radio"
              name="douyin-solution"
              value="calendar"
              checked={selectedSolution === 'calendar'}
              onChange={(event) => onChangeSolution(event.target.value)}
            />
            <span>酒店行业日历房解决方案</span>
          </label>
        </div>
        <footer className="social-selection-dialog__footer">
          <button type="button" className="social-confirm-dialog__ghost" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="social-confirm-dialog__primary" onClick={onConfirm}>
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}

function SyncRoomTypeDialog({
  title,
  onClose,
  onConfirm,
}: {
  title: string
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="social-confirm-backdrop" role="presentation" onClick={onClose}>
      <section className="social-sync-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header className="social-selection-dialog__header">
          <h3>{title}</h3>
          <button type="button" aria-label={`关闭${title}`} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="social-sync-dialog__body">
          <div className="social-sync-dialog__toolbar">
            <label className="social-detail-field">
              <span>渠道门店:</span>
              <select defaultValue="none">
                <option value="none">请选择渠道门店</option>
              </select>
            </label>
            <span className="social-sync-dialog__warning">暂无渠道门店</span>
          </div>
          <div className="social-sync-dialog__alert">未选择任何房型</div>
          <div className="social-sync-dialog__table">
            <div className="social-sync-dialog__table-head">
              <span />
              <span>房型</span>
              <span>房型图片</span>
              <span>原因</span>
            </div>
            <div className="social-sync-dialog__empty">
              <span className="social-detail-empty__icon" aria-hidden="true" />
              <span className="social-detail-empty__text">暂无数据</span>
            </div>
          </div>
        </div>
        <footer className="social-sync-dialog__footer">
          <button type="button" className="social-confirm-dialog__ghost" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="social-sync-dialog__disabled" onClick={onConfirm} disabled>
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}
