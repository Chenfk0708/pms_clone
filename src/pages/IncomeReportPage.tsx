import { useEffect, useState } from 'react'
import './IncomeReportPage.css'

type IncomeMode = 'day' | 'month' | 'store' | 'channel' | 'roomType' | 'room' | 'checkout'
type SelectKind = 'roomType' | 'channel' | 'roomGroup' | null

interface IncomeRow {
  name: string
  roomFee: string
  commission: string
  grossRoomFee: string
  other: string
  orderIncome: string
  manualIncome?: string
  totalGross?: string
  totalNet?: string
}

interface ChannelRow {
  name: string
  roomFee: string
  roomFeeRatio: string
  commission: string
  commissionRatio: string
  grossRoomFee: string
  other: string
  orderIncome: string
}

const stores = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']
const incomeModes: Array<{ key: IncomeMode; label: string }> = [
  { key: 'day', label: '按日' },
  { key: 'month', label: '按月' },
  { key: 'store', label: '按门店' },
  { key: 'channel', label: '按渠道' },
  { key: 'roomType', label: '按房型' },
  { key: 'room', label: '按房间' },
  { key: 'checkout', label: '按退房时间' },
]

const roomTypeOptions = ['观影大床房', '天落大床电竞套间', '总裁套间（桑拿浴缸露台电竞麻将）', '顶层套房（浴缸巨幕电竞麻将）']
const channelOptions = ['自来客', '路客云聚合', '美团民宿', '美团酒店', '途家', '飞猪淘酒店', '小猪', '木鸟', '携程']

const defaultRows: IncomeRow[] = [
  { name: '合计', roomFee: '7102.14', commission: '1785.32', grossRoomFee: '8887.46', other: '0', orderIncome: '8887.46', manualIncome: '0', totalGross: '8887.46', totalNet: '7102.14' },
  { name: '2026-05-01', roomFee: '966.87', commission: '314.25', grossRoomFee: '1281.12', other: '0', orderIncome: '1281.12', manualIncome: '0', totalGross: '1281.12', totalNet: '966.87' },
  { name: '2026-05-02', roomFee: '682', commission: '113.69', grossRoomFee: '795.69', other: '0', orderIncome: '795.69', manualIncome: '0', totalGross: '795.69', totalNet: '682' },
  { name: '2026-05-03', roomFee: '791.8', commission: '87.2', grossRoomFee: '879', other: '0', orderIncome: '879', manualIncome: '0', totalGross: '879', totalNet: '791.8' },
  { name: '2026-05-04', roomFee: '895.3', commission: '289.16', grossRoomFee: '1184.46', other: '0', orderIncome: '1184.46', manualIncome: '0', totalGross: '1184.46', totalNet: '895.3' },
  { name: '2026-05-05', roomFee: '623.21', commission: '177.79', grossRoomFee: '801', other: '0', orderIncome: '801', manualIncome: '0', totalGross: '801', totalNet: '623.21' },
  { name: '2026-05-06', roomFee: '160.28', commission: '11.41', grossRoomFee: '171.69', other: '0', orderIncome: '171.69', manualIncome: '0', totalGross: '171.69', totalNet: '160.28' },
  { name: '2026-05-07', roomFee: '163.94', commission: '47.06', grossRoomFee: '211', other: '0', orderIncome: '211', manualIncome: '0', totalGross: '211', totalNet: '163.94' },
  { name: '2026-05-08', roomFee: '182.81', commission: '48.19', grossRoomFee: '231', other: '0', orderIncome: '231', manualIncome: '0', totalGross: '231', totalNet: '182.81' },
  { name: '2026-05-09', roomFee: '182.81', commission: '48.19', grossRoomFee: '231', other: '0', orderIncome: '231', manualIncome: '0', totalGross: '231', totalNet: '182.81' },
  { name: '2026-05-10', roomFee: '302.59', commission: '93.41', grossRoomFee: '396', other: '0', orderIncome: '396', manualIncome: '0', totalGross: '396', totalNet: '302.59' },
  { name: '2026-05-11', roomFee: '327.88', commission: '94.12', grossRoomFee: '422', other: '0', orderIncome: '422', manualIncome: '0', totalGross: '422', totalNet: '327.88' },
  { name: '2026-05-12', roomFee: '497.7', commission: '128.37', grossRoomFee: '626.07', other: '0', orderIncome: '626.07', manualIncome: '0', totalGross: '626.07', totalNet: '497.7' },
  { name: '2026-05-13', roomFee: '819.13', commission: '191.87', grossRoomFee: '1011', other: '0', orderIncome: '1011', manualIncome: '0', totalGross: '1011', totalNet: '819.13' },
  { name: '2026-05-14', roomFee: '505.82', commission: '140.61', grossRoomFee: '646.43', other: '0', orderIncome: '646.43', manualIncome: '0', totalGross: '646.43', totalNet: '505.82' },
]

