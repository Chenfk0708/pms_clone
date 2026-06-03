import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  informationFlowItems,
  informationRadarMetrics,
  informationSummaryTags,
} from '../data/discovery'
import { CompanyInfoPage } from './CompanyInfoPage'
import './InformationOverviewPage.css'

const flowIconGroups: Record<string, Array<{ label: string; tone: string }>> = {
  OTA流量: [
    { label: '途', tone: 'orange' },
    { label: '美团', tone: 'gold' },
    { label: '猪', tone: 'pink' },
    { label: '携', tone: 'blue' },
    { label: '美团', tone: 'yellow' },
    { label: '飞', tone: 'rainbow' },
    { label: '木鸟', tone: 'red' },
    { label: '爱彼', tone: 'gray' },
    { label: 'B.', tone: 'muted' },
    { label: 'T', tone: 'muted-dark' },
    { label: 'C', tone: 'muted' },
    { label: '觅', tone: 'muted' },
  ],
  社媒流量: [
    { label: '小红书', tone: 'muted' },
    { label: '抖', tone: 'muted-dark' },
    { label: '视频号', tone: 'muted-light' },
  ],
  私域流量: [{ label: '企微', tone: 'green' }],
}

const storeOptions = [
  '天落会舍公寓(前海壹方城宝安中心店)',
  '天落会舍公寓(科技园店)',
  '天落会舍公寓(会展中心店)',
]

const channelTabs = [
  { id: 'ctrip', label: '携程酒店' },
  { id: 'meituan', label: '美团民宿' },
] as const

type ImportMenuMode = 'store' | 'room' | null
type ChannelTab = (typeof channelTabs)[number]['id']

function buildRadarPoints(values: number[]) {
  const center = 120
  const radius = 88

  return values
    .map((value, index) => {
      const angle = (-90 + index * 72) * (Math.PI / 180)
      const currentRadius = (radius * value) / 100
      const x = center + Math.cos(angle) * currentRadius
      const y = center + Math.sin(angle) * currentRadius
      return `${x},${y}`
    })
    .join(' ')
}

