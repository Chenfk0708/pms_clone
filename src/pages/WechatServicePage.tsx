import { useNavigate } from 'react-router-dom'
import './WechatServicePage.css'

const productImages = [
  {
    src: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandPromotionScrm1136.png',
    alt: '企微SCRM高效获客留存',
  },
  {
    src: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandPromotionScrm1136-2.png',
    alt: '微信客服高效沟通工具',
  },
  {
    src: 'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandPromotionScrm1136-3.png',
    alt: '微信客服小程序接入流程',
  },
]

export function WechatServicePage() {
  const navigate = useNavigate()

  return (
    <div className="wechat-service-page" data-testid="wechat-service-page">
      <h1 className="sr-only-heading">微信客服</h1>

      <section className="wechat-service-panel">
        <header className="wechat-service-hero">
          <img
            src="https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/brandScrmLogo.png"
            alt=""
            className="wechat-service-hero__logo"
          />
          <div className="wechat-service-hero__copy">
            <h2>企微SCRM-微信客服</h2>
            <p>利用企业微信能力，嵌入品牌小程序，客户在品牌小程序订购过程中可随时发起咨询，咨询信息直通路客云IM。</p>
          </div>
          <div className="wechat-service-hero__action">
            <button type="button" onClick={() => navigate('/version/applicationPayment/detail', { state: { product: 'scrm' } })}>
              立即开通
            </button>
            <span>限时免费</span>
          </div>
        </header>

        <section className="wechat-service-detail" aria-label="商品详情">
          <h2>商品详情</h2>
          <div className="wechat-service-visual">
            {productImages.map((image) => (
              <img key={image.src} src={image.src} alt={image.alt} />
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