const monthRows: IncomeRow[] = [
  { name: '合计', roomFee: '127317.3', commission: '25334', grossRoomFee: '152651.31', other: '0', orderIncome: '152651.31', manualIncome: '0', totalGross: '152651.31', totalNet: '127317.3' },
  { name: '2025-11', roomFee: '25137.97', commission: '2786.36', grossRoomFee: '27924.34', other: '0', orderIncome: '27924.34', manualIncome: '0', totalGross: '27924.34', totalNet: '25137.97' },
  { name: '2025-12', roomFee: '21679.37', commission: '3177.57', grossRoomFee: '24856.94', other: '0', orderIncome: '24856.94', manualIncome: '0', totalGross: '24856.94', totalNet: '21679.37' },
  { name: '2026-01', roomFee: '14952.61', commission: '4185.29', grossRoomFee: '19137.88', other: '0', orderIncome: '19137.88', manualIncome: '0', totalGross: '19137.88', totalNet: '14952.61' },
  { name: '2026-02', roomFee: '17124.37', commission: '4306.29', grossRoomFee: '21430.66', other: '0', orderIncome: '21430.66', manualIncome: '0', totalGross: '21430.66', totalNet: '17124.37' },
  { name: '2026-03', roomFee: '22712.59', commission: '4592.73', grossRoomFee: '27305.34', other: '0', orderIncome: '27305.34', manualIncome: '0', totalGross: '27305.34', totalNet: '22712.59' },
  { name: '2026-04', roomFee: '17502.68', commission: '4341.01', grossRoomFee: '21843.69', other: '0', orderIncome: '21843.69', manualIncome: '0', totalGross: '21843.69', totalNet: '17502.68' },
  { name: '2026-05', roomFee: '8207.71', commission: '1944.75', grossRoomFee: '10152.46', other: '0', orderIncome: '10152.46', manualIncome: '0', totalGross: '10152.46', totalNet: '8207.71' },
]

const storeRows: IncomeRow[] = [
  defaultRows[0],
  { name: stores[1], roomFee: '7102.14', commission: '1785.32', grossRoomFee: '8887.46', other: '0', orderIncome: '8887.46', manualIncome: '0', totalGross: '8887.46', totalNet: '7102.14' },
]

const roomTypeRows: IncomeRow[] = [
  defaultRows[0],
  { name: '观影大床房', roomFee: '2707.45', commission: '627.36', grossRoomFee: '3334.81', other: '0', orderIncome: '3334.81', manualIncome: '0', totalGross: '3334.81', totalNet: '2707.45' },
  { name: '天落大床电竞套间', roomFee: '1008.65', commission: '261.08', grossRoomFee: '1269.73', other: '0', orderIncome: '1269.73', manualIncome: '0', totalGross: '1269.73', totalNet: '1008.65' },
  { name: '总裁套间（桑拿浴缸露台电竞麻将）', roomFee: '2203.22', commission: '432.78', grossRoomFee: '2636', other: '0', orderIncome: '2636', manualIncome: '0', totalGross: '2636', totalNet: '2203.22' },
  { name: '顶层套房（浴缸巨幕电竞麻将）', roomFee: '1182.82', commission: '464.1', grossRoomFee: '1646.92', other: '0', orderIncome: '1646.92', manualIncome: '0', totalGross: '1646.92', totalNet: '1182.82' },
]

