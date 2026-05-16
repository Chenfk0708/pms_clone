import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchCleanLogs } from '../services/cleanLog'
import type { CleanLogQuery, CleanLogRecord } from '../services/cleanLog'
import './CleanLogPage.css'

type SelectKind = 'operator' | null

type StoreOption = {
  label: string
  poiId?: string
}

type RoomOption = {
  type: string
  room: string
  value: string
  roomId: string
}

type OperatorOption = {
  label: string
  userId: string
}

const PAGE_SIZE = 10

const stores: StoreOption[] = [
  { label: '全部门店' },
  { label: '天落会宿公寓(前海壹方城宝安中心店)', poiId: '1796067693589061634' },
]

const roomGroups: RoomOption[] = [
  { type: '顶层套房（浴缸巨幕电竞麻将）', room: '房间1（净）', value: '顶层套房 房间1', roomId: 'room-penthouse-1' },
  { type: '总裁套间（桑拿浴缸露台电竞麻将）', room: '房间1（净）', value: '总裁套间 房间1', roomId: 'room-president-1' },
  { type: '天落大床电竞套间', room: '1（净）', value: '天落大床电竞套间 1', roomId: 'room-esports-1' },
  { type: '观影大床房', room: '房间1（脏）', value: '观影大床房 房间1', roomId: 'room-observation-1' },
]

const operators: OperatorOption[] = [
  { label: '1796067693261905922', userId: '1796067693261905922' },
  { label: '路客云6TS5', userId: '1796067693261905922' },
]

const columns = ['操作时间', '操作人', '操作类型', '操作内容']
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

