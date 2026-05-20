import { useEffect, useMemo, useState } from 'react'
import {
  createProfitReportExportTask,
  createProfitReportRequestBody,
  fetchProfitReportDashboard,
  getDefaultProfitReportFilters,
  getProfitReportStaticLookups,
  resolveProfitReportProvider,
  type ProfitExportTask,
  type ProfitMockState,
  type ProfitReportDashboard,
  type ProfitReportDescription,
  type ProfitReportFilters,
  type ProfitReportOption,
} from '../services/profitReport'
import './ProfitReportPage.css'

type SelectKind = 'roomType' | 'channel' | 'roomGroup' | null

const staticLookups = getProfitReportStaticLookups()

export function ProfitReportPage() {
  const provider = useMemo(() => resolveProfitReportProvider(), [])
  const mockState = useMemo(() => resolveMockState(), [])
  const [filters, setFilters] = useState<ProfitReportFilters>(() => ({
    ...getDefaultProfitReportFilters(),
    mockState,
  }))
  const [dashboard, setDashboard] = useState<ProfitReportDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [expanded, setExpanded] = useState(true)
  const [descriptionOpen, setDescriptionOpen] = useState(false)
  const [openSelect, setOpenSelect] = useState<SelectKind>(null)
  const [exportTask, setExportTask] = useState<ProfitExportTask | null>(null)

  useEffect(() => {
    const nextFilters = { ...getDefaultProfitReportFilters(), mockState }
    setFilters(nextFilters)
    void loadDashboard(nextFilters, '利润报表已完成加载')
  }, [mockState])

  const stores = dashboard?.stores ?? staticLookups.stores
  const roomCategories = dashboard?.roomCategories ?? staticLookups.roomCategories
  const channels = dashboard?.channels ?? staticLookups.channels
  const roomGroups = dashboard?.roomGroups ?? staticLookups.roomGroups
  const descriptions = dashboard?.descriptions ?? staticLookups.descriptions
  const rows = dashboard?.rows ?? []
  const total = dashboard?.total ?? 0
  const pageNum = dashboard?.pageNum ?? filters.pageNum
  const pageSize = dashboard?.pageSize ?? filters.pageSize
  const pageCount = dashboard?.pageCount ?? 1
  const requestBody = dashboard?.requestBody ?? createProfitReportRequestBody(filters)
  const currentRoomType = roomCategories.find((item) => item.id === filters.roomCategoryId)
  const currentChannel = channels.find((item) => item.id === filters.channelId)
  const currentRoomGroup = roomGroups.find((item) => item.id === filters.roomGroupId)
  const dataFilters = {
    storeId: filters.storeId,
    startDate: filters.startDate,
    endDate: filters.endDate,
    roomCategoryId: currentRoomType?.id ?? '',
    roomCategoryLabel: currentRoomType?.label ?? '',
    channelId: currentChannel?.label ?? '',
    channelCode: currentChannel?.id ?? '',
    channelLabel: currentChannel?.label ?? '',
    roomGroupId: currentRoomGroup?.id ?? '',
    roomGroupLabel: currentRoomGroup?.label ?? '',
    includeCleanCost: filters.includeCleanCost,
    pageNum,
    pageSize,
  }

  async function loadDashboard(nextFilters: ProfitReportFilters, successMessage: string) {
    setIsLoading(true)
    setError('')
    setOpenSelect(null)

    try {
      const nextDashboard = await fetchProfitReportDashboard(nextFilters)
      setDashboard(nextDashboard)
      setFilters(nextFilters)
      setStatus(successMessage)
    } catch (reason) {
      setDashboard(null)
      setFilters(nextFilters)
      setStatus('')
      setError(reason instanceof Error ? reason.message : '利润报表数据加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  function patchFilters(partial: Partial<ProfitReportFilters>) {
    setFilters((current) => ({
      ...current,
      ...partial,
    }))
  }

  function selectOption(kind: Exclude<SelectKind, null>, option: ProfitReportOption) {
    setOpenSelect(null)

    if (kind === 'roomType') {
      patchFilters({ roomCategoryId: option.id, pageNum: 1 })
      setStatus(`已选择房型：${option.label}`)
      return
    }

    if (kind === 'channel') {
      patchFilters({ channelId: option.id, pageNum: 1 })
      setStatus(`已选择渠道：${option.label}`)
      return
    }

    patchFilters({ roomGroupId: option.id, pageNum: 1 })
    setStatus(`已选择房型分组：${option.label}`)
  }

  async function handleQuery() {
    await loadDashboard({ ...filters, pageNum: 1 }, '已按当前条件更新利润报表')
  }

  async function handleReset() {
    const nextFilters = { ...getDefaultProfitReportFilters(), mockState }
    setExportTask(null)
    await loadDashboard(nextFilters, '已重置筛选并刷新利润报表')
  }

  async function handleChangePage(nextPageNum: number) {
    if (nextPageNum === filters.pageNum || nextPageNum < 1 || nextPageNum > pageCount) {
      return
    }

    await loadDashboard({ ...filters, pageNum: nextPageNum }, `已切换到第 ${nextPageNum} 页`)
  }

  async function handleExport() {
    const nextTask = await createProfitReportExportTask(filters)
    setExportTask(nextTask)
    setStatus(`导出任务已创建：${nextTask.taskId}`)
  }

  return (
    <div
      className="profit-report-page"
      data-provider={provider}
      data-profit-request={JSON.stringify(requestBody)}
      data-profit-filters={JSON.stringify(dataFilters)}
      data-profit-export={exportTask ? JSON.stringify(exportTask) : ''}
    >
      <h1 className="sr-only-heading">利润报表</h1>

      <section className="profit-report-query" aria-label="利润报表筛选">
        <div className="profit-report-store-row" role="radiogroup" aria-label="门店">
          {stores.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={filters.storeId === item.id}
              className={filters.storeId === item.id ? 'is-active' : ''}
              onClick={() => {
                patchFilters({ storeId: item.id, pageNum: 1 })
                setStatus(`已切换门店：${item.label}`)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {expanded ? (
          <div className="profit-report-filter-row">
            <fieldset className="profit-date-range" aria-label="日期">
              <legend>日期</legend>
              <input
                aria-label="开始日期"
                value={filters.startDate}
                onChange={(event) => patchFilters({ startDate: event.target.value })}
              />
              <span>至</span>
              <input
                aria-label="结束日期"
                value={filters.endDate}
                onChange={(event) => patchFilters({ endDate: event.target.value })}
              />
            </fieldset>

            <SelectField
              label="房型"
              placeholder="请选择"
              value={currentRoomType?.label ?? ''}
              options={roomCategories}
              emptyCopy="暂无房型数据"
              open={openSelect === 'roomType'}
              onToggle={() => setOpenSelect((current) => (current === 'roomType' ? null : 'roomType'))}
              onSelect={(option) => selectOption('roomType', option)}
            />
            <SelectField
              label="渠道"
              placeholder="请选择"
              value={currentChannel?.label ?? ''}
              options={channels}
              emptyCopy="暂无渠道数据"
              open={openSelect === 'channel'}
              onToggle={() => setOpenSelect((current) => (current === 'channel' ? null : 'channel'))}
              onSelect={(option) => selectOption('channel', option)}
            />
            <SelectField
              label="房型分组"
              placeholder="请选择"
              value={currentRoomGroup?.label ?? ''}
              options={roomGroups}
              emptyCopy="暂无房型分组"
              open={openSelect === 'roomGroup'}
              onToggle={() => setOpenSelect((current) => (current === 'roomGroup' ? null : 'roomGroup'))}
              onSelect={(option) => selectOption('roomGroup', option)}
            />

            <label className="profit-checkbox">
              <input
                type="checkbox"
                aria-label="包含保洁费用"
                checked={filters.includeCleanCost}
                onChange={(event) => {
                  patchFilters({ includeCleanCost: event.target.checked })
                  setStatus(event.target.checked ? '已计入保洁费用' : '已取消计入保洁费用')
                }}
              />
              包含保洁费用
            </label>
          </div>
        ) : null}

        <div className="profit-report-actions">
          <button type="button" className="is-outline" disabled={isLoading} onClick={() => void handleReset()}>
            重 置
          </button>
          <button type="button" className="is-primary" disabled={isLoading} onClick={() => void handleQuery()}>
            查 询
          </button>
          <button type="button" className="is-outline" disabled={isLoading} onClick={() => void handleExport()}>
            导 出
          </button>
          <button
            type="button"
            className="is-outline"
            disabled={isLoading}
            onClick={() => {
              setDescriptionOpen(true)
              setOpenSelect(null)
            }}
          >
            说 明
          </button>
          <button
            type="button"
            className="is-link"
            disabled={isLoading}
            aria-label={expanded ? '收起' : '展开'}
            onClick={() => {
              setExpanded((current) => !current)
              setOpenSelect(null)
              setStatus(expanded ? '已收起高级筛选' : '已展开高级筛选')
            }}
          >
            {expanded ? '收起' : '展开'}
          </button>
        </div>
      </section>

      {error ? (
        <div className="profit-report-alert" role="alert" aria-label="利润报表数据错误">
          <span>{error}</span>
          <button type="button" onClick={() => void loadDashboard(filters, '利润报表已重试并更新')}>
            重试
          </button>
        </div>
      ) : null}

      {status ? (
        <div className="profit-report-notice" role="status" aria-label="利润报表操作反馈">
          {status}
        </div>
      ) : null}

      <section className="profit-report-table-wrap" aria-label="利润报表表格">
        {isLoading ? <div className="profit-report-empty">正在加载利润报表...</div> : null}
        {!isLoading && rows.length === 0 ? <div className="profit-report-empty">暂无利润报表数据</div> : null}

        <table className="profit-report-table">
          <thead>
            <tr>
              <th colSpan={7}>收入</th>
              <th>支出</th>
              <th colSpan={2}>利润</th>
            </tr>
            <tr>
              <th>日期</th>
              <th>房费(减佣)</th>
              <th>门票</th>
              <th>餐饮</th>
              <th>其他消费</th>
              <th>记一笔收入</th>
              <th>总收入</th>
              <th>记一笔支出</th>
              <th>利润</th>
              <th>利润率</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.date}-${row.isTotal ? 'total' : 'detail'}`} className={row.isTotal ? 'is-summary' : ''}>
                <td>{row.date}</td>
                <td>{row.roomFeeMinusCommission}</td>
                <td>{row.ticketPrice}</td>
                <td>{row.cateringPrice}</td>
                <td>{row.otherOrderExpense}</td>
                <td>{row.writeDownIncome}</td>
                <td>{row.totalIncome}</td>
                <td>{row.writeDownExpenses}</td>
                <td>{row.profitPrice}</td>
                <td>{row.profitRate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <nav className="profit-report-pagination" aria-label="分页">
        <span>{paginationText(pageNum, pageSize, total, rows.length)}</span>
        <button type="button" aria-label="上一页" disabled={isLoading || pageNum <= 1} onClick={() => void handleChangePage(pageNum - 1)}>
          ‹
        </button>
        {buildPageButtons(pageCount).map((item) => (
          <button
            key={item}
            type="button"
            className={item === pageNum ? 'is-current' : ''}
            disabled={isLoading}
            onClick={() => void handleChangePage(item)}
          >
            {item}
          </button>
        ))}
        <button
          type="button"
          aria-label="下一页"
          disabled={isLoading || pageNum >= pageCount}
          onClick={() => void handleChangePage(pageNum + 1)}
        >
          ›
        </button>
        <button type="button" disabled={isLoading} onClick={() => setStatus(`当前每页显示 ${pageSize} 条`)}>
          {pageSize} 条/页
        </button>
      </nav>

      {descriptionOpen ? (
        <div className="profit-modal-backdrop" role="presentation">
          <section className="profit-description-modal" role="dialog" aria-modal="true" aria-label="利润报表字段说明">
            <header>
              <strong>利润报表字段说明</strong>
              <button type="button" aria-label="关闭利润报表字段说明" onClick={() => setDescriptionOpen(false)}>
                ×
              </button>
            </header>
            <div className="profit-description-table" aria-label="利润报表字段说明表格">
              <div className="profit-description-table__head">
                <span>字段</span>
                <span>说明</span>
              </div>
              {descriptions.map((item) => (
                <DescriptionRow key={item.field} item={item} />
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function SelectField({
  label,
  placeholder,
  value,
  options,
  emptyCopy,
  open,
  onToggle,
  onSelect,
}: {
  label: string
  placeholder: string
  value: string
  options: ProfitReportOption[]
  emptyCopy: string
  open: boolean
  onToggle: () => void
  onSelect: (option: ProfitReportOption) => void
}) {
  return (
    <div className="profit-select-field">
      <span>{label}</span>
      <div className="profit-select-wrap">
        <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`${label} ${value || placeholder}`} onClick={onToggle}>
          {value || placeholder}
        </button>
        {open ? (
          <div className="profit-options" role="listbox" aria-label={`${label}选项`}>
            {options.length === 0 ? (
              <div className="profit-options__empty">{emptyCopy}</div>
            ) : (
              options.map((option) => (
                <button key={option.id} type="button" role="option" aria-selected={value === option.label} onClick={() => onSelect(option)}>
                  {option.label}
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DescriptionRow({ item }: { item: ProfitReportDescription }) {
  return (
    <div className="profit-description-table__row">
      <span>{item.field}</span>
      <span>{item.detail}</span>
    </div>
  )
}

function buildPageButtons(pageCount: number) {
  return Array.from({ length: Math.max(pageCount, 1) }, (_, index) => index + 1)
}

function paginationText(pageNum: number, pageSize: number, total: number, length: number) {
  const start = total === 0 ? 0 : (pageNum - 1) * pageSize + 1
  const end = total === 0 ? 0 : (pageNum - 1) * pageSize + length
  return `第 ${start}-${end} 条/总共 ${total} 条`
}

function resolveMockState(): ProfitMockState {
  const state = new URLSearchParams(window.location.search).get('profitMockState')
  return state === 'empty' || state === 'error' ? state : 'success'
}
