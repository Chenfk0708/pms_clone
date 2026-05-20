import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchImSettingView,
  resolveImSettingProvider,
  saveImShortcutSettings,
  updateImSettingDiagnostics,
  type ImPhraseItem,
  type ImSettingTabKey,
  type ImSettingViewModel,
  type ImShortcutItem,
} from '../services/imSetting'
import './ImSettingPage.css'

const defaultCampId = '1796067693589061634'
const defaultUserId = '1796067693261905922'

const tabs: Array<{ key: ImSettingTabKey; label: string }> = [
  { key: 'phrases', label: '常用语' },
  { key: 'autoReply', label: '自动回复设置' },
  { key: 'page', label: '页面设置' },
  { key: 'tags', label: '标签设置' },
  { key: 'shortcuts', label: '快捷键设置' },
  { key: 'version', label: '版本设置' },
]

type Feedback = {
  tone: 'success' | 'info'
  text: string
}

export function ImSettingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const campId = searchParams.get('campId') || defaultCampId
  const userId = searchParams.get('userId') || defaultUserId

  const [activeTab, setActiveTab] = useState<ImSettingTabKey>('phrases')
  const [view, setView] = useState<ImSettingViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [keyword, setKeyword] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [selectedPhrase, setSelectedPhrase] = useState<ImPhraseItem | null>(null)
  const [isPhraseEditorOpen, setIsPhraseEditorOpen] = useState(false)
  const [newPhraseTitle, setNewPhraseTitle] = useState('')
  const [newPhraseContent, setNewPhraseContent] = useState('')
  const [shortcutDraft, setShortcutDraft] = useState<ImShortcutItem[]>([])
  const [phraseActionsVisible, setPhraseActionsVisible] = useState(false)

  const provider = resolveImSettingProvider()

  useEffect(() => {
    updateImSettingDiagnostics({ currentTab: activeTab })
  }, [activeTab])

  useEffect(() => {
    if (!view || error) return

    const timer = window.setTimeout(() => {
      setPhraseActionsVisible(true)
    }, 1200)

    return () => window.clearTimeout(timer)
  }, [error, view])

  const loadView = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true)
    setError('')
    setPhraseActionsVisible(false)

    try {
      const nextView = await fetchImSettingView(
        {
          provider,
          campId,
          userId,
          keyword,
          groupId: selectedGroupId,
        },
        signal,
      )
      if (signal?.aborted) return
      setView(nextView)
      setShortcutDraft(nextView.shortcuts)
    } catch (nextError) {
      if (signal?.aborted) return
      setError(nextError instanceof Error ? nextError.message : '会话设置数据加载失败，请重试')
      setFeedback(null)
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false)
      }
    }
  }, [campId, keyword, provider, selectedGroupId, userId])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void loadView(controller.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadView])

  async function handleQuery() {
    await loadView()
  }

  async function handleReset() {
    setKeyword('')
    setSelectedGroupId(null)
    setFeedback({ tone: 'success', text: '常用语筛选条件已重置' })
    setIsLoading(true)
    setError('')
    try {
      const nextView = await fetchImSettingView({
        provider,
        campId,
        userId,
        keyword: '',
        groupId: null,
      })
      setView(nextView)
      setShortcutDraft(nextView.shortcuts)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : '会话设置数据加载失败，请重试')
      setFeedback(null)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRefresh() {
    await loadView()
  }

  function handleOpenPhraseEditor() {
    setNewPhraseTitle('')
    setNewPhraseContent('')
    setIsPhraseEditorOpen(true)
  }

  function handleSavePhrase() {
    if (!newPhraseTitle.trim() || !newPhraseContent.trim()) return
    const group = view?.phraseGroups.find((item) => item.id === selectedGroupId) ?? view?.phraseGroups[0]
    const nextPhrase: ImPhraseItem = {
      id: `phrase-${Date.now()}`,
      title: newPhraseTitle.trim(),
      content: newPhraseContent.trim(),
      groupId: group?.id ?? 'group-checkin',
      groupName: group?.name ?? '入住前沟通',
      updatedAt: '2026-05-19 19:30:00',
    }

    setView((current) =>
      current
        ? {
            ...current,
            phrases: [nextPhrase, ...current.phrases],
            state: 'success',
          }
        : current,
    )
    setIsPhraseEditorOpen(false)
    setFeedback({ tone: 'success', text: '常用语已保存' })
    updateImSettingDiagnostics({
      lastAction: {
        endpoint: '/imWords/save',
        request: {
          campId,
          title: nextPhrase.title,
          content: nextPhrase.content,
          imWordsGroupId: nextPhrase.groupId,
        },
      },
    })
  }

  function handleToggleShortcut(code: number) {
    setShortcutDraft((current) =>
      current.map((item) => (item.code === code ? { ...item, isOpen: !item.isOpen } : item)),
    )
  }

  async function handleSaveShortcuts() {
    await saveImShortcutSettings({ userId }, shortcutDraft)
    setView((current) => (current ? { ...current, shortcuts: shortcutDraft } : current))
    setFeedback({ tone: 'success', text: '快捷键设置已保存' })
  }

  return (
    <div className="im-setting-page" data-provider={provider} data-tab={activeTab}>
      <section className="im-setting-upgrade-banner">
        <span>当前为会话基础版本，可升级获取更完整的 IM 会话能力与快捷键协同。</span>
        <a href="/version/applicationPayment/detail?app=im">会话升级版</a>
      </section>

      <header className="im-setting-header">
        <div>
          <p className="im-setting-eyebrow">设置 / 通用设置 / 会话设置</p>
          <h1>会话设置中心</h1>
          <p className="im-setting-description">统一管理常用语、自动回复、标签、快捷键和版本能力，补齐客服会话的配置闭环。</p>
        </div>
        <div className="im-setting-quick-links">
          <button type="button" onClick={() => navigate('/scrm/wechatService/manage')}>
            微信客服运营台
          </button>
          <button type="button" onClick={() => navigate('/scrm/sidebarPreview')}>
            聊天工具栏
          </button>
          <button type="button" onClick={() => navigate('/scrm/wechatService/receptionConfig')}>
            接待配置
          </button>
        </div>
      </header>

      <nav className="im-setting-tabs" aria-label="会话设置标签">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            aria-pressed={activeTab === tab.key}
            className={activeTab === tab.key ? 'is-active' : ''}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {feedback ? (
        <div className={`im-setting-feedback is-${feedback.tone}`} role="status">
          {feedback.text}
        </div>
      ) : null}

      {error ? (
        <section className="im-setting-error" role="alert">
          <strong>{error}</strong>
          <button type="button" onClick={() => void loadView()}>
            重试
          </button>
        </section>
      ) : null}

      {activeTab === 'phrases' ? (
        <section className="im-setting-panel im-phrase-panel" role="region" aria-label="常用语管理">
          <aside className="im-phrase-sidebar">
            <div className="im-panel-head">
              <h2>分类</h2>
              <button type="button">新建分类</button>
            </div>

            <div className="im-group-list">
              <button
                type="button"
                className={!selectedGroupId ? 'is-active' : ''}
                onClick={() => setSelectedGroupId(null)}
              >
                全部分类
              </button>
              {(view?.phraseGroups ?? []).map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={selectedGroupId === group.id ? 'is-active' : ''}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </aside>

          <div className="im-phrase-content">
            <div className="im-panel-head">
              <h2>常用语列表</h2>
              <span>当前分类：{selectedGroupId ? view?.phraseGroups.find((item) => item.id === selectedGroupId)?.name : '全部分类'}</span>
            </div>

            <div className="im-phrase-toolbar">
              <label className="im-search-field">
                <span>常用语关键词</span>
                <input value={keyword} onChange={(event) => setKeyword(event.target.value)} />
              </label>
              <div className="im-toolbar-actions">
                <button type="button" onClick={() => void handleQuery()}>
                  查询
                </button>
                <button type="button" onClick={() => void handleReset()}>
                  重置
                </button>
                <button type="button" onClick={() => void handleRefresh()}>
                  刷新
                </button>
                {phraseActionsVisible ? (
                  <button type="button" className="is-primary" onClick={handleOpenPhraseEditor}>
                    新增常用语
                  </button>
                ) : null}
                {phraseActionsVisible ? <button type="button">导出常用语</button> : null}
              </div>
            </div>

            {isLoading ? <div className="im-setting-loading">正在同步会话设置数据...</div> : null}

            {!isLoading && (view?.phrases.length ?? 0) === 0 ? (
              <div className="im-setting-empty">当前分类下暂无常用语</div>
            ) : (
              <div className="im-phrase-list">
                {(view?.phrases ?? []).map((phrase) => (
                  <article key={phrase.id} className="im-phrase-card">
                    <div>
                      <strong>{phrase.title}</strong>
                      <span>{phrase.groupName}</span>
                    </div>
                    <p>{phrase.content}</p>
                    <footer>
                      <small>{phrase.updatedAt}</small>
                      <button
                        type="button"
                        aria-label={`查看 ${phrase.title}`}
                        onClick={() => setSelectedPhrase(phrase)}
                      >
                        查看
                      </button>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      {activeTab === 'autoReply' ? (
        <section className="im-setting-panel" role="region" aria-label="自动回复设置">
          <div className="im-panel-head">
            <h2>自动回复设置</h2>
            <span>按场景编排欢迎语和兜底回复。</span>
          </div>
          <div className="im-info-grid">
            <article>
              <strong>新客欢迎</strong>
              <p>支付成功后 3 分钟自动发送入住引导和停车提示。</p>
            </article>
            <article>
              <strong>深夜到店</strong>
              <p>22:00 后自动补发门锁密码、前台电话和停车楼层。</p>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'page' ? (
        <section className="im-setting-panel" role="region" aria-label="页面设置">
          <div className="im-panel-head">
            <h2>页面设置</h2>
            <span>对接聊天工作台的图片通道和云信账号。</span>
          </div>
          <div className="im-info-grid">
            <article>
              <strong>支持发图渠道</strong>
              <p>{view?.supportedChannels.join(' / ') || '暂无渠道信息'}</p>
            </article>
            <article>
              <strong>云信账号</strong>
              <p>AppKey：{view?.imAccount.appKey ?? '-'}</p>
              <p>Accid：{view?.imAccount.accid ?? '-'}</p>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'tags' ? (
        <section className="im-setting-panel" role="region" aria-label="标签设置">
          <div className="im-panel-head">
            <h2>标签设置</h2>
            <span>将会话标签与接待策略和常用语分类联动。</span>
          </div>
          <div className="im-info-grid">
            <article>
              <strong>夜间到店</strong>
              <p>自动关联深夜入住模板和门锁指引。</p>
            </article>
            <article>
              <strong>复购会员</strong>
              <p>自动关联升级房型、延迟退房和追评激励话术。</p>
            </article>
          </div>
        </section>
      ) : null}

      {activeTab === 'shortcuts' ? (
        <section className="im-setting-panel" role="region" aria-label="快捷键设置">
          <div className="im-panel-head">
            <h2>快捷键设置</h2>
            <button type="button" className="is-primary" onClick={() => void handleSaveShortcuts()}>
              保存快捷键
            </button>
          </div>

          <div className="im-shortcut-list">
            {shortcutDraft.map((item) => (
              <article key={item.code} className="im-shortcut-card">
                <div>
                  <strong>{item.name}</strong>
                  <p>
                    Windows：{item.win} / Mac：{item.mac}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={item.isOpen ? `停用 ${item.name}` : `启用 ${item.name}`}
                  onClick={() => handleToggleShortcut(item.code)}
                >
                  {item.isOpen ? '停用' : '启用'}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'version' ? (
        <section className="im-setting-panel" role="region" aria-label="版本设置">
          <div className="im-panel-head">
            <h2>版本设置</h2>
            <span>{view?.version.editionName ?? '-'}</span>
          </div>

          <article className="im-version-card">
            <strong>{view?.version.modalTitle ?? '版本升级提示'}</strong>
            <p>{view?.version.modalInfo ?? '当前版本暂无更多说明。'}</p>
            <div className="im-version-meta">
              <span>版本 ID：{view?.version.editionId ?? '-'}</span>
              <span>当前版本：{view?.version.editionName ?? '-'}</span>
            </div>
            <div className="im-version-actions">
              {(view?.version.buttons ?? []).map((button) => (
                <button key={`${button.text}-${button.action}`} type="button" className={button.type === 'primary' ? 'is-primary' : ''}>
                  {button.text}
                </button>
              ))}
            </div>
          </article>
        </section>
      ) : null}

      {selectedPhrase ? (
        <div className="im-setting-dialog-backdrop">
          <section className="im-setting-dialog" role="dialog" aria-label="常用语详情">
            <header>
              <h2>常用语详情</h2>
              <button type="button" aria-label="关闭常用语详情" onClick={() => setSelectedPhrase(null)}>
                ×
              </button>
            </header>
            <div className="im-setting-dialog-content">
              <strong>{selectedPhrase.title}</strong>
              <p>{selectedPhrase.content}</p>
              <small>{selectedPhrase.groupName}</small>
            </div>
          </section>
        </div>
      ) : null}

      {isPhraseEditorOpen ? (
        <div className="im-setting-dialog-backdrop">
          <section className="im-setting-dialog" role="dialog" aria-label="新增常用语">
            <header>
              <h2>新增常用语</h2>
              <button type="button" aria-label="关闭新增常用语" onClick={() => setIsPhraseEditorOpen(false)}>
                ×
              </button>
            </header>
            <div className="im-setting-dialog-form">
              <label>
                <span>常用语标题</span>
                <input value={newPhraseTitle} onChange={(event) => setNewPhraseTitle(event.target.value)} />
              </label>
              <label>
                <span>常用语内容</span>
                <textarea value={newPhraseContent} onChange={(event) => setNewPhraseContent(event.target.value)} rows={5} />
              </label>
            </div>
            <footer className="im-setting-dialog-actions">
              <button type="button" onClick={() => setIsPhraseEditorOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={handleSavePhrase}>
                保存常用语
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
