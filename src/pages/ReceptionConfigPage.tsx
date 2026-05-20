import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createReceptionConfigExportTask,
  createReceptionConfigSaveTask,
  fetchReceptionConfigDashboard,
  getDefaultReceptionConfigOptions,
  resolveReceptionConfigRuntimeConfig,
  type ReceptionConfigMetric,
  type ReceptionConfigMockState,
  type ReceptionConfigOption,
  type ReceptionConfigQuery,
  type ReceptionConfigRule,
  type ReceptionConfigShortcut,
  type ReceptionConfigViewModel,
} from '../services/receptionConfig'
import './ReceptionConfigPage.css'

const defaultStoreId = '1796067693589061634'

type Filters = {
  staffGroup: string
  configStatus: string
  keyword: string
}

type Feedback = {
  tone: 'success' | 'info'
  text: string
}

const defaultFilters: Filters = {
  staffGroup: '',
  configStatus: '',
  keyword: '',
}

export function ReceptionConfigPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const runtimeConfig = resolveReceptionConfigRuntimeConfig({ search: location.search })
  const runtimeProvider = runtimeConfig.provider ?? 'mock'
  const runtimeMockState = runtimeConfig.mockState ?? 'success'
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const [view, setView] = useState<ReceptionConfigViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [responseState, setResponseState] = useState<ReceptionConfigMockState>(runtimeMockState)
  const [openMenu, setOpenMenu] = useState<'staffGroup' | 'configStatus' | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<ReceptionConfigMetric | null>(null)
  const [selectedRule, setSelectedRule] = useState<ReceptionConfigRule | null>(null)

  const filterOptions = view?.filterOptions ?? getDefaultReceptionConfigOptions()
  const selectedStaffGroupLabel = labelFor(filterOptions.staffGroups, filters.staffGroup)
  const selectedStatusLabel = labelFor(filterOptions.statuses, filters.configStatus)

  const buildQuery = useCallback(
    (nextFilters: Filters): ReceptionConfigQuery => ({
      provider: runtimeProvider,
      mockState: runtimeConfig.mockState,
      storeId: defaultStoreId,
      staffGroup: nextFilters.staffGroup,
      configStatus: nextFilters.configStatus,
      keyword: nextFilters.keyword.trim(),
    }),
    [runtimeProvider, runtimeConfig.mockState],
  )

  const loadDashboard = useCallback(
    async (nextFilters: Filters, signal?: AbortSignal, nextFeedback?: Feedback) => {
      setIsLoading(true)
      setError('')
      setOpenMenu(null)
      setResponseState(runtimeMockState)
      try {
        const result = await fetchReceptionConfigDashboard(buildQuery(nextFilters), signal)
        if (signal?.aborted) return
        setView(result.view)
        setResponseState(result.view.state)
        if (nextFeedback) {
          setFeedback(nextFeedback)
        }
      } catch (nextError) {
        if (signal?.aborted) return
        setResponseState('error')
        setError(nextError instanceof Error ? nextError.message : '接待配置数据加载失败，请重试')
        setFeedback(null)
      } finally {
        if (!signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [buildQuery, runtimeMockState],
  )

  useEffect(() => {
    const abortController = new AbortController()
    const timer = window.setTimeout(() => {
      void loadDashboard(defaultFilters, abortController.signal)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      abortController.abort()
    }
  }, [location.search, loadDashboard])

  function handleQuery() {
    void loadDashboard(filters, undefined, { tone: 'success', text: '已按当前条件刷新接待配置' })
  }

  function handleReset() {
    setFilters(defaultFilters)
    void loadDashboard(defaultFilters, undefined, { tone: 'success', text: '筛选条件已重置' })
  }

  function handleRefresh() {
    void loadDashboard(filters, undefined, { tone: 'success', text: '接待配置数据已刷新' })
  }

  function handleSave() {
    createReceptionConfigSaveTask(buildQuery(filters))
    setFeedback({ tone: 'success', text: '接待配置已保存' })
  }

  function handlePreview() {
    if (!view?.previewMessage) {
      setFeedback({ tone: 'info', text: '当前条件下暂无可预览欢迎语' })
      return
    }
    setPreviewOpen(true)
  }

  function handleExport() {
    createReceptionConfigExportTask(buildQuery(filters))
    setFeedback({ tone: 'success', text: '接待配置导出任务已创建' })
  }

  return (
    <div
      className="reception-config-page"
      data-provider={view?.provider ?? runtimeProvider}
      data-response-state={view?.state ?? responseState}
      data-request-group={filters.staffGroup}
      data-request-status={filters.configStatus}
      data-request-keyword={filters.keyword.trim()}
    >
      <section className="reception-config-shell">
        <header className="reception-config-header">
          <div>
            <span className="reception-config-eyebrow">SCRM / 客户沟通</span>
            <h1>接待配置中心</h1>
            <p>统一配置企业微信接待员工、欢迎语、客户备注和自动分配规则，让夜班与会员场景的接待动作可复用、可回溯。</p>
          </div>
          <div className="reception-config-header__actions">
            <button type="button" className="reception-config-secondary" onClick={handlePreview}>
              预览欢迎语
            </button>
            <button type="button" onClick={() => navigate('/version/applicationPayment/detail', { state: { product: 'scrm' } })}>
              立即开通
            </button>
          </div>
        </header>

        <section className="reception-config-toolbar" aria-label="接待配置筛选">
          <FilterMenu
            title="接待分组"
            label={selectedStaffGroupLabel}
            options={filterOptions.staffGroups}
            isOpen={openMenu === 'staffGroup'}
            onToggle={() => setOpenMenu(openMenu === 'staffGroup' ? null : 'staffGroup')}
            onSelect={(value) => {
              setFilters((current) => ({ ...current, staffGroup: value }))
              setOpenMenu(null)
            }}
          />
          <FilterMenu
            title="规则状态"
            label={selectedStatusLabel}
            options={filterOptions.statuses}
            isOpen={openMenu === 'configStatus'}
            onToggle={() => setOpenMenu(openMenu === 'configStatus' ? null : 'configStatus')}
            onSelect={(value) => {
              setFilters((current) => ({ ...current, configStatus: value }))
              setOpenMenu(null)
            }}
          />
          <label className="reception-config-search">
            <span>规则关键词</span>
            <input
              aria-label="规则关键词"
              placeholder="搜索规则、分组或备注"
              value={filters.keyword}
              onChange={(event) => setFilters((current) => ({ ...current, keyword: event.target.value }))}
            />
          </label>
          <div className="reception-config-actions">
            <button type="button" disabled={isLoading} onClick={handleQuery}>
              查询
            </button>
            <button type="button" disabled={isLoading} onClick={handleReset}>
              重置
            </button>
            <button type="button" disabled={isLoading} onClick={handleRefresh}>
              刷新
            </button>
            <button type="button" disabled={isLoading} onClick={handleSave}>
              保存配置
            </button>
            <button type="button" disabled={isLoading} onClick={handleExport}>
              导出配置
            </button>
          </div>
        </section>

        {feedback ? (
          <div className={`reception-config-feedback is-${feedback.tone}`} role="status" aria-label="接待配置操作反馈">
            {feedback.text}
          </div>
        ) : null}

        <section className="reception-config-metrics" aria-label="接待配置核心指标">
          {(view?.metrics ?? []).map((metric) => (
            <button key={metric.id} type="button" className="reception-config-metric" onClick={() => setSelectedMetric(metric)}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </button>
          ))}
        </section>

        {error ? (
          <section className="reception-config-error" role="alert" aria-label="接待配置数据错误">
            <strong>{error}</strong>
            <button type="button" onClick={handleRefresh}>
              重试
            </button>
          </section>
        ) : null}

        <section className="reception-config-grid">
          <section className="reception-config-panel" aria-label="接待规则列表">
            <div className="reception-config-panel__header">
              <h2>接待规则列表</h2>
              <span>{view?.refreshedAt ?? '等待加载'}</span>
            </div>
            {isLoading ? <div className="reception-config-loading">正在同步接待规则...</div> : null}
            {!isLoading && (view?.rules.length ?? 0) === 0 ? (
              <div className="reception-config-empty">暂无接待规则</div>
            ) : (
              <div className="reception-config-rule-list">
                {(view?.rules ?? []).map((rule) => (
                  <button key={rule.id} type="button" className="reception-config-rule" onClick={() => setSelectedRule(rule)}>
                    <div className="reception-config-rule__header">
                      <strong>{rule.name}</strong>
                      <span className={`reception-config-rule__status is-${rule.status}`}>{rule.statusLabel}</span>
                    </div>
                    <div className="reception-config-rule__meta">
                      <span>{rule.staffGroupLabel}</span>
                      <span>{rule.trigger}</span>
                    </div>
                    <p>{rule.note}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="reception-config-panel" aria-label="接待员工列表">
            <div className="reception-config-panel__header">
              <h2>接待员工列表</h2>
              <span>按当前条件同步接待分组与模板分工</span>
            </div>
            {isLoading ? <div className="reception-config-loading">正在同步接待员工...</div> : null}
            {!isLoading && (view?.staffMembers.length ?? 0) === 0 ? (
              <div className="reception-config-empty">当前筛选条件下暂无接待员工配置，请调整条件后重试。</div>
            ) : (
              <div className="reception-config-staff-list">
                {(view?.staffMembers ?? []).map((staffMember) => (
                  <article key={staffMember.id} className="reception-config-staff">
                    <div className="reception-config-staff__header">
                      <strong>{staffMember.name}</strong>
                      <span>{staffMember.staffGroupLabel}</span>
                    </div>
                    <p>{staffMember.coverage}</p>
                    <small>{staffMember.note}</small>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="reception-config-panel" aria-label="快捷入口">
          <div className="reception-config-panel__header">
            <h2>快捷入口</h2>
            <span>按现有项目路由承接客服、员工和客户标签协作链路</span>
          </div>
          <div className="reception-config-shortcuts">
            {(view?.shortcuts ?? []).map((shortcut) => (
              <ShortcutCard key={shortcut.id} shortcut={shortcut} onClick={() => navigate(shortcut.path)} />
            ))}
          </div>
        </section>
      </section>

      {previewOpen ? (
        <Dialog title="欢迎语预览" onClose={() => setPreviewOpen(false)}>
          <p>{view?.previewMessage}</p>
        </Dialog>
      ) : null}

      {selectedMetric ? (
        <Dialog title={selectedMetric.label} onClose={() => setSelectedMetric(null)}>
          <p>{selectedMetric.detail}</p>
          <p>当前指标值：{selectedMetric.value}</p>
        </Dialog>
      ) : null}

      {selectedRule ? (
        <Dialog title={selectedRule.name} onClose={() => setSelectedRule(null)}>
          <p>{selectedRule.staffGroupLabel} / {selectedRule.statusLabel}</p>
          <p>{selectedRule.trigger}</p>
          <p>{selectedRule.note}</p>
          <p>{selectedRule.welcomeMessage}</p>
        </Dialog>
      ) : null}
    </div>
  )
}

function FilterMenu({
  title,
  label,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  title: string
  label: string
  options: ReceptionConfigOption[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (value: string) => void
}) {
  return (
    <div className="reception-config-menu">
      <button type="button" aria-haspopup="listbox" aria-expanded={isOpen} onClick={onToggle}>
        <span>{title}</span>
        <strong>{label}</strong>
      </button>
      {isOpen ? (
        <div className="reception-config-menu__list" role="listbox">
          {options.map((option) => (
            <button key={option.value || option.label} type="button" role="option" onClick={() => onSelect(option.value)}>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ShortcutCard({ shortcut, onClick }: { shortcut: ReceptionConfigShortcut; onClick: () => void }) {
  return (
    <button type="button" className="reception-config-shortcut" onClick={onClick}>
      <strong>{shortcut.label}</strong>
      <p>{shortcut.description}</p>
    </button>
  )
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  return (
    <div className="reception-config-dialog-backdrop">
      <section className="reception-config-dialog" role="dialog" aria-label={title}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label={`关闭${title}`} onClick={onClose}>
            ×
          </button>
        </header>
        <div>{children}</div>
      </section>
    </div>
  )
}

function labelFor(options: ReceptionConfigOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? options[0]?.label ?? ''
}
