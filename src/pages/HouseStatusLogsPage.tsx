import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { fetchHouseStatusLogs } from '../services/houseStatusLogs'
import type { HouseStatusLogQuery, HouseStatusLogRecord } from '../services/houseStatusLogs'
import './HouseStatusLogsPage.css'

const columns = [
  '房型',
  '房间',
  '房态调整日期',
  '操作内容',
  '调整方式',
  '同步渠道',
  '渠道库存变更',
  '操作人',
  '操作时间',
]

const PAGE_SIZE = 20

const adjustmentModeOptions = [
  { label: '手动调整', value: '手动调整', apiValue: 1 },
  { label: '系统调整', value: '系统调整', apiValue: 2 },
]

const channelOptions = [
  { label: '自来客', value: '自来客', apiValue: '0' },
  { label: '路客云聚合', value: '路客云聚合', apiValue: '17' },
  { label: '美团民宿', value: '美团民宿', apiValue: '3' },
  { label: '美团酒店', value: '美团酒店', apiValue: '6' },
  { label: '携程', value: '携程', apiValue: '5' },
  { label: '途家', value: '途家', apiValue: '2' },
  { label: '途家直连', value: '途家直连', apiValue: '49' },
  { label: '爱彼迎', value: '爱彼迎', apiValue: '1' },
  { label: '飞猪淘酒店', value: '飞猪淘酒店', apiValue: '8' },
  { label: '飞猪民宿直连', value: '飞猪民宿直连', apiValue: '59' },
  { label: '飞猪酒店直连', value: '飞猪酒店直连', apiValue: '60' },
]

