import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLocation } from 'react-router-dom'
import {
  createCustomChannel,
  createDefaultCustomChannelQuery,
  deleteCustomChannel,
  fetchCustomChannelDashboard,
  getColorOptions,
  saveSystemChannels,
  toggleCustomChannelStatus,
  updateCustomChannel,
  type CustomChannelDashboard,
  type CustomChannelDialogInput,
  type CustomChannelRecord,
} from '../services/customChannel'
import './CustomChannelPage.css'

type ChannelDialogState =
  | { mode: 'create'; value: CustomChannelDialogInput }
  | { mode: 'edit'; channelId: string; value: CustomChannelDialogInput }

function createEmptyDialogValue(): CustomChannelDialogInput {
  return {
    name: '',
    color: '',
    colorName: '',
  }
}

export function CustomChannelPage() {
  const location = useLocation()
  const query = useMemo(() => createDefaultCustomChannelQuery(new URLSearchParams(location.search)), [location.search])
  const [dashboard, setDashboard] = useState<CustomChannelDashboard | null>(null)
  const [systemDraft, setSystemDraft] = useState<Record<string, boolean>>({})
  const [feedback, setFeedback] = useState('自定义渠道加载中')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingSystem, setIsSavingSystem] = useState(false)
  const [editingSystem, setEditingSystem] = useState(false)
  const [dialog, setDialog] = useState<ChannelDialogState | null>(null)
  const [dialogError, setDialogError] = useState('')
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<CustomChannelRecord | null>(null)

  const loadDashboard = useCallback(async (reason: 'initial' | 'retry') => {
    setIsLoading(true)
    setError('')
    setFeedback(reason === 'retry' ? '正在重新加载自定义渠道' : '自定义渠道加载中')

    try {
      const nextDashboard = await fetchCustomChannelDashboard(query)
      setDashboard(nextDashboard)
      setSystemDraft(Object.fromEntries(nextDashboard.systemChannels.map((channel) => [channel.id, channel.enabled])))
      setFeedback(nextDashboard.customChannels.length === 0 ? '当前暂无自定义渠道' : '已加载自定义渠道配置')
    } catch (reasonError) {
      setDashboard(null)
      setFeedback('')
      setError(reasonError instanceof Error ? reasonError.message : '自定义渠道加载失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }, [query])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard('initial')
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadDashboard])

  async function handleSystemSave() {
    setIsSavingSystem(true)
    setError('')
    setFeedback('正在保存系统默认渠道设置')

    try {
      const nextDashboard = await saveSystemChannels(systemDraft, query)
      setDashboard(nextDashboard)
      setEditingSystem(false)
      setFeedback('系统默认渠道设置已保存')
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : '系统默认渠道保存失败，请稍后重试')
    } finally {
      setIsSavingSystem(false)
    }
  }

  function openCreateDialog() {
    setDialog({ mode: 'create', value: createEmptyDialogValue() })
    setDialogError('')
    setIsColorPickerOpen(false)
  }

  function openEditDialog(channel: CustomChannelRecord) {
    setDialog({
      mode: 'edit',
      channelId: channel.id,
      value: {
        name: channel.name,
        color: channel.color,
        colorName: channel.colorName,
      },
    })
    setDialogError('')
    setIsColorPickerOpen(false)
  }

  function updateDialogValue(patch: Partial<CustomChannelDialogInput>) {
    setDialog((current) => (current ? { ...current, value: { ...current.value, ...patch } } : current))
  }

  async function handleDialogConfirm() {
    if (!dialog) return

    setDialogError('')
    setFeedback(dialog.mode === 'create' ? '正在添加自定义渠道' : '正在更新自定义渠道')

    try {
      const nextDashboard =
        dialog.mode === 'create'
          ? await createCustomChannel(dialog.value, query)
          : await updateCustomChannel(dialog.channelId, dialog.value, query)

      setDashboard(nextDashboard)
      setDialog(null)
      setIsColorPickerOpen(false)
      setFeedback(dialog.mode === 'create' ? '自定义渠道已添加' : '自定义渠道已更新')
    } catch (reasonError) {
      setDialogError(reasonError instanceof Error ? reasonError.message : '渠道操作失败，请稍后重试')
    }
  }

  async function handleToggle(channel: CustomChannelRecord) {
    setFeedback(channel.enabled ? `正在停用${channel.name}` : `正在启用${channel.name}`)

    try {
      const nextDashboard = await toggleCustomChannelStatus(channel.id, !channel.enabled, query)
      setDashboard(nextDashboard)
      setFeedback(channel.enabled ? `${channel.name}已停用` : `${channel.name}已启用`)
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : '自定义渠道状态更新失败，请稍后重试')
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return

    setFeedback('正在删除自定义渠道')

    try {
      const nextDashboard = await deleteCustomChannel(pendingDelete.id, query)
      setDashboard(nextDashboard)
      setPendingDelete(null)
      setFeedback('自定义渠道已删除')
    } catch (reasonError) {
      setError(reasonError instanceof Error ? reasonError.message : '删除自定义渠道失败，请稍后重试')
    }
  }

  return (
    <>
      <div className="sr-only-heading" aria-label="自定义渠道数据服务">
        {(dashboard?.audit ?? []).join(';')}
      </div>
      <div
        className="custom-channel-page"
        data-provider={dashboard?.provider ?? query.provider}
        data-response-state={dashboard?.state ?? query.mockState}
      >
        <div className="sr-only-heading">自定义渠道</div>

        <div className="custom-channel-tip">
          系统默认渠道不支持编辑和删除。点击“编辑”按钮，可停用或启用渠道，停用后不能在列表选项看到。
        </div>

        <div className="custom-channel-feedback" role="status" aria-label="自定义渠道操作反馈">
          {feedback}
        </div>

        {error ? (
          <section className="custom-channel-error" role="alert" aria-label="自定义渠道数据错误">
            <strong>自定义渠道数据错误</strong>
            <span>{error}</span>
            <button type="button" onClick={() => void loadDashboard('retry')}>
              重试
            </button>
          </section>
        ) : null}

        <section className="custom-channel-section">
          <header className="custom-channel-title">
            <h2>系统默认渠道</h2>
            <button
              type="button"
              className="custom-channel-primary"
              disabled={isLoading || isSavingSystem}
              onClick={() => (editingSystem ? void handleSystemSave() : setEditingSystem(true))}
            >
              {editingSystem ? '保 存' : '编 辑'}
            </button>
          </header>
          <div className="custom-channel-grid" aria-label="系统默认渠道">
            {(dashboard?.systemChannels ?? []).map((channel) => (
              <label
                key={channel.id}
                className={`custom-channel-card${!systemDraft[channel.id] ? ' is-disabled' : ''}`}
                style={{ '--channel-color': channel.color } as CSSProperties}
              >
                {editingSystem ? (
                  <input
                    type="checkbox"
                    checked={systemDraft[channel.id] ?? false}
                    aria-label={`${channel.name}启用`}
                    onChange={(event) => {
                      const checked = event.target.checked
                      setSystemDraft((current) => ({ ...current, [channel.id]: checked }))
                    }}
                  />
                ) : null}
                <span>{channel.name}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="custom-channel-section custom-channel-section--custom">
          <header className="custom-channel-title">
            <h2>自定义渠道</h2>
            <button type="button" className="custom-channel-secondary" disabled={isLoading} onClick={openCreateDialog}>
              添加渠道
            </button>
          </header>

          {dashboard && dashboard.customChannels.length > 0 ? (
            <div className="custom-channel-custom-list" role="region" aria-label="自定义渠道列表">
              {dashboard.customChannels.map((channel) => (
                <article key={channel.id} className="custom-channel-custom-card">
                  <div className="custom-channel-custom-card__header">
                    <div className="custom-channel-custom-card__title">
                      <span className="custom-channel-dot" style={{ backgroundColor: channel.color }} />
                      <strong>{channel.name}</strong>
                      <em>{channel.enabled ? '启用中' : '已停用'}</em>
                    </div>
                    <span>{channel.code}</span>
                  </div>
                  <p>{channel.note}</p>
                  <dl className="custom-channel-meta">
                    <div>
                      <dt>最近更新</dt>
                      <dd>{channel.updatedAt}</dd>
                    </div>
                    <div>
                      <dt>操作人</dt>
                      <dd>{channel.operator}</dd>
                    </div>
                  </dl>
                  <div className="custom-channel-actions">
                    <button type="button" aria-label={`编辑 自定义渠道 ${channel.name}`} onClick={() => openEditDialog(channel)}>
                      编辑
                    </button>
                    <button type="button" aria-label={`${channel.enabled ? '停用' : '启用'} 自定义渠道 ${channel.name}`} onClick={() => void handleToggle(channel)}>
                      {channel.enabled ? '停用' : '启用'}
                    </button>
                    <button type="button" aria-label={`删除 自定义渠道 ${channel.name}`} onClick={() => setPendingDelete(channel)}>
                      删除
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="custom-channel-empty" aria-label="自定义渠道空态">
              <strong>暂无自定义渠道</strong>
              <span>可通过“添加渠道”补充线下合作、社群团购或包租业务来源。</span>
            </div>
          )}
        </section>

        {dialog ? (
          <div className="custom-channel-modal-backdrop">
            <div
              className="custom-channel-modal"
              role="dialog"
              aria-modal="true"
              aria-label={dialog.mode === 'create' ? '添加渠道' : '编辑渠道'}
            >
              <header>
                <h2>{dialog.mode === 'create' ? '添加渠道' : '编辑渠道'}</h2>
                <button type="button" aria-label="关闭" onClick={() => setDialog(null)} />
              </header>
              <label>
                <span>渠道名称</span>
                <input
                  aria-label="渠道名称"
                  placeholder="请输入渠道名称"
                  value={dialog.value.name}
                  onChange={(event) => updateDialogValue({ name: event.target.value })}
                />
              </label>
              <label className="custom-channel-color-field">
                <span>渠道颜色</span>
                <div>
                  <button type="button" className="custom-channel-color-picker" aria-label="渠道颜色" onClick={() => setIsColorPickerOpen((value) => !value)}>
                    {dialog.value.colorName || '请选择渠道颜色'}
                  </button>
                  {isColorPickerOpen ? (
                    <div className="custom-channel-color-panel">
                      {getColorOptions().map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          aria-label={`选择渠道颜色 ${option.label}`}
                          className={dialog.value.color === option.value ? 'is-selected' : ''}
                          onClick={() => {
                            updateDialogValue({ color: option.value, colorName: option.label })
                            setIsColorPickerOpen(false)
                          }}
                        >
                          <span style={{ backgroundColor: option.value }} />
                          {option.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </label>
              {dialogError ? <div className="custom-channel-dialog-error">{dialogError}</div> : null}
              <footer>
                <button type="button" onClick={() => setDialog(null)}>
                  取 消
                </button>
                <button type="button" className="custom-channel-primary" onClick={() => void handleDialogConfirm()}>
                  确 定
                </button>
              </footer>
            </div>
          </div>
        ) : null}

        {pendingDelete ? (
          <div className="custom-channel-modal-backdrop">
            <div className="custom-channel-modal custom-channel-modal--confirm" role="dialog" aria-modal="true" aria-label="删除渠道确认">
              <header>
                <h2>删除渠道确认</h2>
                <button type="button" aria-label="关闭" onClick={() => setPendingDelete(null)} />
              </header>
              <div className="custom-channel-confirm-copy">
                <strong>{pendingDelete.name}</strong>
                <span>删除后不可恢复，请确认当前渠道已不再参与前台筛选与统计。</span>
              </div>
              <footer>
                <button type="button" onClick={() => setPendingDelete(null)}>
                  取消删除
                </button>
                <button type="button" className="custom-channel-primary" onClick={() => void handleDeleteConfirm()}>
                  确认删除
                </button>
              </footer>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
