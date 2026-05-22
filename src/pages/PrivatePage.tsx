import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { loadPrivateChannel, type PrivateChannelApiCard } from '../services/privateChannel'
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

function PrivateActionStatus({ message }: { message: string }) {
  return (
    <div className="private-action-status" role="status" aria-label="私域渠道操作反馈">
      {message}
    </div>
  )
}

function DefaultPrivatePage({ data, onAction }: { data: ReturnType<typeof loadPrivateChannel>; onAction: (card: PrivateChannelApiCard) => void }) {
  const navigate = useNavigate()

  function openChannel(card: PrivateChannelApiCard) {
    if (card.targetPath) {
      navigate(card.targetPath)
      return
    }
    onAction(card)
  }

  return (
    <div className="private-channel-page">
      <h1 className="sr-only-heading">私域</h1>
      <section className="private-channel-panel">
        <div className="private-section-title">
          <h2>未直连渠道</h2>
        </div>
        {data.cards.length === 0 ? (
          <section className="private-empty-state" role="status" aria-label="私域渠道空态">
            暂无符合当前条件的私域渠道，请调整筛选条件后刷新。
          </section>
        ) : (
          <div className="private-card-grid">
            {data.cards.map((card) => (
              <article key={card.id} className="private-card" aria-label={card.name}>
                <div>
                  <h3>{card.name}</h3>
                  <p>{card.description}</p>
                  <button
                    type="button"
                    className={`private-button ${card.actionCode !== 'subscribe_program' ? 'private-button--primary' : ''}`}
                    onClick={() => openChannel(card)}
                  >
                    {card.actionText}
                  </button>
                </div>
                <ChannelLogo name={card.name} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function EnterpriseDetailPage({ data, onAction }: { data: ReturnType<typeof loadPrivateChannel>; onAction: (card: PrivateChannelApiCard) => void }) {
  const navigate = useNavigate()
  const actionCard = data.cards.find((card) => card.actionCode === 'connect_wecom') ?? data.cards[0]

  return (
    <div className="private-channel-page">
      <h1 className="sr-only-heading">私域</h1>
      <section className="private-detail-panel">
        <div className="private-breadcrumb">
          <button type="button" onClick={() => navigate('/channels/private')}>
            私域
          </button>
          <span>/</span>
          <strong>渠道详情</strong>
        </div>
        <header className="private-enterprise-head">
          <ChannelLogo name="企业微信" />
          <div>
            <h2>{data.enterprise.name}</h2>
            <span>{data.enterprise.trialText}</span>
            <em>{data.enterprise.statusText}</em>
          </div>
          <button type="button" className="private-button private-button--primary" onClick={() => actionCard && onAction(actionCard)}>
            {data.enterprise.actionText}
          </button>
        </header>
        <section className="private-detail-copy">
          <h3>配置企业微信后，您可以获得</h3>
          <ol>
            {data.enterprise.benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p>{data.enterprise.description}</p>
        </section>
      </section>
    </div>
  )
}

function OfficialAuthorizationPage({ data, onAction }: { data: ReturnType<typeof loadPrivateChannel>; onAction: (card: PrivateChannelApiCard) => void }) {
  const navigate = useNavigate()
  const actionCard = data.cards.find((card) => card.actionCode === 'authorize_official') ?? data.cards[0]

  return (
    <div className="private-channel-page">
      <h1 className="sr-only-heading">私域</h1>
      <section className="private-detail-panel">
        <div className="private-breadcrumb">
          <button type="button" onClick={() => navigate('/channels/private')}>
            私域
          </button>
          <span>/</span>
          <strong>渠道详情</strong>
        </div>
        <section className="private-official-copy">
          <h2>{data.officialAccount.title}</h2>
          <p>{data.officialAccount.description}</p>
          <p>{data.officialAccount.helper}</p>
        </section>
        <div className="private-official-options">
          {data.officialAccount.options.map((option) => (
            <article key={option.id} className={option.primary ? undefined : 'is-muted'}>
              <div className="private-logo private-logo--official" aria-hidden="true">
                <span />
                <i />
              </div>
              <button
                type="button"
                className={`private-button ${option.primary ? 'private-button--primary' : ''}`}
                onClick={() => actionCard && onAction(actionCard)}
              >
                {option.label}
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function PrivatePageError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="private-channel-page">
      <section className="private-channel-panel">
        <div className="private-error-state" role="alert">
          <strong>私域渠道数据加载失败</strong>
          <p>{message}</p>
          <button type="button" className="private-button private-button--primary" onClick={onRetry}>
            重新加载
          </button>
        </div>
      </section>
    </div>
  )
}

export function PrivatePage() {
  const location = useLocation()
  const [notice, setNotice] = useState('私域渠道数据已更新')
  const [retryKey, setRetryKey] = useState(0)
  const result = useMemo(() => {
    void retryKey
    try {
      return { data: loadPrivateChannel(), error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : '私域渠道数据加载失败，请稍后重试',
      }
    }
  }, [retryKey])

  function handleAction(card: PrivateChannelApiCard) {
    if (card.actionCode === 'subscribe_program') {
      setNotice(`${card.name}订阅方案已加入开通清单`)
      return
    }

    if (card.actionCode === 'connect_wecom') {
      setNotice('企业微信配置流程已准备就绪')
      return
    }

    setNotice('公众号授权流程已准备就绪')
  }

  function retry() {
    window.localStorage.setItem('pmsPrivateChannelScenario', 'success')
    setNotice('已重新加载私域渠道')
    setRetryKey((value) => value + 1)
  }

  if (result.error || !result.data) {
    return (
      <>
        <PrivatePageError message={result.error ?? '私域渠道数据加载失败，请稍后重试'} onRetry={retry} />
        <PrivateActionStatus message={notice} />
      </>
    )
  }

  const contract = JSON.stringify(result.data.contract)

  return (
    <>
      <pre hidden data-testid="private-channel-contract">
        {contract}
      </pre>
      {location.pathname.endsWith('/setting/weComSetting') ? (
        <EnterpriseDetailPage data={result.data} onAction={handleAction} />
      ) : location.pathname.endsWith('/setting/authorizationSettings') ? (
        <OfficialAuthorizationPage data={result.data} onAction={handleAction} />
      ) : (
        <DefaultPrivatePage data={result.data} onAction={handleAction} />
      )}
      <PrivateActionStatus message={notice} />
    </>
  )
}
