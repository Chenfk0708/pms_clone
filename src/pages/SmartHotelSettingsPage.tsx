import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createDefaultSmartHotelSettingsButtons,
  createDefaultSmartHotelSettingsQuery,
  fetchSmartHotelSettingsDashboard,
  publishSmartHotelSettingsShare,
  saveSmartHotelSettingsDecorate,
  uploadSmartHotelSettingsButtonIcon,
  type SmartHotelSettingsActionButton,
  type SmartHotelSettingsDashboard,
  type SmartHotelSettingsShareDraft,
} from '../services/smartHotelSettings'
import './SmartHotelSettingsPage.css'

type SmartTab = 'decorate' | 'share'

type PreviewDialogState = {
  title: string
  description: string
  primaryLabel?: string
  primaryPath?: string
} | null

export function SmartHotelSettingsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState<SmartHotelSettingsDashboard | null>(null)
  const [activeTab, setActiveTab] = useState<SmartTab>('decorate')
  const [buttons, setButtons] = useState<SmartHotelSettingsActionButton[]>([])
  const [shareDraft, setShareDraft] = useState<SmartHotelSettingsShareDraft | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingDecorate, setIsSavingDecorate] = useState(false)
  const [isPublishingShare, setIsPublishingShare] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState('智住小程序数据加载中')
  const [decorateSavedHint, setDecorateSavedHint] = useState('')
  const [hasDecorateChanges, setHasDecorateChanges] = useState(false)
  const [hasShareChanges, setHasShareChanges] = useState(false)
  const [sharePreviewTitle, setSharePreviewTitle] = useState('分享卡片发布后将显示在这里')
  const [emptyResolved, setEmptyResolved] = useState(false)
  const [previewDialog, setPreviewDialog] = useState<PreviewDialogState>(null)

  useEffect(() => {
    const controller = new AbortController()
    const query = createDefaultSmartHotelSettingsQuery(new URLSearchParams(location.search))

    const loadDashboard = async () => {
      setIsLoading(true)
      setErrorMessage('')
      setDecorateSavedHint('')
      setHasDecorateChanges(false)
      setHasShareChanges(false)
      setSharePreviewTitle('分享卡片发布后将显示在这里')
      setEmptyResolved(false)

      try {
        const result = await fetchSmartHotelSettingsDashboard(query, controller.signal)
        setDashboard(result)
        setButtons(result.buttons)
        setShareDraft(result.shareDraft)
        setFeedback(result.emptyState ? result.emptyState.title : '智住小程序数据已加载')
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDashboard(null)
        setButtons([])
        setShareDraft(null)
        setErrorMessage(error instanceof Error ? error.message : '智住小程序数据加载失败，请稍后重试')
        setFeedback(error instanceof Error ? error.message : '智住小程序数据加载失败，请稍后重试')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => controller.abort()
  }, [location.search])

  const diagnosticsState = dashboard?.state ?? createDefaultSmartHotelSettingsQuery(new URLSearchParams(location.search)).mockState
  const diagnosticsProvider = dashboard?.provider ?? 'mock'
  const diagnosticsRequest = dashboard?.request
    ? JSON.stringify(dashboard.request)
    : JSON.stringify({
        endpoint: '/smartHotelSettings/dashboard/get',
        mockState: diagnosticsState,
      })
  const isEmptyState = Boolean(dashboard?.emptyState) && !emptyResolved && !errorMessage
  const previewButtons = buttons.length > 0 ? buttons : createDefaultSmartHotelSettingsButtons()
  const currentShareDraft = shareDraft ?? dashboard?.shareDraft

  function markDecorateChanged(nextButtons: SmartHotelSettingsActionButton[], nextFeedback?: string) {
    setButtons(nextButtons)
    setHasDecorateChanges(true)
    setDecorateSavedHint('')
    if (nextFeedback) {
      setFeedback(nextFeedback)
    }
  }

  function updateButton(id: string, field: 'name' | 'content', value: string) {
    markDecorateChanged(
      buttons.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      `已更新「${field === 'name' ? '按钮名称' : '弹框文案'}」`,
    )
  }

  function addButton() {
    markDecorateChanged(
      [
        ...buttons,
        {
          id: `custom-${buttons.length + 1}`,
          name: '新按钮',
          content: '请补充该按钮对应的业务说明。',
          iconSeed: '新增',
          previewAction: {
            kind: 'dialog',
            title: '自定义按钮',
            description: '请补充该按钮的业务跳转或弹窗文案。',
          },
        },
      ],
      '已新增一个底部按钮',
    )
  }

  function removeButton(id: string) {
    if (buttons.length <= 1) {
      setFeedback('至少保留一个底部按钮')
      return
    }
    markDecorateChanged(
      buttons.filter((item) => item.id !== id),
      '已删除一个底部按钮',
    )
  }

  async function handleUpload(button: SmartHotelSettingsActionButton) {
    const result = await uploadSmartHotelSettingsButtonIcon(button)
    setFeedback(result.notice)
    setHasDecorateChanges(true)
    setDecorateSavedHint('')
  }

  async function handleSaveDecorate() {
    if (!hasDecorateChanges || isSavingDecorate) return
    setIsSavingDecorate(true)
    try {
      const result = await saveSmartHotelSettingsDecorate(buttons)
      setFeedback(result.message)
      setDecorateSavedHint('左侧预览已同步最新按钮配置')
      setHasDecorateChanges(false)
    } finally {
      setIsSavingDecorate(false)
    }
  }

  function restoreDefaultButtons() {
    setButtons(createDefaultSmartHotelSettingsButtons())
    setEmptyResolved(true)
    setHasDecorateChanges(true)
    setFeedback('已恢复默认按钮')
  }

  function openPreviewAction(button: SmartHotelSettingsActionButton) {
    const action = button.previewAction
    if (action.kind === 'route') {
      setFeedback(`正在打开「${button.name}」承接页`)
      navigate(action.path)
      return
    }

    setPreviewDialog({
      title: action.title,
      description: action.description,
      primaryLabel: action.primaryLabel,
      primaryPath: action.primaryPath,
    })
    setFeedback(`已打开「${button.name}」预览说明`)
  }

  function insertShareToken(token: { label: string; placeholder: string }) {
    if (!currentShareDraft) return
    const nextTitle = currentShareDraft.titleTemplate.includes(token.placeholder)
      ? currentShareDraft.titleTemplate
      : `${currentShareDraft.titleTemplate} ${token.placeholder}`.trim()
    setShareDraft({
      ...currentShareDraft,
      titleTemplate: nextTitle,
    })
    setHasShareChanges(true)
    setFeedback(`已插入变量「${token.label}」`)
  }

  function updateShareImageMode(mode: SmartHotelSettingsShareDraft['imageMode']) {
    if (!currentShareDraft) return
    setShareDraft({
      ...currentShareDraft,
      imageMode: mode,
    })
    setHasShareChanges(true)
    setFeedback('已更新分享卡片图片方案')
  }

  function uploadSharePoster() {
    if (!currentShareDraft) return
    setShareDraft({
      ...currentShareDraft,
      customPosterName: '酒店大堂自定义分享海报.png',
    })
    setHasShareChanges(true)
    setFeedback('已上传自定义分享图片')
  }

  async function handlePublishShare() {
    if (!currentShareDraft || isPublishingShare) return
    setIsPublishingShare(true)
    try {
      const result = await publishSmartHotelSettingsShare(currentShareDraft)
      setFeedback(result.message)
      setHasShareChanges(false)
      setSharePreviewTitle(
        currentShareDraft.titleTemplate.includes('[入住日期]')
          ? currentShareDraft.titleTemplate
          : '您好，欢迎 [入住日期] 入住',
      )
    } finally {
      setIsPublishingShare(false)
    }
  }

  async function downloadQrCode() {
    setFeedback('小程序二维码下载任务已创建')
  }

  async function copyShareLink() {
    if (!currentShareDraft) return
    try {
      await navigator.clipboard.writeText(currentShareDraft.shareLink)
      setFeedback('智住小程序分享链接已复制')
    } catch {
      setFeedback('请手动复制智住小程序分享链接')
    }
  }

  function retryLoad() {
    navigate('/smartHotel/smartSettings', { replace: true })
  }

  return (
    <div className="smart-settings-page">
      <div
        className="smart-settings-diagnostics"
        data-testid="smart-hotel-settings-service-contract"
        data-provider={diagnosticsProvider}
        data-state={diagnosticsState}
        data-request={diagnosticsRequest}
      />

      <section className="smart-settings-surface" aria-label="智住小程序设置">
        <header className="smart-settings-header">
          <div>
            <h1>智住小程序</h1>
            <p>{dashboard?.previewSummary ?? '住客可通过智住小程序完成入住登记、查看指引、续住和发票申请。'}</p>
          </div>
          <div className="smart-settings-header__meta">
            <span>{dashboard?.updatedAtLabel ?? '等待同步数据'}</span>
            <strong>版本号：{dashboard?.version ?? 'v4.10.7'}</strong>
          </div>
        </header>

        <div className="smart-settings-tabs" role="tablist" aria-label="智住小程序页签">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'decorate'}
            className={activeTab === 'decorate' ? 'is-active' : ''}
            onClick={() => setActiveTab('decorate')}
          >
            装修
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'share'}
            className={activeTab === 'share' ? 'is-active' : ''}
            onClick={() => setActiveTab('share')}
          >
            分享
          </button>
        </div>

        <div className="smart-settings-feedback" role="status" aria-label="智住小程序操作反馈">
          {isLoading ? '智住小程序数据加载中' : feedback}
        </div>

        {isLoading ? <div className="smart-settings-loading">正在同步智住小程序数据...</div> : null}

        {errorMessage ? (
          <section className="smart-settings-error" role="alert" aria-label="智住小程序加载失败">
            <strong>智住小程序加载失败</strong>
            <p>{errorMessage}</p>
            <button type="button" onClick={retryLoad}>
              重新加载
            </button>
          </section>
        ) : null}

        {!isLoading && !errorMessage && activeTab === 'decorate' ? (
          <section className="smart-settings-card">
            <header className="smart-settings-card__head">
              <div>
                <h2>操作按钮设置</h2>
                <p>可根据业务场景可以根据业务场景调整内容，支持新增底部操作按钮，可自定义标题名称、自定义设置触发后显示的内容。</p>
              </div>
              <button type="button" onClick={addButton}>
                添加按钮
              </button>
            </header>

            {isEmptyState && dashboard?.emptyState ? (
              <section className="smart-settings-empty" aria-label="智住小程序空状态">
                <strong>{dashboard.emptyState.title}</strong>
                <p>{dashboard.emptyState.description}</p>
                <button type="button" onClick={restoreDefaultButtons}>
                  {dashboard.emptyState.actionLabel}
                </button>
              </section>
            ) : (
              <div className="smart-settings-grid">
                <section className="smart-settings-preview" aria-label="智住小程序预览">
                  <div className="smart-settings-phone">
                    <div className="smart-settings-phone__top">
                      <strong>住客服务</strong>
                      <span>体验版</span>
                    </div>
                    <div className="smart-settings-phone__body">
                      <h3>欢迎使用智住小程序</h3>
                      <p>住客扫码后可快速完成登记、查看指引和续住申请。</p>
                      <div className="smart-settings-preview__buttons">
                        {previewButtons.map((button) => (
                          <button key={button.id} type="button" onClick={() => openPreviewAction(button)}>
                            <span>{button.iconSeed}</span>
                            <strong>{button.name}</strong>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="smart-settings-phone__footer">
                      <button type="button" onClick={() => navigate(dashboard?.routes.selfCheckin ?? '/smartHotel/smartHome')}>
                        自助入住
                      </button>
                      <button type="button" onClick={() => navigate(dashboard?.routes.hardwareMall ?? '/smartHotel/smartHardware/mall')}>
                        智能硬件商城
                      </button>
                    </div>
                  </div>
                </section>

                <div className="smart-settings-form">
                  {buttons.map((button) => (
                    <article key={button.id} className="smart-settings-row">
                      <button type="button" className="smart-settings-row__drag" aria-label="拖动排序">
                        ⋮⋮
                      </button>
                      <div className="smart-settings-row__upload">
                        <span>按钮图标</span>
                        <strong>{button.name}</strong>
                        <button type="button" onClick={() => void handleUpload(button)}>
                          上传图片
                        </button>
                      </div>
                      <label className="smart-settings-field">
                        <span>按钮名称</span>
                        <input
                          aria-label="按钮名称"
                          maxLength={5}
                          value={button.name}
                          placeholder="请输入按钮名称"
                          onChange={(event) => updateButton(button.id, 'name', event.target.value)}
                        />
                      </label>
                      <label className="smart-settings-field">
                        <span>弹框文案</span>
                        <input
                          aria-label="弹框文案"
                          maxLength={256}
                          value={button.content}
                          placeholder="请输入弹框文案"
                          onChange={(event) => updateButton(button.id, 'content', event.target.value)}
                        />
                      </label>
                      <button type="button" className="smart-settings-row__delete" aria-label="删除按钮" onClick={() => removeButton(button.id)}>
                        ×
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <footer className="smart-settings-footer">
              <div>
                {decorateSavedHint ? <p>{decorateSavedHint}</p> : <span>保存后将同步到左侧住客预览和分享卡片。</span>}
              </div>
              <button type="button" className="is-primary" onClick={() => void handleSaveDecorate()} disabled={!hasDecorateChanges || isSavingDecorate}>
                保 存
              </button>
            </footer>
          </section>
        ) : null}

        {!isLoading && !errorMessage && activeTab === 'share' ? (
          <section className="smart-settings-card smart-settings-share">
            <header className="smart-settings-card__head">
              <div>
                <h2>分享设置</h2>
                <p>配置智住小程序卡片标题、分享海报和住客访问入口。</p>
              </div>
            </header>

            <div className="smart-settings-share__layout">
              <section className="smart-settings-share__form">
                <div className="smart-settings-share__group">
                  <span>小程序卡片标题：</span>
                  <div className="smart-settings-share__tokens">
                    {currentShareDraft?.tokens.map((token) => (
                      <button key={token.id} type="button" onClick={() => insertShareToken(token)}>
                        {token.label}
                      </button>
                    ))}
                  </div>
                  <textarea
                    aria-label="小程序卡片标题"
                    value={currentShareDraft?.titleTemplate ?? ''}
                    onChange={(event) => {
                      if (!currentShareDraft) return
                      setShareDraft({
                        ...currentShareDraft,
                        titleTemplate: event.target.value,
                      })
                      setHasShareChanges(true)
                    }}
                  />
                </div>

                <div className="smart-settings-share__group">
                  <span>小程序卡片图片：</span>
                  <label className="smart-settings-radio">
                    <input
                      type="radio"
                      name="share-image-mode"
                      checked={currentShareDraft?.imageMode === 'default'}
                      onChange={() => updateShareImageMode('default')}
                    />
                    <span>默认固定海报</span>
                  </label>
                  <label className="smart-settings-radio">
                    <input
                      type="radio"
                      name="share-image-mode"
                      checked={currentShareDraft?.imageMode === 'room-cover'}
                      onChange={() => updateShareImageMode('room-cover')}
                    />
                    <span>房源首图</span>
                  </label>
                  <label className="smart-settings-radio">
                    <input
                      type="radio"
                      name="share-image-mode"
                      checked={currentShareDraft?.imageMode === 'custom'}
                      onChange={() => updateShareImageMode('custom')}
                    />
                    <span>自定义</span>
                  </label>
                  <button type="button" onClick={uploadSharePoster}>
                    上传图片
                  </button>
                  <small>{currentShareDraft?.customPosterName}</small>
                </div>

                <div className="smart-settings-share__actions">
                  <button type="button" onClick={() => void downloadQrCode()}>
                    下载二维码
                  </button>
                  <button type="button" onClick={() => void copyShareLink()}>
                    复制链接
                  </button>
                  <button type="button" className="is-primary" onClick={() => void handlePublishShare()} disabled={isPublishingShare || !hasShareChanges}>
                    保存并发布
                  </button>
                </div>
              </section>

              <aside className="smart-settings-share__preview">
                <div className="smart-settings-share-card">
                  <strong>{sharePreviewTitle}</strong>
                  <p>{dashboard?.previewSummary ?? '住客可在小程序中查看入住信息、续住和发票申请。'}</p>
                  <div className="smart-settings-share-card__meta">
                    <span>分享链接</span>
                    <code>{currentShareDraft?.shareLink}</code>
                  </div>
                </div>
                <div className="smart-settings-share-qr">
                  <div className="smart-settings-share-qr__code" />
                  <p>{currentShareDraft?.qrCodeHint}</p>
                </div>
              </aside>
            </div>
          </section>
        ) : null}
      </section>

      {previewDialog ? (
        <DialogFrame
          title={previewDialog.title}
          closeLabel={`关闭${previewDialog.title}`}
          onClose={() => setPreviewDialog(null)}
          footer={
            previewDialog.primaryLabel && previewDialog.primaryPath ? (
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  if (!previewDialog.primaryPath) return
                  const nextPath = previewDialog.primaryPath
                  setPreviewDialog(null)
                  navigate(nextPath)
                }}
              >
                {previewDialog.primaryLabel}
              </button>
            ) : null
          }
        >
          <p>{previewDialog.description}</p>
        </DialogFrame>
      ) : null}
    </div>
  )
}

function DialogFrame({
  title,
  closeLabel,
  children,
  footer,
  onClose,
}: {
  title: string
  closeLabel: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}) {
  return (
    <div className="smart-settings-modal-backdrop">
      <section className="smart-settings-modal" role="dialog" aria-modal="true" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="smart-settings-modal__body">{children}</div>
        {footer ? <footer>{footer}</footer> : null}
      </section>
    </div>
  )
}
