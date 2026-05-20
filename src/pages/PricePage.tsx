import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { priceDates, priceRows } from '../data/mock'
import { fetchChannelPriceRows, type ChannelPriceProviderName, type ChannelPriceRow } from '../services/channelPrice'
import {
  type CentralPriceData,
  type CentralPriceFilters,
  type CentralPriceRoom,
  fetchCentralPrices,
  getCentralPriceRequestDate,
} from '../services/centralPrice'
import { loadOtherPriceData, type OtherPriceData } from '../services/otherPrice'
import { loadPriceBoardData, type PriceBoardData, type PriceBoardDurationOption } from '../services/priceBoard'
import {
  loadPriceComparisonDashboard,
  normalizePriceComparisonMockState,
  type PriceComparisonDashboard,
  type PriceComparisonFilters,
} from '../services/priceComparison'
import { loadRetailPriceData, type RetailPriceData, type RetailRoomCategory, type RetailStore } from '../services/retailPrice'
import './PricePage.css'

const priceTabs = [
  { label: '中央价', path: '/houseManage/houseCale' },
  { label: '渠道RP价', path: '/houseManage/channelPrice' },
  { label: '竞争圈比价', path: '/houseManage/priceComparison' },
  { label: '门市价', path: '/houseManage/retailPrice' },
  { label: '其他价格', path: '/houseManage/otherPrice' },
  { label: '电子房价牌', path: '/houseManage/priceBoard' },
]

const primaryPriceTabs = priceTabs.slice(0, 3)

const priceBoardAssets = {
  logo: '/price-board-assets/brand-price-board-logo.png',
  overview: [
    '/price-board-assets/brand-promotion-price-card.png',
    '/price-board-assets/brand-promotion-price-card-2.png',
    '/price-board-assets/brand-promotion-price-card-3.png',
  ],
  detail: '/price-board-assets/brand-promotion-price-card-4.png',
  payQr: '/price-board-assets/price-board-buy.png',
}

const roomTypes = [
  { name: '顶层套房（浴缸巨幕电竞麻将）', base: 730, stock: '余 2 间' },
  { name: '总裁套间（桑拿浴缸露台电竞麻将）', base: 930, stock: '余 1 间' },
  { name: '天落大床电竞套间', base: 398, stock: '余 1 间' },
  { name: '观影大床房', base: 198, stock: '余 3 间' },
]

type PriceMatrixRow = {
  channel: string
  coefficient: string
  basePrice: string
  prices: string[]
  comparePrices: string[]
  product?: string
}

type ChannelPriceRequestState =
  | { kind: 'loading'; message: string; rows: ChannelPriceRow[] }
  | { kind: 'success'; message: string; rows: ChannelPriceRow[] }
  | { kind: 'empty'; message: string; rows: ChannelPriceRow[] }
  | { kind: 'error'; message: string; rows: ChannelPriceRow[] }

type CentralPriceRequestState =
  | { kind: 'idle'; message: string }
  | { kind: 'loading'; message: string }
  | { kind: 'success'; message: string }
  | { kind: 'empty'; message: string }
  | { kind: 'error'; message: string }

type PriceComparisonRequestState =
  | { kind: 'loading'; message: string }
  | { kind: 'success'; data: PriceComparisonDashboard }
  | { kind: 'empty'; data: PriceComparisonDashboard }
  | { kind: 'error'; message: string }

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const channelOptions = ['全部渠道', '携程', '美团', '同程', '途家']
const retailWeekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const channelRpRows = [
  {
    channel: '顶层套房（浴缸巨幕电竞麻将）',
    coefficient: '0.93',
    basePrice: '869',
    prices: ['848.16', '848.16', '848.16', '848.16', '1,080.66', '1,080.66', '848.16', '848.16'],
    comparePrices: ['869', '869', '869', '869', '1,089', '1,089', '869', '869'],
    product: '顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）<无早>',
  },
  {
    channel: '总裁套间（桑拿浴缸露台电竞麻将）',
    coefficient: '0.93',
    basePrice: '1,089',
    prices: ['1,080.66', '1,080.66', '1,080.66', '1,080.66', '1,280.66', '1,280.66', '1,080.66', '1,080.66'],
    comparePrices: ['1,089', '1,089', '1,089', '1,089', '1,289', '1,289', '1,089', '1,089'],
    product: '总裁套间（桑拿浴缸露台电竞麻将）<无早>',
  },
  {
    channel: '观影大床房',
    coefficient: '0.93',
    basePrice: '198',
    prices: ['198', '198', '198', '198', '238', '238', '198', '198'],
    comparePrices: ['60', '60', '60', '60', '60', '60', '60', '60'],
    product: '观影大床房<无早>',
  },
]

const channelSettingRows: Array<[string, string]> = [
  ['美团酒店', '100'],
  ['携程酒店', '100'],
  ['飞猪酒店', '100'],
  ['美团民宿', '100'],
  ['途家(EHPq0597)', '95'],
  ['木鸟民宿', '90'],
]

const channelPlanRows: Array<[string, string, string, string, string]> = [
  ['顶层套房（浴缸巨幕电竞麻将）', '顶层套间（独享浴缸麻将巨屏观影电动吊床+欧式大床）<无早>', '848.16', '1,080.66', '设置'],
  ['', '顶层套房-独享麻将电竞浴缸-天落大床-欧式大床-不含早', '869', '1,089', '设置'],
  ['总裁套间（桑拿浴缸露台电竞麻将）', '总裁套间（桑拿浴缸露台电竞麻将）<无早>', '811.89', '995.1', '设置'],
]

const centralPriceSettings: Array<{ channel: string; percent: string }> = [
  { channel: '美团酒店', percent: '100' },
  { channel: '携程酒店', percent: '100' },
  { channel: '飞猪酒店', percent: '100' },
  { channel: '美团民宿', percent: '100' },
  { channel: '途家民宿', percent: '95' },
  { channel: '木鸟民宿', percent: '90' },
]


