import { useState } from 'react'
import './SmartHotelGlobalSettingPage.css'

type SettingTab = 'rules' | 'guide' | 'wifi'

interface SwitchControlProps {
  label: string
  checked: boolean
  onChange: () => void
}

const flowSteps = [
  { step: '步骤1', title: '进入智住小程序' },
  { step: '步骤2', title: '办理登记' },
  { step: '步骤3', title: '查看门锁密码' },
  { step: '步骤4(可选)', title: '在线续住' },
]

export function SmartHotelGlobalSettingPage() {
  const [activeTab, setActiveTab] = useState<SettingTab>('rules')
  const [autoInvite, setAutoInvite] = useState(false)
  const [deposit, setDeposit] = useState(false)
  const [guestStatus, setGuestStatus] = useState(false)
  const [dirtyRoomBlock, setDirtyRoomBlock] = useState(false)
  const [earlyPassword, setEarlyPassword] = useState(false)
  const [saved, setSaved] = useState(false)

  function changeTab(tab: SettingTab) {
    setSaved(false)
    setActiveTab(tab)
  }

  return (
    <div className="smart-global-page">
      <h1 className="sr-only-heading">全局设置</h1>
      <span className="smart-global-version">版本号：v4.10.7</span>

      <section className="smart-global-shell" aria-label="全局设置">
        <div className="smart-global-tabs" role="tablist" aria-label="全局设置页签">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'rules'}
            className={activeTab === 'rules' ? 'is-active' : ''}
            onClick={() => changeTab('rules')}
          >
            入住规则
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'guide'}
            className={activeTab === 'guide' ? 'is-active' : ''}
            onClick={() => changeTab('guide')}
          >
            入住指引
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'wifi'}
            className={activeTab === 'wifi' ? 'is-active' : ''}
            onClick={() => changeTab('wifi')}
          >
            WIFI上网
          </button>
        </div>

        {activeTab === 'rules' ? (
          <div className="smart-global-rule-layout">
            <div className="smart-global-rule-main">
              <div className="smart-global-alert">云端入住登记模式为「仅发送门锁密码」，该模式下无需配置。</div>

              <section className="smart-global-section">
                <h2>入住登记方式</h2>
                <SettingLine label="自动发送入住邀请">
                  <SwitchControl label="自动发送入住邀请" checked={autoInvite} onChange={() => setAutoInvite((value) => !value)} />
                  <span className="smart-global-muted">下单或修改手机号后，自动发送入住登记邀请（虚拟号码需手动发送）</span>
                </SettingLine>
              </section>

              <section className="smart-global-section">
                <h2>身份验证方式</h2>
                <div className="smart-global-field-row">
                  <span className="smart-global-label">线上验证身份/预登记:</span>
                  <div className="smart-global-radio-stack">
                    <RadioLine selected title="公安系统实名认证">
                      <span>剩余核验次数:</span>
                      <strong>5次</strong>
                      <button type="button" className="smart-global-small-action">
                        充值
                      </button>
                      <p>填写姓名、身份证号码，公安系统实名认证比对核验成功，即可获得入住权限（密码）</p>
                    </RadioLine>
                    <RadioLine title="上传证件正反面，即可获取入住权限（密码）" />
                    <RadioLine title="不登记，进入智住即可获取入住权限（密码）" />
                  </div>
                </div>
                <div className="smart-global-field-row">
                  <span className="smart-global-label">登记要求:</span>
                  <div className="smart-global-radio-stack is-compact">
                    <RadioLine selected title="至少登记1人">
                      <span className="smart-global-tag">推荐</span>
                    </RadioLine>
                    <RadioLine title="按住宿订单要求，登记全部入住人" />
                  </div>
                </div>
              </section>

              <section className="smart-global-section">
                <h2>押金</h2>
                <SettingLine label="收押金">
                  <SwitchControl label="收押金" checked={deposit} onChange={() => setDeposit((value) => !value)} />
                  <span className="smart-global-muted">押金将在办理退房当日20:00自动退还</span>
                </SettingLine>
              </section>

              <section className="smart-global-section">
                <h2>入住状态</h2>
                <SettingLine label="房客变更入住状态">
                  <SwitchControl
                    label="房客变更入住状态"
                    checked={guestStatus}
                    onChange={() => setGuestStatus((value) => !value)}
                  />
                  <span className="smart-global-muted">开启后，房客可办理入住、办理退房，同时会更新订单的入住状态。</span>
                </SettingLine>
                <SettingLine label="脏房不允许入住">
                  <SwitchControl
                    label="脏房不允许入住"
                    checked={dirtyRoomBlock}
                    onChange={() => setDirtyRoomBlock((value) => !value)}
                  />
                  <span className="smart-global-muted">开启后，房间为脏房时，房客不可办理入住或查看密码</span>
                </SettingLine>
              </section>

              <section className="smart-global-section">
                <h2>门锁密码</h2>
                <div className="smart-global-field-row">
                  <span className="smart-global-label">门锁密码:</span>
                  <div className="smart-global-radio-stack">
                    <RadioLine selected title="所有房源统一密码有效时间">
                      <div className="smart-global-time-grid">
                        <label>
                          入住当天:
                          <input value="14:00" readOnly />
                        </label>
                        <label>
                          退房当天:
                          <input value="12:00" readOnly />
                        </label>
                      </div>
                    </RadioLine>
                    <RadioLine title="按房型设置的可入住时间（以该房型最早入住时间、最晚退房时间为准）">
                      <p>如房型未设置时间，将默认使用统一有效时间；如需设置，可前往房型信息</p>
                    </RadioLine>
                  </div>
                </div>
                <SettingLine label="提前入住生成密码">
                  <SwitchControl
                    label="提前入住生成密码"
                    checked={earlyPassword}
                    onChange={() => setEarlyPassword((value) => !value)}
                  />
                  <span className="smart-global-muted">开启后，房客在入住日提前办理入住时，将按实际入住时间生成并展示门锁密码。</span>
                </SettingLine>
                <div className="smart-global-field-row smart-global-field-row--sms">
                  <span className="smart-global-label">短信发送密码</span>
                  <div className="smart-global-radio-stack">
                    <RadioLine selected title="仅发送密码">
                      <p>短信示例: 您入住的房间{'{房源名称}'}${'{房间号}'}，门锁密码:{'{密码}'}#</p>
                    </RadioLine>
                    <RadioLine title="同时发送密码短信和智能入住小程序链接，方便用户返回小程序">
                      <p>
                        短信示例:您入住的房间{'{房源名称}'}${'{房间号}'}，门锁密码:{'{密码}'}#，点击{'{小程序跳转短链接}'}查看入住指引。
                      </p>
                    </RadioLine>
                  </div>
                </div>
              </section>
            </div>

            <GuestFlowPanel />
          </div>
        ) : null}

        {activeTab === 'guide' ? <GuidePanel /> : null}
        {activeTab === 'wifi' ? <WifiPanel /> : null}

        <footer className="smart-global-footer">
          {saved ? <span role="status">已保存全局设置</span> : null}
          <button type="button" onClick={() => setSaved(true)}>
            保 存
          </button>
        </footer>
      </section>
    </div>
  )
}

function SettingLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="smart-global-setting-line">
      <span className="smart-global-label">{label}:</span>
      <div>{children}</div>
    </div>
  )
}

function SwitchControl({ label, checked, onChange }: SwitchControlProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-label={label}
      aria-checked={checked}
      className={`smart-global-switch${checked ? ' is-on' : ''}`}
      onClick={onChange}
    >
      <span />
    </button>
  )
}

function RadioLine({ selected, title, children }: { selected?: boolean; title: string; children?: React.ReactNode }) {
  return (
    <label className={`smart-global-radio-line${selected ? ' is-selected' : ''}`}>
      <input type="radio" checked={Boolean(selected)} readOnly />
      <span>
        <strong>{title}</strong>
        {children ? <span className="smart-global-radio-extra">{children}</span> : null}
      </span>
    </label>
  )
}

function GuestFlowPanel() {
  return (
    <aside className="smart-global-flow" aria-label="房客入住流程">
      <h2>房客入住流程</h2>
      <div className="smart-global-flow__steps">
        {flowSteps.map((step) => (
          <article key={step.step} className="smart-global-flow-step">
            <span>{step.step}</span>
            <strong>{step.title}</strong>
          </article>
        ))}
      </div>
    </aside>
  )
}

function GuidePanel() {
  return (
    <div className="smart-global-subpanel" aria-label="入住指引设置">
      <h2>入住指引</h2>
      <div className="smart-global-guide-grid">
        <label>
          入住须知
          <textarea defaultValue="请确认订单信息，完成身份登记后查看门锁密码。" />
        </label>
        <label>
          到店指引
          <textarea defaultValue="到店后进入智住小程序，按页面提示办理登记。" />
        </label>
        <label>
          续住说明
          <textarea defaultValue="如需续住，可在智住小程序发起续住申请。" />
        </label>
      </div>
    </div>
  )
}

function WifiPanel() {
  return (
    <div className="smart-global-subpanel" aria-label="WIFI上网设置">
      <h2>WIFI上网</h2>
      <div className="smart-global-wifi-form">
        <label>
          WIFI名称
          <input aria-label="WIFI名称" defaultValue="Locals-Guest" />
        </label>
        <label>
          WIFI密码
          <input aria-label="WIFI密码" defaultValue="locals8888" />
        </label>
        <label>
          上网说明
          <textarea defaultValue="房客可在智住小程序中查看 WIFI 名称与密码。" />
        </label>
      </div>
    </div>
  )
}
