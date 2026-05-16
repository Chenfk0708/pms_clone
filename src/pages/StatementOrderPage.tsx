import { useState } from 'react'
import './StatementOrderPage.css'

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']

const columns = [
  '订单号',
  '客户信息',
  '产品类型',
  '产品名称',
  '预订时间',
  '渠道',
  '应付金额',
  '实付金额',
  '优惠金额',
  '退款金额',
  '支付手续费',
  '平台服务费',
  '全员分销佣金',
  '支付方式',
  '结算金额',
]

export function StatementOrderPage() {
  const [activeStore, setActiveStore] = useState(stores[0])
  const [notice, setNotice] = useState('')

  function resetFilters() {
    setActiveStore(stores[0])
    setNotice('')
  }

  return (
    <div className="statement-order-page">
      <h1 className="sr-only-heading">品牌小程序订单</h1>

      <section className="statement-order-toolbar" aria-label="品牌小程序订单筛选">
        <div className="statement-order-store" role="group" aria-label="门店">
          {stores.map((store) => (
            <button
              key={store}
              type="button"
              aria-pressed={activeStore === store}
              className={activeStore === store ? 'is-active' : ''}
              onClick={() => {
                setActiveStore(store)
                setNotice('')
              }}
            >
              {store}
            </button>
          ))}
        </div>

        <div className="statement-order-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={() => setNotice('已按当前门店查询品牌小程序订单')}>
            查 询
          </button>
          <button type="button" className="is-outline" onClick={() => setNotice('已生成品牌小程序订单导出任务')}>
            导出明细
          </button>
        </div>
      </section>

      {notice ? (
        <div className="statement-order-notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="statement-order-table-shell" aria-label="品牌小程序订单表格">
        <div className="statement-order-table-scroll">
          <table className="statement-order-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="statement-order-empty-row">
                <td colSpan={columns.length}>
                  <div className="statement-order-empty">
                    <span aria-hidden="true" />
                    <p>暂无数据</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