export function CleanLogPage() {
  const [store, setStore] = useState<StoreOption>(stores[0])
  const [room, setRoom] = useState<RoomOption | null>(null)
  const [pendingRoom, setPendingRoom] = useState<RoomOption | null>(null)
  const [roomSearch, setRoomSearch] = useState('')
  const [operator, setOperator] = useState<OperatorOption | null>(null)
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [logs, setLogs] = useState<CleanLogRecord[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastQuery, setLastQuery] = useState<CleanLogQuery | null>(null)
  const initialRequestStarted = useRef(false)

  const campId = useMemo(() => resolveCleanLogCampId(), [])
  const visibleRooms = roomGroups.filter((item) => {
    const keyword = roomSearch.trim()
    if (!keyword) return true
    return `${item.type}${item.room}${item.value}`.includes(keyword)
  })

  const runQuery = useCallback(async (query: CleanLogQuery | null) => {
    if (!query) {
      setLogs([])
      setTotal(null)
      setError('缺少门店上下文 campId，无法发起真实保洁日志请求。请从带门店上下文的入口进入，或通过 URL query / localStorage.pmsCampId 提供 campId。')
      setNotice('保洁日志请求被阻塞')
      return
    }

    setIsLoading(true)
    setError('')
    setNotice('正在请求真实保洁日志接口...')
    setLastQuery(query)

    try {
      const data = await fetchCleanLogs(query)
      setLogs(data.list)
      setTotal(data.total)
      setNotice(data.total > 0 ? `已加载 ${data.total} 条保洁日志` : '真实接口返回空数据')
    } catch (requestError) {
      setLogs([])
      setTotal(null)
      setError(`真实接口请求失败：${requestError instanceof Error ? requestError.message : String(requestError)}。这通常表示登录态、CORS、权限或后端接口不可达阻塞。`)
      setNotice('保洁日志请求失败')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (initialRequestStarted.current) return
    initialRequestStarted.current = true
    void runQuery(buildQuery({ campId, store, room, operator, dateStart, dateEnd }))
  }, [campId, dateEnd, dateStart, operator, room, runQuery, store])

  function resetFilters() {
    const resetStore = stores[0]
    setStore(resetStore)
    setRoom(null)
    setPendingRoom(null)
    setRoomSearch('')
    setOperator(null)
    setDateStart('')
    setDateEnd('')
    setOpenSelect(null)
    setRoomDialogOpen(false)
    setDatePickerOpen(false)
    setNotice('筛选条件已重置，正在重新请求保洁日志')
    void runQuery(buildQuery({ campId, store: resetStore, room: null, operator: null, dateStart: '', dateEnd: '' }))
  }

  function openDatePicker() {
    setOpenSelect(null)
    setRoomDialogOpen(false)
    setDatePickerOpen(true)
  }

  function searchLogs() {
    setOpenSelect(null)
    setDatePickerOpen(false)
    void runQuery(buildQuery({ campId, store, room, operator, dateStart, dateEnd }))
  }

  function retryLastQuery() {
    void runQuery(lastQuery ?? buildQuery({ campId, store, room, operator, dateStart, dateEnd }))
  }

  function handleDateSelect(date: string) {
    if (!dateStart || (dateStart && dateEnd)) {
      setDateStart(date)
      setDateEnd('')
      return
    }

    if (date < dateStart) {
      setDateEnd(dateStart)
      setDateStart(date)
      setDatePickerOpen(false)
      return
    }

    setDateEnd(date)
    setDatePickerOpen(false)
  }

  return (
    <div className="clean-log-page">
      <section className="clean-log-toolbar" aria-label="保洁日志筛选">
        <div className="clean-log-store-row">
          <span className="clean-log-label">门店：</span>
          <div className="clean-log-store-tabs" role="group" aria-label="门店筛选">
            {stores.map((item) => (
              <button
                key={item.label}
                type="button"
                aria-pressed={store.label === item.label}
                className={store.label === item.label ? 'is-active' : ''}
                disabled={isLoading}
                onClick={() => {
                  setStore(item)
                  setNotice(`已切换门店筛选：${item.label}`)
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="clean-log-filter-row">
          <div className="clean-log-select-field">
            <span className="clean-log-label">房型房间：</span>
            <div className="clean-log-select-wrap">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={roomDialogOpen}
                disabled={isLoading}
                onClick={() => {
                  setOpenSelect(null)
                  setPendingRoom(room)
                  setRoomSearch('')
                  setRoomDialogOpen(true)
                }}
              >
                {room?.value || '请选择房间'}
              </button>
            </div>
          </div>

          <fieldset className="clean-log-date-range" aria-label="操作日期" disabled={isLoading}>
            <legend>操作日期：</legend>
            <div className="clean-log-date-control">
              <input
                aria-label="操作日期开始"
                placeholder="开始日期"
                value={dateStart}
                onFocus={openDatePicker}
                onClick={openDatePicker}
                onChange={(event) => setDateStart(event.target.value)}
              />
              <span aria-hidden="true">→</span>
              <input
                aria-label="操作日期结束"
                placeholder="结束日期"
                value={dateEnd}
                onFocus={openDatePicker}
                onClick={openDatePicker}
                onChange={(event) => setDateEnd(event.target.value)}
              />
              {datePickerOpen ? <DateRangePicker onSelect={handleDateSelect} /> : null}
            </div>
          </fieldset>

          <SelectField
            label="操作人"
            placeholder="请选择操作人"
            value={operator?.label || ''}
            kind="operator"
            openSelect={openSelect}
            disabled={isLoading}
            options={operators}
            onToggle={() => {
              setDatePickerOpen(false)
              setOpenSelect(openSelect === 'operator' ? null : 'operator')
            }}
            onSelect={(value) => {
              setOperator(value)
              setOpenSelect(null)
            }}
          />

          <div className="clean-log-actions">
            <button type="button" className="is-primary" disabled={isLoading} onClick={searchLogs}>
              {isLoading ? '搜索中' : '搜 索'}
            </button>
            <button type="button" disabled={isLoading} onClick={resetFilters}>
              重 置
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="clean-log-error" role="alert">
          <span>{error}</span>
          <button type="button" disabled={isLoading} onClick={retryLastQuery}>
            重试
          </button>
        </div>
      ) : null}

      <section className="clean-log-table" aria-label="保洁日志列表" aria-busy={isLoading}>
        <div className="clean-log-table__head">
          {columns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        {logs.length > 0 ? (
          <div className="clean-log-table__body">
            {logs.map((log, index) => (
              <div className="clean-log-table__row" key={log.id ?? `${log.operatorTime}-${index}`}>
                <span>{log.operatorTime || '-'}</span>
                <span>{log.operatorName || '-'}</span>
                <span>{formatOperatorType(log.operatorType)}</span>
                <span>{log.operatorDetails || '-'}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="clean-log-empty">
            <span className="clean-log-empty__icon" aria-hidden="true" />
            <span>{isLoading ? '正在加载' : '暂无数据'}</span>
          </div>
        )}
      </section>

      {notice ? (
        <div className="clean-log-status" role="status">
          {notice}
          {total !== null ? <span>，当前显示 {logs.length} 条</span> : null}
        </div>
      ) : null}

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
              <button type="button" onClick={() => setNotice('目标站房型标签未返回可选项，本地记录为不可用反馈')}>
                请选择房型标签
              </button>
              <input
                placeholder="输入房间/房型名称"
                aria-label="房间或房型搜索"
                value={roomSearch}
                onChange={(event) => setRoomSearch(event.target.value)}
              />
            </div>
            <div className="clean-log-room-list" role="listbox" aria-label="房间列表">
              {visibleRooms.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={pendingRoom?.value === item.value}
                  aria-label={`${item.type} ${item.room}`}
                  onClick={() => setPendingRoom(item)}
                >
                  <i aria-hidden="true" />
                  <span>{item.type}</span>
                  <em>{item.room}</em>
                  <b aria-hidden="true">⌄</b>
                </button>
              ))}
              {visibleRooms.length === 0 ? <div className="clean-log-room-empty">暂无匹配房间</div> : null}
            </div>
            <footer>
              <button type="button" onClick={() => setRoomDialogOpen(false)}>
                取 消
              </button>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  setRoom(pendingRoom)
                  setRoomDialogOpen(false)
                }}
              >
                确 定
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function buildQuery({
  campId,
  store,
  room,
  operator,
  dateStart,
  dateEnd,
}: {
  campId: string
  store: StoreOption
  room: RoomOption | null
  operator: OperatorOption | null
  dateStart: string
  dateEnd: string
}): CleanLogQuery | null {
  if (!campId) return null

  const query: CleanLogQuery = {
    campId,
    pageNum: 1,
    pageSize: PAGE_SIZE,
  }

  if (store.poiId) query.poiId = store.poiId
  if (room?.roomId) query.roomId = [room.roomId]
  if (operator?.userId) query.operatorId = operator.userId
  if (dateStart.trim()) query.operatorStartTime = dateToTimestamp(dateStart.trim())
  if (dateEnd.trim()) query.operatorEndTime = dateToTimestamp(dateEnd.trim())

  return query
}

function DateRangePicker({ onSelect }: { onSelect: (date: string) => void }) {
  const baseDate = new Date()
  const months = [0, 1].map((offset) => new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1))

  return (
    <div className="clean-log-calendar-popover" role="dialog" aria-label="操作日期选择">
      {months.map((monthDate) => (
        <section key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`} className="clean-log-calendar-month">
          <strong>{`${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月`}</strong>
          <div className="clean-log-calendar-grid clean-log-calendar-weekdays">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div className="clean-log-calendar-grid">
            {buildMonthGrid(monthDate).map((day, index) => (
              <button
                key={`${day.value}-${index}`}
                type="button"
                className={day.inMonth ? '' : 'is-muted'}
                onClick={() => onSelect(day.isoDate)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function buildMonthGrid(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPreviousMonth = new Date(year, month, 0).getDate()
  const mondayBasedOffset = (firstDay.getDay() + 6) % 7

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - mondayBasedOffset + 1
    if (dayNumber < 1) {
      const label = daysInPreviousMonth + dayNumber
      const date = new Date(year, month - 1, label)
      return { label, value: `prev-${label}`, inMonth: false, isoDate: formatDate(date) }
    }
    if (dayNumber > daysInMonth) {
      const label = dayNumber - daysInMonth
      const date = new Date(year, month + 1, label)
      return { label, value: `next-${label}`, inMonth: false, isoDate: formatDate(date) }
    }
    return { label: dayNumber, value: `current-${dayNumber}`, inMonth: true, isoDate: formatDate(new Date(year, month, dayNumber)) }
  })
}

function SelectField({
  label,
  placeholder,
  value,
  kind,
  openSelect,
  disabled,
  options,
  onToggle,
  onSelect,
}: {
  label: string
  placeholder: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  disabled: boolean
  options: OperatorOption[]
  onToggle: () => void
  onSelect: (value: OperatorOption) => void
}) {
  return (
    <div className="clean-log-select-field">
      <span className="clean-log-label">{label}：</span>
      <div className="clean-log-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={openSelect === kind} disabled={disabled} onClick={onToggle}>
          {value || placeholder}
        </button>
        {openSelect === kind ? (
          <div className="clean-log-options" role="listbox" aria-label={`${label}筛选`}>
            {options.map((option) => (
              <button
                key={`${option.userId}-${option.label}`}
                type="button"
                role="option"
                aria-selected={value === option.label}
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

function resolveCleanLogCampId() {
  const params = new URLSearchParams(window.location.search)
  const fromQuery = params.get('campId')
  if (fromQuery) return fromQuery

  for (const key of ['pmsCampId', 'lastSelectCampId', 'currentCamp', 'camp', 'pms.currentCamp']) {
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

  const fromEnv = import.meta.env.VITE_PMS_CAMP_ID as string | undefined
  return fromEnv ?? ''
}

function dateToTimestamp(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return Date.parse(value)
  return new Date(year, month - 1, day).getTime()
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatOperatorType(value: CleanLogRecord['operatorType']) {
  const labels: Record<string, string> = {
    '1': '添加',
    '2': '修改',
    '3': '删除',
    '4': '完成',
    '5': '取消',
    '6': '状态更新',
  }

  return labels[String(value ?? '')] ?? (value ? String(value) : '-')
}
