import { useEffect, useState } from 'react'
import './PicturesVideosPage.css'

type MediaTab = '图片管理' | '附件管理'

const tabs: MediaTab[] = ['图片管理', '附件管理']

export function PicturesVideosPage() {
  const [activeTab, setActiveTab] = useState<MediaTab>('图片管理')
  const [keyword, setKeyword] = useState('')
  const [searchedKeyword, setSearchedKeyword] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [folderCreated, setFolderCreated] = useState(false)
  const [folderName, setFolderName] = useState('新建文件夹')

  useEffect(() => {
    if (!uploadOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setUploadOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [uploadOpen])

  function handleSearch() {
    setSearchedKeyword(keyword.trim())
  }

  function handleNewFolder() {
    setFolderCreated(true)
    setFolderName('新建文件夹')
  }

  return (
    <div className="pictures-videos-page">
      <h1 className="sr-only-heading">图片视频</h1>

      <section className="pictures-videos-panel" aria-label="图片视频管理">
        <div className="pictures-videos-topline">
          <div className="pictures-videos-tabs" role="tablist" aria-label="图片视频类型">
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

          <div className="pictures-videos-quick-actions" aria-label="快捷操作">
            <button type="button" aria-label="刷新" title="刷新">
              <span className="pictures-videos-refresh-icon" aria-hidden="true" />
            </button>
            <button type="button" aria-label="排序" title="排序">
              <span className="pictures-videos-sort-icon" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="pictures-videos-toolbar">
          <label className="pictures-videos-search">
            <input
              type="text"
              value={keyword}
              placeholder="输入图片或文件夹名称"
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button type="button" aria-label="搜索" onClick={handleSearch}>
              搜索
            </button>
          </label>

          <div className="pictures-videos-actions">
            <button type="button" className="pictures-videos-upload" onClick={() => setUploadOpen(true)}>
              上 传
            </button>
            <button type="button" className="pictures-videos-new-folder" onClick={handleNewFolder}>
              新建文件夹
            </button>
          </div>
        </div>

        <div className="pictures-videos-select-row">
          <label>
            <input type="checkbox" aria-label="全选" />
            <span>全选</span>
          </label>
        </div>

        <div className="pictures-videos-path-row">
          <button type="button">返回上一级</button>
          <span aria-hidden="true">|</span>
          <strong>全部附件</strong>
        </div>

        {searchedKeyword ? <div className="pictures-videos-search-result">搜索：{searchedKeyword}</div> : null}

        <div className="pictures-videos-grid" aria-label={`${activeTab}列表`}>
          {folderCreated ? (
            <article className="pictures-videos-folder-card">
              <div className="pictures-videos-folder-visual" aria-hidden="true" />
              <input
                aria-label="文件夹名称"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                autoFocus
              />
            </article>
          ) : null}
        </div>

        <footer className="pictures-videos-footer">
          <span>共 0 条</span>
          <nav className="pictures-videos-pagination" aria-label="分页">
            <button type="button" aria-current="page">
              1
            </button>
            <button type="button">50 条/页</button>
          </nav>
        </footer>
      </section>

      {uploadOpen ? <UploadDialog onClose={() => setUploadOpen(false)} /> : null}
    </div>
  )
}

function UploadDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="pictures-videos-modal-backdrop" onMouseDown={onClose}>
      <section
        className="pictures-videos-modal"
        role="dialog"
        aria-modal="true"
        aria-label="上传附件"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="pictures-videos-modal-close" aria-label="关闭" onClick={onClose}>
          ×
        </button>
        <h2>上传附件</h2>
        <div className="pictures-videos-upload-body">
          <p>
            <span>上传到：</span>
            <strong>全部附件</strong>
          </p>
          <div className="pictures-videos-upload-guide">
            <strong>上传指引：</strong>
            <ol>
              <li>为了保证附件的正常使用，单个附件最大支持10M；</li>
              <li>jpg、jpeg、png格式附件上传；</li>
              <li>支持选择多张图片上传，支持拖拽文件夹上传；</li>
            </ol>
          </div>
          <div className="pictures-videos-upload-buttons">
            <button type="button">上传附件</button>
            <button type="button">上传文件夹</button>
          </div>
        </div>
      </section>
    </div>
  )
}
