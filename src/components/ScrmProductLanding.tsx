import './ScrmProductLanding.css'

type ScrmProductLandingProps = {
  mode: 'waiting' | 'detail'
  title: string
  subtitle: string
  detailTitle?: string
  detailDescription?: string
  buttonText?: string
  badgeText?: string
  qrTitle?: string
  qrLines?: string[]
}

export function ScrmProductLanding({
  mode,
  title,
  subtitle,
  detailTitle = '商品详情',
  detailDescription,
  buttonText = '立即开通',
  badgeText = '限时免费',
  qrTitle = '路客云SCRM顾问',
  qrLines = ['请扫码添加路客云SCRM顾问', '我们将随时解答你的疑问'],
}: ScrmProductLandingProps) {
  if (mode === 'waiting') {
    return (
      <section className="scrm-product-page scrm-product-page--waiting" aria-label={title}>
        <div className="scrm-product-waiting-hero">
          <div className="scrm-product-waiting-sign">
            <span>敬请期待</span>
            <i>coming soon~</i>
          </div>
        </div>

        <div className="scrm-product-qr">
          <div className="scrm-product-qr__code" aria-hidden="true">
            <div className="scrm-product-qr__code-inner" />
          </div>
          <div className="scrm-product-qr__content">
            <strong>{qrTitle}</strong>
            {qrLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <button type="button" className="scrm-product-float-chat" aria-label="联系客服">
          <span />
        </button>
      </section>
    )
  }

  return (
    <section className="scrm-product-page" aria-label={title}>
      <header className="scrm-product-header">
        <div className="scrm-product-header__icon" aria-hidden="true">
          <span />
        </div>
        <div className="scrm-product-header__content">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <div className="scrm-product-header__actions">
          <span className="scrm-product-badge">{badgeText}</span>
          <button type="button" className="scrm-product-open-button">
            {buttonText}
          </button>
        </div>
      </header>

      <section className="scrm-product-detail">
        <h2>{detailTitle}</h2>
        {detailDescription ? <p className="scrm-product-detail__desc">{detailDescription}</p> : null}

        <div className="scrm-product-poster">
          <div className="scrm-product-poster__copy">
            <strong>企微SCRM</strong>
            <strong>高效获客留存</strong>
            <ul>
              <li>通过企微的高效工具完成客户的获客</li>
              <li>沟通、转化、复购</li>
            </ul>
          </div>

          <div className="scrm-product-poster__center" aria-hidden="true">
            <span />
          </div>

          <div className="scrm-product-poster__panel" aria-hidden="true">
            <div className="scrm-product-poster__panel-list">
              {Array.from({ length: 7 }).map((_, index) => (
                <div key={index} className="scrm-product-poster__row">
                  <span />
                  <div>
                    <i />
                    <b />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <button type="button" className="scrm-product-float-chat" aria-label="联系客服">
        <span />
      </button>
    </section>
  )
}
