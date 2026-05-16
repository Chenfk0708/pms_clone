import { useState } from 'react'
import './DistributionDisplacementPage.css'

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

export function DistributionDisplacementPage() {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <div className="distribution-displacement-page">
      <h1 className="sr-only-heading">置换权益</h1>

      <section className="distribution-displacement-overview" aria-label="置换概况">
        <div className="distribution-displacement-section-title">
          <h2>置换概况</h2>
          <button type="button" className="distribution-displacement-primary" onClick={() => setShowDialog(true)}>
            申请尾房置换
          </button>
        </div>

        <div className="distribution-displacement-summary">
          {summaryCards.map((card) => (
            <article key={card.label} className="distribution-displacement-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="distribution-displacement-detail" aria-label="置换明细">
        <div className="distribution-displacement-detail__title">
          <h2>置换明细</h2>
          <span aria-hidden="true">?</span>
        </div>

        <div className="distribution-displacement-filter" role="group" aria-label="日期筛选">
          <span>日期筛选:</span>
          <button type="button" className="is-active" aria-label="日期筛选 全部">
            全部
          </button>
          <div className="distribution-displacement-date-range" role="group" aria-label="日期范围">
            <input placeholder="开始日期" readOnly />
            <em aria-hidden="true">~</em>
            <input placeholder="结束日期" readOnly />
          </div>
        </div>

        <div className="distribution-displacement-table" aria-label="置换明细表格">
          <div className="distribution-displacement-table__head">
            {detailColumns.map((column) => (
              <div key={column}>{column}</div>
            ))}
          </div>
          <div className="distribution-displacement-table__body">
            <div className="distribution-displacement-empty">
              <span aria-hidden="true" />
              <p>暂无数据</p>
            </div>
          </div>
        </div>
      </section>

      {showDialog ? (
        <div className="distribution-displacement-modal" role="presentation">
          <div className="distribution-displacement-dialog" role="dialog" aria-modal="true" aria-label="尾房置换">
            <button
              type="button"
              className="distribution-displacement-dialog__close"
              aria-label="关闭尾房置换"
              onClick={() => setShowDialog(false)}
            >
              ×
            </button>
            <h2>尾房置换</h2>
            <div className="distribution-displacement-qr" aria-label="尾房置换二维码">
              <span />
            </div>
            <p>联系业务经理，进行尾房置换</p>
            <button type="button" className="distribution-displacement-primary" onClick={() => setShowDialog(false)}>
              我知道了
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
