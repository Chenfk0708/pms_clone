import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  fetchCalendarRoomProducts,
  type CalendarRoomProduct,
  type CalendarRoomQuery,
  type CalendarRoomRow,
  type CalendarRoomViewModel,
} from '../services/calendarRoom'
import './CalendarRoomPage.css'

type FilterKey = 'channel' | 'status'
type DialogState =
  | { type: 'detail'; product: CalendarRoomProduct }
  | { type: 'price'; product: CalendarRoomProduct }
  | { type: 'status'; product: CalendarRoomProduct }
  | null

const DEFAULT_QUERY: CalendarRoomQuery = {
  keyword: '',
  channel: '',
  status: '全部',
  page: 1,
  pageSize: 20,
}

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
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [query, setQuery] = useState<CalendarRoomQuery>({ ...DEFAULT_QUERY, ...locationQuery })
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

  const currentOptions =
    openFilter === 'channel'
      ? { label: '渠道', options: viewModel?.channelOptions ?? [] }
      : openFilter === 'status'
        ? { label: '上架状态', options: viewModel?.statusOptions ?? [] }
        : null

  function applyFilter(key: FilterKey, value: string) {
    setIsLoading(true)
    setErrorMessage('')
    setQuery((current) => ({ ...current, [key]: value, page: 1 }))
    setOpenFilter(null)
    setNotice('筛选条件已更新')
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
      navigate(viewModel?.routeTargets.createProduct ?? '/setting/localRoomTypeProductionSetting/channelGoodsSetting')
      return
    }

    if (action === '修改价格') {
      setDialog({ type: 'price', product })
      return
    }

    setDialog({ type: 'status', product })
  }

  const rows = viewModel?.rows ?? []
  const storeName = viewModel?.storeOptions[1]?.name ?? '天落会宿公寓(前海壹方城宝安中心店)'

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
          <label className="calendar-room-store">
            <span>全部门店</span>
            <button type="button" aria-label={`全部门店 ${storeName}`} className="calendar-room-store__select" onClick={() => setNotice('门店列表已展开')}>
              {storeName}
            </button>
          </label>
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
            isOpen={openFilter === 'channel'}
            onToggle={() => setOpenFilter(openFilter === 'channel' ? null : 'channel')}
          />
          <FilterButton
            label="上架状态"
            value={query.status}
            placeholder="全部"
            isOpen={openFilter === 'status'}
            onToggle={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
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

        {currentOptions ? (
          <div className="calendar-room-options" role="listbox" aria-label={`${currentOptions.label}选项`}>
            {currentOptions.options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={(openFilter === 'channel' ? query.channel : query.status) === option}
                onClick={() => {
                  if (openFilter) applyFilter(openFilter, option)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {errorMessage ? (
        <div className="calendar-room-alert" role="alert" aria-label="日历房数据错误">
          <span>日历房数据加载失败，请稍后重试</span>
          <button type="button" onClick={retryLoad}>
            重试
          </button>
        </div>
      ) : null}

      {notice ? (
        <div className="calendar-room-notice" role="status" aria-label="日历房操作反馈">
          {notice}
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
            <span key={`${room.id}-${channel}-${index}`} style={{ zIndex: room.channelBadges.length - index }}>
              {channel}
            </span>
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
  isOpen,
  onToggle,
}: {
  label: string
  value: string
  placeholder: string
  isOpen: boolean
  onToggle: () => void
}) {
  const displayValue = value || placeholder

  return (
    <label className="calendar-room-field">
      <span>{label}：</span>
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
          <p>当前价格计划：{dialog.product.pricePlan}</p>
          <label className="calendar-room-dialog-field">
            <span>基础价</span>
            <input defaultValue="730" aria-label="基础价" />
          </label>
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

  const nextStatusText = dialog.product.status === 'online' ? '确认下架' : '确认上架'

  return (
    <div className="calendar-room-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section className="calendar-room-dialog" role="dialog" aria-modal="true" aria-label="调整上下架状态" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <strong>调整上下架状态</strong>
          <button type="button" aria-label="关闭调整上下架状态" onClick={onClose}>×</button>
        </header>
        <p>{nextStatusText}：{dialog.product.name}</p>
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
  const navigate = useNavigate()
  const [activeChannel, setActiveChannel] = useState('微信小程序')
  const [notice, setNotice] = useState('')

  return (
    <div className="calendar-room-edit-page">
      <h1 className="sr-only-heading">日历房</h1>
      <div className="calendar-room-breadcrumb">日历房 / <strong>新增产品</strong></div>
      <div className="calendar-room-channel-tabs" role="tablist" aria-label="售卖渠道">
        {['微信小程序', '小红书小程序', '抖音来客', '自助机', '同程民宿', '途家民宿', '美团民宿', '小猪民宿', '木鸟民宿', '路客云聚合'].map((channel) => (
          <button
            key={channel}
            type="button"
            role="tab"
            aria-selected={activeChannel === channel}
            className={activeChannel === channel ? 'is-active' : ''}
            onClick={() => setActiveChannel(channel)}
          >
            {channel}
          </button>
        ))}
      </div>
      {notice ? <div className="calendar-room-notice" role="status" aria-label="日历房操作反馈">{notice}</div> : null}
      <section className="calendar-room-edit-card" aria-label="新增产品">
        <button type="button" className="calendar-room-pick-room" onClick={() => setNotice('房型选择面板已打开')}>
          选择房型
        </button>
        <EditField label="房型">
          <button type="button" className="calendar-room-form-select" onClick={() => setNotice('房型选择面板已打开')}>
            请选择
          </button>
        </EditField>
        <EditField label="售卖产品名称">
          <input readOnly value="系统自动生成，物理房型名称-早餐-退改规则" />
          <em>名称仅对商家侧展示，名称格式如：高级大床房-2份早餐-入住当天18:00前可取消</em>
        </EditField>
        <EditField label="产品类型">
          <div className="calendar-room-radio-row">
            <label>
              <input type="radio" name="productType" defaultChecked />
              全日房
            </label>
            <label>
              <input type="radio" name="productType" />
              钟点房
            </label>
          </div>
        </EditField>
        <EditField label="早餐">
          <div className="calendar-room-breakfast">
            <input aria-label="早餐份数" defaultValue="0" />
            <span>份早餐</span>
          </div>
        </EditField>
        <EditField label="取消规则">
          <div className="calendar-room-radio-row">
            {['未入住任意退', '阶梯退', '限时退', '不可退'].map((item, index) => (
              <label key={item}>
                <input type="radio" name="refundRule" defaultChecked={index === 0} />
                {item}
              </label>
            ))}
          </div>
        </EditField>
        <EditField label="房价">
          <p>创建之后前往【渠道RP价】设置或检查对应价格</p>
        </EditField>
        <footer className="calendar-room-edit-footer">
          <button type="button" onClick={() => navigate('/setting/localRoomTypeProductionSetting')}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={() => setNotice('售卖产品已保存')}>
            确 定
          </button>
        </footer>
      </section>
    </div>
  )
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="calendar-room-edit-field">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  )
}
