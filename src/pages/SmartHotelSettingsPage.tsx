import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  const [toastMessage, setToastMessage] = useState('')
  const [decorateSavedHint, setDecorateSavedHint] = useState('')
  const [hasDecorateChanges, setHasDecorateChanges] = useState(false)
  const [hasShareChanges, setHasShareChanges] = useState(false)
  const [sharePreviewTitle, setSharePreviewTitle] = useState('您好，欢迎于[入住日期]入住')
  const [emptyResolved, setEmptyResolved] = useState(false)
  const [previewDialog, setPreviewDialog] = useState<PreviewDialogState>(null)

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(''), 1600)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  useEffect(() => {
    const controller = new AbortController()
    const query = createDefaultSmartHotelSettingsQuery(new URLSearchParams(location.search))

    const loadDashboard = async () => {
      setIsLoading(true)
      setErrorMessage('')
      setToastMessage('')
      setDecorateSavedHint('')
      setHasDecorateChanges(false)
      setHasShareChanges(false)
      setSharePreviewTitle('您好，欢迎于[入住日期]入住')
      setEmptyResolved(false)

      try {
        const result = await fetchSmartHotelSettingsDashboard(query, controller.signal)
        setDashboard(result)
        setButtons(result.buttons)
        setShareDraft(result.shareDraft)
        setSharePreviewTitle(result.shareDraft.titleTemplate)
      } catch (error: unknown) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setDashboard(null)
        setButtons([])
        setShareDraft(null)
        setErrorMessage(error instanceof Error ? error.message : '智住小程序数据加载失败，请稍后重试')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => controller.abort()
  }, [location.search])

  const diagnosticsState =
    dashboard?.state ?? createDefaultSmartHotelSettingsQuery(new URLSearchParams(location.search)).mockState
  const diagnosticsProvider = dashboard?.provider ?? 'mock'
  const diagnosticsRequest = dashboard?.request
    ? JSON.stringify(dashboard.request)
    : JSON.stringify({
        endpoint: '/smartHotelSettings/dashboard/get',
        mockState: diagnosticsState,
      })
  const isEmptyState = Boolean(dashboard?.emptyState) && !emptyResolved && !errorMessage
  const previewButtons = buttons.length > 0 ? buttons : createDefaultSmartHotelSettingsButtons()
  const currentShareDraft = shareDraft ?? dashboard?.shareDraft ?? null
  const sharePreviewImageLabel = useMemo(() => {
    if (!currentShareDraft) return '默认固定海报'
    switch (currentShareDraft.imageMode) {
      case 'room-cover':
        return '房源首图'
      case 'custom':
        return currentShareDraft.customPosterName || '自定义图片'
      default:
        return '默认固定海报'
    }
  }, [currentShareDraft])

  function showToast(message: string) {
    setToastMessage(message)
  }

  function markDecorateChanged(nextButtons: SmartHotelSettingsActionButton[], toast?: string) {
    setButtons(nextButtons)
    setHasDecorateChanges(true)
    setDecorateSavedHint('')
    if (toast) showToast(toast)
  }

  function updateButton(id: string, field: 'name' | 'content', value: string) {
    markDecorateChanged(
      buttons.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
      field === 'name' ? '已更新按钮名称' : '已更新弹框文案',
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
      showToast('至少保留一个底部按钮')
      return
    }

    markDecorateChanged(
      buttons.filter((item) => item.id !== id),
      '已删除一个底部按钮',
    )
  }

  async function handleUpload(button: SmartHotelSettingsActionButton) {
    const result = await uploadSmartHotelSettingsButtonIcon(button)
    showToast(result.notice)
    setHasDecorateChanges(true)
    setDecorateSavedHint('')
  }

  async function handleSaveDecorate() {
    if (!hasDecorateChanges || isSavingDecorate) return
    setIsSavingDecorate(true)
    try {
      const result = await saveSmartHotelSettingsDecorate(buttons)
      showToast(result.message)
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
    showToast('已恢复默认按钮')
  }

  function openPreviewAction(button: SmartHotelSettingsActionButton) {
    const action = button.previewAction
    if (action.kind === 'route') {
      navigate(action.path)
      return
    }

    setPreviewDialog({
      title: action.title,
      description: action.description,
      primaryLabel: action.primaryLabel,
      primaryPath: action.primaryPath,
    })
  }

  function insertShareToken(token: { label: string; placeholder: string }) {
    if (!currentShareDraft) return
    const nextTitle = currentShareDraft.titleTemplate.includes(token.placeholder)
      ? currentShareDraft.titleTemplate
      : `${currentShareDraft.titleTemplate}${token.placeholder}`

    setShareDraft({
      ...currentShareDraft,
      titleTemplate: nextTitle,
    })
    setHasShareChanges(true)
    showToast(`已插入变量“${token.label}”`)
  }

  function updateShareTitle(value: string) {
    if (!currentShareDraft) return
    setShareDraft({
      ...currentShareDraft,
      titleTemplate: value,
    })
    setHasShareChanges(true)
  }

  function updateShareImageMode(mode: SmartHotelSettingsShareDraft['imageMode']) {
    if (!currentShareDraft) return
    setShareDraft({
      ...currentShareDraft,
      imageMode: mode,
    })
    setHasShareChanges(true)
    showToast('已更新小程序卡片图片方案')
  }

  function uploadSharePoster() {
    if (!currentShareDraft) return
    setShareDraft({
      ...currentShareDraft,
      imageMode: 'custom',
      customPosterName: '酒店大堂自定义分享海报.png',
    })
    setHasShareChanges(true)
    showToast('已上传自定义分享图片')
  }

  async function handlePublishShare() {
    if (!currentShareDraft || isPublishingShare) return
    setIsPublishingShare(true)
    try {
      const result = await publishSmartHotelSettingsShare(currentShareDraft)
      showToast(result.message)
      setHasShareChanges(false)
      setSharePreviewTitle(currentShareDraft.titleTemplate || '您好，欢迎于[入住日期]入住')
    } finally {
      setIsPublishingShare(false)
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

      {toastMessage ? (
        <div className="smart-settings-toast" role="status" aria-label="智住小程序操作反馈">
          {toastMessage}
        </div>
      ) : null}

      <section className="smart-settings-surface" aria-label="智住小程序设置">
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
                <p>支持新增底部操作按钮，可自定义按钮名称和触发后的说明内容。</p>
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
                      <button
                        type="button"
                        onClick={() => navigate(dashboard?.routes.selfCheckin ?? '/smartHotel/smartHome')}
                      >
                        自助入住
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(dashboard?.routes.hardwareMall ?? '/smartHotel/smartHardware/mall')}
                      >
                        智能硬件商城
                      </button>
                    </div>
                  </div>
                </section>

                <div className="smart-settings-form">
                  {buttons.map((button) => (
                    <article key={button.id} className="smart-settings-row">
                      <button type="button" className="smart-settings-row__drag" aria-label="拖动排序">
                        ≡
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
                      <button
                        type="button"
                        className="smart-settings-row__delete"
                        aria-label="删除按钮"
                        onClick={() => removeButton(button.id)}
                      >
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
              <button
                type="button"
                className="is-primary"
                onClick={() => void handleSaveDecorate()}
                disabled={!hasDecorateChanges || isSavingDecorate}
              >
                保存
              </button>
            </footer>
          </section>
        ) : null}

        {!isLoading && !errorMessage && activeTab === 'share' ? (
          <section className="smart-settings-share-board">
            <div className="smart-settings-share-shell">
              <section className="smart-settings-share-config">
                <div className="smart-settings-share-row">
                  <label htmlFor="share-title-input">小程序卡片标题</label>
                  <div className="smart-settings-share-input-wrap">
                    <input
                      id="share-title-input"
                      aria-label="小程序卡片标题"
                      value={currentShareDraft?.titleTemplate ?? ''}
                      onChange={(event) => updateShareTitle(event.target.value)}
                    />
                    <div className="smart-settings-share-tokens" aria-label="分享变量按钮">
                      {currentShareDraft?.tokens.map((token) => (
                        <button key={token.id} type="button" onClick={() => insertShareToken(token)}>
                          {token.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="smart-settings-share-row smart-settings-share-row--media">
                  <label>小程序卡片图片</label>
                  <div className="smart-settings-share-radio-stack">
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

                    {currentShareDraft?.imageMode === 'custom' ? (
                      <button type="button" className="smart-settings-share-upload" onClick={uploadSharePoster}>
                        上传图片
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              <aside className="smart-settings-share-preview">
                <div className="smart-settings-share-phone">
                  <div className="smart-settings-share-phone__frame">
                    <div className="smart-settings-share-phone__header">
                      <span />
                    </div>
                    <div className="smart-settings-share-phone__card">
                      <p>{sharePreviewTitle}</p>
                      <div className="smart-settings-share-phone__poster">
                        <div className="smart-settings-share-phone__tag">{sharePreviewImageLabel}</div>
                        <div className="smart-settings-share-phone__poster-art">
                          <span className="is-panel" />
                          <span className="is-desk" />
                          <span className="is-guest" />
                          <span className="is-key" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

            <footer className="smart-settings-share-footer">
              <button
                type="button"
                className="is-primary"
                onClick={() => void handlePublishShare()}
                disabled={isPublishingShare || !hasShareChanges}
              >
                保存并发布
              </button>
            </footer>
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
