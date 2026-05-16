import { useNavigate } from 'react-router-dom'
import './GlobalSettingPage.css'

const previewImage =
  'https://locals-house-prod.oss-cn-shenzhen.aliyuncs.com//localhomeqy/globalRadargoToPurchaseBg.png'

export function GlobalSettingPage() {
  const navigate = useNavigate()

  return (
    <div className="global-setting-page">
      <section className="global-setting-mask" aria-label="AI全域雷达配置中心未开通态">
        <img className="global-setting-preview" src={previewImage} alt="全域雷达配置中心未开通预览" />
        <div className="global-setting-purchase">
          <h1>聚合多渠道经营数据，AI预警竞对动态与异常风险，告别多后台切换，一屏掌控全局，决策快人一步。</h1>
          <p>多渠道聚合 ｜ AI预警 ｜ 风险监测 ｜ 全局决策</p>
          <button type="button" onClick={() => navigate('/version/applicationPayment/detail?app=globalRadar')}>
            立即开通
          </button>
        </div>
      </section>
    </div>
  )
}
