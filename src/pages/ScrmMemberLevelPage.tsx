import { useState } from 'react'
import './ScrmMemberLevelPage.css'

type LevelDialogMode = 'create' | 'edit'

const upgradeRules = [
  '用户总计成功预订的房源次数（指用户消费成功，且无退款的订单次数）',
  '用户总计成功预订的天数（指用户消费成功，且无退款的订单内累计的住宿天数）',
  '用户总计成功预订的次数与天数总和',
]

function LevelDialog({
  mode,
  onClose,
}: {
  mode: LevelDialogMode
  onClose: () => void
}) {
  const isEdit = mode === 'edit'
  const title = isEdit ? '编辑会员等级' : '新增会员等级'

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

        <form className="scrm-member-form">
          <label className="scrm-member-field scrm-member-field--required">
            <span>等级名称：</span>
            <input placeholder="请输入等级名称" defaultValue={isEdit ? '普通会员' : ''} />
          </label>

          <label className="scrm-member-field">
            <span>会员等级：</span>
            <input className="is-short" value={isEdit ? '1' : '2'} disabled readOnly />
          </label>

          <div className="scrm-member-field scrm-member-inline-field">
            <span>免费升级条件：</span>
            <input className="is-short" value="0" readOnly />
            <em>次消费，或</em>
            <input className="is-short" value="0" readOnly />
            <em>天</em>
          </div>

          <div className="scrm-member-field scrm-member-inline-field scrm-member-discount-row">
            <span>会员折扣：</span>
            <em>房源</em>
            <input className="is-short" value="1" readOnly />
            <em>折，商品</em>
            <input className="is-short" value="1" readOnly />
            <em>折</em>
            <small>折扣请输入1-10</small>
          </div>

          <div className="scrm-member-field">
            <span>会员卡面：</span>
            <button type="button" className="scrm-member-card-swatch" aria-label="会员卡面颜色">
              <i style={{ backgroundColor: isEdit ? '#d3d3d3' : '#d7b48e' }} />
            </button>
          </div>

          <label className="scrm-member-field">
            <span>会员权益：</span>
            <input placeholder="请选择会员权益" readOnly />
          </label>
        </form>

        <footer className="scrm-member-modal__footer">
          <button type="button" className="scrm-member-ghost-button" onClick={onClose}>
            取 消
          </button>
          <button type="button" className="scrm-member-primary-button">
            提 交
          </button>
        </footer>
      </section>
    </div>
  )
}

function UpgradeSettingsDrawer({ onClose }: { onClose: () => void }) {
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
              {upgradeRules.map((rule, index) => (
                <label key={rule} className="scrm-member-radio">
                  <input
                    type="radio"
                    name="member-upgrade-rule"
                    defaultChecked={index === upgradeRules.length - 1}
                  />
                  <span>{rule}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

export function ScrmMemberLevelPage() {
  const [dialogMode, setDialogMode] = useState<LevelDialogMode | null>(null)
  const [showUpgradeDrawer, setShowUpgradeDrawer] = useState(false)

  return (
    <div className="scrm-member-level-page">
      <section className="scrm-member-level-panel">
        <header className="scrm-member-level-panel__header">
          <div className="scrm-member-title">
            <h1>会员等级列表</h1>
            <p>最多只可以设置值8个等级，建议3-6个等级即可</p>
          </div>
          <div className="scrm-member-actions">
            <button type="button" onClick={() => setDialogMode('create')}>
              新建会员等级
            </button>
            <button type="button" onClick={() => setShowUpgradeDrawer(true)}>
              会员升级设置
            </button>
          </div>
        </header>

        <table className="scrm-member-table" aria-label="会员等级列表">
          <thead>
            <tr>
              <th>会员等级</th>
              <th>等级名称</th>
              <th>免费升级条件</th>
              <th>会员折扣</th>
              <th>会员权益</th>
              <th>会员卡面</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>等级1</td>
              <td>普通会员</td>
              <td>无门槛</td>
              <td>-</td>
              <td>-</td>
              <td>
                <span className="scrm-member-card-preview" aria-label="会员卡面 #d3d3d3">
                  <i />
                </span>
              </td>
              <td>
                <button type="button" className="scrm-member-link-button" onClick={() => setDialogMode('edit')}>
                  编辑
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {dialogMode ? <LevelDialog mode={dialogMode} onClose={() => setDialogMode(null)} /> : null}
      {showUpgradeDrawer ? <UpgradeSettingsDrawer onClose={() => setShowUpgradeDrawer(false)} /> : null}
    </div>
  )
}
