import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  cleanStatisticsEndpoint,
  fetchCleanStatisticsDashboard,
  getCurrentMonthRange,
  type CleanStatisticsDashboard,
} from '../services/cleanStatistics'
import './CleanStatisticsPage.css'

type CleanTab = 'summary' | 'detail'

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']
const initialRange = getCurrentMonthRange()

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
  options: string[]
  selected: string[]
  open: boolean
  onToggle: () => void
  onSelect: (option: string) => void
}) {
  return (
    <div className="clean-stat-filter">
      <span>{label}：</span>
      <div className="clean-stat-select-wrap">
        <button type="button" className="clean-stat-select" onClick={onToggle}>
          {selected.length > 0 ? selected.join('、') : placeholder}
        </button>
        {open ? (
          <div className="clean-stat-options" role="listbox" aria-label={`${label}筛选`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected.includes(option)}
                onClick={() => onSelect(option)}
              >
                <span>{option}</span>
                {selected.includes(option) ? <strong>✓</strong> : null}
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
  const [tab, setTab] = useState<CleanTab>('summary')
  const [store, setStore] = useState(stores[0])
  const [range, setRange] = useState(initialRange)
  const [rooms, setRooms] = useState<string[]>([])
  const [cleaners, setCleaners] = useState<string[]>([])
  const [openSelect, setOpenSelect] = useState<'room' | 'cleaner' | null>(null)
  const [status, setStatus] = useState('')
  const [dashboard, setDashboard] = useState<CleanStatisticsDashboard | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const campId = useMemo(() => resolveCampId(), [])
  const summaryRows = dashboard?.statistics.rows ?? []
  const roomOptions = dashboard?.rooms.map((item) => item.label) ?? []
  const cleanerOptions = dashboard?.cleaners.map((item) => item.label) ?? []
  const blocker = campId
    ? ''
    : '缺少 campId：请通过 URL query、localStorage.pmsCampId 或 VITE_PMS_CAMP_ID 提供当前门店上下文后再请求真实保洁统计接口。'

  const loadStatistics = useCallback(
    async (nextRange = range) => {
      if (!campId) {
        setDashboard(null)
        setError('')
        return
      }

      setIsLoading(true)
      setError('')
      try {
        const nextDashboard = await fetchCleanStatisticsDashboard({
          campId,
          startDate: nextRange.start,
          endDate: nextRange.end,
          pageNum: 1,
          pageSize: 20,
        })
        setDashboard(nextDashboard)
        setStatus(`已从 ${cleanStatisticsEndpoint} 刷新保洁统计`)
      } catch (nextError) {
        setDashboard(null)
        setError(nextError instanceof Error ? nextError.message : String(nextError))
      } finally {
        setIsLoading(false)
      }
    },
    [campId, range],
  )

  useEffect(() => {
    let cancelled = false

    queueMicrotask(() => {
      if (!cancelled) void loadStatistics()
    })

    return () => {
      cancelled = true
    }
  }, [loadStatistics])

  function toggleOption(kind: 'room' | 'cleaner', option: string) {
    const updater = kind === 'room' ? setRooms : setCleaners
    updater((current) => (current.includes(option) ? current.filter((item) => item !== option) : [...current, option]))
  }

  function resetFilters() {
    const nextRange = getCurrentMonthRange()
    setStore(stores[0])
    setRange(nextRange)
    setRooms([])
    setCleaners([])
    setOpenSelect(null)
    setStatus('已重置保洁统计筛选，正在重新请求真实统计')
    void loadStatistics(nextRange)
  }

  return (
    <div className="clean-stat-page">
      <section className="clean-stat-shell">
        <div className="clean-stat-tabs" aria-label="保洁统计视图">
          <button type="button" className={tab === 'summary' ? 'is-active' : ''} onClick={() => setTab('summary')}>
            统计汇总
          </button>
          <button type="button" className={tab === 'detail' ? 'is-active' : ''} onClick={() => setTab('detail')}>
            统计明细
          </button>
          <button
            type="button"
            className="clean-stat-help"
            aria-label="保洁统计说明"
            onClick={() => setStatus('统计数据来自 cleanTask/statistics，导出和明细独立接口未完成取证')}
          >
            ?
          </button>
        </div>

        <section className="clean-stat-toolbar" aria-label="保洁统计筛选">
          <div className="clean-stat-row">
            <div className="clean-stat-store" role="group" aria-label="门店筛选">
              {stores.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={store === item ? 'is-active' : ''}
                  onClick={() => {
                    setStore(item)
                    setStatus('门店按钮已切换；真实请求仍以当前 campId 上下文为准')
                  }}
                >
                  {item === stores[1] ? '天落会宿…' : item}
                </button>
              ))}
              <button type="button" className="clean-stat-gear" aria-label="门店设置">
                ⚙
              </button>
            </div>
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
            <button
              type="button"
              className="clean-stat-export"
              onClick={() => setError('导出接口未取证，不能伪造成已生成导出任务。')}
            >
              导 出
            </button>
          </div>

          <div className="clean-stat-row clean-stat-row--second">
            <FieldMultiSelect
              label="房型房间"
              placeholder="请选择房间"
              options={roomOptions.length > 0 ? roomOptions : ['暂无房间数据']}
              selected={rooms}
              open={openSelect === 'room'}
              onToggle={() => setOpenSelect(openSelect === 'room' ? null : 'room')}
              onSelect={(option) => toggleOption('room', option)}
            />
            <FieldMultiSelect
              label="保洁员"
              placeholder="请选择保洁员"
              options={cleanerOptions.length > 0 ? cleanerOptions : ['暂无保洁员']}
              selected={cleaners}
              open={openSelect === 'cleaner'}
              onToggle={() => setOpenSelect(openSelect === 'cleaner' ? null : 'cleaner')}
              onSelect={(option) => toggleOption('cleaner', option)}
            />
            <div className="clean-stat-actions">
              <button type="button" disabled={isLoading} onClick={resetFilters}>
                重 置
              </button>
              <button type="button" className="is-primary" disabled={isLoading || !campId} onClick={() => void loadStatistics()}>
                查 询
              </button>
            </div>
          </div>
        </section>

        {blocker ? (
          <div className="clean-stat-alert" role="alert" aria-label="保洁统计数据阻塞">
            {blocker}
          </div>
        ) : null}

        {error ? (
          <div className="clean-stat-alert clean-stat-alert--error" role="alert" aria-label="保洁统计数据错误">
            <span>{error}</span>
            <button type="button" onClick={() => void loadStatistics()}>
              重试请求
            </button>
          </div>
        ) : null}

        {campId ? (
          <div className="clean-stat-source" role="status" aria-label="保洁统计请求状态">
            {isLoading
              ? `正在请求 ${cleanStatisticsEndpoint}`
              : dashboard
                ? `数据来源：${dashboard.statistics.endpoint}；记录数 ${dashboard.statistics.total}`
                : `等待 ${cleanStatisticsEndpoint} 返回`}
          </div>
        ) : null}

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
            <div className="clean-stat-empty">
              统计明细独立接口未完成取证，已移除旧静态任务编号，避免把假明细当作真实业务数据。
            </div>
          </section>
        )}

        <section className="clean-stat-promo">
          <div>
            <h2>限时钜惠！智能保洁6折开通</h2>
            <p>自动派单 ｜实时提醒 ｜ 报表清晰</p>
          </div>
          <button type="button" onClick={() => navigate('/version/applicationPayment/detail')}>
            订阅开通
          </button>
        </section>
      </section>

      {status ? <div role="status" className="clean-stat-status">{status}</div> : null}
    </div>
  )
}

function resolveCampId() {
  const params = new URLSearchParams(window.location.search)
  return params.get('campId') || window.localStorage.getItem('pmsCampId') || (import.meta.env.VITE_PMS_CAMP_ID as string | undefined) || ''
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
