import { useState } from 'react'
import './ReportPage.css'

type DatePreset = '昨天' | '今天' | '上周' | '本周' | '上月' | '本月'
type ReportMode = 'overview' | 'future'

const datePresets: DatePreset[] = ['昨天', '今天', '上周', '本周', '上月', '本月']

const dateRanges: Record<DatePreset, { start: string; end: string }> = {
  昨天: { start: '2026-05-13', end: '2026-05-13' },
  今天: { start: '2026-05-14', end: '2026-05-14' },
  上周: { start: '2026-05-04', end: '2026-05-10' },
  本周: { start: '2026-05-11', end: '2026-05-14' },
  上月: { start: '2026-04-01', end: '2026-04-30' },
  本月: { start: '2026-05-01', end: '2026-05-14' },
}

const revenueCards = [
  { label: '总营业收入', value: '￥1,011' },
  { label: '住宿', value: '￥0' },
  { label: '餐饮', value: '￥0' },
  { label: '商超', value: '￥0' },
  { label: '娱乐', value: '￥0' },
  { label: '场地', value: '￥0' },
]

const operationCards = [
  {
    label: '总营业收入',
    value: '￥1,011',
    details: [
      ['￥1,011', '房费(含佣)'],
      ['￥0', '其他消费'],
      ['￥0', '记一笔收入'],
    ],
  },
  {
    label: '入住率OCC',
    value: '75%',
    details: [
      ['3', '已售房间数'],
      ['4', '总房间数'],
    ],
  },
  {
    label: '平均房费ADR',
    value: '￥337',
    details: [
      ['￥1,011', '全日房费(含佣)'],
      ['￥0', '钟点房费(含佣)'],
    ],
  },
  {
    label: '平均客房收益RevPAR',
    value: '￥252.75',
    details: [
      ['75%', '入住率OCC'],
      ['￥337', '平均房费ADR'],
    ],
  },
  {
    label: '已售房间数',
    value: '3',
    details: [
      ['3', '全日房已售房间数'],
      ['0', '钟点房已售房间数'],
    ],
  },
]

const roomTypeOptions = ['顶层套房（浴缸巨幕电竞麻将）', '总裁套间（桑拿浴缸露台电竞麻将）', '天落大床电竞套间']
const channelOptions = ['携程', '途家', '飞猪淘酒店', '美团民宿', '小猪']
const tagOptions = ['电竞', '浴缸', '露台', '麻将']

const orderSources = [
  { label: '携程', value: '50.00%', color: '#4d65f6' },
  { label: '途家', value: '25.00%', color: '#ff7a2e' },
  { label: '飞猪淘酒店', value: '25.00%', color: '#f0c56b' },
]

