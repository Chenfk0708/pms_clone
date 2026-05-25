import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  defaultCustomerTagFilters,
  loadCustomerTagData,
  type CustomerTagData,
  type CustomerTagFilters,
  type CustomerTagRow,
  type CustomerTagScenario,
} from '../services/customerTag'
import './CustomerTagPage.css'

const tableColumns = ['标签组', '标签名称', '创建人', '创建时间', '操作']

export function CustomerTagPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [filters, setFilters] = useState<CustomerTagFilters>({
    ...defaultCustomerTagFilters,
    keyword: searchParams.get('tagGroupName') ?? '',
  })
  const [scenario, setScenario] = useState<CustomerTagScenario>(normalizeScenario(searchParams.get('customerTagMockState')))
  const [draftKeyword, setDraftKeyword] = useState(searchParams.get('tagGroupName') ?? '')
  const [data, setData] = useState<CustomerTagData | null>(null)
  const [selectedRow, setSelectedRow] = useState<CustomerTagRow | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    void loadData(filters, scenario)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData(nextFilters: CustomerTagFilters, nextScenario: CustomerTagScenario, message = '') {
    setLoading(true)
    setError('')
    try {
      const nextData = await loadCustomerTagData(nextFilters, nextScenario)
      setData(nextData)
      setFilters(nextFilters)
      setScenario(nextScenario)
      if (message) setFeedback(message)
    } catch (caught) {
      setData(null)
      setScenario(nextScenario)
      setError(caught instanceof Error ? caught.message : '客户标签数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    const nextFilters = { ...filters, keyword: draftKeyword, page: 1 }
    void loadData(nextFilters, 'success', '查询已更新')
  }

  function handleReset() {
    setDraftKeyword('')
    void loadData({ ...defaultCustomerTagFilters }, 'success', '筛选已重置')
  }

  function handleRefresh() {
    void loadData({ ...filters }, 'success', '数据已刷新')
  }

  function handleExport() {
    setFeedback('导出任务已创建，稍后可在任务中心查看')
  }

  function handleCreate(groupName: string, tags: string[]) {
    setShowCreateDialog(false)
    setFeedback(`标签组已保存：${groupName}，共 ${tags.length} 个标签`)
  }

  const rows = data?.rows ?? []
  const isEmpty = !loading && !error && rows.length === 0
  const requestEcho = useMemo(
    () => data?.requestEcho ?? JSON.stringify({ provider: 'mock', responseCode: error ? 503 : 0, state: scenario }),
    [data, error, scenario],
  )

  return (
    <div className="customer-tag-page">
      <h1 className="sr-only-heading">客户标签</h1>
      <output hidden aria-label="客户标签服务契约">
        {requestEcho}
      </output>

      <section className="customer-tag-filter" aria-label="客户标签筛选">
        <label className="customer-tag-field">
          <span>标签组:</span>
          <input aria-label="标签组" value={draftKeyword} placeholder="请输入" onChange={(event) => setDraftKeyword(event.target.value)} />
        </label>
        <div className="customer-tag-filter__actions">
          <button type="button" disabled={loading} onClick={handleReset}>
            重置
          </button>
          <button type="button" className="is-primary" disabled={loading} onClick={handleSearch}>
            查询
          </button>
        </div>
      </section>

      <div className="customer-tag-toolbar">
        <button type="button" disabled={loading} onClick={handleRefresh}>
          刷新
        </button>
        <button type="button" onClick={handleExport}>
          导出
        </button>
        <button type="button" className="is-primary" onClick={() => setShowSyncDialog(true)}>
          同步企微标签
        </button>
        <button type="button" className="is-primary" onClick={() => setShowCreateDialog(true)}>
          新建标签组
        </button>
      </div>

      <div className="customer-tag-feedback" role="status">
        {loading ? '客户标签加载中...' : feedback}
      </div>

      {error ? (
        <section className="customer-tag-error" role="alert">
          <strong>客户标签数据加载失败</strong>
          <span>{error}</span>
          <button type="button" onClick={() => void loadData({ ...filters }, 'success', '数据已恢复')}>
            重试
          </button>
        </section>
      ) : null}

      <section className="customer-tag-table" aria-label="客户标签表格" aria-busy={loading}>
        <div className="customer-tag-table__head">
          {tableColumns.map((column) => (
            <div key={column}>{column}</div>
          ))}
        </div>
        <div className="customer-tag-table__body">
          {loading ? <div className="customer-tag-loading">加载客户标签...</div> : null}
          {isEmpty ? (
            <div className="customer-tag-empty">
              <span className="customer-tag-empty__icon" aria-hidden="true" />
              <p>当前条件下没有客户标签</p>
              <button type="button" onClick={handleReset}>
                清空筛选
              </button>
            </div>
          ) : null}
          {!loading &&
            rows.map((row) => (
              <div className="customer-tag-table__row" key={row.id}>
                <div>
                  <strong>{row.groupName}</strong>
                  <span>
                    {row.sourceLabel} · {row.statusLabel}
                  </span>
                </div>
                <div>{row.tagNames}</div>
                <div>{row.createdBy}</div>
                <div>{row.createdAt}</div>
                <div>
                  <button type="button" aria-label={`查看 ${row.groupName}`} onClick={() => setSelectedRow(row)}>
                    查看
                  </button>
                </div>
              </div>
            ))}
        </div>
        {data ? <div className="customer-tag-pagination">第 {data.pagination.page} 页，共 {data.pagination.total} 条，每页 20 条</div> : null}
      </section>

      <section className="customer-tag-shortcuts" aria-label="客户标签快捷入口">
        <button type="button" onClick={() => navigate('/customer/list')}>
          查看客户列表
        </button>
        <button type="button" onClick={() => navigate('/scrm/memberCenter/level')}>
          会员等级
        </button>
        <button type="button" onClick={() => navigate('/scrm/marketing/customer')}>
          客户营销
        </button>
      </section>

      {selectedRow ? <TagDetailDialog row={selectedRow} onClose={() => setSelectedRow(null)} /> : null}
      {showCreateDialog ? <CreateTagGroupDialog onClose={() => setShowCreateDialog(false)} onConfirm={handleCreate} /> : null}
      {showSyncDialog ? <SyncTagDialog onClose={() => setShowSyncDialog(false)} onAuthorize={() => navigate('/channels/private')} /> : null}
    </div>
  )
}

function TagDetailDialog({ row, onClose }: { row: CustomerTagRow; onClose: () => void }) {
  return (
    <div className="customer-tag-modal-backdrop">
      <section className="customer-tag-modal customer-tag-detail" role="dialog" aria-modal="true" aria-label="标签组详情">
        <header>
          <h2>标签组详情</h2>
          <button type="button" aria-label="关闭标签组详情" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-tag-modal__body">
          <dl>
            <dt>标签组</dt>
            <dd>{row.groupName}</dd>
            <dt>标签名称</dt>
            <dd>{row.tagNames}</dd>
            <dt>覆盖客户</dt>
            <dd>{row.memberCount} 人</dd>
            <dt>最近 30 天新增</dt>
            <dd>{row.recentlyAddedCount} 人</dd>
            <dt>说明</dt>
            <dd>{row.description}</dd>
          </dl>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            关闭
          </button>
        </footer>
      </section>
    </div>
  )
}

function CreateTagGroupDialog({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: (groupName: string, tags: string[]) => void
}) {
  const [groupName, setGroupName] = useState('')
  const [tagInputs, setTagInputs] = useState<string[]>([])
  const cleanTags = tagInputs.map((item) => item.trim()).filter(Boolean)
  const canSubmit = groupName.trim().length > 0 && cleanTags.length > 0

  function addTagInput() {
    setTagInputs((current) => [...current, ''])
  }

  function updateTag(index: number, value: string) {
    setTagInputs((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)))
  }

  function removeTag(index: number) {
    setTagInputs((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  return (
    <div className="customer-tag-modal-backdrop">
      <section className="customer-tag-modal" role="dialog" aria-modal="true" aria-label="新建标签组">
        <header>
          <h2>新建标签组</h2>
          <button type="button" aria-label="关闭新建标签组" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="customer-tag-modal__body customer-tag-create-body">
          <label className="customer-tag-dialog-field">
            <span>标签组名称</span>
            <input aria-label="标签组名称" value={groupName} placeholder="请输入标签组名称" onChange={(event) => setGroupName(event.target.value)} />
          </label>
          <div className="customer-tag-dialog-field customer-tag-dialog-tags">
            <span>标签</span>
            <div className="customer-tag-dialog-tags__content">
              {tagInputs.length ? (
                tagInputs.map((value, index) => (
                  <div key={index} className="customer-tag-tag-row">
                    <input aria-label={`标签${index + 1}`} value={value} onChange={(event) => updateTag(index, event.target.value)} />
                    <button type="button" className="customer-tag-icon-button" aria-label={`拖动标签${index + 1}`}>
                      ☰
                    </button>
                    <button type="button" className="customer-tag-icon-button" aria-label={`删除标签${index + 1}`} onClick={() => removeTag(index)}>
                      🗑
                    </button>
                  </div>
                ))
              ) : null}
              <button type="button" className="customer-tag-add-link" onClick={addTagInput}>
                + 添加标签
              </button>
            </div>
          </div>
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            取消
          </button>
          <button type="button" className="is-primary" disabled={!canSubmit} onClick={() => onConfirm(groupName.trim(), cleanTags)}>
            确定
          </button>
        </footer>
      </section>
    </div>
  )
}

function SyncTagDialog({ onClose, onAuthorize }: { onClose: () => void; onAuthorize: () => void }) {
  return (
    <div className="customer-tag-modal-backdrop">
      <section className="customer-tag-auth-modal" role="dialog" aria-modal="true" aria-label="企微标签同步授权">
        <div className="customer-tag-auth-modal__message">
          <span aria-hidden="true">!</span>
          <p>请先前往授权企微再操作</p>
        </div>
        <div className="customer-tag-auth-modal__actions">
          <button type="button" onClick={onClose}>
            我知道了
          </button>
          <button type="button" className="is-primary" onClick={onAuthorize}>
            前往授权
          </button>
        </div>
      </section>
    </div>
  )
}

function normalizeScenario(value: string | null): CustomerTagScenario {
  if (value === 'empty' || value === 'error') return value
  return 'success'
}
