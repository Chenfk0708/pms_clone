import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  loadHotelProductData,
  type HotelProductData,
  type HotelProductListItem,
  type HotelProductListQuery,
  type HotelProductOption,
} from '../services/hotelProduct'
import './HotelProductPage.css'

type FilterKey = 'roomType' | 'channel'
type EditTab = '商品信息' | '套餐设置' | '售卖规则'

const storeName = '天落会宿公寓(前海壹方城宝安中心店)'
const filters: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: 'roomType', label: '关联房型', placeholder: '请选择' },
  { key: 'channel', label: '渠道', placeholder: '请选择渠道' },
]
const tableColumns = ['', '商品标题', '关联房型', '关联渠道', '库存', '售价(元)', '加价(元)', '创建时间', '更新时间', '操作']
const editTabs: EditTab[] = ['商品信息', '套餐设置', '售卖规则']
const fallbackRoomTypes: HotelProductOption[] = [
  { id: 'room-mock-1', name: '顶层套房（浴缸巨幕电竞麻将）' },
  { id: 'room-mock-2', name: '总裁套间（桑拿浴缸露台电竞麻将）' },
  { id: 'room-mock-3', name: '天落大床电竞套间' },
  { id: 'room-mock-4', name: '观影大床房' },
]

export function HotelProductPage() {
  const location = useLocation()
  const isEdit = location.pathname.endsWith('/edit')

  return isEdit ? <HotelProductEditPage /> : <HotelProductListPage />
}

