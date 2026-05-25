import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
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

type PhraseEditorDraft = {
  title: string
  groupId: string
  content: string
}

type AutoReplyPanelKey = 'welcome' | 'timeout' | 'task'

type AutoReplyTaskRow = {
  id: string
  name: string
  scene: string
  timing: string
  content: string
  enabled: boolean
}

type AutoReplyTaskDraft = {
  scene: string
  name: string
  minutes: string
  content: string
}

type PageSettingState = {
  timeoutReplyEnabled: boolean
  timeoutReplyMinutes: string
  severeTimeoutReplyEnabled: boolean
  severeTimeoutReplyMinutes: string
  firstReplyReminderEnabled: boolean
  highConversionEnabled: boolean
  highConversionCount: string
  soundNotifyEnabled: boolean
  volume: number
}

type CustomerTagRow = {
  id: string
  type: string
  contents: string[]
  enabled: boolean
}

type VersionOption = 'basic' | 'upgrade'

const autoReplyPanels: Array<{ key: AutoReplyPanelKey; label: string }> = [
  { key: 'welcome', label: '欢迎语' },
  { key: 'timeout', label: '超时提醒' },
  { key: 'task', label: '任务提醒' },
]

const autoReplySceneOptions = ['全部任务场景', '【催单】咨询未下单', '【催付】预订待支付', '【回访】入住后关怀']

const defaultAutoReplyTaskDraft: AutoReplyTaskDraft = {
  scene: '【催单】咨询未下单',
  name: '',
  minutes: '5',
  content: '您好，还有什么可以帮助的？我们非常愿意详尽解答，期待您入住',
}

const defaultPageSettings: PageSettingState = {
  timeoutReplyEnabled: false,
  timeoutReplyMinutes: '3',
  severeTimeoutReplyEnabled: false,
  severeTimeoutReplyMinutes: '6',
  firstReplyReminderEnabled: true,
  highConversionEnabled: false,
  highConversionCount: '6',
  soundNotifyEnabled: false,
  volume: 100,
}

const defaultCustomerTags: CustomerTagRow[] = [
  {
    id: 'customer-tag-1',
    type: '客户标签',
    contents: [],
    enabled: true,
  },
]

