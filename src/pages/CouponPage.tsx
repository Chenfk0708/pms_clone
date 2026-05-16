import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CouponPage.css'

type CouponTab = '优惠券管理' | '派发任务'

const couponColumns = [
  '名称',
  '类型',
  '优惠力度',
  '可用范围',
  '派发上限',
  '每人可领数',
  '派发时间',
  '时效类型',
  '生效时间',
  '领券条件',
  '状态',
  '操作',
]

const taskColumns = ['派发方式', '优惠券', '已派数量', '创建时间', '记录']
const shelfStatusOptions = ['已上架', '已下架']

export function CouponPage() {
  const location = useLocation()

  return location.pathname.endsWith('/edit') ? <CouponEditPage /> : <CouponListPage />
}

function CouponListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CouponTab>('优惠券管理')
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [notice, setNotice] = useState('')

  function resetFilters() {
    setStatus('')
    setIsStatusOpen(false)
    setNotice('')
  }

  return (
    <div className="coupon-page">
      <h1 className="sr-only-heading">优惠券</h1>

      <section className="coupon-card coupon-list-card" aria-label="优惠券管理">
        <div className="coupon-tabs" role="tablist" aria-label="优惠券页面">
          {(['优惠券管理', '派发任务'] as CouponTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'is-active' : ''}
              onClick={() => {
                setActiveTab(tab)
                setIsStatusOpen(false)
                setNotice('')
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === '优惠券管理' ? (
          <>
            <div className="coupon-query" aria-label="优惠券筛选">
              <label className="coupon-field">
                <span>上架状态</span>
                <button
                  type="button"
                  className="coupon-select"
                  aria-haspopup="listbox"
                  aria-expanded={isStatusOpen}
                  aria-label={`上架状态 ${status || '请选择'}`}
                  onClick={() => setIsStatusOpen((value) => !value)}
                >
                  {status || '请选择'}
                </button>
              </label>

              <div className="coupon-actions">
                <button type="button" onClick={resetFilters}>
                  重 置
                </button>
                <button type="button" className="is-primary" onClick={() => setNotice('已查询优惠券')}>
                  查 询
                </button>
              </div>
            </div>

            {isStatusOpen ? (
              <div className="coupon-options" role="listbox" aria-label="上架状态选项">
                {shelfStatusOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={status === option}
                    onClick={() => {
                      setStatus(option)
                      setIsStatusOpen(false)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="coupon-toolbar">
              <button type="button" onClick={() => setActiveTab('派发任务')}>
                派发任务
              </button>
              <button type="button" className="is-primary" onClick={() => navigate('/mallManagement/couponMgt/edit')}>
                新建
              </button>
            </div>

            {notice ? (
              <div className="coupon-notice" role="status">
                {notice}
              </div>
            ) : null}

            <CouponTable ariaLabel="优惠券列表表格" columns={couponColumns} />
          </>
        ) : (
          <>
            <div className="coupon-task-toolbar">
              <strong>全部记录</strong>
              <button type="button" className="is-primary" onClick={() => setNotice('已打开新建任务')}>
                新建任务
              </button>
            </div>

            {notice ? (
              <div className="coupon-notice" role="status">
                {notice}
              </div>
            ) : null}

            <CouponTable ariaLabel="派发任务表格" columns={taskColumns} variant="task" />
          </>
        )}
      </section>
    </div>
  )
}

function CouponEditPage() {
  const navigate = useNavigate()

  return (
    <div className="coupon-page coupon-edit-page">
      <h1 className="sr-only-heading">优惠券</h1>

      <section className="coupon-card coupon-edit-card" aria-label="优惠券表单">
        <div className="coupon-breadcrumb">优惠券列表&gt;新增</div>

        <div className="coupon-form-grid">
          <label className="coupon-form-field">
            <span>名称</span>
            <input aria-label="名称" />
          </label>

          <fieldset className="coupon-radio-row">
            <legend>类型</legend>
            <label>
              <input type="radio" name="couponType" aria-label="类型 满减券" defaultChecked />
              满减券
            </label>
          </fieldset>

          <div className="coupon-money-row">
            <span>优惠金额</span>
            <label>
              满
              <input aria-label="满额金额" />
              元，减
              <input aria-label="减免金额" />
              元
            </label>
          </div>

          <label className="coupon-form-field">
            <span>生效范围</span>
            <button type="button" className="coupon-select">
              选择商品/房型
            </button>
          </label>

          <fieldset className="coupon-radio-row">
            <legend>领券条件</legend>
            <label>
              <input type="radio" name="receiveRule" aria-label="所有人可以领" defaultChecked />
              所有人可以领
            </label>
            <label>
              <input type="radio" name="receiveRule" aria-label="仅限新用户可领取" />
              仅限新用户可领取
            </label>
            <label>
              <input type="radio" name="receiveRule" aria-label="仅限老用户可领取" />
              仅限老用户可领取
            </label>
          </fieldset>

          <fieldset className="coupon-radio-row">
            <legend>使用条件</legend>
            <label>
              <input type="radio" name="memberRule" aria-label="可以与会员折扣共用" defaultChecked />
              可以与会员折扣共用
            </label>
            <label>
              <input type="radio" name="memberRule" aria-label="不可与会员折扣共享" />
              不可与会员折扣共享
            </label>
          </fieldset>

          <label className="coupon-form-field coupon-unit-field">
            <span>派发上限</span>
            <input aria-label="派发上限" />
            <em>张</em>
          </label>

          <label className="coupon-form-field coupon-unit-field">
            <span>每人可领数</span>
            <input aria-label="每人可领数" />
            <em>张</em>
          </label>

          <label className="coupon-form-field">
            <span>派发时间</span>
            <input aria-label="派发时间" placeholder="请选择日期" />
          </label>

          <fieldset className="coupon-radio-row">
            <legend>时效类型</legend>
            <label>
              <input type="radio" name="timeMode" aria-label="有效天数" defaultChecked />
              有效天数
            </label>
            <label>
              <input type="radio" name="timeMode" aria-label="固定时间" />
              固定时间
            </label>
          </fieldset>

          <div className="coupon-money-row">
            <span>有效期</span>
            <label>
              <input aria-label="有效期天数" />
              天
            </label>
            <label>
              隔天生效
              <input aria-label="隔天生效天数" />
              天
            </label>
          </div>

          <fieldset className="coupon-radio-row coupon-unavailable-row">
            <legend>不可用时间</legend>
            <label>
              <input type="checkbox" aria-label="节假日" />
              节假日
            </label>
            <button type="button">查看默认节假日列表</button>
            <label>
              <input type="checkbox" aria-label="周末" />
              周末
            </label>
            <span>星期五-六不可使用</span>
            <label>
              <input type="checkbox" aria-label="自定义" />
              自定义
            </label>
          </fieldset>
        </div>

        <footer className="coupon-edit-footer">
          <button type="button" onClick={() => navigate('/mallManagement/couponMgt')}>
            返回列表
          </button>
          <button type="button" className="is-primary">
            提 交
          </button>
        </footer>
      </section>
    </div>
  )
}

function CouponTable({
  ariaLabel,
  columns,
  variant,
}: {
  ariaLabel: string
  columns: string[]
  variant?: 'task'
}) {
  return (
    <div className={`coupon-table${variant ? ` coupon-table--${variant}` : ''}`} role="table" aria-label={ariaLabel}>
      <div className="coupon-table__head" role="row">
        {columns.map((column) => (
          <div key={column} role="columnheader">
            {column}
          </div>
        ))}
      </div>
      <div className="coupon-empty" role="row">
        <div role="cell" aria-colspan={columns.length}>
          <span className="coupon-empty__icon" aria-hidden="true" />
          <strong>暂无数据</strong>
        </div>
      </div>
    </div>
  )
}
