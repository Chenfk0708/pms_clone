import { useState } from 'react'

type RoomSituationMode = 'day' | 'future'

interface RoomSituationRow {
  name: string
  total: number
  sold: number
  available: number
  closed: number
  disabled: number
  reserved: number
  repair: number
  linkedClosed: number
  usable: number
  arriving: number
  occupied: number
  leaving: number
  clean: number
  dirty: number
}

interface FutureRow {
  name: string
  total: number
  days: Array<{
    available: number
    occupied: number
  }>
}

const dayRows: RoomSituationRow[] = [
  { name: '合计', total: 4, sold: 0, available: 4, closed: 0, disabled: 0, reserved: 0, repair: 0, linkedClosed: 0, usable: 4, arriving: 0, occupied: 0, leaving: 0, clean: 3, dirty: 1 },
  { name: '顶层套房（浴缸巨幕电竞麻将）', total: 1, sold: 0, available: 1, closed: 0, disabled: 0, reserved: 0, repair: 0, linkedClosed: 0, usable: 1, arriving: 0, occupied: 0, leaving: 0, clean: 1, dirty: 0 },
  { name: '总裁套间（桑拿浴缸露台电竞麻将）', total: 1, sold: 0, available: 1, closed: 0, disabled: 0, reserved: 0, repair: 0, linkedClosed: 0, usable: 1, arriving: 0, occupied: 0, leaving: 0, clean: 1, dirty: 0 },
  { name: '天落大床电竞套间', total: 1, sold: 0, available: 1, closed: 0, disabled: 0, reserved: 0, repair: 0, linkedClosed: 0, usable: 1, arriving: 0, occupied: 0, leaving: 0, clean: 1, dirty: 0 },
  { name: '观影大床房', total: 1, sold: 0, available: 1, closed: 0, disabled: 0, reserved: 0, repair: 0, linkedClosed: 0, usable: 1, arriving: 0, occupied: 0, leaving: 0, clean: 0, dirty: 1 },
]

const columns: Array<{ key: keyof RoomSituationRow; label: string }> = [
  { key: 'total', label: '总房间数' },
  { key: 'sold', label: '已售房间数' },
  { key: 'available', label: '剩余可售数' },
  { key: 'closed', label: '总关房数' },
  { key: 'disabled', label: '停用房' },
  { key: 'reserved', label: '保留房' },
  { key: 'repair', label: '维修房' },
  { key: 'linkedClosed', label: '联动关房' },
  { key: 'usable', label: '总可用房数' },
  { key: 'arriving', label: '预抵' },
  { key: 'occupied', label: '在住' },
  { key: 'leaving', label: '预离' },
  { key: 'clean', label: '净房' },
  { key: 'dirty', label: '脏房' },
]

