import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  defaultFullMarketingCommissionFilters,
  defaultFullMarketingDistributionFilters,
  fetchFullMarketingCommission,
  fetchFullMarketingDistribution,
  saveFullMarketingCommissionPlan,
  type FullMarketingCommissionFilters,
  type FullMarketingCommissionRow,
  type FullMarketingDistributionFilters,
  type FullMarketingProductType,
  type FullMarketingTab,
  type FullMarketingViewModel,
} from '../services/fullMarketing'
import './FullMarketingPage.css'

const commissionColumns = ['房型名称', '层级', '间接佣金(比率)', '直接佣金(比率)', '是否开启分销', '操作']
const salesSummaryColumns = ['房型名称', '销量', '营业额', '提成支出']
const distributorSummaryColumns = ['分销员', '销量', '营业额', '提成支出']

type DialogState =
  | { type: 'invite' }
  | { type: 'edit'; row: FullMarketingCommissionRow }
  | { type: 'qr' }
  | { type: 'pageSize' }
  | null

type QueryState =
  | { tab: 'commission'; filters: FullMarketingCommissionFilters }
  | { tab: 'distribution'; filters: FullMarketingDistributionFilters }

function productTypeLabel(value: FullMarketingProductType | 'all') {
  if (value === 'presale') return '预售券'
  if (value === 'calendar') return '日历房'
  return '日历房/预售券'
}

