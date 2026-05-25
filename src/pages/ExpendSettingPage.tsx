import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createExpendSettingItem,
  fetchExpendSettingDashboard,
  getDefaultExpendSettingQuery,
  type ExpendSettingDashboard,
  type ExpendSettingGroup,
  type ExpendSettingItem,
  type ExpendSettingItemStatus,
  type ExpendSettingTab,
} from '../services/expendSetting'
import './ExpendSettingPage.css'

const pageHint = '系统默认项目不支持编辑和删除，可直接拖动调整排序。'
const statusOptions: Array<{ id: ExpendSettingItemStatus; name: string }> = [
  { id: 'enabled', name: '启用' },
  { id: 'disabled', name: '停用' },
]

export function ExpendSettingPage() {
  const defaultQuery = useMemo(() => getDefaultExpendSettingQuery(), [])
  const [activeTab, setActiveTab] = useState<ExpendSettingTab>(defaultQuery.tab)
  const [dashboard, setDashboard] = useState<ExpendSettingDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('正在加载收入/支出设置')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState(false)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [selectedGroupName, setSelectedGroupName] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<ExpendSettingItemStatus>('enabled')
  const [nameDraft, setNameDraft] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [draggingItem, setDraggingItem] = useState<{ groupName: string; itemId: string } | null>(null)

  useEffect(() => {
    void loadDashboard(activeTab)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const serviceRequest = dashboard?.request ?? { campId: defaultQuery.campId, tab: activeTab }
  const serviceContract = {
    provider: dashboard?.provider ?? 'mock',
    state: error ? 'error' : dashboard?.state ?? 'success',
    request: serviceRequest,
    endpoints: dashboard?.endpoints ?? [],
    timestamp: dashboard?.timestamp ?? '',
    traceIds: dashboard?.traceIds ?? [],
  }

  const currentListLabel = activeTab === 'income' ? '收入项目列表' : '支出项目列表'
  const currentEmptyLabel = activeTab === 'income' ? '收入项目空态' : '支出项目空态'
  const currentEmptyMessage = activeTab === 'income' ? '当前门店暂未配置收入项目' : '当前门店暂未配置支出项目'
  const currentSyncTitle = activeTab === 'income' ? '已同步收入项目配置' : '已同步支出项目配置'
  const businessTypeOptions = dashboard?.businessTypeOptions ?? []
  const disabledItems = dashboard?.disabledGroups.flatMap((group) => group.items) ?? []
  const selectedStatusOption = statusOptions.find((option) => option.id === selectedStatus) ?? statusOptions[0]

  async function loadDashboard(nextTab: ExpendSettingTab) {
    setIsLoading(true)
    setError('')
    setDialogError('')
    setGroupMenuOpen(false)
    setFeedback(nextTab === 'income' ? '正在加载收入项目' : '正在加载支出项目')

    try {
      const nextDashboard = await fetchExpendSettingDashboard({
        campId: defaultQuery.campId,
        tab: nextTab,
      })
      setDashboard(nextDashboard)
      setFeedback(nextTab === 'income' ? '已同步收入项目配置' : '已同步支出项目配置')
    } catch (loadError) {
      setDashboard(null)
      const nextError = loadError instanceof Error ? loadError.message : '收入/支出设置数据加载失败，请稍后重试'
      setError(nextError)
      setFeedback(nextError)
    } finally {
      setIsLoading(false)
    }
  }

  function openDialog(groupName = '') {
    setDialogOpen(true)
    setGroupMenuOpen(false)
    setStatusMenuOpen(false)
    setSelectedGroupName(groupName)
    setSelectedStatus('enabled')
    setNameDraft('')
    setDialogError('')
  }

  function closeDialog() {
    setDialogOpen(false)
    setGroupMenuOpen(false)
    setStatusMenuOpen(false)
    setSelectedGroupName('')
    setSelectedStatus('enabled')
    setNameDraft('')
    setDialogError('')
    setIsSubmitting(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedName = nameDraft.trim()

    if (!selectedGroupName) {
      setDialogError('请选择业态')
      return
    }

    if (!trimmedName) {
      setDialogError('请输入项目名称')
      return
    }

    setDialogError('')
    setIsSubmitting(true)

    try {
      const result = await createExpendSettingItem({
        campId: serviceRequest.campId,
        tab: activeTab,
        groupName: selectedGroupName,
        name: trimmedName,
        status: selectedStatus,
      })

      setDashboard((current) => {
        if (!current) return current
        return {
          ...current,
          groups:
            selectedStatus === 'enabled'
              ? appendItemToGroups(current.groups, selectedGroupName, result.item)
              : current.groups,
          disabledGroups:
            selectedStatus === 'disabled'
              ? appendItemToGroups(current.disabledGroups, selectedGroupName, result.item)
              : current.disabledGroups,
        }
      })
      setFeedback(result.message)
      closeDialog()
    } catch (submitError) {
      const nextError = submitError instanceof Error ? submitError.message : '新增项目失败，请稍后重试'
      setDialogError(nextError)
      setFeedback(nextError)
      setIsSubmitting(false)
    }
  }

  function handleSortDrop(groupName: string, targetItemId: string) {
    if (!draggingItem || draggingItem.groupName !== groupName || draggingItem.itemId === targetItemId) {
      setDraggingItem(null)
      return
    }

    setDashboard((current) => {
      if (!current) return current
      return {
        ...current,
        groups: current.groups.map((group) => {
          if (group.name !== groupName) return group

          const items = [...group.items]
          const fromIndex = items.findIndex((item) => item.id === draggingItem.itemId)
          const toIndex = items.findIndex((item) => item.id === targetItemId)
          if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return group

          const [movedItem] = items.splice(fromIndex, 1)
          items.splice(toIndex, 0, movedItem)

          return {
            ...group,
            items,
          }
        }),
      }
    })

    setFeedback(activeTab === 'income' ? '收入项目排序已更新' : '支出项目排序已更新')
    setDraggingItem(null)
  }

  return (
    <div className="expend-setting-page" data-provider={serviceContract.provider} data-response-state={serviceContract.state}>
      <pre
        hidden
        data-testid="expend-setting-service-contract"
        data-provider={serviceContract.provider}
        data-state={serviceContract.state}
        data-request={JSON.stringify(serviceContract.request)}
        data-endpoints={JSON.stringify(serviceContract.endpoints)}
      >
        {JSON.stringify(serviceContract, null, 2)}
      </pre>

      <section className="expend-setting-card" aria-label="收入支出设置">
        <div className="expend-setting-feedback" role="status" aria-label="收入支出设置操作反馈">
          {feedback}
        </div>

        <header className="expend-setting-toolbar">
          <p>{pageHint}</p>
          <button
            type="button"
            className="expend-setting-primary"
            aria-label="新增"
            data-testid="expend-setting-top-add"
            onClick={() => openDialog()}
            disabled={isLoading || isSubmitting}
          >
            新增
          </button>
        </header>

        <div className="expend-setting-tabs" role="tablist" aria-label="收入支出设置页签">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'income'}
            className={activeTab === 'income' ? 'is-active' : ''}
            onClick={() => setActiveTab('income')}
          >
            收入项
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'expense'}
            className={activeTab === 'expense' ? 'is-active' : ''}
            onClick={() => setActiveTab('expense')}
          >
            支出项
          </button>
        </div>

        {error ? (
          <section role="alert" aria-label="收入支出设置加载失败" className="expend-setting-alert">
            <p>{error}</p>
            <button type="button" onClick={() => void loadDashboard(activeTab)}>
              重新加载
            </button>
          </section>
        ) : null}

        {isLoading ? (
          <section role="status" aria-label="收入支出设置加载中" className="expend-setting-empty-box">
            <p>正在加载收入/支出设置...</p>
          </section>
        ) : null}

        {!isLoading && !error && dashboard ? (
          <section className="expend-setting-content">
            <p className="expend-setting-section-title">{currentSyncTitle}</p>

            {dashboard.groups.length === 0 ? (
              <section role="status" aria-label={currentEmptyLabel} className="expend-setting-empty-box">
                <p>{currentEmptyMessage}</p>
              </section>
            ) : (
              <section className="expend-setting-groups" aria-label={currentListLabel}>
                {dashboard.groups.map((group) => (
                  <section
                    key={`${activeTab}-${group.id}`}
                    className="expend-setting-group"
                    data-testid="expend-setting-group"
                    data-group-name={group.name}
                  >
                    <h2>{group.name}</h2>
                    {group.items.length > 0 ? (
                      <div className="expend-setting-item-grid">
                        {group.items.map((item) => (
                          <ExpendItemCard
                            key={item.id}
                            item={item}
                            groupName={group.name}
                            isDragging={draggingItem?.itemId === item.id}
                            onDragStart={() => setDraggingItem({ groupName: group.name, itemId: item.id })}
                            onDragEnd={() => setDraggingItem(null)}
                            onDrop={() => handleSortDrop(group.name, item.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="expend-setting-empty-box">
                        <p>暂无项目，</p>
                        <button type="button" onClick={() => openDialog(group.name)}>
                          点击新增
                        </button>
                      </div>
                    )}
                  </section>
                ))}

                <div className="expend-setting-divider" />

                <section className="expend-setting-disabled">
                  <h2>已停用项</h2>
                  {disabledItems.length > 0 ? (
                    <div className="expend-setting-item-grid" aria-label="已停用项目列表">
                      {disabledItems.map((item) => (
                        <ExpendItemCard
                          key={item.id}
                          item={item}
                          groupName={item.groupName}
                          isDragging={false}
                          onDragStart={() => undefined}
                          onDragEnd={() => undefined}
                          onDrop={() => undefined}
                          isStatic
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="expend-setting-empty-box">
                      <p>暂无停用项目</p>
                    </div>
                  )}
                </section>
              </section>
            )}
          </section>
        ) : null}
      </section>

      {dialogOpen ? (
        <div className="expend-setting-modal-backdrop">
          <section className="expend-setting-modal" role="dialog" aria-modal="true" aria-label="新增">
            <header>
              <h2>新增</h2>
              <button type="button" aria-label="关闭新增" onClick={closeDialog}>
                ×
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="expend-setting-form-row">
                <span>选择业态:</span>
                <div className="expend-setting-select-shell">
                  <button
                    type="button"
                    className={`expend-setting-select${groupMenuOpen ? ' is-open' : ''}`}
                    data-testid="expend-setting-group-select"
                    aria-haspopup="listbox"
                    aria-expanded={groupMenuOpen}
                    onClick={() => {
                      setGroupMenuOpen((current) => !current)
                      setStatusMenuOpen(false)
                    }}
                    disabled={isSubmitting}
                  >
                    <span className={selectedGroupName ? '' : 'is-placeholder'}>{selectedGroupName || ''}</span>
                    <span className="expend-setting-select-arrow" aria-hidden="true" />
                  </button>
                  {groupMenuOpen ? (
                    <ul className="expend-setting-option-list" role="listbox" aria-label="业态选项">
                      {businessTypeOptions.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={option.name === selectedGroupName}
                            className={option.name === selectedGroupName ? 'is-active' : ''}
                            onClick={() => {
                              setSelectedGroupName(option.name)
                              setGroupMenuOpen(false)
                              setDialogError('')
                            }}
                          >
                            {option.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              <label className="expend-setting-form-row">
                <span>
                  <em>*</em>
                  名称:
                </span>
                <input
                  aria-label="名称"
                  value={nameDraft}
                  onChange={(event) => {
                    setNameDraft(event.target.value)
                    setDialogError('')
                  }}
                  disabled={isSubmitting}
                />
              </label>

              <div className="expend-setting-form-row">
                <span>选择状态:</span>
                <div className="expend-setting-select-shell">
                  <button
                    type="button"
                    className={`expend-setting-select${statusMenuOpen ? ' is-open' : ''}`}
                    data-testid="expend-setting-status-select"
                    aria-haspopup="listbox"
                    aria-expanded={statusMenuOpen}
                    onClick={() => {
                      setStatusMenuOpen((current) => !current)
                      setGroupMenuOpen(false)
                    }}
                    disabled={isSubmitting}
                  >
                    <span>{selectedStatusOption.name}</span>
                    <span className="expend-setting-select-arrow" aria-hidden="true" />
                  </button>
                  {statusMenuOpen ? (
                    <ul className="expend-setting-option-list" role="listbox" aria-label="状态选项">
                      {statusOptions.map((option) => (
                        <li key={option.id}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={option.id === selectedStatus}
                            className={option.id === selectedStatus ? 'is-active' : ''}
                            onClick={() => {
                              setSelectedStatus(option.id)
                              setStatusMenuOpen(false)
                            }}
                          >
                            {option.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>

              {dialogError ? <p className="expend-setting-form-error">{dialogError}</p> : null}

              <footer>
                <button type="button" onClick={closeDialog} disabled={isSubmitting}>
                  取消
                </button>
                <button type="submit" className="expend-setting-primary" disabled={isSubmitting}>
                  完成
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function ExpendItemCard({
  item,
  groupName,
  isDragging,
  onDragStart,
  onDragEnd,
  onDrop,
  isStatic = false,
}: {
  item: ExpendSettingItem
  groupName: string
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDrop: () => void
  isStatic?: boolean
}) {
  return (
    <div
      className={`expend-setting-item${isDragging ? ' is-dragging' : ''}${isStatic ? ' is-static' : ''}`}
      data-testid="expend-setting-item"
      data-group-name={groupName}
      data-item-id={item.id}
      draggable={!isStatic}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        if (!isStatic) event.preventDefault()
      }}
      onDrop={onDrop}
    >
      <span className="expend-setting-drag" aria-hidden="true">
        ⋮⋮
      </span>
      <span className="expend-setting-item-name">{item.name}</span>
      <span className="expend-setting-lock" aria-hidden="true" />
      {item.isDefault ? <span className="expend-setting-default-badge">默认</span> : null}
    </div>
  )
}

function appendItemToGroups(groups: ExpendSettingGroup[], groupName: string, item: ExpendSettingItem) {
  return groups.map((group) =>
    group.name === groupName
      ? {
          ...group,
          items: [...group.items, item],
        }
      : group,
  )
}
