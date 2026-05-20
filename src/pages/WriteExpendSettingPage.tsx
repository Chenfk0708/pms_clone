import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createWriteExpendSettingItem,
  fetchWriteExpendSettingPageData,
  resolveWriteExpendSettingCampId,
  resolveWriteExpendSettingQuery,
  type WriteExpendSettingDiagnostics,
  type WriteExpendSettingGroup,
  type WriteExpendSettingPageData,
  type WriteExpendSettingTab,
} from '../services/writeExpendSetting'
import './WriteExpendSettingPage.css'

const pageHint = '系统默认项目不支持编辑和删除，可直接拖动调整排序。'

type LoadReason = 'initial' | 'retry'

export function WriteExpendSettingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = useMemo(() => resolveWriteExpendSettingQuery(location.search), [location.search])
  const [pageData, setPageData] = useState<WriteExpendSettingPageData | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('正在加载记一笔设置')
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogGroup, setDialogGroup] = useState('')
  const [dialogGroupType, setDialogGroupType] = useState(1)
  const [dialogName, setDialogName] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const activeTab: WriteExpendSettingTab = query.tab ?? 'income'

  useEffect(() => {
    void loadPageData('initial')
    // mockState/mockDelayMs are the only query parts that affect data loading.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.mockState, query.mockDelayMs])

  const diagnostics = pageData?.diagnostics ?? readDiagnostics()
  const contractText = JSON.stringify(diagnostics, null, 2)
  const currentTabGroups = pageData?.tabs[activeTab].groups ?? []
  const currentTabItemCount = pageData?.tabs[activeTab].totalItems ?? 0
  const currentTabLabel = activeTab === 'income' ? '收入项' : '支出项'
  const availableGroups = pageData?.availableGroups ?? []
  const disabledItems = pageData?.disabledItems ?? []
  const pageState = error ? 'error' : isLoading ? 'loading' : pageData?.state ?? query.mockState ?? 'success'

  async function loadPageData(reason: LoadReason) {
    setIsLoading(true)
    setError('')
    setDialogError('')
    setFeedback(reason === 'retry' ? '正在重新加载记一笔设置' : '正在加载记一笔设置')

    try {
      const nextPageData = await fetchWriteExpendSettingPageData({
        campId: resolveWriteExpendSettingCampId(),
        mockState: query.mockState,
        mockDelayMs: query.mockDelayMs,
      })

      setPageData(nextPageData)
      setFeedback(resolveLoadFeedback(nextPageData, activeTab))
    } catch (loadError) {
      setPageData(null)
      setError(loadError instanceof Error ? loadError.message : '记一笔设置加载失败，请稍后重试')
      setFeedback('记一笔设置加载失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  function handleTabChange(nextTab: WriteExpendSettingTab) {
    if (nextTab === activeTab) return

    setFeedback(nextTab === 'income' ? '已切换到收入项设置' : '已切换到支出项设置')

    const nextParams = new URLSearchParams(location.search)
    nextParams.set('tab', nextTab)
    navigate(
      {
        pathname: location.pathname,
        search: `?${nextParams.toString()}`,
      },
      { replace: true },
    )
  }

  function openDialog(groupName?: string, groupType?: number) {
    const fallbackGroup = pageData?.availableGroups[0] ?? { groupType: 1, name: '住宿' }
    setDialogGroup(groupName ?? fallbackGroup.name)
    setDialogGroupType(groupType ?? fallbackGroup.groupType)
    setDialogName('')
    setDialogError('')
    setDialogOpen(true)
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDialogError('')
    setIsSubmitting(true)

    try {
      const nextPageData = await createWriteExpendSettingItem({
        tab: activeTab,
        groupType: dialogGroupType,
        groupName: dialogGroup,
        name: dialogName,
        campId: resolveWriteExpendSettingCampId(),
        mockState: query.mockState,
      })

      setPageData(nextPageData)
      setDialogOpen(false)
      setDialogName('')
      setFeedback(`已在${currentTabLabel} > ${dialogGroup}新增“${dialogName.trim()}”`)
    } catch (submitError) {
      setDialogError(submitError instanceof Error ? submitError.message : '新增项目失败，请稍后重试')
      setFeedback('新增项目失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSelectGroup(nextGroupName: string) {
    const matchedGroup = availableGroups.find((group) => group.name === nextGroupName)
    setDialogGroup(nextGroupName)
    setDialogGroupType(matchedGroup?.groupType ?? 1)
  }

  return (
    <div
      className="write-expend-page"
      data-provider={diagnostics?.provider ?? 'mock'}
      data-response-state={pageState}
      data-active-tab={activeTab}
    >
      <pre hidden data-testid="write-expend-setting-service-contract">
        {contractText}
      </pre>

      <section className="write-expend-card" aria-label="记一笔设置">
        <header className="write-expend-toolbar">
          <div className="write-expend-toolbar-copy">
            <p>{pageHint}</p>
            <div className="write-expend-status" role="status" aria-label="记一笔设置操作反馈">
              <span>{feedback}</span>
              {pageData ? <em>支付方式 {pageData.paymentWays.join(' / ')}</em> : null}
            </div>
          </div>
          <button type="button" className="write-expend-primary" onClick={() => openDialog()} disabled={isLoading || isSubmitting}>
            新增
          </button>
        </header>

        <div className="write-expend-tabs" role="tablist" aria-label="记一笔项目类别">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'income'}
            className={activeTab === 'income' ? 'is-active' : ''}
            onClick={() => handleTabChange('income')}
          >
            收入项
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'expense'}
            className={activeTab === 'expense' ? 'is-active' : ''}
            onClick={() => handleTabChange('expense')}
          >
            支出项
          </button>
        </div>

        <section className="write-expend-meta" aria-label="当前列表摘要">
          <span>{currentTabLabel}</span>
          <span>{currentTabItemCount} 个启用项目</span>
          <span>{disabledItems.length} 个停用项目</span>
          {diagnostics ? <span>TraceId {diagnostics.traceId}</span> : null}
        </section>

        {error ? (
          <section className="write-expend-alert" role="alert" aria-label="记一笔设置数据错误">
            <strong>记一笔设置加载失败</strong>
            <span>{error}</span>
            <button type="button" className="write-expend-primary" onClick={() => void loadPageData('retry')} disabled={isSubmitting}>
              重试
            </button>
          </section>
        ) : null}

        {isLoading ? <LoadingState /> : null}

        {!isLoading && !error ? (
          <section className="write-expend-groups" aria-label={`${currentTabLabel}设置`}>
            {currentTabGroups.map((group) => (
              <PaymentGroupSection
                key={`${activeTab}-${group.groupType}`}
                group={group}
                onAdd={() => openDialog(group.name, group.groupType)}
              />
            ))}
            <div className="write-expend-divider" />
            <section className="write-expend-disabled" aria-label="已停用项">
              <h2>已停用项</h2>
              {disabledItems.length > 0 ? (
                <div className="write-expend-item-grid">
                  {disabledItems.map((item) => (
                    <PaymentItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="write-expend-disabled-empty">暂无停用项目</div>
              )}
            </section>
          </section>
        ) : null}
      </section>

      {dialogOpen ? (
        <div className="write-expend-modal-backdrop">
          <section className="write-expend-modal" role="dialog" aria-modal="true" aria-label="新增">
            <header>
              <h2>新增</h2>
              <button type="button" aria-label="关闭新增" onClick={() => setDialogOpen(false)}>
                ×
              </button>
            </header>
            <form onSubmit={handleCreate}>
              <label className="write-expend-form-row">
                <span>选择业态</span>
                <select
                  className="write-expend-select"
                  value={dialogGroup}
                  disabled={isSubmitting}
                  onChange={(event) => handleSelectGroup(event.target.value)}
                >
                  {availableGroups.map((group) => (
                    <option key={group.groupType} value={group.name}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="write-expend-form-row">
                <span>
                  <em>*</em>
                  名称
                </span>
                <input
                  type="text"
                  aria-label="名称"
                  placeholder="请输入名称"
                  value={dialogName}
                  disabled={isSubmitting}
                  onChange={(event) => setDialogName(event.target.value)}
                />
              </label>
              {dialogError ? (
                <p className="write-expend-form-error" role="alert">
                  {dialogError}
                </p>
              ) : null}
              <footer>
                <button type="button" disabled={isSubmitting} onClick={() => setDialogOpen(false)}>
                  取消
                </button>
                <button type="submit" className="write-expend-primary" disabled={isSubmitting}>
                  {isSubmitting ? '提交中...' : '完成'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function PaymentGroupSection({ group, onAdd }: { group: WriteExpendSettingGroup; onAdd: () => void }) {
  return (
    <section className="write-expend-group">
      <h2>{group.name}</h2>
      <div className={group.items.length > 0 ? 'write-expend-item-grid' : 'write-expend-empty-box'}>
        {group.items.length > 0 ? (
          group.items.map((item) => <PaymentItemCard key={item.id} item={item} />)
        ) : (
          <p>
            暂无项目，
            <button type="button" onClick={onAdd}>
              点击新增
            </button>
          </p>
        )}
      </div>
    </section>
  )
}

function PaymentItemCard({ item }: { item: WriteExpendSettingGroup['items'][number] }) {
  return (
    <article className={`write-expend-item ${item.isEnabled ? '' : 'is-disabled'}`}>
      <span className="write-expend-drag" aria-hidden="true">
        ⋮⋮
      </span>
      <span className="write-expend-item-name">{item.name}</span>
      <span className="write-expend-lock" aria-hidden="true" />
      <span className={`write-expend-default-badge ${item.isCustom ? 'is-custom' : ''}`}>{item.isCustom ? '自定义' : '默认'}</span>
    </article>
  )
}

function LoadingState() {
  return (
    <section className="write-expend-loading" aria-label="记一笔设置加载状态">
      <div className="write-expend-loading-row">
        <span className="write-expend-loading-label" />
        <div className="write-expend-loading-grid">
          <span className="write-expend-loading-pill" />
          <span className="write-expend-loading-pill" />
          <span className="write-expend-loading-pill" />
          <span className="write-expend-loading-pill" />
        </div>
      </div>
      <div className="write-expend-loading-row">
        <span className="write-expend-loading-label" />
        <div className="write-expend-loading-grid">
          <span className="write-expend-loading-pill" />
          <span className="write-expend-loading-pill is-wide" />
        </div>
      </div>
      <div className="write-expend-loading-row">
        <span className="write-expend-loading-label" />
        <div className="write-expend-loading-grid">
          <span className="write-expend-loading-empty" />
        </div>
      </div>
    </section>
  )
}

function readDiagnostics() {
  if (typeof window === 'undefined') return null

  const rawText = window.localStorage.getItem('pms.writeExpendSetting.lastRequest')
  return rawText ? (JSON.parse(rawText) as WriteExpendSettingDiagnostics) : null
}

function resolveLoadFeedback(pageData: WriteExpendSettingPageData, activeTab: WriteExpendSettingTab) {
  if (pageData.state === 'empty') {
    return activeTab === 'income' ? '当前收入项暂无可展示项目' : '当前支出项暂无可展示项目'
  }

  const currentTab = pageData.tabs[activeTab]
  return `已同步${currentTab.totalItems}个${activeTab === 'income' ? '收入项' : '支出项'}配置`
}