export function ImSettingPage() {
  const location = useLocation()
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
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isPhraseEditorOpen, setIsPhraseEditorOpen] = useState(false)
  const [activeAutoReplyPanel, setActiveAutoReplyPanel] = useState<AutoReplyPanelKey>('welcome')
  const [autoReplyTaskKeyword, setAutoReplyTaskKeyword] = useState('')
  const [autoReplyTaskSceneFilter, setAutoReplyTaskSceneFilter] = useState('全部任务场景')
  const [autoReplyTasks, setAutoReplyTasks] = useState<AutoReplyTaskRow[]>([])
  const [isAutoReplyTaskDialogOpen, setIsAutoReplyTaskDialogOpen] = useState(false)
  const [autoReplyTaskDraft, setAutoReplyTaskDraft] = useState<AutoReplyTaskDraft>(defaultAutoReplyTaskDraft)
  const [pageSettings, setPageSettings] = useState<PageSettingState>(defaultPageSettings)
  const [tagKeyword, setTagKeyword] = useState('')
  const [customerTags, setCustomerTags] = useState<CustomerTagRow[]>(defaultCustomerTags)
  const [isTagEditorOpen, setIsTagEditorOpen] = useState(false)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [tagEditorContents, setTagEditorContents] = useState<string[]>([''])
  const [selectedVersion, setSelectedVersion] = useState<VersionOption>('basic')
  const [phraseDraft, setPhraseDraft] = useState<PhraseEditorDraft>({
    title: '',
    groupId: '',
    content: '',
  })
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

  function handleOpenCategoryDialog() {
    setNewCategoryName('')
    setIsCategoryDialogOpen(true)
  }

  function handleSaveCategory() {
    const nextName = newCategoryName.trim()
    if (!nextName) return

    const nextGroupId = `group-${Date.now()}`
    setView((current) =>
      current
        ? {
            ...current,
            phraseGroups: [{ id: nextGroupId, name: nextName, count: 0 }, ...current.phraseGroups],
          }
        : current,
    )
    setSelectedGroupId(nextGroupId)
    setIsCategoryDialogOpen(false)
    setFeedback({ tone: 'success', text: '分类已创建' })
  }

  function handleOpenPhraseEditor() {
    setPhraseDraft({
      title: '',
      groupId: selectedGroupId ?? view?.phraseGroups[0]?.id ?? '',
      content: '',
    })
    setIsPhraseEditorOpen(true)
  }

  function handleSavePhrase() {
    if (!phraseDraft.title.trim() || !phraseDraft.groupId || !phraseDraft.content.trim()) return
    const group = view?.phraseGroups.find((item) => item.id === phraseDraft.groupId) ?? view?.phraseGroups[0]
    const nextPhrase: ImPhraseItem = {
      id: `phrase-${Date.now()}`,
      title: phraseDraft.title.trim(),
      content: phraseDraft.content.trim(),
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

  function handleOpenAutoReplyTaskDialog() {
    setAutoReplyTaskDraft(defaultAutoReplyTaskDraft)
    setIsAutoReplyTaskDialogOpen(true)
  }

  function handleSaveAutoReplyTask() {
    if (!autoReplyTaskDraft.scene || !autoReplyTaskDraft.name.trim() || !autoReplyTaskDraft.minutes.trim() || !autoReplyTaskDraft.content.trim()) return

    const nextTask: AutoReplyTaskRow = {
      id: `auto-task-${Date.now()}`,
      name: autoReplyTaskDraft.name.trim(),
      scene: autoReplyTaskDraft.scene,
      timing: `客户咨询后，${autoReplyTaskDraft.minutes.trim()} 分钟未下单且未回复`,
      content: autoReplyTaskDraft.content.trim(),
      enabled: true,
    }

    setAutoReplyTasks((current) => [nextTask, ...current])
    setIsAutoReplyTaskDialogOpen(false)
    setFeedback({ tone: 'success', text: '任务提醒已创建' })
  }

  const filteredAutoReplyTasks = autoReplyTasks.filter((item) => {
    const keyword = autoReplyTaskKeyword.trim()
    const matchesKeyword = !keyword || `${item.name}${item.scene}${item.content}`.includes(keyword)
    const matchesScene = autoReplyTaskSceneFilter === '全部任务场景' || item.scene === autoReplyTaskSceneFilter
    return matchesKeyword && matchesScene
  })

  const filteredCustomerTags = customerTags.filter((item) => {
    const nextKeyword = tagKeyword.trim()
    return !nextKeyword || `${item.type}${item.contents.join('')}`.includes(nextKeyword)
  })

  const editingTag = customerTags.find((item) => item.id === editingTagId) ?? null

  function handleOpenTagEditor(tag: CustomerTagRow) {
    setEditingTagId(tag.id)
    setTagEditorContents(tag.contents.length > 0 ? [...tag.contents] : [''])
    setIsTagEditorOpen(true)
  }

  function handleChangeTagEditorContent(index: number, value: string) {
    setTagEditorContents((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  function handleAddTagEditorContent() {
    setTagEditorContents((current) => [...current, ''])
  }

  function handleRemoveTagEditorContent(index: number) {
    setTagEditorContents((current) => {
      if (current.length === 1) {
        return ['']
      }
      return current.filter((_, itemIndex) => itemIndex !== index)
    })
  }

  function handleSaveTagEditor() {
    if (!editingTagId) return
    const normalizedContents = tagEditorContents.map((item) => item.trim()).filter(Boolean)
    setCustomerTags((current) =>
      current.map((item) => (item.id === editingTagId ? { ...item, contents: normalizedContents } : item)),
    )
    setIsTagEditorOpen(false)
    setEditingTagId(null)
    setFeedback({ tone: 'success', text: '标签已保存' })
  }

  return (
    <div className="im-setting-page" data-provider={provider} data-tab={activeTab}>
      <section className="im-setting-upgrade-banner">
        <span>当前为会话基础版本，可升级获取更完整的 IM 会话能力与快捷键协同。</span>
        <a href="/version/applicationPayment/detail?app=im">会话升级版</a>
      </section>

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
              <button type="button" onClick={handleOpenCategoryDialog}>
                新建分类
              </button>
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
                    添加常用语
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
        <section className="im-setting-panel im-auto-reply-panel" role="region" aria-label="自动回复设置">
          <nav className="im-auto-reply-subtabs" aria-label="自动回复子标签">
            {autoReplyPanels.map((panel) => (
              <button
                key={panel.key}
                type="button"
                className={activeAutoReplyPanel === panel.key ? 'is-active' : ''}
                aria-pressed={activeAutoReplyPanel === panel.key}
                onClick={() => setActiveAutoReplyPanel(panel.key)}
              >
                {panel.label}
              </button>
            ))}
          </nav>

          {activeAutoReplyPanel === 'welcome' ? (
            <div className="im-auto-reply-simple">
              <div className="im-auto-reply-toggle-row">
                <strong>发送欢迎语</strong>
                <span className="im-auto-reply-toggle is-disabled">停用</span>
              </div>
              <p>当顾客发送的第一条消息分配到人工接待时，会自动发送回复，一天内只会对同一顾客发送一次</p>
            </div>
          ) : null}

          {activeAutoReplyPanel === 'timeout' ? (
            <div className="im-auto-reply-simple">
              <div className="im-auto-reply-toggle-row">
                <strong>超时提醒</strong>
                <span className="im-auto-reply-toggle is-disabled">停用</span>
              </div>
              <p>客户等待客服回复的时间超时后，发起这个回复</p>
            </div>
          ) : null}

          {activeAutoReplyPanel === 'task' ? (
            <div className="im-auto-reply-task">
              <div className="im-auto-reply-task-toolbar">
                <div className="im-auto-reply-task-filters">
                  <label className="im-auto-reply-search">
                    <input
                      aria-label="任务名称或话术"
                      placeholder="输入任务名称或话术"
                      value={autoReplyTaskKeyword}
                      onChange={(event) => setAutoReplyTaskKeyword(event.target.value)}
                    />
                    <button type="button" aria-label="搜索任务">
                      搜索
                    </button>
                  </label>
                  <label className="im-auto-reply-scene-filter">
                    <select
                      aria-label="任务场景筛选"
                      value={autoReplyTaskSceneFilter}
                      onChange={(event) => setAutoReplyTaskSceneFilter(event.target.value)}
                    >
                      {autoReplySceneOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button type="button" className="is-primary" onClick={handleOpenAutoReplyTaskDialog}>
                  新建任务
                </button>
              </div>

              <div className="im-auto-reply-task-table-wrap">
                <table className="im-auto-reply-task-table">
                  <thead>
                    <tr>
                      <th>任务名称</th>
                      <th>任务场景</th>
                      <th>发送时机</th>
                      <th>话语</th>
                      <th>是否启用</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAutoReplyTasks.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="im-auto-reply-task-empty">
                            <span className="im-auto-reply-task-empty__icon" aria-hidden="true" />
                            <span>暂无数据</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredAutoReplyTasks.map((task) => (
                        <tr key={task.id}>
                          <td>{task.name}</td>
                          <td>{task.scene}</td>
                          <td>{task.timing}</td>
                          <td>{task.content}</td>
                          <td>{task.enabled ? '启用' : '停用'}</td>
                          <td>详情</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === 'page' ? (
        <section className="im-setting-panel im-page-setting-panel" role="region" aria-label="页面设置">
          <section className="im-config-section">
            <h2>会话标签</h2>
            <div className="im-config-group">
              <h3>超时提醒</h3>
              <label className="im-config-check-line">
                <input
                  type="checkbox"
                  aria-label="会话回复超时提醒"
                  checked={pageSettings.timeoutReplyEnabled}
                  onChange={(event) =>
                    setPageSettings((current) => ({
                      ...current,
                      timeoutReplyEnabled: event.target.checked,
                    }))
                  }
                />
                <span>客户等待回复时间达到（大于等于）</span>
                <input
                  aria-label="会话回复超时分钟数"
                  value={pageSettings.timeoutReplyMinutes}
                  onChange={(event) =>
                    setPageSettings((current) => ({
                      ...current,
                      timeoutReplyMinutes: event.target.value.replace(/[^\d]/g, '').slice(0, 2),
                    }))
                  }
                />
                <span>分钟，会话回复超时。</span>
              </label>
              <label className="im-config-check-line">
                <input
                  type="checkbox"
                  aria-label="会话回复严重超时提醒"
                  checked={pageSettings.severeTimeoutReplyEnabled}
                  onChange={(event) =>
                    setPageSettings((current) => ({
                      ...current,
                      severeTimeoutReplyEnabled: event.target.checked,
                    }))
                  }
                />
                <span>客户等待回复时间达到（大于等于）</span>
                <input
                  aria-label="会话回复严重超时分钟数"
                  value={pageSettings.severeTimeoutReplyMinutes}
                  onChange={(event) =>
                    setPageSettings((current) => ({
                      ...current,
                      severeTimeoutReplyMinutes: event.target.value.replace(/[^\d]/g, '').slice(0, 2),
                    }))
                  }
                />
                <span>分钟，会话回复严重超时。</span>
              </label>
            </div>

            <div className="im-config-group">
              <div className="im-config-toggle-line">
                <strong>首回复提醒</strong>
                <span className="im-config-info" aria-hidden="true">
                  i
                </span>
                <button
                  type="button"
                  className={`im-switch ${pageSettings.firstReplyReminderEnabled ? 'is-on' : ''}`}
                  aria-pressed={pageSettings.firstReplyReminderEnabled}
                  aria-label="首回复提醒开关"
                  onClick={() =>
                    setPageSettings((current) => ({
                      ...current,
                      firstReplyReminderEnabled: !current.firstReplyReminderEnabled,
                    }))
                  }
                />
              </div>
            </div>

            <div className="im-config-group">
              <h3>高成交提醒</h3>
              <label className="im-config-check-line">
                <input
                  type="checkbox"
                  aria-label="高成交提醒"
                  checked={pageSettings.highConversionEnabled}
                  onChange={(event) =>
                    setPageSettings((current) => ({
                      ...current,
                      highConversionEnabled: event.target.checked,
                    }))
                  }
                />
                <span>客户连续发送消息达到（大于等于）</span>
                <input
                  aria-label="高成交提醒条数"
                  value={pageSettings.highConversionCount}
                  onChange={(event) =>
                    setPageSettings((current) => ({
                      ...current,
                      highConversionCount: event.target.value.replace(/[^\d]/g, '').slice(0, 2),
                    }))
                  }
                />
                <span>条，为高成交率。</span>
              </label>
            </div>
          </section>

          <section className="im-config-section">
            <h2>消息通知</h2>
            <div className="im-config-sound-line">
              <span>新消息提醒:</span>
              <label className="im-config-inline-check">
                <input
                  type="checkbox"
                  aria-label="声音通知"
                  checked={pageSettings.soundNotifyEnabled}
                  onChange={(event) =>
                    setPageSettings((current) => ({
                      ...current,
                      soundNotifyEnabled: event.target.checked,
                    }))
                  }
                />
                <span>声音通知</span>
              </label>
              <span>音量</span>
              <input
                type="range"
                min="0"
                max="100"
                aria-label="消息通知音量"
                value={pageSettings.volume}
                onChange={(event) =>
                  setPageSettings((current) => ({
                    ...current,
                    volume: Number(event.target.value),
                  }))
                }
              />
            </div>
          </section>

          <div className="im-setting-save-bar">
            <button type="button" className="is-primary" onClick={() => setFeedback({ tone: 'success', text: '页面设置已保存' })}>
              保存
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === 'tags' ? (
        <section className="im-setting-panel im-tag-setting-panel" role="region" aria-label="标签设置">
          <section className="im-config-section">
            <h2>客户标签</h2>
            <div className="im-tag-toolbar">
              <label className="im-auto-reply-search">
                <input
                  aria-label="标签内容搜索"
                  placeholder="输入标签内容"
                  value={tagKeyword}
                  onChange={(event) => setTagKeyword(event.target.value)}
                />
                <button type="button" aria-label="搜索标签">
                  搜索
                </button>
              </label>
            </div>

            <div className="im-tag-table-wrap">
              <table className="im-auto-reply-task-table im-tag-table">
                <thead>
                  <tr>
                    <th>标签类型</th>
                    <th>标签内容</th>
                    <th>是否启用</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomerTags.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <div className="im-auto-reply-task-empty">
                          <span className="im-auto-reply-task-empty__icon" aria-hidden="true" />
                          <span>暂无数据</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomerTags.map((item) => (
                      <tr key={item.id}>
                        <td>{item.type}</td>
                        <td>{item.contents.join('，')}</td>
                        <td>
                          <button
                            type="button"
                            className={`im-switch im-switch--labeled ${item.enabled ? 'is-on' : ''}`}
                            aria-pressed={item.enabled}
                            aria-label={`${item.type}启用开关`}
                            onClick={() =>
                              setCustomerTags((current) =>
                                current.map((row) => (row.id === item.id ? { ...row, enabled: !row.enabled } : row)),
                              )
                            }
                          >
                            <span>{item.enabled ? '启用' : '停用'}</span>
                          </button>
                        </td>
                        <td>
                          <button type="button" className="im-table-action-button" onClick={() => handleOpenTagEditor(item)}>
                            编辑
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="im-tag-pagination">
              <span>第 1-1 条/总共 1 条</span>
              <button type="button" aria-label="上一页" disabled>
                ‹
              </button>
              <button type="button" className="is-current" aria-label="第1页">
                1
              </button>
              <button type="button" aria-label="下一页" disabled>
                ›
              </button>
              <select aria-label="每页条数">
                <option>10 条/页</option>
              </select>
            </div>
          </section>
        </section>
      ) : null}

      {activeTab === 'shortcuts' ? (
        <section className="im-setting-panel im-shortcut-setting-panel" role="region" aria-label="快捷键设置">
          <div className="im-shortcut-setting-grid">
            {shortcutDraft.map((item) => (
              <div key={item.code} className="im-shortcut-setting-row">
                <strong>{item.name}</strong>
                <span className="im-shortcut-pill">{item.win}</span>
                <span className="im-shortcut-pill">{item.mac}</span>
                <label className="im-shortcut-checkbox">
                  <input
                    type="checkbox"
                    checked={item.isOpen}
                    aria-label={`${item.name}开关`}
                    onChange={() => handleToggleShortcut(item.code)}
                  />
                  <span aria-hidden="true" />
                </label>
              </div>
            ))}
          </div>

          <div className="im-setting-save-bar">
            <button type="button" className="is-primary" onClick={() => void handleSaveShortcuts()}>
              保存
            </button>
          </div>
        </section>
      ) : null}

      {activeTab === 'version' ? (
        <section className="im-setting-panel im-version-setting-panel" role="region" aria-label="版本设置">
          <p className="im-version-setting-tip">会话默认基础版本，可根据需要切换版本</p>

          <section className="im-version-setting-group">
            <h2>选择会话版本</h2>
            <label className="im-version-option">
              <input
                type="radio"
                name="conversation-version"
                value="basic"
                checked={selectedVersion === 'basic'}
                onChange={() => setSelectedVersion('basic')}
              />
              <div>
                <strong>会话基础版</strong>
                <p>会话基础版本，满足房东多渠道接入，进行即时会话</p>
              </div>
            </label>
            <label className="im-version-option">
              <input
                type="radio"
                name="conversation-version"
                value="upgrade"
                checked={selectedVersion === 'upgrade'}
                onChange={() => setSelectedVersion('upgrade')}
              />
              <div>
                <strong>会话升级版</strong>
                <p>会话升级版本，在基础版本的基础上，提供客服坐席，增加会话派单机制，提高响应服务效率</p>
              </div>
            </label>
          </section>

          <div className="im-setting-save-bar">
            <button type="button" className="is-primary" onClick={() => setFeedback({ tone: 'success', text: '版本设置已保存' })}>
              保存
            </button>
          </div>
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

      {isCategoryDialogOpen ? (
        <div className="im-setting-dialog-backdrop">
          <section className="im-setting-dialog im-setting-dialog--compact" role="dialog" aria-label="新建分类">
            <header>
              <h2>新建分类</h2>
            </header>
            <div className="im-setting-dialog-form im-setting-dialog-form--compact">
              <label className="im-setting-form-row">
                <span className="im-setting-form-label is-required">分类名称：</span>
                <input
                  aria-label="分类名称"
                  placeholder="请输入一级分类名称"
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                />
              </label>
            </div>
            <footer className="im-setting-dialog-actions">
              <button type="button" onClick={() => setIsCategoryDialogOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={handleSaveCategory}>
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isPhraseEditorOpen ? (
        <div className="im-setting-dialog-backdrop">
          <section className="im-setting-dialog im-setting-dialog--wide" role="dialog" aria-label="添加常用语">
            <header>
              <h2>添加常用语</h2>
              <button type="button" aria-label="关闭添加常用语" onClick={() => setIsPhraseEditorOpen(false)}>
                ×
              </button>
            </header>
            <div className="im-setting-dialog-form">
              <label className="im-setting-form-row">
                <span className="im-setting-form-label is-required">标题：</span>
                <input
                  aria-label="标题"
                  placeholder="请输入标题"
                  value={phraseDraft.title}
                  onChange={(event) =>
                    setPhraseDraft((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="im-setting-form-row">
                <span className="im-setting-form-label is-required">分类：</span>
                <select
                  aria-label="分类"
                  value={phraseDraft.groupId}
                  onChange={(event) =>
                    setPhraseDraft((current) => ({
                      ...current,
                      groupId: event.target.value,
                    }))
                  }
                >
                  <option value="" disabled>
                    请选择分类
                  </option>
                  {(view?.phraseGroups ?? []).map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="im-setting-form-row im-setting-form-row--textarea">
                <span className="im-setting-form-label is-required">回复内容：</span>
                <div className="im-setting-form-control">
                  <textarea
                    aria-label="回复内容"
                    placeholder="请输入回复内容"
                    value={phraseDraft.content}
                    onChange={(event) =>
                      setPhraseDraft((current) => ({
                        ...current,
                        content: event.target.value,
                      }))
                    }
                    rows={5}
                    maxLength={500}
                  />
                  <span className="im-setting-form-counter">{phraseDraft.content.length} / 500</span>
                </div>
              </label>
            </div>
            <footer className="im-setting-dialog-actions">
              <button type="button" onClick={() => setIsPhraseEditorOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={handleSavePhrase}>
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isTagEditorOpen ? (
        <div className="im-setting-dialog-backdrop">
          <section className="im-setting-dialog im-setting-dialog--tag-editor" role="dialog" aria-label="编辑标签">
            <header>
              <h2>编辑标签</h2>
              <button type="button" aria-label="关闭编辑标签" onClick={() => setIsTagEditorOpen(false)}>
                ×
              </button>
            </header>
            <div className="im-setting-dialog-form">
              <label className="im-setting-form-row">
                <span className="im-setting-form-label is-required">标签组：</span>
                <input aria-label="标签组" value={editingTag?.type ?? ''} readOnly />
              </label>
              <div className="im-setting-form-row im-setting-form-row--tag-editor">
                <span className="im-setting-form-label is-required">标签内容：</span>
                <div className="im-tag-editor-list">
                  {tagEditorContents.map((content, index) => (
                    <div key={`${editingTagId ?? 'tag'}-${index}`} className="im-tag-editor-row">
                      <input
                        aria-label={`标签内容${index + 1}`}
                        placeholder="请输入标签内容"
                        value={content}
                        onChange={(event) => handleChangeTagEditorContent(index, event.target.value)}
                      />
                      <button
                        type="button"
                        className="im-tag-editor-remove"
                        aria-label={`删除标签内容${index + 1}`}
                        onClick={() => handleRemoveTagEditorContent(index)}
                      >
                        －
                      </button>
                      {index === tagEditorContents.length - 1 ? (
                        <button type="button" className="im-tag-editor-add" onClick={handleAddTagEditorContent}>
                          <span aria-hidden="true">＋</span>
                          添加标签内容
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <footer className="im-setting-dialog-actions">
              <button type="button" onClick={() => setIsTagEditorOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={handleSaveTagEditor}>
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isAutoReplyTaskDialogOpen ? (
        <div className="im-setting-dialog-backdrop">
          <section className="im-setting-dialog im-setting-dialog--task" role="dialog" aria-label="新建任务">
            <header>
              <h2>新建任务</h2>
              <button type="button" aria-label="关闭新建任务" onClick={() => setIsAutoReplyTaskDialogOpen(false)}>
                ×
              </button>
            </header>
            <div className="im-setting-dialog-form">
              <label className="im-setting-form-row">
                <span className="im-setting-form-label is-required">任务场景：</span>
                <select
                  aria-label="任务场景"
                  value={autoReplyTaskDraft.scene}
                  onChange={(event) =>
                    setAutoReplyTaskDraft((current) => ({
                      ...current,
                      scene: event.target.value,
                    }))
                  }
                >
                  {autoReplySceneOptions.filter((option) => option !== '全部任务场景').map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="im-setting-form-row">
                <span className="im-setting-form-label is-required">任务名称：</span>
                <input
                  aria-label="任务名称"
                  placeholder="输入事件名称"
                  value={autoReplyTaskDraft.name}
                  onChange={(event) =>
                    setAutoReplyTaskDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="im-setting-form-row im-setting-form-row--timing">
                <span className="im-setting-form-label">发送时机：</span>
                <div className="im-auto-reply-task-timing">
                  <span>客户咨询后，</span>
                  <input
                    aria-label="发送分钟数"
                    inputMode="numeric"
                    value={autoReplyTaskDraft.minutes}
                    onChange={(event) =>
                      setAutoReplyTaskDraft((current) => ({
                        ...current,
                        minutes: event.target.value.replace(/[^\d]/g, '').slice(0, 3),
                      }))
                    }
                  />
                  <span>分钟未下单且未回复</span>
                </div>
              </div>
              <label className="im-setting-form-row im-setting-form-row--textarea">
                <span className="im-setting-form-label is-required">催单话术：</span>
                <div className="im-setting-form-control">
                  <textarea
                    aria-label="催单话术"
                    value={autoReplyTaskDraft.content}
                    onChange={(event) =>
                      setAutoReplyTaskDraft((current) => ({
                        ...current,
                        content: event.target.value,
                      }))
                    }
                    rows={5}
                    maxLength={500}
                  />
                  <span className="im-setting-form-counter">{autoReplyTaskDraft.content.length} / 500</span>
                </div>
              </label>
            </div>
            <footer className="im-setting-dialog-actions">
              <button type="button" onClick={() => setIsAutoReplyTaskDialogOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={handleSaveAutoReplyTask}>
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