export function InformationOverviewPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const [selectedStore, setSelectedStore] = useState(storeOptions[0])
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false)
  const [importMenuOpen, setImportMenuOpen] = useState(false)
  const [importDialogMode, setImportDialogMode] = useState<ImportMenuMode>(null)

  if (location.pathname === '/InformationMaintenance/companyInfo') {
    return <CompanyInfoPage />
  }

  const radarPoints = buildRadarPoints(informationRadarMetrics.map((item) => item.value))

  return (
    <div
      className="settings-page information-overview-page"
      onClick={() => {
        setStoreDropdownOpen(false)
        setImportMenuOpen(false)
      }}
    >
      <div className="information-overview-main">
        <section className="settings-summary">
          <div className="settings-summary__main">
            <div className="settings-summary__row">
              <span className="settings-summary__label">门店:</span>
              <div className="settings-store-select-wrap" onClick={(event) => event.stopPropagation()}>
                <button
                  type="button"
                  className="settings-store-select"
                  aria-haspopup="listbox"
                  aria-expanded={storeDropdownOpen}
                  aria-label="当前门店"
                  onClick={() => setStoreDropdownOpen((current) => !current)}
                >
                  <span className="settings-store-select__text">{selectedStore}</span>
                  <span aria-hidden="true">▽</span>
                </button>
                {storeDropdownOpen ? (
                  <div className="settings-store-select__dropdown" role="listbox" aria-label="门店列表">
                    {storeOptions.map((store) => (
                      <button
                        key={store}
                        type="button"
                        role="option"
                        aria-selected={selectedStore === store}
                        className={selectedStore === store ? 'is-selected' : ''}
                        onClick={() => {
                          setSelectedStore(store)
                          setStoreDropdownOpen(false)
                        }}
                      >
                        {store}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              <span className="summary-chip summary-chip--outline">数字化能力</span>
              {informationSummaryTags.map((tag) => (
                <span key={tag.label} className={`summary-chip summary-chip--${tag.tone ?? 'blue'}`}>
                  {tag.label}
                </span>
              ))}
              <button
                type="button"
                className="settings-summary__status"
                onClick={() => navigate('/InformationMaintenance/campInfo')}
              >
                <i aria-hidden="true" />
                已上架 | 修改 &gt;
              </button>
            </div>
            <div className="settings-summary__meta">
              <span>● 地址: 深圳宝安区新安街道海裕社区N15幸福海岸花园10栋10楼 中国</span>
              <span>☎ 联系电话: +86-18123941382</span>
            </div>
          </div>
        </section>

        <section className="settings-panel information-overview-store">
          <div className="settings-panel__header">
            <div className="settings-panel__title">
              <h2>门店信息</h2>
              <span>信息完善度</span>
              <em>中等</em>
            </div>
            <div className="information-overview-action-menu" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                aria-expanded={importMenuOpen}
                aria-haspopup="menu"
                onClick={() => setImportMenuOpen((current) => !current)}
              >
                一键导入
              </button>
              {importMenuOpen ? (
                <div className="information-overview-action-menu__dropdown" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setImportDialogMode('store')
                      setImportMenuOpen(false)
                    }}
                  >
                    完善门店信息
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setImportDialogMode('room')
                      setImportMenuOpen(false)
                    }}
                  >
                    完善房型信息
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="settings-panel__body">
            <div className="radar-panel">
              <svg viewBox="0 0 240 240" className="radar-chart" aria-hidden="true">
                <polygon points="120,32 203,92 172,188 68,188 37,92" />
                <polygon points="120,54 184,101 160,174 80,174 56,101" />
                <polygon points="120,78 165,111 148,159 92,159 75,111" />
                <polygon points="120,102 146,120 136,145 104,145 94,120" />
                <polygon points={radarPoints} className="radar-chart__shape" />
              </svg>
              <div className="radar-labels">
                {informationRadarMetrics.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </div>

            <div className="settings-copy">
              <h3>建议:</h3>
              <p>
                1. 建议补齐资质信息，全渠道通用，并可快捷提交路客云进行一键开户;
                <a href="/" onClick={(event) => event.preventDefault()}>
                  去完善
                </a>
              </p>
              <p>
                2. 完善门店详细介绍有利于用户深度了解门店服务能力;
                <a href="/" onClick={(event) => event.preventDefault()}>
                  去完善
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="settings-panel information-overview-traffic">
          <div className="settings-panel__header">
            <div className="settings-panel__title">
              <h2>门店流量</h2>
              <span>流量获取能力</span>
              <em className="is-good">较好</em>
            </div>
            <button type="button" onClick={() => navigate('/channels/ota')}>一键新增</button>
          </div>

          <div className="settings-flow">
            <div className="settings-flow__groups">
              {informationFlowItems.map((item) => (
                <div key={item.name} className="flow-row">
                  <strong>
                    {item.name}
                    <span>({item.detail})</span>
                  </strong>
                  <div className="flow-icons">
                    {(flowIconGroups[item.name] ?? []).map((icon, index) => (
                      <i key={`${item.name}-${index}`} className={`flow-icon flow-icon--${icon.tone}`}>
                        {icon.label}
                      </i>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="settings-copy">
              <h3>建议:</h3>
              <p>1. 小红书和抖音渠道暂未开通，渠道每日上亿流量，搭载图文和视频，能够快速吸引用户，促成下单;</p>
            </div>
          </div>
        </section>
      </div>

      <aside className="phone-preview" aria-label="数字化门店预览">
        <header>数字化门店</header>
        <div className="phone-preview__device">
          <div className="phone-preview__chrome">
            <span>◐◑</span>
            <span>⌕</span>
          </div>
          <div className="phone-preview__status">
            <span>银宿</span>
            <small>银宿</small>
          </div>
          <div className="phone-preview__search">
            <span>输入关键词搜索</span>
            <em>● 全国</em>
          </div>
          <div className="phone-preview__datebar">
            <div>
              <span>周三入住</span>
              <strong>09月14日</strong>
            </div>
            <small>共1晚</small>
            <div>
              <span>周四退房</span>
              <strong>09月15日</strong>
            </div>
          </div>
          <button className="phone-preview__search-button" type="button">
            搜索
          </button>
          <div className="phone-preview__section-title">
            <strong>热门套餐</strong>
            <span>查看更多 &gt;</span>
          </div>
          <div className="phone-preview__package" />
          <div className="phone-preview__section-title">
            <strong>品牌门店</strong>
            <span>查看更多 &gt;</span>
          </div>
          <article className="phone-preview__store">
            <div />
            <p>深圳宝安区新安街道海裕社区N15幸福海岸花园10栋10楼 中国</p>
            <strong>天落会舍公寓(前海壹方城宝安中心店)</strong>
            <span>¥999/晚起</span>
            <button type="button">查看详情</button>
          </article>
          <div className="phone-preview__section-title">
            <strong>精选房源</strong>
            <span>查看更多 &gt;</span>
          </div>
          <div className="phone-preview__rooms">
            {['顶层套房(浴缸巨幕电竞麻将)', '总统套间(桑拿浴缸露台电竞麻将)', '天落大床电竞套间', '观影大床房'].map((room) => (
              <article key={room}>
                <div />
                <span>2床1厅·可住4人·1卫</span>
                <strong>{room}</strong>
                <em>¥9999/晚起</em>
                <button type="button">立即预订</button>
              </article>
            ))}
          </div>
        </div>
      </aside>

      {importDialogMode ? (
        <ChannelImportDialog
          mode={importDialogMode}
          defaultStore={selectedStore}
          onClose={() => setImportDialogMode(null)}
        />
      ) : null}
    </div>
  )
}

function ChannelImportDialog({
  mode,
  defaultStore,
  onClose,
}: {
  mode: Exclude<ImportMenuMode, null>
  defaultStore: string
  onClose: () => void
}) {
  const layerRef = useRef<HTMLDivElement | null>(null)
  const [activeTab, setActiveTab] = useState<ChannelTab>('ctrip')
  const [roomType, setRoomType] = useState<'prepay' | 'cash'>('prepay')
  const [connectEnabled, setConnectEnabled] = useState(true)
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false)
  const [selectedStore, setSelectedStore] = useState(defaultStore)

  useEffect(() => {
    setSelectedStore(defaultStore)
  }, [defaultStore])

  const dialogTitle = mode === 'store' ? '完善门店信息' : '完善房型信息'

  return (
    <div
      ref={layerRef}
      className="distribution-dialog-layer information-overview-dialog-layer"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === layerRef.current) onClose()
      }}
    >
      <section
        className="distribution-import-dialog information-overview-import-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={dialogTitle}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button type="button" className="distribution-import-dialog__close" aria-label="关闭弹窗" onClick={onClose}>
          ×
        </button>

        <p className="distribution-import-dialog__intro">请选择您上线的渠道（单选），酒店渠道能导入的信息能完善~</p>

        <div className="distribution-import-dialog__channels" role="tablist" aria-label="导入渠道">
          {channelTabs
            .filter((tab) => mode === 'room' || tab.id === 'ctrip')
            .map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? 'is-active' : ''}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
        </div>

        <p className="distribution-import-dialog__desc">请授权渠道，我们将会为您自动直连并完善门店信息</p>

        {mode === 'room' && activeTab === 'meituan' ? (
          <div className="information-overview-channel-card-grid">
            <article className="information-overview-channel-card">
              <dl>
                <div>
                  <dt>账号:</dt>
                  <dd>天落会宿</dd>
                </div>
                <div>
                  <dt>账号ID:</dt>
                  <dd>1801949566888878081</dd>
                </div>
              </dl>
            </article>
            <button type="button" className="information-overview-channel-card information-overview-channel-card--action">
              <span>＋授权渠道账号</span>
            </button>
          </div>
        ) : (
          <div className="distribution-import-form information-overview-import-form">
            <label className="distribution-import-form__row">
              <span>当前门店:</span>
              <div className="distribution-import-form__field-wrap">
                <div className="distribution-import-form__select-wrap">
                  <button
                    type="button"
                    className="distribution-import-form__select"
                    aria-expanded={storeDropdownOpen}
                    onClick={() => setStoreDropdownOpen((current) => !current)}
                  >
                    <span>{selectedStore}</span>
                    <em>▽</em>
                  </button>
                  {storeDropdownOpen ? (
                    <div className="distribution-import-form__dropdown" role="listbox" aria-label="选择门店">
                      {storeOptions.map((store) => (
                        <button
                          key={store}
                          type="button"
                          role="option"
                          className={selectedStore === store ? 'is-selected' : ''}
                          onClick={() => {
                            setSelectedStore(store)
                            setStoreDropdownOpen(false)
                          }}
                        >
                          {store}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" className="distribution-import-form__link">
                  新增门店
                </button>
              </div>
            </label>

            <div className="distribution-import-form__row">
              <span>子酒店类型:</span>
              <div className="distribution-import-form__radios">
                <label>
                  <input type="radio" checked={roomType === 'prepay'} onChange={() => setRoomType('prepay')} />
                  <span>预付</span>
                </label>
                <label>
                  <input type="radio" checked={roomType === 'cash'} onChange={() => setRoomType('cash')} />
                  <span>现付</span>
                </label>
              </div>
            </div>

            <label className="distribution-import-form__row">
              <span>子酒店ID:</span>
              <div className="distribution-import-form__input-wrap">
                <input type="text" placeholder="请输入子酒店ID" />
                <button type="button" className="distribution-import-form__help" aria-label="查看帮助">
                  ?
                </button>
              </div>
            </label>

            <label className="distribution-import-form__row">
              <span>酒店名称:</span>
              <input type="text" placeholder="请确保输入与携程一致的酒店名称" />
            </label>

            <label className="distribution-import-form__checkbox">
              <input type="checkbox" checked={connectEnabled} onChange={() => setConnectEnabled((current) => !current)} />
              <span>同时完成携程直连</span>
            </label>
          </div>
        )}

        <div className="distribution-import-dialog__footer information-overview-import-dialog__footer">
          <button type="button" className="distribution-import-dialog__confirm" onClick={onClose}>
            确认
          </button>
        </div>
      </section>
    </div>
  )
}