const roomRows: IncomeRow[] = [
  { name: '合计', roomFee: '6938.2', commission: '1738.26', grossRoomFee: '8676.46', other: '0', orderIncome: '8676.46', manualIncome: '0', totalGross: '8676.46', totalNet: '6938.2' },
  { name: '观影大床房(房间1)', roomFee: '2543.51', commission: '580.3', grossRoomFee: '3123.81', other: '0', orderIncome: '3123.81', manualIncome: '0', totalGross: '3123.81', totalNet: '2543.51' },
  { name: '天落大床电竞套间(1)', roomFee: '1008.65', commission: '261.08', grossRoomFee: '1269.73', other: '0', orderIncome: '1269.73', manualIncome: '0', totalGross: '1269.73', totalNet: '1008.65' },
  { name: '总裁套间（桑拿浴缸露台电竞麻将）(房间1)', roomFee: '2203.22', commission: '432.78', grossRoomFee: '2636', other: '0', orderIncome: '2636', manualIncome: '0', totalGross: '2636', totalNet: '2203.22' },
  { name: '顶层套房（浴缸巨幕电竞麻将）(房间1)', roomFee: '1182.82', commission: '464.1', grossRoomFee: '1646.92', other: '0', orderIncome: '1646.92', manualIncome: '0', totalGross: '1646.92', totalNet: '1182.82' },
]

const checkoutRows: IncomeRow[] = [
  { name: '合计', roomFee: '6862.56', commission: '1762.13', grossRoomFee: '8624.69', other: '0', orderIncome: '8624.69', manualIncome: '0', totalGross: '8624.69', totalNet: '6862.56' },
  { name: '2026-05-01', roomFee: '266.24', commission: '117.42', grossRoomFee: '383.66', other: '0', orderIncome: '383.66', manualIncome: '0', totalGross: '383.66', totalNet: '266.24' },
  { name: '2026-05-02', roomFee: '668.07', commission: '281.05', grossRoomFee: '949.12', other: '0', orderIncome: '949.12', manualIncome: '0', totalGross: '949.12', totalNet: '668.07' },
  { name: '2026-05-03', roomFee: '383.2', commission: '80.49', grossRoomFee: '463.69', other: '0', orderIncome: '463.69', manualIncome: '0', totalGross: '463.69', totalNet: '383.2' },
  { name: '2026-05-04', roomFee: '493', commission: '54', grossRoomFee: '547', other: '0', orderIncome: '547', manualIncome: '0', totalGross: '547', totalNet: '493' },
  { name: '2026-05-05', roomFee: '1791.7', commission: '388.76', grossRoomFee: '2180.46', other: '0', orderIncome: '2180.46', manualIncome: '0', totalGross: '2180.46', totalNet: '1791.7' },
  { name: '2026-05-06', roomFee: '623.21', commission: '177.79', grossRoomFee: '801', other: '0', orderIncome: '801', manualIncome: '0', totalGross: '801', totalNet: '623.21' },
  { name: '2026-05-07', roomFee: '160.28', commission: '11.41', grossRoomFee: '171.69', other: '0', orderIncome: '171.69', manualIncome: '0', totalGross: '171.69', totalNet: '160.28' },
  { name: '2026-05-08', roomFee: '163.94', commission: '47.06', grossRoomFee: '211', other: '0', orderIncome: '211', manualIncome: '0', totalGross: '211', totalNet: '163.94' },
]

