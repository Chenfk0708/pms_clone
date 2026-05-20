import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import { useLocation } from 'react-router-dom'
import {
  createDefaultShiftSettingFilters,
  fetchShiftSettingDashboard,
  saveShiftConfigs,
  saveShiftGoods,
  type ShiftConfig,
  type ShiftConfigDraft,
  type ShiftGoodsDraft,
  type ShiftGoodsItem,
  type ShiftSettingDashboard,
  type ShiftSettingFilters,
} from '../services/shiftSetting'
import './ShiftSettingPage.css'

export function ShiftSettingPage() {
  const location = useLocation()
  const filters = useMemo(() => createDefaultShiftSettingFilters(new URLSearchParams(location.search)), [location.search])
  const [dashboard, setDashboard] = useState<ShiftSettingDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('正在加载交接班设置')
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false)
  const [goodsDialogOpen, setGoodsDialogOpen] = useState(false)
  const [shiftDrafts, setShiftDrafts] = useState<ShiftConfigDraft[]>([])
  const [goodsDrafts, setGoodsDrafts] = useState<ShiftGoodsDraft[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    void loadDashboard(filters)
  }, [filters])

  async function loadDashboard(nextFilters: ShiftSettingFilters) {
    setIsLoading(true)
    setError('')

    try {
      const nextDashboard = await fetchShiftSettingDashboard(nextFilters)
      setDashboard(nextDashboard)
      setFeedback(nextDashboard.shiftConfigs.length === 0 && nextDashboard.goodsConfigs.length === 0 ? '当前暂无交接班配置' : '已加载交接班设置')
    } catch (loadError) {
      setDashboard(null)
      setError(loadError instanceof Error ? loadError.message : '交接班设置加载失败，请稍后重试')
      setFeedback('交接班设置加载失败')
    } finally {
      setIsLoading(false)
    }
  }

  function openShiftDialog() {
    setShiftDrafts((dashboard?.shiftConfigs ?? []).map(toShiftDraft))
    setShiftDialogOpen(true)
  }

  function openGoodsDialog() {
    setGoodsDrafts((dashboard?.goodsConfigs ?? []).map(toGoodsDraft))
    setGoodsDialogOpen(true)
  }

  async function submitShiftDrafts() {
    setIsSubmitting(true)
    try {
      const result = await saveShiftConfigs(filters, shiftDrafts)
      setDashboard(result.dashboard)
      setFeedback(result.message)
      setShiftDialogOpen(false)
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : '保存班次设置失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitGoodsDrafts() {
    setIsSubmitting(true)
    try {
      const result = await saveShiftGoods(filters, goodsDrafts)
      setDashboard(result.dashboard)
      setFeedback(result.message)
      setGoodsDialogOpen(false)
    } catch (submitError) {
      setFeedback(submitError instanceof Error ? submitError.message : '保存交班物品失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const serviceAudit = [
    ...(dashboard?.audit ?? []),
    ...(dashboard ? [] : [`mockState=${filters.mockState}`, 'shiftCount=0', 'goodsCount=0']),
  ]

  return (
    <>
      <pre hidden aria-label="交接班设置数据服务">
        {serviceAudit.join('\n')}
      </pre>

      <div className="shift-setting-page">
        <div role="status" aria-label="交接班设置操作反馈">
          {feedback}
        </div>

        {error ? (
          <section className="shift-setting-empty" role="alert" aria-label="交接班设置数据错误">
            <div>
              <p>{error}</p>
              <button type="button" className="shift-setting-primary" onClick={() => void loadDashboard(filters)}>
                重新加载交接班设置
              </button>
            </div>
          </section>
        ) : null}

        <section className="shift-setting-section" role="region" aria-label="班次设置">
          <header className="shift-setting-section__header">
            <div className="shift-setting-section__title">
              <h2>班次设置</h2>
              <span>最近更新时间：{dashboard?.requestedAt ?? '--'}</span>
            </div>
            <button type="button" className="shift-setting-primary" onClick={openShiftDialog} disabled={isLoading || !!error}>
              班次设置
            </button>
          </header>

          {isLoading ? (
            <div className="shift-setting-empty">正在加载班次配置...</div>
          ) : dashboard && dashboard.shiftConfigs.length > 0 ? (
            <table className="shift-setting-table">
              <thead>
                <tr>
                  <th className="shift-setting-col">班次名称</th>
                  <th className="shift-setting-col">开始时间</th>
                  <th className="shift-setting-col">结束时间</th>
                  <th className="shift-setting-col--members">班次成员</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.shiftConfigs.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.startTime}</td>
                    <td>{item.endTime}</td>
                    <td>{item.memberNames.join('、')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="shift-setting-empty">
              <span>暂无班次， 点击新增</span>
            </div>
          )}
        </section>

        <section className="shift-setting-section" role="region" aria-label="交班物品">
          <header className="shift-setting-section__header">
            <div className="shift-setting-section__title">
              <h2>交班物品</h2>
              <span>最近更新时间：{dashboard?.requestedAt ?? '--'}</span>
            </div>
            <button type="button" className="shift-setting-primary" onClick={openGoodsDialog} disabled={isLoading || !!error}>
              添加物品
            </button>
          </header>

          {isLoading ? (
            <div className="shift-setting-empty">正在加载交班物品...</div>
          ) : dashboard && dashboard.goodsConfigs.length > 0 ? (
            <div>
              {dashboard.goodsConfigs.map((item) => (
                <div key={item.id}>{item.name}</div>
              ))}
            </div>
          ) : (
            <div className="shift-setting-empty">
              <span>暂无交班物品， 点击新增</span>
            </div>
          )}
        </section>

        {shiftDialogOpen ? (
          <div className="shift-setting-modal-mask">
            <section className="shift-setting-modal" role="dialog" aria-modal="true" aria-label="设置班次">
              <header className="shift-setting-modal__header">
                <h2>设置班次</h2>
                <button type="button" aria-label="关闭设置班次" onClick={() => setShiftDialogOpen(false)}>
                  ×
                </button>
              </header>
              <div className="shift-setting-modal__body">
                <button
                  type="button"
                  className="shift-setting-outline"
                  onClick={() =>
                    setShiftDrafts((current) => [
                      ...current,
                      { name: '', startTime: '', endTime: '', memberIds: [] },
                    ])
                  }
                >
                  + 新增班次
                </button>
                {shiftDrafts.map((draft, index) => (
                  <div key={`shift-draft-${index}`} className="shift-setting-shift-row">
                    <input
                      placeholder="请输入班次名称"
                      value={draft.name}
                      onChange={(event) => patchShiftDraft(setShiftDrafts, index, { name: event.target.value })}
                    />
                    <input
                      aria-label="开始时间"
                      value={draft.startTime}
                      onChange={(event) => patchShiftDraft(setShiftDrafts, index, { startTime: event.target.value })}
                    />
                    <input
                      aria-label="结束时间"
                      value={draft.endTime}
                      onChange={(event) => patchShiftDraft(setShiftDrafts, index, { endTime: event.target.value })}
                    />
                    <select
                      multiple
                      aria-label="班次成员"
                      value={draft.memberIds}
                      onChange={(event) =>
                        patchShiftDraft(setShiftDrafts, index, {
                          memberIds: [...event.currentTarget.selectedOptions].map((option) => option.value),
                        })
                      }
                    >
                      {(dashboard?.memberOptions ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <footer className="shift-setting-modal__footer">
                <button type="button" className="shift-setting-cancel" onClick={() => setShiftDialogOpen(false)} disabled={isSubmitting}>
                  取消
                </button>
                <button type="button" className="shift-setting-confirm" onClick={() => void submitShiftDrafts()} disabled={isSubmitting}>
                  确定
                </button>
              </footer>
            </section>
          </div>
        ) : null}

        {goodsDialogOpen ? (
          <div className="shift-setting-modal-mask">
            <section className="shift-setting-modal" role="dialog" aria-modal="true" aria-label="添加物品">
              <header className="shift-setting-modal__header">
                <h2>添加物品</h2>
                <button type="button" aria-label="关闭添加物品" onClick={() => setGoodsDialogOpen(false)}>
                  ×
                </button>
              </header>
              <div className="shift-setting-modal__body">
                <button
                  type="button"
                  className="shift-setting-outline"
                  onClick={() => setGoodsDrafts((current) => [...current, { name: '' }])}
                >
                  + 新增物品
                </button>
                {goodsDrafts.map((draft, index) => (
                  <div key={`goods-draft-${index}`} className="shift-setting-item-row">
                    <input
                      placeholder="请输入物品名称"
                      value={draft.name}
                      onChange={(event) => patchGoodsDraft(setGoodsDrafts, index, { name: event.target.value })}
                    />
                  </div>
                ))}
              </div>
              <footer className="shift-setting-modal__footer">
                <button type="button" className="shift-setting-cancel" onClick={() => setGoodsDialogOpen(false)} disabled={isSubmitting}>
                  取消
                </button>
                <button type="button" className="shift-setting-confirm" onClick={() => void submitGoodsDrafts()} disabled={isSubmitting}>
                  确定
                </button>
              </footer>
            </section>
          </div>
        ) : null}
      </div>
    </>
  )
}

function toShiftDraft(item: ShiftConfig): ShiftConfigDraft {
  return {
    id: item.id,
    name: item.name,
    startTime: item.startTime,
    endTime: item.endTime,
    memberIds: [...item.memberIds],
  }
}

function toGoodsDraft(item: ShiftGoodsItem): ShiftGoodsDraft {
  return {
    id: item.id,
    name: item.name,
  }
}

function patchShiftDraft(
  setDrafts: Dispatch<SetStateAction<ShiftConfigDraft[]>>,
  index: number,
  patch: Partial<ShiftConfigDraft>,
) {
  setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
}

function patchGoodsDraft(
  setDrafts: Dispatch<SetStateAction<ShiftGoodsDraft[]>>,
  index: number,
  patch: Partial<ShiftGoodsDraft>,
) {
  setDrafts((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
}
