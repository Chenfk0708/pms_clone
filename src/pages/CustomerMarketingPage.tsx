import './CustomerMarketingPage.css'

export function CustomerMarketingPage() {
  return (
    <div className="customer-marketing-page">
      <h1 className="sr-only-heading">客户营销</h1>
      <section className="customer-marketing-advisor" aria-label="客户营销顾问引导">
        <div className="customer-marketing-advisor__inner">
          <img
            className="customer-marketing-advisor__hero"
            src="/assets/scrm-customer-marketing/customer-marketing-hero.png"
            alt="客户营销顾问引导图"
          />
          <div className="customer-marketing-advisor__contact">
            <img
              className="customer-marketing-advisor__qrcode"
              src="/assets/scrm-customer-marketing/scrm-advisor-qrcode.png"
              alt="路客云SCRM顾问二维码"
            />
            <div className="customer-marketing-advisor__copy">
              <strong>路客云SCRM顾问</strong>
              <span>请扫码添加路客云SCRM顾问</span>
              <span>我们将随时解答你的疑问</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
