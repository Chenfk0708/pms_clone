import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { priceDates, priceRows } from '../data/mock'
import { fetchChannelPriceRows, type ChannelPriceRow } from '../services/channelPrice'
import { loadRetailPriceData, type RetailPriceData } from '../services/retailPrice'
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

const priceComparisonEvidence = {
  capturedAt: '真实目标站取证快照：2026-05-15 03:11:48 +08:00',
  endpoints: [
    'POST /edition/resource/get',
    'POST /comparePriceConfig/messageNotify/get',
    'POST /comparePriceConfig/roomStatus/get',
    'POST /priceAdjustConfig/get',
  ],
  blocker: '本地项目暂无已认证 PMS API 代理，无法在浏览器端安全复用目标站 cookie/token；实时接口接入记录为阻塞，未用静默 fallback 或假成功掩盖。',
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
  | { kind: 'blocked'; message: string; rows: ChannelPriceRow[] }
  | { kind: 'loading'; message: string; rows: ChannelPriceRow[] }
  | { kind: 'success'; message: string; rows: ChannelPriceRow[] }
  | { kind: 'empty'; message: string; rows: ChannelPriceRow[] }
  | { kind: 'error'; message: string; rows: ChannelPriceRow[] }

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

function formatCentralDerivedPrice(value: number) {
  if (!Number.isFinite(value)) return '-'
  return String(Math.round(value))
}

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
  const isCentral = active === '中央价'
  const isChannelRp = active === '渠道RP价'
  const selectedChannel = controlledSelectedChannel ?? localSelectedChannel

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 1600)
  }

  function updateSelectedChannel(channel: string) {
    setLocalSelectedChannel(channel)
    onChannelChange?.(channel)
  }

  function showSubmitBlocked(message: string) {
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
          <button type="button" onClick={() => showSubmitBlocked(isCentral ? '中央价同步至渠道真实提交接口未接入，已记录为阻塞' : '已发起同步至渠道')}>
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
                      showSubmitBlocked('中央价价格设置保存接口未接入，已记录为阻塞')
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
                      showSubmitBlocked(isCentral ? '中央价价格规划保存接口未接入，已记录为阻塞' : '价格规划已新增')
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
                  showSubmitBlocked(isCentral ? '中央价批量改价提交接口未接入，已记录为阻塞' : '批量改价已保存')
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
  channelRows,
  channelState,
  channelDate,
  onRetryChannelRequest,
}: {
  mode: string
  channelRows?: PriceMatrixRow[]
  channelState?: ChannelPriceRequestState
  channelDate?: string
  onRetryChannelRequest?: () => void
}) {
  const [selectedCell, setSelectedCell] = useState('')
  const [selectedDetail, setSelectedDetail] = useState<{ price: string; date: string } | null>(null)
  const [modalCell, setModalCell] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [dateOffset, setDateOffset] = useState(0)
  const isChannelRp = mode === '渠道RP价'
  const isCentral = mode === '中央价'

  const centralRows: PriceMatrixRow[] = ['途家', '小猪', '携程', '美团酒店', '飞猪淘酒店', '路客云聚合', '木鸟'].map((channel) => {
    const source = priceRows.find((row) => row.channel === channel)
    return source ?? { channel, coefficient: '-', basePrice: '-', prices: ['-'], comparePrices: ['-'] }
  })
  const rows: PriceMatrixRow[] =
    isChannelRp
      ? (channelRows ?? channelRpRows)
      : isCentral
        ? centralRows
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
  const visibleDates = isCentral || isChannelRp ? makePriceDates(dateOffset, calendarStartDay) : priceDates.map((item) => ({ ...item, label: item.date, key: item.date }))
  const gridTemplateColumns = `${mode === '中央价' || isChannelRp ? '170px' : '150px'} 76px 76px repeat(${visibleDates.length}, 88px)`
  const minWidth = 322 + visibleDates.length * 88
  const formatDateLabel = (key: string) => key.slice(5).replace('-', '.')
  const centralRoomGroups = roomTypes.slice(0, 3)

  function withRoomPrices(row: PriceMatrixRow, room: (typeof roomTypes)[number], roomIndex: number): PriceMatrixRow {
    const weekendBump = roomIndex === 0 ? 200 : roomIndex === 1 ? 180 : 53
    const unavailableChannels = new Set(['携程', '美团酒店'])

    return {
      ...row,
      basePrice: unavailableChannels.has(row.channel) ? '-' : String(room.base),
      prices: visibleDates.map((item) => {
        if (unavailableChannels.has(row.channel)) return '-'
        return String(room.base + (['六', '日'].includes(item.weekday) ? weekendBump : 0))
      }),
      comparePrices: visibleDates.map((item) => {
        if (unavailableChannels.has(row.channel) || row.channel === '路客云聚合') return '-'
        const price = room.base + (['六', '日'].includes(item.weekday) ? weekendBump : 0)
        if (row.channel === '途家') return formatCentralDerivedPrice(price * 1.05263)
        if (row.channel === '木鸟') return formatCentralDerivedPrice(price * 1.11111)
        return String(price)
      }),
    }
  }

  function renderCentralGroupRow(room: (typeof roomTypes)[number], roomIndex: number) {
    const weekendBump = roomIndex === 0 ? 200 : roomIndex === 1 ? 180 : 53

    return (
      <div key={`${room.name}-summary`} className="price-grid__row price-grid__group-row" style={{ gridTemplateColumns, minWidth }}>
        <div className="price-room-header price-room-header--group">
          <strong>{room.name}</strong>
          <span>{room.stock}</span>
        </div>
        <div>
          <span className="price-coeff-badge price-coeff-badge--central">中</span>
        </div>
        <div>{room.base}</div>
        {visibleDates.map((dateItem, index) => {
          const price = String(room.base + (['六', '日'].includes(dateItem.weekday) ? weekendBump : 0))
          const stock = roomIndex === 0 && index === 0 ? '余0' : '余1'
          const dateLabel = 'dateLabel' in dateItem ? dateItem.dateLabel : formatDateLabel(dateItem.key)
          const key = `${room.name}-summary-${dateItem.key}`

          return (
            <button
              key={key}
              type="button"
              className={`price-cell price-cell-button price-cell-button--summary ${selectedCell === key ? 'is-selected' : ''}`}
              aria-label={`${price} ${dateLabel}`}
              onClick={() => {
                setSelectedCell(key)
                setSelectedDetail({ price, date: dateLabel })
                setModalCell(`${room.name} / ${dateLabel}`)
              }}
            >
              <strong>{price}</strong>
              <span>{stock}</span>
            </button>
          )
        })}
      </div>
    )
  }

  function renderPriceRow(row: PriceMatrixRow, keyPrefix = '') {
    const product = 'product' in row && typeof row.product === 'string' ? row.product : ''

    return (
      <div key={`${keyPrefix}${row.channel}`} className="price-grid__row" style={{ gridTemplateColumns, minWidth }}>
        <div className="price-room-header">
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

  return (
    <>
      {isChannelRp && channelState?.kind === 'blocked' ? (
        <section className="price-request-state price-request-state--error" role="alert">
          <strong>真实请求阻塞</strong>
          <span>{channelState.message}</span>
        </section>
      ) : null}
      {isChannelRp && channelState?.kind === 'loading' ? (
        <section className="price-request-state" role="status" aria-label="渠道RP价加载状态">
          正在请求真实渠道RP价数据...
        </section>
      ) : null}
      {isChannelRp && channelState?.kind === 'error' ? (
        <section className="price-request-state price-request-state--error" role="alert">
          <strong>真实接口请求失败</strong>
          <span>{channelState.message}</span>
          <button type="button" onClick={onRetryChannelRequest}>
            重试真实请求
          </button>
        </section>
      ) : null}
      {isChannelRp && channelState?.kind === 'empty' ? (
        <section className="price-request-state" role="status" aria-label="渠道RP价空态">
          真实接口返回空数据，请检查当前筛选条件或后端权限。
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

        <div className="price-grid">
          <div className="price-grid__head" style={{ gridTemplateColumns, minWidth }}>
            <div>
              {isCentral ? (
                <button type="button" className="price-grid__collapse-button" onClick={() => setCollapsed((value) => !value)}>
                  <strong>2026.05.{String(calendarStartDay + dateOffset).padStart(2, '0')}</strong>
                  <span>{collapsed ? '全部展开' : '全部收起'}</span>
                </button>
              ) : isChannelRp ? (
                '全部收起'
              ) : (
                '房型'
              )}
            </div>
            <div>{isChannelRp ? '产品系数' : isCentral ? '渠道系数' : '系数'}</div>
            <div>{isChannelRp ? '基础价' : isCentral ? '基础价' : '底价'}</div>
            {visibleDates.map((item) => (
              <div key={`${item.key}-${item.weekday}`} className={['六', '日'].includes(item.weekday) ? 'is-weekend' : ''}>
                <strong>{item.label}</strong>
                <span>{item.weekday}</span>
              </div>
            ))}
          </div>
          {!collapsed && isCentral
            ? centralRoomGroups.map((room, roomIndex) => (
                <div key={room.name} className="price-grid__section">
                  {renderCentralGroupRow(room, roomIndex)}
                  {rows.map((row) => renderPriceRow(withRoomPrices(row, room, roomIndex), `${room.name}-`))}
                </div>
              ))
            : null}
          {!collapsed && !isCentral && channelState?.kind !== 'blocked' && channelState?.kind !== 'error' && channelState?.kind !== 'empty'
            ? rows.map((row) => renderPriceRow(row))
            : null}
        </div>
      </section>

      {selectedDetail && (
        <div className="price-toast">
          <span>已选价格：{selectedDetail.price}</span>
          <span>日期：{selectedDetail.date}</span>
        </div>
      )}
      {modalCell && (
        <div
          className={isChannelRp ? 'price-floating-editor' : 'price-modal-backdrop'}
          role={isChannelRp ? 'dialog' : undefined}
          aria-modal={isChannelRp ? 'false' : undefined}
          aria-label={isChannelRp ? '改价' : undefined}
        >
          <section className="price-modal">
            <header>
              <div>
                <p>价格调整</p>
                <h2>{modalCell}</h2>
              </div>
              <button type="button" aria-label={isChannelRp ? '关闭改价' : '关闭'} onClick={() => setModalCell(null)}>
                ×
              </button>
            </header>
            <div className="price-modal__form">
              {isChannelRp ? <strong>已选1项</strong> : null}
              <label>
                调整类型
                <select defaultValue="fixed">
                  <option value="fixed">固定价格</option>
                  <option value="increase">上调金额</option>
                  {isChannelRp ? <option value="percent">按百分比</option> : null}
                </select>
              </label>
              <label>
                新价格
                <input type="text" defaultValue={selectedDetail?.price ?? '730'} />
              </label>
              {isChannelRp ? <span>百分比改价</span> : null}
            </div>
            <footer>
              <button type="button" onClick={() => setModalCell(null)}>
                取消
              </button>
              <button type="button" onClick={() => setModalCell(null)}>
                确定
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
  const isCentral = active === '中央价'
  const isChannelRp = active === '渠道RP价'
  const [selectedChannel, setSelectedChannel] = useState('渠道')
  const [reloadKey, setReloadKey] = useState(0)
  const [channelRequestState, setChannelRequestState] = useState<ChannelPriceRequestState>({
    kind: 'loading',
    message: '等待请求真实渠道RP价数据',
    rows: [],
  })
  const campId = useMemo(() => new URLSearchParams(location.search).get('campId') ?? '', [location.search])
  const channelDate = useMemo(() => currentBusinessDate(), [])

  useEffect(() => {
    if (!isChannelRp) return

    if (!campId) {
      setChannelRequestState({
        kind: 'blocked',
        message: '缺少 campId，无法构造目标站真实价格请求。请从带 campId 的项目入口进入，或接入项目全局门店上下文。',
        rows: [],
      })
      return
    }

    const controller = new AbortController()
    setChannelRequestState((current) => ({
      kind: 'loading',
      message: '正在请求真实渠道RP价数据',
      rows: current.rows,
    }))

    fetchChannelPriceRows(
      {
        campId,
        channel: selectedChannel,
        date: channelDate,
      },
      controller.signal,
    )
      .then((rows) => {
        setChannelRequestState({
          kind: rows.length > 0 ? 'success' : 'empty',
          message: rows.length > 0 ? '真实渠道RP价数据已返回' : '真实接口返回空数据',
          rows,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setChannelRequestState({
          kind: 'error',
          message: error instanceof Error ? error.message : String(error),
          rows: [],
        })
      })

    return () => controller.abort()
  }, [campId, channelDate, isChannelRp, reloadKey, selectedChannel])

  return (
    <div className={`page-stack price-page${isCentral ? ' price-page--central' : ''}`}>
      <SharedToolbar active={active} selectedChannel={selectedChannel} onChannelChange={setSelectedChannel} />
      <PriceMatrix
        mode={active}
        channelRows={channelRequestState.rows}
        channelState={isChannelRp ? channelRequestState : undefined}
        channelDate={channelDate}
        onRetryChannelRequest={() => setReloadKey((value) => value + 1)}
      />
    </div>
  )
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

function RetailEmptyState({ onSetup }: { onSetup: () => void }) {
  return (
    <section className="retail-empty-state" aria-label="门市价未设置">
      <div className="retail-empty-illustration" aria-hidden="true">
        <div />
      </div>
      <p>请先完成门市价设置</p>
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
  const requestedAt = retailData ? new Date(retailData.requestedAt).toLocaleTimeString('zh-CN', { hour12: false }) : ''
  const roomOptions = retailData?.rooms ?? []
  const stores = retailData?.stores ?? []
  const needsSetup = retailData?.salePriceSetting.isInitPriceDisplay === 1

  useEffect(() => {
    const controller = new AbortController()

    loadRetailPriceData({ keyword: queryKeyword }, controller.signal)
      .then((data) => {
        setRetailData(data)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setRequestError(error instanceof Error ? error.message : '真实接口请求失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [queryKeyword, requestRevision])

  function beginRetailRequest() {
    setIsLoading(true)
    setRequestError('')
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    beginRetailRequest()
    setQueryKeyword(keyword.trim())
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
          </div>
        </div>
        <div className={`retail-request-status${requestError ? ' is-error' : ''}`} role="status">
          {requestError ? (
            <>
              <strong>真实接口阻塞</strong>
              <span>{requestError}</span>
              <button
                type="button"
                onClick={() => {
                  beginRetailRequest()
                  setRequestRevision((current) => current + 1)
                }}
              >
                重试真实请求
              </button>
            </>
          ) : (
            <>
              <strong>{isLoading ? '正在连接真实请求层' : '已连接真实请求层'}</strong>
              <span>
                {retailData
                  ? `真实接口：门店 ${stores.length} 个，房型 ${roomOptions.length} 个，${needsSetup ? '当前需完成门市价设置' : '门市价配置已返回'}`
                  : '等待真实接口返回'}
              </span>
              {requestedAt ? <em>刷新于 {requestedAt}</em> : null}
            </>
          )}
        </div>
        <div className="retail-filter-row">
          <button type="button" className="retail-store-chip is-active">
            全部门店
          </button>
          <button type="button" className="retail-store-chip retail-store-chip--wide">
            {stores[0]?.poiName ?? '天落会宿公寓(前海壹方城宝安中心店)'}
          </button>
          <button type="button" className="retail-gear-button" aria-label="门店设置">
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
                  <button key={item.roomCategoryId} type="button" role="option" onClick={() => setFilterOpen(null)}>
                    {item.roomCategoryId}
                    <span>{item.roomCategoryName}</span>
                  </button>
                ))
                : <span className="retail-filter-empty">{isLoading ? '加载房型中' : '暂无房型数据'}</span>
              : <span className="retail-filter-empty">暂无数据</span>}
          </div>
        ) : null}
        <RetailEmptyState onSetup={() => setDrawer('retail')} />
      </section>
      {drawer ? <RetailSettingDrawer type={drawer} onClose={() => setDrawer(null)} /> : null}
    </div>
  )
}

function PriceComparisonPage() {
  const navigate = useNavigate()

  return (
    <div className="page-stack price-comparison-page">
      <SharedToolbar active="竞争圈比价" />

      <section className="price-comparison-empty">
        <div className="price-comparison-empty__copy">
          <h2>开通【智能调价】应用，使用【竞争圈比价】功能</h2>
          <p>可设置门店的竞争圈酒店和比价时间，我们将为您自动生成竞争圈价格对比结果，帮助您快速确定价格优势，高效调价</p>
          <div className="price-comparison-evidence" role="status" aria-label="竞争圈比价数据接入状态">
            <strong>{priceComparisonEvidence.capturedAt}</strong>
            <span>{priceComparisonEvidence.endpoints.join('；')}</span>
            <em>{priceComparisonEvidence.blocker}</em>
          </div>
          <button type="button" onClick={() => navigate('/version/applicationPayment/detail?app=smartPricing')}>
            立即开通
          </button>
        </div>
      </section>
    </div>
  )
}

function PriceBoardPage() {
  const [detailOpen, setDetailOpen] = useState(false)
  const [agreed, setAgreed] = useState(true)
  const [purchaseMessage, setPurchaseMessage] = useState('')
  const [paymentOpen, setPaymentOpen] = useState(false)

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
    setPurchaseMessage('')
    setPaymentOpen(true)
  }

  if (detailOpen) {
    return (
      <div className="page-stack price-board-page price-board-detail-page">
        <div className="price-board-subscribe-layout">
          <main className="price-board-detail-main">
            <section className="price-board-product-card price-board-product-card--detail">
              <img src={priceBoardAssets.logo} alt="" className="price-board-logo" />
              <div>
                <h2>电子房价牌</h2>
                <p>用于外接前台大屏，可实时展示当前房型价格，支持门市价、会员价，联动路客云改价，可实时更新</p>
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
              <strong>¥150.9</strong>
              <em>¥75,450 / 年</em>
            </article>
            <article className="price-board-purchase-row price-board-duration-row">
              <span>购买时长</span>
              <label className="is-active">
                <input type="radio" name="price-board-duration" defaultChecked />
                跟随版本2027-09-28到期
              </label>
              <label>
                <input type="radio" name="price-board-duration" />
                跟随版本2027-09-28到期
              </label>
            </article>
            <article className="price-board-purchase-row">
              <span>订单金额</span>
              <strong>¥150.9</strong>
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
                <strong>¥ 150.90</strong>
                <div className="price-board-pay-modal__method">
                  <span>微信支付</span>
                </div>
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
      <section className="price-board-product-card">
        <img src={priceBoardAssets.logo} alt="" className="price-board-logo" />
        <div>
          <h2>电子房价牌</h2>
          <p>可直连路客云系统房价，展示于门店的电子展示牌上面，一目了然</p>
        </div>
        <button type="button" onClick={openDetail}>
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

const otherPriceColumns = ['押金', '可加客人数', '加人费(每人)', '餐食数量', '佣金率(%)']
const activityColumns = [
  '连住2天以上',
  '连住3天以上',
  '连住4天以上',
  '连住5天以上',
  '连住7天以上',
  '连住30天以上',
  '连住35天以上',
  '甩卖第一阶段',
  '甩卖第二阶段',
]

const feeRow = (channel: string, commissionRate = '设置') => [channel, '设置', '设置', '设置', '设置', commissionRate]
const unsupportedActivityRow = (channel: string) => [channel, ...activityColumns.map(() => '暂不支持')]
const originalActivityRow = (channel: string) => [
  channel,
  '原价',
  '原价',
  '原价',
  '原价',
  '原价',
  '原价',
  '暂不支持',
  '设置',
  '设置',
]

const otherPriceRows = [
  {
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    channels: [
      feeRow('途家'),
      feeRow('途家'),
      feeRow('小猪'),
      feeRow('小猪'),
      feeRow('携程', '12'),
      feeRow('美团酒店', '15'),
      feeRow('飞猪淘酒店'),
      feeRow('路客云聚合'),
      feeRow('路客云聚合'),
      feeRow('木鸟'),
    ],
  },
  {
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    channels: [
      feeRow('途家'),
      feeRow('小猪'),
      feeRow('携程', '12'),
      feeRow('美团酒店', '15'),
      feeRow('飞猪淘酒店'),
      feeRow('路客云聚合'),
      feeRow('路客云聚合'),
      feeRow('木鸟'),
    ],
  },
  {
    roomType: '天落大床电竞套间',
    channels: [
      feeRow('小猪'),
      feeRow('携程', '12'),
      feeRow('美团酒店', '15'),
      feeRow('飞猪淘酒店'),
      feeRow('路客云聚合'),
      feeRow('路客云聚合'),
      feeRow('木鸟'),
    ],
  },
  {
    roomType: '观影大床房',
    channels: [
      feeRow('途家'),
      feeRow('美团民宿'),
      feeRow('携程', '12'),
      feeRow('美团酒店', '15'),
      feeRow('飞猪淘酒店'),
      feeRow('路客云聚合'),
      feeRow('路客云聚合'),
      feeRow('木鸟'),
    ],
  },
]

const otherPriceChannels = ['全部平台', '携程', '美团酒店', '飞猪淘酒店', '美团民宿', '途家', '木鸟', '小猪', '路客云聚合']
const otherPriceRooms = ['全部房型', ...otherPriceRows.map((item) => item.roomType)]

const activityRows = [
  {
    roomType: '顶层套房（浴缸巨幕电竞麻将）',
    channels: [
      ['途家', '9.5折', '原价', '8.5折', '原价', '8折', '7.5折', '暂不支持', '14:00开始 9.5折', '15:00开始 9.1折'],
      originalActivityRow('途家'),
      unsupportedActivityRow('小猪'),
      unsupportedActivityRow('小猪'),
      unsupportedActivityRow('携程'),
      unsupportedActivityRow('美团酒店'),
      unsupportedActivityRow('飞猪淘酒店'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('木鸟'),
    ],
  },
  {
    roomType: '总裁套间（桑拿浴缸露台电竞麻将）',
    channels: [
      originalActivityRow('途家'),
      unsupportedActivityRow('小猪'),
      unsupportedActivityRow('携程'),
      unsupportedActivityRow('美团酒店'),
      unsupportedActivityRow('飞猪淘酒店'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('木鸟'),
    ],
  },
  {
    roomType: '天落大床电竞套间',
    channels: [
      unsupportedActivityRow('小猪'),
      unsupportedActivityRow('携程'),
      unsupportedActivityRow('美团酒店'),
      unsupportedActivityRow('飞猪淘酒店'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('木鸟'),
    ],
  },
  {
    roomType: '观影大床房',
    channels: [
      originalActivityRow('途家'),
      unsupportedActivityRow('美团民宿'),
      unsupportedActivityRow('携程'),
      unsupportedActivityRow('美团酒店'),
      unsupportedActivityRow('飞猪淘酒店'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('路客云聚合'),
      unsupportedActivityRow('木鸟'),
    ],
  },
]

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

function OtherPricePage() {
  const [tab, setTab] = useState<'杂费设置' | '活动设置'>('杂费设置')
  const [channel, setChannel] = useState(otherPriceChannels[0])
  const [room, setRoom] = useState(otherPriceRooms[0])
  const [editing, setEditing] = useState<{ channel: string; column: string } | null>(null)
  const [activityEditing, setActivityEditing] = useState<{ channel: string; column: string } | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const isActivityCreate = activityEditing?.column === '新增设置'

  const filteredRows = otherPriceRows
    .filter((group) => room === otherPriceRooms[0] || group.roomType === room)
    .map((group) => ({
      ...group,
      channels: group.channels.filter((row) => channel === otherPriceChannels[0] || row[0] === channel),
    }))
    .filter((group) => group.channels.length > 0)

  const filteredActivityRows = activityRows
    .filter((group) => room === otherPriceRooms[0] || group.roomType === room)
    .map((group) => ({
      ...group,
      channels: group.channels.filter((row) => channel === otherPriceChannels[0] || row[0] === channel),
    }))
    .filter((group) => group.channels.length > 0)
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
          <OtherPriceSelect label="渠道" value={channel} options={otherPriceChannels} onChange={setChannel} />
          <OtherPriceSelect label="房型" value={room} options={otherPriceRooms} onChange={setRoom} />
        </div>

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
              {activityColumns.map((column) => (
                <div key={column}>{column}</div>
              ))}
            </div>
            {filteredActivityRows.map((group) => (
              <div key={group.roomType} className="other-price-group">
                <div className="other-price-room">{group.roomType}</div>
                {group.channels.map((row, rowIndex) => (
                  <div key={`${group.roomType}-${row[0]}-${rowIndex}`} className="other-price-row">
                    <div>{row[0]}</div>
                    {row.slice(1).map((cell, index) => {
                      const column = activityColumns[index]
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
              {otherPriceColumns.map((column) => (
                <div key={column}>{column}</div>
              ))}
            </div>
            {filteredRows.map((group) => (
              <div key={group.roomType} className="other-price-group">
                <div className="other-price-room">{group.roomType}</div>
                {group.channels.map((row, rowIndex) => (
                  <div key={`${group.roomType}-${row[0]}-${rowIndex}`} className="other-price-row">
                    <div>{row[0]}</div>
                    {row.slice(1).map((cell, index) => {
                      const column = otherPriceColumns[index]
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
              <button type="button" className="is-primary" onClick={() => setEditing(null)}>
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
                <button type="button">添 加</button>
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
              <button type="button" className="is-primary" onClick={() => setActivityEditing(null)}>
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
