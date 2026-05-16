import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ShiftRecordPage.css'

type StaffField = 'handover' | 'receiver'

const staffOptions = ['路客云6TS5']

const tableColumns = [
  '交班日期',
  '交班班次',
  '交班人',
  '交班时间',
  '接班人',
  '接班时间',
  '交接状态',
  '交班备注',
  '接班备注',
  '系统生成时间',
  '操作',
]

const mayWeeks = [
  ['27', '28', '29', '30', '1', '2', '3'],
  ['4', '5', '6', '7', '8', '9', '10'],
  ['11', '12', '13', '14', '15', '16', '17'],
  ['18', '19', '20', '21', '22', '23', '24'],
  ['25', '26', '27', '28', '29', '30', '31'],
  ['1', '2', '3', '4', '5', '6', '7'],
]

const juneWeeks = [
  ['1', '2', '3', '4', '5', '6', '7'],
  ['8', '9', '10', '11', '12', '13', '14'],
  ['15', '16', '17', '18', '19', '20', '21'],
  ['22', '23', '24', '25', '26', '27', '28'],
  ['29', '30', '1', '2', '3', '4', '5'],
  ['6', '7', '8', '9', '10', '11', '12'],
]

export function ShiftRecordPage() {
  const navigate = useNavigate()
  const [dateOpen, setDateOpen] = useState(false)
  const [openStaff, setOpenStaff] = useState<StaffField | null>(null)
  const [handoverStaff, setHandoverStaff] = useState('')
  const [receiverStaff, setReceiverStaff] = useState('')

  useEffect(() => {
    function closeFloating(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setDateOpen(false)
      setOpenStaff(null)
    }

    window.addEventListener('keydown', closeFloating)
    return () => window.removeEventListener('keydown', closeFloating)
  }, [])

  function toggleStaff(field: StaffField) {
    setDateOpen(false)
    setOpenStaff((current) => (current === field ? null : field))
  }

  function selectStaff(field: StaffField, value: string) {
    if (field === 'handover') setHandoverStaff(value)
    if (field === 'receiver') setReceiverStaff(value)
    setOpenStaff(null)
  }

  return (
    <div className="shift-record-page">
      <h1 className="sr-only-heading">交接班</h1>

      <section className="shift-record-query" aria-label="交接班筛选">
        <div className="shift-record-field shift-record-date-field" role="group" aria-label="交班日期">
          <span>交班日期</span>
          <div className="shift-record-date-range">
            <input aria-label="开始日期" placeholder="开始日期" readOnly value="" onClick={() => setDateOpen(true)} />
            <em>至</em>
            <input aria-label="结束日期" placeholder="结束日期" readOnly value="" onClick={() => setDateOpen(true)} />
          </div>
        </div>

        <StaffSelect
          label="交班人"
          value={handoverStaff}
          open={openStaff === 'handover'}
          onToggle={() => toggleStaff('handover')}
          onSelect={(value) => selectStaff('handover', value)}
        />

        <StaffSelect
          label="接班人"
          value={receiverStaff}
          open={openStaff === 'receiver'}
          onToggle={() => toggleStaff('receiver')}
          onSelect={(value) => selectStaff('receiver', value)}
        />

        <button type="button" className="shift-record-settings" onClick={() => navigate('/setting/shiftSetting')}>
          设 置
        </button>

        {dateOpen ? <DatePickerDialog /> : null}
      </section>

      <section className="shift-record-table-wrap" aria-label="交接班表格">
        <table className="shift-record-table">
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="shift-record-empty-row">
              <td colSpan={tableColumns.length}>
                <div className="shift-record-empty">
                  <span aria-hidden="true" />
                  <p>暂无数据</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}

function StaffSelect({
  label,
  value,
  open,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  open: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="shift-record-field shift-record-staff-field">
      <span>{label}</span>
      <button
        type="button"
        className="shift-record-select"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label} ${value || '请选择'}`}
        onClick={onToggle}
      >
        {value || '请选择'}
      </button>
      {open ? (
        <div className="shift-record-options" role="listbox" aria-label={`${label}选项`}>
          {staffOptions.map((option) => (
            <button
              key={`${label}-${option}`}
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
  )
}

function DatePickerDialog() {
  return (
    <div className="shift-record-date-popover" role="dialog" aria-label="日期选择">
      <CalendarMonth title="2026年" month="5月" weeks={mayWeeks} />
      <CalendarMonth title="2026年" month="6月" weeks={juneWeeks} />
    </div>
  )
}

function CalendarMonth({ title, month, weeks }: { title: string; month: string; weeks: string[][] }) {
  const isMay = month === '5月'
  const isJune = month === '6月'

  return (
    <section className="shift-record-calendar" aria-label={`${title}${month}`}>
      <header>
        <button type="button" aria-label="上一月">
          ‹
        </button>
        <strong>{title}</strong>
        <strong>{month}</strong>
        <button type="button" aria-label="下一月">
          ›
        </button>
      </header>
      <div className="shift-record-weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="shift-record-days">
        {weeks.flat().map((day, index) => {
          const classNames = [
            (isMay && index < 4) || (isJune && index > 29) ? 'is-muted' : '',
            isMay && index === 17 ? 'is-today' : '',
          ].filter(Boolean)

          return (
            <button key={`${month}-${index}`} type="button" className={classNames.join(' ')}>
              {day}
            </button>
          )
        })}
      </div>
    </section>
  )
}
