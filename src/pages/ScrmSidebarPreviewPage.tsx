import { useNavigate } from 'react-router-dom'
import './ScrmSidebarPreviewPage.css'

const productImages = [
  'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandPromotionScrm1136.png',
  'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandPromotionScrm1136-2.png',
  'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandPromotionScrm1136-3.png',
]

export function ScrmSidebarPreviewPage() {
  const navigate = useNavigate()

  return (
    <div className="scrm-sidebar-page">
      <section className="scrm-sidebar-card" aria-label="企微SCRM-聊天工具栏">
        <header className="scrm-sidebar-card__intro">
          <div className="scrm-sidebar-card__copy">
            <img
              src="https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandScrmLogo.png"
              alt=""
            />
            <div>
              <h1>企微SCRM-聊天工具栏</h1>
              <p>
                聊天工具栏可实时查看客户资料、偏好与历史订单，快捷选择聊天库中话术进行回复，查看房态一键续住，并且可结合品牌小程序发送优惠券引导用户复购；
              </p>
            </div>
          </div>
          <div className="scrm-sidebar-card__action">
            <button type="button" onClick={() => navigate('/version/applicationPayment/detail', { state: { product: 'scrm' } })}>
              立即开通
            </button>
            <span>限时免费</span>
          </div>
        </header>

        <section className="scrm-sidebar-card__content" aria-label="商品详情">
          <h2>商品详情</h2>
          <div className="scrm-sidebar-card__images">
            {productImages.map((src, index) => (
              <img key={src} src={src} alt={`企微SCRM商品详情 ${index + 1}`} />
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
