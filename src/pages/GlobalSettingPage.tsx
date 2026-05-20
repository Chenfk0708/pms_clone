import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createGlobalSettingExportTask,
  defaultGlobalSettingFilters,
  fetchGlobalSettingOverview,
  fetchGlobalSettingStoreConfig,
  removeGlobalSettingStore,
  saveGlobalSettingStoreConfig,
  saveGlobalSettingStoreSelection,
  startGlobalSettingConnectorDownload,
  type GlobalSettingFilters,
  type GlobalSettingStoreCandidate,
  type GlobalSettingStoreConfig,
  type GlobalSettingStoreRow,
  type GlobalSettingTodo,
  type GlobalSettingViewModel,
} from '../services/globalSetting'
import './GlobalSettingPage.css'

type DialogState =
  | { type: 'download' }
  | { type: 'selection'; selectedPoiIds: string[] }
  | { type: 'config'; detail: GlobalSettingStoreConfig; errors: Partial<Record<'ctripUsername' | 'ctripPassword' | 'meituanUsername' | 'meituanPassword', string>> }
  | { type: 'remove'; store: GlobalSettingStoreRow }
  | null

export function GlobalSettingPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GlobalSettingFilters>(defaultGlobalSettingFilters)
  const [query, setQuery] = useState<GlobalSettingFilters>(defaultGlobalSettingFilters)
  const [viewModel, setViewModel] = useState<GlobalSettingViewModel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('配置中心数据加载中')
  const [dialog, setDialog] = useState<DialogState>(null)
  const nextSuccessFeedback = useRef('')

  useEffect(() => {
    const controller = new AbortController()

    fetchGlobalSettingOverview(query, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return
        setViewModel(data)
        setError('')
        setFeedback(nextSuccessFeedback.current || '配置中心数据已更新')
        nextSuccessFeedback.current = ''
      })
      .catch((loadError: Error) => {
        if (controller.signal.aborted) return
        setError(loadError.message || '配置中心数据加载失败')
        setFeedback('配置中心数据加载失败')
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [query])

  const contractText = useMemo(
    () =>
      JSON.stringify({
        endpoint: (viewModel?.endpoint ?? '/radarConfig/shop/get').replace(/^mock:/, ''),
        requestBody: viewModel?.requestBody ?? {},
        traceId: viewModel?.traceId ?? '',
        provider: viewModel?.provider ?? 'loading',
        updatedAt: viewModel?.updatedAt ?? '',
      }),
    [viewModel],
  )

  async function reload(nextMessage: string) {
    nextSuccessFeedback.current = nextMessage
    setIsLoading(true)
    setError('')
    setFeedback('配置中心数据加载中')
    setQuery((current) => ({ ...current }))
  }

  function updateFilter<K extends keyof GlobalSettingFilters>(key: K, value: GlobalSettingFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function submitFilters() {
    nextSuccessFeedback.current = '已按当前条件更新配置中心'
    setIsLoading(true)
    setError('')
    setFeedback('配置中心数据加载中')
    setQuery(filters)
  }

  function resetFilters() {
    nextSuccessFeedback.current = '筛选条件已重置'
    setIsLoading(true)
    setError('')
    setFeedback('配置中心数据加载中')
    setFilters({ ...defaultGlobalSettingFilters })
    setQuery({ ...defaultGlobalSettingFilters })
  }

  async function confirmDownload() {
    await startGlobalSettingConnectorDownload()
    setDialog(null)
    setFeedback('数据连接器下载任务已启动')
  }

  function openSelectionDialog() {
    if (!viewModel) return
    setDialog({
      type: 'selection',
      selectedPoiIds: viewModel.candidates
        .filter((item) => item.currentStatus === 'monitored')
        .map((item) => item.poiId),
    })
  }

  function toggleSelection(candidate: GlobalSettingStoreCandidate, checked: boolean) {
    if (dialog?.type !== 'selection') return
    const nextSet = new Set(dialog.selectedPoiIds)
    if (checked) {
      if (nextSet.size >= 3) {
        setFeedback('最多可选择 3 个监控门店')
        return
      }
      nextSet.add(candidate.poiId)
    } else {
      nextSet.delete(candidate.poiId)
    }
    setDialog({ type: 'selection', selectedPoiIds: [...nextSet] })
  }

  async function confirmSelection() {
    if (!viewModel || dialog?.type !== 'selection') return
    const nextViewModel = await saveGlobalSettingStoreSelection(viewModel, dialog.selectedPoiIds)
    setViewModel(nextViewModel)
    setDialog(null)
    setFeedback('监控门店已更新')
  }

  async function openConfigDialog(store: GlobalSettingStoreRow) {
    const detail = await fetchGlobalSettingStoreConfig(store.id)
    setDialog({ type: 'config', detail, errors: {} })
  }

  function updateConfigField(
    channel: 'ctrip' | 'meituan',
    field: 'enabled' | 'username' | 'password',
    value: boolean | string,
  ) {
    if (dialog?.type !== 'config') return
    setDialog({
      ...dialog,
      detail: {
        ...dialog.detail,
        [channel]: {
          ...dialog.detail[channel],
          [field]: value,
        },
      },
    })
  }

  async function confirmConfigSave() {
    if (!viewModel || dialog?.type !== 'config') return
    const errors = validateConfig(dialog.detail)
    if (Object.keys(errors).length > 0) {
      setDialog({ ...dialog, errors })
      return
    }
    const result = await saveGlobalSettingStoreConfig(viewModel, dialog.detail)
    setViewModel(result.viewModel)
    setDialog(null)
    setFeedback('Ebooking授权配置已保存')
  }

  async function confirmRemoveStore() {
    if (!viewModel || dialog?.type !== 'remove') return
    const nextViewModel = await removeGlobalSettingStore(viewModel, dialog.store.id)
    setViewModel(nextViewModel)
    setDialog(null)
    setFeedback('监控门店已移除')
  }

  async function exportData() {
    await createGlobalSettingExportTask(filters)
    setFeedback('导出任务已创建')
  }

  function handleTodoAction(todo: GlobalSettingTodo) {
    if (todo.action === 'route') {
      navigate('/InformationMaintenance/campInfo/edit')
      return
    }
    if (todo.action === 'acknowledge') {
      setFeedback(`${todo.title}已加入今日处理队列`)
      return
    }
    const targetStore = viewModel?.stores.find((item) => item.name === todo.storeName)
    if (targetStore) {
      void openConfigDialog(targetStore)
    }
  }

  return (
    <div className="global-setting-workbench" data-testid="global-setting-page">
      <header className="global-setting-toolbar">
        <div>
          <p>AI全域雷达 / 监控门店管理</p>
          <h1>配置中心</h1>
        </div>
        <div className="global-setting-toolbar__actions">
          <button type="button" onClick={() => reload('配置中心数据已刷新')} disabled={isLoading}>
            刷新
          </button>
          <button type="button" onClick={exportData} disabled={isLoading || !viewModel}>
            导出
          </button>
          <button type="button" onClick={() => setDialog({ type: 'download' })}>
            下载数据连接器
          </button>
          <button type="button" className="is-primary" onClick={openSelectionDialog} disabled={isLoading}>
            选择监控门店
          </button>
        </div>
      </header>

      <section className="global-setting-filter-bar" aria-label="配置中心筛选条件">
        <label>
          <span>门店范围</span>
          <select aria-label="门店范围" value={filters.campId} onChange={(event) => updateFilter('campId', event.target.value)}>
            {viewModel?.filterOptions.camps.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )) ?? null}
          </select>
        </label>
        <label>
          <span>授权状态</span>
          <select
            aria-label="授权状态"
            value={filters.authorizationStatus}
            onChange={(event) => updateFilter('authorizationStatus', event.target.value as GlobalSettingFilters['authorizationStatus'])}
          >
            {viewModel?.filterOptions.authorizationStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )) ?? null}
          </select>
        </label>
        <label>
          <span>连接器状态</span>
          <select
            aria-label="连接器状态"
            value={filters.connectorStatus}
            onChange={(event) => updateFilter('connectorStatus', event.target.value as GlobalSettingFilters['connectorStatus'])}
          >
            {viewModel?.filterOptions.connectorStatuses.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )) ?? null}
          </select>
        </label>
        <label className="global-setting-filter-bar__keyword">
          <span>关键词</span>
          <input aria-label="关键词" value={filters.keyword} placeholder="门店 / 城市 / 渠道" onChange={(event) => updateFilter('keyword', event.target.value)} />
        </label>
        <div className="global-setting-filter-bar__actions">
          <button type="button" onClick={submitFilters} disabled={isLoading}>
            查询
          </button>
          <button type="button" onClick={resetFilters} disabled={isLoading}>
            重置
          </button>
        </div>
      </section>

      <div className="global-setting-feedback" role="status" aria-label="配置中心操作反馈">
        {isLoading ? '配置中心数据加载中' : feedback}
      </div>

      <pre data-testid="global-setting-contract" className="global-setting-contract">
        {contractText}
      </pre>

      {error ? (
        <section className="global-setting-state-card global-setting-state-card--error" role="alert">
          <strong>配置中心数据加载失败</strong>
          <span>请检查门店上下文或稍后重新加载。</span>
          <button type="button" onClick={() => reload('配置中心数据已刷新')}>
            重新加载
          </button>
        </section>
      ) : null}

      {viewModel ? (
        <>
          <section className="global-setting-summary" aria-label="配置中心摘要指标">
            {viewModel.summary.map((metric) => (
              <article key={metric.label} className={`global-setting-summary-card global-setting-summary-card--${metric.tone}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.hint}</small>
              </article>
            ))}
          </section>

          <section className="global-setting-main-grid">
            <section className="global-setting-card">
              <div className="global-setting-card__header">
                <div>
                  <h2>监控门店管理</h2>
                  <p>每个账号最多支持开启 3 个门店的全域雷达服务。</p>
                </div>
                <span>更新于 {viewModel.updatedAt}</span>
              </div>

              {viewModel.stores.length === 0 ? (
                <section className="global-setting-state-card" role="status" aria-label="配置中心空态">
                  <strong>暂无已启用的监控门店</strong>
                  <span>请先下载数据连接器并选择需要监控的门店。</span>
                </section>
              ) : (
                <div className="global-setting-table-wrap">
                  <table className="global-setting-table" aria-label="监控门店列表">
                    <thead>
                      <tr>
                        <th>门店名称</th>
                        <th>连接器状态</th>
                        <th>监控状态</th>
                        <th>携程酒店</th>
                        <th>美团酒店</th>
                        <th>风险事项</th>
                        <th>最近同步</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewModel.stores.map((store) => (
                        <tr key={store.id}>
                          <td>
                            <strong>{store.name}</strong>
                            <span>{store.city}</span>
                          </td>
                          <td>
                            <StateTag tone={store.connectorStatus}>{connectorStatusText(store.connectorStatus)}</StateTag>
                          </td>
                          <td>{monitorStatusText(store.monitorStatus)}</td>
                          <td>
                            <StateTag tone={store.ctripAuthStatus === 'authorized' ? 'online' : store.ctripAuthStatus === 'failed' ? 'warning' : 'offline'}>
                              {authStatusText(store.ctripAuthStatus)}
                            </StateTag>
                          </td>
                          <td>
                            <StateTag tone={store.meituanAuthStatus === 'authorized' ? 'online' : store.meituanAuthStatus === 'failed' ? 'warning' : 'offline'}>
                              {authStatusText(store.meituanAuthStatus)}
                            </StateTag>
                          </td>
                          <td>{store.riskCount === 0 ? '正常' : `${store.riskCount} 项待处理`}</td>
                          <td>{store.updatedAt}</td>
                          <td>
                            <div className="global-setting-table__actions">
                              <button type="button" onClick={() => void openConfigDialog(store)}>
                                配置
                              </button>
                              <button type="button" onClick={() => navigate('/channels/globalRadar/globalData')}>
                                查看日志
                              </button>
                              <button type="button" onClick={() => setDialog({ type: 'remove', store })}>
                                移除
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <aside className="global-setting-side-column">
              <section className="global-setting-card">
                <div className="global-setting-card__header">
                  <div>
                    <h2>待办提醒</h2>
                    <p>优先处理授权异常和连接器延迟门店。</p>
                  </div>
                </div>
                <div className="global-setting-todo-list">
                  {viewModel.todos.map((todo) => (
                    <button key={todo.id} type="button" onClick={() => handleTodoAction(todo)}>
                      <strong>{todo.title}</strong>
                      <span>{todo.storeName}</span>
                      <small>{todo.level} 优先级</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="global-setting-card">
                <div className="global-setting-card__header">
                  <div>
                    <h2>快捷入口</h2>
                    <p>全部跳转到项目现有路由，不新增孤立页面。</p>
                  </div>
                </div>
                <div className="global-setting-quick-links">
                  {viewModel.quickLinks.map((link) => (
                    <button key={link.path} type="button" onClick={() => navigate(link.path)}>
                      {link.label}
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </>
      ) : null}

      {dialog?.type === 'download' ? (
        <div className="global-setting-modal-backdrop" role="presentation" onClick={() => setDialog(null)}>
          <section className="global-setting-modal global-setting-modal--small" role="dialog" aria-modal="true" aria-label="下载数据连接器" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>下载数据连接器</h3>
              <button type="button" aria-label="关闭下载数据连接器" onClick={() => setDialog(null)}>
                ×
              </button>
            </header>
            <ol>
              <li>步骤一：下载 AI 全域雷达数据连接器安装包。</li>
              <li>步骤二：在前台办公电脑保持开机并运行连接器。</li>
              <li>步骤三：完成携程酒店与美团酒店的账号授权。</li>
            </ol>
            <footer>
              <button type="button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => void confirmDownload()}>
                确认下载
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {dialog?.type === 'selection' && viewModel ? (
        <div className="global-setting-modal-backdrop" role="presentation" onClick={() => setDialog(null)}>
          <section className="global-setting-modal" role="dialog" aria-modal="true" aria-label="选择监控门店" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>选择监控门店</h3>
              <button type="button" aria-label="关闭选择监控门店" onClick={() => setDialog(null)}>
                ×
              </button>
            </header>
            <p>最多可选择 3 个监控门店，超出上限时请先移除旧门店。</p>
            <div className="global-setting-candidate-list">
              {viewModel.candidates.map((candidate) => {
                const checked = dialog.selectedPoiIds.includes(candidate.poiId)
                return (
                  <label key={candidate.poiId} className="global-setting-candidate">
                    <input type="checkbox" checked={checked} onChange={(event) => toggleSelection(candidate, event.target.checked)} />
                    <div>
                      <strong>{candidate.name}</strong>
                      <span>
                        {candidate.city} · {candidate.currentStatus === 'monitored' ? '已监控' : '可添加'}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
            <div className="global-setting-modal__inline-link">
              <button type="button" onClick={() => navigate('/InformationMaintenance/campInfo/edit')}>
                门店信息
              </button>
            </div>
            <footer>
              <button type="button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => void confirmSelection()}>
                确认
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {dialog?.type === 'config' ? (
        <div className="global-setting-modal-backdrop" role="presentation" onClick={() => setDialog(null)}>
          <section className="global-setting-modal" role="dialog" aria-modal="true" aria-label="Ebooking授权配置" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>Ebooking授权配置</h3>
              <button type="button" aria-label="关闭Ebooking授权配置" onClick={() => setDialog(null)}>
                ×
              </button>
            </header>
            <div className="global-setting-config-title">
              <strong>{dialog.detail.storeName}</strong>
              <span>
                连接器版本 {dialog.detail.connectorVersion} · 最近同步 {dialog.detail.lastSyncAt}
              </span>
            </div>
            <ConfigChannel
              title="携程酒店"
              detail={dialog.detail.ctrip}
              usernameLabel="携程酒店用户名"
              passwordLabel="携程酒店密码"
              usernameError={dialog.errors.ctripUsername}
              passwordError={dialog.errors.ctripPassword}
              onToggle={(checked) => updateConfigField('ctrip', 'enabled', checked)}
              onUsernameChange={(value) => updateConfigField('ctrip', 'username', value)}
              onPasswordChange={(value) => updateConfigField('ctrip', 'password', value)}
            />
            <ConfigChannel
              title="美团酒店"
              detail={dialog.detail.meituan}
              usernameLabel="美团酒店用户名"
              passwordLabel="美团酒店密码"
              usernameError={dialog.errors.meituanUsername}
              passwordError={dialog.errors.meituanPassword}
              onToggle={(checked) => updateConfigField('meituan', 'enabled', checked)}
              onUsernameChange={(value) => updateConfigField('meituan', 'username', value)}
              onPasswordChange={(value) => updateConfigField('meituan', 'password', value)}
            />
            <ul className="global-setting-config-notes">
              {dialog.detail.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
            <footer>
              <button type="button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => void confirmConfigSave()}>
                保存配置
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {dialog?.type === 'remove' ? (
        <div className="global-setting-modal-backdrop" role="presentation" onClick={() => setDialog(null)}>
          <section className="global-setting-modal global-setting-modal--small" role="dialog" aria-modal="true" aria-label="移除监控门店" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>移除监控门店</h3>
              <button type="button" aria-label="关闭移除监控门店" onClick={() => setDialog(null)}>
                ×
              </button>
            </header>
            <p>移除后，该门店将不再出现在监控列表中，之后可重新添加。</p>
            <footer>
              <button type="button" onClick={() => setDialog(null)}>
                取消
              </button>
              <button type="button" className="is-primary" onClick={() => void confirmRemoveStore()}>
                确认移除
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function ConfigChannel({
  title,
  detail,
  usernameLabel,
  passwordLabel,
  usernameError,
  passwordError,
  onToggle,
  onUsernameChange,
  onPasswordChange,
}: {
  title: string
  detail: GlobalSettingStoreConfig['ctrip']
  usernameLabel: string
  passwordLabel: string
  usernameError?: string
  passwordError?: string
  onToggle: (checked: boolean) => void
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
}) {
  return (
    <section className="global-setting-config-card">
      <div className="global-setting-config-card__header">
        <label>
          <input type="checkbox" checked={detail.enabled} onChange={(event) => onToggle(event.target.checked)} />
          <span>{title}</span>
        </label>
        <StateTag tone={detail.authStatus === 'authorized' ? 'online' : detail.authStatus === 'failed' ? 'warning' : 'offline'}>
          {authStatusText(detail.authStatus)}
        </StateTag>
      </div>
      <div className="global-setting-config-card__form">
        <label>
          <span>{usernameLabel}</span>
          <input aria-label={usernameLabel} value={detail.username} disabled={!detail.enabled} onChange={(event) => onUsernameChange(event.target.value)} />
          {usernameError ? <small>{usernameError}</small> : null}
        </label>
        <label>
          <span>{passwordLabel}</span>
          <input aria-label={passwordLabel} value={detail.password} disabled={!detail.enabled} onChange={(event) => onPasswordChange(event.target.value)} />
          {passwordError ? <small>{passwordError}</small> : null}
        </label>
      </div>
      <p>最近校验：{detail.lastVerifiedAt}</p>
    </section>
  )
}

function StateTag({ tone, children }: { tone: 'online' | 'warning' | 'offline'; children: string }) {
  return <span className={`global-setting-state-tag global-setting-state-tag--${tone}`}>{children}</span>
}

function validateConfig(detail: GlobalSettingStoreConfig) {
  const errors: Partial<Record<'ctripUsername' | 'ctripPassword' | 'meituanUsername' | 'meituanPassword', string>> = {}
  if (detail.ctrip.enabled && !detail.ctrip.username.trim()) errors.ctripUsername = '请输入携程酒店用户名'
  if (detail.ctrip.enabled && !detail.ctrip.password.trim()) errors.ctripPassword = '请输入携程酒店密码'
  if (detail.meituan.enabled && !detail.meituan.username.trim()) errors.meituanUsername = '请输入美团酒店用户名'
  if (detail.meituan.enabled && !detail.meituan.password.trim()) errors.meituanPassword = '请输入美团酒店密码'
  return errors
}

function connectorStatusText(status: GlobalSettingStoreRow['connectorStatus']) {
  if (status === 'warning') return '更新延迟'
  if (status === 'offline') return '离线'
  return '在线'
}

function monitorStatusText(status: GlobalSettingStoreRow['monitorStatus']) {
  if (status === 'delay') return '更新延迟'
  if (status === 'paused') return '暂停采集'
  return '检查中'
}

function authStatusText(status: GlobalSettingStoreRow['ctripAuthStatus']) {
  if (status === 'authorized') return '已授权'
  if (status === 'failed') return '授权失败'
  return '未授权'
}
