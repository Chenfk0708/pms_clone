import { useEffect, useMemo, useState } from 'react'
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
  | { type: 'export' }
  | { type: 'product-picker' }
  | { type: 'holidays' }
  | null

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
const shelfStatusOptions: Array<{ label: string; value: CouponShelfStatus }> = [
  { label: '全部状态', value: 'all' },
  { label: '已上架', value: 'enabled' },
  { label: '已下架', value: 'disabled' },
]

export function CouponPage() {
  const location = useLocation()

  return location.pathname.endsWith('/edit') ? <CouponEditPage /> : <CouponListPage />
}

function CouponListPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<CouponTab>('优惠券管理')
  const [draftStatus, setDraftStatus] = useState<CouponShelfStatus>('all')
  const [filters, setFilters] = useState<CouponListFilters>(defaultCouponFilters)
  const [taskPage, setTaskPage] = useState(1)
  const [isStatusOpen, setIsStatusOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [listState, setListState] = useState<LoadState<CouponViewModel<CouponRow>>>({ status: 'loading' })
  const [taskState, setTaskState] = useState<LoadState<CouponViewModel<CouponTaskRow>>>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    fetchCouponList(filters, controller.signal)
      .then((data) => setListState({ status: 'success', data }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return
        setListState({ status: 'error', message: error.message || '优惠券数据加载失败' })
      })
    return () => controller.abort()
  }, [filters, refreshToken])

  useEffect(() => {
    const controller = new AbortController()
    fetchCouponTasks({ campId: filters.campId, pageNum: taskPage, pageSize: filters.pageSize }, controller.signal)
      .then((data) => setTaskState({ status: 'success', data }))
      .catch((error: Error) => {
        if (controller.signal.aborted) return
        setTaskState({ status: 'error', message: error.message || '派发任务数据加载失败' })
      })
    return () => controller.abort()
  }, [filters.campId, filters.pageSize, taskPage, refreshToken])

  const activeData = activeTab === '优惠券管理' ? listState : taskState
  const diagnostics = activeData.status === 'success' ? activeData.data : null
  const selectedStatusLabel = shelfStatusOptions.find((item) => item.value === draftStatus)?.label ?? '请选择'
  const statusButtonText = draftStatus === 'all' ? '请选择' : selectedStatusLabel

  function queryCoupons() {
    setFilters((current) => ({ ...current, shelfStatus: draftStatus, pageNum: 1 }))
    setNotice('已按当前条件刷新优惠券')
    setIsStatusOpen(false)
  }

  function resetFilters() {
    setDraftStatus('all')
    setFilters(defaultCouponFilters)
    setTaskPage(1)
    setNotice('已恢复默认筛选条件')
    setIsStatusOpen(false)
  }

  function refresh() {
    setRefreshToken((value) => value + 1)
    setNotice(`已刷新 ${new Date().toLocaleTimeString('zh-CN', { hour12: false })}`)
  }

  function retry() {
    setRefreshToken((value) => value + 1)
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
                  aria-label={`上架状态 ${statusButtonText}`}
                  onClick={() => setIsStatusOpen((value) => !value)}
                >
                  {statusButtonText}
                </button>
              </label>

              <div className="coupon-actions">
                <button type="button" onClick={resetFilters}>
                  重 置
                </button>
                <button type="button" className="is-primary" onClick={queryCoupons}>
                  查 询
                </button>
                <button type="button" onClick={refresh} disabled={listState.status === 'loading'}>
                  刷新
                </button>
                <button type="button" onClick={() => setDialog({ type: 'export' })}>
                  导出
                </button>
              </div>
            </div>

            {isStatusOpen ? (
              <div className="coupon-options" role="listbox" aria-label="上架状态选项">
                {shelfStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={draftStatus === option.value}
                    onClick={() => {
                      setDraftStatus(option.value)
                      setIsStatusOpen(false)
                    }}
                  >
                    {option.label}
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

            <Feedback notice={notice} />
            <DataFeedback state={listState} emptyText="暂无符合条件的优惠券" onRetry={retry} />
            {listState.status === 'success' ? (
              <CouponDataTable data={listState.data} onDetail={(coupon) => setDialog({ type: 'coupon-detail', coupon })} />
            ) : null}
          </>
        ) : (
          <>
            <div className="coupon-task-toolbar">
              <strong>全部记录</strong>
              <div>
                <button type="button" onClick={refresh} disabled={taskState.status === 'loading'}>
                  刷新
                </button>
                <button type="button" className="is-primary" onClick={() => setDialog({ type: 'task-create' })}>
                  新建任务
                </button>
              </div>
            </div>

            <Feedback notice={notice} />
            <DataFeedback state={taskState} emptyText="暂无派发任务" onRetry={retry} />
            {taskState.status === 'success' ? (
              <TaskDataTable
                data={taskState.data}
                onNext={() => {
                  setTaskPage((page) => page + 1)
                  setNotice('已切换派发任务分页')
                }}
              />
            ) : null}
          </>
        )}

        {diagnostics ? <ServiceDiagnostics data={diagnostics} /> : null}
      </section>

      <CouponDialog dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  )
}

