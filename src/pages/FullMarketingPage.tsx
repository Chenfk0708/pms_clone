import { useState } from 'react'
import './FullMarketingPage.css'

type MarketingTab = 'commission' | 'data'
type ProductType = '日历房' | '预售券'

const roomNames = [
  '顶层套房（浴缸巨幕电竞麻将）',
  '总裁套间（桑拿浴缸露台电竞麻将）',
  '天落大床电竞套间',
  '观影大床房',
]

const commissionColumns = ['房型名称', '层级', '间接佣金(比率)', '直接佣金(比率)', '是否开启分销', '操作']
const salesSummaryColumns = ['房型名称', '销量', '营业额', '提成支出']
const distributorSummaryColumns = ['分销员', '销量', '营业额', '提成支出']

export function FullMarketingPage() {
  const [activeTab, setActiveTab] = useState<MarketingTab>('commission')
  const [productType, setProductType] = useState<ProductType>('日历房')
  const [keyword, setKeyword] = useState('')
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<string | null>(null)

  function resetFilters() {
    setProductType('日历房')
    setKeyword('')
    setIsTypeOpen(false)
  }

  function chooseType(nextType: ProductType) {
    setProductType(nextType)
    setIsTypeOpen(false)
  }

  return (
    <div className="full-marketing-page">
      <h1 className="full-marketing-a11y-title">全员营销</h1>
      <section className="full-marketing-panel" aria-label="全员营销">
        <div className="full-marketing-tabs" role="tablist" aria-label="全员营销页签">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'commission'}
            className={activeTab === 'commission' ? 'is-active' : ''}
            onClick={() => {
              setActiveTab('commission')
              setIsTypeOpen(false)
            }}
          >
            佣金设置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'data'}
            className={activeTab === 'data' ? 'is-active' : ''}
            onClick={() => {
              setActiveTab('data')
              setIsTypeOpen(false)
            }}
          >
            分销数据
          </button>
        </div>

        {activeTab === 'commission' ? (
          <CommissionSettings
            productType={productType}
            keyword={keyword}
            isTypeOpen={isTypeOpen}
            onToggleType={() => setIsTypeOpen((value) => !value)}
            onChooseType={chooseType}
            onKeywordChange={setKeyword}
            onReset={resetFilters}
            onInvite={() => setInviteOpen(true)}
            onEdit={setEditingRoom}
          />
        ) : (
          <DistributionData />
        )}
      </section>

      {inviteOpen ? <InviteDialog onClose={() => setInviteOpen(false)} /> : null}
      {editingRoom ? <EditPlanDialog roomName={editingRoom} onClose={() => setEditingRoom(null)} /> : null}
    </div>
  )
}

