import { useEffect, useMemo, useRef, useState } from 'react'
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
type DatePickTarget = 'start' | 'end'
type DatePanelPosition = { top: number; left: number }
type DetailTabKey = 'order' | 'channel' | 'log'

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
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTabKey>('order')
  const [moreActionsOpen, setMoreActionsOpen] = useState(false)
  const [isDatePanelOpen, setIsDatePanelOpen] = useState(false)
  const [datePickTarget, setDatePickTarget] = useState<DatePickTarget>('start')
  const [calendarMonth, setCalendarMonth] = useState(() => request.beginTime.slice(0, 7))
  const [datePanelPosition, setDatePanelPosition] = useState<DatePanelPosition>({ top: 0, left: 0 })
  const [dateDraft, setDateDraft] = useState(() => ({ beginTime: request.beginTime, endTime: request.endTime }))
  const dateRangeRef = useRef<HTMLDivElement | null>(null)
  const searchRef = useRef(location.search)

  useEffect(() => {
    if (searchRef.current === location.search) return
    searchRef.current = location.search
    setDashboard(null)
    setError('')
    setNotice('')
    setLoading(true)
    setOpenSelect(null)
    setProjectPanelOpen(false)
    setRoomDialogOpen(false)
    setDetailRecord(null)
    setActiveDetailTab('order')
    setMoreActionsOpen(false)
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
    setRequest(createPageRequest(location.search))
  }, [location.search])

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
  const roomBreakdownDates = Array.from(new Set(detail?.roomBreakdown.map((item) => item.date) ?? []))
  const roomBreakdownLabels = Array.from(new Set(detail?.roomBreakdown.map((item) => item.roomLabel) ?? []))
  const detailLogs = detailRecord
    ? [
        `${detailRecord.createdAt} 创建账本明细`,
        `${detailRecord.paymentTime || detailRecord.createdAt} 记录支付流水 ${detailRecord.paymentNo}`,
        `${detailRecord.createdAt} 操作人 ${detailRecord.operatorName} 提交 ${detailRecord.projectLabel}`,
      ]
    : []
  const channelSections = detailRecord
    ? [
        {
          key: 'basic',
          title: '基础信息',
          items: [
            { label: '渠道', value: detail?.channelName ?? '-' },
            { label: '渠道单号', value: detail?.channelOrderNo ?? '-' },
            { label: '订单号', value: detailRecord.orderId },
            { label: '来源', value: detailRecord.sourceLabel },
          ],
        },
        {
          key: 'settlement',
          title: '结算信息',
          items: [
            { label: '支付方式', value: detailRecord.paymentWayLabel },
            { label: '支付流水号', value: detailRecord.paymentNo },
            { label: '支付时间', value: detailRecord.paymentTime || '-' },
            { label: '创建时间', value: detailRecord.createdAt },
          ],
        },
      ]
    : []

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

  function openDatePanel(target: DatePickTarget = 'start') {
    setOpenSelect(null)
    setProjectPanelOpen(false)
    setDatePickTarget(target)
    setDateDraft({ beginTime: activeRequest.beginTime, endTime: activeRequest.endTime })
    setCalendarMonth(activeRequest.beginTime.slice(0, 7))
    const rect = dateRangeRef.current?.getBoundingClientRect()
    if (rect) {
      setDatePanelPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - 624)),
      })
    }
    setIsDatePanelOpen(true)
  }

  function applyDateSelection(date: string) {
    if (datePickTarget === 'start') {
      const nextEndTime = date <= dateDraft.endTime ? dateDraft.endTime : date
      setDateDraft({ beginTime: date, endTime: nextEndTime })
      setDatePickTarget('end')
      return
    }

    const nextBeginTime = date < dateDraft.beginTime ? date : dateDraft.beginTime
    const nextEndTime = date < dateDraft.beginTime ? dateDraft.beginTime : date
    setDateDraft({ beginTime: nextBeginTime, endTime: nextEndTime })
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
    patchRequest({ beginTime: nextBeginTime, endTime: nextEndTime })
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
    setActiveDetailTab('order')
    setIsDatePanelOpen(false)
    setDatePickTarget('start')
    setRequest(createPageRequest(location.search))
  }

  async function handleExport() {
    const result = await createOrderLedgerExportTask(activeRequest)
    setNotice(`导出任务已创建：${result.data.taskId}`)
  }

  function openDetail(record: OrderLedgerRecord) {
    setDetailRecord(record)
    setActiveDetailTab('order')
    setMoreActionsOpen(false)
  }

  function closeDetail() {
    setDetailRecord(null)
    setActiveDetailTab('order')
    setMoreActionsOpen(false)
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
        <div className="order-ledger-filter__top">
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
            <button
              type="button"
              className="order-ledger-gear"
              aria-label="门店设置"
              onClick={() => navigate('/InformationMaintenance/campInfo')}
            >
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

          <div
            ref={dateRangeRef}
            className="order-ledger-date-range"
            aria-label="账本日期"
            role="button"
            tabIndex={0}
            onClick={() => openDatePanel('start')}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openDatePanel('start')
              }
            }}
          >
            <button
              type="button"
              className="order-ledger-date-field"
              aria-label="开始日期"
              onClick={(event) => {
                event.stopPropagation()
                openDatePanel('start')
              }}
            >
              {activeRequest.beginTime}
            </button>
            <span>至</span>
            <button
              type="button"
              className="order-ledger-date-field"
              aria-label="结束日期"
              onClick={(event) => {
                event.stopPropagation()
                openDatePanel('end')
              }}
            >
              {activeRequest.endTime}
            </button>
            <i aria-hidden="true" />
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
            <span className="order-ledger-select-label">项目:</span>
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
        </div>

        <div className="order-ledger-filter__bottom">
          <label className="order-ledger-keyword">
            <span>搜索:</span>
            <input
              aria-label="搜索关键字"
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
        </div>
      </section>

      {isDatePanelOpen ? (
        <DatePanel
          month={calendarMonth}
          startDate={dateDraft.beginTime}
          endDate={dateDraft.endTime}
          pickTarget={datePickTarget}
          position={datePanelPosition}
          onClose={() => {
            setIsDatePanelOpen(false)
            setDatePickTarget('start')
            setDateDraft({ beginTime: activeRequest.beginTime, endTime: activeRequest.endTime })
          }}
          onPrevious={() => setCalendarMonth((current) => shiftMonth(current, -1))}
          onNext={() => setCalendarMonth((current) => shiftMonth(current, 1))}
          onPick={applyDateSelection}
        />
      ) : null}

      <div className="sr-only-heading" role="status" aria-label="收支明细操作反馈">
        {notice}
      </div>

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
                        <button type="button" className="order-ledger-link" onClick={() => openDetail(record)}>
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
                        <button type="button" className="order-ledger-link" onClick={() => openDetail(record)}>
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
          <aside className="month-order-drawer order-ledger-detail-drawer" role="dialog" aria-label="订单详情">
            <header className="month-order-drawer__header">
              <div>
                <strong>订单详情</strong>
                <span>全天房</span>
              </div>
              <button type="button" aria-label="关闭订单详情" onClick={closeDetail}>
                ×
              </button>
            </header>

            <nav className="month-order-drawer__tabs" aria-label="订单详情标签">
              <button type="button" className={activeDetailTab === 'order' ? 'is-active' : ''} onClick={() => setActiveDetailTab('order')}>
                订单信息
              </button>
              <button
                type="button"
                className={activeDetailTab === 'channel' ? 'is-active' : ''}
                onClick={() => setActiveDetailTab('channel')}
              >
                渠道信息
              </button>
              <button type="button" className={activeDetailTab === 'log' ? 'is-active' : ''} onClick={() => setActiveDetailTab('log')}>
                操作日志
              </button>
            </nav>

            <div className="month-order-drawer__body">
              {activeDetailTab === 'order' ? (
                <>
                  <section className="month-order-card">
                    <div className="month-order-card__guest">
                      <strong>{detail.guestSummary || detailRecord?.operatorName || '未登记客人'}</strong>
                      <span>{detail.channelName}</span>
                    </div>
                    <p>渠道单号：{detail.channelOrderNo || '-'}</p>
                    <p>订单号：{detailRecord?.orderId || '-'}</p>
                  </section>

                  <section className="month-room-order-card">
                    <div className="month-room-order-card__top">
                      <strong>{detail.roomLabel}</strong>
                      <span>{detail.statusLabel}</span>
                    </div>
                    <div className="month-room-order-card__stay">{detail.stayRange}</div>
                    <div className="month-room-order-card__amount">{formatMoney(detail.totalAmount)}</div>
                    <div className="month-room-order-card__guest">
                      <span>关联产品：{detail.productName || '-'}</span>
                      <button type="button" onClick={() => navigate('/statistics/houseMonth')}>
                        查看月房态
                      </button>
                    </div>
                    <em>{detailRecord?.roomLabel || detail.roomLabel}</em>
                  </section>

                  <section className="month-finance-card">
                    <div className="month-finance-summary">
                      <span>
                        {detail.breakdownTitle}：<strong>{formatMoney(detail.breakdownAmount)}</strong>
                      </span>
                      <span>
                        订单总收入：<strong>{formatMoney(detail.totalIncome)}</strong>
                      </span>
                    </div>
                    <div className="month-finance-meta">
                      <span>支付方式：{detailRecord?.paymentWayLabel || '-'}</span>
                      <span>支付流水：{detailRecord?.paymentNo || '-'}</span>
                      <span>欠款：{formatMoney(detailRecord?.debtAmount ?? 0)}</span>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>房间/日期</th>
                          {roomBreakdownDates.map((date) => (
                            <th key={date}>{date}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roomBreakdownLabels.map((roomName) => (
                          <tr key={roomName}>
                            <td>{roomName}</td>
                            {roomBreakdownDates.map((date) => {
                              const amount =
                                detail.roomBreakdown.find((item) => item.roomLabel === roomName && item.date === date)?.amount ?? 0
                              return <td key={`${roomName}-${date}`}>{amount ? amount.toFixed(2) : '-'}</td>
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>

                  {detail.extraLines.map((item) => (
                    <section key={item.title} className="month-info-block month-order-section-row">
                      <div className="month-order-section-header month-order-section-header--summary">
                        <h3>{item.title}</h3>
                        <div className="month-order-section-summary">
                          <span>{item.primary}</span>
                          {item.secondary ? <span>{item.secondary}</span> : null}
                        </div>
                      </div>
                    </section>
                  ))}

                  <section className="month-info-block month-order-section-row">
                    <div className="month-order-section-header month-order-section-header--summary">
                      <h3>收款记录</h3>
                      <div className="month-order-section-summary">
                        <span>{detail.paymentRecords.length} 条</span>
                      </div>
                    </div>
                    {detail.paymentRecords.length === 0 ? (
                      <div className="month-order-empty-table">暂无收款记录</div>
                    ) : (
                      <div className="order-ledger-detail-table-wrap">
                        <table className="order-ledger-detail-table">
                          <thead>
                            <tr>
                              <th>类型</th>
                              <th>房间</th>
                              <th>项目</th>
                              <th>支付方式</th>
                              <th>金额(元)</th>
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
                      </div>
                    )}
                  </section>

                  <section className="month-info-block month-order-section-row">
                    <div className="month-order-key-value-list">
                      <div className="month-order-key-value-row">
                        <span>创建时间</span>
                        <strong>{detailRecord?.createdAt || '-'}</strong>
                      </div>
                      <div className="month-order-key-value-row">
                        <span>操作人</span>
                        <strong>{detailRecord?.operatorName || '-'}</strong>
                      </div>
                      <div className="month-order-key-value-row">
                        <span>备注</span>
                        <strong>{detailRecord?.remark || '-'}</strong>
                      </div>
                    </div>
                  </section>
                </>
              ) : null}

              {activeDetailTab === 'channel' ? (
                <section className="month-channel-panel">
                  {channelSections.map((section) => (
                    <section key={section.key} className="month-channel-section">
                      <div className="month-channel-section__header">
                        <h3>{section.title}</h3>
                      </div>
                      <div className="month-channel-grid">
                        {section.items.map((item) => (
                          <div key={item.label} className="month-channel-kv">
                            <span>{item.label}:</span>
                            <strong>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </section>
              ) : null}

              {activeDetailTab === 'log' ? (
                <section className="month-info-block month-info-block--plain">
                  <h3>操作日志</h3>
                  <ul className="month-log-list">
                    {detailLogs.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <footer className="month-order-drawer__footer">
              <div className="month-order-footer-row">
                <div>
                  <span>{detail.breakdownTitle}：{formatMoney(detail.breakdownAmount)}</span>
                  <span>订单总收入：{formatMoney(detail.totalIncome)}</span>
                </div>
                <button type="button" onClick={() => setMoreActionsOpen((current) => !current)}>
                  更多操作
                </button>
                <button type="button" className="is-primary" onClick={() => setActiveDetailTab('order')}>
                  查看详情
                </button>
                {moreActionsOpen ? (
                  <div className="month-order-more-menu" role="menu" aria-label="更多操作">
                    <button type="button" role="menuitem" onClick={() => navigate('/order/house-order/list')}>
                      查看订单页
                    </button>
                    <button type="button" role="menuitem" onClick={() => navigate('/statistics/roomSituation')}>
                      查看房态页
                    </button>
                  </div>
                ) : null}
              </div>
            </footer>
          </aside>

          {detail.channelName === '__legacy__' ? (
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
              <span>订单总收入：¥ {detail.totalIncome.toFixed(2)}</span>
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
        </>
      ) : null}
    </div>
  )
}

function DatePanel({
  month,
  startDate,
  endDate,
  pickTarget,
  position,
  onClose,
  onPrevious,
  onNext,
  onPick,
}: {
  month: string
  startDate: string
  endDate: string
  pickTarget: DatePickTarget
  position: DatePanelPosition
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onPick: (date: string) => void
}) {
  const months = [month, shiftMonth(month, 1)]

  return (
    <div className="order-ledger-date-panel-wrap" role="presentation" onMouseDown={onClose}>
      <section
        className="order-ledger-date-panel"
        role="dialog"
        aria-label="收支明细日期面板"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="order-ledger-date-panel__header">
          <strong>{pickTarget === 'start' ? '请选择开始日期' : '请选择结束日期'}</strong>
          <button type="button" aria-label="关闭收支明细日期面板" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="order-ledger-date-panel__range">
          <span>{startDate}</span>
          <em>至</em>
          <span>{endDate}</span>
        </div>
        <div className="order-ledger-date-panel__months">
          {months.map((item, index) => (
            <CalendarMonth
              key={item}
              month={item}
              startDate={startDate}
              endDate={endDate}
              onPrevious={index === 0 ? onPrevious : undefined}
              onNext={index === months.length - 1 ? onNext : undefined}
              onPick={onPick}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function CalendarMonth({
  month,
  startDate,
  endDate,
  onPrevious,
  onNext,
  onPick,
}: {
  month: string
  startDate: string
  endDate: string
  onPrevious?: () => void
  onNext?: () => void
  onPick: (date: string) => void
}) {
  const days = buildCalendarDays(month)

  return (
    <section className="order-ledger-calendar-month" aria-label={formatMonthLabel(month)}>
      <header>
        <button type="button" aria-label="上个月" onClick={onPrevious} disabled={!onPrevious}>
          ‹
        </button>
        <strong>{formatMonthLabel(month)}</strong>
        <button type="button" aria-label="下个月" onClick={onNext} disabled={!onNext}>
          ›
        </button>
      </header>
      <div className="order-ledger-calendar-month__weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="order-ledger-calendar-month__days">
        {days.map((day) => {
          const inRange = day.date >= startDate && day.date <= endDate
          const isSelected = day.date === startDate || day.date === endDate
          return (
            <button
              key={day.date}
              type="button"
              aria-label={day.date}
              className={`${day.isMuted ? 'is-muted' : ''}${inRange ? ' is-in-range' : ''}${isSelected ? ' is-selected' : ''}`}
              onClick={() => onPick(day.date)}
            >
              {day.label}
            </button>
          )
        })}
      </div>
    </section>
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
      <span className="order-ledger-select-label">{label}:</span>
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

function shiftMonth(month: string, offset: number) {
  const [year, monthIndex] = month.split('-').map(Number)
  const nextDate = new Date(year, monthIndex - 1 + offset, 1)
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(month: string) {
  const [year, monthValue] = month.split('-')
  return `${year}年${Number(monthValue)}月`
}

function buildCalendarDays(month: string) {
  const [year, monthValue] = month.split('-').map(Number)
  const firstDay = new Date(year, monthValue - 1, 1)
  const startOffset = (firstDay.getDay() + 6) % 7
  const gridStart = new Date(year, monthValue - 1, 1 - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    return {
      date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      label: String(date.getDate()),
      isMuted: date.getMonth() !== monthValue - 1,
    }
  })
}

function formatMoney(value: number) {
  return `¥ ${value.toFixed(2)}`
}
