import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  buildScrmMemberLevelRequest,
  createDefaultScrmMemberLevelFilters,
  fetchScrmMemberLevelDashboard,
  saveScrmMemberLevel,
  saveScrmMemberUpgradeRule,
  type ScrmMemberLevel,
  type ScrmMemberLevelDashboard,
  type ScrmMemberLevelFilters,
} from '../services/scrmMemberLevel'
import './ScrmMemberLevelPage.css'

type LevelDialogMode = 'create' | 'edit'

const statusLabel: Record<string, string> = {
  all: '全部状态',
  enabled: '已启用',
  disabled: '已停用',
}

function LevelDialog({
  mode,
  level,
  isSaving,
  onClose,
  onSave,
}: {
  mode: LevelDialogMode
  level: ScrmMemberLevel | null
  isSaving: boolean
  onClose: () => void
  onSave: (input: { id?: string; name: string; rank: number; cardColor: string }) => void
}) {
  const isEdit = mode === 'edit'
  const title = isEdit ? '编辑会员等级' : '新增会员等级'
  const [name, setName] = useState(level?.name ?? '')
  const [cardColor, setCardColor] = useState(level?.cardColor ?? '#d7b48e')
  const rank = level?.rank ?? 2

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSave({ id: level?.id, name, rank, cardColor })
  }

  return (
    <div className="scrm-member-overlay" role="presentation">
      <section
        className="scrm-member-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scrm-member-level-dialog-title"
      >
        <header className="scrm-member-modal__header">
          <h2 id="scrm-member-level-dialog-title">{title}</h2>
          <button type="button" className="scrm-member-close" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>

        <form className="scrm-member-form" onSubmit={handleSubmit}>
          <label className="scrm-member-field scrm-member-field--required">
            <span>等级名称：</span>
            <input aria-label="等级名称" placeholder="请输入等级名称" value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="scrm-member-field">
            <span>会员等级：</span>
            <input className="is-short" aria-label="会员等级" value={rank} disabled readOnly />
          </label>

          <div className="scrm-member-field scrm-member-inline-field">
            <span>免费升级条件：</span>
            <input className="is-short" value="0" readOnly aria-label="升级消费次数" />
            <em>次消费，或</em>
            <input className="is-short" value="0" readOnly aria-label="升级住宿天数" />
            <em>天</em>
          </div>

          <div className="scrm-member-field scrm-member-inline-field scrm-member-discount-row">
            <span>会员折扣：</span>
            <em>房源</em>
            <input className="is-short" value="1" readOnly aria-label="房源折扣" />
            <em>折，商品</em>
            <input className="is-short" value="1" readOnly aria-label="商品折扣" />
            <em>折</em>
            <small>折扣请输入1-10</small>
          </div>

          <label className="scrm-member-field">
            <span>会员卡面：</span>
            <input aria-label="会员卡面颜色" className="scrm-member-color-input" type="color" value={cardColor} onChange={(event) => setCardColor(event.target.value)} />
          </label>

          <label className="scrm-member-field">
            <span>会员权益：</span>
            <input aria-label="会员权益" placeholder="请选择会员权益" value={level?.benefits === '-' ? '' : level?.benefits ?? ''} readOnly />
          </label>

          <footer className="scrm-member-modal__footer">
            <button type="button" className="scrm-member-ghost-button" onClick={onClose} disabled={isSaving}>
              取 消
            </button>
            <button type="submit" className="scrm-member-primary-button" disabled={isSaving}>
              提交会员等级
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}

