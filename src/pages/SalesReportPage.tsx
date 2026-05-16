import { useState } from 'react'
import './SalesReportPage.css'

type SalesTab = 'day' | 'month' | 'store' | 'channel' | 'roomType' | 'room'
type SelectKind = 'store' | 'roomType' | 'channel' | 'roomGroup' | 'room' | null

interface TableModel {
  groups: Array<{ label: string; span: number }>
  columns: string[]
  rows: string[][]
  empty?: boolean
  pageText?: string
}

const tabs: Array<{ key: SalesTab; label: string }> = [
  { key: 'day', label: '按日' },
  { key: 'month', label: '按月' },
  { key: 'store', label: '按门店' },
  { key: 'channel', label: '按渠道' },
  { key: 'roomType', label: '按房型' },
  { key: 'room', label: '按房间' },
]

const storeOptions = ['全部门店', '天落会宿公寓(前海壹方城宝安中心店)']
const roomTypeOptions = ['观影大床房', '天落大床电竞套间', '总裁套间（桑拿浴缸露台电竞麻将）', '顶层套房（浴缸巨幕电竞麻将）']
const channelOptions = ['自来客', '途家', '美团民宿', '小猪', '携程', '美团酒店', '飞猪淘酒店', '路客云聚合', '木鸟']
const roomGroupOptions = ['全部房型分组', '顶层房型', '电竞套间', '观影大床房']
const roomOptions = ['观影大床房(房间1)', '天落大床电竞套间(1)', '总裁套间（桑拿浴缸露台电竞麻将）(房间1)', '顶层套房（浴缸巨幕电竞麻将）(房间1)']

const dailyRows = [
  ['合计', '56', '56', '32', '32', '0', '57.14%', '277.73', '221.94', '158.69', '126.82', '7102.14', '1785.32', '8887.46', '33'],
  ['2026-05-01', '4', '4', '4', '4', '0', '100.00%', '320.28', '241.72', '320.28', '241.72', '966.87', '314.25', '1281.12', '4'],
  ['2026-05-02', '4', '4', '4', '4', '0', '100.00%', '198.92', '170.5', '198.92', '170.5', '682', '113.69', '795.69', '4'],
  ['2026-05-03', '4', '4', '3', '3', '0', '75.00%', '293', '263.93', '219.75', '197.95', '791.8', '87.2', '879', '3'],
  ['2026-05-04', '4', '4', '3', '3', '0', '75.00%', '394.82', '298.43', '296.12', '223.82', '895.3', '289.16', '1184.46', '3'],
  ['2026-05-05', '4', '4', '3', '3', '0', '75.00%', '267', '207.74', '200.25', '155.81', '623.21', '177.79', '801', '3'],
  ['2026-05-06', '4', '4', '1', '1', '0', '25.00%', '171.69', '160.28', '42.92', '40.07', '160.28', '11.41', '171.69', '1'],
  ['2026-05-07', '4', '4', '1', '1', '0', '25.00%', '211', '163.94', '52.75', '40.99', '163.94', '47.06', '211', '1'],
  ['2026-05-08', '4', '4', '1', '1', '0', '25.00%', '231', '182.81', '57.75', '45.7', '182.81', '48.19', '231', '1'],
  ['2026-05-09', '4', '4', '1', '1', '0', '25.00%', '231', '182.81', '57.75', '45.7', '182.81', '48.19', '231', '1'],
  ['2026-05-10', '4', '4', '2', '2', '0', '50.00%', '198', '151.3', '99', '75.65', '302.59', '93.41', '396', '2'],
  ['2026-05-11', '4', '4', '1', '1', '0', '25.00%', '422', '327.88', '105.5', '81.97', '327.88', '94.12', '422', '2'],
  ['2026-05-12', '4', '4', '3', '3', '0', '75.00%', '208.69', '165.9', '156.52', '124.43', '497.7', '128.37', '626.07', '3'],
  ['2026-05-13', '4', '4', '3', '3', '0', '75.00%', '337', '273.04', '252.75', '204.78', '819.13', '191.87', '1011', '3'],
  ['2026-05-14', '4', '4', '2', '2', '0', '50.00%', '323.22', '252.91', '161.61', '126.46', '505.82', '140.61', '646.43', '2'],
]