const channelRows: ChannelRow[] = [
  { name: '合计', roomFee: '7102.14', roomFeeRatio: '-', commission: '1785.32', commissionRatio: '-', grossRoomFee: '8887.46', other: '0', orderIncome: '8887.46' },
  { name: '携程', roomFee: '3307.29', roomFeeRatio: '46.57%', commission: '966.71', commissionRatio: '54.15%', grossRoomFee: '4274', other: '0', orderIncome: '4274' },
  { name: '美团酒店', roomFee: '1050.56', roomFeeRatio: '14.79%', commission: '504.45', commissionRatio: '28.26%', grossRoomFee: '1555.01', other: '0', orderIncome: '1555.01' },
  { name: '飞猪淘酒店', roomFee: '2374.54', roomFeeRatio: '33.43%', commission: '248.91', commissionRatio: '13.94%', grossRoomFee: '2623.45', other: '0', orderIncome: '2623.45' },
  { name: '路客云聚合', roomFee: '369.75', roomFeeRatio: '5.21%', commission: '65.25', commissionRatio: '3.65%', grossRoomFee: '435', other: '0', orderIncome: '435' },
]

const descriptions = [
  ['总营收(减佣)', '房费(减佣)+其他消费+记一笔收入'],
  ['房费(减佣)', '房费(含佣) - 佣金'],
  ['佣金', '渠道佣金，包括渠道优惠'],
  ['房费(含佣)', '住宿订单的开票金额'],
  ['全日房费(含佣)', '全日房订单的开票金额'],
  ['钟点房费(含佣)', '钟点房订单的开票金额'],
  ['其他消费', '订单的其他收入/支出的金额累加'],
  ['订单总收入', '房费(含佣)+其他消费'],
  ['记一笔收入', '记一笔录入的收入'],
  ['总营收(含佣)', '房费(含佣)+其他消费+记一笔收入'],
]