function UpgradeSettingsDrawer({
  dashboard,
  isSaving,
  onClose,
  onSave,
}: {
  dashboard: ScrmMemberLevelDashboard
  isSaving: boolean
  onClose: () => void
  onSave: (ruleId: string) => void
}) {
  const selectedRule = dashboard.upgradeRules.find((rule) => rule.selected)?.id ?? dashboard.upgradeRules[0]?.id ?? ''
  const [ruleId, setRuleId] = useState(selectedRule)

  return (
    <div className="scrm-member-drawer-layer" role="presentation">
      <section
        className="scrm-member-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scrm-member-upgrade-title"
      >
        <header className="scrm-member-drawer__header">
          <h2 id="scrm-member-upgrade-title">会员升级设置</h2>
          <button type="button" className="scrm-member-close" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="scrm-member-drawer__body">
          <section className="scrm-member-rule-block">
            <h3>计算累计时间段</h3>
            <label className="scrm-member-radio">
              <input type="radio" name="member-cycle" defaultChecked />
              <span>一个自然年</span>
            </label>
          </section>

          <section className="scrm-member-rule-block">
            <h3>会员升级规则</h3>
            <div className="scrm-member-rule-list">
              {dashboard.upgradeRules.map((rule) => (
                <label key={rule.id} className="scrm-member-radio">
                  <input
                    type="radio"
                    name="member-upgrade-rule"
                    aria-label={rule.id === 'stay-days' ? '用户总计成功预订的天数' : rule.label}
                    checked={ruleId === rule.id}
                    onChange={() => setRuleId(rule.id)}
                  />
                  <span>{rule.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <footer className="scrm-member-drawer__footer">
          <button type="button" className="scrm-member-ghost-button" onClick={onClose} disabled={isSaving}>
            取 消
          </button>
          <button type="button" className="scrm-member-primary-button" onClick={() => onSave(ruleId)} disabled={isSaving}>
            保存升级设置
          </button>
        </footer>
      </section>
    </div>
  )
}

export function ScrmMemberLevelPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const initialFilters = useMemo(() => createDefaultScrmMemberLevelFilters(new URLSearchParams(location.search)), [location.search])
  const [filters, setFilters] = useState<ScrmMemberLevelFilters>(initialFilters)
  const [dashboard, setDashboard] = useState<ScrmMemberLevelDashboard | null>(null)
  const [feedback, setFeedback] = useState('数据加载中')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [dialogMode, setDialogMode] = useState<LevelDialogMode | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<ScrmMemberLevel | null>(null)
  const [showUpgradeDrawer, setShowUpgradeDrawer] = useState(false)

  const loadDashboard = useCallback(async (nextFilters: ScrmMemberLevelFilters, reason: 'initial' | 'query' | 'refresh' | 'reset') => {
    setIsLoading(true)
    setError('')
    setFeedback('数据加载中')

    try {
      const nextDashboard = await fetchScrmMemberLevelDashboard(nextFilters)
      setDashboard(nextDashboard)
      if (nextDashboard.levels.length === 0) {
        setFeedback('暂无符合条件的会员等级')
      } else if (reason === 'query') {
        setFeedback('已按筛选条件更新')
      } else if (reason === 'refresh') {
        setFeedback('数据已刷新')
      } else if (reason === 'reset') {
        setFeedback('筛选条件已重置')
      } else {
        setFeedback('数据已更新')
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '会员等级加载失败，请稍后重试'
      setError(message)
      setFeedback(message)
      setDashboard(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard(initialFilters, 'initial')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [initialFilters, loadDashboard])

  const canExport = Boolean(dashboard && dashboard.levels.length > 0 && !isLoading)
  const requestSummary = buildScrmMemberLevelRequest(filters)
  const selectedStore = dashboard?.stores.find((item) => item.value === filters.storeId)?.label ?? '全部门店'

  function updateFilter<K extends keyof ScrmMemberLevelFilters>(key: K, value: ScrmMemberLevelFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void loadDashboard(filters, 'query')
  }

  function handleReset() {
    const nextFilters = createDefaultScrmMemberLevelFilters(new URLSearchParams(location.search))
    setFilters(nextFilters)
    void loadDashboard(nextFilters, 'reset')
  }

  function handleRefresh() {
    void loadDashboard(filters, 'refresh')
  }

  function handleExport() {
    setFeedback(`导出任务已创建：会员等级-${filters.status || 'all'}.xlsx`)
  }

  function openCreateDialog() {
    setSelectedLevel(null)
    setDialogMode('create')
  }

  function openEditDialog(level: ScrmMemberLevel) {
    setSelectedLevel(level)
    setDialogMode('edit')
  }

  async function handleSaveLevel(input: { id?: string; name: string; rank: number; cardColor: string }) {
    setIsSaving(true)
    try {
      await saveScrmMemberLevel({
        ...input,
        roomDiscount: '1',
        goodsDiscount: '1',
        benefitIds: [],
      })
      setDialogMode(null)
      setFeedback('会员等级已保存')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : '会员等级保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSaveUpgradeRule(ruleId: string) {
    setIsSaving(true)
    try {
      await saveScrmMemberUpgradeRule(ruleId)
      setShowUpgradeDrawer(false)
      setFeedback('升级设置已保存')
    } catch (saveError) {
      setFeedback(saveError instanceof Error ? saveError.message : '升级设置保存失败，请稍后重试')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="scrm-member-level-page">
      <section className="scrm-member-level-panel">
        <header className="scrm-member-level-panel__header">
          <div className="scrm-member-title">
            <h1>会员等级列表</h1>
            <p>最多只可以设置值8个等级，建议3-6个等级即可</p>
          </div>
          <div className="scrm-member-actions">
            <button type="button" onClick={openCreateDialog} disabled={isLoading}>
              新建会员等级
            </button>
            <button type="button" onClick={() => setShowUpgradeDrawer(true)} disabled={isLoading || !dashboard}>
              会员升级设置
            </button>
          </div>
        </header>

        <div role="status" aria-label="会员等级操作反馈" className="scrm-member-feedback">
          {feedback}
        </div>

        <form className="scrm-member-filters" aria-label="会员等级筛选" onSubmit={handleSubmit}>
          <label>
            <span>门店</span>
            <select aria-label="门店" value={filters.storeId} disabled={isLoading || !dashboard} onChange={(event) => updateFilter('storeId', event.target.value)}>
              {(dashboard?.stores ?? [{ value: 'all', label: '全部门店' }]).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>等级状态</span>
            <select aria-label="等级状态" value={filters.status} disabled={isLoading || !dashboard} onChange={(event) => updateFilter('status', event.target.value)}>
              {(dashboard?.statusOptions ?? [{ value: 'all', label: '全部状态' }]).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            <span>关键词</span>
            <input aria-label="关键词" value={filters.keyword} disabled={isLoading} placeholder="等级名称/等级序号" onChange={(event) => updateFilter('keyword', event.target.value)} />
          </label>
          <div className="scrm-member-filter-actions">
            <button type="submit" disabled={isLoading}>查询</button>
            <button type="button" disabled={isLoading} onClick={handleReset}>重置</button>
            <button type="button" disabled={isLoading} onClick={handleRefresh}>刷新</button>
            <button type="button" disabled={!canExport} onClick={handleExport}>导出</button>
          </div>
        </form>

        <section className="scrm-member-current" aria-label="当前筛选条件">
          <span>{selectedStore}</span>
          <span>{statusLabel[filters.status] ?? filters.status}</span>
          <span>{requestSummary.keyword || '全部等级'}</span>
        </section>

        {isLoading && <section className="scrm-member-loading" aria-label="会员等级加载状态">会员等级数据加载中</section>}

        {error && (
          <section className="scrm-member-error" role="alert" aria-label="会员等级数据错误">
            <strong>会员等级加载失败</strong>
            <span>{error}</span>
            <button type="button" onClick={handleRefresh}>重新加载</button>
          </section>
        )}

        {dashboard && !error && (
          <>
            <section className="scrm-member-metrics" aria-label="会员等级核心指标">
              {dashboard.metrics.map((metric) => (
                <article key={metric.key}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <em>{metric.description}</em>
                </article>
              ))}
            </section>

            <table className="scrm-member-table" aria-label="会员等级列表">
              <thead>
                <tr>
                  <th>会员等级</th>
                  <th>等级名称</th>
                  <th>免费升级条件</th>
                  <th>会员折扣</th>
                  <th>会员权益</th>
                  <th>会员卡面</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.levels.length === 0 ? (
                  <tr>
                    <td colSpan={8}>暂无会员等级</td>
                  </tr>
                ) : dashboard.levels.map((level) => (
                  <tr key={level.id}>
                    <td>等级{level.rank}</td>
                    <td>{level.name}</td>
                    <td>{level.upgradeCondition}</td>
                    <td>{level.discount}</td>
                    <td>{level.benefits}</td>
                    <td>
                      <span className="scrm-member-card-preview" aria-label={`会员卡面 ${level.cardColor}`}>
                        <i style={{ backgroundColor: level.cardColor }} />
                      </span>
                    </td>
                    <td>
                      <span className={`scrm-member-status is-${level.status}`}>{level.status === 'enabled' ? '已启用' : '已停用'}</span>
                    </td>
                    <td>
                      <button type="button" className="scrm-member-link-button" onClick={() => openEditDialog(level)}>
                        编辑 {level.name}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <section className="scrm-member-quick" aria-label="会员等级快捷入口">
              <button type="button" onClick={() => navigate('/scrm/memberCenter/equity')}>查看会员权益</button>
              <button type="button" onClick={() => navigate('/scrm/memberCenter/integrate')}>查看会员积分</button>
            </section>
          </>
        )}
      </section>

      {dialogMode ? (
        <LevelDialog
          mode={dialogMode}
          level={selectedLevel}
          isSaving={isSaving}
          onClose={() => setDialogMode(null)}
          onSave={handleSaveLevel}
        />
      ) : null}
      {showUpgradeDrawer && dashboard ? (
        <UpgradeSettingsDrawer
          dashboard={dashboard}
          isSaving={isSaving}
          onClose={() => setShowUpgradeDrawer(false)}
          onSave={handleSaveUpgradeRule}
        />
      ) : null}
    </div>
  )
}
