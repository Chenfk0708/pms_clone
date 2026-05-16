import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './PresaleGoodsPage.css'

type FilterKey = 'channel' | 'ticketType' | 'category' | 'shelfStatus'
type StatusTab = '全部' | '销售中' | '已售罄' | '仓库中'

const storeName = '天落会宿公寓(前海壹方城宝安中心店)'

const filterOptions: Record<FilterKey, string[]> = {
  channel: ['路客云聚合', '携程', '美团民宿', '途家', '小猪'],
  ticketType: ['全部', '普通卡券', '日历卡券'],
  category: ['住宿套餐', '餐饮券', '娱乐体验', '其他'],
  shelfStatus: ['全部', '销售中', '已售罄', '仓库中'],
}

const filters: Array<{ key: FilterKey; label: string; placeholder: string }> = [
  { key: 'channel', label: '渠道', placeholder: '请选择渠道' },
  { key: 'ticketType', label: '卡券类型', placeholder: '全部' },
  { key: 'category', label: '商品类目', placeholder: '请选择商品类目' },
  { key: 'shelfStatus', label: '上架状态', placeholder: '全部' },
]

const statusTabs: StatusTab[] = ['全部', '销售中', '已售罄', '仓库中']

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
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null)
  const [values, setValues] = useState<Record<FilterKey, string>>({
    channel: '',
    ticketType: '全部',
    category: '',
    shelfStatus: '全部',
  })
  const [keyword, setKeyword] = useState('')
  const [activeTab, setActiveTab] = useState<StatusTab>('全部')
  const [notice, setNotice] = useState('')

  const currentFilter = openFilter ? filters.find((filter) => filter.key === openFilter) : null

  function chooseFilter(value: string) {
    if (!openFilter) return
    setValues((current) => ({ ...current, [openFilter]: value }))
    setOpenFilter(null)
  }

  function resetFilters() {
    setValues({
      channel: '',
      ticketType: '全部',
      category: '',
      shelfStatus: '全部',
    })
    setKeyword('')
    setActiveTab('全部')
    setOpenFilter(null)
    setNotice('')
  }

  return (
    <div className="presale-goods-page">
      <h1 className="sr-only-heading">预售券</h1>

      <section className="presale-goods-query" aria-label="预售券商品筛选">
        <div className="presale-goods-query__grid">
          <label className="presale-goods-field presale-goods-store">
            <span>全部门店</span>
            <button type="button" className="presale-goods-select is-fixed" aria-label={`全部门店 ${storeName}`}>
              {storeName}
            </button>
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
          <label className="presale-goods-field presale-goods-keyword">
            <span>搜索</span>
            <input
              value={keyword}
              placeholder="请输入商品编号/商品名称"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
        </div>

        {currentFilter ? (
          <div className="presale-goods-options" role="listbox" aria-label={`${currentFilter.label}选项`}>
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

        <div className="presale-goods-actions">
          <button type="button" onClick={resetFilters}>
            重 置
          </button>
          <button type="button" className="is-primary" onClick={() => setOpenFilter(null)}>
            搜 索
          </button>
        </div>
      </section>

      <section className="presale-goods-main" aria-label="预售券商品列表">
        <div className="presale-goods-toolbar">
          <div className="presale-goods-tabs" role="tablist" aria-label="上架状态">
            {statusTabs.map((tab) => (
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
          <div className="presale-goods-toolbar__actions">
            <button type="button" onClick={() => setNotice('已打开门店管理')}>
              门店管理
            </button>
            <button type="button" className="is-primary" onClick={() => navigate('/mallManagement/goodsManagement/edit')}>
              新增预售券
            </button>
            <button type="button" onClick={() => setNotice('当前列表为空，无可展开商品')}>
              全部展开
            </button>
          </div>
        </div>

        {notice ? (
          <div className="presale-goods-notice" role="status">
            {notice}
          </div>
        ) : null}

        <div className="presale-goods-table" role="table" aria-label="预售券商品表格">
          <div className="presale-goods-table__head" role="row">
            {tableColumns.map((column) => (
              <div key={column} role="columnheader">
                {column}
              </div>
            ))}
          </div>
          <div className="presale-goods-empty" role="row">
            <div role="cell" aria-colspan={tableColumns.length}>
              <span className="presale-goods-empty__icon" aria-hidden="true" />
              <strong>暂无数据</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function PresaleGoodsEditPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)

  return (
    <div className="presale-goods-edit-page">
      <h1 className="sr-only-heading">预售券</h1>
      <div className="presale-goods-edit-steps" aria-label="预售券编辑步骤">
        <span className={step === 1 ? 'is-active' : ''}>1编辑基础信息</span>
        <span className={step === 2 ? 'is-active' : ''}>2编辑产品介绍</span>
      </div>

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
                />
                {label}
              </label>
            ))}
          </fieldset>

          <FormSection title="基本信息">
            <label>
              <span>商品名称</span>
              <input aria-label="商品名称" placeholder="请输入" />
            </label>
            <label>
              <span>商品类目</span>
              <button type="button" className="presale-goods-select">
                请选择
              </button>
            </label>
            <div className="presale-goods-upload">
              <span>商品图片</span>
              <button type="button">上传</button>
              <p>建议尺寸：690*310像素，你可以拖拽图片上传，最多上传15张。最少一张</p>
            </div>
            <fieldset className="presale-goods-radio-row">
              <legend>卡券类型</legend>
              <label>
                <input type="radio" name="ticketMode" defaultChecked />
                普通卡券
              </label>
              <label>
                <input type="radio" name="ticketMode" />
                日历卡券
              </label>
              <p>卡券类型首次上架后将无法修改，请谨慎选择。</p>
            </fieldset>
            <label>
              <span>适用门店</span>
              <button type="button" className="presale-goods-select">
                全部
              </button>
            </label>
          </FormSection>

          <FormSection title="规格库存">
            <label>
              <span>商品规格</span>
              <button type="button">添加规格</button>
            </label>
          </FormSection>

          <FormSection title="售卖设置">
            <label>
              <span>有效期</span>
              <button type="button" className="presale-goods-select">
                长期有效
              </button>
              <em>有效期内可用</em>
            </label>
            <label>
              <span>提前预订</span>
              <button type="button" className="presale-goods-select">
                无需预约
              </button>
            </label>
            <label>
              <span>退改规则</span>
              <button type="button" className="presale-goods-select">
                支持退款申请
              </button>
              <em>卡券核销前可随时退，核销后不退不换。</em>
            </label>
            <label>
              <span>使用说明</span>
              <textarea placeholder="请输入内容" />
            </label>
            <label>
              <span>买家填写</span>
              <button type="button">添加内容</button>
              <em>买家购买商品时，所需要填写的信息/留言（买家必填手机号码）</em>
            </label>
          </FormSection>

          <FormSection title="其他设置">
            <label>
              <span>库存扣减方式</span>
              <button type="button" className="presale-goods-select">
                拍下减库存
              </button>
              <button type="button" className="presale-goods-select">
                付款减库存
              </button>
            </label>
            <label>
              <span>开售时间</span>
              <button type="button" className="presale-goods-select">
                立即开售
              </button>
              <button type="button" className="presale-goods-select">
                放入仓库
              </button>
            </label>
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
            <div className="presale-goods-intro-tools">
              <button type="button">添加菜单</button>
              <button type="button">添加文本框</button>
            </div>
            <textarea placeholder="请输入产品介绍" />
          </FormSection>
          <footer className="presale-goods-edit-footer">
            <button type="button" onClick={() => setStep(1)}>
              上一步
            </button>
            <button type="button" onClick={() => navigate('/mallManagement/goodsManagement')}>
              返回列表
            </button>
            <button type="button" className="is-primary">
              发 布
            </button>
          </footer>
        </section>
      )}
    </div>
  )
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="presale-goods-form-section">
      <h2>{title}</h2>
      <div className="presale-goods-form-grid">{children}</div>
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
    <label className="presale-goods-field">
      <span>{filter.label}</span>
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
    </label>
  )
}
