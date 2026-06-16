import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  assignCleanTask,
  cancelCleanTask,
  completeCleanTask,
  cleanTaskCreateEndpoint,
  cleanTaskExportEndpoint,
  cleanTaskNotifyEndpoint,
  createCleanTask,
  exportCleanTasks,
  fetchCleanTaskDashboard,
  notifyCleanTasks,
  startCleanTask,
  type CleanLookupOption,
  type CleanTaskDashboard,
  type CleanTaskFilters,
  type CleanTaskRecord,
  type CleanTaskScenario,
  type CleanTaskStatus,
  type CleanTaskType,
} from '../services/cleanTask'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import { resolveCurrentCampId } from '../services/storeOptions'
import './CleanTaskPage.css'

type CleanFilter = 'room' | 'type' | 'status' | 'cleaner' | null
type CleanTaskRowAction = 'assign' | 'start' | 'complete' | 'cancel'
type CleanTaskActionRunner = typeof assignCleanTask

const defaultFilters: CleanTaskFilters = {
  campId: '10001',
  poiId: 'ALL',
  cleanDate: '2026-05-18',
  roomId: 'ALL',
  cleanType: 'ALL',
  status: 'ALL',
  cleanerId: 'ALL',
  page: 1,
  pageSize: 20,
}

function createDefaultFilters(): CleanTaskFilters {
  return {
    ...defaultFilters,
    campId: resolveCurrentCampId(),
  }
}