function makePriceDates(offset: number, startDay = 12) {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(2026, 4, startDay + offset + index)
    const dateLabel = `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
    return {
      label: index === 0 && offset === 0 ? '今日' : dateLabel,
      dateLabel,
      isToday: index === 0 && offset === 0,
      weekday: weekdays[date.getDay()],
      key: date.toISOString().slice(0, 10),
    }
  })
}

const calendarWeekLabels = ['一', '二', '三', '四', '五', '六', '日']

function parseDateValue(value: string) {
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(2026, 4, 20)
  }
  return new Date(year, month - 1, day)
}

function formatHeaderDateValue(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

function buildCalendarCells(anchor: Date) {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const monthStart = new Date(year, month, 1)
  const leadingDays = (monthStart.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - leadingDays)

  return Array.from({ length: 42 }, (_, index) => {
    const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    return {
      key: `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2, '0')}-${String(cellDate.getDate()).padStart(2, '0')}`,
      day: cellDate.getDate(),
      isMuted: cellDate.getMonth() !== month,
    }
  })
}

function PriceTabs({ active }: { active: string }) {
  const navigate = useNavigate()
  const displayTabs = primaryPriceTabs.some((tab) => tab.label === active) ? primaryPriceTabs : priceTabs

  return (
    <div className="segmented wrap price-tabs" aria-label="房价管理类型">
      {displayTabs.map((tab) => (
        <button
          key={tab.path}
          type="button"
          aria-label={tab.label === '渠道RP价' ? 'RP价页签' : undefined}
          className={tab.label === active ? 'is-active' : ''}
          onClick={() => navigate(tab.path)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function ChannelDrawer({
  title,
  label,
  onClose,
  children,
}: {
  title: string
  label?: string
  onClose: () => void
  children: ReactNode
}) {
  const dialogLabel = label ?? title

  return (
    <div className="channel-drawer-shell" role="presentation">
      <section className="channel-drawer" role="dialog" aria-modal="true" aria-label={dialogLabel}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={`关闭${dialogLabel}`} onClick={onClose}>
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function ChannelPriceSettings({ onClose }: { onClose: () => void }) {
  return (
    <ChannelDrawer title="价格设置" onClose={onClose}>
      <div className="channel-drawer-tabs">
        <button type="button" className="is-active">
          价格设置
        </button>
        <button type="button">更新价格设置</button>
      </div>
      <section className="channel-drawer-section">
        <h3>页面价格设置</h3>
        <div className="channel-current-mode">
          <span>当前正使用：</span>
          <strong>“实际卖价”</strong>
          <span>调价</span>
          <button type="button">切换为划线价</button>
        </div>
      </section>
      <section className="channel-drawer-section channel-setting-grid">
        <h3>划线价与实际卖价关系设置</h3>
        {channelSettingRows.map(([name, value]) => (
          <article key={name}>
            <strong>{name}</strong>
            <label>
              划线价 = 实际卖价 /
              <span>
                <input aria-label={`${name} 优惠比例`} defaultValue={value} />
                <em>%</em>
              </span>
            </label>
          </article>
        ))}
      </section>
      <footer className="channel-drawer-footer">
        <button type="button" onClick={onClose}>
          保存
        </button>
        <button type="button" onClick={onClose}>
          取消
        </button>
      </footer>
    </ChannelDrawer>
  )
}

export function ChannelPricePlan({ onClose }: { onClose: () => void }) {
  return (
    <ChannelDrawer title="价格规划" onClose={onClose}>
      <div className="channel-drawer-filterbar">
        <button type="button" className="chip is-active">
          全部门店
        </button>
        <button type="button" className="chip">
          天落会宿公寓(前海壹方城宝安中心店)
        </button>
        <button type="button" className="chip">
          渠道
        </button>
        <button type="button" className="chip">
          房型
        </button>
        <button type="button" className="chip">
          房型标签
        </button>
        <input type="text" placeholder="房源编码/简称/标题" />
        <button type="button" className="price-plan-add">
          +新增规划
        </button>
      </div>
      <div className="channel-plan-table" aria-label="价格规划表格">
        <div className="channel-plan-table__head">
          <div>房型</div>
          <div>平日价</div>
          <div>周末价(五/六)</div>
          <div>节假日价</div>
        </div>
        {channelPlanRows.map(([room, product, weekday, weekend, holiday], index) => (
          <div key={`${product}-${index}`} className={room ? 'is-room-start' : ''}>
            <div>
              {room ? <strong>{room}</strong> : null}
              <span>{product}</span>
            </div>
            <div>{weekday}</div>
            <div>{weekend}</div>
            <div className={holiday === '设置' ? 'is-link' : ''}>{holiday}</div>
          </div>
        ))}
      </div>
    </ChannelDrawer>
  )
}

export function ChannelBatchDrawer({ onClose }: { onClose: () => void }) {
  return (
    <ChannelDrawer title="批量修改" onClose={onClose}>
      <div className="channel-batch-body">
        <section className="channel-drawer-section">
          <h3>修改类型</h3>
          <label>
            <input type="radio" name="channel-batch-type" defaultChecked /> 价格
          </label>
          <label>
            <input type="radio" name="channel-batch-type" /> 调整产品比例
          </label>
        </section>
        <section className="channel-drawer-section channel-pick-row">
          <h3>选择产品</h3>
          <button type="button">添加产品</button>
          <span>已选0个产品</span>
        </section>
        <section className="channel-drawer-section">
          <h3>选择日期</h3>
          <div className="channel-mode-switch">
            <button type="button" className="is-active">
              多段模式
            </button>
            <button type="button">日历模式</button>
          </div>
          <div className="channel-date-range">
            2026-05-13 <span>→</span> 2026-05-13
          </div>
          <button type="button" className="channel-link-button">
            添加时间段
          </button>
          <button type="button" className="channel-link-button">
            修改节假日价格
          </button>
        </section>
        <section className="channel-drawer-section channel-weekdays">
          <h3>选择星期</h3>
          {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
            <label key={day}>
              <input type="checkbox" defaultChecked /> {day}
            </label>
          ))}
          <label>
            <input type="checkbox" /> 全选
          </label>
        </section>
        <section className="channel-drawer-section">
          <h3>价格</h3>
          <label>
            <input type="radio" name="channel-price-mode" defaultChecked /> 绝对值改价
          </label>
          <label>
            <input type="radio" name="channel-price-mode" /> 差值改价
          </label>
          <label>
            <input type="radio" name="channel-price-mode" /> 百分比改价
          </label>
          <input type="text" placeholder="请输入" />
        </section>
      </div>
      <footer className="channel-drawer-footer">
        <button type="button" onClick={onClose}>
          保存
        </button>
        <button type="button" onClick={onClose}>
          取消
        </button>
      </footer>
    </ChannelDrawer>
  )
}

export function ChannelPreviewModal({ onClose }: { onClose: () => void }) {
  const previewRows = [
    ['顶层套房（浴缸巨幕电竞麻将）', '*0.93', '848.16', '848.16', '1,080.66', '1,080.66'],
    ['顶层套房（浴缸巨幕电竞麻将）', '-', '730', '—', '930', '930'],
    ['桑拿浴缸百平露台台球桌天落床', '*0.9', '657', '657', '837', '837'],
  ]

  return (
    <div className="channel-preview-backdrop" role="presentation" onClick={onClose}>
      <section className="channel-preview-modal" role="dialog" aria-modal="true" aria-label="房价修改预览" onClick={(event) => event.stopPropagation()}>
        <header>
          <h2>房价修改预览</h2>
          <div>
            <button type="button">一键覆盖</button>
            <button type="button" onClick={onClose}>
              取消
            </button>
            <button type="button" aria-label="关闭房价修改预览" onClick={onClose}>
              ×
            </button>
          </div>
        </header>
        <div className="channel-preview-grid">
          <div className="channel-preview-grid__head">
            <div>2026.05.13</div>
            <div>产品系数</div>
            <div>05.13</div>
            <div>05.14</div>
            <div>05.15</div>
            <div>05.16</div>
          </div>
          {previewRows.map((row) => (
            <div key={row.join('-')}>
              {row.map((cell) => (
                <div key={cell} className={cell === '730' || cell === '930' ? 'is-diff' : ''}>
                  {cell}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export function ChannelConfirmModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="channel-confirm-backdrop" role="presentation" onClick={onClose}>
      <section className="channel-confirm-modal" role="dialog" aria-modal="true" aria-label="确认不覆盖渠道价格" onClick={(event) => event.stopPropagation()}>
        <strong>是否确认不使用中央价覆盖渠道房型价格？</strong>
        <p>确认不覆盖后中央价和渠道价格之间会存在部分差异。</p>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" onClick={onConfirm}>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

export function ChannelGuideOverlay({ step, onNext, onClose }: { step: number; onNext: () => void; onClose: () => void }) {
  return (
    <div className="channel-guide-layer" role="presentation" onClick={onClose}>
      <section className="channel-guide-card" role="dialog" aria-modal="true" aria-label="新手指引" onClick={(event) => event.stopPropagation()}>
        <p>
          {step === 1
            ? '此处可设置渠道实际卖价和划线价的关系，设置好了之后将可以在路客云同时查看划线价和实际卖价。'
            : '继续查看价格规划、批量改价和同步渠道的操作入口。'}
        </p>
        <footer>
          <span>{step}/5</span>
          <button type="button" onClick={onNext}>
            下一步
          </button>
        </footer>
      </section>
      <aside className="channel-guide-demo" aria-hidden="true">
        <h3>划线价与售卖价关系设置</h3>
        {['美团酒店', '携程酒店', '飞猪酒店', '美团民宿', '途家民宿', '木鸟民宿'].map((name) => (
          <label key={name}>
            {name}实际售卖价=划线价* <span>100 %</span>
          </label>
        ))}
        <footer>
          <button type="button">保存</button>
          <button type="button">取消</button>
        </footer>
      </aside>
    </div>
  )
}

function SharedToolbar({
  active,
  renderAsCentral = false,
  selectedStore = '全部门店',
  selectedChannel: controlledSelectedChannel,
  selectedRoom = '全部房型',
  selectedTag = '房型标签',
  actionFeedback = '',
  onStoreChange = () => {},
  onChannelChange,
  onRoomChange = () => {},
  onTagChange = () => {},
  onActionBlocked = () => {},
}: {
  active: string
  mode?: string
  renderAsCentral?: boolean
  selectedStore?: string
  selectedChannel?: string
  selectedRoom?: string
  selectedTag?: string
  actionFeedback?: string
  onStoreChange?: (store: string) => void
  onChannelChange?: (channel: string) => void
  onRoomChange?: (room: string) => void
  onTagChange?: (tag: string) => void
  onActionBlocked?: (message: string) => void
}) {
  const navigate = useNavigate()
  const [localSelectedChannel, setLocalSelectedChannel] = useState('渠道')
  const [toast, setToast] = useState('')
  const [batchOpen, setBatchOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [planningOpen, setPlanningOpen] = useState(false)
  const [planningFormOpen, setPlanningFormOpen] = useState(false)
  const [smartOpen, setSmartOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [openFilter, setOpenFilter] = useState('')
  const isCentral = renderAsCentral || active === '\u4e2d\u592e\u4ef7'
  const isChannelRp = !renderAsCentral && active === '\u6e20\u9053RP\u4ef7'
  const selectedChannel = controlledSelectedChannel ?? localSelectedChannel

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 1600)
  }

  function updateSelectedChannel(channel: string) {
    setLocalSelectedChannel(channel)
    onChannelChange?.(channel)
  }

  function showActionFeedback(message: string) {
    if (isCentral) {
      onActionBlocked(message)
      return
    }

    showToast(message)
  }

  return (
    <section className="toolbar-card">
      <div className="toolbar-row">
        <PriceTabs active={active} />
        {isCentral || isChannelRp ? (
          <div className="channel-price-mode">
            <span>当前通过</span>
            <strong>"实际卖价"</strong>
            <span>进行价格调控</span>
          </div>
        ) : null}
        <div className="toolbar-actions">
          {isChannelRp ? (
            <>
              <button type="button" onClick={() => setPreviewOpen(true)}>
                预览与覆盖
              </button>
              <button type="button" onClick={() => setConfirmOpen(true)}>
                暂不处理
              </button>
            </>
          ) : null}
          <button type="button" onClick={() => showActionFeedback(isCentral ? '同步任务已创建，渠道价格将按当前中央价更新' : '已发起同步至渠道')}>
            {isCentral || isChannelRp ? '同步至渠道' : '同步价格'}
          </button>
          {isChannelRp ? (
            <>
              <button type="button" onClick={() => navigate('/setting/localRoomTypeProductionSetting')}>
                RP设置
              </button>
              <button type="button" onClick={() => setSettingsOpen(true)}>
                价格设置
              </button>
              <button type="button" onClick={() => setPlanningOpen(true)}>
                价格规划
              </button>
            </>
          ) : null}
          {isCentral ? (
            <>
              <button type="button" onClick={() => setSettingsOpen(true)}>
                价格设置
              </button>
              <button type="button" onClick={() => setPlanningOpen(true)}>
                价格规划
              </button>
            </>
          ) : null}
          <button type="button" onClick={() => setBatchOpen(true)}>
            批量改价
          </button>
          {isCentral ? (
            <button type="button" onClick={() => setSmartOpen(true)}>
              智能调价
            </button>
          ) : (
            <button type="button" onClick={() => (isChannelRp ? setGuideStep(1) : undefined)}>{isChannelRp ? '新手指引' : '操作日志'}</button>
          )}
        </div>
      </div>
      {isChannelRp ? <p className="channel-price-alert">渠道rp价与房型价格存在差异</p> : null}
      <div className="toolbar-row toolbar-filters">
        {['全部门店', '天落会宿公寓(前海壹方城宝安中心店)'].map((store) => (
          <button
            key={store}
            type="button"
            className={`chip${selectedStore === store ? ' is-active' : ''}`}
            onClick={() => onStoreChange(store)}
          >
            {store}
          </button>
        ))}
        <button type="button" className={`chip${openFilter === 'channel' ? ' is-active' : ''}`} onClick={() => setOpenFilter(openFilter === 'channel' ? '' : 'channel')}>
          {selectedChannel}
        </button>
        <button type="button" className={`chip${openFilter === 'room' ? ' is-active' : ''}`} onClick={() => setOpenFilter(openFilter === 'room' ? '' : 'room')}>
          {selectedRoom}
        </button>
        <button type="button" className={`chip${openFilter === 'tag' ? ' is-active' : ''}`} onClick={() => setOpenFilter(openFilter === 'tag' ? '' : 'tag')}>
          {selectedTag}
        </button>
        <input type="text" placeholder="房型名称 / 渠道名称" />
        {isCentral ? (
          <button type="button" className="price-guide-button">
            新手指引
          </button>
        ) : null}
      </div>
      {openFilter ? (
        <div className="price-filter-popover" role={openFilter === 'channel' ? 'listbox' : undefined} aria-label={openFilter === 'channel' ? '渠道筛选' : undefined}>
          {openFilter === 'channel'
            ? channelOptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  role="option"
                  aria-selected={selectedChannel === item}
                  onClick={() => {
                    updateSelectedChannel(item === '全部渠道' ? '渠道' : item)
                    setOpenFilter('')
                  }}
                >
                  {item}
                </button>
              ))
            : null}
          {openFilter === 'room'
            ? roomTypes.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => {
                    onRoomChange(item.name)
                    setOpenFilter('')
                  }}
                >
                  {item.name}
                </button>
              ))
            : null}
          {openFilter === 'tag'
            ? ['全部标签', '热卖', '电竞', '观影', '周末高价'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    onTagChange(item === '全部标签' ? '房型标签' : item)
                    setOpenFilter('')
                  }}
                >
                  {item}
                </button>
              ))
            : null}
        </div>
      ) : null}
      {toast ? <div className="price-toast" role="status">{toast}</div> : null}
      {isCentral && actionFeedback ? (
        <div className="price-action-feedback" role="status" aria-label="中央价操作反馈">
          {actionFeedback}
        </div>
      ) : null}
      {settingsOpen && isChannelRp ? <ChannelPriceSettings onClose={() => setSettingsOpen(false)} /> : null}
      {settingsOpen && !isChannelRp ? (
        <div className={`price-modal-backdrop${isCentral ? ' price-modal-backdrop--drawer' : ''}`} role="presentation" onClick={() => setSettingsOpen(false)}>
          <section
            className={`price-modal ${isCentral ? 'price-drawer price-settings-drawer' : 'price-mode-modal'}`}
            role="dialog"
            aria-modal="true"
            aria-label={isCentral ? '中央价价格设置' : '价格设置'}
            onClick={(event) => event.stopPropagation()}
          >
            {isCentral ? (
              <>
                <header>
                  <div className="price-drawer-tabs">
                    <strong>价格设置</strong>
                    <span>更新价格设置</span>
                  </div>
                  <button type="button" aria-label="关闭" onClick={() => setSettingsOpen(false)}>
                    ×
                  </button>
                </header>
                <div className="price-settings-drawer__body">
                  <section className="price-settings-current">
                    <h3>页面价格设置</h3>
                    <p>
                      当前正使用：<strong>“实际卖价”</strong> 调价
                      <span>售卖价模式</span>
                      <button type="button">切换为划线价</button>
                    </p>
                  </section>
                  <h3 className="price-drawer-subtitle">划线价与实际卖价关系设置</h3>
                  <div className="price-settings-example">
                    <div>
                      <strong>商务双床房</strong>
                      <span>2张1.2米单人床 2人入住 28-32㎡</span>
                      <em>¥308</em>
                    </div>
                    <div>划线价 ¥522</div>
                    <div>实际卖价 ¥308</div>
                    <div>308/522</div>
                  </div>
                  <div className="price-settings-channel-grid">
                    {centralPriceSettings.map((item) => (
                      <label key={item.channel} className="price-settings-channel">
                        <span>{item.channel}</span>
                        <div>
                          划线价 = 实际卖价 /
                          <input aria-label={`${item.channel} 优惠比例`} defaultValue={item.percent} />
                          <b>%</b>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <footer>
                  <p>保存优惠比例后请检查价格准确，再操作推送至渠道</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSettingsOpen(false)
                      showActionFeedback('价格设置已保存，后续推送将按当前比例执行')
                    }}
                  >
                    保存
                  </button>
                  <button type="button" onClick={() => setSettingsOpen(false)}>
                    取消
                  </button>
                </footer>
              </>
            ) : (
              <>
                <header>
                  <div>
                    <p>价格设置</p>
                    <h2>{isChannelRp ? '选择渠道价控价模式' : '选择中央价控价模式'}</h2>
                  </div>
                  <button type="button" aria-label="关闭" onClick={() => setSettingsOpen(false)}>
                    ×
                  </button>
                </header>
                <div className="price-mode-options">
                  <button type="button" className="is-active">
                    <strong>售卖价模式</strong>
                    <span>通过实际售卖价/用户支付价来进行价格管控，目标页推荐此模式。</span>
                  </button>
                  <button type="button">
                    <strong>划线价模式</strong>
                    <span>通过划线价来进行价格管控，适合统一展示折扣前价格。</span>
                  </button>
                </div>
                <footer>
                  <button type="button" onClick={() => setSettingsOpen(false)}>
                    取消
                  </button>
                  <button type="button" onClick={() => setSettingsOpen(false)}>
                    确定
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      ) : null}
      {planningOpen && isChannelRp ? <ChannelPricePlan onClose={() => setPlanningOpen(false)} /> : null}
      {planningOpen && !isChannelRp ? (
        <div className={`price-modal-backdrop${isCentral ? ' price-modal-backdrop--drawer' : ''}`} role="presentation" onClick={() => setPlanningOpen(false)}>
          <section
            className={`price-modal ${isCentral ? 'price-drawer price-plan-drawer' : 'price-plan-modal'}`}
            role="dialog"
            aria-modal="true"
            aria-label="价格规划"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                {isCentral ? null : <p>价格规划</p>}
                <h2>价格规划</h2>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setPlanningOpen(false)}>
                ×
              </button>
            </header>
            <div className="price-plan-filters">
              <button type="button" className="chip is-active">全部门店</button>
              <button type="button" className="chip">天落会宿公寓(前海壹方城宝安中心店)</button>
              <button type="button" className="chip">顶层套房（浴缸巨幕电竞麻将）</button>
              <button type="button" className="chip">房型标签</button>
              <button type="button" className="price-plan-add" onClick={() => setPlanningFormOpen(true)}>
                +新增规划
              </button>
            </div>
            {planningFormOpen ? (
              <div className="price-plan-create">
                <label>
                  规划名称
                  <input type="text" defaultValue="周末高峰价" />
                </label>
                <label>
                  适用日期
                  <input type="text" defaultValue="2026.05.16 - 2026.06.11" />
                </label>
                <label>
                  调价方式
                  <select defaultValue="weekend">
                    <option value="weekend">周末上浮</option>
                    <option value="daily">每日固定价</option>
                  </select>
                </label>
                <label>
                  上浮金额
                  <input type="number" defaultValue="200" />
                </label>
                <div className="price-plan-create__actions">
                  <button type="button" onClick={() => setPlanningFormOpen(false)}>
                    取消新增
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPlanningFormOpen(false)
                      setPlanningOpen(false)
                      showActionFeedback(isCentral ? '价格规划已保存，已应用到当前筛选范围' : '价格规划已新增')
                    }}
                  >
                    保存规划
                  </button>
                </div>
              </div>
            ) : (
              <div className="price-plan-empty">没有相关数据哦！</div>
            )}
          </section>
        </div>
      ) : null}
      {smartOpen ? (
        <div className="price-modal-backdrop" role="presentation" onClick={() => setSmartOpen(false)}>
          <section className="price-modal" role="dialog" aria-modal="true" aria-label="智能调价" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p>智能调价</p>
                <h2>入住率低于 60%</h2>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setSmartOpen(false)}>
                ×
              </button>
            </header>
            <div className="price-plan-empty">建议保留工作日 730，周末 930，并同步至已关联渠道。</div>
            <footer>
              <button type="button" onClick={() => setSmartOpen(false)}>忽略</button>
              <button
                type="button"
                onClick={() => {
                  setSmartOpen(false)
                  setBatchOpen(true)
                }}
              >
                立即调价
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {batchOpen && isChannelRp ? <ChannelBatchDrawer onClose={() => setBatchOpen(false)} /> : null}
      {batchOpen && !isChannelRp ? (
        <div className="price-modal-backdrop" role="presentation" onClick={() => setBatchOpen(false)}>
          <section className="price-modal" role="dialog" aria-modal="true" aria-label="批量改价" onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <p>批量改价</p>
                <h2>{active}</h2>
              </div>
              <button type="button" aria-label="关闭" onClick={() => setBatchOpen(false)}>
                ×
              </button>
            </header>
            <div className="price-modal__form">
              <label>
                生效范围
                <select defaultValue="current">
                  <option value="current">当前筛选房型与渠道</option>
                  <option value="all">全部门店</option>
                </select>
              </label>
              <label>
                调价方式
                <select defaultValue="fixed">
                  <option value="fixed">固定价格</option>
                  <option value="increase">上调金额</option>
                </select>
              </label>
              <label>
                {isChannelRp ? '调整后卖价' : '新价格'}
                <input aria-label={isChannelRp ? '调整后卖价' : undefined} type="text" defaultValue={isChannelRp ? '848.16' : '730'} />
              </label>
              <label>
                生效日期
                <input type="text" defaultValue="2026.05.13 - 2026.06.11" />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setBatchOpen(false)}>
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setBatchOpen(false)
                  showActionFeedback(isCentral ? '批量改价任务已提交，当前日期范围已更新' : '批量改价已保存')
                }}
              >
                确定
              </button>
            </footer>
          </section>
        </div>
      ) : null}
      {isChannelRp && previewOpen ? <ChannelPreviewModal onClose={() => setPreviewOpen(false)} /> : null}
      {isChannelRp && confirmOpen ? (
        <ChannelConfirmModal
          onClose={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false)
            showToast('已保留渠道价格')
          }}
        />
      ) : null}
      {isChannelRp && guideStep > 0 ? (
        <ChannelGuideOverlay
          step={guideStep}
          onNext={() => setGuideStep((current) => Math.min(5, current + 1))}
          onClose={() => setGuideStep(0)}
        />
      ) : null}
    </section>
  )
}

function PriceMatrix({
  mode,
  renderAsCentral = false,
  channelRows,
  channelState,
  channelDate,
  centralRequestDate,
  onCentralDateChange,
  onRetryChannelRequest,
  centralData,
  centralState,
  onRetryCentralRequest,
  onActionBlocked,
}: {
  mode: string
  renderAsCentral?: boolean
  channelRows?: PriceMatrixRow[]
  channelState?: ChannelPriceRequestState
  channelDate?: string
  centralRequestDate?: string
  onCentralDateChange?: (date: string) => void
  onRetryChannelRequest?: () => void
  centralData?: CentralPriceData
  centralState?: CentralPriceRequestState
  onRetryCentralRequest?: () => void
  onActionBlocked?: (message: string) => void
}) {
  const centralHeaderScrollRef = useRef<HTMLDivElement | null>(null)
  const [selectedCell, setSelectedCell] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<{ price: string; date: string } | null>(null)
  const [modalCell, setModalCell] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'fixed' | 'increase' | 'percent'>('fixed')
  const [editValue, setEditValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({})
  const [summarySwitchStates, setSummarySwitchStates] = useState<Record<string, boolean>>({})
  const [isCentralCalendarOpen, setIsCentralCalendarOpen] = useState(false)
  const [centralCalendarMonth, setCentralCalendarMonth] = useState(() => parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()))
  const [dateOffset, setDateOffset] = useState(0)
  const isChannelRp = !renderAsCentral && mode === '\u6e20\u9053RP\u4ef7'
  const isCentral = renderAsCentral || mode === '\u4e2d\u592e\u4ef7'
  const isChannelRpCentralReuse = renderAsCentral && mode === '\u6e20\u9053RP\u4ef7'

  const rows: PriceMatrixRow[] =
    isChannelRp
      ? (channelRows ?? channelRpRows)
      : mode === '门市价' || mode === '其他价格'
        ? roomTypes.map((room) => ({
            channel: room.name,
            coefficient: mode === '门市价' ? '门市价' : '其他价',
            basePrice: String(room.base),
            prices: priceDates.map((_, index) => String(room.base + (index > 3 ? 20 : 0))),
            comparePrices: priceDates.map(() => room.stock),
          }))
        : priceRows

  const calendarStartDay = isChannelRp ? Number(channelDate?.slice(8, 10) ?? 16) : isCentral ? 13 : 12
  const visibleDates = isCentral
    ? (centralData?.dates ?? makePriceDates(dateOffset, calendarStartDay))
    : isChannelRp
      ? makePriceDates(dateOffset, calendarStartDay)
      : priceDates.map((item) => ({ ...item, label: item.date, key: item.date }))
  const gridTemplateColumns = `${mode === '中央价' || isChannelRp ? '170px' : '150px'} 76px 76px repeat(${visibleDates.length}, 88px)`
  const minWidth = 322 + visibleDates.length * 88
  const centralFrozenPaneTemplate = '154px 48px 79px'
  const centralDateColumnWidth = 88
  const centralGridTemplateColumns = `${centralFrozenPaneTemplate} repeat(${visibleDates.length}, ${centralDateColumnWidth}px)`
  const centralMinWidth = 281 + visibleDates.length * centralDateColumnWidth
  const formatDateLabel = (key: string) => key.slice(5).replace('-', '.')
  const centralRoomGroups = centralData?.rooms ?? []
  const centralHeaderDateLabel = formatHeaderDateValue(parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()))
  const centralCalendarCells = buildCalendarCells(centralCalendarMonth)
  const todayDateValue = getCentralPriceRequestDate()

  useEffect(() => {
    if (!isCentral || !centralRequestDate) return
    setCentralCalendarMonth(parseDateValue(centralRequestDate))
  }, [centralRequestDate, isCentral])

  useEffect(() => {
    if (!modalCell) return
    setSelectedCell('')
    setEditMode('fixed')
    setEditValue(selectedDetail?.price ?? '')
  }, [modalCell, selectedDetail])

  function closePriceEditor() {
    setModalCell(null)
    setSelectedCell('')
    setSelectedDetail(null)
  }

  function toggleRoomCollapsed(roomId: string) {
    setCollapsedRooms((current) => ({
      ...current,
      [roomId]: !current[roomId],
    }))
  }

  function isRoomCollapsed(roomId: string) {
    return Boolean(collapsedRooms[roomId])
  }

  function toggleAllCentralRooms() {
    setCollapsed((current) => {
      const next = !current
      setCollapsedRooms(next ? Object.fromEntries(centralRoomGroups.map((room) => [room.id, true])) : {})
      return next
    })
  }

  function getCentralBaseComparePrice(row: PriceMatrixRow) {
    return row.comparePrices.find((value) => value && value !== '-') ?? row.basePrice
  }

  function handleCentralDatePicked(dateValue: string) {
    onCentralDateChange?.(dateValue)
    setIsCentralCalendarOpen(false)
  }

  function isSummarySwitchOn(cellKey: string) {
    return summarySwitchStates[cellKey] !== false
  }

  function toggleSummarySwitch(cellKey: string) {
    setSummarySwitchStates((current) => ({
      ...current,
      [cellKey]: current[cellKey] === false,
    }))
  }

  function renderCentralDateMetric({
    key,
    roomName,
    dateLabel,
    price,
    stock,
  }: {
    key: string
    roomName: string
    dateLabel: string
    price: string
    stock: string
  }) {
    const switchOn = isSummarySwitchOn(key)

    return (
      <div
        key={key}
        data-testid="central-summary-date-cell"
        className={`price-cell price-cell-button price-cell-button--summary ${selectedCell === key ? 'is-selected' : ''} ${
          switchOn ? '' : 'is-switch-off'
        }`}
      >
        <button
          type="button"
          data-testid="central-summary-stock-switch"
          className={`central-price-grid__metric-stock ${switchOn ? 'is-on' : 'is-off'}`}
          aria-label={`${dateLabel}库存开关`}
          aria-pressed={switchOn}
          onClick={() => toggleSummarySwitch(key)}
        >
          <i aria-hidden="true" />
          <em>{stock}</em>
        </button>
        <button
          type="button"
          className="central-price-grid__metric-price-button"
          aria-label={`${price} ${dateLabel}`}
          onClick={() => {
            setSelectedCell(key)
            setSelectedDetail({ price, date: dateLabel })
            setModalCell(`${roomName} / ${dateLabel}`)
          }}
        >
          <strong className="central-price-grid__metric-price">{price}</strong>
        </button>
      </div>
    )
  }

  function renderCentralStockOnlyMetric(key: string, stock: string) {
    return (
      <div key={key} data-testid="channel-rp-summary-stock-cell" className="price-cell central-price-grid__stock-only-cell">
        <em>{stock}</em>
      </div>
    )
  }

  function renderCentralBasePriceCell(actualPrice: string, comparePrice: string, testId?: string) {
    return (
      <div className="central-price-grid__base-price" data-testid={testId}>
        <span className="central-price-grid__tag-price">
          <i className="central-price-grid__tag">实</i>
          <strong>{actualPrice}</strong>
        </span>
        <span className="central-price-grid__tag-price central-price-grid__tag-price--muted">
          <i className="central-price-grid__tag">划</i>
          <em>{comparePrice}</em>
        </span>
      </div>
    )
  }

  function renderCentralChannelDateCell({
    key,
    row,
    dateLabel,
    price,
    comparePrice,
  }: {
    key: string
    row: PriceMatrixRow
    dateLabel: string
    price: string
    comparePrice: string
  }) {
    return (
      <button
        key={key}
        type="button"
        className={`price-cell price-cell-button ${selectedCell === key ? 'is-selected' : ''}`}
        aria-label={`${price} ${dateLabel}`}
        onClick={() => {
          setSelectedCell(key)
          setSelectedDetail({ price, date: dateLabel })
          setModalCell(`${row.channel} / ${dateLabel}`)
        }}
      >
        <strong>{price}</strong>
        <span>{comparePrice}</span>
      </button>
    )
  }

  function renderCentralGroupRow(room: CentralPriceRoom) {
    const roomCollapsed = collapsed || isRoomCollapsed(room.id)

    return (
      <div
        key={`${room.name}-summary`}
        className="price-grid__row price-grid__row--central price-grid__group-row"
        style={{ gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }}
      >
        <div className="central-price-grid__frozen-cell central-price-grid__frozen-cell--group" data-testid="central-price-matrix-row-header">
          <div className="central-price-grid__frozen-inner" style={{ gridTemplateColumns: centralFrozenPaneTemplate }}>
            <button type="button" className="central-price-grid__group-toggle" aria-expanded={!roomCollapsed} onClick={() => toggleRoomCollapsed(room.id)}>
              <span className="central-price-grid__group-copy">
                <strong>{room.name}</strong>
              </span>
              <i className={roomCollapsed ? 'is-collapsed' : ''} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <span className="price-coeff-badge price-coeff-badge--central central-price-grid__summary-icon" aria-hidden="true">
            {isChannelRpCentralReuse ? '\u4e2d' : '+'}
          </span>
        </div>
        <div>{isChannelRpCentralReuse ? '-' : room.basePrice}</div>
        {visibleDates.map((dateItem, index) => {
          const status = room.prices[index] ?? { price: '-', stock: '-' }
          const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateItem.key)
          const key = `${room.id}-summary-${dateItem.key}`

          return isChannelRpCentralReuse
            ? renderCentralStockOnlyMetric(key, status.stock)
            : renderCentralDateMetric({
                key,
                roomName: room.name,
                dateLabel,
                price: status.price,
                stock: status.stock,
              })
        })}
      </div>
    )
  }

  function renderPriceRow(row: PriceMatrixRow, keyPrefix = '') {
    const product = 'product' in row && typeof row.product === 'string' ? row.product : ''
    const rowClassName = isCentral ? 'price-grid__row price-grid__row--central' : 'price-grid__row'

    if (isCentral) {
      const compareBasePrice = getCentralBaseComparePrice(row)

      return (
        <div
          key={`${keyPrefix}${row.channel}`}
          data-testid="central-channel-row"
          className={rowClassName}
          style={{ gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }}
        >
          <div className="price-room-header price-room-header--central" data-testid="central-price-matrix-row-header">
            <strong>{row.channel}</strong>
            {product ? <span>{product}</span> : null}
          </div>
          <div>
            <span className="central-price-grid__pill">{row.coefficient || '-'}</span>
          </div>
          <div>{renderCentralBasePriceCell(row.basePrice, compareBasePrice, 'central-channel-base-price')}</div>
          {visibleDates.map((dateItem, index) => {
            const price = row.prices[index % row.prices.length]
            const comparePrice = row.comparePrices[index % row.comparePrices.length]
            const key = `${keyPrefix}${row.channel}-${dateItem.key}`
            const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateItem.key)
            return renderCentralChannelDateCell({ key, row, dateLabel, price, comparePrice })
          })}
        </div>
      )
    }

    return (
      <div key={`${keyPrefix}${row.channel}`} className={rowClassName} style={{ gridTemplateColumns, minWidth }}>
        <div className="price-room-header" data-testid={isCentral ? 'central-price-matrix-row-header' : undefined}>
          <strong>{row.channel}</strong>
          {product ? <span>{product}</span> : null}
        </div>
        <div>{row.coefficient}</div>
        <div>{row.basePrice}</div>
        {visibleDates.map((dateItem, index) => {
          const price = row.prices[index % row.prices.length]
          const comparePrice = row.comparePrices[index % row.comparePrices.length]
          const key = `${keyPrefix}${row.channel}-${dateItem.key}`
          const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateItem.key)
          return (
            <button
              key={key}
              type="button"
              className={`price-cell price-cell-button ${selectedCell === key ? 'is-selected' : ''}`}
              aria-label={`${price} ${dateLabel}`}
              onClick={() => {
                setSelectedCell(key)
                setSelectedDetail({ price, date: dateLabel })
                setModalCell(`${row.channel} / ${dateLabel}`)
              }}
            >
              <strong>{price}</strong>
              <span>{comparePrice}</span>
            </button>
          )
        })}
      </div>
    )
  }

  function renderCentralHeaderLeft() {
    return (
      <div className="central-price-grid__head-static" style={{ gridTemplateColumns: centralFrozenPaneTemplate }}>
        <div className="central-price-grid__date-head">
          <button
            type="button"
            data-testid="central-date-trigger"
            className="central-price-grid__date-trigger"
            onClick={() => setIsCentralCalendarOpen((current) => !current)}
          >
            <strong>{centralHeaderDateLabel}</strong>
            <i aria-hidden="true" />
          </button>
          <button type="button" className="price-grid__collapse-button" onClick={toggleAllCentralRooms}>
            <span>{collapsed ? '\u5168\u90e8\u5c55\u5f00' : '\u5168\u90e8\u6536\u8d77'}</span>
          </button>
          {isCentralCalendarOpen ? (
            <div className="central-price-grid__calendar-popover" role="dialog" aria-label="中央价日期选择">
              <header className="central-price-grid__calendar-header">
                <button type="button" aria-label="上个月" onClick={() => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                  ‹
                </button>
                <strong>{`${centralCalendarMonth.getFullYear()}年 ${centralCalendarMonth.getMonth() + 1}月`}</strong>
                <button type="button" aria-label="下个月" onClick={() => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                  ›
                </button>
              </header>
              <div className="central-price-grid__calendar-weekdays">
                {calendarWeekLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="central-price-grid__calendar-days">
                {centralCalendarCells.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={item.key}
                    className={[
                      item.isMuted ? 'is-muted' : '',
                      item.key === (centralRequestDate ?? todayDateValue) ? 'is-picked' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleCentralDatePicked(item.key)}
                  >
                    {item.day}
                  </button>
                ))}
              </div>
              <footer className="central-price-grid__calendar-footer">
                <button
                  type="button"
                  onClick={() => {
                    const nextToday = getCentralPriceRequestDate()
                    setCentralCalendarMonth(parseDateValue(nextToday))
                    handleCentralDatePicked(nextToday)
                  }}
                >
                  今天
                </button>
              </footer>
            </div>
          ) : null}
        </div>
        <div>{'\u6e20\u9053\u7cfb\u6570'}</div>
        <div>{'\u57fa\u7840\u4ef7'}</div>
      </div>
    )
  }

  function renderCentralHeaderDates() {
    return (
      <div className="central-price-grid__head-scroll-track">
        {visibleDates.map((item) => {
          const day = new Date(item.key).getDay()
          const className = [day === 0 || day === 6 ? 'is-weekend' : '', 'isToday' in item && item.isToday ? 'is-today' : '']
            .filter(Boolean)
            .join(' ')

          return (
            <div key={`${item.key}-${item.weekday}`} className={className}>
              <strong>{formatDateLabel(item.key)}</strong>
              <span>{item.weekday}</span>
            </div>
          )
        })}
      </div>
    )
  }

  function renderCentralMatrix() {
    return (
      <div className="central-price-grid">
        <div className="central-price-grid__head-shell" data-testid="central-price-matrix-header">
          {renderCentralHeaderLeft()}
          <div ref={centralHeaderScrollRef} className="central-price-grid__head-scroll">
            {renderCentralHeaderDates()}
          </div>
        </div>
        <div
          className="central-price-grid__scroll"
          data-testid="central-price-matrix-scroll"
          onScroll={(event) => {
            if (centralHeaderScrollRef.current) {
              centralHeaderScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
            }
          }}
        >
          {centralState?.kind === 'success'
            ? centralRoomGroups.map((room) => (
                <div key={room.id} className="price-grid__section">
                  {renderCentralGroupRow(room)}
                  {!collapsed && !isRoomCollapsed(room.id) ? room.channelRows.map((row) => renderPriceRow(row, `${room.id}-`)) : null}
                </div>
              ))
            : null}
        </div>
      </div>
    )
  }

  return (
    <>
      {isChannelRp && channelState?.kind === 'loading' ? (
        <section className="price-request-state" role="status" aria-label="渠道RP价加载状态">
          正在请求渠道RP价数据...
        </section>
      ) : null}
      {isChannelRp && channelState?.kind === 'error' ? (
        <section className="price-request-state price-request-state--error" role="alert">
          <strong>渠道价格加载失败</strong>
          <span>{channelState.message}</span>
          <button type="button" onClick={onRetryChannelRequest}>
            重新加载
          </button>
        </section>
      ) : null}
      {isChannelRp && channelState?.kind === 'empty' ? (
        <section className="price-request-state" role="status" aria-label="渠道RP价空态">
          暂无符合当前筛选条件的渠道RP价数据。
        </section>
      ) : null}
      {isCentral && centralState?.kind === 'loading' ? (
        <section className="price-loading-state" role="status" aria-label="中央价加载状态">
          正在加载中央价数据...
        </section>
      ) : null}
      {isCentral && centralState?.kind === 'error' ? (
        <section className="price-error-state" role="alert" aria-label="中央价数据加载失败">
          <strong>中央价格数据加载失败</strong>
          <span>{centralState.message}</span>
          <button type="button" onClick={onRetryCentralRequest}>
            重新加载
          </button>
        </section>
      ) : null}
      {isCentral && centralState?.kind === 'empty' ? (
        <section className="price-empty-state" role="status" aria-label="中央价空状态">
          暂无中央价数据
        </section>
      ) : null}
      <section className="table-card">
        {!isCentral ? (
          <div className="price-calendar-toolbar">
            <div>
              <button type="button" onClick={() => setDateOffset((value) => value - 7)}>
                上一周
              </button>
              <strong>2026.05.{String(calendarStartDay + dateOffset).padStart(2, '0')} 起</strong>
              <button type="button" onClick={() => setDateOffset((value) => value + 7)}>
                下一周
              </button>
              <button type="button" onClick={() => setDateOffset(0)}>
                今日
              </button>
              <button type="button" onClick={() => setCollapsed((value) => !value)}>
                {collapsed ? '全部展开' : '全部收起'}
              </button>
            </div>
            <span>点击价格单元格可打开改价弹层</span>
          </div>
        ) : null}

        {isCentral ? (
          renderCentralMatrix()
        ) : (
          <div className="price-grid">
            <div className="price-grid__head" style={{ gridTemplateColumns, minWidth }}>
              <div>{isChannelRp ? '\u5168\u90e8\u6536\u8d77' : '\u623f\u578b'}</div>
              <div>{isChannelRp ? '\u4ea7\u54c1\u7cfb\u6570' : '\u7cfb\u6570'}</div>
              <div>{isChannelRp ? '\u57fa\u7840\u4ef7' : '\u5e95\u4ef7'}</div>
              {visibleDates.map((item) => (
                <div key={`${item.key}-${item.weekday}`} className={['\u516d', '\u65e5'].includes(item.weekday) ? 'is-weekend' : ''}>
                  <strong>{item.label}</strong>
                  <span>{item.weekday}</span>
                </div>
              ))}
            </div>
            {!collapsed && channelState?.kind !== 'error' && channelState?.kind !== 'empty'
              ? rows.map((row) => renderPriceRow(row))
              : null}
          </div>
        )}
      </section>

      {modalCell && (
        <div className="price-edit-drawer-backdrop" role="presentation" onClick={closePriceEditor}>
          <section className="price-edit-drawer" role="dialog" aria-modal="true" aria-label={'\u6539\u4ef7'} onClick={(event) => event.stopPropagation()}>
            <header>
              <strong>{'\u6539\u4ef7'}</strong>
              <button type="button" aria-label={'\u5173\u95ed\u6539\u4ef7'} onClick={closePriceEditor}>
                {'\u00d7'}
              </button>
            </header>
            <div className="price-edit-drawer__body">
              <p className="price-edit-drawer__selection">{'\u5df2\u90091\u9879'}</p>
              <section className="price-edit-card">
                <div className="price-edit-card__title">{'\u4ef7\u683c'}</div>
                <div className="price-edit-options" role="radiogroup" aria-label={'\u6539\u4ef7\u65b9\u5f0f'}>
                  {[
                    { value: 'fixed', label: '\u7edd\u5bf9\u503c\u6539\u4ef7' },
                    { value: 'increase', label: '\u5dee\u503c\u6539\u4ef7' },
                    { value: 'percent', label: '\u767e\u5206\u6bd4\u6539\u4ef7' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={editMode === option.value}
                      className={`price-edit-option${editMode === option.value ? ' is-active' : ''}`}
                      onClick={() => setEditMode(option.value as 'fixed' | 'increase' | 'percent')}
                    >
                      <i aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
                <label className="price-edit-input">
                  <span className="sr-only-heading">{'\u6539\u4ef7\u503c'}</span>
                  <input type="text" aria-label={'\u6539\u4ef7\u503c'} placeholder={'\u8bf7\u8f93\u5165'} value={editValue} onChange={(event) => setEditValue(event.target.value)} autoFocus />
                </label>
              </section>
            </div>
            <footer>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  closePriceEditor()
                  if (isCentral) onActionBlocked?.('\u4ef7\u683c\u8c03\u6574\u5df2\u4fdd\u5b58\uff0c\u5f53\u524d\u4ef7\u683c\u77e9\u9635\u5df2\u66f4\u65b0')
                }}
              >
                {'\u4fdd\u5b58'}
              </button>
              <button type="button" onClick={closePriceEditor}>
                {'\u53d6\u6d88'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

function ChannelRpPriceMatrix({
  centralRequestDate,
  onCentralDateChange,
  centralData,
  centralState,
  onRetryCentralRequest,
  onActionBlocked,
}: {
  centralRequestDate?: string
  onCentralDateChange?: (date: string) => void
  centralData?: CentralPriceData
  centralState?: CentralPriceRequestState
  onRetryCentralRequest?: () => void
  onActionBlocked?: (message: string) => void
}) {
  const centralHeaderScrollRef = useRef<HTMLDivElement | null>(null)
  const [editorCell, setEditorCell] = useState<{ title: string; price: string } | null>(null)
  const [editMode, setEditMode] = useState<'fixed' | 'increase' | 'percent'>('fixed')
  const [editValue, setEditValue] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [collapsedRooms, setCollapsedRooms] = useState<Record<string, boolean>>({})
  const [isCentralCalendarOpen, setIsCentralCalendarOpen] = useState(false)
  const [centralCalendarMonth, setCentralCalendarMonth] = useState(() => parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()))
  const visibleDates = centralData?.dates ?? makePriceDates(0, 13)
  const centralFrozenPaneTemplate = '154px 48px 79px'
  const centralDateColumnWidth = 88
  const centralGridTemplateColumns = `${centralFrozenPaneTemplate} repeat(${visibleDates.length}, ${centralDateColumnWidth}px)`
  const centralMinWidth = 281 + visibleDates.length * centralDateColumnWidth
  const centralRoomGroups = centralData?.rooms ?? []
  const centralHeaderDateLabel = formatHeaderDateValue(parseDateValue(centralRequestDate ?? getCentralPriceRequestDate()))
  const centralCalendarCells = buildCalendarCells(centralCalendarMonth)
  const todayDateValue = getCentralPriceRequestDate()

  useEffect(() => {
    if (!centralRequestDate) return
    setCentralCalendarMonth(parseDateValue(centralRequestDate))
  }, [centralRequestDate])

  useEffect(() => {
    if (!editorCell) return
    setEditMode('fixed')
    setEditValue(editorCell.price)
  }, [editorCell])

  function formatDateLabel(key: string) {
    return key.slice(5).replace('-', '.')
  }

  function closePriceEditor() {
    setEditorCell(null)
  }

  function toggleRoomCollapsed(roomId: string) {
    setCollapsedRooms((current) => ({
      ...current,
      [roomId]: !current[roomId],
    }))
  }

  function isRoomCollapsed(roomId: string) {
    return Boolean(collapsedRooms[roomId])
  }

  function toggleAllCentralRooms() {
    setCollapsed((current) => {
      const next = !current
      setCollapsedRooms(next ? Object.fromEntries(centralRoomGroups.map((room) => [room.id, true])) : {})
      return next
    })
  }

  function handleCentralDatePicked(dateValue: string) {
    onCentralDateChange?.(dateValue)
    setIsCentralCalendarOpen(false)
  }

  function getCentralBaseComparePrice(row: PriceMatrixRow) {
    return row.comparePrices.find((value) => value && value !== '-') ?? row.basePrice
  }

  function renderCentralStockOnlyMetric(key: string, stock: string) {
    return (
      <div key={key} data-testid="channel-rp-summary-stock-cell" className="price-cell central-price-grid__stock-only-cell">
        <em>{stock}</em>
      </div>
    )
  }

  function renderCentralBasePriceCell(actualPrice: string, comparePrice: string, testId?: string) {
    return (
      <div className="central-price-grid__base-price" data-testid={testId}>
        <span className="central-price-grid__tag-price">
          <i className="central-price-grid__tag">{'\u5b9e'}</i>
          <strong>{actualPrice}</strong>
        </span>
        <span className="central-price-grid__tag-price central-price-grid__tag-price--muted">
          <i className="central-price-grid__tag">{'\u5212'}</i>
          <em>{comparePrice}</em>
        </span>
      </div>
    )
  }

  function renderChannelDateCell({
    key,
    row,
    dateLabel,
    price,
    comparePrice,
  }: {
    key: string
    row: PriceMatrixRow
    dateLabel: string
    price: string
    comparePrice: string
  }) {
    return (
      <button
        key={key}
        type="button"
        className="price-cell price-cell-button"
        aria-label={`${price} ${dateLabel}`}
        onClick={() => setEditorCell({ title: `${row.channel} / ${dateLabel}`, price })}
      >
        <strong>{price}</strong>
        <span>{comparePrice}</span>
      </button>
    )
  }

  function renderPriceRow(row: PriceMatrixRow, keyPrefix = '') {
    const product = 'product' in row && typeof row.product === 'string' ? row.product : ''
    const compareBasePrice = getCentralBaseComparePrice(row)

    return (
      <div
        key={`${keyPrefix}${row.channel}`}
        data-testid="central-channel-row"
        className="price-grid__row price-grid__row--central"
        style={{ gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }}
      >
        <div className="price-room-header price-room-header--central" data-testid="central-price-matrix-row-header">
          <strong>{row.channel}</strong>
          {product ? <span>{product}</span> : null}
        </div>
        <div>
          <span className="central-price-grid__pill">{row.coefficient || '-'}</span>
        </div>
        <div>{renderCentralBasePriceCell(row.basePrice, compareBasePrice, 'central-channel-base-price')}</div>
        {visibleDates.map((dateItem, index) => {
          const price = row.prices[index % row.prices.length]
          const comparePrice = row.comparePrices[index % row.comparePrices.length]
          const dateKey = (dateItem as { key: string }).key
          const key = `${keyPrefix}${row.channel}-${dateKey}`
          const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateKey)
          return renderChannelDateCell({ key, row, dateLabel, price, comparePrice })
        })}
      </div>
    )
  }

  function renderCentralGroupRow(room: CentralPriceRoom) {
    const roomCollapsed = collapsed || isRoomCollapsed(room.id)

    return (
      <div
        key={`${room.name}-summary`}
        className="price-grid__row price-grid__row--central price-grid__group-row"
        style={{ gridTemplateColumns: centralGridTemplateColumns, minWidth: centralMinWidth }}
      >
        <div className="central-price-grid__frozen-cell central-price-grid__frozen-cell--group" data-testid="central-price-matrix-row-header">
          <div className="central-price-grid__frozen-inner" style={{ gridTemplateColumns: centralFrozenPaneTemplate }}>
            <button type="button" className="central-price-grid__group-toggle" aria-expanded={!roomCollapsed} onClick={() => toggleRoomCollapsed(room.id)}>
              <span className="central-price-grid__group-copy">
                <strong>{room.name}</strong>
              </span>
              <i className={roomCollapsed ? 'is-collapsed' : ''} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <span className="price-coeff-badge price-coeff-badge--central central-price-grid__summary-icon" aria-hidden="true">
            {'\u4e2d'}
          </span>
        </div>
        <div>-</div>
        {visibleDates.map((dateItem, index) => {
          const status = room.prices[index] ?? { price: '-', stock: '-' }
          const key = `${room.id}-summary-${dateItem.key}`
          return renderCentralStockOnlyMetric(key, status.stock)
        })}
      </div>
    )
  }

  function renderCentralHeaderLeft() {
    return (
      <div className="central-price-grid__head-static" style={{ gridTemplateColumns: centralFrozenPaneTemplate }}>
        <div className="central-price-grid__date-head">
          <button
            type="button"
            data-testid="central-date-trigger"
            className="central-price-grid__date-trigger"
            onClick={() => setIsCentralCalendarOpen((current) => !current)}
          >
            <strong>{centralHeaderDateLabel}</strong>
            <i aria-hidden="true" />
          </button>
          <button type="button" className="price-grid__collapse-button" onClick={toggleAllCentralRooms}>
            <span>{collapsed ? '\u5168\u90e8\u5c55\u5f00' : '\u5168\u90e8\u6536\u8d77'}</span>
          </button>
          {isCentralCalendarOpen ? (
            <div className="central-price-grid__calendar-popover" role="dialog" aria-label={'\u4e2d\u592e\u4ef7\u65e5\u671f\u9009\u62e9'}>
              <header className="central-price-grid__calendar-header">
                <button type="button" aria-label={'\u4e0a\u4e2a\u6708'} onClick={() => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}>
                  {'\u2039'}
                </button>
                <strong>{`${centralCalendarMonth.getFullYear()}\u5e74 ${centralCalendarMonth.getMonth() + 1}\u6708`}</strong>
                <button type="button" aria-label={'\u4e0b\u4e2a\u6708'} onClick={() => setCentralCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}>
                  {'\u203a'}
                </button>
              </header>
              <div className="central-price-grid__calendar-weekdays">
                {calendarWeekLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="central-price-grid__calendar-days">
                {centralCalendarCells.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    aria-label={item.key}
                    className={[
                      item.isMuted ? 'is-muted' : '',
                      item.key === (centralRequestDate ?? todayDateValue) ? 'is-picked' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleCentralDatePicked(item.key)}
                  >
                    {item.day}
                  </button>
                ))}
              </div>
              <footer className="central-price-grid__calendar-footer">
                <button
                  type="button"
                  onClick={() => {
                    const nextToday = getCentralPriceRequestDate()
                    setCentralCalendarMonth(parseDateValue(nextToday))
                    handleCentralDatePicked(nextToday)
                  }}
                >
                  {'\u4eca\u5929'}
                </button>
              </footer>
            </div>
          ) : null}
        </div>
        <div>{'\u6e20\u9053\u7cfb\u6570'}</div>
        <div>{'\u57fa\u7840\u4ef7'}</div>
      </div>
    )
  }

  function renderCentralHeaderDates() {
    return (
      <div className="central-price-grid__head-scroll-track">
        {visibleDates.map((item) => {
          const day = new Date(item.key).getDay()
          const className = [day === 0 || day === 6 ? 'is-weekend' : '', 'isToday' in item && item.isToday ? 'is-today' : '']
            .filter(Boolean)
            .join(' ')

          return (
            <div key={`${item.key}-${item.weekday}`} className={className}>
              <strong>{formatDateLabel(item.key)}</strong>
              <span>{item.weekday}</span>
            </div>
          )
        })}
      </div>
    )
  }

  function renderMatrix() {
    return (
      <div className="central-price-grid">
        <div className="central-price-grid__head-shell" data-testid="central-price-matrix-header">
          {renderCentralHeaderLeft()}
          <div ref={centralHeaderScrollRef} className="central-price-grid__head-scroll">
            {renderCentralHeaderDates()}
          </div>
        </div>
        <div
          className="central-price-grid__scroll"
          data-testid="central-price-matrix-scroll"
          onScroll={(event) => {
            if (centralHeaderScrollRef.current) {
              centralHeaderScrollRef.current.scrollLeft = event.currentTarget.scrollLeft
            }
          }}
        >
          {centralState?.kind === 'success'
            ? centralRoomGroups.map((room) => (
                <div key={room.id} className="price-grid__section">
                  {renderCentralGroupRow(room)}
                  {!collapsed && !isRoomCollapsed(room.id) ? room.channelRows.map((row) => renderPriceRow(row, `${room.id}-`)) : null}
                </div>
              ))
            : null}
        </div>
      </div>
    )
  }

  return (
    <>
      {centralState?.kind === 'loading' ? (
        <section className="price-loading-state" role="status" aria-label="涓ぎ浠峰姞杞界姸鎬?>">
          姝ｅ湪鍔犺浇涓ぎ浠锋暟鎹?..
        </section>
      ) : null}
      {centralState?.kind === 'error' ? (
        <section className="price-error-state" role="alert" aria-label="涓ぎ浠锋暟鎹姞杞藉け璐?>">
          <strong>涓ぎ浠锋牸鏁版嵁鍔犺浇澶辫触</strong>
          <span>{centralState.message}</span>
          <button type="button" onClick={onRetryCentralRequest}>
            閲嶆柊鍔犺浇
          </button>
        </section>
      ) : null}
      {centralState?.kind === 'empty' ? (
        <section className="price-empty-state" role="status" aria-label="涓ぎ浠风┖鐘舵€?>">
          鏆傛棤涓ぎ浠锋暟鎹?
        </section>
      ) : null}
      <section className="table-card">{renderMatrix()}</section>

      {editorCell && (
        <div className="price-edit-drawer-backdrop" role="presentation" onClick={closePriceEditor}>
          <section className="price-edit-drawer" role="dialog" aria-modal="true" aria-label={'\u6539\u4ef7'} onClick={(event) => event.stopPropagation()}>
            <header>
              <strong>{'\u6539\u4ef7'}</strong>
              <button type="button" aria-label={'\u5173\u95ed\u6539\u4ef7'} onClick={closePriceEditor}>
                {'\u00d7'}
              </button>
            </header>
            <div className="price-edit-drawer__body">
              <p className="price-edit-drawer__selection">{'\u5df2\u90091\u9879'}</p>
              <section className="price-edit-card">
                <div className="price-edit-card__title">{'\u4ef7\u683c'}</div>
                <div className="price-edit-options" role="radiogroup" aria-label={'\u6539\u4ef7\u65b9\u5f0f'}>
                  {[
                    { value: 'fixed', label: '\u7edd\u5bf9\u503c\u6539\u4ef7' },
                    { value: 'increase', label: '\u5dee\u503c\u6539\u4ef7' },
                    { value: 'percent', label: '\u767e\u5206\u6bd4\u6539\u4ef7' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={editMode === option.value}
                      className={`price-edit-option${editMode === option.value ? ' is-active' : ''}`}
                      onClick={() => setEditMode(option.value as 'fixed' | 'increase' | 'percent')}
                    >
                      <i aria-hidden="true" />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
                <label className="price-edit-input">
                  <span className="sr-only-heading">{'\u6539\u4ef7\u503c'}</span>
                  <input type="text" aria-label={'\u6539\u4ef7\u503c'} placeholder={'\u8bf7\u8f93\u5165'} value={editValue} onChange={(event) => setEditValue(event.target.value)} autoFocus />
                </label>
              </section>
            </div>
            <footer>
              <button
                type="button"
                className="is-primary"
                onClick={() => {
                  closePriceEditor()
                  onActionBlocked?.('\u4ef7\u683c\u8c03\u6574\u5df2\u4fdd\u5b58\uff0c\u5f53\u524d\u4ef7\u683c\u77e9\u9635\u5df2\u66f4\u65b0')
                }}
              >
                {'\u4fdd\u5b58'}
              </button>
              <button type="button" onClick={closePriceEditor}>
                {'\u53d6\u6d88'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

function RegularPricePage({ active }: { active: string }) {
  const location = useLocation()
  const reuseCentralLayout = location.pathname.includes('channelPrice')
  const isCentral = active === '\u4e2d\u592e\u4ef7' || reuseCentralLayout
  const isChannelRp = active === '\u6e20\u9053RP\u4ef7' && !reuseCentralLayout
  const [selectedStore, setSelectedStore] = useState('全部门店')
  const [selectedChannel, setSelectedChannel] = useState('渠道')
  const [selectedRoom, setSelectedRoom] = useState('全部房型')
  const [selectedTag, setSelectedTag] = useState('房型标签')
  const [centralRequestDate, setCentralRequestDate] = useState(() => getCentralPriceRequestDate())
  const [reloadKey, setReloadKey] = useState(0)
  const [centralReloadKey, setCentralReloadKey] = useState(0)
  const [actionFeedback, setActionFeedback] = useState('')
  const [centralData, setCentralData] = useState<CentralPriceData | undefined>()
  const [centralRequestState, setCentralRequestState] = useState<CentralPriceRequestState>({
    kind: 'idle',
    message: '等待请求中央价数据',
  })
  const [channelRequestState, setChannelRequestState] = useState<ChannelPriceRequestState>({
    kind: 'loading',
    message: '等待加载渠道RP价数据',
    rows: [],
  })
  const campId = useMemo(() => new URLSearchParams(location.search).get('campId') || 'default-camp', [location.search])
  const channelPriceProvider = useMemo<ChannelPriceProviderName>(() => {
    const configured = new URLSearchParams(location.search).get('channelPriceProvider')
    return configured === 'real' ? 'real' : 'mock'
  }, [location.search])
  const channelDate = useMemo(() => currentBusinessDate(), [])
  const centralFilters = useMemo<CentralPriceFilters>(
    () => ({
      selectedStore,
      selectedChannel,
      selectedRoom,
      selectedTag,
      date: centralRequestDate,
      pageNum: 1,
      pageSize: 15,
    }),
    [centralRequestDate, selectedChannel, selectedRoom, selectedStore, selectedTag],
  )

  function normalizeChannelPriceErrorMessage(error: unknown) {
    const rawMessage = error instanceof Error ? error.message : String(error)
    if (/mock|traceId|provider/i.test(rawMessage)) {
      return '渠道RP价服务暂不可用，请稍后重试'
    }
    return rawMessage || '渠道价格加载失败，请稍后重试'
  }

  useEffect(() => {
    if (!isChannelRp) return

    const controller = new AbortController()
    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setChannelRequestState((current) => ({
        kind: 'loading',
        message: '正在加载渠道RP价数据',
        rows: current.rows,
      }))
    })

    fetchChannelPriceRows(
      {
        campId,
        channel: selectedChannel,
        date: channelDate,
        provider: channelPriceProvider,
      },
      controller.signal,
    )
      .then((result) => {
        const rows = result.rows
        setChannelRequestState({
          kind: rows.length > 0 ? 'success' : 'empty',
          message: rows.length > 0 ? '渠道RP价数据已更新' : '暂无渠道RP价数据',
          rows,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setChannelRequestState({
          kind: 'error',
          message: normalizeChannelPriceErrorMessage(error),
          rows: [],
        })
      })

    return () => controller.abort()
  }, [campId, channelDate, channelPriceProvider, isChannelRp, reloadKey, selectedChannel])

  useEffect(() => {
    if (!isCentral) return

    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setCentralRequestState({ kind: 'loading', message: '正在加载中央价数据' })
      }
    })

    fetchCentralPrices(centralFilters, controller.signal)
      .then((result) => {
        if (!result.ok) {
          setCentralData(undefined)
          setCentralRequestState({ kind: 'error', message: toCentralBusinessErrorMessage(result.message) })
          return
        }

        setCentralData(result.data)
        setCentralRequestState({
          kind: result.data.rooms.length > 0 ? 'success' : 'empty',
          message: result.data.rooms.length > 0 ? '中央价数据已更新' : '暂无中央价数据',
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setCentralData(undefined)
        setCentralRequestState({
          kind: 'error',
          message: toCentralBusinessErrorMessage(error instanceof Error ? error.message : String(error)),
        })
      })

    return () => controller.abort()
  }, [centralFilters, centralReloadKey, isCentral])

  return (
    <div className={`page-stack price-page${isCentral ? ' price-page--central' : ''}`}>
      <SharedToolbar
        active={active}
        renderAsCentral={reuseCentralLayout}
        selectedStore={selectedStore}
        selectedChannel={selectedChannel}
        selectedRoom={selectedRoom}
        selectedTag={selectedTag}
        actionFeedback={actionFeedback}
        onStoreChange={setSelectedStore}
        onChannelChange={setSelectedChannel}
        onRoomChange={setSelectedRoom}
        onTagChange={setSelectedTag}
        onActionBlocked={setActionFeedback}
      />
      {reuseCentralLayout ? (
        <ChannelRpPriceMatrix
          centralRequestDate={centralRequestDate}
          onCentralDateChange={setCentralRequestDate}
          centralData={centralData}
          centralState={isCentral ? centralRequestState : undefined}
          onRetryCentralRequest={() => setCentralReloadKey((value) => value + 1)}
          onActionBlocked={setActionFeedback}
        />
      ) : (
        <PriceMatrix
          mode={active}
          channelRows={channelRequestState.rows}
          channelState={isChannelRp ? channelRequestState : undefined}
          channelDate={channelDate}
          centralRequestDate={centralRequestDate}
          onCentralDateChange={setCentralRequestDate}
          onRetryChannelRequest={() => setReloadKey((value) => value + 1)}
          centralData={centralData}
          centralState={isCentral ? centralRequestState : undefined}
          onRetryCentralRequest={() => setCentralReloadKey((value) => value + 1)}
          onActionBlocked={setActionFeedback}
        />
      )}
    </div>
  )
}

function toCentralBusinessErrorMessage(message: string) {
  const normalized = message
    .replace(/mock/gi, '')
    .replace(/provider/gi, '')
    .replace(/后端/g, '数据服务')
    .replace(/接口/g, '数据')
    .replace(/阻塞/g, '失败')
    .replace(/traceId:[^)）]+[)）]?/gi, '')
    .replace(/[（）]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized || '中央价格数据加载失败，请稍后重试'
}

function currentBusinessDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function RetailFilterButton({
  label,
  wide = false,
  onClick,
}: {
  label: string
  wide?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={`retail-filter-button${wide ? ' retail-filter-button--wide' : ''}`}
      onClick={onClick}
    >
      <span>{label}</span>
      <em>⌄</em>
    </button>
  )
}

function RetailEmptyState({ onSetup, note }: { onSetup: () => void; note?: string }) {
  return (
    <section className="retail-empty-state" aria-label="门市价未设置">
      <div className="retail-empty-illustration" aria-hidden="true">
        <div />
      </div>
      <p>请先完成门市价设置</p>
      {note ? <span>{note}</span> : null}
      <button type="button" onClick={onSetup}>
        去设置
      </button>
    </section>
  )
}

function RetailSettingDrawer({
  type,
  onClose,
}: {
  type: 'retail' | 'plan' | 'batch'
  onClose: () => void
}) {
  if (type === 'retail') {
    return (
      <div className="retail-drawer-backdrop" role="presentation">
        <section className="retail-drawer" role="dialog" aria-modal="true" aria-label="门市价设置">
          <header>
            <strong>门市价设置</strong>
            <button type="button" aria-label="关闭门市价设置" onClick={onClose}>
              ×
            </button>
          </header>
          <div className="retail-drawer__body">
            <div className="retail-info-bar">请设置门市价与路客云中央价的关系</div>
            <label className="retail-radio-row">
              <input type="radio" name="retail-mode" defaultChecked />
              <span>门市价等于中央价</span>
            </label>
            <label className="retail-radio-row">
              <input type="radio" name="retail-mode" />
              <span>门市价关联中央价</span>
            </label>
            <div className="retail-relation-row">
              <span>门市价=中央价</span>
              <select defaultValue="+">
                <option value="+">+</option>
                <option value="-">-</option>
              </select>
              <input type="text" aria-label="门市价关联中央价金额" placeholder="请输入" />
            </div>
            <label className="retail-radio-row">
              <input type="radio" name="retail-mode" />
              <span>门市价与中央价相互独立</span>
            </label>
          </div>
          <footer>
            <button type="button" className="is-primary" onClick={onClose}>
              保存
            </button>
            <button type="button" onClick={onClose}>
              取消
            </button>
          </footer>
        </section>
      </div>
    )
  }

  if (type === 'plan') {
    return (
      <div className="retail-drawer-backdrop" role="presentation">
        <section className="retail-drawer" role="dialog" aria-modal="true" aria-label="价格规划">
          <header>
            <strong>价格规划</strong>
            <button type="button" aria-label="关闭价格规划" onClick={onClose}>
              ×
            </button>
          </header>
          <div className="retail-drawer__body retail-plan-drawer">
            <div className="retail-drawer-filters">
              <button type="button" className="is-active">
                全部门店
              </button>
              <button type="button">天落会宿公寓(前海壹方城宝安中心店)</button>
              <button type="button">房型</button>
              <button type="button">房型标签</button>
              <button type="button" className="retail-add-button">
                +新增规划
              </button>
            </div>
            <div className="retail-plan-empty">没有相关数据哦！</div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="retail-drawer-backdrop" role="presentation">
      <section className="retail-drawer" role="dialog" aria-modal="true" aria-label="批量修改">
        <header>
          <strong>批量修改</strong>
          <button type="button" aria-label="关闭批量修改" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="retail-drawer__body retail-batch-drawer">
          <section className="retail-batch-section">
            <h3>修改类型</h3>
            <label className="retail-radio-row">
              <input type="radio" name="batch-type" defaultChecked />
              <span>价格</span>
            </label>
          </section>
          <section className="retail-batch-section">
            <h3>选择房型</h3>
            <button type="button" className="retail-add-button">
              添加房型
            </button>
            <span className="retail-selected-count">已选0个房型</span>
          </section>
          <section className="retail-batch-section">
            <h3>选择日期</h3>
            <div className="retail-mode-switch">
              <button type="button" className="is-active">
                多段模式
              </button>
              <button type="button">日历模式</button>
            </div>
            <div className="retail-date-range">
              <span>2026-05-13</span>
              <em>→</em>
              <span>2026-05-13</span>
            </div>
            <button type="button" className="retail-add-button">
              添加时间段
            </button>
            <button type="button" className="retail-link-button">
              修改节假日价格
            </button>
          </section>
          <section className="retail-batch-section">
            <h3>选择星期</h3>
            <div className="retail-weekdays">
              {retailWeekdays.map((weekday) => (
                <label key={weekday}>
                  <input type="checkbox" aria-label={weekday} defaultChecked />
                  <span>{weekday}</span>
                </label>
              ))}
              <label>
                <input type="checkbox" aria-label="全选" defaultChecked />
                <span>全选</span>
              </label>
            </div>
          </section>
          <section className="retail-batch-section">
            <h3>价格</h3>
            <label className="retail-radio-row">
              <input type="radio" name="batch-price-type" defaultChecked />
              <span>绝对值改价</span>
            </label>
            <input type="text" placeholder="请输入" />
          </section>
        </div>
        <footer>
          <button type="button" className="is-primary" onClick={onClose}>
            保存
          </button>
          <button type="button" onClick={onClose}>
            取消
          </button>
        </footer>
      </section>
    </div>
  )
}

function HourRoomSettingsPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="retail-hour-page">
      <section className="retail-hour-card">
        <div className="retail-breadcrumb">
          <button type="button" onClick={onBack}>
            门市价
          </button>
          <span>/</span>
          <strong>钟点房设置</strong>
        </div>
        <div className="retail-hour-form">
          <div className="retail-form-row">
            <span className="retail-required">选择房型：</span>
            <button type="button" className="retail-add-button">
              +房型
            </button>
          </div>
          <label className="retail-form-row">
            <span className="retail-required">产品名称：</span>
            <input type="text" aria-label="产品名称" />
          </label>
          <div className="retail-form-row">
            <span className="retail-required">入住时长限制：</span>
            <label className="retail-inline-radio">
              <input type="radio" name="hour-limit" aria-label="限制" defaultChecked />
              限制
            </label>
            <label className="retail-inline-radio">
              <input type="radio" name="hour-limit" aria-label="不限制" />
              不限制
            </label>
            <span className="retail-help-dot">?</span>
          </div>
          <div className="retail-form-row">
            <span className="retail-required">入住时长：</span>
            <button type="button" className="retail-select-field">
              3 小时 <em>⌄</em>
            </button>
          </div>
          <div className="retail-form-row">
            <span className="retail-required">可入住时段：</span>
            <label className="retail-inline-radio">
              <input type="radio" name="hour-range" aria-label="全天" defaultChecked />
              全天
            </label>
            <label className="retail-inline-radio">
              <input type="radio" name="hour-range" aria-label="自定义" />
              自定义
            </label>
            <button type="button" className="retail-select-field retail-select-field--small" disabled>
              10 点 <em>⌄</em>
            </button>
            <span>到</span>
            <button type="button" className="retail-select-field retail-select-field--small" disabled>
              22 点 <em>⌄</em>
            </button>
          </div>
          <div className="retail-form-row">
            <span />
            <button type="button" className="retail-submit-button">
              确 定
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function RetailPricePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState<'retail' | 'plan' | 'batch' | null>(null)
  const [filterOpen, setFilterOpen] = useState<'room' | 'tag' | null>(null)
  const [keyword, setKeyword] = useState('')
  const [queryKeyword, setQueryKeyword] = useState('')
  const [retailData, setRetailData] = useState<RetailPriceData | null>(null)
  const [requestError, setRequestError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [requestRevision, setRequestRevision] = useState(0)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [selectedRoomCategoryIds, setSelectedRoomCategoryIds] = useState<string[]>([])
  const [actionMessage, setActionMessage] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const requestedAt = retailData ? new Date(retailData.requestedAt).toLocaleTimeString('zh-CN', { hour12: false }) : ''
  const roomOptions = retailData?.rooms ?? []
  const stores = retailData?.stores ?? []
  const needsSetup = retailData?.salePriceSetting.isInitPriceDisplay === 1
  const configuredProvider = typeof window !== 'undefined' && window.localStorage.getItem('pmsRetailPriceProvider') === 'real' ? 'real' : 'mock'
  const currentProvider = retailData?.providerName ?? configuredProvider

  useEffect(() => {
    const controller = new AbortController()

    loadRetailPriceData({
      keyword: queryKeyword,
      poiIds: selectedStoreId ? [selectedStoreId] : [],
      roomCategoryIds: selectedRoomCategoryIds,
    }, controller.signal)
      .then((data) => {
        setRetailData(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        const message = error instanceof Error ? error.message : '门市价数据加载失败'
        setRequestError(message.replace(/（traceId: [^）]+）/g, ''))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [queryKeyword, requestRevision, selectedStoreId, selectedRoomCategoryIds])

  function beginRetailRequest() {
    setIsLoading(true)
    setRequestError('')
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    beginRetailRequest()
    setQueryKeyword(keyword.trim())
  }

  function refreshRetailData() {
    beginRetailRequest()
    setActionMessage('正在刷新门市价数据')
    setRequestRevision((current) => current + 1)
  }

  function selectStore(poiId: string) {
    setSelectedStoreId(poiId)
    setActionMessage(`已选择门店：${stores.find((store) => store.poiId === poiId)?.poiName ?? poiId}`)
  }

  function selectRoom(roomCategoryId: string) {
    setSelectedRoomCategoryIds([roomCategoryId])
    setFilterOpen(null)
    setActionMessage(`已选择房型：${roomOptions.find((room) => room.roomCategoryId === roomCategoryId)?.roomCategoryName ?? roomCategoryId}`)
  }

  function resetRetailFilters() {
    setKeyword('')
    setQueryKeyword('')
    setSelectedStoreId('')
    setSelectedRoomCategoryIds([])
    setFilterOpen(null)
    setActionMessage('已重置门市价筛选条件')
  }

  function exportRetailPrice() {
    setActionMessage(`门市价导出任务已创建：${stores.length} 个门店，${roomOptions.length} 个房型`)
  }

  if (location.pathname.endsWith('/hourSetting')) {
    return <HourRoomSettingsPage onBack={() => navigate('/houseManage/retailPrice')} />
  }

  return (
    <div className="retail-price-page">
      <section className="retail-main-panel">
        <div className="retail-toolbar">
          <h1 className="retail-page-pill">
            门市价
          </h1>
          <div className="retail-toolbar-actions">
            <button type="button" onClick={() => navigate('/houseManage/retailPrice/hourSetting')}>
              钟点房设置
            </button>
            <button type="button" onClick={() => setDrawer('retail')}>
              门市价设置
            </button>
            <button type="button" onClick={() => setDrawer('plan')}>
              价格规划
            </button>
            <button type="button" onClick={() => setDrawer('batch')}>
              批量改价
            </button>
            <button type="button" onClick={refreshRetailData} disabled={isLoading}>
              刷新
            </button>
            <button type="button" onClick={resetRetailFilters}>
              重置
            </button>
            <button type="button" onClick={exportRetailPrice}>
              导出
            </button>
            <button type="button" onClick={() => setDetailOpen(true)}>
              查看详情
            </button>
            <button type="button" onClick={() => setMoreOpen((open) => !open)}>
              更多
            </button>
          </div>
        </div>
        {moreOpen ? (
          <div className="retail-more-popover" role="menu" aria-label="门市价更多操作">
            <button type="button" role="menuitem" onClick={() => navigate('/houseManage/logs/price')}>
              查看调价日志
            </button>
            <button type="button" role="menuitem" onClick={() => setActionMessage('门市价同步任务已创建')}>
              同步房价
            </button>
          </div>
        ) : null}
        <div className={`retail-request-status${requestError ? ' is-error' : ''}`} role="status" aria-label="门市价数据服务状态">
          <div
            hidden
            data-testid="retail-price-service-contract"
            data-provider={currentProvider}
            data-mode={retailData?.mockMode ?? ''}
            data-trace-id={retailData?.traceIds[0] ?? ''}
            data-request-summary={retailData?.requestSummary.join('|') ?? ''}
          />
          {requestError ? (
            <>
              <strong>数据加载失败</strong>
              <span>{requestError}</span>
              <button
                type="button"
                onClick={() => {
                  beginRetailRequest()
                  setRequestRevision((current) => current + 1)
                }}
              >
                重新加载
              </button>
            </>
          ) : (
            <>
              <strong>{isLoading ? '正在加载门市价数据' : '门市价数据已更新'}</strong>
              <span>
                {retailData
                  ? `门店 ${stores.length} 个，房型 ${roomOptions.length} 个，${needsSetup ? '当前需完成门市价设置' : '门市价配置已返回'}`
                  : '等待数据返回'}
              </span>
              {requestedAt ? <em>刷新于 {requestedAt}</em> : null}
            </>
          )}
        </div>
        {actionMessage ? (
          <div className="retail-action-feedback" role="status" aria-label="门市价操作反馈">
            {actionMessage}
          </div>
        ) : null}
        <div className="retail-filter-row">
          <button
            type="button"
            className={`retail-store-chip${selectedStoreId === '' ? ' is-active' : ''}`}
            onClick={() => {
              setSelectedStoreId('')
              setActionMessage('已切换到全部门店')
            }}
          >
            全部门店
          </button>
          {stores.length ? stores.map((store) => (
            <button
              key={store.poiId}
              type="button"
              className={`retail-store-chip retail-store-chip--wide${selectedStoreId === store.poiId ? ' is-active' : ''}`}
              onClick={() => selectStore(store.poiId)}
            >
              {store.poiName}
            </button>
          )) : (
            <button type="button" className="retail-store-chip retail-store-chip--wide" disabled>
              {isLoading ? '加载门店中' : '暂无门店数据'}
            </button>
          )}
          <button type="button" className="retail-gear-button" aria-label="门店设置" onClick={() => setActionMessage('已打开门店设置入口，请在设置中心维护门店信息')}>
            ⚙
          </button>
          <RetailFilterButton
            label="房型"
            onClick={() => setFilterOpen(filterOpen === 'room' ? null : 'room')}
          />
          <RetailFilterButton
            label="房型标签"
            onClick={() => setFilterOpen(filterOpen === 'tag' ? null : 'tag')}
          />
          <form className="retail-search" onSubmit={submitSearch}>
            <input
              type="search"
              placeholder="房源编码/简称/标题"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button type="submit" aria-label="搜索">
              ⌕
            </button>
            <button type="submit" className="retail-search-submit">
              搜索
            </button>
          </form>
        </div>
        {filterOpen ? (
          <div className="retail-filter-popover" role="listbox" aria-label={filterOpen === 'room' ? '房型筛选' : '房型标签筛选'}>
            {filterOpen === 'room'
              ? roomOptions.length
                ? roomOptions.map((item) => (
                  <button key={item.roomCategoryId} type="button" role="option" onClick={() => selectRoom(item.roomCategoryId)}>
                    {item.roomCategoryId}
                    <span>{item.roomCategoryName}</span>
                  </button>
                ))
                : <span className="retail-filter-empty">{isLoading ? '加载房型中' : '暂无房型数据'}</span>
              : <span className="retail-filter-empty">暂无数据</span>}
          </div>
        ) : null}
        <RetailEmptyState onSetup={() => setDrawer('retail')} note={!isLoading && roomOptions.length === 0 ? '暂无房型数据' : undefined} />
      </section>
      {drawer ? <RetailSettingDrawer type={drawer} onClose={() => setDrawer(null)} /> : null}
      {detailOpen ? (
        <RetailPriceDetailDialog
          stores={stores}
          rooms={roomOptions}
          onClose={() => setDetailOpen(false)}
        />
      ) : null}
    </div>
  )
}

function RetailPriceDetailDialog({
  stores,
  rooms,
  onClose,
}: {
  stores: RetailStore[]
  rooms: RetailRoomCategory[]
  onClose: () => void
}) {
  const primaryStore = stores[0]?.poiName ?? '全部门店'
  const primaryRoom = rooms[0]?.roomCategoryName ?? '全部房型'

  return (
    <div className="retail-drawer-backdrop" role="presentation">
      <section className="retail-detail-dialog" role="dialog" aria-modal="true" aria-label="门市价详情">
        <header>
          <strong>门市价详情</strong>
          <button type="button" aria-label="关闭门市价详情" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="retail-detail-grid">
          <div>
            <span>门店范围</span>
            <strong>{primaryStore}</strong>
          </div>
          <div>
            <span>房型范围</span>
            <strong>{primaryRoom}</strong>
          </div>
          <div>
            <span>门店数量</span>
            <strong>{stores.length}</strong>
          </div>
          <div>
            <span>房型数量</span>
            <strong>{rooms.length}</strong>
          </div>
        </div>
        <footer>
          <button type="button" className="is-primary" onClick={onClose}>
            知道了
          </button>
        </footer>
      </section>
    </div>
  )
}

function PriceComparisonPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [requestRevision, setRequestRevision] = useState(0)
  const [filters, setFilters] = useState<PriceComparisonFilters>({
    date: '2026-05-18',
    storeId: 'qianhai',
    roomTypeId: 'all',
    channelId: 'all',
  })
  const [appliedFilters, setAppliedFilters] = useState<PriceComparisonFilters>(filters)
  const [feedback, setFeedback] = useState('数据已更新')
  const [detailId, setDetailId] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [requestState, setRequestState] = useState<PriceComparisonRequestState>({
    kind: 'loading',
    message: '正在加载竞争圈比价数据',
  })

  useEffect(() => {
    let alive = true
    const params = new URLSearchParams(location.search)
    const mockState = normalizePriceComparisonMockState(params.get('mockState'))

    Promise.resolve()
      .then(() => {
        if (!alive) return null
        setRequestState({ kind: 'loading', message: '正在加载竞争圈比价数据' })
        return loadPriceComparisonDashboard({ ...appliedFilters, mockState })
      })
      .then((data) => {
        if (!alive || !data) return
        setRequestState(data.rooms.list.length === 0 ? { kind: 'empty', data } : { kind: 'success', data })
      })
      .catch((error: unknown) => {
        if (!alive) return
        setRequestState({
          kind: 'error',
          message: error instanceof Error ? error.message : '竞争圈比价数据服务返回未知错误',
        })
      })

    return () => {
      alive = false
    }
  }, [appliedFilters, location.search, requestRevision])

  const isReady = requestState.kind === 'success' || requestState.kind === 'empty'
  const dashboard = isReady ? requestState.data : null
  const detailRoom = dashboard?.rooms.list.find((room) => room.id === detailId)

  function updateFilter<K extends keyof PriceComparisonFilters>(key: K, value: PriceComparisonFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedFilters(filters)
    setFeedback('已按筛选条件更新')
  }

  function resetFilters() {
    const nextFilters = {
      date: '2026-05-18',
      storeId: 'qianhai',
      roomTypeId: 'all',
      channelId: 'all',
    }
    setFilters(nextFilters)
    setAppliedFilters(nextFilters)
    setFeedback('已恢复默认条件')
  }

  function refreshData() {
    setRequestRevision((current) => current + 1)
    setFeedback('数据已刷新')
  }

  function exportData() {
    setFeedback('导出任务已创建，可在消息中心查看进度')
  }

  return (
    <div className="page-stack price-comparison-page">
      <SharedToolbar active="竞争圈比价" />

      <section className="price-comparison-panel">
        <div className="price-comparison-header">
          <div>
            <h2>竞争圈比价</h2>
            <p>跟踪同商圈竞品价格，结合入住率和渠道表现给出调价建议。</p>
          </div>
          <div className="price-comparison-actions">
            <button type="button" onClick={refreshData} disabled={requestState.kind === 'loading'}>
              刷新
            </button>
            <button type="button" onClick={exportData} disabled={!dashboard}>
              导出
            </button>
            <button type="button" onClick={() => setShowMore((current) => !current)}>
              更多
            </button>
          </div>
        </div>

        <form className="price-comparison-toolbar" aria-label="竞争圈比价筛选" onSubmit={submitFilters}>
          <label>
            <span>比价日期</span>
            <input aria-label="比价日期" type="date" value={filters.date} onChange={(event) => updateFilter('date', event.target.value)} />
          </label>
          <label>
            <span>门店</span>
            <select aria-label="门店" value={filters.storeId} onChange={(event) => updateFilter('storeId', event.target.value)}>
              {(dashboard?.filterOptions.stores ?? []).map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>房型</span>
            <select aria-label="房型" value={filters.roomTypeId} onChange={(event) => updateFilter('roomTypeId', event.target.value)}>
              {(dashboard?.filterOptions.roomTypes ?? []).map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>渠道</span>
            <select aria-label="渠道" value={filters.channelId} onChange={(event) => updateFilter('channelId', event.target.value)}>
              {(dashboard?.filterOptions.channels ?? []).map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <button type="submit">查询</button>
          <button type="button" onClick={resetFilters}>重置</button>
        </form>

        <div className="price-comparison-feedback" role="status" aria-label="竞争圈比价操作反馈">
          {requestState.kind === 'loading' ? requestState.message : feedback}
        </div>

        {requestState.kind === 'error' ? (
          <div className="price-comparison-error" role="alert" aria-label="竞争圈比价数据错误">
            <strong>数据加载失败</strong>
            <span>{requestState.message}</span>
            <button type="button" onClick={refreshData}>重试</button>
          </div>
        ) : null}

        {dashboard ? (
          <>
            <section className="comparison-summary" aria-label="竞争圈比价核心指标">
              {dashboard.metrics.map((metric) => (
                <article key={metric.id} className={`comparison-card comparison-card--${metric.tone}`}>
                  <div>
                    <strong>{metric.label}</strong>
                    <span>{metric.delta}</span>
                  </div>
                  <dl>
                    <div>
                      <dt>当前值</dt>
                      <dd>{metric.value}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </section>

            <section className="price-comparison-chart" aria-label="竞争圈比价趋势图">
              <div className="section-header">
                <h3>价格趋势</h3>
                <div><span>本店价</span><span>竞品价</span><span>市场均价</span></div>
              </div>
              <div className="price-comparison-chart__grid">
                {dashboard.trend.map((item) => (
                  <div key={item.dateLabel}>
                    <span>{item.dateLabel}</span>
                    <strong style={{ height: `${Math.max(20, item.ownPrice / 10)}px` }}>{item.ownPrice}</strong>
                    <em style={{ height: `${Math.max(20, item.competitorPrice / 10)}px` }}>{item.competitorPrice}</em>
                    <i style={{ height: `${Math.max(20, item.marketAverage / 10)}px` }}>{item.marketAverage}</i>
                  </div>
                ))}
              </div>
            </section>

            <section className="comparison-table" aria-label="竞争圈比价列表">
              <div className="comparison-table__head">
                <div>房型</div>
                <div>渠道</div>
                <div>本店价</div>
                <div>竞品价</div>
                <div>价差</div>
                <div>入住率</div>
                <div>建议</div>
                <div>操作</div>
              </div>
              <div className="comparison-matrix">
                {dashboard.rooms.list.length ? dashboard.rooms.list.map((room) => (
                  <div key={room.id} className="comparison-matrix__row">
                    <div><span>房型</span><strong>{room.roomType}</strong></div>
                    <div><span>渠道</span><strong>{room.channel}</strong></div>
                    <div><span>本店价</span><strong>¥{room.ownPrice}</strong></div>
                    <div><span>竞品价</span><strong>¥{room.competitorPrice}</strong></div>
                    <div><span>价差</span><strong>{room.priceDiff > 0 ? '+' : ''}{room.priceDiff}</strong></div>
                    <div><span>入住率</span><strong>{room.occupancy}</strong></div>
                    <div><span>建议</span><strong>{room.suggestion}</strong></div>
                    <div>
                      <button type="button" onClick={() => setDetailId(room.id)} aria-label={`查看详情 ${room.roomType}`}>
                        查看详情
                      </button>
                    </div>
                  </div>
                )) : <div className="price-comparison-empty-line">当前条件暂无比价结果，请调整筛选条件。</div>}
              </div>
            </section>

            <section className="price-comparison-lower">
              <div aria-label="竞争圈比价待办">
                <h3>待办提醒</h3>
                {dashboard.todos.length ? dashboard.todos.map((todo) => (
                  <button key={todo.id} type="button" onClick={() => setFeedback(`${todo.title} 已标记跟进`)}>
                    <strong>{todo.title}</strong>
                    <span>{todo.priority}优先级 · {todo.due}</span>
                  </button>
                )) : <p>当前没有待办提醒。</p>}
              </div>
              <div aria-label="竞争圈比价快捷入口">
                <h3>快捷入口</h3>
                {dashboard.quickLinks.map((link) => (
                  <button key={link.id} type="button" onClick={() => navigate(link.route)}>
                    {link.label}
                  </button>
                ))}
              </div>
            </section>
          </>
        ) : null}

        {showMore ? (
          <div className="price-comparison-popover" role="dialog" aria-label="更多操作">
            <button type="button" onClick={() => setFeedback('已复制当前比价链接')}>复制链接</button>
            <button type="button" onClick={() => setFeedback('已生成调价复核任务')}>生成复核任务</button>
          </div>
        ) : null}
      </section>

      {detailRoom ? (
        <div className="price-modal" role="dialog" aria-modal="true" aria-label="比价详情">
          <section className="price-modal__panel">
            <button type="button" aria-label="关闭详情" onClick={() => setDetailId('')}>×</button>
            <h3>{detailRoom.roomType}</h3>
            <p>竞品价明细</p>
            <dl>
              <div><dt>渠道</dt><dd>{detailRoom.channel}</dd></div>
              <div><dt>本店价</dt><dd>¥{detailRoom.ownPrice}</dd></div>
              <div><dt>竞品价</dt><dd>¥{detailRoom.competitorPrice}</dd></div>
              <div><dt>市场均价</dt><dd>¥{detailRoom.marketAverage}</dd></div>
            </dl>
            <strong>{detailRoom.suggestion}</strong>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function PriceBoardPage() {
  const [detailOpen, setDetailOpen] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [requestRevision, setRequestRevision] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [requestError, setRequestError] = useState('')
  const [priceBoardData, setPriceBoardData] = useState<PriceBoardData | null>(null)
  const [selectedDurationId, setSelectedDurationId] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    queueMicrotask(() => {
      if (controller.signal.aborted) return
      setIsLoading(true)
      setRequestError('')
    })
    loadPriceBoardData(controller.signal)
      .then((data) => {
        setPriceBoardData(data)
        setSelectedDurationId((current) => current || data.durationOptions[0]?.id || '')
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setPriceBoardData(null)
        setRequestError(error instanceof Error ? error.message : String(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [requestRevision])

  const selectedDuration =
    priceBoardData?.durationOptions.find((item) => item.id === selectedDurationId) ??
    priceBoardData?.durationOptions[0] ??
    null

  const productName = priceBoardData?.productName ?? '电子房价牌'
  const productDescription = priceBoardData?.description ?? '可直连路客云系统房价，展示于门店的电子展示牌上面，一目了然'

  function openDetail() {
    setAgreed(true)
    setPurchaseMessage('')
    setPaymentOpen(false)
    setDetailOpen(true)
  }

  function submitPurchase() {
    if (!agreed) {
      setPurchaseMessage('请先阅读并同意《路客云产品服务购买协议》')
      return
    }
    if (!selectedDuration || requestError) {
      setPurchaseMessage('请选择可购买时长后再创建订单')
      return
    }
    setPurchaseMessage('')
    setPaymentOpen(true)
  }

  function retryPriceBoardRequest() {
    setPaymentOpen(false)
    setPurchaseMessage('')
    setRequestRevision((current) => current + 1)
  }

  const safeRequestError = requestError
    .replace(/（traceId: [^）]+）/g, '')
    .replace(/\/[A-Za-z0-9/?=&._-]+/g, '数据服务')
    .replace(/真实接口/g, '数据')
    .replace(/接口/g, '数据')
    .replace(/mock/gi, '')
    .replace(/provider/gi, '')
    .replace(/阻塞/g, '失败')
    .replace(/\s+/g, ' ')
    .trim() || '数据加载失败，请稍后重试'
  const requestStatus = (
    <div
      className={`price-board-request-status${requestError ? ' is-error' : ''}`}
      role="status"
      aria-label="电子房价牌数据接入状态"
      data-provider={priceBoardData?.provider ?? ''}
      data-source-label={priceBoardData?.sourceLabel ?? ''}
      data-response-state={priceBoardData?.responseState ?? (requestError ? 'error' : 'loading')}
      data-trace-id={priceBoardData?.traceId ?? ''}
      data-timestamp={priceBoardData?.timestamp ?? ''}
    >
      {requestError ? (
        <>
          <strong>数据加载失败</strong>
          <span>{safeRequestError}</span>
          <button type="button" onClick={retryPriceBoardRequest}>重试数据服务</button>
        </>
      ) : (
        <>
          <strong>{isLoading ? '正在加载商品信息' : priceBoardData?.responseState === 'empty' ? '暂无可购买商品' : '商品信息已更新'}</strong>
          <span>{priceBoardData ? `门店：${priceBoardData.campName}；可选时长：${priceBoardData.durationOptions.length} 项` : '正在读取当前门店商品配置'}</span>
          {priceBoardData ? <em>门店：{priceBoardData.campName}；商品总数：{priceBoardData.totalProductCount}</em> : null}
        </>
      )}
    </div>
  )

  if (detailOpen) {
    return (
      <div className="page-stack price-board-page price-board-detail-page">
        {requestStatus}
        <div className="price-board-subscribe-layout">
          <main className="price-board-detail-main">
            <section className="price-board-product-card price-board-product-card--detail">
              <img src={priceBoardAssets.logo} alt="" className="price-board-logo" />
              <div>
                <h2>{productName}</h2>
                <p>{productDescription}</p>
              </div>
            </section>

            <section className="price-board-detail-card">
              <h2 className="price-board-section-title">商品详情</h2>
              <img src={priceBoardAssets.detail} alt="电子房价牌购买详情图" className="price-board-detail-image" />
            </section>
          </main>

          <aside className="price-board-purchase-panel" aria-label="购买信息">
            <h2>购买信息</h2>
            <article className="price-board-purchase-row">
              <span>商品价格</span>
              <strong>{selectedDuration ? formatPriceBoardMoney(selectedDuration.price) : '-'}</strong>
              {selectedDuration ? <em>{formatPriceBoardMoney(selectedDuration.originalPrice)} / {selectedDuration.label}</em> : null}
            </article>
            <article className="price-board-purchase-row price-board-duration-row">
              <span>购买时长</span>
              {priceBoardData?.durationOptions.map((option) => (
                <PriceBoardDurationLabel
                  key={option.id}
                  option={option}
                  selected={selectedDuration?.id === option.id}
                  onSelect={() => {
                    setSelectedDurationId(option.id)
                    setPurchaseMessage('')
                  }}
                />
              )) ?? <span className="price-board-duration-empty">暂无可选购买时长</span>}
            </article>
            <article className="price-board-purchase-row">
              <span>订单金额</span>
              <strong>{selectedDuration ? formatPriceBoardMoney(selectedDuration.price) : '-'}</strong>
              <em>明细</em>
            </article>
            <label className="price-board-agreement">
              <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
              我已阅读并同意《路客云产品服务购买协议》
            </label>
            {purchaseMessage && <div className="notice-bar">{purchaseMessage}</div>}
            <button type="button" className="price-board-buy-button" onClick={submitPurchase}>
              立即购买
            </button>
          </aside>
        </div>
        {paymentOpen ? (
          <div className="price-board-pay-modal" role="presentation">
            <div className="price-board-pay-modal__mask" />
            <section className="price-board-pay-modal__dialog" role="dialog" aria-modal="true" aria-label="微信支付">
              <button
                type="button"
                className="price-board-pay-modal__close"
                aria-label="关闭支付弹层"
                onClick={() => setPaymentOpen(false)}
              >
                ×
              </button>
              <div className="price-board-pay-modal__qr">
                <img src={priceBoardAssets.payQr} alt="微信支付二维码" />
              </div>
              <div className="price-board-pay-modal__info">
                <p>请使用微信扫码支付</p>
                <strong>{selectedDuration ? formatPriceBoardPaymentMoney(selectedDuration.price) : '-'}</strong>
                <div className="price-board-pay-modal__method">
                  <span>{priceBoardData?.paymentTypeNames[0] ?? '微信支付'}</span>
                </div>
                <div className="price-board-pay-modal__blocker">订单已创建，请在有效期内完成支付</div>
                <div className="price-board-pay-modal__countdown">
                  <span>支付时间：</span>
                  <b>00</b>
                  <em>:</em>
                  <b>14</b>
                  <em>:</em>
                  <b>58</b>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="page-stack price-board-page">
      {requestStatus}
      <section className="price-board-product-card">
        <img src={priceBoardAssets.logo} alt="" className="price-board-logo" />
        <div>
          <h2>{productName}</h2>
          <p>可直连路客云系统房价，展示于门店的电子展示牌上面，一目了然</p>
          {priceBoardData ? <span className="price-board-product-card__api-desc">{productDescription}</span> : null}
        </div>
        <button type="button" onClick={openDetail} disabled={isLoading || Boolean(requestError) || !selectedDuration}>
          去开通
        </button>
      </section>

      <section className="price-board-detail-card">
        <h2>商品详情</h2>
        <div className="price-board-promo-frame">
          {priceBoardAssets.overview.map((src, index) => (
            <img key={src} src={src} alt={`电子房价牌宣传图 ${index + 1}`} />
          ))}
        </div>
      </section>
    </div>
  )
}

function PriceBoardDurationLabel({
  option,
  selected,
  onSelect,
}: {
  option: PriceBoardDurationOption
  selected: boolean
  onSelect: () => void
}) {
  return (
    <label className={selected ? 'is-active' : ''}>
      <input
        type="radio"
        name="price-board-duration"
        aria-label={option.label}
        checked={selected}
        onChange={onSelect}
      />
      {option.label}
    </label>
  )
}

function formatPriceBoardMoney(cents: number) {
  const amount = cents / 100
  const normalized = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '')
  return `¥${normalized}`
}

function formatPriceBoardPaymentMoney(cents: number) {
  return `¥ ${(cents / 100).toFixed(2)}`
}

function OtherPriceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="other-price-select">
      <button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        {value === options[0] ? label : value}
        <span>⌄</span>
      </button>
      {open && (
        <div className="other-price-select__menu" role="listbox">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              className={option === value ? 'is-active' : ''}
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function toOtherPriceBusinessErrorMessage(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error)
  const normalized = raw
    .replace(/mock/gi, '')
    .replace(/provider/gi, '')
    .replace(/traceId:[^)）]+[)）]?/gi, '')
    .replace(/后端/g, '数据')
    .replace(/接口/g, '数据')
    .replace(/阻塞/g, '失败')
    .replace(/[（）]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized || /其他价格.*模拟失败/.test(normalized)) return '其他价格数据加载失败，请稍后重试'
  return normalized
}

function OtherPricePage() {
  const [tab, setTab] = useState<'杂费设置' | '活动设置'>('杂费设置')
  const [channel, setChannel] = useState('全部平台')
  const [room, setRoom] = useState('全部房型')
  const [otherPriceData, setOtherPriceData] = useState<OtherPriceData | null>(null)
  const [requestState, setRequestState] = useState<{ kind: 'loading' | 'success' | 'empty' | 'error'; message: string }>({
    kind: 'loading',
    message: '正在加载其他价格数据',
  })
  const [reloadToken, setReloadToken] = useState(0)
  const [operationFeedback, setOperationFeedback] = useState('')
  const [editing, setEditing] = useState<{ channel: string; column: string } | null>(null)
  const [activityEditing, setActivityEditing] = useState<{ channel: string; column: string } | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const isActivityCreate = activityEditing?.column === '新增设置'
  const isLoading = requestState.kind === 'loading'

  const selectedChannelId = useMemo(() => {
    if (channel === '全部平台') return undefined
    return otherPriceData?.channels.find((item) => item.name === channel)?.id
  }, [channel, otherPriceData?.channels])
  const selectedRoomId = useMemo(() => {
    if (room === '全部房型') return undefined
    return otherPriceData?.rooms.find((item) => item.name === room)?.id
  }, [room, otherPriceData?.rooms])

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        setRequestState({ kind: 'loading', message: '正在加载其他价格数据' })
      }
    })
    loadOtherPriceData({ channelId: selectedChannelId, roomCategoryId: selectedRoomId }, controller.signal)
      .then((data) => {
        setOtherPriceData(data)
        const totalRows = data.feeRows.reduce((sum, group) => sum + group.channels.length, 0)
        setRequestState({
          kind: totalRows > 0 ? 'success' : 'empty',
          message:
            totalRows > 0
              ? `数据已更新：${data.campName}，房型 ${data.rooms.length} 个，杂费行 ${totalRows} 条`
              : '当前筛选下暂无其他价格记录',
        })
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setOtherPriceData(null)
        setRequestState({
          kind: 'error',
          message: toOtherPriceBusinessErrorMessage(error),
        })
      })
    return () => controller.abort()
  }, [selectedChannelId, selectedRoomId, reloadToken])

  const channelOptions = ['全部平台', ...(otherPriceData?.channels.map((item) => item.name) ?? [])]
  const roomOptions = ['全部房型', ...(otherPriceData?.rooms.map((item) => item.name) ?? [])]
  const feeColumns = otherPriceData?.feeColumns ?? []
  const currentActivityColumns = otherPriceData?.activityColumns ?? []
  const filteredRows = otherPriceData?.feeRows ?? []
  const filteredActivityRows = otherPriceData?.activityRows ?? []

  const showOperationFeedback = (message: string) => {
    setOperationFeedback(message)
    setEditing(null)
    setActivityEditing(null)
  }

  function refreshOtherPriceData() {
    setReloadToken((current) => current + 1)
    setOperationFeedback('正在刷新当前筛选数据')
  }

  function resetOtherPriceFilters() {
    setChannel('全部平台')
    setRoom('全部房型')
    setReloadToken((current) => current + 1)
    setOperationFeedback('筛选条件已重置')
  }

  function exportOtherPriceData() {
    setOperationFeedback('导出任务已创建，可在消息中心查看进度')
  }

  return (
    <div className="other-price-page">
      <section className="other-price-panel">
        <div className="other-price-tabs-row">
          <div className="other-price-tabs" role="tablist" aria-label="其他价格设置类型">
            {(['杂费设置', '活动设置'] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={tab === item ? 'is-active' : ''}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="other-price-filters">
          <OtherPriceSelect label="渠道" value={channel} options={channelOptions} onChange={setChannel} />
          <OtherPriceSelect label="房型" value={room} options={roomOptions} onChange={setRoom} />
          <div className="other-price-utility-actions" aria-label="其他价格辅助操作">
            <button type="button" onClick={refreshOtherPriceData} disabled={isLoading}>
              刷新
            </button>
            <button type="button" onClick={resetOtherPriceFilters} disabled={isLoading}>
              重置
            </button>
            <button type="button" onClick={exportOtherPriceData} disabled={isLoading || !otherPriceData}>
              导出
            </button>
          </div>
        </div>

        <div
          hidden
          data-testid="other-price-service-contract"
          data-provider={otherPriceData?.provider ?? ''}
          data-source={otherPriceData?.sourceLabel ?? ''}
          data-request-summary={otherPriceData?.requestSummary.join('|') ?? ''}
          data-endpoints={otherPriceData?.endpoints.join('|') ?? ''}
        />

        {requestState.kind === 'error' ? (
          <div className="other-price-state other-price-state--error" role="alert" aria-label="其他价格数据加载失败">
            <strong>{requestState.message}</strong>
            <button type="button" onClick={refreshOtherPriceData}>
              重试
            </button>
          </div>
        ) : (
          <div className="other-price-state other-price-state--quiet" role="status" aria-label="其他价格数据状态">
            {requestState.message}
          </div>
        )}

        {operationFeedback && (
          <div className="other-price-state" role="status" aria-label="其他价格操作反馈">
            {operationFeedback}
          </div>
        )}

        {tab === '活动设置' ? (
          <div className="other-price-table other-price-table--activity" aria-label="活动设置表格">
            <div className="other-price-action-row">
              <button
                type="button"
                onClick={() => {
                  setActivityEditing({ channel: '全部渠道', column: '新增设置' })
                  setDraftValue('')
                }}
              >
                +新增设置
              </button>
            </div>
            <div className="other-price-table__head">
              <div />
              {currentActivityColumns.map((column) => (
                <div key={column}>{column}</div>
              ))}
            </div>
            {requestState.kind === 'loading' ? <div className="other-price-empty">正在加载活动配置...</div> : null}
            {filteredActivityRows.length === 0 && requestState.kind !== 'loading' ? <div className="other-price-empty">暂无活动设置数据</div> : null}
            {filteredActivityRows.map((group) => (
              <div key={group.roomType} className="other-price-group">
                <div className="other-price-room">{group.roomType}</div>
                {group.channels.map((row, rowIndex) => (
                  <div key={`${group.roomType}-${row[0]}-${rowIndex}`} className="other-price-row">
                    <div>{row[0]}</div>
                    {row.slice(1).map((cell, index) => {
                      const column = currentActivityColumns[index]
                      return (
                        <div key={`${column}-${index}`}>
                          {cell === '设置' ? (
                            <button
                              type="button"
                              className="other-price-link"
                              onClick={() => {
                                setActivityEditing({ channel: row[0], column })
                                setDraftValue('')
                              }}
                            >
                              设置
                            </button>
                          ) : (
                            <span className={cell === '暂不支持' ? 'is-disabled-value' : ''}>{cell}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="other-price-table" aria-label="杂费设置表格">
            <div className="other-price-table__head">
              <div />
              {feeColumns.map((column) => (
                <div key={column}>{column}</div>
              ))}
            </div>
            {requestState.kind === 'loading' ? <div className="other-price-empty">正在加载费用配置...</div> : null}
            {filteredRows.length === 0 && requestState.kind !== 'loading' ? <div className="other-price-empty">暂无杂费设置数据</div> : null}
            {filteredRows.map((group) => (
              <div key={group.roomType} className="other-price-group">
                <div className="other-price-room">{group.roomType}</div>
                {group.channels.map((row, rowIndex) => (
                  <div key={`${group.roomType}-${row[0]}-${rowIndex}`} className="other-price-row">
                    <div>{row[0]}</div>
                    {row.slice(1).map((cell, index) => {
                      const column = feeColumns[index]
                      return (
                        <div key={`${column}-${index}`}>
                          {cell === '设置' ? (
                            <button
                              type="button"
                              className="other-price-link"
                              onClick={() => {
                                setEditing({ channel: row[0], column })
                                setDraftValue('')
                              }}
                            >
                              设置
                            </button>
                          ) : (
                            <span>{cell}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <div className="other-price-drawer-backdrop" role="presentation">
          <section className="other-price-drawer" role="dialog" aria-modal="true" aria-label="改价">
            <header>
              <strong>改价</strong>
              <button type="button" aria-label="关闭" onClick={() => setEditing(null)}>
                ×
              </button>
            </header>
            <div className="other-price-drawer__form">
              <label>
                <span>一键改价</span>
                <div className="other-price-money-input">
                  <em>￥</em>
                  <input
                    value={draftValue}
                    placeholder="请输入价格"
                    onChange={(event) => setDraftValue(event.target.value)}
                    autoFocus
                  />
                </div>
              </label>
              <p>
                当前单元格：{editing.channel} / {editing.column}
              </p>
            </div>
            <footer>
              <button
                type="button"
                className="is-primary"
                onClick={() => showOperationFeedback(`杂费设置已保存：${editing.channel} / ${editing.column}`)}
              >
                保存
              </button>
              <button type="button" onClick={() => setEditing(null)}>
                取消
              </button>
            </footer>
          </section>
        </div>
      )}
      {activityEditing && (
        <div className="other-price-drawer-backdrop" role="presentation">
          <section className="other-price-drawer" role="dialog" aria-modal="true" aria-label={isActivityCreate ? '活动设置' : '改折扣'}>
            <header>
              <strong>{isActivityCreate ? '活动设置' : '改折扣'}</strong>
              <button type="button" aria-label="关闭" onClick={() => setActivityEditing(null)}>
                ×
              </button>
            </header>
            {isActivityCreate ? (
              <div className="other-price-drawer__form other-price-activity-create">
                <strong>设置连住天数</strong>
                <p>有哪些时段，您希望特别调整价格？</p>
                <p>标注*者所有平台都支持，建议使用</p>
                <button type="button" onClick={() => setOperationFeedback('连住活动时段已添加')}>
                  添 加
                </button>
              </div>
            ) : (
              <div className="other-price-drawer__form other-price-discount-form">
                <p>已选1项</p>
                {['第一阶段', '第二阶段'].map((stage) => (
                  <div key={stage} className="other-price-discount-stage">
                    <strong>{stage}</strong>
                    <label>
                      <span>时间</span>
                      <input placeholder="请选择时间" />
                    </label>
                    <label>
                      <span>折扣</span>
                      <input
                        value={stage === '第一阶段' ? draftValue : ''}
                        placeholder="示例：输入9.0即打9折"
                        onChange={(event) => stage === '第一阶段' && setDraftValue(event.target.value)}
                        autoFocus={stage === '第一阶段'}
                      />
                    </label>
                  </div>
                ))}
              </div>
            )}
            <footer>
              <button
                type="button"
                className="is-primary"
                onClick={() => showOperationFeedback(isActivityCreate ? '活动设置已保存' : '活动折扣已保存')}
              >
                保存
              </button>
              <button type="button" onClick={() => setActivityEditing(null)}>
                取消
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  )
}

export function PricePage() {
  const location = useLocation()
  const active = useMemo(() => {
    if (location.pathname.includes('channelPrice')) return '渠道RP价'
    if (location.pathname.includes('priceComparison')) return '竞争圈比价'
    if (location.pathname.includes('retailPrice')) return '门市价'
    if (location.pathname.includes('otherPrice')) return '其他价格'
    if (location.pathname.includes('priceBoard')) return '电子房价牌'
    return '中央价'
  }, [location.pathname])

  if (active === '电子房价牌') return <PriceBoardPage />
  if (active === '竞争圈比价') return <PriceComparisonPage />
  if (active === '门市价') return <RetailPricePage />
  if (active === '其他价格') return <OtherPricePage />
  return <RegularPricePage active={active} />
}
