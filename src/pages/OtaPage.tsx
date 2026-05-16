import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { otaConnectedCards, otaPendingCards } from '../data/mock'
import './OtaPage.css'

const otaLogRows = [
  {
    channel: '美团酒店',
    type: '关联渠道房型',
    content: '关联渠道房型-观影大床房到 路客云房型-观影大床房',
    status: '成功',
    operator: '路客云6TS5',
    time: '2025-10-03 21:49:53',
  },
  {
    channel: '美团酒店',
    type: '关联渠道房型',
    content: '关联渠道房型-天落大床房（电竞升降电脑）到 路客云房型-天落大床电竞套间',
    status: '成功',
    operator: '路客云6TS5',
    time: '2025-10-03 21:49:50',
  },
  {
    channel: '美团酒店',
    type: '关联渠道房型',
    content: '关联渠道房型-总裁套间-独享台球电竞桑拿浴缸轰趴露台麻将到 路客云房型-总裁套间（桑拿浴缸露台电竞麻将）',
    status: '成功',
    operator: '路客云6TS5',
    time: '2025-10-03 21:49:46',
  },
  {
    channel: '美团酒店',
    type: '关联渠道房型',
    content: '关联渠道房型-顶层套房-独享麻将电竞浴缸-天落大床-欧式大床到 路客云房型-顶层套房（浴缸巨幕电竞麻将）',
    status: '成功',
    operator: '路客云6TS5',
    time: '2025-10-03 21:49:40',
  },
  {
    channel: '携程',
    type: '关联渠道房型',
    content: '关联渠道房型-顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）到 路客云房型-顶层套房（浴缸巨幕电竞麻将）',
    status: '成功',
    operator: '11',
    time: '2025-09-29 15:48:12',
  },
  {
    channel: '携程',
    type: '解除渠道房型',
    content: '解除渠道房型-顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）到 路客云房型-顶层套房（浴缸巨幕电竞麻将）',
    status: '成功',
    operator: '11',
    time: '2025-09-29 15:44:37',
  },
]

function logoText(name: string) {
  return name.length > 4 ? name.slice(0, 2) : name
}

export function OtaPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [operator, setOperator] = useState('')
  const isLogPage = location.pathname.endsWith('/log')

  function updateNotice(message: string) {
    setNotice(message)
  }

  if (isLogPage) {
    return (
      <div className="ota-page ota-page--log">
        <h1 className="sr-only-heading">OTA</h1>
        <div className="ota-breadcrumb">
          <button type="button" onClick={() => navigate('/channels/ota')}>
            OTA
          </button>
          <span>/</span>
          <strong>操作日志</strong>
        </div>

        <section className="ota-log-panel" aria-label="OTA操作日志筛选">
          <div className="ota-log-filter">
            <label className="ota-field">
              <span>渠道</span>
              <button type="button" aria-label="渠道" className="ota-select">
                请选择
              </button>
            </label>
            <label className="ota-field">
              <span>关键词</span>
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索关键词"
              />
            </label>
            <label className="ota-field">
              <span>操作人</span>
              <input
                value={operator}
                onChange={(event) => setOperator(event.target.value)}
                placeholder="搜索操作人"
              />
            </label>
            <div className="ota-log-actions">
              <button
                type="button"
                className="ota-button"
                onClick={() => {
                  setKeyword('')
                  setOperator('')
                  updateNotice('已重置 OTA 操作日志筛选')
                }}
              >
                重 置
              </button>
              <button
                type="button"
                className="ota-button ota-button--primary"
                onClick={() => updateNotice('已查询 OTA 操作日志')}
              >
                查 询
              </button>
              <button type="button" className="ota-link-button" onClick={() => setExpanded((value) => !value)}>
                {expanded ? '收起' : '展开'}
              </button>
            </div>
            {expanded ? (
              <div className="ota-log-filter ota-log-filter--advanced">
                <label className="ota-field">
                  <span>操作类型</span>
                  <button type="button" aria-label="操作类型" className="ota-select">
                    请选择
                  </button>
                </label>
                <label className="ota-field">
                  <span>操作状态</span>
                  <button type="button" aria-label="操作状态" className="ota-select">
                    请选择
                  </button>
                </label>
              </div>
            ) : null}
          </div>
        </section>

        <section className="ota-table-shell">
          <table aria-label="OTA操作日志列表" className="ota-log-table">
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
              {otaLogRows.map((row) => (
                <tr key={`${row.channel}-${row.type}-${row.time}`}>
                  <td>{row.channel}</td>
                  <td>{row.type}</td>
                  <td>{row.content}</td>
                  <td>
                    <span className="ota-status-success">{row.status}</span>
                  </td>
                  <td>{row.operator}</td>
                  <td>{row.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div role="status" className="ota-live-status">
          {notice}
        </div>
      </div>
    )
  }

  return (
    <div className="ota-page">
      <h1 className="sr-only-heading">OTA</h1>
      <section className="ota-channel-section">
        <div className="ota-section-title">
          <h2>已直连渠道</h2>
        </div>
        <div className="ota-card-grid">
          {otaConnectedCards.map((card, index) => {
            const isLuke = card.name === '路客云聚合'
            return (
              <article
                key={card.name}
                className="ota-channel-card ota-channel-card--connected"
                data-testid={isLuke ? 'ota-luke-card' : 'ota-connected-card'}
              >
                <div className="ota-channel-card__header">
                  <div>
                    <strong>{card.name}</strong>
                    <span>{card.relation}</span>
                  </div>
                  <div className={`ota-channel-logo ota-channel-logo--${(index % 5) + 1}`}>
                    {logoText(card.name)}
                  </div>
                </div>
                <div className="ota-channel-card__actions">
                  {isLuke ? null : (
                    <button type="button" onClick={() => updateNotice(`准备为${card.name}新增账号`)}>
                      新增账号
                    </button>
                  )}
                  <button type="button" onClick={() => updateNotice(`打开${card.name}渠道管理`)}>
                    管理渠道
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="ota-channel-section">
        <div className="ota-section-title">
          <h2>未直连渠道</h2>
        </div>
        <div className="ota-card-grid">
          {otaPendingCards.map((card, index) => (
            <article key={card.name} className="ota-channel-card ota-channel-card--pending" data-testid="ota-pending-card">
              <div className="ota-channel-card__header">
                <div>
                  <strong>{card.name}</strong>
                </div>
                <div className={`ota-channel-logo ota-channel-logo--pending ota-channel-logo--${(index % 5) + 1}`}>
                  {logoText(card.name)}
                </div>
              </div>
              <div className="ota-channel-card__actions">
                <button type="button" className="ota-primary-action" onClick={() => updateNotice(`准备关联${card.name}`)}>
                  立即关联
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <button type="button" className="ota-log-entry" onClick={() => navigate('/channels/ota/log')}>
        操作日志
      </button>
      <div role="status" className="ota-live-status">
        {notice}
      </div>
    </div>
  )
}
