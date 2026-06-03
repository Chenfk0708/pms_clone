import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  fetchSortSettingPageData,
  reorderSortSettingItems,
  resolveSortSettingRuntimeConfig,
  type SortSettingItem,
  type SortSettingPageData,
  type SortSettingRuntimeConfig,
  type SortSettingTab,
} from '../services/sortSetting'
import './SortSettingPage.css'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: SortSettingPageData }
  | { kind: 'error'; message: string }

export function SortSettingPage() {
  const location = useLocation()
  const runtime = useMemo(() => resolveSortSettingRuntimeConfig(location.search), [location.search])

  return <SortSettingSurface key={location.search} runtime={runtime} />
}

function SortSettingSurface({ runtime }: { runtime: SortSettingRuntimeConfig }) {
  const [retryKey, setRetryKey] = useState(0)
  const [loadState, setLoadState] = useState<LoadState>({ kind: 'loading' })
  const [activeTab, setActiveTab] = useState<SortSettingTab>(runtime.activeTab)
  const [feedback, setFeedback] = useState('正在加载排序设置...')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadPageData() {
      setLoadState({ kind: 'loading' })
      setActiveTab(runtime.activeTab)
      setFeedback('正在加载排序设置...')

      try {
        const data = await fetchSortSettingPageData(runtime)
        if (cancelled) return

        setLoadState({ kind: 'ready', data })
        setActiveTab(data.activeTab)
        setFeedback(describeTabState(data, data.activeTab))
      } catch (error) {
        if (cancelled) return

        setLoadState({
          kind: 'error',
          message: error instanceof Error ? error.message : '排序设置加载失败，请稍后重试',
        })
        setFeedback('排序设置加载失败')
      }
    }

    void loadPageData()

    return () => {
      cancelled = true
    }
  }, [retryKey, runtime])

  const pageData = loadState.kind === 'ready' ? loadState.data : null
  const currentTab = pageData ? pageData.tabs[activeTab] : null
  const stateName = loadState.kind === 'ready' && pageData ? pageData.state : loadState.kind === 'loading' ? 'loading' : 'error'

  const contractText = useMemo(
    () =>
      JSON.stringify(
        {
          provider: pageData?.provider ?? runtime.provider,
          state: stateName,
          activeTab,
          traceId: pageData?.traceId ?? '',
          timestamp: pageData?.timestamp ?? '',
          lastActionSummary: pageData?.lastActionSummary ?? '',
          loadContracts: currentTab?.loadContracts ?? [],
          saveContract: currentTab?.saveContract ?? null,
          lastContract: pageData?.lastContract ?? null,
        },
        null,
        2,
      ),
    [activeTab, currentTab, pageData, runtime.provider, stateName],
  )

  function handleRetry() {
    setRetryKey((current) => current + 1)
  }

  function handleTabChange(tab: SortSettingTab) {
    setActiveTab(tab)
    if (pageData) {
      setFeedback(describeTabState(pageData, tab))
    }
  }

  async function handleMove(itemId: string, direction: 'up' | 'down') {
    if (!pageData || !currentTab || isSubmitting) return

    const orderedIds = currentTab.items.map((item) => item.id)
    const itemIndex = orderedIds.indexOf(itemId)
    const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1

    if (itemIndex < 0 || targetIndex < 0 || targetIndex >= orderedIds.length) {
      return
    }

    ;[orderedIds[itemIndex], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[itemIndex]]

    setIsSubmitting(true)
    setFeedback('正在更新排序...')

    try {
      const nextPageData = await reorderSortSettingItems({
        pageData: { ...pageData, activeTab },
        tab: activeTab,
        orderedIds,
      })

      setLoadState({ kind: 'ready', data: nextPageData })
      setFeedback(nextPageData.lastActionSummary)
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : '排序更新失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="sort-setting-page" aria-label="排序设置">
      <pre
        hidden
        data-testid="sort-setting-service-contract"
        data-provider={pageData?.provider ?? runtime.provider}
        data-state={stateName}
        data-active-tab={activeTab}
      >
        {contractText}
      </pre>

      <div className="sort-setting-feedback" role="status" aria-label="排序设置操作反馈">
        {isSubmitting ? '正在更新排序...' : feedback}
      </div>

      {loadState.kind === 'error' ? (
        <section className="sort-setting-state sort-setting-state--error" role="alert" aria-label="排序设置错误状态">
          <strong>排序设置加载失败</strong>
          <p>{loadState.message}</p>
          <button type="button" className="sort-setting-primary" onClick={handleRetry}>
            重新加载排序设置
          </button>
        </section>
      ) : null}

      {loadState.kind === 'loading' ? (
        <section className="sort-setting-state" role="status" aria-label="排序设置加载中">
          <strong>排序设置加载中</strong>
          <p>正在同步门店、房型和商品排序数据，请稍候。</p>
        </section>
      ) : null}

      {pageData ? (
        <>
          <div className="sort-setting-toolbar">
            <div className="sort-setting-tabs" role="tablist" aria-label="排序方式">
              {(Object.keys(pageData.tabs) as SortSettingTab[]).map((tabKey) => {
                const tab = pageData.tabs[tabKey]
                const isActive = activeTab === tabKey

                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={isActive ? 'is-active' : ''}
                    onClick={() => handleTabChange(tabKey)}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <span className="sort-setting-info" aria-hidden="true">
              i
            </span>
          </div>

          <p className="sort-setting-tip">{pageData.infoTip}</p>

          {currentTab && currentTab.items.length > 0 ? (
            <div className="sort-setting-list" aria-label={currentTab.ariaLabel}>
              {currentTab.items.map((item, index) => (
                <SortSettingCard
                  key={item.id}
                  item={item}
                  canMoveUp={index > 0}
                  canMoveDown={index < currentTab.items.length - 1}
                  disabled={isSubmitting}
                  onMoveUp={() => void handleMove(item.id, 'up')}
                  onMoveDown={() => void handleMove(item.id, 'down')}
                />
              ))}
            </div>
          ) : currentTab ? (
            <section className="sort-setting-state sort-setting-state--empty" role="status" aria-label="排序设置空状态">
              <strong>当前暂无可排序数据</strong>
              <p>当前排序方式下暂无可展示的数据，可切换其他排序方式继续查看。</p>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  )
}

function SortSettingCard({
  item,
  canMoveUp,
  canMoveDown,
  disabled,
  onMoveUp,
  onMoveDown,
}: {
  item: SortSettingItem
  canMoveUp: boolean
  canMoveDown: boolean
  disabled: boolean
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  return (
    <article className="sort-setting-item">
      <span className="sort-setting-drag-handle" aria-hidden="true">
        ⋮⋮
      </span>

      <div className="sort-setting-item__content">
        <span className="sort-setting-item__title">{item.title}</span>
        {item.subtitle ? <small className="sort-setting-item__subtitle">{item.subtitle}</small> : null}
      </div>

      <div className="sort-setting-item__actions">
        <button
          type="button"
          className="sort-setting-action"
          aria-label={`上移 ${item.title}`}
          onClick={onMoveUp}
          disabled={!canMoveUp || disabled}
        >
          上移
        </button>
        <button
          type="button"
          className="sort-setting-action"
          aria-label={`下移 ${item.title}`}
          onClick={onMoveDown}
          disabled={!canMoveDown || disabled}
        >
          下移
        </button>
      </div>
    </article>
  )
}

function describeTabState(pageData: SortSettingPageData, tab: SortSettingTab) {
  const tabData = pageData.tabs[tab]

  if (tabData.items.length === 0) {
    return '当前暂无可排序数据'
  }

  if (tab === 'room') {
    return '拖拽房型后将按真实房型排序契约生成提交参数'
  }

  if (tab === 'goods') {
    return '拖拽商品后会提交到真实商品排序接口'
  }

  return pageData.lastActionSummary
}
