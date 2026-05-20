import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createExpendSettingItem,
  fetchExpendSettingDashboard,
  getDefaultExpendSettingQuery,
  type ExpendSettingDashboard,
  type ExpendSettingGroup,
  type ExpendSettingItem,
  type ExpendSettingTab,
} from '../services/expendSetting'
import './ExpendSettingPage.css'

const pageHint = '系统默认项目不支持编辑和删除，可直接拖动调整排序。'

export function ExpendSettingPage() {
  const defaultQuery = useMemo(() => getDefaultExpendSettingQuery(), [])
  const [activeTab, setActiveTab] = useState<ExpendSettingTab>(defaultQuery.tab)
  const [dashboard, setDashboard] = useState<ExpendSettingDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('正在加载收入/支出设置')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [groupMenuOpen, setGroupMenuOpen] = useState(false)
  const [selectedGroupName, setSelectedGroupName] = useState('住宿')
  const [nameDraft, setNameDraft] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void loadDashboard(activeTab)
    // The service reads mockState from the current URL; activeTab is the only local dependency.
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

  async function loadDashboard(nextTab: ExpendSettingTab) {
    setIsLoading(true)
    setError('')
    setDialogError('')
    setFeedback(nextTab === 'income' ? '正在加载收入项目' : '正在加载支出项目')

    try {
      const nextDashboard = await fetchExpendSettingDashboard({
        campId: defaultQuery.campId,
        tab: nextTab,
      })
      setDashboard(nextDashboard)
      setSelectedGroupName(nextDashboard.businessTypeOptions[0]?.name ?? '住宿')
      setFeedback(nextTab === 'income' ? '已同步收入项目配置' : '已同步支出项目配置')
    } catch (loadError) {
      setDashboard(null)
      setError(loadError instanceof Error ? loadError.message : '收入/支出设置数据加载失败，请稍后重试')
      setFeedback('收入/支出设置数据加载失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  function openDialog() {
    setDialogOpen(true)
    setGroupMenuOpen(false)
    setNameDraft('')
    setDialogError('')
    setSelectedGroupName(dashboard?.businessTypeOptions[0]?.name ?? '住宿')
  }

  function closeDialog() {
    setDialogOpen(false)
    setGroupMenuOpen(false)
    setDialogError('')
    setNameDraft('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDialogError('')
    setIsSubmitting(true)

    try {
      const result = await createExpendSettingItem({
        campId: serviceRequest.campId,
        tab: activeTab,
        groupName: selectedGroupName,
        name: nameDraft,
      })

      setDashboard((current) => {
        if (!current) return current
        return {
          ...current,
          groups: appendItemToGroups(current.groups, selectedGroupName, result.item),
        }
      })
      setFeedback(result.message)
      closeDialog()
    } catch (submitError) {
      const nextError = submitError instanceof Error ? submitError.message : '新增项目失败，请稍后重试'
      setDialogError(nextError)
      setFeedback(nextError)
    } finally {
      setIsSubmitting(false)
    }
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
        <header className="expend-setting-toolbar">
          <p>{pageHint}</p>
          <button type="button" className="expend-setting-primary" onClick={openDialog} disabled={isLoading || isSubmitting}>
            新 增
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

        <div role="status" aria-label="收入支出设置操作反馈" className="expend-setting-toolbar">
          <p>{feedback}</p>
        </div>

        {error ? (
          <section role="alert" aria-label="收入支出设置加载失败" className="expend-setting-empty-box">
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
          <>
            {dashboard.groups.length === 0 ? (
              <section role="status" aria-label={currentEmptyLabel} className="expend-setting-empty-box">
                <p>{currentEmptyMessage}</p>
              </section>
            ) : (
              <section className="expend-setting-groups" aria-label={currentListLabel}>
                {dashboard.groups.map((group) => (
                  <section key={`${activeTab}-${group.id}`} className="expend-setting-group">
                    <h2>{group.name}</h2>
                    {group.items.length > 0 ? (
                      <div className="expend-setting-item-grid">
                        {group.items.map((item) => (
                          <ExpendItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <div className="expend-setting-empty-box">
                        <p>暂无项目，点击新增</p>
                      </div>
                    )}
                  </section>
                ))}

                <div className="expend-setting-divider" />

                <section className="expend-setting-disabled">
                  <h2>已停用项</h2>
                  <div className="expend-setting-empty-box">
                    <p>暂无停用项目</p>
                  </div>
                </section>
              </section>
            )}
          </>
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
                <span>选择业态</span>
                <div className="expend-setting-select">
                  <button type="button" onClick={() => setGroupMenuOpen((current) => !current)} disabled={isSubmitting}>
                    选择业态
                  </button>
                  <i>{selectedGroupName}</i>
                </div>
                {groupMenuOpen ? (
                  <ul role="listbox" aria-label="业态选项">
                    {(dashboard?.businessTypeOptions ?? []).map((option) => (
                      <li
                        key={option.id}
                        role="option"
                        aria-selected={option.name === selectedGroupName}
                        onClick={() => {
                          setSelectedGroupName(option.name)
                          setGroupMenuOpen(false)
                        }}
                      >
                        {option.name}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <label className="expend-setting-form-row">
                <span>
                  <em>*</em>
                  名称
                </span>
                <input aria-label="名称" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} disabled={isSubmitting} />
              </label>

              {dialogError ? (
                <div role="alert" className="expend-setting-empty-box">
                  <p>{dialogError}</p>
                </div>
              ) : null}

              <footer>
                <button type="button" onClick={closeDialog} disabled={isSubmitting}>
                  取 消
                </button>
                <button type="submit" className="expend-setting-primary" disabled={isSubmitting}>
                  完 成
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function ExpendItemCard({ item }: { item: ExpendSettingItem }) {
  return (
    <div className="expend-setting-item">
      <span className="expend-setting-drag">⋮⋮</span>
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