export function HouseStatusLogsPage() {
  const [keyword, setKeyword] = useState('')
  const [adjustmentMode, setAdjustmentMode] = useState('手动调整')
  const [channel, setChannel] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [roomStatusDateStart, setRoomStatusDateStart] = useState('')
  const [roomStatusDateEnd, setRoomStatusDateEnd] = useState('')
  const [operationDateStart, setOperationDateStart] = useState('')
  const [operationDateEnd, setOperationDateEnd] = useState('')
  const [operator, setOperator] = useState('')
  const [logs, setLogs] = useState<HouseStatusLogRecord[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('请设置筛选条件后查询房态日志')
  const [error, setError] = useState('')
  const [lastQuery, setLastQuery] = useState<HouseStatusLogQuery | null>(null)

  const campId = useMemo(() => resolveCampId(), [])
  const mockScenario = useMemo(() => resolveMockScenario(), [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void runQuery()
  }

  function handleReset() {
    setKeyword('')
    setAdjustmentMode('手动调整')
    setChannel('')
    setRoomStatusDateStart('')
    setRoomStatusDateEnd('')
    setOperationDateStart('')
    setOperationDateEnd('')
    setOperator('')
    setLogs([])
    setTotal(null)
    setError('')
    setMessage('筛选条件已重置')
    setLastQuery(null)
  }

  async function runQuery(query?: HouseStatusLogQuery) {
    const nextQuery = query ?? buildQuery()

    setIsLoading(true)
    setError('')
    setMessage('正在查询房态日志...')
    setLastQuery(nextQuery)

    try {
      const data = await fetchHouseStatusLogs(nextQuery)
      setLogs(data.list)
      setTotal(data.total)
      setMessage(data.total > 0 ? `已加载 ${data.total} 条房态日志` : '暂无符合条件的房态日志')
    } catch (requestError) {
      setLogs([])
      setTotal(null)
      setError(`房态日志查询失败：${formatUserFacingError(requestError)}`)
      setMessage('房态日志请求失败')
    } finally {
      setIsLoading(false)
    }
  }

  function retryLastQuery() {
    void runQuery(lastQuery ?? buildQuery())
  }

  function buildQuery(): HouseStatusLogQuery {
    const selectedAdjustment = adjustmentModeOptions.find((option) => option.value === adjustmentMode)
    const selectedChannel = channelOptions.find((option) => option.value === channel)
    const query: HouseStatusLogQuery = {
      pageNum: 1,
      pageSize: PAGE_SIZE,
      current: 1,
    }

    if (campId) query.campId = campId
    if (mockScenario) query.mockScenario = mockScenario
    if (keyword.trim()) query.keyword = keyword.trim()
    if (selectedAdjustment) query.adjustType = selectedAdjustment.apiValue
    if (selectedChannel) query.channelId = selectedChannel.apiValue
    if (roomStatusDateStart.trim()) query.startDate = roomStatusDateStart.trim()
    if (roomStatusDateEnd.trim()) query.endDate = roomStatusDateEnd.trim()
    if (operationDateStart.trim()) query.createStartTime = operationDateStart.trim()
    if (operationDateEnd.trim()) query.createEndTime = operationDateEnd.trim()
    if (operator.trim()) query.userName = operator.trim()

    return query
  }

  return (
    <div className="page-stack status-log-page">
      <section className="status-log-panel">
        <form className="status-log-query" aria-label="房态日志筛选" onSubmit={handleSubmit}>
          <label className="status-log-field">
            <span>日志关键词</span>
            <input
              className="status-log-query__keyword"
              aria-label="日志关键词"
              type="text"
              placeholder="搜索房型名称/房间号/渠道房源名称"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>

          <label className="status-log-field">
            <span>调整方式</span>
            <select
              className="status-log-query__select"
              value={adjustmentMode}
              aria-label="调整方式"
              onChange={(event) => setAdjustmentMode(event.target.value)}
            >
              {adjustmentModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="status-log-field">
            <span>操作渠道</span>
            <select
              className="status-log-query__select"
              value={channel}
              aria-label="操作渠道"
              onChange={(event) => setChannel(event.target.value)}
            >
              <option value="">请选择</option>
              {channelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {expanded ? (
            <>
              <div className="status-log-field status-log-range-field" role="group" aria-label="房态日期">
                <span>房态日期</span>
                <div className="status-log-range">
                  <input
                    aria-label="房态日期开始"
                    type="text"
                    placeholder="请选择"
                    value={roomStatusDateStart}
                    onChange={(event) => setRoomStatusDateStart(event.target.value)}
                  />
                  <i aria-hidden="true">-</i>
                  <input
                    aria-label="房态日期结束"
                    type="text"
                    placeholder="请选择"
                    value={roomStatusDateEnd}
                    onChange={(event) => setRoomStatusDateEnd(event.target.value)}
                  />
                </div>
              </div>

              <div className="status-log-field status-log-range-field" role="group" aria-label="操作日期">
                <span>操作日期</span>
                <div className="status-log-range">
                  <input
                    aria-label="操作日期开始"
                    type="text"
                    placeholder="请选择"
                    value={operationDateStart}
                    onChange={(event) => setOperationDateStart(event.target.value)}
                  />
                  <i aria-hidden="true">-</i>
                  <input
                    aria-label="操作日期结束"
                    type="text"
                    placeholder="请选择"
                    value={operationDateEnd}
                    onChange={(event) => setOperationDateEnd(event.target.value)}
                  />
                </div>
              </div>

              <label className="status-log-field">
                <span>操作人</span>
                <input
                  className="status-log-query__operator"
                  type="text"
                  placeholder="搜索操作人名称/手机号"
                  value={operator}
                  onChange={(event) => setOperator(event.target.value)}
                />
              </label>
            </>
          ) : null}

          <div className="status-log-query__actions">
            <button type="button" onClick={handleReset} disabled={isLoading}>
              重 置
            </button>
            <button type="submit" className="is-primary" disabled={isLoading}>
              {isLoading ? '查询中' : '查 询'}
            </button>
            <button type="button" className="is-link" onClick={() => setExpanded((value) => !value)} disabled={isLoading}>
              {expanded ? '收起⌃' : '展开⌄'}
            </button>
          </div>
        </form>

        <div className="status-log-feedback" role="status" aria-live="polite">
          {message}
          {total !== null ? <span>，当前显示 {logs.length} 条</span> : null}
        </div>
        {error ? (
          <div className="status-log-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={retryLastQuery} disabled={isLoading}>
              重试
            </button>
          </div>
        ) : null}

        <table className="status-log-table" aria-label="房态日志列表" aria-busy={isLoading}>
          <thead>
            <tr className="status-log-table__head">
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr className="status-log-table__row" key={log.roomStatusOperationLogId ?? `${log.createTime}-${index}`}>
                  <td>{log.roomCategoryName || '-'}</td>
                  <td>{log.roomName || '-'}</td>
                  <td>{formatDateRange(log)}</td>
                  <td>{log.operationContent || '-'}</td>
                  <td>{log.adjustContent || '-'}</td>
                  <td>{formatChannels(log)}</td>
                  <td>{formatStockChanges(log)}</td>
                  <td>{log.userName || '-'}</td>
                  <td>{log.createTime || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <div className="status-log-empty">
                    <div className="status-log-empty__icon" aria-hidden="true" />
                    <span>{isLoading ? '正在加载' : '暂无数据'}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  )
}

function resolveCampId() {
  const params = new URLSearchParams(window.location.search)
  const campIdFromQuery = params.get('campId')
  if (campIdFromQuery) return campIdFromQuery

  for (const key of ['currentCamp', 'camp', 'pms.currentCamp']) {
    const rawValue = window.localStorage.getItem(key)
    if (!rawValue) continue

    try {
      const parsed = JSON.parse(rawValue) as { campId?: unknown; id?: unknown }
      const campId = parsed.campId ?? parsed.id
      if (typeof campId === 'string' && campId) return campId
      if (typeof campId === 'number') return String(campId)
    } catch {
      if (/^\d+$/.test(rawValue)) return rawValue
    }
  }

  return ''
}

function resolveMockScenario() {
  const params = new URLSearchParams(window.location.search)
  const scenario = params.get('mockScenario')
  return scenario === 'empty' || scenario === 'error' ? scenario : undefined
}

function formatUserFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('缺少门店上下文')) return '缺少门店上下文，无法查询房态日志'
  if (message.includes('房态日志服务暂不可用')) return '房态日志服务暂不可用，请稍后重试'
  if (message.includes('真实接口请求失败') || message.includes('Failed to fetch')) return '房态日志查询暂时失败，请稍后重试'

  return message
}

function formatDateRange(log: HouseStatusLogRecord) {
  if (!log.startDate && !log.endDate) return '-'
  if (log.startDate === log.endDate || !log.endDate) return log.startDate ?? '-'
  if (!log.startDate) return log.endDate
  return `${log.startDate} ~ ${log.endDate}`
}

function formatChannels(log: HouseStatusLogRecord) {
  const channelLogs = log.channelRoomStatusOperationLogViews?.filter((item) => item.channelName !== '自来客') ?? []
  if (!channelLogs.length) return '-'

  return channelLogs
    .map((item) => {
      const status = item.isSuccess === 0 ? '同步失败' : item.channelRoomCategoryProductName || '-'
      return `${item.channelName || '-'}：${status}`
    })
    .join('；')
}

function formatStockChanges(log: HouseStatusLogRecord) {
  const channelLogs = log.channelRoomStatusOperationLogViews?.filter((item) => item.channelName !== '自来客') ?? []
  if (!channelLogs.length) return '-'

  return channelLogs.map((item) => `${item.channelName || '-'}：${item.stockContent || '-'}`).join('；')
}
