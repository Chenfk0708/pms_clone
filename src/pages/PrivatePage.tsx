import { useLocation, useNavigate } from 'react-router-dom'
import { privateCards } from '../data/discovery'
import './PrivatePage.css'

function ChannelLogo({ name }: { name: string }) {
  if (name === '企业微信') {
    return (
      <div className="private-logo private-logo--wecom" aria-hidden="true">
        <span />
        <i />
        <b />
      </div>
    )
  }

  if (name === '公众号') {
    return (
      <div className="private-logo private-logo--official" aria-hidden="true">
        <span />
        <i />
      </div>
    )
  }

  return (
    <div className="private-logo private-logo--program" aria-hidden="true">
      <strong>小</strong>
    </div>
  )
}

function DefaultPrivatePage() {
  const navigate = useNavigate()

  function openChannel(name: string) {
    if (name === '企业微信') navigate('/channels/private/setting/weComSetting')
    if (name === '公众号') navigate('/channels/private/setting/authorizationSettings')
  }

  return (
    <div className="private-channel-page">
      <h1 className="sr-only-heading">私域</h1>
      <section className="private-channel-panel">
        <div className="private-section-title">
          <h2>未直连渠道</h2>
        </div>
        <div className="private-card-grid">
          {privateCards.map((card) => (
            <article key={card.name} className="private-card" aria-label={card.name}>
              <div>
                <h3>{card.name}</h3>
                <button
                  type="button"
                  className={`private-button ${card.action === '立即关联' ? 'private-button--primary' : ''}`}
                  onClick={() => openChannel(card.name)}
                >
                  {card.action}
                </button>
              </div>
              <ChannelLogo name={card.name} />
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function EnterpriseDetailPage() {
  return (
    <div className="private-channel-page">
      <h1 className="sr-only-heading">私域</h1>
      <section className="private-detail-panel">
        <div className="private-breadcrumb">
          <span>私域</span>
          <span>/</span>
          <strong>渠道详情</strong>
        </div>
        <header className="private-enterprise-head">
          <ChannelLogo name="企业微信" />
          <div>
            <h2>企业微信</h2>
            <span>免费试用90天</span>
            <em>未接入</em>
          </div>
          <button type="button" className="private-button private-button--primary">
            立即接入
          </button>
        </header>
        <section className="private-detail-copy">
          <h3>接入企业微信后，您可以获得</h3>
          <ol>
            <li>自动化的获客流程</li>
            <li>低成本的获客方式</li>
            <li>丰富的活动运营数据分析和精细化的管理</li>
          </ol>
          <p>
            企业微信用于沉淀私域客户、承接入住沟通和后续复购触达。完成接入后，可在 SCRM 场景中统一管理客户关系。
          </p>
        </section>
      </section>
    </div>
  )
}

function OfficialAuthorizationPage() {
  return (
    <div className="private-channel-page">
      <h1 className="sr-only-heading">私域</h1>
      <section className="private-detail-panel">
        <div className="private-breadcrumb">
          <span>私域</span>
          <span>/</span>
          <strong>渠道详情</strong>
        </div>
        <section className="private-official-copy">
          <h2>授权微信公众号</h2>
          <p>将您已认证企业资质的公众号，授权给路客云后，可用于客户消息接待、会员触达和私域运营。</p>
          <p>请选择已有公众号授权，或先开通公众号后再完成授权。</p>
        </section>
        <div className="private-official-options">
          <article>
            <div className="private-logo private-logo--official" aria-hidden="true">
              <span />
              <i />
            </div>
            <button type="button" className="private-button private-button--primary">
              已有公众号，立即授权
            </button>
          </article>
          <article className="is-muted">
            <div className="private-logo private-logo--official" aria-hidden="true">
              <span />
              <i />
            </div>
            <button type="button" className="private-button">
              没有公众号，立即开通
            </button>
          </article>
        </div>
      </section>
    </div>
  )
}

export function PrivatePage() {
  const location = useLocation()

  if (location.pathname.endsWith('/setting/weComSetting')) return <EnterpriseDetailPage />
  if (location.pathname.endsWith('/setting/authorizationSettings')) return <OfficialAuthorizationPage />
  return <DefaultPrivatePage />
}