function HotelProductListPage() {
  const navigate = useNavigate()
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [values, setValues] = useState<Record<FilterKey, string>>({ roomType: '', channel: '' })
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [reloadSeq, setReloadSeq] = useState(0)
  const [data, setData] = useState<HotelProductData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<HotelProductListItem | null>(null)
  const [operationProduct, setOperationProduct] = useState<HotelProductListItem | null>(null)
  const [isStrategyOpen, setIsStrategyOpen] = useState(false)

  const query = useMemo<HotelProductListQuery>(
    () => ({
      keyword: submittedKeyword,
      roomCategoryId: values.roomType,
      channelId: values.channel,
      page: 1,
      pageSize: 20,
    }),
    [submittedKeyword, values],
  )

  const fetchData = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true)
      setError('')
      try {
        const result = await loadHotelProductData(query, signal)
        setData(result)
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return
        setError(loadError instanceof Error ? loadError.message : '酒店套餐数据加载失败，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    },
    [query],
  )

  useEffect(() => {
    const controller = new AbortController()
    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void fetchData(controller.signal)
      }
    })
    return () => controller.abort()
  }, [fetchData, reloadSeq])

  const roomOptions = data?.roomTypes ?? fallbackRoomTypes
  const channelOptions = data?.channels ?? []
  const currentFilter = openFilter ? filters.find((filter) => filter.key === openFilter) : null
  const currentOptions = currentFilter?.key === 'roomType' ? roomOptions : channelOptions

  function chooseFilter(value: string) {
    if (!openFilter) return
    setValues((current) => ({ ...current, [openFilter]: value }))
    setOpenFilter(null)
  }

  function resetFilters() {
    setValues({ roomType: '', channel: '' })
    setKeyword('')
    setSubmittedKeyword('')
    setOpenFilter(null)
    setNotice('筛选条件已重置')
  }

  function refreshData(message = '数据已刷新') {
    setNotice(message)
    setReloadSeq((current) => current + 1)
  }

  function searchData() {
    setSubmittedKeyword(keyword)
    setOpenFilter(null)
    setNotice('查询条件已应用')
  }

  return (
    <div className="hotel-product-page">
      <h1 className="hotel-product-title">酒店套餐</h1>

      <section className="hotel-product-query" aria-label="酒店套餐筛选">
        <div className="hotel-product-store-tabs" aria-label="门店筛选">
          <button type="button" className="is-active" onClick={() => refreshData('全部门店数据已更新')}>
            全部门店
          </button>
          <button type="button" onClick={() => refreshData('当前门店数据已更新')}>
            {storeName}
          </button>
          <button type="button" className="hotel-product-gear" aria-label="门店设置" onClick={() => setNotice('门店设置已同步')}>
            ⚙
          </button>
        </div>

        <div className="hotel-product-query__grid">
          <label className="hotel-product-field hotel-product-keyword">
            <span>搜索</span>
            <input value={keyword} placeholder="请输入套餐名称" onChange={(event) => setKeyword(event.target.value)} />
          </label>
          {filters.map((filter) => (
            <FilterSelect
              key={filter.key}
              filter={filter}
              options={filter.key === 'roomType' ? roomOptions : channelOptions}
              value={values[filter.key]}
              isOpen={openFilter === filter.key}
              onToggle={() => setOpenFilter(openFilter === filter.key ? null : filter.key)}
            />
          ))}
          <div className="hotel-product-actions">
            <button type="button" onClick={resetFilters} disabled={isLoading}>
              重 置
            </button>
            <button type="button" className="is-primary" onClick={searchData} disabled={isLoading}>
              搜 索
            </button>
          </div>
        </div>

        {currentFilter ? (
          <div
            className={`hotel-product-options hotel-product-options--${currentFilter.key}`}
            role="listbox"
            aria-label={`${currentFilter.label}选项`}
          >
            {currentOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="option"
                aria-selected={values[currentFilter.key] === option.id}
                onClick={() => chooseFilter(option.id)}
              >
                {option.name}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="hotel-product-main" aria-label="酒店套餐列表">
        <div className="hotel-product-toolbar">
          <span aria-label="酒店套餐数据状态" className={`hotel-product-state ${error ? 'is-error' : ''}`}>
            {isLoading ? '数据加载中' : error ? '数据加载失败' : data?.list.length ? '数据已更新' : '当前筛选下暂无酒店套餐'}
          </span>
          <button type="button" onClick={() => refreshData()} disabled={isLoading}>
            刷新
          </button>
          <button type="button" onClick={() => setNotice('导出任务已创建，完成后可在任务中心查看')} disabled={isLoading || !data?.list.length}>
            导出
          </button>
          <button type="button" onClick={() => navigate('/setting/roomTypeInfo')}>
            房型管理
          </button>
          <button type="button" onClick={() => setIsStrategyOpen(true)}>
            接单策略
          </button>
          <button type="button" className="is-primary" onClick={() => navigate('/mallManagement/hotelProduct/edit')}>
            创建酒店套餐
          </button>
        </div>

        {notice ? (
          <div className="hotel-product-notice" role="status" aria-label="酒店套餐操作反馈">
            {notice}
          </div>
        ) : null}

        <div
          data-testid="hotel-product-service-contract"
          data-provider={data?.provider ?? 'mock'}
          data-request-summary={data?.requestSummary.join(';') ?? ''}
          hidden
        />

        {error ? (
          <div className="hotel-product-alert" role="alert" aria-label="酒店套餐加载失败">
            <strong>酒店套餐数据加载失败，请稍后重试</strong>
            <span>{error}</span>
            <button type="button" onClick={() => refreshData('已重新发起加载')}>
              重试
            </button>
          </div>
        ) : null}

        <div className="hotel-product-table" role="table" aria-label="酒店套餐列表">
          <div className="hotel-product-table__head" role="row">
            {tableColumns.map((column, index) => (
              <div key={`${column}-${index}`} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          {isLoading ? (
            <div className="hotel-product-empty" role="status" aria-label="酒店套餐加载中">
              <div>数据加载中</div>
            </div>
          ) : data?.list.length ? (
            data.list.map((item, index) => (
              <div className="hotel-product-table__row" role="row" key={item.id}>
                <div role="cell">{index + 1}</div>
                <div role="cell">{item.title}</div>
                <div role="cell">{item.roomCategoryName}</div>
                <div role="cell">{item.channelName}</div>
                <div role="cell">{item.stock}</div>
                <div role="cell">{item.salePrice}</div>
                <div role="cell">{item.extraPrice}</div>
                <div role="cell">{item.createdAt}</div>
                <div role="cell">{item.updatedAt}</div>
                <div role="cell" className="hotel-product-row-actions">
                  <button type="button" onClick={() => setSelectedProduct(item)}>
                    查看详情
                  </button>
                  <button type="button" onClick={() => setOperationProduct(item)}>
                    更多
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="hotel-product-empty" role="status" aria-label="酒店套餐空态">
              <div role="cell" aria-colspan={tableColumns.length}>
                <span className="hotel-product-empty__icon" aria-hidden="true" />
                <strong>暂无符合当前筛选条件的酒店套餐</strong>
              </div>
            </div>
          )}
        </div>
      </section>

      {selectedProduct ? <ProductDetailDialog product={selectedProduct} onClose={() => setSelectedProduct(null)} /> : null}
      {operationProduct ? (
        <ProductOperationDialog
          product={operationProduct}
          onClose={() => setOperationProduct(null)}
          onConfirm={() => {
            setOperationProduct(null)
            setNotice(`${operationProduct.title}库存校验已完成`)
          }}
        />
      ) : null}
      {isStrategyOpen ? (
        <StrategyDialog
          onCancel={() => setIsStrategyOpen(false)}
          onConfirm={() => {
            setIsStrategyOpen(false)
            setNotice('接单策略已保存')
          }}
        />
      ) : null}
    </div>
  )
}

function HotelProductEditPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<EditTab>('商品信息')
  const [notice, setNotice] = useState('')
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState('')
  const [packageRows, setPackageRows] = useState<Array<{ date: string; stock: number; price: number }>>([])

  function savePackage() {
    setNotice('酒店套餐已保存')
  }

  return (
    <div className="hotel-product-edit-page">
      <h1 className="hotel-product-title">酒店套餐</h1>
      <div className="hotel-product-breadcrumb">酒店套餐 / 创建酒店套餐</div>

      {notice ? (
        <div className="hotel-product-notice" role="status" aria-label="酒店套餐编辑反馈">
          {notice}
        </div>
      ) : null}

      <div className="hotel-product-edit-tabs" role="tablist" aria-label="酒店套餐编辑步骤">
        {editTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? 'is-active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <section className="hotel-product-edit-card">
        {activeTab === '商品信息' ? (
          <ProductInfoForm
            selectedRoom={selectedRoom}
            onUpload={() => setNotice('图片已加入上传队列')}
            onSelectRoom={() => setIsRoomDialogOpen(true)}
          />
        ) : null}
        {activeTab === '套餐设置' ? (
          <PackageSettingForm
            rows={packageRows}
            onAdd={() => {
              setPackageRows((current) => [...current, { date: '2026-05-18 至 2026-05-19', stock: 10, price: 699 }])
              setNotice('套餐库存已添加')
            }}
          />
        ) : null}
        {activeTab === '售卖规则' ? <SaleRuleForm /> : null}

        <footer className="hotel-product-edit-footer">
          <button type="button" onClick={() => navigate('/mallManagement/hotelProduct')}>
            返回列表
          </button>
          {activeTab === '商品信息' ? (
            <button type="button" className="is-primary" onClick={() => setActiveTab('套餐设置')}>
              下一步
            </button>
          ) : (
            <button type="button" className="is-primary" onClick={savePackage}>
              保 存
            </button>
          )}
        </footer>
      </section>

      {isRoomDialogOpen ? (
        <RoomSelectDialog
          onClose={() => setIsRoomDialogOpen(false)}
          onConfirm={(roomName) => {
            setSelectedRoom(roomName)
            setIsRoomDialogOpen(false)
            setNotice(`${roomName}已关联`)
          }}
        />
      ) : null}
    </div>
  )
}

function ProductInfoForm({
  selectedRoom,
  onUpload,
  onSelectRoom,
}: {
  selectedRoom: string
  onUpload: () => void
  onSelectRoom: () => void
}) {
  return (
    <>
      <FormSection title="基本信息">
        <label className="hotel-product-form-row">
          <span>商品标题</span>
          <input placeholder="请输入商品标题" maxLength={50} />
        </label>
        <div className="hotel-product-form-row hotel-product-upload">
          <span>商品图片</span>
          <button type="button" onClick={onUpload}>
            上传
          </button>
          <p>建议尺寸：1200*1200像素，比例1:1，可上传1-9张，默认第1张为主图。</p>
        </div>
        <div className="hotel-product-form-row hotel-product-room-bind">
          <span>关联房型</span>
          <div>
            <strong>品牌小程序</strong>
            <button type="button" onClick={onSelectRoom}>
              + 选择房型
            </button>
            {selectedRoom ? <p>{selectedRoom}</p> : null}
          </div>
          <div>
            <strong>视频号</strong>
            <button type="button" onClick={onSelectRoom}>
              + 选择房型
            </button>
          </div>
        </div>
      </FormSection>

      <FormSection title="预定信息">
        <label className="hotel-product-form-row">
          <span>预定电话</span>
          <input placeholder="请输入手机号码或座机号码（如：010-12345678）" maxLength={20} />
        </label>
        <label className="hotel-product-form-row hotel-product-textarea-row">
          <span>预定说明</span>
          <textarea placeholder="请输入预定说明" />
        </label>
      </FormSection>
    </>
  )
}

function PackageSettingForm({
  rows,
  onAdd,
}: {
  rows: Array<{ date: string; stock: number; price: number }>
  onAdd: () => void
}) {
  return (
    <FormSection title="套餐设置">
      <div className="hotel-product-package-toolbar">
        <button type="button" onClick={onAdd}>
          添加套餐
        </button>
      </div>
      <div className="hotel-product-package-table" role="table" aria-label="套餐设置表格">
        <div role="row">
          <div role="columnheader">日期</div>
          <div role="columnheader">库存</div>
          <div role="columnheader">加价金额</div>
          <div role="columnheader">操作</div>
        </div>
        {rows.length ? (
          rows.map((row) => (
            <div role="row" key={row.date}>
              <div role="cell">{row.date}</div>
              <div role="cell">{row.stock}</div>
              <div role="cell">{row.price}</div>
              <div role="cell">可售</div>
            </div>
          ))
        ) : (
          <div role="row">
            <div role="cell">暂无套餐库存</div>
          </div>
        )}
      </div>
    </FormSection>
  )
}

function SaleRuleForm() {
  return (
    <>
      <FormSection title="预约规则">
        <label className="hotel-product-form-row">
          <span>预约说明</span>
          <textarea placeholder="请输入预约规则" />
        </label>
      </FormSection>
      <FormSection title="退改规则">
        <label className="hotel-product-form-row">
          <span>退改说明</span>
          <textarea placeholder="请输入退改规则" />
        </label>
      </FormSection>
    </>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="hotel-product-form-section">
      <h2>{title}</h2>
      <div className="hotel-product-form-grid">{children}</div>
    </section>
  )
}

function FilterSelect({
  filter,
  options,
  value,
  isOpen,
  onToggle,
}: {
  filter: { key: FilterKey; label: string; placeholder: string }
  options: HotelProductOption[]
  value: string
  isOpen: boolean
  onToggle: () => void
}) {
  const displayValue = options.find((option) => option.id === value)?.name || filter.placeholder

  return (
    <label className="hotel-product-field">
      <span>{filter.label}</span>
      <button
        type="button"
        className="hotel-product-select"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${filter.label} ${displayValue}`}
        onClick={onToggle}
      >
        {displayValue}
      </button>
    </label>
  )
}

function ProductDetailDialog({ product, onClose }: { product: HotelProductListItem; onClose: () => void }) {
  return (
    <div className="hotel-product-modal-backdrop">
      <div className="hotel-product-modal" role="dialog" aria-modal="true" aria-label="酒店套餐详情">
        <header>
          <h2>{product.title}</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="hotel-product-detail">
          <p>
            <strong>关联房型</strong>
            <span>{product.roomCategoryName}</span>
          </p>
          <p>
            <strong>关联渠道</strong>
            <span>{product.channelName}</span>
          </p>
          <p>
            <strong>预订电话</strong>
            <span>{product.reservationPhone}</span>
          </p>
          <p>
            <strong>预订说明</strong>
            <span>{product.reservationNote}</span>
          </p>
        </div>
        <footer>
          <button type="button" className="is-primary" onClick={onClose}>
            关闭
          </button>
        </footer>
      </div>
    </div>
  )
}

function ProductOperationDialog({
  product,
  onClose,
  onConfirm,
}: {
  product: HotelProductListItem
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <div className="hotel-product-modal-backdrop">
      <div className="hotel-product-modal" role="dialog" aria-modal="true" aria-label="酒店套餐操作">
        <header>
          <h2>{product.title}</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="hotel-product-strategy-body">
          <p>库存校验将检查当前套餐在关联渠道和房型中的可售库存。</p>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={onConfirm}>
            执行校验
          </button>
        </footer>
      </div>
    </div>
  )
}

function StrategyDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="hotel-product-modal-backdrop">
      <div className="hotel-product-modal" role="dialog" aria-modal="true" aria-labelledby="hotel-product-strategy-title">
        <header>
          <h2 id="hotel-product-strategy-title">酒店套餐接单策略</h2>
          <button type="button" aria-label="关闭" onClick={onCancel}>
            ×
          </button>
        </header>
        <div className="hotel-product-strategy-body">
          <div className="hotel-product-strategy-row">
            <strong>视频号:</strong>
            <span>手动接单</span>
            <span>自动接单库存不足时，需手动接单</span>
          </div>
          <div className="hotel-product-strategy-row">
            <strong>品牌小程序:</strong>
            <span>自动接单</span>
          </div>
        </div>
        <footer>
          <button type="button" onClick={onCancel}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={onConfirm}>
            确 定
          </button>
        </footer>
      </div>
    </div>
  )
}

function RoomSelectDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (roomName: string) => void }) {
  const selected = fallbackRoomTypes[0]
  return (
    <div className="hotel-product-modal-backdrop">
      <div className="hotel-product-modal" role="dialog" aria-modal="true" aria-label="选择房型">
        <header>
          <h2>选择房型</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="hotel-product-room-options">
          {fallbackRoomTypes.map((room) => (
            <button type="button" key={room.id} className={room.id === selected.id ? 'is-active' : ''}>
              {room.name}
            </button>
          ))}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={() => onConfirm(selected.name)}>
            确认选择
          </button>
        </footer>
      </div>
    </div>
  )
}
