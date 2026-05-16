import { useState } from 'react'
import './NotificationSettingPage.css'

const notificationRows = [
  {
    title: '订单通知',
    description: '新订单/取消订单/待接单/退款申请等提醒；',
    app: true,
    wechat: true,
  },
  {
    title: '门店预警',
    description: '渠道账号过期/渠道账号即将过期/退款失败/渠道房源关联异常/房态房价同步渠道失败/重单等提醒；',
    app: true,
    wechat: true,
  },
  {
    title: '门店动态',
    description: '人员变更/自定义设置变更/交接班等提醒',
    app: true,
    wechat: true,
  },
  {
    title: 'IM消息通知',
    description: '有新IM会话消息时，有小红点和系统弹框提醒',
    app: true,
    wechat: false,
  },
]

function Toggle({ label, initialOn = true }: { label: string; initialOn?: boolean }) {
  const [enabled, setEnabled] = useState(initialOn)

  return (
    <button
      type="button"
      className={`notification-toggle${enabled ? ' is-on' : ''}`}
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={() => setEnabled((value) => !value)}
    >
      <span />
    </button>
  )
}

function QrCode() {
  return (
    <div className="notification-qr" aria-label="路客云微信公众号二维码">
      <span />
    </div>
  )
}

export function NotificationSettingPage() {
  const [refreshed, setRefreshed] = useState(false)

  return (
    <div className="notification-setting-page">
      <h1 className="sr-only-heading">通知设置</h1>
      <section className="notification-setting-card" aria-label="通知设置">
        <header className="notification-follow">
          <QrCode />
          <div className="notification-follow__copy">
            <strong>扫码关注公众号【路客云】，快速通过微信推送订单、房态</strong>
            <a href="#wechat-official-account">查看接受微信通知公众号</a>
          </div>
        </header>

        <div className="notification-refresh">
          <button type="button" onClick={() => setRefreshed(true)}>
            我已关注？
          </button>
          <button type="button" onClick={() => setRefreshed(true)}>
            刷新一下
          </button>
          {refreshed ? <span role="status">已刷新关注状态</span> : null}
        </div>

        <div className="notification-grid" role="table" aria-label="通知设置表">
          <div className="notification-grid__head" role="row">
            <div role="columnheader" />
            <div role="columnheader">PC\APP推送</div>
            <div role="columnheader">（请先扫码关注公众号）</div>
          </div>
          {notificationRows.map((row) => (
            <div className="notification-row" role="row" key={row.title}>
              <div className="notification-row__copy" role="cell">
                <strong>{row.title}</strong>
                <p>{row.description}</p>
              </div>
              <div className="notification-row__switch" role="cell">
                {row.app ? <Toggle label={`${row.title} PC APP推送`} /> : null}
              </div>
              <div className="notification-row__switch" role="cell">
                {row.wechat ? <Toggle label={`${row.title} 微信公众号推送`} /> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
