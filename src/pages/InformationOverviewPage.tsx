import { useLocation } from 'react-router-dom'
import {
  informationFlowItems,
  informationRadarMetrics,
  informationSummaryTags,
} from '../data/discovery'
import { CompanyInfoPage } from './CompanyInfoPage'
import './InformationOverviewPage.css'

const flowIconGroups: Record<string, Array<{ label: string; tone: string }>> = {
  OTA流量: [
    { label: '途', tone: 'orange' },
    { label: '美团', tone: 'gold' },
    { label: '猪', tone: 'pink' },
    { label: '携', tone: 'blue' },
    { label: '美团', tone: 'yellow' },
    { label: '飞', tone: 'rainbow' },
    { label: '木鸟', tone: 'red' },
    { label: '爱', tone: 'gray' },
    { label: 'B.', tone: 'muted' },
    { label: 'T', tone: 'muted-dark' },
    { label: 'C', tone: 'muted' },
    { label: '贝', tone: 'muted' },
  ],
  社媒流量: [
    { label: '小红书', tone: 'muted' },
    { label: '抖', tone: 'muted-dark' },
    { label: '视频号', tone: 'muted-light' },
  ],
  私域流量: [{ label: '小', tone: 'green' }],
}

function buildRadarPoints(values: number[]) {
  const center = 120
  const radius = 88

  return values
    .map((value, index) => {
      const angle = (-90 + index * 72) * (Math.PI / 180)
      const currentRadius = (radius * value) / 100
      const x = center + Math.cos(angle) * currentRadius
      const y = center + Math.sin(angle) * currentRadius
      return `${x},${y}`
    })
    .join(' ')
}

export function InformationOverviewPage() {
  const location = useLocation()
  if (location.pathname === '/InformationMaintenance/companyInfo') {
    return <CompanyInfoPage />
  }

  const radarPoints = buildRadarPoints(informationRadarMetrics.map((item) => item.value))

  return (
    <div className="settings-page information-overview-page">
      <div className="information-overview-main">
        <section className="settings-summary">
          <div className="settings-summary__main">
            <div className="settings-summary__row">
              <span className="settings-summary__label">门店：</span>
              <strong className="settings-store-select">
                天落会宿公寓(前海壹方城宝安中心店)<span aria-hidden="true">⌄</span>
              </strong>
              <span className="summary-chip summary-chip--outline">数字化能力</span>
              {informationSummaryTags.map((tag) => (
                <span key={tag.label} className={`summary-chip summary-chip--${tag.tone ?? 'blue'}`}>
                  {tag.label}
                </span>
              ))}
              <span className="settings-summary__status">
                <i aria-hidden="true" />
                已上架 | 修改 &gt;
              </span>
            </div>
            <div className="settings-summary__meta">
              <span>◎ 地址：深圳宝安区新安街道海裕社区N15幸福海岸花园10栋30楼, 中国</span>
              <span>♧ 联系电话：+86-18123941382</span>
            </div>
          </div>
        </section>

        <section className="settings-panel information-overview-store">
          <div className="settings-panel__header">
            <div className="settings-panel__title">
              <h2>门店信息</h2>
              <span>信息完善度</span>
              <em>中等</em>
            </div>
            <button type="button">一键导入</button>
          </div>

          <div className="settings-panel__body">
            <div className="radar-panel">
              <svg viewBox="0 0 240 240" className="radar-chart" aria-hidden="true">
                <polygon points="120,32 203,92 172,188 68,188 37,92" />
                <polygon points="120,54 184,101 160,174 80,174 56,101" />
                <polygon points="120,78 165,111 148,159 92,159 75,111" />
                <polygon points="120,102 146,120 136,145 104,145 94,120" />
                <polygon points={radarPoints} className="radar-chart__shape" />
              </svg>
              <div className="radar-labels">
                {informationRadarMetrics.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>

            <div className="settings-copy">
              <h3>建议：</h3>
              <p>
                1. 建议补齐资质信息，全渠道通用，并可快捷提交路客云进行一键开户；
                <a href="/">去完善</a>
              </p>
              <p>
                2. 完善门店详细介绍有利于用户深度了解门店服务能力；
                <a href="/">去完善</a>
              </p>
            </div>
          </div>
        </section>

        <section className="settings-panel information-overview-traffic">
          <div className="settings-panel__header">
            <div className="settings-panel__title">
              <h2>门店流量</h2>
              <span>流量获取能力</span>
              <em className="is-good">较好</em>
            </div>
            <button type="button">一键新增</button>
          </div>

          <div className="settings-flow">
            <div className="settings-flow__groups">
              {informationFlowItems.map((item) => (
                <div key={item.name} className="flow-row">
                  <strong>
                    {item.name}<span>（{item.detail}）</span>
                  </strong>
                  <div className="flow-icons">
                    {(flowIconGroups[item.name] ?? []).map((icon, index) => (
                      <i key={`${item.name}-${index}`} className={`flow-icon flow-icon--${icon.tone}`}>
                        {icon.label}
                      </i>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="settings-copy">
              <h3>建议：</h3>
              <p>1. 小红书和抖音渠道暂未开通，渠道每天上亿流量，搭载图文和视频，能够快速吸引用户，促成下单；</p>
            </div>
          </div>
        </section>
      </div>

      <aside className="phone-preview" aria-label="数字化门店预览">
        <header>数字化门店</header>
        <div className="phone-preview__device">
          <div className="phone-preview__chrome">
            <span>••</span>
            <span>⊙</span>
          </div>
          <div className="phone-preview__status">
            <span>LOCALS</span>
            <small>路 客 云</small>
          </div>
          <div className="phone-preview__search">
            <span>输入关键词搜索</span>
            <em>◎ 全国</em>
          </div>
          <div className="phone-preview__datebar">
            <div>
              <span>周三入住</span>
              <strong>09月14日</strong>
            </div>
            <small>共1晚</small>
            <div>
              <span>周四退房</span>
              <strong>09月15日</strong>
            </div>
          </div>
          <button className="phone-preview__search-button" type="button">搜索</button>
          <div className="phone-preview__section-title">
            <strong>热门套餐</strong>
            <span>查看更多 &gt;</span>
          </div>
          <div className="phone-preview__package" />
          <div className="phone-preview__section-title">
            <strong>品牌门店</strong>
            <span>查看更多 &gt;</span>
          </div>
          <article className="phone-preview__store">
            <div />
            <p>深圳宝安区新安街道海裕社区N15幸福海岸花园10栋30楼, 中国</p>
            <strong>天落会宿公寓(前海壹方城宝安中心店)</strong>
            <span>￥9999/晚起</span>
            <button type="button">查看详情</button>
          </article>
          <div className="phone-preview__section-title">
            <strong>精选房源</strong>
            <span>查看更多 &gt;</span>
          </div>
          <div className="phone-preview__rooms">
            {['顶层套房（浴缸巨幕电竞麻将）', '总裁套间（桑拿浴缸露台电竞麻将）', '天落大床电竞套间', '观影大床房'].map(
              (room) => (
                <article key={room}>
                  <div />
                  <span>2房1厅·可住5人·3床</span>
                  <strong>{room}</strong>
                  <em>¥9999/晚起</em>
                  <button type="button">立即预订</button>
                </article>
              ),
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
