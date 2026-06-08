import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  cleanTaskCreateEndpoint,
  cleanTaskExportEndpoint,
  cleanTaskListEndpoint,
  cleanTaskNotifyEndpoint,
  fetchCleanTaskDashboard,
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
import './CleanTaskPage.css'

type CleanFilter = 'room' | 'type' | 'status' | 'cleaner' | null

const defaultFilters: CleanTaskFilters = {
  campId: '1796067693589061634',
  poiId: 'ALL',
  cleanDate: '2026-05-18',
  roomId: 'ALL',
  cleanType: 'ALL',
  status: 'ALL',
  cleanerId: 'ALL',
  page: 1,
  pageSize: 20,
}

export function CleanTaskPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialScenario = normalizeScenario(searchParams.get('scenario'))
  const [filters, setFilters] = useState<CleanTaskFilters>({
    ...defaultFilters,
    campId: searchParams.get('campId') || defaultFilters.campId,
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
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: (dashboard?.stores ?? [{ id: 'ALL', label: '全部门店' }]).map((store) => ({
      id: store.id === 'ALL' ? 'all' : store.id,
      label: store.label,
    })),
  })

  useEffect(() => {
    void loadData(filters)
    // Initial route state should drive the first provider call only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const optionList = useMemo(() => {
    if (!dashboard) return []
    if (openFilter === 'room') return dashboard.rooms
    if (openFilter === 'type') return dashboard.cleanTypes.filter((item) => item.id !== 'ALL')
    if (openFilter === 'status') return dashboard.statuses.filter((item) => item.id !== 'ALL')
    if (openFilter === 'cleaner') return dashboard.cleaners
    return []
  }, [dashboard, openFilter])

  const requestStatus = dashboard
    ? `${cleanTaskListEndpoint.replace('/api', '')} ${formatRequestParams(dashboard.requestBody)}`
    : `${cleanTaskListEndpoint.replace('/api', '')} 等待加载`

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
    const nextFilters = { ...defaultFilters, scenario: 'success' as const }
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

  function handleBatchNotify() {
    setFeedback(`已通知 ${selectedIds.length} 个任务，通知接口 ${cleanTaskNotifyEndpoint.replace('/api', '')}`)
  }

  function handleExport() {
    setFeedback(`已创建导出任务，导出接口 ${cleanTaskExportEndpoint.replace('/api', '')}`)
  }

  function handleCreateConfirm() {
    setCreateOpen(false)
    setRemark('')
    setFeedback(`保洁任务已创建，创建接口 ${cleanTaskCreateEndpoint.replace('/api', '')}`)
  }

  function handleMoreRoute(path: string) {
    setMoreOpen(false)
    navigate(path)
  }

  return (
    <div className="clean-task-page">
      <h1>保洁任务</h1>

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
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <FilterButton
              label="保洁类型"
              value={labelById(dashboard?.cleanTypes, filters.cleanType, 'ALL')}
              placeholder="请选择保洁类型"
              name="type"
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <FilterButton
              label="保洁状态"
              value={labelById(dashboard?.statuses, filters.status, 'ALL')}
              placeholder="请选择保洁状态"
              name="status"
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            <FilterButton
              label="保洁员"
              value={labelById(dashboard?.cleaners, filters.cleanerId)}
              placeholder="请选择保洁员"
              name="cleaner"
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
            />
            {openFilter ? (
              <div className="clean-options" role="listbox" aria-label={`${filterTitle(openFilter)}筛选`}>
                {optionList.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelectedFilter(option.id, openFilter, filters)}
                    onClick={() => chooseFilter(option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
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

        <div className="clean-task-statusline">
          <span role="status" aria-label="保洁任务请求状态">
            {requestStatus}
          </span>
          <span role="status" aria-label="保洁任务操作反馈">
            {feedback}
          </span>
        </div>
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
            <button type="button" aria-label={`查看详情 ${task.taskNo}`} onClick={() => setSelectedTask(task)}>
              查看详情
            </button>
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
  openFilter,
  setOpenFilter,
}: {
  label: string
  value: string
  placeholder: string
  name: Exclude<CleanFilter, null>
  openFilter: CleanFilter
  setOpenFilter: (filter: CleanFilter) => void
}) {
  return (
    <label className="clean-filter">
      <span>{label}：</span>
      <button
        type="button"
        aria-label={value || placeholder}
        aria-haspopup="listbox"
        aria-expanded={openFilter === name}
        onClick={() => setOpenFilter(openFilter === name ? null : name)}
      >
        {value || placeholder}
      </button>
    </label>
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

function filterTitle(openFilter: Exclude<CleanFilter, null>) {
  if (openFilter === 'room') return '房型房间'
  if (openFilter === 'type') return '保洁类型'
  if (openFilter === 'status') return '保洁状态'
  return '保洁员'
}

function formatRequestParams(requestBody: Record<string, unknown>) {
  const compact = {
    cleanTime: requestBody.cleanTime,
    cleanType: requestBody.cleanType || 'ALL',
    status: requestBody.cleanStatus || 'ALL',
    cleanerIds: Array.isArray(requestBody.cleanerIds) && requestBody.cleanerIds.length > 0 ? requestBody.cleanerIds.join(',') : 'ALL',
    pageSize: requestBody.pageSize,
  }
  return Object.entries(compact)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
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
