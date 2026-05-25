import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createCustomerListExport,
  createDefaultCustomerListQuery,
  customerAgeOptions,
  customerGenderOptions,
  customerIdentityOptions,
  customerStatusOptions,
  customerWechatOptions,
  fetchCustomerListDashboard,
  memberCardOptions,
  saveCustomer,
  type CustomerIdentity,
  type CustomerListDashboard,
  type CustomerListQuery,
  type CustomerListScenario,
  type CustomerOption,
  type CustomerRecord,
  type CustomerStatus,
} from '../services/customerList'
import './CustomerListPage.css'

type FilterKey = 'status' | 'identity' | 'level' | 'wechat' | 'gender' | 'age'
type SearchType = CustomerListQuery['memberSearchType']
type OpenFilter = FilterKey | 'searchType' | null
type MoreAction = 'coupon' | 'level' | 'tag'

const tableColumns = [
  '客户信息',
  '客户编号',
  '客户渠道',
  '会员等级',
  '客户标签',
  '最近消费金额',
  '累计消费次数',
  '累计消费金额',
  '客单价',
  '是否添加企微',
  '是否加微信',
  '是否加群',
  '成为客户时间',
  '成为会员时间',
  '最近消费时间',
  '最近跟进时间',
  '操作',
]

const searchTypes: Array<{ id: SearchType; label: string }> = [
  { id: 'mobile', label: '手机号' },
  { id: 'name', label: '客户姓名' },
  { id: 'memberNo', label: '客户编号' },
]

const levelDialogOptions = ['普通会员', '银卡会员', '金卡会员', '钻石会员']

