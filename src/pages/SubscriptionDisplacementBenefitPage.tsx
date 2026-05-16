import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import './SubscriptionDisplacementBenefitPage.css'

const sideLinks = [
  { label: '我的权益', path: '/version/myBenefit' },
  { label: '置换权益', path: '/version/displacementBenefit' },
  { label: '版本订阅', path: '/version/subscriptionCenter' },
  { label: '应用订阅', path: '/version/applicationPayment' },
  { label: '路客商城', path: '/version/localsMall' },
]

const detailColumns = [
  '序号',
  '订单号/渠道单号',
  '置换月份',
  '渠道',
  '房型',
  '房间',
  '联系人',
  '手机号',
  '入住状态',
  '结算状态',
  '入离日期',
  '结算日期',
  '结算金额',
  '置换金额',
]

const summaryCards = [
  { label: '待置换金额:', value: '-' },
  { label: '已置换金额:', value: '-' },
]

export function SubscriptionDisplacementBenefitPage() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <div className="subscription-displacement-page">
      <aside className="subscription-displacement-sidebar" aria-label="订阅中心侧栏">
        <div className="subscription-displacement-sidebar__root">订阅中心</div>
        <nav aria-label="权益与订阅侧栏">
          {sideLinks.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `subscription-displacement-link${isActive ? ' is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <span className="subscription-displacement-build">版本号：v4.10.7</span>
      </aside>

      <main className="subscription-displacement-main">
        <div className="subscription-displacement-content">
          <h1 className="sr-only-heading">置换权益</h1>

          <section className="subscription-displacement-overview" aria-label="置换概况">
            <div className="subscription-displacement-section-title">
              <h2>置换概况</h2>
              <button
                type="button"
                className="subscription-displacement-primary"
                onClick={() => setShowDialog(true)}
              >
                申请尾房置换
              </button>
            </div>

            <div className="subscription-displacement-summary">
              {summaryCards.map((card) => (
                <article key={card.label} className="subscription-displacement-card">
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="subscription-displacement-detail" aria-label="置换明细">
            <div className="subscription-displacement-detail__title">
              <h2>置换明细</h2>
              <span aria-hidden="true">?</span>
            </div>

            <div className="subscription-displacement-filter" role="group" aria-label="日期筛选">
              <span>日期筛选:</span>
              <button type="button" className="is-active" aria-label="日期筛选 全部">
                全部
              </button>
              <div className="subscription-displacement-date-range" role="group" aria-label="日期范围">
                <input placeholder="开始日期" readOnly />
                <em aria-hidden="true">~</em>
                <input placeholder="结束日期" readOnly />
              </div>
            </div>

            <div className="subscription-displacement-table" aria-label="置换明细表格">
              <div className="subscription-displacement-table__head">
                {detailColumns.map((column) => (
                  <div key={column}>{column}</div>
                ))}
              </div>
              <div className="subscription-displacement-table__body">
                <div className="subscription-displacement-empty">
                  <span aria-hidden="true" />
                  <p>暂无数据</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {showDialog ? (
        <div className="subscription-displacement-modal" role="presentation">
          <div className="subscription-displacement-dialog" role="dialog" aria-modal="true" aria-label="尾房置换">
            <button
              type="button"
              className="subscription-displacement-dialog__close"
              aria-label="关闭尾房置换"
              onClick={() => setShowDialog(false)}
            >
              ×
            </button>
            <h2>尾房置换</h2>
            <div className="subscription-displacement-qr" aria-label="尾房置换二维码">
              <span />
            </div>
            <p>联系业务经理，进行尾房置换</p>
            <button type="button" className="subscription-displacement-primary" onClick={() => setShowDialog(false)}>
              我知道了
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
