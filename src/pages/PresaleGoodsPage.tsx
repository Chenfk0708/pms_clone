import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  PresaleGoodsServiceError,
  defaultPresaleGoodsFilters,
  loadPresaleGoodsData,
  type PresaleGoodsData,
  type PresaleGoodsFilters,
  type PresaleGoodsRow,
  type PresaleGoodsScenario,
  type SelectOption,
} from '../services/presaleGoods'
import './PresaleGoodsPage.css'

type FilterKey = 'channelId' | 'ticketType' | 'categoryId' | 'shelfStatus'
type OpenMenuKey = FilterKey | 'store'
type EditMenuKey = 'category' | 'store' | 'booking'
type EditStep = 1 | 2
type GoodsType = 'virtual' | 'physical' | 'ecard'
type TicketMode = 'normal' | 'calendar'
type ValidityMode = 'longTerm' | 'dated'
type RefundMode = 'supported' | 'unsupported'
type InventoryDeductionMode = 'placeOrder' | 'pay'
type SaleMode = 'immediate' | 'warehouse'

const filterMeta: Array<{ key: FilterKey; label: string; placeholder: string; optionKey: keyof PresaleGoodsData['options'] }> = [
  { key: 'channelId', label: '渠道', placeholder: '请选择渠道', optionKey: 'channels' },
  { key: 'ticketType', label: '卡券类型', placeholder: '全部', optionKey: 'ticketTypes' },
  { key: 'categoryId', label: '商品类目', placeholder: '请选择商品类目', optionKey: 'categories' },
  { key: 'shelfStatus', label: '上架状态', placeholder: '全部', optionKey: 'shelfStatuses' },
]

const topChannelOptions: SelectOption[] = [
  { value: '', label: '请选择渠道' },
  { value: '5', label: '携程' },
  { value: '1003', label: '美团酒店' },
  { value: '8', label: '飞猪淘酒店' },
  { value: '3', label: '美团民宿' },
  { value: '2', label: '途家' },
  { value: '21', label: '木鸟' },
  { value: '4', label: '小猪' },
  { value: '17', label: '路客云聚合' },
]

const topShelfStatusOptions: SelectOption[] = [
  { value: '', label: '全部' },
  { value: 'listed', label: '已上架' },
  { value: 'unlisted', label: '已下架' },
]

const tableColumns = [
  '全部展开',
  '商品名称',
  '商品类目',
  '商品类型',
  '关联渠道',
  '库存',
  '售价（元）',
  '原价（元）',
  '创建时间',
  '更新时间',
  '操作',
]

const editStoreOptions: SelectOption[] = [
  { value: '', label: '全部' },
  { value: '1796425098638573570', label: '天洛会宿公寓(前海壹方城宝安中心店)' },
]

const editCategoryOptions: SelectOption[] = [
  { value: '14', label: '房券' },
  { value: '16', label: '餐饮券' },
  { value: '17', label: '套餐' },
  { value: '19', label: '酒店套餐' },
]

const editBookingOptions: SelectOption[] = [
  { value: 'none', label: '无需预约' },
  { value: '1day', label: '提前1天预约' },
  { value: '2day', label: '提前2天预约' },
]

const goodsTypeOptions: Array<{ value: GoodsType; label: string; description: string }> = [
  { value: 'virtual', label: '虚拟商品', description: '虚拟商品(无需物流)' },
  { value: 'physical', label: '实物商品', description: '实物商品(物流发货)' },
  { value: 'ecard', label: '电子卡券', description: '电子卡券(无需物流)' },
]

const ticketModeOptions: Array<{ value: TicketMode; label: string }> = [
  { value: 'normal', label: '普通卡券' },
  { value: 'calendar', label: '日历卡券' },
]

const validityOptions: Array<{ value: ValidityMode; label: string }> = [
  { value: 'longTerm', label: '长期有效' },
  { value: 'dated', label: '有效期内可用' },
]

const refundOptions: Array<{ value: RefundMode; label: string }> = [
  { value: 'supported', label: '支持退款申请' },
  { value: 'unsupported', label: '不支持退款申请' },
]

