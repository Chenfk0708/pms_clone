import { ScrmProductLanding } from '../components/ScrmProductLanding'

export function CustomerMarketingPage() {
  return (
    <ScrmProductLanding
      mode="waiting"
      title="客户营销"
      subtitle="敬请期待"
      qrTitle="路客云SCRM顾问"
      qrLines={['请扫码添加路客云SCRM顾问', '我们将随时解答你的疑问']}
    />
  )
}
