import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createOrderLedgerExportTask,
  defaultOrderLedgerRequest,
  fetchOrderLedgerDashboard,
  resolveOrderLedgerMockState,
  resolveOrderLedgerProvider,
  type OrderLedgerDashboard,
  type OrderLedgerRecord,
  type OrderLedgerRequest,
  type OrderLedgerRoomNode,
} from '../services/orderLedger'
import './OrderLedgerPage.css'

type SelectKind = 'type' | 'source' | 'payment' | null
type TypeValue = 'all' | 'income' | 'expense'
type SourceValue = 'all' | 'stayOrder' | 'manualEntry'

const datePresets = [
  { label: '昨天', beginTime: '2026-05-18', endTime: '2026-05-19' },
  { label: '今天', beginTime: '2026-05-19', endTime: '2026-05-20' },
  { label: '上周', beginTime: '2026-05-11', endTime: '2026-05-17' },
  { label: '本周', beginTime: '2026-05-18', endTime: '2026-05-24' },
  { label: '上月', beginTime: '2026-04-01', endTime: '2026-04-30' },
  { label: '本月', beginTime: '2026-05-01', endTime: '2026-05-31' },
]

export function OrderLedgerPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [request, setRequest] = useState(() => createPageRequest(location.search))
  const [dashboard, setDashboard] = useState<OrderLedgerDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [projectPanelOpen, setProjectPanelOpen] = useState(false)
  const [projectDraft, setProjectDraft] = useState<string[]>([])
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [roomDraft, setRoomDraft] = useState<string[]>([])
  const [detailRecord, setDetailRecord] = useState<OrderLedgerRecord | null>(null)
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)

  useEffect(() => {
    const abort = new AbortController()

    fetchOrderLedgerDashboard(request, abort.signal)
      .then((nextDashboard) => {
        setDashboard(nextDashboard)
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return
        setDashboard(null)
        setError(reason instanceof Error ? reason.message : '收支明细数据加载失败')
      })
      .finally(() => {
        if (!abort.signal.aborted) {
          setLoading(false)
        }
      })

    return () => abort.abort()
  }, [request, reloadKey])

  const provider = dashboard?.provider ?? resolveOrderLedgerProvider(location.search)
  const state = request.state ?? resolveOrderLedgerMockState(location.search)
  const activeRequest = dashboard?.request ?? request
  const selectedPreset = useMemo(
    () =>
      datePresets.find(
        (item) => item.beginTime === activeRequest.beginTime && item.endTime === activeRequest.endTime,
      )?.label ?? '',
    [activeRequest.beginTime, activeRequest.endTime],
  )
  const detail = detailRecord?.detail ?? null
  const records = dashboard?.records ?? []
  const summary = dashboard?.summary ?? { netIncome: 0, totalIncome: 0, totalExpense: 0 }
  const roomLabel = roomSelectionLabel(activeRequest.roomIds, dashboard?.roomOptions ?? [])
  const projectLabel = projectSelectionLabel(activeRequest.paymentTypeIds, dashboard?.projectOptions ?? [])
  const paymentLabel = optionLabelById(
    activeRequest.paymentWayIds[0],
    dashboard?.paymentWayOptions ?? [],
    '请选择支付方式',
  )
  const typeValue = typeValueFromRequest(activeRequest)
  const sourceValue = sourceValueFromRequest(activeRequest)
  const isEmpty = !loading && !error && records.length === 0

  function patchRequest(patch: Partial<OrderLedgerRequest>) {
    setNotice('')
    setError('')
    setLoading(true)
    setOpenSelect(null)
    setProjectPanelOpen(false)
    setRequest((current) => ({ ...current, ...patch, pageNum: 1 }))
  }

  function handleTypeChange(value: TypeValue) {
    const nextIncome = value === 'income' ? 1 : value === 'expense' ? 0 : null
    patchRequest({
      isIncome: nextIncome,
      paymentTypeIds: [],
    })
  }

  function handleSourceChange(value: SourceValue) {
    const nextType = value === 'stayOrder' ? 1 : value === 'manualEntry' ? 2 : null
    patchRequest({ type: nextType })
  }

  function resetFilters() {
    setNotice('')
    setError('')
    setLoading(true)
    setOpenSelect(null)
    setProjectPanelOpen(false)
    setRoomDialogOpen(false)
    setMoreActionsOpen(false)
    setDetailRecord(null)
    setRequest(createPageRequest(location.search))
  }

  async function handleExport() {
    const result = await createOrderLedgerExportTask(activeRequest)
    setNotice(`导出任务已创建：${result.data.taskId}`)
  }

  function handleRetry() {
    setNotice('')
    setError('')
    setLoading(true)
    setReloadKey((value) => value + 1)
  }

  function openProjectPanel() {
    setOpenSelect(null)
    setProjectDraft(activeRequest.paymentTypeIds)
    setProjectPanelOpen(true)
  }

  function toggleProject(projectId: string) {
    setProjectDraft((current) =>
      current.includes(projectId) ? current.filter((item) => item !== projectId) : [...current, projectId],
    )
  }

  function openRoomDialog() {
    setOpenSelect(null)
    setProjectPanelOpen(false)
    setRoomDraft(activeRequest.roomIds)
    setRoomDialogOpen(true)
  }

  function toggleRoom(roomId: string) {
    setRoomDraft((current) =>
      current.includes(roomId) ? current.filter((item) => item !== roomId) : [...current, roomId],
    )
  }

  return (
    <div className="order-ledger-page">
      <h1 className="sr-only-heading">收支明细</h1>
      <div
        id="order-ledger-diagnostics"
        hidden
        data-provider={provider}
        data-state={state}
        data-request={JSON.stringify(activeRequest)}
      />

      <section className="order-ledger-filter" aria-label="收支明细筛选">
        <div className="order-ledger-store-row" aria-label="门店">
          <button
            type="button"
            className={activeRequest.poiIds.length === 0 ? 'is-active' : ''}
            aria-pressed={activeRequest.poiIds.length === 0}
            onClick={() => patchRequest({ poiIds: [] })}
          >
            全部门店
          </button>
          {(dashboard?.stores ?? []).map((store) => {
            const selected = activeRequest.poiIds.includes(store.id)
            return (
              <button
                key={store.id}
                type="button"
                className={selected ? 'is-active' : ''}
                aria-pressed={selected}
                onClick={() => patchRequest({ poiIds: [store.id] })}
              >
                {store.name}
              </button>
            )
          })}
          <button type="button" className="order-ledger-gear" aria-label="门店设置">
            ⚙
          </button>
        </div>

        <div className="order-ledger-presets" role="group" aria-label="日期快捷筛选">
          {datePresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              className={selectedPreset === preset.label ? 'is-active' : ''}
              onClick={() => patchRequest({ beginTime: preset.beginTime, endTime: preset.endTime })}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="order-ledger-date-range" aria-label="账本日期">
          <input aria-label="开始日期" value={activeRequest.beginTime} readOnly />
          <span>至</span>
          <input aria-label="结束日期" value={activeRequest.endTime} readOnly />
        </div>

        <SelectField
          label="类型"
          value={labelForType(typeValue)}
          kind="type"
          openSelect={openSelect}
          optionLabel="类型选项"
          options={[
            { value: 'all', label: '全部类型' },
            { value: 'income', label: '收入' },
            { value: 'expense', label: '支出' },
          ]}
          onToggle={() => setOpenSelect(openSelect === 'type' ? null : 'type')}
          onSelect={(value) => handleTypeChange(value as TypeValue)}
        />

        <SelectField
          label="来源"
          value={labelForSource(sourceValue)}
          kind="source"
          openSelect={openSelect}
          optionLabel="来源选项"
          options={[
            { value: 'all', label: '全部来源' },
            { value: 'stayOrder', label: '住宿订单' },
            { value: 'manualEntry', label: '记一笔' },
          ]}
          onToggle={() => setOpenSelect(openSelect === 'source' ? null : 'source')}
          onSelect={(value) => handleSourceChange(value as SourceValue)}
        />

        <div className="order-ledger-select-field">
          <span className="order-ledger-select-label">项目：</span>
          <button type="button" aria-label={`项目 ${projectLabel}`} onClick={openProjectPanel}>
            <strong>{projectLabel}</strong>
          </button>
          {projectPanelOpen ? (
            <section className="order-ledger-project-panel" aria-label="项目选项">
              {activeRequest.isIncome === null ? (
                <p className="order-ledger-project-empty-hint">请先选择类型，再筛选项目。</p>
              ) : (
                <>
                  <div className="order-ledger-project-options">
                    {(dashboard?.projectOptions ?? []).map((option) => (
                      <label key={option.value} className="order-ledger-checkbox">
                        <input
                          type="checkbox"
                          checked={projectDraft.includes(option.value)}
                          onChange={() => toggleProject(option.value)}
                        />
                        <span>{option.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="order-ledger-project-actions">
                    <button type="button" onClick={() => setProjectPanelOpen(false)}>
                      取消项目
                    </button>
                    <button
                      type="button"
                      className="is-primary"
                      onClick={() => {
                        patchRequest({ paymentTypeIds: projectDraft })
                      }}
                    >
                      确定项目
                    </button>
                  </div>
                </>
              )}
            </section>
          ) : null}
        </div>

        <label className="order-ledger-keyword">
          <span>搜索：</span>
          <input
            aria-label="搜索关键词"
            placeholder="输入支付流水号/订单号"
            value={activeRequest.keyword}
            onChange={(event) => patchRequest({ keyword: event.target.value })}
          />
        </label>

        <button
          type="button"
          className="order-ledger-room-select"
          aria-label={`关联房间 ${roomLabel}`}
          onClick={openRoomDialog}
        >
          <span>关联房间</span>
          <strong>{roomLabel}</strong>
        </button>

        <SelectField
          label="支付方式"
          value={paymentLabel}
          kind="payment"
          openSelect={openSelect}
          optionLabel="支付方式选项"
          options={(dashboard?.paymentWayOptions ?? []).map((item) => ({ value: item.value, label: item.label }))}
          onToggle={() => setOpenSelect(openSelect === 'payment' ? null : 'payment')}
          onSelect={(value) => patchRequest({ paymentWayIds: [value] })}
        />

        <div className="order-ledger-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重置
          </button>
          <button type="button" className="is-primary" onClick={handleExport} disabled={loading || Boolean(error)}>
            导出
          </button>
        </div>
      </section>

      {notice ? (
        <div className="order-ledger-notice" role="status" aria-label="收支明细操作反馈">
          {notice}
        </div>
      ) : null}

      {error ? (
        <section className="order-ledger-error" role="alert" aria-label="收支明细错误反馈">
          <strong>收支明细数据加载失败</strong>
          <p>{error}</p>
          <button type="button" onClick={handleRetry}>
            重新加载
          </button>
        </section>
      ) : null}

      <section className="order-ledger-summary" aria-label="账本概括">
        <h2>账本概括</h2>
        <div className="order-ledger-summary-grid">
          {[
            ['净收入', formatMoney(summary.netIncome)],
            ['总收入', formatMoney(summary.totalIncome)],
            ['总支出', formatMoney(summary.totalExpense)],
          ].map(([label, value]) => (
            <article key={label}>
              <span aria-hidden="true">¥</span>
              <p>{label}</p>
              <strong>{value}</strong>
            </article>
          ))}
        </div>
      </section>

      {loading ? <div className="order-ledger-loading">正在加载收支明细数据...</div> : null}

      {isEmpty ? (
        <section className="order-ledger-empty" role="status">
          <strong>当前筛选条件下暂无收支流水</strong>
          <p>请调整类型、来源、项目、房间或日期条件后重新查看。</p>
        </section>
      ) : null}

      <section className="order-ledger-table-section" aria-label="账本明细表格">
        <h2>账本明细</h2>
        <div className="order-ledger-table-scroll">
          <table className="order-ledger-table">
            <thead>
              <tr>
                {[
                  '类型',
                  '来源',
                  '订单号',
                  '项目',
                  '金额',
                  '欠款',
                  '支付方式',
                  '支付流水号',
                  '支付时间',
                  '创建时间',
                  '关联房型/房间',
                  '备注',
                  '操作人',
                  '操作',
                ].map((heading) => (
                  <th key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length > 0
                ? records.map((record) => (
                    <tr key={record.id}>
                      <td>{record.typeLabel}</td>
                      <td>{record.sourceLabel}</td>
                      <td>
                        <button type="button" className="order-ledger-link" onClick={() => setDetailRecord(record)}>
                          {record.orderId}
                        </button>
                      </td>
                      <td>{record.projectLabel}</td>
                      <td>{record.amount.toFixed(2)}</td>
                      <td>{record.debtAmount.toFixed(2)}</td>
                      <td>{record.paymentWayLabel}</td>
                      <td>{record.paymentNo}</td>
                      <td>{record.paymentTime}</td>
                      <td>{record.createdAt}</td>
                      <td>{record.roomLabel}</td>
                      <td>{record.remark}</td>
                      <td>{record.operatorName}</td>
                      <td>
                        <button type="button" className="order-ledger-link" onClick={() => setDetailRecord(record)}>
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))
                : !loading && (
                    <tr>
                      <td className="order-ledger-empty-cell" colSpan={14}>
                        暂无数据
                      </td>
                    </tr>
                  )}
            </tbody>
          </table>
        </div>
        <nav className="order-ledger-pagination" aria-label="分页">
          <span>
            {paginationText(
              dashboard?.pagination.page ?? 1,
              dashboard?.pagination.pageSize ?? 10,
              dashboard?.pagination.total ?? 0,
            )}
          </span>
          <button type="button" aria-label="上一页" disabled>
            {'<'}
          </button>
          <button type="button" className="is-current">
            {dashboard?.pagination.page ?? 1}
          </button>
          <button type="button" aria-label="下一页" disabled>
            {'>'}
          </button>
          <button type="button">{dashboard?.pagination.pageSize ?? 10} 条/页</button>
        </nav>
      </section>

      {roomDialogOpen ? (
        <RoomDialog
          groups={dashboard?.roomOptions ?? []}
          selectedRoomIds={roomDraft}
          onClose={() => setRoomDialogOpen(false)}
          onToggleRoom={toggleRoom}
          onConfirm={() => {
            setRoomDialogOpen(false)
            patchRequest({ roomIds: roomDraft })
          }}
        />
      ) : null}

      {detail ? (
        <>
          <aside className="order-ledger-drawer" aria-label="订单详情抽屉">
            <header>
              <strong>订单详情</strong>
              <button type="button" className="is-tag">
                全天房
              </button>
              <button
                type="button"
                aria-label="关闭订单详情"
                onClick={() => {
                  setDetailRecord(null)
                  setMoreActionsOpen(false)
                }}
              >
                ×
              </button>
            </header>

            <section className="order-ledger-order-card">
              <div>
                <span>{detail.channelName}</span>
                <strong>渠道单号：{detail.channelOrderNo}</strong>
              </div>
              <p>{detail.roomLabel}</p>
              <small>{detail.statusLabel}</small>
              <b>¥ {detail.totalAmount.toFixed(2)}</b>
            </section>

            <section className="order-ledger-drawer-block">
              <h3>
                {detail.breakdownTitle}：¥{detail.breakdownAmount.toFixed(2)}
              </h3>
              <span>订单总收入 ¥ {detail.totalIncome.toFixed(2)}</span>
              <table>
                <tbody>
                  <tr>
                    <th>房间/日期</th>
                    <th>{detail.roomBreakdown[0]?.date ?? '-'}</th>
                  </tr>
                  {detail.roomBreakdown.map((item) => (
                    <tr key={`${item.date}-${item.roomLabel}`}>
                      <td>{item.roomLabel}</td>
                      <td>{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="order-ledger-drawer-block is-list">
              {detail.extraLines.map((item) => (
                <p key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.primary}</strong>
                  {item.secondary ? <em>{item.secondary}</em> : null}
                </p>
              ))}
            </section>

            <footer>
              <span>
                {detail.breakdownTitle}：<b>¥{detail.breakdownAmount.toFixed(2)}</b>
              </span>
              <div className="order-ledger-more-actions">
                <button type="button" onClick={() => setMoreActionsOpen((current) => !current)}>
                  更多操作
                </button>
                {moreActionsOpen ? (
                  <div className="order-ledger-more-menu">
                    <button type="button" onClick={() => navigate('/order/house-order/list')}>
                      查看订单页
                    </button>
                    <button type="button" onClick={() => navigate('/statistics/roomSituation')}>
                      查看房态页
                    </button>
                  </div>
                ) : null}
              </div>
              <button type="button" className="is-primary">
                收款
              </button>
            </footer>
          </aside>

          <div className="order-ledger-payment-layer">
            <section className="order-ledger-payment-dialog" role="dialog" aria-modal="true" aria-label="收款记录">
              <header>
                <button type="button" disabled>
                  收款款项
                </button>
                <button type="button" className="is-active">
                  收款记录
                </button>
                <button
                  type="button"
                  aria-label="关闭收款记录"
                  onClick={() => {
                    setDetailRecord(null)
                    setMoreActionsOpen(false)
                  }}
                >
                  ×
                </button>
              </header>
              {detail.paymentRecords.length === 0 ? (
                <div className="order-ledger-payment-empty">空空如也</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>类型</th>
                      <th>房间</th>
                      <th>项目</th>
                      <th>支付方式</th>
                      <th>金额(¥)</th>
                      <th>支付单号</th>
                      <th>日期</th>
                      <th>备注</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.paymentRecords.map((item) => (
                      <tr key={item.id}>
                        <td>{item.typeLabel}</td>
                        <td>{item.roomLabel}</td>
                        <td>{item.projectLabel}</td>
                        <td>{item.paymentWayLabel}</td>
                        <td>{item.amount.toFixed(2)}</td>
                        <td>{item.paymentNo}</td>
                        <td>{item.paidAt}</td>
                        <td>{item.remark}</td>
                        <td>
                          <button type="button">{item.actionLabel}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  )
}

function SelectField({
  label,
  value,
  kind,
  openSelect,
  optionLabel,
  options,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  optionLabel: string
  options: Array<{ value: string; label: string }>
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="order-ledger-select-field">
      <span className="order-ledger-select-label">{label}：</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={openSelect === kind}
        aria-label={`${label} ${value}`}
        onClick={onToggle}
      >
        <strong>{value}</strong>
      </button>
      {openSelect === kind ? (
        <div className="order-ledger-options" role="listbox" aria-label={optionLabel}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.label}
              onClick={() => onSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function RoomDialog({
  groups,
  selectedRoomIds,
  onClose,
  onToggleRoom,
  onConfirm,
}: {
  groups: OrderLedgerRoomNode[]
  selectedRoomIds: string[]
  onClose: () => void
  onToggleRoom: (roomId: string) => void
  onConfirm: () => void
}) {
  return (
    <div className="order-ledger-dialog-layer">
      <section className="order-ledger-room-dialog" role="dialog" aria-modal="true" aria-label="选择房间">
        <header>
          <strong>选择房间</strong>
          <button type="button" aria-label="关闭选择房间" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="order-ledger-room-dialog__toolbar">
          <input placeholder="输入房间/房型名称" readOnly value="" />
          <button type="button">搜索</button>
        </div>
        <div className="order-ledger-room-tree">
          {groups.map((group) => (
            <div key={group.roomCategoryId} className="order-ledger-room-group">
              <strong>{group.roomCategoryName}</strong>
              {group.rooms.map((room) => {
                const label = `${group.roomCategoryName} ${room.roomName}`
                return (
                  <label key={room.roomId} className="order-ledger-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedRoomIds.includes(room.roomId)}
                      onChange={() => onToggleRoom(room.roomId)}
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={onConfirm}>
            确定房间
          </button>
        </footer>
      </section>
    </div>
  )
}

function createPageRequest(search: string) {
  return defaultOrderLedgerRequest(resolveOrderLedgerMockState(search))
}

function typeValueFromRequest(request: OrderLedgerRequest): TypeValue {
  if (request.isIncome === 1) return 'income'
  if (request.isIncome === 0) return 'expense'
  return 'all'
}

function sourceValueFromRequest(request: OrderLedgerRequest): SourceValue {
  if (request.type === 1) return 'stayOrder'
  if (request.type === 2) return 'manualEntry'
  return 'all'
}

function labelForType(value: TypeValue) {
  if (value === 'income') return '收入'
  if (value === 'expense') return '支出'
  return '全部类型'
}

function labelForSource(value: SourceValue) {
  if (value === 'stayOrder') return '住宿订单'
  if (value === 'manualEntry') return '记一笔'
  return '全部来源'
}

function optionLabelById(id: string | undefined, options: Array<{ value: string; label: string }>, fallback: string) {
  if (!id) return fallback
  return options.find((item) => item.value === id)?.label ?? fallback
}

function projectSelectionLabel(selectedIds: string[], options: Array<{ value: string; label: string }>) {
  if (selectedIds.length === 0) return '请选择项目'
  const labels = options.filter((item) => selectedIds.includes(item.value)).map((item) => item.label)
  return labels[0] ?? '请选择项目'
}

function roomSelectionLabel(selectedIds: string[], groups: OrderLedgerRoomNode[]) {
  if (selectedIds.length === 0) return '全部'

  for (const group of groups) {
    const room = group.rooms.find((item) => selectedIds.includes(item.roomId))
    if (room) {
      return `${group.roomCategoryName} ${room.roomName}`
    }
  }

  return '全部'
}

function paginationText(page: number, pageSize: number, total: number) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = total === 0 ? 0 : Math.min(page * pageSize, total)
  return `第 ${start}-${end} 条，共 ${total} 条`
}

function formatMoney(value: number) {
  return `¥ ${value.toFixed(2)}`
}
