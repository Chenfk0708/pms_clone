import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createDefaultMemberEquityFilters,
  createMemberEquityItem,
  deleteMemberEquityItem,
  fetchMemberEquityDashboard,
  saveMemberEquitySort,
  updateMemberEquityItem,
  type MemberEquityDashboard,
  type MemberEquityDraft,
  type MemberEquityFilters,
  type MemberEquityItem,
} from '../services/memberEquity'
import './MemberEquityPage.css'

const tableColumns = ['展示名称', '权益图标', '权益简介', '操作']
const defaultIcon = '/favicon.svg'

type DialogMode = 'create' | 'edit'

type DialogState = {
  mode: DialogMode
  item: MemberEquityItem | null
}

const emptyDraft: MemberEquityDraft = {
  name: '',
  logoMediaId: '',
  logoMediaUrl: '',
  description: '',
}

export function MemberEquityPage() {
  const search = typeof window === 'undefined' ? '' : window.location.search
  const initialFilters = useMemo(() => createDefaultMemberEquityFilters(new URLSearchParams(search)), [search])
  const [filters] = useState<MemberEquityFilters>(initialFilters)
  const [dashboard, setDashboard] = useState<MemberEquityDashboard | null>(null)
  const [items, setItems] = useState<MemberEquityItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSorting, setIsSorting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('会员权益数据加载中')
  const [dialog, setDialog] = useState<DialogState | null>(null)
  const [draft, setDraft] = useState<MemberEquityDraft>(emptyDraft)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<MemberEquityItem | null>(null)

  const loadDashboard = useCallback(async (reason: 'initial' | 'refresh' | 'retry') => {
    setIsLoading(true)
    setError('')
    setFeedback('会员权益数据加载中')

    try {
      const nextDashboard = await fetchMemberEquityDashboard(filters)
      setDashboard(nextDashboard)
      setItems(nextDashboard.items)
      setFeedback(nextDashboard.items.length === 0 ? '暂无会员权益' : reason === 'refresh' ? '会员权益已刷新' : '会员权益已更新')
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '会员权益加载失败，请稍后重试'
      setDashboard(null)
      setItems([])
      setError(message)
      setFeedback(message)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard('initial')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  useEffect(() => {
    if (!dialog && !deleteTarget) return undefined

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDialog()
        setDeleteTarget(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dialog, deleteTarget])

  const canOperate = !isLoading && !isSubmitting
  const hasItems = items.length > 0

  function openCreateDialog() {
    setDialog({ mode: 'create', item: null })
    setDraft(emptyDraft)
    setFormError('')
  }

  function openEditDialog(item: MemberEquityItem) {
    setDialog({ mode: 'edit', item })
    setDraft({
      name: item.name,
      logoMediaId: item.logoMediaId,
      logoMediaUrl: item.logoMediaUrl,
      description: item.description === '--' ? '' : item.description,
    })
    setFormError('')
  }

  function closeDialog() {
    setDialog(null)
    setDraft(emptyDraft)
    setFormError('')
    setIsSubmitting(false)
  }

  function updateDraft<K extends keyof MemberEquityDraft>(key: K, value: MemberEquityDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
    setFormError('')
  }

  function chooseIcon() {
    setDraft((current) => ({
      ...current,
      logoMediaId: current.logoMediaId || 'mock-media-selected-benefit',
      logoMediaUrl: current.logoMediaUrl || defaultIcon,
    }))
    setFeedback('权益图标已选择')
    setFormError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!dialog) return

    const validationErrors = []
    if (!draft.name.trim()) validationErrors.push('请输入权益名称')
    if (draft.name.trim().length > 8) validationErrors.push('最多可输入8个字符')
    if (!draft.logoMediaId || !draft.logoMediaUrl) validationErrors.push('请上传权益图标')
    if (validationErrors.length > 0) {
      const message = validationErrors.join('；')
      setFormError(message)
      setFeedback(message)
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      const nextItems =
        dialog.mode === 'edit' && dialog.item
          ? await updateMemberEquityItem(filters, items, dialog.item.memberBenefitId, draft)
          : await createMemberEquityItem(filters, items, draft)
      setItems(nextItems)
      setFeedback(dialog.mode === 'edit' ? '权益已保存' : '权益已创建')
      closeDialog()
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : '会员权益操作失败，请稍后重试'
      setFormError(message)
      setFeedback(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSaveSort() {
    setIsSubmitting(true)
    setError('')

    try {
      const nextItems = await saveMemberEquitySort(filters, items)
      setItems(nextItems)
      setIsSorting(false)
      setFeedback('排序已保存')
    } catch (sortError) {
      const message = sortError instanceof Error ? sortError.message : '排序保存失败，请稍后重试'
      setFeedback(message)
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  function moveItem(memberBenefitId: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => item.memberBenefitId === memberBenefitId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const nextItems = [...current]
      const [item] = nextItems.splice(index, 1)
      nextItems.splice(nextIndex, 0, item)
      return nextItems.map((nextItem, orderIndex) => ({ ...nextItem, seq: orderIndex + 1 }))
    })
    setFeedback('排序已调整')
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setIsSubmitting(true)

    try {
      const nextItems = await deleteMemberEquityItem(filters, items, deleteTarget.memberBenefitId)
      setItems(nextItems)
      setDeleteTarget(null)
      setFeedback('权益已删除')
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : '会员权益删除失败，请稍后重试'
      setFeedback(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="member-equity-page"
      data-provider={dashboard?.provider ?? 'mock'}
      data-request-page={filters.page}
      data-request-page-size={filters.pageSize}
    >
      <section className="member-equity-panel" aria-label="会员权益管理">
        <header className="member-equity-panel__header">
          <div>
            <h1>权益列表</h1>
            <p>可以在此处配置所需的会员权益</p>
          </div>
          <div className="member-equity-actions">
            <button type="button" className="member-equity-button is-primary" disabled={!canOperate} onClick={openCreateDialog}>
              添 加
            </button>
            <button
              type="button"
              className="member-equity-button is-primary"
              disabled={!canOperate}
              onClick={() => (isSorting ? void handleSaveSort() : setIsSorting(true))}
            >
              {isSorting ? '保存排序' : '排 序'}
            </button>
            <button type="button" className="member-equity-button" disabled={!canOperate} onClick={() => void loadDashboard('refresh')}>
              刷新
            </button>
          </div>
        </header>

        <div className="member-equity-statebar">
          {isSorting ? <span>拖动列表项排序</span> : <span>当前权益 {items.length} 项</span>}
          <span role="status" aria-label="会员权益操作反馈">{feedback}</span>
        </div>

        {isLoading ? <div className="member-equity-loading" aria-label="会员权益加载状态">会员权益数据加载中</div> : null}

        {error ? (
          <div className="member-equity-error" role="alert" aria-label="会员权益数据错误">
            <strong>会员权益加载失败</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void loadDashboard('retry')}>重新加载</button>
          </div>
        ) : null}

        <table className="member-equity-table" aria-label="会员权益列表">
          <thead>
            <tr>
              {tableColumns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!hasItems ? (
              <tr>
                <td colSpan={tableColumns.length}>
                  <div className="member-equity-empty">
                    <span aria-hidden="true" />
                    <strong>暂无数据</strong>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.memberBenefitId}>
                  <td>
                    <strong>{item.name}</strong>
                    <em>序号 {item.seq}</em>
                  </td>
                  <td>
                    <img src={item.logoMediaUrl} alt="" className="member-equity-icon" />
                  </td>
                  <td>{item.description}</td>
                  <td>
                    <div className="member-equity-row-actions">
                      {isSorting ? (
                        <>
                          <button type="button" disabled={index === 0 || isSubmitting} onClick={() => moveItem(item.memberBenefitId, -1)}>
                            上移 {item.name}
                          </button>
                          <button type="button" disabled={index === items.length - 1 || isSubmitting} onClick={() => moveItem(item.memberBenefitId, 1)}>
                            下移 {item.name}
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" disabled={!canOperate} onClick={() => openEditDialog(item)}>
                            编辑 {item.name}
                          </button>
                          <button type="button" disabled={!canOperate} onClick={() => setDeleteTarget(item)}>
                            删除 {item.name}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {dialog ? (
        <div className="member-equity-modal-backdrop" role="presentation">
          <section className="member-equity-modal" role="dialog" aria-modal="true" aria-labelledby="member-equity-modal-title">
            <header>
              <h2 id="member-equity-modal-title">{dialog.mode === 'edit' ? '编辑权益' : '新增权益'}</h2>
              <button type="button" aria-label="关闭权益弹窗" onClick={closeDialog}>
                ×
              </button>
            </header>
            <form className="member-equity-form" onSubmit={handleSubmit}>
              <label>
                <span>权益名称</span>
                <input
                  type="text"
                  value={draft.name}
                  maxLength={8}
                  placeholder="请输入权益名称"
                  disabled={isSubmitting}
                  onChange={(event) => updateDraft('name', event.target.value)}
                />
              </label>
              <label>
                <span>权益图标</span>
                <button type="button" className="member-equity-upload" disabled={isSubmitting} onClick={chooseIcon}>
                  {draft.logoMediaUrl ? <img src={draft.logoMediaUrl} alt="" /> : '+ 添加图标'}
                </button>
              </label>
              <label>
                <span>权益简介</span>
                <textarea
                  value={draft.description}
                  placeholder="请输入权益简介"
                  disabled={isSubmitting}
                  onChange={(event) => updateDraft('description', event.target.value)}
                />
              </label>
              {formError ? <div className="member-equity-form-error" role="alert">{formError}</div> : null}
              <footer>
                <button type="button" disabled={isSubmitting} onClick={closeDialog}>
                  取 消
                </button>
                <button type="submit" className="is-primary" disabled={isSubmitting}>
                  {isSubmitting ? '提交中' : '提 交'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="member-equity-modal-backdrop" role="presentation">
          <section className="member-equity-confirm" role="dialog" aria-modal="true" aria-label="删除权益">
            <h2>删除权益</h2>
            <p>您确定要删除当前权益吗？</p>
            <strong>{deleteTarget.name}</strong>
            <footer>
              <button type="button" disabled={isSubmitting} onClick={() => setDeleteTarget(null)}>取 消</button>
              <button type="button" className="is-danger" disabled={isSubmitting} onClick={() => void confirmDelete()}>确 定</button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}