const DAY_MS = 24 * 60 * 60 * 1000
const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function buildFutureDates(length = 30) {
  const today = new Date()
  const localMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return Array.from({ length }, (_, index) => {
    const date = new Date(localMidnight.getTime() + index * DAY_MS)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${weekdays[date.getDay()]}`
  })
}

const futureDates = buildFutureDates()

function buildFutureDays(defaultAvailable: number, defaultOccupied: number, overrides: Record<number, [number, number]> = {}) {
  return futureDates.map((_, index) => {
    const [available, occupied] = overrides[index] ?? [defaultAvailable, defaultOccupied]
    return { available, occupied }
  })
}

const futureRows: FutureRow[] = [
  {
    name: '合计',
    total: 4,
    days: buildFutureDays(4, 0, {
      1: [3, 1],
      3: [3, 1],
      4: [3, 1],
    }),
  },
  {
    name: '顶层套房（浴缸巨幕电竞麻将）',
    total: 1,
    days: buildFutureDays(1, 0),
  },
  {
    name: '总裁套间（桑拿浴缸露台电竞麻将）',
    total: 1,
    days: buildFutureDays(1, 0, {
      3: [0, 1],
      4: [0, 1],
    }),
  },
  {
    name: '天落大床电竞套间',
    total: 1,
    days: buildFutureDays(1, 0, {
      1: [0, 1],
    }),
  },
  {
    name: '观影大床房',
    total: 1,
    days: buildFutureDays(1, 0),
  },
]

const storeName = '天落会宿公寓(前海壹方城宝安中心店)'

const metricDescriptions = [
  '总房间数：企业的房间总数；',
  '已售房间数：今日已销售的房间总数，已售房间数=在住-预离+预抵；',
  '剩余可售数：今日可销售的房间数量（不包含已售），剩余可售数=总房间数-总关房数-已售房间数；',
  '总关房数：今日关房不可销售的房间数量，总关房数=停用房+维修房+保留房+联动关房；',
  '停用房：关房类型为停用房；',
  '保留房：关房类型为保留房；',
  '维修房：关房类型为维修房；',
  '联动关房：与其他房型绑定了联动关系，因库存同步策略联动关房；',
  '总可用房数：当前可安排客人入住的房间数量，总可用房数=总房间数-总关房数-在住',
  '预抵：今日入住状态为待入住的订单总数（不包含今日已办理入住的订单）；',
  '在住：今日入住状态为入住中的订单总数（包含预离）；',
  '预离：预计今日退房的订单总数；',
  '净房：已完成清洁、可直接安排入住的房间数量；',
  '脏房：待清洁或清洁中的房间数量；',
]

export function RoomSituationPage() {
  const [mode, setMode] = useState<RoomSituationMode>('day')
  const [pageSizeOpen, setPageSizeOpen] = useState(false)
  const [pageSize, setPageSize] = useState(20)
  const [showMetricHelp, setShowMetricHelp] = useState(false)
  const [tooltip, setTooltip] = useState<string | null>(null)

  function showTooltip(text: string) {
    setTooltip(text)
  }

  return (
    <div className="page-stack room-situation-page">
      <section className="room-situation-toolbar" aria-label="房情表筛选">
        <div className="room-situation-tabs">
          <button type="button" className={mode === 'day' ? 'is-active' : ''} onClick={() => setMode('day')}>
            单日房情表
          </button>
          <button type="button" className={mode === 'future' ? 'is-active' : ''} onClick={() => setMode('future')}>
            远期房情表
          </button>
        </div>

        <div className="room-situation-filters">
          <div className="room-store-select">
            <button type="button" className="room-store-scope" onClick={() => showTooltip('全部门店')}>
              全部门店
            </button>
            <button type="button" className="room-store-current" onClick={() => showTooltip(storeName)}>
              {storeName}
            </button>
            {tooltip ? (
              <div className="room-store-tooltip" role="tooltip">
                {tooltip}
              </div>
            ) : null}
          </div>
          <button type="button" className="room-icon-button" aria-label="设置" onClick={() => showTooltip('设置')}>
            ⚙
          </button>
          <button type="button" className="room-metric-help" onClick={() => setShowMetricHelp(true)}>
            指标说明
          </button>
        </div>
      </section>

      <section className="room-situation-board">
        {mode === 'future' ? <FutureSituationTable /> : <DaySituationTable />}
        <footer className="room-situation-pagination">
          <span>第 1-5 条/总共 5 条</span>
          <button type="button" className="is-active">
            1
          </button>
          <div className="room-page-size-wrap">
            <button type="button" className="room-page-size" onClick={() => setPageSizeOpen((value) => !value)}>
              {pageSize} 条/页
            </button>
            {pageSizeOpen ? (
              <div className="room-page-size-options" role="listbox" aria-label="每页条数">
                {[10, 20, 50, 100].map((size) => (
                  <button
                    key={size}
                    type="button"
                    role="option"
                    aria-selected={pageSize === size}
                    onClick={() => {
                      setPageSize(size)
                      setPageSizeOpen(false)
                    }}
                  >
                    {size} 条/页
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </footer>
      </section>

      {showMetricHelp ? (
        <div className="room-metric-drawer-backdrop" onClick={() => setShowMetricHelp(false)}>
          <section
            className="room-metric-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="指标说明"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h2>指标说明</h2>
              <button type="button" aria-label="关闭指标说明" onClick={() => setShowMetricHelp(false)}>
                ×
              </button>
            </header>
            <div className="room-metric-drawer__body">
              {metricDescriptions.map((description) => (
                <p key={description}>{description}</p>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function DaySituationTable() {
  return (
    <div className="room-situation-table-scroll" data-testid="room-situation-table-scroll">
      <table className="room-situation-table">
        <thead>
          <tr>
            <th className="room-type-column">房型名称</th>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dayRows.map((row) => (
            <tr key={row.name}>
              <th className="room-type-column">{row.name}</th>
              {columns.map((column) => (
                <td key={column.key}> {row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FutureSituationTable() {
  return (
    <>
      <div className="room-situation-caption">
        <span>可售=当天剩余可售，占用=订单占用+关房占用</span>
      </div>
      <div className="room-situation-table-scroll" data-testid="room-situation-table-scroll">
        <table className="room-situation-table room-situation-table--future">
          <thead>
            <tr>
              <th className="room-type-column" rowSpan={2}>
                房型
              </th>
              <th rowSpan={2}>总房间数</th>
              {futureDates.map((date) => (
                <th key={date} colSpan={2}>
                  {date}
                </th>
              ))}
            </tr>
            <tr>
              {futureDates.flatMap((date) => [
                <th key={`${date}-available`}>剩余可售</th>,
                <th key={`${date}-occupied`}>占用</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {futureRows.map((row) => (
              <tr key={row.name}>
                <th className="room-type-column">{row.name}</th>
                <td> {row.total}</td>
                {row.days.flatMap((day, index) => [
                  <td key={`${row.name}-${futureDates[index]}-available`}> {day.available}</td>,
                  <td key={`${row.name}-${futureDates[index]}-occupied`}> {day.occupied}</td>,
                ])}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
