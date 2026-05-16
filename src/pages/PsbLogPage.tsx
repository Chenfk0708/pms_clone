import { useEffect, useState } from 'react'
import './PsbLogPage.css'

const reportTypeOptions = ['入住', '续住', '换房', '退房', '未知', '删除入住登记']
const reportStatusOptions = ['失败', '成功']

const tableColumns = [
  '姓名',
  '手机号',
  '证件号码',
  '房间号',
  '订单来源',
  '订单号',
  '路客云订单号',
  '上报时间',
  '上报类型',
  '上报状态',
  '备注',
]

type OpenPopup = 'date' | 'type' | 'status' | null

export function PsbLogPage() {
  const [keyword, setKeyword] = useState('')
  const [openPopup, setOpenPopup] = useState<OpenPopup>(null)

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenPopup(null)
      }
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <div className="psb-log-page">
      <h1 className="psb-log-title">上报日志</h1>
      <span className="psb-log-version">版本号：v4.10.7</span>

      <section className="psb-log-panel" aria-label="上报日志">
        <div className="psb-log-store-row" role="radiogroup" aria-label="门店范围">
          <label className="psb-log-store is-active">
            <input type="radio" name="psb-store" defaultChecked />
            <span>全部门店</span>
          </label>
          <label className="psb-log-store">
            <input type="radio" name="psb-store" value="1796425098638573570" />
            <span>天落会宿公寓(前海壹方城宝安中心店)</span>
          </label>
          <button type="button" className="psb-log-gear" aria-label="门店设置">
            ⚙
          </button>
        </div>

        <div className="psb-log-toolbar">
          <label className="psb-log-field psb-log-field--keyword">
            <span>搜索：</span>
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="请输入订单号/手机号/房号"
            />
          </label>

          <div className="psb-log-field psb-log-field--date">
            <span>上报时间:</span>
            <button
              type="button"
              className={`psb-log-date-button${openPopup === 'date' ? ' is-open' : ''}`}
              onClick={() => setOpenPopup(openPopup === 'date' ? null : 'date')}
            >
              <span>上报时间</span>
              <em>请选择</em>
              <i aria-hidden="true" />
              <em>请选择</em>
              <b aria-hidden="true">▣</b>
            </button>
            {openPopup === 'date' ? <DatePickerPopup /> : null}
          </div>

          <SelectFilter
            label="上报类型"
            options={reportTypeOptions}
            open={openPopup === 'type'}
            onToggle={() => setOpenPopup(openPopup === 'type' ? null : 'type')}
          />

          <SelectFilter
            label="上报状态"
            options={reportStatusOptions}
            open={openPopup === 'status'}
            onToggle={() => setOpenPopup(openPopup === 'status' ? null : 'status')}
          />

          <div className="psb-log-actions">
            <button type="button" className="psb-log-button is-ghost" onClick={() => setKeyword('')}>
              重 置
            </button>
            <button type="button" className="psb-log-button is-primary">
              查 询
            </button>
          </div>
        </div>

        <div className="psb-log-table" role="table" aria-label="上报日志列表">
          <div className="psb-log-table__head" role="row">
            {tableColumns.map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          <div className="psb-log-table__empty" role="row">
            <div role="cell" aria-colspan={tableColumns.length}>
              <span className="psb-log-empty-icon" aria-hidden="true" />
              <strong>暂无数据</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SelectFilter({
  label,
  options,
  open,
  onToggle,
}: {
  label: string
  options: string[]
  open: boolean
  onToggle: () => void
}) {
  return (
    <div className="psb-log-field psb-log-field--select">
      <span>{label}:</span>
      <button
        type="button"
        className={`psb-log-select-button${open ? ' is-open' : ''}`}
        onClick={onToggle}
      >
        <span>{label}</span>
        <em>请选择</em>
        <i aria-hidden="true" />
      </button>
      {open ? (
        <div className="psb-log-dropdown" role="listbox" aria-label={label}>
          {options.map((option, index) => (
            <div key={option} role="option" aria-selected={index === 0}>
              {option}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DatePickerPopup() {
  return (
    <div className="psb-log-calendar" role="dialog" aria-label="上报时间">
      <div className="psb-log-calendar__months">
        <CalendarMonth
          title="2026年5月"
          leadDays={['27', '28', '29', '30']}
          days={Array.from({ length: 31 }, (_, index) => String(index + 1))}
          tailDays={['1', '2', '3', '4', '5', '6', '7']}
          activeDay="14"
        />
        <CalendarMonth
          title="2026年6月"
          leadDays={[]}
          days={Array.from({ length: 30 }, (_, index) => String(index + 1))}
          tailDays={['1', '2', '3', '4', '5']}
        />
      </div>
    </div>
  )
}

function CalendarMonth({
  title,
  leadDays,
  days,
  tailDays,
  activeDay,
}: {
  title: string
  leadDays: string[]
  days: string[]
  tailDays: string[]
  activeDay?: string
}) {
  return (
    <section className="psb-log-month" aria-label={title}>
      <header>
        <button type="button" aria-label={`${title} 上一月`}>
          ‹
        </button>
        <strong>{title}</strong>
        <button type="button" aria-label={`${title} 下一月`}>
          ›
        </button>
      </header>
      <div className="psb-log-weekdays" aria-hidden="true">
        {['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="psb-log-days">
        {leadDays.map((day) => (
          <span key={`lead-${day}`} className="is-muted">
            {day}
          </span>
        ))}
        {days.map((day) => (
          <button key={day} type="button" className={day === activeDay ? 'is-active' : ''}>
            {day}
          </button>
        ))}
        {tailDays.map((day) => (
          <span key={`tail-${day}`} className="is-muted">
            {day}
          </span>
        ))}
      </div>
    </section>
  )
}
