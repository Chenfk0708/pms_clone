import { useNavigate } from 'react-router-dom'
import './CustomerAddBatchPage.css'

const assetBase = '/scrm-add-batch-assets'

const detailImages = [
  {
    src: `${assetBase}/brandPromotionScrm1136.png`,
    alt: '企微SCRM高效获客留存',
  },
  {
    src: `${assetBase}/brandPromotionScrm1136-2.png`,
    alt: '全自动留存用户',
  },
  {
    src: `${assetBase}/brandPromotionScrm1136-3.png`,
    alt: '高效沟通工具',
  },
]

export function CustomerAddBatchPage() {
  const navigate = useNavigate()

  function openSubscribeDetail() {
    navigate('/version/applicationPayment/detail', { state: { product: 'scrm' } })
  }

  return (
    <div className="customer-add-batch-page">
      <section className="customer-add-batch-shell">
        <header className="customer-add-batch-hero">
          <div className="customer-add-batch-intro">
            <img src={`${assetBase}/brandScrmLogo.png`} alt="" aria-hidden="true" />
            <div>
              <h1>企微SCRM-批量加好友</h1>
              <p>客户下单后获取到客户手机号，若该手机号未添加企业微信客户，则可下发添加好友短信，引导客户通过短信添加企业微信。</p>
            </div>
          </div>
          <div className="customer-add-batch-actions">
            <span>限时免费</span>
            <button type="button" onClick={openSubscribeDetail}>
              立即开通
            </button>
          </div>
        </header>

        <section className="customer-add-batch-detail" aria-label="商品详情">
          <h2>商品详情</h2>
          <div className="customer-add-batch-images">
            {detailImages.map((image) => (
              <img key={image.src} src={image.src} alt={image.alt} />
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}