export function ReportPage() {
  const [mode, setMode] = useState<ReportMode>('overview')
  const [datePreset, setDatePreset] = useState<DatePreset>('昨天')
  const [openFilter, setOpenFilter] = useState<'roomType' | 'channel' | 'tag' | null>(null)
  const [roomType, setRoomType] = useState('房型')
  const [channel, setChannel] = useState('渠道')
  const [tag, setTag] = useState('房型标签')
  const currentRange = dateRanges[datePreset]

  return (
    <div className="statistics-report-page">
      <section className="statistics-report-panel">
        <div className="statistics-report-mode" role="group" aria-label="统计模式">
          <button
            type="button"
            className={mode === 'overview' ? 'is-active' : ''}
            onClick={() => setMode('overview')}
          >
            统计总览
          </button>
          <button
            type="button"
            className={mode === 'future' ? 'is-active' : ''}
            onClick={() => setMode('future')}
          >
            远期分析
          </button>
        </div>

        <div className="statistics-report-store">
          <button type="button" className="store-scope is-active" aria-pressed="true">
            全部门店
          </button>
          <button type="button" className="store-current">
            天落会宿公寓(前海壹方城宝安中心店)
          </button>
        </div>

        <div className="statistics-report-filters">
          <div className="statistics-report-presets" role="group" aria-label="日期快捷筛选">
            {datePresets.map((preset) => (
              <button
                key={preset}
                type="button"
                className={datePreset === preset ? 'is-active' : ''}
                onClick={() => setDatePreset(preset)}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="report-date-range" role="group" aria-label="统计日期">
            <input aria-label="开始日期" placeholder="开始日期" value={currentRange.start} readOnly />
            <span>至</span>
            <input aria-label="结束日期" placeholder="结束日期" value={currentRange.end} readOnly />
          </div>

          <FilterSelect
            label="房型"
            value={roomType}
            open={openFilter === 'roomType'}
            options={roomTypeOptions}
            listboxLabel="房型筛选"
            onToggle={() => setOpenFilter(openFilter === 'roomType' ? null : 'roomType')}
            onSelect={(value) => {
              setRoomType(value)
              setOpenFilter(null)
            }}
          />
          <FilterSelect
            label="渠道"
            value={channel}
            open={openFilter === 'channel'}
            options={channelOptions}
            listboxLabel="渠道筛选"
            onToggle={() => setOpenFilter(openFilter === 'channel' ? null : 'channel')}
            onSelect={(value) => {
              setChannel(value)
              setOpenFilter(null)
            }}
          />
          <FilterSelect
            label="房型标签"
            value={tag}
            open={openFilter === 'tag'}
            options={tagOptions}
            listboxLabel="房型标签筛选"
            onToggle={() => setOpenFilter(openFilter === 'tag' ? null : 'tag')}
            onSelect={(value) => {
              setTag(value)
              setOpenFilter(null)
            }}
          />
        </div>

        {mode === 'overview' ? <OverviewContent /> : <FutureContent />}
      </section>
    </div>
  )
}

function OverviewContent() {
  return (
    <>
      <section className="statistics-section" aria-label="营收统计">
        <h2>营收统计</h2>
        <div className="statistics-revenue-grid">
          {revenueCards.map((card) => (
            <article key={card.label} className="statistics-metric-card">
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="statistics-section" aria-label="经营指标">
        <h2>经营指标</h2>
        <div className="statistics-operation-grid">
          {operationCards.map((card) => (
            <article key={card.label} className="statistics-operation-card">
              <header>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </header>
              <div className="statistics-operation-details">
                {card.details.map(([value, label]) => (
                  <div key={`${card.label}-${label}`}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="statistics-chart-layout">
        <section className="statistics-chart-card" aria-label="增长趋势分析">
          <header>
            <h2>增长趋势分析</h2>
            <div className="statistics-chart-tabs" role="tablist" aria-label="增长趋势指标">
              {['营业收入', '入住率OCC', '平均房费ADR', 'RevPAR', '已售房间数'].map((tab, index) => (
                <button key={tab} type="button" className={index === 0 ? 'is-active' : ''}>
                  {tab}
                </button>
              ))}
            </div>
          </header>
          <div className="statistics-line-chart" aria-label="营业收入趋势图">
            <div className="statistics-y-axis">
              {[1200, 900, 600, 300, 0].map((value) => (
                <span key={value}>{value}</span>
              ))}
            </div>
            <div className="statistics-plot">
              <div className="plot-grid" />
              <svg viewBox="0 0 520 220" role="img" aria-label="05/13 营业收入 1011">
                <polyline
                  points="18,178 128,178 238,178 348,178 462,34"
                  fill="none"
                  stroke="#4d65f6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <circle cx="462" cy="34" r="5" fill="#4d65f6" />
              </svg>
              <div className="statistics-x-axis">
                <span>05/13</span>
              </div>
            </div>
            <div className="statistics-legend">
              {['营业收入', '房费(含佣)', '其他消费', '记一笔收入'].map((item, index) => (
                <span key={item}>
                  <i className={`legend-dot legend-dot-${index}`} />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="statistics-source-card" aria-label="住宿订单来源分析">
          <h2>住宿订单来源分析</h2>
          <div className="statistics-donut-wrap">
            <div className="statistics-donut" aria-hidden="true" />
            <ul>
              {orderSources.map((source) => (
                <li key={source.label}>
                  <i style={{ background: source.color }} />
                  <span>{source.label}</span>
                  <strong>{source.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </section>
    </>
  )
}

function FutureContent() {
  return (
    <section className="statistics-future" aria-label="远期趋势分析">
      <header>
        <h2>远期趋势分析</h2>
        <span>未来30天</span>
      </header>
      <div className="statistics-future-grid">
        {[
          ['预计营业收入', '￥18,620'],
          ['预计入住率OCC', '68%'],
          ['预计平均房费ADR', '￥412'],
          ['预计RevPAR', '￥280.16'],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="statistics-future-chart" aria-label="未来30天趋势">
        <span>05/15</span>
        <span>05/20</span>
        <span>05/25</span>
        <span>05/30</span>
        <span>06/05</span>
      </div>
    </section>
  )
}

function FilterSelect({
  label,
  value,
  open,
  options,
  listboxLabel,
  onToggle,
  onSelect,
}: {
  label: string
  value: string
  open: boolean
  options: string[]
  listboxLabel: string
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="report-filter-select">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={onToggle}>
        <span>{label}</span>
        <strong>{value}</strong>
      </button>
      {open ? (
        <div className="report-filter-options" role="listbox" aria-label={listboxLabel}>
          {options.map((option) => (
            <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => onSelect(option)}>
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