export function CustomerListPage() {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLElement | null>(null)
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const moreTriggerRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [query, setQuery] = useState(createInitialCustomerListQuery)
  const [draft, setDraft] = useState(createInitialCustomerListQuery)
  const [dashboard, setDashboard] = useState<CustomerListDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [moreCustomer, setMoreCustomer] = useState<CustomerRecord | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [couponCustomer, setCouponCustomer] = useState<CustomerRecord | null>(null)
  const [levelCustomer, setLevelCustomer] = useState<CustomerRecord | null>(null)
  const [tagCustomer, setTagCustomer] = useState<CustomerRecord | null>(null)
  const [notice, setNotice] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<{ left: number; top: number; minWidth: number } | null>(null)
  const [moreMenuStyle, setMoreMenuStyle] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    const abort = new AbortController()
    fetchCustomerListDashboard(query, abort.signal)
      .then((nextDashboard) => {
        setDashboard(nextDashboard)
        setError('')
        setSelectedIds([])
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setError(reason instanceof Error ? reason.message : '客户列表加载失败')
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })

    return () => abort.abort()
  }, [query])

  useEffect(() => {
    if (!openFilter) {
      setDropdownStyle(null)
      return
    }

    const panel = panelRef.current
    const trigger = triggerRefs.current[openFilter]
    if (!panel || !trigger) return

    const updatePosition = () => {
      const panelRect = panel.getBoundingClientRect()
      const triggerRect = trigger.getBoundingClientRect()
      setDropdownStyle({
        left: triggerRect.left - panelRect.left,
        top: triggerRect.bottom - panelRect.top + 6,
        minWidth: triggerRect.width,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [expanded, openFilter])

  useEffect(() => {
    if (!moreCustomer) {
      setMoreMenuStyle(null)
      return
    }

    const trigger = moreTriggerRefs.current[moreCustomer.id]
    if (!trigger) return

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect()
      setMoreMenuStyle({
        left: rect.left,
        top: rect.bottom + 6,
      })
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [moreCustomer])

  const contractText = useMemo(
    () =>
      JSON.stringify({
        provider: dashboard?.provider,
        endpoint: dashboard?.endpoint,
        requestBody: dashboard?.requestBody,
        pagination: dashboard?.pagination,
        traceId: dashboard?.traceId,
      }),
    [dashboard],
  )

  const selectedCustomers = useMemo(
    () => dashboard?.rows.filter((row) => selectedIds.includes(row.id)) ?? [],
    [dashboard, selectedIds],
  )

  const batchActionCustomer = selectedCustomers[0] ?? null

  function patchDraft(next: Partial<CustomerListQuery>) {
    setDraft((current) => ({ ...current, ...next, pageNum: next.pageNum ?? current.pageNum }))
  }

  function chooseFilter(key: FilterKey, id: string) {
    if (key === 'status') patchDraft({ status: id as CustomerStatus })
    if (key === 'identity') patchDraft({ identity: id as CustomerIdentity })
    if (key === 'level') patchDraft({ memberCardId: id })
    if (key === 'wechat') patchDraft({ wechatState: id as CustomerListQuery['wechatState'] })
    if (key === 'gender') patchDraft({ gender: id as CustomerListQuery['gender'] })
    if (key === 'age') patchDraft({ ageRange: id })
    setOpenFilter(null)
  }

  function patchSearchType(next: SearchType) {
    patchDraft({ memberSearchType: next })
    setOpenFilter(null)
  }

  function submitQuery() {
    setNotice('')
    setOpenFilter(null)
    setLoading(true)
    setError('')
    setQuery({ ...draft, pageNum: 1, scenario: resolveScenario() })
  }

  function resetFilters() {
    const next = createDefaultCustomerListQuery()
    next.scenario = resolveScenario()
    setDraft(next)
    setLoading(true)
    setError('')
    setQuery(next)
    setOpenFilter(null)
    setNotice('已恢复默认客户筛选')
  }

  async function handleExport() {
    const result = await createCustomerListExport(query)
    setNotice(`客户导出任务已创建：${result.data.taskId}`)
  }

  function handleSelect(id: string, checked: boolean) {
    const next = checked ? [...selectedIds, id] : selectedIds.filter((item) => item !== id)
    setSelectedIds(next)
    setNotice(next.length ? `已选择 ${next.length} 位客户` : '已取消选择客户')
  }

  function handleSelectAll(checked: boolean) {
    const ids = checked && dashboard ? dashboard.rows.map((row) => row.id) : []
    setSelectedIds(ids)
    setNotice(ids.length ? `已选择 ${ids.length} 位客户` : '已取消选择客户')
  }

  function handlePageChange(pageNum: number) {
    const next = { ...query, pageNum, scenario: resolveScenario() }
    setDraft(next)
    setLoading(true)
    setError('')
    setQuery(next)
  }

  function handleMoreAction(action: MoreAction) {
    if (!moreCustomer) return
    if (action === 'coupon') setCouponCustomer(moreCustomer)
    if (action === 'level') setLevelCustomer(moreCustomer)
    if (action === 'tag') setTagCustomer(moreCustomer)
    setMoreCustomer(null)
  }

  function handleBatchAction(action: MoreAction) {
    if (!batchActionCustomer) return
    if (action === 'coupon') setCouponCustomer(batchActionCustomer)
    if (action === 'level') setLevelCustomer(batchActionCustomer)
    if (action === 'tag') setTagCustomer(batchActionCustomer)
  }

  return (
    <div className="customer-list-page">
      <h1 className="sr-only-heading">客户列表</h1>
      <pre hidden data-testid="customer-list-contract" data-provider={dashboard?.provider ?? 'mock'} data-endpoint={dashboard?.endpoint ?? '/member/page/get'}>
        {contractText}
      </pre>

      <section ref={panelRef} className={`customer-list-query${expanded ? ' is-expanded' : ''}`} aria-label="客户列表筛选">
        <div className="customer-list-query__grid">
          <div className="customer-list-field customer-list-search">
            <span>客户搜索:</span>
            <div className="customer-list-search__control">
              <button
                ref={(node) => {
                  triggerRefs.current.searchType = node
                }}
                type="button"
                aria-haspopup="listbox"
                aria-label={searchTypeLabel(draft.memberSearchType)}
                onClick={() => setOpenFilter(openFilter === 'searchType' ? null : 'searchType')}
              >
                {searchTypeLabel(draft.memberSearchType)}
              </button>
              <input value={draft.keyword} placeholder="请输入" onChange={(event) => patchDraft({ keyword: event.target.value })} />
            </div>
          </div>

          <CustomerSelect
            label="客户状态"
            value={optionLabel(customerStatusOptions, draft.status, '请选择')}
            isOpen={openFilter === 'status'}
            triggerRef={(node) => {
              triggerRefs.current.status = node
            }}
            onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
          />

          <CustomerSelect
            label="客户身份"
            value={optionLabel(customerIdentityOptions, draft.identity, '请选择')}
            isOpen={openFilter === 'identity'}
            triggerRef={(node) => {
              triggerRefs.current.identity = node
            }}
            onToggle={() => setOpenFilter(openFilter === 'identity' ? null : 'identity')}
          />

          {expanded ? (
            <>
              <CustomerSelect
                label="会员等级"
                value={optionLabel(memberCardOptions, draft.memberCardId, '请选择')}
                isOpen={openFilter === 'level'}
                triggerRef={(node) => {
                  triggerRefs.current.level = node
                }}
                onToggle={() => setOpenFilter(openFilter === 'level' ? null : 'level')}
              />

              <CustomerSelect
                label="是否添加企微"
                value={optionLabel(customerWechatOptions, draft.wechatState, '请选择')}
                isOpen={openFilter === 'wechat'}
                triggerRef={(node) => {
                  triggerRefs.current.wechat = node
                }}
                onToggle={() => setOpenFilter(openFilter === 'wechat' ? null : 'wechat')}
              />

              <CustomerSelect
                label="客户性别"
                value={optionLabel(customerGenderOptions, draft.gender, '请选择')}
                isOpen={openFilter === 'gender'}
                triggerRef={(node) => {
                  triggerRefs.current.gender = node
                }}
                onToggle={() => setOpenFilter(openFilter === 'gender' ? null : 'gender')}
              />

              <CustomerSelect
                label="客户年龄"
                value={optionLabel(customerAgeOptions, draft.ageRange, '请选择')}
                isOpen={openFilter === 'age'}
                triggerRef={(node) => {
                  triggerRefs.current.age = node
                }}
                onToggle={() => setOpenFilter(openFilter === 'age' ? null : 'age')}
              />

              <DateRangeField
                label="成为客户时间"
                start={draft.firstMemberStartTime}
                end={draft.firstMemberEndTime}
                onStart={(value) => patchDraft({ firstMemberStartTime: value })}
                onEnd={(value) => patchDraft({ firstMemberEndTime: value })}
              />
              <DateRangeField
                label="成为会员时间"
                start={draft.firstMemberCardStartTime}
                end={draft.firstMemberCardEndTime}
                onStart={(value) => patchDraft({ firstMemberCardStartTime: value })}
                onEnd={(value) => patchDraft({ firstMemberCardEndTime: value })}
              />
              <DateRangeField
                label="最近跟进时间"
                start={draft.lastFollowStartTime}
                end={draft.lastFollowEndTime}
                onStart={(value) => patchDraft({ lastFollowStartTime: value })}
                onEnd={(value) => patchDraft({ lastFollowEndTime: value })}
              />
              <DateRangeField
                label="最近消费时间"
                start={draft.lastConsumeStartTime}
                end={draft.lastConsumeEndTime}
                onStart={(value) => patchDraft({ lastConsumeStartTime: value })}
                onEnd={(value) => patchDraft({ lastConsumeEndTime: value })}
              />
              <AmountRangeField
                label="最近消费金额"
                min={draft.lastConsumeMin}
                max={draft.lastConsumeMax}
                onMin={(value) => patchDraft({ lastConsumeMin: value })}
                onMax={(value) => patchDraft({ lastConsumeMax: value })}
              />
              <AmountRangeField
                label="累计消费金额"
                min={draft.totalConsumeMin}
                max={draft.totalConsumeMax}
                onMin={(value) => patchDraft({ totalConsumeMin: value })}
                onMax={(value) => patchDraft({ totalConsumeMax: value })}
              />
              <AmountRangeField
                label="客单价"
                min={draft.avgConsumeMin}
                max={draft.avgConsumeMax}
                onMin={(value) => patchDraft({ avgConsumeMin: value })}
                onMax={(value) => patchDraft({ avgConsumeMax: value })}
              />
            </>
          ) : null}
        </div>

        {openFilter && dropdownStyle ? (
          <div
            className="customer-list-options"
            role="listbox"
            aria-label={`${filterLabel(openFilter)}选项`}
            style={{
              left: `${dropdownStyle.left}px`,
              top: `${dropdownStyle.top}px`,
              minWidth: `${dropdownStyle.minWidth}px`,
            }}
          >
            {filterOptions(openFilter).map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelected(openFilter, option.id, draft)}
                onClick={() => (openFilter === 'searchType' ? patchSearchType(option.id as SearchType) : chooseFilter(openFilter, option.id))}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="customer-list-query__actions">
          <button type="button" className="is-link" onClick={() => setExpanded((current) => !current)}>
            {expanded ? '收起' : '展开'} <span aria-hidden="true">{expanded ? '▲' : '▼'}</span>
          </button>
          <button type="button" className="is-primary" onClick={submitQuery} disabled={loading}>
            {loading ? '查询中' : '查询'}
          </button>
          <button type="button" onClick={resetFilters} disabled={loading}>
            重置
          </button>
        </div>
      </section>

      <div className="customer-list-toolbar">
        <button type="button" className="customer-list-export" onClick={handleExport} disabled={loading}>
          导出数据
        </button>
        <button type="button" className="customer-list-add" onClick={() => setShowAddDialog(true)}>
          添加客户
        </button>
      </div>

      {selectedIds.length ? (
        <section className="customer-list-batchbar" aria-label="批量操作">
          <div className="customer-list-batchbar__info">已选 {selectedIds.length} 位客户</div>
          <div className="customer-list-batchbar__actions">
            <button type="button" onClick={() => handleBatchAction('coupon')}>
              送优惠券
            </button>
            <button type="button" onClick={() => handleBatchAction('level')}>
              修改会员等级
            </button>
            <button type="button" onClick={() => handleBatchAction('tag')}>
              添加标签
            </button>
          </div>
          <button
            type="button"
            className="customer-list-batchbar__cancel"
            onClick={() => {
              setSelectedIds([])
              setNotice('已取消选择客户')
            }}
          >
            取消选择
          </button>
        </section>
      ) : null}

      {notice ? (
        <div className="customer-list-notice" role="status">
          {notice}
        </div>
      ) : null}

      {error ? (
        <section className="customer-list-state customer-list-state--error" role="alert">
          <strong>客户列表加载失败</strong>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              setError('')
              setQuery({ ...query, scenario: resolveScenario() })
            }}
          >
            重新加载
          </button>
        </section>
      ) : null}

      <section className={`customer-list-table${loading ? ' is-loading' : ''}`} aria-label="客户列表表格">
        {loading ? <div className="customer-list-loading">正在加载客户数据</div> : null}

        <div className="customer-list-table__head">
          <label className="customer-list-check">
            <input type="checkbox" aria-label="全选客户" checked={Boolean(dashboard?.rows.length) && selectedIds.length === dashboard?.rows.length} onChange={(event) => handleSelectAll(event.target.checked)} />
          </label>
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>

        <div className="customer-list-table__body">
          {dashboard?.rows.map((row) => (
            <div key={row.id} className="customer-list-row">
              <label className="customer-list-check">
                <input type="checkbox" aria-label={`选择${row.name}`} checked={selectedIds.includes(row.id)} onChange={(event) => handleSelect(row.id, event.target.checked)} />
              </label>
              <div className="customer-list-profile">
                <span className="customer-list-avatar" aria-hidden="true" />
                <div>
                  <strong>{row.name}</strong>
                  <span>{row.mobile}</span>
                </div>
              </div>
              <div>{row.memberNo}</div>
              <div>{row.channelName}</div>
              <div>{row.memberCardName}</div>
              <div>{row.tagNames.length ? row.tagNames.join('、') : '-'}</div>
              <div>{row.lastConsumePrice}</div>
              <div>{row.totalConsumeCount}</div>
              <div>{row.totalConsumePrice}</div>
              <div>{row.avgConsumePrice}</div>
              <div>{row.isJoinWxCp}</div>
              <div>{row.isJoinWx}</div>
              <div>{row.isJoinGroup}</div>
              <div>{row.firstMemberTime}</div>
              <div>{row.firstMemberCardTime}</div>
              <div>{row.lastConsumeTime}</div>
              <div>{row.lastFollowTime}</div>
              <div className="customer-list-actions">
                <button type="button" onClick={() => navigate(`/customer/list/detail?id=${row.id}`)}>
                  详情
                </button>
                <button
                  ref={(node) => {
                    moreTriggerRefs.current[row.id] = node
                  }}
                  type="button"
                  onClick={() => setMoreCustomer(row)}
                >
                  更多
                </button>
              </div>
            </div>
          ))}
        </div>

        {!loading && !error && dashboard?.rows.length === 0 ? <div className="customer-list-empty">暂无符合条件的客户</div> : null}

        <footer className="customer-list-pagination">
          <span>{paginationText(dashboard)}</span>
          {[1, 2, 3, 4, 5].map((pageNum) => (
            <button key={pageNum} type="button" className={dashboard?.pagination.page === pageNum ? 'is-active' : ''} onClick={() => handlePageChange(pageNum)}>
              {pageNum}
            </button>
          ))}
          <em>...</em>
          <button type="button" onClick={() => handlePageChange(30)}>
            30
          </button>
          <button type="button" aria-label="下一页" onClick={() => handlePageChange(Math.min((dashboard?.pagination.page ?? 1) + 1, 30))}>
            →
          </button>
          <button type="button" className="customer-list-page-size">
            {dashboard?.pagination.pageSize ?? 20} 条/页
          </button>
        </footer>
      </section>

      {moreCustomer && moreMenuStyle ? (
        <div className="customer-list-more-menu" style={{ left: `${moreMenuStyle.left}px`, top: `${moreMenuStyle.top}px` }} role="menu" aria-label="客户更多操作">
          <button type="button" role="menuitem" onClick={() => handleMoreAction('coupon')}>
            送优惠券
          </button>
          <button type="button" role="menuitem" onClick={() => handleMoreAction('level')}>
            修改会员等级
          </button>
          <button type="button" role="menuitem" onClick={() => handleMoreAction('tag')}>
            修改标签
          </button>
        </div>
      ) : null}

      {showAddDialog ? <AddCustomerDialog onClose={() => setShowAddDialog(false)} onSaved={(message) => setNotice(message)} /> : null}
      {couponCustomer ? <CouponPickerDialog customer={couponCustomer} onClose={() => setCouponCustomer(null)} /> : null}
      {levelCustomer ? <LevelDialog customer={levelCustomer} onClose={() => setLevelCustomer(null)} onSaved={(message) => setNotice(message)} /> : null}
      {tagCustomer ? <TagDialog customer={tagCustomer} onClose={() => setTagCustomer(null)} onSaved={(message) => setNotice(message)} /> : null}
    </div>
  )
}

function CustomerSelect({
  label,
  value,
  isOpen,
  triggerRef,
  onToggle,
}: {
  label: string
  value: string
  isOpen: boolean
  triggerRef: (node: HTMLButtonElement | null) => void
  onToggle: () => void
}) {
  return (
    <label className="customer-list-field">
      <span>{label}:</span>
      <button ref={triggerRef} type="button" className="customer-list-select" aria-haspopup="listbox" aria-expanded={isOpen} aria-label={`${label} ${value}`} onClick={onToggle}>
        {value}
      </button>
    </label>
  )
}

function DateRangeField({
  label,
  start,
  end,
  onStart,
  onEnd,
}: {
  label: string
  start: string
  end: string
  onStart: (value: string) => void
  onEnd: (value: string) => void
}) {
  return (
    <div className="customer-list-field customer-list-date" role="group" aria-label={label}>
      <span>{label}:</span>
      <div className="customer-list-date__range">
        <input type="date" aria-label={`${label}开始`} value={start} onChange={(event) => onStart(event.target.value)} />
        <em>至</em>
        <input type="date" aria-label={`${label}结束`} value={end} onChange={(event) => onEnd(event.target.value)} />
      </div>
    </div>
  )
}

function AmountRangeField({
  label,
  min,
  max,
  onMin,
  onMax,
}: {
  label: string
  min: string
  max: string
  onMin: (value: string) => void
  onMax: (value: string) => void
}) {
  return (
    <div className="customer-list-field customer-list-amount" role="group" aria-label={label}>
      <span>{label}:</span>
      <div className="customer-list-amount__range">
        <input aria-label={`${label}最小值`} placeholder="请输入" value={min} onChange={(event) => onMin(event.target.value)} />
        <em>-</em>
        <input aria-label={`${label}最大值`} placeholder="请输入" value={max} onChange={(event) => onMax(event.target.value)} />
      </div>
    </div>
  )
}

function AddCustomerDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (message: string) => void }) {
  const [mobile, setMobile] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setError('')
    if (!mobile.trim()) {
      setError('请输入手机号')
      return
    }

    setSaving(true)
    try {
      await saveCustomer({
        mobile,
        name,
        gender: '',
        channelName: '自来客',
        firstMemberTime: '2026-05-18 10:00:00',
        remark: '',
      })
      onSaved('客户已保存')
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '客户保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="customer-list-modal-backdrop">
      <section className="customer-list-modal" role="dialog" aria-modal="true" aria-label="添加客户">
        <header>
          <h2>添加客户</h2>
          <button type="button" aria-label="关闭添加客户" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-list-modal__body">
          {error ? (
            <div className="customer-list-dialog-error" role="alert">
              {error}
            </div>
          ) : null}
          <DialogField label="手机号" required placeholder="请输入手机号" value={mobile} onChange={setMobile} />
          <DialogField label="姓名" placeholder="请输入姓名" value={name} onChange={setName} />
          <DialogSelect label="性别" placeholder="请选择" />
          <DialogField label="生日" type="date" placeholder="请选择日期" />
          <DialogField label="地区" placeholder="请输入" />
          <DialogSelect label="客户渠道" required placeholder="自来客" />
          <DialogField label="成为客户时间" type="date" required defaultValue="2026-05-18" />
          <DialogField label="微信" placeholder="请输入微信" />
          <DialogField label="邮箱" placeholder="请输入邮箱" />
          <DialogField label="QQ" placeholder="QQ" />
          <DialogSelect label="是否加微信" placeholder="请选择" />
          <DialogSelect label="是否加群" placeholder="请选择" />
          <DialogField label="备注" placeholder="请输入备注" />
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中' : '保存'}
          </button>
        </footer>
      </section>
    </div>
  )
}

function CouponPickerDialog({ customer, onClose }: { customer: CustomerRecord; onClose: () => void }) {
  const navigate = useNavigate()

  return (
    <div className="customer-list-modal-backdrop">
      <section className="customer-list-modal customer-list-modal--wide" role="dialog" aria-modal="true" aria-label="选择优惠券">
        <header>
          <div className="customer-list-modal-tabs">
            <h2>选择优惠券</h2>
            <button
              type="button"
              className="customer-list-tab-chip is-active"
              onClick={() => {
                onClose()
                navigate('/mallManagement/couponMgt')
              }}
            >
              优惠券管理
            </button>
          </div>
          <button type="button" aria-label="关闭选择优惠券" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-list-modal__body customer-list-coupon-body">
          <div className="customer-list-coupon-table" aria-label={`${customer.name}优惠券选择`}>
            <div className="customer-list-coupon-head">
              <label className="customer-list-check">
                <input type="checkbox" aria-label="全选优惠券" />
              </label>
              <span>优惠券名称</span>
              <span>优惠券类型</span>
              <span>领取条件</span>
              <span>优惠力度</span>
              <span>派发上限</span>
              <span>限领次数</span>
              <span>剩余库存</span>
              <span>生效范围</span>
            </div>
            <div className="customer-list-coupon-empty">
              <div className="customer-list-coupon-empty__icon" aria-hidden="true" />
              <span>暂无数据</span>
            </div>
          </div>
        </div>
        <footer className="customer-list-coupon-footer">
          <span>已选中 0 项</span>
          <button type="button" className="is-primary is-disabled" disabled>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

function LevelDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerRecord
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [remark, setRemark] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')

  return (
    <div className="customer-list-modal-backdrop">
      <section className="customer-list-modal" role="dialog" aria-modal="true" aria-label="修改会员等级">
        <header>
          <h2>修改会员等级</h2>
          <button type="button" aria-label="关闭修改会员等级" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-list-modal__body customer-list-level-body">
          <div className="customer-list-current-level">当前会员等级：{customer.memberCardName || '普通会员'}</div>
          <DialogSelect label="修改等级至" required placeholder={selected || '请选择会员等级'} expanded={open} onToggle={() => setOpen((current) => !current)} />
          {open ? (
            <div className="customer-list-inline-options" role="listbox" aria-label="会员等级选项">
              {levelDialogOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="option"
                  aria-selected={selected === option}
                  onClick={() => {
                    setSelected(option)
                    setOpen(false)
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}
          <DialogField label="备注" placeholder="请输入备注" value={remark} onChange={setRemark} />
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              onSaved(`客户会员等级已更新：${customer.name}`)
              onClose()
            }}
          >
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

function TagDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerRecord
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const [keyword, setKeyword] = useState('')

  return (
    <div className="customer-list-modal-backdrop">
      <section className="customer-list-modal customer-list-modal--tag" role="dialog" aria-modal="true" aria-label="选择标签">
        <header>
          <h2>选择标签</h2>
          <button type="button" aria-label="关闭选择标签" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-list-modal__body customer-list-tag-body">
          <div className="customer-list-tag-toolbar">
            <input aria-label="搜索标签" placeholder="搜索标签" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
            <button type="button">+ 添加标签</button>
          </div>
          <section className="customer-list-tag-selected" aria-label={`${customer.name}已选标签`}>
            <strong>已选标签</strong>
          </section>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              onSaved(`客户标签已更新：${customer.name}`)
              onClose()
            }}
          >
            完成
          </button>
        </footer>
      </section>
    </div>
  )
}

function DialogField({
  label,
  type,
  placeholder,
  required,
  defaultValue,
  value,
  onChange,
}: {
  label: string
  type?: 'text' | 'date'
  placeholder?: string
  required?: boolean
  defaultValue?: string
  value?: string
  onChange?: (value: string) => void
}) {
  return (
    <label className="customer-list-dialog-field">
      <span>
        {required ? <b aria-hidden="true">*</b> : null}
        {label}:
      </span>
      <input type={type ?? 'text'} aria-label={label} placeholder={placeholder} defaultValue={defaultValue} value={value} onChange={(event) => onChange?.(event.target.value)} />
    </label>
  )
}

function DialogSelect({
  label,
  placeholder,
  required,
  expanded,
  onToggle,
}: {
  label: string
  placeholder: string
  required?: boolean
  expanded?: boolean
  onToggle?: () => void
}) {
  return (
    <label className="customer-list-dialog-field">
      <span>
        {required ? <b aria-hidden="true">*</b> : null}
        {label}:
      </span>
      <button type="button" className="customer-list-dialog-select" aria-label={`${label} ${placeholder}`} aria-expanded={expanded} onClick={onToggle}>
        {placeholder}
      </button>
    </label>
  )
}

function filterOptions(key: Exclude<OpenFilter, null>): CustomerOption[] {
  if (key === 'searchType') return searchTypes
  if (key === 'status') return customerStatusOptions
  if (key === 'identity') return customerIdentityOptions
  if (key === 'level') return memberCardOptions
  if (key === 'wechat') return customerWechatOptions
  if (key === 'gender') return customerGenderOptions
  return customerAgeOptions
}

function filterLabel(key: Exclude<OpenFilter, null>) {
  const labels: Record<Exclude<OpenFilter, null>, string> = {
    searchType: '搜索类型',
    status: '客户状态',
    identity: '客户身份',
    level: '会员等级',
    wechat: '是否添加企微',
    gender: '客户性别',
    age: '客户年龄',
  }
  return labels[key]
}

function isSelected(key: Exclude<OpenFilter, null>, id: string, query: CustomerListQuery) {
  if (key === 'searchType') return query.memberSearchType === id
  if (key === 'status') return query.status === id
  if (key === 'identity') return query.identity === id
  if (key === 'level') return query.memberCardId === id
  if (key === 'wechat') return query.wechatState === id
  if (key === 'gender') return query.gender === id
  return query.ageRange === id
}

function optionLabel(options: CustomerOption[], id: string, fallback: string) {
  if (!id) return fallback
  return options.find((option) => option.id === id)?.label ?? fallback
}

function searchTypeLabel(value: SearchType) {
  return searchTypes.find((item) => item.id === value)?.label ?? '手机号'
}

function paginationText(dashboard: CustomerListDashboard | null) {
  if (!dashboard) return '第 0-0 条 / 共 0 条'
  const start = dashboard.pagination.total === 0 ? 0 : (dashboard.pagination.page - 1) * dashboard.pagination.pageSize + 1
  const end = Math.min(dashboard.pagination.page * dashboard.pagination.pageSize, dashboard.pagination.total)
  return `第 ${start}-${end} 条 / 共 ${dashboard.pagination.total} 条`
}

function resolveScenario(): CustomerListScenario {
  const value = window.localStorage.getItem('pms.customerList.scenario')
  return value === 'empty' || value === 'error' ? value : 'success'
}

function createInitialCustomerListQuery() {
  const next = createDefaultCustomerListQuery()
  if (typeof window !== 'undefined') next.scenario = resolveScenario()
  return next
}
