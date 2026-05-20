import { useEffect, useMemo, useRef, useState } from 'react'
import './PicturesVideosPage.css'
import {
  defaultPicturesVideosRequest,
  fetchPicturesVideosView,
  resolvePicturesVideosMockState,
  resolvePicturesVideosProvider,
  type PicturesVideosRequest,
  type PicturesVideosTabKey,
  type PicturesVideosViewModel,
} from '../services/picturesVideos'

type LoadState = 'loading' | 'success' | 'empty' | 'error'

export function PicturesVideosPage() {
  const [activeTab, setActiveTab] = useState<PicturesVideosTabKey>('picture')
  const [keyword, setKeyword] = useState('')
  const [viewModel, setViewModel] = useState<PicturesVideosViewModel | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [feedback, setFeedback] = useState('图片视频数据加载中')
  const [errorMessage, setErrorMessage] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [draftFolders, setDraftFolders] = useState<string[]>([])
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void loadPicturesVideos(defaultPicturesVideosRequest(), '图片视频数据已更新', controller.signal)

    return () => controller.abort()
  }, [])

  const provider = viewModel?.provider ?? resolvePicturesVideosProvider()
  const responseState = loadState === 'error' ? 'error' : loadState === 'empty' ? 'empty' : viewModel?.state ?? 'success'
  const requestName = viewModel?.request.name ?? keyword.trim()
  const contractText = useMemo(() => {
    if (!viewModel) return ''
    return JSON.stringify(viewModel.contract)
  }, [viewModel])

  async function loadPicturesVideos(request: PicturesVideosRequest, successMessage: string, signal?: AbortSignal) {
    setLoadState('loading')
    setErrorMessage('')

    try {
      const nextViewModel = await fetchPicturesVideosView(
        {
          ...request,
          state: request.state ?? resolvePicturesVideosMockState(),
        },
        signal,
      )

      setViewModel(nextViewModel)
      setKeyword(nextViewModel.request.name)
      setLoadState(nextViewModel.state === 'empty' ? 'empty' : 'success')
      setFeedback(successMessage)
    } catch (error) {
      if (isAbortError(error)) return

      setErrorMessage(error instanceof Error ? error.message : '图片视频数据加载失败，请稍后重试')
      setLoadState('error')
      setFeedback('图片视频数据加载失败')
    }
  }

  function getCurrentRequest() {
    const nextKeyword = searchInputRef.current?.value.trim() ?? keyword.trim()
    const baseRequest = viewModel ? { ...viewModel.request } : defaultPicturesVideosRequest()
    return {
      ...baseRequest,
      name: nextKeyword,
      state: resolvePicturesVideosMockState(),
    }
  }

  function handleSearch() {
    const nextKeyword = searchInputRef.current?.value.trim() ?? keyword.trim()
    const successMessage = nextKeyword ? `已按关键字“${nextKeyword}”筛选图片管理` : '已按当前条件刷新图片视频数据'
    void loadPicturesVideos(getCurrentRequest(), successMessage)
  }

  function handleRefresh() {
    void loadPicturesVideos(getCurrentRequest(), '已重新加载图片视频数据')
  }

  function handleRetry() {
    void loadPicturesVideos(getCurrentRequest(), '已重新加载图片视频数据')
  }

  function handleBack() {
    setFeedback('当前目录已是根目录')
  }

  function handleCreateFolder() {
    setDraftFolders((current) => (current.length > 0 ? current : ['新建文件夹']))
    setFeedback('已创建待命名文件夹')
  }

  return (
    <div
      className="pictures-videos-page"
      data-provider={provider}
      data-response-state={responseState}
      data-request-name={requestName}
      data-active-tab={activeTab}
    >
      <h1 className="sr-only-heading">图片视频</h1>
      <pre className="pictures-videos-contract" data-testid="pictures-videos-contract">
        {contractText}
      </pre>

      <section className="pictures-videos-panel" aria-label="图片视频管理">
        <header className="pictures-videos-topline">
          <div className="pictures-videos-tabs" role="tablist" aria-label="图片视频类型">
            {(viewModel?.tabs ?? defaultTabs).map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>

        <div className="pictures-videos-toolbar" aria-label="图片视频工具栏">
          {activeTab === 'picture' ? (
            <label className="pictures-videos-search">
              <input
                ref={searchInputRef}
                aria-label="搜索图片或文件夹名称"
                type="search"
                value={keyword}
                placeholder="输入图片或文件夹名称"
                onChange={(event) => setKeyword(event.target.value)}
              />
              <button type="button" onClick={handleSearch}>
                搜索
              </button>
            </label>
          ) : null}

          <div className="pictures-videos-actions">
            <button type="button" className="pictures-videos-upload" onClick={() => setUploadDialogOpen(true)}>
              上传
            </button>
            <button type="button" onClick={handleCreateFolder}>
              新建文件夹
            </button>
            <button type="button" onClick={handleBack}>
              返回上一级
            </button>
            <button type="button" onClick={handleRefresh}>
              刷新
            </button>
          </div>
        </div>

        <div className="pictures-videos-feedback is-success" role="status" aria-label="图片视频操作反馈">
          {feedback}
        </div>

        <div className="pictures-videos-path-row">
          <strong>{viewModel?.breadcrumbLabel ?? '全部附件'}</strong>
        </div>

        {activeTab === 'attachment' ? (
          <section className="pictures-videos-attachment-panel" aria-label="附件管理承接区">
            <header>
              <h2>附件管理</h2>
              <p className="pictures-videos-attachment-tip">附件管理暂不支持搜索文件夹，保留列表与上传承接。</p>
            </header>
            <div className="pictures-videos-attachment-empty">当前承接目标：{viewModel?.uploadTargetLabel ?? '全部附件'}</div>
          </section>
        ) : loadState === 'loading' ? (
          <section className="pictures-videos-loading" role="status" aria-label="图片视频加载中">
            <h2>图片视频数据加载中</h2>
            <p>请稍候，正在同步当前目录内容。</p>
          </section>
        ) : loadState === 'error' ? (
          <section className="pictures-videos-state-card is-error" role="alert" aria-label="图片视频数据错误">
            <h2>图片视频数据错误</h2>
            <p>{errorMessage}</p>
            <button type="button" onClick={handleRetry}>
              重试
            </button>
          </section>
        ) : loadState === 'empty' ? (
          <>
            <section className="pictures-videos-state-card" role="status" aria-label="图片视频空态">
              <h2>当前目录下暂无图片或视频素材</h2>
              <p>可以调整关键字后重新查询，或上传新的图片和视频素材。</p>
              <button
                type="button"
                onClick={() => {
                  setKeyword('')
                  void loadPicturesVideos(
                    {
                      ...(viewModel?.request ?? defaultPicturesVideosRequest()),
                      name: '',
                      state: resolvePicturesVideosMockState(),
                    },
                    '已重置搜索条件',
                  )
                }}
              >
                重置搜索条件
              </button>
            </section>

            {draftFolders.length > 0 ? (
              <div className="pictures-videos-grid is-grid" aria-label="图片视频列表">
                {draftFolders.map((folderName, index) => (
                  <article key={`empty-draft-${index}`} className="pictures-videos-folder-card">
                    <div className="pictures-videos-folder-visual" aria-hidden="true" />
                    <input aria-label="文件夹名称" value={folderName} readOnly />
                    <small>待保存</small>
                  </article>
                ))}
              </div>
            ) : null}

            <footer className="pictures-videos-footer">
              <div className="pictures-videos-pagination">
                <span>共 {viewModel?.pagination.total ?? 0} 条</span>
              </div>
            </footer>
          </>
        ) : (
          <>
            <div className="pictures-videos-grid is-grid" aria-label="图片视频列表">
              {viewModel?.items.map((item) => (
                <article key={item.id} className="pictures-videos-folder-card">
                  <div className="pictures-videos-folder-visual" aria-hidden="true" />
                  <strong>{item.name}</strong>
                  <small>{item.isDir ? '文件夹' : '文件'}</small>
                </article>
              ))}

              {draftFolders.map((folderName, index) => (
                <article key={`draft-${index}`} className="pictures-videos-folder-card">
                  <div className="pictures-videos-folder-visual" aria-hidden="true" />
                  <input aria-label="文件夹名称" value={folderName} readOnly />
                  <small>待保存</small>
                </article>
              ))}
            </div>

            <footer className="pictures-videos-footer">
              <div className="pictures-videos-pagination">
                <span>共 {viewModel?.pagination.total ?? 0} 条</span>
              </div>
            </footer>
          </>
        )}
      </section>

      {uploadDialogOpen ? (
        <div className="pictures-videos-modal-backdrop" role="presentation">
          <div className="pictures-videos-modal-frame">
            <section className="pictures-videos-modal" role="dialog" aria-modal="true" aria-label="上传附件">
              <h2>上传附件</h2>
              <div className="pictures-videos-upload-body">
                <p>
                  <strong>上传到：</strong>
                  <span>{viewModel?.uploadTargetLabel ?? '全部附件'}</span>
                </p>

                <div className="pictures-videos-upload-guide">
                  <strong>上传指引：</strong>
                  <ol>
                    {(viewModel?.uploadGuide ?? defaultUploadGuide).map((guide) => (
                      <li key={guide}>{guide}</li>
                    ))}
                  </ol>
                </div>

                <div className="pictures-videos-upload-buttons">
                  <button type="button">上传附件</button>
                  <button type="button">上传文件夹</button>
                </div>
              </div>
            </section>

            <button
              type="button"
              className="pictures-videos-modal-close"
              aria-label="关闭上传附件弹窗"
              onClick={() => setUploadDialogOpen(false)}
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const defaultTabs: Array<{ key: PicturesVideosTabKey; label: string }> = [
  { key: 'picture', label: '图片管理' },
  { key: 'attachment', label: '附件管理' },
]

const defaultUploadGuide = [
  '为了保证附件的正常使用，单个附件最大支持 20M',
  'jpg、jpeg、png格式附件上传',
  '支持选择多张图片上传，支持拖拽文件夹上传',
]

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}
