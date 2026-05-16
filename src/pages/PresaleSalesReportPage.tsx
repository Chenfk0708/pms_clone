import { useNavigate } from 'react-router-dom'
import './PresaleSalesReportPage.css'

interface MetricCard {
  label: string
  value: string
  children: Array<{ label: string; value: string }>
}

const metrics: MetricCard[] = [
  {
    label: '预售券总交易额：',
    value: '￥0',
    children: [
      { label: '总订单数：', value: '0' },
      { label: '总核销金额：', value: '￥0' },
      { label: '总退款金额：', value: '￥0' },
    ],
  },
  {
    label: '房券交易额：',
    value: '￥0',
    children: [
      { label: '订单数：', value: '0' },
      { label: '核销金额：', value: '￥0' },
      { label: '退款金额：', value: '￥0' },
    ],
  },
  {
    label: '门票券交易额：',
    value: '￥0',
    children: [
      { label: '订单数：', value: '0' },
      { label: '核销金额：', value: '￥0' },
      { label: '退款金额：', value: '￥0' },
    ],
  },
  {
    label: '餐饮券交易额：',
    value: '￥0',
    children: [
      { label: '订单数：', value: '0' },
      { label: '核销金额：', value: '￥0' },
      { label: '退款金额：', value: '￥0' },
    ],
  },
  {
    label: '套餐交易额：',
    value: '￥0',
    children: [
      { label: '订单数：', value: '0' },
      { label: '核销金额：', value: '￥0' },
      { label: '退款金额：', value: '￥0' },
    ],
  },
]

const legend = [
  { label: '预售券总交易额', tone: 'blue' },
  { label: '房券交易额', tone: 'violet' },
  { label: '门票券交易额', tone: 'green' },
  { label: '餐饮业券交易额', tone: 'pink' },
  { label: '套餐券交易额', tone: 'purple' },
]

export function PresaleSalesReportPage() {
  const navigate = useNavigate()

  return (
    <div className="presale-sales-report-page" aria-label="预售券销售统计">
      <section className="presale-sales-section presale-sales-kpi-section">
        <header className="presale-sales-section__header">
          <h1>经营指标</h1>
          <button type="button" className="presale-sales-link" onClick={() => navigate('/statistics/preSaleCouponMall')}>
            查看明细数据&gt;
          </button>
        </header>

        <div className="presale-sales-metrics" aria-label="预售券经营指标">
          {metrics.map((metric) => (
            <article key={metric.label} className="presale-sales-metric">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <dl>
                {metric.children.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="presale-sales-analysis-grid">
        <article className="presale-sales-section presale-sales-trend" aria-label="增长趋势分析">
          <header className="presale-sales-chart-header">
            <h2>增长趋势分析</h2>
            <div className="presale-sales-tabs" role="tablist" aria-label="增长趋势维度">
              <button type="button" className="is-active">
                交易额
              </button>
              <button type="button">订单数</button>
            </div>
            <div className="presale-sales-legend" aria-label="趋势图例">
              {legend.map((item) => (
                <span key={item.label} className={`is-${item.tone}`}>
                  {item.label}
                </span>
              ))}
            </div>
          </header>
          <EmptyChart />
        </article>

        <article className="presale-sales-section presale-sales-source" aria-label="小程序订单来源分析">
          <header className="presale-sales-chart-header">
            <h2>小程序订单来源分析</h2>
          </header>
          <EmptyChart />
        </article>
      </section>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="presale-sales-empty">
      <span aria-hidden="true" />
      <strong>暂无数据</strong>
    </div>
  )
}
