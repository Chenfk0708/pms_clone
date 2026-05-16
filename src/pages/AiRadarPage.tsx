import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const hotelTabs = ['UP智谷店', '广州市海珠...', '广州市天河...']
const channelTabs = ['携程', '美团']

const rankingRows = [
  '银丰颐美酒店(济南融创文旅城唐冶店)',
  '沃德Smart酒店(山东建筑大学雪山万达广场店)',
  '上海张江Citigo欢阁酒店',
  '上海衡山花园酒店',
  '上海衡山花园酒店',
  '上海衡山花园酒店',
  '上海世博木棉花凯悦臻选酒店',
]

const insightTags = ['多渠道聚合', 'AI预警', '风险监测', '全局决策']

export function AiRadarPage() {
  const [activeChannel, setActiveChannel] = useState(channelTabs[0])
  const navigate = useNavigate()

  return (
    <div className="radar-page">
      <h1 className="sr-only-heading">全域数据</h1>
      <section className="radar-tabs" aria-label="门店切换">
        {hotelTabs.map((tab, index) => (
          <button key={tab} type="button" className={index === 0 ? 'is-active' : ''}>
            {tab}
          </button>
        ))}
      </section>

      <section className="radar-card" aria-label="服务质量分">
        <div className="radar-card__header">
          <h2>服务质量分</h2>
          <span>更新于 03-01 10:00</span>
        </div>

        <div className="radar-card__body">
          <div className="radar-score-panel">
            <div className="segmented" aria-label="渠道切换">
              {channelTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeChannel === tab ? 'is-active' : ''}
                  onClick={() => setActiveChannel(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="radar-score-grid">
              <div className="radar-ring">
                <div className="radar-ring__inner">
                  <strong>{activeChannel === '携程' ? '5.42' : '5.18'}</strong>
                  <span>PSI总分</span>
                </div>
              </div>

              <div className="radar-metric">
                <span>基础分</span>
                <strong>4.62 <em>/5.0</em></strong>
                <div className="radar-bar">
                  <i style={{ width: '82%' }} />
                </div>
              </div>

              <div className="radar-metric">
                <span>奖励分</span>
                <strong className="is-green">+0.80 <em>/0.95</em></strong>
                <div className="radar-bar radar-bar--green">
                  <i style={{ width: '84%' }} />
                </div>
              </div>

              <div className="radar-metric">
                <span>减分项</span>
                <strong className="is-red">-0.00</strong>
                <div className="radar-bar radar-bar--red">
                  <i style={{ width: '4%' }} />
                </div>
              </div>
            </div>
          </div>

          <aside className="radar-ranking">
            <h3>酒店竞争圈排名</h3>
            <ol>
              {rankingRows.map((row, index) => (
                <li key={`${index + 1}-${row}`}>
                  <span className={`rank-badge rank-${Math.min(index + 1, 3)}`}>{index + 1}</span>
                  <span>{row}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section className="radar-banner">
        <div>
          <h3>聚合多渠道经营数据，AI预警竞对动态与异常风险，告别多后台切换，一屏掌控全局，决策快人一步。</h3>
          <p>{insightTags.join(' ｜ ')}</p>
        </div>
        <button type="button" onClick={() => navigate('/version/applicationPayment/detail')}>
          立即开通
        </button>
      </section>
    </div>
  )
}
