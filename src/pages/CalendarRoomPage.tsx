import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchCalendarRoomProducts,
  type CalendarRoomChannelBadge,
  type CalendarRoomProduct,
  type CalendarRoomQuery,
  type CalendarRoomRow,
  type CalendarRoomViewModel,
} from '../services/calendarRoom'
import { StoreSelectControl } from '../components/StoreSelect'
import { useStoreOptions } from '../hooks/useStoreOptions'
import './CalendarRoomPage.css'

type FilterKey = 'channel' | 'status'
type OpenMenuKey = FilterKey
type DialogState =
  | { type: 'detail'; product: CalendarRoomProduct }
  | { type: 'price'; product: CalendarRoomProduct }
  | { type: 'status'; product: CalendarRoomProduct }
  | null

const DEFAULT_QUERY: CalendarRoomQuery = {
  storeId: 'all',
  keyword: '',
  channel: '',
  status: '全部',
  page: 1,
  pageSize: 20,
}
const EDIT_CHANNEL_TABS = ['微信小程序', '小红书', '抖音来客', '自助机', '同程民宿', '途家民宿', '美团民宿', '小猪民宿', '木鸟民宿', '路客云聚合']
const DISABLED_EDIT_CHANNELS = new Set(['同程民宿', '途家民宿', '美团民宿', '小猪民宿', '木鸟民宿', '路客云聚合'])
const CHANNEL_ROOM_EMPTY_CHANNELS = new Set(['小红书', '抖音来客', '自助机'])
const MINI_PROGRAM_CHANNELS = new Set(['微信小程序', '小红书'])
const KIOSK_CHANNELS = new Set(['自助机'])
const CHANNEL_ROOM_GROUPS = [
  { id: 'all', name: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { id: 'king', name: '天荟大床电竞套间' },
  { id: 'cinema', name: '观影大床房' },
]

type ChannelRoomGroup = (typeof CHANNEL_ROOM_GROUPS)[number]

export function CalendarRoomPage() {
  const location = useLocation()

  if (location.pathname.endsWith('/channelGoodsSetting')) {
    return <CalendarRoomEditPage />
  }

  return <CalendarRoomListPage />
}

function CalendarRoomListPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const locationQuery = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const provider = params.get('calendarRoomProvider')
    const mockState = params.get('calendarRoomMockState')

    return {
      provider: provider === 'real' || provider === 'mock' ? provider : undefined,
      mockState: mockState === 'success' || mockState === 'empty' || mockState === 'error' ? mockState : undefined,
    } satisfies Pick<CalendarRoomQuery, 'provider' | 'mockState'>
  }, [location.search])
  const [openFilter, setOpenFilter] = useState<OpenMenuKey | null>(null)
  const [query, setQuery] = useState<CalendarRoomQuery>({ ...DEFAULT_QUERY, ...locationQuery })
  const [selectedStoreId, setSelectedStoreId] = useState('all')
  const [draftKeyword, setDraftKeyword] = useState('')
  const [viewModel, setViewModel] = useState<CalendarRoomViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [notice, setNotice] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)

  useEffect(() => {
    const controller = new AbortController()

    fetchCalendarRoomProducts({ ...query, ...locationQuery }, controller.signal)
      .then((result) => {
        setViewModel(result)
        setNotice((current) => current || '')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setErrorMessage(error instanceof Error ? error.message.replace(/。real provider.*$/, '') : '日历房数据加载失败，请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query, locationQuery])

  const { storeOptions, storeLoading } = useStoreOptions({
    fallbackOptions: (viewModel?.storeOptions ?? [{ id: 'all', name: '全部门店' }]).map((store) => ({
      id: store.id,
      label: store.name,
    })),
  })

  function applyFilter(key: FilterKey, value: string) {
    setIsLoading(true)
    setErrorMessage('')
    setQuery((current) => ({ ...current, [key]: value, page: 1 }))
    setOpenFilter(null)
  }

  function applyStore(storeId: string) {
    setSelectedStoreId(storeId)
    setIsLoading(true)
    setErrorMessage('')
    setQuery((current) => ({ ...current, storeId, page: 1 }))
    setOpenFilter(null)
  }

  function submitSearch() {
    setIsLoading(true)
    setErrorMessage('')
    setQuery((current) => ({ ...current, keyword: draftKeyword, page: 1 }))
    setNotice('已查询日历房售卖产品')
  }

  function resetFilters() {
    setDraftKeyword('')
    setIsLoading(true)
    setErrorMessage('')
    setQuery({ ...DEFAULT_QUERY, ...locationQuery })
    setSelectedStoreId('all')
    setOpenFilter(null)
    setNotice('筛选条件已重置')
  }

  function retryLoad() {
    setIsLoading(true)
    setErrorMessage('')
    setQuery((current) => ({ ...current }))
  }

  function handleProductAction(action: CalendarRoomProduct['actions'][number], product: CalendarRoomProduct) {
    if (action === '预览') {
      setDialog({ type: 'detail', product })
      return
    }

    if (action === '编辑') {
      const target = viewModel?.routeTargets.createProduct ?? '/setting/localRoomTypeProductionSetting/channelGoodsSetting'
      const params = new URLSearchParams({
        mode: 'edit',
        channel: product.channel,
        productName: product.name,
      })
      navigate(`${target}?${params.toString()}`)
      return
    }

    if (action === '修改价格') {
      setDialog({ type: 'price', product })
      return
    }

    setDialog({ type: 'status', product })
  }

  const rows = viewModel?.rows ?? []

  return (
    <div
      className="calendar-room-page"
      data-provider={viewModel?.providerMode ?? query.provider ?? 'mock'}
      data-request-keyword={viewModel?.requestParams.keyword ?? query.keyword}
      data-request-channel={viewModel?.requestParams.channel ?? query.channel}
      data-request-status={viewModel?.requestParams.status ?? query.status}
    >
      <h1 className="sr-only-heading">日历房</h1>

      <section className="calendar-room-query" aria-label="日历房筛选">
        <div className="calendar-room-query__top">
          <StoreSelectControl
            className="calendar-room-storebar"
            label="门店切换"
            options={storeOptions.map((store) => ({ id: store.id, name: store.label }))}
            value={selectedStoreId}
            disabled={storeLoading}
            onChange={applyStore}
            settingsLabel="门店设置"
            onSettingsClick={() => navigate('/InformationMaintenance/campInfo')}
          />
          <div className="calendar-room-query__actions">
            <button type="button" onClick={() => navigate(viewModel?.routeTargets.roomTypeList ?? '/setting/roomTypeInfo')}>
              房型管理
            </button>
            <button
              type="button"
              className="is-primary"
              onClick={() => navigate(viewModel?.routeTargets.createProduct ?? '/setting/localRoomTypeProductionSetting/channelGoodsSetting')}
            >
              新增售卖产品
            </button>
          </div>
        </div>

        <div className="calendar-room-query__filters">
          <label className="calendar-room-field calendar-room-search">
            <span>搜索：</span>
            <input
              value={draftKeyword}
              placeholder="请输入房型名称"
              onChange={(event) => setDraftKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch()
              }}
            />
          </label>
          <FilterButton
            label="渠道"
            value={query.channel}
            placeholder="请选择渠道"
            options={viewModel?.channelOptions ?? []}
            isOpen={openFilter === 'channel'}
            onToggle={() => setOpenFilter(openFilter === 'channel' ? null : 'channel')}
            onChoose={(value) => applyFilter('channel', value)}
          />
          <FilterButton
            label="上架状态"
            value={query.status}
            placeholder="全部"
            options={viewModel?.statusOptions ?? []}
            isOpen={openFilter === 'status'}
            onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
            onChoose={(value) => applyFilter('status', value)}
          />
          <button type="button" className="calendar-room-expand-all" onClick={() => setIsExpanded((value) => !value)}>
            {isExpanded ? '收起' : '展开'}
          </button>
          <button type="button" className="calendar-room-reset" onClick={resetFilters}>
            重 置
          </button>
          <button type="button" className="calendar-room-search-button" onClick={submitSearch} disabled={isLoading}>
            {isLoading ? '查询中' : '搜 索'}
          </button>
        </div>
      </section>

      {errorMessage ? (
        <div className="calendar-room-alert" role="alert" aria-label="日历房数据错误">
          <span>日历房数据加载失败，请稍后重试</span>
          <button type="button" onClick={retryLoad}>
            重试
          </button>
        </div>
      ) : null}

      <section className={`calendar-room-table${isLoading ? ' is-loading' : ''}`} aria-label="日历房售卖产品列表">
        <div className="calendar-room-table__head">
          {['展开', '房型名称', '关联渠道', '产品数量', '操作'].map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        {rows.length > 0 ? (
          rows.map((room) => (
            <RoomRow
              key={room.id}
              room={room}
              isExpanded={isExpanded}
              onToggle={() => setIsExpanded((value) => !value)}
              onProductAction={handleProductAction}
              onNavigateRoomType={() => navigate(viewModel?.routeTargets.roomTypeEdit ?? '/setting/roomTypeInfo/edit')}
              onNavigatePrice={() => navigate(viewModel?.routeTargets.price ?? '/houseManage/houseCale')}
            />
          ))
        ) : (
          <div className="calendar-room-empty" role="status">
            <strong>暂无售卖产品</strong>
            <span>当前筛选条件下没有日历房售卖产品，请调整条件后重新查询。</span>
          </div>
        )}
      </section>

      <div className="calendar-room-pagination" aria-label="日历房分页">
        <span>
          第 {rows.length > 0 ? 1 : 0}-{rows.length} 条/总共 {viewModel?.pagination.total ?? 0} 条
        </span>
        <button type="button" className="is-active">
          {query.page}
        </button>
        <button type="button">{query.pageSize} 条/页</button>
      </div>

      {notice ? <div className="calendar-room-notice" role="status" aria-label="日历房操作反馈">{notice}</div> : null}

      {dialog ? (
        <CalendarRoomDialog
          dialog={dialog}
          onClose={() => setDialog(null)}
          onConfirm={(message) => {
            setDialog(null)
            setNotice(message)
          }}
        />
      ) : null}
    </div>
  )
}

function RoomRow({
  room,
  isExpanded,
  onToggle,
  onProductAction,
  onNavigateRoomType,
  onNavigatePrice,
}: {
  room: CalendarRoomRow
  isExpanded: boolean
  onToggle: () => void
  onProductAction: (action: CalendarRoomProduct['actions'][number], product: CalendarRoomProduct) => void
  onNavigateRoomType: () => void
  onNavigatePrice: () => void
}) {
  const navigate = useNavigate()

  return (
    <article className="calendar-room-table__group">
      <div className="calendar-room-table__room-row">
        <div>
          <button type="button" className="calendar-room-row-toggle" onClick={onToggle}>
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
        <div className="calendar-room-name">{room.name}</div>
        <div className="calendar-room-channels" aria-label={`${room.name}关联渠道`}>
          {room.channelBadges.map((channel, index) => (
            <button
              key={`${room.id}-${channel.id}-${index}`}
              type="button"
              className="calendar-room-channels__badge"
              style={{ zIndex: room.channelBadges.length - index }}
              onClick={() => navigate(channel.route)}
              title={channel.name}
              aria-label={`打开${channel.name}管理渠道页`}
            >
              <img
                src={channel.iconUrl}
                alt=""
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                  const fallback = event.currentTarget.nextElementSibling
                  if (fallback instanceof HTMLElement) fallback.style.display = 'inline-grid'
                }}
              />
              <span className="calendar-room-channels__fallback" aria-hidden="true">
                {channel.shortLabel}
              </span>
            </button>
          ))}
        </div>
        <div>{room.products.length}</div>
        <div className="calendar-room-actions">
          <button type="button" onClick={onNavigateRoomType}>
            编辑房型
          </button>
          <button type="button" onClick={onNavigatePrice}>
            房价管理
          </button>
        </div>
      </div>
      {isExpanded ? <ProductDetails room={room} onProductAction={onProductAction} /> : null}
    </article>
  )
}

function ProductDetails({
  room,
  onProductAction,
}: {
  room: CalendarRoomRow
  onProductAction: (action: CalendarRoomProduct['actions'][number], product: CalendarRoomProduct) => void
}) {
  return (
    <div className="calendar-room-products" aria-label={`${room.name}产品明细`}>
      {room.products.map((product) => (
        <article key={product.id} className="calendar-room-product-card">
          <div className="calendar-room-product-card__main">
            <ProductField label="产品名称：" value={product.name} />
            <ProductField label="渠道：" value={product.channel} />
            <ProductField label="早餐类型：" value={product.breakfast} />
            <ProductField label="退订政策：" value={product.refund} />
          </div>
          <div className="calendar-room-product-card__actions">
            {product.actions.map((action) => (
              <button
                key={action}
                type="button"
                className={action === '上架' ? 'is-offline-action' : action === '下架' ? 'is-danger-link' : ''}
                onClick={() => onProductAction(action, product)}
              >
                {action}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  )
}

function ProductField({ label, value }: { label: string; value: string }) {
  return (
    <div className="calendar-room-product-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FilterButton({
  label,
  value,
  placeholder,
  options,
  isOpen,
  onToggle,
  onChoose,
}: {
  label: string
  value: string
  placeholder: string
  options: string[]
  isOpen: boolean
  onToggle: () => void
  onChoose: (value: string) => void
}) {
  const displayValue = value || placeholder

  return (
    <label className="calendar-room-field calendar-room-field--select">
      <span>{label}：</span>
      <div className="calendar-room-select-wrap">
        <button
          type="button"
          className="calendar-room-select"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`${label} ${displayValue}`}
          onClick={onToggle}
        >
          {displayValue}
        </button>
        {isOpen ? (
          <div className="calendar-room-options" role="listbox" aria-label={`${label}选项`}>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onClick={() => onChoose(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  )
}

function CalendarRoomDialog({
  dialog,
  onClose,
  onConfirm,
}: {
  dialog: NonNullable<DialogState>
  onClose: () => void
  onConfirm: (message: string) => void
}) {
  if (dialog.type === 'detail') {
    return (
      <div className="calendar-room-dialog-mask" role="presentation" onMouseDown={onClose}>
        <section className="calendar-room-dialog" role="dialog" aria-modal="true" aria-label="售卖产品详情" onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <strong>售卖产品详情</strong>
            <button type="button" aria-label="关闭售卖产品详情" onClick={onClose}>×</button>
          </header>
          <dl>
            <dt>产品名称</dt>
            <dd>{dialog.product.name}</dd>
            <dt>渠道</dt>
            <dd>{dialog.product.channel}</dd>
            <dt>当前价格计划</dt>
            <dd>{dialog.product.pricePlan}</dd>
            <dt>上下架状态</dt>
            <dd>{dialog.product.status === 'online' ? '上架中' : '已下架'}</dd>
          </dl>
        </section>
      </div>
    )
  }

  if (dialog.type === 'price') {
    return (
      <div className="calendar-room-dialog-mask" role="presentation" onMouseDown={onClose}>
        <section className="calendar-room-dialog" role="dialog" aria-modal="true" aria-label="调整售卖价格" onMouseDown={(event) => event.stopPropagation()}>
          <header>
            <strong>调整售卖价格</strong>
            <button type="button" aria-label="关闭调整售卖价格" onClick={onClose}>×</button>
          </header>
          <dl>
            <dt>产品名称</dt>
            <dd>{dialog.product.name}</dd>
            <dt>当前价格计划</dt>
            <dd>{dialog.product.pricePlan}</dd>
          </dl>
          <footer>
            <button type="button" onClick={onClose}>取消</button>
            <button type="button" className="is-primary" onClick={() => onConfirm('售卖价格已保存')}>
              保存价格
            </button>
          </footer>
        </section>
      </div>
    )
  }

  const isOnline = dialog.product.status === 'online'
  const title = isOnline ? '是否确认下架售卖产品?' : '是否确认上架售卖产品?'
  const description = isOnline ? '确认下架后将无法进行售卖，可能会影响收益。' : ''

  return (
    <div className="calendar-room-dialog-mask" role="presentation" onMouseDown={onClose}>
        <section className="calendar-room-dialog calendar-room-dialog--status" role="dialog" aria-modal="true" aria-label="调整上下架状态" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <span className="calendar-room-dialog__warning" aria-hidden="true">!</span>
          <div className="calendar-room-dialog__status-copy">
            <strong>{title}</strong>
            {description ? <p>{description}</p> : null}
          </div>
        </header>
        <footer>
          <button type="button" onClick={onClose}>取消</button>
          <button type="button" className="is-primary" onClick={() => onConfirm('售卖状态已更新')}>
            确认调整
          </button>
        </footer>
      </section>
    </div>
  )
}

function CalendarRoomEditPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const editChannel = new URLSearchParams(location.search).get('channel') || ''
  const editProductName = new URLSearchParams(location.search).get('productName') || ''
  const isEditMode = new URLSearchParams(location.search).get('mode') === 'edit'
  const initialChannel = EDIT_CHANNEL_TABS.includes(editChannel) ? editChannel : '微信小程序'
  const [activeChannel, setActiveChannel] = useState(initialChannel)
  const [notice, setNotice] = useState('')
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [roomKeyword, setRoomKeyword] = useState('')
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])
  const [roomSaleType, setRoomSaleType] = useState<'calendar' | 'presale'>('calendar')
  const [productType, setProductType] = useState<'fullDay' | 'hourly'>('fullDay')
  const [stayLimitType, setStayLimitType] = useState<'limited' | 'unlimited'>('unlimited')
  const [checkinPeriodType, setCheckinPeriodType] = useState<'allDay' | 'custom'>('custom')
  const showDouyinFields = activeChannel === '抖音来客'
  const showKioskBrands = activeChannel === '自助机'
  const hasRoomData = !CHANNEL_ROOM_EMPTY_CHANNELS.has(activeChannel)
  const isMiniProgramChannel = MINI_PROGRAM_CHANNELS.has(activeChannel)
  const isKioskChannel = KIOSK_CHANNELS.has(activeChannel)
  const supportsHourlyRoom = isMiniProgramChannel || isKioskChannel
  const showDouyinPresaleFields = showDouyinFields && roomSaleType === 'presale'
  const showHourlyFields = !showDouyinPresaleFields && supportsHourlyRoom && productType === 'hourly'
  const filteredRoomGroups = CHANNEL_ROOM_GROUPS.filter((group) => group.name.includes(roomKeyword.trim()))

  function openRoomDialog() {
    setRoomKeyword('')
    setIsRoomDialogOpen(true)
    setNotice('')
  }

  function closeRoomDialog() {
    setIsRoomDialogOpen(false)
  }

  function toggleRoomSelection(roomId: string) {
    setSelectedRoomIds((current) =>
      current.includes(roomId) ? current.filter((id) => id !== roomId) : [...current, roomId],
    )
  }

  function confirmRoomSelection() {
    const summary =
      selectedRoomIds.length > 0 ? `已选择 ${selectedRoomIds.length} 个渠道房型` : `${activeChannel}暂未选择房型`
    setNotice(summary)
    setIsRoomDialogOpen(false)
  }

  function handleChannelChange(channel: string) {
    setActiveChannel(channel)
    setIsRoomDialogOpen(false)
    setNotice('')
    setSelectedRoomIds([])
    setRoomSaleType('calendar')
    setProductType(channel === '小红书' ? 'hourly' : 'fullDay')
    setStayLimitType(channel === '自助机' ? 'limited' : 'unlimited')
    setCheckinPeriodType('custom')
  }

  return (
    <div className="calendar-room-edit-page">
      <h1 className="sr-only-heading">日历房</h1>
      <div className="calendar-room-breadcrumb">
        <button type="button" onClick={() => navigate('/setting/localRoomTypeProductionSetting')}>
          日历房
        </button>
        <span>/</span>
        <strong>{isEditMode ? '编辑产品' : '新增产品'}</strong>
      </div>
      <div className="calendar-room-channel-tabs" role="tablist" aria-label="售卖渠道">
        {EDIT_CHANNEL_TABS.map((channel) => (
          <button
            key={channel}
            type="button"
            role="tab"
            aria-selected={activeChannel === channel}
            className={activeChannel === channel ? 'is-active' : ''}
            disabled={DISABLED_EDIT_CHANNELS.has(channel)}
            onClick={() => handleChannelChange(channel)}
          >
            {channel}
          </button>
        ))}
      </div>
      {notice ? <div className="calendar-room-notice" role="status" aria-label="日历房操作反馈">{notice}</div> : null}
      <section className="calendar-room-edit-card" aria-label="新增产品">
        {showDouyinFields ? (
          <EditField label="房型类型">
            <div className="calendar-room-radio-row">
              <label>
                <input
                  type="radio"
                  name="roomSaleType"
                  checked={roomSaleType === 'calendar'}
                  onChange={() => setRoomSaleType('calendar')}
                />
                日历房
              </label>
              <label>
                <input
                  type="radio"
                  name="roomSaleType"
                  checked={roomSaleType === 'presale'}
                  onChange={() => {
                    setRoomSaleType('presale')
                    setProductType('fullDay')
                  }}
                />
                预售房
              </label>
            </div>
          </EditField>
        ) : null}
        {showKioskBrands ? (
          <EditField label="自助机品牌">
            <div className="calendar-room-radio-row calendar-room-radio-row--wide">
              {['自助机RW', '自助机YZ', '自助机ZD', '自助机PY', '自助机CQ', '自助机PC', '自助机YK', '自助机YD', '自助机KT', '自助机LM'].map((brand, index) => (
                <label key={brand}>
                  <input type="radio" name="kioskBrand" defaultChecked={index === 0} />
                  {brand}
                </label>
              ))}
            </div>
          </EditField>
        ) : null}
        <EditField label="选择房型">
          <button type="button" className="calendar-room-pick-room" onClick={openRoomDialog}>
            <span>＋</span>
            房型
          </button>
        </EditField>
        <EditField label="售卖产品名称">
          {showDouyinPresaleFields ? (
            <div className="calendar-room-product-name-inline">
              <span className="calendar-room-product-name-inline__prefix">物理房型名称（系统生成）</span>
              <input
                className="calendar-room-product-name-inline__input"
                aria-label="自定义部分"
                placeholder="自定义部分（必填）"
                defaultValue={editProductName}
              />
            </div>
          ) : (
            isEditMode ? (
              <input className="calendar-room-edit-name-input" aria-label="售卖产品名称" defaultValue={editProductName} />
            ) : (
              <p className="calendar-room-readonly-text">
                {showHourlyFields ? '系统自动生成，物理房型名称-入住时长-退改规则' : '系统自动生成，物理房型名称-早餐-退改规则'}
              </p>
            )
          )}
          <em>
            {showDouyinPresaleFields
              ? '名称会对用户展示，为避免字诉请谨慎填写，名称格式如：高级大床房-五一节预售'
              : showHourlyFields
              ? '名称仅对商家侧展示，名称格式如：高级大床房-3小时-入住前可取消'
              : '名称仅对商家侧展示，名称格式如：高级大床房-2份早餐-入住当天18:00前可取消'}
          </em>
        </EditField>
        <EditField label="产品类型">
          <div className="calendar-room-radio-row">
            <label>
              <input
                type="radio"
                name="productType"
                checked={productType === 'fullDay'}
                disabled={showDouyinPresaleFields}
                onChange={() => setProductType('fullDay')}
              />
              全日房
            </label>
            <label>
              <input
                type="radio"
                name="productType"
                checked={productType === 'hourly'}
                disabled={showDouyinFields || !supportsHourlyRoom || showDouyinPresaleFields}
                onChange={() => setProductType('hourly')}
              />
              钟点房
            </label>
          </div>
        </EditField>
        {showDouyinPresaleFields ? null : showHourlyFields ? (
          <EditField label="入住时长限制">
            <div className="calendar-room-radio-row">
              <label>
                <input
                  type="radio"
                  name="stayLimitType"
                  checked={stayLimitType === 'limited'}
                  onChange={() => setStayLimitType('limited')}
                />
                限制
              </label>
              <label>
                <input
                  type="radio"
                  name="stayLimitType"
                  checked={stayLimitType === 'unlimited'}
                  disabled={isKioskChannel}
                  onChange={() => setStayLimitType('unlimited')}
                />
                不限制
                <HelpTooltip label="入住时长限制说明" text="如选择不限入住时长，则可任意时段内均可入住" />
              </label>
            </div>
          </EditField>
        ) : (
          <EditField label="早餐">
            <div className="calendar-room-breakfast">
              <select aria-label="早餐份数" defaultValue="0">
                <option value="0">0</option>
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
              <span>份早餐</span>
            </div>
          </EditField>
        )}
        {showDouyinPresaleFields ? null : (
          <EditField label="取消规则">
            <div className="calendar-room-radio-row">
              {['未入住任意退', '阶梯退', '限时退', '不可退'].map((item, index) => (
                <label key={item}>
                  <input type="radio" name="refundRule" defaultChecked={index === 3} />
                  {item}
                </label>
              ))}
            </div>
          </EditField>
        )}
        {showDouyinPresaleFields ? (
          <>
            <EditField label="时间">
              <button type="button" className="calendar-room-date-range" onClick={() => setNotice('预售时间日历组件已打开')}>
                <span>Invalid date</span>
                <span>→</span>
                <span>Invalid date</span>
                <span aria-hidden="true">□</span>
              </button>
            </EditField>
            <EditField label="自动续期">
              <div className="calendar-room-radio-row">
                <label>
                  <input type="radio" name="presaleRenewal" defaultChecked />
                  自动续期
                  <HelpTooltip label="自动续期说明" text="开启后会按当前预售配置自动顺延销售周期" />
                </label>
                <label>
                  <input type="radio" name="presaleRenewal" />
                  不自动续期
                </label>
              </div>
            </EditField>
          </>
        ) : null}
        {showHourlyFields ? (
          <EditField label="可入住时段">
            <div className="calendar-room-checkin-period">
              <div className="calendar-room-radio-row">
                <label>
                  <input
                    type="radio"
                    name="checkinPeriodType"
                    checked={checkinPeriodType === 'allDay'}
                    onChange={() => setCheckinPeriodType('allDay')}
                  />
                  全天
                </label>
                <label>
                  <input
                    type="radio"
                    name="checkinPeriodType"
                    checked={checkinPeriodType === 'custom'}
                    onChange={() => setCheckinPeriodType('custom')}
                  />
                  自定义
                </label>
              </div>
              {checkinPeriodType === 'custom' ? (
                <div className="calendar-room-checkin-period__custom">
                  <select aria-label="开始时间" defaultValue="10">
                    {['00', '06', '08', '10', '12', '14', '16', '18', '20', '22'].map((hour) => (
                      <option key={hour} value={hour}>
                        {hour} 点
                      </option>
                    ))}
                  </select>
                  <span>到</span>
                  <select aria-label="结束时间" defaultValue="22">
                    {['08', '10', '12', '14', '16', '18', '20', '22', '23'].map((hour) => (
                      <option key={hour} value={hour}>
                        {hour} 点
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </EditField>
        ) : null}
        {showDouyinFields && !showDouyinPresaleFields ? (
          <>
            <EditField label="收款方式">
              <div className="calendar-room-radio-row">
                {['总部收款', '区域账户收款', '分店账户收款'].map((item, index) => (
                  <label key={item}>
                    <input type="radio" name="paymentMethod" defaultChecked={index === 0} />
                    {item}
                  </label>
                ))}
              </div>
            </EditField>
            <EditField label="时间">
              <button type="button" className="calendar-room-date-range" onClick={() => setNotice('售卖时间选择器已打开')}>
                <span>2026-05-21</span>
                <span>→</span>
                <span>2026-06-21</span>
                <span aria-hidden="true">□</span>
              </button>
            </EditField>
            <EditField label="自动续期">
              <div className="calendar-room-radio-row">
                <label>
                  <input type="radio" name="renewal" defaultChecked />
                  自动续期
                  <HelpTooltip label="自动续期说明" text="开启后会按当前售卖时间自动续期，无需重复手动配置" />
                </label>
                <label>
                  <input type="radio" name="renewal" />
                  不自动续期
                </label>
              </div>
            </EditField>
          </>
        ) : null}
        <EditField label="房价">
          <p>创建之后前往【渠道RP价】设置或检查对应价格</p>
        </EditField>
        <footer className="calendar-room-edit-footer">
          <button type="button" className="is-primary" onClick={() => setNotice('售卖产品已保存')}>
            确 定
          </button>
        </footer>
      </section>
      {isRoomDialogOpen ? (
        <ChannelRoomDialog
          activeChannel={activeChannel}
          keyword={roomKeyword}
          groups={hasRoomData ? filteredRoomGroups : []}
          selectedRoomIds={selectedRoomIds}
          onClose={closeRoomDialog}
          onConfirm={confirmRoomSelection}
          onKeywordChange={setRoomKeyword}
          onToggleRoom={toggleRoomSelection}
        />
      ) : null}
    </div>
  )
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="calendar-room-edit-field">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  )
}

function ChannelRoomDialog({
  activeChannel,
  keyword,
  groups,
  selectedRoomIds,
  onClose,
  onConfirm,
  onKeywordChange,
  onToggleRoom,
}: {
  activeChannel: string
  keyword: string
  groups: ChannelRoomGroup[]
  selectedRoomIds: string[]
  onClose: () => void
  onConfirm: () => void
  onKeywordChange: (value: string) => void
  onToggleRoom: (roomId: string) => void
}) {
  const isEmpty = groups.length === 0

  return (
    <div className="calendar-room-channel-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section
        className="calendar-room-channel-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`选择${activeChannel}房型`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="calendar-room-channel-dialog__header">
          <strong>选择渠道房型</strong>
          <button type="button" aria-label="关闭选择渠道房型" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="calendar-room-channel-dialog__body">
          <label className="calendar-room-channel-dialog__search">
            <span aria-hidden="true">⌕</span>
            <input
              value={keyword}
              placeholder="请输入名称"
              aria-label="请输入名称"
              onChange={(event) => onKeywordChange(event.target.value)}
            />
          </label>
          <div className="calendar-room-channel-dialog__divider" />
          {isEmpty ? (
            <div className="calendar-room-channel-dialog__empty" role="status" aria-live="polite">
              <div className="calendar-room-channel-dialog__empty-illustration" aria-hidden="true">
                <span className="is-back-left" />
                <span className="is-back-center" />
                <span className="is-back-right" />
                <span className="is-house-base" />
                <span className="is-house-roof" />
                <span className="is-house-door" />
                <span className="is-house-window-left" />
                <span className="is-house-window-right" />
              </div>
              <p>暂无数据</p>
            </div>
          ) : (
            <div className="calendar-room-channel-dialog__tree" role="list" aria-label="渠道房型列表">
              {groups.map((group) => {
                const checked = selectedRoomIds.includes(group.id)

                return (
                  <label key={group.id} className="calendar-room-channel-dialog__tree-row" role="listitem">
                    <input
                      type="checkbox"
                      checked={checked}
                      aria-label={group.name}
                      onChange={() => onToggleRoom(group.id)}
                    />
                    <span className="calendar-room-channel-dialog__tree-label">{group.name}</span>
                    <span className="calendar-room-channel-dialog__tree-arrow" aria-hidden="true">
                      ▶
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
        <footer className="calendar-room-channel-dialog__footer">
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" onClick={onConfirm}>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

function HelpTooltip({ label, text }: { label: string; text: string }) {
  return (
    <span className="calendar-room-help-tooltip">
      <button type="button" className="calendar-room-help" aria-label={label}>
        ?
      </button>
      <span className="calendar-room-help-tooltip__bubble" role="tooltip">
        {text}
      </span>
    </span>
  )
}
