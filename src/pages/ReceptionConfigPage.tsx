import { useNavigate } from 'react-router-dom'
import './ReceptionConfigPage.css'

const detailImages = [
  '/scrm-reception/brand-promotion-scrm-1.png',
  '/scrm-reception/brand-promotion-scrm-2.png',
  '/scrm-reception/brand-promotion-scrm-3.png',
]

export function ReceptionConfigPage() {
  const navigate = useNavigate()

  return (
    <div className="reception-config-page">
      <section className="reception-config-panel" aria-label="企微SCRM接待配置未开通态">
        <header className="reception-config-hero">
          <div className="reception-config-hero__info">
            <img src="/scrm-reception/brand-scrm-logo.png" alt="" aria-hidden="true" />
            <div>
              <h2>企微SCRM-接待配置</h2>
              <p>配置企业微信接待员工、客户备注与欢迎语等，与微信客服能力配合完成客户进线后的接待体验。</p>
            </div>
          </div>
          <div className="reception-config-action">
            <span>限时免费</span>
            <button type="button" onClick={() => navigate('/version/applicationPayment/detail', { state: { product: 'scrm' } })}>
              立即开通
            </button>
          </div>
        </header>

        <section className="reception-config-detail" aria-label="商品详情">
          <h2>商品详情</h2>
          <div className="reception-config-detail__images">
            {detailImages.map((src, index) => (
              <img key={src} src={src} alt={`企微SCRM接待配置商品详情 ${index + 1}`} />
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
