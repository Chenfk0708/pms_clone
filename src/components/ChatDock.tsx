import { useState } from 'react'

const conversations = [
  {
    name: '携程民宿-【M335275070】',
    source: '途家',
    room: '顶层套房（淞缇巨幕电竞麻将）',
    preview: '我 加了',
    tone: '',
  },
  {
    name: '携程民宿-【M566739056】',
    source: '途家',
    room: '总裁套间（桦拿淞缇露台电竞麻将）',
    preview: '我 已办理退房',
    tone: 'is-sky',
  },
  {
    name: '去哪民宿-【去哪儿用户】',
    source: '途家 02.19-02.21（2晚）',
    room: '总裁套间（桦拿淞缇露台电竞麻将）',
    preview: '我 人 有的',
    tone: 'is-amber',
  },
  {
    name: '携程民宿-【M614718025】',
    source: '途家',
    room: '顶层套房（淞缇巨幕电竞麻将）',
    preview: '我 什么时间段呢几号到几...',
    tone: 'is-pink',
  },
]

interface ChatDockProps {
  openSignal?: number
}

export function ChatDock({ openSignal = 0 }: ChatDockProps) {
  const [closedAtSignal, setClosedAtSignal] = useState<number | null>(null)
  const open = closedAtSignal === null || openSignal > closedAtSignal

  if (!open) {
    return (
      <button type="button" className="chat-dock-launcher" aria-label="打开全部会话" onClick={() => setClosedAtSignal(null)}>
        <span aria-hidden="true" />
      </button>
    )
  }

  return (
    <aside className="chat-dock" aria-label="全部会话">
      <header className="chat-dock__header">
        <strong>全部会话</strong>
        <div className="chat-dock__actions">
          <button type="button" aria-label="更新会话列表">
            ↻
          </button>
          <button type="button" aria-label="收起会话" onClick={() => setClosedAtSignal(openSignal)}>
            收起
          </button>
        </div>
      </header>
      <div className="chat-dock__list">
        {conversations.map((item) => (
          <article key={item.name} className="chat-item">
            <span className={`chat-item__avatar ${item.tone}`} aria-hidden="true" />
            <div>
              <div className="chat-item__title">
                <strong>{item.name}</strong>
                <span>咨询中</span>
              </div>
              <p>
                <em>{item.source}</em>
                {item.room}
              </p>
              <small>{item.preview}</small>
            </div>
          </article>
        ))}
      </div>
      <button type="button" className="chat-dock__collapse" onClick={() => setClosedAtSignal(openSignal)}>
        收起
      </button>
    </aside>
  )
}
