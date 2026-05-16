import { useState } from 'react'
import './FinanceSettingPage.css'

const saleClosureOptions = ['普通关房', '维修房', '保留房', '屏蔽关房', '联动关房']

export function FinanceSettingPage() {
  const [editing, setEditing] = useState(false)
  const [allocationMode, setAllocationMode] = useState<'calendar' | 'average'>('calendar')

  function cancelEdit() {
    setAllocationMode('calendar')
    setEditing(false)
  }

  return (
    <div className="finance-setting-page">
      <section className="finance-setting-panel" aria-label="财务设置">
        <h1 className="finance-setting-sr-title">财务设置</h1>

        <section className="finance-setting-section">
          <h2>夜审设置</h2>
          <div className="finance-setting-row finance-setting-row--night">
            <div className="finance-setting-row-main">
              <span className="finance-setting-label">夜审</span>
              <button type="button" role="switch" aria-label="夜审" aria-checked="false" className="finance-switch" />
              <p>开启后，每天指定时间会自动进行夜审。</p>
            </div>
            <button type="button" className="finance-time-select" disabled>
              自动夜审时间 <span>06:00</span>
            </button>
          </div>
        </section>

        <section className="finance-setting-section">
          <h2>分摊设置</h2>
          <div className="finance-setting-content">
            <div className="finance-setting-line">
              <span>连住订单分摊(一天仅能修改一次，请谨慎操作。)</span>
            </div>
            <div className="finance-setting-options">
              <label>
                <input
                  type="radio"
                  name="finance-allocation"
                  aria-label="按日历价分摊"
                  checked={allocationMode === 'calendar'}
                  disabled={!editing}
                  onChange={() => setAllocationMode('calendar')}
                />
                按日历价分摊
              </label>
              <label>
                <input
                  type="radio"
                  name="finance-allocation"
                  aria-label="平均分摊"
                  checked={allocationMode === 'average'}
                  disabled={!editing}
                  onChange={() => setAllocationMode('average')}
                />
                平均分摊
              </label>
            </div>
          </div>
        </section>

        <section className="finance-setting-section">
          <h2>可售设置</h2>
          <div className="finance-setting-content">
            <div className="finance-setting-line">
              <span>关房计入可售(一天仅能修改一次，请谨慎操作。)</span>
            </div>
            <div className="finance-setting-actions-row">
              <div className="finance-setting-options">
                {saleClosureOptions.map((label) => (
                  <label key={label}>
                    <input type="checkbox" aria-label={label} disabled={!editing} />
                    {label}
                  </label>
                ))}
              </div>

              {editing ? (
                <div className="finance-setting-inline-actions">
                  <button type="button" onClick={cancelEdit}>
                    取消
                  </button>
                  <button type="button" onClick={() => setEditing(false)}>
                    保存
                  </button>
                </div>
              ) : (
                <button type="button" className="finance-setting-edit" onClick={() => setEditing(true)}>
                  编辑
                </button>
              )}
            </div>
          </div>
        </section>
      </section>
    </div>
  )
}
