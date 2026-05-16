import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './CleanTaskPage.css'

type CleanFilter = 'type' | 'status' | 'cleaner' | 'room' | null

const cleanTypes = ['退房保洁', '续住保洁', '计划保洁', '临时保洁']
const cleanStatuses = ['待分配', '待保洁', '保洁中', '已完成', '已取消']
const cleaners = ['张阿姨', '李师傅', '王保洁']
const rooms = ['顶层套房（浴缸巨幕电竞麻将） / 房间1', '总裁套间（桑拿浴缸露台电竞麻将） / 房间1', '天落大床电竞套间 / 1', '观影大床房 / 房间1']

export function CleanTaskPage() {
  const navigate = useNavigate()
  const [openFilter, setOpenFilter] = useState<CleanFilter>(null)
  const [room, setRoom] = useState('')
  const [cleanType, setCleanType] = useState('')
  const [status, setStatus] = useState('')
  const [cleaner, setCleaner] = useState('')
  const [date, setDate] = useState('2026-05-13 周三')
  const [notice, setNotice] = useState('')

  const resetFilters = () => {
    setRoom('')
    setCleanType('')
    setStatus('')
    setCleaner('')
    setOpenFilter(null)
    setNotice('')
  }

  function chooseFilter(value: string) {
    if (openFilter === 'room') setRoom(value)
    if (openFilter === 'type') setCleanType(value)
    if (openFilter === 'status') setStatus(value)
    if (openFilter === 'cleaner') setCleaner(value)
    setOpenFilter(null)
  }

  const optionList =
    openFilter === 'room' ? rooms : openFilter === 'type' ? cleanTypes : openFilter === 'status' ? cleanStatuses : cleaners

  return (
    <div className="clean-task-page">
      <h1 className="sr-only-heading">保洁任务</h1>
      <section className="clean-task-panel">
        <div className="clean-task-row clean-task-row--top">
          <div className="clean-store-tabs" aria-label="门店筛选">
            <button type="button" className="is-active">
              全部门店
            </button>
            <button type="button">天落会宿公寓(前海壹方城宝安中心店)</button>
          </div>
          <label className="clean-date">
            <span>保洁日期：</span>
            <button type="button" aria-label="前一天" onClick={() => setDate('2026-05-12 周二')}>
              ‹
            </button>
            <input value={date} readOnly aria-label="保洁日期" />
            <button type="button" aria-label="后一天" onClick={() => setDate('2026-05-14 周四')}>
              ›
            </button>
          </label>
          <button type="button" className="clean-export" onClick={() => setNotice('已生成保洁任务导出')}>
            导 出
          </button>
        </div>

        <div className="clean-task-row clean-task-row--filters">
          <div className="clean-filter-wrap">
            <FilterButton label="房型房间" value={room} placeholder="请选择房型房间" name="room" openFilter={openFilter} setOpenFilter={setOpenFilter} />
            <FilterButton label="保洁类型" value={cleanType} placeholder="请选择保洁类型" name="type" openFilter={openFilter} setOpenFilter={setOpenFilter} />
            <FilterButton label="保洁状态" value={status} placeholder="请选择保洁状态" name="status" openFilter={openFilter} setOpenFilter={setOpenFilter} />
            <FilterButton label="保洁员" value={cleaner} placeholder="请选择保洁员" name="cleaner" openFilter={openFilter} setOpenFilter={setOpenFilter} />
            {openFilter ? (
              <div className="clean-options" role="listbox" aria-label={`${openFilter}筛选`}>
                {optionList.map((option) => (
                  <button key={option} type="button" role="option" aria-selected={[room, cleanType, status, cleaner].includes(option)} onClick={() => chooseFilter(option)}>
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="clean-actions">
            <div className="clean-actions__row">
              <button type="button" onClick={resetFilters}>
                重 置
              </button>
              <button type="button" className="is-primary" onClick={() => setOpenFilter(null)}>
                查 询
              </button>
            </div>
            <div className="clean-actions__row">
              <button type="button" disabled>
                批量通知
              </button>
              <button type="button" className="is-primary" onClick={() => setOpenFilter(null)}>
                创建保洁任务
              </button>
            </div>
          </div>
        </div>
        {notice ? (
          <div className="clean-notice" role="status">
            {notice}
          </div>
        ) : null}
      </section>

      <section className="clean-list-card">
        <div className="clean-unpaid">
          <div className="clean-unpaid__copy">
            <strong>限时钜惠！智能保洁6折开通</strong>
            <span>自动派单 ｜实时提醒 ｜ 报表清晰</span>
            <button type="button" onClick={() => navigate('/version/applicationPayment/detail')}>订阅开通</button>
          </div>
        </div>
      </section>
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
      <button type="button" aria-haspopup="listbox" aria-expanded={openFilter === name} onClick={() => setOpenFilter(openFilter === name ? null : name)}>
        {value || placeholder}
      </button>
    </label>
  )
}
