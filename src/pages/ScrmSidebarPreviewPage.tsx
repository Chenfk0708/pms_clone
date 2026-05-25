import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchScrmSidebarDashboard,
  type ScrmConversation,
  type ScrmReplyTemplate,
  type ScrmSidebarDashboard,
  type ScrmSidebarFilters,
  type ScrmSidebarScenario,
} from '../services/scrmSidebarPreview'
import './ScrmSidebarPreviewPage.css'

type ConversationTabKey = 'all' | 'waiting' | 'consulting' | 'converted' | 'followup'

type ChatMessage = {
  id: string
  conversationId: string
  author: 'guest' | 'staff' | 'system'
  authorName: string
  tone: AvatarTone
  content: string
  time: string
}

type AvatarTone = 'is-blue' | 'is-sky' | 'is-gold' | 'is-coral'

const DEFAULT_FILTERS: Omit<ScrmSidebarFilters, 'scenario'> = {
  campId: '1796067693589061634',
  poiId: 'ALL',
  date: '2026-05-18',
  channel: 'ALL',
  keyword: '',
  page: 1,
  pageSize: 20,
}

const TAB_CONFIG: Array<{ key: ConversationTabKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'waiting', label: '未回复' },
  { key: 'consulting', label: '咨询中' },
  { key: 'converted', label: '已转订单' },
  { key: 'followup', label: '待跟进' },
]

