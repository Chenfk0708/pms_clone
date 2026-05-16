import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './HotelProductPage.css'

type FilterKey = 'roomType' | 'channel'
type EditTab = '商品信息' | '套餐设置' | '售卖规则'

const storeName = '天落会宿公寓(前海壹方城宝安中心店)'

const filterOptions: Record<FilterKey, string[]> = {
  roomType: ['顶层套房（浴缸巨幕电竞麻将）', '总裁套间（桑拿浴缸露台电竞麻将）', '天落大床电竞套间', '观影大床房'],
  channel: ['携程', '美团酒店', '飞猪淘酒店', '美团民宿', '途家', '木鸟', '小猪', '路客云聚合'],
}

const filters: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: 'roomType', label: '关联房型', placeholder: '请选择' },
  { key: 'channel', label: '渠道', placeholder: '请选择渠道' },
]

const tableColumns = ['', '商品标题', '关联房型', '关联渠道', '库存', '售价(元)', '加价(元)', '创建时间', '更新时间', '操作']

const editTabs: EditTab[] = ['商品信息', '套餐设置', '售卖规则']

export function HotelProductPage() {
  const location = useLocation()
  const isEdit = location.pathname.endsWith('/edit')

  return isEdit ? <HotelProductEditPage /> : <HotelProductListPage />
}

function HotelProductListPage() {
  const navigate = useNavigate()
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [values, setValues] = useState<Record<FilterKey, string>>({
    roomType: '',
    channel: '',
  })
  const [keyword, setKeyword] = useState('')
  const [isStrategyOpen, setIsStrategyOpen] = useState(false)

  const currentFilter = openFilter ? filters.find((filter) => filter.key === openFilter) : null

  function chooseFilter(value: string) {
    if (!openFilter) return
    setValues((current) => ({ ...current, [openFilter]: value }))
    setOpenFilter(null)
  }

  function resetFilters() {
    setValues({ roomType: '', channel: '' })
    setKeyword('')
    setOpenFilter(null)
  }

  return (
    <div className="hotel-product-page">
      <h1 className="hotel-product-title">酒店套餐</h1>

      <section className="hotel-product-query" aria-label="酒店套餐筛选">
        <div className="hotel-product-store-tabs" aria-label="门店筛选">
          <button type="button" className="is-active">
            全部门店
          </button>
          <button type="button">{storeName}</button>
          <button type="button" className="hotel-product-gear" aria-label="门店设置">
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
              value={values[filter.key]}
              isOpen={openFilter === filter.key}
              onToggle={() => setOpenFilter(openFilter === filter.key ? null : filter.key)}
            />
          ))}
          <div className="hotel-product-actions">
            <button type="button" onClick={resetFilters}>
              重 置
            </button>
            <button type="button" className="is-primary" onClick={() => setOpenFilter(null)}>
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
            {filterOptions[currentFilter.key].map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={values[currentFilter.key] === option}
                onClick={() => chooseFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="hotel-product-main" aria-label="酒店套餐列表">
        <div className="hotel-product-toolbar">
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

        <div className="hotel-product-table" role="table" aria-label="酒店套餐列表">
          <div className="hotel-product-table__head" role="row">
            {tableColumns.map((column, index) => (
              <div key={`${column}-${index}`} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          <div className="hotel-product-empty" role="row">
            <div role="cell" aria-colspan={tableColumns.length}>
              <span className="hotel-product-empty__icon" aria-hidden="true" />
              <strong>暂无数据</strong>
            </div>
          </div>
        </div>
      </section>

      {isStrategyOpen ? <StrategyDialog onClose={() => setIsStrategyOpen(false)} /> : null}
    </div>
  )
}

function HotelProductEditPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<EditTab>('商品信息')

  return (
    <div className="hotel-product-edit-page">
      <h1 className="hotel-product-title">酒店套餐</h1>
      <div className="hotel-product-breadcrumb">酒店套餐 / 创建酒店套餐</div>

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
        {activeTab === '商品信息' ? <ProductInfoForm /> : null}
        {activeTab === '套餐设置' ? <PackageSettingForm /> : null}
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
            <button type="button" className="is-primary">
              保 存
            </button>
          )}
        </footer>
      </section>
    </div>
  )
}

function ProductInfoForm() {
  return (
    <>
      <FormSection title="基本信息">
        <label className="hotel-product-form-row">
          <span>商品标题</span>
          <input placeholder="请输入商品标题" />
        </label>
        <div className="hotel-product-form-row hotel-product-upload">
          <span>商品图片</span>
          <button type="button">上传图片</button>
          <p>建议尺寸：1200*1200像素</p>
        </div>
        <div className="hotel-product-form-row hotel-product-room-bind">
          <span>关联房型</span>
          <div>
            <strong>品牌小程序</strong>
            <button type="button">+ 选择房型</button>
          </div>
          <div>
            <strong>视频号</strong>
            <button type="button">+ 选择房型</button>
          </div>
        </div>
      </FormSection>

      <FormSection title="预定信息">
        <label className="hotel-product-form-row">
          <span>预定电话</span>
          <input placeholder="请输入手机号码或座机号码（如：010-12345678）" />
        </label>
        <label className="hotel-product-form-row hotel-product-textarea-row">
          <span>预定说明</span>
          <textarea placeholder="请输入预定说明" />
        </label>
      </FormSection>
    </>
  )
}

function PackageSettingForm() {
  return (
    <FormSection title="套餐设置">
      <div className="hotel-product-package-toolbar">
        <button type="button">添加套餐</button>
      </div>
      <div className="hotel-product-package-table" role="table" aria-label="套餐设置表格">
        <div role="row">
          <div role="columnheader">日期</div>
          <div role="columnheader">库存</div>
          <div role="columnheader">加价金额</div>
          <div role="columnheader">操作</div>
        </div>
        <div role="row">
          <div role="cell">暂无数据</div>
        </div>
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

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="hotel-product-form-section">
      <h2>{title}</h2>
      <div className="hotel-product-form-grid">{children}</div>
    </section>
  )
}

function FilterSelect({
  filter,
  value,
  isOpen,
  onToggle,
}: {
  filter: { key: FilterKey; label: string; placeholder: string }
  value: string
  isOpen: boolean
  onToggle: () => void
}) {
  const displayValue = value || filter.placeholder

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

function StrategyDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="hotel-product-modal-backdrop">
      <div className="hotel-product-modal" role="dialog" aria-modal="true" aria-labelledby="hotel-product-strategy-title">
        <header>
          <h2 id="hotel-product-strategy-title">酒店套餐接单策略</h2>
          <button type="button" aria-label="关闭" onClick={onClose}>
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
          <button type="button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="is-primary" onClick={onClose}>
            确 定
          </button>
        </footer>
      </div>
    </div>
  )
}
