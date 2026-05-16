import { useState } from 'react'
import './CleanLogPage.css'

type SelectKind = 'operator' | null

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']
const roomGroups = [
  { type: '顶层套房（浴缸巨幕电竞麻将）', room: '房间1（净）', value: '顶层套房 房间1' },
  { type: '总裁套间（桑拿浴缸露台电竞麻将）', room: '房间1（净）', value: '总裁套间 房间1' },
  { type: '天落大床电竞套间', room: '1（净）', value: '天落大床电竞套间 1' },
  { type: '观影大床房', room: '房间1（脏）', value: '观影大床房 房间1' },
]
const operators = ['1796067693261905922', '路客云6TS5']
const columns = ['操作时间', '操作人', '操作类型', '操作内容']
const weekdays = ['一', '二', '三', '四', '五', '六', '日']

export function CleanLogPage() {
  const [store, setStore] = useState(stores[0])
  const [room, setRoom] = useState('')
  const [pendingRoom, setPendingRoom] = useState('')
  const [operator, setOperator] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [roomDialogOpen, setRoomDialogOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [notice, setNotice] = useState('')

  function resetFilters() {
    setStore(stores[0])
    setRoom('')
    setPendingRoom('')
    setOperator('')
    setDateStart('')
    setDateEnd('')
    setOpenSelect(null)
    setRoomDialogOpen(false)
    setDatePickerOpen(false)
    setNotice('')
  }

  function openDatePicker() {
    setOpenSelect(null)
    setRoomDialogOpen(false)
    setDatePickerOpen(true)
  }

  return (
    <div className="clean-log-page">
      <section className="clean-log-toolbar" aria-label="保洁日志筛选">
        <div className="clean-log-store-row">
          <span className="clean-log-label">门店：</span>
          <div className="clean-log-store-tabs" role="group" aria-label="门店筛选">
            {stores.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={store === item}
                className={store === item ? 'is-active' : ''}
                onClick={() => setStore(item)}
              >
                {item}
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
                onClick={() => {
                  setOpenSelect(null)
                  setPendingRoom(room)
                  setRoomDialogOpen(true)
                }}
              >
                {room || '请选择房间'}
              </button>
            </div>
          </div>

          <fieldset className="clean-log-date-range" aria-label="操作日期">
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
              {datePickerOpen ? <DateRangePicker /> : null}
            </div>
          </fieldset>

          <SelectField
            label="操作人"
            placeholder="请选择操作人"
            value={operator}
            kind="operator"
            openSelect={openSelect}
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
            <button
              type="button"
              className="is-primary"
              onClick={() => {
                setOpenSelect(null)
                setDatePickerOpen(false)
                setNotice('已按当前条件搜索')
              }}
            >
              搜 索
            </button>
            <button type="button" onClick={resetFilters}>
              重 置
            </button>
          </div>
        </div>
      </section>

      <section className="clean-log-table" aria-label="保洁日志列表">
        <div className="clean-log-table__head">
          {columns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="clean-log-empty">
          <span className="clean-log-empty__icon" aria-hidden="true" />
          <span>暂无数据</span>
        </div>
      </section>

      {notice ? (
        <div className="clean-log-status" role="status">
          {notice}
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
              <button type="button">请选择房型标签</button>
              <input placeholder="输入房间/房型名称" aria-label="房间或房型搜索" />
            </div>
            <div className="clean-log-room-list" role="listbox" aria-label="房间列表">
              {roomGroups.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={pendingRoom === item.value}
                  aria-label={`${item.type} ${item.room}`}
                  onClick={() => setPendingRoom(item.value)}
                >
                  <i aria-hidden="true" />
                  <span>{item.type}</span>
                  <em>{item.room}</em>
                  <b aria-hidden="true">⌄</b>
                </button>
              ))}
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

function DateRangePicker() {
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
              <button key={`${day.value}-${index}`} type="button" className={day.inMonth ? '' : 'is-muted'}>
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
      return { label, value: `prev-${label}`, inMonth: false }
    }
    if (dayNumber > daysInMonth) {
      const label = dayNumber - daysInMonth
      return { label, value: `next-${label}`, inMonth: false }
    }
    return { label: dayNumber, value: `current-${dayNumber}`, inMonth: true }
  })
}

function SelectField({
  label,
  placeholder,
  value,
  kind,
  openSelect,
  options,
  onToggle,
  onSelect,
}: {
  label: string
  placeholder: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  options: string[]
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="clean-log-select-field">
      <span className="clean-log-label">{label}：</span>
      <div className="clean-log-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={openSelect === kind} onClick={onToggle}>
          {value || placeholder}
        </button>
        {openSelect === kind ? (
          <div className="clean-log-options" role="listbox" aria-label={`${label}筛选`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => onSelect(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
