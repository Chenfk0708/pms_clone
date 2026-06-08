import { useCallback, useEffect, useMemo, useSyncExternalStore, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createCleanStatisticsExportTask,
  fetchCleanStatisticsDashboard,
  getCurrentMonthRange,
  getDefaultCleanStatisticsFilters,
  type CleanDetailRow,
  type CleanMetric,
  type CleanMockState,
  type CleanStatisticsDashboard,
  type CleanStatisticsExportTask,
} from '../services/cleanStatistics'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './CleanStatisticsPage.css'

type CleanTab = 'summary' | 'detail'
type SelectKind = 'room' | 'cleaner'
type DialogState =
  | { type: 'help' }
  | { type: 'metric'; metric: CleanMetric }
  | { type: 'detail'; detail: CleanDetailRow }
  | null

const defaultFilters = getDefaultCleanStatisticsFilters()
const initialRange = { start: defaultFilters.startDate, end: defaultFilters.endDate }

function FieldMultiSelect({
  label,
  placeholder,
  options,
  selected,
  open,
  onToggle,
  onSelect,
}: {
  label: string
  placeholder: string
  options: Array<{ id: string; label: string }>
  selected: string[]
  open: boolean
  onToggle: () => void
  onSelect: (optionId: string) => void
}) {
  const selectedLabels = options.filter((option) => selected.includes(option.id)).map((option) => option.label)
  return (
    <div className="clean-stat-filter">
      <span>{label}：</span>
      <div className="clean-stat-select-wrap">
        <button type="button" className="clean-stat-select" onClick={onToggle}>
          {label} {selectedLabels.length > 0 ? selectedLabels.join('、') : placeholder}
        </button>
        {open ? (
          <div className="clean-stat-options" role="listbox" aria-label={`${label}筛选`}>
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={selected.includes(option.id)}
                onClick={() => onSelect(option.id)}
              >
                <span>{option.label}</span>
                {selected.includes(option.id) ? <strong>✓</strong> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function CleanStatisticsPage() {
  const navigate = useNavigate()
  const routeKey = useRouteSearchKey()
  const [tab, setTab] = useState<CleanTab>('summary')
  const [storeId, setStoreId] = useState(defaultFilters.storeId ?? 'all')
  const [range, setRange] = useState(initialRange)
  const [rooms, setRooms] = useState<string[]>([])
  const [cleaners, setCleaners] = useState<string[]>([])
  const [openSelect, setOpenSelect] = useState<SelectKind | null>(null)
  const [status, setStatus] = useState('')
  const [dashboard, setDashboard] = useState<CleanStatisticsDashboard | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [lastRequestBody, setLastRequestBody] = useState<Record<string, unknown>>({})
  const [exportTask, setExportTask] = useState<CleanStatisticsExportTask | null>(null)

  const campId = useMemo(() => resolveCampId(), [routeKey])
  const mockState = useMemo(() => resolveMockState(), [routeKey])
  const summaryRows = dashboard?.statistics.rows ?? []
  const detailRows = dashboard?.statistics.detailRows ?? []
  const metrics = dashboard?.statistics.metrics ?? []
  const todos = dashboard?.statistics.todos ?? []
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: dashboard?.stores ?? [{ id: 'all', label: '全部门店' }],
  })
  const roomOptions = dashboard?.rooms ?? []
  const cleanerOptions = dashboard?.cleaners ?? []

  const buildFilters = useCallback(
    (nextRange = range) => ({
      campId,
      startDate: nextRange.start,
      endDate: nextRange.end,
      pageNum: 1,
      pageSize: 20,
      storeId,
      roomIds: rooms,
      cleanerIds: cleaners,
      mockState,
    }),
    [campId, cleaners, mockState, range, rooms, storeId],
  )

  const loadStatistics = useCallback(
    async (nextRange = range, nextStatus = '保洁统计已刷新') => {
      setIsLoading(true)
      setError('')
      try {
        const nextDashboard = await fetchCleanStatisticsDashboard(buildFilters(nextRange))
        setDashboard(nextDashboard)
        setLastRequestBody(nextDashboard.statistics.requestBody)
        setStatus(nextStatus)
      } catch (nextError) {
        setDashboard(null)
        setLastRequestBody(buildFilters(nextRange))
        setError(nextError instanceof Error ? nextError.message : String(nextError))
      } finally {
        setIsLoading(false)
      }
    },
    [buildFilters, range],
  )

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void loadStatistics(range, '保洁统计已加载')
    })
    return () => {
      cancelled = true
    }
    // 只用于首次进入和路由查询参数变化时加载；普通筛选变更由“查询/重置”显式触发，避免覆盖操作反馈。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campId, mockState])

  function toggleOption(kind: SelectKind, optionId: string) {
    const updater = kind === 'room' ? setRooms : setCleaners
    updater((current) => (current.includes(optionId) ? current.filter((item) => item !== optionId) : [...current, optionId]))
  }

  function resetFilters() {
    const nextRange = getCurrentMonthRange()
    setStoreId('all')
    setRange(nextRange)
    setRooms([])
    setCleaners([])
    setOpenSelect(null)
    void loadStatistics(nextRange, '已重置筛选并刷新统计')
  }

  async function exportStatistics() {
    const task = await createCleanStatisticsExportTask(buildFilters())
    setExportTask(task)
    setStatus(`导出任务已创建：${task.taskId}`)
  }

  return (
    <div
      className="clean-stat-page"
      data-clean-request={JSON.stringify(lastRequestBody)}
      data-clean-export={exportTask ? JSON.stringify(exportTask) : ''}
    >
      <div className="clean-stat-title">保洁统计</div>
      <section className="clean-stat-shell">
        <div className="clean-stat-tabs" aria-label="保洁统计视图">
          <button type="button" className={tab === 'summary' ? 'is-active' : ''} onClick={() => setTab('summary')}>
            统计汇总
          </button>
          <button type="button" className={tab === 'detail' ? 'is-active' : ''} onClick={() => setTab('detail')}>
            统计明细
          </button>
          <button type="button" className="clean-stat-help" aria-label="保洁统计说明" onClick={() => setDialog({ type: 'help' })}>
            ?
          </button>
        </div>

        <section className="clean-stat-toolbar" aria-label="保洁统计筛选">
          <div className="clean-stat-row">
            <StoreSelectControl
              className="clean-stat-store"
              label="门店筛选"
              options={storeOptions.map((item) => ({ id: item.id, name: item.label }))}
              value={storeId}
              disabled={storeLoading}
              onChange={(nextStoreId, option) => {
                setStoreId(nextStoreId)
                setStatus(`已切换门店：${option.name}`)
              }}
              settingsLabel="门店设置"
              onSettingsClick={() => navigate('/cleanManage/cleanSetting')}
            />
            <label className="clean-stat-date">
              <span>日期：</span>
              <button
                type="button"
                className="clean-stat-month is-active"
                onClick={() => {
                  const nextRange = getCurrentMonthRange()
                  setRange(nextRange)
                  setStatus('已切换为本月')
                }}
              >
                本 月
              </button>
              <button
                type="button"
                className="clean-stat-month"
                onClick={() => {
                  const nextRange = getPreviousMonthRange(range.start)
                  setRange(nextRange)
                  setStatus('已切换为上月')
                }}
              >
                上 月
              </button>
              <input
                aria-label="开始日期"
                value={range.start}
                onChange={(event) => setRange((current) => ({ ...current, start: event.target.value }))}
              />
              <span>至</span>
              <input
                aria-label="结束日期"
                value={range.end}
                onChange={(event) => setRange((current) => ({ ...current, end: event.target.value }))}
              />
            </label>
            <button type="button" className="clean-stat-export" disabled={isLoading} onClick={() => void exportStatistics()}>
              导 出
            </button>
          </div>

          <div className="clean-stat-row clean-stat-row--second">
            <FieldMultiSelect
              label="房型房间"
              placeholder="请选择房间"
              options={roomOptions.length > 0 ? roomOptions : [{ id: 'empty-room', label: '暂无房间数据' }]}
              selected={rooms}
              open={openSelect === 'room'}
              onToggle={() => setOpenSelect(openSelect === 'room' ? null : 'room')}
              onSelect={(option) => toggleOption('room', option)}
            />
            <FieldMultiSelect
              label="保洁员"
              placeholder="请选择保洁员"
              options={cleanerOptions.length > 0 ? cleanerOptions : [{ id: 'empty-cleaner', label: '暂无保洁员' }]}
              selected={cleaners}
              open={openSelect === 'cleaner'}
              onToggle={() => setOpenSelect(openSelect === 'cleaner' ? null : 'cleaner')}
              onSelect={(option) => toggleOption('cleaner', option)}
            />
            <div className="clean-stat-actions">
              <button type="button" disabled={isLoading} onClick={resetFilters}>
                重 置
              </button>
              <button
                type="button"
                className="is-primary"
                disabled={isLoading}
                onClick={() => void loadStatistics(range, '已按当前筛选更新')}
              >
                查 询
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="clean-stat-alert clean-stat-alert--error" role="alert" aria-label="保洁统计数据错误">
            <span>{error}</span>
            <button type="button" onClick={() => void loadStatistics(range, '保洁统计已重新加载')}>
              重试
            </button>
          </div>
        ) : null}

        <section className="clean-stat-metrics" aria-label="保洁统计核心指标">
          {metrics.map((metric) => (
            <button key={metric.id} type="button" aria-label={`查看指标 ${metric.label}`} onClick={() => setDialog({ type: 'metric', metric })}>
              <span>{metric.label}</span>
              <strong>
                {metric.value}
                <em>{metric.unit}</em>
              </strong>
              <small>{metric.trend}</small>
            </button>
          ))}
        </section>

        {tab === 'summary' ? (
          <section className="clean-stat-table" aria-label="保洁统计汇总表">
            <div className="clean-stat-table__head">
              <div className="is-date" />
              <div>扫尘保洁</div>
              <div>续住保洁</div>
              <div>退房保洁</div>
              <div>深度保洁</div>
              <div>合计</div>
            </div>
            <div className="clean-stat-table__subhead">
              <div className="is-date">保洁日期</div>
              {['数量', '费用', '数量', '费用', '数量', '费用', '数量', '费用', '数量', '费用'].map((item, index) => (
                <div key={`${item}-${index}`}>{item}</div>
              ))}
            </div>
            <div className="clean-stat-table__body">
              {isLoading ? <div className="clean-stat-empty">正在加载保洁统计...</div> : null}
              {!isLoading && summaryRows.length === 0 ? <div className="clean-stat-empty">暂无保洁统计数据</div> : null}
              {summaryRows.map((row) => (
                <div key={row.date} className="clean-stat-table__row">
                  <strong className="is-date">{row.date}</strong>
                  <span>{row.checkoutCount}</span>
                  <span>{row.checkoutFee}</span>
                  <span>{row.stayCount}</span>
                  <span>{row.stayFee}</span>
                  <span>{row.departureCount}</span>
                  <span>{row.departureFee}</span>
                  <span>{row.deepCount}</span>
                  <span>{row.deepFee}</span>
                  <span>{row.totalCount}</span>
                  <span>{row.totalFee}</span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="clean-detail-table" aria-label="保洁统计明细表">
            <div className="clean-detail-table__head">
              {['任务编号', '保洁日期', '房型房间', '保洁员', '类型', '费用', '状态', '操作'].map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
            {detailRows.length === 0 ? <div className="clean-stat-empty">暂无保洁统计数据</div> : null}
            {detailRows.map((row) => (
              <div key={row.id} className="clean-detail-table__row">
                <strong>{row.id}</strong>
                <span>{row.cleanDate}</span>
                <span>{row.roomName}</span>
                <span>{row.cleanerName}</span>
                <span>{row.cleanType}</span>
                <span>{row.fee}</span>
                <span className={row.status === '已完成' ? 'is-done' : 'is-pending'}>{row.status}</span>
                <button type="button" onClick={() => setDialog({ type: 'detail', detail: row })}>
                  查看 {row.id}
                </button>
              </div>
            ))}
          </section>
        )}

        <section className="clean-stat-todos" aria-label="保洁统计待办">
          {todos.length === 0 ? <div className="clean-stat-empty">暂无待办事项</div> : null}
          {todos.map((todo) => (
            <button
              key={todo.id}
              type="button"
              onClick={() => {
                if (todo.id === 'today-checkout') navigate('/houseManage/days')
                else if (todo.id === 'staff-schedule') navigate('/cleanManage/cleanStaff')
                else setTab('detail')
              }}
            >
              <span>{todo.title}</span>
              <strong>{todo.count}</strong>
              <em>{todo.action}</em>
            </button>
          ))}
        </section>

        <section className="clean-stat-promo">
          <div>
            <h2>限时钜惠！智能保洁6折开通</h2>
            <p>自动派单 ｜ 实时提醒 ｜ 报表清晰</p>
          </div>
          <button type="button" onClick={() => navigate('/version/applicationPayment/detail')}>
            订阅开通
          </button>
        </section>
      </section>

      {status ? (
        <div role="status" aria-label="保洁统计操作反馈" className="clean-stat-status">
          {status}
        </div>
      ) : null}

      {dialog ? <CleanStatisticsDialog dialog={dialog} onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function CleanStatisticsDialog({ dialog, onClose }: { dialog: DialogState; onClose: () => void }) {
  if (!dialog) return null

  if (dialog.type === 'help') {
    return (
      <div className="clean-stat-modal-backdrop">
        <section className="clean-stat-modal" role="dialog" aria-label="保洁统计说明">
          <header>
            <h2>保洁统计说明</h2>
            <button type="button" aria-label="关闭说明" onClick={onClose}>
              ×
            </button>
          </header>
          <p>统计口径按保洁日期、保洁类型、费用和验收状态汇总，筛选后同步刷新汇总与明细。</p>
        </section>
      </div>
    )
  }

  if (dialog.type === 'metric') {
    return (
      <div className="clean-stat-modal-backdrop">
        <section className="clean-stat-modal" role="dialog" aria-label="指标详情">
          <header>
            <h2>指标详情</h2>
            <button type="button" aria-label="关闭详情" onClick={onClose}>
              ×
            </button>
          </header>
          <strong>{dialog.metric.label}</strong>
          <p>{dialog.metric.description}</p>
          <p>
            当前值：{dialog.metric.value}
            {dialog.metric.unit}，{dialog.metric.trend}
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="clean-stat-modal-backdrop">
      <section className="clean-stat-modal" role="dialog" aria-label="保洁明细">
        <header>
          <h2>保洁明细</h2>
          <button type="button" aria-label="关闭明细" onClick={onClose}>
            ×
          </button>
        </header>
        <p>
          {dialog.detail.id}：{dialog.detail.roomName}，{dialog.detail.cleanerName}，{dialog.detail.cleanType}，
          {dialog.detail.status}
        </p>
      </section>
    </div>
  )
}

function resolveCampId() {
  return readRouteParam('campId') || window.localStorage.getItem('pmsCampId') || (import.meta.env.VITE_PMS_CAMP_ID as string | undefined) || defaultFilters.campId
}

function resolveMockState(): CleanMockState {
  const state = readRouteParam('cleanMockState')
  return state === 'empty' || state === 'error' ? state : 'success'
}

function readRouteParam(key: string) {
  const searchValue = new URLSearchParams(window.location.search).get(key)
  if (searchValue) return searchValue

  const hashQuery = window.location.hash.split('?')[1] ?? ''
  return new URLSearchParams(hashQuery).get(key)
}

function useRouteSearchKey() {
  return useSyncExternalStore(
    (notify) => {
      window.addEventListener('hashchange', notify)
      window.addEventListener('popstate', notify)
      return () => {
        window.removeEventListener('hashchange', notify)
        window.removeEventListener('popstate', notify)
      }
    },
    () => `${window.location.search}|${window.location.hash}`,
  )
}

function getPreviousMonthRange(currentStart: string) {
  const date = new Date(`${currentStart}T00:00:00+08:00`)
  date.setMonth(date.getMonth() - 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate()
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  }
}
