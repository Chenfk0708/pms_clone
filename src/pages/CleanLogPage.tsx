import { useEffect, useMemo, useState } from 'react'
import {
  createCleanLogExportTask,
  fetchCleanLogs,
  getDefaultCleanLogFilterOptions,
  resolveCleanLogRuntimeConfig,
  type CleanLogQuery,
  type CleanLogRow,
  type CleanLogServiceResult,
} from '../services/cleanLog'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './CleanLogPage.css'

const pageSize = 10

export function CleanLogPage() {
  const runtime = useMemo(() => resolveCleanLogRuntimeConfig(window.location), [])
  const campId = useMemo(() => new URLSearchParams(window.location.search).get('campId') || '1796067693589061634', [])
  const defaultOptions = getDefaultCleanLogFilterOptions()
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [operatorOpen, setOperatorOpen] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('')
  const [selectedOperatorId, setSelectedOperatorId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)
  const [message, setMessage] = useState('保洁日志已加载')
  const [error, setError] = useState('')
  const [result, setResult] = useState<CleanLogServiceResult | null>(null)
  const [selectedLog, setSelectedLog] = useState<CleanLogRow | null>(null)

  const query = useMemo<CleanLogQuery>(
    () => ({
      provider: runtime.provider,
      mockState: runtime.mockState,
      campId,
      storeId: selectedStoreId,
      roomIds: selectedRoomId ? [selectedRoomId] : [],
      operatorId: selectedOperatorId,
      operatorStartTime: startDate ? new Date(`${startDate}T00:00:00+08:00`).getTime() : undefined,
      operatorEndTime: endDate ? new Date(`${endDate}T00:00:00+08:00`).getTime() : undefined,
      page: 1,
      pageSize,
    }),
    [campId, endDate, runtime.mockState, runtime.provider, selectedOperatorId, selectedRoomId, selectedStoreId, startDate],
  )

  useEffect(() => {
    const controller = new AbortController()

    fetchCleanLogs(query, controller.signal)
      .then((nextResult) => {
        setResult(nextResult)
        setError('')
      })
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return
        setResult(null)
        setError(caught instanceof Error ? caught.message : '保洁日志加载失败，请重试')
      })

    return () => controller.abort()
  }, [query, refreshToken])

  const options = result?.view.filterOptions ?? defaultOptions
  const rows = result?.view.rows ?? []
  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: options.stores.map((store) => ({ id: store.value || 'all', label: store.label })),
  })
  const selectedRoom = options.rooms.find((room) => room.value === selectedRoomId)
  const selectedOperator = options.operators.find((operator) => operator.value === selectedOperatorId)

  function refresh(nextMessage = '已刷新') {
    setRefreshToken((current) => current + 1)
    setMessage(nextMessage)
  }

  function reset() {
    setSelectedStoreId('')
    setSelectedRoomId('')
    setSelectedOperatorId('')
    setStartDate('')
    setEndDate('')
    setRoomDialogOpen(false)
    setOperatorOpen(false)
    setSelectedLog(null)
    refresh('筛选条件已重置')
  }

  function exportLogs() {
    createCleanLogExportTask(query)
    setMessage('导出任务已创建')
  }

  return (
    <div className="clean-log-page">
      <section className="clean-log-panel">
        <div className="clean-log-query" aria-label="保洁日志筛选">
          <StoreSelectControl
            className="clean-log-store-row"
            label="门店筛选"
            options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
            value={selectedStoreId || 'all'}
            disabled={storeLoading}
            onChange={(storeId) => {
              setSelectedStoreId(storeId === 'all' ? '' : storeId)
              setMessage(storeId === 'all' ? '已切换到全部门店' : '已切换门店')
            }}
          />
          <button type="button" onClick={() => setRoomDialogOpen(true)}>
            {selectedRoom ? selectedRoom.label : '请选择房间'}
          </button>
          <label>
            <span>操作日期</span>
            <input aria-label="操作日期开始" placeholder="开始日期" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <input aria-label="操作日期结束" placeholder="结束日期" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <button type="button" onClick={() => setOperatorOpen((open) => !open)}>
            {selectedOperator?.label ?? '请选择操作人'}
          </button>
          <button type="button" onClick={() => refresh('查询完成')}>
            查询
          </button>
          <button type="button" onClick={reset}>
            重置
          </button>
          <button type="button" onClick={() => refresh()}>
            刷新
          </button>
          <button type="button" onClick={exportLogs} disabled={rows.length === 0}>
            导出
          </button>
        </div>

        {operatorOpen ? (
          <div className="clean-log-popover" role="listbox" aria-label="操作人筛选">
            {options.operators.map((operator) => (
              <button
                type="button"
                role="option"
                aria-selected={selectedOperatorId === operator.value}
                key={`${operator.value}-${operator.label}`}
                onClick={() => {
                  setSelectedOperatorId(operator.value)
                  setOperatorOpen(false)
                }}
              >
                {operator.label}
              </button>
            ))}
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="clean-log-error">
            {error}
            <button type="button" onClick={() => refresh()}>
              重试
            </button>
          </div>
        ) : null}

        <div role="status" className="clean-log-status">
          {error ? '' : rows.length > 0 ? message : '暂无保洁日志'}
        </div>

        <section aria-label="保洁日志列表" className="clean-log-table">
          <div className="clean-log-table__head">
            {['操作时间', '操作人', '操作类型', '操作内容', '操作'].map((column) => (
              <div key={column}>{column}</div>
            ))}
          </div>
          {rows.length === 0 ? <div className="clean-log-empty">暂无保洁日志</div> : null}
          {rows.map((row) => (
            <div className="clean-log-table__row" key={row.id}>
              <div>{row.operatorTime}</div>
              <div>{row.operatorName}</div>
              <div>{row.operatorType}</div>
              <div>{row.operatorDetails}</div>
              <div>
                <button type="button" className="clean-log-link-button" onClick={() => setSelectedLog(row)} aria-label={`查看 ${row.id}`}>
                  查看
                </button>
              </div>
            </div>
          ))}
        </section>
      </section>

      {roomDialogOpen ? (
        <div className="clean-log-modal-backdrop">
          <section className="clean-log-room-modal" role="dialog" aria-modal="true" aria-label="选择房间">
            <header>
              <strong>选择房间</strong>
              <button type="button" aria-label="关闭选择房间" onClick={() => setRoomDialogOpen(false)}>
                ×
              </button>
            </header>
            <div className="clean-log-room-filter">
              <button type="button" onClick={() => setMessage('房型标签已保持全部')}>
                请选择房型标签
              </button>
              <input placeholder="输入房间/房型名称" aria-label="房间或房型搜索" />
            </div>
            <div className="clean-log-room-list" role="listbox" aria-label="房间列表">
              {options.rooms.map((room) => (
                <button
                  key={room.value}
                  type="button"
                  role="option"
                  aria-selected={selectedRoomId === room.value}
                  aria-label={`${room.roomType} ${room.roomName}`}
                  onClick={() => setSelectedRoomId(room.value)}
                >
                  <i aria-hidden="true" />
                  <span>{room.roomType}</span>
                  <em>{room.roomName}</em>
                  <b aria-hidden="true">›</b>
                </button>
              ))}
            </div>
            <footer>
              <button type="button" onClick={() => setRoomDialogOpen(false)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => setRoomDialogOpen(false)}>
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {selectedLog ? (
        <aside className="clean-log-detail-drawer" role="dialog" aria-modal="true" aria-label="保洁日志详情">
          <header>
            <strong>保洁日志详情</strong>
            <button type="button" aria-label="关闭详情" onClick={() => setSelectedLog(null)}>
              ×
            </button>
          </header>
          <dl>
            <div>
              <dt>日志编号</dt>
              <dd>{selectedLog.id}</dd>
            </div>
            <div>
              <dt>操作时间</dt>
              <dd>{selectedLog.operatorTime}</dd>
            </div>
            <div>
              <dt>操作人</dt>
              <dd>{selectedLog.operatorName}</dd>
            </div>
            <div>
              <dt>操作内容</dt>
              <dd>{selectedLog.operatorDetails}</dd>
            </div>
          </dl>
        </aside>
      ) : null}
    </div>
  )
}