function CommissionSettings({
  productType,
  keyword,
  isTypeOpen,
  onToggleType,
  onChooseType,
  onKeywordChange,
  onReset,
  onInvite,
  onEdit,
}: {
  productType: ProductType
  keyword: string
  isTypeOpen: boolean
  onToggleType: () => void
  onChooseType: (value: ProductType) => void
  onKeywordChange: (value: string) => void
  onReset: () => void
  onInvite: () => void
  onEdit: (roomName: string) => void
}) {
  return (
    <div className="full-marketing-commission">
      <section className="full-marketing-filter" aria-label="佣金设置筛选">
        <label className="full-marketing-field full-marketing-type-field">
          <span>类型:</span>
          <button
            type="button"
            className="full-marketing-select"
            aria-label={`类型 ${productType}`}
            aria-haspopup="listbox"
            aria-expanded={isTypeOpen}
            onClick={onToggleType}
          >
            <span className="full-marketing-select__label">类型</span>
            <span>{productType}</span>
          </button>
        </label>

        <label className="full-marketing-field full-marketing-search-field">
          <span>搜索:</span>
          <input
            value={keyword}
            placeholder="请输入日历房/预售券名称"
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </label>

        <div className="full-marketing-filter__actions">
          <button type="button" className="full-marketing-button full-marketing-button--primary">
            查 询
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={onReset}>
            重 置
          </button>
        </div>

        {isTypeOpen ? (
          <div className="full-marketing-type-options" role="listbox" aria-label="类型选项">
            {(['日历房', '预售券'] as ProductType[]).map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={productType === option}
                onClick={() => onChooseType(option)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <div className="full-marketing-toolbar">
        <button type="button" className="full-marketing-button full-marketing-button--primary" onClick={onInvite}>
          邀请分销员
        </button>
      </div>

      <div className="full-marketing-table" role="table" aria-label="全员营销佣金设置表格">
        <div className="full-marketing-table__head" role="row">
          {commissionColumns.map((column) => (
            <div key={column} role="columnheader">
              {column}
            </div>
          ))}
        </div>
        <div className="full-marketing-table__body">
          {roomNames.map((roomName) => (
            <div key={roomName} className="full-marketing-table__row" role="row">
              <div role="cell" title={roomName}>
                {roomName}
              </div>
              <div role="cell">-</div>
              <div role="cell">-%</div>
              <div role="cell">-%</div>
              <div role="cell">否</div>
              <div role="cell">
                <button type="button" aria-label={`编辑 ${roomName}`} onClick={() => onEdit(roomName)}>
                  编辑
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="full-marketing-pagination" aria-label="分页">
        <span>第 1-4 条/总共 4 条</span>
        <button type="button" aria-label="上一页">
          ‹
        </button>
        <button type="button" className="is-active">
          1
        </button>
        <button type="button" aria-label="下一页">
          ›
        </button>
        <button type="button">20 条/页</button>
      </div>
    </div>
  )
}

function DistributionData() {
  return (
    <div className="full-marketing-data">
      <section className="full-marketing-data-filter" aria-label="分销数据日期范围">
        <button type="button" className="full-marketing-data-type">
          日历房/预售券
        </button>
        <div className="full-marketing-date-range">
          <input placeholder="开始日期" value="2026-05-01" readOnly />
          <span>→</span>
          <input placeholder="结束日期" value="2026-05-31" readOnly />
        </div>
        <button type="button" className="full-marketing-button full-marketing-button--primary">
          筛选当月
        </button>
      </section>

      <section className="full-marketing-metrics" aria-label="分销数据汇总">
        <div>
          <strong>0</strong>
          <span>分销营业额</span>
        </div>
        <div>
          <strong>0</strong>
          <span>提成支出</span>
        </div>
      </section>

      <div className="full-marketing-summary-grid">
        <section className="full-marketing-summary-section">
          <h2>日历房、预售券销售汇总</h2>
          <SummaryTable label="日历房、预售券销售汇总" columns={salesSummaryColumns} />
        </section>
        <section className="full-marketing-summary-section">
          <div className="full-marketing-summary-section__head">
            <h2>分销员汇总</h2>
            <button type="button">+生成分销二维码</button>
          </div>
          <SummaryTable label="分销员汇总" columns={distributorSummaryColumns} />
        </section>
      </div>
    </div>
  )
}

function SummaryTable({ label, columns }: { label: string; columns: string[] }) {
  return (
    <div className="full-marketing-summary-table" role="table" aria-label={label}>
      <div className="full-marketing-summary-table__head" role="row">
        {columns.map((column) => (
          <div key={column} role="columnheader">
            {column}
          </div>
        ))}
      </div>
      <div className="full-marketing-empty" role="row">
        <div role="cell" aria-colspan={columns.length}>
          <span aria-hidden="true" />
          <strong>暂无数据</strong>
        </div>
      </div>
    </div>
  )
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="full-marketing-modal-backdrop">
      <div className="full-marketing-invite-dialog" role="dialog" aria-modal="true" aria-label="邀请分销员">
        <button type="button" className="full-marketing-modal-close" aria-label="关闭邀请分销员" onClick={onClose}>
          ×
        </button>
        <p>请先开通品牌小程序后再设置分销。</p>
        <footer>
          <button type="button" className="full-marketing-button full-marketing-button--outline">
            联系客服
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--primary">
            前往开通
          </button>
        </footer>
      </div>
    </div>
  )
}

function EditPlanDialog({ roomName, onClose }: { roomName: string; onClose: () => void }) {
  return (
    <div className="full-marketing-modal-backdrop full-marketing-modal-backdrop--dark">
      <div className="full-marketing-edit-dialog" role="dialog" aria-modal="true" aria-label="编辑分销计划">
        <header>
          <h2>编辑分销计划</h2>
        </header>
        <div className="full-marketing-edit-dialog__body">
          <p className="full-marketing-product-name">商品名称： {roomName}</p>
          <div className="full-marketing-form-row full-marketing-form-row--inline">
            <span>佣金</span>
            <small>ⓘ 按客人实付金额比例支付佣金</small>
          </div>

          <label className="full-marketing-radio-row is-blue">
            <input type="radio" aria-label="一级分销" checked readOnly />
            <span>一级分销</span>
          </label>
          <label className="full-marketing-form-row">
            <span>实付比例</span>
            <input placeholder="输入比例" />
            <em>%</em>
          </label>

          <label className="full-marketing-radio-row">
            <input type="radio" aria-label="多级分销" readOnly />
            <span>多级分销</span>
          </label>
          <label className="full-marketing-form-row">
            <small>间接分销员</small>
            <span>实付比例</span>
            <input placeholder="输入比例" />
            <em>%</em>
          </label>
          <label className="full-marketing-form-row">
            <small>直接分销员</small>
            <span>实付比例</span>
            <input placeholder="输入比例" />
            <em>%</em>
          </label>

          <section className="full-marketing-audience">
            <h3>分销人群</h3>
            <label className="full-marketing-radio-row is-blue">
              <input type="radio" aria-label="所有人" checked readOnly />
              <span>所有人</span>
            </label>
          </section>

          <section className="full-marketing-status">
            <h3>状态</h3>
            <button type="button" aria-label="状态开关" />
          </section>
        </div>
        <footer>
          <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--primary">
            提 交
          </button>
        </footer>
      </div>
    </div>
  )
}