const inventoryDeductionOptions: Array<{ value: InventoryDeductionMode; label: string }> = [
  { value: 'placeOrder', label: '拍下减库存' },
  { value: 'pay', label: '付款减库存' },
]

const saleModeOptions: Array<{ value: SaleMode; label: string }> = [
  { value: 'immediate', label: '立即开售' },
  { value: 'warehouse', label: '放入仓库' },
]

const maxUploadCount = 15

export function PresaleGoodsPage() {
  const location = useLocation()
  const isEdit = location.pathname.endsWith('/edit')

  return isEdit ? <PresaleGoodsEditPage /> : <PresaleGoodsListPage />
}

function PresaleGoodsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const scenario = readScenario(location.search)
  const [openFilter, setOpenFilter] = useState<OpenMenuKey | null>(null)
  const [filters, setFilters] = useState<PresaleGoodsFilters>(defaultPresaleGoodsFilters)
  const [draftKeyword, setDraftKeyword] = useState('')
  const [data, setData] = useState<PresaleGoodsData | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [detailRow, setDetailRow] = useState<PresaleGoodsRow | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    loadPresaleGoodsData(filters, scenario)
      .then((nextData) => {
        if (ignore) return
        setData(nextData)
      })
      .catch((loadError: unknown) => {
        if (ignore) return
        setData(null)
        setError(loadError instanceof PresaleGoodsServiceError ? loadError.message : String(loadError))
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [filters, scenario, reloadKey])

  const selectedStore = data?.options.stores.find((store) => store.value === filters.poiId)
  const defaultStore = data?.options.stores.find((store) => store.value) ?? data?.options.stores[0]
  const currentStoreLabel = selectedStore?.label ?? defaultStore?.label ?? '加载门店中'
  const realStoreOptions = data?.options.stores ?? []
  const canSwitchStore = realStoreOptions.length > 1
  const storeOptions = useMemo(
    () => [{ value: '', label: '全部门店' }, ...(data?.options.stores ?? [])],
    [data?.options.stores],
  )
  const statusTabs = data?.options.shelfStatuses ?? topShelfStatusOptions
  const rows = data?.rows ?? []

  function resolveFilterOptions(filter: { key: FilterKey; optionKey: keyof PresaleGoodsData['options'] }) {
    if (filter.key === 'channelId') return topChannelOptions
    if (filter.key === 'shelfStatus') return topShelfStatusOptions
    return data?.options[filter.optionKey] ?? []
  }

  function chooseFilter(value: string) {
    if (!openFilter || openFilter === 'store') return
    setIsLoading(true)
    setError('')
    setFilters((current) => ({ ...current, [openFilter]: value, page: 1 }))
    setOpenFilter(null)
  }

  function chooseStore(value: string) {
    setIsLoading(true)
    setError('')
    setFilters((current) => ({ ...current, poiId: value, page: 1 }))
    setOpenFilter(null)
    setNotice(value ? '已切换到当前门店' : '已切换到全部门店')
  }

  function applySearch() {
    setOpenFilter(null)
    setIsLoading(true)
    setError('')
    setNotice('已按当前条件更新预售券列表')
    setFilters((current) => ({ ...current, keyword: draftKeyword, page: 1 }))
  }

  function resetFilters() {
    setIsLoading(true)
    setError('')
    setFilters(defaultPresaleGoodsFilters)
    setDraftKeyword('')
    setExpanded(false)
    setOpenFilter(null)
    setNotice('筛选条件已重置')
  }

  function refreshData() {
    setIsLoading(true)
    setError('')
    setNotice('数据刷新中')
    setReloadKey((key) => key + 1)
  }

  function exportRows() {
    setNotice('已生成预售券导出任务')
  }

  function toggleAllRows() {
    const nextExpanded = !expanded
    setExpanded(nextExpanded)
    setNotice(nextExpanded ? `已展开 ${rows.length} 个预售券规格` : '已收起全部预售券规格')
  }

  function toggleShelf(row: PresaleGoodsRow) {
    setNotice(row.status === 'warehouse' ? `${row.name} 已上架` : `${row.name} 已下架`)
  }

  return (
    <div className="presale-goods-page">
      <h1 className="sr-only-heading">预售券</h1>

      <section className="presale-goods-query" aria-label="预售券商品筛选">
        <div className="presale-goods-storebar" aria-label="门店切换">
          <button
            type="button"
            className={`presale-goods-storebar__tab${filters.poiId ? '' : ' is-active'}`}
            aria-label="全部门店"
            onClick={() => chooseStore('')}
          >
            全部门店
          </button>
          <div className="presale-goods-storebar__current">
            <button
              type="button"
              className={`presale-goods-storebar__tab${filters.poiId ? ' is-active' : ''}`}
              aria-haspopup={canSwitchStore ? 'listbox' : undefined}
              aria-expanded={canSwitchStore ? openFilter === 'store' : undefined}
              aria-label={`当前门店 ${currentStoreLabel}`}
              onClick={() => {
                if (!canSwitchStore) {
                  if (defaultStore?.value !== undefined) chooseStore(defaultStore.value)
                  return
                }
                setOpenFilter(openFilter === 'store' ? null : 'store')
              }}
            >
              {currentStoreLabel}
            </button>
            {canSwitchStore && openFilter === 'store' ? (
              <div className="presale-goods-storebar__options" role="listbox" aria-label="门店列表">
                {storeOptions.map((option) => (
                  <button
                    key={option.value || option.label}
                    type="button"
                    role="option"
                    aria-selected={filters.poiId === option.value}
                    onClick={() => chooseStore(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            className="presale-goods-storebar__setting"
            aria-label="门店设置"
            onClick={() => navigate('/InformationMaintenance/campInfo')}
          >
            *
          </button>
        </div>
        <div className="presale-goods-query__grid">
          {filterMeta.map((filter) => (
            <FilterSelect
              key={filter.key}
              filter={filter}
              options={resolveFilterOptions(filter)}
              value={filters[filter.key]}
              isOpen={openFilter === filter.key}
              onToggle={() => setOpenFilter(openFilter === filter.key ? null : filter.key)}
              onChoose={(nextValue) => chooseFilter(nextValue)}
            />
          ))}
          <label className="presale-goods-field presale-goods-keyword">
            <span>搜索</span>
            <input
              value={draftKeyword}
              placeholder="请输入商品编号/商品名称"
              onChange={(event) => setDraftKeyword(event.target.value)}
            />
          </label>
        </div>

        <div className="presale-goods-actions">
          <button type="button" onClick={resetFilters} disabled={isLoading}>
            重置
          </button>
          <button type="button" className="is-primary" onClick={applySearch} disabled={isLoading}>
            搜索
          </button>
        </div>
      </section>

      <section className="presale-goods-main" aria-label="预售券商品列表">
        <div className="presale-goods-toolbar">
          <div className="presale-goods-tabs" role="tablist" aria-label="上架状态">
            {statusTabs.map((tab) => (
              <button
                key={tab.value || 'all'}
                type="button"
                role="tab"
                aria-selected={filters.shelfStatus === tab.value}
                className={filters.shelfStatus === tab.value ? 'is-active' : ''}
                onClick={() => {
                  setIsLoading(true)
                  setError('')
                  setFilters((current) => ({ ...current, shelfStatus: tab.value, page: 1 }))
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="presale-goods-toolbar__actions">
            <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo')}>
              门店管理
            </button>
            <button type="button" onClick={refreshData} disabled={isLoading}>
              刷新
            </button>
            <button type="button" onClick={exportRows} disabled={isLoading || rows.length === 0}>
              导出
            </button>
            <button type="button" className="is-primary" onClick={() => navigate('/mallManagement/goodsManagement/edit')}>
              新增预售券
            </button>
            <button type="button" onClick={toggleAllRows} disabled={isLoading || rows.length === 0}>
              全部展开
            </button>
          </div>
        </div>

        <div className="presale-goods-statebar">
          {isLoading ? <div className="presale-goods-loading" role="status">正在加载预售券商品...</div> : null}
          {notice ? (
            <div className="presale-goods-notice" role="status">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="presale-goods-error" role="alert">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  setIsLoading(true)
                  setError('')
                  setReloadKey((key) => key + 1)
                }}
              >
                重试
              </button>
            </div>
          ) : null}
        </div>

        <div className="presale-goods-table" role="table" aria-label="预售券商品表格">
          <div className="presale-goods-table__head" role="row">
            {tableColumns.map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          {!isLoading && !error && rows.length === 0 ? (
            <div className="presale-goods-empty" role="status" aria-label="预售券空状态">
              <span className="presale-goods-empty__icon" aria-hidden="true" />
              <strong>暂无符合条件的预售券</strong>
            </div>
          ) : null}
          {!isLoading && !error
            ? rows.map((row) => (
                <PresaleGoodsTableRow
                  key={row.id}
                  row={row}
                  expanded={expanded}
                  onDetail={() => setDetailRow(row)}
                  onToggleShelf={() => toggleShelf(row)}
                />
              ))
            : null}
        </div>

        <footer className="presale-goods-footer">
          <span>共 {data?.pagination.total ?? 0} 条</span>
          <span>
            第 {data?.pagination.page ?? 1} / {Math.max(1, Math.ceil((data?.pagination.total ?? 0) / (data?.pagination.pageSize ?? 20)))} 页
          </span>
          <span>Trace {data?.traceId ?? '--'}</span>
        </footer>
      </section>

      <output data-testid="presale-goods-request" className="presale-goods-request-audit" aria-hidden="true">
        {data?.requestEcho ?? ''}
      </output>

      {detailRow ? <PresaleGoodsDetailDialog row={detailRow} onClose={() => setDetailRow(null)} /> : null}
    </div>
  )
}

function PresaleGoodsTableRow({
  row,
  expanded,
  onDetail,
  onToggleShelf,
}: {
  row: PresaleGoodsRow
  expanded: boolean
  onDetail: () => void
  onToggleShelf: () => void
}) {
  return (
    <div className={`presale-goods-row-wrap${expanded ? ' is-expanded' : ''}`}>
      <div className="presale-goods-row" role="row">
        <div role="cell">{expanded ? '已展开' : '可展开'}</div>
        <div role="cell">
          <strong>{row.name}</strong>
          <span>{row.statusLabel}</span>
        </div>
        <div role="cell">{row.categoryName}</div>
        <div role="cell">{row.ticketTypeLabel}</div>
        <div role="cell">{row.channels}</div>
        <div role="cell">{row.stockLabel}</div>
        <div role="cell">{row.sellingPrice}</div>
        <div role="cell">{row.originalPrice}</div>
        <div role="cell">{row.createdAt}</div>
        <div role="cell">{row.updatedAt}</div>
        <div role="cell" className="presale-goods-row-actions">
          <button type="button" onClick={onDetail} aria-label={`查看 ${row.name}`}>
            查看
          </button>
          <button type="button" onClick={onToggleShelf}>
            {row.status === 'warehouse' ? '上架' : '下架'}
          </button>
        </div>
      </div>
      {expanded ? (
        <div className="presale-goods-skus" aria-label={`${row.name} 规格`}>
          {row.products.map((product) => (
            <div key={product.id}>
              <span>{product.name}</span>
              <span>库存 {product.stock}</span>
              <span>{product.sellingPrice}</span>
              <span>{product.originalPrice}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PresaleGoodsDetailDialog({ row, onClose }: { row: PresaleGoodsRow; onClose: () => void }) {
  return (
    <div className="presale-goods-dialog-mask" role="presentation" onMouseDown={onClose}>
      <section
        className="presale-goods-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="预售券详情"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <strong>{row.name}</strong>
          <button type="button" aria-label="关闭详情" onClick={onClose}>
            x
          </button>
        </header>
        <dl>
          <div>
            <dt>商品类目</dt>
            <dd>{row.categoryName}</dd>
          </div>
          <div>
            <dt>卡券类型</dt>
            <dd>{row.ticketTypeLabel}</dd>
          </div>
          <div>
            <dt>关联渠道</dt>
            <dd>{row.channels}</dd>
          </div>
          <div>
            <dt>退改规则</dt>
            <dd>{row.refundRule}</dd>
          </div>
        </dl>
        <p>{row.description}</p>
      </section>
    </div>
  )
}

function PresaleGoodsEditPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<EditStep>(1)
  const [openMenu, setOpenMenu] = useState<EditMenuKey | null>(null)
  const [notice, setNotice] = useState('')
  const [goodsType, setGoodsType] = useState<GoodsType>('virtual')
  const [goodsName, setGoodsName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [ticketMode, setTicketMode] = useState<TicketMode>('normal')
  const [storeValue, setStoreValue] = useState('')
  const [specCount, setSpecCount] = useState(1)
  const [validityMode, setValidityMode] = useState<ValidityMode>('longTerm')
  const [bookingValue, setBookingValue] = useState('none')
  const [refundMode, setRefundMode] = useState<RefundMode>('supported')
  const [usageNote, setUsageNote] = useState('')
  const [inventoryDeductionMode, setInventoryDeductionMode] = useState<InventoryDeductionMode>('placeOrder')
  const [saleMode, setSaleMode] = useState<SaleMode>('immediate')
  const [introText, setIntroText] = useState('')
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const categoryLabel = editCategoryOptions.find((option) => option.value === categoryId)?.label ?? '请选择'
  const storeLabel = editStoreOptions.find((option) => option.value === storeValue)?.label ?? '全部'
  const bookingLabel = editBookingOptions.find((option) => option.value === bookingValue)?.label ?? '无需预约'
  const refundHelper =
    refundMode === 'supported'
      ? '卡券核销前可随时退，核销后不退不换。'
      : '商品售出后不支持退款，请在商品详情中明确说明。'

  function show(message: string) {
    setNotice(message)
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files ?? [])
    if (nextFiles.length === 0) return

    setUploadedFiles((current) => [...current, ...nextFiles].slice(0, maxUploadCount))
    show(`已添加 ${Math.min(maxUploadCount, uploadedFiles.length + nextFiles.length)} 张商品图片`)
    event.target.value = ''
  }

  return (
    <div className="presale-goods-edit-page">
      <h1 className="sr-only-heading">预售券</h1>

      <div className="presale-goods-edit-steps" aria-label="预售券编辑步骤">
        <span className={step === 1 ? 'is-active' : ''}>编辑基础信息</span>
        <span className={step === 2 ? 'is-active' : ''}>编辑产品介绍</span>
      </div>

      {notice ? <div className="presale-goods-notice" role="status">{notice}</div> : null}

      {step === 1 ? (
        <section className="presale-goods-edit-card" aria-label="编辑基础信息">
          <fieldset className="presale-goods-type-options">
            <legend>商品类型</legend>
            {goodsTypeOptions.map((option) => (
              <label key={option.value} className={`presale-goods-type-option${goodsType === option.value ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="goodsType"
                  checked={goodsType === option.value}
                  onChange={() => {
                    setGoodsType(option.value)
                    show(`已选择${option.label}`)
                  }}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </fieldset>

          <FormSection title="基础信息">
            <label>
              <span>商品名称</span>
              <input
                aria-label="商品名称"
                placeholder="请输入"
                value={goodsName}
                onChange={(event) => setGoodsName(event.target.value)}
              />
            </label>

            <EditSelect
              label="商品类目"
              valueLabel={categoryLabel}
              options={editCategoryOptions}
              isOpen={openMenu === 'category'}
              onToggle={() => setOpenMenu(openMenu === 'category' ? null : 'category')}
              onChoose={(value) => {
                setCategoryId(value)
                setOpenMenu(null)
                show(`已选择商品类目：${editCategoryOptions.find((option) => option.value === value)?.label ?? ''}`)
              }}
            />

            <div className="presale-goods-upload">
              <span>商品图片</span>
              <div className="presale-goods-upload-card">
                <label className="presale-goods-upload-trigger">
                  上传
                  <input
                    className="presale-goods-upload-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUpload}
                  />
                </label>
                <div className="presale-goods-upload-meta">
                  <p>建议尺寸：690*310像素，你可以拖拽图片上传，最多上传15张。最少一张</p>
                  <span>已上传 {uploadedFiles.length} / {maxUploadCount}</span>
                </div>
                {uploadedFiles.length ? (
                  <ul className="presale-goods-upload-list" aria-label="已上传图片">
                    {uploadedFiles.map((file) => (
                      <li key={`${file.name}-${file.lastModified}`}>{file.name}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <SegmentedField
              label="卡券类型"
              value={ticketMode}
              options={ticketModeOptions}
              onChange={(value) => {
                setTicketMode(value)
                show(`已切换为${ticketModeOptions.find((option) => option.value === value)?.label ?? ''}`)
              }}
              helper="卡券类型首次上架后将无法修改，请谨慎选择。"
            />

            <EditSelect
              label="适用门店"
              valueLabel={storeLabel}
              options={editStoreOptions}
              isOpen={openMenu === 'store'}
              onToggle={() => setOpenMenu(openMenu === 'store' ? null : 'store')}
              onChoose={(value) => {
                setStoreValue(value)
                setOpenMenu(null)
                show(`已切换适用门店：${editStoreOptions.find((option) => option.value === value)?.label ?? '全部'}`)
              }}
            />
          </FormSection>

          <FormSection
            title="规格库存"
            actions={
              <button
                type="button"
                onClick={() => {
                  setSpecCount((count) => count + 1)
                  show('已添加一个新规格')
                }}
              >
                添加规格
              </button>
            }
          >
            <div className="presale-goods-edit-field">
              <span className="presale-goods-edit-field__label">商品规格</span>
              <div className="presale-goods-edit-inline">
                <strong>默认规格</strong>
                <span>当前已创建 {specCount} 个规格</span>
              </div>
              <p className="presale-goods-edit-helper">可继续添加多规格商品，当前先保留与目标页一致的基础库存结构。</p>
            </div>
          </FormSection>

          <FormSection title="售卖设置">
            <SegmentedField
              label="有效期"
              value={validityMode}
              options={validityOptions}
              onChange={(value) => {
                setValidityMode(value)
                show(`已切换有效期：${validityOptions.find((option) => option.value === value)?.label ?? ''}`)
              }}
            />

            <EditSelect
              label="提前预订"
              valueLabel={bookingLabel}
              options={editBookingOptions}
              isOpen={openMenu === 'booking'}
              onToggle={() => setOpenMenu(openMenu === 'booking' ? null : 'booking')}
              onChoose={(value) => {
                setBookingValue(value)
                setOpenMenu(null)
                show(`已设置提前预订：${editBookingOptions.find((option) => option.value === value)?.label ?? ''}`)
              }}
            />

            <SegmentedField
              label="退改规则"
              value={refundMode}
              options={refundOptions}
              onChange={(value) => {
                setRefundMode(value)
                show(`已设置退改规则：${refundOptions.find((option) => option.value === value)?.label ?? ''}`)
              }}
              helper={refundHelper}
            />

            <label>
              <span>使用说明</span>
              <textarea
                placeholder="请输入内容"
                value={usageNote}
                onChange={(event) => setUsageNote(event.target.value)}
              />
            </label>

            <div className="presale-goods-edit-field">
              <span className="presale-goods-edit-field__label">买家填写</span>
              <div className="presale-goods-edit-inline">
                <button type="button" onClick={() => show('已添加一项买家填写内容')}>添加内容</button>
              </div>
              <p className="presale-goods-edit-helper">买家购买商品时，所需要填写的信息/留言（买家必填手机号码）</p>
            </div>
          </FormSection>

          <FormSection title="其他设置">
            <SegmentedField
              label="库存扣减方式"
              value={inventoryDeductionMode}
              options={inventoryDeductionOptions}
              onChange={(value) => {
                setInventoryDeductionMode(value)
                show(`已切换库存扣减方式：${inventoryDeductionOptions.find((option) => option.value === value)?.label ?? ''}`)
              }}
            />

            <SegmentedField
              label="开售时间"
              value={saleMode}
              options={saleModeOptions}
              onChange={(value) => {
                setSaleMode(value)
                show(`已切换开售时间：${saleModeOptions.find((option) => option.value === value)?.label ?? ''}`)
              }}
            />
          </FormSection>

          <footer className="presale-goods-edit-footer">
            <button type="button" onClick={() => navigate('/mallManagement/goodsManagement')}>
              返回列表
            </button>
            <button type="button" className="is-primary" onClick={() => setStep(2)}>
              下一步
            </button>
          </footer>
        </section>
      ) : (
        <section className="presale-goods-edit-card" aria-label="编辑产品介绍">
          <FormSection title="产品介绍">
            <div className="presale-goods-edit-field">
              <span className="presale-goods-edit-field__label">编辑工具</span>
              <div className="presale-goods-intro-tools">
                <button type="button" onClick={() => show('已添加图片模块')}>添加图片</button>
                <button type="button" onClick={() => show('已添加文本模块')}>添加文本</button>
              </div>
              <p className="presale-goods-edit-helper">可组合文本和图片说明商品使用方式、兑换规则和注意事项。</p>
            </div>

            <label>
              <span>详情内容</span>
              <textarea
                placeholder="请输入内容"
                value={introText}
                onChange={(event) => setIntroText(event.target.value)}
              />
            </label>
          </FormSection>

          <footer className="presale-goods-edit-footer">
            <button type="button" onClick={() => navigate('/mallManagement/goodsManagement')}>
              返回列表
            </button>
            <button type="button" onClick={() => setStep(1)}>
              上一步
            </button>
            <button type="button" className="is-primary" onClick={() => show('预售券已发布')}>
              发 布
            </button>
          </footer>
        </section>
      )}
    </div>
  )
}

function FormSection({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="presale-goods-form-section">
      <div className="presale-goods-form-section__header">
        <h2>{title}</h2>
        {actions}
      </div>
      <div className="presale-goods-form-grid">{children}</div>
    </section>
  )
}

function EditSelect({
  label,
  valueLabel,
  options,
  isOpen,
  onToggle,
  onChoose,
}: {
  label: string
  valueLabel: string
  options: SelectOption[]
  isOpen: boolean
  onToggle: () => void
  onChoose: (value: string) => void
}) {
  return (
    <div className="presale-goods-edit-field">
      <span className="presale-goods-edit-field__label">{label}</span>
      <div className="presale-goods-select-wrap">
        <button
          type="button"
          className="presale-goods-select"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`${label} ${valueLabel}`}
          onClick={onToggle}
        >
          {valueLabel}
        </button>
        {isOpen ? (
          <div className="presale-goods-options presale-goods-options--edit" role="listbox" aria-label={`${label}选项`}>
            {options.map((option) => (
              <button
                key={option.value || option.label}
                type="button"
                role="option"
                aria-selected={valueLabel === option.label}
                onClick={() => onChoose(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  helper?: string
}) {
  return (
    <div className="presale-goods-edit-field presale-goods-edit-segmented">
      <span className="presale-goods-edit-field__label">{label}</span>
      <div className="presale-goods-segmented" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? 'is-active' : ''}
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {helper ? <p className="presale-goods-edit-helper">{helper}</p> : null}
    </div>
  )
}

function FilterSelect({
  filter,
  options,
  value,
  isOpen,
  onToggle,
  onChoose,
}: {
  filter: { key: FilterKey; label: string; placeholder: string }
  options: SelectOption[]
  value: string
  isOpen: boolean
  onToggle: () => void
  onChoose: (value: string) => void
}) {
  const displayValue = useMemo(() => {
    const option = options.find((item) => item.value === value)
    return option?.label || filter.placeholder
  }, [filter.placeholder, options, value])

  return (
    <label className="presale-goods-field presale-goods-field--select">
      <span>{filter.label}</span>
      <div className="presale-goods-select-wrap">
        <button
          type="button"
          className={`presale-goods-select${filter.key === 'channelId' ? ' is-search' : ''}${filter.key === 'shelfStatus' ? ' is-status' : ''}`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={`${filter.label} ${displayValue}`}
          onClick={onToggle}
        >
          {displayValue}
        </button>
        {isOpen ? (
          <div className="presale-goods-options" role="listbox" aria-label={`${filter.label}选项`}>
            {options.map((option) => (
              <button
                key={option.value || option.label}
                type="button"
                role="option"
                aria-selected={value === option.value}
                onClick={() => onChoose(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </label>
  )
}

function readScenario(search: string): PresaleGoodsScenario {
  const value = new URLSearchParams(search).get('scenario')
  return value === 'empty' || value === 'error' ? value : 'success'
}
