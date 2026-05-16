import { useNavigate } from 'react-router-dom'
import './SocialPage.css'

const socialConnectedCards = [
  {
    name: '抖音来客',
    relation: '关联房型0/0',
    support: '支持：日历房、预售券',
    action: '管理渠道',
    accent: 'blue',
  },
]

const socialPendingCards = [
  { name: '小红书', action: '订阅开通', accent: 'red' },
  { name: '视频号', action: '订阅开通', accent: 'green' },
  { name: '抖音特价酒店', action: '订阅开通', accent: 'orange' },
]

function logoText(name: string) {
  if (name === '抖音来客' || name === '抖音特价酒店') return '♪'
  if (name === '小红书') return '小红书'
  if (name === '视频号') return '视频号'
  return name.slice(0, 2)
}

export function SocialPage() {
  const navigate = useNavigate()

  return (
    <div className="social-channel-page" data-testid="social-channel-page">
      <h1 className="sr-only-heading">社媒</h1>
      <section className="social-channel-surface">
        <section className="social-channel-section">
          <div className="social-channel-section__title">
            <span aria-hidden="true" />
            <h2>已直连渠道</h2>
          </div>
          <div className="social-channel-grid social-channel-grid--single">
            {socialConnectedCards.map((card) => (
              <article
                key={card.name}
                className="social-channel-card social-channel-card--connected"
                aria-label={card.name}
              >
                <div className="social-channel-card__meta">
                  <strong>{card.name}</strong>
                  <span>{card.relation}</span>
                  <span>{card.support}</span>
                </div>
                <div className={`social-channel-card__logo social-channel-card__logo--${card.accent ?? 'blue'}`}>
                  {logoText(card.name)}
                </div>
                <div className="social-channel-card__actions">
                  <button type="button" onClick={() => navigate('/channels/social/setting')}>
                    {card.action}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="social-channel-section">
          <div className="social-channel-section__title">
            <span aria-hidden="true" />
            <h2>未直连渠道</h2>
          </div>
          <div className="social-channel-grid">
            {socialPendingCards.map((card) => (
              <article
                key={card.name}
                className="social-channel-card social-channel-card--pending"
                aria-label={card.name}
              >
                <div className="social-channel-card__meta">
                  <strong>{card.name}</strong>
                </div>
                <div className={`social-channel-card__logo social-channel-card__logo--${card.accent ?? 'blue'}`}>
                  {logoText(card.name)}
                </div>
                <div className="social-channel-card__actions">
                  <button type="button">{card.action}</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

export function SocialSettingPage() {
  return (
    <div className="social-channel-page social-channel-page--detail" data-testid="social-channel-detail">
      <h1 className="sr-only-heading">社媒</h1>
      <section className="social-detail-surface">
        <div className="social-detail-breadcrumb">
          <span>社媒/</span>
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
            {['账号管理', '门店管理', '日历房型', '预售房型'].map((tab, index) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={index === 0}
                className={index === 0 ? 'is-active' : ''}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="social-detail-toolbar">
            <button type="button" className="social-detail-toolbar__primary">
              添加账号
            </button>
            <label>
              <span>审核状态：</span>
              <select aria-label="审核状态" defaultValue="all">
                <option value="all">全部</option>
                <option value="published">已发布</option>
                <option value="reviewing">审核中</option>
              </select>
            </label>
            <label>
              <span>账号：</span>
              <input aria-label="账号" />
            </label>
            <button type="button">查 询</button>
            <button type="button">重 置</button>
          </div>

          <div className="social-detail-table-wrap">
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
                <tr>
                  <td>7370207731854149643</td>
                  <td>1820360983796908034</td>
                  <td>0</td>
                  <td>
                    <span>酒店行业预售券解决方案</span>
                    <span>酒店行业日历房解决方案</span>
                  </td>
                  <td>
                    <span className="social-detail-status">已发布</span>
                    <span className="social-detail-status social-detail-status--reviewing">审核中</span>
                  </td>
                  <td>
                    <div className="social-detail-actions">
                      <button type="button">断开直连</button>
                      <button type="button">拉取房型</button>
                      <button type="button">授权日历房</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <footer className="social-detail-pagination">
            <span>第 1-1 条/总共 1 条</span>
            <button type="button" className="is-active">
              1
            </button>
            <span>10 条/页</span>
          </footer>
        </section>
      </section>
    </div>
  )
}