function CouponEditPage() {
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<DialogState>(null)
  const [notice, setNotice] = useState('')
  const [selectedScope, setSelectedScope] = useState('选择商品/房型')

  return (
    <div className="coupon-page coupon-edit-page">
      <h1 className="sr-only-heading">优惠券</h1>

      <section className="coupon-card coupon-edit-card" aria-label="优惠券表单">
        <div className="coupon-breadcrumb">优惠券列表&gt;新增</div>
        <Feedback notice={notice} />

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
            <button
              type="button"
              className="coupon-select"
              aria-label="选择商品/房型"
              onClick={() => setDialog({ type: 'product-picker' })}
            >
              {selectedScope}
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
            <button type="button" onClick={() => setDialog({ type: 'holidays' })}>
              查看默认节假日列表
            </button>
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
          <button type="button" className="is-primary" onClick={() => setNotice('优惠券已保存，可在列表继续派发')}>
            提 交
          </button>
        </footer>
      </section>

      <CouponDialog
        dialog={dialog}
        onClose={() => setDialog(null)}
        onConfirmProduct={() => {
          setSelectedScope('顶层套房、总裁套间')
          setDialog(null)
          setNotice('已选择 2 个适用房型')
        }}
      />
    </div>
  )
}

type LoadState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: T }

function DataFeedback<T>({ state, emptyText, onRetry }: { state: LoadState<CouponViewModel<T>>; emptyText: string; onRetry: () => void }) {
  if (state.status === 'loading') {
    return (
      <div className="coupon-notice" role="status">
        正在加载优惠券数据
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="coupon-error" role="alert">
        <span>{state.message}</span>
        <button type="button" onClick={onRetry}>
          重试
        </button>
      </div>
    )
  }

  if (state.data.list.length === 0) {
    return (
      <div className="coupon-notice" role="status">
        {emptyText}
      </div>
    )
  }

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
    <div className="coupon-table" role="table" aria-label="优惠券列表表格">
      <TableHead columns={couponColumns} />
      {data.list.length > 0 ? (
        data.list.map((coupon) => (
          <div className="coupon-table__row" role="row" key={coupon.id}>
            <div role="cell">{coupon.name}</div>
            <div role="cell">{coupon.type}</div>
            <div role="cell">{coupon.discountText}</div>
            <div role="cell">{coupon.scopeText}</div>
            <div role="cell">{coupon.sendLimit}</div>
            <div role="cell">{coupon.perUserLimit}</div>
            <div role="cell">{coupon.sendTime}</div>
            <div role="cell">{coupon.validityType}</div>
            <div role="cell">{coupon.effectiveTime}</div>
            <div role="cell">{coupon.receiveRule}</div>
            <div role="cell">
              <span className={`coupon-status ${coupon.status === '已上架' ? 'is-on' : 'is-off'}`}>{coupon.status}</span>
            </div>
            <div role="cell">
              <button type="button" className="coupon-link-button" aria-label={`查看 ${coupon.name}`} onClick={() => onDetail(coupon)}>
                查看
              </button>
            </div>
          </div>
        ))
      ) : (
        <TableEmpty columns={couponColumns.length} text="暂无符合条件的优惠券" />
      )}
      <Pagination pageNum={data.pagination.pageNum} pages={data.pagination.pages} total={data.pagination.total} />
    </div>
  )
}

function TaskDataTable({ data, onNext }: { data: CouponViewModel<CouponTaskRow>; onNext: () => void }) {
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
        <TableEmpty columns={taskColumns.length} text="暂无派发任务" />
      )}
      <Pagination pageNum={data.pagination.pageNum} pages={data.pagination.pages} total={data.pagination.total} onNext={onNext} />
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

function TableEmpty({ columns, text }: { columns: number; text: string }) {
  return (
    <div className="coupon-empty" role="row">
      <div role="cell" aria-colspan={columns}>
        <span className="coupon-empty__icon" aria-hidden="true" />
        <strong>{text}</strong>
      </div>
    </div>
  )
}

function Pagination({ pageNum, pages, total, onNext }: { pageNum: number; pages: number; total: number; onNext?: () => void }) {
  return (
    <div className="coupon-pagination" aria-label="分页">
      <span>
        共 {total} 条，第 {pageNum}/{Math.max(1, pages)} 页
      </span>
      <button type="button" disabled={!onNext} onClick={onNext}>
        下一页
      </button>
    </div>
  )
}

function ServiceDiagnostics({ data }: { data: { endpoint: string; requestBody: Record<string, unknown> } }) {
  const requestJson = useMemo(() => JSON.stringify(data.requestBody), [data.requestBody])
  return (
    <div className="coupon-diagnostics" aria-label="优惠券数据服务诊断">
      <span data-testid="coupon-service-endpoint">{data.endpoint}</span>
      <code data-testid="coupon-request-body">{requestJson}</code>
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

  if (dialog.type === 'export') {
    return (
      <Modal title="导出优惠券" closeLabel="关闭导出优惠券" onClose={onClose}>
        <p>导出任务已创建，完成后可在消息中心查看。</p>
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