const storeRows = [
  ['合计', '56', '56', '32', '32', '0', '57.14%', '277.73', '221.94', '158.69', '126.82', '7102.14', '1785.32', '8887.46', '30'],
  ['天落会宿公寓(前海壹方城宝安中心店)', '56', '56', '32', '32', '0', '57.14%', '277.73', '221.94', '158.69', '126.82', '7102.14', '1785.32', '8887.46', '30'],
]

const channelRows = [
  ['合计', '32', '-', '32', '-', '0', '-', '30', '-'],
  ['自来客', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['途家', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['美团民宿', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['小猪', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['携程', '16', '50.00%', '16', '50.00%', '0', '0%', '17', '56.67%'],
  ['美团酒店', '4', '12.50%', '4', '12.50%', '0', '0%', '4', '13.33%'],
  ['飞猪淘酒店', '11', '34.38%', '11', '34.38%', '0', '0%', '8', '26.67%'],
  ['路客云聚合', '1', '3.13%', '1', '3.13%', '0', '0%', '1', '3.33%'],
  ['木鸟', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['品牌小程序', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['途家直连', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['同程酒店直连', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['飞猪酒店直连', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['同程民宿直连', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['去哪儿酒店直连', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
  ['抖音来客直连', '0', '0.00%', '0', '0.00%', '0', '0%', '0', '0.00%'],
]

const roomTypeRows = [
  ['合计', '56', '56', '32', '32', '0', '57.14%', '277.73', '221.94', '158.69', '126.82', '7102.14', '1785.32', '8887.46', '30'],
  ['观影大床房', '14', '14', '14', '14', '0', '100.00%', '238.2', '193.39', '238.2', '193.39', '2707.45', '627.36', '3334.81', '15'],
  ['天落大床电竞套间', '14', '14', '5', '5', '0', '35.71%', '253.95', '201.73', '90.69', '72.04', '1008.65', '261.08', '1269.73', '5'],
  ['总裁套间（桑拿浴缸露台电竞麻将）', '14', '14', '8', '8', '0', '57.14%', '329.5', '275.4', '188.28', '157.36', '2203.22', '432.78', '2636', '5'],
  ['顶层套房（浴缸巨幕电竞麻将）', '14', '14', '5', '5', '0', '35.71%', '329.38', '236.56', '117.62', '84.48', '1182.82', '464.1', '1646.92', '5'],
]

const roomRows = [
  ['合计', '56', '56', '32', '32', '0', '57.14%', '271.14', '216.82', '154.93', '123.89', '6938.2', '1738.26', '8676.46', '29'],
  ['观影大床房(房间1)', '14', '14', '14', '14', '0', '100.00%', '223.13', '181.68', '223.13', '181.68', '2543.51', '580.3', '3123.81', '14'],
  ['天落大床电竞套间(1)', '14', '14', '5', '5', '0', '35.71%', '253.95', '201.73', '90.69', '72.04', '1008.65', '261.08', '1269.73', '5'],
  ['总裁套间（桑拿浴缸露台电竞麻将）(房间1)', '14', '14', '8', '8', '0', '57.14%', '329.5', '275.4', '188.28', '157.36', '2203.22', '432.78', '2636', '5'],
  ['顶层套房（浴缸巨幕电竞麻将）(房间1)', '14', '14', '5', '5', '0', '35.71%', '329.38', '236.56', '117.62', '84.48', '1182.82', '464.1', '1646.92', '5'],
]

const dayColumns = [
  '日期',
  '总房间数',
  '可售房间数',
  '已售房间数',
  '全日房已售房间数',
  '钟点房已售房间数',
  '入住率OCC',
  'ADR',
  'ADR(减佣)',
  'RevPar',
  'RevPar(减佣)',
  '房费(减佣)',
  '佣金',
  '房费(含佣)',
  '住宿订单总数',
]

const aggregateColumns = [
  '门店',
  '总房间数',
  '可售房间数',
  '已售房间数',
  '全日房已售房间数',
  '钟点房已售房间数',
  '入住率',
  'ADR',
  'ADR(减佣)',
  'RevPar',
  'RevPar(减佣)',
  '房费(减佣)',
  '佣金',
  '房费(含佣)',
  '住宿订单总数',
]

const standardGroups = [
  { label: '', span: 1 },
  { label: '入住间夜', span: 5 },
  { label: '', span: 1 },
  { label: '平均房费ADR', span: 2 },
  { label: '平均客房收益RevPAR', span: 2 },
  { label: '房费收入', span: 3 },
  { label: '住宿订单渠道来源', span: 1 },
]

function getTableModel(activeTab: SalesTab): TableModel {
  if (activeTab === 'month') {
    return {
      groups: standardGroups,
      columns: ['月份', '总房间数', '可售房间数', '已可售数', '全日房已售房间数', '钟点房已售房间数', '入住率', 'ADR', 'ADR(减佣)', 'RevPar', 'RevPar(减佣)', '房费(减佣)', '佣金', '房费(含佣)', '住宿订单总数'],
      rows: [],
      empty: true,
    }
  }

  if (activeTab === 'store') {
    return {
      groups: standardGroups,
      columns: aggregateColumns,
      rows: storeRows,
      pageText: '第 1-2 条/总共 2 条',
    }
  }

  if (activeTab === 'channel') {
    return {
      groups: [
        { label: '', span: 1 },
        { label: '已售房间数', span: 6 },
        { label: '住宿订单', span: 2 },
      ],
      columns: ['渠道', '已售房间数', '占比', '全日房已售房间数', '占比', '钟点房已售房间数', '占比', '订单数', '占比'],
      rows: channelRows,
      pageText: '第 1-17 条/总共 17 条',
    }
  }

  if (activeTab === 'roomType') {
    return {
      groups: [
        { label: '', span: 1 },
        { label: '入住间夜', span: 5 },
        { label: '', span: 1 },
        { label: 'ADR', span: 2 },
        { label: 'RevPar', span: 2 },
        { label: '房费收入', span: 3 },
        { label: '住宿订单渠道来源', span: 1 },
      ],
      columns: ['房型', '总房间数', '可售房间数', '开房数', '过夜开房数', '钟点开房数', '入住率', 'ADR', 'ADR(减佣)', 'RevPar', 'RevPar(减佣)', '房费(减佣)', '佣金', '房费(含佣)', '住宿订单总数'],
      rows: roomTypeRows,
      pageText: '第 1-5 条/总共 5 条',
    }
  }

  if (activeTab === 'room') {
    return {
      groups: standardGroups,
      columns: ['房间', ...aggregateColumns.slice(1)],
      rows: roomRows,
      pageText: '第 1-5 条/总共 5 条',
    }
  }

  return {
    groups: standardGroups,
    columns: dayColumns,
    rows: dailyRows,
    pageText: '第 1-15 条/总共 15 条',
  }
}

export function SalesReportPage() {
  const [activeTab, setActiveTab] = useState<SalesTab>('day')
  const [expanded, setExpanded] = useState(true)
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [roomType, setRoomType] = useState('')
  const [channel, setChannel] = useState('')
  const [roomGroup, setRoomGroup] = useState('')
  const [room, setRoom] = useState('')
  const [notice, setNotice] = useState('')
  const tableModel = getTableModel(activeTab)

  function resetFilters() {
    setRoomType('')
    setChannel('')
    setRoomGroup('')
    setRoom('')
    setOpenSelect(null)
    setDatePickerOpen(false)
    setExpanded(true)
    setNotice('')
  }

  function changeTab(tab: SalesTab) {
    setActiveTab(tab)
    setOpenSelect(null)
    setDatePickerOpen(false)
    setDescriptionOpen(false)
    setNotice('')
  }

  return (
    <div className="sales-report-page" onKeyDown={(event) => event.key === 'Escape' && setDatePickerOpen(false)}>
      <h1 className="sr-only-heading">销况报表</h1>

      <section className="sales-report-panel" aria-label="销况报表筛选">
        <div className="sales-report-tabs" role="tablist" aria-label="销况报表维度">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={activeTab === tab.key ? 'is-active' : ''}
              onClick={() => changeTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="sales-report-store-row">
          <div className="sales-report-store-wrap">
            <button
              type="button"
              className="is-active"
              aria-haspopup="listbox"
              aria-expanded={openSelect === 'store'}
              onClick={() => setOpenSelect(openSelect === 'store' ? null : 'store')}
            >
              全部门店
            </button>
            {openSelect === 'store' ? (
              <div className="sales-report-options sales-report-options--store" role="listbox" aria-label="门店选项">
                {storeOptions.map((option) => (
                  <button key={option} type="button" role="option" aria-selected={option === storeOptions[0]} onClick={() => setOpenSelect(null)}>
                    {option}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" className="sales-store-name">
            天落会宿公寓(前海壹方城宝安中心店)
          </button>
          <button type="button" aria-label="门店设置" className="sales-store-config">
            ⚙
          </button>
        </div>

        {expanded ? (
          <div className="sales-report-filter-row">
            <DateRangeFields activeTab={activeTab} datePickerOpen={datePickerOpen} onOpenPicker={() => setDatePickerOpen(true)} />
            {activeTab !== 'store' ? (
              <SelectField
                label="房型"
                value={roomType}
                kind="roomType"
                openSelect={openSelect}
                options={roomTypeOptions}
                onToggle={() => setOpenSelect(openSelect === 'roomType' ? null : 'roomType')}
                onSelect={(value) => {
                  setRoomType(value)
                  setOpenSelect(null)
                }}
              />
            ) : null}
            {activeTab === 'room' ? (
              <SelectField
                label="房间"
                value={room}
                kind="room"
                openSelect={openSelect}
                options={roomOptions}
                onToggle={() => setOpenSelect(openSelect === 'room' ? null : 'room')}
                onSelect={(value) => {
                  setRoom(value)
                  setOpenSelect(null)
                }}
              />
            ) : null}
            <SelectField
              label="渠道"
              value={channel}
              kind="channel"
              openSelect={openSelect}
              options={channelOptions}
              onToggle={() => setOpenSelect(openSelect === 'channel' ? null : 'channel')}
              onSelect={(value) => {
                setChannel(value)
                setOpenSelect(null)
              }}
            />
            {activeTab !== 'store' ? (
              <SelectField
                label="房型分组"
                value={roomGroup}
                kind="roomGroup"
                openSelect={openSelect}
                options={roomGroupOptions}
                onToggle={() => setOpenSelect(openSelect === 'roomGroup' ? null : 'roomGroup')}
                onSelect={(value) => {
                  setRoomGroup(value)
                  setOpenSelect(null)
                }}
              />
            ) : null}
          </div>
        ) : null}

        <div className="sales-report-actions">
          <button
            type="button"
            className="is-link"
            onClick={() => {
              setOpenSelect(null)
              setDatePickerOpen(false)
              setExpanded((value) => !value)
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
          <button type="button" className="is-outline" onClick={resetFilters}>
            重 置
          </button>
          <button
            type="button"
            className="is-primary"
            onClick={() => {
              setOpenSelect(null)
              setDatePickerOpen(false)
              setNotice('已按当前条件查询销况报表')
            }}
          >
            查 询
          </button>
          <button type="button" className="is-outline" onClick={() => setNotice('已生成销况报表导出任务')}>
            导 出
          </button>
          {activeTab !== 'channel' ? (
            <button type="button" className="is-outline" onClick={() => setDescriptionOpen(true)}>
              说 明
            </button>
          ) : null}
        </div>
      </section>

      {notice ? (
        <div className="sales-report-notice" role="status">
          {notice}
        </div>
      ) : null}

      <SalesReportTable model={tableModel} />
      {tableModel.pageText ? <SalesPagination text={tableModel.pageText} /> : null}

      {descriptionOpen ? (
        <div className="sales-modal-backdrop" role="presentation">
          <section className="sales-description-modal" role="dialog" aria-modal="true" aria-label="报表字段说明">
            <header>
              <strong>报表字段说明</strong>
              <button type="button" aria-label="关闭报表字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="sales-description-grid">
              <span>ADR(减佣)</span>
              <span>房费(减佣) / 已售房间数</span>
              <span>RevPar</span>
              <span>房费(含佣) / 可售房间数</span>
              <span>房费(减佣)</span>
              <span>房费(含佣) - 佣金</span>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function DateRangeFields({
  activeTab,
  datePickerOpen,
  onOpenPicker,
}: {
  activeTab: SalesTab
  datePickerOpen: boolean
  onOpenPicker: () => void
}) {
  const monthMode = activeTab === 'month'

  return (
    <fieldset className="sales-date-range" aria-label={monthMode ? '月份' : '日期'}>
      <legend>日期:</legend>
      <div className="sales-date-inputs">
        <input
          aria-label={monthMode ? '开始月份' : '开始日期'}
          placeholder={monthMode ? '请选择' : '开始日期'}
          readOnly
          value={monthMode ? '2025-11' : '2026-05-01'}
          onClick={monthMode ? undefined : onOpenPicker}
        />
        <span>至</span>
        <input
          aria-label={monthMode ? '结束月份' : '结束日期'}
          placeholder={monthMode ? '请选择' : '结束日期'}
          readOnly
          value={monthMode ? '2026-05' : '2026-05-14'}
          onClick={monthMode ? undefined : onOpenPicker}
        />
        {!monthMode ? (
          <button type="button" aria-label="打开日期范围选择" onClick={onOpenPicker}>
            ◴
          </button>
        ) : null}
      </div>
      {datePickerOpen && !monthMode ? <DatePickerPanel /> : null}
    </fieldset>
  )
}

function DatePickerPanel() {
  return (
    <div className="sales-date-picker" role="dialog" aria-label="日期范围选择">
      <div className="sales-date-shortcuts">
        {['昨天', '本周', '本月', '上月'].map((item) => (
          <button key={item} type="button">
            {item}
          </button>
        ))}
      </div>
      <CalendarMonth title="2026年5月" offsetStart={4} activeDays={['1', '14']} />
      <CalendarMonth title="2026年6月" offsetStart={0} activeDays={[]} />
    </div>
  )
}

function CalendarMonth({ title, offsetStart, activeDays }: { title: string; offsetStart: number; activeDays: string[] }) {
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = index - offsetStart + 1
    if (title === '2026年5月') {
      if (day < 1) return String(27 + index)
      if (day > 31) return String(day - 31)
      return String(day)
    }
    if (day < 1) return ''
    if (day > 30) return String(day - 30)
    return String(day)
  })

  return (
    <section className="sales-calendar-month" aria-label={title}>
      <header>
        <strong>{title}</strong>
      </header>
      <div className="sales-calendar-weekdays">
        {['一', '二', '三', '四', '五', '六', '日'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="sales-calendar-days">
        {days.map((day, index) => (
          <span key={`${title}-${index}`} className={activeDays.includes(day) ? 'is-active' : day === '' ? 'is-muted' : ''}>
            {day}
          </span>
        ))}
      </div>
    </section>
  )
}

function SelectField({
  label,
  value,
  kind,
  openSelect,
  options,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  kind: Exclude<SelectKind, null>
  openSelect: SelectKind
  options: string[]
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="sales-select-field">
      <span>{label}:</span>
      <div className="sales-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={openSelect === kind} aria-label={`${label} ${value || '请选择'}`} onClick={onToggle}>
          {value || '请选择'}
        </button>
        {openSelect === kind ? (
          <div className="sales-report-options" role="listbox" aria-label={`${label}选项`}>
            {options.map((option) => (
              <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => onSelect(option)}>
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SalesReportTable({ model }: { model: TableModel }) {
  return (
    <section className="sales-report-table-wrap" aria-label="销况报表表格">
      <table className="sales-report-table">
        <thead>
          <tr>
            {model.groups.map((group, index) => (
              <th key={`${group.label}-${index}`} colSpan={group.span}>
                {group.label}
              </th>
            ))}
          </tr>
          <tr>
            {model.columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.empty ? (
            <tr className="sales-empty-row">
              <td colSpan={model.columns.length}>
                <div className="sales-empty-state">
                  <span aria-hidden="true" />
                  暂无数据
                </div>
              </td>
            </tr>
          ) : (
            model.rows.map((row) => (
              <tr key={row.join('-')} className={row[0] === '合计' ? 'is-summary' : ''}>
                {row.map((cell, index) => (
                  <td key={`${row[0]}-${index}`}>{cell}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  )
}

function SalesPagination({ text }: { text: string }) {
  return (
    <nav className="sales-report-pagination" aria-label="分页">
      <span>{text}</span>
      <button type="button" aria-label="上一页" disabled>
        ‹
      </button>
      <button type="button" className="is-current">
        1
      </button>
      <button type="button" aria-label="下一页" disabled>
        ›
      </button>
      <button type="button">20 条/页</button>
    </nav>
  )
}