export function IncomeReportPage() {
  const [mode, setMode] = useState<IncomeMode>('day')
  const [store, setStore] = useState(stores[0])
  const [expanded, setExpanded] = useState(true)
  const [startDate, setStartDate] = useState('2026-05-01')
  const [endDate, setEndDate] = useState('2026-05-14')
  const [roomType, setRoomType] = useState('')
  const [channel, setChannel] = useState('')
  const [roomGroup, setRoomGroup] = useState('')
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [datePanelOpen, setDatePanelOpen] = useState(false)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpenSelect(null)
      setDatePanelOpen(false)
      setDescriptionOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const isMonthMode = mode === 'month'

  function switchMode(nextMode: IncomeMode) {
    setMode(nextMode)
    setOpenSelect(null)
    setDatePanelOpen(false)
    setNotice('')
  }

  function resetFilters() {
    setStore(stores[0])
    setExpanded(true)
    setStartDate('2026-05-01')
    setEndDate('2026-05-14')
    setRoomType('')
    setChannel('')
    setRoomGroup('')
    setOpenSelect(null)
    setDatePanelOpen(false)
    setNotice('')
  }

  return (
    <div className="income-report-page">
      <h1 className="sr-only-heading">收入报表</h1>

      <section className="income-report-query" aria-label="收入报表筛选">
        <div className="income-report-mode" role="group" aria-label="统计维度">
          {incomeModes.map((item) => (
            <button key={item.key} type="button" className={mode === item.key ? 'is-active' : ''} onClick={() => switchMode(item.key)}>
              {item.label}
            </button>
          ))}
        </div>

        <div className="income-report-form">
          <div className="income-report-store-row" aria-label="门店">
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

          {expanded ? (
            <div className="income-report-filter-row">
              <fieldset className="income-date-range" aria-label={isMonthMode ? '月份' : '日期'}>
                <legend>{isMonthMode ? '月份' : '日期'}</legend>
                <input
                  aria-label={isMonthMode ? '开始月份' : '开始日期'}
                  placeholder={isMonthMode ? '请选择' : '开始日期'}
                  value={isMonthMode ? '2025-11' : startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  onFocus={() => !isMonthMode && setDatePanelOpen(true)}
                  onClick={() => !isMonthMode && setDatePanelOpen(true)}
                />
                <span>至</span>
                <input
                  aria-label={isMonthMode ? '结束月份' : '结束日期'}
                  placeholder={isMonthMode ? '请选择' : '结束日期'}
                  value={isMonthMode ? '2026-05' : endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  onFocus={() => !isMonthMode && setDatePanelOpen(true)}
                  onClick={() => !isMonthMode && setDatePanelOpen(true)}
                />
                {datePanelOpen ? <DatePanel /> : null}
              </fieldset>

              {mode !== 'store' ? (
                <SelectField
                  label="房型"
                  placeholder="请选择"
                  value={roomType}
                  kind="roomType"
                  openSelect={openSelect}
                  options={roomTypeOptions}
                  onToggle={() => {
                    setDatePanelOpen(false)
                    setOpenSelect(openSelect === 'roomType' ? null : 'roomType')
                  }}
                  onSelect={(value) => {
                    setRoomType(value)
                    setOpenSelect(null)
                  }}
                />
              ) : null}
              <SelectField
                label="渠道"
                placeholder="请选择"
                value={channel}
                kind="channel"
                openSelect={openSelect}
                options={channelOptions}
                onToggle={() => {
                  setDatePanelOpen(false)
                  setOpenSelect(openSelect === 'channel' ? null : 'channel')
                }}
                onSelect={(value) => {
                  setChannel(value)
                  setOpenSelect(null)
                }}
              />
              {mode !== 'store' ? (
                <SelectField
                  label="房型分组"
                  placeholder="请选择"
                  value={roomGroup}
                  kind="roomGroup"
                  openSelect={openSelect}
                  options={[]}
                  onToggle={() => {
                    setDatePanelOpen(false)
                    setOpenSelect(openSelect === 'roomGroup' ? null : 'roomGroup')
                  }}
                  onSelect={(value) => {
                    setRoomGroup(value)
                    setOpenSelect(null)
                  }}
                />
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="income-report-actions">
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={() => setNotice('已按当前条件查询收入报表')}>
            查 询
          </button>
          <button type="button" className="is-outline" onClick={() => setNotice('已生成收入报表导出任务')}>
            导 出
          </button>
          <button
            type="button"
            className="is-outline"
            onClick={() => {
              setOpenSelect(null)
              setDatePanelOpen(false)
              setDescriptionOpen(true)
            }}
          >
            说 明
          </button>
          <button
            type="button"
            className="is-link"
            onClick={() => {
              setOpenSelect(null)
              setDatePanelOpen(false)
              setExpanded((value) => !value)
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      {notice ? (
        <div className="income-report-notice" role="status">
          {notice}
        </div>
      ) : null}

      {mode === 'channel' ? <ChannelIncomeTable /> : <StandardIncomeTable mode={mode} />}

      <nav className="income-report-pagination" aria-label="分页">
        <span>{paginationText(mode)}</span>
        <button type="button" aria-label="上一页" disabled>
          ‹
        </button>
        <button type="button" className="is-current">
          1
        </button>
        <button type="button" aria-label="下一页" disabled={mode !== 'month'}>
          ›
        </button>
        <button type="button">20 条/页</button>
      </nav>

      {descriptionOpen ? (
        <div className="income-modal-backdrop" role="presentation" onClick={() => setDescriptionOpen(false)}>
          <section
            className="income-description-modal"
            role="dialog"
            aria-modal="true"
            aria-label="报表字段说明"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <strong>报表字段说明</strong>
              <button type="button" aria-label="关闭报表字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="income-description-table" aria-label="报表字段说明表格">
              <div className="income-description-table__head">
                <span>字段</span>
                <span>说明</span>
              </div>
              {descriptions.map(([field, detail]) => (
                <div key={field} className="income-description-table__row">
                  <span>{field}</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
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
  const open = openSelect === kind

  return (
    <div className="income-select-field">
      <span>{label}</span>
      <div className="income-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label} ${value || placeholder}`} onClick={onToggle}>
          {value || placeholder}
        </button>
        {open ? (
          <div className="income-options" role="listbox" aria-label={`${label}选项`}>
            {options.length > 0 ? (
              options.map((option) => (
                <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => onSelect(option)}>
                  {option}
                </button>
              ))
            ) : (
              <div className="income-empty-option" role="option" aria-selected="false">
                暂无数据
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DatePanel() {
  const mayDays = ['27', '28', '29', '30', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '1', '2', '3', '4', '5', '6', '7']
  const juneDays = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']

  return (
    <div className="income-date-panel" aria-label="日期面板">
      <CalendarMonth title="2026年5月" days={mayDays} highlighted={['1', '14']} />
      <CalendarMonth title="2026年6月" days={juneDays} highlighted={[]} />
      <div className="income-date-presets">
        {['昨天', '本周', '本月', '上月'].map((preset) => (
          <button key={preset} type="button">
            {preset}
          </button>
        ))}
      </div>
    </div>
  )
}

function CalendarMonth({ title, days, highlighted }: { title: string; days: string[]; highlighted: string[] }) {
  return (
    <section className="income-calendar-month">
      <h2>{title}</h2>
      <div className="income-calendar-weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>
      <div className="income-calendar-days">
        {days.map((day, index) => (
          <button key={`${title}-${day}-${index}`} type="button" className={highlighted.includes(day) ? 'is-picked' : ''}>
            {day}
          </button>
        ))}
      </div>
    </section>
  )
}

function StandardIncomeTable({ mode }: { mode: Exclude<IncomeMode, 'channel'> }) {
  const firstColumn = firstColumnTitle(mode)
  const rows = rowsForMode(mode)

  return (
    <section className="income-report-table-wrap" aria-label="收入报表表格">
      <table className="income-report-table">
        <thead>
          <tr>
            <th>{firstColumn}</th>
            <th>房费(减佣)</th>
            <th>佣金</th>
            <th>房费(含佣)</th>
            <th>其他消费</th>
            <th>订单总收入</th>
            <th>记一笔收入</th>
            <th>总营收(含佣)</th>
            <th>总营收(减佣)</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className={row.name === '合计' ? 'is-summary' : ''}>
              <td>{row.name}</td>
              <td>{row.roomFee}</td>
              <td>{row.commission}</td>
              <td>{row.grossRoomFee}</td>
              <td>{row.other}</td>
              <td>{row.orderIncome}</td>
              <td>{row.manualIncome}</td>
              <td>{row.totalGross}</td>
              <td>{row.totalNet}</td>
              <td>
                <button type="button" className="income-detail-link">
                  下载订单明细
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function ChannelIncomeTable() {
  return (
    <section className="income-report-table-wrap" aria-label="收入报表表格">
      <table className="income-report-table income-report-table--channel">
        <thead>
          <tr>
            <th>渠道</th>
            <th>房费(减佣)</th>
            <th>占比</th>
            <th>佣金</th>
            <th>占比</th>
            <th>房费(含佣)</th>
            <th>其他消费</th>
            <th>订单总收入</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {channelRows.map((row) => (
            <tr key={row.name} className={row.name === '合计' ? 'is-summary' : ''}>
              <td>{row.name}</td>
              <td>{row.roomFee}</td>
              <td>{row.roomFeeRatio}</td>
              <td>{row.commission}</td>
              <td>{row.commissionRatio}</td>
              <td>{row.grossRoomFee}</td>
              <td>{row.other}</td>
              <td>{row.orderIncome}</td>
              <td>
                <button type="button" className="income-detail-link">
                  下载订单明细
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function rowsForMode(mode: Exclude<IncomeMode, 'channel'>): IncomeRow[] {
  if (mode === 'month') return monthRows
  if (mode === 'store') return storeRows
  if (mode === 'roomType') return roomTypeRows
  if (mode === 'room') return roomRows
  if (mode === 'checkout') return checkoutRows
  return defaultRows
}

function firstColumnTitle(mode: Exclude<IncomeMode, 'channel'>) {
  if (mode === 'store') return '门店'
  if (mode === 'roomType') return '房型'
  if (mode === 'room') return '房间'
  if (mode === 'checkout') return '退房时间'
  return '日期'
}

function paginationText(mode: IncomeMode) {
  if (mode === 'month') return '第 1-8 条/总共 8 条'
  if (mode === 'store') return '第 1-2 条/总共 2 条'
  if (mode === 'channel' || mode === 'roomType' || mode === 'room') return '第 1-5 条/总共 5 条'
  return '第 1-15 条/总共 15 条'
}
