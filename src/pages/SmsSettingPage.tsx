import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SmsSettingPage.css'

interface SmsTemplate {
  title: string
  content: string
}

interface SmsSection {
  title: string
  description: string
  action?: 'smartSetting'
  templates: SmsTemplate[]
}

const smsSections: SmsSection[] = [
  {
    title: '订单状态通知',
    description: '订单状态变更时，系统自动通知房客',
    templates: [
      {
        title: '预订提醒',
        content: '【路客云】预订成功：{房源名称} {房间数量}间，{入住时间}入住，{间夜数}晚。',
      },
      {
        title: '订单取消',
        content: '【路客云】预订取消：您预订的{房源名称} {房间数量}间 已取消预订。',
      },
      {
        title: '入住提醒',
        content: '【路客云】您订购的{房源名称}，将于明天入住。',
      },
    ],
  },
  {
    title: '长租订单费用提醒',
    description: '用于长租账单提醒，提前告知租客应付账款',
    templates: [
      {
        title: '长租催收短信',
        content:
          '【路客云】【路客云】尊敬的${房型名称}房间${房间名称}租客${姓名}您好！您本周期${缴费开始时间}至${缴费结束时间}房租费合计:${应收金额}，包含租金:${租金费}，押金费:${押金费}，其他费用:${其他费用}，逾期费:${逾期费用} ，缴费时间:${应收时间}，请及时缴纳，联系电话:${房东手机号}，感谢您的支持与配合',
      },
      {
        title: '每月租金提醒',
        content:
          '【路客云】【路客云】您的长租订单${订单}有1笔账单${开始时间}至${结束时间}需要催收，租客姓名:${租客姓名}，租金:${租金}，应收金额:${应收金额}，点击 zt81.cn/${链接} 查看账单详情； 查看账单详情；',
      },
    ],
  },
  {
    title: '商城订单提醒',
    description: '商城下单、支付等状态变更时，系统自动通知房客',
    templates: [
      {
        title: '商城商品购买',
        content: '【路客云】您已成功购买{卡券名称} {卡券数量}个，有效期至{失效时间}。',
      },
      {
        title: '商城商品过期',
        content: '【路客云】临期提醒：您购买的{卡券名称}还有{距离多少天失效}天失效。',
      },
    ],
  },
  {
    title: '自助入住短信',
    description: '引导客人完成实名登记与智能入住办理',
    action: 'smartSetting',
    templates: [
      {
        title: '获得密码（智能入住）',
        content: '【路客云】您入住的房间 {房源名称} ${房间号}，门锁密码：{密码}#;点击 minsubao.net/{小程序跳转短链接} 查看入住指引',
      },
      {
        title: '实名登记（智能入住）',
        content: '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 登记入住，获取门锁密码。',
      },
      {
        title: '智住发送入住登记短信(微信公众号)',
        content: '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 关注微信公众号进行登记入住，获取门锁密码。',
      },
      {
        title: '智住发送入住登记短信(企微)',
        content: '【路客云】您预订的房间可智能入住，点击 minsubao.net/{小程序跳转短链接} 添加企微，进行登记入住，获取入住指引与门锁密码。',
      },
    ],
  },
  {
    title: '门锁密码通知',
    description: '用于发送或更新门锁密码，提醒房客安全入住',
    templates: [
      {
        title: '门锁临时密码',
        content: '【路客云】{名称} 开锁密码：{密码}# 有效期：{生效时间}至{失效时间}',
      },
      {
        title: '获得密码（非智住）',
        content: '【路客云】您入住的房间 {房源名称} {房间名称}，门锁密码：{密码}#',
      },
      {
        title: '门锁临时密码超时提示',
        content: '【路客云】请在有效期开始后24小时内开锁激活密码，否则密码将失效。',
      },
    ],
  },
  {
    title: '其他短信通知',
    description: '未归类到以上模块的其他短信模板',
    templates: [
      {
        title: '企微批量加好友',
        content: '【路客云】【路客云】回馈新老用户，不定期推出优惠活动，点击 wxaurl.cn/{小程序跳转短链接} 添加企微获取最新优惠信息，拒收请回复R',
      },
    ],
  },
]

const rechargePlans = [
  { count: '100条', price: '0.08元/条', total: '¥8' },
  { count: '1000条', price: '0.07元/条', total: '¥70' },
  { count: '15000条', price: '0.05元/条', total: '¥750' },
  { count: '500条', price: '0.07元/条', total: '¥35' },
  { count: '2000条', price: '0.07元/条', total: '¥140' },
  { count: '5000条', price: '0.06元/条', total: '¥300' },
]

export function SmsSettingPage() {
  const [rechargeOpen, setRechargeOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="sms-setting-page">
      <section className="sms-setting-panel" aria-label="短信设置">
        <header className="sms-setting-balance">
          <div className="sms-setting-balance__count">
            <span>剩余短信：</span>
            <strong>50</strong>
          </div>
          <div className="sms-setting-balance__actions">
            <button type="button" className="sms-setting-primary" onClick={() => setRechargeOpen(true)}>
              充 值
            </button>
            <button type="button" className="sms-setting-secondary">
              充值记录
            </button>
          </div>
        </header>

        <p className="sms-setting-intro">启用短信推送模版后，系统将在预设条件下自动向客人发送短信通知</p>

        <div className="sms-setting-meta">
          <div>
            <span>启用渠道:</span>
            <button type="button">修改</button>
          </div>
          <div>
            <span>签名：</span>
            <em>【路客云】</em>
            <button type="button">修改</button>
          </div>
        </div>

        <div className="sms-setting-section-list">
          {smsSections.map((section) => (
            <SmsTemplateSection
              key={section.title}
              section={section}
              onSmartSetting={() => navigate('/smartHotel/checkInGuide')}
            />
          ))}
        </div>
      </section>

      {rechargeOpen ? <RechargeDialog onClose={() => setRechargeOpen(false)} /> : null}
    </div>
  )
}

function SmsTemplateSection({
  section,
  onSmartSetting,
}: {
  section: SmsSection
  onSmartSetting: () => void
}) {
  return (
    <section className="sms-template-card" aria-label={section.title}>
      <header className="sms-template-card__header">
        <span className="sms-template-card__icon" aria-hidden="true" />
        <div>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
          {section.action === 'smartSetting' ? (
            <button type="button" className="sms-setting-link-button" onClick={onSmartSetting}>
              去设置
            </button>
          ) : null}
        </div>
      </header>

      <div className="sms-template-card__body">
        {section.templates.map((template) => (
          <article className="sms-template-row" key={template.title}>
            <div className="sms-template-row__title">
              <span className="sms-template-row__dot" aria-hidden="true" />
              <strong>{template.title}</strong>
            </div>
            <p>{template.content}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function RechargeDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="sms-recharge-backdrop">
      <section className="sms-recharge-dialog" role="dialog" aria-modal="true" aria-label="短信充值">
        <header>
          <h2>短信充值</h2>
          <button type="button" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="sms-recharge-grid">
          {rechargePlans.map((plan) => (
            <button type="button" className="sms-recharge-plan" key={plan.count}>
              <strong>{plan.count}</strong>
              <span>{plan.price}</span>
              <em>{plan.total}</em>
            </button>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="sms-setting-primary" onClick={onClose}>
            充 值
          </button>
        </footer>
      </section>
    </div>
  )
}