export function FullMarketingPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<FullMarketingTab>('commission')
  const [commissionFilters, setCommissionFilters] = useState<FullMarketingCommissionFilters>(
    defaultFullMarketingCommissionFilters,
  )
  const [distributionFilters, setDistributionFilters] = useState<FullMarketingDistributionFilters>(
    defaultFullMarketingDistributionFilters,
  )
  const [query, setQuery] = useState<QueryState>({ tab: 'commission', filters: defaultFullMarketingCommissionFilters })
  const [viewModel, setViewModel] = useState<FullMarketingViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('全员营销数据加载中')
  const [isTypeOpen, setIsTypeOpen] = useState(false)
  const [dialog, setDialog] = useState<DialogState>(null)
  const nextSuccessFeedback = useRef('')

  useEffect(() => {
    const controller = new AbortController()
    const request =
      query.tab === 'commission'
        ? fetchFullMarketingCommission(query.filters, controller.signal)
        : fetchFullMarketingDistribution(query.filters, controller.signal)

    request
      .then((data) => {
        setViewModel(data)
        setError('')
        setFeedback(nextSuccessFeedback.current || '全员营销数据已更新')
        nextSuccessFeedback.current = ''
      })
      .catch((loadError: Error) => {
        if (controller.signal.aborted) return
        setError(loadError.message || '全员营销数据加载失败')
        setFeedback('全员营销数据加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query])

  const requestBody = viewModel ? JSON.stringify(viewModel.requestBody) : '{}'
  const rows = viewModel?.commission?.rows ?? []
  const pagination = viewModel?.commission?.pagination ?? { page: 1, pageSize: 20, total: 0 }

  function loadCommission(filters: FullMarketingCommissionFilters, message: string) {
    nextSuccessFeedback.current = message
    setIsLoading(true)
    setError('')
    setFeedback('全员营销数据加载中')
    setQuery({ tab: 'commission', filters })
  }

  function loadDistribution(filters: FullMarketingDistributionFilters, message: string) {
    nextSuccessFeedback.current = message
    setIsLoading(true)
    setError('')
    setFeedback('全员营销数据加载中')
    setQuery({ tab: 'distribution', filters })
  }

  function switchTab(nextTab: FullMarketingTab) {
    setActiveTab(nextTab)
    setIsTypeOpen(false)
    setDialog(null)
    if (nextTab === 'commission') {
      loadCommission(commissionFilters, '佣金设置已更新')
    } else {
      loadDistribution(distributionFilters, '分销数据已更新')
    }
  }

  function chooseType(nextType: FullMarketingProductType) {
    const nextFilters = { ...commissionFilters, productType: nextType, page: 1 }
    setCommissionFilters(nextFilters)
    setIsTypeOpen(false)
    loadCommission(nextFilters, `已切换为${productTypeLabel(nextType)}`)
  }

  function updateCommissionFilter<K extends keyof FullMarketingCommissionFilters>(
    key: K,
    value: FullMarketingCommissionFilters[K],
  ) {
    setCommissionFilters((current) => ({ ...current, [key]: value }))
  }

  function submitCommissionFilters() {
    loadCommission({ ...commissionFilters, page: 1 }, '已按当前条件更新')
  }

  function resetFilters() {
    setCommissionFilters(defaultFullMarketingCommissionFilters)
    setIsTypeOpen(false)
    loadCommission(defaultFullMarketingCommissionFilters, '筛选条件已重置')
  }

  function refreshCommission() {
    loadCommission(commissionFilters, '佣金设置已刷新')
  }

  function refreshCurrent() {
    if (activeTab === 'distribution') {
      loadDistribution(distributionFilters, '分销数据已更新')
    } else {
      refreshCommission()
    }
  }

  function exportData() {
    setFeedback('导出任务已创建，请在下载中心查看')
  }

  function updateDistributionFilter<K extends keyof FullMarketingDistributionFilters>(
    key: K,
    value: FullMarketingDistributionFilters[K],
  ) {
    setDistributionFilters((current) => ({ ...current, [key]: value }))
  }

  function submitDistributionFilters() {
    loadDistribution(distributionFilters, '分销数据已更新')
  }

  function updateCommissionRow(nextRow: FullMarketingCommissionRow) {
    setViewModel((current) => {
      if (!current?.commission) return current
      return {
        ...current,
        commission: {
          ...current.commission,
          rows: current.commission.rows.map((row) => (row.id === nextRow.id ? nextRow : row)),
        },
      }
    })
  }

  return (
    <div
      className="full-marketing-page"
      data-testid="full-marketing-page"
      data-provider={viewModel?.provider ?? 'loading'}
      data-trace-id={viewModel?.traceId ?? ''}
      data-request-body={requestBody}
    >
      <h1 className="full-marketing-a11y-title">全员营销</h1>
      <section className="full-marketing-panel" aria-label="全员营销">
        <div className="full-marketing-tabs" role="tablist" aria-label="全员营销页签">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'commission'}
            className={activeTab === 'commission' ? 'is-active' : ''}
            onClick={() => switchTab('commission')}
          >
            佣金设置
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'distribution'}
            className={activeTab === 'distribution' ? 'is-active' : ''}
            onClick={() => switchTab('distribution')}
          >
            分销数据
          </button>
        </div>

        <div className="full-marketing-feedback" role="status">
          {isLoading ? '全员营销数据加载中' : feedback}
        </div>

        {error ? (
          <section className="full-marketing-state full-marketing-state--error" role="alert">
            <strong>全员营销数据加载失败</strong>
            <span>请检查当前筛选条件后重新加载。</span>
            <button type="button" className="full-marketing-button full-marketing-button--primary" onClick={refreshCurrent}>
              重新加载
            </button>
          </section>
        ) : activeTab === 'commission' ? (
          <CommissionSettings
            filters={commissionFilters}
            rows={rows}
            pagination={pagination}
            isLoading={isLoading}
            isTypeOpen={isTypeOpen}
            onToggleType={() => setIsTypeOpen((value) => !value)}
            onChooseType={chooseType}
            onKeywordChange={(value) => updateCommissionFilter('keyword', value)}
            onSubmit={submitCommissionFilters}
            onReset={resetFilters}
            onRefresh={refreshCommission}
            onExport={exportData}
            onInvite={() => setDialog({ type: 'invite' })}
            onEdit={(row) => setDialog({ type: 'edit', row })}
            onPageSize={() => setDialog({ type: 'pageSize' })}
          />
        ) : (
          <DistributionData
            filters={distributionFilters}
            viewModel={viewModel}
            isLoading={isLoading}
            onFilterChange={updateDistributionFilter}
            onSubmit={submitDistributionFilters}
            onQr={() => setDialog({ type: 'qr' })}
            onNavigate={navigate}
          />
        )}
      </section>

      {dialog?.type === 'invite' ? (
        <InviteDialog
          onClose={() => setDialog(null)}
          onContact={() => setFeedback('已为你唤起客服处理分销开通')}
          onOpen={() => navigate('/version/applicationPayment/detail?app=brandMiniProgram')}
        />
      ) : null}
      {dialog?.type === 'edit' ? (
        <EditPlanDialog
          row={dialog.row}
          onClose={() => setDialog(null)}
          onSaved={(nextRow) => {
            updateCommissionRow(nextRow)
            setDialog(null)
            setFeedback('分销计划已保存')
          }}
        />
      ) : null}
      {dialog?.type === 'qr' ? <QrDialog onClose={() => setDialog(null)} /> : null}
      {dialog?.type === 'pageSize' ? <PageSizeDialog onClose={() => setDialog(null)} /> : null}
    </div>
  )
}

function CommissionSettings({
  filters,
  rows,
  pagination,
  isLoading,
  isTypeOpen,
  onToggleType,
  onChooseType,
  onKeywordChange,
  onSubmit,
  onReset,
  onRefresh,
  onExport,
  onInvite,
  onEdit,
  onPageSize,
}: {
  filters: FullMarketingCommissionFilters
  rows: FullMarketingCommissionRow[]
  pagination: { page: number; pageSize: number; total: number }
  isLoading: boolean
  isTypeOpen: boolean
  onToggleType: () => void
  onChooseType: (value: FullMarketingProductType) => void
  onKeywordChange: (value: string) => void
  onSubmit: () => void
  onReset: () => void
  onRefresh: () => void
  onExport: () => void
  onInvite: () => void
  onEdit: (row: FullMarketingCommissionRow) => void
  onPageSize: () => void
}) {
  return (
    <div className="full-marketing-commission">
      <section className="full-marketing-filter" aria-label="佣金设置筛选">
        <label className="full-marketing-field full-marketing-type-field">
          <span>类型:</span>
          <button
            type="button"
            className="full-marketing-select"
            aria-label={`类型 ${productTypeLabel(filters.productType)}`}
            aria-haspopup="listbox"
            aria-expanded={isTypeOpen}
            disabled={isLoading}
            onClick={onToggleType}
          >
            <span className="full-marketing-select__label">类型</span>
            <span>{productTypeLabel(filters.productType)}</span>
          </button>
        </label>

        <label className="full-marketing-field full-marketing-search-field">
          <span>搜索:</span>
          <input
            value={filters.keyword}
            placeholder="请输入日历房/预售券名称"
            disabled={isLoading}
            onChange={(event) => onKeywordChange(event.target.value)}
          />
        </label>

        <div className="full-marketing-filter__actions">
          <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={onRefresh} disabled={isLoading}>
            刷 新
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={onExport} disabled={isLoading}>
            导 出
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={onReset} disabled={isLoading}>
            重 置
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--primary" onClick={onSubmit} disabled={isLoading}>
            查 询
          </button>
        </div>

        {isTypeOpen ? (
          <div className="full-marketing-type-options" role="listbox" aria-label="类型选项">
            {(['calendar', 'presale'] as FullMarketingProductType[]).map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={filters.productType === option}
                onClick={() => onChooseType(option)}
              >
                {productTypeLabel(option)}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <div className="full-marketing-toolbar">
        <button type="button" className="full-marketing-button full-marketing-button--primary" onClick={onInvite} disabled={isLoading}>
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
          {rows.length > 0 ? (
            rows.map((row) => (
              <div key={row.id} className="full-marketing-table__row" role="row">
                <div role="cell" title={row.name}>
                  {row.name}
                </div>
                <div role="cell">{row.level}</div>
                <div role="cell">{row.indirectRatio}</div>
                <div role="cell">{row.directRatio}</div>
                <div role="cell">{row.enabled ? '是' : '否'}</div>
                <div role="cell">
                  <button type="button" aria-label={`编辑 ${row.name}`} onClick={() => onEdit(row)}>
                    编辑
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="full-marketing-table-empty" role="row">
              <div role="cell" aria-colspan={commissionColumns.length}>
                暂无符合当前条件的佣金计划
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="full-marketing-pagination" aria-label="分页">
        <span>
          第 {pagination.total > 0 ? 1 : 0}-{pagination.total} 条/总共 {pagination.total} 条
        </span>
        <button type="button" aria-label="上一页" disabled>
          ‹
        </button>
        <button type="button" className="is-active">
          {pagination.page}
        </button>
        <button type="button" aria-label="下一页" disabled>
          ›
        </button>
        <button type="button" onClick={onPageSize}>{pagination.pageSize} 条/页</button>
      </div>
    </div>
  )
}

function DistributionData({
  filters,
  viewModel,
  isLoading,
  onFilterChange,
  onSubmit,
  onQr,
  onNavigate,
}: {
  filters: FullMarketingDistributionFilters
  viewModel: FullMarketingViewModel | null
  isLoading: boolean
  onFilterChange: <K extends keyof FullMarketingDistributionFilters>(
    key: K,
    value: FullMarketingDistributionFilters[K],
  ) => void
  onSubmit: () => void
  onQr: () => void
  onNavigate: (path: string) => void
}) {
  const data = viewModel?.distribution
  return (
    <div className="full-marketing-data">
      <section className="full-marketing-data-filter" aria-label="分销数据日期范围">
        <select
          className="full-marketing-data-type"
          aria-label="分销数据类型"
          value={filters.productType}
          disabled={isLoading}
          onChange={(event) => onFilterChange('productType', event.target.value as FullMarketingDistributionFilters['productType'])}
        >
          <option value="all">日历房/预售券</option>
          <option value="calendar">日历房</option>
          <option value="presale">预售券</option>
        </select>
        <div className="full-marketing-date-range">
          <input
            type="date"
            aria-label="????????"
            value={filters.startDate}
            disabled={isLoading}
            onChange={(event) => onFilterChange('startDate', event.target.value)}
          />
          <span>?</span>
          <input
            type="date"
            aria-label="????????"
            value={filters.endDate}
            disabled={isLoading}
            onChange={(event) => onFilterChange('endDate', event.target.value)}
          />
        </div>

        <button type="button" className="full-marketing-button full-marketing-button--primary" onClick={onSubmit} disabled={isLoading}>
          筛选当月
        </button>
        <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={() => onNavigate('/houseManage/houseCale')}>
          房价管理
        </button>
      </section>

      <section className="full-marketing-metrics" aria-label="分销数据汇总">
        <div>
          <strong>{data?.metrics.turnover ?? '0'}</strong>
          <span>分销营业额</span>
        </div>
        <div>
          <strong>{data?.metrics.commission ?? '0'}</strong>
          <span>提成支出</span>
        </div>
      </section>

      <div className="full-marketing-summary-grid">
        <section className="full-marketing-summary-section">
          <h2>日历房、预售券销售汇总</h2>
          <SummaryTable label="日历房、预售券销售汇总" columns={salesSummaryColumns} rows={data?.productRows ?? []} />
        </section>
        <section className="full-marketing-summary-section">
          <div className="full-marketing-summary-section__head">
            <h2>分销员汇总</h2>
            <button type="button" onClick={onQr}>
              +生成分销二维码
            </button>
          </div>
          <DistributorTable rows={data?.distributorRows ?? []} />
        </section>
      </div>
    </div>
  )
}

function SummaryTable({
  label,
  columns,
  rows,
}: {
  label: string
  columns: string[]
  rows: Array<{ id: string; name: string; sales: number; turnover: string; commission: string }>
}) {
  return (
    <div className="full-marketing-summary-table" role="table" aria-label={label}>
      <div className="full-marketing-summary-table__head" role="row">
        {columns.map((column) => (
          <div key={column} role="columnheader">
            {column}
          </div>
        ))}
      </div>
      {rows.length > 0 ? (
        rows.map((row) => (
          <div key={row.id} className="full-marketing-summary-table__row" role="row">
            <div role="cell">{row.name}</div>
            <div role="cell">{row.sales}</div>
            <div role="cell">{row.turnover}</div>
            <div role="cell">{row.commission}</div>
          </div>
        ))
      ) : (
        <div className="full-marketing-empty" role="row">
          <div role="cell" aria-colspan={columns.length}>
            <span aria-hidden="true" />
            <strong>暂无数据</strong>
          </div>
        </div>
      )}
    </div>
  )
}

function DistributorTable({ rows }: { rows: Array<{ id: string; name: string; sales: number; turnover: string; commission: string }> }) {
  return <SummaryTable label="分销员汇总" columns={distributorSummaryColumns} rows={rows} />
}

function InviteDialog({ onClose, onContact, onOpen }: { onClose: () => void; onContact: () => void; onOpen: () => void }) {
  return (
    <div className="full-marketing-modal-backdrop">
      <div className="full-marketing-invite-dialog" role="dialog" aria-modal="true" aria-label="邀请分销员">
        <button type="button" className="full-marketing-modal-close" aria-label="关闭邀请分销员" onClick={onClose}>
          ×
        </button>
        <p>请先开通品牌小程序后再设置分销。</p>
        <footer>
          <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={onContact}>
            联系客服
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--primary" onClick={onOpen}>
            前往开通
          </button>
        </footer>
      </div>
    </div>
  )
}

function EditPlanDialog({
  row,
  onClose,
  onSaved,
}: {
  row: FullMarketingCommissionRow
  onClose: () => void
  onSaved: (row: FullMarketingCommissionRow) => void
}) {
  const [directRatio, setDirectRatio] = useState(row.directRatio === '-%' ? '' : row.directRatio.replace('%', ''))
  const [enabled, setEnabled] = useState(row.enabled)
  const [error, setError] = useState('')

  async function submit() {
    try {
      const nextRow = await saveFullMarketingCommissionPlan({ row, directRatio, enabled })
      onSaved(nextRow)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '分销计划保存失败')
    }
  }

  return (
    <div className="full-marketing-modal-backdrop full-marketing-modal-backdrop--dark">
      <div className="full-marketing-edit-dialog" role="dialog" aria-modal="true" aria-label="编辑分销计划">
        <header>
          <h2>编辑分销计划</h2>
        </header>
        <div className="full-marketing-edit-dialog__body">
          <p className="full-marketing-product-name">商品名称： {row.name}</p>
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
            <input placeholder="输入比例" value={directRatio} onChange={(event) => setDirectRatio(event.target.value)} />
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
            <button
              type="button"
              aria-label="状态开关"
              className={enabled ? 'is-on' : ''}
              onClick={() => setEnabled((value) => !value)}
            />
          </section>
          {error ? <div className="full-marketing-form-error">{error}</div> : null}
        </div>
        <footer>
          <button type="button" className="full-marketing-button full-marketing-button--outline" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="full-marketing-button full-marketing-button--primary" onClick={submit}>
            提 交
          </button>
        </footer>
      </div>
    </div>
  )
}

function QrDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="full-marketing-modal-backdrop">
      <div className="full-marketing-qr-dialog" role="dialog" aria-modal="true" aria-label="生成分销二维码">
        <button type="button" className="full-marketing-modal-close" aria-label="关闭生成分销二维码" onClick={onClose}>
          ×
        </button>
        <h2>全员营销分销二维码</h2>
        <div className="full-marketing-qr-code" aria-hidden="true" />
        <p>分销员扫码后可进入当前门店推广页。</p>
      </div>
    </div>
  )
}

function PageSizeDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="full-marketing-popover" role="dialog" aria-label="分页设置">
      <span>当前每页展示 20 条</span>
      <button type="button" onClick={onClose}>
        知道了
      </button>
    </div>
  )
}