export function CleanTaskPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialScenario = normalizeScenario(searchParams.get('scenario'))
  const initialDefaultsRef = useRef(createDefaultFilters())
  const [filters, setFilters] = useState<CleanTaskFilters>({
    ...initialDefaultsRef.current,
    campId: searchParams.get('campId') || initialDefaultsRef.current.campId,
    scenario: initialScenario,
  })
  const [dashboard, setDashboard] = useState<CleanTaskDashboard | null>(null)
  const [openFilter, setOpenFilter] = useState<CleanFilter>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedTask, setSelectedTask] = useState<CleanTaskRecord | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [remark, setRemark] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const initialLoadStartedRef = useRef(false)
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: (dashboard?.stores ?? [{ id: 'ALL', label: '全部门店' }]).map((store) => ({
      id: store.id === 'ALL' ? 'all' : store.id,
      label: store.label,
    })),
  })

  useEffect(() => {
    if (initialLoadStartedRef.current) return
    initialLoadStartedRef.current = true
    void loadData(filters)
    // Initial route state should drive the first provider call only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const nextScenario = normalizeScenario(searchParams.get('scenario'))
    if (filters.scenario === nextScenario) return
    void loadData({ ...filters, scenario: nextScenario, page: 1 })
    // Route query changes should refresh the scenario without resetting other filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  async function loadData(nextFilters: CleanTaskFilters, options: { successMessage?: string } = {}) {
    setLoading(true)
    setError('')
    setOpenFilter(null)
    try {
      const nextDashboard = await fetchCleanTaskDashboard(nextFilters)
      setDashboard(nextDashboard)
      setFilters(nextFilters)
      setSelectedIds([])
      if (options.successMessage) setFeedback(options.successMessage)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '保洁任务数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  function updateFilter(patch: Partial<CleanTaskFilters>) {
    setFilters((current) => ({ ...current, ...patch, page: 1, scenario: 'success' }))
  }

  function chooseFilter(option: CleanLookupOption) {
    if (openFilter === 'room') updateFilter({ roomId: option.id })
    if (openFilter === 'type') updateFilter({ cleanType: option.id as CleanTaskType })
    if (openFilter === 'status') updateFilter({ status: option.id as CleanTaskStatus })
    if (openFilter === 'cleaner') updateFilter({ cleanerId: option.id })
    setOpenFilter(null)
  }

  function resetFilters() {
    const nextDefaults = createDefaultFilters()
    const nextFilters = { ...nextDefaults, campId: searchParams.get('campId') || nextDefaults.campId, scenario: 'success' as const }
    void loadData(nextFilters, { successMessage: '筛选条件已重置' })
  }

  function moveDate(offset: number) {
    const nextDate = shiftDate(filters.cleanDate, offset)
    const nextFilters = { ...filters, cleanDate: nextDate, scenario: 'success' as const }
    void loadData(nextFilters, { successMessage: `已切换到 ${nextDate}` })
  }

  function toggleSelect(taskId: string, checked: boolean) {
    setSelectedIds((current) => (checked ? [...current, taskId] : current.filter((id) => id !== taskId)))
  }

  async function handleBatchNotify() {
    if (selectedIds.length === 0) return
    try {
      const result = await notifyCleanTasks(filters.campId, selectedIds)
      await loadData({ ...filters, scenario: 'success' }, {
        successMessage: `已通知 ${result.notifiedCount ?? selectedIds.length} 个任务`,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `通知接口 ${cleanTaskNotifyEndpoint.replace('/api', '')} 调用失败`)
    }
  }

  async function handleExport() {
    try {
      const result = await exportCleanTasks(filters)
      setFeedback(`已创建导出任务：${result.fileName}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `导出接口 ${cleanTaskExportEndpoint.replace('/api', '')} 调用失败`)
    }
  }

  async function handleCreateConfirm() {
    const roomId = filters.roomId !== 'ALL' ? filters.roomId : dashboard?.rooms[0]?.id
    const cleanerId = filters.cleanerId !== 'ALL' ? filters.cleanerId : dashboard?.cleaners[0]?.id

    if (!roomId) {
      setFeedback('请先选择房间后再创建保洁任务')
      return
    }

    try {
      const result = await createCleanTask({
        campId: filters.campId,
        poiId: filters.poiId === 'ALL' ? undefined : filters.poiId,
        roomId,
        cleanerId,
        cleanType: filters.cleanType !== 'ALL' ? filters.cleanType : 'CHECKOUT',
        cleanStatus: 'PENDING_CLEAN',
        cleanTime: filters.cleanDate,
        remark: remark.trim(),
      })
      setCreateOpen(false)
      setRemark('')
      await loadData({ ...filters, scenario: 'success' }, {
        successMessage: result.taskNo ? `保洁任务已创建：${result.taskNo}` : result.message || '保洁任务已创建',
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `创建接口 ${cleanTaskCreateEndpoint.replace('/api', '')} 调用失败`)
    }
  }

  async function handleTaskAction(task: CleanTaskRecord, action: CleanTaskRowAction) {
    const cleanerId = task.cleanerId || (filters.cleanerId !== 'ALL' ? filters.cleanerId : '') || dashboard?.cleaners[0]?.id
    if (action === 'assign' && !cleanerId) {
      setFeedback('请先配置保洁员后再分派任务')
      return
    }

    const payload = {
      campId: filters.campId,
      taskId: task.id,
      cleanerId: action === 'assign' ? cleanerId : undefined,
    }
    const actionMap = {
      assign: { label: '分派', run: assignCleanTask },
      start: { label: '开始', run: startCleanTask },
      complete: { label: '完成', run: completeCleanTask },
      cancel: { label: '取消', run: cancelCleanTask },
    } satisfies Record<CleanTaskRowAction, { label: string; run: CleanTaskActionRunner }>

    try {
      const result = await actionMap[action].run(payload)
      const actionResult = result as { message?: string }
      await loadData({ ...filters, scenario: 'success' }, {
        successMessage: actionResult.message || `任务 ${task.taskNo} 已${actionMap[action].label}`,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `任务 ${task.taskNo} ${actionMap[action].label}失败`)
    }
  }

  function handleMoreRoute(path: string) {
    setMoreOpen(false)
    navigate(path)
  }

  return (
    <div className="clean-task-page">
      <section className="clean-task-toolbar" aria-label="保洁任务筛选">
        <div className="clean-task-toolbar__top">
          <StoreSelectControl
            className="clean-store-tabs"
            label="门店筛选"
            options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
            value={filters.poiId === 'ALL' ? 'all' : filters.poiId}
            disabled={storeLoading}
            onChange={(storeId, option) => {
              const nextFilters = { ...filters, poiId: storeId === 'all' ? 'ALL' : storeId, scenario: 'success' as const }
              void loadData(nextFilters, { successMessage: `已切换门店：${option.name}` })
            }}
          />

          <label className="clean-date">
            <span>保洁日期：</span>
            <button type="button" aria-label="前一天" onClick={() => moveDate(-1)}>
              ‹
            </button>
            <input
              aria-label="保洁日期"
              type="date"
              value={filters.cleanDate}
              onChange={(event) => updateFilter({ cleanDate: event.target.value })}
            />
            <button type="button" aria-label="后一天" onClick={() => moveDate(1)}>
              ›
            </button>
          </label>

          <div className="clean-toolbar-actions">
            <button type="button" onClick={() => loadData({ ...filters, scenario: 'success' }, { successMessage: '数据已刷新' })}>
              刷新
            </button>
            <button type="button" onClick={handleExport}>
              导 出
            </button>
            <div className="clean-more">
              <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((open) => !open)}>
                更多
              </button>
              {moreOpen ? (
                <div className="clean-more-menu" role="menu" aria-label="更多操作">
                  <button type="button" role="menuitem" onClick={() => handleMoreRoute('/cleanManage/cleanStatistics')}>
                    查看保洁统计
                  </button>
                  <button type="button" role="menuitem" onClick={() => handleMoreRoute('/cleanManage/cleanLog')}>
                    查看保洁日志
                  </button>
                  <button type="button" role="menuitem" onClick={() => handleMoreRoute('/cleanManage/cleanSetting')}>
                    保洁规则设置
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="clean-task-toolbar__filters">
          <div className="clean-filter-wrap">
            <FilterButton
              label="房型房间"
              value={labelById(dashboard?.rooms, filters.roomId)}
              placeholder="请选择房型房间"
              name="room"
              options={dashboard?.rooms ?? []}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              filters={filters}
              onSelect={chooseFilter}
            />
            <FilterButton
              label="保洁类型"
              value={labelById(dashboard?.cleanTypes, filters.cleanType, 'ALL')}
              placeholder="请选择保洁类型"
              name="type"
              options={(dashboard?.cleanTypes ?? []).filter((item) => item.id !== 'ALL')}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              filters={filters}
              onSelect={chooseFilter}
            />
            <FilterButton
              label="保洁状态"
              value={labelById(dashboard?.statuses, filters.status, 'ALL')}
              placeholder="请选择保洁状态"
              name="status"
              options={(dashboard?.statuses ?? []).filter((item) => item.id !== 'ALL')}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              filters={filters}
              onSelect={chooseFilter}
            />
            <FilterButton
              label="保洁员"
              value={labelById(dashboard?.cleaners, filters.cleanerId)}
              placeholder="请选择保洁员"
              name="cleaner"
              options={dashboard?.cleaners ?? []}
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              filters={filters}
              onSelect={chooseFilter}
            />
          </div>

          <div className="clean-actions">
            <button type="button" onClick={resetFilters}>
              重 置
            </button>
            <button type="button" className="is-primary" onClick={() => loadData({ ...filters, scenario: 'success' })}>
              查 询
            </button>
            <button type="button" disabled={selectedIds.length === 0} onClick={handleBatchNotify}>
              批量通知
            </button>
            <button type="button" className="is-primary" onClick={() => setCreateOpen(true)}>
              创建保洁任务
            </button>
          </div>
        </div>

        <span role="status" aria-label="保洁任务操作反馈" className="clean-task-feedback">
          {feedback}
        </span>
      </section>

      {error ? (
        <div className="clean-task-alert" role="alert" aria-label="保洁任务数据错误">
          <strong>数据加载失败</strong>
          <span>{error}</span>
          <button type="button" onClick={() => loadData({ ...filters, scenario: 'success' })}>
            重试
          </button>
        </div>
      ) : null}

      <section className="clean-task-overview" aria-label="保洁任务概览">
        {summaryCards(dashboard).map((card) => (
          <button
            key={card.label}
            type="button"
            className={`clean-metric clean-metric--${card.tone}`}
            onClick={() => setFeedback(`${card.label}已选中，可在任务列表继续查看`)}
          >
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <em>{card.detail}</em>
          </button>
        ))}
      </section>

      <section className="clean-task-content">
        <div className="clean-chart" aria-label="保洁进度图表">
          <div className="clean-section-title">
            <strong>今日进度</strong>
            <span>{dashboard ? `更新时间 ${dashboard.updatedAt.slice(11, 16)}` : '加载中'}</span>
          </div>
          {progressRows(dashboard).map((item) => (
            <button
              key={item.label}
              type="button"
              className="clean-chart-row"
              onClick={() => setFeedback(`${item.label}任务已筛选`)}
            >
              <span>{item.label}</span>
              <i>
                <b style={{ width: `${item.percent}%` }} />
              </i>
              <em>{item.value}</em>
            </button>
          ))}
        </div>

        <div className="clean-quick" aria-label="保洁快捷入口">
          <div className="clean-section-title">
            <strong>快捷处理</strong>
          </div>
          <button type="button" onClick={() => navigate('/houseManage/days')}>
            查看日房态
          </button>
          <button type="button" onClick={() => navigate('/order/house-order/list')}>
            查看关联订单
          </button>
          <button type="button" onClick={() => navigate('/cleanManage/cleanStaff')}>
            调整保洁人员
          </button>
        </div>
      </section>

      <section className="clean-task-table" aria-label="保洁任务列表" aria-busy={loading}>
        <div className="clean-table-head">
          <span>选择</span>
          <span>任务编号</span>
          <span>操作</span>
          <span>房型房间</span>
          <span>类型</span>
          <span>状态</span>
          <span>保洁员</span>
          <span>计划时间</span>
        </div>
        {loading ? <div className="clean-table-state">保洁任务加载中...</div> : null}
        {!loading && dashboard && dashboard.tasks.length === 0 ? <div className="clean-table-state">当前筛选暂无保洁任务</div> : null}
        {!loading && dashboard?.tasks.map((task) => (
          <div className="clean-table-row" key={task.id}>
            <label className="clean-row-check">
              <input
                type="checkbox"
                aria-label={`选择 ${task.taskNo}`}
                checked={selectedIds.includes(task.id)}
                onChange={(event) => toggleSelect(task.id, event.target.checked)}
              />
            </label>
            <strong>{task.taskNo}</strong>
            <div className="clean-row-actions">
              <button type="button" aria-label={`查看详情 ${task.taskNo}`} onClick={() => setSelectedTask(task)}>
                详情
              </button>
              {task.status === 'PENDING_ASSIGN' ? (
                <button type="button" aria-label={`分派 ${task.taskNo}`} onClick={() => handleTaskAction(task, 'assign')}>
                  分派
                </button>
              ) : null}
              {task.status === 'PENDING_CLEAN' ? (
                <>
                  <button type="button" aria-label={`开始 ${task.taskNo}`} onClick={() => handleTaskAction(task, 'start')}>
                    开始
                  </button>
                  <button type="button" aria-label={`取消 ${task.taskNo}`} onClick={() => handleTaskAction(task, 'cancel')}>
                    取消
                  </button>
                </>
              ) : null}
              {task.status === 'CLEANING' ? (
                <button type="button" aria-label={`完成 ${task.taskNo}`} onClick={() => handleTaskAction(task, 'complete')}>
                  完成
                </button>
              ) : null}
            </div>
            <span>{task.roomName}</span>
            <span>{task.cleanTypeLabel}</span>
            <span className={`clean-status clean-status--${task.status.toLowerCase()}`}>{task.statusLabel}</span>
            <span>{task.cleanerName}</span>
            <span>{task.planTime}</span>
          </div>
        ))}
        {dashboard ? (
          <div className="clean-pagination">
            第 {dashboard.pagination.page} 页，共 {dashboard.pagination.total} 条，每页 {dashboard.pagination.pageSize} 条
          </div>
        ) : null}
      </section>

      {selectedTask ? (
        <div className="clean-dialog-backdrop">
          <section className="clean-dialog" role="dialog" aria-modal="true" aria-label="保洁任务详情">
            <header>
              <strong>保洁任务详情</strong>
              <button type="button" aria-label="关闭详情" onClick={() => setSelectedTask(null)}>
                ×
              </button>
            </header>
            <dl>
              <dt>任务编号</dt>
              <dd>{selectedTask.taskNo}</dd>
              <dt>关联订单</dt>
              <dd>{selectedTask.sourceOrderNo}</dd>
              <dt>住客</dt>
              <dd>{selectedTask.guestName}</dd>
              <dt>任务备注</dt>
              <dd>{selectedTask.remark}</dd>
              <dt>进度</dt>
              <dd>{selectedTask.progress}%</dd>
            </dl>
          </section>
        </div>
      ) : null}

      {createOpen ? (
        <div className="clean-dialog-backdrop">
          <section className="clean-dialog" role="dialog" aria-modal="true" aria-label="创建保洁任务">
            <header>
              <strong>创建保洁任务</strong>
              <button type="button" aria-label="取消创建" onClick={() => setCreateOpen(false)}>
                ×
              </button>
            </header>
            <label className="clean-form-row">
              <span>任务备注</span>
              <textarea value={remark} onChange={(event) => setRemark(event.target.value)} aria-label="任务备注" />
            </label>
            <div className="clean-dialog-actions">
              <button type="button" onClick={() => setCreateOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={handleCreateConfirm}>
                确认创建
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function FilterButton({
  label,
  value,
  placeholder,
  name,
  options,
  openFilter,
  setOpenFilter,
  filters,
  onSelect,
}: {
  label: string
  value: string
  placeholder: string
  name: Exclude<CleanFilter, null>
  options: CleanLookupOption[]
  openFilter: CleanFilter
  setOpenFilter: (filter: CleanFilter) => void
  filters: CleanTaskFilters
  onSelect: (option: CleanLookupOption) => void
}) {
  return (
    <div className="clean-filter-field">
      <span className="clean-filter-label">
        <span>{label}：</span>
      </span>
      <div className="clean-filter-control">
        <button
          type="button"
          aria-label={value || placeholder}
          aria-haspopup="listbox"
          aria-expanded={openFilter === name}
          onClick={() => setOpenFilter(openFilter === name ? null : name)}
        >
          {value || placeholder}
        </button>
        {openFilter === name ? (
          <div className="clean-options" role="listbox" aria-label={`${label}筛选`}>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={isSelectedFilter(option.id, name, filters)}
                onClick={() => onSelect(option)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function summaryCards(dashboard: CleanTaskDashboard | null) {
  const summary = dashboard?.summary
  return [
    { label: '今日任务', value: summary?.total ?? 0, detail: '按当前筛选统计', tone: 'total' },
    { label: '待分配', value: summary?.pendingAssign ?? 0, detail: '等待安排人员', tone: 'assign' },
    { label: '待保洁', value: summary?.pendingClean ?? 0, detail: '需要尽快处理', tone: 'pending' },
    { label: '保洁中', value: summary?.cleaning ?? 0, detail: '现场处理中', tone: 'cleaning' },
    { label: '已完成', value: summary?.done ?? 0, detail: '房间可售', tone: 'done' },
  ]
}

function progressRows(dashboard: CleanTaskDashboard | null) {
  const summary = dashboard?.summary
  const total = Math.max(summary?.total ?? 0, 1)
  return [
    { label: '待保洁', value: summary?.pendingClean ?? 0, percent: ((summary?.pendingClean ?? 0) / total) * 100 },
    { label: '保洁中', value: summary?.cleaning ?? 0, percent: ((summary?.cleaning ?? 0) / total) * 100 },
    { label: '已完成', value: summary?.done ?? 0, percent: ((summary?.done ?? 0) / total) * 100 },
  ]
}

function labelById(options: Array<CleanLookupOption & { id: string }> | undefined, id: string, emptyId = 'ALL') {
  if (id === emptyId) return ''
  return options?.find((option) => option.id === id)?.label ?? ''
}

function isSelectedFilter(id: string, openFilter: Exclude<CleanFilter, null>, filters: CleanTaskFilters) {
  if (openFilter === 'room') return filters.roomId === id
  if (openFilter === 'type') return filters.cleanType === id
  if (openFilter === 'status') return filters.status === id
  return filters.cleanerId === id
}

function shiftDate(date: string, offset: number) {
  const next = new Date(`${date}T00:00:00+08:00`)
  next.setDate(next.getDate() + offset)
  return next.toISOString().slice(0, 10)
}

function normalizeScenario(value: string | null): CleanTaskScenario {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}