export function ScrmSidebarPreviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search])
  const scenario = normalizeScenario(searchParams.get('mockState'))
  const queryConversationId = searchParams.get('conversationId') ?? ''

  const [dashboard, setDashboard] = useState<ScrmSidebarDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<ConversationTabKey>('all')
  const [selectedConversationId, setSelectedConversationId] = useState('')
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({})
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError('')

      try {
        const nextDashboard = await fetchScrmSidebarDashboard({
          ...DEFAULT_FILTERS,
          scenario,
        })

        if (cancelled) return

        setDashboard(nextDashboard)
        setMessages((current) => ensureMessages(current, nextDashboard.conversations))

        if (queryConversationId && nextDashboard.conversations.some((item) => item.id === queryConversationId)) {
          setSelectedConversationId(queryConversationId)
        } else if (scenario === 'empty') {
          setSelectedConversationId('')
        }
      } catch (nextError) {
        if (cancelled) return
        setError(nextError instanceof Error ? nextError.message : '聊天工具栏数据加载失败，请稍后重试')
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [queryConversationId, refreshTick, scenario])

  const counts = useMemo(() => createTabCounts(dashboard?.conversations ?? []), [dashboard?.conversations])
  const filteredConversations = useMemo(
    () => filterConversationsByTab(dashboard?.conversations ?? [], activeTab),
    [activeTab, dashboard?.conversations],
  )
  const selectedConversation =
    filteredConversations.find((item) => item.id === selectedConversationId) ??
    dashboard?.conversations.find((item) => item.id === selectedConversationId) ??
    null
  const selectedMessages = selectedConversation ? messages[selectedConversation.id] ?? [] : []

  function handleSelectConversation(conversationId: string) {
    setSelectedConversationId(conversationId)
  }

  function handleSendMessage() {
    if (!selectedConversation || !draft.trim()) return

    const nextMessage: ChatMessage = {
      id: `${selectedConversation.id}-staff-${Date.now()}`,
      conversationId: selectedConversation.id,
      author: 'staff',
      authorName: '房东账号',
      tone: conversationToneForIndex(3),
      content: draft.trim(),
      time: '刚刚',
    }

    setMessages((current) => ({
      ...current,
      [selectedConversation.id]: [...(current[selectedConversation.id] ?? []), nextMessage],
    }))
    setDraft('')
  }

  function handleUseTemplate(template: ScrmReplyTemplate) {
    setDraft(template.content)
  }

  return (
    <div className="conversation-full-page">
      <div
        hidden
        data-testid="scrm-sidebar-service-contract"
        data-provider={dashboard?.providerMode ?? 'mock'}
        data-endpoint={dashboard?.endpoint ?? ''}
        data-request-body={JSON.stringify(dashboard?.requestBody ?? {})}
      />

      <aside className="conversation-full-page__sidebar">
        <header className="conversation-full-page__header">
          <strong>全部会话</strong>
          <div className="conversation-full-page__tools">
            <button type="button" aria-label="同步会话列表" onClick={() => setRefreshTick((value) => value + 1)}>
              <MenuIcon />
            </button>
            <button type="button" aria-label="会话设置" onClick={() => navigate('/setting/imSetting')}>
              <GearIcon />
            </button>
          </div>
        </header>

        <div className="conversation-full-page__tabs" role="tablist" aria-label="全部会话分类">
          {TAB_CONFIG.map((tab) => {
            const count = counts[tab.key]
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.key}
                className={activeTab === tab.key ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.key)}
              >
                <span>{tab.label}</span>
                {count > 0 ? <em>{count}</em> : null}
              </button>
            )
          })}
        </div>

        <div className="conversation-full-page__list">
          {isLoading ? (
            <div className="conversation-full-page__state">正在同步会话列表...</div>
          ) : error ? (
            <section className="conversation-full-page__state conversation-full-page__state--error" role="alert">
              <div>{error}</div>
              <button type="button" onClick={() => setRefreshTick((value) => value + 1)}>
                重试
              </button>
            </section>
          ) : filteredConversations.length > 0 ? (
            filteredConversations.map((conversation, index) => (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-card${selectedConversationId === conversation.id ? ' is-active' : ''}`}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <span className={`conversation-card__avatar ${conversationToneForIndex(index)}`} aria-hidden="true">
                  {avatarEmojiForIndex(index)}
                </span>
                <div className="conversation-card__body">
                  <div className="conversation-card__topline">
                    <strong>{conversation.guestName}</strong>
                    <b>{conversation.status}</b>
                  </div>
                  <div className="conversation-card__meta">
                    <em>{channelBadgeLabel(conversation.channel)}</em>
                    <span>{conversation.roomName}</span>
                  </div>
                  <p>{conversation.lastMessage}</p>
                  <small>{conversation.lastMessageAt}</small>
                </div>
              </button>
            ))
          ) : (
            <div className="conversation-full-page__state">当前分类下暂无会话</div>
          )}
        </div>
      </aside>

      <section className="conversation-full-page__content">
        {selectedConversation ? (
          <div className="conversation-workbench">
            <header className="conversation-workbench__head">
              <div className="conversation-workbench__title">
                <strong>
                  {selectedConversation.guestName} <span>{selectedConversation.status}</span>
                </strong>
                <p>{selectedConversation.roomName}</p>
                <small>
                  订单号 {selectedConversation.orderNo} · {selectedConversation.stayRange}
                </small>
              </div>
              <div className="conversation-workbench__meta">
                <button type="button">房东账号</button>
                <span>响应时效 {selectedConversation.responseSla}</span>
                <span>订单金额 ¥{selectedConversation.orderAmount}</span>
              </div>
            </header>

            <div className="conversation-workbench__toolbar">
              <button type="button" className="conversation-workbench__quick-entry">
                <FlashIcon />
                <span>快捷回复</span>
              </button>
              <div className="conversation-workbench__pager">
                <button type="button">上一位</button>
                <button type="button">下一位</button>
              </div>
              <span className="conversation-workbench__history">历史订单 / 房态联动</span>
            </div>

            <div className="conversation-workbench__timeline">
              {selectedMessages.map((message) => (
                <article
                  key={message.id}
                  className={`chat-message${message.author === 'staff' ? ' chat-message--staff' : ''}`}
                >
                  <span
                    className={`chat-message__avatar ${message.author === 'staff' ? 'chat-message__avatar--staff' : message.tone}`}
                    aria-hidden="true"
                  >
                    {message.author === 'staff' ? '店' : avatarEmojiForTone(message.tone)}
                  </span>
                  <div className="chat-message__content">
                    <small>
                      {message.authorName} · {message.time}
                    </small>
                    <p>{message.content}</p>
                  </div>
                </article>
              ))}
            </div>

            <div className="conversation-workbench__composer">
              <div className="conversation-workbench__reply-chips">
                {(dashboard?.replyTemplates ?? []).map((template) => (
                  <button key={template.id} type="button" onClick={() => handleUseTemplate(template)}>
                    {template.title}
                  </button>
                ))}
              </div>
              <textarea
                aria-label="发送消息输入框"
                placeholder="请输入回复内容"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
              />
              <div className="conversation-workbench__composer-footer">
                <span>{selectedConversation.preference}</span>
                <button type="button" disabled={!draft.trim()} onClick={handleSendMessage}>
                  发送
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="conversation-empty-state">您还未选中或发起聊天</div>
        )}
      </section>
    </div>
  )
}

function normalizeScenario(value: string | null): ScrmSidebarScenario {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}

function createTabCounts(conversations: ScrmConversation[]) {
  const waiting = conversations.filter((item) => item.status === '待回复').length
  const converted = conversations.filter((item) => item.status === '已转订单').length
  const consulting = conversations.filter((item) => item.status === '咨询中').length
  const followup = conversations.filter((item) => item.tags.some((tag) => tag.includes('续住') || tag.includes('复购'))).length

  return {
    all: conversations.length,
    waiting,
    consulting,
    converted,
    followup,
  } satisfies Record<ConversationTabKey, number>
}

function filterConversationsByTab(conversations: ScrmConversation[], activeTab: ConversationTabKey) {
  if (activeTab === 'all') return conversations
  if (activeTab === 'waiting') return conversations.filter((item) => item.status === '待回复')
  if (activeTab === 'consulting') return conversations.filter((item) => item.status === '咨询中')
  if (activeTab === 'converted') return conversations.filter((item) => item.status === '已转订单')
  return conversations.filter((item) => item.tags.some((tag) => tag.includes('续住') || tag.includes('复购')))
}

function ensureMessages(current: Record<string, ChatMessage[]>, conversations: ScrmConversation[]) {
  const nextMessages = { ...current }

  for (let index = 0; index < conversations.length; index += 1) {
    const conversation = conversations[index]
    if (nextMessages[conversation.id]) continue

    const tone = conversationToneForIndex(index)
    nextMessages[conversation.id] = [
      {
        id: `${conversation.id}-guest-001`,
        conversationId: conversation.id,
        author: 'guest',
        authorName: conversation.guestName,
        tone,
        content: guestOpeningMessage(conversation),
        time: conversation.lastMessageAt,
      },
      {
        id: `${conversation.id}-staff-001`,
        conversationId: conversation.id,
        author: 'staff',
        authorName: '房东账号',
        tone,
        content: staffFollowupMessage(conversation),
        time: conversation.lastMessageAt,
      },
    ]
  }

  return nextMessages
}

function guestOpeningMessage(conversation: ScrmConversation) {
  if (conversation.status === '待回复') return '今天还有同房型可以续住吗？'
  if (conversation.status === '已转订单') return '已经下单成功，想确认下入住指引。'
  return '房了加了'
}

function staffFollowupMessage(conversation: ScrmConversation) {
  if (conversation.status === '待回复') return '有的，我先帮您确认同房续住价格，稍后把方案发您。'
  if (conversation.status === '已转订单') return '好的，稍后把门锁密码、停车位置和入住指引一并发您。'
  return '加了绿色号，稍后发送入住指引。'
}

function conversationToneForIndex(index: number): AvatarTone {
  return ['is-blue', 'is-sky', 'is-gold', 'is-coral'][index % 4] as AvatarTone
}

function avatarEmojiForIndex(index: number) {
  return ['🐻', '🐼', '🐱', '🐰'][index % 4]
}

function avatarEmojiForTone(tone: AvatarTone) {
  switch (tone) {
    case 'is-sky':
      return '🐼'
    case 'is-gold':
      return '🐱'
    case 'is-coral':
      return '🐰'
    default:
      return '🐻'
  }
}

function channelBadgeLabel(channel: string) {
  switch (channel) {
    case 'ctrip':
      return '携程'
    case 'meituan':
      return '美团'
    case 'xiaozhu':
      return '小猪'
    default:
      return '途家'
  }
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7.5h14M9 12h10M13 16.5h6" />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3.5a1 1 0 0 1 .96.71l.38 1.2c.5.13.98.33 1.42.59l1.16-.62a1 1 0 0 1 1.17.18l1.36 1.36a1 1 0 0 1 .18 1.17l-.62 1.16c.26.44.46.92.59 1.42l1.2.38a1 1 0 0 1 .71.96v1.98a1 1 0 0 1-.71.96l-1.2.38c-.13.5-.33.98-.59 1.42l.62 1.16a1 1 0 0 1-.18 1.17l-1.36 1.36a1 1 0 0 1-1.17.18l-1.16-.62c-.44.26-.92.46-1.42.59l-.38 1.2a1 1 0 0 1-.96.71h-1.98a1 1 0 0 1-.96-.71l-.38-1.2a6.7 6.7 0 0 1-1.42-.59l-1.16.62a1 1 0 0 1-1.17-.18L4.9 18.83a1 1 0 0 1-.18-1.17l.62-1.16A6.7 6.7 0 0 1 4.75 15l-1.2-.38a1 1 0 0 1-.71-.96v-1.98a1 1 0 0 1 .71-.96l1.2-.38c.13-.5.33-.98.59-1.42l-.62-1.16a1 1 0 0 1 .18-1.17L6.26 4.5a1 1 0 0 1 1.17-.18l1.16.62c.44-.26.92-.46 1.42-.59l.38-1.2a1 1 0 0 1 .96-.71H12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  )
}

function FlashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m13 2-7 11h5l-1 9 8-12h-5z" />
    </svg>
  )
}
