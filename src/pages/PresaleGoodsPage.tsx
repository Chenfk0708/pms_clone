import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
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
type EditStep = 1 | 2

const filterMeta: Array<{ key: FilterKey; label: string; placeholder: string; optionKey: keyof PresaleGoodsData['options'] }> = [
  { key: 'channelId', label: '渠道', placeholder: '请选择渠道', optionKey: 'channels' },
  { key: 'ticketType', label: '卡券类型', placeholder: '全部', optionKey: 'ticketTypes' },
  { key: 'categoryId', label: '商品类目', placeholder: '请选择商品类目', optionKey: 'categories' },
  { key: 'shelfStatus', label: '上架状态', placeholder: '全部', optionKey: 'shelfStatuses' },
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
  const realStoreOptions = data?.options.stores ?? []
  const canSwitchStore = realStoreOptions.length > 1
  const storeOptions = useMemo(
    () => [{ value: '', label: '全部门店' }, ...(data?.options.stores ?? [])],
    [data?.options.stores],
  )
  const statusTabs = data?.options.shelfStatuses ?? [
    { value: '', label: '全部' },
    { value: 'selling', label: '销售中' },
    { value: 'soldOut', label: '已售罄' },
    { value: 'warehouse', label: '仓库中' },
  ]
  const rows = data?.rows ?? []

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
    setNotice(value ? '已切换当前门店' : '已切换到全部门店')
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
    window.setTimeout(() => setNotice('数据已刷新'), 120)
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
    setNotice(row.status === 'warehouse' ? `${row.name} 已上架销售` : `${row.name} 已放入仓库`)
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
              aria-label={`当前门店 ${selectedStore?.label ?? ''}`}
              onClick={() => {
                if (!canSwitchStore) {
                  if (defaultStore?.value !== undefined) chooseStore(defaultStore.value)
                  return
                }
                setOpenFilter(openFilter === 'store' ? null : 'store')
              }}
            >
              {defaultStore?.label ?? '加载门店中'}
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
            ⚙
          </button>
        </div>
        <div className="presale-goods-query__grid">
          {filterMeta.map((filter) => (
            <FilterSelect
              key={filter.key}
              filter={filter}
              options={data?.options[filter.optionKey] ?? []}
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
            重 置
          </button>
          <button type="button" className="is-primary" onClick={applySearch} disabled={isLoading}>
            搜 索
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
          {isLoading ? <div className="presale-goods-loading" role="status">正在加载预售券商品</div> : null}
          {notice ? (
            <div className="presale-goods-notice" role="status">
              {notice}
            </div>
          ) : null}
          {error ? (
            <div className="presale-goods-error" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => {
                setIsLoading(true)
                setError('')
                setReloadKey((key) => key + 1)
              }}>
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
            <div className="presale-goods-empty" role="status" aria-label="预售券空态">
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
          <span>第 {data?.pagination.page ?? 1} / {Math.max(1, Math.ceil((data?.pagination.total ?? 0) / (data?.pagination.pageSize ?? 20)))} 页</span>
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
        <div className="presale-goods-skus" aria-label={`${row.name}规格`}>
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
            ×
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
  const [notice, setNotice] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const [specCount, setSpecCount] = useState(1)

  function show(message: string) {
    setNotice(message)
  }

  return (
    <div className="presale-goods-edit-page">
      <h1 className="sr-only-heading">预售券</h1>
      <div className="presale-goods-edit-steps" aria-label="预售券编辑步骤">
        <span className={step === 1 ? 'is-active' : ''}>1编辑基础信息</span>
        <span className={step === 2 ? 'is-active' : ''}>2编辑产品介绍</span>
      </div>

      {notice ? <div className="presale-goods-notice" role="status">{notice}</div> : null}

      {step === 1 ? (
        <section className="presale-goods-edit-card" aria-label="编辑基础信息">
          <fieldset className="presale-goods-radio-row">
            <legend>商品类型</legend>
            {[
              ['虚拟商品', '虚拟商品(无需物流)'],
              ['实物商品', '实物商品(物流发货)'],
              ['电子卡券', '电子卡券(无需物流)'],
            ].map(([value, label], index) => (
              <label key={value}>
                <input
                  type="radio"
                  name="goodsType"
                  aria-label={`商品类型 ${value}`}
                  defaultChecked={index === 0}
                  onChange={() => show(`已选择${value}`)}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <FormSection title="基本信息">
            <label>
              <span>商品名称</span>
              <input aria-label="商品名称" placeholder="请输入" onChange={() => show('商品名称已更新')} />
            </label>
            <label>
              <span>商品类目</span>
              <button type="button" className="presale-goods-select" onClick={() => show('已打开商品类目选择')}>
                请选择
              </button>
            </label>
            <div className="presale-goods-upload">
              <span>商品图片</span>
              <button type="button" onClick={() => show('商品图片已加入上传队列')}>上传</button>
              <p>建议尺寸：690*310像素，你可以拖拽图片上传，最多上传15张。最少一张</p>
            </div>
            <fieldset className="presale-goods-radio-row">
              <legend>卡券类型</legend>
              <label>
                <input type="radio" name="ticketMode" defaultChecked onChange={() => show('已选择普通卡券')} />
                普通卡券
              </label>
              <label>
                <input type="radio" name="ticketMode" onChange={() => show('已选择日历卡券')} />
                日历卡券
              </label>
              <p>卡券类型首次上架后将无法修改，请谨慎选择。</p>
            </fieldset>
            <label>
              <span>适用门店</span>
              <button type="button" className="presale-goods-select" onClick={() => show('已打开适用门店选择')}>
                全部
              </button>
            </label>
          </FormSection>

          <FormSection title="规格库存">
            <label>
              <span>商品规格</span>
              <button type="button" aria-label="添加规格" onClick={() => {
                setSpecCount((count) => count + 1)
                show('已添加默认规格')
              }}>
                添加规格
              </button>
              <em>当前 {specCount} 个规格</em>
            </label>
          </FormSection>

          <FormSection title="售卖设置">
            <SelectAction label="有效期" value="长期有效" message="已打开有效期设置" onShow={show} />
            <SelectAction label="提前预订" value="无需预约" message="已打开提前预订设置" onShow={show} />
            <SelectAction label="退改规则" value="支持退款申请" message="已打开退改规则设置" onShow={show} />
            <label>
              <span>使用说明</span>
              <textarea placeholder="请输入内容" onChange={() => show('使用说明已更新')} />
            </label>
            <label>
              <span>买家填写</span>
              <button type="button" onClick={() => show('已添加买家填写项')}>添加内容</button>
              <em>买家购买商品时，所需要填写的信息/留言（买家必填手机号码）</em>
            </label>
          </FormSection>

          <FormSection title="其他设置">
            <SelectAction label="库存扣减方式" value="拍下减库存" message="已选择拍下减库存" onShow={show} />
            <SelectAction label="开售时间" value="立即开售" message="已选择立即开售" onShow={show} />
          </FormSection>

          <footer className="presale-goods-edit-footer">
            <button type="button" onClick={() => navigate('/mallManagement/goodsManagement')}>
              返回列表
            </button>
            <button type="button" onClick={() => show('草稿已保存')}>
              保存草稿
            </button>
            <button type="button" className="is-primary" onClick={() => setStep(2)}>
              下一步
            </button>
          </footer>
        </section>
      ) : (
        <section className="presale-goods-edit-card" aria-label="编辑产品介绍">
          <FormSection title="产品介绍">
            <div className="presale-goods-intro-tools">
              <button type="button" onClick={() => show('已添加菜单模块')}>添加菜单</button>
              <button type="button" onClick={() => show('已添加文本框')}>添加文本框</button>
            </div>
            <textarea placeholder="请输入产品介绍" onChange={() => show('产品介绍已更新')} />
          </FormSection>
          <footer className="presale-goods-edit-footer">
            <button type="button" onClick={() => setStep(1)}>
              上一步
            </button>
            <button type="button" onClick={() => navigate('/mallManagement/goodsManagement')}>
              返回列表
            </button>
            <button type="button" onClick={() => {
              setPreviewOpen(true)
              show('预览已打开')
            }}>
              预览
            </button>
            <button type="button" className="is-primary" onClick={() => show('预售券发布成功')}>
              发 布
            </button>
          </footer>
        </section>
      )}

      {previewOpen ? (
        <div className="presale-goods-dialog-mask" role="presentation" onMouseDown={() => setPreviewOpen(false)}>
          <section className="presale-goods-dialog" role="dialog" aria-label="预售券预览" onMouseDown={(event) => event.stopPropagation()}>
            <header>
              <strong>预售券预览</strong>
              <button type="button" aria-label="关闭预览" onClick={() => setPreviewOpen(false)}>×</button>
            </header>
            <p>当前预售券草稿可进入提交审核流程。</p>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="presale-goods-form-section">
      <h2>{title}</h2>
      <div className="presale-goods-form-grid">{children}</div>
    </section>
  )
}

function SelectAction({
  label,
  value,
  message,
  onShow,
}: {
  label: string
  value: string
  message: string
  onShow: (message: string) => void
}) {
  return (
    <label>
      <span>{label}</span>
      <button type="button" className="presale-goods-select" onClick={() => onShow(message)}>
        {value}
      </button>
    </label>
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
          className="presale-goods-select"
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
