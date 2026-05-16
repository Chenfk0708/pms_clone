import './ScrmGeneralPage.css'

const assetCards = [
  { label: '客户数', value: '588', tone: 'blue' },
  { label: '粉丝总数', value: '敬请期待', tone: 'orange' },
  { label: '会员总数', value: '275', tone: 'gold' },
  { label: '添加企微人数', value: '前往设置', tone: 'green', action: true },
]

const trendSeries = [
  { label: '客户数', tone: 'orange' },
  { label: '会员数', tone: 'green' },
  { label: '添加企微人数', tone: 'blue' },
]

const trendDates = ['05/23', '05/30', '06/06', '06/14']

const recommendationScenes = [
  {
    title: '智能入住接入企业微信',
    description: '通过企业微信接待渠道客户入住，实现私域客户沉淀',
    tone: 'green',
  },
  {
    title: '聊天工具栏',
    description: '可配置企微的工具栏，在对话中营销，实现高效沟通与转化',
    tone: 'blue',
  },
  {
    title: '品牌小程序接入微信客服',
    description: '极大提升私域客户的咨询体验，提升客服的回复能力',
    tone: 'purple',
  },
  {
    title: '会员成长体系',
    description: '通过会员权益搭配会员等级，实现会员复购经济',
    tone: 'gold',
  },
]

export function ScrmGeneralPage() {
  return (
    <div className="scrm-page scrm-page--general">
      <section className="scrm-auth-alert" aria-label="企业微信授权提醒">
        <span className="scrm-auth-alert__icon" aria-hidden="true" />
        <span>企业微信未授权，可能导致部分功能无法使用，请尽快前往授权。</span>
        <button type="button">前往企业微信授权</button>
        <button type="button">知道了</button>
      </section>

      <section className="scrm-section" aria-label="客户资产盘点">
        <h2>客户资产盘点</h2>
        <div className="scrm-asset-grid">
          {assetCards.map((card) => (
            <article key={card.label} className="scrm-asset-card">
              <span className={`scrm-asset-card__icon tone-${card.tone}`} aria-hidden="true" />
              <div>
                <span className="scrm-asset-card__label">{card.label}</span>
                <strong className={card.action ? 'is-link' : undefined}>{card.value}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="scrm-section scrm-section--trend" aria-label="客户增长趋势图">
        <h2>客户增长趋势图</h2>
        <div className="scrm-trend-toolbar">
          <div className="scrm-date-range" aria-label="客户增长趋势日期范围">
            <input aria-label="开始日期" placeholder="开始日期" value="2026/05/14" readOnly />
            <span aria-hidden="true" />
            <input aria-label="结束日期" placeholder="结束日期" value="2026/06/14" readOnly />
            <i aria-hidden="true" />
          </div>
          <div className="scrm-trend-legend">
            {trendSeries.map((series) => (
              <span key={series.label}>
                <i className={`tone-${series.tone}`} aria-hidden="true" />
                {series.label}
              </span>
            ))}
          </div>
        </div>
        <div className="scrm-mini-charts">
          {trendSeries.map((series) => (
            <article key={series.label} className={`scrm-mini-chart tone-${series.tone}`}>
              <div className="scrm-mini-chart__plot" aria-hidden="true">
                <span />
              </div>
              <div className="scrm-mini-chart__axis">
                {trendDates.map((date) => (
                  <strong key={`${series.label}-${date}`}>{date}</strong>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="scrm-section scrm-section--scenes" aria-label="推荐场景">
        <h2>推荐场景</h2>
        <div className="scrm-scene-grid">
          {recommendationScenes.map((scene) => (
            <article key={scene.title} className="scrm-scene-card">
              <span className={`scrm-scene-card__icon tone-${scene.tone}`} aria-hidden="true" />
              <strong>{scene.title}</strong>
              <p>{scene.description}</p>
              <button type="button">立即体验</button>
            </article>
          ))}
        </div>
      </section>

      <section className="scrm-release-banner" aria-label="SCRM新版上线">
        <strong>路客云SCRM全新上线：私域留存转化和企微深度融合</strong>
      </section>
    </div>
  )
}
