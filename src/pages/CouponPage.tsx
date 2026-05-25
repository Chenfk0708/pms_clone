import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  defaultCouponFilters,
  fetchCouponList,
  fetchCouponTasks,
  type CouponListFilters,
  type CouponRow,
  type CouponShelfStatus,
  type CouponTaskRow,
  type CouponViewModel,
} from '../services/coupon'
import './CouponPage.css'

type CouponTab = '优惠券管理' | '派发任务'
type DialogState =
  | { type: 'coupon-detail'; coupon: CouponRow }
  | { type: 'task-create' }
  | { type: 'product-picker' }
  | { type: 'holidays' }
  | null

type CouponType = '满减券'
type ReceiveRule = 'all' | 'new' | 'old'
type MemberRule = 'shared' | 'exclusive'
type TimeMode = 'days' | 'fixed'

type CouponFormState = {
  name: string
  type: CouponType
  fullAmount: string
  minusAmount: string
  scopeText: string
  receiveRule: ReceiveRule
  memberRule: MemberRule
  sendLimit: string
  perUserLimit: string
  sendDateStart: string
  sendDateEnd: string
  timeMode: TimeMode
  validDays: string
  delayDays: string
  fixedDateStart: string
  fixedDateEnd: string
  disabledHoliday: boolean
  disabledWeekend: boolean
  disabledCustom: boolean
}

const couponColumns = ['', '优惠力度', '可用范围', '派发上限', '每人可领数', '派发时间', '时效类型', '生效时间', '操作']
const taskColumns = ['派发方式', '优惠券', '已派数量', '创建时间', '记录']

const shelfStatusOptions: Array<{ label: string; value: CouponShelfStatus }> = [
  { label: '请选择', value: 'all' },
  { label: '已上架', value: 'enabled' },
  { label: '已下架', value: 'disabled' },
]

const defaultCouponForm: CouponFormState = {
  name: '',
  type: '满减券',
  fullAmount: '0',
  minusAmount: '0',
  scopeText: '选择商品/房型',
  receiveRule: 'all',
  memberRule: 'shared',
  sendLimit: '0',
  perUserLimit: '0',
  sendDateStart: '',
  sendDateEnd: '',
  timeMode: 'days',
  validDays: '0',
  delayDays: '0',
  fixedDateStart: '',
  fixedDateEnd: '',
  disabledHoliday: false,
  disabledWeekend: false,
  disabledCustom: false,
}

export function CouponPage() {
  const location = useLocation()
  return location.pathname.endsWith('/edit') ? <CouponEditPage /> : <CouponListPage />
}

function CouponListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CouponTab>('优惠券管理')
  const [draftStatus, setDraftStatus] = useState<CouponShelfStatus>('all')
  const [filters, setFilters] = useState<CouponListFilters>(defaultCouponFilters)
  const [taskPage] = useState(1)
  const [listState, setListState] = useState<LoadState<CouponViewModel<CouponRow>>>({ status: 'loading' })
  const [taskState, setTaskState] = useState<LoadState<CouponViewModel<CouponTaskRow>>>({ status: 'loading' })
  const [dialog, setDialog] = useState<DialogState>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetchCouponList(filters, controller.signal)
      .then((data) => setListState({ status: 'success', data }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return
        setListState({ status: 'error', message: error.message || '优惠券数据加载失败' })
      })
    return () => controller.abort()
  }, [filters])

  useEffect(() => {
    const controller = new AbortController()
    fetchCouponTasks({ campId: filters.campId, pageNum: taskPage, pageSize: filters.pageSize }, controller.signal)
      .then((data) => setTaskState({ status: 'success', data }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return
        setTaskState({ status: 'error', message: error.message || '派发任务数据加载失败' })
      })
    return () => controller.abort()
  }, [filters.campId, filters.pageSize, taskPage])

  function queryCoupons() {
    setFilters((current) => ({ ...current, shelfStatus: draftStatus, pageNum: 1 }))
  }

  function resetFilters() {
    setDraftStatus('all')
    setFilters(defaultCouponFilters)
  }

  return (
    <div className="coupon-page">
      <section className="coupon-card coupon-list-card" aria-label="优惠券管理">
        <div className="coupon-tabs" role="tablist" aria-label="优惠券页面">
          {(['优惠券管理', '派发任务'] as CouponTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={activeTab === tab ? 'is-active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === '优惠券管理' ? (
          <>
            <div className="coupon-query coupon-query--split" aria-label="优惠券筛选">
              <label className="coupon-field">
                <span>上架状态：</span>
                <select
                  className="coupon-native-select"
                  aria-label="上架状态"
                  value={draftStatus}
                  onChange={(event) => setDraftStatus(event.target.value as CouponShelfStatus)}
                >
                  {shelfStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="coupon-actions">
                <button type="button" className="is-primary" onClick={queryCoupons}>
                  查 询
                </button>
                <button type="button" onClick={resetFilters}>
                  重 置
                </button>
              </div>
            </div>

            <div className="coupon-toolbar">
              <button type="button" className="is-primary" onClick={() => setActiveTab('派发任务')}>
                派发任务
              </button>
              <button type="button" className="is-primary" onClick={() => navigate('/mallManagement/couponMgt/edit')}>
                + 新建
              </button>
            </div>

            <DataFeedback state={listState} />
            {listState.status === 'success' ? (
              <CouponDataTable data={listState.data} onDetail={(coupon) => setDialog({ type: 'coupon-detail', coupon })} />
            ) : null}
          </>
        ) : (
          <>
            <div className="coupon-task-toolbar">
              <button type="button" className="is-primary">
                全部记录
              </button>
              <button type="button" className="is-primary" onClick={() => setDialog({ type: 'task-create' })}>
                新建任务
              </button>
            </div>

            <DataFeedback state={taskState} />
            {taskState.status === 'success' ? <TaskDataTable data={taskState.data} /> : null}
          </>
        )}
      </section>

      <CouponDialog dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  )
}

function CouponEditPage() {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState<CouponFormState>(defaultCouponForm)

  function updateForm<K extends keyof CouponFormState>(key: K, value: CouponFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function submitForm() {
    setNotice('优惠券已保存，可返回列表继续查看')
  }

  const effectiveText =
    form.timeMode === 'days'
      ? `${form.validDays || '0'} 天`
      : form.fixedDateStart && form.fixedDateEnd
        ? `${form.fixedDateStart} 至 ${form.fixedDateEnd}`
        : '请选择固定时间'

  return (
    <div className="coupon-page coupon-edit-page">
      <section className="coupon-card coupon-edit-card" aria-label="优惠券表单">
        <div className="coupon-breadcrumb">
          <button type="button" className="coupon-breadcrumb__link" onClick={() => navigate('/mallManagement/couponMgt')}>
            优惠券列表
          </button>
          <span>&gt;</span>
          <span>新增</span>
        </div>

        <Feedback notice={notice} />

        <div className="coupon-form-grid">
          <label className="coupon-form-field">
            <span>
              <i>*</i> 名称:
            </span>
            <input
              aria-label="名称"
              placeholder="请输入优惠券名称"
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
            />
          </label>

          <label className="coupon-form-field">
            <span>类型:</span>
            <select className="coupon-native-select" aria-label="类型" value={form.type} onChange={(event) => updateForm('type', event.target.value as CouponType)}>
              <option value="满减券">满减券</option>
            </select>
          </label>

          <div className="coupon-money-row">
            <span>
              <i>*</i> 优惠金额:
            </span>
            <label>
              满
              <input aria-label="满额金额" value={form.fullAmount} onChange={(event) => updateForm('fullAmount', event.target.value)} />
              元，减
              <input aria-label="减免金额" value={form.minusAmount} onChange={(event) => updateForm('minusAmount', event.target.value)} />
              元
            </label>
          </div>

          <label className="coupon-form-field">
            <span>
              <i>*</i> 生效范围:
            </span>
            <button type="button" className="coupon-select coupon-select-button" aria-label="选择商品/房型" onClick={() => setDialog({ type: 'product-picker' })}>
              {form.scopeText}
            </button>
          </label>

          <fieldset className="coupon-radio-row">
            <legend>
              <i>*</i> 领券条件:
            </legend>
            <label>
              <input type="radio" name="receiveRule" checked={form.receiveRule === 'all'} onChange={() => updateForm('receiveRule', 'all')} />
              所有人可以领
            </label>
            <label>
              <input type="radio" name="receiveRule" checked={form.receiveRule === 'new'} onChange={() => updateForm('receiveRule', 'new')} />
              仅限新用户可领取
            </label>
            <label>
              <input type="radio" name="receiveRule" checked={form.receiveRule === 'old'} onChange={() => updateForm('receiveRule', 'old')} />
              仅限老用户可领取
            </label>
          </fieldset>

          <fieldset className="coupon-radio-row">
            <legend>
              <i>*</i> 使用条件:
            </legend>
            <label>
              <input type="radio" name="memberRule" checked={form.memberRule === 'shared'} onChange={() => updateForm('memberRule', 'shared')} />
              可以与会员折扣共用
            </label>
            <label>
              <input type="radio" name="memberRule" checked={form.memberRule === 'exclusive'} onChange={() => updateForm('memberRule', 'exclusive')} />
              不可与会员折扣共享
            </label>
          </fieldset>

          <label className="coupon-form-field coupon-unit-field">
            <span>
              <i>*</i> 派发上限:
            </span>
            <input aria-label="派发上限" value={form.sendLimit} onChange={(event) => updateForm('sendLimit', event.target.value)} />
            <em>张</em>
          </label>

          <label className="coupon-form-field coupon-unit-field">
            <span>
              <i>*</i> 每人可领数:
            </span>
            <input aria-label="每人可领数" value={form.perUserLimit} onChange={(event) => updateForm('perUserLimit', event.target.value)} />
            <em>张</em>
          </label>

          <div className="coupon-form-field coupon-date-range-field">
            <span>
              <i>*</i> 派发时间:
            </span>
            <div className="coupon-date-range">
              <input type="date" aria-label="派发开始日期" value={form.sendDateStart} onChange={(event) => updateForm('sendDateStart', event.target.value)} />
              <span className="coupon-date-range__divider">至</span>
              <input type="date" aria-label="派发结束日期" value={form.sendDateEnd} onChange={(event) => updateForm('sendDateEnd', event.target.value)} />
            </div>
          </div>

          <fieldset className="coupon-radio-row">
            <legend>时效类型:</legend>
            <label>
              <input type="radio" name="timeMode" checked={form.timeMode === 'days'} onChange={() => updateForm('timeMode', 'days')} />
              有效天数
            </label>
            <label>
              <input type="radio" name="timeMode" checked={form.timeMode === 'fixed'} onChange={() => updateForm('timeMode', 'fixed')} />
              固定时间
            </label>
          </fieldset>

          {form.timeMode === 'days' ? (
            <>
              <label className="coupon-form-field coupon-unit-field">
                <span>
                  <i>*</i> 有效期:
                </span>
                <input aria-label="有效期天数" value={form.validDays} onChange={(event) => updateForm('validDays', event.target.value)} />
                <em>天</em>
              </label>

              <label className="coupon-form-field coupon-unit-field">
                <span>隔天生效:</span>
                <input aria-label="隔天生效天数" value={form.delayDays} onChange={(event) => updateForm('delayDays', event.target.value)} />
                <em>天</em>
              </label>
            </>
          ) : (
            <div className="coupon-form-field coupon-date-range-field">
              <span>
                <i>*</i> 固定时间:
              </span>
              <div className="coupon-date-range">
                <input type="date" aria-label="固定开始日期" value={form.fixedDateStart} onChange={(event) => updateForm('fixedDateStart', event.target.value)} />
                <span className="coupon-date-range__divider">至</span>
                <input type="date" aria-label="固定结束日期" value={form.fixedDateEnd} onChange={(event) => updateForm('fixedDateEnd', event.target.value)} />
              </div>
            </div>
          )}

          <fieldset className="coupon-radio-row coupon-unavailable-row">
            <legend>不可用时间:</legend>
            <label>
              <input type="checkbox" checked={form.disabledHoliday} onChange={(event) => updateForm('disabledHoliday', event.target.checked)} />
              节假日
            </label>
            <button type="button" className="coupon-text-link" onClick={() => setDialog({ type: 'holidays' })}>
              查看默认节假日列表
            </button>
            <label>
              <input type="checkbox" checked={form.disabledWeekend} onChange={(event) => updateForm('disabledWeekend', event.target.checked)} />
              周末
            </label>
            <span>星期五~六不可使用</span>
            <label>
              <input type="checkbox" checked={form.disabledCustom} onChange={(event) => updateForm('disabledCustom', event.target.checked)} />
              自定义
            </label>
          </fieldset>

          <div className="coupon-form-summary">
            <span>当前生效设置：{effectiveText}</span>
          </div>
        </div>

        <footer className="coupon-edit-footer">
          <button type="button" onClick={() => navigate('/mallManagement/couponMgt')}>
            返回列表
          </button>
          <button type="button" className="is-primary" onClick={submitForm}>
            提 交
          </button>
        </footer>
      </section>

      <CouponDialog
        dialog={dialog}
        onClose={() => setDialog(null)}
        onConfirmProduct={() => {
          updateForm('scopeText', '顶层套房/总裁套间')
          setDialog(null)
          setNotice('已选择商品/房型')
        }}
      />
    </div>
  )
}

type LoadState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: T }

function DataFeedback<T>({ state }: { state: LoadState<CouponViewModel<T>> }) {
  if (state.status === 'loading') return null
  if (state.status === 'error') return <TableShellError text={state.message} />
  return null
}

function Feedback({ notice }: { notice: string }) {
  return notice ? (
    <div className="coupon-notice" role="status">
      {notice}
    </div>
  ) : null
}

function CouponDataTable({ data, onDetail }: { data: CouponViewModel<CouponRow>; onDetail: (coupon: CouponRow) => void }) {
  return (
    <div className="coupon-table coupon-table--coupon" role="table" aria-label="优惠券列表表格">
      <div className="coupon-table__head" role="row">
        <div className="coupon-checkbox-cell" role="columnheader">
          <input type="checkbox" aria-label="全选优惠券" />
        </div>
        {couponColumns.slice(1).map((column) => (
          <div key={column} role="columnheader">
            {column}
          </div>
        ))}
      </div>
      {data.list.length > 0 ? (
        data.list.map((coupon) => (
          <div className="coupon-table__row" role="row" key={coupon.id}>
            <div className="coupon-checkbox-cell" role="cell">
              <input type="checkbox" aria-label={`选择 ${coupon.name}`} />
            </div>
            <div role="cell">{coupon.discountText}</div>
            <div role="cell">{coupon.scopeText}</div>
            <div role="cell">{coupon.sendLimit}</div>
            <div role="cell">{coupon.perUserLimit}</div>
            <div role="cell">{coupon.sendTime}</div>
            <div role="cell">{coupon.validityType}</div>
            <div role="cell">{coupon.effectiveTime}</div>
            <div role="cell">
              <button type="button" className="coupon-link-button" aria-label={`查看 ${coupon.name}`} onClick={() => onDetail(coupon)}>
                查看
              </button>
            </div>
          </div>
        ))
      ) : (
        <TableEmpty columns={couponColumns.length} text="暂无数据" inlineScroll />
      )}
    </div>
  )
}

function TaskDataTable({ data }: { data: CouponViewModel<CouponTaskRow> }) {
  return (
    <div className="coupon-table coupon-table--task" role="table" aria-label="派发任务表格">
      <TableHead columns={taskColumns} />
      {data.list.length > 0 ? (
        data.list.map((task) => (
          <div className="coupon-table__row" role="row" key={task.id}>
            <div role="cell">{task.sendMethod}</div>
            <div role="cell">{task.couponName}</div>
            <div role="cell">{task.sentCount}</div>
            <div role="cell">{task.createdAt}</div>
            <div role="cell">{task.recordText}</div>
          </div>
        ))
      ) : (
        <TableEmpty columns={taskColumns.length} text="暂无数据" />
      )}
    </div>
  )
}

function TableHead({ columns }: { columns: string[] }) {
  return (
    <div className="coupon-table__head" role="row">
      {columns.map((column) => (
        <div key={column} role="columnheader">
          {column}
        </div>
      ))}
    </div>
  )
}

function TableEmpty({ columns, text, inlineScroll = false }: { columns: number; text: string; inlineScroll?: boolean }) {
  return (
    <>
      <div className={`coupon-empty ${inlineScroll ? 'coupon-empty--scroll' : ''}`} role="row">
        <div role="cell" aria-colspan={columns}>
          <span className="coupon-empty__icon" aria-hidden="true" />
          <strong>{text}</strong>
        </div>
      </div>
      {inlineScroll ? (
        <div className="coupon-inline-scrollbar" aria-hidden="true">
          <span />
        </div>
      ) : null}
    </>
  )
}

function TableShellError({ text }: { text: string }) {
  return (
    <div className="coupon-error" role="alert">
      <span>{text}</span>
    </div>
  )
}

function CouponDialog({
  dialog,
  onClose,
  onConfirmProduct,
}: {
  dialog: DialogState
  onClose: () => void
  onConfirmProduct?: () => void
}) {
  if (!dialog) return null

  if (dialog.type === 'coupon-detail') {
    return (
      <Modal title="优惠券详情" closeLabel="关闭优惠券详情" onClose={onClose}>
        <p>{dialog.coupon.name}</p>
        <p>{dialog.coupon.discountText}</p>
        <p>{dialog.coupon.scopeText}</p>
      </Modal>
    )
  }

  if (dialog.type === 'task-create') {
    return (
      <Modal title="新建派发任务" closeLabel="取消新建派发任务" onClose={onClose}>
        <p>选择优惠券后可按会员标签派发。</p>
        <p>默认发送对象：近 30 天复购会员。</p>
      </Modal>
    )
  }

  if (dialog.type === 'product-picker') {
    return (
      <Modal title="选择商品/房型" closeLabel="关闭选择商品/房型" onClose={onClose}>
        <p>顶层套房（浴缸巨幕电竞麻将）</p>
        <p>总裁套间（桑拿浴缸露台电竞麻将）</p>
        <button type="button" className="is-primary" onClick={onConfirmProduct}>
          确认选择商品/房型
        </button>
      </Modal>
    )
  }

  return (
    <Modal title="默认节假日列表" closeLabel="关闭默认节假日列表" onClose={onClose}>
      <p>春节、清明节、劳动节、端午节、中秋节、国庆节。</p>
    </Modal>
  )
}

function Modal({ title, closeLabel, children, onClose }: { title: string; closeLabel: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="coupon-modal-mask" role="presentation" onMouseDown={onClose}>
      <section className="coupon-modal" role="dialog" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <strong>{title}</strong>
          <button type="button" aria-label={closeLabel} onClick={onClose}>
            ×
          </button>
        </header>
        <div className="coupon-modal__body">{children}</div>
      </section>
    </div>
  )
}
